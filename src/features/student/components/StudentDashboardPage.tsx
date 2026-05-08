import React, { useState, useEffect, useRef, useCallback } from "react";
import { StudentSidebar } from "./dashboard/StudentSidebar";
import { StudentTopbar } from "./dashboard/StudentTopbar";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { PremiumModal } from "@/features/payment/components/PremiumModal";
import { useNavigate, useLocation } from "react-router-dom";
import { callBackend } from "@/features/auth/services/authClient";
import { useMomentum } from "@/features/student/Context/MomentumContext";
import { cn } from "@/shared/utils";
import {
  Clock, Flame, Trophy, Target, Zap, BookOpen, Mic, PenLine,
  Headphones, CalendarClock, CheckCircle2, ArrowRight, Sparkles,
  Lock, ShieldAlert, CalendarX2, AlertTriangle,
  Stamp, Star, ChevronRight,
} from "lucide-react";

import {
  readPassport,
  completedSlotCount,
  allSlotsComplete,
  type PassportSlot,
  type SkillPassport,
  PASSPORT_BONUS_PTS,
  PASSPORT_STREAK_BONUS_PTS,
} from '@/features/student/utils/passportUtils';

// ─── TYPES & CONSTANTS ────────────────────────────────────────────────────────

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

const SKILL_BANDS: SkillBand[] = [
  { skill: "Listening", score: 0.0, target: 0.0, delta: 0.0, route: "/student/listening",           icon: <Headphones className="h-5 w-5" />, color: "text-sky-600",    bg: "bg-sky-50 dark:bg-sky-500/10",       border: "border-sky-200 dark:border-sky-500/30"      },
  { skill: "Reading",   score: 0.0, target: 0.0, delta: 0.0, route: "/student/reading",             icon: <BookOpen   className="h-5 w-5" />, color: "text-violet-600", bg: "bg-violet-50 dark:bg-violet-500/10", border: "border-violet-200 dark:border-violet-500/30" },
  { skill: "Writing",   score: 0.0, target: 0.0, delta: 0.0, route: "/student/writing",             icon: <PenLine    className="h-5 w-5" />, color: "text-amber-600",  bg: "bg-amber-50 dark:bg-amber-500/10",   border: "border-amber-200 dark:border-amber-500/30"  },
  { skill: "Speaking",  score: 0.0, target: 0.0, delta: 0.0, route: "/student/speaking-assessment", icon: <Mic        className="h-5 w-5" />, color: "text-rose-600",   bg: "bg-rose-50 dark:bg-rose-500/10",     border: "border-rose-200 dark:border-rose-500/30"    },
];

const READINESS = {
  targetBand: 7.5, targetDate: "2026-06-15", currentOverall: 5.5,
  trajectory: "At current pace: 6.5 by June 15", status: "on-track", daysLeft: 83,
};
const LEVEL = { label: "Intermediate", tier: "B2", color: "bg-indigo-100 text-indigo-700 dark:bg-indigo-500/20 dark:text-indigo-300" };

// ─── UTILS ────────────────────────────────────────────────────────────────────

const overallBand = (bands: SkillBand[]) =>
  Math.round((bands.reduce((s, b) => s + b.score, 0) / bands.length) * 2) / 2;

const getLevelFromScore = (score: number): string => {
  if (score < 5.0) return 'BEGINNER';
  if (score < 7.0) return 'INTERMEDIATE';
  return 'ADVANCED';
};

const buildMissCycleKey = (missCount: number): string => {
  const now = new Date();
  const startOfYear = new Date(now.getFullYear(), 0, 1);
  const week = Math.ceil(((now.getTime() - startOfYear.getTime()) / 86400000 + startOfYear.getDay() + 1) / 7);
  return `${now.getFullYear()}-W${String(week).padStart(2, "0")}_miss${missCount}`;
};

// ─── PASSPORT CARD ────────────────────────────────────────────────────────────

interface PassportSlotConfig {
  slot:   PassportSlot;
  label:  string;
  icon:   React.ReactNode;
  route:  string;
  color:  string;
  bg:     string;
  border: string;
  tip:    string;
}

const PASSPORT_SLOTS: PassportSlotConfig[] = [
  { slot: 'speaking',   label: 'Speaking',   icon: <Mic        className="w-4 h-4" />, route: '/student/drill',     color: 'text-rose-600 dark:text-rose-400',     bg: 'bg-rose-50 dark:bg-rose-500/10',     border: 'border-rose-200 dark:border-rose-500/25',     tip: 'Complete any drill session'     },
  { slot: 'vocabulary', label: 'Vocabulary', icon: <Sparkles   className="w-4 h-4" />, route: '/student/lexigrid',  color: 'text-indigo-600 dark:text-indigo-400', bg: 'bg-indigo-50 dark:bg-indigo-500/10', border: 'border-indigo-200 dark:border-indigo-500/25', tip: 'Play LexiGrid'     },
  { slot: 'writing',    label: 'Writing',    icon: <PenLine    className="w-4 h-4" />, route: '/student/writing',   color: 'text-amber-600 dark:text-amber-400',   bg: 'bg-amber-50 dark:bg-amber-500/10',   border: 'border-amber-200 dark:border-amber-500/25',   tip: 'Submit one writing task'        },
  { slot: 'reading',    label: 'Reading',    icon: <BookOpen   className="w-4 h-4" />, route: '/student/reading',   color: 'text-violet-600 dark:text-violet-400', bg: 'bg-violet-50 dark:bg-violet-500/10', border: 'border-violet-200 dark:border-violet-500/25', tip: 'Complete one reading passage'   },
  { slot: 'listening',  label: 'Listening',  icon: <Headphones className="w-4 h-4" />, route: '/student/listening', color: 'text-sky-600 dark:text-sky-400',       bg: 'bg-sky-50 dark:bg-sky-500/10',       border: 'border-sky-200 dark:border-sky-500/25',       tip: 'Complete one listening section' },
];

const PassportCard = ({ isLocked }: { isLocked: boolean }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [passport, setPassport] = useState<SkillPassport>(() => readPassport());

  useEffect(() => {
    setPassport(readPassport());
    const refresh = () => setPassport(readPassport());
    window.addEventListener('focus', refresh);
    return () => window.removeEventListener('focus', refresh);
  }, [location]);

  const done        = completedSlotCount(passport.slots);
  const total       = 5;
  const pct         = Math.round((done / total) * 100);
  const isAll       = allSlotsComplete(passport.slots);
  const streakCount = passport.completedWeeks?.length ?? 0;

  return (
    <div className={cn(
      "bg-white dark:bg-slate-900 rounded-3xl border shadow-sm overflow-hidden transition-all duration-500",
      isAll ? "border-emerald-300 dark:border-emerald-500/40" : "border-slate-200 dark:border-slate-800",
      isLocked && "opacity-50 pointer-events-none"
    )}>
      {/* Header */}
      <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-slate-100 dark:border-slate-800">
        <div className="flex items-center gap-3">
          <div className={cn("p-2 rounded-xl", isAll ? "bg-emerald-100 dark:bg-emerald-500/20" : "bg-indigo-50 dark:bg-indigo-500/10")}>
            <Stamp className={cn("w-4 h-4", isAll ? "text-emerald-600 dark:text-emerald-400" : "text-indigo-600 dark:text-indigo-400")} />
          </div>
          <div>
            <h2 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-wider">This Week's Passport</h2>
            <p className="text-[10px] text-slate-400 font-medium mt-0.5">
              Complete all 5 slots → <span className="text-amber-500 font-bold">+{PASSPORT_BONUS_PTS} Momentum</span>
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          {streakCount > 0 && (
            <div className="flex items-center gap-1.5 bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 px-2.5 py-1 rounded-full">
              <Flame className="w-3.5 h-3.5 text-amber-500" />
              <span className="text-xs font-black text-amber-600 dark:text-amber-400">{streakCount}w</span>
            </div>
          )}
          <div className={cn(
            "text-xs font-black px-3 py-1.5 rounded-full border",
            isAll
              ? "bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/30"
              : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700"
          )}>
            {done}/{total}
          </div>
        </div>
      </div>

      {/* Progress bar */}
      <div className="px-6 pt-3 pb-1">
        <div className="h-1.5 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
          <div className={cn("h-full rounded-full transition-all duration-700", isAll ? "bg-emerald-500" : "bg-indigo-500")} style={{ width: `${pct}%` }} />
        </div>
      </div>

      {/* Slots */}
      <div className="grid grid-cols-5 gap-0 divide-x divide-slate-100 dark:divide-slate-800 px-6 py-4">
        {PASSPORT_SLOTS.map(({ slot, label, icon, route, color, bg, border, tip }) => {
          const stamped = passport.slots[slot];
          return (
            <button
              key={slot}
              onClick={() => !stamped && navigate(route)}
              disabled={stamped}
              title={stamped ? `${label} — done ✓` : tip}
              className={cn(
                "flex flex-col items-center gap-2 py-3 px-2 rounded-xl transition-all duration-200 group relative",
                stamped ? "cursor-default" : "hover:bg-slate-50 dark:hover:bg-slate-800/50 cursor-pointer active:scale-95"
              )}
            >
              <div className={cn(
                "w-9 h-9 rounded-xl flex items-center justify-center border transition-all duration-300",
                stamped ? "bg-emerald-100 dark:bg-emerald-500/20 border-emerald-300 dark:border-emerald-500/30" : cn(bg, border)
              )}>
                {stamped ? <CheckCircle2 className="w-4 h-4 text-emerald-500" /> : <span className={color}>{icon}</span>}
              </div>
              <span className={cn(
                "text-[9px] font-black uppercase tracking-wider leading-none text-center",
                stamped ? "text-emerald-600 dark:text-emerald-400" : "text-slate-500 dark:text-slate-400"
              )}>
                {label}
              </span>
              {stamped && <div className="absolute inset-0 rounded-xl bg-emerald-500/5 pointer-events-none" />}
              {!stamped && <ChevronRight className="w-3 h-3 text-slate-300 dark:text-slate-600 absolute bottom-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity" />}
            </button>
          );
        })}
      </div>

      {/* Completion banner */}
      {isAll && (
        <div className="mx-6 mb-5 flex items-center gap-3 p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20">
          <Star className="w-5 h-5 text-emerald-500 fill-emerald-500 shrink-0" />
          <div>
            <p className="text-sm font-black text-emerald-700 dark:text-emerald-400">Full Passport this week! +{PASSPORT_BONUS_PTS} Momentum awarded.</p>
            {streakCount >= 2 && (
              <p className="text-xs text-emerald-600/80 dark:text-emerald-400/70 font-medium mt-0.5">
                {streakCount >= 3 ? `3-week streak! +${PASSPORT_STREAK_BONUS_PTS} bonus awarded 🔥` : `${streakCount} weeks in a row — 1 more for the streak bonus!`}
              </p>
            )}
          </div>
        </div>
      )}

      {/* Footer */}
      {!isAll && (
        <div className="px-6 pb-4">
          <p className="text-[10px] text-slate-400 font-medium">
            {streakCount === 0
              ? `Complete all 5 this week to start your streak. 3 consecutive weeks → +${PASSPORT_STREAK_BONUS_PTS} bonus.`
              : streakCount < 3
              ? `${streakCount} week${streakCount > 1 ? 's' : ''} in a row — ${3 - streakCount} more for +${PASSPORT_STREAK_BONUS_PTS} streak bonus.`
              : `Active 3-week streak 🔥 Keep it going!`
            }
          </p>
        </div>
      )}
    </div>
  );
};

// ─── MAIN COMPONENT ───────────────────────────────────────────────────────────

const StudentDashboardPage = () => {
  const [activeTab, setActiveTab]                   = useState("dashboard");
  const [showPremiumModal, setShowPremiumModal]     = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(true);
  const [isSidebarHovered, setIsSidebarHovered]     = useState(false);
  const [skillBands, setSkillBands]                 = useState<SkillBand[]>(SKILL_BANDS);
  const [nextActionDrill, setNextActionDrill]       = useState<any>(null);
  const [targetBand, setTargetBand]                 = useState(READINESS.targetBand);

  const [dailyDrillState, setDailyDrillState] = useState<{
    drills_completed_today: number;
    lexigrid_completed_today: boolean;
    dashboard_unlocked: boolean;
    next_action: string;
    can_buy_extra: boolean;
    sessions_remaining: number;
    momentum_score: number;
    daily_streak: number;
    daily_dcs: number;
    extra_session_cost: number;
    dcs_threshold: number;
  } | null>(null);
  const [buyingExtra, setBuyingExtra]   = useState(false);
  const [confirmExtra, setConfirmExtra] = useState(false);

  const { user, profile }                                        = useAuth();
  const navigate                                                 = useNavigate();
  const location                                                 = useLocation();
  const { applyMissPenalty, syncMomentum, updateStreak, totalMomentum } = useMomentum();
  const tutorAlertFiredRef = useRef(false);

  const MOCK_MISSED_STATE = 1;
  const missedData = {
    misses:    MOCK_MISSED_STATE,
    subSkills: MOCK_MISSED_STATE === 1 ? ["Grammar"] : ["Grammar", "Coherence"],
  };

  const dynamicReadiness = { ...READINESS, targetBand };
  if (missedData.misses === 1) {
    dynamicReadiness.targetDate = "2026-06-19"; dynamicReadiness.daysLeft = 87;
    dynamicReadiness.status = "warn"; dynamicReadiness.trajectory = "Slight delay: 6.5 by June 19";
  } else if (missedData.misses >= 2) {
    dynamicReadiness.targetDate = "2026-06-23"; dynamicReadiness.daysLeft = 91;
    dynamicReadiness.status = "danger"; dynamicReadiness.trajectory = "Off track: Intervention required";
  }

  const displayName = profile?.name || user?.email?.split("@")[0] || "Student";
  const overall     = overallBand(skillBands);
  const isLocked    = !dailyDrillState || !dailyDrillState.dashboard_unlocked || missedData.misses >= 2;

  // ─── Fetch helpers ────────────────────────────────────────────────────────────

  const fetchDailyDrillState = useCallback(async (skipMomentumSync = false) => {
    try {
      const backendUrl = import.meta.env.VITE_BACKEND_URL || "http://localhost:4000";
      const resData = await callBackend(`${backendUrl}/api/student/daily-drill-state`);
      if (resData.success) {
        setDailyDrillState(resData);
        if (!skipMomentumSync) syncMomentum(resData.momentum_score, false); 
        if (resData.daily_streak !== undefined) updateStreak(resData.daily_streak);
        if (resData.target_band  !== undefined) setTargetBand(Number(resData.target_band));
      }
    } catch (err) { console.error("[DailyDrillState] Fetch failed:", err); }
  }, [syncMomentum, updateStreak]);

  const fetchNextActionDrill = useCallback(async () => {
    try {
      const backendUrl = import.meta.env.VITE_BACKEND_URL || "http://localhost:4000";
      const resData = await callBackend(`${backendUrl}/api/student/next-action-drill`);
      if (resData.success) {
        setNextActionDrill(resData.recommended_drills?.length > 0
          ? resData.recommended_drills[0]
          : { sub_skill: "All Caught Up!", skill: "Overall", sub_skill_score: 9.0 });
      } else {
        setNextActionDrill({ sub_skill: "General Practice", skill: "Overall", sub_skill_score: 5.5 });
      }
    } catch (err) {
      console.error("[NextActionDrill] Fetch failed:", err);
      setNextActionDrill({ sub_skill: "General Practice", skill: "Overall", sub_skill_score: 5.5 });
    }
  }, []);

  // ─── Effects ─────────────────────────────────────────────────────────────────

  useEffect(() => {
    if (missedData.misses === 1)      applyMissPenalty(1, buildMissCycleKey(1));
    else if (missedData.misses >= 2) { applyMissPenalty(1, buildMissCycleKey(1)); applyMissPenalty(2, buildMissCycleKey(2)); }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [missedData.misses]);

  useEffect(() => {
    if (missedData.misses < 2 || tutorAlertFiredRef.current) return;
    const fire = async () => {
      tutorAlertFiredRef.current = true;
      try {
        const backendUrl = import.meta.env.VITE_BACKEND_URL || "http://localhost:4000";
        await callBackend(`${backendUrl}/api/student/tutor-alert`, {
          method: "POST",
          body: JSON.stringify({
            student_name: displayName, student_email: user?.email,
            missed_sub_skills: missedData.subSkills, consecutive_misses: missedData.misses,
          last_login: new Date().toISOString(), exam_days_remaining: dynamicReadiness.daysLeft,
          }),
        });
      } catch { tutorAlertFiredRef.current = false; }
    };
    fire();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [missedData.misses]);

  useEffect(() => {
    const fetchCompetencyScores = async () => {
      try {
        const backendUrl = import.meta.env.VITE_BACKEND_URL || "http://localhost:4000";
        const resData = await callBackend(`${backendUrl}/api/student/competency-scores`);
        if (resData.success && resData.data) {
          const fetchedTarget = Number(resData.target_band) || 7.0;
          setTargetBand(fetchedTarget);
          setSkillBands(prev => prev.map(band => {
            const db = resData.data.find((m: any) => m.skill.toUpperCase() === band.skill.toUpperCase());
            return db
              ? { ...band, score: Number(db.band_score) || 0.0, target: fetchedTarget, delta: 0, subScores: db.sub_scores || {} }
              : { ...band, target: fetchedTarget };
          }));
        }
      } catch (err) { console.error("[CompetencyScores] Fetch failed:", err); }
    };

    fetchCompetencyScores();
    fetchNextActionDrill();

    const isReturningFromGame = location.state?.drillCompleted || location.state?.lexigridCompleted;
    fetchDailyDrillState(!!isReturningFromGame);

    if (isReturningFromGame) {
      window.history.replaceState({}, document.title);
    }

  }, [fetchDailyDrillState, fetchNextActionDrill, location.state]);

  const focusData = nextActionDrill
    ? { sub_skill: nextActionDrill.sub_skill, band: nextActionDrill.sub_skill_score ?? 5.0, skill: nextActionDrill.skill }
    : { sub_skill: "Loading...", band: 5.0, skill: "Overall" };

  // ─── Render ───────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-[#020617] transition-colors duration-300">
      <StudentSidebar
        activeTab={activeTab} onTabChange={setActiveTab}
        isCollapsed={isSidebarCollapsed} toggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
        isLocked={isLocked} isNewStudent={false}
        onMouseEnter={() => setIsSidebarHovered(true)} onMouseLeave={() => setIsSidebarHovered(false)}
      />

      <div className={cn("min-h-screen flex flex-col transition-all duration-300 ease-in-out pl-0", isSidebarHovered && !isLocked ? "md:pl-[288px]" : "md:pl-[116px]")}>
        <StudentTopbar onUpgradeClick={() => setShowPremiumModal(true)} />

        <main className="flex-1 p-4 sm:p-6 lg:p-8 space-y-6 relative">

          {isLocked && <div className="absolute inset-0 z-40 bg-slate-50/60 dark:bg-slate-950/60 backdrop-blur-md rounded-3xl" />}

          {/* ── Hero Banner ── */}
          <section className={cn("relative overflow-hidden rounded-3xl bg-gradient-to-r from-indigo-600 via-indigo-500 to-purple-600 p-8 text-white shadow-lg", isLocked && "relative z-50")}>
            <div className="pointer-events-none absolute -right-10 -top-10 h-48 w-48 rounded-full bg-white/10 blur-2xl" />
            <div className="pointer-events-none absolute right-24 bottom-0 h-28 w-28 rounded-full bg-purple-400/30 blur-xl" />
            <div className="relative z-10 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <div className="flex items-center gap-3 mb-1">
                  <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Welcome back, {displayName} 👋</h1>
                  <span className="hidden sm:inline-flex items-center gap-1 rounded-full bg-white/20 px-3 py-1 text-xs font-bold text-white backdrop-blur-sm border border-white/30">
                    <Trophy className="h-3.5 w-3.5" /> {LEVEL.tier} · {LEVEL.label}
                  </span>
                </div>
                <p className="text-indigo-100 max-w-xl text-sm sm:text-base">
                  You're on a <span className="font-bold text-white">{dailyDrillState?.daily_streak ?? 0}-day streak</span> — great momentum! Overall band: <span className="font-bold text-white">{overall}</span>.
                </p>
                </div>
              <div className="flex-shrink-0 flex flex-col sm:flex-row gap-3">
                <div className="text-center bg-white/15 border border-white/30 backdrop-blur-sm rounded-2xl px-6 py-3">
                  <p className="text-xs font-bold text-indigo-200 uppercase tracking-widest mb-0.5">Overall Band</p>
                  <p className="text-4xl font-black text-white leading-none">{overall}</p>
                  <p className="text-xs text-indigo-200 mt-0.5">Target: {dynamicReadiness.targetBand}</p>
                </div>
                <div className="text-center bg-white/15 border border-white/30 backdrop-blur-sm rounded-2xl px-6 py-3">
                  <p className="text-xs font-bold text-indigo-200 uppercase tracking-widest mb-0.5 flex items-center justify-center gap-1"><Zap className="h-3 w-3" /> Momentum</p>
                  <p className="text-4xl font-black text-white leading-none">{totalMomentum}</p>
                  <p className="text-xs text-indigo-200 mt-0.5">pts</p>
                </div>
              </div>
            </div>
          </section>

          {/* ── Passport Card ── */}
          <div className={cn("transition-all duration-500", isLocked && "relative z-50")}>
            <PassportCard isLocked={isLocked} />
          </div>

          {/* ── Missed Assessment Alerts ── */}
          <div className={cn("transition-all duration-500", isLocked && "relative z-50")}>
            {missedData.misses === 1 && (
              <div className="bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/30 rounded-3xl p-6 shadow-sm flex items-start gap-4">
                <div className="bg-amber-100 dark:bg-amber-500/20 p-3 rounded-2xl shrink-0"><CalendarX2 className="w-6 h-6 text-amber-600 dark:text-amber-400" /></div>
                <div>
                  <h3 className="text-amber-900 dark:text-amber-300 font-bold text-lg">Assessment Missed</h3>
                  <p className="text-amber-700/80 dark:text-amber-400/80 text-sm mt-1">
                    You missed your recent <strong className="font-semibold text-amber-900 dark:text-amber-300">{missedData.subSkills.join(", ")}</strong> assessment.
                    No band penalty applied, but <strong className="font-bold text-amber-600 dark:text-amber-400">−20 Momentum</strong> points were deducted.
                  </p>
                </div>
              </div>
            )}
            {missedData.misses >= 2 && (
              <div className="bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/30 rounded-3xl p-6 shadow-[0_8px_30px_rgba(244,63,94,0.15)] flex flex-col md:flex-row items-center gap-6">
                <div className="bg-rose-100 dark:bg-rose-500/20 p-4 rounded-2xl shrink-0"><ShieldAlert className="w-8 h-8 text-rose-600 dark:text-rose-400" /></div>
                <div className="flex-1">
                  <h3 className="text-rose-900 dark:text-rose-300 font-black text-xl uppercase tracking-tight">Intervention Required</h3>
                  <p className="text-rose-700/90 dark:text-rose-400/90 text-sm mt-1">
                    You have missed 2 consecutive assessments ({missedData.subSkills.join(" & ")}). Readiness pushed back,
                    <strong className="font-bold"> −40 Momentum</strong> deducted, tutor notified.
                  </p>
                </div>
                <button onClick={() => navigate("/student/internal")} className="w-full md:w-auto bg-rose-600 hover:bg-rose-700 text-white font-bold py-3.5 px-6 rounded-xl shrink-0 transition-colors shadow-md">
                  Start Catch-Up Session
                </button>
              </div>
            )}
          </div>

          {/* ── Platform Lock Banner ── */}
          {isLocked && missedData.misses < 2 && dailyDrillState && (
            <div className="relative z-50 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-2xl shadow-xl flex items-center justify-between animate-in slide-in-from-top-4">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-indigo-100 dark:bg-indigo-500/20 rounded-full flex items-center justify-center">
                  <Lock className="w-6 h-6 text-indigo-500" />
                </div>
                <div>
                  <h3 className="text-lg font-black text-slate-900 dark:text-white uppercase">Platform Locked</h3>
                  <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
                    {dailyDrillState.next_action === 'DRILL_1'
                      ? <><strong className="text-indigo-500">2 drills</strong> required to unlock the full platform.</>
                      : dailyDrillState.next_action === 'LEXIGRID'
                        ? <>Complete <strong className="text-teal-500">LexiGrid</strong> (5 words) to unlock Drill 2.</>
                        : <>1 more drill to unlock full access.</>
                    }
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* ── Focus Area + LexiGrid ── */}
          <section className={cn("transition-all duration-500", isLocked && "relative z-50 animate-in slide-in-from-bottom-4")}>
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

              {missedData.misses < 2 && (() => {
                const drillsToday    = dailyDrillState?.drills_completed_today ?? 0;
                const nextAction     = dailyDrillState?.next_action ?? 'DRILL_1';
                const dailyDCS       = dailyDrillState?.daily_dcs ?? 0;
                const dcsThreshold   = dailyDrillState?.dcs_threshold ?? 75;
                const drillsToUnlock = Math.max(0, 2 - drillsToday);

                const handleBuyExtra = async () => {
                  setBuyingExtra(true); setConfirmExtra(false);
                  try {
                    const backendUrl = import.meta.env.VITE_BACKEND_URL || "http://localhost:4000";
                    const res = await callBackend(`${backendUrl}/api/drills/authorize-extra`, { method: 'POST' });
                    if (res.success) {
                      syncMomentum(res.momentum_score, true);
                      const params = new URLSearchParams({ skill: focusData.skill, sub_skill: focusData.sub_skill, level: getLevelFromScore(focusData.band), extra: 'true' });
                      navigate(`/student/drill?${params.toString()}`);
                      return;
                    }
                    setBuyingExtra(false);
                  } catch { setBuyingExtra(false); }
                };

                const handleStartDrill = () => {
                  const params = new URLSearchParams({
                    skill: focusData.skill, sub_skill: focusData.sub_skill, level: getLevelFromScore(focusData.band),
                    ...(nextAction === 'EXTRA_DRILL_AVAILABLE' ? { extra: 'true' } : {})
                  });
                  navigate(`/student/drill?${params.toString()}`);
                };

                return (
                  <div className="lg:col-span-6 h-full">
                    <FocusAreaCard
                      sub_skill={focusData.sub_skill} band={focusData.band} skill={focusData.skill}
                      isLocked={isLocked} drillsLeft={drillsToUnlock} nextAction={nextAction}
                      dailyDCS={dailyDCS} dcsThreshold={dcsThreshold}
                      extraCost={dailyDrillState?.extra_session_cost ?? 75} totalMomentum={totalMomentum}
                      buyingExtra={buyingExtra} confirmExtra={confirmExtra}
                      onStartDrill={handleStartDrill} onRequestConfirm={() => setConfirmExtra(true)}
                      onCancelConfirm={() => setConfirmExtra(false)} onConfirmBuy={handleBuyExtra}
                    />
                  </div>
                );
              })()}

              {(() => {
                const isLexiGate  = dailyDrillState?.next_action === 'LEXIGRID';
                const lexiDone    = dailyDrillState?.lexigrid_completed_today ?? false;
                const lexiBlocked = !isLexiGate && isLocked && !lexiDone;

                const handleLexiGridClick = () => {
                  if (lexiBlocked) return;
                  const params = new URLSearchParams({ difficulty: getLevelFromScore(overall) });
                  if (isLexiGate) params.set('mode', 'gate');
                  navigate(`/student/lexigrid?${params.toString()}`);
                };

                return (
                  <div className={cn(missedData.misses < 2 ? "lg:col-span-6" : "lg:col-span-12", "h-full", lexiBlocked && "opacity-40 grayscale pointer-events-none blur-[2px]")}>
                    <div
                      onClick={handleLexiGridClick}
                      className={cn(
                        "h-full relative overflow-hidden rounded-3xl bg-slate-900 dark:bg-[#0f172a] p-6 flex flex-col justify-center group shadow-lg transition-all duration-300",
                        isLexiGate ? "border-2 border-teal-500/60 cursor-pointer hover:shadow-teal-500/20" : "border border-indigo-500/30 cursor-pointer hover:shadow-indigo-500/20"
                      )}
                    >
                      <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 blur-[50px] group-hover:bg-indigo-500/20 transition-colors" />
                      <div className="relative z-10 flex items-start gap-5">
                        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-500/20 to-purple-500/20 border border-indigo-400/30 flex items-center justify-center flex-shrink-0">
                          <Sparkles className="w-7 h-7 text-amber-400" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2 mb-2">
                            <h2 className="text-xl font-bold text-white tracking-tight">LexiGrid</h2>
                            {isLexiGate && <span className="bg-teal-500/20 text-teal-300 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase animate-pulse">Active Gate</span>}
                            {lexiDone   && <span className="bg-green-500/20 text-green-400 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase">✓ Done</span>}
                            {!isLexiGate && !lexiDone && <span className="bg-amber-500/20 text-amber-400 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase">Ready</span>}
                          </div>
                          <p className="text-sm text-indigo-100/70 font-medium mb-4">
                            {isLexiGate
                              ? <><strong className="text-teal-300">Solve 5 words</strong> to unlock Drill 2 — your gate is open now.</>
                              : <>Crack today's vocabulary puzzle to earn <strong className="text-amber-400">+10 Momentum</strong>.</>
                            }
                          </p>
                          <button className="bg-white/10 hover:bg-white/20 text-white font-semibold text-sm py-2 px-4 rounded-lg transition-colors flex items-center gap-2">
                            {lexiDone ? "Play Again" : "Play Now"} <ArrowRight className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })()}
            </div>
          </section>

          {/* ── Main Dashboard Content ── */}
          <div className="relative mt-6">
            {isLocked && <div className="absolute inset-0 z-40 bg-slate-50/60 dark:bg-[#020617]/70 backdrop-blur-md rounded-3xl border border-white/10 flex flex-col items-center pt-24" />}
            <div className={cn("space-y-6 transition-all duration-500", isLocked && "opacity-40 grayscale-[50%] pointer-events-none select-none blur-[3px]")}>
              <section>
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                  {skillBands.map(band => <SkillBandCard key={band.skill} band={band} onNavigate={() => navigate(band.route)} />)}
                </div>
              </section>
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                <div className="lg:col-span-5"><WeeklyRhythmIndicator /></div>
                <div className="lg:col-span-4"><PredictedReadinessCard readiness={dynamicReadiness} /></div>
                <div className="lg:col-span-3">
                  <DashboardCard title="Streak" icon={<Flame className="h-5 w-5 text-orange-500" />}>
                    <AttendanceStreakTracker currentStreak={dailyDrillState?.daily_streak ?? 0} goal={7} />
                  </DashboardCard>
                </div>
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                <div className="lg:col-span-8">
                  <DashboardCard title="Skill Modules" subtitle="Tap any module to continue">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {skillBands.map(band => <ModuleNavCard key={band.skill} band={band} onNavigate={() => navigate(band.route)} />)}
                    </div>
                  </DashboardCard>
                </div>
                <div className="lg:col-span-4 space-y-4">
                  <DashboardCard title="Recent Activity" subtitle="Your last 3 actions">
                    <div className="space-y-5 pt-1">
                      <ActivityItem label="Completed Reading Comprehension Set 3" time="2 hours ago" color="bg-emerald-500" />
                      <ActivityItem label="Scored 78% in Speaking Mock Test" time="Yesterday" color="bg-indigo-500" />
                    </div>
                  </DashboardCard>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>

      <PremiumModal isOpen={showPremiumModal} onClose={() => setShowPremiumModal(false)} />
    </div>
  );
};

// ─── SUB-COMPONENTS ───────────────────────────────────────────────────────────

const FocusAreaCard = ({
  sub_skill, band, skill, isLocked, drillsLeft, nextAction, dailyDCS, dcsThreshold,
  extraCost, totalMomentum, buyingExtra, confirmExtra,
  onStartDrill, onRequestConfirm, onCancelConfirm, onConfirmBuy
}: any) => {
  if (band === 9.0 && sub_skill === "All Caught Up!") {
    return (
      <div className="h-full rounded-3xl border border-emerald-200 dark:border-emerald-500/20 p-6 bg-emerald-50 dark:bg-emerald-500/10 flex flex-col items-center justify-center text-center shadow-sm">
        <div className="h-16 w-16 rounded-full bg-emerald-100 dark:bg-emerald-500/20 flex items-center justify-center mb-4"><CheckCircle2 className="h-8 w-8 text-emerald-500" /></div>
        <h2 className="text-lg font-bold text-slate-800 dark:text-white mb-2 tracking-tight">Daily Priorities Knocked Out!</h2>
        <p className="text-sm text-slate-500 dark:text-slate-400">You have completed the required drills for your weakest sub-skills today.</p>
      </div>
    );
  }

  const isFreeDrill    = ['DRILL_1', 'DRILL_2', 'DRILL_3'].includes(nextAction);
  const isLexiGate     = nextAction === 'LEXIGRID';
  const isExtraReady   = nextAction === 'EXTRA_DRILL_AVAILABLE';
  const isExtraPrepaid = nextAction === 'EXTRA_DRILL_READY';
  const isLowDCS       = nextAction === 'DRILL_LOCKED_LOW_DCS';
  const isLowPts       = nextAction === 'DRILL_LOCKED_INSUFFICIENT_PTS';
  const isExtraLocked  = isLowDCS || isLowPts || isExtraReady || isExtraPrepaid;
  const showDCSMeter   = isLowDCS || isLowPts || isExtraReady;

  const cardBg = isLocked
    ? "bg-white dark:bg-slate-900 border-indigo-200 dark:border-indigo-500/30 ring-1 ring-indigo-500/20"
    : isExtraLocked ? "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700"
    : "bg-indigo-50 dark:bg-indigo-500/10 border-indigo-200 dark:border-indigo-500/25";

  return (
    <div className={cn("h-full rounded-3xl border p-6 flex flex-col transition-all duration-500 shadow-sm", cardBg)}>
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2"><Zap className="h-5 w-5 text-indigo-500" /><h2 className="text-sm font-bold text-slate-800 dark:text-white uppercase tracking-wider">Next Best Action</h2></div>
        {isLocked && drillsLeft > 0 && <span className="text-[10px] font-bold uppercase tracking-wider bg-indigo-100 text-indigo-600 dark:bg-indigo-500/20 dark:text-indigo-400 px-3 py-1 rounded-full animate-pulse">Required: {drillsLeft} Left</span>}
        {isExtraLocked && <span className="text-[10px] font-bold uppercase tracking-wider bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400 px-3 py-1 rounded-full">3 / 3 Done</span>}
      </div>
      <div className="flex items-center gap-5 mb-6">
        <div className="flex-shrink-0 h-16 w-16 rounded-2xl bg-indigo-100 dark:bg-indigo-500/20 flex items-center justify-center border border-indigo-200 dark:border-indigo-500/30"><Target className="h-8 w-8 text-indigo-500" /></div>
        <div>
          <p className="text-xl font-bold text-slate-800 dark:text-white leading-snug tracking-tight mb-1 capitalize">{sub_skill} Drill</p>
          <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
            <span>{skill}</span><span className="w-1 h-1 rounded-full bg-slate-300 dark:bg-slate-600" /><span>Sub-score: <strong className="text-indigo-600 dark:text-indigo-400">{band.toFixed(1)}</strong></span>
          </div>
        </div>
      </div>
      <div className="mt-auto space-y-3">
        {showDCSMeter && (
          <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Daily Competency Score</p>
                <p className="text-base font-black text-slate-800 dark:text-white">{dailyDCS}%<span className="text-xs font-normal text-slate-400 ml-1">/ need {dcsThreshold}%</span></p>
              </div>
              <span className={cn("text-[10px] font-bold px-2.5 py-1 rounded-full", dailyDCS >= dcsThreshold ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400" : "bg-rose-100 text-rose-700 dark:bg-rose-500/20 dark:text-rose-400")}>
                {dailyDCS >= dcsThreshold ? "✓ Eligible" : "Not eligible"}
              </span>
            </div>
            <div className="w-full h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
              <div className={cn("h-full rounded-full transition-all duration-500", dailyDCS >= dcsThreshold ? "bg-emerald-500" : "bg-rose-400")} style={{ width: `${Math.min(100, dailyDCS)}%` }} />
            </div>
          </div>
        )}
        {isLexiGate    && <div className="w-full flex items-center justify-center gap-2 bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500 font-semibold text-sm py-3.5 rounded-xl border border-slate-200 dark:border-slate-700 cursor-not-allowed select-none"><Lock className="h-4 w-4" /> Complete LexiGrid to unlock</div>}
        {isLowDCS      && <div className="w-full flex items-center justify-center gap-2 bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500 font-semibold text-sm py-3.5 rounded-xl border border-slate-200 dark:border-slate-700 cursor-not-allowed select-none"><Lock className="h-4 w-4" /> Improve accuracy to unlock extra</div>}
        {isLowPts      && <div className="w-full flex items-center justify-center gap-2 bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500 font-semibold text-sm py-3.5 rounded-xl border border-slate-200 dark:border-slate-700 cursor-not-allowed select-none"><Lock className="h-4 w-4" /> Need {extraCost} pts to unlock</div>}
        {isExtraPrepaid && <button onClick={onStartDrill} className="w-full flex items-center justify-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-sm py-3.5 rounded-xl transition-all shadow-md active:scale-[0.98]"><CheckCircle2 className="h-4 w-4" /> Start Extra Drill — Session Ready</button>}
        {isExtraReady && !confirmExtra && <button onClick={onRequestConfirm} disabled={buyingExtra} className="w-full flex items-center justify-center gap-2 bg-amber-500 hover:bg-amber-600 text-white font-bold text-sm py-3.5 rounded-xl transition-all shadow-md active:scale-[0.98] disabled:opacity-40"><Zap className="h-4 w-4" /> Unlock Extra Drill — {extraCost} pts</button>}
        {isExtraReady && confirmExtra && (
          <div className="space-y-2">
            <p className="text-xs text-slate-500 dark:text-slate-400 text-center">Spend <strong className="text-amber-500">{extraCost} pts</strong> from your {totalMomentum} pts balance?</p>
            <div className="flex gap-2">
              <button onClick={onCancelConfirm} className="flex-1 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 font-semibold text-sm hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">Cancel</button>
              <button onClick={onConfirmBuy} disabled={buyingExtra} className="flex-1 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-sm transition-colors disabled:opacity-40">{buyingExtra ? "Unlocking…" : `Confirm — Spend ${extraCost} pts`}</button>
            </div>
          </div>
        )}
        {isFreeDrill && <button onClick={onStartDrill} className="w-full flex items-center justify-center gap-2 bg-indigo-500 hover:bg-indigo-600 text-white font-semibold text-sm py-3.5 rounded-xl transition-all shadow-md hover:shadow-lg active:scale-[0.98]">Start Priority Drill <ArrowRight className="h-4 w-4" /></button>}
      </div>
    </div>
  );
};

const SkillBandCard = ({ band, onNavigate }: { band: SkillBand; onNavigate: () => void }) => {
  const pct = Math.round((band.score / 9) * 100);
  return (
    <button onClick={onNavigate} className={`text-left w-full rounded-3xl border p-5 flex flex-col transition-all duration-200 hover:scale-[1.02] hover:shadow-md bg-white dark:bg-slate-900 ${band.border} shadow-sm`}>
      <div className="flex items-center justify-between mb-4 w-full"><div className={`flex items-center justify-center h-10 w-10 rounded-xl ${band.bg} ${band.color}`}>{band.icon}</div></div>
      <p className="text-3xl font-bold text-slate-800 dark:text-white tracking-tight">{band.score.toFixed(1)}</p>
      <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mt-1 mb-4">{band.skill}</p>
      <div className="h-1.5 w-full rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden mb-4">
        <div className={`h-full rounded-full transition-all duration-700 ${band.color.replace("text-", "bg-")}`} style={{ width: `${pct}%` }} />
      </div>
      {band.subScores && Object.keys(band.subScores).length > 0 && (
        <div className="grid grid-cols-2 gap-2 w-full mt-auto">
          {Object.entries(band.subScores).filter(([key, val]) => {
            const n = Number(val);
            if (isNaN(n) || n > 9.0) return false;
            const k = key.toLowerCase();
            return !k.includes("count") && !k.includes("total") && !k.includes("correct");
          }).map(([key, val]) => {
            let label = key.replace(/Score/g,"").replace(/_/g," ").replace(/([A-Z])/g," $1").trim();
            label = label.charAt(0).toUpperCase() + label.slice(1);
            const n = Number(val);
            return (
              <div key={key} className="flex justify-between items-center text-[10px] bg-slate-50 dark:bg-slate-800/50 px-2 py-1.5 rounded-lg border border-slate-100 dark:border-slate-800">
                <span className="text-slate-500 truncate mr-1" title={label}>{label}</span>
                <span className="font-bold text-slate-700 dark:text-slate-300">{!Number.isInteger(n) ? n.toFixed(1) : n}</span>
              </div>
            );
          })}
        </div>
      )}
    </button>
  );
};

const PredictedReadinessCard = ({ readiness }: any) => {
  const cfg = ({
    "on-track": { icon: <CheckCircle2 className="h-5 w-5 text-emerald-500" />, color: "text-emerald-600", bg: "bg-emerald-50 dark:bg-emerald-500/5", border: "border-emerald-200 dark:border-emerald-500/20" },
    warn:       { icon: <AlertTriangle className="h-5 w-5 text-amber-500" />,  color: "text-amber-600",  bg: "bg-amber-50 dark:bg-amber-500/5",   border: "border-amber-200 dark:border-amber-500/20"  },
    danger:     { icon: <AlertTriangle className="h-5 w-5 text-red-500" />,    color: "text-red-600",    bg: "bg-red-50 dark:bg-red-500/5",       border: "border-red-200 dark:border-red-500/20"      },
  } as any)[readiness.status];
  return (
    <div className={`h-full rounded-3xl border ${cfg.bg} ${cfg.border} p-6 shadow-sm flex flex-col`}>
      <div className="flex items-center gap-2 mb-4"><CalendarClock className="h-5 w-5 text-slate-500" /><h2 className="text-sm font-bold text-slate-800 dark:text-white uppercase tracking-wider">Predicted Readiness</h2></div>
      <div className="space-y-4 mt-2">
        <div className="flex justify-between items-center"><span className="text-sm text-slate-500">Target Band</span><span className="text-base font-semibold text-slate-800 dark:text-white">{readiness.targetBand}</span></div>
        <div className="flex justify-between items-center"><span className="text-sm text-slate-500">Days Left</span><span className="text-base font-semibold text-slate-800 dark:text-white">{readiness.daysLeft} days</span></div>
        <div className="flex justify-between items-center pt-2 border-t border-slate-200/50 dark:border-slate-700/50"><span className="text-sm text-slate-500 font-medium">Exam Date</span><span className="text-sm font-bold text-slate-700 dark:text-slate-300">{readiness.targetDate}</span></div>
      </div>
      <div className={`mt-auto pt-4 flex items-center gap-2 p-3 rounded-xl bg-white/60 dark:bg-slate-900/40 border ${cfg.border}`}>{cfg.icon}<p className={`text-xs font-bold ${cfg.color}`}>{readiness.trajectory}</p></div>
    </div>
  );
};

const ModuleNavCard = ({ band, onNavigate }: any) => (
  <button onClick={onNavigate} className={`text-left w-full flex items-center gap-4 p-4 rounded-2xl border transition-all duration-200 hover:scale-[1.01] hover:shadow-sm bg-white dark:bg-slate-900 ${band.border} group`}>
    <div className={`flex-shrink-0 h-12 w-12 rounded-xl flex items-center justify-center ${band.bg} ${band.color}`}>{band.icon}</div>
    <div className="flex-1 min-w-0"><p className="text-sm font-bold text-slate-800 dark:text-white">{band.skill}</p><p className="text-xs text-slate-500 mt-0.5">Band {band.score} → {band.target}</p></div>
  </button>
);

const DashboardCard = ({ title, subtitle, children, icon }: any) => (
  <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm h-full">
    <div className="mb-5"><h2 className="text-sm font-bold text-slate-800 dark:text-white flex items-center gap-2 uppercase tracking-wider">{icon && <span>{icon}</span>} {title}</h2>{subtitle && <p className="text-xs text-slate-500 mt-1">{subtitle}</p>}</div>
    {children}
  </div>
);

const ActivityItem = ({ label, time, color }: any) => (
  <div className="flex gap-4 relative">
    <div className={`mt-1.5 h-2.5 w-2.5 rounded-full shrink-0 ${color} ring-4 ring-white dark:ring-slate-900 z-10`} />
    <div className="text-sm border-l-2 border-slate-100 dark:border-slate-800 pl-4 pb-4 -ml-[19px]">
      <p className="text-slate-700 dark:text-slate-300 font-medium leading-tight">{label}</p>
      <div className="flex items-center gap-1.5 text-slate-400 text-xs mt-1.5"><Clock className="h-3 w-3" /> {time}</div>
    </div>
  </div>
);

const AttendanceStreakTracker = ({ currentStreak, goal = 7 }: any) => {
  const progress = Math.min((currentStreak / goal) * 100, 100);
  return (
    <div className="flex flex-col items-center py-2">
      <div className="relative flex items-center justify-center h-24 w-24 mb-4">
        <svg className="rotate-[-90deg]" width="96" height="96">
          <circle cx="48" cy="48" r="40" fill="none" stroke="#fed7aa" strokeWidth="8" className="dark:stroke-orange-500/20" />
          <circle cx="48" cy="48" r="40" fill="none" stroke="#f97316" strokeWidth="8"
            strokeDasharray={`${2*Math.PI*40}`}
            strokeDashoffset={`${2*Math.PI*40*(1-progress/100)}`}
            strokeLinecap="round" className="transition-all duration-700 ease-out" />
        </svg>
        <div className="absolute flex flex-col items-center"><Flame className="h-6 w-6 text-orange-500" /><span className="text-xl font-bold text-slate-800 dark:text-white leading-none mt-1">{currentStreak}</span></div>
      </div>
      <p className="text-sm font-medium text-slate-500 dark:text-slate-400 text-center">{currentStreak >= goal ? "Weekly goal hit! 🎉" : `${goal - currentStreak} more to reach ${goal}-day goal`}</p>
    </div>
  );
};

const WEEKLY_RHYTHM = [
  { day: "Mon", color: "blue",   text: "Priority sub-skill drill (15 min)" },
  { day: "Tue", color: "blue",   text: "Same sub-skill, new prompts (15 min)" },
  { day: "Wed", color: "purple", text: "Mid-Week Priority Assessment (20 min)" },
  { day: "Thu", color: "blue",   text: "Secondary sub-skill drill (15 min)" },
  { day: "Fri", color: "teal",   text: "Apply Lesson & Mini-Drill (15 min)" },
  { day: "Sat", color: "amber",  text: "Full Weekly Assessment (45 min)" },
  { day: "Sun", color: "slate",  text: "Rest & Recovery" },
];
const colorConfig: Record<string, any> = {
  blue:   { bg: "bg-blue-500",   border: "border-blue-500",   text: "text-blue-600 dark:text-blue-400",     ring: "ring-blue-500/30"   },
  purple: { bg: "bg-purple-500", border: "border-purple-500", text: "text-purple-600 dark:text-purple-400", ring: "ring-purple-500/30" },
  teal:   { bg: "bg-teal-500",   border: "border-teal-500",   text: "text-teal-600 dark:text-teal-400",     ring: "ring-teal-500/30"   },
  amber:  { bg: "bg-amber-500",  border: "border-amber-500",  text: "text-amber-600 dark:text-amber-400",   ring: "ring-amber-500/30"  },
  slate:  { bg: "bg-slate-400",  border: "border-slate-300 dark:border-slate-600", text: "text-slate-500 dark:text-slate-400", ring: "ring-slate-400/30" },
};

const WeeklyRhythmIndicator = () => {
  const jsDay = new Date().getDay();
  const currentDayIndex = jsDay === 0 ? 6 : jsDay - 1;
  const todayConfig = WEEKLY_RHYTHM[currentDayIndex];
  return (
    <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm h-full flex flex-col justify-center">
      <div className="flex items-center justify-between gap-1 mb-6 relative px-2 mt-2">
        <div className="absolute left-4 right-4 top-2 h-0.5 bg-slate-100 dark:bg-slate-800 z-0" />
        {WEEKLY_RHYTHM.map((day, idx) => {
          const isToday  = idx === currentDayIndex;
          const isFuture = idx > currentDayIndex;
          const colors   = colorConfig[day.color];
          return (
            <div key={day.day} className="relative z-10 flex flex-col items-center gap-3">
              <div className={`w-4 h-4 rounded-full transition-all duration-300 ${isFuture ? `bg-white dark:bg-slate-900 border-2 ${colors.border}` : colors.bg} ${isToday ? `ring-4 ring-offset-2 dark:ring-offset-slate-900 ${colors.ring} scale-125` : ""}`} />
              <span className={`text-[10px] font-bold uppercase tracking-widest ${isToday ? "text-slate-800 dark:text-white" : "text-slate-400 dark:text-slate-500"}`}>{day.day}</span>
            </div>
          );
        })}
      </div>
      <div className="bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700/50 rounded-2xl p-4 text-center">
        <p className="text-sm font-medium text-slate-600 dark:text-slate-300">Today: <span className={`ml-1 font-semibold ${colorConfig[todayConfig.color].text}`}>{todayConfig.text}</span></p>
      </div>
    </div>
  );
};

export default StudentDashboardPage;