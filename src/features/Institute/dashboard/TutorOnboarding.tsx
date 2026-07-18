import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Search, Plus, X, Loader2, RefreshCw, Trash2,
  MoreVertical, CheckCircle2, Mail, User, BookOpen,
} from 'lucide-react';
import { InstituteAdminLayout } from '../components/InstituteAdminLayout';
import {
  fetchTutors, addTutor, removeTutor,
  TutorRecord,
} from '../services/instituteAdminService';
import { useToast } from '@/shared/hooks/use-toast';

// ─── Helpers ──────────────────────────────────────────────────────────────────

const getInitials = (name: string | null, email: string) =>
  (name ?? email).split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase();

const formatDate = (iso: string) => {
  try { return new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }); }
  catch { return '—'; }
};

const getSpecBadgeStyle = (spec: string | null) => {
  if (!spec) return 'text-orange-700 bg-orange-50 border-orange-200 dark:text-orange-500 dark:bg-[#2A1A15] dark:border-orange-500/30';
  return 'text-indigo-700 bg-indigo-50 border-indigo-200 dark:text-[#A78BFA] dark:bg-[#2E1A47] dark:border-[#A78BFA]/30';
};

// ─── Row Actions ──────────────────────────────────────────────────────────────

function TutorRowMenu({ onRemove }: { onRemove: () => void }) {
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
            <Trash2 className="w-4 h-4" /> Remove
          </button>
        </div>
      )}
    </div>
  );
}

// ─── Add Tutor Modal ──────────────────────────────────────────────────────────

const SPECIALIZATIONS = [
  'IELTS Preparation', 'Spoken English', 'Tech Interview Prep',
  'General Communication', 'PTE Preparation', 'TOEFL Preparation',
];

function AddTutorModal({ onClose, onAdded }: { onClose: () => void; onAdded: () => void }) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ tutorName: '', tutorEmail: '', specialization: '' });
  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm(prev => ({ ...prev, [k]: e.target.value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.tutorName.trim() || !form.tutorEmail.trim()) return;
    setLoading(true);
    try {
      const res = await addTutor({
        tutorName: form.tutorName,
        tutorEmail: form.tutorEmail,
        specialization: form.specialization || undefined,
      });
      toast({
        title: '✅ Tutor Onboarded',
        description: res.data.inviteEmailSent
          ? `Invite email sent to ${res.data.email}`
          : `Tutor added. Invite email could not be sent — check Supabase logs.`,
      });
      onAdded();
      onClose();
    } catch (err: any) {
      toast({ title: 'Failed to add tutor', description: err.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white dark:bg-[#15141B] rounded-2xl shadow-2xl w-full max-w-md border border-slate-200 dark:border-[#26252D]">
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100 dark:border-[#26252D]">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-50 dark:bg-purple-900/30 rounded-lg">
              <BookOpen className="w-5 h-5 text-purple-600 dark:text-purple-400" />
            </div>
            <div>
              <h2 className="font-bold text-slate-900 dark:text-white text-base">Onboard New Tutor</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Tutor will receive an email invite to set their password</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-white/10 transition-colors text-slate-400">
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider">Full Name *</label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text" required value={form.tutorName} onChange={set('tutorName')}
                placeholder="Tutor full name"
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-[#0A0A0B] border border-slate-200 dark:border-[#26252D] rounded-lg text-sm focus:outline-none focus:border-indigo-500 dark:text-white placeholder-slate-400"
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider">Email Address *</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="email" required value={form.tutorEmail} onChange={set('tutorEmail')}
                placeholder="tutor@institute.edu"
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-[#0A0A0B] border border-slate-200 dark:border-[#26252D] rounded-lg text-sm focus:outline-none focus:border-indigo-500 dark:text-white placeholder-slate-400"
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider">Specialization</label>
            <select
              value={form.specialization} onChange={set('specialization')}
              className="w-full bg-slate-50 dark:bg-[#0A0A0B] border border-slate-200 dark:border-[#26252D] rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-indigo-500 dark:text-white"
            >
              <option value="">Select specialization (optional)</option>
              {SPECIALIZATIONS.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>

          <div className="flex items-start gap-2 bg-purple-50 dark:bg-purple-900/20 border border-purple-100 dark:border-purple-800/40 rounded-lg p-3">
            <CheckCircle2 className="w-4 h-4 text-purple-500 mt-0.5 shrink-0" />
            <p className="text-xs text-purple-700 dark:text-purple-300 leading-relaxed">
              The tutor will receive a Supabase invite email. Once they accept, they'll have access to the Instructor dashboard.
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
              {loading ? 'Onboarding...' : 'Onboard & Send Invite'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Confirm Remove Dialog ────────────────────────────────────────────────────

function ConfirmRemoveDialog({ tutor, onConfirm, onCancel, loading }: {
  tutor: TutorRecord;
  onConfirm: () => void;
  onCancel: () => void;
  loading: boolean;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white dark:bg-[#15141B] rounded-2xl shadow-2xl w-full max-w-sm border border-slate-200 dark:border-[#26252D] p-6 space-y-5">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-rose-50 dark:bg-rose-900/30 rounded-lg">
            <Trash2 className="w-5 h-5 text-rose-600 dark:text-rose-400" />
          </div>
          <div>
            <h3 className="font-bold text-slate-900 dark:text-white">Remove Tutor?</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{tutor.name ?? tutor.email}</p>
          </div>
        </div>
        <p className="text-sm text-slate-600 dark:text-slate-400">
          This will remove <strong>{tutor.email}</strong> from your institute and downgrade their role to Student.
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

export default function TutorOnboarding() {
  const { toast } = useToast();
  const [tutors, setTutors] = useState<TutorRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [removeTarget, setRemoveTarget] = useState<TutorRecord | null>(null);
  const [removeLoading, setRemoveLoading] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetchTutors();
      setTutors(res.data);
    } catch (err: any) {
      toast({ title: 'Failed to load tutors', description: err.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => { load(); }, [load]);

  const handleRemove = async () => {
    if (!removeTarget) return;
    setRemoveLoading(true);
    try {
      await removeTutor(removeTarget.userId);
      setTutors(prev => prev.filter(t => t.userId !== removeTarget.userId));
      toast({ title: '🗑️ Tutor Removed', description: `${removeTarget.email} has been removed.` });
      setRemoveTarget(null);
    } catch (err: any) {
      toast({ title: 'Failed to remove tutor', description: err.message, variant: 'destructive' });
    } finally {
      setRemoveLoading(false);
    }
  };

  const filteredTutors = tutors.filter(t =>
    (t.name ?? '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    t.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <InstituteAdminLayout activeTab="tutor-onboard">
      {showAddModal && <AddTutorModal onClose={() => setShowAddModal(false)} onAdded={load} />}
      {removeTarget && (
        <ConfirmRemoveDialog
          tutor={removeTarget}
          onConfirm={handleRemove}
          onCancel={() => setRemoveTarget(null)}
          loading={removeLoading}
        />
      )}

          <div className="max-w-[1200px] mx-auto space-y-6">

            {/* Header */}
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Tutor Onboarding</h1>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
                  {loading ? '...' : `${tutors.length} tutor${tutors.length !== 1 ? 's' : ''} in your institute`}
                </p>
              </div>
              <button onClick={load} className="p-2 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-slate-100 dark:hover:bg-white/5 transition-colors" title="Refresh">
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              </button>
            </div>

            {/* Search + Add */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="relative w-full max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 dark:text-gray-500" />
                <input
                  type="text"
                  placeholder="Search tutors..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-transparent border border-slate-200 dark:border-gray-800 rounded-lg text-sm focus:outline-none focus:border-indigo-500 dark:focus:border-[#8B5CF6] transition-all dark:text-white placeholder-slate-400 dark:placeholder-gray-500 shadow-sm"
                />
              </div>
              <button
                onClick={() => setShowAddModal(true)}
                className="flex w-full sm:w-auto items-center justify-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 dark:bg-[#7C3AED] dark:hover:bg-[#6D28D9] text-white rounded-lg text-sm font-medium transition-colors shadow-sm"
              >
                <Plus className="w-4 h-4" /> Add Tutor
              </button>
            </div>

            {/* Table */}
            <div className="bg-white dark:bg-transparent border border-slate-200 dark:border-transparent rounded-xl shadow-sm dark:shadow-none overflow-hidden">
              {loading ? (
                <div className="py-16 flex justify-center">
                  <Loader2 className="w-6 h-6 animate-spin text-indigo-500" />
                </div>
              ) : (
                <div className="w-full overflow-x-auto px-4 py-2">
                  <table className="w-full text-left border-collapse min-w-[700px]">
                    <thead>
                      <tr className="border-b border-slate-100 dark:border-gray-800 text-slate-500 dark:text-gray-500 text-sm">
                        <th className="pb-4 font-semibold dark:font-normal pl-2">Tutor</th>
                        <th className="pb-4 font-semibold dark:font-normal">Contact</th>
                        <th className="pb-4 font-semibold dark:font-normal">Specialization</th>
                        <th className="pb-4 font-semibold dark:font-normal">Onboarded</th>
                        <th className="pb-4 font-semibold dark:font-normal text-right pr-2">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-gray-800/50">
                      {filteredTutors.map((tutor) => (
                        <tr key={tutor.id} className="hover:bg-slate-50 dark:hover:bg-white/[0.02] transition-colors group">
                          <td className="py-4 pl-2">
                            <div className="flex items-center gap-3">
                              {tutor.profileImage ? (
                                <img src={tutor.profileImage} alt="" className="w-9 h-9 rounded-md object-cover shrink-0" />
                              ) : (
                                <div className="w-9 h-9 rounded-md bg-purple-100 dark:bg-[#2D1F4D] text-purple-700 dark:text-[#D97CFF] flex items-center justify-center text-xs font-bold shrink-0">
                                  {getInitials(tutor.name, tutor.email)}
                                </div>
                              )}
                              <div>
                                <div className="font-semibold text-sm text-slate-900 dark:text-gray-200">
                                  {tutor.name ?? <span className="italic text-slate-400 dark:text-gray-500 font-normal">No name yet</span>}
                                </div>
                                <div className="text-xs text-slate-500 dark:text-gray-500 mt-0.5">{tutor.email}</div>
                              </div>
                            </div>
                          </td>
                          <td className="py-4">
                            <div className="text-sm text-slate-600 dark:text-gray-300">{tutor.phone ?? '—'}</div>
                          </td>
                          <td className="py-4">
                            <span className={`px-2.5 py-1 text-[11px] font-semibold rounded border ${getSpecBadgeStyle(tutor.specialization)}`}>
                              {tutor.specialization ?? 'Unassigned'}
                            </span>
                          </td>
                          <td className="py-4">
                            <div className="text-xs text-slate-500 dark:text-gray-500">{formatDate(tutor.createdAt)}</div>
                          </td>
                          <td className="py-4 text-right pr-2">
                            <TutorRowMenu onRemove={() => setRemoveTarget(tutor)} />
                          </td>
                        </tr>
                      ))}
                      {filteredTutors.length === 0 && !loading && (
                        <tr>
                          <td colSpan={5} className="py-12 text-center">
                            <BookOpen className="w-12 h-12 text-slate-200 dark:text-slate-700 mx-auto mb-3" />
                            <p className="text-slate-500 dark:text-gray-500 text-sm">
                              {searchQuery ? `No tutors matching "${searchQuery}"` : 'No tutors yet. Add one to get started.'}
                            </p>
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

          </div>
    </InstituteAdminLayout>
  );
}