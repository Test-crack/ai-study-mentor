// src/features/student/hooks/useCompetencyScores.ts
//
// GET /api/student/competency-scores — current band per skill, plus the
// student's target band and exam date.
//
// This endpoint was already fetched inline in at least five components
// (dashboard, profile, drill screen, diagnostic roadmap). This hook exists so
// the Reports page does not add a sixth copy of the same request handling.

import { useState, useEffect } from 'react';
import { callBackend } from '@/features/auth/services/authClient';

const BACKEND = import.meta.env.VITE_BACKEND_URL || 'http://localhost:4000';

export interface CompetencyScore {
  skill: string;
  /** Arrives as a string from the API in some responses — coerce at the edge. */
  band_score: number | string | null;
  sub_scores?: Record<string, unknown> | null;
}

export function useCompetencyScores() {
  const [scores, setScores] = useState<CompetencyScore[]>([]);
  const [targetBand, setTargetBand] = useState<number>(7.0);
  const [examDate, setExamDate] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await callBackend(`${BACKEND}/api/student/competency-scores`);
        if (cancelled) return;
        if (res.success && Array.isArray(res.data)) {
          setScores(res.data);
          const t = Number(res.target_band);
          if (!isNaN(t) && t > 0) setTargetBand(t);
          // Dual casing, matching the dashboard — the contract is unconfirmed.
          const rawExam = res.exam_date ?? res.examDate ?? null;
          const d = rawExam ? new Date(rawExam) : null;
          setExamDate(d && !isNaN(d.getTime()) ? d.toISOString() : null);
        }
      } catch (err) {
        console.error('[CompetencyScores] Fetch failed:', err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  return { scores, targetBand, examDate, loading };
}
