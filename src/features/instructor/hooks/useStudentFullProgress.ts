import { useState, useEffect, useCallback } from 'react';
import { callBackend } from '@/features/auth/services/authClient';
import type { StudentFullProgress } from '../components/student-progress/types';

const BACKEND = import.meta.env.VITE_BACKEND_URL || 'http://localhost:4000';

interface UseStudentFullProgressResult {
  data:    StudentFullProgress | null;
  loading: boolean;
  error:   string | null;
  refetch: () => void;
}

export function useStudentFullProgress(
  batchId:   string | null,
  studentId: string | null,
): UseStudentFullProgressResult {
  const [data,    setData]    = useState<StudentFullProgress | null>(null);
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState<string | null>(null);

  const fetch = useCallback(async () => {
    if (!batchId || !studentId) return;
    setLoading(true);
    setError(null);
    try {
      const res = await callBackend(
        `${BACKEND}/api/instructor/batches/${batchId}/students/${studentId}/full-progress`
      );
      if (res?.success) {
        setData(res.data as StudentFullProgress);
      } else {
        setError(res?.error ?? 'Failed to load student data.');
      }
    } catch (e: any) {
      setError(e?.message ?? 'Network error.');
    } finally {
      setLoading(false);
    }
  }, [batchId, studentId]);

  useEffect(() => {
    setData(null);
    fetch();
  }, [fetch]);

  return { data, loading, error, refetch: fetch };
}
