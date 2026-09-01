// src/shared/components/assessments/AssessmentInsights.tsx
//
// Institute-wide assessment overview shell — dark "insights" hero + tab bar +
// table + a right-hand "needs your attention" rail. Shared by the Institute
// Owner and Institute Admin portals, which both call the same
// GET /assessment-overview shape and only differ in layout chrome and the
// student-progress route each row should link to.
import { useMemo, useState } from 'react';
import { ClipboardList, BookOpen, FileSearch, RefreshCw, Loader2, Download, Search } from 'lucide-react';
import { cn } from '@/shared/utils';
import { DiagnosticOverviewTab } from '@/features/instructor/components/assessments/DiagnosticOverviewTab';
import { IAOverviewTab } from '@/features/instructor/components/assessments/IAOverviewTab';
import { MockOverviewTab } from '@/features/instructor/components/assessments/MockOverviewTab';
import type { DiagnosticOverviewRow, IAOverviewRow, MockOverviewRow } from '@/features/instructor/components/assessments/types';

export interface AssessmentOverviewData {
  ia_overview:         IAOverviewRow[];
  mock_overview:       MockOverviewRow[];
  diagnostic_overview: DiagnosticOverviewRow[];
  institute_ia_summary:   { avg_band: number; completion_rate: number; high_miss_count: number };
  institute_mock_summary: { avg_real_band: number; at_or_above_target: number; no_mock_yet: number };
}

interface BatchOption { id: string; name: string }

interface Props {
  data:    AssessmentOverviewData | null;
  loading: boolean;
  error:   string | null;
  batches: BatchOption[];
  batchFilter: string;
  onBatchChange: (v: string) => void;
  onRefresh: () => void;
  progressPathFor: (userId: string) => string;
}

type Tab = 'diagnostic' | 'ia' | 'mock';
type BandFilter = 'all' | 'below5' | 'above6';
type SkillKey = 'L' | 'R' | 'W' | 'S';
type SkillFilter = SkillKey | 'overall';

const SKILL_FILTERS: { key: SkillFilter; label: string }[] = [
  { key: 'overall', label: 'Overall' },
  { key: 'L',       label: 'List'    },
  { key: 'R',       label: 'Read'    },
  { key: 'W',       label: 'Writ'    },
  { key: 'S',       label: 'Speak'   },
];

const BAND_RANGES = [
  { label: '<5.0',    color: 'bg-rose-600',    test: (b: number) => b < 5.0 },
  { label: '5.0–5.9', color: 'bg-emerald-500', test: (b: number) => b >= 5.0 && b < 6.0 },
  { label: '6.0–6.9', color: 'bg-emerald-400', test: (b: number) => b >= 6.0 && b < 7.0 },
  { label: '7.0–7.9', color: 'bg-emerald-300', test: (b: number) => b >= 7.0 && b < 8.0 },
  { label: '≥8.0',    color: 'bg-emerald-200', test: (b: number) => b >= 8.0 },
] as const;

function overallBand(bands: DiagnosticOverviewRow['baseline_bands']): number | null {
  const vals = [bands.L, bands.R, bands.W, bands.S].filter((v): v is number => v !== null);
  if (vals.length === 0) return null;
  return Math.round((vals.reduce((a, b) => a + b, 0) / vals.length) * 10) / 10;
}

function StatTile({ label, value, sub, dark }: { label: string; value: string | number; sub?: string; dark?: boolean }) {
  return (
    <div className={cn('rounded-xl px-4 py-3', dark ? 'bg-white/5 border border-white/10' : 'bg-white border border-brand-line')}>
      <p className={cn('text-[10px] font-bold uppercase tracking-wider font-jetbrains', dark ? 'text-white/50' : 'text-brand-text-mute')}>{label}</p>
      <p className={cn('text-2xl font-black tabular-nums mt-0.5', dark ? 'text-white' : 'text-brand-text')}>{value}</p>
      {sub && <p className={cn('text-[11px] mt-0.5', dark ? 'text-white/40' : 'text-brand-text-mute')}>{sub}</p>}
    </div>
  );
}

export function AssessmentInsights({ data, loading, error, batches, batchFilter, onBatchChange, onRefresh, progressPathFor }: Props) {
  const [activeTab, setActiveTab] = useState<Tab>('diagnostic');
  const [bandFilter, setBandFilter] = useState<BandFilter>('all');
  const [skillFilter, setSkillFilter] = useState<SkillFilter>('overall');
  const [search, setSearch] = useState('');

  const diagRows = data?.diagnostic_overview ?? [];
  const iaRows   = data?.ia_overview ?? [];
  const mockRows = data?.mock_overview ?? [];
  const totalStudents = diagRows.length;

  const diagEnriched = useMemo(
    () => diagRows.map(r => ({ ...r, overall: overallBand(r.baseline_bands) })),
    [diagRows]
  );
  const diagnosed = diagEnriched.filter(r => r.is_diagnosed);
  const diagnosedCount = diagnosed.length;
  const diagBands = diagnosed.map(r => r.overall).filter((v): v is number => v !== null);
  const avgBand = diagBands.length > 0 ? diagBands.reduce((a, b) => a + b, 0) / diagBands.length : null;
  const atRiskCount = diagBands.filter(b => b < 5.0).length;

  // Band distribution — driven by skillFilter, always sourced from diagnostic data
  // (the only rows with a per-skill breakdown).
  const distBands = skillFilter === 'overall'
    ? diagBands
    : diagnosed.map(r => r.baseline_bands[skillFilter]).filter((v): v is number => v !== null);
  const distCounts = BAND_RANGES.map(r => distBands.filter(r.test).length);
  const distMax = Math.max(...distCounts, 1);

  const avgBySkill: { label: string; key: SkillKey; value: number | null }[] = [
    { label: 'Listening', key: 'L', value: null },
    { label: 'Reading',   key: 'R', value: null },
    { label: 'Writing',   key: 'W', value: null },
    { label: 'Speaking',  key: 'S', value: null },
  ].map(s => {
    const vals = diagnosed.map(r => r.baseline_bands[s.key as SkillKey]).filter((v): v is number => v !== null);
    return { ...s, value: vals.length ? Math.round((vals.reduce((a, b) => a + b, 0) / vals.length) * 10) / 10 : null };
  });

  const missing2PlusIAs = data?.institute_ia_summary.high_miss_count ?? 0;
  const pendingDiagnostics = totalStudents - diagnosedCount;
  const coveragePct = totalStudents > 0 ? Math.round((diagnosedCount / totalStudents) * 100) : 0;

  // Band-based sub-filter applies to whichever tab is active, using that tab's
  // primary band metric.
  const filteredDiagRows = useMemo(() => {
    if (bandFilter === 'all') return diagRows;
    return diagRows.filter(r => {
      const b = overallBand(r.baseline_bands);
      if (b === null) return false;
      return bandFilter === 'below5' ? b < 5.0 : b >= 6.0;
    });
  }, [diagRows, bandFilter]);

  const filteredIaRows = useMemo(() => {
    if (bandFilter === 'all') return iaRows;
    return iaRows.filter(r => {
      if (r.avg_ia_band === null) return false;
      return bandFilter === 'below5' ? r.avg_ia_band < 5.0 : r.avg_ia_band >= 6.0;
    });
  }, [iaRows, bandFilter]);

  const filteredMockRows = useMemo(() => {
    if (bandFilter === 'all') return mockRows;
    return mockRows.filter(r => {
      if (r.latest_real_band === null) return false;
      return bandFilter === 'below5' ? r.latest_real_band < 5.0 : r.latest_real_band >= 6.0;
    });
  }, [mockRows, bandFilter]);

  const searched = <T extends { name: string }>(rows: T[]) =>
    search ? rows.filter(r => r.name.toLowerCase().includes(search.toLowerCase())) : rows;

  const below5Count = diagBands.filter(b => b < 5.0).length;
  const above6Count = diagBands.filter(b => b >= 6.0).length;

  const TABS: Array<{ id: Tab; label: string; icon: React.ReactNode; count: number }> = [
    { id: 'diagnostic', label: 'Diagnostic', icon: <FileSearch className="h-4 w-4" />, count: diagRows.length },
    { id: 'ia', label: 'Internal Assessments', icon: <ClipboardList className="h-4 w-4" />, count: iaRows.length },
    { id: 'mock', label: 'Mock Tests', icon: <BookOpen className="h-4 w-4" />, count: mockRows.length },
  ];

  const exportCsv = () => {
    const rows = activeTab === 'diagnostic' ? searched(filteredDiagRows)
      : activeTab === 'ia' ? searched(filteredIaRows)
      : searched(filteredMockRows);
    const csv = ['name'].concat(rows.map((r: any) => `"${r.name.replace(/"/g, '""')}"`)).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `${activeTab}-export.csv`; a.click();
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="space-y-5 animate-pulse">
        <div className="h-56 bg-brand-ink/90 rounded-2xl" />
        <div className="h-64 bg-brand-bg-alt rounded-2xl" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-rose-50 border border-rose-200 rounded-2xl p-8 text-center">
        <p className="text-rose-700 font-semibold text-sm">{error}</p>
        <button onClick={onRefresh} className="mt-3 text-xs font-bold text-rose-600 hover:underline">Try again</button>
      </div>
    );
  }

  if (!data) return null;

  const heroTitle = activeTab === 'diagnostic'
    ? `${diagnosedCount} of ${totalStudents} students have a baseline`
    : activeTab === 'ia'
    ? `${data.institute_ia_summary.completion_rate}% of students have sat an internal assessment`
    : `${data.institute_mock_summary.at_or_above_target} students are at or above their target band`;

  const heroSubtitle = activeTab === 'diagnostic'
    ? 'The diagnostic is the starting line for every other number on this page. Until a student sits it, nothing about them can be measured.'
    : activeTab === 'ia'
    ? 'Internal assessments track progress between the baseline and the next mock — missed ones are the earliest warning sign.'
    : 'Mock tests are the closest proxy to exam day. A widening gap to target band here is the clearest signal to intervene.';

  return (
    <div className="space-y-5">
      {/* Dark insights hero */}
      <div className="rounded-2xl bg-brand-ink p-5 sm:p-6 text-white">
        <div className="flex flex-col lg:flex-row lg:items-start gap-6">
          <div className="flex-1 min-w-0">
            <p className="font-jetbrains text-[10px] font-bold uppercase tracking-[0.15em] text-white/40 mb-2">
              Whole institute · {totalStudents} students
            </p>
            <h2 className="font-manrope text-xl sm:text-2xl font-black tracking-tight">{heroTitle}</h2>
            <p className="text-sm text-white/60 mt-1.5 max-w-2xl">{heroSubtitle}</p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 mt-4 max-w-md">
              {activeTab === 'diagnostic' && (
                <>
                  <StatTile dark label="Diagnosed" value={`${diagnosedCount} of ${totalStudents}`} />
                  <StatTile dark label="Avg band" value={avgBand !== null ? avgBand.toFixed(1) : '—'} />
                  <StatTile dark label="At risk" value={atRiskCount} sub="below 5.0" />
                </>
              )}
              {activeTab === 'ia' && (
                <>
                  <StatTile dark label="Avg IA band" value={data.institute_ia_summary.avg_band || '—'} />
                  <StatTile dark label="Completion" value={`${data.institute_ia_summary.completion_rate}%`} />
                  <StatTile dark label="Missing 2+" value={data.institute_ia_summary.high_miss_count} />
                </>
              )}
              {activeTab === 'mock' && (
                <>
                  <StatTile dark label="Avg mock band" value={data.institute_mock_summary.avg_real_band || '—'} />
                  <StatTile dark label="At target" value={data.institute_mock_summary.at_or_above_target} />
                  <StatTile dark label="Never sat" value={data.institute_mock_summary.no_mock_yet} />
                </>
              )}
            </div>
          </div>

          {activeTab === 'diagnostic' && (
            <div className="lg:w-[360px] shrink-0">
              <div className="flex items-center justify-between mb-2">
                <p className="font-jetbrains text-[10px] font-bold uppercase tracking-[0.15em] text-white/40">Band distribution</p>
                <div className="flex items-center gap-0.5 bg-white/5 rounded-lg p-0.5">
                  {SKILL_FILTERS.map(f => (
                    <button
                      key={f.key}
                      onClick={() => setSkillFilter(f.key)}
                      className={cn(
                        'px-2 py-1 rounded-md text-[10px] font-bold transition-colors',
                        skillFilter === f.key ? 'bg-white text-brand-ink' : 'text-white/60 hover:text-white'
                      )}
                    >
                      {f.label}
                    </button>
                  ))}
                </div>
              </div>
              <div className="flex items-end gap-1.5 sm:gap-3 justify-between h-24 bg-white/5 rounded-xl px-3 sm:px-4 py-3">
                {BAND_RANGES.map((r, i) => (
                  <div key={r.label} className="flex flex-col items-center gap-1 flex-1">
                    <span className="text-[11px] font-black">{distCounts[i]}</span>
                    <div
                      className={cn('w-full max-w-[28px] rounded-t-sm transition-all', r.color)}
                      style={{ height: `${Math.max((distCounts[i] / distMax) * 100, 4)}%` }}
                    />
                    <span className="text-[9px] font-bold text-white/50 whitespace-nowrap">{r.label}</span>
                  </div>
                ))}
              </div>
              {diagnosedCount > 0 && below5Count > 0 && (
                <p className="text-[11px] text-white/40 mt-2">
                  {below5Count} of {diagnosedCount} diagnosed students sit under band 6.0.
                </p>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Tab bar + sub-filters + search/export */}
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2 min-w-0">
          {/* Each pill group scrolls on its own below sm. Previously these sat in
              a flex-wrap row with no inner scroll, so wide groups were clipped
              by the page's overflow-x-hidden root and became unreachable. */}
          <div className="-mx-4 px-4 sm:mx-0 sm:px-0 overflow-x-auto no-scrollbar max-w-full">
          <div className="bg-white rounded-xl border border-brand-line shadow-sm p-1 flex gap-1 w-fit">
            {TABS.map(tab => (
              <button
                key={tab.id}
                onClick={() => { setActiveTab(tab.id); setBandFilter('all'); }}
                className={cn(
                  'flex items-center gap-2 min-h-[38px] px-3 rounded-lg text-sm font-semibold transition-colors whitespace-nowrap',
                  activeTab === tab.id ? 'bg-brand-teal-600 text-white' : 'text-brand-text-mute hover:text-brand-text hover:bg-brand-bg-alt'
                )}
              >
                {tab.icon}{tab.label}
                <span className={cn('text-[10px] font-bold px-1.5 py-0.5 rounded-full', activeTab === tab.id ? 'bg-white/20' : 'bg-brand-bg-alt')}>
                  {tab.count}
                </span>
              </button>
            ))}
          </div>
          </div>

          <div className="-mx-4 px-4 sm:mx-0 sm:px-0 overflow-x-auto no-scrollbar max-w-full">
          <div className="bg-white rounded-xl border border-brand-line shadow-sm p-1 flex gap-1 w-fit">
            {([
              { id: 'all', label: `All diagnosed`, sub: diagRows.length },
              { id: 'below5', label: 'Below band 5.0', sub: below5Count },
              { id: 'above6', label: 'Band 6.0+', sub: above6Count },
            ] as const).map(f => (
              <button
                key={f.id}
                onClick={() => setBandFilter(f.id)}
                className={cn(
                  'flex items-center gap-1.5 min-h-[38px] px-3 rounded-lg text-xs font-semibold transition-colors whitespace-nowrap',
                  bandFilter === f.id ? 'bg-brand-bg-alt text-brand-text ring-1 ring-brand-line' : 'text-brand-text-mute hover:text-brand-text'
                )}
              >
                <span className={cn('h-1.5 w-1.5 rounded-full', f.id === 'below5' ? 'bg-rose-500' : f.id === 'above6' ? 'bg-emerald-500' : 'bg-brand-text-mute')} />
                {f.label} <span className="tabular-nums opacity-70">{f.sub}</span>
              </button>
            ))}
          </div>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            {batches.length > 0 && (
              <select
                value={batchFilter}
                onChange={e => onBatchChange(e.target.value)}
                aria-label="Filter by batch"
                className="min-h-[38px] rounded-xl border border-brand-line bg-white px-3 text-sm font-semibold text-brand-text flex-1 sm:flex-none min-w-0"
              >
                <option value="">All batches</option>
                {batches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
              </select>
            )}

            <button
              onClick={onRefresh}
              aria-label="Refresh"
              className="inline-flex items-center gap-2 min-h-[38px] px-3 rounded-xl border border-brand-line bg-white text-sm font-semibold hover:bg-brand-bg-alt shrink-0"
            >
              <RefreshCw className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="relative flex-1 sm:flex-none sm:w-56 min-w-0">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-brand-text-mute" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search students…"
              className="w-full pl-9 pr-3 min-h-[38px] py-2 text-sm bg-white border border-brand-line rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-teal-500/30 text-brand-text placeholder:text-brand-text-mute"
            />
          </div>
          <button
            onClick={exportCsv}
            className="inline-flex items-center gap-2 min-h-[38px] px-3 rounded-xl border border-brand-line bg-white text-sm font-semibold hover:bg-brand-bg-alt shrink-0"
          >
            <Download className="h-4 w-4" /> <span className="hidden sm:inline">Export</span>
          </button>
        </div>
      </div>

      {/* Main grid: table + right rail */}
      <div className="grid grid-cols-1 xl:grid-cols-[1fr_320px] gap-5 items-start">
        <div className="min-w-0">
          {activeTab === 'diagnostic' && (
            <DiagnosticOverviewTab
              rows={searched(filteredDiagRows)}
              batchId={batchFilter}
              refetch={onRefresh}
              progressPathFor={progressPathFor}
              compact
            />
          )}
          {activeTab === 'ia' && (
            <IAOverviewTab rows={searched(filteredIaRows)} batchId={batchFilter} progressPathFor={progressPathFor} />
          )}
          {activeTab === 'mock' && (
            <MockOverviewTab rows={searched(filteredMockRows)} batchId={batchFilter} progressPathFor={progressPathFor} />
          )}
        </div>

        <div className="space-y-4">
          <div className="bg-white rounded-2xl border border-brand-line p-4">
            <p className="font-jetbrains text-[10px] font-bold uppercase tracking-[0.15em] text-brand-text-mute mb-2">Needs your attention</p>
            <p className="text-sm text-brand-text leading-snug">
              {pendingDiagnostics > 0
                ? `${pendingDiagnostics} students still have no baseline, and ${atRiskCount} of the ${diagnosedCount} diagnosed sit below band 5.0.`
                : `All students have a baseline. ${atRiskCount} sit below band 5.0.`}
            </p>
            <div className="mt-3 space-y-1.5">
              {[
                { label: 'Chase pending diagnostics', value: pendingDiagnostics },
                { label: 'Review at-risk students', value: atRiskCount },
                { label: 'Students missing 2+ IAs', value: missing2PlusIAs },
              ].map(item => (
                <button
                  key={item.label}
                  onClick={() => { setActiveTab('diagnostic'); setBandFilter(item.label.includes('at-risk') ? 'below5' : 'all'); }}
                  className="w-full flex items-center justify-between px-3 py-2 rounded-lg bg-brand-bg-alt hover:bg-brand-bg-alt/70 text-left transition-colors"
                >
                  <span className="text-xs font-semibold text-brand-text">{item.label}</span>
                  <span className="text-xs font-black text-brand-teal-600 tabular-nums">{item.value} →</span>
                </button>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-brand-line p-4">
            <p className="font-jetbrains text-[10px] font-bold uppercase tracking-[0.15em] text-brand-text-mute mb-1">Average band by skill</p>
            <p className="text-[11px] text-brand-text-mute mb-3">Across the {diagnosedCount} diagnosed students.</p>
            <div className="space-y-2.5">
              {avgBySkill.map(s => (
                <div key={s.key}>
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="font-semibold text-brand-text">{s.label}</span>
                    <span className="font-black tabular-nums text-brand-text">{s.value ?? '—'}</span>
                  </div>
                  <div className="h-1.5 rounded-full bg-brand-bg-alt overflow-hidden">
                    <div
                      className={cn('h-full rounded-full', s.value !== null && s.value < 5.0 ? 'bg-rose-500' : 'bg-brand-teal-500')}
                      style={{ width: `${s.value !== null ? Math.min((s.value / 9) * 100, 100) : 0}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-brand-line p-4">
            <p className="font-jetbrains text-[10px] font-bold uppercase tracking-[0.15em] text-brand-text-mute mb-2">Coverage</p>
            <p className="text-3xl font-black tabular-nums text-brand-text">{coveragePct}%</p>
            <p className="text-[11px] text-brand-text-mute mb-3">{diagnosedCount} of {totalStudents} diagnosed</p>
            <div className="flex gap-0.5 h-2.5 rounded-full overflow-hidden">
              {Array.from({ length: 24 }).map((_, i) => (
                <div key={i} className={cn('flex-1 rounded-sm', i / 24 * 100 < coveragePct ? 'bg-brand-teal-500' : 'bg-rose-200')} />
              ))}
            </div>
            <div className="flex items-center gap-3 mt-2 text-[10px] text-brand-text-mute">
              <span className="flex items-center gap-1"><span className="h-1.5 w-1.5 rounded-full bg-brand-teal-500" /> Diagnosed</span>
              <span className="flex items-center gap-1"><span className="h-1.5 w-1.5 rounded-full bg-rose-200" /> Not started</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
