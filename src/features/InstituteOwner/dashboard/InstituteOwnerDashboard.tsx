import React, { useState, useEffect, useCallback } from 'react';
import {
  Users, BookOpen, BarChart2, AlertTriangle, Flame,
  TrendingUp, TrendingDown, Minus, ChevronRight, Loader2, RefreshCw,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { InstituteOwnerSidebar } from '../components/InstitiuteOwnerSidebar';
import { InstituteOwnerTopbar } from '../components/InstituteOwnerTopbar';
import { useToast } from '@/shared/hooks/use-toast';
import {
  fetchSummary, fetchAtRisk,
  type InstituteSummary, type AtRiskRow,
} from '../services/instituteOwnerService';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function BandPill({ band }: { band: number | null }) {
  if (band === null) return <span className="text-slate-400 text-sm">—</span>;
  const color = band >= 7 ? 'bg-emerald-100 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400'
    : band >= 6 ? 'bg-blue-100 dark:bg-blue-500/10 text-blue-700 dark:text-blue-400'
    : 'bg-amber-100 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400';
  return (
    <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${color}`}>
      {band.toFixed(1)}
    </span>
  );
}

function TrendIcon({ trend }: { trend: 'up' | 'flat' | 'down' | null }) {
  if (trend === 'up') return <TrendingUp className="w-3.5 h-3.5 text-emerald-500" />;
  if (trend === 'down') return <TrendingDown className="w-3.5 h-3.5 text-rose-500" />;
  if (trend === 'flat') return <Minus className="w-3.5 h-3.5 text-slate-400" />;
  return null;
}

function KpiCard({ label, value, sub, icon: Icon, accent }: {
  label: string; value: string | number; sub?: string;
  icon: React.ElementType; accent: string;
}) {
  return (
    <div className="bg-white dark:bg-[#121214] border border-slate-200 dark:border-[#27272a] rounded-xl p-5 shadow-sm">
      <div className="flex items-center gap-2 mb-3">
        <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${accent}`}>
          <Icon className="w-4 h-4" />
        </div>
        <p className="text-xs text-slate-500 dark:text-gray-400 font-medium">{label}</p>
      </div>
      <p className="text-3xl font-bold text-slate-900 dark:text-white">{value}</p>
      {sub && <p className="text-xs text-slate-400 mt-1">{sub}</p>}
    </div>
  );
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function DashboardSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[1,2,3,4].map(i => (
          <div key={i} className="bg-white dark:bg-[#121214] border border-slate-200 dark:border-[#27272a] rounded-xl p-5 h-24">
            <div className="h-3 w-20 bg-slate-200 dark:bg-[#27272a] rounded mb-3" />
            <div className="h-7 w-12 bg-slate-200 dark:bg-[#27272a] rounded" />
          </div>
        ))}
      </div>
      <div className="bg-white dark:bg-[#121214] border border-slate-200 dark:border-[#27272a] rounded-xl h-64" />
    </div>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────

export default function InstituteOwnerDashboard() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState<InstituteSummary | null>(null);
  const [atRisk, setAtRisk] = useState<AtRiskRow[]>([]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [sumRes, riskRes] = await Promise.all([fetchSummary(), fetchAtRisk()]);
      setSummary(sumRes.data);
      setAtRisk(riskRes.data.slice(0, 10));
    } catch (err: any) {
      toast({ title: 'Failed to load dashboard', description: err.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => { load(); }, [load]);

  const iaCompRate = summary
    ? summary.ia_completion_last_7_days.total_eligible > 0
      ? Math.round(summary.ia_completion_last_7_days.completed / summary.ia_completion_last_7_days.total_eligible * 100)
      : 0
    : 0;

  return (
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-[#0a0a0a] font-sans text-slate-900 dark:text-white transition-colors duration-300">
      <div className="hidden lg:block">
        <InstituteOwnerSidebar
          activeTab="owner-dashboard"
          isCollapsed={isSidebarCollapsed}
          toggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
        />
      </div>

      <div className={`transition-all duration-300 flex flex-col min-h-screen ${isSidebarCollapsed ? 'lg:pl-20' : 'lg:pl-64'}`}>
        <InstituteOwnerTopbar />

        <main className="flex-1 p-4 sm:p-6 lg:p-8">
          <div className="max-w-[1400px] mx-auto space-y-6">

            {/* Header */}
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
                  {summary?.institute_name ?? 'Institute Dashboard'}
                </h1>
                <p className="text-sm text-slate-500 mt-0.5">
                  Live operational overview across all batches
                  {summary?.exam_types?.length ? ` · ${summary.exam_types.join(', ')}` : ''}
                </p>
              </div>
              <button
                onClick={load}
                disabled={loading}
                className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-indigo-600 transition-colors"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} /> Refresh
              </button>
            </div>

            {loading ? <DashboardSkeleton /> : (
              <>
                {/* KPI Row */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                  <KpiCard
                    label="Total Students" icon={Users}
                    value={summary?.total_students ?? 0}
                    sub={`${summary?.active_today ?? 0} active today`}
                    accent="bg-indigo-100 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400"
                  />
                  <KpiCard
                    label="Total Batches" icon={BookOpen}
                    value={summary?.total_batches ?? 0}
                    sub={`${summary?.admins_count ?? 0} admin${(summary?.admins_count ?? 0) !== 1 ? 's' : ''}`}
                    accent="bg-blue-100 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400"
                  />
                  <KpiCard
                    label="Avg Band Score" icon={BarChart2}
                    value={summary?.avg_band !== null && summary?.avg_band !== undefined ? summary.avg_band.toFixed(1) : '—'}
                    sub={`${summary?.mock_completed_this_month ?? 0} mocks this month`}
                    accent="bg-emerald-100 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                  />
                  <KpiCard
                    label="At Risk" icon={AlertTriangle}
                    value={summary?.at_risk_count ?? 0}
                    sub={`IA completion: ${iaCompRate}% (7d)`}
                    accent="bg-rose-100 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400"
                  />
                </div>

                {/* Secondary Row */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="bg-white dark:bg-[#121214] border border-slate-200 dark:border-[#27272a] rounded-xl p-5 shadow-sm">
                    <p className="text-xs text-slate-500 mb-1 font-medium">Platform Unlocked Today</p>
                    <p className="text-2xl font-bold">{summary?.platform_unlocked_today ?? 0}</p>
                    <p className="text-xs text-slate-400 mt-1">students completed 2+ drills</p>
                  </div>
                  <div className="bg-white dark:bg-[#121214] border border-slate-200 dark:border-[#27272a] rounded-xl p-5 shadow-sm">
                    <p className="text-xs text-slate-500 mb-1 font-medium">IAs Completed (7 days)</p>
                    <p className="text-2xl font-bold">{summary?.ia_completion_last_7_days.completed ?? 0}</p>
                    <p className="text-xs text-slate-400 mt-1">of {summary?.ia_completion_last_7_days.total_eligible ?? 0} eligible</p>
                  </div>
                  <div className="bg-white dark:bg-[#121214] border border-slate-200 dark:border-[#27272a] rounded-xl p-5 shadow-sm">
                    <p className="text-xs text-slate-500 mb-1 font-medium">Mocks Completed (month)</p>
                    <p className="text-2xl font-bold">{summary?.mock_completed_this_month ?? 0}</p>
                    <p className="text-xs text-slate-400 mt-1">across all batches</p>
                  </div>
                </div>

                {/* At-Risk Students */}
                <div className="bg-white dark:bg-[#121214] border border-slate-200 dark:border-[#27272a] rounded-xl shadow-sm overflow-hidden">
                  <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-[#27272a]">
                    <div>
                      <h2 className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
                        <Flame className="w-4 h-4 text-rose-500" /> At-Risk Students
                      </h2>
                      <p className="text-xs text-slate-500 mt-0.5">Students needing immediate attention</p>
                    </div>
                    <button
                      onClick={() => navigate('/institute-owner/insight')}
                      className="text-xs text-indigo-600 dark:text-indigo-400 flex items-center gap-1 hover:underline"
                    >
                      View all batches <ChevronRight className="w-3 h-3" />
                    </button>
                  </div>

                  {atRisk.length === 0 ? (
                    <div className="py-12 text-center text-slate-500">
                      <div className="w-12 h-12 bg-emerald-50 dark:bg-emerald-500/10 rounded-full flex items-center justify-center mx-auto mb-3">
                        <TrendingUp className="w-6 h-6 text-emerald-500" />
                      </div>
                      <p className="font-medium">All students are on track</p>
                      <p className="text-sm mt-1">No at-risk flags detected today</p>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="text-[11px] uppercase tracking-widest text-slate-400 border-b border-slate-100 dark:border-[#27272a]">
                            <th className="px-6 py-3 text-left font-semibold">Student</th>
                            <th className="px-4 py-3 text-left font-semibold">Batch</th>
                            <th className="px-4 py-3 text-left font-semibold">Primary Flag</th>
                            <th className="px-4 py-3 text-center font-semibold">Band</th>
                            <th className="px-4 py-3 text-center font-semibold">Inactive</th>
                            <th className="px-4 py-3 text-center font-semibold">Missed IAs</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50 dark:divide-[#27272a]">
                          {atRisk.map(s => (
                            <tr
                              key={s.student_id}
                              className="hover:bg-slate-50 dark:hover:bg-white/[0.02] cursor-pointer transition-colors"
                              onClick={() => navigate(`/institute-owner/students/${s.user_id}/progress`, { state: { student: s } })}
                            >
                              <td className="px-6 py-3">
                                <div className="flex items-center gap-2">
                                  {s.avatar ? (
                                    <img src={s.avatar} className="w-7 h-7 rounded-full object-cover" alt="" />
                                  ) : (
                                    <div className="w-7 h-7 rounded-full bg-indigo-100 dark:bg-indigo-500/20 flex items-center justify-center text-xs font-bold text-indigo-600 dark:text-indigo-400">
                                      {s.name[0]}
                                    </div>
                                  )}
                                  <span className="font-medium text-slate-800 dark:text-slate-200">{s.name}</span>
                                </div>
                              </td>
                              <td className="px-4 py-3 text-slate-500 text-xs">{s.batch_name}</td>
                              <td className="px-4 py-3">
                                <span className="inline-flex items-center gap-1 text-xs bg-rose-50 dark:bg-rose-500/10 text-rose-700 dark:text-rose-400 px-2 py-0.5 rounded-full font-medium">
                                  <AlertTriangle className="w-3 h-3" /> {s.primary_flag}
                                </span>
                              </td>
                              <td className="px-4 py-3 text-center"><BandPill band={s.current_band} /></td>
                              <td className="px-4 py-3 text-center text-xs text-slate-500">
                                {s.days_inactive === -1 ? 'Never' : s.days_inactive === 0 ? 'Today' : `${s.days_inactive}d`}
                              </td>
                              <td className="px-4 py-3 text-center">
                                {s.missed_ia_count > 0 ? (
                                  <span className="text-rose-600 dark:text-rose-400 font-bold text-sm">{s.missed_ia_count}</span>
                                ) : (
                                  <span className="text-slate-400 text-xs">0</span>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>

                {/* Quick Nav Cards */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 pb-4">
                  {[
                    { label: 'Batch Insights', sub: 'All batches & health', path: '/institute-owner/insight' },
                    { label: 'All Students', sub: 'Cross-batch view', path: '/institute-owner/insight' },
                    { label: 'Assessments', sub: 'IA / Mock / Diagnostic', path: '/institute-owner/performance' },
                    { label: 'Analytics', sub: 'Trends & comparisons', path: '/institute-owner/performance' },
                  ].map(n => (
                    <button
                      key={n.label}
                      onClick={() => navigate(n.path)}
                      className="bg-white dark:bg-[#121214] border border-slate-200 dark:border-[#27272a] rounded-xl p-4 shadow-sm text-left hover:border-indigo-300 dark:hover:border-indigo-700 hover:shadow-md transition-all group"
                    >
                      <p className="font-semibold text-slate-800 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">{n.label}</p>
                      <p className="text-xs text-slate-400 mt-0.5">{n.sub}</p>
                    </button>
                  ))}
                </div>

              </>
            )}

          </div>
        </main>
      </div>
    </div>
  );
}
