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
  GraduationCap,
  Trophy,
  TrendingUp,
  TrendingDown,
  Minus,
  AlertCircle,
  Brain,
} from "lucide-react";

// ─── TYPES ────────────────────────────────────────────────────────────────────

type Skill = "Listening" | "Reading" | "Writing" | "Speaking";
type SessionType = "drill" | "internal" | "mock";

interface DrillSession {
  id: string;
  type: "drill";
  date: string;
  skill: Skill;
  subSkill: string;
  drillType: "Audio Response" | "Paragraph Repair";
  momentumEarned: number;
  totalPrompts: number;
  promptFeedback: string[];
  videoWatched: boolean;
  applyDrillCompleted: boolean;
  reflection?: string;
}

interface CriterionScore {
  name: string;
  score: number;
  feedback: string;
}

interface SkillResult {
  skill: Skill;
  previousBand: number;
  newBand: number;
  delta: number;
  criteria: CriterionScore[];
}

interface InternalSession {
  id: string;
  type: "internal";
  date: string;
  momentumEarned: number;
  results: SkillResult[];
  priorityAction: string;
  weakestSkill: Skill;
}

interface MockSession {
  id: string;
  type: "mock";
  date: string;
  overallBand: number;
  skillBands: Record<Skill, number>;
  duration: string;
  criteriaBreakdown: {
    skill: Skill;
    criteria: CriterionScore[];
  };
  priorityAction: string;
}

type AnySession = DrillSession | InternalSession | MockSession;

// ─── MOCK DATA ────────────────────────────────────────────────────────────────

const MOCK_SESSIONS: AnySession[] = [
  // ── Mock Tests ──────────────────────────────────────────────────────────────
  {
    id: "m1",
    type: "mock",
    date: "2026-04-15T09:00:00",
    overallBand: 6.5,
    skillBands: { Listening: 7.0, Reading: 6.5, Writing: 6.0, Speaking: 6.5 },
    duration: "2h 44m",
    criteriaBreakdown: {
      skill: "Writing",
      criteria: [
        { name: "Task Achievement", score: 6.0, feedback: "Main points addressed but some underdevelopment in Task 2 body paragraphs." },
        { name: "Coherence & Cohesion", score: 6.5, feedback: "Logical paragraphing; occasional overuse of 'However' — vary your linking devices." },
        { name: "Lexical Resource", score: 6.0, feedback: "Adequate range; try incorporating more precise academic vocabulary." },
        { name: "Grammatical Range", score: 5.5, feedback: "Errors in relative clauses and passive constructions reduced the score here." },
      ],
    },
    priorityAction: "Your lowest section was Writing. Focus on grammatical range — practice relative clauses and passive voice in your daily drills.",
  },
  {
    id: "m2",
    type: "mock",
    date: "2026-03-28T10:00:00",
    overallBand: 6.0,
    skillBands: { Listening: 6.5, Reading: 6.0, Writing: 5.5, Speaking: 6.0 },
    duration: "2h 45m",
    criteriaBreakdown: {
      skill: "Writing",
      criteria: [
        { name: "Task Achievement", score: 5.5, feedback: "Task 1 overview was missing a clear trend comparison." },
        { name: "Coherence & Cohesion", score: 6.0, feedback: "Basic cohesion present but transitions between paragraphs were abrupt." },
        { name: "Lexical Resource", score: 5.5, feedback: "Repetitive vocabulary throughout — needs more synonymic variation." },
        { name: "Grammatical Range", score: 5.5, feedback: "High frequency of simple sentence structures. Attempt more complex syntax." },
      ],
    },
    priorityAction: "Writing was your weakest section. Work on Task 1 overviews and expanding your sentence structure variety.",
  },

  // ── Internal Assessments ─────────────────────────────────────────────────────
  {
    id: "ia1",
    type: "internal",
    date: "2026-04-10T14:00:00",
    momentumEarned: 85,
    weakestSkill: "Writing",
    results: [
      {
        skill: "Listening",
        previousBand: 6.0,
        newBand: 6.5,
        delta: 0.5,
        criteria: [
          { name: "Vocabulary Recognition", score: 7.0, feedback: "Strong performance on fill-in-the-blank items." },
          { name: "Detail Recognition", score: 6.5, feedback: "Good, minor slips on numbers and dates." },
          { name: "Coherence & Context", score: 6.5, feedback: "Solid inference skill; missed one implied contrast." },
          { name: "Multiple Choice", score: 6.0, feedback: "Two MCQ errors — re-read options more carefully." },
        ],
      },
      {
        skill: "Reading",
        previousBand: 6.0,
        newBand: 6.0,
        delta: 0,
        criteria: [
          { name: "Grammatical Parsing", score: 6.5, feedback: "T/F/NG mostly correct; one false positive." },
          { name: "Heading Matching", score: 6.0, feedback: "Confused two headings with similar themes." },
          { name: "Short Answer", score: 5.5, feedback: "Answers too long — paraphrase tightly from text." },
          { name: "Vocabulary & Inference", score: 6.0, feedback: "Good contextual vocabulary inference." },
        ],
      },
      {
        skill: "Writing",
        previousBand: 5.5,
        newBand: 6.0,
        delta: 0.5,
        criteria: [
          { name: "Task Achievement", score: 6.0, feedback: "Task 2 position was clear; Task 1 overview present." },
          { name: "Coherence & Cohesion", score: 6.0, feedback: "Paragraphing logical; transitions sometimes forced." },
          { name: "Lexical Resource", score: 5.5, feedback: "Limited range — avoid repeating the same root words." },
          { name: "Grammatical Range", score: 5.5, feedback: "Frequent comma splices and missing articles." },
        ],
      },
      {
        skill: "Speaking",
        previousBand: 6.0,
        newBand: 6.5,
        delta: 0.5,
        criteria: [
          { name: "Fluency & Pronunciation", score: 6.5, feedback: "Fewer filler words; good connected speech." },
          { name: "Lexical Resource", score: 6.5, feedback: "Appropriate topic vocabulary used confidently." },
          { name: "Grammar & Vocabulary", score: 6.5, feedback: "Mostly accurate; occasional subject-verb agreement errors." },
          { name: "Pronunciation Analysis", score: 6.0, feedback: "Stress on polysyllabic words still inconsistent." },
        ],
      },
    ],
    priorityAction: "Writing remains your lowest skill. Focus on Lexical Resource and Grammatical Range in your daily drills.",
  },
  {
    id: "ia2",
    type: "internal",
    date: "2026-03-18T11:00:00",
    momentumEarned: 72,
    weakestSkill: "Speaking",
    results: [
      {
        skill: "Listening",
        previousBand: 5.5,
        newBand: 6.0,
        delta: 0.5,
        criteria: [
          { name: "Vocabulary Recognition", score: 6.5, feedback: "Good recall of specific details." },
          { name: "Detail Recognition", score: 6.0, feedback: "Missed a key numerical figure in Section 3." },
          { name: "Coherence & Context", score: 6.0, feedback: "Context clues used well overall." },
          { name: "Multiple Choice", score: 5.5, feedback: "Two distractors selected — focus on elimination strategy." },
        ],
      },
      {
        skill: "Reading",
        previousBand: 5.5,
        newBand: 6.0,
        delta: 0.5,
        criteria: [
          { name: "Grammatical Parsing", score: 6.5, feedback: "Strong on T/F/NG — good use of NOT GIVEN rule." },
          { name: "Heading Matching", score: 6.0, feedback: "Generally accurate; one heading missed the paragraph's main point." },
          { name: "Short Answer", score: 5.5, feedback: "Over-reliance on lifting verbatim phrases." },
          { name: "Vocabulary & Inference", score: 5.5, feedback: "Need to build inference skills for complex academic text." },
        ],
      },
      {
        skill: "Writing",
        previousBand: 5.0,
        newBand: 5.5,
        delta: 0.5,
        criteria: [
          { name: "Task Achievement", score: 5.5, feedback: "Task 2 lacked a clear conclusion." },
          { name: "Coherence & Cohesion", score: 5.5, feedback: "Some paragraphs had no clear topic sentence." },
          { name: "Lexical Resource", score: 5.0, feedback: "Vocabulary too simple and repetitive." },
          { name: "Grammatical Range", score: 5.0, feedback: "Mostly simple sentences; complex forms attempted but often incorrect." },
        ],
      },
      {
        skill: "Speaking",
        previousBand: 5.5,
        newBand: 5.5,
        delta: 0,
        criteria: [
          { name: "Fluency & Pronunciation", score: 5.5, feedback: "Frequent hesitations and self-corrections disrupt flow." },
          { name: "Lexical Resource", score: 5.5, feedback: "Limited range — same phrases repeated across parts." },
          { name: "Grammar & Vocabulary", score: 5.5, feedback: "Errors in tense consistency and conditionals." },
          { name: "Pronunciation Analysis", score: 5.0, feedback: "Several mispronunciations of common academic words." },
        ],
      },
    ],
    priorityAction: "Speaking is your weakest area. Target Pronunciation and Fluency in your daily drill sessions.",
  },

  // ── Drills ──────────────────────────────────────────────────────────────────
  {
    id: "d1",
    type: "drill",
    date: "2026-04-18T09:15:00",
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
    type: "drill",
    date: "2026-04-17T14:30:00",
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
    type: "drill",
    date: "2026-04-14T11:00:00",
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
    type: "drill",
    date: "2026-04-12T16:45:00",
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
    type: "drill",
    date: "2026-04-08T13:00:00",
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
  {
    id: "d6",
    type: "drill",
    date: "2026-04-05T10:30:00",
    skill: "Writing",
    subSkill: "Grammatical Range",
    drillType: "Paragraph Repair",
    momentumEarned: 24,
    totalPrompts: 5,
    promptFeedback: [
      "Passive voice used correctly in context — well done.",
      "Relative clause added but missing the relative pronoun.",
      "Conditional structure is accurate; great improvement.",
      "Run-on sentence detected — split with a semicolon or full stop.",
      "Excellent variety of sentence types in this prompt.",
    ],
    videoWatched: true,
    applyDrillCompleted: true,
    reflection: "I need to always check for relative pronouns when adding a relative clause.",
  },
  {
    id: "d7",
    type: "drill",
    date: "2026-04-02T15:00:00",
    skill: "Listening",
    subSkill: "Vocabulary Recognition",
    drillType: "Audio Response",
    momentumEarned: 29,
    totalPrompts: 5,
    promptFeedback: [
      "Accurate transcription of all key terms.",
      "Excellent — caught the hyphenated compound noun correctly.",
      "Missed the plural form; 'agencies' not 'agency'.",
      "Perfect recall of the numerical data in this prompt.",
      "Outstanding performance on this vocabulary item.",
    ],
    videoWatched: true,
    applyDrillCompleted: true,
    reflection: "I should always double-check singular vs plural when writing from audio.",
  },
];

// ─── CONFIG ───────────────────────────────────────────────────────────────────

const SKILL_CONFIG = {
  Listening: {
    icon: <Headphones className="h-4 w-4" />,
    color: "text-sky-600 dark:text-sky-400",
    bg: "bg-sky-50 dark:bg-sky-500/10",
    border: "border-sky-200 dark:border-sky-500/30",
    accent: "bg-sky-600",
  },
  Reading: {
    icon: <BookOpen className="h-4 w-4" />,
    color: "text-violet-600 dark:text-violet-400",
    bg: "bg-violet-50 dark:bg-violet-500/10",
    border: "border-violet-200 dark:border-violet-500/30",
    accent: "bg-violet-600",
  },
  Writing: {
    icon: <PenLine className="h-4 w-4" />,
    color: "text-amber-600 dark:text-amber-400",
    bg: "bg-amber-50 dark:bg-amber-500/10",
    border: "border-amber-200 dark:border-amber-500/30",
    accent: "bg-amber-600",
  },
  Speaking: {
    icon: <Mic className="h-4 w-4" />,
    color: "text-rose-600 dark:text-rose-400",
    bg: "bg-rose-50 dark:bg-rose-500/10",
    border: "border-rose-200 dark:border-rose-500/30",
    accent: "bg-rose-600",
  },
};

const SESSION_TYPE_CONFIG = {
  drill: {
    label: "Practice Drill",
    badgeBg: "bg-blue-100 dark:bg-blue-500/20",
    badgeText: "text-blue-700 dark:text-blue-300",
    icon: <Target className="h-3 w-3" />,
    rowBorder: "border-blue-100 dark:border-blue-500/20",
    headerBg: "bg-blue-50 dark:bg-blue-500/10",
  },
  internal: {
    label: "Internal Assessment",
    badgeBg: "bg-purple-100 dark:bg-purple-500/20",
    badgeText: "text-purple-700 dark:text-purple-300",
    icon: <Brain className="h-3 w-3" />,
    rowBorder: "border-purple-100 dark:border-purple-500/20",
    headerBg: "bg-purple-50 dark:bg-purple-500/10",
  },
  mock: {
    label: "Mock Test",
    badgeBg: "bg-amber-100 dark:bg-amber-500/20",
    badgeText: "text-amber-700 dark:text-amber-300",
    icon: <Trophy className="h-3 w-3" />,
    rowBorder: "border-amber-100 dark:border-amber-500/20",
    headerBg: "bg-amber-50 dark:bg-amber-500/10",
  },
};

const SKILL_ICON_MAP: Record<Skill, React.ReactNode> = {
  Listening: <Headphones className="h-3.5 w-3.5" />,
  Reading: <BookOpen className="h-3.5 w-3.5" />,
  Writing: <PenLine className="h-3.5 w-3.5" />,
  Speaking: <Mic className="h-3.5 w-3.5" />,
};

const momentumColor = (pts: number) => {
  if (pts >= 26) return "text-emerald-600 dark:text-emerald-400";
  if (pts >= 20) return "text-sky-600 dark:text-sky-400";
  if (pts >= 14) return "text-amber-600 dark:text-amber-400";
  return "text-rose-600 dark:text-rose-400";
};

const bandColor = (band: number) => {
  if (band >= 7) return "text-emerald-600 dark:text-emerald-400";
  if (band >= 6) return "text-sky-600 dark:text-sky-400";
  if (band >= 5) return "text-amber-600 dark:text-amber-400";
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

  const [filterType, setFilterType] = useState<SessionType | "All">("All");
  const [filterSkill, setFilterSkill] = useState<Skill | "All">("All");
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());

  const toggleExpand = (id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const filtered = MOCK_SESSIONS.filter((s) => {
    if (filterType !== "All" && s.type !== filterType) return false;
    if (filterSkill !== "All") {
      if (s.type === "drill" && (s as DrillSession).skill !== filterSkill) return false;
      if (s.type === "internal") return true; // internal covers all skills
      if (s.type === "mock") return true; // mock covers all skills
    }
    return true;
  }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const totalMomentum = filtered.reduce((sum, s) => {
    if (s.type === "drill") return sum + (s as DrillSession).momentumEarned;
    if (s.type === "internal") return sum + (s as InternalSession).momentumEarned;
    return sum;
  }, 0);

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

          {/* ── Header ── */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <h1 className="text-2xl font-black text-slate-800 dark:text-white">
                Assessment History
              </h1>
              <p className="text-sm text-slate-500 mt-0.5">
                Your permanent record — {filtered.length} session{filtered.length !== 1 ? "s" : ""} found
              </p>
            </div>
            {totalMomentum > 0 && (
              <div className="flex items-center gap-2 bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/30 rounded-xl px-4 py-2 self-start sm:self-auto">
                <Zap className="h-4 w-4 text-amber-500 fill-amber-500" />
                <span className="text-sm font-bold text-amber-700 dark:text-amber-400">
                  {totalMomentum} pts in view
                </span>
              </div>
            )}
          </div>

          {/* ── Legend ── */}
          <div className="flex flex-wrap gap-3">
            {(Object.entries(SESSION_TYPE_CONFIG) as [SessionType, typeof SESSION_TYPE_CONFIG.drill][]).map(
              ([key, cfg]) => (
                <div
                  key={key}
                  className={`inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-full ${cfg.badgeBg} ${cfg.badgeText}`}
                >
                  {cfg.icon}
                  {cfg.label}
                </div>
              )
            )}
          </div>

          {/* ── Filter Bar ── */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 p-4 shadow-sm">
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-1.5 text-xs font-bold text-slate-500 uppercase tracking-wider mr-1">
                <Filter className="h-3.5 w-3.5" /> Filter by
              </div>

              {/* Type filter */}
              <div className="flex flex-wrap gap-2">
                {(["All", "drill", "internal", "mock"] as const).map((t) => (
                  <FilterChip
                    key={t}
                    label={
                      t === "All"
                        ? "All Types"
                        : SESSION_TYPE_CONFIG[t as SessionType].label
                    }
                    active={filterType === t}
                    onClick={() => setFilterType(t)}
                  />
                ))}
              </div>

              <div className="h-5 w-px bg-slate-200 dark:bg-slate-700 hidden sm:block" />

              {/* Skill filter */}
              <div className="flex flex-wrap gap-2">
                {(["All", "Listening", "Reading", "Writing", "Speaking"] as const).map((s) => (
                  <FilterChip
                    key={s}
                    label={s === "All" ? "All Skills" : s}
                    active={filterSkill === s}
                    onClick={() => setFilterSkill(s)}
                    color={s !== "All" ? SKILL_CONFIG[s as Skill]?.color : undefined}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* ── Session List ── */}
          <div className="space-y-3">
            {filtered.length === 0 ? (
              <div className="text-center py-16 text-slate-400">
                <BarChart2 className="h-10 w-10 mx-auto mb-3 opacity-40" />
                <p className="font-semibold">No sessions match this filter</p>
              </div>
            ) : (
              filtered.map((session) => {
                if (session.type === "drill") {
                  return (
                    <DrillRow
                      key={session.id}
                      session={session as DrillSession}
                      isExpanded={expandedIds.has(session.id)}
                      onToggle={() => toggleExpand(session.id)}
                    />
                  );
                }
                if (session.type === "internal") {
                  return (
                    <InternalRow
                      key={session.id}
                      session={session as InternalSession}
                      isExpanded={expandedIds.has(session.id)}
                      onToggle={() => toggleExpand(session.id)}
                    />
                  );
                }
                return (
                  <MockRow
                    key={session.id}
                    session={session as MockSession}
                    isExpanded={expandedIds.has(session.id)}
                    onToggle={() => toggleExpand(session.id)}
                  />
                );
              })
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

// ─── DRILL ROW ────────────────────────────────────────────────────────────────

const DrillRow = ({
  session,
  isExpanded,
  onToggle,
}: {
  session: DrillSession;
  isExpanded: boolean;
  onToggle: () => void;
}) => {
  const cfg = SKILL_CONFIG[session.skill];
  const typeCfg = SESSION_TYPE_CONFIG.drill;

  return (
    <div className={`bg-white dark:bg-slate-900 rounded-2xl border shadow-sm overflow-hidden transition-all duration-200 ${typeCfg.rowBorder}`}>
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
            <TypeBadge type="drill" />
            <span className="font-bold text-slate-800 dark:text-white">{session.skill}</span>
            <span className="text-slate-400 text-sm">·</span>
            <span className="text-sm font-semibold text-slate-600 dark:text-slate-300">{session.subSkill}</span>
            <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400">
              {session.drillType}
            </span>
          </div>
          <div className="flex flex-wrap items-center gap-3 mt-1 text-xs text-slate-400">
            <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{formatDate(session.date)}</span>
            <span className="flex items-center gap-1"><Target className="h-3 w-3" />{session.totalPrompts} prompts</span>
          </div>
        </div>

        {/* Status badges */}
        <div className="flex-shrink-0 hidden sm:flex flex-col items-end gap-1 mr-1">
          <StatusBadge done={session.videoWatched} label="Video" icon={<PlayCircle className="h-3 w-3" />} />
          <StatusBadge done={session.applyDrillCompleted} label="Apply drill" icon={<CheckCircle2 className="h-3 w-3" />} />
        </div>

        {/* Score */}
        <div className="flex-shrink-0 text-right mr-1">
          <p className={`text-2xl font-black flex items-center gap-1 ${momentumColor(session.momentumEarned)}`}>
            <Zap className="h-5 w-5 fill-current" />
            {session.momentumEarned}
          </p>
          <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wide">pts earned</p>
        </div>

        <div className="flex-shrink-0 text-slate-400">
          {isExpanded ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
        </div>
      </button>

      {isExpanded && (
        <div className={`border-t ${typeCfg.rowBorder} px-4 sm:px-5 pb-5 pt-4 ${typeCfg.headerBg} space-y-4`}>
          {/* Mobile badges */}
          <div className="flex gap-2 sm:hidden">
            <StatusBadge done={session.videoWatched} label="Video watched" icon={<PlayCircle className="h-3 w-3" />} />
            <StatusBadge done={session.applyDrillCompleted} label="Apply drill done" icon={<CheckCircle2 className="h-3 w-3" />} />
          </div>

          {/* Per-prompt feedback */}
          <div>
            <SectionLabel icon={<MessageSquare className="h-3 w-3" />} text="Prompt Feedback" />
            <div className="space-y-2 mt-2">
              {session.promptFeedback.map((text, i) => (
                <div
                  key={i}
                  className="flex gap-3 text-sm text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-900 rounded-xl p-3.5 border border-slate-100 dark:border-slate-800"
                >
                  <span className="font-bold text-blue-500 shrink-0 text-xs mt-0.5">Q{i + 1}</span>
                  <p className="leading-relaxed">{text}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Reflection */}
          {session.reflection && (
            <div>
              <SectionLabel icon={null} text="Your Reflection" />
              <p className="mt-2 text-sm text-slate-700 dark:text-slate-300 italic bg-white dark:bg-slate-900 rounded-xl p-4 border border-slate-100 dark:border-slate-800 leading-relaxed">
                "{session.reflection}"
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// ─── INTERNAL ASSESSMENT ROW ──────────────────────────────────────────────────

const InternalRow = ({
  session,
  isExpanded,
  onToggle,
}: {
  session: InternalSession;
  isExpanded: boolean;
  onToggle: () => void;
}) => {
  const typeCfg = SESSION_TYPE_CONFIG.internal;
  const [activeSkillTab, setActiveSkillTab] = useState<Skill>("Listening");

  const overallAvg =
    session.results.reduce((sum, r) => sum + r.newBand, 0) / session.results.length;
  const roundedAvg = Math.round(overallAvg * 2) / 2;

  return (
    <div className={`bg-white dark:bg-slate-900 rounded-2xl border shadow-sm overflow-hidden transition-all duration-200 ${typeCfg.rowBorder}`}>
      <button
        onClick={onToggle}
        className="w-full flex items-center gap-4 p-4 sm:p-5 text-left hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors"
      >
        {/* Icon */}
        <div className="flex-shrink-0 h-10 w-10 rounded-xl flex items-center justify-center bg-purple-50 dark:bg-purple-500/10 text-purple-600 dark:text-purple-400">
          <GraduationCap className="h-5 w-5" />
        </div>

        {/* Main info */}
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <TypeBadge type="internal" />
            <span className="font-bold text-slate-800 dark:text-white">Full 4-Skill Assessment</span>
          </div>
          <div className="flex flex-wrap items-center gap-3 mt-1 text-xs text-slate-400">
            <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{formatDate(session.date)}</span>
            <span className="flex items-center gap-1">
              {(["Listening", "Reading", "Writing", "Speaking"] as Skill[]).map((s) => (
                <span key={s} className={`${SKILL_CONFIG[s].color}`}>{SKILL_ICON_MAP[s]}</span>
              ))}
              All 4 skills
            </span>
          </div>
        </div>

        {/* Band score preview pills */}
        <div className="flex-shrink-0 hidden sm:flex items-center gap-1.5 mr-1">
          {session.results.map((r) => (
            <div
              key={r.skill}
              className={`flex flex-col items-center justify-center w-11 h-11 rounded-xl border ${SKILL_CONFIG[r.skill].bg} ${SKILL_CONFIG[r.skill].border}`}
            >
              <span className={`text-xs font-black ${SKILL_CONFIG[r.skill].color}`}>{r.newBand.toFixed(1)}</span>
              <span className={`text-[9px] font-bold ${SKILL_CONFIG[r.skill].color} opacity-70`}>{r.skill.slice(0, 3)}</span>
            </div>
          ))}
        </div>

        {/* Avg band + momentum */}
        <div className="flex-shrink-0 text-right mr-1 space-y-0.5">
          <p className={`text-2xl font-black ${bandColor(roundedAvg)}`}>{roundedAvg.toFixed(1)}</p>
          <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wide">avg band</p>
          <p className={`text-xs font-bold flex items-center justify-end gap-0.5 ${momentumColor(session.momentumEarned)}`}>
            <Zap className="h-3 w-3 fill-current" />{session.momentumEarned} pts
          </p>
        </div>

        <div className="flex-shrink-0 text-slate-400">
          {isExpanded ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
        </div>
      </button>

      {isExpanded && (
        <div className={`border-t ${typeCfg.rowBorder} px-4 sm:px-5 pb-5 pt-4 ${typeCfg.headerBg} space-y-4`}>

          {/* Score overview grid */}
          <div>
            <SectionLabel icon={<BarChart2 className="h-3 w-3" />} text="Score Overview" />
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-2">
              {session.results.map((r) => {
                const cfg = SKILL_CONFIG[r.skill];
                const isUp = r.delta > 0;
                const isDown = r.delta < 0;
                return (
                  <div
                    key={r.skill}
                    className={`bg-white dark:bg-slate-900 rounded-xl border p-3 ${cfg.border}`}
                  >
                    <div className={`flex items-center gap-1.5 mb-2 ${cfg.color}`}>
                      {cfg.icon}
                      <span className="text-xs font-bold">{r.skill}</span>
                    </div>
                    <div className="flex items-end gap-2">
                      <span className={`text-2xl font-black ${bandColor(r.newBand)}`}>{r.newBand.toFixed(1)}</span>
                      <span className="text-xs text-slate-400 line-through mb-0.5">{r.previousBand.toFixed(1)}</span>
                    </div>
                    <div className={`flex items-center gap-0.5 text-[10px] font-bold mt-1 ${isUp ? "text-emerald-600" : isDown ? "text-rose-500" : "text-slate-400"}`}>
                      {isUp ? <TrendingUp className="h-3 w-3" /> : isDown ? <TrendingDown className="h-3 w-3" /> : <Minus className="h-3 w-3" />}
                      {isUp ? `+${r.delta.toFixed(1)}` : isDown ? r.delta.toFixed(1) : "No change"}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Criterion breakdown with tabs */}
          <div>
            <SectionLabel icon={<Brain className="h-3 w-3" />} text="Criterion Breakdown" />
            <div className="flex flex-wrap gap-1.5 mt-2 mb-3">
              {session.results.map((r) => (
                <button
                  key={r.skill}
                  onClick={() => setActiveSkillTab(r.skill)}
                  className={`flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-lg border transition-all ${
                    activeSkillTab === r.skill
                      ? `${SKILL_CONFIG[r.skill].bg} ${SKILL_CONFIG[r.skill].color} ${SKILL_CONFIG[r.skill].border}`
                      : "bg-white dark:bg-slate-900 text-slate-500 border-slate-200 dark:border-slate-700"
                  }`}
                >
                  {SKILL_ICON_MAP[r.skill]}
                  {r.skill}
                </button>
              ))}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {session.results
                .find((r) => r.skill === activeSkillTab)
                ?.criteria.map((crit, i) => (
                  <div
                    key={i}
                    className="bg-white dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-800 p-3.5"
                  >
                    <div className="flex justify-between items-center mb-1.5">
                      <span className="text-xs font-bold text-slate-700 dark:text-slate-300">{crit.name}</span>
                      <span className={`text-sm font-black ${bandColor(crit.score)}`}>{crit.score.toFixed(1)}</span>
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">{crit.feedback}</p>
                  </div>
                ))}
            </div>
          </div>

          {/* Priority action */}
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-purple-200 dark:border-purple-500/30 p-4 flex gap-3">
            <AlertCircle className="h-4 w-4 text-purple-500 mt-0.5 shrink-0" />
            <div>
              <p className="text-xs font-black text-purple-600 dark:text-purple-400 uppercase tracking-widest mb-1">Priority Action</p>
              <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">{session.priorityAction}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// ─── MOCK TEST ROW ────────────────────────────────────────────────────────────

const MockRow = ({
  session,
  isExpanded,
  onToggle,
}: {
  session: MockSession;
  isExpanded: boolean;
  onToggle: () => void;
}) => {
  const typeCfg = SESSION_TYPE_CONFIG.mock;

  return (
    <div className={`bg-white dark:bg-slate-900 rounded-2xl border shadow-sm overflow-hidden transition-all duration-200 ${typeCfg.rowBorder}`}>
      <button
        onClick={onToggle}
        className="w-full flex items-center gap-4 p-4 sm:p-5 text-left hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors"
      >
        {/* Icon */}
        <div className="flex-shrink-0 h-10 w-10 rounded-xl flex items-center justify-center bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400">
          <Trophy className="h-5 w-5" />
        </div>

        {/* Main info */}
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <TypeBadge type="mock" />
            <span className="font-bold text-slate-800 dark:text-white">Full Official Mock Exam</span>
          </div>
          <div className="flex flex-wrap items-center gap-3 mt-1 text-xs text-slate-400">
            <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{formatDate(session.date)}</span>
            <span className="flex items-center gap-1"><Target className="h-3 w-3" />Duration: {session.duration}</span>
          </div>
        </div>

        {/* Skill band pills */}
        <div className="flex-shrink-0 hidden sm:flex items-center gap-1.5 mr-1">
          {(["Listening", "Reading", "Writing", "Speaking"] as Skill[]).map((s) => (
            <div
              key={s}
              className={`flex flex-col items-center justify-center w-11 h-11 rounded-xl border ${SKILL_CONFIG[s].bg} ${SKILL_CONFIG[s].border}`}
            >
              <span className={`text-xs font-black ${SKILL_CONFIG[s].color}`}>{session.skillBands[s].toFixed(1)}</span>
              <span className={`text-[9px] font-bold ${SKILL_CONFIG[s].color} opacity-70`}>{s.slice(0, 3)}</span>
            </div>
          ))}
        </div>

        {/* Overall band */}
        <div className="flex-shrink-0 text-right mr-1">
          <p className={`text-3xl font-black ${bandColor(session.overallBand)}`}>{session.overallBand.toFixed(1)}</p>
          <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wide">overall band</p>
        </div>

        <div className="flex-shrink-0 text-slate-400">
          {isExpanded ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
        </div>
      </button>

      {isExpanded && (
        <div className={`border-t ${typeCfg.rowBorder} px-4 sm:px-5 pb-5 pt-4 ${typeCfg.headerBg} space-y-4`}>

          {/* Overall score highlight */}
          <div className="bg-gradient-to-r from-amber-50 to-yellow-50 dark:from-amber-500/10 dark:to-yellow-500/10 border border-amber-200 dark:border-amber-500/30 rounded-xl p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-black text-amber-700 dark:text-amber-400 uppercase tracking-widest">Overall Band Score</p>
              <p className="text-xs text-slate-500 mt-0.5">Average of all 4 skill sections</p>
            </div>
            <span className={`text-5xl font-black ${bandColor(session.overallBand)}`}>{session.overallBand.toFixed(1)}</span>
          </div>

          {/* Per-skill band scores */}
          <div>
            <SectionLabel icon={<BarChart2 className="h-3 w-3" />} text="Section Scores" />
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-2">
              {(["Listening", "Reading", "Writing", "Speaking"] as Skill[]).map((skill) => {
                const band = session.skillBands[skill];
                const cfg = SKILL_CONFIG[skill];
                return (
                  <div
                    key={skill}
                    className={`bg-white dark:bg-slate-900 rounded-xl border p-3 text-center ${cfg.border}`}
                  >
                    <div className={`flex items-center justify-center gap-1.5 mb-2 ${cfg.color}`}>
                      {cfg.icon}
                      <span className="text-xs font-bold">{skill}</span>
                    </div>
                    <span className={`text-3xl font-black ${bandColor(band)}`}>{band.toFixed(1)}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Criterion breakdown of weakest skill */}
          <div>
            <SectionLabel
              icon={<Brain className="h-3 w-3" />}
              text={`${session.criteriaBreakdown.skill} — Detailed Criterion Scores`}
            />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-2">
              {session.criteriaBreakdown.criteria.map((crit, i) => (
                <div
                  key={i}
                  className="bg-white dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-800 p-3.5"
                >
                  <div className="flex justify-between items-center mb-1.5">
                    <span className="text-xs font-bold text-slate-700 dark:text-slate-300">{crit.name}</span>
                    <span className={`text-sm font-black ${bandColor(crit.score)}`}>{crit.score.toFixed(1)}</span>
                  </div>
                  <div className="w-full h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full mb-2">
                    <div
                      className={`h-full rounded-full ${crit.score >= 7 ? "bg-emerald-500" : crit.score >= 6 ? "bg-sky-500" : crit.score >= 5 ? "bg-amber-500" : "bg-rose-500"}`}
                      style={{ width: `${((crit.score - 1) / 8) * 100}%` }}
                    />
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">{crit.feedback}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Priority action */}
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-amber-200 dark:border-amber-500/30 p-4 flex gap-3">
            <AlertCircle className="h-4 w-4 text-amber-500 mt-0.5 shrink-0" />
            <div>
              <p className="text-xs font-black text-amber-600 dark:text-amber-400 uppercase tracking-widest mb-1">Priority Action</p>
              <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">{session.priorityAction}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// ─── SHARED SUB-COMPONENTS ────────────────────────────────────────────────────

const TypeBadge = ({ type }: { type: SessionType }) => {
  const cfg = SESSION_TYPE_CONFIG[type];
  return (
    <span className={`inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full ${cfg.badgeBg} ${cfg.badgeText}`}>
      {cfg.icon}
      {cfg.label}
    </span>
  );
};

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

const SectionLabel = ({
  icon,
  text,
}: {
  icon: React.ReactNode;
  text: string;
}) => (
  <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-1.5">
    {icon}
    {text}
  </p>
);

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