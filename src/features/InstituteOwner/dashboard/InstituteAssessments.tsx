// src/features/InstituteOwner/dashboard/InstituteAssessments.tsx
//
// Institute-wide assessment overview for the Owner.
//
// GET /api/institute-owner/assessment-overview was fully built and authorised
// for this role, and had ZERO frontend consumers — fetchAssessmentOverview() was
// defined in the service and imported by nothing. It is the only surface that
// answers institute-wide: who has never been diagnosed, what the baseline bands
// were, who has never sat a mock, and who is missing internal assessments.
// The instructor had the equivalent per-batch view all along.
//
// The three tables are the instructor's components, reused. They take a
// progressPathFor builder so the row action lands on the owner's progress route
// instead of the instructor's.

import { useCallback, useEffect, useState } from 'react';

import { InstituteOwnerSidebar } from '../components/InstitiuteOwnerSidebar';
import { InstituteOwnerTopbar } from '../components/InstituteOwnerTopbar';
import { cn } from '@/shared/utils';
import {
  fetchAssessmentOverview, fetchBatches,
  type AssessmentOverview, type BatchRow,
} from '../services/instituteOwnerService';
import { AssessmentInsights } from '@/shared/components/assessments/AssessmentInsights';

export default function InstituteAssessments() {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [batchFilter, setBatchFilter] = useState('');
  const [batches, setBatches] = useState<BatchRow[]>([]);
  const [data, setData] = useState<AssessmentOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Batch list is for the filter dropdown only — a failure here must not block
  // the overview itself, so it is loaded separately and its error swallowed.
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

  // The owner progress route is /students/:studentSlug/progress, but that page
  // resolves the student from location.state.studentId (which the shared tabs
  // already pass) and ignores the slug. The id is used as the slug so the URL is
  // still meaningful rather than a literal placeholder.
  const progressPathFor = useCallback(
    (userId: string) => `/institute-owner/students/${userId}/progress`,
    []
  );

  return (
    <div className="relative min-h-screen font-plex antialiased overflow-x-hidden bg-brand-bg text-brand-text">
      <InstituteOwnerSidebar
        activeTab="assessments"
        isCollapsed={isSidebarCollapsed}
        toggleCollapse={() => setIsSidebarCollapsed(c => !c)}
      />

      <div className={cn('relative z-10 transition-all duration-300', isSidebarCollapsed ? 'lg:pl-24' : 'lg:pl-72')}>
        <InstituteOwnerTopbar />

        <main className="px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-5 max-w-[90rem] mx-auto pb-16">
          <div>
            <h1 className="font-manrope text-2xl sm:text-3xl font-black tracking-tight">Assessments</h1>
            <p className="text-sm text-brand-text-mute mt-1">
              Diagnostic coverage, internal assessments and mock tests across the whole institute.
            </p>
          </div>

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
        </main>
      </div>
    </div>
  );
}
