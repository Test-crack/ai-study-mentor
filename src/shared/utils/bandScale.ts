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
