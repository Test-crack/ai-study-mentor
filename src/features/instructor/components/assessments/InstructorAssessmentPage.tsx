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
    <div className="bg-white rounded-2xl border border-brand-line overflow-hidden animate-pulse">
      {[...Array(6)].map((_, i) => (
        <div key={i} className="flex items-center gap-4 px-5 py-4 border-b border-brand-line last:border-0">
          <div className="h-8 w-8 rounded-full bg-brand-bg-alt shrink-0" />
          <div className="h-3 w-36 bg-brand-bg-alt rounded" />
          <div className="h-3 w-12 bg-brand-bg-alt rounded ml-auto" />
          <div className="h-3 w-12 bg-brand-bg-alt rounded" />
          <div className="h-3 w-12 bg-brand-bg-alt rounded" />
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
    <div className="relative min-h-screen font-plex antialiased overflow-x-hidden bg-brand-bg text-brand-text">
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
                <h1 className="text-2xl font-black text-brand-text tracking-tight">
                  Assessment Overview
                </h1>
                <p className="text-sm text-brand-text-mute mt-0.5">
                  IA completion, mock bands, and diagnostic baselines for your batch
                </p>
              </div>
              <div className="flex items-center gap-3 shrink-0">
                {data && (
                  <button
                    onClick={refetch}
                    className="p-2 rounded-xl text-brand-text-mute hover:text-brand-teal-600 hover:bg-brand-teal-50 transition-colors"
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
              <div className="bg-white rounded-2xl border border-brand-line shadow-sm p-16 text-center">
                <ClipboardList className="h-10 w-10 text-brand-text-mute mx-auto mb-3" />
                <p className="text-brand-text-mute font-semibold text-sm">
                  Select a batch to view assessment data
                </p>
              </div>
            )}

            {/* ── Loading ───────────────────────────────────────────────────────── */}
            {batchId && loading && (
              <div className="space-y-5 animate-pulse">
                <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3">
                  {[...Array(6)].map((_, i) => (
                    <div key={i} className="h-24 bg-brand-bg-alt rounded-2xl" />
                  ))}
                </div>
                <div className="h-12 w-full max-w-sm bg-brand-bg-alt rounded-2xl" />
                <SkeletonTable />
              </div>
            )}

            {/* ── Error ─────────────────────────────────────────────────────────── */}
            {batchId && !loading && error && (
              <div className="bg-rose-50 border border-rose-200 rounded-2xl p-8 text-center shadow-sm">
                <p className="text-rose-700 font-semibold text-sm">{error}</p>
                <button
                  onClick={refetch}
                  className="mt-3 text-xs font-bold text-rose-600 hover:underline"
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
                  <div className="bg-white rounded-2xl border border-brand-line shadow-sm p-1.5 flex gap-1 w-fit">
                    {TABS.map(tab => (
                      <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={cn(
                          'flex items-center gap-2 px-3 sm:px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-200 whitespace-nowrap',
                          activeTab === tab.id
                            ? 'bg-brand-teal-600 text-white shadow-sm'
                            : 'text-brand-text-mute hover:text-brand-text hover:bg-brand-bg-alt'
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