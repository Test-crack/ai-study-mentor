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
  const { profile, refreshProfile } = useAuth();
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
  // Purely decorative bar heights for the recording waveform — visual only,
  // mirrors Diagnosis.tsx's SpeakingPhase `animBars`.
  const [waveBars] = useState(() => Array.from({ length: 12 }, () => Math.random()));

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
      // The route guards (StudentDiagnosisGuard etc.) gate on profile.isDiagnosed —
      // without this refetch the cached profile still reads false and "Go to
      // dashboard" bounces the student straight back to onboarding.
      await refreshProfile();
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
    // Same 3 bullets the previous version showed, re-housed as step cards —
    // no new claims, just Diagnosis.tsx's DiagnosticGate visual structure.
    const introSteps = [
      { icon: "🎧", label: "Listen or read the prompt", desc: "Some prompts play audio, others show a passage to read aloud." },
      { icon: "🎤", label: "Record your answer", desc: "Speak naturally — each prompt has a time limit and stops automatically." },
      { icon: "✅", label: "Review & submit", desc: "Re-record any prompt before you submit. This is a one-time diagnostic." },
    ];
    return (
      <Shell>
        <div className="flex flex-col items-center text-center gap-8 max-w-xl mx-auto py-2">
          {/* Dark intro panel with faint blueprint grid, matching the platform's other diagnostic */}
          <div className="relative w-full overflow-hidden rounded-2xl border border-brand-line-12 bg-brand-ink-deep px-6 py-9">
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-0 opacity-[0.06]"
              style={{
                backgroundImage:
                  'linear-gradient(to right, #3EE0A0 1px, transparent 1px), linear-gradient(to bottom, #3EE0A0 1px, transparent 1px)',
                backgroundSize: '56px 56px',
              }}
            />
            <div className="relative space-y-4">
              <div className="inline-flex items-center gap-3">
                <span className="h-px w-6 shrink-0 bg-brand-mint" aria-hidden="true" />
                <span className="font-jetbrains text-[10.5px] uppercase tracking-[0.2em] text-brand-mint">
                  Speaking Diagnostic{profile?.examLabel ? ` · ${profile.examLabel}` : ""}
                </span>
              </div>
              <h1 className="font-manrope text-[34px] sm:text-[40px] font-extrabold text-white leading-[1.08] tracking-[-0.03em]">
                Begin your <span className="text-brand-mint">speaking diagnostic.</span>
              </h1>
              <p className="text-brand-on-ink text-[15px] leading-[1.75] max-w-md mx-auto">
                You'll answer <strong className="text-white">{prompts.length} short prompts</strong> by recording your voice. Speak naturally — there's no single right answer. You can re-record any prompt before you submit.
              </p>
            </div>
          </div>

          <div className="w-full space-y-2.5">
            {introSteps.map((step) => (
              <div
                key={step.label}
                className="bg-white border border-brand-line rounded-2xl p-4 flex items-center gap-4 text-left hover:border-brand-teal-200 transition-colors duration-150"
              >
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-teal-wash text-xl">{step.icon}</span>
                <div className="flex-1">
                  <p className="font-manrope text-brand-ink font-bold text-[15px] tracking-[-0.01em]">{step.label}</p>
                  <p className="text-brand-text-mute text-[13px] mt-0.5 leading-[1.6]">{step.desc}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 font-jetbrains text-brand-text-mute text-[10.5px] uppercase tracking-[0.14em]">
            <span className="flex items-center gap-1.5">🎙 {prompts.length} prompts</span>
            <span className="flex items-center gap-1.5">🔒 One-time</span>
            <span className="flex items-center gap-1.5">💡 Autosaved</span>
          </div>

          <button
            onClick={() => { setPhase("running"); goToPrompt(0); }}
            className="w-full py-4 bg-brand-teal-700 hover:bg-brand-teal-600 text-white font-semibold text-[15.5px] rounded-xl transition-colors duration-150 active:scale-[0.99]"
          >
            Start Diagnostic →
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
          <div className="mx-auto max-w-xl space-y-6">
            {/* header — icon badge + title/subtitle, matches Diagnosis.tsx's SpeakingPhase */}
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-brand-teal-wash border border-brand-teal-tint rounded-xl flex items-center justify-center text-xl shrink-0">🎤</div>
              <div className="min-w-0">
                <p className="font-manrope text-brand-ink font-bold text-[16px] tracking-[-0.02em] truncate">{current.type}</p>
                <p className="text-brand-text-mute text-[13.5px] leading-[1.6]">
                  Prompt {current.order} of {prompts.length} · Speaking limit {fmt(current.speakSeconds)}{current.prepSeconds ? ` · ${current.prepSeconds}s to think first` : ""}
                </p>
              </div>
            </div>

            {/* The question itself: read-aloud shows text only; everything else is audio
                only (the student listens, and can replay as often as they like). */}
            {current.display === "text" ? (
              <div className="rounded-2xl border border-brand-teal-200 bg-brand-teal-50/60 px-5 py-4">
                <p className="mb-1.5 font-jetbrains text-[10px] uppercase tracking-[0.16em] text-brand-teal-700">Read this aloud</p>
                <p className="text-[19px] leading-relaxed text-brand-text">{current.passage}</p>
              </div>
            ) : (
              <div className="flex flex-col gap-3 rounded-2xl border border-brand-line bg-brand-bg px-5 py-4">
                <p className="font-jetbrains text-brand-text-mute text-[10px] uppercase tracking-[0.16em]">Your Speaking Prompt</p>
                <p className="flex items-center gap-2 text-sm font-medium text-brand-text">
                  <Volume2 className="h-4 w-4 shrink-0 text-brand-teal-700" /> Listen to the question — you can replay it as many times as you like.
                </p>
                {current.audioUrl
                  ? <audio controls src={current.audioUrl} className="w-full" />
                  : <p className="flex items-center gap-2 text-sm text-brand-warm"><AlertTriangle className="h-4 w-4" /> Question audio is unavailable — please contact support.</p>}
              </div>
            )}

            {error && <Banner>{error}</Banner>}

            {/* idle-state tips — shown only before the student starts recording */}
            {recState === "idle" && (
              <div className="bg-brand-teal-wash border border-brand-teal-tint rounded-2xl p-4">
                <ul className="text-brand-text text-[14px] space-y-2 leading-[1.6]">
                  <li className="flex gap-2"><span className="text-brand-teal-600 font-bold">→</span>Read or listen to the prompt carefully before recording.</li>
                  <li className="flex gap-2"><span className="text-brand-teal-600 font-bold">→</span>Tap the button below to start — you have {fmt(current.speakSeconds)}.</li>
                  <li className="flex gap-2"><span className="text-brand-teal-600 font-bold">→</span>Recording stops automatically when the time limit is reached.</li>
                  <li className="flex gap-2"><span className="text-brand-teal-600 font-bold">→</span>Speak naturally — you can re-record before you submit.</li>
                </ul>
              </div>
            )}

            {/* recorder controls */}
            <div className="flex flex-col items-center gap-5 py-4">
              {recState === "recording" && (
                <div className="flex items-center gap-1 h-12">
                  {waveBars.map((h, i) => (
                    <div
                      key={i}
                      className="w-1.5 bg-rose-500 rounded-full"
                      style={{
                        height: `${20 + h * 30}px`,
                        animation: `waveform 0.${5 + (i % 5)}s ease-in-out infinite alternate`,
                        animationDelay: `${i * 0.06}s`,
                      }}
                    />
                  ))}
                </div>
              )}

              {recState === "recording" && (
                <div className="w-full space-y-2">
                  <div className="flex justify-between font-jetbrains text-[12px] text-brand-text-mute font-semibold tabular-nums">
                    <span>{fmt(current.speakSeconds - remaining)}</span>
                    <span className={remaining <= 10 ? "text-amber-600" : ""}>{fmt(remaining)} remaining</span>
                  </div>
                  <div className="h-1.5 bg-brand-bg-alt rounded-full overflow-hidden">
                    <div
                      className={cn("h-full rounded-full transition-all duration-1000", remaining <= 10 ? "bg-amber-500" : "bg-rose-500")}
                      style={{ width: `${current.speakSeconds ? ((current.speakSeconds - remaining) / current.speakSeconds) * 100 : 0}%` }}
                    />
                  </div>
                </div>
              )}

              {recState === "recording" ? (
                <button
                  onClick={stopRecording}
                  aria-label="Stop recording"
                  className="w-20 h-20 rounded-2xl flex items-center justify-center text-white shadow-sm bg-rose-500 hover:bg-rose-600 animate-pulse transition-colors duration-150"
                >
                  <Square className="h-7 w-7" />
                </button>
              ) : currentBlob ? (
                <div className="w-20 h-20 rounded-2xl flex items-center justify-center bg-brand-ink text-white shadow-sm">
                  <CheckCircle2 className="h-8 w-8" />
                </div>
              ) : (
                <button
                  onClick={startRecording}
                  aria-label="Start recording"
                  className="w-20 h-20 rounded-2xl flex items-center justify-center text-white shadow-sm bg-brand-teal-700 hover:bg-brand-teal-600 transition-colors duration-150"
                >
                  <Mic className="h-7 w-7" />
                </button>
              )}

              <p className="text-brand-text-mute text-[13.5px] text-center leading-[1.6]">
                {recState === "idle" && "Tap to start recording"}
                {recState === "recording" && "Recording… stops automatically when time's up"}
                {recState === "recorded" && `Recorded — play it back to check, or re-record below.`}
              </p>

              {currentBlob && recState !== "recording" && (
                <div className="flex flex-col items-center gap-3 w-full">
                  {currentUrl && <audio controls src={currentUrl} className="w-full max-w-md" />}
                  <button
                    onClick={reRecord}
                    className="inline-flex items-center gap-2 rounded-xl border border-brand-line px-4 py-2.5 font-medium text-brand-text hover:border-brand-teal-300"
                  >
                    <RotateCcw className="h-4 w-4" /> Re-record
                  </button>
                </div>
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
