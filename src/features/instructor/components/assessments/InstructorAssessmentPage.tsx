import { useState, useEffect } from 'react';
import { ClipboardList, BookOpen, Stethoscope, RefreshCw } from 'lucide-react';
import { InstructorSidebar } from '../dashboard/InstructorSidebar';
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
  { id: 'ia',         label: 'Internal Assessments', icon: <ClipboardList className="h-4 w-4" /> },
  { id: 'mock',       label: 'Mock Tests',            icon: <BookOpen      className="h-4 w-4" /> },
  { id: 'diagnostic', label: 'Diagnostics',           icon: <Stethoscope   className="h-4 w-4" /> },
];

function SkeletonTable() {
  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden animate-pulse">
      {[...Array(6)].map((_, i) => (
        <div key={i} className="flex items-center gap-4 px-5 py-4 border-b border-slate-100 dark:border-slate-800 last:border-0">
          <div className="h-8 w-8 rounded-full bg-slate-200 dark:bg-slate-800 shrink-0" />
          <div className="h-3 w-36 bg-slate-200 dark:bg-slate-800 rounded" />
          <div className="h-3 w-12 bg-slate-100 dark:bg-slate-800 rounded ml-auto" />
          <div className="h-3 w-12 bg-slate-100 dark:bg-slate-800 rounded" />
          <div className="h-3 w-12 bg-slate-100 dark:bg-slate-800 rounded" />
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
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 transition-colors duration-300 flex">
      <InstructorSidebar
        activeTab="assessments"
        isCollapsed={isSidebarCollapsed}
        toggleCollapse={() => setIsSidebarCollapsed(c => !c)}
      />

      <div className={cn(
        'transition-all duration-300 min-h-screen flex flex-col w-full',
        isSidebarCollapsed ? 'lg:pl-20' : 'lg:pl-72'
      )}>
        <main className="p-4 md:p-6 max-w-7xl mx-auto w-full pt-8 space-y-5">

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
            <div className="flex items-center gap-3">
              {data && (
                <button
                  onClick={refetch}
                  className="p-2 rounded-xl text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-500/10 transition-colors"
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
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-16 text-center">
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
                  <div key={i} className="h-24 bg-slate-200 dark:bg-slate-800 rounded-2xl" />
                ))}
              </div>
              <div className="h-12 w-96 bg-slate-200 dark:bg-slate-800 rounded-2xl" />
              <SkeletonTable />
            </div>
          )}

          {/* ── Error ─────────────────────────────────────────────────────────── */}
          {batchId && !loading && error && (
            <div className="bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/30 rounded-2xl p-8 text-center">
              <p className="text-rose-700 dark:text-rose-400 font-semibold text-sm">{error}</p>
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

              {/* Tab bar */}
              <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm p-1.5 flex gap-1 w-fit">
                {TABS.map(tab => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={cn(
                      'flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-200 whitespace-nowrap',
                      activeTab === tab.id
                        ? 'bg-indigo-600 text-white shadow-sm'
                        : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800'
                    )}
                  >
                    {tab.icon}
                    {tab.label}
                  </button>
                ))}
              </div>

              {/* Tab content */}
              {activeTab === 'ia' && (
                <IAOverviewTab rows={data.ia_overview} batchId={batchId} />
              )}
              {activeTab === 'mock' && (
                <MockOverviewTab rows={data.mock_overview} batchId={batchId} />
              )}
              {activeTab === 'diagnostic' && (
                <DiagnosticOverviewTab rows={data.diagnostic_overview} batchId={batchId} />
              )}
            </div>
          )}

        </main>
      </div>
    </div>
  );
}
