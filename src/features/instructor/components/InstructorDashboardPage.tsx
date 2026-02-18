import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { 
  BookOpen, 
  Users, 
  TrendingUp, 
  Clock, 
  Plus, 
  ArrowRight,
  FileText,
  ChevronRight
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/shared/components/ui/card";
import { Button } from "@/shared/components/ui/button";
import { InstructorSidebar } from "./dashboard/InstructorSidebar";
import { InstructorTopbar } from "./dashboard/InstructorTopbar";
import { useAuth } from "@/features/auth/hooks/useAuth";

export default function InstructorDashboardPage() {
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  const displayName = profile?.name || user?.email?.split('@')[0] || "Instructor";
  const firstName = displayName.split(' ')[0];

  // Mock data for widgets
  const stats = [
    { title: "Active Courses", value: "4", icon: BookOpen, color: "text-blue-600", bg: "bg-blue-100/50" },
    { title: "Total Students", value: "128", icon: Users, color: "text-indigo-600", bg: "bg-indigo-100/50" },
    { title: "Assessments", value: "24", icon: FileText, color: "text-amber-600", bg: "bg-amber-100/50" },
    { title: "Avg. Engagement", value: "87%", icon: TrendingUp, color: "text-emerald-600", bg: "bg-emerald-100/50" },
  ];

  const recentActivity = [
    { id: 1, user: "Alice Johnson", action: "Submitted assessment", target: "Speed Reading 101", time: "2 hours ago" },
    { id: 2, user: "Bob Smith", action: "Enrolled in", target: "Advanced Comprehension", time: "4 hours ago" },
    { id: 3, user: "Charlie Davis", action: "Completed module", target: "Vocabulary Builder", time: "Yesterday" },
  ];

  return (
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-slate-950 transition-colors duration-300">
      <InstructorSidebar
        activeTab="dashboard"
        isCollapsed={isSidebarCollapsed}
        toggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
      />

      <div className={`transition-all duration-300 ${isSidebarCollapsed ? 'lg:pl-24' : 'lg:pl-72'}`}>
        <InstructorTopbar />

        <main className="p-6 max-w-7xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
          
          {/* Hero Section */}
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-xl">
            <div className="relative z-10 p-8 md:p-10">
              <div className="max-w-2xl">
                <h1 className="text-3xl md:text-4xl font-bold mb-4 tracking-tight">
                  Welcome back, {firstName}! 👋
                </h1>
                <p className="text-indigo-100 text-lg mb-8 leading-relaxed">
                  You have <span className="font-semibold text-white">3 new submissions</span> to review today. Your courses are performing well with a 12% increase in engagement.
                </p>
                <div className="flex flex-wrap gap-4">
                  <Button 
                    onClick={() => navigate('/courses/admin/manage/new')}
                    className="bg-white text-indigo-600 hover:bg-slate-50 border-0 shadow-lg shadow-indigo-900/20 font-semibold"
                  >
                    <Plus className="w-4 h-4 mr-2" /> Create New Course
                  </Button>
                  <Button 
                    variant="outline"
                    onClick={() => navigate('/instructor/assessments')}
                    className="bg-indigo-700/50 border-indigo-400/30 text-white hover:bg-indigo-700 hover:text-white backdrop-blur-sm"
                  >
                    View Assessments
                  </Button>
                </div>
              </div>
            </div>
            
            {/* abstract shapes */}
            <div className="absolute right-0 top-0 h-full w-1/3 bg-gradient-to-l from-white/10 to-transparent skew-x-12 transform origin-bottom-right" />
            <div className="absolute -bottom-24 -right-12 h-64 w-64 rounded-full bg-purple-500/30 blur-3xl" />
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {stats.map((stat, index) => (
              <Card key={index} className="border-none shadow-sm hover:shadow-md transition-shadow">
                <CardContent className="p-6 flex items-center gap-4">
                  <div className={`p-3 rounded-xl ${stat.bg}`}>
                    <stat.icon className={`w-6 h-6 ${stat.color}`} />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-500 dark:text-slate-400">{stat.title}</p>
                    <h3 className="text-2xl font-bold text-slate-900 dark:text-white">{stat.value}</h3>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Quick Actions / Course Overview */}
            <Card className="lg:col-span-2 border-none shadow-md">
              <CardHeader>
                <CardTitle>Course Overview</CardTitle>
                <CardDescription>Manage your active courses</CardDescription>
              </CardHeader>
              <CardContent>
                 <div className="space-y-4">
                    {/* Placeholder for Course List Widget */}
                    <div className="p-4 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 flex items-center justify-between group hover:border-indigo-200 transition-colors cursor-pointer" onClick={() => navigate('/courses/admin/dashboard')}>
                        <div className="flex items-center gap-4">
                            <div className="h-10 w-10 rounded-lg bg-blue-100 flex items-center justify-center text-blue-600 font-bold">SR</div>
                            <div>
                                <h4 className="font-semibold text-slate-900 dark:text-white group-hover:text-indigo-600 transition-colors">Speed Reading Mastery</h4>
                                <p className="text-xs text-slate-500">42 Students • 8 Modules</p>
                            </div>
                        </div>
                        <ChevronRight className="w-5 h-5 text-slate-400 group-hover:translate-x-1 transition-transform" />
                    </div>
                    
                    <div className="p-4 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 flex items-center justify-between group hover:border-indigo-200 transition-colors cursor-pointer" onClick={() => navigate('/courses/admin/dashboard')}>
                        <div className="flex items-center gap-4">
                            <div className="h-10 w-10 rounded-lg bg-emerald-100 flex items-center justify-center text-emerald-600 font-bold">VC</div>
                            <div>
                                <h4 className="font-semibold text-slate-900 dark:text-white group-hover:text-indigo-600 transition-colors">Vocabulary Challenge</h4>
                                <p className="text-xs text-slate-500">28 Students • 5 Modules</p>
                            </div>
                        </div>
                        <ChevronRight className="w-5 h-5 text-slate-400 group-hover:translate-x-1 transition-transform" />
                    </div>

                     <Button variant="ghost" className="w-full text-indigo-600" onClick={() => navigate('/courses/admin/dashboard')}>
                        View All Courses <ArrowRight className="w-4 h-4 ml-2" />
                     </Button>
                 </div>
              </CardContent>
            </Card>

            {/* Recent Activity */}
            <Card className="border-none shadow-md">
              <CardHeader>
                <CardTitle>Recent Activity</CardTitle>
                <CardDescription>Latest student actions</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                    {recentActivity.map((activity) => (
                        <div key={activity.id} className="flex gap-4">
                            <div className="mt-1">
                                <div className="h-2 w-2 rounded-full bg-indigo-500 ring-4 ring-indigo-50 dark:ring-indigo-900/20" />
                            </div>
                            <div className="space-y-1">
                                <p className="text-sm text-slate-900 dark:text-white">
                                    <span className="font-medium">{activity.user}</span> {activity.action} <span className="font-medium text-indigo-600">{activity.target}</span>
                                </p>
                                <p className="text-xs text-slate-400 flex items-center gap-1">
                                    <Clock className="w-3 h-3" /> {activity.time}
                                </p>
                            </div>
                        </div>
                    ))}
                </div>
              </CardContent>
            </Card>
          </div>

        </main>
      </div>
    </div>
  );
}
