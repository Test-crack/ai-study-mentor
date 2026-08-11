import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Trophy, ChevronRight, Lock, CheckCircle2, Zap, PlayCircle, Calendar } from "lucide-react";
import { callBackend } from "@/features/auth/services/authClient";

interface MockWidgetStatus {
  is_eligible:              boolean;
  can_start_mock:           boolean;
  has_active_session:       boolean;
  active_session_id:        string | null;
  standard_used_this_month: boolean;
  standard_session_status:  string | null;
  earned_used_this_month:   boolean;
  earned_session_status:    string | null;
  can_start_earned:         boolean;
  earned_mock_eligible:     boolean;
  momentum_score:           number;
  earned_mock_cost:         number;
  progress: {
    ia_completed:    number;
    ia_required:     number;
    ia_per_skill:    Record<string, boolean>;
    band_improved:   boolean;
    best_improvement: number;
  };
}

function firstOfNextMonth(): string {
  const now = new Date();
  // Construct the 1st directly — d.setMonth(+1) on e.g. Jan 31 overflows into March.
  const d = new Date(now.getFullYear(), now.getMonth() + 1, 1);
  return d.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

export default function MockStatusWidget() {
  const navigate = useNavigate();
  const [status, setStatus]   = useState<MockWidgetStatus | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      try {
        const backendUrl = import.meta.env.VITE_BACKEND_URL || "http://localhost:4000";
        const res = await callBackend(`${backendUrl}/api/mock/status`);
        if (res.success) setStatus(res as MockWidgetStatus);
      } catch {
        // silently hide on error
      } finally {
        setLoading(false);
      }
    };
    void fetch();
  }, []);

  if (loading) return null;
  if (!status) return null;

  // Don't show the widget until the student has started their IA journey
  if (status.progress.ia_completed === 0) return null;

  const p = status.progress;
  const allSkills = ["LISTENING", "READING", "WRITING", "SPEAKING"];
  const skillsCovered = allSkills.filter(s => p.ia_per_skill[s]).length;

  // ── Determine which state to render ─────────────────────────────────────
  const hasActive = status.has_active_session;
  const canStart = status.can_start_mock;
  const slotExpired = status.standard_session_status === 'ABANDONED' && !hasActive;
  const slotCompleted   = status.standard_used_this_month && !hasActive && !slotExpired;
  const usedMonth       = slotExpired || slotCompleted;
  const notEligible     = !status.is_eligible;

  return (
    <div
      className="relative overflow-hidden rounded-3xl bg-brand-ink-deep border border-brand-line-16 p-5 shadow-sm h-full flex flex-col"
      style={{
        backgroundImage:
          'linear-gradient(to right, rgba(62,224,160,0.05) 1px, transparent 1px), linear-gradient(to bottom, rgba(62,224,160,0.05) 1px, transparent 1px)',
        backgroundSize: '32px 32px',
      }}
    >
      {/* Header */}
      <div className="relative z-10 flex items-center justify-between mb-4">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-white/10 flex items-center justify-center flex-shrink-0">
            <Trophy className="w-4 h-4 text-brand-mint" />
          </div>
          <div>
            <p className="font-dm font-bold text-white text-sm leading-tight">Mock IELTS</p>
            <p className="text-xs text-brand-on-ink-mute leading-tight">Full simulation test</p>
          </div>
        </div>
        <button
          onClick={() => navigate("/student/mock")}
          className="text-xs font-semibold text-brand-mint hover:underline flex items-center gap-0.5"
        >
          View <ChevronRight className="w-3.5 h-3.5" />
        </button>
      </div>

      <div className="relative z-10 flex flex-col flex-1">

      {/* ── State: Active session — resume ────────────────────────────────── */}
      {hasActive && (
        <>
          <div className="rounded-xl px-4 py-3 mb-4 bg-amber-500/10 border border-amber-500/25 flex items-center gap-3">
            <PlayCircle className="w-5 h-5 text-amber-400 flex-shrink-0" />
            <div>
              <p className="font-jetbrains text-xs font-black uppercase tracking-widest text-amber-300 mb-0.5">
                Mock In Progress
              </p>
              <p className="text-xs font-medium text-amber-200/80">
                Your test is paused. Timer is running.
              </p>
            </div>
          </div>
          <button
            onClick={() => navigate("/student/mock")}
            className="mt-auto w-full py-2.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-brand-ink-deep font-bold text-xs uppercase tracking-wide transition-colors"
          >
            Continue Mock Test →
          </button>
        </>
      )}

      {/* ── State: Available — start ──────────────────────────────────────── */}
      {!hasActive && canStart && (
        <>
          <div className="rounded-xl px-4 py-3 mb-4 bg-white/5 border border-brand-mint/25 flex items-center gap-3">
            <CheckCircle2 className="w-5 h-5 text-brand-mint flex-shrink-0" />
            <div>
              <p className="font-jetbrains text-xs font-black uppercase tracking-widest text-brand-mint mb-0.5">
                Available This Month
              </p>
              <p className="text-xs font-medium text-brand-on-ink-mute">
                All requirements met · 4 skills · 3 hours
              </p>
            </div>
          </div>
          <button
            onClick={() => navigate("/student/mock")}
            className="mt-auto w-full py-2.5 rounded-xl bg-white hover:bg-white/90 text-brand-ink-deep font-bold text-xs uppercase tracking-wide transition-colors"
          >
            Start Mock Test →
          </button>
        </>
      )}

      {/* ── State: Slot expired (ABANDONED) ──────────────────────────────── */}
      {!hasActive && slotExpired && (
        <>
          <div className="rounded-xl px-4 py-3 mb-3 bg-amber-500/10 border border-amber-500/25 flex items-center gap-3">
            <Calendar className="w-5 h-5 text-amber-400 flex-shrink-0" />
            <div>
              <p className="font-jetbrains text-xs font-black uppercase tracking-widest text-amber-300 mb-0.5">
                Session Expired
              </p>
              <p className="text-xs font-medium text-amber-200/80">
                72-hour window closed · slot consumed
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white/5 border border-brand-line-16 mb-3">
            <Calendar className="w-4 h-4 text-brand-on-ink-mute flex-shrink-0" />
            <div>
              <p className="font-jetbrains text-[10px] font-black uppercase tracking-widest text-brand-on-ink-mute">Next standard slot</p>
              <p className="text-xs font-bold text-white">{firstOfNextMonth()}</p>
            </div>
          </div>
          {status.can_start_earned && (
            <button
              onClick={() => navigate("/student/mock")}
              className="w-full py-2 rounded-xl border border-amber-400/40 text-amber-300 font-bold text-xs uppercase tracking-wide hover:bg-amber-500/10 transition-colors flex items-center justify-center gap-1.5"
            >
              <Zap className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
              Extra Mock — {status.earned_mock_cost.toLocaleString()} pts
            </button>
          )}
          {!status.can_start_earned && (
            <button
              onClick={() => navigate("/student/mock")}
              className="mt-auto w-full py-2.5 rounded-xl border border-brand-line-16 text-brand-on-ink-mute font-bold text-xs uppercase tracking-wide hover:bg-white/5 transition-colors"
            >
              Go to Mock →
            </button>
          )}
        </>
      )}

      {/* ── State: Completed this month ───────────────────────────────────── */}
      {!hasActive && slotCompleted && (
        <>
          <div className="rounded-xl px-4 py-3 mb-3 bg-emerald-500/10 border border-emerald-500/25 flex items-center gap-3">
            <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0" />
            <div>
              <p className="font-jetbrains text-xs font-black uppercase tracking-widest text-emerald-300 mb-0.5">
                Mock Completed
              </p>
              <p className="text-xs font-medium text-emerald-200/80">
                Standard slot used this month
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white/5 border border-brand-line-16 mb-3">
            <Calendar className="w-4 h-4 text-brand-on-ink-mute flex-shrink-0" />
            <div>
              <p className="font-jetbrains text-[10px] font-black uppercase tracking-widest text-brand-on-ink-mute">Next standard slot</p>
              <p className="text-xs font-bold text-white">{firstOfNextMonth()}</p>
            </div>
          </div>
          {status.can_start_earned && (
            <button
              onClick={() => navigate("/student/mock")}
              className="w-full py-2 rounded-xl border border-amber-400/40 text-amber-300 font-bold text-xs uppercase tracking-wide hover:bg-amber-500/10 transition-colors flex items-center justify-center gap-1.5"
            >
              <Zap className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
              Extra Mock — {status.earned_mock_cost.toLocaleString()} pts
            </button>
          )}
          {!status.can_start_earned && (
            <button
              onClick={() => navigate("/student/mock")}
              className="mt-auto w-full py-2.5 rounded-xl border border-brand-line-16 text-brand-on-ink-mute font-bold text-xs uppercase tracking-wide hover:bg-white/5 transition-colors"
            >
              Go to Mock →
            </button>
          )}
        </>
      )}

      {/* ── State: Eligible but can_start_mock not yet true (edge / cooldown) ── */}
      {!hasActive && !canStart && !usedMonth && !notEligible && (
        <>
          <div className="rounded-xl px-4 py-3 mb-4 bg-white/5 border border-brand-mint/25 flex items-center gap-3">
            <CheckCircle2 className="w-5 h-5 text-brand-mint flex-shrink-0" />
            <div>
              <p className="font-jetbrains text-xs font-black uppercase tracking-widest text-brand-mint mb-0.5">
                Eligible
              </p>
              <p className="text-xs font-medium text-brand-on-ink-mute">
                Requirements met · mock opening soon
              </p>
            </div>
          </div>
          <button
            onClick={() => navigate("/student/mock")}
            className="mt-auto w-full py-2.5 rounded-xl border border-brand-line-16 text-white font-bold text-xs uppercase tracking-wide hover:bg-white/5 transition-colors"
          >
            Go to Mock →
          </button>
        </>
      )}

      {/* ── State: Not yet eligible — show progress ───────────────────────── */}
      {!hasActive && !canStart && !usedMonth && notEligible && (
        <>
          <div className="rounded-xl px-4 py-3 mb-4 bg-white/5 border border-brand-line-16 flex items-center gap-3">
            <Lock className="w-5 h-5 text-brand-on-ink-mute flex-shrink-0" />
            <div>
              <p className="font-jetbrains text-xs font-black uppercase tracking-widest text-brand-on-ink-mute mb-0.5">
                Not Yet Unlocked
              </p>
              <p className="text-xs font-medium text-brand-on-ink-mute">
                Complete IAs to unlock the full Mock test
              </p>
            </div>
          </div>

          {/* Eligibility progress */}
          <div className="flex flex-col gap-2 mb-4">
            {/* IA count */}
            <div className="flex items-center gap-2">
              <div className={`w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0 ${p.ia_completed >= p.ia_required ? "bg-emerald-500" : "bg-white/10"}`}>
                {p.ia_completed >= p.ia_required
                  ? <CheckCircle2 className="w-3 h-3 text-white" />
                  : <span className="text-[8px] font-black text-brand-on-ink-mute">{p.ia_completed}</span>
                }
              </div>
              <p className="text-xs text-brand-on-ink-mute font-medium">
                {p.ia_completed}/{p.ia_required} IAs completed
              </p>
            </div>

            {/* Skill coverage */}
            <div className="flex items-center gap-2">
              <div className={`w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0 ${skillsCovered === 4 ? "bg-emerald-500" : "bg-white/10"}`}>
                {skillsCovered === 4
                  ? <CheckCircle2 className="w-3 h-3 text-white" />
                  : <span className="text-[8px] font-black text-brand-on-ink-mute">{skillsCovered}</span>
                }
              </div>
              <p className="text-xs text-brand-on-ink-mute font-medium">
                {skillsCovered}/4 skills covered (L/R/W/S)
              </p>
            </div>

            {/* Band improvement */}
            <div className="flex items-center gap-2">
              <div className={`w-4 h-4 rounded-full flex-shrink-0 flex items-center justify-center ${p.band_improved ? "bg-emerald-500" : "bg-white/10"}`}>
                {p.band_improved ? <CheckCircle2 className="w-3 h-3 text-white" /> : null}
              </div>
              <p className="text-xs text-brand-on-ink-mute font-medium">
                Band improved ≥ 0.5 {p.best_improvement > 0 ? `(best: +${p.best_improvement.toFixed(1)})` : ""}
              </p>
            </div>
          </div>

          <button
            onClick={() => navigate("/student/internal")}
            className="mt-auto w-full py-2.5 rounded-xl border border-brand-line-16 text-white font-bold text-xs uppercase tracking-wide hover:bg-white/5 transition-colors"
          >
            Continue IAs →
          </button>
        </>
      )}
      </div>
    </div>
  );
}
