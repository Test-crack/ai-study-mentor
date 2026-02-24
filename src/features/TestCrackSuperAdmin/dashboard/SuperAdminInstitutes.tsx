import React, { useState } from 'react';
import { Search, Plus, ChevronRight } from 'lucide-react';
import { SuperAdminSidebar } from '../Components/SuperadminSidebar';
import { SuperAdminTopbar } from '../Components/Superadmintopbar';

// Define the institute structure
type Institute = {
  id: string;
  name: string;
  location: string;
  plan: string;
  joined: string;
  status: 'ACTIVE' | 'TRIAL';
  students: number;
  tutors: number;
  mrr: string;
  health: number;
  initials: string;
};

// Mock data matching the video exactly
const initialInstitutes: Institute[] = [
  { id: '1', name: 'Ace English Academy', location: 'Mumbai', plan: 'Institute Pro', joined: '2025-06-15', status: 'ACTIVE', students: 280, tutors: 8, mrr: '₹190K', health: 92, initials: 'AE' },
  { id: '2', name: 'SpeakWell Coaching', location: 'Delhi', plan: 'Institute Pro', joined: '2025-08-01', status: 'ACTIVE', students: 200, tutors: 5, mrr: '₹150K', health: 88, initials: 'SC' },
  { id: '3', name: 'TechBridge Institute', location: 'Bangalore', plan: 'Per Student', joined: '2025-09-20', status: 'ACTIVE', students: 120, tutors: 3, mrr: '₹300K', health: 76, initials: 'TI' },
  { id: '4', name: 'Prestige University', location: 'Hyderabad', plan: 'Enterprise', joined: '2025-05-01', status: 'ACTIVE', students: 600, tutors: 12, mrr: '₹450K', health: 94, initials: 'PU' },
  { id: '5', name: 'LearnFirst Academy', location: 'Chennai', plan: 'Per Student', joined: '2026-02-10', status: 'TRIAL', students: 45, tutors: 2, mrr: '₹113K', health: 63, initials: 'LA' },
];

export default function SuperAdminInstitutes() {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Handle Search Filtering
  const filteredInstitutes = initialInstitutes.filter(inst => 
    inst.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-[#0B0A10] font-sans text-slate-900 dark:text-slate-200 transition-colors duration-300">
      
      {/* Sidebar */}
      <div className="hidden lg:block">
        <SuperAdminSidebar 
          activeTab="institutes" // Adjust to match your active tab logic
          isCollapsed={isSidebarCollapsed} 
          toggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)} 
        />
      </div>

      <div className={`transition-all duration-300 flex flex-col min-h-screen ${isSidebarCollapsed ? 'lg:pl-20' : 'lg:pl-64'}`}>
        
        {/* Topbar */}
        <SuperAdminTopbar />

        <main className="flex-1 p-4 sm:p-6 lg:p-8">
          <div className="max-w-[1200px] mx-auto space-y-6">
            
            {/* Top Header Section */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              {/* Search Bar */}
              <div className="relative w-full max-w-md">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Search className="h-4 w-4 text-slate-400 dark:text-gray-500" />
                </div>
                <input
                  type="text"
                  placeholder="Search institutes..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-transparent border border-slate-200 dark:border-gray-800 rounded-lg text-sm focus:outline-none focus:border-indigo-500 dark:focus:border-[#8B5CF6] focus:ring-1 focus:ring-indigo-500 dark:focus:ring-[#8B5CF6] transition-all text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-gray-500 shadow-sm"
                />
              </div>

              {/* Add Institute Button */}
              <button className="flex w-full sm:w-auto items-center justify-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 dark:bg-[#7C3AED] dark:hover:bg-[#6D28D9] text-white rounded-lg text-sm font-medium transition-colors shadow-sm">
                <Plus className="w-4 h-4" />
                Add Institute
              </button>
            </div>

            {/* Institutes List */}
            <div className="bg-white dark:bg-transparent border border-slate-200 dark:border-transparent rounded-xl shadow-sm dark:shadow-none overflow-hidden mt-6">
              <div className="divide-y divide-slate-100 dark:divide-gray-800/50">
                {filteredInstitutes.map((inst) => (
                  <div key={inst.id} className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-slate-50 dark:hover:bg-white/[0.02] transition-colors cursor-pointer group">
                    
                    {/* Left: Institute Info */}
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-lg bg-indigo-100 dark:bg-[#2D1F4D] text-indigo-700 dark:text-[#D97CFF] flex items-center justify-center font-bold text-lg shrink-0">
                        {inst.initials}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold text-[15px] text-slate-900 dark:text-gray-200">{inst.name}</h3>
                          <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold tracking-wider ${
                            inst.status === 'ACTIVE' 
                              ? 'text-emerald-700 bg-emerald-100 dark:text-[#10B981] dark:bg-[#10B981]/10' 
                              : 'text-rose-700 bg-rose-100 dark:text-[#F43F5E] dark:bg-[#F43F5E]/10'
                          }`}>
                            {inst.status}
                          </span>
                        </div>
                        <p className="text-[12px] text-slate-500 dark:text-gray-500 mt-1">
                          {inst.location} • {inst.plan} • Joined {inst.joined}
                        </p>
                      </div>
                    </div>

                    {/* Right: Metrics */}
                    <div className="flex items-center justify-between md:justify-end gap-6 md:gap-10 pl-16 md:pl-0">
                      
                      {/* Students */}
                      <div className="flex flex-col items-start md:items-center min-w-[50px]">
                        <span className="text-[11px] font-medium text-slate-500 dark:text-gray-500 mb-0.5">Students</span>
                        <span className="font-semibold text-slate-900 dark:text-gray-200">{inst.students}</span>
                      </div>

                      {/* Tutors */}
                      <div className="flex flex-col items-start md:items-center min-w-[40px]">
                        <span className="text-[11px] font-medium text-slate-500 dark:text-gray-500 mb-0.5">Tutors</span>
                        <span className="font-semibold text-slate-900 dark:text-gray-200">{inst.tutors}</span>
                      </div>

                      {/* MRR */}
                      <div className="flex flex-col items-start md:items-center min-w-[50px]">
                        <span className="text-[11px] font-medium text-slate-500 dark:text-gray-500 mb-0.5">MRR</span>
                        <span className="font-semibold text-slate-900 dark:text-gray-200">{inst.mrr}</span>
                      </div>

                      {/* Health */}
                      <div className="flex flex-col items-start md:items-center min-w-[50px]">
                        <span className="text-[11px] font-medium text-slate-500 dark:text-gray-500 mb-0.5">Health</span>
                        <span className={`font-semibold ${inst.health >= 80 ? 'text-emerald-600 dark:text-[#10B981]' : 'text-rose-600 dark:text-[#F43F5E]'}`}>
                          {inst.health}%
                        </span>
                      </div>

                      {/* Chevron */}
                      <div className="hidden md:flex items-center justify-center shrink-0 w-5">
                        <ChevronRight className="w-5 h-5 text-slate-400 group-hover:text-slate-600 dark:group-hover:text-white transition-colors" />
                      </div>
                    </div>

                  </div>
                ))}
                
                {filteredInstitutes.length === 0 && (
                  <div className="p-8 text-center text-slate-500 dark:text-gray-500">
                    No institutes found matching "{searchQuery}"
                  </div>
                )}
              </div>
            </div>

          </div>
        </main>
      </div>
    </div>
  );
}