import { useState, useEffect, useMemo } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import {
  ChevronLeft, Activity, Target, Clock, Zap,
  TrendingUp, Award, AlertTriangle, Loader2, Mic, Eye,
  BookOpen, BarChart2, CheckCircle, FileText
} from 'lucide-react';
import { Button } from '@/shared/components/ui/button';
import { InstructorSidebar } from '../components/dashboard/InstructorSidebar';
import { cn } from "@/shared/utils";
import { callBackend } from '@/features/auth/services/authClient';
import { getBackendUrl } from '@/shared/utils';
import { toast } from 'sonner';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  AreaChart, Area
} from 'recharts';

type TabType = 'speaking' | 'voice' | 'speed';

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

  // Speed reading tab
  const [readingHistory, setReadingHistory] = useState<ReadingSession[]>([]);
  const [readingLoading, setReadingLoading] = useState(false);

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
      // Graceful fallback — don't crash the page if this endpoint isn't live yet
      console.warn('Speed reading history endpoint not available:', err.message);
      setReadingHistory([]);
    } finally {
      setReadingLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'speaking') loadSpeakingHistory();
    if (activeTab === 'speed') loadReadingHistory();
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
    <div className="min-h-screen bg-[#f1f3f9] dark:bg-[#09090E] transition-colors duration-300 font-sans text-slate-800 dark:text-slate-200">
      <InstructorSidebar
        activeTab="batches"
        isCollapsed={isSidebarCollapsed}
        toggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
      />

      <div className={cn("transition-all duration-300 min-h-screen flex flex-col", isSidebarCollapsed ? 'lg:pl-20' : 'lg:pl-72')}>
        <main className="p-6 md:p-8 max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500 w-full pt-12">

          {/* Header */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-2">
            <div>
              <Button variant="ghost" className="mb-4 -ml-4 text-slate-500 hover:text-slate-900" onClick={() => navigate('/instructor/dashboard')}>
                <ChevronLeft className="w-4 h-4 mr-1" /> Back to Batches
              </Button>
              <h1 className="text-3xl font-bold text-slate-900 dark:text-white flex items-center gap-3">
                <Activity className="w-8 h-8 text-[#8a42f5]" />
                Student Analytics {student?.name ? `— ${student.name}` : ''}
              </h1>
              <p className="text-slate-500 dark:text-slate-400 mt-1">Deep dive into performance metrics and actionable insights.</p>
            </div>

            {/* Tab Switcher */}
            <div className="bg-white dark:bg-slate-900 rounded-full p-1.5 flex shadow-sm border border-slate-200 dark:border-slate-800">
              <TabButton active={activeTab === 'speaking'} onClick={() => setActiveTab('speaking')} icon={<Mic className="w-4 h-4" />}>Speaking</TabButton>
              <TabButton active={activeTab === 'voice'} onClick={() => setActiveTab('voice')} icon={<Eye className="w-4 h-4" />}>Voice Lab</TabButton>
              <TabButton active={activeTab === 'speed'} onClick={() => setActiveTab('speed')} icon={<BookOpen className="w-4 h-4" />}>Reading</TabButton>
            </div>
          </div>

          {/* ──────────────────────────── SPEAKING TAB ──────────────────────────── */}
          {activeTab === 'speaking' && (
            speakingLoading ? <LoadingSpinner /> :
            speakingHistory.length === 0 ? (
              <EmptyState icon={<Target className="w-10 h-10 text-slate-400" />} title="No Speaking History" desc="This student hasn't completed any Speaking Practice sessions yet." />
            ) : (
              <div className="space-y-8 animate-in slide-in-from-bottom-4 duration-500">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <StatCard icon={<TrendingUp />} label="Avg Fluency Score" value={`${speakingStats.avgScore}/100`} color="text-emerald-500" bg="bg-emerald-50 dark:bg-emerald-500/10" />
                  <StatCard icon={<Zap />} label="Peak Speaking Speed" value={`${speakingStats.peakWpm} WPM`} color="text-[#8a42f5]" bg="bg-[#8a42f5]/10" />
                  <StatCard icon={<Award />} label="Practice Sessions" value={speakingStats.totalAssessments} color="text-blue-500" bg="bg-blue-50 dark:bg-blue-500/10" />
                  <StatCard icon={<Target />} label="Keyword Hit Rate" value={`${speakingStats.avgKeywords}%`} color="text-amber-500" bg="bg-amber-50 dark:bg-amber-500/10" />
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                  <div className="lg:col-span-2 bg-white dark:bg-[#15141B] p-6 rounded-3xl shadow-sm border border-slate-200 dark:border-[#26252D]">
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-6">Fluency Progression</h3>
                    <div className="h-[280px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={speakingChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                          <defs>
                            <linearGradient id="colorFluency" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#8a42f5" stopOpacity={0.3} />
                              <stop offset="95%" stopColor="#8a42f5" stopOpacity={0} />
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" strokeOpacity={0.4} />
                          <XAxis dataKey="name" tick={{ fontSize: 12, fill: '#64748b' }} axisLine={false} tickLine={false} />
                          <YAxis tick={{ fontSize: 12, fill: '#64748b' }} axisLine={false} tickLine={false} />
                          <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', backgroundColor: '#fff' }} labelStyle={{ color: '#0b132b', fontWeight: 'bold' }} />
                          <Area type="monotone" dataKey="fluency" stroke="#8a42f5" strokeWidth={3} fillOpacity={1} fill="url(#colorFluency)" name="Fluency Score" />
                          <Line type="monotone" dataKey="wpm" stroke="#10b981" strokeWidth={3} dot={false} name="WPM" />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  <div className="bg-[#fffbf0] dark:bg-amber-900/10 border border-amber-100 dark:border-amber-900/30 p-6 rounded-3xl">
                    <div className="flex items-center gap-2 mb-4">
                      <AlertTriangle className="w-5 h-5 text-amber-500" />
                      <h3 className="font-bold text-[#8a6a24] dark:text-amber-500">Historical Fillers</h3>
                    </div>
                    <p className="text-xs text-[#8a6a24]/70 dark:text-slate-400 mb-4">Most common filler words across all sessions.</p>
                    <div className="space-y-2">
                      {overallFillers.length > 0 ? overallFillers.map((f, i) => (
                        <div key={i} className="flex items-center justify-between bg-white dark:bg-slate-800 p-3 rounded-xl border border-amber-100 dark:border-slate-700">
                          <span className="font-mono text-rose-500 font-bold uppercase">{f.word}</span>
                          <span className="text-sm font-black text-slate-400">{f.count}x</span>
                        </div>
                      )) : (
                        <div className="text-emerald-600 font-bold bg-emerald-50 dark:bg-emerald-900/20 p-4 rounded-xl text-sm">No significant filler usage!</div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Speaking history table */}
                <div className="bg-white dark:bg-[#15141B] rounded-3xl p-6 shadow-sm border border-slate-200 dark:border-[#26252D] overflow-hidden">
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-5">Past Sessions</h3>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="border-b border-slate-100 dark:border-[#26252D] text-slate-500 text-xs font-bold uppercase tracking-wider">
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
                            <td className="py-4 pl-4 text-slate-600 dark:text-slate-400 font-medium">{new Date(h.createdAt).toLocaleDateString()}</td>
                            <td className="py-4 text-[#0b132b] dark:text-slate-200 font-bold max-w-[200px] truncate">{h.topicTitle || h.topicId}</td>
                            <td className="py-4"><span className="px-2 py-1 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded text-xs font-bold">{h.bandLevel}</span></td>
                            <td className="py-4 text-center">
                              <span className={cn("font-bold", h.fluencyScore >= 80 ? "text-emerald-500" : h.fluencyScore >= 60 ? "text-amber-500" : "text-rose-500")}>{h.fluencyScore}</span>
                            </td>
                            <td className="py-4 text-center font-mono text-slate-600 dark:text-slate-400">{h.weightedWpm}</td>
                            <td className="py-4 text-right pr-4 font-bold text-[#8a42f5] dark:text-[#a874f7]">{h.keywordsHit}/{h.totalKeywords}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )
          )}

          {/* ──────────────────────────── VOICE LAB TAB ──────────────────────────── */}
          {activeTab === 'voice' && (
            <div className="bg-white dark:bg-[#15141B] rounded-3xl p-12 text-center shadow-sm border border-slate-200 dark:border-[#26252D] mt-8 animate-in slide-in-from-bottom-4">
              <div className="w-20 h-20 bg-indigo-50 dark:bg-indigo-900/20 rounded-full flex items-center justify-center mx-auto mb-6">
                <Eye className="w-10 h-10 text-indigo-500" />
              </div>
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-3">Vocal Pitch & Resonance (Voice Lab)</h2>
              <p className="text-slate-500 max-w-md mx-auto mb-8">This module tracks intonation, stress patterns, and pitch heatmaps across specialized vocal resonance tests.</p>
              <div className="max-w-2xl mx-auto border border-dashed border-slate-200 dark:border-slate-800 rounded-xl p-8 bg-slate-50 dark:bg-[#0A0A0B]">
                <div className="h-[150px] w-full flex items-end justify-between gap-1 mb-4 opacity-50">
                  {Array.from({ length: 40 }).map((_, i) => (
                    <div key={i} className="w-full bg-indigo-400 rounded-t-sm" style={{ height: `${Math.max(10, Math.sin(i * 0.2) * 100 + Math.random() * 50)}%` }} />
                  ))}
                </div>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Mock Spectrogram — Feature Coming Soon</p>
              </div>
            </div>
          )}

          {/* ──────────────────────────── SPEED READING TAB ──────────────────────── */}
          {activeTab === 'speed' && (
            readingLoading ? <LoadingSpinner /> :
            readingHistory.length === 0 ? (
              <EmptyState
                icon={<BookOpen className="w-10 h-10 text-slate-400" />}
                title="No Reading History"
                desc="This student hasn't completed any Reading Practice sessions yet."
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
                <div className="bg-white dark:bg-[#15141B] p-6 rounded-3xl shadow-sm border border-slate-200 dark:border-[#26252D]">
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-6">Reading Performance Progression</h3>
                  <div className="h-[280px]">
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
                  <div className="flex items-center gap-5 mt-4 justify-center text-xs font-semibold text-slate-500">
                    <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-[#8a42f5]" />WPM</span>
                    <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-emerald-500" />Accuracy</span>
                    <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-amber-500" />Speed Score</span>
                  </div>
                </div>

                {/* Session History Table */}
                <div className="bg-white dark:bg-[#15141B] rounded-3xl p-6 shadow-sm border border-slate-200 dark:border-[#26252D] overflow-hidden">
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-5">Reading Sessions</h3>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
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
      "flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-semibold transition-all duration-300",
      active
        ? "bg-[#8a42f5] text-white shadow-md shadow-[#8a42f5]/20 transform scale-105"
        : "text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
    )}
  >
    {icon}
    {children}
  </button>
);

const StatCard = ({ icon, label, value, color, bg }: any) => (
  <div className="bg-white dark:bg-[#15141B] p-6 rounded-3xl border border-slate-200 dark:border-[#26252D] shadow-[0_2px_10px_rgba(0,0,0,0.02)] flex flex-col justify-center">
    <div className="flex items-center gap-4 mb-4">
      <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center", bg, color)}>{icon}</div>
      <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{label}</div>
    </div>
    <div className={cn("text-3xl font-black", color)}>{value}</div>
  </div>
);

const LoadingSpinner = () => (
  <div className="flex flex-col items-center justify-center h-64 text-slate-400">
    <Loader2 className="w-8 h-8 animate-spin text-[#8a42f5] mb-4" />
    <p>Loading analytics...</p>
  </div>
);

const EmptyState = ({ icon, title, desc }: { icon: React.ReactNode; title: string; desc: string }) => (
  <div className="bg-white dark:bg-[#15141B] rounded-3xl p-12 text-center shadow-sm border border-slate-200 dark:border-[#26252D]">
    <div className="w-20 h-20 bg-slate-100 dark:bg-slate-800/50 rounded-full flex items-center justify-center mx-auto mb-4">{icon}</div>
    <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">{title}</h2>
    <p className="text-slate-500">{desc}</p>
  </div>
);
