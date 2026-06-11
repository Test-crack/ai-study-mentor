import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Clock,
  TrendingUp,
  Brain,
  Calendar,
  Search,
  BookOpen,
  Filter,
  Download
} from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription
} from "@/shared/components/ui/card";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/components/ui/select";
import { StudentSidebar } from "./dashboard/StudentSidebar";
import { StudentTopbar } from "./dashboard/StudentTopbar";
import { getAssessmentHistory, type AssessmentHistoryItem } from "@/features/reading-assessment/services/reading-api";
import { Area, AreaChart, CartesianGrid, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { format } from "date-fns";

export default function StudentAssessmentHistoryPage() {
  const navigate = useNavigate();
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(true);
  const [history, setHistory] = useState<AssessmentHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterDifficulty, setFilterDifficulty] = useState("all");

  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    try {
      const response = await getAssessmentHistory();
      if (response && response.history) {
        setHistory(response.history);
      }
    } catch (error) {
      console.error("Failed to load history", error);
    } finally {
      setLoading(false);
    }
  };

  const filteredHistory = history.filter(item => {
    const title = item.passageTitle || "Unknown Module";
    const matchesSearch = title.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesDifficulty = filterDifficulty === "all" || item.difficulty === filterDifficulty;
    return matchesSearch && matchesDifficulty;
  });

  const chartData = [...history].reverse().map(item => ({
    date: item.completedAt ? format(new Date(item.completedAt), 'MMM d') : (item.createdAt ? format(new Date(item.createdAt), 'MMM d') : 'N/A'),
    wpm: Math.round(item.weightedWPM),
    accuracy: Math.round(item.accuracy)
  }));

  return (
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-slate-950 transition-colors duration-300">
      <StudentSidebar
        activeTab="assessment"
        onTabChange={(tab) => {
           if (tab === 'dashboard') navigate('/student/dashboard');
           if (tab === 'courses') navigate('/student/courses');
           if (tab === 'settings') navigate('/student/settings');
           if (tab === 'schedule') navigate('/student/schedule');
           if (tab === 'assessment') navigate('/student/reading-assessment');
        }}
        isCollapsed={isSidebarCollapsed}
        toggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
      />

      <div className={`transition-all duration-300 ${isSidebarCollapsed ? 'lg:pl-24' : 'lg:pl-72'}`}>
        <StudentTopbar onUpgradeClick={() => {}} />

        <main className="p-6 max-w-7xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
          
          {/* Header */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <Button 
                variant="ghost" 
                className="pl-0 hover:pl-2 transition-all text-slate-500 mb-2"
                onClick={() => navigate('/student/reading')}
              >
                <ArrowLeft className="w-4 h-4 mr-2" /> Back to Assessment
              </Button>
              <h1 className="text-3xl font-bold text-slate-900 dark:text-white flex items-center gap-3">
                <Clock className="h-8 w-8 text-indigo-600" />
                Assessment History
              </h1>
              <p className="text-slate-500 dark:text-slate-400 mt-1">Track your progress and analyze your reading performance over time.</p>
            </div>
            <div className="flex gap-2">
                <Button variant="outline">
                    <Download className="w-4 h-4 mr-2" /> Export Data
                </Button>
            </div>
          </div>

          {/* Charts Section */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="border-none shadow-md">
                <CardHeader>
                    <CardTitle className="text-lg font-bold">Reading Speed Trend</CardTitle>
                    <CardDescription>Your WPM progress over the last sessions</CardDescription>
                </CardHeader>
                <CardContent className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={chartData}>
                            <defs>
                                <linearGradient id="colorWpm" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#818cf8" stopOpacity={0.3}/>
                                    <stop offset="95%" stopColor="#818cf8" stopOpacity={0}/>
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                            <XAxis dataKey="date" stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                            <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `${value} wpm`} />
                            <Tooltip 
                                contentStyle={{ backgroundColor: '#fff', borderRadius: '8px', border: '1px solid #e2e8f0' }}
                                itemStyle={{ color: '#1e293b' }}
                            />
                            <Area type="monotone" dataKey="wpm" stroke="#6366f1" strokeWidth={3} fillOpacity={1} fill="url(#colorWpm)" />
                        </AreaChart>
                    </ResponsiveContainer>
                </CardContent>
            </Card>

            <Card className="border-none shadow-md">
                <CardHeader>
                    <CardTitle className="text-lg font-bold">Comprehension Trend</CardTitle>
                    <CardDescription>Accuracy percentage over time</CardDescription>
                </CardHeader>
                <CardContent className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={chartData}>
                            <defs>
                                <linearGradient id="colorAcc" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#34d399" stopOpacity={0.3}/>
                                    <stop offset="95%" stopColor="#34d399" stopOpacity={0}/>
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                            <XAxis dataKey="date" stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                            <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `${value}%`} />
                            <Tooltip 
                                contentStyle={{ backgroundColor: '#fff', borderRadius: '8px', border: '1px solid #e2e8f0' }}
                                itemStyle={{ color: '#1e293b' }}
                            />
                            <Area type="monotone" dataKey="accuracy" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#colorAcc)" />
                        </AreaChart>
                    </ResponsiveContainer>
                </CardContent>
            </Card>
          </div>

          {/* Activity List */}
          <Card className="border-none shadow-md bg-white dark:bg-slate-900">
            <CardHeader>
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                    <div className="space-y-1">
                        <CardTitle className="text-xl">Detailed History</CardTitle>
                        <CardDescription>Review all your past assessment sessions</CardDescription>
                    </div>
                    <div className="flex items-center gap-3 w-full sm:w-auto">
                        <div className="relative flex-1 sm:w-64">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                            <Input 
                                placeholder="Search modules..." 
                                className="pl-10"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                        <Select value={filterDifficulty} onValueChange={setFilterDifficulty}>
                            <SelectTrigger className="w-[140px]">
                                <Filter className="w-4 h-4 mr-2 text-slate-400" />
                                <SelectValue placeholder="Difficulty" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Levels</SelectItem>
                                <SelectItem value="easy">Easy</SelectItem>
                                <SelectItem value="medium">Medium</SelectItem>
                                <SelectItem value="hard">Hard</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>
            </CardHeader>
            <CardContent>
                <div className="space-y-4">
                    {filteredHistory.length === 0 ? (
                        <div className="text-center py-12 text-slate-500">
                            No assessments found matching your filters.
                        </div>
                    ) : (
                        filteredHistory.map((item) => (
                            <div 
                                key={item.id} 
                                className="group flex items-center justify-between p-4 rounded-xl border border-slate-100 dark:border-slate-800 hover:border-indigo-100 dark:hover:border-indigo-900/50 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-all cursor-pointer"
                            >
                                <div className="flex items-center gap-4">
                                    <div className="h-12 w-12 rounded-lg bg-indigo-50 dark:bg-indigo-900/20 flex items-center justify-center text-indigo-600 dark:text-indigo-400 group-hover:scale-110 transition-transform">
                                        <BookOpen className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                                            {item.passageTitle || "Assessment"}
                                        </h4>
                                        <div className="flex items-center gap-3 text-xs text-slate-500 mt-1">
                                            <span className="flex items-center gap-1">
                                                <Calendar className="w-3 h-3" />
                                                {item.completedAt ? format(new Date(item.completedAt), "MMM d, yyyy â€¢ h:mm a") : (item.createdAt ? format(new Date(item.createdAt), "MMM d, yyyy â€¢ h:mm a") : "N/A")}
                                            </span>
                                            <span className={`px-2 py-0.5 rounded-full capitalize ${
                                                item.difficulty === 'hard' ? 'bg-red-100 text-red-600' :
                                                item.difficulty === 'medium' ? 'bg-amber-100 text-amber-600' :
                                                'bg-emerald-100 text-emerald-600'
                                            }`}>
                                                {item.difficulty}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex items-center gap-8">
                                    <div className="text-center hidden sm:block">
                                        <div className="text-lg font-bold text-slate-900 dark:text-white">{Math.round(item.weightedWPM)}</div>
                                        <div className="text-xs text-slate-500 uppercase tracking-wider font-medium">WPM</div>
                                    </div>
                                    <div className="text-center hidden sm:block">
                                        <div className="text-lg font-bold text-emerald-600 dark:text-emerald-400">{Math.round(item.accuracy)}%</div>
                                        <div className="text-xs text-slate-500 uppercase tracking-wider font-medium">Accuracy</div>
                                    </div>
                                    <div className="w-10 h-10 rounded-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center text-slate-400 group-hover:text-indigo-600 group-hover:border-indigo-200 transition-colors">
                                        <TrendingUp className="w-4 h-4" />
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </CardContent>
          </Card>
        </main>
      </div>
    </div>
  );
}
