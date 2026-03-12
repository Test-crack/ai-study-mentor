import { useState, useEffect, useMemo } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { 
  ChevronLeft, Activity, Target, Clock, Zap, 
  TrendingUp, Award, AlertTriangle, Loader2, Mic, Eye, Zap as SpeedIcon, 
  PenTool,
  Headphones,
  BookOpen
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

type TabType = 'speaking' | 'listening' | 'speed' | 'reading' | 'writing';

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

export default function InstructorStudentProgressPage() {
  const navigate = useNavigate();
  const { studentId } = useParams();
  const location = useLocation();
  const student = location.state?.student; // from the navigate state

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
      const res = await callBackend(`${getBackendUrl()}/api/instructor/students/${studentId}/reading-history`);
      if (res.success) {
        setHistory(res.data);
      } else {
        toast.error("Failed to load history data.");
      }
    } catch (err: any) {
      toast.error(err.message || "Could not fetch analytics.");
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
                  <TabButton active={activeTab === 'listening'} onClick={() => setActiveTab('listening')} icon={<Headphones className="w-4 h-4" />}>Listening</TabButton>
                  <TabButton active={activeTab === 'reading'} onClick={() => setActiveTab('reading')} icon={<BookOpen className="w-4 h-4" />}>Reading</TabButton>
                  <TabButton active={activeTab === 'speed'} onClick={() => setActiveTab('speed')} icon={<SpeedIcon className="w-4 h-4" />}>Speed Reading</TabButton>
                  <TabButton active={activeTab === 'writing'} onClick={() => setActiveTab('writing')} icon={<PenTool className="w-4 h-4" />}>Writing</TabButton>
              </div>
            </div>
          </div>

          {activeTab === 'speaking' && (
              isLoading ? (
                <HistorySkeleton />
              ) : history.length === 0 ? (
                <div className="bg-white dark:bg-[#15141B] rounded-3xl p-8 md:p-12 text-center shadow-sm border border-slate-200 dark:border-[#26252D]">
                    <div className="w-16 h-16 md:w-20 md:h-20 bg-slate-100 dark:bg-slate-800/50 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Target className="w-8 h-8 md:w-10 md:h-10 text-slate-400" />
                    </div>
                    <h2 className="text-xl md:text-2xl font-bold text-slate-900 dark:text-white mb-2">No Practice History Yet</h2>
                    <p className="text-sm md:text-base text-slate-500 mb-6">This student hasn't completed any Speaking Practice sessions yet.</p>
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

                  {/* Charts Section */}
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <div className="lg:col-span-2 bg-white dark:bg-[#15141B] p-4 md:p-6 rounded-3xl shadow-sm border border-slate-200 dark:border-[#26252D]">
                      <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-6">Fluency Progression</h3>
                      <div className="h-[250px] md:h-[300px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                          <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
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
                       <div className="flex items-center gap-2 mb-6">
                          <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0" />
                          <h3 className="font-bold text-[#8a6a24] dark:text-amber-500">Historical Fillers</h3>
                       </div>
                       <p className="text-sm text-[#8a6a24]/80 dark:text-slate-400 mb-6">Words that most commonly disrupt this student's fluency across all sessions.</p>
                       
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
                           {history.map((h, i) => (
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

          {/* Speed Reading Section */}
          {activeTab === 'speed' && (
              <div className="bg-white dark:bg-[#15141B] rounded-3xl p-6 md:p-12 text-center shadow-sm border border-slate-200 dark:border-[#26252D] mt-8 animate-in slide-in-from-bottom-4">
                  <div className="w-16 h-16 md:w-20 md:h-20 bg-teal-50 dark:bg-teal-900/20 rounded-full flex items-center justify-center mx-auto mb-6">
                      <SpeedIcon className="w-8 h-8 md:w-10 md:h-10 text-teal-500" />
                  </div>
                  <h2 className="text-xl md:text-2xl font-bold text-slate-900 dark:text-white mb-3">Reading Comprehension & WPM</h2>
                  <p className="text-sm md:text-base text-slate-500 max-w-md mx-auto mb-8">This module maps the student's structural comprehension and raw Words Per Minute across reading texts.</p>
                  
                  <div className="max-w-xl mx-auto grid grid-cols-1 sm:grid-cols-2 gap-4 opacity-50">
                     <div className="bg-slate-50 dark:bg-slate-800 p-6 rounded-xl border border-slate-100 dark:border-slate-700">
                         <div className="text-3xl md:text-4xl font-black text-teal-500 mb-2">320</div>
                         <div className="text-xs font-bold text-slate-400 uppercase">Avg WPM Map</div>
                     </div>
                     <div className="bg-slate-50 dark:bg-slate-800 p-6 rounded-xl border border-slate-100 dark:border-slate-700">
                         <div className="text-3xl md:text-4xl font-black text-emerald-500 mb-2">85%</div>
                         <div className="text-xs font-bold text-slate-400 uppercase">Retention Ratio</div>
                     </div>
                  </div>
              </div>
          )}

          {/* Listening Section */}
          {activeTab === 'listening' && (
              <div className="bg-white dark:bg-[#15141B] rounded-3xl p-6 md:p-12 text-center shadow-sm border border-slate-200 dark:border-[#26252D] mt-8 animate-in slide-in-from-bottom-4">
                  <div className="w-16 h-16 md:w-20 md:h-20 bg-blue-50 dark:bg-blue-900/20 rounded-full flex items-center justify-center mx-auto mb-6">
                      <Headphones className="w-8 h-8 md:w-10 md:h-10 text-blue-500" />
                  </div>
                  <h2 className="text-xl md:text-2xl font-bold text-slate-900 dark:text-white mb-3">Auditory Processing & Recall</h2>
                  <p className="text-sm md:text-base text-slate-500 max-w-md mx-auto mb-8">This module analyzes the student's ability to extract key information and maintain focus during audio-based exercises.</p>
                  
                  <div className="max-w-xl mx-auto grid grid-cols-1 sm:grid-cols-2 gap-4 opacity-50">
                      <div className="bg-slate-50 dark:bg-slate-800 p-6 rounded-xl border border-slate-100 dark:border-slate-700">
                          <div className="text-3xl md:text-4xl font-black text-blue-500 mb-2">92%</div>
                          <div className="text-xs font-bold text-slate-400 uppercase">Focus Score</div>
                      </div>
                      <div className="bg-slate-50 dark:bg-slate-800 p-6 rounded-xl border border-slate-100 dark:border-slate-700">
                          <div className="text-3xl md:text-4xl font-black text-indigo-500 mb-2">14m</div>
                          <div className="text-xs font-bold text-slate-400 uppercase">Avg. Listen Time</div>
                      </div>
                  </div>
              </div>
          )}

          {/* Reading Section */}
          {activeTab === 'reading' && (
              <div className="bg-white dark:bg-[#15141B] rounded-3xl p-6 md:p-12 text-center shadow-sm border border-slate-200 dark:border-[#26252D] mt-8 animate-in slide-in-from-bottom-4">
                  <div className="w-16 h-16 md:w-20 md:h-20 bg-purple-50 dark:bg-purple-900/20 rounded-full flex items-center justify-center mx-auto mb-6">
                      <BookOpen className="w-8 h-8 md:w-10 md:h-10 text-purple-500" />
                  </div>
                  <h2 className="text-xl md:text-2xl font-bold text-slate-900 dark:text-white mb-3">Critical Analysis & Contextual Inference</h2>
                  <p className="text-sm md:text-base text-slate-500 max-w-md mx-auto mb-8">This module evaluates the student's ability to identify core themes, infer meaning from context, and analyze narrative structures.</p>
                  
                  <div className="max-w-xl mx-auto grid grid-cols-1 sm:grid-cols-2 gap-4 opacity-50">
                      <div className="bg-slate-50 dark:bg-slate-800 p-6 rounded-xl border border-slate-100 dark:border-slate-700">
                          <div className="text-3xl md:text-4xl font-black text-purple-500 mb-2">94%</div>
                          <div className="text-xs font-bold text-slate-400 uppercase">Inference Accuracy</div>
                      </div>
                      <div className="bg-slate-50 dark:bg-slate-800 p-6 rounded-xl border border-slate-100 dark:border-slate-700">
                          <div className="text-3xl md:text-4xl font-black text-fuchsia-500 mb-2">12/15</div>
                          <div className="text-xs font-bold text-slate-400 uppercase">Thematic Mastery</div>
                      </div>
                  </div>
              </div>
          )}

          {/* Writing Section */}
          {activeTab === 'writing' && (
              <div className="bg-white dark:bg-[#15141B] rounded-3xl p-6 md:p-12 text-center shadow-sm border border-slate-200 dark:border-[#26252D] mt-8 animate-in slide-in-from-bottom-4">
                  <div className="w-16 h-16 md:w-20 md:h-20 bg-amber-50 dark:bg-amber-900/20 rounded-full flex items-center justify-center mx-auto mb-6">
                      <PenTool className="w-8 h-8 md:w-10 md:h-10 text-amber-500" />
                  </div>
                  <h2 className="text-xl md:text-2xl font-bold text-slate-900 dark:text-white mb-3">Linguistic Composition & Syntax</h2>
                  <p className="text-sm md:text-base text-slate-500 max-w-md mx-auto mb-8">This module tracks grammatical precision, vocabulary diversity, and structural flow in written responses.</p>
                  
                  <div className="max-w-xl mx-auto grid grid-cols-1 sm:grid-cols-2 gap-4 opacity-50">
                      <div className="bg-slate-50 dark:bg-slate-800 p-6 rounded-xl border border-slate-100 dark:border-slate-700">
                          <div className="text-3xl md:text-4xl font-black text-amber-500 mb-2">A-</div>
                          <div className="text-xs font-bold text-slate-400 uppercase">Grammar Accuracy</div>
                      </div>
                      <div className="bg-slate-50 dark:bg-slate-800 p-6 rounded-xl border border-slate-100 dark:border-slate-700">
                          <div className="text-3xl md:text-4xl font-black text-orange-500 mb-2">1.2k</div>
                          <div className="text-xs font-bold text-slate-400 uppercase">Vocabulary Bank</div>
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