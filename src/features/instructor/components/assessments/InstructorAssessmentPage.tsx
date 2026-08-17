// src/features/Instructor/components/assessments/InstructorAssessmentPage.tsx
import { useState, useEffect } from 'react';
import { ClipboardList, BookOpen, Stethoscope, RefreshCw } from 'lucide-react';
import { InstructorSidebar } from '../dashboard/InstructorSidebar';
import { InstructorTopbar } from '../dashboard/InstructorTopbar';
import { BatchSelector } from '../dashboard/BatchSelector';
import { useInstructorBatches } from '../../hooks/useInstructorBatches';
import { useAssessmentOverview } from '../../hooks/useAssessmentOverview';
import { AssessmentSummaryCards } from './AssessmentSummaryCards';
import { IAOverviewTab } from './IAOverviewTab';
import { MockOverviewTab } from './MockOverviewTab';
import { DiagnosticOverviewTab } from './DiagnosticOverviewTab';
import { cn } from '@/shared/utils';

type Tab = 'ia' | 'mock' | 'diagnostic';

const TABS: Array<{ id: Tab; label: string; icon: React.ReactNode }> = [
  { id: 'ia',         label: 'Internal Assessments', icon: <ClipboardList className="h-4 w-4 shrink-0" /> },
  { id: 'mock',       label: 'Mock Tests',            icon: <BookOpen      className="h-4 w-4 shrink-0" /> },
  { id: 'diagnostic', label: 'Diagnostics',           icon: <Stethoscope   className="h-4 w-4 shrink-0" /> },
];

function SkeletonTable() {
  return (
    <div className="bg-white dark:bg-[#0E0E16] rounded-2xl border border-slate-200/70 dark:border-white/[0.06] overflow-hidden animate-pulse">
      {[...Array(6)].map((_, i) => (
        <div key={i} className="flex items-center gap-4 px-5 py-4 border-b border-slate-100 dark:border-white/[0.04] last:border-0">
          <div className="h-8 w-8 rounded-full bg-slate-200 dark:bg-white/5 shrink-0" />
          <div className="h-3 w-36 bg-slate-200 dark:bg-white/5 rounded" />
          <div className="h-3 w-12 bg-slate-100 dark:bg-white/5 rounded ml-auto" />
          <div className="h-3 w-12 bg-slate-100 dark:bg-white/5 rounded" />
          <div className="h-3 w-12 bg-slate-100 dark:bg-white/5 rounded" />
        </div>
      ))}
    </div>
  );
}

export default function InstructorAssessmentPage() {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [batchId,   setBatchId]   = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<Tab>('ia');

  const { batches, loading: batchesLoading } = useInstructorBatches();
  const { data, loading, error, refetch }    = useAssessmentOverview(batchId);

  // Auto-select the first batch once loaded
  useEffect(() => {
    if (batches.length > 0 && batchId === null) {
      setBatchId(batches[0].id);
    }
  }, [batches, batchId]);

  return (
    <div className="
      relative min-h-screen
      bg-[#f8fafc] text-slate-900
      dark:bg-[#0A0A0F] dark:text-slate-200
      transition-colors duration-500
    ">
      {/* Ambient page glows (dark only) */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden hidden dark:block">
        <div className="absolute -top-60 left-1/4 w-[44rem] h-[44rem] rounded-full bg-blue-700/10 blur-[140px]" />
        <div className="absolute -bottom-20 -left-20 w-[32rem] h-[32rem] rounded-full bg-brand-teal-600/8 blur-[130px]" />
      </div>

      <InstructorSidebar
        activeTab="assessments"
        isCollapsed={isSidebarCollapsed}
        toggleCollapse={() => setIsSidebarCollapsed(c => !c)}
      />

      <div className={cn(
        'relative z-10 transition-all duration-300 flex flex-col min-h-screen',
        isSidebarCollapsed ? 'lg:pl-24' : 'lg:pl-72'
      )}>
        <InstructorTopbar />

        <main className="flex-1 p-4 sm:p-6 lg:p-8">
          <div className="max-w-7xl mx-auto space-y-5">

            {/* ── Page header ──────────────────────────────────────────────────── */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                  Assessment Overview
                </h1>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
                  IA completion, mock bands, and diagnostic baselines for your batch
                </p>
              </div>
              <div className="flex items-center gap-3 shrink-0">
                {data && (
                  <button
                    onClick={refetch}
                    className="p-2 rounded-xl text-slate-400 hover:text-brand-teal-600 dark:hover:text-brand-teal-400 hover:bg-brand-teal-50 dark:hover:bg-brand-teal-500/10 transition-colors"
                    title="Refresh"
                  >
                    <RefreshCw className="h-4 w-4" />
                  </button>
                )}
                <BatchSelector
                  batches={batches}
                  loading={batchesLoading}
                  selectedBatchId={batchId}
                  onSelect={id => { setBatchId(id); setActiveTab('ia'); }}
                />
              </div>
            </div>

            {/* ── No batch selected ─────────────────────────────────────────────── */}
            {!batchId && (
              <div className="bg-white dark:bg-[#0E0E16] rounded-2xl border border-slate-200/70 dark:border-white/[0.06] shadow-[0_2px_12px_-4px_rgba(15,23,42,0.08)] dark:shadow-none p-16 text-center">
                <ClipboardList className="h-10 w-10 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
                <p className="text-slate-500 dark:text-slate-400 font-semibold text-sm">
                  Select a batch to view assessment data
                </p>
              </div>
            )}

            {/* ── Loading ───────────────────────────────────────────────────────── */}
            {batchId && loading && (
              <div className="space-y-5 animate-pulse">
                <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3">
                  {[...Array(6)].map((_, i) => (
                    <div key={i} className="h-24 bg-slate-200 dark:bg-white/[0.04] rounded-2xl" />
                  ))}
                </div>
                <div className="h-12 w-full max-w-sm bg-slate-200 dark:bg-white/[0.04] rounded-2xl" />
                <SkeletonTable />
              </div>
            )}

            {/* ── Error ─────────────────────────────────────────────────────────── */}
            {batchId && !loading && error && (
              <div className="bg-rose-50 dark:bg-rose-500/[0.08] border border-rose-200 dark:border-rose-400/20 rounded-2xl p-8 text-center shadow-[0_2px_10px_-3px_rgba(244,63,94,0.12)] dark:shadow-none">
                <p className="text-rose-700 dark:text-rose-300 font-semibold text-sm">{error}</p>
                <button
                  onClick={refetch}
                  className="mt-3 text-xs font-bold text-rose-600 dark:text-rose-400 hover:underline"
                >
                  Try again
                </button>
              </div>
            )}

            {/* ── Data loaded ───────────────────────────────────────────────────── */}
            {batchId && !loading && data && (
              <div className="space-y-5 animate-in fade-in slide-in-from-bottom-4 duration-400">

                {/* Summary cards */}
                <AssessmentSummaryCards
                  iaSummary={data.batch_ia_summary}
                  mockSummary={data.batch_mock_summary}
                  totalStudents={data.ia_overview.length}
                />

                {/* Tab bar — horizontally scrollable on mobile */}
                <div className="overflow-x-auto -mx-4 sm:mx-0 px-4 sm:px-0 pb-0.5">
                  <div className="bg-white dark:bg-[#0E0E16] rounded-2xl border border-slate-200/70 dark:border-white/[0.06] shadow-[0_2px_12px_-4px_rgba(15,23,42,0.08)] dark:shadow-none p-1.5 flex gap-1 w-fit">
                    {TABS.map(tab => (
                      <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={cn(
                          'flex items-center gap-2 px-3 sm:px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-200 whitespace-nowrap',
                          activeTab === tab.id
                            ? 'bg-brand-teal-600 text-white shadow-[0_4px_14px_-2px_rgba(99,102,241,0.5)] dark:bg-brand-teal-500/15 dark:text-brand-teal-300 dark:border dark:border-brand-teal-500/20 dark:shadow-[0_0_20px_rgba(99,102,241,0.15)]'
                            : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-white/[0.04]'
                        )}
                      >
                        {tab.icon}
                        {tab.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Tab content */}
                {activeTab === 'ia' && (
                  <IAOverviewTab rows={data.ia_overview} batchId={batchId} />
                )}
                {activeTab === 'mock' && (
                  <MockOverviewTab rows={data.mock_overview} batchId={batchId} />
                )}
                {activeTab === 'diagnostic' && (
                  <DiagnosticOverviewTab rows={data.diagnostic_overview} batchId={batchId} refetch={refetch} />
                )}
              </div>
            )}

          </div>
        </main>
      </div>
    </div>
  );
}