// src/features/student/hooks/useDiagnosticBaseline.ts
//
// GET /api/student/diagnostic-report — student-authorised (studentRoutes.ts:68).
//
// The controller already keeps only the first (oldest) entry per skill, i.e. the
// initial diagnostic baseline, so no client-side "which one was first" logic is
// needed. AssessmentHistoryPage uses this feed for its history tab; the dashboard
// needs the same numbers to fill the `delta` field on the skill cards, which has
// been present but hard-set to 0 since it was introduced.

import { useState, useEffect } from "react";
import { callBackend } from "@/features/auth/services/authClient";
import type { DiagnosticEntry } from "@/features/student/utils/diagnosticBaseline";

const BACKEND = import.meta.env.VITE_BACKEND_URL || "http://localhost:4000";

export function useDiagnosticBaseline() {
  const [entries, setEntries] = useState<DiagnosticEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await callBackend(`${BACKEND}/api/student/diagnostic-report`);
        if (cancelled) return;
        if (res.success && Array.isArray(res.data)) setEntries(res.data);
      } catch (err) {
        console.error("[DiagnosticBaseline] Fetch failed:", err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  return { entries, loading };
}
