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
    case 'INSTRUCTOR':      return { icon: BookOpen,    color: 'text-sky-600',   label: 'Instructor' };
    case 'STUDENT':         return { icon: GraduationCap, color: 'text-emerald-600', label: 'Student' };
    default:                return { icon: UserCog,     color: 'text-brand-text-mute',  label: role };
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
    <div className="relative min-h-screen font-plex antialiased overflow-x-hidden bg-brand-bg text-brand-text">

      {/* Sidebar */}
      <SuperAdminSidebar
        activeTab="users"
        isCollapsed={isSidebarCollapsed}
        toggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
      />

      <div className={`relative z-10 transition-all duration-300 ${isSidebarCollapsed ? 'lg:pl-24' : 'lg:pl-72'}`}>

        {/* Topbar */}
        <SuperAdminTopbar />

        <main className="px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-8 max-w-[90rem] mx-auto pb-16">

            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="font-jetbrains text-[10px] font-bold tracking-[0.2em] uppercase text-brand-text-mute mb-1">
                  Platform Roster
                </p>
                <h1 className="font-manrope text-2xl sm:text-3xl font-black tracking-tight text-brand-text">All Users</h1>
                <p className="text-sm text-brand-text-mute mt-0.5">
                  {loading ? '...' : `${total.toLocaleString()} users total`}
                </p>
              </div>
              <button
                onClick={loadUsers}
                className="flex items-center justify-center gap-2 text-sm font-medium text-brand-text-mute hover:text-brand-teal-600 transition-colors px-3 py-2.5 rounded-lg border border-brand-line bg-white hover:bg-brand-bg-alt w-full sm:w-auto shrink-0"
              >
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                Refresh
              </button>
            </div>

            {/* Role Tabs */}
            <div className="flex flex-wrap items-center gap-x-4 gap-y-2 sm:gap-x-6 border-b border-brand-line pb-2 -mb-2 overflow-x-auto">
              {TABS.map((tab) => (
                <button
                  key={tab.value}
                  onClick={() => setActiveTab(tab.value)}
                  className={`pb-3 px-1 text-sm font-semibold transition-all relative whitespace-nowrap ${
                    activeTab === tab.value
                      ? 'text-brand-teal-600'
                      : 'text-brand-text-mute hover:text-brand-text'
                  }`}
                >
                  {tab.label}
                  {activeTab === tab.value && (
                    <div className="absolute bottom-0 left-0 w-full h-0.5 bg-brand-teal-600 rounded-t-full" />
                  )}
                </button>
              ))}
            </div>

            {/* Table Card */}
            <div className="bg-white border border-brand-line rounded-2xl shadow-sm overflow-hidden">

              {/* Search */}
              <div className="p-4 border-b border-brand-line">
                <div className="relative w-full max-w-full sm:max-w-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Search className="h-4 w-4 text-brand-text-mute" />
                  </div>
                  <input
                    type="text"
                    placeholder="Search name or email..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 bg-brand-bg-alt border border-brand-line rounded-lg text-sm focus:outline-none focus:border-brand-teal-500 transition-all text-brand-text placeholder-brand-text-mute"
                  />
                </div>
              </div>

              {/* Table */}
              <div className="w-full overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-brand-bg-alt/80 border-b border-brand-line">
                      <th className="font-jetbrains py-3 pl-4 sm:pl-6 text-[10px] font-black text-brand-text-mute uppercase tracking-[0.12em]">User</th>
                      <th className="font-jetbrains py-3 text-[10px] font-black text-brand-text-mute uppercase tracking-[0.12em]">Role</th>
                      {activeTab !== 'SUPERADMIN' && (
                        <th className="font-jetbrains hidden md:table-cell py-3 text-[10px] font-black text-brand-text-mute uppercase tracking-[0.12em]">Institute</th>
                      )}
                      <th className="font-jetbrains hidden sm:table-cell py-3 text-[10px] font-black text-brand-text-mute uppercase tracking-[0.12em]">Joined</th>
                      <th className="py-3 pr-4 sm:pr-6 text-right"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-brand-line">

                    {loading && (
                      <tr>
                        <td colSpan={4} className="py-16 text-center">
                          <Loader2 className="w-6 h-6 animate-spin text-brand-teal-500 mx-auto" />
                        </td>
                      </tr>
                    )}

                    {!loading && users.length === 0 && (
                      <tr>
                        <td colSpan={4} className="py-12 px-4 text-center text-brand-text-mute text-sm">
                          No users found{debouncedSearch ? ` for "${debouncedSearch}"` : ''}.
                        </td>
                      </tr>
                    )}

                    {!loading && users.map((user) => {
                      const cfg = getRoleConfig(user.role);
                      const RoleIcon = cfg.icon;
                      return (
                        <tr key={user.id} className="hover:bg-brand-teal-50/50 transition-colors group">

                          {/* User */}
                          <td className="py-3 pl-4 sm:pl-6">
                            <div className="flex items-center gap-3">
                              {user.profileImage ? (
                                <img src={user.profileImage} alt="" className="w-9 h-9 rounded-lg object-cover shrink-0" />
                              ) : (
                                <div className="w-9 h-9 rounded-lg bg-brand-teal-50 text-brand-teal-700 flex items-center justify-center text-xs font-black shrink-0">
                                  {getInitials(user.name, user.email)}
                                </div>
                              )}
                              <div className="min-w-0">
                                <div className="font-semibold text-sm text-brand-text truncate">
                                  {user.name ?? '—'}
                                </div>
                                <div className="text-[11px] text-brand-text-mute truncate">{user.email}</div>
                              </div>
                            </div>
                          </td>

                          {/* Role */}
                          <td className="py-3 pr-3">
                            <div className={`flex items-center gap-2 text-sm font-semibold whitespace-nowrap ${cfg.color}`}>
                              <RoleIcon className="w-4 h-4 shrink-0" />
                              {cfg.label}
                            </div>
                          </td>

                          {/* Institute */}
                          {activeTab !== 'SUPERADMIN' && (
                            <td className="hidden md:table-cell py-3 pr-3">
                              {user.instituteName ? (
                                <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium bg-brand-teal-50 text-brand-teal-700 border border-brand-teal-100 max-w-[180px] truncate">
                                  {user.instituteName}
                                </span>
                              ) : (
                                <span className="text-brand-text-mute text-sm">—</span>
                              )}
                            </td>
                          )}

                          {/* Joined */}
                          <td className="hidden sm:table-cell py-3 pr-3">
                            <span className="text-sm text-brand-text-mute whitespace-nowrap">
                              {formatDate(user.createdAt)}
                            </span>
                          </td>

                          {/* Actions */}
                          <td className="py-3 pr-4 sm:pr-6 text-right">
                            <button className="h-10 w-10 inline-flex items-center justify-center text-brand-text-mute hover:text-brand-text rounded-lg hover:bg-brand-bg-alt transition-colors">
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
                <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-4 sm:px-6 py-4 border-t border-brand-line">
                  <span className="font-jetbrains text-[11px] font-bold uppercase tracking-[0.12em] text-brand-text-mute">
                    Page {currentPage} of {totalPages}
                  </span>
                  <div className="flex gap-2 w-full sm:w-auto">
                    <button
                      disabled={currentPage === 1}
                      onClick={() => setCurrentPage(p => p - 1)}
                      className="flex-1 sm:flex-none px-4 py-2.5 text-sm font-medium text-brand-text rounded-lg border border-brand-line disabled:opacity-40 hover:bg-brand-bg-alt transition-colors"
                    >
                      Previous
                    </button>
                    <button
                      disabled={currentPage === totalPages}
                      onClick={() => setCurrentPage(p => p + 1)}
                      className="flex-1 sm:flex-none px-4 py-2.5 text-sm font-medium text-brand-text rounded-lg border border-brand-line disabled:opacity-40 hover:bg-brand-bg-alt transition-colors"
                    >
                      Next
                    </button>
                  </div>
                </div>
              )}
            </div>
        </main>
      </div>
    </div>
  );
}
