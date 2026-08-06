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
    <div className="
      relative min-h-screen font-sans antialiased overflow-x-hidden
      bg-[#F4F6F9] text-slate-900
      dark:bg-[#080B11] dark:text-slate-200
      transition-colors duration-500
    ">

      {/* ── Ambient Background Glows ── */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden dark:block hidden transition-opacity duration-500">
        <div className="absolute -top-60 left-1/4 w-[40rem] h-[40rem] rounded-full bg-brand-teal-900/10 blur-[120px]" />
        <div className="absolute top-1/2 -right-32 w-[30rem] h-[30rem] rounded-full bg-blue-900/10 blur-[100px]" />
      </div>

      <InstructorSidebar
        activeTab="dashboard"
        isCollapsed={isSidebarCollapsed}
        toggleCollapse={() => setIsSidebarCollapsed(prev => !prev)}
      />

      <div className={`relative z-10 transition-all duration-300 ${isSidebarCollapsed ? 'lg:pl-24' : 'lg:pl-72'}`}>
        <InstructorTopbar />

        <main className="px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-8 max-w-[90rem] mx-auto pb-16">

          {/* ══════════════════════════════════════════
              Section 1 — The Premium Hero Banner
          ══════════════════════════════════════════ */}
          <div className="
            relative overflow-hidden rounded-[2rem]
            bg-[#E8EDF5]/50 border border-white/60 shadow-[0_8px_30px_rgb(0,0,0,0.02)]
            dark:bg-[#111623]/80 dark:border-white/[0.04] dark:shadow-[0_8px_30px_rgb(0,0,0,0.2)]
            backdrop-blur-xl transition-colors duration-500
          ">

            {/* Ambient Background Orbs */}
            <div className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full bg-brand-teal-200/30 dark:bg-brand-teal-600/10 blur-[80px] transition-colors duration-500" />
            <div className="pointer-events-none absolute -bottom-32 -left-20 w-80 h-80 rounded-full bg-blue-200/30 dark:bg-blue-600/10 blur-[90px] transition-colors duration-500" />

            {/* Scattered Floating Particles (Mimicking the Video) */}
            <div className="pointer-events-none absolute inset-0 opacity-70">
              <div className="absolute top-8 left-[30%] w-2 h-2 rounded-full bg-blue-400/50 dark:bg-blue-400/80 blur-[1px]" />
              <div className="absolute top-1/4 left-[45%] w-1.5 h-1.5 rounded-full bg-brand-teal-400/60 dark:bg-brand-teal-400/90" />
              <div className="absolute bottom-12 left-[35%] w-3 h-3 rounded-full bg-brand-blue-400/40 dark:bg-brand-blue-400/60 blur-[2px]" />
              <div className="absolute top-1/3 right-[35%] w-2.5 h-2.5 rounded-full bg-teal-400/50 dark:bg-teal-400/70" />
              <div className="absolute bottom-1/4 right-[40%] w-1.5 h-1.5 rounded-full bg-blue-500/50 dark:bg-blue-400/80 blur-[1px]" />
            </div>

            {/* Top edge light shine */}
            <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/80 dark:via-white/10 to-transparent" />

            {/* Banner Content */}
            <div className="relative z-10 px-6 sm:px-10 py-8 flex flex-col lg:flex-row lg:items-center justify-between gap-8">

              {/* Left — Greeting & Context */}
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 mb-3">
                  <CalendarDays className="h-4 w-4 text-slate-400 dark:text-slate-500" />
                  <span className="text-xs font-bold text-slate-500 dark:text-slate-400 tracking-[0.15em] uppercase">
                    {todayLabel}
                  </span>
                </div>

                <h1 className="text-3xl sm:text-4xl font-black tracking-tight leading-tight mb-2 text-slate-800 dark:text-slate-100 transition-colors duration-500">
                  {greeting}, {firstName}
                </h1>

                <p className="text-sm text-slate-500 dark:text-slate-400 mb-6 font-medium transition-colors duration-500">
                  Here is the performance and engagement breakdown for your batches today.
                </p>

                {/* Status Chips */}
                <div className="flex flex-wrap gap-3">
                  {loading ? (
                    <>
                      <div className="h-9 w-40 rounded-full bg-white/40 dark:bg-white/5 animate-pulse" />
                      <div className="h-9 w-32 rounded-full bg-white/40 dark:bg-white/5 animate-pulse" />
                    </>
                  ) : (
                    <>
                      <div className={cn(
                        'flex items-center gap-2 h-9 pl-3 pr-4 rounded-full text-xs font-bold border backdrop-blur-md transition-colors duration-500',
                        atRiskCount > 0
                          ? 'bg-rose-100/50 border-rose-200/60 text-rose-700 dark:bg-rose-500/10 dark:border-rose-500/20 dark:text-rose-300'
                          : 'bg-emerald-100/50 border-emerald-200/60 text-emerald-700 dark:bg-emerald-500/10 dark:border-emerald-500/20 dark:text-emerald-300'
                      )}>
                        <span className={cn(
                          'grid place-items-center h-5 w-5 rounded-full',
                          atRiskCount > 0 ? 'bg-rose-200/60 dark:bg-rose-500/20' : 'bg-emerald-200/60 dark:bg-emerald-500/20'
                        )}>
                          <AlertTriangle className="h-3 w-3 shrink-0" />
                        </span>
                        {atRiskCount > 0
                          ? `${atRiskCount} student${atRiskCount !== 1 ? 's' : ''} at risk`
                          : 'All students on track'
                        }
                      </div>

                      <div className="flex items-center gap-2 h-9 pl-3 pr-4 rounded-full text-xs font-bold bg-blue-100/50 border border-blue-200/60 text-blue-700 dark:bg-brand-teal-500/10 dark:border-brand-teal-500/20 dark:text-brand-teal-300 backdrop-blur-md transition-colors duration-500">
                        <span className="grid place-items-center h-5 w-5 rounded-full bg-blue-200/60 dark:bg-brand-teal-500/20">
                          <Users className="h-3 w-3 shrink-0" />
                        </span>
                        {activeToday} / {totalStudents} active today
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* Right — Batch Selector & Clean Floating Cards */}
              <div className="shrink-0 flex flex-col gap-4 items-stretch lg:items-end">
                <div className="w-full lg:w-auto">
                  <p className="text-[10px] font-bold tracking-[0.2em] uppercase text-slate-400 dark:text-slate-500 mb-2 lg:text-right">
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
                    <div className="flex flex-col items-center justify-center w-24 h-24 bg-white dark:bg-[#1A1F2E] rounded-2xl border border-slate-100 dark:border-white/5 shadow-sm transition-colors duration-500">
                      <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1">
                        Active
                      </p>
                      <p className="text-2xl font-black text-slate-800 dark:text-slate-100 leading-none">
                        {activeToday}
                      </p>
                    </div>
                    <div className="flex flex-col items-center justify-center w-24 h-24 bg-white dark:bg-[#1A1F2E] rounded-2xl border border-slate-100 dark:border-white/5 shadow-sm transition-colors duration-500">
                      <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1 flex items-center gap-1">
                        <AlertTriangle className="h-2.5 w-2.5" /> Risk
                      </p>
                      <p className={cn(
                        'text-2xl font-black leading-none transition-colors duration-500',
                        atRiskCount > 0 ? 'text-rose-500 dark:text-rose-400' : 'text-emerald-500 dark:text-emerald-400'
                      )}>
                        {atRiskCount}
                      </p>
                    </div>
                    <div className="flex flex-col items-center justify-center w-24 h-24 bg-white dark:bg-[#1A1F2E] rounded-2xl border border-slate-100 dark:border-white/5 shadow-sm transition-colors duration-500">
                      <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1">
                        Batch
                      </p>
                      <p className="text-2xl font-black text-slate-800 dark:text-slate-100 leading-none">
                        {totalStudents}
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="flex gap-3">
                    {[1, 2, 3].map(i => (
                      <div key={i} className="w-24 h-24 bg-white/50 dark:bg-white/5 rounded-2xl animate-pulse" />
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
            <div className="
              rounded-2xl border px-5 py-4 flex items-center gap-4
              bg-rose-50 border-rose-100 text-rose-700
              dark:bg-rose-500/10 dark:border-rose-500/20 dark:text-rose-300
              transition-colors duration-500
            ">
              <AlertCircle className="h-5 w-5 shrink-0 text-rose-500 dark:text-rose-400" />
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
            <div className="
              rounded-2xl border px-8 py-16 text-center
              bg-white border-slate-200/60
              dark:bg-[#1A1F2E] dark:border-white/5
              shadow-sm transition-colors duration-500
            ">
              <p className="text-base text-slate-500 dark:text-slate-400 font-medium">
                You are not assigned to any active batches yet.
              </p>
            </div>
          )}

          {/* ══════════════════════════════════════════
              Dashboard Content Sections
          ══════════════════════════════════════════ */}
          
          <section className="space-y-4">
            <p className="text-[11px] font-bold tracking-[0.2em] uppercase text-slate-400 dark:text-slate-500 px-1">
              Engagement Pulse
            </p>
            <EngagementPulseCards
              data={data?.engagement_today ?? null}
              loading={loading}
              totalStudents={totalStudents}
            />
          </section>

          <section className="space-y-4">
            <p className="text-[11px] font-bold tracking-[0.2em] uppercase text-slate-400 dark:text-slate-500 px-1">
              Today's Batch Activity
            </p>
            <StudentActivityGrid
              rows={data?.band_overview ?? []}
              batchId={selectedBatchId}
              loading={loading}
            />
          </section>

          <section className="space-y-4">
            <p className="text-[11px] font-bold tracking-[0.2em] uppercase text-slate-400 dark:text-slate-500 px-1">
              Band Score Overview
            </p>
            <BandOverviewTable
              rows={data?.band_overview ?? []}
              batchId={selectedBatchId}
              loading={loading}
            />
          </section>

          <section className="space-y-4">
            <p className="text-[11px] font-bold tracking-[0.2em] uppercase text-slate-400 dark:text-slate-500 px-1">
              Risk Monitor
            </p>
            <AtRiskStudentList
              students={data?.at_risk ?? []}
              batchId={selectedBatchId}
              loading={loading}
            />
          </section>

          <section className="space-y-4">
            <p className="text-[11px] font-bold tracking-[0.2em] uppercase text-slate-400 dark:text-slate-500 px-1">
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