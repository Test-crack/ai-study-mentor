import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ChevronLeft, Activity, Target, Clock, Zap, 
  TrendingUp, Award, AlertTriangle, Loader2 
} from 'lucide-react';
import { Button } from '@/shared/components/ui/button';
import { StudentSidebar } from './dashboard/StudentSidebar';
import { StudentTopbar } from './dashboard/StudentTopbar';
import { cn } from "@/shared/utils";
import { fetchSpeakingHistory } from '../services/ieltsReadingService';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { toast } from 'sonner';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  AreaChart, Area
} from 'recharts';

// ─── Skeletons ────────────────────────────────────────────────────────────────

function HistorySkeleton() {
  return (
    <div className="space-y-8 animate-pulse">
      {/* Stat Cards Skeleton */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="bg-white dark:bg-slate-900 p-6 rounded-3xl border-none shadow-[0_2px_10px_rgba(0,0,0,0.04)] flex flex-col justify-center h-[136px]">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-12 h-12 rounded-2xl bg-slate-200 dark:bg-slate-800 shrink-0" />
              <div className="h-3 w-24 bg-slate-200 dark:bg-slate-800 rounded" />
            </div>
            <div className="h-8 w-20 bg-slate-200 dark:bg-slate-800 rounded" />
          </div>
        ))}
      </div>

      {/* Charts Section Skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 p-6 rounded-3xl shadow-sm border-none">
          <div className="h-6 w-48 bg-slate-200 dark:bg-slate-800 rounded mb-6" />
          <div className="h-[300px] w-full bg-slate-100 dark:bg-slate-800/50 rounded-xl" />
        </div>

        <div className="bg-[#fffbf0] dark:bg-amber-900/10 border border-amber-100 dark:border-amber-900/30 p-6 rounded-3xl">
          <div className="flex items-center gap-2 mb-6">
            <div className="w-5 h-5 bg-amber-200 dark:bg-amber-800/50 rounded-full shrink-0" />
            <div className="h-5 w-32 bg-amber-200 dark:bg-amber-800/50 rounded" />
          </div>
          <div className="h-4 w-full bg-amber-100 dark:bg-amber-900/30 rounded mb-2" />
          <div className="h-4 w-3/4 bg-amber-100 dark:bg-amber-900/30 rounded mb-6" />
          
          <div className="space-y-3">
            {[1, 2, 3, 4, 5].map(i => (
              <div key={i} className="flex items-center justify-between bg-white dark:bg-slate-800 p-3 rounded-xl border border-amber-100 dark:border-slate-700">
                <div className="h-4 w-16 bg-slate-200 dark:bg-slate-700 rounded" />
                <div className="h-4 w-12 bg-slate-200 dark:bg-slate-700 rounded" />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Table Skeleton */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-sm border-none overflow-hidden">
        <div className="h-6 w-32 bg-slate-200 dark:bg-slate-800 rounded mb-6" />
        <div className="w-full">
          {/* Header Row */}
          <div className="flex border-b border-slate-100 dark:border-slate-800 pb-3 mb-2">
            <div className="w-2/12 h-4 bg-slate-200 dark:bg-slate-800 rounded ml-4" />
            <div className="w-3/12 h-4 bg-slate-200 dark:bg-slate-800 rounded mx-4" />
            <div className="w-2/12 h-4 bg-slate-200 dark:bg-slate-800 rounded mx-4" />
            <div className="w-2/12 h-4 bg-slate-200 dark:bg-slate-800 rounded mx-4" />
            <div className="w-2/12 h-4 bg-slate-200 dark:bg-slate-800 rounded mx-4" />
            <div className="w-1/12 h-4 bg-slate-200 dark:bg-slate-800 rounded mr-4" />
          </div>
          {/* Data Rows */}
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="flex py-4 border-b border-slate-50 dark:border-slate-800/50 items-center">
              <div className="w-2/12 h-4 bg-slate-100 dark:bg-slate-800/50 rounded ml-4" />
              <div className="w-3/12 h-4 bg-slate-100 dark:bg-slate-800/50 rounded mx-4" />
              <div className="w-2/12 h-6 bg-slate-100 dark:bg-slate-800/50 rounded mx-4" />
              <div className="w-2/12 h-4 bg-slate-100 dark:bg-slate-800/50 rounded mx-4" />
              <div className="w-2/12 h-4 bg-slate-100 dark:bg-slate-800/50 rounded mx-4" />
              <div className="w-1/12 h-4 bg-slate-100 dark:bg-slate-800/50 rounded mr-4" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function StudentSpeakingHistoryPage() {
  const navigate = useNavigate();
  const { profile } = useAuth();
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [history, setHistory] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      try {
        const res = await fetchSpeakingHistory();
        if (res.success) {
          setHistory(res.data);
        } else {
          toast.error("Failed to load history data.");
        }
      } catch (err) {
        toast.error("Could not fetch analytics.");
      } finally {
        setIsLoading(false);
      }
    };
    loadData();
  }, []);

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
      name: `Session ${i + 1}`,
      fluency: h.fluencyScore,
      wpm: h.weightedWpm,
      date: new Date(h.createdAt).toLocaleDateString()
    }));
  }, [history]);

  const overallFillers = useMemo(() => {
    const fillerMap: Record<string, number> = {};
    history.forEach(h => {
        h.frequentFillers.forEach((f: any) => {
            fillerMap[f.word] = (fillerMap[f.word] || 0) + f.count;
        });
    });
    return Object.entries(fillerMap)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([word, count]) => ({ word, count }));
  }, [history]);

  return (
    <div className="min-h-screen bg-[#f1f3f9] dark:bg-slate-950 transition-colors duration-300 font-sans text-slate-800 dark:text-slate-200">
      <StudentSidebar 
        activeTab="assessments" 
        onTabChange={(tab) => navigate(`/${profile?.role?.toLowerCase()}/${tab}`)}
        isCollapsed={isSidebarCollapsed} 
        toggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)} 
      />

      <div className={cn("transition-all duration-300 min-h-screen flex flex-col", isSidebarCollapsed ? 'lg:pl-20' : 'lg:pl-64')}>
        <StudentTopbar onUpgradeClick={() => {}} />

        <main className="p-6 md:p-8 max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500 w-full">
          {/* Header */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-2">
            <div>
              <Button variant="ghost" className="mb-4 -ml-4 text-slate-500 hover:text-slate-900" onClick={() => navigate('/student/speaking-assessment')}>
                <ChevronLeft className="w-4 h-4 mr-1" /> Back to Practice
              </Button>
              <h1 className="text-3xl font-bold text-slate-900 dark:text-white flex items-center gap-3">
                <Activity className="w-8 h-8 text-[#8a42f5]" />
                Analytics & History
              </h1>
              <p className="text-slate-500 dark:text-slate-400 mt-1">Track your speaking progression over time.</p>
            </div>
          </div>

          {isLoading ? (
            <HistorySkeleton />
          ) : history.length === 0 ? (
            <div className="bg-white dark:bg-slate-900 rounded-3xl p-12 text-center shadow-sm">
                <div className="w-20 h-20 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Target className="w-10 h-10 text-slate-400" />
                </div>
                <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">No Practice History Yet</h2>
                <p className="text-slate-500 mb-6">Complete your first speaking practice to see your analytics dashboard here.</p>
                <Button onClick={() => navigate('/student/reading-assessment')} className="bg-[#8a42f5] hover:bg-[#7b3be6] text-white">Start Practicing</Button>
            </div>
          ) : (
            <div className="space-y-8">
              {/* Stat Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard icon={<TrendingUp />} label="Avg Fluency Score" value={`${stats.avgScore}/100`} color="text-emerald-500" bg="bg-emerald-50 dark:bg-emerald-500/10" />
                <StatCard icon={<Zap />} label="Peak Speaking Speed" value={`${stats.peakWpm} WPM`} color="text-[#8a42f5]" bg="bg-[#8a42f5]/10" />
                <StatCard icon={<Award />} label="Practice Sessions" value={stats.totalAssessments} color="text-blue-500" bg="bg-blue-50 dark:bg-blue-500/10" />
                <StatCard icon={<Target />} label="Keyword Hit Rate" value={`${stats.avgKeywords}%`} color="text-amber-500" bg="bg-amber-50 dark:bg-amber-500/10" />
              </div>

              {/* Charts Section */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 bg-white dark:bg-slate-900 p-6 rounded-3xl shadow-sm border-none">
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-6">Fluency Progression</h3>
                  <div className="h-[300px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                        <defs>
                          <linearGradient id="colorFluency" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#8a42f5" stopOpacity={0.3}/>
                            <stop offset="95%" stopColor="#8a42f5" stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                        <XAxis dataKey="name" tick={{ fontSize: 12, fill: '#64748b' }} axisLine={false} tickLine={false} />
                        <YAxis tick={{ fontSize: 12, fill: '#64748b' }} axisLine={false} tickLine={false} />
                        <Tooltip 
                            contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
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
                   <p className="text-sm text-[#8a6a24]/80 dark:text-slate-400 mb-6">Words that most commonly disrupt your fluency across all sessions.</p>
                   
                   <div className="space-y-3">
                     {overallFillers.length > 0 ? overallFillers.map((f, i) => (
                       <div key={i} className="flex items-center justify-between bg-white dark:bg-slate-800 p-3 rounded-xl border border-amber-100 dark:border-slate-700">
                           <span className="font-mono text-rose-500 font-bold uppercase">{f.word}</span>
                           <span className="text-sm font-black text-slate-400">{f.count}x Total</span>
                       </div>
                     )) : (
                       <div className="text-emerald-600 font-bold bg-emerald-50 dark:bg-emerald-900/20 p-4 rounded-xl">No significant filler usage detected! Your speech holds high structural integrity.</div>
                     )}
                   </div>
                </div>
              </div>

              {/* History List */}
              <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-sm border-none overflow-hidden">
                 <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-6">Past Sessions</h3>
                 <div className="overflow-x-auto">
                   <table className="w-full text-left border-collapse">
                     <thead>
                       <tr className="border-b border-slate-100 dark:border-slate-800 text-slate-500 text-sm font-semibold">
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
                         <tr key={i} className="border-b border-slate-50 dark:border-slate-800/50 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                           <td className="py-4 pl-4 text-slate-600 dark:text-slate-400 font-medium">{new Date(h.createdAt).toLocaleDateString()}</td>
                           <td className="py-4 text-[#0b132b] dark:text-slate-200 font-bold max-w-[200px] truncate">{h.topicTitle || h.topicId}</td>
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
          )}
        </main>
      </div>
    </div>
  );
}

const StatCard = ({ icon, label, value, color, bg }: any) => (
  <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border-none shadow-[0_2px_10px_rgba(0,0,0,0.04)] flex flex-col justify-center h-[136px]">
    <div className="flex items-center gap-4 mb-4">
      <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center", bg, color)}>
        {icon}
      </div>
      <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{label}</div>
    </div>
    <div className={cn("text-3xl font-black", color)}>{value}</div>
  </div>
);