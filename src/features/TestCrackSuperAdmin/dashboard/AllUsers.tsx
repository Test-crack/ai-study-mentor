import React, { useState } from 'react';
import { Search, MoreVertical, Shield, UserCog, BookOpen, GraduationCap } from 'lucide-react';
import { SuperAdminSidebar } from '../Components/SuperadminSidebar';
import { SuperAdminTopbar } from '../Components/Superadmintopbar';

// --- Types & Mock Data ---
type Role = 'Owner' | 'Admin' | 'Tutor' | 'Student';
type Status = 'active' | 'inactive';

type User = {
  id: string;
  name: string;
  email: string;
  role: Role;
  institute: string;
  status: Status;
  lastActive: string;
  initials: string;
};

const initialUsers: User[] = [
  { id: '1', name: 'Vikram Patel', email: 'vikram@prestige.edu', role: 'Owner', institute: 'Prestige University', status: 'active', lastActive: '2 hrs ago', initials: 'VP' },
  { id: '2', name: 'Ananya Sharma', email: 'ananya@ace.edu', role: 'Owner', institute: 'Ace English Academy', status: 'active', lastActive: '1 hr ago', initials: 'AS' },
  { id: '3', name: 'Rajesh Nair', email: 'rajesh@prestige.edu', role: 'Admin', institute: 'Prestige University', status: 'active', lastActive: '30 min ago', initials: 'RN' },
  { id: '4', name: 'Meera Iyer', email: 'meera@speakwell.in', role: 'Admin', institute: 'SpeakWell Coaching', status: 'active', lastActive: '5 hrs ago', initials: 'MI' },
  { id: '5', name: 'Sarah Khan', email: 'sarah@ace.edu', role: 'Tutor', institute: 'Ace English Academy', status: 'active', lastActive: '1 hr ago', initials: 'SK' },
  { id: '6', name: 'Ravi Kumar', email: 'ravi@speakwell.in', role: 'Tutor', institute: 'SpeakWell Coaching', status: 'active', lastActive: '3 hrs ago', initials: 'RK' },
  { id: '7', name: 'Deepak Sharma', email: 'deepak@techbridge.in', role: 'Tutor', institute: 'TechBridge Institute', status: 'inactive', lastActive: '2 days ago', initials: 'DS' },
  { id: '8', name: 'Priya Menon', email: 'priya@ace.edu', role: 'Tutor', institute: 'Ace English Academy', status: 'active', lastActive: '4 hrs ago', initials: 'PM' },
  { id: '9', name: 'Arjun Reddy', email: 'arjun@student.com', role: 'Student', institute: 'Prestige University', status: 'active', lastActive: '10 min ago', initials: 'AR' },
  { id: '10', name: 'Neha Gupta', email: 'neha@student.com', role: 'Student', institute: 'Ace English Academy', status: 'active', lastActive: '1 hr ago', initials: 'NG' },
  { id: '11', name: 'Karan Singh', email: 'karan@student.com', role: 'Student', institute: 'SpeakWell Coaching', status: 'active', lastActive: '20 min ago', initials: 'KS' },
  { id: '12', name: 'Divya Joshi', email: 'divya@student.com', role: 'Student', institute: 'TechBridge Institute', status: 'inactive', lastActive: '1 week ago', initials: 'DJ' },
];

export default function AllUsers() {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'All' | Role>('All');

  // Dynamically calculate counts for tabs
  const counts = {
    All: initialUsers.length,
    Owners: initialUsers.filter(u => u.role === 'Owner').length,
    Admins: initialUsers.filter(u => u.role === 'Admin').length,
    Tutors: initialUsers.filter(u => u.role === 'Tutor').length,
    Students: initialUsers.filter(u => u.role === 'Student').length,
  };

  // Filter Logic
  const filteredUsers = initialUsers.filter(user => {
    const matchesTab = activeTab === 'All' || user.role === activeTab;
    const searchLower = searchQuery.toLowerCase();
    const matchesSearch = 
      user.name.toLowerCase().includes(searchLower) ||
      user.email.toLowerCase().includes(searchLower) ||
      user.institute.toLowerCase().includes(searchLower);
    
    return matchesTab && matchesSearch;
  });

  // Role Specific Styling & Icons
  const getRoleConfig = (role: Role) => {
    switch (role) {
      case 'Owner': return { icon: Shield, color: 'text-purple-600 dark:text-[#D97CFF]' };
      case 'Admin': return { icon: UserCog, color: 'text-amber-600 dark:text-[#F59E0B]' };
      case 'Tutor': return { icon: BookOpen, color: 'text-blue-600 dark:text-[#7CBAFF]' };
      case 'Student': return { icon: GraduationCap, color: 'text-emerald-600 dark:text-[#10B981]' };
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-[#0B0A10] font-sans text-slate-900 dark:text-slate-200 transition-colors duration-300">
      
      {/* Sidebar */}
      <div className="hidden lg:block">
        <SuperAdminSidebar 
          activeTab="users" // Adjust as needed to match your sidebar's active item
          isCollapsed={isSidebarCollapsed} 
          toggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)} 
        />
      </div>

      <div className={`transition-all duration-300 flex flex-col min-h-screen ${isSidebarCollapsed ? 'lg:pl-20' : 'lg:pl-64'}`}>
        
        {/* Topbar */}
        <SuperAdminTopbar />

        <main className="flex-1 p-4 sm:p-6 lg:p-8">
          <div className="max-w-[1400px] mx-auto space-y-6">
            
            {/* Tabs */}
            <div className="flex flex-wrap items-center gap-2 sm:gap-6 border-b border-slate-200 dark:border-[#26252D] pb-2">
              {[
                { label: 'All', value: 'All', count: counts.All },
                { label: 'Owners', value: 'Owner', count: counts.Owners },
                { label: 'Admins', value: 'Admin', count: counts.Admins },
                { label: 'Tutors', value: 'Tutor', count: counts.Tutors },
                { label: 'Students', value: 'Student', count: counts.Students },
              ].map((tab) => (
                <button
                  key={tab.label}
                  onClick={() => setActiveTab(tab.value as any)}
                  className={`pb-3 px-1 text-sm font-medium transition-all relative ${
                    activeTab === tab.value 
                      ? 'text-indigo-600 dark:text-white' 
                      : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
                  }`}
                >
                  {tab.label} ({tab.count})
                  {activeTab === tab.value && (
                    <div className="absolute bottom-0 left-0 w-full h-0.5 bg-indigo-600 dark:bg-white rounded-t-full"></div>
                  )}
                </button>
              ))}
            </div>

            {/* Container for Search and Table */}
            <div className="bg-white dark:bg-[#15141B] border border-slate-200 dark:border-[#26252D] rounded-xl shadow-sm overflow-hidden transition-colors">
              
              {/* Search Bar */}
              <div className="p-4 border-b border-slate-100 dark:border-[#26252D]">
                <div className="relative w-full">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Search className="h-4 w-4 text-slate-400 dark:text-gray-500" />
                  </div>
                  <input
                    type="text"
                    placeholder="Search by name, email, or institute..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-[#0A0A0B] border border-slate-200 dark:border-[#26252D] rounded-lg text-sm focus:outline-none focus:border-indigo-500 dark:focus:border-[#8B5CF6] transition-all text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-gray-500"
                  />
                </div>
              </div>

              {/* Users Table */}
              <div className="w-full overflow-x-auto">
                <table className="w-full text-left border-collapse min-w-[900px]">
                  <thead>
                    <tr className="text-slate-500 dark:text-gray-400 text-sm border-b border-slate-100 dark:border-gray-800/50">
                      <th className="py-4 pl-6 font-medium">User</th>
                      <th className="py-4 font-medium">Role</th>
                      <th className="py-4 font-medium">Institute</th>
                      <th className="py-4 font-medium">Status</th>
                      <th className="py-4 font-medium">Last Active</th>
                      <th className="py-4 pr-6 text-right font-medium"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-gray-800/50">
                    {filteredUsers.map((user) => {
                      const RoleIcon = getRoleConfig(user.role).icon;
                      const roleColor = getRoleConfig(user.role).color;

                      return (
                        <tr key={user.id} className="hover:bg-slate-50 dark:hover:bg-white/[0.02] transition-colors group">
                          
                          {/* User Column */}
                          <td className="py-3 pl-6">
                            <div className="flex items-center gap-3">
                              <div className="w-9 h-9 rounded bg-indigo-50 dark:bg-[#2D1F4D] text-indigo-700 dark:text-[#A67CFF] flex items-center justify-center text-xs font-bold shrink-0">
                                {user.initials}
                              </div>
                              <div>
                                <div className="font-semibold text-sm text-slate-900 dark:text-gray-200">{user.name}</div>
                                <div className="text-[11px] text-slate-500 dark:text-gray-500">{user.email}</div>
                              </div>
                            </div>
                          </td>

                          {/* Role Column */}
                          <td className="py-3">
                            <div className={`flex items-center gap-2 text-sm font-medium ${roleColor}`}>
                              <RoleIcon className="w-4 h-4" />
                              {user.role}
                            </div>
                          </td>

                          {/* Institute Column */}
                          <td className="py-3">
                            <span className="text-sm text-slate-700 dark:text-slate-300">
                              {user.institute}
                            </span>
                          </td>

                          {/* Status Column */}
                          <td className="py-3">
                            <span className={`text-[13px] font-medium ${
                              user.status === 'active' 
                                ? 'text-emerald-600 dark:text-[#10B981]' 
                                : 'text-slate-500 dark:text-slate-500'
                            }`}>
                              {user.status}
                            </span>
                          </td>

                          {/* Last Active Column */}
                          <td className="py-3">
                            <span className="text-sm text-slate-600 dark:text-slate-400">
                              {user.lastActive}
                            </span>
                          </td>

                          {/* Actions Column */}
                          <td className="py-3 pr-6 text-right">
                            <button className="p-1.5 text-slate-400 hover:text-slate-700 dark:text-gray-500 dark:hover:text-white rounded-lg hover:bg-slate-100 dark:hover:bg-white/10 transition-colors">
                              <MoreVertical className="w-4 h-4" />
                            </button>
                          </td>

                        </tr>
                      );
                    })}

                    {filteredUsers.length === 0 && (
                      <tr>
                        <td colSpan={6} className="py-12 text-center text-slate-500 dark:text-gray-500">
                          No users found matching "{searchQuery}"
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