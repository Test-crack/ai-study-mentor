// src/features/Student/pages/StudentDashboardPage.tsx
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
import { bandFillPct } from "@/shared/utils/bandScale";
import {
  Flame, Target, Zap, BookOpen, Mic, PenLine,
  Headphones, CalendarClock, CheckCircle2, ArrowRight, Puzzle,
  Lock, AlertTriangle, ChevronDown, Lightbulb, TrendingUp, Compass,
  Wallet,
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
  { skill: "Listening", score: 0.0, target: 0.0, delta: 0.0, route: "/student/listening", icon: <Headphones className="h-5 w-5" />, color: "text-sky-600", bg: "bg-sky-50", border: "border-sky-200" },
  { skill: "Reading", score: 0.0, target: 0.0, delta: 0.0, route: "/student/reading", icon: <BookOpen className="h-5 w-5" />, color: "text-brand-blue-600", bg: "bg-brand-blue-50", border: "border-brand-blue-200" },
  { skill: "Writing", score: 0.0, target: 0.0, delta: 0.0, route: "/student/writing", icon: <PenLine className="h-5 w-5" />, color: "text-amber-600", bg: "bg-amber-50", border: "border-amber-200" },
  { skill: "Speaking", score: 0.0, target: 0.0, delta: 0.0, route: "/student/speaking-assessment", icon: <Mic className="h-5 w-5" />, color: "text-rose-600", bg: "bg-rose-50", border: "border-rose-200" },
];

// ─── PREDICTED READINESS (frontend-only model) ────────────────────────────────
// Base improvement pace: ≈ 0.5 band per 4 weeks of consistent practice.
const BASE_PACE_PER_WEEK = 0.125;

// Consistency multiplier — misses/streak directly scale the projected pace:
// less login, less output.
const consistencyFactor = (misses: number, streak: number): number => {
  if (misses >= 2) return 0.6;
  if (misses === 1) return 0.8;
  return streak >= 7 ? 1.1 : 1.0;
};

type ReadinessStatus = "on-track" | "warn" | "catchup" | "no-date" | "exam-passed";

interface Readiness {
  status: ReadinessStatus;
  targetBand: number;
  targetDate: string | null;
  daysLeft: number;
  projectedBand: number | null;
  trajectory: string;
}

const computeReadiness = (
  current: number,
  target: number,
  examDate: string | null,
  misses: number,
  streak: number
): Readiness => {
  if (!examDate) {
    return {
      status: "no-date",
      targetBand: target,
      targetDate: null,
      daysLeft: 0,
      projectedBand: null,
      trajectory: "Set your exam date in your profile to unlock readiness prediction.",
    };
  }
  const daysLeft = Math.ceil((new Date(examDate).getTime() - Date.now()) / 86400000);
  if (daysLeft <= 0) {
    return {
      status: "exam-passed",
      targetBand: target,
      targetDate: examDate,
      daysLeft: 0,
      projectedBand: current,
      trajectory: "Your exam date has passed — update it in your profile.",
    };
  }
  const weeksLeft = daysLeft / 7;
  const factor = consistencyFactor(misses, streak);
  const projectedRaw = Math.min(9.0, current + BASE_PACE_PER_WEEK * factor * weeksLeft);
  const projected = Math.round(projectedRaw * 2) / 2;
  const gap = target - projectedRaw;

  let status: ReadinessStatus;
  let trajectory: string;
  if (current >= target) {
    status = "on-track";
    trajectory = `You're already at Band ${current.toFixed(1)} — hold steady until ${examDate}.`;
  } else if (gap <= 0) {
    status = "on-track";
    trajectory = `At current pace: Band ${projected.toFixed(1)} by ${examDate} — on track.`;
  } else if (gap <= 0.5) {
    status = "warn";
    trajectory = misses === 1
      ? `Projected Band ${projected.toFixed(1)} — a missed session is slowing you. A couple of drills brings you back.`
      : `Projected Band ${projected.toFixed(1)} — slightly behind. Consistent daily drills close the gap.`;
  } else {
    status = "catchup";
    trajectory = misses >= 2
      ? `Projected Band ${projected.toFixed(1)} — let's rebuild your rhythm. Your tutor is looped in to help.`
      : `Projected Band ${projected.toFixed(1)} — the gap to ${target.toFixed(1)} needs more sessions per week.`;
  }
  return { status, targetBand: target, targetDate: examDate, daysLeft, projectedBand: projected, trajectory };
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
  if (n < 5.0) return { label: "Just starting", tone: "low" };
  if (n < 6.5) return { label: "Building up",   tone: "mid" };
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
  if (score < 5.5) return 'BEGINNER';
  if (score < 7.0) return 'INTERMEDIATE';
  return 'ADVANCED';
};

// ─── MAIN COMPONENT ──────────────────────────────────────────────────────────

const StudentDashboardPage = () => {
  const [activeTab, setActiveTab] = useState("dashboard");
  const [showPremiumModal, setShowPremiumModal] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(true);
  const [skillBands, setSkillBands] = useState<SkillBand[]>(SKILL_BANDS);
  const [nextActionDrill, setNextActionDrill] = useState<any>(null);
  const [targetBand, setTargetBand] = useState(7.0);
  const [examDate, setExamDate] = useState<string | null>(null); // 'YYYY-MM-DD'

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

  const { syncMomentum, updateStreak, totalMomentum } = useMomentum();

  // Missed-IA state is authoritative on the server (getIAStatus deducts momentum and
  // records misses). Until that feed is surfaced here, show no fabricated misses — the
  // previous hard-coded MOCK_MISSED_STATE=1 shipped a fake "behind schedule" banner,
  // a fake client-side −20/week penalty that fought syncMomentum, and could lock the
  // dashboard for every student.
  const missedData = { misses: 0, subSkills: [] as string[] };

  const displayName = profile?.name || user?.email?.split("@")[0] || "Student";
  const overall = overallBand(skillBands);

  // Real frontend-only readiness calculation — current band, target, exam
  // date, and consistency (misses + streak) all feed the projection.
  const dynamicReadiness = computeReadiness(
    overall,
    targetBand,
    examDate,
    missedData.misses,
    dailyDrillState?.daily_streak ?? 0
  );

  const milestone = getNextMilestone(overall, dynamicReadiness.targetBand);
  const isLocked = !dailyDrillState || !dailyDrillState.dashboard_unlocked;

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
    const fetchCompetencyScores = async () => {
      try {
        const backendUrl = import.meta.env.VITE_BACKEND_URL || "http://localhost:4000";
        const resData = await callBackend(`${backendUrl}/api/student/competency-scores`);
        if (resData.success && resData.data) {
          const fetchedTarget = Number(resData.target_band) || 7.0;
          setTargetBand(fetchedTarget);
          // Exam date — dual casing until the backend contract is confirmed.
          const rawExam = resData.exam_date ?? resData.examDate ?? null;
          const d = rawExam ? new Date(rawExam) : null;
          setExamDate(d && !isNaN(d.getTime()) ? d.toISOString().slice(0, 10) : null);
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

  const heroNextAction = dailyDrillState?.next_action ?? 'DRILL_1';
  const heroLexiDone   = dailyDrillState?.lexigrid_completed_today ?? false;

  const goToActiveDrill = useCallback(() => {
    const params = new URLSearchParams({
      skill: focusData.skill,
      sub_skill: focusData.sub_skill,
      level: getLevelFromScore(focusData.band),
      ...(heroNextAction === 'EXTRA_DRILL_AVAILABLE' || heroNextAction === 'EXTRA_DRILL_READY' ? { extra: 'true' } : {})
    });
    navigate(`/student/drill?${params.toString()}`);
  }, [focusData, heroNextAction, navigate]);

  const goToLexiGridFromHero = useCallback(() => {
    const level = getLevelFromScore(overall);
    navigate(
      heroNextAction === 'LEXIGRID'
        ? `/student/lexigrid?difficulty=${level}&mode=gate`
        : `/student/lexigrid?difficulty=${level}`
    );
  }, [heroNextAction, overall, navigate]);

  return (
    <div className="min-h-screen bg-brand-bg font-dm transition-colors duration-300">
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
            <div className="absolute inset-0 z-40 bg-brand-bg-alt/60 backdrop-blur-md rounded-3xl" />
          )}

          {/* ── Hero Banner — "The Climb" ─────────────────────────────────────── */}
          <ClimbHero
            displayName={displayName}
            streak={dailyDrillState?.daily_streak ?? 0}
            overall={overall}
            milestone={milestone}
            target={dynamicReadiness.targetBand}
            momentum={totalMomentum}
            isLocked={isLocked}
            nextAction={heroNextAction}
            lexiDone={heroLexiDone}
            onStartActiveDrill={goToActiveDrill}
            onOpenLexiGrid={goToLexiGridFromHero}
          />

          {/* ── Daily Notices ────────────────────────────────────────────────── */}
          <div className={cn("transition-all duration-500", isLocked && "relative z-50")}>
            <DailyNotices isLocked={isLocked} />
          </div>

          {/* ── Gentle Catch-Up Banner (2+ misses) — Option 1 neutral slate ───── */}
          {missedData.misses >= 2 && (
            <div className="relative z-50 bg-brand-bg-alt border border-brand-line text-brand-text p-6 rounded-2xl shadow-sm flex flex-col sm:flex-row sm:items-center gap-4 animate-in slide-in-from-top-4">
              <div className="w-12 h-12 flex-shrink-0 bg-brand-bg-alt rounded-full flex items-center justify-center">
                <Compass className="w-6 h-6 text-brand-text-mute" />
              </div>
              <div className="flex-1">
                <h3 className="font-dm text-lg font-bold text-brand-text tracking-tight">
                  Let's pick things back up
 </h3>
 <p className="text-sm font-medium text-brand-text-mute mt-0.5">
 Looks like a couple of sessions slipped by — no worries, it happens to everyone.
 Your momentum will climb right back as soon as you start a drill, and your tutor
 is looped in to help.
 </p>
 </div>
 <button
 onClick={() => navigate("/student/drill")}
 className="flex-shrink-0 inline-flex items-center justify-center gap-2 bg-brand-teal-600 hover:bg-brand-teal-700 text-white font-bold text-sm py-3 px-5 rounded-xl transition-colors active:scale-[0.98]"
 >
 Get back on track <ArrowRight className="w-4 h-4" />
 </button>
 </div>
 )}

 {/* ── Platform Lock Banner ─────────────────────────────────────────── */}
 {isLocked && missedData.misses < 2 && dailyDrillState && (
 <div className="relative z-50 bg-white border border-brand-line p-6 rounded-2xl shadow-xl flex items-center justify-between animate-in slide-in-from-top-4">
 <div className="flex items-center gap-4">
 <div className="w-12 h-12 bg-brand-teal-100 rounded-full flex items-center justify-center">
 <Lock className="w-6 h-6 text-brand-teal-500" />
 </div>
 <div>
 <h3 className="font-dm text-lg font-black text-brand-text uppercase">
 Platform Locked
 </h3>
 <p className="text-sm font-medium text-brand-text-mute ">
 {dailyDrillState.next_action ==='DRILL_1'
 ? <>Finish <strong className="text-brand-teal-500">2 drills</strong> today to unlock the full platform.</>
 : dailyDrillState.next_action ==='LEXIGRID'
 ? <>Complete <strong className="text-brand-teal-500">LexiGrid</strong> (5 words) to unlock your second drill.</>
 : <>LexiGrid done — complete <strong className="text-brand-teal-500">1 more drill</strong> to unlock full access.</>
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
 const drillsToday = dailyDrillState?.drills_completed_today ?? 0;
 const nextAction = dailyDrillState?.next_action ??'DRILL_1';
 const lexiGridIsGate = nextAction ==='LEXIGRID';
 const drillLocked = nextAction ==='DRILL_LOCKED_INSUFFICIENT_PTS'
 || nextAction ==='DRILL_LOCKED_LOW_DCS'
 || nextAction ==='DAILY_LIMIT_REACHED';
 const canBuyExtra = dailyDrillState?.can_buy_extra ?? false;
 const dailyDCS = dailyDrillState?.daily_dcs ?? 0;
 const dcsThreshold = dailyDrillState?.dcs_threshold ?? 40;
 const drillsToUnlock = Math.max(0, 2 - drillsToday);

 const handleBuyExtra = async () => {
 setBuyingExtra(true);
 setConfirmExtra(false);
 try {
 const backendUrl = import.meta.env.VITE_BACKEND_URL || "http://localhost:4000";
 const res = await callBackend(`${backendUrl}/api/drills/authorize-extra`, { method:'POST'});
 if (res.success) {
 syncMomentum(res.momentum_score);
 const params = new URLSearchParams({
 skill: focusData.skill,
 sub_skill: focusData.sub_skill,
 level: getLevelFromScore(focusData.band),
 extra:'true'
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
 skill: focusData.skill,
 sub_skill: focusData.sub_skill,
 level: getLevelFromScore(focusData.band),
 ...(nextAction ==='EXTRA_DRILL_AVAILABLE'|| nextAction ==='EXTRA_DRILL_READY'? { extra:'true'} : {})
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
 extraCost={dailyDrillState?.extra_session_cost ?? 300}
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
 const isLexiGate = dailyDrillState?.next_action ==='LEXIGRID';
 const lexiDone = dailyDrillState?.lexigrid_completed_today ?? false;
 const lexiBlocked = !isLexiGate && isLocked && !lexiDone;

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
 "h-full relative overflow-hidden rounded-3xl bg-brand-teal-wash p-6 flex flex-col justify-center group shadow-sm transition-all duration-300",
 isLexiGate
 ? "border-2 border-brand-teal-400 cursor-pointer hover:shadow-brand-teal-500/20"
 : "border border-brand-teal-200 cursor-pointer hover:shadow-brand-teal-500/10"
 )}
 >
 <div className="absolute top-0 right-0 w-32 h-32 bg-brand-teal-400/10 blur-[50px] group-hover:bg-brand-teal-400/20 transition-colors" />
 <div className="relative z-10 flex items-start gap-5">
 <div className="w-14 h-14 rounded-2xl bg-brand-teal-100 border border-brand-teal-200 flex items-center justify-center flex-shrink-0">
 <Puzzle className="w-7 h-7 text-brand-teal-600 " />
 </div>
 <div>
 <div className="flex items-center gap-2 mb-2">
 <h2 className="font-dm text-xl font-bold text-brand-teal-950 tracking-tight">
 LexiGrid
 </h2>
 {isLexiGate && (
 <span className="bg-brand-teal-500/15 text-brand-teal-700 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase animate-pulse">
 Active Gate
 </span>
 )}
 {lexiDone && (
 <span className="bg-emerald-500/15 text-emerald-700 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase">
 ✓ Done
 </span>
 )}
 {!isLexiGate && !lexiDone && (
 <span className="bg-brand-warm/15 text-brand-warm text-[10px] font-bold px-2 py-0.5 rounded-full uppercase">
 Ready
 </span>
 )}
 </div>
 <p className="text-sm text-brand-teal-800/80 font-medium mb-4">
 {isLexiGate
 ? <>Solve <strong className="text-brand-teal-700 ">5 words</strong> to unlock Drill 2 — your gate is open now.</>
 : lexiDone
 ? <>Daily momentum earned. Play as many <strong className="text-brand-teal-700 ">practice rounds</strong> as you like — no cap.</>
 : <>Crack today&apos;s vocabulary puzzle to earn your daily <strong className="text-brand-warm ">Momentum</strong>.</>
 }
 </p>
 <button className="bg-brand-teal-600 hover:bg-brand-teal-700 text-white font-semibold text-sm py-2 px-4 rounded-lg transition-colors flex items-center gap-2 shadow-sm">
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

 {/* ── Main Dashboard Content (blurred + clipped when locked) ─────────── */}
 {/*
 While the platform is locked this section is clipped to a short
 teaser instead of rendering full height. That removes the long
 stretch of dead blurred space the student could otherwise scroll
 through, while still hinting that more exists once drills are done.

 Clipping the section's height is deliberate rather than disabling
            page scroll outright: the actionable content above (drill CTA) can
            still exceed a short viewport, and a hard scroll lock would leave
            it unreachable on small phones.
          */}
          <div
            className={cn(
              "relative mt-6",
              isLocked && "max-h-[180px] overflow-hidden"
            )}
          >
            {isLocked && (
              <div className="absolute inset-0 z-40 bg-brand-bg-alt/60 backdrop-blur-md rounded-3xl border border-white/10 flex flex-col items-center pt-24" />
            )}

            <div
              aria-hidden={isLocked}
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
                <div className="lg:col-span-4"><WeeklyRhythmIndicator currentStreak={dailyDrillState?.daily_streak ?? 0} goal={7} /></div>
                <div className="lg:col-span-4">
                  <PredictedReadinessCard readiness={dynamicReadiness} />
                </div>
                <div className="lg:col-span-4">
                  <DashboardCard
                    title="Streak"
                    icon={<Flame className="h-5 w-5 text-brand-warm" />}
                  >
                    <AttendanceStreakTracker currentStreak={dailyDrillState?.daily_streak ?? 0} goal={7} />
                  </DashboardCard>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <IAScheduleWidget />
                <MockStatusWidget />
                <MomentumWalletCard momentum={totalMomentum} />
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
  s.replace(/_/g, '').toLowerCase().replace(/\b\w/g, c => c.toUpperCase());

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
        c: Math.random() < 0.5 ? "52,211,153" : "46,232,166",
      });
    }
  }, [burstKey, enabled, canvasRef]);
};

interface ClimbHeroProps {
  displayName: string;
  streak: number;
  overall: number;
  milestone: { next: number; reachedTarget: boolean; pctToNext: number };
  target: number;
  momentum: number;
  isLocked: boolean;
  nextAction: string;
  lexiDone: boolean;
  onStartActiveDrill: () => void;
  onOpenLexiGrid: () => void;
}

interface GateStep {
  label: string;
  status: "done" | "active" | "locked";
  onAction?: () => void;
  actionLabel?: string;
}

/**
 * ClimbHero — fixed deep-ink oceanic surface with a glowing star-dust field.
 * Inner stat cards stay translucent white so they pop off the dark surface.
 */
const ClimbHero = ({
  displayName, streak,
  overall, milestone, target, momentum, isLocked,
  nextAction, lexiDone, onStartActiveDrill, onOpenLexiGrid,
}: ClimbHeroProps) => {
  const reduced = usePrefersReducedMotion();
  const isDark = useIsDarkMode();
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const step1Done   = nextAction !== 'DRILL_1';
  const step1Active = nextAction === 'DRILL_1';
  const step2Active = nextAction === 'LEXIGRID';
  const step3Done   = !isLocked;
  const step3Active = !isLocked ? false : (nextAction !== 'DRILL_1' && nextAction !== 'LEXIGRID');

  const steps: GateStep[] = [
    {
      label: "Priority Drill",
      status: step1Done ? "done" : step1Active ? "active" : "locked",
      onAction: step1Active ? onStartActiveDrill : undefined,
      actionLabel: "Start priority drill →",
    },
    {
      label: "LexiGrid",
      status: lexiDone ? "done" : step2Active ? "active" : "locked",
      onAction: step2Active ? onOpenLexiGrid : undefined,
      actionLabel: "Play today's grid →",
    },
    {
      label: "Second Drill",
      status: step3Done ? "done" : step3Active ? "active" : "locked",
      onAction: step3Active ? onStartActiveDrill : undefined,
      actionLabel: "Start second drill →",
    },
  ];

  const activeStepIndex = steps.findIndex((s) => s.status === "active");
  const stepOfLabel = !isLocked
    ? "Session complete"
    : `Step ${activeStepIndex === -1 ? 1 : activeStepIndex + 1} of 3`;

  const gateHeadline = !isLocked
    ? "Platform unlocked. The rest of today is yours."
    : step1Active
      ? "Start with your priority drill"
      : step2Active
        ? "Priority drill done. LexiGrid is open."
        : "One drill left to unlock the platform.";

  const gateSubcopy = !isLocked
    ? "Drills and LexiGrid stay open for extra practice. Your internal assessment and monthly mock are below when you want them."
    : step1Active
      ? "Three steps open the full platform: your priority drill, LexiGrid, then a second drill picked from whatever is still weakest."
      : step2Active
        ? "LexiGrid stays unlocked from now on. Solve today's grid to open your second drill."
        : "The second drill is chosen from your weakest remaining criterion. Finish it and everything unlocks for the day.";

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
  //   dark  → soft glowing mint (#7FBFB6 ≈ "127,191,182") for a star-dust look
  //   light → mint ("46,232,166") to match the brand on the pale surface
  const particleColor = isDark ? "127,191,182" : "46,232,166";
  useParticleField(canvasRef, !reduced, burstKey, particleColor);

  const animatedBand = useCountUp(overall, 900, 1);
  const animatedPts = useCountUp(momentum, 1200, 0);

  const rungs: number[] = [];
  for (let b = 4.0; b <= target + 0.0001; b += 0.5) rungs.push(Math.round(b * 2) / 2);
  const rungsToGoal = Math.max(0, Math.round((target - overall) / 0.5));

  const levelLabel = toTitleCase(getLevelFromScore(overall));

  return (
    <section
      className={cn(
        "relative overflow-hidden rounded-3xl bg-brand-ink-deep text-white border border-brand-line-16 p-6 sm:p-8 shadow-sm",
        isLocked && "z-50"
      )}
    >
      {/* Faint mint grid texture — matches the diagnostic hero treatment */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 opacity-[0.06]"
        style={{
          backgroundImage:
            'linear-gradient(to right, #3EE0A0 1px, transparent 1px), linear-gradient(to bottom, #3EE0A0 1px, transparent 1px)',
          backgroundSize: '48px 48px',
        }}
      />
      {!reduced && (
        <canvas
          ref={canvasRef}
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 h-full w-full opacity-70"
        />
      )}
      {/* Soft ambient mint bloom */}
      <div className="pointer-events-none absolute -right-10 -top-10 h-48 w-48 rounded-full bg-brand-teal-500/20 blur-2xl" />

      <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* ── Left: today's gate — headline + numbered step list ───────────── */}
        <div className="lg:col-span-7 min-w-0">
          <div className="flex items-center gap-3 mb-3">
            <span className="h-px w-6 shrink-0 bg-brand-mint" aria-hidden="true" />
            <span className="font-jetbrains text-[10.5px] uppercase tracking-[0.18em] text-brand-mint">
              Today · {stepOfLabel}
            </span>
          </div>

          <h1 className="font-dm text-2xl sm:text-[28px] font-bold tracking-tight mb-2 leading-[1.15]">
            {gateHeadline}
          </h1>
          <p className="text-brand-on-ink-mute text-sm leading-[1.6] max-w-lg mb-5">
            {gateSubcopy}
          </p>

          <div className="space-y-2.5">
            {steps.map((step, idx) => (
              <div
                key={step.label}
                className={cn(
                  "rounded-2xl border px-4 py-3 flex items-center justify-between gap-4 transition-colors duration-300",
                  step.status === "active"
                    ? "bg-brand-teal-900/40 border-brand-mint/30"
                    : "bg-white/5 border-brand-line-16"
                )}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <span
                    className={cn(
                      "flex h-7 w-7 shrink-0 items-center justify-center rounded-full font-jetbrains text-[12px] font-bold",
                      step.status === "done"
                        ? "bg-brand-mint text-brand-ink-deep"
                        : step.status === "active"
                          ? "bg-brand-mint/20 text-brand-mint border border-brand-mint/40"
                          : "bg-white/10 text-brand-on-ink-mute"
                    )}
                  >
                    {step.status === "done" ? "✓" : idx + 1}
                  </span>
                  <div className="min-w-0">
                    <p className={cn(
                      "font-semibold text-[14px] truncate",
                      step.status === "locked" ? "text-brand-on-ink-mute" : "text-white"
                    )}>
                      {step.label}
                    </p>
                    {step.status === "locked" && (
                      <p className="text-[11.5px] text-brand-on-ink-mute">Locked</p>
                    )}
                  </div>
                </div>

                {step.status === "active" && step.onAction ? (
                  <button
                    onClick={step.onAction}
                    className="shrink-0 px-3.5 py-2 bg-brand-mint hover:bg-brand-teal-300 text-brand-ink-deep font-semibold text-[12.5px] rounded-lg transition-colors duration-150 whitespace-nowrap"
                  >
                    {step.actionLabel}
                  </button>
                ) : step.status === "done" ? (
                  <span className="shrink-0 font-jetbrains text-[10px] uppercase tracking-[0.12em] text-brand-mint">Done</span>
                ) : null}
              </div>
            ))}
          </div>
        </div>

        {/* ── Right: the climb — score, segmented progress, level/momentum ── */}
        <div className="lg:col-span-5 flex flex-col justify-center bg-white/5 border border-brand-line-16 rounded-2xl px-5 py-5">
          <p className="font-jetbrains text-[10px] uppercase tracking-[0.18em] text-brand-on-ink-mute mb-2">
            The Climb
          </p>
          <div className="flex items-baseline gap-3 mb-1">
            <span className="font-jetbrains text-5xl font-black text-white leading-none tabular-nums">
              {animatedBand.toFixed(1)}
            </span>
            <span
              className={cn(
                "text-[13px] font-semibold leading-tight transition-all duration-500",
                justLeveled && !reduced && "scale-[1.05]"
              )}
              aria-live="polite"
            >
              <span className="text-brand-mint">
                {milestone.reachedTarget ? "Goal reached 🎉" : `Band ${milestone.next.toFixed(1)} is one step away`}
              </span>
              <br />
              <span className="text-brand-on-ink-mute">goal band {target.toFixed(1)}</span>
            </span>
          </div>

          <div className="flex items-center gap-1.5 mt-4" role="img" aria-label={`Current band ${overall.toFixed(1)} of goal ${target.toFixed(1)}`}>
            {rungs.map((rung, idx) => {
              const reached = overall >= rung - 0.001;
              const isNext = !reached && Math.abs(rung - milestone.next) < 0.001;
              return (
                <span
                  key={rung}
                  title={`Band ${rung.toFixed(1)}`}
                  className={cn(
                    "h-2 flex-1 rounded-full transition-all duration-500",
                    reached ? "bg-brand-mint" : isNext ? "bg-brand-teal-700" : "bg-white/10"
                  )}
                />
              );
            })}
          </div>
          <div className="flex items-center justify-between mt-2 text-[11px] font-medium text-brand-on-ink-mute">
            <span>{rungs[0]?.toFixed(1) ?? overall.toFixed(1)}</span>
            <span>
              {milestone.reachedTarget
                ? "goal reached"
                : `${rungsToGoal} step${rungsToGoal === 1 ? "" : "s"} to ${target.toFixed(1)}`}
            </span>
          </div>

          <div className="flex items-center justify-between mt-5 pt-4 border-t border-brand-line-16">
            <div>
              <p className="font-jetbrains text-[9.5px] uppercase tracking-[0.14em] text-brand-on-ink-mute mb-0.5">Level</p>
              <p className="text-sm font-bold text-white">{levelLabel}</p>
            </div>
            <div className="text-right">
              <p className="font-jetbrains text-[9.5px] uppercase tracking-[0.14em] text-brand-on-ink-mute mb-0.5">Momentum</p>
              <p className="text-sm font-bold text-brand-mint">+{Math.round(animatedPts).toLocaleString()}</p>
            </div>
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
      <div className="h-full rounded-3xl border border-emerald-200 p-6 bg-emerald-50 flex flex-col items-center justify-center text-center shadow-sm">
        <div className="h-16 w-16 rounded-full bg-emerald-100 flex items-center justify-center mb-4">
          <CheckCircle2 className="h-8 w-8 text-emerald-500" />
        </div>
        <h2 className="font-dm text-lg font-bold text-brand-text mb-2 tracking-tight">Daily Priorities Knocked Out!</h2>
        <p className="text-sm text-brand-text-mute">
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
    ? "bg-white border-brand-teal-200 ring-1 ring-brand-teal-500/20"
    : isExtraLocked
      ? "bg-white border-brand-line"
      : "bg-brand-teal-50 border-brand-teal-200";

  return (
    <div className={cn("h-full rounded-3xl border p-6 flex flex-col transition-all duration-500 shadow-sm", cardBg)}>

      {/* Status row renders only when there's a badge — avoids a stray margin
 now that the "Next Best Action" heading has been removed. */}
 {((isLocked && drillsLeft > 0) || isExtraLocked) && (
 <div className="flex items-center justify-end mb-5">
 {isLocked && drillsLeft > 0 && (
 <span className="font-jetbrains text-[10px] font-bold uppercase tracking-wider bg-brand-teal-100 text-brand-teal-600 px-3 py-1 rounded-full animate-pulse">
 Required: {drillsLeft} Left
 </span>
 )}
 {isExtraLocked && (
 <span className="font-jetbrains text-[10px] font-bold uppercase tracking-wider bg-emerald-100 text-emerald-700 px-3 py-1 rounded-full">
 3 / 3 Done
 </span>
 )}
 </div>
 )}

 <div className="flex items-center gap-5 mb-4">
 <div className="flex-shrink-0 h-16 w-16 rounded-2xl bg-brand-teal-100 flex items-center justify-center border border-brand-teal-200 ">
 <Target className="h-8 w-8 text-brand-teal-500" />
 </div>
 <div>
 <p className="text-xl font-bold text-brand-text leading-snug tracking-tight mb-1">
 {toTitleCase(sub_skill)} Drill
 </p>
 <div className="flex items-center gap-2 text-sm text-brand-text-mute ">
 <span>{toTitleCase(skill)}</span>
 <span className="w-1 h-1 rounded-full bg-brand-line " />
 <span>Sub-score: <strong className="text-brand-teal-600 ">{band.toFixed(1)}</strong></span>
 </div>
 </div>
 </div>

 {guide && (
 <div className="mb-6 flex items-start gap-2 text-xs text-brand-text-mute bg-white/60 border border-brand-line rounded-xl px-3 py-2">
 <Lightbulb className="h-3.5 w-3.5 text-brand-warm flex-shrink-0 mt-0.5" />
 <span>{guide.blurb} Today's pick: the <strong className="text-brand-text">{guide.drillLabel}</strong>.</span>
        </div>
      )}

      <div className="mt-auto space-y-3">

        {showDCSMeter && (
          <div className="space-y-2 pt-2 border-t border-brand-line">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-jetbrains text-[10px] font-bold text-brand-text-mute uppercase tracking-wider">Daily Competency Score</p>
                <p className="text-base font-black text-brand-text">
                  {dailyDCS}%
                  <span className="text-xs font-normal text-brand-text-mute ml-1">/ need {dcsThreshold}%</span>
                </p>
              </div>
              <span className={cn(
                "text-[10px] font-bold px-2.5 py-1 rounded-full",
                dailyDCS >= dcsThreshold
                  ? "bg-emerald-100 text-emerald-700"
                  : "bg-rose-100 text-rose-700"
              )}>
                {dailyDCS >= dcsThreshold ? "✓ Eligible" : "Not eligible"}
              </span>
            </div>
            <div className="w-full h-1.5 bg-brand-bg-alt rounded-full overflow-hidden">
              <div
                className={cn("h-full rounded-full transition-all duration-500",
                  dailyDCS >= dcsThreshold ? "bg-emerald-500" : "bg-rose-400")}
                style={{ width: `${Math.min(100, dailyDCS)}%` }}
              />
            </div>
          </div>
        )}

        {isLexiGate && (
          <div className="w-full flex items-center justify-center gap-2 bg-brand-bg-alt text-brand-text-mute font-semibold text-sm py-3.5 rounded-xl border border-brand-line cursor-not-allowed select-none">
            <Lock className="h-4 w-4" /> Complete LexiGrid to unlock
          </div>
        )}

        {isLowDCS && (
          <div className="w-full flex items-center justify-center gap-2 bg-brand-bg-alt text-brand-text-mute font-semibold text-sm py-3.5 rounded-xl border border-brand-line cursor-not-allowed select-none">
            <Lock className="h-4 w-4" /> Improve accuracy to unlock extra
          </div>
        )}

        {isLowPts && (
          <div className="w-full flex items-center justify-center gap-2 bg-brand-bg-alt text-brand-text-mute font-semibold text-sm py-3.5 rounded-xl border border-brand-line cursor-not-allowed select-none">
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
            <p className="text-xs text-brand-text-mute text-center">
              Spend <strong className="text-amber-500">{extraCost} pts</strong> from your {totalMomentum} pts balance?
            </p>
            <div className="flex gap-2">
              <button onClick={onCancelConfirm} className="flex-1 py-2.5 rounded-xl border border-brand-line text-brand-text-mute font-semibold text-sm hover:bg-brand-bg-alt transition-colors">
                Cancel
              </button>
              <button onClick={onConfirmBuy} disabled={buyingExtra} className="flex-1 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-sm transition-colors disabled:opacity-40">
                {buyingExtra ? "Unlocking…" : "Confirm — Spend" + extraCost + "pts"}
              </button>
            </div>
          </div>
        )}

        {isFreeDrill && (
          <button
            onClick={onStartDrill}
            className="w-full flex items-center justify-center gap-2 bg-brand-teal-500 hover:bg-brand-teal-600 text-white font-semibold text-sm py-3.5 rounded-xl transition-all shadow-md hover:shadow-lg active:scale-[0.98]"
          >
            Start Priority Drill <ArrowRight className="h-4 w-4" />
          </button>
        )}

      </div>
    </div>
  );
};

const MomentumWalletCard = ({ momentum }: { momentum: number }) => {
  const navigate = useNavigate();
  return (
    <div
      className="relative overflow-hidden rounded-3xl bg-brand-ink-deep border border-brand-line-16 p-5 shadow-sm h-full flex flex-col"
      style={{
        backgroundImage:
          'linear-gradient(to right, rgba(62,224,160,0.05) 1px, transparent 1px), linear-gradient(to bottom, rgba(62,224,160,0.05) 1px, transparent 1px)',
        backgroundSize: '32px 32px',
      }}
    >
      <div className="relative z-10 flex items-center gap-2.5 mb-4">
        <div className="w-8 h-8 rounded-xl bg-white/10 flex items-center justify-center flex-shrink-0">
          <Wallet className="w-4 h-4 text-brand-mint" />
        </div>
        <div>
          <p className="font-dm font-bold text-white text-sm leading-tight">Momentum Wallet</p>
          <p className="text-xs text-brand-on-ink-mute leading-tight">Earned from drills &amp; streaks</p>
        </div>
      </div>

      <div className="relative z-10 flex flex-col flex-1">
        <p className="font-jetbrains text-4xl font-black text-white tabular-nums leading-none">
          {momentum.toLocaleString()}
        </p>
        <p className="text-xs text-brand-on-ink-mute mt-1 mb-4">points</p>

        <div className="flex items-center gap-2.5 p-2.5 rounded-xl bg-white/5 border border-brand-line-16 mb-4">
          <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center flex-shrink-0">
            <Target className="w-4 h-4 text-brand-mint" />
          </div>
          <span className="flex-1 text-xs text-brand-on-ink-mute">Extra mock test</span>
          <span className="font-jetbrains text-xs font-bold text-brand-mint">2,500</span>
        </div>

        <button
          onClick={() => navigate("/student/mock")}
          className="mt-auto w-full py-2.5 rounded-xl border border-brand-line-16 text-white font-bold text-xs uppercase tracking-wide hover:bg-white/5 transition-colors flex items-center justify-center gap-1.5"
        >
          Redeem for extra practice <ArrowRight className="w-3.5 h-3.5" />
        </button>
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
  const pct = Math.round(bandFillPct(band.score));

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
      className={`text-left w-full rounded-3xl border p-5 flex flex-col transition-all duration-200 hover:shadow-md bg-white ${band.border} shadow-sm`}
    >
      <button onClick={onNavigate} className="text-left w-full">
        <div className="flex items-center justify-between mb-4 w-full">
          <div className={`flex items-center justify-center h-10 w-10 rounded-xl ${band.bg} ${band.color}`}>
            {band.icon}
          </div>
        </div>
        <p className="font-jetbrains text-3xl font-bold text-brand-text tracking-tight">
          {band.score.toFixed(1)}
        </p>
        <p className="text-sm font-medium text-brand-text-mute mt-1 mb-4">
          {band.skill}
        </p>
        <div className="h-1.5 w-full rounded-full bg-brand-bg-alt overflow-hidden mb-4">
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
              let label = key.replace(/Score/g, "").replace(/_/g, "").replace(/([A-Z])/g, "$1").trim();
              label = label.charAt(0).toUpperCase() + label.slice(1);
              const numVal = Number(val);
              const tier = scoreTier(numVal);
              return (
                <div
                  key={key}
                  className="flex flex-col gap-0.5 text-[10px] bg-brand-bg-alt px-2 py-1.5 rounded-lg border border-brand-line"
                >
                  <div className="flex justify-between items-center">
                    <span className="text-brand-text-mute truncate mr-1" title={label}>{label}</span>
                    <span className="font-jetbrains font-bold text-brand-text">
                      {!Number.isInteger(numVal) ? numVal.toFixed(1) : numVal}
                    </span>
                  </div>
                  <span className={cn(
                    "font-semibold",
                    tier.tone === "low" ? "text-amber-600"
                      : tier.tone === "mid" ? "text-sky-600"
                      : "text-emerald-600"
                  )}>
                    {tier.label}
                  </span>
                </div>
              );
            })}
          </div>

          <button
            onClick={() => setExpanded((e) => !e)}
            className="mt-3 w-full flex items-center justify-center gap-1 text-[11px] font-semibold text-brand-teal-600 hover:text-brand-teal-700 transition-colors"
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
                let label = key.replace(/Score/g, "").replace(/_/g, "").replace(/([A-Z])/g, "$1").trim();
                label = label.charAt(0).toUpperCase() + label.slice(1);

                return (
                  <div
                    key={key}
                    className="rounded-xl border border-brand-line bg-brand-bg-alt/60 p-2.5"
                  >
                    <p className="text-[11px] font-bold text-brand-text">
                      {label} · {!Number.isInteger(numVal) ? numVal.toFixed(1) : numVal}
                    </p>
                    <p className="text-[11px] text-brand-text-mute mt-0.5 leading-snug">
                      {guide?.blurb ?? "A breakdown of this skill area."}
                    </p>
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

const PredictedReadinessCard = ({ readiness }: { readiness: Readiness }) => {
  const navigate = useNavigate();
  const statusConfig: Record<string, any> = {
    "on-track": {
      icon: <CheckCircle2 className="h-5 w-5 text-emerald-500" />,
      color: "text-emerald-600",
      bg: "bg-emerald-50",
      border: "border-emerald-200",
      accentBorder: "border-l-emerald-500",
    },
    warn: {
      icon: <AlertTriangle className="h-5 w-5 text-amber-500" />,
      color: "text-amber-600",
      bg: "bg-amber-50",
      border: "border-amber-200",
      accentBorder: "border-l-amber-500",
    },
    catchup: {
      icon: <Compass className="h-5 w-5 text-amber-500" />,
      color: "text-amber-600",
      bg: "bg-amber-50",
      border: "border-amber-200",
      accentBorder: "border-l-amber-500",
    },
    "no-date": {
      icon: <CalendarClock className="h-5 w-5 text-brand-teal-500" />,
      color: "text-brand-teal-600",
      bg: "bg-brand-teal-50",
      border: "border-brand-teal-200",
      accentBorder: "border-l-brand-teal-500",
    },
    "exam-passed": {
      icon: <AlertTriangle className="h-5 w-5 text-brand-text-mute" />,
      color: "text-brand-text-mute",
      bg: "bg-brand-bg-alt",
      border: "border-brand-line",
      accentBorder: "border-l-brand-line",
    },
  };
  const cfg = statusConfig[readiness.status] ?? statusConfig["on-track"];

  if (readiness.status === "no-date" || readiness.status === "exam-passed") {
    return (
      <div className={`h-full rounded-3xl border border-brand-line border-l-[3px] ${cfg.accentBorder} bg-white p-6 shadow-sm flex flex-col items-center justify-center text-center`}>
        <div className="h-12 w-12 rounded-full bg-white border border-brand-line flex items-center justify-center mb-3">
          {cfg.icon}
        </div>
        <h2 className="font-jetbrains text-[10.5px] font-medium text-brand-text-mute uppercase tracking-[0.14em] mb-2">
          Predicted Readiness
        </h2>
        <p className="text-xs text-brand-text-mute mb-4">{readiness.trajectory}</p>
        <button
          onClick={() => navigate("/student/settings")}
          className="inline-flex items-center gap-1.5 bg-brand-teal-600 hover:bg-brand-teal-700 text-white text-xs font-bold py-2 px-4 rounded-xl transition-colors"
        >
          {readiness.status === "no-date" ? "Set exam date" : "Update exam date"}
          <ArrowRight className="h-3.5 w-3.5" />
        </button>
      </div>
    );
  }

  return (
    <div className={`h-full rounded-3xl border border-brand-line border-l-[3px] ${cfg.accentBorder} bg-white p-6 shadow-sm flex flex-col`}>
      <span className={`font-jetbrains text-[10.5px] font-medium uppercase tracking-[0.14em] ${cfg.color}`}>
        Predicted Readiness
      </span>
      <div className="space-y-4 mt-4">
        <div className="flex justify-between items-center">
          <span className="text-sm text-brand-text-mute">Target Band</span>
          <span className="text-base font-semibold text-brand-text">{readiness.targetBand.toFixed(1)}</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-sm text-brand-text-mute">Projected Band</span>
          <span className={`text-base font-bold ${cfg.color}`}>{readiness.projectedBand?.toFixed(1)}</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-sm text-brand-text-mute">Days Left</span>
          <span className="text-base font-semibold text-brand-text">{readiness.daysLeft} days</span>
        </div>
        <div className="flex justify-between items-center pt-2 border-t border-brand-line/50">
          <span className="text-sm text-brand-text-mute font-medium">Exam Date</span>
          <span className="text-sm font-bold text-brand-text">{readiness.targetDate}</span>
        </div>
      </div>
      <div className="mt-auto pt-4">
        <p className="text-sm leading-[1.6] text-brand-text font-medium">{readiness.trajectory}</p>
      </div>
    </div>
  );
};

const ModuleNavCard = ({ band, onNavigate }: any) => (
  <button
    onClick={onNavigate}
    className={`text-left w-full flex items-center gap-4 p-4 rounded-2xl border transition-all duration-200 hover:scale-[1.01] hover:shadow-sm bg-white ${band.border} group`}
  >
    <div className={`flex-shrink-0 h-12 w-12 rounded-xl flex items-center justify-center ${band.bg} ${band.color}`}>
      {band.icon}
    </div>
    <div className="flex-1 min-w-0">
      <p className="text-sm font-bold text-brand-text">{band.skill}</p>
      <p className="text-xs text-brand-text-mute mt-0.5">Band {band.score} → {band.target}</p>
    </div>
  </button>
);

const DashboardCard = ({ title, subtitle, children, icon }: any) => (
  <div className="bg-white rounded-3xl p-6 border border-brand-line shadow-sm h-full">
    <div className="mb-5">
      <h2 className="font-jetbrains text-[10.5px] font-medium text-brand-text-mute flex items-center gap-2 uppercase tracking-[0.14em]">
        {icon && <span>{icon}</span>} {title}
      </h2>
      {subtitle && <p className="text-xs text-brand-text-mute mt-1">{subtitle}</p>}
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
          <circle cx="48" cy="48" r="40" fill="none" stroke="#FDEEE6" strokeWidth="8" className="" />
          <circle
            cx="48" cy="48" r="40" fill="none" stroke="#E8753D" strokeWidth="8"
            strokeDasharray={`${2 * Math.PI * 40}`}
            strokeDashoffset={`${2 * Math.PI * 40 * (1 - progress / 100)}`}
            strokeLinecap="round"
            className="transition-all duration-700 ease-out"
          />
        </svg>
        <div className="absolute flex flex-col items-center">
          <Flame className="h-6 w-6 text-brand-warm" />
          <span className="text-xl font-bold text-brand-text leading-none mt-1">
            {currentStreak}
          </span>
        </div>
      </div>
      <p className="text-sm font-medium text-brand-text-mute text-center">
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

const WeeklyRhythmIndicator = ({ currentStreak, goal = 7 }: { currentStreak: number; goal?: number }) => {
  const jsDay = new Date().getDay();
  const currentDayIndex = jsDay === 0 ? 6 : jsDay - 1; // Mon=0 … Sun=6
  const todayConfig = WEEKLY_RHYTHM[currentDayIndex];
  const streakLeft = Math.max(0, goal - currentStreak);

  return (
    <div className="bg-white rounded-3xl border border-brand-line p-6 shadow-sm h-full flex flex-col justify-center">
      <span className="font-jetbrains text-[10.5px] font-medium uppercase tracking-[0.14em] text-brand-text-mute">
        This Week
      </span>

      <div className="flex items-end gap-3 mt-3 mb-5">
        <span className="font-jetbrains text-[34px] font-bold text-brand-text leading-none tracking-tight">
          {currentStreak}
        </span>
        <span className="text-[13.5px] text-brand-text-mute pb-0.5">
          day streak{streakLeft > 0 ? ` · ${streakLeft} more to your ${goal}-day goal` : " · weekly goal hit 🎉"}
        </span>
      </div>

      <div className="flex gap-1.5">
        {WEEKLY_RHYTHM.map((day, idx) => {
          const isToday = idx === currentDayIndex;
          // Approximates completed days from the streak count — we don't have
          // per-day attendance rows, only the rolling streak total.
          const isDone = idx < currentDayIndex && idx >= currentDayIndex - currentStreak;
          return (
            <div key={day.day} className="flex-1 flex flex-col items-center gap-2">
              <div
                className={`w-full rounded-md transition-all duration-300 ${
                  isToday ? "h-10 bg-brand-ink-deep" : isDone ? "h-7 bg-brand-mint" : "h-7 bg-brand-bg-alt"
                }`}
              />
              <span className={`font-jetbrains text-[9px] font-bold uppercase tracking-wider ${isToday ? "text-brand-text" : "text-brand-text-mute"}`}>
                {day.day}
              </span>
            </div>
          );
        })}
      </div>

      <div className="mt-4 px-3.5 py-3 bg-brand-teal-wash border border-brand-teal-200 rounded-xl">
        <p className="text-[13px] text-brand-text-mute">
          Today: <strong className="text-brand-text font-semibold">{todayConfig.text}</strong>
        </p>
      </div>
    </div>
  );
};

export default StudentDashboardPage;