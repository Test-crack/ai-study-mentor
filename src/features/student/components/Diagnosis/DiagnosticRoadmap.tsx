"use client";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Headphones, BookOpen, PenLine, Mic, ArrowRight, Flag, Clock, Compass } from "lucide-react";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { callBackend } from "@/features/auth/services/authClient";
import { getBackendUrl } from "@/shared/utils";
import { StudentLayout } from "@/features/student/components/StudentLayout";

type Skill = "Listening" | "Reading" | "Writing" | "Speaking";

interface SkillMeta {
  skill: Skill;
  icon: React.ReactNode;
  route: string;
  color: string;
  bg: string;
  border: string;
}

const SKILL_META: SkillMeta[] = [
  { skill: "Listening", icon: <Headphones className="w-5 h-5" />, route: "/student/listening", color: "text-brand-teal-700", bg: "bg-brand-teal-wash", border: "border-brand-teal-tint" },
  { skill: "Reading",   icon: <BookOpen className="w-5 h-5" />,   route: "/student/reading",   color: "text-brand-blue-600", bg: "bg-brand-blue-tint", border: "border-brand-blue-200" },
  { skill: "Writing",   icon: <PenLine className="w-5 h-5" />,    route: "/student/writing",   color: "text-brand-warm", bg: "bg-brand-warm-tint", border: "border-brand-warm/25" },
  { skill: "Speaking",  icon: <Mic className="w-5 h-5" />,        route: "/student/speaking-assessment", color: "text-brand-ink", bg: "bg-brand-bg-alt", border: "border-brand-line" },
];

// Ranked-by-weakness improvement actions per criterion. Listening/Reading don't get
// per-criterion diagnostic sub-scores (only accuracy + question-type breakdown), so
// they use a fixed set of skill-level tips instead of a ranked pick.
const CRITERION_ACTIONS: Record<string, Record<string, string>> = {
  Writing: {
    taskResponseScore: "Practice structuring responses that directly address every part of the prompt.",
    coherenceScore: "Work on paragraphing and linking devices to improve the flow between ideas.",
    vocabularyScore: "Build topic-specific vocabulary and reduce repetition of common words.",
    grammarScore: "Focus on complex sentence structures and reducing grammatical errors.",
  },
  Speaking: {
    fluencyScore: "Practice speaking at a natural pace without long pauses or hesitation.",
    vocabularyScore: "Expand your range of idiomatic expressions and topic-specific vocabulary.",
    grammarScore: "Practice using a wider range of grammatical structures accurately.",
    pronunciationScore: "Focus on word stress, intonation, and individual sound clarity.",
  },
};

const FALLBACK_ACTIONS: Record<Skill, string[]> = {
  Listening: [
    "Practice identifying keywords before the audio starts playing.",
    "Work on note-taking speed for detail-heavy questions.",
    "Review your most commonly missed question type (MCQ vs. True/False/Not Given).",
  ],
  Reading: [
    "Practice skimming for gist before reading passages in detail.",
    "Build a timing strategy so True/False/Not Given questions don't eat your clock.",
    "Expand academic vocabulary for unfamiliar passage topics.",
  ],
  Writing: [
    "Practice structuring responses that directly address every part of the prompt.",
    "Work on paragraphing and linking devices to improve flow.",
    "Build topic-specific vocabulary and reduce repeated phrasing.",
  ],
  Speaking: [
    "Practice speaking at a natural pace without long pauses.",
    "Expand your range of idiomatic expressions.",
    "Focus on word stress, intonation, and pronunciation clarity.",
  ],
};

interface SkillRow {
  skill: Skill;
  band: number | null;
  subScores: Record<string, any> | null;
}

function getImprovementActions(row: SkillRow): string[] {
  const criteria = CRITERION_ACTIONS[row.skill];
  if (!criteria || !row.subScores) return FALLBACK_ACTIONS[row.skill];

  const entries = Object.keys(criteria)
    .filter((key) => typeof row.subScores?.[key] === "number")
    .map((key) => [key, Number(row.subScores![key])] as const)
    .sort((a, b) => a[1] - b[1]);

  if (entries.length === 0) return FALLBACK_ACTIONS[row.skill];
  return entries.slice(0, 3).map(([key]) => criteria[key]);
}

// Static formula per spec — 2 weeks per 0.5 band improvement. No historical-curve
// modeling for this version.
function weeksToTarget(current: number | null, target: number): number | null {
  if (current === null) return null;
  const gap = target - current;
  if (gap <= 0) return 0;
  return Math.ceil((gap / 0.5)) * 2;
}

export default function DiagnosticRoadmap() {
  const navigate = useNavigate();
  const { profile } = useAuth();
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
            SKILL_META.map(({ skill }) => {
              const record = res.data.find((m: any) => m.skill?.toUpperCase() === skill.toUpperCase());
              return {
                skill,
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
  }, [profile?.targetBand]);

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
  const overallWeeks = attempted.length > 0
    ? Math.max(...attempted.map((r) => weeksToTarget(r.band, targetBand) ?? 0))
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
                'linear-gradient(to right, #2EE8A6 1px, transparent 1px), linear-gradient(to bottom, #2EE8A6 1px, transparent 1px)',
              backgroundSize: '56px 56px',
            }}
          />
          <div className="relative flex flex-col items-center gap-4">
            <div className="w-12 h-12 bg-white/10 border border-brand-line-12 rounded-xl flex items-center justify-center">
              <Compass className="w-6 h-6 text-brand-mint" />
            </div>
            <h1 className="font-manrope text-[28px] sm:text-[34px] font-extrabold text-white leading-[1.1] tracking-[-0.03em]">
              Your personalised IELTS roadmap
            </h1>
            <div className="flex flex-wrap items-center justify-center gap-2">
              {rows.map((row) => (
                <span
                  key={row.skill}
                  className="inline-flex items-center gap-1.5 text-[12px] font-semibold px-3 py-1.5 rounded-full border border-brand-line-25 bg-white/5 text-brand-on-ink"
                >
                  {row.skill} · <span className="tabular-nums text-brand-mint">{row.band !== null ? row.band.toFixed(1) : "—"}</span>
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
                const meta = SKILL_META.find((m) => m.skill === row.skill)!;
                return (
                  <div
                    key={row.skill}
                    className="border border-brand-warm/30 rounded-2xl p-5 bg-brand-warm-tint flex flex-col gap-4"
                  >
                    <div className="flex items-center gap-3">
                      <span className={`w-10 h-10 rounded-xl flex items-center justify-center border ${meta.border} ${meta.bg} ${meta.color}`}>
                        {meta.icon}
                      </span>
                      <div>
                        <p className="font-manrope font-bold text-brand-ink text-[15px] tracking-[-0.01em]">{row.skill}</p>
                        <p className="text-[12.5px] text-brand-text-mute">Current band: <span className="tabular-nums font-semibold text-brand-text">{row.band?.toFixed(1)}</span></p>
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
              const meta = SKILL_META.find((m) => m.skill === row.skill)!;
              const gap = row.band !== null ? Math.max(0, targetBand - row.band) : null;
              const actions = getImprovementActions(row);
              return (
                <div key={row.skill} className="border border-brand-line rounded-2xl p-5 bg-white flex flex-col gap-4">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <span className={`w-9 h-9 rounded-xl flex items-center justify-center border ${meta.border} ${meta.bg} ${meta.color}`}>
                        {meta.icon}
                      </span>
                      <p className="font-manrope font-bold text-brand-ink text-[15px] tracking-[-0.01em]">{row.skill}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-manrope text-[15px] font-extrabold text-brand-ink tabular-nums tracking-[-0.02em]">
                        {row.band !== null ? row.band.toFixed(1) : "—"} <span className="text-brand-text-mute font-normal">→</span> {targetBand.toFixed(1)}
                      </p>
                      {gap !== null && (
                        <p className="font-jetbrains text-[10px] text-brand-text-mute uppercase tracking-[0.14em]">
                          {gap > 0 ? `Gap: ${gap.toFixed(1)}` : "Target reached"}
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

        {/* Estimated Timeline */}
        <div className="relative overflow-hidden rounded-2xl border border-brand-line-12 bg-brand-ink px-6 py-8 text-center">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 opacity-[0.06]"
            style={{
              backgroundImage:
                'linear-gradient(to right, #2EE8A6 1px, transparent 1px), linear-gradient(to bottom, #2EE8A6 1px, transparent 1px)',
              backgroundSize: '48px 48px',
            }}
          />
          <div className="relative flex flex-col items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/10 border border-brand-line-12 flex items-center justify-center">
              <Clock className="w-5 h-5 text-brand-mint" />
            </div>
            <p className="font-jetbrains text-brand-mint text-[10.5px] uppercase tracking-[0.18em]">Estimated Timeline to Target</p>
            <p className="font-manrope text-[40px] font-extrabold text-brand-mint tabular-nums leading-none tracking-[-0.03em]">
              {overallWeeks === null ? "—" : overallWeeks === 0 ? "You're there!" : `~${overallWeeks} weeks`}
            </p>
            <p className="text-brand-on-ink text-[13.5px] max-w-sm mx-auto leading-[1.7]">
              Based on consistent practice at roughly 0.5 band improvement every 2 weeks, across your weakest skill.
            </p>
          </div>
        </div>

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
