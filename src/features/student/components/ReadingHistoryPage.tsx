import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ChevronLeft, Activity, Target, Zap, 
  TrendingUp, Award, Loader2 
} from 'lucide-react';
import { Button } from '@/shared/components/ui/button';
import { StudentSidebar } from './dashboard/StudentSidebar';
import { StudentTopbar } from './dashboard/StudentTopbar';
import { cn } from "@/shared/utils";
import { fetchStudentReadingHistory } from '../services/readingPracticeService';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { toast } from 'sonner';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  AreaChart, Area
} from 'recharts';

export default function ReadingHistoryPage() {
  const navigate = useNavigate();
  const { profile } = useAuth();
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [history, setHistory] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      try {
        const res: any = await fetchStudentReadingHistory();
        if (Array.isArray(res)) {
          setHistory(res);
        } else if (res && res.success) {
          setHistory(res.data);
        } else {
          toast.error("Failed to load history data.");
        }
      } catch (err) {
        toast.error("Could not fetch reading analytics.");
      } finally {
        setIsLoading(false);
      }
    };
    loadData();
  }, []);

  const stats = useMemo(() => {
    if (!history.length) return { avgWpm: 0, peakWpm: 0, totalAssessments: 0, avgAccuracy: 0, avgScore: 0 };
    
    let totalWpm = 0;
    let totalAccuracy = 0;
    let totalScore = 0;
    let peakWpm = 0;

    history.forEach(h => {
        totalWpm += h.wpm;
        totalAccuracy += h.accuracy;
        totalScore += h.speedLearningScore;
        if (h.wpm > peakWpm) peakWpm = h.wpm;
    });

    return {
      avgWpm: Math.round(totalWpm / history.length),
      peakWpm: Math.round(peakWpm),
      totalAssessments: history.length,
      avgAccuracy: parseFloat((totalAccuracy / history.length).toFixed(1)),
      avgScore: Math.round(totalScore / history.length)
    };
  }, [history]);

  const chartData = useMemo(() => {
    return [...history].reverse().map((h, i) => ({
      name: `Session ${i + 1}`,
      accuracy: h.accuracy,
      score: h.speedLearningScore,
      wpm: h.wpm,
      date: new Date(h.createdAt).toLocaleDateString()
    }));
  }, [history]);

  return (
    <div className="min-h-screen bg-[#f1f3f9] dark:bg-slate-950 transition-colors duration-300 font-sans text-slate-800 dark:text-slate-200">
      <StudentSidebar 
        activeTab="reading" 
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
              <Button variant="ghost" className="mb-4 -ml-4 text-slate-500 hover:text-slate-900" onClick={() => navigate('/student/reading')}>
                <ChevronLeft className="w-4 h-4 mr-1" /> Back to Reading Practice
              </Button>
              <h1 className="text-3xl font-bold text-slate-900 dark:text-white flex items-center gap-3">
                <Activity className="w-8 h-8 text-[#0ea5e9]" />
                Reading Analytics & History
              </h1>
              <p className="text-slate-500 dark:text-slate-400 mt-1">Track your reading comprehension and speed over time.</p>
            </div>
          </div>

          {isLoading ? (
            <div className="flex flex-col items-center justify-center h-64 text-slate-400">
              <Loader2 className="w-8 h-8 animate-spin text-[#0ea5e9] mb-4" />
              <p>Loading your history...</p>
            </div>
          ) : history.length === 0 ? (
            <div className="bg-white dark:bg-slate-900 rounded-3xl p-12 text-center shadow-sm">
                <div className="w-20 h-20 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Target className="w-10 h-10 text-slate-400" />
                </div>
                <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">No Practice History Yet</h2>
                <p className="text-slate-500 mb-6">Complete your first reading practice session to see analytics here.</p>
                <Button onClick={() => navigate('/student/reading')} className="bg-[#0ea5e9] hover:bg-[#0284c7] text-white">Start Reading</Button>
            </div>
          ) : (
            <div className="space-y-8">
              {/* Stat Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard icon={<TrendingUp />} label="Avg Overall Score" value={`${stats.avgScore}/100`} color="text-emerald-500" bg="bg-emerald-50 dark:bg-emerald-500/10" />
                <StatCard icon={<Zap />} label="Peak Reading Speed" value={`${stats.peakWpm} WPM`} color="text-[#0ea5e9]" bg="bg-[#0ea5e9]/10" />
                <StatCard icon={<Award />} label="Practice Sessions" value={stats.totalAssessments} color="text-[#8a42f5]" bg="bg-[#8a42f5]/10" />
                <StatCard icon={<Target />} label="Avg Accuracy" value={`${stats.avgAccuracy}%`} color="text-amber-500" bg="bg-amber-50 dark:bg-amber-500/10" />
              </div>

              {/* Charts Section */}
              <div className="grid grid-cols-1 lg:grid-cols-1 gap-8">
                <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl shadow-sm border-none">
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-6">Reading Score Progression</h3>
                  <div className="h-[300px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                        <defs>
                          <linearGradient id="colorScore" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.3}/>
                            <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                        <XAxis dataKey="name" tick={{ fontSize: 12, fill: '#64748b' }} axisLine={false} tickLine={false} />
                        <YAxis tick={{ fontSize: 12, fill: '#64748b' }} axisLine={false} tickLine={false} />
                        <Tooltip 
                            contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                            labelStyle={{ color: '#0b132b', fontWeight: 'bold' }}
                        />
                        <Area type="monotone" dataKey="score" stroke="#0ea5e9" strokeWidth={3} fillOpacity={1} fill="url(#colorScore)" name="Overall Score" />
                        <Line type="monotone" dataKey="wpm" stroke="#8a42f5" strokeWidth={3} dot={false} name="WPM" />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>

              {/* History List */}
              <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-sm border-none overflow-hidden">
                 <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-6">Past Reading Sessions</h3>
                 <div className="overflow-x-auto">
                   <table className="w-full text-left border-collapse">
                     <thead>
                       <tr className="border-b border-slate-100 dark:border-slate-800 text-slate-500 text-sm font-semibold">
                         <th className="pb-3 pl-4">Date</th>
                         <th className="pb-3">Passage Name</th>
                         <th className="pb-3">Category</th>
                         <th className="pb-3 text-center">Score</th>
                         <th className="pb-3 text-center">WPM</th>
                         <th className="pb-3 text-right pr-4">Accuracy</th>
                       </tr>
                     </thead>
                     <tbody className="text-sm">
                       {history.map((h, i) => (
                         <tr key={i} className="border-b border-slate-50 dark:border-slate-800/50 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                           <td className="py-4 pl-4 text-slate-600 dark:text-slate-400 font-medium">{new Date(h.createdAt).toLocaleDateString()}</td>
                           <td className="py-4 text-[#0b132b] dark:text-slate-200 font-bold max-w-[200px] truncate">{h.passageTitle}</td>
                           <td className="py-4">
                             <span className="px-2 py-1 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded text-xs font-bold">{h.category || 'Reading'}</span>
                           </td>
                           <td className="py-4 text-center">
                             <span className={cn("font-bold text-lg", h.speedLearningScore >= 80 ? "text-emerald-500" : h.speedLearningScore >= 60 ? "text-amber-500" : "text-rose-500")}>
                               {h.speedLearningScore}
                             </span>
                           </td>
                           <td className="py-4 text-center font-mono text-slate-600 dark:text-slate-400">{h.wpm}</td>
                           <td className="py-4 text-right pr-4 font-bold text-slate-600">
                             {h.accuracy}%
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
    <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border-none shadow-[0_2px_10px_rgba(0,0,0,0.04)] flex flex-col justify-center">
      <div className="flex items-center gap-4 mb-4">
        <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center", bg, color)}>
          {icon}
        </div>
        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{label}</div>
      </div>
      <div className={cn("text-3xl font-black", color)}>{value}</div>
    </div>
  );
