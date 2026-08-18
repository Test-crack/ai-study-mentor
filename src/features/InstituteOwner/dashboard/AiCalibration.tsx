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
  { title: "Overall AI Accuracy", value: "88%", subtext: "Target: 90%", valueColor: "text-emerald-600" },
  { title: "Metrics Aligned", value: "4/6", subtext: "Within ±5%", valueColor: "text-brand-text" },
  { title: "Last Calibration", value: "Feb 14", subtext: "5 days ago", valueColor: "text-brand-text" },
  { title: "Calibration Sessions", value: "78", subtext: "Total samples reviewed", valueColor: "text-brand-text" },
];

const alignmentData = [
  {
    dimension: "Pronunciation Scoring Accuracy",
    icon: Volume2,
    aiScore: 92,
    humanScore: 89,
    diff: "+3%",
    diffColor: "text-emerald-600",
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
    diffColor: "text-emerald-600",
  },
  {
    dimension: "Content Relevance Scoring",
    icon: FileText,
    aiScore: 90,
    humanScore: 88,
    diff: "+2%",
    diffColor: "text-emerald-600",
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
    diffColor: "text-emerald-600",
  }
];

const recentSessions = [
  { date: "Feb 14, 2025", tutor: "Sarah Khan", samples: 25, agreement: "94%", agreementColor: "text-emerald-600", adjustments: 2 },
  { date: "Feb 10, 2025", tutor: "Ravi Kumar", samples: 20, agreement: "88%", agreementColor: "text-emerald-600", adjustments: 4 },
  { date: "Feb 7, 2025", tutor: "Deepak Sharma", samples: 15, agreement: "91%", agreementColor: "text-emerald-600", adjustments: 3 },
  { date: "Feb 3, 2025", tutor: "Priya Menon", samples: 18, agreement: "72%", agreementColor: "text-red-500", adjustments: 8 },
];

export default function AiCalibration() {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  return (
    <div className="relative min-h-screen font-plex antialiased overflow-x-hidden bg-brand-bg text-brand-text">

      {/* Sidebar */}
      <InstituteOwnerSidebar
        activeTab="calibration" // Adjust this to match your sidebar's active item
        isCollapsed={isSidebarCollapsed}
        toggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
      />

      {/* Main Layout Wrapper */}
      <div className={`relative z-10 transition-all duration-300 ${isSidebarCollapsed ? 'lg:pl-24' : 'lg:pl-72'}`}>

        {/* Topbar */}
        <InstituteOwnerTopbar />

        {/* Main Content */}
        <main className="px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-8 max-w-[90rem] mx-auto pb-16">

            {/* Top Metric Cards */}
            <section className="space-y-4">
              <p className="font-jetbrains text-[11px] font-bold tracking-[0.2em] uppercase text-brand-text-mute px-1">
                Calibration Health
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {topMetrics.map((metric, idx) => (
                  <div key={idx} className="bg-white border border-brand-line rounded-2xl p-5 shadow-sm">
                    <p className="font-jetbrains text-[10px] font-bold tracking-[0.15em] uppercase text-brand-text-mute mb-2">{metric.title}</p>
                    <h2 className={`text-3xl sm:text-4xl font-black mb-1 leading-none ${metric.valueColor}`}>{metric.value}</h2>
                    <p className="text-xs font-medium text-brand-text-mute">{metric.subtext}</p>
                  </div>
                ))}
              </div>
            </section>

            {/* AI vs Human Scoring Alignment Section */}
            <div className="bg-white border border-brand-line rounded-2xl p-5 sm:p-6 shadow-sm">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
                <div>
                  <h2 className="text-lg sm:text-xl font-bold text-brand-text">AI vs Human Scoring Alignment</h2>
                  <p className="text-sm text-brand-text-mute mt-1">Comparison across assessment dimensions</p>
                </div>
                <button className="w-full sm:w-auto min-h-[44px] flex items-center justify-center gap-2 px-4 py-2 bg-brand-teal-50 border border-brand-teal-200 text-brand-teal-700 rounded-xl text-sm font-bold hover:bg-brand-teal-100 transition-colors shadow-sm">
                  <Sliders size={16} /> Run Calibration
                </button>
              </div>

              <div className="space-y-6">
                {alignmentData.map((item, idx) => {
                  const Icon = item.icon;
                  return (
                    <div key={idx} className="border-b border-brand-line pb-6 last:border-0 last:pb-0">

                      {/* Title & Difference */}
                      <div className="flex justify-between items-center gap-3 mb-4">
                        <div className="flex items-center gap-2 min-w-0 text-brand-text">
                          <Icon size={18} className="shrink-0 text-amber-500" />
                          <h3 className="font-semibold text-sm">{item.dimension}</h3>
                        </div>
                        <span className={`text-sm font-bold shrink-0 ${item.diffColor}`}>{item.diff}</span>
                      </div>

                      {/* Side-by-Side Progress Bars */}
                      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 sm:gap-6 w-full">
                        {/* AI Score */}
                        <div className="flex items-center gap-3 w-full sm:w-1/2 min-h-[44px]">
                          <span className="font-jetbrains text-[10px] font-bold tracking-[0.1em] uppercase text-brand-text-mute w-16 shrink-0 whitespace-nowrap">AI Score</span>
                          <div className="flex-1 h-1.5 bg-brand-bg-alt rounded-full">
                            <div className="h-full bg-brand-blue-600 rounded-full" style={{ width: `${item.aiScore}%` }}></div>
                          </div>
                          <span className="text-xs font-bold w-8 shrink-0 text-right text-brand-text">{item.aiScore}%</span>
                        </div>

                        {/* Human Score */}
                        <div className="flex items-center gap-3 w-full sm:w-1/2 min-h-[44px]">
                          <span className="font-jetbrains text-[10px] font-bold tracking-[0.1em] uppercase text-brand-text-mute w-20 shrink-0 whitespace-nowrap">Human Score</span>
                          <div className="flex-1 h-1.5 bg-brand-bg-alt rounded-full">
                            <div className="h-full bg-brand-teal-500 rounded-full" style={{ width: `${item.humanScore}%` }}></div>
                          </div>
                          <span className="text-xs font-bold w-8 shrink-0 text-right text-brand-text">{item.humanScore}%</span>
                        </div>
                      </div>

                    </div>
                  );
                })}
              </div>
            </div>

            {/* Recent Calibration Sessions Table */}
            <div className="bg-white border border-brand-line rounded-2xl p-5 sm:p-6 shadow-sm overflow-hidden">
              <h3 className="text-lg font-bold mb-6 text-brand-text">Recent Calibration Sessions</h3>
              <div className="overflow-x-auto w-full">
                <table className="w-full text-left text-sm whitespace-nowrap min-w-[600px]">
                  <thead>
                    <tr className="font-jetbrains text-[10px] font-bold tracking-[0.15em] uppercase text-brand-text-mute border-b border-brand-line">
                      <th className="pb-3 font-bold">Date</th>
                      <th className="pb-3 font-bold">Tutor</th>
                      <th className="pb-3 font-bold text-center">Samples</th>
                      <th className="pb-3 font-bold text-center">Agreement</th>
                      <th className="pb-3 font-bold text-center">Adjustments</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-brand-line">
                    {recentSessions.map((session, idx) => (
                      <tr key={idx} className="hover:bg-brand-bg-alt transition">
                        <td className="py-4 text-brand-text-mute">{session.date}</td>
                        <td className="py-4 font-medium text-brand-text">{session.tutor}</td>
                        <td className="py-4 text-center text-brand-text-mute">{session.samples}</td>
                        <td className={`py-4 text-center font-bold ${session.agreementColor}`}>{session.agreement}</td>
                        <td className="py-4 text-center text-brand-text-mute">{session.adjustments}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

        </main>
      </div>
    </div>
  );
}
