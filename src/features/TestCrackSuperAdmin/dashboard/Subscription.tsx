import React, { useState } from 'react';
import { Search } from 'lucide-react';
import { SuperAdminTopbar } from '../Components/Superadmintopbar';
import { SuperAdminSidebar } from '../Components/SuperadminSidebar';

// --- Mock Data ---
type Subscription = {
  id: string;
  institute: string;
  plan: string;
  planType: 'enterprise' | 'pro' | 'per-student';
  students: number;
  mrr: string;
  status: 'ACTIVE' | 'TRIAL';
  nextBilling: string;
};

const subscriptionsData: Subscription[] = [
  { id: '1', institute: 'Prestige University', plan: 'Enterprise', planType: 'enterprise', students: 500, mrr: '₹450K', status: 'ACTIVE', nextBilling: '2026-03-01' },
  { id: '2', institute: 'Ace English Academy', plan: 'Institute Pro', planType: 'pro', students: 280, mrr: '₹190K', status: 'ACTIVE', nextBilling: '2026-03-01' },
  { id: '3', institute: 'SpeakWell Coaching', plan: 'Institute Pro', planType: 'pro', students: 200, mrr: '₹150K', status: 'ACTIVE', nextBilling: '2026-03-01' },
  { id: '4', institute: 'TechBridge Institute', plan: 'Per Student', planType: 'per-student', students: 120, mrr: '₹300K', status: 'ACTIVE', nextBilling: '2026-03-01' },
  { id: '5', institute: 'LearnFirst Academy', plan: 'Per Student', planType: 'per-student', students: 45, mrr: '₹113K', status: 'TRIAL', nextBilling: '2026-03-10' },
];

export default function Subscription() {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Handle Search Filtering
  const filteredSubscriptions = subscriptionsData.filter(sub => 
    sub.institute.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Helper for plan text styling
  const getPlanColor = (type: string) => {
    if (type === 'enterprise') return 'text-brand-purple';
    return 'text-brand-blue-600';
  };

  return (
    <div className="relative min-h-screen font-plex antialiased overflow-x-hidden bg-brand-bg text-brand-text">

      {/* Sidebar */}
      <div className="hidden lg:block">
        <SuperAdminSidebar
          activeTab="superadmin-subscription"
          isCollapsed={isSidebarCollapsed}
          toggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
        />
      </div>

      <div className={`relative z-10 transition-all duration-300 ${isSidebarCollapsed ? 'lg:pl-20' : 'lg:pl-64'}`}>

        {/* Topbar */}
        <SuperAdminTopbar />

        <main className="px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6 max-w-[90rem] mx-auto pb-16">
          <div className="space-y-6">

            {/* Top Metrics Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white border border-brand-line rounded-2xl p-5 shadow-sm">
                <p className="font-jetbrains text-[10px] font-bold uppercase tracking-[0.15em] text-brand-text-mute mb-2">Total MRR</p>
                <h3 className="text-2xl font-bold text-brand-text">₹12.0L</h3>
              </div>

              <div className="bg-white border border-brand-line rounded-2xl p-5 shadow-sm">
                <p className="font-jetbrains text-[10px] font-bold uppercase tracking-[0.15em] text-brand-text-mute mb-2">Active Subs</p>
                <h3 className="text-2xl font-bold text-brand-text">4</h3>
              </div>

              <div className="bg-white border border-brand-line rounded-2xl p-5 shadow-sm">
                <p className="font-jetbrains text-[10px] font-bold uppercase tracking-[0.15em] text-brand-text-mute mb-2">Trials</p>
                <h3 className="text-2xl font-bold text-amber-600">1</h3>
              </div>

              <div className="bg-white border border-brand-line rounded-2xl p-5 shadow-sm">
                <p className="font-jetbrains text-[10px] font-bold uppercase tracking-[0.15em] text-brand-text-mute mb-2">ARR Projection</p>
                <h3 className="text-2xl font-bold text-brand-text">₹1.4Cr</h3>
              </div>
            </div>

            {/* Search Bar */}
            <div className="relative w-full sm:max-w-sm">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-4 w-4 text-brand-text-mute" />
              </div>
              <input
                type="text"
                placeholder="Search..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full min-h-[44px] pl-10 pr-4 py-2.5 bg-brand-bg-alt border border-brand-line rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-brand-teal-500/20 focus:border-brand-teal-500 transition-all text-brand-text placeholder:text-brand-text-mute"
              />
            </div>

            {/* Subscriptions Table */}
            <div className="bg-white border border-brand-line rounded-2xl shadow-sm overflow-hidden">
              <div className="w-full overflow-x-auto">
                <table className="w-full text-left border-collapse min-w-[720px]">
                  <thead>
                    <tr className="border-b border-brand-line bg-brand-bg-alt">
                      <th className="font-jetbrains px-4 py-3 text-[10px] font-bold uppercase tracking-[0.15em] text-brand-text-mute whitespace-nowrap">Institute</th>
                      <th className="font-jetbrains px-4 py-3 text-[10px] font-bold uppercase tracking-[0.15em] text-brand-text-mute whitespace-nowrap">Plan</th>
                      <th className="font-jetbrains px-4 py-3 text-[10px] font-bold uppercase tracking-[0.15em] text-brand-text-mute text-center whitespace-nowrap hidden md:table-cell">Students</th>
                      <th className="font-jetbrains px-4 py-3 text-[10px] font-bold uppercase tracking-[0.15em] text-brand-text-mute whitespace-nowrap">MRR</th>
                      <th className="font-jetbrains px-4 py-3 text-[10px] font-bold uppercase tracking-[0.15em] text-brand-text-mute text-center whitespace-nowrap">Status</th>
                      <th className="font-jetbrains px-4 py-3 text-[10px] font-bold uppercase tracking-[0.15em] text-brand-text-mute whitespace-nowrap hidden lg:table-cell">Next Billing</th>
                      <th className="font-jetbrains px-4 py-3 text-[10px] font-bold uppercase tracking-[0.15em] text-brand-text-mute text-right whitespace-nowrap">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-brand-line">
                    {filteredSubscriptions.map((sub) => (
                      <tr key={sub.id} className="hover:bg-brand-bg-alt transition-colors group">

                        {/* Institute */}
                        <td className="px-4 py-4">
                          <span className="font-semibold text-sm text-brand-text">{sub.institute}</span>
                        </td>

                        {/* Plan */}
                        <td className="px-4 py-4">
                          <span className={`text-sm font-medium ${getPlanColor(sub.planType)}`}>
                            {sub.plan}
                          </span>
                        </td>

                        {/* Students */}
                        <td className="px-4 py-4 text-center hidden md:table-cell">
                          <span className="text-sm font-medium text-brand-text">{sub.students}</span>
                        </td>

                        {/* MRR */}
                        <td className="px-4 py-4">
                          <span className="text-sm font-semibold text-brand-text">{sub.mrr}</span>
                        </td>

                        {/* Status */}
                        <td className="px-4 py-4 text-center">
                          <span className={`font-jetbrains inline-block px-2 py-1 text-[10px] font-bold tracking-wider rounded ${
                            sub.status === 'ACTIVE'
                              ? 'text-emerald-700 bg-emerald-100'
                              : 'text-amber-700 bg-amber-100'
                          }`}>
                            {sub.status}
                          </span>
                        </td>

                        {/* Next Billing */}
                        <td className="px-4 py-4 hidden lg:table-cell">
                          <span className="text-sm text-brand-text-mute">{sub.nextBilling}</span>
                        </td>

                        {/* Actions */}
                        <td className="px-4 py-4 text-right">
                          <button className="px-3 py-2 text-xs font-bold text-brand-text bg-white border border-brand-line hover:bg-brand-bg-alt rounded-lg transition-colors whitespace-nowrap">
                            Manage
                          </button>
                        </td>

                      </tr>
                    ))}

                    {filteredSubscriptions.length === 0 && (
                      <tr>
                        <td colSpan={7} className="py-12 text-center text-sm text-brand-text-mute">
                          No subscriptions found matching "{searchQuery}"
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

          </div>
        </main>
      </div>
    </div>
  );
}