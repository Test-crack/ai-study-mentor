import { useState } from "react";
import { StudentSidebar } from "./dashboard/StudentSidebar";
import { StudentTopbar } from "./dashboard/StudentTopbar";
import { PremiumModal } from "@/features/payment/components/PremiumModal";
import {
  ChevronDown,
  ChevronUp,
  Headphones,
  BookOpen,
  PenLine,
  Mic,
  Clock,
  Filter,
  BarChart2,
} from "lucide-react";

// ─── TYPES ────────────────────────────────────────────────────────────────────

type Skill = "Listening" | "Reading" | "Writing" | "Speaking";
type Mode = "Practice" | "Mock Exam";

interface Assessment {
  id: string;
  date: string; // ISO
  skill: Skill;
  mode: Mode;
  bandScore: number;
  duration: number; // minutes
  feedback: string;
  subScores?: { label: string; score: number }[];
}

// ─── MOCK DATA (reverse-chronological) ───────────────────────────────────────

const MOCK_ASSESSMENTS: Assessment[] = [
  {
    id: "a1",
    date: "2026-03-24T09:15:00",
    skill: "Speaking",
    mode: "Practice",
    bandScore: 4.5,
    duration: 12,
    feedback:
      "Fluency improved slightly, but pronunciation of consonant clusters remains inconsistent. Focus on /θ/ and /ð/ sounds. Your vocabulary range is adequate for Band 5 but needs expansion for 6+.",
    subScores: [
      { label: "Fluency", score: 5.0 },
      { label: "Pronunciation", score: 4.0 },
      { label: "Vocabulary", score: 4.5 },
      { label: "Grammar", score: 4.5 },
    ],
  },
  {
    id: "a2",
    date: "2026-03-23T14:30:00",
    skill: "Reading",
    mode: "Mock Exam",
    bandScore: 6.0,
    duration: 60,
    feedback:
      "Good performance on True/False/Not Given but struggled with matching headings. Keyword identification speed is 45% — aim for 70%+. Re-read paragraphs 3 and 7 strategy.",
    subScores: [
      { label: "True/False/NG", score: 7.0 },
      { label: "Match Headings", score: 5.0 },
      { label: "Fill Blanks", score: 6.0 },
      { label: "MCQ", score: 6.0 },
    ],
  },
  {
    id: "a3",
    date: "2026-03-22T11:00:00",
    skill: "Listening",
    mode: "Practice",
    bandScore: 6.5,
    duration: 30,
    feedback:
      "Section 3 and 4 accuracy dropped — these require academic vocabulary. Your note-taking speed is good. Work on predicting answers before the audio plays.",
    subScores: [
      { label: "Section 1", score: 8.0 },
      { label: "Section 2", score: 7.0 },
      { label: "Section 3", score: 5.5 },
      { label: "Section 4", score: 5.5 },
    ],
  },
  {
    id: "a4",
    date: "2026-03-21T16:45:00",
    skill: "Writing",
    mode: "Practice",
    bandScore: 5.5,
    duration: 40,
    feedback:
      "Task 2 essay structure is improving. However, coherence and cohesion need work — overuse of 'However' and 'Moreover'. Lexical resource score pulled down by repetition of 'important' and 'big'.",
    subScores: [
      { label: "Task Achievement", score: 6.0 },
      { label: "Coherence", score: 5.0 },
      { label: "Lexical Resource", score: 5.5 },
      { label: "Grammar", score: 5.5 },
    ],
  },
  {
    id: "a6",
    date: "2026-03-19T13:00:00",
    skill: "Reading",
    mode: "Practice",
    bandScore: 5.5,
    duration: 20,
    feedback:
      "Skimming speed is adequate but scanning is slow. You re-read sentences too often. Practice 'first pass / second pass' technique. Strong on MCQ but weak on sentence completion.",
  },
];

// ─── CONFIG ───────────────────────────────────────────────────────────────────

const SKILL_CONFIG: Record<Skill, { icon: React.ReactNode; color: string; bg: string; border: string }> = {
  Listening: { icon: <Headphones className="h-4 w-4" />, color: "text-sky-600", bg: "bg-sky-50 dark:bg-sky-500/10", border: "border-sky-200 dark:border-sky-500/30" },
  Reading:   { icon: <BookOpen className="h-4 w-4" />,   color: "text-violet-600", bg: "bg-violet-50 dark:bg-violet-500/10", border: "border-violet-200 dark:border-violet-500/30" },
  Writing:   { icon: <PenLine className="h-4 w-4" />,    color: "text-amber-600", bg: "bg-amber-50 dark:bg-amber-500/10", border: "border-amber-200 dark:border-amber-500/30" },
  Speaking:  { icon: <Mic className="h-4 w-4" />,        color: "text-rose-600", bg: "bg-rose-50 dark:bg-rose-500/10", border: "border-rose-200 dark:border-rose-500/30" },
};

const MODE_COLOR: Record<Mode, string> = {
  Practice:   "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400",
  "Mock Exam": "bg-purple-100 text-purple-700 dark:bg-purple-500/20 dark:text-purple-300",
};

const bandColor = (score: number) => {
  if (score >= 7) return "text-emerald-600 dark:text-emerald-400";
  if (score >= 6) return "text-sky-600 dark:text-sky-400";
  if (score >= 5) return "text-amber-600 dark:text-amber-400";
  return "text-rose-600 dark:text-rose-400";
};

const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString("en-IN", {
    day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit",
  });

// ─── MAIN COMPONENT ───────────────────────────────────────────────────────────

const AssessmentHistoryPage = () => {
  const [activeTab, setActiveTab] = useState("history");
  const [showPremiumModal, setShowPremiumModal] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  // Filter state
  const [filterSkill, setFilterSkill] = useState<Skill | "All">("All");
  const [filterMode, setFilterMode] = useState<Mode | "All">("All");

  // Expanded rows
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());

  const toggleExpand = (id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const filtered = MOCK_ASSESSMENTS.filter((a) => {
    if (filterSkill !== "All" && a.skill !== filterSkill) return false;
    if (filterMode !== "All" && a.mode !== filterMode) return false;
    return true;
  });

  return (
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-slate-950 transition-colors duration-300">
      <StudentSidebar
        activeTab='assessment-history'
        onTabChange={setActiveTab}
        isCollapsed={isSidebarCollapsed}
        toggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
      />

      <div className={`min-h-screen flex flex-col transition-all duration-300 ${isSidebarCollapsed ? "lg:pl-20" : "lg:pl-64"}`}>
        <StudentTopbar onUpgradeClick={() => setShowPremiumModal(true)} />

        <main className="flex-1 p-4 sm:p-6 lg:p-8 space-y-6">

          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <h1 className="text-2xl font-black text-slate-800 dark:text-white">Assessment History</h1>
              <p className="text-sm text-slate-500 mt-0.5">
                {filtered.length} assessment{filtered.length !== 1 ? "s" : ""} found
              </p>
            </div>
          </div>

          {/* ── Filter Bar ─────────────────────────────────────────── */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 p-4 shadow-sm">
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-1.5 text-xs font-bold text-slate-500 uppercase tracking-wider mr-1">
                <Filter className="h-3.5 w-3.5" /> Filter by
              </div>

              {/* Skill filter */}
              <div className="flex flex-wrap gap-2">
                {(["All", "Listening", "Reading", "Writing", "Speaking"] as const).map((s) => (
                  <FilterChip
                    key={s}
                    label={s}
                    active={filterSkill === s}
                    onClick={() => setFilterSkill(s)}
                    color={s === "All" ? undefined : SKILL_CONFIG[s as Skill]?.color}
                  />
                ))}
              </div>

              <div className="h-5 w-px bg-slate-200 dark:bg-slate-700 hidden sm:block" />

              {/* Mode filter */}
              <div className="flex flex-wrap gap-2">
                {(["All", "Practice", "Mock Exam"] as const).map((m) => (
                  <FilterChip
                    key={m}
                    label={m}
                    active={filterMode === m}
                    onClick={() => setFilterMode(m)}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* ── Assessment List ─────────────────────────────────────── */}
          <div className="space-y-3">
            {filtered.length === 0 ? (
              <div className="text-center py-16 text-slate-400">
                <BarChart2 className="h-10 w-10 mx-auto mb-3 opacity-40" />
                <p className="font-semibold">No assessments match this filter</p>
              </div>
            ) : (
              filtered.map((assessment) => (
                <AssessmentRow
                  key={assessment.id}
                  assessment={assessment}
                  isExpanded={expandedIds.has(assessment.id)}
                  onToggle={() => toggleExpand(assessment.id)}
                />
              ))
            )}
          </div>

        </main>
      </div>

      <PremiumModal isOpen={showPremiumModal} onClose={() => setShowPremiumModal(false)} />
    </div>
  );
};

// ─── ASSESSMENT ROW ───────────────────────────────────────────────────────────

const AssessmentRow = ({
  assessment,
  isExpanded,
  onToggle,
}: {
  assessment: Assessment;
  isExpanded: boolean;
  onToggle: () => void;
}) => {
  const cfg = SKILL_CONFIG[assessment.skill];

  return (
    <div
      className={`bg-white dark:bg-slate-900 rounded-2xl border shadow-sm overflow-hidden transition-all duration-200 ${cfg.border}`}
    >
      {/* ── Collapsed Row ── */}
      <button
        onClick={onToggle}
        className="w-full flex items-center gap-4 p-4 sm:p-5 text-left hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors"
      >
        {/* Skill icon */}
        <div className={`flex-shrink-0 h-10 w-10 rounded-xl flex items-center justify-center ${cfg.bg} ${cfg.color}`}>
          {cfg.icon}
        </div>

        {/* Main info */}
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-bold text-slate-800 dark:text-white">{assessment.skill}</span>
            <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${MODE_COLOR[assessment.mode]}`}>
              {assessment.mode}
            </span>
          </div>
          <div className="flex flex-wrap items-center gap-3 mt-1 text-xs text-slate-400">
            <span className="flex items-center gap-1">
              <Clock className="h-3 w-3" /> {formatDate(assessment.date)}
            </span>
            <span>{assessment.duration} min</span>
          </div>
        </div>

        {/* Band score */}
        <div className="flex-shrink-0 text-right mr-1">
          <p className={`text-2xl font-black ${bandColor(assessment.bandScore)}`}>
            {assessment.bandScore.toFixed(1)}
          </p>
          <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wide">Band</p>
        </div>

        {/* Expand icon */}
        <div className="flex-shrink-0 text-slate-400">
          {isExpanded ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
        </div>
      </button>

      {/* ── Expanded Panel ── */}
      {isExpanded && (
        <div className={`border-t ${cfg.border} px-4 sm:px-5 pb-5 pt-4 ${cfg.bg}`}>

          {/* Sub-scores */}
          {assessment.subScores && assessment.subScores.length > 0 && (
            <div className="mb-4">
              <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">
                Sub-scores
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {assessment.subScores.map((s) => (
                  <div
                    key={s.label}
                    className="bg-white dark:bg-slate-900 rounded-xl p-3 border border-slate-100 dark:border-slate-800 text-center"
                  >
                    <p className={`text-lg font-black ${bandColor(s.score)}`}>{s.score.toFixed(1)}</p>
                    <p className="text-[10px] text-slate-500 font-semibold mt-0.5">{s.label}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Feedback */}
          <div>
            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">
              AI Feedback
            </p>
            <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed bg-white dark:bg-slate-900 rounded-xl p-4 border border-slate-100 dark:border-slate-800">
              {assessment.feedback}
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

// ─── FILTER CHIP ──────────────────────────────────────────────────────────────

const FilterChip = ({
  label,
  active,
  onClick,
  color,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
  color?: string;
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

export default AssessmentHistoryPage;