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
  Zap,
  CheckCircle2,
  PlayCircle,
  MessageSquare,
  Target,
} from "lucide-react";

// ─── TYPES ────────────────────────────────────────────────────────────────────

type Skill = "Listening" | "Reading" | "Writing" | "Speaking";
type DrillType = "Audio Response" | "Paragraph Repair";

interface DrillSession {
  id: string;
  date: string; // ISO
  skill: Skill;
  subSkill: string;
  drillType: DrillType;
  momentumEarned: number;
  totalPrompts: number;
  promptFeedback: string[];
  videoWatched: boolean;
  applyDrillCompleted: boolean;
  reflection?: string;
}

// ─── MOCK DATA ────────────────────────────────────────────────────────────────

const MOCK_SESSIONS: DrillSession[] = [
  {
    id: "d1",
    date: "2026-03-24T09:15:00",
    skill: "Speaking",
    subSkill: "Pronunciation",
    drillType: "Audio Response",
    momentumEarned: 27,
    totalPrompts: 5,
    promptFeedback: [
      "Good attempt, but watch your syllable stress on 'development'.",
      "Clear intonation — try to maintain a steadier pace.",
      "Great use of linking words here.",
      "A bit hesitant; practice speaking without pausing mid-sentence.",
      "Excellent pronunciation of the target vocabulary.",
    ],
    videoWatched: true,
    applyDrillCompleted: true,
    reflection: "I will focus on my syllable stress when using multi-syllable academic words.",
  },
  {
    id: "d2",
    date: "2026-03-23T14:30:00",
    skill: "Writing",
    subSkill: "Coherence & Cohesion",
    drillType: "Paragraph Repair",
    momentumEarned: 22,
    totalPrompts: 5,
    promptFeedback: [
      "Correctly identified the missing transition — 'Furthermore' fits well here.",
      "Overuse of 'However'; try 'On the other hand' for variety.",
      "Good paragraph structure; topic sentence is strong.",
      "The concluding sentence doesn't echo the main idea — revise.",
      "Excellent use of 'as a result' in context.",
    ],
    videoWatched: true,
    applyDrillCompleted: false,
  },
  {
    id: "d3",
    date: "2026-03-22T11:00:00",
    skill: "Listening",
    subSkill: "Note-taking Speed",
    drillType: "Audio Response",
    momentumEarned: 25,
    totalPrompts: 5,
    promptFeedback: [
      "Captured the main point accurately.",
      "Missed a key detail in the second half of the audio.",
      "Good use of abbreviations for speed.",
      "Slight misinterpretation of the speaker's intent in prompt 4.",
      "Strong summary — all key facts included.",
    ],
    videoWatched: true,
    applyDrillCompleted: true,
    reflection: "I will use shorthand symbols to keep pace with the audio.",
  },
  {
    id: "d4",
    date: "2026-03-21T16:45:00",
    skill: "Speaking",
    subSkill: "Fluency",
    drillType: "Audio Response",
    momentumEarned: 18,
    totalPrompts: 5,
    promptFeedback: [
      "Too many filler words ('um', 'like') — practice pausing silently instead.",
      "Pace was good in the first 30 seconds but slowed towards the end.",
      "Natural rhythm in this response — keep it up.",
      "Rushed the final sentence; slow down slightly.",
      "Overall delivery improving; fewer self-corrections than last session.",
    ],
    videoWatched: false,
    applyDrillCompleted: false,
  },
  {
    id: "d5",
    date: "2026-03-19T13:00:00",
    skill: "Reading",
    subSkill: "Skimming & Scanning",
    drillType: "Paragraph Repair",
    momentumEarned: 20,
    totalPrompts: 5,
    promptFeedback: [
      "Correctly placed the topic sentence at the start.",
      "Linking device choice was appropriate.",
      "Missed the contrast signal — 'Although' was needed, not 'Because'.",
      "Good repair of the concluding sentence.",
      "Strong performance overall — only one linking error.",
    ],
    videoWatched: true,
    applyDrillCompleted: true,
    reflection: "I will look for contrast signals before choosing a linking word.",
  },
];

// ─── CONFIG ───────────────────────────────────────────────────────────────────

type SkillConfigEntry = {
  icon: React.ReactNode;
  color: string;
  bg: string;
  border: string;
};

const SKILL_CONFIG: Record<Skill, SkillConfigEntry> = {
  Listening: {
    icon: <Headphones className="h-4 w-4" />,
    color: "text-sky-600",
    bg: "bg-sky-50 dark:bg-sky-500/10",
    border: "border-sky-200 dark:border-sky-500/30",
  },
  Reading: {
    icon: <BookOpen className="h-4 w-4" />,
    color: "text-violet-600",
    bg: "bg-violet-50 dark:bg-violet-500/10",
    border: "border-violet-200 dark:border-violet-500/30",
  },
  Writing: {
    icon: <PenLine className="h-4 w-4" />,
    color: "text-amber-600",
    bg: "bg-amber-50 dark:bg-amber-500/10",
    border: "border-amber-200 dark:border-amber-500/30",
  },
  Speaking: {
    icon: <Mic className="h-4 w-4" />,
    color: "text-rose-600",
    bg: "bg-rose-50 dark:bg-rose-500/10",
    border: "border-rose-200 dark:border-rose-500/30",
  },
};

const DRILL_TYPE_COLOR: Record<DrillType, string> = {
  "Audio Response":
    "bg-rose-100 text-rose-700 dark:bg-rose-500/20 dark:text-rose-400",
  "Paragraph Repair":
    "bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400",
};

const momentumColor = (pts: number) => {
  if (pts >= 26) return "text-emerald-600 dark:text-emerald-400";
  if (pts >= 20) return "text-sky-600 dark:text-sky-400";
  if (pts >= 14) return "text-amber-600 dark:text-amber-400";
  return "text-rose-600 dark:text-rose-400";
};

const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

// ─── MAIN COMPONENT ───────────────────────────────────────────────────────────

const AssessmentHistoryPage = () => {
  const [activeTab, setActiveTab] = useState("history");
  const [showPremiumModal, setShowPremiumModal] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  const [filterSkill, setFilterSkill] = useState<Skill | "All">("All");
  const [filterDrillType, setFilterDrillType] = useState<DrillType | "All">("All");

  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());

  const toggleExpand = (id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const filtered = MOCK_SESSIONS.filter((s) => {
    if (filterSkill !== "All" && s.skill !== filterSkill) return false;
    if (filterDrillType !== "All" && s.drillType !== filterDrillType) return false;
    return true;
  });

  const totalMomentum = filtered.reduce((sum, s) => sum + s.momentumEarned, 0);

  return (
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-slate-950 transition-colors duration-300">
      <StudentSidebar
        activeTab="assessment-history"
        onTabChange={setActiveTab}
        isCollapsed={isSidebarCollapsed}
        toggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
      />

      <div
        className={`min-h-screen flex flex-col transition-all duration-300 ${
          isSidebarCollapsed ? "lg:pl-20" : "lg:pl-64"
        }`}
      >
        <StudentTopbar onUpgradeClick={() => setShowPremiumModal(true)} />

        <main className="flex-1 p-4 sm:p-6 lg:p-8 space-y-6">

          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <h1 className="text-2xl font-black text-slate-800 dark:text-white">
                Drill History
              </h1>
              <p className="text-sm text-slate-500 mt-0.5">
                {filtered.length} session{filtered.length !== 1 ? "s" : ""} found
              </p>
            </div>

            {/* Momentum summary pill */}
            {filtered.length > 0 && (
              <div className="flex items-center gap-2 bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/30 rounded-xl px-4 py-2 self-start sm:self-auto">
                <Zap className="h-4 w-4 text-amber-500 fill-amber-500" />
                <span className="text-sm font-bold text-amber-700 dark:text-amber-400">
                  {totalMomentum} pts in view
                </span>
              </div>
            )}
          </div>

          {/* ── Filter Bar ────────────────────────────────────────── */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 p-4 shadow-sm">
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-1.5 text-xs font-bold text-slate-500 uppercase tracking-wider mr-1">
                <Filter className="h-3.5 w-3.5" /> Filter by
              </div>

              {/* Skill filter */}
              <div className="flex flex-wrap gap-2">
                {(["All", "Listening", "Reading", "Writing", "Speaking"] as const).map(
                  (s) => (
                    <FilterChip
                      key={s}
                      label={s}
                      active={filterSkill === s}
                      onClick={() => setFilterSkill(s)}
                      color={
                        s === "All"
                          ? undefined
                          : SKILL_CONFIG[s as Skill]?.color
                      }
                    />
                  )
                )}
              </div>

              <div className="h-5 w-px bg-slate-200 dark:bg-slate-700 hidden sm:block" />

              {/* Drill type filter */}
              <div className="flex flex-wrap gap-2">
                {(["All", "Audio Response", "Paragraph Repair"] as const).map((t) => (
                  <FilterChip
                    key={t}
                    label={t}
                    active={filterDrillType === t}
                    onClick={() => setFilterDrillType(t)}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* ── Session List ───────────────────────────────────────── */}
          <div className="space-y-3">
            {filtered.length === 0 ? (
              <div className="text-center py-16 text-slate-400">
                <BarChart2 className="h-10 w-10 mx-auto mb-3 opacity-40" />
                <p className="font-semibold">No sessions match this filter</p>
              </div>
            ) : (
              filtered.map((session) => (
                <DrillSessionRow
                  key={session.id}
                  session={session}
                  isExpanded={expandedIds.has(session.id)}
                  onToggle={() => toggleExpand(session.id)}
                />
              ))
            )}
          </div>
        </main>
      </div>

      <PremiumModal
        isOpen={showPremiumModal}
        onClose={() => setShowPremiumModal(false)}
      />
    </div>
  );
};

// ─── SESSION ROW ──────────────────────────────────────────────────────────────

const DrillSessionRow = ({
  session,
  isExpanded,
  onToggle,
}: {
  session: DrillSession;
  isExpanded: boolean;
  onToggle: () => void;
}) => {
  const cfg = SKILL_CONFIG[session.skill];

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
        <div
          className={`flex-shrink-0 h-10 w-10 rounded-xl flex items-center justify-center ${cfg.bg} ${cfg.color}`}
        >
          {cfg.icon}
        </div>

        {/* Main info */}
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-bold text-slate-800 dark:text-white">
              {session.skill}
            </span>
            <span className="text-slate-400 dark:text-slate-500 text-sm">·</span>
            <span className="text-sm font-semibold text-slate-600 dark:text-slate-300">
              {session.subSkill}
            </span>
            <span
              className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
                DRILL_TYPE_COLOR[session.drillType]
              }`}
            >
              {session.drillType}
            </span>
          </div>
          <div className="flex flex-wrap items-center gap-3 mt-1 text-xs text-slate-400">
            <span className="flex items-center gap-1">
              <Clock className="h-3 w-3" /> {formatDate(session.date)}
            </span>
            <span className="flex items-center gap-1">
              <Target className="h-3 w-3" /> {session.totalPrompts} prompts
            </span>
          </div>
        </div>

        {/* Status badges */}
        <div className="flex-shrink-0 hidden sm:flex flex-col items-end gap-1 mr-1">
          <StatusBadge done={session.videoWatched} label="Video" icon={<PlayCircle className="h-3 w-3" />} />
          <StatusBadge done={session.applyDrillCompleted} label="Apply drill" icon={<CheckCircle2 className="h-3 w-3" />} />
        </div>

        {/* Momentum score */}
        <div className="flex-shrink-0 text-right mr-1">
          <p
            className={`text-2xl font-black flex items-center gap-1 ${momentumColor(
              session.momentumEarned
            )}`}
          >
            <Zap className="h-5 w-5 fill-current" />
            {session.momentumEarned}
          </p>
          <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wide">
            pts earned
          </p>
        </div>

        {/* Expand icon */}
        <div className="flex-shrink-0 text-slate-400">
          {isExpanded ? (
            <ChevronUp className="h-5 w-5" />
          ) : (
            <ChevronDown className="h-5 w-5" />
          )}
        </div>
      </button>

      {/* ── Expanded Panel ── */}
      {isExpanded && (
        <div
          className={`border-t ${cfg.border} px-4 sm:px-5 pb-5 pt-4 ${cfg.bg} space-y-4`}
        >
          {/* Mobile status badges */}
          <div className="flex gap-2 sm:hidden">
            <StatusBadge done={session.videoWatched} label="Video watched" icon={<PlayCircle className="h-3 w-3" />} />
            <StatusBadge done={session.applyDrillCompleted} label="Apply drill done" icon={<CheckCircle2 className="h-3 w-3" />} />
          </div>

          {/* Per-prompt feedback */}
          <div>
            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 flex items-center gap-1.5">
              <MessageSquare className="h-3 w-3" /> Prompt Feedback
            </p>
            <div className="space-y-2">
              {session.promptFeedback.map((text, i) => (
                <div
                  key={i}
                  className="flex gap-3 text-sm text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-900 rounded-xl p-3.5 border border-slate-100 dark:border-slate-800"
                >
                  <span className="font-bold text-indigo-500 shrink-0 text-xs mt-0.5">
                    Q{i + 1}
                  </span>
                  <p className="leading-relaxed">{text}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Reflection */}
          {session.reflection && (
            <div>
              <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">
                Your Reflection
              </p>
              <p className="text-sm text-slate-700 dark:text-slate-300 italic bg-white dark:bg-slate-900 rounded-xl p-4 border border-slate-100 dark:border-slate-800 leading-relaxed">
                "{session.reflection}"
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// ─── STATUS BADGE ─────────────────────────────────────────────────────────────

const StatusBadge = ({
  done,
  label,
  icon,
}: {
  done: boolean;
  label: string;
  icon: React.ReactNode;
}) => (
  <span
    className={`inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full ${
      done
        ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400"
        : "bg-slate-100 text-slate-400 dark:bg-slate-800 dark:text-slate-500"
    }`}
  >
    {icon}
    {label}
  </span>
);

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