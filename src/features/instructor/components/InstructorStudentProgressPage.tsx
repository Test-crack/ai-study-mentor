import { useState, useEffect, useMemo } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { 
  ChevronLeft, Activity, Target, Clock, Zap, 
  TrendingUp, Award, AlertTriangle, Loader2, Mic, Eye, Zap as SpeedIcon, 
  PenTool, Headphones, BookOpen, BarChart2, CheckCircle, FileText
} from 'lucide-react';
import { Button } from '@/shared/components/ui/button';
import { InstructorSidebar } from '../components/dashboard/InstructorSidebar';
import { cn } from "@/shared/utils";
import { callBackend } from '@/features/auth/services/authClient';
import { getBackendUrl } from '@/shared/utils';
import { toast } from 'sonner';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  AreaChart, Area,
  BarChart, Bar
} from 'recharts';

type TabType = 'speaking' | 'reading' | 'writing';

// ─── Skeletons ────────────────────────────────────────────────────────────────
function HistorySkeleton() {
  return (
    <div className="space-y-8 animate-pulse">
      {/* Stat Cards Skeleton */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="bg-white dark:bg-[#15141B] p-6 rounded-3xl border border-slate-200 dark:border-[#26252D] shadow-sm flex flex-col justify-center h-[136px]">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-12 h-12 rounded-2xl bg-slate-200 dark:bg-[#26252D] shrink-0" />
              <div className="h-3 w-24 bg-slate-200 dark:bg-[#26252D] rounded" />
            </div>
            <div className="h-8 w-20 bg-slate-200 dark:bg-[#26252D] rounded" />
          </div>
        ))}
      </div>

      {/* Charts Section Skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 bg-white dark:bg-[#15141B] p-4 md:p-6 rounded-3xl border border-slate-200 dark:border-[#26252D] shadow-sm">
          <div className="h-6 w-48 bg-slate-200 dark:bg-[#26252D] rounded mb-6" />
          <div className="h-[250px] md:h-[300px] w-full bg-slate-100 dark:bg-[#26252D]/50 rounded-xl" />
        </div>

        <div className="bg-[#fffbf0] dark:bg-amber-900/10 border border-amber-100 dark:border-amber-900/30 p-4 md:p-6 rounded-3xl">
          <div className="flex items-center gap-2 mb-6">
            <div className="w-5 h-5 bg-amber-200 dark:bg-amber-800/50 rounded-full shrink-0" />
            <div className="h-5 w-32 bg-amber-200 dark:bg-amber-800/50 rounded" />
          </div>
          <div className="h-4 w-full bg-amber-100 dark:bg-amber-900/30 rounded mb-2" />
          <div className="h-4 w-3/4 bg-amber-100 dark:bg-amber-900/30 rounded mb-6" />
          
          <div className="space-y-3">
            {[1, 2, 3, 4, 5].map(i => (
              <div key={i} className="flex items-center justify-between bg-white dark:bg-[#15141B] p-3 rounded-xl border border-amber-100 dark:border-[#26252D]">
                <div className="h-4 w-16 bg-slate-200 dark:bg-[#26252D] rounded" />
                <div className="h-4 w-12 bg-slate-200 dark:bg-[#26252D] rounded" />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Table Skeleton */}
      <div className="bg-white dark:bg-[#15141B] rounded-3xl p-4 md:p-6 shadow-sm border border-slate-200 dark:border-[#26252D] overflow-hidden">
        <div className="h-6 w-32 bg-slate-200 dark:bg-[#26252D] rounded mb-6" />
        <div className="w-full overflow-x-auto">
          <div className="flex border-b border-slate-100 dark:border-[#26252D] pb-3 mb-2 min-w-[600px]">
            <div className="w-2/12 h-4 bg-slate-200 dark:bg-[#26252D] rounded ml-4" />
            <div className="w-3/12 h-4 bg-slate-200 dark:bg-[#26252D] rounded mx-4" />
            <div className="w-2/12 h-4 bg-slate-200 dark:bg-[#26252D] rounded mx-4" />
            <div className="w-2/12 h-4 bg-slate-200 dark:bg-[#26252D] rounded mx-4" />
            <div className="w-2/12 h-4 bg-slate-200 dark:bg-[#26252D] rounded mx-4" />
            <div className="w-1/12 h-4 bg-slate-200 dark:bg-[#26252D] rounded mr-4" />
          </div>
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="flex py-4 border-b border-slate-50 dark:border-[#26252D]/50 items-center min-w-[600px]">
              <div className="w-2/12 h-4 bg-slate-100 dark:bg-[#26252D]/50 rounded ml-4" />
              <div className="w-3/12 h-4 bg-slate-100 dark:bg-[#26252D]/50 rounded mx-4" />
              <div className="w-2/12 h-6 bg-slate-100 dark:bg-[#26252D]/50 rounded mx-4" />
              <div className="w-2/12 h-4 bg-slate-100 dark:bg-[#26252D]/50 rounded mx-4" />
              <div className="w-2/12 h-4 bg-slate-100 dark:bg-[#26252D]/50 rounded mx-4" />
              <div className="w-1/12 h-4 bg-slate-100 dark:bg-[#26252D]/50 rounded mr-4" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

// ─── Reading session shape (from ReadingAssessmentHistory) ────────────────────
interface ReadingSession {
  id: string;
  passageId: string;
  passageTitle?: string;
  difficulty: string;
  category: string;
  wordCount: number;
  actualWPM: number;
  weightedWPM: number;
  wpm?: number;
  accuracy: number;
  retention: number;
  speedLearningScore: number;
  integrityScore?: number;
  focusRatio: number;
  readingTimeSeconds: number;
  createdAt: string;
}

function getDifficultyColor(d: string) {
  if (d === 'hard') return 'bg-rose-100 text-rose-600 dark:bg-rose-900/20 dark:text-rose-400';
  if (d === 'medium') return 'bg-amber-100 text-amber-600 dark:bg-amber-900/20 dark:text-amber-400';
  return 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-400';
}

function getScoreColor(score: number) {
  if (score >= 80) return 'text-emerald-500';
  if (score >= 60) return 'text-amber-500';
  return 'text-rose-500';
}

export default function InstructorStudentProgressPage() {
  const navigate = useNavigate();
  const { studentSlug } = useParams();
  const location = useLocation();
  const student = location.state?.student;
  const studentId = location.state?.studentId || student?.userId || student?.id;

  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [activeTab, setActiveTab] = useState<TabType>('speaking');

  useEffect(() => {
    if (!studentId) {
       toast.error("Student session lost. Navigating back.");
       navigate('/instructor');
    }
  }, [studentId, navigate]);

  // Speaking tab
  const [speakingHistory, setSpeakingHistory] = useState<any[]>([]);
  const [speakingLoading, setSpeakingLoading] = useState(false);

  // Reading tab
  const [readingHistory, setReadingHistory] = useState<any[]>([]);
  const [readingLoading, setReadingLoading] = useState(false);

  // Writing tab
  const [writingHistory, setWritingHistory] = useState<any[]>([]);
  const [writingLoading, setWritingLoading] = useState(false);
  const [gradingModalOpen, setGradingModalOpen] = useState(false);
  const [selectedAssessment, setSelectedAssessment] = useState<any>(null);

  // ─── Loaders ─────────────────────────────────────────────────────────────────

  const loadSpeakingHistory = async () => {
    if (!studentId) return;
    setSpeakingLoading(true);
    try {
      const res = await callBackend(`${getBackendUrl()}/api/instructor/students/${studentId}/speaking-history`);
      if (res.success) {
        // Backend returns the array under either res.data directly (legacy) or res.data.sessions
        setSpeakingHistory(Array.isArray(res.data?.sessions) ? res.data.sessions : (Array.isArray(res.data) ? res.data : []));
      } else {
        toast.error('Failed to load speaking history.');
      }
    } catch (err: any) {
      toast.error(err.message || 'Could not fetch speaking analytics.');
    } finally {
      setSpeakingLoading(false);
    }
  };

  const loadReadingHistory = async () => {
    if (!studentId) return;
    setReadingLoading(true);
    try {
      const res = await callBackend(`${getBackendUrl()}/api/instructor/students/${studentId}/reading-history`);
      if (res.success) {
        setReadingHistory(Array.isArray(res.data?.sessions) ? res.data.sessions : (Array.isArray(res.data) ? res.data : []));
      } else {
        toast.error('Failed to load reading history.');
      }
    } catch (err: any) {
      console.warn('Reading history endpoint not available:', err.message);
      setReadingHistory([]);
    } finally {
      setReadingLoading(false);
    }
  };

  const loadWritingHistory = async () => {
    if (!studentId) return;
    setWritingLoading(true);
    try {
      const res = await callBackend(`${getBackendUrl()}/api/instructor/students/${studentId}/writing-history`);
      if (res.success) {
        setWritingHistory(Array.isArray(res.data?.sessions) ? res.data.sessions : (Array.isArray(res.data) ? res.data : []));
      } else {
        toast.error('Failed to load writing history.');
      }
    } catch (err: any) {
      console.warn('Writing history endpoint not available:', err.message);
      setWritingHistory([]);
    } finally {
      setWritingLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'speaking') loadSpeakingHistory();
    if (activeTab === 'reading') loadReadingHistory();
    if (activeTab === 'writing') loadWritingHistory();
  }, [activeTab, studentId]);

  // ─── Speaking stats & chart ───────────────────────────────────────────────────
  const speakingStats = useMemo(() => {
    if (!speakingHistory.length) return { avgScore: 0, peakWpm: 0, totalAssessments: 0, avgKeywords: 0 };
    const avgScore = speakingHistory.reduce((acc, curr) => acc + curr.fluencyScore, 0) / speakingHistory.length;
    const peakWpm = Math.max(...speakingHistory.map(h => h.weightedWpm));
    let totalKH = 0, totalKTotal = 0;
    speakingHistory.forEach(h => { totalKH += h.keywordsHit; totalKTotal += h.totalKeywords; });
    return {
      avgScore: Math.round(avgScore),
      peakWpm: Math.round(peakWpm),
      totalAssessments: speakingHistory.length,
      avgKeywords: totalKTotal > 0 ? Math.round((totalKH / totalKTotal) * 100) : 0,
    };
  }, [speakingHistory]);

  const speakingChartData = useMemo(() =>
    [...speakingHistory].reverse().map((h, i) => ({
      name: `S ${i + 1}`,
      fluency: h.fluencyScore,
      wpm: h.weightedWpm,
      date: new Date(h.createdAt).toLocaleDateString(),
    })),
    [speakingHistory]
  );

  const overallFillers = useMemo(() => {
    const fillerMap: Record<string, number> = {};
    speakingHistory.forEach(h => {
      h.frequentFillers?.forEach((f: any) => { fillerMap[f.word] = (fillerMap[f.word] || 0) + f.count; });
    });
    return Object.entries(fillerMap).sort((a, b) => b[1] - a[1]).slice(0, 5).map(([word, count]) => ({ word, count }));
  }, [speakingHistory]);

  // ─── Reading stats & chart ────────────────────────────────────────────────────
  const readingStats = useMemo(() => {
    if (!readingHistory.length) return { avgWPM: 0, bestScore: 0, totalSessions: 0, avgAccuracy: 0 };
    const avgWPM = readingHistory.reduce((acc, r) => acc + (r.wpm || r.actualWPM || 0), 0) / readingHistory.length;
    const bestScore = Math.max(...readingHistory.map(r => r.speedLearningScore || 0));
    const avgAccuracy = readingHistory.reduce((acc, r) => acc + (r.accuracy || 0), 0) / readingHistory.length;
    return {
      avgWPM: Math.round(avgWPM),
      bestScore: Math.round(bestScore),
      totalSessions: readingHistory.length,
      avgAccuracy: Math.round(avgAccuracy),
    };
  }, [readingHistory]);

  const readingChartData = useMemo(() =>
    [...readingHistory].reverse().map((r, i) => ({
      name: `R${i + 1}`,
      wpm: Math.round(r.wpm || r.actualWPM || 0),
      accuracy: Math.round(r.accuracy || 0),
      score: Math.round(r.speedLearningScore || 0),
      date: new Date(r.createdAt).toLocaleDateString(),
    })),
    [readingHistory]
  );

  return (
    <div className="min-h-screen bg-[#f1f3f9] dark:bg-[#09090E] transition-colors duration-300 font-sans text-slate-800 dark:text-slate-200 flex">
      <InstructorSidebar 
        activeTab="batches" 
        isCollapsed={isSidebarCollapsed} 
        toggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)} 
      />

      <div className={cn("transition-all duration-300 min-h-screen flex flex-col w-full", isSidebarCollapsed ? 'lg:pl-20' : 'lg:pl-72')}>
        <main className="p-4 md:p-8 max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500 w-full pt-16 md:pt-12 overflow-x-hidden">
          
          {/* Header */}
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 mb-2">
            <div className="w-full lg:w-auto">
              <Button variant="ghost" className="mb-4 -ml-2 md:-ml-4 text-slate-500 hover:text-slate-900" onClick={() => navigate('/instructor/dashboard')}>
                <ChevronLeft className="w-4 h-4 mr-1" /> Back to Batches
              </Button>
              <h1 className="text-2xl md:text-3xl font-bold text-slate-900 dark:text-white flex items-center gap-2 md:gap-3 flex-wrap">
                <Activity className="w-6 h-6 md:w-8 md:h-8 text-[#8a42f5] shrink-0" />
                <span className="truncate">Student Analytics {student?.name ? `- ${student.name}` : ''}</span>
              </h1>
              <p className="text-sm md:text-base text-slate-500 dark:text-slate-400 mt-1">Deep dive into performance metrics and actionable insights.</p>
            </div>
            
            {/* Responsive Tab Container */}
            <div className="w-full lg:w-auto overflow-x-auto pb-2 lg:pb-0 scrollbar-hide">
              <div className="bg-white dark:bg-slate-900 rounded-full p-1.5 flex shadow-sm border border-slate-200 dark:border-slate-800 w-max lg:w-auto">
                  <TabButton active={activeTab === 'speaking'} onClick={() => setActiveTab('speaking')} icon={<Mic className="w-4 h-4" />}>Speaking</TabButton>
                  <TabButton active={activeTab === 'reading'} onClick={() => setActiveTab('reading')} icon={<BookOpen className="w-4 h-4" />}>Reading</TabButton>
                  <TabButton active={activeTab === 'writing'} onClick={() => setActiveTab('writing')} icon={<PenTool className="w-4 h-4" />}>Writing</TabButton>
              </div>
            </div>
          </div>

          {/* ──────────────────────────── SPEAKING TAB ──────────────────────────── */}
          {activeTab === 'speaking' && (
              speakingLoading ? (
                <HistorySkeleton />
              ) : speakingHistory.length === 0 ? (
                <EmptyState 
                  icon={<Target className="w-10 h-10 text-slate-400" />} 
                  title="No Speaking History" 
                  desc="This student hasn't completed any Speaking Practice sessions yet." 
                />
              ) : (
                <div className="space-y-8 animate-in slide-in-from-bottom-4 duration-500">
                  {/* Stat Cards */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <StatCard icon={<TrendingUp />} label="Avg Fluency Score" value={`${speakingStats.avgScore}/100`} color="text-emerald-500" bg="bg-emerald-50 dark:bg-emerald-500/10" />
                    <StatCard icon={<Zap />} label="Peak Speaking Speed" value={`${speakingStats.peakWpm} WPM`} color="text-[#8a42f5]" bg="bg-[#8a42f5]/10" />
                    <StatCard icon={<Award />} label="Practice Sessions" value={speakingStats.totalAssessments} color="text-blue-500" bg="bg-blue-50 dark:bg-blue-500/10" />
                    <StatCard icon={<Target />} label="Keyword Hit Rate" value={`${speakingStats.avgKeywords}%`} color="text-amber-500" bg="bg-amber-50 dark:bg-amber-500/10" />
                  </div>

                  {/* Charts Section */}
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <div className="lg:col-span-2 bg-white dark:bg-[#15141B] p-4 md:p-6 rounded-3xl shadow-sm border border-slate-200 dark:border-[#26252D]">
                      <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-6">Fluency Progression</h3>
                      <div className="h-[250px] md:h-[300px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                          <AreaChart data={speakingChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                            <defs>
                              <linearGradient id="colorFluency" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#8a42f5" stopOpacity={0.3}/>
                                <stop offset="95%" stopColor="#8a42f5" stopOpacity={0}/>
                              </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" strokeOpacity={0.4} />
                            <XAxis dataKey="name" tick={{ fontSize: 12, fill: '#64748b' }} axisLine={false} tickLine={false} />
                            <YAxis tick={{ fontSize: 12, fill: '#64748b' }} axisLine={false} tickLine={false} />
                            <Tooltip 
                                contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', backgroundColor: '#fff' }}
                                labelStyle={{ color: '#0b132b', fontWeight: 'bold' }}
                            />
                            <Area type="monotone" dataKey="fluency" stroke="#8a42f5" strokeWidth={3} fillOpacity={1} fill="url(#colorFluency)" name="Fluency Score" />
                            <Line type="monotone" dataKey="wpm" stroke="#10b981" strokeWidth={3} dot={false} name="WPM" />
                          </AreaChart>
                        </ResponsiveContainer>
                      </div>
                    </div>

                    <div className="bg-[#fffbf0] dark:bg-amber-900/10 border border-amber-100 dark:border-amber-900/30 p-4 md:p-6 rounded-3xl">
                       <div className="flex items-center gap-2 mb-4">
                          <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0" />
                          <h3 className="font-bold text-[#8a6a24] dark:text-amber-500">Historical Fillers</h3>
                       </div>
                       <p className="text-xs md:text-sm text-[#8a6a24]/80 dark:text-slate-400 mb-6">Words that most commonly disrupt this student's fluency across all sessions.</p>
                       
                       <div className="space-y-3">
                         {overallFillers.length > 0 ? overallFillers.map((f, i) => (
                           <div key={i} className="flex items-center justify-between bg-white dark:bg-slate-800 p-3 rounded-xl border border-amber-100 dark:border-slate-700">
                               <span className="font-mono text-rose-500 font-bold uppercase">{f.word}</span>
                               <span className="text-sm font-black text-slate-400">{f.count}x Total</span>
                           </div>
                         )) : (
                           <div className="text-emerald-600 text-sm md:text-base font-bold bg-emerald-50 dark:bg-emerald-900/20 p-4 rounded-xl">No significant filler usage detected!</div>
                         )}
                       </div>
                    </div>
                  </div>

                  {/* History List */}
                  <div className="bg-white dark:bg-[#15141B] rounded-3xl p-4 md:p-6 shadow-sm border border-slate-200 dark:border-[#26252D] overflow-hidden">
                     <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-6">Past Sessions</h3>
                     <div className="overflow-x-auto">
                       <table className="w-full text-left border-collapse min-w-[600px]">
                         <thead>
                           <tr className="border-b border-slate-100 dark:border-[#26252D] text-slate-500 text-sm font-semibold">
                             <th className="pb-3 pl-4">Date</th>
                             <th className="pb-3">Topic</th>
                             <th className="pb-3">Band</th>
                             <th className="pb-3 text-center">Fluency</th>
                             <th className="pb-3 text-center">WPM</th>
                             <th className="pb-3 text-right pr-4">Keywords</th>
                           </tr>
                         </thead>
                         <tbody className="text-sm">
                           {speakingHistory.map((h, i) => (
                             <tr key={i} className="border-b border-slate-50 dark:border-[#26252D]/50 hover:bg-slate-50 dark:hover:bg-white/[0.02] transition-colors">
                               <td className="py-4 pl-4 text-slate-600 dark:text-slate-400 font-medium whitespace-nowrap">{new Date(h.createdAt).toLocaleDateString()}</td>
                               <td className="py-4 text-[#0b132b] dark:text-slate-200 font-bold max-w-[150px] md:max-w-[200px] truncate" title={h.topicTitle || h.topicId}>{h.topicTitle || h.topicId}</td>
                               <td className="py-4">
                                 <span className="px-2 py-1 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded text-xs font-bold">{h.bandLevel}</span>
                               </td>
                               <td className="py-4 text-center">
                                 <span className={cn("font-bold", h.fluencyScore >= 80 ? "text-emerald-500" : h.fluencyScore >= 60 ? "text-amber-500" : "text-rose-500")}>
                                   {h.fluencyScore}
                                 </span>
                               </td>
                               <td className="py-4 text-center font-mono text-slate-600 dark:text-slate-400">{h.weightedWpm}</td>
                               <td className="py-4 text-right pr-4 font-bold text-[#8a42f5] dark:text-[#a874f7]">
                                 {h.keywordsHit}/{h.totalKeywords}
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

          {/* ──────────────────────────── READING TAB ──────────────────────── */}
          {activeTab === 'reading' && (
            readingLoading ? <HistorySkeleton /> :
            readingHistory.length === 0 ? (
              <EmptyState
                icon={<SpeedIcon className="w-10 h-10 text-slate-400" />}
                title="No Speed Reading History"
                desc="This student hasn't completed any Speed Reading Practice sessions yet."
              />
            ) : (
              <div className="space-y-8 animate-in slide-in-from-bottom-4 duration-500">

                {/* Stat Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <StatCard icon={<Zap />} label="Avg Reading Speed" value={`${readingStats.avgWPM} WPM`} color="text-[#8a42f5]" bg="bg-[#8a42f5]/10" />
                  <StatCard icon={<CheckCircle />} label="Avg Accuracy" value={`${readingStats.avgAccuracy}%`} color="text-emerald-500" bg="bg-emerald-50 dark:bg-emerald-500/10" />
                  <StatCard icon={<Award />} label="Best Score" value={`${readingStats.bestScore}/100`} color="text-amber-500" bg="bg-amber-50 dark:bg-amber-500/10" />
                  <StatCard icon={<BarChart2 />} label="Total Sessions" value={readingStats.totalSessions} color="text-blue-500" bg="bg-blue-50 dark:bg-blue-500/10" />
                </div>

                {/* WPM Progression Chart */}
                <div className="bg-white dark:bg-[#15141B] p-4 md:p-6 rounded-3xl shadow-sm border border-slate-200 dark:border-[#26252D]">
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-6">Reading Performance Progression</h3>
                  <div className="h-[250px] md:h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={readingChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                        <defs>
                          <linearGradient id="colorWpm" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#8a42f5" stopOpacity={0.3} />
                            <stop offset="95%" stopColor="#8a42f5" stopOpacity={0} />
                          </linearGradient>
                          <linearGradient id="colorAcc" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                            <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" strokeOpacity={0.4} />
                        <XAxis dataKey="name" tick={{ fontSize: 12, fill: '#64748b' }} axisLine={false} tickLine={false} />
                        <YAxis tick={{ fontSize: 12, fill: '#64748b' }} axisLine={false} tickLine={false} />
                        <Tooltip
                          contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', backgroundColor: '#fff' }}
                          labelStyle={{ color: '#0b132b', fontWeight: 'bold' }}
                          formatter={(value: any, name: string) => [`${value}${name === 'accuracy' ? '%' : name === 'wpm' ? ' WPM' : ''}`, name === 'wpm' ? 'WPM' : name === 'accuracy' ? 'Accuracy' : 'Score']}
                        />
                        <Area type="monotone" dataKey="wpm" stroke="#8a42f5" strokeWidth={3} fillOpacity={1} fill="url(#colorWpm)" name="wpm" />
                        <Line type="monotone" dataKey="accuracy" stroke="#10b981" strokeWidth={3} dot={false} name="accuracy" />
                        <Line type="monotone" dataKey="score" stroke="#f59e0b" strokeWidth={2} dot={false} strokeDasharray="5 3" name="score" />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                  {/* Legend */}
                  <div className="flex flex-wrap items-center gap-5 mt-6 justify-center text-xs font-semibold text-slate-500">
                    <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-[#8a42f5]" />WPM</span>
                    <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-emerald-500" />Accuracy</span>
                    <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-amber-500" />Speed Score</span>
                  </div>
                </div>

                {/* Session History Table */}
                <div className="bg-white dark:bg-[#15141B] rounded-3xl p-4 md:p-6 shadow-sm border border-slate-200 dark:border-[#26252D] overflow-hidden">
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-5">Reading Sessions</h3>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse min-w-[700px]">
                      <thead>
                        <tr className="border-b border-slate-100 dark:border-[#26252D] text-slate-500 text-xs font-bold uppercase tracking-wider">
                          <th className="pb-3 pl-4">Date</th>
                          <th className="pb-3">Category</th>
                          <th className="pb-3">Difficulty</th>
                          <th className="pb-3 text-center">WPM</th>
                          <th className="pb-3 text-center">Accuracy</th>
                          <th className="pb-3 text-center">Score</th>
                          <th className="pb-3 text-right pr-4">Integrity</th>
                        </tr>
                      </thead>
                      <tbody className="text-sm">
                        {readingHistory.map((r, i) => (
                          <tr key={i} className="border-b border-slate-50 dark:border-[#26252D]/50 hover:bg-slate-50 dark:hover:bg-white/[0.02] transition-colors">
                            <td className="py-4 pl-4 text-slate-600 dark:text-slate-400 font-medium">
                              {new Date(r.createdAt).toLocaleDateString()}
                            </td>
                            <td className="py-4 text-slate-700 dark:text-slate-200 font-medium capitalize max-w-[150px] truncate">
                              {r.category || r.passageTitle || 'Reading Practice'}
                            </td>
                            <td className="py-4">
                              <span className={cn("px-2 py-0.5 rounded-full text-xs font-bold capitalize", getDifficultyColor(r.difficulty || 'medium'))}>
                                {r.difficulty || 'Medium'}
                              </span>
                            </td>
                            <td className="py-4 text-center font-mono font-bold text-[#8a42f5]">
                              {Math.round(r.wpm || r.actualWPM || 0)}
                            </td>
                            <td className="py-4 text-center">
                              <span className={cn("font-bold", getScoreColor(r.accuracy || 0))}>{Math.round(r.accuracy || 0)}%</span>
                            </td>
                            <td className="py-4 text-center">
                              <span className={cn("font-bold", getScoreColor(r.speedLearningScore || 0))}>{Math.round(r.speedLearningScore || 0)}</span>
                            </td>
                            <td className="py-4 text-right pr-4">
                              <div className="flex items-center justify-end gap-1.5">
                                <div className="w-16 h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                                  <div
                                    className={cn("h-full rounded-full", (r.integrityScore ?? 100) >= 80 ? 'bg-emerald-500' : (r.integrityScore ?? 100) >= 60 ? 'bg-amber-500' : 'bg-rose-500')}
                                    style={{ width: `${r.integrityScore ?? 100}%` }}
                                  />
                                </div>
                                <span className={cn("text-xs font-bold", getScoreColor(r.integrityScore ?? 100))}>{Math.round(r.integrityScore ?? 100)}%</span>
                              </div>
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

          {/* ──────────────────────────── WRITING TAB ──────────────────────────── */}
          {activeTab === 'writing' && (
            writingLoading ? <HistorySkeleton /> :
            writingHistory.length === 0 ? (
              <EmptyState
                icon={<PenTool className="w-10 h-10 text-slate-400" />}
                title="No Writing History"
                desc="This student hasn't completed any Writing Practice sessions yet."
              />
            ) : (
                <div className="space-y-8 animate-in slide-in-from-bottom-4 duration-500">
                  {/* Chart for Writing Progress */}
                  <div className="bg-white dark:bg-[#15141B] p-4 md:p-6 rounded-3xl shadow-sm border border-slate-200 dark:border-[#26252D]">
                      <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-6">AI Band Score Growth</h3>
                      <div className="h-[250px] md:h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                          <LineChart data={[...writingHistory].reverse().map((w, i) => ({
                            name: `Task ${i+1}`,
                            score: parseFloat(w.aiBandScore || "0"),
                            date: new Date(w.createdAt).toLocaleDateString()
                          }))} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                             <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" strokeOpacity={0.4} />
                             <XAxis dataKey="name" tick={{ fontSize: 12, fill: '#64748b' }} axisLine={false} tickLine={false} />
                             <YAxis tick={{ fontSize: 12, fill: '#64748b' }} axisLine={false} tickLine={false} domain={[0, 9]} ticks={[0, 1, 2, 3, 4, 5, 6, 7, 8, 9]}/>
                             <Tooltip
                                 contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', backgroundColor: '#fff' }}
                                 labelStyle={{ color: '#0b132b', fontWeight: 'bold' }}
                             />
                             <Line type="monotone" dataKey="score" stroke="#f59e0b" strokeWidth={3} dot={{r: 4, strokeWidth: 2}} activeDot={{r: 6}} name="Band Score" />
                          </LineChart>
                        </ResponsiveContainer>
                      </div>
                  </div>

                  {/* Writing Table List */}
                  <div className="bg-white dark:bg-[#15141B] rounded-3xl p-4 md:p-6 shadow-sm border border-slate-200 dark:border-[#26252D] overflow-hidden">
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-5">Writing Assignments</h3>
                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse min-w-[700px]">
                        <thead>
                          <tr className="border-b border-slate-100 dark:border-[#26252D] text-slate-500 text-xs font-bold uppercase tracking-wider">
                            <th className="pb-3 pl-4">Date</th>
                            <th className="pb-3">Task Prompt</th>
                            <th className="pb-3 text-center">Word Count</th>
                            <th className="pb-3 text-center">AI Grade</th>
                            <th className="pb-3 text-center">Manual Grade</th>
                            <th className="pb-3 text-right pr-4">Action</th>
                          </tr>
                        </thead>
                        <tbody className="text-sm">
                           {writingHistory.map((w, i) => (
                             <tr key={i} className="border-b border-slate-50 dark:border-[#26252D]/50 hover:bg-slate-50 dark:hover:bg-white/[0.02] transition-colors">
                                <td className="py-4 pl-4 text-slate-600 dark:text-slate-400 font-medium">
                                  {new Date(w.createdAt).toLocaleDateString()}
                                </td>
                                <td className="py-4 text-[#0b132b] dark:text-slate-200 font-bold max-w-[200px] truncate" title={w.IeltsWritingTask?.topic || 'N/A'}>
                                  {w.IeltsWritingTask?.title || 'Custom Answer'}
                                </td>
                                <td className="py-4 text-center font-mono">
                                  {w.wordCount}
                                </td>
                                <td className="py-4 text-center">
                                  <span className="px-2 py-1 bg-amber-50 dark:bg-amber-900/20 text-amber-600 font-bold rounded text-xs">{w.aiBandScore || 'N/A'}</span>
                                </td>
                                <td className="py-4 text-center">
                                  {w.manualBandScore ? (
                                    <span className="px-2 py-1 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 font-bold rounded text-xs">{w.manualBandScore}</span>
                                  ) : (
                                    <span className="text-slate-300 text-xs italic">Pending</span>
                                  )}
                                </td>
                                <td className="py-4 text-right pr-4">
                                   <Button size="sm" variant="outline" className="rounded-full text-xs hover:bg-[#8a42f5] hover:text-white hover:border-[#8a42f5]" onClick={() => {
                                      setSelectedAssessment(w);
                                      setGradingModalOpen(true);
                                   }}>
                                       Grade
                                   </Button>
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

          {/* Optional: Add Grade Modal Component here (GradingModalOpen) */}
          {gradingModalOpen && selectedAssessment && (
             <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in">
                 <div className="bg-white dark:bg-[#15141B] w-full max-w-2xl rounded-3xl p-6 md:p-8 shadow-2xl relative max-h-[90vh] overflow-y-auto">
                    <button onClick={() => setGradingModalOpen(false)} className="absolute top-4 right-4 text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors">
                       <ChevronLeft className="rotate-180 w-6 h-6" />
                    </button>
                    <h2 className="text-2xl font-bold mb-6 text-slate-900 dark:text-white">Evaluate Written Response</h2>
                    
                    <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl border border-slate-200 dark:border-slate-700 mb-6">
                        <p className="text-sm font-semibold text-slate-500 mb-2">Student's Content ({selectedAssessment.wordCount} words):</p>
                        <p className="text-slate-700 dark:text-slate-300 whitespace-pre-wrap font-serif leading-relaxed text-sm">
                          {selectedAssessment.writtenContent}
                        </p>
                    </div>

                    <div className="flex flex-col gap-4">
                        <div className="grid grid-cols-2 gap-4">
                           <div>
                              <label className="block text-xs font-bold text-slate-500 mb-1">AI Grade (Reference)</label>
                              <div className="text-xl font-bold text-amber-500">{selectedAssessment.aiBandScore || 'N/A'}</div>
                           </div>
                           <div>
                              <label className="block text-xs font-bold text-slate-500 mb-1">Your Override Score</label>
                              <input 
                                id="manualGradeInput" 
                                type="text"
                                defaultValue={selectedAssessment.manualBandScore || ''} 
                                placeholder="e.g. 7.5"
                                className="w-full bg-slate-100 dark:bg-slate-800 p-2 rounded-lg font-bold border-none outline-none focus:ring-2 focus:ring-[#8a42f5]" 
                              />
                           </div>
                        </div>
                        <div>
                           <label className="block text-xs font-bold text-slate-500 mb-1">Instructor Feedback</label>
                           <textarea 
                             id="manualFeedbackInput" 
                             defaultValue={selectedAssessment.manualFeedback || ''}
                             placeholder="Provide constructive feedback..."
                             className="w-full bg-slate-100 dark:bg-slate-800 p-3 rounded-xl min-h-[100px] text-sm border-none outline-none focus:ring-2 focus:ring-[#8a42f5]"
                           />
                        </div>
                    </div>
                    
                    <div className="mt-8 flex justify-end gap-3">
                        <Button variant="ghost" onClick={() => setGradingModalOpen(false)}>Cancel</Button>
                        <Button className="bg-[#8a42f5] hover:bg-[#722ed1] text-white rounded-full" onClick={async () => {
                             const score = (document.getElementById('manualGradeInput') as HTMLInputElement).value;
                             const feedback = (document.getElementById('manualFeedbackInput') as HTMLTextAreaElement).value;
                             
                             try {
                                const res = await callBackend(`${getBackendUrl()}/api/instructor/writing-assessment/${selectedAssessment.id}/grade`, {
                                   method: 'PATCH',
                                   body: JSON.stringify({
                                     bandScore: score,
                                     feedback: feedback
                                   })
                                });
                                if (res.success) {
                                   toast.success('Grade saved successfully!');
                                   setGradingModalOpen(false);
                                   loadWritingHistory(); // Refresh history
                                } else {
                                   toast.error('Failed to save grade.');
                                }
                             } catch(err) {
                                toast.error('An error occurred.');
                             }
                        }}>Save Evaluation</Button>
                    </div>
                 </div>
             </div>
          )}

        </main>
      </div>
    </div>
  );
}

// ─── Shared sub-components ────────────────────────────────────────────────────

const TabButton = ({ children, active, onClick, icon }: any) => (
    <button 
        onClick={onClick}
        className={cn(
            "flex items-center gap-1.5 md:gap-2 px-4 md:px-6 py-2 md:py-2.5 rounded-full text-sm font-semibold transition-all duration-300 whitespace-nowrap shrink-0",
            active 
              ? "bg-[#8a42f5] text-white shadow-md shadow-[#8a42f5]/20 transform md:scale-105" 
              : "text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
        )}
    >
        {icon}
        {children}
    </button>
)

const StatCard = ({ icon, label, value, color, bg }: any) => (
    <div className="bg-white dark:bg-[#15141B] p-6 rounded-3xl border border-slate-200 dark:border-[#26252D] shadow-[0_2px_10px_rgba(0,0,0,0.02)] flex flex-col justify-center">
      <div className="flex items-center gap-4 mb-4">
        <div className={cn("w-10 h-10 md:w-12 md:h-12 rounded-2xl flex items-center justify-center shrink-0", bg, color)}>
          {icon}
        </div>
        <div className="text-[10px] md:text-xs font-bold text-slate-400 uppercase tracking-widest leading-tight">{label}</div>
      </div>
      <div className={cn("text-2xl md:text-3xl font-black", color)}>{value}</div>
    </div>
);

const EmptyState = ({ icon, title, desc }: { icon: React.ReactNode; title: string; desc: string }) => (
  <div className="bg-white dark:bg-[#15141B] rounded-3xl p-8 md:p-12 text-center shadow-sm border border-slate-200 dark:border-[#26252D]">
    <div className="w-16 h-16 md:w-20 md:h-20 bg-slate-100 dark:bg-slate-800/50 rounded-full flex items-center justify-center mx-auto mb-4">{icon}</div>
    <h2 className="text-xl md:text-2xl font-bold text-slate-900 dark:text-white mb-2">{title}</h2>
    <p className="text-sm md:text-base text-slate-500 mb-6">{desc}</p>
  </div>
);

const LoadingSpinner = () => (
  <div className="flex flex-col items-center justify-center h-64 text-slate-400">
    <Loader2 className="w-8 h-8 animate-spin text-[#8a42f5] mb-4" />
    <p>Loading analytics...</p>
  </div>
);