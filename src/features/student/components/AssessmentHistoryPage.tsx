import { useState, useEffect } from "react";
import { StudentSidebar } from "./dashboard/StudentSidebar";
import { StudentTopbar } from "./dashboard/StudentTopbar";
import { PremiumModal } from "@/features/payment/components/PremiumModal";
import { callBackend } from "@/features/auth/services/authClient";
import {
  ChevronDown, ChevronUp, Headphones, BookOpen, PenLine, Mic,
  Clock, Filter, BarChart2, FileText, Stethoscope, Loader2,
  AlertCircle, MessageSquare, X, CheckCircle2, ArrowRight, Target,
  Sparkles, Zap, ListChecks,
} from "lucide-react";

// ─── TYPES ────────────────────────────────────────────────────────────────────

type SkillType = "LISTENING" | "READING" | "WRITING" | "SPEAKING";
type ModeType  = "INTERNAL_ASSESSMENT" | "MOCK" | "DIAGNOSTIC";

interface AssessmentEntry {
  id: string;
  skill: SkillType;
  mode: ModeType;
  band_score: number;
  sub_scores: Record<string, any> | null;
  feedback_json: Record<string, any> | null;
  created_at: string;
}

interface SectionScore {
  band: number;
  skill: string;
  sub_skill: string;
  total: number;
  correct: number;
  ai_graded: boolean;
  ai_feedback?: {
    rationale: string;
    key_observations: string[];
  };
}

interface IAEntry {
  id: string;
  ia_number: number;
  ia_date: string;           // "YYYY-MM-DD"
  time_submitted_at: string | null;
  scores: SectionScore[];
  momentum_awarded: number | null;
}

interface MockSubSkillScore {
  band: number;
  ai_band: number;
  correct: number;
  sub_skill: string;
  total_mcq: number;
  ai_feedback?: {
    rationale: string;
    key_observations: string[];
  };
}

interface MockSkillScore {
  band: number;
  skill: string;
  total: number;
  correct: number;
  ai_graded: boolean;
  sub_skill_scores?: MockSubSkillScore[];
}

interface MockEntry {
  id: string;
  month_year: string;
  attempt_type: string;        // "STANDARD" | "EARNED"
  time_submitted_at: string | null;
  scores: MockSkillScore[];
  real_band_score: number | null;
  momentum_awarded: number | null;
}

interface ReportPayload {
  skill: SkillType;
  subScores: Record<string, any>;
}

// ─── CONSTANTS ────────────────────────────────────────────────────────────────

const BACKEND = import.meta.env.VITE_BACKEND_URL || "http://localhost:4000";

const SKILL_CONFIG: Record<SkillType, { label: string; icon: React.ReactNode; color: string; bg: string; border: string }> = {
  LISTENING: { label: "Listening", icon: <Headphones className="h-4 w-4" />, color: "text-sky-600 dark:text-sky-400",    bg: "bg-sky-50 dark:bg-sky-500/10",      border: "border-sky-200 dark:border-sky-500/30" },
  READING:   { label: "Reading",   icon: <BookOpen   className="h-4 w-4" />, color: "text-violet-600 dark:text-violet-400", bg: "bg-violet-50 dark:bg-violet-500/10", border: "border-violet-200 dark:border-violet-500/30" },
  WRITING:   { label: "Writing",   icon: <PenLine    className="h-4 w-4" />, color: "text-amber-600 dark:text-amber-400",  bg: "bg-amber-50 dark:bg-amber-500/10",   border: "border-amber-200 dark:border-amber-500/30" },
  SPEAKING:  { label: "Speaking",  icon: <Mic        className="h-4 w-4" />, color: "text-rose-600 dark:text-rose-400",    bg: "bg-rose-50 dark:bg-rose-500/10",     border: "border-rose-200 dark:border-rose-500/30" },
};

const MODE_CONFIG: Record<string, { label: string; badge: string }> = {
  INTERNAL_ASSESSMENT: { label: "Internal Assessment", badge: "bg-indigo-100 text-indigo-700 dark:bg-indigo-500/20 dark:text-indigo-400" },
  MOCK:                { label: "Mock Test",            badge: "bg-purple-100 text-purple-700 dark:bg-purple-500/20 dark:text-purple-400" },
  DIAGNOSTIC:          { label: "Diagnostic",           badge: "bg-teal-100 text-teal-700 dark:bg-teal-500/20 dark:text-teal-400" },
};

const SCORE_KEY_LABELS: Record<string, string> = {
  grammarScore:       "Grammar",
  vocabularyScore:    "Vocabulary",
  coherenceScore:     "Coherence",
  taskResponseScore:  "Task Response",
  fluencyScore:       "Fluency",
  pronunciationScore: "Pronunciation",
};

const SUB_SKILL_LABELS: Record<string, string> = {
  GRAMMAR:       "Grammar",
  VOCABULARY:    "Vocabulary",
  COHERENCE:     "Coherence",
  TASK_RESPONSE: "Task Response",
  FLUENCY:       "Fluency",
  PRONUNCIATION: "Pronunciation",
  READING:       "Reading",
  LISTENING:     "Listening",
};

const SUBSKILL_CONFIG: Record<string, { label: string; color: string; bg: string; border: string; dot: string }> = {
  fluency:       { label: "Fluency",       color: "text-blue-600 dark:text-blue-400",      bg: "bg-blue-50 dark:bg-blue-500/10",       border: "border-blue-200 dark:border-blue-500/30",     dot: "bg-blue-500" },
  grammar:       { label: "Grammar",       color: "text-violet-600 dark:text-violet-400",  bg: "bg-violet-50 dark:bg-violet-500/10",   border: "border-violet-200 dark:border-violet-500/30", dot: "bg-violet-500" },
  vocabulary:    { label: "Vocabulary",    color: "text-emerald-600 dark:text-emerald-400", bg: "bg-emerald-50 dark:bg-emerald-500/10", border: "border-emerald-200 dark:border-emerald-500/30", dot: "bg-emerald-500" },
  pronunciation: { label: "Pronunciation", color: "text-rose-600 dark:text-rose-400",      bg: "bg-rose-50 dark:bg-rose-500/10",       border: "border-rose-200 dark:border-rose-500/30",     dot: "bg-rose-500" },
  coherence:     { label: "Coherence",     color: "text-amber-600 dark:text-amber-400",    bg: "bg-amber-50 dark:bg-amber-500/10",     border: "border-amber-200 dark:border-amber-500/30",   dot: "bg-amber-500" },
  task_response: { label: "Task Response", color: "text-teal-600 dark:text-teal-400",      bg: "bg-teal-50 dark:bg-teal-500/10",       border: "border-teal-200 dark:border-teal-500/30",     dot: "bg-teal-500" },
};

const SUBSKILL_SCORE_KEY: Record<string, string> = {
  fluency: "fluencyScore", grammar: "grammarScore", vocabulary: "vocabularyScore",
  pronunciation: "pronunciationScore", coherence: "coherenceScore", task_response: "taskResponseScore",
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

const bandBg = (band: number) => {
  if (band >= 7.5) return "bg-emerald-50 dark:bg-emerald-500/10 border-emerald-200 dark:border-emerald-500/30";
  if (band >= 6.0) return "bg-sky-50 dark:bg-sky-500/10 border-sky-200 dark:border-sky-500/30";
  if (band >= 5.0) return "bg-amber-50 dark:bg-amber-500/10 border-amber-200 dark:border-amber-500/30";
  return "bg-rose-50 dark:bg-rose-500/10 border-rose-200 dark:border-rose-500/30";
};

const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });

const formatIADate = (dateStr: string) =>
  new Date(dateStr + "T12:00:00").toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });

const hasRichFeedback = (subScores: Record<string, any> | null): boolean => {
  if (!subScores?.feedback || typeof subScores.feedback !== "object") return false;
  const richKeys = ["fluency", "grammar", "vocabulary", "pronunciation", "coherence", "task_response"];
  return Object.keys(subScores.feedback).some((k) => richKeys.includes(k));
};

// ─── SUB-SKILL CARD (Diagnostic / Mock modal) ─────────────────────────────────

const SubSkillCard = ({ subSkillKey, data, score }: { subSkillKey: string; data: any; score?: number }) => {
  const cfg = SUBSKILL_CONFIG[subSkillKey];
  if (!cfg || !data) return null;
  const issues   = (data.observed_issues ?? []) as string[];
  const errors   = (data.error_examples  ?? []) as string[];
  const strengths = (data.strengths      ?? []) as string[];

  return (
    <div className={`rounded-2xl border ${cfg.border} overflow-hidden`}>
      <div className={`${cfg.bg} px-5 py-4 flex items-center justify-between`}>
        <div className="flex items-center gap-2.5">
          <span className={`w-2.5 h-2.5 rounded-full ${cfg.dot} shrink-0`} />
          <h3 className={`font-black text-base ${cfg.color}`}>{cfg.label}</h3>
        </div>
        {score != null && !isNaN(score) && (
          <div className="flex items-baseline gap-1">
            <span className={`text-2xl font-black ${bandColor(score)}`}>{score % 1 === 0 ? score.toFixed(1) : score}</span>
            <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wide">Band</span>
          </div>
        )}
      </div>
      <div className="px-5 py-4 space-y-4 bg-white dark:bg-slate-900">
        {data.score_rationale && (
          <div>
            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5">Rationale</p>
            <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">{data.score_rationale}</p>
          </div>
        )}
        {strengths.length > 0 && (
          <div>
            <p className="text-[10px] font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-widest mb-2 flex items-center gap-1.5"><CheckCircle2 className="h-3 w-3" /> Strengths</p>
            <ul className="space-y-1.5">{strengths.map((s, i) => <li key={i} className="flex items-start gap-2 text-sm text-slate-700 dark:text-slate-300"><CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 mt-0.5 shrink-0" /><span>{s}</span></li>)}</ul>
          </div>
        )}
        {issues.length > 0 && (
          <div>
            <p className="text-[10px] font-black text-amber-600 dark:text-amber-400 uppercase tracking-widest mb-2">Observed Issues</p>
            <ul className="space-y-1.5">{issues.map((issue, i) => <li key={i} className="flex items-start gap-2 text-sm text-slate-700 dark:text-slate-300"><span className="text-amber-500 mt-0.5 shrink-0 font-bold">•</span><span>{issue}</span></li>)}</ul>
          </div>
        )}
        {errors.length > 0 && (
          <div>
            <p className="text-[10px] font-black text-rose-600 dark:text-rose-400 uppercase tracking-widest mb-2">Error Examples</p>
            <ul className="space-y-1.5">{errors.map((err, i) => <li key={i} className="flex items-start gap-2.5 text-sm font-mono bg-rose-50 dark:bg-rose-500/10 border border-rose-100 dark:border-rose-500/20 rounded-lg px-3 py-2 text-slate-700 dark:text-slate-300"><span className="text-rose-500 shrink-0 font-bold not-italic">✗</span><span className="not-italic">{err}</span></li>)}</ul>
          </div>
        )}
        {data.next_step && (
          <div className="bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-200 dark:border-indigo-500/30 rounded-xl p-4 flex items-start gap-3">
            <ArrowRight className="h-4 w-4 text-indigo-500 mt-0.5 shrink-0" />
            <div>
              <p className="text-[10px] font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-widest mb-1">Next Step</p>
              <p className="text-sm text-indigo-700 dark:text-indigo-300 leading-relaxed">{data.next_step}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// ─── FULL AI REPORT MODAL (Diagnostic / Mock) ─────────────────────────────────

const FullAIReportModal = ({ report, onClose }: { report: ReportPayload; onClose: () => void }) => {
  const { skill, subScores } = report;
  const cfg = SKILL_CONFIG[skill];
  const feedback       = subScores.feedback as Record<string, any> | null;
  const priorityAction = feedback?.priority_action as string | undefined;
  const fillerWords    = feedback?.filler_words_detected as string[] | undefined;
  const wordCount      = subScores.word_count as number | undefined;
  const subSkillOrder  = skill === "SPEAKING" ? SPEAKING_SUBSKILLS : WRITING_SUBSKILLS;

  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = ""; };
  }, []);

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full sm:max-w-2xl max-h-[92vh] sm:max-h-[88vh] bg-white dark:bg-slate-900 shadow-2xl flex flex-col rounded-t-3xl sm:rounded-2xl overflow-hidden">
        <div className={`${cfg.bg} border-b ${cfg.border} px-6 py-5 flex items-center justify-between shrink-0`}>
          <div className="flex items-center gap-3">
            <div className={`h-10 w-10 rounded-xl flex items-center justify-center border ${cfg.border} ${cfg.bg} ${cfg.color}`}>{cfg.icon}</div>
            <div>
              <h2 className="text-base font-black text-slate-800 dark:text-white">{cfg.label} — Full AI Report</h2>
              {wordCount != null && <p className="text-xs text-slate-500 mt-0.5">{wordCount} words written</p>}
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-black/10 dark:hover:bg-white/10 text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 transition-colors"><X className="h-5 w-5" /></button>
        </div>
        <div className="overflow-y-auto flex-1 px-6 py-5 space-y-4">
          {priorityAction && (
            <div className="bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/30 rounded-2xl p-5">
              <div className="flex items-center gap-2 mb-2"><Target className="h-4 w-4 text-amber-600 dark:text-amber-400 shrink-0" /><p className="text-[10px] font-black text-amber-700 dark:text-amber-400 uppercase tracking-widest">Priority Action</p></div>
              <p className="text-sm font-semibold text-amber-900 dark:text-amber-200 leading-relaxed">{priorityAction}</p>
            </div>
          )}
          {feedback && subSkillOrder.map((key) => {
            const data = feedback[key];
            const scoreKey = SUBSKILL_SCORE_KEY[key];
            const rawScore = scoreKey ? subScores[scoreKey] : undefined;
            const score = rawScore != null ? parseFloat(String(rawScore)) : undefined;
            return <SubSkillCard key={key} subSkillKey={key} data={data} score={score} />;
          })}
          {fillerWords && fillerWords.length > 0 && (
            <div className="bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-2xl p-5">
              <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3 flex items-center gap-1.5"><MessageSquare className="h-3 w-3" /> Filler Words Detected</p>
              <div className="flex flex-wrap gap-2">
                {fillerWords.map((f, i) => <span key={i} className="bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg px-3 py-1.5 text-sm font-semibold text-slate-600 dark:text-slate-300">{f}</span>)}
              </div>
            </div>
          )}
          <div className="h-2" />
        </div>
      </div>
    </div>
  );
};

// ─── SUB-SCORE DISPLAY (Mock / Diagnostic compact) ────────────────────────────

const SubScoreDisplay = ({ subScores, onViewFullReport }: { subScores: Record<string, any>; onViewFullReport?: () => void }) => {
  const namedScoreKeys = Object.keys(SCORE_KEY_LABELS).filter((k) => subScores[k] != null);
  const hasQuestionData = subScores.total_questions != null;
  const simpleFeedback: string | null = (() => {
    if (typeof subScores.content_assessment === "string") return subScores.content_assessment;
    if (typeof subScores.feedback === "string") return subScores.feedback;
    return null;
  })();

  return (
    <div className="space-y-4">
      {namedScoreKeys.length > 0 && (
        <div>
          <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Sub-scores</p>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {namedScoreKeys.map((key) => (
              <div key={key} className="bg-white dark:bg-slate-900 rounded-xl p-3 border border-slate-100 dark:border-slate-800">
                <p className="text-[11px] text-slate-400 font-semibold mb-0.5">{SCORE_KEY_LABELS[key]}</p>
                <p className={`text-xl font-black ${bandColor(Number(subScores[key]))}`}>{Number(subScores[key]).toFixed(1)}</p>
              </div>
            ))}
          </div>
        </div>
      )}
      {hasQuestionData && (
        <div>
          <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Score Breakdown</p>
          <div className="flex flex-wrap gap-2 mb-2">
            <div className="bg-white dark:bg-slate-900 rounded-xl p-3 border border-slate-100 dark:border-slate-800 text-center min-w-[80px]">
              <p className="text-[11px] text-slate-400 font-semibold">Correct</p>
              <p className="text-xl font-black text-slate-800 dark:text-white">{subScores.correct_answers}/{subScores.total_questions}</p>
            </div>
            {subScores.accuracy_percentage != null && (
              <div className="bg-white dark:bg-slate-900 rounded-xl p-3 border border-slate-100 dark:border-slate-800 text-center min-w-[80px]">
                <p className="text-[11px] text-slate-400 font-semibold">Accuracy</p>
                <p className="text-xl font-black text-slate-800 dark:text-white">{Number(subScores.accuracy_percentage).toFixed(0)}%</p>
              </div>
            )}
          </div>
          {subScores.by_question_type && Object.keys(subScores.by_question_type).length > 0 && (
            <div className="flex flex-wrap gap-2">
              {Object.entries(subScores.by_question_type).map(([type, data]: [string, any]) => (
                <span key={type} className="bg-white dark:bg-slate-900 rounded-lg px-3 py-1.5 border border-slate-100 dark:border-slate-800 text-[11px] font-semibold text-slate-600 dark:text-slate-300">
                  {type.toUpperCase()}: {data.correct}/{data.total}
                </span>
              ))}
            </div>
          )}
        </div>
      )}
      {simpleFeedback && !hasRichFeedback({ feedback: subScores.feedback } as any) && (
        <div>
          <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 flex items-center gap-1.5"><MessageSquare className="h-3 w-3" /> AI Feedback</p>
          <p className="text-sm text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-900 rounded-xl p-4 border border-slate-100 dark:border-slate-800 leading-relaxed">{simpleFeedback}</p>
        </div>
      )}
      {hasRichFeedback(subScores) && onViewFullReport && (
        <button onClick={onViewFullReport} className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl border-2 border-indigo-200 dark:border-indigo-500/40 bg-indigo-50 dark:bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 font-bold text-sm hover:bg-indigo-100 dark:hover:bg-indigo-500/20 transition-colors">
          <Sparkles className="h-4 w-4" /> View Full AI Report
        </button>
      )}
    </div>
  );
};

// ─── IA SUB-SKILL ROW ─────────────────────────────────────────────────────────

const IASubSkillRow = ({ score }: { score: SectionScore }) => {
  const [expanded, setExpanded] = useState(false);
  const label    = SUB_SKILL_LABELS[score.sub_skill] ?? score.sub_skill;
  const skillCfg = SKILL_CONFIG[score.skill as SkillType];
  const hasAI    = !!(score.ai_graded && score.ai_feedback);

  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-800 overflow-hidden">
      <button
        onClick={() => hasAI && setExpanded((p) => !p)}
        className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-colors ${hasAI ? "hover:bg-slate-50 dark:hover:bg-slate-800/40 cursor-pointer" : "cursor-default"}`}
      >
        {/* Skill pill */}
        {skillCfg && (
          <span className={`hidden sm:inline-flex items-center gap-1 text-[10px] font-black px-2 py-0.5 rounded-full shrink-0 ${skillCfg.bg} ${skillCfg.color}`}>
            {skillCfg.icon} {skillCfg.label}
          </span>
        )}
        {/* Sub-skill name */}
        <span className="flex-1 text-sm font-semibold text-slate-700 dark:text-slate-200">{label}</span>
        {/* Correct / Total */}
        {score.total > 0 && (
          <span className="text-xs text-slate-400 shrink-0 tabular-nums">{score.correct}/{score.total} correct</span>
        )}
        {/* AI badge */}
        {score.ai_graded && (
          <span className="text-[10px] font-bold bg-violet-100 dark:bg-violet-500/20 text-violet-600 dark:text-violet-400 px-2 py-0.5 rounded-full shrink-0">AI Graded</span>
        )}
        {/* Band */}
        <span className={`text-lg font-black shrink-0 w-10 text-right ${bandColor(score.band)}`}>
          {score.band % 1 === 0 ? score.band.toFixed(1) : score.band}
        </span>
        {/* Expand chevron */}
        {hasAI && (expanded ? <ChevronUp className="h-4 w-4 text-slate-400 shrink-0" /> : <ChevronDown className="h-4 w-4 text-slate-400 shrink-0" />)}
        {!hasAI && <span className="w-4 shrink-0" />}
      </button>

      {expanded && score.ai_feedback && (
        <div className="border-t border-slate-100 dark:border-slate-800 px-4 py-4 bg-slate-50 dark:bg-slate-800/40 space-y-4">
          {score.ai_feedback.rationale && (
            <div>
              <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5">AI Rationale</p>
              <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">{score.ai_feedback.rationale}</p>
            </div>
          )}
          {score.ai_feedback.key_observations && score.ai_feedback.key_observations.length > 0 && (
            <div>
              <p className="text-[10px] font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-widest mb-2">Key Observations</p>
              <ul className="space-y-2">
                {score.ai_feedback.key_observations.map((obs, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-slate-600 dark:text-slate-300">
                    <span className="text-indigo-400 mt-0.5 shrink-0 font-bold">•</span>
                    <span>{obs.replace(/\*\*/g, "")}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// ─── IA SESSION CARD ──────────────────────────────────────────────────────────

const IASessionCard = ({ entry }: { entry: IAEntry }) => {
  const [expanded, setExpanded] = useState(false);
  const scores = entry.scores ?? [];

  // Unique parent skills covered in this session
  const skillsCovered = [...new Set(scores.map((s) => s.skill))] as SkillType[];

  // Average band across all sub-skills (rounded to nearest 0.5)
  const avgBand = scores.length > 0
    ? Math.round((scores.reduce((sum, s) => sum + s.band, 0) / scores.length) * 2) / 2
    : 0;

  const hasAnyAI = scores.some((s) => s.ai_graded && s.ai_feedback);

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">

      {/* ── Collapsed header ── */}
      <button
        onClick={() => setExpanded((p) => !p)}
        className="w-full flex items-center gap-4 p-4 sm:p-5 text-left hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors"
      >
        {/* IA badge */}
        <div className="flex-shrink-0 w-11 h-11 rounded-xl bg-indigo-100 dark:bg-indigo-500/20 flex flex-col items-center justify-center">
          <span className="text-[9px] font-black text-indigo-400 dark:text-indigo-500 uppercase leading-none">IA</span>
          <span className="text-base font-black text-indigo-600 dark:text-indigo-400 leading-tight">#{entry.ia_number}</span>
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2 mb-1">
            <span className="font-bold text-slate-800 dark:text-white text-sm">Internal Assessment #{entry.ia_number}</span>
            <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-700 dark:bg-indigo-500/20 dark:text-indigo-400">
              {scores.length} sub-skill{scores.length !== 1 ? "s" : ""}
            </span>
            {hasAnyAI && (
              <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-violet-100 text-violet-700 dark:bg-violet-500/20 dark:text-violet-400">
                AI Graded
              </span>
            )}
          </div>

          {/* Date + momentum */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-1 text-xs text-slate-400">
              <Clock className="h-3 w-3" />
              {formatIADate(entry.ia_date)}
              {entry.time_submitted_at && (
                <span className="text-slate-300 dark:text-slate-600 mx-0.5">·</span>
              )}
              {entry.time_submitted_at && (
                <span>{new Date(entry.time_submitted_at).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}</span>
              )}
            </div>
            {entry.momentum_awarded != null && (
              <div className="flex items-center gap-1 text-xs font-bold text-amber-600 dark:text-amber-400">
                <Zap className="h-3 w-3 fill-amber-400 text-amber-400" />
                +{entry.momentum_awarded} Momentum
              </div>
            )}
          </div>

          {/* Skill chips */}
          <div className="flex flex-wrap gap-1.5 mt-2">
            {skillsCovered.map((skill) => {
              const cfg = SKILL_CONFIG[skill];
              return (
                <span key={skill} className={`flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full ${cfg.bg} ${cfg.color}`}>
                  {cfg.icon} {cfg.label}
                </span>
              );
            })}
          </div>
        </div>

        {/* Average band */}
        <div className="flex-shrink-0 text-right mr-2">
          {scores.length > 0 ? (
            <>
              <p className={`text-3xl font-black ${bandColor(avgBand)}`}>{avgBand.toFixed(1)}</p>
              <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wide">Avg Band</p>
            </>
          ) : (
            <p className="text-xs text-slate-400">—</p>
          )}
        </div>

        <div className="flex-shrink-0 text-slate-400">
          {expanded ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
        </div>
      </button>

      {/* ── Expanded sub-skills ── */}
      {expanded && (
        <div className="border-t border-slate-100 dark:border-slate-800 p-4 sm:p-5 bg-slate-50/50 dark:bg-slate-800/20">
          {scores.length === 0 ? (
            <p className="text-sm text-slate-400 italic">No detailed breakdown available.</p>
          ) : (
            <>
              {/* Sub-skill header */}
              <div className="hidden sm:flex items-center gap-3 px-4 mb-2 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                <span className="w-24 shrink-0" />
                <span className="flex-1">Sub-Skill</span>
                <span className="shrink-0 w-24 text-right">Score</span>
                <span className="shrink-0 w-20 text-right">Band</span>
                <span className="w-4 shrink-0" />
              </div>
              <div className="space-y-2">
                {scores.map((score, i) => <IASubSkillRow key={i} score={score} />)}
              </div>
              {hasAnyAI && (
                <p className="text-[11px] text-slate-400 mt-3 flex items-center gap-1.5">
                  <ChevronDown className="h-3 w-3" /> Click any AI Graded row to expand the full feedback
                </p>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
};

// ─── MOCK SUB-SKILL ROW ───────────────────────────────────────────────────────

const MockSubSkillRow = ({ score }: { score: MockSubSkillScore }) => {
  const [expanded, setExpanded] = useState(false);
  const label  = SUB_SKILL_LABELS[score.sub_skill] ?? score.sub_skill;
  const hasAI  = !!(score.ai_feedback);

  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-800 overflow-hidden">
      <button
        onClick={() => hasAI && setExpanded((p) => !p)}
        className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-colors ${hasAI ? "hover:bg-slate-50 dark:hover:bg-slate-800/40 cursor-pointer" : "cursor-default"}`}
      >
        <span className="flex-1 text-sm font-semibold text-slate-700 dark:text-slate-200">{label}</span>

        {/* MCQ score */}
        <span className="text-xs text-slate-400 shrink-0 tabular-nums">
          MCQ {score.correct}/{score.total_mcq}
        </span>

        {/* AI band if ai_graded */}
        {score.ai_band != null && (
          <span className="text-[10px] font-bold bg-violet-100 dark:bg-violet-500/20 text-violet-600 dark:text-violet-400 px-2 py-0.5 rounded-full shrink-0 tabular-nums">
            AI {score.ai_band.toFixed(1)}
          </span>
        )}

        {/* Combined band */}
        <span className={`text-lg font-black shrink-0 w-10 text-right ${bandColor(score.band)}`}>
          {score.band % 1 === 0 ? score.band.toFixed(1) : score.band}
        </span>

        {hasAI
          ? (expanded ? <ChevronUp className="h-4 w-4 text-slate-400 shrink-0" /> : <ChevronDown className="h-4 w-4 text-slate-400 shrink-0" />)
          : <span className="w-4 shrink-0" />}
      </button>

      {expanded && score.ai_feedback && (
        <div className="border-t border-slate-100 dark:border-slate-800 px-4 py-4 bg-slate-50 dark:bg-slate-800/40 space-y-4">
          {score.ai_feedback.rationale && (
            <div>
              <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5">AI Rationale</p>
              <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">{score.ai_feedback.rationale}</p>
            </div>
          )}
          {score.ai_feedback.key_observations && score.ai_feedback.key_observations.length > 0 && (
            <div>
              <p className="text-[10px] font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-widest mb-2">Key Observations</p>
              <ul className="space-y-2">
                {score.ai_feedback.key_observations.map((obs, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-slate-600 dark:text-slate-300">
                    <span className="text-indigo-400 mt-0.5 shrink-0 font-bold">•</span>
                    <span>{obs.replace(/\*\*/g, "")}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// ─── MOCK SKILL ROW ───────────────────────────────────────────────────────────

const MockSkillRow = ({ score }: { score: MockSkillScore }) => {
  const [expanded, setExpanded] = useState(false);
  const cfg      = SKILL_CONFIG[score.skill as SkillType];
  const canExpand = score.ai_graded && (score.sub_skill_scores ?? []).length > 0;

  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-800 overflow-hidden">
      <button
        onClick={() => canExpand && setExpanded((p) => !p)}
        className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-colors ${canExpand ? "hover:bg-slate-50 dark:hover:bg-slate-800/40 cursor-pointer" : "cursor-default"}`}
      >
        {/* Skill icon */}
        {cfg && (
          <div className={`h-7 w-7 rounded-lg flex items-center justify-center shrink-0 ${cfg.bg} ${cfg.color}`}>
            {cfg.icon}
          </div>
        )}

        {/* Skill name */}
        <span className="flex-1 text-sm font-semibold text-slate-700 dark:text-slate-200">
          {cfg?.label ?? score.skill}
        </span>

        {/* MCQ score */}
        <span className="text-xs text-slate-400 shrink-0 tabular-nums">{score.correct}/{score.total} correct</span>

        {/* AI badge */}
        {score.ai_graded && (
          <span className="text-[10px] font-bold bg-violet-100 dark:bg-violet-500/20 text-violet-600 dark:text-violet-400 px-2 py-0.5 rounded-full shrink-0">
            AI Graded
          </span>
        )}

        {/* Band */}
        <span className={`text-lg font-black shrink-0 w-10 text-right ${bandColor(score.band)}`}>
          {score.band % 1 === 0 ? score.band.toFixed(1) : score.band}
        </span>

        {canExpand
          ? (expanded ? <ChevronUp className="h-4 w-4 text-slate-400 shrink-0" /> : <ChevronDown className="h-4 w-4 text-slate-400 shrink-0" />)
          : <span className="w-4 shrink-0" />}
      </button>

      {expanded && score.sub_skill_scores && score.sub_skill_scores.length > 0 && (
        <div className="border-t border-slate-100 dark:border-slate-800 p-3 bg-slate-50/60 dark:bg-slate-800/20 space-y-2">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1 mb-1">Sub-skill Breakdown</p>
          {score.sub_skill_scores.map((sub, i) => (
            <MockSubSkillRow key={i} score={sub} />
          ))}
          <p className="text-[11px] text-slate-400 pt-1 flex items-center gap-1.5">
            <ChevronDown className="h-3 w-3" /> Click any sub-skill row to expand AI feedback
          </p>
        </div>
      )}
    </div>
  );
};

// ─── MOCK SESSION CARD ────────────────────────────────────────────────────────

const MockSessionCard = ({ entry }: { entry: MockEntry }) => {
  const [expanded, setExpanded] = useState(false);
  const scores = entry.scores ?? [];

  const attemptLabel = entry.attempt_type === "EARNED" ? "Earned Mock" : "Standard Mock";
  const attemptBadge = entry.attempt_type === "EARNED"
    ? "bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400"
    : "bg-purple-100 text-purple-700 dark:bg-purple-500/20 dark:text-purple-400";

  // Format month_year "YYYY-MM" → "May 2026"
  const monthLabel = (() => {
    const [y, m] = entry.month_year.split("-");
    return new Date(Number(y), Number(m) - 1, 1).toLocaleDateString("en-IN", { month: "long", year: "numeric" });
  })();

  const skillsCovered = scores.map((s) => s.skill as SkillType);
  const displayBand   = entry.real_band_score ?? (
    scores.length > 0
      ? Math.round((scores.reduce((sum, s) => sum + s.band, 0) / scores.length) * 2) / 2
      : 0
  );

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">

      {/* ── Header ── */}
      <button
        onClick={() => setExpanded((p) => !p)}
        className="w-full flex items-center gap-4 p-4 sm:p-5 text-left hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors"
      >
        {/* Mock icon */}
        <div className="flex-shrink-0 w-11 h-11 rounded-xl bg-purple-100 dark:bg-purple-500/20 flex flex-col items-center justify-center">
          <FileText className="h-5 w-5 text-purple-600 dark:text-purple-400" />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2 mb-1">
            <span className="font-bold text-slate-800 dark:text-white text-sm">Mock Test — {monthLabel}</span>
            <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${attemptBadge}`}>{attemptLabel}</span>
            {scores.some((s) => s.ai_graded) && (
              <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-violet-100 text-violet-700 dark:bg-violet-500/20 dark:text-violet-400">
                AI Graded
              </span>
            )}
          </div>

          {/* Date + momentum */}
          <div className="flex flex-wrap items-center gap-3">
            {entry.time_submitted_at && (
              <div className="flex items-center gap-1 text-xs text-slate-400">
                <Clock className="h-3 w-3" />
                {formatDate(entry.time_submitted_at)}
              </div>
            )}
            {entry.momentum_awarded != null && (
              <div className="flex items-center gap-1 text-xs font-bold text-amber-600 dark:text-amber-400">
                <Zap className="h-3 w-3 fill-amber-400 text-amber-400" />
                +{entry.momentum_awarded} Momentum
              </div>
            )}
          </div>

          {/* Skill pills */}
          <div className="flex flex-wrap gap-1.5 mt-2">
            {skillsCovered.map((skill) => {
              const cfg = SKILL_CONFIG[skill];
              return cfg ? (
                <span key={skill} className={`flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full ${cfg.bg} ${cfg.color}`}>
                  {cfg.icon} {cfg.label}
                </span>
              ) : null;
            })}
          </div>
        </div>

        {/* Overall band */}
        <div className="flex-shrink-0 text-right mr-2">
          <p className={`text-3xl font-black ${bandColor(displayBand)}`}>{displayBand.toFixed(1)}</p>
          <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wide">
            {entry.real_band_score != null ? "Real Band" : "Avg Band"}
          </p>
        </div>

        <div className="flex-shrink-0 text-slate-400">
          {expanded ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
        </div>
      </button>

      {/* ── Expanded skill breakdown ── */}
      {expanded && (
        <div className="border-t border-slate-100 dark:border-slate-800 p-4 sm:p-5 bg-slate-50/50 dark:bg-slate-800/20">
          {scores.length === 0 ? (
            <p className="text-sm text-slate-400 italic">No detailed breakdown available.</p>
          ) : (
            <>
              {/* Real band note */}
              {entry.real_band_score != null && (
                <div className={`mb-3 px-4 py-2.5 rounded-xl border flex items-center justify-between ${bandBg(entry.real_band_score)}`}>
                  <span className="text-xs font-bold text-slate-600 dark:text-slate-300">IELTS Overall Band Score</span>
                  <span className={`text-xl font-black ${bandColor(entry.real_band_score)}`}>{entry.real_band_score.toFixed(1)}</span>
                </div>
              )}
              <div className="space-y-2">
                {scores.map((score, i) => <MockSkillRow key={i} score={score} />)}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
};

// ─── LEGACY MOCK ASSESSMENT ROW ───────────────────────────────────────────────

const AssessmentRow = ({ entry, isExpanded, onToggle, onOpenReport }: {
  entry: AssessmentEntry; isExpanded: boolean; onToggle: () => void;
  onOpenReport: (payload: ReportPayload) => void;
}) => {
  const cfg     = SKILL_CONFIG[entry.skill];
  const modeCfg = MODE_CONFIG[entry.mode] ?? { label: entry.mode, badge: "" };

  return (
    <div className={`bg-white dark:bg-slate-900 rounded-2xl border shadow-sm overflow-hidden transition-all duration-200 ${cfg.border}`}>
      <button onClick={onToggle} className="w-full flex items-center gap-4 p-4 sm:p-5 text-left hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
        <div className={`flex-shrink-0 h-10 w-10 rounded-xl flex items-center justify-center ${cfg.bg} ${cfg.color}`}>{cfg.icon}</div>
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-bold text-slate-800 dark:text-white">{cfg.label}</span>
            <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${modeCfg.badge}`}>{modeCfg.label}</span>
          </div>
          <div className="flex items-center gap-1 mt-1 text-xs text-slate-400"><Clock className="h-3 w-3" />{formatDate(entry.created_at)}</div>
        </div>
        <div className="flex-shrink-0 text-right mr-2">
          <p className={`text-3xl font-black ${bandColor(entry.band_score)}`}>{entry.band_score.toFixed(1)}</p>
          <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wide">Band</p>
        </div>
        <div className="flex-shrink-0 text-slate-400">{isExpanded ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}</div>
      </button>
      {isExpanded && (
        <div className={`border-t ${cfg.border} px-4 sm:px-5 pb-5 pt-4 ${cfg.bg}`}>
          {entry.sub_scores && Object.keys(entry.sub_scores).length > 0 ? (
            <SubScoreDisplay
              subScores={entry.sub_scores}
              onViewFullReport={hasRichFeedback(entry.sub_scores) ? () => onOpenReport({ skill: entry.skill, subScores: entry.sub_scores! }) : undefined}
            />
          ) : (
            <p className="text-sm text-slate-400 italic">No detailed breakdown available for this entry.</p>
          )}
        </div>
      )}
    </div>
  );
};

// ─── DIAGNOSTIC REPORT TAB ────────────────────────────────────────────────────

const DiagnosticReportTab = ({ data, onOpenReport }: { data: AssessmentEntry[]; onOpenReport: (p: ReportPayload) => void }) => {
  if (data.length === 0) {
    return (
      <div className="text-center py-16 text-slate-400">
        <Stethoscope className="h-10 w-10 mx-auto mb-3 opacity-40" />
        <p className="font-semibold text-slate-600 dark:text-slate-300">No diagnostic report found</p>
        <p className="text-sm mt-1">Complete your diagnostic assessment to see your baseline scores here.</p>
      </div>
    );
  }

  const bySkill = Object.fromEntries(data.map((e) => [e.skill, e])) as Partial<Record<SkillType, AssessmentEntry>>;

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
        <Clock className="h-4 w-4 shrink-0" />
        <span>Assessed on <span className="font-semibold text-slate-700 dark:text-slate-200">{formatDate(data[0].created_at)}</span></span>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {SKILL_ORDER.map((skill) => {
          const cfg   = SKILL_CONFIG[skill];
          const entry = bySkill[skill];
          if (!entry) {
            return (
              <div key={skill} className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 p-5 opacity-40">
                <div className="flex items-center gap-3">
                  <div className={`h-10 w-10 rounded-xl flex items-center justify-center ${cfg.bg} ${cfg.color}`}>{cfg.icon}</div>
                  <div><p className="font-bold text-slate-800 dark:text-white">{cfg.label}</p><p className="text-xs text-slate-400">Not assessed</p></div>
                </div>
              </div>
            );
          }
          const rich = entry.sub_scores ? hasRichFeedback(entry.sub_scores) : false;
          return (
            <div key={skill} className={`bg-white dark:bg-slate-900 rounded-2xl border ${cfg.border} p-5 flex flex-col`}>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className={`h-10 w-10 rounded-xl flex items-center justify-center ${cfg.bg} ${cfg.color}`}>{cfg.icon}</div>
                  <p className="font-bold text-slate-800 dark:text-white">{cfg.label}</p>
                </div>
                <div className="text-right">
                  <p className={`text-3xl font-black ${bandColor(entry.band_score)}`}>{entry.band_score.toFixed(1)}</p>
                  <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wide">Band</p>
                </div>
              </div>
              {entry.sub_scores && Object.keys(entry.sub_scores).length > 0 && (
                <div className={`pt-4 border-t ${cfg.border} flex-1`}>
                  <SubScoreDisplay subScores={entry.sub_scores} onViewFullReport={rich ? () => onOpenReport({ skill, subScores: entry.sub_scores! }) : undefined} />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

// ─── FILTER CHIP ──────────────────────────────────────────────────────────────

const FilterChip = ({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) => (
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
  const [activeTab, setActiveTab] = useState<"ia" | "mock" | "diagnostic">("ia");
  const [showPremiumModal, setShowPremiumModal]       = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed]   = useState(false);

  // IA history (from IASession)
  const [iaHistory, setIaHistory]           = useState<IAEntry[]>([]);
  const [iaLoading, setIaLoading]           = useState(true);
  const [iaError, setIaError]               = useState(false);

  // Mock sessions (from mock-history endpoint)
  const [mockEntries, setMockEntries]       = useState<MockEntry[]>([]);
  const [mockLoading, setMockLoading]       = useState(true);
  const [mockError, setMockError]           = useState(false);

  // Diagnostic
  const [diagnostic, setDiagnostic]         = useState<AssessmentEntry[]>([]);
  const [diagnosticLoading, setDiagnosticLoading] = useState(true);

  // Filters
  const [filterSkillIA, setFilterSkillIA]   = useState<"ALL" | SkillType>("ALL");
  const [filterSkillMock, setFilterSkillMock] = useState<"ALL" | SkillType>("ALL");

  // Full AI Report modal (Diagnostic / Mock)
  const [activeReport, setActiveReport]     = useState<ReportPayload | null>(null);

  useEffect(() => {
    const fetchIA = async () => {
      try {
        const res = await callBackend(`${BACKEND}/api/student/ia-history`);
        if (res.success) setIaHistory(res.data);
        else setIaError(true);
      } catch { setIaError(true); }
      finally { setIaLoading(false); }
    };

    const fetchMock = async () => {
      try {
        const res = await callBackend(`${BACKEND}/api/student/mock-history`);
        if (res.success) setMockEntries(res.data as MockEntry[]);
        else setMockError(true);
      } catch { setMockError(true); }
      finally { setMockLoading(false); }
    };

    const fetchDiagnostic = async () => {
      try {
        const res = await callBackend(`${BACKEND}/api/student/diagnostic-report`);
        if (res.success) setDiagnostic(res.data);
      } catch { /* silent */ }
      finally { setDiagnosticLoading(false); }
    };

    fetchIA();
    fetchMock();
    fetchDiagnostic();
  }, []);

  // IA: filter by skill — show sessions that have at least one sub-skill of that skill
  const filteredIA = filterSkillIA === "ALL"
    ? iaHistory
    : iaHistory.filter((e) => (e.scores ?? []).some((s) => s.skill === filterSkillIA));

  // Mock: filter by skill — show sessions containing at least one score for that skill
  const filteredMock = filterSkillMock === "ALL"
    ? mockEntries
    : mockEntries.filter((e) => (e.scores ?? []).some((s) => s.skill === filterSkillMock));


  const SKILL_FILTER_OPTS = [
    ["ALL", "All Skills"], ["LISTENING", "Listening"], ["READING", "Reading"],
    ["WRITING", "Writing"], ["SPEAKING", "Speaking"],
  ] as const;

  return (
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-slate-950 transition-colors duration-300">
      <StudentSidebar activeTab="assessment-history" onTabChange={() => {}} isCollapsed={isSidebarCollapsed} toggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)} />

      <div className={`min-h-screen flex flex-col transition-all duration-300 ${isSidebarCollapsed ? "lg:pl-20" : "lg:pl-64"}`}>
        <StudentTopbar onUpgradeClick={() => setShowPremiumModal(true)} />

        <main className="flex-1 p-4 sm:p-6 lg:p-8 space-y-6">

          {/* Header */}
          <div>
            <h1 className="text-2xl font-black text-slate-800 dark:text-white">Assessment History</h1>
            <p className="text-sm text-slate-500 mt-0.5">Track your progress across all assessments</p>
          </div>

          {/* Tabs */}
          <div className="flex gap-1 p-1 bg-slate-100 dark:bg-slate-800/50 rounded-xl w-fit">
            {([
              ["ia",         <ListChecks  className="h-4 w-4" />, "Internal Assessments", iaHistory.length],
              ["mock",       <FileText    className="h-4 w-4" />, "Mock Tests",           mockEntries.length],
              ["diagnostic", <Stethoscope className="h-4 w-4" />, "Diagnostic Report",   diagnostic.length],
            ] as const).map(([tab, icon, label, count]) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab as any)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all ${
                  activeTab === tab
                    ? "bg-white dark:bg-slate-900 text-slate-800 dark:text-white shadow-sm"
                    : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
                }`}
              >
                {icon} {label}
                {count > 0 && (
                  <span className="ml-0.5 text-[10px] font-black bg-indigo-100 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 px-1.5 py-0.5 rounded-full">
                    {count}
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* ── Internal Assessments Tab ────────────────────────────────── */}
          {activeTab === "ia" && (
            <>
              {/* Skill filter */}
              <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 p-4 shadow-sm">
                <div className="flex flex-wrap items-center gap-3">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-slate-500 uppercase tracking-wider mr-1"><Filter className="h-3.5 w-3.5" /> Filter by Skill</div>
                  <div className="flex flex-wrap gap-2">
                    {SKILL_FILTER_OPTS.map(([val, label]) => (
                      <FilterChip key={val} label={label} active={filterSkillIA === val} onClick={() => setFilterSkillIA(val)} />
                    ))}
                  </div>
                </div>
              </div>

              {!iaLoading && !iaError && (
                <p className="text-sm text-slate-500">{filteredIA.length} IA{filteredIA.length !== 1 ? "s" : ""} found</p>
              )}

              {iaLoading ? (
                <div className="flex items-center justify-center py-16 gap-3 text-slate-400"><Loader2 className="h-5 w-5 animate-spin" /><span className="text-sm font-medium">Loading IA history…</span></div>
              ) : iaError ? (
                <div className="flex flex-col items-center py-16 gap-3 text-slate-400"><AlertCircle className="h-8 w-8 text-rose-400" /><p className="text-sm font-semibold text-slate-600 dark:text-slate-300">Failed to load IA history</p><p className="text-xs">Please refresh and try again.</p></div>
              ) : filteredIA.length === 0 ? (
                <div className="text-center py-16 text-slate-400">
                  <BarChart2 className="h-10 w-10 mx-auto mb-3 opacity-40" />
                  <p className="font-semibold text-slate-600 dark:text-slate-300">{iaHistory.length === 0 ? "No completed IAs yet" : "No entries match this filter"}</p>
                  {iaHistory.length === 0 && <p className="text-sm mt-1">Complete an Internal Assessment to see your results here.</p>}
                </div>
              ) : (
                <div className="space-y-3">
                  {filteredIA.map((entry) => <IASessionCard key={entry.id} entry={entry} />)}
                </div>
              )}
            </>
          )}

          {/* ── Mock Tests Tab ───────────────────────────────────────────── */}
          {activeTab === "mock" && (
            <>
              <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 p-4 shadow-sm">
                <div className="flex flex-wrap items-center gap-3">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-slate-500 uppercase tracking-wider mr-1"><Filter className="h-3.5 w-3.5" /> Filter by Skill</div>
                  <div className="flex flex-wrap gap-2">
                    {SKILL_FILTER_OPTS.map(([val, label]) => (
                      <FilterChip key={val} label={label} active={filterSkillMock === val} onClick={() => setFilterSkillMock(val)} />
                    ))}
                  </div>
                </div>
              </div>

              {!mockLoading && !mockError && (
                <p className="text-sm text-slate-500">{filteredMock.length} entr{filteredMock.length !== 1 ? "ies" : "y"} found</p>
              )}

              {mockLoading ? (
                <div className="flex items-center justify-center py-16 gap-3 text-slate-400"><Loader2 className="h-5 w-5 animate-spin" /><span className="text-sm font-medium">Loading mock tests…</span></div>
              ) : mockError ? (
                <div className="flex flex-col items-center py-16 gap-3 text-slate-400"><AlertCircle className="h-8 w-8 text-rose-400" /><p className="text-sm font-semibold text-slate-600 dark:text-slate-300">Failed to load mock tests</p></div>
              ) : filteredMock.length === 0 ? (
                <div className="text-center py-16 text-slate-400">
                  <BarChart2 className="h-10 w-10 mx-auto mb-3 opacity-40" />
                  <p className="font-semibold text-slate-600 dark:text-slate-300">{mockEntries.length === 0 ? "No completed mock tests yet" : "No entries match this filter"}</p>
                  {mockEntries.length === 0 && <p className="text-sm mt-1">Complete a Mock Test to see your full skill breakdown here.</p>}
                </div>
              ) : (
                <div className="space-y-3">
                  {filteredMock.map((entry) => (
                    <MockSessionCard key={entry.id} entry={entry} />
                  ))}
                </div>
              )}
            </>
          )}

          {/* ── Diagnostic Tab ───────────────────────────────────────────── */}
          {activeTab === "diagnostic" && (
            diagnosticLoading ? (
              <div className="flex items-center justify-center py-16 gap-3 text-slate-400"><Loader2 className="h-5 w-5 animate-spin" /><span className="text-sm font-medium">Loading diagnostic report…</span></div>
            ) : (
              <DiagnosticReportTab data={diagnostic} onOpenReport={setActiveReport} />
            )
          )}
        </main>
      </div>

      {activeReport && <FullAIReportModal report={activeReport} onClose={() => setActiveReport(null)} />}
      <PremiumModal isOpen={showPremiumModal} onClose={() => setShowPremiumModal(false)} />
    </div>
  );
};

export default AssessmentHistoryPage;
