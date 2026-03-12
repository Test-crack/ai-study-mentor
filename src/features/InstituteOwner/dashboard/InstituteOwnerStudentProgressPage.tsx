// src/features/institute-owner/pages/InstituteOwnerStudentProgressPage.tsx

import { useState, useEffect, useMemo } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import {
  ChevronLeft, Activity, Target, Zap,
  TrendingUp, Award, AlertTriangle, Loader2, Mic, Eye, Zap as SpeedIcon
} from 'lucide-react';
import { Button } from '@/shared/components/ui/button';
import { InstituteOwnerSidebar } from '../components/InstitiuteOwnerSidebar';
import { InstituteOwnerTopbar } from '../components/InstituteOwnerTopbar';
import { cn } from '@/shared/utils';
import { callBackend } from '@/features/auth/services/authClient';
import { getBackendUrl } from '@/shared/utils';
import { toast } from 'sonner';
import {
  AreaChart, Area, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';

type TabType = 'speaking' | 'voice' | 'speed';

export default function InstituteOwnerStudentProgressPage() {
  const navigate = useNavigate();
  const { studentId } = useParams();
  const location = useLocation();
  const student = location.state?.student;

  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [activeTab, setActiveTab] = useState<TabType>('speaking');
  const [history, setHistory] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (activeTab === 'speaking' && studentId) {
      loadSpeakingHistory();
    }
  }, [activeTab, studentId]);

  const loadSpeakingHistory = async () => {
    setIsLoading(true);
    try {
      // ✅ Uses institute-owner endpoint instead of instructor
      const res = await callBackend(
`${getBackendUrl()}/api/instructor/students/${studentId}/reading-history`
      );
      if (res.success) {
        setHistory(res.data);
      } else {
        toast.error('Failed to load history data.');
      }
    } catch (err: any) {
      toast.error(err.message || 'Could not fetch analytics.');
    } finally {
      setIsLoading(false);
    }
  };

  const stats = useMemo(() => {
    if (!history.length) return { avgScore: 0, peakWpm: 0, totalAssessments: 0, avgKeywords: 0 };
    const avgScore = history.reduce((acc, curr) => acc + curr.fluencyScore, 0) / history.length;
    const peakWpm = Math.max(...history.map(h => h.weightedWpm));
    let totalKeywordsHit = 0;
    let totalKeywordsPossible = 0;
    history.forEach(h => {
      totalKeywordsHit += h.keywordsHit;
      totalKeywordsPossible += h.totalKeywords;
    });
    const avgKeywords = totalKeywordsPossible > 0 ? (totalKeywordsHit / totalKeywordsPossible) * 100 : 0;
    return {
      avgScore: Math.round(avgScore),
      peakWpm: Math.round(peakWpm),
      totalAssessments: history.length,
      avgKeywords: Math.round(avgKeywords)
    };
  }, [history]);

  const chartData = useMemo(() => {
    return [...history].reverse().map((h, i) => ({
      name: `S ${i + 1}`,
      fluency: h.fluencyScore,
      wpm: h.weightedWpm,
      date: new Date(h.createdAt).toLocaleDateString()
    }));
  }, [history]);

  const overallFillers = useMemo(() => {
    const fillerMap: Record<string, number> = {};
    history.forEach(h => {
      h.frequentFillers?.forEach((f: any) => {
        fillerMap[f.word] = (fillerMap[f.word] || 0) + f.count;
      });
    });
    return Object.entries(fillerMap)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([word, count]) => ({ word, count }));
  }, [history]);

  return (
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-[#0a0a0a] transition-colors duration-300 font-sans text-slate-800 dark:text-slate-200">
      {/* ✅ Owner Sidebar */}
      <div className="hidden lg:block">
        <InstituteOwnerSidebar
          activeTab="insight"
          isCollapsed={isSidebarCollapsed}
          toggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
        />
      </div>

      <div className={cn(
        'transition-all duration-300 min-h-screen flex flex-col',
        isSidebarCollapsed ? 'lg:pl-20' : 'lg:pl-64'
      )}>
        {/* ✅ Owner Topbar */}
        <InstituteOwnerTopbar />

        <main className="p-6 md:p-8 max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500 w-full">

          {/* Header */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-2">
            <div>
              <Button
                variant="ghost"
                className="mb-4 -ml-4 text-slate-500 hover:text-slate-900"
                onClick={() => navigate(-1)}
              >
                <ChevronLeft className="w-4 h-4 mr-1" /> Back
              </Button>
              <h1 className="text-3xl font-bold text-slate-900 dark:text-white flex items-center gap-3">
                <Activity className="w-8 h-8 text-[#8a42f5]" />
                Student Analytics {student?.name ? `- ${student.name}` : ''}
              </h1>
              <p className="text-slate-500 dark:text-slate-400 mt-1">
                Deep dive into performance metrics and actionable insights.
              </p>
            </div>

            <div className="bg-white dark:bg-slate-900 rounded-full p-1.5 flex shadow-sm border border-slate-200 dark:border-slate-800">
              <TabButton active={activeTab === 'speaking'} onClick={() => setActiveTab('speaking')} icon={<Mic className="w-4 h-4" />}>Speaking Practice</TabButton>
              <TabButton active={activeTab === 'voice'} onClick={() => setActiveTab('voice')} icon={<Eye className="w-4 h-4" />}>Voice Lab</TabButton>
              <TabButton active={activeTab === 'speed'} onClick={() => setActiveTab('speed')} icon={<SpeedIcon className="w-4 h-4" />}>Speed Reading</TabButton>
            </div>
          </div>

          {/* Speaking Tab */}
          {activeTab === 'speaking' && (
            isLoading ? (
              <div className="flex flex-col items-center justify-center h-64 text-slate-400">
                <Loader2 className="w-8 h-8 animate-spin text-[#8a42f5] mb-4" />
                <p>Aggregating student history...</p>
              </div>
            ) : history.length === 0 ? (
              <div className="bg-white dark:bg-[#15141B] rounded-3xl p-12 text-center shadow-sm border border-slate-200 dark:border-[#26252D]">
                <div className="w-20 h-20 bg-slate-100 dark:bg-slate-800/50 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Target className="w-10 h-10 text-slate-400" />
                </div>
                <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">No Practice History Yet</h2>
                <p className="text-slate-500 mb-6">This student hasn't completed any Speaking Practice sessions yet.</p>
              </div>
            ) : (
              <div className="space-y-8 animate-in slide-in-from-bottom-4 duration-500">
                {/* Stat Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <StatCard icon={<TrendingUp />} label="Avg Fluency Score" value={`${stats.avgScore}/100`} color="text-emerald-500" bg="bg-emerald-50 dark:bg-emerald-500/10" />
                  <StatCard icon={<Zap />} label="Peak Speaking Speed" value={`${stats.peakWpm} WPM`} color="text-[#8a42f5]" bg="bg-[#8a42f5]/10" />
                  <StatCard icon={<Award />} label="Practice Sessions" value={stats.totalAssessments} color="text-blue-500" bg="bg-blue-50 dark:bg-blue-500/10" />
                  <StatCard icon={<Target />} label="Keyword Hit Rate" value={`${stats.avgKeywords}%`} color="text-amber-500" bg="bg-amber-50 dark:bg-amber-500/10" />
                </div>

                {/* Charts */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                  <div className="lg:col-span-2 bg-white dark:bg-[#15141B] p-6 rounded-3xl shadow-sm border border-slate-200 dark:border-[#26252D]">
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-6">Fluency Progression</h3>
                    <div className="h-[300px] w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                          <defs>
                            <linearGradient id="colorFluency" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#8a42f5" stopOpacity={0.3} />
                              <stop offset="95%" stopColor="#8a42f5" stopOpacity={0} />
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

                  <div className="bg-[#fffbf0] dark:bg-amber-900/10 border border-amber-100 dark:border-amber-900/30 p-6 rounded-3xl">
                    <div className="flex items-center gap-2 mb-6">
                      <AlertTriangle className="w-5 h-5 text-amber-500" />
                      <h3 className="font-bold text-[#8a6a24] dark:text-amber-500">Historical Fillers</h3>
                    </div>
                    <p className="text-sm text-[#8a6a24]/80 dark:text-slate-400 mb-6">
                      Words that most commonly disrupt this student's fluency across all sessions.
                    </p>
                    <div className="space-y-3">
                      {overallFillers.length > 0 ? overallFillers.map((f, i) => (
                        <div key={i} className="flex items-center justify-between bg-white dark:bg-slate-800 p-3 rounded-xl border border-amber-100 dark:border-slate-700">
                          <span className="font-mono text-rose-500 font-bold uppercase">{f.word}</span>
                          <span className="text-sm font-black text-slate-400">{f.count}x Total</span>
                        </div>
                      )) : (
                        <div className="text-emerald-600 font-bold bg-emerald-50 dark:bg-emerald-900/20 p-4 rounded-xl">
                          No significant filler usage detected!
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* History Table */}
                <div className="bg-white dark:bg-[#15141B] rounded-3xl p-6 shadow-sm border border-slate-200 dark:border-[#26252D] overflow-hidden">
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-6">Past Sessions</h3>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
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
                        {history.map((h, i) => (
                          <tr key={i} className="border-b border-slate-50 dark:border-[#26252D]/50 hover:bg-slate-50 dark:hover:bg-white/[0.02] transition-colors">
                            <td className="py-4 pl-4 text-slate-600 dark:text-slate-400 font-medium">{new Date(h.createdAt).toLocaleDateString()}</td>
                            <td className="py-4 text-[#0b132b] dark:text-slate-200 font-bold max-w-[200px] truncate">{h.topicTitle || h.topicId}</td>
                            <td className="py-4">
                              <span className="px-2 py-1 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded text-xs font-bold">{h.bandLevel}</span>
                            </td>
                            <td className="py-4 text-center">
                              <span className={cn('font-bold', h.fluencyScore >= 80 ? 'text-emerald-500' : h.fluencyScore >= 60 ? 'text-amber-500' : 'text-rose-500')}>
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

          {/* Voice Tab */}
          {activeTab === 'voice' && (
            <div className="bg-white dark:bg-[#15141B] rounded-3xl p-12 text-center shadow-sm border border-slate-200 dark:border-[#26252D] mt-8 animate-in slide-in-from-bottom-4">
              <div className="w-20 h-20 bg-indigo-50 dark:bg-indigo-900/20 rounded-full flex items-center justify-center mx-auto mb-6">
                <Eye className="w-10 h-10 text-indigo-500" />
              </div>
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-3">Vocal Pitch & Resonance (Voice Lab)</h2>
              <p className="text-slate-500 max-w-md mx-auto mb-8">Intonation, stress patterns, and pitch heatmaps across vocal resonance tests.</p>
              <div className="max-w-2xl mx-auto border border-dashed border-slate-200 dark:border-slate-800 rounded-xl p-8 bg-slate-50 dark:bg-[#0A0A0B]">
                <div className="h-[150px] w-full flex items-end justify-between gap-1 mb-4 opacity-50">
                  {Array.from({ length: 40 }).map((_, i) => (
                    <div key={i} className="w-full bg-indigo-400 rounded-t-sm" style={{ height: `${Math.max(10, Math.sin(i * 0.2) * 100 + Math.random() * 50)}%` }} />
                  ))}
                </div>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Mock Spectrogram Data</p>
              </div>
            </div>
          )}

          {/* Speed Tab */}
          {activeTab === 'speed' && (
            <div className="bg-white dark:bg-[#15141B] rounded-3xl p-12 text-center shadow-sm border border-slate-200 dark:border-[#26252D] mt-8 animate-in slide-in-from-bottom-4">
              <div className="w-20 h-20 bg-teal-50 dark:bg-teal-900/20 rounded-full flex items-center justify-center mx-auto mb-6">
                <SpeedIcon className="w-10 h-10 text-teal-500" />
              </div>
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-3">Reading Comprehension & WPM</h2>
              <p className="text-slate-500 max-w-md mx-auto mb-8">Maps the student's structural comprehension and raw WPM across reading texts.</p>
              <div className="max-w-xl mx-auto grid grid-cols-2 gap-4 opacity-50">
                <div className="bg-slate-50 dark:bg-slate-800 p-6 rounded-xl border border-slate-100 dark:border-slate-700">
                  <div className="text-4xl font-black text-teal-500 mb-2">320</div>
                  <div className="text-xs font-bold text-slate-400 uppercase">Avg WPM Map</div>
                </div>
                <div className="bg-slate-50 dark:bg-slate-800 p-6 rounded-xl border border-slate-100 dark:border-slate-700">
                  <div className="text-4xl font-black text-emerald-500 mb-2">85%</div>
                  <div className="text-xs font-bold text-slate-400 uppercase">Retention Ratio</div>
                </div>
              </div>
            </div>
          )}

        </main>
      </div>
    </div>
  );
}

const TabButton = ({ children, active, onClick, icon }: any) => (
  <button
    onClick={onClick}
    className={cn(
      'flex items-center gap-2 px-6 py-2.5 rounded-full text-sm font-semibold transition-all duration-300',
      active
        ? 'bg-[#8a42f5] text-white shadow-md shadow-[#8a42f5]/20 transform scale-105'
        : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800'
    )}
  >
    {icon}
    {children}
  </button>
);

const StatCard = ({ icon, label, value, color, bg }: any) => (
  <div className="bg-white dark:bg-[#15141B] p-6 rounded-3xl border border-slate-200 dark:border-[#26252D] shadow-[0_2px_10px_rgba(0,0,0,0.02)] flex flex-col justify-center">
    <div className="flex items-center gap-4 mb-4">
      <div className={cn('w-12 h-12 rounded-2xl flex items-center justify-center', bg, color)}>
        {icon}
      </div>
      <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{label}</div>
    </div>
    <div className={cn('text-3xl font-black', color)}>{value}</div>
  </div>
);