import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, ArrowUpDown, ArrowUp, ArrowDown, ExternalLink } from 'lucide-react';
import { cn } from '@/shared/utils';
import type { MockOverviewRow } from './types';

interface Props {
  rows:    MockOverviewRow[];
  batchId: string;
}

type SortKey = 'name' | 'mock_count' | 'latest_real_band' | 'best_real_band' | 'gap';

function bandColor(b: number | null): string {
  if (b === null) return 'text-slate-400';
  if (b >= 7.0) return 'text-emerald-600 dark:text-emerald-400';
  if (b >= 5.5) return 'text-amber-600 dark:text-amber-400';
  return 'text-rose-600 dark:text-rose-400';
}

function gapColor(gap: number | null): string {
  if (gap === null) return 'text-slate-400';
  if (gap <= 0) return 'text-emerald-600 dark:text-emerald-400';
  if (gap <= 1) return 'text-amber-600 dark:text-amber-400';
  return 'text-rose-600 dark:text-rose-400';
}

function Avatar({ name, avatar }: { name: string; avatar: string | null }) {
  if (avatar) {
    return <img src={avatar} alt={name} className="h-8 w-8 rounded-full object-cover" />;
  }
  const initials = name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || '?';
  return (
    <div className="h-8 w-8 rounded-full bg-indigo-100 dark:bg-indigo-500/20 flex items-center justify-center shrink-0">
      <span className="text-[11px] font-black text-indigo-600 dark:text-indigo-400">{initials}</span>
    </div>
  );
}

function SortIcon({ col, active, dir }: { col: SortKey; active: SortKey; dir: 'asc' | 'desc' }) {
  if (col !== active) return <ArrowUpDown className="h-3 w-3 text-slate-300 dark:text-slate-600 ml-1 shrink-0" />;
  return dir === 'asc'
    ? <ArrowUp   className="h-3 w-3 text-indigo-500 ml-1 shrink-0" />
    : <ArrowDown className="h-3 w-3 text-indigo-500 ml-1 shrink-0" />;
}

export function MockOverviewTab({ rows, batchId }: Props) {
  const navigate = useNavigate();
  const [search,  setSearch]  = useState('');
  const [sortKey, setSortKey] = useState<SortKey>('latest_real_band');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    } else {
      setSortKey(key);
      setSortDir('desc');
    }
  };

  const enriched = useMemo(() => rows.map(r => ({
    ...r,
    gap: r.latest_real_band !== null && r.target_band !== null
      ? Math.round((r.target_band - r.latest_real_band) * 10) / 10
      : null,
  })), [rows]);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    const list = q ? enriched.filter(r => r.name.toLowerCase().includes(q)) : enriched;

    return [...list].sort((a, b) => {
      let av: number | string | null, bv: number | string | null;
      switch (sortKey) {
        case 'name':             av = a.name;             bv = b.name;             break;
        case 'mock_count':       av = a.mock_count;       bv = b.mock_count;       break;
        case 'latest_real_band': av = a.latest_real_band; bv = b.latest_real_band; break;
        case 'best_real_band':   av = a.best_real_band;   bv = b.best_real_band;   break;
        case 'gap':              av = a.gap;              bv = b.gap;              break;
        default:                 av = 0;                  bv = 0;
      }
      if (av === null || av === undefined) av = sortDir === 'asc' ? Infinity : -Infinity;
      if (bv === null || bv === undefined) bv = sortDir === 'asc' ? Infinity : -Infinity;
      if (typeof av === 'string' && typeof bv === 'string') {
        return sortDir === 'asc' ? av.localeCompare(bv) : bv.localeCompare(av);
      }
      return sortDir === 'asc' ? (av as number) - (bv as number) : (bv as number) - (av as number);
    });
  }, [enriched, search, sortKey, sortDir]);

  const goToStudent = (row: MockOverviewRow) => {
    navigate(`/instructor/batches/${batchId}/students/${row.user_id}/progress`, { state: { studentId: row.user_id } });
  };

  const thClass = 'py-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider whitespace-nowrap';
  const sortTh  = (label: string, key: SortKey, cls?: string) => (
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

  const noMockCount    = rows.filter(r => r.mock_count === 0).length;
  const atTargetCount  = enriched.filter(r => r.gap !== null && r.gap <= 0).length;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-4 text-xs text-slate-500 dark:text-slate-400">
          <span className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-emerald-500" />
            {atTargetCount} at or above target
          </span>
          {noMockCount > 0 && (
            <span className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-slate-300 dark:bg-slate-600" />
              {noMockCount} haven't taken a mock yet
            </span>
          )}
        </div>
        <div className="relative w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search students…"
            className="w-full pl-9 pr-3 py-2 text-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/30 text-slate-800 dark:text-slate-200 placeholder:text-slate-400"
          />
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left min-w-[680px]">
            <thead className="border-b border-slate-100 dark:border-slate-800">
              <tr>
                <th className={cn(thClass, 'pl-5 w-48')} onClick={() => handleSort('name')}>
                  <span className="flex items-center gap-0.5 cursor-pointer hover:text-slate-600 dark:hover:text-slate-200 transition-colors select-none">
                    Student <SortIcon col="name" active={sortKey} dir={sortDir} />
                  </span>
                </th>
                {sortTh('Mocks Done', 'mock_count')}
                {sortTh('Latest Band', 'latest_real_band')}
                {sortTh('Best Band', 'best_real_band')}
                <th className={thClass}>Target</th>
                {sortTh('Gap', 'gap')}
                <th className={cn(thClass, 'pr-5 text-right')}>Action</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-10 text-center text-sm text-slate-400">
                    No students match "{search}"
                  </td>
                </tr>
              ) : (
                filtered.map(row => (
                  <tr
                    key={row.student_id}
                    className="border-b border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors"
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
                      <span className={cn(
                        'text-sm font-bold',
                        row.mock_count === 0
                          ? 'text-slate-400'
                          : 'text-slate-800 dark:text-slate-200'
                      )}>
                        {row.mock_count === 0 ? '—' : row.mock_count}
                      </span>
                    </td>
                    <td className="py-3">
                      <span className={cn('text-sm font-black', bandColor(row.latest_real_band))}>
                        {row.latest_real_band !== null ? row.latest_real_band.toFixed(1) : '—'}
                      </span>
                    </td>
                    <td className="py-3">
                      <span className={cn('text-sm font-black', bandColor(row.best_real_band))}>
                        {row.best_real_band !== null ? row.best_real_band.toFixed(1) : '—'}
                      </span>
                    </td>
                    <td className="py-3 text-sm font-semibold text-slate-500 dark:text-slate-400">
                      {row.target_band !== null ? row.target_band.toFixed(1) : '—'}
                    </td>
                    <td className="py-3">
                      {row.gap !== null ? (
                        <span className={cn('text-sm font-black', gapColor(row.gap))}>
                          {row.gap <= 0 ? '✓ Met' : `+${row.gap.toFixed(1)}`}
                        </span>
                      ) : (
                        <span className="text-slate-400 text-sm">—</span>
                      )}
                    </td>
                    <td className="py-3 pr-5 text-right">
                      <button
                        onClick={() => goToStudent(row)}
                        className="inline-flex items-center gap-1 text-xs font-bold text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
                      >
                        <ExternalLink className="h-3.5 w-3.5" />
                        View
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
