import React, { useState } from 'react';
import { Plus, Pencil, Check } from 'lucide-react';
import { SuperAdminSidebar } from '../Components/SuperadminSidebar';
import { SuperAdminTopbar } from '../Components/Superadmintopbar';

export default function PricingConfig() {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  // Revenue Simulator State
  const [simPerStudentInst, setSimPerStudentInst] = useState<number>(10);
  const [simAvgStudents, setSimAvgStudents] = useState<number>(80);
  const [simProInst, setSimProInst] = useState<number>(5);
  const [simEntInst, setSimEntInst] = useState<number>(2);

  // Calculations for Simulator
  const perStudentRev = simPerStudentInst * simAvgStudents * 2500;
  const proRev = simProInst * (50000 + (simAvgStudents * 500));
  const entRev = simEntInst * (150000 + (simAvgStudents * 300));
  const totalRev = perStudentRev + proRev + entRev;

  const formatLakhs = (val: number) => {
    return (val / 100000).toFixed(2);
  };

  return (
    <div className="relative min-h-screen font-plex antialiased overflow-x-hidden bg-brand-bg text-brand-text">

      {/* Sidebar */}
      <div className="hidden lg:block">
        <SuperAdminSidebar
          activeTab="pricing-config"
          isCollapsed={isSidebarCollapsed}
          toggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
        />
      </div>

      <div className={`relative z-10 transition-all duration-300 ${isSidebarCollapsed ? 'lg:pl-20' : 'lg:pl-64'}`}>

        {/* Topbar */}
        <SuperAdminTopbar />

        <main className="px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-8 max-w-[90rem] mx-auto pb-16">
          <div className="space-y-8">

            {/* Header */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
              <div>
                <h1 className="font-manrope text-2xl font-black tracking-tight text-brand-text">Subscription Plans</h1>
                <p className="text-sm text-brand-text-mute mt-1">Configure pricing tiers for institutes</p>
              </div>
              <button className="flex items-center justify-center gap-2 w-full sm:w-auto min-h-[44px] px-4 py-2.5 bg-brand-teal-600 hover:bg-brand-teal-700 text-white rounded-xl text-sm font-bold transition-colors shadow-sm">
                <Plus className="w-4 h-4" />
                Add Plan
              </button>
            </div>

            {/* Plans Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">

              {/* Plan 1: Per Student */}
              <div className="bg-white border border-brand-line rounded-2xl p-6 shadow-sm relative">
                <button className="absolute top-6 right-6 text-brand-text-mute hover:text-brand-teal-600 transition-colors">
                  <Pencil className="w-4 h-4" />
                </button>
                <h3 className="font-manrope text-xl font-bold text-brand-text mb-4">Per Student</h3>
                <div className="mb-1">
                  <span className="text-2xl font-bold text-brand-text">₹2,500</span>
                  <span className="text-sm text-brand-text-mute">/student/mo</span>
                </div>
                <p className="text-xs text-brand-text-mute mb-6">Up to 200 students</p>

                <ul className="space-y-3">
                  {['AI Assessments', 'Voice Lab', 'Reading Practice', 'Basic Reports'].map((feature, i) => (
                    <li key={i} className="flex items-center gap-3 text-sm text-brand-text">
                      <div className="w-5 h-5 rounded-full bg-emerald-100 flex items-center justify-center shrink-0">
                        <Check className="w-3 h-3 text-emerald-600" />
                      </div>
                      {feature}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Plan 2: Institute Pro (Popular) */}
              <div className="bg-white border-2 border-brand-teal-500 rounded-2xl p-6 shadow-sm relative">
                <div className="font-jetbrains absolute -top-3 left-6 bg-brand-teal-600 text-white text-[10px] font-bold uppercase tracking-wider px-3 py-1 rounded-full">
                  Most Popular
                </div>
                <button className="absolute top-6 right-6 text-brand-text-mute hover:text-brand-teal-600 transition-colors">
                  <Pencil className="w-4 h-4" />
                </button>
                <h3 className="font-manrope text-xl font-bold text-brand-text mb-4 mt-2">Institute Pro</h3>
                <div className="mb-1">
                  <span className="text-2xl font-bold text-brand-text">₹50K</span>
                  <span className="text-sm text-brand-text-mute">/mo base</span>
                </div>
                <div className="mb-1">
                  <span className="text-lg font-semibold text-brand-text">+ ₹500</span>
                  <span className="text-sm text-brand-text-mute">/student/mo</span>
                </div>
                <p className="text-xs text-brand-text-mute mb-6">Up to 500 students</p>

                <ul className="space-y-3">
                  {['Everything in Per Student', 'Custom Branding', 'Priority Support', 'Advanced Analytics', 'Tutor Dashboard'].map((feature, i) => (
                    <li key={i} className="flex items-center gap-3 text-sm text-brand-text">
                      <div className="w-5 h-5 rounded-full bg-emerald-100 flex items-center justify-center shrink-0">
                        <Check className="w-3 h-3 text-emerald-600" />
                      </div>
                      {feature}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Plan 3: Enterprise */}
              <div className="bg-white border border-brand-line rounded-2xl p-6 shadow-sm relative md:col-span-2 lg:col-span-1">
                <button className="absolute top-6 right-6 text-brand-text-mute hover:text-brand-teal-600 transition-colors">
                  <Pencil className="w-4 h-4" />
                </button>
                <h3 className="font-manrope text-xl font-bold text-brand-text mb-4">Enterprise</h3>
                <div className="mb-1">
                  <span className="text-2xl font-bold text-brand-text">₹150K</span>
                  <span className="text-sm text-brand-text-mute">/mo base</span>
                </div>
                <div className="mb-1">
                  <span className="text-lg font-semibold text-brand-text">+ ₹300</span>
                  <span className="text-sm text-brand-text-mute">/student/mo</span>
                </div>
                <p className="text-xs text-brand-text-mute mb-6">Unlimited students</p>

                <ul className="space-y-3">
                  {['Everything in Pro', 'Dedicated Account Manager', 'API Access', 'White-label', 'Custom Integrations', 'SLA Guarantee'].map((feature, i) => (
                    <li key={i} className="flex items-center gap-3 text-sm text-brand-text">
                      <div className="w-5 h-5 rounded-full bg-emerald-100 flex items-center justify-center shrink-0">
                        <Check className="w-3 h-3 text-emerald-600" />
                      </div>
                      {feature}
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Revenue Simulator */}
            <div className="bg-white border border-brand-line rounded-2xl shadow-sm overflow-hidden">
              <div className="p-5 sm:p-6 border-b border-brand-line">
                <h2 className="font-manrope text-lg font-bold text-brand-text">Revenue Simulator</h2>
              </div>
              <div className="p-5 sm:p-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-8">
                  <div className="space-y-2">
                    <label className="font-jetbrains block text-[10px] font-bold uppercase tracking-[0.15em] text-brand-text-mute">Per Student Institutes</label>
                    <input
                      type="number"
                      value={simPerStudentInst}
                      onChange={(e) => setSimPerStudentInst(Number(e.target.value))}
                      className="w-full min-h-[44px] bg-brand-bg-alt border border-brand-line rounded-xl px-4 py-2 text-sm font-medium text-brand-text focus:outline-none focus:ring-2 focus:ring-brand-teal-500/20 focus:border-brand-teal-500 transition-all"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="font-jetbrains block text-[10px] font-bold uppercase tracking-[0.15em] text-brand-text-mute">Avg Students Each</label>
                    <input
                      type="number"
                      value={simAvgStudents}
                      onChange={(e) => setSimAvgStudents(Number(e.target.value))}
                      className="w-full min-h-[44px] bg-brand-bg-alt border border-brand-line rounded-xl px-4 py-2 text-sm font-medium text-brand-text focus:outline-none focus:ring-2 focus:ring-brand-teal-500/20 focus:border-brand-teal-500 transition-all"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="font-jetbrains block text-[10px] font-bold uppercase tracking-[0.15em] text-brand-text-mute">Pro Institutes</label>
                    <input
                      type="number"
                      value={simProInst}
                      onChange={(e) => setSimProInst(Number(e.target.value))}
                      className="w-full min-h-[44px] bg-brand-bg-alt border border-brand-line rounded-xl px-4 py-2 text-sm font-medium text-brand-text focus:outline-none focus:ring-2 focus:ring-brand-teal-500/20 focus:border-brand-teal-500 transition-all"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="font-jetbrains block text-[10px] font-bold uppercase tracking-[0.15em] text-brand-text-mute">Enterprise Institutes</label>
                    <input
                      type="number"
                      value={simEntInst}
                      onChange={(e) => setSimEntInst(Number(e.target.value))}
                      className="w-full min-h-[44px] bg-brand-bg-alt border border-brand-line rounded-xl px-4 py-2 text-sm font-medium text-brand-text focus:outline-none focus:ring-2 focus:ring-brand-teal-500/20 focus:border-brand-teal-500 transition-all"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 pt-6 border-t border-brand-line">
                  <div>
                    <p className="font-jetbrains text-[10px] font-bold uppercase tracking-[0.15em] text-brand-text-mute mb-2">Per Student Rev</p>
                    <h3 className="text-2xl font-bold text-brand-text">₹{formatLakhs(perStudentRev)}L/mo</h3>
                  </div>
                  <div>
                    <p className="font-jetbrains text-[10px] font-bold uppercase tracking-[0.15em] text-brand-text-mute mb-2">Pro Rev</p>
                    <h3 className="text-2xl font-bold text-brand-text">₹{formatLakhs(proRev)}L/mo</h3>
                  </div>
                  <div>
                    <p className="font-jetbrains text-[10px] font-bold uppercase tracking-[0.15em] text-brand-text-mute mb-2">Total Projected MRR</p>
                    <h3 className="text-2xl font-bold text-brand-teal-600">₹{formatLakhs(totalRev)}L/mo</h3>
                  </div>
                </div>
              </div>
            </div>

            {/* Active Discount Codes */}
            <div className="bg-white border border-brand-line rounded-2xl shadow-sm overflow-hidden">
              <div className="p-5 sm:p-6 border-b border-brand-line flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <h2 className="font-manrope text-lg font-bold text-brand-text">Active Discount Codes</h2>
                <button className="flex items-center justify-center gap-2 w-full sm:w-auto min-h-[44px] px-4 py-2 bg-brand-bg-alt hover:bg-brand-teal-50 border border-brand-line text-brand-text rounded-xl text-xs font-bold transition-colors shadow-sm">
                  <Plus className="w-3 h-3" />
                  Add Code
                </button>
              </div>
              <div className="divide-y divide-brand-line">

                {/* Code 1 */}
                <div className="p-4 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex flex-wrap items-center gap-3 sm:gap-4">
                    <div className="font-jetbrains bg-brand-purple/10 border border-brand-purple/20 text-brand-purple px-3 py-1.5 rounded-md text-sm font-bold tracking-wider">
                      EARLY2025
                    </div>
                    <span className="text-sm font-semibold text-brand-text">20%</span>
                  </div>
                  <div className="flex flex-wrap items-center gap-x-6 gap-y-1 text-xs text-brand-text-mute">
                    <div>Used: <span className="text-brand-text font-bold">12/50</span></div>
                    <div>Expires: <span className="text-brand-text font-bold">Mar 31, 2025</span></div>
                  </div>
                </div>

                {/* Code 2 */}
                <div className="p-4 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex flex-wrap items-center gap-3 sm:gap-4">
                    <div className="font-jetbrains bg-brand-purple/10 border border-brand-purple/20 text-brand-purple px-3 py-1.5 rounded-md text-sm font-bold tracking-wider">
                      LAUNCH100
                    </div>
                    <span className="text-sm font-semibold text-brand-text">₹10,000 off</span>
                  </div>
                  <div className="flex flex-wrap items-center gap-x-6 gap-y-1 text-xs text-brand-text-mute">
                    <div>Used: <span className="text-brand-text font-bold">8/20</span></div>
                    <div>Expires: <span className="text-brand-text font-bold">Feb 28, 2025</span></div>
                  </div>
                </div>

                {/* Code 3 */}
                <div className="p-4 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex flex-wrap items-center gap-3 sm:gap-4">
                    <div className="font-jetbrains bg-brand-purple/10 border border-brand-purple/20 text-brand-purple px-3 py-1.5 rounded-md text-sm font-bold tracking-wider">
                      REFERRAL15
                    </div>
                    <span className="text-sm font-semibold text-brand-text">15%</span>
                  </div>
                  <div className="flex flex-wrap items-center gap-x-6 gap-y-1 text-xs text-brand-text-mute">
                    <div>Used: <span className="text-brand-text font-bold">34/∞</span></div>
                    <div>Expires: <span className="text-brand-text font-bold">Never</span></div>
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