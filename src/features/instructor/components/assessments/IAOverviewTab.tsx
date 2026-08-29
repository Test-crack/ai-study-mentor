import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, ArrowUpDown, ArrowUp, ArrowDown, ExternalLink } from 'lucide-react';
import { cn } from '@/shared/utils';
import type { IAOverviewRow } from './types';

interface Props {
  rows:    IAOverviewRow[];
  batchId: string;
  /**
   * Where the row's "open student" action navigates. Defaults to the instructor
   * route. The institute-owner portal renders this same table from the same
   * shared handler but has its own progress route, so the path cannot be
   * hardcoded here.
   */
  progressPathFor?: (userId: string) => string;
}

type SortKey = 'name' | 'ia_completed' | 'ia_missed' | 'avg_ia_band' | 'last_ia_date';

function bandColor(b: number | null): string {
  if (b === null) return 'text-brand-text-mute';
  if (b >= 7.0) return 'text-emerald-600';
  if (b >= 5.5) return 'text-amber-600';
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

export function IAOverviewTab({ rows, batchId, progressPathFor }: Props) {
  const navigate = useNavigate();
  const [search,  setSearch]  = useState('');
  const [sortKey, setSortKey] = useState<SortKey>('ia_missed');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    } else {
      setSortKey(key);
      setSortDir('desc');
    }
  };

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    const list = q
      ? rows.filter(r => r.name.toLowerCase().includes(q))
      : rows;

    return [...list].sort((a, b) => {
      let av: number | string, bv: number | string;
      switch (sortKey) {
        case 'name':         av = a.name;         bv = b.name;         break;
        case 'ia_completed': av = a.ia_completed; bv = b.ia_completed; break;
        case 'ia_missed':    av = a.ia_missed;    bv = b.ia_missed;    break;
        case 'avg_ia_band':  av = a.avg_ia_band ?? (sortDir === 'asc' ? -1 : 99); bv = b.avg_ia_band ?? (sortDir === 'asc' ? -1 : 99); break;
        case 'last_ia_date': {
          const sentinel = sortDir === 'asc' ? '' : '9999-99-99';
          av = a.last_ia_date ?? sentinel;
          bv = b.last_ia_date ?? sentinel;
          return sortDir === 'asc' ? av.localeCompare(bv) : bv.localeCompare(av);
        }
        default:             av = 0;              bv = 0;
      }
      if (typeof av === 'string' && typeof bv === 'string') {
        return sortDir === 'asc' ? av.localeCompare(bv) : bv.localeCompare(av);
      }
      return sortDir === 'asc' ? (av as number) - (bv as number) : (bv as number) - (av as number);
    });
  }, [rows, search, sortKey, sortDir]);

  const goToStudent = (row: IAOverviewRow) => {
    const path = progressPathFor
      ? progressPathFor(row.user_id)
      : `/instructor/batches/${batchId}/students/${row.user_id}/progress`;
    navigate(path, { state: { studentId: row.user_id } });
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

  const eligibleCount = rows.filter(r => r.ia_eligible).length;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-2 text-xs text-brand-text-mute">
          <span className="h-2 w-2 rounded-full bg-emerald-500" />
          {eligibleCount} of {rows.length} students eligible for next IA
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
          <table className="w-full text-left min-w-[720px]">
            <thead className="border-b border-brand-line">
              <tr>
                <th className={cn(thClass, 'pl-5 w-48')} onClick={() => handleSort('name')}>
                  <span className="flex items-center gap-0.5 cursor-pointer hover:text-brand-text transition-colors select-none">
                    Student <SortIcon col="name" active={sortKey} dir={sortDir} />
                  </span>
                </th>
                {sortTh('Completed', 'ia_completed')}
                {sortTh('Missed', 'ia_missed')}
                {sortTh('Avg Band', 'avg_ia_band')}
                <th className={thClass}>Best Band</th>
                {sortTh('Last IA', 'last_ia_date')}
                <th className={thClass}>Eligible</th>
                <th className={cn(thClass, 'pr-5 text-right')}>Action</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-10 text-center text-sm text-brand-text-mute">
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
                      <span className="text-sm font-bold text-emerald-600">
                        {row.ia_completed}
                      </span>
                    </td>
                    <td className="py-3">
                      <span className={cn(
                        'text-sm font-bold',
                        row.ia_missed === 0
                          ? 'text-brand-text-mute'
                          : row.ia_missed >= 2
                          ? 'text-rose-600'
                          : 'text-amber-600'
                      )}>
                        {row.ia_missed}
                      </span>
                    </td>
                    <td className="py-3">
                      <span className={cn('text-sm font-black', bandColor(row.avg_ia_band))}>
                        {row.avg_ia_band !== null ? row.avg_ia_band.toFixed(1) : '—'}
                      </span>
                    </td>
                    <td className="py-3">
                      <span className={cn('text-sm font-black', bandColor(row.best_ia_band))}>
                        {row.best_ia_band !== null ? row.best_ia_band.toFixed(1) : '—'}
                      </span>
                    </td>
                    <td className="py-3 text-sm text-brand-text-mute">
                      {row.last_ia_date ?? '—'}
                    </td>
                    <td className="py-3">
                      <span className={cn(
                        'inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold border',
                        row.ia_eligible
                          ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
                          : 'bg-brand-bg-alt border-brand-line text-brand-text-mute'
                      )}>
                        {row.ia_eligible ? 'Eligible' : 'Not yet'}
                      </span>
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
