import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search, ExternalLink, AlertCircle,
  ArrowUpDown, ArrowUp, ArrowDown,
  Users, TrendingUp, AlertTriangle, Clock,
} from 'lucide-react';
import { cn } from '@/shared/utils';
import type { DiagnosticOverviewRow } from './types';
import { CEFR_ORDER, cefrBg, cefrColor, cefrGaugeColor } from '@/features/student/config/cefrDisplay';

interface Props {
  rows:     DiagnosticOverviewRow[];
  batchId:  string;
  refetch?: () => void;
  /** See IAOverviewTab — defaults to the instructor route. */
  progressPathFor?: (userId: string) => string;
  /** Hides the built-in stat cards + band-distribution chart — used when a
   *  parent shell (e.g. AssessmentInsights) already renders that summary. */
  compact?: boolean;
}

// REMOVED: the per-row "Retake" control and its confirmation modal.
//
// It POSTed to `/api/instructor/batches/:batchId/students/:id/diagnostic/retake`,
// a route that does not exist in the backend — every click 404'd. It was never a
// working feature.
//
// Not reinstated for owner/admin either: they already reset a diagnostic from the
// Diagnostic tab of the student progress page (`onRequestReset` →
// POST /students/:id/diagnostic/reset), which is the one real implementation. A
// second entry point here would only be a duplicate path to the same action.

type SkillKey = 'L' | 'R' | 'W' | 'S';
const SKILLS: { key: SkillKey; label: string }[] = [
  { key: 'L', label: 'Listening' },
  { key: 'R', label: 'Reading'   },
  { key: 'W', label: 'Writing'   },
  { key: 'S', label: 'Speaking'  },
];

type SortKey = 'name' | 'status' | 'overall' | 'diagnosed_at';

function overallBand(bands: DiagnosticOverviewRow['baseline_bands']): number | null {
  const vals = [bands.L, bands.R, bands.W, bands.S].filter((v): v is number => v !== null);
  if (vals.length === 0) return null;
  return Math.round((vals.reduce((a, b) => a + b, 0) / vals.length) * 10) / 10;
}

// The backend's diagnostic-overview endpoint doesn't tag rows with an exam id, so
// IELTS vs Spoken English can't be told apart by a dedicated field — but it can be
// told apart structurally: a diagnosed Spoken English row only ever has its S field
// populated (L/R/W stay null, since SE has exactly one skill), while a diagnosed
// IELTS row always has all four. See AssessmentInsights.tsx for the fuller
// rationale — same signature, reused here so this table never plots an SE
// student's CEFR ordinal on the 0-9 band scale below.
function isSpokenEnglishShape(bands: DiagnosticOverviewRow['baseline_bands']): boolean {
  return bands.S !== null && bands.L === null && bands.R === null && bands.W === null;
}

function cefrLevelLabel(ordinal: number | null): string | null {
  if (ordinal === null) return null;
  const i = Math.max(0, Math.min(CEFR_ORDER.length - 1, Math.round(ordinal)));
  return CEFR_ORDER[i];
}

function cefrPill(ordinal: number | null) {
  const label = cefrLevelLabel(ordinal);
  if (label === null) return <span className="text-brand-text-mute text-xs">—</span>;
  return (
    <span className={cn('inline-block px-2 py-0.5 rounded-lg text-xs font-black border', cefrBg(label), cefrColor(label))}>
      {label}
    </span>
  );
}

function bandPill(b: number | null) {
  if (b === null) return <span className="text-brand-text-mute text-xs">—</span>;
  const cls = b >= 7.0
    ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
    : b >= 5.5
    ? 'bg-amber-50 text-amber-700 border-amber-200'
    : 'bg-rose-50 text-rose-700 border-rose-200';
  return (
    <span className={cn('inline-block px-2 py-0.5 rounded-lg text-xs font-black border', cls)}>
      {b.toFixed(1)}
    </span>
  );
}

function Avatar({ name, avatar }: { name: string; avatar: string | null }) {
  if (avatar) {
    return <img src={avatar} alt={name} className="h-8 w-8 rounded-full object-cover" />;
  }
  const initials = name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || '?';
  return (
    <div className="h-8 w-8 rounded-full bg-brand-teal-100 flex items-center justify-center shrink-0">
      <span className="text-[11px] font-black text-brand-teal-600">{initials}</span>
    </div>
  );
}

function SortIcon({ col, active, dir }: { col: SortKey; active: SortKey; dir: 'asc' | 'desc' }) {
  if (col !== active) return <ArrowUpDown className="h-3 w-3 text-brand-text-mute ml-1 shrink-0" />;
  return dir === 'asc'
    ? <ArrowUp   className="h-3 w-3 text-brand-teal-500 ml-1 shrink-0" />
    : <ArrowDown className="h-3 w-3 text-brand-teal-500 ml-1 shrink-0" />;
}

// 5 columns per spec: <5.0 / 5.0–5.5 / 6.0–6.5 / 7.0–7.5 / >=8.0
const BAND_RANGES = [
  { label: '<5.0',      key: 'r1', color: 'bg-rose-500',    textCls: 'text-rose-700',    test: (b: number) => b < 5.0 },
  { label: '5.0–5.9',   key: 'r2', color: 'bg-orange-500',  textCls: 'text-orange-700', test: (b: number) => b >= 5.0 && b < 6.0 },
  { label: '6.0–6.9',   key: 'r3', color: 'bg-amber-500',   textCls: 'text-amber-700',   test: (b: number) => b >= 6.0 && b < 7.0 },
  { label: '7.0–7.9',   key: 'r4', color: 'bg-lime-500',    textCls: 'text-lime-700',     test: (b: number) => b >= 7.0 && b < 8.0 },
  { label: '≥8.0',      key: 'r5', color: 'bg-emerald-500', textCls: 'text-emerald-700', test: (b: number) => b >= 8.0 },
] as const;

type SkillFilter = SkillKey | 'overall';
const SKILL_FILTERS: { key: SkillFilter; label: string }[] = [
  { key: 'overall', label: 'Overall'   },
  { key: 'L',       label: 'Listening' },
  { key: 'R',       label: 'Reading'   },
  { key: 'W',       label: 'Writing'   },
  { key: 'S',       label: 'Speaking'  },
];

function BandDistribution({ rows, skillFilter }: { rows: DiagnosticOverviewRow[]; skillFilter: SkillFilter }) {
  const diagnosed = rows.filter(r => r.is_diagnosed);
  const bands = skillFilter === 'overall'
    ? diagnosed.map(r => overallBand(r.baseline_bands)).filter((v): v is number => v !== null)
    : diagnosed.map(r => r.baseline_bands[skillFilter]).filter((v): v is number => v !== null);

  if (bands.length === 0) {
    return (
      <div className="text-center py-4 text-xs text-brand-text-mute">
        No band data yet
      </div>
    );
  }

  const counts = BAND_RANGES.map(range => bands.filter(range.test).length);
  const max = Math.max(...counts, 1);

  return (
    <div className="flex items-end gap-3 justify-center h-16">
      {BAND_RANGES.map((range, i) => {
        const count = counts[i];
        const pct = (count / max) * 100;
        return (
          <div key={range.key} className="flex flex-col items-center gap-1 min-w-[48px]">
            <span className="text-[10px] font-black text-brand-text">{count}</span>
            <div
              className={cn('w-8 rounded-t-sm transition-all', range.color)}
              style={{ height: `${Math.max(pct, 4)}%` }}
            />
            <span className={cn('text-[9px] font-bold whitespace-nowrap', range.textCls)}>
              {range.label}
            </span>
          </div>
        );
      })}
    </div>
  );
}

export function DiagnosticOverviewTab({ rows, batchId, refetch, progressPathFor, compact = false }: Props) {
  const navigate = useNavigate();
  const [search,        setSearch]        = useState('');
  const [sortKey,       setSortKey]       = useState<SortKey>('status');
  const [sortDir,       setSortDir]       = useState<'asc' | 'desc'>('asc');
  const [atRiskOnly,    setAtRiskOnly]    = useState(false);
  const [skillFilter,   setSkillFilter]   = useState<SkillFilter>('overall');

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    } else {
      setSortKey(key);
      setSortDir(key === 'name' ? 'asc' : 'desc');
    }
  };

  // Split off diagnosed Spoken English rows (see isSpokenEnglishShape) so their CEFR
  // ordinal never lands in the IELTS band table/stats/distribution below. A row that
  // isn't yet diagnosed has every band null and can't be told apart by shape, so it
  // stays in mainRows (same as before this split existed) until it's diagnosed. When
  // an institute has no SE students, mainRows === rows and everything below is
  // unchanged.
  const mainRows          = useMemo(() => rows.filter(r => !(r.is_diagnosed && isSpokenEnglishShape(r.baseline_bands))), [rows]);
  const seDiagnosedRows   = useMemo(() => rows.filter(r => r.is_diagnosed && isSpokenEnglishShape(r.baseline_bands)), [rows]);
  const hasSE             = seDiagnosedRows.length > 0;

  const seOrdinals    = seDiagnosedRows.map(r => r.baseline_bands.S).filter((v): v is number => v !== null);
  const seLevelCounts = CEFR_ORDER.map((_, i) => seOrdinals.filter(v => Math.round(v) === i).length);
  const seLevelMax    = Math.max(...seLevelCounts, 1);

  const enriched = useMemo(() => mainRows.map(r => ({
    ...r,
    overall: overallBand(r.baseline_bands),
  })), [mainRows]);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    let list = q ? enriched.filter(r => r.name.toLowerCase().includes(q)) : enriched;
    if (atRiskOnly) {
      list = list.filter(r => r.overall !== null && r.overall < 5.5);
    }

    return [...list].sort((a, b) => {
      let av: number | string, bv: number | string;
      switch (sortKey) {
        case 'name':
          av = a.name; bv = b.name; break;
        case 'status':
          av = a.is_diagnosed ? 1 : 0; bv = b.is_diagnosed ? 1 : 0; break;
        case 'overall':
          av = a.overall ?? (sortDir === 'asc' ? Infinity : -Infinity);
          bv = b.overall ?? (sortDir === 'asc' ? Infinity : -Infinity);
          break;
        case 'diagnosed_at': {
          const sentinel = sortDir === 'asc' ? '9999-99-99' : '';
          av = a.diagnosed_at ?? sentinel;
          bv = b.diagnosed_at ?? sentinel;
          return sortDir === 'asc' ? (av as string).localeCompare(bv as string) : (bv as string).localeCompare(av as string);
        }
        default: av = 0; bv = 0;
      }
      if (typeof av === 'string' && typeof bv === 'string') {
        return sortDir === 'asc' ? av.localeCompare(bv) : bv.localeCompare(av);
      }
      return sortDir === 'asc' ? (av as number) - (bv as number) : (bv as number) - (av as number);
    });
  }, [enriched, search, sortKey, sortDir]);

  const goToStudent = (row: DiagnosticOverviewRow) => {
    const path = progressPathFor
      ? progressPathFor(row.user_id)
      : `/instructor/batches/${batchId}/students/${row.user_id}/progress`;
    navigate(path, { state: { studentId: row.user_id, initialTab: 'diagnostic' } });
  };


  const thClass = 'py-3 text-[10px] font-bold text-brand-text-mute uppercase tracking-wider whitespace-nowrap font-jetbrains';
  const sortTh = (label: string, key: SortKey, cls?: string) => (
    <th
      className={cn(thClass, 'cursor-pointer select-none hover:text-brand-text transition-colors', cls)}
      onClick={() => handleSort(key)}
    >
      <span className="flex items-center gap-0.5">
        {label}
        <SortIcon col={key} active={sortKey} dir={sortDir} />
      </span>
    </th>
  );

  if (rows.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-brand-line p-16 text-center">
        <p className="text-brand-text-mute text-sm">No students in this batch yet.</p>
      </div>
    );
  }

  // "Completed"/"Pending" are whole-batch counts (every exam type); the SE-diagnosed
  // rows split out of mainRows above are still diagnosed students, just not counted
  // toward the IELTS band stats below.
  const diagnosedAllCount = rows.filter(r => r.is_diagnosed).length;
  const pendingCount      = rows.length - diagnosedAllCount;

  const diagnosed    = enriched.filter(r => r.is_diagnosed);
  const diagBands    = diagnosed.map(r => r.overall).filter((v): v is number => v !== null);
  const avgBand      = diagBands.length > 0 ? diagBands.reduce((a, b) => a + b, 0) / diagBands.length : null;
  const atRiskCount  = diagBands.filter(b => b < 5.5).length;

  const stats = [
    { label: 'Completed',  value: `${diagnosedAllCount}/${rows.length}`, icon: Users,          color: 'text-emerald-600', bg: 'bg-emerald-50', clickable: false },
    { label: 'Avg Band',   value: avgBand !== null ? avgBand.toFixed(1) : '—', icon: TrendingUp,  color: avgBand !== null && avgBand >= 7.0 ? 'text-emerald-600' : avgBand !== null && avgBand >= 5.5 ? 'text-amber-600' : 'text-brand-text-mute', bg: 'bg-brand-bg-alt', clickable: false },
    { label: 'At Risk',    value: String(atRiskCount), icon: AlertTriangle,    color: atRiskCount > 0 ? 'text-rose-600' : 'text-brand-text-mute', bg: atRiskCount > 0 ? 'bg-rose-50' : 'bg-brand-bg-alt', clickable: atRiskCount > 0 },
    { label: 'Pending',    value: String(pendingCount), icon: Clock,           color: pendingCount > 0 ? 'text-amber-600' : 'text-brand-text-mute', bg: pendingCount > 0 ? 'bg-amber-50' : 'bg-brand-bg-alt', clickable: false },
  ];

  return (
    <div className="space-y-4">
      {/* Summary stat cards */}
      {!compact && (
      <>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {stats.map(s => {
          const isAtRisk = s.label === 'At Risk';
          const active = isAtRisk && atRiskOnly;
          const Wrapper = s.clickable ? 'button' : 'div';
          return (
            <Wrapper
              key={s.label}
              type={s.clickable ? 'button' : undefined}
              onClick={s.clickable ? () => setAtRiskOnly(v => !v) : undefined}
              className={cn(
                'bg-white rounded-xl border px-4 py-3 flex items-center gap-3 text-left w-full transition-colors',
                active ? 'border-rose-400 ring-2 ring-rose-200' : 'border-brand-line',
                s.clickable && 'cursor-pointer hover:border-rose-300'
              )}
              title={isAtRisk ? 'Click to filter students with any skill below band 5.5' : undefined}
            >
              <div className={cn('h-9 w-9 rounded-lg flex items-center justify-center shrink-0', s.bg)}>
                <s.icon className={cn('h-4 w-4', s.color)} />
              </div>
              <div>
                <p className="text-[10px] font-bold text-brand-text-mute uppercase tracking-wider font-jetbrains">{s.label}</p>
                <p className={cn('text-lg font-black', s.color)}>{s.value}</p>
              </div>
            </Wrapper>
          );
        })}
      </div>

      {atRiskOnly && (
        <div className="flex items-center justify-between gap-2 text-xs text-rose-700 font-semibold bg-rose-50 border border-rose-200 px-3 py-1.5 rounded-xl">
          <span>Showing only students at risk (any skill below band 5.5)</span>
          <button onClick={() => setAtRiskOnly(false)} className="underline hover:no-underline">Clear filter</button>
        </div>
      )}

      {/* Band distribution mini-chart */}
      <div className="bg-white rounded-xl border border-brand-line px-4 py-3">
        <div className="flex items-center justify-between mb-2">
          <p className="text-[10px] font-bold text-brand-text-mute uppercase tracking-wider font-jetbrains">
            Band Distribution
          </p>
          <div className="flex items-center gap-1">
            {SKILL_FILTERS.map(f => (
              <button
                key={f.key}
                onClick={() => setSkillFilter(f.key)}
                className={cn(
                  'px-2 py-0.5 rounded-lg text-[10px] font-bold transition-colors',
                  skillFilter === f.key
                    ? 'bg-brand-teal-600 text-white'
                    : 'text-brand-text-mute hover:text-brand-text'
                )}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>
        <BandDistribution rows={mainRows} skillFilter={skillFilter} />
      </div>
      </>
      )}

      {/* Search + warning */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
        <div className="flex items-center gap-2 min-w-0">
          {pendingCount > 0 && (
            <div className="flex items-center gap-1.5 text-xs text-amber-600 font-semibold bg-amber-50 border border-amber-200 px-3 py-1.5 rounded-xl">
              <AlertCircle className="h-3.5 w-3.5 shrink-0" />
              {pendingCount} student{pendingCount > 1 ? 's' : ''} not yet diagnosed
            </div>
          )}
        </div>
        <div className="relative w-full sm:w-64 shrink-0">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-brand-text-mute" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search students…"
            className="w-full pl-9 pr-3 py-2 text-sm bg-white border border-brand-line rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-teal-500/30 text-brand-text placeholder:text-brand-text-mute"
          />
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-brand-line shadow-sm overflow-hidden">
        {/* Mobile: card per student. The table below needs 780px — the widest of
            the three tabs — which meant constant horizontal scrolling. */}
        <ul className="md:hidden divide-y divide-brand-line">
          {filtered.length === 0 ? (
            <li className="py-10 text-center text-sm text-brand-text-mute">No students match "{search}"</li>
          ) : (
            filtered.map(row => (
              <li key={row.student_id} className={cn('p-4', !row.is_diagnosed && 'bg-amber-50/40')}>
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <Avatar name={row.name} avatar={row.avatar} />
                    <span className="text-sm font-semibold text-brand-text truncate">{row.name}</span>
                  </div>
                  {row.is_diagnosed ? (
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 border border-emerald-200 text-emerald-700 shrink-0">
                      Diagnosed
                    </span>
                  ) : (
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 border border-amber-200 text-amber-700 shrink-0">
                      Pending
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-2 mt-3">
                  <span className="font-jetbrains text-[9px] font-bold uppercase tracking-wider text-brand-text-mute">Overall</span>
                  {bandPill(row.overall)}
                </div>

                <dl className="grid grid-cols-4 gap-x-2 gap-y-2 mt-3">
                  {SKILLS.map(s => (
                    <div key={s.key}>
                      <dt className="font-jetbrains text-[9px] font-bold uppercase tracking-wider text-brand-text-mute truncate">{s.label}</dt>
                      <dd className="mt-0.5">{bandPill(row.baseline_bands[s.key])}</dd>
                    </div>
                  ))}
                </dl>

                <div className="flex items-center justify-between gap-3 mt-3 pt-3 border-t border-brand-line">
                  <span className="text-xs text-brand-text-mute">{row.diagnosed_at ?? '—'}</span>
                  <button
                    onClick={() => goToStudent(row)}
                    disabled={!row.is_diagnosed}
                    className={cn(
                      'inline-flex items-center gap-1 text-xs font-bold transition-colors shrink-0',
                      row.is_diagnosed
                        ? 'text-brand-teal-600 hover:text-brand-teal-700'
                        : 'text-brand-text-mute cursor-not-allowed'
                    )}
                  >
                    <ExternalLink className="h-3.5 w-3.5" />
                    View Report
                  </button>
                </div>
              </li>
            ))
          )}
        </ul>

        <div className="overflow-x-auto hidden md:block">
          <table className="w-full text-left min-w-[780px]">
            <thead className="border-b border-brand-line">
              <tr>
                <th
                  className={cn(thClass, 'pl-5 w-48 cursor-pointer select-none hover:text-brand-text transition-colors')}
                  onClick={() => handleSort('name')}
                >
                  <span className="flex items-center gap-0.5">
                    Student <SortIcon col="name" active={sortKey} dir={sortDir} />
                  </span>
                </th>
                {sortTh('Status', 'status')}
                {sortTh('Overall', 'overall')}
                {SKILLS.map(s => (
                  <th key={s.key} className={thClass}>{s.label}</th>
                ))}
                {sortTh('Diagnosed On', 'diagnosed_at')}
                <th className={cn(thClass, 'pr-5 text-right')}>Action</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={10} className="py-10 text-center text-sm text-brand-text-mute">
                    No students match "{search}"
                  </td>
                </tr>
              ) : (
                filtered.map(row => (
                  <tr
                    key={row.student_id}
                    className={cn(
                      'border-b border-brand-line hover:bg-brand-bg-alt transition-colors',
                      !row.is_diagnosed && 'bg-amber-50/40'
                    )}
                  >
                    <td className="py-3 pl-5">
                      <div className="flex items-center gap-2.5">
                        <Avatar name={row.name} avatar={row.avatar} />
                        <span className="text-sm font-semibold text-brand-text truncate max-w-[130px]">
                          {row.name}
                        </span>
                      </div>
                    </td>
                    <td className="py-3">
                      {row.is_diagnosed ? (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 border border-emerald-200 text-emerald-700">
                          Diagnosed
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 border border-amber-200 text-amber-700">
                          Pending
                        </span>
                      )}
                    </td>
                    <td className="py-3">
                      {bandPill(row.overall)}
                    </td>
                    {SKILLS.map(s => (
                      <td key={s.key} className="py-3">
                        {bandPill(row.baseline_bands[s.key])}
                      </td>
                    ))}
                    <td className="py-3 text-sm text-brand-text-mute">
                      {row.diagnosed_at ?? '—'}
                    </td>
                    <td className="py-3 pr-5 text-right">
                      <div className="flex items-center justify-end gap-3">
                        <button
                          onClick={() => goToStudent(row)}
                          disabled={!row.is_diagnosed}
                          className={cn(
                            'inline-flex items-center gap-1 text-xs font-bold transition-colors',
                            row.is_diagnosed
                              ? 'text-brand-teal-600 hover:text-brand-teal-700'
                              : 'text-brand-text-mute cursor-not-allowed'
                          )}
                        >
                          <ExternalLink className="h-3.5 w-3.5" />
                          View Report
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Spoken English (CEFR) diagnosed students — kept in its own section/table so a
          CEFR ordinal is never plotted on the IELTS 0-9 band scale above. Additive:
          only appears when this batch genuinely has SE-shaped diagnosed rows. */}
      {hasSE && (
        <>
          {!compact && (
            <div className="bg-white rounded-xl border border-brand-line px-4 py-3">
              <p className="text-[10px] font-bold text-brand-text-mute uppercase tracking-wider font-jetbrains mb-2">
                Spoken English · CEFR Distribution
              </p>
              <div className="flex items-end gap-2 justify-center h-16">
                {CEFR_ORDER.map((label, i) => {
                  const count = seLevelCounts[i];
                  const pct = (count / seLevelMax) * 100;
                  return (
                    <div key={label} className="flex flex-col items-center gap-1 min-w-[36px]">
                      <span className="text-[10px] font-black text-brand-text">{count}</span>
                      <div
                        className={cn('w-6 rounded-t-sm transition-all', cefrGaugeColor(label))}
                        style={{ height: `${Math.max(pct, 4)}%` }}
                      />
                      <span className="text-[9px] font-bold text-brand-text-mute whitespace-nowrap">{label}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          <div className="bg-white rounded-2xl border border-brand-line shadow-sm overflow-hidden">
            <div className="px-4 sm:px-5 py-3 border-b border-brand-line">
              <p className="text-[10px] font-bold text-brand-text-mute uppercase tracking-wider font-jetbrains">
                Spoken English · {seDiagnosedRows.length} diagnosed (CEFR)
              </p>
            </div>

            {/* Mobile: card per student, mirrors the main list above. */}
            <ul className="md:hidden divide-y divide-brand-line">
              {seDiagnosedRows.map(row => (
                <li key={row.student_id} className="p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <Avatar name={row.name} avatar={row.avatar} />
                      <span className="text-sm font-semibold text-brand-text truncate">{row.name}</span>
                    </div>
                    {cefrPill(row.baseline_bands.S)}
                  </div>
                  <div className="flex items-center justify-between gap-3 mt-3 pt-3 border-t border-brand-line">
                    <span className="text-xs text-brand-text-mute">{row.diagnosed_at ?? '—'}</span>
                    <button
                      onClick={() => goToStudent(row)}
                      className="inline-flex items-center gap-1 text-xs font-bold text-brand-teal-600 hover:text-brand-teal-700 shrink-0"
                    >
                      <ExternalLink className="h-3.5 w-3.5" />
                      View Report
                    </button>
                  </div>
                </li>
              ))}
            </ul>

            <div className="overflow-x-auto hidden md:block">
              <table className="w-full text-left">
                <thead className="border-b border-brand-line">
                  <tr>
                    <th className={cn(thClass, 'pl-5 w-48')}>Student</th>
                    <th className={thClass}>CEFR Level</th>
                    <th className={thClass}>Diagnosed On</th>
                    <th className={cn(thClass, 'pr-5 text-right')}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {seDiagnosedRows.map(row => (
                    <tr key={row.student_id} className="border-b border-brand-line hover:bg-brand-bg-alt transition-colors">
                      <td className="py-3 pl-5">
                        <div className="flex items-center gap-2.5">
                          <Avatar name={row.name} avatar={row.avatar} />
                          <span className="text-sm font-semibold text-brand-text truncate max-w-[130px]">
                            {row.name}
                          </span>
                        </div>
                      </td>
                      <td className="py-3">{cefrPill(row.baseline_bands.S)}</td>
                      <td className="py-3 text-sm text-brand-text-mute">{row.diagnosed_at ?? '—'}</td>
                      <td className="py-3 pr-5 text-right">
                        <button
                          onClick={() => goToStudent(row)}
                          className="inline-flex items-center gap-1 text-xs font-bold text-brand-teal-600 hover:text-brand-teal-700"
                        >
                          <ExternalLink className="h-3.5 w-3.5" />
                          View Report
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

    </div>
  );
}
