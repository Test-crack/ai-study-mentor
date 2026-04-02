import { useState, useEffect } from "react";
import { StudentSidebar } from "./dashboard/StudentSidebar";
import { StudentTopbar } from "./dashboard/StudentTopbar";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { PremiumModal } from "@/features/payment/components/PremiumModal";
import { useNavigate } from "react-router-dom";
import { callBackend } from "@/features/auth/services/authClient";
import {
  Clock,
  Flame,
  Trophy,
  Target,
  TrendingUp,
  ChevronDown,
  ChevronRight,
  Star,
  Zap,
  BookOpen,
  Mic,
  PenLine,
  Headphones,
  CalendarClock,
  AlertTriangle,
  CheckCircle2,
  ArrowRight,
} from "lucide-react";

// ─── TYPES ───────────────────────────────────────────────────────────────────

interface SkillBand {
  skill: "Listening" | "Reading" | "Writing" | "Speaking";
  score: number;
  target: number;
  delta: number; // change from last assessment
  route: string;
  icon: React.ReactNode;
  color: string;
  bg: string;
  border: string;
}

// ─── MOCK DATA ────────────────────────────────────────────────────────────────

const SKILL_BANDS: SkillBand[] = [
  {
    skill: "Listening",
    score: 0.0,
    target: 0.0,
    delta: 0.0,
    route: "/student/listening",
    icon: <Headphones className="h-5 w-5" />,
    color: "text-sky-600",
    bg: "bg-sky-50 dark:bg-sky-500/10",
    border: "border-sky-200 dark:border-sky-500/30",
  },
  {
    skill: "Reading",
    score: 0.0,
    target: 0.0,
    delta: 0.0,
    route: "/student/reading",
    icon: <BookOpen className="h-5 w-5" />,
    color: "text-violet-600",
    bg: "bg-violet-50 dark:bg-violet-500/10",
    border: "border-violet-200 dark:border-violet-500/30",
  },
  {
    skill: "Writing",
    score: 0.0,
    target: 0.0,
    delta: 0.0,
    route: "/student/writing",
    icon: <PenLine className="h-5 w-5" />,
    color: "text-amber-600",
    bg: "bg-amber-50 dark:bg-amber-500/10",
    border: "border-amber-200 dark:border-amber-500/30",
  },
  {
    skill: "Speaking",
    score: 0.0,
    target: 0.0,
    delta: 0.0,
    route: "/student/speaking-assessment",
    icon: <Mic className="h-5 w-5" />,
    color: "text-rose-600",
    bg: "bg-rose-50 dark:bg-rose-500/10",
    border: "border-rose-200 dark:border-rose-500/30",
  },
];

// Focus Area Card — hardcoded
const FOCUS_AREA = {
  skill: "Speaking",
  subScore: 4.0,
  subSkill: "Pronunciation",
  drill: "Consonant Clusters",
  reason: "Your Pronunciation sub-score is 4.0. Practice Consonant Clusters.",
  route: "/student/speaking-assessment",
  urgencyColor: "text-rose-600",
  urgencyBg: "bg-rose-50 dark:bg-rose-500/10",
  urgencyBorder: "border-rose-200 dark:border-rose-500/25",
};

// Predicted Readiness — hardcoded
const READINESS = {
  targetBand: 7.5,
  targetDate: "2026-06-15",
  currentOverall: 5.5,
  trajectory: "At current pace: 6.5 by June 15",
  status: "warn", // "on-track" | "warn" | "danger"
  daysLeft: 83,
};

// Level badge
const LEVEL = { label: "Intermediate", tier: "B2", color: "bg-indigo-100 text-indigo-700 dark:bg-indigo-500/20 dark:text-indigo-300" };

// ─── UTILS ────────────────────────────────────────────────────────────────────

const calculateStreak = (dates: string[]): number => {
  if (!dates || dates.length === 0) return 0;
  const sortedDates = [...new Set(dates)].sort().reverse();
  let streak = 0;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  const lastAttendance = new Date(sortedDates[0]);
  lastAttendance.setHours(0, 0, 0, 0);
  if (lastAttendance.getTime() < yesterday.getTime()) return 0;
  for (let i = 0; i < sortedDates.length; i++) {
    const current = new Date(sortedDates[i]);
    current.setHours(0, 0, 0, 0);
    const expected = new Date(today);
    expected.setDate(expected.getDate() - streak);
    expected.setHours(0, 0, 0, 0);
    if (current.getTime() === expected.getTime()) streak++;
    else if (current.getTime() < expected.getTime()) break;
  }
  return streak;
};

const overallBand = (bands: SkillBand[]) =>
  Math.round((bands.reduce((s, b) => s + b.score, 0) / bands.length) * 2) / 2;

// ─── MAIN COMPONENT ──────────────────────────────────────────────────────────

const StudentDashboardPage = () => {
  const [activeTab, setActiveTab] = useState("dashboard");
  const [showPremiumModal, setShowPremiumModal] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [currentStreak, setCurrentStreak] = useState(0);
  const [skillBands, setSkillBands] = useState<SkillBand[]>(SKILL_BANDS);
  const { user, profile } = useAuth();
  const navigate = useNavigate();

  const displayName = profile?.name || user?.email?.split("@")[0] || "Student";
  const overall = overallBand(skillBands);

  useEffect(() => {
    // 1. Fetch exact scores from competency matrix
    const fetchCompetencyScores = async () => {
      try {
        const backendUrl = import.meta.env.VITE_BACKEND_URL || "http://localhost:4000";
        const fullUrl = `${backendUrl}/api/student/competency-scores`;
        
        // Use Supabase-authenticated callBackend explicitly
        const resData = await callBackend(fullUrl);
        
        if (resData.success && resData.data) {
          const fetchedTarget = resData.target_band || 7.0;
          
          setSkillBands((prevBands) => {
            return prevBands.map(band => {
              // Find matching score in DB
              const dbRecord = resData.data.find(
                (m: any) => m.skill.toUpperCase() === band.skill.toUpperCase()
              );
              
              if (dbRecord) {
                // Ensure number casting to prevent .toFixed crashes
                return { 
                  ...band, 
                  score: Number(dbRecord.band_score) || 0.0, 
                  target: Number(fetchedTarget) || 7.0,
                  delta: 0 
                };
              }
              // Just update the target
              return { ...band, target: Number(fetchedTarget) || 7.0 };
            });
          });
        }
      } catch (err) {
        console.error("Failed to fetch competency matrix", err);
      }
    };
    
    fetchCompetencyScores();

    // 2. Determine Attendance Streak
    const today = new Date();
    const offset = today.getTimezoneOffset() * 60000;
    const localISO = new Date(today.getTime() - offset).toISOString().split("T")[0];
    const storedData = localStorage.getItem("student_attendance");
    let dates: string[] = storedData ? JSON.parse(storedData) : [];
    if (!dates.includes(localISO)) {
      dates.push(localISO);
      localStorage.setItem("student_attendance", JSON.stringify(dates));
    }
    setCurrentStreak(calculateStreak(dates));
  }, []);

  return (
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-slate-950 transition-colors duration-300">
      <StudentSidebar
        activeTab={activeTab}
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

          {/* ── Hero Banner ─────────────────────────────────────────── */}
          <section className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-indigo-600 via-indigo-500 to-purple-500 p-7 text-white shadow-lg">
            {/* decorative blobs */}
            <div className="pointer-events-none absolute -right-10 -top-10 h-48 w-48 rounded-full bg-white/10 blur-2xl" />
            <div className="pointer-events-none absolute right-24 bottom-0 h-28 w-28 rounded-full bg-purple-400/30 blur-xl" />

            <div className="relative z-10 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <div className="flex items-center gap-3 mb-1">
                  <h1 className="text-2xl sm:text-3xl font-bold">
                    Welcome back, {displayName} 👋
                  </h1>
                  {/* Level badge */}
                  <span className="hidden sm:inline-flex items-center gap-1 rounded-full bg-white/20 px-3 py-1 text-xs font-bold text-white backdrop-blur-sm border border-white/30">
                    <Trophy className="h-3.5 w-3.5" /> {LEVEL.tier} · {LEVEL.label}
                  </span>
                </div>
                <p className="text-indigo-100 max-w-xl text-sm sm:text-base">
                  You&apos;re on a <span className="font-bold text-white">{currentStreak}-day streak</span> — great momentum!
                  Your current overall band is{" "}
                  <span className="font-bold text-white">{overall}</span>. Focus on
                  Speaking to close the gap.
                </p>
              </div>
              {/* overall band pill */}
              <div className="flex-shrink-0 text-center bg-white/15 border border-white/30 backdrop-blur-sm rounded-2xl px-6 py-3">
                <p className="text-xs font-bold text-indigo-200 uppercase tracking-widest mb-0.5">
                  Overall Band
                </p>
                <p className="text-4xl font-black text-white leading-none">{overall}</p>
                <p className="text-xs text-indigo-200 mt-0.5">Target: {READINESS.targetBand}</p>
              </div>
            </div>
          </section>

          {/* ── 4 Skill Band Score Cards ────────────────────────────── */}
          <section>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {skillBands.map((band) => (
                <SkillBandCard key={band.skill} band={band} onNavigate={() => navigate(band.route)} />
              ))}
            </div>
          </section>

          {/* ── Second Row: Focus Area + Readiness + Streak ────────── */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

            {/* Focus Area Card */}
            <div className="lg:col-span-5">
              <FocusAreaCard focus={FOCUS_AREA} onNavigate={() => navigate(FOCUS_AREA.route)} />
            </div>

            {/* Predicted Readiness */}
            <div className="lg:col-span-4">
              <PredictedReadinessCard readiness={READINESS} />
            </div>

            {/* Streak */}
            <div className="lg:col-span-3">
              <DashboardCard title="Streak" icon={<Flame className="h-5 w-5 text-orange-500" />}>
                <AttendanceStreakTracker currentStreak={currentStreak} goal={7} />
              </DashboardCard>
            </div>
          </div>

          {/* ── Third Row: Modules Nav + Activity ──────────────────── */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

            {/* 4 Skill Module Navigation */}
            <div className="lg:col-span-8">
              <DashboardCard title="Skill Modules" subtitle="Tap any module to continue">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {skillBands.map((band) => (
                    <ModuleNavCard key={band.skill} band={band} onNavigate={() => navigate(band.route)} />
                  ))}
                </div>
              </DashboardCard>
            </div>

            {/* Recent Activity + Goals */}
            <div className="lg:col-span-4 space-y-4">
              <DashboardCard title="Recent Activity" subtitle="Your last 3 actions">
                <div className="space-y-5 pt-1">
                  <ActivityItem label="Completed Reading Comprehension Set 3" time="2 hours ago" color="bg-emerald-500" />
                  <ActivityItem label="Scored 78% in Speaking Mock Test" time="Yesterday" color="bg-indigo-500" />
                  <ActivityItem label="Started IELTS Writing Module" time="2 days ago" color="bg-blue-500" />
                </div>
              </DashboardCard>

              <DashboardCard title="Weekly Goals" icon="📈">
                <div className="space-y-4">
                  <GoalItem label="Speaking sessions" current={2} total={3} color="bg-indigo-500" />
                  <GoalItem label="Reading passages" current={1} total={2} color="bg-purple-500" />
                  <GoalItem label="Writing tasks" current={0} total={2} color="bg-amber-500" />
                </div>
              </DashboardCard>
            </div>

          </div>
        </main>
      </div>

      <PremiumModal isOpen={showPremiumModal} onClose={() => setShowPremiumModal(false)} />
    </div>
  );
};

// ─── SUB-COMPONENTS ───────────────────────────────────────────────────────────

/** 4 Skill Band Score Card */
const SkillBandCard = ({ band, onNavigate }: { band: SkillBand; onNavigate: () => void }) => {
  const pct = Math.round((band.score / 9) * 100);
  const isUp = band.delta >= 0;

  return (
    <button
      onClick={onNavigate}
      className={`text-left w-full rounded-2xl border p-4 sm:p-5 transition-all duration-200 hover:scale-[1.02] hover:shadow-md bg-white dark:bg-slate-900 ${band.border} shadow-sm`}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className={`flex items-center justify-center h-9 w-9 rounded-xl ${band.bg} ${band.color}`}>
          {band.icon}
        </div>
        <span
          className={`text-xs font-bold px-2 py-0.5 rounded-full ${
            isUp
              ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400"
              : "bg-red-100 text-red-600 dark:bg-red-500/20 dark:text-red-400"
          }`}
        >
          {isUp ? "+" : ""}{band.delta.toFixed(1)}
        </span>
      </div>

      {/* Score */}
      <p className="text-2xl font-black text-slate-800 dark:text-white">{band.score.toFixed(1)}</p>
      <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mt-0.5">{band.skill}</p>

      {/* Progress bar */}
      <div className="mt-3 h-1.5 w-full rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-700 ${band.color.replace("text-", "bg-")}`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <p className="text-[10px] text-slate-400 mt-1">Target: {band.target}</p>
    </button>
  );
};

/** Focus Area Card — the "Consultant" card */
const FocusAreaCard = ({ focus, onNavigate }: { focus: typeof FOCUS_AREA; onNavigate: () => void }) => (
  <div className={`h-full rounded-2xl border p-5 ${focus.urgencyBg} ${focus.urgencyBorder} shadow-sm`}>
    <div className="flex items-center gap-2 mb-3">
      <Zap className="h-5 w-5 text-rose-500" />
      <h2 className="text-sm font-black text-slate-800 dark:text-white uppercase tracking-wider">
        Next Best Action
      </h2>
    </div>

    <div className="flex items-start gap-4">
      <div className="flex-shrink-0 h-14 w-14 rounded-2xl bg-rose-100 dark:bg-rose-500/20 flex items-center justify-center">
        <Mic className="h-7 w-7 text-rose-500" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-base font-bold text-slate-800 dark:text-white leading-snug">
          {focus.reason}
        </p>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
          Skill: <span className="font-semibold text-slate-700 dark:text-slate-300">{focus.skill}</span>{" "}
          · Sub-skill:{" "}
          <span className="font-semibold text-slate-700 dark:text-slate-300">{focus.subSkill}</span>
        </p>
      </div>
    </div>

    <div className="mt-4 flex items-center justify-between bg-white/60 dark:bg-slate-900/40 rounded-xl p-3 border border-rose-100 dark:border-rose-500/20">
      <div>
        <p className="text-[10px] font-bold text-rose-400 uppercase tracking-widest">Drill Assigned</p>
        <p className="text-sm font-bold text-slate-800 dark:text-white">{focus.drill}</p>
      </div>
      <button
        onClick={onNavigate}
        className="flex items-center gap-1 bg-rose-500 hover:bg-rose-600 text-white text-xs font-bold px-3 py-2 rounded-lg transition-colors"
      >
        Start <ArrowRight className="h-3.5 w-3.5" />
      </button>
    </div>
  </div>
);

/** Predicted Readiness Card */
const PredictedReadinessCard = ({ readiness }: { readiness: typeof READINESS }) => {
  const statusConfig = {
    "on-track": { icon: <CheckCircle2 className="h-5 w-5 text-emerald-500" />, color: "text-emerald-600", bg: "bg-emerald-50 dark:bg-emerald-500/10", border: "border-emerald-200 dark:border-emerald-500/25" },
    warn: { icon: <AlertTriangle className="h-5 w-5 text-amber-500" />, color: "text-amber-600", bg: "bg-amber-50 dark:bg-amber-500/10", border: "border-amber-200 dark:border-amber-500/25" },
    danger: { icon: <AlertTriangle className="h-5 w-5 text-red-500" />, color: "text-red-600", bg: "bg-red-50 dark:bg-red-500/10", border: "border-red-200 dark:border-red-500/25" },
  };
  const cfg = statusConfig[readiness.status as keyof typeof statusConfig];

  const targetDateFormatted = new Date(readiness.targetDate).toLocaleDateString("en-IN", {
    day: "numeric", month: "short", year: "numeric",
  });

  return (
    <div className={`h-full rounded-2xl border ${cfg.bg} ${cfg.border} p-5 shadow-sm`}>
      <div className="flex items-center gap-2 mb-3">
        <CalendarClock className="h-5 w-5 text-slate-500" />
        <h2 className="text-sm font-black text-slate-800 dark:text-white uppercase tracking-wider">
          Predicted Readiness
        </h2>
      </div>

      <div className="space-y-3">
        <div className="flex justify-between items-center">
          <span className="text-xs text-slate-500">Target Band</span>
          <span className="text-sm font-bold text-slate-800 dark:text-white">{readiness.targetBand}</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-xs text-slate-500">Exam Date</span>
          <span className="text-sm font-bold text-slate-800 dark:text-white">{targetDateFormatted}</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-xs text-slate-500">Days Left</span>
          <span className="text-sm font-bold text-slate-800 dark:text-white">{readiness.daysLeft} days</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-xs text-slate-500">Current Band</span>
          <span className="text-sm font-bold text-slate-800 dark:text-white">{readiness.currentOverall}</span>
        </div>
      </div>

      <div className={`mt-4 flex items-center gap-2 p-3 rounded-xl bg-white/60 dark:bg-slate-900/40 border ${cfg.border}`}>
        {cfg.icon}
        <p className={`text-xs font-bold ${cfg.color}`}>{readiness.trajectory}</p>
      </div>
    </div>
  );
};

/** Module Navigation Card */
const ModuleNavCard = ({ band, onNavigate }: { band: SkillBand; onNavigate: () => void }) => {
  const gap = band.target - band.score;
  return (
    <button
      onClick={onNavigate}
      className={`text-left w-full flex items-center gap-4 p-4 rounded-xl border transition-all duration-200 hover:scale-[1.01] hover:shadow-sm bg-white dark:bg-slate-900 ${band.border} group`}
    >
      <div className={`flex-shrink-0 h-11 w-11 rounded-xl flex items-center justify-center ${band.bg} ${band.color}`}>
        {band.icon}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-bold text-slate-800 dark:text-white">{band.skill}</p>
        <p className="text-xs text-slate-500">
          Band {band.score} → {band.target} &nbsp;·&nbsp;
          <span className="text-rose-500 font-semibold">-{gap.toFixed(1)} to go</span>
        </p>
        <div className="mt-1.5 h-1 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full ${band.color.replace("text-", "bg-")}`}
            style={{ width: `${Math.round((band.score / band.target) * 100)}%` }}
          />
        </div>
      </div>
      <ChevronRight className="h-4 w-4 text-slate-300 group-hover:text-slate-500 transition-colors flex-shrink-0" />
    </button>
  );
};

// ─── SHARED CARD WRAPPER ──────────────────────────────────────────────────────

const DashboardCard = ({ title, subtitle, children, icon }: any) => (
  <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-100 dark:border-slate-800 shadow-sm h-full">
    <div className="mb-4">
      <h2 className="text-sm font-black text-slate-800 dark:text-white flex items-center gap-2 uppercase tracking-wider">
        {icon && <span>{icon}</span>} {title}
      </h2>
      {subtitle && <p className="text-xs text-slate-500 mt-0.5">{subtitle}</p>}
    </div>
    {children}
  </div>
);

// ─── SMALL HELPERS ────────────────────────────────────────────────────────────

const ActivityItem = ({ label, time, color }: any) => (
  <div className="flex gap-3 relative">
    <div className={`mt-1.5 h-2 w-2 rounded-full shrink-0 ${color} ring-4 ring-white dark:ring-slate-900 z-10`} />
    <div className="text-sm">
      <p className="text-slate-700 dark:text-slate-300 font-medium leading-tight">{label}</p>
      <div className="flex items-center gap-1 text-slate-400 text-xs mt-1">
        <Clock className="h-3 w-3" /> {time}
      </div>
    </div>
  </div>
);

const GoalItem = ({ label, current, total, color }: any) => (
  <div className="space-y-1.5">
    <div className="flex justify-between text-xs font-semibold">
      <span className="text-slate-600 dark:text-slate-400">{label}</span>
      <span className="text-slate-400">{current}/{total}</span>
    </div>
    <div className="h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
      <div
        className={`h-full ${color} transition-all duration-500`}
        style={{ width: `${(current / total) * 100}%` }}
      />
    </div>
  </div>
);

const AttendanceStreakTracker = ({ currentStreak, goal = 7 }: any) => {
  const progress = Math.min((currentStreak / goal) * 100, 100);
  return (
    <div className="flex flex-col items-center py-2">
      <div className="relative flex items-center justify-center h-20 w-20 mb-3">
        <svg className="rotate-[-90deg]" width="80" height="80">
          <circle cx="40" cy="40" r="32" fill="none" stroke="#fed7aa" strokeWidth="7" />
          <circle
            cx="40" cy="40" r="32" fill="none" stroke="#f97316" strokeWidth="7"
            strokeDasharray={`${2 * Math.PI * 32}`}
            strokeDashoffset={`${2 * Math.PI * 32 * (1 - progress / 100)}`}
            strokeLinecap="round"
            className="transition-all duration-700 ease-out"
          />
        </svg>
        <div className="absolute flex flex-col items-center">
          <Flame className="h-5 w-5 text-orange-500" />
          <span className="text-lg font-black text-slate-800 dark:text-white leading-none">{currentStreak}</span>
        </div>
      </div>
      <p className="text-xs font-bold text-slate-700 dark:text-slate-300 text-center">
        {currentStreak >= goal ? "Weekly goal hit! 🎉" : `${goal - currentStreak} more to reach ${goal}-day goal`}
      </p>
    </div>
  );
};

export default StudentDashboardPage;