import React, { useState } from 'react';

// Adjust these imports to match your actual file structure
import {InstituteOwnerSidebar  } from '../components/InstitiuteOwnerSidebar';
import { InstituteOwnerTopbar} from '../components/InstituteOwnerTopbar';

// --- Mock Data ---
const topMetrics = [
  { title: "Monthly Savings", value: "₹263K", subtext: "50% cost reduction", valueColor: "text-emerald-600 dark:text-[#10B981]" },
  { title: "Annual Projection", value: "₹31.5L", subtext: "12-month forecast", valueColor: "text-indigo-600 dark:text-[#A67CFF]" },
  { title: "Tutor Hours Saved", value: "263h", subtext: "per month", valueColor: "text-slate-900 dark:text-white" },
  { title: "Cost Per Assessment", value: "₹18", subtext: "vs ₹200 manual", valueColor: "text-slate-900 dark:text-white" },
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
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-[#0a0a0a] font-sans text-slate-900 dark:text-white transition-colors duration-300">
      
      {/* Sidebar */}
      <div className="hidden lg:block">
        <InstituteOwnerSidebar 
          activeTab="roi" // Adjust this to match your sidebar's active item for ROI
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
            
            {/* Header Section */}
            <div className="bg-emerald-600 dark:bg-[#114E3A] rounded-xl p-6 md:p-8 text-white shadow-sm">
              <h1 className="text-3xl font-bold mb-2">Return on Investment</h1>
              <p className="text-emerald-50 md:text-lg max-w-3xl">
                AI-powered assessments save <span className="font-bold">₹263K/month</span> compared to manual methods.
                Projected annual savings: <span className="font-bold">₹31.5L</span>.
              </p>
            </div>

            {/* Top Metric Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {topMetrics.map((metric, idx) => (
                <div key={idx} className="bg-white dark:bg-[#121214] border border-slate-200 dark:border-[#27272a] rounded-xl p-5 shadow-sm">
                  <p className="text-slate-500 dark:text-gray-400 text-sm mb-1">{metric.title}</p>
                  <h2 className={`text-3xl font-bold mb-1 ${metric.valueColor}`}>{metric.value}</h2>
                  <p className="text-slate-500 dark:text-gray-500 text-xs">{metric.subtext}</p>
                </div>
              ))}
            </div>

            {/* Monthly Cost Comparison */}
            <div className="bg-white dark:bg-[#121214] border border-slate-200 dark:border-[#27272a] rounded-xl p-6 shadow-sm">
              <h3 className="text-xl font-bold mb-6">Monthly Cost Comparison</h3>
              <div className="space-y-4">
                {monthlyComparison.map((row, idx) => {
                  // Calculate the width for the AI bar relative to the Manual bar
                  const aiPercentage = (row.ai / row.manual) * 100;
                  
                  return (
                    <div key={idx} className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
                      <span className="w-10 text-slate-500 dark:text-gray-400 font-medium">{row.month}</span>
                      
                      {/* Comparison Bar */}
                      <div className="flex-1 relative h-10 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/50 rounded flex items-center overflow-hidden">
                        {/* Manual Cost Text */}
                        <div className="absolute left-3 text-red-600 dark:text-red-500 text-sm z-0">
                          Manual: ₹{row.manual}K
                        </div>
                        
                        {/* Overlapping AI Cost Bar */}
                        <div 
                          className="absolute left-0 top-0 h-full bg-emerald-100 dark:bg-[#0D2B1F] border-r border-emerald-400 dark:border-[#10B981] flex items-center z-10"
                          style={{ width: `${aiPercentage}%` }}
                        >
                          <div className="absolute right-3 text-emerald-700 dark:text-[#10B981] text-sm font-medium">
                            AI: ₹{row.ai}K
                          </div>
                        </div>
                      </div>
                      
                      {/* Savings Label */}
                      <span className="sm:w-32 text-left sm:text-right text-emerald-600 dark:text-[#10B981] text-sm font-semibold">
                        Saved: ₹{row.saved}K
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Cost Breakdown Per Student */}
            <div className="bg-white dark:bg-[#121214] border border-slate-200 dark:border-[#27272a] rounded-xl p-6 shadow-sm overflow-x-auto">
              <h3 className="text-xl font-bold mb-6">Cost Breakdown Per Student</h3>
              <table className="w-full text-left min-w-[600px]">
                <thead>
                  <tr className="text-slate-500 dark:text-gray-400 border-b border-slate-200 dark:border-[#27272a]">
                    <th className="pb-3 font-medium">Category</th>
                    <th className="pb-3 font-medium text-center">Manual Cost</th>
                    <th className="pb-3 font-medium text-center">AI Cost</th>
                    <th className="pb-3 font-medium text-right">Savings</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-[#27272a]">
                  {costBreakdown.map((row, idx) => (
                    <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-white/5 transition-colors">
                      <td className="py-4 text-slate-700 dark:text-gray-200 font-medium">{row.category}</td>
                      <td className="py-4 text-center text-red-600 dark:text-red-400">{row.manual}</td>
                      <td className="py-4 text-center text-slate-700 dark:text-gray-300">{row.ai}</td>
                      <td className="py-4 text-right text-emerald-600 dark:text-[#10B981] font-semibold">{row.savings}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="border-t-2 border-slate-200 dark:border-[#27272a]">
                  <tr>
                    <td className="py-4 font-bold text-slate-900 dark:text-white">Total</td>
                    <td className="py-4 text-center font-bold text-red-600 dark:text-red-500">₹5,500/mo</td>
                    <td className="py-4 text-center font-bold text-slate-900 dark:text-white">₹1,250/mo</td>
                    <td className="py-4 text-right font-bold text-emerald-600 dark:text-[#10B981]">₹4,250</td>
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