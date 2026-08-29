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

import { useCallback, useEffect, useMemo, useState } from 'react';
import { ClipboardList, BookOpen, FileSearch, RefreshCw, Loader2 } from 'lucide-react';

import { InstituteOwnerSidebar } from '../components/InstitiuteOwnerSidebar';
import { InstituteOwnerTopbar } from '../components/InstituteOwnerTopbar';
import { cn } from '@/shared/utils';
import { useToast } from '@/shared/hooks/use-toast';
import {
  fetchAssessmentOverview, fetchBatches,
  type AssessmentOverview, type BatchRow,
} from '../services/instituteOwnerService';
import { IAOverviewTab } from '@/features/instructor/components/assessments/IAOverviewTab';
import { MockOverviewTab } from '@/features/instructor/components/assessments/MockOverviewTab';
import { DiagnosticOverviewTab } from '@/features/instructor/components/assessments/DiagnosticOverviewTab';

type Tab = 'diagnostic' | 'ia' | 'mock';

const TABS: Array<{ id: Tab; label: string; icon: React.ReactNode }> = [
  // Diagnostic leads: "who has not started" is the owner's first question, and
  // the endpoint already sorts undiagnosed students to the top.
  { id: 'diagnostic', label: 'Diagnostic', icon: <FileSearch    className="h-4 w-4" /> },
  { id: 'ia',         label: 'Internal Assessments', icon: <ClipboardList className="h-4 w-4" /> },
  { id: 'mock',       label: 'Mock Tests', icon: <BookOpen      className="h-4 w-4" /> },
];

function SummaryTile({ label, value, sub, tone = 'neutral' }: {
  label: string; value: string | number; sub?: string;
  tone?: 'neutral' | 'good' | 'warn' | 'bad';
}) {
  const valueTone =
    tone === 'good' ? 'text-emerald-600'
    : tone === 'warn' ? 'text-amber-600'
    : tone === 'bad' ? 'text-rose-600'
    : 'text-brand-text';
  return (
    <div className="bg-white rounded-2xl border border-brand-line p-4">
      <p className="text-[10px] font-bold text-brand-text-mute font-jetbrains uppercase tracking-wider">{label}</p>
      <p className={cn('text-2xl font-black leading-tight mt-1 tabular-nums', valueTone)}>{value}</p>
      {sub && <p className="text-[11px] text-brand-text-mute mt-0.5">{sub}</p>}
    </div>
  );
}

export default function InstituteAssessments() {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [activeTab, setActiveTab] = useState<Tab>('diagnostic');
  const [batchFilter, setBatchFilter] = useState('');
  const [batches, setBatches] = useState<BatchRow[]>([]);
  const [data, setData] = useState<AssessmentOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

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

  const diagnosedCount = useMemo(
    () => (data?.diagnostic_overview ?? []).filter(r => r.is_diagnosed).length,
    [data]
  );
  const totalStudents = data?.diagnostic_overview.length ?? 0;

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

          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <h1 className="font-manrope text-2xl sm:text-3xl font-black tracking-tight">Assessments</h1>
              <p className="text-sm text-brand-text-mute mt-1">
                Diagnostic coverage, internal assessments and mock tests across the whole institute.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <select
                value={batchFilter}
                onChange={e => setBatchFilter(e.target.value)}
                className="min-h-[40px] rounded-xl border border-brand-line bg-white px-3 text-sm font-semibold text-brand-text"
              >
                <option value="">All batches</option>
                {batches.map(b => (
                  <option key={b.id} value={b.id}>{b.name}</option>
                ))}
              </select>
              <button
                onClick={load}
                disabled={loading}
                className="inline-flex items-center gap-2 min-h-[40px] px-3 rounded-xl border border-brand-line bg-white text-sm font-semibold hover:bg-brand-bg-alt disabled:opacity-60"
              >
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
                Refresh
              </button>
            </div>
          </div>

          {loading && (
            <div className="space-y-5 animate-pulse">
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                {[...Array(4)].map((_, i) => <div key={i} className="h-24 bg-brand-bg-alt rounded-2xl" />)}
              </div>
              <div className="h-64 bg-brand-bg-alt rounded-2xl" />
            </div>
          )}

          {!loading && error && (
            <div className="bg-rose-50 border border-rose-200 rounded-2xl p-8 text-center">
              <p className="text-rose-700 font-semibold text-sm">{error}</p>
              <button onClick={load} className="mt-3 text-xs font-bold text-rose-600 hover:underline">
                Try again
              </button>
            </div>
          )}

          {!loading && !error && data && (
            <div className="space-y-5">

              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                <SummaryTile
                  label="Diagnosed"
                  value={totalStudents === 0 ? '—' : `${diagnosedCount}/${totalStudents}`}
                  sub={
                    totalStudents === 0
                      ? 'no students in scope'
                      : `${totalStudents - diagnosedCount} never started`
                  }
                  tone={totalStudents > 0 && diagnosedCount < totalStudents ? 'warn' : 'good'}
                />
                <SummaryTile
                  label="Avg IA Band"
                  value={data.institute_ia_summary.avg_band || '—'}
                  sub={`${data.institute_ia_summary.completion_rate}% have sat one`}
                />
                <SummaryTile
                  label="Missing 2+ IAs"
                  value={data.institute_ia_summary.high_miss_count}
                  sub="students"
                  tone={data.institute_ia_summary.high_miss_count > 0 ? 'bad' : 'good'}
                />
                <SummaryTile
                  label="Avg Mock Band"
                  value={data.institute_mock_summary.avg_real_band || '—'}
                  sub={`${data.institute_mock_summary.no_mock_yet} never sat a mock · ${data.institute_mock_summary.at_or_above_target} at target`}
                />
              </div>

              <div className="overflow-x-auto -mx-4 sm:mx-0 px-4 sm:px-0 pb-0.5">
                <div className="bg-white rounded-2xl border border-brand-line shadow-sm p-1.5 flex gap-1 w-fit">
                  {TABS.map(tab => (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={cn(
                        'flex items-center gap-2 min-h-[40px] px-3 sm:px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-200 whitespace-nowrap',
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

              {/* batchId is passed only to satisfy the shared components' default
                  navigation path; progressPathFor overrides it for this portal. */}
              {activeTab === 'diagnostic' && (
                <DiagnosticOverviewTab
                  rows={data.diagnostic_overview}
                  batchId={batchFilter}
                  refetch={load}
                  progressPathFor={progressPathFor}
                />
              )}
              {activeTab === 'ia' && (
                <IAOverviewTab
                  rows={data.ia_overview}
                  batchId={batchFilter}
                  progressPathFor={progressPathFor}
                />
              )}
              {activeTab === 'mock' && (
                <MockOverviewTab
                  rows={data.mock_overview}
                  batchId={batchFilter}
                  progressPathFor={progressPathFor}
                />
              )}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
