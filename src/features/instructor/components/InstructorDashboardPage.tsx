import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { 
  BookOpen, 
  Users, 
  TrendingUp, 
  Clock, 
  Plus, 
  ArrowRight,
  FileText,
  ChevronRight,
  AlertTriangle,
  PlayCircle,
  Activity,
  BrainCircuit,
  MessageSquare,
  BarChart2,
  X,
  Target
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
  const [selectedStudentReport, setSelectedStudentReport] = useState<string | null>(null);

  const displayName = profile?.name || user?.email?.split('@')[0] || "Instructor";
  const firstName = displayName.split(' ')[0];

  const predictedDropoffs = [
    { name: "Sneha Reddy", risk: "92%", reason: "latency in Voice Lab latency", trend: "declining" },
    { name: "Rohan Gupta", risk: "88%", reason: "latency in Reading comprehension speed", trend: "stagnant" },
    { name: "Vikram Kumar", risk: "82%", reason: "latency in Grammar drill accuracy", trend: "declining" },
  ];

  const stats = [
    { title: "Active Courses", value: "14", change: "+2.4%", changeType: "positive", icon: BookOpen },
    { title: "Total Students", value: "6", change: "+5.8%", changeType: "positive", icon: Users },
    { title: "Assessments", value: "24", change: "+1.2%", changeType: "positive", icon: FileText },
    { title: "Avg. Accuracy", value: "61%", change: "-0.4%", changeType: "negative", icon: TrendingUp },
  ];

  const courseOverview = [
    { name: "Spoken English Mastery", students: 42, modules: 8, initials: "SE", color: "bg-purple-600" },
    { name: "IELTS Band 7+ Prep", students: 28, modules: 5, initials: "IE", color: "bg-blue-600" },
    { name: "Technical Defense", students: 15, modules: 6, initials: "TD", color: "bg-emerald-600" },
    { name: "Reading Comprehension", students: 22, modules: 4, initials: "RC", color: "bg-orange-600" },
  ];

  const atRiskStudents = [
    { name: "Arjun Mehta", issue: "Only 42% accuracy", status: "WARNING" },
    { name: "Rohan Gupta", issue: "68% hesitation rate", status: "WARNING" },
    { name: "Sneha Reddy", issue: "Missed 3 deadlines", status: "CRITICAL" },
    { name: "Vikram Kumar", issue: "Only 20% accuracy", status: "WARNING" },
    { name: "Ananya Singh", issue: "Only 38% accuracy", status: "WARNING" },
  ];

  const recentActivity = [
    { user: "Arjun Mehta", action: "Completed assessment", target: "Binary Trees Module", time: "2 hours ago" },
    { user: "Priya Sharma", action: "Enrolled in", target: "Advanced DP Course", time: "4 hours ago" },
    { user: "Rohan Gupta", action: "Submitted speech", target: "Technical Defense", time: "10 hours ago" },
    { user: "Kavya Nair", action: "Scored 94% in", target: "Array Mastery Quiz", time: "Yesterday" },
    { user: "Sneha Reddy", action: "Flagged for review", target: "Low confidence score", time: "Yesterday" },
  ];

  const solutionsForTutors = [
    { title: "Students freeze during live assessments", desc: "Use the Speech Anatomy tool for progressive desensitization – start with 2-min warm-up before timed sessions.", linkText: "Open Speech Tool" },
    { title: "Hard to identify who's genuinely struggling vs. lazy", desc: "Check the Struggle Signature in student profile — Conceptual gaps need teaching, Psychological needs coaching, Tactical needs practice.", linkText: "View Reports" },
    { title: "No time to create individual improvement plans", desc: "AI auto-generates Learning Plans after each session. Review them in the student detail model and approve or customize.", linkText: "View Curriculum" },
    { title: "Can't prove student progress to institutions", desc: "Use the Alignment dashboard for Teacher vs Calibration scores. Export the Dean's Report for institutional review.", linkText: "Alignment Dashboard" },
  ];

  const studentAnalytics = [
    { id: "arjun", name: "Arjun Mehta", acc: "42%", avg: "68s", hes: "48%", tags: ["Conceptual"], text: "Arjun mastered Heaps (82%) but hesitates for 45s on Binary Tree integration—suggests a weak foundation in recursive logic. His accuracy drops 38% when questions chain recursive calls." },
    { id: "priya", name: "Priya Sharma", acc: "78%", avg: "42s", hes: "22%", tags: ["Conceptual", "Tactical"], text: "Priya understands core concepts well (DP is 88%) but selects suboptimal approaches for Greedy problems—choosing brute-force over pattern-matched strategies. Bound and method selection costs 30s per question." },
    { id: "rohan", name: "Rohan Gupta", acc: "72%", avg: "58s", hes: "62%", tags: ["Psychological"], text: "Rohan's untimed accuracy is 78% but drops to 41% under exam conditions. He spends 85s avg per question with 62% hesitation rate—classic time pressure panic. He re-reads questions 3x on average before attempting." },
    { id: "kavya", name: "Kavya Nair", acc: "88%", avg: "32s", hes: "15%", tags: [], text: "Kavya is a strong performer who defaults to familiar patterns. She solves 80% of array/string problems optimally but applies BFS/DFS templates incorrectly to backtracking problems." },
    { id: "aditya", name: "Aditya Patel", acc: "77%", avg: "38s", hes: "21%", tags: [], text: "Aditya scores across the board with 77% accuracy and minimal hesitation. Ready for advanced challenge sets and peer mentoring roles." },
    { id: "sneha", name: "Sneha Reddy", acc: "28%", avg: "94s", hes: "82%", tags: ["Conceptual"], text: "Sneha shows 28% accuracy with 71% hesitation rate—spending 71s avg per question. Foundational gaps in Hash Tables and Queues require immediate structural remediation." },
  ];

  const voiceLabSessions = [
    { fluency: "42%", latency: "2.8s", fillers: 12, wts: 9, duration: "2:08" },
    { fluency: "38%", latency: "3.1s", fillers: 14, wts: 10, duration: "2:15" },
    { fluency: "45%", latency: "2.5s", fillers: 10, wts: 8, duration: "1:55" },
    { fluency: "48%", latency: "2.2s", fillers: 8, wts: 7, duration: "2:10" },
    { fluency: "52%", latency: "2.0s", fillers: 6, wts: 6, duration: "2:05" },
  ];

  // Chart Data Constants mapping directly to the video UI
  const topicData = [
    { name: 'Heaps', score: 82 },
    { name: 'Hash Tables', score: 40 },
    { name: 'Trees', score: 52 },
    { name: 'Array Manipulation', score: 30 },
    { name: 'Recursion', score: 60 },
    { name: 'Graphs', score: 20 }
  ];

  const sessionData = [
    { time: '4 PM', acc: 60 },
    { time: '6 PM', acc: 40 },
    { time: '8 PM', acc: 75 },
    { time: '10 PM', acc: 68 },
    { time: '12 PM', acc: 55 },
    { time: '2 PM', acc: 80 }
  ];

  const trajectoryData = [
    { date: '8/1', f: 38, c: 42 },
    { date: '8/3', f: 42, c: 45 },
    { date: '8/5', f: 48, c: 50 },
    { date: '8/7', f: 52, c: 54 },
    { date: '8/9', f: 55, c: 58 },
    { date: '8/11', f: 60, c: 62 },
    { date: '8/13', f: 62, c: 65 },
    { date: '8/15', f: 65, c: 68 },
    { date: '8/17', f: 68, c: 70 },
    { date: '8/19', f: 71, c: 72 },
    { date: '8/21', f: 71, c: 74 },
  ];

  const activeStudent = studentAnalytics.find(s => s.id === selectedStudentReport);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#09090E] font-sans text-slate-900 dark:text-slate-200 transition-colors duration-300 selection:bg-indigo-500/30">
      <InstructorSidebar
        activeTab="dashboard"
        isCollapsed={isSidebarCollapsed}
        toggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
      />

      <div className={`transition-all duration-300 ${isSidebarCollapsed ? 'lg:pl-24' : 'lg:pl-72'}`}>
        <InstructorTopbar />

        <main className="p-6 max-w-[1600px] mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
          
          {/* Hero Section */}
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-indigo-700 to-purple-800 dark:from-[#3C1D70] dark:to-[#25134A] text-white shadow-xl dark:shadow-2xl border border-indigo-500/10 dark:border-indigo-500/20">
            <div className="relative z-10 p-8">
              <div className="max-w-3xl">
                <h1 className="text-3xl font-bold mb-3 tracking-tight">
                  Welcome back, {firstName}
                </h1>
                <p className="text-indigo-100/90 dark:text-indigo-100/80 text-[15px] mb-8 leading-relaxed max-w-2xl">
                  You have <span className="font-semibold text-white">5 at-risk students</span> needing attention today. Your courses are performing well with a 3.2% increase in average accuracy.
                </p>
              
              </div>
            </div>
            {/* abstract shapes */}
            <div className="absolute right-0 top-0 h-full w-1/2 bg-gradient-to-l from-white/10 dark:from-indigo-500/10 to-transparent skew-x-12 transform origin-bottom-right" />
            <div className="absolute -bottom-24 -right-12 h-64 w-64 rounded-full bg-purple-400/30 dark:bg-purple-500/20 blur-3xl" />
          </div>

          {/* Testcrack AI Drop-off Alert */}
          <div className="rounded-xl border border-red-200 dark:border-red-900/40 bg-red-50 dark:bg-[#160B12] overflow-hidden shadow-sm dark:shadow-lg dark:shadow-red-900/5">
            <div className="px-5 py-3 border-b border-red-200 dark:border-red-900/30 flex items-center gap-2 bg-red-100/50 dark:bg-red-950/20">
              <AlertTriangle className="w-4 h-4 text-red-600 dark:text-red-500" />
              <h3 className="text-red-700 dark:text-red-500 font-bold text-xs tracking-widest uppercase">TESTCRACK AI — PREDICTED DROP-OFF ALERT</h3>
            </div>
            <div className="p-5 space-y-3">
              {predictedDropoffs.map((student, idx) => (
                <div key={idx} className="flex items-center justify-between p-3 rounded-lg border border-red-100 dark:border-red-900/30 bg-white dark:bg-[#1A0D15] shadow-sm dark:shadow-none">
                  <div className="flex items-center gap-4">
                    <div className="w-8 h-8 rounded-full bg-red-100 dark:bg-red-900/40 text-red-600 dark:text-red-400 flex items-center justify-center font-bold text-sm">
                      {student.name.split(' ').map(n => n[0]).join('')}
                    </div>
                    <div>
                      <p className="text-sm">
                        <span className="font-semibold text-red-700 dark:text-red-400">{student.name}</span>
                        <span className="text-slate-600 dark:text-slate-400 ml-2">At risk. Predicts a {student.risk} drop-off based on latency in {student.reason}. Trend: {student.trend}.</span>
                      </p>
                    </div>
                  </div>
                  <Button 
                    size="sm" 
                    className="bg-red-100 hover:bg-red-200 text-red-700 border-red-200 dark:bg-red-900/60 dark:hover:bg-red-800 dark:text-red-200 border dark:border-red-800/50 h-8 text-xs"
                    onClick={() => toast.success(`AI Remediation Plan deployed for ${student.name}`)}
                  >
                    <PlayCircle className="w-3.5 h-3.5 mr-1.5" /> Deploy
                  </Button>
                </div>
              ))}
              <p className="text-xs text-slate-500 pt-2 flex items-center gap-2">
                <BrainCircuit className="w-3.5 h-3.5" />
                Powered by Testcrack Automated Management Agent — analyzing video call activity, session frequency, and accuracy decay patterns.
              </p>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {stats.map((stat, index) => (
              <Card key={index} className="bg-white dark:bg-[#12121A] border-slate-200 dark:border-[#1E1E2A] shadow-sm dark:shadow-none">
                <CardContent className="p-5 flex items-center justify-between">
                  <div>
                    <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">{stat.title}</p>
                    <div className="flex items-baseline gap-2">
                      <h3 className="text-2xl font-bold text-slate-900 dark:text-white">{stat.value}</h3>
                      <span className={`text-xs font-medium ${stat.changeType === 'positive' ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`}>
                        {stat.change}
                      </span>
                    </div>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-[#1A1A24]">
                    <stat.icon className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Main Grid Layout */}
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
            
            {/* LEFT COLUMN - Wider */}
            <div className="xl:col-span-2 space-y-6">
              
              {/* Course Overview */}
              <Card className="bg-white dark:bg-[#12121A] border-slate-200 dark:border-[#1E1E2A] shadow-sm dark:shadow-none">
                <CardHeader className="pb-2 flex flex-row items-center justify-between">
                  <div>
                    <CardTitle className="text-lg text-slate-900 dark:text-white">Course Overview</CardTitle>
                    <CardDescription className="text-slate-500 dark:text-slate-400">Manage your active courses</CardDescription>
                  </div>
                  <Button variant="ghost" className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 hover:bg-indigo-50 dark:hover:bg-indigo-950/30 text-sm">
                    View All Courses <ArrowRight className="w-4 h-4 ml-1" />
                  </Button>
                </CardHeader>
                <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
                  {courseOverview.map((course, idx) => (
                    <div key={idx} className="p-4 rounded-xl border border-slate-100 dark:border-[#2A2A3A] bg-slate-50 dark:bg-[#171722] flex items-center gap-4 hover:border-indigo-300 dark:hover:border-indigo-500/50 transition-colors cursor-pointer group">
                      <div className={`h-10 w-10 rounded-lg ${course.color} flex items-center justify-center text-white font-bold text-sm shadow-md`}>
                        {course.initials}
                      </div>
                      <div>
                        <h4 className="font-semibold text-slate-900 dark:text-slate-200 text-sm group-hover:text-indigo-600 dark:group-hover:text-indigo-300 transition-colors">{course.name}</h4>
                        <p className="text-xs text-slate-500 mt-0.5">{course.students} Students • {course.modules} Modules</p>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>

              {/* At-Risk Students Table */}
              <Card className="bg-white dark:bg-[#12121A] border-slate-200 dark:border-[#1E1E2A] shadow-sm dark:shadow-none">
                <CardHeader className="pb-4">
                  <CardTitle className="text-lg flex items-center gap-2 text-slate-900 dark:text-white">
                    <Target className="w-5 h-5 text-orange-500" /> At-Risk Students
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="divide-y divide-slate-100 dark:divide-[#1E1E2A]">
                    {atRiskStudents.map((student, idx) => (
                      <div key={idx} className="px-6 py-4 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-[#161622] transition-colors">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center font-medium text-slate-700 dark:text-slate-300 text-sm border border-slate-200 dark:border-slate-700">
                            {student.name.split(' ').map(n => n[0]).join('')}
                          </div>
                          <div>
                            <h4 className="font-medium text-sm text-slate-900 dark:text-slate-200">{student.name}</h4>
                            <p className="text-xs text-slate-500">{student.issue}</p>
                          </div>
                        </div>
                        <span className={`text-[10px] font-bold px-2 py-1 rounded-md tracking-wider ${
                          student.status === 'CRITICAL' ? 'bg-red-50 dark:bg-red-950/50 text-red-600 dark:text-red-500 border border-red-200 dark:border-red-900/50' : 'bg-orange-50 dark:bg-orange-950/50 text-orange-600 dark:text-orange-500 border border-orange-200 dark:border-orange-900/50'
                        }`}>
                          {student.status}
                        </span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Student Analytics */}
              <Card className="bg-white dark:bg-[#12121A] border-slate-200 dark:border-[#1E1E2A] shadow-sm dark:shadow-none">
                <CardHeader className="flex flex-row items-center justify-between pb-4">
                  <CardTitle className="text-lg flex items-center gap-2 text-slate-900 dark:text-white">
                    <Activity className="w-5 h-5 text-indigo-600 dark:text-indigo-400" /> Student Analytics
                  </CardTitle>
                  <div className="flex gap-2">
                    <span className="text-xs px-3 py-1 bg-indigo-50 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300 rounded-full border border-indigo-200 dark:border-indigo-700/50 cursor-pointer">All</span>
                    <span className="text-xs px-3 py-1 bg-slate-50 dark:bg-[#1A1A24] text-slate-600 dark:text-slate-400 rounded-full border border-slate-200 dark:border-[#2A2A3A] cursor-pointer hover:bg-slate-100 dark:hover:bg-[#20202C]">Conceptual</span>
                    <span className="text-xs px-3 py-1 bg-slate-50 dark:bg-[#1A1A24] text-slate-600 dark:text-slate-400 rounded-full border border-slate-200 dark:border-[#2A2A3A] cursor-pointer hover:bg-slate-100 dark:hover:bg-[#20202C]">Tactical</span>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {studentAnalytics.map((student) => (
                    <div key={student.id} className="p-5 rounded-xl border border-slate-100 dark:border-[#2A2A3A] bg-slate-50 dark:bg-[#171722] space-y-4 hover:border-slate-300 dark:hover:border-slate-700 transition-colors">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-indigo-100 dark:bg-indigo-900/40 flex items-center justify-center font-bold text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-700/30">
                            {student.name.split(' ').map(n => n[0]).join('')}
                          </div>
                          <div>
                            <h4 className="font-semibold text-slate-900 dark:text-slate-200">{student.name}</h4>
                            <div className="flex gap-3 mt-1 text-xs text-slate-600 dark:text-slate-400 font-medium">
                              <span className="flex items-center gap-1"><Target className="w-3 h-3 text-emerald-600 dark:text-emerald-500"/> {student.acc} acc</span>
                              <span className="flex items-center gap-1"><Clock className="w-3 h-3 text-blue-600 dark:text-blue-500"/> {student.avg} avg</span>
                              <span className="flex items-center gap-1"><Activity className="w-3 h-3 text-orange-600 dark:text-orange-500"/> {student.hes} hes</span>
                            </div>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          {student.tags.map(tag => (
                            <span key={tag} className={`text-[10px] px-2 py-0.5 rounded border font-medium ${
                              tag === 'Conceptual' ? 'bg-red-50 border-red-200 text-red-700 dark:bg-red-950/30 dark:border-red-900/40 dark:text-red-400' :
                              tag === 'Tactical' ? 'bg-blue-50 border-blue-200 text-blue-700 dark:bg-blue-950/30 dark:border-blue-900/40 dark:text-blue-400' :
                              'bg-purple-50 border-purple-200 text-purple-700 dark:bg-purple-950/30 dark:border-purple-900/40 dark:text-purple-400'
                            }`}>
                              {tag}
                            </span>
                          ))}
                        </div>
                      </div>
                      <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                        {student.text}
                      </p>
                      <div className="flex justify-end pt-2 border-t border-slate-200 dark:border-[#2A2A3A]">
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 hover:bg-indigo-50 dark:hover:bg-indigo-950/30 h-8 text-xs"
                          onClick={() => setSelectedStudentReport(student.id)}
                        >
                          View Full Report <ArrowRight className="w-3 h-3 ml-1.5" />
                        </Button>
                      </div>
                    </div>
                  ))}
                  <div className="text-center pt-2">
                    <p className="text-xs text-slate-500 mb-2">Showing 6 of 6 students</p>
                    <Button variant="outline" className="w-full border-slate-200 dark:border-[#2A2A3A] bg-white dark:bg-[#1A1A24] hover:bg-slate-50 dark:hover:bg-[#20202C] text-slate-700 dark:text-slate-300">
                      View All
                    </Button>
                  </div>
                </CardContent>
              </Card>

            </div>

            {/* RIGHT COLUMN - Narrower */}
            <div className="space-y-6">
              
              {/* Recent Activity */}
              <Card className="bg-white dark:bg-[#12121A] border-slate-200 dark:border-[#1E1E2A] shadow-sm dark:shadow-none">
                <CardHeader>
                  <CardTitle className="text-lg text-slate-900 dark:text-white">Recent Activity</CardTitle>
                  <CardDescription className="text-slate-500 dark:text-slate-400">Latest student actions</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    {recentActivity.map((activity, idx) => (
                      <div key={idx} className="flex gap-3 relative">
                        {idx !== recentActivity.length - 1 && (
                          <div className="absolute left-1.5 top-5 bottom-[-20px] w-px bg-slate-200 dark:bg-[#2A2A3A]" />
                        )}
                        <div className="mt-1 relative z-10">
                          <div className="h-3 w-3 rounded-full bg-indigo-500 ring-4 ring-white dark:ring-[#12121A]" />
                        </div>
                        <div className="space-y-1">
                          <p className="text-sm text-slate-700 dark:text-slate-300 leading-snug">
                            <span className="font-semibold text-slate-900 dark:text-slate-200">{activity.user}</span> {activity.action} <span className="font-semibold text-indigo-600 dark:text-indigo-400">{activity.target}</span>
                          </p>
                          <p className="text-[11px] text-slate-500 flex items-center gap-1 font-medium">
                            <Clock className="w-3 h-3" /> {activity.time}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Solutions for Tutors */}
              <Card className="bg-white dark:bg-[#12121A] border-slate-200 dark:border-[#1E1E2A] shadow-sm dark:shadow-none">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2 text-slate-900 dark:text-white">
                    <BrainCircuit className="w-5 h-5 text-purple-600 dark:text-purple-500" /> Solutions for Tutors
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-5">
                  {solutionsForTutors.map((sol, idx) => (
                    <div key={idx} className="space-y-2">
                      <h4 className="font-medium text-sm text-slate-900 dark:text-slate-200 leading-snug">{sol.title}</h4>
                      <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">{sol.desc}</p>
                      <button className="text-xs font-medium text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 flex items-center gap-1 transition-colors">
                        {sol.linkText} <ChevronRight className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </CardContent>
              </Card>

            </div>
          </div>
        </main>
      </div>

      {/* Analytics Modal Overlay */}
      {activeStudent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 dark:bg-black/60 backdrop-blur-sm animate-in fade-in duration-200 p-4">
          <div className="bg-white dark:bg-[#13131A] w-full max-w-4xl max-h-[90vh] rounded-2xl border border-slate-200 dark:border-[#2A2A3A] shadow-2xl overflow-y-auto overflow-x-hidden flex flex-col">
            
            {/* Modal Header */}
            <div className="sticky top-0 z-10 bg-white dark:bg-[#13131A] border-b border-slate-200 dark:border-[#2A2A3A] px-6 py-4 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-indigo-600 flex items-center justify-center text-white font-bold text-lg shadow-md">
                  {activeStudent.name.split(' ').map(n => n[0]).join('')}
                </div>
                <div>
                  <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-3">
                    {activeStudent.name}
                    {activeStudent.tags.length > 0 && (
                      <span className="text-[10px] px-2 py-0.5 rounded bg-red-50 text-red-600 border border-red-200 dark:bg-red-950/50 dark:border-red-900/50 dark:text-red-400 font-medium tracking-wider uppercase">
                        {activeStudent.tags[0]}
                      </span>
                    )}
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Executive Summary - Pedagogical Analysis</p>
                </div>
              </div>
              <button 
                onClick={() => setSelectedStudentReport(null)}
                className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-[#2A2A3A] text-slate-500 dark:text-slate-400 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-6 flex-1">
              {/* Top Stats */}
              <div className="grid grid-cols-3 gap-4">
                <div className="bg-slate-50 dark:bg-[#1A1A24] border border-slate-200 dark:border-[#2A2A3A] rounded-xl p-4 text-center">
                  <p className="text-xs text-slate-500 font-medium mb-1">ACCURACY</p>
                  <p className="text-2xl font-bold text-slate-900 dark:text-white">{activeStudent.acc}</p>
                </div>
                <div className="bg-slate-50 dark:bg-[#1A1A24] border border-slate-200 dark:border-[#2A2A3A] rounded-xl p-4 text-center">
                  <p className="text-xs text-slate-500 font-medium mb-1">AVG RUN TIME</p>
                  <p className="text-2xl font-bold text-slate-900 dark:text-white">{activeStudent.avg}</p>
                </div>
                <div className="bg-slate-50 dark:bg-[#1A1A24] border border-slate-200 dark:border-[#2A2A3A] rounded-xl p-4 text-center">
                  <p className="text-xs text-slate-500 font-medium mb-1">HESITATION</p>
                  <p className="text-2xl font-bold text-slate-900 dark:text-white">{activeStudent.hes}</p>
                </div>
              </div>

              {/* Insight Box */}
              <div className="bg-indigo-50 dark:bg-indigo-950/20 border border-indigo-200 dark:border-indigo-900/30 rounded-xl p-5 relative overflow-hidden">
                <div className="absolute left-0 top-0 bottom-0 w-1 bg-indigo-500" />
                <h3 className="text-sm font-bold text-indigo-700 dark:text-indigo-300 mb-2 flex items-center gap-2">
                  <Target className="w-4 h-4" /> Vantage Point Insight
                </h3>
                <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
                  {activeStudent.text}
                </p>
              </div>

              {/* Main Charts Section */}
              <div className="grid grid-cols-2 gap-6">
                
                {/* TOPIC BREAKDOWN (Custom Interactive Bar Chart) */}
                <div className="bg-white dark:bg-[#1A1A24] border border-slate-200 dark:border-[#2A2A3A] rounded-xl p-5 shadow-sm dark:shadow-none flex flex-col">
                  <h3 className="text-xs font-bold text-slate-500 dark:text-slate-400 mb-6 tracking-wider">TOPIC BREAKDOWN</h3>
                  <div className="h-32 flex items-end justify-between gap-2 px-2 mt-auto">
                    {topicData.map((t, i) => (
                      <div key={i} className="w-full h-full relative group flex flex-col justify-end items-center">
                        {/* Tooltip Overlay */}
                        <div className="absolute bottom-full mb-2 hidden group-hover:flex bg-slate-800 dark:bg-[#2A2A3A] text-white text-[10px] py-1 px-2 rounded whitespace-nowrap z-10 shadow-lg">
                          score : {t.score}
                        </div>
                        {/* Interactive Bar */}
                        <div 
                          className="w-full bg-indigo-500/80 dark:bg-indigo-600 rounded-t-sm transition-all duration-200 group-hover:bg-indigo-400 dark:group-hover:bg-indigo-500 cursor-pointer"
                          style={{ height: `${t.score}%` }}
                        />
                      </div>
                    ))}
                  </div>
                  <div className="flex justify-between mt-2 text-[9px] text-slate-500 font-medium text-center">
                    {topicData.map(t => <span key={t.name} className="flex-1 px-0.5 truncate">{t.name}</span>)}
                  </div>
                </div>

                {/* SESSION PERFORMANCE (Custom Interactive Line Chart) */}
                <div className="bg-white dark:bg-[#1A1A24] border border-slate-200 dark:border-[#2A2A3A] rounded-xl p-5 shadow-sm dark:shadow-none flex flex-col">
                  <h3 className="text-xs font-bold text-slate-500 dark:text-slate-400 mb-2 tracking-wider">SESSION PERFORMANCE</h3>
                  <div className="h-32 w-full pl-6 relative mt-auto">
                    
                    {/* Background Grid & Y-Axis */}
                    <div className="absolute inset-0 flex flex-col justify-between pointer-events-none">
                      {[100, 75, 50, 25, 0].map(val => (
                        <div key={val} className="w-full h-[1px] bg-slate-100 dark:bg-[#2A2A3A] relative">
                          <span className="absolute -left-6 -top-2 text-[8px] text-slate-400">{val}</span>
                        </div>
                      ))}
                    </div>

                    {/* SVG Line */}
                    <svg viewBox="0 0 100 100" className="w-full h-full overflow-visible absolute inset-0 z-0" preserveAspectRatio="none">
                      <path 
                        d={`M ${sessionData.map((d, i) => `${i * 20},${100 - d.acc}`).join(' L ')}`} 
                        fill="none" stroke="#10B981" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" 
                      />
                    </svg>

                    {/* Interactive Points Grid Overlay */}
                    <div className="absolute inset-0 z-10">
                      {sessionData.map((d, i) => (
                        <div key={i} className="absolute top-0 bottom-0 w-6 -ml-3 group cursor-pointer" style={{ left: `${i * 20}%` }}>
                          <div 
                            className="absolute w-2.5 h-2.5 rounded-full bg-white dark:bg-[#1A1A24] border-[2px] border-emerald-500 top-0 left-1/2 -translate-x-1/2 transition-transform group-hover:scale-125 shadow-sm"
                            style={{ top: `calc(${100 - d.acc}% - 5px)` }}
                          />
                          <div 
                            className="absolute hidden group-hover:flex bg-slate-800 dark:bg-[#2A2A3A] text-white text-[10px] py-1 px-2 rounded whitespace-nowrap z-20 shadow-lg top-0 left-1/2 -translate-x-1/2"
                            style={{ top: `calc(${100 - d.acc}% - 32px)` }}
                          >
                            accuracy : {d.acc}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                  {/* X-Axis Labels */}
                  <div className="flex justify-between mt-2 pl-6 text-[9px] text-slate-500 font-medium">
                    {sessionData.map(d => <span key={d.time}>{d.time}</span>)}
                  </div>
                </div>

              </div>

              {/* Strengths & Weaknesses Badges */}
              <div className="grid grid-cols-2 gap-6">
                <div className="bg-white dark:bg-[#1A1A24] border border-slate-200 dark:border-[#2A2A3A] rounded-xl p-4 shadow-sm dark:shadow-none">
                  <h4 className="text-xs font-bold text-slate-500 dark:text-slate-400 mb-3 flex items-center gap-2">
                    Strengths
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    <span className="text-[10px] font-medium px-2 py-1 rounded-md bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900/50 text-emerald-700 dark:text-emerald-400 tracking-wide">Heaps</span>
                    <span className="text-[10px] font-medium px-2 py-1 rounded-md bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900/50 text-emerald-700 dark:text-emerald-400 tracking-wide">Hash Tables</span>
                    <span className="text-[10px] font-medium px-2 py-1 rounded-md bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900/50 text-emerald-700 dark:text-emerald-400 tracking-wide">Array Manipulation</span>
                  </div>
                </div>
                <div className="bg-white dark:bg-[#1A1A24] border border-slate-200 dark:border-[#2A2A3A] rounded-xl p-4 shadow-sm dark:shadow-none">
                  <h4 className="text-xs font-bold text-slate-500 dark:text-slate-400 mb-3 flex items-center gap-2">
                    Weaknesses
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    <span className="text-[10px] font-medium px-2 py-1 rounded-md bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/50 text-red-700 dark:text-red-400 tracking-wide">Binary Trees</span>
                    <span className="text-[10px] font-medium px-2 py-1 rounded-md bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/50 text-red-700 dark:text-red-400 tracking-wide">Recursion</span>
                    <span className="text-[10px] font-medium px-2 py-1 rounded-md bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/50 text-red-700 dark:text-red-400 tracking-wide">Graph Traversal</span>
                  </div>
                </div>
              </div>

              {/* Voice Lab Table & Trajectory Chart */}
              <div className="bg-white dark:bg-[#1A1A24] border border-slate-200 dark:border-[#2A2A3A] rounded-xl overflow-hidden shadow-sm dark:shadow-none">
                <div className="p-4 border-b border-slate-200 dark:border-[#2A2A3A] flex justify-between items-center bg-slate-50 dark:bg-[#1E1E2A]">
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <MessageSquare className="w-4 h-4 text-indigo-600 dark:text-indigo-400" /> Spoken English Sessions <span className="text-xs font-normal text-slate-500 ml-1">25 sessions</span>
                  </h3>
                  <span className="text-[10px] text-indigo-700 dark:text-indigo-400 font-medium border border-indigo-200 dark:border-indigo-900/50 bg-indigo-50 dark:bg-indigo-950/30 px-2 py-1 rounded cursor-pointer hover:bg-indigo-100 dark:hover:bg-indigo-900/50 transition-colors">Open Speech Anatomy ↗</span>
                </div>
                
                {/* NEW: Fluency & Confidence Trajectory Chart */}
                <div className="p-5 border-b border-slate-100 dark:border-[#2A2A3A]">
                  <h4 className="text-[10px] font-bold text-slate-500 dark:text-slate-400 mb-4 tracking-wider uppercase">FLUENCY & CONFIDENCE TRAJECTORY</h4>
                  <div className="h-32 w-full pl-6 relative">
                    
                    {/* Background Grid */}
                    <div className="absolute inset-0 flex flex-col justify-between pointer-events-none">
                      {[100, 75, 50, 25, 0].map(val => (
                        <div key={val} className="w-full h-[1px] bg-slate-100 dark:bg-[#2A2A3A] relative">
                          <span className="absolute -left-6 -top-2 text-[8px] text-slate-400">{val}</span>
                        </div>
                      ))}
                    </div>

                    {/* Dual SVG Lines */}
                    <svg viewBox="0 0 100 100" className="w-full h-full overflow-visible absolute inset-0 z-0" preserveAspectRatio="none">
                      {/* Fluency Line */}
                      <path d={`M ${trajectoryData.map((d, i) => `${i * 10},${100 - d.f}`).join(' L ')}`} fill="none" stroke="#6366F1" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                      {/* Confidence Line */}
                      <path d={`M ${trajectoryData.map((d, i) => `${i * 10},${100 - d.c}`).join(' L ')}`} fill="none" stroke="#10B981" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>

                    {/* Interactive Overlay Zones */}
                    <div className="absolute inset-0 z-10">
                      {trajectoryData.map((d, i) => (
                        <div key={i} className="absolute top-0 bottom-0 w-6 -ml-3 group cursor-pointer" style={{ left: `${i * 10}%` }}>
                          
                          {/* Fluency Dot */}
                          <div 
                            className="absolute w-2 h-2 rounded-full bg-white dark:bg-[#1A1A24] border-2 border-indigo-500 top-0 left-1/2 -translate-x-1/2 transition-transform group-hover:scale-125 opacity-0 group-hover:opacity-100"
                            style={{ top: `calc(${100 - d.f}% - 4px)` }}
                          />
                          {/* Confidence Dot */}
                          <div 
                            className="absolute w-2 h-2 rounded-full bg-white dark:bg-[#1A1A24] border-2 border-emerald-500 top-0 left-1/2 -translate-x-1/2 transition-transform group-hover:scale-125 opacity-0 group-hover:opacity-100"
                            style={{ top: `calc(${100 - d.c}% - 4px)` }}
                          />

                          {/* Dual Tooltip */}
                          <div 
                            className="absolute hidden group-hover:flex flex-col gap-1 bg-slate-800 dark:bg-[#2A2A3A] text-white text-[10px] py-1.5 px-2.5 rounded z-20 shadow-lg top-0 left-1/2 -translate-x-1/2 whitespace-nowrap"
                            style={{ top: `calc(${Math.min(100 - d.f, 100 - d.c)}% - 50px)` }}
                          >
                            <span>Fluency : <span className="font-bold">{d.f}</span></span>
                            <span>Confidence : <span className="font-bold">{d.c}</span></span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                  {/* Trajectory X-Axis */}
                  <div className="flex justify-between mt-2 pl-6 text-[9px] text-slate-500 font-medium">
                    {trajectoryData.map(d => <span key={d.date}>{d.date}</span>)}
                  </div>
                </div>

                <div className="p-0">
                  <table className="w-full text-left text-sm">
                    <thead className="text-[10px] text-slate-500 bg-white dark:bg-[#13131A]">
                      <tr>
                        <th className="px-4 py-3 font-medium">FLUENCY & CONFIDENCE TRAJECTORY</th>
                        <th className="px-4 py-3 font-medium">LATENCY</th>
                        <th className="px-4 py-3 font-medium">FILLERS</th>
                        <th className="px-4 py-3 font-medium">WTS</th>
                        <th className="px-4 py-3 font-medium">DURATION</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-[#2A2A3A]">
                      {voiceLabSessions.map((s, i) => (
                        <tr key={i} className="hover:bg-slate-50 dark:hover:bg-[#1E1E2A]/50 transition-colors">
                          <td className="px-4 py-3 flex items-center gap-3">
                            <div className="w-6 h-6 rounded-full bg-slate-100 dark:bg-slate-800 text-[9px] flex items-center justify-center font-bold text-slate-600 dark:text-slate-400">
                              {activeStudent.name.split(' ').map(n => n[0]).join('')}
                            </div>
                            <div>
                              <p className="text-xs font-semibold text-slate-900 dark:text-slate-200">Fluency</p>
                              <p className="text-indigo-600 dark:text-indigo-400 font-bold">{s.fluency}</p>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-slate-700 dark:text-slate-300 font-medium">{s.latency}</td>
                          <td className="px-4 py-3 text-orange-600 dark:text-orange-400 font-medium">{s.fillers}</td>
                          <td className="px-4 py-3 text-red-600 dark:text-red-400 font-medium">{s.wts}</td>
                          <td className="px-4 py-3 text-slate-600 dark:text-slate-400 font-medium">{s.duration}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Fix & Pattern */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-slate-50 dark:bg-[#1A1A24] border border-slate-200 dark:border-[#2A2A3A] rounded-xl p-4">
                  <h4 className="text-xs font-bold text-emerald-600 dark:text-emerald-400 mb-2 flex items-center gap-2">
                    <Target className="w-3.5 h-3.5" /> High-Impact Fix
                  </h4>
                  <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">Assign 5-minute visual drill on recursive call-stack. Start with Fibonacci, then move to tree traversals tailored to {activeStudent.name.split(' ')[0]}.</p>
                </div>
                <div className="bg-slate-50 dark:bg-[#1A1A24] border border-slate-200 dark:border-[#2A2A3A] rounded-xl p-4">
                  <h4 className="text-xs font-bold text-purple-600 dark:text-purple-400 mb-2 flex items-center gap-2">
                    <Activity className="w-3.5 h-3.5" /> Study Pattern Reference
                  </h4>
                  <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">{activeStudent.name.split(' ')[0]} performs 20% better in evening sessions (6-9 PM). Recommend shifting high-stakes DSA prep to this window.</p>
                </div>
              </div>

            </div>
            
            {/* Modal Footer */}
            <div className="p-4 border-t border-slate-200 dark:border-[#2A2A3A] bg-slate-100 dark:bg-[#161622] flex justify-between items-center rounded-b-2xl">
              <div>
                <h4 className="text-sm font-bold text-slate-900 dark:text-white">Deployment Profile</h4>
                <p className="text-[10px] text-slate-500">Generates a shareable blueprint certificate for {activeStudent.name}</p>
              </div>
              <Button className="bg-indigo-600 hover:bg-indigo-500 text-white font-semibold shadow-md shadow-indigo-600/20">
                Generate Deployment Profile
              </Button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}