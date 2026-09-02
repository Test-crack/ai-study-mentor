// src/features/student/utils/diagnosticBaseline.ts
//
// Pure derivations over /api/student/diagnostic-report. Kept apart from the
// hook so they can be tested without pulling in the auth client (and with it a
// live Supabase session timer).

export interface DiagnosticEntry {
  id: string;
  skill: string;
  band_score: number;
  sub_scores: Record<string, unknown> | null;
  created_at: string;
}

/**
 * Baseline band per skill, keyed upper-case so callers can match regardless of
 * the casing the two endpoints happen to use.
 *
 * The controller already returns only the oldest entry per skill. The
 * oldest-wins tie-break here is defensive, not a second implementation of it.
 */
export function baselineBySkill(entries: DiagnosticEntry[]): Record<string, number> {
  const out: Record<string, number> = {};
  const seenAt: Record<string, number> = {};
  for (const e of entries) {
    if (!e?.skill || e.band_score == null) continue;
    const key = e.skill.toUpperCase();
    const t = new Date(e.created_at).getTime();
    if (!(key in out) || t < seenAt[key]) {
      out[key] = Number(e.band_score);
      seenAt[key] = isNaN(t) ? Infinity : t;
    }
  }
  return out;
}
