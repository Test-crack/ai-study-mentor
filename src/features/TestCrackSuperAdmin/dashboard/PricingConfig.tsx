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
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-[#0B0A10] font-sans text-slate-900 dark:text-slate-200 transition-colors duration-300">
      
      {/* Sidebar */}
      <div className="hidden lg:block">
        <SuperAdminSidebar 
          activeTab="pricing-config" 
          isCollapsed={isSidebarCollapsed} 
          toggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)} 
        />
      </div>

      <div className={`transition-all duration-300 flex flex-col min-h-screen ${isSidebarCollapsed ? 'lg:pl-20' : 'lg:pl-64'}`}>
        
        {/* Topbar */}
        <SuperAdminTopbar />

        <main className="flex-1 p-4 sm:p-6 lg:p-8">
          <div className="max-w-[1400px] mx-auto space-y-8">
            
            {/* Header */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Subscription Plans</h1>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Configure pricing tiers for institutes</p>
              </div>
              <button className="flex items-center justify-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 dark:bg-[#7C3AED] dark:hover:bg-[#6D28D9] text-white rounded-lg text-sm font-medium transition-colors shadow-sm">
                <Plus className="w-4 h-4" />
                Add Plan
              </button>
            </div>

            {/* Plans Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              
              {/* Plan 1: Per Student */}
              <div className="bg-white dark:bg-[#15141B] border border-slate-200 dark:border-[#26252D] rounded-xl p-6 shadow-sm relative transition-colors">
                <button className="absolute top-6 right-6 text-slate-400 hover:text-indigo-600 dark:hover:text-[#A78BFA] transition-colors">
                  <Pencil className="w-4 h-4" />
                </button>
                <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-4">Per Student</h3>
                <div className="mb-1">
                  <span className="text-2xl font-bold text-slate-900 dark:text-white">₹2,500</span>
                  <span className="text-sm text-slate-500 dark:text-slate-400">/student/mo</span>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 mb-6">Up to 200 students</p>
                
                <ul className="space-y-3">
                  {['AI Assessments', 'Voice Lab', 'Reading Practice', 'Basic Reports'].map((feature, i) => (
                    <li key={i} className="flex items-center gap-3 text-sm text-slate-700 dark:text-slate-300">
                      <div className="w-5 h-5 rounded-full bg-emerald-100 dark:bg-emerald-500/10 flex items-center justify-center shrink-0">
                        <Check className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                      </div>
                      {feature}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Plan 2: Institute Pro (Popular) */}
              <div className="bg-white dark:bg-[#15141B] border-2 border-indigo-500 dark:border-[#7C3AED] rounded-xl p-6 shadow-md relative transition-colors">
                <div className="absolute -top-3 left-6 bg-indigo-600 dark:bg-[#7C3AED] text-white text-[10px] font-bold uppercase tracking-wider px-3 py-1 rounded-full">
                  Most Popular
                </div>
                <button className="absolute top-6 right-6 text-slate-400 hover:text-indigo-600 dark:hover:text-[#A78BFA] transition-colors">
                  <Pencil className="w-4 h-4" />
                </button>
                <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-4 mt-2">Institute Pro</h3>
                <div className="mb-1">
                  <span className="text-2xl font-bold text-slate-900 dark:text-white">₹50K</span>
                  <span className="text-sm text-slate-500 dark:text-slate-400">/mo base</span>
                </div>
                <div className="mb-1">
                  <span className="text-lg font-semibold text-slate-700 dark:text-slate-300">+ ₹500</span>
                  <span className="text-sm text-slate-500 dark:text-slate-400">/student/mo</span>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 mb-6">Up to 500 students</p>
                
                <ul className="space-y-3">
                  {['Everything in Per Student', 'Custom Branding', 'Priority Support', 'Advanced Analytics', 'Tutor Dashboard'].map((feature, i) => (
                    <li key={i} className="flex items-center gap-3 text-sm text-slate-700 dark:text-slate-300">
                      <div className="w-5 h-5 rounded-full bg-emerald-100 dark:bg-emerald-500/10 flex items-center justify-center shrink-0">
                        <Check className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                      </div>
                      {feature}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Plan 3: Enterprise */}
              <div className="bg-white dark:bg-[#15141B] border border-slate-200 dark:border-[#26252D] rounded-xl p-6 shadow-sm relative transition-colors">
                <button className="absolute top-6 right-6 text-slate-400 hover:text-indigo-600 dark:hover:text-[#A78BFA] transition-colors">
                  <Pencil className="w-4 h-4" />
                </button>
                <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-4">Enterprise</h3>
                <div className="mb-1">
                  <span className="text-2xl font-bold text-slate-900 dark:text-white">₹150K</span>
                  <span className="text-sm text-slate-500 dark:text-slate-400">/mo base</span>
                </div>
                <div className="mb-1">
                  <span className="text-lg font-semibold text-slate-700 dark:text-slate-300">+ ₹300</span>
                  <span className="text-sm text-slate-500 dark:text-slate-400">/student/mo</span>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 mb-6">Unlimited students</p>
                
                <ul className="space-y-3">
                  {['Everything in Pro', 'Dedicated Account Manager', 'API Access', 'White-label', 'Custom Integrations', 'SLA Guarantee'].map((feature, i) => (
                    <li key={i} className="flex items-center gap-3 text-sm text-slate-700 dark:text-slate-300">
                      <div className="w-5 h-5 rounded-full bg-emerald-100 dark:bg-emerald-500/10 flex items-center justify-center shrink-0">
                        <Check className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                      </div>
                      {feature}
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Revenue Simulator */}
            <div className="bg-white dark:bg-[#15141B] border border-slate-200 dark:border-[#26252D] rounded-xl shadow-sm transition-colors overflow-hidden">
              <div className="p-6 border-b border-slate-100 dark:border-[#26252D]">
                <h2 className="text-lg font-bold text-slate-900 dark:text-white">Revenue Simulator</h2>
              </div>
              <div className="p-6">
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                  <div className="space-y-2">
                    <label className="text-xs font-medium text-slate-500 dark:text-slate-400">Per Student Institutes</label>
                    <input 
                      type="number" 
                      value={simPerStudentInst} 
                      onChange={(e) => setSimPerStudentInst(Number(e.target.value))}
                      className="w-full bg-slate-50 dark:bg-[#0A0A0B] border border-slate-200 dark:border-[#26252D] rounded-lg px-4 py-2 text-sm text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500 dark:focus:border-[#8B5CF6] transition-colors"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-medium text-slate-500 dark:text-slate-400">Avg Students Each</label>
                    <input 
                      type="number" 
                      value={simAvgStudents} 
                      onChange={(e) => setSimAvgStudents(Number(e.target.value))}
                      className="w-full bg-slate-50 dark:bg-[#0A0A0B] border border-slate-200 dark:border-[#26252D] rounded-lg px-4 py-2 text-sm text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500 dark:focus:border-[#8B5CF6] transition-colors"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-medium text-slate-500 dark:text-slate-400">Pro Institutes</label>
                    <input 
                      type="number" 
                      value={simProInst} 
                      onChange={(e) => setSimProInst(Number(e.target.value))}
                      className="w-full bg-slate-50 dark:bg-[#0A0A0B] border border-slate-200 dark:border-[#26252D] rounded-lg px-4 py-2 text-sm text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500 dark:focus:border-[#8B5CF6] transition-colors"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-medium text-slate-500 dark:text-slate-400">Enterprise Institutes</label>
                    <input 
                      type="number" 
                      value={simEntInst} 
                      onChange={(e) => setSimEntInst(Number(e.target.value))}
                      className="w-full bg-slate-50 dark:bg-[#0A0A0B] border border-slate-200 dark:border-[#26252D] rounded-lg px-4 py-2 text-sm text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500 dark:focus:border-[#8B5CF6] transition-colors"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 pt-6 border-t border-slate-100 dark:border-[#26252D]">
                  <div>
                    <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Per Student Rev</p>
                    <h3 className="text-2xl font-bold text-slate-900 dark:text-white">₹{formatLakhs(perStudentRev)}L/mo</h3>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Pro Rev</p>
                    <h3 className="text-2xl font-bold text-slate-900 dark:text-white">₹{formatLakhs(proRev)}L/mo</h3>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Total Projected MRR</p>
                    <h3 className="text-2xl font-bold text-indigo-600 dark:text-[#A78BFA]">₹{formatLakhs(totalRev)}L/mo</h3>
                  </div>
                </div>
              </div>
            </div>

            {/* Active Discount Codes */}
            <div className="bg-white dark:bg-[#15141B] border border-slate-200 dark:border-[#26252D] rounded-xl shadow-sm transition-colors overflow-hidden">
              <div className="p-6 border-b border-slate-100 dark:border-[#26252D] flex items-center justify-between">
                <h2 className="text-lg font-bold text-slate-900 dark:text-white">Active Discount Codes</h2>
                <button className="flex items-center gap-2 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-[#26252D] dark:hover:bg-[#2E2D38] text-slate-900 dark:text-white rounded-lg text-xs font-medium transition-colors shadow-sm">
                  <Plus className="w-3 h-3" />
                  Add Code
                </button>
              </div>
              <div className="divide-y divide-slate-100 dark:divide-[#26252D]">
                
                {/* Code 1 */}
                <div className="p-4 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div className="bg-indigo-50 dark:bg-[#2D1F4D] border border-indigo-100 dark:border-[#3D1F4D] text-indigo-700 dark:text-[#D97CFF] px-3 py-1.5 rounded-md text-sm font-bold tracking-wider">
                      EARLY2025
                    </div>
                    <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">20%</span>
                  </div>
                  <div className="flex items-center gap-6 text-xs text-slate-500 dark:text-slate-400">
                    <div>Used: <span className="text-slate-900 dark:text-white font-medium">12/50</span></div>
                    <div>Expires: <span className="text-slate-900 dark:text-white font-medium">Mar 31, 2025</span></div>
                  </div>
                </div>

                {/* Code 2 */}
                <div className="p-4 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div className="bg-indigo-50 dark:bg-[#2D1F4D] border border-indigo-100 dark:border-[#3D1F4D] text-indigo-700 dark:text-[#D97CFF] px-3 py-1.5 rounded-md text-sm font-bold tracking-wider">
                      LAUNCH100
                    </div>
                    <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">₹10,000 off</span>
                  </div>
                  <div className="flex items-center gap-6 text-xs text-slate-500 dark:text-slate-400">
                    <div>Used: <span className="text-slate-900 dark:text-white font-medium">8/20</span></div>
                    <div>Expires: <span className="text-slate-900 dark:text-white font-medium">Feb 28, 2025</span></div>
                  </div>
                </div>

                {/* Code 3 */}
                <div className="p-4 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div className="bg-indigo-50 dark:bg-[#2D1F4D] border border-indigo-100 dark:border-[#3D1F4D] text-indigo-700 dark:text-[#D97CFF] px-3 py-1.5 rounded-md text-sm font-bold tracking-wider">
                      REFERRAL15
                    </div>
                    <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">15%</span>
                  </div>
                  <div className="flex items-center gap-6 text-xs text-slate-500 dark:text-slate-400">
                    <div>Used: <span className="text-slate-900 dark:text-white font-medium">34/∞</span></div>
                    <div>Expires: <span className="text-slate-900 dark:text-white font-medium">Never</span></div>
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