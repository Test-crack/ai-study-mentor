// Spoken English — Full Mock page. Separate page (routed via the mock dispatch) so the IELTS
// FullMockAssessment is never touched. For now this is the mock GATE: it shows the unlock
// requirement (internal assessments) while locked, and an eligible state when the student has
// met it. The graded CEFR mock-taking flow (viva-scored, like the SE IA) is a follow-up build.
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { callBackend } from "@/features/auth/services/authClient";
import StudentLayout from "./StudentLayout";
import { Trophy, Lock, ArrowLeft, CheckCircle2, Loader2, ArrowRight } from "lucide-react";

const SpokenEnglishMockPage = () => {
  const { profile } = useAuth();
  const navigate = useNavigate();
  const examId = profile?.examId ?? "spoken_english";
  const [status, setStatus] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    callBackend("/api/mock/status")
      .then((r) => { if (r?.success) setStatus(r); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const done = status?.progress?.ia_completed ?? 0;
  const req = status?.progress?.ia_required ?? 6;
  const eligible = !!status?.can_start_mock;

  return (
    <StudentLayout activeTab="full mock" mainClassName="flex-1 p-4 sm:p-6 lg:p-8">
      <div className="mx-auto max-w-2xl space-y-6">
        <button onClick={() => navigate(`/${examId}/dashboard`)} className="flex items-center gap-2 text-sm font-semibold text-brand-text-mute hover:text-brand-teal-600 transition-colors">
          <ArrowLeft className="h-4 w-4" /> Back to Dashboard
        </button>

        {/* Dark hero — matches the SE dashboard treatment */}
        <section className="relative overflow-hidden rounded-3xl bg-brand-ink-deep p-6 sm:p-8 text-white">
          <div className="pointer-events-none absolute -right-10 -top-10 h-48 w-48 rounded-full bg-brand-teal-500/20 blur-2xl" />
          <div className="relative flex items-center gap-3 mb-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/10"><Trophy className="h-5 w-5 text-brand-mint" /></div>
            <div>
              <p className="font-jetbrains text-[10.5px] uppercase tracking-[0.18em] text-brand-mint">Full Mock Test</p>
              <h1 className="font-dm text-2xl font-bold leading-tight">Your CEFR speaking mock</h1>
            </div>
          </div>
          <p className="relative text-brand-on-ink-mute text-sm leading-[1.6] max-w-lg">A complete, timed run-through that mirrors the real assessment and updates your CEFR level across all six speaking sub-skills.</p>
        </section>

        {loading ? (
          <div className="flex items-center gap-3 py-16 text-brand-text-mute"><Loader2 className="h-6 w-6 animate-spin text-brand-teal-600" /> Loading…</div>
        ) : eligible ? (
          <section className="rounded-2xl border border-brand-teal-200 bg-white p-6 shadow-sm text-center">
            <CheckCircle2 className="mx-auto h-10 w-10 text-brand-teal-600" />
            <h2 className="mt-3 font-dm text-lg font-bold text-brand-text">You're eligible for your full mock</h2>
            <p className="mx-auto mt-1 max-w-md text-sm text-brand-text-mute">Your full CEFR speaking mock is being finalised and will open here shortly. In the meantime, keep your streak going with daily drills and internal assessments.</p>
            <button onClick={() => navigate(`/${examId}/dashboard`)} className="mt-5 inline-flex items-center gap-2 rounded-xl bg-brand-teal-600 px-5 py-2.5 font-semibold text-white hover:bg-brand-teal-700">Back to dashboard</button>
          </section>
        ) : (
          <section className="rounded-2xl border border-brand-line bg-white p-6 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-brand-bg-alt"><Lock className="h-5 w-5 text-brand-text-mute" /></div>
              <div>
                <h2 className="font-dm text-lg font-bold text-brand-text">Locked for now</h2>
                <p className="text-sm text-brand-text-mute">Complete {req} internal assessments to unlock your full mock.</p>
              </div>
            </div>
            <div className="mt-5">
              <div className="mb-1 flex items-center justify-between text-xs font-medium text-brand-text-mute"><span>Internal assessments</span><span className="tabular-nums">{done}/{req}</span></div>
              <div className="h-2.5 w-full overflow-hidden rounded-full bg-brand-line"><div className="h-full rounded-full bg-brand-teal-500 transition-all" style={{ width: `${Math.min(100, req ? (done / req) * 100 : 0)}%` }} /></div>
            </div>
            <button onClick={() => navigate(`/${examId}/internal`)} className="mt-5 inline-flex items-center gap-2 rounded-xl bg-brand-teal-600 px-5 py-2.5 font-semibold text-white hover:bg-brand-teal-700">Go to internal assessment <ArrowRight className="h-4 w-4" /></button>
          </section>
        )}
      </div>
    </StudentLayout>
  );
};

export default SpokenEnglishMockPage;
