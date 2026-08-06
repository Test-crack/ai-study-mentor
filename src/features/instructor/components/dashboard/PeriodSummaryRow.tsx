import { ClipboardCheck, BarChart2, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/shared/utils';
import type { PeriodSummary } from './types';

interface PeriodSummaryRowProps {
  data:    PeriodSummary | null;
  loading: boolean;
}

function ProgressBar({ value, total }: { value: number; total: number }) {
  const pct = total > 0 ? Math.min(100, Math.round((value / total) * 100)) : 0;
  const color =
    pct >= 75 ? 'bg-emerald-500' :
    pct >= 40 ? 'bg-amber-500' :
                'bg-rose-500';

  return (
    <div className="flex items-center gap-2 mt-2">
      <div className="flex-1 h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
        <div
          className={cn('h-full rounded-full transition-all duration-700', color)}
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="text-xs font-bold text-slate-500 dark:text-slate-400 tabular-nums w-8 text-right">
        {pct}%
      </span>
    </div>
  );
}

function StatCard({
  icon, iconBg, iconColor, title, value, total, label, ctaLabel, onCta, loading
}: {
  icon: React.ReactNode;
  iconBg: string;
  iconColor: string;
  title: string;
  value: number;
  total: number;
  label: string;
  ctaLabel: string;
  onCta: () => void;
  loading: boolean;
}) {
  if (loading) {
    return (
      <div className="flex-1 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 sm:p-5 animate-pulse">
        <div className="flex items-center gap-2 mb-3">
          <div className="h-8 w-8 rounded-xl bg-slate-200 dark:bg-slate-700 shrink-0" />
          <div className="h-3.5 w-full max-w-[180px] bg-slate-200 dark:bg-slate-700 rounded" />
        </div>
        <div className="h-7 w-20 bg-slate-200 dark:bg-slate-700 rounded mb-2" />
        <div className="h-1.5 w-full bg-slate-100 dark:bg-slate-800 rounded-full" />
      </div>
    );
  }

  return (
    <div className="flex-1 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 sm:p-5 shadow-sm">
      <div className="flex items-start sm:items-center justify-between mb-3 gap-2">
        <div className="flex items-center gap-2 sm:gap-2.5 min-w-0">
          <div className={cn('h-8 w-8 rounded-xl flex items-center justify-center shrink-0', iconBg, iconColor)}>
            {icon}
          </div>
          <span className="text-xs sm:text-sm font-bold text-slate-700 dark:text-slate-300 leading-snug">{title}</span>
        </div>
        <button
          onClick={onCta}
          className="flex items-center gap-1 text-xs font-semibold text-brand-teal-500 hover:text-brand-teal-600 dark:text-brand-teal-400 transition-colors shrink-0 whitespace-nowrap"
        >
          {ctaLabel} <ArrowRight className="h-3 w-3" />
        </button>
      </div>

      <div className="flex items-baseline gap-1.5">
        <span className="text-2xl font-black text-slate-900 dark:text-white tabular-nums">{value}</span>
        <span className="text-sm text-slate-400 font-medium">/ {total}</span>
        <span className="text-xs text-slate-400 ml-1">{label}</span>
      </div>

      <ProgressBar value={value} total={total} />
    </div>
  );
}

export function PeriodSummaryRow({ data, loading }: PeriodSummaryRowProps) {
  const navigate = useNavigate();

  return (
    <div className="flex gap-3 sm:gap-4 flex-col sm:flex-row">
      <StatCard
        icon={<ClipboardCheck className="h-4 w-4" />}
        iconBg="bg-brand-teal-100 dark:bg-brand-teal-500/20"
        iconColor="text-brand-teal-600 dark:text-brand-teal-400"
        title="Internal Assessments — Last 7 Days"
        value={data?.ia_completed_last_7_days ?? 0}
        total={data?.ia_total_students ?? 0}
        label="students completed"
        ctaLabel="View breakdown"
        onCta={() => navigate('/instructor/assessments')}
        loading={loading}
      />
      <StatCard
        icon={<BarChart2 className="h-4 w-4" />}
        iconBg="bg-brand-blue-100 dark:bg-brand-blue-500/20"
        iconColor="text-brand-blue-600 dark:text-brand-blue-400"
        title="Mock Tests — This Month"
        value={data?.mock_completed_this_month ?? 0}
        total={data?.mock_total_students ?? 0}
        label="students completed"
        ctaLabel="View breakdown"
        onCta={() => navigate('/instructor/assessments')}
        loading={loading}
      />
    </div>
  );
}