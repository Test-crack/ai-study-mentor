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
  // Per-card neon theme tokens
  theme: {
    // Light
    cardBg:      string;
    cardBorder:  string;
    iconBg:      string;
    iconColor:   string;
    valuColor:   string;
    // Dark
    darkCardBg:  string;
    darkBorder:  string;
    darkIconBg:  string;
    darkIconColor: string;
    darkGlow:    string;
    darkValueColor: string;
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
      darkCardBg:    'dark:bg-brand-teal-950/40',
      darkBorder:    'dark:border-brand-teal-500/20',
      darkIconBg:    'dark:bg-brand-teal-500/15',
      darkIconColor: 'dark:text-brand-teal-400',
      darkGlow:      'dark:shadow-[0_0_28px_rgba(99,102,241,0.18)]',
      darkValueColor:'dark:text-brand-teal-300',
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
      darkCardBg:    'dark:bg-amber-950/40',
      darkBorder:    'dark:border-amber-500/20',
      darkIconBg:    'dark:bg-amber-500/15',
      darkIconColor: 'dark:text-amber-400',
      darkGlow:      'dark:shadow-[0_0_28px_rgba(245,158,11,0.15)]',
      darkValueColor:'dark:text-amber-300',
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
      darkCardBg:    'dark:bg-rose-950/40',
      darkBorder:    'dark:border-rose-500/20',
      darkIconBg:    'dark:bg-rose-500/15',
      darkIconColor: 'dark:text-rose-400',
      darkGlow:      'dark:shadow-[0_0_28px_rgba(244,63,94,0.15)]',
      darkValueColor:'dark:text-rose-300',
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
      darkCardBg:    'dark:bg-emerald-950/40',
      darkBorder:    'dark:border-emerald-500/20',
      darkIconBg:    'dark:bg-emerald-500/15',
      darkIconColor: 'dark:text-emerald-400',
      darkGlow:      'dark:shadow-[0_0_28px_rgba(16,185,129,0.15)]',
      darkValueColor:'dark:text-emerald-300',
    },
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
    <div className="rounded-2xl border border-slate-200 dark:border-white/[0.06] bg-white dark:bg-[#11111A] p-4 sm:p-5 animate-pulse">
      <div className="flex items-center justify-between mb-4">
        <div className="h-10 w-10 rounded-xl bg-slate-100 dark:bg-white/5" />
        <div className="h-4 w-10 rounded-full bg-slate-100 dark:bg-white/5" />
      </div>
      <div className="h-8 w-14 rounded-lg bg-slate-100 dark:bg-white/5 mb-2" />
      <div className="h-3 w-20 rounded bg-slate-100 dark:bg-white/5" />
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
              // Light: soft tinted surface
              theme.cardBg, theme.cardBorder,
              'shadow-[0_2px_8px_-2px_rgba(15,23,42,0.06)]',
              'hover:shadow-[0_6px_20px_-4px_rgba(15,23,42,0.10)]',
              // Dark: deep tinted glass + neon glow
              theme.darkCardBg, theme.darkBorder,
              theme.darkGlow,
              'dark:backdrop-blur-sm',
            )}
          >
            {/* Dark mode: subtle top highlight */}
            <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent hidden dark:block" />

            <div className="flex items-center justify-between mb-3 sm:mb-4">
              <div className={cn(
                'h-9 w-9 sm:h-10 sm:w-10 rounded-xl flex items-center justify-center shrink-0',
                theme.iconBg, theme.iconColor,
                theme.darkIconBg, theme.darkIconColor,
              )}>
                {cfg.icon}
              </div>
              {trend !== null && <TrendBadge delta={trend} />}
            </div>

            {/* Value */}
            <p className={cn(
              'text-2xl sm:text-3xl font-black tracking-tight leading-none mb-1',
              theme.valuColor, theme.darkValueColor,
            )}>
              {value}
            </p>

            {/* Label */}
            <p className="text-[10px] sm:text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              {cfg.label}
            </p>

            {/* Subtitle */}
            {subtitle && (
              <p className="text-[10px] sm:text-xs text-slate-400 dark:text-slate-500 mt-0.5 leading-snug">
                {subtitle}
              </p>
            )}
          </div>
        );
      })}
    </div>
  );
}