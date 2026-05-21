import { useState, useEffect } from "react";
import { StudentSidebar } from "./dashboard/StudentSidebar";
import { StudentTopbar } from "./dashboard/StudentTopbar";
import { PremiumModal } from "@/features/payment/components/PremiumModal";
import { callBackend } from "@/features/auth/services/authClient";
import {
  ChevronDown, ChevronUp, Headphones, BookOpen, PenLine, Mic,
  Clock, Filter, BarChart2, FileText, Stethoscope, Loader2,
  AlertCircle, MessageSquare, X, CheckCircle2, ArrowRight, Target,
  Sparkles,
} from "lucide-react";

// ─── TYPES ────────────────────────────────────────────────────────────────────

type SkillType = "LISTENING" | "READING" | "WRITING" | "SPEAKING";
type ModeType = "INTERNAL_ASSESSMENT" | "MOCK" | "DIAGNOSTIC";

interface AssessmentEntry {
  id: string;
  skill: SkillType;
  mode: ModeType;
  band_score: number;
  sub_scores: Record<string, any> | null;
  feedback_json: Record<string, any> | null;
  created_at: string;
}

interface ReportPayload {
  skill: SkillType;
  subScores: Record<string, any>;
}

// ─── CONSTANTS ────────────────────────────────────────────────────────────────

const BACKEND = import.meta.env.VITE_BACKEND_URL || "http://localhost:4000";

const SKILL_CONFIG: Record<
  SkillType,
  { label: string; icon: React.ReactNode; color: string; bg: string; border: string }
> = {
  LISTENING: {
    label: "Listening", icon: <Headphones className="h-4 w-4" />,
    color: "text-sky-600 dark:text-sky-400",
    bg: "bg-sky-50 dark:bg-sky-500/10",
    border: "border-sky-200 dark:border-sky-500/30",
  },
  READING: {
    label: "Reading", icon: <BookOpen className="h-4 w-4" />,
    color: "text-violet-600 dark:text-violet-400",
    bg: "bg-violet-50 dark:bg-violet-500/10",
    border: "border-violet-200 dark:border-violet-500/30",
  },
  WRITING: {
    label: "Writing", icon: <PenLine className="h-4 w-4" />,
    color: "text-amber-600 dark:text-amber-400",
    bg: "bg-amber-50 dark:bg-amber-500/10",
    border: "border-amber-200 dark:border-amber-500/30",
  },
  SPEAKING: {
    label: "Speaking", icon: <Mic className="h-4 w-4" />,
    color: "text-rose-600 dark:text-rose-400",
    bg: "bg-rose-50 dark:bg-rose-500/10",
    border: "border-rose-200 dark:border-rose-500/30",
  },
};

const MODE_CONFIG: Record<string, { label: string; badge: string }> = {
  INTERNAL_ASSESSMENT: { label: "Internal Assessment", badge: "bg-indigo-100 text-indigo-700 dark:bg-indigo-500/20 dark:text-indigo-400" },
  MOCK:                { label: "Mock Test",            badge: "bg-purple-100 text-purple-700 dark:bg-purple-500/20 dark:text-purple-400" },
  DIAGNOSTIC:         { label: "Diagnostic",           badge: "bg-teal-100 text-teal-700 dark:bg-teal-500/20 dark:text-teal-400" },
};

const SCORE_KEY_LABELS: Record<string, string> = {
  grammarScore:      "Grammar",
  vocabularyScore:   "Vocabulary",
  coherenceScore:    "Coherence",
  taskResponseScore: "Task Response",
  fluencyScore:      "Fluency",
  pronunciationScore:"Pronunciation",
};

const SUBSKILL_CONFIG: Record<string, { label: string; color: string; bg: string; border: string; dot: string }> = {
  fluency:       { label: "Fluency",       color: "text-blue-600 dark:text-blue-400",     bg: "bg-blue-50 dark:bg-blue-500/10",       border: "border-blue-200 dark:border-blue-500/30",     dot: "bg-blue-500" },
  grammar:       { label: "Grammar",       color: "text-violet-600 dark:text-violet-400", bg: "bg-violet-50 dark:bg-violet-500/10",   border: "border-violet-200 dark:border-violet-500/30", dot: "bg-violet-500" },
  vocabulary:    { label: "Vocabulary",    color: "text-emerald-600 dark:text-emerald-400", bg: "bg-emerald-50 dark:bg-emerald-500/10", border: "border-emerald-200 dark:border-emerald-500/30", dot: "bg-emerald-500" },
  pronunciation: { label: "Pronunciation", color: "text-rose-600 dark:text-rose-400",     bg: "bg-rose-50 dark:bg-rose-500/10",       border: "border-rose-200 dark:border-rose-500/30",     dot: "bg-rose-500" },
  coherence:     { label: "Coherence",     color: "text-amber-600 dark:text-amber-400",   bg: "bg-amber-50 dark:bg-amber-500/10",     border: "border-amber-200 dark:border-amber-500/30",   dot: "bg-amber-500" },
  task_response: { label: "Task Response", color: "text-teal-600 dark:text-teal-400",     bg: "bg-teal-50 dark:bg-teal-500/10",       border: "border-teal-200 dark:border-teal-500/30",     dot: "bg-teal-500" },
};

const SUBSKILL_SCORE_KEY: Record<string, string> = {
  fluency:       "fluencyScore",
  grammar:       "grammarScore",
  vocabulary:    "vocabularyScore",
  pronunciation: "pronunciationScore",
  coherence:     "coherenceScore",
  task_response: "taskResponseScore",
};

const SPEAKING_SUBSKILLS = ["fluency", "grammar", "vocabulary", "pronunciation"] as const;
const WRITING_SUBSKILLS  = ["grammar", "vocabulary", "coherence", "task_response"] as const;
const SKILL_ORDER: SkillType[] = ["LISTENING", "READING", "WRITING", "SPEAKING"];

// ─── HELPERS ──────────────────────────────────────────────────────────────────

const bandColor = (band: number) => {
  if (band >= 7.5) return "text-emerald-600 dark:text-emerald-400";
  if (band >= 6.0) return "text-sky-600 dark:text-sky-400";
  if (band >= 5.0) return "text-amber-600 dark:text-amber-400";
  return "text-rose-600 dark:text-rose-400";
};

const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString("en-IN", {
    day: "numeric", month: "short", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });

const hasRichFeedback = (subScores: Record<string, any> | null): boolean => {
  if (!subScores?.feedback || typeof subScores.feedback !== "object") return false;
  const feedbackKeys = Object.keys(subScores.feedback);
  const richKeys = ["fluency", "grammar", "vocabulary", "pronunciation", "coherence", "task_response"];
  return feedbackKeys.some((k) => richKeys.includes(k));
};

// ─── SUB-SKILL CARD (inside Full AI Report modal) ─────────────────────────────

const SubSkillCard = ({
  subSkillKey,
  data,
  score,
}: {
  subSkillKey: string;
  data: any;
  score?: number;
}) => {
  const cfg = SUBSKILL_CONFIG[subSkillKey];
  if (!cfg || !data) return null;

  const issues   = (data.observed_issues ?? []) as string[];
  const errors   = (data.error_examples  ?? []) as string[];
  const strengths = (data.strengths       ?? []) as string[];

  return (
    <div className={`rounded-2xl border ${cfg.border} overflow-hidden`}>
      {/* Header */}
      <div className={`${cfg.bg} px-5 py-4 flex items-center justify-between`}>
        <div className="flex items-center gap-2.5">
          <span className={`w-2.5 h-2.5 rounded-full ${cfg.dot} shrink-0`} />
          <h3 className={`font-black text-base ${cfg.color}`}>{cfg.label}</h3>
        </div>
        {score != null && !isNaN(score) && (
          <div className="flex items-baseline gap-1">
            <span className={`text-2xl font-black ${bandColor(score)}`}>
              {score % 1 === 0 ? score.toFixed(1) : score}
            </span>
            <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wide">
              Band
            </span>
          </div>
        )}
      </div>

      {/* Body */}
      <div className="px-5 py-4 space-y-4 bg-white dark:bg-slate-900">
        {/* Score rationale */}
        {data.score_rationale && (
          <div>
            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5">
              Rationale
            </p>
            <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
              {data.score_rationale}
            </p>
          </div>
        )}

        {/* Strengths */}
        {strengths.length > 0 && (
          <div>
            <p className="text-[10px] font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-widest mb-2 flex items-center gap-1.5">
              <CheckCircle2 className="h-3 w-3" /> Strengths
            </p>
            <ul className="space-y-1.5">
              {strengths.map((s, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-slate-700 dark:text-slate-300">
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 mt-0.5 shrink-0" />
                  <span>{s}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Observed issues */}
        {issues.length > 0 && (
          <div>
            <p className="text-[10px] font-black text-amber-600 dark:text-amber-400 uppercase tracking-widest mb-2">
              Observed Issues
            </p>
            <ul className="space-y-1.5">
              {issues.map((issue, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-slate-700 dark:text-slate-300">
                  <span className="text-amber-500 mt-0.5 shrink-0 font-bold">•</span>
                  <span>{issue}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Error examples */}
        {errors.length > 0 && (
          <div>
            <p className="text-[10px] font-black text-rose-600 dark:text-rose-400 uppercase tracking-widest mb-2">
              Error Examples
            </p>
            <ul className="space-y-1.5">
              {errors.map((err, i) => (
                <li
                  key={i}
                  className="flex items-start gap-2.5 text-sm font-mono bg-rose-50 dark:bg-rose-500/10 border border-rose-100 dark:border-rose-500/20 rounded-lg px-3 py-2 text-slate-700 dark:text-slate-300"
                >
                  <span className="text-rose-500 shrink-0 font-bold not-italic">✗</span>
                  <span className="not-italic">{err}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Next step */}
        {data.next_step && (
          <div className="bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-200 dark:border-indigo-500/30 rounded-xl p-4 flex items-start gap-3">
            <ArrowRight className="h-4 w-4 text-indigo-500 mt-0.5 shrink-0" />
            <div>
              <p className="text-[10px] font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-widest mb-1">
                Next Step
              </p>
              <p className="text-sm text-indigo-700 dark:text-indigo-300 leading-relaxed">
                {data.next_step}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// ─── FULL AI REPORT MODAL ────────────────────────────────────────────────────

const FullAIReportModal = ({
  report,
  onClose,
}: {
  report: ReportPayload;
  onClose: () => void;
}) => {
  const { skill, subScores } = report;
  const cfg = SKILL_CONFIG[skill];
  const feedback = subScores.feedback as Record<string, any> | null;
  const priorityAction  = feedback?.priority_action as string | undefined;
  const fillerWords     = feedback?.filler_words_detected as string[] | undefined;
  const wordCount       = subScores.word_count as number | undefined;
  const subSkillOrder   = skill === "SPEAKING" ? SPEAKING_SUBSKILLS : WRITING_SUBSKILLS;

  // Lock body scroll while open
  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = ""; };
  }, []);

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Panel */}
      <div className="relative w-full sm:max-w-2xl max-h-[92vh] sm:max-h-[88vh] bg-white dark:bg-slate-900 shadow-2xl flex flex-col rounded-t-3xl sm:rounded-2xl overflow-hidden">

        {/* Sticky header */}
        <div className={`${cfg.bg} border-b ${cfg.border} px-6 py-5 flex items-center justify-between shrink-0`}>
          <div className="flex items-center gap-3">
            <div className={`h-10 w-10 rounded-xl flex items-center justify-center border ${cfg.border} ${cfg.bg} ${cfg.color}`}>
              {cfg.icon}
            </div>
            <div>
              <h2 className="text-base font-black text-slate-800 dark:text-white">
                {cfg.label} — Full AI Report
              </h2>
              {wordCount != null && (
                <p className="text-xs text-slate-500 mt-0.5">
                  {wordCount} words written
                </p>
              )}
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl hover:bg-black/10 dark:hover:bg-white/10 text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Scrollable body */}
        <div className="overflow-y-auto flex-1 px-6 py-5 space-y-4">

          {/* Priority Action callout */}
          {priorityAction && (
            <div className="bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/30 rounded-2xl p-5">
              <div className="flex items-center gap-2 mb-2">
                <Target className="h-4 w-4 text-amber-600 dark:text-amber-400 shrink-0" />
                <p className="text-[10px] font-black text-amber-700 dark:text-amber-400 uppercase tracking-widest">
                  Priority Action
                </p>
              </div>
              <p className="text-sm font-semibold text-amber-900 dark:text-amber-200 leading-relaxed">
                {priorityAction}
              </p>
            </div>
          )}

          {/* Sub-skill breakdown cards */}
          {feedback &&
            subSkillOrder.map((key) => {
              const data = feedback[key];
              const scoreKey = SUBSKILL_SCORE_KEY[key];
              const rawScore = scoreKey ? subScores[scoreKey] : undefined;
              const score = rawScore != null ? parseFloat(String(rawScore)) : undefined;
              return (
                <SubSkillCard key={key} subSkillKey={key} data={data} score={score} />
              );
            })}

          {/* Filler words (Speaking only) */}
          {fillerWords && fillerWords.length > 0 && (
            <div className="bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-2xl p-5">
              <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3 flex items-center gap-1.5">
                <MessageSquare className="h-3 w-3" /> Filler Words Detected
              </p>
              <div className="flex flex-wrap gap-2">
                {fillerWords.map((f, i) => (
                  <span
                    key={i}
                    className="bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg px-3 py-1.5 text-sm font-semibold text-slate-600 dark:text-slate-300"
                  >
                    {f}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Bottom padding */}
          <div className="h-2" />
        </div>
      </div>
    </div>
  );
};

// ─── SUB-SCORE DISPLAY (compact, for card / row expand) ───────────────────────

const SubScoreDisplay = ({
  subScores,
  onViewFullReport,
}: {
  subScores: Record<string, any>;
  onViewFullReport?: () => void;
}) => {
  const namedScoreKeys = Object.keys(SCORE_KEY_LABELS).filter(
    (k) => subScores[k] != null
  );
  const hasQuestionData = subScores.total_questions != null;

  // Simple feedback text for non-rich feedback (Reading/Listening)
  const simpleFeedback: string | null = (() => {
    if (typeof subScores.content_assessment === "string") return subScores.content_assessment;
    if (typeof subScores.feedback === "string") return subScores.feedback;
    return null;
  })();

  return (
    <div className="space-y-4">
      {/* Named score chips (Writing/Speaking sub-skills) */}
      {namedScoreKeys.length > 0 && (
        <div>
          <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">
            Sub-scores
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {namedScoreKeys.map((key) => (
              <div
                key={key}
                className="bg-white dark:bg-slate-900 rounded-xl p-3 border border-slate-100 dark:border-slate-800"
              >
                <p className="text-[11px] text-slate-400 font-semibold mb-0.5">
                  {SCORE_KEY_LABELS[key]}
                </p>
                <p className={`text-xl font-black ${bandColor(Number(subScores[key]))}`}>
                  {Number(subScores[key]).toFixed(1)}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Question-based breakdown (Reading/Listening) */}
      {hasQuestionData && (
        <div>
          <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">
            Score Breakdown
          </p>
          <div className="flex flex-wrap gap-2 mb-2">
            <div className="bg-white dark:bg-slate-900 rounded-xl p-3 border border-slate-100 dark:border-slate-800 text-center min-w-[80px]">
              <p className="text-[11px] text-slate-400 font-semibold">Correct</p>
              <p className="text-xl font-black text-slate-800 dark:text-white">
                {subScores.correct_answers}/{subScores.total_questions}
              </p>
            </div>
            {subScores.accuracy_percentage != null && (
              <div className="bg-white dark:bg-slate-900 rounded-xl p-3 border border-slate-100 dark:border-slate-800 text-center min-w-[80px]">
                <p className="text-[11px] text-slate-400 font-semibold">Accuracy</p>
                <p className="text-xl font-black text-slate-800 dark:text-white">
                  {Number(subScores.accuracy_percentage).toFixed(0)}%
                </p>
              </div>
            )}
          </div>
          {subScores.by_question_type &&
            Object.keys(subScores.by_question_type).length > 0 && (
              <div className="flex flex-wrap gap-2">
                {Object.entries(subScores.by_question_type).map(
                  ([type, data]: [string, any]) => (
                    <span
                      key={type}
                      className="bg-white dark:bg-slate-900 rounded-lg px-3 py-1.5 border border-slate-100 dark:border-slate-800 text-[11px] font-semibold text-slate-600 dark:text-slate-300"
                    >
                      {type.toUpperCase()}: {data.correct}/{data.total}
                    </span>
                  )
                )}
              </div>
            )}
        </div>
      )}

      {/* Simple feedback (Reading/Listening) */}
      {simpleFeedback && !hasRichFeedback({ feedback: subScores.feedback } as any) && (
        <div>
          <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 flex items-center gap-1.5">
            <MessageSquare className="h-3 w-3" /> AI Feedback
          </p>
          <p className="text-sm text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-900 rounded-xl p-4 border border-slate-100 dark:border-slate-800 leading-relaxed">
            {simpleFeedback}
          </p>
        </div>
      )}

      {/* Rich feedback CTA (Writing/Speaking) */}
      {hasRichFeedback(subScores) && onViewFullReport && (
        <button
          onClick={onViewFullReport}
          className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl border-2 border-indigo-200 dark:border-indigo-500/40 bg-indigo-50 dark:bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 font-bold text-sm hover:bg-indigo-100 dark:hover:bg-indigo-500/20 transition-colors"
        >
          <Sparkles className="h-4 w-4" />
          View Full AI Report
        </button>
      )}
    </div>
  );
};

// ─── ASSESSMENT ROW ───────────────────────────────────────────────────────────

const AssessmentRow = ({
  entry,
  isExpanded,
  onToggle,
  onOpenReport,
}: {
  entry: AssessmentEntry;
  isExpanded: boolean;
  onToggle: () => void;
  onOpenReport: (payload: ReportPayload) => void;
}) => {
  const cfg     = SKILL_CONFIG[entry.skill];
  const modeCfg = MODE_CONFIG[entry.mode] ?? { label: entry.mode, badge: "" };

  return (
    <div className={`bg-white dark:bg-slate-900 rounded-2xl border shadow-sm overflow-hidden transition-all duration-200 ${cfg.border}`}>
      <button
        onClick={onToggle}
        className="w-full flex items-center gap-4 p-4 sm:p-5 text-left hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors"
      >
        <div className={`flex-shrink-0 h-10 w-10 rounded-xl flex items-center justify-center ${cfg.bg} ${cfg.color}`}>
          {cfg.icon}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-bold text-slate-800 dark:text-white">{cfg.label}</span>
            <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${modeCfg.badge}`}>
              {modeCfg.label}
            </span>
          </div>
          <div className="flex items-center gap-1 mt-1 text-xs text-slate-400">
            <Clock className="h-3 w-3" />
            {formatDate(entry.created_at)}
          </div>
        </div>
        <div className="flex-shrink-0 text-right mr-2">
          <p className={`text-3xl font-black ${bandColor(entry.band_score)}`}>
            {entry.band_score.toFixed(1)}
          </p>
          <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wide">Band</p>
        </div>
        <div className="flex-shrink-0 text-slate-400">
          {isExpanded ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
        </div>
      </button>

      {isExpanded && (
        <div className={`border-t ${cfg.border} px-4 sm:px-5 pb-5 pt-4 ${cfg.bg}`}>
          {entry.sub_scores && Object.keys(entry.sub_scores).length > 0 ? (
            <SubScoreDisplay
              subScores={entry.sub_scores}
              onViewFullReport={
                hasRichFeedback(entry.sub_scores)
                  ? () => onOpenReport({ skill: entry.skill, subScores: entry.sub_scores! })
                  : undefined
              }
            />
          ) : (
            <p className="text-sm text-slate-400 italic">
              No detailed breakdown available for this entry.
            </p>
          )}
        </div>
      )}
    </div>
  );
};

// ─── DIAGNOSTIC REPORT TAB ────────────────────────────────────────────────────

const DiagnosticReportTab = ({
  data,
  onOpenReport,
}: {
  data: AssessmentEntry[];
  onOpenReport: (payload: ReportPayload) => void;
}) => {
  if (data.length === 0) {
    return (
      <div className="text-center py-16 text-slate-400">
        <Stethoscope className="h-10 w-10 mx-auto mb-3 opacity-40" />
        <p className="font-semibold text-slate-600 dark:text-slate-300">
          No diagnostic report found
        </p>
        <p className="text-sm mt-1">
          Complete your diagnostic assessment to see your baseline scores here.
        </p>
      </div>
    );
  }

  const bySkill = Object.fromEntries(data.map((e) => [e.skill, e])) as Partial<
    Record<SkillType, AssessmentEntry>
  >;

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
        <Clock className="h-4 w-4 shrink-0" />
        <span>
          Assessed on{" "}
          <span className="font-semibold text-slate-700 dark:text-slate-200">
            {formatDate(data[0].created_at)}
          </span>
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {SKILL_ORDER.map((skill) => {
          const cfg   = SKILL_CONFIG[skill];
          const entry = bySkill[skill];

          if (!entry) {
            return (
              <div
                key={skill}
                className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 p-5 opacity-40"
              >
                <div className="flex items-center gap-3">
                  <div className={`h-10 w-10 rounded-xl flex items-center justify-center ${cfg.bg} ${cfg.color}`}>
                    {cfg.icon}
                  </div>
                  <div>
                    <p className="font-bold text-slate-800 dark:text-white">{cfg.label}</p>
                    <p className="text-xs text-slate-400">Not assessed</p>
                  </div>
                </div>
              </div>
            );
          }

          const rich = entry.sub_scores ? hasRichFeedback(entry.sub_scores) : false;

          return (
            <div key={skill} className={`bg-white dark:bg-slate-900 rounded-2xl border ${cfg.border} p-5 flex flex-col`}>
              {/* Card header */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className={`h-10 w-10 rounded-xl flex items-center justify-center ${cfg.bg} ${cfg.color}`}>
                    {cfg.icon}
                  </div>
                  <p className="font-bold text-slate-800 dark:text-white">{cfg.label}</p>
                </div>
                <div className="text-right">
                  <p className={`text-3xl font-black ${bandColor(entry.band_score)}`}>
                    {entry.band_score.toFixed(1)}
                  </p>
                  <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wide">Band</p>
                </div>
              </div>

              {/* Sub-scores */}
              {entry.sub_scores && Object.keys(entry.sub_scores).length > 0 && (
                <div className={`pt-4 border-t ${cfg.border} flex-1`}>
                  <SubScoreDisplay
                    subScores={entry.sub_scores}
                    onViewFullReport={
                      rich
                        ? () => onOpenReport({ skill, subScores: entry.sub_scores! })
                        : undefined
                    }
                  />
                </div>
              )}

              {/* Full report CTA (if rich feedback exists, shows inside SubScoreDisplay) */}
            </div>
          );
        })}
      </div>
    </div>
  );
};

// ─── FILTER CHIP ──────────────────────────────────────────────────────────────

const FilterChip = ({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) => (
  <button
    onClick={onClick}
    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all duration-150 border ${
      active
        ? "bg-indigo-600 text-white border-indigo-600 shadow-sm"
        : "bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:border-indigo-300 hover:text-indigo-600"
    }`}
  >
    {label}
  </button>
);

// ─── MAIN COMPONENT ───────────────────────────────────────────────────────────

const AssessmentHistoryPage = () => {
  const [activeTab, setActiveTab] = useState<"assessments" | "diagnostic">("assessments");
  const [showPremiumModal, setShowPremiumModal]   = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  const [assessments, setAssessments]         = useState<AssessmentEntry[]>([]);
  const [assessmentsLoading, setAssessmentsLoading] = useState(true);
  const [assessmentsError, setAssessmentsError]     = useState(false);

  const [diagnostic, setDiagnostic]           = useState<AssessmentEntry[]>([]);
  const [diagnosticLoading, setDiagnosticLoading]   = useState(true);

  const [filterMode, setFilterMode]   = useState<"ALL" | "INTERNAL_ASSESSMENT" | "MOCK">("ALL");
  const [filterSkill, setFilterSkill] = useState<"ALL" | SkillType>("ALL");
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());

  // Full AI Report modal
  const [activeReport, setActiveReport] = useState<ReportPayload | null>(null);

  useEffect(() => {
    const fetchAssessments = async () => {
      try {
        const res = await callBackend(`${BACKEND}/api/student/assessment-history`);
        if (res.success) setAssessments(res.data);
        else setAssessmentsError(true);
      } catch {
        setAssessmentsError(true);
      } finally {
        setAssessmentsLoading(false);
      }
    };

    const fetchDiagnostic = async () => {
      try {
        const res = await callBackend(`${BACKEND}/api/student/diagnostic-report`);
        if (res.success) setDiagnostic(res.data);
      } catch {
        // silent — student may not have completed diagnostic yet
      } finally {
        setDiagnosticLoading(false);
      }
    };

    fetchAssessments();
    fetchDiagnostic();
  }, []);

  const filtered = assessments.filter((e) => {
    if (filterMode !== "ALL" && e.mode !== filterMode) return false;
    if (filterSkill !== "ALL" && e.skill !== filterSkill) return false;
    return true;
  });

  const toggleExpand = (id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-slate-950 transition-colors duration-300">
      <StudentSidebar
        activeTab="assessment-history"
        onTabChange={() => {}}
        isCollapsed={isSidebarCollapsed}
        toggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
      />

      <div className={`min-h-screen flex flex-col transition-all duration-300 ${isSidebarCollapsed ? "lg:pl-20" : "lg:pl-64"}`}>
        <StudentTopbar onUpgradeClick={() => setShowPremiumModal(true)} />

        <main className="flex-1 p-4 sm:p-6 lg:p-8 space-y-6">

          {/* Header */}
          <div>
            <h1 className="text-2xl font-black text-slate-800 dark:text-white">
              Assessment History
            </h1>
            <p className="text-sm text-slate-500 mt-0.5">
              Track your progress across all assessments
            </p>
          </div>

          {/* Tabs */}
          <div className="flex gap-1 p-1 bg-slate-100 dark:bg-slate-800/50 rounded-xl w-fit">
            <button
              onClick={() => setActiveTab("assessments")}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all ${
                activeTab === "assessments"
                  ? "bg-white dark:bg-slate-900 text-slate-800 dark:text-white shadow-sm"
                  : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
              }`}
            >
              <FileText className="h-4 w-4" />
              Assessments
              {assessments.length > 0 && (
                <span className="ml-0.5 text-[10px] font-black bg-indigo-100 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 px-1.5 py-0.5 rounded-full">
                  {assessments.length}
                </span>
              )}
            </button>
            <button
              onClick={() => setActiveTab("diagnostic")}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all ${
                activeTab === "diagnostic"
                  ? "bg-white dark:bg-slate-900 text-slate-800 dark:text-white shadow-sm"
                  : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
              }`}
            >
              <Stethoscope className="h-4 w-4" />
              Diagnostic Report
              {!diagnosticLoading && diagnostic.length > 0 && (
                <span className="ml-0.5 w-2 h-2 rounded-full bg-teal-500 shrink-0" />
              )}
            </button>
          </div>

          {/* ── Assessments Tab ─────────────────────────────────────── */}
          {activeTab === "assessments" && (
            <>
              {/* Filter bar */}
              <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 p-4 shadow-sm">
                <div className="flex flex-wrap items-center gap-3">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-slate-500 uppercase tracking-wider mr-1">
                    <Filter className="h-3.5 w-3.5" /> Filter by
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {(
                      [
                        ["ALL",                  "All"],
                        ["INTERNAL_ASSESSMENT",  "Internal Assessment"],
                        ["MOCK",                 "Mock Test"],
                      ] as const
                    ).map(([val, label]) => (
                      <FilterChip key={val} label={label} active={filterMode === val} onClick={() => setFilterMode(val)} />
                    ))}
                  </div>
                  <div className="h-5 w-px bg-slate-200 dark:bg-slate-700 hidden sm:block" />
                  <div className="flex flex-wrap gap-2">
                    {(
                      [
                        ["ALL",       "All Skills"],
                        ["LISTENING", "Listening"],
                        ["READING",   "Reading"],
                        ["WRITING",   "Writing"],
                        ["SPEAKING",  "Speaking"],
                      ] as const
                    ).map(([val, label]) => (
                      <FilterChip key={val} label={label} active={filterSkill === val} onClick={() => setFilterSkill(val)} />
                    ))}
                  </div>
                </div>
              </div>

              {!assessmentsLoading && !assessmentsError && (
                <p className="text-sm text-slate-500">
                  {filtered.length} entr{filtered.length !== 1 ? "ies" : "y"} found
                </p>
              )}

              {assessmentsLoading ? (
                <div className="flex items-center justify-center py-16 gap-3 text-slate-400">
                  <Loader2 className="h-5 w-5 animate-spin" />
                  <span className="text-sm font-medium">Loading assessments…</span>
                </div>
              ) : assessmentsError ? (
                <div className="flex flex-col items-center py-16 gap-3 text-slate-400">
                  <AlertCircle className="h-8 w-8 text-rose-400" />
                  <p className="text-sm font-semibold text-slate-600 dark:text-slate-300">
                    Failed to load assessments
                  </p>
                  <p className="text-xs">Please refresh the page and try again.</p>
                </div>
              ) : filtered.length === 0 ? (
                <div className="text-center py-16 text-slate-400">
                  <BarChart2 className="h-10 w-10 mx-auto mb-3 opacity-40" />
                  <p className="font-semibold text-slate-600 dark:text-slate-300">
                    {assessments.length === 0 ? "No assessments yet" : "No entries match this filter"}
                  </p>
                  {assessments.length === 0 && (
                    <p className="text-sm mt-1">
                      Complete an Internal Assessment or Mock Test to see results here.
                    </p>
                  )}
                </div>
              ) : (
                <div className="space-y-3">
                  {filtered.map((entry) => (
                    <AssessmentRow
                      key={entry.id}
                      entry={entry}
                      isExpanded={expandedIds.has(entry.id)}
                      onToggle={() => toggleExpand(entry.id)}
                      onOpenReport={setActiveReport}
                    />
                  ))}
                </div>
              )}
            </>
          )}

          {/* ── Diagnostic Tab ───────────────────────────────────────── */}
          {activeTab === "diagnostic" && (
            diagnosticLoading ? (
              <div className="flex items-center justify-center py-16 gap-3 text-slate-400">
                <Loader2 className="h-5 w-5 animate-spin" />
                <span className="text-sm font-medium">Loading diagnostic report…</span>
              </div>
            ) : (
              <DiagnosticReportTab data={diagnostic} onOpenReport={setActiveReport} />
            )
          )}
        </main>
      </div>

      {/* Full AI Report Modal */}
      {activeReport && (
        <FullAIReportModal report={activeReport} onClose={() => setActiveReport(null)} />
      )}

      <PremiumModal
        isOpen={showPremiumModal}
        onClose={() => setShowPremiumModal(false)}
      />
    </div>
  );
};

export default AssessmentHistoryPage;
