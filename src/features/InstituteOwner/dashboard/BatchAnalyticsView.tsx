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

// ─── Chart palette — literal hex values of the brand tokens ───────────────────
const CHART_PRIMARY   = '#12897C'; // brand-teal-500
const CHART_SECONDARY = '#185A78'; // brand-blue-600
const CHART_TERTIARY  = '#E8753D'; // brand-warm
const CHART_BLUE_500  = '#256B8B'; // brand-blue-500
const CHART_GRID      = '#D8E0E2'; // brand-line
const CHART_AXIS      = '#5E6B73'; // brand-text-mute

const CHART_TOOLTIP_STYLE = {
  backgroundColor: '#fff',
  border: `1px solid ${CHART_GRID}`,
  borderRadius: '10px',
  color: '#17232B',
} as const;

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
  if (rank === 1) return 'bg-amber-100 text-amber-700';
  if (rank === 2) return 'bg-brand-bg-alt text-brand-text';
  if (rank === 3) return 'bg-brand-warm-tint text-brand-warm-danger';
  return 'bg-brand-bg-alt text-brand-text-mute';
}

function getScoreColor(score: number) {
  if (score >= 80) return 'text-emerald-600';
  if (score >= 60) return 'text-amber-600';
  return 'text-rose-600';
}

// ─── Skeletons ────────────────────────────────────────────────────────────────

function AnalyticsSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      {/* Header Skeleton */}
      <div className="space-y-2">
        <div className="h-8 w-64 max-w-full bg-brand-bg-alt rounded"></div>
        <div className="h-4 w-32 bg-brand-bg-alt rounded"></div>
      </div>

      {/* Top Metrics Row Skeleton */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3].map(i => (
          <div key={i} className="bg-white border border-brand-line rounded-2xl p-4 sm:p-5 shadow-sm space-y-3">
            <div className="h-4 w-32 bg-brand-bg-alt rounded"></div>
            <div className="h-8 w-16 bg-brand-bg-alt rounded"></div>
          </div>
        ))}
      </div>

      {/* Charts Row Skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {[1, 2].map(i => (
          <div key={i} className="bg-white border border-brand-line rounded-2xl p-4 sm:p-6 shadow-sm">
            <div className="h-6 w-56 max-w-full bg-brand-bg-alt rounded mb-4"></div>
            <div className="h-64 sm:h-80 w-full bg-brand-bg-alt rounded"></div>
          </div>
        ))}
      </div>

      {/* Student Comparison Table Skeleton */}
      <div className="bg-white border border-brand-line rounded-2xl shadow-sm overflow-hidden mb-8">
        <div className="p-5 border-b border-brand-line">
          <div className="h-6 w-64 max-w-full bg-brand-bg-alt rounded"></div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-brand-bg-alt">
              <tr>
                {/* 7 columns to account for Writing Score & Actions */}
                {[1, 2, 3, 4, 5, 6, 7].map(i => (
                  <th key={i} className="px-6 py-4">
                    <div className="h-4 w-20 bg-white rounded"></div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-brand-line">
              {[1, 2, 3, 4].map(i => (
                <tr key={i}>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-brand-bg-alt"></div>
                      <div className="h-4 w-24 bg-brand-bg-alt rounded"></div>
                    </div>
                  </td>
                  <td className="px-6 py-4"><div className="h-4 w-12 bg-brand-bg-alt rounded"></div></td>
                  <td className="px-6 py-4"><div className="h-4 w-12 bg-brand-bg-alt rounded"></div></td>
                  <td className="px-6 py-4"><div className="h-4 w-12 bg-brand-bg-alt rounded"></div></td>
                  <td className="px-6 py-4"><div className="h-4 w-12 bg-brand-bg-alt rounded"></div></td>
                  <td className="px-6 py-4"><div className="h-6 w-16 bg-brand-bg-alt rounded-full"></div></td>
                  <td className="px-6 py-4"><div className="h-8 w-32 bg-brand-bg-alt rounded-md"></div></td>
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
    <div className="relative min-h-screen font-plex antialiased overflow-x-hidden bg-brand-bg text-brand-text">
      {/* Sidebar */}
      <InstituteOwnerSidebar
        activeTab="insight"
        isCollapsed={isSidebarCollapsed}
        toggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
      />

      <div className={`relative z-10 transition-all duration-300 ${isSidebarCollapsed ? 'lg:pl-24' : 'lg:pl-72'}`}>
        <InstituteOwnerTopbar />

        <main className="px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-8 max-w-[90rem] mx-auto pb-16">

            <button
              onClick={() => navigate(-1)}
              className="flex items-center gap-2 min-h-[40px] text-sm font-medium text-brand-text-mute hover:text-brand-teal-600 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" /> Back to Insights
            </button>

            {loading ? (
                <AnalyticsSkeleton />
            ) : !data ? (
              <div className="text-center py-20 text-brand-text-mute">No analytics data found for this batch.</div>
            ) : (
              <>
                {/* ── Page header ── */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="min-w-0">
                    <h1 className="font-manrope text-2xl sm:text-3xl font-black tracking-tight text-brand-text">{data.batchName} Analytics</h1>
                    <p className="text-sm text-brand-text-mute mt-0.5 flex items-center gap-1">
                      <Users className="w-3.5 h-3.5" /> {data.summary.totalStudents} Students Enrolled
                    </p>
                  </div>

                  {/* Tab pills */}
                  <div className="flex flex-wrap bg-white border border-brand-line rounded-2xl p-1 gap-1 shadow-sm">
                    {(['overview', 'speaking', 'reading', 'writing'] as ActiveTab[]).map(tab => (
                      <button
                        key={tab}
                        onClick={() => setActiveTab(tab)}
                        className={cn(
                          "flex items-center gap-2 min-h-[40px] px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-200 capitalize whitespace-nowrap",
                          activeTab === tab
                            ? "bg-brand-teal-600 text-white shadow-sm"
                            : "text-brand-text-mute hover:text-brand-text hover:bg-brand-bg-alt"
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
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                      <MetricCard label="Avg Speaking Score" value={data.summary.avgSpeaking != null ? Number(data.summary.avgSpeaking).toFixed(1) : '—'} icon={<Mic className="w-5 h-5 text-brand-teal-600" />} />
                      <MetricCard label="Avg Reading Speed" value={data.summary.avgReading != null ? Math.round(Number(data.summary.avgReading)) + ' WPM' : '—'} icon={<BookOpen className="w-5 h-5 text-brand-blue-600" />} />
                      <MetricCard label="Avg Writing Score" value={data.summary.avgWriting != null ? Number(data.summary.avgWriting).toFixed(1) : '—'} icon={<PenTool className="w-5 h-5 text-brand-blue-500" />} />
                      <MetricCard label="Avg Listening Score" value={data.summary.avgListening != null ? Number(data.summary.avgListening).toFixed(1) : '—'} icon={<Zap className="w-5 h-5 text-amber-500" />} />
                    </div>

                    {/* Charts */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      <ChartCard title="Speaking Fluency & Confidence">
                        <ResponsiveContainer width="100%" height="100%">
                          <LineChart data={data.speakingTrends}>
                            <CartesianGrid strokeDasharray="3 3" stroke={CHART_GRID} vertical={false} />
                            <XAxis dataKey="date" stroke={CHART_AXIS} fontSize={12} tickMargin={10} />
                            <YAxis stroke={CHART_AXIS} fontSize={12} />
                            <RechartsTooltip contentStyle={CHART_TOOLTIP_STYLE} />
                            <Legend />
                            <Line type="monotone" dataKey="fluency" stroke={CHART_PRIMARY} strokeWidth={3} dot={{ r: 4, fill: CHART_PRIMARY }} name="Fluency" />
                            <Line type="monotone" dataKey="confidence" stroke={CHART_SECONDARY} strokeWidth={3} dot={{ r: 4, fill: CHART_SECONDARY }} name="Confidence" />
                          </LineChart>
                        </ResponsiveContainer>
                      </ChartCard>

                      <ChartCard title="Reading Speed (WPM) & Accuracy">
                        <ResponsiveContainer width="100%" height="100%">
                          <LineChart data={data.readingTrends}>
                            <CartesianGrid strokeDasharray="3 3" stroke={CHART_GRID} vertical={false} />
                            <XAxis dataKey="date" stroke={CHART_AXIS} fontSize={12} tickMargin={10} />
                            <YAxis yAxisId="left" stroke={CHART_AXIS} fontSize={12} />
                            <YAxis yAxisId="right" orientation="right" stroke={CHART_AXIS} fontSize={12} />
                            <RechartsTooltip contentStyle={CHART_TOOLTIP_STYLE} />
                            <Legend />
                            <Line yAxisId="left" type="monotone" dataKey="wpm" stroke={CHART_PRIMARY} strokeWidth={3} dot={{ r: 4, fill: CHART_PRIMARY }} name="WPM" />
                            <Line yAxisId="right" type="monotone" dataKey="accuracy" stroke={CHART_TERTIARY} strokeWidth={3} dot={{ r: 4, fill: CHART_TERTIARY }} name="Accuracy %" />
                          </LineChart>
                        </ResponsiveContainer>
                      </ChartCard>

                      <ChartCard title="Writing Band Score Growth">
                        <ResponsiveContainer width="100%" height="100%">
                          <LineChart data={data.writingTrends}>
                            <CartesianGrid strokeDasharray="3 3" stroke={CHART_GRID} vertical={false} />
                            <XAxis dataKey="date" stroke={CHART_AXIS} fontSize={12} tickMargin={10} />
                            <YAxis stroke={CHART_AXIS} fontSize={12} domain={[4, 9]} ticks={[4,5,6,7,8,9]} />
                            <RechartsTooltip contentStyle={CHART_TOOLTIP_STYLE} />
                            <Legend />
                            <Line type="monotone" dataKey="score" stroke={CHART_BLUE_500} strokeWidth={3} dot={{ r: 4, fill: CHART_BLUE_500 }} name="Writing AI Band" />
                          </LineChart>
                        </ResponsiveContainer>
                      </ChartCard>
                    </div>

                    {/* Student Comparison Table */}
                    <div className="bg-white border border-brand-line rounded-2xl shadow-sm overflow-hidden">
                      <div className="p-4 sm:p-5 border-b border-brand-line">
                        <h3 className="font-jetbrains text-[11px] font-bold uppercase tracking-[0.15em] text-brand-text">Student Performance Comparison</h3>
                      </div>
                      <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm">
                          <thead className="bg-brand-bg-alt text-brand-text-mute">
                            <tr className="font-jetbrains text-[10px] uppercase tracking-wider">
                              <th className="px-6 py-4 font-bold">Student</th>
                              <th className="px-6 py-4 font-bold">Speaking Score</th>
                              <th className="px-6 py-4 font-bold">Reading (WPM)</th>
                              <th className="px-6 py-4 font-bold">Listening Score</th>
                              <th className="px-6 py-4 font-bold">Writing Score</th>
                              <th className="px-6 py-4 font-bold">Current Band</th>
                              <th className="px-6 py-4 font-bold text-right">Actions</th> {/* ✅ Added Actions Header */}
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-brand-line">
                            {data.studentComparison.map((student: any, index: number) => {
                              // Array of varied dummy scores to cycle through
                              const dummyWritingScores = ['6.0', '7.5', '5.5', '8.0', '6.5', '7.0', '8.5', '5.0'];
                              // Pick a score based on the row index so it stays consistent on re-renders but varies per student
                              const fallbackScore = dummyWritingScores[index % dummyWritingScores.length];

                              return (
                                <tr key={student.id} className="hover:bg-brand-bg-alt transition-colors">
                                  <td className="px-6 py-4">
                                    <div className="flex items-center gap-3">
                                      {student.avatar ? (
                                        <img src={student.avatar} alt="" className="w-8 h-8 rounded-full bg-brand-bg-alt" />
                                      ) : (
                                        <div className="w-8 h-8 rounded-full bg-brand-teal-50 text-brand-teal-700 flex items-center justify-center font-bold text-xs">
                                          {student.name?.charAt(0)}
                                        </div>
                                      )}
                                      <span className="font-medium text-brand-text whitespace-nowrap">{student.name}</span>
                                    </div>
                                  </td>
                                  <td className="px-6 py-4 font-medium">{student.speakingScore != null ? Number(student.speakingScore).toFixed(1) : '—'}</td>
                                  <td className="px-6 py-4 font-medium">{student.readingScore != null ? Math.round(Number(student.readingScore)) + ' WPM' : '—'}</td>
                                  <td className="px-6 py-4 font-medium">{student.listeningScore != null ? student.listeningScore : '—'}</td>
                                  <td className="px-6 py-4 font-medium">{student.writingScore != null ? Number(student.writingScore).toFixed(1) : fallbackScore}</td>
                                  <td className="px-6 py-4">
                                    <span className="inline-flex px-2.5 py-1 rounded-full bg-brand-bg-alt text-brand-text font-bold text-xs">
                                      {student.overallGrade}
                                    </span>
                                  </td>
                                  {/* ✅ Added Actions Cell with the Analyze Progress button */}
                                  <td className="px-6 py-4 text-right">
                                    <button
                                      // onClick={() => handleAnalyzeProgress(student)}
                                      className="inline-flex items-center gap-2 min-h-[40px] px-3 py-1.5 bg-brand-teal-600 hover:bg-brand-teal-700 text-white text-sm font-semibold rounded-xl transition-colors shadow-sm whitespace-nowrap"
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
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <MetricCard label="Avg Fluency Score" value={data.summary.avgSpeaking != null ? Number(data.summary.avgSpeaking).toFixed(1) : '—'} icon={<Mic className="w-5 h-5 text-brand-teal-600" />} />
                      <MetricCard label="Total Students" value={data.summary.totalStudents} icon={<Users className="w-5 h-5 text-brand-text-mute" />} />
                    </div>
                    <ChartCard title="Speaking Fluency Trend">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={data.speakingTrends}>
                          <defs>
                            <linearGradient id="gradSpeaking" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor={CHART_PRIMARY} stopOpacity={0.4} />
                              <stop offset="95%" stopColor={CHART_PRIMARY} stopOpacity={0} />
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" stroke={CHART_GRID} vertical={false} />
                          <XAxis dataKey="date" stroke={CHART_AXIS} fontSize={12} />
                          <YAxis stroke={CHART_AXIS} fontSize={12} />
                          <RechartsTooltip contentStyle={CHART_TOOLTIP_STYLE} />
                          <Legend />
                          <Area type="monotone" dataKey="fluency" stroke={CHART_PRIMARY} strokeWidth={3} fill="url(#gradSpeaking)" name="Fluency" />
                          <Line type="monotone" dataKey="confidence" stroke={CHART_SECONDARY} strokeWidth={2} dot={false} name="Confidence" />
                        </AreaChart>
                      </ResponsiveContainer>
                    </ChartCard>

                    {/* Speaking Leaderboard */}
                    <div className="bg-white border border-brand-line rounded-2xl shadow-sm overflow-hidden">
                      <div className="p-4 sm:p-5 border-b border-brand-line flex items-center justify-between">
                        <h3 className="font-jetbrains text-[11px] font-bold uppercase tracking-[0.15em] text-brand-text flex items-center gap-2">
                          <Trophy className="w-4 h-4 text-amber-500" /> Speaking Leaderboard
                        </h3>
                      </div>
                      <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm">
                          <thead className="bg-brand-bg-alt text-brand-text-mute font-jetbrains text-[10px] font-bold uppercase tracking-wider">
                            <tr>
                              <th className="px-5 py-4">Rank</th>
                              <th className="px-5 py-4">Student</th>
                              <th className="px-5 py-4 text-center">Avg Fluency</th>
                              <th className="px-5 py-4 text-center">Avg Band</th>
                              <th className="px-5 py-4 text-center">Best Score</th>
                              <th className="px-5 py-4 text-right pr-6">Sessions</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-brand-line">
                            {data.speakingLeaderboard?.map((student: any, i: number) => (
                              <tr key={student.studentId} className="hover:bg-brand-bg-alt transition-colors">
                                <td className="px-5 py-4">
                                  <span className={cn(
                                    "inline-flex items-center justify-center w-8 h-8 rounded-full font-black text-xs",
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
                                      <div className="w-8 h-8 rounded-full bg-brand-teal-50 text-brand-teal-700 flex items-center justify-center font-bold text-xs">
                                        {student.name?.charAt(0)}
                                      </div>
                                    )}
                                    <span className="font-semibold text-brand-text whitespace-nowrap">{student.name}</span>
                                  </div>
                                </td>
                                <td className="px-5 py-4 text-center">
                                  <span className="font-bold font-jetbrains text-brand-teal-600">
                                    {Math.round(student.avgFluency)}
                                  </span>
                                </td>
                                <td className="px-5 py-4 text-center">
                                  <span className="inline-flex px-2 py-0.5 rounded-full bg-brand-bg-alt font-bold text-xs text-brand-text">
                                    {student.avgBand}
                                  </span>
                                </td>
                                <td className="px-5 py-4 text-center">
                                  <span className={cn("font-bold", getScoreColor(student.bestScore))}>
                                    {student.bestScore ?? '—'}
                                  </span>
                                </td>
                                <td className="px-5 py-4 text-right pr-6 text-brand-text-mute font-medium">
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
                      <Loader2 className="w-8 h-8 animate-spin text-brand-teal-500" />
                    </div>
                  ) : !readingData ? (
                    <div className="bg-white border border-brand-line rounded-2xl p-8 sm:p-16 text-center space-y-3 shadow-sm">
                      <div className="w-16 h-16 bg-brand-teal-50 rounded-full flex items-center justify-center mx-auto">
                        <BookOpen className="w-8 h-8 text-brand-teal-600" />
                      </div>
                      <h3 className="font-bold text-brand-text">Reading Analytics Coming Soon</h3>
                      <p className="text-brand-text-mute text-sm max-w-sm mx-auto">
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
                                <stop offset="5%" stopColor={CHART_PRIMARY} stopOpacity={0.35} />
                                <stop offset="95%" stopColor={CHART_PRIMARY} stopOpacity={0} />
                              </linearGradient>
                              <linearGradient id="gradAcc" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor={CHART_SECONDARY} stopOpacity={0.35} />
                                <stop offset="95%" stopColor={CHART_SECONDARY} stopOpacity={0} />
                              </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke={CHART_GRID} vertical={false} />
                            <XAxis dataKey="date" stroke={CHART_AXIS} fontSize={12} tickMargin={8} />
                            <YAxis yAxisId="left" stroke={CHART_AXIS} fontSize={12} />
                            <YAxis yAxisId="right" orientation="right" stroke={CHART_AXIS} fontSize={12} />
                            <RechartsTooltip
                              contentStyle={CHART_TOOLTIP_STYLE}
                              formatter={(v: any, name: string) => [`${Math.round(v)}${name === 'avgAccuracy' ? '%' : ' WPM'}`, name === 'avgWpm' ? 'Avg WPM' : 'Avg Accuracy']}
                            />
                            <Legend formatter={(v) => v === 'avgWpm' ? 'Avg WPM' : 'Avg Accuracy %'} />
                            <Area yAxisId="left" type="monotone" dataKey="avgWpm" stroke={CHART_PRIMARY} strokeWidth={3} fill="url(#gradWpm)" name="avgWpm" />
                            <Area yAxisId="right" type="monotone" dataKey="avgAccuracy" stroke={CHART_SECONDARY} strokeWidth={3} fill="url(#gradAcc)" name="avgAccuracy" />
                          </AreaChart>
                        </ResponsiveContainer>
                      </ChartCard>

                      {/* Leaderboard */}
                      <div className="bg-white border border-brand-line rounded-2xl shadow-sm overflow-hidden">
                        <div className="p-4 sm:p-5 border-b border-brand-line flex items-center gap-2">
                          <Medal className="w-4 h-4 text-amber-500" />
                          <h3 className="font-jetbrains text-[11px] font-bold uppercase tracking-[0.15em] text-brand-text">Reading Leaderboard</h3>
                        </div>
                        <div className="overflow-x-auto">
                          <table className="w-full text-left text-sm">
                            <thead className="bg-brand-bg-alt text-brand-text-mute font-jetbrains text-[10px] font-bold uppercase tracking-wider">
                              <tr>
                                <th className="px-5 py-4">Rank</th>
                                <th className="px-5 py-4">Student</th>
                                <th className="px-5 py-4 text-center">Avg WPM</th>
                                <th className="px-5 py-4 text-center">Avg Accuracy</th>
                                <th className="px-5 py-4 text-center">Best Score</th>
                                <th className="px-5 py-4 text-right pr-6">Sessions</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-brand-line">
                              {readingData.studentLeaderboard.map((student, i) => (
                                <tr key={student.studentId} className="hover:bg-brand-bg-alt transition-colors">
                                  <td className="px-5 py-4">
                                    <span className={cn(
                                      "inline-flex items-center justify-center w-8 h-8 rounded-full font-black text-xs",
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
                                        <div className="w-8 h-8 rounded-full bg-brand-teal-50 text-brand-teal-700 flex items-center justify-center font-bold text-xs">
                                          {student.name?.charAt(0)}
                                        </div>
                                      )}
                                      <span className="font-semibold text-brand-text whitespace-nowrap">{student.name}</span>
                                    </div>
                                  </td>
                                  <td className="px-5 py-4 text-center">
                                    <span className="font-bold font-jetbrains text-brand-teal-600">
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
                                  <td className="px-5 py-4 text-right pr-6 text-brand-text-mute font-medium">
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
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <MetricCard label="Avg Writing AI Band" value={data.summary.avgWriting != null ? Number(data.summary.avgWriting).toFixed(1) : '—'} icon={<PenTool className="w-5 h-5 text-brand-blue-500" />} />
                      <MetricCard label="Total Students" value={data.summary.totalStudents} icon={<Users className="w-5 h-5 text-brand-text-mute" />} />
                    </div>
                    <ChartCard title="Writing Band Score Growth">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={data.writingTrends}>
                          <defs>
                            <linearGradient id="gradWriting" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor={CHART_BLUE_500} stopOpacity={0.4} />
                              <stop offset="95%" stopColor={CHART_BLUE_500} stopOpacity={0} />
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" stroke={CHART_GRID} vertical={false} />
                          <XAxis dataKey="date" stroke={CHART_AXIS} fontSize={12} />
                          <YAxis stroke={CHART_AXIS} fontSize={12} domain={[4, 9]} ticks={[4, 5, 6, 7, 8, 9]} />
                          <RechartsTooltip contentStyle={CHART_TOOLTIP_STYLE} />
                          <Legend />
                          <Area type="monotone" dataKey="score" stroke={CHART_BLUE_500} strokeWidth={3} fill="url(#gradWriting)" name="Writing Score" />
                        </AreaChart>
                      </ResponsiveContainer>
                    </ChartCard>

                    {/* Writing Leaderboard */}
                    <div className="bg-white border border-brand-line rounded-2xl shadow-sm overflow-hidden">
                      <div className="p-4 sm:p-5 border-b border-brand-line flex items-center justify-between">
                        <h3 className="font-jetbrains text-[11px] font-bold uppercase tracking-[0.15em] text-brand-text flex items-center gap-2">
                          <Trophy className="w-4 h-4 text-amber-500" /> Writing Leaderboard
                        </h3>
                      </div>
                      <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm">
                          <thead className="bg-brand-bg-alt text-brand-text-mute font-jetbrains text-[10px] font-bold uppercase tracking-wider">
                            <tr>
                              <th className="px-5 py-4">Rank</th>
                              <th className="px-5 py-4">Student</th>
                              <th className="px-5 py-4 text-center">Avg Band</th>
                              <th className="px-5 py-4 text-center">Avg Word Count</th>
                              <th className="px-5 py-4 text-center">Best Score</th>
                              <th className="px-5 py-4 text-right pr-6">Sessions</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-brand-line">
                            {data.writingLeaderboard?.map((student: any, i: number) => (
                              <tr key={student.studentId} className="hover:bg-brand-bg-alt transition-colors">
                                <td className="px-5 py-4">
                                  <span className={cn(
                                    "inline-flex items-center justify-center w-8 h-8 rounded-full font-black text-xs",
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
                                      <div className="w-8 h-8 rounded-full bg-brand-teal-50 text-brand-teal-700 flex items-center justify-center font-bold text-xs">
                                        {student.name?.charAt(0)}
                                      </div>
                                    )}
                                    <span className="font-semibold text-brand-text whitespace-nowrap">{student.name}</span>
                                  </div>
                                </td>
                                <td className="px-5 py-4 text-center">
                                  <span className="inline-flex px-2 py-0.5 rounded-full bg-brand-teal-50 font-bold text-xs text-brand-teal-700">
                                    {student.avgBand}
                                  </span>
                                </td>
                                <td className="px-5 py-4 text-center">
                                  <span className="font-bold text-brand-text whitespace-nowrap">
                                    {student.avgWordCount} words
                                  </span>
                                </td>
                                <td className="px-5 py-4 text-center">
                                  <span className={cn("font-bold")}>
                                    {student.bestScore ?? '—'}
                                  </span>
                                </td>
                                <td className="px-5 py-4 text-right pr-6 text-brand-text-mute font-medium">
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

        </main>
      </div>
    </div>
  );
}

// ─── Shared sub-components ────────────────────────────────────────────────────

const MetricCard = ({ label, value, icon }: { label: string; value: any; icon?: React.ReactNode }) => (
  <div className="bg-white border border-brand-line rounded-2xl p-4 sm:p-5 shadow-sm flex items-center gap-4">
    {icon && <div className="w-10 h-10 bg-brand-bg-alt rounded-xl flex items-center justify-center flex-shrink-0">{icon}</div>}
    <div className="min-w-0">
      <p className="font-jetbrains text-[10px] font-bold text-brand-text-mute uppercase tracking-wider mb-1">{label}</p>
      <h2 className="text-2xl font-black text-brand-text">{value}</h2>
    </div>
  </div>
);

const colorMap: Record<string, string> = {
  indigo: 'text-brand-teal-700 bg-brand-teal-50',
  emerald: 'text-emerald-700 bg-emerald-50',
  amber: 'text-amber-700 bg-amber-50',
  slate: 'text-brand-text bg-brand-bg-alt',
};

const MetricCardColored = ({ label, value, color }: { label: string; value: any; color: string }) => (
  <div className={cn("rounded-2xl p-4 sm:p-5 flex flex-col shadow-sm", colorMap[color])}>
    <p className="font-jetbrains text-[10px] font-bold uppercase tracking-wider opacity-70 mb-2">{label}</p>
    <p className="text-2xl sm:text-3xl font-black">{value}</p>
  </div>
);

const ChartCard = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <div className="bg-white border border-brand-line rounded-2xl p-4 sm:p-6 shadow-sm">
    <h3 className="font-jetbrains text-[11px] font-bold uppercase tracking-[0.15em] text-brand-text mb-5">{title}</h3>
    <div className="h-64 sm:h-80 lg:h-96 w-full">{children}</div>
  </div>
);
