import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { InstituteOwnerSidebar } from '../components/InstitiuteOwnerSidebar';
import { InstituteOwnerTopbar } from '../components/InstituteOwnerTopbar';
import { callBackend } from '@/features/auth/services/authClient';
import { getBackendUrl } from '@/shared/utils';
import { ArrowLeft, Loader2, TrendingUp, TrendingDown, Users } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, BarChart, Bar, Legend } from 'recharts';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { useToast } from '@/shared/hooks/use-toast';

export default function BatchAnalyticsView() {
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const { user, profile } = useAuth();
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

  return (
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-[#0a0a0a] font-sans text-slate-900 dark:text-white transition-colors duration-300">
      
      {/* Sidebar - conditionally render based on role or just use owner sidebar for now. 
          Assuming this is primarily accessed via Institute Owner but could be adapted */}
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
                <div className="flex items-center justify-center py-20">
                    <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
                </div>
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
                        <h3 className="text-lg font-bold mb-4">Speaking Fluency & Confidence</h3>
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
                                    <Line type="monotone" dataKey="confidence" stroke="#ec4899" strokeWidth={3} dot={{ r: 4, fill: '#ec4899' }} name="Confidence" />
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
                                    <th className="px-6 py-4 font-medium">Current Band</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-200 dark:divide-[#27272a]">
                                {data.studentComparison.map((student: any) => (
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
                                        <td className="px-6 py-4">
                                            <span className="inline-flex px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs">
                                                {student.overallGrade}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
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
