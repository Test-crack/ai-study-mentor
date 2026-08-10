"use client";
import { LogOut, Target, ChevronDown, MessageSquareWarning, Trophy, TrendingDown, Download } from "lucide-react";
import testcrackLogo from "@/assets/testcrack-logo.svg";
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer, Legend } from "recharts";
import { Link, useNavigate } from 'react-router-dom';
import { createPortal } from "react-dom";
import ResumePasswordModal from "../Diagnosis/ResumePasswordModal";
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
  feedback?: any;
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

function getBandLevel(score: number): Level {
  if (score < 5.5) return "A";
  if (score < 7.0) return "B";
  return "C";
}

// Same red/amber/green thresholds as getBandLevel, expressed as bar-fill classes
// for the criterion progress bars: red <5.5, amber 5.5–6.5(→<7.0), green ≥7.0.
function getScoreBarColor(score: number): string {
  if (score < 5.5) return "bg-rose-500";
  if (score < 7.0) return "bg-amber-500";
  return "bg-emerald-500";
}

const QUESTION_TYPE_LABELS: Record<string, string> = {
  mcq: "MCQ",
  tfng: "TFNG",
};

function getLevelConfig(level: Level) {
  const configs = {
    A: {
      label: "Foundation",
      bg: "bg-amber-50",
      border: "border-amber-200",
      text: "text-amber-800",
      dot: "bg-amber-500",
      ring: "ring-amber-200",
    },
    B: {
      label: "Intermediate",
      bg: "bg-brand-teal-wash",
      border: "border-brand-teal-tint",
      text: "text-brand-teal-700",
      dot: "bg-brand-teal-600",
      ring: "ring-brand-teal-tint",
    },
    C: {
      label: "Advanced",
      bg: "bg-emerald-50",
      border: "border-emerald-200",
      text: "text-emerald-800",
      dot: "bg-emerald-600",
      ring: "ring-emerald-200",
    },
  };
  return configs[level];
}

function getAverageScore(results: AllResults): number {
  const scores = Object.values(results)
    .map((r) => r?.band_score ?? 4.0)
    .filter(Boolean);
  if (!scores.length) return 0;
  return scores.reduce((a, b) => a + b, 0) / scores.length;
}

/**
 * Normalise MCQ options from either DB format (object) or legacy format (array).
 * DB format:     { "A": "Option text", "B": "Option text" }
 * Legacy format: ["A. Option text", "B. Option text"]
 */
function normaliseOptions(raw: any): { letter: string; text: string }[] {
  if (!raw) return [];
  if (Array.isArray(raw)) {
    return raw.map((opt: string) => ({
      letter: opt.split('.')[0].trim(),
      text:   opt.substring(opt.indexOf('.') + 1).trim(),
    }));
  }
  return Object.entries(raw as Record<string, string>).map(([letter, text]) => ({ letter, text }));
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
  listeningAudioPlayed: "tc_listening_audio_played",
  readingAnswers:     "tc_reading_answers",
  readingTimeLeft:    "tc_reading_time_left",
  writingText:        "tc_writing_text",
  speakingResult:     "tc_speaking_result",
  speakingSubmitting: "tc_speaking_submitting",
  activeTabLock:      "tc_active_tab",
};

// Per-student namespace so diagnostic progress on a shared device never leaks
// between accounts (e.g. Student B seeing Student A's answers/scores, or being
// dropped mid-test into A's saved phase). Set once from the logged-in student id
// before any phase component reads storage.
let storageNamespace = '';
function setStorageNamespace(id: string) { storageNamespace = id || ''; }
function nsKey(key: string): string { return storageNamespace ? `${storageNamespace}:${key}` : key; }

function storageSave<T>(key: string, value: T) {
  try { localStorage.setItem(nsKey(key), JSON.stringify(value)); } catch {}
}

function storageLoad<T>(key: string): T | null {
  try {
    const raw = localStorage.getItem(nsKey(key));
    return raw ? (JSON.parse(raw) as T) : null;
  } catch { return null; }
}

function storageClear(...keys: string[]) {
  try { keys.forEach((k) => localStorage.removeItem(nsKey(k))); } catch {}
}
// Per-tab resume verification flag. sessionStorage dies when the tab/browser
// closes, so reopening ALWAYS forces re-verification. A plain F5 refresh in
// the same tab keeps the flag (accidental refresh shouldn't interrupt a test).
const RESUME_VERIFIED = "tc_resume_ok";
function isResumeVerified(): boolean {
  try { return sessionStorage.getItem(nsKey(RESUME_VERIFIED)) === "1"; } catch { return false; }
}
function markResumeVerified() {
  try { sessionStorage.setItem(nsKey(RESUME_VERIFIED), "1"); } catch {}
}
// ─────────────────────────────────────────────────────────────────────────────
// API CALLS  (unchanged)
// ─────────────────────────────────────────────────────────────────────────────

async function fetchDiagnosticQuestionsData(skill: string) {
  // M-20: pin the question set across refreshes. First fetch stores the served
  // set_id (L/R) or prompt id (W/S); later fetches pass it back so the backend
  // re-serves the SAME questions instead of re-rolling a random set (which
  // silently invalidated the student's saved answers mid-section).
  const servedKey = `tc_served_${skill}`;
  const servedId  = storageLoad<string>(servedKey);
  const param     = servedId
    ? (skill === "listening" || skill === "reading" ? `?set_id=${encodeURIComponent(servedId)}` : `?question_id=${encodeURIComponent(servedId)}`)
    : "";
  const data = await callBackend(`/api/diagnostic/questions/${skill}${param}`, { method: "GET" });
  if (!data?.ok) throw new Error("Fetch failed");
  const idToPersist = (skill === "listening" || skill === "reading") ? data.set_id : data.id;
  if (idToPersist) storageSave(servedKey, String(idToPersist));
  return data;
}

async function fetchDiagnosticStatus(studentId: string): Promise<DiagnosticStatus> {
  const res = await callBackend(`/api/diagnostic/status?student_id=${studentId}`, { method: "GET" });
  return res as unknown as DiagnosticStatus;
}

async function submitSection(
  studentId: string,
  skill: "listening" | "reading",
  answers: Record<string, string>
): Promise<SkillResult> {
  const data = await callBackend(`/api/diagnostic/submit/${skill}`, {
    method: "POST",
    body: JSON.stringify({ 
      student_id: studentId,
      skill: skill,
      answers: answers 
    }),
  });
  if (data?.bandScore === undefined) throw new Error("Submission failed");
  return { band_score: data.bandScore, level: getBandLevel(data.bandScore), sub_scores: data.sub_scores } as SkillResult;
}

async function submitWriting(
  studentId: string,
  text: string,
  questionId?: string
): Promise<SkillResult> {
  const data = await callBackend(`/api/diagnostic/submit/writing`, {
    method: "POST",
    body: JSON.stringify({
      student_id: studentId,
      skill: "writing",
      question_id: questionId,
      answers: { text, question_id: questionId }
    }),
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
  audioBlob: Blob,
  questionId?: string
): Promise<SkillResult> {
  const formData = new FormData();
  formData.append("audio", audioBlob, "recording.webm");
  formData.append("student_id", studentId);
  formData.append("skill", "speaking");
  if (questionId) formData.append("question_id", questionId);

  let data: any;
  try {
    data = await uploadFileToBackend(`/api/diagnostic/submit/speaking`, formData, "POST");
  } catch (httpErr: any) {
    // 422 → server detected no usable speech; responseData is attached by uploadFileToBackend
    if (httpErr?.responseData?.can_retry) {
      const retryErr = new Error(httpErr.responseData.message ?? 'No speech detected. Please re-record.');
      (retryErr as any).canRetry = true;
      throw retryErr;
    }
    throw httpErr;
  }

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
}

// ─────────────────────────────────────────────────────────────────────────────
// SUB-COMPONENTS
// ─────────────────────────────────────────────────────────────────────────────

function SkeletonLoader() {
  return (
    <div className="space-y-4 animate-pulse">
      <div className="h-4 bg-brand-bg-alt rounded-full w-3/4" />
      <div className="h-4 bg-brand-bg-alt rounded-full w-1/2" />
      <div className="h-32 bg-brand-bg-alt rounded-2xl" />
      <div className="h-4 bg-brand-bg-alt rounded-full w-2/3" />
      <div className="h-4 bg-brand-bg-alt rounded-full w-5/6" />
    </div>
  );
}

function ErrorBanner({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="border border-brand-warm/30 bg-brand-warm-tint rounded-2xl p-5 flex items-start gap-4">
      <span className="text-brand-warm text-xl mt-0.5 font-bold">⚠</span>
      <div className="flex-1">
        <p className="font-manrope text-brand-text font-bold text-[15px] tracking-[-0.01em]">Something went wrong</p>
        <p className="text-brand-text-mute text-[13px] mt-1 leading-[1.6]">
          Your answers have been saved. Check your connection and try again.
        </p>
      </div>
      <button
        onClick={onRetry}
        className="shrink-0 px-4 py-2 bg-brand-teal-700 hover:bg-brand-teal-600 text-white text-sm font-semibold rounded-xl transition-colors duration-150"
      >
        Retry
      </button>
    </div>
  );
}

function LevelBadge({ level, size = "md" }: { level: Level; size?: "sm" | "md" | "lg" }) {
  const cfg = getLevelConfig(level);
  const sizes = {
    sm: "px-2.5 py-0.5 text-[11px]",
    md: "px-3 py-1 text-[13px]",
    lg: "px-4 py-1.5 text-[14px]",
  };
  return (
    <span
      className={`inline-flex items-center gap-2 rounded-full border font-semibold ${cfg.bg} ${cfg.border} ${cfg.text} ${sizes[size]}`}
    >
      <span className={`w-2 h-2 rounded-full ${cfg.dot}`} />
      Level {level} · {cfg.label}
    </span>
  );
}

function ProgressSteps({
  currentPhase,
  results,
}: {
  currentPhase: Skill | "gate" | "summary";
  results: AllResults;
}) {
  const skills: Skill[] = ["listening", "reading", "writing", "speaking"];
  const stepNums: Record<Skill, string> = {
    listening: "01",
    reading: "02",
    writing: "03",
    speaking: "04",
  };

  return (
    <div className="flex items-center gap-1 rounded-2xl border border-brand-line-12 bg-brand-ink-nav px-2 py-2 sm:px-3">
      {skills.map((skill, idx) => {
        const isDone = !!results[skill];
        const isCurrent = currentPhase === skill;
        return (
          <React.Fragment key={skill}>
            <div
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border text-[12px] font-semibold select-none cursor-not-allowed transition-colors duration-150 ${
                isDone
                  ? "bg-brand-mint/15 text-brand-mint border-brand-mint/30"
                  : isCurrent
                  ? "bg-brand-bg text-brand-ink border-transparent"
                  : "bg-transparent text-brand-on-ink-mute border-brand-line-09"
              }`}
            >
              <span className="hidden sm:inline font-jetbrains text-[10.5px] tracking-[0.08em] opacity-70">{stepNums[skill]}</span>
              <span className="hidden sm:inline">{SKILL_ICONS[skill]}</span>
              <span className="hidden sm:inline">{SKILL_LABELS[skill]}</span>
              <span className="sm:hidden">{SKILL_ICONS[skill]}</span>
              {isDone && <span aria-hidden="true">✓</span>}
            </div>
            {idx < skills.length - 1 && (
              <div
                className={`h-px w-3 transition-colors ${
                  isDone ? "bg-brand-mint/50" : "bg-brand-line-12"
                }`}
              />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
}

function DetailedFeedbackDisplay({ feedback }: { feedback: any }) {
  if (typeof feedback === 'string') {
    return <p className="text-brand-text-mute text-[14px] leading-[1.7]">{feedback}</p>;
  }

  if (feedback?.improvements && typeof feedback.improvements === 'string') {
     return <p className="text-brand-text-mute text-[14px] leading-[1.7]">Improvements: {feedback.improvements}</p>;
  }

  return (
    <div className="space-y-3">
      {feedback?.priority_action && (
        <div className="bg-brand-warm-tint border border-brand-warm/30 p-3.5 rounded-xl">
          <p className="font-jetbrains text-brand-warm text-[10px] uppercase tracking-[0.16em] flex items-center gap-1.5">
            <Target className="w-3 h-3" /> Priority Action
          </p>
          <p className="text-brand-text text-[14px] mt-1.5 leading-[1.7]">{feedback.priority_action}</p>
        </div>
      )}

      {['task_response', 'coherence', 'fluency', 'pronunciation', 'vocabulary', 'grammar'].map((key) => {
        const sect = feedback?.[key];
        if (!sect) return null;
        return (
          <div key={key} className="bg-white border border-brand-line rounded-xl p-3.5">
             <p className="font-jetbrains text-brand-teal-700 text-[10px] uppercase mb-1.5 tracking-[0.16em]">{key.replace('_', ' ')}</p>
             <p className="text-brand-text text-[14px] italic mb-2 leading-[1.7]">"{sect.score_rationale}"</p>

             {sect.observed_issues && sect.observed_issues.length > 0 && (
               <ul className="list-disc pl-4 text-[12.5px] text-amber-700 space-y-1 mb-2 leading-[1.6]">
                 {sect.observed_issues.map((i: string, idx: number) => <li key={idx}>{i}</li>)}
               </ul>
             )}

             {sect.error_examples && sect.error_examples.length > 0 && (
               <ul className="list-disc pl-4 text-[12.5px] text-rose-600 space-y-1 mb-2 leading-[1.6]">
                 {sect.error_examples.map((i: string, idx: number) => <li key={idx}>{i}</li>)}
               </ul>
             )}

             {sect.strengths && sect.strengths.length > 0 && (
               <ul className="list-disc pl-4 text-[12.5px] text-emerald-600 space-y-1 mb-2 leading-[1.6]">
                 {sect.strengths.map((i: string, idx: number) => <li key={idx}>{i}</li>)}
               </ul>
             )}

             {sect.next_step && (
               <p className="text-brand-text-mute text-[12.5px] mt-2 border-t border-brand-line pt-2 leading-[1.6]"><span className="font-semibold text-brand-text">Next Step:</span> {sect.next_step}</p>
             )}
          </div>
        )
      })}
      
      {feedback?.filler_words_detected && feedback.filler_words_detected.length > 0 && (
        <div className="bg-brand-warm-tint border border-brand-warm/30 p-3.5 rounded-xl">
          <p className="font-jetbrains text-brand-warm text-[10px] uppercase tracking-[0.16em] mb-2">Filler Words Detected</p>
          <div className="flex flex-wrap gap-2">
            {feedback.filler_words_detected.map((filler: string, idx: number) => (
              <span key={idx} className="bg-white border border-brand-warm/25 text-brand-warm text-[11px] font-semibold px-2.5 py-1 rounded-full">
                {filler}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// Collapsible wrapper for the "AI Feedback & Insights" block — defaults open since
// the feedback is the core value of the diagnostic, but collapsible so a student
// can tuck it away once read.
function FeedbackAccordion({ title, children }: { title: string; children: React.ReactNode }) {
  const [open, setOpen] = useState(true);
  return (
    <div className="bg-brand-bg border border-brand-line rounded-2xl w-full max-w-lg overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between px-4 py-3 text-left"
      >
        <span className="font-jetbrains text-brand-teal-700 text-[10.5px] uppercase tracking-[0.16em]">{title}</span>
        <ChevronDown className={`w-4 h-4 text-brand-text-mute transition-transform duration-200 ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && <div className="px-4 pb-4 text-left">{children}</div>}
    </div>
  );
}

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
    <div className="flex flex-col items-center text-center gap-6 py-4 animate-fade-in">
      {/* Section-complete score card — dark surface, mint score, per the approved mock */}
      <div className="relative w-full max-w-lg overflow-hidden rounded-2xl border border-brand-line-12 bg-brand-ink px-6 py-8">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 opacity-[0.06]"
          style={{
            backgroundImage:
              'linear-gradient(to right, #2EE8A6 1px, transparent 1px), linear-gradient(to bottom, #2EE8A6 1px, transparent 1px)',
            backgroundSize: '48px 48px',
          }}
        />
        <div className="relative flex flex-col items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-white/10 border border-brand-line-12 flex items-center justify-center text-2xl">
            {SKILL_ICONS[skill]}
          </div>

          <div>
            <p className="font-jetbrains text-brand-mint text-[10.5px] uppercase tracking-[0.18em] mb-2">
              {SKILL_LABELS[skill]} · Section Complete
            </p>
            <div className="font-manrope text-[72px] font-extrabold text-brand-mint tabular-nums leading-none tracking-[-0.03em]">
              {result.band_score.toFixed(1)}
            </div>
            <p className="font-jetbrains text-brand-on-ink-mute text-[10.5px] mt-2 uppercase tracking-[0.16em]">Band Score</p>
          </div>

          <LevelBadge level={level} size="lg" />

          <p className="text-brand-on-ink text-[14px] max-w-xs leading-[1.7]">
            {encouragements[level]}
          </p>
        </div>
      </div>

      {/* Sub-Scores Stats Board (Listening & Reading) */}
      {result.sub_scores && result.sub_scores.total_questions !== undefined && (() => {
        const accuracyPct = Number(result.sub_scores.accuracy_percentage) || 0;
        const ringColor = accuracyPct >= 70 ? '#10B981' : accuracyPct >= 50 ? '#F59E0B' : '#F43F5E';
        const RADIUS = 42;
        const CIRCUMFERENCE = 2 * Math.PI * RADIUS;
        const byType = result.sub_scores.by_question_type as Record<string, { correct: number; total: number }> | undefined;
        return (
          <div className="w-full max-w-lg mt-2 mx-auto flex flex-col sm:flex-row items-center gap-4 text-left">
            <div className="relative w-28 h-28 shrink-0">
              <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
                <circle cx="50" cy="50" r={RADIUS} fill="none" stroke="#EAF0EF" strokeWidth="10" />
                <circle
                  cx="50" cy="50" r={RADIUS} fill="none"
                  stroke={ringColor} strokeWidth="10" strokeLinecap="round"
                  strokeDasharray={`${(accuracyPct / 100) * CIRCUMFERENCE} ${CIRCUMFERENCE}`}
                  className="transition-all duration-700"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="font-manrope text-2xl font-extrabold text-brand-ink tabular-nums tracking-[-0.02em]">{accuracyPct}%</span>
                <span className="font-jetbrains text-[9px] uppercase text-brand-text-mute tracking-[0.16em]">Accuracy</span>
              </div>
            </div>

            <div className="flex-1 w-full space-y-2">
              <div className="bg-white border border-brand-line rounded-2xl p-3.5 flex items-center justify-between">
                <span className="font-jetbrains text-brand-text-mute text-[10px] uppercase tracking-[0.16em]">Correct</span>
                <span className="font-manrope text-brand-ink text-xl font-extrabold tabular-nums tracking-[-0.02em]">
                  {result.sub_scores.correct_answers} <span className="text-sm font-semibold text-brand-text-mute">/ {result.sub_scores.total_questions}</span>
                </span>
              </div>

              {byType && Object.keys(byType).length > 0 && (
                <div className="bg-white border border-brand-line rounded-2xl p-3.5 space-y-1.5">
                  <p className="font-jetbrains text-brand-text-mute text-[9px] uppercase tracking-[0.16em] mb-1">By Question Type</p>
                  {Object.entries(byType).map(([type, stats]) => (
                    <div key={type} className="flex items-center justify-between text-[13px]">
                      <span className="text-brand-text-mute font-medium">{QUESTION_TYPE_LABELS[type] ?? type}</span>
                      <span className="text-brand-ink font-bold tabular-nums">{stats.correct}/{stats.total}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        );
      })()}

      {/* Sub-Scores Stats Board (Writing) */}
      {result.sub_scores && result.sub_scores.word_count !== undefined && result.sub_scores.grammarScore !== undefined && (
        <div className="w-full max-w-lg mt-2 mx-auto bg-white border border-brand-line rounded-2xl p-5 space-y-3 text-left">
          <p className="font-jetbrains text-brand-text-mute text-[10px] uppercase tracking-[0.16em]">Criterion Breakdown</p>
          {[
            { key: 'taskResponseScore', label: 'Task Achievement' },
            { key: 'coherenceScore', label: 'Coherence' },
            { key: 'vocabularyScore', label: 'Vocabulary' },
            { key: 'grammarScore', label: 'Grammar' }
          ].map(({ key, label }) => {
            const score = Number(result.sub_scores[key]) || 0;
            const pct = Math.min(100, Math.max(0, (score / 9) * 100));
            return (
              <div key={key}>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-brand-text-mute text-[13px] font-medium">{label}</span>
                  <span className="text-brand-ink text-[14px] font-bold tabular-nums">{score.toFixed(1)}</span>
                </div>
                <div className="h-1.5 w-full bg-brand-bg-alt rounded-full overflow-hidden">
                  <div className={`h-full ${getScoreBarColor(score)} rounded-full transition-all duration-700`} style={{ width: `${pct}%` }} />
                </div>
              </div>
            );
          })}
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
            <div key={key} className="bg-white border border-brand-line rounded-2xl p-3.5 flex flex-col items-center justify-center">
              <p className="font-jetbrains text-brand-text-mute text-[9px] uppercase tracking-[0.16em] mb-1">{label}</p>
              <p className="font-manrope text-brand-ink text-xl font-extrabold tabular-nums tracking-[-0.02em]">{result.sub_scores[key]}</p>
            </div>
          ))}
        </div>
      )}

      {result.feedback && (
        <FeedbackAccordion title="AI Feedback & Insights">
          <DetailedFeedbackDisplay feedback={result.feedback} />
        </FeedbackAccordion>
      )}

      <button
        onClick={onContinue}
        className="mt-2 px-8 py-3.5 bg-brand-teal-700 hover:bg-brand-teal-600 text-white font-semibold text-[15px] rounded-xl transition-colors duration-150 active:scale-[0.98]"
      >
        Continue to {nextLabel} →
      </button>
    </div>
  );
}

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
    { icon: "🎧", label: "Listening", desc: "Audio passage with MCQs", num: "01" },
    { icon: "📖", label: "Reading", desc: "Passage + comprehension questions", num: "02" },
    { icon: "✍️", label: "Writing", desc: "Graph response task", num: "03" },
    { icon: "🎤", label: "Speaking", desc: "90-second verbal prompt", num: "04" },
  ];

  return (
    <div className="flex flex-col items-center text-center gap-8 max-w-xl mx-auto py-2">
      {/* Dark intro panel with faint blueprint grid, matching the marketing hero */}
      <div className="relative w-full overflow-hidden rounded-2xl border border-brand-line-12 bg-brand-ink-deep px-6 py-9">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 opacity-[0.06]"
          style={{
            backgroundImage:
              'linear-gradient(to right, #2EE8A6 1px, transparent 1px), linear-gradient(to bottom, #2EE8A6 1px, transparent 1px)',
            backgroundSize: '56px 56px',
          }}
        />
        <div className="relative space-y-4">
          <div className="inline-flex items-center gap-3">
            <span className="h-px w-6 shrink-0 bg-brand-mint" aria-hidden="true" />
            <span className="font-jetbrains text-[10.5px] uppercase tracking-[0.2em] text-brand-mint">
              IELTS Baseline Diagnostic
            </span>
          </div>
          <h1 className="font-manrope text-[34px] sm:text-[40px] font-extrabold text-white leading-[1.08] tracking-[-0.03em]">
            {gateState === "in_progress" ? "Resume your" : "Begin your"}{" "}
            <span className="text-brand-mint">
              diagnostic.
            </span>
          </h1>
          <p className="text-brand-on-ink text-[15px] leading-[1.75] max-w-md mx-auto">
            {gateState === "in_progress"
              ? `You left off at the ${SKILL_LABELS[resumePhase!]} section. Pick up exactly where you stopped.`
              : "Complete this ~35-minute assessment to unlock your personalised learning path and band score baseline."}
          </p>
        </div>
      </div>

      <div className="w-full space-y-2.5">
        {steps.map((step) => (
          <div
            key={step.label}
            className="bg-white border border-brand-line rounded-2xl p-4 flex items-center gap-4 text-left hover:border-brand-teal-200 transition-colors duration-150"
          >
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-teal-wash text-xl">{step.icon}</span>
            <div className="flex-1">
              <p className="font-manrope text-brand-ink font-bold text-[15px] tracking-[-0.01em]">{step.label}</p>
              <p className="text-brand-text-mute text-[13px] mt-0.5 leading-[1.6]">{step.desc}</p>
            </div>
            <span className="font-jetbrains text-brand-line text-lg">{step.num}</span>
          </div>
        ))}
      </div>

      <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 font-jetbrains text-brand-text-mute text-[10.5px] uppercase tracking-[0.14em]">
        <span className="flex items-center gap-1.5">⏱ ~35 minutes</span>
        <span className="flex items-center gap-1.5">🔒 No skip</span>
        <span className="flex items-center gap-1.5">💡 Saved</span>
      </div>

      <button
        onClick={onStart}
        className="w-full py-4 bg-brand-teal-700 hover:bg-brand-teal-600 text-white font-semibold text-[15.5px] rounded-xl transition-colors duration-150 active:scale-[0.99]"
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
  const { profile } = useAuth();
  const studentId = profile?.id || "unknown-student";

  const [sectionState, setSectionState] = useState<SectionState>("loading");
  const [answers, setAnswers] = useState<Record<string, string>>(initialAnswers);
  const [audioPlayed, setAudioPlayed] = useState<boolean>(
    () => storageLoad<boolean>(SK.listeningAudioPlayed) ?? false
  );
  // ── CHANGE 1: track whether audio is currently playing ──
  const [audioPlaying, setAudioPlaying] = useState<boolean>(false);
  const [error, setError] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    fetchDiagnosticQuestionsData("listening")
      .then(res => {
        setData(res);
        // Discard any stale answers from a previous session whose question IDs
        // no longer match the newly-fetched set. Prevents 5+5 = 10-question grading.
        const validIds = new Set<string>((res.questions ?? []).map((q: any) => q.id));
        setAnswers(prev => Object.fromEntries(Object.entries(prev).filter(([id]) => validIds.has(id))));
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

  useEffect(() => {
    storageSave(SK.listeningAudioPlayed, audioPlayed);
  }, [audioPlayed]);

  const allAnswered   = data?.questions ? data.questions.every((q: any) => answers[q.id]) : false;
  const answeredCount = data?.questions?.filter((q: any) => answers[q.id]).length ?? 0;
  const totalCount    = data?.questions?.length ?? 0;

  const handleSubmit = async () => {
    setSectionState("submitting");
    setError(false);
    try {
      setSectionState("scoring");
      const result = await submitSection(studentId, "listening", answers);
      storageClear(SK.listeningAnswers, SK.listeningAudioPlayed);
      setSectionState("scored");
      onComplete(result);
    } catch {
      setError(true);
      setSectionState("ready");
    }
  };

  // ── CHANGE 1: separate onPlay and onEnded handlers ──
  const handleAudioPlay = () => {
    setAudioPlaying(true);
  };

  const handleAudioEnded = () => {
    setAudioPlaying(false);
    setAudioPlayed(true);
  };

  if (sectionState === "loading") {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 bg-brand-teal-wash border border-brand-teal-tint rounded-xl flex items-center justify-center text-xl">🎧</div>
          <div>
            <p className="font-manrope text-brand-ink font-bold text-[16px] tracking-[-0.02em]">Listening Section</p>
            <p className="text-brand-text-mute text-[13.5px] leading-[1.6]">Loading your audio and questions…</p>
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
          <div className="w-16 h-16 rounded-full border-[3px] border-brand-bg-alt border-t-brand-teal-600 animate-spin" />
          <span className="absolute inset-0 flex items-center justify-center text-2xl">🎧</span>
        </div>
        <div>
          <p className="font-manrope text-brand-ink font-bold text-[16px] tracking-[-0.02em]">Scoring your answers…</p>
          <p className="text-brand-text-mute text-[13.5px] mt-1 leading-[1.6]">This takes just a moment.</p>
        </div>
      </div>
    );
  }

  // ── CHANGE 1: derive button label and disabled state from audioPlaying + audioPlayed ──
  const audioButtonLabel = audioPlayed
    ? "Played ✓"
    : audioPlaying
    ? "Playing…"
    : "Play Audio";
  const audioButtonDisabled = audioPlayed || audioPlaying;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-10 h-10 shrink-0 bg-brand-teal-wash border border-brand-teal-tint rounded-xl flex items-center justify-center text-xl">🎧</div>
          <div className="min-w-0">
            <p className="font-manrope text-brand-ink font-bold text-[16px] tracking-[-0.02em]">Listening Section</p>
            <p className="text-brand-text-mute text-[13.5px] leading-[1.6]">{data?.questions?.length ?? 0} questions · Answer all to submit</p>
          </div>
        </div>
        <div className="shrink-0 bg-white border border-brand-line rounded-xl px-3 py-1.5 text-brand-ink text-[13px] font-semibold tabular-nums">
          {Object.keys(answers).length}/{data?.questions?.length ?? 0}
        </div>
      </div>

      <div className="bg-brand-bg border border-brand-line rounded-2xl p-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-brand-teal-700 flex items-center justify-center text-white text-lg shrink-0">
            ▶
          </div>
          <div className="flex-1">
            <p className="font-manrope text-brand-ink text-[14.5px] font-bold tracking-[-0.01em]">Diagnostic Audio Clip</p>
            <p className="text-brand-text-mute text-[12.5px] mt-0.5 leading-[1.6]">
              {audioPlayed
                ? "Audio has been played — replay disabled in exam mode"
                : audioPlaying
                ? "Audio is playing — listen carefully"
                : "Play once. Listen carefully before answering."}
            </p>
          </div>
          {/* ── CHANGE 1: wire up onPlay and onEnded ── */}
          <audio
            ref={audioRef}
            src={data?.audio_url || ""}
            onPlay={handleAudioPlay}
            onEnded={handleAudioEnded}
          />
          <button
            onClick={() => {
              if (!audioPlayed && !audioPlaying) {
                audioRef.current?.play();
              }
            }}
            disabled={audioButtonDisabled}
            className={`px-4 py-2 rounded-xl text-[13.5px] font-semibold border transition-colors duration-150 ${
              audioButtonDisabled
                ? "bg-brand-bg-alt text-brand-text-mute border-brand-line cursor-not-allowed"
                : "bg-brand-teal-700 hover:bg-brand-teal-600 text-white border-transparent"
            }`}
          >
            {audioButtonLabel}
          </button>
        </div>
      </div>

      <div className="space-y-4">
        {data?.questions?.map((q: any, qi: number) => (
          <div
            key={q.id}
            className="bg-white border border-brand-line rounded-2xl p-5"
          >
            <p className="text-brand-text text-[14.5px] font-medium mb-3 leading-[1.65]">
              <span className="font-jetbrains text-brand-teal-700 font-bold mr-2">Q{qi + 1}.</span>
              {q.text}
            </p>
            <div className={`${q.type === 'tfng' ? 'flex gap-2 flex-wrap mt-2' : 'grid grid-cols-1 gap-2'}`}>
              {q.type === 'tfng' ? (
                /* TRUE / FALSE / NOT GIVEN buttons for TFNG questions */
                (['T', 'F', 'NG'] as const).map(val => {
                  const label = val === 'T' ? 'True' : val === 'F' ? 'False' : 'Not Given';
                  const selected = answers[q.id] === val;
                  return (
                    <label
                      key={val}
                      className={`px-4 py-2 rounded-xl border cursor-pointer text-[13px] font-semibold transition-colors duration-150 ${
                        selected
                          ? 'border-transparent bg-brand-teal-700 text-white'
                          : 'border-brand-line text-brand-text-mute hover:border-brand-teal-300 hover:text-brand-text'
                      }`}
                    >
                      {label}
                      <input
                        type="radio"
                        name={q.id}
                        value={val}
                        checked={selected}
                        onChange={() => setAnswers(prev => ({ ...prev, [q.id]: val }))}
                        className="sr-only"
                      />
                    </label>
                  );
                })
              ) : (
                /* MCQ options */
                normaliseOptions(q.options).map(({ letter, text }) => (
                  <label
                    key={letter}
                    className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-colors duration-150 ${
                      answers[q.id] === letter
                        ? 'border-brand-teal-600 bg-brand-teal-wash text-brand-text'
                        : 'border-brand-line text-brand-text-mute hover:border-brand-teal-300 hover:text-brand-text'
                    }`}
                  >
                    <div
                      className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 transition-colors duration-150 ${
                        answers[q.id] === letter ? 'border-brand-teal-600 bg-brand-teal-600' : 'border-brand-line'
                      }`}
                    >
                      {answers[q.id] === letter && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                    </div>
                    <span className={`font-jetbrains font-bold text-[13px] w-5 shrink-0 ${answers[q.id] === letter ? 'text-brand-teal-700' : 'text-brand-teal-600'}`}>
                      {letter}
                    </span>
                    <span className="text-[14px] leading-[1.6]">{text}</span>
                    <input
                      type="radio"
                      name={q.id}
                      value={letter}
                      checked={answers[q.id] === letter}
                      onChange={() => setAnswers(prev => ({ ...prev, [q.id]: letter }))}
                      className="sr-only"
                    />
                  </label>
                ))
              )}
            </div>
          </div>
        ))}
      </div>

      {error && <ErrorBanner onRetry={handleSubmit} />}

      <button
        onClick={handleSubmit}
        disabled={!allAnswered || sectionState === "submitting"}
        className={`w-full py-3.5 rounded-xl font-semibold text-[15px] transition-colors duration-150 ${
          allAnswered
            ? "bg-brand-teal-700 hover:bg-brand-teal-600 text-white active:scale-[0.99]"
            : "bg-brand-bg-alt text-brand-text-mute cursor-not-allowed"
        }`}
      >
        {sectionState === "submitting" ? (
          <span className="flex items-center justify-center gap-2">
            <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            Submitting…
          </span>
        ) : (
          `Submit Listening ${allAnswered ? "✓" : `(${answeredCount}/${totalCount})`}`
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
  const { profile } = useAuth();
  const studentId = profile?.id || profile?.student_id || "unknown-student";

  const [sectionState, setSectionState] = useState<SectionState>("loading");
  const [answers, setAnswers] = useState<Record<string, string>>(initialAnswers);
  const [timeLeft, setTimeLeft] = useState<number>(
    () => storageLoad<number>(SK.readingTimeLeft) ?? 300
  );
  const [error, setError] = useState(false);
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    fetchDiagnosticQuestionsData("reading")
      .then(res => {
        setData(res);
        // Discard stale answers from previous sessions with different question IDs
        const validIds = new Set<string>((res.questions ?? []).map((q: any) => q.id));
        setAnswers(prev => Object.fromEntries(Object.entries(prev).filter(([id]) => validIds.has(id))));
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
        storageSave(SK.readingTimeLeft, next);
        return next;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [sectionState, timeLeft]);

  useEffect(() => {
    storageSave(SK.readingAnswers, answers);
  }, [answers]);

  const allAnswered   = data?.questions ? data.questions.every((q: any) => answers[q.id]) : false;
  const answeredCount = data?.questions?.filter((q: any) => answers[q.id]).length ?? 0;
  const totalCount    = data?.questions?.length ?? 0;
  const timerWarning  = timeLeft <= 60 && timeLeft > 0;

  const handleSubmit = async () => {
    setSectionState("submitting");
    setError(false);
    try {
      setSectionState("scoring");
      const result = await submitSection(studentId, "reading", answers);
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
          <div className="w-10 h-10 bg-brand-teal-wash border border-brand-teal-tint rounded-xl flex items-center justify-center text-xl">📖</div>
          <p className="font-manrope text-brand-ink font-bold text-[16px] tracking-[-0.02em]">Loading Reading Section…</p>
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
          <div className="w-16 h-16 rounded-full border-[3px] border-brand-bg-alt border-t-brand-teal-600 animate-spin" />
          <span className="absolute inset-0 flex items-center justify-center text-2xl">📖</span>
        </div>
        <p className="font-manrope text-brand-ink font-bold text-[16px] tracking-[-0.02em]">Scoring your answers…</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-10 h-10 shrink-0 bg-brand-teal-wash border border-brand-teal-tint rounded-xl flex items-center justify-center text-xl">📖</div>
          <div className="min-w-0">
            <p className="font-manrope text-brand-ink font-bold text-[16px] tracking-[-0.02em]">Reading Section</p>
            <p className="text-brand-text-mute text-[13.5px] leading-[1.6]">Read the passage, then answer {data?.questions?.length ?? 0} questions</p>
          </div>
        </div>
        <div
          className={`shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-xl border font-jetbrains text-[13px] font-semibold tabular-nums transition-colors duration-150 ${
            timerWarning
              ? "bg-amber-50 border-amber-200 text-amber-800"
              : timeLeft === 0
              ? "bg-brand-warm-tint border-brand-warm/30 text-brand-warm"
              : "bg-white border-brand-line text-brand-ink"
          }`}
        >
          <span className="text-xs">{timerWarning ? "⚠" : "⏱"}</span>
          {formatTime(timeLeft)}
          {timeLeft === 0 && <span className="text-[11px] ml-1">Time's up</span>}
        </div>
      </div>

      <div className="bg-brand-bg border border-brand-line rounded-2xl p-5">
        <p className="font-jetbrains text-brand-text-mute text-[10px] uppercase tracking-[0.16em] mb-3">
          Reading Passage
        </p>
        <p className="text-brand-text text-[14.5px] leading-[1.8] whitespace-pre-line">
          {data?.passage}
        </p>
      </div>

      <div className="space-y-4">
        <p className="font-jetbrains text-brand-text-mute text-[10px] uppercase tracking-[0.16em]">
          Questions — True / False / Not Given
        </p>
        {data?.questions?.map((q: any, qi: number) => (
          <div
            key={q.id}
            className="bg-white border border-brand-line rounded-2xl p-5"
          >
            <p className="text-brand-text text-[14.5px] mb-3 leading-[1.65]">
              <span className="font-jetbrains text-brand-teal-700 font-bold mr-2">{qi + 1}.</span>
              {q.text}
            </p>
            <div className="flex gap-2 flex-wrap">
              {q.type === 'tfng' ? (
                /* TRUE / FALSE / NOT GIVEN buttons */
                (['T', 'F', 'NG'] as const).map(val => {
                  const label = val === 'T' ? 'True' : val === 'F' ? 'False' : 'Not Given';
                  const isSelected = answers[q.id] === val;
                  return (
                    <label
                      key={val}
                      className={`px-4 py-2 rounded-xl border cursor-pointer text-[13.5px] font-semibold transition-colors duration-150 ${
                        isSelected
                          ? 'border-transparent bg-brand-teal-700 text-white'
                          : 'border-brand-line text-brand-text-mute hover:border-brand-teal-300 hover:text-brand-text'
                      }`}
                    >
                      {label}
                      <input
                        type="radio"
                        name={q.id}
                        value={val}
                        checked={isSelected}
                        onChange={() => setAnswers(prev => ({ ...prev, [q.id]: val }))}
                        className="sr-only"
                      />
                    </label>
                  );
                })
              ) : (
                /* MCQ options */
                normaliseOptions(q.options).map(({ letter, text }) => {
                  const isSelected = answers[q.id] === letter;
                  return (
                    <label
                      key={letter}
                      className={`px-4 py-2 rounded-xl border cursor-pointer text-[13.5px] font-semibold transition-colors duration-150 ${
                        isSelected
                          ? 'border-transparent bg-brand-teal-700 text-white'
                          : 'border-brand-line text-brand-text-mute hover:border-brand-teal-300 hover:text-brand-text'
                      }`}
                    >
                      {text}
                      <input
                        type="radio"
                        name={q.id}
                        value={letter}
                        checked={isSelected}
                        onChange={() => setAnswers(prev => ({ ...prev, [q.id]: letter }))}
                        className="sr-only"
                      />
                    </label>
                  );
                })
              )}
            </div>
          </div>
        ))}
      </div>

      {error && <ErrorBanner onRetry={handleSubmit} />}

      <button
        onClick={handleSubmit}
        disabled={!allAnswered || sectionState === "submitting"}
        className={`w-full py-3.5 rounded-xl font-semibold text-[15px] transition-colors duration-150 ${
          allAnswered
            ? "bg-brand-teal-700 hover:bg-brand-teal-600 text-white active:scale-[0.99]"
            : "bg-brand-bg-alt text-brand-text-mute cursor-not-allowed"
        }`}
      >
        {sectionState === "submitting" ? (
          <span className="flex items-center justify-center gap-2">
            <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            Submitting…
          </span>
        ) : (
          `Submit Reading ${allAnswered ? "✓" : `(${answeredCount}/${totalCount})`}`
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
  const { profile } = useAuth();
  const studentId = profile?.id || (profile as { student_id?: string })?.student_id || "unknown-student";

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
  const raw = data?.minWords;
  // Default must match the backend's fallback (150) so the on-screen requirement and
  // the server-side under-length cap agree when a prompt has no min_words set.
  const MIN_WORDS = (typeof raw === 'number' && Number.isFinite(raw) && raw > 0) ? raw : 150;

  useEffect(() => {
    storageSave(SK.writingText, text);
  }, [text]);

  const handleSubmit = async () => {
    setSectionState("submitting");
    setError(false);
    try {
      setSectionState("scoring");
      const result = await submitWriting(studentId, text, data?.id);
      storageClear(SK.writingText);
      setSectionState("scored");
      onComplete(result);
    } catch {
      setError(true);
      setSectionState("ready");
    }
  };

  // Copy/paste/cut/drag are always blocked in the writing answer field — exam integrity requirement
  const handlePaste = (e: React.ClipboardEvent<HTMLTextAreaElement>) => { e.preventDefault(); };
  const handleCopy  = (e: React.ClipboardEvent<HTMLTextAreaElement>) => { e.preventDefault(); };
  const handleCut   = (e: React.ClipboardEvent<HTMLTextAreaElement>) => { e.preventDefault(); };
  const handleDrop  = (e: React.DragEvent<HTMLTextAreaElement>)      => { e.preventDefault(); };
  const handleContextMenu = (e: React.MouseEvent<HTMLTextAreaElement>) => { e.preventDefault(); };

  if (sectionState === "loading") {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 bg-brand-teal-wash border border-brand-teal-tint rounded-xl flex items-center justify-center text-xl">✍️</div>
          <p className="font-manrope text-brand-ink font-bold text-[16px] tracking-[-0.02em]">Loading Writing Task…</p>
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
          <div className="w-16 h-16 rounded-full border-[3px] border-brand-bg-alt border-t-brand-teal-600 animate-spin" />
          <span className="absolute inset-0 flex items-center justify-center text-2xl">✍️</span>
        </div>
        <div>
          <p className="font-manrope text-brand-ink font-bold text-[16px] tracking-[-0.02em]">AI Examiner Reviewing…</p>
          <p className="text-brand-text-mute text-[13.5px] mt-1 leading-[1.6]">This may take 5–10 seconds. Please wait.</p>
        </div>
        <div className="flex gap-1 mt-2">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="w-2 h-2 rounded-full bg-brand-teal-600 animate-bounce"
              style={{ animationDelay: `${i * 0.15}s` }}
            />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* ── CHANGE 2: header row now has justify-between with word count on the right ── */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-10 h-10 shrink-0 bg-brand-teal-wash border border-brand-teal-tint rounded-xl flex items-center justify-center text-xl">✍️</div>
          <div className="min-w-0">
            <p className="font-manrope text-brand-ink font-bold text-[16px] tracking-[-0.02em]">Writing Section</p>
            <p className="text-brand-text-mute text-[13.5px] leading-[1.6]">Write your response in at least {MIN_WORDS} words</p>
          </div>
        </div>
        {/* Word count badge moved here from inside the textarea div */}
        <div
          className={`shrink-0 px-3 py-1.5 rounded-xl border font-jetbrains text-[12.5px] font-semibold tabular-nums transition-colors duration-150 ${
            wordCount >= MIN_WORDS
              ? "bg-brand-teal-700 text-white border-transparent"
              : "bg-white text-brand-text-mute border-brand-line"
          }`}
        >
          {wordCount} / {MIN_WORDS}
        </div>
      </div>

      {data?.image_url && (
        <div className="rounded-2xl overflow-hidden border border-brand-line mb-4">
          <img
            src={data.image_url}
            alt="Writing Task Visualization"
            className="w-full object-cover"
          />
        </div>
      )}

      <div className="bg-brand-bg border border-brand-line rounded-2xl p-4">
        <p className="text-brand-text text-[14.5px] leading-[1.75]">{data?.topic}</p>
      </div>

      {/* ── CHANGE 2: textarea wrapper no longer needs "relative" for the word count badge ── */}
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        onPaste={handlePaste}
        onCopy={handleCopy}
        onCut={handleCut}
        onDrop={handleDrop}
        onContextMenu={handleContextMenu}
        disabled={sectionState === "submitting"}
        placeholder="Begin writing your response here…"
        rows={8}
        className="w-full bg-white border border-brand-line rounded-2xl p-4 text-brand-text text-[14.5px] leading-[1.8] resize-none focus:outline-none focus:border-brand-teal-600 placeholder:text-brand-text-mute/60 transition-colors duration-150"
      />

      <div className="space-y-1.5">
        <div className="h-1.5 bg-brand-bg-alt rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-300 ${
              wordCount >= MIN_WORDS ? "bg-brand-teal-600" : "bg-brand-teal-300"
            }`}
            style={{ width: `${Math.min((wordCount / MIN_WORDS) * 100, 100)}%` }}
          />
        </div>
        <p className="text-brand-text-mute text-[12.5px]">
          {wordCount < MIN_WORDS
            ? `${MIN_WORDS - wordCount} more words needed to enable submission`
            : "Minimum word count reached ✓"}
        </p>
      </div>

      <p className="font-jetbrains text-brand-text-mute text-[10.5px] flex items-center gap-1.5 uppercase tracking-[0.14em]">
        <span>🔒</span> Copy-paste disabled — all responses must be typed.
      </p>

      {error && <ErrorBanner onRetry={handleSubmit} />}

      <button
        onClick={handleSubmit}
        disabled={wordCount < MIN_WORDS || sectionState === "submitting"}
        className={`w-full py-3.5 rounded-xl font-semibold text-[15px] transition-colors duration-150 ${
          wordCount >= MIN_WORDS
            ? "bg-brand-teal-700 hover:bg-brand-teal-600 text-white active:scale-[0.99]"
            : "bg-brand-bg-alt text-brand-text-mute cursor-not-allowed"
        }`}
      >
        {sectionState === "submitting" ? (
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
  const { profile } = useAuth();
  const studentId = profile?.id || profile?.student_id || "unknown-student";

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
    if (!audioBlob || recordState === "uploading" || recordState === "processing") return;
    setError(null);
    setRecordState("uploading");
    try {
      setRecordState("processing");
      const result = await submitSpeaking(studentId, audioBlob, data?.id);
      storageSave(SK.speakingResult, result);
      setRecordState("done");
      onComplete(result);
    } catch (err: any) {
      if (err?.canRetry) {
        // Empty / silent audio — clear the bad recording and let them try again
        setAudioBlob(null);
        setElapsed(0);
        setRecordState("idle");
        setError(err.message ?? 'No speech was detected in your recording. Please check your microphone and record again.');
      } else {
        setError("Upload failed. Your recording is still available — please try again.");
        setRecordState("recorded");
      }
    }
  };

  const handleRerecord = () => {
    setAudioBlob(null);
    setElapsed(0);
    setError(null);
    setRecordState("idle");
  };

  const progress = Math.min((elapsed / MAX_DURATION) * 100, 100);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-brand-teal-wash border border-brand-teal-tint rounded-xl flex items-center justify-center text-xl">🎤</div>
        <div>
          <p className="font-manrope text-brand-ink font-bold text-[16px] tracking-[-0.02em]">Speaking Section</p>
          <p className="text-brand-text-mute text-[13.5px] leading-[1.6]">Up to 90 seconds · Speak clearly and naturally</p>
        </div>
      </div>

      <div className="bg-brand-bg border border-brand-line rounded-2xl p-5">
        <p className="font-jetbrains text-brand-text-mute text-[10px] uppercase tracking-[0.16em] mb-2">
          Your Speaking Prompt
        </p>
        <div className="text-brand-text text-[14.5px] leading-[1.8] space-y-2">
          {data?.prompts?.map((prompt: string, i: number) => (
            <p key={i}><span className="font-jetbrains font-bold text-brand-teal-700 mr-2">{i+1}.</span>{prompt}</p>
          ))}
        </div>
      </div>

      {recordState === "idle" && (
        <div className="bg-brand-teal-wash border border-brand-teal-tint rounded-2xl p-4">
          <ul className="text-brand-text text-[14px] space-y-2 leading-[1.6]">
            <li className="flex gap-2"><span className="text-brand-teal-600 font-bold">→</span>Read the prompt carefully before recording</li>
            <li className="flex gap-2"><span className="text-brand-teal-600 font-bold">→</span>Tap the button below to start — you have 90 seconds</li>
            <li className="flex gap-2"><span className="text-brand-teal-600 font-bold">→</span>Speak naturally — your response will be transcribed and scored</li>
          </ul>
        </div>
      )}

      <div className="flex flex-col items-center gap-5 py-4">
        {recordState === "recording" && (
          <div className="flex items-center gap-1 h-12">
            {animBars.map((h, i) => (
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

        {(recordState === "recording" || recordState === "recorded") && (
          <div className="w-full space-y-2">
            <div className="flex justify-between font-jetbrains text-[12px] text-brand-text-mute font-semibold tabular-nums">
              <span>{formatTime(elapsed)}</span>
              <span className={elapsed >= MAX_DURATION - 10 ? "text-amber-600" : ""}>
                {formatTime(MAX_DURATION - elapsed)} remaining
              </span>
            </div>
            <div className="h-1.5 bg-brand-bg-alt rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-1000 ${
                  progress > 80 ? "bg-amber-500" : "bg-rose-500"
                }`}
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        )}

        {(recordState === "idle" || recordState === "recording") && (
          <button
            onClick={recordState === "idle" ? startRecording : stopRecording}
            className={`w-20 h-20 rounded-2xl flex items-center justify-center text-2xl transition-colors duration-150 shadow-sm ${
              recordState === "recording"
                ? "bg-rose-500 hover:bg-rose-600 text-white animate-pulse"
                : "bg-brand-teal-700 hover:bg-brand-teal-600 text-white"
            }`}
          >
            {recordState === "idle" && "●"}
            {recordState === "recording" && "■"}
          </button>
        )}

        {recordState === "recorded" && (
          <div className="w-20 h-20 rounded-2xl flex items-center justify-center text-2xl bg-brand-ink text-white shadow-sm">
            ✓
          </div>
        )}

        <p className="text-brand-text-mute text-[13.5px] text-center leading-[1.6]">
          {recordState === "idle" && "Tap to start recording"}
          {recordState === "recording" && "Recording… tap the square to stop"}
          {recordState === "recorded" && `Recorded (${formatTime(elapsed)}). Review below, then submit when ready.`}
        </p>

        {recordState === "recorded" && (
          <div className="flex items-center gap-3">
            <button
              onClick={handleRerecord}
              className="px-6 py-3 bg-white hover:bg-brand-bg-alt text-brand-text border border-brand-line font-semibold text-[15px] rounded-xl transition-colors duration-150 active:scale-[0.98]"
            >
              ↺ Re-record
            </button>
            <button
              onClick={handleSubmit}
              className="px-8 py-3 bg-brand-teal-700 hover:bg-brand-teal-600 text-white font-semibold text-[15px] rounded-xl transition-colors duration-150 active:scale-[0.98]"
            >
              Submit Recording →
            </button>
          </div>
        )}
      </div>

      {(recordState === "uploading" || recordState === "processing") && (
        <div className="flex flex-col items-center gap-4 py-8 text-center">
          <div className="relative">
            <div className="w-16 h-16 rounded-full border-[3px] border-brand-bg-alt border-t-brand-teal-600 animate-spin" />
            <span className="absolute inset-0 flex items-center justify-center text-2xl">🎤</span>
          </div>
          <div>
            <p className="font-manrope text-brand-ink font-bold text-[16px] tracking-[-0.02em]">
              {recordState === "uploading" ? "Uploading Recording…" : "AI Scoring in Progress…"}
            </p>
            <p className="text-brand-text-mute text-[13.5px] mt-1 leading-[1.6]">
              {recordState === "uploading"
                ? "Please don't navigate away."
                : "This may take 10–20 seconds. Sit tight!"}
            </p>
          </div>
        </div>
      )}

      {error && (
        <div className="border border-brand-warm/30 bg-brand-warm-tint rounded-2xl p-4">
          <p className="text-brand-text font-medium text-[14px] leading-[1.6]">{error}</p>
        </div>
      )}

      {recordState === "idle" && (
        <p className="font-jetbrains text-brand-text-mute text-[10.5px] text-center uppercase tracking-[0.14em]">
          Browser will request microphone access. Use Chrome for best results.
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

  // Distinct only if the criteria actually differ — a single sub-score, or an all-tied
  // set, makes maxSub/minSub collapse onto the same entry via the reduce above.
  // Showing "Strongest: X" and "Weakest: X" for the same criterion would be nonsense.
  const hasDistinctStrongestWeakest = subScoreEntries.length > 1 && maxSub[0] !== minSub[0];

  const level = getBandLevel(band_score);
  const feedbackSource = result.feedback ?? result.sub_scores?.feedback;
  const fillerWordCount = Array.isArray(feedbackSource?.filler_words_detected)
    ? feedbackSource.filler_words_detected.length
    : 0;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Score hero — dark surface with mint score, per the approved mock */}
      <div className="relative overflow-hidden rounded-2xl border border-brand-line-12 bg-brand-ink px-6 py-8 text-center">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 opacity-[0.06]"
          style={{
            backgroundImage:
              'linear-gradient(to right, #2EE8A6 1px, transparent 1px), linear-gradient(to bottom, #2EE8A6 1px, transparent 1px)',
            backgroundSize: '48px 48px',
          }}
        />
        <div className="relative flex flex-col items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-white/10 border border-brand-line-12 flex items-center justify-center text-2xl">🎤</div>
          <div>
            <p className="font-jetbrains text-brand-mint text-[10.5px] uppercase tracking-[0.18em] mb-2">Speaking · Section Complete</p>
            <div className="font-manrope text-[68px] font-extrabold text-brand-mint tabular-nums leading-none tracking-[-0.03em]">
              {band_score.toFixed(1)}
            </div>
            <p className="font-jetbrains text-brand-on-ink-mute text-[10.5px] mt-2 uppercase tracking-[0.16em]">Band Score</p>
          </div>
          <LevelBadge level={level} size="lg" />
        </div>
      </div>

      {(hasDistinctStrongestWeakest || fillerWordCount > 0) && (
        <div className="flex flex-wrap items-center justify-center gap-2">
          {hasDistinctStrongestWeakest && (
            <>
              <span className="inline-flex items-center gap-1.5 bg-brand-teal-wash border border-brand-teal-tint text-brand-teal-700 text-[11.5px] font-semibold px-3 py-1.5 rounded-full">
                <Trophy className="w-3 h-3" /> Strongest: {subScoreLabels[maxSub[0]] ?? maxSub[0]}
              </span>
              <span className="inline-flex items-center gap-1.5 bg-amber-50 border border-amber-200 text-amber-800 text-[11.5px] font-semibold px-3 py-1.5 rounded-full">
                <TrendingDown className="w-3 h-3" /> Weakest: {subScoreLabels[minSub[0]] ?? minSub[0]}
              </span>
            </>
          )}
          {fillerWordCount > 0 && (
            <span className="inline-flex items-center gap-1.5 bg-brand-warm-tint border border-brand-warm/30 text-brand-warm text-[11.5px] font-semibold px-3 py-1.5 rounded-full">
              <MessageSquareWarning className="w-3 h-3" /> {fillerWordCount} Filler Word{fillerWordCount === 1 ? '' : 's'}
            </span>
          )}
        </div>
      )}

      {subScoreEntries.length > 0 && (
        <div className="bg-white border border-brand-line rounded-2xl overflow-hidden">
          <p className="px-5 py-3 font-jetbrains text-brand-text-mute text-[10px] uppercase tracking-[0.16em] border-b border-brand-line">
            Criterion Breakdown
          </p>
          <div className="divide-y divide-brand-line">
            {subScoreEntries.map(([key, val]) => {
              const isWeakest = hasDistinctStrongestWeakest && key === minSub[0];
              const isStrongest = hasDistinctStrongestWeakest && key === maxSub[0];
              return (
                <div
                  key={key}
                  className={`flex items-center justify-between gap-2 px-4 sm:px-5 py-3 ${
                    isWeakest ? "bg-amber-50/60" : isStrongest ? "bg-brand-teal-wash" : "bg-white"
                  }`}
                >
                  <span className="text-brand-text text-[14px] font-medium min-w-0 flex flex-wrap items-center gap-x-2 gap-y-1">
                    {subScoreLabels[key] ?? key}
                    {isWeakest && (
                      <span className="text-amber-800 text-[11px] font-semibold border border-amber-200 bg-amber-50 px-2 py-0.5 rounded-full">needs work</span>
                    )}
                    {isStrongest && (
                      <span className="text-brand-teal-700 text-[11px] font-semibold border border-brand-teal-tint bg-white px-2 py-0.5 rounded-full">strongest</span>
                    )}
                  </span>
                  <span
                    className={`shrink-0 font-manrope font-extrabold tabular-nums text-lg tracking-[-0.02em] ${
                      isWeakest ? "text-amber-600" : isStrongest ? "text-brand-teal-700" : "text-brand-ink"
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

      {feedbackSource && (
        <FeedbackAccordion title="AI Detailed Feedback">
          <DetailedFeedbackDisplay feedback={feedbackSource} />
        </FeedbackAccordion>
      )}

      <button
        onClick={onContinue}
        className="w-full py-3.5 bg-brand-teal-700 hover:bg-brand-teal-600 text-white font-semibold text-[15px] rounded-xl transition-colors duration-150 active:scale-[0.99]"
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
  targetBand,
}: {
  results: AllResults;
  onGoToDashboard: () => void;
  targetBand?: number | null;
}) {
  const { profile } = useAuth();
  const skills: Skill[] = ["listening", "reading", "writing", "speaking"];
  const avgScore = getAverageScore(results);
  const overallLevel = getBandLevel(avgScore);
  const target = Number(targetBand) || 7.0;
  const [breakdownOpen, setBreakdownOpen] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);

  const radarData = skills.map((skill) => ({
    skill: SKILL_LABELS[skill],
    band: Number(results[skill]?.band_score) || 4,
    target,
  }));

  const readinessMessages: Record<Level, string> = {
    A: "You're at the foundation stage. Our personalised plan will fast-track you toward your target band.",
    B: "You have a solid base to build on. Focused practice will push you into the upper bands.",
    C: "You're performing at an advanced level. Precision refinement is all that stands between you and your target.",
  };

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="text-center space-y-3">
        <div className="w-14 h-14 bg-brand-teal-wash border border-brand-teal-tint rounded-xl flex items-center justify-center text-2xl mx-auto">🎓</div>
        <h2 className="font-manrope text-[30px] font-extrabold text-brand-ink leading-[1.1] tracking-[-0.03em]">Diagnostic complete</h2>
        <p className="text-brand-text-mute text-[14.5px] max-w-sm mx-auto leading-[1.7]">
          Here's your IELTS baseline. Your personalised learning path has been generated.
        </p>
      </div>

      <div className="relative overflow-hidden rounded-2xl border border-brand-line-12 bg-brand-ink px-6 py-8 text-center">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 opacity-[0.06]"
          style={{
            backgroundImage:
              'linear-gradient(to right, #2EE8A6 1px, transparent 1px), linear-gradient(to bottom, #2EE8A6 1px, transparent 1px)',
            backgroundSize: '48px 48px',
          }}
        />
        <div className="relative space-y-3">
          <p className="font-jetbrains text-brand-mint text-[10.5px] uppercase tracking-[0.18em]">Overall Band Score</p>
          <div className="font-manrope text-[64px] font-extrabold tabular-nums text-brand-mint leading-none tracking-[-0.03em]">
            {avgScore.toFixed(1)}
          </div>
          <div className="flex justify-center">
            <span className="inline-flex items-center gap-2 rounded-full border border-brand-line-25 bg-white/10 font-semibold px-4 py-1.5 text-[14px] text-brand-bg">
              <span className="w-2 h-2 rounded-full bg-brand-mint" />
              Level {overallLevel} · {getLevelConfig(overallLevel).label}
            </span>
          </div>
          <p className="text-brand-on-ink text-[14px] max-w-xs mx-auto leading-[1.7]">
            {readinessMessages[overallLevel]}
          </p>
        </div>
      </div>

      <div className="border border-brand-line bg-white rounded-2xl p-3 sm:p-4">
        <div style={{ width: '100%', height: 300 }}>
          <ResponsiveContainer width="100%" height="100%">
            <RadarChart data={radarData} margin={{ top: 8, right: 44, bottom: 8, left: 44 }}>
              <PolarGrid stroke="#D8E0E2" />
              <PolarAngleAxis dataKey="skill" tick={{ fill: '#17232B', fontSize: 10, fontWeight: 600 }} />
              <PolarRadiusAxis domain={[4, 9]} tickCount={6} tick={{ fill: '#5E6B73', fontSize: 9 }} />
              <Radar name={`Target (${target.toFixed(1)})`} dataKey="target" stroke="#8FA0A8" strokeDasharray="4 4" fill="#8FA0A8" fillOpacity={0.04} isAnimationActive={false} />
              <Radar name="Your Band" dataKey="band" stroke="#0A6E64" fill="#0A6E64" fillOpacity={0.35} strokeWidth={2} />
              <Legend wrapperStyle={{ fontSize: 11, fontWeight: 600 }} />
            </RadarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="flex flex-wrap justify-center gap-2">
        {skills.map((skill) => {
          const result = results[skill];
          if (!result) return null;
          const score = Number(result.band_score) || 0;
          const chipColor = score < 5.5
            ? { bg: '#FFF1F2', border: '#FECDD3', text: '#9F1239' }
            : score < 7.0
            ? { bg: '#FFFBEB', border: '#FDE68A', text: '#92400E' }
            : { bg: '#ECFDF5', border: '#A7F3D0', text: '#065F46' };
          return (
            <span
              key={skill}
              className="inline-flex items-center gap-1.5 text-[12px] font-semibold px-3 py-1.5 rounded-full border"
              style={{ background: chipColor.bg, borderColor: chipColor.border, color: chipColor.text }}
            >
              {SKILL_ICONS[skill]} {SKILL_LABELS[skill]} · {score.toFixed(1)}
            </span>
          );
        })}
      </div>

      <div className="border border-brand-line rounded-2xl overflow-hidden">
        <button
          type="button"
          onClick={() => setBreakdownOpen(o => !o)}
          className="w-full flex items-center justify-between px-4 py-3 bg-white text-left"
        >
          <span className="font-jetbrains text-brand-text-mute text-[10.5px] uppercase tracking-[0.16em]">Skill Breakdown</span>
          <ChevronDown className={`w-4 h-4 text-brand-text-mute transition-transform duration-200 ${breakdownOpen ? 'rotate-180' : ''}`} />
        </button>
        {breakdownOpen && (
          <div className="px-4 pb-4 pt-1 bg-white space-y-4">
            {skills.map((skill) => {
              const result = results[skill];
              if (!result || !result.sub_scores) return null;
              const sub = result.sub_scores;

              if (skill === 'writing' && sub.grammarScore !== undefined) {
                const bars = [
                  { label: 'Task Achievement', key: 'taskResponseScore' },
                  { label: 'Coherence', key: 'coherenceScore' },
                  { label: 'Vocabulary', key: 'vocabularyScore' },
                  { label: 'Grammar', key: 'grammarScore' },
                ];
                return (
                  <div key={skill}>
                    <p className="font-jetbrains text-[10px] uppercase tracking-[0.16em] text-brand-text-mute mb-2">Writing</p>
                    <div className="space-y-1.5">
                      {bars.map(({ label, key }) => {
                        const score = Number(sub[key]) || 0;
                        return (
                          <div key={key} className="flex items-center gap-2">
                            <span className="text-[12px] font-medium text-brand-text-mute w-28 shrink-0">{label}</span>
                            <div className="flex-1 h-1.5 bg-brand-bg-alt rounded-full overflow-hidden">
                              <div className={`h-full ${getScoreBarColor(score)} rounded-full`} style={{ width: `${Math.min(100, (score / 9) * 100)}%` }} />
                            </div>
                            <span className="text-[12px] font-bold text-brand-ink w-8 text-right tabular-nums">{score.toFixed(1)}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              }

              if (skill === 'speaking' && sub.fluencyScore !== undefined) {
                const bars = [
                  { label: 'Fluency', key: 'fluencyScore' },
                  { label: 'Vocabulary', key: 'vocabularyScore' },
                  { label: 'Grammar', key: 'grammarScore' },
                  { label: 'Pronunciation', key: 'pronunciationScore' },
                ];
                return (
                  <div key={skill}>
                    <p className="font-jetbrains text-[10px] uppercase tracking-[0.16em] text-brand-text-mute mb-2">Speaking</p>
                    <div className="space-y-1.5">
                      {bars.map(({ label, key }) => {
                        const score = Number(sub[key]) || 0;
                        return (
                          <div key={key} className="flex items-center gap-2">
                            <span className="text-[12px] font-medium text-brand-text-mute w-28 shrink-0">{label}</span>
                            <div className="flex-1 h-1.5 bg-brand-bg-alt rounded-full overflow-hidden">
                              <div className={`h-full ${getScoreBarColor(score)} rounded-full`} style={{ width: `${Math.min(100, (score / 9) * 100)}%` }} />
                            </div>
                            <span className="text-[12px] font-bold text-brand-ink w-8 text-right tabular-nums">{score.toFixed(1)}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              }

              if ((skill === 'listening' || skill === 'reading') && sub.total_questions !== undefined) {
                const byType = sub.by_question_type as Record<string, { correct: number; total: number }> | undefined;
                return (
                  <div key={skill}>
                    <p className="font-jetbrains text-[10px] uppercase tracking-[0.16em] text-brand-text-mute mb-2">{SKILL_LABELS[skill]}</p>
                    <div className="flex items-center justify-between text-[13px] mb-1.5">
                      <span className="font-medium text-brand-text-mute">Accuracy</span>
                      <span className="font-bold text-brand-ink tabular-nums">{sub.accuracy_percentage}% ({sub.correct_answers}/{sub.total_questions})</span>
                    </div>
                    {byType && Object.keys(byType).length > 0 && (
                      <div className="flex gap-3">
                        {Object.entries(byType).map(([type, stats]) => (
                          <span key={type} className="text-[12px] font-medium text-brand-text-mute">
                            {QUESTION_TYPE_LABELS[type] ?? type}: <span className="text-brand-ink font-bold tabular-nums">{stats.correct}/{stats.total}</span>
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                );
              }
              return null;
            })}
          </div>
        )}
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <button
          type="button"
          onClick={() => setReportOpen(true)}
          className="inline-flex items-center justify-center gap-2 sm:w-56 py-4 bg-transparent hover:bg-brand-bg text-brand-ink font-semibold text-[15px] rounded-xl border border-brand-line hover:border-brand-teal-300 transition-colors duration-150"
        >
          <Download className="w-4 h-4" /> Download Report
        </button>
        <button
          type="button"
          onClick={onGoToDashboard}
          className="inline-block text-center flex-1 py-4 bg-brand-teal-700 hover:bg-brand-teal-600 text-white font-semibold text-[15.5px] rounded-xl transition-colors duration-150 active:scale-[0.99]"
        >
          Go to Dashboard →
        </button>
      </div>

      {reportOpen && (
        <DiagnosticReportModal
          results={results}
          targetBand={target}
          avgScore={avgScore}
          overallLevel={overallLevel}
          studentName={profile?.name || "Student"}
          onClose={() => setReportOpen(false)}
        />
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// DIAGNOSTIC REPORT — PRINTABLE VIEW (G-D4)
// ─────────────────────────────────────────────────────────────────────────────

function DiagnosticReportModal({
  results,
  targetBand,
  avgScore,
  overallLevel,
  studentName,
  onClose,
}: {
  results: AllResults;
  targetBand: number;
  avgScore: number;
  overallLevel: Level;
  studentName: string;
  onClose: () => void;
}) {
  useEffect(() => {
    const style = document.createElement('style');
    style.id = 'tc-diagnostic-print-style';
    style.textContent = `
      @media print {
        * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
        body > *:not(#tc-diagnostic-report) { display: none !important; }
        #tc-diagnostic-report { display: block !important; position: static !important; overflow: visible !important; background: white !important; }
        @page { size: A4; margin: 1.5cm; }
      }
    `;
    document.head.appendChild(style);
    return () => {
      document.getElementById('tc-diagnostic-print-style')?.remove();
    };
  }, []);

  const skills: Skill[] = ["listening", "reading", "writing", "speaking"];
  const attempted = skills.filter((s) => results[s]);
  const generatedAt = new Date().toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' });

  const radarData = skills.map((skill) => ({
    skill: SKILL_LABELS[skill],
    band: Number(results[skill]?.band_score) || 4,
    target: targetBand,
  }));

  const weakest = attempted.length > 0
    ? attempted.reduce((min, s) => (Number(results[s]!.band_score) < Number(results[min]!.band_score) ? s : min), attempted[0])
    : null;

  return createPortal(
    <div id="tc-diagnostic-report" className="fixed inset-0 z-[200] bg-brand-bg overflow-y-auto">
      <div className="print:hidden sticky top-0 z-10 bg-white border-b border-brand-line px-3 sm:px-6 py-3 flex items-center justify-between gap-2">
        <span className="font-manrope font-bold text-brand-ink text-[13px] sm:text-[15px] tracking-[-0.01em] truncate">Diagnostic Report Preview</span>
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => window.print()}
            className="inline-flex items-center gap-2 px-3 sm:px-4 py-2 rounded-xl bg-brand-teal-700 hover:bg-brand-teal-600 text-white text-[13px] font-semibold transition-colors duration-150"
          >
            <Download className="w-3.5 h-3.5" /> <span className="hidden sm:inline">Save as PDF</span><span className="sm:hidden">PDF</span>
          </button>
          <button
            onClick={onClose}
            className="inline-flex items-center gap-2 px-3 sm:px-4 py-2 rounded-xl bg-transparent hover:bg-brand-bg text-brand-text-mute hover:text-brand-ink text-[13px] font-semibold border border-brand-line transition-colors duration-150"
          >
            Close
          </button>
        </div>
      </div>

      <div className="max-w-[800px] mx-auto bg-white shadow-sm my-4 sm:my-8 p-5 sm:p-8 print:shadow-none print:my-0 print:p-[1.5cm]">
        <div className="flex items-start justify-between pb-4 border-b border-brand-line mb-8">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-brand-teal-700 flex items-center justify-center flex-shrink-0">
              <span className="text-white font-bold text-sm">TC</span>
            </div>
            <div>
              <div className="font-manrope font-extrabold text-brand-ink text-base leading-tight tracking-[-0.02em]">TestCrack</div>
              <div className="text-brand-text-mute text-xs">IELTS Preparation Platform</div>
            </div>
          </div>
          <div className="text-right">
            <div className="font-jetbrains text-[10px] uppercase tracking-[0.16em] text-brand-teal-700 mb-0.5">Diagnostic Baseline Report</div>
            <div className="text-xs text-brand-text-mute">{generatedAt}</div>
          </div>
        </div>

        <div className="mb-8">
          <h1 className="font-manrope text-[22px] font-extrabold text-brand-ink tracking-[-0.02em]">{studentName}</h1>
          <p className="text-[14px] text-brand-text-mute">IELTS Diagnostic Baseline Assessment</p>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-8">
          <div className="border border-brand-line rounded-2xl p-5 text-center">
            <p className="font-jetbrains text-[10px] uppercase text-brand-text-mute tracking-[0.16em] mb-1">Overall Band</p>
            <p className="font-manrope text-4xl font-extrabold text-brand-ink tabular-nums tracking-[-0.03em]">{avgScore.toFixed(1)}</p>
            <p className="text-xs text-brand-text-mute mt-1">Level {overallLevel} · {getLevelConfig(overallLevel).label}</p>
          </div>
          <div className="border border-brand-line rounded-2xl p-5 text-center">
            <p className="font-jetbrains text-[10px] uppercase text-brand-text-mute tracking-[0.16em] mb-1">Target Band</p>
            <p className="font-manrope text-4xl font-extrabold text-brand-ink tabular-nums tracking-[-0.03em]">{targetBand.toFixed(1)}</p>
            <p className="text-xs text-brand-text-mute mt-1">
              {avgScore >= targetBand ? "Target reached" : `Gap: ${(targetBand - avgScore).toFixed(1)}`}
            </p>
          </div>
        </div>

        <div className="border border-brand-line rounded-2xl p-4 mb-8">
          <div style={{ width: '100%', height: 280 }}>
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart data={radarData} margin={{ top: 8, right: 44, bottom: 8, left: 44 }}>
                <PolarGrid stroke="#D8E0E2" />
                <PolarAngleAxis dataKey="skill" tick={{ fill: '#17232B', fontSize: 10, fontWeight: 600 }} />
                <PolarRadiusAxis domain={[4, 9]} tickCount={6} tick={{ fill: '#5E6B73', fontSize: 9 }} />
                <Radar name={`Target (${targetBand.toFixed(1)})`} dataKey="target" stroke="#8FA0A8" strokeDasharray="4 4" fill="#8FA0A8" fillOpacity={0.04} isAnimationActive={false} />
                <Radar name="Your Band" dataKey="band" stroke="#0A6E64" fill="#0A6E64" fillOpacity={0.35} strokeWidth={2} isAnimationActive={false} />
                <Legend wrapperStyle={{ fontSize: 11, fontWeight: 600 }} />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="mb-8">
          <h2 className="font-jetbrains text-[10px] uppercase tracking-[0.16em] text-brand-text-mute mb-3">Skill-by-Skill Breakdown</h2>
          <div className="overflow-x-auto -mx-1 px-1 print:overflow-visible">
          <table className="w-full min-w-[480px] print:min-w-0 text-sm border-collapse">
            <thead>
              <tr className="border-b border-brand-line">
                {['Skill', 'Band', 'Level', 'Feedback Summary'].map((h) => (
                  <th key={h} className="text-left font-jetbrains text-[10px] uppercase tracking-[0.16em] text-brand-text-mute px-2 py-2 first:pl-0">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {skills.map((skill) => {
                const result = results[skill];
                if (!result) {
                  return (
                    <tr key={skill} className="border-b border-brand-line">
                      <td className="px-2 py-3 pl-0 font-semibold text-brand-text-mute">{SKILL_LABELS[skill]}</td>
                      <td colSpan={3} className="px-2 py-3 text-brand-text-mute">Not attempted</td>
                    </tr>
                  );
                }
                const level = getBandLevel(result.band_score);
                const feedbackSource = result.feedback ?? result.sub_scores?.feedback;
                const summary = typeof feedbackSource === 'string'
                  ? feedbackSource
                  : feedbackSource?.priority_action ?? '—';
                return (
                  <tr key={skill} className="border-b border-brand-line">
                    <td className="px-2 py-3 pl-0 font-semibold text-brand-ink">{SKILL_LABELS[skill]}</td>
                    <td className="px-2 py-3 font-bold text-brand-ink tabular-nums">{result.band_score.toFixed(1)}</td>
                    <td className="px-2 py-3 text-brand-text-mute">{getLevelConfig(level).label}</td>
                    <td className="px-2 py-3 text-brand-text-mute">{summary}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          </div>
        </div>

        {weakest && (
          <div className="border border-brand-teal-tint bg-brand-teal-wash rounded-2xl p-5">
            <p className="font-jetbrains text-[10px] uppercase tracking-[0.16em] text-brand-teal-700 mb-2">Recommended Next Steps</p>
            <p className="text-[14px] text-brand-text leading-[1.75]">
              Focus first on <strong>{SKILL_LABELS[weakest]}</strong> — it's currently the lowest-scoring skill at band {results[weakest]!.band_score.toFixed(1)}.
              Consistent daily practice targeting this area will have the fastest impact on the overall band, before moving to a broader review across all four skills.
            </p>
          </div>
        )}

        <div className="border-t border-brand-line pt-6 mt-8">
          <p className="text-xs text-brand-text-mute">Generated by TestCrack · Diagnostic Engine v1</p>
        </div>
      </div>
    </div>,
    document.body
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN DIAGNOSIS PAGE
// ─────────────────────────────────────────────────────────────────────────────

type Phase = "gate" | Skill | "speaking_result" | "summary";

function DiagnosisInner() {
  const { profile, refreshProfile } = useAuth();
  const navigate = useNavigate();
  const studentId =
    profile?.id || (profile as { student_id?: string })?.student_id ||
    "unknown-student";
  // Bind localStorage to this student before any phase child reads it.
  setStorageNamespace(studentId);

  const [tabConflict, setTabConflict] = useState(false);
  const tabIdRef = useRef(Math.random().toString(36).substring(2, 15));

  useEffect(() => {
    const tabId = tabIdRef.current;
    // Namespace the lock key AND the channel per student — otherwise two different
    // students in two tabs on the same device falsely trip each other's "Session
    // Already Active" conflict (the lock/channel were previously global).
    const lockKey = nsKey(SK.activeTabLock);
    const channel = new BroadcastChannel(`tc_diagnostic_sync:${storageNamespace || 'anon'}`);
    let deadLockTimeout: ReturnType<typeof setTimeout>;

    const attemptClaim = () => {
      const currentLock = localStorage.getItem(lockKey);
      if (!currentLock || currentLock === tabId) {
        localStorage.setItem(lockKey, tabId);
        channel.postMessage({ type: "CLAIMED", tabId });
        setTabConflict(false);
      } else {
        setTabConflict(true);
        channel.postMessage({ type: "PING", tabId });
        deadLockTimeout = setTimeout(() => {
          localStorage.setItem(lockKey, tabId);
          channel.postMessage({ type: "CLAIMED", tabId });
          setTabConflict(false);
        }, 1000);
      }
    };

    channel.onmessage = (e) => {
      const data = e.data;
      if (data.type === "CLAIMED") {
        if (data.tabId !== tabId) {
          clearTimeout(deadLockTimeout);
          if (localStorage.getItem(lockKey) !== tabId) {
            setTabConflict(true);
          }
        }
      } else if (data.type === "PING") {
        if (localStorage.getItem(lockKey) === tabId) {
          channel.postMessage({ type: "CLAIMED", tabId });
        }
      } else if (data.type === "RELEASED") {
        attemptClaim();
      }
    };

    attemptClaim();

    const handleUnload = () => {
      if (localStorage.getItem(lockKey) === tabId) {
        localStorage.removeItem(lockKey);
        channel.postMessage({ type: "RELEASED", tabId });
      }
    };

    window.addEventListener("beforeunload", handleUnload);

    return () => {
      clearTimeout(deadLockTimeout);
      window.removeEventListener("beforeunload", handleUnload);
      handleUnload();
      channel.close();
    };
  }, []);

  const [phase, setPhase] = useState<Phase>("gate");
  const [gateState, setGateState] = useState<GateState>("idle");
  const [results, setResults] = useState<AllResults>({});
  const [lastSpeakingResult, setLastSpeakingResult] = useState<SkillResult | null>(null);
  const [resumePhase, setResumePhase] = useState<Skill | undefined>();
  const [isCheckingStatus, setIsCheckingStatus] = useState(true);
  const [needsResumeAuth, setNeedsResumeAuth] = useState(false);
  const [interimSkill, setInterimSkill] = useState<Skill | null>(null);
  const [pendingNextPhase, setPendingNextPhase] = useState<Phase | null>(null);

  useEffect(() => {
    let isMounted = true;
    let pollingInterval: ReturnType<typeof setInterval>;

    const checkStatus = async () => {
      const currentSavedPhase = storageLoad<Phase>(SK.phase);
      
      if (currentSavedPhase === "summary" || currentSavedPhase === "speaking_result") {
          clearInterval(pollingInterval);
          return;
      }

      const savedResults = storageLoad<AllResults>(SK.results);
      if (savedResults) setResults(savedResults);

      try {
        const status = await fetchDiagnosticStatus(studentId);
        if (!isMounted) return;

        if (status.overall_complete) {
          clearInterval(pollingInterval);

          if (currentSavedPhase === "gate" || !currentSavedPhase) {
            storageClear(SK.phase, SK.results, SK.listeningAnswers, SK.listeningAudioPlayed, SK.readingAnswers, SK.readingTimeLeft, SK.writingText, SK.speakingResult);
            setGateState("complete");
            window.location.href = "/dashboard";
          }
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
  if (!isResumeVerified()) setNeedsResumeAuth(true);
          if (currentSavedPhase && currentSavedPhase !== "gate") {
            const savedSkill = currentSavedPhase as Skill;
            if (skillOrder.includes(savedSkill) && !statusMap[savedSkill]) {
              setPhase(currentSavedPhase);
            }
          }
        } else if (currentSavedPhase && currentSavedPhase !== "gate") {
          setPhase(currentSavedPhase);
          setGateState("in_progress");
             if (!isResumeVerified()) setNeedsResumeAuth(true); 
        } else {
          setGateState("idle");
        }
      } catch {
        if (currentSavedPhase && currentSavedPhase !== "gate") {
          setPhase(currentSavedPhase);
          setGateState("in_progress");
             if (!isResumeVerified()) setNeedsResumeAuth(true); 
        } else {
          setGateState("idle");
        }
      } finally {
        if (isMounted) setIsCheckingStatus(false);
      }
    };

    if (studentId) {
       checkStatus();
       pollingInterval = setInterval(checkStatus, 10000);
    }

    return () => { 
      isMounted = false; 
      clearInterval(pollingInterval); 
    };
  }, [studentId]);

  useEffect(() => {
    storageSave(SK.phase, phase);
  }, [phase]);

  useEffect(() => {
    storageSave(SK.results, results);
  }, [results]);

 const handleStart = () => {
    // Reaching this click = fresh start, or resume already password-verified.
    // Mark the tab verified so the 10s status poll never re-prompts mid-test.
    markResumeVerified();
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

  const handleGoToDashboard = async () => {
    storageClear(
      SK.phase, SK.results, SK.listeningAnswers, SK.listeningAudioPlayed, SK.readingAnswers, SK.readingTimeLeft, SK.writingText, SK.speakingResult,
      "tc_served_listening", "tc_served_reading", "tc_served_writing", "tc_served_speaking",
    );
    // Force-refresh the cached profile BEFORE navigating. The dashboard route guard
    // reads profile.isDiagnosed from the cache; without this the freshly-diagnosed
    // student still looks un-diagnosed and gets bounced back into onboarding (a loop).
    try { await refreshProfile(); } catch { /* navigate anyway; guard will re-check */ }
    // First-time completion routes through the roadmap before the dashboard — a band
    // score alone doesn't tell a student what to do next. Re-visitable afterward via
    // the sidebar "My Roadmap" link.
    navigate('/student/diagnostic/roadmap', { replace: true });
  };

  if (isCheckingStatus) {
    return (
      <>
        <TopNavBar />
        <div className="min-h-screen bg-brand-bg flex items-center justify-center">
          <div className="flex flex-col items-center gap-4 text-center">
            <div className="w-12 h-12 rounded-full border-[3px] border-brand-bg-alt border-t-brand-teal-600 animate-spin" />
            <p className="font-jetbrains text-brand-text-mute text-[11px] uppercase tracking-[0.16em]">Checking diagnostic status…</p>
          </div>
        </div>
      </>
    );
  }

  if (tabConflict) {
    return (
      <>
        <TopNavBar />
        <div className="min-h-screen bg-brand-bg flex items-center justify-center p-4">
          <div className="bg-white p-8 md:p-10 rounded-2xl border border-brand-line shadow-sm max-w-md text-center animate-fade-in">
            <div className="text-4xl mb-4">⚠️</div>
            <h2 className="font-manrope text-[22px] font-extrabold text-brand-ink mb-2 tracking-[-0.02em]">Session already active</h2>
            <p className="text-brand-text-mute text-[14px] leading-[1.7]">
              You are already taking this diagnostic in another tab. Please close this tab or return to the active one to continue.
            </p>
          </div>
        </div>
      </>
    );
  }
 if (needsResumeAuth) {
    return (
      <>
        <TopNavBar />
        <ResumePasswordModal
          onVerified={() => {
            markResumeVerified();
            setNeedsResumeAuth(false);
          }}
        />
      </>
    );
  }
  return (
    <div className="min-h-screen bg-brand-bg font-plex text-brand-text antialiased">
      <TopNavBar />

      {/* Subtle grid background */}
      <div className="fixed inset-0 pointer-events-none" style={{
        backgroundImage: 'radial-gradient(circle, #D8E0E2 1px, transparent 1px)',
        backgroundSize: '24px 24px',
        opacity: 0.55,
      }} />

      <div className="relative z-10 max-w-2xl mx-auto px-4 pt-24 pb-8 flex flex-col min-h-screen">
        {phase !== "gate" && phase !== "summary" && (
          <div className="mb-6 flex justify-center">
            <ProgressSteps
              currentPhase={phase as Skill}
              results={results}
            />
          </div>
        )}

        <div className="flex-1 bg-white border border-brand-line rounded-2xl shadow-sm p-6 md:p-8">
          {phase === "gate" && (
            <DiagnosticGate
              gateState={gateState}
              resumePhase={resumePhase}
              onStart={handleStart}
            />
          )}

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

          {phase === "speaking" && (
            <SpeakingPhase
              onComplete={(r) => {
                setResults((prev) => ({ ...prev, speaking: r }));
                setLastSpeakingResult(r);
                setPhase("speaking_result");
              }}
            />
          )}

          {phase === "speaking_result" && lastSpeakingResult && (
            <SpeakingResultCard
              result={lastSpeakingResult}
              onContinue={() => setPhase("summary")}
            />
          )}

          {phase === "summary" && (
            <DiagnosticSummaryScreen
              results={results}
              onGoToDashboard={handleGoToDashboard}
              targetBand={profile?.targetBand}
            />
          )}
        </div>

        <p className="text-center font-jetbrains text-brand-text-mute text-[10px] mt-4 uppercase tracking-[0.16em]">
          TestCrack · Diagnostic Engine v1 · All responses are encrypted and secure
        </p>
      </div>

      <style>{`
        @keyframes waveform {
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

const ONBOARDING_STEPS: { skill: Skill; icon: string; time: string }[] = [
  { skill: "listening", icon: "🎧", time: "~8 min" },
  { skill: "reading",   icon: "📖", time: "~5 min" },
  { skill: "writing",   icon: "✍️", time: "~20 min" },
  { skill: "speaking",  icon: "🎤", time: "~2 min" },
];

const ONBOARDING_TIPS = [
  "Find a quiet space and mute notifications — you can't pause once you start.",
  "Check your microphone works — the Speaking section needs a clear recording.",
  "Make sure you have a stable internet connection throughout.",
  "Set aside the full ~35 minutes so you're not rushed mid-section.",
];

function OnboardingScreen({ onComplete }: { onComplete: () => void }) {
  const { profile, refreshProfile } = useAuth();
  const [name, setName] = useState(profile?.name || "");
  const [targetBand, setTargetBand] = useState<string>(profile?.targetBand ? String(profile.targetBand) : "7.0");
  const [loading, setLoading] = useState(false);
  const [tipsOpen, setTipsOpen] = useState(false);

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
    <div className="min-h-screen bg-brand-ink-deep font-plex antialiased flex flex-col lg:flex-row">
      {/* Left — brand / context panel */}
      <div className="relative lg:w-[46%] shrink-0 flex flex-col justify-between gap-8 px-6 py-8 sm:px-10 sm:py-10 lg:px-16 lg:py-14 overflow-hidden">
        <div
          className="absolute inset-0 pointer-events-none opacity-[0.06]"
          style={{
            backgroundImage:
              'linear-gradient(to right, #2EE8A6 1px, transparent 1px), linear-gradient(to bottom, #2EE8A6 1px, transparent 1px)',
            backgroundSize: '56px 56px',
          }}
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -left-24 -top-24 h-[380px] w-[380px] rounded-full bg-brand-teal opacity-20 blur-[140px]"
        />

        <div className="relative z-10 flex items-center gap-2.5">
          <img src={testcrackLogo} alt="TestCrack" className="h-8 w-8 object-contain shrink-0" />
          <span className="font-manrope text-lg font-extrabold text-white tracking-[-0.02em]">TestCrack</span>
        </div>

        <div className="relative z-10 max-w-md">
          <div className="mb-4 flex items-center gap-3">
            <span className="h-px w-6 shrink-0 bg-brand-mint" aria-hidden="true" />
            <span className="font-jetbrains text-[10.5px] uppercase tracking-[0.2em] text-brand-mint">
              One-Time Baseline
            </span>
          </div>
          <h1 className="font-manrope text-[28px] sm:text-[36px] font-extrabold text-white leading-[1.12] tracking-[-0.03em] mb-4">
            Before you start, we find your level.
          </h1>
          <p className="text-brand-on-ink text-[14.5px] leading-[1.75]">
            Four skills, about thirty-five minutes, once. Everything you see after this is built on what you do here.
          </p>
        </div>

        <div className="relative z-10 flex items-center gap-8 sm:gap-10">
          {[
            { value: String(ONBOARDING_STEPS.length), label: "skills" },
            { value: "~35", label: "minutes" },
            { value: "1x", label: "only once" },
          ].map((stat) => (
            <div key={stat.label}>
              <div className="font-manrope text-2xl font-extrabold text-brand-mint tracking-[-0.02em]">{stat.value}</div>
              <div className="font-jetbrains text-[10px] uppercase tracking-[0.14em] text-brand-on-ink">{stat.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Right — form panel */}
      <div className="flex-1 flex items-center justify-center bg-brand-bg px-4 py-10 sm:px-8 sm:py-14">
        <div className="w-full max-w-md animate-fade-in">
          <div className="mb-3 flex items-center gap-3">
            <span className="h-px w-6 shrink-0 bg-brand-teal-600" aria-hidden="true" />
            <span className="font-jetbrains text-[10.5px] uppercase tracking-[0.2em] text-brand-teal-700">
              Getting Started
            </span>
          </div>
          <h2 className="font-manrope text-[26px] font-extrabold mb-2 text-brand-ink leading-[1.15] tracking-[-0.03em]">Let's set your goals 🎯</h2>
          <p className="text-brand-text-mute mb-7 text-[14.5px] leading-[1.7]">Tailor your upcoming diagnostic baseline specifically for you.</p>

          <form onSubmit={handleSave} className="space-y-6">
            <div className="space-y-2">
              <label className="block font-jetbrains text-[10px] text-brand-text-mute uppercase tracking-[0.16em]">Full Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                placeholder="E.g. John Doe"
                className="w-full border border-brand-line rounded-xl p-3.5 text-[14.5px] focus:border-brand-teal-600 outline-none transition-colors duration-150 bg-white placeholder:text-brand-text-mute/60 text-brand-text"
              />
            </div>

            <div className="space-y-2">
              <label className="block font-jetbrains text-[10px] text-brand-text-mute uppercase tracking-[0.16em]">Target IELTS Band</label>
              <div className="grid grid-cols-4 sm:grid-cols-6 gap-1.5">
                {[4.0, 4.5, 5.0, 5.5, 6.0, 6.5, 7.0, 7.5, 8.0, 8.5, 9.0].map(band => {
                  const val = band.toFixed(1);
                  const selected = targetBand === val;
                  return (
                    <button
                      key={band}
                      type="button"
                      onClick={() => setTargetBand(val)}
                      aria-pressed={selected}
                      className={`py-2.5 rounded-xl text-[13.5px] font-semibold transition-colors duration-150 border ${
                        selected
                          ? 'bg-brand-ink text-brand-mint border-brand-ink'
                          : 'bg-white text-brand-text border-brand-line hover:border-brand-teal-400'
                      }`}
                    >
                      {val}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Tips before you start */}
            <div className="border border-brand-line rounded-2xl overflow-hidden">
              <button
                type="button"
                onClick={() => setTipsOpen((o) => !o)}
                className="w-full flex items-center justify-between px-4 py-3 bg-brand-bg text-left"
              >
                <span className="text-[13.5px] font-semibold text-brand-ink">💡 Tips before you start</span>
                <ChevronDown className={`w-4 h-4 text-brand-text-mute transition-transform duration-200 ${tipsOpen ? 'rotate-180' : ''}`} />
              </button>
              {tipsOpen && (
                <ul className="px-4 pb-4 pt-3 space-y-2 bg-white">
                  {ONBOARDING_TIPS.map((tip, i) => (
                    <li key={i} className="text-[13px] text-brand-text-mute leading-[1.7] flex gap-2">
                      <span className="text-brand-teal-600 font-bold">•</span>
                      <span>{tip}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <button
              type="submit"
              className="w-full mt-4 py-4 bg-brand-teal-700 hover:bg-brand-teal-600 text-white font-semibold text-[15.5px] rounded-xl transition-colors duration-150 active:scale-[0.99] disabled:opacity-70 disabled:pointer-events-none"
              disabled={loading}
            >
              {loading ? "Saving Profile..." : "Start Diagnostic →"}
            </button>
          </form>
        </div>
      </div>

      <style>{`
        @keyframes fade-in {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in { animation: fade-in 0.35s ease-out; }
      `}</style>
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