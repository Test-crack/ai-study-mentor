import { useState, useEffect, useMemo } from 'react';
import { AlertCircle, RefreshCw, AlertTriangle, Users, CalendarDays } from 'lucide-react';
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

  // Time-of-day greeting
  const greeting = useMemo(() => {
    const h = new Date().getHours();
    if (h < 12) return 'Good morning';
    if (h < 17) return 'Good afternoon';
    return 'Good evening';
  }, []);

  // Today's date label
  const todayLabel = useMemo(() =>
    new Date().toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' }),
  []);

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
          <div className="bg-gradient-to-br from-indigo-600 via-indigo-500 to-violet-600 rounded-2xl px-6 py-5 shadow-lg shadow-indigo-500/25 relative overflow-hidden">

            {/* Decorative blobs */}
            <div className="pointer-events-none absolute -top-12 -right-12 w-56 h-56 rounded-full bg-white/10 blur-3xl" />
            <div className="pointer-events-none absolute bottom-0 -left-8 w-40 h-40 rounded-full bg-violet-400/20 blur-2xl" />
            {/* Subtle dot grid */}
            <div
              className="pointer-events-none absolute inset-0 opacity-[0.07]"
              style={{
                backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)',
                backgroundSize: '24px 24px',
              }}
            />

            <div className="relative z-10 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-5">

              {/* Left: greeting + stat chips */}
              <div className="min-w-0">
                {/* Date */}
                <div className="flex items-center gap-1.5 mb-2">
                  <CalendarDays className="h-3.5 w-3.5 text-white/50" />
                  <span className="text-[11px] font-semibold text-white/50 tracking-wide">{todayLabel}</span>
                </div>

                {/* Name */}
                <h1 className="text-2xl font-black text-white tracking-tight leading-none mb-3">
                  {greeting}, {firstName}
                </h1>

                {/* Stat chips */}
                <div className="flex flex-wrap gap-2">
                  {loading ? (
                    <>
                      <div className="h-7 w-32 rounded-full bg-white/15 animate-pulse" />
                      <div className="h-7 w-28 rounded-full bg-white/10 animate-pulse" />
                    </>
                  ) : (
                    <>
                      {/* At-risk chip */}
                      <div className={`flex items-center gap-1.5 h-7 px-3 rounded-full text-xs font-bold border backdrop-blur-sm ${
                        atRiskCount > 0
                          ? 'bg-rose-500/30 border-rose-300/40 text-rose-100'
                          : 'bg-white/10 border-white/20 text-white/70'
                      }`}>
                        <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
                        {atRiskCount > 0
                          ? `${atRiskCount} student${atRiskCount !== 1 ? 's' : ''} at risk`
                          : 'All students on track'
                        }
                      </div>

                      {/* Active today chip */}
                      <div className="flex items-center gap-1.5 h-7 px-3 rounded-full text-xs font-bold bg-white/10 border border-white/20 text-white/70 backdrop-blur-sm">
                        <Users className="h-3.5 w-3.5 shrink-0" />
                        {activeToday} / {totalStudents} active today
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* Right: batch selector */}
              <div className="shrink-0">
                <BatchSelector
                  batches={batches}
                  selectedBatchId={selectedBatchId}
                  onSelect={id => setSelectedBatchId(id)}
                  loading={batchesLoading}
                  onGradient
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
            totalStudents={totalStudents}
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
