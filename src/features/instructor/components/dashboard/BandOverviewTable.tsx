import { useState, useEffect } from 'react';
import { TrendingUp, TrendingDown, Minus, ChevronRight, ChevronLeft, Target } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/shared/utils';
import type { BandOverviewRow } from './types';

interface BandOverviewTableProps {
  rows:    BandOverviewRow[];
  batchId: string | null;
  loading: boolean;
}

const PAGE_SIZE = 8;

// ── Helpers ───────────────────────────────────────────────────────────────────

function initials(name: string) {
  return name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
}

const AVATAR_PALETTES = [
  'bg-indigo-100 dark:bg-indigo-500/20 text-indigo-700 dark:text-indigo-400',
  'bg-violet-100 dark:bg-violet-500/20 text-violet-700 dark:text-violet-400',
  'bg-sky-100 dark:bg-sky-500/20 text-sky-700 dark:text-sky-400',
  'bg-teal-100 dark:bg-teal-500/20 text-teal-700 dark:text-teal-400',
  'bg-amber-100 dark:bg-amber-500/20 text-amber-700 dark:text-amber-400',
  'bg-rose-100 dark:bg-rose-500/20 text-rose-700 dark:text-rose-400',
];
function avatarPalette(name: string) {
  const code = name.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0);
  return AVATAR_PALETTES[code % AVATAR_PALETTES.length];
}

function bandTextColor(band: number | null) {
  if (band === null) return 'text-slate-400';
  if (band >= 7.5)  return 'text-emerald-600 dark:text-emerald-400';
  if (band >= 6.0)  return 'text-sky-600 dark:text-sky-400';
  if (band >= 5.0)  return 'text-amber-600 dark:text-amber-400';
  return 'text-rose-600 dark:text-rose-400';
}

function gapPillColor(gap: number | null) {
  if (gap === null)  return 'bg-slate-100 dark:bg-slate-800 text-slate-500';
  if (gap <= 0)      return 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400';
  if (gap > 2.0)     return 'bg-rose-50 dark:bg-rose-500/10 text-rose-700 dark:text-rose-400';
  if (gap > 1.0)     return 'bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400';
  return 'bg-sky-50 dark:bg-sky-500/10 text-sky-700 dark:text-sky-400';
}

function TrendCell({ trend }: { trend: BandOverviewRow['band_trend'] }) {
  if (trend === 'up')   return (
    <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10 px-2 py-0.5 rounded-full">
      <TrendingUp className="h-3 w-3" /> Up
    </span>
  );
  if (trend === 'down') return (
    <span className="inline-flex items-center gap-1 text-[11px] font-bold text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-500/10 px-2 py-0.5 rounded-full">
      <TrendingDown className="h-3 w-3" /> Down
    </span>
  );
  if (trend === 'flat') return (
    <span className="inline-flex items-center gap-1 text-[11px] font-bold text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-full">
      <Minus className="h-3 w-3" /> Flat
    </span>
  );
  return <span className="text-[11px] text-slate-300 dark:text-slate-600">—</span>;
}

// ── Skeleton ──────────────────────────────────────────────────────────────────

function RowSkeleton() {
  return (
    <tr className="border-b border-slate-50 dark:border-slate-800/60 animate-pulse">
      <td className="px-5 py-3.5">
        <div className="flex items-center gap-2.5">
          <div className="h-8 w-8 rounded-full bg-slate-200 dark:bg-slate-700 shrink-0" />
          <div className="h-3.5 w-24 bg-slate-200 dark:bg-slate-700 rounded" />
        </div>
      </td>
      {[1, 2, 3, 4, 5].map(i => (
        <td key={i} className="px-5 py-3.5">
          <div className="h-3.5 w-12 bg-slate-100 dark:bg-slate-800 rounded" />
        </td>
      ))}
    </tr>
  );
}

// ── Main ─────────────────────────────────────────────────────────────────────

export function BandOverviewTable({ rows, batchId, loading }: BandOverviewTableProps) {
  const navigate = useNavigate();
  const [page, setPage] = useState(0);

  useEffect(() => { setPage(0); }, [rows.length]);

  const pageCount = Math.ceil(rows.length / PAGE_SIZE);
  const pageRows  = rows.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);
  const hasPrev   = page > 0;
  const hasNext   = page < pageCount - 1;

  const goToStudent = (studentId: string) => {
    if (!batchId) return;
    navigate(`/instructor/batches/${batchId}/students/${studentId}/progress`);
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">

      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 dark:border-slate-800">
        <div className="flex items-center gap-2.5">
          <div className="h-8 w-8 rounded-xl bg-indigo-100 dark:bg-indigo-500/20 flex items-center justify-center shrink-0">
            <Target className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-800 dark:text-white leading-tight">Band Score Overview</h3>
            <p className="text-[11px] text-slate-400 leading-tight">Sorted by gap to target — widest first</p>
          </div>
        </div>
        {!loading && rows.length > 0 && (
          <span className="text-xs text-slate-400 font-medium">{rows.length} students</span>
        )}
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/20">
              {['Student', 'Current Band', 'Target', 'Gap', 'Last IA', 'Trend', ''].map(h => (
                <th
                  key={h}
                  className="px-5 py-2.5 text-left text-[11px] font-black text-slate-400 uppercase tracking-wider whitespace-nowrap"
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              Array.from({ length: PAGE_SIZE }, (_, i) => <RowSkeleton key={i} />)
            ) : rows.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-5 py-12 text-center text-sm text-slate-400">
                  No students enrolled in this batch yet.
                </td>
              </tr>
            ) : (
              pageRows.map(row => (
                <tr
                  key={row.student_id}
                  onClick={() => goToStudent(row.student_id)}
                  className="border-b border-slate-50 dark:border-slate-800/60 hover:bg-slate-50 dark:hover:bg-slate-800/40 cursor-pointer transition-colors group"
                >
                  {/* Student */}
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-2.5">
                      <div className={cn(
                        'h-8 w-8 rounded-full shrink-0 flex items-center justify-center text-xs font-black overflow-hidden',
                        row.avatar ? '' : avatarPalette(row.name)
                      )}>
                        {row.avatar
                          ? <img src={row.avatar} alt={row.name} className="h-full w-full object-cover" />
                          : initials(row.name)
                        }
                      </div>
                      <span className="font-semibold text-slate-800 dark:text-white text-sm whitespace-nowrap">
                        {row.name}
                      </span>
                    </div>
                  </td>

                  {/* Current Band */}
                  <td className="px-5 py-3.5">
                    <span className={cn('text-base font-black tabular-nums', bandTextColor(row.current_band))}>
                      {row.current_band !== null ? row.current_band.toFixed(1) : '—'}
                    </span>
                  </td>

                  {/* Target */}
                  <td className="px-5 py-3.5">
                    <span className="text-sm font-semibold text-slate-500 dark:text-slate-400 tabular-nums">
                      {row.target_band !== null ? row.target_band.toFixed(1) : '—'}
                    </span>
                  </td>

                  {/* Gap */}
                  <td className="px-5 py-3.5">
                    {row.gap !== null ? (
                      <span className={cn('text-xs font-bold px-2 py-0.5 rounded-full', gapPillColor(row.gap))}>
                        {row.gap <= 0
                          ? `+${Math.abs(row.gap).toFixed(1)}`
                          : `−${row.gap.toFixed(1)}`
                        }
                      </span>
                    ) : (
                      <span className="text-slate-300 dark:text-slate-600 text-xs">—</span>
                    )}
                  </td>

                  {/* Last IA — single line, relative date only */}
                  <td className="px-5 py-3.5 whitespace-nowrap">
                    {row.last_ia_date ? (
                      <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                        {(() => {
                          const d    = new Date(row.last_ia_date + 'T12:00:00');
                          const days = Math.floor((Date.now() - d.getTime()) / 86_400_000);
                          if (days === 0) return 'Today';
                          if (days === 1) return 'Yesterday';
                          if (days < 7)  return `${days}d ago`;
                          if (days < 30) return `${Math.floor(days / 7)}w ago`;
                          return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
                        })()}
                      </span>
                    ) : (
                      <span className="text-xs text-slate-300 dark:text-slate-600">No IA yet</span>
                    )}
                  </td>

                  {/* Trend */}
                  <td className="px-5 py-3.5">
                    <TrendCell trend={row.band_trend} />
                  </td>

                  {/* Arrow */}
                  <td className="px-5 py-3.5">
                    <ChevronRight className="h-4 w-4 text-slate-300 dark:text-slate-600 group-hover:text-indigo-500 transition-colors" />
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination bar */}
      {!loading && pageCount > 1 && (
        <div className="flex items-center justify-between px-5 py-3 border-t border-slate-100 dark:border-slate-800">
          <button
            onClick={() => setPage(p => p - 1)}
            disabled={!hasPrev}
            className={cn(
              'h-8 w-8 rounded-full flex items-center justify-center transition-all',
              hasPrev
                ? 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-indigo-100 dark:hover:bg-indigo-500/20 hover:text-indigo-600 dark:hover:text-indigo-400'
                : 'text-slate-300 dark:text-slate-700 cursor-not-allowed'
            )}
            aria-label="Previous page"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>

          {/* Dots ≤7 pages, text beyond */}
          {pageCount <= 7 ? (
            <div className="flex items-center gap-1.5">
              {Array.from({ length: pageCount }, (_, i) => (
                <button
                  key={i}
                  onClick={() => setPage(i)}
                  className={cn(
                    'rounded-full transition-all',
                    i === page
                      ? 'h-2 w-5 bg-indigo-500'
                      : 'h-2 w-2 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600'
                  )}
                  aria-label={`Page ${i + 1}`}
                />
              ))}
            </div>
          ) : (
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
              {page + 1} / {pageCount}
            </span>
          )}

          <button
            onClick={() => setPage(p => p + 1)}
            disabled={!hasNext}
            className={cn(
              'h-8 w-8 rounded-full flex items-center justify-center transition-all',
              hasNext
                ? 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-indigo-100 dark:hover:bg-indigo-500/20 hover:text-indigo-600 dark:hover:text-indigo-400'
                : 'text-slate-300 dark:text-slate-700 cursor-not-allowed'
            )}
            aria-label="Next page"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      )}
    </div>
  );
}
