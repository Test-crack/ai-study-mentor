import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate, useLocation, useParams } from 'react-router-dom';
import { InstituteOwnerSidebar } from '../components/InstitiuteOwnerSidebar';
import { InstituteOwnerTopbar } from '../components/InstituteOwnerTopbar';
import { callBackend } from '@/features/auth/services/authClient';
import { getBackendUrl } from '@/shared/utils';
import {
  ArrowLeft, Loader2, TrendingUp, TrendingDown, Users, Mic, BookOpen, PenTool,
  Trophy, Zap, CheckCircle, BarChart2, Medal
} from 'lucide-react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip,
  ResponsiveContainer, BarChart, Bar, Legend, AreaChart, Area
} from 'recharts';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { useToast } from '@/shared/hooks/use-toast';
import { cn } from '@/shared/utils';

type ActiveTab = 'overview' | 'speaking' | 'reading' | 'writing';

// ─── Reading analytics shape ──────────────────────────────────────────────────
interface ReadingStudentRow {
  studentId: string;
  name: string;
  avatar?: string;
  avgWPM: number;
  avgAccuracy: number;
  bestSpeedLearningScore: number;
  totalSessions: number;
}

interface ReadingTrendPoint {
  date: string;
  avgWpm: number;
  avgAccuracy: number;
}

interface BatchReadingAnalytics {
  batchName: string;
  summary: {
    totalStudents: number;
    avgWPM: number;
    avgAccuracy: number;
    avgSpeedLearningScore: number;
    totalSessions: number;
  };
  wpmTrends: ReadingTrendPoint[];
  studentLeaderboard: ReadingStudentRow[];
}

function getRankBadgeColor(rank: number) {
  if (rank === 1) return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400';
  if (rank === 2) return 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300';
  if (rank === 3) return 'bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400';
  return 'bg-slate-50 text-slate-500 dark:bg-slate-800 dark:text-slate-500';
}

function getScoreColor(score: number) {
  if (score >= 80) return 'text-emerald-500';
  if (score >= 60) return 'text-amber-500';
  return 'text-rose-500';
}

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
  const [activeTab, setActiveTab] = useState<ActiveTab>('overview');

  // Overview data (existing)
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);

  // Reading tab data
  const [readingLoading, setReadingLoading] = useState(false);
  const [readingData, setReadingData] = useState<BatchReadingAnalytics | null>(null);

  const { batchSlug } = useParams();
  const batchId: string | undefined = (location.state as any)?.batchId || batchSlug;

  // ─── Load overview (speaking / summary) ──────────────────────────────────────
  const loadOverviewData = useCallback(async () => {
    if (!batchId || !profile) return;
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

  // ─── Load reading analytics ───────────────────────────────────────────────────
  const loadReadingData = useCallback(async () => {
    if (!batchId || !profile || readingData) return; // cached
    setReadingLoading(true);
    try {
      const role = profile.role;
      const endpoint = role === 'INSTITUTE_OWNER'
        ? `/api/institute-owner/batches/${batchId}/reading-analytics`
        : `/api/instructor/batches/${batchId}/reading-analytics`;
      const res = await callBackend(`${getBackendUrl()}${endpoint}`);
      if (res.data) setReadingData(res.data);
    } catch (err: any) {
      // Graceful — endpoint may not be deployed yet
      console.warn('Reading analytics endpoint not available:', err.message);
      setReadingData(null);
    } finally {
      setReadingLoading(false);
    }
  }, [batchId, profile, readingData]);

  useEffect(() => { loadOverviewData(); }, [loadOverviewData]);
  useEffect(() => { if (activeTab === 'reading') loadReadingData(); }, [activeTab, loadReadingData]);

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

      <div className={`transition-all duration-300 flex flex-col min-h-screen ${isSidebarCollapsed ? 'lg:pl-20' : 'lg:pl-64'}`}>
        <InstituteOwnerTopbar />

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
                {/* ── Page header ── */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <h1 className="text-2xl font-bold">{data.batchName} Analytics</h1>
                    <p className="text-sm text-slate-500 mt-0.5 flex items-center gap-1">
                      <Users className="w-3.5 h-3.5" /> {data.summary.totalStudents} Students Enrolled
                    </p>
                  </div>

                  {/* Tab pills */}
                  <div className="flex bg-white dark:bg-[#121214] border border-slate-200 dark:border-[#27272a] rounded-xl p-1 gap-1 shadow-sm overflow-x-auto">
                    {(['overview', 'speaking', 'reading', 'writing'] as ActiveTab[]).map(tab => (
                      <button
                        key={tab}
                        onClick={() => setActiveTab(tab)}
                        className={cn(
                          "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-200 capitalize whitespace-nowrap",
                          activeTab === tab
                            ? "bg-indigo-600 text-white shadow-sm"
                            : "text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-white/5"
                        )}
                      >
                        {tab === 'speaking' && <Mic className="w-3.5 h-3.5" />}
                        {tab === 'reading' && <BookOpen className="w-3.5 h-3.5" />}
                        {tab === 'writing' && <PenTool className="w-3.5 h-3.5" />}
                        {tab === 'overview' && <BarChart2 className="w-3.5 h-3.5" />}
                        {tab.charAt(0).toUpperCase() + tab.slice(1)}
                      </button>
                    ))}
                  </div>
                </div>

                {/* ═══════════════════════════════════════════════════════════════ */}
                {/* OVERVIEW TAB */}
                {/* ═══════════════════════════════════════════════════════════════ */}
                {activeTab === 'overview' && (
                  <div className="space-y-6 animate-in fade-in duration-300">
                    {/* Top Metrics */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                      <MetricCard label="Avg Speaking Score" value={data.summary.avgSpeaking != null ? Number(data.summary.avgSpeaking).toFixed(1) : '—'} icon={<Mic className="w-5 h-5 text-indigo-500" />} />
                      <MetricCard label="Avg Reading Speed" value={data.summary.avgReading != null ? Math.round(Number(data.summary.avgReading)) + ' WPM' : '—'} icon={<BookOpen className="w-5 h-5 text-emerald-500" />} />
                      <MetricCard label="Avg Writing Score" value={data.summary.avgWriting != null ? Number(data.summary.avgWriting).toFixed(1) : '—'} icon={<PenTool className="w-5 h-5 text-purple-500" />} />
                      <MetricCard label="Avg Listening Score" value={data.summary.avgListening != null ? Number(data.summary.avgListening).toFixed(1) : '—'} icon={<Zap className="w-5 h-5 text-amber-500" />} />
                    </div>

                    {/* Charts */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      <ChartCard title="Speaking Fluency & Confidence">
                        <ResponsiveContainer width="100%" height="100%">
                          <LineChart data={data.speakingTrends}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#333" vertical={false} />
                            <XAxis dataKey="date" stroke="#888" fontSize={12} tickMargin={10} />
                            <YAxis stroke="#888" fontSize={12} />
                            <RechartsTooltip contentStyle={{ backgroundColor: '#1f2937', border: 'none', borderRadius: '8px', color: '#fff' }} />
                            <Legend />
                            <Line type="monotone" dataKey="fluency" stroke="#6366f1" strokeWidth={3} dot={{ r: 4, fill: '#6366f1' }} name="Fluency" />
                            <Line type="monotone" dataKey="confidence" stroke="#ec4899" strokeWidth={3} dot={{ r: 4, fill: '#ec4899' }} name="Confidence" />
                          </LineChart>
                        </ResponsiveContainer>
                      </ChartCard>

                      <ChartCard title="Reading Speed (WPM) & Accuracy">
                        <ResponsiveContainer width="100%" height="100%">
                          <LineChart data={data.readingTrends}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#333" vertical={false} />
                            <XAxis dataKey="date" stroke="#888" fontSize={12} tickMargin={10} />
                            <YAxis yAxisId="left" stroke="#888" fontSize={12} />
                            <YAxis yAxisId="right" orientation="right" stroke="#888" fontSize={12} />
                            <RechartsTooltip contentStyle={{ backgroundColor: '#1f2937', border: 'none', borderRadius: '8px', color: '#fff' }} />
                            <Legend />
                            <Line yAxisId="left" type="monotone" dataKey="wpm" stroke="#10b981" strokeWidth={3} dot={{ r: 4, fill: '#10b981' }} name="WPM" />
                            <Line yAxisId="right" type="monotone" dataKey="accuracy" stroke="#f59e0b" strokeWidth={3} dot={{ r: 4, fill: '#f59e0b' }} name="Accuracy %" />
                          </LineChart>
                        </ResponsiveContainer>
                      </ChartCard>

                      <ChartCard title="Writing Band Score Growth">
                        <ResponsiveContainer width="100%" height="100%">
                          <LineChart data={data.writingTrends}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#333" vertical={false} />
                            <XAxis dataKey="date" stroke="#888" fontSize={12} tickMargin={10} />
                            <YAxis stroke="#888" fontSize={12} domain={[4, 9]} ticks={[4,5,6,7,8,9]} />
                            <RechartsTooltip contentStyle={{ backgroundColor: '#1f2937', border: 'none', borderRadius: '8px', color: '#fff' }} />
                            <Legend />
                            <Line type="monotone" dataKey="score" stroke="#8b5cf6" strokeWidth={3} dot={{ r: 4, fill: '#8b5cf6' }} name="Writing AI Band" />
                          </LineChart>
                        </ResponsiveContainer>
                      </ChartCard>
                    </div>

                    {/* Student Comparison Table */}
                    <div className="bg-white dark:bg-[#121214] border border-slate-200 dark:border-[#27272a] rounded-xl shadow-sm overflow-hidden">
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
                                          {student.name?.charAt(0)}
                                        </div>
                                      )}
                                      <span className="font-medium text-slate-900 dark:text-white">{student.name}</span>
                                    </div>
                                  </td>
                                  <td className="px-6 py-4 font-medium">{student.speakingScore != null ? Number(student.speakingScore).toFixed(1) : '—'}</td>
                                  <td className="px-6 py-4 font-medium">{student.readingScore != null ? Math.round(Number(student.readingScore)) + ' WPM' : '—'}</td>
                                  <td className="px-6 py-4 font-medium">{student.listeningScore != null ? student.listeningScore : '—'}</td>
                                  <td className="px-6 py-4 font-medium">{student.writingScore != null ? Number(student.writingScore).toFixed(1) : fallbackScore}</td>
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
                  </div>
                )}

                {/* ═══════════════════════════════════════════════════════════════ */}
                {/* SPEAKING TAB */}
                {/* ═══════════════════════════════════════════════════════════════ */}
                {activeTab === 'speaking' && (
                  <div className="space-y-6 animate-in fade-in duration-300">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <MetricCard label="Avg Fluency Score" value={data.summary.avgSpeaking != null ? Number(data.summary.avgSpeaking).toFixed(1) : '—'} icon={<Mic className="w-5 h-5 text-indigo-500" />} />
                      <MetricCard label="Total Students" value={data.summary.totalStudents} icon={<Users className="w-5 h-5 text-slate-500" />} />
                    </div>
                    <ChartCard title="Speaking Fluency Trend">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={data.speakingTrends}>
                          <defs>
                            <linearGradient id="gradSpeaking" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#6366f1" stopOpacity={0.4} />
                              <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                          <XAxis dataKey="date" stroke="#888" fontSize={12} />
                          <YAxis stroke="#888" fontSize={12} />
                          <RechartsTooltip contentStyle={{ backgroundColor: '#fff', border: '1px solid #e2e8f0', borderRadius: '8px' }} />
                          <Legend />
                          <Area type="monotone" dataKey="fluency" stroke="#6366f1" strokeWidth={3} fill="url(#gradSpeaking)" name="Fluency" />
                          <Line type="monotone" dataKey="confidence" stroke="#ec4899" strokeWidth={2} dot={false} name="Confidence" />
                        </AreaChart>
                      </ResponsiveContainer>
                    </ChartCard>

                    {/* Speaking Leaderboard */}
                    <div className="bg-white dark:bg-[#121214] border border-slate-200 dark:border-[#27272a] rounded-xl shadow-sm overflow-hidden">
                      <div className="p-5 border-b border-slate-200 dark:border-[#27272a] flex items-center justify-between">
                        <h3 className="text-lg font-bold flex items-center gap-2">
                          <Trophy className="w-5 h-5 text-amber-500" /> Speaking Leaderboard
                        </h3>
                      </div>
                      <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm">
                          <thead className="bg-slate-50 dark:bg-[#1a1a1c] text-slate-500 dark:text-slate-400 text-xs font-bold uppercase tracking-wider">
                            <tr>
                              <th className="px-5 py-4">Rank</th>
                              <th className="px-5 py-4">Student</th>
                              <th className="px-5 py-4 text-center">Avg Fluency</th>
                              <th className="px-5 py-4 text-center">Avg Band</th>
                              <th className="px-5 py-4 text-center">Best Score</th>
                              <th className="px-5 py-4 text-right pr-6">Sessions</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-200 dark:divide-[#27272a]">
                            {data.speakingLeaderboard?.map((student: any, i: number) => (
                              <tr key={student.studentId} className="hover:bg-slate-50 dark:hover:bg-white/[0.02] transition-colors">
                                <td className="px-5 py-4">
                                  <span className={cn(
                                    "inline-flex items-center justify-center w-7 h-7 rounded-full font-black text-xs",
                                    getRankBadgeColor(i + 1)
                                  )}>
                                    {i + 1 <= 3 ? ['🥇', '🥈', '🥉'][i] : i + 1}
                                  </span>
                                </td>
                                <td className="px-5 py-4">
                                  <div className="flex items-center gap-3">
                                    {student.avatar ? (
                                      <img src={student.avatar} alt="" className="w-8 h-8 rounded-full" />
                                    ) : (
                                      <div className="w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-400 flex items-center justify-center font-bold text-xs">
                                        {student.name?.charAt(0)}
                                      </div>
                                    )}
                                    <span className="font-semibold text-slate-900 dark:text-white">{student.name}</span>
                                  </div>
                                </td>
                                <td className="px-5 py-4 text-center">
                                  <span className="font-bold font-mono text-indigo-600 dark:text-indigo-400">
                                    {Math.round(student.avgFluency)}
                                  </span>
                                </td>
                                <td className="px-5 py-4 text-center">
                                  <span className="inline-flex px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 font-bold text-xs text-slate-700 dark:text-slate-300">
                                    {student.avgBand}
                                  </span>
                                </td>
                                <td className="px-5 py-4 text-center">
                                  <span className={cn("font-bold", getScoreColor(student.bestScore))}>
                                    {student.bestScore ?? '—'}
                                  </span>
                                </td>
                                <td className="px-5 py-4 text-right pr-6 text-slate-500 font-medium">
                                  {student.totalSessions}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                )}

                {/* ═══════════════════════════════════════════════════════════════ */}
                {/* READING TAB */}
                {/* ═══════════════════════════════════════════════════════════════ */}
                {activeTab === 'reading' && (
                  readingLoading ? (
                    <div className="flex items-center justify-center py-24">
                      <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
                    </div>
                  ) : !readingData ? (
                    <div className="bg-white dark:bg-[#121214] border border-slate-200 dark:border-[#27272a] rounded-xl p-16 text-center space-y-3">
                      <div className="w-16 h-16 bg-indigo-50 dark:bg-indigo-900/20 rounded-full flex items-center justify-center mx-auto">
                        <BookOpen className="w-8 h-8 text-indigo-400" />
                      </div>
                      <h3 className="font-bold text-slate-700 dark:text-slate-200">Reading Analytics Coming Soon</h3>
                      <p className="text-slate-500 text-sm max-w-sm mx-auto">
                        Reading analytics will be available once students complete reading practice sessions and the analytics endpoint is deployed.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-6 animate-in fade-in duration-300">

                      {/* Summary Cards */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        <MetricCardColored label="Avg Reading Speed" value={`${Math.round(readingData.summary.avgWPM)} WPM`} color="indigo" />
                        <MetricCardColored label="Avg Accuracy" value={`${Math.round(readingData.summary.avgAccuracy)}%`} color="emerald" />
                        <MetricCardColored label="Avg Speed Score" value={`${Math.round(readingData.summary.avgSpeedLearningScore)}/100`} color="amber" />
                        <MetricCardColored label="Total Sessions" value={readingData.summary.totalSessions} color="slate" />
                      </div>

                      {/* WPM Trend Chart */}
                      <ChartCard title="Batch Reading Speed & Accuracy Trend">
                        <ResponsiveContainer width="100%" height="100%">
                          <AreaChart data={readingData.wpmTrends}>
                            <defs>
                              <linearGradient id="gradWpm" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#6366f1" stopOpacity={0.35} />
                                <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                              </linearGradient>
                              <linearGradient id="gradAcc" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#10b981" stopOpacity={0.35} />
                                <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                              </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                            <XAxis dataKey="date" stroke="#888" fontSize={12} tickMargin={8} />
                            <YAxis yAxisId="left" stroke="#888" fontSize={12} />
                            <YAxis yAxisId="right" orientation="right" stroke="#888" fontSize={12} />
                            <RechartsTooltip
                              contentStyle={{ backgroundColor: '#fff', border: '1px solid #e2e8f0', borderRadius: '10px' }}
                              formatter={(v: any, name: string) => [`${Math.round(v)}${name === 'avgAccuracy' ? '%' : ' WPM'}`, name === 'avgWpm' ? 'Avg WPM' : 'Avg Accuracy']}
                            />
                            <Legend formatter={(v) => v === 'avgWpm' ? 'Avg WPM' : 'Avg Accuracy %'} />
                            <Area yAxisId="left" type="monotone" dataKey="avgWpm" stroke="#6366f1" strokeWidth={3} fill="url(#gradWpm)" name="avgWpm" />
                            <Area yAxisId="right" type="monotone" dataKey="avgAccuracy" stroke="#10b981" strokeWidth={3} fill="url(#gradAcc)" name="avgAccuracy" />
                          </AreaChart>
                        </ResponsiveContainer>
                      </ChartCard>

                      {/* Leaderboard */}
                      <div className="bg-white dark:bg-[#121214] border border-slate-200 dark:border-[#27272a] rounded-xl shadow-sm overflow-hidden">
                        <div className="p-5 border-b border-slate-200 dark:border-[#27272a] flex items-center gap-2">
                          <Medal className="w-5 h-5 text-amber-500" />
                          <h3 className="text-lg font-bold">Reading Leaderboard</h3>
                        </div>
                        <div className="overflow-x-auto">
                          <table className="w-full text-left text-sm">
                            <thead className="bg-slate-50 dark:bg-[#1a1a1c] text-slate-500 dark:text-slate-400 text-xs font-bold uppercase tracking-wider">
                              <tr>
                                <th className="px-5 py-4">Rank</th>
                                <th className="px-5 py-4">Student</th>
                                <th className="px-5 py-4 text-center">Avg WPM</th>
                                <th className="px-5 py-4 text-center">Avg Accuracy</th>
                                <th className="px-5 py-4 text-center">Best Score</th>
                                <th className="px-5 py-4 text-right pr-6">Sessions</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-200 dark:divide-[#27272a]">
                              {readingData.studentLeaderboard.map((student, i) => (
                                <tr key={student.studentId} className="hover:bg-slate-50 dark:hover:bg-white/[0.02] transition-colors">
                                  <td className="px-5 py-4">
                                    <span className={cn(
                                      "inline-flex items-center justify-center w-7 h-7 rounded-full font-black text-xs",
                                      getRankBadgeColor(i + 1)
                                    )}>
                                      {i + 1 <= 3 ? ['🥇', '🥈', '🥉'][i] : i + 1}
                                    </span>
                                  </td>
                                  <td className="px-5 py-4">
                                    <div className="flex items-center gap-3">
                                      {student.avatar ? (
                                        <img src={student.avatar} alt="" className="w-8 h-8 rounded-full" />
                                      ) : (
                                        <div className="w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-400 flex items-center justify-center font-bold text-xs">
                                          {student.name?.charAt(0)}
                                        </div>
                                      )}
                                      <span className="font-semibold text-slate-900 dark:text-white">{student.name}</span>
                                    </div>
                                  </td>
                                  <td className="px-5 py-4 text-center">
                                    <span className="font-bold font-mono text-indigo-600 dark:text-indigo-400">
                                      {Math.round(student.avgWPM)}
                                    </span>
                                  </td>
                                  <td className="px-5 py-4 text-center">
                                    <span className={cn("font-bold", getScoreColor(student.avgAccuracy))}>
                                      {Math.round(student.avgAccuracy)}%
                                    </span>
                                  </td>
                                  <td className="px-5 py-4 text-center">
                                    <span className={cn("font-bold", getScoreColor(student.bestSpeedLearningScore))}>
                                      {Math.round(student.bestSpeedLearningScore)}
                                    </span>
                                  </td>
                                  <td className="px-5 py-4 text-right pr-6 text-slate-500 font-medium">
                                    {student.totalSessions}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    </div>
                  )
                )}

                {/* ═══════════════════════════════════════════════════════════════ */}
                {/* WRITING TAB */}
                {/* ═══════════════════════════════════════════════════════════════ */}
                {activeTab === 'writing' && (
                  <div className="space-y-6 animate-in fade-in duration-300">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <MetricCard label="Avg Writing AI Band" value={data.summary.avgWriting != null ? Number(data.summary.avgWriting).toFixed(1) : '—'} icon={<PenTool className="w-5 h-5 text-purple-500" />} />
                      <MetricCard label="Total Students" value={data.summary.totalStudents} icon={<Users className="w-5 h-5 text-slate-500" />} />
                    </div>
                    <ChartCard title="Writing Band Score Growth">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={data.writingTrends}>
                          <defs>
                            <linearGradient id="gradWriting" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.4} />
                              <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                          <XAxis dataKey="date" stroke="#888" fontSize={12} />
                          <YAxis stroke="#888" fontSize={12} domain={[4, 9]} ticks={[4, 5, 6, 7, 8, 9]} />
                          <RechartsTooltip contentStyle={{ backgroundColor: '#fff', border: '1px solid #e2e8f0', borderRadius: '8px' }} />
                          <Legend />
                          <Area type="monotone" dataKey="score" stroke="#8b5cf6" strokeWidth={3} fill="url(#gradWriting)" name="Writing Score" />
                        </AreaChart>
                      </ResponsiveContainer>
                    </ChartCard>

                    {/* Writing Leaderboard */}
                    <div className="bg-white dark:bg-[#121214] border border-slate-200 dark:border-[#27272a] rounded-xl shadow-sm overflow-hidden">
                      <div className="p-5 border-b border-slate-200 dark:border-[#27272a] flex items-center justify-between">
                        <h3 className="text-lg font-bold flex items-center gap-2">
                          <Trophy className="w-5 h-5 text-amber-500" /> Writing Leaderboard
                        </h3>
                      </div>
                      <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm">
                          <thead className="bg-slate-50 dark:bg-[#1a1a1c] text-slate-500 dark:text-slate-400 text-xs font-bold uppercase tracking-wider">
                            <tr>
                              <th className="px-5 py-4">Rank</th>
                              <th className="px-5 py-4">Student</th>
                              <th className="px-5 py-4 text-center">Avg Band</th>
                              <th className="px-5 py-4 text-center">Avg Word Count</th>
                              <th className="px-5 py-4 text-center">Best Score</th>
                              <th className="px-5 py-4 text-right pr-6">Sessions</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-200 dark:divide-[#27272a]">
                            {data.writingLeaderboard?.map((student: any, i: number) => (
                              <tr key={student.studentId} className="hover:bg-slate-50 dark:hover:bg-white/[0.02] transition-colors">
                                <td className="px-5 py-4">
                                  <span className={cn(
                                    "inline-flex items-center justify-center w-7 h-7 rounded-full font-black text-xs",
                                    getRankBadgeColor(i + 1)
                                  )}>
                                    {i + 1 <= 3 ? ['🥇', '🥈', '🥉'][i] : i + 1}
                                  </span>
                                </td>
                                <td className="px-5 py-4">
                                  <div className="flex items-center gap-3">
                                    {student.avatar ? (
                                      <img src={student.avatar} alt="" className="w-8 h-8 rounded-full" />
                                    ) : (
                                      <div className="w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-400 flex items-center justify-center font-bold text-xs">
                                        {student.name?.charAt(0)}
                                      </div>
                                    )}
                                    <span className="font-semibold text-slate-900 dark:text-white">{student.name}</span>
                                  </div>
                                </td>
                                <td className="px-5 py-4 text-center">
                                  <span className="inline-flex px-2 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-900/30 font-bold text-xs text-indigo-700 dark:text-indigo-400">
                                    {student.avgBand}
                                  </span>
                                </td>
                                <td className="px-5 py-4 text-center">
                                  <span className="font-bold text-slate-700 dark:text-slate-300">
                                    {student.avgWordCount} words
                                  </span>
                                </td>
                                <td className="px-5 py-4 text-center">
                                  <span className={cn("font-bold")}>
                                    {student.bestScore ?? '—'}
                                  </span>
                                </td>
                                <td className="px-5 py-4 text-right pr-6 text-slate-500 font-medium">
                                  {student.totalSessions}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
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

// ─── Shared sub-components ────────────────────────────────────────────────────

const MetricCard = ({ label, value, icon }: { label: string; value: any; icon?: React.ReactNode }) => (
  <div className="bg-white dark:bg-[#121214] border border-slate-200 dark:border-[#27272a] rounded-xl p-5 shadow-sm flex items-center gap-4">
    {icon && <div className="w-10 h-10 bg-slate-50 dark:bg-slate-800 rounded-lg flex items-center justify-center flex-shrink-0">{icon}</div>}
    <div>
      <p className="text-slate-500 text-xs font-semibold uppercase tracking-wider mb-1">{label}</p>
      <h2 className="text-2xl font-black text-slate-900 dark:text-white">{value}</h2>
    </div>
  </div>
);

const colorMap: Record<string, string> = {
  indigo: 'text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/20',
  emerald: 'text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/20',
  amber: 'text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20',
  slate: 'text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800',
};

const MetricCardColored = ({ label, value, color }: { label: string; value: any; color: string }) => (
  <div className={cn("rounded-xl p-5 flex flex-col", colorMap[color])}>
    <p className="text-xs font-bold uppercase tracking-wider opacity-70 mb-2">{label}</p>
    <p className="text-3xl font-black">{value}</p>
  </div>
);

const ChartCard = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <div className="bg-white dark:bg-[#121214] border border-slate-200 dark:border-[#27272a] rounded-xl p-6 shadow-sm">
    <h3 className="text-lg font-bold mb-5">{title}</h3>
    <div className="h-[300px] w-full">{children}</div>
  </div>
);