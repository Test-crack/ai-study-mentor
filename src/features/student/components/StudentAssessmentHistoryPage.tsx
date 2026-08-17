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
    <div className="min-h-screen bg-brand-bg transition-colors duration-300">
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
                className="pl-0 hover:pl-2 transition-all text-brand-text-mute mb-2"
                onClick={() => navigate('/student/reading')}
              >
                <ArrowLeft className="w-4 h-4 mr-2" /> Back to Assessment
              </Button>
              <h1 className="text-3xl font-bold font-manrope text-brand-text flex items-center gap-3">
                <Clock className="h-8 w-8 text-brand-teal-600" />
                Assessment History
              </h1>
              <p className="text-brand-text-mute mt-1">Track your progress and analyze your reading performance over time.</p>
            </div>
            <div className="flex gap-2">
                <Button variant="outline">
                    <Download className="w-4 h-4 mr-2" /> Export Data
                </Button>
            </div>
          </div>

          {/* Charts Section */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="bg-white border border-brand-line rounded-2xl shadow-sm">
                <CardHeader>
                    <CardTitle className="text-lg font-bold font-manrope text-brand-text">Reading Speed Trend</CardTitle>
                    <CardDescription className="text-brand-text-mute">Your WPM progress over the last sessions</CardDescription>
                </CardHeader>
                <CardContent className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={chartData}>
                            <defs>
                                <linearGradient id="colorWpm" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#3E9E93" stopOpacity={0.3}/>
                                    <stop offset="95%" stopColor="#3E9E93" stopOpacity={0}/>
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#D8E0E2" />
                            <XAxis dataKey="date" stroke="#5E6B73" fontSize={12} tickLine={false} axisLine={false} />
                            <YAxis stroke="#5E6B73" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `${value} wpm`} />
                            <Tooltip
                                contentStyle={{ backgroundColor: '#fff', borderRadius: '8px', border: '1px solid #D8E0E2' }}
                                itemStyle={{ color: '#17232B' }}
                            />
                            <Area type="monotone" dataKey="wpm" stroke="#12897C" strokeWidth={3} fillOpacity={1} fill="url(#colorWpm)" />
                        </AreaChart>
                    </ResponsiveContainer>
                </CardContent>
            </Card>

            <Card className="bg-white border border-brand-line rounded-2xl shadow-sm">
                <CardHeader>
                    <CardTitle className="text-lg font-bold font-manrope text-brand-text">Comprehension Trend</CardTitle>
                    <CardDescription className="text-brand-text-mute">Accuracy percentage over time</CardDescription>
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
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#D8E0E2" />
                            <XAxis dataKey="date" stroke="#5E6B73" fontSize={12} tickLine={false} axisLine={false} />
                            <YAxis stroke="#5E6B73" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `${value}%`} />
                            <Tooltip
                                contentStyle={{ backgroundColor: '#fff', borderRadius: '8px', border: '1px solid #D8E0E2' }}
                                itemStyle={{ color: '#17232B' }}
                            />
                            <Area type="monotone" dataKey="accuracy" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#colorAcc)" />
                        </AreaChart>
                    </ResponsiveContainer>
                </CardContent>
            </Card>
          </div>

          {/* Activity List */}
          <Card className="bg-white border border-brand-line rounded-2xl shadow-sm">
            <CardHeader>
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                    <div className="space-y-1">
                        <CardTitle className="text-xl font-manrope text-brand-text">Detailed History</CardTitle>
                        <CardDescription className="text-brand-text-mute">Review all your past assessment sessions</CardDescription>
                    </div>
                    <div className="flex items-center gap-3 w-full sm:w-auto">
                        <div className="relative flex-1 sm:w-64">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-brand-text-mute" />
                            <Input
                                placeholder="Search modules..."
                                className="pl-10"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                        <Select value={filterDifficulty} onValueChange={setFilterDifficulty}>
                            <SelectTrigger className="w-[140px]">
                                <Filter className="w-4 h-4 mr-2 text-brand-text-mute" />
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
                        <div className="text-center py-12 text-brand-text-mute">
                            No assessments found matching your filters.
                        </div>
                    ) : (
                        filteredHistory.map((item) => (
                            <div
                                key={item.id}
                                className="group flex items-center justify-between p-4 rounded-xl border border-brand-line hover:border-brand-teal-100 hover:bg-brand-bg-alt transition-all cursor-pointer"
                            >
                                <div className="flex items-center gap-4">
                                    <div className="h-12 w-12 rounded-lg bg-brand-teal-50 flex items-center justify-center text-brand-teal-600 group-hover:scale-110 transition-transform">
                                        <BookOpen className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-brand-text group-hover:text-brand-teal-600 transition-colors">
                                            {item.passageTitle || "Assessment"}
                                        </h4>
                                        <div className="flex items-center gap-3 text-xs font-jetbrains uppercase tracking-[0.14em] text-brand-text-mute mt-1">
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
                                        <div className="text-lg font-bold text-brand-text">{Math.round(item.weightedWPM)}</div>
                                        <div className="text-xs font-jetbrains text-brand-text-mute uppercase tracking-[0.14em] font-medium">WPM</div>
                                    </div>
                                    <div className="text-center hidden sm:block">
                                        <div className="text-lg font-bold text-emerald-600">{Math.round(item.accuracy)}%</div>
                                        <div className="text-xs font-jetbrains text-brand-text-mute uppercase tracking-[0.14em] font-medium">Accuracy</div>
                                    </div>
                                    <div className="w-10 h-10 rounded-full bg-white border border-brand-line flex items-center justify-center text-brand-text-mute group-hover:text-brand-teal-600 group-hover:border-brand-teal-200 transition-colors">
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
