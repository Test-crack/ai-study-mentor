import { cn } from '@/shared/utils';
import type { RuleGroup } from './types';

export function RuleGroupCard({ group }: { group: RuleGroup }) {
  return (
    <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden">
      <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-slate-400 dark:text-slate-500 px-4 pt-3.5 pb-2">
        {group.label ?? 'The rules'}
      </p>
      <div>
        {group.rows.map((row, i) => (
          <div
            key={i}
            className={cn(
              'flex items-start justify-between gap-3 px-4 py-3 text-[13px]',
              i < group.rows.length - 1 && 'border-t border-slate-100 dark:border-slate-800',
              i % 2 === 1 && 'bg-slate-50/60 dark:bg-slate-800/30'
            )}
          >
            <span className="text-slate-500 dark:text-slate-400 leading-snug flex-1 min-w-0 pr-2">
              {row.label}
            </span>
            <div className="text-right shrink-0">
              <span className="font-semibold text-slate-800 dark:text-white">{row.value}</span>
              {row.sub && (
                <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5 leading-tight">
                  {row.sub}
                </p>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
