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
    if (type === 'enterprise') return 'text-blue-500 dark:text-[#3B82F6]';
    return 'text-purple-600 dark:text-[#A78BFA]';
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-[#0B0A10] font-sans text-slate-900 dark:text-slate-200 transition-colors duration-300">
      
      {/* Sidebar */}
      <div className="hidden lg:block">
        <SuperAdminSidebar 
          activeTab="superadmin-subscription" 
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
              <div className="bg-white dark:bg-[#15141B] border border-slate-200 dark:border-[#26252D] rounded-xl p-5 shadow-sm transition-colors">
                <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-1">Total MRR</p>
                <h3 className="text-2xl font-bold text-slate-900 dark:text-white">₹12.0L</h3>
              </div>
              
              <div className="bg-white dark:bg-[#15141B] border border-slate-200 dark:border-[#26252D] rounded-xl p-5 shadow-sm transition-colors">
                <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-1">Active Subs</p>
                <h3 className="text-2xl font-bold text-slate-900 dark:text-white">4</h3>
              </div>

              <div className="bg-white dark:bg-[#15141B] border border-slate-200 dark:border-[#26252D] rounded-xl p-5 shadow-sm transition-colors">
                <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-1">Trials</p>
                <h3 className="text-2xl font-bold text-amber-600 dark:text-[#F59E0B]">1</h3>
              </div>

              <div className="bg-white dark:bg-[#15141B] border border-slate-200 dark:border-[#26252D] rounded-xl p-5 shadow-sm transition-colors">
                <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-1">ARR Projection</p>
                <h3 className="text-2xl font-bold text-slate-900 dark:text-white">₹1.4Cr</h3>
              </div>
            </div>

            {/* Search Bar */}
            <div className="relative w-full max-w-sm mt-6">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-4 w-4 text-slate-400 dark:text-gray-500" />
              </div>
              <input
                type="text"
                placeholder="Search..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-transparent border border-slate-200 dark:border-gray-800 rounded-lg text-sm focus:outline-none focus:border-indigo-500 dark:focus:border-[#8B5CF6] transition-all text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-gray-500 shadow-sm"
              />
            </div>

            {/* Subscriptions Table */}
            <div className="bg-white dark:bg-transparent border border-slate-200 dark:border-transparent rounded-xl shadow-sm dark:shadow-none overflow-hidden mt-6">
              <div className="w-full overflow-x-auto px-4 py-2">
                <table className="w-full text-left border-collapse min-w-[900px]">
                  <thead>
                    <tr className="border-b border-slate-100 dark:border-gray-800 text-slate-500 dark:text-gray-400 text-sm">
                      <th className="pb-4 font-semibold dark:font-normal pl-2">Institute</th>
                      <th className="pb-4 font-semibold dark:font-normal">Plan</th>
                      <th className="pb-4 font-semibold dark:font-normal text-center">Students</th>
                      <th className="pb-4 font-semibold dark:font-normal">MRR</th>
                      <th className="pb-4 font-semibold dark:font-normal text-center">Status</th>
                      <th className="pb-4 font-semibold dark:font-normal">Next Billing</th>
                      <th className="pb-4 font-semibold dark:font-normal text-right pr-4">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-gray-800/50">
                    {filteredSubscriptions.map((sub) => (
                      <tr key={sub.id} className="hover:bg-slate-50 dark:hover:bg-white/[0.02] transition-colors group">
                        
                        {/* Institute */}
                        <td className="py-4 pl-2">
                          <span className="font-semibold text-sm text-slate-900 dark:text-gray-200">{sub.institute}</span>
                        </td>

                        {/* Plan */}
                        <td className="py-4">
                          <span className={`text-sm font-medium ${getPlanColor(sub.planType)}`}>
                            {sub.plan}
                          </span>
                        </td>

                        {/* Students */}
                        <td className="py-4 text-center">
                          <span className="text-sm font-medium text-slate-900 dark:text-gray-200">{sub.students}</span>
                        </td>

                        {/* MRR */}
                        <td className="py-4">
                          <span className="text-sm font-semibold text-slate-900 dark:text-gray-200">{sub.mrr}</span>
                        </td>

                        {/* Status */}
                        <td className="py-4 text-center">
                          <span className={`px-2 py-1 text-[10px] font-bold tracking-wider rounded ${
                            sub.status === 'ACTIVE' 
                              ? 'text-emerald-700 bg-emerald-100 dark:text-[#10B981] dark:bg-[#10B981]/10' 
                              : 'text-amber-700 bg-amber-100 dark:text-[#F59E0B] dark:bg-[#F59E0B]/10'
                          }`}>
                            {sub.status}
                          </span>
                        </td>

                        {/* Next Billing */}
                        <td className="py-4">
                          <span className="text-sm text-slate-600 dark:text-gray-400">{sub.nextBilling}</span>
                        </td>

                        {/* Actions */}
                        <td className="py-4 text-right pr-4">
                          <button className="px-3 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 dark:text-gray-300 dark:bg-transparent dark:border-gray-700 dark:hover:bg-gray-800 rounded transition-colors">
                            Manage
                          </button>
                        </td>

                      </tr>
                    ))}

                    {filteredSubscriptions.length === 0 && (
                      <tr>
                        <td colSpan={7} className="py-8 text-center text-slate-500 dark:text-gray-500">
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