// src/features/Instructor/dashboard/BandOverviewTable.tsx
import { useState, useEffect } from 'react';
import { TrendingUp, TrendingDown, Minus, ChevronRight, ChevronLeft, Target } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/shared/utils';
import type { BandOverviewRow } from './types';
import { isSpokenEnglish } from '@/features/student/utils/exam';
import { CEFR_ORDER, cefrBg, cefrColor } from '@/features/student/config/cefrDisplay';

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
  'bg-brand-teal-100 text-brand-teal-700',
  'bg-brand-blue-100 text-brand-blue-700',
  'bg-sky-100 text-sky-700',
  'bg-teal-100 text-teal-700',
  'bg-amber-100 text-amber-700',
  'bg-rose-100 text-rose-700',
];
function avatarPalette(name: string) {
  const code = name.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0);
  return AVATAR_PALETTES[code % AVATAR_PALETTES.length];
}

function bandTextColor(band: number | null) {
  if (band === null) return 'text-brand-text-mute';
  if (band >= 7.5)  return 'text-emerald-600';
  if (band >= 6.0)  return 'text-sky-600';
  if (band >= 5.0)  return 'text-amber-600';
  return 'text-rose-600';
}

// Colored badge with border
function bandBadge(band: number | null): string {
  if (band === null) return 'bg-brand-bg-alt text-brand-text-mute border border-brand-line';
  if (band >= 7.5)  return 'bg-emerald-50 text-emerald-700 border border-emerald-200';
  if (band >= 6.0)  return 'bg-sky-50 text-sky-700 border border-sky-200';
  if (band >= 5.0)  return 'bg-amber-50 text-amber-700 border border-amber-200';
  return 'bg-rose-50 text-rose-700 border border-rose-200';
}

// current_band for a Spoken English row is a CEFR ordinal (0-6, computed
// server-side from CEFR_ORDINAL, see batchDashboardQueries.computeCurrentBand)
// stamped into the same numeric column an IELTS band (0-9) uses — it must never
// be shown with IELTS thresholds/colors or the "Band" framing. CEFR_ORDINAL
// (backend) and CEFR_ORDER (frontend) are the same ladder in the same order, so
// rounding the ordinal and indexing CEFR_ORDER recovers the real level label
// (e.g. 2.5 -> "B1") without any extra backend field — same rounding convention
// as DiagnosticOverviewTab/BatchReportTemplate's cefrLevelLabel.
function cefrLevelLabel(ordinal: number | null): string | null {
  if (ordinal === null) return null;
  const i = Math.max(0, Math.min(CEFR_ORDER.length - 1, Math.round(ordinal)));
  return CEFR_ORDER[i];
}

function gapPillColor(gap: number | null) {
  if (gap === null) return 'bg-brand-bg-alt text-brand-text-mute';
  if (gap <= 0)     return 'bg-emerald-50 text-emerald-700 border border-emerald-200';
  if (gap > 2.0)    return 'bg-rose-50 text-rose-700 border border-rose-200';
  if (gap > 1.0)    return 'bg-amber-50 text-amber-700 border border-amber-200';
  return 'bg-sky-50 text-sky-700 border border-sky-200';
}

function TrendCell({ trend }: { trend: BandOverviewRow['band_trend'] }) {
  if (trend === 'up') return (
    <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200 whitespace-nowrap">
      <TrendingUp className="h-3 w-3" /> Up
    </span>
  );
  if (trend === 'down') return (
    <span className="inline-flex items-center gap-1 text-[11px] font-bold text-rose-600 bg-rose-50 px-2 py-0.5 rounded-full border border-rose-200 whitespace-nowrap">
      <TrendingDown className="h-3 w-3" /> Down
    </span>
  );
  if (trend === 'flat') return (
    <span className="inline-flex items-center gap-1 text-[11px] font-bold text-brand-text-mute bg-brand-bg-alt px-2 py-0.5 rounded-full whitespace-nowrap">
      <Minus className="h-3 w-3" /> Flat
    </span>
  );
  return <span className="text-[11px] text-brand-text-mute">—</span>;
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
      'border-b border-brand-line animate-pulse',
      even ? 'bg-brand-bg-alt/50' : 'bg-white'
    )}>
      <td className="px-5 py-3.5">
        <div className="flex items-center gap-2.5">
          <div className="h-8 w-8 rounded-full bg-brand-bg-alt shrink-0" />
          <div className="h-3.5 w-24 bg-brand-bg-alt rounded" />
        </div>
      </td>
      {[1, 2, 3, 4, 5].map(i => (
        <td key={i} className="px-5 py-3.5">
          <div className="h-3.5 w-12 bg-brand-bg-alt rounded" />
        </td>
      ))}
    </tr>
  );
}

function MobileCardSkeleton() {
  return (
    <div className="px-4 py-3 flex items-center gap-3 animate-pulse">
      <div className="h-9 w-9 rounded-full bg-brand-bg-alt shrink-0" />
      <div className="flex-1 space-y-2">
        <div className="h-3.5 w-28 bg-brand-bg-alt rounded" />
        <div className="h-3 w-20 bg-brand-bg-alt rounded" />
      </div>
      <div className="h-5 w-12 bg-brand-bg-alt rounded-full" />
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
    <div className="flex items-center justify-between px-4 sm:px-5 py-3 border-t border-brand-line">
      <button
        onClick={onPrev}
        disabled={!hasPrev}
        className={cn(
          'h-8 w-8 rounded-full flex items-center justify-center transition-all',
          hasPrev
            ? 'bg-brand-bg-alt text-brand-text hover:bg-brand-teal-100 hover:text-brand-teal-600'
            : 'text-brand-text-mute cursor-not-allowed'
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
                  ? 'h-2 w-5 bg-brand-teal-500'
                  : 'h-2 w-2 bg-brand-line hover:bg-brand-text-mute'
              )}
              aria-label={`Page ${i + 1}`}
            />
          ))}
        </div>
      ) : (
        <span className="text-xs font-semibold text-brand-text-mute">
          {page + 1} / {pageCount}
        </span>
      )}

      <button
        onClick={onNext}
        disabled={!hasNext}
        className={cn(
          'h-8 w-8 rounded-full flex items-center justify-center transition-all',
          hasNext
            ? 'bg-brand-bg-alt text-brand-text hover:bg-brand-teal-100 hover:text-brand-teal-600'
            : 'text-brand-text-mute cursor-not-allowed'
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
      bg-white
      border border-brand-line
      shadow-sm
    ">
      {/* Header */}
      <div className="flex items-center justify-between px-4 sm:px-5 py-4 border-b border-brand-line">
        <div className="flex items-center gap-2.5">
          <div className="h-8 w-8 rounded-xl bg-brand-teal-100 flex items-center justify-center shrink-0">
            <Target className="h-4 w-4 text-brand-teal-600" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-brand-text leading-tight">Band Score Overview</h3>
            <p className="text-[11px] text-brand-text-mute leading-tight">Sorted by gap to target — widest first</p>
          </div>
        </div>
        {!loading && rows.length > 0 && (
          <span className="text-xs text-brand-text-mute font-medium">{rows.length} students</span>
        )}
      </div>

      {/* ── Mobile card view ── */}
      <div className="md:hidden">
        {loading ? (
          <div className="divide-y divide-brand-line">
            {Array.from({ length: PAGE_SIZE }, (_, i) => <MobileCardSkeleton key={i} />)}
          </div>
        ) : rows.length === 0 ? (
          <div className="px-5 py-12 text-center text-sm text-brand-text-mute">
            No students enrolled in this batch yet.
          </div>
        ) : (
          <div className="divide-y divide-brand-line">
            {pageRows.map((row, idx) => (
              <div
                key={row.student_id}
                onClick={() => goToStudent(row)}
                className={cn(
                  'px-4 py-3 flex items-center gap-3 cursor-pointer transition-colors group',
                  idx % 2 === 0
                    ? 'bg-white'
                    : 'bg-brand-bg-alt/60',
                  'hover:bg-brand-teal-50/60',
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
                    <p className="text-sm font-semibold text-brand-text truncate">{row.name}</p>
                    <TrendCell trend={row.band_trend} />
                  </div>
                  <div className="flex items-center gap-2 flex-wrap">
                    {/* Band badge — CEFR level for Spoken English, IELTS band otherwise */}
                    {isSpokenEnglish(row.exam_id) ? (
                      <span className={cn('text-xs font-black px-2 py-0.5 rounded-full border', cefrBg(cefrLevelLabel(row.current_band) ?? undefined), cefrColor(cefrLevelLabel(row.current_band) ?? undefined))}>
                        {cefrLevelLabel(row.current_band) ?? '—'}
                      </span>
                    ) : (
                      <span className={cn('text-xs font-black px-2 py-0.5 rounded-full tabular-nums', bandBadge(row.current_band))}>
                        {row.current_band !== null ? row.current_band.toFixed(1) : '—'}
                      </span>
                    )}
                    {!isSpokenEnglish(row.exam_id) && row.gap !== null && (
                      <span className={cn('text-xs font-bold px-1.5 py-0.5 rounded-full', gapPillColor(row.gap))}>
                        {row.gap <= 0 ? `+${Math.abs(row.gap).toFixed(1)}` : `−${row.gap.toFixed(1)}`}
                      </span>
                    )}
                    {row.last_ia_date
                      ? <span className="text-[11px] text-brand-text-mute">{relativeDate(row.last_ia_date)}</span>
                      : <span className="text-[11px] text-brand-text-mute">No IA yet</span>
                    }
                  </div>
                </div>
                <ChevronRight className="h-4 w-4 text-brand-text-mute group-hover:text-brand-teal-500 transition-colors shrink-0" />
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── Desktop table view ── */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-brand-line bg-brand-bg-alt/80">
              {['Student', 'Current Band', 'Target', 'Gap', 'Last IA', 'Trend', ''].map(h => (
                <th
                  key={h}
                  className="font-jetbrains px-5 py-3 text-left text-[10px] font-black text-brand-text-mute uppercase tracking-[0.12em] whitespace-nowrap"
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
                <td colSpan={7} className="px-5 py-12 text-center text-sm text-brand-text-mute">
                  No students enrolled in this batch yet.
                </td>
              </tr>
            ) : (
              pageRows.map((row, idx) => (
                <tr
                  key={row.student_id}
                  onClick={() => goToStudent(row)}
                  className={cn(
                    'border-b border-brand-line cursor-pointer transition-all duration-150 group',
                    // Zebra
                    idx % 2 === 0
                      ? 'bg-white'
                      : 'bg-brand-bg-alt/60',
                    // Hover
                    'hover:bg-brand-teal-50/50',
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
                      <span className="font-semibold text-brand-text text-sm whitespace-nowrap">
                        {row.name}
                      </span>
                    </div>
                  </td>

                  {/* Current Band — CEFR level for Spoken English, IELTS band badge otherwise */}
                  <td className="px-5 py-3.5">
                    {isSpokenEnglish(row.exam_id) ? (
                      <span className={cn(
                        'inline-block text-sm font-black px-2.5 py-0.5 rounded-full border',
                        cefrBg(cefrLevelLabel(row.current_band) ?? undefined),
                        cefrColor(cefrLevelLabel(row.current_band) ?? undefined)
                      )}>
                        {cefrLevelLabel(row.current_band) ?? '—'}
                      </span>
                    ) : (
                      <span className={cn(
                        'inline-block text-sm font-black tabular-nums px-2.5 py-0.5 rounded-full',
                        bandBadge(row.current_band)
                      )}>
                        {row.current_band !== null ? row.current_band.toFixed(1) : '—'}
                      </span>
                    )}
                  </td>

                  {/* Target — IELTS-only concept; Spoken English has no numeric target band here */}
                  <td className="px-5 py-3.5">
                    <span className="text-sm font-semibold text-brand-text-mute tabular-nums">
                      {!isSpokenEnglish(row.exam_id) && row.target_band !== null ? row.target_band.toFixed(1) : '—'}
                    </span>
                  </td>

                  {/* Gap */}
                  <td className="px-5 py-3.5">
                    {!isSpokenEnglish(row.exam_id) && row.gap !== null ? (
                      <span className={cn('text-xs font-bold px-2 py-0.5 rounded-full', gapPillColor(row.gap))}>
                        {row.gap <= 0
                          ? `+${Math.abs(row.gap).toFixed(1)}`
                          : `−${row.gap.toFixed(1)}`
                        }
                      </span>
                    ) : (
                      <span className="text-brand-text-mute text-xs">—</span>
                    )}
                  </td>

                  {/* Last IA */}
                  <td className="px-5 py-3.5 whitespace-nowrap">
                    {row.last_ia_date ? (
                      <span className="text-xs font-semibold text-brand-text-mute">
                        {relativeDate(row.last_ia_date)}
                      </span>
                    ) : (
                      <span className="text-xs text-brand-text-mute">No IA yet</span>
                    )}
                  </td>

                  {/* Trend */}
                  <td className="px-5 py-3.5">
                    <TrendCell trend={row.band_trend} />
                  </td>

                  {/* Arrow */}
                  <td className="px-5 py-3.5">
                    <ChevronRight className="h-4 w-4 text-brand-text-mute group-hover:text-brand-teal-500 transition-colors" />
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