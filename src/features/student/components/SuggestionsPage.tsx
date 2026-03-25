import { useState } from "react";
import { StudentSidebar } from "./dashboard/StudentSidebar";
import { StudentTopbar } from "./dashboard/StudentTopbar";
import { PremiumModal } from "@/features/payment/components/PremiumModal";
import {
  Headphones,
  BookOpen,
  PenLine,
  Mic,
  Clock,
  CheckCircle2,
  Circle,
  PlayCircle,
  FileText,
  Dumbbell,
  Video,
  Lightbulb,
  Filter,
  Sparkles,
} from "lucide-react";

// ─── TYPES ────────────────────────────────────────────────────────────────────

type Skill = "Listening" | "Reading" | "Writing" | "Speaking";
type ResourceType = "Video" | "Exercise" | "Article" | "Drill" | "Mock";

interface Suggestion {
  id: string;
  resourceTitle: string;
  resourceType: ResourceType;
  skill: Skill;
  weakness: string;
  timeEstimate: number; // minutes
  completed: boolean;
  priority: "High" | "Medium" | "Low";
}

// ─── MOCK DATA ────────────────────────────────────────────────────────────────

const INITIAL_SUGGESTIONS: Suggestion[] = [
  {
    id: "s1",
    resourceTitle: "Consonant Clusters: /str/, /spr/, /skr/ Pronunciation Drill",
    resourceType: "Drill",
    skill: "Speaking",
    weakness: "Pronunciation sub-score: 4.0",
    timeEstimate: 10,
    completed: false,
    priority: "High",
  },
  {
    id: "s2",
    resourceTitle: "Matching Headings Strategy — Step-by-Step Walkthrough",
    resourceType: "Video",
    skill: "Reading",
    weakness: "Matching Headings accuracy: 5.0",
    timeEstimate: 15,
    completed: false,
    priority: "High",
  },
  {
    id: "s3",
    resourceTitle: "IELTS Writing Task 2 — Cohesion & Linking Words Practice",
    resourceType: "Exercise",
    skill: "Writing",
    weakness: "Coherence & Cohesion score: 5.0",
    timeEstimate: 20,
    completed: false,
    priority: "Medium",
  },
  {
    id: "s4",
    resourceTitle: "Academic Listening — Sections 3 & 4 Vocabulary Builder",
    resourceType: "Article",
    skill: "Listening",
    weakness: "Sections 3–4 accuracy drop",
    timeEstimate: 12,
    completed: false,
    priority: "Medium",
  },
  {
    id: "s5",
    resourceTitle: "Fluency Booster: 2-Minute Monologue Practice (Part 2 Cue Cards)",
    resourceType: "Mock",
    skill: "Speaking",
    weakness: "Fluency score: 4.5 — frequent pauses",
    timeEstimate: 8,
    completed: false,
    priority: "Low",
  },
];

// ─── CONFIG ───────────────────────────────────────────────────────────────────

const SKILL_CONFIG: Record<Skill, { icon: React.ReactNode; color: string; bg: string; border: string }> = {
  Listening: { icon: <Headphones className="h-4 w-4" />, color: "text-sky-600",    bg: "bg-sky-50 dark:bg-sky-500/10",       border: "border-sky-200 dark:border-sky-500/30" },
  Reading:   { icon: <BookOpen className="h-4 w-4" />,   color: "text-violet-600", bg: "bg-violet-50 dark:bg-violet-500/10", border: "border-violet-200 dark:border-violet-500/30" },
  Writing:   { icon: <PenLine className="h-4 w-4" />,    color: "text-amber-600",  bg: "bg-amber-50 dark:bg-amber-500/10",   border: "border-amber-200 dark:border-amber-500/30" },
  Speaking:  { icon: <Mic className="h-4 w-4" />,        color: "text-rose-600",   bg: "bg-rose-50 dark:bg-rose-500/10",     border: "border-rose-200 dark:border-rose-500/30" },
};

const RESOURCE_CONFIG: Record<ResourceType, { icon: React.ReactNode; color: string; bg: string }> = {
  Video:    { icon: <Video className="h-3.5 w-3.5" />,      color: "text-indigo-700 dark:text-indigo-300",  bg: "bg-indigo-100 dark:bg-indigo-500/20" },
  Exercise: { icon: <Dumbbell className="h-3.5 w-3.5" />,   color: "text-emerald-700 dark:text-emerald-300", bg: "bg-emerald-100 dark:bg-emerald-500/20" },
  Article:  { icon: <FileText className="h-3.5 w-3.5" />,   color: "text-slate-700 dark:text-slate-300",    bg: "bg-slate-100 dark:bg-slate-700" },
  Drill:    { icon: <PlayCircle className="h-3.5 w-3.5" />, color: "text-rose-700 dark:text-rose-300",      bg: "bg-rose-100 dark:bg-rose-500/20" },
  Mock:     { icon: <FileText className="h-3.5 w-3.5" />,   color: "text-purple-700 dark:text-purple-300",  bg: "bg-purple-100 dark:bg-purple-500/20" },
};

const PRIORITY_CONFIG = {
  High:   { label: "High Priority",   color: "text-rose-600 dark:text-rose-400",   bg: "bg-rose-50 dark:bg-rose-500/10",     border: "border-rose-200 dark:border-rose-500/25",   dot: "bg-rose-500" },
  Medium: { label: "Medium Priority", color: "text-amber-600 dark:text-amber-400", bg: "bg-amber-50 dark:bg-amber-500/10",   border: "border-amber-200 dark:border-amber-500/25", dot: "bg-amber-500" },
  Low:    { label: "Low Priority",    color: "text-slate-500 dark:text-slate-400", bg: "bg-slate-50 dark:bg-slate-800",      border: "border-slate-200 dark:border-slate-700",    dot: "bg-slate-400" },
};

// ─── MAIN COMPONENT ───────────────────────────────────────────────────────────

const SuggestionsPage = () => {
  const [activeTab, setActiveTab] = useState("suggestions");
  const [showPremiumModal, setShowPremiumModal] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [suggestions, setSuggestions] = useState<Suggestion[]>(INITIAL_SUGGESTIONS);
  const [filterSkill, setFilterSkill] = useState<Skill | "All">("All");

  const toggleComplete = (id: string) => {
    setSuggestions((prev) =>
      prev.map((s) => (s.id === id ? { ...s, completed: !s.completed } : s))
    );
  };

  const filtered = suggestions.filter((s) =>
    filterSkill === "All" ? true : s.skill === filterSkill
  );

  const completedCount = suggestions.filter((s) => s.completed).length;
  const totalCount = suggestions.length;

  return (
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-slate-950 transition-colors duration-300">
      <StudentSidebar
        activeTab='SuggestionPage'
        onTabChange={setActiveTab}
        isCollapsed={isSidebarCollapsed}
        toggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
      />

      <div className={`min-h-screen flex flex-col transition-all duration-300 ${isSidebarCollapsed ? "lg:pl-20" : "lg:pl-64"}`}>
        <StudentTopbar onUpgradeClick={() => setShowPremiumModal(true)} />

        <main className="flex-1 p-4 sm:p-6 lg:p-8 space-y-6">

          {/* ── Header ─────────────────────────────────────────────── */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <Sparkles className="h-6 w-6 text-indigo-500" />
                <h1 className="text-2xl font-black text-slate-800 dark:text-white">Your Precision Plan</h1>
              </div>
              <p className="text-sm text-slate-500 mt-0.5">
                AI-generated tasks targeting your exact weaknesses
              </p>
            </div>

            {/* Progress pill */}
            <div className="flex items-center gap-3 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl px-4 py-3 shadow-sm">
              <div className="relative h-10 w-10">
                <svg className="rotate-[-90deg]" width="40" height="40">
                  <circle cx="20" cy="20" r="15" fill="none" stroke="#e2e8f0" strokeWidth="4" />
                  <circle
                    cx="20" cy="20" r="15" fill="none" stroke="#6366f1" strokeWidth="4"
                    strokeDasharray={`${2 * Math.PI * 15}`}
                    strokeDashoffset={`${2 * Math.PI * 15 * (1 - completedCount / totalCount)}`}
                    strokeLinecap="round"
                    className="transition-all duration-700 ease-out"
                  />
                </svg>
                <span className="absolute inset-0 flex items-center justify-center text-[10px] font-black text-indigo-600">
                  {completedCount}/{totalCount}
                </span>
              </div>
              <div>
                <p className="text-xs font-black text-slate-700 dark:text-slate-200">Tasks Done</p>
                <p className="text-[11px] text-slate-400">
                  {completedCount === totalCount ? "All complete 🎉" : `${totalCount - completedCount} remaining`}
                </p>
              </div>
            </div>
          </div>

          {/* ── Filter Bar ─────────────────────────────────────────── */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 p-4 shadow-sm">
            <div className="flex flex-wrap items-center gap-2">
              <div className="flex items-center gap-1.5 text-xs font-bold text-slate-500 uppercase tracking-wider mr-1">
                <Filter className="h-3.5 w-3.5" /> Skill
              </div>
              {(["All", "Listening", "Reading", "Writing", "Speaking"] as const).map((s) => (
                <FilterChip
                  key={s}
                  label={s}
                  active={filterSkill === s}
                  onClick={() => setFilterSkill(s)}
                />
              ))}
            </div>
          </div>

          {/* ── Suggestion Cards ────────────────────────────────────── */}
          <div className="space-y-4">
            {filtered.length === 0 ? (
              <div className="text-center py-16 text-slate-400">
                <Lightbulb className="h-10 w-10 mx-auto mb-3 opacity-40" />
                <p className="font-semibold">No suggestions for this filter</p>
              </div>
            ) : (
              filtered.map((suggestion) => (
                <SuggestionCard
                  key={suggestion.id}
                  suggestion={suggestion}
                  onToggleComplete={() => toggleComplete(suggestion.id)}
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

// ─── SUGGESTION CARD ──────────────────────────────────────────────────────────

const SuggestionCard = ({
  suggestion,
  onToggleComplete,
}: {
  suggestion: Suggestion;
  onToggleComplete: () => void;
}) => {
  const skillCfg    = SKILL_CONFIG[suggestion.skill];
  const resourceCfg = RESOURCE_CONFIG[suggestion.resourceType];
  const priorityCfg = PRIORITY_CONFIG[suggestion.priority];

  return (
    <div
      className={`relative bg-white dark:bg-slate-900 rounded-2xl border shadow-sm transition-all duration-300 overflow-hidden
        ${suggestion.completed
          ? "opacity-60 border-slate-200 dark:border-slate-700"
          : `${priorityCfg.border}`
        }`}
    >
      {/* Priority accent bar */}
      {!suggestion.completed && (
        <div className={`absolute left-0 top-0 bottom-0 w-1 rounded-l-2xl ${priorityCfg.dot}`} />
      )}

      <div className="flex items-start gap-4 p-5 pl-6">

        {/* Skill icon */}
        <div className={`flex-shrink-0 mt-0.5 h-10 w-10 rounded-xl flex items-center justify-center ${skillCfg.bg} ${skillCfg.color}`}>
          {skillCfg.icon}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">

          {/* Badges row */}
          <div className="flex flex-wrap items-center gap-2 mb-2">
            {/* Resource type badge */}
            <span className={`inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full ${resourceCfg.bg} ${resourceCfg.color}`}>
              {resourceCfg.icon} {suggestion.resourceType}
            </span>

            {/* Skill badge */}
            <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${skillCfg.bg} ${skillCfg.color}`}>
              {suggestion.skill}
            </span>

            {/* Priority badge */}
            <span className={`inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full ${priorityCfg.bg} ${priorityCfg.color}`}>
              <span className={`h-1.5 w-1.5 rounded-full ${priorityCfg.dot}`} />
              {priorityCfg.label}
            </span>
          </div>

          {/* Title */}
          <p className={`font-bold text-slate-800 dark:text-white leading-snug ${suggestion.completed ? "line-through text-slate-400 dark:text-slate-500" : ""}`}>
            {suggestion.resourceTitle}
          </p>

          {/* Weakness label */}
          <div className="flex items-center gap-1.5 mt-2">
            <Lightbulb className="h-3.5 w-3.5 text-amber-500 flex-shrink-0" />
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Targets: <span className="font-semibold text-slate-600 dark:text-slate-300">{suggestion.weakness}</span>
            </p>
          </div>

          {/* Time estimate */}
          <div className="flex items-center gap-1.5 mt-1.5">
            <Clock className="h-3.5 w-3.5 text-slate-400 flex-shrink-0" />
            <p className="text-xs text-slate-400">{suggestion.timeEstimate} min estimated</p>
          </div>
        </div>

        {/* Mark Complete button */}
        <button
          onClick={onToggleComplete}
          className={`flex-shrink-0 flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all duration-200 border
            ${suggestion.completed
              ? "bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/30"
              : "bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-indigo-50 hover:text-indigo-600 hover:border-indigo-200 dark:hover:bg-indigo-500/10 dark:hover:text-indigo-400"
            }`}
        >
          {suggestion.completed
            ? <><CheckCircle2 className="h-4 w-4" /> Done</>
            : <><Circle className="h-4 w-4" /> Mark complete</>
          }
        </button>

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

export default SuggestionsPage;