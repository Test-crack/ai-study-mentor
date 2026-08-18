import { Flame, Target, Zap, Gamepad2 } from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Cell,
} from 'recharts';
import { cn } from '@/shared/utils';
import type { StudentFullProgress } from './types';

interface Props {
  drillStats:  StudentFullProgress['drill_stats'];
  lexiStats:   StudentFullProgress['lexigrid_stats'];
  streak:      number;
}

function StatCard({ icon, label, value, sub }: {
  icon: React.ReactNode; label: string; value: string | number; sub?: string;
}) {
  return (
    <div className="bg-white rounded-2xl border border-brand-line p-4 flex items-center gap-3">
      <div className="h-10 w-10 rounded-xl bg-brand-teal-50 flex items-center justify-center shrink-0 text-brand-teal-600">
        {icon}
      </div>
      <div>
        <p className="text-[10px] font-bold text-brand-text-mute font-jetbrains uppercase tracking-wider">{label}</p>
        <p className="text-xl font-black text-brand-text leading-tight">{value}</p>
        {sub && <p className="text-[10px] text-brand-text-mute mt-0.5">{sub}</p>}
      </div>
    </div>
  );
}

function StreakCalendar({ days }: { days: Array<{ date: string; active: boolean }> }) {
  const rows: typeof days[] = [];
  for (let i = 0; i < days.length; i += 7) rows.push(days.slice(i, i + 7));
  return (
    <div className="space-y-1.5">
      {rows.map((row, ri) => (
        <div key={ri} className="flex gap-1.5">
          {row.map((day) => (
            <div
              key={day.date}
              title={day.date}
              className={cn(
                'h-6 w-6 rounded-md border transition-colors',
                day.active
                  ? 'bg-brand-teal-500 border-brand-teal-600'
                  : 'bg-brand-bg-alt border-brand-line'
              )}
            />
          ))}
        </div>
      ))}
    </div>
  );
}

export function DrillsTab({ drillStats, lexiStats, streak }: Props) {
  const { last_14_days, sub_skill_counts, streak_calendar, total_drills_all_time, avg_dcs_lifetime } = drillStats;

  const chartData = last_14_days.map(d => ({
    date:  d.date.slice(5),   // "MM-DD"
    dcs:   d.dcs ?? 0,
    count: d.count,
    hasData: d.dcs !== null,
  }));

  // Each entry is unique by skill+sub_skill (backend uses compound key).
  // GRAMMAR and VOCABULARY appear under both WRITING and SPEAKING — keep them separate.
  const topSkills = [...sub_skill_counts]
    .sort((a, b) => b.count - a.count)
    .slice(0, 10)
    .map(sk => ({
      key:          `${sk.skill}::${sk.sub_skill}`,
      display:      sk.sub_skill.charAt(0) + sk.sub_skill.slice(1).toLowerCase(),
      parent:       sk.skill.charAt(0) + sk.skill.slice(1).toLowerCase(),
      count:        sk.count,
      avg_accuracy: sk.avg_accuracy,
    }));

  return (
    <div className="space-y-5">
      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard icon={<Zap className="h-5 w-5" />}      label="Total Drills"     value={total_drills_all_time} sub="all time" />
        <StatCard icon={<Target className="h-5 w-5" />}   label="Avg DCS"          value={`${avg_dcs_lifetime}%`} sub="lifetime" />
        <StatCard icon={<Flame className="h-5 w-5" />}    label="Current Streak"   value={`${streak}d`} sub="consecutive days" />
        <StatCard icon={<Gamepad2 className="h-5 w-5" />} label="LexiGrid (14d)"   value={lexiStats.games_last_14} sub={`${lexiStats.avg_words_solved} avg words`} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* DCS Chart */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-brand-line shadow-sm p-5">
          <h3 className="text-sm font-bold text-brand-text mb-4">Daily DCS — Last 14 Days</h3>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }} barSize={14}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" strokeOpacity={0.5} />
                <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                <YAxis domain={[0, 100]} tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                <Tooltip
                  formatter={(v: number, _name: string, props: any) => [
                    props.payload.hasData ? `${v}%` : 'No drills',
                    'DCS',
                  ]}
                  contentStyle={{ borderRadius: '10px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', fontSize: 12 }}
                />
                <Bar dataKey="dcs" radius={[4, 4, 0, 0]}>
                  {chartData.map((entry, i) => (
                    <Cell key={i} fill={entry.hasData ? '#12897C' : '#e2e8f0'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="flex items-center gap-4 mt-3 text-xs text-brand-text-mute">
            <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-brand-teal-500" /> Active day</span>
            <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-brand-bg-alt" /> No drills</span>
          </div>
        </div>

        {/* Streak Calendar */}
        <div className="bg-white rounded-2xl border border-brand-line shadow-sm p-5">
          <h3 className="text-sm font-bold text-brand-text mb-4">Activity Calendar (30d)</h3>
          <StreakCalendar days={streak_calendar} />
          <div className="flex items-center gap-3 mt-4 text-xs text-brand-text-mute">
            <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-brand-teal-500" /> Active</span>
            <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-brand-bg-alt" /> Inactive</span>
          </div>
        </div>
      </div>

      {/* Sub-skill breakdown */}
      {topSkills.length > 0 && (
        <div className="bg-white rounded-2xl border border-brand-line shadow-sm overflow-hidden">
          <div className="px-5 py-3 border-b border-brand-line">
            <h3 className="text-sm font-bold text-brand-text">
              Sub-skills Practiced
              <span className="ml-2 text-[11px] font-normal text-brand-text-mute">({topSkills.length} of 10 drilled)</span>
            </h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-brand-line text-[11px] font-bold text-brand-text-mute font-jetbrains uppercase tracking-wider">
                  <th className="py-3 pl-5">Sub-skill</th>
                  <th className="py-3 text-right">Sessions</th>
                  <th className="py-3 text-right pr-5">Avg Accuracy</th>
                </tr>
              </thead>
              <tbody>
                {topSkills.map((sk, i) => (
                  <tr key={sk.key} className="border-b border-brand-line hover:bg-brand-bg-alt transition-colors">
                    <td className="py-3 pl-5">
                      <div className="flex items-center gap-3">
                        <span className="text-[10px] font-black text-brand-text-mute w-4">{i + 1}</span>
                        <div>
                          <span className="text-sm font-semibold text-brand-text">{sk.display}</span>
                          <span className="ml-1.5 text-[10px] font-medium text-brand-text-mute">{sk.parent}</span>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 text-right text-sm font-bold text-brand-text-mute">{sk.count}</td>
                    <td className="py-3 pr-5 text-right">
                      <span className={cn(
                        'text-sm font-black',
                        sk.avg_accuracy >= 70 ? 'text-emerald-600' :
                        sk.avg_accuracy >= 50 ? 'text-amber-600' :
                        'text-rose-600'
                      )}>
                        {sk.avg_accuracy}%
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
