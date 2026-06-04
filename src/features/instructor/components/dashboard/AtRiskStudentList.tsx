import { AlertTriangle, ChevronRight, CheckCircle2, Clock, ClipboardX, TrendingDown, Stethoscope, Zap } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/shared/utils';
import type { AtRiskStudent } from './types';

interface AtRiskStudentListProps {
  students: AtRiskStudent[];
  batchId:  string | null;
  loading:  boolean;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function initials(name: string) {
  return name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
}

/** Consistent avatar color derived from name so every student gets their own hue. */
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

type Severity = 'critical' | 'warning' | 'info';

function getSeverity(flags: string[]): Severity {
  const text = flags.join(' ').toLowerCase();
  if (text.includes('assessment') || text.includes('declining')) return 'critical';
  if (text.includes('activity') || text.includes('days') || text.includes('momentum')) return 'warning';
  return 'info';
}

const SEVERITY_LEFT: Record<Severity, string> = {
  critical: 'border-l-rose-500',
  warning:  'border-l-amber-500',
  info:     'border-l-slate-300 dark:border-l-slate-600',
};

const SEVERITY_DOT: Record<Severity, string> = {
  critical: 'bg-rose-500',
  warning:  'bg-amber-500',
  info:     'bg-slate-400',
};

interface FlagConfig {
  icon:  React.ReactNode;
  color: string;
  match: (f: string) => boolean;
}

const FLAG_CONFIGS: FlagConfig[] = [
  { icon: <ClipboardX className="h-3 w-3" />,   color: 'bg-rose-50 dark:bg-rose-500/10 text-rose-700 dark:text-rose-400 border-rose-200 dark:border-rose-500/30',   match: f => f.toLowerCase().includes('assessment') },
  { icon: <TrendingDown className="h-3 w-3" />, color: 'bg-rose-50 dark:bg-rose-500/10 text-rose-700 dark:text-rose-400 border-rose-200 dark:border-rose-500/30',   match: f => f.toLowerCase().includes('declining') },
  { icon: <Clock className="h-3 w-3" />,        color: 'bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-500/30', match: f => f.toLowerCase().includes('activity') || f.toLowerCase().includes('days') },
  { icon: <Zap className="h-3 w-3" />,          color: 'bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-500/30', match: f => f.toLowerCase().includes('momentum') || f.toLowerCase().includes('streak') },
  { icon: <Stethoscope className="h-3 w-3" />,  color: 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700',    match: f => f.toLowerCase().includes('diagnosed') },
];

function getFlagConfig(flag: string): FlagConfig {
  return FLAG_CONFIGS.find(c => c.match(flag)) ?? FLAG_CONFIGS[FLAG_CONFIGS.length - 1];
}

function FlagChip({ flag }: { flag: string }) {
  const cfg = getFlagConfig(flag);
  return (
    <span className={cn('inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full border', cfg.color)}>
      {cfg.icon}
      {flag}
    </span>
  );
}

// ── Skeletons ─────────────────────────────────────────────────────────────────

function RowSkeleton() {
  return (
    <div className="flex items-start gap-3 px-5 py-4 border-l-4 border-l-slate-200 dark:border-l-slate-700 animate-pulse">
      <div className="h-9 w-9 rounded-full bg-slate-200 dark:bg-slate-700 shrink-0 mt-0.5" />
      <div className="flex-1 space-y-2">
        <div className="flex gap-2">
          <div className="h-3.5 w-24 bg-slate-200 dark:bg-slate-700 rounded" />
          <div className="h-3.5 w-14 bg-slate-100 dark:bg-slate-800 rounded" />
        </div>
        <div className="flex gap-1.5">
          <div className="h-5 w-32 rounded-full bg-slate-100 dark:bg-slate-800" />
          <div className="h-5 w-24 rounded-full bg-slate-100 dark:bg-slate-800" />
        </div>
      </div>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export function AtRiskStudentList({ students, batchId, loading }: AtRiskStudentListProps) {
  const navigate = useNavigate();

  const goToStudent = (studentId: string) => {
    if (!batchId) return;
    navigate(`/instructor/batches/${batchId}/students/${studentId}/progress`);
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden flex flex-col">

      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 dark:border-slate-800 shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="h-8 w-8 rounded-xl bg-rose-100 dark:bg-rose-500/20 flex items-center justify-center shrink-0">
            <AlertTriangle className="h-4 w-4 text-rose-600 dark:text-rose-400" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-800 dark:text-white leading-tight">At-Risk Students</h3>
            <p className="text-[11px] text-slate-400 leading-tight">Flagged from real activity data</p>
          </div>
        </div>
        {!loading && students.length > 0 && (
          <div className="flex items-center gap-1.5 shrink-0">
            <span className="h-2 w-2 rounded-full bg-rose-500 animate-pulse" />
            <span className="text-xs font-bold text-rose-600 dark:text-rose-400">
              {students.length} flagged
            </span>
          </div>
        )}
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto" style={{ maxHeight: 420 }}>
        {loading ? (
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {[1, 2, 3].map(i => <RowSkeleton key={i} />)}
          </div>
        ) : students.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center px-6">
            <div className="h-14 w-14 rounded-full bg-emerald-50 dark:bg-emerald-500/10 flex items-center justify-center mb-3 ring-4 ring-emerald-100/50 dark:ring-emerald-500/10">
              <CheckCircle2 className="h-7 w-7 text-emerald-500" />
            </div>
            <p className="text-sm font-bold text-slate-700 dark:text-slate-200">All students on track</p>
            <p className="text-xs text-slate-400 mt-1 max-w-[200px]">No risk flags detected for this batch.</p>
          </div>
        ) : (
          <ul className="divide-y divide-slate-100 dark:divide-slate-800">
            {students.map(student => {
              const severity = getSeverity(student.flags);
              return (
                <li key={student.student_id}>
                  <button
                    onClick={() => goToStudent(student.student_id)}
                    className={cn(
                      'w-full flex items-start gap-3 px-5 py-4 text-left transition-colors group border-l-4',
                      'hover:bg-slate-50 dark:hover:bg-slate-800/50',
                      SEVERITY_LEFT[severity]
                    )}
                  >
                    {/* Avatar */}
                    <div className={cn(
                      'h-9 w-9 rounded-full shrink-0 flex items-center justify-center text-xs font-black overflow-hidden mt-0.5',
                      student.avatar ? '' : avatarPalette(student.name)
                    )}>
                      {student.avatar
                        ? <img src={student.avatar} alt={student.name} className="h-full w-full object-cover" />
                        : initials(student.name)
                      }
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      {/* Name row */}
                      <div className="flex items-center gap-2 mb-1.5">
                        <span className={cn('h-1.5 w-1.5 rounded-full shrink-0', SEVERITY_DOT[severity])} />
                        <span className="text-sm font-bold text-slate-800 dark:text-white truncate">
                          {student.name}
                        </span>
                        {student.current_band !== null && (
                          <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded shrink-0">
                            Band {student.current_band.toFixed(1)}
                          </span>
                        )}
                      </div>

                      {/* Flags */}
                      <div className="flex flex-wrap gap-1.5">
                        {student.flags.map((flag, i) => (
                          <FlagChip key={i} flag={flag} />
                        ))}
                      </div>

                      {/* Inactive duration (only if notable) */}
                      {student.days_inactive > 2 && student.days_inactive !== -1 && (
                        <p className="text-[11px] text-slate-400 mt-1.5 flex items-center gap-1">
                          <Clock className="h-3 w-3 shrink-0" />
                          Last active {student.days_inactive} day{student.days_inactive !== 1 ? 's' : ''} ago
                        </p>
                      )}
                      {student.days_inactive === -1 && (
                        <p className="text-[11px] text-slate-400 mt-1.5 flex items-center gap-1">
                          <Clock className="h-3 w-3 shrink-0" />
                          Never drilled
                        </p>
                      )}
                    </div>

                    {/* Arrow */}
                    <ChevronRight className="h-4 w-4 text-slate-300 dark:text-slate-600 group-hover:text-indigo-500 transition-colors shrink-0 mt-2.5" />
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
