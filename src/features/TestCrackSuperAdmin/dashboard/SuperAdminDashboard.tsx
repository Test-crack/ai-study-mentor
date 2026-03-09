import React, { useState, useEffect } from 'react';
import { 
  Building2, 
  Users, 
  CreditCard, 
  Headphones, 
  ChevronRight,
  Activity,
  Ticket,
  Loader2
} from 'lucide-react';
import { SuperAdminSidebar } from '../Components/SuperadminSidebar';
import { SuperAdminTopbar } from '../Components/Superadmintopbar';
import { fetchInstitutes, InstituteRecord } from '../services/superadminService';

// --- Static Data ---
const COLORS = [
  'bg-indigo-50 text-indigo-700 dark:bg-indigo-900/50 dark:text-indigo-400',
  'bg-purple-50 text-purple-700 dark:bg-purple-900/50 dark:text-purple-400',
  'bg-blue-50 text-blue-700 dark:bg-blue-900/50 dark:text-blue-400',
  'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-400',
  'bg-rose-50 text-rose-700 dark:bg-rose-900/50 dark:text-rose-400',
  'bg-amber-50 text-amber-700 dark:bg-amber-900/50 dark:text-amber-400'
];

const getInitials = (name: string) => name.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase();
const activities = [
  {
    text: <><span className="font-semibold text-slate-900 dark:text-white">New institute signed up</span> — LearnFirst Academy (Trial)</>,
    time: '3 hours ago',
    dotColor: 'bg-emerald-500'
  },
  {
    text: <><span className="font-semibold text-slate-900 dark:text-white">Subscription upgraded</span> — SpeakWell — Institute Pro</>,
    time: 'Yesterday',
    dotColor: 'bg-indigo-500'
  },
  {
    text: <><span className="font-semibold text-slate-900 dark:text-white">Support ticket resolved</span> — Prestige University — API rate limit</>,
    time: 'Yesterday',
    dotColor: 'bg-indigo-500'
  },
  {
    text: <><span className="font-semibold text-slate-900 dark:text-white">Invoice paid</span> — ₹4,50,000 — Prestige University</>,
    time: '2 days ago',
    dotColor: 'bg-emerald-500'
  },
  {
    text: <><span className="font-semibold text-slate-900 dark:text-white">Churn risk detected</span> — TechBridge Institute — usage down 40%</>,
    time: '2 days ago',
    dotColor: 'bg-rose-500'
  }
];

const tickets = [
  {
    title: 'Bulk import failing for CSV > 500 rows',
    institute: 'TechBridge Institute',
    time: '2h ago',
    priority: 'HIGH',
    status: 'open',
    priorityColor: 'text-rose-600 bg-rose-50 border-rose-200 dark:text-rose-500 dark:bg-rose-500/10 dark:border-rose-500/20',
    statusColor: 'text-blue-600 bg-blue-50 border-blue-200 dark:text-blue-400 dark:bg-blue-500/10 dark:border-blue-500/20'
  },
  {
    title: 'White-label domain SSL not resolving',
    institute: 'Ace English Academy',
    time: '1d ago',
    priority: 'MEDIUM',
    status: 'in-progress',
    priorityColor: 'text-amber-600 bg-amber-50 border-amber-200 dark:text-amber-500 dark:bg-amber-500/10 dark:border-amber-500/20',
    statusColor: 'text-purple-600 bg-purple-50 border-purple-200 dark:text-purple-400 dark:bg-purple-500/10 dark:border-purple-500/20'
  },
  {
    title: 'Trial extension request — 7 more days',
    institute: 'LearnFirst Academy',
    time: '2h ago',
    priority: 'LOW',
    status: 'open',
    priorityColor: 'text-slate-600 bg-slate-100 border-slate-200 dark:text-slate-400 dark:bg-slate-500/10 dark:border-slate-500/20',
    statusColor: 'text-blue-600 bg-blue-50 border-blue-200 dark:text-blue-400 dark:bg-blue-500/10 dark:border-blue-500/20'
  }
];

export default function SuperAdminDashboard() {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [institutes, setInstitutes] = useState<InstituteRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchInstitutes().then(res => {
      setInstitutes(res.data || []);
      setLoading(false);
    }).catch(err => {
      console.error(err);
      setLoading(false);
    });
  }, []);

  const totalStudents = institutes.reduce((acc, inst) => acc + inst.studentCount, 0);
  const totalTutors = institutes.reduce((acc, inst) => acc + inst.instructorCount, 0);

  return (
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-[#0B0A10] font-sans text-slate-900 dark:text-slate-200 transition-colors duration-300">
      
      {/* Sidebar */}
      <div className="hidden lg:block">
        <SuperAdminSidebar 
          activeTab="superadmin-dashboard" // Adjust to match your active tab logic
          isCollapsed={isSidebarCollapsed} 
          toggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)} 
        />
      </div>

      <div className={`transition-all duration-300 flex flex-col min-h-screen ${isSidebarCollapsed ? 'lg:pl-20' : 'lg:pl-64'}`}>
        
        {/* Topbar */}
        <SuperAdminTopbar />

        <main className="flex-1 p-4 sm:p-6 lg:p-8">
          <div className="max-w-[1400px] mx-auto space-y-6">
            
            {/* Header Banner */}
            <div className="w-full relative overflow-hidden rounded-2xl bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-800 p-6 sm:p-8 shadow-sm">
              <div className="relative z-10 flex flex-col gap-2">
                <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
                  Super Admin Console
                </h1>
                <p className="text-blue-100 text-sm sm:text-base">
                  <strong className="text-white font-medium">{loading ? '...' : institutes.length} institutes</strong> onboarded. <strong className="text-white font-medium">{loading ? '...' : totalStudents.toLocaleString()} total students</strong>. <strong className="text-white font-medium">₹12.0L MRR</strong>. 2 open support tickets.
                </p>
              </div>
            </div>

            {/* Top Metrics Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white dark:bg-[#15141B] border border-slate-200 dark:border-[#26252D] rounded-xl p-5 shadow-sm flex items-center justify-between transition-colors">
                <div>
                  <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Institutes</p>
                  <h3 className="text-2xl font-bold text-slate-900 dark:text-white">{loading ? '...' : institutes.length}</h3>
                  <p className="text-[10px] text-slate-500 mt-1">1 on trial</p>
                </div>
                <div className="w-10 h-10 rounded-full bg-indigo-50 dark:bg-indigo-500/10 flex items-center justify-center shrink-0">
                  <Building2 className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                </div>
              </div>
              
              <div className="bg-white dark:bg-[#15141B] border border-slate-200 dark:border-[#26252D] rounded-xl p-5 shadow-sm flex items-center justify-between transition-colors">
                <div>
                  <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Total Students</p>
                  <h3 className="text-2xl font-bold text-slate-900 dark:text-white">{loading ? '...' : totalStudents.toLocaleString()}</h3>
                  <p className="text-[10px] text-slate-500 mt-1">{totalTutors.toLocaleString()} tutors</p>
                </div>
                <div className="w-10 h-10 rounded-full bg-purple-50 dark:bg-purple-500/10 flex items-center justify-center shrink-0">
                  <Users className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                </div>
              </div>

              <div className="bg-white dark:bg-[#15141B] border border-slate-200 dark:border-[#26252D] rounded-xl p-5 shadow-sm flex items-center justify-between transition-colors">
                <div>
                  <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">MRR</p>
                  <h3 className="text-2xl font-bold text-slate-900 dark:text-white">₹1203K</h3>
                  <p className="text-[10px] text-emerald-600 dark:text-emerald-400 mt-1">+12% this month</p>
                </div>
                <div className="w-10 h-10 rounded-full bg-emerald-50 dark:bg-emerald-500/10 flex items-center justify-center shrink-0">
                  <CreditCard className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                </div>
              </div>

              <div className="bg-white dark:bg-[#15141B] border border-slate-200 dark:border-[#26252D] rounded-xl p-5 shadow-sm flex items-center justify-between transition-colors">
                <div>
                  <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Open Tickets</p>
                  <h3 className="text-2xl font-bold text-slate-900 dark:text-white">2</h3>
                  <p className="text-[10px] text-slate-500 mt-1">5 total</p>
                </div>
                <div className="w-10 h-10 rounded-full bg-blue-50 dark:bg-blue-500/10 flex items-center justify-center shrink-0">
                  <Headphones className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                </div>
              </div>
            </div>

            {/* Main Content Split */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              
              {/* Left Column - Institutes */}
              <div className="lg:col-span-2 space-y-4">
                <div className="flex items-center gap-2 mb-2">
                  <Building2 className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                  <div>
                    <h2 className="text-lg font-bold text-slate-900 dark:text-white leading-tight">Institutes</h2>
                    <p className="text-xs text-slate-500 dark:text-slate-400">All onboarded organizations</p>
                  </div>
                </div>

                <div className="bg-white dark:bg-[#15141B] border border-slate-200 dark:border-[#26252D] rounded-xl shadow-sm overflow-hidden divide-y divide-slate-100 dark:divide-[#26252D] transition-colors">
                  {loading ? (
                    <div className="flex justify-center p-8">
                      <Loader2 className="w-6 h-6 animate-spin text-indigo-500" />
                    </div>
                  ) : institutes.length === 0 ? (
                    <div className="p-8 text-center text-slate-500 text-sm">No institutes found</div>
                  ) : institutes.map((inst, idx) => (
                    <div key={inst.id} className="p-4 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-white/[0.02] transition-colors cursor-pointer group">
                      <div className="flex items-center gap-4">
                        <div className={`w-10 h-10 rounded flex items-center justify-center text-sm font-bold shrink-0 ${COLORS[idx % COLORS.length]}`}>
                          {getInitials(inst.name)}
                        </div>
                        <div>
                          <h4 className="font-semibold text-sm text-slate-900 dark:text-white">{inst.name}</h4>
                          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">{inst.studentCount} students • {inst.instructorCount} tutors</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <span className={`text-[11px] font-bold tracking-wider ${
                          inst.isActive ? 'text-emerald-600 dark:text-emerald-500' : 'text-slate-500'
                        }`}>
                          {inst.isActive ? 'Active' : 'Inactive'}
                        </span>
                        <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-slate-600 dark:text-slate-600 dark:group-hover:text-slate-300 transition-colors" />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Right Column - Platform Activity */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 mb-2">
                  <Activity className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                  <h2 className="text-lg font-bold text-slate-900 dark:text-white">Platform Activity</h2>
                </div>

                <div className="bg-white dark:bg-[#15141B] border border-slate-200 dark:border-[#26252D] rounded-xl shadow-sm p-6 transition-colors">
                  <div className="relative border-l border-slate-200 dark:border-[#222] ml-2 space-y-6 pb-2">
                    {activities.map((act, idx) => (
                      <div key={idx} className="relative pl-5">
                        <div className={`absolute -left-[5px] top-1.5 w-2.5 h-2.5 rounded-full ring-4 ring-white dark:ring-[#15141B] ${act.dotColor}`}></div>
                        <p className="text-[13px] text-slate-700 dark:text-slate-300 leading-snug">
                          {act.text}
                        </p>
                        <p className="text-[11px] text-slate-500 dark:text-slate-500 mt-1">{act.time}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

            </div>

            {/* Support Tickets Section */}
            <div className="space-y-4 pt-2">
              <div className="flex items-center gap-2">
                <Ticket className="w-5 h-5 text-amber-500 dark:text-amber-400" />
                <h2 className="text-lg font-bold text-slate-900 dark:text-white">Support Tickets</h2>
                <span className="text-xs font-semibold text-amber-600 dark:text-amber-500 bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-transparent px-2 py-0.5 rounded-md">2 open</span>
              </div>

              <div className="grid grid-cols-1 gap-3">
                {tickets.map((ticket, idx) => (
                  <div key={idx} className="bg-white dark:bg-[#15141B] border border-slate-200 dark:border-[#26252D] p-4 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-slate-50 dark:hover:bg-white/[0.02] transition-colors cursor-pointer">
                    <div>
                      <h4 className="font-semibold text-sm text-slate-900 dark:text-white">{ticket.title}</h4>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{ticket.institute} • {ticket.time}</p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className={`text-[10px] font-bold tracking-wider px-2 py-0.5 rounded border uppercase ${ticket.priorityColor}`}>
                        {ticket.priority}
                      </span>
                      <span className={`text-[10px] font-bold tracking-wider px-2 py-0.5 rounded border uppercase ${ticket.statusColor}`}>
                        {ticket.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Bottom Overall Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-6 mt-4 border-t border-slate-200 dark:border-[#26252D]">
              <div>
                <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Total Revenue (MTD)</p>
                <h3 className="text-3xl font-bold text-slate-900 dark:text-white">₹1203K</h3>
                <p className="text-xs text-emerald-600 dark:text-emerald-400 font-medium mt-1">+12% vs last month</p>
              </div>
              <div>
                <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Avg Revenue per Institute</p>
                <h3 className="text-3xl font-bold text-slate-900 dark:text-white">₹241K</h3>
                <p className="text-xs text-slate-500 mt-1">{loading ? '...' : institutes.filter(i => i.isActive).length} active institutes</p>
              </div>
              <div>
                <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Platform Health Score</p>
                <h3 className="text-3xl font-bold text-emerald-600 dark:text-emerald-400">83%</h3>
                <p className="text-xs text-slate-500 mt-1">Avg across all institutes</p>
              </div>
            </div>

          </div>
        </main>
      </div>
    </div>
  );
}