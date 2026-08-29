// src/features/Institute/dashboard/InstituteAssessments.tsx
//
// Institute-wide assessment overview for the Admin — same shared handler
// (GET /api/institute-admin/assessment-overview) and the same AssessmentInsights
// shell the Owner portal uses; only the layout chrome and the student-progress
// route differ.
import { useCallback, useEffect, useState } from 'react';
import { InstituteAdminLayout } from '../components/InstituteAdminLayout';
import { PageHero } from '../components/shared/primitives';
import { fetchAssessmentOverview } from '../services/instituteAdminService';
import { fetchBatches, type BatchSummary } from '../services/batchService';
import type { AssessmentOverview } from '@/features/InstituteOwner/services/instituteOwnerService';
import { AssessmentInsights } from '@/shared/components/assessments/AssessmentInsights';

export default function InstituteAssessments() {
  const [batchFilter, setBatchFilter] = useState('');
  const [batches, setBatches] = useState<BatchSummary[]>([]);
  const [data, setData] = useState<AssessmentOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchBatches()
      .then(res => setBatches(res.data ?? []))
      .catch(() => setBatches([]));
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetchAssessmentOverview(batchFilter ? { batch_id: batchFilter } : undefined);
      if (res?.success) setData(res.data);
      else setError('Failed to load the assessment overview.');
    } catch (e: any) {
      setError(e?.message ?? 'Network error.');
    } finally {
      setLoading(false);
    }
  }, [batchFilter]);

  useEffect(() => { load(); }, [load]);

  const progressPathFor = useCallback(
    (userId: string) => `/institute-admin/students/${userId}/progress`,
    []
  );

  return (
    <InstituteAdminLayout activeTab="assessments">
      <PageHero
        eyebrow="Admin Portal"
        title="Assessments"
        subtitle="Diagnostic coverage, internal assessments and mock tests across the whole institute."
      />

      <AssessmentInsights
        data={data}
        loading={loading}
        error={error}
        batches={batches}
        batchFilter={batchFilter}
        onBatchChange={setBatchFilter}
        onRefresh={load}
        progressPathFor={progressPathFor}
      />
    </InstituteAdminLayout>
  );
}
