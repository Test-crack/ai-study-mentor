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
  if (score <= 4.5) return "A";
  if (score <= 6.5) return "B";
  return "C";
}

function getLevelConfig(level: Level) {
  const configs = {
    A: {
      label: "Foundation",
      bg: "bg-amber-50",
      border: "border-gray-900",
      text: "text-gray-900",
      dot: "bg-amber-500",
      ring: "ring-gray-900",
    },
    B: {
      label: "Intermediate",
      bg: "bg-indigo-50",
      border: "border-gray-900",
      text: "text-indigo-700",
      dot: "bg-indigo-700",
      ring: "ring-gray-900",
    },
    C: {
      label: "Advanced",
      bg: "bg-emerald-50",
      border: "border-gray-900",
      text: "text-emerald-800",
      dot: "bg-emerald-700",
      ring: "ring-gray-900",
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
// API CALLS  (unchanged)
// ─────────────────────────────────────────────────────────────────────────────

async function fetchDiagnosticQuestionsData(skill: string) {
  const data = await callBackend(`/api/diagnostic/questions/${skill}`, { method: "GET" });
  if (!data?.ok) throw new Error("Fetch failed");
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
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-white border-b-2 border-gray-900 transform-gpu">
      <div className="w-full px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 bg-indigo-700 border-2 border-gray-900 rounded-lg" style={{ boxShadow: '3px 3px 0 #0F0F0F' }}>
              <GraduationCap className="h-5 w-5 text-white" />
            </div>
            <span className="text-xl font-black text-gray-900 uppercase tracking-tight">
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

function SkeletonLoader() {
  return (
    <div className="space-y-4 animate-pulse">
      <div className="h-4 bg-gray-200 rounded w-3/4 border border-gray-300" />
      <div className="h-4 bg-gray-200 rounded w-1/2 border border-gray-300" />
      <div className="h-32 bg-gray-200 rounded-lg border border-gray-300" />
      <div className="h-4 bg-gray-200 rounded w-2/3 border border-gray-300" />
      <div className="h-4 bg-gray-200 rounded w-5/6 border border-gray-300" />
    </div>
  );
}

function ErrorBanner({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="border-2 border-gray-900 bg-red-50 rounded-lg p-5 flex items-start gap-4" style={{ boxShadow: '4px 4px 0 #0F0F0F' }}>
      <span className="text-red-600 text-xl mt-0.5 font-black">⚠</span>
      <div className="flex-1">
        <p className="text-gray-900 font-black text-sm uppercase tracking-wide">Something went wrong</p>
        <p className="text-gray-600 text-xs mt-1">
          Your answers have been saved. Check your connection and try again.
        </p>
      </div>
      <button
        onClick={onRetry}
        className="px-4 py-2 bg-red-100 hover:bg-red-200 border-2 border-gray-900 text-gray-900 text-sm rounded-lg transition-all font-black uppercase tracking-wide"
        style={{ boxShadow: '3px 3px 0 #0F0F0F' }}
      >
        Retry
      </button>
    </div>
  );
}

function LevelBadge({ level, size = "md" }: { level: Level; size?: "sm" | "md" | "lg" }) {
  const cfg = getLevelConfig(level);
  const sizes = {
    sm: "px-2 py-0.5 text-xs",
    md: "px-3 py-1 text-sm",
    lg: "px-5 py-2 text-base",
  };
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded border-2 font-black tracking-wider uppercase ${cfg.bg} ${cfg.border} ${cfg.text} ${sizes[size]}`}
      style={{ boxShadow: '3px 3px 0 #0F0F0F' }}
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
    <div className="flex items-center gap-1">
      {skills.map((skill, idx) => {
        const isDone = !!results[skill];
        const isCurrent = currentPhase === skill;
        return (
          <React.Fragment key={skill}>
            <div
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded border-2 text-xs font-black uppercase tracking-wide select-none cursor-not-allowed transition-all ${
                isDone
                  ? "bg-indigo-700 text-white border-gray-900"
                  : isCurrent
                  ? "bg-white text-gray-900 border-gray-900"
                  : "bg-white text-gray-400 border-gray-300"
              }`}
              style={isDone || isCurrent ? { boxShadow: '2px 2px 0 #0F0F0F' } : {}}
            >
              <span className="hidden sm:inline font-mono text-xs">{stepNums[skill]}</span>
              <span className="hidden sm:inline">{SKILL_ICONS[skill]}</span>
              <span className="hidden sm:inline">{SKILL_LABELS[skill]}</span>
              <span className="sm:hidden">{SKILL_ICONS[skill]}</span>
              {isDone && <span className="font-black">✓</span>}
            </div>
            {idx < skills.length - 1 && (
              <div
                className={`h-0.5 w-4 transition-colors ${
                  isDone ? "bg-gray-900" : "bg-gray-300"
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
    return <p className="text-gray-700 text-sm leading-relaxed">{feedback}</p>;
  }
  
  if (feedback?.improvements && typeof feedback.improvements === 'string') {
     return <p className="text-gray-700 text-sm leading-relaxed">Improvements: {feedback.improvements}</p>;
  }

  return (
    <div className="space-y-3">
      {feedback?.priority_action && (
        <div className="bg-red-50 border-2 border-red-200 p-3 rounded">
          <p className="text-red-700 font-bold text-[10px] uppercase tracking-wider">Priority Action</p>
          <p className="text-red-900 text-sm mt-1 font-medium">{feedback.priority_action}</p>
        </div>
      )}
      
      {['task_response', 'coherence', 'fluency', 'pronunciation', 'vocabulary', 'grammar'].map((key) => {
        const sect = feedback?.[key];
        if (!sect) return null;
        return (
          <div key={key} className="bg-white border-2 border-indigo-100 rounded p-3">
             <p className="text-indigo-700 font-bold text-[10px] uppercase mb-1 tracking-wider">{key.replace('_', ' ')}</p>
             <p className="text-gray-800 text-sm italic mb-2">"{sect.score_rationale}"</p>
             
             {sect.observed_issues && sect.observed_issues.length > 0 && (
               <ul className="list-disc pl-4 text-xs text-amber-700 space-y-1 mb-2">
                 {sect.observed_issues.map((i: string, idx: number) => <li key={idx}>{i}</li>)}
               </ul>
             )}
             
             {sect.error_examples && sect.error_examples.length > 0 && (
               <ul className="list-disc pl-4 text-xs text-red-600 space-y-1 mb-2">
                 {sect.error_examples.map((i: string, idx: number) => <li key={idx}>{i}</li>)}
               </ul>
             )}

             {sect.strengths && sect.strengths.length > 0 && (
               <ul className="list-disc pl-4 text-xs text-emerald-600 space-y-1 mb-2">
                 {sect.strengths.map((i: string, idx: number) => <li key={idx}>{i}</li>)}
               </ul>
             )}

             {sect.next_step && (
               <p className="text-indigo-900 text-xs mt-2 border-t border-indigo-50 pt-2"><span className="font-bold">Next Step:</span> {sect.next_step}</p>
             )}
          </div>
        )
      })}
      
      {feedback?.filler_words_detected && feedback.filler_words_detected.length > 0 && (
        <div className="bg-orange-50 border-2 border-orange-200 p-3 rounded">
          <p className="text-orange-700 font-bold text-[10px] uppercase tracking-wider mb-2">Filler Words Detected</p>
          <div className="flex flex-wrap gap-2">
            {feedback.filler_words_detected.map((filler: string, idx: number) => (
              <span key={idx} className="bg-orange-200 text-orange-900 text-[10px] font-bold px-2 py-1 rounded">
                {filler}
              </span>
            ))}
          </div>
        </div>
      )}
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
    <div className="flex flex-col items-center text-center gap-6 py-8 animate-fade-in">
      <div className="w-16 h-16 bg-indigo-700 border-2 border-gray-900 rounded-xl flex items-center justify-center text-3xl" style={{ boxShadow: '4px 4px 0 #0F0F0F' }}>
        {SKILL_ICONS[skill]}
      </div>

      <div>
        <p className="text-gray-500 text-xs uppercase tracking-widest mb-2 font-black">
          {SKILL_LABELS[skill]} · Section Complete
        </p>
        <div className="text-8xl font-black text-gray-900 tabular-nums leading-none">
          {result.band_score.toFixed(1)}
        </div>
        <p className="text-gray-500 text-sm mt-2 font-black uppercase tracking-wide">Band Score</p>
      </div>

      <LevelBadge level={level} size="lg" />

      <p className="text-gray-600 text-sm max-w-xs leading-relaxed">
        {encouragements[level]}
      </p>

      {/* Sub-Scores Stats Board (Listening & Reading) */}
      {result.sub_scores && result.sub_scores.total_questions !== undefined && (
        <div className="grid grid-cols-2 gap-4 w-full max-w-sm mt-2">
          <div className="bg-white border-2 border-gray-900 rounded-lg p-4 flex flex-col items-center justify-center" style={{ boxShadow: '3px 3px 0 #0F0F0F' }}>
            <p className="text-gray-500 text-[10px] uppercase font-black tracking-widest mb-1">Accuracy</p>
            <p className="text-gray-900 text-2xl font-black">{result.sub_scores.accuracy_percentage}%</p>
          </div>
          <div className="bg-white border-2 border-gray-900 rounded-lg p-4 flex flex-col items-center justify-center" style={{ boxShadow: '3px 3px 0 #0F0F0F' }}>
            <p className="text-gray-500 text-[10px] uppercase font-black tracking-widest mb-1">Correct</p>
            <p className="text-gray-900 text-2xl font-black">{result.sub_scores.correct_answers} <span className="text-sm font-bold text-gray-400">/ {result.sub_scores.total_questions}</span></p>
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
            <div key={key} className="bg-white border-2 border-gray-900 rounded-lg p-3 flex flex-col items-center justify-center" style={{ boxShadow: '3px 3px 0 #0F0F0F' }}>
              <p className="text-gray-500 text-[9px] uppercase font-black tracking-widest mb-1">{label}</p>
              <p className="text-gray-900 text-xl font-black">{result.sub_scores[key]}</p>
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
            <div key={key} className="bg-white border-2 border-gray-900 rounded-lg p-3 flex flex-col items-center justify-center" style={{ boxShadow: '3px 3px 0 #0F0F0F' }}>
              <p className="text-gray-500 text-[9px] uppercase font-black tracking-widest mb-1">{label}</p>
              <p className="text-gray-900 text-xl font-black">{result.sub_scores[key]}</p>
            </div>
          ))}
        </div>
      )}

      {result.feedback && (
        <div className="bg-indigo-50 border-2 border-gray-900 rounded-lg p-4 w-full max-w-lg text-left" style={{ boxShadow: '3px 3px 0 #0F0F0F' }}>
          <p className="text-indigo-700 text-xs uppercase tracking-wider mb-2 font-black">AI Feedback & Insights</p>
          <DetailedFeedbackDisplay feedback={result.feedback} />
        </div>
      )}

      <button
        onClick={onContinue}
        className="mt-2 px-8 py-3.5 bg-indigo-700 hover:bg-indigo-600 text-white font-black uppercase tracking-wide rounded-lg border-2 border-gray-900 transition-all neo-btn"
        style={{ boxShadow: '4px 4px 0 #0F0F0F' }}
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
    <div className="flex flex-col items-center text-center gap-8 max-w-xl mx-auto py-8">
      <div className="space-y-3">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded border-2 border-gray-900 bg-indigo-700 text-white text-xs font-black tracking-widest uppercase" style={{ boxShadow: '3px 3px 0 #0F0F0F' }}>
          <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
          IELTS Baseline Diagnostic
        </div>
        <h1 className="text-4xl font-black text-gray-900 tracking-tight uppercase">
          {gateState === "in_progress" ? "Resume Your" : "Begin Your"}{" "}
          <span className="text-indigo-700">
            Diagnostic
          </span>
        </h1>
        <p className="text-gray-600 leading-relaxed">
          {gateState === "in_progress"
            ? `You left off at the ${SKILL_LABELS[resumePhase!]} section. Pick up exactly where you stopped.`
            : "Complete this 10-minute assessment to unlock your personalised learning path and band score baseline."}
        </p>
      </div>

      <div className="w-full space-y-3">
        {steps.map((step) => (
          <div
            key={step.label}
            className="bg-white border-2 border-gray-900 rounded-lg p-4 flex items-center gap-4 text-left hover:bg-indigo-50 transition-colors"
            style={{ boxShadow: '4px 4px 0 #0F0F0F' }}
          >
            <span className="text-2xl">{step.icon}</span>
            <div className="flex-1">
              <p className="text-gray-900 font-black text-sm uppercase tracking-wide">{step.label}</p>
              <p className="text-gray-500 text-xs mt-0.5">{step.desc}</p>
            </div>
            <span className="text-gray-300 font-black font-mono text-lg">{step.num}</span>
          </div>
        ))}
      </div>

      <div className="flex items-center gap-6 text-gray-500 text-xs font-bold uppercase tracking-wide">
        <span className="flex items-center gap-1.5">⏱ ~10 minutes</span>
        <span className="flex items-center gap-1.5">🔒 No skip</span>
        <span className="flex items-center gap-1.5">💡 Saved</span>
      </div>

      <button
        onClick={onStart}
        className="w-full py-4 bg-indigo-700 hover:bg-indigo-600 text-white font-black text-base uppercase tracking-wide rounded-lg border-2 border-gray-900 transition-all neo-btn"
        style={{ boxShadow: '5px 5px 0 #0F0F0F' }}
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
  const studentId = profile?.id || profile?.student_id || "unknown-student";

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
          <div className="w-10 h-10 bg-indigo-700 border-2 border-gray-900 rounded-lg flex items-center justify-center text-xl" style={{ boxShadow: '3px 3px 0 #0F0F0F' }}>🎧</div>
          <div>
            <p className="text-gray-900 font-black uppercase tracking-wide">Listening Section</p>
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
          <div className="w-16 h-16 rounded-full border-4 border-gray-200 border-t-indigo-700 animate-spin" />
          <span className="absolute inset-0 flex items-center justify-center text-2xl">🎧</span>
        </div>
        <div>
          <p className="text-gray-900 font-black uppercase tracking-wide">Scoring your answers…</p>
          <p className="text-gray-500 text-sm mt-1">This takes just a moment.</p>
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
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-indigo-700 border-2 border-gray-900 rounded-lg flex items-center justify-center text-xl" style={{ boxShadow: '3px 3px 0 #0F0F0F' }}>🎧</div>
          <div>
            <p className="text-gray-900 font-black uppercase tracking-wide">Listening Section</p>
            <p className="text-gray-500 text-sm">{data?.questions?.length ?? 0} questions · Answer all to submit</p>
          </div>
        </div>
        <div className="bg-white border-2 border-gray-900 rounded-lg px-3 py-1.5 text-gray-900 text-sm font-black tabular-nums" style={{ boxShadow: '2px 2px 0 #0F0F0F' }}>
          {Object.keys(answers).length}/{data?.questions?.length ?? 0}
        </div>
      </div>

      <div className="bg-indigo-50 border-2 border-gray-900 rounded-lg p-4" style={{ boxShadow: '4px 4px 0 #0F0F0F' }}>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-indigo-700 border-2 border-gray-900 flex items-center justify-center text-white text-lg shrink-0 font-black" style={{ boxShadow: '2px 2px 0 #0F0F0F' }}>
            ▶
          </div>
          <div className="flex-1">
            <p className="text-gray-900 text-sm font-black uppercase tracking-wide">Diagnostic Audio Clip</p>
            <p className="text-gray-500 text-xs mt-0.5">
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
            className={`px-4 py-2 rounded-lg text-sm font-black uppercase tracking-wide border-2 transition-all ${
              audioButtonDisabled
                ? "bg-gray-100 text-gray-400 border-gray-300 cursor-not-allowed"
                : "bg-indigo-700 hover:bg-indigo-600 text-white border-gray-900 neo-btn"
            }`}
            style={!audioButtonDisabled ? { boxShadow: '3px 3px 0 #0F0F0F' } : {}}
          >
            {audioButtonLabel}
          </button>
        </div>
      </div>

      <div className="space-y-4">
        {data?.questions?.map((q: any, qi: number) => (
          <div
            key={q.id}
            className="bg-white border-2 border-gray-900 rounded-lg p-5"
            style={{ boxShadow: '4px 4px 0 #0F0F0F' }}
          >
            <p className="text-gray-700 text-sm font-bold mb-3">
              <span className="text-indigo-700 font-black mr-2 uppercase">Q{qi + 1}.</span>
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
                      className={`px-4 py-2 rounded-lg border-2 cursor-pointer text-xs font-black uppercase tracking-wide transition-all ${
                        selected
                          ? 'border-gray-900 bg-gray-900 text-white shadow-[2px_2px_0_#0F0F0F]'
                          : 'border-gray-300 text-gray-600 hover:border-gray-600 hover:text-gray-900'
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
                    className={`flex items-center gap-3 p-3 rounded-lg border-2 cursor-pointer transition-all ${
                      answers[q.id] === letter
                        ? 'border-gray-900 bg-gray-900 text-white'
                        : 'border-gray-200 text-gray-600 hover:border-gray-400 hover:text-gray-900'
                    }`}
                  >
                    <div
                      className={`w-4 h-4 rounded border-2 flex items-center justify-center shrink-0 transition-all ${
                        answers[q.id] === letter ? 'border-indigo-400 bg-indigo-500' : 'border-gray-400'
                      }`}
                    >
                      {answers[q.id] === letter && <div className="w-1.5 h-1.5 rounded-sm bg-white" />}
                    </div>
                    <span className={`font-black text-sm w-5 shrink-0 ${answers[q.id] === letter ? 'text-indigo-300' : 'text-indigo-700'}`}>
                      {letter}
                    </span>
                    <span className="text-sm">{text}</span>
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
        className={`w-full py-3.5 rounded-lg font-black text-sm uppercase tracking-wide border-2 transition-all ${
          allAnswered
            ? "bg-indigo-700 hover:bg-indigo-600 text-white border-gray-900 neo-btn"
            : "bg-gray-100 text-gray-400 cursor-not-allowed border-gray-300"
        }`}
        style={allAnswered ? { boxShadow: '4px 4px 0 #0F0F0F' } : {}}
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
          <div className="w-10 h-10 bg-indigo-700 border-2 border-gray-900 rounded-lg flex items-center justify-center text-xl" style={{ boxShadow: '3px 3px 0 #0F0F0F' }}>📖</div>
          <p className="text-gray-900 font-black uppercase tracking-wide">Loading Reading Section…</p>
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
          <div className="w-16 h-16 rounded-full border-4 border-gray-200 border-t-indigo-700 animate-spin" />
          <span className="absolute inset-0 flex items-center justify-center text-2xl">📖</span>
        </div>
        <p className="text-gray-900 font-black uppercase tracking-wide">Scoring your answers…</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-indigo-700 border-2 border-gray-900 rounded-lg flex items-center justify-center text-xl" style={{ boxShadow: '3px 3px 0 #0F0F0F' }}>📖</div>
          <div>
            <p className="text-gray-900 font-black uppercase tracking-wide">Reading Section</p>
            <p className="text-gray-500 text-sm">Read the passage, then answer {data?.questions?.length ?? 0} questions</p>
          </div>
        </div>
        <div
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border-2 text-sm font-mono font-black transition-colors ${
            timerWarning
              ? "bg-amber-100 border-gray-900 text-gray-900"
              : timeLeft === 0
              ? "bg-red-100 border-gray-900 text-red-700"
              : "bg-white border-gray-900 text-gray-900"
          }`}
          style={{ boxShadow: '2px 2px 0 #0F0F0F' }}
        >
          <span className="text-xs">{timerWarning ? "⚠" : "⏱"}</span>
          {formatTime(timeLeft)}
          {timeLeft === 0 && <span className="text-xs font-bold ml-1">Time's up</span>}
        </div>
      </div>

      <div className="bg-gray-50 border-2 border-gray-900 rounded-lg p-5" style={{ boxShadow: '4px 4px 0 #0F0F0F' }}>
        <p className="text-gray-500 text-xs uppercase tracking-widest mb-3 font-black">
          Reading Passage
        </p>
        <p className="text-gray-700 text-sm leading-7 whitespace-pre-line">
          {data?.passage}
        </p>
      </div>

      <div className="space-y-4">
        <p className="text-gray-500 text-xs uppercase tracking-widest font-black">
          Questions — True / False / Not Given
        </p>
        {data?.questions?.map((q: any, qi: number) => (
          <div
            key={q.id}
            className="bg-white border-2 border-gray-900 rounded-lg p-5"
            style={{ boxShadow: '4px 4px 0 #0F0F0F' }}
          >
            <p className="text-gray-700 text-sm mb-3">
              <span className="text-indigo-700 font-black mr-2">{qi + 1}.</span>
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
                      className={`px-4 py-2 rounded-lg border-2 cursor-pointer text-sm font-black uppercase tracking-wide transition-all ${
                        isSelected
                          ? 'border-gray-900 bg-gray-900 text-white'
                          : 'border-gray-300 text-gray-500 hover:border-gray-600 hover:text-gray-800'
                      }`}
                      style={isSelected ? { boxShadow: '2px 2px 0 #0F0F0F' } : {}}
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
                      className={`px-4 py-2 rounded-lg border-2 cursor-pointer text-sm font-black uppercase tracking-wide transition-all ${
                        isSelected
                          ? 'border-gray-900 bg-gray-900 text-white'
                          : 'border-gray-300 text-gray-500 hover:border-gray-600 hover:text-gray-800'
                      }`}
                      style={isSelected ? { boxShadow: '2px 2px 0 #0F0F0F' } : {}}
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
        className={`w-full py-3.5 rounded-lg font-black text-sm uppercase tracking-wide border-2 transition-all ${
          allAnswered
            ? "bg-indigo-700 hover:bg-indigo-600 text-white border-gray-900 neo-btn"
            : "bg-gray-100 text-gray-400 cursor-not-allowed border-gray-300"
        }`}
        style={allAnswered ? { boxShadow: '4px 4px 0 #0F0F0F' } : {}}
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
  const studentId = profile?.id || profile?.student_id || "unknown-student";

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
  const MIN_WORDS = (typeof raw === 'number' && Number.isFinite(raw) && raw > 0) ? raw : 250;

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

  // Copy/paste/drag blocked in production only — leave open in dev for easier testing
  const IS_PROD = !import.meta.env.DEV;
  const handlePaste = (e: React.ClipboardEvent<HTMLTextAreaElement>) => { if (IS_PROD) e.preventDefault(); };
  const handleCopy  = (e: React.ClipboardEvent<HTMLTextAreaElement>) => { if (IS_PROD) e.preventDefault(); };
  const handleCut   = (e: React.ClipboardEvent<HTMLTextAreaElement>) => { if (IS_PROD) e.preventDefault(); };
  const handleDrop  = (e: React.DragEvent<HTMLTextAreaElement>)      => { if (IS_PROD) e.preventDefault(); };

  if (sectionState === "loading") {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 bg-indigo-700 border-2 border-gray-900 rounded-lg flex items-center justify-center text-xl" style={{ boxShadow: '3px 3px 0 #0F0F0F' }}>✍️</div>
          <p className="text-gray-900 font-black uppercase tracking-wide">Loading Writing Task…</p>
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
          <div className="w-16 h-16 rounded-full border-4 border-gray-200 border-t-indigo-700 animate-spin" />
          <span className="absolute inset-0 flex items-center justify-center text-2xl">✍️</span>
        </div>
        <div>
          <p className="text-gray-900 font-black uppercase tracking-wide">AI Examiner Reviewing…</p>
          <p className="text-gray-500 text-sm mt-1">This may take 5–10 seconds. Please wait.</p>
        </div>
        <div className="flex gap-1 mt-2">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="w-2 h-2 rounded-sm bg-indigo-700 animate-bounce"
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
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-indigo-700 border-2 border-gray-900 rounded-lg flex items-center justify-center text-xl" style={{ boxShadow: '3px 3px 0 #0F0F0F' }}>✍️</div>
          <div>
            <p className="text-gray-900 font-black uppercase tracking-wide">Writing Section</p>
            <p className="text-gray-500 text-sm">Write your response in at least {MIN_WORDS} words</p>
          </div>
        </div>
        {/* Word count badge moved here from inside the textarea div */}
        <div
          className={`px-3 py-1.5 rounded border-2 text-xs font-black font-mono transition-colors ${
            wordCount >= MIN_WORDS
              ? "bg-indigo-700 text-white border-gray-900"
              : "bg-white text-gray-600 border-gray-300"
          }`}
          style={wordCount >= MIN_WORDS ? { boxShadow: '2px 2px 0 #0F0F0F' } : {}}
        >
          {wordCount} / {MIN_WORDS}
        </div>
      </div>

      {data?.image_url && (
        <div className="rounded-lg overflow-hidden border-2 border-gray-900 mb-4" style={{ boxShadow: '4px 4px 0 #0F0F0F' }}>
          <img
            src={data.image_url}
            alt="Writing Task Visualization"
            className="w-full object-cover"
          />
        </div>
      )}

      <div className="bg-indigo-50 border-2 border-gray-900 rounded-lg p-4" style={{ boxShadow: '3px 3px 0 #0F0F0F' }}>
        <p className="text-gray-700 text-sm leading-relaxed">{data?.topic}</p>
      </div>

      {/* ── CHANGE 2: textarea wrapper no longer needs "relative" for the word count badge ── */}
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
        className="w-full bg-white border-2 border-gray-900 rounded-lg p-4 text-gray-800 text-sm leading-7 resize-none focus:outline-none focus:border-indigo-700 focus:ring-2 focus:ring-indigo-100 placeholder-gray-300 transition-colors font-medium"
        style={{ boxShadow: '4px 4px 0 #0F0F0F' }}
      />

      <div className="space-y-1.5">
        <div className="h-2 bg-gray-100 rounded border border-gray-300 overflow-hidden">
          <div
            className={`h-full rounded transition-all duration-300 ${
              wordCount >= MIN_WORDS ? "bg-indigo-700" : "bg-indigo-400"
            }`}
            style={{ width: `${Math.min((wordCount / MIN_WORDS) * 100, 100)}%` }}
          />
        </div>
        <p className="text-gray-500 text-xs font-bold">
          {wordCount < MIN_WORDS
            ? `${MIN_WORDS - wordCount} more words needed to enable submission`
            : "Minimum word count reached ✓"}
        </p>
      </div>

      <p className="text-gray-400 text-xs flex items-center gap-1.5 font-bold uppercase tracking-wide">
        <span>🔒</span> Copy-paste disabled — all responses must be typed.
      </p>

      {error && <ErrorBanner onRetry={handleSubmit} />}

      <button
        onClick={handleSubmit}
        disabled={wordCount < MIN_WORDS || sectionState === "scoring"}
        className={`w-full py-3.5 rounded-lg font-black text-sm uppercase tracking-wide border-2 transition-all ${
          wordCount >= MIN_WORDS
            ? "bg-indigo-700 hover:bg-indigo-600 text-white border-gray-900 neo-btn"
            : "bg-gray-100 text-gray-400 cursor-not-allowed border-gray-300"
        }`}
        style={wordCount >= MIN_WORDS ? { boxShadow: '4px 4px 0 #0F0F0F' } : {}}
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
    if (!audioBlob) return;
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

  const progress = Math.min((elapsed / MAX_DURATION) * 100, 100);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-indigo-700 border-2 border-gray-900 rounded-lg flex items-center justify-center text-xl" style={{ boxShadow: '3px 3px 0 #0F0F0F' }}>🎤</div>
        <div>
          <p className="text-gray-900 font-black uppercase tracking-wide">Speaking Section</p>
          <p className="text-gray-500 text-sm">Up to 90 seconds · Speak clearly and naturally</p>
        </div>
      </div>

      <div className="bg-gray-50 border-2 border-gray-900 rounded-lg p-5" style={{ boxShadow: '4px 4px 0 #0F0F0F' }}>
        <p className="text-gray-500 text-xs uppercase tracking-widest mb-2 font-black">
          Your Speaking Prompt
        </p>
        <div className="text-gray-700 text-sm leading-7 space-y-2">
          {data?.prompts?.map((prompt: string, i: number) => (
            <p key={i}><span className="font-black text-indigo-700 mr-2">{i+1}.</span>{prompt}</p>
          ))}
        </div>
      </div>

      {recordState === "idle" && (
        <div className="bg-indigo-50 border-2 border-gray-900 rounded-lg p-4" style={{ boxShadow: '3px 3px 0 #0F0F0F' }}>
          <ul className="text-gray-700 text-sm space-y-1.5">
            <li className="flex gap-2"><span className="text-indigo-700 font-black">→</span>Read the prompt carefully before recording</li>
            <li className="flex gap-2"><span className="text-indigo-700 font-black">→</span>Tap the button below to start — you have 90 seconds</li>
            <li className="flex gap-2"><span className="text-indigo-700 font-black">→</span>Speak naturally — your response will be transcribed and scored</li>
          </ul>
        </div>
      )}

      <div className="flex flex-col items-center gap-5 py-4">
        {recordState === "recording" && (
          <div className="flex items-center gap-1 h-12">
            {animBars.map((h, i) => (
              <div
                key={i}
                className="w-1.5 bg-red-500 rounded-sm"
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
            <div className="flex justify-between text-xs text-gray-600 font-black font-mono">
              <span>{formatTime(elapsed)}</span>
              <span className={elapsed >= MAX_DURATION - 10 ? "text-amber-600" : ""}>
                {formatTime(MAX_DURATION - elapsed)} remaining
              </span>
            </div>
            <div className="h-2 bg-gray-100 rounded border border-gray-300 overflow-hidden">
              <div
                className={`h-full rounded transition-all duration-1000 ${
                  progress > 80 ? "bg-amber-500" : "bg-red-500"
                }`}
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        )}

        {recordState !== "uploading" && recordState !== "processing" && recordState !== "done" && (
          <button
            onClick={
              recordState === "idle"
                ? startRecording
                : recordState === "recording"
                ? stopRecording
                : handleSubmit
            }
            className={`w-20 h-20 rounded-xl flex items-center justify-center text-2xl font-black border-2 transition-all ${
              recordState === "recording"
                ? "bg-red-500 hover:bg-red-600 text-white border-gray-900 animate-pulse"
                : recordState === "recorded"
                ? "bg-gray-900 hover:bg-gray-800 text-white border-gray-900 neo-btn"
                : "bg-indigo-700 hover:bg-indigo-600 text-white border-gray-900 neo-btn"
            }`}
            style={recordState !== "recording" ? { boxShadow: '4px 4px 0 #0F0F0F' } : { boxShadow: '4px 4px 0 #991b1b' }}
          >
            {recordState === "idle" && "●"}
            {recordState === "recording" && "■"}
            {recordState === "recorded" && "▲"}
          </button>
        )}

        <p className="text-gray-600 text-sm text-center font-bold uppercase tracking-wide">
          {recordState === "idle" && "Tap to start recording"}
          {recordState === "recording" && "Recording… tap to stop"}
          {recordState === "recorded" && `Recorded (${formatTime(elapsed)}) — tap ▲ to submit`}
        </p>

        {recordState === "recorded" && (
          <button
            onClick={handleSubmit}
            className="px-8 py-3 bg-indigo-700 hover:bg-indigo-600 text-white font-black uppercase tracking-wide rounded-lg border-2 border-gray-900 transition-all neo-btn"
            style={{ boxShadow: '4px 4px 0 #0F0F0F' }}
          >
            Submit Recording →
          </button>
        )}
      </div>

      {(recordState === "uploading" || recordState === "processing") && (
        <div className="flex flex-col items-center gap-4 py-8 text-center">
          <div className="relative">
            <div className="w-16 h-16 rounded-full border-4 border-gray-200 border-t-indigo-700 animate-spin" />
            <span className="absolute inset-0 flex items-center justify-center text-2xl">🎤</span>
          </div>
          <div>
            <p className="text-gray-900 font-black uppercase tracking-wide">
              {recordState === "uploading" ? "Uploading Recording…" : "AI Scoring in Progress…"}
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
        <div className="border-2 border-gray-900 bg-red-50 rounded-lg p-4" style={{ boxShadow: '3px 3px 0 #0F0F0F' }}>
          <p className="text-gray-900 font-black text-sm">{error}</p>
        </div>
      )}

      {recordState === "idle" && (
        <p className="text-gray-400 text-xs text-center font-bold uppercase tracking-wide">
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

  const level = getBandLevel(band_score);

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="text-center space-y-3">
        <div className="w-16 h-16 bg-indigo-700 border-2 border-gray-900 rounded-xl flex items-center justify-center text-3xl mx-auto" style={{ boxShadow: '4px 4px 0 #0F0F0F' }}>🎤</div>
        <div className="text-7xl font-black text-gray-900 tabular-nums">
          {band_score.toFixed(1)}
        </div>
        <LevelBadge level={level} size="lg" />
      </div>

      {subScoreEntries.length > 0 && (
        <div className="bg-white border-2 border-gray-900 rounded-lg overflow-hidden" style={{ boxShadow: '4px 4px 0 #0F0F0F' }}>
          <p className="px-5 py-3 text-gray-500 text-xs uppercase tracking-widest border-b-2 border-gray-900 font-black">
            Criterion Breakdown
          </p>
          <div className="divide-y-2 divide-gray-100">
            {subScoreEntries.map(([key, val]) => {
              const isWeakest = key === minSub[0];
              const isStrongest = key === maxSub[0];
              return (
                <div
                  key={key}
                  className={`flex items-center justify-between px-5 py-3 ${
                    isWeakest ? "bg-amber-50" : isStrongest ? "bg-indigo-50" : "bg-white"
                  }`}
                >
                  <span className="text-gray-700 text-sm font-bold">
                    {subScoreLabels[key] ?? key}
                    {isWeakest && (
                      <span className="ml-2 text-amber-700 text-xs font-black uppercase tracking-wide border border-amber-300 bg-amber-100 px-1.5 py-0.5 rounded">needs work</span>
                    )}
                    {isStrongest && (
                      <span className="ml-2 text-indigo-700 text-xs font-black uppercase tracking-wide border border-indigo-300 bg-indigo-100 px-1.5 py-0.5 rounded">strongest</span>
                    )}
                  </span>
                  <span
                    className={`font-black tabular-nums text-lg ${
                      isWeakest ? "text-amber-600" : isStrongest ? "text-indigo-700" : "text-gray-900"
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

      {(result.feedback ?? result.sub_scores?.feedback) && (
        <div className="bg-white border-2 border-gray-900 rounded-lg p-6" style={{ boxShadow: '4px 4px 0 #0F0F0F' }}>
          <p className="text-gray-900 font-black uppercase tracking-wide mb-4 text-center">AI Detailed Feedback</p>
          <DetailedFeedbackDisplay feedback={result.feedback ?? result.sub_scores?.feedback} />
        </div>
      )}

      <button
        onClick={onContinue}
        className="w-full py-3.5 bg-indigo-700 hover:bg-indigo-600 text-white font-black uppercase tracking-wide rounded-lg border-2 border-gray-900 transition-all neo-btn"
        style={{ boxShadow: '4px 4px 0 #0F0F0F' }}
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

  const readinessMessages: Record<Level, string> = {
    A: "You're at the foundation stage. Our personalised plan will fast-track you toward your target band.",
    B: "You have a solid base to build on. Focused practice will push you into the upper bands.",
    C: "You're performing at an advanced level. Precision refinement is all that stands between you and your target.",
  };

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="text-center space-y-3">
        <div className="w-16 h-16 bg-indigo-700 border-2 border-gray-900 rounded-xl flex items-center justify-center text-3xl mx-auto" style={{ boxShadow: '4px 4px 0 #0F0F0F' }}>🎓</div>
        <h2 className="text-3xl font-black text-gray-900 uppercase tracking-tight">Diagnostic Complete</h2>
        <p className="text-gray-500 text-sm max-w-sm mx-auto leading-relaxed">
          Here's your IELTS baseline. Your personalised learning path has been generated.
        </p>
      </div>

      <div
        className="border-2 border-gray-900 bg-indigo-700 rounded-xl p-6 text-center space-y-2"
        style={{ boxShadow: '6px 6px 0 #0F0F0F' }}
      >
        <p className="text-indigo-200 text-xs uppercase tracking-widest font-black">Overall Band Score</p>
        <div className="text-6xl font-black tabular-nums text-white">
          {avgScore.toFixed(1)}
        </div>
        <div className="flex justify-center">
          <span className="inline-flex items-center gap-1.5 rounded border-2 border-white font-black tracking-wider uppercase px-5 py-2 text-base bg-white text-indigo-700">
            <span className="w-2 h-2 rounded-full bg-indigo-700" />
            Level {overallLevel} · {getLevelConfig(overallLevel).label}
          </span>
        </div>
        <p className="text-indigo-200 text-sm mt-3 max-w-xs mx-auto leading-relaxed">
          {readinessMessages[overallLevel]}
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {skills.map((skill) => {
          const result = results[skill];
          if (!result) return null;
          const level = getBandLevel(result.band_score);
          const cfg = getLevelConfig(level);
          return (
            <div
              key={skill}
              className={`border-2 border-gray-900 rounded-xl p-4 text-center ${cfg.bg}`}
              style={{ boxShadow: '4px 4px 0 #0F0F0F' }}
            >
              <span className="text-2xl">{SKILL_ICONS[skill]}</span>
              <p className="text-gray-500 text-xs mt-2 uppercase tracking-widest font-black">
                {SKILL_LABELS[skill]}
              </p>
              <div className="text-3xl font-black mt-1 tabular-nums text-gray-900">
                {result.band_score.toFixed(1)}
              </div>
              <LevelBadge level={level} size="sm" />
            </div>
          );
        })}
      </div>

      <Link
        to="/student/dashboard"
        onClick={onGoToDashboard}
        className="inline-block text-center w-full py-4 bg-gray-900 hover:bg-gray-800 text-white font-black text-base uppercase tracking-wide rounded-lg border-2 border-gray-900 transition-all neo-btn"
        style={{ boxShadow: '5px 5px 0 #4338CA' }}
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
  const { profile } = useAuth();
  const studentId = profile?.id || profile?.student_id || "unknown-student";

  const [tabConflict, setTabConflict] = useState(false);
  const tabIdRef = useRef(Math.random().toString(36).substring(2, 15));

  useEffect(() => {
    const tabId = tabIdRef.current;
    const channel = new BroadcastChannel("tc_diagnostic_sync");
    let deadLockTimeout: ReturnType<typeof setTimeout>;

    const attemptClaim = () => {
      const currentLock = localStorage.getItem(SK.activeTabLock);
      if (!currentLock || currentLock === tabId) {
        localStorage.setItem(SK.activeTabLock, tabId);
        channel.postMessage({ type: "CLAIMED", tabId });
        setTabConflict(false);
      } else {
        setTabConflict(true);
        channel.postMessage({ type: "PING", tabId });
        deadLockTimeout = setTimeout(() => {
          localStorage.setItem(SK.activeTabLock, tabId);
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
          if (localStorage.getItem(SK.activeTabLock) !== tabId) {
            setTabConflict(true);
          }
        }
      } else if (data.type === "PING") {
        if (localStorage.getItem(SK.activeTabLock) === tabId) {
          channel.postMessage({ type: "CLAIMED", tabId });
        }
      } else if (data.type === "RELEASED") {
        attemptClaim();
      }
    };

    attemptClaim();

    const handleUnload = () => {
      if (localStorage.getItem(SK.activeTabLock) === tabId) {
        localStorage.removeItem(SK.activeTabLock);
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

          if (currentSavedPhase && currentSavedPhase !== "gate" && currentSavedPhase !== "summary") {
            const savedSkill = currentSavedPhase as Skill;
            if (skillOrder.includes(savedSkill) && !statusMap[savedSkill]) {
              setPhase(currentSavedPhase);
            }
          }
        } else if (currentSavedPhase && currentSavedPhase !== "gate" && currentSavedPhase !== "summary") {
          setPhase(currentSavedPhase);
          setGateState("in_progress");
        } else {
          setGateState("idle");
        }
      } catch {
        if (currentSavedPhase && currentSavedPhase !== "gate") {
          setPhase(currentSavedPhase);
          setGateState("in_progress");
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
  };

  if (isCheckingStatus) {
    return (
      <>
        <TopNavBar />
        <div className="min-h-screen bg-white flex items-center justify-center">
          <div className="flex flex-col items-center gap-4 text-center">
            <div className="w-12 h-12 rounded-full border-4 border-gray-200 border-t-indigo-700 animate-spin" />
            <p className="text-gray-600 text-sm font-bold uppercase tracking-wide">Checking diagnostic status…</p>
          </div>
        </div>
      </>
    );
  }

  if (tabConflict) {
    return (
      <>
        <TopNavBar />
        <div className="min-h-screen bg-white flex items-center justify-center p-4">
          <div className="bg-white p-8 md:p-10 rounded-xl border-2 border-gray-900 max-w-md text-center animate-fade-in" style={{ boxShadow: '6px 6px 0 #0F0F0F' }}>
            <div className="text-4xl mb-4">⚠️</div>
            <h2 className="text-xl font-black text-gray-900 mb-2 uppercase tracking-wide">Session Already Active</h2>
            <p className="text-gray-500 text-sm">
              You are already taking this diagnostic in another tab. Please close this tab or return to the active one to continue.
            </p>
          </div>
        </div>
      </>
    );
  }

  return (
    <div className="min-h-screen bg-white text-gray-900">
      <TopNavBar />

      {/* Subtle grid background */}
      <div className="fixed inset-0 pointer-events-none" style={{
        backgroundImage: 'radial-gradient(circle, #e5e7eb 1px, transparent 1px)',
        backgroundSize: '24px 24px',
        opacity: 0.4,
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

        <div className="flex-1 bg-white border-2 border-gray-900 rounded-xl p-6 md:p-8" style={{ boxShadow: '6px 6px 0 #0F0F0F' }}>
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
            />
          )}
        </div>

        <p className="text-center text-gray-400 text-xs mt-4 font-bold uppercase tracking-widest">
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
        .neo-btn {
          transition: all 0.1s ease;
        }
        .neo-btn:hover {
          transform: translate(-1px, -1px);
        }
        .neo-btn:active {
          transform: translate(2px, 2px);
          box-shadow: 2px 2px 0 #0F0F0F !important;
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
    <div className="flex bg-white min-h-screen items-center justify-center p-6 relative w-full overflow-hidden">
      {/* Dot grid background */}
      <div className="absolute inset-0 pointer-events-none" style={{
        backgroundImage: 'radial-gradient(circle, #d1d5db 1px, transparent 1px)',
        backgroundSize: '24px 24px',
        opacity: 0.5,
      }} />
      
      <div className="bg-white p-8 md:p-10 rounded-xl w-full max-w-md relative z-10 border-2 border-gray-900 animate-fade-in" style={{ boxShadow: '8px 8px 0 #0F0F0F' }}>
        <div className="flex items-center gap-3 mb-8">
          <div className="p-3 bg-indigo-700 border-2 border-gray-900 rounded-lg" style={{ boxShadow: '3px 3px 0 #0F0F0F' }}>
            <GraduationCap className="h-6 w-6 text-white" />
          </div>
          <span className="text-2xl font-black text-gray-900 uppercase tracking-tight">TestCrack</span>
        </div>
        
        <div className="mb-2">
          <span className="inline-block bg-indigo-700 text-white text-xs font-black uppercase tracking-widest px-3 py-1 rounded border-2 border-gray-900 mb-3" style={{ boxShadow: '2px 2px 0 #0F0F0F' }}>
            Welcome
          </span>
        </div>
        <h2 className="text-2xl font-black mb-2 text-gray-900 leading-tight uppercase tracking-tight">Let's Set Your Goals 🎯</h2>
        <p className="text-gray-500 mb-8 text-sm leading-relaxed">Tailor your upcoming diagnostic baseline specifically for you.</p>
        
        <form onSubmit={handleSave} className="space-y-6">
          <div className="space-y-2">
            <label className="block text-xs font-black text-gray-700 uppercase tracking-widest">Full Name</label>
            <input 
              type="text"
              value={name} 
              onChange={(e) => setName(e.target.value)} 
              required 
              placeholder="E.g. John Doe" 
              className="w-full border-2 border-gray-900 rounded-lg p-3.5 text-sm font-bold focus:border-indigo-700 focus:ring-2 focus:ring-indigo-100 outline-none transition-all bg-white placeholder:text-gray-300 text-gray-900"
              style={{ boxShadow: '3px 3px 0 #0F0F0F' }}
            />
          </div>
          
          <div className="space-y-2">
            <label className="block text-xs font-black text-gray-700 uppercase tracking-widest">Target IELTS Band</label>
            <div className="relative">
              <select 
                value={targetBand} 
                onChange={(e) => setTargetBand(e.target.value)}
                className="w-full border-2 border-gray-900 rounded-lg p-3.5 text-sm font-black focus:border-indigo-700 focus:ring-2 focus:ring-indigo-100 outline-none transition-all bg-white appearance-none text-indigo-700 cursor-pointer"
                style={{ boxShadow: '3px 3px 0 #0F0F0F' }}
              >
                {[4.5, 5.0, 5.5, 6.0, 6.5, 7.0, 7.5, 8.0, 8.5, 9.0].map(band => (
                  <option key={band} value={band.toFixed(1)}>{band.toFixed(1)} Band</option>
                ))}
              </select>
              <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-gray-900 font-black text-lg">⌄</div>
            </div>
          </div>

          <button 
            type="submit" 
            className="w-full mt-4 py-4 bg-indigo-700 hover:bg-indigo-600 text-white font-black text-base uppercase tracking-wide rounded-lg border-2 border-gray-900 transition-all neo-btn disabled:opacity-70 disabled:pointer-events-none" 
            style={{ boxShadow: '5px 5px 0 #0F0F0F' }}
            disabled={loading}
          >
            {loading ? "Saving Profile..." : "Start Diagnostic →"}
          </button>
        </form>
      </div>

      <style>{`
        @keyframes fade-in {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in { animation: fade-in 0.35s ease-out; }
        .neo-btn { transition: all 0.1s ease; }
        .neo-btn:hover { transform: translate(-1px, -1px); }
        .neo-btn:active { transform: translate(2px, 2px); box-shadow: 2px 2px 0 #0F0F0F !important; }
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