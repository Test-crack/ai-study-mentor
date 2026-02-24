import React, { useState } from 'react';
import { FileText, TrendingUp, Users, DollarSign, Calendar, Download } from 'lucide-react';

// Adjust these imports to match your actual file structure
import {  InstituteOwnerSidebar} from '../components/InstitiuteOwnerSidebar';
import { InstituteOwnerTopbar} from '../components/InstituteOwnerTopbar';

// --- Mock Data ---
const topMetrics = [
  { title: "Reports Generated", value: "24", subtext: "This month", icon: FileText, iconColor: "text-slate-400" },
  { title: "Avg Score Improvement", value: "+16%", subtext: "Across all batches", icon: TrendingUp, iconColor: "text-emerald-500" },
  { title: "Student Satisfaction", value: "93%", subtext: "+5% from last quarter", icon: Users, iconColor: "text-blue-500" },
  { title: "$ Cost Savings", value: "₹2.6L/mo", subtext: "vs manual assessment", icon: DollarSign, iconColor: "text-emerald-500" },
];

const availableReports = [
  {
    id: 1,
    title: "Monthly Performance Summary",
    tag: "Performance",
    tagColor: "text-purple-400 bg-purple-500/10 border-purple-500/20",
    description: "Comprehensive overview of all batches, tutors, and student outcomes for the month",
    lastGenerated: "Feb 15, 2025",
    frequency: "Monthly"
  },
  {
    id: 2,
    title: "ROI & Cost Analysis",
    tag: "Financial",
    tagColor: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20",
    description: "Detailed breakdown of AI vs manual costs, savings trajectory, and investment justification",
    lastGenerated: "Feb 1, 2025",
    frequency: "Monthly"
  },
  {
    id: 3,
    title: "Tutor Effectiveness Report",
    tag: "HR",
    tagColor: "text-orange-400 bg-orange-500/10 border-orange-500/20",
    description: "Individual tutor performance metrics, AI alignment scores, and improvement recommendations",
    lastGenerated: "Feb 10, 2025",
    frequency: "Bi-weekly"
  },
  {
    id: 4,
    title: "Student Progress Cohort Report",
    tag: "Academic",
    tagColor: "text-blue-400 bg-blue-500/10 border-blue-500/20",
    description: "Cohort-level analysis of student improvements, struggle areas, and intervention outcomes",
    lastGenerated: "Feb 12, 2025",
    frequency: "Weekly"
  },
  {
    id: 5,
    title: "Batch Health & Capacity Report",
    tag: "Operations",
    tagColor: "text-slate-300 bg-slate-500/10 border-slate-500/20",
    description: "Enrollment capacity, attendance trends, and risk assessment across all active batches",
    lastGenerated: "Feb 14, 2025",
    frequency: "Weekly"
  },
  {
    id: 6,
    title: "Board Presentation Deck",
    tag: "Executive",
    tagColor: "text-red-400 bg-red-500/10 border-red-500/20",
    description: "Auto-generated executive summary with key metrics, charts, and strategic recommendations",
    lastGenerated: "Jan 31, 2025",
    frequency: "Quarterly"
  }
];

export default function StrategicReport() {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  return (
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-[#0a0a0a] font-sans text-slate-900 dark:text-white transition-colors duration-300">
      
      {/* Sidebar */}
      <div className="hidden lg:block">
        <InstituteOwnerSidebar 
          activeTab="strategic-reports" // Adjust this to match your sidebar's active item
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
              {topMetrics.map((metric, idx) => {
                const Icon = metric.icon;
                return (
                  <div key={idx} className="bg-white dark:bg-[#121214] border border-slate-200 dark:border-[#27272a] rounded-xl p-5 shadow-sm flex flex-col justify-between">
                    <div className="flex items-center gap-2 mb-2 text-slate-500 dark:text-gray-400">
                      <Icon size={16} className={metric.iconColor} />
                      <p className="text-sm">{metric.title}</p>
                    </div>
                    <div>
                      <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-1">{metric.value}</h2>
                      <p className="text-xs text-slate-500 dark:text-gray-500">{metric.subtext}</p>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Reports Section Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Available Reports</h2>
              <button className="flex items-center justify-center gap-2 px-4 py-2 bg-white dark:bg-transparent border border-slate-300 dark:border-gray-700 rounded-lg text-sm font-medium hover:bg-slate-50 dark:hover:bg-gray-800 transition-colors shadow-sm dark:shadow-none w-full sm:w-auto">
                <Calendar size={16} /> Schedule Report
              </button>
            </div>

            {/* Reports List */}
            <div className="space-y-4">
              {availableReports.map((report) => (
                <div 
                  key={report.id} 
                  className="bg-white dark:bg-[#121214] border border-slate-200 dark:border-[#27272a] rounded-xl p-5 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6 hover:border-slate-300 dark:hover:border-gray-600 transition-colors"
                >
                  
                  {/* Left Section: Info */}
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-bold text-slate-900 dark:text-white">{report.title}</h3>
                      <span className={`text-[10px] font-semibold px-2 py-0.5 rounded border ${report.tagColor}`}>
                        {report.tag}
                      </span>
                    </div>
                    <p className="text-sm text-slate-600 dark:text-gray-400 mb-3">
                      {report.description}
                    </p>
                    <div className="flex items-center gap-4 text-xs text-slate-500 dark:text-gray-500">
                      <span>Last generated: {report.lastGenerated}</span>
                      <span>Frequency: {report.frequency}</span>
                    </div>
                  </div>

                  {/* Right Section: Actions */}
                  <div className="flex items-center gap-3 md:pl-6 md:border-l border-slate-100 dark:border-[#27272a]">
                    <button className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-slate-600 dark:text-gray-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-gray-800 rounded-lg transition-colors">
                      <Download size={16} /> PDF
                    </button>
                    <button className="px-5 py-2 text-sm font-medium text-white bg-indigo-600 dark:bg-[#5A32FA] hover:bg-indigo-700 dark:hover:bg-[#4a26d9] rounded-lg transition-colors shadow-sm">
                      Generate
                    </button>
                  </div>

                </div>
              ))}
            </div>

          </div>
        </main>
      </div>
    </div>
  );
}