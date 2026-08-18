import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { PremiumModal } from "@/features/payment/components/PremiumModal";
import { callBackend } from "@/features/auth/services/authClient";
import {
  ChevronDown, ChevronUp, Headphones, BookOpen, PenLine, Mic,
  Clock, Filter, BarChart2, FileText, Stethoscope, Loader2,
  AlertCircle, MessageSquare, X, CheckCircle2, ArrowRight, Target,
  Sparkles, Zap, ListChecks, Check, TrendingUp,
} from "lucide-react";
import StudentLayout from "./StudentLayout";
import {
  BandOverTimeChart, ChartLegend, AttendanceCard, SubSkillCoverageCard,
  RecordInsightCard, MockProgressionCard, BestBandPerSkillCard,
  ThisMonthMockCard, HowFarCard, AboutReportCard, GaugeBar,
  type BandPoint, type SkillGaugeRow, type DeltaRow,
} from "./assessment-history/widgets";

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
  ia_date: string;
  status: "COMPLETED" | "MISSED";
  time_submitted_at: string | null;
  scores: SectionScore[];
  momentum_awarded: number | null;
  carry_forward_subskills: { skill: string; sub_skill: string }[];
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
  attempt_type: string;
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

const SKILL_CONFIG: Record<SkillType, { label: string; shortLabel: string; icon: React.ReactNode; color: string; bg: string; border: string }> = {
  LISTENING: { label: "Listening", shortLabel: "Listen",  icon: <Headphones className="h-4 w-4" />, color: "text-sky-600",       bg: "bg-sky-50",       border: "border-sky-200" },
  READING:   { label: "Reading",   shortLabel: "Read",    icon: <BookOpen   className="h-4 w-4" />, color: "text-brand-blue-600", bg: "bg-brand-blue-50", border: "border-brand-blue-200" },
  WRITING:   { label: "Writing",   shortLabel: "Write",   icon: <PenLine    className="h-4 w-4" />, color: "text-amber-600",   bg: "bg-amber-50",   border: "border-amber-200" },
  SPEAKING:  { label: "Speaking",  shortLabel: "Speak",   icon: <Mic        className="h-4 w-4" />, color: "text-rose-600",     bg: "bg-rose-50",     border: "border-rose-200" },
};

// Left-edge accent stripe per skill — same "colored spine on a white card"
// convention used by the How It Works chapter cards.
const SKILL_ACCENT_BORDER: Record<SkillType, string> = {
  LISTENING: "border-l-sky-400",
  READING:   "border-l-brand-blue-500",
  WRITING:   "border-l-amber-400",
  SPEAKING:  "border-l-rose-400",
};

const MODE_CONFIG: Record<string, { label: string; badge: string }> = {
  INTERNAL_ASSESSMENT: { label: "Internal Assessment", badge: "bg-brand-teal-100 text-brand-teal-700" },
  MOCK:                { label: "Mock Test",            badge: "bg-brand-blue-100 text-brand-blue-700" },
  DIAGNOSTIC:          { label: "Diagnostic",           badge: "bg-brand-teal-100 text-brand-teal-700" },
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
  fluency:       { label: "Fluency",       color: "text-blue-600",       bg: "bg-blue-50",       border: "border-blue-200",       dot: "bg-blue-500" },
  grammar:       { label: "Grammar",       color: "text-brand-blue-600",   bg: "bg-brand-blue-50",   border: "border-brand-blue-200",   dot: "bg-brand-blue-500" },
  vocabulary:    { label: "Vocabulary",    color: "text-emerald-600", bg: "bg-emerald-50", border: "border-emerald-200", dot: "bg-emerald-500" },
  pronunciation: { label: "Pronunciation", color: "text-rose-600",       bg: "bg-rose-50",       border: "border-rose-200",       dot: "bg-rose-500" },
  coherence:     { label: "Coherence",     color: "text-amber-600",     bg: "bg-amber-50",     border: "border-amber-200",     dot: "bg-amber-500" },
  task_response: { label: "Task Response", color: "text-teal-600",       bg: "bg-teal-50",       border: "border-teal-200",       dot: "bg-teal-500" },
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
  if (band >= 7.5) return "text-emerald-600";
  if (band >= 6.0) return "text-sky-600";
  if (band >= 5.0) return "text-amber-600";
  return "text-rose-600";
};

const bandBg = (band: number) => {
  if (band >= 7.5) return "bg-emerald-50 border-emerald-200";
  if (band >= 6.0) return "bg-sky-50 border-sky-200";
  if (band >= 5.0) return "bg-amber-50 border-amber-200";
  return "bg-rose-50 border-rose-200";
};

// Solid fill for GaugeBar — same thresholds as bandColor/bandBg, just as a bg-* class.
const bandGaugeColor = (band: number) => {
  if (band >= 7.5) return "bg-emerald-500";
  if (band >= 6.0) return "bg-sky-500";
  if (band >= 5.0) return "bg-amber-500";
  return "bg-rose-500";
};

// Counts up from 0 to `value` on mount — used for the hero stat pills so the
// numbers read as something that just landed, not static labels.
const AnimatedNumber = ({ value }: { value: number }) => {
  const [display, setDisplay] = useState(0);
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) { setDisplay(value); return; }
    let raf: number;
    const start = performance.now();
    const duration = 700;
    const tick = (now: number) => {
      const t = Math.min((now - start) / duration, 1);
      setDisplay(Math.round(t * value));
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [value]);
  return <>{display}</>;
};

// "Medal" badge for a band score — a tinted ring instead of bare colored text,
// reused across every card so scores read as the visual anchor of the row.
const BandBadge = ({ band, size = "md" }: { band: number; size?: "sm" | "md" }) => {
  const dims = size === "sm" ? "w-11 h-11 text-base" : "w-14 h-14 sm:w-16 sm:h-16 text-xl sm:text-2xl";
  return (
    <div className={`shrink-0 flex items-center justify-center rounded-2xl border-2 ${bandBg(band)} ${dims}`}>
      <span className={`font-manrope font-black leading-none ${bandColor(band)}`}>{band.toFixed(1)}</span>
    </div>
  );
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

// ─── SUB-SKILL CARD ───────────────────────────────────────────────────────────

const SubSkillCard = ({ subSkillKey, data, score }: { subSkillKey: string; data: any; score?: number }) => {
  const cfg = SUBSKILL_CONFIG[subSkillKey];
  if (!cfg || !data) return null;
  const issues    = (data.observed_issues ?? []) as string[];
  const errors    = (data.error_examples  ?? []) as string[];
  const strengths = (data.strengths       ?? []) as string[];

  return (
    <div className={`rounded-2xl border ${cfg.border} overflow-hidden`}>
      <div className={`${cfg.bg} px-4 sm:px-5 py-3 sm:py-4 flex items-center justify-between gap-3`}>
        <div className="flex items-center gap-2.5 min-w-0">
          <span className={`w-2.5 h-2.5 rounded-full ${cfg.dot} shrink-0`} />
          <h3 className={`font-manrope font-black text-sm sm:text-base ${cfg.color} truncate`}>{cfg.label}</h3>
        </div>
        {score != null && !isNaN(score) && (
          <div className="flex items-baseline gap-1 shrink-0">
            <span className={`font-manrope text-xl sm:text-2xl font-black ${bandColor(score)}`}>{score % 1 === 0 ? score.toFixed(1) : score}</span>
            <span className="text-[10px] text-brand-text-mute font-semibold font-jetbrains uppercase tracking-[0.14em]">Band</span>
          </div>
        )}
      </div>
      <div className="px-4 sm:px-5 py-3 sm:py-4 space-y-4 bg-white">
        {data.score_rationale && (
          <div>
            <p className="text-[10px] font-black text-brand-text-mute font-jetbrains uppercase tracking-[0.16em] mb-1.5">Rationale</p>
            <p className="text-sm text-brand-text-mute leading-relaxed break-words">{data.score_rationale}</p>
          </div>
        )}
        {strengths.length > 0 && (
          <div>
            <p className="text-[10px] font-black text-emerald-600 font-jetbrains uppercase tracking-[0.16em] mb-2 flex items-center gap-1.5"><CheckCircle2 className="h-3 w-3" /> Strengths</p>
            <ul className="space-y-1.5">{strengths.map((s, i) => <li key={i} className="flex items-start gap-2 text-sm text-brand-text"><CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 mt-0.5 shrink-0" /><span className="break-words">{s}</span></li>)}</ul>
          </div>
        )}
        {issues.length > 0 && (
          <div>
            <p className="text-[10px] font-black text-amber-600 font-jetbrains uppercase tracking-[0.16em] mb-2">Observed Issues</p>
            <ul className="space-y-1.5">{issues.map((issue, i) => <li key={i} className="flex items-start gap-2 text-sm text-brand-text"><span className="text-amber-500 mt-0.5 shrink-0 font-bold">•</span><span className="break-words">{issue}</span></li>)}</ul>
          </div>
        )}
        {errors.length > 0 && (
          <div>
            <p className="text-[10px] font-black text-rose-600 font-jetbrains uppercase tracking-[0.16em] mb-2">Error Examples</p>
            <ul className="space-y-1.5">{errors.map((err, i) => <li key={i} className="flex items-start gap-2 sm:gap-2.5 text-xs sm:text-sm font-mono bg-rose-50 border border-rose-100 rounded-lg px-2.5 sm:px-3 py-2 text-brand-text"><span className="text-rose-500 shrink-0 font-bold not-italic">✗</span><span className="not-italic break-words min-w-0">{err}</span></li>)}</ul>
          </div>
        )}
        {data.next_step && (
          <div className="bg-brand-teal-50 border border-brand-teal-200 rounded-xl p-3 sm:p-4 flex items-start gap-3">
            <ArrowRight className="h-4 w-4 text-brand-teal-500 mt-0.5 shrink-0" />
            <div className="min-w-0">
              <p className="text-[10px] font-black text-brand-teal-600 font-jetbrains uppercase tracking-[0.16em] mb-1">Next Step</p>
              <p className="text-sm text-brand-teal-700 leading-relaxed break-words">{data.next_step}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// ─── FULL AI REPORT MODAL ─────────────────────────────────────────────────────

const FullAIReportModal = ({ report, onClose }: { report: ReportPayload; onClose: () => void }) => {
  const { skill, subScores } = report;
  const cfg            = SKILL_CONFIG[skill];
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
      <div className="relative w-full sm:max-w-2xl max-h-[92vh] sm:max-h-[88vh] bg-white shadow-2xl flex flex-col rounded-t-3xl sm:rounded-2xl overflow-hidden">
        <div className={`${cfg.bg} border-b ${cfg.border} px-4 sm:px-6 py-4 sm:py-5 flex items-center justify-between gap-3 shrink-0`}>
          <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
            <div className={`h-9 w-9 sm:h-10 sm:w-10 rounded-xl flex items-center justify-center border ${cfg.border} ${cfg.bg} ${cfg.color} shrink-0`}>{cfg.icon}</div>
            <div className="min-w-0">
              <h2 className="font-manrope text-sm sm:text-base font-black text-brand-text truncate">{cfg.label} — Full AI Report</h2>
              {wordCount != null && <p className="text-xs text-brand-text-mute mt-0.5">{wordCount} words written</p>}
            </div>
          </div>
          <button onClick={onClose} aria-label="Close" className="p-2 rounded-xl hover:bg-black/10 text-brand-text-mute hover:text-brand-text transition-colors shrink-0"><X className="h-5 w-5" /></button>
        </div>
        <div className="overflow-y-auto flex-1 px-4 sm:px-6 py-4 sm:py-5 space-y-4">
          {priorityAction && (
            <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 sm:p-5">
              <div className="flex items-center gap-2 mb-2"><Target className="h-4 w-4 text-amber-600 shrink-0" /><p className="text-[10px] font-black text-amber-700 font-jetbrains uppercase tracking-[0.16em]">Priority Action</p></div>
              <p className="text-sm font-semibold text-amber-900 leading-relaxed break-words">{priorityAction}</p>
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
            <div className="bg-brand-bg-alt border border-brand-line rounded-2xl p-4 sm:p-5">
              <p className="text-[10px] font-black text-brand-text-mute font-jetbrains uppercase tracking-[0.16em] mb-3 flex items-center gap-1.5"><MessageSquare className="h-3 w-3" /> Filler Words Detected</p>
              <div className="flex flex-wrap gap-2">
                {fillerWords.map((f, i) => <span key={i} className="bg-white border border-brand-line rounded-lg px-2.5 sm:px-3 py-1 sm:py-1.5 text-xs sm:text-sm font-semibold text-brand-text-mute">{f}</span>)}
              </div>
            </div>
          )}
          <div className="h-2" />
        </div>
      </div>
    </div>
  );
};

// ─── SUB-SCORE DISPLAY ────────────────────────────────────────────────────────

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
          <p className="text-[10px] font-black text-brand-text-mute font-jetbrains uppercase tracking-[0.16em] mb-2">Sub-scores</p>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {namedScoreKeys.map((key) => (
              <div key={key} className="bg-white rounded-xl p-2.5 sm:p-3 border border-brand-line min-w-0">
                <p className="text-[11px] text-brand-text-mute font-semibold mb-0.5 truncate">{SCORE_KEY_LABELS[key]}</p>
                <p className={`text-lg sm:text-xl font-black ${bandColor(Number(subScores[key]))}`}>{Number(subScores[key]).toFixed(1)}</p>
              </div>
            ))}
          </div>
        </div>
      )}
      {hasQuestionData && (
        <div>
          <p className="text-[10px] font-black text-brand-text-mute font-jetbrains uppercase tracking-[0.16em] mb-2">Score Breakdown</p>
          <div className="flex flex-wrap gap-2 mb-2">
            <div className="bg-white rounded-xl p-2.5 sm:p-3 border border-brand-line text-center flex-1 min-w-[80px] sm:flex-none sm:min-w-[80px]">
              <p className="text-[11px] text-brand-text-mute font-semibold">Correct</p>
              <p className="font-manrope text-lg sm:text-xl font-black text-brand-text">{subScores.correct_answers}/{subScores.total_questions}</p>
            </div>
            {subScores.accuracy_percentage != null && (
              <div className="bg-white rounded-xl p-2.5 sm:p-3 border border-brand-line text-center flex-1 min-w-[80px] sm:flex-none sm:min-w-[80px]">
                <p className="text-[11px] text-brand-text-mute font-semibold">Accuracy</p>
                <p className="font-manrope text-lg sm:text-xl font-black text-brand-text">{Number(subScores.accuracy_percentage).toFixed(0)}%</p>
              </div>
            )}
          </div>
          {subScores.by_question_type && Object.keys(subScores.by_question_type).length > 0 && (
            <div className="flex flex-wrap gap-2">
              {Object.entries(subScores.by_question_type).map(([type, data]: [string, any]) => (
                <span key={type} className="bg-white rounded-lg px-2.5 sm:px-3 py-1 sm:py-1.5 border border-brand-line text-[11px] font-semibold text-brand-text-mute">
                  {type.toUpperCase()}: {data.correct}/{data.total}
                </span>
              ))}
            </div>
          )}
        </div>
      )}
      {simpleFeedback && !hasRichFeedback({ feedback: subScores.feedback } as any) && (
        <div>
          <p className="text-[10px] font-black text-brand-text-mute font-jetbrains uppercase tracking-[0.16em] mb-2 flex items-center gap-1.5"><MessageSquare className="h-3 w-3" /> AI Feedback</p>
          <p className="text-sm text-brand-text bg-white rounded-xl p-3 sm:p-4 border border-brand-line leading-relaxed break-words">{simpleFeedback}</p>
        </div>
      )}
      {hasRichFeedback(subScores) && onViewFullReport && (
        <button onClick={onViewFullReport} className="w-full flex items-center justify-center gap-2 py-2.5 sm:py-3 px-4 rounded-xl border-2 border-brand-teal-200 bg-brand-teal-50 text-brand-teal-700 font-bold text-sm hover:bg-brand-teal-100 transition-colors">
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
    <div className="bg-white rounded-xl border border-brand-line overflow-hidden">
      <button
        onClick={() => hasAI && setExpanded((p) => !p)}
        className={`w-full px-3 sm:px-4 py-3 text-left transition-colors ${hasAI ? "hover:bg-brand-bg-alt cursor-pointer" : "cursor-default"}`}
      >
        {/* Top row: label + band + chevron (always visible) */}
        <div className="flex items-center gap-2 sm:gap-3">
          {skillCfg && (
            <span className={`hidden md:inline-flex items-center gap-1 text-[10px] font-black px-2 py-0.5 rounded-full shrink-0 ${skillCfg.bg} ${skillCfg.color}`}>
              {skillCfg.icon} {skillCfg.label}
            </span>
          )}
          <span className="flex-1 text-sm font-semibold text-brand-text min-w-0 break-words">{label}</span>
          <span className="w-16 sm:w-20 shrink-0 hidden sm:block">
            <GaugeBar value={score.band} colorClass={bandGaugeColor(score.band)} />
          </span>
          <span className={`font-manrope text-base sm:text-lg font-black shrink-0 tabular-nums ${bandColor(score.band)}`}>
            {score.band % 1 === 0 ? score.band.toFixed(1) : score.band}
          </span>
          {hasAI ? (expanded ? <ChevronUp className="h-4 w-4 text-brand-text-mute shrink-0" /> : <ChevronDown className="h-4 w-4 text-brand-text-mute shrink-0" />) : <span className="w-4 shrink-0" />}
        </div>
        {/* Bottom row: secondary info — wraps below on mobile */}
        {(score.total > 0 || score.ai_graded || (skillCfg && true)) && (
          <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 mt-1.5 ml-0 md:ml-0">
            {skillCfg && (
              <span className={`md:hidden inline-flex items-center gap-1 text-[10px] font-black px-1.5 py-0.5 rounded-full shrink-0 ${skillCfg.bg} ${skillCfg.color}`}>
                {skillCfg.icon} {skillCfg.shortLabel}
              </span>
            )}
            {score.total > 0 && (
              <span className="text-[11px] text-brand-text-mute tabular-nums">{score.correct}/{score.total} correct</span>
            )}
            {score.ai_graded && (
              <span className="text-[10px] font-bold bg-brand-blue-100 text-brand-blue-600 px-1.5 py-0.5 rounded-full">AI Graded</span>
            )}
          </div>
        )}
      </button>
      {expanded && score.ai_feedback && (
        <div className="border-t border-brand-line px-3 sm:px-4 py-3 sm:py-4 bg-brand-bg-alt space-y-4">
          {score.ai_feedback.rationale && (
            <div>
              <p className="text-[10px] font-black text-brand-text-mute font-jetbrains uppercase tracking-[0.16em] mb-1.5">AI Rationale</p>
              <p className="text-sm text-brand-text-mute leading-relaxed break-words">{score.ai_feedback.rationale}</p>
            </div>
          )}
          {score.ai_feedback.key_observations && score.ai_feedback.key_observations.length > 0 && (
            <div>
              <p className="text-[10px] font-black text-brand-teal-600 font-jetbrains uppercase tracking-[0.16em] mb-2">Key Observations</p>
              <ul className="space-y-2">
                {score.ai_feedback.key_observations.map((obs, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-brand-text-mute">
                    <span className="text-brand-teal-400 mt-0.5 shrink-0 font-bold">•</span>
                    <span className="break-words min-w-0">{obs.replace(/\*\*/g, "")}</span>
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
  const isMissed = entry.status === "MISSED";
  const scores   = entry.scores ?? [];

  const skillsCovered = isMissed
    ? ([...new Set((entry.carry_forward_subskills ?? []).map((s) => s.skill))] as SkillType[])
    : ([...new Set(scores.map((s) => s.skill))] as SkillType[]);

  const avgBand = scores.length > 0
    ? Math.round((scores.reduce((sum, s) => sum + s.band, 0) / scores.length) * 2) / 2
    : null;

  const hasAnyAI     = scores.some((s) => s.ai_graded && s.ai_feedback);
  const carryForward = entry.carry_forward_subskills ?? [];

  return (
    <div className={`bg-white rounded-2xl border border-l-4 shadow-sm overflow-hidden transition-all duration-200 ${isMissed ? "border-rose-200 border-l-rose-400" : "border-brand-line border-l-brand-teal-500 hover:shadow-md hover:-translate-y-0.5"}`}>
      <button
        onClick={() => !isMissed && setExpanded((p) => !p)}
        className={`w-full flex items-start gap-3 sm:gap-4 p-3 sm:p-4 lg:p-5 text-left transition-colors ${isMissed ? "cursor-default" : "hover:bg-brand-bg-alt cursor-pointer"}`}
      >
        {/* IA number badge */}
        <div className={`flex-shrink-0 w-10 h-10 sm:w-11 sm:h-11 rounded-xl flex flex-col items-center justify-center ${isMissed ? "bg-rose-100" : "bg-brand-teal-100"}`}>
          <span className={`font-jetbrains text-[9px] font-black uppercase tracking-[0.14em] leading-none ${isMissed ? "text-rose-400" : "text-brand-teal-400"}`}>IA</span>
          <span className={`font-manrope text-sm sm:text-base font-black leading-tight ${isMissed ? "text-rose-600" : "text-brand-teal-600"}`}>#{entry.ia_number}</span>
        </div>

        {/* Main content */}
        <div className="flex-1 min-w-0">
          {/* Title row */}
          <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 mb-1">
            <span className="font-manrope font-bold text-brand-text text-sm">
              <span className="hidden sm:inline">Internal Assessment </span>
              <span className="sm:hidden">IA </span>
              #{entry.ia_number}
            </span>
            {isMissed ? (
              <span className="text-[10px] sm:text-[11px] font-bold px-1.5 sm:px-2 py-0.5 rounded-full bg-rose-100 text-rose-700">Missed</span>
            ) : (
              <>
                <span className="text-[10px] sm:text-[11px] font-bold px-1.5 sm:px-2 py-0.5 rounded-full bg-brand-teal-100 text-brand-teal-700">
                  {scores.length} sub-skill{scores.length !== 1 ? "s" : ""}
                </span>
                {hasAnyAI && (
                  <span className="text-[10px] sm:text-[11px] font-bold px-1.5 sm:px-2 py-0.5 rounded-full bg-brand-blue-100 text-brand-blue-700">AI Graded</span>
                )}
              </>
            )}
          </div>
          {/* Meta row */}
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
            <div className="flex items-center gap-1 text-[11px] sm:text-xs text-brand-text-mute">
              <Clock className="h-3 w-3 shrink-0" />
              <span>{formatIADate(entry.ia_date)}</span>
            </div>
            {entry.momentum_awarded != null && (
              <div className={`flex items-center gap-1 text-[11px] sm:text-xs font-bold rounded-full px-2 py-0.5 ${isMissed ? "bg-rose-50 text-rose-600" : "bg-amber-50 text-amber-700"}`}>
                <Zap className={`h-3 w-3 shrink-0 ${isMissed ? "text-rose-400" : "fill-amber-400 text-amber-400"}`} />
                {entry.momentum_awarded > 0 ? "+" : ""}{entry.momentum_awarded} Momentum
              </div>
            )}
          </div>
          {/* Skill chips */}
          <div className="flex flex-wrap gap-1 sm:gap-1.5 mt-2">
            {skillsCovered.map((skill) => {
              const cfg = SKILL_CONFIG[skill];
              if (!cfg) return null;
              return (
                <span key={skill} className={`flex items-center gap-1 text-[10px] font-bold px-1.5 sm:px-2 py-0.5 rounded-full ${cfg.bg} ${cfg.color}`}>
                  {cfg.icon}
                  <span className="hidden xs:inline sm:hidden">{cfg.shortLabel}</span>
                  <span className="hidden sm:inline">{cfg.label}</span>
                </span>
              );
            })}
          </div>
          {/* Carry forward */}
          {isMissed && carryForward.length > 0 && (
            <div className="mt-2 flex flex-wrap items-center gap-1 sm:gap-1.5">
              <span className="text-[10px] text-rose-500 font-semibold w-full sm:w-auto">Will be retried:</span>
              {carryForward.map((s, i) => (
                <span key={i} className="text-[10px] font-bold px-1.5 sm:px-2 py-0.5 rounded-full bg-rose-50 text-rose-600 border border-rose-200">
                  {SUB_SKILL_LABELS[s.sub_skill] ?? s.sub_skill}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Score + chevron column */}
        <div className="flex flex-col items-end gap-1 shrink-0">
          {isMissed ? (
            <>
              <p className="font-manrope text-xl sm:text-2xl font-black text-rose-400">—</p>
              <p className="text-[9px] sm:text-[10px] text-rose-400 font-semibold font-jetbrains uppercase tracking-[0.14em] text-right leading-tight">
                <span className="hidden sm:inline">No submission</span>
                <span className="sm:hidden">No sub.</span>
              </p>
            </>
          ) : avgBand !== null ? (
            <>
              <BandBadge band={avgBand} />
              <p className="text-[9px] sm:text-[10px] text-brand-text-mute font-semibold font-jetbrains uppercase tracking-[0.14em]">Avg Band</p>
            </>
          ) : (
            <p className="text-xs text-brand-text-mute">—</p>
          )}
          {!isMissed && (
            <div className="text-brand-text-mute mt-1">
              {expanded ? <ChevronUp className="h-4 w-4 sm:h-5 sm:w-5" /> : <ChevronDown className="h-4 w-4 sm:h-5 sm:w-5" />}
            </div>
          )}
        </div>
      </button>
      {!isMissed && expanded && (
        <div className="border-t border-brand-line p-3 sm:p-4 lg:p-5 bg-brand-bg-alt/50">
          {scores.length === 0 ? (
            <p className="text-sm text-brand-text-mute italic">No detailed breakdown available.</p>
          ) : (
            <>
              <div className="space-y-2">
                {scores.map((score, i) => <IASubSkillRow key={i} score={score} />)}
              </div>
              {hasAnyAI && (
                <p className="text-[11px] text-brand-text-mute mt-3 flex items-center gap-1.5">
                  <ChevronDown className="h-3 w-3 shrink-0" /> <span>Tap any AI Graded row to expand feedback</span>
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
  const label = SUB_SKILL_LABELS[score.sub_skill] ?? score.sub_skill;
  const hasAI = !!(score.ai_feedback);

  return (
    <div className="bg-white rounded-xl border border-brand-line overflow-hidden">
      <button
        onClick={() => hasAI && setExpanded((p) => !p)}
        className={`w-full px-3 sm:px-4 py-3 text-left transition-colors ${hasAI ? "hover:bg-brand-bg-alt cursor-pointer" : "cursor-default"}`}
      >
        {/* Top row: label + band + chevron */}
        <div className="flex items-center gap-2 sm:gap-3">
          <span className="flex-1 text-sm font-semibold text-brand-text min-w-0 break-words">{label}</span>
          <span className="w-16 sm:w-20 shrink-0 hidden sm:block">
            <GaugeBar value={score.band} colorClass={bandGaugeColor(score.band)} />
          </span>
          <span className={`font-manrope text-base sm:text-lg font-black shrink-0 tabular-nums ${bandColor(score.band)}`}>
            {score.band % 1 === 0 ? score.band.toFixed(1) : score.band}
          </span>
          {hasAI
            ? (expanded ? <ChevronUp className="h-4 w-4 text-brand-text-mute shrink-0" /> : <ChevronDown className="h-4 w-4 text-brand-text-mute shrink-0" />)
            : <span className="w-4 shrink-0" />}
        </div>
        {/* Bottom row: counts + AI band chip */}
        <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 mt-1.5">
          <span className="text-[11px] text-brand-text-mute tabular-nums">MCQ {score.correct}/{score.total_mcq}</span>
          {score.ai_band != null && (
            <span className="text-[10px] font-bold bg-brand-blue-100 text-brand-blue-600 px-1.5 py-0.5 rounded-full tabular-nums">
              AI {score.ai_band.toFixed(1)}
            </span>
          )}
        </div>
      </button>
      {expanded && score.ai_feedback && (
        <div className="border-t border-brand-line px-3 sm:px-4 py-3 sm:py-4 bg-brand-bg-alt space-y-4">
          {score.ai_feedback.rationale && (
            <div>
              <p className="text-[10px] font-black text-brand-text-mute font-jetbrains uppercase tracking-[0.16em] mb-1.5">AI Rationale</p>
              <p className="text-sm text-brand-text-mute leading-relaxed break-words">{score.ai_feedback.rationale}</p>
            </div>
          )}
          {score.ai_feedback.key_observations && score.ai_feedback.key_observations.length > 0 && (
            <div>
              <p className="text-[10px] font-black text-brand-teal-600 font-jetbrains uppercase tracking-[0.16em] mb-2">Key Observations</p>
              <ul className="space-y-2">
                {score.ai_feedback.key_observations.map((obs, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-brand-text-mute">
                    <span className="text-brand-teal-400 mt-0.5 shrink-0 font-bold">•</span>
                    <span className="break-words min-w-0">{obs.replace(/\*\*/g, "")}</span>
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
  const cfg       = SKILL_CONFIG[score.skill as SkillType];
  const canExpand = score.ai_graded && (score.sub_skill_scores ?? []).length > 0;

  return (
    <div className="bg-white rounded-xl border border-brand-line overflow-hidden">
      <button
        onClick={() => canExpand && setExpanded((p) => !p)}
        className={`w-full px-3 sm:px-4 py-3 text-left transition-colors ${canExpand ? "hover:bg-brand-bg-alt cursor-pointer" : "cursor-default"}`}
      >
        {/* Top row: icon + label + band + chevron */}
        <div className="flex items-center gap-2 sm:gap-3">
          {cfg && (
            <div className={`h-7 w-7 rounded-lg flex items-center justify-center shrink-0 ${cfg.bg} ${cfg.color}`}>{cfg.icon}</div>
          )}
          <span className="flex-1 text-sm font-semibold text-brand-text min-w-0 break-words">{cfg?.label ?? score.skill}</span>
          <span className="w-16 sm:w-20 shrink-0 hidden sm:block">
            <GaugeBar value={score.band} colorClass={bandGaugeColor(score.band)} />
          </span>
          <span className={`font-manrope text-base sm:text-lg font-black shrink-0 tabular-nums ${bandColor(score.band)}`}>
            {score.band % 1 === 0 ? score.band.toFixed(1) : score.band}
          </span>
          {canExpand
            ? (expanded ? <ChevronUp className="h-4 w-4 text-brand-text-mute shrink-0" /> : <ChevronDown className="h-4 w-4 text-brand-text-mute shrink-0" />)
            : <span className="w-4 shrink-0" />}
        </div>
        {/* Bottom row: counts + ai chip */}
        <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 mt-1.5 ml-9 sm:ml-10">
          <span className="text-[11px] text-brand-text-mute tabular-nums">{score.correct}/{score.total} correct</span>
          {score.ai_graded && (
            <span className="text-[10px] font-bold bg-brand-blue-100 text-brand-blue-600 px-1.5 py-0.5 rounded-full">AI Graded</span>
          )}
        </div>
      </button>
      {expanded && score.sub_skill_scores && score.sub_skill_scores.length > 0 && (
        <div className="border-t border-brand-line p-2.5 sm:p-3 bg-brand-bg-alt/60 space-y-2">
          <p className="text-[10px] font-black text-brand-text-mute font-jetbrains uppercase tracking-[0.16em] px-1 mb-1">Sub-skill Breakdown</p>
          {score.sub_skill_scores.map((sub, i) => (
            <MockSubSkillRow key={i} score={sub} />
          ))}
          <p className="text-[11px] text-brand-text-mute pt-1 flex items-center gap-1.5">
            <ChevronDown className="h-3 w-3 shrink-0" /> <span>Tap any sub-skill row to expand AI feedback</span>
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
    ? "bg-amber-100 text-amber-700"
    : "bg-brand-blue-100 text-brand-blue-700";

  const monthLabel = (() => {
    const [y, m] = entry.month_year.split("-");
    return new Date(Number(y), Number(m) - 1, 1).toLocaleDateString("en-IN", { month: "long", year: "numeric" });
  })();

  const monthLabelShort = (() => {
    const [y, m] = entry.month_year.split("-");
    return new Date(Number(y), Number(m) - 1, 1).toLocaleDateString("en-IN", { month: "short", year: "numeric" });
  })();

  const skillsCovered = scores.map((s) => s.skill as SkillType);
  const displayBand   = entry.real_band_score ?? (
    scores.length > 0
      ? Math.round((scores.reduce((sum, s) => sum + s.band, 0) / scores.length) * 2) / 2
      : 0
  );

  return (
    <div className="bg-white rounded-2xl border border-brand-line border-l-4 border-l-brand-blue-500 shadow-sm overflow-hidden transition-all duration-200 hover:shadow-md hover:-translate-y-0.5">
      <button
        onClick={() => setExpanded((p) => !p)}
        className="w-full flex items-start gap-3 sm:gap-4 p-3 sm:p-4 lg:p-5 text-left hover:bg-brand-bg-alt transition-colors"
      >
        <div className="flex-shrink-0 w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-brand-blue-100 flex flex-col items-center justify-center">
          <FileText className="h-5 w-5 text-brand-blue-600" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 mb-1">
            <span className="font-manrope font-bold text-brand-text text-sm">
              <span className="hidden sm:inline">Mock Test — {monthLabel}</span>
              <span className="sm:hidden">Mock — {monthLabelShort}</span>
            </span>
            <span className={`text-[10px] sm:text-[11px] font-bold px-1.5 sm:px-2 py-0.5 rounded-full ${attemptBadge}`}>{attemptLabel}</span>
            {scores.some((s) => s.ai_graded) && (
              <span className="text-[10px] sm:text-[11px] font-bold px-1.5 sm:px-2 py-0.5 rounded-full bg-brand-blue-100 text-brand-blue-700">AI Graded</span>
            )}
          </div>
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
            {entry.time_submitted_at && (
              <div className="flex items-center gap-1 text-[11px] sm:text-xs text-brand-text-mute min-w-0">
                <Clock className="h-3 w-3 shrink-0" />
                <span className="truncate">{formatDate(entry.time_submitted_at)}</span>
              </div>
            )}
            {entry.momentum_awarded != null && (
              <div className="flex items-center gap-1 text-[11px] sm:text-xs font-bold rounded-full px-2 py-0.5 bg-amber-50 text-amber-700">
                <Zap className="h-3 w-3 fill-amber-400 text-amber-400 shrink-0" />
                +{entry.momentum_awarded} Momentum
              </div>
            )}
          </div>
          <div className="flex flex-wrap gap-1 sm:gap-1.5 mt-2">
            {skillsCovered.map((skill) => {
              const cfg = SKILL_CONFIG[skill];
              return cfg ? (
                <span key={skill} className={`flex items-center gap-1 text-[10px] font-bold px-1.5 sm:px-2 py-0.5 rounded-full ${cfg.bg} ${cfg.color}`}>
                  {cfg.icon}
                  <span className="hidden xs:inline sm:hidden">{cfg.shortLabel}</span>
                  <span className="hidden sm:inline">{cfg.label}</span>
                </span>
              ) : null;
            })}
          </div>
        </div>
        <div className="flex flex-col items-end gap-1 shrink-0">
          <BandBadge band={displayBand} />
          <p className="text-[9px] sm:text-[10px] text-brand-text-mute font-semibold font-jetbrains uppercase tracking-[0.14em] text-right leading-tight">
            {entry.real_band_score != null ? (
              <>
                <span className="hidden sm:inline">Real Band</span>
                <span className="sm:hidden">Real</span>
              </>
            ) : (
              <>
                <span className="hidden sm:inline">Avg Band</span>
                <span className="sm:hidden">Avg</span>
              </>
            )}
          </p>
          <div className="text-brand-text-mute mt-1">
            {expanded ? <ChevronUp className="h-4 w-4 sm:h-5 sm:w-5" /> : <ChevronDown className="h-4 w-4 sm:h-5 sm:w-5" />}
          </div>
        </div>
      </button>
      {expanded && (
        <div className="border-t border-brand-line p-3 sm:p-4 lg:p-5 bg-brand-bg-alt/50">
          {scores.length === 0 ? (
            <p className="text-sm text-brand-text-mute italic">No detailed breakdown available.</p>
          ) : (
            <>
              {entry.real_band_score != null && (
                <div className={`mb-3 px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl border flex items-center justify-between gap-2 ${bandBg(entry.real_band_score)}`}>
                  <span className="text-[11px] sm:text-xs font-bold text-brand-text-mute leading-tight">
                    <span className="hidden sm:inline">IELTS Overall Band Score</span>
                    <span className="sm:hidden">IELTS Overall</span>
                  </span>
                  <span className={`font-manrope text-lg sm:text-xl font-black shrink-0 ${bandColor(entry.real_band_score)}`}>{entry.real_band_score.toFixed(1)}</span>
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

// ─── LEGACY ASSESSMENT ROW ────────────────────────────────────────────────────

const AssessmentRow = ({ entry, isExpanded, onToggle, onOpenReport }: {
  entry: AssessmentEntry; isExpanded: boolean; onToggle: () => void;
  onOpenReport: (payload: ReportPayload) => void;
}) => {
  const cfg     = SKILL_CONFIG[entry.skill];
  const modeCfg = MODE_CONFIG[entry.mode] ?? { label: entry.mode, badge: "" };

  return (
    <div className={`bg-white rounded-2xl border border-l-4 shadow-sm overflow-hidden transition-all duration-200 hover:shadow-md hover:-translate-y-0.5 ${cfg.border} ${SKILL_ACCENT_BORDER[entry.skill]}`}>
      <button onClick={onToggle} className="w-full flex items-start gap-3 sm:gap-4 p-3 sm:p-4 lg:p-5 text-left hover:bg-brand-bg-alt transition-colors">
        <div className={`flex-shrink-0 h-10 w-10 rounded-xl flex items-center justify-center ${cfg.bg} ${cfg.color}`}>{cfg.icon}</div>
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
            <span className="font-manrope font-bold text-brand-text text-sm sm:text-base">{cfg.label}</span>
            <span className={`text-[10px] sm:text-[11px] font-bold px-1.5 sm:px-2 py-0.5 rounded-full ${modeCfg.badge}`}>{modeCfg.label}</span>
          </div>
          <div className="flex items-center gap-1 mt-1 text-[11px] sm:text-xs text-brand-text-mute min-w-0">
            <Clock className="h-3 w-3 shrink-0" />
            <span className="truncate">{formatDate(entry.created_at)}</span>
          </div>
        </div>
        <div className="flex flex-col items-end shrink-0 gap-1">
          <BandBadge band={entry.band_score} />
          <p className="text-[9px] sm:text-[10px] text-brand-text-mute font-semibold font-jetbrains uppercase tracking-[0.14em]">Band</p>
          <div className="text-brand-text-mute mt-1">{isExpanded ? <ChevronUp className="h-4 w-4 sm:h-5 sm:w-5" /> : <ChevronDown className="h-4 w-4 sm:h-5 sm:w-5" />}</div>
        </div>
      </button>
      {isExpanded && (
        <div className={`border-t ${cfg.border} px-3 sm:px-4 lg:px-5 pb-4 sm:pb-5 pt-3 sm:pt-4 ${cfg.bg}`}>
          {entry.sub_scores && Object.keys(entry.sub_scores).length > 0 ? (
            <SubScoreDisplay
              subScores={entry.sub_scores}
              onViewFullReport={hasRichFeedback(entry.sub_scores) ? () => onOpenReport({ skill: entry.skill, subScores: entry.sub_scores! }) : undefined}
            />
          ) : (
            <p className="text-sm text-brand-text-mute italic">No detailed breakdown available for this entry.</p>
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
      <div className="text-center py-12 sm:py-16 text-brand-text-mute px-4">
        <Stethoscope className="h-10 w-10 mx-auto mb-3 opacity-40" />
        <p className="font-semibold text-brand-text-mute">No diagnostic report found</p>
        <p className="text-sm mt-1">Complete your diagnostic assessment to see your baseline scores here.</p>
      </div>
    );
  }

  const bySkill = Object.fromEntries(data.map((e) => [e.skill, e])) as Partial<Record<SkillType, AssessmentEntry>>;

  return (
    <div className="space-y-4 sm:space-y-5">
      <div className="flex items-center gap-2 text-xs sm:text-sm text-brand-text-mute flex-wrap">
        <Clock className="h-4 w-4 shrink-0" />
        <span>Assessed on <span className="font-semibold text-brand-text">{formatDate(data[0].created_at)}</span></span>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
        {SKILL_ORDER.map((skill) => {
          const cfg   = SKILL_CONFIG[skill];
          const entry = bySkill[skill];
          if (!entry) {
            return (
              <div key={skill} className="bg-white rounded-2xl border border-brand-line p-4 sm:p-5 opacity-40">
                <div className="flex items-center gap-3">
                  <div className={`h-10 w-10 rounded-xl flex items-center justify-center shrink-0 ${cfg.bg} ${cfg.color}`}>{cfg.icon}</div>
                  <div className="min-w-0"><p className="font-manrope font-bold text-brand-text truncate">{cfg.label}</p><p className="text-xs text-brand-text-mute">Not assessed</p></div>
                </div>
              </div>
            );
          }
          const rich = entry.sub_scores ? hasRichFeedback(entry.sub_scores) : false;
          return (
            <div key={skill} className={`bg-white rounded-2xl border border-l-4 ${cfg.border} ${SKILL_ACCENT_BORDER[skill]} p-4 sm:p-5 flex flex-col`}>
              <div className="flex items-center justify-between gap-3 mb-4">
                <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
                  <div className={`h-10 w-10 rounded-xl flex items-center justify-center shrink-0 ${cfg.bg} ${cfg.color}`}>{cfg.icon}</div>
                  <p className="font-manrope font-bold text-brand-text truncate">{cfg.label}</p>
                </div>
                <div className="flex flex-col items-center gap-1 shrink-0">
                  <BandBadge band={entry.band_score} size="sm" />
                  <p className="text-[9px] sm:text-[10px] text-brand-text-mute font-semibold font-jetbrains uppercase tracking-[0.14em]">Band</p>
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

const SectionLabel = ({
  icon,
  text,
}: {
  icon: React.ReactNode;
  text: string;
}) => (
  <p className="text-[10px] font-black text-brand-text-mute font-jetbrains uppercase tracking-[0.16em] flex items-center gap-1.5">
    {icon}
    {text}
  </p>
);

const FilterChip = ({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) => (
  <button
    onClick={onClick}
    className={`px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-full text-[11px] sm:text-xs font-bold transition-all duration-150 border whitespace-nowrap ${
      active
        ? "bg-brand-ink text-white border-brand-ink shadow-sm"
        : "bg-white text-brand-text-mute border-brand-line hover:border-brand-teal-300 hover:text-brand-teal-600"
    }`}
  >
    {label}
  </button>
);

// ─── DERIVED VIEW-MODEL HELPERS ───────────────────────────────────────────────
// Pure functions computing the hero chart / sidebar widgets from data already
// in state — no new backend calls, just new views on the same records.

function avgOf(scores: { band: number }[]): number {
  if (!scores.length) return 0;
  return Math.round((scores.reduce((sum, s) => sum + s.band, 0) / scores.length) * 2) / 2;
}

function getBandOverTime(iaHistory: IAEntry[], mockEntries: MockEntry[]): BandPoint[] {
  const iaPoints = iaHistory
    .filter((e) => e.status === "COMPLETED" && (e.scores ?? []).length > 0)
    .map((e) => ({ date: e.ia_date, label: `IA${e.ia_number}`, band: avgOf(e.scores), type: "assessment" as const }));
  const mockPoints = mockEntries
    .filter((e) => (e.scores ?? []).length > 0 || e.real_band_score != null)
    .map((e) => ({
      date: e.time_submitted_at ?? `${e.month_year}-01`,
      label: "Mock",
      band: e.real_band_score ?? avgOf(e.scores ?? []),
      type: "mock" as const,
    }));
  return [...iaPoints, ...mockPoints]
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .slice(-8)
    .map(({ label, band, type }) => ({ label, band, type }));
}

function getCurrentBand(iaHistory: IAEntry[], mockEntries: MockEntry[]): number | null {
  const points = getBandOverTime(iaHistory, mockEntries);
  return points.length > 0 ? points[points.length - 1].band : null;
}

function getAttendance(iaHistory: IAEntry[]) {
  const total = iaHistory.length;
  const taken = iaHistory.filter((e) => e.status === "COMPLETED").length;
  const pct = total > 0 ? Math.round((taken / total) * 100) : 0;
  const ticks = iaHistory
    .slice()
    .sort((a, b) => new Date(a.ia_date).getTime() - new Date(b.ia_date).getTime())
    .map((e) => e.status === "COMPLETED");
  return { pct, taken, total, ticks };
}

function getRecordInsight(iaHistory: IAEntry[], currentBand: number | null): { message: string; tone: "amber" | "teal" } {
  const sortedDesc = iaHistory.slice().sort((a, b) => new Date(b.ia_date).getTime() - new Date(a.ia_date).getTime());
  let missStreak = 0;
  for (const e of sortedDesc) {
    if (e.status === "MISSED") missStreak++;
    else break;
  }
  if (missStreak >= 2) {
    const lastScored = sortedDesc.find((e) => e.status === "COMPLETED");
    const bandText = currentBand != null ? currentBand.toFixed(1) : "—";
    const sinceText = lastScored ? formatIADate(lastScored.ia_date) : "your last score";
    return {
      message: `You have missed the last ${missStreak} assessments in a row. Your band has been frozen at ${bandText} since ${sinceText} because nothing has re-scored it.`,
      tone: "amber",
    };
  }
  if (missStreak === 1) {
    return { message: "You missed your last assessment. Get back on schedule to keep your band moving.", tone: "amber" };
  }
  return { message: "You're keeping pace with every assessment as it unlocks — that's what keeps your band moving.", tone: "teal" };
}

function getSubSkillCoverage(iaHistory: IAEntry[]): SkillGaugeRow[] {
  const latest: Partial<Record<SkillType, { band: number; sourceLabel: string }>> = {};
  const sortedAsc = iaHistory
    .filter((e) => e.status === "COMPLETED")
    .slice()
    .sort((a, b) => new Date(a.ia_date).getTime() - new Date(b.ia_date).getTime());
  for (const entry of sortedAsc) {
    for (const score of entry.scores ?? []) {
      const skill = score.skill as SkillType;
      if (SKILL_CONFIG[skill]) {
        latest[skill] = { band: score.band, sourceLabel: `IA #${entry.ia_number} · ${formatIADate(entry.ia_date)}` };
      }
    }
  }
  return SKILL_ORDER.map((skill) => ({
    key: skill,
    label: SKILL_CONFIG[skill].label,
    icon: SKILL_CONFIG[skill].icon,
    band: latest[skill]?.band ?? null,
    sourceLabel: latest[skill]?.sourceLabel,
    colorClass: latest[skill] ? bandGaugeColor(latest[skill]!.band) : "bg-slate-200",
  }));
}

function getMockProgression(mockEntries: MockEntry[]) {
  const sorted = mockEntries
    .filter((e) => e.time_submitted_at)
    .slice()
    .sort((a, b) => new Date(a.time_submitted_at!).getTime() - new Date(b.time_submitted_at!).getTime());
  const bandOf = (e: MockEntry) => e.real_band_score ?? avgOf(e.scores ?? []);
  const bands = sorted.map(bandOf);
  const delta = bands.length >= 2 ? bands[bands.length - 1] - bands[0] : 0;

  const bySkill: Record<string, number[]> = {};
  for (const e of sorted) for (const s of e.scores ?? []) (bySkill[s.skill] ??= []).push(s.band);
  const averages = Object.entries(bySkill).map(([skill, arr]) => ({ skill, avg: arr.reduce((a, b) => a + b, 0) / arr.length }));
  averages.sort((a, b) => b.avg - a.avg);
  const best = averages[0];
  const worst = averages[averages.length - 1];

  let narrative = `${sorted.length} sitting${sorted.length !== 1 ? "s" : ""} on record.`;
  if (best && worst && best.skill !== worst.skill) {
    narrative += ` ${SKILL_CONFIG[best.skill as SkillType]?.label ?? best.skill} is carrying the average, ${SKILL_CONFIG[worst.skill as SkillType]?.label ?? worst.skill} is the drag.`;
  }
  return { delta, bands, narrative };
}

function getBestBandPerSkillMock(mockEntries: MockEntry[]): SkillGaugeRow[] {
  const best: Partial<Record<SkillType, number>> = {};
  for (const entry of mockEntries) {
    for (const score of entry.scores ?? []) {
      const skill = score.skill as SkillType;
      if (!SKILL_CONFIG[skill]) continue;
      if (best[skill] == null || score.band > best[skill]!) best[skill] = score.band;
    }
  }
  return SKILL_ORDER.map((skill) => ({
    key: skill,
    label: SKILL_CONFIG[skill].label,
    icon: SKILL_CONFIG[skill].icon,
    band: best[skill] ?? null,
    colorClass: best[skill] != null ? bandGaugeColor(best[skill]!) : "bg-slate-200",
  }));
}

function getThisMonthMockStatus(mockEntries: MockEntry[]) {
  const now = new Date();
  const key = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  const used = mockEntries.some((e) => e.month_year === key);
  const monthLabel = now.toLocaleDateString("en-IN", { month: "long" });
  return { used, monthLabel };
}

function getDiagnosticComparison(diagnostic: AssessmentEntry[], iaHistory: IAEntry[], mockEntries: MockEntry[]): DeltaRow[] {
  const coverage = getSubSkillCoverage(iaHistory);
  const bestMock = getBestBandPerSkillMock(mockEntries);
  const currentBySkill: Partial<Record<SkillType, number>> = {};
  for (const row of coverage) if (row.band != null) currentBySkill[row.key as SkillType] = row.band;
  for (const row of bestMock) if (row.band != null && currentBySkill[row.key as SkillType] == null) currentBySkill[row.key as SkillType] = row.band;

  const rows: DeltaRow[] = [];
  for (const entry of diagnostic) {
    const current = currentBySkill[entry.skill];
    if (current == null) continue;
    rows.push({
      key: entry.skill,
      label: SKILL_CONFIG[entry.skill].label,
      icon: SKILL_CONFIG[entry.skill].icon,
      baseline: entry.band_score,
      current,
      delta: Math.round((current - entry.band_score) * 2) / 2,
    });
  }
  return rows;
}

interface MonthGroup {
  key: string;
  label: string;
  items: IAEntry[];
  scored: number;
  missed: number;
  netMomentum: number;
}

function groupByMonth(entries: IAEntry[]): MonthGroup[] {
  const groups = new Map<string, IAEntry[]>();
  for (const e of entries) {
    const key = e.ia_date.slice(0, 7);
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(e);
  }
  return Array.from(groups.entries())
    .sort((a, b) => (a[0] < b[0] ? 1 : -1))
    .map(([key, items]) => {
      const [y, m] = key.split("-");
      const label = new Date(Number(y), Number(m) - 1, 1)
        .toLocaleDateString("en-IN", { month: "short", year: "numeric" })
        .toUpperCase();
      const scored = items.filter((e) => e.status === "COMPLETED").length;
      const missed = items.filter((e) => e.status === "MISSED").length;
      const netMomentum = items.reduce((sum, e) => sum + (e.momentum_awarded ?? 0), 0);
      return { key, label, items, scored, missed, netMomentum };
    });
}

// ─── MAIN COMPONENT ───────────────────────────────────────────────────────────

const AssessmentHistoryPage = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<"ia" | "mock" | "diagnostic">("ia");
  const [showPremiumModal, setShowPremiumModal] = useState(false);
  const [hideMissed, setHideMissed] = useState(false);

  const [iaHistory, setIaHistory]   = useState<IAEntry[]>([]);
  const [iaLoading, setIaLoading]   = useState(true);
  const [iaError, setIaError]       = useState(false);

  const [mockEntries, setMockEntries]   = useState<MockEntry[]>([]);
  const [mockLoading, setMockLoading]   = useState(true);
  const [mockError, setMockError]       = useState(false);

  const [diagnostic, setDiagnostic]               = useState<AssessmentEntry[]>([]);
  const [diagnosticLoading, setDiagnosticLoading] = useState(true);

  const [filterSkillIA, setFilterSkillIA]     = useState<"ALL" | SkillType>("ALL");
  const [filterSkillMock, setFilterSkillMock] = useState<"ALL" | SkillType>("ALL");
  const [activeReport, setActiveReport]       = useState<ReportPayload | null>(null);

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

  const filteredIA = (filterSkillIA === "ALL"
    ? iaHistory
    : iaHistory.filter((e) => (e.scores ?? []).some((s) => s.skill === filterSkillIA))
  ).filter((e) => !hideMissed || e.status !== "MISSED");

  const currentBand = getCurrentBand(iaHistory, mockEntries);
  const bandOverTime = getBandOverTime(iaHistory, mockEntries);
  const missedCount = iaHistory.filter((e) => e.status === "MISSED").length;
  const monthGroups = groupByMonth(filteredIA);
  const netPtsThisFilter = filteredIA.reduce((sum, e) => sum + (e.momentum_awarded ?? 0), 0);

  const attendance = getAttendance(iaHistory);
  const subSkillCoverage = getSubSkillCoverage(iaHistory);
  const recordInsight = getRecordInsight(iaHistory, currentBand);

  const mockProgression = getMockProgression(mockEntries);
  const bestBandPerSkillMock = getBestBandPerSkillMock(mockEntries);
  const thisMonthMock = getThisMonthMockStatus(mockEntries);

  const diagnosticComparison = getDiagnosticComparison(diagnostic, iaHistory, mockEntries);

  const filteredMock = filterSkillMock === "ALL"
    ? mockEntries
    : mockEntries.filter((e) => (e.scores ?? []).some((s) => s.skill === filterSkillMock));

  const SKILL_FILTER_OPTS: ReadonlyArray<readonly ["ALL" | SkillType, string]> = [
    ["ALL",       "All Skills"],
    ["LISTENING", "Listening"],
    ["READING",   "Reading"],
    ["WRITING",   "Writing"],
    ["SPEAKING",  "Speaking"],
  ] as const;

  const attendanceInsight = missedCount > 0
    ? `${missedCount} miss${missedCount !== 1 ? "es" : ""} on record. Each missed IA costs momentum and leaves that cycle's band un-updated.`
    : "No misses on record — every assessment window has been used.";

  const HERO_CONTENT: Record<typeof activeTab, { title: string; description: string }> = {
    ia: {
      title: `${iaHistory.length} assessment${iaHistory.length !== 1 ? "s" : ""}, ${iaHistory.length - missedCount} scored`,
      description: "Assessments run every third day. Scored ones move your band; missed ones cost momentum and leave a gap in the record.",
    },
    mock: {
      title: `${mockEntries.length} full sitting${mockEntries.length !== 1 ? "s" : ""} on record`,
      description: "Every mock is graded under official IELTS timing, so these bands are the closest thing to a real result you have.",
    },
    diagnostic: {
      title: "Where you started",
      description: "Your one-time diagnostic, taken before any practice. It is the line every band since is measured from.",
    },
  };
  const heroContent = HERO_CONTENT[activeTab];

  return (
    <>
      <StudentLayout
        activeTab="assessment-history"
        mainClassName="flex-1 p-3 sm:p-4 md:p-6 lg:p-8"
      >
        <div className="space-y-4 sm:space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
        {/* Header — dark ink summary card, same family as the How It Works hero.
            Headline/description swap per tab; the four stat boxes and the
            band-over-time chart are shared across all three. */}
        <div className="relative overflow-hidden rounded-3xl bg-brand-ink p-5 sm:p-7 grid grid-cols-1 lg:grid-cols-[1.1fr_1fr] gap-6">
          <div className="absolute -top-16 -right-10 w-56 h-56 rounded-full bg-brand-mint/10 blur-3xl pointer-events-none" />
          <div className="absolute -bottom-20 -left-14 w-48 h-48 rounded-full bg-brand-blue-500/10 blur-3xl pointer-events-none" />

          <div className="relative">
            <div className="flex items-center gap-2 mb-3">
              <span className="w-4 h-px bg-brand-mint" />
              <span className="text-[11px] font-bold uppercase tracking-widest text-brand-mint">
                Every score on record
              </span>
            </div>
            <h1 className="font-manrope text-xl sm:text-2xl font-black text-white tracking-tight mb-1.5">
              {heroContent.title}
            </h1>
            <p className="text-xs sm:text-sm text-white/60 max-w-md mb-5 leading-relaxed">
              {heroContent.description}
            </p>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <div className="rounded-lg bg-white/[0.04] border border-white/5 px-3 py-2.5">
                <p className="text-[9px] font-bold uppercase tracking-wide text-white/40 mb-1">Assessments</p>
                <p className="text-lg font-black text-white"><AnimatedNumber value={iaHistory.length} /></p>
              </div>
              <div className="rounded-lg bg-white/[0.04] border border-white/5 px-3 py-2.5">
                <p className="text-[9px] font-bold uppercase tracking-wide text-white/40 mb-1">Mocks taken</p>
                <p className="text-lg font-black text-white"><AnimatedNumber value={mockEntries.length} /></p>
              </div>
              <div className="rounded-lg bg-white/[0.04] border border-white/5 px-3 py-2.5">
                <p className="text-[9px] font-bold uppercase tracking-wide text-white/40 mb-1">Current band</p>
                <p className="text-lg font-black text-white">{currentBand != null ? currentBand.toFixed(1) : "—"}</p>
              </div>
              <div className="rounded-lg bg-white/[0.04] border border-white/5 px-3 py-2.5">
                <p className="text-[9px] font-bold uppercase tracking-wide text-white/40 mb-1">Missed</p>
                <p className={`text-lg font-black ${missedCount > 0 ? "text-rose-400" : "text-white"}`}>
                  <AnimatedNumber value={missedCount} />
                </p>
              </div>
            </div>
          </div>

          <div className="relative flex flex-col min-h-[160px]">
            <div className="flex items-center justify-between mb-2">
              <p className="text-[10px] font-bold uppercase tracking-widest text-white/40">
                Band over time · last {bandOverTime.length} scored
              </p>
              <ChartLegend />
            </div>
            <div className="flex-1">
              <BandOverTimeChart points={bandOverTime} />
            </div>
          </div>
        </div>

        {/* Tabs — full-width on mobile with horizontal scroll fallback */}
        <div className="flex gap-1 p-1 bg-brand-bg-alt rounded-xl w-full sm:w-fit overflow-x-auto no-scrollbar">
          {([
            ["ia",         <ListChecks  className="h-4 w-4 shrink-0" />, "Internal Assessments", "IAs",       iaHistory.length],
            ["mock",       <FileText    className="h-4 w-4 shrink-0" />, "Mock Tests",           "Mocks",     mockEntries.length],
            ["diagnostic", <Stethoscope className="h-4 w-4 shrink-0" />, "Diagnostic Report",   "Diagnostic", diagnostic.length],
          ] as const).map(([tab, icon, label, shortLabel, count]) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab as any)}
              className={`flex items-center justify-center gap-1.5 sm:gap-2 px-2.5 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-bold transition-all whitespace-nowrap flex-1 sm:flex-none ${
                activeTab === tab
                  ? "bg-brand-ink text-white shadow-sm"
                  : "text-brand-text-mute hover:text-brand-text"
              }`}
            >
              {icon}
              <span className="hidden sm:inline">{label}</span>
              <span className="sm:hidden">{shortLabel}</span>
              {count > 0 && (
                <span className={`ml-0.5 text-[10px] font-black px-1.5 py-0.5 rounded-full shrink-0 ${
                  activeTab === tab ? "bg-brand-mint/20 text-brand-mint" : "bg-brand-teal-100 text-brand-teal-600"
                }`}>
                  {count}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* ── Internal Assessments Tab ── */}
        {activeTab === "ia" && (
          <>
            <div className="bg-white rounded-2xl border border-brand-line p-3 sm:p-4 shadow-sm">
              <div className="flex flex-col sm:flex-row sm:flex-wrap sm:items-center gap-2 sm:gap-3">
                <div className="flex items-center gap-1.5 text-[11px] sm:text-xs font-bold text-brand-text-mute font-jetbrains uppercase tracking-[0.14em] sm:mr-1">
                  <Filter className="h-3.5 w-3.5 shrink-0" /> Filter by Skill
                </div>
                <div className="flex flex-wrap gap-1.5 sm:gap-2">
                  {SKILL_FILTER_OPTS.map(([val, label]) => (
                    <FilterChip
                      key={val}
                      label={label}
                      active={filterSkillIA === val}
                      onClick={() => setFilterSkillIA(val)}
                    />
                  ))}
                </div>
                <button
                  onClick={() => setHideMissed((v) => !v)}
                  className={`flex items-center gap-1.5 px-2.5 py-1 sm:py-1.5 rounded-full text-[11px] sm:text-xs font-bold border transition-all duration-150 sm:ml-auto ${
                    hideMissed
                      ? "bg-brand-teal-50 border-brand-teal-300 text-brand-teal-700"
                      : "bg-white border-brand-line text-brand-text-mute hover:border-brand-teal-300"
                  }`}
                >
                  <span className={`w-3.5 h-3.5 rounded-sm border flex items-center justify-center shrink-0 ${hideMissed ? "bg-brand-teal-500 border-brand-teal-500" : "border-brand-line"}`}>
                    {hideMissed && <Check className="w-2.5 h-2.5 text-white" />}
                  </span>
                  Hide missed
                </button>
              </div>
            </div>

            {iaLoading ? (
              <div className="flex items-center justify-center py-12 sm:py-16 gap-3 text-brand-text-mute"><Loader2 className="h-5 w-5 animate-spin" /><span className="text-sm font-medium">Loading IA history…</span></div>
            ) : iaError ? (
              <div className="flex flex-col items-center py-12 sm:py-16 gap-3 text-brand-text-mute px-4 text-center"><AlertCircle className="h-8 w-8 text-rose-400" /><p className="text-sm font-semibold text-brand-text-mute">Failed to load IA history</p><p className="text-xs">Please refresh and try again.</p></div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-4 sm:gap-6">
                <div className="space-y-4 sm:space-y-5 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-xs sm:text-sm text-brand-text-mute">
                      {filteredIA.length} assessment{filteredIA.length !== 1 ? "s" : ""} shown
                    </p>
                    {netPtsThisFilter !== 0 && (
                      <span className={`text-xs font-black ${netPtsThisFilter > 0 ? "text-emerald-600" : "text-rose-600"}`}>
                        {netPtsThisFilter > 0 ? "+" : ""}{netPtsThisFilter} PTS
                      </span>
                    )}
                  </div>

                  {filteredIA.length === 0 ? (
                    <div className="text-center py-12 sm:py-16 text-brand-text-mute px-4">
                      <BarChart2 className="h-10 w-10 mx-auto mb-3 opacity-40" />
                      <p className="font-semibold text-brand-text-mute">{iaHistory.length === 0 ? "No completed IAs yet" : "No entries match this filter"}</p>
                      {iaHistory.length === 0 && <p className="text-sm mt-1">Complete an Internal Assessment to see your results here.</p>}
                    </div>
                  ) : (
                    <div className="space-y-5 sm:space-y-6">
                      {monthGroups.map((group) => (
                        <div key={group.key} className="space-y-2.5 sm:space-y-3">
                          <div className="flex items-center justify-between px-1">
                            <p className="text-[10px] font-black text-brand-text-mute font-jetbrains uppercase tracking-[0.14em]">
                              {group.label}
                              <span className="text-brand-text-mute/70 font-semibold normal-case ml-2">
                                {group.scored} scored{group.missed > 0 ? ` · ${group.missed} missed` : ""}
                              </span>
                            </p>
                            {group.netMomentum !== 0 && (
                              <span className={`text-[10px] font-black ${group.netMomentum > 0 ? "text-emerald-600" : "text-rose-600"}`}>
                                {group.netMomentum > 0 ? "+" : ""}{group.netMomentum} PTS
                              </span>
                            )}
                          </div>
                          {group.items.map((entry) => <IASessionCard key={entry.id} entry={entry} />)}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="space-y-4">
                  <AttendanceCard pct={attendance.pct} taken={attendance.taken} total={attendance.total} ticks={attendance.ticks} insight={attendanceInsight} />
                  <SubSkillCoverageCard rows={subSkillCoverage} />
                  <RecordInsightCard
                    title="What the record says"
                    message={recordInsight.message}
                    tone={recordInsight.tone}
                    ctaLabel="Next assessment"
                    onCta={() => navigate("/student/internal")}
                  />
                </div>
              </div>
            )}
          </>
        )}

        {/* ── Mock Tests Tab ── */}
        {activeTab === "mock" && (
          <>
            <div className="bg-white rounded-2xl border border-brand-line p-3 sm:p-4 shadow-sm">
              <div className="flex flex-col sm:flex-row sm:flex-wrap sm:items-center gap-2 sm:gap-3">
                <div className="flex items-center gap-1.5 text-[11px] sm:text-xs font-bold text-brand-text-mute font-jetbrains uppercase tracking-[0.14em] sm:mr-1">
                  <Filter className="h-3.5 w-3.5 shrink-0" /> Filter by Skill
                </div>
                <div className="flex flex-wrap gap-1.5 sm:gap-2">
                  {SKILL_FILTER_OPTS.map(([val, label]) => (
                    <FilterChip key={val} label={label} active={filterSkillMock === val} onClick={() => setFilterSkillMock(val)} />
                  ))}
                </div>
              </div>
            </div>

            {mockLoading ? (
              <div className="flex items-center justify-center py-12 sm:py-16 gap-3 text-brand-text-mute"><Loader2 className="h-5 w-5 animate-spin" /><span className="text-sm font-medium">Loading mock tests…</span></div>
            ) : mockError ? (
              <div className="flex flex-col items-center py-12 sm:py-16 gap-3 text-brand-text-mute px-4 text-center"><AlertCircle className="h-8 w-8 text-rose-400" /><p className="text-sm font-semibold text-brand-text-mute">Failed to load mock tests</p></div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-4 sm:gap-6">
                <div className="space-y-2.5 sm:space-y-3 min-w-0">
                  <p className="text-xs sm:text-sm text-brand-text-mute">{filteredMock.length} sitting{filteredMock.length !== 1 ? "s" : ""} found</p>
                  {filteredMock.length === 0 ? (
                    <div className="text-center py-12 sm:py-16 text-brand-text-mute px-4">
                      <BarChart2 className="h-10 w-10 mx-auto mb-3 opacity-40" />
                      <p className="font-semibold text-brand-text-mute">{mockEntries.length === 0 ? "No completed mock tests yet" : "No entries match this filter"}</p>
                      {mockEntries.length === 0 && <p className="text-sm mt-1">Complete a Mock Test to see your full skill breakdown here.</p>}
                    </div>
                  ) : (
                    filteredMock.map((entry) => <MockSessionCard key={entry.id} entry={entry} />)
                  )}
                </div>

                <div className="space-y-4">
                  <MockProgressionCard delta={mockProgression.delta} bands={mockProgression.bands} narrative={mockProgression.narrative} />
                  <BestBandPerSkillCard rows={bestBandPerSkillMock} />
                  <ThisMonthMockCard used={thisMonthMock.used} monthLabel={thisMonthMock.monthLabel} onStart={() => navigate("/student/mock")} />
                </div>
              </div>
            )}
          </>
        )}

        {/* ── Diagnostic Tab ── */}
        {activeTab === "diagnostic" && (
          diagnosticLoading ? (
            <div className="flex items-center justify-center py-12 sm:py-16 gap-3 text-brand-text-mute"><Loader2 className="h-5 w-5 animate-spin" /><span className="text-sm font-medium">Loading diagnostic report…</span></div>
          ) : diagnostic.length === 0 ? (
            <DiagnosticReportTab data={diagnostic} onOpenReport={setActiveReport} />
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-4 sm:gap-6">
              <div className="min-w-0">
                <DiagnosticReportTab data={diagnostic} onOpenReport={setActiveReport} />
              </div>
              <div className="space-y-4">
                {diagnosticComparison.length > 0 && <HowFarCard rows={diagnosticComparison} />}
                <AboutReportCard />
              </div>
            </div>
          )
        )}
        </div>
      </StudentLayout>

      {activeReport && <FullAIReportModal report={activeReport} onClose={() => setActiveReport(null)} />}
      <PremiumModal isOpen={showPremiumModal} onClose={() => setShowPremiumModal(false)} />
    </>
  );
};

export default AssessmentHistoryPage;