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
  ACTIVE: { text: "text-emerald-600", badge: "bg-emerald-50 text-emerald-700 ring-emerald-600/20" },
  INACTIVE: { text: "text-brand-text-mute", badge: "bg-brand-bg-alt text-brand-text-mute ring-brand-line" },
  COMPLETED: { text: "text-sky-600", badge: "bg-sky-50 text-sky-700 ring-sky-600/20" },
};

// ─── Skeletons ────────────────────────────────────────────────────────────────

function StatsSkeleton() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
      {[1, 2, 3, 4].map(i => (
        <div key={i} className="bg-white border border-brand-line rounded-2xl p-4 sm:p-5 shadow-sm animate-pulse">
          <div className="h-3 w-24 bg-brand-bg-alt rounded mb-4"></div>
          <div className="h-8 w-16 bg-brand-bg-alt rounded mb-3"></div>
          <div className="h-3 w-32 bg-brand-bg-alt rounded"></div>
        </div>
      ))}
    </div>
  );
}

function BatchRowSkeleton() {
  return (
    <div className="bg-white border border-brand-line rounded-2xl p-4 sm:p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6 animate-pulse">
      {/* Left Column */}
      <div className="md:w-1/4 space-y-3">
        <div className="flex items-center gap-2">
          <div className="h-6 w-3/4 bg-brand-bg-alt rounded"></div>
          <div className="h-4 w-16 bg-brand-bg-alt rounded-full"></div>
        </div>
        <div className="h-4 w-1/2 bg-brand-bg-alt rounded"></div>
        <div className="h-3 w-full bg-brand-bg-alt rounded"></div>
      </div>

      {/* Middle Columns */}
      <div className="flex-1 grid grid-cols-2 sm:grid-cols-3 gap-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="space-y-2">
            <div className="h-3 w-16 bg-brand-bg-alt rounded md:mx-0"></div>
            <div className="h-6 w-12 bg-brand-bg-alt rounded md:mx-0"></div>
          </div>
        ))}
      </div>

      {/* Right Column */}
      <div className="w-full md:w-48 pt-4 md:pt-0 border-t md:border-t-0 border-brand-line flex items-center gap-4">
        <div className="flex-1 space-y-3">
          <div className="flex justify-between">
            <div className="h-4 w-16 bg-brand-bg-alt rounded"></div>
            <div className="h-4 w-12 bg-brand-bg-alt rounded"></div>
          </div>
          <div className="w-full h-1.5 bg-brand-bg-alt rounded-full"></div>
          <div className="h-3 w-16 bg-brand-bg-alt rounded ml-auto"></div>
        </div>
        <div className="w-8 h-8 bg-brand-bg-alt rounded-full shrink-0"></div>
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
    { title: 'Total Batches',   value: String(batches.length),                                    subtext: 'Across institute',                          icon: BookOpen,      accent: 'bg-brand-blue-50 text-brand-blue-600' },
    { title: 'Total Students',  value: String(summary?.total_students ?? '—'),                    subtext: `${summary?.active_today ?? 0} active today`, icon: Users,         accent: 'bg-brand-teal-50 text-brand-teal-600' },
    { title: 'Avg Band Score',  value: summary?.avg_band != null ? summary.avg_band.toFixed(1) : '—', subtext: 'Across all students',                   icon: BarChart2,     accent: 'bg-emerald-50 text-emerald-600' },
    { title: 'At Risk',         value: String(summary?.at_risk_count ?? '—'),                     subtext: `IA completion: ${iaCompRate}% (7d)`,        icon: AlertTriangle, accent: 'bg-rose-50 text-rose-600' },
  ];

  return (
    <div className="relative min-h-screen font-plex antialiased overflow-x-hidden bg-brand-bg text-brand-text">

      {/* Sidebar */}
      <InstituteOwnerSidebar
        activeTab="batches"
        isCollapsed={isSidebarCollapsed}
        toggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
      />

      {/* Main Layout Wrapper */}
      <div className={`relative z-10 transition-all duration-300 ${isSidebarCollapsed ? 'lg:pl-24' : 'lg:pl-72'}`}>

        {/* Topbar */}
        <InstituteOwnerTopbar />

        {/* Main Content */}
        <main className="px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-8 max-w-[90rem] mx-auto pb-16">

            {/* ── Hero Banner ─────────────────────────────────────────────── */}
            <section className="relative overflow-hidden rounded-2xl sm:rounded-3xl border border-brand-line-16 bg-brand-ink-deep text-white px-5 sm:px-8 pt-6 sm:pt-8 pb-6 sm:pb-8 shadow-sm">
              <div className="relative">
                <span className="inline-flex items-center gap-1.5 font-jetbrains text-[10px] font-bold uppercase tracking-[0.2em] text-brand-teal-300 bg-brand-teal-500/10 border border-brand-teal-500/25 px-2.5 py-1 rounded-full">
                  <Sparkles className="w-3 h-3" /> Owner Portal
                </span>
                <h1 className="mt-3 font-manrope text-2xl sm:text-3xl font-black tracking-tight text-white">
                  Batch <span className="text-brand-mint">Insights</span>
                </h1>
                <p className="mt-1.5 text-sm text-brand-on-ink">
                  Overview of all your institute batches. Click a batch to view detailed analytics.
                </p>
              </div>
            </section>

            {/* ── Content ─────────────────────────────────────────────────── */}
            <div className="relative z-10 space-y-6">
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
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                    {topMetrics.map((metric, idx) => (
                      <div key={idx} className="group rounded-2xl bg-white border border-brand-line p-4 sm:p-5 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-300">
                        <div className="flex items-start justify-between gap-2 mb-3 sm:mb-4">
                          <p className="font-jetbrains text-[10px] font-bold uppercase tracking-wider text-brand-text-mute pt-1">{metric.title}</p>
                          <div className={`w-9 h-9 shrink-0 rounded-xl flex items-center justify-center ${metric.accent}`}>
                            <metric.icon className="w-4 h-4" />
                          </div>
                        </div>
                        <h2 className="text-2xl sm:text-3xl font-black tracking-tight tabular-nums text-brand-text">{metric.value}</h2>
                        <p className="text-xs text-brand-text-mute mt-1.5 truncate">{metric.subtext}</p>
                      </div>
                    ))}
                  </div>

                  {/* Batch List */}
                  {batches.length === 0 ? (
                    <div className="text-center py-16 rounded-2xl bg-white border border-brand-line shadow-sm text-brand-text-mute">
                      <p className="text-lg font-semibold text-brand-text">No batches found.</p>
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
                            className="bg-white border border-brand-line rounded-2xl p-4 sm:p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6 hover:border-brand-teal-300 hover:shadow-md hover:-translate-y-0.5 transition-all duration-300 cursor-pointer group"
                          >
                            {/* Left Column: Info */}
                            <div className="md:w-1/4 min-w-0">
                              <div className="flex flex-wrap items-center gap-2 mb-1">
                                <h3 className="text-lg sm:text-xl font-black tracking-tight text-brand-text group-hover:text-brand-teal-600 transition-colors">
                                  {batch.name}
                                </h3>
                                <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ring-1 ring-inset ${statusStyle.badge}`}>
                                  {batch.status}
                                </span>
                              </div>
                              <p className="text-sm text-brand-text-mute">
                                {instructorNames}
                              </p>
                            </div>

                            {/* Middle Columns: Metrics Grid */}
                            <div className="flex-1 grid grid-cols-2 sm:grid-cols-4 gap-4 text-center md:text-left">
                              <div>
                                <p className="font-jetbrains text-[10px] font-bold uppercase tracking-wider text-brand-text-mute mb-1">Students</p>
                                <p className="text-2xl font-black tabular-nums text-brand-text">{enrolled}</p>
                              </div>
                              <div>
                                <p className="font-jetbrains text-[10px] font-bold uppercase tracking-wider text-brand-text-mute mb-1">Avg Band</p>
                                <p className="text-2xl font-black tabular-nums text-brand-text">
                                  {avgBand !== null ? avgBand.toFixed(1) : '—'}
                                </p>
                              </div>
                              <div>
                                <p className="font-jetbrains text-[10px] font-bold uppercase tracking-wider text-brand-text-mute mb-1">Active Today</p>
                                <p className="text-2xl font-black tabular-nums text-brand-text">{batch.active_today ?? '—'}</p>
                              </div>
                              <div>
                                <p className="font-jetbrains text-[10px] font-bold uppercase tracking-wider text-brand-text-mute mb-1">At Risk</p>
                                <p className={`text-2xl font-black tabular-nums ${atRisk > 0 ? 'text-rose-600' : 'text-brand-text'}`}>{atRisk}</p>
                              </div>
                            </div>

                            {/* Right Column: Capacity + Arrow */}
                            <div className="w-full md:w-44 pt-4 md:pt-0 border-t md:border-t-0 border-brand-line flex items-center gap-4">
                              {capacityPercentage !== null ? (
                                <div className="flex-1">
                                  <div className="flex justify-between text-sm mb-2">
                                    <span className="text-brand-text-mute">Capacity</span>
                                    <span className="font-semibold tabular-nums text-brand-text">{enrolled}/{capacity}</span>
                                  </div>
                                  <div className="w-full bg-brand-bg-alt rounded-full h-1.5 mb-2 overflow-hidden">
                                    <div
                                      className="bg-gradient-to-r from-brand-teal-500 to-brand-blue-500 h-1.5 rounded-full transition-all"
                                      style={{ width: `${Math.min(100, capacityPercentage)}%` }}
                                    />
                                  </div>
                                  <p className="text-right text-[10px] tabular-nums text-brand-text-mute">{capacityPercentage}% filled</p>
                                </div>
                              ) : (
                                <div className="flex-1">
                                  <p className="text-sm text-brand-text-mute">Unlimited capacity</p>
                                  <p className="text-xs text-brand-text-mute">{enrolled} enrolled</p>
                                </div>
                              )}
                              <div className="h-10 w-10 rounded-full bg-brand-bg-alt group-hover:bg-brand-teal-50 flex items-center justify-center shrink-0 transition-colors">
                                <ChevronRight className="w-4 h-4 text-brand-text-mute group-hover:text-brand-teal-600 group-hover:translate-x-0.5 transition-all" />
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

        </main>
      </div>
    </div>
  );
}
