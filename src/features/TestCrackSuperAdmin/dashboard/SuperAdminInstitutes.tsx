import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Search, Plus, Building2, Mail, User, MapPin, Phone,
  Loader2, RefreshCw, X, CheckCircle2, MoreVertical,
  GraduationCap, BookOpen, PowerOff, Zap
} from 'lucide-react';
import { SuperAdminSidebar } from '../Components/SuperadminSidebar';
import { SuperAdminTopbar } from '../Components/Superadmintopbar';
import {
  fetchInstitutes, createInstitute, toggleInstituteStatus, updateInstitute,
  setInstituteExams, setExamStatus,
  InstituteRecord, InstituteExamRecord
} from '../services/superadminService';
import {
  EXAM_TYPES, EXAM_LABELS, EXAM_AVAILABILITY, type ExamType, type BillingStatus,
} from '@/shared/constants/examTypes';
import { useToast } from '@/shared/hooks/use-toast';

// ─── Helpers ──────────────────────────────────────────────────────────────────

const getInitials = (name: string) =>
  name.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase();

const formatDate = (iso: string) => {
  try { return new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }); }
  catch { return '—'; }
};

// ─── Exam badge ───────────────────────────────────────────────────────────────

const STATUS_STYLES: Record<BillingStatus, string> = {
  ACTIVE:    'bg-emerald-100 text-emerald-700',
  TRIAL:     'bg-amber-100 text-amber-700',
  CANCELLED: 'bg-brand-bg-alt text-brand-text-mute line-through',
};

function ExamBadge({ exam }: { exam: InstituteExamRecord }) {
  return (
    <span
      title={`${EXAM_LABELS[exam.examType]} — ${exam.billingStatus}`}
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-semibold ${STATUS_STYLES[exam.billingStatus]}`}
    >
      {EXAM_LABELS[exam.examType]}
    </span>
  );
}

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
        className="h-10 w-10 flex items-center justify-center rounded-lg hover:bg-brand-bg-alt text-brand-text-mute hover:text-brand-text transition-colors"
        title="Options"
      >
        {loading
          ? <Loader2 className="w-4 h-4 animate-spin" />
          : <MoreVertical className="w-4 h-4" />}
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-1 z-30 w-44 bg-white border border-brand-line rounded-xl shadow-sm py-1 overflow-hidden">
          <button
            onClick={(e) => { e.stopPropagation(); setOpen(false); onEdit(institute); }}
            className="w-full flex items-center gap-2.5 px-3.5 py-2.5 text-sm font-medium transition-colors text-brand-text hover:bg-brand-bg-alt"
          >
            <Building2 className="w-4 h-4" /> Edit Details
          </button>
          <div className="h-px w-full bg-brand-line my-0.5" />
          <button
            onClick={handleToggle}
            className={`w-full flex items-center gap-2.5 px-3.5 py-2.5 text-sm font-medium transition-colors ${
              institute.isActive
                ? 'text-rose-600 hover:bg-rose-50'
                : 'text-emerald-600 hover:bg-emerald-50'
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
    ownerPhone: '',
  });
  const [examTypes, setExamTypes] = useState<ExamType[]>(['ielts']);

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm(prev => ({ ...prev, [k]: e.target.value }));

  const toggleExam = (exam: ExamType) =>
    setExamTypes(prev => prev.includes(exam) ? prev.filter(x => x !== exam) : [...prev, exam]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.instituteName.trim() || !form.ownerName.trim() || !form.ownerEmail.trim()) return;
    if (examTypes.length === 0) {
      toast({ title: 'Select at least one exam', description: 'An institute must offer at least one exam.', variant: 'destructive' });
      return;
    }
    setLoading(true);
    try {
      const res = await createInstitute({
        instituteName: form.instituteName,
        address:       form.address || undefined,
        ownerName:     form.ownerName,
        ownerEmail:    form.ownerEmail,
        ownerPhone:    form.ownerPhone || undefined,
        examTypes,
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
      <div className="bg-white rounded-2xl shadow-sm w-full max-w-lg max-h-[90vh] overflow-y-auto border border-brand-line">
        <div className="flex items-center justify-between gap-3 px-4 sm:px-6 py-5 border-b border-brand-line">
          <div className="flex items-center gap-3 min-w-0">
            <div className="p-2 bg-brand-teal-50 rounded-lg shrink-0">
              <Building2 className="w-5 h-5 text-brand-teal-600" />
            </div>
            <div className="min-w-0">
              <h2 className="font-manrope font-bold text-brand-text text-base">Add New Institute</h2>
              <p className="text-xs text-brand-text-mute mt-0.5">Owner will receive an invite email to set their password</p>
            </div>
          </div>
          <button onClick={onClose} className="h-10 w-10 shrink-0 flex items-center justify-center rounded-lg hover:bg-brand-bg-alt transition-colors text-brand-text-mute">
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-5">
          <div className="space-y-1.5">
            <label className="font-jetbrains text-[10px] font-bold text-brand-text-mute uppercase tracking-[0.15em]">Institute Name *</label>
            <div className="relative">
              <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-brand-text-mute" />
              <input type="text" required value={form.instituteName} onChange={set('instituteName')} placeholder="e.g. Ace English Academy"
                className="w-full pl-10 pr-4 py-2.5 bg-brand-bg-alt border border-brand-line rounded-lg text-sm text-brand-text focus:outline-none focus:border-brand-teal-500 placeholder-brand-text-mute" />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="font-jetbrains text-[10px] font-bold text-brand-text-mute uppercase tracking-[0.15em]">Address <span className="text-brand-text-mute normal-case font-normal">(optional)</span></label>
            <div className="relative">
              <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-brand-text-mute" />
              <input type="text" value={form.address} onChange={set('address')} placeholder="City, State"
                className="w-full pl-10 pr-4 py-2.5 bg-brand-bg-alt border border-brand-line rounded-lg text-sm text-brand-text focus:outline-none focus:border-brand-teal-500 placeholder-brand-text-mute" />
            </div>
          </div>

          <div className="border-t border-brand-line pt-1">
            <p className="font-jetbrains text-[10px] font-bold text-brand-text-mute uppercase tracking-[0.15em] mb-4">Institute Owner Account</p>
            <div className="space-y-1.5 mb-4">
              <label className="font-jetbrains text-[10px] font-bold text-brand-text-mute uppercase tracking-[0.15em]">Owner Name *</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-brand-text-mute" />
                <input type="text" required value={form.ownerName} onChange={set('ownerName')} placeholder="Full name"
                  className="w-full pl-10 pr-4 py-2.5 bg-brand-bg-alt border border-brand-line rounded-lg text-sm text-brand-text focus:outline-none focus:border-brand-teal-500 placeholder-brand-text-mute" />
              </div>
            </div>
            <div className="space-y-1.5 mb-4">
              <label className="font-jetbrains text-[10px] font-bold text-brand-text-mute uppercase tracking-[0.15em]">Owner Email *</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-brand-text-mute" />
                <input type="email" required value={form.ownerEmail} onChange={set('ownerEmail')} placeholder="owner@institute.com"
                  className="w-full pl-10 pr-4 py-2.5 bg-brand-bg-alt border border-brand-line rounded-lg text-sm text-brand-text focus:outline-none focus:border-brand-teal-500 placeholder-brand-text-mute" />
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="font-jetbrains text-[10px] font-bold text-brand-text-mute uppercase tracking-[0.15em]">Owner Phone <span className="normal-case font-normal">(optional)</span></label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-brand-text-mute" />
                <input type="tel" value={form.ownerPhone} onChange={set('ownerPhone')} placeholder="+91 98765 43210"
                  className="w-full pl-10 pr-4 py-2.5 bg-brand-bg-alt border border-brand-line rounded-lg text-sm text-brand-text focus:outline-none focus:border-brand-teal-500 placeholder-brand-text-mute" />
              </div>
            </div>
          </div>

          <div className="border-t border-brand-line pt-4">
            <p className="font-jetbrains text-[10px] font-bold text-brand-text-mute uppercase tracking-[0.15em] mb-3">Exams Offered *</p>
            <div className="flex flex-wrap gap-2">
              {EXAM_TYPES.map((exam) => {
                const selected = examTypes.includes(exam);
                const soon = EXAM_AVAILABILITY[exam] === 'soon';
                return (
                  <button
                    key={exam}
                    type="button"
                    onClick={() => toggleExam(exam)}
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors ${
                      selected
                        ? 'bg-brand-teal-600 border-brand-teal-600 text-white'
                        : 'bg-brand-bg-alt border-brand-line text-brand-text hover:border-brand-teal-400'
                    }`}
                  >
                    {selected && <CheckCircle2 className="w-3.5 h-3.5" />}
                    {EXAM_LABELS[exam]}
                    {soon && <span className="text-[9px] font-medium opacity-70">soon</span>}
                  </button>
                );
              })}
            </div>
            <p className="text-[11px] text-brand-text-mute mt-2">Each selected exam starts on a 30-day trial. You can change this later.</p>
          </div>

          <div className="flex items-start gap-2 bg-brand-teal-50 border border-brand-teal-100 rounded-lg p-3">
            <CheckCircle2 className="w-4 h-4 text-brand-teal-500 mt-0.5 shrink-0" />
            <p className="text-xs text-brand-teal-700 leading-relaxed">
              An invite email will be sent to the owner's email address. They'll click the link to set their password and access the Institute Owner dashboard.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 pt-1">
            <button type="button" onClick={onClose}
              className="flex-1 py-2.5 rounded-lg border border-brand-line text-sm font-medium text-brand-text hover:bg-brand-bg-alt transition-colors">
              Cancel
            </button>
            <button type="submit" disabled={loading}
              className="flex-1 py-2.5 rounded-lg bg-brand-teal-600 hover:bg-brand-teal-700 text-white text-sm font-semibold transition-colors flex items-center justify-center gap-2 disabled:opacity-60">
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
    contactEmail: institute.contactEmail || '',
    contactPhone: institute.contactPhone || '',
  });
  // Offered = any exam whose subscription is not CANCELLED.
  const [offered, setOffered] = useState<Set<ExamType>>(
    () => new Set(institute.exams.filter(e => e.billingStatus !== 'CANCELLED').map(e => e.examType))
  );

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm(prev => ({ ...prev, [k]: e.target.value }));

  const toggleExam = (exam: ExamType) =>
    setOffered(prev => {
      const next = new Set(prev);
      next.has(exam) ? next.delete(exam) : next.add(exam);
      return next;
    });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) return;
    if (offered.size === 0) {
      toast({ title: 'Select at least one exam', description: 'An institute must offer at least one exam.', variant: 'destructive' });
      return;
    }
    setLoading(true);
    try {
      await updateInstitute(institute.id, {
        name: form.name,
        address: form.address,
        contactEmail: form.contactEmail,
        contactPhone: form.contactPhone,
      });
      await setInstituteExams(institute.id, [...offered]);
      toast({
        title: '✅ Institute Updated',
        description: 'Profile and exam offerings have been updated.',
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
      <div className="bg-white rounded-2xl shadow-sm w-full max-w-lg max-h-[90vh] overflow-y-auto border border-brand-line">
        <div className="flex items-center justify-between gap-3 px-4 sm:px-6 py-5 border-b border-brand-line sticky top-0 bg-white z-10">
          <div className="flex items-center gap-3 min-w-0">
            <div className="p-2 bg-brand-teal-50 rounded-lg shrink-0">
              <Building2 className="w-5 h-5 text-brand-teal-600" />
            </div>
            <div className="min-w-0">
              <h2 className="font-manrope font-bold text-brand-text text-base">Edit Institute</h2>
              <p className="text-xs text-brand-text-mute mt-0.5">Update profile &amp; exam offerings</p>
            </div>
          </div>
          <button onClick={onClose} className="h-10 w-10 shrink-0 flex items-center justify-center rounded-lg hover:bg-brand-bg-alt transition-colors text-brand-text-mute">
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-5">
          <div className="space-y-1.5">
            <label className="font-jetbrains text-[10px] font-bold text-brand-text-mute uppercase tracking-[0.15em]">Institute Name *</label>
            <div className="relative">
              <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-brand-text-mute" />
              <input type="text" required value={form.name} onChange={set('name')} placeholder="e.g. Ace English Academy"
                className="w-full pl-10 pr-4 py-2.5 bg-brand-bg-alt border border-brand-line rounded-lg text-sm text-brand-text focus:outline-none focus:border-brand-teal-500 placeholder-brand-text-mute" />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="font-jetbrains text-[10px] font-bold text-brand-text-mute uppercase tracking-[0.15em]">Address</label>
            <div className="relative">
              <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-brand-text-mute" />
              <input type="text" value={form.address} onChange={set('address')} placeholder="City, State"
                className="w-full pl-10 pr-4 py-2.5 bg-brand-bg-alt border border-brand-line rounded-lg text-sm text-brand-text focus:outline-none focus:border-brand-teal-500 placeholder-brand-text-mute" />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4">
            <div className="space-y-1.5">
              <label className="font-jetbrains text-[10px] font-bold text-brand-text-mute uppercase tracking-[0.15em]">Contact Email <span className="normal-case font-normal">(institute)</span></label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-brand-text-mute" />
                <input type="email" value={form.contactEmail} onChange={set('contactEmail')} placeholder="info@institute.com"
                  className="w-full pl-10 pr-4 py-2.5 bg-brand-bg-alt border border-brand-line rounded-lg text-sm text-brand-text focus:outline-none focus:border-brand-teal-500 placeholder-brand-text-mute" />
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="font-jetbrains text-[10px] font-bold text-brand-text-mute uppercase tracking-[0.15em]">Contact Phone <span className="normal-case font-normal">(institute)</span></label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-brand-text-mute" />
                <input type="tel" value={form.contactPhone} onChange={set('contactPhone')} placeholder="+91 98765 43210"
                  className="w-full pl-10 pr-4 py-2.5 bg-brand-bg-alt border border-brand-line rounded-lg text-sm text-brand-text focus:outline-none focus:border-brand-teal-500 placeholder-brand-text-mute" />
              </div>
            </div>
          </div>

          <div className="border-t border-brand-line pt-4">
            <p className="font-jetbrains text-[10px] font-bold text-brand-text-mute uppercase tracking-[0.15em] mb-3">Exams Offered *</p>
            <div className="flex flex-wrap gap-2">
              {EXAM_TYPES.map((exam) => {
                const selected = offered.has(exam);
                const soon = EXAM_AVAILABILITY[exam] === 'soon';
                return (
                  <button
                    key={exam}
                    type="button"
                    onClick={() => toggleExam(exam)}
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors ${
                      selected
                        ? 'bg-brand-teal-600 border-brand-teal-600 text-white'
                        : 'bg-brand-bg-alt border-brand-line text-brand-text hover:border-brand-teal-400'
                    }`}
                  >
                    {selected && <CheckCircle2 className="w-3.5 h-3.5" />}
                    {EXAM_LABELS[exam]}
                    {soon && <span className="text-[9px] font-medium opacity-70">soon</span>}
                  </button>
                );
              })}
            </div>
            <p className="text-[11px] text-brand-text-mute mt-2">Removing an exam cancels its subscription (data is preserved). Billing status is managed on the Subscriptions page.</p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-brand-line">

            <button type="button" onClick={onClose}
              className="flex-1 py-2.5 rounded-lg border border-brand-line text-sm font-medium text-brand-text hover:bg-brand-bg-alt transition-colors">
              Cancel
            </button>
            <button type="submit" disabled={loading}
              className="flex-1 py-2.5 rounded-lg bg-brand-teal-600 hover:bg-brand-teal-700 text-white text-sm font-semibold transition-colors flex items-center justify-center gap-2 disabled:opacity-60">
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
    <div className="relative min-h-screen font-plex antialiased overflow-x-hidden bg-brand-bg text-brand-text">

      {showCreateModal && (
        <CreateInstituteModal onClose={() => setShowCreateModal(false)} onCreated={load} />
      )}

      {editingInstitute && (
        <EditInstituteModal institute={editingInstitute} onClose={() => setEditingInstitute(null)} onUpdated={load} />
      )}

      <SuperAdminSidebar
        activeTab="institutes"
        isCollapsed={isSidebarCollapsed}
        toggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
      />

      <div className={`relative z-10 transition-all duration-300 ${isSidebarCollapsed ? 'lg:pl-24' : 'lg:pl-72'}`}>
        <SuperAdminTopbar />

        <main className="px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-8 max-w-[90rem] mx-auto pb-16">

            {/* Header */}
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="font-jetbrains text-[10px] font-bold tracking-[0.2em] uppercase text-brand-text-mute mb-1">
                  Platform Directory
                </p>
                <h1 className="font-manrope text-2xl sm:text-3xl font-black tracking-tight text-brand-text">Institutes</h1>
                {!loading && (
                  <div className="flex flex-wrap items-center gap-2 sm:gap-3 mt-1">
                    <span className="text-sm text-brand-text-mute">{institutes.length} total</span>
                    {activeCount > 0 && (
                      <span className="font-jetbrains text-[10px] font-bold uppercase tracking-[0.12em] px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                        {activeCount} active
                      </span>
                    )}
                    {inactiveCount > 0 && (
                      <span className="font-jetbrains text-[10px] font-bold uppercase tracking-[0.12em] px-2 py-0.5 rounded-full bg-rose-50 text-rose-700 border border-rose-200">
                        {inactiveCount} inactive
                      </span>
                    )}
                  </div>
                )}
              </div>
              <button onClick={load} className="h-10 w-10 shrink-0 flex items-center justify-center rounded-lg text-brand-text-mute hover:text-brand-teal-600 hover:bg-brand-bg-alt transition-colors" title="Refresh">
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              </button>
            </div>

            {/* Search + Add */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 sm:gap-4">
              <div className="relative w-full max-w-full sm:max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-brand-text-mute" />
                <input
                  type="text"
                  placeholder="Search institutes..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-white border border-brand-line rounded-lg text-sm text-brand-text focus:outline-none focus:border-brand-teal-500 transition-all placeholder-brand-text-mute shadow-sm"
                />
              </div>
              <button
                onClick={() => setShowCreateModal(true)}
                className="flex w-full sm:w-auto items-center justify-center gap-2 px-4 py-2.5 bg-brand-teal-600 hover:bg-brand-teal-700 text-white rounded-lg text-sm font-semibold transition-colors shadow-sm"
              >
                <Plus className="w-4 h-4" />
                Add Institute
              </button>
            </div>

            {/* Table */}
            <div className="bg-white border border-brand-line rounded-2xl shadow-sm overflow-hidden">
              {loading ? (
                <div className="py-16 flex justify-center">
                  <Loader2 className="w-6 h-6 animate-spin text-brand-teal-500" />
                </div>
              ) : institutes.length === 0 ? (
                <div className="py-12 px-4 text-center text-brand-text-mute text-sm">
                  {debouncedSearch ? `No institutes matching "${debouncedSearch}"` : 'No institutes yet. Click "Add Institute" to create one.'}
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    {/* Table Header */}
                    <thead>
                      <tr className="border-b border-brand-line bg-brand-bg-alt/80">
                        <th className="font-jetbrains text-left px-4 sm:px-5 py-3 text-[10px] font-black text-brand-text-mute uppercase tracking-[0.12em] w-[35%]">
                          Institute
                        </th>
                        <th className="font-jetbrains hidden md:table-cell text-left px-4 py-3 text-[10px] font-black text-brand-text-mute uppercase tracking-[0.12em]">
                          Owner
                        </th>
                        <th className="font-jetbrains text-center px-4 py-3 text-[10px] font-black text-brand-text-mute uppercase tracking-[0.12em]">
                          <span className="flex items-center justify-center gap-1.5">
                            <GraduationCap className="w-3.5 h-3.5" /> Students
                          </span>
                        </th>
                        <th className="font-jetbrains hidden sm:table-cell text-center px-4 py-3 text-[10px] font-black text-brand-text-mute uppercase tracking-[0.12em]">
                          <span className="flex items-center justify-center gap-1.5">
                            <BookOpen className="w-3.5 h-3.5" /> Instructors
                          </span>
                        </th>
                        <th className="font-jetbrains text-center px-4 py-3 text-[10px] font-black text-brand-text-mute uppercase tracking-[0.12em]">
                          Status
                        </th>
                        <th className="font-jetbrains hidden lg:table-cell text-left px-4 py-3 text-[10px] font-black text-brand-text-mute uppercase tracking-[0.12em]">
                          Joined
                        </th>
                        <th className="px-4 py-3 w-10" />
                      </tr>
                    </thead>

                    {/* Table Body */}
                    <tbody className="divide-y divide-brand-line">
                      {institutes.map((inst) => (
                        <tr
                          key={inst.id}
                          className={`group transition-colors ${
                            inst.isActive
                              ? 'hover:bg-brand-teal-50/50'
                              : 'bg-brand-bg-alt/50 hover:bg-brand-teal-50/50'
                          }`}
                        >
                          {/* Institute Name + Address */}
                          <td className="px-4 sm:px-5 py-4">
                            <div className="flex items-center gap-3">
                              {inst.logoUrl ? (
                                <img src={inst.logoUrl} alt="" className={`w-9 h-9 rounded-lg object-cover shrink-0 ${!inst.isActive ? 'opacity-40 grayscale' : ''}`} />
                              ) : (
                                <div className={`w-9 h-9 rounded-lg flex items-center justify-center font-black text-sm shrink-0 ${
                                  inst.isActive
                                    ? 'bg-brand-teal-100 text-brand-teal-700'
                                    : 'bg-brand-bg-alt text-brand-text-mute'
                                }`}>
                                  {getInitials(inst.name)}
                                </div>
                              )}
                              <div className="min-w-0">
                                <p className="font-semibold text-brand-text text-[13.5px] leading-tight truncate">{inst.name}</p>
                                {inst.address && (
                                  <p className="text-[11px] text-brand-text-mute flex items-center gap-0.5 mt-0.5">
                                    <MapPin className="w-3 h-3 shrink-0" />{inst.address}
                                  </p>
                                )}
                                {inst.exams.filter(e => e.billingStatus !== 'CANCELLED').length > 0 && (
                                  <div className="flex flex-wrap gap-1 mt-1.5">
                                    {inst.exams
                                      .filter(e => e.billingStatus !== 'CANCELLED')
                                      .map(e => <ExamBadge key={e.examType} exam={e} />)}
                                  </div>
                                )}
                              </div>
                            </div>
                          </td>

                          {/* Owner */}
                          <td className="hidden md:table-cell px-4 py-4">
                            {inst.owner ? (
                              <div className="flex items-center gap-2">
                                <div className="w-6 h-6 rounded-full bg-brand-blue-100 flex items-center justify-center text-[9px] font-black text-brand-blue-700 shrink-0">
                                  {getInitials(inst.owner.name ?? inst.owner.email)}
                                </div>
                                <div className="min-w-0">
                                  <p className="text-[12.5px] text-brand-text font-medium leading-tight">
                                    {inst.owner.name ?? '—'}
                                  </p>
                                  <p className="text-[11px] text-brand-text-mute leading-tight">{inst.owner.email}</p>
                                </div>
                              </div>
                            ) : (
                              <span className="text-[12px] text-brand-text-mute italic">No owner</span>
                            )}
                          </td>

                          {/* Students */}
                          <td className="px-4 py-4 text-center">
                            <span className="inline-flex items-center justify-center min-w-[2.5rem] px-2.5 py-1 rounded-full text-[13px] font-black bg-brand-teal-50 text-brand-teal-700">
                              {inst.studentCount}
                            </span>
                          </td>

                          {/* Instructors */}
                          <td className="hidden sm:table-cell px-4 py-4 text-center">
                            <span className="inline-flex items-center justify-center min-w-[2.5rem] px-2.5 py-1 rounded-full text-[13px] font-black bg-brand-blue-50 text-brand-blue-700">
                              {inst.instructorCount}
                            </span>
                          </td>

                          {/* Status */}
                          <td className="px-4 py-4 text-center">
                            <span className={`font-jetbrains inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold tracking-[0.12em] border ${
                              inst.isActive
                                ? 'text-emerald-700 bg-emerald-50 border-emerald-200'
                                : 'text-rose-700 bg-rose-50 border-rose-200'
                            }`}>
                              {inst.isActive ? 'ACTIVE' : 'INACTIVE'}
                            </span>
                          </td>

                          {/* Joined */}
                          <td className="hidden lg:table-cell px-4 py-4">
                            <span className="text-[12px] text-brand-text-mute whitespace-nowrap">
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

        </main>
      </div>
    </div>
  );
}
