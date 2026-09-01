// Spoken English student home. Separate page (routed via the dashboard dispatch) so the
// IELTS StudentDashboardPage is never touched. Mirrors the IELTS structure — a "Climb", a
// daily-drill unlock gate, LexiGrid, and per-subskill practice — delta'd to CEFR/subskills.
// Differences from IELTS by request: the gate is 3 DRILLS (no LexiGrid step), and LexiGrid
// is a standalone feature. Reuses the shared drill flow (DrillScreen) + daily-drill-state.
import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { callBackend } from "@/features/auth/services/authClient";
import { StudentSidebar } from "./dashboard/StudentSidebar";
import { StudentTopbar } from "./dashboard/StudentTopbar";
import { PremiumModal } from "@/features/payment/components/PremiumModal";
import { examDisplay } from "@/features/student/config/examDisplay";
import { useMomentum } from "@/features/student/Context/MomentumContext";
import { seSubskill, seSubskillByEnum, nextCefr, withinLevelProgress, cefrToDrillLevel } from "@/features/student/config/spokenEnglishSubskills";
import { cn } from "@/shared/utils";
import { Mic, CheckCircle2, ArrowRight, AlertTriangle, Loader2, Compass, Flame, Zap, Lock, Puzzle, Dumbbell } from "lucide-react";

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

const barColor = (level?: string) => {
  const l = (level || "").toLowerCase();
  if (l.startsWith("c")) return "bg-emerald-500";
  if (l.startsWith("b2")) return "bg-brand-teal-500";
  if (l.startsWith("b")) return "bg-brand-teal-400";
  if (l.startsWith("a2")) return "bg-amber-400";
  return "bg-amber-300";
};

// "This week" streak strip — parity with the IELTS WeeklyRhythmIndicator (streak-driven).
const WeeklyRhythm = ({ streak }: { streak: number }) => {
  const days = ["M", "T", "W", "T", "F", "S", "S"];
  const todayIdx = (new Date().getDay() + 6) % 7; // Mon=0 … Sun=6
  return (
    <section className="rounded-2xl border border-brand-line bg-brand-bg-alt p-5 sm:p-6">
      <p className="font-jetbrains text-[10px] uppercase tracking-[0.16em] text-brand-text-mute">This week</p>
      <div className="mt-1 mb-3 flex items-baseline gap-2">
        <span className="font-dm text-2xl font-bold text-brand-text">{streak}</span>
        <span className="text-sm text-brand-text-mute">day streak · {Math.max(0, 7 - streak)} more to your 7-day goal</span>
      </div>
      <div className="grid grid-cols-7 gap-1.5">
        {days.map((d, i) => (
          <div key={i} className={cn(
            "flex h-9 items-center justify-center rounded-lg font-jetbrains text-xs font-bold",
            i === todayIdx ? "bg-brand-ink-deep text-white"
              : i < todayIdx && todayIdx - i <= streak ? "bg-brand-mint text-brand-ink-deep"
              : "bg-brand-line text-brand-text-mute",
          )}>{d}</div>
        ))}
      </div>
    </section>
  );
};

// Momentum wallet — parity with the IELTS MomentumWalletCard (momentum is exam-agnostic).
const MomentumWallet = ({ momentum }: { momentum: number }) => (
  <section className="rounded-2xl border border-brand-line bg-brand-bg-alt p-5 sm:p-6">
    <p className="font-jetbrains text-[10px] uppercase tracking-[0.16em] text-brand-text-mute">Momentum Wallet</p>
    <p className="mt-1 font-dm text-3xl font-bold text-brand-text tabular-nums">{momentum} <span className="text-sm font-medium text-brand-text-mute">points</span></p>
    <p className="mt-2 text-sm leading-relaxed text-brand-text-mute">Earned from drills &amp; streaks. Spend it on extra practice once you've used today's free drills.</p>
  </section>
);

const StatRow = ({ label, value }: { label: string; value: string }) => (
  <div className="flex items-center justify-between text-sm">
    <span className="text-brand-text-mute">{label}</span>
    <span className="font-semibold text-brand-text">{value}</span>
  </div>
);

// CEFR analogue of the IELTS Predicted Readiness: current level, the next level as the target,
// within-level progress, and (if an exam date is set) days remaining.
const PredictedReadiness = ({ cefrLabel, meanScore, examDate }: { cefrLabel?: string; meanScore?: number; examDate: string | null }) => {
  const next = nextCefr(cefrLabel);
  const progress = withinLevelProgress(cefrLabel, meanScore);
  const daysLeft = examDate ? Math.ceil((new Date(examDate).getTime() - Date.now()) / 86400000) : null;
  return (
    <section className="rounded-2xl border border-brand-line bg-brand-bg-alt p-5 sm:p-6">
      <p className="font-jetbrains text-[10px] uppercase tracking-[0.16em] text-brand-text-mute">Predicted readiness</p>
      <div className="mt-3 space-y-2">
        <StatRow label="Current level" value={cefrLabel ?? "—"} />
        <StatRow label="Target (next level)" value={next ?? "Top of scale"} />
        {daysLeft != null && daysLeft > 0 && <StatRow label="Days to target date" value={String(daysLeft)} />}
        {examDate && <StatRow label="Target date" value={examDate} />}
      </div>
      <div className="mt-3 h-2 overflow-hidden rounded-full bg-brand-line">
        <div className="h-full rounded-full bg-brand-mint transition-all" style={{ width: `${progress}%` }} />
      </div>
      <p className="mt-2 text-sm leading-relaxed text-brand-text-mute">
        {next ? `Keep drilling and completing assessments to move from ${cefrLabel} toward ${next}.` : "You're at the top of the scale — keep practising to stay sharp."}
      </p>
    </section>
  );
};

// Internal-assessment card — reads the shared IA schedule (getIAStatus, exam-agnostic).
const IACard = ({ status, onStart }: { status: any; onStart: () => void }) => {
  if (!status?.success) return null;
  const next = status.next_ia;
  return (
    <section className="rounded-2xl border border-brand-line bg-brand-bg-alt p-5 sm:p-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="font-jetbrains text-[10px] uppercase tracking-[0.16em] text-brand-text-mute">Internal assessment</p>
          {status.can_start_test ? (
            <p className="mt-1 text-sm font-medium text-brand-text">Your assessment is ready — a few speaking prompts that update your CEFR sub-scores.</p>
          ) : status.is_ia_day ? (
            <p className="mt-1 text-sm text-brand-text-mute">Assessment day — finish today's drills to unlock it.</p>
          ) : next ? (
            <p className="mt-1 text-sm text-brand-text-mute">Next assessment: <span className="font-semibold text-brand-text">{next.date_formatted}</span> · in {next.days_away} day{next.days_away === 1 ? "" : "s"}</p>
          ) : (
            <p className="mt-1 text-sm text-brand-text-mute">Keep practising — assessments unlock as you build a streak.</p>
          )}
        </div>
        {status.can_start_test && (
          <button onClick={onStart} className="inline-flex items-center gap-2 self-start rounded-xl bg-brand-teal-600 px-5 py-2.5 font-semibold text-white hover:bg-brand-teal-700 sm:self-auto">Start assessment <ArrowRight className="h-4 w-4" /></button>
        )}
      </div>
    </section>
  );
};

const SpokenEnglishDashboardPage = () => {
  const { profile } = useAuth();
  const navigate = useNavigate();
  const { syncMomentum, updateStreak } = useMomentum();
  const cfg = examDisplay(profile?.examId);
  const examId = profile?.examId ?? "spoken_english";

  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [showPremium, setShowPremium] = useState(false);
  const [loading, setLoading] = useState(true);
  const [result, setResult] = useState<CefrResult | null>(null);
  const [meta, setMeta] = useState<{ momentum: number; streak: number }>({ momentum: 0, streak: 0 });
  const [examDate, setExamDate] = useState<string | null>(null);
  const [drillsToday, setDrillsToday] = useState(0);
  // The next drill to do — from the shared recommendation engine (getNextActionDrill), the
  // same one IELTS uses. It picks the weakest not-done-today subskill (rotates correctly).
  const [nextDrill, setNextDrill] = useState<{ subEnum: string; label: string } | null>(null);
  const [iaStatus, setIaStatus] = useState<any>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [comp, drillState, nextAction, ia] = await Promise.all([
          callBackend("/api/student/competency-scores"),
          callBackend("/api/student/daily-drill-state").catch(() => null),
          callBackend("/api/student/next-action-drill").catch(() => null),
          callBackend("/api/ia/status").catch(() => null),
        ]);
        if (!cancelled) setIaStatus(ia);
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
  const displayName = profile?.name || "there";

  return (
    <div className="min-h-screen bg-brand-bg font-dm transition-colors duration-300">
      <StudentSidebar
        activeTab="dashboard" onTabChange={() => {}}
        isCollapsed={isSidebarCollapsed} toggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
        isLocked={false} isNewStudent={false}
      />

      <div className="min-h-screen flex flex-col pl-0 md:pl-[116px]">
        <StudentTopbar onUpgradeClick={() => setShowPremium(true)} />

        <main className="flex-1 p-4 sm:p-6 lg:p-8 space-y-6">
          {/* exam · batch · streak context */}
          <div className="flex flex-wrap items-center gap-2 text-[12px]">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-brand-line bg-brand-bg-alt px-3 py-1 font-medium text-brand-text">
              <Compass className="h-3.5 w-3.5 text-brand-teal-600" /><span className="text-brand-text-mute">Exam</span><span className="font-semibold">{profile?.examLabel ?? "Spoken English"}</span>
            </span>
            {profile?.batchName && (
              <span className="inline-flex items-center gap-1.5 rounded-full border border-brand-line bg-brand-bg-alt px-3 py-1 font-medium text-brand-text">
                <span className="text-brand-text-mute">Batch</span><span className="font-semibold">{profile.batchName}</span>
              </span>
            )}
            {meta.streak > 0 && (
              <span className="inline-flex items-center gap-1.5 rounded-full border border-brand-line bg-brand-bg-alt px-3 py-1 font-medium text-brand-text">
                <Flame className="h-3.5 w-3.5 text-amber-500" /><span className="font-semibold">{meta.streak}-day streak</span>
              </span>
            )}
          </div>

          <h1 className="font-dm text-2xl font-bold tracking-tight text-brand-text">Hi {displayName} 👋</h1>

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
              {/* THE CLIMB */}
              <section className="relative overflow-hidden rounded-3xl border border-white/10 bg-brand-ink-deep p-6 sm:p-8 text-white">
                <div className="absolute top-0 right-0 h-40 w-40 bg-brand-mint/10 blur-[60px]" />
                <div className="relative flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
                  <div>
                    <p className="font-jetbrains text-[11px] uppercase tracking-[0.18em] text-brand-mint">The Climb</p>
                    <div className="mt-2 flex items-end gap-3">
                      <span className="font-dm text-5xl font-bold leading-none">{result.cefrLabel}</span>
                      {nextCefr(result.cefrLabel) && <span className="pb-1 text-sm text-brand-mint">{nextCefr(result.cefrLabel)} is your next level</span>}
                    </div>
                    <div className="mt-4 h-2 w-full max-w-md overflow-hidden rounded-full bg-white/10">
                      <div className="h-full rounded-full bg-brand-mint transition-all" style={{ width: `${withinLevelProgress(result.cefrLabel, result.meanScore)}%` }} />
                    </div>
                    {result.scoredPromptCount != null && <p className="mt-2 text-xs text-white/50">Based on {result.scoredPromptCount} graded {result.scoredPromptCount === 1 ? "answer" : "answers"}</p>}
                  </div>
                  <div className="flex gap-8">
                    <div><p className="font-jetbrains text-[10px] uppercase tracking-[0.16em] text-white/50">Level</p><p className="mt-1 font-dm text-lg font-bold">{LEVEL_LABEL[cefrToDrillLevel(result.cefrLevel)]}</p></div>
                    <div><p className="font-jetbrains text-[10px] uppercase tracking-[0.16em] text-white/50">Momentum</p><p className="mt-1 flex items-center gap-1 font-dm text-lg font-bold text-brand-mint"><Zap className="h-4 w-4" />{meta.momentum}</p></div>
                  </div>
                </div>
              </section>

              {/* Daily-drill gate — 3 drills to unlock (no LexiGrid step) */}
              {!seUnlocked && (
                <section className="rounded-3xl border border-brand-teal-200 bg-brand-teal-wash p-6">
                  <p className="font-jetbrains text-[11px] uppercase tracking-[0.16em] text-brand-teal-700">Today · {drillsToday} / {DRILLS_TO_UNLOCK} drills</p>
                  <h2 className="mt-1 font-dm text-xl font-bold text-brand-teal-950">Warm up with {DRILLS_TO_UNLOCK} quick drills</h2>
                  <p className="mt-1 text-sm text-brand-teal-800/80">Finish {DRILLS_TO_UNLOCK} short MCQ drills to open the full dashboard. Next up: <strong>{nextDrill ? nextDrill.label : "your weakest subskill"}</strong>.</p>
                  <div className="mt-4 flex gap-2">
                    {Array.from({ length: DRILLS_TO_UNLOCK }).map((_, i) => (
                      <div key={i} className={cn("h-2 flex-1 rounded-full", i < drillsToday ? "bg-brand-teal-500" : "bg-brand-teal-200")} />
                    ))}
                  </div>
                  <button onClick={() => startDrill(nextDrill?.subEnum)} disabled={!nextDrill} className="mt-5 inline-flex items-center gap-2 rounded-xl bg-brand-teal-600 px-6 py-3 font-semibold text-white hover:bg-brand-teal-700 disabled:opacity-50">
                    <Dumbbell className="h-4 w-4" /> Start drill {Math.min(drillsToday + 1, DRILLS_TO_UNLOCK)} <ArrowRight className="h-4 w-4" />
                  </button>
                </section>
              )}

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

                {/* 6-subskill profile with per-subskill practice */}
                {result.subskillProfile && result.subskillProfile.length > 0 && (
                  <section className="rounded-2xl border border-brand-line bg-brand-bg-alt p-5 sm:p-6">
                    <h2 className="mb-4 font-dm text-sm font-bold uppercase tracking-[0.12em] text-brand-text-mute">Your speaking profile</h2>
                    <div className="space-y-4">
                      {result.subskillProfile.map((s) => (
                        <div key={s.id} className="flex items-center gap-4">
                          <div className="min-w-0 flex-1">
                            <div className="mb-1 flex items-center justify-between">
                              <span className="text-sm font-medium text-brand-text">{s.label}</span>
                              <span className="font-jetbrains text-xs font-bold uppercase text-brand-teal-700">{(s.level || "").toUpperCase()}</span>
                            </div>
                            <div className="h-2 w-full overflow-hidden rounded-full bg-brand-line">
                              <div className={cn("h-full rounded-full", barColor(s.level))} style={{ width: `${Math.max(4, Math.min(100, s.score))}%` }} />
                            </div>
                          </div>
                          {seSubskill(s.id)?.drillable
                            ? <button onClick={() => startDrill(seSubskill(s.id)?.drillSubskill)} className="shrink-0 rounded-lg border border-brand-line px-3 py-1.5 text-xs font-semibold text-brand-teal-700 hover:border-brand-teal-300">Practice</button>
                            : <span className="shrink-0 text-[11px] text-brand-text-mute">Speaking only</span>}
                        </div>
                      ))}
                    </div>
                  </section>
                )}

                {/* Weekly rhythm + predicted readiness + momentum wallet (parity with IELTS) */}
                <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                  <WeeklyRhythm streak={meta.streak} />
                  <PredictedReadiness cefrLabel={result.cefrLabel} meanScore={result.meanScore} examDate={examDate} />
                </div>
                <MomentumWallet momentum={meta.momentum} />

                <IACard status={iaStatus} onStart={() => navigate(`/${examId}/internal`)} />

                {/* Coaching notes */}
                {result.feedback && result.feedback.length > 0 && (
                  <section className="rounded-2xl border border-brand-line bg-brand-bg-alt p-5 sm:p-6">
                    <h2 className="mb-3 font-dm text-sm font-bold uppercase tracking-[0.12em] text-brand-text-mute">Coaching notes</h2>
                    <div className="space-y-3">
                      {result.feedback.map((f, i) => (
                        <div key={f.promptId ?? i} className="rounded-xl border border-brand-line bg-brand-bg px-4 py-3">
                          {f.strengths && <p className="flex gap-2 text-sm leading-relaxed text-brand-text"><CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-brand-teal-600" />{f.strengths}</p>}
                          {f.improvements && <p className="mt-2 flex gap-2 text-sm leading-relaxed text-brand-text"><ArrowRight className="mt-0.5 h-4 w-4 shrink-0 text-amber-500" />{f.improvements}</p>}
                        </div>
                      ))}
                    </div>
                  </section>
                )}
              </div>

              {cfg.disclaimer && (
                <p className="flex items-start gap-2 px-1 text-[12px] leading-relaxed text-brand-text-mute"><AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />{cfg.disclaimer}</p>
              )}
            </>
          )}
        </main>
      </div>

      {showPremium && <PremiumModal isOpen={showPremium} onClose={() => setShowPremium(false)} />}
    </div>
  );
};

export default SpokenEnglishDashboardPage;
