import { useState, useEffect, useRef, useCallback } from "react";
import { StudentSidebar } from "./dashboard/StudentSidebar";
import { StudentTopbar } from "./dashboard/StudentTopbar";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { PremiumModal } from "@/features/payment/components/PremiumModal";
import { useNavigate, useLocation } from "react-router-dom";
import { callBackend } from "@/features/auth/services/authClient";
import IAScheduleWidget  from "./dashboard/IAScheduleWidget";
import MockStatusWidget  from "./dashboard/MockStatusWidget";
import { DailyNotices }  from "./dashboard/DailyNotices";
import { useMomentum } from "@/features/student/Context/MomentumContext";
import { cn } from "@/shared/utils";
import {
  Flame, Trophy, Target, Zap, BookOpen, Mic, PenLine,
  Headphones, CalendarClock, CheckCircle2, ArrowRight, Puzzle,
  Lock, AlertTriangle, ChevronDown, Lightbulb, TrendingUp, Compass,
} from "lucide-react";

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
  { skill: "Listening", score: 0.0, target: 0.0, delta: 0.0, route: "/student/listening", icon: <Headphones className="h-5 w-5" />, color: "text-sky-600", bg: "bg-sky-50 dark:bg-sky-500/10", border: "border-sky-200 dark:border-sky-500/30" },
  { skill: "Reading", score: 0.0, target: 0.0, delta: 0.0, route: "/student/reading", icon: <BookOpen className="h-5 w-5" />, color: "text-violet-600", bg: "bg-violet-50 dark:bg-violet-500/10", border: "border-violet-200 dark:border-violet-500/30" },
  { skill: "Writing", score: 0.0, target: 0.0, delta: 0.0, route: "/student/writing", icon: <PenLine className="h-5 w-5" />, color: "text-amber-600", bg: "bg-amber-50 dark:bg-amber-500/10", border: "border-amber-200 dark:border-amber-500/30" },
  { skill: "Speaking", score: 0.0, target: 0.0, delta: 0.0, route: "/student/speaking-assessment", icon: <Mic className="h-5 w-5" />, color: "text-rose-600", bg: "bg-rose-50 dark:bg-rose-500/10", border: "border-rose-200 dark:border-rose-500/30" },
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

// ─── SUB-SKILL GUIDANCE ────────────────────────────────────────────────────────
interface SubSkillGuide {
  blurb: string;
  drillLabel: string;
  drillSlug: string;
}

const SUB_SKILL_GUIDE: Record<string, SubSkillGuide> = {
  grammar:        { blurb: "How accurately you build sentences.",            drillLabel: "Basic Tenses drill",        drillSlug: "Grammar" },
  coherence:      { blurb: "How clearly your ideas connect and flow.",       drillLabel: "Linking Ideas drill",       drillSlug: "Coherence" },
  vocabulary:     { blurb: "The range and precision of words you use.",      drillLabel: "Word Choice drill",         drillSlug: "Vocabulary" },
  lexical:        { blurb: "The range and precision of words you use.",      drillLabel: "Word Choice drill",         drillSlug: "Lexical Resource" },
  fluency:        { blurb: "How smoothly and steadily you speak.",           drillLabel: "Speaking Flow drill",       drillSlug: "Fluency" },
  pronunciation:  { blurb: "How clearly individual sounds come across.",     drillLabel: "Sound Clarity drill",       drillSlug: "Pronunciation" },
  taskresponse:   { blurb: "How fully you answer what the task asks.",       drillLabel: "Task Focus drill",          drillSlug: "Task Response" },
  taskachievement:{ blurb: "How fully you cover every part of the task.",    drillLabel: "Task Focus drill",          drillSlug: "Task Achievement" },
  detail:         { blurb: "Catching specific facts and figures.",          drillLabel: "Detail Spotting drill",     drillSlug: "Detail" },
  inference:      { blurb: "Reading between the lines for implied meaning.", drillLabel: "Inference Sprint drill",    drillSlug: "Inference" },
  mainidea:       { blurb: "Spotting the central point of a passage.",       drillLabel: "Main Idea drill",           drillSlug: "Main Idea" },
};

const normaliseSubSkill = (raw: string): string =>
  raw.toLowerCase().replace(/score|range|resource/g, "").replace(/[^a-z]/g, "");

const getSubSkillGuide = (rawKey: string): SubSkillGuide | undefined =>
  SUB_SKILL_GUIDE[normaliseSubSkill(rawKey)];

const scoreTier = (n: number): { label: string; tone: "low" | "mid" | "high" } => {
  if (n < 4.0) return { label: "Just starting", tone: "low" };
  if (n < 6.0) return { label: "Building up",   tone: "mid" };
  if (n < 7.5) return { label: "Solid",         tone: "mid" };
  return { label: "Strong",        tone: "high" };
};

// ─── UTILS ────────────────────────────────────────────────────────────────────

const overallBand = (bands: SkillBand[]) =>
  Math.round((bands.reduce((s, b) => s + b.score, 0) / bands.length) * 2) / 2;

const getNextMilestone = (current: number, target: number) => {
  const next = Math.min(Math.round((current + 0.5) * 2) / 2, target);
  const reachedTarget = current >= target;
  const stepStart = next - 0.5;
  const pctToNext = reachedTarget
    ? 100
    : Math.max(0, Math.min(100, ((current - stepStart) / 0.5) * 100));
  return { next, reachedTarget, pctToNext };
};

const getLevelFromScore = (score: number): string => {
  if (score < 5.0) return 'BEGINNER';
  if (score < 7.0) return 'INTERMEDIATE';
  return 'ADVANCED';
};

const buildMissCycleKey = (missCount: number): string => {
  const now = new Date();
  const startOfYear = new Date(now.getFullYear(), 0, 1);
  const week = Math.ceil(
    ((now.getTime() - startOfYear.getTime()) / 86400000 + startOfYear.getDay() + 1) / 7
  );
  return `${now.getFullYear()}-W${String(week).padStart(2, "0")}_miss${missCount}`;
};

// ─── MAIN COMPONENT ──────────────────────────────────────────────────────────

const StudentDashboardPage = () => {
  const [activeTab, setActiveTab] = useState("dashboard");
  const [showPremiumModal, setShowPremiumModal] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(true);
  const [skillBands, setSkillBands] = useState<SkillBand[]>(SKILL_BANDS);
  const [nextActionDrill, setNextActionDrill] = useState<any>(null);
  const [targetBand, setTargetBand] = useState(READINESS.targetBand);

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

  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const { applyMissPenalty, syncMomentum, updateStreak, totalMomentum } = useMomentum();

  const tutorAlertFiredRef = useRef(false);

  const MOCK_MISSED_STATE = 1; // Change to 0, 1, or 2 to test UI states
  const missedData = {
    misses: MOCK_MISSED_STATE,
    subSkills: MOCK_MISSED_STATE === 1 ? ["Grammar"] : ["Grammar", "Coherence"],
  };

  const dynamicReadiness = { ...READINESS, targetBand };
  if (missedData.misses === 1) {
    dynamicReadiness.targetDate = "2026-06-19";
    dynamicReadiness.daysLeft = 87;
    dynamicReadiness.status = "warn";
    dynamicReadiness.trajectory = "A few days behind — a couple of sessions brings you right back.";
  } else if (missedData.misses >= 2) {
    dynamicReadiness.targetDate = "2026-06-23";
    dynamicReadiness.daysLeft = 91;
    dynamicReadiness.status = "catchup";
    dynamicReadiness.trajectory = "Let's rebuild your rhythm — your tutor is here to help you catch up.";
  }

  const displayName = profile?.name || user?.email?.split("@")[0] || "Student";
  const overall = overallBand(skillBands);
  const milestone = getNextMilestone(overall, dynamicReadiness.targetBand);
  const isLocked = !dailyDrillState || !dailyDrillState.dashboard_unlocked || missedData.misses >= 2;

  const fetchDailyDrillState = useCallback(async () => {
    try {
      const backendUrl = import.meta.env.VITE_BACKEND_URL || "http://localhost:4000";
      const resData = await callBackend(`${backendUrl}/api/student/daily-drill-state`);
      if (resData.success) {
        setDailyDrillState(resData);
        syncMomentum(resData.momentum_score);
        if (resData.daily_streak !== undefined) updateStreak(resData.daily_streak);
        if (resData.target_band !== undefined) setTargetBand(Number(resData.target_band));
      }
    } catch (err) {
      console.error("[DailyDrillState] Fetch failed:", err);
    }
  }, [syncMomentum, updateStreak]);

  const fetchNextActionDrill = useCallback(async () => {
    try {
      const backendUrl = import.meta.env.VITE_BACKEND_URL || "http://localhost:4000";
      const resData = await callBackend(`${backendUrl}/api/student/next-action-drill`);
      if (resData.success) {
        if (resData.recommended_drills && resData.recommended_drills.length > 0) {
          setNextActionDrill(resData.recommended_drills[0]);
        } else if ((resData.daily_sessions_completed ?? 0) > 0) {
          setNextActionDrill({ sub_skill: "All Caught Up!", skill: "Overall", sub_skill_score: 9.0 });
        } else {
          setNextActionDrill({ sub_skill: "General Practice", skill: "Overall", sub_skill_score: 5.5 });
        }
      } else {
        setNextActionDrill({ sub_skill: "General Practice", skill: "Overall", sub_skill_score: 5.5 });
      }
    } catch (err) {
      console.error("[NextActionDrill] Fetch failed:", err);
      setNextActionDrill({ sub_skill: "General Practice", skill: "Overall", sub_skill_score: 5.5 });
    }
  }, []);

  useEffect(() => {
    if (missedData.misses === 1) {
      const key = buildMissCycleKey(1);
      applyMissPenalty(1, key);
    } else if (missedData.misses >= 2) {
      applyMissPenalty(1, buildMissCycleKey(1));
      applyMissPenalty(2, buildMissCycleKey(2));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [missedData.misses]);

  useEffect(() => {
    if (missedData.misses < 2 || tutorAlertFiredRef.current) return;

    const fireTutorAlert = async () => {
      tutorAlertFiredRef.current = true;
      try {
        const backendUrl = import.meta.env.VITE_BACKEND_URL || "http://localhost:4000";
        await callBackend(`${backendUrl}/api/student/tutor-alert`, {
          method: "POST",
          body: JSON.stringify({
            student_name: displayName,
            student_email: user?.email,
            missed_sub_skills: missedData.subSkills,
            consecutive_misses: missedData.misses,
            last_login: new Date().toISOString(),
            exam_days_remaining: dynamicReadiness.daysLeft,
          }),
        });
        console.info("[TutorAlert] Alert fired successfully for", displayName);
      } catch (err) {
        console.error("[TutorAlert] Failed to fire tutor alert:", err);
        tutorAlertFiredRef.current = false;
      }
    };

    fireTutorAlert();
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
          setSkillBands((prevBands) =>
            prevBands.map((band) => {
              const dbRecord = resData.data.find(
                (m: any) => m.skill.toUpperCase() === band.skill.toUpperCase()
              );
              if (dbRecord) {
                return {
                  ...band,
                  score: Number(dbRecord.band_score) || 0.0,
                  target: fetchedTarget,
                  delta: 0,
                  subScores: dbRecord.sub_scores || {},
                };
              }
              return { ...band, target: fetchedTarget };
            })
          );
        }
      } catch (err) {
        console.error("[CompetencyScores] Fetch failed:", err);
      }
    };

    fetchCompetencyScores();
    fetchNextActionDrill();
    fetchDailyDrillState();
  }, [fetchDailyDrillState, fetchNextActionDrill]);

  useEffect(() => {
    if (location.state?.drillCompleted || location.state?.lexigridCompleted) {
      fetchDailyDrillState();
      fetchNextActionDrill();
    }
  }, [location.state?.drillCompleted, location.state?.lexigridCompleted, fetchDailyDrillState, fetchNextActionDrill]);

  const focusData = nextActionDrill
    ? { sub_skill: nextActionDrill.sub_skill, band: nextActionDrill.sub_skill_score ?? 5.0, skill: nextActionDrill.skill }
    : { sub_skill: "Loading...", band: 5.0, skill: "Overall" };

  const startSubSkillDrill = useCallback((skill: string, guide: SubSkillGuide, score: number) => {
    const params = new URLSearchParams({
      skill,
      sub_skill: guide.drillSlug,
      level: getLevelFromScore(score),
    });
    navigate(`/student/drill?${params.toString()}`);
  }, [navigate]);

  return (
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-[#020617] transition-colors duration-300">
      <StudentSidebar
        activeTab={activeTab}
        onTabChange={setActiveTab}
        isCollapsed={isSidebarCollapsed}
        toggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
        isLocked={isLocked}
        isNewStudent={false}
      />

      <div className="min-h-screen flex flex-col pl-0 md:pl-[116px]">
        <StudentTopbar onUpgradeClick={() => setShowPremiumModal(true)} />

        <main className="flex-1 p-4 sm:p-6 lg:p-8 space-y-6 relative">

          {isLocked && (
            <div className="absolute inset-0 z-40 bg-slate-50/60 dark:bg-slate-950/60 backdrop-blur-md rounded-3xl" />
          )}

          {/* ── Hero Banner — "The Climb" ─────────────────────────────────────── */}
          <ClimbHero
            displayName={displayName}
            levelTier={LEVEL.tier}
            levelLabel={LEVEL.label}
            streak={dailyDrillState?.daily_streak ?? 0}
            overall={overall}
            milestone={milestone}
            target={dynamicReadiness.targetBand}
            momentum={totalMomentum}
            isLocked={isLocked}
          />

          {/* ── Daily Notices ────────────────────────────────────────────────── */}
          <div className={cn("transition-all duration-500", isLocked && "relative z-50")}>
            <DailyNotices />
          </div>

          {/* ── Gentle Catch-Up Banner (2+ misses) — Option 1 neutral slate ───── */}
          {missedData.misses >= 2 && (
            <div className="relative z-50 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 p-6 rounded-2xl shadow-sm flex flex-col sm:flex-row sm:items-center gap-4 animate-in slide-in-from-top-4">
              <div className="w-12 h-12 flex-shrink-0 bg-slate-100 dark:bg-slate-700 rounded-full flex items-center justify-center">
                <Compass className="w-6 h-6 text-slate-600 dark:text-slate-300" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-bold text-slate-900 dark:text-white tracking-tight">
                  Let's pick things back up
                </h3>
                <p className="text-sm font-medium text-slate-600 dark:text-slate-300 mt-0.5">
                  Looks like a couple of sessions slipped by — no worries, it happens to everyone.
                  Your momentum will climb right back as soon as you start a drill, and your tutor
                  is looped in to help.
                </p>
              </div>
              <button
                onClick={() => navigate("/student/drill")}
                className="flex-shrink-0 inline-flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm py-3 px-5 rounded-xl transition-colors active:scale-[0.98]"
              >
                Get back on track <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* ── Platform Lock Banner ─────────────────────────────────────────── */}
          {isLocked && missedData.misses < 2 && dailyDrillState && (
            <div className="relative z-50 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-2xl shadow-xl flex items-center justify-between animate-in slide-in-from-top-4">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-indigo-100 dark:bg-indigo-500/20 rounded-full flex items-center justify-center">
                  <Lock className="w-6 h-6 text-indigo-500" />
                </div>
                <div>
                  <h3 className="text-lg font-black text-slate-900 dark:text-white uppercase">
                    Platform Locked
                  </h3>
                  <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
                    {dailyDrillState.next_action === 'DRILL_1'
                      ? <>Finish <strong className="text-indigo-500">2 drills</strong> today to unlock the full platform.</>
                      : dailyDrillState.next_action === 'LEXIGRID'
                        ? <>Complete <strong className="text-teal-500">LexiGrid</strong> (5 words) to unlock your second drill.</>
                        : <>LexiGrid done — complete <strong className="text-indigo-500">1 more drill</strong> to unlock full access.</>
                    }
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* ── Focus Area + Daily Challenge ─────────────────────────────────── */}
          <section
            className={cn(
              "transition-all duration-500",
              isLocked && "relative z-50 animate-in slide-in-from-bottom-4"
            )}
          >
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

              {missedData.misses < 2 && (() => {
                const drillsToday    = dailyDrillState?.drills_completed_today ?? 0;
                const nextAction     = dailyDrillState?.next_action ?? 'DRILL_1';
                const lexiGridIsGate = nextAction === 'LEXIGRID';
                const drillLocked    = nextAction === 'DRILL_LOCKED_INSUFFICIENT_PTS'
                                    || nextAction === 'DRILL_LOCKED_LOW_DCS'
                                    || nextAction === 'DAILY_LIMIT_REACHED';
                const canBuyExtra    = dailyDrillState?.can_buy_extra ?? false;
                const dailyDCS       = dailyDrillState?.daily_dcs ?? 0;
                const dcsThreshold   = dailyDrillState?.dcs_threshold ?? 40;
                const drillsToUnlock = Math.max(0, 2 - drillsToday);

                const handleBuyExtra = async () => {
                  setBuyingExtra(true);
                  setConfirmExtra(false);
                  try {
                    const backendUrl = import.meta.env.VITE_BACKEND_URL || "http://localhost:4000";
                    const res = await callBackend(`${backendUrl}/api/drills/authorize-extra`, { method: 'POST' });
                    if (res.success) {
                      syncMomentum(res.momentum_score);
                      const params = new URLSearchParams({
                        skill:     focusData.skill,
                        sub_skill: focusData.sub_skill,
                        level:     getLevelFromScore(focusData.band),
                        extra:     'true'
                      });
                      navigate(`/student/drill?${params.toString()}`);
                      return;
                    }
                    setBuyingExtra(false);
                  } catch (err) {
                    console.error('[BuyExtra] failed:', err);
                    setBuyingExtra(false);
                  }
                };

                const handleStartDrill = () => {
                  const params = new URLSearchParams({
                    skill:     focusData.skill,
                    sub_skill: focusData.sub_skill,
                    level:     getLevelFromScore(focusData.band),
                    ...(nextAction === 'EXTRA_DRILL_AVAILABLE' || nextAction === 'EXTRA_DRILL_READY' ? { extra: 'true' } : {})
                  });
                  navigate(`/student/drill?${params.toString()}`);
                };

                return (
                  <div className="lg:col-span-6 h-full">
                    <FocusAreaCard
                      sub_skill={focusData.sub_skill}
                      band={focusData.band}
                      skill={focusData.skill}
                      isLocked={isLocked}
                      drillsLeft={drillsToUnlock}
                      nextAction={nextAction}
                      dailyDCS={dailyDCS}
                      dcsThreshold={dcsThreshold}
                      extraCost={dailyDrillState?.extra_session_cost ?? 75}
                      totalMomentum={totalMomentum}
                      buyingExtra={buyingExtra}
                      confirmExtra={confirmExtra}
                      onStartDrill={handleStartDrill}
                      onRequestConfirm={() => setConfirmExtra(true)}
                      onCancelConfirm={() => setConfirmExtra(false)}
                      onConfirmBuy={handleBuyExtra}
                    />
                  </div>
                );
              })()}

              {(() => {
                const isLexiGate   = dailyDrillState?.next_action === 'LEXIGRID';
                const lexiDone     = dailyDrillState?.lexigrid_completed_today ?? false;
                const lexiBlocked  = !isLexiGate && isLocked && !lexiDone;

                return (
                  <div
                    className={cn(
                      missedData.misses < 2 ? "lg:col-span-6" : "lg:col-span-12",
                      "h-full",
                      lexiBlocked && "opacity-40 grayscale pointer-events-none blur-[2px]"
                    )}
                  >
                   <div
                      onClick={() => {
                        if (!lexiBlocked) {
                          const level = getLevelFromScore(overall);
                          navigate(
                            isLexiGate
                              ? `/student/lexigrid?difficulty=${level}&mode=gate`
                              : `/student/lexigrid?difficulty=${level}`
                          );
                        }
                      }}
                      className={cn(
                        "h-full relative overflow-hidden rounded-3xl bg-teal-50 dark:bg-teal-950/30 p-6 flex flex-col justify-center group shadow-sm transition-all duration-300",
                        isLexiGate
                          ? "border-2 border-teal-400 dark:border-teal-500/60 cursor-pointer hover:shadow-teal-500/20"
                          : "border border-teal-200 dark:border-teal-500/30 cursor-pointer hover:shadow-teal-500/10"
                      )}
                    >
                      <div className="absolute top-0 right-0 w-32 h-32 bg-teal-400/10 blur-[50px] group-hover:bg-teal-400/20 transition-colors" />
                      <div className="relative z-10 flex items-start gap-5">
                        <div className="w-14 h-14 rounded-2xl bg-teal-100 dark:bg-teal-500/20 border border-teal-200 dark:border-teal-400/30 flex items-center justify-center flex-shrink-0">
                          <Puzzle className="w-7 h-7 text-teal-600 dark:text-teal-400" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2 mb-2">
                            <h2 className="text-xl font-bold text-teal-950 dark:text-white tracking-tight">
                              LexiGrid
                            </h2>
                            {isLexiGate && (
                              <span className="bg-teal-500/15 text-teal-700 dark:bg-teal-500/20 dark:text-teal-300 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase animate-pulse">
                                Active Gate
                              </span>
                            )}
                            {lexiDone && (
                              <span className="bg-green-500/15 text-green-700 dark:bg-green-500/20 dark:text-green-400 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase">
                                ✓ Done
                              </span>
                            )}
                            {!isLexiGate && !lexiDone && (
                              <span className="bg-amber-500/15 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase">
                                Ready
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-teal-800/80 dark:text-teal-100/70 font-medium mb-4">
                            {isLexiGate
                              ? <>Solve <strong className="text-teal-700 dark:text-teal-300">5 words</strong> to unlock Drill 2 — your gate is open now.</>
                              : lexiDone
                                ? <>Daily momentum earned. Play as many <strong className="text-teal-700 dark:text-teal-300">practice rounds</strong> as you like — no cap.</>
                                : <>Crack today&apos;s vocabulary puzzle to earn your daily <strong className="text-amber-600 dark:text-amber-400">Momentum</strong>.</>
                            }
                          </p>
                          <button className="bg-teal-600 hover:bg-teal-700 text-white font-semibold text-sm py-2 px-4 rounded-lg transition-colors flex items-center gap-2 shadow-sm">
                            {lexiDone ? "Practice Mode →" : "Play Now"} <ArrowRight className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })()}
            </div>
          </section>

          {/* ── Main Dashboard Content (blurred when locked) ──────────────────── */}
          <div className="relative mt-6">
            {isLocked && (
              <div className="absolute inset-0 z-40 bg-slate-50/60 dark:bg-[#020617]/70 backdrop-blur-md rounded-3xl border border-white/10 flex flex-col items-center pt-24" />
            )}

            <div
              className={cn(
                "space-y-6 transition-all duration-500",
                isLocked && "opacity-40 grayscale-[50%] pointer-events-none select-none blur-[3px]"
              )}
            >
              <section>
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                  {skillBands.map((band) => (
                    <SkillBandCard
                      key={band.skill}
                      band={band}
                      onNavigate={() => navigate(band.route)}
                      onDrill={startSubSkillDrill}
                    />
                  ))}
                </div>
              </section>

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                <div className="lg:col-span-4"><WeeklyRhythmIndicator /></div>
                <div className="lg:col-span-4">
                  <PredictedReadinessCard readiness={dynamicReadiness} />
                </div>
                <div className="lg:col-span-4">
                  <DashboardCard
                    title="Streak"
                    icon={<Flame className="h-5 w-5 text-orange-500" />}
                  >
                    <AttendanceStreakTracker currentStreak={dailyDrillState?.daily_streak ?? 0} goal={7} />
                  </DashboardCard>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <IAScheduleWidget />
                <MockStatusWidget />
              </div>

              <DashboardCard title="Skill Modules" subtitle="Tap any module to continue">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                  {skillBands.map((band) => (
                    <ModuleNavCard
                      key={band.skill}
                      band={band}
                      onNavigate={() => navigate(band.route)}
                    />
                  ))}
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

const toTitleCase = (s: string) =>
  s.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, c => c.toUpperCase());

// ─── Hero animation hooks ──────────────────────────────────────────────────────

const usePrefersReducedMotion = (): boolean => {
  const [reduced, setReduced] = useState(
    () => typeof window !== "undefined" &&
      window.matchMedia?.("(prefers-reduced-motion: reduce)").matches
  );
  useEffect(() => {
    if (typeof window === "undefined" || !window.matchMedia) return;
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const onChange = () => setReduced(mq.matches);
    mq.addEventListener?.("change", onChange);
    return () => mq.removeEventListener?.("change", onChange);
  }, []);
  return reduced;
};

/**
 * Tracks whether the app is in dark mode by watching the `dark` class on the
 * <html> element (Tailwind's class strategy). Stays reactive so the hero's
 * particle colour switches live when the user toggles the theme — no reload.
 */
const useIsDarkMode = (): boolean => {
  const getIsDark = () =>
    typeof document !== "undefined" &&
    document.documentElement.classList.contains("dark");

  const [isDark, setIsDark] = useState<boolean>(getIsDark);

  useEffect(() => {
    if (typeof document === "undefined") return;
    const root = document.documentElement;
    const observer = new MutationObserver(() => setIsDark(getIsDark()));
    observer.observe(root, { attributes: true, attributeFilter: ["class"] });
    // Sync once on mount in case the class changed before the observer attached.
    setIsDark(getIsDark());
    return () => observer.disconnect();
  }, []);

  return isDark;
};

const useCountUp = (value: number, durationMs = 1100, decimals = 0): number => {
  const reduced = usePrefersReducedMotion();
  const [display, setDisplay] = useState(reduced ? value : 0);
  const fromRef = useRef(0);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    if (reduced) { setDisplay(value); return; }
    const from = fromRef.current;
    const start = performance.now();
    const tick = (t: number) => {
      const p = Math.min((t - start) / durationMs, 1);
      const eased = 1 - Math.pow(1 - p, 3);
      const current = from + (value - from) * eased;
      setDisplay(Number(current.toFixed(decimals)));
      if (p < 1) {
        rafRef.current = requestAnimationFrame(tick);
      } else {
        fromRef.current = value;
      }
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
  }, [value, durationMs, decimals, reduced]);

  return display;
};

/**
 * Ambient rising-particle field painted onto a <canvas>.
 * `particleColor` is an "r,g,b" string and is now theme-driven by the caller —
 * indigo in light mode, soft glowing light-blue/white in dark mode — so the
 * effect reads like floating dust in daylight and drifting stars at night.
 * The dependency on `particleColor` repaints cleanly when the theme flips.
 */
const useParticleField = (
  canvasRef: React.RefObject<HTMLCanvasElement>,
  enabled: boolean,
  burstKey: number,
  particleColor: string,
) => {
  const burstSeenRef = useRef(burstKey);
  const burstRef = useRef<Array<{ x: number; y: number; vx: number; vy: number; a: number; r: number; c: string }>>([]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !enabled) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let raf = 0;
    let running = true;
    type P = { x: number; y: number; r: number; vy: number; a: number };
    const ambient: P[] = [];

    const size = () => {
      canvas.width = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
    };
    size();

    const spawn = () =>
      ambient.push({
        x: Math.random() * canvas.width,
        y: canvas.height + 5,
        r: Math.random() * 2 + 0.6,
        vy: -(Math.random() * 0.5 + 0.25),
        a: Math.random() * 0.45 + 0.2,
      });

    const loop = () => {
      if (!running) return;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      if (ambient.length < 44 && Math.random() < 0.5) spawn();
      for (let i = ambient.length - 1; i >= 0; i--) {
        const p = ambient[i];
        p.y += p.vy;
        p.a -= 0.0015;
        if (p.y < -5 || p.a <= 0) { ambient.splice(i, 1); continue; }
        ctx.beginPath();
        ctx.fillStyle = `rgba(${particleColor},${p.a})`;
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fill();
      }

      for (let i = burstRef.current.length - 1; i >= 0; i--) {
        const q = burstRef.current[i];
        q.x += q.vx; q.y += q.vy; q.vy += 0.04; q.a -= 0.012;
        if (q.a <= 0) { burstRef.current.splice(i, 1); continue; }
        ctx.beginPath();
        ctx.fillStyle = `rgba(${q.c},${q.a})`;
        ctx.arc(q.x, q.y, q.r, 0, Math.PI * 2);
        ctx.fill();
      }

      raf = requestAnimationFrame(loop);
    };

    const onVisibility = () => {
      running = !document.hidden;
      if (running) { raf = requestAnimationFrame(loop); }
      else if (raf) { cancelAnimationFrame(raf); }
    };

    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("resize", size);
    raf = requestAnimationFrame(loop);

    return () => {
      running = false;
      if (raf) cancelAnimationFrame(raf);
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("resize", size);
    };
  }, [canvasRef, enabled, particleColor]);

  useEffect(() => {
    if (!enabled || burstKey === burstSeenRef.current) return;
    burstSeenRef.current = burstKey;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const cx = canvas.width * 0.62;
    const cy = canvas.height * 0.5;
    for (let i = 0; i < 70; i++) {
      const ang = Math.random() * Math.PI * 2;
      const sp = Math.random() * 3 + 1;
      burstRef.current.push({
        x: cx, y: cy,
        vx: Math.cos(ang) * sp, vy: Math.sin(ang) * sp,
        a: 1, r: Math.random() * 2.5 + 1,
        c: Math.random() < 0.5 ? "52,211,153" : "99,102,241",
      });
    }
  }, [burstKey, enabled, canvasRef]);
};

interface ClimbHeroProps {
  displayName: string;
  levelTier: string;
  levelLabel: string;
  streak: number;
  overall: number;
  milestone: { next: number; reachedTarget: boolean; pctToNext: number };
  target: number;
  momentum: number;
  isLocked: boolean;
}

/**
 * ClimbHero — Option 1 "Soft Indigo" (light) / deep-blue oceanic vibe (dark).
 * Light mode: pale indigo surface (bg-indigo-50) tying into the sidebar/brand.
 * Dark mode:  rich deep blue (dark:bg-blue-950) with a glowing star-dust field.
 * Inner stat cards stay light/translucent so they pop off either surface.
 */
const ClimbHero = ({
  displayName, levelTier, levelLabel, streak,
  overall, milestone, target, momentum, isLocked,
}: ClimbHeroProps) => {
  const reduced = usePrefersReducedMotion();
  const isDark = useIsDarkMode();
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const [mounted, setMounted] = useState(false);
  useEffect(() => { const id = requestAnimationFrame(() => setMounted(true)); return () => cancelAnimationFrame(id); }, []);

  const prevBandRef = useRef(overall);
  const [burstKey, setBurstKey] = useState(0);
  const [justLeveled, setJustLeveled] = useState(false);
  useEffect(() => {
    if (overall > prevBandRef.current) {
      setBurstKey((k) => k + 1);
      setJustLeveled(true);
      const t = setTimeout(() => setJustLeveled(false), 4000);
      prevBandRef.current = overall;
      return () => clearTimeout(t);
    }
    prevBandRef.current = overall;
  }, [overall]);

  // Theme-driven particle colour:
  //   dark  → soft glowing light-blue (#BFDBFE ≈ "191,219,254") for a star-dust look
  //   light → indigo ("99,102,241") to match the brand on the pale surface
  const particleColor = isDark ? "191,219,254" : "99,102,241";
  useParticleField(canvasRef, !reduced, burstKey, particleColor);

  const animatedBand = useCountUp(overall, 900, 1);
  const animatedPts = useCountUp(momentum, 1200, 0);

  const rungs: number[] = [];
  for (let b = 0.5; b <= target + 0.0001; b += 0.5) rungs.push(Math.round(b * 2) / 2);
  const rungsToGoal = Math.max(0, Math.round((target - overall) / 0.5));

  const headline = justLeveled
    ? `Band ${overall.toFixed(1)} unlocked — onward to ${milestone.next.toFixed(1)}!`
    : milestone.reachedTarget
      ? `You've reached your goal of Band ${target.toFixed(1)} 🎉`
      : `Band ${milestone.next.toFixed(1)} is one step away`;

  return (
    <section
      className={cn(
        "relative overflow-hidden rounded-3xl bg-indigo-50 text-indigo-950 dark:bg-blue-950 dark:text-white border border-indigo-100 dark:border-blue-800/60 p-6 sm:p-8 shadow-sm",
        isLocked && "z-50"
      )}
    >
      {!reduced && (
        <canvas
          ref={canvasRef}
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 h-full w-full opacity-40 dark:opacity-70"
        />
      )}
      {/* Soft ambient glow — indigo in light, deep-blue bloom in dark */}
      <div className="pointer-events-none absolute -right-10 -top-10 h-48 w-48 rounded-full bg-indigo-200/40 dark:bg-blue-500/20 blur-2xl" />

      <div className="relative z-10 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 mb-1">
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
              Great to see you, {displayName}
            </h1>
            <span className="hidden sm:inline-flex items-center gap-1 rounded-full bg-indigo-100 dark:bg-blue-900/70 px-3 py-1 text-xs font-bold text-indigo-700 dark:text-blue-200 border border-indigo-200 dark:border-blue-700/60">
              <Trophy className="h-3.5 w-3.5" /> {levelTier} · {levelLabel}
            </span>
          </div>
          <p className="text-indigo-700 dark:text-blue-200/90 max-w-xl text-sm sm:text-base">
            <span className="font-bold text-indigo-950 dark:text-white">{streak}-day streak</span>
            {" "}— every climb starts with one step.
          </p>

          <div className="mt-5 max-w-xl">
            <div className="flex items-center gap-2 mb-2.5">
              <TrendingUp className="h-4 w-4 text-emerald-500 dark:text-emerald-400" />
              <p
                className={cn(
                  "text-sm font-semibold text-indigo-900 dark:text-white transition-all duration-500",
                  justLeveled && !reduced && "scale-[1.03]"
                )}
                aria-live="polite"
              >
                {headline}
              </p>
            </div>

            {(() => {
              const fillPct = milestone.reachedTarget
                ? 100
                : Math.max(0, Math.min(100, (overall / target) * 100));
              return (
                <div
                  role="img"
                  aria-label={`Current band ${overall.toFixed(1)} of goal ${target.toFixed(1)}`}
                >
                  <div className="relative h-3 rounded-full bg-indigo-100 dark:bg-blue-900/60 overflow-visible">
                    <div
                      className={cn(
                        "absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-emerald-400 to-emerald-500",
                        !reduced && "transition-[width] duration-1000 ease-out"
                      )}
                      style={{ width: mounted || reduced ? `${fillPct}%` : "0%" }}
                    />
                    {rungs.map((rung) => {
                      const leftPct = (rung / target) * 100;
                      if (leftPct > 100.001) return null;
                      const reached = overall >= rung - 0.001;
                      const isNext = !reached && Math.abs(rung - milestone.next) < 0.001;
                      return (
                        <span
                          key={rung}
                          className={cn(
                            "absolute top-1/2 -translate-y-1/2 -translate-x-1/2 rounded-full transition-all duration-500",
                            isNext
                              ? "h-3.5 w-1 bg-amber-400 shadow-[0_0_6px_rgba(251,191,36,0.9)] animate-pulse"
                              : reached
                                ? "h-2 w-0.5 bg-white/80"
                                : "h-2 w-0.5 bg-indigo-300/70 dark:bg-blue-200/40"
                          )}
                          style={{ left: `${leftPct}%` }}
                          title={`Band ${rung.toFixed(1)}`}
                        />
                      );
                    })}
                    {!milestone.reachedTarget && (
                      <span
                        className={cn(
                          "absolute top-1/2 -translate-y-1/2 -translate-x-1/2 h-4 w-4 rounded-full bg-white ring-2 ring-emerald-400 shadow-sm",
                          !reduced && "transition-[left] duration-1000 ease-out",
                          !reduced && "after:absolute after:inset-0 after:rounded-full after:bg-emerald-400/40 after:animate-ping"
                        )}
                        style={{ left: mounted || reduced ? `${fillPct}%` : "0%" }}
                        aria-hidden="true"
                      />
                    )}
                  </div>
                </div>
              );
            })()}

            <div className="flex items-center justify-between mt-3 text-[11px] font-medium text-indigo-500 dark:text-blue-300/80">
              <span>now · band {overall.toFixed(1)}</span>
              <span>
                {milestone.reachedTarget
                  ? "goal reached"
                  : `${rungsToGoal} step${rungsToGoal === 1 ? "" : "s"} to your goal of ${target.toFixed(1)}`}
              </span>
            </div>
          </div>
        </div>

        {/* Stat cards — pure white in light; translucent slate in dark so they
            still pop against the deep blue while keeping the oceanic depth. */}
        <div className="flex-shrink-0 flex flex-col sm:flex-row gap-3">
          <div className="text-center bg-white dark:bg-slate-800/80 dark:border dark:border-blue-700/40 rounded-2xl px-6 py-3 shadow-sm">
            <p className="text-xs font-bold text-indigo-400 dark:text-blue-300 uppercase tracking-widest mb-0.5">
              Current Band
            </p>
            <p className="text-4xl font-black text-indigo-950 dark:text-white leading-none tabular-nums">
              {animatedBand.toFixed(1)}
            </p>
            <p className="text-xs text-slate-400 dark:text-blue-300/70 mt-0.5">
              {milestone.reachedTarget ? "Target reached 🎉" : <>Next: {milestone.next.toFixed(1)}</>}
            </p>
          </div>
          <div className="text-center bg-white dark:bg-slate-800/80 dark:border dark:border-blue-700/40 rounded-2xl px-6 py-3 shadow-sm">
            <p className="text-xs font-bold text-indigo-400 dark:text-blue-300 uppercase tracking-widest mb-0.5 flex items-center justify-center gap-1">
              <Target className="h-3 w-3" /> Target
            </p>
            <p className="text-4xl font-black text-indigo-950 dark:text-white leading-none tabular-nums">
              {target.toFixed(1)}
            </p>
            <p className="text-xs text-slate-400 dark:text-blue-300/70 mt-0.5">goal band</p>
          </div>
          <div className="text-center bg-white dark:bg-slate-800/80 dark:border dark:border-blue-700/40 rounded-2xl px-6 py-3 shadow-sm">
            <p className="text-xs font-bold text-indigo-400 dark:text-blue-300 uppercase tracking-widest mb-0.5 flex items-center justify-center gap-1">
              <Zap className="h-3 w-3" /> Momentum
            </p>
            <p className="text-4xl font-black text-indigo-950 dark:text-white leading-none tabular-nums">
              {Math.round(animatedPts).toLocaleString()}
            </p>
            <p className="text-xs text-slate-400 dark:text-blue-300/70 mt-0.5">pts</p>
          </div>
        </div>
      </div>
    </section>
  );
};

const FocusAreaCard = ({
  sub_skill, band, skill, isLocked, drillsLeft,
  nextAction, dailyDCS, dcsThreshold, extraCost, totalMomentum,
  buyingExtra, confirmExtra, onStartDrill, onRequestConfirm, onCancelConfirm, onConfirmBuy
}: any) => {
  if (band === 9.0 && sub_skill === "All Caught Up!") {
    return (
      <div className="h-full rounded-3xl border border-emerald-200 dark:border-emerald-500/20 p-6 bg-emerald-50 dark:bg-emerald-500/10 flex flex-col items-center justify-center text-center shadow-sm">
        <div className="h-16 w-16 rounded-full bg-emerald-100 dark:bg-emerald-500/20 flex items-center justify-center mb-4">
          <CheckCircle2 className="h-8 w-8 text-emerald-500" />
        </div>
        <h2 className="text-lg font-bold text-slate-800 dark:text-white mb-2 tracking-tight">Daily Priorities Knocked Out!</h2>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          You have completed the required drills for your weakest sub-skills today.
        </p>
      </div>
    );
  }

  const isFreeDrill      = ['DRILL_1', 'DRILL_2', 'DRILL_3'].includes(nextAction);
  const isLexiGate       = nextAction === 'LEXIGRID';
  const isExtraReady     = nextAction === 'EXTRA_DRILL_AVAILABLE';
  const isExtraPrepaid   = nextAction === 'EXTRA_DRILL_READY';
  const isLowDCS         = nextAction === 'DRILL_LOCKED_LOW_DCS';
  const isLowPts         = nextAction === 'DRILL_LOCKED_INSUFFICIENT_PTS';
  const isExtraLocked    = isLowDCS || isLowPts || isExtraReady || isExtraPrepaid;
  const showDCSMeter     = isLowDCS || isLowPts || isExtraReady;

  const guide = getSubSkillGuide(sub_skill);

  const cardBg = isLocked
    ? "bg-white dark:bg-slate-900 border-indigo-200 dark:border-indigo-500/30 ring-1 ring-indigo-500/20"
    : isExtraLocked
      ? "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700"
      : "bg-indigo-50 dark:bg-indigo-500/10 border-indigo-200 dark:border-indigo-500/25";

  return (
    <div className={cn("h-full rounded-3xl border p-6 flex flex-col transition-all duration-500 shadow-sm", cardBg)}>

      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2">
          <Zap className="h-5 w-5 text-indigo-500" />
          <h2 className="text-sm font-bold text-slate-800 dark:text-white uppercase tracking-wider">
            Next Best Action
          </h2>
        </div>
        {isLocked && drillsLeft > 0 && (
          <span className="text-[10px] font-bold uppercase tracking-wider bg-indigo-100 text-indigo-600 dark:bg-indigo-500/20 dark:text-indigo-400 px-3 py-1 rounded-full animate-pulse">
            Required: {drillsLeft} Left
          </span>
        )}
        {isExtraLocked && (
          <span className="text-[10px] font-bold uppercase tracking-wider bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400 px-3 py-1 rounded-full">
            3 / 3 Done
          </span>
        )}
      </div>

      <div className="flex items-center gap-5 mb-4">
        <div className="flex-shrink-0 h-16 w-16 rounded-2xl bg-indigo-100 dark:bg-indigo-500/20 flex items-center justify-center border border-indigo-200 dark:border-indigo-500/30">
          <Target className="h-8 w-8 text-indigo-500" />
        </div>
        <div>
          <p className="text-xl font-bold text-slate-800 dark:text-white leading-snug tracking-tight mb-1">
            {toTitleCase(sub_skill)} Drill
          </p>
          <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
            <span>{toTitleCase(skill)}</span>
            <span className="w-1 h-1 rounded-full bg-slate-300 dark:bg-slate-600" />
            <span>Sub-score: <strong className="text-indigo-600 dark:text-indigo-400">{band.toFixed(1)}</strong></span>
          </div>
        </div>
      </div>

      {guide && (
        <div className="mb-6 flex items-start gap-2 text-xs text-slate-500 dark:text-slate-400 bg-white/60 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-700/60 rounded-xl px-3 py-2">
          <Lightbulb className="h-3.5 w-3.5 text-amber-500 flex-shrink-0 mt-0.5" />
          <span>{guide.blurb} Today's pick: the <strong className="text-slate-700 dark:text-slate-200">{guide.drillLabel}</strong>.</span>
        </div>
      )}

      <div className="mt-auto space-y-3">

        {showDCSMeter && (
          <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Daily Competency Score</p>
                <p className="text-base font-black text-slate-800 dark:text-white">
                  {dailyDCS}%
                  <span className="text-xs font-normal text-slate-400 ml-1">/ need {dcsThreshold}%</span>
                </p>
              </div>
              <span className={cn(
                "text-[10px] font-bold px-2.5 py-1 rounded-full",
                dailyDCS >= dcsThreshold
                  ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400"
                  : "bg-rose-100 text-rose-700 dark:bg-rose-500/20 dark:text-rose-400"
              )}>
                {dailyDCS >= dcsThreshold ? "✓ Eligible" : "Not eligible"}
              </span>
            </div>
            <div className="w-full h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
              <div
                className={cn("h-full rounded-full transition-all duration-500",
                  dailyDCS >= dcsThreshold ? "bg-emerald-500" : "bg-rose-400")}
                style={{ width: `${Math.min(100, dailyDCS)}%` }}
              />
            </div>
          </div>
        )}

        {isLexiGate && (
          <div className="w-full flex items-center justify-center gap-2 bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500 font-semibold text-sm py-3.5 rounded-xl border border-slate-200 dark:border-slate-700 cursor-not-allowed select-none">
            <Lock className="h-4 w-4" /> Complete LexiGrid to unlock
          </div>
        )}

        {isLowDCS && (
          <div className="w-full flex items-center justify-center gap-2 bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500 font-semibold text-sm py-3.5 rounded-xl border border-slate-200 dark:border-slate-700 cursor-not-allowed select-none">
            <Lock className="h-4 w-4" /> Improve accuracy to unlock extra
          </div>
        )}

        {isLowPts && (
          <div className="w-full flex items-center justify-center gap-2 bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500 font-semibold text-sm py-3.5 rounded-xl border border-slate-200 dark:border-slate-700 cursor-not-allowed select-none">
            <Lock className="h-4 w-4" /> Need {extraCost} pts to unlock
          </div>
        )}

        {isExtraPrepaid && (
          <button
            onClick={onStartDrill}
            className="w-full flex items-center justify-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-sm py-3.5 rounded-xl transition-all shadow-md active:scale-[0.98]"
          >
            <CheckCircle2 className="h-4 w-4" /> Start Extra Drill — Session Ready
          </button>
        )}

        {isExtraReady && !confirmExtra && (
          <button
            onClick={onRequestConfirm}
            disabled={buyingExtra}
            className="w-full flex items-center justify-center gap-2 bg-amber-500 hover:bg-amber-600 text-white font-bold text-sm py-3.5 rounded-xl transition-all shadow-md active:scale-[0.98] disabled:opacity-40"
          >
            <Zap className="h-4 w-4" /> Unlock Extra Drill — {extraCost} pts
          </button>
        )}

        {isExtraReady && confirmExtra && (
          <div className="space-y-2">
            <p className="text-xs text-slate-500 dark:text-slate-400 text-center">
              Spend <strong className="text-amber-500">{extraCost} pts</strong> from your {totalMomentum} pts balance?
            </p>
            <div className="flex gap-2">
              <button onClick={onCancelConfirm} className="flex-1 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 font-semibold text-sm hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
                Cancel
              </button>
              <button onClick={onConfirmBuy} disabled={buyingExtra} className="flex-1 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-sm transition-colors disabled:opacity-40">
                {buyingExtra ? "Unlocking…" : "Confirm — Spend " + extraCost + " pts"}
              </button>
            </div>
          </div>
        )}

        {isFreeDrill && (
          <button
            onClick={onStartDrill}
            className="w-full flex items-center justify-center gap-2 bg-indigo-500 hover:bg-indigo-600 text-white font-semibold text-sm py-3.5 rounded-xl transition-all shadow-md hover:shadow-lg active:scale-[0.98]"
          >
            Start Priority Drill <ArrowRight className="h-4 w-4" />
          </button>
        )}

      </div>
    </div>
  );
};

const SkillBandCard = ({
  band, onNavigate, onDrill,
}: {
  band: SkillBand;
  onNavigate: () => void;
  onDrill: (skill: string, guide: SubSkillGuide, score: number) => void;
}) => {
  const [expanded, setExpanded] = useState(false);
  const pct = Math.round((band.score / 9) * 100);

  const subEntries = band.subScores
    ? Object.entries(band.subScores).filter(([key, val]) => {
        const numVal = Number(val);
        if (isNaN(numVal) || numVal > 9.0) return false;
        const k = key.toLowerCase();
        return !k.includes("count") && !k.includes("total") && !k.includes("correct");
      })
    : [];

  return (
    <div
      className={`text-left w-full rounded-3xl border p-5 flex flex-col transition-all duration-200 hover:shadow-md bg-white dark:bg-slate-900 ${band.border} shadow-sm`}
    >
      <button onClick={onNavigate} className="text-left w-full">
        <div className="flex items-center justify-between mb-4 w-full">
          <div className={`flex items-center justify-center h-10 w-10 rounded-xl ${band.bg} ${band.color}`}>
            {band.icon}
          </div>
        </div>
        <p className="text-3xl font-bold text-slate-800 dark:text-white tracking-tight">
          {band.score.toFixed(1)}
        </p>
        <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mt-1 mb-4">
          {band.skill}
        </p>
        <div className="h-1.5 w-full rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden mb-4">
          <div
            className={`h-full rounded-full transition-all duration-700 ${band.color.replace("text-", "bg-")}`}
            style={{ width: `${pct}%` }}
          />
        </div>
      </button>

      {subEntries.length > 0 && (
        <div className="mt-auto w-full">
          <div className="grid grid-cols-2 gap-2 w-full">
            {subEntries.map(([key, val]) => {
              let label = key.replace(/Score/g, "").replace(/_/g, " ").replace(/([A-Z])/g, " $1").trim();
              label = label.charAt(0).toUpperCase() + label.slice(1);
              const numVal = Number(val);
              const tier = scoreTier(numVal);
              return (
                <div
                  key={key}
                  className="flex flex-col gap-0.5 text-[10px] bg-slate-50 dark:bg-slate-800/50 px-2 py-1.5 rounded-lg border border-slate-100 dark:border-slate-800"
                >
                  <div className="flex justify-between items-center">
                    <span className="text-slate-500 truncate mr-1" title={label}>{label}</span>
                    <span className="font-bold text-slate-700 dark:text-slate-300">
                      {!Number.isInteger(numVal) ? numVal.toFixed(1) : numVal}
                    </span>
                  </div>
                  <span className={cn(
                    "font-semibold",
                    tier.tone === "low" ? "text-amber-600 dark:text-amber-400"
                      : tier.tone === "mid" ? "text-sky-600 dark:text-sky-400"
                      : "text-emerald-600 dark:text-emerald-400"
                  )}>
                    {tier.label}
                  </span>
                </div>
              );
            })}
          </div>

          <button
            onClick={() => setExpanded((e) => !e)}
            className="mt-3 w-full flex items-center justify-center gap-1 text-[11px] font-semibold text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 transition-colors"
            aria-expanded={expanded}
          >
            {expanded ? "Hide tips" : "What do these mean?"}
            <ChevronDown className={cn("h-3.5 w-3.5 transition-transform", expanded && "rotate-180")} />
          </button>

          {expanded && (
            <div className="mt-3 space-y-2 animate-in fade-in slide-in-from-top-1">
              {subEntries.map(([key, val]) => {
                const numVal = Number(val);
                const guide = getSubSkillGuide(key);
                let label = key.replace(/Score/g, "").replace(/_/g, " ").replace(/([A-Z])/g, " $1").trim();
                label = label.charAt(0).toUpperCase() + label.slice(1);
                const needsWork = numVal < 6.0;
                return (
                  <div
                    key={key}
                    className="rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/40 p-2.5"
                  >
                    <p className="text-[11px] font-bold text-slate-700 dark:text-slate-200">
                      {label} · {!Number.isInteger(numVal) ? numVal.toFixed(1) : numVal}
                    </p>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 leading-snug">
                      {guide?.blurb ?? "A breakdown of this skill area."}
                    </p>
                    {guide && (
                      <button
                        onClick={() => onDrill(band.skill, guide, numVal)}
                        className={cn(
                          "mt-1.5 inline-flex items-center gap-1 text-[11px] font-semibold transition-colors",
                          needsWork
                            ? "text-amber-600 dark:text-amber-400 hover:text-amber-700"
                            : "text-indigo-600 dark:text-indigo-400 hover:text-indigo-700"
                        )}
                      >
                        {needsWork ? "Next step: " : "Sharpen it: "}
                        {guide.drillLabel}
                        <ArrowRight className="h-3 w-3" />
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

const PredictedReadinessCard = ({ readiness }: any) => {
  const statusConfig = {
    "on-track": {
      icon: <CheckCircle2 className="h-5 w-5 text-emerald-500" />,
      color: "text-emerald-600",
      bg: "bg-emerald-50 dark:bg-emerald-500/5",
      border: "border-emerald-200 dark:border-emerald-500/20",
    },
    warn: {
      icon: <AlertTriangle className="h-5 w-5 text-amber-500" />,
      color: "text-amber-600",
      bg: "bg-amber-50 dark:bg-amber-500/5",
      border: "border-amber-200 dark:border-amber-500/20",
    },
    catchup: {
      icon: <Compass className="h-5 w-5 text-amber-500" />,
      color: "text-amber-600",
      bg: "bg-amber-50 dark:bg-amber-500/5",
      border: "border-amber-200 dark:border-amber-500/20",
    },
  };
  const cfg =
    statusConfig[readiness.status as keyof typeof statusConfig] ?? statusConfig["on-track"];

  return (
    <div className={`h-full rounded-3xl border ${cfg.bg} ${cfg.border} p-6 shadow-sm flex flex-col`}>
      <div className="flex items-center gap-2 mb-4">
        <CalendarClock className="h-5 w-5 text-slate-500" />
        <h2 className="text-sm font-bold text-slate-800 dark:text-white uppercase tracking-wider">
          Predicted Readiness
        </h2>
      </div>
      <div className="space-y-4 mt-2">
        <div className="flex justify-between items-center">
          <span className="text-sm text-slate-500">Target Band</span>
          <span className="text-base font-semibold text-slate-800 dark:text-white">{readiness.targetBand}</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-sm text-slate-500">Days Left</span>
          <span className="text-base font-semibold text-slate-800 dark:text-white">{readiness.daysLeft} days</span>
        </div>
        <div className="flex justify-between items-center pt-2 border-t border-slate-200/50 dark:border-slate-700/50">
          <span className="text-sm text-slate-500 font-medium">Exam Date</span>
          <span className="text-sm font-bold text-slate-700 dark:text-slate-300">{readiness.targetDate}</span>
        </div>
      </div>
      <div className={`mt-auto pt-4 flex items-center gap-2 p-3 rounded-xl bg-white/60 dark:bg-slate-900/40 border ${cfg.border}`}>
        {cfg.icon}
        <p className={`text-xs font-bold ${cfg.color}`}>{readiness.trajectory}</p>
      </div>
    </div>
  );
};

const ModuleNavCard = ({ band, onNavigate }: any) => (
  <button
    onClick={onNavigate}
    className={`text-left w-full flex items-center gap-4 p-4 rounded-2xl border transition-all duration-200 hover:scale-[1.01] hover:shadow-sm bg-white dark:bg-slate-900 ${band.border} group`}
  >
    <div className={`flex-shrink-0 h-12 w-12 rounded-xl flex items-center justify-center ${band.bg} ${band.color}`}>
      {band.icon}
    </div>
    <div className="flex-1 min-w-0">
      <p className="text-sm font-bold text-slate-800 dark:text-white">{band.skill}</p>
      <p className="text-xs text-slate-500 mt-0.5">Band {band.score} → {band.target}</p>
    </div>
  </button>
);

const DashboardCard = ({ title, subtitle, children, icon }: any) => (
  <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm h-full">
    <div className="mb-5">
      <h2 className="text-sm font-bold text-slate-800 dark:text-white flex items-center gap-2 uppercase tracking-wider">
        {icon && <span>{icon}</span>} {title}
      </h2>
      {subtitle && <p className="text-xs text-slate-500 mt-1">{subtitle}</p>}
    </div>
    {children}
  </div>
);


const AttendanceStreakTracker = ({ currentStreak, goal = 7 }: any) => {
  const progress = Math.min((currentStreak / goal) * 100, 100);
  return (
    <div className="flex flex-col items-center py-2">
      <div className="relative flex items-center justify-center h-24 w-24 mb-4">
        <svg className="rotate-[-90deg]" width="96" height="96">
          <circle cx="48" cy="48" r="40" fill="none" stroke="#fed7aa" strokeWidth="8" className="dark:stroke-orange-500/20" />
          <circle
            cx="48" cy="48" r="40" fill="none" stroke="#f97316" strokeWidth="8"
            strokeDasharray={`${2 * Math.PI * 40}`}
            strokeDashoffset={`${2 * Math.PI * 40 * (1 - progress / 100)}`}
            strokeLinecap="round"
            className="transition-all duration-700 ease-out"
          />
        </svg>
        <div className="absolute flex flex-col items-center">
          <Flame className="h-6 w-6 text-orange-500" />
          <span className="text-xl font-bold text-slate-800 dark:text-white leading-none mt-1">
            {currentStreak}
          </span>
        </div>
      </div>
      <p className="text-sm font-medium text-slate-500 dark:text-slate-400 text-center">
        {currentStreak >= goal
          ? "Weekly goal hit! 🎉"
          : `${goal - currentStreak} more to reach ${goal}-day goal`}
      </p>
    </div>
  );
};

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
  blue: { bg: "bg-blue-500", border: "border-blue-500", text: "text-blue-600 dark:text-blue-400", ring: "ring-blue-500/30" },
  purple: { bg: "bg-purple-500", border: "border-purple-500", text: "text-purple-600 dark:text-purple-400", ring: "ring-purple-500/30" },
  teal: { bg: "bg-teal-500", border: "border-teal-500", text: "text-teal-600 dark:text-teal-400", ring: "ring-teal-500/30" },
  amber: { bg: "bg-amber-500", border: "border-amber-500", text: "text-amber-600 dark:text-amber-400", ring: "ring-amber-500/30" },
  slate: { bg: "bg-slate-400", border: "border-slate-300 dark:border-slate-600", text: "text-slate-500 dark:text-slate-400", ring: "ring-slate-400/30" },
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
          const isToday = idx === currentDayIndex;
          const isFuture = idx > currentDayIndex;
          const colors = colorConfig[day.color];
          return (
            <div key={day.day} className="relative z-10 flex flex-col items-center gap-3">
              <div
                className={`w-4 h-4 rounded-full transition-all duration-300
                  ${isFuture ? `bg-white dark:bg-slate-900 border-2 ${colors.border}` : colors.bg}
                  ${isToday ? `ring-4 ring-offset-2 dark:ring-offset-slate-900 ${colors.ring} scale-125` : ""}
                `}
              />
              <span className={`text-[10px] font-bold uppercase tracking-widest ${isToday ? "text-slate-800 dark:text-white" : "text-slate-400 dark:text-slate-500"}`}>
                {day.day}
              </span>
            </div>
          );
        })}
      </div>
      <div className="bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700/50 rounded-2xl p-4 text-center">
        <p className="text-sm font-medium text-slate-600 dark:text-slate-300">
          Today:{" "}
          <span className={`ml-1 font-semibold ${colorConfig[todayConfig.color].text}`}>
            {todayConfig.text}
          </span>
        </p>
      </div>
    </div>
  );
};

export default StudentDashboardPage;