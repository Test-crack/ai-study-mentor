"use client";
// Standalone diagnostic viva (Spoken English & future viva exams). Record-and-submit:
// the student records one answer per prompt, reviews, then submits all at once. Prompts
// and the exam's scale come from the backend (GET /api/diagnostic/viva/prompts), so this
// page is exam-agnostic — it renders whatever prompt set the student's exam serves.
import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { callBackend, uploadFileToBackend } from "@/features/auth/services/authClient";
import {
  Mic, Square, Play, Pause, RotateCcw, ArrowRight, ArrowLeft, CheckCircle2,
  AlertTriangle, Loader2, Volume2, Trophy,
} from "lucide-react";
import { cn } from "@/shared/utils";

// ─── Types ──────────────────────────────────────────────────────────────────
interface VivaPrompt {
  id: string;
  order: number;
  type: string;
  isWarmup: boolean;
  text: string;
  prepSeconds: number;
  speakSeconds: number;
  listenAssetUrl: string | null;
  passage?: string | null;   // read-aloud passage the student reads
}

interface SubskillRow { id: string; label: string; level: string; score: number; }
interface VivaResult {
  status: "scored" | "withheld";
  cefrLevel?: string;
  cefrLabel?: string;
  meanScore?: number;
  subskillProfile?: SubskillRow[];
  feedback?: Array<{ promptId: string; strengths: string; improvements: string }>;
  scoredPromptCount?: number;
  noResponseCount?: number;
}

type Phase = "loading" | "intro" | "running" | "review" | "submitting" | "result" | "error";
type RecState = "idle" | "recording" | "recorded";

const fmt = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;

// ─── Component ────────────────────────────────────────────────────────────────
const VivaDiagnostic = () => {
  const { profile } = useAuth();
  const navigate = useNavigate();

  const [phase, setPhase] = useState<Phase>("loading");
  const [prompts, setPrompts] = useState<VivaPrompt[]>([]);
  const [idx, setIdx] = useState(0);
  const [recordings, setRecordings] = useState<Record<string, Blob>>({});
  const [result, setResult] = useState<VivaResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [recState, setRecState] = useState<RecState>("idle");
  const [remaining, setRemaining] = useState(0);   // countdown while recording
  const [playing, setPlaying] = useState(false);

  const mrRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const current = prompts[idx];
  const currentBlob = current ? recordings[current.id] : undefined;
  const allRecorded = prompts.length > 0 && prompts.every((p) => recordings[p.id]);

  // ── Load prompts (already-diagnosed students are bounced to the dashboard) ──
  useEffect(() => {
    if (profile && profile.isDiagnosed) { navigate("/student/dashboard", { replace: true }); return; }
    let cancelled = false;
    (async () => {
      try {
        const data = await callBackend("/api/diagnostic/viva/prompts", { method: "GET" });
        if (cancelled) return;
        setPrompts(data.prompts ?? []);
        setPhase("intro");
      } catch (e: any) {
        if (cancelled) return;
        setError(e?.responseData?.message || "Could not load the diagnostic. Please try again.");
        setPhase("error");
      }
    })();
    return () => { cancelled = true; };
  }, [profile, navigate]);

  // ── Teardown on unmount ──
  useEffect(() => () => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (mrRef.current) mrRef.current.onstop = null;
    streamRef.current?.getTracks().forEach((t) => t.stop());
  }, []);

  const stopTimer = () => { if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; } };

  const stopRecording = useCallback(() => {
    if (mrRef.current && mrRef.current.state !== "inactive") mrRef.current.stop();
    stopTimer();
  }, []);

  const startRecording = async () => {
    if (!current) return;
    setError(null);
    setPlaying(false);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      const mimeType = MediaRecorder.isTypeSupported("audio/webm") ? "audio/webm" : "audio/mp4";
      const mr = new MediaRecorder(stream, { mimeType });
      mrRef.current = mr;
      chunksRef.current = [];

      mr.ondataavailable = (e) => { if (e.data.size > 0) chunksRef.current.push(e.data); };
      mr.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: mimeType });
        setRecordings((r) => ({ ...r, [current.id]: blob }));
        setRecState("recorded");
        stream.getTracks().forEach((t) => t.stop());
        streamRef.current = null;
      };

      mr.start(250);
      setRecState("recording");
      // Hard speak limit — auto-stop when the window elapses.
      setRemaining(current.speakSeconds);
      timerRef.current = setInterval(() => {
        setRemaining((s) => {
          if (s <= 1) { stopRecording(); return 0; }
          return s - 1;
        });
      }, 1000);
    } catch {
      setError("Microphone access denied. Please allow microphone access and try again.");
    }
  };

  const reRecord = () => {
    if (!current) return;
    setRecordings((r) => { const next = { ...r }; delete next[current.id]; return next; });
    setRecState("idle");
    setPlaying(false);
  };

  const togglePlay = () => {
    if (!currentBlob) return;
    if (!audioRef.current) return;
    if (playing) { audioRef.current.pause(); setPlaying(false); }
    else { audioRef.current.play(); setPlaying(true); }
  };

  const goToPrompt = (i: number) => {
    stopRecording();
    setIdx(i);
    setRecState(recordings[prompts[i]?.id] ? "recorded" : "idle");
    setRemaining(0);
    setPlaying(false);
  };

  const submitAll = async () => {
    setPhase("submitting");
    setError(null);
    const fd = new FormData();
    const ext = MediaRecorder.isTypeSupported("audio/webm") ? "webm" : "mp4";
    for (const p of prompts) {
      const blob = recordings[p.id];
      if (blob) fd.append(p.id, blob, `${p.id}.${ext}`);
    }
    try {
      const data = await uploadFileToBackend("/api/diagnostic/viva/submit", fd, "POST");
      setResult(data.result as VivaResult);
      setPhase("result");
    } catch (e: any) {
      const code = e?.statusCode;
      if (code === 422) {
        // Withheld (too many silent/empty answers) or incomplete — allow a retake.
        setError(e?.responseData?.message || "Diagnostic incomplete — please record your answers again.");
      } else {
        setError(e?.responseData?.message || "Submission failed. Please try again.");
      }
      setPhase("review");
    }
  };

  // ── Render ──────────────────────────────────────────────────────────────────
  if (phase === "loading") {
    return <Centered><Loader2 className="h-8 w-8 animate-spin text-brand-teal-600" /><p className="mt-3 text-brand-text-mute">Loading your diagnostic…</p></Centered>;
  }

  if (phase === "error") {
    return (
      <Centered>
        <AlertTriangle className="h-10 w-10 text-amber-500" />
        <p className="mt-3 max-w-sm text-center text-brand-text">{error}</p>
        <button onClick={() => navigate("/student/dashboard")} className="mt-5 rounded-xl bg-brand-teal-600 px-5 py-2.5 font-semibold text-white hover:bg-brand-teal-700">Back to dashboard</button>
      </Centered>
    );
  }

  if (phase === "intro") {
    return (
      <Shell>
        <div className="mx-auto max-w-xl text-center">
          <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-brand-teal-100 border border-brand-teal-200">
            <Mic className="h-8 w-8 text-brand-teal-600" />
          </div>
          <h1 className="font-dm text-2xl font-bold tracking-tight text-brand-text">Speaking diagnostic{profile?.examLabel ? ` — ${profile.examLabel}` : ""}</h1>
          <p className="mx-auto mt-3 max-w-md text-[15px] leading-relaxed text-brand-text-mute">
            You'll answer <strong>{prompts.length} short prompts</strong> by recording your voice. Speak naturally — there's no single right answer. You can re-record any prompt before you submit.
          </p>
          <ul className="mx-auto mt-6 max-w-sm space-y-2 text-left text-sm text-brand-text-mute">
            <li className="flex gap-2"><CheckCircle2 className="h-4 w-4 shrink-0 text-brand-teal-600" /> Each prompt has a speaking time limit; recording stops automatically.</li>
            <li className="flex gap-2"><CheckCircle2 className="h-4 w-4 shrink-0 text-brand-teal-600" /> Find a quiet spot and allow microphone access when asked.</li>
            <li className="flex gap-2"><CheckCircle2 className="h-4 w-4 shrink-0 text-brand-teal-600" /> This is a one-time diagnostic.</li>
          </ul>
          <button onClick={() => { setPhase("running"); goToPrompt(0); }} className="mt-8 inline-flex items-center gap-2 rounded-xl bg-brand-teal-600 px-6 py-3 font-semibold text-white hover:bg-brand-teal-700">
            Start <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      </Shell>
    );
  }

  if (phase === "result" && result) {
    return (
      <Shell>
        <div className="mx-auto max-w-xl">
          {result.status === "withheld" ? (
            <div className="text-center">
              <AlertTriangle className="mx-auto h-12 w-12 text-amber-500" />
              <h1 className="mt-3 font-dm text-2xl font-bold text-brand-text">Diagnostic incomplete</h1>
              <p className="mx-auto mt-2 max-w-md text-brand-text-mute">We couldn't score enough of your answers. Please retake the diagnostic and speak for each prompt.</p>
              <button onClick={() => window.location.reload()} className="mt-6 rounded-xl bg-brand-teal-600 px-5 py-2.5 font-semibold text-white hover:bg-brand-teal-700">Retake</button>
            </div>
          ) : (
            <>
              <div className="text-center">
                <Trophy className="mx-auto h-12 w-12 text-brand-mint" />
                <h1 className="mt-3 font-dm text-2xl font-bold text-brand-text">Your level: {result.cefrLabel}</h1>
                <p className="mt-1 text-brand-text-mute">Based on {result.scoredPromptCount} graded {result.scoredPromptCount === 1 ? "answer" : "answers"}.</p>
              </div>
              {result.subskillProfile && (
                <div className="mt-6 space-y-2">
                  {result.subskillProfile.map((s) => (
                    <div key={s.id} className="flex items-center justify-between rounded-xl border border-brand-line bg-brand-bg-alt px-4 py-2.5">
                      <span className="text-sm font-medium text-brand-text">{s.label}</span>
                      <span className="font-jetbrains text-xs font-bold uppercase text-brand-teal-700">{s.level}</span>
                    </div>
                  ))}
                </div>
              )}
              <button onClick={() => navigate("/student/dashboard", { replace: true })} className="mt-8 w-full rounded-xl bg-brand-teal-600 px-5 py-3 font-semibold text-white hover:bg-brand-teal-700">Go to dashboard</button>
            </>
          )}
        </div>
      </Shell>
    );
  }

  if (phase === "submitting") {
    return <Centered><Loader2 className="h-8 w-8 animate-spin text-brand-teal-600" /><p className="mt-3 text-brand-text-mute">Scoring your answers — this can take a moment…</p></Centered>;
  }

  // review + running share the recorder shell; review just shows the submit panel.
  return (
    <Shell>
      {/* progress */}
      <div className="mx-auto mb-6 flex max-w-2xl flex-wrap items-center gap-1.5">
        {prompts.map((p, i) => (
          <button
            key={p.id}
            onClick={() => { setPhase("running"); goToPrompt(i); }}
            className={cn(
              "h-2 flex-1 min-w-[16px] rounded-full transition-colors",
              recordings[p.id] ? "bg-brand-teal-500" : i === idx && phase === "running" ? "bg-brand-teal-300" : "bg-brand-line",
            )}
            aria-label={`Prompt ${p.order}`}
          />
        ))}
      </div>

      {phase === "review" ? (
        <div className="mx-auto max-w-xl">
          <h1 className="font-dm text-2xl font-bold text-brand-text">Review &amp; submit</h1>
          <p className="mt-1 text-brand-text-mute">{Object.keys(recordings).length} of {prompts.length} prompts recorded.</p>
          {error && <Banner>{error}</Banner>}
          <div className="mt-5 space-y-2">
            {prompts.map((p, i) => (
              <button key={p.id} onClick={() => { setPhase("running"); goToPrompt(i); }} className="flex w-full items-center justify-between rounded-xl border border-brand-line bg-brand-bg-alt px-4 py-3 text-left hover:border-brand-teal-300">
                <span className="flex items-center gap-3 min-w-0">
                  <span className="font-jetbrains text-xs font-bold text-brand-text-mute">{p.order}</span>
                  <span className="truncate text-sm text-brand-text">{p.text}</span>
                </span>
                {recordings[p.id]
                  ? <CheckCircle2 className="h-5 w-5 shrink-0 text-brand-teal-600" />
                  : <span className="shrink-0 rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-semibold text-amber-700">missing</span>}
              </button>
            ))}
          </div>
          <button
            disabled={!allRecorded}
            onClick={submitAll}
            className={cn("mt-6 w-full rounded-xl px-5 py-3 font-semibold text-white", allRecorded ? "bg-brand-teal-600 hover:bg-brand-teal-700" : "cursor-not-allowed bg-brand-line")}
          >
            {allRecorded ? "Submit diagnostic" : "Record every prompt to submit"}
          </button>
        </div>
      ) : current ? (
        <div className="mx-auto max-w-xl">
          <div className="mb-3 flex items-center justify-between">
            <span className="rounded-full bg-brand-teal-100 px-3 py-1 text-[11px] font-bold uppercase tracking-wide text-brand-teal-700">{current.type}</span>
            <span className="font-jetbrains text-xs text-brand-text-mute">Prompt {current.order} / {prompts.length}</span>
          </div>

          <p className="font-dm text-xl font-semibold leading-relaxed text-brand-text">{current.text}</p>

          {/* Read-aloud passage — the text the student reads out */}
          {current.passage && (
            <div className="mt-4 rounded-xl border border-brand-teal-200 bg-brand-teal-50/60 px-5 py-4">
              <p className="mb-1 font-jetbrains text-[10px] uppercase tracking-[0.16em] text-brand-teal-700">Read this aloud</p>
              <p className="text-[17px] leading-relaxed text-brand-text">{current.passage}</p>
            </div>
          )}

          {/* Prompt 6-style listen asset (reply-to-a-voice-message) */}
          {current.listenAssetUrl !== null && (
            current.listenAssetUrl
              ? (
                <div className="mt-4 flex items-center gap-3 rounded-xl border border-brand-line bg-brand-bg-alt px-4 py-3">
                  <Volume2 className="h-5 w-5 text-brand-teal-600" />
                  <audio controls src={current.listenAssetUrl} className="w-full" />
                </div>
              )
              : (
                <p className="mt-3 flex items-center gap-2 text-sm text-amber-600"><AlertTriangle className="h-4 w-4" /> Voice message audio is being prepared — you can still record your reply.</p>
              )
          )}

          <p className="mt-2 text-sm text-brand-text-mute">Speaking limit: {fmt(current.speakSeconds)}{current.prepSeconds ? ` · ${current.prepSeconds}s to think first` : ""}</p>

          {error && <Banner>{error}</Banner>}

          {/* recorder controls */}
          <div className="mt-6 flex flex-col items-center gap-4 rounded-2xl border border-brand-line bg-brand-bg-alt p-6">
            {recState === "recording" ? (
              <>
                <div className="flex items-center gap-2 text-rose-600"><span className="h-2.5 w-2.5 animate-pulse rounded-full bg-rose-600" /><span className="font-jetbrains text-sm font-bold">Recording · {fmt(remaining)} left</span></div>
                <button onClick={stopRecording} className="inline-flex items-center gap-2 rounded-xl bg-rose-600 px-6 py-3 font-semibold text-white hover:bg-rose-700"><Square className="h-4 w-4" /> Stop</button>
              </>
            ) : currentBlob ? (
              <>
                {currentBlob && <audio ref={audioRef} src={URL.createObjectURL(currentBlob)} onEnded={() => setPlaying(false)} className="hidden" />}
                <div className="flex items-center gap-2 text-brand-teal-700"><CheckCircle2 className="h-5 w-5" /><span className="text-sm font-semibold">Recorded</span></div>
                <div className="flex gap-3">
                  <button onClick={togglePlay} className="inline-flex items-center gap-2 rounded-xl border border-brand-line px-4 py-2.5 font-medium text-brand-text hover:border-brand-teal-300">{playing ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}{playing ? "Pause" : "Play"}</button>
                  <button onClick={reRecord} className="inline-flex items-center gap-2 rounded-xl border border-brand-line px-4 py-2.5 font-medium text-brand-text hover:border-brand-teal-300"><RotateCcw className="h-4 w-4" /> Re-record</button>
                </div>
              </>
            ) : (
              <button onClick={startRecording} className="inline-flex items-center gap-2 rounded-xl bg-brand-teal-600 px-6 py-3 font-semibold text-white hover:bg-brand-teal-700"><Mic className="h-4 w-4" /> Record answer</button>
            )}
          </div>

          {/* nav */}
          <div className="mt-6 flex items-center justify-between">
            <button onClick={() => goToPrompt(Math.max(0, idx - 1))} disabled={idx === 0 || recState === "recording"} className={cn("inline-flex items-center gap-1.5 text-sm font-medium", idx === 0 || recState === "recording" ? "cursor-not-allowed text-brand-line" : "text-brand-text hover:text-brand-teal-700")}><ArrowLeft className="h-4 w-4" /> Back</button>
            {idx < prompts.length - 1 ? (
              <button onClick={() => goToPrompt(idx + 1)} disabled={recState === "recording"} className={cn("inline-flex items-center gap-1.5 text-sm font-semibold", recState === "recording" ? "cursor-not-allowed text-brand-line" : "text-brand-teal-700 hover:text-brand-teal-800")}>Next <ArrowRight className="h-4 w-4" /></button>
            ) : (
              <button onClick={() => { stopRecording(); setPhase("review"); }} disabled={recState === "recording"} className={cn("inline-flex items-center gap-1.5 text-sm font-semibold", recState === "recording" ? "cursor-not-allowed text-brand-line" : "text-brand-teal-700 hover:text-brand-teal-800")}>Review <ArrowRight className="h-4 w-4" /></button>
            )}
          </div>
        </div>
      ) : null}
    </Shell>
  );
};

// ─── Layout helpers ───────────────────────────────────────────────────────────
const Shell = ({ children }: { children: React.ReactNode }) => (
  <div className="min-h-screen bg-brand-bg px-4 py-10 font-dm sm:px-6 lg:px-8">{children}</div>
);
const Centered = ({ children }: { children: React.ReactNode }) => (
  <div className="flex min-h-screen flex-col items-center justify-center bg-brand-bg font-dm">{children}</div>
);
const Banner = ({ children }: { children: React.ReactNode }) => (
  <div className="mt-4 flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800"><AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />{children}</div>
);

export default VivaDiagnostic;
