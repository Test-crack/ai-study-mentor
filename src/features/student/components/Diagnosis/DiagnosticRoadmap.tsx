"use client";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Headphones, BookOpen, PenLine, Mic, ArrowRight, Flag, Clock, Compass } from "lucide-react";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { callBackend } from "@/features/auth/services/authClient";
import { getBackendUrl } from "@/shared/utils";
import { StudentLayout } from "@/features/student/components/StudentLayout";
import { resolveExam, formatScore } from "@/shared/exam/examScale";
import { useExamConfigReady } from "@/shared/exam/ExamConfigProvider";

// Per-skill presentation, keyed by the exam config's component id (lowercase).
// The assessed skills themselves come from the exam config (resolveExam), so an
// exam with a different skill set still renders — this only supplies the icon /
// practice route / colour for the skills we have art for.
interface SkillMeta {
  icon: React.ReactNode;
  route: string;
  color: string;
  bg: string;
  border: string;
}

const SKILL_META: Record<string, SkillMeta> = {
  listening: { icon: <Headphones className="w-5 h-5" />, route: "/student/listening", color: "text-brand-teal-700", bg: "bg-brand-teal-wash", border: "border-brand-teal-tint" },
  reading:   { icon: <BookOpen className="w-5 h-5" />,   route: "/student/reading",   color: "text-brand-blue-600", bg: "bg-brand-blue-tint", border: "border-brand-blue-200" },
  writing:   { icon: <PenLine className="w-5 h-5" />,    route: "/student/writing",   color: "text-brand-warm", bg: "bg-brand-warm-tint", border: "border-brand-warm/25" },
  speaking:  { icon: <Mic className="w-5 h-5" />,        route: "/student/speaking-assessment", color: "text-brand-ink", bg: "bg-brand-bg-alt", border: "border-brand-line" },
};
const DEFAULT_META: SkillMeta = { icon: <Compass className="w-5 h-5" />, route: "/student/dashboard", color: "text-brand-ink", bg: "bg-brand-bg-alt", border: "border-brand-line" };
const metaFor = (id: string): SkillMeta => SKILL_META[id.toLowerCase()] ?? DEFAULT_META;

// Ranked-by-weakness improvement actions per criterion, keyed by component id.
// Listening/Reading don't get per-criterion diagnostic sub-scores (only accuracy
// + question-type breakdown), so they use a fixed set of skill-level tips.
const CRITERION_ACTIONS: Record<string, Record<string, string>> = {
  writing: {
    taskResponseScore: "Practice structuring responses that directly address every part of the prompt.",
    coherenceScore: "Work on paragraphing and linking devices to improve the flow between ideas.",
    vocabularyScore: "Build topic-specific vocabulary and reduce repetition of common words.",
    grammarScore: "Focus on complex sentence structures and reducing grammatical errors.",
  },
  speaking: {
    fluencyScore: "Practice speaking at a natural pace without long pauses or hesitation.",
    vocabularyScore: "Expand your range of idiomatic expressions and topic-specific vocabulary.",
    grammarScore: "Practice using a wider range of grammatical structures accurately.",
    pronunciationScore: "Focus on word stress, intonation, and individual sound clarity.",
  },
};

const FALLBACK_ACTIONS: Record<string, string[]> = {
  listening: [
    "Practice identifying keywords before the audio starts playing.",
    "Work on note-taking speed for detail-heavy questions.",
    "Review your most commonly missed question type (MCQ vs. True/False/Not Given).",
  ],
  reading: [
    "Practice skimming for gist before reading passages in detail.",
    "Build a timing strategy so True/False/Not Given questions don't eat your clock.",
    "Expand academic vocabulary for unfamiliar passage topics.",
  ],
  writing: [
    "Practice structuring responses that directly address every part of the prompt.",
    "Work on paragraphing and linking devices to improve flow.",
    "Build topic-specific vocabulary and reduce repeated phrasing.",
  ],
  speaking: [
    "Practice speaking at a natural pace without long pauses.",
    "Expand your range of idiomatic expressions.",
    "Focus on word stress, intonation, and pronunciation clarity.",
  ],
};
const GENERIC_ACTIONS = [
  "Keep practising this skill through your daily drills.",
  "Review your weakest questions and redo them.",
  "Track your progress and revisit topics you find hardest.",
];

interface SkillRow {
  id: string;
  label: string;
  band: number | null;
  subScores: Record<string, any> | null;
}

function getImprovementActions(row: SkillRow): string[] {
  const criteria = CRITERION_ACTIONS[row.id.toLowerCase()];
  if (criteria && row.subScores) {
    const entries = Object.keys(criteria)
      .filter((key) => typeof row.subScores?.[key] === "number")
      .map((key) => [key, Number(row.subScores![key])] as const)
      .sort((a, b) => a[1] - b[1]);
    if (entries.length > 0) return entries.slice(0, 3).map(([key]) => criteria[key]);
  }
  return FALLBACK_ACTIONS[row.id.toLowerCase()] ?? GENERIC_ACTIONS;
}

// Static formula per spec — one scale-step improvement every 2 weeks. No
// historical-curve modeling for this version. `step` comes from the exam scale
// (IELTS = 0.5 band), so the estimate adapts to any numeric-scale exam.
function unitsToTarget(current: number | null, target: number, step: number): number | null {
  if (current === null) return null;
  const gap = target - current;
  if (gap <= 0) return 0;
  const s = step > 0 ? step : 0.5;
  return Math.ceil(gap / s) * 2;
}

export default function DiagnosticRoadmap() {
  const navigate = useNavigate();
  const { profile } = useAuth();
  // Wait for the exam config to hydrate before resolving — otherwise resolveExam falls back
  // to the IELTS interim config and an OET student briefly gets an IELTS-shaped roadmap.
  const cfgReady = useExamConfigReady();
  const exam = resolveExam(profile?.examId);
  // Target/timeline only make sense for a numeric-scale exam that actually has a
  // target (IELTS band). Ordinal exams (CEFR) or targetless exams skip that UI.
  const numericTarget = exam.hasTarget && exam.scale?.kind === "numeric";
  const scoreWord = exam.scoreLabel.toLowerCase(); // "band" for IELTS
  const step = exam.scale?.kind === "numeric" ? exam.scale.step : 0.5;
  const fmt = (v: number | null, ss?: Record<string, any> | null) => formatScore(profile?.examId, v, ss);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [rows, setRows] = useState<SkillRow[]>([]);
  const [targetBand, setTargetBand] = useState<number>(7.0);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const backendUrl = getBackendUrl();
        const res = await callBackend(`${backendUrl}/api/student/competency-scores`);
        if (cancelled) return;
        if (res?.success && Array.isArray(res.data)) {
          const t = Number(res.target_band) || Number(profile?.targetBand) || 7.0;
          setTargetBand(t);
          setRows(
            // Skills come from the exam config (assessed components), not a
            // hardcoded L/R/W/S list — so OET/other exams render their own set.
            exam.skills.map(({ id, label }) => {
              const record = res.data.find((m: any) => m.skill?.toUpperCase() === id.toUpperCase());
              return {
                id,
                label,
                band: record ? Number(record.band_score) || null : null,
                subScores: record?.sub_scores ?? null,
              };
            })
          );
        } else {
          setError(res?.error ?? "Couldn't load your diagnostic results.");
        }
      } catch (e: any) {
        if (!cancelled) setError(e?.message ?? "Network error.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
    // exam.skills identity is stable per exam; profile.examId drives it.
  }, [profile?.targetBand, profile?.examId]);

  if (loading || !cfgReady) {
    return (
      <StudentLayout activeTab="roadmap" mainClassName="flex-1 flex items-center justify-center p-4">
        <div className="flex flex-col items-center gap-4 text-center">
          <div className="w-12 h-12 rounded-full border-[3px] border-brand-bg-alt border-t-brand-teal-600 animate-spin" />
          <p className="font-jetbrains text-brand-text-mute text-[11px] uppercase tracking-[0.16em]">Building your roadmap…</p>
        </div>
      </StudentLayout>
    );
  }

  if (error) {
    return (
      <StudentLayout activeTab="roadmap" mainClassName="flex-1 flex items-center justify-center p-4">
        <div className="text-center space-y-4">
          <p className="text-brand-text font-medium text-[15px] leading-[1.7]">{error}</p>
          <button
            onClick={() => navigate("/student/dashboard")}
            className="px-5 py-2.5 bg-brand-teal-700 hover:bg-brand-teal-600 text-white font-semibold text-[14.5px] rounded-xl transition-colors duration-150"
          >
            Go to Dashboard
          </button>
        </div>
      </StudentLayout>
    );
  }

  const attempted = rows.filter((r) => r.band !== null);
  const priorityFocus = [...attempted].sort((a, b) => (a.band as number) - (b.band as number)).slice(0, 2);
  const overallUnits = numericTarget && attempted.length > 0
    ? Math.max(...attempted.map((r) => unitsToTarget(r.band, targetBand, step) ?? 0))
    : null;

  return (
    <StudentLayout activeTab="roadmap">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 space-y-8">
        {/* Header — dark intro panel with faint blueprint grid */}
        <div className="relative overflow-hidden rounded-2xl border border-brand-line-12 bg-brand-ink-deep px-6 py-9 text-center">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 opacity-[0.06]"
            style={{
              backgroundImage:
                'linear-gradient(to right, #3EE0A0 1px, transparent 1px), linear-gradient(to bottom, #3EE0A0 1px, transparent 1px)',
              backgroundSize: '56px 56px',
            }}
          />
          <div className="relative flex flex-col items-center gap-4">
            <div className="w-12 h-12 bg-white/10 border border-brand-line-12 rounded-xl flex items-center justify-center">
              <Compass className="w-6 h-6 text-brand-mint" />
            </div>
            <h1 className="font-manrope text-[28px] sm:text-[34px] font-extrabold text-white leading-[1.1] tracking-[-0.03em]">
              Your personalised {exam.examLabel} roadmap
            </h1>
            <div className="flex flex-wrap items-center justify-center gap-2">
              {rows.map((row) => (
                <span
                  key={row.id}
                  className="inline-flex items-center gap-1.5 text-[12px] font-semibold px-3 py-1.5 rounded-full border border-brand-line-25 bg-white/5 text-brand-on-ink"
                >
                  {row.label} · <span className="tabular-nums text-brand-mint">{fmt(row.band, row.subScores)}</span>
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
              {priorityFocus.map((row) => {
                const meta = metaFor(row.id);
                return (
                  <div
                    key={row.id}
                    className="border border-brand-warm/30 rounded-2xl p-5 bg-brand-warm-tint flex flex-col gap-4"
                  >
                    <div className="flex items-center gap-3">
                      <span className={`w-10 h-10 rounded-xl flex items-center justify-center border ${meta.border} ${meta.bg} ${meta.color}`}>
                        {meta.icon}
                      </span>
                      <div>
                        <p className="font-manrope font-bold text-brand-ink text-[15px] tracking-[-0.01em]">{row.label}</p>
                        <p className="text-[12.5px] text-brand-text-mute">Current {scoreWord}: <span className="tabular-nums font-semibold text-brand-text">{fmt(row.band, row.subScores)}</span></p>
                      </div>
                    </div>
                    <button
                      onClick={() => navigate(meta.route)}
                      className="inline-flex items-center justify-center gap-1.5 py-2.5 bg-brand-teal-700 hover:bg-brand-teal-600 text-white font-semibold text-[13.5px] rounded-xl transition-colors duration-150 active:scale-[0.99]"
                    >
                      Start Here <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Skill Cards */}
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <span className="h-px w-6 shrink-0 bg-brand-teal-600" aria-hidden="true" />
            <p className="font-jetbrains text-[10px] uppercase tracking-[0.18em] text-brand-text-mute">Skill-by-Skill Plan</p>
          </div>
          <div className="grid sm:grid-cols-2 gap-3">
            {rows.map((row) => {
              const meta = metaFor(row.id);
              const gap = numericTarget && row.band !== null ? Math.max(0, targetBand - row.band) : null;
              const actions = getImprovementActions(row);
              return (
                <div key={row.id} className="border border-brand-line rounded-2xl p-5 bg-white flex flex-col gap-4">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <span className={`w-9 h-9 rounded-xl flex items-center justify-center border ${meta.border} ${meta.bg} ${meta.color}`}>
                        {meta.icon}
                      </span>
                      <p className="font-manrope font-bold text-brand-ink text-[15px] tracking-[-0.01em]">{row.label}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-manrope text-[15px] font-extrabold text-brand-ink tabular-nums tracking-[-0.02em]">
                        {fmt(row.band, row.subScores)}{numericTarget && <> <span className="text-brand-text-mute font-normal">→</span> {fmt(targetBand)}</>}
                      </p>
                      {gap !== null && (
                        <p className="font-jetbrains text-[10px] text-brand-text-mute uppercase tracking-[0.14em]">
                          {gap > 0 ? `Gap: ${fmt(gap)}` : "Target reached"}
                        </p>
                      )}
                    </div>
                  </div>
                  <ul className="space-y-2">
                    {actions.map((action, i) => (
                      <li key={i} className="text-[13px] text-brand-text-mute flex gap-2 leading-[1.65]">
                        <span className="font-jetbrains text-brand-teal-600 font-bold">{i + 1}.</span>
                        <span>{action}</span>
                      </li>
                    ))}
                  </ul>
                  <button
                    onClick={() => navigate(meta.route)}
                    className="mt-auto inline-flex items-center justify-center gap-1.5 py-2.5 bg-transparent hover:bg-brand-bg text-brand-ink font-semibold text-[13.5px] rounded-xl border border-brand-line hover:border-brand-teal-300 transition-colors duration-150"
                  >
                    Start Practice <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              );
            })}
          </div>
        </div>

        {/* Estimated Timeline — only for exams with a numeric band target */}
        {numericTarget && (
          <div className="relative overflow-hidden rounded-2xl border border-brand-line-12 bg-brand-ink px-6 py-8 text-center">
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-0 opacity-[0.06]"
              style={{
                backgroundImage:
                  'linear-gradient(to right, #3EE0A0 1px, transparent 1px), linear-gradient(to bottom, #3EE0A0 1px, transparent 1px)',
                backgroundSize: '48px 48px',
              }}
            />
            <div className="relative flex flex-col items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-white/10 border border-brand-line-12 flex items-center justify-center">
                <Clock className="w-5 h-5 text-brand-mint" />
              </div>
              <p className="font-jetbrains text-brand-mint text-[10.5px] uppercase tracking-[0.18em]">Estimated Timeline to Target</p>
              <p className="font-manrope text-[40px] font-extrabold text-brand-mint tabular-nums leading-none tracking-[-0.03em]">
                {overallUnits === null ? "—" : overallUnits === 0 ? "You're there!" : `~${overallUnits} weeks`}
              </p>
              <p className="text-brand-on-ink text-[13.5px] max-w-sm mx-auto leading-[1.7]">
                Based on consistent practice at roughly {fmt(step)} {scoreWord} improvement every 2 weeks, across your weakest skill.
              </p>
            </div>
          </div>
        )}

        <button
          onClick={() => navigate("/student/dashboard")}
          className="w-full py-4 bg-brand-teal-700 hover:bg-brand-teal-600 text-white font-semibold text-[15.5px] rounded-xl transition-colors duration-150 active:scale-[0.99]"
        >
          <span className="inline-flex items-center gap-2"><Flag className="w-4 h-4" /> Go to Dashboard →</span>
        </button>
      </div>
    </StudentLayout>
  );
}
