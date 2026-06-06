/**
 * StudentActivityGrid
 *
 * Full-width card grid showing every student in the batch at a glance.
 * Each card shows today's drill status (dots), streak, LexiGrid, band,
 * and surfaces an at-risk badge when flags exist.
 *
 * Cards are colour-coded by drill completion:
 *   Green border  = drilled ≥2 today (platform unlocked)
 *   Amber border  = drilled 1 today (in progress)
 *   Rose border   = not drilled today
 */

import { useState, useEffect } from 'react';
import { Flame, AlertTriangle, ChevronRight, ChevronLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/shared/utils';
import type { BandOverviewRow } from './types';

const PAGE_SIZE = 8; // 4 columns × 2 rows

interface StudentActivityGridProps {
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
  const code = name.split('').reduce((a, c) => a + c.charCodeAt(0), 0);
  return AVATAR_PALETTES[code % AVATAR_PALETTES.length];
}

function bandTextColor(band: number | null) {
  if (band === null) return 'text-slate-400';
  if (band >= 7.5)  return 'text-emerald-600 dark:text-emerald-400';
  if (band >= 6.0)  return 'text-sky-600 dark:text-sky-400';
  if (band >= 5.0)  return 'text-amber-600 dark:text-amber-400';
  return 'text-rose-600 dark:text-rose-400';
}

/** Drill dot indicator — shows 2 circles (required) filled proportionally. */
function DrillDots({ count }: { count: number }) {
  const MAX = 2;
  return (
    <div className="flex items-center gap-1" title={`${count} drill${count !== 1 ? 's' : ''} today`}>
      {Array.from({ length: MAX }, (_, i) => (
        <span
          key={i}
          className={cn(
            'h-2.5 w-2.5 rounded-full transition-colors',
            i < count
              ? count >= MAX
                ? 'bg-emerald-500'
                : 'bg-amber-500'
              : 'bg-slate-200 dark:bg-slate-700'
          )}
        />
      ))}
    </div>
  );
}

/** LexiGrid status pill */
function LexiPill({ done, words }: { done: boolean; words: number | null }) {
  return (
    <span
      title={done ? `LexiGrid: ${words ?? 0} words` : 'LexiGrid not played today'}
      className={cn(
        'inline-flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 rounded',
        done
          ? 'bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400'
          : 'bg-slate-100 dark:bg-slate-800 text-slate-400'
      )}
    >
      {/* Simple grid icon made from dots */}
      <span className="grid grid-cols-2 gap-px w-2.5 h-2.5 shrink-0">
        {Array.from({ length: 4 }, (_, i) => (
          <span key={i} className={cn('rounded-[1px]', done ? 'bg-emerald-500' : 'bg-slate-300 dark:bg-slate-600')} />
        ))}
      </span>
      {done ? (words !== null ? `${words}w` : '✓') : '—'}
    </span>
  );
}

// ── Card ──────────────────────────────────────────────────────────────────────

function StudentCard({ row, batchId }: { row: BandOverviewRow; batchId: string | null }) {
  const navigate = useNavigate();

  const borderColor =
    row.drills_count_today >= 2 ? 'border-emerald-400 dark:border-emerald-500/60' :
    row.drills_count_today === 1 ? 'border-amber-400 dark:border-amber-500/60' :
    'border-slate-200 dark:border-slate-700';

  const headerTint =
    row.drills_count_today >= 2 ? 'bg-emerald-50/60 dark:bg-emerald-500/5' :
    row.drills_count_today === 1 ? 'bg-amber-50/60 dark:bg-amber-500/5' :
    'bg-slate-50 dark:bg-slate-800/40';

  return (
    <button
      onClick={() => {
        if (!batchId) return;
        const slug = row.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'student';
        navigate(`/instructor/students/${slug}/progress`, { state: { batchId, studentId: row.user_id } });
      }}
      className={cn(
        'group w-full text-left bg-white dark:bg-slate-900 rounded-2xl border-2 shadow-sm',
        'hover:shadow-md hover:border-indigo-400 dark:hover:border-indigo-500/60 transition-all duration-200',
        borderColor
      )}
    >
      {/* Card header — avatar + name + risk badge */}
      <div className={cn('px-4 pt-4 pb-3 flex items-start gap-3 rounded-t-2xl', headerTint)}>
        {/* Avatar */}
        <div className={cn(
          'h-10 w-10 rounded-full shrink-0 flex items-center justify-center text-sm font-black overflow-hidden',
          row.avatar ? '' : avatarPalette(row.name)
        )}>
          {row.avatar
            ? <img src={row.avatar} alt={row.name} className="h-full w-full object-cover" />
            : initials(row.name)
          }
        </div>

        {/* Name + risk */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <p className="text-sm font-bold text-slate-800 dark:text-white truncate leading-tight">
              {row.name}
            </p>
            {row.is_at_risk && (
              <AlertTriangle
                className="h-3.5 w-3.5 text-amber-500 shrink-0"
                title={row.risk_primary_flag ?? 'At risk'}
              />
            )}
          </div>
          {/* Band */}
          <p className={cn('text-xs font-bold mt-0.5', bandTextColor(row.current_band))}>
            {row.current_band !== null
              ? `Band ${row.current_band.toFixed(1)}`
              : <span className="text-slate-400 font-normal">No band yet</span>
            }
          </p>
        </div>

        <ChevronRight className="h-3.5 w-3.5 text-slate-300 dark:text-slate-600 group-hover:text-indigo-500 transition-colors shrink-0 mt-1" />
      </div>

      {/* Card footer — drill dots + streak + lexigrid */}
      <div className="px-4 pb-3.5 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2.5">
          <DrillDots count={row.drills_count_today} />
          <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
            {row.drills_count_today === 0
              ? 'No drill'
              : `${row.drills_count_today} drill${row.drills_count_today !== 1 ? 's' : ''}`
            }
          </span>
        </div>

        <div className="flex items-center gap-2">
          {/* Streak */}
          {row.streak > 0 && (
            <span className="flex items-center gap-0.5 text-[11px] font-bold text-amber-500">
              <Flame className="h-3 w-3 shrink-0" />
              {row.streak}
            </span>
          )}
          {/* LexiGrid */}
          <LexiPill done={row.lexigrid_done_today} words={row.lexigrid_words_today} />
        </div>
      </div>
    </button>
  );
}

// ── Skeleton ──────────────────────────────────────────────────────────────────

function CardSkeleton() {
  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border-2 border-slate-200 dark:border-slate-700 animate-pulse">
      <div className="px-4 pt-4 pb-3 bg-slate-50 dark:bg-slate-800/40 rounded-t-2xl flex items-start gap-3">
        <div className="h-10 w-10 rounded-full bg-slate-200 dark:bg-slate-700 shrink-0" />
        <div className="flex-1 space-y-1.5">
          <div className="h-3.5 w-24 bg-slate-200 dark:bg-slate-700 rounded" />
          <div className="h-3 w-14 bg-slate-100 dark:bg-slate-800 rounded" />
        </div>
      </div>
      <div className="px-4 pb-3.5 flex items-center justify-between">
        <div className="flex gap-1">
          <div className="h-2.5 w-2.5 rounded-full bg-slate-200 dark:bg-slate-700" />
          <div className="h-2.5 w-2.5 rounded-full bg-slate-200 dark:bg-slate-700" />
        </div>
        <div className="h-4 w-12 rounded bg-slate-100 dark:bg-slate-800" />
      </div>
    </div>
  );
}

// ── Main ─────────────────────────────────────────────────────────────────────

export function StudentActivityGrid({ rows, batchId, loading }: StudentActivityGridProps) {
  const [page, setPage] = useState(0);

  // Reset to first page whenever the student list changes (e.g. batch switch)
  useEffect(() => { setPage(0); }, [rows.length]);

  if (loading) {
    return (
      <div className="space-y-3">
        <div className="h-5 w-36 bg-slate-200 dark:bg-slate-700 rounded animate-pulse" />
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {Array.from({ length: PAGE_SIZE }, (_, i) => <CardSkeleton key={i} />)}
        </div>
      </div>
    );
  }

  if (rows.length === 0) return null;

  const pageCount    = Math.ceil(rows.length / PAGE_SIZE);
  const pageRows     = rows.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);
  const hasPrev      = page > 0;
  const hasNext      = page < pageCount - 1;

  const drilledCount    = rows.filter(r => r.drills_count_today >= 2).length;
  const partialCount    = rows.filter(r => r.drills_count_today === 1).length;
  const notDrilledCount = rows.filter(r => r.drills_count_today === 0).length;
  const lexiCount       = rows.filter(r => r.lexigrid_done_today).length;

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm p-5 space-y-4">

      {/* Section header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-sm font-bold text-slate-800 dark:text-white">Today's Batch Activity</h2>
          <p className="text-[11px] text-slate-400 mt-0.5">
            Drill status, streak &amp; LexiGrid for each student
          </p>
        </div>
        {/* Quick summary chips */}
        <div className="hidden sm:flex items-center gap-2 flex-wrap justify-end">
          <span className="flex items-center gap-1 text-[11px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10 px-2 py-0.5 rounded-full">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
            {drilledCount} unlocked
          </span>
          {partialCount > 0 && (
            <span className="flex items-center gap-1 text-[11px] font-bold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-500/10 px-2 py-0.5 rounded-full">
              <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
              {partialCount} partial
            </span>
          )}
          {notDrilledCount > 0 && (
            <span className="flex items-center gap-1 text-[11px] font-bold text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-full">
              <span className="h-1.5 w-1.5 rounded-full bg-slate-400" />
              {notDrilledCount} not started
            </span>
          )}
          <span className="text-[11px] text-slate-400">
            · LexiGrid {lexiCount}/{rows.length}
          </span>
        </div>
      </div>

      {/* 4 × 2 grid — always 4 columns on ≥sm, 2 on xs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {pageRows.map(row => (
          <StudentCard key={row.student_id} row={row} batchId={batchId} />
        ))}
      </div>

      {/* Pagination bar — only rendered when more than one page */}
      {pageCount > 1 && (
        <div className="flex items-center justify-between pt-1">
          {/* Left arrow */}
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

          {/* Page indicators — dots when ≤7 pages, text otherwise */}
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

          {/* Right arrow */}
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
