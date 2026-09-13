"use client";
// Shared Spoken English record-and-submit speaking runner. Powers both the Internal Assessment
// and the Full Mock — same recorder mechanics as the diagnostic viva, parameterised by the
// questions/submit endpoints + labels. Reuses the viva IndexedDB cache (namespaced per kind) so a
// mid-assessment refresh doesn't lose recordings. Backend returns { success, session_id, prompts[] }
// and grades to { cefrLabel, section_scores[], momentum_awarded }.
import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { callBackend, uploadFileToBackend } from "@/features/auth/services/authClient";
import { cacheGetAll, cacheSet, cacheDelete, cacheClear } from "./Diagnosis/vivaRecordingCache";
import { seSubskill } from "@/features/student/config/spokenEnglishSubskills";
import { cn } from "@/shared/utils";
import { Mic, Square, RotateCcw, ArrowRight, ArrowLeft, CheckCircle2, AlertTriangle, Loader2, Volume2, Trophy, CalendarClock } from "lucide-react";

interface RunnerPrompt {
  id: string;
  subskill: string;
  display: "audio" | "text";
  audioUrl: string | null;
  passage: string | null;
  prepSeconds: number;
  speakSeconds: number;
}
interface RunnerResult {
  cefrLabel?: string;
  section_scores?: Array<{ subskill: string; level: string; previous_level: string | null }>;
  momentum_awarded?: number;
}
type Phase = "loading" | "intro" | "running" | "review" | "submitting" | "result" | "error" | "not_scheduled";
type RecState = "idle" | "recording" | "recorded";
interface NextIa { date_formatted?: string; days_away?: number; number?: number }

export interface SeSpeakingRunnerProps {
  questionsUrl: string;
  submitUrl: string;
  cacheKind: string;                    // "ia" | "mock" — cache namespace suffix
  introEyebrow: string;                 // small uppercase label above the intro title
  introTitle: string;
  introBlurb: (count: number) => string;
  resultTitle: string;
  notReadyMsg: string;
}

const fmt = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
const subLabel = (id: string) => seSubskill(id)?.label ?? id;

export default function SeSpeakingRunner({ questionsUrl, submitUrl, cacheKind, introEyebrow, introTitle, introBlurb, resultTitle, notReadyMsg }: SeSpeakingRunnerProps) {
  const { profile } = useAuth();
  const navigate = useNavigate();
  const examId = profile?.examId ?? "spoken_english";
  const ns = `${examId}-${cacheKind}`;

  const [phase, setPhase] = useState<Phase>("loading");
  const [prompts, setPrompts] = useState<RunnerPrompt[]>([]);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [idx, setIdx] = useState(0);
  const [recordings, setRecordings] = useState<Record<string, Blob>>({});
  const [result, setResult] = useState<RunnerResult | null>(null);
  const [nextIa, setNextIa] = useState<NextIa | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [recState, setRecState] = useState<RecState>("idle");
  const [remaining, setRemaining] = useState(0);

  const mrRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const current = prompts[idx];
  const currentBlob = current ? recordings[current.id] : undefined;
  const allRecorded = prompts.length > 0 && prompts.every((p) => recordings[p.id]);
  const currentUrl = useMemo(() => (currentBlob ? URL.createObjectURL(currentBlob) : null), [currentBlob]);
  useEffect(() => () => { if (currentUrl) URL.revokeObjectURL(currentUrl); }, [currentUrl]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        // silent: this call gates on the IA schedule and can legitimately 400 with `not_ia_day`;
        // we render that in-UI, so suppress the generic error toast callBackend would otherwise fire.
        const data = await callBackend(questionsUrl, { method: "GET" }, { silent: true });
        if (cancelled) return;
        if (!data.success || !(data.prompts?.length)) {
          setError(notReadyMsg);
          setPhase("error");
          return;
        }
        setSessionId(data.session_id);
        setPrompts(data.prompts);
        const cached = await cacheGetAll(ns);
        if (!cancelled && Object.keys(cached).length) setRecordings(cached);
        setPhase("intro");
      } catch (e: any) {
        if (cancelled) return;
        // Not a scheduled IA day → a friendly "come back on <date>" screen, not an error.
        if (e?.responseData?.error === "not_ia_day") {
          setNextIa(e.responseData.next_ia ?? null);
          setPhase("not_scheduled");
          return;
        }
        setError(e?.responseData?.message || e?.responseData?.error || "Could not load your assessment. Please try again.");
        setPhase("error");
      }
    })();
    return () => { cancelled = true; };
  }, [ns, questionsUrl, notReadyMsg]);

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
        cacheSet(ns, current.id, blob);
        setRecState("recorded");
        stream.getTracks().forEach((t) => t.stop());
        streamRef.current = null;
      };
      mr.start(250);
      setRecState("recording");
      setRemaining(current.speakSeconds);
      timerRef.current = setInterval(() => setRemaining((s) => { if (s <= 1) { stopRecording(); return 0; } return s - 1; }), 1000);
    } catch {
      setError("Microphone access denied. Please allow microphone access and try again.");
    }
  };

  const reRecord = () => {
    if (!current) return;
    setRecordings((r) => { const next = { ...r }; delete next[current.id]; return next; });
    cacheDelete(ns, current.id);
    setRecState("idle");
  };

  const goToPrompt = (i: number) => { stopRecording(); setIdx(i); setRecState(recordings[prompts[i]?.id] ? "recorded" : "idle"); setRemaining(0); };

  const submitAll = async () => {
    setPhase("submitting");
    setError(null);
    const fd = new FormData();
    fd.append("session_id", sessionId ?? "");
    const ext = MediaRecorder.isTypeSupported("audio/webm") ? "webm" : "mp4";
    for (const p of prompts) { const b = recordings[p.id]; if (b) fd.append(p.id, b, `${p.id}.${ext}`); }
    try {
      const data = await uploadFileToBackend(submitUrl, fd, "POST");
      setResult(data as RunnerResult);
      cacheClear(ns);
      setPhase("result");
    } catch (e: any) {
      setError(e?.responseData?.error || "Submission failed. Please try again.");
      setPhase("review");
    }
  };

  // ── Render ──────────────────────────────────────────────────────────────────
  if (phase === "loading") return <Centered><Loader2 className="h-8 w-8 animate-spin text-brand-teal-600" /><p className="mt-3 text-brand-text-mute">Loading your assessment…</p></Centered>;

  if (phase === "error") return (
    <Centered>
      <AlertTriangle className="h-10 w-10 text-amber-500" />
      <p className="mt-3 max-w-sm text-center text-brand-text">{error}</p>
      <button onClick={() => navigate(`/${examId}/dashboard`)} className="mt-5 rounded-xl bg-brand-teal-600 px-5 py-2.5 font-semibold text-white hover:bg-brand-teal-700">Back to dashboard</button>
    </Centered>
  );

  if (phase === "not_scheduled") return (
    <Shell>
      <div className="mx-auto max-w-xl space-y-6">
        <button onClick={() => navigate(`/${examId}/dashboard`)} className="flex items-center gap-2 text-sm font-semibold text-brand-text-mute transition-colors hover:text-brand-teal-600">
          <ArrowLeft className="h-4 w-4" /> Back to Dashboard
        </button>

        <section className="relative overflow-hidden rounded-3xl bg-brand-ink-deep p-6 text-white sm:p-8">
          <div className="pointer-events-none absolute -right-10 -top-10 h-48 w-48 rounded-full bg-brand-teal-500/20 blur-2xl" />
          <div className="relative mb-3 flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/10"><CalendarClock className="h-5 w-5 text-brand-mint" /></div>
            <div>
              <p className="font-jetbrains text-[10.5px] uppercase tracking-[0.18em] text-brand-mint">{introEyebrow}</p>
              <h1 className="font-dm text-2xl font-bold leading-tight">Not scheduled for today</h1>
            </div>
          </div>
          <p className="relative max-w-lg text-sm leading-[1.6] text-brand-on-ink-mute">
            Internal assessments run on a fixed schedule so your CEFR level tracks real progress. Today isn't an assessment day — keep drilling and come back when your next one opens.
          </p>
        </section>

        <section className="rounded-2xl border border-brand-line bg-white p-6 text-center shadow-sm">
          {nextIa?.date_formatted ? (
            <>
              <p className="font-jetbrains text-[10px] uppercase tracking-[0.16em] text-brand-text-mute">Your next assessment</p>
              <p className="mt-2 font-dm text-2xl font-bold text-brand-text">{nextIa.date_formatted}</p>
              <p className="mt-1 text-sm text-brand-text-mute">
                {typeof nextIa.days_away === "number" ? (nextIa.days_away <= 0 ? "Opens today" : `${nextIa.days_away} day${nextIa.days_away !== 1 ? "s" : ""} away`) : ""}
              </p>
            </>
          ) : (
            <p className="text-sm text-brand-text-mute">Your assessment schedule will appear on your dashboard once you've started drilling.</p>
          )}
          <button onClick={() => navigate(`/${examId}/dashboard`)} className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-brand-teal-600 px-6 py-3.5 font-semibold text-white transition-colors hover:bg-brand-teal-700">
            Back to dashboard <ArrowRight className="h-4 w-4" />
          </button>
        </section>
      </div>
    </Shell>
  );

  if (phase === "intro") {
    const covers = [...new Set(prompts.map((p) => subLabel(p.subskill)))];
    const estMin = Math.max(1, Math.round(prompts.reduce((s, p) => s + p.speakSeconds + (p.prepSeconds || 0), 0) / 60));
    const steps = [
      { icon: Volume2, title: "Listen or read the prompt", body: "Each prompt is an audio question to answer or a short passage to read aloud." },
      { icon: Mic, title: "Record your answer", body: "Speak naturally within the time limit — you can play it back and re-record before moving on." },
      { icon: Trophy, title: "Get your CEFR level", body: "Every sub-skill is graded on the CEFR scale (A1–C2) and your speaking profile updates instantly." },
    ];
    return (
      <Shell>
        <div className="mx-auto max-w-2xl space-y-6">
          <button onClick={() => navigate(`/${examId}/dashboard`)} className="flex items-center gap-2 text-sm font-semibold text-brand-text-mute transition-colors hover:text-brand-teal-600">
            <ArrowLeft className="h-4 w-4" /> Back to Dashboard
          </button>

          <section className="relative overflow-hidden rounded-3xl bg-brand-ink-deep p-6 text-white sm:p-8">
            <div className="pointer-events-none absolute -right-10 -top-10 h-48 w-48 rounded-full bg-brand-teal-500/20 blur-2xl" />
            <div className="relative mb-3 flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/10"><Mic className="h-5 w-5 text-brand-mint" /></div>
              <div>
                <p className="font-jetbrains text-[10.5px] uppercase tracking-[0.18em] text-brand-mint">{introEyebrow}</p>
                <h1 className="font-dm text-2xl font-bold leading-tight">{introTitle}</h1>
              </div>
            </div>
            <p className="relative max-w-lg text-sm leading-[1.6] text-brand-on-ink-mute">{introBlurb(prompts.length)}</p>
            <div className="relative mt-5 flex flex-wrap gap-2">
              {[`${prompts.length} prompt${prompts.length !== 1 ? "s" : ""}`, `~${estMin} min`, "CEFR-graded"].map((m) => (
                <span key={m} className="rounded-full bg-white/10 px-3 py-1 font-jetbrains text-[11px] font-semibold tracking-wide text-white/90">{m}</span>
              ))}
            </div>
          </section>

          <section className="rounded-2xl border border-brand-line bg-white p-6 shadow-sm">
            <p className="font-jetbrains text-[10px] uppercase tracking-[0.16em] text-brand-text-mute">How it works</p>
            <div className="mt-4 space-y-4">
              {steps.map((s, i) => (
                <div key={i} className="flex gap-3.5">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-brand-teal-50 text-brand-teal-600"><s.icon className="h-4 w-4" /></div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-brand-text">{s.title}</p>
                    <p className="text-[13px] leading-relaxed text-brand-text-mute">{s.body}</p>
                  </div>
                </div>
              ))}
            </div>

            {covers.length > 0 && (
              <div className="mt-5 border-t border-brand-line pt-4">
                <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-brand-text-mute">Covers</p>
                <div className="flex flex-wrap gap-1.5">
                  {covers.map((c) => (
                    <span key={c} className="rounded-full bg-brand-teal-50 px-3 py-1 text-xs font-semibold text-brand-teal-700">{c}</span>
                  ))}
                </div>
              </div>
            )}

            <button onClick={() => { setPhase("running"); goToPrompt(0); }} className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-brand-teal-600 px-6 py-3.5 font-semibold text-white transition-colors hover:bg-brand-teal-700">
              Start <ArrowRight className="h-4 w-4" />
            </button>
            <p className="mt-3 flex items-center justify-center gap-1.5 text-xs text-brand-text-mute"><Mic className="h-3.5 w-3.5" /> We'll ask for microphone access when you start.</p>
          </section>
        </div>
      </Shell>
    );
  }

  if (phase === "submitting") return <Centered><Loader2 className="h-8 w-8 animate-spin text-brand-teal-600" /><p className="mt-3 text-brand-text-mute">Scoring your answers…</p></Centered>;

  if (phase === "result" && result) return (
    <Shell>
      <div className="mx-auto max-w-xl space-y-6">
        <section className="relative overflow-hidden rounded-3xl bg-brand-ink-deep p-6 text-center text-white sm:p-8">
          <div className="pointer-events-none absolute -right-10 -top-10 h-48 w-48 rounded-full bg-brand-mint/20 blur-2xl" />
          <div className="relative mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-white/10"><Trophy className="h-7 w-7 text-brand-mint" /></div>
          <h1 className="relative font-dm text-2xl font-bold">{resultTitle}</h1>
          <div className="relative mt-4 inline-flex items-baseline gap-2 rounded-2xl bg-white/10 px-5 py-3">
            <span className="font-jetbrains text-[10px] uppercase tracking-[0.16em] text-brand-mint">Your level</span>
            <span className="font-dm text-3xl font-bold leading-none text-white">{result.cefrLabel ?? "—"}</span>
          </div>
          {result.momentum_awarded ? <p className="relative mt-3 text-sm text-brand-on-ink-mute">+{result.momentum_awarded} momentum earned</p> : null}
        </section>

        {result.section_scores && result.section_scores.length > 0 && (
          <section className="rounded-2xl border border-brand-line bg-white p-6 shadow-sm">
            <p className="mb-4 font-jetbrains text-[10px] uppercase tracking-[0.16em] text-brand-text-mute">Sub-skill breakdown</p>
            <div className="space-y-2">
              {result.section_scores.map((s) => {
                const improved = s.previous_level && s.previous_level !== s.level;
                return (
                  <div key={s.subskill} className="flex items-center justify-between rounded-xl border border-brand-line bg-brand-bg-alt px-4 py-2.5">
                    <span className="text-sm font-medium text-brand-text">{subLabel(s.subskill)}</span>
                    <span className="flex items-center gap-1.5 font-jetbrains text-xs font-bold uppercase">
                      {improved && <span className="text-brand-text-mute">{s.previous_level!.toUpperCase()} →</span>}
                      <span className="text-brand-teal-700">{(s.level || "").toUpperCase()}</span>
                    </span>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        <div className="flex flex-col gap-2 sm:flex-row">
          <button onClick={() => navigate(`/${examId}/assessment-history`)} className="flex-1 rounded-xl border border-brand-line bg-white px-5 py-3 font-semibold text-brand-text transition-colors hover:border-brand-teal-300">View history</button>
          <button onClick={() => navigate(`/${examId}/dashboard`, { replace: true })} className="flex-1 rounded-xl bg-brand-teal-600 px-5 py-3 font-semibold text-white transition-colors hover:bg-brand-teal-700">Back to dashboard</button>
        </div>
      </div>
    </Shell>
  );

  // running + review
  return (
    <Shell>
      <div className="mx-auto mb-6 flex max-w-2xl flex-wrap items-center gap-1.5">
        {prompts.map((p, i) => (
          <button key={p.id} onClick={() => { setPhase("running"); goToPrompt(i); }} className={cn("h-2 flex-1 min-w-[16px] rounded-full", recordings[p.id] ? "bg-brand-teal-500" : i === idx && phase === "running" ? "bg-brand-teal-300" : "bg-brand-line")} aria-label={`Prompt ${i + 1}`} />
        ))}
      </div>

      {phase === "review" ? (
        <div className="mx-auto max-w-xl">
          <h1 className="font-dm text-2xl font-bold text-brand-text">Review &amp; submit</h1>
          <p className="mt-1 text-brand-text-mute">{Object.keys(recordings).length} of {prompts.length} recorded.</p>
          {error && <Banner>{error}</Banner>}
          <div className="mt-5 space-y-2">
            {prompts.map((p, i) => (
              <button key={p.id} onClick={() => { setPhase("running"); goToPrompt(i); }} className="flex w-full items-center justify-between rounded-xl border border-brand-line bg-brand-bg-alt px-4 py-3 text-left hover:border-brand-teal-300">
                <span className="text-sm text-brand-text">{i + 1}. {subLabel(p.subskill)}</span>
                {recordings[p.id] ? <CheckCircle2 className="h-5 w-5 text-brand-teal-600" /> : <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-semibold text-amber-700">missing</span>}
              </button>
            ))}
          </div>
          <button disabled={!allRecorded} onClick={submitAll} className={cn("mt-6 w-full rounded-xl px-5 py-3 font-semibold text-white", allRecorded ? "bg-brand-teal-600 hover:bg-brand-teal-700" : "cursor-not-allowed bg-brand-line")}>
            {allRecorded ? "Submit" : "Record every prompt to submit"}
          </button>
        </div>
      ) : current ? (
        <div className="mx-auto max-w-xl">
          <div className="mb-3 flex items-center justify-between">
            <span className="rounded-full bg-brand-teal-100 px-3 py-1 text-[11px] font-bold uppercase tracking-wide text-brand-teal-700">{subLabel(current.subskill)}</span>
            <span className="font-jetbrains text-xs text-brand-text-mute">Prompt {idx + 1} / {prompts.length}</span>
          </div>

          {current.display === "text" ? (
            <div className="mt-1 rounded-xl border border-brand-teal-200 bg-brand-teal-50/60 px-5 py-4">
              <p className="mb-1.5 font-jetbrains text-[10px] uppercase tracking-[0.16em] text-brand-teal-700">Read this aloud</p>
              <p className="text-[19px] leading-relaxed text-brand-text">{current.passage}</p>
            </div>
          ) : (
            <div className="mt-1 flex flex-col gap-3 rounded-xl border border-brand-line bg-brand-bg-alt px-5 py-4">
              <p className="flex items-center gap-2 text-sm font-medium text-brand-text"><Volume2 className="h-4 w-4 shrink-0 text-brand-teal-600" /> Listen to the question — replay as needed.</p>
              {current.audioUrl && <audio controls src={current.audioUrl} className="w-full" />}
            </div>
          )}

          <p className="mt-3 text-sm text-brand-text-mute">Speaking limit: {fmt(current.speakSeconds)}{current.prepSeconds ? ` · ${current.prepSeconds}s to think first` : ""}</p>
          {error && <Banner>{error}</Banner>}

          <div className="mt-6 flex flex-col items-center gap-4 rounded-2xl border border-brand-line bg-brand-bg-alt p-6">
            {recState === "recording" ? (
              <>
                <div className="flex items-center gap-2 text-rose-600"><span className="h-2.5 w-2.5 animate-pulse rounded-full bg-rose-600" /><span className="font-jetbrains text-sm font-bold">Recording · {fmt(remaining)} left</span></div>
                <button onClick={stopRecording} className="inline-flex items-center gap-2 rounded-xl bg-rose-600 px-6 py-3 font-semibold text-white hover:bg-rose-700"><Square className="h-4 w-4" /> Stop</button>
              </>
            ) : currentBlob ? (
              <>
                <div className="flex items-center gap-2 text-brand-teal-700"><CheckCircle2 className="h-5 w-5" /><span className="text-sm font-semibold">Recorded — play it back to check</span></div>
                {currentUrl && <audio controls src={currentUrl} className="w-full max-w-md" />}
                <button onClick={reRecord} className="inline-flex items-center gap-2 rounded-xl border border-brand-line px-4 py-2.5 font-medium text-brand-text hover:border-brand-teal-300"><RotateCcw className="h-4 w-4" /> Re-record</button>
              </>
            ) : (
              <button onClick={startRecording} className="inline-flex items-center gap-2 rounded-xl bg-brand-teal-600 px-6 py-3 font-semibold text-white hover:bg-brand-teal-700"><Mic className="h-4 w-4" /> Record answer</button>
            )}
          </div>

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
}

const Shell = ({ children }: { children: React.ReactNode }) => <div className="min-h-screen bg-brand-bg px-4 py-10 font-dm sm:px-6 lg:px-8">{children}</div>;
const Centered = ({ children }: { children: React.ReactNode }) => <div className="flex min-h-screen flex-col items-center justify-center bg-brand-bg font-dm">{children}</div>;
const Banner = ({ children }: { children: React.ReactNode }) => <div className="mt-4 flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800"><AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />{children}</div>;
