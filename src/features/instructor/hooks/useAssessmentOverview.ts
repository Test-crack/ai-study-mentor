import { useState, useEffect, useCallback } from 'react';
import { callBackend } from '@/features/auth/services/authClient';
import type { AssessmentOverview } from '../components/assessments/types';

const BACKEND = import.meta.env.VITE_BACKEND_URL || 'http://localhost:4000';

interface UseAssessmentOverviewResult {
  data:    AssessmentOverview | null;
  loading: boolean;
  error:   string | null;
  refetch: () => void;
}

export function useAssessmentOverview(batchId: string | null): UseAssessmentOverviewResult {
  const [data,    setData]    = useState<AssessmentOverview | null>(null);
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState<string | null>(null);

  const fetch = useCallback(async () => {
    if (!batchId) return;
    setLoading(true);
    setError(null);
    try {
      const res = await callBackend(
        `${BACKEND}/api/instructor/batches/${batchId}/assessment-overview`
      );
      if (res?.success) {
        setData(res.data as AssessmentOverview);
      } else {
        setError(res?.error ?? 'Failed to load assessment data.');
      }
    } catch (e: any) {
      setError(e?.message ?? 'Network error.');
    } finally {
      setLoading(false);
    }
  }, [batchId]);

  useEffect(() => {
    setData(null);
    fetch();
  }, [fetch]);

  return { data, loading, error, refetch: fetch };
}
