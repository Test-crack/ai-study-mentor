// Spoken English student home. Separate page (routed via the dashboard dispatch) so the
// IELTS StudentDashboardPage is never touched. Mirrors the IELTS structure — a "Climb", a
// daily-drill unlock gate, LexiGrid, and per-subskill practice — delta'd to CEFR/subskills.
// Differences from IELTS by request: the gate is 3 DRILLS (no LexiGrid step), and LexiGrid
// is a standalone feature. Reuses the shared drill flow (DrillScreen) + daily-drill-state.
import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { callBackend } from "@/features/auth/services/authClient";
import StudentLayout from "./StudentLayout";
import { PremiumModal } from "@/features/payment/components/PremiumModal";
import { examDisplay } from "@/features/student/config/examDisplay";
import { useMomentum } from "@/features/student/Context/MomentumContext";
import { seSubskillByEnum, nextCefr, withinLevelProgress, cefrToDrillLevel } from "@/features/student/config/spokenEnglishSubskills";
import { cn } from "@/shared/utils";
import { Mic, ArrowRight, AlertTriangle, Loader2, Compass, Flame, Lock, Puzzle, Wallet, Target, TrendingUp, Trophy } from "lucide-react";
import IAScheduleWidget from "./dashboard/IAScheduleWidget";

interface SubskillRow { id: string; label: string; level: string; score: number; }
interface CefrResult {
  cefrLevel?: string;
  cefrLabel?: string;
  meanScore?: number;
  subskillProfile?: SubskillRow[];
  feedback?: Array<{ promptId: string; strengths: string; improvements: string }>;
  scoredPromptCount?: number;
}

const LEVEL_LABEL: Record<string, string> = { BEGINNER: "Beginner", INTERMEDIATE: "Intermediate", ADVANCED: "Advanced" };
const DRILLS_TO_UNLOCK = 3;
// CEFR rungs for the Climb progress bar — the ordinal analogue of IELTS's band rungs.
const CEFR_LADDER = ["a1", "a2", "b1", "b2", "c1", "c2"];

const barColor = (level?: string) => {
  const l = (level || "").toLowerCase();
  if (l.startsWith("c")) return "bg-emerald-500";
  if (l.startsWith("b2")) return "bg-brand-teal-500";
  if (l.startsWith("b")) return "bg-brand-teal-400";
  if (l.startsWith("a2")) return "bg-amber-400";
  return "bg-amber-300";
};

// CEFR level → pill colour (bg tint + text).
const levelPill = (level?: string) => {
  const l = (level || "").toLowerCase();
  if (l.startsWith("c")) return "bg-emerald-100 text-emerald-700";
  if (l.startsWith("b2")) return "bg-brand-teal-100 text-brand-teal-700";
  if (l.startsWith("b")) return "bg-brand-teal-50 text-brand-teal-700";
  if (l.startsWith("a2")) return "bg-amber-100 text-amber-700";
  return "bg-amber-50 text-amber-700";
};

// "This week" streak strip — white card matching the IELTS dashboard widgets.
const WeeklyRhythm = ({ streak }: { streak: number }) => {
  const days = ["M", "T", "W", "T", "F", "S", "S"];
  const todayIdx = (new Date().getDay() + 6) % 7; // Mon=0 … Sun=6
  return (
    <div className="bg-white border border-brand-line rounded-2xl p-5 shadow-sm h-full flex flex-col">
      <div className="flex items-center gap-2.5 mb-4">
        <div className="w-8 h-8 rounded-xl bg-amber-100 flex items-center justify-center flex-shrink-0"><Flame className="w-4 h-4 text-amber-600" /></div>
        <div>
          <p className="font-dm font-bold text-brand-text text-sm leading-tight">This Week</p>
          <p className="text-xs text-brand-text-mute leading-tight">{streak}-day streak · {Math.max(0, 7 - streak)} to your 7-day goal</p>
        </div>
      </div>
      <div className="grid grid-cols-7 gap-1.5 mt-auto">
        {days.map((d, i) => (
          <div key={i} className={cn(
            "flex h-9 items-center justify-center rounded-lg font-jetbrains text-xs font-bold",
            i === todayIdx ? "bg-brand-ink-deep text-white"
              : i < todayIdx && todayIdx - i <= streak ? "bg-brand-mint text-brand-ink-deep"
              : "bg-brand-bg-alt text-brand-text-mute",
          )}>{d}</div>
        ))}
      </div>
    </div>
  );
};

// Momentum wallet — same design as the IELTS MomentumWalletCard (momentum is exam-agnostic).
const MomentumWallet = ({ momentum, onRedeem }: { momentum: number; onRedeem: () => void }) => (
  <div className="bg-white border border-brand-line rounded-2xl p-5 shadow-sm h-full flex flex-col">
    <div className="flex items-center gap-2.5 mb-4">
      <div className="w-8 h-8 rounded-xl bg-brand-teal-100 flex items-center justify-center flex-shrink-0"><Wallet className="w-4 h-4 text-brand-teal-600" /></div>
      <div>
        <p className="font-dm font-bold text-brand-text text-sm leading-tight">Momentum Wallet</p>
        <p className="text-xs text-brand-text-mute leading-tight">Earned from drills &amp; streaks</p>
      </div>
    </div>
    <p className="font-jetbrains text-4xl font-black text-brand-text tabular-nums leading-none">{momentum.toLocaleString()}</p>
    <p className="text-xs text-brand-text-mute mt-1 mb-4">points</p>
    <div className="flex items-center gap-2.5 p-2.5 rounded-xl bg-brand-bg-alt/60 border border-brand-line mb-4">
      <div className="w-8 h-8 rounded-lg bg-brand-teal-100 flex items-center justify-center flex-shrink-0"><Target className="w-4 h-4 text-brand-teal-600" /></div>
      <span className="flex-1 text-xs text-brand-text-mute">Extra practice drill</span>
      <span className="font-jetbrains text-xs font-bold text-brand-teal-600">300</span>
    </div>
    <button onClick={onRedeem} className="mt-auto w-full py-2.5 rounded-xl border border-brand-teal-200 text-brand-teal-600 font-bold text-xs uppercase tracking-wide hover:bg-brand-teal-50 transition-colors flex items-center justify-center gap-1.5">
      Redeem for extra practice <ArrowRight className="w-3.5 h-3.5" />
    </button>
  </div>
);

const StatRow = ({ label, value }: { label: string; value: string }) => (
  <div className="flex items-center justify-between text-sm">
    <span className="text-brand-text-mute">{label}</span>
    <span className="font-semibold text-brand-text">{value}</span>
  </div>
);

// Full Mock card — always visible (unlike the shared IELTS MockStatusWidget, which hides until the
// first IA). Shows a lock + the internal-assessment requirement while locked; a Start link when eligible.
const MockCard = ({ examId }: { examId: string }) => {
  const navigate = useNavigate();
  const [status, setStatus] = useState<any>(null);
  useEffect(() => {
    callBackend("/api/mock/status").then((r) => { if (r?.success) setStatus(r); }).catch(() => {});
  }, []);
  const done = status?.progress?.ia_completed ?? 0;
  const req = status?.progress?.ia_required ?? 6;
  const eligible = !!status?.can_start_mock;
  return (
    <div className="bg-white border border-brand-line rounded-2xl p-5 shadow-sm h-full flex flex-col">
      <div className="flex items-center gap-2.5 mb-4">
        <div className="w-8 h-8 rounded-xl bg-brand-teal-100 flex items-center justify-center flex-shrink-0"><Trophy className="w-4 h-4 text-brand-teal-600" /></div>
        <div>
          <p className="font-dm font-bold text-brand-text text-sm leading-tight">Full Mock Test</p>
          <p className="text-xs text-brand-text-mute leading-tight">A complete CEFR speaking mock</p>
        </div>
      </div>
      {eligible ? (
        <>
          <p className="text-sm text-brand-text-mute leading-relaxed mb-4">You've unlocked your full mock — take it to see where you stand.</p>
          <button onClick={() => navigate(`/${examId}/mock`)} className="mt-auto w-full py-2.5 rounded-xl bg-brand-teal-600 hover:bg-brand-teal-700 text-white font-bold text-xs uppercase tracking-wide transition-colors flex items-center justify-center gap-1.5">
            Start full mock <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </>
      ) : (
        <>
          <div className="flex items-start gap-2 text-sm text-brand-text-mute mb-4">
            <Lock className="w-4 h-4 shrink-0 mt-0.5 text-brand-text-mute" /> Complete {req} internal assessments to unlock your full mock.
          </div>
          <div className="mt-auto">
            <div className="mb-1 flex items-center justify-between text-[11px] font-medium text-brand-text-mute">
              <span>Internal assessments</span><span className="tabular-nums">{done}/{req}</span>
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-brand-line">
              <div className="h-full rounded-full bg-brand-teal-500 transition-all" style={{ width: `${Math.min(100, req ? (done / req) * 100 : 0)}%` }} />
            </div>
          </div>
        </>
      )}
    </div>
  );
};

// Predicted readiness (CEFR) — white card matching the IELTS widget style.
const PredictedReadiness = ({ cefrLabel, meanScore, examDate }: { cefrLabel?: string; meanScore?: number; examDate: string | null }) => {
  const next = nextCefr(cefrLabel);
  const progress = withinLevelProgress(cefrLabel, meanScore);
  const daysLeft = examDate ? Math.ceil((new Date(examDate).getTime() - Date.now()) / 86400000) : null;
  return (
    <div className="bg-white border border-brand-line rounded-2xl p-5 shadow-sm h-full flex flex-col">
      <div className="flex items-center gap-2.5 mb-4">
        <div className="w-8 h-8 rounded-xl bg-brand-teal-100 flex items-center justify-center flex-shrink-0"><TrendingUp className="w-4 h-4 text-brand-teal-600" /></div>
        <div>
          <p className="font-dm font-bold text-brand-text text-sm leading-tight">Predicted Readiness</p>
          <p className="text-xs text-brand-text-mute leading-tight">Toward your next CEFR level</p>
        </div>
      </div>
      <div className="space-y-2">
        <StatRow label="Current level" value={cefrLabel ?? "—"} />
        <StatRow label="Target (next level)" value={next ?? "Top of scale"} />
        {daysLeft != null && daysLeft > 0 && <StatRow label="Days to target" value={String(daysLeft)} />}
      </div>
      <div className="mt-3 h-2 overflow-hidden rounded-full bg-brand-line">
        <div className="h-full rounded-full bg-brand-mint transition-all" style={{ width: `${progress}%` }} />
      </div>
      <p className="mt-auto pt-3 text-xs leading-relaxed text-brand-text-mute">
        {next ? `Keep drilling and completing assessments to move from ${cefrLabel} toward ${next}.` : "You're at the top of the scale — keep practising to stay sharp."}
      </p>
    </div>
  );
};

const SpokenEnglishDashboardPage = () => {
  const { profile } = useAuth();
  const navigate = useNavigate();
  const { syncMomentum, updateStreak } = useMomentum();
  const cfg = examDisplay(profile?.examId);
  const examId = profile?.examId ?? "spoken_english";

  const [showPremium, setShowPremium] = useState(false);
  const [loading, setLoading] = useState(true);
  const [result, setResult] = useState<CefrResult | null>(null);
  const [meta, setMeta] = useState<{ momentum: number; streak: number }>({ momentum: 0, streak: 0 });
  const [examDate, setExamDate] = useState<string | null>(null);
  const [drillsToday, setDrillsToday] = useState(0);
  // The next drill to do — from the shared recommendation engine (getNextActionDrill), the
  // same one IELTS uses. It picks the weakest not-done-today subskill (rotates correctly).
  const [nextDrill, setNextDrill] = useState<{ subEnum: string; label: string } | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        // IA + Mock cards self-fetch (shared IAScheduleWidget / MockStatusWidget), so we don't
        // fetch their status here.
        const [comp, drillState, nextAction] = await Promise.all([
          callBackend("/api/student/competency-scores"),
          callBackend("/api/student/daily-drill-state").catch(() => null),
          callBackend("/api/student/next-action-drill").catch(() => null),
        ]);
        if (cancelled) return;
        const speaking = (comp.data ?? []).find((r: any) => r.skill === "SPEAKING");
        setResult((speaking?.sub_scores as CefrResult) ?? null);
        setMeta({ momentum: comp.momentum_score ?? 0, streak: comp.daily_streak ?? 0 });
        setExamDate(comp.exam_date ?? null);
        setDrillsToday(drillState?.drills_completed_today ?? 0);
        const rec = nextAction?.recommended_drills?.[0];
        setNextDrill(rec ? { subEnum: rec.sub_skill, label: seSubskillByEnum(rec.sub_skill)?.label ?? rec.sub_skill } : null);
        // Feed the shared MomentumContext so the topbar shows the right momentum/streak
        // (it starts at 0 and only updates via syncMomentum — the IELTS dashboard does this too).
        syncMomentum(comp.momentum_score ?? 0);
        updateStreak(comp.daily_streak ?? 0);
      } catch {
        if (!cancelled) setResult(null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  // Launch the shared DrillScreen for a given SubSkillType enum value (from the engine or a card).
  const startDrill = useCallback((subEnum?: string) => {
    if (!subEnum) return;
    const params = new URLSearchParams({
      skill: "SPEAKING",
      sub_skill: subEnum,
      level: cefrToDrillLevel(result?.cefrLevel),
    });
    navigate(`/${examId}/drill?${params.toString()}`);
  }, [navigate, examId, result]);

  const seUnlocked = drillsToday >= DRILLS_TO_UNLOCK;
  // Today's gate as a numbered step list (parity with the IELTS hero) — 3 drills, no LexiGrid step.
  const steps = Array.from({ length: DRILLS_TO_UNLOCK }, (_, i) => ({
    label: i === 0 ? "Priority Drill" : i === 1 ? "Second Drill" : "Third Drill",
    status: (i < drillsToday ? "done" : i === drillsToday ? "active" : "locked") as "done" | "active" | "locked",
  }));
  const stepOfLabel = seUnlocked ? "Session complete" : `Step ${Math.min(drillsToday + 1, DRILLS_TO_UNLOCK)} of ${DRILLS_TO_UNLOCK}`;

  return (
    <>
    <StudentLayout activeTab="dashboard" onUpgradeClick={() => setShowPremium(true)} mainClassName="flex-1 p-4 sm:p-6 lg:p-8 space-y-6">
          {/* exam · batch context (streak lives in the topbar + This Week card — no duplicate chip) */}
          <div className="flex flex-wrap items-center gap-2 text-[12px]">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-brand-line bg-brand-bg-alt px-3 py-1 font-medium text-brand-text">
              <Compass className="h-3.5 w-3.5 text-brand-teal-600" /><span className="text-brand-text-mute">Exam</span><span className="font-semibold">{profile?.examLabel ?? "Spoken English"}</span>
            </span>
            {profile?.batchName && (
              <span className="inline-flex items-center gap-1.5 rounded-full border border-brand-line bg-brand-bg-alt px-3 py-1 font-medium text-brand-text">
                <span className="text-brand-text-mute">Batch</span><span className="font-semibold">{profile.batchName}</span>
              </span>
            )}
          </div>

          {loading ? (
            <div className="flex items-center gap-3 py-20 text-brand-text-mute"><Loader2 className="h-6 w-6 animate-spin text-brand-teal-600" /> Loading your results…</div>
          ) : !result || !result.cefrLabel ? (
            <div className="rounded-2xl border border-brand-line bg-brand-bg-alt p-8 text-center">
              <Mic className="mx-auto h-10 w-10 text-brand-teal-600" />
              <h2 className="mt-3 font-dm text-lg font-bold text-brand-text">Take your speaking diagnostic</h2>
              <p className="mx-auto mt-1 max-w-sm text-sm text-brand-text-mute">Record a few short answers and we'll estimate your CEFR level and where to focus.</p>
              <button onClick={() => navigate(`/${examId}/diagnosis`)} className="mt-5 inline-flex items-center gap-2 rounded-xl bg-brand-teal-600 px-5 py-2.5 font-semibold text-white hover:bg-brand-teal-700">Start diagnostic <ArrowRight className="h-4 w-4" /></button>
            </div>
          ) : (
            <>
              {/* Unified hero — left: today's drill gate as a numbered step list; right: THE CLIMB.
                  Mirrors the IELTS StudentDashboardPage hero for cross-exam design parity. */}
              <section className="relative overflow-hidden rounded-3xl bg-brand-ink-deep text-white border border-brand-line-16 p-6 sm:p-8 shadow-sm">
                {/* faint mint grid texture + ambient bloom (matches the IELTS hero treatment) */}
                <div aria-hidden="true" className="pointer-events-none absolute inset-0 opacity-[0.06]"
                  style={{ backgroundImage: "linear-gradient(to right, #3EE0A0 1px, transparent 1px), linear-gradient(to bottom, #3EE0A0 1px, transparent 1px)", backgroundSize: "48px 48px" }} />
                <div className="pointer-events-none absolute -right-10 -top-10 h-48 w-48 rounded-full bg-brand-teal-500/20 blur-2xl" />

                <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-8">
                  {/* ── Left: today's gate — headline + numbered step list ── */}
                  <div className="lg:col-span-7 min-w-0">
                    <div className="flex items-center gap-3 mb-3">
                      <span className="h-px w-6 shrink-0 bg-brand-mint" aria-hidden="true" />
                      <span className="font-jetbrains text-[10.5px] uppercase tracking-[0.18em] text-brand-mint">Today · {stepOfLabel}</span>
                    </div>
                    <h1 className="font-dm text-2xl sm:text-[28px] font-bold tracking-tight mb-2 leading-[1.15]">
                      {seUnlocked ? "Today's drills are done — the rest is yours" : "Start with your priority drill"}
                    </h1>
                    <p className="text-brand-on-ink-mute text-sm leading-[1.6] max-w-lg mb-5">
                      {seUnlocked
                        ? "Nice work. LexiGrid and everything below stay open for extra practice whenever you want them."
                        : <>Three quick MCQ drills open the full dashboard. Next up: <strong className="text-white">{nextDrill ? nextDrill.label : "your weakest subskill"}</strong>.</>}
                    </p>

                    <div className="space-y-2.5">
                      {steps.map((step, idx) => (
                        <div key={step.label} className={cn(
                          "rounded-2xl border px-4 py-3 flex items-center justify-between gap-4 transition-colors duration-300",
                          step.status === "active" ? "bg-brand-teal-900/40 border-brand-mint/30" : "bg-white/5 border-brand-line-16",
                        )}>
                          <div className="flex items-center gap-3 min-w-0">
                            <span className={cn(
                              "flex h-7 w-7 shrink-0 items-center justify-center rounded-full font-jetbrains text-[12px] font-bold",
                              step.status === "done" ? "bg-brand-mint text-brand-ink-deep"
                                : step.status === "active" ? "bg-brand-mint/20 text-brand-mint border border-brand-mint/40"
                                : "bg-white/10 text-brand-on-ink-mute",
                            )}>
                              {step.status === "done" ? "✓" : idx + 1}
                            </span>
                            <div className="min-w-0">
                              <p className={cn("font-semibold text-[14px] truncate", step.status === "locked" ? "text-brand-on-ink-mute" : "text-white")}>{step.label}</p>
                              {step.status === "locked" && <p className="text-[11.5px] text-brand-on-ink-mute">Locked</p>}
                            </div>
                          </div>
                          {step.status === "active" ? (
                            <button onClick={() => startDrill(nextDrill?.subEnum)} disabled={!nextDrill}
                              className="shrink-0 px-3.5 py-2 bg-brand-mint hover:bg-brand-teal-300 text-brand-ink-deep font-semibold text-[12.5px] rounded-lg transition-colors duration-150 whitespace-nowrap disabled:opacity-50">
                              Start drill {Math.min(drillsToday + 1, DRILLS_TO_UNLOCK)} →
                            </button>
                          ) : step.status === "done" ? (
                            <span className="shrink-0 font-jetbrains text-[10px] uppercase tracking-[0.12em] text-brand-mint">Done</span>
                          ) : null}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* ── Right: the climb — CEFR level, segmented progress, level/momentum ── */}
                  <div className="lg:col-span-5 flex flex-col justify-center bg-white/5 border border-brand-line-16 rounded-2xl px-5 py-5">
                    <p className="font-jetbrains text-[10px] uppercase tracking-[0.18em] text-brand-on-ink-mute mb-2">The Climb</p>
                    <div className="flex items-baseline gap-3 mb-1">
                      <span className="font-jetbrains text-5xl font-black text-white leading-none">{result.cefrLabel}</span>
                      <span className="text-[13px] font-semibold leading-tight">
                        <span className="text-brand-mint">{nextCefr(result.cefrLabel) ? `${nextCefr(result.cefrLabel)} is your next level` : "Top level reached 🎉"}</span>
                        {result.scoredPromptCount != null && (<><br /><span className="text-brand-on-ink-mute">based on {result.scoredPromptCount} graded {result.scoredPromptCount === 1 ? "answer" : "answers"}</span></>)}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5 mt-4" role="img" aria-label={`Current level ${result.cefrLabel}`}>
                      {CEFR_LADDER.map((lv, idx) => {
                        const curIdx = CEFR_LADDER.indexOf((result.cefrLevel || "").toLowerCase());
                        const reached = curIdx >= idx;
                        const isNext = idx === curIdx + 1;
                        return <span key={lv} title={lv.toUpperCase()} className={cn("h-2 flex-1 rounded-full transition-all duration-500", reached ? "bg-brand-mint" : isNext ? "bg-brand-teal-700" : "bg-white/10")} />;
                      })}
                    </div>
                    <div className="flex items-center justify-between mt-2 text-[11px] font-medium text-brand-on-ink-mute">
                      <span>{CEFR_LADDER[0].toUpperCase()}</span>
                      <span>{nextCefr(result.cefrLabel) ? `next: ${nextCefr(result.cefrLabel)}` : "top level"}</span>
                    </div>

                    <div className="flex items-center justify-between mt-5 pt-4 border-t border-brand-line-16">
                      <div>
                        <p className="font-jetbrains text-[9.5px] uppercase tracking-[0.14em] text-brand-on-ink-mute mb-0.5">Level</p>
                        <p className="text-sm font-bold text-white">{LEVEL_LABEL[cefrToDrillLevel(result.cefrLevel)]}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-jetbrains text-[9.5px] uppercase tracking-[0.14em] text-brand-on-ink-mute mb-0.5">Momentum</p>
                        <p className="text-sm font-bold text-brand-mint">+{meta.momentum.toLocaleString()}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </section>

              {/* Standalone LexiGrid (not part of the gate) */}
              <section className="flex flex-col gap-4 rounded-2xl border border-brand-teal-200 bg-brand-bg-alt p-5 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-brand-teal-100 border border-brand-teal-200"><Puzzle className="h-5 w-5 text-brand-teal-600" /></div>
                  <div>
                    <p className="font-dm text-sm font-bold text-brand-text">LexiGrid</p>
                    <p className="text-xs text-brand-text-mute">Play the daily vocabulary puzzle to sharpen your Range.</p>
                  </div>
                </div>
                <button onClick={() => navigate(`/${examId}/lexigrid`)} className="inline-flex items-center gap-2 self-start rounded-lg bg-brand-teal-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-teal-700 sm:self-auto">Play <ArrowRight className="h-4 w-4" /></button>
              </section>

              {/* Content — blurred + gated while locked, like IELTS */}
              <div className={cn("relative space-y-6", !seUnlocked && "pointer-events-none select-none")}>
                {!seUnlocked && (
                  <div className="absolute inset-0 z-10 flex items-start justify-center rounded-3xl bg-brand-bg/60 pt-16 backdrop-blur-[3px]">
                    <div className="flex items-center gap-2 rounded-full border border-brand-line bg-brand-bg-alt px-4 py-2 text-sm font-semibold text-brand-text">
                      <Lock className="h-4 w-4 text-brand-text-mute" /> Finish {DRILLS_TO_UNLOCK} drills to unlock
                    </div>
                  </div>
                )}

                {/* Your speaking profile — 6 CEFR subskills, clean two-column read-out (no per-row buttons) */}
                {result.subskillProfile && result.subskillProfile.length > 0 && (
                  <section className="rounded-2xl border border-brand-line bg-white p-5 sm:p-6 shadow-sm">
                    <div className="mb-5 flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-xl bg-brand-teal-100 flex items-center justify-center flex-shrink-0"><Mic className="w-4 h-4 text-brand-teal-600" /></div>
                      <div>
                        <p className="font-dm font-bold text-brand-text text-sm leading-tight">Your Speaking Profile</p>
                        <p className="text-xs text-brand-text-mute leading-tight">CEFR level across six sub-skills</p>
                      </div>
                    </div>
                    <div className="grid grid-cols-1 gap-x-8 gap-y-5 sm:grid-cols-2">
                      {result.subskillProfile.map((s) => (
                        <div key={s.id}>
                          <div className="mb-1.5 flex items-center justify-between">
                            <span className="text-sm font-semibold text-brand-text">{s.label}</span>
                            <span className={cn("font-jetbrains text-[11px] font-bold uppercase px-2 py-0.5 rounded-full", levelPill(s.level))}>{(s.level || "").toUpperCase()}</span>
                          </div>
                          <div className="h-2 w-full overflow-hidden rounded-full bg-brand-line">
                            <div className={cn("h-full rounded-full transition-all", barColor(s.level))} style={{ width: `${Math.max(4, Math.min(100, s.score))}%` }} />
                          </div>
                        </div>
                      ))}
                    </div>
                  </section>
                )}

                {/* This week + predicted readiness (parity with the IELTS dashboard) */}
                <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                  <WeeklyRhythm streak={meta.streak} />
                  <PredictedReadiness cefrLabel={result.cefrLabel} meanScore={result.meanScore} examDate={examDate} />
                </div>

                {/* Internal assessment · Mock · Momentum wallet — shared IELTS widgets (exam-agnostic) */}
                <div className="grid grid-cols-1 gap-6 lg:grid-cols-3 items-stretch">
                  <IAScheduleWidget />
                  <MockCard examId={examId} />
                  <MomentumWallet momentum={meta.momentum} onRedeem={() => navigate(`/${examId}/dashboard`)} />
                </div>
              </div>

              {cfg.disclaimer && (
                <p className="flex items-start gap-2 px-1 text-[12px] leading-relaxed text-brand-text-mute"><AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />{cfg.disclaimer}</p>
              )}
            </>
          )}
    </StudentLayout>
    {showPremium && <PremiumModal isOpen={showPremium} onClose={() => setShowPremium(false)} />}
    </>
  );
};

export default SpokenEnglishDashboardPage;
