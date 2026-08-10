// src/features/Instructor/dashboard/BandOverviewTable.tsx
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

// ── Helpers (unchanged) ───────────────────────────────────────────────────────

function initials(name: string) {
  return name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
}

const AVATAR_PALETTES = [
  'bg-brand-teal-100 dark:bg-brand-teal-500/20 text-brand-teal-700 dark:text-brand-teal-400',
  'bg-brand-blue-100 dark:bg-brand-blue-500/20 text-brand-blue-700 dark:text-brand-blue-400',
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

// Colored badge with border
function bandBadge(band: number | null): string {
  if (band === null) return 'bg-slate-100 dark:bg-slate-800 text-slate-400 border border-slate-200 dark:border-slate-700';
  if (band >= 7.5)  return 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-500/30 shadow-[0_0_10px_rgba(16,185,129,0.15)]';
  if (band >= 6.0)  return 'bg-sky-50 dark:bg-sky-500/10 text-sky-700 dark:text-sky-300 border border-sky-200 dark:border-sky-500/30 shadow-[0_0_10px_rgba(14,165,233,0.15)]';
  if (band >= 5.0)  return 'bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-500/30 shadow-[0_0_10px_rgba(245,158,11,0.15)]';
  return 'bg-rose-50 dark:bg-rose-500/10 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-500/30 shadow-[0_0_10px_rgba(244,63,94,0.15)]';
}

function gapPillColor(gap: number | null) {
  if (gap === null) return 'bg-slate-100 dark:bg-slate-800 text-slate-500';
  if (gap <= 0)     return 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/20';
  if (gap > 2.0)    return 'bg-rose-50 dark:bg-rose-500/10 text-rose-700 dark:text-rose-400 border border-rose-200 dark:border-rose-500/20';
  if (gap > 1.0)    return 'bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-500/20';
  return 'bg-sky-50 dark:bg-sky-500/10 text-sky-700 dark:text-sky-400 border border-sky-200 dark:border-sky-500/20';
}

function TrendCell({ trend }: { trend: BandOverviewRow['band_trend'] }) {
  if (trend === 'up') return (
    <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-500/20 whitespace-nowrap">
      <TrendingUp className="h-3 w-3" /> Up
    </span>
  );
  if (trend === 'down') return (
    <span className="inline-flex items-center gap-1 text-[11px] font-bold text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-500/10 px-2 py-0.5 rounded-full border border-rose-200 dark:border-rose-500/20 whitespace-nowrap">
      <TrendingDown className="h-3 w-3" /> Down
    </span>
  );
  if (trend === 'flat') return (
    <span className="inline-flex items-center gap-1 text-[11px] font-bold text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-full whitespace-nowrap">
      <Minus className="h-3 w-3" /> Flat
    </span>
  );
  return <span className="text-[11px] text-slate-300 dark:text-slate-600">—</span>;
}

function relativeDate(dateStr: string) {
  const d    = new Date(dateStr + 'T12:00:00');
  const days = Math.floor((Date.now() - d.getTime()) / 86_400_000);
  if (days === 0) return 'Today';
  if (days === 1) return 'Yesterday';
  if (days < 7)  return `${days}d ago`;
  if (days < 30) return `${Math.floor(days / 7)}w ago`;
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
}

// ── Skeletons ─────────────────────────────────────────────────────────────────

function RowSkeleton({ even }: { even: boolean }) {
  return (
    <tr className={cn(
      'border-b border-slate-100 dark:border-white/[0.04] animate-pulse',
      even ? 'bg-slate-50/50 dark:bg-white/[0.015]' : 'bg-white dark:bg-transparent'
    )}>
      <td className="px-5 py-3.5">
        <div className="flex items-center gap-2.5">
          <div className="h-8 w-8 rounded-full bg-slate-200 dark:bg-white/5 shrink-0" />
          <div className="h-3.5 w-24 bg-slate-200 dark:bg-white/5 rounded" />
        </div>
      </td>
      {[1, 2, 3, 4, 5].map(i => (
        <td key={i} className="px-5 py-3.5">
          <div className="h-3.5 w-12 bg-slate-100 dark:bg-white/5 rounded" />
        </td>
      ))}
    </tr>
  );
}

function MobileCardSkeleton() {
  return (
    <div className="px-4 py-3 flex items-center gap-3 animate-pulse">
      <div className="h-9 w-9 rounded-full bg-slate-200 dark:bg-white/5 shrink-0" />
      <div className="flex-1 space-y-2">
        <div className="h-3.5 w-28 bg-slate-200 dark:bg-white/5 rounded" />
        <div className="h-3 w-20 bg-slate-100 dark:bg-white/5 rounded" />
      </div>
      <div className="h-5 w-12 bg-slate-100 dark:bg-white/5 rounded-full" />
    </div>
  );
}

// ── Pagination (unchanged logic, reskinned) ───────────────────────────────────

function PaginationBar({
  page, pageCount, hasPrev, hasNext, onPrev, onNext, onPage,
}: {
  page: number; pageCount: number;
  hasPrev: boolean; hasNext: boolean;
  onPrev: () => void; onNext: () => void;
  onPage: (i: number) => void;
}) {
  return (
    <div className="flex items-center justify-between px-4 sm:px-5 py-3 border-t border-slate-100 dark:border-white/[0.05]">
      <button
        onClick={onPrev}
        disabled={!hasPrev}
        className={cn(
          'h-8 w-8 rounded-full flex items-center justify-center transition-all',
          hasPrev
            ? 'bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-slate-300 hover:bg-brand-teal-100 dark:hover:bg-brand-teal-500/20 hover:text-brand-teal-600 dark:hover:text-brand-teal-400'
            : 'text-slate-300 dark:text-slate-700 cursor-not-allowed'
        )}
        aria-label="Previous page"
      >
        <ChevronLeft className="h-4 w-4" />
      </button>

      {pageCount <= 7 ? (
        <div className="flex items-center gap-1.5">
          {Array.from({ length: pageCount }, (_, i) => (
            <button
              key={i}
              onClick={() => onPage(i)}
              className={cn(
                'rounded-full transition-all',
                i === page
                  ? 'h-2 w-5 bg-brand-teal-500 dark:bg-brand-teal-400'
                  : 'h-2 w-2 bg-slate-200 dark:bg-white/10 hover:bg-slate-300 dark:hover:bg-white/20'
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
        onClick={onNext}
        disabled={!hasNext}
        className={cn(
          'h-8 w-8 rounded-full flex items-center justify-center transition-all',
          hasNext
            ? 'bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-slate-300 hover:bg-brand-teal-100 dark:hover:bg-brand-teal-500/20 hover:text-brand-teal-600 dark:hover:text-brand-teal-400'
            : 'text-slate-300 dark:text-slate-700 cursor-not-allowed'
        )}
        aria-label="Next page"
      >
        <ChevronRight className="h-4 w-4" />
      </button>
    </div>
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

  const goToStudent = (row: BandOverviewRow) => {
    if (!batchId) return;
    navigate(`/instructor/batches/${batchId}/students/${row.user_id}/progress`, { state: { studentId: row.user_id } });
  };

  return (
    <div className="
      rounded-2xl overflow-hidden
      bg-white dark:bg-[#0E0E16]
      border border-slate-200/70 dark:border-white/[0.06]
      shadow-[0_2px_12px_-4px_rgba(15,23,42,0.08)] dark:shadow-none
    ">
      {/* Header */}
      <div className="flex items-center justify-between px-4 sm:px-5 py-4 border-b border-slate-100 dark:border-white/[0.05]">
        <div className="flex items-center gap-2.5">
          <div className="h-8 w-8 rounded-xl bg-brand-teal-100 dark:bg-brand-teal-500/15 flex items-center justify-center shrink-0">
            <Target className="h-4 w-4 text-brand-teal-600 dark:text-brand-teal-400" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-800 dark:text-white leading-tight">Band Score Overview</h3>
            <p className="text-[11px] text-slate-400 dark:text-slate-500 leading-tight">Sorted by gap to target — widest first</p>
          </div>
        </div>
        {!loading && rows.length > 0 && (
          <span className="text-xs text-slate-400 dark:text-slate-500 font-medium">{rows.length} students</span>
        )}
      </div>

      {/* ── Mobile card view ── */}
      <div className="md:hidden">
        {loading ? (
          <div className="divide-y divide-slate-100 dark:divide-white/[0.04]">
            {Array.from({ length: PAGE_SIZE }, (_, i) => <MobileCardSkeleton key={i} />)}
          </div>
        ) : rows.length === 0 ? (
          <div className="px-5 py-12 text-center text-sm text-slate-400">
            No students enrolled in this batch yet.
          </div>
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-white/[0.04]">
            {pageRows.map((row, idx) => (
              <div
                key={row.student_id}
                onClick={() => goToStudent(row)}
                className={cn(
                  'px-4 py-3 flex items-center gap-3 cursor-pointer transition-colors group',
                  idx % 2 === 0
                    ? 'bg-white dark:bg-transparent'
                    : 'bg-slate-50/60 dark:bg-white/[0.018]',
                  'hover:bg-brand-teal-50/60 dark:hover:bg-brand-teal-500/[0.06]',
                )}
              >
                <div className={cn(
                  'h-9 w-9 rounded-full shrink-0 flex items-center justify-center text-xs font-black overflow-hidden',
                  row.avatar ? '' : avatarPalette(row.name)
                )}>
                  {row.avatar
                    ? <img src={row.avatar} alt={row.name} className="h-full w-full object-cover" />
                    : initials(row.name)
                  }
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2 mb-0.5">
                    <p className="text-sm font-semibold text-slate-800 dark:text-white truncate">{row.name}</p>
                    <TrendCell trend={row.band_trend} />
                  </div>
                  <div className="flex items-center gap-2 flex-wrap">
                    {/* Band badge */}
                    <span className={cn('text-xs font-black px-2 py-0.5 rounded-full tabular-nums', bandBadge(row.current_band))}>
                      {row.current_band !== null ? row.current_band.toFixed(1) : '—'}
                    </span>
                    {row.gap !== null && (
                      <span className={cn('text-xs font-bold px-1.5 py-0.5 rounded-full', gapPillColor(row.gap))}>
                        {row.gap <= 0 ? `+${Math.abs(row.gap).toFixed(1)}` : `−${row.gap.toFixed(1)}`}
                      </span>
                    )}
                    {row.last_ia_date
                      ? <span className="text-[11px] text-slate-400">{relativeDate(row.last_ia_date)}</span>
                      : <span className="text-[11px] text-slate-300 dark:text-slate-600">No IA yet</span>
                    }
                  </div>
                </div>
                <ChevronRight className="h-4 w-4 text-slate-300 dark:text-slate-600 group-hover:text-brand-teal-500 transition-colors shrink-0" />
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── Desktop table view ── */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-slate-100 dark:border-white/[0.05] bg-slate-50/80 dark:bg-white/[0.02]">
              {['Student', 'Current Band', 'Target', 'Gap', 'Last IA', 'Trend', ''].map(h => (
                <th
                  key={h}
                  className="px-5 py-3 text-left text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.12em] whitespace-nowrap"
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              Array.from({ length: PAGE_SIZE }, (_, i) => <RowSkeleton key={i} even={i % 2 === 1} />)
            ) : rows.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-5 py-12 text-center text-sm text-slate-400">
                  No students enrolled in this batch yet.
                </td>
              </tr>
            ) : (
              pageRows.map((row, idx) => (
                <tr
                  key={row.student_id}
                  onClick={() => goToStudent(row)}
                  className={cn(
                    'border-b border-slate-50 dark:border-white/[0.03] cursor-pointer transition-all duration-150 group',
                    // Zebra
                    idx % 2 === 0
                      ? 'bg-white dark:bg-transparent'
                      : 'bg-slate-50/60 dark:bg-white/[0.018]',
                    // Hover: subtle glow row
                    'hover:bg-brand-teal-50/50 dark:hover:bg-brand-teal-500/[0.06]',
                    'dark:hover:shadow-[inset_0_0_0_1px_rgba(99,102,241,0.12)]',
                  )}
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
                      <span className="font-semibold text-slate-800 dark:text-slate-100 text-sm whitespace-nowrap">
                        {row.name}
                      </span>
                    </div>
                  </td>

                  {/* Current Band — colored badge */}
                  <td className="px-5 py-3.5">
                    <span className={cn(
                      'inline-block text-sm font-black tabular-nums px-2.5 py-0.5 rounded-full',
                      bandBadge(row.current_band)
                    )}>
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

                  {/* Last IA */}
                  <td className="px-5 py-3.5 whitespace-nowrap">
                    {row.last_ia_date ? (
                      <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                        {relativeDate(row.last_ia_date)}
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
                    <ChevronRight className="h-4 w-4 text-slate-300 dark:text-slate-600 group-hover:text-brand-teal-500 dark:group-hover:text-brand-teal-400 transition-colors" />
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {!loading && pageCount > 1 && (
        <PaginationBar
          page={page} pageCount={pageCount}
          hasPrev={hasPrev} hasNext={hasNext}
          onPrev={() => setPage(p => p - 1)}
          onNext={() => setPage(p => p + 1)}
          onPage={setPage}
        />
      )}
    </div>
  );
}