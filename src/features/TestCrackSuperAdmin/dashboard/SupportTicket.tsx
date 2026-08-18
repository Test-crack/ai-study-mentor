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
      case 'HIGH': return 'text-rose-600 bg-rose-50 border-rose-200';
      case 'MEDIUM': return 'text-amber-600 bg-amber-50 border-amber-200';
      case 'LOW': return 'text-brand-text-mute bg-brand-bg-alt border-brand-line';
    }
  };

  // Helper for Status Badge
  const getStatusStyle = (status: TicketStatus) => {
    switch(status) {
      case 'open': return 'text-sky-600 bg-sky-50 border-sky-200';
      case 'in-progress': return 'text-brand-blue-600 bg-brand-blue-50 border-brand-blue-200';
      case 'resolved': return 'text-emerald-600 bg-emerald-50 border-emerald-200';
    }
  };

  return (
    <div className="relative min-h-screen font-plex antialiased overflow-x-hidden bg-brand-bg text-brand-text">

      {/* Sidebar */}
      <div className="hidden lg:block">
        <SuperAdminSidebar
          activeTab="support-tickets"
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
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="bg-white border border-brand-line rounded-2xl p-5 shadow-sm">
                <p className="font-jetbrains text-[10px] font-bold uppercase tracking-[0.15em] text-brand-text-mute mb-2">Open</p>
                <h3 className="text-3xl font-bold text-amber-500">{openCount}</h3>
              </div>
              <div className="bg-white border border-brand-line rounded-2xl p-5 shadow-sm">
                <p className="font-jetbrains text-[10px] font-bold uppercase tracking-[0.15em] text-brand-text-mute mb-2">In Progress</p>
                <h3 className="text-3xl font-bold text-brand-teal-600">{inProgressCount}</h3>
              </div>
              <div className="bg-white border border-brand-line rounded-2xl p-5 shadow-sm">
                <p className="font-jetbrains text-[10px] font-bold uppercase tracking-[0.15em] text-brand-text-mute mb-2">Resolved</p>
                <h3 className="text-3xl font-bold text-emerald-500">{resolvedCount}</h3>
              </div>
            </div>

            {/* Filters and Search */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 sm:gap-4">

              {/* Search Bar */}
              <div className="relative w-full sm:max-w-md">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Search className="h-4 w-4 text-brand-text-mute" />
                </div>
                <input
                  type="text"
                  placeholder="Search tickets..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full min-h-[44px] pl-10 pr-4 py-2.5 bg-brand-bg-alt border border-brand-line rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-brand-teal-500/20 focus:border-brand-teal-500 transition-all text-brand-text placeholder:text-brand-text-mute"
                />
              </div>

              {/* Status Filters */}
              <div className="flex items-center gap-1 bg-white border border-brand-line p-1 rounded-xl shadow-sm w-full sm:w-auto overflow-x-auto">
                {(['all', 'open', 'in-progress', 'resolved'] as const).map((filter) => (
                  <button
                    key={filter}
                    onClick={() => setActiveFilter(filter)}
                    className={`px-3 sm:px-4 py-2 text-sm font-bold rounded-lg capitalize whitespace-nowrap transition-colors flex-1 sm:flex-none ${
                      activeFilter === filter
                        ? 'bg-brand-teal-600 text-white'
                        : 'text-brand-text-mute hover:text-brand-text hover:bg-brand-bg-alt'
                    }`}
                  >
                    {filter.replace('-', ' ')}
                  </button>
                ))}
              </div>
            </div>

            {/* Ticket List */}
            <div className="space-y-3">
              {filteredTickets.map((ticket) => (
                <div
                  key={ticket.id}
                  className="bg-white border border-brand-line p-4 sm:p-5 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-brand-bg-alt transition-colors group cursor-pointer shadow-sm"
                >

                  {/* Left Side: Details */}
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-2">
                      <span className="font-jetbrains text-xs font-bold text-brand-text-mute">{ticket.id}</span>
                      <span className={`font-jetbrains text-[10px] font-bold tracking-wider px-2 py-0.5 rounded border uppercase ${getPriorityStyle(ticket.priority)}`}>
                        {ticket.priority}
                      </span>
                      <span className={`font-jetbrains text-[10px] font-bold tracking-wider px-2 py-0.5 rounded border uppercase ${getStatusStyle(ticket.status)}`}>
                        {ticket.status}
                      </span>
                    </div>
                    <h4 className="font-semibold text-base text-brand-text mb-1 group-hover:text-brand-teal-600 transition-colors break-words">
                      {ticket.title}
                    </h4>
                    <p className="text-xs text-brand-text-mute">
                      {ticket.institute} • {ticket.time} • {ticket.messages} Messages
                    </p>
                  </div>

                  {/* Right Side: Actions */}
                  <div className="flex items-center gap-3 shrink-0 w-full sm:w-auto self-start sm:self-center">
                    {ticket.status !== 'resolved' && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleAssign(ticket.id);
                        }}
                        className="flex-1 sm:flex-none min-h-[44px] px-4 py-2 text-xs font-bold text-brand-teal-700 bg-brand-teal-50 border border-brand-teal-200 hover:bg-brand-teal-100 rounded-xl transition-colors"
                      >
                        Assign
                      </button>
                    )}
                    <button className="flex-1 sm:flex-none min-h-[44px] px-4 py-2 text-xs font-bold text-brand-text bg-brand-bg-alt border border-brand-line hover:bg-white rounded-xl transition-colors">
                      View
                    </button>
                  </div>

                </div>
              ))}

              {filteredTickets.length === 0 && (
                <div className="py-16 text-center bg-white border border-brand-line rounded-2xl shadow-sm">
                  <p className="text-sm text-brand-text-mute font-medium">No tickets found matching your criteria.</p>
                </div>
              )}
            </div>

          </div>
        </main>

        {/* Toast Notification */}
        {toast.visible && (
          <div className="fixed bottom-6 right-4 left-4 sm:left-auto sm:right-6 sm:w-auto bg-brand-ink text-white px-4 py-3 rounded-xl shadow-sm flex items-center gap-3 animate-fade-in-up z-50">
            <div className="bg-emerald-500/20 rounded-full p-1">
              <Check className="w-4 h-4 text-emerald-400" />
            </div>
            <p className="text-sm font-medium pr-2">{toast.message}</p>
          </div>
        )}

      </div>
    </div>
  );
}