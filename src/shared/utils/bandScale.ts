/**
 * Canonical IELTS band-scale constants — frontend twin of the backend
 * `lib/bandScale.ts`. The platform band domain is [4.0, 9.0].
 *
 * Use these for every band display: progress bars, gauges, chart axes,
 * level labels, and target pickers. A raw `/9` normalization renders a
 * visually wrong bar under the 4–9 domain.
 */

export const BAND_MIN = 4.0;
export const BAND_MAX = 9.0;
export const BAND_SPAN = BAND_MAX - BAND_MIN; // 5.0

/** Clamp a band into [4,9] (no rounding — display only). */
export function clampBand(band: number): number {
  if (!Number.isFinite(band)) return BAND_MIN;
  return Math.min(BAND_MAX, Math.max(BAND_MIN, band));
}

/** 0–100 fill percentage for a band on the [4,9] scale (bars, gauges, arcs). */
export function bandFillPct(band: number): number {
  return ((clampBand(band) - BAND_MIN) / BAND_SPAN) * 100;
}

/** 0–1 fill fraction for a band on the [4,9] scale. */
export function bandFillFrac(band: number): number {
  return (clampBand(band) - BAND_MIN) / BAND_SPAN;
}

/** A/B/C level from a band — even thirds of [4,9] (matches the backend). */
export function bandToLevel(band: number): 'A' | 'B' | 'C' {
  if (band < 5.5) return 'A';
  if (band < 7.0) return 'B';
  return 'C';
}

/** All valid band options in 0.5 steps: [4.0, 4.5, …, 9.0]. */
export const BAND_OPTIONS: number[] = Array.from(
  { length: Math.round(BAND_SPAN / 0.5) + 1 },
  (_, i) => Number((BAND_MIN + i * 0.5).toFixed(1))
);

// ─────────────────────────────────────────────────────────────────────────
// Exam-aware addition (Spoken English / CEFR). Everything above this line is
// the original IELTS-only [4,9] band-scale API and MUST stay untouched — the
// governing rule for this codebase is "never rewrite an IELTS path, branch
// instead". The helper below is additive: it lets a shared progress-bar /
// gauge stay exam-agnostic by normalizing either an IELTS band OR a CEFR
// label to the same 0-100 fill percentage, instead of every call site
// re-deriving its own CEFR math next to bandFillPct.
//
// Cross-feature import is intentional and matches the pattern already
// established for CEFR display (see src/features/student/config/cefrDisplay.tsx
// and .../utils/exam.ts) — this file re-uses those rather than inventing a
// parallel CEFR ladder here.
import { isSpokenEnglish } from '@/features/student/utils/exam';
import { cefrOrdinal, CEFR_ORDER } from '@/features/student/config/cefrDisplay';

/**
 * 0–100 fill percentage for either scale, keyed off examId. Pass `band` for
 * an IELTS value and/or `cefrLabel` for a CEFR value — only the one that
 * matches the exam is read. Falls back to 0 when the matching value is
 * missing (e.g. CEFR data not yet returned by the backend for this surface).
 */
export function examAwareFillPct(
  examId: string | null | undefined,
  value: { band?: number | null; cefrLabel?: string | null }
): number {
  if (isSpokenEnglish(examId)) {
    return (cefrOrdinal(value.cefrLabel ?? undefined) / (CEFR_ORDER.length - 1)) * 100;
  }
  return value.band != null ? bandFillPct(value.band) : 0;
}
