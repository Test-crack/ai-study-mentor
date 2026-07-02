// src/features/InstituteOwner/dashboard/BatchInsight.tsx
import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertTriangle, Loader2, ChevronRight, Sparkles, Users, BookOpen, BarChart2 } from 'lucide-react';

// Utility: convert batch name to URL-friendly slug
const toSlug = (name: string) => name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

import { InstituteOwnerSidebar } from '../components/InstitiuteOwnerSidebar';
import { InstituteOwnerTopbar } from '../components/InstituteOwnerTopbar';
import { callBackend } from '@/features/auth/services/authClient';
import { getBackendUrl } from '@/shared/utils';
import { useToast } from '@/shared/hooks/use-toast';
import { fetchSummary, type InstituteSummary } from '../services/instituteOwnerService';


// Map API status to colours
const STATUS = {
  ACTIVE: { text: "text-emerald-600 dark:text-emerald-400", badge: "bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 ring-emerald-600/20 dark:ring-emerald-400/25" },
  INACTIVE: { text: "text-slate-500 dark:text-gray-400", badge: "bg-slate-100 dark:bg-white/[0.06] text-slate-600 dark:text-slate-300 ring-slate-400/20 dark:ring-white/10" },
  COMPLETED: { text: "text-blue-600 dark:text-blue-400", badge: "bg-blue-50 dark:bg-blue-500/10 text-blue-700 dark:text-blue-400 ring-blue-600/20 dark:ring-blue-400/25" },
};

// ─── Skeletons ────────────────────────────────────────────────────────────────

function StatsSkeleton() {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
      {[1, 2, 3, 4].map(i => (
        <div key={i} className="bg-white dark:bg-[#131318] border border-slate-200/70 dark:border-white/[0.08] rounded-2xl p-5 shadow-sm animate-pulse">
          <div className="h-3 w-24 bg-slate-200 dark:bg-[#27272a] rounded mb-4"></div>
          <div className="h-8 w-16 bg-slate-200 dark:bg-[#27272a] rounded mb-3"></div>
          <div className="h-3 w-32 bg-slate-200 dark:bg-[#27272a] rounded"></div>
        </div>
      ))}
    </div>
  );
}

function BatchRowSkeleton() {
  return (
    <div className="bg-white dark:bg-[#131318] border border-slate-200/70 dark:border-white/[0.08] rounded-2xl p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6 animate-pulse">
      {/* Left Column */}
      <div className="md:w-1/4 space-y-3">
        <div className="flex items-center gap-2">
          <div className="h-6 w-3/4 bg-slate-200 dark:bg-[#27272a] rounded"></div>
          <div className="h-4 w-16 bg-slate-200 dark:bg-[#27272a] rounded-full"></div>
        </div>
        <div className="h-4 w-1/2 bg-slate-200 dark:bg-[#27272a] rounded"></div>
        <div className="h-3 w-full bg-slate-200 dark:bg-[#27272a] rounded"></div>
      </div>

      {/* Middle Columns */}
      <div className="flex-1 grid grid-cols-2 sm:grid-cols-3 gap-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="space-y-2">
            <div className="h-3 w-16 bg-slate-200 dark:bg-[#27272a] rounded md:mx-0"></div>
            <div className="h-6 w-12 bg-slate-200 dark:bg-[#27272a] rounded md:mx-0"></div>
          </div>
        ))}
      </div>

      {/* Right Column */}
      <div className="md:w-48 pt-4 md:pt-0 border-t md:border-t-0 border-slate-100 dark:border-white/[0.06] flex items-center gap-4">
        <div className="flex-1 space-y-3">
          <div className="flex justify-between">
            <div className="h-4 w-16 bg-slate-200 dark:bg-[#27272a] rounded"></div>
            <div className="h-4 w-12 bg-slate-200 dark:bg-[#27272a] rounded"></div>
          </div>
          <div className="w-full h-1.5 bg-slate-200 dark:bg-[#27272a] rounded-full"></div>
          <div className="h-3 w-16 bg-slate-200 dark:bg-[#27272a] rounded ml-auto"></div>
        </div>
        <div className="w-8 h-8 bg-slate-200 dark:bg-[#27272a] rounded-full shrink-0"></div>
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function BatchInsight() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [loading, setLoading]   = useState(true);
  const [batches, setBatches]   = useState<any[]>([]);
  const [summary, setSummary]   = useState<InstituteSummary | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [batchRes, sumRes] = await Promise.all([
        callBackend(`${getBackendUrl()}/api/institute-owner/batches`),
        fetchSummary(),
      ]);
      setBatches(batchRes.data || []);
      setSummary(sumRes.data);
    } catch (err: any) {
      toast({ title: 'Failed to load batches', description: err.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => { load(); }, [load]);

  // KPI cards use institute-level summary (deduplicated — students in multiple batches count once)
  const iaCompRate = summary && summary.ia_completion_last_7_days.total_eligible > 0
    ? Math.round(summary.ia_completion_last_7_days.completed / summary.ia_completion_last_7_days.total_eligible * 100)
    : 0;

  const topMetrics = [
    { title: 'Total Batches',   value: String(batches.length),                                    subtext: 'Across institute',                          icon: BookOpen,      accent: 'bg-blue-100 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400' },
    { title: 'Total Students',  value: String(summary?.total_students ?? '—'),                    subtext: `${summary?.active_today ?? 0} active today`, icon: Users,         accent: 'bg-indigo-100 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400' },
    { title: 'Avg Band Score',  value: summary?.avg_band != null ? summary.avg_band.toFixed(1) : '—', subtext: 'Across all students',                   icon: BarChart2,     accent: 'bg-emerald-100 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' },
    { title: 'At Risk',         value: String(summary?.at_risk_count ?? '—'),                     subtext: `IA completion: ${iaCompRate}% (7d)`,        icon: AlertTriangle, accent: 'bg-rose-100 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400' },
  ];

  return (
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-[#0a0a0a] font-sans text-slate-900 dark:text-white transition-colors duration-300">
      
      {/* Sidebar */}
      <div className="hidden lg:block">
        <InstituteOwnerSidebar
          activeTab="batches"
          isCollapsed={isSidebarCollapsed} 
          toggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)} 
        />
      </div>

      {/* Main Layout Wrapper */}
      <div className={`transition-all duration-300 flex flex-col min-h-screen ${isSidebarCollapsed ? 'lg:pl-20' : 'lg:pl-64'}`}>
        
        {/* Topbar */}
        <InstituteOwnerTopbar />

        {/* Main Content */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8">
          <div className="max-w-[1400px] mx-auto">

            {/* ── Hero Banner ─────────────────────────────────────────────── */}
            <section className="relative overflow-hidden rounded-2xl sm:rounded-3xl border border-indigo-100/80 dark:border-white/[0.06] bg-gradient-to-r from-[#eff4ff] via-[#f4f1ff] to-[#f3f0ff] dark:from-[#111827] dark:via-[#161a38] dark:to-[#1e1b4b] px-5 sm:px-8 pt-6 sm:pt-8 pb-20 sm:pb-24 shadow-sm">
              <div aria-hidden className="pointer-events-none select-none absolute inset-0">
                <div className="absolute -top-20 -right-12 w-64 h-64 rounded-full bg-indigo-300/25 dark:bg-indigo-500/15 blur-3xl" />
                <div className="absolute -bottom-28 left-1/3 w-72 h-72 rounded-full bg-violet-300/20 dark:bg-violet-500/10 blur-3xl" />
                <div className="absolute top-8 -left-10 w-44 h-44 rounded-full bg-sky-300/20 dark:bg-sky-500/10 blur-3xl" />
              </div>

              <div className="relative">
                <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-indigo-600 dark:text-indigo-300 bg-white/60 dark:bg-white/[0.06] border border-white/70 dark:border-white/[0.08] backdrop-blur px-2.5 py-1 rounded-full">
                   Owner Portal
                </span>
                <h1 className="mt-3 text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
                  Batch <span className="text-indigo-600 dark:text-indigo-400">Insights</span>
                </h1>
                <p className="mt-1.5 text-sm text-slate-500 dark:text-slate-400">
                  Overview of all your institute batches. Click a batch to view detailed analytics.
                </p>
              </div>
            </section>

            {/* ── Content (overlaps hero) ─────────────────────────────────── */}
            <div className="relative z-10 -mt-12 sm:-mt-14 space-y-6">
              {loading ? (
                <>
                  <StatsSkeleton />
                  <div className="space-y-4">
                    <BatchRowSkeleton />
                    <BatchRowSkeleton />
                    <BatchRowSkeleton />
                  </div>
                </>
              ) : (
                <>
                  {/* Top Metric Cards */}
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                    {topMetrics.map((metric, idx) => (
                      <div key={idx} className="group rounded-2xl bg-white/85 dark:bg-[#131318]/90 backdrop-blur-xl border border-white/20 dark:border-white/[0.08] ring-1 ring-slate-900/[0.05] dark:ring-0 p-4 sm:p-5 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-300">
                        <div className="flex items-start justify-between gap-2 mb-3 sm:mb-4">
                          <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 pt-1">{metric.title}</p>
                          <div className={`w-9 h-9 shrink-0 rounded-xl flex items-center justify-center shadow-inner ${metric.accent}`}>
                            <metric.icon className="w-4 h-4" />
                          </div>
                        </div>
                        <h2 className="text-2xl sm:text-3xl font-bold tracking-tight tabular-nums text-slate-900 dark:text-white">{metric.value}</h2>
                        <p className="text-xs text-slate-400 dark:text-slate-500 mt-1.5 truncate">{metric.subtext}</p>
                      </div>
                    ))}
                  </div>

                  {/* Batch List */}
                  {batches.length === 0 ? (
                    <div className="text-center py-16 rounded-2xl bg-white dark:bg-[#131318] border border-slate-200/70 dark:border-white/[0.08] shadow-sm text-slate-500 dark:text-slate-400">
                      <p className="text-lg font-semibold text-slate-700 dark:text-slate-200">No batches found.</p>
                      <p className="text-sm mt-1">Create batches from the Admin portal to see them here.</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {batches.map((batch) => {
                        const enrolled = batch.student_count ?? 0;
                        const capacity = batch.max_students ?? null;
                        const capacityPercentage = batch.capacity_pct ?? (capacity ? Math.round((enrolled / capacity) * 100) : null);
                        const statusStyle = STATUS[(batch.status as string)?.toUpperCase() as keyof typeof STATUS] ?? STATUS.ACTIVE;
                        const instructorNames = batch.instructors?.length > 0
                          ? batch.instructors.map((i: any) => i.name).join(', ')
                          : 'No instructor assigned';
                        const atRisk = batch.at_risk_count ?? 0;
                        const avgBand = batch.avg_band as number | null;

                        return (
                          <div
                            key={batch.id}
                            onClick={() => navigate(`/institute-owner/batches/${toSlug(batch.name)}/analytics`, { state: { batchId: batch.id } })}
                            className="bg-white dark:bg-[#131318] border border-slate-200/70 dark:border-white/[0.08] rounded-2xl p-5 sm:p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6 hover:border-indigo-300/70 dark:hover:border-indigo-500/40 hover:shadow-md hover:-translate-y-0.5 transition-all duration-300 cursor-pointer group"
                          >
                            {/* Left Column: Info */}
                            <div className="md:w-1/4">
                              <div className="flex items-center gap-2 mb-1">
                                <h3 className="text-lg sm:text-xl font-bold tracking-tight text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                                  {batch.name}
                                </h3>
                                <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ring-1 ring-inset ${statusStyle.badge}`}>
                                  {batch.status}
                                </span>
                              </div>
                              <p className="text-sm text-slate-500 dark:text-slate-400">
                                {instructorNames}
                              </p>
                            </div>

                            {/* Middle Columns: Metrics Grid */}
                            <div className="flex-1 grid grid-cols-2 sm:grid-cols-4 gap-4 text-center md:text-left">
                              <div>
                                <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-1">Students</p>
                                <p className="text-2xl font-bold tabular-nums text-slate-900 dark:text-white">{enrolled}</p>
                              </div>
                              <div>
                                <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-1">Avg Band</p>
                                <p className="text-2xl font-bold tabular-nums text-slate-900 dark:text-white">
                                  {avgBand !== null ? avgBand.toFixed(1) : '—'}
                                </p>
                              </div>
                              <div>
                                <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-1">Active Today</p>
                                <p className="text-2xl font-bold tabular-nums text-slate-900 dark:text-white">{batch.active_today ?? '—'}</p>
                              </div>
                              <div>
                                <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-1">At Risk</p>
                                <p className={`text-2xl font-bold tabular-nums ${atRisk > 0 ? 'text-rose-600 dark:text-rose-400' : 'text-slate-900 dark:text-white'}`}>{atRisk}</p>
                              </div>
                            </div>

                            {/* Right Column: Capacity + Arrow */}
                            <div className="md:w-44 pt-4 md:pt-0 border-t md:border-t-0 border-slate-100 dark:border-white/[0.06] flex items-center gap-4">
                              {capacityPercentage !== null ? (
                                <div className="flex-1">
                                  <div className="flex justify-between text-sm mb-2">
                                    <span className="text-slate-500 dark:text-slate-400">Capacity</span>
                                    <span className="font-semibold tabular-nums text-slate-900 dark:text-white">{enrolled}/{capacity}</span>
                                  </div>
                                  <div className="w-full bg-slate-100 dark:bg-white/[0.06] rounded-full h-1.5 mb-2 overflow-hidden">
                                    <div
                                      className="bg-gradient-to-r from-indigo-500 to-violet-500 h-1.5 rounded-full transition-all"
                                      style={{ width: `${Math.min(100, capacityPercentage)}%` }}
                                    />
                                  </div>
                                  <p className="text-right text-[10px] tabular-nums text-slate-400 dark:text-slate-500">{capacityPercentage}% filled</p>
                                </div>
                              ) : (
                                <div className="flex-1">
                                  <p className="text-sm text-slate-500 dark:text-slate-400">Unlimited capacity</p>
                                  <p className="text-xs text-slate-400 dark:text-slate-500">{enrolled} enrolled</p>
                                </div>
                              )}
                              <div className="h-8 w-8 rounded-full bg-slate-50 dark:bg-white/[0.04] group-hover:bg-indigo-50 dark:group-hover:bg-indigo-500/15 flex items-center justify-center shrink-0 transition-colors">
                                <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-indigo-500 group-hover:translate-x-0.5 transition-all" />
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </>
              )}
            </div>

          </div>
        </main>
      </div>
    </div>
  );
}