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
        className="h-10 w-10 grid place-items-center rounded-lg hover:bg-brand-bg-alt text-brand-text-mute hover:text-brand-text transition-colors"
      >
        <MoreVertical className="w-4 h-4" />
      </button>
      {open && (
        <div className="absolute right-0 top-full mt-1 z-30 w-44 bg-white border border-brand-line rounded-xl shadow-sm py-1 overflow-hidden">
          <button
            onClick={() => { setOpen(false); onRemove(); }}
            className="w-full flex items-center gap-2.5 px-3.5 py-3 text-sm font-medium text-rose-600 hover:bg-rose-50 transition-colors"
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
      <div className="bg-white rounded-2xl shadow-sm w-full max-w-md border border-brand-line overflow-hidden max-h-[90vh] overflow-y-auto">

        {/* Header */}
        <div className="relative flex items-center justify-between gap-3 px-4 sm:px-6 py-5 border-b border-brand-line bg-brand-bg-alt">
          <div className="relative flex items-center gap-3 min-w-0">
            <div className="p-2 bg-brand-teal-50 rounded-xl">
              <ShieldCheck className="w-5 h-5 text-brand-teal-600" />
            </div>
            <div className="min-w-0">
              <h2 className="font-bold tracking-tight text-brand-text text-base">Add Institute Admin</h2>
              <p className="text-xs text-brand-text-mute mt-0.5">Admin will receive an email invite to set their password</p>
            </div>
          </div>
          <button onClick={onClose} className="relative shrink-0 h-10 w-10 grid place-items-center rounded-lg hover:bg-white transition-colors text-brand-text-mute">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-5">
          <div className="space-y-1.5">
            <label className="font-jetbrains text-[10px] font-bold text-brand-text-mute uppercase tracking-[0.15em]">Full Name *</label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-brand-text-mute" />
              <input
                type="text" required value={form.adminName} onChange={set('adminName')}
                placeholder="Admin full name"
                className="w-full pl-10 pr-4 py-3 bg-brand-bg-alt border border-brand-line rounded-xl text-sm text-brand-text focus:outline-none focus:ring-2 focus:ring-brand-teal-500/30 focus:border-brand-teal-400 placeholder-brand-text-mute transition-colors"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="font-jetbrains text-[10px] font-bold text-brand-text-mute uppercase tracking-[0.15em]">Email Address *</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-brand-text-mute" />
              <input
                type="email" required value={form.adminEmail} onChange={set('adminEmail')}
                placeholder="admin@institute.com"
                className="w-full pl-10 pr-4 py-3 bg-brand-bg-alt border border-brand-line rounded-xl text-sm text-brand-text focus:outline-none focus:ring-2 focus:ring-brand-teal-500/30 focus:border-brand-teal-400 placeholder-brand-text-mute transition-colors"
              />
            </div>
          </div>

          <div className="flex items-start gap-2 bg-brand-teal-50 ring-1 ring-inset ring-brand-teal-600/10 rounded-xl p-3.5">
            <CheckCircle2 className="w-4 h-4 text-brand-teal-500 mt-0.5 shrink-0" />
            <p className="text-xs text-brand-teal-700 leading-relaxed">
              The admin will receive a Supabase invite email. Once they accept and set a password, they'll have access to the Institute Admin dashboard.
            </p>
          </div>

          <div className="flex gap-3 pt-1">
            <button type="button" onClick={onClose}
              className="flex-1 min-h-[44px] py-2.5 rounded-xl border border-brand-line text-sm font-medium text-brand-text hover:bg-brand-bg-alt transition-colors">
              Cancel
            </button>
            <button type="submit" disabled={loading}
              className="flex-1 min-h-[44px] py-2.5 rounded-xl bg-brand-teal-600 hover:bg-brand-teal-700 text-white text-sm font-semibold transition-all shadow-sm flex items-center justify-center gap-2 disabled:opacity-60">
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
      <div className="bg-white rounded-2xl shadow-sm w-full max-w-sm border border-brand-line p-4 sm:p-6 space-y-5 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-rose-50 rounded-xl ring-1 ring-inset ring-rose-600/10">
            <Trash2 className="w-5 h-5 text-rose-600" />
          </div>
          <div className="min-w-0">
            <h3 className="font-bold tracking-tight text-brand-text">Remove Admin?</h3>
            <p className="text-xs text-brand-text-mute mt-0.5 truncate">{admin.name ?? admin.email}</p>
          </div>
        </div>
        <p className="text-sm text-brand-text-mute leading-relaxed">
          This will remove <strong className="text-brand-text">{admin.email}</strong> as an admin and downgrade their account to a regular student. This action can be undone by re-inviting them.
        </p>
        <div className="flex gap-3">
          <button onClick={onCancel} className="flex-1 min-h-[44px] py-2.5 rounded-xl border border-brand-line text-sm font-medium text-brand-text hover:bg-brand-bg-alt transition-colors">
            Cancel
          </button>
          <button onClick={onConfirm} disabled={loading}
            className="flex-1 min-h-[44px] py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-sm font-semibold transition-all shadow-sm flex items-center justify-center gap-2 disabled:opacity-60">
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
    <div className="relative min-h-screen font-plex antialiased overflow-x-hidden bg-brand-bg text-brand-text">

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
      <InstituteOwnerSidebar
        activeTab="admins"
        isCollapsed={isSidebarCollapsed}
        toggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
      />

      <div className={`relative z-10 transition-all duration-300 ${isSidebarCollapsed ? 'lg:pl-24' : 'lg:pl-72'}`}>
        <InstituteOwnerTopbar />

        <main className="px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6 max-w-[90rem] mx-auto pb-16">
          <div>

            {/* ── Hero Banner ─────────────────────────────────────────────── */}
            <section className="relative overflow-hidden rounded-2xl sm:rounded-3xl border border-brand-line-16 bg-brand-ink-deep text-white p-6 sm:p-8 shadow-sm">
              <div className="relative flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                <div className="min-w-0">
                  <span className="font-jetbrains inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.2em] text-brand-on-ink-mute bg-white/5 border border-brand-line-12 px-2.5 py-1 rounded-full">
                    <Sparkles className="w-3 h-3" /> Owner Portal
                  </span>
                  <h1 className="font-manrope mt-3 text-2xl sm:text-3xl font-black tracking-tight text-white">
                    Institute <span className="text-brand-mint">Admins</span>
                  </h1>
                  <p className="mt-1.5 text-sm text-brand-on-ink">
                    {loading ? '...' : `${admins.length} admin${admins.length !== 1 ? 's' : ''} managing your institute`}
                  </p>
                </div>

                <button
                  onClick={load}
                  className="self-start shrink-0 inline-flex items-center gap-1.5 min-h-[40px] text-xs font-bold text-brand-on-ink bg-white/5 hover:bg-white/10 border border-brand-line-12 px-4 py-2 rounded-full transition-all"
                  title="Refresh"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} /> Refresh
                </button>
              </div>
            </section>

            {/* ── Toolbar ─────────────────────────────────────────────────── */}
            <div className="mt-6 rounded-2xl bg-white border border-brand-line shadow-sm p-4 sm:p-5 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
              <div className="relative flex-1 sm:max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-brand-text-mute" />
                <input
                  type="text"
                  placeholder="Search admins..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-brand-bg-alt border border-brand-line rounded-xl text-sm text-brand-text focus:outline-none focus:ring-2 focus:ring-brand-teal-500/30 focus:border-brand-teal-300 transition-colors placeholder-brand-text-mute"
                />
              </div>
              <button
                onClick={() => setShowAddModal(true)}
                className="flex w-full sm:w-auto min-h-[44px] items-center justify-center gap-2 px-4 py-2.5 bg-brand-teal-600 hover:bg-brand-teal-700 text-white rounded-xl text-sm font-semibold transition-all shadow-sm"
              >
                <Plus className="w-4 h-4" />
                Add Admin
              </button>
            </div>

            {/* ── Table ───────────────────────────────────────────────────── */}
            <div className="mt-6 rounded-2xl bg-white border border-brand-line shadow-sm overflow-hidden">
              {loading ? (
                <div className="py-16 flex justify-center">
                  <Loader2 className="w-6 h-6 animate-spin text-brand-teal-500" />
                </div>
              ) : filteredAdmins.length === 0 ? (
                <div className="py-14 px-4 text-center">
                  <div className="w-14 h-14 rounded-2xl bg-brand-bg-alt flex items-center justify-center mx-auto mb-4">
                    <ShieldCheck className="w-7 h-7 text-brand-text-mute" />
                  </div>
                  <p className="text-brand-text-mute text-sm">
                    {searchQuery ? `No admins matching "${searchQuery}"` : 'No admins yet. Add one to get started.'}
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-brand-line bg-brand-bg-alt">
                        <th className="font-jetbrains text-left px-4 sm:px-6 py-3 text-[10px] font-bold text-brand-text-mute uppercase tracking-[0.15em] w-[40%]">Admin</th>
                        <th className="font-jetbrains text-left px-4 py-3 text-[10px] font-bold text-brand-text-mute uppercase tracking-[0.15em]">Email</th>
                        <th className="font-jetbrains text-left px-4 py-3 text-[10px] font-bold text-brand-text-mute uppercase tracking-[0.15em]">Added On</th>
                        <th className="font-jetbrains text-center px-4 py-3 text-[10px] font-bold text-brand-text-mute uppercase tracking-[0.15em]">Role</th>
                        <th className="px-4 py-3 w-10" />
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-brand-line">
                      {filteredAdmins.map((admin) => (
                        <tr key={admin.id} className="hover:bg-brand-bg-alt transition-colors group">

                          {/* Admin Info */}
                          <td className="px-4 sm:px-6 py-3">
                            <div className="flex items-center gap-3">
                              {admin.profileImage ? (
                                <img src={admin.profileImage} alt="" className="w-9 h-9 rounded-full object-cover shrink-0 ring-1 ring-brand-line" />
                              ) : (
                                <div className="w-9 h-9 rounded-full bg-brand-teal-50 ring-1 ring-brand-teal-200 text-brand-teal-600 flex items-center justify-center text-sm font-bold shrink-0">
                                  {getInitials(admin.name, admin.email)}
                                </div>
                              )}
                              <div>
                                <p className="font-medium text-[13px] text-brand-text whitespace-nowrap">
                                  {admin.name ?? <span className="text-brand-text-mute italic font-normal">No name yet</span>}
                                </p>
                              </div>
                            </div>
                          </td>

                          {/* Email */}
                          <td className="px-4 py-3">
                            <span className="text-xs text-brand-text whitespace-nowrap">{admin.email}</span>
                          </td>

                          {/* Added On */}
                          <td className="px-4 py-3">
                            <span className="text-xs tabular-nums text-brand-text-mute whitespace-nowrap">{formatDate(admin.addedAt)}</span>
                          </td>

                          {/* Role Badge */}
                          <td className="px-4 py-3 text-center">
                            <span className="font-jetbrains inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold tracking-[0.15em] bg-brand-teal-50 text-brand-teal-700 ring-1 ring-inset ring-brand-teal-600/20">
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