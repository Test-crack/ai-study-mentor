import { useState, useEffect } from 'react';
import { callBackend } from '@/features/auth/services/authClient';
import type { InstructorBatch } from '../components/dashboard/types';

const BACKEND = import.meta.env.VITE_BACKEND_URL || 'http://localhost:4000';

interface UseInstructorBatchesResult {
  batches: InstructorBatch[];
  loading: boolean;
}

export function useInstructorBatches(): UseInstructorBatchesResult {
  const [batches, setBatches] = useState<InstructorBatch[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    callBackend(`${BACKEND}/api/instructor/batches`)
      .then(res => {
        if (cancelled) return;
        const raw: any[] = res?.data ?? [];
        const mapped: InstructorBatch[] = raw
          .filter(b => b.status === 'ACTIVE')
          .map(b => ({
            id:              b.id,
            name:            b.name,
            status:          b.status,
            studentCount:    b.studentCount ?? 0,
            instructorCount: b.instructorCount ?? 0,
          }));
        setBatches(mapped);
      })
      .catch(console.error)
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, []);

  return { batches, loading };
}
