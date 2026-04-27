import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { StudentSidebar } from './dashboard/StudentSidebar';
import { StudentTopbar } from './dashboard/StudentTopbar';
import { useMomentum } from "@/features/student/Context/MomentumContext";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { callBackend } from "@/features/auth/services/authClient";
import { cn } from "@/shared/utils";
import {
  Target, CheckCircle2, Clock, AlertTriangle, ArrowRight, ArrowLeft,
  ShieldAlert, Zap, Lock, Trophy, RotateCcw, BookOpen,
} from "lucide-react";

// ─────────────────────────────────────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────────────────────────────────────

type IAPhase =
  | 'checking'        // reading localStorage on mount
  | 'not_eligible'    // < 6 total drills or < 2 calendar days
  | 'eligible_waiting'// 6 drills done, 24hr wait before window opens
  | 'window_open'     // student can take the IA now
  | 'in_progress'     // IA session active
  | 'resume'          // student exited mid-test, 18min resume window active
  | 'completed'       // IA done, result visible
  | 'missed'          // 24hr window expired without taking IA
  | 'all_done';       // 6 IAs completed → mock test unlocked

interface IAQuestion {
  id: string;
  text: string;
  type: 'mcq' | 'short_answer';
  options?: string[];
  subSkill: string;
}

interface IAInProgress {
  answers:         Record<string, string>;
  currentQuestion: number;
  exitedAt:        string; // ISO
  resumeDeadline:  string; // ISO — exitedAt + 18 min
}

interface IAWindowResult {
  score:       number; // 0–100
  band:        number; // IELTS band 0–9
  completedAt: string; // ISO
}

interface IAWindow {
  notifiedAt:    string; // ISO — when eligibility was first detected
  windowOpensAt: string; // ISO — notifiedAt + 24h
  windowExpiresAt: string; // ISO — windowOpensAt + 24h
  status: 'waiting' | 'open' | 'in_progress' | 'completed' | 'missed';
  iaNumber:      number;
  targetSkill:   string;
  targetSubSkill: string;
  inProgress:    IAInProgress | null;
  result:        IAWindowResult | null;
}

interface IATracker {
  totalCompleted:    number; // 0–6
  consecutiveMisses: number; // resets on completion
  lastCompletedDate: string | null;
  currentWindow:     IAWindow | null;
}

// ─────────────────────────────────────────────────────────────────────────────
// CONSTANTS
// ─────────────────────────────────────────────────────────────────────────────

const IA_QUESTIONS_TOTAL   = 10;
const IA_TIMER_SECONDS     = 20 * 60; // 20 minutes
const RESUME_TIMER_SECONDS = 18 * 60; // 18 minutes
const WAIT_HOURS           = 24;
const WINDOW_HOURS         = 24;
const MISS_PENALTY         = 20;     // Momentum deducted on miss
const IA_COMPLETE_POINTS   = 100;    // Base Momentum on completion
const IA_IMPROVE_BONUS     = 25;     // Bonus if band improved

// ─────────────────────────────────────────────────────────────────────────────
// MOCK QUESTION BANK
// TODO (Sarthak): Replace getMockQuestions() with a real API call:
//   GET /api/student/ia-questions?skill={skill}&sub_skill={subSkill}&count=10
//   Returns: IAQuestion[]
// The component will work identically — just swap the data source.
// ─────────────────────────────────────────────────────────────────────────────

const QUESTION_BANK: Record<string, string[]> = {
  Grammar: [
    'Identify and correct the error: "She don\'t know the answer."',
    'Choose the correct form: "Each of the students ___ responsible for their own work." (is / are)',
    'Rewrite using passive voice: "The committee reviewed the proposal."',
    'Choose the correct conjunction: "She studied hard ___ she failed the exam." (although / because)',
    'What is the correct article? "___ university she attends is well-known." (A / An / The)',
    'Identify the grammatical error: "He is more smarter than his brother."',
    'Choose the correct tense: "By the time she arrived, he ___ (left / had left)."',
    'Correct the subject-verb agreement: "The team of scientists are working on the project."',
    'Insert the correct preposition: "She has been waiting ___ three hours."',
    'Rewrite correctly: "Neither the teacher nor the students was present."',
  ],
  Vocabulary: [
    'Choose the synonym for "meticulous": (careful / careless / hasty / bold)',
    'Use the word "inevitable" correctly in a sentence.',
    'What does "pragmatic" mean? Provide an example.',
    'Choose the antonym of "benevolent": (generous / cruel / kind / helpful)',
    'Fill in the blank: "The scientist made a ___ discovery that changed everything." (trivial / momentous / minor)',
    'Define "ambiguous" and use it in context.',
    'Which word best completes: "The politician\'s speech was full of ___." (rhetoric / silence / logic / clarity)',
    'Explain the difference between "affect" and "effect".',
    'Choose the correct collocation: "make / do a decision"',
    'Use "concede" in a sentence that demonstrates its meaning.',
  ],
  Pronunciation: [
    'Which syllable is stressed in "INTEResting" vs "interESTing"?',
    'Write how you would pronounce the word "colonel" phonetically.',
    'Which vowel sound is different: "bread / head / bead / dead"?',
    'Identify the silent letter in: "knight / knob / know / kneel"',
    'Which word has a different final consonant sound: "dogs / cats / beds / laws"?',
    'Write the phonetic transcription for the word "through".',
    'Identify the stressed word: "I NEVER said she stole the money" — what changes with stress?',
    'Which suffix changes the stress: "PHOtograph / phoTOgraphy / photoGRAPHic"?',
    'Provide the pronunciation rule for adding "-ed" to regular verbs.',
    'Minimal pair: What is the difference between /p/ and /b/ in English?',
  ],
  Fluency: [
    'Speak for 30 seconds on: "Describe a daily routine you follow."',
    'Without pausing, complete: "The main advantage of technology is..."',
    'Respond naturally: "What would you do if you won a large sum of money?"',
    'Use 3 discourse markers in a short explanation of why you chose your career path.',
    'Describe the process of making tea — use sequence words.',
    'Respond to: "Some people think social media is harmful. What is your view?"',
    'Without repetition, give three reasons why travel is educational.',
    'Explain a complex process you know well in simple terms.',
    'Give your opinion on: "Cities are better places to live than the countryside."',
    'Summarise a book or film you have seen recently in 60 seconds.',
  ],
  Coherence: [
    'Arrange the sentences in logical order to form a coherent paragraph.',
    'Add an appropriate topic sentence to the paragraph provided.',
    'Choose the best linking word: "The results were positive; ___, further testing is needed." (however / therefore / moreover)',
    'Write a concluding sentence that summarises without repeating.',
    'Identify the sentence that does not belong in the paragraph.',
    'Add a transition sentence between these two paragraphs.',
    'Rewrite the paragraph to improve cohesion using pronouns and synonyms.',
    'Which discourse marker fits best: "on the one hand ... ___ the other hand"?',
    'Write a topic sentence for a paragraph about the benefits of exercise.',
    'Correct the paragraph so ideas flow logically from general to specific.',
  ],
};

const getMockQuestions = (subSkill: string, skill: string): IAQuestion[] => {
  const bank = QUESTION_BANK[subSkill] || QUESTION_BANK['Grammar'];
  return bank.map((text, i) => ({
    id:       `ia_${i + 1}`,
    text,
    subSkill,
    type:     i % 3 === 0 ? 'mcq' : 'short_answer',
    options:  i % 3 === 0 ? ['A. First option', 'B. Second option', 'C. Third option', 'D. Fourth option'] : undefined,
  }));
};

// ─────────────────────────────────────────────────────────────────────────────
// MOCK SCORING
// TODO (Sarthak): Replace scoreMockIA() with real API call:
//   POST /api/student/ia-submit
//   Body: { answers, subSkill, skill, iaNumber }
//   Returns: { score: number, band: number, previousBand: number }
// ─────────────────────────────────────────────────────────────────────────────

const scoreMockIA = (
  answers: Record<string, string>,
  previousBand: number
): IAWindowResult => {
  const answered    = Object.values(answers).filter(a => a.trim().length > 0).length;
  const completion  = answered / IA_QUESTIONS_TOTAL;
  const mockBand    = Math.min(9, previousBand + (completion * 0.5));
  const roundedBand = Math.round(mockBand * 2) / 2;
  return {
    score:       Math.round(completion * 100),
    band:        roundedBand,
    completedAt: new Date().toISOString(),
  };
};

// ─────────────────────────────────────────────────────────────────────────────
// MOCK TUTOR ALERT
// TODO (Sarthak): Replace with real endpoint — same pattern as existing tutor alert
// ─────────────────────────────────────────────────────────────────────────────

const fireTutorAlertIA = async (
  displayName: string,
  email: string | undefined,
  level: 1 | 2,
  iaData: { consecutiveMisses?: number; totalCompleted?: number; subSkill?: string }
) => {
  try {
    const backendUrl = import.meta.env.VITE_BACKEND_URL || "http://localhost:4000";
    await callBackend(`${backendUrl}/api/student/ia-tutor-alert`, {
      method: "POST",
      body: JSON.stringify({
        student_name:       displayName,
        student_email:      email,
        alert_level:        level,
        consecutive_misses: iaData.consecutiveMisses,
        total_completed:    iaData.totalCompleted,
        missed_sub_skill:   iaData.subSkill,
        timestamp:          new Date().toISOString(),
      }),
    });
  } catch (err) {
    // Non-blocking — backend alert failure should not break the student experience
    console.error('[IA TutorAlert] Failed:', err);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// LOCALSTORAGE HELPERS
// ─────────────────────────────────────────────────────────────────────────────

const LS_IA_TRACKER  = 'ia_tracker';
const LS_TOTAL_DRILLS = 'total_drill_sessions';

const readIATracker = (): IATracker => {
  try {
    const stored = localStorage.getItem(LS_IA_TRACKER);
    if (stored) return JSON.parse(stored);
  } catch { /* ignore */ }
  return { totalCompleted: 0, consecutiveMisses: 0, lastCompletedDate: null, currentWindow: null };
};

const writeIATracker = (tracker: IATracker) => {
  localStorage.setItem(LS_IA_TRACKER, JSON.stringify(tracker));
  window.dispatchEvent(new Event('storage'));
};

const readTotalDrills = (): { count: number; firstSessionDate: string | null } => {
  try {
    const stored = localStorage.getItem(LS_TOTAL_DRILLS);
    if (stored) {
      const parsed = JSON.parse(stored);
      return { count: parsed.count || 0, firstSessionDate: parsed.firstSessionDate || null };
    }
  } catch { /* ignore */ }
  return { count: 0, firstSessionDate: null };
};

const daysDiff = (dateStr: string): number => {
  const first = new Date(dateStr);
  const now   = new Date();
  first.setHours(0, 0, 0, 0);
  now.setHours(0, 0, 0, 0);
  return Math.floor((now.getTime() - first.getTime()) / 86400000);
};

const hoursUntil = (isoString: string): number => {
  return Math.max(0, (new Date(isoString).getTime() - Date.now()) / 3600000);
};

const minutesUntil = (isoString: string): number => {
  return Math.max(0, (new Date(isoString).getTime() - Date.now()) / 60000);
};

const addHours = (iso: string, hours: number): string =>
  new Date(new Date(iso).getTime() + hours * 3600000).toISOString();

const addMinutes = (iso: string, minutes: number): string =>
  new Date(new Date(iso).getTime() + minutes * 60000).toISOString();

// ─────────────────────────────────────────────────────────────────────────────
// UTILS
// ─────────────────────────────────────────────────────────────────────────────

const formatCountdown = (seconds: number): string => {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0) return `${h}h ${m}m`;
  return `${m}:${String(s).padStart(2, '0')}`;
};

// Read the target sub-skill from what the student has been drilling
// TODO (Sarthak): Replace with real API call to get weakest sub-skill from DCS scores
const getTargetSubSkill = (): { skill: string; subSkill: string } => {
  try {
    const stored = localStorage.getItem('completed_drills_today');
    if (stored) {
      const parsed = JSON.parse(stored);
      // Most recently drilled sub-skill (last in completed array)
      const lastSubSkill = (parsed.completed || []).slice(-1)[0];
      if (lastSubSkill) {
        // Determine skill from sub-skill name (simplified mapping)
        const subSkillSkillMap: Record<string, string> = {
          Grammar: 'Writing', Coherence: 'Writing', Vocabulary: 'Writing',
          Pronunciation: 'Speaking', Fluency: 'Speaking',
          Comprehension: 'Reading', Inference: 'Reading',
          'Detail Recognition': 'Listening', 'Note Completion': 'Listening',
        };
        return {
          skill:    subSkillSkillMap[lastSubSkill] || 'Writing',
          subSkill: lastSubSkill,
        };
      }
    }
  } catch { /* ignore */ }
  return { skill: 'Writing', subSkill: 'Grammar' };
};

// ─────────────────────────────────────────────────────────────────────────────
// MAIN COMPONENT
// ─────────────────────────────────────────────────────────────────────────────

export default function InternalAssessmentPage() {
  const navigate   = useNavigate();
  const { user, profile }      = useAuth();
  const { deductPoints, addPoints } = useMomentum();

  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(true);
  const [phase,     setPhase]     = useState<IAPhase>('checking');
  const [tracker,   setTracker]   = useState<IATracker>(readIATracker());
  const [questions, setQuestions] = useState<IAQuestion[]>([]);
  const [answers,   setAnswers]   = useState<Record<string, string>>({});
  const [currentQ,  setCurrentQ]  = useState(0);
  const [timeLeft,  setTimeLeft]  = useState(IA_TIMER_SECONDS);
  const [waitSecondsLeft, setWaitSecondsLeft] = useState(0);

  const displayName  = profile?.name || user?.email?.split('@')[0] || 'Student';
  const tutorFiredRef = useRef(false);

  // ── PREVIOUS BAND (mock — real value comes from competency scores API) ──────
  // TODO (Sarthak): Read from real competency scores instead
  const getPreviousBand = (): number => 5.5;

  // ── ELIGIBILITY CHECK ────────────────────────────────────────────────────────
  const checkEligibility = useCallback(() => {
    const t = readIATracker();
    const drills = readTotalDrills();
    const now = new Date().toISOString();

    // All 6 IAs done → mock unlocked
    if (t.totalCompleted >= 6) {
      setTracker(t); setPhase('all_done'); return;
    }

    // Check if there is an existing window
    if (t.currentWindow) {
      const w = t.currentWindow;

      // Check for expired missed window
      if (w.status === 'open' && Date.now() > new Date(w.windowExpiresAt).getTime()) {
        // Window expired — mark missed
        const updated: IATracker = {
          ...t,
          consecutiveMisses: t.consecutiveMisses + 1,
          currentWindow: { ...w, status: 'missed' },
        };
        writeIATracker(updated);
        setTracker(updated);
        // Deduct momentum for miss
        deductPoints(MISS_PENALTY, 'Missed Internal Assessment window');
        setPhase('missed');
        // Level 2 alert if 2+ consecutive misses
        if (updated.consecutiveMisses >= 2 && !tutorFiredRef.current) {
          tutorFiredRef.current = true;
          fireTutorAlertIA(displayName, user?.email, 2, {
            consecutiveMisses: updated.consecutiveMisses,
            totalCompleted:    updated.totalCompleted,
            subSkill:          w.targetSubSkill,
          });
        }
        return;
      }

      // Resume mid-test
      if (w.status === 'in_progress' && w.inProgress) {
        const resumeDeadline = new Date(w.inProgress.resumeDeadline).getTime();
        if (Date.now() < resumeDeadline) {
          setTracker(t);
          setAnswers(w.inProgress.answers);
          setCurrentQ(w.inProgress.currentQuestion);
          setTimeLeft(Math.floor(minutesUntil(w.inProgress.resumeDeadline) * 60));
          setQuestions(getMockQuestions(w.targetSubSkill, w.targetSkill));
          setPhase('resume');
          return;
        } else {
          // Resume window also expired — auto-submit with what we have
          handleAutoSubmit(t, w.inProgress.answers);
          return;
        }
      }

      if (w.status === 'waiting') {
        setTracker(t);
        setWaitSecondsLeft(Math.floor(hoursUntil(w.windowOpensAt) * 3600));
        setPhase('eligible_waiting');
        return;
      }

      if (w.status === 'open') {
        setTracker(t); setPhase('window_open'); return;
      }
      if (w.status === 'completed') {
        setTracker(t); setPhase('completed'); return;
      }
      if (w.status === 'missed')   {
        setTracker(t); setPhase('missed'); return;
      }
    }

    // No existing window — check if eligible
    const eligible = drills.count >= 6 && drills.firstSessionDate
      ? daysDiff(drills.firstSessionDate) >= 2
      : false;

    if (!eligible) {
      setTracker(t); setPhase('not_eligible'); return;
    }

    // Eligible — create new window (24hr wait starts now)
    const target = getTargetSubSkill();
    const newWindow: IAWindow = {
      notifiedAt:     now,
      windowOpensAt:  addHours(now, WAIT_HOURS),
      windowExpiresAt: addHours(now, WAIT_HOURS + WINDOW_HOURS),
      status:         'waiting',
      iaNumber:       t.totalCompleted + 1,
      targetSkill:    target.skill,
      targetSubSkill: target.subSkill,
      inProgress:     null,
      result:         null,
    };

    const updated: IATracker = { ...t, currentWindow: newWindow };
    writeIATracker(updated);
    setTracker(updated);
    setWaitSecondsLeft(WAIT_HOURS * 3600);
    setPhase('eligible_waiting');

    // +50 Momentum for reaching IA eligibility milestone
    addPoints(50, 'IA eligibility milestone reached');
  }, [deductPoints, addPoints, displayName, user?.email]);

  // ── AUTO-SUBMIT (timer expired or resume window expired) ─────────────────────
  const handleAutoSubmit = useCallback((t: IATracker, savedAnswers: Record<string, string>) => {
    const w = t.currentWindow!;
    const result = scoreMockIA(savedAnswers, getPreviousBand());
    const updated: IATracker = {
      ...t,
      totalCompleted:    t.totalCompleted + 1,
      consecutiveMisses: 0,
      lastCompletedDate: new Date().toISOString(),
      currentWindow: { ...w, status: 'completed', result, inProgress: null },
    };
    writeIATracker(updated);
    setTracker(updated);
    addPoints(IA_COMPLETE_POINTS, 'Internal Assessment completed');
    setPhase('completed');
  }, [addPoints]);

  // ── MOUNT ────────────────────────────────────────────────────────────────────
  useEffect(() => { checkEligibility(); }, [checkEligibility]);

  // ── WAIT COUNTDOWN ───────────────────────────────────────────────────────────
  useEffect(() => {
    if (phase !== 'eligible_waiting') return;
    if (waitSecondsLeft <= 0) { checkEligibility(); return; }
    const t = setInterval(() => {
      setWaitSecondsLeft(prev => {
        if (prev <= 1) { clearInterval(t); checkEligibility(); return 0; }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(t);
  }, [phase, waitSecondsLeft, checkEligibility]);

  // ── SESSION TIMER ─────────────────────────────────────────────────────────────
  useEffect(() => {
    if (phase !== 'in_progress' && phase !== 'resume') return;
    if (timeLeft <= 0) {
      // Auto-submit on timer expiry
      handleAutoSubmit(tracker, answers);
      return;
    }
    const t = setInterval(() => setTimeLeft(prev => prev - 1), 1000);
    return () => clearInterval(t);
  }, [phase, timeLeft, tracker, answers, handleAutoSubmit]);

  // ── 3-WEEK BACKGROUND CHECK ───────────────────────────────────────────────────
  useEffect(() => {
    const drills = readTotalDrills();
    if (!drills.firstSessionDate) return;
    if (daysDiff(drills.firstSessionDate) >= 21 && tracker.totalCompleted < 6) {
      if (!tutorFiredRef.current) {
        tutorFiredRef.current = true;
        fireTutorAlertIA(displayName, user?.email, 1, { totalCompleted: tracker.totalCompleted });
      }
    }
  }, [tracker.totalCompleted, displayName, user?.email]);

  // ── HANDLERS ──────────────────────────────────────────────────────────────────

  const handleStartIA = () => {
    const w = tracker.currentWindow!;

    // Update window status to in_progress
    const updated: IATracker = {
      ...tracker,
      currentWindow: { ...w, status: 'in_progress', inProgress: null },
    };
    writeIATracker(updated);
    setTracker(updated);

    const qs = getMockQuestions(w.targetSubSkill, w.targetSkill);
    setQuestions(qs);
    setAnswers({});
    setCurrentQ(0);
    setTimeLeft(IA_TIMER_SECONDS);
    setPhase('in_progress');
  };

  const handleAnswer = (questionId: string, answer: string) => {
    const updated = { ...answers, [questionId]: answer };
    setAnswers(updated);

    // Save progress after every answer
    const w = tracker.currentWindow!;
    const now = new Date().toISOString();
    const updatedTracker: IATracker = {
      ...tracker,
      currentWindow: {
        ...w,
        status: 'in_progress',
        inProgress: {
          answers:         updated,
          currentQuestion: currentQ,
          exitedAt:        now,
          resumeDeadline:  addMinutes(now, RESUME_TIMER_SECONDS / 60),
        },
      },
    };
    writeIATracker(updatedTracker);
    setTracker(updatedTracker);
  };

  const handleNext = () => {
    if (currentQ < questions.length - 1) {
      setCurrentQ(prev => prev + 1);
    } else {
      // Last question — submit
      const result = scoreMockIA(answers, getPreviousBand());
      const w = tracker.currentWindow!;
      const improved = result.band > getPreviousBand();
      const updated: IATracker = {
        ...tracker,
        totalCompleted:    tracker.totalCompleted + 1,
        consecutiveMisses: 0,
        lastCompletedDate: new Date().toISOString(),
        currentWindow: { ...w, status: 'completed', result, inProgress: null },
      };
      writeIATracker(updated);
      setTracker(updated);

      addPoints(IA_COMPLETE_POINTS, 'Internal Assessment completed');
      if (improved) addPoints(IA_IMPROVE_BONUS, 'Band improved in IA');

      setPhase('completed');
    }
  };

  const handlePrev = () => {
    if (currentQ > 0) setCurrentQ(prev => prev - 1);
  };

  const handleExitMidTest = () => {
    // State already saved in handleAnswer — just navigate away
    // Student can return within resumeDeadline
    navigate('/student/dashboard');
  };

  const handleResume = () => {
    const w = tracker.currentWindow!;
    const qs = getMockQuestions(w.targetSubSkill, w.targetSkill);
    setQuestions(qs);
    const resumeSeconds = Math.floor(minutesUntil(w.inProgress!.resumeDeadline) * 60);
    setTimeLeft(resumeSeconds);
    setPhase('in_progress');
  };

  const handleResetWindow = () => {
    // Clear current window so student can start fresh cycle (only on miss/expire)
    const updated: IATracker = { ...tracker, currentWindow: null };
    writeIATracker(updated);
    setTracker(updated);
    setPhase('not_eligible');
    checkEligibility();
  };

  // ── RENDERS ───────────────────────────────────────────────────────────────────

  const renderChecking = () => (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="animate-pulse text-slate-400 font-medium tracking-wide">Checking eligibility...</div>
    </div>
  );

  const renderNotEligible = () => {
    const drills = readTotalDrills();
    const drillsLeft    = Math.max(0, 6 - drills.count);
    const daysRemaining = drills.firstSessionDate
      ? Math.max(0, 2 - daysDiff(drills.firstSessionDate))
      : 2;

    return (
      <div className="max-w-xl mx-auto text-center animate-in fade-in slide-in-from-bottom-4 pt-8">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-8 shadow-sm">
          <div className="w-20 h-20 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-6">
            <Lock className="w-10 h-10 text-slate-400" />
          </div>
          <h2 className="text-2xl font-black text-slate-800 dark:text-white mb-2 uppercase tracking-tight">
            Assessment Locked
          </h2>
          <p className="text-slate-500 mb-8 font-medium">
            Complete the requirements below to unlock your Internal Assessment.
          </p>

          {/* Progress bars */}
          <div className="space-y-4 text-left mb-8">
            {/* Drill count */}
            <div>
              <div className="flex justify-between text-sm font-bold mb-2">
                <span className="text-slate-600 dark:text-slate-400">Total Drills Completed</span>
                <span className={drills.count >= 6 ? 'text-emerald-500' : 'text-indigo-500'}>
                  {drills.count} / 6
                </span>
              </div>
              <div className="h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-indigo-500 rounded-full transition-all duration-700"
                  style={{ width: `${Math.min(100, (drills.count / 6) * 100)}%` }}
                />
              </div>
              {drillsLeft > 0 && (
                <p className="text-xs text-slate-400 mt-1">{drillsLeft} more drill{drillsLeft !== 1 ? 's' : ''} needed</p>
              )}
            </div>

            {/* Calendar days */}
            <div>
              <div className="flex justify-between text-sm font-bold mb-2">
                <span className="text-slate-600 dark:text-slate-400">Minimum Study Days</span>
                <span className={daysRemaining === 0 ? 'text-emerald-500' : 'text-indigo-500'}>
                  {drills.firstSessionDate ? Math.min(2, daysDiff(drills.firstSessionDate)) : 0} / 2
                </span>
              </div>
              <div className="h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-indigo-500 rounded-full transition-all duration-700"
                  style={{ width: drills.firstSessionDate ? `${Math.min(100, (daysDiff(drills.firstSessionDate) / 2) * 100)}%` : '0%' }}
                />
              </div>
              {daysRemaining > 0 && (
                <p className="text-xs text-slate-400 mt-1">{daysRemaining} more day{daysRemaining !== 1 ? 's' : ''} needed (spaced learning rule)</p>
              )}
            </div>
          </div>

          <button
            onClick={() => navigate('/student/dashboard')}
            className="w-full flex items-center justify-center gap-2 py-3.5 bg-slate-800 dark:bg-white text-white dark:text-slate-900 font-bold rounded-xl hover:scale-[1.01] transition-all shadow-md"
          >
            Back to Dashboard <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    );
  };

  const renderWaiting = () => (
    <div className="max-w-xl mx-auto text-center animate-in fade-in slide-in-from-bottom-4 pt-8">
      <div className="bg-white dark:bg-slate-900 border border-purple-200 dark:border-purple-500/30 rounded-3xl p-8 shadow-sm">
        <div className="w-20 h-20 bg-purple-100 dark:bg-purple-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
          <Clock className="w-10 h-10 text-purple-500" />
        </div>
        <div className="inline-flex items-center gap-2 bg-emerald-100 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 font-bold text-sm px-4 py-1.5 rounded-full mb-4">
          <CheckCircle2 className="w-4 h-4" /> Eligibility Unlocked +50 pts
        </div>
        <h2 className="text-2xl font-black text-slate-800 dark:text-white mb-2 uppercase tracking-tight">
          Assessment Opens In
        </h2>
        <div className="text-5xl font-black text-purple-500 font-mono my-6">
          {formatCountdown(waitSecondsLeft)}
        </div>
        <p className="text-slate-500 mb-8 font-medium text-sm">
          Your brain is consolidating what you've practised. The 24-hour wait is intentional — it improves retention. You'll be notified when the assessment window opens.
        </p>
        <div className="bg-slate-50 dark:bg-slate-800 rounded-2xl p-4 text-left mb-6">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">What's being assessed</p>
          <p className="text-slate-700 dark:text-slate-300 font-semibold">
            {tracker.currentWindow?.targetSkill} — {tracker.currentWindow?.targetSubSkill}
          </p>
          <p className="text-xs text-slate-400 mt-1">10 questions · 20-minute timer · IA #{tracker.currentWindow?.iaNumber}</p>
        </div>
        <button onClick={() => navigate('/student/dashboard')} className="w-full flex items-center justify-center gap-2 py-3.5 bg-slate-800 dark:bg-white text-white dark:text-slate-900 font-bold rounded-xl hover:scale-[1.01] transition-all shadow-md">
          Back to Dashboard <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );

  const renderWindowOpen = () => {
    const w = tracker.currentWindow!;
    const expiresIn = Math.floor(minutesUntil(w.windowExpiresAt) * 60);
    return (
      <div className="max-w-xl mx-auto text-center animate-in fade-in slide-in-from-bottom-4 pt-8">
        <div className="bg-gradient-to-br from-purple-500 to-indigo-600 p-1 rounded-3xl shadow-2xl">
          <div className="bg-white dark:bg-slate-900 rounded-[22px] p-8">
            <div className="w-20 h-20 bg-purple-100 dark:bg-purple-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
              <Target className="w-10 h-10 text-purple-500" />
            </div>
            <div className="inline-flex items-center gap-2 bg-emerald-100 dark:bg-emerald-500/20 text-emerald-600 font-bold text-sm px-4 py-1.5 rounded-full mb-4 animate-pulse">
              Window Open
            </div>
            <h2 className="text-2xl font-black text-slate-800 dark:text-white mb-2 uppercase tracking-tight">
              Internal Assessment #{w.iaNumber}
            </h2>
            <p className="text-slate-500 mb-6 font-medium text-sm">
              Your assessment is ready. Complete it before the window closes.
            </p>

            <div className="bg-slate-50 dark:bg-slate-800 rounded-2xl p-4 text-left mb-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Target</p>
                  <p className="text-slate-800 dark:text-white font-bold text-sm">{w.targetSkill} — {w.targetSubSkill}</p>
                </div>
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Questions</p>
                  <p className="text-slate-800 dark:text-white font-bold text-sm">10 questions</p>
                </div>
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Timer</p>
                  <p className="text-slate-800 dark:text-white font-bold text-sm">20 minutes</p>
                </div>
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Window Closes</p>
                  <p className={cn("font-bold text-sm", expiresIn < 3600 ? 'text-rose-500' : 'text-slate-800 dark:text-white')}>
                    {formatCountdown(expiresIn)}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 rounded-xl p-3 mb-6 text-left">
              <p className="text-xs font-bold text-amber-700 dark:text-amber-400">
                ⚠️ Find a quiet space. The timer starts when you tap Begin. If you exit mid-test, you have 18 minutes to return and complete it.
              </p>
            </div>

            <button
              onClick={handleStartIA}
              className="w-full flex items-center justify-center gap-2 bg-purple-500 hover:bg-purple-600 text-white font-bold py-4 rounded-xl transition-all shadow-md hover:shadow-lg active:scale-[0.98]"
            >
              Begin Assessment <ArrowRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    );
  };

  const renderInProgress = () => {
    if (questions.length === 0) return null;
    const q = questions[currentQ];
    const answered = !!answers[q.id]?.trim();
    const isLast   = currentQ === questions.length - 1;
    const pct      = timeLeft / IA_TIMER_SECONDS;
    const timerColor = pct < 0.2 ? 'text-rose-500' : pct < 0.5 ? 'text-amber-500' : 'text-indigo-500';

    return (
      <div className="max-w-2xl mx-auto pt-4 pb-16 animate-in fade-in">

        {/* Header */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 mb-6 flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-purple-100 dark:bg-purple-500/20 rounded-xl flex items-center justify-center">
              <Target className="w-5 h-5 text-purple-500" />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">IA #{tracker.currentWindow?.iaNumber}</p>
              <p className="text-sm font-bold text-slate-800 dark:text-white">
                {tracker.currentWindow?.targetSkill} — {tracker.currentWindow?.targetSubSkill}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {/* Timer */}
            <div className={cn("font-mono font-black text-2xl tabular-nums", timerColor)}>
              {formatCountdown(timeLeft)}
            </div>
            <button
              onClick={handleExitMidTest}
              className="text-xs font-bold text-slate-400 hover:text-slate-800 dark:hover:text-white uppercase tracking-wider transition-colors"
            >
              Exit
            </button>
          </div>
        </div>

        {/* Progress dots */}
        <div className="flex items-center gap-1.5 mb-6 justify-center">
          {questions.map((_, i) => (
            <div
              key={i}
              className={cn(
                "h-1.5 rounded-full transition-all duration-300",
                i < currentQ ? "bg-emerald-500 w-6" : i === currentQ ? "bg-purple-500 w-8" : "bg-slate-200 dark:bg-slate-700 w-6"
              )}
            />
          ))}
        </div>

        {/* Question card */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-8 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <span className="text-[10px] font-bold bg-purple-100 dark:bg-purple-500/20 text-purple-600 dark:text-purple-400 px-3 py-1.5 rounded-full uppercase tracking-wider">
              {q.subSkill}
            </span>
            <span className="text-sm font-bold text-slate-400">
              {currentQ + 1} / {questions.length}
            </span>
          </div>

          <h3 className="text-xl font-bold text-slate-800 dark:text-white mb-8 leading-relaxed">
            {q.text}
          </h3>

          {/* MCQ */}
          {q.type === 'mcq' && q.options && (
            <div className="flex flex-col gap-3">
              {q.options.map(opt => (
                <button
                  key={opt}
                  onClick={() => handleAnswer(q.id, opt)}
                  className={cn(
                    "text-left p-4 rounded-xl border-2 font-medium text-sm transition-all",
                    answers[q.id] === opt
                      ? "border-purple-500 bg-purple-50 dark:bg-purple-500/10 text-purple-700 dark:text-purple-300"
                      : "border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:border-slate-400"
                  )}
                >
                  {opt}
                </button>
              ))}
            </div>
          )}

          {/* Short answer */}
          {q.type === 'short_answer' && (
            <textarea
              rows={4}
              value={answers[q.id] || ''}
              onChange={e => handleAnswer(q.id, e.target.value)}
              placeholder="Type your answer here..."
              className="w-full p-4 border-2 border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-white font-medium text-sm outline-none focus:border-purple-500 transition-colors resize-none"
            />
          )}

          {/* Navigation */}
          <div className="flex gap-3 mt-8">
            <button
              onClick={handlePrev}
              disabled={currentQ === 0}
              className="px-5 py-3 border-2 border-slate-200 dark:border-slate-700 rounded-xl font-bold text-slate-500 disabled:opacity-30 disabled:pointer-events-none hover:bg-slate-50 dark:hover:bg-slate-800 text-sm uppercase tracking-wide"
            >
              Prev
            </button>
            <button
              onClick={handleNext}
              disabled={!answered}
              className={cn(
                "flex-1 font-bold text-sm uppercase tracking-wide rounded-xl border-2 py-3 transition-all flex items-center justify-center gap-2",
                answered
                  ? "bg-purple-500 hover:bg-purple-600 text-white border-purple-500 active:scale-[0.98]"
                  : "bg-slate-100 dark:bg-slate-800 text-slate-400 border-slate-200 dark:border-slate-700 cursor-not-allowed"
              )}
            >
              {isLast ? 'Submit Assessment' : 'Next Question'} <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    );
  };

  const renderResume = () => {
    const w = tracker.currentWindow!;
    const answeredCount = Object.keys(w.inProgress?.answers || {}).length;
    return (
      <div className="max-w-xl mx-auto text-center animate-in fade-in pt-8">
        <div className="bg-white dark:bg-slate-900 border border-amber-200 dark:border-amber-500/30 rounded-3xl p-8 shadow-sm">
          <div className="w-20 h-20 bg-amber-100 dark:bg-amber-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
            <RotateCcw className="w-10 h-10 text-amber-500" />
          </div>
          <h2 className="text-2xl font-black text-slate-800 dark:text-white mb-2 uppercase">Assessment Interrupted</h2>
          <p className="text-slate-500 mb-6 font-medium text-sm">
            You left with {answeredCount} of {IA_QUESTIONS_TOTAL} questions answered. Your progress has been saved.
          </p>

          <div className="bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 rounded-2xl p-4 mb-6">
            <p className="text-sm font-bold text-amber-700 dark:text-amber-400">
              Resume window closes in: <span className="font-mono text-xl">{formatCountdown(timeLeft)}</span>
            </p>
            <p className="text-xs text-amber-600 dark:text-amber-500 mt-1">
              After this, the test auto-submits with your current answers.
            </p>
          </div>

          <button
            onClick={handleResume}
            className="w-full flex items-center justify-center gap-2 bg-amber-500 hover:bg-amber-600 text-white font-bold py-4 rounded-xl transition-all shadow-md mb-3"
          >
            Resume Assessment <ArrowRight className="w-5 h-5" />
          </button>
          <button onClick={() => navigate('/student/dashboard')} className="w-full py-3 text-sm font-bold text-slate-500 hover:text-slate-800 dark:hover:text-white transition-colors">
            Return to Dashboard (auto-submits on expiry)
          </button>
        </div>
      </div>
    );
  };

  const renderCompleted = () => {
    const w = tracker.currentWindow!;
    const r = w.result!;
    const improved = r.band > getPreviousBand();
    const iasLeft  = Math.max(0, 6 - tracker.totalCompleted);

    return (
      <div className="max-w-xl mx-auto pt-8 pb-16 animate-in fade-in">
        <div className="bg-gradient-to-br from-emerald-500 to-indigo-600 p-1 rounded-3xl shadow-2xl">
          <div className="bg-white dark:bg-slate-900 rounded-[22px] p-8 text-center">
            <CheckCircle2 className="w-16 h-16 text-emerald-500 mx-auto mb-4" />
            <h2 className="text-2xl font-black text-slate-800 dark:text-white mb-1 uppercase tracking-tight">
              IA #{w.iaNumber} Complete
            </h2>
            <p className="text-slate-500 text-sm mb-8 font-medium">{w.targetSkill} — {w.targetSubSkill}</p>

            {/* Band reveal */}
            <div className="flex items-center justify-center gap-4 mb-8">
              <div className="text-center">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Before</p>
                <p className="text-3xl font-black text-slate-400">{getPreviousBand().toFixed(1)}</p>
              </div>
              <ArrowRight className="w-6 h-6 text-slate-300" />
              <div className="text-center">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">After</p>
                <p className={cn("text-5xl font-black", improved ? 'text-emerald-500' : 'text-slate-700 dark:text-white')}>
                  {r.band.toFixed(1)}
                </p>
              </div>
              {improved && (
                <span className="text-emerald-500 font-black text-sm bg-emerald-50 dark:bg-emerald-500/10 px-2 py-1 rounded-lg">
                  ↑ Improved
                </span>
              )}
            </div>

            {/* Momentum earned */}
            <div className="flex items-center justify-center gap-4 mb-8 flex-wrap">
              <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-800 px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700">
                <Zap className="w-4 h-4 text-amber-500 fill-amber-500" />
                <span className="font-bold text-sm text-slate-700 dark:text-slate-300">
                  +{IA_COMPLETE_POINTS}{improved ? ` +${IA_IMPROVE_BONUS}` : ''} Momentum
                </span>
              </div>
              <div className="flex items-center gap-2 bg-purple-50 dark:bg-purple-500/10 px-4 py-2 rounded-xl border border-purple-200 dark:border-purple-500/20">
                <Target className="w-4 h-4 text-purple-500" />
                <span className="font-bold text-sm text-purple-700 dark:text-purple-400">
                  {tracker.totalCompleted}/6 IAs done
                </span>
              </div>
            </div>

            {/* Progress to mock test */}
            {iasLeft > 0 && (
              <div className="bg-slate-50 dark:bg-slate-800 rounded-2xl p-4 mb-6 text-left">
                <div className="flex justify-between text-sm font-bold mb-2">
                  <span className="text-slate-600 dark:text-slate-400">Progress to Mock Test</span>
                  <span className="text-purple-500">{tracker.totalCompleted}/6</span>
                </div>
                <div className="h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-purple-500 rounded-full transition-all duration-700"
                    style={{ width: `${(tracker.totalCompleted / 6) * 100}%` }}
                  />
                </div>
                <p className="text-xs text-slate-400 mt-1">{iasLeft} more IA{iasLeft !== 1 ? 's' : ''} to unlock Full Mock Test</p>
              </div>
            )}

            <button onClick={() => navigate('/student/dashboard')} className="w-full flex items-center justify-center gap-2 bg-slate-800 dark:bg-white text-white dark:text-slate-900 font-bold py-4 rounded-xl hover:scale-[1.01] transition-all shadow-md">
              Back to Dashboard <ArrowRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    );
  };

  const renderMissed = () => (
    <div className="max-w-xl mx-auto text-center animate-in fade-in pt-8">
      <div className="bg-white dark:bg-slate-900 border border-rose-200 dark:border-rose-500/30 rounded-3xl p-8 shadow-sm">
        <div className="w-20 h-20 bg-rose-100 dark:bg-rose-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
          <AlertTriangle className="w-10 h-10 text-rose-500" />
        </div>
        <h2 className="text-2xl font-black text-slate-800 dark:text-white mb-2 uppercase">Assessment Missed</h2>
        <p className="text-slate-500 mb-4 font-medium text-sm">
          The 24-hour window expired before you completed the assessment.
        </p>
        <div className="bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/20 rounded-2xl p-4 mb-6">
          <p className="text-sm font-bold text-rose-700 dark:text-rose-400">
            −{MISS_PENALTY} Momentum deducted.
            {tracker.consecutiveMisses >= 2 && ' Your tutor has been notified.'}
          </p>
          {tracker.consecutiveMisses >= 2 && (
            <p className="text-xs text-rose-600 dark:text-rose-500 mt-1">
              Two consecutive misses detected. Your predicted readiness has been updated.
            </p>
          )}
        </div>
        <p className="text-sm text-slate-500 mb-6 font-medium">
          The missed sub-skill has been added to your next IA session. Complete more drills and a new window will open.
        </p>
        <div className="flex flex-col gap-3">
          <button
            onClick={handleResetWindow}
            className="w-full flex items-center justify-center gap-2 bg-indigo-500 hover:bg-indigo-600 text-white font-bold py-3.5 rounded-xl transition-all"
          >
            Continue Drills — New Window Will Open
          </button>
          <button onClick={() => navigate('/student/dashboard')} className="text-sm font-bold text-slate-400 hover:text-slate-700 dark:hover:text-white transition-colors py-2">
            Back to Dashboard
          </button>
        </div>
      </div>
    </div>
  );

  const renderAllDone = () => (
    <div className="max-w-xl mx-auto text-center animate-in fade-in pt-8">
      <div className="bg-gradient-to-br from-purple-500 to-amber-500 p-1 rounded-3xl shadow-2xl">
        <div className="bg-white dark:bg-slate-900 rounded-[22px] p-8">
          <Trophy className="w-16 h-16 text-amber-500 mx-auto mb-4" />
          <h2 className="text-2xl font-black text-slate-800 dark:text-white mb-2 uppercase">All 6 IAs Complete!</h2>
          <p className="text-slate-500 mb-6 font-medium">You have unlocked the Full Mock Test.</p>
          <button
            onClick={() => navigate('/student/mock')}
            className="w-full flex items-center justify-center gap-2 bg-purple-500 hover:bg-purple-600 text-white font-bold py-4 rounded-xl mb-3"
          >
            Take Full Mock Test <ArrowRight className="w-5 h-5" />
          </button>
          <button onClick={() => navigate('/student/dashboard')} className="text-sm font-bold text-slate-400 hover:text-slate-700 dark:hover:text-white">
            Back to Dashboard
          </button>
        </div>
      </div>
    </div>
  );

  // ── PAGE RENDER ───────────────────────────────────────────────────────────────

  const renderContent = () => {
    switch (phase) {
      case 'checking':        return renderChecking();
      case 'not_eligible':    return renderNotEligible();
      case 'eligible_waiting': return renderWaiting();
      case 'window_open':     return renderWindowOpen();
      case 'in_progress':     return renderInProgress();
      case 'resume':          return renderResume();
      case 'completed':       return renderCompleted();
      case 'missed':          return renderMissed();
      case 'all_done':        return renderAllDone();
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-slate-950 transition-colors duration-300">
      <StudentSidebar
        activeTab="internal"
        isCollapsed={isSidebarCollapsed}
        toggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
      />
      <div className={`transition-all duration-300 ${isSidebarCollapsed ? 'lg:pl-20' : 'lg:pl-64'} flex flex-col min-h-screen`}>
        <StudentTopbar onUpgradeClick={() => {}} />
        <main className="flex-1 p-4 sm:p-6 lg:p-8">

          {phase !== 'in_progress' && (
            <button
              onClick={() => navigate(-1)}
              className="flex items-center text-slate-500 hover:text-slate-800 dark:hover:text-white mb-6 transition-colors text-sm font-medium"
            >
              <ArrowLeft className="w-4 h-4 mr-2" /> Back
            </button>
          )}

          {renderContent()}
        </main>
      </div>
    </div>
  );
}