import { TrendingUp, TrendingDown, Minus, ChevronRight, Target } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/shared/utils';
import type { BandOverviewRow } from './types';

interface BandOverviewTableProps {
  rows:    BandOverviewRow[];
  batchId: string | null;
  loading: boolean;
}

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

function bandBarColor(band: number | null) {
  if (band === null) return 'bg-slate-300 dark:bg-slate-600';
  if (band >= 7.5)  return 'bg-emerald-500';
  if (band >= 6.0)  return 'bg-sky-500';
  if (band >= 5.0)  return 'bg-amber-500';
  return 'bg-rose-500';
}

function gapPillColor(gap: number | null) {
  if (gap === null || gap <= 0) return 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400';
  if (gap > 2.0) return 'bg-rose-50 dark:bg-rose-500/10 text-rose-700 dark:text-rose-400';
  if (gap > 1.0) return 'bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400';
  return 'bg-sky-50 dark:bg-sky-500/10 text-sky-700 dark:text-sky-400';
}

function relativeDate(dateStr: string): string {
  const d    = new Date(dateStr + 'T12:00:00');
  const now  = new Date();
  const days = Math.floor((now.getTime() - d.getTime()) / (1000 * 60 * 60 * 24));
  if (days === 0) return 'Today';
  if (days === 1) return 'Yesterday';
  if (days < 7)  return `${days}d ago`;
  if (days < 30) return `${Math.floor(days / 7)}w ago`;
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
}

// ── Progress column ────────────────────────────────────────────────────────────
// Consolidates current band + target + gap into one visual column.

function BandProgress({
  current,
  target,
  gap,
}: {
  current: number | null;
  target:  number | null;
  gap:     number | null;
}) {
  // Bar fills proportionally against the target (capped at 100%)
  const MAX_BAND = 9;
  const pct = (current !== null && target !== null && target > 0)
    ? Math.min(100, Math.round((current / target) * 100))
    : current !== null
      ? Math.round((current / MAX_BAND) * 100)
      : 0;

  return (
    <div className="flex items-center gap-3 min-w-0">
      {/* Current band number */}
      <span className={cn('text-base font-black shrink-0 w-9 tabular-nums', bandTextColor(current))}>
        {current !== null ? current.toFixed(1) : '—'}
      </span>

      {/* Mini bar */}
      <div className="flex-1 min-w-0 max-w-[80px]">
        <div className="flex items-center justify-between mb-0.5">
          <span className="text-[10px] text-slate-400 font-medium">
            {current !== null ? `${current.toFixed(1)}` : '—'}
          </span>
          {target !== null && (
            <span className="text-[10px] text-slate-400 font-medium">
              {target.toFixed(1)}
            </span>
          )}
        </div>
        <div className="h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
          <div
            className={cn('h-full rounded-full transition-all duration-700', bandBarColor(current))}
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>

      {/* Gap pill */}
      {gap !== null && (
        <span className={cn('shrink-0 text-[11px] font-bold px-2 py-0.5 rounded-full', gapPillColor(gap))}>
          {gap <= 0 ? `+${Math.abs(gap).toFixed(1)}` : `−${gap.toFixed(1)}`}
        </span>
      )}
    </div>
  );
}

// ── Trend cell ────────────────────────────────────────────────────────────────

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
  // null = < 2 IAs
  return <span className="text-[11px] text-slate-300 dark:text-slate-600">No data</span>;
}

// ── Skeletons ─────────────────────────────────────────────────────────────────

function RowSkeleton() {
  return (
    <tr className="border-b border-slate-50 dark:border-slate-800/60 animate-pulse">
      <td className="px-5 py-3.5">
        <div className="flex items-center gap-2.5">
          <div className="h-8 w-8 rounded-full bg-slate-200 dark:bg-slate-700 shrink-0" />
          <div className="h-3.5 w-24 bg-slate-200 dark:bg-slate-700 rounded" />
        </div>
      </td>
      <td className="px-5 py-3.5">
        <div className="flex items-center gap-2">
          <div className="h-4 w-10 bg-slate-200 dark:bg-slate-700 rounded" />
          <div className="h-1.5 flex-1 max-w-[80px] bg-slate-100 dark:bg-slate-800 rounded-full" />
          <div className="h-5 w-10 bg-slate-100 dark:bg-slate-800 rounded-full" />
        </div>
      </td>
      <td className="px-5 py-3.5"><div className="h-3.5 w-16 bg-slate-100 dark:bg-slate-800 rounded" /></td>
      <td className="px-5 py-3.5"><div className="h-5 w-12 bg-slate-100 dark:bg-slate-800 rounded-full" /></td>
      <td className="px-5 py-3.5"><div className="h-4 w-4 bg-slate-200 dark:bg-slate-700 rounded" /></td>
    </tr>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export function BandOverviewTable({ rows, batchId, loading }: BandOverviewTableProps) {
  const navigate = useNavigate();

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
              {[
                { label: 'Student',  w: '' },
                { label: 'Progress vs Target', w: 'min-w-[220px]' },
                { label: 'Last IA',  w: '' },
                { label: 'Trend',    w: '' },
                { label: '',         w: 'w-8' },
              ].map(h => (
                <th
                  key={h.label}
                  className={cn(
                    'px-5 py-2.5 text-left text-[11px] font-black text-slate-400 uppercase tracking-wider whitespace-nowrap',
                    h.w
                  )}
                >
                  {h.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              [1, 2, 3, 4, 5].map(i => <RowSkeleton key={i} />)
            ) : rows.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-5 py-12 text-center text-sm text-slate-400">
                  No students enrolled in this batch yet.
                </td>
              </tr>
            ) : (
              rows.map(row => (
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

                  {/* Progress (current + bar + gap — replaces 3 old columns) */}
                  <td className="px-5 py-3.5 min-w-[220px]">
                    {row.current_band !== null || row.target_band !== null ? (
                      <BandProgress
                        current={row.current_band}
                        target={row.target_band}
                        gap={row.gap}
                      />
                    ) : (
                      <span className="text-xs text-slate-300 dark:text-slate-600">No assessment yet</span>
                    )}
                  </td>

                  {/* Last IA */}
                  <td className="px-5 py-3.5 whitespace-nowrap">
                    {row.last_ia_date ? (
                      <div>
                        <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                          {relativeDate(row.last_ia_date)}
                        </p>
                        <p className="text-[11px] text-slate-400">
                          {new Date(row.last_ia_date + 'T12:00:00').toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                        </p>
                      </div>
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
    </div>
  );
}
