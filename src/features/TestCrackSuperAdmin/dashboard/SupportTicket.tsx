import React, { useState } from 'react';
import { Search, Check } from 'lucide-react';
import { SuperAdminSidebar } from '../Components/SuperadminSidebar';
import { SuperAdminTopbar } from '../Components/Superadmintopbar';

// --- Mock Data ---
type TicketStatus = 'open' | 'in-progress' | 'resolved';
type TicketPriority = 'HIGH' | 'MEDIUM' | 'LOW';

type Ticket = {
  id: string;
  title: string;
  institute: string;
  time: string;
  messages: number;
  priority: TicketPriority;
  status: TicketStatus;
};

const initialTickets: Ticket[] = [
  { id: 'T-865', priority: 'HIGH', status: 'open', title: 'Bulk CSV import failing for > 500 rows', institute: 'TechBridge Institute', time: '2h ago', messages: 3 },
  { id: 'T-802', priority: 'MEDIUM', status: 'in-progress', title: 'White-label domain SSL not resolving', institute: 'Ace English Academy', time: '1d ago', messages: 6 },
  { id: 'T-803', priority: 'LOW', status: 'open', title: 'Trial extension request — 7 more days', institute: 'LearnFirst Academy', time: '3h ago', messages: 2 },
  { id: 'T-804', priority: 'HIGH', status: 'resolved', title: 'API rate limit exceeded during bulk assessment', institute: 'Prestige University', time: '2d ago', messages: 12 },
  { id: 'T-860', priority: 'MEDIUM', status: 'open', title: 'Student report PDF not generating correctly', institute: 'SpeakWell Coaching', time: '5h ago', messages: 4 },
];

export default function SupportTicket() {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<'all' | TicketStatus>('all');
  
  // Toast state
  const [toast, setToast] = useState<{ message: string; visible: boolean }>({ message: '', visible: false });

  // Calculate Metrics dynamically
  const openCount = initialTickets.filter(t => t.status === 'open').length;
  const inProgressCount = initialTickets.filter(t => t.status === 'in-progress').length;
  const resolvedCount = initialTickets.filter(t => t.status === 'resolved').length;

  // Handle Search & Filter
  const filteredTickets = initialTickets.filter(ticket => {
    const matchesFilter = activeFilter === 'all' || ticket.status === activeFilter;
    const matchesSearch = 
      ticket.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
      ticket.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ticket.institute.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  // Show Toast Notification
  const handleAssign = (id: string) => {
    setToast({ message: `Ticket ${id} assigned`, visible: true });
    setTimeout(() => {
      setToast({ message: '', visible: false });
    }, 3000);
  };

  // Helper for Priority Badge
  const getPriorityStyle = (priority: TicketPriority) => {
    switch(priority) {
      case 'HIGH': return 'text-rose-600 bg-rose-50 border-rose-200 dark:text-rose-500 dark:bg-rose-500/10 dark:border-rose-500/20';
      case 'MEDIUM': return 'text-amber-600 bg-amber-50 border-amber-200 dark:text-amber-500 dark:bg-amber-500/10 dark:border-amber-500/20';
      case 'LOW': return 'text-slate-600 bg-slate-100 border-slate-200 dark:text-slate-400 dark:bg-slate-500/10 dark:border-slate-500/20';
    }
  };

  // Helper for Status Badge
  const getStatusStyle = (status: TicketStatus) => {
    switch(status) {
      case 'open': return 'text-blue-600 bg-blue-50 border-blue-200 dark:text-blue-400 dark:bg-blue-500/10 dark:border-blue-500/20';
      case 'in-progress': return 'text-purple-600 bg-purple-50 border-purple-200 dark:text-purple-400 dark:bg-purple-500/10 dark:border-purple-500/20';
      case 'resolved': return 'text-emerald-600 bg-emerald-50 border-emerald-200 dark:text-emerald-400 dark:bg-emerald-500/10 dark:border-emerald-500/20';
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-[#0B0A10] font-sans text-slate-900 dark:text-slate-200 transition-colors duration-300">
      
      {/* Sidebar */}
      <div className="hidden lg:block">
        <SuperAdminSidebar 
          activeTab="support-tickets" 
          isCollapsed={isSidebarCollapsed} 
          toggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)} 
        />
      </div>

      <div className={`transition-all duration-300 flex flex-col min-h-screen ${isSidebarCollapsed ? 'lg:pl-20' : 'lg:pl-64'}`}>
        
        {/* Topbar */}
        <SuperAdminTopbar />

        <main className="flex-1 p-4 sm:p-6 lg:p-8">
          <div className="max-w-[1200px] mx-auto space-y-6">
            
            {/* Top Metrics Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-white dark:bg-[#15141B] border border-slate-200 dark:border-[#26252D] rounded-xl p-5 shadow-sm transition-colors">
                <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-1">Open</p>
                <h3 className="text-3xl font-bold text-amber-500">{openCount}</h3>
              </div>
              <div className="bg-white dark:bg-[#15141B] border border-slate-200 dark:border-[#26252D] rounded-xl p-5 shadow-sm transition-colors">
                <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-1">In Progress</p>
                <h3 className="text-3xl font-bold text-indigo-500 dark:text-indigo-400">{inProgressCount}</h3>
              </div>
              <div className="bg-white dark:bg-[#15141B] border border-slate-200 dark:border-[#26252D] rounded-xl p-5 shadow-sm transition-colors">
                <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-1">Resolved</p>
                <h3 className="text-3xl font-bold text-emerald-500">{resolvedCount}</h3>
              </div>
            </div>

            {/* Filters and Search */}
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 pt-4">
              
              {/* Search Bar */}
              <div className="relative w-full md:max-w-md">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Search className="h-4 w-4 text-slate-400 dark:text-gray-500" />
                </div>
                <input
                  type="text"
                  placeholder="Search tickets..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-[#15141B] border border-slate-200 dark:border-[#26252D] rounded-lg text-sm focus:outline-none focus:border-indigo-500 dark:focus:border-[#8B5CF6] transition-all text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-gray-500 shadow-sm"
                />
              </div>

              {/* Status Filters */}
              <div className="flex items-center gap-1 bg-white dark:bg-[#15141B] border border-slate-200 dark:border-[#26252D] p-1 rounded-xl shadow-sm w-full md:w-auto overflow-x-auto">
                {(['all', 'open', 'in-progress', 'resolved'] as const).map((filter) => (
                  <button
                    key={filter}
                    onClick={() => setActiveFilter(filter)}
                    className={`px-4 py-1.5 text-sm font-medium rounded-lg capitalize whitespace-nowrap transition-colors flex-1 md:flex-none ${
                      activeFilter === filter 
                        ? 'bg-indigo-600 dark:bg-[#7C3AED] text-white' 
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    {filter.replace('-', ' ')}
                  </button>
                ))}
              </div>
            </div>

            {/* Ticket List */}
            <div className="space-y-3 pt-2">
              {filteredTickets.map((ticket) => (
                <div 
                  key={ticket.id} 
                  className="bg-white dark:bg-[#15141B] border border-slate-200 dark:border-[#26252D] p-4 sm:p-5 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-slate-50 dark:hover:bg-white/[0.02] transition-colors group cursor-pointer shadow-sm dark:shadow-none"
                >
                  
                  {/* Left Side: Details */}
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">{ticket.id}</span>
                      <span className={`text-[10px] font-bold tracking-wider px-2 py-0.5 rounded border uppercase ${getPriorityStyle(ticket.priority)}`}>
                        {ticket.priority}
                      </span>
                      <span className={`text-[10px] font-bold tracking-wider px-2 py-0.5 rounded border uppercase ${getStatusStyle(ticket.status)}`}>
                        {ticket.status}
                      </span>
                    </div>
                    <h4 className="font-semibold text-base text-slate-900 dark:text-white mb-1 group-hover:text-indigo-600 dark:group-hover:text-[#A78BFA] transition-colors">
                      {ticket.title}
                    </h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      {ticket.institute} • {ticket.time} • {ticket.messages} Messages
                    </p>
                  </div>

                  {/* Right Side: Actions */}
                  <div className="flex items-center gap-3 shrink-0 self-start sm:self-center">
                    {ticket.status !== 'resolved' && (
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          handleAssign(ticket.id);
                        }}
                        className="px-4 py-2 text-xs font-semibold text-indigo-700 bg-indigo-50 border border-indigo-200 hover:bg-indigo-100 dark:text-[#A78BFA] dark:bg-[#7C3AED]/10 dark:border-[#7C3AED]/30 dark:hover:bg-[#7C3AED]/20 rounded-lg transition-colors"
                      >
                        Assign
                      </button>
                    )}
                    <button className="px-4 py-2 text-xs font-semibold text-slate-700 bg-slate-100 border border-slate-200 hover:bg-slate-200 dark:text-gray-300 dark:bg-[#26252D] dark:border-transparent dark:hover:bg-[#2E2D38] rounded-lg transition-colors">
                      View
                    </button>
                  </div>
                  
                </div>
              ))}

              {filteredTickets.length === 0 && (
                <div className="py-12 text-center bg-white dark:bg-[#15141B] border border-slate-200 dark:border-[#26252D] rounded-xl">
                  <p className="text-slate-500 dark:text-gray-500">No tickets found matching your criteria.</p>
                </div>
              )}
            </div>

          </div>
        </main>

        {/* Toast Notification */}
        {toast.visible && (
          <div className="fixed bottom-6 right-6 bg-slate-900 dark:bg-white text-white dark:text-slate-900 px-4 py-3 rounded-lg shadow-xl flex items-center gap-3 animate-fade-in-up z-50">
            <div className="bg-emerald-500/20 dark:bg-emerald-100 rounded-full p-1">
              <Check className="w-4 h-4 text-emerald-400 dark:text-emerald-600" />
            </div>
            <p className="text-sm font-medium pr-2">{toast.message}</p>
          </div>
        )}

      </div>
    </div>
  );
}