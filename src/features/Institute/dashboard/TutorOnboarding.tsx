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
  if (!spec) return 'text-amber-700 bg-amber-50 border-amber-200';
  return 'text-brand-teal-700 bg-brand-teal-50 border-brand-teal-200';
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
        className="p-2.5 sm:p-1.5 rounded-lg hover:bg-brand-bg-alt text-brand-text-mute hover:text-brand-text transition-colors"
      >
        <MoreVertical className="w-4 h-4" />
      </button>
      {open && (
        <div className="absolute right-0 top-full mt-1 z-30 w-40 bg-white border border-brand-line rounded-xl shadow-sm py-1 overflow-hidden">
          <button
            onClick={() => { setOpen(false); onRemove(); }}
            className="w-full flex items-center gap-2.5 px-3.5 py-3 text-sm font-medium text-rose-600 hover:bg-rose-50 transition-colors"
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
      <div className="bg-white rounded-2xl shadow-sm w-full max-w-md border border-brand-line">
        <div className="flex items-center justify-between gap-3 px-4 sm:px-6 py-5 border-b border-brand-line">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-brand-blue-50 rounded-lg shrink-0">
              <BookOpen className="w-5 h-5 text-brand-blue-600" />
            </div>
            <div>
              <h2 className="font-bold text-brand-text text-base">Onboard New Tutor</h2>
              <p className="text-xs text-brand-text-mute mt-0.5">Tutor will receive an email invite to set their password</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2.5 rounded-lg hover:bg-brand-bg-alt transition-colors text-brand-text-mute shrink-0">
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-5">
          <div className="space-y-1.5">
            <label className="font-jetbrains text-xs font-semibold text-brand-text uppercase tracking-wider">Full Name *</label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-brand-text-mute" />
              <input
                type="text" required value={form.tutorName} onChange={set('tutorName')}
                placeholder="Tutor full name"
                className="w-full pl-10 pr-4 py-3 bg-brand-bg-alt border border-brand-line rounded-lg text-sm text-brand-text transition-all focus:outline-none focus:ring-2 focus:ring-brand-teal-500/20 focus:border-brand-teal-500 placeholder:text-brand-text-mute"
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <label className="font-jetbrains text-xs font-semibold text-brand-text uppercase tracking-wider">Email Address *</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-brand-text-mute" />
              <input
                type="email" required value={form.tutorEmail} onChange={set('tutorEmail')}
                placeholder="tutor@institute.edu"
                className="w-full pl-10 pr-4 py-3 bg-brand-bg-alt border border-brand-line rounded-lg text-sm text-brand-text transition-all focus:outline-none focus:ring-2 focus:ring-brand-teal-500/20 focus:border-brand-teal-500 placeholder:text-brand-text-mute"
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <label className="font-jetbrains text-xs font-semibold text-brand-text uppercase tracking-wider">Specialization</label>
            <select
              value={form.specialization} onChange={set('specialization')}
              className="w-full bg-brand-bg-alt border border-brand-line rounded-lg px-3 py-3 text-sm text-brand-text transition-all focus:outline-none focus:ring-2 focus:ring-brand-teal-500/20 focus:border-brand-teal-500"
            >
              <option value="">Select specialization (optional)</option>
              {SPECIALIZATIONS.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>

          <div className="flex items-start gap-2 bg-brand-blue-50 border border-brand-blue-100 rounded-lg p-3">
            <CheckCircle2 className="w-4 h-4 text-brand-blue-500 mt-0.5 shrink-0" />
            <p className="text-xs text-brand-blue-700 leading-relaxed">
              The tutor will receive a Supabase invite email. Once they accept, they'll have access to the Instructor dashboard.
            </p>
          </div>

          <div className="flex flex-col-reverse sm:flex-row gap-3 pt-1">
            <button type="button" onClick={onClose}
              className="w-full sm:flex-1 py-3 rounded-lg border border-brand-line text-sm font-medium text-brand-text hover:bg-brand-bg-alt transition-colors">
              Cancel
            </button>
            <button type="submit" disabled={loading}
              className="w-full sm:flex-1 py-3 rounded-lg bg-brand-teal-600 hover:bg-brand-teal-700 text-white text-sm font-semibold transition-colors flex items-center justify-center gap-2 disabled:opacity-60">
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
      <div className="bg-white rounded-2xl shadow-sm w-full max-w-sm border border-brand-line p-4 sm:p-6 space-y-5">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-rose-50 rounded-lg shrink-0">
            <Trash2 className="w-5 h-5 text-rose-600" />
          </div>
          <div>
            <h3 className="font-bold text-brand-text">Remove Tutor?</h3>
            <p className="text-xs text-brand-text-mute mt-0.5">{tutor.name ?? tutor.email}</p>
          </div>
        </div>
        <p className="text-sm text-brand-text">
          This will remove <strong>{tutor.email}</strong> from your institute and downgrade their role to Student.
        </p>
        <div className="flex flex-col-reverse sm:flex-row gap-3">
          <button onClick={onCancel} className="w-full sm:flex-1 py-3 rounded-lg border border-brand-line text-sm font-medium text-brand-text hover:bg-brand-bg-alt transition-colors">
            Cancel
          </button>
          <button onClick={onConfirm} disabled={loading}
            className="w-full sm:flex-1 py-3 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-sm font-semibold transition-colors flex items-center justify-center gap-2 disabled:opacity-60">
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

          <div className="w-full max-w-[1200px] mx-auto space-y-6 p-4 sm:p-6 lg:p-8">

            {/* Header */}
            <div className="flex items-start justify-between gap-3">
              <div>
                <h1 className="font-manrope text-xl sm:text-2xl font-bold text-brand-text">Tutor Onboarding</h1>
                <p className="text-sm text-brand-text-mute mt-0.5">
                  {loading ? '...' : `${tutors.length} tutor${tutors.length !== 1 ? 's' : ''} in your institute`}
                </p>
              </div>
              <button onClick={load} className="p-2.5 rounded-lg text-brand-text-mute hover:text-brand-teal-600 hover:bg-brand-bg-alt transition-colors shrink-0" title="Refresh">
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              </button>
            </div>

            {/* Search + Add */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="relative w-full sm:max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-brand-text-mute" />
                <input
                  type="text"
                  placeholder="Search tutors..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-brand-bg-alt border border-brand-line rounded-lg text-sm text-brand-text transition-all focus:outline-none focus:ring-2 focus:ring-brand-teal-500/20 focus:border-brand-teal-500 placeholder:text-brand-text-mute"
                />
              </div>
              <button
                onClick={() => setShowAddModal(true)}
                className="flex w-full sm:w-auto items-center justify-center gap-2 px-4 py-3 bg-brand-teal-600 hover:bg-brand-teal-700 text-white rounded-lg text-sm font-semibold transition-colors shadow-sm"
              >
                <Plus className="w-4 h-4" /> Add Tutor
              </button>
            </div>

            {/* Table */}
            <div className="bg-white border border-brand-line rounded-xl shadow-sm overflow-hidden">
              {loading ? (
                <div className="py-16 flex justify-center">
                  <Loader2 className="w-6 h-6 animate-spin text-brand-teal-500" />
                </div>
              ) : (
                <div className="w-full overflow-x-auto px-4 py-2">
                  <table className="w-full text-left border-collapse min-w-[700px]">
                    <thead>
                      <tr className="border-b border-brand-line text-brand-text-mute text-sm">
                        <th className="pb-4 pt-2 font-jetbrains text-[11px] font-semibold uppercase tracking-wider pl-2">Tutor</th>
                        <th className="pb-4 pt-2 font-jetbrains text-[11px] font-semibold uppercase tracking-wider">Contact</th>
                        <th className="pb-4 pt-2 font-jetbrains text-[11px] font-semibold uppercase tracking-wider">Specialization</th>
                        <th className="pb-4 pt-2 font-jetbrains text-[11px] font-semibold uppercase tracking-wider">Onboarded</th>
                        <th className="pb-4 pt-2 font-jetbrains text-[11px] font-semibold uppercase tracking-wider text-right pr-2">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-brand-line">
                      {filteredTutors.map((tutor) => (
                        <tr key={tutor.id} className="hover:bg-brand-bg-alt transition-colors group">
                          <td className="py-4 pl-2">
                            <div className="flex items-center gap-3">
                              {tutor.profileImage ? (
                                <img src={tutor.profileImage} alt="" className="w-9 h-9 rounded-md object-cover shrink-0" />
                              ) : (
                                <div className="w-9 h-9 rounded-md bg-brand-blue-100 text-brand-blue-700 flex items-center justify-center text-xs font-bold shrink-0">
                                  {getInitials(tutor.name, tutor.email)}
                                </div>
                              )}
                              <div>
                                <div className="font-semibold text-sm text-brand-text">
                                  {tutor.name ?? <span className="italic text-brand-text-mute font-normal">No name yet</span>}
                                </div>
                                <div className="text-xs text-brand-text-mute mt-0.5">{tutor.email}</div>
                              </div>
                            </div>
                          </td>
                          <td className="py-4">
                            <div className="text-sm text-brand-text">{tutor.phone ?? '—'}</div>
                          </td>
                          <td className="py-4">
                            <span className={`inline-block whitespace-nowrap px-2.5 py-1 text-[11px] font-semibold rounded border ${getSpecBadgeStyle(tutor.specialization)}`}>
                              {tutor.specialization ?? 'Unassigned'}
                            </span>
                          </td>
                          <td className="py-4">
                            <div className="text-xs text-brand-text-mute">{formatDate(tutor.createdAt)}</div>
                          </td>
                          <td className="py-4 text-right pr-2">
                            <TutorRowMenu onRemove={() => setRemoveTarget(tutor)} />
                          </td>
                        </tr>
                      ))}
                      {filteredTutors.length === 0 && !loading && (
                        <tr>
                          <td colSpan={5} className="py-12 text-center">
                            <BookOpen className="w-12 h-12 text-brand-line mx-auto mb-3" />
                            <p className="text-brand-text-mute text-sm">
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