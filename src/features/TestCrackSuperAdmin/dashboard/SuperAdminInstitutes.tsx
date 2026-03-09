import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Search, Plus, Building2, Mail, User, MapPin,
  Loader2, RefreshCw, X, CheckCircle2, MoreVertical,
  GraduationCap, BookOpen, PowerOff, Zap
} from 'lucide-react';
import { SuperAdminSidebar } from '../Components/SuperadminSidebar';
import { SuperAdminTopbar } from '../Components/Superadmintopbar';
import {
  fetchInstitutes, createInstitute, toggleInstituteStatus, updateInstitute,
  InstituteRecord
} from '../services/superadminService';
import { useToast } from '@/shared/hooks/use-toast';

// ─── Helpers ──────────────────────────────────────────────────────────────────

const getInitials = (name: string) =>
  name.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase();

const formatDate = (iso: string) => {
  try { return new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }); }
  catch { return '—'; }
};

// ─── Three-dot Menu ───────────────────────────────────────────────────────────

interface InstituteMenuProps {
  institute: InstituteRecord;
  onToggleStatus: (id: string, isActive: boolean) => Promise<void>;
  onEdit: (institute: InstituteRecord) => void;
}

function InstituteMenu({ institute, onToggleStatus, onEdit }: InstituteMenuProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    if (open) document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  const handleToggle = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setLoading(true);
    setOpen(false);
    await onToggleStatus(institute.id, !institute.isActive);
    setLoading(false);
  };

  return (
    <div ref={menuRef} className="relative" onClick={(e) => e.stopPropagation()}>
      <button
        onClick={(e) => { e.stopPropagation(); setOpen(v => !v); }}
        className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-white/10 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
        title="Options"
      >
        {loading
          ? <Loader2 className="w-4 h-4 animate-spin" />
          : <MoreVertical className="w-4 h-4" />}
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-1 z-30 w-44 bg-white dark:bg-[#1E1D27] border border-slate-200 dark:border-[#2E2D3A] rounded-xl shadow-xl py-1 overflow-hidden">
          <button
            onClick={(e) => { e.stopPropagation(); setOpen(false); onEdit(institute); }}
            className="w-full flex items-center gap-2.5 px-3.5 py-2.5 text-sm font-medium transition-colors text-slate-700 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-white/5"
          >
            <Building2 className="w-4 h-4" /> Edit Details
          </button>
          <div className="h-px w-full bg-slate-100 dark:bg-[#2E2D3A] my-0.5" />
          <button
            onClick={handleToggle}
            className={`w-full flex items-center gap-2.5 px-3.5 py-2.5 text-sm font-medium transition-colors ${
              institute.isActive
                ? 'text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-900/20'
                : 'text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-900/20'
            }`}
          >
            {institute.isActive
              ? <><PowerOff className="w-4 h-4" /> Deactivate</>
              : <><Zap className="w-4 h-4" /> Activate</>}
          </button>
        </div>
      )}
    </div>
  );
}

// ─── Create Institute Modal ───────────────────────────────────────────────────

interface CreateModalProps {
  onClose: () => void;
  onCreated: () => void;
}

function CreateInstituteModal({ onClose, onCreated }: CreateModalProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    instituteName: '',
    address: '',
    ownerName: '',
    ownerEmail: '',
  });

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm(prev => ({ ...prev, [k]: e.target.value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.instituteName.trim() || !form.ownerName.trim() || !form.ownerEmail.trim()) return;
    setLoading(true);
    try {
      const res = await createInstitute({
        instituteName: form.instituteName,
        address:       form.address || undefined,
        ownerName:     form.ownerName,
        ownerEmail:    form.ownerEmail,
      });
      toast({
        title: '✅ Institute Created',
        description: res.data.inviteEmailSent
          ? `Invite email sent to ${res.data.owner.email}`
          : `Institute created. Email invite could not be sent — check Supabase logs.`,
      });
      onCreated();
      onClose();
    } catch (err: any) {
      toast({ title: 'Failed to create institute', description: err.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white dark:bg-[#15141B] rounded-2xl shadow-2xl w-full max-w-lg border border-slate-200 dark:border-[#26252D]">
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100 dark:border-[#26252D]">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-50 dark:bg-indigo-900/30 rounded-lg">
              <Building2 className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            </div>
            <div>
              <h2 className="font-bold text-slate-900 dark:text-white text-base">Add New Institute</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Owner will receive an invite email to set their password</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-white/10 transition-colors text-slate-400">
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider">Institute Name *</label>
            <div className="relative">
              <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input type="text" required value={form.instituteName} onChange={set('instituteName')} placeholder="e.g. Ace English Academy"
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-[#0A0A0B] border border-slate-200 dark:border-[#26252D] rounded-lg text-sm focus:outline-none focus:border-indigo-500 dark:text-white placeholder-slate-400" />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider">Address <span className="text-slate-400 normal-case font-normal">(optional)</span></label>
            <div className="relative">
              <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input type="text" value={form.address} onChange={set('address')} placeholder="City, State"
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-[#0A0A0B] border border-slate-200 dark:border-[#26252D] rounded-lg text-sm focus:outline-none focus:border-indigo-500 dark:text-white placeholder-slate-400" />
            </div>
          </div>

          <div className="border-t border-slate-100 dark:border-[#26252D] pt-1">
            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-4">Institute Owner Account</p>
            <div className="space-y-1.5 mb-4">
              <label className="text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider">Owner Name *</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input type="text" required value={form.ownerName} onChange={set('ownerName')} placeholder="Full name"
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-[#0A0A0B] border border-slate-200 dark:border-[#26252D] rounded-lg text-sm focus:outline-none focus:border-indigo-500 dark:text-white placeholder-slate-400" />
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider">Owner Email *</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input type="email" required value={form.ownerEmail} onChange={set('ownerEmail')} placeholder="owner@institute.com"
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-[#0A0A0B] border border-slate-200 dark:border-[#26252D] rounded-lg text-sm focus:outline-none focus:border-indigo-500 dark:text-white placeholder-slate-400" />
              </div>
            </div>
          </div>

          <div className="flex items-start gap-2 bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-100 dark:border-indigo-800/40 rounded-lg p-3">
            <CheckCircle2 className="w-4 h-4 text-indigo-500 mt-0.5 shrink-0" />
            <p className="text-xs text-indigo-700 dark:text-indigo-300 leading-relaxed">
              An invite email will be sent to the owner's email address. They'll click the link to set their password and access the Institute Owner dashboard.
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
              {loading ? 'Creating...' : 'Create & Send Invite'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Edit Institute Modal ─────────────────────────────────────────────────────

interface EditModalProps {
  institute: InstituteRecord;
  onClose: () => void;
  onUpdated: () => void;
}

function EditInstituteModal({ institute, onClose, onUpdated }: EditModalProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    name: institute.name,
    address: institute.address || '',
    logoUrl: institute.logoUrl || '',
  });

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm(prev => ({ ...prev, [k]: e.target.value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) return;
    setLoading(true);
    try {
      await updateInstitute(institute.id, {
        name: form.name,
        address: form.address,
        logoUrl: form.logoUrl, // Could support file upload here later, static text for now
      });
      toast({
        title: '✅ Institute Updated',
        description: 'Institute details have been successfully updated.',
      });
      onUpdated();
      onClose();
    } catch (err: any) {
      toast({ title: 'Failed to update institute', description: err.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white dark:bg-[#15141B] rounded-2xl shadow-2xl w-full max-w-md border border-slate-200 dark:border-[#26252D]">
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100 dark:border-[#26252D]">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-50 dark:bg-indigo-900/30 rounded-lg">
              <Building2 className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            </div>
            <div>
              <h2 className="font-bold text-slate-900 dark:text-white text-base">Edit Institute</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Update profile information</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-white/10 transition-colors text-slate-400">
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider">Institute Name *</label>
            <div className="relative">
              <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input type="text" required value={form.name} onChange={set('name')} placeholder="e.g. Ace English Academy"
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-[#0A0A0B] border border-slate-200 dark:border-[#26252D] rounded-lg text-sm focus:outline-none focus:border-indigo-500 dark:text-white placeholder-slate-400" />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider">Address</label>
            <div className="relative">
              <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input type="text" value={form.address} onChange={set('address')} placeholder="City, State"
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-[#0A0A0B] border border-slate-200 dark:border-[#26252D] rounded-lg text-sm focus:outline-none focus:border-indigo-500 dark:text-white placeholder-slate-400" />
            </div>
          </div>

          <div className="flex gap-3 pt-4 border-t border-slate-100 dark:border-[#26252D]">
            <button type="button" onClick={onClose}
              className="flex-1 py-2.5 rounded-lg border border-slate-200 dark:border-[#26252D] text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-white/5 transition-colors">
              Cancel
            </button>
            <button type="submit" disabled={loading}
              className="flex-1 py-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold transition-colors flex items-center justify-center gap-2 disabled:opacity-60">
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
              {loading ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function SuperAdminInstitutes() {
  const { toast } = useToast();
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [institutes, setInstitutes] = useState<InstituteRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingInstitute, setEditingInstitute] = useState<InstituteRecord | null>(null);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(searchQuery), 400);
    return () => clearTimeout(t);
  }, [searchQuery]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetchInstitutes(debouncedSearch || undefined);
      setInstitutes(res.data);
    } catch (err: any) {
      toast({ title: 'Failed to load institutes', description: err.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  }, [debouncedSearch, toast]);

  useEffect(() => { load(); }, [load]);

  const handleToggleStatus = async (id: string, isActive: boolean) => {
    setInstitutes(prev => prev.map(inst => inst.id === id ? { ...inst, isActive } : inst));
    try {
      await toggleInstituteStatus(id, isActive);
      toast({
        title: isActive ? '✅ Institute Activated' : '🔴 Institute Deactivated',
        description: isActive ? 'The institute is now active.' : 'The institute has been deactivated.',
      });
    } catch (err: any) {
      setInstitutes(prev => prev.map(inst => inst.id === id ? { ...inst, isActive: !isActive } : inst));
      toast({ title: 'Failed to update status', description: err.message, variant: 'destructive' });
    }
  };

  const activeCount   = institutes.filter(i => i.isActive).length;
  const inactiveCount = institutes.filter(i => !i.isActive).length;

  return (
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-[#0B0A10] font-sans text-slate-900 dark:text-slate-200 transition-colors duration-300">

      {showCreateModal && (
        <CreateInstituteModal onClose={() => setShowCreateModal(false)} onCreated={load} />
      )}

      {editingInstitute && (
        <EditInstituteModal institute={editingInstitute} onClose={() => setEditingInstitute(null)} onUpdated={load} />
      )}

      <div className="hidden lg:block">
        <SuperAdminSidebar
          activeTab="institutes"
          isCollapsed={isSidebarCollapsed}
          toggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
        />
      </div>

      <div className={`transition-all duration-300 flex flex-col min-h-screen ${isSidebarCollapsed ? 'lg:pl-20' : 'lg:pl-64'}`}>
        <SuperAdminTopbar />

        <main className="flex-1 p-4 sm:p-6 lg:p-8">
          <div className="max-w-[1400px] mx-auto space-y-6">

            {/* Header */}
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Institutes</h1>
                {!loading && (
                  <div className="flex items-center gap-3 mt-1">
                    <span className="text-sm text-slate-500 dark:text-slate-400">{institutes.length} total</span>
                    {activeCount > 0 && (
                      <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">
                        {activeCount} active
                      </span>
                    )}
                    {inactiveCount > 0 && (
                      <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400">
                        {inactiveCount} inactive
                      </span>
                    )}
                  </div>
                )}
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
                  placeholder="Search institutes..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-transparent border border-slate-200 dark:border-gray-800 rounded-lg text-sm focus:outline-none focus:border-indigo-500 transition-all dark:text-white placeholder-slate-400 shadow-sm"
                />
              </div>
              <button
                onClick={() => setShowCreateModal(true)}
                className="flex w-full sm:w-auto items-center justify-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 dark:bg-[#7C3AED] dark:hover:bg-[#6D28D9] text-white rounded-lg text-sm font-medium transition-colors shadow-sm"
              >
                <Plus className="w-4 h-4" />
                Add Institute
              </button>
            </div>

            {/* Table */}
            <div className="bg-white dark:bg-[#15141B] border border-slate-200 dark:border-[#26252D] rounded-xl shadow-sm overflow-hidden">
              {loading ? (
                <div className="py-16 flex justify-center">
                  <Loader2 className="w-6 h-6 animate-spin text-indigo-500" />
                </div>
              ) : institutes.length === 0 ? (
                <div className="py-12 text-center text-slate-500 dark:text-gray-500 text-sm">
                  {debouncedSearch ? `No institutes matching "${debouncedSearch}"` : 'No institutes yet. Click "Add Institute" to create one.'}
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    {/* Table Header */}
                    <thead>
                      <tr className="border-b border-slate-100 dark:border-[#26252D] bg-slate-50/70 dark:bg-white/[0.02]">
                        <th className="text-left px-5 py-3 text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider w-[35%]">
                          Institute
                        </th>
                        <th className="text-left px-4 py-3 text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                          Owner
                        </th>
                        <th className="text-center px-4 py-3 text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                          <span className="flex items-center justify-center gap-1.5">
                            <GraduationCap className="w-3.5 h-3.5" /> Students
                          </span>
                        </th>
                        <th className="text-center px-4 py-3 text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                          <span className="flex items-center justify-center gap-1.5">
                            <BookOpen className="w-3.5 h-3.5" /> Instructors
                          </span>
                        </th>
                        <th className="text-center px-4 py-3 text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                          Status
                        </th>
                        <th className="text-left px-4 py-3 text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                          Joined
                        </th>
                        <th className="px-4 py-3 w-10" />
                      </tr>
                    </thead>

                    {/* Table Body */}
                    <tbody className="divide-y divide-slate-100 dark:divide-[#26252D]">
                      {institutes.map((inst) => (
                        <tr
                          key={inst.id}
                          className={`group transition-colors ${
                            inst.isActive
                              ? 'hover:bg-slate-50 dark:hover:bg-white/[0.025]'
                              : 'bg-slate-50/40 dark:bg-black/10 hover:bg-slate-50 dark:hover:bg-white/[0.02]'
                          }`}
                        >
                          {/* Institute Name + Address */}
                          <td className="px-5 py-4">
                            <div className="flex items-center gap-3">
                              {inst.logoUrl ? (
                                <img src={inst.logoUrl} alt="" className={`w-9 h-9 rounded-lg object-cover shrink-0 ${!inst.isActive ? 'opacity-40 grayscale' : ''}`} />
                              ) : (
                                <div className={`w-9 h-9 rounded-lg flex items-center justify-center font-bold text-sm shrink-0 ${
                                  inst.isActive
                                    ? 'bg-indigo-100 dark:bg-[#2D1F4D] text-indigo-700 dark:text-[#D97CFF]'
                                    : 'bg-slate-200 dark:bg-slate-700 text-slate-500 dark:text-slate-400'
                                }`}>
                                  {getInitials(inst.name)}
                                </div>
                              )}
                              <div>
                                <p className="font-semibold text-slate-900 dark:text-gray-100 text-[13.5px] leading-tight">{inst.name}</p>
                                {inst.address && (
                                  <p className="text-[11px] text-slate-400 dark:text-slate-500 flex items-center gap-0.5 mt-0.5">
                                    <MapPin className="w-3 h-3 shrink-0" />{inst.address}
                                  </p>
                                )}
                              </div>
                            </div>
                          </td>

                          {/* Owner */}
                          <td className="px-4 py-4">
                            {inst.owner ? (
                              <div className="flex items-center gap-2">
                                <div className="w-6 h-6 rounded-full bg-purple-100 dark:bg-purple-900/40 flex items-center justify-center text-[9px] font-bold text-purple-700 dark:text-purple-300 shrink-0">
                                  {getInitials(inst.owner.name ?? inst.owner.email)}
                                </div>
                                <div>
                                  <p className="text-[12.5px] text-slate-700 dark:text-slate-300 font-medium leading-tight">
                                    {inst.owner.name ?? '—'}
                                  </p>
                                  <p className="text-[11px] text-slate-400 dark:text-slate-500 leading-tight">{inst.owner.email}</p>
                                </div>
                              </div>
                            ) : (
                              <span className="text-[12px] text-slate-400 dark:text-slate-600 italic">No owner</span>
                            )}
                          </td>

                          {/* Students */}
                          <td className="px-4 py-4 text-center">
                            <span className="inline-flex items-center justify-center min-w-[2.5rem] px-2.5 py-1 rounded-full text-[13px] font-bold bg-indigo-50 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300">
                              {inst.studentCount}
                            </span>
                          </td>

                          {/* Instructors */}
                          <td className="px-4 py-4 text-center">
                            <span className="inline-flex items-center justify-center min-w-[2.5rem] px-2.5 py-1 rounded-full text-[13px] font-bold bg-purple-50 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300">
                              {inst.instructorCount}
                            </span>
                          </td>

                          {/* Status */}
                          <td className="px-4 py-4 text-center">
                            <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold tracking-wider ${
                              inst.isActive
                                ? 'text-emerald-700 bg-emerald-100 dark:text-[#10B981] dark:bg-[#10B981]/10'
                                : 'text-rose-700 bg-rose-100 dark:text-[#F43F5E] dark:bg-[#F43F5E]/10'
                            }`}>
                              {inst.isActive ? 'ACTIVE' : 'INACTIVE'}
                            </span>
                          </td>

                          {/* Joined */}
                          <td className="px-4 py-4">
                            <span className="text-[12px] text-slate-500 dark:text-slate-400 whitespace-nowrap">
                              {formatDate(inst.createdAt)}
                            </span>
                          </td>

                          {/* Actions */}
                          <td className="px-4 py-4">
                            <InstituteMenu 
                              institute={inst} 
                              onToggleStatus={handleToggleStatus} 
                              onEdit={(i) => setEditingInstitute(i)} 
                            />
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