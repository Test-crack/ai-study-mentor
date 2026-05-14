import React, { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  GraduationCap, ArrowRight, CheckCircle2, AlertCircle, Mic, PlayCircle,
  Zap, Loader2, Lock, XCircle, Trophy, Calendar, BookOpen
} from "lucide-react";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { useMomentum } from "@/features/student/Context/MomentumContext";
import { callBackend } from "@/features/auth/services/authClient";
import { transformSectionAudioUrls } from "@/features/student/utils/iaAudioUtils";

// ─── Types ────────────────────────────────────────────────────────────────────

type Phase = "gate" | "session" | "interim" | "scoring" | "results";

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
  earned_used_this_month:    boolean;
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
}

interface MockSubSkillScore {
  sub_skill:  string;
  band:       number;
  correct:    number;
  total_mcq:  number;
  ai_band:    number | null;
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
  sub_skill_scores?:  MockSubSkillScore[];  // W/S only
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
};
const MOCK_TOTAL_SECS = 3 * 60 * 60;   // 3-hour global timer — no per-section resets
const STORAGE_KEY = "tc_full_mock_assessment_state";

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

function firstOfNextMonth(): string {
  const d = new Date();
  d.setMonth(d.getMonth() + 1);
  d.setDate(1);
  return d.toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" });
}

// ─── Circular timer ───────────────────────────────────────────────────────────

const CircleTimer: React.FC<{ timeLeft: number; total: number; size?: number }> = ({ timeLeft, total, size = 64 }) => {
  const pct   = total > 0 ? timeLeft / total : 1;
  const r     = (size - 8) / 2;
  const circ  = 2 * Math.PI * r;
  const dash  = circ * pct;
  const isUrgent = pct < 0.2;
  const color = isUrgent ? "#EF4444" : pct < 0.5 ? "#F59E0B" : "#4338CA";
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

// ─── Nav ──────────────────────────────────────────────────────────────────────

function TopNavBar({ totalMomentum }: { totalMomentum: number }) {
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-white border-b-2 border-gray-900 transform-gpu">
      <div className="w-full px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 bg-indigo-700 border-2 border-gray-900 rounded-lg" style={{ boxShadow: "3px 3px 0 #0F0F0F" }}>
              <GraduationCap className="h-5 w-5 text-white" />
            </div>
            <span className="text-xl font-black text-gray-900 uppercase tracking-tight">TestCrack</span>
          </div>
          <div className="flex items-center gap-2 bg-indigo-500/10 border-2 border-gray-900 px-4 py-1.5 rounded-full" style={{ boxShadow: "2px 2px 0 #0F0F0F" }}>
            <Zap className="w-4 h-4 text-amber-400 fill-amber-400" />
            <span className="font-black text-gray-900">{totalMomentum}</span>
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
  const [sections, setSections]                 = useState<MockSection[] | null>(null);
  const [currentSectionIdx, setCurrentSectionIdx] = useState(0);
  const [currentIdx, setCurrentIdx]             = useState(0);
  const [isLoading, setIsLoading]               = useState(false);
  const [answers, setAnswers]                   = useState<Record<string, string>>({});
  const [mockResults, setMockResults]           = useState<any>(null);
  const [sessionMomentum, setSessionMomentum]   = useState(0);

  // Global 3-hour timer — never resets between sections
  const [timeLeft, setTimeLeft]                 = useState(MOCK_TOTAL_SECS);

  // Audio / Passage
  const audioRef                                = useRef<HTMLAudioElement>(null);
  const [audioState, setAudioState]             = useState<"idle" | "playing" | "played">("idle");
  const [showPassage, setShowPassage]           = useState(false);
  const [animBars]                              = useState(() => Array.from({ length: 12 }, () => Math.random()));

  // Speaking
  const recognitionRef                          = useRef<any>(null);
  const transcriptAccumRef                      = useRef<string>("");
  const [isRecording, setIsRecording]           = useState(false);
  const [liveTranscript, setLiveTranscript]     = useState("");
  const [recordedPrompts, setRecordedPrompts]   = useState<Record<string, boolean>>({});

  // Writing
  const writingDebounceRef                      = useRef<ReturnType<typeof setTimeout> | null>(null);

  const currentSection = sections?.[currentSectionIdx] ?? null;
  // For CircleTimer the max is always the full 3-hour test duration
  const currentSectionTotalSec = MOCK_TOTAL_SECS;

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

  // ── Timer tick ──────────────────────────────────────────────────────────────
  useEffect(() => {
    if (phase !== "session" || timeLeft <= 0) return;
    const t = setInterval(() => setTimeLeft(s => s - 1), 1000);
    return () => clearInterval(t);
  }, [phase, timeLeft]);

  // ── Timer expiry → force-complete section ───────────────────────────────────
  useEffect(() => {
    if (phase === "session" && timeLeft === 0) {
      setIsRecording(false);
      void handleSectionComplete();
    }
  }, [timeLeft, phase]);

  // ── Cleanup recording/debounce on question or section change ────────────────
  useEffect(() => {
    if (recognitionRef.current) {
      try { recognitionRef.current.stop(); } catch { /**/ }
      recognitionRef.current = null;
    }
    setIsRecording(false);
    setLiveTranscript("");
    if (writingDebounceRef.current) clearTimeout(writingDebounceRef.current);
  }, [currentIdx, currentSectionIdx]);

  // ── Helpers ─────────────────────────────────────────────────────────────────

  const backendUrl = () => import.meta.env.VITE_BACKEND_URL || "http://localhost:4000";

  const persistAnswer = (questionId: string, answer: string) => {
    if (!sessionId) return;
    callBackend(`${backendUrl()}/api/mock/answer`, {
      method: "POST", body: JSON.stringify({ session_id: sessionId, question_id: questionId, answer })
    }).catch(e => console.warn("[Mock] answer save failed:", e));
  };

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
      setSessionId(res.session_id);
      setSections(transformSectionAudioUrls(res.sections));
      setCurrentSectionIdx(res.current_section_idx ?? 0);
      setCurrentIdx(0);
      setAnswers(res.saved_answers ?? {});
      setAudioState("idle");
      setShowPassage(false);
      setIsRecording(false);
      // Global timer — restore remaining time from backend (accounts for time away)
      setTimeLeft(Math.floor((res.time_remaining_ms ?? MOCK_TOTAL_SECS * 1000) / 1000));
      setPhase("session");
    } catch (err) {
      console.error("[Mock] begin error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  // ── Section completion ───────────────────────────────────────────────────────

  const handleSectionComplete = useCallback(async () => {
    if (!sections) return;
    if (currentSectionIdx < sections.length - 1) {
      setPhase("interim");
    } else {
      setPhase("scoring");
      try {
        const res = await callBackend(`${backendUrl()}/api/mock/submit`, {
          method: "POST", body: JSON.stringify({ session_id: sessionId })
        });
        if (res.success) {
          setSessionMomentum(res.momentum_awarded ?? 0);
          if (res.updated_momentum !== undefined) syncMomentum(res.updated_momentum);
          setMockResults(res);
        }
      } catch (err) {
        console.error("[Mock] submit error:", err);
      }
      setTimeout(() => setPhase("results"), 3500);
    }
  }, [sections, currentSectionIdx, sessionId]);

  const advanceToNextSection = () => {
    const nextIdx = currentSectionIdx + 1;
    if (audioRef.current && !audioRef.current.paused) { audioRef.current.pause(); audioRef.current.currentTime = 0; }
    // Stamp navigation position on backend — timer is global so no section_started_at needed
    if (sessionId) {
      callBackend(`${backendUrl()}/api/mock/answer`, {
        method: "POST", body: JSON.stringify({ session_id: sessionId, section_advance: nextIdx })
      }).catch(e => console.warn("[Mock] section advance failed:", e));
    }
    setCurrentSectionIdx(nextIdx);
    setCurrentIdx(0);
    setAnswers({});
    // DO NOT reset timeLeft — global timer keeps counting down across all sections
    setAudioState("idle"); setShowPassage(false); setIsRecording(false);
    setPhase("session");
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
    <div className={`flex items-start gap-3 p-3 rounded-xl border-2 ${met ? "bg-emerald-50 border-emerald-200" : "bg-gray-50 border-gray-200"}`}>
      <div className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 ${met ? "bg-emerald-500" : "bg-gray-300"}`}>
        {met ? <CheckCircle2 className="w-3 h-3 text-white" /> : <XCircle className="w-3 h-3 text-white" />}
      </div>
      <div>
        <p className={`text-sm font-black uppercase tracking-wide ${met ? "text-emerald-800" : "text-gray-600"}`}>{label}</p>
        {detail && <p className={`text-xs font-medium mt-0.5 ${met ? "text-emerald-600" : "text-gray-400"}`}>{detail}</p>}
      </div>
    </div>
  );

  const renderNotEligible = () => {
    const p = mockStatus!.progress;
    const allSkills = ["LISTENING", "READING", "WRITING", "SPEAKING"];
    const skillsMet = allSkills.every(s => p.ia_per_skill[s]);
    return (
      <div className="max-w-2xl mx-auto animate-fade-in pt-12 px-4">
        <div className="bg-white border-2 border-gray-900 rounded-2xl p-8 shadow-[8px_8px_0_#0F0F0F]">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 bg-gray-100 border-2 border-gray-300 rounded-xl flex items-center justify-center">
              <Lock className="w-6 h-6 text-gray-500" />
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Not Yet Unlocked</p>
              <h2 className="text-2xl font-black text-gray-900 uppercase tracking-tight">Mock IELTS</h2>
            </div>
          </div>

          <p className="text-gray-500 font-medium text-sm mb-6">Complete all requirements below to unlock your Mock test.</p>

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

          {/* Per-skill IA coverage visual */}
          <div className="bg-gray-50 border-2 border-gray-200 rounded-xl p-4 mb-6">
            <p className="text-[9px] font-black uppercase tracking-widest text-gray-400 mb-3">Skill Coverage</p>
            <div className="grid grid-cols-4 gap-2">
              {allSkills.map(skill => (
                <div key={skill} className={`flex flex-col items-center gap-1.5 p-2.5 rounded-lg border-2 ${p.ia_per_skill[skill] ? "bg-emerald-50 border-emerald-300" : "bg-white border-gray-200"}`}>
                  <span className="text-xl">{SKILL_ICON[skill]}</span>
                  <span className={`text-[9px] font-black uppercase tracking-widest ${p.ia_per_skill[skill] ? "text-emerald-700" : "text-gray-400"}`}>
                    {SKILL_LABEL[skill].slice(0, 3)}
                  </span>
                  {p.ia_per_skill[skill]
                    ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                    : <div className="w-3.5 h-3.5 rounded-full border-2 border-gray-300" />
                  }
                </div>
              ))}
            </div>
          </div>

          <button onClick={() => navigate("/student/dashboard")}
            className="w-full py-3 border-2 border-gray-300 rounded-xl font-black text-sm text-gray-500 uppercase tracking-wide hover:bg-gray-50">
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  };

  const renderMockAvailable = () => (
    <div className="max-w-2xl mx-auto animate-fade-in pt-12 px-4">
      <div className="bg-white border-2 border-gray-900 rounded-2xl p-8 sm:p-10 shadow-[8px_8px_0_#0F0F0F]">
        {/* Badge */}
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded border-2 border-gray-900 bg-purple-700 text-white text-xs font-black tracking-widest uppercase mb-6 shadow-[3px_3px_0_#0F0F0F]">
          <Trophy className="w-4 h-4" /> Full Mock IELTS
        </div>

        {/* All requirements met */}
        <div className="bg-emerald-50 border-2 border-emerald-300 rounded-xl p-4 mb-6 flex items-center gap-3">
          <CheckCircle2 className="w-6 h-6 text-emerald-600 flex-shrink-0" />
          <div>
            <p className="font-black text-emerald-800 text-sm uppercase tracking-wide">All Requirements Met</p>
            <p className="text-xs text-emerald-600 font-medium">{mockStatus!.progress.ia_completed} IAs · All 4 skills covered · Band improved +{mockStatus!.progress.best_improvement.toFixed(1)}</p>
          </div>
        </div>

        <h1 className="text-4xl font-black text-gray-900 uppercase tracking-tight mb-3">Ready for Your<br /><span className="text-purple-700">Mock IELTS?</span></h1>
        <p className="text-gray-500 font-medium text-sm mb-6 leading-relaxed">
          A full-length IELTS simulation across all 4 skills. Hard timers, no pause. Your Real Band score updates after this session.
        </p>

        {/* Section breakdown */}
        <div className="grid grid-cols-4 gap-2 mb-8">
          {[
            { skill: "LISTENING", time: "30 min" },
            { skill: "READING",   time: "30 min" },
            { skill: "WRITING",   time: "40 min" },
            { skill: "SPEAKING",  time: "20 min" },
          ].map(s => (
            <div key={s.skill} className="bg-gray-50 border-2 border-gray-200 rounded-xl p-3 flex flex-col items-center gap-1.5">
              <span className="text-2xl">{SKILL_ICON[s.skill]}</span>
              <span className="text-[9px] font-black uppercase tracking-widest text-gray-500">{s.skill.slice(0, 3)}</span>
              <span className="text-[10px] font-bold text-gray-400">{s.time}</span>
            </div>
          ))}
        </div>

        <div className="flex flex-col gap-3">
          <button onClick={() => void beginMock("STANDARD")} disabled={isLoading}
            className="w-full bg-purple-700 hover:bg-purple-600 disabled:opacity-60 text-white font-black text-base uppercase tracking-wide py-4 rounded-xl border-2 border-gray-900 flex items-center justify-center gap-2 shadow-[4px_4px_0_#0F0F0F] transition-all">
            {isLoading ? <><Loader2 className="w-4 h-4 animate-spin" /> Loading…</> : <>Start Mock Test <ArrowRight className="w-5 h-5" /></>}
          </button>
          <button onClick={() => navigate("/student/dashboard")}
            className="w-full py-3 border-2 border-gray-300 rounded-xl font-black text-sm text-gray-500 uppercase tracking-wide hover:bg-gray-50">
            Cancel
          </button>
        </div>

        {/* Earned path */}
        {mockStatus!.can_start_earned && (
          <div className="mt-6 border-t-2 border-gray-100 pt-6">
            <p className="text-xs font-black uppercase tracking-widest text-gray-400 mb-3">Or Exchange Momentum</p>
            <button onClick={() => void beginMock("EARNED")} disabled={isLoading}
              className="w-full bg-amber-50 hover:bg-amber-100 border-2 border-amber-400 rounded-xl py-3 font-black text-sm text-amber-800 uppercase tracking-wide flex items-center justify-center gap-2 transition-all">
              <Zap className="w-4 h-4 text-amber-500 fill-amber-500" />
              Extra Mock — {mockStatus!.earned_mock_cost.toLocaleString()} Momentum
            </button>
            <p className="text-[10px] text-gray-400 font-medium text-center mt-2">You have {mockStatus!.momentum_score.toLocaleString()} pts · Max 2 mocks / month</p>
          </div>
        )}
      </div>
    </div>
  );

  const renderMonthUsed = () => (
    <div className="max-w-2xl mx-auto animate-fade-in pt-12 px-4">
      <div className="bg-white border-2 border-gray-900 rounded-2xl p-8 shadow-[8px_8px_0_#0F0F0F]">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 bg-emerald-100 border-2 border-emerald-400 rounded-xl flex items-center justify-center">
            <CheckCircle2 className="w-6 h-6 text-emerald-600" />
          </div>
          <div>
            <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">This Month</p>
            <h2 className="text-2xl font-black text-gray-900 uppercase tracking-tight">Mock Completed</h2>
          </div>
        </div>

        <div className="bg-indigo-50 border-2 border-indigo-200 rounded-xl p-4 mb-6 flex items-center gap-3">
          <Calendar className="w-5 h-5 text-indigo-600 flex-shrink-0" />
          <div>
            <p className="font-black text-indigo-800 text-sm">Next standard mock available</p>
            <p className="text-indigo-600 font-bold text-sm">{firstOfNextMonth()}</p>
          </div>
        </div>

        <p className="text-gray-500 text-sm font-medium mb-6">
          One standard mock per calendar month keeps your progress meaningful. Your Real Band has been updated — keep drilling to build on it.
        </p>

        {mockStatus!.can_start_earned && (
          <div className="mb-4">
            <p className="text-xs font-black uppercase tracking-widest text-gray-400 mb-2">Want an extra mock this month?</p>
            <button onClick={() => void beginMock("EARNED")} disabled={isLoading}
              className="w-full bg-amber-50 hover:bg-amber-100 border-2 border-amber-400 rounded-xl py-3 font-black text-sm text-amber-800 uppercase tracking-wide flex items-center justify-center gap-2">
              <Zap className="w-4 h-4 text-amber-500 fill-amber-500" />
              Exchange {mockStatus!.earned_mock_cost.toLocaleString()} Momentum for Extra Mock
            </button>
          </div>
        )}

        <button onClick={() => navigate("/student/dashboard")}
          className="w-full py-3 border-2 border-gray-300 rounded-xl font-black text-sm text-gray-500 uppercase tracking-wide hover:bg-gray-50">
          Back to Dashboard
        </button>
      </div>
    </div>
  );

  const renderActiveSession = () => (
    <div className="max-w-2xl mx-auto animate-fade-in pt-12 px-4">
      <div className="bg-white border-2 border-gray-900 rounded-2xl p-8 shadow-[8px_8px_0_#0F0F0F]">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 bg-amber-100 border-2 border-amber-400 rounded-xl flex items-center justify-center text-2xl">⏱</div>
          <div>
            <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">In Progress</p>
            <h2 className="text-2xl font-black text-gray-900 uppercase tracking-tight">Mock Paused</h2>
          </div>
        </div>
        <p className="text-gray-500 text-sm font-medium mb-6">
          You have an active mock session. The timer counts elapsed real time — continue from where you left off.
        </p>
        <button onClick={() => void beginMock("STANDARD")} disabled={isLoading}
          className="w-full bg-gray-900 hover:bg-gray-800 text-white font-black text-base uppercase tracking-wide py-4 rounded-xl border-2 border-gray-900 flex items-center justify-center gap-2 shadow-[4px_4px_0_#4338CA]">
          {isLoading ? <><Loader2 className="w-4 h-4 animate-spin" /> Loading…</> : <>Continue Mock <ArrowRight className="w-5 h-5" /></>}
        </button>
        <button onClick={() => navigate("/student/dashboard")} className="w-full py-3 mt-3 border-2 border-gray-300 rounded-xl font-black text-sm text-gray-500 uppercase tracking-wide hover:bg-gray-50">
          Back to Dashboard
        </button>
      </div>
    </div>
  );

  const renderGate = () => {
    if (statusLoading || !mockStatus) {
      return (
        <div className="min-h-screen flex items-center justify-center">
          <Loader2 className="w-10 h-10 text-purple-700 animate-spin" />
        </div>
      );
    }
    if (mockStatus.has_active_session) return renderActiveSession();
    if (!mockStatus.is_eligible)        return renderNotEligible();
    if (mockStatus.standard_used_this_month && !mockStatus.can_start_earned) return renderMonthUsed();
    if (mockStatus.standard_used_this_month && mockStatus.can_start_earned)  return renderMonthUsed();
    return renderMockAvailable();
  };

  // ═══════════════════════════════════════════════════════════════════════════
  // SESSION SCREEN
  // ═══════════════════════════════════════════════════════════════════════════

  const renderSession = () => {
    if (isLoading || !currentSection) {
      return (
        <div className="min-h-[70vh] flex flex-col items-center justify-center animate-fade-in">
          <Loader2 className="w-12 h-12 text-purple-700 animate-spin mb-4" />
          <p className="text-gray-500 font-black uppercase tracking-widest text-sm">Loading Questions…</p>
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
      <div className="max-w-6xl mx-auto pt-6 pb-16 px-4 animate-fade-in">

        {/* Section progress pills */}
        <div className="flex items-center justify-center gap-3 mb-8">
          {sections?.map((sec, i) => (
            <div key={i} className="flex items-center gap-3">
              <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border-2 font-black text-xs uppercase tracking-widest ${
                i < currentSectionIdx ? "bg-emerald-400 border-gray-900 text-gray-900" :
                i === currentSectionIdx ? "bg-gray-900 border-gray-900 text-white" : "bg-white border-gray-300 text-gray-400"
              }`} style={i <= currentSectionIdx ? { boxShadow: "2px 2px 0 #0F0F0F" } : {}}>
                {i < currentSectionIdx ? <CheckCircle2 className="w-4 h-4" /> : <span>{SKILL_ICON[sec.skill] ?? "📝"}</span>}
                <span className="hidden sm:inline">{SKILL_LABEL[sec.skill] ?? sec.skill}</span>
              </div>
              {i < (sections?.length ?? 1) - 1 && <div className={`w-6 h-1 ${i < currentSectionIdx ? "bg-gray-900" : "bg-gray-300"}`} />}
            </div>
          ))}
        </div>

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between bg-white border-2 border-gray-900 rounded-xl p-4 sm:p-6 mb-6 gap-4" style={{ boxShadow: "6px 6px 0 #0F0F0F" }}>
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-purple-700 border-2 border-gray-900 rounded-xl flex items-center justify-center text-3xl" style={{ boxShadow: "3px 3px 0 #0F0F0F" }}>
              {SKILL_ICON[currentSection.skill] ?? "📝"}
            </div>
            <div>
              <p className="text-gray-900 font-black text-lg uppercase tracking-wide">{SKILL_LABEL[currentSection.skill] ?? currentSection.skill}</p>
              <p className="text-gray-500 text-xs font-bold uppercase tracking-widest mt-1">Question {currentIdx + 1} of {totalQ}</p>
            </div>
          </div>
          <div className="flex items-center self-end sm:self-auto bg-gray-50 border-2 border-gray-900 px-4 py-2 rounded-xl" style={{ boxShadow: "inset 2px 2px 0 rgba(0,0,0,0.05)" }}>
            <CircleTimer timeLeft={timeLeft} total={currentSectionTotalSec} size={48} />
            <div className="ml-3">
              <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Section Timer</p>
              <p className="text-lg font-black text-gray-900 leading-none">{formatTime(timeLeft)}</p>
            </div>
          </div>
        </div>

        {/* Split layout */}
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Left: audio or passage */}
          <div className="w-full lg:w-1/2 flex flex-col gap-4">
            {currentSection.section_type === "AUDIO" && currentSection.audio_url ? (
              <div className="bg-indigo-50 border-2 border-gray-900 rounded-xl p-8 text-center flex flex-col items-center" style={{ boxShadow: "6px 6px 0 #0F0F0F" }}>
                <button onClick={() => { if (audioState === "idle" && audioRef.current) { audioRef.current.play(); setAudioState("playing"); } }}
                  disabled={audioState !== "idle"}
                  className={`w-24 h-24 border-2 border-gray-900 rounded-full flex items-center justify-center text-white mb-6 shadow-[4px_4px_0_#0F0F0F] ${audioState === "idle" ? "bg-indigo-700 hover:bg-indigo-600" : audioState === "playing" ? "bg-amber-500" : "bg-emerald-500"}`}>
                  {audioState === "idle" && <PlayCircle className="w-12 h-12 ml-1" />}
                  {audioState === "playing" && <div className="flex items-center gap-1.5 h-10">{animBars.slice(0,4).map((h,i) => <div key={i} className="w-2 bg-white rounded-full animate-pulse" style={{ height: `${20+h*40}px`, animationDelay: `${i*0.15}s` }} />)}</div>}
                  {audioState === "played" && <CheckCircle2 className="w-12 h-12" />}
                </button>
                <p className="text-gray-900 font-black text-lg uppercase tracking-wide mb-2">Listening Audio</p>
                <p className="text-gray-600 font-medium text-sm">{audioState === "played" ? "Playback complete — answer the questions." : "Listen carefully. Audio plays once."}</p>
                <audio ref={audioRef} src={currentSection.audio_url} preload="auto" onEnded={() => setAudioState("played")} />
              </div>
            ) : currentSection.section_type === "PASSAGE" && currentSection.passage_text ? (
              <div className="bg-white border-2 border-gray-900 rounded-xl flex flex-col max-h-[700px]" style={{ boxShadow: "6px 6px 0 #0F0F0F" }}>
                <div className="p-4 border-b-2 border-gray-900 bg-gray-50 flex items-center justify-between">
                  <span className="font-black text-sm uppercase tracking-widest text-gray-500">Reading Passage</span>
                  <button onClick={() => setShowPassage(!showPassage)} className="lg:hidden font-black text-xs text-indigo-700 uppercase">{showPassage ? "Hide" : "Show"}</button>
                </div>
                <div className={`p-6 overflow-y-auto flex-1 ${!showPassage ? "hidden lg:block" : "block"}`}>
                  <p className="font-serif text-gray-800 text-base leading-loose whitespace-pre-wrap">{currentSection.passage_text}</p>
                </div>
              </div>
            ) : (
              <div className="bg-purple-50 border-2 border-gray-200 rounded-xl p-6 hidden lg:flex flex-col items-center justify-center text-center gap-4">
                <span className="text-6xl">{SKILL_ICON[currentSection.skill] ?? "📝"}</span>
                <p className="font-black text-gray-900 uppercase tracking-wide">{SKILL_LABEL[currentSection.skill] ?? currentSection.skill}</p>
                <p className="text-gray-400 text-sm font-medium">Section {currentSectionIdx + 1} of {sections?.length}</p>
              </div>
            )}
          </div>

          {/* Right: question + input */}
          <div className="w-full lg:w-1/2 flex flex-col gap-4">
            <div className="bg-white border-2 border-gray-900 rounded-xl p-6 sm:p-8" style={{ boxShadow: "6px 6px 0 #0F0F0F" }}>
              <div className="flex justify-between items-center mb-6">
                <span className="bg-gray-100 text-gray-500 text-xs font-black uppercase tracking-widest px-4 py-1.5 rounded border-2 border-gray-200">Q {currentIdx+1} / {totalQ}</span>
                <span className="bg-purple-100 text-purple-800 border-2 border-purple-300 text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-lg">{currentQ.question_type.replace("_", " ")}</span>
              </div>

              <h3 className="text-xl font-black text-gray-900 mb-8 leading-snug">
                {currentQ.question_type === "SPEAKING_PROMPT" ? `"${currentQ.prompt_text}"` : currentQ.prompt_text}
              </h3>

              {/* MCQ */}
              {currentQ.question_type === "MCQ" && optionKeys.length > 0 && (
                <div className="flex flex-col gap-3">
                  {optionKeys.map(key => {
                    const selected = answers[currentQ.id] === key;
                    return (
                      <button key={key} onClick={() => setAnswers(p => ({ ...p, [currentQ.id]: key }))}
                        className={`text-left p-4 rounded-xl border-2 font-bold text-sm transition-all flex items-start gap-3 ${selected ? "bg-gray-900 border-gray-900 text-white" : "bg-white border-gray-300 text-gray-700 hover:border-gray-900"}`}
                        style={selected ? { boxShadow: "3px 3px 0 #0F0F0F" } : {}}>
                        <span className={`w-6 h-6 flex-shrink-0 rounded border-2 flex items-center justify-center font-black text-xs ${selected ? "border-white text-white" : "border-gray-400 text-gray-500"}`}>{key}</span>
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
                    const color = val === "TRUE" ? "emerald" : val === "FALSE" ? "rose" : "amber";
                    return (
                      <button key={val} onClick={() => setAnswers(p => ({ ...p, [currentQ.id]: val }))}
                        className={`p-4 rounded-xl border-2 font-black text-sm uppercase tracking-wide transition-all ${selected ? `bg-${color}-600 border-gray-900 text-white shadow-[3px_3px_0_#0F0F0F]` : "bg-white border-gray-300 text-gray-700 hover:border-gray-900"}`}>
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
                    className="w-full p-5 border-2 border-gray-900 rounded-xl text-base font-medium outline-none focus:ring-2 focus:ring-purple-200 bg-gray-50 resize-none"
                    style={{ boxShadow: "inset 3px 3px 0 rgba(0,0,0,0.05)" }} />
                  <div className="flex justify-between mt-2">
                    <p className="text-xs text-gray-400 font-bold">{(answers[currentQ.id] ?? "").trim().split(/\s+/).filter(Boolean).length} words</p>
                    <p className="text-[10px] text-gray-300 font-medium">Auto-saved</p>
                  </div>
                </div>
              )}

              {/* SPEAKING_PROMPT */}
              {currentQ.question_type === "SPEAKING_PROMPT" && (() => {
                const hasTranscript = !!(answers[currentQ.id]?.trim()) && answers[currentQ.id] !== "[no transcript]";
                return (
                  <div className="bg-gray-50 border-2 border-gray-300 rounded-2xl p-6">
                    {isRecording ? (
                      <div className="flex flex-col items-center gap-4">
                        <div className="flex items-center gap-1.5 h-10">
                          {animBars.slice(0, 10).map((h, i) => <div key={i} className="w-1.5 bg-rose-500 rounded-full animate-pulse" style={{ height: `${10+h*28}px`, animationDelay: `${i*0.09}s` }} />)}
                        </div>
                        {liveTranscript && <div className="w-full bg-white border border-gray-200 rounded-xl p-3 text-sm text-gray-700 font-medium italic min-h-[56px] max-h-[120px] overflow-y-auto">"{liveTranscript}"</div>}
                        <button onClick={() => stopSpeakingRecording(currentQ.id)}
                          className="bg-rose-600 hover:bg-rose-700 text-white font-black text-sm px-8 py-3 rounded-xl border-2 border-gray-900 uppercase tracking-wide shadow-[3px_3px_0_#0F0F0F]">
                          Stop &amp; Save
                        </button>
                      </div>
                    ) : hasTranscript ? (
                      <div className="flex flex-col gap-3">
                        <div className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-600" /><span className="text-xs font-black uppercase tracking-widest text-emerald-700">Response Saved</span></div>
                        <div className="bg-white border-2 border-emerald-200 rounded-xl p-4 text-sm text-gray-700 font-medium italic max-h-[120px] overflow-y-auto">"{answers[currentQ.id]}"</div>
                        <button onClick={() => startSpeakingRecording(currentQ.id)}
                          className="text-sm font-black uppercase tracking-wide px-6 py-3 rounded-xl border-2 border-gray-900 bg-white text-gray-900 hover:bg-gray-50 self-start"
                          style={{ boxShadow: "3px 3px 0 #0F0F0F" }}>Re-record Answer</button>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center gap-4 text-center">
                        <div className="w-16 h-16 rounded-full bg-purple-100 border-2 border-purple-700 flex items-center justify-center"><Mic className="w-8 h-8 text-purple-700" /></div>
                        <p className="text-sm text-gray-600 font-medium max-w-xs">Tap the button and speak your answer. Your response will be transcribed automatically.</p>
                        <button onClick={() => startSpeakingRecording(currentQ.id)}
                          className="bg-purple-700 hover:bg-purple-600 text-white font-black text-sm uppercase tracking-wide px-8 py-4 rounded-xl border-2 border-gray-900"
                          style={{ boxShadow: "4px 4px 0 #0F0F0F" }}>Start Speaking</button>
                      </div>
                    )}
                  </div>
                );
              })()}

              {/* Navigation */}
              <div className="mt-8 flex gap-4">
                <button onClick={() => setCurrentIdx(i => i - 1)} disabled={currentIdx === 0}
                  className="px-6 py-4 border-2 border-gray-900 rounded-xl font-black text-gray-600 disabled:opacity-30 hover:bg-gray-50 uppercase text-sm tracking-wide">
                  Prev
                </button>
                <button onClick={handleNextQuestion}
                  disabled={!canProceed || (currentQ.question_type === "SPEAKING_PROMPT" && isRecording)}
                  className={`flex-1 font-black text-sm uppercase tracking-wide border-2 border-gray-900 rounded-xl py-4 transition-all ${!canProceed ? "bg-gray-100 text-gray-400 opacity-60 cursor-not-allowed" : "bg-gray-900 text-white hover:bg-gray-800"}`}
                  style={canProceed ? { boxShadow: "4px 4px 0 #0F0F0F" } : {}}>
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
    const nextSec = sections?.[currentSectionIdx + 1];
    return (
      <div className="min-h-[70vh] flex items-center justify-center animate-fade-in px-4 pt-12">
        <div className="max-w-lg w-full bg-white border-2 border-gray-900 rounded-2xl p-10 text-center shadow-[8px_8px_0_#0F0F0F]">
          <div className="w-20 h-20 bg-emerald-100 border-2 border-emerald-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-[4px_4px_0_#10B981]">
            <CheckCircle2 className="w-10 h-10 text-emerald-600" />
          </div>
          <h2 className="text-3xl font-black text-gray-900 uppercase tracking-tight mb-2">Section {currentSectionIdx + 1} Complete</h2>
          <p className="text-gray-500 font-medium mb-8">
            {SKILL_LABEL[sections?.[currentSectionIdx]?.skill ?? ""] ?? ""} done. Take a breath — the next section has its own fresh timer.
          </p>
          {nextSec && (
            <div className="bg-purple-50 border-2 border-gray-900 rounded-xl p-5 mb-8 text-left shadow-[4px_4px_0_#0F0F0F]">
              <p className="text-xs font-black text-purple-700 uppercase tracking-widest mb-2">Up Next</p>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-3xl">{SKILL_ICON[nextSec.skill] ?? "📝"}</span>
                  <div>
                    <h3 className="text-xl font-black text-gray-900 uppercase">{SKILL_LABEL[nextSec.skill] ?? nextSec.skill}</h3>
                    <p className="text-sm text-gray-500">{nextSec.questions.length} questions</p>
                  </div>
                </div>
                <span className="bg-gray-100 border-2 border-gray-200 rounded-lg px-3 py-1 text-xs font-black text-gray-500 uppercase">{nextSec.questions.length} Q</span>
              </div>
            </div>
          )}
          <button onClick={advanceToNextSection} className="w-full bg-gray-900 hover:bg-gray-800 text-white font-black text-lg py-4 rounded-xl border-2 border-gray-900 shadow-[5px_5px_0_#6D28D9]">
            Continue to Section {currentSectionIdx + 2} <ArrowRight className="w-5 h-5 inline ml-1" />
          </button>
        </div>
      </div>
    );
  };

  const renderScoring = () => (
    <div className="flex flex-col items-center justify-center min-h-[70vh] animate-fade-in">
      <div className="relative mb-8">
        <div className="w-24 h-24 rounded-full border-[6px] border-gray-200 border-t-purple-700 animate-spin" />
        <span className="absolute inset-0 flex items-center justify-center text-4xl">🏆</span>
      </div>
      <h2 className="text-3xl font-black text-gray-900 uppercase tracking-wide mb-3">Scoring Your Mock</h2>
      <p className="text-gray-500 font-medium text-lg">Calculating Real Band and updating your competency matrix.</p>
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
          <h2 className="text-3xl font-black text-gray-900 uppercase tracking-tight">Mock Complete</h2>
          <button onClick={() => { localStorage.removeItem(STORAGE_KEY); navigate("/student/dashboard", { state: { drillCompleted: true } }); }}
            className="px-6 py-3 bg-gray-900 text-white rounded-xl font-black text-sm uppercase hover:bg-gray-800 shadow-[4px_4px_0_#6D28D9]">
            Dashboard
          </button>
        </div>

        {/* Real Band Score — the headline result */}
        <div className="bg-purple-700 border-2 border-gray-900 rounded-2xl p-8 mb-6 text-center shadow-[8px_8px_0_#0F0F0F] relative overflow-hidden">
          <div className="absolute -top-8 -right-8 text-[140px] opacity-10 pointer-events-none select-none">🏆</div>
          <p className="text-purple-200 font-black uppercase tracking-widest mb-1">Real Band Score</p>
          <div className="text-8xl font-black text-white leading-none mb-2">{realBand > 0 ? realBand.toFixed(1) : "—"}</div>
          {delta !== 0 && (
            <div className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-lg font-black uppercase text-sm mt-2 ${delta > 0 ? "bg-emerald-500 text-white" : "bg-rose-500 text-white"}`}>
              {delta > 0 ? `↑ +${delta.toFixed(1)}` : `↓ ${delta.toFixed(1)}`} from previous {prevBand.toFixed(1)}
            </div>
          )}
          {crossed && (
            <div className="mt-3 inline-flex items-center gap-2 bg-amber-400 text-gray-900 px-4 py-2 rounded-lg font-black text-sm uppercase shadow-[3px_3px_0_#0F0F0F]">
              🎊 New Band Threshold Crossed!
            </div>
          )}
          <p className="text-purple-300 text-xs font-bold mt-3 uppercase tracking-wide">
            Real Band = Mock × 60% + Previous Matrix × 40%
          </p>
        </div>

        {/* Momentum banner */}
        <div className="bg-indigo-700 border-2 border-gray-900 rounded-2xl p-6 mb-6 text-center shadow-[6px_6px_0_#0F0F0F]">
          <p className="text-indigo-200 font-black uppercase tracking-widest mb-1">Momentum Earned</p>
          <div className="text-6xl font-black text-amber-400">+{momentum}</div>
          {breakdown.length > 0 && (
            <div className="flex flex-wrap justify-center gap-2 mt-4">
              {breakdown.map((b: any, i: number) => (
                <span key={i} className="bg-indigo-600 text-indigo-100 text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full border border-indigo-500">
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
              const matrixDelta = s.prev_matrix_band !== null
                ? Math.round((s.new_matrix_band - s.prev_matrix_band) * 10) / 10
                : null;
              const matrixUp   = matrixDelta !== null && matrixDelta > 0;
              const diagDelta  = s.delta_from_diag;
              const diagUp     = diagDelta !== null && diagDelta > 0;

              const hasSubSkills = (s.sub_skill_scores?.length ?? 0) > 0;

              return (
                <div key={i} className="bg-white border-2 border-gray-900 rounded-xl p-6 shadow-[4px_4px_0_#0F0F0F]">
                  {/* Skill header */}
                  <div className="flex items-center gap-3 mb-4">
                    <span className="text-2xl">{SKILL_ICON[s.skill] ?? "📝"}</span>
                    <div>
                      <p className="font-black text-gray-900 text-sm uppercase tracking-wide">{SKILL_LABEL[s.skill] ?? s.skill}</p>
                      <p className="text-gray-400 text-[10px] font-bold uppercase">{s.ai_graded ? "MCQ + AI Graded" : "Pure MCQ"}</p>
                    </div>
                  </div>

                  {/* Mock score (overall for this skill) */}
                  <p className="text-[9px] font-black uppercase tracking-widest text-gray-400 mb-0.5">Mock Score</p>
                  <p className="text-5xl font-black text-gray-900 leading-none mb-1">{s.band > 0 ? s.band.toFixed(1) : "—"}</p>
                  {s.correct != null && s.total > 0 && (
                    <p className="text-xs text-gray-400 font-bold mb-3">{s.correct} / {s.total} MCQ correct</p>
                  )}

                  {/* Sub-skill breakdown (W/S only) */}
                  {hasSubSkills && (
                    <div className="mb-3">
                      <p className="text-[9px] font-black uppercase tracking-widest text-gray-400 mb-2">Sub-skill Breakdown</p>
                      <div className="grid grid-cols-2 gap-1.5">
                        {s.sub_skill_scores!.map((ss, j) => (
                          <div key={j} className="bg-gray-50 border border-gray-200 rounded-lg px-3 py-2">
                            <p className="text-[9px] font-black uppercase tracking-widest text-gray-400">{SUBSKILL_LABEL[ss.sub_skill] ?? ss.sub_skill}</p>
                            <div className="flex items-baseline gap-1.5 mt-0.5">
                              <span className="text-lg font-black text-gray-900">{ss.band.toFixed(1)}</span>
                              {ss.ai_band !== null && (
                                <span className="text-[9px] text-gray-400 font-medium">AI: {ss.ai_band.toFixed(1)}</span>
                              )}
                            </div>
                            <p className="text-[9px] text-gray-400 font-medium">{ss.correct}/{ss.total_mcq} MCQ</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Real Band impact */}
                  <div className="border-t border-gray-100 pt-3">
                    <p className="text-[9px] font-black uppercase tracking-widest text-gray-400 mb-1.5">Real Band (Updated)</p>
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-sm font-black text-gray-400">{s.prev_matrix_band !== null ? s.prev_matrix_band.toFixed(1) : "—"}</span>
                      <span className="text-gray-300 text-xs">→</span>
                      <span className={`text-xl font-black ${matrixUp ? "text-emerald-600" : "text-gray-700"}`}>{s.new_matrix_band.toFixed(1)}</span>
                      {matrixDelta !== null && (
                        <span className={`text-xs font-black ${matrixUp ? "text-emerald-600" : "text-rose-600"}`}>
                          {matrixUp ? `+${matrixDelta.toFixed(1)}` : matrixDelta.toFixed(1)}
                        </span>
                      )}
                    </div>
                    {s.diagnostic_band !== null && (
                      <div className={`flex items-center gap-2 text-xs font-bold ${diagUp ? "text-emerald-600" : "text-gray-500"}`}>
                        <BookOpen className="w-3 h-3" />
                        <span>Diagnostic: {s.diagnostic_band.toFixed(1)}</span>
                        {diagDelta !== null && (
                          <span className={`font-black ${diagUp ? "text-emerald-600" : "text-rose-600"}`}>
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

        <p className="text-center text-gray-500 font-medium text-sm">
          Your Real Band and competency matrix have been updated. Keep drilling to improve your weakest skills before the next mock.
        </p>
      </div>
    );
  };

  // ═══════════════════════════════════════════════════════════════════════════
  // RENDER
  // ═══════════════════════════════════════════════════════════════════════════

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      <TopNavBar totalMomentum={totalMomentum} />
      <div className="pt-16">
        {phase === "gate"    && renderGate()}
        {phase === "session" && renderSession()}
        {phase === "interim" && renderInterim()}
        {phase === "scoring" && renderScoring()}
        {phase === "results" && renderResults()}
      </div>
    </div>
  );
}
