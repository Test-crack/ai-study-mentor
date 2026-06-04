import { TrendingUp, TrendingDown, Minus, ChevronRight, Target } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/shared/utils';
import type { BandOverviewRow } from './types';

interface BandOverviewTableProps {
  rows:    BandOverviewRow[];
  batchId: string | null;
  loading: boolean;
}

function gapColor(gap: number | null) {
  if (gap === null) return 'text-slate-400';
  if (gap > 2.0)  return 'text-rose-600 dark:text-rose-400';
  if (gap > 1.0)  return 'text-amber-600 dark:text-amber-400';
  return 'text-emerald-600 dark:text-emerald-400';
}

function gapBg(gap: number | null) {
  if (gap === null) return 'bg-slate-100 dark:bg-slate-800 text-slate-500';
  if (gap > 2.0)  return 'bg-rose-50 dark:bg-rose-500/10 text-rose-700 dark:text-rose-400';
  if (gap > 1.0)  return 'bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400';
  return 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400';
}

function bandColor(band: number | null) {
  if (band === null) return 'text-slate-400';
  if (band >= 7.5)  return 'text-emerald-600 dark:text-emerald-400';
  if (band >= 6.0)  return 'text-sky-600 dark:text-sky-400';
  if (band >= 5.0)  return 'text-amber-600 dark:text-amber-400';
  return 'text-rose-600 dark:text-rose-400';
}

function TrendIcon({ trend }: { trend: BandOverviewRow['band_trend'] }) {
  if (trend === 'up')   return <TrendingUp   className="h-4 w-4 text-emerald-500" />;
  if (trend === 'down') return <TrendingDown  className="h-4 w-4 text-rose-500" />;
  if (trend === 'flat') return <Minus         className="h-4 w-4 text-slate-400" />;
  return <span className="h-4 w-4 text-slate-300 text-xs flex items-center justify-center">—</span>;
}

function initials(name: string) {
  return name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
}

function RowSkeleton() {
  return (
    <tr className="border-b border-slate-100 dark:border-slate-800 animate-pulse">
      <td className="px-4 py-3">
        <div className="flex items-center gap-2.5">
          <div className="h-8 w-8 rounded-full bg-slate-200 dark:bg-slate-700 shrink-0" />
          <div className="h-3.5 w-28 bg-slate-200 dark:bg-slate-700 rounded" />
        </div>
      </td>
      {[1,2,3,4,5].map(i => (
        <td key={i} className="px-4 py-3">
          <div className="h-3.5 w-12 bg-slate-100 dark:bg-slate-800 rounded mx-auto" />
        </td>
      ))}
    </tr>
  );
}

export function BandOverviewTable({ rows, batchId, loading }: BandOverviewTableProps) {
  const navigate = useNavigate();

  const goToStudent = (studentId: string) => {
    if (!batchId) return;
    navigate(`/instructor/batches/${batchId}/students/${studentId}/progress`);
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-2.5 px-5 py-4 border-b border-slate-100 dark:border-slate-800">
        <div className="h-8 w-8 rounded-xl bg-indigo-100 dark:bg-indigo-500/20 flex items-center justify-center">
          <Target className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
        </div>
        <div>
          <h3 className="text-sm font-bold text-slate-800 dark:text-white">Band Score Overview</h3>
          <p className="text-[11px] text-slate-400">Sorted by gap to target — widest first</p>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-100 dark:border-slate-800">
              {['Student', 'Current Band', 'Target', 'Gap', 'Last IA', 'Trend', ''].map(h => (
                <th key={h} className="px-4 py-2.5 text-left text-[11px] font-black text-slate-400 uppercase tracking-wider whitespace-nowrap">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading
              ? [1, 2, 3, 4].map(i => <RowSkeleton key={i} />)
              : rows.length === 0
                ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-10 text-center text-sm text-slate-400">
                      No students enrolled in this batch yet.
                    </td>
                  </tr>
                )
                : rows.map(row => (
                  <tr
                    key={row.student_id}
                    onClick={() => goToStudent(row.student_id)}
                    className="border-b border-slate-50 dark:border-slate-800/60 hover:bg-slate-50 dark:hover:bg-slate-800/40 cursor-pointer transition-colors group"
                  >
                    {/* Student */}
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2.5">
                        <div className="h-8 w-8 rounded-full shrink-0 bg-indigo-100 dark:bg-indigo-500/20 flex items-center justify-center text-xs font-black text-indigo-600 dark:text-indigo-400 overflow-hidden">
                          {row.avatar
                            ? <img src={row.avatar} alt={row.name} className="h-full w-full object-cover" />
                            : initials(row.name)
                          }
                        </div>
                        <span className="font-semibold text-slate-800 dark:text-white whitespace-nowrap">
                          {row.name}
                        </span>
                      </div>
                    </td>

                    {/* Current Band */}
                    <td className="px-4 py-3">
                      <span className={cn('text-base font-black', bandColor(row.current_band))}>
                        {row.current_band !== null ? row.current_band.toFixed(1) : '—'}
                      </span>
                    </td>

                    {/* Target */}
                    <td className="px-4 py-3 text-slate-500 dark:text-slate-400 font-semibold">
                      {row.target_band !== null ? row.target_band.toFixed(1) : '—'}
                    </td>

                    {/* Gap */}
                    <td className="px-4 py-3">
                      {row.gap !== null ? (
                        <span className={cn('text-xs font-bold px-2 py-0.5 rounded-full', gapBg(row.gap))}>
                          {row.gap > 0 ? `−${row.gap.toFixed(1)}` : `+${Math.abs(row.gap).toFixed(1)}`}
                        </span>
                      ) : (
                        <span className="text-slate-300 dark:text-slate-600 text-xs">—</span>
                      )}
                    </td>

                    {/* Last IA */}
                    <td className="px-4 py-3 text-xs text-slate-400 whitespace-nowrap">
                      {row.last_ia_date
                        ? new Date(row.last_ia_date + 'T12:00:00').toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })
                        : <span className="text-slate-300 dark:text-slate-600">No IA yet</span>
                      }
                    </td>

                    {/* Trend */}
                    <td className="px-4 py-3">
                      <TrendIcon trend={row.band_trend} />
                    </td>

                    {/* Arrow */}
                    <td className="px-4 py-3">
                      <ChevronRight className="h-4 w-4 text-slate-300 dark:text-slate-600 group-hover:text-indigo-500 transition-colors" />
                    </td>
                  </tr>
                ))
            }
          </tbody>
        </table>
      </div>
    </div>
  );
}
