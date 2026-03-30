"use client";
import { GraduationCap } from "lucide-react";
import { Link } from 'react-router-dom';
import React, {
  useState,
  useEffect,
  useRef,
  useCallback,
} from "react";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { callBackend, uploadFileToBackend } from "@/features/auth/services/authClient";

// ─────────────────────────────────────────────────────────────────────────────
// TYPES & INTERFACES
// ─────────────────────────────────────────────────────────────────────────────

type Skill = "listening" | "reading" | "writing" | "speaking";
type Level = "A" | "B" | "C";
type GateState = "idle" | "in_progress" | "complete";
type SectionState =
  | "loading"
  | "ready"
  | "submitting"
  | "scoring"
  | "scored"
  | "error";
type RecordState =
  | "idle"
  | "recording"
  | "recorded"
  | "uploading"
  | "processing"
  | "done";

interface SkillResult {
  band_score: number;
  level: Level;
  sub_scores?: any;
  feedback?: string;
  transcript?: string;
}

interface DiagnosticStatus {
  listening_scored: boolean;
  reading_scored: boolean;
  writing_scored: boolean;
  speaking_scored: boolean;
  overall_complete: boolean;
}

interface AllResults {
  listening?: SkillResult;
  reading?: SkillResult;
  writing?: SkillResult;
  speaking?: SkillResult;
}

interface MCQOption {
  id: string;
  text: string;
}
interface MCQQuestion {
  id: string;
  text: string;
  options: MCQOption[];
}
interface TFNGQuestion {
  id: string;
  text: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// HELPERS & CONSTANTS
// ─────────────────────────────────────────────────────────────────────────────

const STUDENT_ID = "mock-student-abc-123";

function getBandLevel(score: number): Level {
  if (score <= 4.5) return "A";
  if (score <= 6.5) return "B";
  return "C";
}

function getLevelConfig(level: Level) {
  const configs = {
    A: {
      label: "Foundation",
      bg: "bg-amber-50",
      border: "border-amber-200",
      text: "text-amber-600",
      dot: "bg-amber-500",
      ring: "ring-amber-200",
    },
    B: {
      label: "Intermediate",
      bg: "bg-indigo-50",
      border: "border-indigo-200",
      text: "text-indigo-600",
      dot: "bg-indigo-500",
      ring: "ring-indigo-200",
    },
    C: {
      label: "Advanced",
      bg: "bg-teal-50",
      border: "border-teal-200",
      text: "text-teal-600",
      dot: "bg-teal-500",
      ring: "ring-teal-200",
    },
  };
  return configs[level];
}

function getAverageScore(results: AllResults): number {
  const scores = Object.values(results)
    .map((r) => r?.band_score ?? 0)
    .filter(Boolean);
  if (!scores.length) return 0;
  return scores.reduce((a, b) => a + b, 0) / scores.length;
}

function countWords(text: string): number {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

const SKILL_LABELS: Record<Skill, string> = {
  listening: "Listening",
  reading: "Reading",
  writing: "Writing",
  speaking: "Speaking",
};

const SKILL_ICONS: Record<Skill, string> = {
  listening: "🎧",
  reading: "📖",
  writing: "✍️",
  speaking: "🎤",
};

// ─────────────────────────────────────────────────────────────────────────────
// LOCAL STORAGE PERSISTENCE
// ─────────────────────────────────────────────────────────────────────────────

const SK = {
  phase:              "tc_phase",
  results:            "tc_results",
  listeningAnswers:   "tc_listening_answers",
  // FIX #5: persist audioPlayed so refresh can't replay audio
  listeningAudioPlayed: "tc_listening_audio_played",
  readingAnswers:     "tc_reading_answers",
  // FIX #2: persist reading timer so it resumes on refresh
  readingTimeLeft:    "tc_reading_time_left",
  writingText:        "tc_writing_text",
  // FIX #4: persist speaking result so refresh after submission recovers scorecard
  speakingResult:     "tc_speaking_result",
  // FIX #4: persist speaking submission state so partial uploads can be retried
  speakingSubmitting: "tc_speaking_submitting",
};

function storageSave<T>(key: string, value: T) {
  try { localStorage.setItem(key, JSON.stringify(value)); } catch {}
}

function storageLoad<T>(key: string): T | null {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch { return null; }
}

function storageClear(...keys: string[]) {
  try { keys.forEach((k) => localStorage.removeItem(k)); } catch {}
}

// ─────────────────────────────────────────────────────────────────────────────
// MOCK DATA
// ─────────────────────────────────────────────────────────────────────────────

const MOCK_LISTENING_QUESTIONS: MCQQuestion[] = [
  {
    id: "q1",
    text: "What is the main topic discussed in the audio?",
    options: [
      { id: "A", text: "Environmental conservation" },
      { id: "B", text: "Urban development planning" },
      { id: "C", text: "Public transportation systems" },
      { id: "D", text: "Water resource management" },
    ],
  },
  {
    id: "q2",
    text: "According to the speaker, when was the project first proposed?",
    options: [
      { id: "A", text: "In 2018" },
      { id: "B", text: "In 2020" },
      { id: "C", text: "In 2021" },
      { id: "D", text: "In 2023" },
    ],
  },
  {
    id: "q3",
    text: "Which department is primarily responsible for the initiative?",
    options: [
      { id: "A", text: "Department of Finance" },
      { id: "B", text: "Department of Infrastructure" },
      { id: "C", text: "Department of Environment" },
      { id: "D", text: "Department of Health" },
    ],
  },
  {
    id: "q4",
    text: "What percentage of the budget has been allocated to research?",
    options: [
      { id: "A", text: "15%" },
      { id: "B", text: "20%" },
      { id: "C", text: "25%" },
      { id: "D", text: "30%" },
    ],
  },
  {
    id: "q5",
    text: "What concern does the speaker raise about the timeline?",
    options: [
      { id: "A", text: "Lack of funding" },
      { id: "B", text: "Insufficient staffing" },
      { id: "C", text: "Regulatory delays" },
      { id: "D", text: "Public opposition" },
    ],
  },
  {
    id: "q6",
    text: "What is the expected outcome by the end of the programme?",
    options: [
      { id: "A", text: "A 40% reduction in emissions" },
      { id: "B", text: "Construction of 500 new homes" },
      { id: "C", text: "A fully operational metro line" },
      { id: "D", text: "Improved air quality index" },
    ],
  },
];

const MOCK_READING_PASSAGE = `
The rapid expansion of urban green spaces has become a central pillar of modern city planning strategy across several developed nations. Studies conducted over the past two decades suggest a strong correlation between access to parks and public gardens and the overall mental well-being of urban residents. Researchers at the University of Edinburgh noted that individuals who spend at least 30 minutes outdoors in a natural setting each week report significantly lower levels of anxiety and stress-related symptoms.

City councils in Amsterdam, Singapore, and Melbourne have invested heavily in 'biophilic design', a concept that integrates natural elements such as living walls, rooftop gardens, and tree-lined pedestrian corridors into the built environment. Proponents argue that such investments yield economic returns through reduced healthcare costs and increased property values in adjacent areas.

Critics, however, caution that green space development must not obscure deeper socioeconomic inequalities. Research published in the journal Urban Studies found that premium green spaces are disproportionately located in wealthier neighbourhoods, a phenomenon termed 'green gentrification'. The concern is that improvements to public spaces may inadvertently accelerate the displacement of low-income residents rather than improving quality of life for all citizens.
`.trim();

const MOCK_READING_QUESTIONS: TFNGQuestion[] = [
  {
    id: "q1",
    text: "Researchers have found a direct link between green space access and reduced levels of anxiety.",
  },
  {
    id: "q2",
    text: "Biophilic design was first developed by researchers at the University of Edinburgh.",
  },
  {
    id: "q3",
    text: "Green space development can sometimes lead to the displacement of lower-income communities.",
  },
  {
    id: "q4",
    text: "The city of London is mentioned as a leader in green space investment.",
  },
];

const MOCK_WRITING_PROMPT = `The bar chart below shows the average weekly hours spent on digital media by age group in the UK in 2023. Write 2–3 sentences describing the key trend. Minimum 60 words.`;
const MOCK_GRAPH_URL =
  "https://placehold.co/600x300/eef2ff/4338ca?text=Bar+Chart+%E2%80%94+Digital+Media+Usage+by+Age+Group+(2023)";

const MOCK_SPEAKING_PROMPT = `Talk about a memorable journey you have taken. You should say: where you went, who you were with, what made it memorable, and whether you would recommend this destination to others.`;

// ─────────────────────────────────────────────────────────────────────────────
// API CALLS
// ─────────────────────────────────────────────────────────────────────────────

async function fetchDiagnosticQuestionsData(skill: string) {
  const data = await callBackend(`/api/diagnostic/questions/${skill}`, { method: "GET" });
  if (!data?.ok) throw new Error("Fetch failed");
  return data;
}

async function fetchDiagnosticStatus(studentId: string): Promise<DiagnosticStatus> {
  const res = await callBackend(`/api/diagnostic/status`, { method: "GET" });
  return res as unknown as DiagnosticStatus;
}

async function submitSection(
  studentId: string,
  skill: "listening" | "reading",
  answers: Record<string, string>
): Promise<SkillResult> {
  const data = await callBackend(`/api/diagnostic/submit/${skill}`, {
    method: "POST",
    body: JSON.stringify({ answers }),
  });
  if (data?.bandScore === undefined) throw new Error("Submission failed");
  return { band_score: data.bandScore, level: getBandLevel(data.bandScore), sub_scores: data.sub_scores } as SkillResult;
}

async function submitWriting(
  studentId: string,
  text: string
): Promise<SkillResult> {
  const data = await callBackend(`/api/diagnostic/submit/writing`, {
    method: "POST",
    body: JSON.stringify({ answers: { text } }),
  });
  if (data?.bandScore === undefined) throw new Error("Writing submission failed");
  return {
    band_score: data.bandScore,
    level: getBandLevel(data.bandScore),
    sub_scores: data.sub_scores,
    feedback: data.feedback,
  } as SkillResult;
}

async function submitSpeaking(
  studentId: string,
  audioBlob: Blob
): Promise<SkillResult> {
  const formData = new FormData();
  formData.append("audio", audioBlob, "recording.webm");

  const data = await uploadFileToBackend(
    `/api/diagnostic/submit/speaking`,
    formData,
    "POST"
  );
  if (data?.bandScore === undefined) throw new Error("Speaking submission failed");
  return {
    band_score: data.bandScore,
    level: getBandLevel(data.bandScore),
    sub_scores: data.sub_scores,
    transcript: data.transcript,
    feedback: data.feedback,
  } as SkillResult;
}

// ─────────────────────────────────────────────────────────────────────────────
// TOP NAVIGATION BAR
// ─────────────────────────────────────────────────────────────────────────────

function TopNavBar() {
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-100 transform-gpu">
      <div className="w-full px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center space-x-2">
            <div className="p-2 bg-indigo-700 rounded-xl">
              <GraduationCap className="h-6 w-6 text-white" />
            </div>
            <span className="text-xl font-bold text-indigo-700">
              TestCrack
            </span>
          </div>
        </div>
      </div>
    </nav>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// SUB-COMPONENTS
// ─────────────────────────────────────────────────────────────────────────────

// ── Skeleton Loader ──────────────────────────────────────────────────────────
function SkeletonLoader() {
  return (
    <div className="space-y-4 animate-pulse">
      <div className="h-4 bg-gray-200 rounded-full w-3/4" />
      <div className="h-4 bg-gray-200 rounded-full w-1/2" />
      <div className="h-32 bg-gray-200 rounded-xl" />
      <div className="h-4 bg-gray-200 rounded-full w-2/3" />
      <div className="h-4 bg-gray-200 rounded-full w-5/6" />
    </div>
  );
}

// ── Error Banner ─────────────────────────────────────────────────────────────
function ErrorBanner({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="border border-red-200 bg-red-50 rounded-xl p-5 flex items-start gap-4">
      <span className="text-red-500 text-xl mt-0.5">⚠</span>
      <div className="flex-1">
        <p className="text-red-700 font-semibold text-sm">Something went wrong</p>
        <p className="text-red-500 text-xs mt-1">
          Your answers have been saved. Check your connection and try again.
        </p>
      </div>
      <button
        onClick={onRetry}
        className="px-4 py-2 bg-red-100 hover:bg-red-200 border border-red-200 text-red-700 text-sm rounded-lg transition-colors font-medium"
      >
        Try again
      </button>
    </div>
  );
}

// ── Level Badge ──────────────────────────────────────────────────────────────
function LevelBadge({ level, size = "md" }: { level: Level; size?: "sm" | "md" | "lg" }) {
  const cfg = getLevelConfig(level);
  const sizes = {
    sm: "px-2 py-0.5 text-xs",
    md: "px-3 py-1 text-sm",
    lg: "px-5 py-2 text-base",
  };
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border font-bold tracking-wider ${cfg.bg} ${cfg.border} ${cfg.text} ${sizes[size]}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
      Level {level} · {cfg.label}
    </span>
  );
}

// ── Progress Steps ───────────────────────────────────────────────────────────
// FIX #1: All step buttons are fully disabled — users cannot click any step
// to jump between sections. The diagnostic must be completed in linear order.
// Completed steps show a tick but are non-interactive. Future steps are also
// non-interactive. Only the current active step is visually highlighted.
function ProgressSteps({
  currentPhase,
  results,
}: {
  currentPhase: Skill | "gate" | "summary";
  results: AllResults;
}) {
  const skills: Skill[] = ["listening", "reading", "writing", "speaking"];

  return (
    <div className="flex items-center gap-1">
      {skills.map((skill, idx) => {
        const isDone = !!results[skill];
        const isCurrent = currentPhase === skill;
        return (
          <React.Fragment key={skill}>
            {/*
              FIX #1: All buttons are disabled and pointer-events-none.
              No onClick handler — navigation is only possible by completing
              each section in order. This enforces strict linear test flow.
            */}
            <div
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium select-none cursor-not-allowed ${
                isDone
                  ? "bg-teal-100 text-teal-700 border border-teal-300 opacity-70"
                  : isCurrent
                  ? "bg-indigo-100 text-indigo-700 border border-indigo-300"
                  : "bg-gray-100 text-gray-400 border border-gray-200 opacity-60"
              }`}
            >
              <span>{SKILL_ICONS[skill]}</span>
              <span className="hidden sm:inline">{SKILL_LABELS[skill]}</span>
              {isDone && <span>✓</span>}
            </div>
            {idx < skills.length - 1 && (
              <div
                className={`h-px w-4 transition-colors ${
                  isDone ? "bg-teal-300" : "bg-gray-200"
                }`}
              />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
}

// ── Interim Result Card ──────────────────────────────────────────────────────
function InterimResultCard({
  skill,
  result,
  onContinue,
  nextLabel,
}: {
  skill: Skill;
  result: SkillResult;
  onContinue: () => void;
  nextLabel: string;
}) {
  const level = getBandLevel(result.band_score);
  const cfg = getLevelConfig(level);

  const encouragements: Record<Level, string> = {
    A: "Great start — your foundation gives us a clear picture of what to strengthen.",
    B: "Solid performance. You're building toward a strong target score.",
    C: "Impressive result! You're in the upper band for this skill.",
  };

  return (
    <div className="flex flex-col items-center text-center gap-6 py-8 animate-fade-in">
      <div className="relative">
        <div
          className={`absolute inset-0 rounded-full blur-2xl opacity-20 ${cfg.bg}`}
          style={{ transform: "scale(1.5)" }}
        />
        <div className="relative text-5xl">{SKILL_ICONS[skill]}</div>
      </div>

      <div>
        <p className="text-gray-500 text-sm uppercase tracking-widest mb-2">
          {SKILL_LABELS[skill]} · Section Complete
        </p>
        <div className={`text-7xl font-black ${cfg.text} tabular-nums leading-none`}>
          {result.band_score.toFixed(1)}
        </div>
        <p className="text-gray-500 text-sm mt-2">Band Score</p>
      </div>

      <LevelBadge level={level} size="lg" />

      <p className="text-gray-600 text-sm max-w-xs leading-relaxed">
        {encouragements[level]}
      </p>

      {/* Sub-Scores Stats Board (Listening & Reading) */}
      {result.sub_scores && result.sub_scores.total_questions !== undefined && (
        <div className="grid grid-cols-2 gap-4 w-full max-w-sm mt-2">
          <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 flex flex-col items-center justify-center">
            <p className="text-gray-400 text-[10px] uppercase font-bold tracking-widest mb-1">Accuracy</p>
            <p className="text-gray-800 text-xl font-black">{result.sub_scores.accuracy_percentage}%</p>
          </div>
          <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 flex flex-col items-center justify-center">
            <p className="text-gray-400 text-[10px] uppercase font-bold tracking-widest mb-1">Correct</p>
            <p className="text-gray-800 text-xl font-black">{result.sub_scores.correct_answers} <span className="text-sm font-medium text-gray-400">/ {result.sub_scores.total_questions}</span></p>
          </div>
        </div>
      )}

      {/* Sub-Scores Stats Board (Writing) */}
      {result.sub_scores && result.sub_scores.word_count !== undefined && result.sub_scores.grammarScore !== undefined && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 w-full max-w-lg mt-2 mx-auto">
          {[
            { key: 'taskResponseScore', label: 'Response' },
            { key: 'coherenceScore', label: 'Coherence' },
            { key: 'vocabularyScore', label: 'Lexical' },
            { key: 'grammarScore', label: 'Grammar' }
          ].map(({ key, label }) => (
            <div key={key} className="bg-gray-50 border border-gray-200 rounded-xl p-3 flex flex-col items-center justify-center">
              <p className="text-gray-400 text-[9px] uppercase font-bold tracking-widest mb-1">{label}</p>
              <p className="text-gray-800 text-lg font-black">{result.sub_scores[key]}</p>
            </div>
          ))}
        </div>
      )}

      {/* Sub-Scores Stats Board (Speaking) */}
      {result.sub_scores && result.sub_scores.fluencyScore !== undefined && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 w-full max-w-lg mt-2 mx-auto">
          {[
            { key: 'fluencyScore', label: 'Fluency' },
            { key: 'vocabularyScore', label: 'Lexical' },
            { key: 'pronunciationScore', label: 'Pronunciation' },
            { key: 'grammarScore', label: 'Grammar' }
          ].map(({ key, label }) => (
            <div key={key} className="bg-gray-50 border border-gray-200 rounded-xl p-3 flex flex-col items-center justify-center">
              <p className="text-gray-400 text-[9px] uppercase font-bold tracking-widest mb-1">{label}</p>
              <p className="text-gray-800 text-lg font-black">{result.sub_scores[key]}</p>
            </div>
          ))}
        </div>
      )}

      {result.feedback && (
        <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 max-w-md text-left">
          <p className="text-gray-400 text-xs uppercase tracking-wider mb-1">AI Feedback</p>
          <p className="text-gray-700 text-sm leading-relaxed">{result.feedback}</p>
        </div>
      )}

      <button
        onClick={onContinue}
        className="mt-2 px-8 py-3 bg-indigo-700 hover:bg-indigo-600 text-white font-semibold rounded-xl transition-all hover:shadow-lg hover:shadow-indigo-500/20 hover:-translate-y-0.5 active:translate-y-0"
      >
        Continue to {nextLabel} →
      </button>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// PHASE: DIAGNOSTIC GATE
// ─────────────────────────────────────────────────────────────────────────────

function DiagnosticGate({
  gateState,
  resumePhase,
  onStart,
}: {
  gateState: GateState;
  resumePhase?: Skill;
  onStart: () => void;
}) {
  const steps = [
    { icon: "🎧", label: "Listening", desc: "6 MCQs with audio" },
    { icon: "📖", label: "Reading", desc: "Passage + 4 questions" },
    { icon: "✍️", label: "Writing", desc: "Graph response task" },
    { icon: "🎤", label: "Speaking", desc: "90-second verbal prompt" },
  ];

  return (
    <div className="flex flex-col items-center text-center gap-8 max-w-xl mx-auto py-8">
      {/* Hero */}
      <div className="space-y-3">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-indigo-50 border border-indigo-200 text-indigo-700 text-xs font-medium tracking-wider uppercase">
          <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse" />
          IELTS Baseline Diagnostic
        </div>
        <h1 className="text-4xl font-black text-gray-900 tracking-tight">
          {gateState === "in_progress" ? "Resume Your" : "Begin Your"}{" "}
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-teal-500">
            Diagnostic
          </span>
        </h1>
        <p className="text-gray-500 leading-relaxed">
          {gateState === "in_progress"
            ? `You left off at the ${SKILL_LABELS[resumePhase!]} section. Pick up exactly where you stopped.`
            : "Complete this 10-minute assessment to unlock your personalised learning path and band score baseline."}
        </p>
      </div>

      {/* Steps grid */}
      <div className="grid grid-cols-2 gap-3 w-full">
        {steps.map((step) => (
          <div
            key={step.label}
            className="bg-gray-50 border border-gray-200 rounded-xl p-4 text-left hover:border-indigo-200 hover:bg-indigo-50/50 transition-colors"
          >
            <span className="text-2xl">{step.icon}</span>
            <p className="text-gray-900 font-semibold text-sm mt-2">{step.label}</p>
            <p className="text-gray-400 text-xs mt-0.5">{step.desc}</p>
          </div>
        ))}
      </div>

      {/* Info row */}
      <div className="flex items-center gap-6 text-gray-400 text-xs">
        <span className="flex items-center gap-1.5">
          <span>⏱</span> ~10 minutes
        </span>
        <span className="flex items-center gap-1.5">
          <span>🔒</span> Cannot be skipped
        </span>
        <span className="flex items-center gap-1.5">
          <span>💡</span> Progress is saved
        </span>
      </div>

      <button
        onClick={onStart}
        className="w-full py-4 bg-indigo-700 hover:bg-indigo-600 text-white font-bold text-base rounded-xl transition-all hover:shadow-xl hover:shadow-indigo-500/25 hover:-translate-y-0.5 active:translate-y-0"
      >
        {gateState === "in_progress"
          ? `Resume from ${SKILL_LABELS[resumePhase!]}`
          : "Start Diagnostic →"}
      </button>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// PHASE: LISTENING
// ─────────────────────────────────────────────────────────────────────────────

function ListeningPhase({
  onComplete,
  initialAnswers = {},
}: {
  onComplete: (result: SkillResult) => void;
  initialAnswers?: Record<string, string>;
}) {
  const [sectionState, setSectionState] = useState<SectionState>("loading");
  const [answers, setAnswers] = useState<Record<string, string>>(initialAnswers);
  // FIX #5: Initialise audioPlayed from localStorage so refresh can't replay
  const [audioPlayed, setAudioPlayed] = useState<boolean>(
    () => storageLoad<boolean>(SK.listeningAudioPlayed) ?? false
  );
  const [error, setError] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    fetchDiagnosticQuestionsData("listening")
      .then(res => {
        setData(res);
        setSectionState("ready");
      })
      .catch((e) => {
        console.error("ListeningPhase fetch error:", e);
        setError(true);
        setSectionState("error");
      });
  }, []);

  useEffect(() => {
    storageSave(SK.listeningAnswers, answers);
  }, [answers]);

  // FIX #5: Persist audioPlayed to localStorage whenever it changes
  useEffect(() => {
    storageSave(SK.listeningAudioPlayed, audioPlayed);
  }, [audioPlayed]);

  const allAnswered = data?.questions ? data.questions.every((q: any) => answers[q.id]) : false;

  const handleSubmit = async () => {
    setSectionState("submitting");
    setError(false);
    try {
      setSectionState("scoring");
      const result = await submitSection(STUDENT_ID, "listening", answers);
      // FIX #5: clear the audio-played flag once the section is fully submitted
      storageClear(SK.listeningAnswers, SK.listeningAudioPlayed);
      setSectionState("scored");
      onComplete(result);
    } catch {
      setError(true);
      setSectionState("ready");
    }
  };

  const handleAudioPlay = () => {
    if (audioPlayed) return;
    setAudioPlayed(true);
  };

  if (sectionState === "loading") {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3 mb-4">
          <span className="text-2xl">🎧</span>
          <div>
            <p className="text-gray-900 font-bold">Listening Section</p>
            <p className="text-gray-500 text-sm">Loading your audio and questions…</p>
          </div>
        </div>
        <SkeletonLoader />
      </div>
    );
  }

  if (sectionState === "error") {
    return (
      <div className="space-y-6">
        <ErrorBanner onRetry={() => window.location.reload()} />
      </div>
    );
  }

  if (sectionState === "scoring") {
    return (
      <div className="flex flex-col items-center gap-6 py-16 text-center">
        <div className="relative">
          <div className="w-16 h-16 rounded-full border-2 border-indigo-200 border-t-indigo-600 animate-spin" />
          <span className="absolute inset-0 flex items-center justify-center text-2xl">🎧</span>
        </div>
        <div>
          <p className="text-gray-900 font-semibold">Scoring your answers…</p>
          <p className="text-gray-500 text-sm mt-1">This takes just a moment.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Section header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-2xl">🎧</span>
          <div>
            <p className="text-gray-900 font-bold">Listening Section</p>
            <p className="text-gray-500 text-sm">6 questions · Answer all to submit</p>
          </div>
        </div>
        <div className="text-gray-500 text-sm font-medium tabular-nums">
          {Object.keys(answers).length}/6 answered
        </div>
      </div>

      {/* Audio player */}
      <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 text-lg shrink-0">
            ▶
          </div>
          <div className="flex-1">
            <p className="text-gray-900 text-sm font-medium">Diagnostic Audio Clip</p>
            <p className="text-gray-400 text-xs mt-0.5">
              {audioPlayed
                ? "Audio has been played — replay disabled in exam mode"
                : "Play once. Listen carefully before answering."}
            </p>
          </div>
          <audio
            ref={audioRef}
            src={data?.audio_url || ""}
            onPlay={handleAudioPlay}
            onEnded={() => {}}
          />
          <button
            onClick={() => {
              // FIX #5: check both state and localStorage to prevent replay after refresh
              if (!audioPlayed) {
                audioRef.current?.play();
              }
            }}
            disabled={audioPlayed}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              audioPlayed
                ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                : "bg-indigo-700 hover:bg-indigo-600 text-white"
            }`}
          >
            {audioPlayed ? "Played ✓" : "Play Audio"}
          </button>
        </div>
      </div>

      {/* Questions */}
      <div className="space-y-4">
        {data?.questions?.map((q: any, qi: number) => (
          <div
            key={q.id}
            className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm"
          >
            <p className="text-gray-700 text-sm font-medium mb-3">
              <span className="text-indigo-700 font-bold mr-2">Q{qi + 1}.</span>
              {q.text}
            </p>
            <div className="grid grid-cols-1 gap-2">
              {q.options.map((opt: string) => {
                const optLetter = opt.split('.')[0];
                return (
                <label
                  key={optLetter}
                  className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all ${
                    answers[q.id] === optLetter
                      ? "border-indigo-400 bg-indigo-50 text-gray-900"
                      : "border-gray-200 text-gray-500 hover:border-gray-300 hover:text-gray-700"
                  }`}
                >
                  <div
                    className={`w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 ${
                      answers[q.id] === optLetter
                        ? "border-indigo-600 bg-indigo-600"
                        : "border-gray-300"
                    }`}
                  >
                    {answers[q.id] === optLetter && (
                      <div className="w-1.5 h-1.5 rounded-full bg-white" />
                    )}
                  </div>
                  <span className="text-indigo-700 font-bold text-sm w-5 shrink-0">
                    {optLetter}
                  </span>
                  <span className="text-sm">{opt.substring(optLetter.length + 1).trim()}</span>
                  <input
                    type="radio"
                    name={q.id}
                    value={optLetter}
                    checked={answers[q.id] === optLetter}
                    onChange={() => setAnswers((prev) => ({ ...prev, [q.id]: optLetter }))}
                    className="sr-only"
                  />
                </label>
              )})}
            </div>
          </div>
        ))}
      </div>

      {error && <ErrorBanner onRetry={handleSubmit} />}

      <button
        onClick={handleSubmit}
        disabled={!allAnswered || sectionState === "submitting"}
        className={`w-full py-3.5 rounded-xl font-bold text-sm transition-all ${
          allAnswered
            ? "bg-indigo-700 hover:bg-indigo-600 text-white hover:shadow-lg hover:shadow-indigo-500/20 hover:-translate-y-0.5"
            : "bg-gray-100 text-gray-400 cursor-not-allowed border border-gray-200"
        }`}
      >
        {sectionState === "submitting" ? (
          <span className="flex items-center justify-center gap-2">
            <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            Submitting…
          </span>
        ) : (
          `Submit Listening ${allAnswered ? "✓" : `(${Object.keys(answers).length}/6)`}`
        )}
      </button>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// PHASE: READING
// ─────────────────────────────────────────────────────────────────────────────

function ReadingPhase({
  onComplete,
  initialAnswers = {},
}: {
  onComplete: (result: SkillResult) => void;
  initialAnswers?: Record<string, string>;
}) {
  const [sectionState, setSectionState] = useState<SectionState>("loading");
  const [answers, setAnswers] = useState<Record<string, string>>(initialAnswers);
  // FIX #2: Initialise timer from localStorage so it resumes (not restarts) on refresh
  const [timeLeft, setTimeLeft] = useState<number>(
    () => storageLoad<number>(SK.readingTimeLeft) ?? 300
  );
  const [error, setError] = useState(false);
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    fetchDiagnosticQuestionsData("reading")
      .then(res => {
        setData(res);
        setSectionState("ready");
      })
      .catch((e) => {
        console.error("ReadingPhase fetch error:", e);
        setError(true);
        setSectionState("error");
      });
  }, []);

  useEffect(() => {
    if (sectionState !== "ready") return;
    if (timeLeft <= 0) return;
    const interval = setInterval(() => {
      setTimeLeft((t) => {
        const next = t - 1;
        // FIX #2: persist the countdown on every tick so refresh picks it back up
        storageSave(SK.readingTimeLeft, next);
        return next;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [sectionState, timeLeft]);

  useEffect(() => {
    storageSave(SK.readingAnswers, answers);
  }, [answers]);

  const allAnswered = data?.questions ? data.questions.every((q: any) => answers[q.id]) : false;
  const timerWarning = timeLeft <= 60 && timeLeft > 0;

  const handleSubmit = async () => {
    setSectionState("submitting");
    setError(false);
    try {
      setSectionState("scoring");
      const result = await submitSection(STUDENT_ID, "reading", answers);
      // FIX #2: clear the persisted timer on successful submission
      storageClear(SK.readingAnswers, SK.readingTimeLeft);
      setSectionState("scored");
      onComplete(result);
    } catch {
      setError(true);
      setSectionState("ready");
    }
  };

  if (sectionState === "loading") {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3 mb-4">
          <span className="text-2xl">📖</span>
          <p className="text-gray-900 font-bold">Loading Reading Section…</p>
        </div>
        <SkeletonLoader />
      </div>
    );
  }

  if (sectionState === "error") {
    return (
      <div className="space-y-6">
        <ErrorBanner onRetry={() => window.location.reload()} />
      </div>
    );
  }

  if (sectionState === "scoring") {
    return (
      <div className="flex flex-col items-center gap-6 py-16 text-center">
        <div className="relative">
          <div className="w-16 h-16 rounded-full border-2 border-indigo-200 border-t-indigo-600 animate-spin" />
          <span className="absolute inset-0 flex items-center justify-center text-2xl">📖</span>
        </div>
        <p className="text-gray-900 font-semibold">Scoring your answers…</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header + Timer */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-2xl">📖</span>
          <div>
            <p className="text-gray-900 font-bold">Reading Section</p>
            <p className="text-gray-500 text-sm">Read the passage, then answer 4 questions</p>
          </div>
        </div>
        <div
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-sm font-mono font-bold transition-colors ${
            timerWarning
              ? "bg-amber-50 border-amber-200 text-amber-600"
              : timeLeft === 0
              ? "bg-red-50 border-red-200 text-red-600"
              : "bg-gray-50 border-gray-200 text-gray-700"
          }`}
        >
          <span className="text-xs">{timerWarning ? "⚠" : "⏱"}</span>
          {formatTime(timeLeft)}
          {timeLeft === 0 && <span className="text-xs font-normal ml-1">Time's up</span>}
        </div>
      </div>

      {/* Passage */}
      <div className="bg-gray-50 border border-gray-200 rounded-xl p-5">
        <p className="text-gray-400 text-xs uppercase tracking-wider mb-3 font-medium">
          Reading Passage
        </p>
        <p className="text-gray-700 text-sm leading-7 whitespace-pre-line">
          {data?.passage}
        </p>
      </div>

      {/* Questions */}
      <div className="space-y-4">
        <p className="text-gray-400 text-xs uppercase tracking-wider font-medium">
          Questions — True / False / Not Given
        </p>
        {data?.questions?.map((q: any, qi: number) => (
          <div
            key={q.id}
            className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm"
          >
            <p className="text-gray-700 text-sm mb-3">
              <span className="text-indigo-700 font-bold mr-2">{qi + 1}.</span>
              {q.text}
            </p>
            <div className="flex gap-2 flex-wrap">
              {q.options.map((opt: string) => {
                const optLetter = opt.split('.')[0];
                return (
                <label
                  key={optLetter}
                  className={`px-4 py-2 rounded-lg border cursor-pointer text-sm font-medium transition-all ${
                    answers[q.id] === optLetter
                      ? optLetter === "A"
                        ? "border-teal-400 bg-teal-50 text-teal-700"
                        : optLetter === "B"
                        ? "border-red-300 bg-red-50 text-red-700"
                        : "border-gray-400 bg-gray-100 text-gray-700"
                      : "border-gray-200 text-gray-500 hover:border-gray-300 hover:text-gray-700"
                  }`}
                >
                  {opt.substring(optLetter.length + 1).trim()}
                  <input
                    type="radio"
                    name={q.id}
                    value={optLetter}
                    checked={answers[q.id] === optLetter}
                    onChange={() => setAnswers((prev) => ({ ...prev, [q.id]: optLetter }))}
                    className="sr-only"
                  />
                </label>
              )})}
            </div>
          </div>
        ))}
      </div>

      {error && <ErrorBanner onRetry={handleSubmit} />}

      <button
        onClick={handleSubmit}
        disabled={!allAnswered || sectionState === "submitting"}
        className={`w-full py-3.5 rounded-xl font-bold text-sm transition-all ${
          allAnswered
            ? "bg-indigo-700 hover:bg-indigo-600 text-white hover:shadow-lg hover:shadow-indigo-500/20 hover:-translate-y-0.5"
            : "bg-gray-100 text-gray-400 cursor-not-allowed border border-gray-200"
        }`}
      >
        {sectionState === "submitting" ? (
          <span className="flex items-center justify-center gap-2">
            <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            Submitting…
          </span>
        ) : (
          `Submit Reading ${allAnswered ? "✓" : `(${Object.keys(answers).length}/4)`}`
        )}
      </button>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// PHASE: WRITING
// ─────────────────────────────────────────────────────────────────────────────

function WritingPhase({
  onComplete,
  initialText = "",
}: {
  onComplete: (result: SkillResult) => void;
  initialText?: string;
}) {
  const [sectionState, setSectionState] = useState<SectionState>("loading");
  const [text, setText] = useState(initialText);
  const [error, setError] = useState(false);
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    fetchDiagnosticQuestionsData("writing")
      .then(res => {
        setData(res);
        setSectionState("ready");
      })
      .catch((e) => {
        console.error("WritingPhase fetch error:", e);
        setError(true);
        setSectionState("error");
      });
  }, []);

  const wordCount = countWords(text);
  const MIN_WORDS = data?.minWords || 150;

  useEffect(() => {
    storageSave(SK.writingText, text);
  }, [text]);

  const handleSubmit = async () => {
    setSectionState("submitting");
    setError(false);
    try {
      setSectionState("scoring");
      const result = await submitWriting(STUDENT_ID, text);
      storageClear(SK.writingText);
      setSectionState("scored");
      onComplete(result);
    } catch {
      setError(true);
      setSectionState("ready");
    }
  };

  // FIX #3: Block all clipboard-based input in the writing textarea
  const handlePaste = (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
    e.preventDefault();
  };
  const handleCopy = (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
    e.preventDefault();
  };
  const handleCut = (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
    e.preventDefault();
  };
  const handleDrop = (e: React.DragEvent<HTMLTextAreaElement>) => {
    e.preventDefault();
  };

  if (sectionState === "loading") {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3 mb-4">
          <span className="text-2xl">✍️</span>
          <p className="text-gray-900 font-bold">Loading Writing Task…</p>
        </div>
        <SkeletonLoader />
      </div>
    );
  }

  if (sectionState === "error") {
    return (
      <div className="space-y-6">
        <ErrorBanner onRetry={() => window.location.reload()} />
      </div>
    );
  }

  if (sectionState === "scoring") {
    return (
      <div className="flex flex-col items-center gap-5 py-16 text-center">
        <div className="relative">
          <div className="w-16 h-16 rounded-full border-2 border-indigo-200 border-t-indigo-600 animate-spin" />
          <span className="absolute inset-0 flex items-center justify-center text-2xl">✍️</span>
        </div>
        <div>
          <p className="text-gray-900 font-semibold">AI examiner is reviewing your writing…</p>
          <p className="text-gray-500 text-sm mt-1">This may take 5–10 seconds. Please wait.</p>
        </div>
        <div className="flex gap-1 mt-2">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="w-1.5 h-1.5 rounded-full bg-indigo-600 animate-bounce"
              style={{ animationDelay: `${i * 0.15}s` }}
            />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center gap-3">
        <span className="text-2xl">✍️</span>
        <div>
          <p className="text-gray-900 font-bold">Writing Section</p>
          <p className="text-gray-500 text-sm">Describe the graph in at least {MIN_WORDS} words</p>
        </div>
      </div>

      {/* Graph image */}
      {data?.image_url && (
      <div className="rounded-xl overflow-hidden border border-gray-200 mb-4">
        <img
          src={data.image_url}
          alt="Writing Task Visualization"
          className="w-full object-cover"
        />
      </div>
      )}

      {/* Prompt */}
      <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-4">
        <p className="text-gray-700 text-sm leading-relaxed">{data?.topic}</p>
      </div>

      {/* Textarea — FIX #3: all clipboard/drag events blocked */}
      <div className="relative">
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          onPaste={handlePaste}
          onCopy={handleCopy}
          onCut={handleCut}
          onDrop={handleDrop}
          disabled={sectionState === "submitting"}
          placeholder="Begin writing your response here…"
          rows={8}
          className="w-full bg-white border border-gray-200 rounded-xl p-4 text-gray-800 text-sm leading-7 resize-none focus:outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 placeholder-gray-300 transition-colors"
        />
        <div
          className={`absolute bottom-3 right-3 px-2.5 py-1 rounded-md text-xs font-mono font-bold transition-colors ${
            wordCount >= MIN_WORDS
              ? "bg-teal-100 text-teal-700"
              : "bg-gray-100 text-gray-500"
          }`}
        >
          {wordCount} / {MIN_WORDS} words
        </div>
      </div>

      {/* Word count bar */}
      <div className="space-y-1.5">
        <div className="h-1 bg-gray-100 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-300 ${
              wordCount >= MIN_WORDS ? "bg-teal-500" : "bg-indigo-500"
            }`}
            style={{ width: `${Math.min((wordCount / MIN_WORDS) * 100, 100)}%` }}
          />
        </div>
        <p className="text-gray-400 text-xs">
          {wordCount < MIN_WORDS
            ? `${MIN_WORDS - wordCount} more words needed to enable submission`
            : "Minimum word count reached ✓"}
        </p>
      </div>

      {/* FIX #3: inform user that pasting is disabled */}
      <p className="text-gray-400 text-xs flex items-center gap-1.5">
        <span>🔒</span> Copy-paste is disabled in this section — all responses must be typed.
      </p>

      {error && <ErrorBanner onRetry={handleSubmit} />}

      <button
        onClick={handleSubmit}
        disabled={wordCount < MIN_WORDS || sectionState === "scoring"}
        className={`w-full py-3.5 rounded-xl font-bold text-sm transition-all ${
          wordCount >= MIN_WORDS
            ? "bg-indigo-700 hover:bg-indigo-600 text-white hover:shadow-lg hover:shadow-indigo-500/20 hover:-translate-y-0.5"
            : "bg-gray-100 text-gray-400 cursor-not-allowed border border-gray-200"
        }`}
      >
        {sectionState === "scoring" ? (
          <span className="flex items-center justify-center gap-2">
            <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            Submitting…
          </span>
        ) : (
          "Submit Writing →"
        )}
      </button>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// PHASE: SPEAKING
// ─────────────────────────────────────────────────────────────────────────────

function SpeakingPhase({ onComplete }: { onComplete: (result: SkillResult) => void }) {
  // FIX #4: On mount check if a speaking result was already persisted (from a
  // previous submission that succeeded but the page refreshed before the
  // scorecard rendered). If so, fire onComplete immediately so the user
  // lands on the scorecard rather than having to re-record.
  useEffect(() => {
    const saved = storageLoad<SkillResult>(SK.speakingResult);
    if (saved) {
      onComplete(saved);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const [recordState, setRecordState] = useState<RecordState | "loading" | "error">("loading");
  const [elapsed, setElapsed] = useState(0);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<any>(null);
  const [animBars] = useState(() => Array.from({ length: 12 }, () => Math.random()));

  useEffect(() => {
    fetchDiagnosticQuestionsData("speaking")
      .then(res => {
        setData(res);
        setRecordState("idle");
      })
      .catch((e) => {
        console.error("SpeakingPhase fetch error:", e);
        setError("Failed to load speaking prompt");
        setRecordState("error");
      });
  }, []);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const MAX_DURATION = 90;

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current?.state === "recording") {
      mediaRecorderRef.current.stop();
    }
    if (timerRef.current) clearInterval(timerRef.current);
  }, []);

  useEffect(() => {
    if (elapsed >= MAX_DURATION && recordState === "recording") {
      stopRecording();
    }
  }, [elapsed, recordState, stopRecording]);

  const startRecording = async () => {
    setError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mimeType = MediaRecorder.isTypeSupported("audio/webm")
        ? "audio/webm"
        : "audio/mp4";
      const mr = new MediaRecorder(stream, { mimeType });
      mediaRecorderRef.current = mr;
      chunksRef.current = [];

      mr.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      mr.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: mimeType });
        setAudioBlob(blob);
        setRecordState("recorded");
        stream.getTracks().forEach((t) => t.stop());
      };

      mr.start(250);
      setRecordState("recording");
      setElapsed(0);
      timerRef.current = setInterval(() => setElapsed((e) => e + 1), 1000);
    } catch {
      setError("Microphone access denied. Please allow microphone access and try again.");
    }
  };

  const handleSubmit = async () => {
    if (!audioBlob) return;
    setError(null);
    setRecordState("uploading");
    try {
      setRecordState("processing");
      const result = await submitSpeaking(STUDENT_ID, audioBlob);
      // FIX #4: persist the result BEFORE calling onComplete so that if the
      // page refreshes between now and the scorecard rendering, the result
      // survives. The scorecard clears this key once it mounts.
      storageSave(SK.speakingResult, result);
      setRecordState("done");
      onComplete(result);
    } catch {
      setError("Upload failed. Your recording is still available — please try again.");
      setRecordState("recorded");
    }
  };

  const progress = Math.min((elapsed / MAX_DURATION) * 100, 100);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <span className="text-2xl">🎤</span>
        <div>
          <p className="text-gray-900 font-bold">Speaking Section</p>
          <p className="text-gray-500 text-sm">Up to 90 seconds · Speak clearly and naturally</p>
        </div>
      </div>

      {/* Prompt */}
      <div className="bg-gray-50 border border-gray-200 rounded-xl p-5">
        <p className="text-gray-400 text-xs uppercase tracking-wider mb-2 font-medium">
          Your Speaking Prompt
        </p>
        <div className="text-gray-700 text-sm leading-7 space-y-2">
          {data?.prompts?.map((prompt: string, i: number) => (
             <p key={i}><span className="font-bold mr-2">{i+1}.</span>{prompt}</p>
          ))}
        </div>
      </div>

      {/* Instructions */}
      {recordState === "idle" && (
        <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-4">
          <ul className="text-gray-700 text-sm space-y-1.5">
            <li className="flex gap-2"><span className="text-indigo-600">•</span>Read the prompt carefully before recording</li>
            <li className="flex gap-2"><span className="text-indigo-600">•</span>Tap the button below to start — you have 90 seconds</li>
            <li className="flex gap-2"><span className="text-indigo-600">•</span>Speak naturally — your response will be transcribed and scored</li>
          </ul>
        </div>
      )}

      {/* Recorder UI */}
      <div className="flex flex-col items-center gap-5 py-4">
        {/* Waveform animation */}
        {recordState === "recording" && (
          <div className="flex items-center gap-1 h-12">
            {animBars.map((h, i) => (
              <div
                key={i}
                className="w-1.5 bg-red-500 rounded-full"
                style={{
                  height: `${20 + h * 30}px`,
                  animation: `pulse 0.${5 + (i % 5)}s ease-in-out infinite alternate`,
                  animationDelay: `${i * 0.06}s`,
                }}
              />
            ))}
          </div>
        )}

        {/* Timer */}
        {(recordState === "recording" || recordState === "recorded") && (
          <div className="w-full space-y-2">
            <div className="flex justify-between text-xs text-gray-500">
              <span>{formatTime(elapsed)}</span>
              <span
                className={elapsed >= MAX_DURATION - 10 ? "text-amber-600 font-medium" : ""}
              >
                {formatTime(MAX_DURATION - elapsed)} remaining
              </span>
            </div>
            <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-1000 ${
                  progress > 80 ? "bg-amber-500" : "bg-red-500"
                }`}
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        )}

        {/* Main record button */}
        {recordState !== "uploading" && recordState !== "processing" && recordState !== "done" && (
          <button
            onClick={
              recordState === "idle"
                ? startRecording
                : recordState === "recording"
                ? stopRecording
                : handleSubmit
            }
            className={`w-20 h-20 rounded-full flex items-center justify-center text-2xl font-bold transition-all shadow-xl ${
              recordState === "recording"
                ? "bg-red-500 hover:bg-red-600 text-white animate-pulse shadow-red-300"
                : recordState === "recorded"
                ? "bg-teal-600 hover:bg-teal-500 text-white shadow-teal-200"
                : "bg-indigo-700 hover:bg-indigo-600 text-white shadow-indigo-200 hover:-translate-y-1"
            }`}
          >
            {recordState === "idle" && "●"}
            {recordState === "recording" && "■"}
            {recordState === "recorded" && "▲"}
          </button>
        )}

        <p className="text-gray-500 text-sm text-center">
          {recordState === "idle" && "Tap to start recording"}
          {recordState === "recording" && "Recording… tap to stop"}
          {recordState === "recorded" && `Recorded (${formatTime(elapsed)}) — tap ▲ to submit`}
        </p>

        {/* Separate submit button for clarity when recorded */}
        {recordState === "recorded" && (
          <button
            onClick={handleSubmit}
            className="px-8 py-3 bg-teal-600 hover:bg-teal-500 text-white font-bold rounded-xl transition-all hover:shadow-lg hover:shadow-teal-200 hover:-translate-y-0.5"
          >
            Submit Recording →
          </button>
        )}
      </div>

      {/* Processing state */}
      {(recordState === "uploading" || recordState === "processing") && (
        <div className="flex flex-col items-center gap-4 py-8 text-center">
          <div className="relative">
            <div className="w-16 h-16 rounded-full border-2 border-indigo-200 border-t-indigo-600 animate-spin" />
            <span className="absolute inset-0 flex items-center justify-center text-2xl">🎤</span>
          </div>
          <div>
            <p className="text-gray-900 font-semibold">
              {recordState === "uploading"
                ? "Uploading your recording…"
                : "AI examiner is transcribing and scoring…"}
            </p>
            <p className="text-gray-500 text-sm mt-1">
              {recordState === "uploading"
                ? "Please don't navigate away."
                : "This may take 10–20 seconds. Sit tight!"}
            </p>
          </div>
        </div>
      )}

      {error && (
        <div className="border border-red-200 bg-red-50 rounded-xl p-4">
          <p className="text-red-700 text-sm">{error}</p>
        </div>
      )}

      {/* Microphone instructions */}
      {recordState === "idle" && (
        <p className="text-gray-400 text-xs text-center">
          Your browser will request microphone access. Allow it to begin recording.
          <br />
          Safari on iOS may have limitations — use Chrome for best results.
        </p>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// SPEAKING RESULT CARD
// ─────────────────────────────────────────────────────────────────────────────

function SpeakingResultCard({
  result,
  onContinue,
}: {
  result: SkillResult;
  onContinue: () => void;
}) {
  // FIX #4: Clear the persisted speaking result now that the scorecard has
  // successfully rendered. The user has seen the result, so there is no
  // longer a need to recover it on future page loads.
  useEffect(() => {
    storageClear(SK.speakingResult);
  }, []);

  const band_score = Number(result.band_score) || 0;
  const subScores = result.sub_scores ?? {};
  const subScoreEntries = Object.entries(subScores).filter(
    ([, val]) => typeof val === "number" && !isNaN(val as number)
  );
  const maxSub = subScoreEntries.reduce(
    (a, b) => ((b[1] as number) > (a[1] as number) ? b : a),
    subScoreEntries[0] ?? ["", 0]
  );
  const minSub = subScoreEntries.reduce(
    (a, b) => ((b[1] as number) < (a[1] as number) ? b : a),
    subScoreEntries[0] ?? ["", 9]
  );

  const subScoreLabels: Record<string, string> = {
    fluencyScore: "Fluency & Coherence",
    vocabularyScore: "Lexical Resource",
    grammarScore: "Grammatical Range",
    pronunciationScore: "Pronunciation",
    taskResponseScore: "Task Response",
    coherenceScore: "Coherence & Cohesion",
  };

  const level = getBandLevel(band_score);
  const cfg = getLevelConfig(level);

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="text-center space-y-3">
        <div className="text-4xl">🎤</div>
        <div className={`text-6xl font-black ${cfg.text} tabular-nums`}>
          {band_score.toFixed(1)}
        </div>
        <LevelBadge level={level} size="lg" />
      </div>

      {/* Sub-score table */}
      {subScoreEntries.length > 0 && (
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
          <p className="px-5 py-3 text-gray-400 text-xs uppercase tracking-wider border-b border-gray-100 font-medium">
            Criterion Breakdown
          </p>
          <div className="divide-y divide-gray-100">
            {subScoreEntries.map(([key, val]) => {
              const isWeakest = key === minSub[0];
              const isStrongest = key === maxSub[0];
              return (
                <div
                  key={key}
                  className={`flex items-center justify-between px-5 py-3 ${
                    isWeakest
                      ? "bg-amber-50"
                      : isStrongest
                      ? "bg-teal-50"
                      : "bg-white"
                  }`}
                >
                  <span className="text-gray-700 text-sm">
                    {subScoreLabels[key] ?? key}
                    {isWeakest && (
                      <span className="ml-2 text-amber-600 text-xs">(needs work)</span>
                    )}
                    {isStrongest && (
                      <span className="ml-2 text-teal-600 text-xs">(strongest)</span>
                    )}
                  </span>
                  <span
                    className={`font-bold tabular-nums ${
                      isWeakest
                        ? "text-amber-600"
                        : isStrongest
                        ? "text-teal-600"
                        : "text-gray-900"
                    }`}
                  >
                    {Number(val).toFixed(1)}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* AI Feedback */}
      {result.sub_scores?.feedback && (
        <div className="bg-gray-50 border border-gray-200 rounded-xl p-6 shadow-sm text-left">
          <p className="text-gray-900 font-bold mb-4 text-center">AI Detailed Feedback</p>
          <div className="space-y-4">
            {result.sub_scores.feedback.fluency && Array.isArray(result.sub_scores.feedback.fluency) && (
              <div>
                <p className="text-xs uppercase font-bold text-gray-500 mb-1">Fluency</p>
                <ul className="list-disc pl-4 text-sm text-gray-700 space-y-1">
                  {result.sub_scores.feedback.fluency.map((item: string, i: number) => <li key={i}>{item}</li>)}
                </ul>
              </div>
            )}
            {result.sub_scores.feedback.delivery_and_confidence && Array.isArray(result.sub_scores.feedback.delivery_and_confidence) && (
              <div>
                <p className="text-xs uppercase font-bold text-gray-500 mb-1">Delivery & Confidence</p>
                <ul className="list-disc pl-4 text-sm text-gray-700 space-y-1">
                  {result.sub_scores.feedback.delivery_and_confidence.map((item: string, i: number) => <li key={i}>{item}</li>)}
                </ul>
              </div>
            )}
            {result.sub_scores.feedback.filler_words_used && Array.isArray(result.sub_scores.feedback.filler_words_used) && (
              <div>
                <p className="text-xs uppercase font-bold text-gray-500 mb-1">Filler Words</p>
                <ul className="list-disc pl-4 text-sm text-gray-700 space-y-1">
                  {result.sub_scores.feedback.filler_words_used.map((item: string, i: number) => <li key={i}>{item}</li>)}
                </ul>
              </div>
            )}
            {result.sub_scores.feedback.pronunciation && Array.isArray(result.sub_scores.feedback.pronunciation) && (
              <div>
                <p className="text-xs uppercase font-bold text-gray-500 mb-1">Pronunciation</p>
                <ul className="list-disc pl-4 text-sm text-gray-700 space-y-1">
                  {result.sub_scores.feedback.pronunciation.map((item: string, i: number) => <li key={i}>{item}</li>)}
                </ul>
              </div>
            )}
            {result.sub_scores.feedback.improvements && (
              <div>
                <p className="text-xs uppercase font-bold text-gray-500 mb-1">Overall Improvements</p>
                <p className="text-sm text-gray-700 bg-white p-3 rounded-lg border border-gray-100">{result.sub_scores.feedback.improvements}</p>
              </div>
            )}
          </div>
        </div>
      )}

      <button
        onClick={onContinue}
        className="w-full py-3.5 bg-indigo-700 hover:bg-indigo-600 text-white font-bold rounded-xl transition-all hover:shadow-lg hover:shadow-indigo-500/20 hover:-translate-y-0.5"
      >
        View Full Results →
      </button>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// DIAGNOSTIC SUMMARY SCREEN
// ─────────────────────────────────────────────────────────────────────────────

function DiagnosticSummaryScreen({
  results,
  onGoToDashboard,
}: {
  results: AllResults;
  onGoToDashboard: () => void;
}) {
  const skills: Skill[] = ["listening", "reading", "writing", "speaking"];
  const avgScore = getAverageScore(results);
  const overallLevel = getBandLevel(avgScore);
  const overallCfg = getLevelConfig(overallLevel);

  const readinessMessages: Record<Level, string> = {
    A: "You're at the foundation stage. Our personalised plan will fast-track you toward your target band.",
    B: "You have a solid base to build on. Focused practice will push you into the upper bands.",
    C: "You're performing at an advanced level. Precision refinement is all that stands between you and your target.",
  };

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Hero */}
      <div className="text-center space-y-4">
        <div className="text-5xl">🎓</div>
        <h2 className="text-3xl font-black text-gray-900">Diagnostic Complete</h2>
        <p className="text-gray-500 text-sm max-w-sm mx-auto leading-relaxed">
          Here's your IELTS baseline. Your personalised learning path has been generated.
        </p>
      </div>

      {/* Overall badge */}
      <div
        className={`border rounded-2xl p-6 text-center space-y-2 ${overallCfg.bg} ${overallCfg.border}`}
      >
        <p className="text-gray-500 text-xs uppercase tracking-wider">Overall Band Score</p>
        <div className={`text-5xl font-black tabular-nums ${overallCfg.text}`}>
          {avgScore.toFixed(1)}
        </div>
        <LevelBadge level={overallLevel} size="lg" />
        <p className={`text-sm mt-3 max-w-xs mx-auto leading-relaxed ${overallCfg.text}`}>
          {readinessMessages[overallLevel]}
        </p>
      </div>

      {/* 2x2 grid */}
      <div className="grid grid-cols-2 gap-3">
        {skills.map((skill) => {
          const result = results[skill];
          if (!result) return null;
          const level = getBandLevel(result.band_score);
          const cfg = getLevelConfig(level);
          return (
            <div
              key={skill}
              className={`border rounded-xl p-4 text-center shadow-sm ${cfg.bg} ${cfg.border}`}
            >
              <span className="text-2xl">{SKILL_ICONS[skill]}</span>
              <p className="text-gray-500 text-xs mt-2 uppercase tracking-wide">
                {SKILL_LABELS[skill]}
              </p>
              <div className={`text-3xl font-black mt-1 tabular-nums ${cfg.text}`}>
                {result.band_score.toFixed(1)}
              </div>
              <span className={`text-xs font-bold mt-1 inline-block ${cfg.text}`}>
                Level {level}
              </span>
            </div>
          );
        })}
      </div>

      <Link
        to="/student/dashboard"
        className="inline-block text-center w-full py-4 bg-gradient-to-r from-indigo-700 to-teal-600 hover:from-indigo-600 hover:to-teal-500 text-white font-bold text-base rounded-xl transition-all hover:shadow-xl hover:shadow-indigo-500/25 hover:-translate-y-0.5"
      >
        Go to Dashboard →
      </Link>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN DIAGNOSIS PAGE
// ─────────────────────────────────────────────────────────────────────────────

type Phase = "gate" | Skill | "speaking_result" | "summary";

function DiagnosisInner() {
  const [phase, setPhase] = useState<Phase>("gate");
  const [gateState, setGateState] = useState<GateState>("idle");
  const [results, setResults] = useState<AllResults>({});
  const [lastSpeakingResult, setLastSpeakingResult] = useState<SkillResult | null>(null);
  const [resumePhase, setResumePhase] = useState<Skill | undefined>();
  const [isCheckingStatus, setIsCheckingStatus] = useState(true);
  const [interimSkill, setInterimSkill] = useState<Skill | null>(null);
  const [pendingNextPhase, setPendingNextPhase] = useState<Phase | null>(null);

  // ── On mount: check diagnostic status ─────────────────────────────────────
  useEffect(() => {
    let isMounted = true;
    const check = async () => {
      const savedPhase   = storageLoad<Phase>(SK.phase);
      const savedResults = storageLoad<AllResults>(SK.results);
      if (savedResults) setResults(savedResults);

      try {
        const status = await fetchDiagnosticStatus(STUDENT_ID);
        if (!isMounted) return;

        if (status.overall_complete) {
          storageClear(SK.phase, SK.results, SK.listeningAnswers, SK.listeningAudioPlayed, SK.readingAnswers, SK.readingTimeLeft, SK.writingText, SK.speakingResult);
          setGateState("complete");
          window.location.href = "/dashboard";
          return;
        }

        const skillOrder: Skill[] = ["listening", "reading", "writing", "speaking"];
        const statusMap: Record<Skill, boolean> = {
          listening: status.listening_scored,
          reading:   status.reading_scored,
          writing:   status.writing_scored,
          speaking:  status.speaking_scored,
        };

        const anyDone = skillOrder.some((s) => statusMap[s]);

        if (anyDone) {
          const mergedResults: AllResults = {};
          skillOrder.forEach((s) => {
            if (savedResults?.[s]) mergedResults[s] = savedResults[s];
          });
          setResults((prev) => ({ ...prev, ...mergedResults }));

          const nextSkill = skillOrder.find((s) => !statusMap[s]);
          setResumePhase(nextSkill);
          setGateState("in_progress");

          if (savedPhase && savedPhase !== "gate" && savedPhase !== "summary") {
            const savedSkill = savedPhase as Skill;
            if (skillOrder.includes(savedSkill) && !statusMap[savedSkill]) {
              setPhase(savedPhase);
            }
          }
        } else if (savedPhase && savedPhase !== "gate" && savedPhase !== "summary") {
          setPhase(savedPhase);
          setGateState("in_progress");
        } else {
          setGateState("idle");
        }
      } catch {
        if (savedPhase && savedPhase !== "gate") {
          setPhase(savedPhase);
          setGateState("in_progress");
        } else {
          setGateState("idle");
        }
      } finally {
        if (isMounted) setIsCheckingStatus(false);
      }
    };
    check();
    return () => { isMounted = false; };
  }, []);

  useEffect(() => {
    storageSave(SK.phase, phase);
  }, [phase]);

  useEffect(() => {
    storageSave(SK.results, results);
  }, [results]);

  // ── Helpers ───────────────────────────────────────────────────────────────
  const handleStart = () => {
    setPhase(resumePhase ?? "listening");
  };

  const showInterim = (skill: Skill, result: SkillResult, next: Phase) => {
    setResults((prev) => ({ ...prev, [skill]: result }));
    setInterimSkill(skill);
    setPendingNextPhase(next);
    setPhase(skill);
  };

  const advanceFromInterim = () => {
    setInterimSkill(null);
    if (pendingNextPhase) setPhase(pendingNextPhase);
  };

  const nextLabels: Partial<Record<Phase, string>> = {
    listening: "Reading",
    reading: "Writing",
    writing: "Speaking",
    speaking: "Results",
  };

  const handleGoToDashboard = () => {
    storageClear(SK.phase, SK.results, SK.listeningAnswers, SK.listeningAudioPlayed, SK.readingAnswers, SK.readingTimeLeft, SK.writingText, SK.speakingResult);
    alert("Navigating to dashboard… (implement router.push('/dashboard') here)");
  };

  // ── Loading state ─────────────────────────────────────────────────────────
  if (isCheckingStatus) {
    return (
      <>
        <TopNavBar />
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="flex flex-col items-center gap-4 text-center">
            <div className="w-10 h-10 rounded-full border-2 border-indigo-200 border-t-indigo-600 animate-spin" />
            <p className="text-gray-500 text-sm">Checking your diagnostic status…</p>
          </div>
        </div>
      </>
    );
  }

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gray-50 text-gray-900">
      <TopNavBar />

      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-48 -left-48 w-96 h-96 rounded-full bg-indigo-100/60 blur-3xl" />
        <div className="absolute -bottom-48 -right-48 w-96 h-96 rounded-full bg-teal-100/40 blur-3xl" />
      </div>

      <div className="relative z-10 max-w-2xl mx-auto px-4 pt-24 pb-8 flex flex-col min-h-screen">
        {/* Progress bar (shown during skill phases) */}
        {phase !== "gate" && phase !== "summary" && (
          <div className="mb-6 flex justify-center">
            {/*
              FIX #1: ProgressSteps no longer accepts onPhaseChange.
              All step indicators are purely decorative — no navigation is
              possible. Users must complete each section in order.
            */}
            <ProgressSteps
              currentPhase={phase as Skill}
              results={results}
            />
          </div>
        )}

        {/* Main card */}
        <div className="flex-1 bg-white border border-gray-200 rounded-2xl p-6 md:p-8 shadow-sm">
          {/* GATE */}
          {phase === "gate" && (
            <DiagnosticGate
              gateState={gateState}
              resumePhase={resumePhase}
              onStart={handleStart}
            />
          )}

          {/* LISTENING */}
          {phase === "listening" && interimSkill === "listening" && results.listening && (
            <InterimResultCard
              skill="listening"
              result={results.listening}
              onContinue={advanceFromInterim}
              nextLabel={nextLabels["listening"] ?? "Next"}
            />
          )}
          {phase === "listening" && interimSkill !== "listening" && (
            <ListeningPhase
              initialAnswers={storageLoad<Record<string, string>>(SK.listeningAnswers) ?? {}}
              onComplete={(r) => showInterim("listening", r, "reading")}
            />
          )}

          {/* READING */}
          {phase === "reading" && interimSkill === "reading" && results.reading && (
            <InterimResultCard
              skill="reading"
              result={results.reading}
              onContinue={advanceFromInterim}
              nextLabel={nextLabels["reading"] ?? "Next"}
            />
          )}
          {phase === "reading" && interimSkill !== "reading" && (
            <ReadingPhase
              initialAnswers={storageLoad<Record<string, string>>(SK.readingAnswers) ?? {}}
              onComplete={(r) => showInterim("reading", r, "writing")}
            />
          )}

          {/* WRITING */}
          {phase === "writing" && interimSkill === "writing" && results.writing && (
            <InterimResultCard
              skill="writing"
              result={results.writing}
              onContinue={advanceFromInterim}
              nextLabel={nextLabels["writing"] ?? "Next"}
            />
          )}
          {phase === "writing" && interimSkill !== "writing" && (
            <WritingPhase
              initialText={storageLoad<string>(SK.writingText) ?? ""}
              onComplete={(r) => showInterim("writing", r, "speaking")}
            />
          )}

          {/* SPEAKING */}
          {phase === "speaking" && (
            <SpeakingPhase
              onComplete={(r) => {
                setResults((prev) => ({ ...prev, speaking: r }));
                setLastSpeakingResult(r);
                setPhase("speaking_result");
              }}
            />
          )}

          {/* SPEAKING RESULT */}
          {phase === "speaking_result" && lastSpeakingResult && (
            <SpeakingResultCard
              result={lastSpeakingResult}
              onContinue={() => setPhase("summary")}
            />
          )}

          {/* SUMMARY */}
          {phase === "summary" && (
            <DiagnosticSummaryScreen
              results={results}
              onGoToDashboard={handleGoToDashboard}
            />
          )}
        </div>

        {/* Footer */}
        <p className="text-center text-gray-400 text-xs mt-4">
          TestCrack · Diagnostic Engine v1 · All responses are encrypted and secure
        </p>
      </div>

      {/* CSS keyframes */}
      <style>{`
        @keyframes pulse {
          0% { transform: scaleY(0.4); }
          100% { transform: scaleY(1); }
        }
        @keyframes fade-in {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in {
          animation: fade-in 0.35s ease-out;
        }
      `}</style>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// ONBOARDING SCREEN WRAPPER
// ─────────────────────────────────────────────────────────────────────────────

function OnboardingScreen({ onComplete }: { onComplete: () => void }) {
  const { profile, refreshProfile } = useAuth();
  const [name, setName] = useState(profile?.name || "");
  const [targetBand, setTargetBand] = useState<string>(profile?.targetBand ? String(profile.targetBand) : "7.0");
  const [loading, setLoading] = useState(false);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await callBackend(`/api/profile`, {
        method: "PUT",
        body: JSON.stringify({ name, targetBand: Number(targetBand) }),
      });
      await refreshProfile();
      onComplete();
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex bg-slate-50 min-h-screen items-center justify-center p-6 relative w-full overflow-hidden">
      <div className="absolute -top-48 -left-48 w-96 h-96 rounded-full bg-indigo-100/60 blur-3xl pointer-events-none" />
      <div className="absolute -bottom-48 -right-48 w-96 h-96 rounded-full bg-teal-100/40 blur-3xl pointer-events-none" />
      
      <div className="bg-white p-8 md:p-10 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] w-full max-w-md relative z-10 border border-slate-100 animate-fade-in">
        <div className="flex items-center gap-3 mb-8">
          <div className="p-3 bg-indigo-700 rounded-2xl shadow-lg shadow-indigo-200">
            <GraduationCap className="h-6 w-6 text-white" />
          </div>
          <span className="text-2xl font-black text-gray-900 tracking-tight">TestCrack</span>
        </div>
        
        <h2 className="text-2xl font-black mb-2 text-gray-900 leading-tight">Welcome aboard! 🎯</h2>
        <p className="text-gray-500 mb-8 text-sm leading-relaxed">Let's set your goals so we can tailor your upcoming diagnostic baseline specifically for you.</p>
        
        <form onSubmit={handleSave} className="space-y-6">
          <div className="space-y-2">
            <label className="block text-sm font-bold text-gray-700 ml-1">Full Name</label>
            <input 
              type="text"
              value={name} 
              onChange={(e) => setName(e.target.value)} 
              required 
              placeholder="E.g. John Doe" 
              className="w-full border-2 border-slate-100 rounded-xl p-3.5 text-sm font-medium focus:bg-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all bg-slate-50 placeholder:text-slate-400 text-gray-900"
            />
          </div>
          
          <div className="space-y-2">
            <label className="block text-sm font-bold text-gray-700 ml-1">Target IELTS Band</label>
            <div className="relative">
              <select 
                value={targetBand} 
                onChange={(e) => setTargetBand(e.target.value)}
                className="w-full border-2 border-slate-100 rounded-xl p-3.5 text-sm font-bold focus:bg-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all bg-slate-50 appearance-none text-indigo-700 cursor-pointer"
              >
                {[4.5, 5.0, 5.5, 6.0, 6.5, 7.0, 7.5, 8.0, 8.5, 9.0].map(band => (
                  <option key={band} value={band.toFixed(1)}>{band.toFixed(1)} Band</option>
                ))}
              </select>
              <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400 font-bold">⌄</div>
            </div>
          </div>

          <button 
            type="submit" 
            className="w-full mt-4 py-4 bg-gray-900 hover:bg-gray-800 text-white font-bold text-base rounded-xl transition-all shadow-xl shadow-gray-200 active:scale-[0.98] active:shadow-sm disabled:opacity-70 disabled:pointer-events-none" 
            disabled={loading}
          >
            {loading ? "Saving Profile..." : "Start Diagnostic →"}
          </button>
        </form>
      </div>
    </div>
  );
}

export default function Diagnosis() {
  const { profile } = useAuth();
  const [forceDone, setForceDone] = useState(false);
  
  if (!profile?.targetBand && !forceDone) {
    return <OnboardingScreen onComplete={() => setForceDone(true)} />;
  }
  
  return <DiagnosisInner />;
}