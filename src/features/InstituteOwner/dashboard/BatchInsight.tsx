import React, { useState } from 'react';
import { AlertTriangle } from 'lucide-react';

// Adjust these imports to match your actual file structure
import { InstituteOwnerSidebar } from '../components/InstitiuteOwnerSidebar';
import { InstituteOwnerTopbar } from '../components/InstituteOwnerTopbar';

// --- Mock Data ---
const topMetrics = [
  { title: "Total Batches", value: "5", subtext: "1 at risk", subtextColor: "text-red-500" },
  { title: "Total Students", value: "120", subtext: "Across all batches", subtextColor: "text-slate-500 dark:text-gray-500" },
  { title: "Avg Attendance", value: "90%", subtext: "This month", subtextColor: "text-slate-500 dark:text-gray-500" },
  { title: "Avg Improvement", value: "15%", subtext: "Score delta", subtextColor: "text-slate-500 dark:text-gray-500" },
];

const batches = [
  {
    id: 1,
    name: "IELTS Batch 12",
    tutor: "Sarah Khan",
    duration: "Jan 5 → Mar 30",
    enrolled: 28,
    capacity: 30,
    score: "7.2",
    improvement: "+18%",
    improvementColor: "text-emerald-600 dark:text-green-500",
    attendance: "94%",
    attendanceColor: "text-emerald-600 dark:text-green-500",
    completion: "85%",
    completionColor: "text-emerald-600 dark:text-green-500",
    isAtRisk: false,
  },
  {
    id: 2,
    name: "Spoken English A",
    tutor: "Ravi Kumar",
    duration: "Jan 10 → Apr 15",
    enrolled: 35,
    capacity: 40,
    score: "6.8",
    improvement: "+22%",
    improvementColor: "text-emerald-600 dark:text-green-500",
    attendance: "88%",
    attendanceColor: "text-emerald-600 dark:text-green-500",
    completion: "72%",
    completionColor: "text-emerald-600 dark:text-green-500",
    isAtRisk: false,
  },
  {
    id: 3,
    name: "Tech Prep Batch 5",
    tutor: "Deepak Sharma",
    duration: "Dec 1 → Feb 28",
    enrolled: 20,
    capacity: 25,
    score: "7.5",
    improvement: "+15%",
    improvementColor: "text-emerald-600 dark:text-green-500",
    attendance: "96%",
    attendanceColor: "text-emerald-600 dark:text-green-500",
    completion: "90%",
    completionColor: "text-emerald-600 dark:text-green-500",
    isAtRisk: false,
  },
  {
    id: 4,
    name: "IELTS Evening",
    tutor: "Priya Menon",
    duration: "Jan 15 → Apr 30",
    enrolled: 22,
    capacity: 30,
    score: "6.1",
    improvement: "+8%",
    improvementColor: "text-red-500",
    attendance: "78%",
    attendanceColor: "text-red-500",
    completion: "60%",
    completionColor: "text-red-500",
    isAtRisk: true,
  },
  {
    id: 5,
    name: "Advanced Writing",
    tutor: "Sarah Khan",
    duration: "Feb 1 → May 15",
    enrolled: 15,
    capacity: 20,
    score: "7.0",
    improvement: "+12%",
    improvementColor: "text-emerald-600 dark:text-green-500",
    attendance: "92%",
    attendanceColor: "text-emerald-600 dark:text-green-500",
    completion: "45%",
    completionColor: "text-emerald-600 dark:text-green-500",
    isAtRisk: false,
  }
];

export default function BatchInsight() {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  return (
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-[#0a0a0a] font-sans text-slate-900 dark:text-white transition-colors duration-300">
      
      {/* Sidebar */}
      <div className="hidden lg:block">
        <InstituteOwnerSidebar 
          activeTab="insight" // Adjust this to match your sidebar's active item
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
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
              {topMetrics.map((metric, idx) => (
                <div key={idx} className="bg-white dark:bg-[#121214] border border-slate-200 dark:border-[#27272a] rounded-xl p-5 shadow-sm">
                  <p className="text-slate-500 dark:text-gray-400 text-sm mb-1">{metric.title}</p>
                  <h2 className="text-4xl font-bold mb-2">{metric.value}</h2>
                  <p className={`text-xs ${metric.subtextColor}`}>{metric.subtext}</p>
                </div>
              ))}
            </div>

            {/* Batch List */}
            <div className="space-y-4">
              {batches.map((batch) => {
                const capacityPercentage = Math.round((batch.enrolled / batch.capacity) * 100);

                return (
                  <div key={batch.id} className="bg-white dark:bg-[#121214] border border-slate-200 dark:border-[#27272a] rounded-xl p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6 hover:border-slate-300 dark:hover:border-gray-600 transition-colors">
                    
                    {/* Left Column: Info */}
                    <div className="md:w-1/4">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="text-xl font-bold text-slate-900 dark:text-white">{batch.name}</h3>
                        {batch.isAtRisk && (
                          <span className="flex items-center gap-1 text-[10px] font-semibold text-red-600 dark:text-red-500 bg-red-50 dark:bg-red-500/10 px-2 py-0.5 rounded-full">
                            <AlertTriangle size={12} /> At Risk
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-slate-500 dark:text-gray-400">
                        Tutor: {batch.tutor} • {batch.duration}
                      </p>
                    </div>

                    {/* Middle Columns: Metrics Grid */}
                    <div className="flex-1 grid grid-cols-2 sm:grid-cols-4 gap-4 text-center md:text-left">
                      <div>
                        <p className="text-xs text-slate-500 dark:text-gray-500 mb-1">Avg Score</p>
                        <p className="text-2xl font-bold text-slate-900 dark:text-white">{batch.score}</p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-500 dark:text-gray-500 mb-1">Improvement</p>
                        <p className={`text-2xl font-bold ${batch.improvementColor}`}>{batch.improvement}</p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-500 dark:text-gray-500 mb-1">Attendance</p>
                        <p className={`text-2xl font-bold ${batch.attendanceColor}`}>{batch.attendance}</p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-500 dark:text-gray-500 mb-1">Completion</p>
                        <p className={`text-2xl font-bold ${batch.completionColor}`}>{batch.completion}</p>
                      </div>
                    </div>

                    {/* Right Column: Capacity */}
                    <div className="md:w-48 pt-4 md:pt-0 border-t md:border-t-0 border-slate-100 dark:border-[#27272a]">
                      <div className="flex justify-between text-sm mb-2">
                        <span className="text-slate-500 dark:text-gray-400">Capacity</span>
                        <span className="font-medium text-slate-900 dark:text-white">{batch.enrolled}/{batch.capacity} enrolled</span>
                      </div>
                      <div className="w-full bg-slate-100 dark:bg-gray-800 rounded-full h-1.5 mb-2">
                        <div 
                          className="bg-indigo-600 dark:bg-purple-600 h-1.5 rounded-full" 
                          style={{ width: `${capacityPercentage}%` }}
                        ></div>
                      </div>
                      <p className="text-right text-[10px] text-slate-500 dark:text-gray-500">{capacityPercentage}% filled</p>
                    </div>

                  </div>
                );
              })}
            </div>

          </div>
        </main>
      </div>
    </div>
  );
}