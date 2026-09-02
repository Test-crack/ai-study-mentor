// src/features/student/hooks/useIAHistory.ts
//
// GET /api/student/ia-history — student-authorised (studentRoutes.ts:62).
// Already consumed by AssessmentHistoryPage; this hook makes the same feed
// available to the dashboard without duplicating the fetch.

import { useState, useEffect } from "react";
import { callBackend } from "@/features/auth/services/authClient";
import type { IAHistoryEntry } from "@/features/student/utils/iaAttendance";

const BACKEND = import.meta.env.VITE_BACKEND_URL || "http://localhost:4000";

export function useIAHistory() {
  const [history, setHistory] = useState<IAHistoryEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await callBackend(`${BACKEND}/api/student/ia-history`);
        if (cancelled) return;
        if (res.success && Array.isArray(res.data)) setHistory(res.data);
        else setError(true);
      } catch (err) {
        console.error("[IAHistory] Fetch failed:", err);
        if (!cancelled) setError(true);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  return { history, loading, error };
}
