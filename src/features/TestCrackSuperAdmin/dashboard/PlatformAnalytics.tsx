import React, { useState } from 'react';
import { 
  Users, 
  Building2, 
  Activity, 
  Clock, 
  Mic, 
  BookOpen, 
  Zap, 
  MessageSquare, 
  BookMarked
} from 'lucide-react';
import { SuperAdminSidebar } from '../Components/SuperadminSidebar';
import { SuperAdminTopbar } from '../Components/Superadmintopbar';

export default function PlatformAnalytics() {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  // --- Mock Data ---
  const topMetrics = [
    { title: "Weekly Active Students", value: "890", change: "+8.3%", icon: Users },
    { title: "Active Institutes", value: "20", change: "+2 this month", icon: Building2 },
    { title: "Sessions This Week", value: "1,920", change: "+12.1%", icon: Activity },
    { title: "Avg Sessions/Student", value: "2.2", change: "+0.3", icon: Clock },
  ];

  const wauTrend = [
    { week: "W1", students: 680, sessions: 1420 },
    { week: "W2", students: 720, sessions: 1580 },
    { week: "W3", students: 810, sessions: 1750 },
    { week: "W4", students: 890, sessions: 1920 },
  ];

  const featureAdoption = [
    { name: "Voice Lab", icon: Mic, sessions: "4,200", usersPercent: 78, barPercent: 90 },
    { name: "Reading Practice", icon: BookOpen, sessions: "3,100", usersPercent: 65, barPercent: 75 },
    { name: "Speed Reader", icon: Zap, sessions: "2,400", usersPercent: 52, barPercent: 55 },
    { name: "Spoken English", icon: MessageSquare, sessions: "1,800", usersPercent: 44, barPercent: 45 },
    { name: "Curriculum Study", icon: BookMarked, sessions: "1,500", usersPercent: 38, barPercent: 35 },
  ];

  const geoDistribution = [
    { region: "South India", institutes: 8, students: 420, percent: 37 },
    { region: "North India", institutes: 5, students: 310, percent: 27 },
    { region: "West India", institutes: 3, students: 200, percent: 17 },
    { region: "East India", institutes: 2, students: 120, percent: 10 },
    { region: "International", institutes: 2, students: 95, percent: 8 },
  ];

  const systemHealth = [
    { label: "API Uptime", value: "99.97%", status: "good" },
    { label: "Avg Response Time", value: "142ms", status: "good" },
    { label: "Error Rate", value: "0.03%", status: "good" },
    { label: "AI Assessment Queue", value: "12 pending", status: "warning" },
  ];

  return (
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-[#0B0A10] font-sans text-slate-900 dark:text-slate-200 transition-colors duration-300">
      
      {/* Sidebar */}
      <div className="hidden lg:block">
        <SuperAdminSidebar 
          activeTab="platform-analytics" 
          isCollapsed={isSidebarCollapsed} 
          toggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)} 
        />
      </div>

      <div className={`transition-all duration-300 flex flex-col min-h-screen ${isSidebarCollapsed ? 'lg:pl-20' : 'lg:pl-64'}`}>
        
        {/* Topbar */}
        <SuperAdminTopbar />

        <main className="flex-1 p-4 sm:p-6 lg:p-8">
          <div className="max-w-[1400px] mx-auto space-y-6">
            
            {/* Top Metrics Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {topMetrics.map((metric, idx) => (
                <div key={idx} className="bg-white dark:bg-[#15141B] border border-slate-200 dark:border-[#26252D] rounded-xl p-5 shadow-sm transition-colors flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <metric.icon className="w-4 h-4 text-brand-teal-500 dark:text-brand-teal-400" />
                      <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">{metric.title}</p>
                    </div>
                    <h3 className="text-2xl font-bold text-slate-900 dark:text-white">{metric.value}</h3>
                    <p className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium mt-1">{metric.change}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Weekly Active Users Trend */}
            <div className="bg-white dark:bg-[#15141B] border border-slate-200 dark:border-[#26252D] rounded-xl shadow-sm p-6 transition-colors">
              <h2 className="text-base font-bold text-slate-900 dark:text-white mb-8">Weekly Active Users Trend</h2>
              <div className="grid grid-cols-4 gap-4">
                {wauTrend.map((week, idx) => (
                  <div key={idx} className="flex flex-col items-center justify-end h-[160px] relative group">
                    <div className="w-full max-w-[100px] flex flex-col gap-1 items-center">
                      <div className="text-center mb-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <span className="text-lg font-bold text-slate-900 dark:text-white block">{week.students}</span>
                        <span className="text-[10px] text-slate-500 dark:text-slate-400">students</span>
                      </div>
                      
                      {/* Bar 1: Students */}
                      <div 
                        className="w-full bg-slate-200 dark:bg-[#26252D] rounded-sm relative group-hover:bg-brand-teal-100 dark:group-hover:bg-[#2E2D38] transition-colors"
                        style={{ height: '4px' }}
                      ></div>
                      
                      <div className="text-center mt-1">
                        <span className="text-lg font-bold text-brand-teal-600 dark:text-[#4E8CA6] block">{week.sessions}</span>
                        <span className="text-[10px] text-brand-teal-400 dark:text-brand-teal-400/50">sessions</span>
                      </div>
                      
                      {/* Bar 2: Sessions */}
                      <div 
                        className="w-full bg-brand-teal-500 dark:bg-[#185A78] rounded-sm"
                        style={{ height: '4px' }}
                      ></div>
                      
                      <span className="text-xs font-medium text-slate-500 dark:text-slate-400 mt-4">{week.week}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Main Middle Split */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              
              {/* Feature Adoption */}
              <div className="bg-white dark:bg-[#15141B] border border-slate-200 dark:border-[#26252D] rounded-xl shadow-sm p-6 transition-colors">
                <h2 className="text-base font-bold text-slate-900 dark:text-white mb-6">Feature Adoption</h2>
                <div className="space-y-6">
                  {featureAdoption.map((feature, idx) => (
                    <div key={idx} className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-2 text-slate-900 dark:text-white font-medium">
                          <feature.icon className="w-4 h-4 text-brand-teal-500 dark:text-[#4E8CA6]" />
                          {feature.name}
                        </div>
                        <span className="text-slate-500 dark:text-slate-400 text-xs">{feature.sessions} sessions</span>
                      </div>
                      <div className="w-full h-1.5 bg-slate-100 dark:bg-[#26252D] rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-brand-teal-500 dark:bg-[#185A78] rounded-full"
                          style={{ width: `${feature.barPercent}%` }}
                        ></div>
                      </div>
                      <p className="text-[10px] text-slate-500 dark:text-slate-500 text-right">{feature.usersPercent}% of users</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Geographic Distribution */}
              <div className="bg-white dark:bg-[#15141B] border border-slate-200 dark:border-[#26252D] rounded-xl shadow-sm p-6 transition-colors">
                <h2 className="text-base font-bold text-slate-900 dark:text-white mb-6">Geographic Distribution</h2>
                <div className="space-y-4">
                  {geoDistribution.map((geo, idx) => (
                    <div key={idx} className="flex items-center justify-between p-3 rounded-lg hover:bg-slate-50 dark:hover:bg-white/[0.02] transition-colors border border-transparent hover:border-slate-100 dark:hover:border-[#26252D]">
                      <div>
                        <h4 className="font-semibold text-sm text-slate-900 dark:text-white">{geo.region}</h4>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                          {geo.institutes} institutes • {geo.students} students
                        </p>
                      </div>
                      <div className="text-right">
                        <span className="text-lg font-bold text-slate-900 dark:text-white">{geo.percent}%</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

            </div>

            {/* System Health */}
            <div className="bg-white dark:bg-[#15141B] border border-slate-200 dark:border-[#26252D] rounded-xl shadow-sm p-6 transition-colors">
              <h2 className="text-base font-bold text-slate-900 dark:text-white mb-6">System Health</h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                {systemHealth.map((metric, idx) => (
                  <div key={idx}>
                    <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">{metric.label}</p>
                    <h3 className={`text-2xl font-bold ${
                      metric.status === 'good' 
                        ? 'text-emerald-600 dark:text-emerald-400' 
                        : 'text-amber-500 dark:text-amber-400'
                    }`}>
                      {metric.value}
                    </h3>
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