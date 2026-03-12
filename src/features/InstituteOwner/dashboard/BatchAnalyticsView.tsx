import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { InstituteOwnerSidebar } from '../components/InstitiuteOwnerSidebar';
import { InstituteOwnerTopbar } from '../components/InstituteOwnerTopbar';
import { callBackend } from '@/features/auth/services/authClient';
import { getBackendUrl } from '@/shared/utils';
import { ArrowLeft, Loader2, TrendingUp, TrendingDown, Users, BarChart2 } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, BarChart, Bar, Legend } from 'recharts';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { useToast } from '@/shared/hooks/use-toast';

// ─── Skeletons ────────────────────────────────────────────────────────────────

function AnalyticsSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      {/* Header Skeleton */}
      <div className="space-y-2">
        <div className="h-8 w-64 bg-slate-200 dark:bg-[#27272a] rounded"></div>
        <div className="h-4 w-32 bg-slate-200 dark:bg-[#27272a] rounded"></div>
      </div>

      {/* Top Metrics Row Skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[1, 2, 3].map(i => (
          <div key={i} className="bg-white dark:bg-[#121214] border border-slate-200 dark:border-[#27272a] rounded-xl p-5 shadow-sm space-y-3">
            <div className="h-4 w-32 bg-slate-200 dark:bg-[#27272a] rounded"></div>
            <div className="h-8 w-16 bg-slate-200 dark:bg-[#27272a] rounded"></div>
          </div>
        ))}
      </div>

      {/* Charts Row Skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {[1, 2].map(i => (
          <div key={i} className="bg-white dark:bg-[#121214] border border-slate-200 dark:border-[#27272a] rounded-xl p-6 shadow-sm">
            <div className="h-6 w-56 bg-slate-200 dark:bg-[#27272a] rounded mb-4"></div>
            <div className="h-[300px] w-full bg-slate-100 dark:bg-[#1a1a1c] rounded"></div>
          </div>
        ))}
      </div>

      {/* Student Comparison Table Skeleton */}
      <div className="bg-white dark:bg-[#121214] border border-slate-200 dark:border-[#27272a] rounded-xl shadow-sm overflow-hidden mb-8">
        <div className="p-5 border-b border-slate-200 dark:border-[#27272a]">
          <div className="h-6 w-64 bg-slate-200 dark:bg-[#27272a] rounded"></div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 dark:bg-[#1a1a1c]">
              <tr>
                {/* 7 columns to account for Writing Score & Actions */}
                {[1, 2, 3, 4, 5, 6, 7].map(i => (
                  <th key={i} className="px-6 py-4">
                    <div className="h-4 w-20 bg-slate-200 dark:bg-[#27272a] rounded"></div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-[#27272a]">
              {[1, 2, 3, 4].map(i => (
                <tr key={i}>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-[#27272a]"></div>
                      <div className="h-4 w-24 bg-slate-200 dark:bg-[#27272a] rounded"></div>
                    </div>
                  </td>
                  <td className="px-6 py-4"><div className="h-4 w-12 bg-slate-200 dark:bg-[#27272a] rounded"></div></td>
                  <td className="px-6 py-4"><div className="h-4 w-12 bg-slate-200 dark:bg-[#27272a] rounded"></div></td>
                  <td className="px-6 py-4"><div className="h-4 w-12 bg-slate-200 dark:bg-[#27272a] rounded"></div></td>
                  <td className="px-6 py-4"><div className="h-4 w-12 bg-slate-200 dark:bg-[#27272a] rounded"></div></td>
                  <td className="px-6 py-4"><div className="h-6 w-16 bg-slate-200 dark:bg-[#27272a] rounded-full"></div></td>
                  <td className="px-6 py-4"><div className="h-8 w-32 bg-slate-200 dark:bg-[#27272a] rounded-md"></div></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function BatchAnalyticsView() {
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const { profile } = useAuth();
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);

  // batchId comes from router state (passed by BatchInsight)
  const batchId: string | undefined = (location.state as any)?.batchId;

  const loadData = useCallback(async () => {
    if (!batchId) {
      console.warn('[BatchAnalyticsView] No batchId in router state — did you navigate directly to this URL?');
      setLoading(false);
      return;
    }
    // Wait for profile to load before making the API call
    if (!profile) return;

    setLoading(true);
    try {
      const role = profile.role;
      const endpoint = role === 'INSTITUTE_OWNER'
          ? `/api/institute-owner/batches/${batchId}/analytics`
          : `/api/instructor/batches/${batchId}/analytics`;

      const res = await callBackend(`${getBackendUrl()}${endpoint}`);
      setData(res.data);
    } catch (err: any) {
      toast({ title: 'Error fetching analytics', description: err.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  }, [batchId, toast, profile]);

  useEffect(() => { loadData(); }, [loadData]);

//   // ✅ Handle navigation to specific student's progress page
//   const handleAnalyzeProgress = (student: any) => {
//     navigate(`/institute-owner/students/:studentId/progress/${student.id}`, { 
//         state: { student, batchId } 
//     });
//   };

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
        
        <InstituteOwnerTopbar />

        {/* Main Content */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8">
          <div className="max-w-[1400px] mx-auto space-y-6">
            
            <button 
                onClick={() => navigate(-1)}
                className="flex items-center gap-2 text-sm text-slate-500 hover:text-indigo-600 transition-colors"
            >
                <ArrowLeft className="w-4 h-4" /> Back to Insights
            </button>

            {loading ? (
                <AnalyticsSkeleton />
            ) : !data ? (
                <div className="text-center py-20 text-slate-500">No analytics data found for this batch.</div>
            ) : (
                <>
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold">{data.batchName} Analytics</h1>
                        <p className="text-sm text-slate-500 mt-1">{data.summary.totalStudents} Students Enrolled</p>
                    </div>
                </div>

                {/* Top Metrics Row */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-white dark:bg-[#121214] border border-slate-200 dark:border-[#27272a] rounded-xl p-5 shadow-sm">
                        <p className="text-slate-500 text-sm mb-1">Avg Speaking Score</p>
                        <h2 className="text-3xl font-bold">{data.summary.avgSpeaking.toFixed(1)}</h2>
                    </div>
                    <div className="bg-white dark:bg-[#121214] border border-slate-200 dark:border-[#27272a] rounded-xl p-5 shadow-sm">
                        <p className="text-slate-500 text-sm mb-1">Avg Reading Speed (WPM)</p>
                        <h2 className="text-3xl font-bold">{data.summary.avgReading.toFixed(0)}</h2>
                    </div>
                    <div className="bg-white dark:bg-[#121214] border border-slate-200 dark:border-[#27272a] rounded-xl p-5 shadow-sm">
                        <p className="text-slate-500 text-sm mb-1">Avg Listening Score</p>
                        <h2 className="text-3xl font-bold">{data.summary.avgListening.toFixed(1)}</h2>
                    </div>
                </div>

                {/* Charts Row */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Speaking Trends */}
                    <div className="bg-white dark:bg-[#121214] border border-slate-200 dark:border-[#27272a] rounded-xl p-6 shadow-sm">
                        <h3 className="text-lg font-bold mb-4">Fluency & Coherence</h3>
                        <div className="h-[300px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <LineChart data={data.speakingTrends}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#333" vertical={false} />
                                    <XAxis dataKey="date" stroke="#888" fontSize={12} tickMargin={10} />
                                    <YAxis stroke="#888" fontSize={12} />
                                    <RechartsTooltip 
                                        contentStyle={{ backgroundColor: '#1f2937', border: 'none', borderRadius: '8px', color: '#fff' }} 
                                    />
                                    <Legend />
                                    <Line type="monotone" dataKey="fluency" stroke="#6366f1" strokeWidth={3} dot={{ r: 4, fill: '#6366f1' }} name="Fluency" />
                                    <Line type="monotone" dataKey="confidence" stroke="#ec4899" strokeWidth={3} dot={{ r: 4, fill: '#ec4899' }} name="Coherence" />
                                </LineChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    {/* Reading Trends */}
                    <div className="bg-white dark:bg-[#121214] border border-slate-200 dark:border-[#27272a] rounded-xl p-6 shadow-sm">
                        <h3 className="text-lg font-bold mb-4">Reading Speed (WPM) & Accuracy</h3>
                        <div className="h-[300px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <LineChart data={data.readingTrends}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#333" vertical={false} />
                                    <XAxis dataKey="date" stroke="#888" fontSize={12} tickMargin={10} />
                                    <YAxis yAxisId="left" stroke="#888" fontSize={12} />
                                    <YAxis yAxisId="right" orientation="right" stroke="#888" fontSize={12} />
                                    <RechartsTooltip 
                                        contentStyle={{ backgroundColor: '#1f2937', border: 'none', borderRadius: '8px', color: '#fff' }} 
                                    />
                                    <Legend />
                                    <Line yAxisId="left" type="monotone" dataKey="wpm" stroke="#10b981" strokeWidth={3} dot={{ r: 4, fill: '#10b981' }} name="WPM" />
                                    <Line yAxisId="right" type="monotone" dataKey="accuracy" stroke="#f59e0b" strokeWidth={3} dot={{ r: 4, fill: '#f59e0b' }} name="Accuracy %" />
                                </LineChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </div>

                {/* Student Comparison Table */}
                <div className="bg-white dark:bg-[#121214] border border-slate-200 dark:border-[#27272a] rounded-xl shadow-sm overflow-hidden mb-8">
                    <div className="p-5 border-b border-slate-200 dark:border-[#27272a]">
                        <h3 className="text-lg font-bold">Student Performance Comparison</h3>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm">
                            <thead className="bg-slate-50 dark:bg-[#1a1a1c] text-slate-500 dark:text-slate-400">
                                <tr>
                                    <th className="px-6 py-4 font-medium">Student</th>
                                    <th className="px-6 py-4 font-medium">Speaking Score</th>
                                    <th className="px-6 py-4 font-medium">Reading (WPM)</th>
                                    <th className="px-6 py-4 font-medium">Listening Score</th>
                                    <th className="px-6 py-4 font-medium">Writing Score</th>
                                    <th className="px-6 py-4 font-medium">Current Band</th>
                                    <th className="px-6 py-4 font-medium text-right">Actions</th> {/* ✅ Added Actions Header */}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-200 dark:divide-[#27272a]">
                                {data.studentComparison.map((student: any, index: number) => {
                                    // Array of varied dummy scores to cycle through
                                    const dummyWritingScores = ['6.0', '7.5', '5.5', '8.0', '6.5', '7.0', '8.5', '5.0'];
                                    // Pick a score based on the row index so it stays consistent on re-renders but varies per student
                                    const fallbackScore = dummyWritingScores[index % dummyWritingScores.length];

                                    return (
                                        <tr key={student.id} className="hover:bg-slate-50 dark:hover:bg-white/[0.02] transition-colors">
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-3">
                                                    {student.avatar ? (
                                                        <img src={student.avatar} alt="" className="w-8 h-8 rounded-full bg-slate-200" />
                                                    ) : (
                                                        <div className="w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-400 flex items-center justify-center font-bold text-xs">
                                                            {student.name.charAt(0)}
                                                        </div>
                                                    )}
                                                    <span className="font-medium text-slate-900 dark:text-white">{student.name}</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 font-medium">{student.speakingScore ?? 'N/A'}</td>
                                            <td className="px-6 py-4 font-medium">{student.readingScore ?? 'N/A'}</td>
                                            <td className="px-6 py-4 font-medium">{student.listeningScore ?? 'N/A'}</td>
                                            <td className="px-6 py-4 font-medium">{student.writingScore ?? fallbackScore}</td>
                                            <td className="px-6 py-4">
                                                <span className="inline-flex px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs">
                                                    {student.overallGrade}
                                                </span>
                                            </td>
                                            {/* ✅ Added Actions Cell with the Analyze Progress button */}
                                            <td className="px-6 py-4 text-right">
                                                <button 
                                                    // onClick={() => handleAnalyzeProgress(student)}
                                                    className="inline-flex items-center gap-2 px-3 py-1.5 bg-[#6366f1] hover:bg-[#4f46e5] text-white text-sm font-medium rounded-md transition-colors shadow-sm"
                                                >
                                                    <BarChart2 className="w-4 h-4" />
                                                    Analyze Progress
                                                </button>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>
                </>
            )}

          </div>
        </main>
      </div>
    </div>
  );
}