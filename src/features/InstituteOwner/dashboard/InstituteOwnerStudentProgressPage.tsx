import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import {
  ChevronLeft, Activity, Target, Zap, TrendingUp, TrendingDown,
  Minus, Award, Loader2, Calendar, BookOpen, BarChart2,
} from 'lucide-react';
import { Button } from '@/shared/components/ui/button';
import { InstituteOwnerSidebar } from '../components/InstitiuteOwnerSidebar';
import { InstituteOwnerTopbar } from '../components/InstituteOwnerTopbar';
import { cn } from '@/shared/utils';
import { toast } from 'sonner';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer,
} from 'recharts';
import { fetchStudentFullProgress, type StudentFullProgress } from '../services/instituteOwnerService';

type Tab = 'overview' | 'ia' | 'mock' | 'drills';

const TABS: { key: Tab; label: string }[] = [
  { key: 'overview', label: 'Overview' },
  { key: 'ia',       label: 'IAs' },
  { key: 'mock',     label: 'Mock Tests' },
  { key: 'drills',   label: 'Drills' },
];

function BandBar({ label, value, max = 9 }: { label: string; value: number | null; max?: number }) {
  if (value === null) return null;
  const pct = (value / max) * 100;
  const color = value >= 7 ? 'bg-emerald-500' : value >= 6 ? 'bg-blue-500' : value >= 5 ? 'bg-amber-500' : 'bg-rose-500';
  return (
    <div>
      <div className="flex justify-between text-sm mb-1">
        <span className="text-slate-600 dark:text-slate-400 capitalize">{label.toLowerCase()}</span>
        <span className="font-bold text-slate-800 dark:text-slate-200">{value.toFixed(1)}</span>
      </div>
      <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2">
        <div className={`${color} h-2 rounded-full transition-all`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

function TrendIcon({ trend }: { trend: 'up' | 'flat' | 'down' | null }) {
  if (trend === 'up') return <TrendingUp className="w-4 h-4 text-emerald-500" />;
  if (trend === 'down') return <TrendingDown className="w-4 h-4 text-rose-500" />;
  if (trend === 'flat') return <Minus className="w-4 h-4 text-slate-400" />;
  return null;
}

export default function InstituteOwnerStudentProgressPage() {
  const navigate = useNavigate();
  const { studentId } = useParams();
  const location = useLocation();
  const passedStudent = location.state?.student;

  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [activeTab, setActiveTab] = useState<Tab>('overview');
  const [data, setData] = useState<StudentFullProgress | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const load = useCallback(async () => {
    if (!studentId) return;
    setIsLoading(true);
    try {
      const res = await fetchStudentFullProgress(studentId);
      setData(res.data);
    } catch (err: any) {
      toast.error(err.message || 'Could not load student progress.');
    } finally {
      setIsLoading(false);
    }
  }, [studentId]);

  useEffect(() => { load(); }, [load]);

  const name = data?.student?.name ?? passedStudent?.name ?? 'Student';

  return (
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-[#0a0a0a] transition-colors duration-300 font-sans text-slate-800 dark:text-slate-200">
      <div className="hidden lg:block">
        <InstituteOwnerSidebar
          activeTab="insight"
          isCollapsed={isSidebarCollapsed}
          toggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
        />
      </div>

      <div className={cn('transition-all duration-300 min-h-screen flex flex-col', isSidebarCollapsed ? 'lg:pl-20' : 'lg:pl-64')}>
        <InstituteOwnerTopbar />

        <main className="p-4 sm:p-6 lg:p-8 max-w-[1200px] mx-auto space-y-6 w-full">

          {/* Header */}
          <div>
            <Button variant="ghost" className="-ml-3 mb-2 text-slate-500 hover:text-slate-900" onClick={() => navigate(-1)}>
              <ChevronLeft className="w-4 h-4 mr-1" /> Back
            </Button>
            <div className="flex items-center gap-3">
              {data?.student?.avatar ? (
                <img src={data.student.avatar} className="w-12 h-12 rounded-full object-cover" alt="" />
              ) : (
                <div className="w-12 h-12 rounded-full bg-indigo-100 dark:bg-indigo-500/20 flex items-center justify-center text-lg font-bold text-indigo-600 dark:text-indigo-400">
                  {name[0]}
                </div>
              )}
              <div>
                <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Activity className="w-6 h-6 text-indigo-500" /> {name}
                </h1>
                <p className="text-sm text-slate-500">{data?.student?.email ?? ''}</p>
              </div>
            </div>
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center h-64">
              <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
            </div>
          ) : !data ? (
            <div className="text-center py-16 text-slate-500">Could not load progress data.</div>
          ) : (
            <>
              {/* Tabs */}
              <div className="flex gap-1 bg-slate-100 dark:bg-[#1a1a1c] rounded-xl p-1 w-fit">
                {TABS.map(t => (
                  <button
                    key={t.key}
                    onClick={() => setActiveTab(t.key)}
                    className={cn(
                      'px-4 py-2 rounded-lg text-sm font-medium transition-all',
                      activeTab === t.key
                        ? 'bg-white dark:bg-[#27272a] text-slate-900 dark:text-white shadow-sm'
                        : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300',
                    )}
                  >
                    {t.label}
                  </button>
                ))}
              </div>

              {/* Overview Tab */}
              {activeTab === 'overview' && (
                <div className="space-y-4 animate-in fade-in duration-300">
                  {/* KPI Row */}
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    {[
                      { label: 'Current Band', value: data.current_band !== null ? data.current_band.toFixed(1) : '—', icon: BarChart2, color: 'text-indigo-600', bg: 'bg-indigo-50 dark:bg-indigo-500/10' },
                      { label: 'Target Band', value: data.target_band !== null ? data.target_band.toFixed(1) : '—', icon: Target, color: 'text-emerald-600', bg: 'bg-emerald-50 dark:bg-emerald-500/10' },
                      { label: 'Momentum', value: data.momentum_score, icon: Zap, color: 'text-amber-600', bg: 'bg-amber-50 dark:bg-amber-500/10' },
                      { label: 'Daily Streak', value: `${data.daily_streak}d`, icon: Award, color: 'text-rose-600', bg: 'bg-rose-50 dark:bg-rose-500/10' },
                    ].map(m => (
                      <div key={m.label} className="bg-white dark:bg-[#121214] border border-slate-200 dark:border-[#27272a] rounded-xl p-5 shadow-sm">
                        <div className={`w-8 h-8 rounded-lg ${m.bg} ${m.color} flex items-center justify-center mb-3`}>
                          <m.icon className="w-4 h-4" />
                        </div>
                        <p className="text-xs text-slate-500 mb-1">{m.label}</p>
                        <p className="text-2xl font-bold text-slate-900 dark:text-white">{m.value}</p>
                      </div>
                    ))}
                  </div>

                  {/* Competency + eligibility */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    <div className="bg-white dark:bg-[#121214] border border-slate-200 dark:border-[#27272a] rounded-xl p-6 shadow-sm">
                      <h3 className="font-bold text-slate-800 dark:text-white mb-4">Skill Competency</h3>
                      <div className="space-y-4">
                        {data.competency.map(c => (
                          <BandBar key={c.skill} label={c.skill} value={c.band_score} />
                        ))}
                        {data.competency.length === 0 && (
                          <p className="text-sm text-slate-400">No competency data yet.</p>
                        )}
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div className="bg-white dark:bg-[#121214] border border-slate-200 dark:border-[#27272a] rounded-xl p-6 shadow-sm">
                        <h3 className="font-bold text-slate-800 dark:text-white mb-4">IA Eligibility</h3>
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span className="text-slate-500">Diagnostic done</span>
                            <span className={`font-semibold ${data.ia_eligibility.prerequisites_met ? 'text-emerald-600' : 'text-rose-500'}`}>
                              {data.ia_eligibility.prerequisites_met ? 'Yes' : 'No'}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-500">Total drills</span>
                            <span className="font-semibold">{data.ia_eligibility.drills_completed}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-500">Avg DCS (lifetime)</span>
                            <span className="font-semibold">{data.ia_eligibility.avg_dcs}%</span>
                          </div>
                        </div>
                      </div>
                      <div className="bg-white dark:bg-[#121214] border border-slate-200 dark:border-[#27272a] rounded-xl p-6 shadow-sm">
                        <h3 className="font-bold text-slate-800 dark:text-white mb-3">Lexigrid (14d)</h3>
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between"><span className="text-slate-500">Games played</span><span className="font-semibold">{data.lexigrid_stats.games_last_14}</span></div>
                          <div className="flex justify-between"><span className="text-slate-500">Avg words</span><span className="font-semibold">{data.lexigrid_stats.avg_words_solved}</span></div>
                          <div className="flex justify-between"><span className="text-slate-500">Bonus rate</span><span className="font-semibold">{(data.lexigrid_stats.bonus_rate * 100).toFixed(0)}%</span></div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* IA Tab */}
              {activeTab === 'ia' && (
                <div className="space-y-4 animate-in fade-in duration-300">
                  {data.ia_sessions.length === 0 ? (
                    <div className="bg-white dark:bg-[#121214] border border-slate-200 dark:border-[#27272a] rounded-xl p-12 text-center text-slate-500 shadow-sm">
                      No IA sessions yet.
                    </div>
                  ) : (
                    <div className="bg-white dark:bg-[#121214] border border-slate-200 dark:border-[#27272a] rounded-xl shadow-sm overflow-hidden">
                      <div className="px-6 py-4 border-b border-slate-100 dark:border-[#27272a]">
                        <h3 className="font-bold text-slate-800 dark:text-white">Internal Assessment History</h3>
                      </div>
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="text-[11px] uppercase tracking-widest text-slate-400 border-b border-slate-100 dark:border-[#27272a]">
                              <th className="px-6 py-3 text-left">IA #</th>
                              <th className="px-4 py-3 text-left">Date</th>
                              <th className="px-4 py-3 text-center">Status</th>
                              <th className="px-4 py-3 text-center">Band</th>
                              <th className="px-4 py-3 text-center">Momentum</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-50 dark:divide-[#27272a]">
                            {data.ia_sessions.map((ia: any) => {
                              const scores = (ia.scores as any[]) ?? [];
                              const bands = scores.map((s: any) => s.band ?? 0).filter((b: number) => b > 0);
                              const avgBand = bands.length ? bands.reduce((a: number, b: number) => a + b, 0) / bands.length : null;
                              return (
                                <tr key={ia.id} className="hover:bg-slate-50 dark:hover:bg-white/[0.02]">
                                  <td className="px-6 py-3 font-medium">IA {ia.ia_number}</td>
                                  <td className="px-4 py-3 text-slate-500">{ia.ia_date}</td>
                                  <td className="px-4 py-3 text-center">
                                    <span className={cn(
                                      'text-xs font-semibold px-2 py-0.5 rounded-full',
                                      ia.status === 'COMPLETED' ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400'
                                        : ia.status === 'MISSED' ? 'bg-rose-50 dark:bg-rose-500/10 text-rose-700 dark:text-rose-400'
                                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600',
                                    )}>
                                      {ia.status}
                                    </span>
                                  </td>
                                  <td className="px-4 py-3 text-center font-bold text-indigo-600 dark:text-indigo-400">
                                    {avgBand !== null ? avgBand.toFixed(1) : '—'}
                                  </td>
                                  <td className="px-4 py-3 text-center text-slate-500">
                                    {ia.momentum_awarded !== null ? `+${ia.momentum_awarded}` : '—'}
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Mock Tab */}
              {activeTab === 'mock' && (
                <div className="space-y-4 animate-in fade-in duration-300">
                  {data.mock_sessions.length === 0 ? (
                    <div className="bg-white dark:bg-[#121214] border border-slate-200 dark:border-[#27272a] rounded-xl p-12 text-center text-slate-500 shadow-sm">
                      No mock sessions yet.
                    </div>
                  ) : (
                    <div className="bg-white dark:bg-[#121214] border border-slate-200 dark:border-[#27272a] rounded-xl shadow-sm overflow-hidden">
                      <div className="px-6 py-4 border-b border-slate-100 dark:border-[#27272a]">
                        <h3 className="font-bold text-slate-800 dark:text-white">Mock Test History</h3>
                      </div>
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="text-[11px] uppercase tracking-widest text-slate-400 border-b border-slate-100 dark:border-[#27272a]">
                              <th className="px-6 py-3 text-left">Month</th>
                              <th className="px-4 py-3 text-center">Type</th>
                              <th className="px-4 py-3 text-center">Status</th>
                              <th className="px-4 py-3 text-center">Real Band</th>
                              <th className="px-4 py-3 text-center">Momentum</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-50 dark:divide-[#27272a]">
                            {data.mock_sessions.map((m: any) => (
                              <tr key={m.id} className="hover:bg-slate-50 dark:hover:bg-white/[0.02]">
                                <td className="px-6 py-3 font-medium">{m.month_year}</td>
                                <td className="px-4 py-3 text-center text-xs text-slate-500">{m.attempt_type ?? 'FULL'}</td>
                                <td className="px-4 py-3 text-center">
                                  <span className={cn(
                                    'text-xs font-semibold px-2 py-0.5 rounded-full',
                                    m.status === 'COMPLETED' ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400'
                                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600',
                                  )}>
                                    {m.status}
                                  </span>
                                </td>
                                <td className="px-4 py-3 text-center font-bold text-indigo-600 dark:text-indigo-400">
                                  {m.real_band_score ?? '—'}
                                </td>
                                <td className="px-4 py-3 text-center text-slate-500">
                                  {m.momentum_awarded !== null ? `+${m.momentum_awarded}` : '—'}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Drills Tab */}
              {activeTab === 'drills' && (
                <div className="space-y-4 animate-in fade-in duration-300">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    {[
                      { label: 'Total Drills (all time)', value: data.drill_stats.total_drills_all_time },
                      { label: 'Avg DCS (lifetime)', value: `${data.drill_stats.avg_dcs_lifetime}%` },
                    ].map(m => (
                      <div key={m.label} className="bg-white dark:bg-[#121214] border border-slate-200 dark:border-[#27272a] rounded-xl p-5 shadow-sm">
                        <p className="text-xs text-slate-500 mb-1">{m.label}</p>
                        <p className="text-2xl font-bold">{m.value}</p>
                      </div>
                    ))}
                  </div>

                  {/* 14-day DCS chart */}
                  <div className="bg-white dark:bg-[#121214] border border-slate-200 dark:border-[#27272a] rounded-xl p-6 shadow-sm">
                    <h3 className="font-bold text-slate-800 dark:text-white mb-4">DCS Last 14 Days</h3>
                    <div className="h-52">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={data.drill_stats.last_14_days} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} strokeOpacity={0.5} />
                          <XAxis dataKey="date" tick={{ fontSize: 9, fill: '#64748b' }} axisLine={false} tickLine={false}
                            tickFormatter={d => d.slice(5)} />
                          <YAxis domain={[0, 100]} unit="%" tick={{ fontSize: 10, fill: '#64748b' }} axisLine={false} tickLine={false} />
                          <Tooltip contentStyle={{ borderRadius: 8, fontSize: 12 }} formatter={(v: any) => [`${v}%`, 'DCS']} />
                          <Bar dataKey="dcs" fill="#6366f1" radius={[3, 3, 0, 0]} name="DCS" />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  {/* Sub-skill drill breakdown */}
                  {data.drill_stats.sub_skill_counts.length > 0 && (
                    <div className="bg-white dark:bg-[#121214] border border-slate-200 dark:border-[#27272a] rounded-xl p-6 shadow-sm">
                      <h3 className="font-bold text-slate-800 dark:text-white mb-4">Sub-skill Accuracy</h3>
                      <div className="space-y-2">
                        {data.drill_stats.sub_skill_counts.slice(0, 15).map(r => (
                          <div key={`${r.skill}-${r.sub_skill}`} className="flex items-center gap-3 text-sm">
                            <span className="text-xs text-slate-400 w-8 shrink-0">{r.skill.slice(0, 1)}</span>
                            <span className="text-slate-600 dark:text-slate-400 flex-1 truncate" title={r.sub_skill}>{r.sub_skill}</span>
                            <div className="w-32 bg-slate-100 dark:bg-slate-800 rounded-full h-2">
                              <div
                                className={`h-2 rounded-full ${r.avg_accuracy >= 75 ? 'bg-emerald-500' : r.avg_accuracy >= 50 ? 'bg-amber-500' : 'bg-rose-500'}`}
                                style={{ width: `${r.avg_accuracy}%` }}
                              />
                            </div>
                            <span className="text-xs font-bold w-10 text-right">{r.avg_accuracy}%</span>
                            <span className="text-xs text-slate-400 w-14 text-right">{r.count}x</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

            </>
          )}

        </main>
      </div>
    </div>
  );
}
