import React, { useState } from 'react';
import { ChevronRight } from 'lucide-react';

// Adjust these imports to match your actual file structure
import { InstituteOwnerSidebar } from '../components/InstitiuteOwnerSidebar';
import { InstituteOwnerTopbar} from '../components/InstituteOwnerTopbar';

// --- Mock Data ---
const topMetrics = [
  { title: "Avg Score", value: "6.7", subtext1: "Band equivalent", subtext2: "+0.8 from start", subtext2Color: "text-emerald-600 dark:text-green-500" },
  { title: "Active Students", value: "105", subtext1: "This month", subtext2: "98% retention", subtext2Color: "text-emerald-600 dark:text-green-500" },
  { title: "Weekly Sessions", value: "178", subtext1: "This week", subtext2: "+40% vs W1", subtext2Color: "text-emerald-600 dark:text-green-500" },
  { title: "Attendance Rate", value: "91%", subtext1: "This week", subtext2: "+9% from W1", subtext2Color: "text-emerald-600 dark:text-green-500" },
];

const weeklyTrend = [
  { week: "W1", score: "5.8", sessions: "124 sessions", attendance: "82% attendance", active: false },
  { week: "W2", score: "6.1", sessions: "145 sessions", attendance: "85% attendance", active: false },
  { week: "W3", score: "6.4", sessions: "168 sessions", attendance: "88% attendance", active: false },
  { week: "W4", score: "6.7", sessions: "178 sessions", attendance: "91% attendance", active: true },
];

const skillsData = [
  { name: "Reading Comprehension", score: 7.1, change: "+0.4" },
  { name: "Spoken English Fluency", score: 6.3, change: "+0.6" },
  { name: "Pronunciation Clarity", score: 6.8, change: "+0.3" },
  { name: "Grammar Accuracy", score: 5.9, change: "+0.5" },
  { name: "Vocabulary Range", score: 6.1, change: "+0.2" },
  { name: "Task Achievement", score: 7.0, change: "+0.3" },
];

const topPerformers = [
  { name: "Arjun Reddy", batch: "IELTS Batch 12", score: "8.2", change: "+1.4", changeColor: "text-emerald-600 dark:text-green-500" },
  { name: "Neha Gupta", batch: "Spoken English A", score: "7.8", change: "+1.0", changeColor: "text-emerald-600 dark:text-green-500" },
  { name: "Karan Singh", batch: "IELTS Batch 12", score: "7.6", change: "+1.1", changeColor: "text-emerald-600 dark:text-green-500" },
  { name: "Divya Joshi", batch: "Tech Prep 5", score: "7.5", change: "+0.9", changeColor: "text-emerald-600 dark:text-green-500" },
];

const needsAttention = [
  { name: "Rahul Verma", batch: "Spoken English A", score: "4.8", status: "Score declining", color: "text-red-500" },
  { name: "Sita Patel", batch: "IELTS Evening", score: "5.2", status: "Low attendance", color: "text-red-500" },
  { name: "Amit Desai", batch: "Tech Prep 5", score: "5.5", status: "Missed tasks", color: "text-red-500" },
];

export default function Performance() {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  return (
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-[#0a0a0a] font-sans text-slate-900 dark:text-white transition-colors duration-300">
      
      {/* Sidebar */}
      <div className="hidden lg:block">
        <InstituteOwnerSidebar 
          activeTab="performance" 
          isCollapsed={isSidebarCollapsed} 
          toggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)} 
        />
      </div>

      {/* Main Layout Wrapper */}
      <div className={`transition-all duration-300 flex flex-col min-h-screen ${isSidebarCollapsed ? 'lg:pl-20' : 'lg:pl-64'}`}>
        
        {/* Topbar */}
        <InstituteOwnerTopbar />

        {/* Main Content */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8">
          <div className="max-w-[1400px] mx-auto space-y-6">
            
            {/* Top Metric Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {topMetrics.map((metric, idx) => (
                <div key={idx} className="bg-white dark:bg-[#121214] border border-slate-200 dark:border-[#27272a] rounded-xl p-5 shadow-sm">
                  <p className="text-slate-500 dark:text-gray-400 text-sm mb-1">{metric.title}</p>
                  <h2 className="text-4xl font-bold mb-3">{metric.value}</h2>
                  <p className="text-slate-500 dark:text-gray-500 text-xs mb-1">{metric.subtext1}</p>
                  <p className={`text-xs font-medium ${metric.subtext2Color}`}>{metric.subtext2}</p>
                </div>
              ))}
            </div>

            {/* Weekly Progress Trend */}
            <div className="bg-white dark:bg-[#121214] border border-slate-200 dark:border-[#27272a] rounded-xl p-6 shadow-sm">
              <h3 className="text-lg font-bold mb-6">Weekly Progress Trend</h3>
              
              {/* Progress Bar Line */}
              <div className="w-full h-1 bg-slate-200 dark:bg-gray-800 rounded-full mb-6 relative">
                 <div className="absolute top-0 left-0 h-full bg-indigo-600 dark:bg-purple-600 rounded-full w-full"></div>
              </div>

              {/* Weeks Grid */}
              <div className="grid grid-cols-4 gap-4 text-center">
                {weeklyTrend.map((weekData, idx) => (
                  <div key={idx} className="flex flex-col items-center">
                    <p className={`text-sm mb-1 ${weekData.active ? 'text-indigo-600 dark:text-purple-400 font-semibold' : 'text-slate-500 dark:text-gray-500'}`}>
                      {weekData.week}
                    </p>
                    <h4 className={`text-3xl font-bold mb-2 ${weekData.active ? 'text-slate-900 dark:text-white' : 'text-slate-700 dark:text-gray-300'}`}>
                      {weekData.score}
                    </h4>
                    <p className="text-slate-500 dark:text-gray-400 text-xs">{weekData.sessions}</p>
                    <p className="text-slate-500 dark:text-gray-400 text-xs">{weekData.attendance}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Bottom Section: Skills & Performers */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              
              {/* Skill-wise Breakdown */}
              <div className="bg-white dark:bg-[#121214] border border-slate-200 dark:border-[#27272a] rounded-xl p-6 shadow-sm">
                <h3 className="text-lg font-bold mb-6">Skill-wise Breakdown</h3>
                <div className="space-y-5">
                  {skillsData.map((skill, idx) => (
                    <div key={idx}>
                      <div className="flex justify-between items-end mb-2">
                        <span className="text-sm font-medium text-slate-700 dark:text-gray-200">{skill.name}</span>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-bold">{skill.score}</span>
                          <span className="text-emerald-600 dark:text-green-500 text-xs font-medium">{skill.change}</span>
                        </div>
                      </div>
                      <div className="w-full bg-slate-100 dark:bg-gray-800 rounded-full h-1.5">
                        {/* Assuming max score is 9 for progress calculation (IELTS standard) */}
                        <div 
                          className="bg-indigo-600 dark:bg-purple-600 h-1.5 rounded-full" 
                          style={{ width: `${(skill.score / 9) * 100}%` }}
                        ></div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Performers Section */}
              <div className="flex flex-col gap-6">
                
                {/* Top Performers */}
                <div className="bg-white dark:bg-[#121214] border border-slate-200 dark:border-[#27272a] rounded-xl p-6 shadow-sm flex-1">
                  <h3 className="text-emerald-600 dark:text-green-500 font-semibold flex items-center gap-1 mb-4">
                    <ChevronRight size={18} /> Top Performers
                  </h3>
                  <div className="space-y-4">
                    {topPerformers.map((student, idx) => (
                      <div key={idx} className="flex justify-between items-center group cursor-pointer">
                        <div>
                          <h4 className="font-semibold text-sm group-hover:text-indigo-600 dark:group-hover:text-purple-400 transition-colors">{student.name}</h4>
                          <p className="text-slate-500 dark:text-gray-500 text-xs">{student.batch}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-sm">{student.score}</p>
                          <p className={`text-xs ${student.changeColor}`}>{student.change}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Needs Attention */}
                <div className="bg-white dark:bg-[#121214] border border-slate-200 dark:border-[#27272a] rounded-xl p-6 shadow-sm flex-1">
                  <h3 className="text-red-500 font-semibold flex items-center gap-1 mb-4">
                    <ChevronRight size={18} /> Needs Attention
                  </h3>
                  <div className="space-y-4">
                    {needsAttention.map((student, idx) => (
                      <div key={idx} className="flex justify-between items-center group cursor-pointer">
                        <div>
                          <h4 className="font-semibold text-sm group-hover:text-red-500 transition-colors">{student.name}</h4>
                          <p className="text-slate-500 dark:text-gray-500 text-xs">{student.batch}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-sm text-red-600 dark:text-red-500">{student.score}</p>
                          <p className="text-xs text-slate-500 dark:text-gray-400">{student.status}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

              </div>
            </div>

          </div>
        </main>
      </div>
    </div>
  );
}