import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Search, Plus, Loader2, RefreshCw, X,
  Mail, User, CheckCircle2, Trash2, ShieldCheck,
  MoreVertical,
} from 'lucide-react';
import { InstituteOwnerSidebar } from '../components/InstitiuteOwnerSidebar';
import { InstituteOwnerTopbar } from '../components/InstituteOwnerTopbar';
import { fetchAdmins, addAdmin, removeAdmin, AdminRecord } from '../services/instituteOwnerService';
import { useToast } from '@/shared/hooks/use-toast';

// ─── Helpers ──────────────────────────────────────────────────────────────────

const getInitials = (name: string | null, fallback: string) =>
  (name ?? fallback).split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase();

const formatDate = (iso: string) => {
  try { return new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }); }
  catch { return '—'; }
};

// ─── Row Actions Menu ─────────────────────────────────────────────────────────

function AdminRowMenu({ onRemove }: { onRemove: () => void }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    if (open) document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(v => !v)}
        className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-white/10 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
      >
        <MoreVertical className="w-4 h-4" />
      </button>
      {open && (
        <div className="absolute right-0 top-full mt-1 z-30 w-40 bg-white dark:bg-[#1E1D27] border border-slate-200 dark:border-[#2E2D3A] rounded-xl shadow-xl py-1 overflow-hidden">
          <button
            onClick={() => { setOpen(false); onRemove(); }}
            className="w-full flex items-center gap-2.5 px-3.5 py-2.5 text-sm font-medium text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-900/20 transition-colors"
          >
            <Trash2 className="w-4 h-4" /> Remove Admin
          </button>
        </div>
      )}
    </div>
  );
}

// ─── Add Admin Modal ──────────────────────────────────────────────────────────

interface AddModalProps {
  onClose: () => void;
  onAdded: () => void;
}

function AddAdminModal({ onClose, onAdded }: AddModalProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ adminName: '', adminEmail: '' });

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm(prev => ({ ...prev, [k]: e.target.value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.adminName.trim() || !form.adminEmail.trim()) return;
    setLoading(true);
    try {
      const res = await addAdmin({ adminName: form.adminName, adminEmail: form.adminEmail });
      toast({
        title: '✅ Admin Added',
        description: res.data.inviteEmailSent
          ? `Invite email sent to ${res.data.email}`
          : `Admin created. Email could not be sent — check Supabase logs.`,
      });
      onAdded();
      onClose();
    } catch (err: any) {
      toast({ title: 'Failed to add admin', description: err.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white dark:bg-[#15141B] rounded-2xl shadow-2xl w-full max-w-md border border-slate-200 dark:border-[#26252D]">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100 dark:border-[#26252D]">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-50 dark:bg-indigo-900/30 rounded-lg">
              <ShieldCheck className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            </div>
            <div>
              <h2 className="font-bold text-slate-900 dark:text-white text-base">Add Institute Admin</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Admin will receive an email invite to set their password</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-white/10 transition-colors text-slate-400">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider">Full Name *</label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text" required value={form.adminName} onChange={set('adminName')}
                placeholder="Admin full name"
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-[#0A0A0B] border border-slate-200 dark:border-[#26252D] rounded-lg text-sm focus:outline-none focus:border-indigo-500 dark:text-white placeholder-slate-400"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider">Email Address *</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="email" required value={form.adminEmail} onChange={set('adminEmail')}
                placeholder="admin@institute.com"
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-[#0A0A0B] border border-slate-200 dark:border-[#26252D] rounded-lg text-sm focus:outline-none focus:border-indigo-500 dark:text-white placeholder-slate-400"
              />
            </div>
          </div>

          <div className="flex items-start gap-2 bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-100 dark:border-indigo-800/40 rounded-lg p-3">
            <CheckCircle2 className="w-4 h-4 text-indigo-500 mt-0.5 shrink-0" />
            <p className="text-xs text-indigo-700 dark:text-indigo-300 leading-relaxed">
              The admin will receive a Supabase invite email. Once they accept and set a password, they'll have access to the Institute Admin dashboard.
            </p>
          </div>

          <div className="flex gap-3 pt-1">
            <button type="button" onClick={onClose}
              className="flex-1 py-2.5 rounded-lg border border-slate-200 dark:border-[#26252D] text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-white/5 transition-colors">
              Cancel
            </button>
            <button type="submit" disabled={loading}
              className="flex-1 py-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold transition-colors flex items-center justify-center gap-2 disabled:opacity-60">
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
              {loading ? 'Adding...' : 'Add & Send Invite'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Confirm Remove Dialog ────────────────────────────────────────────────────

interface ConfirmRemoveProps {
  admin: AdminRecord;
  onConfirm: () => void;
  onCancel: () => void;
  loading: boolean;
}

function ConfirmRemoveDialog({ admin, onConfirm, onCancel, loading }: ConfirmRemoveProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white dark:bg-[#15141B] rounded-2xl shadow-2xl w-full max-w-sm border border-slate-200 dark:border-[#26252D] p-6 space-y-5">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-rose-50 dark:bg-rose-900/30 rounded-lg">
            <Trash2 className="w-5 h-5 text-rose-600 dark:text-rose-400" />
          </div>
          <div>
            <h3 className="font-bold text-slate-900 dark:text-white">Remove Admin?</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{admin.name ?? admin.email}</p>
          </div>
        </div>
        <p className="text-sm text-slate-600 dark:text-slate-400">
          This will remove <strong>{admin.email}</strong> as an admin and downgrade their account to a regular student. This action can be undone by re-inviting them.
        </p>
        <div className="flex gap-3">
          <button onClick={onCancel} className="flex-1 py-2.5 rounded-lg border border-slate-200 dark:border-[#26252D] text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-white/5 transition-colors">
            Cancel
          </button>
          <button onClick={onConfirm} disabled={loading}
            className="flex-1 py-2.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-sm font-semibold transition-colors flex items-center justify-center gap-2 disabled:opacity-60">
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
            {loading ? 'Removing...' : 'Yes, Remove'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function InstituteAdmins() {
  const { toast } = useToast();
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [admins, setAdmins] = useState<AdminRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [removeTarget, setRemoveTarget] = useState<AdminRecord | null>(null);
  const [removeLoading, setRemoveLoading] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetchAdmins();
      setAdmins(res.data);
    } catch (err: any) {
      toast({ title: 'Failed to load admins', description: err.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => { load(); }, [load]);

  const handleRemove = async () => {
    if (!removeTarget) return;
    setRemoveLoading(true);
    try {
      await removeAdmin(removeTarget.userId);
      setAdmins(prev => prev.filter(a => a.userId !== removeTarget.userId));
      toast({ title: '🗑️ Admin Removed', description: `${removeTarget.email} has been removed.` });
      setRemoveTarget(null);
    } catch (err: any) {
      toast({ title: 'Failed to remove admin', description: err.message, variant: 'destructive' });
    } finally {
      setRemoveLoading(false);
    }
  };

  const filteredAdmins = admins.filter(a =>
    (a.name ?? '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    a.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-[#0B0A10] font-sans text-slate-900 dark:text-slate-200 transition-colors duration-300">

      {showAddModal && <AddAdminModal onClose={() => setShowAddModal(false)} onAdded={load} />}
      {removeTarget && (
        <ConfirmRemoveDialog
          admin={removeTarget}
          onConfirm={handleRemove}
          onCancel={() => setRemoveTarget(null)}
          loading={removeLoading}
        />
      )}

      {/* Sidebar */}
      <div className="hidden lg:block">
        <InstituteOwnerSidebar
          activeTab="admins"
          isCollapsed={isSidebarCollapsed}
          toggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
        />
      </div>

      <div className={`transition-all duration-300 flex flex-col min-h-screen ${isSidebarCollapsed ? 'lg:pl-20' : 'lg:pl-64'}`}>
        <InstituteOwnerTopbar />

        <main className="flex-1 p-4 sm:p-6 lg:p-8">
          <div className="max-w-[1200px] mx-auto space-y-6">

            {/* Header */}
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Institute Admins</h1>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
                  {loading ? '...' : `${admins.length} admin${admins.length !== 1 ? 's' : ''} managing your institute`}
                </p>
              </div>
              <button onClick={load} className="p-2 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-slate-100 dark:hover:bg-white/5 transition-colors" title="Refresh">
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              </button>
            </div>

            {/* Search + Add */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="relative w-full max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search admins..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-transparent border border-slate-200 dark:border-gray-800 rounded-lg text-sm focus:outline-none focus:border-indigo-500 transition-all dark:text-white placeholder-slate-400 shadow-sm"
                />
              </div>
              <button
                onClick={() => setShowAddModal(true)}
                className="flex w-full sm:w-auto items-center justify-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 dark:bg-[#7C3AED] dark:hover:bg-[#6D28D9] text-white rounded-lg text-sm font-medium transition-colors shadow-sm"
              >
                <Plus className="w-4 h-4" />
                Add Admin
              </button>
            </div>

            {/* Table */}
            <div className="bg-white dark:bg-[#15141B] border border-slate-200 dark:border-[#26252D] rounded-xl shadow-sm overflow-hidden">
              {loading ? (
                <div className="py-16 flex justify-center">
                  <Loader2 className="w-6 h-6 animate-spin text-indigo-500" />
                </div>
              ) : filteredAdmins.length === 0 ? (
                <div className="py-12 text-center">
                  <ShieldCheck className="w-12 h-12 text-slate-200 dark:text-slate-700 mx-auto mb-3" />
                  <p className="text-slate-500 dark:text-gray-500 text-sm">
                    {searchQuery ? `No admins matching "${searchQuery}"` : 'No admins yet. Add one to get started.'}
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-slate-100 dark:border-[#26252D] bg-slate-50/70 dark:bg-white/[0.02]">
                        <th className="text-left px-5 py-3 text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider w-[40%]">Admin</th>
                        <th className="text-left px-4 py-3 text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Email</th>
                        <th className="text-left px-4 py-3 text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Added On</th>
                        <th className="text-center px-4 py-3 text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Role</th>
                        <th className="px-4 py-3 w-10" />
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-[#26252D]">
                      {filteredAdmins.map((admin) => (
                        <tr key={admin.id} className="hover:bg-slate-50 dark:hover:bg-white/[0.025] transition-colors group">

                          {/* Admin Info */}
                          <td className="px-5 py-4">
                            <div className="flex items-center gap-3">
                              {admin.profileImage ? (
                                <img src={admin.profileImage} alt="" className="w-9 h-9 rounded-full object-cover shrink-0" />
                              ) : (
                                <div className="w-9 h-9 rounded-full bg-indigo-100 dark:bg-[#2D1F4D] text-indigo-700 dark:text-[#D97CFF] flex items-center justify-center text-sm font-bold shrink-0">
                                  {getInitials(admin.name, admin.email)}
                                </div>
                              )}
                              <div>
                                <p className="font-semibold text-[13.5px] text-slate-900 dark:text-gray-100">
                                  {admin.name ?? <span className="text-slate-400 italic font-normal">No name yet</span>}
                                </p>
                              </div>
                            </div>
                          </td>

                          {/* Email */}
                          <td className="px-4 py-4">
                            <span className="text-[12.5px] text-slate-600 dark:text-slate-300">{admin.email}</span>
                          </td>

                          {/* Added On */}
                          <td className="px-4 py-4">
                            <span className="text-[12px] text-slate-500 dark:text-slate-400 whitespace-nowrap">{formatDate(admin.addedAt)}</span>
                          </td>

                          {/* Role Badge */}
                          <td className="px-4 py-4 text-center">
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold tracking-wider bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300">
                              <ShieldCheck className="w-3 h-3" /> ADMIN
                            </span>
                          </td>

                          {/* Actions */}
                          <td className="px-4 py-4">
                            <AdminRowMenu onRemove={() => setRemoveTarget(admin)} />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

          </div>
        </main>
      </div>
    </div>
  );
}
