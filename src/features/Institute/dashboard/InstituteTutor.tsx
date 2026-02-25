import React, { useState } from 'react';
import { 
  Search, 
  Star,
  Users,
  TrendingUp,
  Target,
  AlertTriangle,
  Info
} from 'lucide-react';
import { InstituteSidebar } from '../components/InstituteSidebar';
import { InstituteTopbar } from '../components/InstituteTopbar';

// --- Mock Data ---
const topMetrics = [
  { title: "Total Tutors", value: "4", change: null },
  { title: "Avg Improvement", value: "+15%", change: "positive" },
  { title: "Avg Calibration", value: "81%", change: null },
  { title: "Avg Satisfaction", value: "4.5", icon: Star, iconColor: "text-amber-400" }
];

const tutorsData = [
  {
    id: 1,
    name: "Sarah Khan",
    course: "IELTS Band 7 - Foundation English",
    rating: 4.8,
    students: 46,
    improvement: "+18%",
    calibration: "92%",
    atRisk: 5,
    grading: { aligned: 43, over: 2, under: 1 },
    initials: "SK",
    color: "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400"
  },
  {
    id: 2,
    name: "Ravi Kumar",
    course: "Spoken English - Morning",
    rating: 4.6,
    students: 35,
    improvement: "+12%",
    calibration: "78%",
    atRisk: 7,
    grading: { aligned: 24, over: 8, under: 3 },
    initials: "RK",
    color: "bg-purple-100 text-purple-700 dark:bg-purple-500/20 dark:text-purple-400"
  },
  {
    id: 3,
    name: "Deepak Sharma",
    course: "Tech Interview Prep",
    rating: 4.9,
    students: 20,
    improvement: "+22%",
    calibration: "88%",
    atRisk: 2,
    grading: { aligned: 17, over: 1, under: 2 },
    initials: "DS",
    color: "bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-400"
  },
  {
    id: 4,
    name: "Priya Menon",
    course: "IELTS Evening",
    rating: 4.2,
    students: 22,
    improvement: "+8%",
    calibration: "65%",
    atRisk: 9,
    grading: { aligned: 9, over: 12, under: 1 },
    initials: "PM",
    color: "bg-indigo-100 text-indigo-700 dark:bg-indigo-500/20 dark:text-indigo-400"
  }
];

const insights = [
  {
    title: "Priya Menon needs calibration support",
    desc: "65% calibration score with 12 over-graded students. Students may be receiving inflated assessments, leading to false confidence.",
    action: "Schedule a 1:1 calibration session. Share the AI assessment rubric and have her re-grade 5 sample students.",
    dotColor: "bg-rose-500"
  },
  {
    title: "Deepak Sharma is your star performer",
    desc: "+22% avg improvement, 88% calibration, 4.9 satisfaction. He has capacity for more students (20/25).",
    action: "Assign 5 more students to his batch. Consider having him mentor other tutors.",
    dotColor: "bg-emerald-500"
  },
  {
    title: "Ravi Kumar has an 8-student over-grading gap",
    desc: "8 students show lower AI scores than his grades. This creates risk when they face real assessments.",
    action: "Review the Teacher AI Calibration dashboard together. Focus on the 8 over-graded students specifically.",
    dotColor: "bg-amber-500"
  },
  {
    title: "Cost efficiency: ₹976/student effective",
    desc: "With 4 tutors handling 123 students, your per-student cost is ₹976 on the Institute Pro plan — 61% cheaper than individual enrollment.",
    action: "Adding 1 more tutor with 30 students would drop per-student cost to ₹927.",
    dotColor: "bg-blue-500"
  }
];

export default function InstituteTutor() {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  const filteredTutors = tutorsData.filter(tutor => 
    tutor.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    tutor.course.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-slate-950 font-sans text-slate-900 dark:text-slate-200 transition-colors duration-300">
      
      {/* Sidebar */}
      <div className="hidden lg:block">
        <InstituteSidebar 
          activeTab="tutor" // Added new active tab
          isCollapsed={isSidebarCollapsed} 
          toggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)} 
        />
      </div>

      <div className={`transition-all duration-300 flex flex-col min-h-screen ${isSidebarCollapsed ? 'lg:pl-20' : 'lg:pl-64'}`}>
        
        <InstituteTopbar />

        <main className="flex-1 p-4 sm:p-6 lg:p-8">
          <div className="max-w-7xl mx-auto space-y-6">
            
            {/* Top Metrics Row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {topMetrics.map((metric, idx) => (
                <div key={idx} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-sm transition-colors">
                  <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-1">{metric.title}</p>
                  <div className="flex items-center gap-2">
                    <h3 className={`text-2xl font-bold ${metric.change === 'positive' ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-900 dark:text-white'}`}>
                      {metric.value}
                    </h3>
                    {metric.icon && <metric.icon className={`w-5 h-5 ${metric.iconColor} fill-current`} />}
                  </div>
                </div>
              ))}
            </div>

            {/* Search Bar */}
            <div className="relative max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input 
                type="text" 
                placeholder="Search tutors..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-sm font-medium text-slate-700 dark:text-slate-200 placeholder:text-slate-400 shadow-sm"
              />
            </div>

            {/* Tutors Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {filteredTutors.map((tutor) => (
                <div key={tutor.id} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 shadow-sm transition-colors flex flex-col">
                  
                  {/* Tutor Header */}
                  <div className="flex items-start justify-between mb-6">
                    <div className="flex items-center gap-4">
                      <div className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg shrink-0 ${tutor.color}`}>
                        {tutor.initials}
                      </div>
                      <div>
                        <h3 className="text-lg font-bold text-slate-900 dark:text-white leading-tight">{tutor.name}</h3>
                        <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">{tutor.course}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 bg-amber-50 dark:bg-amber-500/10 px-2.5 py-1 rounded-md border border-amber-100 dark:border-amber-500/20 shrink-0">
                      <Star className="w-4 h-4 text-amber-500 fill-current" />
                      <span className="text-sm font-bold text-amber-700 dark:text-amber-400">{tutor.rating}</span>
                    </div>
                  </div>

                  {/* Tutor Stats Row */}
                  <div className="grid grid-cols-4 gap-4 mb-8">
                    <div>
                      <p className="text-2xl font-bold text-slate-900 dark:text-white mb-0.5">{tutor.students}</p>
                      <p className="text-[11px] sm:text-xs text-slate-500 dark:text-slate-400 font-medium">Students</p>
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 mb-0.5">{tutor.improvement}</p>
                      <p className="text-[11px] sm:text-xs text-slate-500 dark:text-slate-400 font-medium">Improvement</p>
                    </div>
                    <div>
                      <p className={`text-2xl font-bold mb-0.5 ${parseInt(tutor.calibration) > 80 ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600 dark:text-amber-400'}`}>
                        {tutor.calibration}
                      </p>
                      <p className="text-[11px] sm:text-xs text-slate-500 dark:text-slate-400 font-medium">Calibration</p>
                    </div>
                    <div>
                      <p className={`text-2xl font-bold mb-0.5 ${tutor.atRisk > 5 ? 'text-rose-600 dark:text-rose-400' : 'text-slate-900 dark:text-white'}`}>
                        {tutor.atRisk}
                      </p>
                      <p className="text-[11px] sm:text-xs text-slate-500 dark:text-slate-400 font-medium">At Risk</p>
                    </div>
                  </div>

                  {/* Grading vs AI Assessment Bar */}
                  <div className="mt-auto">
                    <p className="text-[11px] font-bold text-slate-500 dark:text-slate-400 mb-2 uppercase tracking-wider">Grading vs AI Assessment</p>
                    
                    <div className="flex h-2.5 w-full rounded-full overflow-hidden bg-slate-100 dark:bg-slate-800 mb-2">
                      <div className="bg-emerald-500" style={{ width: `${(tutor.grading.aligned / tutor.students) * 100}%` }} />
                      <div className="bg-amber-400 dark:bg-amber-500" style={{ width: `${(tutor.grading.over / tutor.students) * 100}%` }} />
                      <div className="bg-blue-400 dark:bg-blue-500" style={{ width: `${(tutor.grading.under / tutor.students) * 100}%` }} />
                    </div>

                    <div className="flex justify-between items-center text-[10px] font-medium text-slate-500 dark:text-slate-400">
                      <div className="flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-sm bg-emerald-500"></span>
                        {tutor.grading.aligned} aligned
                      </div>
                      <div className="flex gap-4">
                        {tutor.grading.over > 0 && (
                          <div className="flex items-center gap-1.5">
                            <span className="w-2 h-2 rounded-sm bg-amber-400 dark:bg-amber-500"></span>
                            {tutor.grading.over} over-graded
                          </div>
                        )}
                        {tutor.grading.under > 0 && (
                          <div className="flex items-center gap-1.5">
                            <span className="w-2 h-2 rounded-sm bg-blue-400 dark:bg-blue-500"></span>
                            {tutor.grading.under} under-graded
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                </div>
              ))}
            </div>

            {/* Insights & Recommendations */}
            <div className="mt-8 pt-4">
              <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-6">Tutor Insights & Recommendations</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {insights.map((insight, idx) => (
                  <div key={idx} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-sm transition-colors">
                    <div className="flex items-start gap-3 mb-3">
                      <div className={`w-2.5 h-2.5 rounded-full mt-1.5 shrink-0 ${insight.dotColor}`}></div>
                      <h3 className="font-bold text-slate-900 dark:text-white text-[15px]">{insight.title}</h3>
                    </div>
                    <p className="text-sm text-slate-600 dark:text-slate-400 mb-4 pl-5.5 leading-relaxed">
                      {insight.desc}
                    </p>
                    <div className="bg-slate-50 dark:bg-slate-800/50 p-3 rounded-lg border border-slate-100 dark:border-slate-800 ml-5.5">
                      <p className="text-xs text-slate-700 dark:text-slate-300">
                        <span className="font-bold text-slate-900 dark:text-white">Action:</span> {insight.action}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>
        </main>
      </div>
    </div>
  );
}