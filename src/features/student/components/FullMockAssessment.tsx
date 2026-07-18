// filepath: src/features/student/pages/FullMockAssessment.tsx
import React, { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";

import { useAuth } from "@/features/auth/hooks/useAuth";
import { useMomentum } from "@/features/student/Context/MomentumContext";
import { callBackend } from "@/features/auth/services/authClient";
import { transformSectionAudioUrls } from "@/features/student/utils/iaAudioUtils";
import {
  getSectionDurationSec,
  getState as getTimerState,
  startSection,
  setSectionEndsAt,
  isSectionStarted,
  isSectionExpired,
  getSectionRemainingSec,
  getWindowRemainingMs,
  isWindowExpired,
  clearState as clearTimerState,
} from "@/features/student/utils/mockTimerStore";
import {
  GraduationCap, ArrowRight, CheckCircle2, AlertCircle, Mic, PlayCircle,
  Zap, Loader2, Lock, XCircle, Trophy, Calendar, BookOpen, ArrowLeft, Flame,
  ChevronDown, Clock, Hourglass, TimerOff,
} from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

type Phase = "gate" | "listening_intro" | "session" | "interim" | "scoring" | "results";

interface MockProgress {
  ia_completed:  number;
  ia_required:   number;
  ia_per_skill:  Record<string, boolean>;
  band_improved: boolean;
  best_improvement: number;
  improved_skill: string | null;
}

interface MockStatusResponse {
  success:                   boolean;
  is_eligible:               boolean;
  eligibility_reasons:       { key: string; message: string }[];
  can_start_mock:            boolean;
  has_active_session:        boolean;
  active_session_id:         string | null;
  standard_used_this_month:  boolean;
  standard_session_status:   string | null;
  earned_used_this_month:    boolean;
  earned_session_status:     string | null;
  earned_mock_eligible:      boolean;
  can_start_earned:          boolean;
  earned_mock_reasons:       { key: string; message: string }[];
  momentum_score:            number;
  earned_mock_cost:          number;
  progress:                  MockProgress;
}

interface MockQuestion {
  id:            string;
  question_type: 'MCQ' | 'TFNG' | 'WRITING_PROMPT' | 'SPEAKING_PROMPT';
  prompt_text:   string;
  options:       Record<string, string> | null;
}

interface MockSection {
  skill:        string;
  section_type: 'AUDIO' | 'PASSAGE' | 'MCQ_MIX';
  audio_url:    string | null;
  passage_text: string | null;
  passage_id:   string | null;
  questions:    MockQuestion[];
}

interface MockSessionResponse {
  success:             boolean;
  session_id:          string;
  resume:              boolean;
  attempt_type:        'STANDARD' | 'EARNED';
  current_section_idx: number;
  sections:            MockSection[];
  saved_answers:       Record<string, string>;
  window_closes_at:    string;
  time_remaining_ms:   number;
  total_time_ms:       number;
  already_done?:       boolean;
  section_ends_at_ms?:  Record<string, number>;
  window_closes_at_ms?: number;
  course_id?:           string | null;
}

interface MockSubSkillScore {
  sub_skill:   string;
  band:        number;
  correct:     number;
  total_mcq:   number;
  ai_band:     number | null;
  ai_feedback?: { rationale: string; key_observations: string[] };
}

interface MockSkillScore {
  skill:              string;
  band:               number;
  new_matrix_band:    number;
  diagnostic_band:    number | null;
  delta_from_diag:    number | null;
  prev_matrix_band:   number | null;
  correct:            number;
  total:              number;
  ai_graded:          boolean;
  sub_skill_scores?:  MockSubSkillScore[];
  insight?:           string;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const SKILL_ICON: Record<string, string> = {
  LISTENING: "🎧", READING: "📖", WRITING: "✍️", SPEAKING: "🎤",
};
const SKILL_LABEL: Record<string, string> = {
  LISTENING: "Listening", READING: "Reading", WRITING: "Writing", SPEAKING: "Speaking",
};
const SUBSKILL_LABEL: Record<string, string> = {
  GRAMMAR: "Grammar", VOCABULARY: "Vocabulary", COHERENCE: "Coherence",
  TASK_RESPONSE: "Task Response", FLUENCY: "Fluency", PRONUNCIATION: "Pronunciation",
  OVERALL: "Overall Accuracy",
};

const SKILL_ACCENT: Record<string, { text: string; bg: string; border: string; ring: string; stroke: string }> = {
  LISTENING: { text: "text-teal-600",   bg: "bg-teal-50",   border: "border-teal-200",   ring: "text-teal-500",   stroke: "#14B8A6" },
  READING:   { text: "text-purple-600", bg: "bg-purple-50", border: "border-purple-200", ring: "text-purple-500", stroke: "#A855F7" },
  WRITING:   { text: "text-orange-500", bg: "bg-orange-50", border: "border-orange-200", ring: "text-orange-500", stroke: "#F97316" },
  SPEAKING:  { text: "text-rose-500",   bg: "bg-rose-50",   border: "border-rose-200",   ring: "text-rose-500",   stroke: "#F43F5E" },
};
const accent = (skill: string) =>
  SKILL_ACCENT[skill] ?? { text: "text-slate-600", bg: "bg-slate-50", border: "border-slate-200", ring: "text-slate-500", stroke: "#64748B" };

/** Return the index of the first section at or after `fromIdx` whose timer
 *  hasn't expired yet (or hasn't been started). Returns -1 if none remain. */
function findNextPlayable(sid: string, secs: MockSection[], fromIdx: number): number {
  for (let i = fromIdx; i < secs.length; i++) {
    const skill = secs[i].skill;
    if (!isSectionStarted(sid, skill) || !isSectionExpired(sid, skill)) return i;
  }
  return -1;
}

const STORAGE_KEY = "tc_full_mock_assessment_state";

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

function formatHMS(totalSeconds: number): string {
  const s = Math.max(0, Math.floor(totalSeconds));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  return `${h}:${m.toString().padStart(2, "0")}:${sec.toString().padStart(2, "0")}`;
}

function firstOfNextMonth(): string {
  const now = new Date();
  const d = new Date(now.getFullYear(), now.getMonth() + 1, 1);
  return d.toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" });
}

const BAND_MOVE_CAP = 2;
function clampBandMove(prev: number | null, next: number): number {
  if (prev === null || prev === undefined) return next;
  const capped = Math.min(prev + BAND_MOVE_CAP, Math.max(prev - BAND_MOVE_CAP, next));
  if (capped !== next) {
    console.warn(`[Mock] band movement ${prev} -> ${next} exceeded ±${BAND_MOVE_CAP}; clamped to ${capped}`);
  }
  return capped;
}

function skillInsight(s: MockSkillScore): string {
  const label = SKILL_LABEL[s.skill] ?? s.skill;
  if (s.total === 0 && s.band <= 4.0) return `${label} section awaiting scoring.`;

  const band = s.band;
  const tier =
    band >= 7.5 ? "excellent" :
    band >= 6.5 ? "solid"     :
    band >= 5.5 ? "developing" : "foundational";

  const accuracy = s.total > 0 ? Math.round((s.correct / s.total) * 100) : null;

  const diagTrend =
    s.delta_from_diag !== null && s.delta_from_diag !== undefined && Math.abs(s.delta_from_diag) >= 0.5
      ? s.delta_from_diag > 0
        ? ` — a ${s.delta_from_diag.toFixed(1)}-point gain from your diagnostic`
        : ` — down ${Math.abs(s.delta_from_diag).toFixed(1)} from your diagnostic`
      : "";

  let advice = "";
  if (accuracy !== null) {
    if (accuracy >= 80)      advice = " Accuracy is strong; focus on speed and rare question types.";
    else if (accuracy >= 60) advice = " Solid accuracy with clear room to sharpen weaker question types.";
    else                     advice = " Prioritize targeted drills — accuracy needs to lift before the next mock.";
  } else if (s.ai_graded) {
    advice = band >= 6.5
      ? " Refine the specific sub-skills below for tighter consistency."
      : " Focus on the sub-skills flagged below in your next drills.";
  }

  return `Your ${label} performance sits at a ${tier} band of ${band.toFixed(1)}${diagTrend}.${advice}`;
}
// ─── Circular timer ──────────────────────────────────────────────────────────
const CircleTimer: React.FC<{
  timeLeft: number; total: number; size?: number; stroke?: string; label?: string; forceColor?: string;
}> = ({ timeLeft, total, size = 64, stroke, label, forceColor }) => {
  const pct   = total > 0 ? timeLeft / total : 1;
  const r     = (size - 8) / 2;
  const circ  = 2 * Math.PI * r;
  const dash  = circ * Math.max(0, Math.min(1, pct));
  const auto  = pct < 0.15 ? "#EF4444" : pct < 0.35 ? "#F59E0B" : (stroke ?? "#4338CA");
  const color = forceColor ?? auto;
  const display = label ?? formatTime(timeLeft);
  const isRed = color === "#EF4444";
  const fontSize = display.length > 5 ? size / 6 : size / 4.6;
  return (
    <svg width={size} height={size} style={{ transform: "rotate(-90deg)", flexShrink: 0 }}>
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="#E5E7EB" strokeWidth={6} />
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth={6}
        strokeDasharray={`${dash} ${circ}`} strokeLinecap="round"
        style={{ transition: "stroke-dasharray 0.5s linear, stroke 0.3s" }} />
      <text x={size/2} y={size/2+1} textAnchor="middle" dominantBaseline="middle"
        fill={isRed ? "#EF4444" : "#111827"} fontSize={fontSize} fontWeight="900" fontFamily="monospace"
        style={{ transform: "rotate(90deg)", transformOrigin: `${size/2}px ${size/2}px` }}>
        {display}
      </text>
    </svg>
  );
};

// ─── "Time's up" modal — auto-dismiss after 1s ─────────────────────────────
const TimeUpModal: React.FC<{
  skill: string;
  answeredNote: string;
  isLastSection: boolean;
  onContinue: () => void;
}> = ({ skill, answeredNote, isLastSection, onContinue }) => {
  const firedRef = useRef(false);
  const mountedAt = useRef(Date.now());

  useEffect(() => {
    const fire = () => {
      if (firedRef.current) return;
      firedRef.current = true;
      onContinue();
    };

    // Primary: 1s timeout (works if tab stays focused)
    const t = setTimeout(fire, 1000);

    // Fallback: if tab was backgrounded, fire as soon as it's visible again
    const onVisible = () => {
      if (document.visibilityState === "visible" && Date.now() - mountedAt.current >= 900) {
        fire();
      }
    };
    document.addEventListener("visibilitychange", onVisible);

    return () => {
      clearTimeout(t);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [onContinue]);

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-fade-in">
      <div className="max-w-sm w-full bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden animate-in zoom-in duration-200">
        <div className="h-1.5 w-full bg-rose-500" />
        <div className="p-8 text-center">
          <div className="w-14 h-14 rounded-2xl bg-rose-50 border border-rose-200 flex items-center justify-center mx-auto mb-4">
            <TimerOff className="w-7 h-7 text-rose-500" />
          </div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight mb-1">
            Time's up — {SKILL_LABEL[skill] ?? skill}
          </h2>
          <p className="text-slate-400 font-medium text-xs">
            Answers saved · {isLastSection ? "Submitting…" : "Moving to next section…"}
          </p>
        </div>
      </div>
    </div>
  );
};

// ─── Nav ──────────────────────────────────────────────────────────────────────

function TopNavBar({
  totalMomentum,
  phase,
  onBack,
}: {
  totalMomentum: number;
  phase: Phase;
  onBack: () => void;
}) {
  const { streak } = useMomentum();

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-white border-b border-slate-200">
      <div className="w-full px-3 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-14 sm:h-16">

          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            {(phase === "gate" || phase === "listening_intro") && (
              <button
                onClick={onBack}
                className="flex items-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-1.5 rounded-lg border border-slate-200 font-medium text-xs text-slate-600 hover:bg-slate-50 transition-colors flex-shrink-0 shadow-sm"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Back</span>
              </button>
            )}
            <div className="flex items-center gap-1.5 sm:gap-2.5 min-w-0">
              <div className="p-1.5 sm:p-2 bg-indigo-600 rounded-xl flex-shrink-0 shadow-sm">
                <GraduationCap className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
              </div>
              <span className="text-base sm:text-xl font-semibold text-slate-900 tracking-tight truncate">
                TestCrack
              </span>
            </div>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-2 flex-shrink-0">
            <div className="flex items-center gap-1 sm:gap-1.5 bg-orange-50 border border-orange-200 px-2 sm:px-3 py-1 sm:py-1.5 rounded-full shadow-sm">
              <Flame className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-orange-500 fill-orange-500 flex-shrink-0" />
              <span className="font-semibold text-orange-600 text-xs sm:text-sm">{streak}</span>
              <span className="hidden md:inline text-xs text-orange-400 font-medium">day streak</span>
            </div>
            <div className="flex items-center gap-1 sm:gap-2 bg-indigo-50 border border-indigo-200 px-2 sm:px-4 py-1 sm:py-1.5 rounded-full shadow-sm">
              <Zap className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-400 fill-amber-400 flex-shrink-0" />
              <span className="font-semibold text-slate-900 text-xs sm:text-sm">{totalMomentum}</span>
              <span className="hidden md:inline text-xs text-indigo-400 font-medium">pts</span>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
}
// ─────────────────────────────────────────────────────────────────────────────
// MAIN COMPONENT
// ─────────────────────────────────────────────────────────────────────────────

export default function FullMockAssessment() {
  const navigate = useNavigate();
  const { profile } = useAuth() as any;
  const { totalMomentum, syncMomentum } = useMomentum();

  // Phase & status
  const [phase, setPhase]                       = useState<Phase>("gate");
  const [statusLoading, setStatusLoading]       = useState(true);
  const [mockStatus, setMockStatus]             = useState<MockStatusResponse | null>(null);

  // Session
  const [sessionId, setSessionId]               = useState<string | null>(null);
  const sessionIdRef                            = useRef<string | null>(null);
  const [sections, setSections]                 = useState<MockSection[] | null>(null);
  const [currentSectionIdx, setCurrentSectionIdx] = useState(0);
  const [currentIdx, setCurrentIdx]             = useState(0);
  const [isLoading, setIsLoading]               = useState(false);
  const [answers, setAnswers]                   = useState<Record<string, string>>({});
  const [mockResults, setMockResults]           = useState<any>(null);
  const [sessionMomentum, setSessionMomentum]   = useState(0);
  const [courseId, setCourseId]                 = useState<string | null>(null);
  const [expandedFeedback, setExpandedFeedback] = useState<Set<number>>(new Set());
  const toggleFeedback = (i: number) =>
    setExpandedFeedback(prev => {
      const next = new Set(prev);
      if (next.has(i)) next.delete(i); else next.add(i);
      return next;
    });

  // Timers
  const [timeLeft, setTimeLeft]                   = useState(0);
  const [windowRemainingMs, setWindowRemainingMs] = useState<number | null>(null);

  // Time-up modal
  const [showTimeUpModal, setShowTimeUpModal]     = useState(false);
  const [expiredSkill, setExpiredSkill]           = useState<string | null>(null);
  const [disableInteraction, setDisableInteraction] = useState(false);

  // Audio / Passage
  const audioRef                                = useRef<HTMLAudioElement>(null);
  const [audioState, setAudioState]             = useState<"idle" | "playing" | "played">("idle");
  const [showPassage, setShowPassage]           = useState(false);
  const [animBars]                              = useState(() => Array.from({ length: 12 }, () => Math.random()));

  // Writing anti-paste
  const [pasteBlocked, setPasteBlocked] = useState(false);
  const pasteFlashRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const flashPasteBlocked = () => {
    setPasteBlocked(true);
    if (pasteFlashRef.current) clearTimeout(pasteFlashRef.current);
    pasteFlashRef.current = setTimeout(() => setPasteBlocked(false), 2000);
  };

  // Speaking
  const recognitionRef                          = useRef<any>(null);
  const transcriptAccumRef                      = useRef<string>("");
  const [isRecording, setIsRecording]           = useState(false);
  const [liveTranscript, setLiveTranscript]     = useState("");
  const [recordedPrompts, setRecordedPrompts]   = useState<Record<string, boolean>>({});

  // Writing
  const writingDebounceRef                      = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Expiry guards & handler refs
  const expiryHandledRef        = useRef(false);
  const windowExpiryHandledRef  = useRef(false);
  const prevSectionIdxRef       = useRef<number | null>(null);
  const flushCurrentAnswerRef   = useRef<() => Promise<void>>(async () => {});
  const triggerSectionExpiryRef = useRef<() => Promise<void>>(async () => {});
  const runSubmitRef            = useRef<(allowRetry: boolean) => Promise<void>>(async () => {});

  const currentSection = sections?.[currentSectionIdx] ?? null;
  const currentSectionTotalSec = currentSection
    ? getSectionDurationSec(currentSection.skill, courseId)
    : 30 * 60;

  const isLastSection = !!sections && currentSectionIdx >= sections.length - 1;

  // ── Status check ────────────────────────────────────────────────────────────
  useEffect(() => {
    if (phase !== "gate") { setStatusLoading(false); return; }
    const check = async () => {
      try {
        const backendUrl = import.meta.env.VITE_BACKEND_URL || "http://localhost:4000";
        const res = await callBackend(`${backendUrl}/api/mock/status`);
        if (res.success) setMockStatus(res as MockStatusResponse);
      } catch (err) {
        console.error("[MockStatus] fetch failed:", err);
      } finally {
        setStatusLoading(false);
      }
    };
    void check();
  }, [phase]);

  // ── On entering a section: if it's ALREADY expired, skip it ─────────────────
  useEffect(() => {
    if (phase !== "session" || !currentSection || !sessionIdRef.current) return;
    const sid = sessionIdRef.current;
    const skill = currentSection.skill;

    if (prevSectionIdxRef.current !== currentSectionIdx) {
      expiryHandledRef.current = false;
      prevSectionIdxRef.current = currentSectionIdx;
    }

    if (isSectionStarted(sid, skill) && isSectionExpired(sid, skill)) {
      if (!expiryHandledRef.current) {
        expiryHandledRef.current = true;
        void triggerSectionExpiryRef.current?.();
      }
      return;
    }

    setTimeLeft(getSectionRemainingSec(sid, skill, currentSectionTotalSec));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, currentSectionIdx, currentSection?.skill]);

  // ── SECTION timer tick ──────────────────────────────────────────────────────
  useEffect(() => {
    if (phase !== "session" || !currentSection || !sessionIdRef.current) return;
    const sid = sessionIdRef.current;
    const skill = currentSection.skill;
    const total = currentSectionTotalSec;

    const tick = () => {
      if (!isSectionStarted(sid, skill)) { setTimeLeft(total); return; }
      const remaining = getSectionRemainingSec(sid, skill, total);
      setTimeLeft(remaining);
      if (remaining <= 0 && !expiryHandledRef.current) {
        expiryHandledRef.current = true;
        void triggerSectionExpiryRef.current?.();
      }
    };

    tick();
    const t = setInterval(tick, 1000);
    return () => clearInterval(t);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, currentSectionIdx, currentSection?.skill, currentSectionTotalSec]);

  // ── 24-HOUR overall window ──────────────────────────────────────────────────
  useEffect(() => {
    if (phase !== "session" && phase !== "interim") return;
    if (!sessionIdRef.current) return;
    const sid = sessionIdRef.current;

    const update = () => {
      const winMs = getWindowRemainingMs(sid);
      setWindowRemainingMs(winMs);
      if (winMs <= 0 && !windowExpiryHandledRef.current) {
        windowExpiryHandledRef.current = true;
        setIsRecording(false);
        setShowTimeUpModal(false);
        void (async () => {
          await flushCurrentAnswerRef.current?.();
          await runSubmitRef.current?.(false);
        })();
      }
    };

    update();
    const t = setInterval(update, 1000);
    return () => clearInterval(t);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase]);

  // ── Cleanup recording/debounce on question or section change ────────────────
  useEffect(() => {
    if (recognitionRef.current) {
      try { recognitionRef.current.stop(); } catch { /**/ }
      recognitionRef.current = null;
    }
    setIsRecording(false);
    setLiveTranscript("");
    if (writingDebounceRef.current) { clearTimeout(writingDebounceRef.current); writingDebounceRef.current = null; }
  }, [currentIdx, currentSectionIdx]);

  // ── Helpers ─────────────────────────────────────────────────────────────────

  const backendUrl = () => import.meta.env.VITE_BACKEND_URL || "http://localhost:4000";

  const persistAnswer = (questionId: string, answer: string): Promise<void> => {
    if (!sessionIdRef.current) return Promise.resolve();
    return callBackend(`${backendUrl()}/api/mock/answer`, {
      method: "POST", body: JSON.stringify({ session_id: sessionIdRef.current, question_id: questionId, answer })
    }).then(() => undefined).catch(e => console.warn("[Mock] answer save failed:", e));
  };

  const flushCurrentAnswer = useCallback(async () => {
    if (writingDebounceRef.current) { clearTimeout(writingDebounceRef.current); writingDebounceRef.current = null; }
    const q = currentSection?.questions[currentIdx];
    const a = q ? answers[q.id] : undefined;
    if (q && a) await persistAnswer(q.id, a);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentSection, currentIdx, answers]);
  useEffect(() => { flushCurrentAnswerRef.current = flushCurrentAnswer; }, [flushCurrentAnswer]);

  const persistWritingDebounced = (questionId: string, text: string) => {
    if (writingDebounceRef.current) clearTimeout(writingDebounceRef.current);
    writingDebounceRef.current = setTimeout(() => persistAnswer(questionId, text), 1500);
  };

  const startSpeakingRecording = (questionId: string) => {
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    transcriptAccumRef.current = "";
    setLiveTranscript("");
    setIsRecording(true);
    if (!SR) return;
    const rec = new SR();
    rec.continuous = true; rec.interimResults = true; rec.lang = "en-US";
    rec.onresult = (event: any) => {
      for (let i = event.resultIndex; i < event.results.length; i++) {
        if (event.results[i].isFinal)
          transcriptAccumRef.current = (transcriptAccumRef.current ? transcriptAccumRef.current + " " : "") + event.results[i][0].transcript.trim();
      }
      const last = event.results[event.results.length - 1];
      setLiveTranscript((transcriptAccumRef.current + (last.isFinal ? "" : " " + last[0].transcript)).trim());
    };
    rec.onerror = (e: any) => { if (e.error !== "aborted" && e.error !== "no-speech") console.warn("[Speech]", e.error); };
    recognitionRef.current = rec;
    try { rec.start(); } catch { /**/ }
  };

  const stopSpeakingRecording = (questionId: string) => {
    if (recognitionRef.current) { try { recognitionRef.current.stop(); } catch { /**/ } recognitionRef.current = null; }
    const final = transcriptAccumRef.current.trim();
    setIsRecording(false); setLiveTranscript("");
    const toSave = final || "[no transcript]";
    setAnswers(p => ({ ...p, [questionId]: toSave }));
    persistAnswer(questionId, toSave);
    setRecordedPrompts(p => ({ ...p, [questionId]: true }));
  };

  // ── Section expiry ──────────────────────────────────────────────────────────
  const triggerSectionExpiry = useCallback(async () => {
    setIsRecording(false);
    await flushCurrentAnswerRef.current?.();
    setExpiredSkill(currentSection?.skill ?? null);
    setShowTimeUpModal(true);
    setDisableInteraction(true);
  }, [currentSection?.skill]);
  useEffect(() => { triggerSectionExpiryRef.current = triggerSectionExpiry; }, [triggerSectionExpiry]);

  // ── Submit ──────────────────────────────────────────────────────────────────
  const runSubmit = useCallback(async (allowRetry: boolean) => {
    setShowTimeUpModal(false);
    setPhase("scoring");
    try {
      await flushCurrentAnswerRef.current?.();
      const res = await callBackend(`${backendUrl()}/api/mock/submit`, {
        method: "POST", body: JSON.stringify({ session_id: sessionIdRef.current })
      });
      if (res.success) {
        setSessionMomentum(res.momentum_awarded ?? 0);
        if (res.updated_momentum !== undefined) syncMomentum(res.updated_momentum);
        setMockResults(res);
        if (sessionIdRef.current) clearTimerState(sessionIdRef.current);
      }
    } catch (err) {
      console.error("[Mock] submit error:", err);
      if (allowRetry) { setPhase("session"); return; }
    }
    setTimeout(() => setPhase("results"), 3500);
  }, [syncMomentum]);
  useEffect(() => { runSubmitRef.current = runSubmit; }, [runSubmit]);

  // ── Begin / Resume mock ──────────────────────────────────────────────────────

  const beginMock = async (attemptType: "STANDARD" | "EARNED" = "STANDARD") => {
    setIsLoading(true);
    try {
      const res: MockSessionResponse = await callBackend(
        `${backendUrl()}/api/mock/questions?attempt_type=${attemptType}`
      );
      if (!res.success) { setIsLoading(false); return; }
      if (res.already_done) {
        const s = await callBackend(`${backendUrl()}/api/mock/status`);
        if (s.success) setMockStatus(s);
        setIsLoading(false); return;
      }
      sessionIdRef.current = res.session_id;
      setSessionId(res.session_id);
      setCourseId(res.course_id ?? null);
      setSections(transformSectionAudioUrls(res.sections));
      const startIdx   = res.current_section_idx ?? 0;
      const startSkill = res.sections[startIdx]?.skill ?? "LISTENING";
      setCurrentSectionIdx(startIdx);
      setCurrentIdx(0);
      setAnswers(res.saved_answers ?? {});
      setAudioState("idle");
      setShowPassage(false);
      setIsRecording(false);
      setShowTimeUpModal(false);
      setExpiredSkill(null);
      prevSectionIdxRef.current = null;
      windowExpiryHandledRef.current = false;
      expiryHandledRef.current = false;

      // Initialize the timer store
      const serverWindow = res.window_closes_at_ms ?? undefined;
      getTimerState(res.session_id, serverWindow);

      // Sync per-section deadlines from backend (synchronous).
      if (res.section_ends_at_ms) {
        Object.entries(res.section_ends_at_ms).forEach(([skill, endsAt]) => {
          setSectionEndsAt(res.session_id, skill, endsAt as number);
        });
      }

      // If the 24h window has already lapsed, auto-submit.
      if (isWindowExpired(res.session_id)) {
        setIsLoading(false);
        windowExpiryHandledRef.current = true;
        void runSubmit(false);
        return;
      }
      setWindowRemainingMs(getWindowRemainingMs(res.session_id));

      // ── Resume path: skip past any sections whose timers already expired ──
      if (res.resume) {
        const playableIdx = findNextPlayable(res.session_id, res.sections, startIdx);

        if (playableIdx === -1) {
          // Every remaining section expired while away → submit what's saved.
          setIsLoading(false);
          void runSubmit(false);
          return;
        }

        if (playableIdx > startIdx) {
          // Skipped one or more expired sections — land on interim.
          setCurrentSectionIdx(playableIdx - 1);
          setPhase("interim");
          return;
        }

        // Current section still playable — drop straight into it.
        setCurrentSectionIdx(playableIdx);
        setPhase("session");
        return;
      }

      // ── Fresh start path ──
      const showIntro = startSkill === "LISTENING";
      setPhase(showIntro ? "listening_intro" : "session");
    } catch (err) {
      console.error("[Mock] begin error:", err);
    } finally {
      setIsLoading(false);
    }
  };
  // ── Explicit section starts ─────────────────────────────────────────────────

  const startListeningSection = () => {
    const sid = sessionIdRef.current;
    const skill = sections?.[currentSectionIdx]?.skill;
    if (sid && skill) startSection(sid, skill, getSectionDurationSec(skill, courseId));
    setPhase("session");
  };

  const handleSectionComplete = useCallback(async () => {
    if (!sections) return;
    if (currentSectionIdx < sections.length - 1) {
      setPhase("interim");
    } else {
      await runSubmit(true);
    }
  }, [sections, currentSectionIdx, runSubmit]);

  // Interim "Continue to Section N" — starts the NEXT playable section's timer.
  const advanceToNextSection = () => {
    const sid = sessionIdRef.current;
    if (!sid || !sections) return;

    // Skip past any sections that expired while on interim / away.
    const nextIdx = findNextPlayable(sid, sections, currentSectionIdx + 1);

    if (nextIdx === -1) {
      // Nothing left → submit.
      void runSubmit(true);
      return;
    }

    if (audioRef.current && !audioRef.current.paused) { audioRef.current.pause(); audioRef.current.currentTime = 0; }

    const nextSkill = sections[nextIdx].skill;
    // Start the section timer NOW (explicit click).
    if (!isSectionStarted(sid, nextSkill)) {
      startSection(sid, nextSkill, getSectionDurationSec(nextSkill, courseId));
    }

    // Stamp navigation position on backend.
    callBackend(`${backendUrl()}/api/mock/answer`, {
      method: "POST", body: JSON.stringify({ session_id: sid, section_advance: nextIdx })
    }).catch(e => console.warn("[Mock] section advance failed:", e));

    setCurrentSectionIdx(nextIdx);
    setCurrentIdx(0);
    setAudioState("idle"); setShowPassage(false); setIsRecording(false);
    setShowTimeUpModal(false); setExpiredSkill(null); setDisableInteraction(false);
    setPhase("session");
  };

  // Modal "Continue" — dismiss the time-up modal and move on.
  const handleTimeUpContinue = () => {
    setShowTimeUpModal(false);
    setDisableInteraction(false);
    const sid = sessionIdRef.current;
    // If no playable sections remain, submit immediately.
    if (!sid || !sections || findNextPlayable(sid, sections, currentSectionIdx + 1) === -1) {
      void runSubmit(true);
    } else {
      setPhase("interim");
    }
  };

  const handleNextQuestion = useCallback(() => {
    if (!currentSection) return;
    const totalQ   = currentSection.questions.length;
    const currentQ = currentSection.questions[currentIdx];
    if (writingDebounceRef.current) { clearTimeout(writingDebounceRef.current); writingDebounceRef.current = null; }
    const currentAnswer = answers[currentQ?.id ?? ""];
    if (currentQ && currentAnswer) persistAnswer(currentQ.id, currentAnswer);
    if (currentIdx < totalQ - 1) { setCurrentIdx(i => i + 1); setIsRecording(false); }
    else void handleSectionComplete();
  }, [currentIdx, currentSection, answers, handleSectionComplete]);

  // ═══════════════════════════════════════════════════════════════════════════
  // GATE SCREENS
  // ═══════════════════════════════════════════════════════════════════════════

  const renderCriteriaRow = (met: boolean, label: string, detail?: string) => (
    <div className={`flex items-start gap-3 p-3 rounded-xl border ${met ? "bg-emerald-50 border-emerald-200" : "bg-slate-50 border-slate-200"}`}>
      <div className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 ${met ? "bg-emerald-500" : "bg-slate-300"}`}>
        {met ? <CheckCircle2 className="w-3 h-3 text-white" /> : <XCircle className="w-3 h-3 text-white" />}
      </div>
      <div>
        <p className={`text-xs font-semibold uppercase tracking-wider ${met ? "text-emerald-700" : "text-slate-600"}`}>{label}</p>
        {detail && <p className={`text-xs font-medium mt-0.5 ${met ? "text-emerald-600" : "text-slate-400"}`}>{detail}</p>}
      </div>
    </div>
  );

  const renderNotEligible = () => {
    const p = mockStatus!.progress;
    const allSkills = ["LISTENING", "READING", "WRITING", "SPEAKING"];
    const skillsMet = allSkills.every(s => p.ia_per_skill[s]);
    return (
      <div className="max-w-2xl mx-auto animate-fade-in pt-12 px-4">
        <div className="bg-white border border-slate-200 rounded-2xl p-8 shadow-md">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 bg-slate-100 border border-slate-200 rounded-xl flex items-center justify-center">
              <Lock className="w-6 h-6 text-slate-500" />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Not Yet Unlocked</p>
              <h2 className="text-2xl font-semibold text-slate-900 tracking-tight">Mock IELTS</h2>
            </div>
          </div>

          <p className="text-slate-500 font-medium text-sm mb-6">Complete all requirements below to unlock your Mock test.</p>

          <div className="flex flex-col gap-3 mb-8">
            {renderCriteriaRow(
              p.ia_completed >= p.ia_required,
              `${p.ia_completed} / ${p.ia_required} IAs Completed`,
              p.ia_completed < p.ia_required ? `${p.ia_required - p.ia_completed} more IA${p.ia_required - p.ia_completed !== 1 ? "s" : ""} needed` : "Requirement met"
            )}
            {renderCriteriaRow(
              skillsMet,
              "At Least 1 IA Per Skill",
              (() => {
                const missing = allSkills.filter(s => !p.ia_per_skill[s]);
                if (missing.length === 0) return "All 4 skills covered";
                return `Missing: ${missing.map(s => SKILL_LABEL[s]).join(", ")}`;
              })()
            )}
            {renderCriteriaRow(
              p.band_improved,
              `Band Improved ≥ 0.5 from Diagnostic`,
              p.band_improved
                ? `Best: +${p.best_improvement.toFixed(1)} on ${SKILL_LABEL[p.improved_skill ?? ""]}`
                : `Best improvement so far: +${p.best_improvement.toFixed(1)} (need ≥ 0.5)`
            )}
          </div>

          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 mb-6">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-3">Skill Coverage</p>
            <div className="grid grid-cols-4 gap-2">
              {allSkills.map(skill => {
                const a = accent(skill);
                const covered = p.ia_per_skill[skill];
                return (
                  <div key={skill} className={`flex flex-col items-center gap-1.5 p-2.5 rounded-lg border ${covered ? `${a.bg} ${a.border}` : "bg-white border-slate-200"}`}>
                    <span className="text-xl">{SKILL_ICON[skill]}</span>
                    <span className={`text-[10px] font-semibold uppercase tracking-wider ${covered ? a.text : "text-slate-400"}`}>
                      {SKILL_LABEL[skill].slice(0, 3)}
                    </span>
                    {covered
                      ? <CheckCircle2 className={`w-3.5 h-3.5 ${a.text}`} />
                      : <div className="w-3.5 h-3.5 rounded-full border-2 border-slate-300" />
                    }
                  </div>
                );
              })}
            </div>
          </div>

          <button onClick={() => navigate("/student/dashboard")}
            className="w-full py-3 border border-slate-200 rounded-xl font-medium text-sm text-slate-500 hover:bg-slate-50 transition-colors">
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  };

  const renderMockAvailable = () => (
    <div className="max-w-2xl mx-auto animate-fade-in pt-12 px-4">
      <div className="bg-white border border-slate-200 rounded-2xl p-8 sm:p-10 shadow-md">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-lg bg-indigo-600 text-white text-xs font-semibold tracking-wider uppercase mb-6 shadow-sm">
          <Trophy className="w-4 h-4" /> Full Mock IELTS
        </div>
        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 mb-6 flex items-center gap-3">
          <CheckCircle2 className="w-6 h-6 text-emerald-600 flex-shrink-0" />
          <div>
            <p className="font-semibold text-emerald-800 text-sm uppercase tracking-wider">All Requirements Met</p>
            <p className="text-xs text-emerald-600 font-medium">{mockStatus!.progress.ia_completed} IAs · All 4 skills covered · Band improved +{mockStatus!.progress.best_improvement.toFixed(1)}</p>
          </div>
        </div>
        <h1 className="text-4xl font-bold text-slate-900 tracking-tight mb-3">Ready for Your<br /><span className="text-indigo-600">Mock IELTS?</span></h1>
        <p className="text-slate-500 font-medium text-sm mb-6 leading-relaxed">
          A full-length IELTS simulation across all 4 skills. Each section has its own fixed timer that starts when you begin it and does not pause. The whole mock must be finished within 24 hours of starting. Your Real Band score updates after this session.
        </p>
        <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-4 mb-6 flex items-start gap-3">
          <Hourglass className="w-5 h-5 text-indigo-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold text-indigo-800 text-sm">24-hour completion window</p>
            <p className="text-xs text-indigo-600 font-medium">Each section timer runs continuously once started — if it runs out, that section closes and you move on to the next. The overall 24-hour clock never stops; when it ends, whatever you've completed is submitted automatically.</p>
          </div>
        </div>
        <div className="grid grid-cols-4 gap-2 mb-8">
          {[
            { skill: "LISTENING", time: "30 min" },
            { skill: "READING",   time: "60 min" },
            { skill: "WRITING",   time: "60 min" },
            { skill: "SPEAKING",  time: "15 min" },
          ].map(s => {
            const a = accent(s.skill);
            return (
              <div key={s.skill} className={`${a.bg} border ${a.border} rounded-xl p-3 flex flex-col items-center gap-1.5`}>
                <span className="text-2xl">{SKILL_ICON[s.skill]}</span>
                <span className={`text-[10px] font-semibold uppercase tracking-wider ${a.text}`}>{s.skill.slice(0, 3)}</span>
                <span className="text-[10px] font-medium text-slate-400 flex items-center gap-0.5"><Clock className="w-2.5 h-2.5" /> {s.time}</span>
              </div>
            );
          })}
        </div>
        <div className="flex flex-col gap-3">
          <button onClick={() => void beginMock("STANDARD")} disabled={isLoading}
            className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white border-none font-semibold text-base uppercase tracking-wide py-4 rounded-xl flex items-center justify-center gap-2 shadow-sm hover:shadow-md transition-all">
            {isLoading ? <><Loader2 className="w-4 h-4 animate-spin" /> Loading…</> : <>Start Mock Test <ArrowRight className="w-5 h-5" /></>}
          </button>
          <button onClick={() => navigate("/student/dashboard")}
            className="w-full py-3 border border-slate-200 rounded-xl font-medium text-sm text-slate-500 hover:bg-slate-50 transition-colors">
            Cancel
          </button>
        </div>
        {mockStatus!.can_start_earned && (
          <div className="mt-6 border-t border-slate-100 pt-6">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-3">Or Exchange Momentum</p>
            <button onClick={() => void beginMock("EARNED")} disabled={isLoading}
              className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white border-none rounded-xl py-3 font-semibold text-sm uppercase tracking-wide flex items-center justify-center gap-2 shadow-sm hover:shadow-md transition-all">
              <Zap className="w-4 h-4 text-amber-300 fill-amber-300" />
              Extra Mock — {mockStatus!.earned_mock_cost.toLocaleString()} Momentum
            </button>
            <p className="text-[10px] text-slate-400 font-medium text-center mt-2">You have {mockStatus!.momentum_score.toLocaleString()} pts · Max 2 mocks / month</p>
          </div>
        )}
      </div>
    </div>
  );

  const renderSlotExpired = () => (
    <div className="max-w-2xl mx-auto animate-fade-in pt-12 px-4">
      <div className="bg-white border border-slate-200 rounded-2xl p-8 shadow-md">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 bg-amber-50 border border-amber-200 rounded-xl flex items-center justify-center">
            <Calendar className="w-6 h-6 text-amber-600" />
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">This Month</p>
            <h2 className="text-2xl font-semibold text-slate-900 tracking-tight">Session Expired</h2>
          </div>
        </div>
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6">
          <p className="font-semibold text-amber-800 text-sm mb-1">24-hour window closed without submission</p>
          <p className="text-amber-700 text-sm">Your standard slot for this month has been consumed. No penalty — just no score recorded.</p>
        </div>
        <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-4 mb-6 flex items-center gap-3">
          <Calendar className="w-5 h-5 text-indigo-600 flex-shrink-0" />
          <div>
            <p className="font-semibold text-indigo-800 text-sm">Next standard slot opens</p>
            <p className="text-indigo-600 font-medium text-sm">{firstOfNextMonth()}</p>
          </div>
        </div>
        {mockStatus!.can_start_earned && (
          <div className="mb-4">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">Still want a mock this month?</p>
            <button onClick={() => void beginMock("EARNED")} disabled={isLoading}
              className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white border-none rounded-xl py-3 font-semibold text-sm uppercase tracking-wide flex items-center justify-center gap-2 shadow-sm hover:shadow-md transition-all">
              <Zap className="w-4 h-4 text-amber-300 fill-amber-300" />
              Exchange {mockStatus!.earned_mock_cost.toLocaleString()} Momentum for Extra Mock
            </button>
          </div>
        )}
        <button onClick={() => navigate("/student/dashboard")}
          className="w-full py-3 border border-slate-200 rounded-xl font-medium text-sm text-slate-500 hover:bg-slate-50 transition-colors">
          Back to Dashboard
        </button>
      </div>
    </div>
  );

  const renderMonthUsed = () => (
    <div className="max-w-2xl mx-auto animate-fade-in pt-12 px-4">
      <div className="bg-white border border-slate-200 rounded-2xl p-8 shadow-md">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center justify-center">
            <CheckCircle2 className="w-6 h-6 text-emerald-600" />
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">This Month</p>
            <h2 className="text-2xl font-semibold text-slate-900 tracking-tight">Mock Completed</h2>
          </div>
        </div>
        <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-4 mb-6 flex items-center gap-3">
          <Calendar className="w-5 h-5 text-indigo-600 flex-shrink-0" />
          <div>
            <p className="font-semibold text-indigo-800 text-sm">Next standard mock available</p>
            <p className="text-indigo-600 font-medium text-sm">{firstOfNextMonth()}</p>
          </div>
        </div>
        <p className="text-slate-500 text-sm font-medium mb-6">
          One standard mock per calendar month keeps your progress meaningful. Your Real Band has been updated — keep drilling to build on it.
        </p>
        {mockStatus!.can_start_earned && (
          <div className="mb-4">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">Want an extra mock this month?</p>
            <button onClick={() => void beginMock("EARNED")} disabled={isLoading}
              className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white border-none rounded-xl py-3 font-semibold text-sm uppercase tracking-wide flex items-center justify-center gap-2 shadow-sm hover:shadow-md transition-all">
              <Zap className="w-4 h-4 text-amber-300 fill-amber-300" />
              Exchange {mockStatus!.earned_mock_cost.toLocaleString()} Momentum for Extra Mock
            </button>
          </div>
        )}
        <button onClick={() => navigate("/student/dashboard")}
          className="w-full py-3 border border-slate-200 rounded-xl font-medium text-sm text-slate-500 hover:bg-slate-50 transition-colors">
          Back to Dashboard
        </button>
      </div>
    </div>
  );

  const renderActiveSession = () => (
    <div className="max-w-2xl mx-auto animate-fade-in pt-12 px-4">
      <div className="bg-white border border-slate-200 rounded-2xl p-8 shadow-md">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 bg-amber-50 border border-amber-200 rounded-xl flex items-center justify-center text-2xl">⏱</div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">In Progress</p>
            <h2 className="text-2xl font-semibold text-slate-900 tracking-tight">Resume Mock</h2>
          </div>
        </div>
        <p className="text-slate-500 text-sm font-medium mb-6">
          You have an active mock session. Section timers keep running whether you're here or not — if a section's time ran out while you were away, you'll move on to the next one. You must still be inside the 24-hour window.
        </p>
        <button onClick={() => void beginMock("STANDARD")} disabled={isLoading}
          className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white border-none font-semibold text-base uppercase tracking-wide py-4 rounded-xl flex items-center justify-center gap-2 shadow-sm hover:shadow-md transition-all">
          {isLoading ? <><Loader2 className="w-4 h-4 animate-spin" /> Loading…</> : <>Continue Mock <ArrowRight className="w-5 h-5" /></>}
        </button>
        <button onClick={() => navigate("/student/dashboard")} className="w-full py-3 mt-3 border border-slate-200 rounded-xl font-medium text-sm text-slate-500 hover:bg-slate-50 transition-colors">
          Back to Dashboard
        </button>
      </div>
    </div>
  );

  const renderGate = () => {
    if (statusLoading || !mockStatus) {
      return (
        <div className="min-h-screen flex items-center justify-center">
          <Loader2 className="w-10 h-10 text-indigo-600 animate-spin" />
        </div>
      );
    }
    if (mockStatus.has_active_session) return renderActiveSession();
    if (!mockStatus.is_eligible)        return renderNotEligible();
    if (mockStatus.standard_session_status === 'ABANDONED') return renderSlotExpired();
    if (mockStatus.standard_used_this_month)                return renderMonthUsed();
    return renderMockAvailable();
  };

  // ═══════════════════════════════════════════════════════════════════════════
  // LISTENING INTRO GATE
  // ═══════════════════════════════════════════════════════════════════════════

  const renderListeningIntro = () => (
    <div className="max-w-2xl mx-auto animate-fade-in pt-12 px-4">
      <div className="bg-white border border-slate-200 rounded-2xl p-8 sm:p-10 shadow-md">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-lg bg-teal-600 text-white text-xs font-semibold tracking-wider uppercase mb-6 shadow-sm">
          <span className="text-base leading-none">🎧</span> Section 1 · Listening · 30 min
        </div>
        <h1 className="text-3xl sm:text-4xl font-bold text-slate-900 tracking-tight mb-2">
          Before you begin
        </h1>
        <p className="text-slate-500 font-medium text-sm mb-8 leading-relaxed">
          Complete each set of questions as you listen. There's no separate transfer time. This section has its own 30-minute timer that starts when you click Start — and does not pause.
        </p>
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-5 mb-5 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold text-amber-800 text-sm mb-1">Audio plays once, like the real exam.</p>
            <p className="text-amber-700 text-xs font-medium leading-relaxed">You cannot pause, rewind, or replay any recording. Scan the questions before the audio starts.</p>
          </div>
        </div>
        <ul className="flex flex-col gap-2.5 mb-8">
          {[
            "Use a quiet environment and headphones if possible.",
            "The 30-minute timer starts the moment you click Start — and keeps running even if you leave.",
            "If the timer runs out, this section closes and you move on to the next.",
            "The overall 24-hour clock runs the whole time, across all sections.",
            "Answer as you listen — audio will not repeat.",
          ].map((tip, i) => (
            <li key={i} className="flex items-start gap-2.5 text-sm text-slate-600 font-medium">
              <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0 mt-0.5" />
              <span>{tip}</span>
            </li>
          ))}
        </ul>
        <button
          onClick={startListeningSection}
          className="w-full bg-indigo-600 hover:bg-indigo-700 text-white border-none font-semibold text-base uppercase tracking-wide py-4 rounded-xl flex items-center justify-center gap-2 shadow-sm hover:shadow-md transition-all"
        >
          Start Listening Section <ArrowRight className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
  // ═══════════════════════════════════════════════════════════════════════════
  // SESSION SCREEN
  // ═══════════════════════════════════════════════════════════════════════════

  const renderSession = () => {
    if (isLoading || !currentSection) {
      return (
        <div className="min-h-[70vh] flex flex-col items-center justify-center animate-fade-in">
          <Loader2 className="w-12 h-12 text-indigo-600 animate-spin mb-4" />
          <p className="text-slate-500 font-semibold uppercase tracking-wider text-sm">Loading Questions…</p>
        </div>
      );
    }

    const currentQ = currentSection.questions[currentIdx];
    const totalQ   = currentSection.questions.length;
    if (!currentQ) return null;

    const optionsMap  = (currentQ.options && !Array.isArray(currentQ.options)) ? currentQ.options as Record<string, string> : {};
    const optionKeys  = Object.keys(optionsMap).filter(k => optionsMap[k] != null);

    let canProceed = false;
    if (currentQ.question_type === "SPEAKING_PROMPT") canProceed = !!(answers[currentQ.id]?.trim());
    else if (currentQ.question_type === "WRITING_PROMPT") canProceed = (answers[currentQ.id]?.trim().split(/\s+/).filter(Boolean).length ?? 0) >= 10;
    else canProceed = !!answers[currentQ.id];

    return (
      <div className={`max-w-6xl mx-auto pt-6 pb-16 px-4 animate-fade-in transition-opacity ${disableInteraction ? "pointer-events-none opacity-40" : ""}`}>

        {/* Section progress pills */}
        <div className="flex items-center justify-center gap-3 mb-8">
          {sections?.map((sec, i) => {
            const a = accent(sec.skill);
            const done = i < currentSectionIdx;
            const active = i === currentSectionIdx;
            return (
              <div key={i} className="flex items-center gap-3">
                <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border font-semibold text-xs uppercase tracking-wider ${
                  done ? "bg-emerald-50 border-emerald-200 text-emerald-700" :
                  active ? `${a.bg} ${a.border} ${a.text}` : "bg-white border-slate-200 text-slate-400"
                }`}>
                  {done ? <CheckCircle2 className="w-4 h-4" /> : <span>{SKILL_ICON[sec.skill] ?? "📝"}</span>}
                  <span className="hidden sm:inline">{SKILL_LABEL[sec.skill] ?? sec.skill}</span>
                </div>
                {i < (sections?.length ?? 1) - 1 && <div className={`w-6 h-1 rounded-full ${done ? "bg-emerald-300" : "bg-slate-200"}`} />}
              </div>
            );
          })}
        </div>

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 mb-6 gap-4 shadow-sm">
          <div className="flex items-center gap-4">
            <div className={`w-14 h-14 ${accent(currentSection.skill).bg} border ${accent(currentSection.skill).border} rounded-xl flex items-center justify-center text-3xl`}>
              {SKILL_ICON[currentSection.skill] ?? "📝"}
            </div>
            <div>
              <p className="text-slate-900 font-semibold text-lg uppercase tracking-wide">{SKILL_LABEL[currentSection.skill] ?? currentSection.skill}</p>
              <p className="text-slate-500 text-xs font-medium uppercase tracking-wider mt-1">Question {currentIdx + 1} of {totalQ}</p>
            </div>
          </div>
          {/* Timer cluster */}
          <div className="flex items-center gap-3 self-end sm:self-auto">
            {/* Section timer — primary */}
            <div className={`relative flex items-center gap-3 px-4 py-2.5 rounded-xl border transition-colors ${
              timeLeft <= 60 ? "bg-rose-50 border-rose-200" :
              timeLeft <= 300 ? "bg-amber-50 border-amber-200" :
              `${accent(currentSection.skill).bg} ${accent(currentSection.skill).border}`
            }`}>
              <CircleTimer
                timeLeft={timeLeft}
                total={currentSectionTotalSec}
                size={44}
                stroke={accent(currentSection.skill).stroke}
              />
              <div>
                <p className={`text-[9px] font-bold uppercase tracking-widest ${
                  timeLeft <= 60 ? "text-rose-500" :
                  timeLeft <= 300 ? "text-amber-600" :
                  accent(currentSection.skill).text
                }`}>
                  {SKILL_LABEL[currentSection.skill] ?? "Section"}
                </p>
                <p className={`text-xl font-black tabular-nums leading-none tracking-tight ${
                  timeLeft <= 60 ? "text-rose-600 animate-pulse" :
                  timeLeft <= 300 ? "text-amber-700" :
                  "text-slate-900"
                }`}>
                  {formatTime(timeLeft)}
                </p>
              </div>
              {timeLeft <= 60 && (
                <span className="absolute -top-1.5 -right-1.5 flex h-3.5 w-3.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-rose-500" />
                </span>
              )}
            </div>
            {/* 24h window — secondary */}
            {windowRemainingMs != null && (
              <div className={`hidden sm:flex items-center gap-2 px-3 py-2.5 rounded-xl border ${
                windowRemainingMs < 60 * 60 * 1000 ? "bg-rose-50 border-rose-200" : "bg-slate-50 border-slate-200"
              }`}>
                <Hourglass className={`w-3.5 h-3.5 flex-shrink-0 ${
                  windowRemainingMs < 60 * 60 * 1000 ? "text-rose-500" : "text-slate-400"
                }`} />
                <div>
                  <p className="text-[8px] font-bold uppercase tracking-widest text-slate-400">24h</p>
                  <p className={`text-xs font-bold tabular-nums leading-none ${
                    windowRemainingMs < 60 * 60 * 1000 ? "text-rose-600" : "text-slate-500"
                  }`}>
                    {formatHMS(Math.floor(windowRemainingMs / 1000))}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Split layout */}
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Left: audio or passage */}
          <div className="w-full lg:w-1/2 flex flex-col gap-4">
            {currentSection.section_type === "AUDIO" && currentSection.audio_url ? (
              <div className="bg-teal-50 border border-teal-200 rounded-2xl p-8 text-center flex flex-col items-center shadow-sm">
                <button onClick={() => { if (audioState === "idle" && audioRef.current) { audioRef.current.play(); setAudioState("playing"); } }}
                  disabled={audioState !== "idle"}
                  className={`w-24 h-24 rounded-full flex items-center justify-center text-white mb-6 shadow-md transition-colors ${audioState === "idle" ? "bg-teal-600 hover:bg-teal-700" : audioState === "playing" ? "bg-amber-500" : "bg-emerald-500"}`}>
                  {audioState === "idle" && <PlayCircle className="w-12 h-12 ml-1" />}
                  {audioState === "playing" && <div className="flex items-center gap-1.5 h-10">{animBars.slice(0,4).map((h,i) => <div key={i} className="w-2 bg-white rounded-full animate-pulse" style={{ height: `${20+h*40}px`, animationDelay: `${i*0.15}s` }} />)}</div>}
                  {audioState === "played" && <CheckCircle2 className="w-12 h-12" />}
                </button>
                <p className="text-slate-900 font-semibold text-lg uppercase tracking-wide mb-2">Listening Audio</p>
                <p className="text-slate-600 font-medium text-sm">{audioState === "played" ? "Playback complete — answer the questions." : "Listen carefully. Audio plays once."}</p>
                <audio ref={audioRef} src={currentSection.audio_url} preload="auto" onEnded={() => setAudioState("played")} />
              </div>
            ) : currentSection.section_type === "PASSAGE" && currentSection.passage_text ? (
              <div className="bg-white border border-slate-200 rounded-2xl flex flex-col max-h-[700px] shadow-sm">
                <div className="p-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between rounded-t-2xl">
                  <span className="font-semibold text-sm uppercase tracking-wider text-slate-500">Reading Passage</span>
                  <button onClick={() => setShowPassage(!showPassage)} className="lg:hidden font-semibold text-xs text-purple-600 uppercase">{showPassage ? "Hide" : "Show"}</button>
                </div>
                <div className={`p-6 overflow-y-auto flex-1 ${!showPassage ? "hidden lg:block" : "block"}`}>
                  <p className="font-serif text-slate-800 text-base leading-loose whitespace-pre-wrap">{currentSection.passage_text}</p>
                </div>
              </div>
            ) : (
              <div className={`${accent(currentSection.skill).bg} border ${accent(currentSection.skill).border} rounded-2xl p-6 hidden lg:flex flex-col items-center justify-center text-center gap-4`}>
                <span className="text-6xl">{SKILL_ICON[currentSection.skill] ?? "📝"}</span>
                <p className="font-semibold text-slate-900 uppercase tracking-wide">{SKILL_LABEL[currentSection.skill] ?? currentSection.skill}</p>
                <p className="text-slate-400 text-sm font-medium">Section {currentSectionIdx + 1} of {sections?.length}</p>
              </div>
            )}
          </div>

          {/* Right: question + input */}
          <div className="w-full lg:w-1/2 flex flex-col gap-4">
            <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 shadow-sm">
              <div className="flex justify-between items-center mb-6">
                <span className="bg-slate-100 text-slate-500 text-xs font-semibold uppercase tracking-wider px-4 py-1.5 rounded-lg border border-slate-200">Q {currentIdx+1} / {totalQ}</span>
                <span className="bg-indigo-50 text-indigo-700 border border-indigo-200 text-[10px] font-semibold uppercase tracking-wider px-3 py-1.5 rounded-lg">{currentQ.question_type.replace("_", " ")}</span>
              </div>

              <h3 className="text-xl font-semibold text-slate-900 mb-8 leading-snug">
                {currentQ.question_type === "SPEAKING_PROMPT" ? `"${currentQ.prompt_text}"` : currentQ.prompt_text}
              </h3>

              {/* MCQ */}
              {currentQ.question_type === "MCQ" && optionKeys.length > 0 && (
                <div className="flex flex-col gap-3">
                  {optionKeys.map(key => {
                    const selected = answers[currentQ.id] === key;
                    return (
                      <button key={key} onClick={() => setAnswers(p => ({ ...p, [currentQ.id]: key }))}
                        className={`text-left p-4 rounded-xl border font-medium text-sm transition-all flex items-start gap-3 ${selected ? "bg-indigo-600 border-indigo-600 text-white shadow-sm" : "bg-white border-slate-200 text-slate-700 hover:border-indigo-300 hover:bg-slate-50"}`}>
                        <span className={`w-6 h-6 flex-shrink-0 rounded-lg border flex items-center justify-center font-semibold text-xs ${selected ? "border-white text-white" : "border-slate-300 text-slate-500"}`}>{key}</span>
                        <span>{optionsMap[key]}</span>
                      </button>
                    );
                  })}
                </div>
              )}

              {/* TFNG */}
              {currentQ.question_type === "TFNG" && (
                <div className="flex flex-col gap-3">
                  {["TRUE", "FALSE", "NOT GIVEN"].map(val => {
                    const selected = answers[currentQ.id] === val;
                    const color = val === "TRUE" ? "bg-emerald-500" : val === "FALSE" ? "bg-rose-500" : "bg-amber-500";
                    return (
                      <button key={val} onClick={() => setAnswers(p => ({ ...p, [currentQ.id]: val }))}
                        className={`p-4 rounded-xl border font-semibold text-sm uppercase tracking-wide transition-all ${selected ? `${color} border-transparent text-white shadow-sm` : "bg-white border-slate-200 text-slate-700 hover:border-slate-300 hover:bg-slate-50"}`}>
                        {val}
                      </button>
                    );
                  })}
                </div>
              )}

              {/* WRITING_PROMPT */}
              {currentQ.question_type === "WRITING_PROMPT" && (
                <div>
                  <textarea rows={8} placeholder="Write your response here (minimum 10 words)…"
                    value={answers[currentQ.id] || ""}
                    onChange={e => { const text = e.target.value; setAnswers(p => ({ ...p, [currentQ.id]: text })); persistWritingDebounced(currentQ.id, text); }}
                    onPaste={e => { e.preventDefault(); flashPasteBlocked(); }}
                    onCopy={e => { e.preventDefault(); flashPasteBlocked(); }}
                    onCut={e => { e.preventDefault(); flashPasteBlocked(); }}
                    onDrop={e => { e.preventDefault(); flashPasteBlocked(); }}
                    className="w-full p-5 border border-slate-200 rounded-xl text-base text-slate-900 font-medium outline-none focus:ring-2 focus:ring-indigo-200 focus:border-indigo-300 bg-slate-50 resize-none transition-all" />
                  <div className="flex justify-between mt-2">
                    <p className="text-xs text-slate-400 font-medium">{(answers[currentQ.id] ?? "").trim().split(/\s+/).filter(Boolean).length} words</p>
                    {pasteBlocked
                      ? <p className="text-xs text-rose-500 font-semibold animate-pulse">Copy/paste disabled</p>
                      : <p className="text-[10px] text-slate-300 font-medium">Auto-saved</p>
                    }
                  </div>
                </div>
              )}

              {/* SPEAKING_PROMPT */}
              {currentQ.question_type === "SPEAKING_PROMPT" && (() => {
                const hasTranscript = !!(answers[currentQ.id]?.trim()) && answers[currentQ.id] !== "[no transcript]";
                return (
                  <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6">
                    {isRecording ? (
                      <div className="flex flex-col items-center gap-4">
                        <div className="flex items-center gap-1.5 h-10">
                          {animBars.slice(0, 10).map((h, i) => <div key={i} className="w-1.5 bg-rose-500 rounded-full animate-pulse" style={{ height: `${10+h*28}px`, animationDelay: `${i*0.09}s` }} />)}
                        </div>
                        {liveTranscript && <div className="w-full bg-white border border-slate-200 rounded-xl p-3 text-sm text-slate-700 font-medium italic min-h-[56px] max-h-[120px] overflow-y-auto">"{liveTranscript}"</div>}
                        <button onClick={() => stopSpeakingRecording(currentQ.id)}
                          className="bg-rose-500 hover:bg-rose-600 text-white font-semibold text-sm px-8 py-3 rounded-xl uppercase tracking-wide shadow-sm hover:shadow-md transition-all">
                          Stop &amp; Save
                        </button>
                      </div>
                    ) : hasTranscript ? (
                      <div className="flex flex-col gap-3">
                        <div className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-600" /><span className="text-xs font-semibold uppercase tracking-wider text-emerald-700">Response Saved</span></div>
                        <div className="bg-white border border-emerald-200 rounded-xl p-4 text-sm text-slate-700 font-medium italic max-h-[120px] overflow-y-auto">"{answers[currentQ.id]}"</div>
                        <button onClick={() => startSpeakingRecording(currentQ.id)}
                          className="text-sm font-semibold uppercase tracking-wide px-6 py-3 rounded-xl border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 self-start shadow-sm transition-colors">Re-record Answer</button>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center gap-4 text-center">
                        <div className="w-16 h-16 rounded-full bg-rose-50 border border-rose-200 flex items-center justify-center"><Mic className="w-8 h-8 text-rose-500" /></div>
                        <p className="text-sm text-slate-600 font-medium max-w-xs">Tap the button and speak your answer. Your response will be transcribed automatically.</p>
                        <button onClick={() => startSpeakingRecording(currentQ.id)}
                          className="bg-indigo-600 hover:bg-indigo-700 text-white border-none font-semibold text-sm uppercase tracking-wide px-8 py-4 rounded-xl shadow-sm hover:shadow-md transition-all">Start Speaking</button>
                      </div>
                    )}
                  </div>
                );
              })()}

              {/* Navigation */}
              <div className="mt-8 flex gap-4">
                <button onClick={() => setCurrentIdx(i => i - 1)} disabled={currentIdx === 0}
                  className="px-6 py-4 border border-slate-200 rounded-xl font-semibold text-slate-600 disabled:opacity-30 hover:bg-slate-50 uppercase text-sm tracking-wide transition-colors">
                  Prev
                </button>
                <button onClick={handleNextQuestion}
                  disabled={!canProceed || (currentQ.question_type === "SPEAKING_PROMPT" && isRecording)}
                  className={`flex-1 font-semibold text-sm uppercase tracking-wide border-none rounded-xl py-4 transition-all ${!canProceed ? "bg-slate-100 text-slate-400 opacity-60 cursor-not-allowed" : "bg-indigo-600 text-white hover:bg-indigo-700 shadow-sm hover:shadow-md"}`}>
                  {currentIdx === totalQ - 1
                    ? (currentSectionIdx < (sections?.length ?? 1) - 1 ? "Complete Section →" : "Submit Mock →")
                    : "Next Question →"}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // ═══════════════════════════════════════════════════════════════════════════
  // INTERIM / SCORING / RESULTS
  // ═══════════════════════════════════════════════════════════════════════════

  const renderInterim = () => {
    const sid = sessionIdRef.current;
    // Find the first section that's still playable.
    const nextPlayableIdx = (sid && sections) ? findNextPlayable(sid, sections, currentSectionIdx + 1) : -1;
    const nextSec = nextPlayableIdx !== -1 ? sections?.[nextPlayableIdx] ?? null : null;

    // If nothing left (edge case — timer expired while staring at interim), submit.
    if (!nextSec) {
      void runSubmit(true);
      return null;
    }

    const nextDurMin = Math.round(getSectionDurationSec(nextSec.skill, courseId) / 60);
    const windowSec = windowRemainingMs != null ? Math.floor(windowRemainingMs / 1000) : 0;
    const windowUrgent = windowRemainingMs != null && windowRemainingMs < 60 * 60 * 1000;

    return (
      <div className="min-h-[70vh] flex items-center justify-center animate-fade-in px-4 pt-12">
        <div className="max-w-lg w-full bg-white border border-slate-200 rounded-2xl p-10 text-center shadow-md">
          <div className="w-20 h-20 bg-emerald-50 border border-emerald-200 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle2 className="w-10 h-10 text-emerald-600" />
          </div>
          <h2 className="text-3xl font-bold text-slate-900 tracking-tight mb-2">Section {currentSectionIdx + 1} Complete</h2>
          <p className="text-slate-500 font-medium mb-6">
            {SKILL_LABEL[sections?.[currentSectionIdx]?.skill ?? ""] ?? ""} is done and locked. The next section's timer starts only when you click Continue below.
          </p>

          {/* Live 24h window reminder */}
          <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl border mb-8 ${
            windowUrgent ? "bg-rose-50 border-rose-200" : "bg-indigo-50 border-indigo-200"
          }`}>
            <Hourglass className={`w-4 h-4 ${windowUrgent ? "text-rose-500" : "text-indigo-600"}`} />
            <span className={`text-xs font-semibold uppercase tracking-wider ${windowUrgent ? "text-rose-600" : "text-indigo-600"}`}>24h window</span>
            <span className={`text-sm font-bold tabular-nums ${windowUrgent ? "text-rose-600" : "text-slate-900"}`}>{formatHMS(windowSec)}</span>
          </div>

          <div className={`${accent(nextSec.skill).bg} border ${accent(nextSec.skill).border} rounded-xl p-5 mb-8 text-left shadow-sm`}>
            <p className={`text-xs font-semibold uppercase tracking-wider mb-2 ${accent(nextSec.skill).text}`}>Up Next</p>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-3xl">{SKILL_ICON[nextSec.skill] ?? "📝"}</span>
                <div>
                  <h3 className="text-xl font-semibold text-slate-900 uppercase">{SKILL_LABEL[nextSec.skill] ?? nextSec.skill}</h3>
                  <p className="text-sm text-slate-500">{nextSec.questions.length} questions · {nextDurMin} min timer</p>
                </div>
              </div>
              <span className="bg-white border border-slate-200 rounded-lg px-3 py-1 text-xs font-semibold text-slate-500 uppercase flex items-center gap-1"><Clock className="w-3 h-3" /> {nextDurMin}m</span>
            </div>
          </div>

          <button onClick={advanceToNextSection} className="w-full bg-indigo-600 hover:bg-indigo-700 text-white border-none font-semibold text-lg py-4 rounded-xl shadow-sm hover:shadow-md transition-all">
            Start {SKILL_LABEL[nextSec.skill] ?? "Next Section"} <ArrowRight className="w-5 h-5 inline ml-1" />
          </button>
          <p className="text-[11px] text-slate-400 font-medium mt-3">The {nextDurMin}-minute timer begins the instant you click.</p>
        </div>
      </div>
    );
  };

  const renderScoring = () => (
    <div className="flex flex-col items-center justify-center min-h-[70vh] animate-fade-in">
      <div className="relative mb-8">
        <div className="w-24 h-24 rounded-full border-[6px] border-slate-200 border-t-indigo-600 animate-spin" />
        <span className="absolute inset-0 flex items-center justify-center text-4xl">🏆</span>
      </div>
      <h2 className="text-3xl font-bold text-slate-900 tracking-tight mb-3">Scoring Your Mock</h2>
      <p className="text-slate-500 font-medium text-lg">Calculating Real Band and updating your competency matrix.</p>
    </div>
  );

  const renderResults = () => {
    const momentum  = sessionMomentum || mockResults?.momentum_awarded || 0;
    const breakdown = mockResults?.momentum_breakdown ?? [];
    const skillScores: MockSkillScore[] = mockResults?.skill_scores ?? [];
    const realBand  = mockResults?.real_band_score ?? 0;
    const prevBand  = mockResults?.prev_real_band ?? 0;
    const delta     = mockResults?.real_band_delta ?? 0;
    const crossed   = mockResults?.threshold_crossed ?? false;

    return (
      <div className="max-w-3xl mx-auto animate-fade-in pt-8 pb-24 px-4">

        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-3xl font-bold text-slate-900 tracking-tight">Mock Complete</h2>
          <button onClick={() => { localStorage.removeItem(STORAGE_KEY); if (sessionIdRef.current) clearTimerState(sessionIdRef.current); navigate("/student/dashboard", { state: { drillCompleted: true } }); }}
            className="px-6 py-3 bg-indigo-600 text-white border-none rounded-xl font-semibold text-sm uppercase hover:bg-indigo-700 shadow-sm hover:shadow-md transition-all">
            Dashboard
          </button>
        </div>

        {/* Real Band Score */}
        <div className="bg-indigo-600 rounded-2xl p-8 mb-6 text-center shadow-md relative overflow-hidden">
          <div className="absolute -top-8 -right-8 text-[140px] opacity-10 pointer-events-none select-none">🏆</div>
          <p className="text-indigo-200 font-semibold uppercase tracking-wider mb-1">Real Band Score</p>
          <div className="text-8xl font-bold text-white leading-none mb-2">{mockResults?.real_band_score != null ? realBand.toFixed(1) : "—"}</div>
          {delta !== 0 && (
            <div className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-lg font-semibold uppercase text-sm mt-2 ${delta > 0 ? "bg-emerald-500 text-white" : "bg-rose-500 text-white"}`}>
              {delta > 0 ? `↑ +${delta.toFixed(1)}` : `↓ ${delta.toFixed(1)}`} from previous {prevBand.toFixed(1)}
            </div>
          )}
          {crossed && (
            <div className="mt-3 inline-flex items-center gap-2 bg-amber-400 text-slate-900 px-4 py-2 rounded-lg font-semibold text-sm uppercase shadow-sm">
              🎊 New Band Threshold Crossed!
            </div>
          )}
          <p className="text-indigo-200 text-xs font-medium mt-3 uppercase tracking-wide">
            Real Band = Mock × 60% + Previous Matrix × 40%
          </p>
        </div>

        {/* Momentum banner */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 mb-6 text-center shadow-sm">
          <p className="text-slate-400 font-semibold uppercase tracking-wider mb-1">Momentum Earned</p>
          <div className="text-6xl font-bold text-indigo-600">+{momentum}</div>
          {breakdown.length > 0 && (
            <div className="flex flex-wrap justify-center gap-2 mt-4">
              {breakdown.map((b: any, i: number) => (
                <span key={i} className="bg-indigo-50 text-indigo-700 text-[10px] font-semibold uppercase tracking-wider px-3 py-1 rounded-full border border-indigo-200">
                  +{b.points} {b.reason}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* 4 Skill cards */}
        {skillScores.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 mb-6">
            {skillScores.map((s, i) => {
              const displayNewBand = clampBandMove(s.prev_matrix_band, s.new_matrix_band);
              const a           = accent(s.skill);
              const matrixDelta = s.prev_matrix_band !== null
                ? Math.round((displayNewBand - s.prev_matrix_band) * 10) / 10
                : null;
              const matrixUp    = matrixDelta !== null && matrixDelta > 0;
              const diagDelta   = s.delta_from_diag;
              const diagUp      = diagDelta !== null && diagDelta !== undefined && diagDelta > 0;

              const subSkills: MockSubSkillScore[] = (s.sub_skill_scores && s.sub_skill_scores.length > 0)
                ? s.sub_skill_scores
                : (s.total > 0
                    ? [{
                        sub_skill:  "OVERALL",
                        band:       s.band,
                        correct:    s.correct,
                        total_mcq:  s.total,
                        ai_band:    null,
                      }]
                    : []);

              const feedbackItems  = (s.sub_skill_scores ?? []).filter(ss => ss.ai_feedback?.rationale);
              const hasAnyFeedback = feedbackItems.length > 0;
              const isFeedbackOpen = expandedFeedback.has(i);
              const insight        = s.insight ?? skillInsight(s);

              return (
                <div key={i} className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex flex-col">
                  <div className="flex items-center gap-3 mb-4">
                    <span className={`w-10 h-10 rounded-lg ${a.bg} border ${a.border} flex items-center justify-center text-2xl`}>
                      {SKILL_ICON[s.skill] ?? "📝"}
                    </span>
                    <div>
                      <p className="font-semibold text-slate-900 text-sm uppercase tracking-wide">{SKILL_LABEL[s.skill] ?? s.skill}</p>
                      <p className="text-slate-400 text-[10px] font-medium uppercase">{s.ai_graded ? "MCQ + AI Graded" : "Pure MCQ"}</p>
                    </div>
                  </div>

                  <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 mb-0.5">Mock Score</p>
                  <p className="text-5xl font-bold text-slate-900 leading-none mb-1">{s.band > 0 ? s.band.toFixed(1) : "—"}</p>
                  {s.total > 0 && (
                    <p className="text-xs text-slate-400 font-medium mb-3">{s.correct} / {s.total} MCQ correct</p>
                  )}

                  <div className={`${a.bg} border ${a.border} rounded-xl p-3 mb-4`}>
                    <p className={`text-[10px] font-semibold uppercase tracking-wider ${a.text} mb-1`}>Insight</p>
                    <p className="text-xs text-slate-700 font-medium leading-relaxed">{insight}</p>
                  </div>

                  {subSkills.length > 0 && (
                    <div className="mb-4">
                      <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 mb-2">Sub-skill Breakdown</p>
                      <div className="grid grid-cols-2 gap-1.5">
                        {subSkills.map((ss, j) => (
                          <div key={j} className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-2">
                            <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">{SUBSKILL_LABEL[ss.sub_skill] ?? ss.sub_skill}</p>
                            <div className="flex items-baseline gap-1.5 mt-0.5">
                              <span className="text-lg font-bold text-slate-900">{ss.band.toFixed(1)}</span>
                              {ss.ai_band !== null && ss.ai_band !== undefined && (
                                <span className="text-[9px] text-slate-400 font-medium">AI: {ss.ai_band.toFixed(1)}</span>
                              )}
                            </div>
                            {ss.total_mcq > 0 && (
                              <p className="text-[9px] text-slate-400 font-medium mt-0.5">{ss.correct}/{ss.total_mcq} MCQ</p>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {hasAnyFeedback && (
                    <div className="mb-4">
                      <button
                        onClick={() => toggleFeedback(i)}
                        aria-expanded={isFeedbackOpen}
                        className="w-full flex items-center justify-between px-3 py-2.5 rounded-lg bg-slate-50 border border-slate-200 hover:bg-slate-100 transition-colors"
                      >
                        <span className="text-xs font-semibold uppercase tracking-wider text-slate-600 flex items-center gap-2">
                          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                          </svg>
                          Detailed AI Feedback ({feedbackItems.length})
                        </span>
                        <ChevronDown className={`w-4 h-4 text-slate-500 transition-transform ${isFeedbackOpen ? "rotate-180" : ""}`} />
                      </button>
                      {isFeedbackOpen && (
                        <div className="mt-3 flex flex-col gap-3">
                          {feedbackItems.map((ss, j) => (
                            <div key={j} className="bg-white border border-indigo-200 rounded-xl overflow-hidden shadow-sm">
                              <div className="px-4 py-2.5 bg-indigo-50 border-b border-indigo-100 flex items-center gap-2">
                                <div className="w-1.5 h-4 bg-indigo-600 rounded-full" />
                                <p className="text-[10px] font-semibold uppercase tracking-wider text-indigo-700">{SUBSKILL_LABEL[ss.sub_skill] ?? ss.sub_skill}</p>
                              </div>
                              <div className="px-4 pt-3 pb-2">
                                <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 mb-1">Summary</p>
                                <p className="text-xs text-slate-600 font-medium leading-relaxed italic">&ldquo;{ss.ai_feedback!.rationale}&rdquo;</p>
                              </div>
                              {(ss.ai_feedback!.key_observations?.length ?? 0) > 0 && (
                                <div className="px-4 pb-3">
                                  <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 mt-1 mb-2">Key Observations</p>
                                  <ul className="flex flex-col gap-2">
                                    {ss.ai_feedback!.key_observations.map((obs, k) => (
                                      <li key={k} className="flex items-start gap-2">
                                        <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-indigo-500 flex-shrink-0" />
                                        <span className="text-xs text-slate-700 font-medium leading-relaxed">{obs}</span>
                                      </li>
                                    ))}
                                  </ul>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  <div className="border-t border-slate-100 pt-3 mt-auto">
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 mb-1.5">Real Band (Updated)</p>
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-sm font-semibold text-slate-400">{s.prev_matrix_band !== null ? s.prev_matrix_band.toFixed(1) : "—"}</span>
                      <span className="text-slate-300 text-xs">→</span>
                      <span className={`text-xl font-bold ${matrixUp ? "text-emerald-600" : "text-slate-700"}`}>{displayNewBand.toFixed(1)}</span>
                      {matrixDelta !== null && (
                        <span className={`text-xs font-semibold ${matrixUp ? "text-emerald-600" : "text-rose-600"}`}>
                          {matrixUp ? `+${matrixDelta.toFixed(1)}` : matrixDelta.toFixed(1)}
                        </span>
                      )}
                    </div>
                    {s.diagnostic_band !== null && (
                      <div className={`flex items-center gap-2 text-xs font-medium ${diagUp ? "text-emerald-600" : "text-slate-500"}`}>
                        <BookOpen className="w-3 h-3" />
                        <span>Diagnostic: {s.diagnostic_band.toFixed(1)}</span>
                        {diagDelta !== null && diagDelta !== undefined && (
                          <span className={`font-semibold ${diagUp ? "text-emerald-600" : "text-rose-600"}`}>
                            {diagUp ? `↑ +${diagDelta.toFixed(1)}` : `↓ ${Math.abs(diagDelta).toFixed(1)}`} from start
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <p className="text-center text-slate-500 font-medium text-sm">
          Your Real Band and competency matrix have been updated. Keep drilling to improve your weakest skills before the next mock.
        </p>
      </div>
    );
  };
  // ═══════════════════════════════════════════════════════════════════════════
  // RENDER
  // ═══════════════════════════════════════════════════════════════════════════

  return (
    <div className="min-h-screen bg-slate-50">
      <TopNavBar
        totalMomentum={totalMomentum}
        phase={phase}
        onBack={() => navigate("/student/dashboard")}
      />

      {/* "Time's up" modal — shown on section expiry, auto-dismiss after 1s */}
      {showTimeUpModal && expiredSkill && (
        <TimeUpModal
          skill={expiredSkill}
          answeredNote="Your answers so far have been saved and submitted for scoring."
          isLastSection={!sessionIdRef.current || !sections || findNextPlayable(sessionIdRef.current, sections, currentSectionIdx + 1) === -1}
          onContinue={handleTimeUpContinue}
        />
      )}

      <div className="pt-16">
        {phase === "gate"            && renderGate()}
        {phase === "listening_intro" && renderListeningIntro()}
        {phase === "session"         && renderSession()}
        {phase === "interim"         && renderInterim()}
        {phase === "scoring"         && renderScoring()}
        {phase === "results"         && renderResults()}
      </div>
    </div>
  );
}