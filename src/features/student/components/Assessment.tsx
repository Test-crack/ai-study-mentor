import React, { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowRight, CheckCircle2, AlertCircle, Target, BookOpen, Headphones, PenLine, Mic, BrainCircuit, PlayCircle, Zap, Loader2, Lock, XCircle, CalendarClock, ArrowLeft, Flame } from "lucide-react";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { useMomentum } from "@/features/student/Context/MomentumContext";
import { callBackend } from "@/features/auth/services/authClient";
import { transformSectionAudioUrls } from "@/features/student/utils/iaAudioUtils";

// ─────────────────────────────────────────────────────────────────────────────
// API INTEGRATION LAYER (Ready for Sarthak's Endpoints)
// ─────────────────────────────────────────────────────────────────────────────


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
  has_completed_session?: boolean;
  completed_session_scores?: Array<{
    skill: string;
    sub_skill: string;
    band: number;
    correct?: number;
    total?: number;
    ai_graded?: boolean;
    previous_band?: number | null;
    delta?: number | null;
  }> | null;
  completed_session_momentum?: number | null;
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

// Per-skill SaaS accent colorways — keyed on parent skill (icons / pills / tiles).
const SKILL_ACCENT: Record<string, { text: string; bg: string; border: string }> = {
  LISTENING: { text: "text-brand-teal-600",   bg: "bg-brand-teal-50",   border: "border-brand-teal-200" },
  READING:   { text: "text-brand-blue-600", bg: "bg-brand-blue-50", border: "border-brand-blue-200" },
  WRITING:   { text: "text-brand-warm", bg: "bg-brand-warm-tint", border: "border-brand-warm/30" },
  SPEAKING:  { text: "text-rose-500",   bg: "bg-rose-50",   border: "border-rose-200" },
};
const accent = (skill: string) =>
  SKILL_ACCENT[(skill ?? "").toUpperCase()] ?? { text: "text-brand-text-mute", bg: "bg-brand-bg-alt", border: "border-brand-line" };

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
  const { streak } = useMomentum();
  const navigate = useNavigate();

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-white border-b border-brand-line">
      <div className="w-full px-3 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-14 sm:h-16">

          {/* Left: back button (gate only) + brand */}
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            {!hideMomentum && (
              <button
                onClick={() => navigate('/student/dashboard')}
                className="flex items-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-1.5 rounded-lg border border-brand-line font-medium text-xs text-brand-text-mute hover:bg-brand-bg-alt transition-colors flex-shrink-0 shadow-sm"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Back</span>
              </button>
            )}
            <div className="flex items-center gap-1.5 sm:gap-2.5 min-w-0">
              <div className="grid grid-cols-2 grid-rows-2 gap-[3px] w-[20px] h-[20px] sm:w-[22px] sm:h-[22px] shrink-0">
                <div className="rounded-[3px] bg-brand-purple" />
                <div className="rounded-[3px] bg-brand-purple-tint" />
                <div className="rounded-[3px] bg-amber-500" />
                <div className="rounded-[3px] bg-brand-mint" />
              </div>
              <span className="text-base sm:text-xl font-semibold text-brand-text tracking-tight truncate">
                TestCrack
              </span>
            </div>
          </div>

          {/* Right: streak + momentum (hidden during session) */}
          {!hideMomentum && (
            <div className="flex items-center gap-1.5 sm:gap-2 flex-shrink-0">

              {/* Streak */}
              <div className="flex items-center gap-1 sm:gap-1.5 bg-brand-warm-tint border border-brand-warm/30 px-2 sm:px-3 py-1 sm:py-1.5 rounded-full shadow-sm">
                <Flame className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-brand-warm fill-brand-warm flex-shrink-0" />
                <span className="font-semibold text-brand-warm text-xs sm:text-sm">{streak}</span>
                <span className="hidden md:inline text-xs text-brand-warm/70 font-medium">day streak</span>
              </div>

              {/* Momentum */}
              <div className="flex items-center gap-1 sm:gap-2 bg-brand-teal-50 border border-brand-teal-200 px-2 sm:px-4 py-1 sm:py-1.5 rounded-full shadow-sm">
                <Zap className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-400 fill-amber-400 flex-shrink-0" />
                <span className="font-semibold text-brand-text text-xs sm:text-sm">{totalMomentum}</span>
                <span className="hidden md:inline text-xs text-brand-teal-400 font-medium">pts</span>
              </div>

            </div>
          )}

        </div>
      </div>
    </nav>
  );
}

// NOTE: CircleTimer colors intentionally untouched — threshold-based functional indicator.
const CircleTimer: React.FC<{ timeLeft: number; total: number; size?: number }> = ({ timeLeft, total, size = 64 }) => {
  const pct = total > 0 ? timeLeft / total : 1;
  const r = (size - 8) / 2;
  const circ = 2 * Math.PI * r;
  const dash = circ * pct;
  const isUrgent = pct < 0.2;
  const color = isUrgent ? "#EF4444" : pct < 0.5 ? "#F59E0B" : "#0B6151";
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

  // Gate-level error (e.g. window closing too soon)
  const [gateError, setGateError]             = useState<string | null>(null);

  // IA session state
  const [iaSessionId, setIaSessionId]         = useState<string | null>(null);
  const [iaSections, setIaSections]           = useState<IASection[] | null>(null);
  const [currentSectionIdx, setCurrentSectionIdx] = useState(0);
  const [isLoadingQuestions, setIsLoadingQuestions] = useState(false);
  const [sessionMomentumAward, setSessionMomentumAward] = useState(0);
  const [iaResults, setIaResults]             = useState<any>(null);
  // Which result card's Key Observations panel is open (null = all closed)
  const [expandedFeedbackIdx, setExpandedFeedbackIdx] = useState<number | null>(null);

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

  // Convenience: current section and question
  const currentSection  = iaSections?.[currentSectionIdx] ?? null;
  const sessionData     = currentSection; // alias so existing helpers still compile
  const isLoadingSession = isLoadingQuestions;


  // --- IA ELIGIBILITY CHECK ---
  // Only check when the student lands on the gate screen (not mid-session resume).
  useEffect(() => {
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
  }, [phase]);



  /** Save one answer to backend. Returns the promise so callers can await it
   *  before submitting (the final answer must land before grading reads answers). */
  const persistAnswer = (questionId: string, answer: string): Promise<void> => {
    if (!iaSessionId) return Promise.resolve();
    const backendUrl = import.meta.env.VITE_BACKEND_URL || "http://localhost:4000";
    return callBackend(`${backendUrl}/api/ia/answer`, {
      method: 'POST',
      body: JSON.stringify({ session_id: iaSessionId, question_id: questionId, answer })
    }).then(() => undefined).catch(e => console.warn('[IA] answer save failed:', e));
  };

  /** Flush the current question's answer to the backend (awaitable). */
  const flushCurrentAnswer = useCallback(async () => {
    if (writingDebounceRef.current) { clearTimeout(writingDebounceRef.current); writingDebounceRef.current = null; }
    const q = currentSection?.questions[currentIdx];
    const a = q ? answers[q.id] : undefined;
    if (q && a) await persistAnswer(q.id, a);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentSection, currentIdx, answers, iaSessionId]);

  /** Debounced writing save — waits 1.5s after the student stops typing. */
  const persistWritingDebounced = (questionId: string, text: string) => {
    if (writingDebounceRef.current) clearTimeout(writingDebounceRef.current);
    writingDebounceRef.current = setTimeout(() => persistAnswer(questionId, text), 1500);
  };

  /** Start recording with the Web Speech API (Chrome/Edge). Falls back gracefully. */
  const startSpeakingRecording = (questionId: string) => {
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    // Always start fresh — re-recording replaces, never appends to previous transcript
    transcriptAccumRef.current = '';
    setLiveTranscript('');
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
      setRecordedPrompts(p => ({ ...p, [questionId]: true }));
    } else {
      // Recognition produced no text (mic blocked, no-speech, unsupported browser).
      // Mark with a sentinel so canProceed unblocks and the student can still advance.
      const sentinel = '[no transcript]';
      setAnswers(p => ({ ...p, [questionId]: sentinel }));
      persistAnswer(questionId, sentinel);
      setRecordedPrompts(p => ({ ...p, [questionId]: true }));
    }
  };

  const beginFullTest = async () => {
    localStorage.removeItem(STORAGE_KEY);
    setIsLoadingQuestions(true);
    try {
      const backendUrl = import.meta.env.VITE_BACKEND_URL || "http://localhost:4000";
      const res: IASessionResponse = await callBackend(`${backendUrl}/api/ia/questions`);

      if (!res.success) {
        // Surface window-closing-soon as a friendly gate message
        if ((res as any).error === 'window_closing_soon') {
          setGateError((res as any).message ?? 'Too little time remains in today\'s window. Try your next scheduled IA.');
        }
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
      
      // Transform audio URLs to use public folder paths
      const sectionsWithPublicAudioUrls = transformSectionAudioUrls(res.sections);

      setIaSessionId(res.session_id);
      setIaSections(sectionsWithPublicAudioUrls);
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
        // Ensure the final answer is persisted BEFORE submit reads stored answers,
        // otherwise the last question can be graded as unanswered (fire-and-forget race).
        await flushCurrentAnswer();
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
        // Submit failed (e.g. AI grading temporarily down → 502). The backend keeps the
        // session IN_PROGRESS and answers saved, so return to the session for retry
        // rather than showing an empty results screen.
        console.error('[IA] submit error — returning to session for retry:', err);
        setPhase("session");
        return;
      }
      setTimeout(() => setPhase("results"), 3500);
    }
  }, [iaSections, currentSectionIdx, iaSessionId, flushCurrentAnswer]);

  const advanceToNextSection = () => {
    const nextIdx = currentSectionIdx + 1;
    // Stop any playing audio from the outgoing section
    if (audioRef.current && !audioRef.current.paused) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
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

    // Flush any pending writing debounce immediately before advancing
    if (writingDebounceRef.current) {
      clearTimeout(writingDebounceRef.current);
      writingDebounceRef.current = null;
    }
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
    if (phase !== "session" || isLoadingSession || timeLeft <= 0) return;
    const t = setInterval(() => setTimeLeft(s => s - 1), 1000);
    return () => clearInterval(t);
  }, [phase, timeLeft, isLoadingSession]);

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

  if (eligibilityLoading) {
    return (
      <div className="min-h-screen bg-brand-bg flex items-center justify-center">
        <Loader2 className="w-10 h-10 text-brand-teal-600 animate-spin" />
      </div>
    );
  }

  // ── STATE 1: Prerequisites not yet met (< 6 drills or < 2 days) ─────────────
  const renderNotEligible = () => {
    if (!iaStatus) return null;
    const p = iaStatus.progress;
    const conditions = [
      { key: "drills", label: "Drill Sessions",        met: p.cond_drills, value: `${p.drills_completed} / ${p.drills_required}`,       pct: Math.min(100, Math.round((p.drills_completed / p.drills_required) * 100)) },
      { key: "days",   label: "Days Since First Drill", met: p.cond_days,   value: `${p.days_since_first_drill} / ${p.min_days_required}`, pct: Math.min(100, Math.round((p.days_since_first_drill / p.min_days_required) * 100)) },
      { key: "dcs",    label: "Avg Drill Accuracy",    met: p.cond_dcs,    value: `${p.avg_dcs}% / ${p.dcs_required}%`,                  pct: Math.min(100, Math.round((p.avg_dcs / p.dcs_required) * 100)) }
    ];
    return (
      <div className="max-w-2xl mx-auto animate-fade-in pt-12 px-4">
        <div className="bg-white border border-brand-line rounded-2xl p-8 sm:p-10 shadow-md">
          <div className="flex flex-col items-center text-center mb-8">
            <div className="w-16 h-16 rounded-2xl bg-rose-50 border border-rose-200 flex items-center justify-center mb-4">
              <Lock className="w-8 h-8 text-rose-500" />
            </div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-lg bg-rose-500 text-white text-xs font-semibold tracking-wider uppercase mb-3 shadow-sm">
              <XCircle className="w-3.5 h-3.5" /> Not Eligible Yet
            </div>
            <h1 className="font-manrope text-3xl font-bold text-brand-text tracking-tight">Internal Assessment Locked</h1>
            <p className="text-brand-text-mute font-medium mt-2 max-w-md">Complete all three requirements below to unlock your Internal Assessment window.</p>
          </div>
          <div className="space-y-4 mb-8">
            {conditions.map(c => (
              <div key={c.key} className={`border rounded-xl p-4 ${c.met ? "border-emerald-200 bg-emerald-50" : "border-brand-line bg-brand-bg-alt"}`}>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    {c.met ? <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" /> : <div className="w-5 h-5 rounded-full border-2 border-brand-line flex-shrink-0" />}
                    <span className="font-semibold text-sm text-brand-text uppercase tracking-wide">{c.label}</span>
                  </div>
                  <span className={`font-semibold text-sm tabular-nums ${c.met ? "text-emerald-700" : "text-brand-text-mute"}`}>{c.value}</span>
                </div>
                <div className="w-full h-2 bg-brand-line rounded-full overflow-hidden">
                  <div className={`h-full rounded-full transition-all duration-500 ${c.met ? "bg-emerald-500" : "bg-brand-teal-500"}`} style={{ width: `${c.pct}%` }} />
                </div>
              </div>
            ))}
          </div>
          {iaStatus!.reasons.length > 0 && (
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-8">
              <p className="text-xs font-semibold text-amber-700 uppercase tracking-wider mb-2">What to do next</p>
              <ul className="space-y-1.5">
                {iaStatus!.reasons.map(r => (
                  <li key={r.key} className="flex items-start gap-2 text-sm text-amber-900 font-medium"><span className="mt-0.5 flex-shrink-0">•</span>{r.message}</li>
                ))}
              </ul>
            </div>
          )}
          <button onClick={() => navigate('/student/dashboard')} className="w-full bg-brand-teal-600 hover:bg-brand-teal-700 text-white border-none font-semibold text-sm uppercase tracking-wide py-4 rounded-xl transition-all shadow-sm hover:shadow-md">
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
        <div className="bg-white border border-brand-line rounded-2xl p-8 sm:p-10 shadow-md">
          {/* Header */}
          <div className="flex flex-col items-center text-center mb-8">
            <div className="w-16 h-16 rounded-2xl bg-brand-teal-50 border border-brand-teal-200 flex items-center justify-center mb-4">
              <CalendarClock className="w-8 h-8 text-brand-teal-600" />
            </div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-lg bg-brand-teal-600 text-white font-jetbrains text-xs font-semibold tracking-wider uppercase mb-3 shadow-sm">
              <Zap className="w-3.5 h-3.5 fill-amber-400 text-amber-400" /> Internal Assessment
            </div>
            <h1 className="font-manrope text-3xl font-bold text-brand-text tracking-tight mb-2">Next Assessment Scheduled</h1>
            {next ? (
              <p className="text-brand-text-mute font-medium">
                Your next Internal Assessment opens on{" "}
                <span className="font-semibold text-brand-teal-600">{next.date_formatted}</span>
                {next.days_away === 1 ? " — tomorrow!" : next.days_away === 0 ? " — today!" : ` — in ${next.days_away} days`}
              </p>
            ) : (
              <p className="text-brand-text-mute font-medium">No upcoming assessment slot found.</p>
            )}
          </div>

          {/* DCS status block */}
          <div className={`border rounded-xl p-5 mb-6 ${eligible ? "border-emerald-200 bg-emerald-50" : "border-rose-200 bg-rose-50"}`}>
            <div className="flex items-center justify-between mb-3">
              <span className="font-semibold text-sm uppercase tracking-wide text-brand-text">Your Avg DCS Score</span>
              <span className={`text-2xl font-bold tabular-nums ${eligible ? "text-emerald-700" : "text-rose-600"}`}>{avg_dcs}%</span>
            </div>
            <div className="w-full h-3 bg-brand-line rounded-full overflow-hidden mb-3">
              <div
                className={`h-full rounded-full transition-all duration-700 ${eligible ? "bg-emerald-500" : "bg-rose-500"}`}
                style={{ width: `${Math.min(100, avg_dcs)}%` }}
              />
            </div>
            <p className={`text-sm font-medium ${eligible ? "text-emerald-700" : "text-rose-700"}`}>
              {eligible
                ? "✓ Maintain your DCS score to stay eligible for your next IA."
                : "✗ Improve your DCS score to be eligible — need 40% or above."}
            </p>
          </div>

          {/* Next date callout */}
          {next && (
            <div className="bg-brand-bg-alt border border-brand-line rounded-xl p-4 mb-6 flex items-center gap-4">
              <div className="bg-brand-teal-600 rounded-xl w-14 h-14 flex flex-col items-center justify-center flex-shrink-0 shadow-sm">
                <span className="text-white font-bold text-xl leading-none">{next.date.split('-')[2]}</span>
                <span className="text-brand-teal-200 text-[9px] font-semibold uppercase tracking-wider">{next.date_formatted.split(' ').slice(-1)[0]}</span>
              </div>
              <div>
                <p className="font-semibold text-brand-text text-sm uppercase tracking-wide">IA #{next.number} Window Opens</p>
                <p className="text-brand-text-mute text-xs font-medium mt-0.5">{next.date_formatted} · {next.days_away === 1 ? "1 day away" : `${next.days_away} days away`}</p>
              </div>
            </div>
          )}

          <button onClick={() => navigate('/student/dashboard')} className="w-full bg-brand-teal-600 hover:bg-brand-teal-700 text-white border-none font-semibold text-sm uppercase tracking-wide py-4 rounded-xl transition-all shadow-sm hover:shadow-md">
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
        <div className="bg-white border border-brand-line rounded-2xl p-8 sm:p-10 text-center shadow-md">
          <div className="w-16 h-16 rounded-2xl bg-rose-50 border border-rose-200 flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-8 h-8 text-rose-500" />
          </div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-lg bg-rose-500 text-white text-xs font-semibold tracking-wider uppercase mb-4 shadow-sm">
            IA #{num} Window · Today
          </div>
          <h1 className="font-manrope text-3xl font-bold text-brand-text tracking-tight mb-3">Improve Your DCS to Take This IA</h1>
          <p className="text-brand-text-mute font-medium mb-8 max-w-md mx-auto">
            Today is your Internal Assessment window but your average accuracy is below the required threshold. Complete more drills today to bring it up.
          </p>
          {/* DCS meter */}
          <div className="bg-rose-50 border border-rose-200 rounded-xl p-5 mb-8 text-left">
            <div className="flex items-center justify-between mb-2">
              <span className="font-semibold text-sm uppercase tracking-wide text-brand-text">Current Avg DCS</span>
              <span className="text-2xl font-bold text-rose-600 tabular-nums">{avg_dcs}%</span>
            </div>
            <div className="w-full h-3 bg-rose-100 rounded-full overflow-hidden mb-2">
              <div className="h-full rounded-full bg-rose-500 transition-all duration-700" style={{ width: `${Math.min(100, avg_dcs)}%` }} />
            </div>
            <p className="text-xs font-medium text-rose-700">Need 40% — you're {40 - avg_dcs}% short. Complete drills to improve your score.</p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3">
            <button onClick={() => navigate('/student/dashboard')} className="flex-1 px-6 py-4 rounded-xl border border-brand-line font-medium text-brand-text-mute hover:bg-brand-bg-alt uppercase tracking-wide transition-colors">
              Dashboard
            </button>
            <button onClick={() => navigate('/student/drill')} className="flex-1 bg-brand-teal-600 hover:bg-brand-teal-700 text-white border-none font-semibold text-sm uppercase tracking-wide py-4 rounded-xl transition-all shadow-sm hover:shadow-md">
              Do a Drill Now →
            </button>
          </div>
        </div>
      </div>
    );
  };

  // ── STATE 3.5: IA completed today — Show results ──────────────────────────
  const renderCompletedToday = () => {
    if (!iaStatus?.completed_session_scores) return null;
    
    const scores = iaStatus.completed_session_scores;
    const momentumAwarded = iaStatus.completed_session_momentum ?? 0;
    const iaNumber = iaStatus.current_ia_number ?? 1;
    const isFirstIA = iaNumber === 1;
    const comparisonLabel = isFirstIA ? 'vs Diagnostic' : 'vs Current Band';

    return (
      <div className="max-w-3xl mx-auto animate-fade-in pt-8 pb-24 px-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <h2 className="font-manrope text-3xl font-bold text-brand-text tracking-tight">IA #{iaNumber} Complete</h2>
          <button
            onClick={() => navigate('/student/dashboard')}
            className="px-6 py-3 bg-brand-teal-600 text-white border-none rounded-xl font-semibold text-sm uppercase tracking-wide hover:bg-brand-teal-700 shadow-sm hover:shadow-md transition-all">
            Dashboard
          </button>
        </div>

        {/* Completion banner */}
        <div className="bg-emerald-600 rounded-2xl p-8 mb-6 text-center shadow-md relative overflow-hidden">
          <div className="absolute -top-8 -right-8 text-[140px] opacity-10 pointer-events-none select-none">✓</div>
          <div className="inline-flex items-center gap-2 bg-white text-emerald-900 px-5 py-2 rounded-lg font-semibold uppercase shadow-sm mb-4">
            <CheckCircle2 className="w-5 h-5 text-emerald-500" /> Assessment Completed Today
          </div>
          <p className="text-emerald-100 font-semibold text-lg mb-2">
            Submitted earlier today
          </p>
          <p className="text-emerald-200 font-medium">
            Your competency matrix has been updated with today's results
          </p>
        </div>

        {/* Momentum earned */}
        {momentumAwarded > 0 && (
          <div className="bg-white border border-brand-line rounded-2xl p-6 mb-6 text-center shadow-sm">
            <p className="text-brand-text-mute font-jetbrains font-semibold uppercase tracking-wider mb-1 text-sm">Momentum Earned</p>
            <div className="text-5xl font-bold text-brand-teal-600">+{momentumAwarded}</div>
          </div>
        )}

        {/* Per sub-skill score cards */}
        {scores.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 mb-6">
            {scores.map((s, i) => {
              const hasDelta  = s.delta !== null && s.delta !== undefined;
              const isUp      = hasDelta && s.delta! > 0;
              const isDown    = hasDelta && s.delta! < 0;
              const deltaText = hasDelta
                ? (isUp ? `+${s.delta!.toFixed(1)}` : isDown ? s.delta!.toFixed(1) : '±0.0')
                : null;
              const a = accent(s.skill);

              return (
                <div key={i} className="bg-white border border-brand-line rounded-2xl p-6 shadow-sm">
                  {/* Sub-skill header */}
                  <div className="flex items-center gap-3 mb-4">
                    <span className={`w-10 h-10 rounded-lg ${a.bg} border ${a.border} flex items-center justify-center text-2xl`}>{SKILL_ICON[s.skill] ?? '📝'}</span>
                    <div>
                      <p className="font-semibold text-brand-text text-sm uppercase tracking-wide">{SKILL_LABEL[s.sub_skill] ?? s.sub_skill}</p>
                      <p className="text-brand-text-mute text-[10px] font-medium uppercase">{s.skill}{s.ai_graded ? ' · AI Graded' : ''}</p>
                    </div>
                  </div>

                  {/* Band score + delta */}
                  <div className="flex items-end gap-4">
                    <span className="text-5xl font-bold text-brand-text leading-none">
                      {s.band > 0 ? s.band.toFixed(1) : '—'}
                    </span>
                    {hasDelta && (
                      <div className="mb-1">
                        <span className={`text-lg font-bold ${isUp ? 'text-emerald-600' : isDown ? 'text-rose-600' : 'text-brand-text-mute'}`}>
                          {deltaText}
                        </span>
                        <p className="text-[10px] text-brand-text-mute font-medium uppercase">{comparisonLabel}</p>
                      </div>
                    )}
                  </div>

                  {/* Previous band */}
                  {s.previous_band !== null && s.previous_band !== undefined && (
                    <p className="text-xs text-brand-text-mute font-medium mt-2">
                      Previous: <span className="font-semibold">{s.previous_band.toFixed(1)}</span>
                      {isUp && <span className="text-emerald-600 ml-1 font-semibold">↑ Improved</span>}
                      {isDown && <span className="text-rose-600 ml-1 font-semibold">↓ Dropped</span>}
                    </p>
                  )}

                  {/* MCQ score (if present) */}
                  {s.correct != null && s.total != null && s.total > 0 && (
                    <p className="text-xs text-brand-text-mute font-medium mt-1">{s.correct} / {s.total} MCQ correct</p>
                  )}

                  {/* Delta badge */}
                  {hasDelta && (
                    <div className={`mt-3 inline-flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wide px-2.5 py-1 rounded-lg border ${
                      isUp   ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                      isDown ? 'bg-rose-50 text-rose-700 border-rose-200' :
                               'bg-brand-bg-alt text-brand-text-mute border-brand-line'
                    }`}>
                      {isUp ? '↑ Improved' : isDown ? '↓ Dropped' : '● Maintained'}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Next IA info */}
        {iaStatus!.next_ia && (
          <div className="bg-brand-bg-alt border border-brand-line rounded-xl p-6 text-center">
            <p className="text-brand-text-mute font-medium mb-2">Next Internal Assessment</p>
            <p className="text-2xl font-bold text-brand-text">{iaStatus!.next_ia.date_formatted}</p>
            <p className="text-sm text-brand-text-mute font-medium mt-1">
              {iaStatus!.next_ia.days_away === 1 ? 'Tomorrow' : `In ${iaStatus!.next_ia.days_away} days`}
            </p>
          </div>
        )}
      </div>
    );
  };

  // ── STATE 4: IA day + all conditions met → Start Test ─────────────────────
  const renderGate = () => (
    <div className="max-w-2xl mx-auto animate-fade-in pt-12 px-4">
      <div className="bg-white border border-brand-line rounded-2xl p-8 sm:p-12 text-center shadow-md">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-lg bg-brand-teal-600 text-white font-jetbrains text-xs font-semibold tracking-wider uppercase mb-8 shadow-sm">
          <Zap className="w-4 h-4 fill-amber-400 text-amber-400" /> Internal Assessment #{iaStatus?.current_ia_number ?? ""}
        </div>
        {/* DCS badge */}
        {iaStatus && (
          <div className="flex justify-end -mt-4 mb-2">
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border border-brand-line bg-brand-bg-alt text-xs font-semibold text-brand-text-mute uppercase tracking-wide">
              Avg DCS <span className="text-brand-teal-600">{iaStatus.avg_dcs}%</span>
            </span>
          </div>
        )}
        {/* Target sub-skills preview */}
        {iaStatus?.suggested_subskills && iaStatus.suggested_subskills.length === 2 && (
          <div className="mb-8 bg-brand-teal-50 border border-brand-teal-200 rounded-xl p-4 text-left">
            <p className="text-[10px] font-semibold text-brand-teal-700 uppercase tracking-wider mb-3">Today's Focus Areas</p>
            <div className="grid grid-cols-2 gap-3">
              {iaStatus.suggested_subskills.map((s, i) => {
                const a = accent(s.skill);
                return (
                  <div key={i} className={`flex items-center gap-2 bg-white border ${a.border} rounded-xl px-3 py-2.5 shadow-sm`}>
                    <span className="text-xl">{SKILL_ICON[s.skill] ?? '📝'}</span>
                    <div>
                      <p className="font-semibold text-brand-text text-xs uppercase tracking-wide">{SKILL_LABEL[s.sub_skill] ?? s.sub_skill}</p>
                      <p className={`text-[10px] font-medium ${a.text}`}>{s.skill}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
        
        <h1 className="font-manrope text-4xl sm:text-5xl font-bold text-brand-text tracking-tight mb-6">
          Ready to test your <span className="text-brand-teal-600">Limits?</span>
        </h1>
        
        <p className="text-brand-text-mute leading-relaxed font-medium mb-10 max-w-lg mx-auto">
          This assessment targets your two weakest sub-skills. You will complete two sections back-to-back, each with 10 targeted questions and a strict 20-minute timer.
        </p>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-10">
          {SKILL_ORDER.map((s, i) => {
            const a = accent(s);
            return (
              <div key={s} className={`${a.bg} border ${a.border} rounded-xl p-4 flex flex-col items-center justify-center gap-2`}>
                <span className="text-3xl">{SKILL_ICONS[s]}</span>
                <span className={`text-[10px] font-semibold uppercase tracking-wider ${a.text}`}>Part {i + 1}</span>
              </div>
            );
          })}
        </div>

        {/* Window-closing-soon error banner */}
        {gateError && (
          <div className="mb-4 flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3">
            <span className="text-amber-500 text-lg flex-shrink-0">⚠️</span>
            <div>
              <p className="font-semibold text-amber-800 text-sm uppercase tracking-wide mb-0.5">Window Closing Soon</p>
              <p className="text-amber-700 text-xs font-medium leading-relaxed">{gateError}</p>
            </div>
          </div>
        )}

        <div className="flex flex-col sm:flex-row gap-4">
          <button onClick={() => navigate(-1)} className="px-6 py-4 rounded-xl border border-brand-line font-medium text-brand-text-mute hover:bg-brand-bg-alt transition-colors uppercase tracking-wide">
            Cancel
          </button>
          <button
            onClick={() => { setGateError(null); void beginFullTest(); }}
            disabled={isLoadingQuestions}
            className="flex-1 bg-brand-teal-600 hover:bg-brand-teal-700 disabled:opacity-60 text-white border-none font-semibold text-base uppercase tracking-wide rounded-xl transition-all shadow-sm hover:shadow-md flex items-center justify-center gap-2"
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
        <div className="max-w-lg w-full bg-white border border-brand-line rounded-2xl p-10 text-center shadow-md">
          <div className="w-20 h-20 bg-emerald-50 border border-emerald-200 rounded-full flex items-center justify-center text-4xl mx-auto mb-6">
            <CheckCircle2 className="w-10 h-10 text-emerald-600" />
          </div>
          <h2 className="font-manrope text-3xl font-bold text-brand-text tracking-tight mb-2">
            Section {currentSectionIdx + 1} Complete
          </h2>
          <p className="text-brand-text-mute font-medium mb-10">
            Great work on {SKILL_LABEL[doneSec?.sub_skill ?? ''] ?? doneSec?.sub_skill}. Take a breath — the next section has its own 20-minute timer.
          </p>
          {nextSec && (
            <div className={`${accent(nextSec.skill).bg} border ${accent(nextSec.skill).border} rounded-xl p-6 mb-8 text-left shadow-sm`}>
              <p className={`text-xs font-semibold uppercase tracking-wider mb-1 ${accent(nextSec.skill).text}`}>Up Next</p>
              <div className="flex items-center gap-3">
                <span className="text-3xl">{SKILL_ICON[nextSec.skill] ?? '📝'}</span>
                <div>
                  <h3 className="font-manrope text-xl font-semibold text-brand-text uppercase tracking-wide">{SKILL_LABEL[nextSec.sub_skill] ?? nextSec.sub_skill}</h3>
                  <p className="text-sm text-brand-text-mute">{nextSec.questions.length} questions</p>
                </div>
              </div>
            </div>
          )}
          <button onClick={advanceToNextSection} className="w-full bg-brand-teal-600 hover:bg-brand-teal-700 text-white border-none font-semibold text-lg py-4 rounded-xl transition-all shadow-sm hover:shadow-md">
            Continue to Section {currentSectionIdx + 2} <ArrowRight className="w-5 h-5 inline ml-1" />
          </button>
        </div>
      </div>
    );
  };

  const renderScoring = () => (
    <div className="flex flex-col items-center justify-center min-h-[70vh] animate-fade-in">
      <div className="relative mb-8">
        <div className="w-24 h-24 rounded-full border-[6px] border-brand-line border-t-brand-teal-600 animate-spin" />
        <span className="absolute inset-0 flex items-center justify-center text-4xl">🧠</span>
      </div>
      <h2 className="font-manrope text-3xl font-bold text-brand-text tracking-tight mb-3">Scoring Your Assessment</h2>
      <p className="text-brand-text-mute font-medium text-lg">Calculating your band scores and updating your competency matrix.</p>
    </div>
  );

  const renderResults = () => {
    const momentumEarned   = sessionMomentumAward || iaResults?.momentum_awarded || 0;
    const breakdown: Array<{ reason: string; points: number }> = iaResults?.momentum_breakdown ?? [];
    const isFirstIA        = iaResults?.is_first_ia ?? false;
    const comparisonLabel  = isFirstIA ? 'vs Diagnostic' : 'vs Current Band';

    type ScoreRow = {
      sub_skill: string; skill: string; band: number;
      correct?: number; total?: number; ai_graded?: boolean;
      previous_band?: number | null; delta?: number | null;
      new_matrix_band?: number;
      ai_feedback?: { rationale: string; key_observations: string[] };
    };
    const sectionScores: ScoreRow[] =
      iaResults?.section_scores ?? iaSections?.map(s => ({ sub_skill: s.sub_skill, skill: s.skill, band: 0 })) ?? [];

    return (
      <div className="max-w-3xl mx-auto animate-fade-in pt-8 pb-24 px-4">

        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <h2 className="font-manrope text-3xl font-bold text-brand-text tracking-tight">IA Complete</h2>
          <button
            onClick={() => { localStorage.removeItem(STORAGE_KEY); navigate('/student/dashboard', { state: { drillCompleted: true } }); }}
            className="px-6 py-3 bg-brand-teal-600 text-white border-none rounded-xl font-semibold text-sm uppercase tracking-wide hover:bg-brand-teal-700 shadow-sm hover:shadow-md transition-all">
            Dashboard
          </button>
        </div>

        {/* Momentum banner */}
        <div className="bg-brand-teal-600 rounded-2xl p-8 mb-6 text-center shadow-md relative overflow-hidden">
          <div className="absolute -top-8 -right-8 text-[140px] opacity-10 pointer-events-none select-none">⚡</div>
          <p className="font-jetbrains text-brand-teal-200 font-semibold uppercase tracking-wider mb-1">Momentum Earned</p>
          <div className="text-7xl font-bold text-white">+{momentumEarned}</div>
          <div className="mt-4 inline-flex items-center gap-2 bg-white text-brand-teal-900 px-5 py-2 rounded-lg font-semibold uppercase shadow-sm">
            <CheckCircle2 className="w-5 h-5 text-emerald-500" /> Assessment Submitted
          </div>
          {/* Breakdown pills */}
          {breakdown.length > 0 && (
            <div className="flex flex-wrap justify-center gap-2 mt-5">
              {breakdown.map((b, i) => (
                <span key={i} className="bg-brand-teal-500 text-brand-teal-100 text-[10px] font-semibold uppercase tracking-wider px-3 py-1 rounded-full border border-brand-teal-400">
                  +{b.points} {b.reason}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Per sub-skill score cards */}
        {sectionScores.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 mb-6">
            {sectionScores.map((s, i) => {
              const hasDelta  = s.delta !== null && s.delta !== undefined;
              const isUp      = hasDelta && s.delta! > 0;
              const isDown    = hasDelta && s.delta! < 0;
              const deltaText = hasDelta
                ? (isUp ? `+${s.delta!.toFixed(1)}` : isDown ? s.delta!.toFixed(1) : '±0.0')
                : null;

              // Competency band impact
              const hasMatrix   = s.new_matrix_band !== undefined && s.new_matrix_band !== null;
              const prevMatrix  = s.previous_band ?? null;
              const matrixDelta = hasMatrix && prevMatrix !== null
                ? Math.round((s.new_matrix_band! - prevMatrix) * 10) / 10
                : null;
              const matrixUp   = matrixDelta !== null && matrixDelta > 0;
              const matrixDown = matrixDelta !== null && matrixDelta < 0;
              const smoothingVisible = hasMatrix && Math.abs(s.new_matrix_band! - s.band) >= 0.5;
              const a = accent(s.skill);

              return (
                <div key={i} className="bg-white border border-brand-line rounded-2xl p-6 shadow-sm">

                  {/* Sub-skill header */}
                  <div className="flex items-center gap-3 mb-4">
                    <span className={`w-10 h-10 rounded-lg ${a.bg} border ${a.border} flex items-center justify-center text-2xl`}>{SKILL_ICON[s.skill] ?? '📝'}</span>
                    <div>
                      <p className="font-semibold text-brand-text text-sm uppercase tracking-wide">{SKILL_LABEL[s.sub_skill] ?? s.sub_skill}</p>
                      <p className="text-brand-text-mute text-[10px] font-medium uppercase">{s.skill}{s.ai_graded ? ' · AI Graded' : ''}</p>
                    </div>
                  </div>

                  {/* ── IA Score (this session) ── */}
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-brand-text-mute mb-0.5">IA Score</p>
                  <div className="flex items-end gap-4 mb-3">
                    <span className="text-5xl font-bold text-brand-text leading-none">
                      {s.band > 0 ? s.band.toFixed(1) : '—'}
                    </span>
                    {hasDelta && (
                      <div className="mb-1">
                        <span className={`text-lg font-bold ${isUp ? 'text-emerald-600' : isDown ? 'text-rose-600' : 'text-brand-text-mute'}`}>
                          {deltaText}
                        </span>
                        <p className="text-[10px] text-brand-text-mute font-medium uppercase">{comparisonLabel}</p>
                      </div>
                    )}
                  </div>

                  {/* MCQ correct count */}
                  {s.correct != null && s.total != null && s.total > 0 && (
                    <p className="text-xs text-brand-text-mute font-medium mb-3">{s.correct} / {s.total} MCQ correct</p>
                  )}

                  {/* ── AI Feedback (Writing/Speaking prompts only) ── */}
                  {s.ai_graded && s.ai_feedback?.rationale && (
                    <div className="border-t border-brand-line pt-3 mb-3">
                      <p className="text-[10px] font-semibold uppercase tracking-wider text-brand-text-mute mb-1.5">AI Feedback</p>
                      <p className="text-xs text-brand-text-mute font-medium leading-relaxed">
                        &ldquo;{s.ai_feedback.rationale}&rdquo;
                      </p>

                      {/* Key Observations toggle button */}
                      {(s.ai_feedback.key_observations?.length ?? 0) > 0 && (
                        <div className="mt-2 relative">
                          <button
                            onClick={() => setExpandedFeedbackIdx(prev => prev === i ? null : i)}
                            className={`inline-flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider px-2.5 py-1.5 rounded-lg border transition-all ${
                              expandedFeedbackIdx === i
                                ? 'bg-brand-teal-600 text-white border-brand-teal-600'
                                : 'bg-white text-brand-teal-600 border-brand-teal-200 hover:bg-brand-teal-50'
                            }`}
                          >
                            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                            </svg>
                            {expandedFeedbackIdx === i ? 'Hide Observations' : 'Key Observations'}
                            <span className={`transition-transform duration-200 ${expandedFeedbackIdx === i ? 'rotate-180' : ''}`}>
                              ▾
                            </span>
                          </button>

                          {/* Popover panel — appears inline below the button */}
                          {expandedFeedbackIdx === i && (
                            <div className="mt-2 bg-white border border-brand-teal-200 rounded-xl shadow-sm overflow-hidden">
                              {/* Panel header */}
                              <div className="flex items-center justify-between px-4 py-2.5 bg-brand-teal-50 border-b border-brand-teal-100">
                                <div className="flex items-center gap-2">
                                  <div className="w-1.5 h-4 bg-brand-teal-600 rounded-full" />
                                  <p className="text-[10px] font-semibold uppercase tracking-wider text-brand-teal-700">
                                    Key Observations
                                  </p>
                                </div>
                                <button
                                  onClick={() => setExpandedFeedbackIdx(null)}
                                  className="w-5 h-5 flex items-center justify-center rounded-full hover:bg-brand-teal-100 text-brand-teal-500 transition-colors text-xs font-semibold"
                                >
                                  ✕
                                </button>
                              </div>
                              {/* Observations list */}
                              <ul className="px-4 py-3 flex flex-col gap-2.5">
                                {s.ai_feedback.key_observations.map((obs, j) => (
                                  <li key={j} className="flex items-start gap-2.5">
                                    <span className="mt-1 w-1.5 h-1.5 rounded-full bg-brand-teal-500 flex-shrink-0" />
                                    <span className="text-xs text-brand-text-mute font-medium leading-relaxed">{obs}</span>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}

                  {/* ── Competency Band Impact ── */}
                  {hasMatrix && (
                    <div className="border-t border-brand-line pt-3">
                      <p className="text-[10px] font-semibold uppercase tracking-wider text-brand-text-mute mb-1.5">Competency Band</p>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-brand-text-mute">
                          {prevMatrix !== null ? prevMatrix.toFixed(1) : '—'}
                        </span>
                        <span className="text-brand-text-mute text-xs">→</span>
                        <span className={`text-xl font-bold ${matrixUp ? 'text-emerald-600' : matrixDown ? 'text-rose-600' : 'text-brand-text-mute'}`}>
                          {s.new_matrix_band!.toFixed(1)}
                        </span>
                        {matrixDelta !== null && (
                          <span className={`text-xs font-semibold ml-0.5 ${matrixUp ? 'text-emerald-600' : matrixDown ? 'text-rose-600' : 'text-brand-text-mute'}`}>
                            {matrixUp ? `+${matrixDelta.toFixed(1)}` : matrixDelta.toFixed(1)}
                          </span>
                        )}
                      </div>
                      {smoothingVisible && (
                        <p className="text-[10px] text-brand-text-mute font-medium mt-1">
                          Builds gradually — averaged over sessions
                        </p>
                      )}
                    </div>
                  )}

                  {/* Delta badge */}
                  {hasDelta && (
                    <div className={`mt-3 inline-flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wide px-2.5 py-1 rounded-lg border ${
                      isUp   ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                      isDown ? 'bg-rose-50 text-rose-700 border-rose-200' :
                               'bg-brand-bg-alt text-brand-text-mute border-brand-line'
                    }`}>
                      {isUp ? '↑ Improved' : isDown ? '↓ Dropped' : '● Maintained'}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        <p className="text-center text-brand-text-mute font-medium text-sm">
          Scores updated in your competency matrix. Continue drilling to build on this result.
        </p>
      </div>
    );
  };

  const renderSession = () => {
    if (isLoadingQuestions || !currentSection) {
      return (
        <div className="min-h-[70vh] flex flex-col items-center justify-center animate-fade-in">
          <Loader2 className="w-12 h-12 text-brand-teal-600 animate-spin mb-4" />
          <p className="text-brand-text-mute font-semibold uppercase tracking-wider text-sm">Loading Questions…</p>
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
          {iaSections?.map((sec, i) => {
            const a = accent(sec.skill);
            const done = i < currentSectionIdx;
            const active = i === currentSectionIdx;
            return (
              <div key={i} className="flex items-center gap-3">
                <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border font-semibold text-xs uppercase tracking-wider ${
                  done ? 'bg-emerald-50 border-emerald-200 text-emerald-700' :
                  active ? `${a.bg} ${a.border} ${a.text}` :
                  'bg-white border-brand-line text-brand-text-mute'
                }`}>
                  {done ? <CheckCircle2 className="w-4 h-4" /> : <span>{SKILL_ICON[sec.skill] ?? '📝'}</span>}
                  <span className="hidden sm:inline">{SKILL_LABEL[sec.sub_skill] ?? sec.sub_skill}</span>
                </div>
                {i < (iaSections?.length ?? 1) - 1 && <div className={`w-6 h-1 rounded-full ${done ? 'bg-emerald-300' : 'bg-brand-line'}`} />}
              </div>
            );
          })}
        </div>

        {/* Header: section info + global timer */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between bg-white border border-brand-line rounded-2xl p-4 sm:p-6 mb-6 gap-4 shadow-sm">
          <div className="flex items-center gap-4">
            <div className={`w-14 h-14 ${accent(currentSection.skill).bg} border ${accent(currentSection.skill).border} rounded-xl flex items-center justify-center text-3xl`}>
              {SKILL_ICON[currentSection.skill] ?? '📝'}
            </div>
            <div>
              <p className="text-brand-text font-semibold text-lg uppercase tracking-wide">{SKILL_LABEL[currentSection.sub_skill] ?? currentSection.sub_skill}</p>
              <p className="font-jetbrains text-brand-text-mute text-xs font-medium uppercase tracking-wider mt-1">Question {currentIdx + 1} of {totalQ}</p>
            </div>
          </div>
          <div className="flex items-center self-end sm:self-auto bg-brand-bg-alt border border-brand-line px-4 py-2 rounded-xl">
            <CircleTimer timeLeft={timeLeft} total={20 * 60} size={48} />
            <div className="ml-3">
              <p className="font-jetbrains text-[10px] font-semibold text-brand-text-mute uppercase tracking-wider">Total Time Left</p>
              <p className="text-lg font-semibold text-brand-text leading-none">{formatTime(timeLeft)}</p>
            </div>
          </div>
        </div>

        {/* Split view: left context panel + right question panel */}
        <div className="flex flex-col lg:flex-row gap-6">

          {/* LEFT: Audio player (LISTENING) or Reading Passage (READING) or nothing */}
          <div className="w-full lg:w-1/2 flex flex-col gap-4">
            {currentSection.section_type === 'AUDIO' && currentSection.audio_url ? (
              <div className="bg-brand-teal-50 border border-brand-teal-200 rounded-2xl p-8 text-center flex flex-col items-center shadow-sm">
                <button
                  onClick={() => { 
                    if (audioState === 'idle' && audioRef.current) { 
                      audioRef.current.play(); 
                      setAudioState('playing'); 
                    } 
                  }}
                  disabled={audioState !== 'idle'}
                  className={`w-24 h-24 rounded-full flex items-center justify-center text-white mb-6 transition-colors shadow-md ${
                    audioState === 'idle' ? 'bg-brand-teal-600 hover:bg-brand-teal-700' : audioState === 'playing' ? 'bg-amber-500' : 'bg-emerald-500'
                  }`}
                >
                  {audioState === 'idle' && <PlayCircle className="w-12 h-12 ml-1" />}
                  {audioState === 'playing' && <div className="flex items-center gap-1.5 h-10">{animBars.slice(0,4).map((h,i) => <div key={i} className="w-2 bg-white rounded-full animate-pulse" style={{ height: `${20 + h*40}px`, animationDelay: `${i*0.15}s` }} />)}</div>}
                  {audioState === 'played' && <CheckCircle2 className="w-12 h-12" />}
                </button>
                <p className="text-brand-text font-semibold text-lg uppercase tracking-wide mb-2">Listening Audio</p>
                <p className="text-brand-text-mute font-medium text-sm">{audioState === 'played' ? 'Playback complete — answer the questions.' : 'Listen carefully. The audio plays once.'}</p>
                <audio 
                  ref={audioRef} 
                  src={currentSection.audio_url} 
                  preload="auto" 
                  onEnded={() => setAudioState('played')}
                />
              </div>
            ) : currentSection.section_type === 'PASSAGE' && currentSection.passage_text ? (
              <div className="bg-white border border-brand-line rounded-2xl flex flex-col max-h-[700px] shadow-sm">
                <div className="p-4 border-b border-brand-line bg-brand-bg-alt flex items-center justify-between rounded-t-2xl">
                  <span className="font-semibold text-sm uppercase tracking-wider text-brand-text-mute">Reading Passage</span>
                  <button onClick={() => setShowPassage(!showPassage)} className="lg:hidden font-semibold text-xs text-brand-blue-600 uppercase">{showPassage ? 'Hide' : 'Show'}</button>
                </div>
                <div className={`p-6 overflow-y-auto flex-1 ${!showPassage ? 'hidden lg:block' : 'block'}`}>
                  <p className="font-serif text-brand-text text-base leading-loose whitespace-pre-wrap">{currentSection.passage_text}</p>
                </div>
              </div>
            ) : (
              /* No left panel for pure MCQ/WRITING/SPEAKING — show a focus card */
              <div className={`${accent(currentSection.skill).bg} border ${accent(currentSection.skill).border} rounded-2xl p-6 hidden lg:flex flex-col items-center justify-center text-center gap-4`}>
                <span className="text-6xl">{SKILL_ICON[currentSection.skill] ?? '📝'}</span>
                <p className="font-semibold text-brand-text uppercase tracking-wide">{SKILL_LABEL[currentSection.sub_skill] ?? currentSection.sub_skill}</p>
                <p className="text-brand-text-mute text-sm font-medium">Section {currentSectionIdx + 1} of {iaSections?.length}</p>
                <div className="text-xs font-semibold text-brand-text-mute uppercase tracking-wider mt-4">{currentIdx + 1} / {totalQ} questions answered</div>
              </div>
            )}
          </div>

          {/* RIGHT: Question + input */}
          <div className="w-full lg:w-1/2 flex flex-col gap-4">
            <div className="bg-white border border-brand-line rounded-2xl p-6 sm:p-8 shadow-sm">

              <div className="flex justify-between items-center mb-6">
                <span className="bg-brand-bg-alt text-brand-text-mute text-xs font-semibold uppercase tracking-wider px-4 py-1.5 rounded-lg border border-brand-line">
                  Q {currentIdx + 1} / {totalQ}
                </span>
                <span className="bg-brand-teal-50 text-brand-teal-700 border border-brand-teal-200 text-[10px] font-semibold uppercase tracking-wider px-3 py-1.5 rounded-lg">
                  {currentQ.question_type.replace('_', ' ')}
                </span>
              </div>

              <h3 className="font-manrope text-xl font-semibold text-brand-text mb-8 leading-snug">
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
                        className={`text-left p-4 rounded-xl border font-medium text-sm transition-all flex items-start gap-3 ${selected ? 'bg-brand-teal-600 border-brand-teal-600 text-white shadow-sm' : 'bg-white border-brand-line text-brand-text-mute hover:border-brand-teal-300 hover:bg-brand-bg-alt'}`}>
                        <span className={`w-6 h-6 flex-shrink-0 rounded-lg border flex items-center justify-center font-semibold text-xs ${selected ? 'border-white text-white' : 'border-brand-line text-brand-text-mute'}`}>{key}</span>
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
                    const color = val === 'TRUE' ? 'bg-emerald-500' : val === 'FALSE' ? 'bg-rose-500' : 'bg-amber-500';
                    return (
                      <button key={val}
                        onClick={() => setAnswers(p => ({ ...p, [currentQ.id]: val }))}
                        className={`p-4 rounded-xl border font-semibold text-sm uppercase tracking-wide transition-all ${
                          selected
                            ? `${color} border-transparent text-white shadow-sm`
                            : `bg-white border-brand-line text-brand-text-mute hover:border-brand-line hover:bg-brand-bg-alt`
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
                    // --- NEW LINES START HERE ---
                    onPaste={(e) => e.preventDefault()}
                    onCopy={(e) => e.preventDefault()}
                    onCut={(e) => e.preventDefault()}
                    onDrop={(e) => e.preventDefault()}
                    // --- NEW LINES END HERE ---
                    className="w-full p-5 border border-brand-line rounded-xl text-base text-brand-text font-medium outline-none focus:ring-2 focus:ring-brand-teal-200 focus:border-brand-teal-300 bg-brand-bg-alt resize-none transition-all"
                  />
                  <div className="flex justify-between items-center mt-2">
                    <p className="text-xs text-brand-text-mute font-medium">
                      {(answers[currentQ.id] ?? '').trim().split(/\s+/).filter(Boolean).length} words
                    </p>
                    <p className="text-[10px] text-brand-text-mute font-medium">Auto-saved</p>
                  </div>
                </div>
              )}

              {/* ── SPEAKING_PROMPT ── */}
              {currentQ.question_type === 'SPEAKING_PROMPT' && (() => {
                const hasTranscript = !!(answers[currentQ.id]?.trim());
                return (
                  <div className="bg-brand-bg-alt border border-brand-line rounded-2xl p-6">
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
                          <div className="w-full bg-white border border-brand-line rounded-xl p-3 text-sm text-brand-text-mute font-medium italic min-h-[56px] max-h-[120px] overflow-y-auto leading-relaxed">
                            "{liveTranscript}"
                          </div>
                        ) : (
                          <p className="text-xs text-brand-text-mute font-medium">Speak clearly — transcript appears here</p>
                        )}
                        <button onClick={() => stopSpeakingRecording(currentQ.id)}
                          className="bg-rose-500 hover:bg-rose-600 text-white font-semibold text-sm px-8 py-3 rounded-xl uppercase tracking-wide shadow-sm hover:shadow-md transition-all">
                          Stop &amp; Save
                        </button>
                      </div>
                    ) : hasTranscript ? (
                      /* ── Has saved transcript ── */
                      <div className="flex flex-col gap-3">
                        <div className="flex items-center gap-2">
                          <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                          <span className="text-xs font-semibold uppercase tracking-wider text-emerald-700">Response Saved</span>
                        </div>
                        <div className="bg-white border border-emerald-200 rounded-xl p-4 text-sm text-brand-text-mute font-medium italic max-h-[120px] overflow-y-auto leading-relaxed">
                          "{answers[currentQ.id]}"
                        </div>
                        <button onClick={() => startSpeakingRecording(currentQ.id)}
                          className="text-sm font-semibold uppercase tracking-wide px-6 py-3 rounded-xl border border-brand-line bg-white text-brand-text-mute hover:bg-brand-bg-alt self-start shadow-sm transition-colors">
                          Re-record Answer
                        </button>
                      </div>
                    ) : (
                      /* ── Not yet recorded ── */
                      <div className="flex flex-col items-center gap-4 text-center">
                        <div className="w-16 h-16 rounded-full bg-rose-50 border border-rose-200 flex items-center justify-center">
                          <Mic className="w-8 h-8 text-rose-500" />
                        </div>
                        <p className="text-sm text-brand-text-mute font-medium max-w-xs">
                          Tap the button and speak your answer. Your response will be transcribed automatically.
                        </p>
                        <button onClick={() => startSpeakingRecording(currentQ.id)}
                          className="bg-brand-teal-600 hover:bg-brand-teal-700 text-white border-none font-semibold text-sm uppercase tracking-wide px-8 py-4 rounded-xl shadow-sm hover:shadow-md transition-all">
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
                  className="px-6 py-4 border border-brand-line rounded-xl font-semibold text-brand-text-mute disabled:opacity-30 disabled:pointer-events-none hover:bg-brand-bg-alt uppercase text-sm tracking-wide transition-colors">
                  Prev
                </button>
                <button
                  onClick={handleNextQuestion}
                  disabled={!canProceed || (currentQ.question_type === 'SPEAKING_PROMPT' && isRecording)}
                  className={`flex-1 font-semibold text-sm uppercase tracking-wide border-none rounded-xl py-4 transition-all ${!canProceed ? 'bg-brand-bg-alt text-brand-text-mute opacity-60 cursor-not-allowed' : 'bg-brand-teal-600 text-white hover:bg-brand-teal-700 shadow-sm hover:shadow-md'}`}>
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
    <div className="min-h-screen bg-brand-bg font-sans text-brand-text selection:bg-brand-teal-200">
      <TopNavBar hideMomentum={phase === 'session'} totalMomentum={totalMomentum} />
      <div className="fixed inset-0 pointer-events-none z-0" style={{ backgroundImage: 'radial-gradient(circle, #e2e8f0 1px, transparent 1px)', backgroundSize: '24px 24px', opacity: 0.4 }} />
      
      <div className="relative z-10 pt-16">
        {phase === "gate" && (() => {
          if (!iaStatus?.has_schedule || !iaStatus?.prerequisites_met) return renderNotEligible();
          if (!iaStatus.is_ia_day)                                       return renderScheduled();
          if (iaStatus.has_completed_session && iaStatus.completed_session_scores) return renderCompletedToday();
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
      `}</style>
    </div>
  );
}