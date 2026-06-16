import { cn } from '@/shared/utils';
import type { BatchIASummary, BatchMockSummary } from './types';

interface Props {
  iaSummary:   BatchIASummary;
  mockSummary: BatchMockSummary;
  totalStudents: number;
}

interface CardProps {
  label:      string;
  value:      string | number;
  sub?:       string;
  valueClass?: string;
  accent:     string;
}

function StatCard({ label, value, sub, valueClass, accent }: CardProps) {
  return (
    <div className={cn(
      'bg-white dark:bg-slate-900 rounded-2xl border shadow-sm p-5 flex flex-col gap-1',
      accent
    )}>
      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{label}</p>
      <p className={cn('text-3xl font-black leading-tight', valueClass ?? 'text-slate-900 dark:text-white')}>
        {value}
      </p>
      {sub && <p className="text-[11px] text-slate-400 mt-0.5">{sub}</p>}
    </div>
  );
}

export function AssessmentSummaryCards({ iaSummary, mockSummary, totalStudents }: Props) {
  const cards: CardProps[] = [
    {
      label:      'Total Students',
      value:      totalStudents,
      sub:        'in this batch',
      accent:     'border-slate-200 dark:border-slate-800',
    },
    {
      label:      'IA Completion Rate',
      value:      `${iaSummary.completion_rate}%`,
      sub:        'students with at least 1 IA done',
      valueClass: iaSummary.completion_rate >= 70
        ? 'text-emerald-600 dark:text-emerald-400'
        : iaSummary.completion_rate >= 40
        ? 'text-amber-600 dark:text-amber-400'
        : 'text-rose-600 dark:text-rose-400',
      accent:     'border-slate-200 dark:border-slate-800',
    },
    {
      label:      'Batch Avg IA Band',
      value:      iaSummary.avg_band > 0 ? iaSummary.avg_band.toFixed(1) : '—',
      sub:        'across all completed IAs',
      valueClass: iaSummary.avg_band >= 7.0
        ? 'text-emerald-600 dark:text-emerald-400'
        : iaSummary.avg_band >= 5.5
        ? 'text-amber-600 dark:text-amber-400'
        : iaSummary.avg_band > 0
        ? 'text-rose-600 dark:text-rose-400'
        : 'text-slate-400',
      accent:     'border-slate-200 dark:border-slate-800',
    },
    {
      label:      'High Miss Count',
      value:      iaSummary.high_miss_count,
      sub:        'students missed 2+ IAs',
      valueClass: iaSummary.high_miss_count === 0
        ? 'text-emerald-600 dark:text-emerald-400'
        : iaSummary.high_miss_count <= 3
        ? 'text-amber-600 dark:text-amber-400'
        : 'text-rose-600 dark:text-rose-400',
      accent:     'border-slate-200 dark:border-slate-800',
    },
    {
      label:      'Batch Avg Mock Band',
      value:      mockSummary.avg_real_band > 0 ? mockSummary.avg_real_band.toFixed(1) : '—',
      sub:        'latest real band per student',
      valueClass: mockSummary.avg_real_band >= 7.0
        ? 'text-emerald-600 dark:text-emerald-400'
        : mockSummary.avg_real_band >= 5.5
        ? 'text-amber-600 dark:text-amber-400'
        : mockSummary.avg_real_band > 0
        ? 'text-rose-600 dark:text-rose-400'
        : 'text-slate-400',
      accent:     'border-slate-200 dark:border-slate-800',
    },
    {
      label:      'At / Above Target',
      value:      mockSummary.at_or_above_target,
      sub:        `${mockSummary.no_mock_yet} students haven't done a mock yet`,
      valueClass: 'text-indigo-600 dark:text-indigo-400',
      accent:     'border-slate-200 dark:border-slate-800',
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3">
      {cards.map(c => <StatCard key={c.label} {...c} />)}
    </div>
  );
}
