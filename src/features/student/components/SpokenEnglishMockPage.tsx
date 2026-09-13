// Spoken English — Full Mock. Routed via the mock dispatch so the IELTS FullMockAssessment is
// untouched. Locked → the unlock gate (internal-assessment requirement). Eligible → the shared
// record-and-submit runner against the SE mock endpoints (/api/mock/se/*), viva-graded to CEFR.
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { callBackend } from "@/features/auth/services/authClient";
import StudentLayout from "./StudentLayout";
import SeSpeakingRunner from "./SeSpeakingRunner";
import { Trophy, Lock, ArrowLeft, Loader2, ArrowRight } from "lucide-react";

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

  // Eligible → the full record-and-submit mock (shared runner, full-screen like the IA).
  if (!loading && eligible) {
    return (
      <SeSpeakingRunner
        questionsUrl="/api/mock/se/questions"
        submitUrl="/api/mock/se/submit"
        cacheKind="mock"
        introEyebrow="Full Mock Test"
        introTitle="Full mock test"
        introBlurb={(n) => `A full CEFR speaking run-through — ${n} prompts across all six sub-skills. Speak naturally; this updates your overall level.`}
        resultTitle="Mock complete"
        notReadyMsg="Your full mock isn't ready yet — content is being prepared."
      />
    );
  }

  // Loading / locked → the unlock gate.
  return (
    <StudentLayout activeTab="full mock" mainClassName="flex-1 p-4 sm:p-6 lg:p-8">
      <div className="mx-auto max-w-2xl space-y-6">
        <button onClick={() => navigate(`/${examId}/dashboard`)} className="flex items-center gap-2 text-sm font-semibold text-brand-text-mute hover:text-brand-teal-600 transition-colors">
          <ArrowLeft className="h-4 w-4" /> Back to Dashboard
        </button>

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
          <div className="relative mt-5 flex flex-wrap gap-2">
            {["6 sub-skills", "Timed", "CEFR-graded", "Monthly"].map((m) => (
              <span key={m} className="rounded-full bg-white/10 px-3 py-1 font-jetbrains text-[11px] font-semibold tracking-wide text-white/90">{m}</span>
            ))}
          </div>
        </section>

        {loading ? (
          <div className="flex items-center gap-3 py-16 text-brand-text-mute"><Loader2 className="h-6 w-6 animate-spin text-brand-teal-600" /> Loading…</div>
        ) : (
          <>
            <section className="rounded-2xl border border-brand-line bg-white p-6 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-brand-bg-alt"><Lock className="h-5 w-5 text-brand-text-mute" /></div>
                <div>
                  <h2 className="font-dm text-lg font-bold text-brand-text">Locked for now</h2>
                  <p className="text-sm text-brand-text-mute">Complete {req} internal assessments to unlock your full mock.</p>
                </div>
              </div>
              <div className="mt-5">
                <div className="mb-1 flex items-center justify-between text-xs font-medium text-brand-text-mute"><span>Internal assessments</span><span className="tabular-nums font-jetbrains">{done}/{req}</span></div>
                <div className="h-2.5 w-full overflow-hidden rounded-full bg-brand-line"><div className="h-full rounded-full bg-brand-teal-500 transition-all" style={{ width: `${Math.min(100, req ? (done / req) * 100 : 0)}%` }} /></div>
                <p className="mt-2 text-xs text-brand-text-mute">{Math.max(0, req - done)} more to go — each internal assessment sharpens the sub-skills your mock will test.</p>
              </div>
              <button onClick={() => navigate(`/${examId}/internal`)} className="mt-5 inline-flex items-center gap-2 rounded-xl bg-brand-teal-600 px-5 py-2.5 font-semibold text-white hover:bg-brand-teal-700">Go to internal assessment <ArrowRight className="h-4 w-4" /></button>
            </section>

            <section className="rounded-2xl border border-brand-line bg-white p-6 shadow-sm">
              <p className="font-jetbrains text-[10px] uppercase tracking-[0.16em] text-brand-text-mute">What's inside once unlocked</p>
              <div className="mt-4 grid gap-4 sm:grid-cols-3">
                {[
                  { icon: Trophy, title: "Six sub-skills", body: "One prompt per speaking sub-skill, mirroring the real assessment." },
                  { icon: Loader2, title: "Timed & realistic", body: "Prep and speaking limits on each prompt, just like the diagnostic viva." },
                  { icon: ArrowRight, title: "Updates your level", body: "A fresh CEFR level across all six sub-skills, saved to your history." },
                ].map((f, i) => (
                  <div key={i} className="rounded-xl border border-brand-line bg-brand-bg-alt p-4">
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-teal-50 text-brand-teal-600"><f.icon className="h-4 w-4" /></div>
                    <p className="mt-3 text-sm font-semibold text-brand-text">{f.title}</p>
                    <p className="mt-1 text-[13px] leading-relaxed text-brand-text-mute">{f.body}</p>
                  </div>
                ))}
              </div>
            </section>
          </>
        )}
      </div>
    </StudentLayout>
  );
};

export default SpokenEnglishMockPage;
