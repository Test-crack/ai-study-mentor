import { useState, useEffect, useCallback } from 'react';
import { FileText, Loader2, TrendingUp, TrendingDown, Minus, AlertTriangle, Search, Download } from 'lucide-react';
import { InstructorSidebar } from './dashboard/InstructorSidebar';
import { InstructorTopbar } from './dashboard/InstructorTopbar';
import { BatchSelector } from './dashboard/BatchSelector';
import { callBackend } from '@/features/auth/services/authClient';
import { getBackendUrl, cn } from '@/shared/utils';
import { useToast } from '@/shared/hooks/use-toast';
import type { InstructorBatch } from './dashboard/types';
import type { DashboardSummary, BandOverviewRow } from './dashboard/types';
import type { AssessmentOverview } from './assessments/types';
import type { StudentFullProgress } from './student-progress/types';
import { BatchReportTemplate } from './report/BatchReportTemplate';
import type { BatchReportData } from './report/BatchReportTemplate';
import { StudentReportTemplate } from './report/StudentReportTemplate';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function makeReportId(prefix: 'B' | 'S', id: string): string {
  const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  return `TC-${prefix}-${id.slice(0, 4)}-${dateStr}`;
}

function makeGeneratedAt(): string {
  return (
    new Date().toLocaleString('en-IN', {
      timeZone: 'Asia/Kolkata',
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }) + ' IST'
  );
}

// ─── Full batch shape from API ─────────────────────────────────────────────────

interface FullBatch {
  id: string;
  name: string;
  description: string | null;
  status: string;
  institute: { id: string | null; name: string | null };
  instructorCount: number;
  studentCount: number;
  instructors: Array<{ userId: string; name: string | null; email: string; profileImage: string | null }>;
  students: Array<{ userId: string; name: string | null; email: string }>;
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function TrendIcon({ trend }: { trend: 'up' | 'flat' | 'down' | null }) {
  if (trend === 'up') return <TrendingUp className="w-3.5 h-3.5 text-emerald-500" />;
  if (trend === 'down') return <TrendingDown className="w-3.5 h-3.5 text-rose-500" />;
  if (trend === 'flat') return <Minus className="w-3.5 h-3.5 text-brand-text-mute" />;
  return <span className="text-brand-text-mute text-xs">—</span>;
}

function bandTextColor(band: number | null): string {
  if (band === null) return 'text-brand-text-mute';
  if (band >= 7.5) return 'text-emerald-700 font-bold';
  if (band >= 6.0) return 'text-amber-700 font-bold';
  return 'text-rose-700 font-bold';
}

function gapTextColor(gap: number | null): string {
  if (gap === null) return 'text-brand-text-mute';
  if (gap <= -2) return 'text-rose-700 font-bold';
  if (gap <= -1) return 'text-amber-700 font-bold';
  return 'text-emerald-700 font-bold';
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export function InstructorReportPage() {
  const { toast } = useToast();
  const BACKEND = getBackendUrl();

  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  // Batch list
  const [batches, setBatches] = useState<FullBatch[]>([]);
  const [batchesLoading, setBatchesLoading] = useState(true);
  const [selectedBatchId, setSelectedBatchId] = useState<string | null>(null);

  // Dashboard summary
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [summaryLoading, setSummaryLoading] = useState(false);

  // Batch report
  const [batchReportLoading, setBatchReportLoading] = useState(false);
  const [batchReportData, setBatchReportData] = useState<BatchReportData | null>(null);

  // Student report — per-student loading state
  const [studentReportLoadingId, setStudentReportLoadingId] = useState<string | null>(null);
  const [studentReportData, setStudentReportData] = useState<{
    progress: StudentFullProgress;
    batchName: string;
    instituteName: string | null;
    instructorName: string | null;
    generatedAt: string;
    reportId: string;
  } | null>(null);

  // Student search filter
  const [studentSearch, setStudentSearch] = useState('');

  // ── Fetch batches on mount ────────────────────────────────────────────────
  useEffect(() => {
    async function fetchBatches() {
      setBatchesLoading(true);
      try {
        const res = await callBackend(`${BACKEND}/api/instructor/batches`);
        const list: FullBatch[] = res.data ?? res ?? [];
        setBatches(list);
        // Auto-select first ACTIVE batch
        const firstActive = list.find(b => b.status === 'ACTIVE') ?? list[0] ?? null;
        if (firstActive) setSelectedBatchId(firstActive.id);
      } catch (e) {
        toast({ title: 'Failed to load batches', variant: 'destructive' });
      } finally {
        setBatchesLoading(false);
      }
    }
    fetchBatches();
  }, [BACKEND]);

  // ── Fetch dashboard summary when batch changes ───────────────────────────
  useEffect(() => {
    if (!selectedBatchId) return;
    async function fetchSummary() {
      setSummaryLoading(true);
      setSummary(null);
      try {
        const res = await callBackend(
          `${BACKEND}/api/instructor/batches/${selectedBatchId}/dashboard-summary`
        );
        setSummary(res.data ?? res);
      } catch (e) {
        toast({ title: 'Failed to load batch analytics', variant: 'destructive' });
      } finally {
        setSummaryLoading(false);
      }
    }
    fetchSummary();
  }, [selectedBatchId, BACKEND]);

  // ── Selected batch object ────────────────────────────────────────────────
  const selectedBatch = batches.find(b => b.id === selectedBatchId) ?? null;

  // ── InstructorBatch shape for BatchSelector ──────────────────────────────
  const selectorBatches: InstructorBatch[] = batches.map(b => ({
    id: b.id,
    name: b.name,
    status: b.status,
    studentCount: b.studentCount,
    instructorCount: b.instructorCount,
  }));

  // ── Generate Batch Report ────────────────────────────────────────────────
  const handleGenerateBatchReport = useCallback(async () => {
    if (!selectedBatchId || !selectedBatch || !summary) return;
    setBatchReportLoading(true);
    try {
      const res = await callBackend(
        `${BACKEND}/api/instructor/batches/${selectedBatchId}/assessment-overview`
      );
      const overview: AssessmentOverview = res.data ?? res;

      const reportData: BatchReportData = {
        generatedAt: makeGeneratedAt(),
        reportId: makeReportId('B', selectedBatchId),
        batch: {
          id: selectedBatch.id,
          name: selectedBatch.name,
          description: selectedBatch.description,
          institute: { name: selectedBatch.institute.name },
          studentCount: selectedBatch.studentCount,
          instructors: selectedBatch.instructors.map(i => ({
            name: i.name,
            email: i.email,
          })),
        },
        engagement: {
          active_students: summary.engagement_today.active_students,
          avg_dcs: summary.engagement_today.avg_dcs,
          streaks_alive: summary.engagement_today.streaks_alive,
        },
        at_risk: summary.at_risk.map(s => ({
          student_id: s.student_id,
          name: s.name,
          avatar: s.avatar,
          primary_flag: s.primary_flag,
          flags: s.flags,
        })),
        band_overview: summary.band_overview.map(row => ({
          student_id: row.student_id,
          user_id: row.user_id,
          name: row.name,
          current_band: row.current_band,
          target_band: row.target_band,
          gap: row.gap,
          band_trend: row.band_trend,
          last_ia_date: row.last_ia_date,
          is_at_risk: row.is_at_risk,
        })),
        ia_summary: {
          avg_band: overview.batch_ia_summary.avg_band,
          completion_rate: overview.batch_ia_summary.completion_rate,
          high_miss_count: overview.batch_ia_summary.high_miss_count,
        },
        mock_summary: {
          avg_real_band: overview.batch_mock_summary.avg_real_band,
          at_or_above_target: overview.batch_mock_summary.at_or_above_target,
          no_mock_yet: overview.batch_mock_summary.no_mock_yet,
        },
        ia_overview: overview.ia_overview.map(r => ({
          student_id: r.student_id,
          name: r.name,
          ia_completed: r.ia_completed,
          ia_missed: r.ia_missed,
          avg_ia_band: r.avg_ia_band,
          last_ia_date: r.last_ia_date,
        })),
        diagnostic_overview: overview.diagnostic_overview.map(d => ({
          name: d.name,
          is_diagnosed: d.is_diagnosed,
          baseline_bands: d.baseline_bands,
          diagnosed_at: d.diagnosed_at,
        })),
      };

      setBatchReportData(reportData);
    } catch (e) {
      toast({ title: 'Failed to generate batch report', variant: 'destructive' });
    } finally {
      setBatchReportLoading(false);
    }
  }, [selectedBatchId, selectedBatch, summary, BACKEND, toast]);

  // ── Generate Student Report ──────────────────────────────────────────────
  const handleGenerateStudentReport = useCallback(
    async (studentRow: BandOverviewRow) => {
      if (!selectedBatchId || !selectedBatch) return;
      setStudentReportLoadingId(studentRow.student_id);
      try {
        const res = await callBackend(
          `${BACKEND}/api/instructor/batches/${selectedBatchId}/students/${studentRow.user_id}/full-progress`
        );
        const progress: StudentFullProgress = res.data ?? res;
        setStudentReportData({
          progress,
          batchName: selectedBatch.name,
          instituteName: selectedBatch.institute.name,
          instructorName: selectedBatch.instructors.map(i => i.name ?? i.email).join(', ') || null,
          generatedAt: makeGeneratedAt(),
          reportId: makeReportId('S', studentRow.student_id),
        });
      } catch (e) {
        toast({ title: 'Failed to load student data', variant: 'destructive' });
      } finally {
        setStudentReportLoadingId(null);
      }
    },
    [selectedBatchId, selectedBatch, BACKEND, toast]
  );

  // ── Filtered students ────────────────────────────────────────────────────
  const filteredStudents = (summary?.band_overview ?? []).filter(s =>
    s.name.toLowerCase().includes(studentSearch.toLowerCase())
  );

  // ── Render ───────────────────────────────────────────────────────────────
  return (
    <div className="relative min-h-screen font-plex antialiased overflow-x-hidden bg-brand-bg text-brand-text">
      <InstructorSidebar
        activeTab="report"
        isCollapsed={sidebarCollapsed}
        toggleCollapse={() => setSidebarCollapsed(c => !c)}
      />

      <div className={cn(
        'relative z-10 transition-all duration-300',
        sidebarCollapsed ? 'lg:pl-24' : 'lg:pl-72'
      )}>
        <InstructorTopbar />

        <main className="px-4 sm:px-6 lg:px-8 py-6 sm:py-8 pb-16">
          <div className="max-w-[1100px] mx-auto space-y-5">

            {/* ── Page Header ── */}
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
              <div>
                <h1 className="text-2xl font-black text-brand-text">Reports & Analytics</h1>
                <p className="text-sm text-brand-text-mute mt-0.5">
                  Generate PDF reports for batches and individual students
                </p>
              </div>
              <div className="shrink-0">
                <BatchSelector
                  batches={selectorBatches}
                  selectedBatchId={selectedBatchId}
                  onSelect={setSelectedBatchId}
                  loading={batchesLoading}
                />
              </div>
            </div>

            {/* ── Loading / content ── */}
            {!selectedBatchId && !batchesLoading ? (
              <div className="flex flex-col items-center justify-center py-24 text-center">
                <FileText className="w-10 h-10 text-brand-text-mute mb-3" />
                <p className="text-brand-text-mute text-sm">Select a batch to view analytics and generate reports.</p>
              </div>
            ) : summaryLoading ? (
              <div className="flex items-center justify-center py-24">
                <Loader2 className="w-6 h-6 animate-spin text-brand-teal-500" />
              </div>
            ) : summary ? (
              <>
                {/* ── Engagement Cards (2-col mobile / 4-col sm+) ── */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
                  {[
                    { label: 'Active Today', value: summary.engagement_today.active_students,
                      sub: `of ${selectedBatch?.studentCount ?? '?'}`, accent: 'bg-brand-teal-500' },
                    { label: 'Avg DCS', value: `${summary.engagement_today.avg_dcs.toFixed(1)}%`,
                      sub: 'daily challenge score', accent: 'bg-emerald-500' },
                    { label: 'Streaks Alive', value: summary.engagement_today.streaks_alive,
                      sub: 'active streaks', accent: 'bg-amber-500' },
                    { label: 'At-Risk', value: summary.at_risk.length,
                      sub: 'students flagged', accent: 'bg-rose-500' },
                  ].map(card => (
                    <div key={card.label} className="bg-white rounded-2xl border border-brand-line overflow-hidden shadow-sm">
                      <div className={`h-1 w-full ${card.accent}`} />
                      <div className="p-4 sm:p-5">
                        <div className="text-2xl sm:text-3xl font-black text-brand-text">{card.value}</div>
                        <div className="text-xs font-semibold text-brand-text mt-0.5">{card.label}</div>
                        <div className="text-[11px] text-brand-text-mute mt-0.5 hidden sm:block">{card.sub}</div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* ── Period Summary ── */}
                <div className="bg-white rounded-xl border border-brand-line px-4 sm:px-5 py-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-brand-text-mute shadow-sm">
                  <span className="font-semibold text-brand-text text-xs uppercase tracking-wider font-jetbrains">Period</span>
                  <span className="text-brand-text-mute">·</span>
                  <span className="text-sm">
                    IA last 7 days: <strong className="text-brand-teal-600">
                      {summary.period_summary.ia_completed_last_7_days}/{summary.period_summary.ia_total_students}
                    </strong> completed
                  </span>
                  <span className="text-brand-text-mute">·</span>
                  <span className="text-sm">
                    Mock this month: <strong className="text-brand-blue-600">
                      {summary.period_summary.mock_completed_this_month}/{summary.period_summary.mock_total_students}
                    </strong> completed
                  </span>
                </div>

                {/* ── Batch Report bar (above table) ── */}
                <div className="bg-white rounded-2xl border border-brand-line px-4 sm:px-5 py-4 flex items-center gap-4 shadow-sm">
                  <div className="w-9 h-9 rounded-xl bg-brand-teal-50 flex items-center justify-center shrink-0">
                    <FileText className="w-4 h-4 text-brand-teal-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-brand-text leading-tight">Batch Performance Report</p>
                    <p className="text-xs text-brand-text-mute mt-0.5 hidden sm:block">
                      Engagement · IA &amp; Mock performance · At-risk summary · Diagnostic baseline · All students
                    </p>
                  </div>
                  <button
                    onClick={handleGenerateBatchReport}
                    disabled={batchReportLoading}
                    className={cn(
                      'shrink-0 flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-bold transition-all',
                      batchReportLoading
                        ? 'bg-brand-bg-alt text-brand-text-mute cursor-not-allowed'
                        : 'bg-brand-teal-600 text-white hover:bg-brand-teal-700 active:scale-[0.98]'
                    )}
                  >
                    {batchReportLoading
                      ? <><Loader2 className="w-3.5 h-3.5 animate-spin" /><span className="hidden sm:inline">Generating…</span></>
                      : <><Download className="w-3.5 h-3.5" /><span className="hidden sm:inline">Generate PDF</span></>
                    }
                  </button>
                </div>

                {/* ── Student Band Overview + Report buttons ── */}
                <div className="bg-white rounded-2xl border border-brand-line overflow-hidden shadow-sm">
                  {/* Table header: title + search */}
                  <div className="px-4 sm:px-5 py-3.5 border-b border-brand-line flex flex-col sm:flex-row sm:items-center gap-3">
                    <div className="flex-1">
                      <h2 className="text-[11px] font-black uppercase tracking-wider text-brand-text-mute font-jetbrains">
                        Student Band Overview
                        <span className="ml-2 text-brand-text-mute font-semibold normal-case tracking-normal">
                          — click a row to generate a personal report
                        </span>
                      </h2>
                    </div>
                    <div className="relative w-full sm:w-56">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-brand-text-mute" />
                      <input
                        type="text"
                        value={studentSearch}
                        onChange={e => setStudentSearch(e.target.value)}
                        placeholder="Search students…"
                        className="w-full pl-8 pr-3 py-1.5 text-sm bg-brand-bg-alt border border-brand-line rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-teal-500/30 placeholder:text-brand-text-mute text-brand-text"
                      />
                    </div>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-sm min-w-[640px]">
                      <thead>
                        <tr className="border-b border-brand-line text-[10px] font-black uppercase tracking-wider text-brand-text-mute font-jetbrains">
                          <th className="text-left px-4 py-2.5 pl-5">Student</th>
                          <th className="text-left px-4 py-2.5">Band</th>
                          <th className="text-left px-4 py-2.5">Target</th>
                          <th className="text-left px-4 py-2.5">Gap</th>
                          <th className="text-left px-4 py-2.5 hidden md:table-cell">Trend</th>
                          <th className="text-left px-4 py-2.5 hidden lg:table-cell">Last IA</th>
                          <th className="text-left px-4 py-2.5">Risk</th>
                          <th className="text-right px-4 py-2.5 pr-5">Report</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-brand-line">
                        {filteredStudents.length === 0 ? (
                          <tr>
                            <td colSpan={8} className="py-10 text-center text-sm text-brand-text-mute">
                              {studentSearch ? `No students match "${studentSearch}"` : 'No students in this batch.'}
                            </td>
                          </tr>
                        ) : filteredStudents.map(row => (
                          <tr
                            key={row.student_id}
                            className="hover:bg-brand-bg-alt transition-colors group"
                          >
                            <td className="px-4 py-3 pl-5 font-semibold text-brand-text whitespace-nowrap">
                              {row.name}
                            </td>
                            <td className={cn('px-4 py-3 font-bold', bandTextColor(row.current_band))}>
                              {row.current_band ?? '—'}
                            </td>
                            <td className="px-4 py-3 text-brand-text-mute">
                              {row.target_band ?? '—'}
                            </td>
                            <td className={cn('px-4 py-3 font-bold', gapTextColor(row.gap))}>
                              {row.gap !== null ? (row.gap > 0 ? `+${row.gap}` : row.gap) : '—'}
                            </td>
                            <td className="px-4 py-3 hidden md:table-cell">
                              <TrendIcon trend={row.band_trend} />
                            </td>
                            <td className="px-4 py-3 text-xs text-brand-text-mute hidden lg:table-cell whitespace-nowrap">
                              {row.last_ia_date ?? '—'}
                            </td>
                            <td className="px-4 py-3">
                              {row.is_at_risk ? (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-rose-50 text-rose-700 text-[10px] font-bold border border-rose-200">
                                  <AlertTriangle className="w-2.5 h-2.5" /> At Risk
                                </span>
                              ) : (
                                <span className="inline-flex px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[10px] font-bold border border-emerald-200">
                                  On Track
                                </span>
                              )}
                            </td>
                            <td className="px-4 py-3 pr-5 text-right">
                              <button
                                onClick={() => handleGenerateStudentReport(row)}
                                disabled={studentReportLoadingId === row.student_id}
                                className={cn(
                                  'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all',
                                  studentReportLoadingId === row.student_id
                                    ? 'bg-brand-bg-alt text-brand-text-mute cursor-not-allowed'
                                    : 'bg-brand-blue-50 text-brand-blue-700 border border-brand-blue-200 hover:bg-brand-blue-100'
                                )}
                              >
                                {studentReportLoadingId === row.student_id
                                  ? <Loader2 className="w-3 h-3 animate-spin" />
                                  : <><Download className="w-3 h-3" /> Report</>
                                }
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </>
            ) : null}

          </div>
        </main>
      </div>

      {/* Batch Report Overlay */}
      {batchReportData && (
        <BatchReportTemplate data={batchReportData} onClose={() => setBatchReportData(null)} />
      )}

      {/* Student Report Overlay */}
      {studentReportData && (
        <StudentReportTemplate
          data={studentReportData.progress}
          batchName={studentReportData.batchName}
          instituteName={studentReportData.instituteName}
          instructorName={studentReportData.instructorName}
          generatedAt={studentReportData.generatedAt}
          reportId={studentReportData.reportId}
          onClose={() => setStudentReportData(null)}
        />
      )}
    </div>
  );
}
