import { CheckCircle2, AlertCircle, Gamepad2, Zap, Award } from 'lucide-react';
import {
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  ResponsiveContainer, Tooltip,
} from 'recharts';
import { cn } from '@/shared/utils';
import type { StudentFullProgress } from './types';

interface Props { data: StudentFullProgress; }

function MiniCard({ icon, label, value, sub }: {
  icon: React.ReactNode; label: string; value: string | number; sub?: string;
}) {
  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-4 flex items-center gap-3">
      <div className="h-9 w-9 rounded-xl bg-indigo-50 dark:bg-indigo-500/10 flex items-center justify-center shrink-0 text-indigo-600 dark:text-indigo-400">
        {icon}
      </div>
      <div className="min-w-0">
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider truncate">{label}</p>
        <p className="text-lg font-black text-slate-900 dark:text-white leading-tight">{value}</p>
        {sub && <p className="text-[10px] text-slate-400">{sub}</p>}
      </div>
    </div>
  );
}

const SKILL_ROWS: Array<{ abbr: 'L' | 'R' | 'W' | 'S'; label: string; skill: string }> = [
  { abbr: 'L', label: 'Listening', skill: 'LISTENING' },
  { abbr: 'R', label: 'Reading',   skill: 'READING'   },
  { abbr: 'W', label: 'Writing',   skill: 'WRITING'   },
  { abbr: 'S', label: 'Speaking',  skill: 'SPEAKING'  },
];

function BaselineComparison({ baseline, competency }: {
  baseline: StudentFullProgress['diagnostic_baseline'];
  competency: StudentFullProgress['competency'];
}) {
  const currentBySkill = new Map(competency.map(r => [r.skill.toUpperCase(), r.band_score]));
  const hasBaseline = baseline != null && SKILL_ROWS.some(r => baseline[r.abbr] !== null);
  const hasCurrent  = SKILL_ROWS.some(r => (currentBySkill.get(r.skill) ?? 0) > 0);

  if (!hasBaseline && !hasCurrent) return null;

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm p-5">
      <h3 className="text-sm font-bold text-slate-700 dark:text-slate-200 mb-4">
        Diagnostic Baseline vs Current
      </h3>
      <div className="space-y-3">
        {SKILL_ROWS.map(({ abbr, label, skill }) => {
          const base    = baseline[abbr];
          const current = currentBySkill.get(skill) ?? null;
          const delta   = base !== null && current !== null ? Math.round((current - base) * 10) / 10 : null;

          return (
            <div key={abbr} className="grid grid-cols-[80px_1fr_60px_60px_52px] items-center gap-2">
              <span className="text-xs font-semibold text-slate-600 dark:text-slate-400 shrink-0">{label}</span>
              <div className="relative h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                {/* baseline marker */}
                {base !== null && (
                  <div
                    className="absolute top-0 h-full bg-slate-300 dark:bg-slate-600 rounded-full"
                    style={{ width: `${(base / 9) * 100}%` }}
                  />
                )}
                {/* current fill */}
                {current !== null && current > 0 && (
                  <div
                    className="absolute top-0 h-full bg-indigo-500 dark:bg-indigo-400 rounded-full opacity-80"
                    style={{ width: `${(current / 9) * 100}%` }}
                  />
                )}
              </div>
              <span className="text-[10px] text-slate-400 text-right">
                {base !== null ? base.toFixed(1) : '—'}
              </span>
              <span className={cn(
                'text-xs font-black text-right',
                (current ?? 0) >= 7.5 ? 'text-emerald-600 dark:text-emerald-400'
                : (current ?? 0) >= 6.0 ? 'text-amber-600 dark:text-amber-400'
                : (current ?? 0) > 0    ? 'text-rose-600 dark:text-rose-400'
                : 'text-slate-400'
              )}>
                {current !== null && current > 0 ? current.toFixed(1) : '—'}
              </span>
              <span className={cn(
                'text-[10px] font-bold text-right',
                delta === null ? 'text-slate-300 dark:text-slate-600'
                : delta > 0   ? 'text-emerald-600 dark:text-emerald-400'
                : delta < 0   ? 'text-rose-600 dark:text-rose-400'
                : 'text-slate-400'
              )}>
                {delta === null ? '—' : delta > 0 ? `+${delta.toFixed(1)}` : delta.toFixed(1)}
              </span>
            </div>
          );
        })}
      </div>
      <div className="flex items-center gap-4 mt-4 text-[10px] text-slate-400">
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-1.5 rounded bg-slate-300 dark:bg-slate-600 inline-block" /> Baseline
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-1.5 rounded bg-indigo-500 inline-block opacity-80" /> Current
        </span>
        <span className="ml-auto italic">Δ = current − baseline</span>
      </div>
    </div>
  );
}

export function OverviewTab({ data }: Props) {
  const competency          = data.competency         ?? [];
  const diagnostic_baseline = data.diagnostic_baseline ?? { L: null, R: null, W: null, S: null };
  const lexigrid_stats      = data.lexigrid_stats      ?? { games_last_14: 0, avg_words_solved: 0, bonus_rate: 0 };
  const ia_eligibility      = data.ia_eligibility      ?? { prerequisites_met: false, avg_dcs: 0, drills_completed: 0, next_ia_date: null };

  const radarData = competency
    .filter(r => r.band_score > 0)
    .map(r => ({ skill: r.skill, band: r.band_score, fullMark: 9 }));

  const eligOk = ia_eligibility.prerequisites_met;

  return (
    <div className="space-y-5">
      {/* IA Eligibility */}
      <div className={cn(
        'rounded-2xl border p-4 flex items-start gap-3',
        eligOk
          ? 'bg-emerald-50 dark:bg-emerald-500/10 border-emerald-200 dark:border-emerald-500/30'
          : 'bg-amber-50 dark:bg-amber-500/10 border-amber-200 dark:border-amber-500/30'
      )}>
        {eligOk
          ? <CheckCircle2 className="h-5 w-5 text-emerald-600 dark:text-emerald-400 mt-0.5 shrink-0" />
          : <AlertCircle  className="h-5 w-5 text-amber-600 dark:text-amber-400 mt-0.5 shrink-0" />}
        <div className="flex-1 min-w-0">
          <p className={cn('text-sm font-bold', eligOk ? 'text-emerald-800 dark:text-emerald-300' : 'text-amber-800 dark:text-amber-300')}>
            {eligOk ? 'IA Eligible — Prerequisites met' : 'Not yet IA eligible'}
          </p>
          <p className={cn('text-xs mt-0.5', eligOk ? 'text-emerald-700 dark:text-emerald-400' : 'text-amber-700 dark:text-amber-400')}>
            {ia_eligibility.drills_completed} drills completed · Avg DCS {ia_eligibility.avg_dcs}%
            {ia_eligibility.next_ia_date && ` · Next IA: ${ia_eligibility.next_ia_date}`}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Competency Radar */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm p-5">
          <h3 className="text-sm font-bold text-slate-700 dark:text-slate-200 mb-4">Competency Radar</h3>
          {radarData.length >= 3 ? (
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart data={radarData} margin={{ top: 10, right: 20, bottom: 10, left: 20 }}>
                  <PolarGrid stroke="#e2e8f0" strokeOpacity={0.6} />
                  <PolarAngleAxis
                    dataKey="skill"
                    tick={{ fontSize: 11, fill: '#64748b', fontWeight: 600 }}
                  />
                  <PolarRadiusAxis
                    angle={30}
                    domain={[0, 9]}
                    tick={{ fontSize: 9, fill: '#94a3b8' }}
                    tickCount={4}
                  />
                  <Radar
                    name="Band"
                    dataKey="band"
                    stroke="#6366f1"
                    fill="#6366f1"
                    fillOpacity={0.25}
                    strokeWidth={2}
                  />
                  <Tooltip
                    formatter={(v: number) => [`${v.toFixed(1)}`, 'Band']}
                    contentStyle={{ borderRadius: '10px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', fontSize: 12 }}
                  />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          ) : radarData.length > 0 ? (
            <div className="space-y-3 py-2">
              {radarData.map(r => (
                <div key={r.skill} className="flex items-center gap-3">
                  <span className="text-xs font-semibold text-slate-600 dark:text-slate-400 w-20 shrink-0">{r.skill}</span>
                  <div className="flex-1 h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-indigo-500 rounded-full"
                      style={{ width: `${(r.band / 9) * 100}%` }}
                    />
                  </div>
                  <span className="text-xs font-black text-slate-700 dark:text-slate-300 w-8 text-right">{r.band.toFixed(1)}</span>
                </div>
              ))}
            </div>
          ) : (
            <div className="h-56 flex items-center justify-center text-slate-400 text-sm">
              No competency data yet
            </div>
          )}
        </div>

        {/* LexiGrid Stats */}
        <div className="space-y-3">
          <h3 className="text-sm font-bold text-slate-700 dark:text-slate-200">LexiGrid (last 14 days)</h3>
          <MiniCard
            icon={<Gamepad2 className="h-4 w-4" />}
            label="Games Played"
            value={lexigrid_stats.games_last_14}
            sub="completed sessions"
          />
          <MiniCard
            icon={<Award className="h-4 w-4" />}
            label="Avg Words Solved"
            value={lexigrid_stats.avg_words_solved}
            sub="per game"
          />
          <MiniCard
            icon={<Zap className="h-4 w-4" />}
            label="Bonus Rate"
            value={`${lexigrid_stats.bonus_rate}%`}
            sub="bonus eligible games"
          />
        </div>
      </div>

      {/* Diagnostic baseline vs current bands */}
      <BaselineComparison baseline={diagnostic_baseline} competency={competency} />
    </div>
  );
}
