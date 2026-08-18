import { Flame, Target, Zap } from 'lucide-react';
import { cn } from '@/shared/utils';
import type { StudentFullProgress, CompetencyRow } from './types';

interface Props {
  data: StudentFullProgress;
}

// ── helpers ───────────────────────────────────────────────────────────────────

function getInitials(name: string): string {
  return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || '?';
}

function bandTextColor(b: number): string {
  if (b >= 7.5) return 'text-emerald-600';
  if (b >= 6.0) return 'text-amber-600';
  return 'text-rose-600';
}

function bandPillClass(b: number): string {
  if (b >= 7.5) return 'bg-emerald-50 border-emerald-200 text-emerald-700';
  if (b >= 6.0) return 'bg-amber-50 border-amber-200 text-amber-700';
  return 'bg-rose-50 border-rose-200 text-rose-700';
}

const SKILL_ABBR: Record<string, string> = {
  listening: 'L', reading: 'R', speaking: 'S', writing: 'W',
};
const SKILL_LABEL: Record<string, string> = {
  L: 'Listening', R: 'Reading', S: 'Speaking', W: 'Writing',
};

function lrswFromCompetency(rows: CompetencyRow[]): Array<{ abbr: string; label: string; band: number }> {
  const order = ['L', 'R', 'S', 'W'];
  const found = new Map<string, number>();
  for (const r of rows) {
    const abbr = SKILL_ABBR[r.skill.toLowerCase()];
    if (abbr && r.band_score > 0) found.set(abbr, r.band_score);
  }
  return order.filter(a => found.has(a)).map(a => ({ abbr: a, label: SKILL_LABEL[a], band: found.get(a)! }));
}

// ── component ─────────────────────────────────────────────────────────────────

export function StudentProfileHeader({ data }: Props) {
  const { student, target_band, momentum_score, daily_streak, competency, current_band } = data;

  const gap = current_band !== null && target_band !== null
    ? Math.round((target_band - current_band) * 10) / 10
    : null;

  const lrsw = lrswFromCompetency(competency);

  const stats = [
    {
      icon: <Target className="h-4 w-4" />,
      label: 'Target Band',
      value: target_band !== null ? target_band.toFixed(1) : '—',
      valueClass: 'text-brand-teal-600',
    },
    {
      icon: <Zap className="h-4 w-4" />,
      label: 'Momentum',
      value: momentum_score.toLocaleString(),
      valueClass: momentum_score >= 200
        ? 'text-emerald-600'
        : momentum_score >= 100
        ? 'text-amber-600'
        : 'text-rose-600',
    },
    {
      icon: <Flame className="h-4 w-4" />,
      label: 'Day Streak',
      value: `${daily_streak}d`,
      valueClass: daily_streak >= 7
        ? 'text-orange-500'
        : daily_streak >= 3
        ? 'text-amber-600'
        : 'text-brand-text-mute',
    },
  ];

  return (
    <div className="rounded-2xl overflow-hidden bg-white border border-brand-line shadow-sm mb-6">

      {/* ── Gradient banner ────────────────────────────────────────────── */}
      {/* No overflow-hidden here — outer card clips the rounded corners.
          Keeping this open lets the avatar z-index stack above it correctly. */}
      {/* h-40 gives room; name is offset right by ml-[100px] to sit beside the avatar's footprint */}
      <div className="relative h-40 bg-gradient-to-br from-brand-teal-700 via-brand-teal-600 to-brand-blue-700 flex flex-col justify-end px-6 pb-6">
        {/* Decorative blobs */}
        <div className="absolute -top-10 -right-10 w-52 h-52 rounded-full bg-white/5 pointer-events-none" />
        <div className="absolute top-6 right-24 w-24 h-24 rounded-full bg-white/5 pointer-events-none" />
        <div className="absolute -bottom-6 right-8 w-36 h-36 rounded-full bg-brand-blue-600/30 pointer-events-none" />

        {/* Name — ml-[100px] clears the avatar (w-20=80px + 20px gap) */}
        <h2 className="relative z-10 text-2xl font-black text-white leading-tight tracking-tight ml-[100px]">
          {student.name}
        </h2>
      </div>

      {/* ── White body ─────────────────────────────────────────────────── */}
      <div className="px-6 pb-5">

        {/* Avatar + gap badge row — avatar pulled up -mt-14 so it sits half in gradient */}
        <div className="flex items-end justify-between -mt-14 mb-5">
          {/* Avatar — z-10 paints above gradient div; larger at h-20 w-20 */}
          <div className={cn(
            'relative z-10 h-20 w-20 rounded-full ring-[3px] ring-white shadow-2xl overflow-hidden bg-brand-teal-600 shrink-0',
            'flex items-center justify-center'
          )}>
            {student.avatar ? (
              <img src={student.avatar} alt={student.name} className="h-full w-full object-cover" />
            ) : (
              <span className="text-2xl font-black text-white select-none">{getInitials(student.name)}</span>
            )}
          </div>

          {/* Gap badge */}
          {gap !== null && (
            <span className={cn(
              'text-xs font-bold px-3 py-1.5 rounded-xl border',
              gap <= 0
                ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
                : gap <= 1
                ? 'bg-amber-50 border-amber-200 text-amber-700'
                : 'bg-rose-50 border-rose-200 text-rose-700'
            )}>
              {gap <= 0 ? '✓ Target met' : `${gap.toFixed(1)} band gap`}
            </span>
          )}
        </div>

        {/* ── Stats row ───────────────────────────────────────────────── */}
        <div className="flex items-center gap-0 divide-x divide-brand-line border border-brand-line rounded-xl overflow-hidden mb-4">
          {stats.map((s) => (
            <div key={s.label} className="flex-1 flex items-center gap-2.5 px-4 py-3">
              <span className="text-brand-text-mute shrink-0">{s.icon}</span>
              <div className="min-w-0">
                <p className="text-[10px] font-bold text-brand-text-mute font-jetbrains uppercase tracking-wider leading-tight">
                  {s.label}
                </p>
                <p className={cn('text-lg font-black leading-tight', s.valueClass)}>
                  {s.value}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* ── LRSW skill band strip ────────────────────────────────────── */}
        {lrsw.length > 0 ? (
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[10px] font-bold text-brand-text-mute font-jetbrains uppercase tracking-widest mr-0.5">
              Skill Bands
            </span>
            {lrsw.map(({ abbr, label, band }) => (
              <div
                key={abbr}
                title={label}
                className={cn(
                  'flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-bold',
                  bandPillClass(band)
                )}
              >
                <span className="opacity-70 font-semibold">{label}</span>
                <span className={cn('font-black', bandTextColor(band))}>
                  {band.toFixed(1)}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-xs text-brand-text-mute">
            No skill band data yet — complete an IA to populate.
          </p>
        )}
      </div>
    </div>
  );
}
