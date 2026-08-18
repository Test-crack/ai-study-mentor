// src/features/Instructor/dashboard/AtRiskStudentList.tsx
import { useState, useEffect } from 'react';
import { AlertTriangle, CheckCircle2, Clock, ClipboardX, TrendingDown, Stethoscope, Zap, ArrowRight, ChevronLeft, ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/shared/utils';
import type { AtRiskStudent } from './types';

const PAGE_SIZE = 4;

interface AtRiskStudentListProps {
  students: AtRiskStudent[];
  batchId:  string | null;
  loading:  boolean;
}

type Severity = 'critical' | 'warning' | 'info';

function getSeverity(flags: string[]): Severity {
  const t = flags.join(' ').toLowerCase();
  if (t.includes('assessment') || t.includes('declining')) return 'critical';
  if (t.includes('activity') || t.includes('days') || t.includes('momentum') || t.includes('never drilled')) return 'warning';
  return 'info';
}

const SEVERITY_CONFIG = {
  critical: {
    label:        'Critical',
    labelClass:   'bg-rose-100 text-rose-700 border border-rose-200',
    cardBorder:   'border-rose-200',
    cardBg:       'bg-rose-50/40',
    headerBg:     'bg-rose-50/60',
    dot:          'bg-rose-500',
    sectionLabel: 'text-rose-600',
    sectionLine:  'bg-rose-200',
  },
  warning: {
    label:        'Warning',
    labelClass:   'bg-amber-100 text-amber-700 border border-amber-200',
    cardBorder:   'border-amber-200',
    cardBg:       'bg-amber-50/40',
    headerBg:     'bg-amber-50/60',
    dot:          'bg-amber-500',
    sectionLabel: 'text-amber-600',
    sectionLine:  'bg-amber-200',
  },
  info: {
    label:        'Monitor',
    labelClass:   'bg-brand-bg-alt text-brand-text-mute border border-brand-line',
    cardBorder:   'border-brand-line',
    cardBg:       'bg-white',
    headerBg:     'bg-brand-bg-alt',
    dot:          'bg-brand-text-mute',
    sectionLabel: 'text-brand-text-mute',
    sectionLine:  'bg-brand-line',
  },
};

function getFlagMeta(flag: string): { icon: React.ReactNode; color: string } {
  const f = flag.toLowerCase();
  if (f.includes('assessment'))
    return { icon: <ClipboardX className="h-3 w-3 shrink-0" />, color: 'text-rose-600' };
  if (f.includes('declining'))
    return { icon: <TrendingDown className="h-3 w-3 shrink-0" />, color: 'text-rose-600' };
  if (f.includes('activity') || f.includes('days') || f.includes('never drilled'))
    return { icon: <Clock className="h-3 w-3 shrink-0" />, color: 'text-amber-600' };
  if (f.includes('momentum') || f.includes('streak'))
    return { icon: <Zap className="h-3 w-3 shrink-0" />, color: 'text-amber-600' };
  if (f.includes('diagnosed'))
    return { icon: <Stethoscope className="h-3 w-3 shrink-0" />, color: 'text-brand-text-mute' };
  return { icon: <AlertTriangle className="h-3 w-3 shrink-0" />, color: 'text-brand-text-mute' };
}

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
  const code = name.split('').reduce((a, c) => a + c.charCodeAt(0), 0);
  return AVATAR_PALETTES[code % AVATAR_PALETTES.length];
}

// ── Risk Card ─────────────────────────────────────────────────────────────────

function RiskCard({ student, severity, batchId }: { student: AtRiskStudent; severity: Severity; batchId: string | null }) {
  const navigate = useNavigate();
  const cfg      = SEVERITY_CONFIG[severity];

  const inactiveLabel =
    student.days_inactive === -1 ? 'Never drilled'
    : student.days_inactive === 0 ? 'Active today'
    : `${student.days_inactive}d inactive`;

  return (
    <div className={cn(
      'flex flex-col rounded-2xl border overflow-hidden transition-all duration-200',
      'hover:-translate-y-0.5',
      cfg.cardBg, cfg.cardBorder,
      'shadow-sm hover:shadow-md',
    )}>

      {/* Card header */}
      <div className={cn('px-3 sm:px-4 pt-3 sm:pt-4 pb-3', cfg.headerBg)}>
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2 sm:gap-2.5 min-w-0">
            <div className={cn(
              'h-8 w-8 sm:h-9 sm:w-9 rounded-full shrink-0 flex items-center justify-center text-xs font-black overflow-hidden',
              student.avatar ? '' : avatarPalette(student.name)
            )}>
              {student.avatar
                ? <img src={student.avatar} alt={student.name} className="h-full w-full object-cover" />
                : initials(student.name)
              }
            </div>
            <div className="min-w-0">
              <span className={cn('font-jetbrains text-[10px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded-md inline-block mb-0.5', cfg.labelClass)}>
                {cfg.label}
              </span>
              <p className="text-sm font-bold text-brand-text truncate leading-tight">
                {student.name}
              </p>
            </div>
          </div>
          <span className="shrink-0 text-[11px] font-bold text-brand-text-mute bg-brand-bg-alt px-2 py-0.5 rounded-full whitespace-nowrap border border-brand-line">
            {student.flags.length} flag{student.flags.length !== 1 ? 's' : ''}
          </span>
        </div>
      </div>

      {/* Metrics strip — zebra tinted cells */}
      <div className="grid grid-cols-3 divide-x divide-brand-line border-y border-brand-line">
        {[
          {
            label: 'Band',
            value: student.current_band !== null ? student.current_band.toFixed(1) : '—',
            color: student.current_band !== null
              ? student.current_band >= 6
                ? 'text-sky-600 font-black'
                : student.current_band >= 5
                  ? 'text-amber-600 font-black'
                  : 'text-rose-600 font-black'
              : 'text-brand-text-mute',
          },
          {
            label: 'Missed IAs',
            value: String(student.missed_ia_count),
            color: student.missed_ia_count >= 2
              ? 'text-rose-600 font-bold'
              : 'text-brand-text',
          },
          {
            label: 'Activity',
            value: inactiveLabel,
            color: student.days_inactive > 3 || student.days_inactive === -1
              ? 'text-amber-600'
              : 'text-brand-text-mute',
          },
        ].map((m, i) => (
          <div key={m.label} className={cn(
            'px-2 sm:px-3 py-2 text-center',
            i % 2 === 1 ? 'bg-brand-bg-alt' : ''
          )}>
            <p className="font-jetbrains text-[9px] sm:text-[10px] font-semibold text-brand-text-mute uppercase tracking-wider mb-0.5 truncate">{m.label}</p>
            <p className={cn('text-[11px] sm:text-xs leading-tight', m.color)}>{m.value}</p>
          </div>
        ))}
      </div>

      {/* Flags */}
      <div className="px-3 sm:px-4 py-3 space-y-1.5 flex-1">
        {student.flags.map((flag, i) => {
          const { icon, color } = getFlagMeta(flag);
          return (
            <div key={i} className="flex items-start gap-2">
              <span className="text-[10px] font-black text-brand-text-mute w-3 shrink-0 tabular-nums mt-0.5">{i + 1}</span>
              <span className={cn('flex items-center gap-1.5 text-xs font-medium leading-snug', color)}>
                {icon}{flag}
              </span>
            </div>
          );
        })}
      </div>

      {/* CTA — severity-tinted hover */}
      <div className="px-3 sm:px-4 pb-3 sm:pb-4 pt-1">
        <button
          onClick={() => {
            if (!batchId) return;
            navigate(`/instructor/batches/${batchId}/students/${student.user_id}/progress`, { state: { studentId: student.user_id } });
          }}
          className={cn(
            'w-full flex items-center justify-between gap-2 px-3 py-2.5 rounded-xl',
            'text-xs font-bold transition-all duration-200 group',
            'bg-brand-bg-alt',
            'border border-brand-line',
            'text-brand-text-mute',
            'hover:bg-brand-teal-50',
            'hover:text-brand-teal-600',
            'hover:border-brand-teal-200',
          )}
        >
          View Student Profile
          <ArrowRight className="h-3.5 w-3.5 group-hover:translate-x-0.5 transition-transform shrink-0" />
        </button>
      </div>
    </div>
  );
}

// ── Skeleton ──────────────────────────────────────────────────────────────────

function CardSkeleton() {
  return (
    <div className="rounded-2xl border border-brand-line bg-white overflow-hidden animate-pulse">
      <div className="px-3 sm:px-4 pt-3 sm:pt-4 pb-3 bg-brand-bg-alt">
        <div className="flex items-center gap-2 sm:gap-2.5">
          <div className="h-8 w-8 sm:h-9 sm:w-9 rounded-full bg-brand-line shrink-0" />
          <div className="space-y-1.5 flex-1">
            <div className="h-3 w-14 bg-brand-line rounded" />
            <div className="h-3.5 w-24 bg-brand-line rounded" />
          </div>
        </div>
      </div>
      <div className="grid grid-cols-3 divide-x divide-brand-line border-y border-brand-line">
        {[1, 2, 3].map(i => (
          <div key={i} className="px-2 sm:px-3 py-2 flex flex-col items-center gap-1">
            <div className="h-2 w-8 bg-brand-bg-alt rounded" />
            <div className="h-3 w-6 bg-brand-line rounded" />
          </div>
        ))}
      </div>
      <div className="px-3 sm:px-4 py-3 space-y-2">
        {[1, 2, 3].map(i => <div key={i} className="h-3 w-full bg-brand-bg-alt rounded" />)}
      </div>
      <div className="px-3 sm:px-4 pb-3 sm:pb-4 pt-1">
        <div className="h-9 w-full bg-brand-bg-alt rounded-xl" />
      </div>
    </div>
  );
}

// ── Section divider ───────────────────────────────────────────────────────────

function SectionDivider({ label, count, severity }: { label: string; count: number; severity: Severity }) {
  const cfg = SEVERITY_CONFIG[severity];
  return (
    <div className="flex items-center gap-3 col-span-full">
      <div className={cn('font-jetbrains flex items-center gap-1.5 text-[11px] font-black uppercase tracking-widest shrink-0', cfg.sectionLabel)}>
        <span className={cn('h-1.5 w-1.5 rounded-full', cfg.dot)} />
        {label}
        <span className="font-semibold opacity-60">({count})</span>
      </div>
      <div className={cn('flex-1 h-px', cfg.sectionLine)} />
    </div>
  );
}

// ── Main ─────────────────────────────────────────────────────────────────────

export function AtRiskStudentList({ students, batchId, loading }: AtRiskStudentListProps) {
  const [page, setPage] = useState(0);
  useEffect(() => { setPage(0); }, [students.length]);

  if (loading) {
    return (
      <div className="rounded-2xl border border-brand-line bg-white shadow-sm p-4 sm:p-5 space-y-4">
        <div className="h-5 w-40 bg-brand-line rounded animate-pulse" />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {[1, 2, 3, 4].map(i => <CardSkeleton key={i} />)}
        </div>
      </div>
    );
  }

  if (students.length === 0) {
    return (
      <div className="rounded-2xl border border-brand-line bg-white px-6 py-10 flex flex-col items-center text-center shadow-sm">
        <div className="h-14 w-14 rounded-full bg-emerald-50 flex items-center justify-center mb-4 ring-4 ring-emerald-100/50">
          <CheckCircle2 className="h-7 w-7 text-emerald-500" />
        </div>
        <p className="text-sm font-bold text-brand-text mb-1">No students at risk</p>
        <p className="text-xs text-brand-text-mute max-w-xs">All students in this batch are meeting activity and performance thresholds.</p>
      </div>
    );
  }

  const SEV_ORDER: Record<Severity, number> = { critical: 0, warning: 1, info: 2 };
  const sorted = [...students].sort((a, b) => SEV_ORDER[getSeverity(a.flags)] - SEV_ORDER[getSeverity(b.flags)]);
  const groups: Record<Severity, number> = { critical: 0, warning: 0, info: 0 };
  for (const s of sorted) groups[getSeverity(s.flags)]++;

  const pageCount    = Math.ceil(sorted.length / PAGE_SIZE);
  const hasPrev      = page > 0;
  const hasNext      = page < pageCount - 1;
  const pageStudents = sorted.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  type RenderItem =
    | { kind: 'divider'; severity: Severity; label: string }
    | { kind: 'card'; student: AtRiskStudent; severity: Severity };

  const items: RenderItem[] = [];
  pageStudents.forEach((student, localIdx) => {
    const globalIdx  = page * PAGE_SIZE + localIdx;
    const prevGlobal = globalIdx > 0 ? sorted[globalIdx - 1] : null;
    const currSev    = getSeverity(student.flags);
    const prevSev    = prevGlobal ? getSeverity(prevGlobal.flags) : null;
    if (currSev !== prevSev) {
      const label = currSev === 'critical' ? 'Critical' : currSev === 'warning' ? 'Warning' : 'Monitor';
      items.push({ kind: 'divider', severity: currSev, label });
    }
    items.push({ kind: 'card', student, severity: currSev });
  });

  return (
    <div className="rounded-2xl border border-brand-line bg-white shadow-sm p-4 sm:p-5 space-y-4 sm:space-y-5">

      {/* Panel header */}
      <div className="flex items-start sm:items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="h-8 w-8 rounded-xl bg-rose-100 flex items-center justify-center shrink-0">
            <AlertTriangle className="h-4 w-4 text-rose-600" />
          </div>
          <div className="min-w-0">
            <h3 className="text-sm font-bold text-brand-text leading-tight">Student Risk Monitor</h3>
            <p className="text-[11px] text-brand-text-mute leading-tight">Flagged by activity &amp; performance rules</p>
          </div>
        </div>
        <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
          {groups.critical > 0 && (
            <span className="flex items-center gap-1 text-[11px] font-bold text-rose-600 bg-rose-50 px-2 sm:px-2.5 py-1 rounded-full border border-rose-200 whitespace-nowrap">
              <span className="h-1.5 w-1.5 rounded-full bg-rose-500 shrink-0" />{groups.critical} critical
            </span>
          )}
          {groups.warning > 0 && (
            <span className="flex items-center gap-1 text-[11px] font-bold text-amber-600 bg-amber-50 px-2 sm:px-2.5 py-1 rounded-full border border-amber-200 whitespace-nowrap">
              <span className="h-1.5 w-1.5 rounded-full bg-amber-500 shrink-0" />{groups.warning} warning
            </span>
          )}
          {groups.info > 0 && (
            <span className="flex items-center gap-1 text-[11px] font-bold text-brand-text-mute bg-brand-bg-alt px-2 sm:px-2.5 py-1 rounded-full border border-brand-line whitespace-nowrap">
              <span className="h-1.5 w-1.5 rounded-full bg-brand-text-mute shrink-0" />{groups.info} monitor
            </span>
          )}
        </div>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-4">
        {items.map((item, i) =>
          item.kind === 'divider' ? (
            <SectionDivider key={`div-${item.severity}-${i}`} label={item.label} count={groups[item.severity]} severity={item.severity} />
          ) : (
            <RiskCard key={item.student.student_id} student={item.student} severity={item.severity} batchId={batchId} />
          )
        )}
      </div>

      {/* Pagination */}
      {pageCount > 1 && (
        <div className="flex items-center justify-between pt-1 border-t border-brand-line">
          <button
            onClick={() => setPage(p => p - 1)}
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
                  onClick={() => setPage(i)}
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
            <span className="text-xs font-semibold text-brand-text-mute">{page + 1} / {pageCount}</span>
          )}
          <button
            onClick={() => setPage(p => p + 1)}
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
      )}
    </div>
  );
}