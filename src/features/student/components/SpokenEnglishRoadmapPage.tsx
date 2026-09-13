"use client";
// Spoken English — My Roadmap. CEFR/sub-skill counterpart of the IELTS DiagnosticRoadmap
// (which is left byte-identical). Reads the same /api/student/competency-scores endpoint, but
// renders the single SPEAKING row's 6 CEFR sub-skills (sub_scores.subskillProfile) instead of
// the 4 IELTS band skills. Routed via RoadmapDispatch so IELTS never sees this.
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowRight, Flag, Clock, Compass } from "lucide-react";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { callBackend } from "@/features/auth/services/authClient";
import { getBackendUrl } from "@/shared/utils";
import { StudentLayout } from "@/features/student/components/StudentLayout";
import { SE_SUBSKILLS } from "@/features/student/config/spokenEnglishSubskills";
import { nextCefr, withinLevelProgress } from "@/features/student/config/spokenEnglishSubskills";
import { cefrColor, cefrGaugeColor } from "@/features/student/config/cefrDisplay";

interface SubRow { id: string; score: number; level: string }
interface SeMatrix {
  cefrLabel?: string;
  cefrLevel?: string;
  meanScore?: number;
  subskillProfile?: SubRow[];
}

// One targeted, CEFR-appropriate action per sub-skill — the sub-skill IS the criterion, so a
// single sharp tip beats a ranked list here.
const SUBSKILL_ACTION: Record<string, string> = {
  range: "Build topic vocabulary and natural phrases so you can express ideas with more precision.",
  accuracy: "Practise a wider range of tenses and complex sentences with fewer grammatical slips.",
  fluency: "Speak in longer stretches at a natural pace — reduce hesitation and filler words.",
  interaction: "Respond and follow up quickly: ask questions, agree or disagree, and keep the exchange going.",
  coherence: "Organise your points with clear linking words so your answers flow logically.",
  phonology: "Work on individual sounds, word stress, and intonation for clearer delivery.",
};

export default function SpokenEnglishRoadmapPage() {
  const navigate = useNavigate();
  const { profile } = useAuth();
  const examId = profile?.examId ?? "spoken_english";
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [matrix, setMatrix] = useState<SeMatrix | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await callBackend(`${getBackendUrl()}/api/student/competency-scores`);
        if (cancelled) return;
        if (res?.success && Array.isArray(res.data)) {
          const speaking = res.data.find((m: any) => m.skill?.toUpperCase() === "SPEAKING");
          setMatrix((speaking?.sub_scores ?? null) as SeMatrix | null);
        } else {
          setError(res?.error ?? "Couldn't load your results.");
        }
      } catch (e: any) {
        if (!cancelled) setError(e?.message ?? "Network error.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  if (loading) {
    return (
      <StudentLayout activeTab="roadmap" mainClassName="flex-1 flex items-center justify-center p-4">
        <div className="flex flex-col items-center gap-4 text-center">
          <div className="w-12 h-12 rounded-full border-[3px] border-brand-bg-alt border-t-brand-teal-600 animate-spin" />
          <p className="font-jetbrains text-brand-text-mute text-[11px] uppercase tracking-[0.16em]">Building your roadmap…</p>
        </div>
      </StudentLayout>
    );
  }

  const profileRows = matrix?.subskillProfile ?? [];
  if (error || profileRows.length === 0) {
    return (
      <StudentLayout activeTab="roadmap" mainClassName="flex-1 flex items-center justify-center p-4">
        <div className="text-center space-y-4 max-w-sm">
          <p className="text-brand-text font-medium text-[15px] leading-[1.7]">{error ?? "Complete your diagnostic to unlock your personalised roadmap."}</p>
          <button onClick={() => navigate(`/${examId}/dashboard`)} className="px-5 py-2.5 bg-brand-teal-700 hover:bg-brand-teal-600 text-white font-semibold text-[14.5px] rounded-xl transition-colors">Go to Dashboard</button>
        </div>
      </StudentLayout>
    );
  }

  // Order sub-skills by the config, carrying each one's graded score/level.
  const rows = SE_SUBSKILLS.map((cfg) => {
    const r = profileRows.find((p) => p.id === cfg.id);
    return { id: cfg.id, label: cfg.label, score: Number(r?.score ?? 0), level: String(r?.level ?? "a1") };
  });

  const overallLabel = matrix?.cefrLabel ?? "A1";
  const targetLevel = nextCefr(overallLabel);
  const priorityFocus = [...rows].sort((a, b) => a.score - b.score).slice(0, 2);

  // Timeline: a CEFR level is roughly an 8-week climb; scale by how far into the current level
  // the student already is. "You're there!" only at the top of the ladder (C2).
  const frac = withinLevelProgress(overallLabel, matrix?.meanScore) / 100;
  const weeksToNext = targetLevel ? Math.max(2, Math.ceil((1 - frac) * 8)) : 0;

  return (
    <StudentLayout activeTab="roadmap">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 space-y-8">
        {/* Header */}
        <div className="relative overflow-hidden rounded-2xl border border-brand-line-12 bg-brand-ink-deep px-6 py-9 text-center">
          <div aria-hidden="true" className="pointer-events-none absolute inset-0 opacity-[0.06]" style={{ backgroundImage: 'linear-gradient(to right, #3EE0A0 1px, transparent 1px), linear-gradient(to bottom, #3EE0A0 1px, transparent 1px)', backgroundSize: '56px 56px' }} />
          <div className="relative flex flex-col items-center gap-4">
            <div className="w-12 h-12 bg-white/10 border border-brand-line-12 rounded-xl flex items-center justify-center"><Compass className="w-6 h-6 text-brand-mint" /></div>
            <h1 className="font-manrope text-[28px] sm:text-[34px] font-extrabold text-white leading-[1.1] tracking-[-0.03em]">Your personalised Spoken English roadmap</h1>
            <p className="text-brand-on-ink text-[13.5px]">
              Current level <span className="font-bold text-brand-mint">{overallLabel}</span>
              {targetLevel && <> · next up <span className="font-bold text-brand-mint">{targetLevel}</span></>}
            </p>
            <div className="flex flex-wrap items-center justify-center gap-2">
              {rows.map((row) => (
                <span key={row.id} className="inline-flex items-center gap-1.5 text-[12px] font-semibold px-3 py-1.5 rounded-full border border-brand-line-25 bg-white/5 text-brand-on-ink">
                  {row.label} · <span className="tabular-nums text-brand-mint">{row.level.toUpperCase()}</span>
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Priority Focus */}
        {priorityFocus.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <span className="h-px w-6 shrink-0 bg-brand-teal-600" aria-hidden="true" />
              <p className="font-jetbrains text-[10px] uppercase tracking-[0.18em] text-brand-text-mute">Priority Focus</p>
            </div>
            <div className="grid sm:grid-cols-2 gap-3">
              {priorityFocus.map((row) => (
                <div key={row.id} className="border border-brand-warm/30 rounded-2xl p-5 bg-brand-warm-tint flex flex-col gap-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-manrope font-bold text-brand-ink text-[15px] tracking-[-0.01em]">{row.label}</p>
                      <p className="text-[12.5px] text-brand-text-mute">Current level: <span className={`font-semibold ${cefrColor(row.level)}`}>{row.level.toUpperCase()}</span></p>
                    </div>
                  </div>
                  <p className="text-[13px] text-brand-text-mute leading-[1.65]">{SUBSKILL_ACTION[row.id]}</p>
                  <button onClick={() => navigate(`/${examId}/dashboard`)} className="inline-flex items-center justify-center gap-1.5 py-2.5 bg-brand-teal-700 hover:bg-brand-teal-600 text-white font-semibold text-[13.5px] rounded-xl transition-colors active:scale-[0.99]">
                    Start Here <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Sub-skill cards */}
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <span className="h-px w-6 shrink-0 bg-brand-teal-600" aria-hidden="true" />
            <p className="font-jetbrains text-[10px] uppercase tracking-[0.18em] text-brand-text-mute">Sub-skill Plan</p>
          </div>
          <div className="grid sm:grid-cols-2 gap-3">
            {rows.map((row) => {
              const target = nextCefr(row.level);
              return (
                <div key={row.id} className="border border-brand-line rounded-2xl p-5 bg-white flex flex-col gap-3">
                  <div className="flex items-center justify-between gap-3">
                    <p className="font-manrope font-bold text-brand-ink text-[15px] tracking-[-0.01em]">{row.label}</p>
                    <p className="font-manrope text-[14px] font-extrabold text-brand-ink tabular-nums tracking-[-0.02em]">
                      <span className={cefrColor(row.level)}>{row.level.toUpperCase()}</span>
                      {target && <> <span className="text-brand-text-mute font-normal">→</span> {target}</>}
                    </p>
                  </div>
                  <div className="h-2 w-full overflow-hidden rounded-full bg-brand-line">
                    <div className={`h-full rounded-full ${cefrGaugeColor(row.level)}`} style={{ width: `${Math.min(100, Math.max(6, row.score))}%` }} />
                  </div>
                  <p className="text-[13px] text-brand-text-mute leading-[1.65]">{SUBSKILL_ACTION[row.id]}</p>
                  <button onClick={() => navigate(`/${examId}/dashboard`)} className="mt-auto inline-flex items-center justify-center gap-1.5 py-2.5 bg-transparent hover:bg-brand-bg text-brand-ink font-semibold text-[13.5px] rounded-xl border border-brand-line hover:border-brand-teal-300 transition-colors">
                    Start Practice <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              );
            })}
          </div>
        </div>

        {/* Timeline */}
        <div className="relative overflow-hidden rounded-2xl border border-brand-line-12 bg-brand-ink px-6 py-8 text-center">
          <div aria-hidden="true" className="pointer-events-none absolute inset-0 opacity-[0.06]" style={{ backgroundImage: 'linear-gradient(to right, #3EE0A0 1px, transparent 1px), linear-gradient(to bottom, #3EE0A0 1px, transparent 1px)', backgroundSize: '48px 48px' }} />
          <div className="relative flex flex-col items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/10 border border-brand-line-12 flex items-center justify-center"><Clock className="w-5 h-5 text-brand-mint" /></div>
            <p className="font-jetbrains text-brand-mint text-[10.5px] uppercase tracking-[0.18em]">Estimated Timeline to {targetLevel ?? "Mastery"}</p>
            <p className="font-manrope text-[40px] font-extrabold text-brand-mint tabular-nums leading-none tracking-[-0.03em]">
              {targetLevel ? `~${weeksToNext} weeks` : "You're there!"}
            </p>
            <p className="text-brand-on-ink text-[13.5px] max-w-sm mx-auto leading-[1.7]">
              Based on consistent daily drills and regular internal assessments moving you steadily up the CEFR ladder.
            </p>
          </div>
        </div>

        <button onClick={() => navigate(`/${examId}/dashboard`)} className="w-full py-4 bg-brand-teal-700 hover:bg-brand-teal-600 text-white font-semibold text-[15.5px] rounded-xl transition-colors active:scale-[0.99]">
          <span className="inline-flex items-center gap-2"><Flag className="w-4 h-4" /> Go to Dashboard →</span>
        </button>
      </div>
    </StudentLayout>
  );
}
