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
      'bg-white rounded-2xl border shadow-sm p-5 flex flex-col gap-1',
      accent
    )}>
      <p className="text-[10px] font-bold text-brand-text-mute uppercase tracking-widest font-jetbrains">{label}</p>
      <p className={cn('text-3xl font-black leading-tight', valueClass ?? 'text-brand-text')}>
        {value}
      </p>
      {sub && <p className="text-[11px] text-brand-text-mute mt-0.5">{sub}</p>}
    </div>
  );
}

export function AssessmentSummaryCards({ iaSummary, mockSummary, totalStudents }: Props) {
  const cards: CardProps[] = [
    {
      label:      'Total Students',
      value:      totalStudents,
      sub:        'in this batch',
      accent:     'border-brand-line',
    },
    {
      label:      'IA Completion Rate',
      value:      `${iaSummary.completion_rate}%`,
      sub:        'students with at least 1 IA done',
      valueClass: iaSummary.completion_rate >= 70
        ? 'text-emerald-600'
        : iaSummary.completion_rate >= 40
        ? 'text-amber-600'
        : 'text-rose-600',
      accent:     'border-brand-line',
    },
    {
      label:      'Batch Avg IA Band',
      value:      iaSummary.avg_band > 0 ? iaSummary.avg_band.toFixed(1) : '—',
      sub:        'across all completed IAs',
      valueClass: iaSummary.avg_band >= 7.0
        ? 'text-emerald-600'
        : iaSummary.avg_band >= 5.5
        ? 'text-amber-600'
        : iaSummary.avg_band > 0
        ? 'text-rose-600'
        : 'text-brand-text-mute',
      accent:     'border-brand-line',
    },
    {
      label:      'High Miss Count',
      value:      iaSummary.high_miss_count,
      sub:        'students missed 2+ IAs',
      valueClass: iaSummary.high_miss_count === 0
        ? 'text-emerald-600'
        : iaSummary.high_miss_count <= 3
        ? 'text-amber-600'
        : 'text-rose-600',
      accent:     'border-brand-line',
    },
    {
      label:      'Batch Avg Mock Band',
      value:      mockSummary.avg_real_band > 0 ? mockSummary.avg_real_band.toFixed(1) : '—',
      sub:        'latest real band per student',
      valueClass: mockSummary.avg_real_band >= 7.0
        ? 'text-emerald-600'
        : mockSummary.avg_real_band >= 5.5
        ? 'text-amber-600'
        : mockSummary.avg_real_band > 0
        ? 'text-rose-600'
        : 'text-brand-text-mute',
      accent:     'border-brand-line',
    },
    {
      label:      'At / Above Target',
      value:      mockSummary.at_or_above_target,
      sub:        `${mockSummary.no_mock_yet} students haven't done a mock yet`,
      valueClass: 'text-brand-teal-600',
      accent:     'border-brand-line',
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3">
      {cards.map(c => <StatCard key={c.label} {...c} />)}
    </div>
  );
}
