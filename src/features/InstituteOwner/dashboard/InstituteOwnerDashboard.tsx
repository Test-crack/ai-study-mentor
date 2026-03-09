import React, { useState } from 'react';
import { 
  ArrowUpRight, 
  DollarSign, 
  Clock, 
  TrendingUp, 
  ArrowRight, 
  Star, 
  FileText 
} from 'lucide-react';

// Adjust these imports to match your actual file structure
import { InstituteOwnerSidebar } from '../components/InstitiuteOwnerSidebar';
import { InstituteOwnerTopbar } from '../components/InstituteOwnerTopbar';
import { useNavigate } from 'react-router-dom';

export default function InstituteOwnerDashboard() {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
const navigate=useNavigate();
  return (
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-[#0a0a0a] font-sans text-slate-900 dark:text-white transition-colors duration-300">
      
      {/* Sidebar */}
      <div className="hidden lg:block">
        <InstituteOwnerSidebar 
          activeTab="owner-dashboard" // Adjust this to match your sidebar's active item
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
          <div className="max-w-[1400px] mx-auto">
            
            {/* Header Section */}
            <div className="bg-white dark:bg-[#13111c] border border-slate-200 dark:border-[#2a243d] rounded-xl p-6 mb-6 shadow-sm">
              <h1 className="text-3xl font-bold mb-2">Strategic Overview</h1>
              <p className="text-slate-500 dark:text-gray-300 mb-6 text-sm md:text-base max-w-3xl">
                105 students generating <span className="font-semibold text-slate-900 dark:text-white">₹263K/mo</span> revenue. 
                AI saving <span className="font-semibold text-slate-900 dark:text-white">₹263K/mo</span> vs manual assessment. 
                263 tutor hours freed monthly.
              </p>
              <div className="flex gap-3">
                <button onClick={() => navigate('/institute-owner/roi')} className="bg-indigo-600 dark:bg-white text-white dark:text-black px-4 py-2 rounded-lg font-medium flex items-center gap-2 hover:bg-indigo-700 dark:hover:bg-gray-200 transition shadow-sm">
                  <DollarSign size={18} /> ROI Report
                </button>
              
              </div>
            </div>

            {/* Top Metric Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
              <div className="bg-white dark:bg-[#121214] border border-slate-200 dark:border-[#27272a] rounded-xl p-5 shadow-sm">
                <p className="text-slate-500 dark:text-gray-400 text-xs mb-1">Monthly Revenue</p>
                <div className="flex justify-between items-end">
                  <h2 className="text-2xl font-bold flex items-center gap-1">
                    <span className="text-slate-400 dark:text-gray-500 text-lg">₹</span>263K
                  </h2>
                  <span className="text-emerald-600 dark:text-green-500 text-xs bg-emerald-50 dark:bg-green-500/10 px-2 py-1 rounded flex items-center gap-1">
                    <ArrowUpRight size={12} /> +15%
                  </span>
                </div>
              </div>
              
              <div className="bg-white dark:bg-[#121214] border border-slate-200 dark:border-[#27272a] rounded-xl p-5 shadow-sm">
                <p className="text-slate-500 dark:text-gray-400 text-xs mb-1">AI Savings</p>
                <div className="flex justify-between items-end">
                  <h2 className="text-2xl font-bold">₹263K</h2>
                  <span className="text-emerald-600 dark:text-green-500 text-xs bg-emerald-50 dark:bg-green-500/10 px-2 py-1 rounded flex items-center gap-1">
                    <ArrowUpRight size={12} /> vs manual
                  </span>
                </div>
              </div>

              <div className="bg-white dark:bg-[#121214] border border-slate-200 dark:border-[#27272a] rounded-xl p-5 shadow-sm">
                <p className="text-slate-500 dark:text-gray-400 text-xs mb-1">Tutor Hours Saved</p>
                <div className="flex justify-between items-end">
                  <h2 className="text-2xl font-bold flex items-center gap-2">
                    <Clock size={20} className="text-indigo-600 dark:text-purple-500"/> 263h
                  </h2>
                  <span className="text-emerald-600 dark:text-green-500 text-xs bg-emerald-50 dark:bg-green-500/10 px-2 py-1 rounded flex items-center gap-1">
                    <ArrowUpRight size={12} /> /month
                  </span>
                </div>
              </div>

              <div className="bg-white dark:bg-[#121214] border border-slate-200 dark:border-[#27272a] rounded-xl p-5 shadow-sm">
                <p className="text-slate-500 dark:text-gray-400 text-xs mb-1">Avg Improvement</p>
                <div className="flex justify-between items-end">
                  <h2 className="text-2xl font-bold flex items-center gap-2">
                    <TrendingUp size={20} className="text-blue-600 dark:text-blue-500"/> 16%
                  </h2>
                  <span className="text-emerald-600 dark:text-green-500 text-xs bg-emerald-50 dark:bg-green-500/10 px-2 py-1 rounded flex items-center gap-1">
                    <ArrowUpRight size={12} /> +2% vs last
                  </span>
                </div>
              </div>
            </div>

            {/* Cost Comparison section */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
              <div className="bg-white dark:bg-[#121214] border border-slate-200 dark:border-[#27272a] rounded-xl p-5 shadow-sm">
                <p className="text-slate-500 dark:text-gray-400 text-xs mb-1">Manual Assessment Cost</p>
                <h2 className="text-2xl font-bold text-red-600 dark:text-red-500 mb-1">₹525K/mo</h2>
                <p className="text-slate-500 dark:text-gray-500 text-xs bg-slate-100 dark:bg-[#1a1a1e] inline-block px-2 py-1 rounded">₹5,000/student × 105 students</p>
              </div>
              <div className="bg-white dark:bg-[#121214] border border-slate-200 dark:border-[#27272a] rounded-xl p-5 shadow-sm">
                <p className="text-slate-500 dark:text-gray-400 text-xs mb-1 bg-slate-100 dark:bg-gray-800 inline-block px-2 py-0.5 rounded">AI-Powered Cost</p>
                <h2 className="text-2xl font-bold mb-1">₹263K/mo</h2>
                <p className="text-slate-500 dark:text-gray-500 text-xs bg-slate-100 dark:bg-[#1a1a1e] inline-block px-2 py-1 rounded">₹2,500/student × 105 students</p>
              </div>
              <div className="bg-emerald-50 dark:bg-gradient-to-r dark:from-[#0d1f15] dark:to-[#121214] border border-emerald-200 dark:border-green-900/50 rounded-xl p-5 shadow-sm">
                <p className="text-emerald-700 dark:text-green-500 text-xs font-semibold mb-1">NET MONTHLY SAVINGS</p>
                <h2 className="text-2xl font-bold text-emerald-600 dark:text-green-400 mb-1">₹263K</h2>
                <p className="text-emerald-600/70 dark:text-green-500/70 text-xs">50% cost reduction</p>
              </div>
            </div>

            {/* Tables & Lists Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
              
              {/* Batch Performance */}
              <div className="bg-white dark:bg-[#121214] border border-slate-200 dark:border-[#27272a] rounded-xl p-5 shadow-sm overflow-hidden">
                <div className="flex justify-between items-start mb-6">
                  <div>
                    <h3 className="text-lg font-bold">Batch Performance</h3>
                    <p className="text-slate-500 dark:text-gray-400 text-xs">Cross-batch outcome comparison</p>
                  </div>
                  <button  onClick={()=>navigate('/institute-owner/insight')}   className="text-sm flex items-center gap-1 text-slate-500 dark:text-gray-300 hover:text-indigo-600 dark:hover:text-white transition">
                    Details <ArrowRight size={16} />
                  </button>
                </div>
                
                <div className="overflow-x-auto w-full">
                  <table className="w-full text-left text-sm whitespace-nowrap">
                    <thead>
                      <tr className="text-slate-500 dark:text-gray-400 border-b border-slate-200 dark:border-[#27272a]">
                        <th className="pb-3 font-medium">Batch</th>
                        <th className="pb-3 font-medium">Tutor</th>
                        <th className="pb-3 font-medium text-center">Students</th>
                        <th className="pb-3 font-medium text-center">Avg Score</th>
                        <th className="pb-3 font-medium text-center">Improvement</th>
                        <th className="pb-3 font-medium text-right">Retention</th>
                      </tr>
                    </thead>
                    <tbody>
                      {[
                        { batch: "IELTS Batch 12", tutor: "Sarah Khan", students: 28, score: 7.2, imp: "+18%", ret: "96%", impColor: "text-emerald-600 dark:text-green-500", retColor: "text-emerald-600 dark:text-green-500" },
                        { batch: "Spoken English A", tutor: "Ravi Kumar", students: 35, score: 6.8, imp: "+22%", ret: "91%", impColor: "text-emerald-600 dark:text-green-500", retColor: "text-emerald-600 dark:text-green-500" },
                        { batch: "Tech Prep Batch 5", tutor: "Deepak Sharma", students: 20, score: 7.5, imp: "+15%", ret: "100%", impColor: "text-emerald-600 dark:text-green-500", retColor: "text-emerald-600 dark:text-green-500" },
                        { batch: "IELTS Evening", tutor: "Priya Menon", students: 22, score: 6.1, imp: "+8%", ret: "82%", impColor: "text-amber-600 dark:text-yellow-500", retColor: "text-amber-600 dark:text-yellow-500" },
                      ].map((row, idx) => (
                        <tr key={idx} className="border-b border-slate-100 dark:border-[#27272a] last:border-0 hover:bg-slate-50 dark:hover:bg-white/5 transition">
                          <td className="py-3 font-medium">{row.batch}</td>
                          <td className="py-3 text-slate-600 dark:text-gray-300">{row.tutor}</td>
                          <td className="py-3 text-center">{row.students}</td>
                          <td className="py-3 text-center font-semibold">{row.score}</td>
                          <td className={`py-3 text-center ${row.impColor}`}>{row.imp}</td>
                          <td className={`py-3 text-right ${row.retColor}`}>{row.ret}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Tutor Effectiveness */}
              <div className="bg-white dark:bg-[#121214] border border-slate-200 dark:border-[#27272a] rounded-xl p-5 shadow-sm">
                <div className="flex justify-between items-start mb-6">
                  <div>
                    <h3 className="text-lg font-bold">Tutor Effectiveness</h3>
                    <p className="text-slate-500 dark:text-gray-400 text-xs">Performance and AI alignment scores</p>
                  </div>
                  <button onClick={()=>navigate('/institute-owner/tuteffect')} className="text-sm flex items-center gap-1 text-slate-500 dark:text-gray-300 hover:text-indigo-600 dark:hover:text-white transition">
                    Full Report <ArrowRight size={16} />
                  </button>
                </div>

                <div className="space-y-4">
                  {[
                    { init: "SK", name: "Sarah Khan", desc: "2 batches • 50 students", imp: "+20%", align: "94%", rating: "4.8", color: "bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300" },
                    { init: "RK", name: "Ravi Kumar", desc: "1 batches • 35 students", imp: "+22%", align: "88%", rating: "4.6", color: "bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300" },
                    { init: "DS", name: "Deepak Sharma", desc: "1 batches • 20 students", imp: "+15%", align: "91%", rating: "4.7", color: "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300" },
                    { init: "PM", name: "Priya Menon", desc: "1 batches • 22 students", imp: "+8%", align: "72%", rating: "3.9", color: "bg-pink-100 text-pink-700 dark:bg-pink-900 dark:text-pink-300" },
                  ].map((tutor, idx) => (
                    <div key={idx} className="flex items-center justify-between p-2 hover:bg-slate-50 dark:hover:bg-[#1a1a1e] rounded-lg transition">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm ${tutor.color}`}>
                          {tutor.init}
                        </div>
                        <div>
                          <h4 className="font-semibold text-sm">{tutor.name}</h4>
                          <p className="text-xs text-slate-500 dark:text-gray-500">{tutor.desc}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-6 text-sm text-center">
                        <div>
                          <p className="text-slate-400 dark:text-gray-400 text-[10px] mb-1">Improvement</p>
                          <p className="text-emerald-600 dark:text-green-500 font-semibold">{tutor.imp}</p>
                        </div>
                        <div>
                          <p className="text-slate-400 dark:text-gray-400 text-[10px] mb-1">AI Align</p>
                          <p className={tutor.align === "72%" ? "text-amber-500 dark:text-yellow-500 font-semibold" : "text-emerald-600 dark:text-green-500 font-semibold"}>{tutor.align}</p>
                        </div>
                        <div>
                          <p className="text-slate-400 dark:text-gray-400 text-[10px] mb-1">Rating</p>
                          <p className="font-semibold flex items-center justify-center gap-1">
                            <Star size={12} className={tutor.rating === "3.9" ? "text-amber-500 dark:text-yellow-500" : "text-orange-400"} fill="currentColor" /> {tutor.rating}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Bottom Metric Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pb-8">
              {/* Satisfaction */}
              <div className="bg-white dark:bg-[#121214] border border-slate-200 dark:border-[#27272a] rounded-xl p-5 shadow-sm">
                <p className="text-slate-500 dark:text-gray-400 text-sm mb-2">Student Satisfaction</p>
                <h2 className="text-3xl font-bold text-blue-600 dark:text-blue-400 mb-4">93%</h2>
                <div className="w-full bg-slate-100 dark:bg-gray-800 rounded-full h-1.5 mb-2">
                  <div className="bg-blue-500 h-1.5 rounded-full" style={{ width: '93%' }}></div>
                </div>
                <p className="text-emerald-600 dark:text-green-500 text-xs">+8% from last quarter</p>
              </div>

              {/* Retention */}
              <div className="bg-white dark:bg-[#121214] border border-slate-200 dark:border-[#27272a] rounded-xl p-5 shadow-sm">
                <p className="text-slate-500 dark:text-gray-400 text-sm mb-2">Student Retention Rate</p>
                <h2 className="text-3xl font-bold text-indigo-600 dark:text-purple-400 mb-4">92%</h2>
                <div className="w-full bg-slate-100 dark:bg-gray-800 rounded-full h-1.5 mb-2">
                  <div className="bg-indigo-500 dark:bg-purple-500 h-1.5 rounded-full" style={{ width: '92%' }}></div>
                </div>
                <p className="text-slate-500 dark:text-gray-500 text-xs">Industry avg. 78%</p>
              </div>

              {/* ROI Projection */}
              <div className="bg-white dark:bg-[#121214] border border-slate-200 dark:border-[#27272a] rounded-xl p-5 flex flex-col justify-center shadow-sm">
                <p className="text-slate-500 dark:text-gray-400 text-sm mb-2">Annual ROI Projection</p>
                <h2 className="text-3xl font-bold mb-2">₹31.5L</h2>
                <p className="text-slate-500 dark:text-gray-500 text-xs">Projected annual savings</p>
              </div>
            </div>

          </div>
        </main>
      </div>
    </div>
  );
}