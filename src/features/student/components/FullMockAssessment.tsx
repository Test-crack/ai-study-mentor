// filepath: src/features/student/pages/FullMockAssessment.tsx
import React, { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";

import { useAuth } from "@/features/auth/hooks/useAuth";
import { useMomentum } from "@/features/student/Context/MomentumContext";
import { callBackend } from "@/features/auth/services/authClient";
import { transformSectionAudioUrls } from "@/features/student/utils/iaAudioUtils";
import * as mockTimerStore from "@/features/student/utils/mockTimerStore";
import {
  GraduationCap, ArrowRight, CheckCircle2, AlertCircle, Mic, PlayCircle,
  Zap, Loader2, Lock, XCircle, Trophy, Calendar, BookOpen, ArrowLeft, Flame,
  ChevronDown, Clock, Play,
} from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

type Phase = "gate" | "section_intro" | "session" | "scoring" | "results";

type SectionStatus = "NOT_STARTED" | "IN_PROGRESS" | "SUBMITTED" | "EXPIRED";

interface SectionData {
  section:      string;
  status:       SectionStatus;
  started_at:   string | null;
  expires_at:   string | null;
  submitted_at: string | null;
}

interface SessionOverview {
  session_id:       string;
  resume:           boolean;
  attempt_type:     "STANDARD" | "EARNED";
  window_closes_at: string;
  sections:         SectionData[];
}

interface MockProgress {
  ia_completed:     number;
  ia_required:      number;
  ia_per_skill:     Record<string, boolean>;
  band_improved:    boolean;
  best_improvement: number;
  improved_skill:   string | null;
}

interface MockStatusResponse {
  success:                  boolean;
  is_eligible:              boolean;
  eligibility_reasons:      { key: string; message: string }[];
  can_start_mock:           boolean;
  has_active_session:       boolean;
  active_session_id:        string | null;
  standard_used_this_month: boolean;
  standard_session_status:  string | null;
  earned_used_this_month:   boolean;
  earned_session_status:    string | null;
  earned_mock_eligible:     boolean;
  can_start_earned:         boolean;
  earned_mock_reasons:      { key: string; message: string }[];
  momentum_score:           number;
  earned_mock_cost:         number;
  progress:                 MockProgress;
}

interface MockQuestion {
  id:            string;
  question_type: "MCQ" | "TFNG" | "WRITING_PROMPT" | "SPEAKING_PROMPT";
  prompt_text:   string;
  options:       Record<string, string> | null;
}

interface ActiveSection {
  skill:        string;
  section_type: "AUDIO" | "PASSAGE" | "MCQ_MIX";
  audio_url:    string | null;
  passage_text: string | null;
  passage_id:   string | null;
  questions:    MockQuestion[];
}

interface MockSubSkillScore {
  sub_skill:    string;
  band:         number;
  correct:      number;
  total_mcq:    number;
  ai_band:      number | null;
  ai_feedback?: { rationale: string; key_observations: string[] };
}

interface MockSkillScore {
  skill:             string;
  band:              number;
  new_matrix_band:   number;
  diagnostic_band:   number | null;
  delta_from_diag:   number | null;
  prev_matrix_band:  number | null;
  correct:           number;
  total:             number;
  ai_graded:         boolean;
  sub_skill_scores?: MockSubSkillScore[];
  insight?:          string;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const SKILL_ICON: Record<string, string> = {
  LISTENING: "🎧", READING: "📖", WRITING: "✍️", SPEAKING: "🎤",
};
const SKILL_LABEL: Record<string, string> = {
  LISTENING: "Listening", READING: "Reading", WRITING: "Writing", SPEAKING: "Speaking",
};
const SECTION_DURATION_MIN: Record<string, number> = {
  LISTENING: 30, READING: 60, WRITING: 60, SPEAKING: 15,
};
const SUBSKILL_LABEL: Record<string, string> = {
  GRAMMAR: "Grammar", VOCABULARY: "Vocabulary", COHERENCE: "Coherence",
  TASK_RESPONSE: "Task Response", FLUENCY: "Fluency", PRONUNCIATION: "Pronunciation",
  OVERALL: "Overall Accuracy",
};

const SKILL_ACCENT: Record<string, { text: string; bg: string; border: string }> = {
  LISTENING: { text: "text-teal-600",   bg: "bg-teal-50",   border: "border-teal-200" },
  READING:   { text: "text-brand-blue-600", bg: "bg-brand-blue-50", border: "border-brand-blue-200" },
  WRITING:   { text: "text-orange-500", bg: "bg-orange-50", border: "border-orange-200" },
  SPEAKING:  { text: "text-rose-500",   bg: "bg-rose-50",   border: "border-rose-200" },
};
const accent = (skill: string) =>
  SKILL_ACCENT[skill] ?? { text: "text-slate-600", bg: "bg-slate-50", border: "border-slate-200" };

const MOCK_SKILL_ORDER = ["LISTENING", "READING", "WRITING", "SPEAKING"] as const;

const BAND_MOVE_CAP = 2;
function clampBandMove(prev: number | null, next: number): number {
  if (prev === null || prev === undefined) return next;
  const capped = Math.min(prev + BAND_MOVE_CAP, Math.max(prev - BAND_MOVE_CAP, next));
  if (capped !== next) console.warn(`[Mock] band move ${prev}->${next} exceeded cap`);
  return capped;
}

function formatTime(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0) return `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  return `${m}:${String(s).padStart(2, "0")}`;
}

function firstOfNextMonth(): string {
  const now = new Date();
  const d   = new Date(now.getFullYear(), now.getMonth() + 1, 1);
  return d.toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" });
}

function skillInsight(s: MockSkillScore): string {
  const label = SKILL_LABEL[s.skill] ?? s.skill;
  if (s.total === 0 && s.band <= 4.0) return `${label} section awaiting scoring.`;
  const tier = s.band >= 7.5 ? "excellent" : s.band >= 6.5 ? "solid" : s.band >= 5.5 ? "developing" : "foundational";
  const accuracy = s.total > 0 ? Math.round((s.correct / s.total) * 100) : null;
  const diagTrend = s.delta_from_diag !== null && Math.abs(s.delta_from_diag) >= 0.5
    ? s.delta_from_diag > 0 ? ` — a ${s.delta_from_diag.toFixed(1)}-point gain from your diagnostic`
    : ` — down ${Math.abs(s.delta_from_diag).toFixed(1)} from your diagnostic` : "";
  let advice = "";
  if (accuracy !== null) {
    if (accuracy >= 80)      advice = " Accuracy is strong; focus on speed and rare question types.";
    else if (accuracy >= 60) advice = " Solid accuracy with clear room to sharpen weaker question types.";
    else                     advice = " Prioritize targeted drills — accuracy needs to lift before the next mock.";
  } else if (s.ai_graded) {
    advice = s.band >= 6.5 ? " Refine the sub-skills below for tighter consistency." : " Focus on the sub-skills flagged below in your next drills.";
  }
  return `Your ${label} performance sits at a ${tier} band of ${s.band.toFixed(1)}${diagTrend}.${advice}`;
}

// ─── Circular timer ───────────────────────────────────────────────────────────

const CircleTimer: React.FC<{ timeLeft: number; total: number; size?: number }> = ({ timeLeft, total, size = 64 }) => {
  const pct   = total > 0 ? timeLeft / total : 1;
  const r     = (size - 8) / 2;
  const circ  = 2 * Math.PI * r;
  const dash  = circ * pct;
  const isUrgent = pct < 0.2;
  const color = isUrgent ? "#EF4444" : pct < 0.5 ? "#F59E0B" : "#0A6E64";
  return (
    <svg width={size} height={size} style={{ transform: "rotate(-90deg)", flexShrink: 0 }}>
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="#E5E7EB" strokeWidth={6} />
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth={6}
        strokeDasharray={`${dash} ${circ}`} strokeLinecap="round"
        style={{ transition: "stroke-dasharray 0.5s linear, stroke 0.3s" }} />
      <text x={size/2} y={size/2+1} textAnchor="middle" dominantBaseline="middle"
        fill={isUrgent ? "#EF4444" : "#111827"} fontSize={size/4.2} fontWeight="900" fontFamily="monospace"
        style={{ transform: "rotate(90deg)", transformOrigin: `${size/2}px ${size/2}px` }}>
        {formatTime(timeLeft)}
      </text>
    </svg>
  );
};

// ─── TopNavBar ────────────────────────────────────────────────────────────────

function TopNavBar({ totalMomentum, phase, onBack }: { totalMomentum: number; phase: Phase | "dashboard"; onBack: () => void }) {
  const { streak } = useMomentum();
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-white border-b border-slate-200">
      <div className="w-full px-3 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-14 sm:h-16">
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            {(phase === "gate" || phase === "section_intro" || phase === "dashboard") && (
              <button onClick={onBack}
                className="flex items-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-1.5 rounded-lg border border-slate-200 font-medium text-xs text-slate-600 hover:bg-slate-50 transition-colors flex-shrink-0 shadow-sm">
                <ArrowLeft className="w-3.5 h-3.5" /><span className="hidden sm:inline">Back</span>
              </button>
            )}
            <div className="flex items-center gap-1.5 sm:gap-2.5 min-w-0">
              <div className="p-1.5 sm:p-2 bg-brand-teal-600 rounded-xl flex-shrink-0 shadow-sm">
                <GraduationCap className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
              </div>
              <span className="text-base sm:text-xl font-semibold text-slate-900 tracking-tight truncate">TestCrack</span>
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
              <span className="hidden md:inline text-xs text-brand-teal-400 font-medium">pts</span>
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

  // Gate + status
  const [phase, setPhase]                   = useState<Phase | "dashboard">("gate");
  const [statusLoading, setStatusLoading]   = useState(true);
  const [mockStatus, setMockStatus]         = useState<MockStatusResponse | null>(null);

  // Session overview
  const [sessionId, setSessionId]           = useState<string | null>(null);
  const sessionIdRef                        = useRef<string | null>(null);
  const [sessionOverview, setSessionOverview] = useState<SessionOverview | null>(null);
  const [windowRemainingMs, setWindowRemainingMs] = useState(0);

  // Active section (currently being answered)
  const [activeSection, setActiveSection]   = useState<ActiveSection | null>(null);
  const [activeSectionName, setActiveSectionName] = useState<string | null>(null);

  // Question state
  const [currentIdx, setCurrentIdx]         = useState(0);
  const [isLoading, setIsLoading]           = useState(false);
  const [answers, setAnswers]               = useState<Record<string, string>>({});
  const [mockResults, setMockResults]       = useState<any>(null);
  const [sessionMomentum, setSessionMomentum] = useState(0);
  const [expandedFeedback, setExpandedFeedback] = useState<Set<number>>(new Set());
  const toggleFeedback = (i: number) =>
    setExpandedFeedback(prev => { const next = new Set(prev); next.has(i) ? next.delete(i) : next.add(i); return next; });

  // Per-section timer (server-authoritative via mockTimerStore.setSectionEndsAt)
  // -1 = sentinel "not yet computed by timer effect"; prevents auto-submit from firing on mount
  const [sectionTimerSec, setSectionTimerSec] = useState(-1);
  const timerIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // CONTRACT-4: AI grading failed on submit (502 can_retry). Section is SUBMITTED server-side;
  // show a retry banner in session rather than silently looping the student back in.
  const [gradingRetryPending, setGradingRetryPending] = useState(false);

  // Audio / Passage
  const audioRef                            = useRef<HTMLAudioElement>(null);
  const [audioState, setAudioState]         = useState<"idle" | "playing" | "played">("idle");
  const [showPassage, setShowPassage]       = useState(false);
  const [animBars]                          = useState(() => Array.from({ length: 12 }, () => Math.random()));

  // Speaking
  const recognitionRef                      = useRef<any>(null);
  const transcriptAccumRef                  = useRef<string>("");
  const [isRecording, setIsRecording]       = useState(false);
  const [liveTranscript, setLiveTranscript] = useState("");
  const [recordedPrompts, setRecordedPrompts] = useState<Record<string, boolean>>({});

  // Writing
  const writingDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const currentQ = activeSection?.questions[currentIdx] ?? null;

  const backendUrl = () => import.meta.env.VITE_BACKEND_URL || "http://localhost:4000";

  // ── Status check ────────────────────────────────────────────────────────────
  useEffect(() => {
    if (phase !== "gate") { setStatusLoading(false); return; }
    const check = async () => {
      try {
        const res = await callBackend(`${backendUrl()}/api/mock/status`);
        if (res.success) setMockStatus(res as MockStatusResponse);
      } catch (err) { console.error("[MockStatus] fetch failed:", err); }
      finally { setStatusLoading(false); }
    };
    void check();
  }, [phase]);

  // ── Window countdown (24h clock on dashboard) ────────────────────────────────
  useEffect(() => {
    if (phase !== "dashboard" || !sessionIdRef.current) return;
    const tick = () => {
      const rem = mockTimerStore.getWindowRemainingMs(sessionIdRef.current!);
      setWindowRemainingMs(rem);
    };
    tick();
    const t = setInterval(tick, 1000);
    return () => clearInterval(t);
  }, [phase]);

  // ── Section timer — runs for section_intro too so timer is visible during Listening briefing ───
  useEffect(() => {
    if ((phase !== "session" && phase !== "section_intro") || !sessionIdRef.current || !activeSectionName) return;
    const durationSec = (SECTION_DURATION_MIN[activeSectionName] ?? 30) * 60;

    const tick = () => {
      const rem = mockTimerStore.getSectionRemainingSec(sessionIdRef.current!, activeSectionName, durationSec);
      setSectionTimerSec(rem);
    };
    tick();
    if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    timerIntervalRef.current = setInterval(tick, 1000);
    return () => { if (timerIntervalRef.current) clearInterval(timerIntervalRef.current); };
  }, [phase, activeSectionName]);

  // ── Cleanup on question / section change ─────────────────────────────────────
  useEffect(() => {
    if (recognitionRef.current) { try { recognitionRef.current.stop(); } catch { /**/ } recognitionRef.current = null; }
    setIsRecording(false); setLiveTranscript("");
    if (writingDebounceRef.current) { clearTimeout(writingDebounceRef.current); writingDebounceRef.current = null; }
  }, [currentIdx, activeSectionName]);

  // ─── API helpers ─────────────────────────────────────────────────────────────

  const persistAnswer = (questionId: string, answer: string): Promise<void> => {
    if (!sessionIdRef.current || !activeSectionName) return Promise.resolve();
    return callBackend(`${backendUrl()}/api/mock/answer`, {
      method: "POST",
      body: JSON.stringify({ session_id: sessionIdRef.current, section: activeSectionName, question_id: questionId, answer })
    }).then(() => undefined).catch(e => console.warn("[Mock] answer save failed:", e));
  };

  const flushCurrentAnswer = useCallback(async () => {
    if (writingDebounceRef.current) { clearTimeout(writingDebounceRef.current); writingDebounceRef.current = null; }
    const q = activeSection?.questions[currentIdx];
    const a = q ? answers[q.id] : undefined;
    if (q && a) await persistAnswer(q.id, a);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeSection, currentIdx, answers]);

  const persistWritingDebounced = (questionId: string, text: string) => {
    if (writingDebounceRef.current) clearTimeout(writingDebounceRef.current);
    writingDebounceRef.current = setTimeout(() => persistAnswer(questionId, text), 1500);
  };

  // ─── Session load / resume ───────────────────────────────────────────────────

  const loadSession = async (attemptType: "STANDARD" | "EARNED" = "STANDARD") => {
    setIsLoading(true);
    try {
      const res = await callBackend(`${backendUrl()}/api/mock/questions?attempt_type=${attemptType}`);
      if (!res.success) { setIsLoading(false); return; }

      sessionIdRef.current = res.session_id;
      setSessionId(res.session_id);

      const windowMs = new Date(res.window_closes_at).getTime();
      mockTimerStore.getState(res.session_id, windowMs);

      // Sync any IN_PROGRESS section timers from server
      for (const sec of res.sections as SectionData[]) {
        if (sec.status === "IN_PROGRESS" && sec.expires_at) {
          mockTimerStore.setSectionEndsAt(res.session_id, sec.section, new Date(sec.expires_at).getTime());
        }
      }

      const overview: SessionOverview = {
        session_id:       res.session_id,
        resume:           res.resume,
        attempt_type:     res.attempt_type,
        window_closes_at: res.window_closes_at,
        sections:         res.sections,
      };
      setSessionOverview(overview);

      // Resume: if any section is IN_PROGRESS, go directly into it
      const inProgress = (res.sections as SectionData[]).find(s => s.status === "IN_PROGRESS");
      if (inProgress) {
        await resumeSection(inProgress.section, res.session_id);
      } else {
        setPhase("dashboard");
      }
    } catch (err) {
      console.error("[Mock] load session error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const refreshSectionStatuses = async () => {
    if (!sessionIdRef.current) return;
    try {
      const res = await callBackend(`${backendUrl()}/api/mock/session/${sessionIdRef.current}`);
      if (res.success && sessionOverview) {
        setSessionOverview(prev => prev ? { ...prev, sections: res.sections } : prev);
      }
    } catch { /**/ }
  };

  // ─── Section start / resume ──────────────────────────────────────────────────

  const resumeSection = async (skill: string, overrideSid?: string) => {
    const sid = overrideSid || sessionIdRef.current;
    if (!sid) return;
    setIsLoading(true);
    try {
      const res = await callBackend(`${backendUrl()}/api/mock/sections/start`, {
        method: "POST",
        body: JSON.stringify({ session_id: sid, section: skill })
      });
      if (!res.success) { setIsLoading(false); return; }
      applyStartedSection(res, skill, sid);
      setPhase("session");
    } catch (err) {
      console.error("[Mock] resume section error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const beginSection = async (skill: string) => {
    const sid = sessionIdRef.current;
    if (!sid) return;
    setIsLoading(true);
    try {
      const res = await callBackend(`${backendUrl()}/api/mock/sections/start`, {
        method: "POST",
        body: JSON.stringify({ session_id: sid, section: skill })
      });
      if (!res.success) { setIsLoading(false); return; }
      applyStartedSection(res, skill, sid);
      // Show intro gate only for a fresh (not resumed) LISTENING section
      if (skill === "LISTENING" && !res.resumed) {
        setPhase("section_intro");
      } else {
        setPhase("session");
      }
    } catch (err) {
      console.error("[Mock] begin section error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  function applyStartedSection(res: any, skill: string, sid: string) {
    // Sync server-authoritative timer into mockTimerStore
    const expiresAt = new Date(res.expires_at).getTime();
    mockTimerStore.setSectionEndsAt(sid, skill, expiresAt);

    const sections = transformSectionAudioUrls([{
      skill,
      section_type: res.section_type,
      audio_url:    res.audio_url,
      passage_text: res.passage_text,
      passage_id:   res.passage_id,
      questions:    res.questions,
    }]);
    setActiveSection(sections[0] as ActiveSection);
    setActiveSectionName(skill);
    setCurrentIdx(0);
    setAnswers(res.saved_answers ?? {});
    setAudioState("idle");
    setShowPassage(false);
    setIsRecording(false);
    setGradingRetryPending(false);
  }

  // ─── Section completion ──────────────────────────────────────────────────────

  const handleSectionComplete = useCallback(async () => {
    if (!activeSectionName || !sessionIdRef.current) return;
    if (timerIntervalRef.current) { clearInterval(timerIntervalRef.current); timerIntervalRef.current = null; }

    // Flush ALL answers in state (idempotent JSONB merge — handles back-navigation edge cases)
    if (writingDebounceRef.current) { clearTimeout(writingDebounceRef.current); writingDebounceRef.current = null; }
    await Promise.all(
      Object.entries(answers)
        .filter(([, ans]) => (ans ?? "").trim() !== "")
        .map(([qId, ans]) => persistAnswer(qId, ans))
    );

    try {
      const res = await callBackend(`${backendUrl()}/api/mock/submit`, {
        method: "POST",
        body: JSON.stringify({ session_id: sessionIdRef.current, section: activeSectionName })
      });

      if (!res.success) {
        if (res.can_retry) {
          // Section IS submitted server-side; only AI grading failed.
          // Show retry banner in the session screen — student taps "Submit" again to retry grading.
          setGradingRetryPending(true);
          setPhase("session");
        } else {
          console.error("[Mock] section submit failed:", res.error);
          setPhase("session");
        }
        return;
      }

      // Session was already fully graded (re-entry after completion)
      if (res.already_done) {
        setMockResults(res);
        setPhase("scoring");
        setTimeout(() => setPhase("results"), 3500);
        return;
      }

      if (res.all_sections_complete) {
        setSessionMomentum(res.momentum_awarded ?? 0);
        if (res.updated_momentum !== undefined) syncMomentum(res.updated_momentum);
        setMockResults(res);
        setPhase("scoring");
        setTimeout(() => setPhase("results"), 3500);
      } else {
        // Update overview and go back to dashboard
        if (res.sections) {
          setSessionOverview(prev => prev ? { ...prev, sections: res.sections } : prev);
        } else {
          await refreshSectionStatuses();
        }
        setActiveSection(null);
        setActiveSectionName(null);
        setPhase("dashboard");
      }
    } catch (err) {
      console.error("[Mock] section submit error — retry:", err);
      setPhase("session");
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeSectionName, answers, syncMomentum]);

  // ─── Question navigation ─────────────────────────────────────────────────────

  const handleNextQuestion = useCallback(() => {
    if (!activeSection || !currentQ) return;
    if (writingDebounceRef.current) { clearTimeout(writingDebounceRef.current); writingDebounceRef.current = null; }
    if (answers[currentQ.id]) persistAnswer(currentQ.id, answers[currentQ.id]);
    if (currentIdx < activeSection.questions.length - 1) {
      setCurrentIdx(i => i + 1);
      setIsRecording(false);
    } else {
      void handleSectionComplete();
    }
  }, [currentIdx, activeSection, currentQ, answers, handleSectionComplete]);

  // ─── Speaking recording ──────────────────────────────────────────────────────

  const startSpeakingRecording = (questionId: string) => {
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    transcriptAccumRef.current = ""; setLiveTranscript(""); setIsRecording(true);
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
            <div className="w-12 h-12 bg-slate-100 border border-slate-200 rounded-xl flex items-center justify-center"><Lock className="w-6 h-6 text-slate-500" /></div>
            <div><p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Not Yet Unlocked</p><h2 className="text-2xl font-semibold text-slate-900 tracking-tight">Mock IELTS</h2></div>
          </div>
          <p className="text-slate-500 font-medium text-sm mb-6">Complete all requirements below to unlock your Mock test.</p>
          <div className="flex flex-col gap-3 mb-8">
            {renderCriteriaRow(p.ia_completed >= p.ia_required, `${p.ia_completed} / ${p.ia_required} IAs Completed`, p.ia_completed < p.ia_required ? `${p.ia_required - p.ia_completed} more needed` : "Requirement met")}
            {renderCriteriaRow(skillsMet, "At Least 1 IA Per Skill", (() => { const m = allSkills.filter(s => !p.ia_per_skill[s]); return m.length === 0 ? "All 4 skills covered" : `Missing: ${m.map(s => SKILL_LABEL[s]).join(", ")}`; })())}
            {renderCriteriaRow(p.band_improved, `Band Improved ≥ 0.5 from Diagnostic`, p.band_improved ? `Best: +${p.best_improvement.toFixed(1)} on ${SKILL_LABEL[p.improved_skill ?? ""]}` : `Best so far: +${p.best_improvement.toFixed(1)} (need ≥ 0.5)`)}
          </div>
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 mb-6">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-3">Skill Coverage</p>
            <div className="grid grid-cols-4 gap-2">
              {allSkills.map(skill => { const a = accent(skill); const covered = p.ia_per_skill[skill]; return (
                <div key={skill} className={`flex flex-col items-center gap-1.5 p-2.5 rounded-lg border ${covered ? `${a.bg} ${a.border}` : "bg-white border-slate-200"}`}>
                  <span className="text-xl">{SKILL_ICON[skill]}</span>
                  <span className={`text-[10px] font-semibold uppercase tracking-wider ${covered ? a.text : "text-slate-400"}`}>{SKILL_LABEL[skill].slice(0, 3)}</span>
                  {covered ? <CheckCircle2 className={`w-3.5 h-3.5 ${a.text}`} /> : <div className="w-3.5 h-3.5 rounded-full border-2 border-slate-300" />}
                </div>
              ); })}
            </div>
          </div>
          <button onClick={() => navigate("/student/dashboard")} className="w-full py-3 border border-slate-200 rounded-xl font-medium text-sm text-slate-500 hover:bg-slate-50 transition-colors">Back to Dashboard</button>
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
          <div><p className="font-semibold text-emerald-800 text-sm uppercase tracking-wider">All Requirements Met</p><p className="text-xs text-emerald-600 font-medium">{mockStatus!.progress.ia_completed} IAs · All 4 skills covered · Band improved +{mockStatus!.progress.best_improvement.toFixed(1)}</p></div>
        </div>
        <h1 className="text-4xl font-bold text-slate-900 tracking-tight mb-3">Ready for Your<br /><span className="text-indigo-600">Mock IELTS?</span></h1>
        <p className="text-slate-500 font-medium text-sm mb-6 leading-relaxed">
          A full-length IELTS simulation. Start each section whenever you're ready — your 24-hour window begins now.
        </p>
        <div className="grid grid-cols-4 gap-2 mb-8">
          {[
            { skill: "LISTENING", time: "30 min" },
            { skill: "READING",   time: "60 min" },
            { skill: "WRITING",   time: "60 min" },
            { skill: "SPEAKING",  time: "15 min" },
          ].map(s => { const a = accent(s.skill); return (
            <div key={s.skill} className={`${a.bg} border ${a.border} rounded-xl p-3 flex flex-col items-center gap-1.5`}>
              <span className="text-2xl">{SKILL_ICON[s.skill]}</span>
              <span className={`text-[10px] font-semibold uppercase tracking-wider ${a.text}`}>{s.skill.slice(0, 3)}</span>
              <span className="text-[10px] font-medium text-slate-400">{s.time}</span>
            </div>
          ); })}
        </div>
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6 flex items-start gap-3">
          <Clock className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
          <div><p className="font-semibold text-blue-800 text-sm">Individual section timers</p><p className="text-xs text-blue-600 mt-0.5">Each section timer only starts when you begin that section. Once a section is locked, you cannot go back. Complete all sections within 24 hours.</p></div>
        </div>
        <div className="flex flex-col gap-3">
          <button onClick={() => void loadSession("STANDARD")} disabled={isLoading}
            className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white border-none font-semibold text-base uppercase tracking-wide py-4 rounded-xl flex items-center justify-center gap-2 shadow-sm hover:shadow-md transition-all">
            {isLoading ? <><Loader2 className="w-4 h-4 animate-spin" /> Loading…</> : <>Start Mock Test <ArrowRight className="w-5 h-5" /></>}
          </button>
          <button onClick={() => navigate("/student/dashboard")} className="w-full py-3 border border-slate-200 rounded-xl font-medium text-sm text-slate-500 hover:bg-slate-50 transition-colors">Cancel</button>
        </div>
        {mockStatus!.can_start_earned && (
          <div className="mt-6 border-t border-slate-100 pt-6">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-3">Or Exchange Momentum</p>
            <button onClick={() => void loadSession("EARNED")} disabled={isLoading}
              className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white border-none rounded-xl py-3 font-semibold text-sm uppercase tracking-wide flex items-center justify-center gap-2 shadow-sm hover:shadow-md transition-all">
              <Zap className="w-4 h-4 text-amber-300 fill-amber-300" /> Extra Mock — {mockStatus!.earned_mock_cost.toLocaleString()} Momentum
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
          <div className="w-12 h-12 bg-amber-50 border border-amber-200 rounded-xl flex items-center justify-center"><Calendar className="w-6 h-6 text-amber-600" /></div>
          <div><p className="text-xs font-semibold uppercase tracking-wider text-slate-400">This Month</p><h2 className="text-2xl font-semibold text-slate-900 tracking-tight">Session Expired</h2></div>
        </div>
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6">
          <p className="font-semibold text-amber-800 text-sm mb-1">24-hour window closed without completion</p>
          <p className="text-amber-700 text-sm">Your standard slot for this month has been consumed.</p>
        </div>
        <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-4 mb-6 flex items-center gap-3">
          <Calendar className="w-5 h-5 text-indigo-600 flex-shrink-0" />
          <div><p className="font-semibold text-indigo-800 text-sm">Next standard slot opens</p><p className="text-indigo-600 font-medium text-sm">{firstOfNextMonth()}</p></div>
        </div>
        {mockStatus!.can_start_earned && (
          <div className="mb-4">
            <button onClick={() => void loadSession("EARNED")} disabled={isLoading}
              className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white border-none rounded-xl py-3 font-semibold text-sm uppercase tracking-wide flex items-center justify-center gap-2 shadow-sm transition-all">
              <Zap className="w-4 h-4 text-amber-300 fill-amber-300" /> Exchange {mockStatus!.earned_mock_cost.toLocaleString()} Momentum for Extra Mock
            </button>
          </div>
        )}
        <button onClick={() => navigate("/student/dashboard")} className="w-full py-3 border border-slate-200 rounded-xl font-medium text-sm text-slate-500 hover:bg-slate-50 transition-colors">Back to Dashboard</button>
      </div>
    </div>
  );

  const renderMonthUsed = () => (
    <div className="max-w-2xl mx-auto animate-fade-in pt-12 px-4">
      <div className="bg-white border border-slate-200 rounded-2xl p-8 shadow-md">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center justify-center"><CheckCircle2 className="w-6 h-6 text-emerald-600" /></div>
          <div><p className="text-xs font-semibold uppercase tracking-wider text-slate-400">This Month</p><h2 className="text-2xl font-semibold text-slate-900 tracking-tight">Mock Completed</h2></div>
        </div>
        <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-4 mb-6 flex items-center gap-3">
          <Calendar className="w-5 h-5 text-indigo-600 flex-shrink-0" />
          <div><p className="font-semibold text-indigo-800 text-sm">Next standard mock available</p><p className="text-indigo-600 font-medium text-sm">{firstOfNextMonth()}</p></div>
        </div>
        <p className="text-slate-500 text-sm font-medium mb-6">Your Real Band has been updated — keep drilling to build on it.</p>
        {mockStatus!.can_start_earned && (
          <div className="mb-4">
            <button onClick={() => void loadSession("EARNED")} disabled={isLoading}
              className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white border-none rounded-xl py-3 font-semibold text-sm uppercase tracking-wide flex items-center justify-center gap-2 shadow-sm transition-all">
              <Zap className="w-4 h-4 text-amber-300 fill-amber-300" /> Exchange {mockStatus!.earned_mock_cost.toLocaleString()} Momentum for Extra Mock
            </button>
          </div>
        )}
        <button onClick={() => navigate("/student/dashboard")} className="w-full py-3 border border-slate-200 rounded-xl font-medium text-sm text-slate-500 hover:bg-slate-50 transition-colors">Back to Dashboard</button>
      </div>
    </div>
  );

  const renderActiveSession = () => (
    <div className="max-w-2xl mx-auto animate-fade-in pt-12 px-4">
      <div className="bg-white border border-slate-200 rounded-2xl p-8 shadow-md">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 bg-amber-50 border border-amber-200 rounded-xl flex items-center justify-center text-2xl">⏱</div>
          <div><p className="text-xs font-semibold uppercase tracking-wider text-slate-400">In Progress</p><h2 className="text-2xl font-semibold text-slate-900 tracking-tight">Mock Paused</h2></div>
        </div>
        <p className="text-slate-500 text-sm font-medium mb-6">You have an active mock session. Continue from your section dashboard.</p>
        <button onClick={() => void loadSession("STANDARD")} disabled={isLoading}
          className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white border-none font-semibold text-base uppercase tracking-wide py-4 rounded-xl flex items-center justify-center gap-2 shadow-sm hover:shadow-md transition-all">
          {isLoading ? <><Loader2 className="w-4 h-4 animate-spin" /> Loading…</> : <>Continue Mock <ArrowRight className="w-5 h-5" /></>}
        </button>
        <button onClick={() => navigate("/student/dashboard")} className="w-full py-3 mt-3 border border-slate-200 rounded-xl font-medium text-sm text-slate-500 hover:bg-slate-50 transition-colors">Back to Dashboard</button>
      </div>
    </div>
  );

  const renderGate = () => {
    if (statusLoading || !mockStatus) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="w-10 h-10 text-indigo-600 animate-spin" /></div>;
    if (mockStatus.has_active_session)                            return renderActiveSession();
    if (!mockStatus.is_eligible)                                  return renderNotEligible();
    if (mockStatus.standard_session_status === "ABANDONED")       return renderSlotExpired();
    if (mockStatus.standard_used_this_month)                      return renderMonthUsed();
    return renderMockAvailable();
  };

  // ═══════════════════════════════════════════════════════════════════════════
  // SECTION DASHBOARD
  // ═══════════════════════════════════════════════════════════════════════════

  const renderDashboard = () => {
    const sections = sessionOverview?.sections ?? [];
    const windowSec = Math.floor(windowRemainingMs / 1000);
    const allDone = sections.length > 0 && sections.every(s => s.status === "SUBMITTED" || s.status === "EXPIRED");

    return (
      <div className="max-w-2xl mx-auto animate-fade-in pt-12 px-4 pb-12">
        {/* Header */}
        <div className="mb-6">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-indigo-600 text-white text-xs font-semibold tracking-wider uppercase mb-3 shadow-sm">
            <Trophy className="w-3.5 h-3.5" /> Mock IELTS
          </div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Section Dashboard</h1>
          <p className="text-sm text-slate-500 mt-1">Start each section when ready. Once started, the section timer cannot be paused.</p>
        </div>

        {/* 24hr window countdown */}
        {windowRemainingMs > 0 && (
          <div className={`flex items-center gap-3 p-4 rounded-xl border mb-6 ${windowSec < 3600 ? "bg-rose-50 border-rose-200" : "bg-slate-50 border-slate-200"}`}>
            <Clock className={`w-5 h-5 flex-shrink-0 ${windowSec < 3600 ? "text-rose-600" : "text-slate-500"}`} />
            <div>
              <p className={`text-xs font-semibold uppercase tracking-wider ${windowSec < 3600 ? "text-rose-700" : "text-slate-500"}`}>24-hour window closes in</p>
              <p className={`text-xl font-bold font-mono ${windowSec < 3600 ? "text-rose-700" : "text-slate-800"}`}>{formatTime(windowSec)}</p>
            </div>
          </div>
        )}

        {/* Section cards */}
        <div className="flex flex-col gap-3 mb-6">
          {MOCK_SKILL_ORDER.map(skill => {
            const secData = sections.find(s => s.section === skill);
            const status  = secData?.status ?? "NOT_STARTED";
            const a       = accent(skill);

            const remaining = secData?.expires_at && status === "IN_PROGRESS"
              ? Math.max(0, Math.floor((new Date(secData.expires_at).getTime() - Date.now()) / 1000))
              : null;

            const isLocked     = status === "SUBMITTED" || status === "EXPIRED";
            const isInProgress = status === "IN_PROGRESS";
            const isNotStarted = status === "NOT_STARTED";

            return (
              <div key={skill} className={`flex items-center justify-between p-4 rounded-2xl border transition-all ${
                isLocked     ? "bg-slate-50 border-slate-200 opacity-70" :
                isInProgress ? `${a.bg} ${a.border} shadow-sm` :
                               "bg-white border-slate-200 hover:border-indigo-300 hover:shadow-sm"
              }`}>
                <div className="flex items-center gap-3">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl ${isLocked ? "bg-slate-100" : a.bg}`}>
                    {SKILL_ICON[skill]}
                  </div>
                  <div>
                    <p className="font-semibold text-slate-900 text-sm uppercase tracking-wide">{SKILL_LABEL[skill]}</p>
                    <p className="text-xs text-slate-400 font-medium">{SECTION_DURATION_MIN[skill]} min</p>
                    {isInProgress && remaining !== null && (
                      <p className={`text-xs font-bold mt-0.5 ${remaining < 300 ? "text-rose-600" : a.text}`}>
                        {formatTime(remaining)} remaining
                      </p>
                    )}
                    {status === "SUBMITTED" && <p className="text-xs font-bold text-emerald-600 mt-0.5">Completed</p>}
                    {status === "EXPIRED"   && <p className="text-xs font-bold text-amber-600 mt-0.5">Time expired</p>}
                  </div>
                </div>

                <div>
                  {isLocked && (
                    <div className="flex items-center gap-1.5 text-xs font-bold text-slate-400">
                      {status === "SUBMITTED" ? <CheckCircle2 className="w-4 h-4 text-emerald-500" /> : <Lock className="w-4 h-4" />}
                      <span>{status === "SUBMITTED" ? "Done" : "Locked"}</span>
                    </div>
                  )}
                  {isInProgress && (
                    <button onClick={() => void resumeSection(skill)}
                      className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wide text-white bg-indigo-600 hover:bg-indigo-700 shadow-sm transition-colors`}>
                      <Play className="w-3.5 h-3.5" /> Resume
                    </button>
                  )}
                  {isNotStarted && windowRemainingMs > 0 && (
                    <button onClick={() => void beginSection(skill)} disabled={isLoading}
                      className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wide border transition-colors ${a.text} ${a.bg} ${a.border} hover:opacity-80`}>
                      <ArrowRight className="w-3.5 h-3.5" /> Start
                    </button>
                  )}
                  {isNotStarted && windowRemainingMs <= 0 && (
                    <span className="text-xs font-bold text-rose-500 flex items-center gap-1"><Lock className="w-3.5 h-3.5" /> Window closed</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {allDone && (
          <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 text-center">
            <CheckCircle2 className="w-8 h-8 text-emerald-600 mx-auto mb-2" />
            <p className="font-semibold text-emerald-800 text-sm">All sections completed!</p>
            <p className="text-xs text-emerald-600 mt-1">Submitting the final section will trigger grading automatically.</p>
          </div>
        )}
      </div>
    );
  };

  // ═══════════════════════════════════════════════════════════════════════════
  // LISTENING INTRO GATE
  // ═══════════════════════════════════════════════════════════════════════════

  const renderSectionIntro = () => {
    const durationSec = (SECTION_DURATION_MIN["LISTENING"] ?? 30) * 60;
    const isUrgent    = sectionTimerSec >= 0 && sectionTimerSec < 300;
    return (
      <div className="max-w-2xl mx-auto animate-fade-in pt-12 px-4">
        <div className="bg-white border border-slate-200 rounded-2xl p-8 sm:p-10 shadow-md">
          <div className="flex items-center justify-between mb-6">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-lg bg-teal-600 text-white text-xs font-semibold tracking-wider uppercase shadow-sm">
              <span className="text-base leading-none">🎧</span> Section 1 · Listening
            </div>
            {/* Live timer — visible so student knows time is running */}
            {sectionTimerSec >= 0 && (
              <div className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border ${isUrgent ? "bg-rose-50 border-rose-200" : "bg-slate-50 border-slate-200"}`}>
                <CircleTimer timeLeft={sectionTimerSec} total={durationSec} size={36} />
                <div>
                  <p className={`text-[9px] font-semibold uppercase tracking-wider ${isUrgent ? "text-rose-600" : "text-slate-500"}`}>Time left</p>
                  <p className={`text-sm font-bold font-mono leading-none ${isUrgent ? "text-rose-700" : "text-slate-800"}`}>{formatTime(sectionTimerSec)}</p>
                </div>
              </div>
            )}
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold text-slate-900 tracking-tight mb-2">Before you begin</h1>
          <p className="text-slate-500 font-medium text-sm mb-8 leading-relaxed">Complete each set of questions as you listen. There's no separate transfer time.</p>
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-5 mb-5 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-amber-800 text-sm mb-1">Audio plays once, like the real exam.</p>
              <p className="text-amber-700 text-xs font-medium leading-relaxed">You cannot pause, rewind, or replay any recording. Scan the questions before the audio starts.</p>
            </div>
          </div>
          <ul className="flex flex-col gap-2.5 mb-8">
            {["Use a quiet environment and headphones if possible.", "Your 30-minute section timer is already counting down.", "Answer as you listen — audio will not repeat."].map((tip, i) => (
              <li key={i} className="flex items-start gap-2.5 text-sm text-slate-600 font-medium">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0 mt-0.5" /><span>{tip}</span>
              </li>
            ))}
          </ul>
          <button onClick={() => setPhase("session")}
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white border-none font-semibold text-base uppercase tracking-wide py-4 rounded-xl flex items-center justify-center gap-2 shadow-sm hover:shadow-md transition-all">
            Start Listening Section <ArrowRight className="w-5 h-5" />
          </button>
        </div>
      </div>
    );
  };

  // ═══════════════════════════════════════════════════════════════════════════
  // SESSION SCREEN
  // ═══════════════════════════════════════════════════════════════════════════

  const renderSession = () => {
    if (isLoading || !activeSection || !currentQ) {
      return (
        <div className="min-h-[70vh] flex flex-col items-center justify-center animate-fade-in">
          <Loader2 className="w-12 h-12 text-brand-teal-600 animate-spin mb-4" />
          <p className="text-slate-500 font-semibold uppercase tracking-wider text-sm">Loading Questions…</p>
        </div>
      );
    }

    const totalQ      = activeSection.questions.length;
    const optionsMap  = (currentQ.options && !Array.isArray(currentQ.options)) ? currentQ.options as Record<string, string> : {};
    const optionKeys  = Object.keys(optionsMap).filter(k => optionsMap[k] != null);
    const durationSec = (SECTION_DURATION_MIN[activeSectionName ?? ""] ?? 30) * 60;

    let canProceed = false;
    if (currentQ.question_type === "SPEAKING_PROMPT")     canProceed = !!(answers[currentQ.id]?.trim());
    else if (currentQ.question_type === "WRITING_PROMPT") canProceed = (answers[currentQ.id]?.trim().split(/\s+/).filter(Boolean).length ?? 0) >= 10;
    else canProceed = !!answers[currentQ.id];

    return (
      <div className="max-w-6xl mx-auto pt-6 pb-16 px-4 animate-fade-in">
        {/* AI grading retry banner — shown when grading failed but answers are saved server-side */}
        {gradingRetryPending && (
          <div className="flex items-start gap-3 bg-amber-50 border border-amber-300 rounded-xl p-4 mb-4 shadow-sm">
            <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="font-semibold text-amber-800 text-sm">AI grading temporarily unavailable</p>
              <p className="text-amber-700 text-xs mt-0.5">Your answers are saved. Click "Submit Section" again to retry grading — you don't need to re-answer anything.</p>
            </div>
          </div>
        )}
        {/* Section badge + timer */}
        <div className="flex items-center justify-between bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 mb-6 gap-4 shadow-sm">
          <div className="flex items-center gap-4">
            <div className={`w-14 h-14 ${accent(activeSection.skill).bg} border ${accent(activeSection.skill).border} rounded-xl flex items-center justify-center text-3xl`}>
              {SKILL_ICON[activeSection.skill] ?? "📝"}
            </div>
            <div>
              <p className="text-slate-900 font-semibold text-lg uppercase tracking-wide">{SKILL_LABEL[activeSection.skill] ?? activeSection.skill}</p>
              <p className="text-slate-500 text-xs font-medium uppercase tracking-wider mt-1">Question {currentIdx + 1} of {totalQ}</p>
            </div>
          </div>
          <div className="flex items-center self-end sm:self-auto bg-slate-50 border border-slate-200 px-4 py-2 rounded-xl">
            <CircleTimer timeLeft={sectionTimerSec} total={durationSec} size={48} />
            <div className="ml-3">
              <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Section Timer</p>
              <p className="text-lg font-semibold text-slate-900 leading-none">{formatTime(sectionTimerSec)}</p>
            </div>
          </div>
        </div>

        {/* Split layout */}
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Left: audio or passage */}
          <div className="w-full lg:w-1/2 flex flex-col gap-4">
            {activeSection.section_type === "AUDIO" && activeSection.audio_url ? (
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
                <audio ref={audioRef} src={activeSection.audio_url} preload="auto" onEnded={() => setAudioState("played")} />
              </div>
            ) : activeSection.section_type === "PASSAGE" && activeSection.passage_text ? (
              <div className="bg-white border border-slate-200 rounded-2xl flex flex-col max-h-[700px] shadow-sm">
                <div className="p-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between rounded-t-2xl">
                  <span className="font-semibold text-sm uppercase tracking-wider text-slate-500">Reading Passage</span>
                  <button onClick={() => setShowPassage(!showPassage)} className="lg:hidden font-semibold text-xs text-brand-blue-600 uppercase">{showPassage ? "Hide" : "Show"}</button>
                </div>
                <div className={`p-6 overflow-y-auto flex-1 ${!showPassage ? "hidden lg:block" : "block"}`}>
                  <p className="font-serif text-slate-800 text-base leading-loose whitespace-pre-wrap">{activeSection.passage_text}</p>
                </div>
              </div>
            ) : (
              <div className={`${accent(activeSection.skill).bg} border ${accent(activeSection.skill).border} rounded-2xl p-6 hidden lg:flex flex-col items-center justify-center text-center gap-4`}>
                <span className="text-6xl">{SKILL_ICON[activeSection.skill] ?? "📝"}</span>
                <p className="font-semibold text-slate-900 uppercase tracking-wide">{SKILL_LABEL[activeSection.skill] ?? activeSection.skill}</p>
              </div>
            )}
          </div>

          {/* Right: question + input */}
          <div className="w-full lg:w-1/2 flex flex-col gap-4">
            <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 shadow-sm">
              <div className="flex justify-between items-center mb-6">
                <span className="bg-slate-100 text-slate-500 text-xs font-semibold uppercase tracking-wider px-4 py-1.5 rounded-lg border border-slate-200">Q {currentIdx+1} / {totalQ}</span>
                <span className="bg-brand-teal-50 text-brand-teal-700 border border-brand-teal-200 text-[10px] font-semibold uppercase tracking-wider px-3 py-1.5 rounded-lg">{currentQ.question_type.replace("_", " ")}</span>
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
                        className={`text-left p-4 rounded-xl border font-medium text-sm transition-all flex items-start gap-3 ${selected ? "bg-brand-teal-600 border-brand-teal-600 text-white shadow-sm" : "bg-white border-slate-200 text-slate-700 hover:border-brand-teal-300 hover:bg-slate-50"}`}>
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
                    className="w-full p-5 border border-slate-200 rounded-xl text-base text-slate-900 font-medium outline-none focus:ring-2 focus:ring-brand-teal-200 focus:border-brand-teal-300 bg-slate-50 resize-none transition-all" />
                  <div className="flex justify-between mt-2">
                    <p className="text-xs text-slate-400 font-medium">{(answers[currentQ.id] ?? "").trim().split(/\s+/).filter(Boolean).length} words</p>
                    <p className="text-[10px] text-slate-300 font-medium">Auto-saved</p>
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
                        <div className="flex items-center gap-1.5 h-10">{animBars.slice(0, 10).map((h, i) => <div key={i} className="w-1.5 bg-rose-500 rounded-full animate-pulse" style={{ height: `${10+h*28}px`, animationDelay: `${i*0.09}s` }} />)}</div>
                        {liveTranscript && <div className="w-full bg-white border border-slate-200 rounded-xl p-3 text-sm text-slate-700 font-medium italic min-h-[56px] max-h-[120px] overflow-y-auto">"{liveTranscript}"</div>}
                        <button onClick={() => stopSpeakingRecording(currentQ.id)} className="bg-rose-500 hover:bg-rose-600 text-white font-semibold text-sm px-8 py-3 rounded-xl uppercase tracking-wide shadow-sm hover:shadow-md transition-all">Stop &amp; Save</button>
                      </div>
                    ) : hasTranscript ? (
                      <div className="flex flex-col gap-3">
                        <div className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-600" /><span className="text-xs font-semibold uppercase tracking-wider text-emerald-700">Response Saved</span></div>
                        <div className="bg-white border border-emerald-200 rounded-xl p-4 text-sm text-slate-700 font-medium italic max-h-[120px] overflow-y-auto">"{answers[currentQ.id]}"</div>
                        <button onClick={() => startSpeakingRecording(currentQ.id)} className="text-sm font-semibold uppercase tracking-wide px-6 py-3 rounded-xl border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 self-start shadow-sm transition-colors">Re-record Answer</button>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center gap-4 text-center">
                        <div className="w-16 h-16 rounded-full bg-rose-50 border border-rose-200 flex items-center justify-center"><Mic className="w-8 h-8 text-rose-500" /></div>
                        <p className="text-sm text-slate-600 font-medium max-w-xs">Tap the button and speak your answer. Your response will be transcribed automatically.</p>
                        <button onClick={() => startSpeakingRecording(currentQ.id)} className="bg-indigo-600 hover:bg-indigo-700 text-white border-none font-semibold text-sm uppercase tracking-wide px-8 py-4 rounded-xl shadow-sm hover:shadow-md transition-all">Start Speaking</button>
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
                  {currentIdx === totalQ - 1 ? "Submit Section →" : "Next Question →"}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // ═══════════════════════════════════════════════════════════════════════════
  // SCORING / RESULTS
  // ═══════════════════════════════════════════════════════════════════════════

  const renderScoring = () => (
    <div className="flex flex-col items-center justify-center min-h-[70vh] animate-fade-in">
      <div className="relative mb-8">
        <div className="w-24 h-24 rounded-full border-[6px] border-slate-200 border-t-brand-teal-600 animate-spin" />
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
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-3xl font-bold text-slate-900 tracking-tight">Mock Complete</h2>
          <button onClick={() => { mockTimerStore.clearState(sessionIdRef.current ?? sessionId ?? ""); navigate("/student/dashboard", { state: { drillCompleted: true } }); }}
            className="px-6 py-3 bg-indigo-600 text-white border-none rounded-xl font-semibold text-sm uppercase hover:bg-indigo-700 shadow-sm hover:shadow-md transition-all">
            Dashboard
          </button>
        </div>

        <div className="bg-indigo-600 rounded-2xl p-8 mb-6 text-center shadow-md relative overflow-hidden">
          <div className="absolute -top-8 -right-8 text-[140px] opacity-10 pointer-events-none select-none">🏆</div>
          <p className="text-brand-teal-200 font-semibold uppercase tracking-wider mb-1">Real Band Score</p>
          <div className="text-8xl font-bold text-white leading-none mb-2">{mockResults?.real_band_score != null ? realBand.toFixed(1) : "—"}</div>
          {delta !== 0 && (
            <div className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-lg font-semibold uppercase text-sm mt-2 ${delta > 0 ? "bg-emerald-500 text-white" : "bg-rose-500 text-white"}`}>
              {delta > 0 ? `↑ +${delta.toFixed(1)}` : `↓ ${delta.toFixed(1)}`} from previous {prevBand.toFixed(1)}
            </div>
          )}
          {crossed && <div className="mt-3 inline-flex items-center gap-2 bg-amber-400 text-slate-900 px-4 py-2 rounded-lg font-semibold text-sm uppercase shadow-sm">🎊 New Band Threshold Crossed!</div>}
          <p className="text-indigo-200 text-xs font-medium mt-3 uppercase tracking-wide">Real Band = Mock × 60% + Previous Matrix × 40%</p>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-6 mb-6 text-center shadow-sm">
          <p className="text-slate-400 font-semibold uppercase tracking-wider mb-1">Momentum Earned</p>
          <div className="text-6xl font-bold text-brand-teal-600">+{momentum}</div>
          {breakdown.length > 0 && (
            <div className="flex flex-wrap justify-center gap-2 mt-4">
              {breakdown.map((b: any, i: number) => (
                <span key={i} className="bg-indigo-50 text-indigo-700 text-[10px] font-semibold uppercase tracking-wider px-3 py-1 rounded-full border border-indigo-200">+{b.points} {b.reason}</span>
              ))}
            </div>
          )}
        </div>

        {skillScores.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 mb-6">
            {skillScores.map((s, i) => {
              const displayNewBand = clampBandMove(s.prev_matrix_band, s.new_matrix_band);
              const a              = accent(s.skill);
              const matrixDelta    = s.prev_matrix_band !== null ? Math.round((displayNewBand - s.prev_matrix_band) * 10) / 10 : null;
              const matrixUp       = matrixDelta !== null && matrixDelta > 0;
              const diagDelta      = s.delta_from_diag;
              const diagUp         = diagDelta !== null && diagDelta !== undefined && diagDelta > 0;
              const subSkills: MockSubSkillScore[] = (s.sub_skill_scores && s.sub_skill_scores.length > 0) ? s.sub_skill_scores : (s.total > 0 ? [{ sub_skill: "OVERALL", band: s.band, correct: s.correct, total_mcq: s.total, ai_band: null }] : []);
              const feedbackItems  = (s.sub_skill_scores ?? []).filter(ss => ss.ai_feedback?.rationale);
              const hasAnyFeedback = feedbackItems.length > 0;
              const isFeedbackOpen = expandedFeedback.has(i);
              const insight        = s.insight ?? skillInsight(s);

              return (
                <div key={i} className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex flex-col">
                  <div className="flex items-center gap-3 mb-4">
                    <span className={`w-10 h-10 rounded-lg ${a.bg} border ${a.border} flex items-center justify-center text-2xl`}>{SKILL_ICON[s.skill] ?? "📝"}</span>
                    <div>
                      <p className="font-semibold text-slate-900 text-sm uppercase tracking-wide">{SKILL_LABEL[s.skill] ?? s.skill}</p>
                      <p className="text-slate-400 text-[10px] font-medium uppercase">{s.ai_graded ? "MCQ + AI Graded" : "Pure MCQ"}</p>
                    </div>
                  </div>
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 mb-0.5">Mock Score</p>
                  <p className="text-5xl font-bold text-slate-900 leading-none mb-1">{s.band > 0 ? s.band.toFixed(1) : "—"}</p>
                  {s.total > 0 && <p className="text-xs text-slate-400 font-medium mb-3">{s.correct} / {s.total} MCQ correct</p>}
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
                              {ss.ai_band !== null && ss.ai_band !== undefined && <span className="text-[9px] text-slate-400 font-medium">AI: {ss.ai_band.toFixed(1)}</span>}
                            </div>
                            {ss.total_mcq > 0 && <p className="text-[9px] text-slate-400 font-medium mt-0.5">{ss.correct}/{ss.total_mcq} MCQ</p>}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  {hasAnyFeedback && (
                    <div className="mb-4">
                      <button onClick={() => toggleFeedback(i)} aria-expanded={isFeedbackOpen}
                        className="w-full flex items-center justify-between px-3 py-2.5 rounded-lg bg-slate-50 border border-slate-200 hover:bg-slate-100 transition-colors">
                        <span className="text-xs font-semibold uppercase tracking-wider text-slate-600 flex items-center gap-2">
                          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>
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
                                      <li key={k} className="flex items-start gap-2"><span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-indigo-500 flex-shrink-0" /><span className="text-xs text-slate-700 font-medium leading-relaxed">{obs}</span></li>
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
                      {matrixDelta !== null && <span className={`text-xs font-semibold ${matrixUp ? "text-emerald-600" : "text-rose-600"}`}>{matrixUp ? `+${matrixDelta.toFixed(1)}` : matrixDelta.toFixed(1)}</span>}
                    </div>
                    {s.diagnostic_band !== null && (
                      <div className={`flex items-center gap-2 text-xs font-medium ${diagUp ? "text-emerald-600" : "text-slate-500"}`}>
                        <BookOpen className="w-3 h-3" /><span>Diagnostic: {s.diagnostic_band.toFixed(1)}</span>
                        {diagDelta !== null && diagDelta !== undefined && <span className={`font-semibold ${diagUp ? "text-emerald-600" : "text-rose-600"}`}>{diagUp ? `↑ +${diagDelta.toFixed(1)}` : `↓ ${Math.abs(diagDelta).toFixed(1)}`} from start</span>}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
        <p className="text-center text-slate-500 font-medium text-sm">Your Real Band and competency matrix have been updated. Keep drilling to improve your weakest skills before the next mock.</p>
      </div>
    );
  };

  // ═══════════════════════════════════════════════════════════════════════════
  // RENDER
  // ═══════════════════════════════════════════════════════════════════════════

  return (
    <div className="min-h-screen bg-slate-50">
      <TopNavBar totalMomentum={totalMomentum} phase={phase} onBack={() => {
        if (phase === "session") { setPhase("dashboard"); }
        else { navigate("/student/dashboard"); }
      }} />
      <div className="pt-16">
        {phase === "gate"          && renderGate()}
        {phase === "dashboard"     && renderDashboard()}
        {phase === "section_intro" && renderSectionIntro()}
        {phase === "session"       && renderSession()}
        {phase === "scoring"       && renderScoring()}
        {phase === "results"       && renderResults()}
      </div>
    </div>
  );
}
