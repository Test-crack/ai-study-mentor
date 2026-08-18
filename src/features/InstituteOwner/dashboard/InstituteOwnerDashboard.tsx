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
  if (band === null) return <span className="text-brand-text-mute text-sm">—</span>;
  const color = band >= 7 ? 'bg-emerald-50 text-emerald-700 ring-emerald-600/20'
    : band >= 6 ? 'bg-brand-blue-50 text-brand-blue-600 ring-brand-blue-600/20'
    : 'bg-amber-50 text-amber-700 ring-amber-600/20';
  return (
    <span className={`inline-flex items-center justify-center text-xs font-bold tabular-nums px-2.5 py-0.5 rounded-full ring-1 ring-inset ${color}`}>
      {band.toFixed(1)}
    </span>
  );
}

function TrendIcon({ trend }: { trend: 'up' | 'flat' | 'down' | null }) {
  if (trend === 'up') return <TrendingUp className="w-3.5 h-3.5 text-emerald-500" />;
  if (trend === 'down') return <TrendingDown className="w-3.5 h-3.5 text-rose-500" />;
  if (trend === 'flat') return <Minus className="w-3.5 h-3.5 text-brand-text-mute" />;
  return null;
}

function KpiCard({ label, value, sub, icon: Icon, accent }: {
  label: string; value: string | number; sub?: string;
  icon: React.ElementType; accent: string;
}) {
  return (
    <div className="group relative rounded-2xl bg-white border border-brand-line p-4 sm:p-5 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-300">
      <div className="flex items-start justify-between gap-2 mb-3 sm:mb-4">
        <p className="font-jetbrains text-[10px] sm:text-[11px] font-bold uppercase tracking-[0.15em] text-brand-text-mute pt-1">{label}</p>
        <div className={`w-10 h-10 shrink-0 rounded-xl flex items-center justify-center ${accent}`}>
          <Icon className="w-4 h-4" />
        </div>
      </div>
      <p className="text-2xl sm:text-3xl font-bold tracking-tight tabular-nums text-brand-text">{value}</p>
      {sub && <p className="text-xs text-brand-text-mute mt-1.5 truncate">{sub}</p>}
    </div>
  );
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function DashboardSkeleton() {
  return (
    <div className="animate-pulse">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="h-28 rounded-2xl bg-white border border-brand-line p-5">
            <div className="h-3 w-20 bg-brand-bg-alt rounded mb-4" />
            <div className="h-7 w-14 bg-brand-bg-alt rounded" />
          </div>
        ))}
      </div>
      <div className="mt-6 h-20 rounded-2xl bg-white border border-brand-line" />
      <div className="mt-6 h-72 rounded-2xl bg-white border border-brand-line" />
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
    <div className="relative min-h-screen font-plex antialiased overflow-x-hidden bg-brand-bg text-brand-text">
      <InstituteOwnerSidebar
        activeTab="owner-dashboard"
        isCollapsed={isSidebarCollapsed}
        toggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
      />

      <div className={`relative z-10 transition-all duration-300 ${isSidebarCollapsed ? 'lg:pl-24' : 'lg:pl-72'}`}>
        <InstituteOwnerTopbar />

        <main className="px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6 max-w-[90rem] mx-auto pb-16">
          <div>

            {/* ── Hero Banner ─────────────────────────────────────────────── */}
            <section className="relative overflow-hidden rounded-2xl sm:rounded-3xl border border-brand-line-16 bg-brand-ink-deep text-white p-6 sm:p-8 shadow-sm">
              <div className="relative flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                <div className="min-w-0">
                  <span className="font-jetbrains inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.2em] text-brand-on-ink-mute bg-white/5 border border-brand-line-12 px-2.5 py-1 rounded-full">
                    Owner Portal
                  </span>
                  <h1 className="font-manrope mt-3 text-2xl sm:text-3xl font-black tracking-tight text-white">
                    {summary?.institute_name
                      ? <>Great to see you, <span className="text-brand-mint">{summary.institute_name}</span></>
                      : 'Institute Dashboard'}
                  </h1>
                  <p className="mt-1.5 text-sm text-brand-on-ink">
                    Live operational overview across all batches
                  </p>
                </div>

                <button
                  onClick={load}
                  disabled={loading}
                  className="self-start shrink-0 inline-flex items-center gap-1.5 min-h-[40px] text-xs font-bold text-brand-on-ink bg-white/5 hover:bg-white/10 border border-brand-line-12 px-4 py-2 rounded-full transition-all disabled:opacity-60"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} /> Refresh
                </button>
              </div>
            </section>

            {loading ? <div className="mt-6"><DashboardSkeleton /></div> : (
              <>
                {/* ── KPI Row ──────────────────────────────────────────────── */}
                <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                  <KpiCard
                    label="Total Students" icon={Users}
                    value={summary?.total_students ?? 0}
                    sub={`${summary?.active_today ?? 0} active today`}
                    accent="bg-brand-teal-50 text-brand-teal-600"
                  />
                  <KpiCard
                    label="Total Batches" icon={BookOpen}
                    value={summary?.total_batches ?? 0}
                    sub={`${summary?.admins_count ?? 0} admin${(summary?.admins_count ?? 0) !== 1 ? 's' : ''}`}
                    accent="bg-brand-blue-50 text-brand-blue-600"
                  />
                  <KpiCard
                    label="Avg Band Score" icon={BarChart2}
                    value={summary?.avg_band !== null && summary?.avg_band !== undefined ? summary.avg_band.toFixed(1) : '—'}
                    sub={`${summary?.mock_completed_this_month ?? 0} mocks this month`}
                    accent="bg-emerald-50 text-emerald-600"
                  />
                  <KpiCard
                    label="At Risk" icon={AlertTriangle}
                    value={summary?.at_risk_count ?? 0}
                    sub={`IA completion: ${iaCompRate}% (7d)`}
                    accent="bg-rose-50 text-rose-600"
                  />
                </div>

                {/* ── Secondary Stats (tinted strip, distinct from KPIs) ──── */}
                <div className="mt-6 rounded-2xl border border-brand-line bg-brand-bg-alt overflow-hidden">
                  <div className="grid grid-cols-1 sm:grid-cols-3 divide-y sm:divide-y-0 sm:divide-x divide-brand-line">
                    <div className="flex items-center gap-4 px-4 sm:px-6 py-4">
                      <div className="w-10 h-10 shrink-0 rounded-xl bg-brand-blue-50 text-brand-blue-600 flex items-center justify-center">
                        <Zap className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <p className="font-jetbrains text-[10px] font-bold uppercase tracking-[0.15em] text-brand-text-mute">Platform Unlocked Today</p>
                        <p className="text-xl font-bold tabular-nums text-brand-text">{summary?.platform_unlocked_today ?? 0}</p>
                        <p className="text-xs text-brand-text-mute">students completed 2+ drills</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-4 px-4 sm:px-6 py-4">
                      <div className="w-10 h-10 shrink-0 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center">
                        <CheckCircle2 className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <p className="font-jetbrains text-[10px] font-bold uppercase tracking-[0.15em] text-brand-text-mute">IAs Completed (7 days)</p>
                        <p className="text-xl font-bold tabular-nums text-brand-text">{summary?.ia_completion_last_7_days.completed ?? 0}</p>
                        <p className="text-xs text-brand-text-mute">of {summary?.ia_completion_last_7_days.total_eligible ?? 0} eligible</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-4 px-4 sm:px-6 py-4">
                      <div className="w-10 h-10 shrink-0 rounded-xl bg-brand-teal-50 text-brand-teal-600 flex items-center justify-center">
                        <Target className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <p className="font-jetbrains text-[10px] font-bold uppercase tracking-[0.15em] text-brand-text-mute">Mocks Completed (month)</p>
                        <p className="text-xl font-bold tabular-nums text-brand-text">{summary?.mock_completed_this_month ?? 0}</p>
                        <p className="text-xs text-brand-text-mute">across all batches</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* ── At-Risk Students ────────────────────────────────────── */}
                <div className="mt-6 rounded-2xl bg-white border border-brand-line shadow-sm overflow-hidden">
                  <div className="flex items-center justify-between gap-3 px-4 sm:px-6 py-4 border-b border-brand-line">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-10 h-10 shrink-0 rounded-xl bg-rose-50 flex items-center justify-center">
                        <Flame className="w-4 h-4 text-rose-500" />
                      </div>
                      <div className="min-w-0">
                        <h2 className="font-bold text-sm sm:text-base text-brand-text leading-tight">At-Risk Students</h2>
                        <p className="text-xs text-brand-text-mute mt-0.5">Students needing immediate attention</p>
                      </div>
                    </div>
                    <button
                      onClick={() => navigate('/institute-owner/insight')}
                      className="shrink-0 text-xs font-bold text-brand-teal-600 flex items-center gap-1 hover:underline underline-offset-2 min-h-[40px]"
                    >
                      View all batches <ChevronRight className="w-3 h-3" />
                    </button>
                  </div>

                  {atRisk.length === 0 ? (
                    <div className="py-14 text-center text-brand-text-mute">
                      <div className="w-12 h-12 bg-emerald-50 rounded-2xl flex items-center justify-center mx-auto mb-3">
                        <TrendingUp className="w-6 h-6 text-emerald-500" />
                      </div>
                      <p className="font-semibold text-brand-text">All students are on track</p>
                      <p className="text-sm mt-1">No at-risk flags detected today</p>
                    </div>
                  ) : (
                    <>
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="font-jetbrains text-[10px] uppercase tracking-[0.15em] text-brand-text-mute border-b border-brand-line bg-brand-bg-alt">
                            <th className="px-4 sm:px-6 py-3 text-left font-bold">Student</th>
                            <th className="px-4 py-3 text-left font-bold">Batch</th>
                            <th className="px-4 py-3 text-left font-bold">Primary Flag</th>
                            <th className="px-4 py-3 text-center font-bold">Band</th>
                            <th className="px-4 py-3 text-center font-bold">Last Active</th>
                            <th className="px-4 py-3 text-center font-bold">Missed IAs</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-brand-line">
                          {riskPageRows.map(s => (
                            <tr
                              key={s.student_id}
                              className="hover:bg-brand-bg-alt cursor-pointer transition-colors"
                              onClick={() => navigate(`/institute-owner/students/${toSlug(s.name)}/progress`, { state: { studentId: s.user_id } })}
                            >
                              <td className="px-4 sm:px-6 py-3">
                                <div className="flex items-center gap-2.5">
                                  {s.avatar ? (
                                    <img src={s.avatar} className="w-8 h-8 rounded-full object-cover ring-1 ring-brand-line" alt="" />
                                  ) : (
                                    <div className="w-8 h-8 rounded-full bg-brand-teal-50 flex items-center justify-center text-xs font-bold text-brand-teal-600 ring-1 ring-brand-teal-200">
                                      {s.name[0]}
                                    </div>
                                  )}
                                  <span className="font-medium text-[13px] text-brand-text whitespace-nowrap">{s.name}</span>
                                </div>
                              </td>
                              <td className="px-4 py-3 text-brand-text-mute text-xs whitespace-nowrap">{s.batch_name}</td>
                              <td className="px-4 py-3">
                                <span className="inline-flex items-center gap-1 text-[11px] font-medium bg-rose-50 text-rose-700 px-2 py-0.5 rounded-full ring-1 ring-inset ring-rose-600/10 whitespace-nowrap">
                                  <AlertTriangle className="w-3 h-3" /> {s.primary_flag}
                                </span>
                              </td>
                              <td className="px-4 py-3 text-center"><BandPill band={s.current_band} /></td>
                              <td className="px-4 py-3 text-center text-xs tabular-nums text-brand-text-mute whitespace-nowrap">
                                {s.days_inactive === -1 ? 'Never' : s.days_inactive === 0 ? 'Today' : `${s.days_inactive}d`}
                              </td>
                              <td className="px-4 py-3 text-center">
                                {s.missed_ia_count > 0 ? (
                                  <span className="inline-flex items-center justify-center min-w-[1.5rem] text-xs font-bold tabular-nums text-rose-600 bg-rose-50 rounded-md px-1.5 py-0.5">{s.missed_ia_count}</span>
                                ) : (
                                  <span className="text-brand-text-mute text-xs">0</span>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    {/* Pagination */}
                    {riskPageCount > 1 && (
                      <div className="flex items-center justify-between px-4 sm:px-6 py-3 border-t border-brand-line">
                        <span className="font-jetbrains text-xs tabular-nums text-brand-text-mute">
                          {riskPage * RISK_PAGE_SIZE + 1}–{Math.min((riskPage + 1) * RISK_PAGE_SIZE, atRisk.length)} of {atRisk.length}
                        </span>

                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => setRiskPage(p => p - 1)}
                            disabled={!riskHasPrev}
                            aria-label="Previous page"
                            className={`h-10 w-10 rounded-full flex items-center justify-center transition-all ${
                              riskHasPrev
                                ? 'bg-brand-bg-alt text-brand-text hover:bg-brand-teal-50 hover:text-brand-teal-600'
                                : 'text-brand-text-mute cursor-not-allowed'
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
                                      : 'h-2 w-2 bg-brand-line hover:bg-brand-teal-200'
                                  }`}
                                />
                              ))
                            ) : (
                              <span className="font-jetbrains text-xs font-bold tabular-nums text-brand-text-mute">
                                {riskPage + 1} / {riskPageCount}
                              </span>
                            )}
                          </div>

                          <button
                            onClick={() => setRiskPage(p => p + 1)}
                            disabled={!riskHasNext}
                            aria-label="Next page"
                            className={`h-10 w-10 rounded-full flex items-center justify-center transition-all ${
                              riskHasNext
                                ? 'bg-brand-bg-alt text-brand-text hover:bg-brand-teal-50 hover:text-brand-teal-600'
                                : 'text-brand-text-mute cursor-not-allowed'
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
                <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 pb-4">
                  {[
                    { label: 'Batch Insights', sub: 'All batches & health', path: '/institute-owner/insight', icon: BookOpen },
                    { label: 'All Students', sub: 'Cross-batch view', path: '/institute-owner/insight', icon: Users },
                    { label: 'Assessments', sub: 'IA / Mock / Diagnostic', path: '/institute-owner/performance', icon: BarChart2 },
                    { label: 'Analytics', sub: 'Trends & comparisons', path: '/institute-owner/performance', icon: TrendingUp },
                  ].map(n => (
                    <button
                      key={n.label}
                      onClick={() => navigate(n.path)}
                      className="group relative rounded-2xl bg-white border border-brand-line p-4 sm:p-5 shadow-sm text-left transition-all duration-300 hover:-translate-y-1 hover:shadow-md hover:border-brand-teal-300"
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className="w-10 h-10 rounded-xl bg-brand-teal-50 text-brand-teal-600 flex items-center justify-center transition-transform duration-300 group-hover:scale-110">
                          <n.icon className="w-4 h-4" />
                        </div>
                        <ArrowUpRight className="w-4 h-4 text-brand-text-mute opacity-0 -translate-x-1 translate-y-1 transition-all duration-300 group-hover:opacity-100 group-hover:translate-x-0 group-hover:translate-y-0 group-hover:text-brand-teal-500" />
                      </div>
                      <p className="font-semibold text-sm text-brand-text group-hover:text-brand-teal-600 transition-colors">{n.label}</p>
                      <p className="text-xs text-brand-text-mute mt-0.5">{n.sub}</p>
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