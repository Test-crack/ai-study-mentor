import { Users, Zap, Flame, Unlock, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { cn } from '@/shared/utils';
import type { EngagementToday } from './types';

interface EngagementPulseCardsProps {
  data:          EngagementToday | null;
  loading:       boolean;
  totalStudents: number;
}

interface CardConfig {
  label:    string;
  icon:     React.ReactNode;
  iconBg:   string;
  iconColor: string;
  getValue: (d: EngagementToday) => string;
  getSubtitle: (d: EngagementToday) => string;
  getTrend: (d: EngagementToday) => number | null;   // positive = up, negative = down, 0 = flat
  unit:     string;
}

const CARDS: CardConfig[] = [
  {
    label:    'Active Today',
    icon:     <Users className="h-4 w-4 sm:h-5 sm:w-5" />,
    iconBg:   'bg-indigo-100 dark:bg-indigo-500/20',
    iconColor: 'text-indigo-600 dark:text-indigo-400',
    getValue:    d => String(d.active_students),
    getSubtitle: _d => '',   // overridden at render — needs totalStudents
    getTrend:    d => d.active_yesterday > 0 ? d.active_students - d.active_yesterday : null,
    unit: 'students',
  },
  {
    label:    'Avg DCS Today',
    icon:     <Zap className="h-4 w-4 sm:h-5 sm:w-5" />,
    iconBg:   'bg-amber-100 dark:bg-amber-500/20',
    iconColor: 'text-amber-600 dark:text-amber-400',
    getValue:    d => `${d.avg_dcs}%`,
    getSubtitle: d => `Yesterday: ${d.avg_dcs_yesterday}%`,
    getTrend:    d => d.avg_dcs_yesterday > 0 ? d.avg_dcs - d.avg_dcs_yesterday : null,
    unit: 'accuracy',
  },
  {
    label:    'Streaks Alive',
    icon:     <Flame className="h-4 w-4 sm:h-5 sm:w-5" />,
    iconBg:   'bg-rose-100 dark:bg-rose-500/20',
    iconColor: 'text-rose-600 dark:text-rose-400',
    getValue:    d => String(d.streaks_alive),
    getSubtitle: _d => 'students on a daily streak',
    getTrend:    _d => null,
    unit: 'students',
  },
  {
    label:    'Platform Unlocked',
    icon:     <Unlock className="h-4 w-4 sm:h-5 sm:w-5" />,
    iconBg:   'bg-emerald-100 dark:bg-emerald-500/20',
    iconColor: 'text-emerald-600 dark:text-emerald-400',
    getValue:    d => String(d.platform_unlocked),
    getSubtitle: _d => 'completed ≥2 drills today',
    getTrend:    _d => null,
    unit: 'students',
  },
];

function TrendBadge({ delta }: { delta: number }) {
  if (delta > 0) return (
    <span className="flex items-center gap-0.5 text-xs font-bold text-emerald-600 dark:text-emerald-400">
      <TrendingUp className="h-3 w-3 sm:h-3.5 sm:w-3.5" />+{delta}
    </span>
  );
  if (delta < 0) return (
    <span className="flex items-center gap-0.5 text-xs font-bold text-rose-500 dark:text-rose-400">
      <TrendingDown className="h-3 w-3 sm:h-3.5 sm:w-3.5" />{delta}
    </span>
  );
  return (
    <span className="flex items-center gap-0.5 text-xs font-bold text-slate-400">
      <Minus className="h-3 w-3 sm:h-3.5 sm:w-3.5" />0
    </span>
  );
}

function CardSkeleton() {
  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 sm:p-5 animate-pulse">
      <div className="flex items-center justify-between mb-3 sm:mb-4">
        <div className="h-9 w-9 sm:h-10 sm:w-10 rounded-xl bg-slate-200 dark:bg-slate-700" />
        <div className="h-5 w-10 sm:w-12 rounded-full bg-slate-200 dark:bg-slate-700" />
      </div>
      <div className="h-7 sm:h-8 w-14 sm:w-16 rounded-lg bg-slate-200 dark:bg-slate-700 mb-2" />
      <div className="h-3.5 w-20 sm:w-28 rounded bg-slate-100 dark:bg-slate-800" />
    </div>
  );
}

export function EngagementPulseCards({ data, loading, totalStudents }: EngagementPulseCardsProps) {
  if (loading || !data) {
    return (
      // 2 cols on mobile, 4 on md+ (sidebar only kicks in at lg so md has full width)
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
        {CARDS.map((_, i) => <CardSkeleton key={i} />)}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
      {CARDS.map((cfg, idx) => {
        const value = cfg.getValue(data);
        const trend = cfg.getTrend(data);
        const subtitle = idx === 0
          ? `of ${totalStudents} student${totalStudents !== 1 ? 's' : ''} in batch`
          : cfg.getSubtitle(data);

        return (
          <div
            key={cfg.label}
            className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 sm:p-5 shadow-sm hover:shadow-md transition-shadow"
          >
            <div className="flex items-center justify-between mb-3 sm:mb-4">
              <div className={cn('h-9 w-9 sm:h-10 sm:w-10 rounded-xl flex items-center justify-center shrink-0', cfg.iconBg, cfg.iconColor)}>
                {cfg.icon}
              </div>
              {trend !== null && <TrendBadge delta={trend} />}
            </div>

            <p className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight leading-none mb-1 sm:mb-1.5">
              {value}
            </p>
            <p className="text-[10px] sm:text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              {cfg.label}
            </p>
            <p className="text-[10px] sm:text-xs text-slate-400 dark:text-slate-500 mt-0.5 sm:mt-1 leading-snug">
              {subtitle}
            </p>
          </div>
        );
      })}
    </div>
  );
}