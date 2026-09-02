import React, { useState, useEffect } from 'react';
import {
  Building2,
  Users,
  CreditCard,
  ChevronRight,
  Loader2
} from 'lucide-react';
import { SuperAdminSidebar } from '../Components/SuperadminSidebar';
import { SuperAdminTopbar } from '../Components/Superadmintopbar';
import {
  fetchInstitutes, fetchSubscriptions,
  type InstituteRecord, type SubscriptionSummary,
} from '../services/superadminService';

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

export default function SuperAdminDashboard() {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [institutes, setInstitutes] = useState<InstituteRecord[]>([]);
  const [subs, setSubs] = useState<SubscriptionSummary | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // allSettled: the subscription summary is supplementary — if it fails the
    // institute list must still render rather than the page going blank.
    Promise.allSettled([fetchInstitutes(), fetchSubscriptions()])
      .then(([instRes, subRes]) => {
        if (instRes.status === 'fulfilled') setInstitutes(instRes.value.data || []);
        else console.error('[SuperAdmin] fetchInstitutes failed:', instRes.reason);

        if (subRes.status === 'fulfilled') setSubs(subRes.value.summary ?? null);
        else console.error('[SuperAdmin] fetchSubscriptions failed:', subRes.reason);

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
                  <strong className="text-white font-semibold">{loading ? '...' : institutes.length} institutes</strong> onboarded. <strong className="text-white font-semibold">{loading ? '...' : totalStudents.toLocaleString()} total students</strong>. <strong className="text-white font-semibold">{loading ? '...' : totalTutors.toLocaleString()} tutors</strong>.
                </p>
              </div>
            </div>

            {/* Top Metrics Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white border border-brand-line rounded-2xl p-4 sm:p-6 shadow-sm flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-jetbrains text-[10px] font-bold text-brand-text-mute uppercase tracking-[0.15em] mb-1">Institutes</p>
                  <h3 className="text-2xl font-black text-brand-text">{loading ? '...' : institutes.length}</h3>
                  <p className="text-[10px] text-brand-text-mute mt-1">
                    {subs ? `${subs.trial} on trial` : `${institutes.filter(i => i.isActive).length} active`}
                  </p>
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

              {/* Subscriptions — real counts from /api/superadmin/subscriptions.
                  Replaces the former MRR and Open Tickets tiles: there is no
                  revenue field on any superadmin endpoint (pricing existed only
                  in the deleted PricingConfig hardcode) and no tickets table at
                  all, so both were invented numbers. */}
              <div className="bg-white border border-brand-line rounded-2xl p-4 sm:p-6 shadow-sm flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-jetbrains text-[10px] font-bold text-brand-text-mute uppercase tracking-[0.15em] mb-1">Active Subscriptions</p>
                  <h3 className="text-2xl font-black text-brand-text">{loading ? '...' : subs ? subs.active : '—'}</h3>
                  <p className="text-[10px] text-brand-text-mute mt-1">
                    {subs ? `${subs.total} total · ${subs.cancelled} cancelled` : 'Unavailable'}
                  </p>
                </div>
                <div className="w-10 h-10 rounded-full bg-emerald-50 flex items-center justify-center shrink-0">
                  <CreditCard className="w-5 h-5 text-emerald-600" />
                </div>
              </div>
            </div>

            {/* Institutes — the only real list on this page, so it runs full
                width now that the hardcoded Platform Activity column is gone. */}
            <div>
              <div className="space-y-4">
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

            </div>

        </main>
      </div>
    </div>
  );
}
