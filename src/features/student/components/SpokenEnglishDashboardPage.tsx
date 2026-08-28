// Spoken English student home. A separate page (routed via the dashboard dispatch) so the
// IELTS StudentDashboardPage is never touched. Display-only: reads the already-computed CEFR
// result from /api/student/competency-scores (the SPEAKING competency row) and renders the
// headline level, the 6-subskill profile, and the diagnostic feedback. See
// docs/spoken-english/SPOKEN-ENGLISH-STUDENT-FRONTEND-SPEC.md.
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { callBackend } from "@/features/auth/services/authClient";
import { StudentSidebar } from "./dashboard/StudentSidebar";
import { StudentTopbar } from "./dashboard/StudentTopbar";
import { PremiumModal } from "@/features/payment/components/PremiumModal";
import { examDisplay } from "@/features/student/config/examDisplay";
import { cn } from "@/shared/utils";
import { Mic, CheckCircle2, ArrowRight, AlertTriangle, Loader2, Trophy, Compass, Flame } from "lucide-react";

interface SubskillRow { id: string; label: string; level: string; score: number; }
interface CefrResult {
  cefrLevel?: string;
  cefrLabel?: string;
  meanScore?: number;
  subskillProfile?: SubskillRow[];
  feedback?: Array<{ promptId: string; strengths: string; improvements: string }>;
  scoredPromptCount?: number;
}

// Colour a subskill bar by its CEFR band (warm = lower, green = higher).
const barColor = (level?: string) => {
  const l = (level || "").toLowerCase();
  if (l.startsWith("c")) return "bg-emerald-500";
  if (l.startsWith("b2")) return "bg-brand-teal-500";
  if (l.startsWith("b")) return "bg-brand-teal-400";
  if (l.startsWith("a2")) return "bg-amber-400";
  return "bg-amber-300";
};

const SpokenEnglishDashboardPage = () => {
  const { profile } = useAuth();
  const navigate = useNavigate();
  const cfg = examDisplay(profile?.examId);

  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [showPremium, setShowPremium] = useState(false);
  const [loading, setLoading] = useState(true);
  const [result, setResult] = useState<CefrResult | null>(null);
  const [meta, setMeta] = useState<{ momentum: number; streak: number }>({ momentum: 0, streak: 0 });

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await callBackend("/api/student/competency-scores");
        if (cancelled) return;
        const speaking = (res.data ?? []).find((r: any) => r.skill === "SPEAKING");
        setResult((speaking?.sub_scores as CefrResult) ?? null);
        setMeta({ momentum: res.momentum_score ?? 0, streak: res.daily_streak ?? 0 });
      } catch {
        if (!cancelled) setResult(null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const displayName = profile?.name || "there";

  return (
    <div className="min-h-screen bg-brand-bg font-dm transition-colors duration-300">
      <StudentSidebar
        activeTab="dashboard"
        onTabChange={() => {}}
        isCollapsed={isSidebarCollapsed}
        toggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
        isLocked={false}
        isNewStudent={false}
      />

      <div className="min-h-screen flex flex-col pl-0 md:pl-[116px]">
        <StudentTopbar onUpgradeClick={() => setShowPremium(true)} />

        <main className="flex-1 p-4 sm:p-6 lg:p-8 space-y-6">
          {/* exam · batch context */}
          <div className="flex flex-wrap items-center gap-2 text-[12px]">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-brand-line bg-brand-bg-alt px-3 py-1 font-medium text-brand-text">
              <Compass className="h-3.5 w-3.5 text-brand-teal-600" />
              <span className="text-brand-text-mute">Exam</span>
              <span className="font-semibold">{profile?.examLabel ?? "Spoken English"}</span>
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
            /* Diagnosed guard should prevent this, but degrade gracefully. */
            <div className="rounded-2xl border border-brand-line bg-brand-bg-alt p-8 text-center">
              <Mic className="mx-auto h-10 w-10 text-brand-teal-600" />
              <h2 className="mt-3 font-dm text-lg font-bold text-brand-text">Take your speaking diagnostic</h2>
              <p className="mx-auto mt-1 max-w-sm text-sm text-brand-text-mute">Record a few short answers and we'll estimate your CEFR level and where to focus.</p>
              <button onClick={() => navigate(`/${profile?.examId ?? "spoken_english"}/diagnosis`)} className="mt-5 inline-flex items-center gap-2 rounded-xl bg-brand-teal-600 px-5 py-2.5 font-semibold text-white hover:bg-brand-teal-700">Start diagnostic <ArrowRight className="h-4 w-4" /></button>
            </div>
          ) : (
            <>
              {/* Headline CEFR level */}
              <section className="rounded-3xl border border-brand-teal-200 bg-brand-teal-wash p-6 sm:p-8">
                <div className="flex items-center gap-5">
                  <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-brand-teal-100 border border-brand-teal-200">
                    <Trophy className="h-8 w-8 text-brand-teal-600" />
                  </div>
                  <div>
                    <p className="font-jetbrains text-[11px] uppercase tracking-[0.16em] text-brand-teal-700">{cfg.headlineLabel}</p>
                    <p className="font-dm text-4xl font-bold leading-none text-brand-teal-950">{result.cefrLabel}</p>
                    {result.scoredPromptCount != null && (
                      <p className="mt-1 text-sm text-brand-teal-800/80">Based on {result.scoredPromptCount} graded {result.scoredPromptCount === 1 ? "answer" : "answers"}</p>
                    )}
                  </div>
                </div>
              </section>

              {/* 6-subskill profile */}
              {result.subskillProfile && result.subskillProfile.length > 0 && (
                <section className="rounded-2xl border border-brand-line bg-brand-bg-alt p-5 sm:p-6">
                  <h2 className="mb-4 font-dm text-sm font-bold uppercase tracking-[0.12em] text-brand-text-mute">Your speaking profile</h2>
                  <div className="space-y-3.5">
                    {result.subskillProfile.map((s) => (
                      <div key={s.id}>
                        <div className="mb-1 flex items-center justify-between">
                          <span className="text-sm font-medium text-brand-text">{s.label}</span>
                          <span className="font-jetbrains text-xs font-bold uppercase text-brand-teal-700">{(s.level || "").toUpperCase()}</span>
                        </div>
                        <div className="h-2 w-full overflow-hidden rounded-full bg-brand-line">
                          <div className={cn("h-full rounded-full transition-all", barColor(s.level))} style={{ width: `${Math.max(4, Math.min(100, s.score))}%` }} />
                        </div>
                      </div>
                    ))}
                  </div>
                </section>
              )}

              {/* Feedback */}
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

              {/* CEFR legal disclaimer */}
              {cfg.disclaimer && (
                <p className="flex items-start gap-2 px-1 text-[12px] leading-relaxed text-brand-text-mute">
                  <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />{cfg.disclaimer}
                </p>
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
