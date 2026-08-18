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
    <div className="relative min-h-screen font-plex antialiased overflow-x-hidden bg-brand-bg text-brand-text">

      {/* Sidebar */}
      <SuperAdminSidebar
        activeTab="platform-analytics"
        isCollapsed={isSidebarCollapsed}
        toggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
      />

      <div className={`relative z-10 transition-all duration-300 ${isSidebarCollapsed ? 'lg:pl-24' : 'lg:pl-72'}`}>

        {/* Topbar */}
        <SuperAdminTopbar />

        <main className="px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-8 max-w-[90rem] mx-auto pb-16">

            {/* Top Metrics Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {topMetrics.map((metric, idx) => (
                <div key={idx} className="bg-white border border-brand-line rounded-2xl p-4 sm:p-6 shadow-sm flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      <metric.icon className="w-4 h-4 text-brand-teal-500 shrink-0" />
                      <p className="font-jetbrains text-[10px] font-bold text-brand-text-mute uppercase tracking-[0.15em]">{metric.title}</p>
                    </div>
                    <h3 className="text-2xl font-black text-brand-text">{metric.value}</h3>
                    <p className="text-[10px] text-emerald-600 font-medium mt-1">{metric.change}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Weekly Active Users Trend */}
            <div className="bg-white border border-brand-line rounded-2xl shadow-sm p-4 sm:p-6">
              <h2 className="font-manrope text-base font-bold text-brand-text mb-6 sm:mb-8">Weekly Active Users Trend</h2>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {wauTrend.map((week, idx) => (
                  <div key={idx} className="flex flex-col items-center justify-end h-56 sm:h-64 lg:h-72 relative group">
                    <div className="w-full max-w-[100px] flex flex-col gap-1 items-center">
                      <div className="text-center mb-2 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                        <span className="text-lg font-black text-brand-text block">{week.students}</span>
                        <span className="font-jetbrains text-[10px] font-bold uppercase tracking-[0.12em] text-brand-text-mute">students</span>
                      </div>

                      {/* Bar 1: Students */}
                      <div
                        className="w-full bg-brand-line rounded-sm relative group-hover:bg-brand-teal-100 transition-colors"
                        style={{ height: '4px' }}
                      ></div>

                      <div className="text-center mt-1">
                        <span className="text-lg font-black text-brand-teal-600 block">{week.sessions}</span>
                        <span className="font-jetbrains text-[10px] font-bold uppercase tracking-[0.12em] text-brand-teal-500">sessions</span>
                      </div>

                      {/* Bar 2: Sessions */}
                      <div
                        className="w-full bg-brand-teal-500 rounded-sm"
                        style={{ height: '4px' }}
                      ></div>

                      <span className="font-jetbrains text-[11px] font-bold uppercase tracking-[0.12em] text-brand-text-mute mt-4">{week.week}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Main Middle Split */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

              {/* Feature Adoption */}
              <div className="bg-white border border-brand-line rounded-2xl shadow-sm p-4 sm:p-6">
                <h2 className="font-manrope text-base font-bold text-brand-text mb-6">Feature Adoption</h2>
                <div className="space-y-6">
                  {featureAdoption.map((feature, idx) => (
                    <div key={idx} className="space-y-2">
                      <div className="flex items-center justify-between gap-3 text-sm">
                        <div className="flex items-center gap-2 text-brand-text font-semibold min-w-0">
                          <feature.icon className="w-4 h-4 text-brand-teal-500 shrink-0" />
                          <span className="truncate">{feature.name}</span>
                        </div>
                        <span className="text-brand-text-mute text-xs whitespace-nowrap">{feature.sessions} sessions</span>
                      </div>
                      <div className="w-full h-1.5 bg-brand-bg-alt rounded-full overflow-hidden">
                        <div
                          className="h-full bg-brand-teal-500 rounded-full"
                          style={{ width: `${feature.barPercent}%` }}
                        ></div>
                      </div>
                      <p className="text-[10px] text-brand-text-mute text-right">{feature.usersPercent}% of users</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Geographic Distribution */}
              <div className="bg-white border border-brand-line rounded-2xl shadow-sm p-4 sm:p-6">
                <h2 className="font-manrope text-base font-bold text-brand-text mb-6">Geographic Distribution</h2>
                <div className="space-y-4">
                  {geoDistribution.map((geo, idx) => (
                    <div key={idx} className="flex items-center justify-between gap-3 p-3 rounded-xl hover:bg-brand-teal-50/50 transition-colors border border-transparent hover:border-brand-line">
                      <div className="min-w-0">
                        <h4 className="font-semibold text-sm text-brand-text truncate">{geo.region}</h4>
                        <p className="text-[11px] text-brand-text-mute mt-0.5">
                          {geo.institutes} institutes • {geo.students} students
                        </p>
                      </div>
                      <div className="text-right shrink-0">
                        <span className="text-lg font-black text-brand-text">{geo.percent}%</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

            </div>

            {/* System Health */}
            <div className="bg-white border border-brand-line rounded-2xl shadow-sm p-4 sm:p-6">
              <h2 className="font-manrope text-base font-bold text-brand-text mb-6">System Health</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {systemHealth.map((metric, idx) => (
                  <div key={idx}>
                    <p className="font-jetbrains text-[10px] font-bold text-brand-text-mute uppercase tracking-[0.15em] mb-1">{metric.label}</p>
                    <h3 className={`text-2xl font-black ${
                      metric.status === 'good'
                        ? 'text-emerald-600'
                        : 'text-amber-500'
                    }`}>
                      {metric.value}
                    </h3>
                  </div>
                ))}
              </div>
            </div>

        </main>
      </div>
    </div>
  );
}
