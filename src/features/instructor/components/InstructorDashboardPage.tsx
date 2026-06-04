import { useState, useEffect } from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';
import { InstructorSidebar } from './dashboard/InstructorSidebar';
import { InstructorTopbar } from './dashboard/InstructorTopbar';
import { BatchSelector } from './dashboard/BatchSelector';
import { EngagementPulseCards } from './dashboard/EngagementPulseCards';
import { AtRiskStudentList } from './dashboard/AtRiskStudentList';
import { BandOverviewTable } from './dashboard/BandOverviewTable';
import { PeriodSummaryRow } from './dashboard/PeriodSummaryRow';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { callBackend } from '@/features/auth/services/authClient';
import { useDashboardSummary } from '../hooks/useDashboardSummary';
import type { InstructorBatch } from './dashboard/types';

const BACKEND = import.meta.env.VITE_BACKEND_URL || 'http://localhost:4000';

export default function InstructorDashboardPage() {
  const { user, profile } = useAuth();
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  const firstName = (profile?.name || user?.email?.split('@')[0] || 'Instructor').split(' ')[0];

  // ── Batches (for selector) ────────────────────────────────────────────────
  const [batches,         setBatches]         = useState<InstructorBatch[]>([]);
  const [batchesLoading,  setBatchesLoading]  = useState(true);
  const [selectedBatchId, setSelectedBatchId] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setBatchesLoading(true);
    callBackend(`${BACKEND}/api/instructor/batches`)
      .then(res => {
        if (cancelled) return;
        const raw: any[] = res?.data ?? [];
        const mapped: InstructorBatch[] = raw
          .filter(b => b.status === 'ACTIVE')
          .map(b => ({
            id:             b.id,
            name:           b.name,
            status:         b.status,
            studentCount:   b.studentCount ?? 0,
            instructorCount: b.instructorCount ?? 0,
          }));
        setBatches(mapped);
        if (mapped.length > 0) setSelectedBatchId(mapped[0].id);
      })
      .catch(console.error)
      .finally(() => { if (!cancelled) setBatchesLoading(false); });
    return () => { cancelled = true; };
  }, []);

  // ── Dashboard summary for selected batch ─────────────────────────────────
  const { data, loading, error, refetch } = useDashboardSummary(selectedBatchId);

  // ── Derived subtitle for welcome banner ──────────────────────────────────
  const activeToday   = data?.engagement_today.active_students ?? 0;
  const atRiskCount   = data?.at_risk.length ?? 0;
  const totalStudents = batches.find(b => b.id === selectedBatchId)?.studentCount ?? 0;

  const subtitle = !data
    ? 'Loading your batch data…'
    : atRiskCount > 0
      ? `${atRiskCount} student${atRiskCount !== 1 ? 's' : ''} need${atRiskCount === 1 ? 's' : ''} attention · ${activeToday} of ${totalStudents} active today`
      : `All students on track · ${activeToday} of ${totalStudents} active today`;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#09090E] font-sans text-slate-900 dark:text-slate-200 transition-colors duration-300">
      <InstructorSidebar
        activeTab="dashboard"
        isCollapsed={isSidebarCollapsed}
        toggleCollapse={() => setIsSidebarCollapsed(prev => !prev)}
      />

      <div className={`transition-all duration-300 ${isSidebarCollapsed ? 'lg:pl-24' : 'lg:pl-72'}`}>
        <InstructorTopbar />

        <main className="px-4 sm:px-6 lg:px-8 py-6 space-y-6 max-w-7xl mx-auto">

          {/* ── Section 1: Welcome banner + batch selector ── */}
          <div className="bg-gradient-to-br from-indigo-600 via-indigo-500 to-purple-600 rounded-2xl px-6 py-6 shadow-lg shadow-indigo-500/20 relative overflow-hidden">
            <div className="pointer-events-none absolute -top-10 -right-10 w-48 h-48 rounded-full bg-white/10 blur-3xl" />
            <div className="pointer-events-none absolute bottom-0 -left-6 w-32 h-32 rounded-full bg-purple-400/20 blur-2xl" />

            <div className="relative z-10 flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
              <div>
                <h1 className="text-2xl font-black text-white mb-1">
                  Welcome back, {firstName}
                </h1>
                <p className="text-indigo-200 text-sm leading-relaxed max-w-lg">
                  {subtitle}
                </p>
              </div>

              <div className="shrink-0">
                <BatchSelector
                  batches={batches}
                  selectedBatchId={selectedBatchId}
                  onSelect={id => setSelectedBatchId(id)}
                  loading={batchesLoading}
                />
              </div>
            </div>
          </div>

          {/* ── Error state ── */}
          {error && (
            <div className="bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/30 rounded-2xl px-5 py-4 flex items-center gap-3">
              <AlertCircle className="h-5 w-5 text-rose-500 shrink-0" />
              <p className="text-sm text-rose-700 dark:text-rose-400 flex-1">{error}</p>
              <button
                onClick={refetch}
                className="flex items-center gap-1.5 text-xs font-bold text-rose-600 dark:text-rose-400 hover:text-rose-700 transition-colors"
              >
                <RefreshCw className="h-3.5 w-3.5" /> Retry
              </button>
            </div>
          )}

          {/* ── No batches state ── */}
          {!batchesLoading && batches.length === 0 && (
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 px-6 py-12 text-center">
              <p className="text-slate-500 dark:text-slate-400 text-sm">
                You are not assigned to any active batches yet.
              </p>
            </div>
          )}

          {/* ── Section 2: Engagement Pulse ── */}
          <EngagementPulseCards
            data={data?.engagement_today ?? null}
            loading={loading}
          />

          {/* ── Sections 3 + 4: At-Risk + Band Overview side-by-side on wide screens ── */}
          <div className="grid grid-cols-1 xl:grid-cols-[340px_1fr] gap-6">
            <AtRiskStudentList
              students={data?.at_risk ?? []}
              batchId={selectedBatchId}
              loading={loading}
            />
            <BandOverviewTable
              rows={data?.band_overview ?? []}
              batchId={selectedBatchId}
              loading={loading}
            />
          </div>

          {/* ── Section 5: Period Summary ── */}
          <PeriodSummaryRow
            data={data?.period_summary ?? null}
            loading={loading}
          />

        </main>
      </div>
    </div>
  );
}
