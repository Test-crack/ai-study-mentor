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
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(true);
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
    <div className="min-h-screen bg-brand-bg transition-colors duration-300 font-sans text-brand-text">
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
              <Button variant="ghost" className="mb-4 -ml-4 text-brand-text-mute hover:text-brand-text" onClick={() => navigate('/student/reading')}>
                <ChevronLeft className="w-4 h-4 mr-1" /> Back to Reading Practice
              </Button>
              <h1 className="text-3xl font-bold text-brand-text flex items-center gap-3 font-manrope">
                <Activity className="w-8 h-8 text-brand-blue-500" />
                Reading Analytics & History
              </h1>
              <p className="text-brand-text-mute mt-1">Track your reading comprehension and speed over time.</p>
            </div>
          </div>

          {isLoading ? (
            <div className="flex flex-col items-center justify-center h-64 text-brand-text-mute">
              <Loader2 className="w-8 h-8 animate-spin text-brand-blue-500 mb-4" />
              <p>Loading your history...</p>
            </div>
          ) : history.length === 0 ? (
            <div className="bg-white border border-brand-line rounded-3xl p-12 text-center">
                <div className="w-20 h-20 bg-brand-bg-alt rounded-full flex items-center justify-center mx-auto mb-4">
                    <Target className="w-10 h-10 text-brand-text-mute" />
                </div>
                <h2 className="text-2xl font-bold text-brand-text mb-2 font-manrope">No Practice History Yet</h2>
                <p className="text-brand-text-mute mb-6">Complete your first reading practice session to see analytics here.</p>
                <Button onClick={() => navigate('/student/reading')} className="bg-brand-blue-600 hover:bg-brand-blue-700 text-white">Start Reading</Button>
            </div>
          ) : (
            <div className="space-y-8">
              {/* Stat Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard icon={<TrendingUp />} label="Avg Overall Score" value={`${stats.avgScore}/100`} color="text-emerald-500" bg="bg-emerald-50" />
                <StatCard icon={<Zap />} label="Peak Reading Speed" value={`${stats.peakWpm} WPM`} color="text-brand-blue-500" bg="bg-brand-blue-500/10" />
                <StatCard icon={<Award />} label="Practice Sessions" value={stats.totalAssessments} color="text-brand-blue-500" bg="bg-brand-blue-500/10" />
                <StatCard icon={<Target />} label="Avg Accuracy" value={`${stats.avgAccuracy}%`} color="text-amber-500" bg="bg-amber-50" />
              </div>

              {/* Charts Section */}
              <div className="grid grid-cols-1 lg:grid-cols-1 gap-8">
                <div className="bg-white border border-brand-line p-6 rounded-3xl">
                  <h3 className="text-lg font-bold text-brand-text mb-6 font-manrope">Reading Score Progression</h3>
                  <div className="h-[300px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                        <defs>
                          <linearGradient id="colorScore" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#4E8CA6" stopOpacity={0.3}/>
                            <stop offset="95%" stopColor="#4E8CA6" stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#D8E0E2" />
                        <XAxis dataKey="name" tick={{ fontSize: 12, fill: '#5E6B73' }} axisLine={false} tickLine={false} />
                        <YAxis tick={{ fontSize: 12, fill: '#5E6B73' }} axisLine={false} tickLine={false} />
                        <Tooltip
                            contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                            labelStyle={{ color: '#17232B', fontWeight: 'bold' }}
                        />
                        <Area type="monotone" dataKey="score" stroke="#4E8CA6" strokeWidth={3} fillOpacity={1} fill="url(#colorScore)" name="Overall Score" />
                        <Line type="monotone" dataKey="wpm" stroke="#256B8B" strokeWidth={3} dot={false} name="WPM" />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>

              {/* History List */}
              <div className="bg-white border border-brand-line rounded-3xl p-6 overflow-hidden">
                 <h3 className="text-lg font-bold text-brand-text mb-6 font-manrope">Past Reading Sessions</h3>
                 <div className="overflow-x-auto">
                   <table className="w-full text-left border-collapse">
                     <thead>
                       <tr className="border-b border-brand-line text-brand-text-mute text-sm font-semibold">
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
                         <tr key={i} className="border-b border-brand-line hover:bg-brand-bg-alt transition-colors">
                           <td className="py-4 pl-4 text-brand-text-mute font-medium">{new Date(h.createdAt).toLocaleDateString()}</td>
                           <td className="py-4 text-brand-text font-bold max-w-[200px] truncate">{h.passageTitle}</td>
                           <td className="py-4">
                             <span className="px-2 py-1 bg-brand-bg-alt text-brand-text-mute rounded text-xs font-bold">{h.category || 'Reading'}</span>
                           </td>
                           <td className="py-4 text-center">
                             <span className={cn("font-bold text-lg", h.speedLearningScore >= 80 ? "text-emerald-500" : h.speedLearningScore >= 60 ? "text-amber-500" : "text-rose-500")}>
                               {h.speedLearningScore}
                             </span>
                           </td>
                           <td className="py-4 text-center font-mono text-brand-text-mute">{h.wpm}</td>
                           <td className="py-4 text-right pr-4 font-bold text-brand-text-mute">
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
    <div className="bg-white p-6 rounded-3xl border border-brand-line flex flex-col justify-center">
      <div className="flex items-center gap-4 mb-4">
        <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center", bg, color)}>
          {icon}
        </div>
        <div className="font-jetbrains text-[10px] font-bold text-brand-text-mute uppercase tracking-[0.16em]">{label}</div>
      </div>
      <div className={cn("text-3xl font-black", color)}>{value}</div>
    </div>
  );
