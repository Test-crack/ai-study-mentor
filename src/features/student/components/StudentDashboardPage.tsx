import { useState, useEffect, useRef } from "react";
import { StudentSidebar } from "./dashboard/StudentSidebar";
import { StudentTopbar } from "./dashboard/StudentTopbar";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { PremiumModal } from "@/features/payment/components/PremiumModal";
import { useNavigate } from "react-router-dom";
import { callBackend } from "@/features/auth/services/authClient";
import { useMomentum } from "@/features/student/Context/MomentumContext";
import { cn } from "@/shared/utils";
import {
  Clock, Flame, Trophy, Target, Zap, BookOpen, Mic, PenLine,
  Headphones, CalendarClock, CheckCircle2, ArrowRight, Sparkles,
  Lock, ShieldAlert, CalendarX2, AlertTriangle, Gamepad2, Bell,
} from "lucide-react";

// ─── TYPES ────────────────────────────────────────────────────────────────────

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

// ─── CONSTANTS ────────────────────────────────────────────────────────────────

const SKILL_BANDS: SkillBand[] = [
  { skill: "Listening", score: 0.0, target: 0.0, delta: 0.0, route: "/student/listening",           icon: <Headphones className="h-5 w-5" />, color: "text-sky-600",    bg: "bg-sky-50 dark:bg-sky-500/10",       border: "border-sky-200 dark:border-sky-500/30"     },
  { skill: "Reading",   score: 0.0, target: 0.0, delta: 0.0, route: "/student/reading",              icon: <BookOpen   className="h-5 w-5" />, color: "text-violet-600", bg: "bg-violet-50 dark:bg-violet-500/10", border: "border-violet-200 dark:border-violet-500/30"},
  { skill: "Writing",   score: 0.0, target: 0.0, delta: 0.0, route: "/student/writing",              icon: <PenLine    className="h-5 w-5" />, color: "text-amber-600",  bg: "bg-amber-50 dark:bg-amber-500/10",   border: "border-amber-200 dark:border-amber-500/30" },
  { skill: "Speaking",  score: 0.0, target: 0.0, delta: 0.0, route: "/student/speaking-assessment",  icon: <Mic        className="h-5 w-5" />, color: "text-rose-600",   bg: "bg-rose-50 dark:bg-rose-500/10",     border: "border-rose-200 dark:border-rose-500/30"   },
];

const READINESS = {
  targetBand: 7.5,
  targetDate: "2026-06-15",
  currentOverall: 5.5,
  trajectory: "At current pace: 6.5 by June 15",
  status: "on-track",
  daysLeft: 83,
};

const LEVEL = {
  label: "Intermediate",
  tier: "B2",
  color: "bg-indigo-100 text-indigo-700 dark:bg-indigo-500/20 dark:text-indigo-300",
};

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

const TIE_BREAKER_PRIORITY: Record<string, number> = {
  pronunciation: 1, fluency: 2, grammar: 3, vocabulary: 4, coherence: 5, taskresponse: 6,
};

const normalizeKey = (key: string) => key.toLowerCase().replace(/score|_/g, "");

const getPriorityFocusArea = (bands: SkillBand[], completedToday: string[]) => {
  let lowestFocus = { sub_skill: "All Caught Up!", band: 9.0, skill: "Overall", priorityRank: 999 };
  bands.forEach((band) => {
    if (!band.subScores) return;
    Object.entries(band.subScores).forEach(([key, value]) => {
      const numValue = Number(value);
      if (isNaN(numValue) || numValue > 9.0) return;
      const k = key.toLowerCase();
      if (k.includes("count") || k.includes("total") || k.includes("correct")) return;
      let displayName = key.replace(/Score/g, "").replace(/_/g, " ").replace(/([A-Z])/g, " $1").trim();
      displayName = displayName.charAt(0).toUpperCase() + displayName.slice(1);
      if (completedToday.includes(displayName)) return;
      const normalizedKey = normalizeKey(key);
      const priorityRank = TIE_BREAKER_PRIORITY[normalizedKey] || 99;
      if (numValue < lowestFocus.band) {
        lowestFocus = { sub_skill: displayName, band: numValue, skill: band.skill, priorityRank };
      } else if (numValue === lowestFocus.band && priorityRank < lowestFocus.priorityRank) {
        lowestFocus = { sub_skill: displayName, band: numValue, skill: band.skill, priorityRank };
      }
    });
  });
  return lowestFocus;
};

const buildMissCycleKey = (missCount: number): string => {
  const now = new Date();
  const startOfYear = new Date(now.getFullYear(), 0, 1);
  const week = Math.ceil(
    ((now.getTime() - startOfYear.getTime()) / 86400000 + startOfYear.getDay() + 1) / 7
  );
  return `${now.getFullYear()}-W${String(week).padStart(2, "0")}_miss${missCount}`;
};

// ─── LOCK HELPERS ─────────────────────────────────────────────────────────────

const readDrill2Accessed = (): boolean => {
  try {
    const today  = new Date().toISOString().split("T")[0];
    const stored = localStorage.getItem("drill2_accessed");
    if (!stored) return false;
    const parsed = JSON.parse(stored);
    return parsed.date === today && parsed.accessed === true;
  } catch { return false; }
};

const readDrillSessionCount = (): number => {
  try {
    const today  = new Date().toISOString().split("T")[0];
    const stored = localStorage.getItem("completed_drills_today");
    if (!stored) return 0;
    const parsed = JSON.parse(stored);
    if (parsed.date !== today) return 0;
    return parsed.sessionCount ?? (parsed.completed?.length || 0);
  } catch { return 0; }
};

// ─── DRILL ROUTING HELPER ─────────────────────────────────────────────────────
// No daily ceiling — always routes to the next drill number.
const getDrillAction = (): { action: "drill"; drillNumber: number } | { action: "lexigrid" } => {
  const today    = new Date().toISOString().split("T")[0];
  const sessions = readDrillSessionCount();

  // No drills yet → Drill 1
  if (sessions === 0) return { action: "drill", drillNumber: 1 };

  // After Drill 1 → LexiGrid gate (unless already cleared today)
  if (sessions === 1) {
    try {
      const gs = localStorage.getItem("lexigrid_gate_cleared");
      if (gs) {
        const p = JSON.parse(gs);
        if (p.date === today && p.cleared === true) {
          return { action: "drill", drillNumber: 2 };
        }
      }
    } catch { /* ignore */ }
    return { action: "lexigrid" };
  }

  // Sessions 2, 3, 4, 5 … → always next numbered drill, no ceiling
  return { action: "drill", drillNumber: sessions + 1 };
};

// ─── IA BANNER HELPER ─────────────────────────────────────────────────────────
type IABannerState =
  | { type: 'eligible_waiting'; hoursLeft: number; iaNumber: number; subSkill: string }
  | { type: 'window_open'; minutesLeft: number; iaNumber: number; subSkill: string }
  | { type: 'drills_progress'; drillCount: number; drillsLeft: number };

const getIABannerState = (): IABannerState | null => {
  try {
    const iaStored = localStorage.getItem('ia_tracker');
    if (iaStored) {
      const tracker = JSON.parse(iaStored);
      const w = tracker.currentWindow;
      if (w) {
        if (w.status === 'waiting') {
          const hoursLeft = Math.max(0, (new Date(w.windowOpensAt).getTime() - Date.now()) / 3600000);
          return { type: 'eligible_waiting', hoursLeft, iaNumber: w.iaNumber, subSkill: w.targetSubSkill };
        }
        if (w.status === 'open') {
          const isExpired = Date.now() > new Date(w.windowExpiresAt).getTime();
          if (!isExpired) {
            const minutesLeft = Math.max(0, (new Date(w.windowExpiresAt).getTime() - Date.now()) / 60000);
            return { type: 'window_open', minutesLeft, iaNumber: w.iaNumber, subSkill: w.targetSubSkill };
          }
        }
        return null;
      }
    }

    const totalStored = localStorage.getItem('total_drill_sessions');
    if (totalStored) {
      const parsed = JSON.parse(totalStored);
      const count = parsed.count || 0;
      if (count < 6) {
        return { type: 'drills_progress', drillCount: count, drillsLeft: 6 - count };
      }
    }

    return null;
  } catch { return null; }
};

const formatHoursLeft = (hours: number): string => {
  if (hours < 1) return `${Math.round(hours * 60)} min`;
  return `${Math.round(hours)}h`;
};

// ─── MAIN COMPONENT ───────────────────────────────────────────────────────────

const StudentDashboardPage = () => {
  const [activeTab,          setActiveTab]          = useState("dashboard");
  const [showPremiumModal,   setShowPremiumModal]   = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(true);
  const [isSidebarHovered,   setIsSidebarHovered]   = useState(false);
  const [currentStreak,      setCurrentStreak]      = useState(0);
  const [skillBands,         setSkillBands]         = useState<SkillBand[]>(SKILL_BANDS);
  const [completedDrills,    setCompletedDrills]    = useState<string[]>([]);
  const [drillSessionCount,  setDrillSessionCount]  = useState(readDrillSessionCount);
  const [drill2Accessed,     setDrill2Accessed]     = useState(readDrill2Accessed);
  const [iaBanner,           setIaBanner]           = useState<IABannerState | null>(null);

  const { user, profile }    = useAuth();
  const navigate             = useNavigate();
  const { applyMissPenalty } = useMomentum();
  const tutorAlertFiredRef   = useRef(false);

  // ── Mock missed data (swap with real backend) ─────────────────────────────
  const MOCK_MISSED_STATE = 1;
  const missedData = {
    misses:    MOCK_MISSED_STATE,
    subSkills: MOCK_MISSED_STATE === 1 ? ["Grammar"] : ["Grammar", "Coherence"],
  };

  const dynamicReadiness = { ...READINESS };
  if (missedData.misses === 1) {
    dynamicReadiness.targetDate = "2026-06-19"; dynamicReadiness.daysLeft = 87;
    dynamicReadiness.status = "warn"; dynamicReadiness.trajectory = "Slight delay: 6.5 by June 19";
  } else if (missedData.misses >= 2) {
    dynamicReadiness.targetDate = "2026-06-23"; dynamicReadiness.daysLeft = 91;
    dynamicReadiness.status = "danger"; dynamicReadiness.trajectory = "Off track: Intervention required";
  }

  const displayName = profile?.name || user?.email?.split("@")[0] || "Student";
  const overall     = overallBand(skillBands);

  // isLocked: only depends on drill2 access and missed assessments
  // fourth_drill_unlocked is gone — no longer part of lock logic
  const isLocked = !drill2Accessed || missedData.misses >= 2;

  // ── Listen for localStorage writes from drill/lexigrid/IA pages ───────────
  useEffect(() => {
    const handler = () => {
      setDrill2Accessed(readDrill2Accessed());
      setDrillSessionCount(readDrillSessionCount());
      setIaBanner(getIABannerState());
    };
    window.addEventListener("storage", handler);
    return () => window.removeEventListener("storage", handler);
  }, []);

  // ── Momentum penalties ────────────────────────────────────────────────────
  useEffect(() => {
    if (missedData.misses === 1) {
      applyMissPenalty(1, buildMissCycleKey(1));
    } else if (missedData.misses >= 2) {
      applyMissPenalty(1, buildMissCycleKey(1));
      applyMissPenalty(2, buildMissCycleKey(2));
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [missedData.misses]);

  // ── Tutor alert ───────────────────────────────────────────────────────────
  useEffect(() => {
    if (missedData.misses < 2 || tutorAlertFiredRef.current) return;
    const fireTutorAlert = async () => {
      tutorAlertFiredRef.current = true;
      try {
        const backendUrl = import.meta.env.VITE_BACKEND_URL || "http://localhost:4000";
        await callBackend(`${backendUrl}/api/student/tutor-alert`, {
          method: "POST",
          body: JSON.stringify({
            student_name:        displayName,
            student_email:       user?.email,
            missed_sub_skills:   missedData.subSkills,
            consecutive_misses:  missedData.misses,
            last_login:          new Date().toISOString(),
            exam_days_remaining: dynamicReadiness.daysLeft,
          }),
        });
      } catch (err) {
        console.error("[TutorAlert] Failed:", err);
        tutorAlertFiredRef.current = false;
      }
    };
    fireTutorAlert();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [missedData.misses]);

  // ── Competency scores + attendance ────────────────────────────────────────
  useEffect(() => {
    const todayDate = new Date().toISOString().split("T")[0];

    const storedDrills = localStorage.getItem("completed_drills_today");
    if (storedDrills) {
      try {
        const parsed = JSON.parse(storedDrills);
        if (parsed.date === todayDate) {
          setCompletedDrills(parsed.completed || []);
          setDrillSessionCount(parsed.sessionCount ?? (parsed.completed?.length || 0));
        } else {
          localStorage.removeItem("completed_drills_today");
        }
      } catch { /* ignore */ }
    }

    setIaBanner(getIABannerState());

    const fetchCompetencyScores = async () => {
      try {
        const backendUrl = import.meta.env.VITE_BACKEND_URL || "http://localhost:4000";
        const resData    = await callBackend(`${backendUrl}/api/student/competency-scores`);
        if (resData.success && resData.data) {
          const fetchedTarget = resData.target_band || 7.0;
          setSkillBands((prevBands) =>
            prevBands.map((band) => {
              const dbRecord = resData.data.find(
                (m: any) => m.skill.toUpperCase() === band.skill.toUpperCase()
              );
              if (dbRecord) {
                return {
                  ...band,
                  score:     Number(dbRecord.band_score) || 0.0,
                  target:    Number(fetchedTarget)       || 7.0,
                  delta:     0,
                  subScores: dbRecord.sub_scores || {},
                };
              }
              return { ...band, target: Number(fetchedTarget) || 7.0 };
            })
          );
        }
      } catch (err) {
        console.error("[CompetencyScores] Fetch failed:", err);
      }
    };
    fetchCompetencyScores();

    const today  = new Date();
    const offset = today.getTimezoneOffset() * 60000;
    const localISO = new Date(today.getTime() - offset).toISOString().split("T")[0];
    const storedAttendance = localStorage.getItem("student_attendance");
    let dates: string[] = storedAttendance ? JSON.parse(storedAttendance) : [];
    if (!dates.includes(localISO)) {
      dates.push(localISO);
      localStorage.setItem("student_attendance", JSON.stringify(dates));
    }
    setCurrentStreak(calculateStreak(dates));
  }, []);

  const focusData = getPriorityFocusArea(skillBands, completedDrills);

  // ── DRILL START HANDLER ───────────────────────────────────────────────────
  const handleDrillStart = () => {
    const drillAction = getDrillAction();
    const base        = `skill=${encodeURIComponent(focusData.skill)}&sub_skill=${encodeURIComponent(focusData.sub_skill)}`;
    if (drillAction.action === "lexigrid") {
      navigate(`/student/lexigrid?from=drill&${base}`);
    } else {
      navigate(`/student/drill?${base}&drillNumber=${drillAction.drillNumber}`);
    }
  };

  // ─────────────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-[#020617] transition-colors duration-300">
      <StudentSidebar
        activeTab={activeTab}
        onTabChange={setActiveTab}
        isCollapsed={isSidebarCollapsed}
        toggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
        isLocked={isLocked}
        isNewStudent={false}
        onMouseEnter={() => setIsSidebarHovered(true)}
        onMouseLeave={() => setIsSidebarHovered(false)}
      />

      <div className={cn(
        "min-h-screen flex flex-col transition-all duration-300 ease-in-out pl-0",
        isSidebarHovered && !isLocked ? "md:pl-[288px]" : "md:pl-[116px]"
      )}>
        <StudentTopbar onUpgradeClick={() => setShowPremiumModal(true)} />

        <main className="flex-1 p-4 sm:p-6 lg:p-8 space-y-6 relative">

          {isLocked && (
            <div className="absolute inset-0 z-40 bg-slate-50/60 dark:bg-slate-950/60 backdrop-blur-md rounded-3xl" />
          )}

          {/* ── Hero Banner ───────────────────────────────────────────────── */}
          <section className={cn(
            "relative overflow-hidden rounded-3xl bg-gradient-to-r from-indigo-600 via-indigo-500 to-purple-600 p-8 text-white shadow-lg",
            isLocked && "relative z-50"
          )}>
            <div className="pointer-events-none absolute -right-10 -top-10 h-48 w-48 rounded-full bg-white/10 blur-2xl" />
            <div className="pointer-events-none absolute right-24 bottom-0 h-28 w-28 rounded-full bg-purple-400/30 blur-xl" />
            <div className="relative z-10 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <div className="flex items-center gap-3 mb-1">
                  <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
                    Welcome back, {displayName} 👋
                  </h1>
                  <span className="hidden sm:inline-flex items-center gap-1 rounded-full bg-white/20 px-3 py-1 text-xs font-bold text-white backdrop-blur-sm border border-white/30">
                    <Trophy className="h-3.5 w-3.5" /> {LEVEL.tier} · {LEVEL.label}
                  </span>
                </div>
                <p className="text-indigo-100 max-w-xl text-sm sm:text-base">
                  You're on a{" "}
                  <span className="font-bold text-white">{currentStreak}-day streak</span> — great momentum!
                  Your current overall band is{" "}
                  <span className="font-bold text-white">{overall}</span>.
                </p>
              </div>
              <div className="flex-shrink-0 text-center bg-white/15 border border-white/30 backdrop-blur-sm rounded-2xl px-6 py-3">
                <p className="text-xs font-bold text-indigo-200 uppercase tracking-widest mb-0.5">Overall Band</p>
                <p className="text-4xl font-black text-white leading-none">{overall}</p>
                <p className="text-xs text-indigo-200 mt-0.5">Target: {dynamicReadiness.targetBand}</p>
              </div>
            </div>
          </section>

          {/* ── Missed Assessment Alerts ──────────────────────────────────── */}
          <div className={cn("transition-all duration-500", isLocked && "relative z-50")}>
            {missedData.misses === 1 && (
              <div className="bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/30 rounded-3xl p-6 shadow-sm flex items-start gap-4 mb-6">
                <div className="bg-amber-100 dark:bg-amber-500/20 p-3 rounded-2xl shrink-0">
                  <CalendarX2 className="w-6 h-6 text-amber-600 dark:text-amber-400" />
                </div>
                <div>
                  <h3 className="text-amber-900 dark:text-amber-300 font-bold text-lg">Assessment Missed</h3>
                  <p className="text-amber-700/80 dark:text-amber-400/80 text-sm mt-1">
                    You missed your recent{" "}
                    <strong className="font-semibold text-amber-900 dark:text-amber-300">
                      {missedData.subSkills.join(", ")}
                    </strong>{" "}
                    assessment. No band penalty, but{" "}
                    <strong className="font-bold text-amber-600 dark:text-amber-400">−20 Momentum</strong>{" "}
                    deducted. Module added to your next session.
                  </p>
                </div>
              </div>
            )}

            {missedData.misses >= 2 && (
              <div className="bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/30 rounded-3xl p-6 shadow-[0_8px_30px_rgba(244,63,94,0.15)] flex flex-col md:flex-row items-center gap-6 mb-6">
                <div className="bg-rose-100 dark:bg-rose-500/20 p-4 rounded-2xl shrink-0">
                  <ShieldAlert className="w-8 h-8 text-rose-600 dark:text-rose-400" />
                </div>
                <div className="flex-1">
                  <h3 className="text-rose-900 dark:text-rose-300 font-black text-xl uppercase tracking-tight">Intervention Required</h3>
                  <p className="text-rose-700/90 dark:text-rose-400/90 text-sm mt-1">
                    Missed 2 consecutive assessments ({missedData.subSkills.join(" & ")}).
                    Readiness pushed back, <strong>−40 Momentum</strong> deducted, tutor notified.
                  </p>
                </div>
                <button onClick={() => navigate("/student/internal")} className="w-full md:w-auto bg-rose-600 hover:bg-rose-700 text-white font-bold py-3.5 px-6 rounded-xl shrink-0 transition-colors shadow-md">
                  Start Catch-Up Session
                </button>
              </div>
            )}
          </div>

          {/* ── IA STATUS BANNER ─────────────────────────────────────────────*/}
          {iaBanner && !isLocked && (
            <div className={cn(
              "rounded-3xl p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 animate-in slide-in-from-top-2",
              iaBanner.type === 'window_open'
                ? "bg-purple-50 dark:bg-purple-500/10 border border-purple-200 dark:border-purple-500/30 shadow-[0_4px_24px_rgba(129,140,248,0.15)]"
                : iaBanner.type === 'eligible_waiting'
                ? "bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-200 dark:border-indigo-500/20"
                : "bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700"
            )}>
              <div className="flex items-center gap-4">
                <div className={cn(
                  "p-3 rounded-2xl shrink-0",
                  iaBanner.type === 'window_open'
                    ? "bg-purple-100 dark:bg-purple-500/20"
                    : iaBanner.type === 'eligible_waiting'
                    ? "bg-indigo-100 dark:bg-indigo-500/20"
                    : "bg-slate-100 dark:bg-slate-700"
                )}>
                  {iaBanner.type === 'window_open' ? (
                    <Bell className="w-6 h-6 text-purple-600 dark:text-purple-400 animate-pulse" />
                  ) : iaBanner.type === 'eligible_waiting' ? (
                    <Clock className="w-6 h-6 text-indigo-500" />
                  ) : (
                    <Target className="w-6 h-6 text-slate-500" />
                  )}
                </div>
                <div>
                  {iaBanner.type === 'window_open' && (
                    <>
                      <h3 className="font-black text-purple-900 dark:text-purple-300 text-base">
                        Internal Assessment #{iaBanner.iaNumber} is Ready!
                      </h3>
                      <p className="text-purple-700/80 dark:text-purple-400/80 text-sm mt-0.5">
                        <strong>{iaBanner.subSkill}</strong> · Window closes in{" "}
                        <strong className="text-purple-700 dark:text-purple-300">
                          {Math.round(iaBanner.minutesLeft)} min
                        </strong>
                      </p>
                    </>
                  )}
                  {iaBanner.type === 'eligible_waiting' && (
                    <>
                      <h3 className="font-black text-indigo-900 dark:text-indigo-300 text-base">
                        Assessment Opens in {formatHoursLeft(iaBanner.hoursLeft)}
                      </h3>
                      <p className="text-indigo-700/80 dark:text-indigo-400/80 text-sm mt-0.5">
                        IA #{iaBanner.iaNumber} — <strong>{iaBanner.subSkill}</strong> · 24hr consolidation window active
                      </p>
                    </>
                  )}
                  {iaBanner.type === 'drills_progress' && (
                    <>
                      <h3 className="font-black text-slate-700 dark:text-slate-300 text-base">
                        {iaBanner.drillsLeft} more drill{iaBanner.drillsLeft !== 1 ? 's' : ''} to unlock your Internal Assessment
                      </h3>
                      <p className="text-slate-500 text-sm mt-0.5">
                        {iaBanner.drillCount} / 6 total drills completed · Keep going!
                      </p>
                    </>
                  )}
                </div>
              </div>

              {iaBanner.type === 'window_open' && (
                <button
                  onClick={() => navigate('/student/internal')}
                  className="shrink-0 flex items-center gap-2 bg-purple-500 hover:bg-purple-600 text-white font-bold text-sm py-2.5 px-5 rounded-xl transition-colors shadow-md animate-pulse"
                >
                  Begin Assessment <ArrowRight className="w-4 h-4" />
                </button>
              )}
            </div>
          )}

          {/* ── Platform Lock Banner ──────────────────────────────────────── */}
          {!drill2Accessed && missedData.misses < 2 && (
            <div className="relative z-50 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-2xl shadow-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 animate-in slide-in-from-top-4">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-indigo-100 dark:bg-indigo-500/20 rounded-full flex items-center justify-center shrink-0">
                  <Lock className="w-6 h-6 text-indigo-500" />
                </div>
                <div>
                  <h3 className="text-lg font-black text-slate-900 dark:text-white uppercase">Full Platform Locked</h3>
                  <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mt-0.5">
                    {drillSessionCount === 0 ? (
                      <>Start your <strong className="text-indigo-500">Priority Drill</strong> below. After completing it, play <strong className="text-teal-500">LexiGrid (5 words)</strong> to unlock Drill 2 and the full platform.</>
                    ) : drillSessionCount === 1 ? (
                      <>Drill 1 done ✓ — now complete <strong className="text-teal-500">LexiGrid (5 words)</strong> to unlock Drill 2 and the full platform.</>
                    ) : (
                      <>Resume your drills — no daily limit.</>
                    )}
                  </p>
                </div>
              </div>
              {drillSessionCount >= 1 && (
                <button
                  onClick={() => navigate(`/student/lexigrid?from=drill&skill=${focusData.skill}&sub_skill=${focusData.sub_skill}`)}
                  className="shrink-0 flex items-center gap-2 bg-teal-500 hover:bg-teal-600 text-white font-semibold text-sm py-2.5 px-4 rounded-xl transition-colors"
                >
                  <Gamepad2 className="w-4 h-4" /> Play LexiGrid
                </button>
              )}
            </div>
          )}

          {/* ── Focus Area + Daily Challenge ──────────────────────────────── */}
          <section className={cn("transition-all duration-500", isLocked && "relative z-50 animate-in slide-in-from-bottom-4")}>
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

              {missedData.misses < 2 && (
                <div className="lg:col-span-6 flex flex-col h-full">
                  <FocusAreaCard
                    sub_skill={focusData.sub_skill}
                    band={focusData.band}
                    skill={focusData.skill}
                    isLocked={!drill2Accessed}
                    drillsCompleted={drillSessionCount}
                    onStart={handleDrillStart}
                  />
                </div>
              )}

              <div className={cn(missedData.misses < 2 ? "lg:col-span-6" : "lg:col-span-12", "h-full")}>
                <div className="relative h-full">
                  {(drillSessionCount < 3 || missedData.misses >= 2) && (
                    <div className="absolute inset-0 z-20 rounded-3xl bg-slate-950/75 backdrop-blur-[3px] flex flex-col items-center justify-center gap-3 pointer-events-auto cursor-not-allowed">
                      <div className="w-14 h-14 bg-slate-800/80 border border-slate-700 rounded-full flex items-center justify-center">
                        <Lock className="w-7 h-7 text-slate-400" />
                      </div>
                      <div className="text-center px-4">
                        <p className="text-sm font-bold text-slate-300 uppercase tracking-wider">
                          {missedData.misses >= 2 ? "Locked — Intervention Required" : "Complete 3 Drills to Unlock"}
                        </p>
                        {missedData.misses < 2 && (
                          <>
                            <p className="text-xs text-slate-500 mt-1">{3 - drillSessionCount} more drill{3 - drillSessionCount !== 1 ? "s" : ""} remaining</p>
                            <div className="flex items-center justify-center gap-2 mt-3">
                              {[0, 1, 2].map((i) => (
                                <div key={i} className={cn("h-1.5 w-8 rounded-full transition-all duration-500", i < drillSessionCount ? "bg-emerald-500" : "bg-slate-700")} />
                              ))}
                            </div>
                            <p className="text-[10px] text-slate-600 mt-2 font-mono">{drillSessionCount}/3</p>
                          </>
                        )}
                      </div>
                    </div>
                  )}
                  <div
                    onClick={drillSessionCount >= 3 && missedData.misses < 2 ? () => navigate("/student/lexigrid") : undefined}
                    className={cn(
                      "h-full relative overflow-hidden rounded-3xl bg-slate-900 dark:bg-[#0f172a] border border-indigo-500/30 p-6 flex flex-col justify-center shadow-lg transition-all duration-300",
                      drillSessionCount >= 3 && missedData.misses < 2 ? "cursor-pointer group hover:shadow-indigo-500/20" : "cursor-default"
                    )}
                  >
                    <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 blur-[50px] group-hover:bg-indigo-500/20 transition-colors" />
                    <div className="relative z-10 flex items-start gap-5">
                      <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-500/20 to-purple-500/20 border border-indigo-400/30 flex items-center justify-center flex-shrink-0">
                        <Sparkles className="w-7 h-7 text-amber-400" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2 mb-2">
                          <h2 className="text-xl font-bold text-white tracking-tight">Daily Challenge</h2>
                          {drillSessionCount >= 3 ? (
                            <span className="bg-amber-500/20 text-amber-400 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase">Ready</span>
                          ) : drillSessionCount === 1 && !drill2Accessed ? (
                            <span className="bg-teal-500/20 text-teal-400 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase animate-pulse">Gate Active</span>
                          ) : (
                            <span className="bg-slate-700/50 text-slate-500 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase">Locked</span>
                          )}
                        </div>
                        <p className="text-sm text-indigo-100/70 font-medium mb-4">
                          {drillSessionCount >= 3
                            ? <>Crack today's LexiGrid vocabulary puzzle to earn <strong className="text-amber-400">+15 Momentum</strong>.</>
                            : <>LexiGrid unlocks after you complete all <strong className="text-amber-400">3 daily drills</strong>.</>
                          }
                        </p>
                        {drillSessionCount >= 3 && (
                          <button className="bg-white/10 hover:bg-white/20 text-white font-semibold text-sm py-2 px-4 rounded-lg transition-colors flex items-center gap-2">
                            Play Now <ArrowRight className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* ── Main Dashboard Content (blurred when locked) ──────────────── */}
          <div className="relative mt-6">
            {isLocked && (
              <div className="absolute inset-0 z-40 bg-slate-50/60 dark:bg-[#020617]/70 backdrop-blur-md rounded-3xl border border-white/10 flex flex-col items-center pt-24" />
            )}
            <div className={cn("space-y-6 transition-all duration-500", isLocked && "opacity-40 grayscale-[50%] pointer-events-none select-none blur-[3px]")}>

              <section>
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                  {skillBands.map((band) => (
                    <SkillBandCard key={band.skill} band={band} onNavigate={() => navigate(band.route)} />
                  ))}
                </div>
              </section>

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                <div className="lg:col-span-5"><WeeklyRhythmIndicator /></div>
                <div className="lg:col-span-4"><PredictedReadinessCard readiness={dynamicReadiness} /></div>
                <div className="lg:col-span-3">
                  <DashboardCard title="Streak" icon={<Flame className="h-5 w-5 text-orange-500" />}>
                    <AttendanceStreakTracker currentStreak={currentStreak} goal={7} />
                  </DashboardCard>
                </div>
              </div>

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
  sub_skill, band, skill, onStart, isLocked, drillsCompleted,
}: {
  sub_skill: string; band: number; skill: string;
  onStart: () => void; isLocked: boolean; drillsCompleted: number;
}) => {
  if (band === 9.0 && sub_skill === "All Caught Up!") {
    return (
      <div className="h-full rounded-3xl border border-emerald-200 dark:border-emerald-500/20 p-6 bg-emerald-50 dark:bg-emerald-500/10 flex flex-col items-center justify-center text-center shadow-sm">
        <div className="h-16 w-16 rounded-full bg-emerald-100 dark:bg-emerald-500/20 flex items-center justify-center mb-4">
          <CheckCircle2 className="h-8 w-8 text-emerald-500" />
        </div>
        <h2 className="text-lg font-bold text-slate-800 dark:text-white mb-2 tracking-tight">Daily Priorities Knocked Out!</h2>
        <p className="text-sm text-slate-500 dark:text-slate-400">You've completed the required drills for today. Great job!</p>
      </div>
    );
  }

  // Button label reflects current drill state with no ceiling
  const getButtonLabel = () => {
    if (drillsCompleted === 0) return "Start Priority Drill";
    if (drillsCompleted === 1 && isLocked) return "Play LexiGrid → Unlock Drill 2";
    return `Start Drill ${drillsCompleted + 1}`;
  };

  return (
    <div className={cn(
      "h-full rounded-3xl border p-6 flex flex-col transition-all duration-500 shadow-sm",
      isLocked
        ? "bg-white dark:bg-slate-900 border-indigo-200 dark:border-indigo-500/30 shadow-[0_8px_30px_rgba(99,102,241,0.1)] ring-1 ring-indigo-500/20"
        : "bg-indigo-50 dark:bg-indigo-500/10 border-indigo-200 dark:border-indigo-500/25"
    )}>
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2">
          <Zap className="h-5 w-5 text-indigo-500" />
          <h2 className="text-sm font-bold text-slate-800 dark:text-white uppercase tracking-wider">Next Best Action</h2>
        </div>
        {drillsCompleted > 0 && (
          <span className="text-[10px] font-bold uppercase tracking-wider bg-emerald-100 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400 px-3 py-1 rounded-full">
            {drillsCompleted} drill{drillsCompleted !== 1 ? 's' : ''} today ✓
          </span>
        )}
      </div>
      <div className="flex items-center gap-5 mb-6">
        <div className="flex-shrink-0 h-16 w-16 rounded-2xl bg-indigo-100 dark:bg-indigo-500/20 flex items-center justify-center border border-indigo-200 dark:border-indigo-500/30">
          <Target className="h-8 w-8 text-indigo-500" />
        </div>
        <div>
          <p className="text-xl font-bold text-slate-800 dark:text-white leading-snug tracking-tight mb-1">{sub_skill} Drill</p>
          <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
            <span>{skill}</span>
            <span className="w-1 h-1 rounded-full bg-slate-300 dark:bg-slate-600" />
            <span>Sub-score: <strong className="text-indigo-600 dark:text-indigo-400 font-semibold">{band.toFixed(1)}</strong></span>
          </div>
        </div>
      </div>
      <div className="mt-auto">
        <button onClick={onStart} className="w-full flex items-center justify-center gap-2 bg-indigo-500 hover:bg-indigo-600 text-white font-semibold text-sm py-3.5 rounded-xl transition-all shadow-md hover:shadow-lg active:scale-[0.98]">
          {getButtonLabel()} <ArrowRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
};

const SkillBandCard = ({ band, onNavigate }: { band: SkillBand; onNavigate: () => void }) => {
  const pct = Math.round((band.score / 9) * 100);
  return (
    <button onClick={onNavigate} className={`text-left w-full rounded-3xl border p-5 flex flex-col transition-all duration-200 hover:scale-[1.02] hover:shadow-md bg-white dark:bg-slate-900 ${band.border} shadow-sm`}>
      <div className="flex items-center justify-between mb-4 w-full">
        <div className={`flex items-center justify-center h-10 w-10 rounded-xl ${band.bg} ${band.color}`}>{band.icon}</div>
      </div>
      <p className="text-3xl font-bold text-slate-800 dark:text-white tracking-tight">{band.score.toFixed(1)}</p>
      <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mt-1 mb-4">{band.skill}</p>
      <div className="h-1.5 w-full rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden mb-4">
        <div className={`h-full rounded-full transition-all duration-700 ${band.color.replace("text-", "bg-")}`} style={{ width: `${pct}%` }} />
      </div>
      {band.subScores && Object.keys(band.subScores).length > 0 && (
        <div className="grid grid-cols-2 gap-2 w-full mt-auto">
          {Object.entries(band.subScores).filter(([key, val]) => {
            const n = Number(val); if (isNaN(n) || n > 9) return false;
            const k = key.toLowerCase();
            return !k.includes("count") && !k.includes("total") && !k.includes("correct");
          }).map(([key, val]) => {
            let label = key.replace(/Score/g, "").replace(/_/g, " ").replace(/([A-Z])/g, " $1").trim();
            label = label.charAt(0).toUpperCase() + label.slice(1);
            const n = Number(val);
            return (
              <div key={key} className="flex justify-between items-center text-[10px] bg-slate-50 dark:bg-slate-800/50 px-2 py-1.5 rounded-lg border border-slate-100 dark:border-slate-800">
                <span className="text-slate-500 truncate mr-1">{label}</span>
                <span className="font-bold text-slate-700 dark:text-slate-300">{Number.isInteger(n) ? n : n.toFixed(1)}</span>
              </div>
            );
          })}
        </div>
      )}
    </button>
  );
};

const PredictedReadinessCard = ({ readiness }: any) => {
  const statusConfig = {
    "on-track": { icon: <CheckCircle2 className="h-5 w-5 text-emerald-500" />, color: "text-emerald-600", bg: "bg-emerald-50 dark:bg-emerald-500/5", border: "border-emerald-200 dark:border-emerald-500/20" },
    warn:       { icon: <AlertTriangle className="h-5 w-5 text-amber-500" />,  color: "text-amber-600",   bg: "bg-amber-50 dark:bg-amber-500/5",   border: "border-amber-200 dark:border-amber-500/20"   },
    danger:     { icon: <AlertTriangle className="h-5 w-5 text-red-500" />,    color: "text-red-600",     bg: "bg-red-50 dark:bg-red-500/5",       border: "border-red-200 dark:border-red-500/20"       },
  };
  const cfg = statusConfig[readiness.status as keyof typeof statusConfig];
  return (
    <div className={`h-full rounded-3xl border ${cfg.bg} ${cfg.border} p-6 shadow-sm flex flex-col`}>
      <div className="flex items-center gap-2 mb-4">
        <CalendarClock className="h-5 w-5 text-slate-500" />
        <h2 className="text-sm font-bold text-slate-800 dark:text-white uppercase tracking-wider">Predicted Readiness</h2>
      </div>
      <div className="space-y-4 mt-2">
        <div className="flex justify-between items-center"><span className="text-sm text-slate-500">Target Band</span><span className="text-base font-semibold text-slate-800 dark:text-white">{readiness.targetBand}</span></div>
        <div className="flex justify-between items-center"><span className="text-sm text-slate-500">Days Left</span><span className="text-base font-semibold text-slate-800 dark:text-white">{readiness.daysLeft} days</span></div>
        <div className="flex justify-between items-center pt-2 border-t border-slate-200/50 dark:border-slate-700/50"><span className="text-sm text-slate-500 font-medium">Exam Date</span><span className="text-sm font-bold text-slate-700 dark:text-slate-300">{readiness.targetDate}</span></div>
      </div>
      <div className={`mt-auto pt-4 flex items-center gap-2 p-3 rounded-xl bg-white/60 dark:bg-slate-900/40 border ${cfg.border}`}>
        {cfg.icon}<p className={`text-xs font-bold ${cfg.color}`}>{readiness.trajectory}</p>
      </div>
    </div>
  );
};

const ModuleNavCard = ({ band, onNavigate }: any) => (
  <button onClick={onNavigate} className={`text-left w-full flex items-center gap-4 p-4 rounded-2xl border transition-all duration-200 hover:scale-[1.01] hover:shadow-sm bg-white dark:bg-slate-900 ${band.border} group`}>
    <div className={`flex-shrink-0 h-12 w-12 rounded-xl flex items-center justify-center ${band.bg} ${band.color}`}>{band.icon}</div>
    <div className="flex-1 min-w-0">
      <p className="text-sm font-bold text-slate-800 dark:text-white">{band.skill}</p>
      <p className="text-xs text-slate-500 mt-0.5">Band {band.score} → {band.target}</p>
    </div>
  </button>
);

const DashboardCard = ({ title, subtitle, children, icon }: any) => (
  <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm h-full">
    <div className="mb-5">
      <h2 className="text-sm font-bold text-slate-800 dark:text-white flex items-center gap-2 uppercase tracking-wider">{icon && <span>{icon}</span>} {title}</h2>
      {subtitle && <p className="text-xs text-slate-500 mt-1">{subtitle}</p>}
    </div>
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
          <circle cx="48" cy="48" r="40" fill="none" stroke="#f97316" strokeWidth="8" strokeDasharray={`${2 * Math.PI * 40}`} strokeDashoffset={`${2 * Math.PI * 40 * (1 - progress / 100)}`} strokeLinecap="round" className="transition-all duration-700 ease-out" />
        </svg>
        <div className="absolute flex flex-col items-center">
          <Flame className="h-6 w-6 text-orange-500" />
          <span className="text-xl font-bold text-slate-800 dark:text-white leading-none mt-1">{currentStreak}</span>
        </div>
      </div>
      <p className="text-sm font-medium text-slate-500 dark:text-slate-400 text-center">
        {currentStreak >= goal ? "Weekly goal hit! 🎉" : `${goal - currentStreak} more to reach ${goal}-day goal`}
      </p>
    </div>
  );
};

const WEEKLY_RHYTHM = [
  { day: "Mon", type: "Drill",      color: "blue",   text: "Priority sub-skill drill (15 min)" },
  { day: "Tue", type: "Drill",      color: "blue",   text: "Same sub-skill, new prompts (15 min)" },
  { day: "Wed", type: "Assessment", color: "purple", text: "Mid-Week Priority Assessment (20 min)" },
  { day: "Thu", type: "Drill",      color: "blue",   text: "Secondary sub-skill drill (15 min)" },
  { day: "Fri", type: "Content",    color: "teal",   text: "Apply Lesson & Mini-Drill (15 min)" },
  { day: "Sat", type: "Eval",       color: "amber",  text: "Full Weekly Assessment (45 min)" },
  { day: "Sun", type: "Rest",       color: "slate",  text: "Rest & Recovery" },
];
const colorConfig: Record<string, any> = {
  blue:   { bg: "bg-blue-500",   border: "border-blue-500",                        text: "text-blue-600 dark:text-blue-400",     ring: "ring-blue-500/30"   },
  purple: { bg: "bg-purple-500", border: "border-purple-500",                      text: "text-purple-600 dark:text-purple-400", ring: "ring-purple-500/30" },
  teal:   { bg: "bg-teal-500",   border: "border-teal-500",                        text: "text-teal-600 dark:text-teal-400",     ring: "ring-teal-500/30"   },
  amber:  { bg: "bg-amber-500",  border: "border-amber-500",                       text: "text-amber-600 dark:text-amber-400",   ring: "ring-amber-500/30"  },
  slate:  { bg: "bg-slate-400",  border: "border-slate-300 dark:border-slate-600", text: "text-slate-500 dark:text-slate-400",   ring: "ring-slate-400/30"  },
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
        <p className="text-sm font-medium text-slate-600 dark:text-slate-300">
          Today: <span className={`ml-1 font-semibold ${colorConfig[todayConfig.color].text}`}>{todayConfig.text}</span>
        </p>
      </div>
    </div>
  );
};

export default StudentDashboardPage;