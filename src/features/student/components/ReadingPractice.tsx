import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { StudentSidebar } from './dashboard/StudentSidebar';
import { StudentTopbar } from './dashboard/StudentTopbar';
import { useToast } from '@/shared/hooks/use-toast';
import {
  ArrowLeft, BookOpen, FileText, Sparkles, Loader2, Clock,
  CheckCircle2, XCircle, Trophy, Zap, Target, BarChart2,
  RotateCcw, ChevronRight, History, Brain,
  ChevronLeft, TrendingUp, TrendingDown, Eye,
  AlertTriangle, Play, Gauge, Info, Timer, Layers,
  BookMarked, Flame,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/shared/components/ui/card';
import { Badge } from '@/shared/components/ui/badge';
import {
  fetchSpeedReadingReports,
  fetchSpeedReadingReportById,
  type SpeedReadingReportSummary,
  type SpeedReadingReport,
} from '@/features/student/services/speedReadingService';
import {
  submitReadingPracticeSession,
  type ReadingPracticeResult,
} from '@/features/student/services/readingPracticeService';
import { useMomentum } from "@/features/student/Context/MomentumContext";
import { stampPassportSlot } from '@/features/student/utils/passportUtils';

// ─────────────────────────────────────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────────────────────────────────────

type ViewState = 'library' | 'guide' | 'speed-setup' | 'reading' | 'quiz' | 'results';
type SpeedLevel = 'beginner' | 'normal' | 'proficient' | 'advanced';

interface SpeedConfig {
  label:           string;
  wpm:             number;
  msPerWord:       number;
  passageMult:     number;
  questionWpmMult: number;
  color:           string;
  bg:              string;
  border:          string;
  desc:            string;
  icon:            React.ReactNode;
}

// ─────────────────────────────────────────────────────────────────────────────
// CONSTANTS
// ─────────────────────────────────────────────────────────────────────────────

const SPEED_CONFIGS: Record<SpeedLevel, SpeedConfig> = {
  beginner: {
    label: 'Beginner', wpm: 150, msPerWord: 400, passageMult: 0.55,
    questionWpmMult: 1.0,
    color: 'text-emerald-600 dark:text-emerald-400',
    bg: 'bg-emerald-50 dark:bg-emerald-500/10',
    border: 'border-emerald-200 dark:border-emerald-500/30',
    desc: 'Comfortable pace · Good for first attempts',
    icon: <Layers className="w-5 h-5" />,
  },
  normal: {
    label: 'Normal', wpm: 250, msPerWord: 240, passageMult: 0.45,
    questionWpmMult: 1.2,
    color: 'text-sky-600 dark:text-sky-400',
    bg: 'bg-sky-50 dark:bg-sky-500/10',
    border: 'border-sky-200 dark:border-sky-500/30',
    desc: 'Average reading speed · Moderate pressure',
    icon: <Eye className="w-5 h-5" />,
  },
  proficient: {
    label: 'Proficient', wpm: 400, msPerWord: 150, passageMult: 0.35,
    questionWpmMult: 1.5,
    color: 'text-violet-600 dark:text-violet-400',
    bg: 'bg-violet-50 dark:bg-violet-500/10',
    border: 'border-violet-200 dark:border-violet-500/30',
    desc: 'Trained reader · Significant time pressure',
    icon: <Brain className="w-5 h-5" />,
  },
  advanced: {
    label: 'Advanced', wpm: 600, msPerWord: 100, passageMult: 0.28,
    questionWpmMult: 2.0,
    color: 'text-rose-600 dark:text-rose-400',
    bg: 'bg-rose-50 dark:bg-rose-500/10',
    border: 'border-rose-200 dark:border-rose-500/30',
    desc: 'Elite mode · Extreme pressure · Exam simulation',
    icon: <Flame className="w-5 h-5" />,
  },
};

const ANSWER_TIME: Record<SpeedLevel, { base: number; perWord: number }> = {
  beginner:   { base: 20, perWord: 0.15 },
  normal:     { base: 15, perWord: 0.12 },
  proficient: { base: 12, perWord: 0.10 },
  advanced:   { base: 10, perWord: 0.08 },
};

// ─────────────────────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────────────────────

function getScoreColor(pct: number) {
  if (pct >= 80) return 'text-emerald-500';
  if (pct >= 60) return 'text-amber-500';
  return 'text-rose-500';
}

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return m > 0 ? `${m}m ${s}s` : `${s}s`;
}

function getGrade(pct: number): string {
  if (pct >= 90) return 'A+';
  if (pct >= 80) return 'A';
  if (pct >= 70) return 'B';
  if (pct >= 60) return 'C';
  return 'F';
}

function calcPassageTime(wordCount: number, speed: SpeedLevel): number {
  return Math.max(15, Math.round(wordCount * SPEED_CONFIGS[speed].passageMult));
}

function calcAnswerTime(questionText: string, speed: SpeedLevel): number {
  const words = questionText.trim().split(/\s+/).length;
  const cfg   = ANSWER_TIME[speed];
  return Math.round(cfg.base + words * cfg.perWord);
}

// ─────────────────────────────────────────────────────────────────────────────
// KEYWORD EXTRACTION
// ─────────────────────────────────────────────────────────────────────────────

// Common English words — filter these out even if they appear in questions
const STOPWORDS = new Set([
  'the','a','an','and','or','but','in','on','at','to','for','of','with',
  'by','from','as','is','was','are','were','been','be','have','has','had',
  'do','does','did','will','would','could','should','may','might','shall',
  'not','no','nor','so','yet','both','either','neither','each','every',
  'all','any','few','more','most','other','some','such','than','that','these',
  'they','this','those','what','which','who','whom','how','when','where','why',
  'can','cannot','its','it','their','there','then','also','into','about',
  'above','below','during','through','while','after','before','since','until',
]);

function extractKeywords(passageText: string, questions: any[]): Set<string> {
  const keywords = new Set<string>();
  const passageWords = passageText.trim().split(/\s+/);

  // Build a lookup set of words present in the passage (for cross-checking)
  const passageWordSet = new Set(
    passageWords.map(w => w.replace(/[^a-zA-Z]/g, '').toLowerCase()).filter(w => w.length > 3)
  );

  // Source 1 — Proper nouns mid-sentence: place names, people, organisations
  passageWords.forEach((word, idx) => {
    const clean = word.replace(/[^a-zA-Z]/g, '');
    if (!clean || clean.length < 3) return;
    if (idx > 0 && /^[A-Z]/.test(clean)) {
      keywords.add(clean.toLowerCase());
    }
  });

  // Source 2 — Numbers / years: dates and statistics are always exam-relevant
  passageWords.forEach(word => {
    if (/\d/.test(word)) {
      const clean = word.replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
      if (clean.length >= 2) keywords.add(clean);
    }
  });

  // Source 3 — Question-derived keywords (most precise signal)
  questions.forEach(q => {
    const stem = q.stem ?? q.prompt_text ?? '';
    stem.split(/\s+/).forEach((w: string) => {
      const clean = w.replace(/[^a-zA-Z]/g, '').toLowerCase();
      if (clean.length > 4 && !STOPWORDS.has(clean) && passageWordSet.has(clean)) {
        keywords.add(clean);
      }
    });
  });

  return keywords;
}

// ─────────────────────────────────────────────────────────────────────────────
// FISHEYE PASSAGE RENDERER — CHUNK CURSOR EDITION (NO BLUR)
//
// Updates based on requirements:
// 1. Passage loads perfectly clear and readable (no blur/opacity tricks).
// 2. The reading tracker moves invisibly through the passage.
// 3. ONLY words that are actual keywords highlight/glow when the tracker hits them.
// ─────────────────────────────────────────────────────────────────────────────

const CHUNK_SIZE = 3;

interface FisheyePassageProps {
  text:          string;
  activeIndex:   number;
  speed:         SpeedLevel;
  sweepComplete: boolean;
  keywords:      Set<string>;
}

const FisheyePassage: React.FC<FisheyePassageProps> = ({
  text, activeIndex, speed, sweepComplete, keywords,
}) => {
  const words = useMemo(() => text.trim().split(/\s+/), [text]);

  const chunkColor: Record<SpeedLevel, string> = {
    beginner:   '#10b981',
    normal:     '#0ea5e9',
    proficient: '#7c3aed',
    advanced:   '#ef4444',
  };

  const msPerWord = SPEED_CONFIGS[speed].msPerWord;
  const transTime = Math.max(60, msPerWord * 0.8);
  const activeColor = chunkColor[speed];

  return (
    <p className="text-base sm:text-lg leading-[2.1] select-none text-slate-800 dark:text-slate-200">
      {words.map((word, i) => {
        const cleanWord = word.replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
        const isKeyword = keywords.has(cleanWord) && cleanWord.length > 1;

        if (sweepComplete) {
          return (
            <React.Fragment key={i}>
              <span
                style={{
                  display:    'inline-block',
                  transition: 'all 400ms ease',
                }}
              >
                {word}
              </span>{' '}
            </React.Fragment>
          );
        }

        // The chunk window [activeIndex, activeIndex + CHUNK_SIZE - 1]
        const chunkStart = activeIndex;
        const chunkEnd   = activeIndex + CHUNK_SIZE - 1;
        const isInChunk  = i >= chunkStart && i <= chunkEnd;

        // ONLY highlight if it is a keyword AND the reading chunk is currently over it
        const isHighlighted = isKeyword && isInChunk;

        return (
          <React.Fragment key={i}>
            <span
              style={{
                display:         'inline-block',
                transform:       isHighlighted ? 'scale(1.15)' : 'scale(1)',
                color:           isHighlighted ? activeColor : undefined,
                fontWeight:      isHighlighted ? 800 : undefined,
                textShadow:      isHighlighted ? `0 0 16px ${activeColor}66` : 'none',
                transition:      `transform ${transTime}ms ease-out, color ${transTime}ms ease-out, text-shadow ${transTime}ms ease-out, font-weight ${transTime}ms ease-out`,
                transformOrigin: 'center left',
              }}
            >
              {word}
            </span>{' '}
          </React.Fragment>
        );
      })}
    </p>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// QUESTION TEXT HIGHLIGHTER
// ─────────────────────────────────────────────────────────────────────────────

interface QuestionHighlighterProps {
  text:        string;
  activeIndex: number;
  speed:       SpeedLevel;
  faded:       boolean;
}

const QuestionHighlighter: React.FC<QuestionHighlighterProps> = ({ text, activeIndex, speed, faded }) => {
  const words = useMemo(() => text.trim().split(/\s+/), [text]);

  const activeColors: Record<SpeedLevel, string> = {
    beginner:   '#10b981',
    normal:     '#0ea5e9',
    proficient: '#7c3aed',
    advanced:   '#ef4444',
  };

  return (
    <div style={{
      opacity:       faded ? 0 : 1,
      transition:    'opacity 600ms ease',
      pointerEvents: faded ? 'none' : 'auto',
    }}>
      <p className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white leading-relaxed">
        {words.map((word, i) => {
          const isActive = i === activeIndex && !faded;
          const isPast   = i < activeIndex;
          return (
            <React.Fragment key={i}>
              <span
                style={{
                  display:         'inline-block',
                  color:           isActive ? activeColors[speed] : isPast ? '#94a3b8' : undefined,
                  fontWeight:      isActive ? 900 : undefined,
                  textShadow:      isActive ? `0 0 14px ${activeColors[speed]}66` : undefined,
                  transition:      'color 100ms ease, font-weight 100ms ease, transform 100ms ease',
                  transform:       isActive ? 'scale(1.05)' : 'scale(1)',
                  transformOrigin: 'center center',
                }}
              >
                {word}
              </span>{' '}
            </React.Fragment>
          );
        })}
      </p>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// CIRCULAR TIMER RING — unchanged
// ─────────────────────────────────────────────────────────────────────────────

const TimerRing = ({ value, max, size = 64, urgent }: { value: number; max: number; size?: number; urgent?: boolean }) => {
  const r     = (size - 8) / 2;
  const pct   = Math.max(0, value / max);
  const circ  = 2 * Math.PI * r;
  const color = urgent ? '#ef4444' : pct > 0.5 ? '#7B61FF' : '#f59e0b';

  return (
    <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90" style={{ position: 'absolute' }}>
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="currentColor"
          strokeOpacity={0.12} strokeWidth={6} className="text-slate-400" />
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color}
          strokeWidth={6} strokeLinecap="round"
          strokeDasharray={`${circ * pct} ${circ * (1 - pct)}`}
          style={{ transition: 'stroke-dasharray 1s linear, stroke 0.5s ease' }} />
      </svg>
      <span className={`text-sm font-black z-10 ${urgent ? 'text-rose-500' : 'text-slate-800 dark:text-white'}`}>{value}</span>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// PRE-TEST GUIDE SCREEN
// ─────────────────────────────────────────────────────────────────────────────

const GuideScreen = ({ speed, onStart, onBack }: { speed: SpeedLevel; onStart: () => void; onBack: () => void }) => {
  const cfg = SPEED_CONFIGS[speed];

  const steps = [
    {
      icon:    <BookOpen className="w-6 h-6" />,
      color:   'bg-indigo-100 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400',
      title:   'Full Passage Appears',
      desc:    `The complete reading passage is shown clearly on screen. An invisible tracker moves at ${cfg.wpm} WPM. When it passes over a key word, the word will temporarily highlight.`,
      warning: null,
    },
    {
      icon:    <Timer className="w-6 h-6" />,
      color:   'bg-amber-100 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400',
      title:   'Passage Timer Ends Automatically',
      desc:    'When the passage timer reaches zero the passage disappears immediately. You cannot go back. No pause. No replay.',
      warning: 'The timer creates real pressure — this mirrors actual exam conditions.',
    },
    {
      icon:    <Brain className="w-6 h-6" />,
      color:   'bg-violet-100 dark:bg-violet-500/20 text-violet-600 dark:text-violet-400',
      title:   'Question Text Sweeps Then Vanishes',
      desc:    'Each question appears and its words highlight one by one. When the last word is highlighted, the question fades out. You now have a short window to answer from memory.',
      warning: null,
    },
    {
      icon:    <Zap className="w-6 h-6" />,
      color:   'bg-rose-100 dark:bg-rose-500/20 text-rose-600 dark:text-rose-400',
      title:   'Answer Within the Window — No Buttons',
      desc:    'Tap the correct option before the answer timer expires. No Submit button, no Next button. Your selected answer registers automatically when time runs out. Unanswered counts as wrong.',
      warning: 'Speed matters. Hesitation is penalised.',
    },
    {
      icon:    <Trophy className="w-6 h-6" />,
      color:   'bg-emerald-100 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400',
      title:   'Scorecard After All Questions',
      desc:    'After the final question you see your score, correct/wrong breakdown, momentum earned, and a full answer review with explanations.',
      warning: null,
    },
  ];

  return (
    <div className="max-w-2xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-400">
      <button onClick={onBack} className="flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-slate-900 dark:hover:text-white mb-6 transition-colors">
        <ArrowLeft className="w-4 h-4" /> Back
      </button>

      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-[#1a1040] to-slate-900 p-8 mb-6 shadow-2xl border border-white/10">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_rgba(123,97,255,0.25),_transparent_60%)] pointer-events-none" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,_rgba(16,185,129,0.15),_transparent_60%)] pointer-events-none" />
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2.5 rounded-xl bg-white/10 border border-white/20">
              <Info className="w-5 h-5 text-white" />
            </div>
            <span className="text-xs font-black text-white/60 uppercase tracking-widest">How This Test Works</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white leading-tight mb-2">Read this before you start</h1>
          <p className="text-white/60 text-sm leading-relaxed">
            This is not a regular reading quiz. It is a timed, fully automated reading simulation.
            Once it starts, every phase runs on a clock. There are no pause buttons.
          </p>
          <div className={`inline-flex items-center gap-2 mt-4 px-4 py-2 rounded-full border ${cfg.bg} ${cfg.border} ${cfg.color}`}>
            {cfg.icon}
            <span className="font-black text-sm">{cfg.label} Mode — {cfg.wpm} WPM</span>
          </div>
        </div>
      </div>

      <div className="space-y-4 mb-6">
        {steps.map((step, i) => (
          <div key={i} className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm">
            <div className="flex gap-4">
              <div className={`p-2.5 rounded-xl shrink-0 ${step.color}`}>{step.icon}</div>
              <div className="flex-1">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Step {i + 1}</span>
                <h3 className="text-base font-black text-slate-900 dark:text-white mb-1 mt-0.5">{step.title}</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">{step.desc}</p>
                {step.warning && (
                  <div className="flex items-start gap-2 mt-2 p-2.5 rounded-lg bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20">
                    <AlertTriangle className="w-3.5 h-3.5 text-amber-500 shrink-0 mt-0.5" />
                    <p className="text-xs font-bold text-amber-700 dark:text-amber-400">{step.warning}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-slate-900 dark:bg-black/40 rounded-2xl border border-white/10 p-5 mb-6">
        <h3 className="text-xs font-black text-white/50 uppercase tracking-widest mb-3">Quick Rules</h3>
        <div className="grid grid-cols-2 gap-2">
          {[
            { icon: '⛔', text: 'No pause during passage' },
            { icon: '⛔', text: 'No re-reading after timer' },
            { icon: '⛔', text: 'No Submit / Next buttons' },
            { icon: '✅', text: 'Select option before timer ends' },
            { icon: '✅', text: 'Unanswered = counted wrong' },
            { icon: '✅', text: 'All questions auto-advance' },
          ].map((r, i) => (
            <div key={i} className="flex items-center gap-2 text-xs text-white/70">
              <span>{r.icon}</span><span>{r.text}</span>
            </div>
          ))}
        </div>
      </div>

      <button
        onClick={onStart}
        className="w-full h-14 rounded-2xl font-black text-lg text-white transition-all active:scale-[0.98] shadow-xl"
        style={{ background: 'linear-gradient(135deg, #7B61FF 0%, #a855f7 100%)', boxShadow: '0 8px 32px rgba(123,97,255,0.4)' }}
      >
        <span className="flex items-center justify-center gap-2">
          <Play className="w-5 h-5 fill-white" /> I Understand — Start Reading
        </span>
      </button>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// MAIN COMPONENT
// ─────────────────────────────────────────────────────────────────────────────

export default function ReadingPractice() {
  const navigate  = useNavigate();
  const { toast } = useToast();
  const { addPoints } = useMomentum();

  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isSidebarHovered,   setIsSidebarHovered]   = useState(false);
  const [view, setView] = useState<ViewState>('library');

  // ── Library ────────────────────────────────────────────────────────────────
  const [passages,        setPassages]        = useState<SpeedReadingReportSummary[]>([]);
  const [loadingPassages, setLoadingPassages] = useState(true);
  const [activeCategory,  setActiveCategory]  = useState<string>('All');

  // ── Speed & passage selection ──────────────────────────────────────────────
  const [speed,           setSpeed]           = useState<SpeedLevel>('normal');
  const [pendingSummary,  setPendingSummary]  = useState<SpeedReadingReportSummary | null>(null);
  const [selectedPassage, setSelectedPassage] = useState<SpeedReadingReport | null>(null);
  const [loadingPassage,  setLoadingPassage]  = useState(false);

  // ── Reading phase ──────────────────────────────────────────────────────────
  const [words,            setWords]           = useState<string[]>([]);
  const [highlightIdx,     setHighlightIdx]    = useState(-1);
  const [sweepComplete,    setSweepComplete]   = useState(false);
  const [passageTimeLeft,  setPassageTimeLeft] = useState(0);
  const [passageTotalTime, setPassageTotalTime] = useState(0);
  const [readingStarted,   setReadingStarted]  = useState(false);

  // ── Keyword set — computed once when passage + questions are loaded ─────────
  // Passed into FisheyePassage so it can persist keyword visibility during sweep
  const [keywords, setKeywords] = useState<Set<string>>(new Set());

  const passageHighlightRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const passageTimerRef     = useRef<ReturnType<typeof setInterval> | null>(null);

  // ── Quiz phase ─────────────────────────────────────────────────────────────
  const [quizIdx,         setQuizIdx]         = useState(0);
  const [answers,         setAnswers]         = useState<Record<string, string>>({});
  const answersRef = useRef<Record<string, string>>({});
  const [questionWordIdx, setQuestionWordIdx] = useState(-1);
  const [questionFaded,   setQuestionFaded]   = useState(false);
  const [answerTimeLeft,  setAnswerTimeLeft]  = useState(0);
  const [answerTotalTime, setAnswerTotalTime] = useState(0);
  const [quizPhase,       setQuizPhase]       = useState<'highlight' | 'answer' | 'transitioning'>('highlight');
  const [selectedThisQ,   setSelectedThisQ]  = useState<string | null>(null);

  const questionHighlightRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const answerTimerRef       = useRef<ReturnType<typeof setInterval> | null>(null);
  const transitionRef        = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ── Results ────────────────────────────────────────────────────────────────
  const [results,    setResults]   = useState<ReadingPracticeResult | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [elapsed,    setElapsed]   = useState(0);
  const elapsedRef  = useRef(0);
  const elapsedTick = useRef<ReturnType<typeof setInterval> | null>(null);

  // ─── Load passages ──────────────────────────────────────────────────────────
  useEffect(() => {
    (async () => {
      try {
        const data = await fetchSpeedReadingReports();
        setPassages(data);
      } catch {
        toast({ title: 'Error', description: 'Failed to load passages.', variant: 'destructive' });
      } finally {
        setLoadingPassages(false);
      }
    })();
  }, []);

  // ─── Derived ─────────────────────────────────────────────────────────────────
  const categories       = useMemo(() => ['All', ...Array.from(new Set(passages.map(p => p.category)))], [passages]);
  const filteredPassages = useMemo(() =>
    activeCategory === 'All' ? passages : passages.filter(p => p.category === activeCategory),
  [passages, activeCategory]);

  const questions = useMemo(() => selectedPassage?.questions ?? [], [selectedPassage]);
  const curQ      = questions[quizIdx];

  // ─── Cleanup ──────────────────────────────────────────────────────────────
  const clearAll = useCallback(() => {
    if (passageHighlightRef.current) { clearInterval(passageHighlightRef.current);  passageHighlightRef.current = null; }
    if (passageTimerRef.current)     { clearInterval(passageTimerRef.current);      passageTimerRef.current = null; }
    if (questionHighlightRef.current){ clearInterval(questionHighlightRef.current); questionHighlightRef.current = null; }
    if (answerTimerRef.current)      { clearInterval(answerTimerRef.current);       answerTimerRef.current = null; }
    if (transitionRef.current)       { clearTimeout(transitionRef.current);         transitionRef.current = null; }
    if (elapsedTick.current)         { clearInterval(elapsedTick.current);          elapsedTick.current = null; }
  }, []);

  useEffect(() => () => clearAll(), [clearAll]);

  // ─────────────────────────────────────────────────────────────────────────────
  // START READING
  // ─────────────────────────────────────────────────────────────────────────────

  const startReading = useCallback(async () => {
    if (!pendingSummary) return;
    setLoadingPassage(true);
    try {
      const full = await fetchSpeedReadingReportById(pendingSummary.id);
      setSelectedPassage(full);
      const w = full.text.trim().split(/\s+/);
      setWords(w);
      setHighlightIdx(-1);
      setSweepComplete(false);
      setReadingStarted(false);

      // ── Compute keywords before reading starts ──────────────────────────
      // This is the pre-computation step: passage words + question words
      // combined into one keyword set that FisheyePassage uses throughout.
      const kw = extractKeywords(full.text, full.questions ?? []);
      setKeywords(kw);

      const totalSecs = calcPassageTime(w.length, speed);
      setPassageTotalTime(totalSecs);
      setPassageTimeLeft(totalSecs);
      setAnswers({});
      answersRef.current = {};
      setResults(null);
      setElapsed(0);
      elapsedRef.current = 0;

      setView('reading');

      if (elapsedTick.current) clearInterval(elapsedTick.current);
      elapsedTick.current = setInterval(() => {
        elapsedRef.current += 1;
        setElapsed(elapsedRef.current);
      }, 1000);

      setTimeout(() => {
        setReadingStarted(true);
        setHighlightIdx(0);
        const cfg = SPEED_CONFIGS[speed];

        // Highlight sweep — moves one word per tick
        // The chunk window [idx, idx + CHUNK_SIZE - 1] is rendered by FisheyePassage
        let idx = 0;
        passageHighlightRef.current = setInterval(() => {
          idx += 1;
          setHighlightIdx(idx);
          if (idx >= w.length - 1) {
            if (passageHighlightRef.current) clearInterval(passageHighlightRef.current);
            // Sweep done — clear all blur/fade, passage fully readable
            setSweepComplete(true);
          }
        }, cfg.msPerWord);

        // Passage countdown timer
        let remaining = totalSecs;
        passageTimerRef.current = setInterval(() => {
          remaining -= 1;
          setPassageTimeLeft(remaining);
          if (remaining <= 0) {
            if (passageTimerRef.current) clearInterval(passageTimerRef.current);
            if (passageHighlightRef.current) clearInterval(passageHighlightRef.current);
            startQuiz(0, full.questions ?? []);
          }
        }, 1000);
      }, 800);

    } catch {
      toast({ title: 'Error', description: 'Failed to load passage.', variant: 'destructive' });
    } finally {
      setLoadingPassage(false);
    }
  }, [pendingSummary, speed]);

  // ─────────────────────────────────────────────────────────────────────────────
  // QUIZ LOGIC
  // ─────────────────────────────────────────────────────────────────────────────

  const startQuiz = useCallback((qIdx: number, qs: any[]) => {
    if (qIdx >= qs.length) { submitQuiz(qs); return; }

    const q      = qs[qIdx];
    const cfg    = SPEED_CONFIGS[speed];
    const qWords = q.stem.trim().split(/\s+/);

    setView('quiz');
    setQuizIdx(qIdx);
    setQuizPhase('highlight');
    setQuestionWordIdx(0);
    setQuestionFaded(false);
    setSelectedThisQ(null);

    const ansTime = calcAnswerTime(q.stem, speed);
    setAnswerTotalTime(ansTime);
    setAnswerTimeLeft(ansTime);

    const questionMs = Math.round(cfg.msPerWord * cfg.questionWpmMult);
    let wIdx = 0;
    questionHighlightRef.current = setInterval(() => {
      wIdx += 1;
      setQuestionWordIdx(wIdx);
      if (wIdx >= qWords.length - 1) {
        if (questionHighlightRef.current) clearInterval(questionHighlightRef.current);
        setTimeout(() => {
          setQuestionFaded(true);
          setTimeout(() => {
            setQuizPhase('answer');
            let rem = ansTime;
            answerTimerRef.current = setInterval(() => {
              rem -= 1;
              setAnswerTimeLeft(rem);
              if (rem <= 0) {
                if (answerTimerRef.current) clearInterval(answerTimerRef.current);
                advanceQuestion(qIdx, qs);
              }
            }, 1000);
          }, 400);
        }, 300);
      }
    }, questionMs);
  }, [speed]);

  const advanceQuestion = useCallback((currentIdx: number, qs: any[]) => {
    if (questionHighlightRef.current) clearInterval(questionHighlightRef.current);
    if (answerTimerRef.current)       clearInterval(answerTimerRef.current);
    setQuizPhase('transitioning');
    transitionRef.current = setTimeout(() => { startQuiz(currentIdx + 1, qs); }, 500);
  }, [startQuiz]);

  const handleSelectOption = useCallback((opt: string, qId: string) => {
    setSelectedThisQ(opt);
    setAnswers(prev => {
      const next = { ...prev, [qId]: opt };
      answersRef.current = next;
      return next;
    });
  }, []);

  // ─────────────────────────────────────────────────────────────────────────────
  // SUBMIT
  // ─────────────────────────────────────────────────────────────────────────────

  const submitQuiz = useCallback(async (qs: any[]) => {
    clearAll();
    setSubmitting(true);
    setView('results');

    const finalAnswers = answersRef.current;

    try {
      const readingTimeSeconds = Math.max(10, elapsedRef.current);
      const wpmCalc = selectedPassage
        ? Math.round((selectedPassage.wordCount ?? words.length) / (readingTimeSeconds / 60))
        : SPEED_CONFIGS[speed].wpm;

      const evaluation = await submitReadingPracticeSession({
        reportId:          selectedPassage!.id,
        passageTitle:      selectedPassage!.title,
        category:          selectedPassage!.category,
        wordCount:         selectedPassage!.wordCount,
        readingTimeSeconds,
        wpm:               wpmCalc,
        answers: qs.map(q => ({ questionId: q.id, selectedOption: finalAnswers[q.id] ?? '' })),
      });
      setResults(evaluation);
      addPoints(50, 'Completed Reading Module');
      stampPassportSlot('reading');
    } catch {
      const correct   = qs.filter(q => finalAnswers[q.id] === q.answer).length;
      const total     = qs.length;
      const retention = total > 0 ? Math.round((correct / total) * 100) : 0;
      setResults({
        retentionScore:    retention,
        wpm:               SPEED_CONFIGS[speed].wpm,
        readingTimeSeconds: elapsedRef.current,
        correct, total,
        grade:             getGrade(retention),
        speedCategory:     speed,
        speedScore:        0,
        efficiencyScore:   retention,
        feedback:          ['Computed offline — check your connection.'],
        idealWpmSuggestion: SPEED_CONFIGS[speed].wpm,
        scoredAnswers: qs.map(q => ({
          questionId:    q.id,
          type:          q.type,
          stem:          q.stem,
          options:       q.options,
          correctAnswer: q.answer,
          userAnswer:    finalAnswers[q.id] ?? '',
          isCorrect:     finalAnswers[q.id] === q.answer,
          explanation:   q.explanation ?? null,
        })),
      } as any);
      addPoints(50, 'Completed Reading Module (Offline)');
      stampPassportSlot('reading');
    } finally {
      setSubmitting(false);
    }
  }, [answers, selectedPassage, speed, words.length, clearAll, addPoints]);

  const advanceRef = useRef(advanceQuestion);
  useEffect(() => { advanceRef.current = advanceQuestion; }, [advanceQuestion]);

  const handleRestart = () => {
    clearAll();
    setSelectedPassage(null);
    setPendingSummary(null);
    setResults(null);
    setAnswers({});
    answersRef.current = {};
    setElapsed(0);
    elapsedRef.current = 0;
    setWords([]);
    setHighlightIdx(-1);
    setSweepComplete(false);
    setReadingStarted(false);
    setKeywords(new Set());
    setView('library');
  };

  // ─────────────────────────────────────────────────────────────────────────────
  // LOADING OVERLAY
  // ─────────────────────────────────────────────────────────────────────────────

  if (loadingPassage) {
    return (
      <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-[#F8FAFC] dark:bg-slate-950 gap-4">
        <div className="relative">
          <div className="w-20 h-20 rounded-2xl bg-[#7B61FF]/10 flex items-center justify-center">
            <BookOpen className="w-10 h-10 text-[#7B61FF]" />
          </div>
          <div className="absolute -inset-2 rounded-3xl border-2 border-[#7B61FF]/20 animate-ping" />
        </div>
        <p className="text-slate-500 font-semibold animate-pulse">Loading passage…</p>
      </div>
    );
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // RENDER
  // ─────────────────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-slate-950 transition-colors duration-300">
      <StudentSidebar
        activeTab="reading"
        isCollapsed={isSidebarCollapsed}
        toggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
        onMouseEnter={() => setIsSidebarHovered(true)}
        onMouseLeave={() => setIsSidebarHovered(false)}
      />

      <div className={`transition-all duration-300 ease-in-out pl-0 ${isSidebarHovered ? 'md:pl-[288px]' : 'md:pl-[116px]'} flex flex-col min-h-screen`}>
        <StudentTopbar onUpgradeClick={() => {}} />

        <main className="flex-1 p-4 sm:p-6 lg:p-8">

          {/* ══════════════════════════════════════════════════════════════
              VIEW 1 — LIBRARY
          ══════════════════════════════════════════════════════════════ */}
          {view === 'library' && (
            <div className="space-y-6 animate-in fade-in duration-400">
              <div className="relative overflow-hidden rounded-3xl p-8 md:p-10 text-white shadow-2xl"
                style={{ background: 'linear-gradient(135deg, #0f0c29 0%, #302b63 50%, #24243e 100%)' }}>
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_rgba(123,97,255,0.4),_transparent_60%)] pointer-events-none" />
                <div className="absolute bottom-0 left-0 w-64 h-64 rounded-full bg-emerald-500/10 blur-3xl pointer-events-none" />
                <div className="absolute inset-0 opacity-[0.03] pointer-events-none"
                  style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,1) 1px, transparent 1px)', backgroundSize: '32px 32px' }} />
                <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
                  <div>
                    <div className="flex items-center gap-2 mb-3">
                      <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                      <span className="text-xs font-black text-white/50 uppercase tracking-[0.2em]">IELTS Reading Practice</span>
                    </div>
                    <h1 className="text-3xl md:text-4xl font-black mb-3 leading-tight">
                      Timed Comprehension<br />
                      <span className="text-transparent bg-clip-text" style={{ backgroundImage: 'linear-gradient(90deg, #a78bfa, #34d399)' }}>
                        Under Pressure
                      </span>
                    </h1>
                    <p className="text-white/60 max-w-lg text-sm leading-relaxed">
                      Read with chunk-based word highlighting. Answer before the timer runs out. No pause. No replay.
                      Built to simulate real IELTS exam conditions.
                    </p>
                  </div>
                  <button
                    onClick={() => navigate('/student/reading-assessment/history')}
                    className="flex items-center gap-2 px-5 py-3 rounded-xl font-bold text-sm border border-white/20 bg-white/10 hover:bg-white/20 transition-all whitespace-nowrap"
                  >
                    <History className="w-4 h-4" /> My History
                  </button>
                </div>
              </div>

              {!loadingPassages && categories.length > 1 && (
                <div className="flex items-center gap-2 overflow-x-auto pb-1">
                  {categories.map(cat => (
                    <button key={cat} onClick={() => setActiveCategory(cat)}
                      className={`flex-shrink-0 px-4 py-2 rounded-full text-sm font-bold transition-all duration-200 ${
                        activeCategory === cat
                          ? 'bg-[#7B61FF] text-white shadow-md shadow-[#7B61FF]/30'
                          : 'bg-white dark:bg-slate-900 text-slate-500 border border-slate-200 dark:border-slate-800 hover:border-[#7B61FF]/50'
                      }`}>
                      {cat}
                    </button>
                  ))}
                </div>
              )}

              {loadingPassages ? (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-5">
                  {[1,2,3,4,5,6].map(i => <div key={i} className="h-52 bg-slate-200 dark:bg-slate-800 rounded-2xl animate-pulse" />)}
                </div>
              ) : filteredPassages.length === 0 ? (
                <div className="flex flex-col items-center justify-center p-16 text-center bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800">
                  <BookOpen className="h-12 w-12 text-slate-300 dark:text-slate-600 mb-4" />
                  <p className="text-slate-500 font-medium">No passages for this category.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-5">
                  {filteredPassages.map(passage => (
                    <button
                      key={passage.id}
                      onClick={() => { setPendingSummary(passage); setView('speed-setup'); }}
                      className="group text-left bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm hover:shadow-lg hover:border-[#7B61FF] transition-all duration-300 flex flex-col gap-3"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <span className="text-sm font-black text-slate-800 dark:text-slate-100 group-hover:text-[#7B61FF] transition-colors leading-snug line-clamp-2">
                          {passage.title}
                        </span>
                        <Badge className="shrink-0 bg-indigo-50 dark:bg-[#7B61FF]/20 text-[#7B61FF] dark:text-[#9b86ff] text-xs border-0">
                          {passage.category}
                        </Badge>
                      </div>
                      <p className="text-xs text-slate-400 line-clamp-1">{passage.source}</p>
                      <div className="mt-auto pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                        <span className="text-xs text-slate-400 flex items-center gap-1">
                          <FileText className="w-3 h-3" /> {passage.wordCount} words
                        </span>
                        <span className="text-xs text-[#7B61FF] font-black flex items-center gap-1 group-hover:translate-x-0.5 transition-transform">
                          Choose Speed <ChevronRight className="w-3 h-3" />
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ══════════════════════════════════════════════════════════════
              VIEW 2 — SPEED SETUP
          ══════════════════════════════════════════════════════════════ */}
          {view === 'speed-setup' && pendingSummary && (
            <div className="max-w-xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-400 space-y-6">
              <button onClick={() => setView('library')} className="flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors">
                <ArrowLeft className="w-4 h-4" /> Back to Library
              </button>

              <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm flex gap-4">
                <div className="p-3 rounded-xl bg-[#7B61FF]/10 shrink-0">
                  <BookMarked className="w-6 h-6 text-[#7B61FF]" />
                </div>
                <div>
                  <p className="text-xs font-black text-[#7B61FF] uppercase tracking-widest mb-1">{pendingSummary.category}</p>
                  <h2 className="text-lg font-black text-slate-900 dark:text-white leading-snug">{pendingSummary.title}</h2>
                  <p className="text-xs text-slate-400 mt-1">{pendingSummary.wordCount} words</p>
                </div>
              </div>

              <div>
                <h3 className="text-sm font-black text-slate-700 dark:text-slate-300 uppercase tracking-widest mb-3">
                  Select Highlight Speed
                </h3>
                <div className="space-y-3">
                  {(Object.entries(SPEED_CONFIGS) as [SpeedLevel, SpeedConfig][]).map(([key, cfg]) => {
                    const selected    = speed === key;
                    const passageTime = calcPassageTime(pendingSummary.wordCount, key);
                    return (
                      <button key={key} onClick={() => setSpeed(key)}
                        className={`w-full flex items-center gap-4 p-4 rounded-2xl border-2 text-left transition-all duration-200 ${
                          selected
                            ? `${cfg.border} ${cfg.bg}`
                            : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 hover:border-slate-300'
                        }`}>
                        <div className={`p-2 rounded-xl ${selected ? cfg.color : 'text-slate-400'} ${selected ? cfg.bg : 'bg-slate-100 dark:bg-slate-800'}`}>
                          {cfg.icon}
                        </div>
                        <div className="flex-1">
                          <p className={`font-black text-sm ${selected ? cfg.color : 'text-slate-800 dark:text-slate-100'}`}>{cfg.label}</p>
                          <p className="text-xs text-slate-400">{cfg.desc}</p>
                        </div>
                        <div className="text-right shrink-0">
                          <p className={`text-xs font-black ${selected ? cfg.color : 'text-slate-400'}`}>{cfg.wpm} WPM</p>
                          <p className="text-[10px] text-slate-400">{formatTime(passageTime)} reading</p>
                        </div>
                        {selected && (
                          <div className="w-5 h-5 rounded-full bg-[#7B61FF] flex items-center justify-center shrink-0">
                            <CheckCircle2 className="w-3 h-3 text-white" />
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              <button
                onClick={() => setView('guide')}
                className="w-full h-14 rounded-2xl font-black text-base text-white transition-all active:scale-[0.98]"
                style={{ background: 'linear-gradient(135deg, #7B61FF 0%, #a855f7 100%)', boxShadow: '0 8px 32px rgba(123,97,255,0.35)' }}
              >
                <span className="flex items-center justify-center gap-2">
                  <Info className="w-5 h-5" /> See How It Works
                </span>
              </button>
            </div>
          )}

          {/* ══════════════════════════════════════════════════════════════
              VIEW 3 — PRE-TEST GUIDE
          ══════════════════════════════════════════════════════════════ */}
          {view === 'guide' && (
            <GuideScreen
              speed={speed}
              onBack={() => setView('speed-setup')}
              onStart={startReading}
            />
          )}

          {/* ══════════════════════════════════════════════════════════════
              VIEW 4 — READING
          ══════════════════════════════════════════════════════════════ */}
          {view === 'reading' && selectedPassage && (
            <div className="max-w-4xl mx-auto animate-in fade-in duration-300">

              <div className="flex items-center justify-between mb-4 gap-4">
                <div>
                  <p className="text-xs font-black text-slate-400 uppercase tracking-widest">{selectedPassage.category}</p>
                  <h2 className="text-base font-black text-slate-900 dark:text-white leading-tight line-clamp-1">
                    {selectedPassage.title}
                  </h2>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <div className={`hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-black ${SPEED_CONFIGS[speed].bg} ${SPEED_CONFIGS[speed].border} ${SPEED_CONFIGS[speed].color}`}>
                    <Gauge className="w-3.5 h-3.5" /> {SPEED_CONFIGS[speed].wpm} WPM
                  </div>
                  <TimerRing value={passageTimeLeft} max={passageTotalTime} size={72} urgent={passageTimeLeft <= 10} />
                </div>
              </div>

              <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 sm:p-10 shadow-sm mb-4 relative overflow-hidden">
                <div className="absolute inset-0 opacity-[0.02] pointer-events-none"
                  style={{ backgroundImage: 'linear-gradient(rgba(0,0,0,1) 1px, transparent 1px), linear-gradient(90deg, rgba(0,0,0,1) 1px, transparent 1px)', backgroundSize: '24px 24px' }} />
                {!readingStarted ? (
                  <div className="flex items-center justify-center py-16">
                    <Loader2 className="w-8 h-8 text-[#7B61FF] animate-spin" />
                  </div>
                ) : (
                  // ── FisheyePassage now receives the keywords Set ──────────────
                  <FisheyePassage
                    text={selectedPassage.text}
                    activeIndex={highlightIdx}
                    speed={speed}
                    sweepComplete={sweepComplete}
                    keywords={keywords}
                  />
                )}
              </div>

              <div className="h-1.5 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-1000 ease-linear"
                  style={{
                    width: `${(passageTotalTime - passageTimeLeft) / passageTotalTime * 100}%`,
                    background: passageTimeLeft <= 10
                      ? 'linear-gradient(90deg, #ef4444, #f97316)'
                      : 'linear-gradient(90deg, #7B61FF, #a855f7)',
                  }}
                />
              </div>

              <div className="flex items-center justify-between mt-2 text-xs text-slate-400 font-medium">
                <span>
                  {sweepComplete
                    ? <span className="text-emerald-500 font-bold flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Highlight complete — review the passage before questions begin
                      </span>
                    : 'Reading passage — follow the chunk highlight'
                  }
                </span>
                <span className={passageTimeLeft <= 10 ? 'text-rose-500 font-black animate-pulse' : ''}>
                  {passageTimeLeft}s remaining
                </span>
              </div>
            </div>
          )}

          {/* ══════════════════════════════════════════════════════════════
              VIEW 5 — QUIZ
          ══════════════════════════════════════════════════════════════ */}
          {view === 'quiz' && curQ && (
            <div className="max-w-2xl mx-auto animate-in fade-in duration-300 space-y-5">

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Brain className="w-4 h-4 text-[#7B61FF]" />
                  <span className="text-xs font-black text-[#7B61FF] uppercase tracking-widest">
                    Question {quizIdx + 1} of {questions.length}
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  {questions.map((_, i) => (
                    <div key={i} className={`w-2 h-2 rounded-full transition-all ${
                      i < quizIdx  ? 'bg-emerald-400' :
                      i === quizIdx ? 'bg-[#7B61FF] scale-125' :
                      'bg-slate-300 dark:bg-slate-600'
                    }`} />
                  ))}
                </div>
              </div>

              <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 sm:p-8 shadow-sm relative overflow-hidden min-h-[140px]">
                <div className={`absolute top-0 right-0 w-32 h-32 rounded-full blur-3xl pointer-events-none opacity-20 ${SPEED_CONFIGS[speed].bg}`} />
                <div className="relative z-10">
                  <QuestionHighlighter
                    text={curQ.stem}
                    activeIndex={questionWordIdx}
                    speed={speed}
                    faded={questionFaded}
                  />
                </div>
                {quizPhase === 'answer' && (
                  <div className="absolute top-4 right-4">
                    <TimerRing value={answerTimeLeft} max={answerTotalTime} size={56} urgent={answerTimeLeft <= 5} />
                  </div>
                )}
              </div>

              <div className={`space-y-3 transition-all duration-500 ${
                quizPhase === 'answer' ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4 pointer-events-none'
              }`}>
                {quizPhase === 'answer' && (
                  <>
                    <div className="flex items-center justify-between px-1">
                      <p className="text-xs font-bold text-slate-400">Select your answer before the timer ends</p>
                      <p className={`text-xs font-black ${answerTimeLeft <= 5 ? 'text-rose-500 animate-pulse' : 'text-slate-400'}`}>
                        {answerTimeLeft}s
                      </p>
                    </div>

                    {curQ.type === 'MCQ' && curQ.options.map((opt: string, oi: number) => {
                      const letter   = String.fromCharCode(65 + oi);
                      const selected = selectedThisQ === opt;
                      return (
                        <button key={oi} onClick={() => handleSelectOption(opt, curQ.id)}
                          className={`w-full flex items-center gap-3 p-4 rounded-2xl border-2 text-left transition-all duration-150 active:scale-[0.98] ${
                            selected
                              ? 'border-[#7B61FF] bg-indigo-50 dark:bg-[#7B61FF]/10 shadow-md shadow-[#7B61FF]/10'
                              : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 hover:border-[#7B61FF]/50'
                          }`}>
                          <span className={`w-9 h-9 shrink-0 rounded-xl flex items-center justify-center text-sm font-black transition-all ${
                            selected ? 'bg-[#7B61FF] text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
                          }`}>
                            {letter}
                          </span>
                          <span className={`text-sm font-medium flex-1 break-words ${selected ? 'text-[#7B61FF] dark:text-indigo-200' : 'text-slate-700 dark:text-slate-300'}`}>
                            {opt}
                          </span>
                          {selected && <CheckCircle2 className="w-5 h-5 text-[#7B61FF] ml-auto shrink-0" />}
                        </button>
                      );
                    })}

                    {curQ.type === 'TRUE_FALSE_NOT_GIVEN' && (
                      <div className="grid grid-cols-3 gap-3">
                        {curQ.options.map((opt: string) => {
                          const sel = selectedThisQ === opt;
                          const colMap: Record<string, string> = {
                            'True':      sel ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700' : 'border-slate-200 dark:border-slate-700 hover:border-emerald-400',
                            'False':     sel ? 'border-rose-500 bg-rose-50 dark:bg-rose-900/20 text-rose-600'             : 'border-slate-200 dark:border-slate-700 hover:border-rose-400',
                            'Not Given': sel ? 'border-amber-500 bg-amber-50 dark:bg-amber-900/20 text-amber-700'         : 'border-slate-200 dark:border-slate-700 hover:border-amber-400',
                          };
                          return (
                            <button key={opt} onClick={() => handleSelectOption(opt, curQ.id)}
                              className={`py-5 rounded-2xl border-2 font-black text-sm transition-all bg-white dark:bg-slate-900 active:scale-[0.97] ${colMap[opt] ?? colMap['Not Given']}`}>
                              {opt}
                            </button>
                          );
                        })}
                      </div>
                    )}

                    {!selectedThisQ && answerTimeLeft <= 8 && (
                      <div className="flex items-center gap-2 p-3 rounded-xl bg-rose-50 dark:bg-rose-900/20 border border-rose-200 dark:border-rose-800 animate-in fade-in duration-300">
                        <AlertTriangle className="w-4 h-4 text-rose-500 shrink-0" />
                        <p className="text-xs font-bold text-rose-600 dark:text-rose-400">
                          No answer selected — time running out! Select now or it counts as wrong.
                        </p>
                      </div>
                    )}
                  </>
                )}

                {quizPhase === 'highlight' && (
                  <div className="flex items-center justify-center py-6 gap-3 text-slate-400">
                    <div className="flex gap-1">
                      <div className="w-2 h-2 rounded-full bg-slate-300 animate-bounce" style={{ animationDelay: '0ms' }} />
                      <div className="w-2 h-2 rounded-full bg-slate-300 animate-bounce" style={{ animationDelay: '150ms' }} />
                      <div className="w-2 h-2 rounded-full bg-slate-300 animate-bounce" style={{ animationDelay: '300ms' }} />
                    </div>
                    <span className="text-sm font-medium">Read the question…</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ══════════════════════════════════════════════════════════════
              TRANSITIONING
          ══════════════════════════════════════════════════════════════ */}
          {view === 'quiz' && quizPhase === 'transitioning' && (
            <div className="flex items-center justify-center py-20">
              <div className="flex flex-col items-center gap-3">
                <div className="flex gap-1.5">
                  {[0,1,2].map(i => (
                    <div key={i} className="w-3 h-3 rounded-full bg-[#7B61FF] animate-bounce"
                      style={{ animationDelay: `${i * 120}ms` }} />
                  ))}
                </div>
                <p className="text-sm font-medium text-slate-400">Next question…</p>
              </div>
            </div>
          )}

          {/* ══════════════════════════════════════════════════════════════
              VIEW 6 — RESULTS
          ══════════════════════════════════════════════════════════════ */}
          {view === 'results' && (
            <div className="max-w-3xl mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
              {submitting ? (
                <div className="flex flex-col items-center justify-center py-24 gap-4">
                  <Loader2 className="w-10 h-10 text-[#7B61FF] animate-spin" />
                  <p className="text-slate-500 font-medium animate-pulse">Calculating your score…</p>
                </div>
              ) : results ? (
                <>
                  <div className="relative overflow-hidden rounded-3xl p-8 text-white text-center shadow-2xl"
                    style={{ background: 'linear-gradient(135deg, #0f0c29 0%, #302b63 60%, #24243e 100%)' }}>
                    <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_rgba(123,97,255,0.3),_transparent_60%)] pointer-events-none" />
                    <div className="relative z-10">
                      <div className="w-20 h-20 rounded-full border-2 border-white/20 bg-white/10 flex items-center justify-center mx-auto mb-4">
                        <Trophy className="w-10 h-10 text-yellow-300" />
                      </div>
                      <p className="text-white/50 text-xs font-black uppercase tracking-[0.2em] mb-2">Your Grade</p>
                      <div className={`text-8xl font-black mb-3 ${results.grade === 'F' ? 'text-rose-400' : 'text-white'}`}
                        style={results.grade !== 'F' ? { textShadow: '0 0 40px rgba(123,97,255,0.6)' } : {}}>
                        {results.grade}
                      </div>
                      <p className="text-white/60 text-sm max-w-sm mx-auto">
                        {results.feedback?.[0] ?? 'Great effort! Keep practising.'}
                      </p>
                      <div className="inline-flex items-center gap-2 mt-4 px-4 py-2 rounded-full bg-amber-400/20 border border-amber-400/30">
                        <Zap className="w-4 h-4 text-amber-400 fill-amber-400" />
                        <span className="text-amber-300 font-black text-sm">+50 Momentum Earned</span>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {[
                      { label: 'Correct',   value: `${results.correct}/${results.total}`,         color: 'text-emerald-500' },
                      { label: 'Retention', value: `${Math.round(results.retentionScore)}%`,       color: getScoreColor(results.retentionScore) },
                      { label: 'Speed',     value: `${SPEED_CONFIGS[speed].label}`,                color: SPEED_CONFIGS[speed].color },
                      { label: 'Read Time', value: formatTime(results.readingTimeSeconds),          color: 'text-slate-600 dark:text-slate-300' },
                    ].map(s => (
                      <div key={s.label} className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 text-center shadow-sm">
                        <p className={`text-xl font-black ${s.color}`}>{s.value}</p>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">{s.label}</p>
                      </div>
                    ))}
                  </div>

                  {results.scoredAnswers && results.scoredAnswers.length > 0 && (
                    <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm">
                      <h3 className="text-sm font-black text-slate-800 dark:text-white uppercase tracking-widest mb-4 flex items-center gap-2">
                        <BarChart2 className="w-4 h-4 text-[#7B61FF]" /> Answer Review
                      </h3>
                      <div className="space-y-4">
                        {results.scoredAnswers.map((sa: any, i: number) => (
                          <div key={sa.questionId} className={`p-4 rounded-2xl border ${
                            sa.isCorrect
                              ? 'border-emerald-200 bg-emerald-50 dark:border-emerald-900/40 dark:bg-emerald-900/10'
                              : 'border-rose-200 bg-rose-50 dark:border-rose-900/40 dark:bg-rose-900/10'
                          }`}>
                            <div className="flex items-start gap-3">
                              <div className="shrink-0 mt-0.5">
                                {sa.isCorrect
                                  ? <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                                  : <XCircle className="w-5 h-5 text-rose-500" />}
                              </div>
                              <div className="flex-1 space-y-1.5">
                                <p className="text-sm font-bold text-slate-800 dark:text-slate-100">
                                  <span className="text-[#7B61FF] mr-1">Q{i + 1}.</span>{sa.stem}
                                </p>
                                <p className={`text-xs ${sa.isCorrect ? 'text-emerald-700 dark:text-emerald-400' : 'text-rose-700 dark:text-rose-400'}`}>
                                  <span className="font-bold">Your answer:</span> {sa.userAnswer || '(not answered)'}
                                </p>
                                {!sa.isCorrect && (
                                  <p className="text-xs text-emerald-700 dark:text-emerald-400">
                                    <span className="font-bold">Correct:</span> {sa.correctAnswer}
                                  </p>
                                )}
                                {sa.explanation && (
                                  <p className="text-xs text-slate-500 dark:text-slate-400 pt-1.5 border-t border-slate-200 dark:border-slate-700 mt-1">
                                    {sa.explanation}
                                  </p>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="flex flex-col sm:flex-row gap-3 pb-8">
                    <button onClick={handleRestart}
                      className="flex-1 flex items-center justify-center gap-2 py-4 rounded-2xl font-black text-sm text-white transition-all active:scale-[0.98]"
                      style={{ background: 'linear-gradient(135deg, #7B61FF, #a855f7)', boxShadow: '0 4px 20px rgba(123,97,255,0.3)' }}>
                      <BookOpen className="w-4 h-4" /> Back to Library
                    </button>
                    <button onClick={() => { setPendingSummary(pendingSummary); setView('speed-setup'); }}
                      className="flex-1 flex items-center justify-center gap-2 py-4 rounded-2xl font-bold text-sm border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:border-[#7B61FF] transition-all">
                      <RotateCcw className="w-4 h-4" /> Try Again
                    </button>
                    <button onClick={() => navigate('/student/reading-assessment/history')}
                      className="flex-1 flex items-center justify-center gap-2 py-4 rounded-2xl font-bold text-sm border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:border-[#7B61FF] transition-all">
                      <History className="w-4 h-4" /> My History
                    </button>
                  </div>
                </>
              ) : null}
            </div>
          )}

        </main>
      </div>
    </div>
  );
}