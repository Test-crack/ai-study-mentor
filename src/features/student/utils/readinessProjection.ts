// src/features/student/utils/readinessProjection.ts
//
// Band projection maths for Predicted Readiness.
//
// Before this, pace was BASE_PACE_PER_WEEK = 0.125 for every student on the
// platform, so two students at the same band with the same exam date received
// identical projections regardless of whether one had completed 30 assessments
// and the other had missed 26. The pace is now the student's own observed slope
// where there is enough history to compute one.
//
// The projection is deliberately floored — see resolvePace and projectBand.

/** Fallback pace when a student has too little history: ≈0.5 band / 4 weeks. */
export const BASE_PACE_PER_WEEK = 0.125;

/**
 * Which pace to project with.
 *
 * Observed pace is used when available, but **floored at zero**. A negative
 * slope is real information and it is surfaced honestly elsewhere (the trend
 * chip, the growth deltas, the catch-up banner) — but projecting a *decline* is
 * a different claim, and a weak one: bands rarely decay while a student keeps
 * practising, so a negative extrapolation is more likely noise from one bad
 * sitting than a forecast. Flat is the honest floor.
 *
 * `null` observed pace means "not enough data to claim a slope", which is not
 * the same as "no progress" — that falls back to the assumed constant.
 */
export function resolvePace(
  observedPacePerWeek: number | null,
  consistencyFactor: number
): { pace: number; source: 'observed' | 'assumed' } {
  if (observedPacePerWeek == null) {
    return { pace: BASE_PACE_PER_WEEK * consistencyFactor, source: 'assumed' };
  }
  // Consistency is already baked into an observed slope — a student who misses
  // sessions has a flatter real slope — so applying the factor again would
  // double-count the same penalty.
  return { pace: Math.max(0, observedPacePerWeek), source: 'observed' };
}

/**
 * Projected band at the exam date.
 *
 * Two floors, both deliberate:
 *  - never below `current`. A projection under where the student already is
 *    reads as a punishment rather than a forecast, and it is almost certainly
 *    wrong. Honesty lives in "you are not gaining", not in a manufactured drop.
 *  - never above 9.0, the top of the IELTS scale.
 */
export function projectBand(
  current: number,
  pacePerWeek: number,
  weeksLeft: number
): number {
  if (!isFinite(current)) return 0;
  const raw = current + pacePerWeek * Math.max(0, weeksLeft);
  return Math.min(9.0, Math.max(current, raw));
}

/** Half-band rounding for display. The raw value drives gap comparisons. */
export function toDisplayBand(raw: number): number {
  return Math.round(raw * 2) / 2;
}
