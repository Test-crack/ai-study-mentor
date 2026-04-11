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
  ChevronRight,
  Zap,
  BookOpen,
  Mic,
  PenLine,
  Headphones,
  CalendarClock,
  AlertTriangle,
  CheckCircle2,
  ArrowRight,
  Sparkles,
} from "lucide-react";

// ─── TYPES ───────────────────────────────────────────────────────────────────

interface SkillBand {
  skill: "Listening" | "Reading" | "Writing" | "Speaking";
  score: number;
  target: number;
  delta: number;
  route: string;
  icon: React.ReactNode;
  color: string;
  bg: string;
  border: string;
  subScores?: Record<string, number | string>;
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

const READINESS = {
  targetBand: 7.5,
  targetDate: "2026-06-15",
  currentOverall: 5.5,
  trajectory: "At current pace: 6.5 by June 15",
  status: "warn",
  daysLeft: 83,
};

const LEVEL = { label: "Intermediate", tier: "B2", color: "bg-indigo-100 text-indigo-700 dark:bg-indigo-500/20 dark:text-indigo-300" };

// ─── UTILS & TIE-BREAKER LOGIC (FE-10) ────────────────────────────────────────

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

// FE-10: Strict tie-breaker priority (lower number = wins tie)
const TIE_BREAKER_PRIORITY: Record<string, number> = {
  pronunciation: 1,
  fluency: 2,
  grammar: 3,
  vocabulary: 4,
  coherence: 5,
  taskresponse: 6,
};

const normalizeKey = (key: string) => key.toLowerCase().replace(/score|_/g, '');

const getPriorityFocusArea = (bands: SkillBand[], completedToday: string[]) => {
  let lowestFocus = {
    sub_skill: "All Caught Up!", // Replaced "General Practice"
    band: 9.0, // Start high
    skill: "Overall",
    priorityRank: 999
  };

  bands.forEach(band => {
    if (!band.subScores) return;

    Object.entries(band.subScores).forEach(([key, value]) => {
      // Ignore raw metrics like word count, total questions (anything over a 9.0 band or not a number)
      if (typeof value !== 'number' || value > 9.0) return;
      if (key.toLowerCase().includes('count') || key.toLowerCase().includes('total') || key.toLowerCase().includes('correct')) return;

      let displayName = key.replace(/Score/g, '').replace(/_/g, ' ').replace(/([A-Z])/g, ' $1').trim();
      displayName = displayName.charAt(0).toUpperCase() + displayName.slice(1);

      // 🚀 THE MAGIC: Skip this sub-skill if it was already completed today!
      if (completedToday.includes(displayName)) return;

      const normalizedKey = normalizeKey(key);
      const priorityRank = TIE_BREAKER_PRIORITY[normalizedKey] || 99;

      // Apply Tie-Breaker Logic
      if (value < lowestFocus.band) {
        lowestFocus = { sub_skill: displayName, band: value, skill: band.skill, priorityRank };
      } else if (value === lowestFocus.band) {
        if (priorityRank < lowestFocus.priorityRank) {
          lowestFocus = { sub_skill: displayName, band: value, skill: band.skill, priorityRank };
        }
      }
    });
  });

  return lowestFocus;
};

// ─── MAIN COMPONENT ──────────────────────────────────────────────────────────

const StudentDashboardPage = () => {
  const [activeTab, setActiveTab] = useState("dashboard");
  const [showPremiumModal, setShowPremiumModal] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [currentStreak, setCurrentStreak] = useState(0);
  const [skillBands, setSkillBands] = useState<SkillBand[]>(SKILL_BANDS);
  const [completedDrills, setCompletedDrills] = useState<string[]>([]);
  const { user, profile } = useAuth();
  const navigate = useNavigate();

  const displayName = profile?.name || user?.email?.split("@")[0] || "Student";
  const overall = overallBand(skillBands);

  // Load completed drills for the day
  useEffect(() => {
    const todayDate = new Date().toISOString().split('T')[0];
    const storedDrills = localStorage.getItem('completed_drills_today');
    if (storedDrills) {
      const parsed = JSON.parse(storedDrills);
      if (parsed.date === todayDate) {
        setCompletedDrills(parsed.completed);
      } else {
        localStorage.removeItem('completed_drills_today');
      }
    }
  }, []);

  useEffect(() => {
    const fetchCompetencyScores = async () => {
      try {
        const backendUrl = import.meta.env.VITE_BACKEND_URL || "http://localhost:4000";
        const fullUrl = `${backendUrl}/api/student/competency-scores`;
        
        const resData = await callBackend(fullUrl);
        
        if (resData.success && resData.data) {
          const fetchedTarget = resData.target_band || 7.0;
          
          setSkillBands((prevBands) => {
            return prevBands.map(band => {
              const dbRecord = resData.data.find(
                (m: any) => m.skill.toUpperCase() === band.skill.toUpperCase()
              );
              
              if (dbRecord) {
                return { 
                  ...band, 
                  score: Number(dbRecord.band_score) || 0.0, 
                  target: Number(fetchedTarget) || 7.0,
                  delta: 0,
                  subScores: dbRecord.sub_scores || {} 
                };
              }
              return { ...band, target: Number(fetchedTarget) || 7.0 };
            });
          });
        }
      } catch (err) {
        console.error("Failed to fetch competency matrix", err);
      }
    };
    
    fetchCompetencyScores();

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
            <div className="pointer-events-none absolute -right-10 -top-10 h-48 w-48 rounded-full bg-white/10 blur-2xl" />
            <div className="pointer-events-none absolute right-24 bottom-0 h-28 w-28 rounded-full bg-purple-400/30 blur-xl" />

            <div className="relative z-10 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <div className="flex items-center gap-3 mb-1">
                  <h1 className="text-2xl sm:text-3xl font-bold">
                    Welcome back, {displayName} 👋
                  </h1>
                  <span className="hidden sm:inline-flex items-center gap-1 rounded-full bg-white/20 px-3 py-1 text-xs font-bold text-white backdrop-blur-sm border border-white/30">
                    <Trophy className="h-3.5 w-3.5" /> {LEVEL.tier} · {LEVEL.label}
                  </span>
                </div>
                <p className="text-indigo-100 max-w-xl text-sm sm:text-base">
                  You&apos;re on a <span className="font-bold text-white">{currentStreak}-day streak</span> — great momentum!
                  Your current overall band is{" "}
                  <span className="font-bold text-white">{overall}</span>.
                </p>
              </div>
              <div className="flex-shrink-0 text-center bg-white/15 border border-white/30 backdrop-blur-sm rounded-2xl px-6 py-3">
                <p className="text-xs font-bold text-indigo-200 uppercase tracking-widest mb-0.5">
                  Overall Band
                </p>
                <p className="text-4xl font-black text-white leading-none">{overall}</p>
                <p className="text-xs text-indigo-200 mt-0.5">Target: {READINESS.targetBand}</p>
              </div>
            </div>
          </section>

          {/* ── Daily Challenge Banner (Gamification) Moved to Top ── */}
          <section>
            <div 
              onClick={() => navigate('/student/lexigrid')}
              className="relative overflow-hidden rounded-2xl bg-slate-900 dark:bg-[#0B0F19] border border-indigo-500/30 p-6 sm:p-8 flex flex-col md:flex-row items-center justify-between gap-6 cursor-pointer group shadow-xl shadow-indigo-900/10 hover:shadow-indigo-500/20 hover:border-indigo-400/60 transition-all duration-500"
            >
              {/* Animated background glows */}
              <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-0">
                <div className="absolute -top-[50%] -left-[10%] w-[40%] h-[200%] bg-indigo-500/20 blur-[60px] group-hover:bg-indigo-500/30 transition-colors duration-700"></div>
                <div className="absolute top-[10%] -right-[5%] w-[30%] h-[150%] bg-purple-500/20 blur-[60px] group-hover:bg-purple-500/30 transition-colors duration-700"></div>
                {/* Subtle grid pattern overlay */}
                <div className="absolute inset-0 opacity-[0.03] bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGNpcmNsZSBjeD0iMiIgY3k9IjIiIHI9IjIiIGZpbGw9IiNmZmZmZmYiLz48L3N2Zz4=')]"></div>
              </div>

              <div className="relative z-10 flex flex-col sm:flex-row items-center sm:items-start text-center sm:text-left gap-5 md:gap-6">
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-indigo-500/20 to-purple-500/20 border border-indigo-400/40 flex items-center justify-center flex-shrink-0 group-hover:scale-110 group-hover:rotate-12 transition-transform duration-500 shadow-[0_0_20px_rgba(99,102,241,0.3)]">
                  <Sparkles className="w-8 h-8 text-amber-400 drop-shadow-md" />
                </div>
                <div>
                  <div className="flex flex-col sm:flex-row items-center gap-2 mb-2">
                    <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">Daily Challenge</h2>
                    <span className="bg-gradient-to-r from-amber-500 to-orange-500 text-white text-[10px] font-black px-2.5 py-1 rounded-full uppercase tracking-wider shadow-sm">
                      Ready to Play
                    </span>
                  </div>
                  <p className="text-sm sm:text-base text-indigo-100/80 font-medium max-w-xl">
                    Crack today's <strong className="text-white">LexiGrid</strong> vocabulary puzzle to build your exam vocabulary and instantly earn <strong className="text-amber-400">+15 Momentum Points</strong>.
                  </p>
                </div>
              </div>

              <div className="relative z-10 w-full md:w-auto shrink-0">
                <button className="w-full md:w-auto bg-white text-indigo-900 font-black text-sm uppercase tracking-widest py-4 px-8 rounded-xl shadow-[0_0_20px_rgba(255,255,255,0.1)] group-hover:shadow-[0_0_25px_rgba(255,255,255,0.2)] group-hover:bg-indigo-50 transition-all duration-300 flex items-center justify-center gap-2 active:scale-95">
                  Enter LexiGrid <ArrowRight className="w-4 h-4 group-hover:translate-x-1.5 transition-transform" />
                </button>
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

            {/* FE-10 Focus Area Card & FE-16 Rhythm Indicator */}
            <div className="lg:col-span-5 flex flex-col h-full gap-4">
              {(() => {
                const focusData = getPriorityFocusArea(skillBands, completedDrills);
                return (
                  <div className="flex-1">
                    <FocusAreaCard 
                      sub_skill={focusData.sub_skill} 
                      band={focusData.band}
                      skill={focusData.skill}
                      onStart={() => {
                        const params = new URLSearchParams({
                          skill: focusData.skill,
                          sub_skill: focusData.sub_skill
                        });
                        navigate(`/student/drill?${params.toString()}`);
                      }} 
                    />
                  </div>
                );
              })()}
              
              {/* FE-16 Added Here */}
              <div>
                 <WeeklyRhythmIndicator />
              </div>

            </div>

            <div className="lg:col-span-4">
              <PredictedReadinessCard readiness={READINESS} />
            </div>

            <div className="lg:col-span-3">
              <DashboardCard title="Streak" icon={<Flame className="h-5 w-5 text-orange-500" />}>
                <AttendanceStreakTracker currentStreak={currentStreak} goal={7} />
              </DashboardCard>
            </div>
          </div>

          {/* ── Third Row: Modules Nav + Activity ──────────────────── */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-8">
              <DashboardCard title="Skill Modules" subtitle="Tap any module to continue">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {skillBands.map((band) => (
                    <ModuleNavCard key={band.skill} band={band} onNavigate={() => navigate(band.route)} />
                  ))}
                </div>
              </DashboardCard>
            </div>

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

const SkillBandCard = ({ band, onNavigate }: { band: SkillBand; onNavigate: () => void }) => {
  const pct = Math.round((band.score / 9) * 100);
  const isUp = band.delta >= 0;

  return (
    <button
      onClick={onNavigate}
      className={`text-left w-full rounded-2xl border p-4 sm:p-5 flex flex-col transition-all duration-200 hover:scale-[1.02] hover:shadow-md bg-white dark:bg-slate-900 ${band.border} shadow-sm`}
    >
      <div className="flex items-center justify-between mb-3 w-full">
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

      <p className="text-2xl font-black text-slate-800 dark:text-white">{band.score.toFixed(1)}</p>
      <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mt-0.5">{band.skill}</p>

      <div className="mt-3 h-1.5 w-full rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-700 ${band.color.replace("text-", "bg-")}`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <p className="text-[10px] text-slate-400 mt-1 mb-3">Target: {band.target}</p>

      {/* Renders ONLY actual band scores in the Skill Card (filters out word counts, etc) */}
      {band.subScores && Object.keys(band.subScores).length > 0 && (
        <div className="grid grid-cols-2 gap-1.5 border-t border-slate-100 dark:border-slate-700/50 pt-3 mt-auto w-full">
          {Object.entries(band.subScores)
            .filter(([key, val]) => {
              if (typeof val !== 'number' || val > 9.0) return false;
              const k = key.toLowerCase();
              if (k.includes('count') || k.includes('total') || k.includes('correct')) return false;
              return true;
            })
            .map(([key, val]) => {
              let label = key.replace(/Score/g, '').replace(/_/g, ' ').replace(/([A-Z])/g, ' $1').trim();
              label = label.charAt(0).toUpperCase() + label.slice(1);

              return (
                <div key={key} className="flex justify-between items-center text-[10px] bg-slate-50 dark:bg-slate-800/50 px-1.5 py-1 rounded">
                  <span className="text-slate-500 truncate mr-1" title={label}>{label}</span>
                  <span className="font-bold text-slate-700 dark:text-slate-300">
                    {typeof val === 'number' && !Number.isInteger(val) ? val.toFixed(1) : val}
                  </span>
                </div>
              );
          })}
        </div>
      )}
    </button>
  );
};

/** FE-10: Strict Implementation of Focus Area Card */
interface FocusAreaProps {
  sub_skill: string;
  band: number;
  skill: string;
  onStart: () => void;
}

const FocusAreaCard = ({ sub_skill, band, skill, onStart }: FocusAreaProps) => {
  // Show a success card if all drills are knocked out
  if (band === 9.0 && sub_skill === "All Caught Up!") {
    return (
      <div className="h-full rounded-2xl border p-5 bg-emerald-50 dark:bg-emerald-500/10 border-emerald-200 dark:border-emerald-500/25 shadow-sm flex flex-col items-center justify-center text-center">
        <div className="h-16 w-16 rounded-full bg-emerald-100 dark:bg-emerald-500/20 flex items-center justify-center mb-4">
          <CheckCircle2 className="h-8 w-8 text-emerald-500" />
        </div>
        <h2 className="text-lg font-black text-slate-800 dark:text-white mb-2">Daily Priorities Knocked Out!</h2>
        <p className="text-sm text-slate-500 dark:text-slate-400">You have completed the required drills for your weakest sub-skills today. Great job keeping your momentum up!</p>
      </div>
    );
  }

  return (
    <div className="h-full rounded-2xl border p-5 bg-rose-50 dark:bg-rose-500/10 border-rose-200 dark:border-rose-500/25 shadow-sm flex flex-col">
      <div className="flex items-center gap-2 mb-3">
        <Zap className="h-5 w-5 text-rose-500" />
        <h2 className="text-sm font-black text-slate-800 dark:text-white uppercase tracking-wider">
          Next Best Action
        </h2>
      </div>

      <div className="flex items-start gap-4">
        <div className="flex-shrink-0 h-14 w-14 rounded-2xl bg-rose-100 dark:bg-rose-500/20 flex items-center justify-center">
          <Target className="h-7 w-7 text-rose-500" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-base font-bold text-slate-800 dark:text-white leading-snug">
            Your priority: {sub_skill}
          </p>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Skill: <span className="font-semibold text-slate-700 dark:text-slate-300">{skill}</span>{" "}
            · Sub-score:{" "}
            <span className="font-semibold text-rose-600 dark:text-rose-400">{band.toFixed(1)}</span>
          </p>
        </div>
      </div>

      <div className="mt-auto pt-4">
        <div className="flex items-center justify-between bg-white/60 dark:bg-slate-900/40 rounded-xl p-3 border border-rose-100 dark:border-rose-500/20">
          <div>
            <p className="text-[10px] font-bold text-rose-400 uppercase tracking-widest">Action Required</p>
            <p className="text-sm font-bold text-slate-800 dark:text-white">{sub_skill} Drill</p>
          </div>
          <button
            onClick={onStart}
            className="flex items-center gap-1 bg-rose-500 hover:bg-rose-600 text-white text-xs font-bold px-4 py-2.5 rounded-lg transition-colors shadow-sm"
          >
            Start Drill <ArrowRight className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};

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

// ─── FE-16: WEEKLY RHYTHM INDICATOR ───────────────────────────────────────────

const WEEKLY_RHYTHM = [
  { day: "Mon", type: "Drill", color: "blue", text: "Priority sub-skill drill (15 min)" },
  { day: "Tue", type: "Drill", color: "blue", text: "Same sub-skill, new prompts (15 min)" },
  { day: "Wed", type: "Assessment", color: "purple", text: "Mid-Week Priority Assessment (20 min)" },
  { day: "Thu", type: "Drill", color: "blue", text: "Secondary sub-skill drill (15 min)" },
  { day: "Fri", type: "Content", color: "teal", text: "Apply Lesson & Mini-Drill (15 min)" },
  { day: "Sat", type: "Eval", color: "amber", text: "Full Weekly Assessment (45 min)" },
  { day: "Sun", type: "Rest", color: "slate", text: "Rest & Recovery" },
];

const colorConfig: Record<string, any> = {
  blue: { bg: 'bg-blue-500', border: 'border-blue-500', text: 'text-blue-600 dark:text-blue-400', ring: 'ring-blue-500/30' },
  purple: { bg: 'bg-purple-500', border: 'border-purple-500', text: 'text-purple-600 dark:text-purple-400', ring: 'ring-purple-500/30' },
  teal: { bg: 'bg-teal-500', border: 'border-teal-500', text: 'text-teal-600 dark:text-teal-400', ring: 'ring-teal-500/30' },
  amber: { bg: 'bg-amber-500', border: 'border-amber-500', text: 'text-amber-600 dark:text-amber-400', ring: 'ring-amber-500/30' },
  slate: { bg: 'bg-slate-400', border: 'border-slate-300 dark:border-slate-600', text: 'text-slate-500 dark:text-slate-400', ring: 'ring-slate-400/30' },
};

const WeeklyRhythmIndicator = () => {
  // JS Date.getDay() gives 0 for Sunday. We shift it so Monday = 0, Sunday = 6.
  const jsDay = new Date().getDay();
  const currentDayIndex = jsDay === 0 ? 6 : jsDay - 1;
  const todayConfig = WEEKLY_RHYTHM[currentDayIndex];

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm">
      <div className="flex items-center justify-between gap-1 mb-5 relative px-2">
        {/* Background connecting line */}
        <div className="absolute left-4 right-4 top-2 h-0.5 bg-slate-100 dark:bg-slate-800 z-0" />
        
        {WEEKLY_RHYTHM.map((day, idx) => {
          const isCompleted = idx < currentDayIndex;
          const isToday = idx === currentDayIndex;
          const isFuture = idx > currentDayIndex;
          const colors = colorConfig[day.color];

          return (
            <div key={day.day} className="relative z-10 flex flex-col items-center gap-2">
              <div 
                className={`w-4 h-4 rounded-full transition-all duration-300 
                  ${isFuture ? `bg-white dark:bg-slate-900 border-2 ${colors.border}` : colors.bg} 
                  ${isToday ? `ring-4 ring-offset-2 dark:ring-offset-slate-900 ${colors.ring} scale-125` : ''}
                `}
              />
              <span className={`text-[10px] font-black uppercase tracking-wider ${isToday ? 'text-slate-800 dark:text-white' : 'text-slate-400 dark:text-slate-500'}`}>
                {day.day}
              </span>
            </div>
          );
        })}
      </div>

      <div className="bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700/50 rounded-xl p-3 text-center">
        <p className="text-xs font-bold text-slate-600 dark:text-slate-300">
          Today: <span className={`ml-1 ${colorConfig[todayConfig.color].text}`}>{todayConfig.text}</span>
        </p>
      </div>
    </div>
  );
};

export default StudentDashboardPage;