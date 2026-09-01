"use client";
// Standalone diagnostic viva (Spoken English & future viva exams). Record-and-submit:
// the student records one answer per prompt, reviews, then submits all at once. Prompts
// and the exam's scale come from the backend (GET /api/diagnostic/viva/prompts), so this
// page is exam-agnostic — it renders whatever prompt set the student's exam serves.
//
// Shell/visual language (TopNavBar, dot-grid backdrop, ink progress pill, dark score
// hero) matches the platform's other diagnostic (Diagnosis.tsx) — same conventions,
// no functional differences from the previous version of this page.
import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { callBackend, uploadFileToBackend } from "@/features/auth/services/authClient";
import { cacheGetAll, cacheSet, cacheDelete, cacheClear } from "./vivaRecordingCache";
import testcrackLogo from "@/assets/testcrack-logo.svg";
import {
  Mic, Square, RotateCcw, ArrowRight, ArrowLeft, CheckCircle2,
  AlertTriangle, Loader2, Volume2, Trophy, LogOut,
} from "lucide-react";
import { cn } from "@/shared/utils";

// ─── Types ──────────────────────────────────────────────────────────────────
interface VivaPrompt {
  id: string;
  order: number;
  type: string;
  isWarmup: boolean;
  display: "audio" | "text";      // 'audio' → listen to the question; 'text' → read the passage aloud
  audioUrl: string | null;        // question audio (audio prompts), replayable
  passage: string | null;         // read-aloud passage (text prompts)
  prepSeconds: number;
  speakSeconds: number;
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
  const [examId, setExamId] = useState<string>("spoken_english");
  const [idx, setIdx] = useState(0);
  const [recordings, setRecordings] = useState<Record<string, Blob>>({});
  const [result, setResult] = useState<VivaResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [recState, setRecState] = useState<RecState>("idle");
  const [remaining, setRemaining] = useState(0);   // countdown while recording

  const mrRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const current = prompts[idx];
  const currentBlob = current ? recordings[current.id] : undefined;
  const allRecorded = prompts.length > 0 && prompts.every((p) => recordings[p.id]);

  // Stable object URL per recording — recreating it every render (as before) made the
  // <audio> reload to 0 on the Play re-render, so playback never started.
  const currentUrl = useMemo(() => (currentBlob ? URL.createObjectURL(currentBlob) : null), [currentBlob]);
  useEffect(() => () => { if (currentUrl) URL.revokeObjectURL(currentUrl); }, [currentUrl]);

  // ── Load prompts (already-diagnosed students are bounced to the dashboard) ──
  useEffect(() => {
    if (profile && profile.isDiagnosed) { navigate("/student/dashboard", { replace: true }); return; }
    let cancelled = false;
    (async () => {
      try {
        const data = await callBackend("/api/diagnostic/viva/prompts", { method: "GET" });
        if (cancelled) return;
        const ex = data.examId ?? profile?.examId ?? "spoken_english";
        setExamId(ex);
        setPrompts(data.prompts ?? []);
        // Restore any recordings cached client-side so a refresh doesn't lose them.
        const cached = await cacheGetAll(ex);
        if (!cancelled && Object.keys(cached).length) setRecordings(cached);
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
        cacheSet(examId, current.id, blob);   // persist client-side (survives refresh)
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
    cacheDelete(examId, current.id);
    setRecState("idle");
  };

  const goToPrompt = (i: number) => {
    stopRecording();
    setIdx(i);
    setRecState(recordings[prompts[i]?.id] ? "recorded" : "idle");
    setRemaining(0);
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
      cacheClear(examId);   // diagnostic is done — drop the client-side cache
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
    return <Centered><Loader2 className="h-8 w-8 animate-spin text-brand-teal-700" /><p className="mt-3 text-brand-text-mute">Loading your diagnostic…</p></Centered>;
  }

  if (phase === "error") {
    return (
      <Centered>
        <AlertTriangle className="h-10 w-10 text-brand-warm" />
        <p className="mt-3 max-w-sm text-center text-brand-text">{error}</p>
        <button onClick={() => navigate("/student/dashboard")} className="mt-5 rounded-xl bg-brand-teal-700 px-5 py-2.5 font-semibold text-white hover:bg-brand-teal-600">Back to dashboard</button>
      </Centered>
    );
  }

  if (phase === "intro") {
    return (
      <Shell>
        <div className="mx-auto max-w-xl text-center">
          <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-brand-teal-50 border border-brand-teal-200">
            <Mic className="h-8 w-8 text-brand-teal-700" />
          </div>
          <h1 className="font-manrope text-2xl font-extrabold tracking-[-0.02em] text-brand-text">Speaking diagnostic{profile?.examLabel ? ` — ${profile.examLabel}` : ""}</h1>
          <p className="mx-auto mt-3 max-w-md text-[15px] leading-relaxed text-brand-text-mute">
            You'll answer <strong>{prompts.length} short prompts</strong> by recording your voice. Speak naturally — there's no single right answer. You can re-record any prompt before you submit.
          </p>
          <ul className="mx-auto mt-6 max-w-sm space-y-2 text-left text-sm text-brand-text-mute">
            <li className="flex gap-2"><CheckCircle2 className="h-4 w-4 shrink-0 text-brand-teal-700" /> Each prompt has a speaking time limit; recording stops automatically.</li>
            <li className="flex gap-2"><CheckCircle2 className="h-4 w-4 shrink-0 text-brand-teal-700" /> Find a quiet spot and allow microphone access when asked.</li>
            <li className="flex gap-2"><CheckCircle2 className="h-4 w-4 shrink-0 text-brand-teal-700" /> This is a one-time diagnostic.</li>
          </ul>
          <button onClick={() => { setPhase("running"); goToPrompt(0); }} className="mt-8 inline-flex items-center gap-2 rounded-xl bg-brand-teal-700 px-6 py-3 font-semibold text-white hover:bg-brand-teal-600">
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
              <AlertTriangle className="mx-auto h-12 w-12 text-brand-warm" />
              <h1 className="mt-3 font-manrope text-2xl font-extrabold tracking-[-0.02em] text-brand-text">Diagnostic incomplete</h1>
              <p className="mx-auto mt-2 max-w-md text-brand-text-mute">We couldn't score enough of your answers. Please retake the diagnostic and speak for each prompt.</p>
              <button onClick={() => window.location.reload()} className="mt-6 rounded-xl bg-brand-teal-700 px-5 py-2.5 font-semibold text-white hover:bg-brand-teal-600">Retake</button>
            </div>
          ) : (
            <div className="flex flex-col items-center text-center gap-6 py-4">
              {/* Score hero — dark surface with mint score, mirrors the skill-complete
                  cards on the other diagnostic. */}
              <div className="relative w-full overflow-hidden rounded-2xl border border-brand-line-12 bg-brand-ink px-6 py-8">
                <div
                  aria-hidden="true"
                  className="pointer-events-none absolute inset-0 opacity-[0.06]"
                  style={{
                    backgroundImage:
                      'linear-gradient(to right, #3EE0A0 1px, transparent 1px), linear-gradient(to bottom, #3EE0A0 1px, transparent 1px)',
                    backgroundSize: '48px 48px',
                  }}
                />
                <div className="relative flex flex-col items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-white/10 border border-brand-line-12 flex items-center justify-center">
                    <Trophy className="h-6 w-6 text-brand-mint" />
                  </div>
                  <p className="font-jetbrains text-brand-mint text-[10.5px] uppercase tracking-[0.18em]">
                    Speaking · Diagnostic Complete
                  </p>
                  <div className="font-manrope text-[56px] font-extrabold text-brand-mint tabular-nums leading-none tracking-[-0.03em]">
                    {result.cefrLevel}
                  </div>
                  <p className="font-jetbrains text-brand-on-ink-mute text-[10.5px] uppercase tracking-[0.16em]">{result.cefrLabel}</p>
                  <p className="text-brand-on-ink text-[13px] mt-1">
                    Based on {result.scoredPromptCount} graded {result.scoredPromptCount === 1 ? "answer" : "answers"}.
                  </p>
                </div>
              </div>

              {result.subskillProfile && (
                <div className="w-full space-y-2 text-left">
                  {result.subskillProfile.map((s) => (
                    <div key={s.id} className="flex items-center justify-between rounded-xl border border-brand-line bg-white px-4 py-2.5">
                      <span className="text-sm font-medium text-brand-text">{s.label}</span>
                      <span className="inline-flex items-center gap-1.5 rounded-full border border-brand-teal-200 bg-brand-teal-50 px-2.5 py-0.5 font-jetbrains text-[10.5px] font-bold uppercase tracking-wide text-brand-teal-700">
                        <span className="h-1.5 w-1.5 rounded-full bg-brand-teal-500" />{s.level}
                      </span>
                    </div>
                  ))}
                </div>
              )}

              {/* Per-answer AI feedback: one strength + one next step, labelled by prompt. */}
              {result.feedback && result.feedback.length > 0 && (
                <div className="w-full text-left">
                  <h2 className="mb-3 font-jetbrains text-[10.5px] font-bold uppercase tracking-[0.16em] text-brand-text-mute">Your feedback</h2>
                  <div className="space-y-3">
                    {result.feedback.map((f, i) => {
                      const p = prompts.find((pp) => pp.id === f.promptId);
                      return (
                        <div key={f.promptId ?? i} className="rounded-xl border border-brand-line bg-brand-bg-alt px-4 py-3">
                          {p && <p className="mb-2 font-jetbrains text-[10px] uppercase tracking-[0.14em] text-brand-text-mute">{p.order}. {p.type}</p>}
                          {f.strengths && (
                            <p className="flex gap-2 text-sm leading-relaxed text-brand-text">
                              <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-brand-teal-700" />{f.strengths}
                            </p>
                          )}
                          {f.improvements && (
                            <p className="mt-2 flex gap-2 text-sm leading-relaxed text-brand-text">
                              <ArrowRight className="mt-0.5 h-4 w-4 shrink-0 text-brand-warm" />{f.improvements}
                            </p>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              <button onClick={() => navigate("/student/dashboard", { replace: true })} className="w-full rounded-xl bg-brand-teal-700 px-5 py-3 font-semibold text-white hover:bg-brand-teal-600">Go to dashboard</button>
            </div>
          )}
        </div>
      </Shell>
    );
  }

  if (phase === "submitting") {
    return <Centered><Loader2 className="h-8 w-8 animate-spin text-brand-teal-700" /><p className="mt-3 text-brand-text-mute">Scoring your answers — this can take a moment…</p></Centered>;
  }

  // review + running share the recorder shell; review just shows the submit panel.
  return (
    <Shell>
      {/* progress — same ink pill convention as the other diagnostic's step bar */}
      <div className="mx-auto mb-6 flex max-w-2xl justify-center">
        <div className="flex flex-wrap items-center gap-1 rounded-2xl border border-brand-line-12 bg-brand-ink-nav px-2 py-2">
          {prompts.map((p, i) => {
            const isDone = !!recordings[p.id];
            const isCurrent = i === idx && phase === "running";
            return (
              <button
                key={p.id}
                onClick={() => { setPhase("running"); goToPrompt(i); }}
                aria-label={`Prompt ${p.order}`}
                className={cn(
                  "flex items-center gap-1 px-2.5 py-1.5 rounded-xl border text-[12px] font-semibold transition-colors duration-150 font-jetbrains",
                  isDone
                    ? "bg-brand-mint/15 text-brand-mint border-brand-mint/30"
                    : isCurrent
                    ? "bg-brand-bg text-brand-ink border-transparent"
                    : "bg-transparent text-brand-on-ink-mute border-brand-line-09 hover:text-brand-on-ink"
                )}
              >
                {p.order}
                {isDone && <CheckCircle2 className="h-3 w-3" aria-hidden="true" />}
              </button>
            );
          })}
        </div>
      </div>

      <div className="bg-white border border-brand-line rounded-2xl shadow-sm p-6 md:p-8">
        {phase === "review" ? (
          <div className="mx-auto max-w-xl">
            <h1 className="font-manrope text-2xl font-extrabold tracking-[-0.02em] text-brand-text">Review &amp; submit</h1>
            <p className="mt-1 text-brand-text-mute">{Object.keys(recordings).length} of {prompts.length} prompts recorded.</p>
            {error && <Banner>{error}</Banner>}
            <div className="mt-5 space-y-2">
              {prompts.map((p, i) => (
                <button key={p.id} onClick={() => { setPhase("running"); goToPrompt(i); }} className="flex w-full items-center justify-between rounded-xl border border-brand-line bg-brand-bg-alt px-4 py-3 text-left hover:border-brand-teal-300">
                  <span className="flex items-center gap-3 min-w-0">
                    <span className="font-jetbrains text-xs font-bold text-brand-text-mute">{p.order}</span>
                    <span className="truncate text-sm text-brand-text">{p.type}{p.display === "text" ? " · read aloud" : ""}</span>
                  </span>
                  {recordings[p.id]
                    ? <CheckCircle2 className="h-5 w-5 shrink-0 text-brand-teal-700" />
                    : <span className="shrink-0 rounded-full border border-brand-warm/30 bg-brand-warm-tint px-2 py-0.5 text-[11px] font-semibold text-brand-warm">missing</span>}
                </button>
              ))}
            </div>
            <button
              disabled={!allRecorded}
              onClick={submitAll}
              className={cn("mt-6 w-full rounded-xl px-5 py-3 font-semibold text-white", allRecorded ? "bg-brand-teal-700 hover:bg-brand-teal-600" : "cursor-not-allowed bg-brand-line")}
            >
              {allRecorded ? "Submit diagnostic" : "Record every prompt to submit"}
            </button>
          </div>
        ) : current ? (
          <div className="mx-auto max-w-xl">
            <div className="mb-3 flex items-center justify-between">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-brand-teal-200 bg-brand-teal-50 px-3 py-1 font-jetbrains text-[10.5px] font-bold uppercase tracking-wide text-brand-teal-700">
                <span className="h-1.5 w-1.5 rounded-full bg-brand-teal-500" />{current.type}
              </span>
              <span className="font-jetbrains text-xs text-brand-text-mute">Prompt {current.order} / {prompts.length}</span>
            </div>

            {/* The question itself: read-aloud shows text only; everything else is audio
                only (the student listens, and can replay as often as they like). */}
            {current.display === "text" ? (
              <div className="mt-1 rounded-xl border border-brand-teal-200 bg-brand-teal-50/60 px-5 py-4">
                <p className="mb-1.5 font-jetbrains text-[10px] uppercase tracking-[0.16em] text-brand-teal-700">Read this aloud</p>
                <p className="text-[19px] leading-relaxed text-brand-text">{current.passage}</p>
              </div>
            ) : (
              <div className="mt-1 flex flex-col gap-3 rounded-xl border border-brand-line bg-brand-bg-alt px-5 py-4">
                <p className="flex items-center gap-2 text-sm font-medium text-brand-text">
                  <Volume2 className="h-4 w-4 shrink-0 text-brand-teal-700" /> Listen to the question — you can replay it as many times as you like.
                </p>
                {current.audioUrl
                  ? <audio controls src={current.audioUrl} className="w-full" />
                  : <p className="flex items-center gap-2 text-sm text-brand-warm"><AlertTriangle className="h-4 w-4" /> Question audio is unavailable — please contact support.</p>}
              </div>
            )}

            <p className="mt-3 text-sm text-brand-text-mute">Speaking limit: {fmt(current.speakSeconds)}{current.prepSeconds ? ` · ${current.prepSeconds}s to think first` : ""}</p>

            {error && <Banner>{error}</Banner>}

            {/* recorder controls */}
            <div className="mt-6 flex flex-col items-center gap-4 rounded-2xl border border-brand-line bg-brand-bg-alt p-6">
              {recState === "recording" ? (
                <>
                  <div className="flex items-center gap-2 text-brand-warm"><span className="h-2.5 w-2.5 animate-pulse rounded-full bg-brand-warm" /><span className="font-jetbrains text-sm font-bold">Recording · {fmt(remaining)} left</span></div>
                  <button onClick={stopRecording} className="inline-flex items-center gap-2 rounded-xl bg-brand-warm px-6 py-3 font-semibold text-white hover:opacity-90"><Square className="h-4 w-4" /> Stop</button>
                </>
              ) : currentBlob ? (
                <>
                  <div className="flex items-center gap-2 text-brand-teal-700"><CheckCircle2 className="h-5 w-5" /><span className="text-sm font-semibold">Recorded — play it back to check</span></div>
                  {currentUrl && <audio controls src={currentUrl} className="w-full max-w-md" />}
                  <button onClick={reRecord} className="inline-flex items-center gap-2 rounded-xl border border-brand-line px-4 py-2.5 font-medium text-brand-text hover:border-brand-teal-300"><RotateCcw className="h-4 w-4" /> Re-record</button>
                </>
              ) : (
                <button onClick={startRecording} className="inline-flex items-center gap-2 rounded-xl bg-brand-teal-700 px-6 py-3 font-semibold text-white hover:bg-brand-teal-600"><Mic className="h-4 w-4" /> Record answer</button>
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
      </div>
    </Shell>
  );
};

// ─── Layout helpers ───────────────────────────────────────────────────────────
// Matches Diagnosis.tsx's TopNavBar/shell conventions: fixed dark nav, subtle
// dot-grid backdrop, max-w-2xl content column offset below the nav.
const TopNavBar = () => {
  const { signOut } = useAuth();
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-brand-ink-nav border-b border-brand-line-12 transform-gpu">
      <div className="w-full px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center space-x-2.5">
            <img src={testcrackLogo} alt="TestCrack" className="h-9 w-9 object-contain shrink-0" />
            <span className="font-manrope text-xl font-extrabold tracking-[-0.03em] text-brand-bg">
              TestCrack
            </span>
          </div>
          <button
            onClick={() => signOut()}
            title="Your progress is saved — resume after logging back in"
            className="flex items-center gap-2 px-4 py-2 bg-transparent hover:bg-brand-wash-06 text-brand-on-ink hover:text-brand-bg text-xs font-semibold rounded-xl border border-brand-line-25 hover:border-brand-line-60 transition-colors duration-150"
          >
            <LogOut className="h-4 w-4" />
            <span className="hidden sm:inline">Log Out</span>
          </button>
        </div>
      </div>
    </nav>
  );
};

const Shell = ({ children }: { children: React.ReactNode }) => (
  <div className="min-h-screen bg-brand-bg font-plex text-brand-text antialiased">
    <TopNavBar />
    <div
      className="fixed inset-0 pointer-events-none"
      style={{
        backgroundImage: 'radial-gradient(circle, #D8E0E2 1px, transparent 1px)',
        backgroundSize: '24px 24px',
        opacity: 0.55,
      }}
    />
    <div className="relative z-10 max-w-2xl mx-auto px-4 pt-24 pb-8">
      {children}
      <p className="text-center font-jetbrains text-brand-text-mute text-[10px] mt-6 uppercase tracking-[0.16em]">
        TestCrack · Diagnostic · All responses are encrypted and secure
      </p>
    </div>
  </div>
);
const Centered = ({ children }: { children: React.ReactNode }) => (
  <div className="flex min-h-screen flex-col items-center justify-center bg-brand-bg font-plex">{children}</div>
);
const Banner = ({ children }: { children: React.ReactNode }) => (
  <div className="mt-4 flex items-start gap-2 rounded-xl border border-brand-warm/30 bg-brand-warm-tint px-4 py-3 text-sm text-brand-warm"><AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />{children}</div>
);

export default VivaDiagnostic;
