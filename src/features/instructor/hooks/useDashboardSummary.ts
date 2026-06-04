/**
 * useDashboardSummary
 *
 * Fetches GET /api/instructor/batches/:batchId/dashboard-summary and
 * manages loading / error state. Re-fetches automatically when batchId changes.
 *
 * Returns null data while loading so components can show skeletons.
 */

import { useState, useEffect, useCallback } from 'react';
import { callBackend } from '@/features/auth/services/authClient';
import type { DashboardSummary } from '../components/dashboard/types';

const BACKEND = import.meta.env.VITE_BACKEND_URL || 'http://localhost:4000';

interface UseDashboardSummaryResult {
  data:    DashboardSummary | null;
  loading: boolean;
  error:   string | null;
  refetch: () => void;
}

export function useDashboardSummary(batchId: string | null): UseDashboardSummaryResult {
  const [data,    setData]    = useState<DashboardSummary | null>(null);
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState<string | null>(null);

  const fetch = useCallback(async () => {
    if (!batchId) return;
    setLoading(true);
    setError(null);
    try {
      const res = await callBackend(`${BACKEND}/api/instructor/batches/${batchId}/dashboard-summary`);
      if (res?.success) {
        setData(res.data as DashboardSummary);
      } else {
        setError(res?.error ?? 'Failed to load dashboard data.');
      }
    } catch (e: any) {
      setError(e?.message ?? 'Network error.');
    } finally {
      setLoading(false);
    }
  }, [batchId]);

  useEffect(() => {
    setData(null);   // clear stale data when batch changes
    fetch();
  }, [fetch]);

  return { data, loading, error, refetch: fetch };
}
