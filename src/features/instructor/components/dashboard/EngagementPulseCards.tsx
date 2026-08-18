// src/features/Instructor/dashboard/EngagementPulseCards.tsx
import { Users, Zap, Flame, Unlock, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { cn } from '@/shared/utils';
import type { EngagementToday } from './types';

interface EngagementPulseCardsProps {
  data:          EngagementToday | null;
  loading:       boolean;
  totalStudents: number;
}

interface CardConfig {
  label:       string;
  icon:        React.ReactNode;
  getValue:    (d: EngagementToday) => string;
  getSubtitle: (d: EngagementToday) => string;
  getTrend:    (d: EngagementToday) => number | null;
  unit:        string;
  // Per-card theme tokens
  theme: {
    cardBg:      string;
    cardBorder:  string;
    iconBg:      string;
    iconColor:   string;
    valuColor:   string;
  };
}

const CARDS: CardConfig[] = [
  {
    label:       'Active Today',
    icon:        <Users className="h-4 w-4 sm:h-5 sm:w-5" />,
    getValue:    d => String(d.active_students),
    getSubtitle: _d => '',
    getTrend:    d => d.active_yesterday > 0 ? d.active_students - d.active_yesterday : null,
    unit:        'students',
    theme: {
      cardBg:        'bg-brand-teal-50/80',
      cardBorder:    'border-brand-teal-100',
      iconBg:        'bg-brand-teal-100',
      iconColor:     'text-brand-teal-600',
      valuColor:     'text-brand-teal-700',
    },
  },
  {
    label:       'Avg DCS Today',
    icon:        <Zap className="h-4 w-4 sm:h-5 sm:w-5" />,
    getValue:    d => `${d.avg_dcs}%`,
    getSubtitle: d => `Yesterday: ${d.avg_dcs_yesterday}%`,
    getTrend:    d => d.avg_dcs_yesterday > 0 ? d.avg_dcs - d.avg_dcs_yesterday : null,
    unit:        'accuracy',
    theme: {
      cardBg:        'bg-amber-50/80',
      cardBorder:    'border-amber-100',
      iconBg:        'bg-amber-100',
      iconColor:     'text-amber-600',
      valuColor:     'text-amber-700',
    },
  },
  {
    label:       'Streaks Alive',
    icon:        <Flame className="h-4 w-4 sm:h-5 sm:w-5" />,
    getValue:    d => String(d.streaks_alive),
    getSubtitle: _d => 'students on a daily streak',
    getTrend:    _d => null,
    unit:        'students',
    theme: {
      cardBg:        'bg-rose-50/80',
      cardBorder:    'border-rose-100',
      iconBg:        'bg-rose-100',
      iconColor:     'text-rose-600',
      valuColor:     'text-rose-700',
    },
  },
  {
    label:       'Platform Unlocked',
    icon:        <Unlock className="h-4 w-4 sm:h-5 sm:w-5" />,
    getValue:    d => String(d.platform_unlocked),
    getSubtitle: _d => 'completed ≥2 drills today',
    getTrend:    _d => null,
    unit:        'students',
    theme: {
      cardBg:        'bg-emerald-50/80',
      cardBorder:    'border-emerald-100',
      iconBg:        'bg-emerald-100',
      iconColor:     'text-emerald-600',
      valuColor:     'text-emerald-700',
    },
  },
];

function TrendBadge({ delta }: { delta: number }) {
  if (delta > 0) return (
    <span className="flex items-center gap-0.5 text-xs font-bold text-emerald-600">
      <TrendingUp className="h-3 w-3 sm:h-3.5 sm:w-3.5" />+{delta}
    </span>
  );
  if (delta < 0) return (
    <span className="flex items-center gap-0.5 text-xs font-bold text-rose-500">
      <TrendingDown className="h-3 w-3 sm:h-3.5 sm:w-3.5" />{delta}
    </span>
  );
  return (
    <span className="flex items-center gap-0.5 text-xs font-bold text-brand-text-mute">
      <Minus className="h-3 w-3 sm:h-3.5 sm:w-3.5" />0
    </span>
  );
}

function CardSkeleton() {
  return (
    <div className="rounded-2xl border border-brand-line bg-white p-4 sm:p-5 animate-pulse">
      <div className="flex items-center justify-between mb-4">
        <div className="h-10 w-10 rounded-xl bg-brand-bg-alt" />
        <div className="h-4 w-10 rounded-full bg-brand-bg-alt" />
      </div>
      <div className="h-8 w-14 rounded-lg bg-brand-bg-alt mb-2" />
      <div className="h-3 w-20 rounded bg-brand-bg-alt" />
    </div>
  );
}

export function EngagementPulseCards({ data, loading, totalStudents }: EngagementPulseCardsProps) {
  if (loading || !data) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
        {CARDS.map((_, i) => <CardSkeleton key={i} />)}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
      {CARDS.map((cfg, idx) => {
        const { theme } = cfg;
        const value    = cfg.getValue(data);
        const trend    = cfg.getTrend(data);
        const subtitle = idx === 0
          ? `of ${totalStudents} student${totalStudents !== 1 ? 's' : ''} in batch`
          : cfg.getSubtitle(data);

        return (
          <div
            key={cfg.label}
            className={cn(
              'relative rounded-2xl border p-4 sm:p-5 overflow-hidden',
              'transition-all duration-200 hover:-translate-y-0.5',
              // Soft tinted surface
              theme.cardBg, theme.cardBorder,
              'shadow-sm',
              'hover:shadow-md',
            )}
          >
            <div className="flex items-center justify-between mb-3 sm:mb-4">
              <div className={cn(
                'h-9 w-9 sm:h-10 sm:w-10 rounded-xl flex items-center justify-center shrink-0',
                theme.iconBg, theme.iconColor,
              )}>
                {cfg.icon}
              </div>
              {trend !== null && <TrendBadge delta={trend} />}
            </div>

            {/* Value */}
            <p className={cn(
              'text-2xl sm:text-3xl font-black tracking-tight leading-none mb-1',
              theme.valuColor,
            )}>
              {value}
            </p>

            {/* Label */}
            <p className="font-jetbrains text-[10px] sm:text-xs font-semibold text-brand-text-mute uppercase tracking-wider">
              {cfg.label}
            </p>

            {/* Subtitle */}
            {subtitle && (
              <p className="text-[10px] sm:text-xs text-brand-text-mute mt-0.5 leading-snug">
                {subtitle}
              </p>
            )}
          </div>
        );
      })}
    </div>
  );
}