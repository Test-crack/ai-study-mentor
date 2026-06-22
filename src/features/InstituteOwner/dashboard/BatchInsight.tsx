import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertTriangle, Loader2, ChevronRight } from 'lucide-react';

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
  ACTIVE: { text: "text-emerald-600 dark:text-emerald-400", badge: "bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400" },
  INACTIVE: { text: "text-slate-500 dark:text-gray-400", badge: "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300" },
  COMPLETED: { text: "text-blue-600 dark:text-blue-400", badge: "bg-blue-50 dark:bg-blue-500/10 text-blue-700 dark:text-blue-400" },
};

// ─── Skeletons ────────────────────────────────────────────────────────────────

function StatsSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {[1, 2, 3, 4].map(i => (
        <div key={i} className="bg-white dark:bg-[#121214] border border-slate-200 dark:border-[#27272a] rounded-xl p-5 shadow-sm animate-pulse">
          <div className="h-4 w-24 bg-slate-200 dark:bg-[#27272a] rounded mb-3"></div>
          <div className="h-8 w-16 bg-slate-200 dark:bg-[#27272a] rounded mb-3"></div>
          <div className="h-3 w-32 bg-slate-200 dark:bg-[#27272a] rounded"></div>
        </div>
      ))}
    </div>
  );
}

function BatchRowSkeleton() {
  return (
    <div className="bg-white dark:bg-[#121214] border border-slate-200 dark:border-[#27272a] rounded-xl p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6 animate-pulse">
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
      <div className="md:w-48 pt-4 md:pt-0 border-t md:border-t-0 border-slate-100 dark:border-[#27272a] flex items-center gap-4">
        <div className="flex-1 space-y-3">
          <div className="flex justify-between">
            <div className="h-4 w-16 bg-slate-200 dark:bg-[#27272a] rounded"></div>
            <div className="h-4 w-12 bg-slate-200 dark:bg-[#27272a] rounded"></div>
          </div>
          <div className="w-full h-1.5 bg-slate-200 dark:bg-[#27272a] rounded-full"></div>
          <div className="h-3 w-16 bg-slate-200 dark:bg-[#27272a] rounded ml-auto"></div>
        </div>
        <div className="w-5 h-5 bg-slate-200 dark:bg-[#27272a] rounded-full shrink-0"></div>
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
    { title: 'Total Batches',   value: String(batches.length),                                    subtext: 'Across institute' },
    { title: 'Total Students',  value: String(summary?.total_students ?? '—'),                    subtext: `${summary?.active_today ?? 0} active today` },
    { title: 'Avg Band Score',  value: summary?.avg_band != null ? summary.avg_band.toFixed(1) : '—', subtext: 'Across all students' },
    { title: 'At Risk',         value: String(summary?.at_risk_count ?? '—'),                     subtext: `IA completion: ${iaCompRate}% (7d)` },
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
          <div className="max-w-[1400px] mx-auto space-y-6">

            <div>
              <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Batch Insights</h1>
              <p className="text-sm text-slate-500 mt-1">Overview of all your institute batches. Click a batch to view detailed analytics.</p>
            </div>
            
            {/* Skeletons or Content */}
            {loading ? (
              <>
                <StatsSkeleton />
                <div className="space-y-4 mt-6">
                  <BatchRowSkeleton />
                  <BatchRowSkeleton />
                  <BatchRowSkeleton />
                </div>
              </>
            ) : (
              <>
                {/* Top Metric Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {topMetrics.map((metric, idx) => (
                    <div key={idx} className="bg-white dark:bg-[#121214] border border-slate-200 dark:border-[#27272a] rounded-xl p-5 shadow-sm">
                      <p className="text-slate-500 dark:text-gray-400 text-sm mb-1">{metric.title}</p>
                      <h2 className="text-4xl font-bold mb-2">{metric.value}</h2>
                      <p className="text-xs text-slate-500 dark:text-gray-500">{metric.subtext}</p>
                    </div>
                  ))}
                </div>

                {/* Batch List */}
                {batches.length === 0 ? (
                  <div className="text-center py-16 text-slate-500">
                    <p className="text-lg font-medium">No batches found.</p>
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
                          className="bg-white dark:bg-[#121214] border border-slate-200 dark:border-[#27272a] rounded-xl p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6 hover:border-indigo-300 dark:hover:border-indigo-700 hover:shadow-md transition-all cursor-pointer group"
                        >
                          {/* Left Column: Info */}
                          <div className="md:w-1/4">
                            <div className="flex items-center gap-2 mb-1">
                              <h3 className="text-xl font-bold text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                                {batch.name}
                              </h3>
                              <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${statusStyle.badge}`}>
                                {batch.status}
                              </span>
                            </div>
                            <p className="text-sm text-slate-500 dark:text-gray-400">
                              {instructorNames}
                            </p>
                          </div>

                          {/* Middle Columns: Metrics Grid */}
                          <div className="flex-1 grid grid-cols-2 sm:grid-cols-4 gap-4 text-center md:text-left">
                            <div>
                              <p className="text-xs text-slate-500 dark:text-gray-500 mb-1">Students</p>
                              <p className="text-2xl font-bold text-slate-900 dark:text-white">{enrolled}</p>
                            </div>
                            <div>
                              <p className="text-xs text-slate-500 dark:text-gray-500 mb-1">Avg Band</p>
                              <p className="text-2xl font-bold text-slate-900 dark:text-white">
                                {avgBand !== null ? avgBand.toFixed(1) : '—'}
                              </p>
                            </div>
                            <div>
                              <p className="text-xs text-slate-500 dark:text-gray-500 mb-1">Active Today</p>
                              <p className="text-2xl font-bold text-slate-900 dark:text-white">{batch.active_today ?? '—'}</p>
                            </div>
                            <div>
                              <p className="text-xs text-slate-500 dark:text-gray-500 mb-1">At Risk</p>
                              <p className={`text-2xl font-bold ${atRisk > 0 ? 'text-rose-600 dark:text-rose-400' : 'text-slate-900 dark:text-white'}`}>{atRisk}</p>
                            </div>
                          </div>

                          {/* Right Column: Capacity + Arrow */}
                          <div className="md:w-44 pt-4 md:pt-0 border-t md:border-t-0 border-slate-100 dark:border-[#27272a] flex items-center gap-4">
                            {capacityPercentage !== null ? (
                              <div className="flex-1">
                                <div className="flex justify-between text-sm mb-2">
                                  <span className="text-slate-500 dark:text-gray-400">Capacity</span>
                                  <span className="font-medium text-slate-900 dark:text-white">{enrolled}/{capacity}</span>
                                </div>
                                <div className="w-full bg-slate-100 dark:bg-gray-800 rounded-full h-1.5 mb-2">
                                  <div
                                    className="bg-indigo-600 dark:bg-purple-600 h-1.5 rounded-full transition-all"
                                    style={{ width: `${Math.min(100, capacityPercentage)}%` }}
                                  />
                                </div>
                                <p className="text-right text-[10px] text-slate-500 dark:text-gray-500">{capacityPercentage}% filled</p>
                              </div>
                            ) : (
                              <div className="flex-1">
                                <p className="text-sm text-slate-500">Unlimited capacity</p>
                                <p className="text-xs text-slate-400">{enrolled} enrolled</p>
                              </div>
                            )}
                            <ChevronRight className="w-5 h-5 text-slate-400 group-hover:text-indigo-500 transition-colors shrink-0" />
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