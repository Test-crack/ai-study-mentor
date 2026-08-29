// src/features/student/hooks/useMockHistory.ts
//
// GET /api/student/mock-history — student-authorised (studentRoutes.ts:65).
// Already consumed by AssessmentHistoryPage; the dashboard needs the
// `real_band_score` series to derive the student's observed improvement pace.

import { useState, useEffect } from 'react';
import { callBackend } from '@/features/auth/services/authClient';

const BACKEND = import.meta.env.VITE_BACKEND_URL || 'http://localhost:4000';

export interface MockHistoryEntry {
  id: string;
  month_year: string;
  attempt_type: string;
  time_submitted_at: string | null;
  /** Overall band for the sitting. Null until the mock is scored. */
  real_band_score: number | null;
  /** Per-skill bands for the sitting. */
  scores?: { band: number; skill: string }[];
}

export function useMockHistory() {
  const [entries, setEntries] = useState<MockHistoryEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await callBackend(`${BACKEND}/api/student/mock-history`);
        if (cancelled) return;
        if (res.success && Array.isArray(res.data)) setEntries(res.data);
      } catch (err) {
        console.error('[MockHistory] Fetch failed:', err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  return { entries, loading };
}

/**
 * Dated band points for pace derivation.
 *
 * Uses `real_band_score` only — the sitting's overall band. IA section scores
 * are deliberately NOT averaged into this series: averaging one IA's sections
 * produces a number that is not a band (a Speaking-only IA scoring 0.5 would
 * enter as a 0.5 "band"), which is exactly the confusion DATA_AUDIT §11
 * documented on the assessment-history page.
 */
export function bandPointsFromMocks(
  entries: MockHistoryEntry[]
): { date: string; band: number }[] {
  return entries
    .filter((e) => e.real_band_score != null)
    .map((e) => ({
      date: e.time_submitted_at ?? `${e.month_year}-01`,
      band: Number(e.real_band_score),
    }))
    .filter((p) => !isNaN(p.band) && !isNaN(new Date(p.date).getTime()));
}
