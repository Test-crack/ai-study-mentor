import { useState, useEffect, useMemo } from 'react';
import { AlertCircle, RefreshCw, AlertTriangle, Users, CalendarDays } from 'lucide-react';
import { InstructorSidebar } from './dashboard/InstructorSidebar';
import { InstructorTopbar } from './dashboard/InstructorTopbar';
import { BatchSelector } from './dashboard/BatchSelector';
import { EngagementPulseCards } from './dashboard/EngagementPulseCards';
import { StudentActivityGrid } from './dashboard/StudentActivityGrid';
import { AtRiskStudentList } from './dashboard/AtRiskStudentList';
import { BandOverviewTable } from './dashboard/BandOverviewTable';
import { PeriodSummaryRow } from './dashboard/PeriodSummaryRow';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { useInstructorBatches } from '../hooks/useInstructorBatches';
import { useDashboardSummary } from '../hooks/useDashboardSummary';
import { cn } from '@/shared/utils';

const BACKEND = import.meta.env.VITE_BACKEND_URL || 'http://localhost:4000';

export default function InstructorDashboardPage() {
  const { user, profile } = useAuth();
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  const firstName = (profile?.name || user?.email?.split('@')[0] || 'Instructor').split(' ')[0];

  const greeting = useMemo(() => {
    const h = new Date().getHours();
    if (h < 12) return 'Good morning';
    if (h < 17) return 'Good afternoon';
    return 'Good evening';
  }, []);

  const todayLabel = useMemo(() =>
    new Date().toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' }),
  []);

  const [selectedBatchId, setSelectedBatchId] = useState<string | null>(null);
  const { batches, loading: batchesLoading } = useInstructorBatches();

  useEffect(() => {
    if (batches.length > 0 && selectedBatchId === null) {
      setSelectedBatchId(batches[0].id);
    }
  }, [batches, selectedBatchId]);

  const { data, loading, error, refetch } = useDashboardSummary(selectedBatchId);

  const activeToday   = data?.engagement_today.active_students ?? 0;
  const atRiskCount   = data?.at_risk.length ?? 0;
  const totalStudents = batches.find(b => b.id === selectedBatchId)?.studentCount ?? 0;

  return (
    <div className="relative min-h-screen font-plex antialiased overflow-x-hidden bg-brand-bg text-brand-text">

      <InstructorSidebar
        activeTab="dashboard"
        isCollapsed={isSidebarCollapsed}
        toggleCollapse={() => setIsSidebarCollapsed(prev => !prev)}
      />

      <div className={`relative z-10 transition-all duration-300 ${isSidebarCollapsed ? 'lg:pl-24' : 'lg:pl-72'}`}>
        <InstructorTopbar />

        <main className="px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-8 max-w-[90rem] mx-auto pb-16">

          {/* ══════════════════════════════════════════
              Section 1 — Hero Banner
          ══════════════════════════════════════════ */}
          <div className="relative overflow-hidden rounded-3xl bg-brand-ink-deep text-white border border-brand-line-16 p-6 sm:p-8 shadow-sm">

            {/* Banner Content */}
            <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-8">

              {/* Left — Greeting & Context */}
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 mb-3">
                  <CalendarDays className="h-4 w-4 text-brand-on-ink-mute" />
                  <span className="font-jetbrains text-xs font-bold text-brand-on-ink-mute tracking-[0.15em] uppercase">
                    {todayLabel}
                  </span>
                </div>

                <h1 className="font-manrope text-3xl sm:text-4xl font-black tracking-tight leading-tight mb-2 text-white">
                  {greeting}, {firstName}
                </h1>

                <p className="text-sm text-brand-on-ink mb-6 font-medium">
                  Here is the performance and engagement breakdown for your batches today.
                </p>

                {/* Status Chips */}
                <div className="flex flex-wrap gap-3">
                  {loading ? (
                    <>
                      <div className="h-9 w-40 rounded-full bg-white/5 animate-pulse" />
                      <div className="h-9 w-32 rounded-full bg-white/5 animate-pulse" />
                    </>
                  ) : (
                    <>
                      <div className={cn(
                        'flex items-center gap-2 h-9 pl-3 pr-4 rounded-full text-xs font-bold border',
                        atRiskCount > 0
                          ? 'bg-brand-warm/10 border-brand-warm/25 text-brand-warm'
                          : 'bg-brand-mint/10 border-brand-mint/25 text-brand-mint'
                      )}>
                        <span className={cn(
                          'grid place-items-center h-5 w-5 rounded-full',
                          atRiskCount > 0 ? 'bg-brand-warm/20' : 'bg-brand-mint/20'
                        )}>
                          <AlertTriangle className="h-3 w-3 shrink-0" />
                        </span>
                        {atRiskCount > 0
                          ? `${atRiskCount} student${atRiskCount !== 1 ? 's' : ''} at risk`
                          : 'All students on track'
                        }
                      </div>

                      <div className="flex items-center gap-2 h-9 pl-3 pr-4 rounded-full text-xs font-bold bg-brand-teal-500/10 border border-brand-teal-500/25 text-brand-teal-300">
                        <span className="grid place-items-center h-5 w-5 rounded-full bg-brand-teal-500/20">
                          <Users className="h-3 w-3 shrink-0" />
                        </span>
                        {activeToday} / {totalStudents} active today
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* Right — Batch Selector & Stat Cards */}
              <div className="shrink-0 flex flex-col gap-4 items-stretch lg:items-end">
                <div className="w-full lg:w-auto">
                  <p className="font-jetbrains text-[10px] font-bold tracking-[0.2em] uppercase text-brand-on-ink-mute mb-2 lg:text-right">
                    Current Batch
                  </p>
                  <BatchSelector
                    batches={batches}
                    selectedBatchId={selectedBatchId}
                    onSelect={id => setSelectedBatchId(id)}
                    loading={batchesLoading}
                  />
                </div>

                {!loading ? (
                  <div className="flex gap-3">
                    <div className="flex flex-col items-center justify-center w-24 h-24 bg-white/5 rounded-2xl border border-brand-line-12">
                      <p className="font-jetbrains text-[10px] font-bold text-brand-on-ink-mute uppercase tracking-widest mb-1">
                        Active
                      </p>
                      <p className="text-2xl font-black text-white leading-none">
                        {activeToday}
                      </p>
                    </div>
                    <div className="flex flex-col items-center justify-center w-24 h-24 bg-white/5 rounded-2xl border border-brand-line-12">
                      <p className="font-jetbrains text-[10px] font-bold text-brand-on-ink-mute uppercase tracking-widest mb-1 flex items-center gap-1">
                        <AlertTriangle className="h-2.5 w-2.5" /> Risk
                      </p>
                      <p className={cn(
                        'text-2xl font-black leading-none',
                        atRiskCount > 0 ? 'text-brand-warm' : 'text-brand-mint'
                      )}>
                        {atRiskCount}
                      </p>
                    </div>
                    <div className="flex flex-col items-center justify-center w-24 h-24 bg-white/5 rounded-2xl border border-brand-line-12">
                      <p className="font-jetbrains text-[10px] font-bold text-brand-on-ink-mute uppercase tracking-widest mb-1">
                        Batch
                      </p>
                      <p className="text-2xl font-black text-white leading-none">
                        {totalStudents}
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="flex gap-3">
                    {[1, 2, 3].map(i => (
                      <div key={i} className="w-24 h-24 bg-white/5 rounded-2xl animate-pulse" />
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* ══════════════════════════════════════════
              Error State
          ══════════════════════════════════════════ */}
          {error && (
            <div className="rounded-2xl border px-5 py-4 flex items-center gap-4 bg-brand-warm-tint border-brand-warm/20 text-brand-warm-danger">
              <AlertCircle className="h-5 w-5 shrink-0 text-brand-warm" />
              <p className="text-sm font-medium flex-1">{error}</p>
              <button
                onClick={refetch}
                className="flex items-center gap-1.5 text-sm font-bold hover:opacity-80 transition-opacity whitespace-nowrap"
              >
                <RefreshCw className="h-4 w-4" /> Retry
              </button>
            </div>
          )}

          {/* ══════════════════════════════════════════
              No Batches State
          ══════════════════════════════════════════ */}
          {!batchesLoading && batches.length === 0 && (
            <div className="rounded-2xl border px-8 py-16 text-center bg-white border-brand-line shadow-sm">
              <p className="text-base text-brand-text-mute font-medium">
                You are not assigned to any active batches yet.
              </p>
            </div>
          )}

          {/* ══════════════════════════════════════════
              Dashboard Content Sections
          ══════════════════════════════════════════ */}

          <section className="space-y-4">
            <p className="font-jetbrains text-[11px] font-bold tracking-[0.2em] uppercase text-brand-text-mute px-1">
              Engagement Pulse
            </p>
            <EngagementPulseCards
              data={data?.engagement_today ?? null}
              loading={loading}
              totalStudents={totalStudents}
            />
          </section>

          <section className="space-y-4">
            <p className="font-jetbrains text-[11px] font-bold tracking-[0.2em] uppercase text-brand-text-mute px-1">
              Today's Batch Activity
            </p>
            <StudentActivityGrid
              rows={data?.band_overview ?? []}
              batchId={selectedBatchId}
              loading={loading}
            />
          </section>

          <section className="space-y-4">
            <p className="font-jetbrains text-[11px] font-bold tracking-[0.2em] uppercase text-brand-text-mute px-1">
              Band Score Overview
            </p>
            <BandOverviewTable
              rows={data?.band_overview ?? []}
              batchId={selectedBatchId}
              loading={loading}
            />
          </section>

          <section className="space-y-4">
            <p className="font-jetbrains text-[11px] font-bold tracking-[0.2em] uppercase text-brand-text-mute px-1">
              Risk Monitor
            </p>
            <AtRiskStudentList
              students={data?.at_risk ?? []}
              batchId={selectedBatchId}
              loading={loading}
            />
          </section>

          <section className="space-y-4">
            <p className="font-jetbrains text-[11px] font-bold tracking-[0.2em] uppercase text-brand-text-mute px-1">
              Period Summary
            </p>
            <PeriodSummaryRow
              data={data?.period_summary ?? null}
              loading={loading}
            />
          </section>

        </main>
      </div>
    </div>
  );
}