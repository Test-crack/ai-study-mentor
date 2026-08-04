// src/features/InstituteOwner/dashboard/InstituteOwnerDashboard.tsx
import React, { useState, useEffect, useCallback } from 'react';
import {
  Users, BookOpen, BarChart2, AlertTriangle, Flame,
  TrendingUp, TrendingDown, Minus, ChevronRight, ChevronLeft, Loader2, RefreshCw,
  Sparkles, Zap, CheckCircle2, Target, ArrowUpRight,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { InstituteOwnerSidebar } from '../components/InstitiuteOwnerSidebar';
import { InstituteOwnerTopbar } from '../components/InstituteOwnerTopbar';
import { useToast } from '@/shared/hooks/use-toast';
import {
  fetchSummary, fetchAtRisk,
  type InstituteSummary, type AtRiskRow,
} from '../services/instituteOwnerService';

const toSlug = (name: string) => name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

// ─── Helpers ──────────────────────────────────────────────────────────────────

function BandPill({ band }: { band: number | null }) {
  if (band === null) return <span className="text-slate-400 text-sm">—</span>;
  const color = band >= 7 ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 ring-emerald-600/20 dark:ring-emerald-400/25'
    : band >= 6 ? 'bg-blue-50 dark:bg-blue-500/10 text-blue-700 dark:text-blue-400 ring-blue-600/20 dark:ring-blue-400/25'
    : 'bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400 ring-amber-600/20 dark:ring-amber-400/25';
  return (
    <span className={`inline-flex items-center justify-center text-xs font-bold tabular-nums px-2.5 py-0.5 rounded-full ring-1 ring-inset ${color}`}>
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
    <div className="group relative rounded-2xl bg-white/85 dark:bg-[#131318]/90 backdrop-blur-xl border border-white/20 dark:border-white/[0.08] ring-1 ring-slate-900/[0.05] dark:ring-0 p-4 sm:p-5 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-300">
      <div className="flex items-start justify-between gap-2 mb-3 sm:mb-4">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 pt-1">{label}</p>
        <div className={`w-9 h-9 shrink-0 rounded-xl flex items-center justify-center shadow-inner ${accent}`}>
          <Icon className="w-4 h-4" />
        </div>
      </div>
      <p className="text-2xl sm:text-3xl font-bold tracking-tight tabular-nums text-slate-900 dark:text-white">{value}</p>
      {sub && <p className="text-xs text-slate-400 dark:text-slate-500 mt-1.5 truncate">{sub}</p>}
    </div>
  );
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function DashboardSkeleton() {
  return (
    <div className="animate-pulse">
      <div className="relative z-10 -mt-12 sm:-mt-14 grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="h-28 rounded-2xl bg-white dark:bg-[#131318] border border-slate-200/70 dark:border-white/[0.08] p-5">
            <div className="h-3 w-20 bg-slate-200 dark:bg-[#27272a] rounded mb-4" />
            <div className="h-7 w-14 bg-slate-200 dark:bg-[#27272a] rounded" />
          </div>
        ))}
      </div>
      <div className="mt-6 h-20 rounded-2xl bg-white dark:bg-[#131318] border border-slate-200/70 dark:border-white/[0.08]" />
      <div className="mt-6 h-72 rounded-2xl bg-white dark:bg-[#131318] border border-slate-200/70 dark:border-white/[0.08]" />
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
  const [atRisk, setAtRisk]   = useState<AtRiskRow[]>([]);
  const [riskPage, setRiskPage] = useState(0);

  const RISK_PAGE_SIZE = 8;

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [sumRes, riskRes] = await Promise.all([fetchSummary(), fetchAtRisk()]);
      setSummary(sumRes.data);
      setAtRisk(riskRes.data);
      setRiskPage(0);
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

  const riskPageCount   = Math.ceil(atRisk.length / RISK_PAGE_SIZE);
  const riskHasPrev     = riskPage > 0;
  const riskHasNext     = riskPage < riskPageCount - 1;
  const riskPageRows    = atRisk.slice(riskPage * RISK_PAGE_SIZE, (riskPage + 1) * RISK_PAGE_SIZE);

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
          <div className="max-w-[1400px] mx-auto">

            {/* ── Hero Banner ─────────────────────────────────────────────── */}
            <section className="relative overflow-hidden rounded-2xl sm:rounded-3xl border border-brand-teal-100/80 dark:border-white/[0.06] bg-gradient-to-r from-[#eff4ff] via-[#f4f1ff] to-[#f3f0ff] dark:from-[#111827] dark:via-[#161a38] dark:to-[#1e1b4b] px-5 sm:px-8 pt-6 sm:pt-8 pb-20 sm:pb-24 shadow-sm">
              {/* decorative glow blobs */}
              <div aria-hidden className="pointer-events-none select-none absolute inset-0">
                <div className="absolute -top-20 -right-12 w-64 h-64 rounded-full bg-brand-teal-300/25 dark:bg-brand-teal-500/15 blur-3xl" />
                <div className="absolute -bottom-28 left-1/3 w-72 h-72 rounded-full bg-brand-blue-300/20 dark:bg-brand-blue-500/10 blur-3xl" />
                <div className="absolute top-8 -left-10 w-44 h-44 rounded-full bg-sky-300/20 dark:bg-sky-500/10 blur-3xl" />
              </div>

              <div className="relative flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                <div>
                  <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-brand-teal-600 dark:text-brand-teal-300 bg-white/60 dark:bg-white/[0.06] border border-white/70 dark:border-white/[0.08] backdrop-blur px-2.5 py-1 rounded-full">
                    Owner Portal
                  </span>
                  <h1 className="mt-3 text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
                    {summary?.institute_name
                      ? <>Great to see you, <span className="text-brand-teal-600 dark:text-brand-teal-400">{summary.institute_name}</span></>
                      : 'Institute Dashboard'}
                  </h1>
                  <p className="mt-1.5 text-sm text-slate-500 dark:text-slate-400">
                    Live operational overview across all batches
                  </p>
                </div>

                <button
                  onClick={load}
                  disabled={loading}
                  className="self-start shrink-0 inline-flex items-center gap-1.5 text-xs font-medium text-slate-600 dark:text-slate-300 bg-white/70 dark:bg-white/[0.06] hover:bg-white dark:hover:bg-white/[0.12] border border-white/70 dark:border-white/[0.08] backdrop-blur px-3.5 py-2 rounded-full shadow-sm transition-all disabled:opacity-60"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} /> Refresh
                </button>
              </div>
            </section>

            {loading ? <DashboardSkeleton /> : (
              <>
                {/* ── KPI Row (overlaps hero) ─────────────────────────────── */}
                <div className="relative z-10 -mt-12 sm:-mt-14 grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                  <KpiCard
                    label="Total Students" icon={Users}
                    value={summary?.total_students ?? 0}
                    sub={`${summary?.active_today ?? 0} active today`}
                    accent="bg-brand-teal-100 dark:bg-brand-teal-500/10 text-brand-teal-600 dark:text-brand-teal-400"
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

                {/* ── Secondary Stats (tinted strip, distinct from KPIs) ──── */}
                <div className="mt-6 rounded-2xl border border-slate-200/70 dark:border-white/[0.06] bg-gradient-to-r from-slate-50 to-slate-100/60 dark:from-white/[0.03] dark:to-transparent overflow-hidden">
                  <div className="grid grid-cols-1 sm:grid-cols-3 divide-y sm:divide-y-0 sm:divide-x divide-slate-200/70 dark:divide-white/[0.06]">
                    <div className="flex items-center gap-4 px-5 sm:px-6 py-4">
                      <div className="w-9 h-9 shrink-0 rounded-xl bg-brand-blue-100/80 dark:bg-brand-blue-500/10 text-brand-blue-600 dark:text-brand-blue-400 flex items-center justify-center">
                        <Zap className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">Platform Unlocked Today</p>
                        <p className="text-xl font-bold tabular-nums text-slate-900 dark:text-white">{summary?.platform_unlocked_today ?? 0}</p>
                        <p className="text-xs text-slate-400 dark:text-slate-500">students completed 2+ drills</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-4 px-5 sm:px-6 py-4">
                      <div className="w-9 h-9 shrink-0 rounded-xl bg-sky-100/80 dark:bg-sky-500/10 text-sky-600 dark:text-sky-400 flex items-center justify-center">
                        <CheckCircle2 className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">IAs Completed (7 days)</p>
                        <p className="text-xl font-bold tabular-nums text-slate-900 dark:text-white">{summary?.ia_completion_last_7_days.completed ?? 0}</p>
                        <p className="text-xs text-slate-400 dark:text-slate-500">of {summary?.ia_completion_last_7_days.total_eligible ?? 0} eligible</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-4 px-5 sm:px-6 py-4">
                      <div className="w-9 h-9 shrink-0 rounded-xl bg-teal-100/80 dark:bg-teal-500/10 text-teal-600 dark:text-teal-400 flex items-center justify-center">
                        <Target className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">Mocks Completed (month)</p>
                        <p className="text-xl font-bold tabular-nums text-slate-900 dark:text-white">{summary?.mock_completed_this_month ?? 0}</p>
                        <p className="text-xs text-slate-400 dark:text-slate-500">across all batches</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* ── At-Risk Students ────────────────────────────────────── */}
                <div className="mt-6 rounded-2xl bg-white dark:bg-[#131318] border border-slate-200/70 dark:border-white/[0.08] shadow-sm overflow-hidden">
                  <div className="flex items-center justify-between px-5 sm:px-6 py-4 border-b border-slate-100 dark:border-white/[0.06]">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-rose-50 dark:bg-rose-500/10 flex items-center justify-center">
                        <Flame className="w-4 h-4 text-rose-500" />
                      </div>
                      <div>
                        <h2 className="font-bold text-sm sm:text-base text-slate-900 dark:text-white leading-tight">At-Risk Students</h2>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Students needing immediate attention</p>
                      </div>
                    </div>
                    <button
                      onClick={() => navigate('/institute-owner/insight')}
                      className="text-xs font-medium text-brand-teal-600 dark:text-brand-teal-400 flex items-center gap-1 hover:underline underline-offset-2"
                    >
                      View all batches <ChevronRight className="w-3 h-3" />
                    </button>
                  </div>

                  {atRisk.length === 0 ? (
                    <div className="py-14 text-center text-slate-500 dark:text-slate-400">
                      <div className="w-12 h-12 bg-emerald-50 dark:bg-emerald-500/10 rounded-2xl flex items-center justify-center mx-auto mb-3">
                        <TrendingUp className="w-6 h-6 text-emerald-500" />
                      </div>
                      <p className="font-semibold text-slate-700 dark:text-slate-200">All students are on track</p>
                      <p className="text-sm mt-1">No at-risk flags detected today</p>
                    </div>
                  ) : (
                    <>
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="text-[10px] uppercase tracking-[0.12em] text-slate-400 dark:text-slate-500 border-b border-slate-100 dark:border-white/[0.06] bg-slate-50/60 dark:bg-white/[0.02]">
                            <th className="px-5 sm:px-6 py-2.5 text-left font-semibold">Student</th>
                            <th className="px-4 py-2.5 text-left font-semibold">Batch</th>
                            <th className="px-4 py-2.5 text-left font-semibold">Primary Flag</th>
                            <th className="px-4 py-2.5 text-center font-semibold">Band</th>
                            <th className="px-4 py-2.5 text-center font-semibold">Last Active</th>
                            <th className="px-4 py-2.5 text-center font-semibold">Missed IAs</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50 dark:divide-white/[0.04]">
                          {riskPageRows.map(s => (
                            <tr
                              key={s.student_id}
                              className="hover:bg-slate-50 dark:hover:bg-white/[0.03] cursor-pointer transition-colors"
                              onClick={() => navigate(`/institute-owner/students/${toSlug(s.name)}/progress`, { state: { studentId: s.user_id } })}
                            >
                              <td className="px-5 sm:px-6 py-2.5">
                                <div className="flex items-center gap-2.5">
                                  {s.avatar ? (
                                    <img src={s.avatar} className="w-7 h-7 rounded-full object-cover ring-1 ring-slate-200/70 dark:ring-white/10" alt="" />
                                  ) : (
                                    <div className="w-7 h-7 rounded-full bg-gradient-to-br from-brand-teal-100 to-brand-blue-100 dark:from-brand-teal-500/20 dark:to-brand-blue-500/20 flex items-center justify-center text-xs font-bold text-brand-teal-600 dark:text-brand-teal-400 ring-1 ring-brand-teal-200/60 dark:ring-brand-teal-500/20">
                                      {s.name[0]}
                                    </div>
                                  )}
                                  <span className="font-medium text-[13px] text-slate-800 dark:text-slate-200 whitespace-nowrap">{s.name}</span>
                                </div>
                              </td>
                              <td className="px-4 py-2.5 text-slate-500 dark:text-slate-400 text-xs whitespace-nowrap">{s.batch_name}</td>
                              <td className="px-4 py-2.5">
                                <span className="inline-flex items-center gap-1 text-[11px] font-medium bg-rose-50 dark:bg-rose-500/10 text-rose-700 dark:text-rose-400 px-2 py-0.5 rounded-full ring-1 ring-inset ring-rose-600/10 dark:ring-rose-400/20 whitespace-nowrap">
                                  <AlertTriangle className="w-3 h-3" /> {s.primary_flag}
                                </span>
                              </td>
                              <td className="px-4 py-2.5 text-center"><BandPill band={s.current_band} /></td>
                              <td className="px-4 py-2.5 text-center text-xs tabular-nums text-slate-500 dark:text-slate-400 whitespace-nowrap">
                                {s.days_inactive === -1 ? 'Never' : s.days_inactive === 0 ? 'Today' : `${s.days_inactive}d`}
                              </td>
                              <td className="px-4 py-2.5 text-center">
                                {s.missed_ia_count > 0 ? (
                                  <span className="inline-flex items-center justify-center min-w-[1.5rem] text-xs font-bold tabular-nums text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-500/10 rounded-md px-1.5 py-0.5">{s.missed_ia_count}</span>
                                ) : (
                                  <span className="text-slate-300 dark:text-slate-600 text-xs">0</span>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    {/* Pagination */}
                    {riskPageCount > 1 && (
                      <div className="flex items-center justify-between px-5 sm:px-6 py-3 border-t border-slate-100 dark:border-white/[0.06]">
                        <span className="text-xs tabular-nums text-slate-400 dark:text-slate-500">
                          {riskPage * RISK_PAGE_SIZE + 1}–{Math.min((riskPage + 1) * RISK_PAGE_SIZE, atRisk.length)} of {atRisk.length}
                        </span>

                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => setRiskPage(p => p - 1)}
                            disabled={!riskHasPrev}
                            aria-label="Previous page"
                            className={`h-8 w-8 rounded-full flex items-center justify-center transition-all ${
                              riskHasPrev
                                ? 'bg-slate-100 dark:bg-white/[0.06] text-slate-600 dark:text-slate-300 hover:bg-brand-teal-100 dark:hover:bg-brand-teal-500/20 hover:text-brand-teal-600 dark:hover:text-brand-teal-400'
                                : 'text-slate-300 dark:text-slate-700 cursor-not-allowed'
                            }`}
                          >
                            <ChevronLeft className="w-4 h-4" />
                          </button>

                          <div className="flex items-center gap-1.5">
                            {riskPageCount <= 7 ? (
                              Array.from({ length: riskPageCount }, (_, i) => (
                                <button
                                  key={i}
                                  onClick={() => setRiskPage(i)}
                                  aria-label={`Page ${i + 1}`}
                                  className={`rounded-full transition-all ${
                                    i === riskPage
                                      ? 'h-2 w-5 bg-brand-teal-500'
                                      : 'h-2 w-2 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600'
                                  }`}
                                />
                              ))
                            ) : (
                              <span className="text-xs font-semibold tabular-nums text-slate-500 dark:text-slate-400">
                                {riskPage + 1} / {riskPageCount}
                              </span>
                            )}
                          </div>

                          <button
                            onClick={() => setRiskPage(p => p + 1)}
                            disabled={!riskHasNext}
                            aria-label="Next page"
                            className={`h-8 w-8 rounded-full flex items-center justify-center transition-all ${
                              riskHasNext
                                ? 'bg-slate-100 dark:bg-white/[0.06] text-slate-600 dark:text-slate-300 hover:bg-brand-teal-100 dark:hover:bg-brand-teal-500/20 hover:text-brand-teal-600 dark:hover:text-brand-teal-400'
                                : 'text-slate-300 dark:text-slate-700 cursor-not-allowed'
                            }`}
                          >
                            <ChevronRight className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    )}
                    </>
                  )}
                </div>

                {/* ── Quick Nav ───────────────────────────────────────────── */}
                <div className="mt-6 grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 pb-4">
                  {[
                    { label: 'Batch Insights', sub: 'All batches & health', path: '/institute-owner/insight', icon: BookOpen },
                    { label: 'All Students', sub: 'Cross-batch view', path: '/institute-owner/insight', icon: Users },
                    { label: 'Assessments', sub: 'IA / Mock / Diagnostic', path: '/institute-owner/performance', icon: BarChart2 },
                    { label: 'Analytics', sub: 'Trends & comparisons', path: '/institute-owner/performance', icon: TrendingUp },
                  ].map(n => (
                    <button
                      key={n.label}
                      onClick={() => navigate(n.path)}
                      className="group relative rounded-2xl bg-white dark:bg-[#131318] border border-slate-200/70 dark:border-white/[0.08] p-4 shadow-sm text-left transition-all duration-300 hover:-translate-y-1 hover:shadow-md hover:border-brand-teal-300/70 dark:hover:border-brand-teal-500/40"
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className="w-9 h-9 rounded-xl bg-brand-teal-50 dark:bg-brand-teal-500/10 text-brand-teal-600 dark:text-brand-teal-400 flex items-center justify-center transition-transform duration-300 group-hover:scale-110">
                          <n.icon className="w-4 h-4" />
                        </div>
                        <ArrowUpRight className="w-4 h-4 text-slate-300 dark:text-slate-600 opacity-0 -translate-x-1 translate-y-1 transition-all duration-300 group-hover:opacity-100 group-hover:translate-x-0 group-hover:translate-y-0 group-hover:text-brand-teal-500" />
                      </div>
                      <p className="font-semibold text-sm text-slate-800 dark:text-white group-hover:text-brand-teal-600 dark:group-hover:text-brand-teal-400 transition-colors">{n.label}</p>
                      <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">{n.sub}</p>
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