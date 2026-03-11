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

// ─── Static overview metrics (kept as demo) ────────────────────────────────────
const topMetrics = [
  { title: "Total Batches", value: "—", subtext: "Across institute", subtextColor: "text-slate-500 dark:text-gray-500" },
  { title: "Total Students", value: "—", subtext: "Across all batches", subtextColor: "text-slate-500 dark:text-gray-500" },
  { title: "Avg Attendance", value: "90%", subtext: "This month", subtextColor: "text-slate-500 dark:text-gray-500" },
  { title: "Avg Improvement", value: "15%", subtext: "Score delta", subtextColor: "text-slate-500 dark:text-gray-500" },
];

// Map API status to colours
const STATUS = {
  ACTIVE: { text: "text-emerald-600 dark:text-emerald-400", badge: "bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400" },
  INACTIVE: { text: "text-slate-500 dark:text-gray-400", badge: "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300" },
  COMPLETED: { text: "text-blue-600 dark:text-blue-400", badge: "bg-blue-50 dark:bg-blue-500/10 text-blue-700 dark:text-blue-400" },
};

export default function BatchInsight() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [loading, setLoading] = useState(true);
  const [batches, setBatches] = useState<any[]>([]);

  const loadBatches = useCallback(async () => {
    setLoading(true);
    try {
      const res = await callBackend(`${getBackendUrl()}/api/institute-admin/batches`);
      setBatches(res.data || []);
    } catch (err: any) {
      toast({ title: 'Failed to load batches', description: err.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => { loadBatches(); }, [loadBatches]);

  // Derived metrics from real data
  const totalStudents = batches.reduce((sum, b) => sum + (b.studentCount ?? 0), 0);
  const dynamicMetrics = [
    ...topMetrics.slice(0, 2).map((m, i) => 
      i === 0 ? { ...m, value: String(batches.length) }
              : { ...m, value: String(totalStudents) }
    ),
    ...topMetrics.slice(2),
  ];

  return (
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-[#0a0a0a] font-sans text-slate-900 dark:text-white transition-colors duration-300">
      
      {/* Sidebar */}
      <div className="hidden lg:block">
        <InstituteOwnerSidebar 
          activeTab="insight"
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
            
            {/* Top Metric Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {dynamicMetrics.map((metric, idx) => (
                <div key={idx} className="bg-white dark:bg-[#121214] border border-slate-200 dark:border-[#27272a] rounded-xl p-5 shadow-sm">
                  <p className="text-slate-500 dark:text-gray-400 text-sm mb-1">{metric.title}</p>
                  <h2 className="text-4xl font-bold mb-2">{metric.value}</h2>
                  <p className={`text-xs ${metric.subtextColor}`}>{metric.subtext}</p>
                </div>
              ))}
            </div>

            {/* Batch List */}
            {loading ? (
              <div className="flex items-center justify-center py-20">
                <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
              </div>
            ) : batches.length === 0 ? (
              <div className="text-center py-16 text-slate-500">
                <p className="text-lg font-medium">No batches found.</p>
                <p className="text-sm mt-1">Create batches from the Admin portal to see them here.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {batches.map((batch) => {
                  const capacity = batch.maxStudents;
                  const enrolled = batch.studentCount ?? 0;
                  const capacityPercentage = capacity ? Math.round((enrolled / capacity) * 100) : null;
                  const statusStyle = STATUS[batch.status as keyof typeof STATUS] ?? STATUS.ACTIVE;
                  const instructorNames = batch.instructors?.map((i: any) => i.name).join(', ') || 'Unassigned';

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
                          Tutor: {instructorNames}
                        </p>
                        {batch.description && (
                          <p className="text-xs text-slate-400 mt-1 line-clamp-1">{batch.description}</p>
                        )}
                      </div>

                      {/* Middle Columns: Metrics Grid */}
                      <div className="flex-1 grid grid-cols-2 sm:grid-cols-3 gap-4 text-center md:text-left">
                        <div>
                          <p className="text-xs text-slate-500 dark:text-gray-500 mb-1">Students</p>
                          <p className="text-2xl font-bold text-slate-900 dark:text-white">{enrolled}</p>
                        </div>
                        <div>
                          <p className="text-xs text-slate-500 dark:text-gray-500 mb-1">Instructors</p>
                          <p className="text-2xl font-bold text-slate-900 dark:text-white">{batch.instructorCount ?? 0}</p>
                        </div>
                        <div>
                          <p className="text-xs text-slate-500 dark:text-gray-500 mb-1">Status</p>
                          <p className={`text-lg font-bold ${statusStyle.text}`}>{batch.status}</p>
                        </div>
                      </div>

                      {/* Right Column: Capacity + Arrow */}
                      <div className="md:w-48 pt-4 md:pt-0 border-t md:border-t-0 border-slate-100 dark:border-[#27272a] flex items-center gap-4">
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

          </div>
        </main>
      </div>
    </div>
  );
}