import React, { useState } from 'react';

// Adjust these imports to match your actual file structure
import {InstituteOwnerSidebar  } from '../components/InstitiuteOwnerSidebar';
import { InstituteOwnerTopbar} from '../components/InstituteOwnerTopbar';

// --- Mock Data ---
const topMetrics = [
  { title: "Monthly Savings", value: "₹263K", subtext: "50% cost reduction", valueColor: "text-emerald-600" },
  { title: "Annual Projection", value: "₹31.5L", subtext: "12-month forecast", valueColor: "text-brand-teal-600" },
  { title: "Tutor Hours Saved", value: "263h", subtext: "per month", valueColor: "text-brand-text" },
  { title: "Cost Per Assessment", value: "₹18", subtext: "vs ₹200 manual", valueColor: "text-brand-text" },
];

const monthlyComparison = [
  { month: "Sep", manual: 425, ai: 213, saved: 213 },
  { month: "Oct", manual: 475, ai: 238, saved: 238 },
  { month: "Nov", manual: 510, ai: 255, saved: 255 },
  { month: "Dec", manual: 510, ai: 255, saved: 255 },
  { month: "Jan", manual: 525, ai: 263, saved: 263 },
];

const costBreakdown = [
  { category: "Manual Grading (per student)", manual: "₹2,000/mo", ai: "₹0", savings: "₹2,000" },
  { category: "Pronunciation Assessment", manual: "₹1,200/mo", ai: "₹800/mo", savings: "₹400" },
  { category: "Progress Reports", manual: "₹800/mo", ai: "₹200/mo", savings: "₹600" },
  { category: "Practice Monitoring", manual: "₹1,000/mo", ai: "₹250/mo", savings: "₹750" },
  { category: "Tutor Coordination Time", manual: "₹500/mo", ai: "₹0", savings: "₹500" },
];

export default function RoiAnalytics() {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  return (
    <div className="relative min-h-screen font-plex antialiased overflow-x-hidden bg-brand-bg text-brand-text">

      {/* Sidebar */}
      <InstituteOwnerSidebar
        activeTab="roi" // Adjust this to match your sidebar's active item for ROI
        isCollapsed={isSidebarCollapsed}
        toggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
      />

      {/* Main Layout Wrapper */}
      <div className={`relative z-10 transition-all duration-300 ${isSidebarCollapsed ? 'lg:pl-24' : 'lg:pl-72'}`}>

        {/* Topbar */}
        <InstituteOwnerTopbar />

        {/* Main Content */}
        <main className="px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-8 max-w-[90rem] mx-auto pb-16">

            {/* Header Section */}
            <div className="relative overflow-hidden rounded-3xl bg-brand-ink-deep text-white border border-brand-line-16 p-6 sm:p-8 shadow-sm">
              <h1 className="font-manrope text-3xl sm:text-4xl font-black tracking-tight leading-tight mb-2 text-white">Return on Investment</h1>
              <p className="text-sm sm:text-base text-brand-on-ink max-w-3xl font-medium">
                AI-powered assessments save <span className="font-bold text-brand-mint">₹263K/month</span> compared to manual methods.
                Projected annual savings: <span className="font-bold text-brand-mint">₹31.5L</span>.
              </p>
            </div>

            {/* Top Metric Cards */}
            <section className="space-y-4">
              <p className="font-jetbrains text-[11px] font-bold tracking-[0.2em] uppercase text-brand-text-mute px-1">
                Savings Snapshot
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

            {/* Monthly Cost Comparison */}
            <div className="bg-white border border-brand-line rounded-2xl p-5 sm:p-6 shadow-sm">
              <h3 className="text-lg sm:text-xl font-bold mb-6 text-brand-text">Monthly Cost Comparison</h3>
              <div className="space-y-4">
                {monthlyComparison.map((row, idx) => {
                  // Calculate the width for the AI bar relative to the Manual bar
                  const aiPercentage = (row.ai / row.manual) * 100;

                  return (
                    <div key={idx} className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
                      <span className="font-jetbrains text-[10px] font-bold tracking-[0.15em] uppercase w-10 shrink-0 text-brand-text-mute">{row.month}</span>

                      {/* Comparison Bar */}
                      <div className="flex-1 min-w-0 relative h-10 bg-red-50 border border-red-200 rounded-lg flex items-center overflow-hidden">
                        {/* Manual Cost Text */}
                        <div className="absolute left-3 text-red-600 text-xs sm:text-sm font-medium z-0">
                          Manual: ₹{row.manual}K
                        </div>

                        {/* Overlapping AI Cost Bar */}
                        <div
                          className="absolute left-0 top-0 h-full bg-emerald-100 border-r border-emerald-400 flex items-center z-10"
                          style={{ width: `${aiPercentage}%` }}
                        >
                          <div className="absolute right-3 text-emerald-700 text-xs sm:text-sm font-medium">
                            AI: ₹{row.ai}K
                          </div>
                        </div>
                      </div>

                      {/* Savings Label */}
                      <span className="sm:w-32 shrink-0 text-left sm:text-right text-emerald-600 text-sm font-bold">
                        Saved: ₹{row.saved}K
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Cost Breakdown Per Student */}
            <div className="bg-white border border-brand-line rounded-2xl p-5 sm:p-6 shadow-sm">
              <h3 className="text-lg sm:text-xl font-bold mb-6 text-brand-text">Cost Breakdown Per Student</h3>
              <div className="overflow-x-auto w-full">
                <table className="w-full text-left min-w-[600px]">
                  <thead>
                    <tr className="font-jetbrains text-[10px] font-bold tracking-[0.15em] uppercase text-brand-text-mute border-b border-brand-line">
                      <th className="pb-3 font-bold">Category</th>
                      <th className="pb-3 font-bold text-center">Manual Cost</th>
                      <th className="pb-3 font-bold text-center">AI Cost</th>
                      <th className="pb-3 font-bold text-right">Savings</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-brand-line text-sm">
                    {costBreakdown.map((row, idx) => (
                      <tr key={idx} className="hover:bg-brand-bg-alt transition-colors">
                        <td className="py-4 text-brand-text font-medium">{row.category}</td>
                        <td className="py-4 text-center text-red-600">{row.manual}</td>
                        <td className="py-4 text-center text-brand-text-mute">{row.ai}</td>
                        <td className="py-4 text-right text-emerald-600 font-semibold">{row.savings}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="border-t-2 border-brand-line text-sm">
                    <tr>
                      <td className="py-4 font-bold text-brand-text">Total</td>
                      <td className="py-4 text-center font-bold text-red-600">₹5,500/mo</td>
                      <td className="py-4 text-center font-bold text-brand-text">₹1,250/mo</td>
                      <td className="py-4 text-right font-bold text-emerald-600">₹4,250</td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>

        </main>
      </div>
    </div>
  );
}
