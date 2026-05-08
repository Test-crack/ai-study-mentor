import React, { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { GraduationCap, ArrowRight, CheckCircle2, AlertCircle, Target, BookOpen, Headphones, PenLine, Mic, BrainCircuit, PlayCircle, Zap, Loader2, Lock, XCircle, CalendarClock } from "lucide-react";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { useMomentum } from "@/features/student/Context/MomentumContext";
import { callBackend } from "@/features/auth/services/authClient";

// ─────────────────────────────────────────────────────────────────────────────
// API INTEGRATION LAYER (Ready for Sarthak's Endpoints)
// ─────────────────────────────────────────────────────────────────────────────

export const awardMomentum = async (
  studentId: string, 
  actionType: string, 
  qualityScore: number
): Promise<{ success: boolean; pointsAwarded: number }> => {
  console.log(`[API CALL] awardMomentum`, { studentId, actionType, qualityScore });
  return new Promise((resolve) => {
    setTimeout(() => resolve({ success: true, pointsAwarded: Math.round(20 + (qualityScore * 30)) }), 1000);
  });
};

// ─────────────────────────────────────────────────────────────────────────────
// TYPES & INTERFACES
// ─────────────────────────────────────────────────────────────────────────────

type Skill = "listening" | "reading" | "writing" | "speaking";
type Phase = "gate" | "session" | "interim" | "scoring" | "results";

interface CriterionScore {
  name: string;
  score: number;
  feedback: string;
}

interface AssessmentResult {
  skill: Skill;
  previousBand: number;
  newBand: number;
  delta: number;
  criteria: CriterionScore[];
  priorityAction: string;
  completedAt: Date;
}

interface IAProgress {
  drills_completed:       number;
  drills_required:        number;
  days_since_first_drill: number;
  min_days_required:      number;
  avg_dcs:                number;
  dcs_required:           number;
  cond_drills:            boolean;
  cond_days:              boolean;
  cond_dcs:               boolean;
}

interface IANextSlot {
  number:         number;
  date:           string;       // YYYY-MM-DD
  date_formatted: string;       // "Wed, 7 May"
  days_away:      number;
}

interface IAStatusResponse {
  has_schedule:          boolean;
  prerequisites_met:     boolean;
  avg_dcs:               number;
  dcs_required:          number;
  dcs_eligible:          boolean;
  is_ia_day:             boolean;
  current_ia_number:     number | null;
  can_start_test:        boolean;
  has_active_session:    boolean;
  suggested_subskills:   { skill: string; sub_skill: string }[] | null;
  next_ia:               IANextSlot | null;
  upcoming_ias:          IANextSlot[];
  reasons:               { key: string; message: string }[];
  progress:              IAProgress;
}

interface IAQuestion {
  id:            string;
  question_type: 'MCQ' | 'TFNG' | 'WRITING_PROMPT' | 'SPEAKING_PROMPT';
  prompt_text:   string;
  options:       Record<string, string> | null;
}

interface IASection {
  skill:        string;
  sub_skill:    string;
  section_type: 'AUDIO' | 'PASSAGE' | 'MCQ_MIX';
  audio_url:    string | null;
  passage_text: string | null;
  passage_id:   string | null;
  questions:    IAQuestion[];
}

interface IASessionResponse {
  success:             boolean;
  session_id:          string;
  ia_number:           number;
  resume:              boolean;
  current_section_idx?: number;
  selected_subskills:  { skill: string; sub_skill: string }[];
  sections:            IASection[];
  saved_answers:       Record<string, string>;
  window_closes_at:    string;
  time_remaining_ms:   number;
  already_done?:       boolean;
  status?:             string;
}

const SKILL_LABEL: Record<string, string> = {
  GRAMMAR: 'Grammar', VOCABULARY: 'Vocabulary', COHERENCE: 'Coherence',
  TASK_RESPONSE: 'Task Response', FLUENCY: 'Fluency', PRONUNCIATION: 'Pronunciation',
  READING: 'Reading', LISTENING: 'Listening',
};
const SKILL_ICON: Record<string, string> = {
  WRITING: '✍️', SPEAKING: '🎤', READING: '📖', LISTENING: '🎧',
};

const SKILL_ORDER: Skill[] = ["listening", "reading", "writing", "speaking"];
const STORAGE_KEY = "tc_full_assessment_state";

// ─────────────────────────────────────────────────────────────────────────────
// UTILS
// ─────────────────────────────────────────────────────────────────────────────

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

const SKILL_LABELS: Record<Skill, string> = { listening: "Listening", reading: "Reading", writing: "Writing", speaking: "Speaking" };
const SKILL_ICONS: Record<Skill, string> = { listening: "🎧", reading: "📖", writing: "✍️", speaking: "🎤" };

// ─────────────────────────────────────────────────────────────────────────────
// COMPONENTS
// ─────────────────────────────────────────────────────────────────────────────

function TopNavBar({ hideMomentum, totalMomentum }: { hideMomentum: boolean, totalMomentum: number }) {
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-white border-b-2 border-gray-900 transform-gpu">
      <div className="w-full px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 bg-indigo-700 border-2 border-gray-900 rounded-lg" style={{ boxShadow: '3px 3px 0 #0F0F0F' }}>
              <GraduationCap className="h-5 w-5 text-white" />
            </div>
            <span className="text-xl font-black text-gray-900 uppercase tracking-tight">TestCrack</span>
          </div>
          
          {!hideMomentum && (
            <div className="flex items-center gap-2 bg-indigo-500/10 border-2 border-gray-900 px-4 py-1.5 rounded-full" style={{ boxShadow: '2px 2px 0 #0F0F0F' }}>
              <Zap className="w-4 h-4 text-amber-400 fill-amber-400" />
              <span className="font-black text-gray-900">{totalMomentum}</span>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}

const CircleTimer: React.FC<{ timeLeft: number; total: number; size?: number }> = ({ timeLeft, total, size = 64 }) => {
  const pct = total > 0 ? timeLeft / total : 1;
  const r = (size - 8) / 2;
  const circ = 2 * Math.PI * r;
  const dash = circ * pct;
  const isUrgent = pct < 0.2;
  const color = isUrgent ? "#EF4444" : pct < 0.5 ? "#F59E0B" : "#4338CA";
  return (
    <svg width={size} height={size} style={{ transform: "rotate(-90deg)", flexShrink: 0 }}>
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#E5E7EB" strokeWidth={6} />
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth={6} strokeDasharray={`${dash} ${circ}`} strokeLinecap="round" style={{ transition: "stroke-dasharray 0.5s linear, stroke 0.3s" }} />
      <text x={size / 2} y={size / 2 + 1} textAnchor="middle" dominantBaseline="middle" fill={isUrgent ? "#EF4444" : "#111827"} fontSize={size / 4.2} fontWeight="900" fontFamily="monospace" style={{ transform: "rotate(90deg)", transformOrigin: `${size / 2}px ${size / 2}px` }}>
        {formatTime(timeLeft)}
      </text>
    </svg>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// MAIN ROUTER
// ─────────────────────────────────────────────────────────────────────────────

export default function Assessment() {
  const navigate = useNavigate();
  const { profile } = useAuth() as any; 
  const { totalMomentum, addPoints, syncMomentum } = useMomentum();
  
  // IA status (schedule + eligibility + DCS)
  const [eligibilityLoading, setEligibilityLoading] = useState(true);
  const [iaStatus, setIaStatus]                     = useState<IAStatusResponse | null>(null);

  // Phase
  const [phase, setPhase] = useState<Phase>("gate");

  // IA session state
  const [iaSessionId, setIaSessionId]         = useState<string | null>(null);
  const [iaSections, setIaSections]           = useState<IASection[] | null>(null);
  const [currentSectionIdx, setCurrentSectionIdx] = useState(0);
  const [isLoadingQuestions, setIsLoadingQuestions] = useState(false);
  const [sessionMomentumAward, setSessionMomentumAward] = useState(0);
  const [iaResults, setIaResults]             = useState<any>(null);

  // Per-question state
  const [currentIdx, setCurrentIdx]           = useState(0);
  const [answers, setAnswers]                 = useState<Record<string, string>>({});
  const [recordedPrompts, setRecordedPrompts] = useState<Record<string, boolean>>({});

  // Audio / passage UI state
  const audioRef = useRef<HTMLAudioElement>(null);
  const [audioState, setAudioState]           = useState<'idle' | 'playing' | 'played'>('idle');
  const [showPassage, setShowPassage]         = useState(false);
  const [isRecording, setIsRecording]         = useState(false);
  const [animBars] = useState(() => Array.from({ length: 12 }, () => Math.random()));

  // Speech recognition (Web Speech API)
  const recognitionRef       = useRef<any>(null);
  const transcriptAccumRef   = useRef<string>('');
  const [liveTranscript, setLiveTranscript] = useState('');

  // Writing debounce — avoids per-keystroke backend calls
  const writingDebounceRef   = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Timer: 20 min per section (2 sections = 40 min total). Resets on section advance.
  const [timeLeft, setTimeLeft]               = useState(20 * 60);

  // Restore flag (kept for localStorage persistence hook)
  const [isRestoring, setIsRestoring]         = useState(false);

  // Convenience: current section and question
  const currentSection  = iaSections?.[currentSectionIdx] ?? null;
  const sessionData     = currentSection; // alias so existing helpers still compile
  const isLoadingSession = isLoadingQuestions;


  // --- IA ELIGIBILITY CHECK ---
  // Only check when the student lands on the gate screen (not mid-session resume).
  useEffect(() => {
    if (isRestoring) return;
    // If a session is already in progress from localStorage, skip eligibility — don't block a resumed test.
    if (phase !== "gate") {
      setEligibilityLoading(false);
      return;
    }
    const check = async () => {
      try {
        const backendUrl = import.meta.env.VITE_BACKEND_URL || "http://localhost:4000";
        const res = await callBackend(`${backendUrl}/api/ia/status`);
        if (res.success) setIaStatus(res as IAStatusResponse);
      } catch (err) {
        console.error("[IA Status] fetch failed:", err);
      } finally {
        setEligibilityLoading(false);
      }
    };
    void check();
  }, [isRestoring, phase]);



  /** Save one answer to backend — fire-and-forget, never blocks UI. */
  const persistAnswer = (questionId: string, answer: string) => {
    if (!iaSessionId) return;
    const backendUrl = import.meta.env.VITE_BACKEND_URL || "http://localhost:4000";
    callBackend(`${backendUrl}/api/ia/answer`, {
      method: 'POST',
      body: JSON.stringify({ session_id: iaSessionId, question_id: questionId, answer })
    }).catch(e => console.warn('[IA] answer save failed:', e));
  };

  /** Debounced writing save — waits 1.5s after the student stops typing. */
  const persistWritingDebounced = (questionId: string, text: string) => {
    if (writingDebounceRef.current) clearTimeout(writingDebounceRef.current);
    writingDebounceRef.current = setTimeout(() => persistAnswer(questionId, text), 1500);
  };

  /** Start recording with the Web Speech API (Chrome/Edge). Falls back gracefully. */
  const startSpeakingRecording = (questionId: string) => {
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    // Seed accumulator from any previously saved transcript
    transcriptAccumRef.current = (answers[questionId] || '').trim();
    setLiveTranscript(transcriptAccumRef.current);
    setIsRecording(true);
    if (!SR) return; // UI shows recording; student cannot get transcript on unsupported browser

    const rec = new SR();
    rec.continuous      = true;
    rec.interimResults  = true;
    rec.lang            = 'en-US';

    rec.onresult = (event: any) => {
      for (let i = event.resultIndex; i < event.results.length; i++) {
        if (event.results[i].isFinal) {
          transcriptAccumRef.current = (
            transcriptAccumRef.current ? transcriptAccumRef.current + ' ' : ''
          ) + event.results[i][0].transcript.trim();
        }
      }
      const last    = event.results[event.results.length - 1];
      const interim = last.isFinal ? '' : last[0].transcript;
      setLiveTranscript((transcriptAccumRef.current + (interim ? ' ' + interim : '')).trim());
    };

    rec.onerror = (e: any) => {
      if (e.error !== 'aborted' && e.error !== 'no-speech') console.warn('[Speech]', e.error);
    };

    recognitionRef.current = rec;
    try { rec.start(); } catch { /* already started */ }
  };

  /** Stop recording, persist the final transcript, update UI state. */
  const stopSpeakingRecording = (questionId: string) => {
    if (recognitionRef.current) {
      try { recognitionRef.current.stop(); } catch { /**/ }
      recognitionRef.current = null;
    }
    const finalTranscript = transcriptAccumRef.current.trim();
    setIsRecording(false);
    setLiveTranscript('');
    if (finalTranscript) {
      setAnswers(p => ({ ...p, [questionId]: finalTranscript }));
      persistAnswer(questionId, finalTranscript);
    }
    setRecordedPrompts(p => ({ ...p, [questionId]: !!finalTranscript }));
  };

  const beginFullTest = async () => {
    localStorage.removeItem(STORAGE_KEY);
    setIsLoadingQuestions(true);
    try {
      const backendUrl = import.meta.env.VITE_BACKEND_URL || "http://localhost:4000";
      const res: IASessionResponse = await callBackend(`${backendUrl}/api/ia/questions`);

      if (!res.success) {
        console.error('[IA] failed to load questions:', res);
        setIsLoadingQuestions(false);
        return;
      }
      if (res.already_done) {
        // session already completed/missed — re-check status
        const statusRes = await callBackend(`${backendUrl}/api/ia/status`);
        if (statusRes.success) setIaStatus(statusRes as IAStatusResponse);
        setIsLoadingQuestions(false);
        return;
      }

      const resumeSection = res.current_section_idx ?? 0;
      setIaSessionId(res.session_id);
      setIaSections(res.sections);
      setCurrentSectionIdx(resumeSection);
      setCurrentIdx(0);
      setAnswers(res.saved_answers ?? {});
      setAudioState('idle');
      setShowPassage(false);
      setIsRecording(false);
      setTimeLeft(Math.floor((res.time_remaining_ms ?? 20 * 60 * 1000) / 1000));
      setPhase("session");
    } catch (err) {
      console.error('[IA] beginFullTest error:', err);
    } finally {
      setIsLoadingQuestions(false);
    }
  };

  const handleSectionComplete = useCallback(async () => {
    if (!iaSections) return;
    if (currentSectionIdx < iaSections.length - 1) {
      // Advance to next section — show brief interim
      setPhase("interim");
    } else {
      // Last section complete — submit
      setPhase("scoring");
      try {
        const backendUrl = import.meta.env.VITE_BACKEND_URL || "http://localhost:4000";
        const res = await callBackend(`${backendUrl}/api/ia/submit`, {
          method: 'POST',
          body: JSON.stringify({ session_id: iaSessionId })
        });
        if (res.success) {
          setSessionMomentumAward(res.momentum_awarded ?? 0);
          if (res.updated_momentum !== undefined) syncMomentum(res.updated_momentum);
          setIaResults(res);
        }
      } catch (err) {
        console.error('[IA] submit error:', err);
      }
      setTimeout(() => setPhase("results"), 3500);
    }
  }, [iaSections, currentSectionIdx, iaSessionId]);

  const advanceToNextSection = () => {
    const nextIdx = currentSectionIdx + 1;
    // Stamp section start on backend so the per-section timer survives a mid-section exit
    if (iaSessionId) {
      const backendUrl = import.meta.env.VITE_BACKEND_URL || "http://localhost:4000";
      callBackend(`${backendUrl}/api/ia/answer`, {
        method: 'POST',
        body: JSON.stringify({ session_id: iaSessionId, section_advance: nextIdx })
      }).catch(e => console.warn('[IA] section advance stamp failed:', e));
    }
    setCurrentSectionIdx(nextIdx);
    setCurrentIdx(0);
    setAnswers({});
    setTimeLeft(20 * 60);   // reset to full 20 min for new section
    setAudioState('idle');
    setShowPassage(false);
    setIsRecording(false);
    setPhase("session");
  };

  const handleNextQuestion = useCallback(() => {
    if (!currentSection) return;
    const totalQ = currentSection.questions.length;
    const currentQ = currentSection.questions[currentIdx];

    // Persist current answer before advancing
    const currentAnswer = answers[currentQ?.id ?? ''];
    if (currentQ && currentAnswer) persistAnswer(currentQ.id, currentAnswer);

    if (currentIdx < totalQ - 1) {
      setCurrentIdx(i => i + 1);
      setIsRecording(false);
    } else {
      void handleSectionComplete();
    }
  }, [currentIdx, currentSection, answers, handleSectionComplete]);

  // Global Timer Tick
  useEffect(() => {
    if (phase !== "session" || isLoadingSession || isRestoring || timeLeft <= 0) return;
    const t = setInterval(() => setTimeLeft(s => s - 1), 1000);
    return () => clearInterval(t);
  }, [phase, timeLeft, isLoadingSession, isRestoring]);

  // Section timer expired: force-complete current section (advances to next or submits if last)
  useEffect(() => {
    if (phase === "session" && timeLeft === 0 && !isLoadingQuestions) {
      setIsRecording(false);
      void handleSectionComplete();
    }
  }, [timeLeft, phase, isLoadingQuestions, handleSectionComplete]);

  // Stop any active recording and flush writing debounce when the question or section changes
  useEffect(() => {
    if (recognitionRef.current) {
      try { recognitionRef.current.stop(); } catch { /**/ }
      recognitionRef.current = null;
    }
    setIsRecording(false);
    setLiveTranscript('');
    if (writingDebounceRef.current) clearTimeout(writingDebounceRef.current);
  }, [currentIdx, currentSectionIdx]);

  // ── RENDERERS ──

  if (isRestoring || eligibilityLoading) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center">
        <Loader2 className="w-10 h-10 text-indigo-700 animate-spin" />
      </div>
    );
  }

  // ── STATE 1: Prerequisites not yet met (< 6 drills or < 2 days) ─────────────
  const renderNotEligible = () => {
    const p = iaStatus!.progress;
    const conditions = [
      { key: "drills", label: "Drill Sessions",        met: p.cond_drills, value: `${p.drills_completed} / ${p.drills_required}`,       pct: Math.min(100, Math.round((p.drills_completed / p.drills_required) * 100)) },
      { key: "days",   label: "Days Since First Drill", met: p.cond_days,   value: `${p.days_since_first_drill} / ${p.min_days_required}`, pct: Math.min(100, Math.round((p.days_since_first_drill / p.min_days_required) * 100)) },
      { key: "dcs",    label: "Avg Drill Accuracy",    met: p.cond_dcs,    value: `${p.avg_dcs}% / ${p.dcs_required}%`,                  pct: Math.min(100, Math.round((p.avg_dcs / p.dcs_required) * 100)) }
    ];
    return (
      <div className="max-w-2xl mx-auto animate-fade-in pt-12 px-4">
        <div className="bg-white border-2 border-gray-900 rounded-2xl p-8 sm:p-10 shadow-[8px_8px_0_#0F0F0F]">
          <div className="flex flex-col items-center text-center mb-8">
            <div className="w-16 h-16 rounded-2xl bg-rose-100 border-2 border-gray-900 flex items-center justify-center mb-4 shadow-[4px_4px_0_#0F0F0F]">
              <Lock className="w-8 h-8 text-rose-600" />
            </div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded border-2 border-gray-900 bg-rose-600 text-white text-xs font-black tracking-widest uppercase mb-3 shadow-[2px_2px_0_#0F0F0F]">
              <XCircle className="w-3.5 h-3.5" /> Not Eligible Yet
            </div>
            <h1 className="text-3xl font-black text-gray-900 tracking-tight uppercase">Internal Assessment Locked</h1>
            <p className="text-gray-500 font-medium mt-2 max-w-md">Complete all three requirements below to unlock your Internal Assessment window.</p>
          </div>
          <div className="space-y-4 mb-8">
            {conditions.map(c => (
              <div key={c.key} className={`border-2 rounded-xl p-4 shadow-[3px_3px_0_#0F0F0F] ${c.met ? "border-emerald-400 bg-emerald-50" : "border-gray-300 bg-gray-50"}`}>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    {c.met ? <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" /> : <div className="w-5 h-5 rounded-full border-2 border-gray-400 flex-shrink-0" />}
                    <span className="font-black text-sm text-gray-800 uppercase tracking-wide">{c.label}</span>
                  </div>
                  <span className={`font-black text-sm tabular-nums ${c.met ? "text-emerald-700" : "text-gray-500"}`}>{c.value}</span>
                </div>
                <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div className={`h-full rounded-full transition-all duration-500 ${c.met ? "bg-emerald-500" : "bg-indigo-500"}`} style={{ width: `${c.pct}%` }} />
                </div>
              </div>
            ))}
          </div>
          {iaStatus!.reasons.length > 0 && (
            <div className="bg-amber-50 border-2 border-amber-300 rounded-xl p-4 mb-8 shadow-[3px_3px_0_#F59E0B]">
              <p className="text-xs font-black text-amber-700 uppercase tracking-widest mb-2">What to do next</p>
              <ul className="space-y-1.5">
                {iaStatus!.reasons.map(r => (
                  <li key={r.key} className="flex items-start gap-2 text-sm text-amber-900 font-medium"><span className="mt-0.5 flex-shrink-0">•</span>{r.message}</li>
                ))}
              </ul>
            </div>
          )}
          <button onClick={() => navigate('/student/dashboard')} className="w-full bg-gray-900 hover:bg-gray-800 text-white font-black text-sm uppercase tracking-wide py-4 rounded-xl border-2 border-gray-900 transition-all shadow-[4px_4px_0_#4338CA]">
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  };

  // ── STATE 2: Prerequisites met but today is NOT an IA day ─────────────────
  const renderScheduled = () => {
    const next     = iaStatus!.next_ia;
    const avg_dcs  = iaStatus!.avg_dcs;
    const eligible = iaStatus!.dcs_eligible;
    return (
      <div className="max-w-2xl mx-auto animate-fade-in pt-12 px-4">
        <div className="bg-white border-2 border-gray-900 rounded-2xl p-8 sm:p-10 shadow-[8px_8px_0_#0F0F0F]">
          {/* Header */}
          <div className="flex flex-col items-center text-center mb-8">
            <div className="w-16 h-16 rounded-2xl bg-indigo-100 border-2 border-gray-900 flex items-center justify-center mb-4 shadow-[4px_4px_0_#0F0F0F]">
              <CalendarClock className="w-8 h-8 text-indigo-700" />
            </div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded border-2 border-gray-900 bg-indigo-700 text-white text-xs font-black tracking-widest uppercase mb-3 shadow-[2px_2px_0_#0F0F0F]">
              <Zap className="w-3.5 h-3.5 fill-amber-400 text-amber-400" /> Internal Assessment
            </div>
            <h1 className="text-3xl font-black text-gray-900 tracking-tight uppercase mb-2">Next Assessment Scheduled</h1>
            {next ? (
              <p className="text-gray-500 font-medium">
                Your next Internal Assessment opens on{" "}
                <span className="font-black text-indigo-700">{next.date_formatted}</span>
                {next.days_away === 1 ? " — tomorrow!" : next.days_away === 0 ? " — today!" : ` — in ${next.days_away} days`}
              </p>
            ) : (
              <p className="text-gray-500 font-medium">No upcoming assessment slot found.</p>
            )}
          </div>

          {/* DCS status block */}
          <div className={`border-2 rounded-xl p-5 mb-6 shadow-[3px_3px_0_#0F0F0F] ${eligible ? "border-emerald-400 bg-emerald-50" : "border-rose-300 bg-rose-50"}`}>
            <div className="flex items-center justify-between mb-3">
              <span className="font-black text-sm uppercase tracking-wide text-gray-800">Your Avg DCS Score</span>
              <span className={`text-2xl font-black tabular-nums ${eligible ? "text-emerald-700" : "text-rose-600"}`}>{avg_dcs}%</span>
            </div>
            <div className="w-full h-3 bg-gray-200 rounded-full overflow-hidden mb-3">
              <div
                className={`h-full rounded-full transition-all duration-700 ${eligible ? "bg-emerald-500" : "bg-rose-500"}`}
                style={{ width: `${Math.min(100, avg_dcs)}%` }}
              />
            </div>
            <p className={`text-sm font-semibold ${eligible ? "text-emerald-700" : "text-rose-700"}`}>
              {eligible
                ? "✓ Maintain your DCS score to stay eligible for your next IA."
                : "✗ Improve your DCS score to be eligible — need 40% or above."}
            </p>
          </div>

          {/* Next date callout */}
          {next && (
            <div className="bg-gray-50 border-2 border-gray-200 rounded-xl p-4 mb-6 flex items-center gap-4">
              <div className="bg-indigo-700 border-2 border-gray-900 rounded-xl w-14 h-14 flex flex-col items-center justify-center flex-shrink-0 shadow-[3px_3px_0_#0F0F0F]">
                <span className="text-white font-black text-xl leading-none">{next.date.split('-')[2]}</span>
                <span className="text-indigo-200 text-[9px] font-black uppercase tracking-widest">{next.date_formatted.split(' ').slice(-1)[0]}</span>
              </div>
              <div>
                <p className="font-black text-gray-900 text-sm uppercase tracking-wide">IA #{next.number} Window Opens</p>
                <p className="text-gray-500 text-xs font-medium mt-0.5">{next.date_formatted} · {next.days_away === 1 ? "1 day away" : `${next.days_away} days away`}</p>
              </div>
            </div>
          )}

          <button onClick={() => navigate('/student/dashboard')} className="w-full bg-gray-900 hover:bg-gray-800 text-white font-black text-sm uppercase tracking-wide py-4 rounded-xl border-2 border-gray-900 transition-all shadow-[4px_4px_0_#4338CA]">
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  };

  // ── STATE 3: It IS an IA day but DCS < 40% ────────────────────────────────
  const renderIaDayLowDCS = () => {
    const avg_dcs = iaStatus!.avg_dcs;
    const num     = iaStatus!.current_ia_number;
    return (
      <div className="max-w-2xl mx-auto animate-fade-in pt-12 px-4">
        <div className="bg-white border-2 border-gray-900 rounded-2xl p-8 sm:p-10 text-center shadow-[8px_8px_0_#0F0F0F]">
          <div className="w-16 h-16 rounded-2xl bg-rose-100 border-2 border-gray-900 flex items-center justify-center mx-auto mb-4 shadow-[4px_4px_0_#0F0F0F]">
            <AlertCircle className="w-8 h-8 text-rose-600" />
          </div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded border-2 border-gray-900 bg-rose-600 text-white text-xs font-black tracking-widest uppercase mb-4 shadow-[2px_2px_0_#0F0F0F]">
            IA #{num} Window · Today
          </div>
          <h1 className="text-3xl font-black text-gray-900 uppercase tracking-tight mb-3">Improve Your DCS to Take This IA</h1>
          <p className="text-gray-500 font-medium mb-8 max-w-md mx-auto">
            Today is your Internal Assessment window but your average accuracy is below the required threshold. Complete more drills today to bring it up.
          </p>
          {/* DCS meter */}
          <div className="bg-rose-50 border-2 border-rose-300 rounded-xl p-5 mb-8 text-left shadow-[3px_3px_0_#F87171]">
            <div className="flex items-center justify-between mb-2">
              <span className="font-black text-sm uppercase tracking-wide text-gray-800">Current Avg DCS</span>
              <span className="text-2xl font-black text-rose-600 tabular-nums">{avg_dcs}%</span>
            </div>
            <div className="w-full h-3 bg-rose-100 rounded-full overflow-hidden mb-2">
              <div className="h-full rounded-full bg-rose-500 transition-all duration-700" style={{ width: `${Math.min(100, avg_dcs)}%` }} />
            </div>
            <p className="text-xs font-bold text-rose-700">Need 40% — you're {40 - avg_dcs}% short. Complete drills to improve your score.</p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3">
            <button onClick={() => navigate('/student/dashboard')} className="flex-1 px-6 py-4 rounded-xl border-2 border-gray-300 font-black text-gray-500 hover:bg-gray-50 uppercase tracking-wide transition-colors">
              Dashboard
            </button>
            <button onClick={() => navigate('/student/drill')} className="flex-1 bg-indigo-700 hover:bg-indigo-600 text-white font-black text-sm uppercase tracking-wide py-4 rounded-xl border-2 border-gray-900 transition-all shadow-[4px_4px_0_#0F0F0F]">
              Do a Drill Now →
            </button>
          </div>
        </div>
      </div>
    );
  };

  // ── STATE 4: IA day + all conditions met → Start Test ─────────────────────
  const renderGate = () => (
    <div className="max-w-2xl mx-auto animate-fade-in pt-12 px-4">
      <div className="bg-white border-2 border-gray-900 rounded-2xl p-8 sm:p-12 text-center shadow-[8px_8px_0_#0F0F0F]">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded border-2 border-gray-900 bg-indigo-700 text-white text-xs font-black tracking-widest uppercase mb-8 shadow-[3px_3px_0_#0F0F0F]">
          <Zap className="w-4 h-4 fill-amber-400 text-amber-400" /> Internal Assessment #{iaStatus?.current_ia_number ?? ""}
        </div>
        {/* DCS badge */}
        {iaStatus && (
          <div className="flex justify-end -mt-4 mb-2">
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border border-gray-200 bg-gray-50 text-xs font-black text-gray-500 uppercase tracking-wide">
              Avg DCS <span className="text-indigo-600">{iaStatus.avg_dcs}%</span>
            </span>
          </div>
        )}
        {/* Target sub-skills preview */}
        {iaStatus?.suggested_subskills && iaStatus.suggested_subskills.length === 2 && (
          <div className="mb-8 bg-indigo-50 border-2 border-gray-200 rounded-xl p-4 text-left shadow-[3px_3px_0_#E5E7EB]">
            <p className="text-[10px] font-black text-indigo-700 uppercase tracking-widest mb-3">Today's Focus Areas</p>
            <div className="grid grid-cols-2 gap-3">
              {iaStatus.suggested_subskills.map((s, i) => (
                <div key={i} className="flex items-center gap-2 bg-white border-2 border-gray-900 rounded-xl px-3 py-2.5 shadow-[2px_2px_0_#0F0F0F]">
                  <span className="text-xl">{SKILL_ICON[s.skill] ?? '📝'}</span>
                  <div>
                    <p className="font-black text-gray-900 text-xs uppercase tracking-wide">{SKILL_LABEL[s.sub_skill] ?? s.sub_skill}</p>
                    <p className="text-gray-400 text-[10px] font-bold">{s.skill}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
        
        <h1 className="text-4xl sm:text-5xl font-black text-gray-900 tracking-tight uppercase mb-6">
          Ready to test your <span className="text-indigo-700">Limits?</span>
        </h1>
        
        <p className="text-gray-600 leading-relaxed font-medium mb-10 max-w-lg mx-auto">
          This is a continuous, full-length IELTS simulation. You will complete all four sections back-to-back. Each section contains 10 sub-skill targeted questions with a strict 20-minute timer.
        </p>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-10">
          {SKILL_ORDER.map((s, i) => (
            <div key={s} className="bg-gray-50 border-2 border-gray-200 rounded-xl p-4 flex flex-col items-center justify-center gap-2">
              <span className="text-3xl">{SKILL_ICONS[s]}</span>
              <span className="text-[10px] font-black uppercase tracking-widest text-gray-500">Part {i + 1}</span>
            </div>
          ))}
        </div>

        <div className="flex flex-col sm:flex-row gap-4">
          <button onClick={() => navigate(-1)} className="px-6 py-4 rounded-xl border-2 border-gray-300 font-black text-gray-500 hover:bg-gray-50 hover:border-gray-400 transition-colors uppercase tracking-wide">
            Cancel
          </button>
          <button
            onClick={() => void beginFullTest()}
            disabled={isLoadingQuestions}
            className="flex-1 bg-indigo-700 hover:bg-indigo-600 disabled:opacity-60 text-white font-black text-base uppercase tracking-wide rounded-xl border-2 border-gray-900 transition-all neo-btn shadow-[4px_4px_0_#0F0F0F] flex items-center justify-center gap-2"
          >
            {isLoadingQuestions
            ? <><Loader2 className="w-4 h-4 animate-spin" /> Loading…</>
            : iaStatus?.has_active_session ? 'Continue Assessment →' : 'Start Assessment →'
          }
          </button>
        </div>
      </div>
    </div>
  );

  const renderInterim = () => {
    const doneSec  = iaSections?.[currentSectionIdx];
    const nextSec  = iaSections?.[currentSectionIdx + 1];
    return (
      <div className="min-h-[70vh] flex items-center justify-center animate-fade-in px-4 pt-12">
        <div className="max-w-lg w-full bg-white border-2 border-gray-900 rounded-2xl p-10 text-center shadow-[8px_8px_0_#0F0F0F]">
          <div className="w-20 h-20 bg-emerald-100 border-2 border-emerald-500 rounded-full flex items-center justify-center text-4xl mx-auto mb-6 shadow-[4px_4px_0_#10B981]">
            <CheckCircle2 className="w-10 h-10 text-emerald-600" />
          </div>
          <h2 className="text-3xl font-black text-gray-900 uppercase tracking-tight mb-2">
            Section {currentSectionIdx + 1} Complete
          </h2>
          <p className="text-gray-500 font-medium mb-10">
            Great work on {SKILL_LABEL[doneSec?.sub_skill ?? ''] ?? doneSec?.sub_skill}. Take a breath — the next section has its own 20-minute timer.
          </p>
          {nextSec && (
            <div className="bg-indigo-50 border-2 border-gray-900 rounded-xl p-6 mb-8 text-left shadow-[4px_4px_0_#0F0F0F]">
              <p className="text-xs font-black text-indigo-700 uppercase tracking-widest mb-1">Up Next</p>
              <div className="flex items-center gap-3">
                <span className="text-3xl">{SKILL_ICON[nextSec.skill] ?? '📝'}</span>
                <div>
                  <h3 className="text-xl font-black text-gray-900 uppercase tracking-wide">{SKILL_LABEL[nextSec.sub_skill] ?? nextSec.sub_skill}</h3>
                  <p className="text-sm text-gray-500">{nextSec.questions.length} questions</p>
                </div>
              </div>
            </div>
          )}
          <button onClick={advanceToNextSection} className="w-full bg-gray-900 hover:bg-gray-800 text-white font-black text-lg py-4 rounded-xl border-2 border-gray-900 transition-all neo-btn shadow-[5px_5px_0_#4338CA]">
            Continue to Section {currentSectionIdx + 2} <ArrowRight className="w-5 h-5 inline ml-1" />
          </button>
        </div>
      </div>
    );
  };

  const renderScoring = () => (
    <div className="flex flex-col items-center justify-center min-h-[70vh] animate-fade-in">
      <div className="relative mb-8">
        <div className="w-24 h-24 rounded-full border-[6px] border-gray-200 border-t-indigo-700 animate-spin" />
        <span className="absolute inset-0 flex items-center justify-center text-4xl">🧠</span>
      </div>
      <h2 className="text-3xl font-black text-gray-900 uppercase tracking-wide mb-3">Scoring Your Assessment</h2>
      <p className="text-gray-500 font-medium text-lg">Calculating your band scores and updating your competency matrix.</p>
    </div>
  );

  const renderResults = () => {
    // IA results from backend — if no backend results, show completion screen
    const momentumEarned = sessionMomentumAward || iaResults?.momentum_awarded || 0;
    const sectionScores: Array<{ sub_skill: string; skill: string; band: number; correct?: number; total?: number }> =
      (iaResults?.section_scores ?? iaSections?.map(s => ({ sub_skill: s.sub_skill, skill: s.skill, band: 0 })) ?? []);

    return (
      <div className="max-w-3xl mx-auto animate-fade-in pt-8 pb-24 px-4">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-3xl font-black text-gray-900 uppercase tracking-tight">IA Complete</h2>
          <button onClick={() => { localStorage.removeItem(STORAGE_KEY); navigate('/student/dashboard', { state: { drillCompleted: true } }); }}
            className="px-6 py-3 bg-gray-900 text-white rounded-xl font-black text-sm uppercase tracking-wide hover:bg-gray-800 shadow-[4px_4px_0_#4338CA]">
            Dashboard
          </button>
        </div>

        {/* Momentum award */}
        <div className="bg-indigo-700 border-2 border-gray-900 rounded-2xl p-8 mb-6 text-center shadow-[8px_8px_0_#0F0F0F]">
          <p className="text-indigo-200 font-black uppercase tracking-widest mb-2">Momentum Earned</p>
          <div className="text-7xl font-black text-amber-400">+{momentumEarned}</div>
          <div className="mt-4 inline-flex items-center gap-2 bg-white text-indigo-900 px-5 py-2 rounded-lg font-black uppercase shadow-[3px_3px_0_#0F0F0F]">
            <CheckCircle2 className="w-5 h-5 text-emerald-500" /> Internal Assessment Submitted
          </div>
        </div>

        {/* Section scores */}
        {sectionScores.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 mb-6">
            {sectionScores.map((s, i) => (
              <div key={i} className="bg-white border-2 border-gray-900 rounded-xl p-6 shadow-[4px_4px_0_#0F0F0F] text-center">
                <span className="text-3xl">{SKILL_ICON[s.skill] ?? '📝'}</span>
                <p className="text-gray-500 font-black uppercase tracking-widest text-xs mt-3 mb-1">{SKILL_LABEL[s.sub_skill] ?? s.sub_skill}</p>
                <p className="text-4xl font-black text-gray-900">{s.band > 0 ? s.band.toFixed(1) : '—'}</p>
                {s.correct != null && <p className="text-xs text-gray-400 font-bold mt-1">{s.correct} / {s.total} correct</p>}
              </div>
            ))}
          </div>
        )}

        <p className="text-center text-gray-500 font-medium">Your scores are now reflected in your competency matrix. Continue your drills to prepare for the next IA.</p>
      </div>
    );

    // legacy shape fallback — unreachable but keeps compiler happy
    const overallBand = 0;
    const weakestResult = null;

    return (
      <div className="max-w-5xl mx-auto animate-fade-in pt-8 pb-24 px-4">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-3xl sm:text-4xl font-black text-gray-900 uppercase tracking-tight">Final Results</h2>
          <button 
            onClick={() => {
              localStorage.removeItem(STORAGE_KEY);
              navigate('/student/dashboard');
            }} 
            className="px-6 py-3 bg-gray-900 text-white rounded-xl font-black text-sm uppercase tracking-wide hover:bg-gray-800 transition-colors shadow-[4px_4px_0_#4338CA]"
          >
            Dashboard
          </button>
        </div>

        {/* OVERALL SCORE BANNER */}
        <div className="bg-indigo-700 border-2 border-gray-900 rounded-2xl p-8 sm:p-12 mb-8 text-center relative overflow-hidden shadow-[8px_8px_0_#0F0F0F]">
          <div className="absolute -top-10 -right-10 text-[200px] opacity-10 pointer-events-none">🎯</div>
          <p className="text-indigo-200 font-black uppercase tracking-widest mb-4">Overall Real Band Score</p>
          <div className="text-8xl sm:text-[120px] font-black text-white tabular-nums leading-none drop-shadow-md">
            {overallBand.toFixed(1)}
          </div>
          <div className="mt-8 inline-flex items-center gap-2 bg-white text-indigo-900 px-6 py-2 rounded-lg font-black uppercase tracking-wide shadow-[4px_4px_0_#0F0F0F]">
            <CheckCircle2 className="w-5 h-5 text-emerald-500" /> Full Assessment Complete
          </div>
        </div>

        {/* 4 SKILL GRID with DELTAS */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {SKILL_ORDER.map(s => {
            const r = allResults[s]!;
            const isUp = r.delta > 0;
            const isSame = r.delta === 0;
            
            return (
              <div key={s} className="bg-white border-2 border-gray-900 rounded-xl p-6 shadow-[4px_4px_0_#0F0F0F] flex flex-col items-center text-center">
                <span className="text-4xl mb-4">{SKILL_ICONS[s]}</span>
                
                <p className="text-gray-500 font-black uppercase tracking-widest text-xs mb-1">{SKILL_LABELS[s]}</p>
                <div className="flex items-center justify-center gap-3 w-full mb-4">
                   <span className="text-xl font-black text-gray-400 line-through decoration-2 decoration-gray-400">{r.previousBand.toFixed(1)}</span>
                   <ArrowRight className="w-5 h-5 text-gray-300" />
                   <span className={`text-4xl font-black ${isUp ? 'text-emerald-600' : isSame ? 'text-gray-900' : 'text-rose-600'}`}>{r.newBand.toFixed(1)}</span>
                </div>
                
                <div className={`text-[10px] font-black uppercase tracking-wide px-2.5 py-1 rounded border-2 ${isUp ? 'bg-emerald-100 text-emerald-700 border-emerald-300' : isSame ? 'bg-gray-100 text-gray-600 border-gray-300' : 'bg-rose-100 text-rose-700 border-rose-300'}`}>
                  {isUp ? `+${r.delta.toFixed(1)} Improved` : isSame ? 'Maintained' : `${Math.abs(r.delta).toFixed(1)} Dropped`}
                </div>
              </div>
            )
          })}
        </div>

        {/* DETAILED CRITERION SCORES (Reading Example) */}
        <div className="bg-white border-2 border-gray-900 rounded-xl p-8 mb-8 shadow-[6px_6px_0_#0F0F0F]">
           <h3 className="text-xl font-black text-gray-900 uppercase tracking-wide mb-6 flex items-center gap-2">
             <BrainCircuit className="w-6 h-6 text-indigo-700" /> Full Criterion Breakdown
           </h3>
           <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {allResults['reading']!.criteria.map((crit, i) => (
                <div key={i} className="bg-gray-50 border-2 border-gray-200 p-5 rounded-lg">
                  <div className="flex justify-between items-center mb-3 border-b-2 border-gray-200 pb-2">
                    <span className="font-black text-sm text-gray-900 uppercase tracking-wide">{crit.name}</span>
                    <span className="font-black text-xl text-indigo-700">{crit.score.toFixed(1)}</span>
                  </div>
                  <p className="text-sm text-gray-600 font-medium leading-relaxed">{crit.feedback}</p>
                </div>
              ))}
            </div>
        </div>

        {/* PRIORITY ACTION */}
        <div className="bg-red-50 border-2 border-gray-900 rounded-2xl p-8 shadow-[6px_6px_0_#0F0F0F] mb-8">
          <div className="flex flex-col sm:flex-row gap-6 items-start">
            <div className="bg-red-500 border-2 border-gray-900 rounded-xl p-4 shrink-0 shadow-[4px_4px_0_#0F0F0F]">
              <AlertCircle className="w-10 h-10 text-white" />
            </div>
            <div>
              <h4 className="font-black text-gray-900 text-xl mb-2 uppercase tracking-wide">Priority Action Plan</h4>
              <p className="text-gray-700 font-medium leading-relaxed mb-6">
                Your weakest overall area in this mock test was <strong className="text-gray-900 uppercase">{SKILL_LABELS[weakestResult!.skill]}</strong>. {weakestResult!.priorityAction}
              </p>
              <button 
                onClick={() => {
                  localStorage.removeItem(STORAGE_KEY);
                  navigate('/student/dashboard');
                }} 
                className="bg-white text-gray-900 font-black text-sm uppercase tracking-wide px-8 py-4 rounded-xl border-2 border-gray-900 hover:bg-gray-50 transition-colors neo-btn shadow-[4px_4px_0_#0F0F0F]"
              >
                Update My Dashboard Rhythm →
              </button>
            </div>
          </div>
        </div>

        {/* MOMENTUM POINTS AWARD (Separate at Bottom) */}
        <div className="flex items-center justify-center gap-4 bg-indigo-50 border-2 border-indigo-700 rounded-2xl p-6 shadow-[4px_4px_0_#4338CA]">
           <div className="bg-amber-400 p-2 rounded-full border-2 border-gray-900"><Zap className="w-6 h-6 text-gray-900 fill-gray-900" /></div>
           <p className="text-lg font-black text-indigo-900 uppercase tracking-wide">
             Session Complete! You earned <strong className="text-indigo-700 text-2xl mx-1">+{sessionMomentumAward}</strong> Momentum Points.
           </p>
        </div>

      </div>
    );
  };

  const renderSession = () => {
    if (isLoadingQuestions || !currentSection) {
      return (
        <div className="min-h-[70vh] flex flex-col items-center justify-center animate-fade-in">
          <Loader2 className="w-12 h-12 text-indigo-700 animate-spin mb-4" />
          <p className="text-gray-500 font-black uppercase tracking-widest text-sm">Loading Questions…</p>
        </div>
      );
    }

    const currentQ: IAQuestion = currentSection.questions[currentIdx];
    const totalQ = currentSection.questions.length;
    if (!currentQ) return null;

    // Options normalisation: API returns { A: "...", B: "...", ... } or array
    const optionsMap: Record<string, string> = (currentQ.options && !Array.isArray(currentQ.options))
      ? currentQ.options as Record<string, string>
      : {};
    const optionKeys = Object.keys(optionsMap).filter(k => optionsMap[k] != null);

    // Can-proceed check per question type
    let canProceed = false;
    if (currentQ.question_type === 'SPEAKING_PROMPT') {
      // Requires a saved transcript (from this session or a prior resume)
      canProceed = !!(answers[currentQ.id]?.trim());
    } else if (currentQ.question_type === 'WRITING_PROMPT') {
      canProceed = (answers[currentQ.id]?.trim().split(/\s+/).filter(Boolean).length ?? 0) >= 10;
    } else {
      // MCQ or TFNG
      canProceed = !!answers[currentQ.id];
    }

    return (
      <div className="max-w-6xl mx-auto pt-6 pb-16 px-4 animate-fade-in">

        {/* Section progress pills */}
        <div className="flex items-center justify-center gap-3 mb-8">
          {iaSections?.map((sec, i) => (
            <div key={i} className="flex items-center gap-3">
              <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border-2 font-black text-xs uppercase tracking-widest ${
                i < currentSectionIdx ? 'bg-emerald-400 border-gray-900 text-gray-900' :
                i === currentSectionIdx ? 'bg-gray-900 border-gray-900 text-white' :
                'bg-white border-gray-300 text-gray-400'
              }`} style={i <= currentSectionIdx ? { boxShadow: '2px 2px 0 #0F0F0F' } : {}}>
                {i < currentSectionIdx ? <CheckCircle2 className="w-4 h-4" /> : <span>{SKILL_ICON[sec.skill] ?? '📝'}</span>}
                <span className="hidden sm:inline">{SKILL_LABEL[sec.sub_skill] ?? sec.sub_skill}</span>
              </div>
              {i < (iaSections?.length ?? 1) - 1 && <div className={`w-6 h-1 ${i < currentSectionIdx ? 'bg-gray-900' : 'bg-gray-300'}`} />}
            </div>
          ))}
        </div>

        {/* Header: section info + global timer */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between bg-white border-2 border-gray-900 rounded-xl p-4 sm:p-6 mb-6 gap-4" style={{ boxShadow: '6px 6px 0 #0F0F0F' }}>
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-indigo-700 border-2 border-gray-900 rounded-xl flex items-center justify-center text-3xl" style={{ boxShadow: '3px 3px 0 #0F0F0F' }}>
              {SKILL_ICON[currentSection.skill] ?? '📝'}
            </div>
            <div>
              <p className="text-gray-900 font-black text-lg uppercase tracking-wide">{SKILL_LABEL[currentSection.sub_skill] ?? currentSection.sub_skill}</p>
              <p className="text-gray-500 text-xs font-bold uppercase tracking-widest mt-1">Question {currentIdx + 1} of {totalQ}</p>
            </div>
          </div>
          <div className="flex items-center self-end sm:self-auto bg-gray-50 border-2 border-gray-900 px-4 py-2 rounded-xl" style={{ boxShadow: 'inset 2px 2px 0 rgba(0,0,0,0.05)' }}>
            <CircleTimer timeLeft={timeLeft} total={20 * 60} size={48} />
            <div className="ml-3">
              <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Total Time Left</p>
              <p className="text-lg font-black text-gray-900 leading-none">{formatTime(timeLeft)}</p>
            </div>
          </div>
        </div>

        {/* Split view: left context panel + right question panel */}
        <div className="flex flex-col lg:flex-row gap-6">

          {/* LEFT: Audio player (LISTENING) or Reading Passage (READING) or nothing */}
          <div className="w-full lg:w-1/2 flex flex-col gap-4">
            {currentSection.section_type === 'AUDIO' && currentSection.audio_url ? (
              <div className="bg-indigo-50 border-2 border-gray-900 rounded-xl p-8 text-center flex flex-col items-center" style={{ boxShadow: '6px 6px 0 #0F0F0F' }}>
                <button
                  onClick={() => { if (audioState === 'idle' && audioRef.current) { audioRef.current.play(); setAudioState('playing'); } }}
                  disabled={audioState !== 'idle'}
                  className={`w-24 h-24 border-2 border-gray-900 rounded-full flex items-center justify-center text-white mb-6 transition-all shadow-[4px_4px_0_#0F0F0F] ${
                    audioState === 'idle' ? 'bg-indigo-700 hover:bg-indigo-600' : audioState === 'playing' ? 'bg-amber-500' : 'bg-emerald-500'
                  }`}
                >
                  {audioState === 'idle' && <PlayCircle className="w-12 h-12 ml-1" />}
                  {audioState === 'playing' && <div className="flex items-center gap-1.5 h-10">{animBars.slice(0,4).map((h,i) => <div key={i} className="w-2 bg-white rounded-full animate-pulse" style={{ height: `${20 + h*40}px`, animationDelay: `${i*0.15}s` }} />)}</div>}
                  {audioState === 'played' && <CheckCircle2 className="w-12 h-12" />}
                </button>
                <p className="text-gray-900 font-black text-lg uppercase tracking-wide mb-2">Listening Audio</p>
                <p className="text-gray-600 font-medium text-sm">{audioState === 'played' ? 'Playback complete — answer the questions.' : 'Listen carefully. The audio plays once.'}</p>
                <audio ref={audioRef} src={currentSection.audio_url} preload="auto" onEnded={() => setAudioState('played')} />
              </div>
            ) : currentSection.section_type === 'PASSAGE' && currentSection.passage_text ? (
              <div className="bg-white border-2 border-gray-900 rounded-xl flex flex-col max-h-[700px]" style={{ boxShadow: '6px 6px 0 #0F0F0F' }}>
                <div className="p-4 border-b-2 border-gray-900 bg-gray-50 flex items-center justify-between">
                  <span className="font-black text-sm uppercase tracking-widest text-gray-500">Reading Passage</span>
                  <button onClick={() => setShowPassage(!showPassage)} className="lg:hidden font-black text-xs text-indigo-700 uppercase">{showPassage ? 'Hide' : 'Show'}</button>
                </div>
                <div className={`p-6 overflow-y-auto flex-1 ${!showPassage ? 'hidden lg:block' : 'block'}`}>
                  <p className="font-serif text-gray-800 text-base leading-loose whitespace-pre-wrap">{currentSection.passage_text}</p>
                </div>
              </div>
            ) : (
              /* No left panel for pure MCQ/WRITING/SPEAKING — show a focus card */
              <div className="bg-indigo-50 border-2 border-gray-200 rounded-xl p-6 hidden lg:flex flex-col items-center justify-center text-center gap-4">
                <span className="text-6xl">{SKILL_ICON[currentSection.skill] ?? '📝'}</span>
                <p className="font-black text-gray-900 uppercase tracking-wide">{SKILL_LABEL[currentSection.sub_skill] ?? currentSection.sub_skill}</p>
                <p className="text-gray-400 text-sm font-medium">Section {currentSectionIdx + 1} of {iaSections?.length}</p>
                <div className="text-xs font-black text-gray-400 uppercase tracking-widest mt-4">{currentIdx + 1} / {totalQ} questions answered</div>
              </div>
            )}
          </div>

          {/* RIGHT: Question + input */}
          <div className="w-full lg:w-1/2 flex flex-col gap-4">
            <div className="bg-white border-2 border-gray-900 rounded-xl p-6 sm:p-8" style={{ boxShadow: '6px 6px 0 #0F0F0F' }}>

              <div className="flex justify-between items-center mb-6">
                <span className="bg-gray-100 text-gray-500 text-xs font-black uppercase tracking-widest px-4 py-1.5 rounded border-2 border-gray-200">
                  Q {currentIdx + 1} / {totalQ}
                </span>
                <span className="bg-indigo-100 text-indigo-800 border-2 border-indigo-300 text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-lg">
                  {currentQ.question_type.replace('_', ' ')}
                </span>
              </div>

              <h3 className="text-xl font-black text-gray-900 mb-8 leading-snug">
                {currentQ.question_type === 'SPEAKING_PROMPT' ? `"${currentQ.prompt_text}"` : currentQ.prompt_text}
              </h3>

              {/* ── MCQ ── */}
              {currentQ.question_type === 'MCQ' && optionKeys.length > 0 && (
                <div className="flex flex-col gap-3">
                  {optionKeys.map(key => {
                    const selected = answers[currentQ.id] === key;
                    return (
                      <button key={key}
                        onClick={() => setAnswers(p => ({ ...p, [currentQ.id]: key }))}
                        className={`text-left p-4 rounded-xl border-2 font-bold text-sm transition-all flex items-start gap-3 ${selected ? 'bg-gray-900 border-gray-900 text-white' : 'bg-white border-gray-300 text-gray-700 hover:border-gray-900'}`}
                        style={selected ? { boxShadow: '3px 3px 0 #0F0F0F' } : {}}>
                        <span className={`w-6 h-6 flex-shrink-0 rounded border-2 flex items-center justify-center font-black text-xs ${selected ? 'border-white text-white' : 'border-gray-400 text-gray-500'}`}>{key}</span>
                        <span>{optionsMap[key]}</span>
                      </button>
                    );
                  })}
                </div>
              )}

              {/* ── TFNG ── */}
              {currentQ.question_type === 'TFNG' && (
                <div className="flex flex-col gap-3">
                  {['TRUE', 'FALSE', 'NOT GIVEN'].map(val => {
                    const selected = answers[currentQ.id] === val;
                    const color = val === 'TRUE' ? 'emerald' : val === 'FALSE' ? 'rose' : 'amber';
                    return (
                      <button key={val}
                        onClick={() => setAnswers(p => ({ ...p, [currentQ.id]: val }))}
                        className={`p-4 rounded-xl border-2 font-black text-sm uppercase tracking-wide transition-all ${
                          selected
                            ? `bg-${color}-600 border-gray-900 text-white shadow-[3px_3px_0_#0F0F0F]`
                            : `bg-white border-gray-300 text-gray-700 hover:border-gray-900`
                        }`}>
                        {val}
                      </button>
                    );
                  })}
                </div>
              )}

              {/* ── WRITING_PROMPT ── */}
              {currentQ.question_type === 'WRITING_PROMPT' && (
                <div>
                  <textarea
                    placeholder="Write your response here (minimum 10 words)…"
                    rows={8}
                    value={answers[currentQ.id] || ""}
                    onChange={e => {
                      const text = e.target.value;
                      setAnswers(p => ({ ...p, [currentQ.id]: text }));
                      persistWritingDebounced(currentQ.id, text);
                    }}
                    className="w-full p-5 border-2 border-gray-900 rounded-xl text-base font-medium outline-none focus:ring-2 focus:ring-indigo-200 bg-gray-50 resize-none"
                    style={{ boxShadow: 'inset 3px 3px 0 rgba(0,0,0,0.05)' }}
                  />
                  <div className="flex justify-between items-center mt-2">
                    <p className="text-xs text-gray-400 font-bold">
                      {(answers[currentQ.id] ?? '').trim().split(/\s+/).filter(Boolean).length} words
                    </p>
                    <p className="text-[10px] text-gray-300 font-medium">Auto-saved</p>
                  </div>
                </div>
              )}

              {/* ── SPEAKING_PROMPT ── */}
              {currentQ.question_type === 'SPEAKING_PROMPT' && (() => {
                const hasTranscript = !!(answers[currentQ.id]?.trim());
                return (
                  <div className="bg-gray-50 border-2 border-gray-300 rounded-2xl p-6">
                    {isRecording ? (
                      /* ── Active recording ── */
                      <div className="flex flex-col items-center gap-4">
                        <div className="flex items-center gap-1.5 h-10">
                          {animBars.slice(0, 10).map((h, i) => (
                            <div key={i} className="w-1.5 bg-rose-500 rounded-full animate-pulse"
                              style={{ height: `${10 + h * 28}px`, animationDelay: `${i * 0.09}s` }} />
                          ))}
                        </div>
                        {liveTranscript ? (
                          <div className="w-full bg-white border border-gray-200 rounded-xl p-3 text-sm text-gray-700 font-medium italic min-h-[56px] max-h-[120px] overflow-y-auto leading-relaxed">
                            "{liveTranscript}"
                          </div>
                        ) : (
                          <p className="text-xs text-gray-400 font-medium">Speak clearly — transcript appears here</p>
                        )}
                        <button onClick={() => stopSpeakingRecording(currentQ.id)}
                          className="bg-rose-600 hover:bg-rose-700 text-white font-black text-sm px-8 py-3 rounded-xl border-2 border-gray-900 uppercase tracking-wide shadow-[3px_3px_0_#0F0F0F]">
                          Stop &amp; Save
                        </button>
                      </div>
                    ) : hasTranscript ? (
                      /* ── Has saved transcript ── */
                      <div className="flex flex-col gap-3">
                        <div className="flex items-center gap-2">
                          <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                          <span className="text-xs font-black uppercase tracking-widest text-emerald-700">Response Saved</span>
                        </div>
                        <div className="bg-white border-2 border-emerald-200 rounded-xl p-4 text-sm text-gray-700 font-medium italic max-h-[120px] overflow-y-auto leading-relaxed">
                          "{answers[currentQ.id]}"
                        </div>
                        <button onClick={() => startSpeakingRecording(currentQ.id)}
                          className="text-sm font-black uppercase tracking-wide px-6 py-3 rounded-xl border-2 border-gray-900 bg-white text-gray-900 hover:bg-gray-50 self-start"
                          style={{ boxShadow: '3px 3px 0 #0F0F0F' }}>
                          Re-record Answer
                        </button>
                      </div>
                    ) : (
                      /* ── Not yet recorded ── */
                      <div className="flex flex-col items-center gap-4 text-center">
                        <div className="w-16 h-16 rounded-full bg-indigo-100 border-2 border-indigo-700 flex items-center justify-center">
                          <Mic className="w-8 h-8 text-indigo-700" />
                        </div>
                        <p className="text-sm text-gray-600 font-medium max-w-xs">
                          Tap the button and speak your answer. Your response will be transcribed automatically.
                        </p>
                        <button onClick={() => startSpeakingRecording(currentQ.id)}
                          className="bg-indigo-700 hover:bg-indigo-600 text-white font-black text-sm uppercase tracking-wide px-8 py-4 rounded-xl border-2 border-gray-900"
                          style={{ boxShadow: '4px 4px 0 #0F0F0F' }}>
                          Start Speaking
                        </button>
                        {!((window as any).SpeechRecognition || (window as any).webkitSpeechRecognition) && (
                          <p className="text-xs text-amber-600 font-medium">Use Chrome or Edge for voice transcription.</p>
                        )}
                      </div>
                    )}
                  </div>
                );
              })()}

              {/* Navigation */}
              <div className="mt-8 flex gap-4">
                <button onClick={() => setCurrentIdx(i => i - 1)} disabled={currentIdx === 0}
                  className="px-6 py-4 border-2 border-gray-900 rounded-xl font-black text-gray-600 disabled:opacity-30 disabled:pointer-events-none hover:bg-gray-50 uppercase text-sm tracking-wide">
                  Prev
                </button>
                <button
                  onClick={handleNextQuestion}
                  disabled={!canProceed || (currentQ.question_type === 'SPEAKING_PROMPT' && isRecording)}
                  className={`flex-1 font-black text-sm uppercase tracking-wide border-2 border-gray-900 rounded-xl py-4 transition-all ${!canProceed ? 'bg-gray-100 text-gray-400 opacity-60 cursor-not-allowed' : 'bg-indigo-700 text-white hover:bg-indigo-600'}`}
                  style={canProceed ? { boxShadow: '4px 4px 0 #0F0F0F' } : {}}>
                  {currentIdx === totalQ - 1
                    ? (currentSectionIdx < (iaSections?.length ?? 1) - 1 ? 'Complete Section →' : 'Submit IA →')
                    : 'Next Question →'}
                </button>
              </div>

            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] font-sans text-gray-900 selection:bg-indigo-200">
      <TopNavBar hideMomentum={phase === 'session'} totalMomentum={totalMomentum} />
      <div className="fixed inset-0 pointer-events-none z-0" style={{ backgroundImage: 'radial-gradient(circle, #d1d5db 1px, transparent 1px)', backgroundSize: '24px 24px', opacity: 0.5 }} />
      
      <div className="relative z-10 pt-16">
        {phase === "gate" && (() => {
          if (!iaStatus?.has_schedule || !iaStatus?.prerequisites_met) return renderNotEligible();
          if (!iaStatus.is_ia_day)                                       return renderScheduled();
          if (!iaStatus.dcs_eligible)                                    return renderIaDayLowDCS();
          return renderGate();
        })()}
        {phase === "session"  && renderSession()}
        {phase === "interim"  && renderInterim()}
        {phase === "scoring"  && renderScoring()}
        {phase === "results"  && renderResults()}
      </div>

      <style>{`
        @keyframes fade-in { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        .animate-fade-in { animation: fade-in 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
        .neo-btn { transition: transform 0.1s ease, box-shadow 0.1s ease; }
        .neo-btn:hover { transform: translate(-2px, -2px); box-shadow: 6px 6px 0 #0F0F0F !important; }
        .neo-btn:active { transform: translate(2px, 2px); box-shadow: 2px 2px 0 #0F0F0F !important; }
      `}</style>
    </div>
  );
}
