import React, { useState } from 'react';
import { 
  Sliders, 
  Volume2, 
  CheckSquare, 
  Mic, 
  FileText, 
  BookOpen, 
  Target 
} from 'lucide-react';

// Adjust these imports to match your actual file structure
import { InstituteOwnerSidebar } from '../components/InstitiuteOwnerSidebar';
import { InstituteOwnerTopbar } from '../components/InstituteOwnerTopbar';

// --- Mock Data ---
const topMetrics = [
  { title: "Overall AI Accuracy", value: "88%", subtext: "Target: 90%", valueColor: "text-emerald-500" },
  { title: "Metrics Aligned", value: "4/6", subtext: "Within ±5%", valueColor: "text-slate-900 dark:text-white" },
  { title: "Last Calibration", value: "Feb 14", subtext: "5 days ago", valueColor: "text-slate-900 dark:text-white" },
  { title: "Calibration Sessions", value: "78", subtext: "Total samples reviewed", valueColor: "text-slate-900 dark:text-white" },
];

const alignmentData = [
  {
    dimension: "Pronunciation Scoring Accuracy",
    icon: Volume2,
    aiScore: 92,
    humanScore: 89,
    diff: "+3%",
    diffColor: "text-emerald-500",
  },
  {
    dimension: "Grammar Error Detection",
    icon: CheckSquare,
    aiScore: 89,
    humanScore: 91,
    diff: "-2%",
    diffColor: "text-red-500",
  },
  {
    dimension: "Fluency Assessment",
    icon: Mic,
    aiScore: 85,
    humanScore: 82,
    diff: "+3%",
    diffColor: "text-emerald-500",
  },
  {
    dimension: "Content Relevance Scoring",
    icon: FileText,
    aiScore: 90,
    humanScore: 88,
    diff: "+2%",
    diffColor: "text-emerald-500",
  },
  {
    dimension: "Vocabulary Range Evaluation",
    icon: BookOpen,
    aiScore: 79,
    humanScore: 86,
    diff: "-7%",
    diffColor: "text-red-500",
  },
  {
    dimension: "Task Achievement Rating",
    icon: Target,
    aiScore: 91,
    humanScore: 90,
    diff: "+1%",
    diffColor: "text-emerald-500",
  }
];

const recentSessions = [
  { date: "Feb 14, 2025", tutor: "Sarah Khan", samples: 25, agreement: "94%", agreementColor: "text-emerald-500", adjustments: 2 },
  { date: "Feb 10, 2025", tutor: "Ravi Kumar", samples: 20, agreement: "88%", agreementColor: "text-emerald-500", adjustments: 4 },
  { date: "Feb 7, 2025", tutor: "Deepak Sharma", samples: 15, agreement: "91%", agreementColor: "text-emerald-500", adjustments: 3 },
  { date: "Feb 3, 2025", tutor: "Priya Menon", samples: 18, agreement: "72%", agreementColor: "text-red-500", adjustments: 8 },
];

export default function AiCalibration() {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  return (
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-[#0a0a0a] font-sans text-slate-900 dark:text-white transition-colors duration-300">
      
      {/* Sidebar */}
      <div className="hidden lg:block">
        <InstituteOwnerSidebar 
          activeTab="calibration" // Adjust this to match your sidebar's active item
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
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              {topMetrics.map((metric, idx) => (
                <div key={idx} className="bg-white dark:bg-[#121214] border border-slate-200 dark:border-[#27272a] rounded-xl p-5 shadow-sm">
                  <p className="text-slate-500 dark:text-gray-400 text-sm mb-1">{metric.title}</p>
                  <h2 className={`text-3xl font-bold mb-1 ${metric.valueColor}`}>{metric.value}</h2>
                  <p className="text-xs text-slate-500 dark:text-gray-500">{metric.subtext}</p>
                </div>
              ))}
            </div>

            {/* AI vs Human Scoring Alignment Section */}
            <div className="bg-white dark:bg-[#121214] border border-slate-200 dark:border-[#27272a] rounded-xl p-6 shadow-sm">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
                <div>
                  <h2 className="text-xl font-bold text-slate-900 dark:text-white">AI vs Human Scoring Alignment</h2>
                  <p className="text-sm text-slate-500 dark:text-gray-400 mt-1">Comparison across assessment dimensions</p>
                </div>
                <button className="flex items-center gap-2 px-4 py-2 bg-brand-blue-50 dark:bg-transparent border border-brand-blue-200 dark:border-brand-blue-500/50 text-brand-blue-700 dark:text-brand-blue-400 rounded-lg text-sm font-medium hover:bg-brand-blue-100 dark:hover:bg-brand-blue-500/10 transition-colors shadow-sm dark:shadow-none">
                  <Sliders size={16} /> Run Calibration
                </button>
              </div>

              <div className="space-y-6">
                {alignmentData.map((item, idx) => {
                  const Icon = item.icon;
                  return (
                    <div key={idx} className="border-b border-slate-100 dark:border-[#27272a] pb-6 last:border-0 last:pb-0">
                      
                      {/* Title & Difference */}
                      <div className="flex justify-between items-center mb-4">
                        <div className="flex items-center gap-2 text-slate-800 dark:text-gray-200">
                          <Icon size={18} className="text-amber-500 dark:text-yellow-600" />
                          <h3 className="font-semibold text-sm">{item.dimension}</h3>
                        </div>
                        <span className={`text-sm font-bold ${item.diffColor}`}>{item.diff}</span>
                      </div>

                      {/* Side-by-Side Progress Bars */}
                      <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-6 w-full">
                        {/* AI Score */}
                        <div className="flex items-center gap-3 w-full sm:w-1/2">
                          <span className="text-xs text-slate-500 dark:text-gray-400 w-16 whitespace-nowrap">AI Score</span>
                          <div className="flex-1 h-1.5 bg-slate-100 dark:bg-gray-800 rounded-full">
                            <div className="h-full bg-brand-blue-600 dark:bg-[#256B8B] rounded-full" style={{ width: `${item.aiScore}%` }}></div>
                          </div>
                          <span className="text-xs font-bold w-8 text-right text-slate-900 dark:text-white">{item.aiScore}%</span>
                        </div>

                        {/* Human Score */}
                        <div className="flex items-center gap-3 w-full sm:w-1/2">
                          <span className="text-xs text-slate-500 dark:text-gray-400 w-20 whitespace-nowrap">Human Score</span>
                          <div className="flex-1 h-1.5 bg-slate-100 dark:bg-gray-800 rounded-full">
                            <div className="h-full bg-brand-blue-400 dark:bg-[#256B8B] dark:opacity-70 rounded-full" style={{ width: `${item.humanScore}%` }}></div>
                          </div>
                          <span className="text-xs font-bold w-8 text-right text-slate-900 dark:text-white">{item.humanScore}%</span>
                        </div>
                      </div>

                    </div>
                  );
                })}
              </div>
            </div>

            {/* Recent Calibration Sessions Table */}
            <div className="bg-white dark:bg-[#121214] border border-slate-200 dark:border-[#27272a] rounded-xl p-6 shadow-sm overflow-hidden mt-6">
              <h3 className="text-lg font-bold mb-6 text-slate-900 dark:text-white">Recent Calibration Sessions</h3>
              <div className="overflow-x-auto w-full">
                <table className="w-full text-left text-sm whitespace-nowrap min-w-[600px]">
                  <thead>
                    <tr className="text-slate-500 dark:text-gray-400 border-b border-slate-200 dark:border-[#27272a]">
                      <th className="pb-3 font-medium">Date</th>
                      <th className="pb-3 font-medium">Tutor</th>
                      <th className="pb-3 font-medium text-center">Samples</th>
                      <th className="pb-3 font-medium text-center">Agreement</th>
                      <th className="pb-3 font-medium text-center">Adjustments</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-[#27272a]">
                    {recentSessions.map((session, idx) => (
                      <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-white/5 transition">
                        <td className="py-4 text-slate-700 dark:text-gray-300">{session.date}</td>
                        <td className="py-4 font-medium text-slate-900 dark:text-white">{session.tutor}</td>
                        <td className="py-4 text-center text-slate-700 dark:text-gray-300">{session.samples}</td>
                        <td className={`py-4 text-center font-bold ${session.agreementColor}`}>{session.agreement}</td>
                        <td className="py-4 text-center text-slate-700 dark:text-gray-300">{session.adjustments}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

          </div>
        </main>
      </div>
    </div>
  );
}