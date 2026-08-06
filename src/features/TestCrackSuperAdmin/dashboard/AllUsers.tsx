import React, { useState, useEffect, useCallback } from 'react';
import { Search, MoreVertical, Shield, UserCog, BookOpen, GraduationCap, ShieldCheck, Loader2, RefreshCw } from 'lucide-react';
import { SuperAdminSidebar } from '../Components/SuperadminSidebar';
import { SuperAdminTopbar } from '../Components/Superadmintopbar';
import { fetchAllUsers, UserRecord, UserRoleFilter } from '../services/superadminService';
import { useToast } from '@/shared/hooks/use-toast';

// ─── Role config ──────────────────────────────────────────────────────────────

type TabKey = 'ALL' | 'SUPERADMIN' | 'INSTITUTE_OWNER' | 'INSTITUTE_ADMIN' | 'INSTRUCTOR' | 'STUDENT';

const TABS: { label: string; value: TabKey }[] = [
  { label: 'All',              value: 'ALL' },
  { label: 'Super Admin',      value: 'SUPERADMIN' },
  { label: 'Institute Owners', value: 'INSTITUTE_OWNER' },
  { label: 'Institute Admins', value: 'INSTITUTE_ADMIN' },
  { label: 'Instructors',      value: 'INSTRUCTOR' },
  { label: 'Students',         value: 'STUDENT' },
];

const getRoleConfig = (role: string) => {
  switch (role) {
    case 'SUPERADMIN':      return { icon: ShieldCheck, color: 'text-brand-blue-600', label: 'Super Admin' };
    case 'INSTITUTE_OWNER': return { icon: Shield,      color: 'text-brand-blue-600', label: 'Owner' };
    case 'INSTITUTE_ADMIN': return { icon: UserCog,     color: 'text-amber-600',  label: 'Institute Admin' };
    case 'INSTRUCTOR':      return { icon: BookOpen,    color: 'text-blue-600',   label: 'Instructor' };
    case 'STUDENT':         return { icon: GraduationCap, color: 'text-emerald-600', label: 'Student' };
    default:                return { icon: UserCog,     color: 'text-slate-500',  label: role };
  }
};

const getInitials = (name: string | null, email: string) => {
  if (name) return name.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase();
  return email.slice(0, 2).toUpperCase();
};

const formatDate = (iso: string) => {
  try {
    return new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
  } catch {
    return '—';
  }
};

// ─── Component ─────────────────────────────────────────────────────────────────

export default function AllUsers() {
  const { toast } = useToast();
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [activeTab, setActiveTab] = useState<TabKey>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');

  const [users, setUsers] = useState<UserRecord[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const LIMIT = 50;

  // Debounce search input by 400ms
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(searchQuery), 400);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Reset to page 1 when tab or search changes
  useEffect(() => {
    setCurrentPage(1);
  }, [activeTab, debouncedSearch]);

  const loadUsers = useCallback(async () => {
    setLoading(true);
    try {
      const result = await fetchAllUsers({
        role: activeTab as UserRoleFilter,
        search: debouncedSearch || undefined,
        page: currentPage,
        limit: LIMIT,
      });
      setUsers(result.data);
      setTotal(result.meta.total);
    } catch (err: any) {
      toast({ title: 'Failed to load users', description: err.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  }, [activeTab, debouncedSearch, currentPage, toast]);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  const totalPages = Math.ceil(total / LIMIT);

  return (
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-[#0B0A10] font-sans text-slate-900 dark:text-slate-200 transition-colors duration-300">
      
      {/* Sidebar */}
      <div className="hidden lg:block">
        <SuperAdminSidebar
          activeTab="users"
          isCollapsed={isSidebarCollapsed}
          toggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
        />
      </div>

      <div className={`transition-all duration-300 flex flex-col min-h-screen ${isSidebarCollapsed ? 'lg:pl-20' : 'lg:pl-64'}`}>
        
        {/* Topbar */}
        <SuperAdminTopbar />

        <main className="flex-1 p-4 sm:p-6 lg:p-8">
          <div className="max-w-[1400px] mx-auto space-y-6">
            
            {/* Header */}
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-slate-900 dark:text-white">All Users</h1>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
                  {loading ? '...' : `${total.toLocaleString()} users total`}
                </p>
              </div>
              <button
                onClick={loadUsers}
                className="flex items-center gap-2 text-sm text-slate-500 hover:text-brand-teal-600 dark:hover:text-white transition-colors px-3 py-2 rounded-lg hover:bg-slate-100 dark:hover:bg-white/5"
              >
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                Refresh
              </button>
            </div>

            {/* Role Tabs */}
            <div className="flex flex-wrap items-center gap-2 sm:gap-6 border-b border-slate-200 dark:border-[#26252D] pb-2">
              {TABS.map((tab) => (
                <button
                  key={tab.value}
                  onClick={() => setActiveTab(tab.value)}
                  className={`pb-3 px-1 text-sm font-medium transition-all relative ${
                    activeTab === tab.value
                      ? 'text-brand-teal-600 dark:text-white'
                      : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
                  }`}
                >
                  {tab.label}
                  {activeTab === tab.value && (
                    <div className="absolute bottom-0 left-0 w-full h-0.5 bg-brand-teal-600 dark:bg-white rounded-t-full" />
                  )}
                </button>
              ))}
            </div>

            {/* Table Card */}
            <div className="bg-white dark:bg-[#15141B] border border-slate-200 dark:border-[#26252D] rounded-xl shadow-sm overflow-hidden">
              
              {/* Search */}
              <div className="p-4 border-b border-slate-100 dark:border-[#26252D]">
                <div className="relative w-full max-w-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Search className="h-4 w-4 text-slate-400" />
                  </div>
                  <input
                    type="text"
                    placeholder="Search name or email..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-[#0A0A0B] border border-slate-200 dark:border-[#26252D] rounded-lg text-sm focus:outline-none focus:border-brand-teal-500 dark:focus:border-[#256B8B] transition-all text-slate-900 dark:text-white placeholder-slate-400"
                  />
                </div>
              </div>

              {/* Table */}
              <div className="w-full overflow-x-auto">
                <table className="w-full text-left border-collapse min-w-[700px]">
                  <thead>
                    <tr className="text-slate-500 dark:text-gray-400 text-sm border-b border-slate-100 dark:border-gray-800/50">
                      <th className="py-4 pl-6 font-medium">User</th>
                      <th className="py-4 font-medium">Role</th>
                      {activeTab !== 'SUPERADMIN' && (
                        <th className="py-4 font-medium">Institute</th>
                      )}
                      <th className="py-4 font-medium">Joined</th>
                      <th className="py-4 pr-6 text-right font-medium"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-gray-800/50">
                    
                    {loading && (
                      <tr>
                        <td colSpan={4} className="py-16 text-center">
                          <Loader2 className="w-6 h-6 animate-spin text-brand-teal-500 mx-auto" />
                        </td>
                      </tr>
                    )}

                    {!loading && users.length === 0 && (
                      <tr>
                        <td colSpan={4} className="py-12 text-center text-slate-500 dark:text-gray-500 text-sm">
                          No users found{debouncedSearch ? ` for "${debouncedSearch}"` : ''}.
                        </td>
                      </tr>
                    )}

                    {!loading && users.map((user) => {
                      const cfg = getRoleConfig(user.role);
                      const RoleIcon = cfg.icon;
                      return (
                        <tr key={user.id} className="hover:bg-slate-50 dark:hover:bg-white/[0.02] transition-colors group">
                          
                          {/* User */}
                          <td className="py-3 pl-6">
                            <div className="flex items-center gap-3">
                              {user.profileImage ? (
                                <img src={user.profileImage} alt="" className="w-9 h-9 rounded object-cover" />
                              ) : (
                                <div className="w-9 h-9 rounded bg-brand-teal-50 dark:bg-[#142B3A] text-brand-teal-700 dark:text-[#4E8CA6] flex items-center justify-center text-xs font-bold shrink-0">
                                  {getInitials(user.name, user.email)}
                                </div>
                              )}
                              <div>
                                <div className="font-semibold text-sm text-slate-900 dark:text-gray-200">
                                  {user.name ?? '—'}
                                </div>
                                <div className="text-[11px] text-slate-500 dark:text-gray-500">{user.email}</div>
                              </div>
                            </div>
                          </td>

                          {/* Role */}
                          <td className="py-3">
                            <div className={`flex items-center gap-2 text-sm font-medium ${cfg.color}`}>
                              <RoleIcon className="w-4 h-4" />
                              {cfg.label}
                            </div>
                          </td>

                          {/* Institute */}
                          {activeTab !== 'SUPERADMIN' && (
                            <td className="py-3">
                              {user.instituteName ? (
                                <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium bg-brand-teal-50 dark:bg-brand-teal-900/20 text-brand-teal-700 dark:text-brand-teal-300 border border-brand-teal-100 dark:border-brand-teal-800/40 max-w-[180px] truncate">
                                  {user.instituteName}
                                </span>
                              ) : (
                                <span className="text-slate-400 dark:text-slate-600 text-sm">—</span>
                              )}
                            </td>
                          )}

                          {/* Joined */}
                          <td className="py-3">
                            <span className="text-sm text-slate-600 dark:text-slate-400">
                              {formatDate(user.createdAt)}
                            </span>
                          </td>

                          {/* Actions */}
                          <td className="py-3 pr-6 text-right">
                            <button className="p-1.5 text-slate-400 hover:text-slate-700 dark:text-gray-500 dark:hover:text-white rounded-lg hover:bg-slate-100 dark:hover:bg-white/10 transition-colors">
                              <MoreVertical className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {!loading && totalPages > 1 && (
                <div className="flex items-center justify-between px-6 py-4 border-t border-slate-100 dark:border-[#26252D]">
                  <span className="text-sm text-slate-500 dark:text-slate-400">
                    Page {currentPage} of {totalPages}
                  </span>
                  <div className="flex gap-2">
                    <button
                      disabled={currentPage === 1}
                      onClick={() => setCurrentPage(p => p - 1)}
                      className="px-3 py-1.5 text-sm rounded-lg border border-slate-200 dark:border-[#26252D] disabled:opacity-40 hover:bg-slate-50 dark:hover:bg-white/5 transition-colors"
                    >
                      Previous
                    </button>
                    <button
                      disabled={currentPage === totalPages}
                      onClick={() => setCurrentPage(p => p + 1)}
                      className="px-3 py-1.5 text-sm rounded-lg border border-slate-200 dark:border-[#26252D] disabled:opacity-40 hover:bg-slate-50 dark:hover:bg-white/5 transition-colors"
                    >
                      Next
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}