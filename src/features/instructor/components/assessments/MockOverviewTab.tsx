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
  if (b === null) return 'text-brand-text-mute';
  if (b >= 7.0) return 'text-emerald-600';
  if (b >= 5.5) return 'text-amber-600';
  return 'text-rose-600';
}

function gapColor(gap: number | null): string {
  if (gap === null) return 'text-brand-text-mute';
  if (gap <= 0) return 'text-emerald-600';
  if (gap <= 1) return 'text-amber-600';
  return 'text-rose-600';
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

  const thClass = 'py-3 text-[10px] font-bold text-brand-text-mute uppercase tracking-wider whitespace-nowrap font-jetbrains';
  const sortTh  = (label: string, key: SortKey, cls?: string) => (
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

  const noMockCount    = rows.filter(r => r.mock_count === 0).length;
  const atTargetCount  = enriched.filter(r => r.gap !== null && r.gap <= 0).length;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-4 text-xs text-brand-text-mute">
          <span className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-emerald-500" />
            {atTargetCount} at or above target
          </span>
          {noMockCount > 0 && (
            <span className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-brand-line" />
              {noMockCount} haven't taken a mock yet
            </span>
          )}
        </div>
        <div className="relative w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-brand-text-mute" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search students…"
            className="w-full pl-9 pr-3 py-2 text-sm bg-white border border-brand-line rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-teal-500/30 text-brand-text placeholder:text-brand-text-mute"
          />
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-brand-line shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left min-w-[680px]">
            <thead className="border-b border-brand-line">
              <tr>
                <th className={cn(thClass, 'pl-5 w-48')} onClick={() => handleSort('name')}>
                  <span className="flex items-center gap-0.5 cursor-pointer hover:text-brand-text transition-colors select-none">
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
                  <td colSpan={7} className="py-10 text-center text-sm text-brand-text-mute">
                    No students match "{search}"
                  </td>
                </tr>
              ) : (
                filtered.map(row => (
                  <tr
                    key={row.student_id}
                    className="border-b border-brand-line hover:bg-brand-bg-alt transition-colors"
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
                      <span className={cn(
                        'text-sm font-bold',
                        row.mock_count === 0
                          ? 'text-brand-text-mute'
                          : 'text-brand-text'
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
                    <td className="py-3 text-sm font-semibold text-brand-text-mute">
                      {row.target_band !== null ? row.target_band.toFixed(1) : '—'}
                    </td>
                    <td className="py-3">
                      {row.gap !== null ? (
                        <span className={cn('text-sm font-black', gapColor(row.gap))}>
                          {row.gap <= 0 ? '✓ Met' : `+${row.gap.toFixed(1)}`}
                        </span>
                      ) : (
                        <span className="text-brand-text-mute text-sm">—</span>
                      )}
                    </td>
                    <td className="py-3 pr-5 text-right">
                      <button
                        onClick={() => goToStudent(row)}
                        className="inline-flex items-center gap-1 text-xs font-bold text-brand-text-mute hover:text-brand-teal-600 transition-colors"
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
