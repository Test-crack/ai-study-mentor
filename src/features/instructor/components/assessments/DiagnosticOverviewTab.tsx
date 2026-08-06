import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search, ExternalLink, AlertCircle,
  ArrowUpDown, ArrowUp, ArrowDown,
  Users, TrendingUp, AlertTriangle, Clock,
} from 'lucide-react';
import { cn } from '@/shared/utils';
import type { DiagnosticOverviewRow } from './types';

interface Props {
  rows:    DiagnosticOverviewRow[];
  batchId: string;
}

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

function bandPill(b: number | null) {
  if (b === null) return <span className="text-slate-300 dark:text-slate-600 text-xs">—</span>;
  const cls = b >= 7.0
    ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/30'
    : b >= 5.5
    ? 'bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-500/30'
    : 'bg-rose-50 dark:bg-rose-500/10 text-rose-700 dark:text-rose-400 border-rose-200 dark:border-rose-500/30';
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
    <div className="h-8 w-8 rounded-full bg-brand-teal-100 dark:bg-brand-teal-500/20 flex items-center justify-center shrink-0">
      <span className="text-[11px] font-black text-brand-teal-600 dark:text-brand-teal-400">{initials}</span>
    </div>
  );
}

function SortIcon({ col, active, dir }: { col: SortKey; active: SortKey; dir: 'asc' | 'desc' }) {
  if (col !== active) return <ArrowUpDown className="h-3 w-3 text-slate-300 dark:text-slate-600 ml-1 shrink-0" />;
  return dir === 'asc'
    ? <ArrowUp   className="h-3 w-3 text-brand-teal-500 ml-1 shrink-0" />
    : <ArrowDown className="h-3 w-3 text-brand-teal-500 ml-1 shrink-0" />;
}

const BAND_RANGES = [
  { label: '7.0+',     key: 'high',   color: 'bg-emerald-500', textCls: 'text-emerald-700 dark:text-emerald-400' },
  { label: '5.5–6.9',  key: 'mid',    color: 'bg-amber-500',   textCls: 'text-amber-700 dark:text-amber-400'    },
  { label: 'Below 5.5', key: 'low',   color: 'bg-rose-500',    textCls: 'text-rose-700 dark:text-rose-400'      },
] as const;

function BandDistribution({ rows }: { rows: DiagnosticOverviewRow[] }) {
  const diagnosed = rows.filter(r => r.is_diagnosed);
  const bands = diagnosed.map(r => overallBand(r.baseline_bands)).filter((v): v is number => v !== null);

  if (bands.length === 0) {
    return (
      <div className="text-center py-4 text-xs text-slate-400">
        No band data yet
      </div>
    );
  }

  const counts = {
    high: bands.filter(b => b >= 7.0).length,
    mid:  bands.filter(b => b >= 5.5 && b < 7.0).length,
    low:  bands.filter(b => b < 5.5).length,
  };
  const max = Math.max(counts.high, counts.mid, counts.low, 1);

  return (
    <div className="flex items-end gap-3 justify-center h-16">
      {BAND_RANGES.map(range => {
        const count = counts[range.key];
        const pct = (count / max) * 100;
        return (
          <div key={range.key} className="flex flex-col items-center gap-1 min-w-[48px]">
            <span className="text-[10px] font-black text-slate-700 dark:text-slate-300">{count}</span>
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

export function DiagnosticOverviewTab({ rows, batchId }: Props) {
  const navigate = useNavigate();
  const [search,  setSearch]  = useState('');
  const [sortKey, setSortKey] = useState<SortKey>('status');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    } else {
      setSortKey(key);
      setSortDir(key === 'name' ? 'asc' : 'desc');
    }
  };

  const enriched = useMemo(() => rows.map(r => ({
    ...r,
    overall: overallBand(r.baseline_bands),
  })), [rows]);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    const list = q ? enriched.filter(r => r.name.toLowerCase().includes(q)) : enriched;

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
    navigate(`/instructor/batches/${batchId}/students/${row.user_id}/progress`, {
      state: { studentId: row.user_id, initialTab: 'diagnostic' },
    });
  };

  const thClass = 'py-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider whitespace-nowrap';
  const sortTh = (label: string, key: SortKey, cls?: string) => (
    <th
      className={cn(thClass, 'cursor-pointer select-none hover:text-slate-600 dark:hover:text-slate-200 transition-colors', cls)}
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
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-16 text-center">
        <p className="text-slate-400 text-sm">No students in this batch yet.</p>
      </div>
    );
  }

  const diagnosed    = enriched.filter(r => r.is_diagnosed);
  const pendingCount = enriched.length - diagnosed.length;
  const diagBands    = diagnosed.map(r => r.overall).filter((v): v is number => v !== null);
  const avgBand      = diagBands.length > 0 ? diagBands.reduce((a, b) => a + b, 0) / diagBands.length : null;
  const atRiskCount  = diagBands.filter(b => b < 5.5).length;

  const stats = [
    { label: 'Completed',  value: `${diagnosed.length}/${enriched.length}`, icon: Users,          color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-50 dark:bg-emerald-500/10' },
    { label: 'Avg Band',   value: avgBand !== null ? avgBand.toFixed(1) : '—', icon: TrendingUp,  color: avgBand !== null && avgBand >= 7.0 ? 'text-emerald-600 dark:text-emerald-400' : avgBand !== null && avgBand >= 5.5 ? 'text-amber-600 dark:text-amber-400' : 'text-slate-400', bg: 'bg-slate-50 dark:bg-slate-800' },
    { label: 'At Risk',    value: String(atRiskCount), icon: AlertTriangle,    color: atRiskCount > 0 ? 'text-rose-600 dark:text-rose-400' : 'text-slate-400', bg: atRiskCount > 0 ? 'bg-rose-50 dark:bg-rose-500/10' : 'bg-slate-50 dark:bg-slate-800' },
    { label: 'Pending',    value: String(pendingCount), icon: Clock,           color: pendingCount > 0 ? 'text-amber-600 dark:text-amber-400' : 'text-slate-400', bg: pendingCount > 0 ? 'bg-amber-50 dark:bg-amber-500/10' : 'bg-slate-50 dark:bg-slate-800' },
  ];

  return (
    <div className="space-y-4">
      {/* Summary stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {stats.map(s => (
          <div
            key={s.label}
            className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 px-4 py-3 flex items-center gap-3"
          >
            <div className={cn('h-9 w-9 rounded-lg flex items-center justify-center shrink-0', s.bg)}>
              <s.icon className={cn('h-4 w-4', s.color)} />
            </div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{s.label}</p>
              <p className={cn('text-lg font-black', s.color)}>{s.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Band distribution mini-chart */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 px-4 py-3">
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2 text-center">
          Band Distribution
        </p>
        <BandDistribution rows={rows} />
      </div>

      {/* Search + warning */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          {pendingCount > 0 && (
            <div className="flex items-center gap-1.5 text-xs text-amber-600 dark:text-amber-400 font-semibold bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/30 px-3 py-1.5 rounded-xl">
              <AlertCircle className="h-3.5 w-3.5 shrink-0" />
              {pendingCount} student{pendingCount > 1 ? 's' : ''} not yet diagnosed
            </div>
          )}
        </div>
        <div className="relative w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search students…"
            className="w-full pl-9 pr-3 py-2 text-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-teal-500/30 text-slate-800 dark:text-slate-200 placeholder:text-slate-400"
          />
        </div>
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left min-w-[780px]">
            <thead className="border-b border-slate-100 dark:border-slate-800">
              <tr>
                <th
                  className={cn(thClass, 'pl-5 w-48 cursor-pointer select-none hover:text-slate-600 dark:hover:text-slate-200 transition-colors')}
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
                  <td colSpan={10} className="py-10 text-center text-sm text-slate-400">
                    No students match "{search}"
                  </td>
                </tr>
              ) : (
                filtered.map(row => (
                  <tr
                    key={row.student_id}
                    className={cn(
                      'border-b border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors',
                      !row.is_diagnosed && 'bg-amber-50/40 dark:bg-amber-500/5'
                    )}
                  >
                    <td className="py-3 pl-5">
                      <div className="flex items-center gap-2.5">
                        <Avatar name={row.name} avatar={row.avatar} />
                        <span className="text-sm font-semibold text-slate-800 dark:text-slate-200 truncate max-w-[130px]">
                          {row.name}
                        </span>
                      </div>
                    </td>
                    <td className="py-3">
                      {row.is_diagnosed ? (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/30 text-emerald-700 dark:text-emerald-400">
                          Diagnosed
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/30 text-amber-700 dark:text-amber-400">
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
                    <td className="py-3 text-sm text-slate-500 dark:text-slate-400">
                      {row.diagnosed_at ?? '—'}
                    </td>
                    <td className="py-3 pr-5 text-right">
                      <button
                        onClick={() => goToStudent(row)}
                        disabled={!row.is_diagnosed}
                        className={cn(
                          'inline-flex items-center gap-1 text-xs font-bold transition-colors',
                          row.is_diagnosed
                            ? 'text-brand-teal-600 dark:text-brand-teal-400 hover:text-brand-teal-700 dark:hover:text-brand-teal-300'
                            : 'text-slate-300 dark:text-slate-700 cursor-not-allowed'
                        )}
                      >
                        <ExternalLink className="h-3.5 w-3.5" />
                        View Report
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
