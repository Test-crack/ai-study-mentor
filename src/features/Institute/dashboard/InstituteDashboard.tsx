// src/features/Institute/dashboard/InstituteDashboard.tsx
import React, { useState } from 'react';
import { 
  Users, 
  Layers, 
  AlertTriangle, 
  UserPlus, 
  Clock, 
  ChevronRight,
  UserCheck,
  FolderOpen,
  Activity,
  CheckCircle2,
  XCircle
} from 'lucide-react';
import { InstituteSidebar } from '../components/InstituteSidebar';
import { InstituteTopbar } from '../components/InstituteTopbar';
import { Navigate, useNavigate } from 'react-router-dom';

export default function InstituteDashboard() {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const navigate = useNavigate();
  return (
    <div className="min-h-screen bg-[#f8fafc] dark:bg-[#0A0A0F] font-sans text-slate-900 dark:text-slate-200 transition-colors duration-500">

      {/* Ambient glow layer — dark mode only */}
      <div className="pointer-events-none fixed inset-0 hidden dark:block">
        <div className="absolute top-0 left-0 w-[500px] h-[500px] bg-blue-700/10 blur-[140px] rounded-full"></div>
        <div className="absolute bottom-0 left-0 w-[450px] h-[450px] bg-indigo-600/[0.08] blur-[130px] rounded-full"></div>
      </div>

      {/* Sidebar - hidden on mobile, handled by Topbar Sheet */}
      <div className="hidden lg:block">
        <InstituteSidebar 
          activeTab="dashboard" 
          isCollapsed={isSidebarCollapsed} 
          toggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)} 
        />
      </div>

      <div className={`relative transition-all duration-300 flex flex-col min-h-screen ${isSidebarCollapsed ? 'lg:pl-20' : 'lg:pl-64'}`}>
        
        {/* Topbar incorporates Theme Toggle and Mobile Menu */}
        <InstituteTopbar />

        <main className="flex-1 p-4 sm:p-6 lg:p-8">
          <div className="max-w-[1600px] mx-auto space-y-6">
            
            {/* Header Banner — flat spec version */}
            <div className="w-full relative overflow-hidden rounded-2xl bg-indigo-50 dark:bg-blue-950 border border-indigo-100 dark:border-blue-800/60 p-6 sm:p-8 shadow-[0_2px_12px_-4px_rgba(15,23,42,0.08)] dark:shadow-none transition-colors duration-500">
              {/* Ambient glow orbs */}
              <div className="pointer-events-none absolute -top-10 -right-10 w-48 h-48 rounded-full bg-indigo-200/40 dark:bg-blue-500/20 blur-2xl"></div>
              <div className="pointer-events-none absolute -bottom-12 left-1/4 w-40 h-40 rounded-full bg-indigo-200/40 dark:bg-blue-500/20 blur-2xl"></div>
              <div className="relative z-10 flex flex-col gap-4">
                <div>
                  <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white mb-1">
                    Institute Admin Portal
                  </h1>
                  <p className="text-slate-600 dark:text-blue-200/70 text-sm">
                    105 students across <strong className="text-slate-900 dark:text-white font-medium">4 batches</strong>. 3 onboarding requests pending. 3 active tutors.
                  </p>
                </div>
                
                <div className="flex flex-wrap items-center gap-3 mt-2">
                  <button onClick={() => navigate('/institute-admin/studentonboarding')} className="flex items-center justify-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-semibold transition-all duration-200 shadow-md w-full sm:w-auto">
                    <UserPlus className="w-4 h-4" />
                    Onboard Students
                  </button>
                  <button onClick={() => navigate('/institute-admin/tutoronboarding')} className="flex items-center justify-center gap-2 px-4 py-2 bg-white/80 dark:bg-slate-800/80 border border-indigo-200 dark:border-blue-700/40 hover:bg-white text-indigo-700 dark:text-blue-200 rounded-lg text-sm font-semibold transition-all duration-200 w-full sm:w-auto">
                    <UserCheck className="w-4 h-4" />
                    Onboard Tutors
                  </button>
                </div>
              </div>
            </div>

            {/* Top Metrics Grid — per-card semantic theming */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Metric 1 — indigo (primary/neutral-positive) */}
              <div className="bg-indigo-50/80 dark:bg-indigo-950/40 rounded-2xl border border-indigo-100 dark:border-indigo-500/20 dark:shadow-[0_0_28px_rgba(99,102,241,0.18)] p-5 flex items-center gap-4 transition-all duration-200 hover:-translate-y-0.5">
                <div className="w-12 h-12 rounded-full bg-indigo-100 dark:bg-indigo-500/10 flex items-center justify-center shrink-0">
                  <Users className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-0.5">Total Students</p>
                  <h3 className="text-2xl font-bold text-slate-900 dark:text-white">105</h3>
                </div>
              </div>
              
              {/* Metric 2 — violet (secondary) */}
              <div className="bg-violet-50/80 dark:bg-violet-950/40 rounded-2xl border border-violet-100 dark:border-violet-500/20 dark:shadow-[0_0_28px_rgba(139,92,246,0.16)] p-5 flex items-center gap-4 transition-all duration-200 hover:-translate-y-0.5">
                <div className="w-12 h-12 rounded-full bg-violet-100 dark:bg-violet-500/10 flex items-center justify-center shrink-0">
                  <UserCheck className="w-6 h-6 text-violet-600 dark:text-violet-400" />
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-0.5">Active Tutors</p>
                  <h3 className="text-2xl font-bold text-slate-900 dark:text-white">3</h3>
                </div>
              </div>

              {/* Metric 3 — emerald (success/on-track) */}
              <div className="bg-emerald-50/80 dark:bg-emerald-950/40 rounded-2xl border border-emerald-100 dark:border-emerald-500/20 dark:shadow-[0_0_28px_rgba(16,185,129,0.15)] p-5 flex items-center gap-4 transition-all duration-200 hover:-translate-y-0.5">
                <div className="w-12 h-12 rounded-full bg-emerald-100 dark:bg-emerald-500/10 flex items-center justify-center shrink-0">
                  <Layers className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-0.5">Active Batches</p>
                  <h3 className="text-2xl font-bold text-slate-900 dark:text-white">3</h3>
                </div>
              </div>

              {/* Metric 4 — amber (warning) */}
              <div className="bg-amber-50/80 dark:bg-amber-950/40 rounded-2xl border border-amber-100 dark:border-amber-500/20 dark:shadow-[0_0_28px_rgba(245,158,11,0.15)] p-5 flex items-center gap-4 transition-all duration-200 hover:-translate-y-0.5">
                <div className="w-12 h-12 rounded-full bg-amber-100 dark:bg-amber-500/10 flex items-center justify-center shrink-0">
                  <AlertTriangle className="w-6 h-6 text-amber-600 dark:text-amber-400" />
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-0.5">Pending Onboarding</p>
                  <h3 className="text-2xl font-bold text-slate-900 dark:text-white">3</h3>
                </div>
              </div>
            </div>

            {/* Main Content Layout (7 / 5 split on large screens) */}
            <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
              
              {/* Left Column (Spans 7 columns) */}
              <div className="xl:col-span-7 space-y-6">
                
                {/* Pending Onboarding */}
                <div className="bg-white dark:bg-[#0E0E16] rounded-2xl border border-slate-200/70 dark:border-white/[0.06] shadow-[0_2px_12px_-4px_rgba(15,23,42,0.08)] dark:shadow-none overflow-hidden transition-colors duration-500">
                  <div className="p-5 border-b border-slate-100 dark:border-white/[0.06] flex items-center gap-2">
                    <Clock className="w-5 h-5 text-amber-500" />
                    <h2 className="text-base font-bold text-slate-900 dark:text-white">Pending Onboarding</h2>
                    <span className="ml-2 bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-500/20 py-0.5 px-2.5 rounded-full text-xs font-semibold">3</span>
                  </div>
                  <div className="divide-y divide-slate-100 dark:divide-white/[0.06]">
                    {/* Item 1 */}
                    <div className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-indigo-50/50 dark:hover:bg-indigo-500/[0.06] transition-colors">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded bg-indigo-100 dark:bg-indigo-500/15 flex items-center justify-center text-indigo-700 dark:text-indigo-300 font-bold text-sm shrink-0">AV</div>
                        <div>
                          <h4 className="font-semibold text-sm text-slate-900 dark:text-slate-100">Ananya Verma</h4>
                          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">ananya@gmail.com • student • 2 hours ago</p>
                        </div>
                      </div>
                      <div className="flex gap-2 self-start sm:self-center shrink-0">
                        <button className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded shadow-md transition-all duration-200">Approve</button>
                        <button className="px-4 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-white/[0.04] dark:hover:bg-white/[0.08] text-slate-700 dark:text-slate-300 text-xs font-semibold rounded transition-colors">Reject</button>
                      </div>
                    </div>
                    {/* Item 2 */}
                    <div className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-indigo-50/50 dark:hover:bg-indigo-500/[0.06] transition-colors">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded bg-violet-100 dark:bg-violet-500/15 flex items-center justify-center text-violet-700 dark:text-violet-300 font-bold text-sm shrink-0">KI</div>
                        <div>
                          <h4 className="font-semibold text-sm text-slate-900 dark:text-slate-100">Karthik Iyer</h4>
                          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">karthik.i@gmail.com • student • 5 hours ago</p>
                        </div>
                      </div>
                      <div className="flex gap-2 self-start sm:self-center shrink-0">
                        <button className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded shadow-md transition-all duration-200">Approve</button>
                        <button className="px-4 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-white/[0.04] dark:hover:bg-white/[0.08] text-slate-700 dark:text-slate-300 text-xs font-semibold rounded transition-colors">Reject</button>
                      </div>
                    </div>
                    {/* Item 3 */}
                    <div className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-indigo-50/50 dark:hover:bg-indigo-500/[0.06] transition-colors">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded bg-blue-100 dark:bg-blue-500/15 flex items-center justify-center text-blue-700 dark:text-blue-300 font-bold text-sm shrink-0">DMJ</div>
                        <div>
                          <h4 className="font-semibold text-sm text-slate-900 dark:text-slate-100">Dr. Meera Joshi</h4>
                          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">meera.j@site.edu • tutor • 1 day ago</p>
                        </div>
                      </div>
                      <div className="flex gap-2 self-start sm:self-center shrink-0">
                        <button className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded shadow-md transition-all duration-200">Approve</button>
                        <button className="px-4 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-white/[0.04] dark:hover:bg-white/[0.08] text-slate-700 dark:text-slate-300 text-xs font-semibold rounded transition-colors">Reject</button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Batch Allocation */}
                <div className="bg-white dark:bg-[#0E0E16] rounded-2xl border border-slate-200/70 dark:border-white/[0.06] shadow-[0_2px_12px_-4px_rgba(15,23,42,0.08)] dark:shadow-none overflow-hidden transition-colors duration-500">
                  <div className="p-5 border-b border-slate-100 dark:border-white/[0.06] flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <FolderOpen className="w-5 h-5 text-blue-500" />
                      <div>
                        <h2 className="text-base font-bold text-slate-900 dark:text-white">Batch Allocation</h2>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">Manage batch assignments and capacity</p>
                      </div>
                    </div>
                    <button onClick={() => navigate('/institute-admin/batches')} className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1">
                      View All <ChevronRight className="w-3 h-3" />
                    </button>
                  </div>
                  <div className="divide-y divide-slate-100 dark:divide-white/[0.06]">
                    {/* Batch 1 */}
                    <div className="p-4 flex items-center justify-between hover:bg-indigo-50/50 dark:hover:bg-indigo-500/[0.06] transition-colors group">
                      <div>
                        <h4 className="font-bold text-sm text-slate-900 dark:text-slate-100">IELTS Batch 12</h4>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">Tutor: Sarah Khan • IELTS • 28/30</p>
                      </div>
                      <div className="flex flex-col items-end gap-1.5 min-w-[100px]">
                        <div className="flex items-center gap-2 w-full justify-between">
                          <span className="text-sm font-bold text-slate-700 dark:text-slate-200">93%</span>
                          <span className="text-[9px] font-bold tracking-wider px-1.5 py-0.5 rounded bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-500/20">ACTIVE</span>
                        </div>
                        <div className="w-full h-1.5 bg-slate-100 dark:bg-white/[0.06] rounded-full overflow-hidden">
                          <div className="h-full bg-emerald-500 w-[93%] rounded-full"></div>
                        </div>
                      </div>
                    </div>
                    {/* Batch 2 */}
                    <div className="p-4 flex items-center justify-between hover:bg-indigo-50/50 dark:hover:bg-indigo-500/[0.06] transition-colors group">
                      <div>
                        <h4 className="font-bold text-sm text-slate-900 dark:text-slate-100">Spoken English A</h4>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">Tutor: Ravi Kumar • Spoken English • 35/40</p>
                      </div>
                      <div className="flex flex-col items-end gap-1.5 min-w-[100px]">
                        <div className="flex items-center gap-2 w-full justify-between">
                          <span className="text-sm font-bold text-slate-700 dark:text-slate-200">88%</span>
                          <span className="text-[9px] font-bold tracking-wider px-1.5 py-0.5 rounded bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-500/20">ACTIVE</span>
                        </div>
                        <div className="w-full h-1.5 bg-slate-100 dark:bg-white/[0.06] rounded-full overflow-hidden">
                          <div className="h-full bg-emerald-500 w-[88%] rounded-full"></div>
                        </div>
                      </div>
                    </div>
                    {/* Batch 3 */}
                    <div className="p-4 flex items-center justify-between hover:bg-indigo-50/50 dark:hover:bg-indigo-500/[0.06] transition-colors group">
                      <div>
                        <h4 className="font-bold text-sm text-slate-900 dark:text-slate-100">Tech Prep Batch 5</h4>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">Tutor: Deepak Sharma • Tech Prep • 20/25</p>
                      </div>
                      <div className="flex flex-col items-end gap-1.5 min-w-[100px]">
                        <div className="flex items-center gap-2 w-full justify-between">
                          <span className="text-sm font-bold text-slate-700 dark:text-slate-200">80%</span>
                          <span className="text-[9px] font-bold tracking-wider px-1.5 py-0.5 rounded bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-500/20">ACTIVE</span>
                        </div>
                        <div className="w-full h-1.5 bg-slate-100 dark:bg-white/[0.06] rounded-full overflow-hidden">
                          <div className="h-full bg-emerald-500 w-[80%] rounded-full"></div>
                        </div>
                      </div>
                    </div>
                    {/* Batch 4 — paused */}
                    <div className="p-4 flex items-center justify-between hover:bg-indigo-50/50 dark:hover:bg-indigo-500/[0.06] transition-colors group">
                      <div>
                        <h4 className="font-bold text-sm text-slate-900 dark:text-slate-100">IELTS Evening</h4>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">Tutor: Priya Menon • IELTS • 22/30</p>
                      </div>
                      <div className="flex flex-col items-end gap-1.5 min-w-[100px]">
                        <div className="flex items-center gap-2 w-full justify-between">
                          <span className="text-sm font-bold text-slate-700 dark:text-slate-200">73%</span>
                          <span className="text-[9px] font-bold tracking-wider px-1.5 py-0.5 rounded bg-rose-50 dark:bg-rose-500/10 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-500/20">PAUSED</span>
                        </div>
                        <div className="w-full h-1.5 bg-slate-100 dark:bg-white/[0.06] rounded-full overflow-hidden">
                          <div className="h-full bg-slate-300 dark:bg-slate-600 w-[73%] rounded-full"></div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

              </div>

              {/* Right Column (Spans 5 columns) */}
              <div className="xl:col-span-5 space-y-6">
                
                {/* Tutor Accounts */}
                <div className="bg-white dark:bg-[#0E0E16] rounded-2xl border border-slate-200/70 dark:border-white/[0.06] shadow-[0_2px_12px_-4px_rgba(15,23,42,0.08)] dark:shadow-none overflow-hidden transition-colors duration-500">
                  <div className="p-5 border-b border-slate-100 dark:border-white/[0.06] flex items-center gap-2">
                    <Users className="w-5 h-5 text-violet-500" />
                    <h2 className="text-base font-bold text-slate-900 dark:text-white">Tutor Accounts</h2>
                  </div>
                  <div className="divide-y divide-slate-100 dark:divide-white/[0.06]">
                    {/* Tutor 1 */}
                    <div className="p-4 flex items-center justify-between hover:bg-indigo-50/50 dark:hover:bg-indigo-500/[0.06] transition-colors">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded bg-slate-100 dark:bg-white/[0.04] flex items-center justify-center text-xs font-bold text-slate-600 dark:text-slate-300 shrink-0">SK</div>
                        <div>
                          <h4 className="font-semibold text-sm text-slate-900 dark:text-slate-100">Sarah Khan</h4>
                          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">2 batches • 50 students • Last: 2h ago</p>
                        </div>
                      </div>
                      <span className="text-[10px] font-bold tracking-wider px-2 py-0.5 rounded border border-emerald-200 dark:border-emerald-500/20 text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-500/10 dark:shadow-[0_0_10px_rgba(16,185,129,0.15)] shrink-0">ACTIVE</span>
                    </div>
                    {/* Tutor 2 */}
                    <div className="p-4 flex items-center justify-between hover:bg-indigo-50/50 dark:hover:bg-indigo-500/[0.06] transition-colors">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded bg-slate-100 dark:bg-white/[0.04] flex items-center justify-center text-xs font-bold text-slate-600 dark:text-slate-300 shrink-0">RK</div>
                        <div>
                          <h4 className="font-semibold text-sm text-slate-900 dark:text-slate-100">Ravi Kumar</h4>
                          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">1 batches • 35 students • Last: 1d ago</p>
                        </div>
                      </div>
                      <span className="text-[10px] font-bold tracking-wider px-2 py-0.5 rounded border border-emerald-200 dark:border-emerald-500/20 text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-500/10 dark:shadow-[0_0_10px_rgba(16,185,129,0.15)] shrink-0">ACTIVE</span>
                    </div>
                    {/* Tutor 3 */}
                    <div className="p-4 flex items-center justify-between hover:bg-indigo-50/50 dark:hover:bg-indigo-500/[0.06] transition-colors">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded bg-slate-100 dark:bg-white/[0.04] flex items-center justify-center text-xs font-bold text-slate-600 dark:text-slate-300 shrink-0">DS</div>
                        <div>
                          <h4 className="font-semibold text-sm text-slate-900 dark:text-slate-100">Deepak Sharma</h4>
                          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">1 batches • 20 students • Last: 3h ago</p>
                        </div>
                      </div>
                      <span className="text-[10px] font-bold tracking-wider px-2 py-0.5 rounded border border-emerald-200 dark:border-emerald-500/20 text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-500/10 dark:shadow-[0_0_10px_rgba(16,185,129,0.15)] shrink-0">ACTIVE</span>
                    </div>
                    {/* Tutor 4 — inactive */}
                    <div className="p-4 flex items-center justify-between hover:bg-indigo-50/50 dark:hover:bg-indigo-500/[0.06] transition-colors">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded bg-slate-100 dark:bg-white/[0.04] flex items-center justify-center text-xs font-bold text-slate-600 dark:text-slate-300 shrink-0">PM</div>
                        <div>
                          <h4 className="font-semibold text-sm text-slate-900 dark:text-slate-100">Priya Menon</h4>
                          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">1 batches • 22 students • Last: 5d ago</p>
                        </div>
                      </div>
                      <span className="text-[10px] font-bold tracking-wider px-2 py-0.5 rounded border border-slate-200 dark:border-white/[0.06] text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-white/[0.02] shrink-0">INACTIVE</span>
                    </div>
                  </div>
                </div>

                {/* Recent Activity */}
                <div className="bg-white dark:bg-[#0E0E16] rounded-2xl border border-slate-200/70 dark:border-white/[0.06] shadow-[0_2px_12px_-4px_rgba(15,23,42,0.08)] dark:shadow-none p-5 transition-colors duration-500">
                  <div className="flex items-center gap-2 mb-6">
                    <Activity className="w-5 h-5 text-emerald-500" />
                    <h2 className="text-base font-bold text-slate-900 dark:text-white">Recent Activity</h2>
                  </div>
                  
                  <div className="relative border-l border-slate-200 dark:border-white/[0.06] ml-2 space-y-6 pb-2">
                    
                    {/* Item 1 */}
                    <div className="relative pl-5">
                      <div className="absolute -left-[5px] top-1.5 w-2.5 h-2.5 rounded-full bg-emerald-500 ring-4 ring-white dark:ring-[#0E0E16]"></div>
                      <p className="text-[13px] text-slate-700 dark:text-slate-300 leading-snug">
                        <span className="font-semibold text-slate-900 dark:text-white">Student enrolled</span> — Rohit Verma — IELTS Batch 12
                      </p>
                      <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-1">1 hour ago</p>
                    </div>

                    {/* Item 2 */}
                    <div className="relative pl-5">
                      <div className="absolute -left-[5px] top-1.5 w-2.5 h-2.5 rounded-full bg-indigo-500 ring-4 ring-white dark:ring-[#0E0E16]"></div>
                      <p className="text-[13px] text-slate-700 dark:text-slate-300 leading-snug">
                        <span className="font-semibold text-slate-900 dark:text-white">Tutor assigned</span> — Sarah Khan — IELTS Evening (pending)
                      </p>
                      <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-1">3 hours ago</p>
                    </div>

                    {/* Item 3 */}
                    <div className="relative pl-5">
                      <div className="absolute -left-[5px] top-1.5 w-2.5 h-2.5 rounded-full bg-rose-500 ring-4 ring-white dark:ring-[#0E0E16]"></div>
                      <p className="text-[13px] text-slate-700 dark:text-slate-300 leading-snug">
                        <span className="font-semibold text-slate-900 dark:text-white">Batch capacity alert</span> — IELTS Batch 12 at 93% capacity
                      </p>
                      <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-1">Yesterday</p>
                    </div>

                    {/* Item 4 */}
                    <div className="relative pl-5">
                      <div className="absolute -left-[5px] top-1.5 w-2.5 h-2.5 rounded-full bg-rose-500 ring-4 ring-white dark:ring-[#0E0E16]"></div>
                      <p className="text-[13px] text-slate-700 dark:text-slate-300 leading-snug">
                        <span className="font-semibold text-slate-900 dark:text-white">Student removed</span> — Amit Shah — fee default
                      </p>
                      <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-1">Yesterday</p>
                    </div>

                    {/* Item 5 */}
                    <div className="relative pl-5">
                      <div className="absolute -left-[5px] top-1.5 w-2.5 h-2.5 rounded-full bg-blue-500 ring-4 ring-white dark:ring-[#0E0E16]"></div>
                      <p className="text-[13px] text-slate-700 dark:text-slate-300 leading-snug">
                        <span className="font-semibold text-slate-900 dark:text-white">Report generated</span> — Monthly Performance — March 2026
                      </p>
                      <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-1">2 days ago</p>
                    </div>

                  </div>
                </div>

              </div>
            </div>
            
          </div>
        </main>
      </div>
    </div>
  );
}