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
  'bg-brand-teal-50 text-brand-teal-700',
  'bg-brand-blue-50 text-brand-blue-700',
  'bg-sky-50 text-sky-700',
  'bg-emerald-50 text-emerald-700',
  'bg-rose-50 text-rose-700',
  'bg-amber-50 text-amber-700'
];

const getInitials = (name: string) => name.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase();
const activities = [
  {
    text: <><span className="font-semibold text-brand-text">New institute signed up</span> — LearnFirst Academy (Trial)</>,
    time: '3 hours ago',
    dotColor: 'bg-emerald-500'
  },
  {
    text: <><span className="font-semibold text-brand-text">Subscription upgraded</span> — SpeakWell — Institute Pro</>,
    time: 'Yesterday',
    dotColor: 'bg-brand-teal-500'
  },
  {
    text: <><span className="font-semibold text-brand-text">Support ticket resolved</span> — Prestige University — API rate limit</>,
    time: 'Yesterday',
    dotColor: 'bg-brand-teal-500'
  },
  {
    text: <><span className="font-semibold text-brand-text">Invoice paid</span> — ₹4,50,000 — Prestige University</>,
    time: '2 days ago',
    dotColor: 'bg-emerald-500'
  },
  {
    text: <><span className="font-semibold text-brand-text">Churn risk detected</span> — TechBridge Institute — usage down 40%</>,
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
    priorityColor: 'text-rose-600 bg-rose-50 border-rose-200',
    statusColor: 'text-sky-600 bg-sky-50 border-sky-200'
  },
  {
    title: 'White-label domain SSL not resolving',
    institute: 'Ace English Academy',
    time: '1d ago',
    priority: 'MEDIUM',
    status: 'in-progress',
    priorityColor: 'text-amber-600 bg-amber-50 border-amber-200',
    statusColor: 'text-brand-blue-600 bg-brand-blue-50 border-brand-blue-200'
  },
  {
    title: 'Trial extension request — 7 more days',
    institute: 'LearnFirst Academy',
    time: '2h ago',
    priority: 'LOW',
    status: 'open',
    priorityColor: 'text-brand-text-mute bg-brand-bg-alt border-brand-line',
    statusColor: 'text-sky-600 bg-sky-50 border-sky-200'
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
    <div className="relative min-h-screen font-plex antialiased overflow-x-hidden bg-brand-bg text-brand-text">

      {/* Sidebar */}
      <SuperAdminSidebar
        activeTab="superadmin-dashboard" // Adjust to match your active tab logic
        isCollapsed={isSidebarCollapsed}
        toggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
      />

      <div className={`relative z-10 transition-all duration-300 ${isSidebarCollapsed ? 'lg:pl-24' : 'lg:pl-72'}`}>

        {/* Topbar */}
        <SuperAdminTopbar />

        <main className="px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-8 max-w-[90rem] mx-auto pb-16">

            {/* Header Banner */}
            <div className="w-full relative overflow-hidden rounded-3xl bg-brand-ink-deep text-white border border-brand-line-16 p-6 sm:p-8 shadow-sm">
              <div className="relative z-10 flex flex-col gap-2">
                <p className="font-jetbrains text-[10px] font-bold tracking-[0.2em] uppercase text-brand-on-ink-mute">
                  Platform Control
                </p>
                <h1 className="font-manrope text-2xl sm:text-3xl font-black text-white tracking-tight">
                  Super Admin Console
                </h1>
                <p className="text-brand-on-ink text-sm sm:text-base">
                  <strong className="text-white font-semibold">{loading ? '...' : institutes.length} institutes</strong> onboarded. <strong className="text-white font-semibold">{loading ? '...' : totalStudents.toLocaleString()} total students</strong>. <strong className="text-white font-semibold">₹12.0L MRR</strong>. 2 open support tickets.
                </p>
              </div>
            </div>

            {/* Top Metrics Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white border border-brand-line rounded-2xl p-4 sm:p-6 shadow-sm flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-jetbrains text-[10px] font-bold text-brand-text-mute uppercase tracking-[0.15em] mb-1">Institutes</p>
                  <h3 className="text-2xl font-black text-brand-text">{loading ? '...' : institutes.length}</h3>
                  <p className="text-[10px] text-brand-text-mute mt-1">1 on trial</p>
                </div>
                <div className="w-10 h-10 rounded-full bg-brand-teal-50 flex items-center justify-center shrink-0">
                  <Building2 className="w-5 h-5 text-brand-teal-600" />
                </div>
              </div>

              <div className="bg-white border border-brand-line rounded-2xl p-4 sm:p-6 shadow-sm flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-jetbrains text-[10px] font-bold text-brand-text-mute uppercase tracking-[0.15em] mb-1">Total Students</p>
                  <h3 className="text-2xl font-black text-brand-text">{loading ? '...' : totalStudents.toLocaleString()}</h3>
                  <p className="text-[10px] text-brand-text-mute mt-1">{totalTutors.toLocaleString()} tutors</p>
                </div>
                <div className="w-10 h-10 rounded-full bg-brand-blue-50 flex items-center justify-center shrink-0">
                  <Users className="w-5 h-5 text-brand-blue-600" />
                </div>
              </div>

              <div className="bg-white border border-brand-line rounded-2xl p-4 sm:p-6 shadow-sm flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-jetbrains text-[10px] font-bold text-brand-text-mute uppercase tracking-[0.15em] mb-1">MRR</p>
                  <h3 className="text-2xl font-black text-brand-text">₹1203K</h3>
                  <p className="text-[10px] text-emerald-600 mt-1">+12% this month</p>
                </div>
                <div className="w-10 h-10 rounded-full bg-emerald-50 flex items-center justify-center shrink-0">
                  <CreditCard className="w-5 h-5 text-emerald-600" />
                </div>
              </div>

              <div className="bg-white border border-brand-line rounded-2xl p-4 sm:p-6 shadow-sm flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-jetbrains text-[10px] font-bold text-brand-text-mute uppercase tracking-[0.15em] mb-1">Open Tickets</p>
                  <h3 className="text-2xl font-black text-brand-text">2</h3>
                  <p className="text-[10px] text-brand-text-mute mt-1">5 total</p>
                </div>
                <div className="w-10 h-10 rounded-full bg-sky-50 flex items-center justify-center shrink-0">
                  <Headphones className="w-5 h-5 text-sky-600" />
                </div>
              </div>
            </div>

            {/* Main Content Split */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

              {/* Left Column - Institutes */}
              <div className="lg:col-span-2 space-y-4">
                <div className="flex items-center gap-2 mb-2">
                  <Building2 className="w-5 h-5 text-brand-teal-600 shrink-0" />
                  <div>
                    <h2 className="font-manrope text-lg font-bold text-brand-text leading-tight">Institutes</h2>
                    <p className="text-xs text-brand-text-mute">All onboarded organizations</p>
                  </div>
                </div>

                <div className="bg-white border border-brand-line rounded-2xl shadow-sm overflow-hidden divide-y divide-brand-line">
                  {loading ? (
                    <div className="flex justify-center p-8">
                      <Loader2 className="w-6 h-6 animate-spin text-brand-teal-500" />
                    </div>
                  ) : institutes.length === 0 ? (
                    <div className="p-8 text-center text-brand-text-mute text-sm">No institutes found</div>
                  ) : institutes.map((inst, idx) => (
                    <div key={inst.id} className="p-4 flex items-center justify-between gap-3 hover:bg-brand-teal-50/50 transition-colors cursor-pointer group">
                      <div className="flex items-center gap-3 sm:gap-4 min-w-0">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-sm font-black shrink-0 ${COLORS[idx % COLORS.length]}`}>
                          {getInitials(inst.name)}
                        </div>
                        <div className="min-w-0">
                          <h4 className="font-semibold text-sm text-brand-text truncate">{inst.name}</h4>
                          <p className="text-[11px] text-brand-text-mute mt-0.5">{inst.studentCount} students • {inst.instructorCount} tutors</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 sm:gap-4 shrink-0">
                        <span className={`font-jetbrains text-[10px] font-bold uppercase tracking-[0.12em] ${
                          inst.isActive ? 'text-emerald-600' : 'text-brand-text-mute'
                        }`}>
                          {inst.isActive ? 'Active' : 'Inactive'}
                        </span>
                        <ChevronRight className="w-4 h-4 text-brand-text-mute group-hover:text-brand-teal-500 transition-colors" />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Right Column - Platform Activity */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 mb-2">
                  <Activity className="w-5 h-5 text-emerald-600 shrink-0" />
                  <h2 className="font-manrope text-lg font-bold text-brand-text">Platform Activity</h2>
                </div>

                <div className="bg-white border border-brand-line rounded-2xl shadow-sm p-4 sm:p-6">
                  <div className="relative border-l border-brand-line ml-2 space-y-6 pb-2">
                    {activities.map((act, idx) => (
                      <div key={idx} className="relative pl-5">
                        <div className={`absolute -left-[5px] top-1.5 w-2.5 h-2.5 rounded-full ring-4 ring-white ${act.dotColor}`}></div>
                        <p className="text-[13px] text-brand-text leading-snug">
                          {act.text}
                        </p>
                        <p className="text-[11px] text-brand-text-mute mt-1">{act.time}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

            </div>

            {/* Support Tickets Section */}
            <div className="space-y-4 pt-2">
              <div className="flex flex-wrap items-center gap-2">
                <Ticket className="w-5 h-5 text-amber-500 shrink-0" />
                <h2 className="font-manrope text-lg font-bold text-brand-text">Support Tickets</h2>
                <span className="font-jetbrains text-[10px] font-bold uppercase tracking-[0.12em] text-amber-600 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-md">2 open</span>
              </div>

              <div className="grid grid-cols-1 gap-3">
                {tickets.map((ticket, idx) => (
                  <div key={idx} className="bg-white border border-brand-line p-4 sm:p-6 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-brand-teal-50/50 transition-colors cursor-pointer shadow-sm">
                    <div className="min-w-0">
                      <h4 className="font-semibold text-sm text-brand-text">{ticket.title}</h4>
                      <p className="text-xs text-brand-text-mute mt-1">{ticket.institute} • {ticket.time}</p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className={`font-jetbrains text-[10px] font-bold tracking-[0.12em] px-2 py-0.5 rounded border uppercase ${ticket.priorityColor}`}>
                        {ticket.priority}
                      </span>
                      <span className={`font-jetbrains text-[10px] font-bold tracking-[0.12em] px-2 py-0.5 rounded border uppercase ${ticket.statusColor}`}>
                        {ticket.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Bottom Overall Metrics */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 pt-6 mt-4 border-t border-brand-line">
              <div>
                <p className="font-jetbrains text-[10px] font-bold text-brand-text-mute uppercase tracking-[0.15em] mb-1">Total Revenue (MTD)</p>
                <h3 className="text-3xl font-black text-brand-text">₹1203K</h3>
                <p className="text-xs text-emerald-600 font-medium mt-1">+12% vs last month</p>
              </div>
              <div>
                <p className="font-jetbrains text-[10px] font-bold text-brand-text-mute uppercase tracking-[0.15em] mb-1">Avg Revenue per Institute</p>
                <h3 className="text-3xl font-black text-brand-text">₹241K</h3>
                <p className="text-xs text-brand-text-mute mt-1">{loading ? '...' : institutes.filter(i => i.isActive).length} active institutes</p>
              </div>
              <div>
                <p className="font-jetbrains text-[10px] font-bold text-brand-text-mute uppercase tracking-[0.15em] mb-1">Platform Health Score</p>
                <h3 className="text-3xl font-black text-emerald-600">83%</h3>
                <p className="text-xs text-brand-text-mute mt-1">Avg across all institutes</p>
              </div>
            </div>

        </main>
      </div>
    </div>
  );
}
