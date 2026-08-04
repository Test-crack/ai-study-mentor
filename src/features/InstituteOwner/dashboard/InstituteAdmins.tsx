// src/features/InstituteOwner/dashboard/InstituteAdmins.tsx
import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Search, Plus, Loader2, RefreshCw, X,
  Mail, User, CheckCircle2, Trash2, ShieldCheck,
  MoreVertical, Sparkles,
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
        className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-white/[0.06] text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
      >
        <MoreVertical className="w-4 h-4" />
      </button>
      {open && (
        <div className="absolute right-0 top-full mt-1 z-30 w-44 bg-white dark:bg-[#1a1a20] border border-slate-200/70 dark:border-white/[0.08] rounded-xl shadow-xl ring-1 ring-black/[0.03] py-1 overflow-hidden">
          <button
            onClick={() => { setOpen(false); onRemove(); }}
            className="w-full flex items-center gap-2.5 px-3.5 py-2.5 text-sm font-medium text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-500/10 transition-colors"
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
      <div className="bg-white dark:bg-[#131318] rounded-2xl shadow-2xl w-full max-w-md border border-slate-200/70 dark:border-white/[0.08] overflow-hidden">

        {/* Header */}
        <div className="relative flex items-center justify-between px-6 py-5 border-b border-slate-100 dark:border-white/[0.06] bg-gradient-to-r from-[#eff4ff] to-[#f3f0ff] dark:from-[#111827] dark:to-[#1e1b4b]">
          <div aria-hidden className="pointer-events-none absolute -top-10 -right-8 w-32 h-32 rounded-full bg-brand-teal-300/25 dark:bg-brand-teal-500/15 blur-2xl" />
          <div className="relative flex items-center gap-3">
            <div className="p-2 bg-white/70 dark:bg-white/[0.08] backdrop-blur rounded-xl shadow-sm">
              <ShieldCheck className="w-5 h-5 text-brand-teal-600 dark:text-brand-teal-400" />
            </div>
            <div>
              <h2 className="font-bold tracking-tight text-slate-900 dark:text-white text-base">Add Institute Admin</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Admin will receive an email invite to set their password</p>
            </div>
          </div>
          <button onClick={onClose} className="relative p-2 rounded-lg hover:bg-white/60 dark:hover:bg-white/[0.08] transition-colors text-slate-400">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          <div className="space-y-1.5">
            <label className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Full Name *</label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text" required value={form.adminName} onChange={set('adminName')}
                placeholder="Admin full name"
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-white/[0.04] border border-slate-200/70 dark:border-white/[0.08] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-teal-500/30 focus:border-brand-teal-400 dark:focus:border-brand-teal-500/40 dark:text-white placeholder-slate-400 transition-colors"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Email Address *</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="email" required value={form.adminEmail} onChange={set('adminEmail')}
                placeholder="admin@institute.com"
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-white/[0.04] border border-slate-200/70 dark:border-white/[0.08] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-teal-500/30 focus:border-brand-teal-400 dark:focus:border-brand-teal-500/40 dark:text-white placeholder-slate-400 transition-colors"
              />
            </div>
          </div>

          <div className="flex items-start gap-2 bg-brand-teal-50/80 dark:bg-brand-teal-500/[0.07] ring-1 ring-inset ring-brand-teal-600/10 dark:ring-brand-teal-400/15 rounded-xl p-3.5">
            <CheckCircle2 className="w-4 h-4 text-brand-teal-500 mt-0.5 shrink-0" />
            <p className="text-xs text-brand-teal-700 dark:text-brand-teal-300 leading-relaxed">
              The admin will receive a Supabase invite email. Once they accept and set a password, they'll have access to the Institute Admin dashboard.
            </p>
          </div>

          <div className="flex gap-3 pt-1">
            <button type="button" onClick={onClose}
              className="flex-1 py-2.5 rounded-xl border border-slate-200/70 dark:border-white/[0.08] text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-white/[0.04] transition-colors">
              Cancel
            </button>
            <button type="submit" disabled={loading}
              className="flex-1 py-2.5 rounded-xl bg-brand-teal-600 hover:bg-brand-teal-700 dark:bg-brand-teal-500 dark:hover:bg-brand-teal-600 text-white text-sm font-semibold transition-all shadow-sm hover:shadow flex items-center justify-center gap-2 disabled:opacity-60">
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
      <div className="bg-white dark:bg-[#131318] rounded-2xl shadow-2xl w-full max-w-sm border border-slate-200/70 dark:border-white/[0.08] p-6 space-y-5">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-rose-50 dark:bg-rose-500/10 rounded-xl ring-1 ring-inset ring-rose-600/10 dark:ring-rose-400/20">
            <Trash2 className="w-5 h-5 text-rose-600 dark:text-rose-400" />
          </div>
          <div>
            <h3 className="font-bold tracking-tight text-slate-900 dark:text-white">Remove Admin?</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{admin.name ?? admin.email}</p>
          </div>
        </div>
        <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
          This will remove <strong className="text-slate-800 dark:text-slate-200">{admin.email}</strong> as an admin and downgrade their account to a regular student. This action can be undone by re-inviting them.
        </p>
        <div className="flex gap-3">
          <button onClick={onCancel} className="flex-1 py-2.5 rounded-xl border border-slate-200/70 dark:border-white/[0.08] text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-white/[0.04] transition-colors">
            Cancel
          </button>
          <button onClick={onConfirm} disabled={loading}
            className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-sm font-semibold transition-all shadow-sm hover:shadow flex items-center justify-center gap-2 disabled:opacity-60">
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
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-[#0a0a0a] font-sans text-slate-900 dark:text-slate-200 transition-colors duration-300">

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
          <div className="max-w-[1200px] mx-auto">

            {/* ── Hero Banner ─────────────────────────────────────────────── */}
            <section className="relative overflow-hidden rounded-2xl sm:rounded-3xl border border-brand-teal-100/80 dark:border-white/[0.06] bg-gradient-to-r from-[#eff4ff] via-[#f4f1ff] to-[#f3f0ff] dark:from-[#111827] dark:via-[#161a38] dark:to-[#1e1b4b] px-5 sm:px-8 pt-6 sm:pt-8 pb-16 sm:pb-20 shadow-sm">
              <div aria-hidden className="pointer-events-none select-none absolute inset-0">
                <div className="absolute -top-20 -right-12 w-64 h-64 rounded-full bg-brand-teal-300/25 dark:bg-brand-teal-500/15 blur-3xl" />
                <div className="absolute -bottom-28 left-1/3 w-72 h-72 rounded-full bg-brand-blue-300/20 dark:bg-brand-blue-500/10 blur-3xl" />
              </div>

              <div className="relative flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                <div>
                  <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-brand-teal-600 dark:text-brand-teal-300 bg-white/60 dark:bg-white/[0.06] border border-white/70 dark:border-white/[0.08] backdrop-blur px-2.5 py-1 rounded-full">
                    <Sparkles className="w-3 h-3" /> Owner Portal
                  </span>
                  <h1 className="mt-3 text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
                    Institute <span className="text-brand-teal-600 dark:text-brand-teal-400">Admins</span>
                  </h1>
                  <p className="mt-1.5 text-sm text-slate-500 dark:text-slate-400">
                    {loading ? '...' : `${admins.length} admin${admins.length !== 1 ? 's' : ''} managing your institute`}
                  </p>
                </div>

                <button
                  onClick={load}
                  className="self-start shrink-0 inline-flex items-center gap-1.5 text-xs font-medium text-slate-600 dark:text-slate-300 bg-white/70 dark:bg-white/[0.06] hover:bg-white dark:hover:bg-white/[0.12] border border-white/70 dark:border-white/[0.08] backdrop-blur px-3.5 py-2 rounded-full shadow-sm transition-all"
                  title="Refresh"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} /> Refresh
                </button>
              </div>
            </section>

            {/* ── Toolbar (overlaps hero) ─────────────────────────────────── */}
            <div className="relative z-10 -mt-8 sm:-mt-10 rounded-2xl bg-white/85 dark:bg-[#131318]/90 backdrop-blur-xl border border-white/20 dark:border-white/[0.08] ring-1 ring-slate-900/[0.05] dark:ring-0 shadow-sm p-3.5 sm:p-4 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search admins..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-white/[0.04] border border-slate-200/70 dark:border-white/[0.08] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-teal-500/30 focus:border-brand-teal-300 dark:focus:border-brand-teal-500/40 transition-colors dark:text-white placeholder-slate-400"
                />
              </div>
              <button
                onClick={() => setShowAddModal(true)}
                className="flex w-full sm:w-auto items-center justify-center gap-2 px-4 py-2.5 bg-brand-teal-600 hover:bg-brand-teal-700 dark:bg-brand-teal-500 dark:hover:bg-brand-teal-600 text-white rounded-xl text-sm font-semibold transition-all shadow-sm hover:shadow"
              >
                <Plus className="w-4 h-4" />
                Add Admin
              </button>
            </div>

            {/* ── Table ───────────────────────────────────────────────────── */}
            <div className="mt-6 rounded-2xl bg-white dark:bg-[#131318] border border-slate-200/70 dark:border-white/[0.08] shadow-sm overflow-hidden">
              {loading ? (
                <div className="py-16 flex justify-center">
                  <Loader2 className="w-6 h-6 animate-spin text-brand-teal-500" />
                </div>
              ) : filteredAdmins.length === 0 ? (
                <div className="py-14 text-center">
                  <div className="w-14 h-14 rounded-2xl bg-slate-50 dark:bg-white/[0.04] flex items-center justify-center mx-auto mb-4">
                    <ShieldCheck className="w-7 h-7 text-slate-300 dark:text-slate-600" />
                  </div>
                  <p className="text-slate-500 dark:text-slate-400 text-sm">
                    {searchQuery ? `No admins matching "${searchQuery}"` : 'No admins yet. Add one to get started.'}
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-slate-100 dark:border-white/[0.06] bg-slate-50/60 dark:bg-white/[0.02]">
                        <th className="text-left px-5 sm:px-6 py-2.5 text-[10px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-[0.12em] w-[40%]">Admin</th>
                        <th className="text-left px-4 py-2.5 text-[10px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-[0.12em]">Email</th>
                        <th className="text-left px-4 py-2.5 text-[10px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-[0.12em]">Added On</th>
                        <th className="text-center px-4 py-2.5 text-[10px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-[0.12em]">Role</th>
                        <th className="px-4 py-2.5 w-10" />
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50 dark:divide-white/[0.04]">
                      {filteredAdmins.map((admin) => (
                        <tr key={admin.id} className="hover:bg-slate-50 dark:hover:bg-white/[0.03] transition-colors group">

                          {/* Admin Info */}
                          <td className="px-5 sm:px-6 py-3">
                            <div className="flex items-center gap-3">
                              {admin.profileImage ? (
                                <img src={admin.profileImage} alt="" className="w-9 h-9 rounded-full object-cover shrink-0 ring-1 ring-slate-200/70 dark:ring-white/10" />
                              ) : (
                                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-brand-teal-100 to-brand-blue-100 dark:from-brand-teal-500/20 dark:to-brand-blue-500/20 ring-1 ring-brand-teal-200/60 dark:ring-brand-teal-500/20 text-brand-teal-600 dark:text-brand-teal-400 flex items-center justify-center text-sm font-bold shrink-0">
                                  {getInitials(admin.name, admin.email)}
                                </div>
                              )}
                              <div>
                                <p className="font-medium text-[13px] text-slate-900 dark:text-slate-100">
                                  {admin.name ?? <span className="text-slate-400 italic font-normal">No name yet</span>}
                                </p>
                              </div>
                            </div>
                          </td>

                          {/* Email */}
                          <td className="px-4 py-3">
                            <span className="text-xs text-slate-600 dark:text-slate-300">{admin.email}</span>
                          </td>

                          {/* Added On */}
                          <td className="px-4 py-3">
                            <span className="text-xs tabular-nums text-slate-500 dark:text-slate-400 whitespace-nowrap">{formatDate(admin.addedAt)}</span>
                          </td>

                          {/* Role Badge */}
                          <td className="px-4 py-3 text-center">
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold tracking-wider bg-brand-teal-50 text-brand-teal-700 dark:bg-brand-teal-500/10 dark:text-brand-teal-400 ring-1 ring-inset ring-brand-teal-600/20 dark:ring-brand-teal-400/25">
                              <ShieldCheck className="w-3 h-3" /> ADMIN
                            </span>
                          </td>

                          {/* Actions */}
                          <td className="px-4 py-3">
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