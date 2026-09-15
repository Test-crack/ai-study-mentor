// Exam-agnostic score display primitives. Every dashboard (superadmin, owner, admin, instructor)
// renders scores through these instead of hardcoding IELTS band thresholds / 4-skill lists, so a
// new exam added to the backend config renders correctly with zero dashboard code changes.
//
// The core idea: normalize any score to 0–100% of its own exam's scale, then apply ONE universal
// colour ramp on that percentage. New exams need only their scale bounds (already in the config) —
// never new colour thresholds.

import { getPublicExamConfig, PublicScale } from "./examConfigStore";
import { cefrColor, cefrBg, cefrGaugeColor } from "@/features/student/config/cefrDisplay";

export interface ResolvedScale {
  kind: "numeric" | "ordinal";
  min: number; // numeric: config min (or report_floor as the display floor); ordinal: 0
  max: number; // numeric: config max; ordinal: levels.length - 1
  step: number; // numeric: config step; ordinal: 1
  levels?: string[];
  labels?: Record<string, string>;
  gradeBands?: { grade: string; min: number; max: number }[];
}

export interface ResolvedExam {
  examId: string;
  mode: "aggregate" | "per_component";
  scale: ResolvedScale | null; // null = per_component exam with no single overall score
  scoreLabel: string; // table column header: "Band" | "CEFR" | "Score" | "Result"
  headlineLabel: string; // hero label: "Overall band" | "CEFR level" | ...
  skills: { id: string; label: string }[]; // assessed components
  hasTarget: boolean;
  examLabel: string;
}

function decimals(step: number): number {
  if (!step || step >= 1) return 0;
  return Math.max(0, -Math.floor(Math.log10(step)));
}

function resolveScale(raw: PublicScale | undefined | null): ResolvedScale | null {
  if (!raw) return null;
  if (raw.kind === "ordinal") {
    const levels = raw.levels ?? [];
    return { kind: "ordinal", min: 0, max: Math.max(0, levels.length - 1), step: 1, levels, labels: raw.labels };
  }
  // numeric — use report_floor as the display/colour floor when present (IELTS reports on 4–9, not 0–9)
  const min = typeof raw.report_floor === "number" ? raw.report_floor : raw.min ?? 0;
  return { kind: "numeric", min, max: raw.max ?? 9, step: raw.step ?? 1, gradeBands: raw.grade_bands };
}

/** Resolve an exam's display shape from the cached public config (with sensible fallbacks). */
export function resolveExam(examId?: string | null): ResolvedExam {
  const cfg = getPublicExamConfig(examId);
  const id = cfg?.exam_id ?? examId ?? "ielts";
  const mode = (cfg?.overall?.mode ?? "aggregate") as "aggregate" | "per_component";
  const scaleId = cfg?.overall?.scale ?? null;
  const scale = resolveScale(scaleId ? cfg?.scales?.[scaleId] : null);
  const skills = (cfg?.components ?? []).filter((c) => c.assessed !== false).map((c) => ({ id: c.id, label: c.label }));
  const examLabel = cfg?.naming?.public_display_name ?? cfg?.naming?.short_code ?? id;

  let scoreLabel = "Score";
  let headlineLabel = "Overall score";
  if (mode === "per_component" || !scale) {
    scoreLabel = "Result";
    headlineLabel = "Result";
  } else if (scale.kind === "ordinal") {
    const isCefr = (scale.levels ?? []).includes("b1");
    scoreLabel = isCefr ? "CEFR" : "Level";
    headlineLabel = isCefr ? "CEFR level" : "Level";
  } else if (scaleId === "ielts_band") {
    scoreLabel = "Band";
    headlineLabel = "Overall band";
  }

  return {
    examId: id,
    mode,
    scale,
    scoreLabel,
    headlineLabel,
    skills,
    hasTarget: !!cfg?.target,
    examLabel,
  };
}

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));

/** Normalize a raw score to 0–100% of its exam's scale (the basis for all colour coding). */
export function scoreFillPct(examId: string | null | undefined, value: number | null | undefined): number {
  if (value == null || !Number.isFinite(value)) return 0;
  const { scale } = resolveExam(examId);
  if (!scale) return clamp((value / 9) * 100, 0, 100); // per_component fallback (best-effort colour only)
  const span = scale.max - scale.min;
  if (span <= 0) return 0;
  return clamp(((clamp(value, scale.min, scale.max) - scale.min) / span) * 100, 0, 100);
}

/**
 * Format a raw score for display. `subScores` is the competency-matrix sub_scores JSON, used to
 * prefer an already-computed label (SE stores cefrLabel; per_component exams store a grade).
 */
export function formatScore(
  examId: string | null | undefined,
  value: number | null | undefined,
  subScores?: Record<string, any> | null,
): string {
  const { scale, mode } = resolveExam(examId);
  if (mode === "per_component" || !scale) {
    return subScores?.overall_grade ?? subScores?.grade ?? subScores?.cefrLabel ?? "—";
  }
  if (scale.kind === "ordinal") {
    if (subScores?.cefrLabel) return String(subScores.cefrLabel);
    if (value == null || !Number.isFinite(value)) return "—";
    const idx = clamp(Math.round(value), 0, (scale.levels?.length ?? 1) - 1);
    const key = scale.levels?.[idx];
    return (key && scale.labels?.[key]) || key?.toUpperCase() || "—";
  }
  if (value == null || !Number.isFinite(value)) return "—";
  return value.toFixed(decimals(scale.step));
}

// Colour is dispatched PER SCALE so the two live exams keep their exact historical palettes
// (nothing stable shifts), while any new/unknown exam colours by a universal fill-% ramp derived
// from its own scale bounds — so a new exam still gets sensible colours with zero code here.
type Tone = "strong" | "good" | "developing" | "weak";
function toneFor(pct: number): Tone {
  if (pct >= 60) return "strong";
  if (pct >= 40) return "good";
  if (pct >= 20) return "developing";
  return "weak";
}
const RAMP_TEXT: Record<Tone, string> = { strong: "text-emerald-600", good: "text-brand-teal-600", developing: "text-amber-600", weak: "text-rose-600" };
const RAMP_BADGE: Record<Tone, string> = {
  strong: "bg-emerald-50 text-emerald-700 border-emerald-200",
  good: "bg-brand-teal-50 text-brand-teal-700 border-brand-teal-200",
  developing: "bg-amber-50 text-amber-700 border-amber-200",
  weak: "bg-rose-50 text-rose-700 border-rose-200",
};
const RAMP_GAUGE: Record<Tone, string> = { strong: "bg-emerald-500", good: "bg-brand-teal-500", developing: "bg-amber-500", weak: "bg-rose-500" };

// IELTS band tiers, verbatim from the owner/admin pills (>=7 / >=6 / >=5) — preserved exactly.
function ieltsTone(v: number): Tone {
  if (v >= 7) return "strong";
  if (v >= 6) return "good";
  if (v >= 5) return "developing";
  return "weak";
}
const IELTS_TEXT: Record<Tone, string> = { strong: "text-emerald-600", good: "text-sky-600", developing: "text-amber-600", weak: "text-rose-600" };
const IELTS_BADGE: Record<Tone, string> = {
  strong: "bg-emerald-50 text-emerald-700 border-emerald-200",
  good: "bg-sky-50 text-sky-700 border-sky-200",
  developing: "bg-amber-50 text-amber-700 border-amber-200",
  weak: "bg-rose-50 text-rose-700 border-rose-200",
};
const IELTS_GAUGE: Record<Tone, string> = { strong: "bg-emerald-500", good: "bg-sky-500", developing: "bg-amber-500", weak: "bg-rose-500" };

// Which palette a given exam+value uses. Ordinal (CEFR) → the existing cefrDisplay palette
// (Spoken English unchanged); IELTS band → its verbatim tiers; everything else → the universal ramp.
type Palette = "cefr" | "ielts" | "ramp";
function paletteOf(examId: string | null | undefined): Palette {
  const { scale } = resolveExam(examId);
  if (scale?.kind === "ordinal" && (scale.levels ?? []).includes("b1")) return "cefr";
  if (examId === "ielts") return "ielts";
  return "ramp";
}

export function scoreTextColor(examId: string | null | undefined, value: number | null | undefined): string {
  const p = paletteOf(examId);
  if (p === "cefr") return cefrColor(formatScore(examId, value));
  if (p === "ielts") return IELTS_TEXT[ieltsTone(Number(value ?? 0))];
  return RAMP_TEXT[toneFor(scoreFillPct(examId, value))];
}
export function scoreBadgeClass(examId: string | null | undefined, value: number | null | undefined): string {
  const p = paletteOf(examId);
  if (p === "cefr") return cefrBg(formatScore(examId, value)) + " " + cefrColor(formatScore(examId, value));
  if (p === "ielts") return IELTS_BADGE[ieltsTone(Number(value ?? 0))];
  return RAMP_BADGE[toneFor(scoreFillPct(examId, value))];
}
export function scoreGaugeColor(examId: string | null | undefined, value: number | null | undefined): string {
  const p = paletteOf(examId);
  if (p === "cefr") return cefrGaugeColor(formatScore(examId, value));
  if (p === "ielts") return IELTS_GAUGE[ieltsTone(Number(value ?? 0))];
  return RAMP_GAUGE[toneFor(scoreFillPct(examId, value))];
}

/** [min, max] for chart axes (recharts domain). Falls back to [0, 100] for per_component exams. */
export function scoreDomain(examId: string | null | undefined): [number, number] {
  const { scale } = resolveExam(examId);
  return scale ? [scale.min, scale.max] : [0, 100];
}

/** Axis/tooltip tick formatter — numeric passes through, ordinal maps index→label. */
export function scoreTick(examId: string | null | undefined, value: number): string {
  return formatScore(examId, value);
}

/** Assessed skills/components for an exam (config-driven; replaces hardcoded L/R/W/S arrays). */
export const skillsFor = (examId: string | null | undefined) => resolveExam(examId).skills;
