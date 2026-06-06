import { cn } from '@/shared/utils';
import type { MockSession } from './types';

interface Props { sessions: MockSession[]; }

const STATUS_CONFIG = {
  COMPLETED:   { label: 'Completed',   cls: 'bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400' },
  IN_PROGRESS: { label: 'In Progress', cls: 'bg-amber-100 dark:bg-amber-500/20 text-amber-700 dark:text-amber-400' },
  PENDING:     { label: 'Pending',     cls: 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-400' },
} as const;

function bandColorText(b: number | null): string {
  if (b === null) return 'text-slate-400';
  if (b >= 7.5) return 'text-emerald-600 dark:text-emerald-400';
  if (b >= 6.0) return 'text-amber-600 dark:text-amber-400';
  return 'text-rose-600 dark:text-rose-400';
}

function formatMonthYear(my: string): string {
  const [y, m] = my.split('-');
  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  return `${months[parseInt(m, 10) - 1] ?? m} ${y}`;
}

export function MockSessionsTab({ sessions }: Props) {
  const completed  = sessions.filter(s => s.status === 'COMPLETED');
  const avgBand    = completed.length > 0
    ? (completed.reduce((sum, s) => sum + (s.real_band_score ?? 0), 0) / completed.length).toFixed(1)
    : null;

  if (sessions.length === 0) {
    return (
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-12 text-center">
        <p className="text-slate-400 text-sm">No mock test sessions yet.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Summary */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {[
          { label: 'Total Mocks',  value: sessions.length,       cls: 'text-slate-800 dark:text-white'                },
          { label: 'Completed',    value: completed.length,       cls: 'text-emerald-600 dark:text-emerald-400'        },
          { label: 'Avg Real Band',value: avgBand ?? '—',         cls: 'text-indigo-600 dark:text-indigo-400'          },
        ].map(c => (
          <div key={c.label} className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-3 text-center">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{c.label}</p>
            <p className={cn('text-2xl font-black mt-1', c.cls)}>{c.value}</p>
          </div>
        ))}
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-slate-100 dark:border-slate-800 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                <th className="py-3 pl-5">Month</th>
                <th className="py-3">Type</th>
                <th className="py-3">Status</th>
                <th className="py-3">Real Band</th>
                <th className="py-3 pr-5">Momentum</th>
              </tr>
            </thead>
            <tbody>
              {sessions.map(s => {
                const cfg = STATUS_CONFIG[s.status] ?? STATUS_CONFIG.PENDING;
                return (
                  <tr key={s.id} className="border-b border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                    <td className="py-3 pl-5 text-sm font-semibold text-slate-700 dark:text-slate-300 whitespace-nowrap">
                      {formatMonthYear(s.month_year)}
                    </td>
                    <td className="py-3 text-xs text-slate-500 dark:text-slate-400 capitalize">
                      {s.attempt_type.toLowerCase().replace('_', ' ')}
                    </td>
                    <td className="py-3">
                      <span className={cn('px-2 py-0.5 rounded-full text-[11px] font-bold', cfg.cls)}>{cfg.label}</span>
                    </td>
                    <td className="py-3">
                      {s.real_band_score !== null
                        ? <span className={cn('text-sm font-black', bandColorText(s.real_band_score))}>{s.real_band_score.toFixed(1)}</span>
                        : <span className="text-xs text-slate-300 dark:text-slate-600">—</span>}
                    </td>
                    <td className="py-3 pr-5">
                      <span className={cn(
                        'text-sm font-bold',
                        (s.momentum_awarded ?? 0) > 0
                          ? 'text-emerald-600 dark:text-emerald-400'
                          : (s.momentum_awarded ?? 0) < 0
                          ? 'text-rose-600 dark:text-rose-400'
                          : 'text-slate-400'
                      )}>
                        {s.momentum_awarded != null
                          ? (s.momentum_awarded > 0 ? '+' : '') + s.momentum_awarded
                          : '—'}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
