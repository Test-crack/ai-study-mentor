import React, { useState } from 'react';
import { FileText, TrendingUp, Users, DollarSign, Calendar, Download } from 'lucide-react';

// Adjust these imports to match your actual file structure
import {  InstituteOwnerSidebar} from '../components/InstitiuteOwnerSidebar';
import { InstituteOwnerTopbar} from '../components/InstituteOwnerTopbar';

// --- Mock Data ---
const topMetrics = [
  { title: "Reports Generated", value: "24", subtext: "This month", icon: FileText, iconColor: "text-brand-text-mute" },
  { title: "Avg Score Improvement", value: "+16%", subtext: "Across all batches", icon: TrendingUp, iconColor: "text-emerald-600" },
  { title: "Student Satisfaction", value: "93%", subtext: "+5% from last quarter", icon: Users, iconColor: "text-brand-blue-600" },
  { title: "$ Cost Savings", value: "₹2.6L/mo", subtext: "vs manual assessment", icon: DollarSign, iconColor: "text-emerald-600" },
];

const availableReports = [
  {
    id: 1,
    title: "Monthly Performance Summary",
    tag: "Performance",
    tagColor: "text-brand-blue-700 bg-brand-blue-50 border-brand-blue-200",
    description: "Comprehensive overview of all batches, tutors, and student outcomes for the month",
    lastGenerated: "Feb 15, 2025",
    frequency: "Monthly"
  },
  {
    id: 2,
    title: "ROI & Cost Analysis",
    tag: "Financial",
    tagColor: "text-emerald-700 bg-emerald-50 border-emerald-200",
    description: "Detailed breakdown of AI vs manual costs, savings trajectory, and investment justification",
    lastGenerated: "Feb 1, 2025",
    frequency: "Monthly"
  },
  {
    id: 3,
    title: "Tutor Effectiveness Report",
    tag: "HR",
    tagColor: "text-brand-warm bg-brand-warm-tint border-brand-warm/20",
    description: "Individual tutor performance metrics, AI alignment scores, and improvement recommendations",
    lastGenerated: "Feb 10, 2025",
    frequency: "Bi-weekly"
  },
  {
    id: 4,
    title: "Student Progress Cohort Report",
    tag: "Academic",
    tagColor: "text-brand-teal-700 bg-brand-teal-50 border-brand-teal-200",
    description: "Cohort-level analysis of student improvements, struggle areas, and intervention outcomes",
    lastGenerated: "Feb 12, 2025",
    frequency: "Weekly"
  },
  {
    id: 5,
    title: "Batch Health & Capacity Report",
    tag: "Operations",
    tagColor: "text-brand-text-mute bg-brand-bg-alt border-brand-line",
    description: "Enrollment capacity, attendance trends, and risk assessment across all active batches",
    lastGenerated: "Feb 14, 2025",
    frequency: "Weekly"
  },
  {
    id: 6,
    title: "Board Presentation Deck",
    tag: "Executive",
    tagColor: "text-red-600 bg-red-50 border-red-200",
    description: "Auto-generated executive summary with key metrics, charts, and strategic recommendations",
    lastGenerated: "Jan 31, 2025",
    frequency: "Quarterly"
  }
];

export default function StrategicReport() {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  return (
    <div className="relative min-h-screen font-plex antialiased overflow-x-hidden bg-brand-bg text-brand-text">

      {/* Sidebar */}
      <InstituteOwnerSidebar
        activeTab="strategic-reports" // Adjust this to match your sidebar's active item
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
                Reporting Overview
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {topMetrics.map((metric, idx) => {
                  const Icon = metric.icon;
                  return (
                    <div key={idx} className="bg-white border border-brand-line rounded-2xl p-5 shadow-sm flex flex-col justify-between">
                      <div className="flex items-center gap-2 mb-3">
                        <Icon size={16} className={`shrink-0 ${metric.iconColor}`} />
                        <p className="font-jetbrains text-[10px] font-bold tracking-[0.15em] uppercase text-brand-text-mute">{metric.title}</p>
                      </div>
                      <div>
                        <h2 className="text-3xl sm:text-4xl font-black text-brand-text mb-1 leading-none">{metric.value}</h2>
                        <p className="text-xs font-medium text-brand-text-mute">{metric.subtext}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>

            {/* Reports Section Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <h2 className="text-xl sm:text-2xl font-bold text-brand-text">Available Reports</h2>
              <button className="w-full sm:w-auto min-h-[44px] flex items-center justify-center gap-2 px-4 py-2 bg-white border border-brand-line rounded-xl text-sm font-bold text-brand-text hover:bg-brand-bg-alt transition-colors shadow-sm">
                <Calendar size={16} /> Schedule Report
              </button>
            </div>

            {/* Reports List */}
            <div className="space-y-4">
              {availableReports.map((report) => (
                <div
                  key={report.id}
                  className="bg-white border border-brand-line rounded-2xl p-5 shadow-sm flex flex-col lg:flex-row lg:items-center justify-between gap-6 hover:border-brand-teal-300 transition-colors"
                >

                  {/* Left Section: Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-3 mb-2">
                      <h3 className="text-base sm:text-lg font-bold text-brand-text">{report.title}</h3>
                      <span className={`font-jetbrains text-[10px] font-bold tracking-[0.1em] uppercase px-2 py-0.5 rounded border ${report.tagColor}`}>
                        {report.tag}
                      </span>
                    </div>
                    <p className="text-sm text-brand-text-mute mb-3">
                      {report.description}
                    </p>
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-brand-text-mute">
                      <span>Last generated: {report.lastGenerated}</span>
                      <span>Frequency: {report.frequency}</span>
                    </div>
                  </div>

                  {/* Right Section: Actions */}
                  <div className="flex items-center gap-3 shrink-0 lg:pl-6 lg:border-l border-brand-line">
                    <button className="min-h-[44px] flex items-center gap-1.5 px-3 py-2 text-sm font-bold text-brand-text-mute hover:text-brand-text hover:bg-brand-bg-alt rounded-xl transition-colors">
                      <Download size={16} /> PDF
                    </button>
                    <button className="min-h-[44px] px-5 py-2 text-sm font-bold text-white bg-brand-teal-600 hover:bg-brand-teal-700 rounded-xl transition-colors shadow-sm">
                      Generate
                    </button>
                  </div>

                </div>
              ))}
            </div>

        </main>
      </div>
    </div>
  );
}
