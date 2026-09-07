import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Search, Plus, X, Check, Loader2, RefreshCw, Trash2,
  MoreVertical, CheckCircle2, Mail, User, UserCheck, Info,
} from 'lucide-react';
import { InstituteAdminLayout } from '../components/InstituteAdminLayout';
import {
  fetchStudents, addStudent, removeStudent, updateStudentStatus,
  StudentRecord,
} from '../services/instituteAdminService';
import { useToast } from '@/shared/hooks/use-toast';
import { getSelectedExamId } from '@/shared/state/examContext';
import { EXAM_LABELS, type ExamType } from '@/shared/constants/examTypes';

// ─── Helpers ──────────────────────────────────────────────────────────────────

const getInitials = (name: string | null, email: string) =>
  (name ?? email).split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase();

const formatDate = (iso: string) => {
  try { return new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }); }
  catch { return '—'; }
};

// ─── Row Actions ──────────────────────────────────────────────────────────────

function StudentRowMenu({ isActive, onToggleStatus, onRemove }: {
  isActive: boolean;
  onToggleStatus: () => void;
  onRemove: () => void;
}) {
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
        <div className="absolute right-0 top-full mt-1 z-30 w-44 bg-white border border-brand-line rounded-xl shadow-sm py-1 overflow-hidden">
          <button
            onClick={() => { setOpen(false); onToggleStatus(); }}
            className="w-full flex items-center gap-2.5 px-3.5 py-3 text-sm font-medium text-brand-teal-600 hover:bg-brand-teal-50 transition-colors"
          >
            <UserCheck className="w-4 h-4" />
            {isActive ? 'Deactivate' : 'Activate'}
          </button>
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

// ─── Add Student Modal ────────────────────────────────────────────────────────

function AddStudentModal({ onClose, onAdded }: { onClose: () => void; onAdded: () => void }) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ studentName: '', studentEmail: '' });
  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm(prev => ({ ...prev, [k]: e.target.value }));

  // The backend has no per-enrollment exam field — it resolves exam_id purely
  // from the X-Exam-Id header (this institute's currently-selected exam, set by
  // ExamContextBar). Surfacing that here makes the otherwise-silent assumption
  // visible before submit, so an admin doesn't enroll into the wrong exam by
  // forgetting the topbar toggle was left switched.
  const selectedExamId = getSelectedExamId() as ExamType | null;
  const selectedExamLabel = selectedExamId ? (EXAM_LABELS[selectedExamId] ?? selectedExamId) : null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.studentName.trim() || !form.studentEmail.trim()) return;
    setLoading(true);
    try {
      const res = await addStudent(form);
      toast({
        title: 'Student Enrolled',
        description: res.data.inviteEmailSent
          ? `Invite sent to ${res.data.email}. They'll set a password and land on the dashboard.`
          : `${res.data.email} has been added to your institute. They already have an account and can log in directly.`,
      });
      onAdded();
      onClose();
    } catch (err: any) {
      const msg: string = err.message ?? '';

      if (msg.includes('already enrolled in your institute')) {
        toast({
          title: 'Already enrolled',
          description: 'This student is already part of your institute.',
          variant: 'destructive',
        });
      } else if (msg.includes('already enrolled at another institute')) {
        toast({
          title: 'Student unavailable',
          description: 'This student is currently enrolled at another institute and cannot be added here. Please contact TestCrack team for support.',
          variant: 'destructive',
        });
      } else if (msg.includes('non-student account')) {
        toast({
          title: 'Role conflict',
          description: 'This email belongs to a non-student account. Contact blinkgrid@gmail.com if this is a mistake.',
          variant: 'destructive',
        });
      } else {
        toast({
          title: 'Enrollment failed',
          description: msg || 'Something went wrong. Please try again.',
          variant: 'destructive',
        });
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-sm w-full max-w-md border border-brand-line">
        <div className="flex items-center justify-between gap-3 px-4 sm:px-6 py-5 border-b border-brand-line">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-brand-teal-50 rounded-lg shrink-0">
              <UserCheck className="w-5 h-5 text-brand-teal-600" />
            </div>
            <div>
              <h2 className="font-manrope font-bold text-brand-text text-base">Enroll New Student</h2>
              <p className="text-xs text-brand-text-mute mt-0.5">Student will receive an email invite to set their password</p>
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
                type="text" required value={form.studentName} onChange={set('studentName')}
                placeholder="Student full name"
                className="w-full pl-10 pr-4 py-3 bg-brand-bg-alt border border-brand-line rounded-lg text-sm text-brand-text transition-all focus:outline-none focus:ring-2 focus:ring-brand-teal-500/20 focus:border-brand-teal-500 placeholder:text-brand-text-mute"
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <label className="font-jetbrains text-xs font-semibold text-brand-text uppercase tracking-wider">Email Address *</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-brand-text-mute" />
              <input
                type="email" required value={form.studentEmail} onChange={set('studentEmail')}
                placeholder="student@email.com"
                className="w-full pl-10 pr-4 py-3 bg-brand-bg-alt border border-brand-line rounded-lg text-sm text-brand-text transition-all focus:outline-none focus:ring-2 focus:ring-brand-teal-500/20 focus:border-brand-teal-500 placeholder:text-brand-text-mute"
              />
            </div>
          </div>

          {selectedExamLabel && (
            <div className="flex items-start gap-2 bg-amber-50 border border-amber-100 rounded-lg p-3">
              <Info className="w-4 h-4 text-amber-500 mt-0.5 shrink-0" />
              <p className="text-xs text-amber-700 leading-relaxed">
                Enrolling into <strong>{selectedExamLabel}</strong> — this follows the Exam selector in the topbar. Switch it there first if this isn't the right exam for this student.
              </p>
            </div>
          )}

          <div className="flex items-start gap-2 bg-brand-teal-50 border border-brand-teal-100 rounded-lg p-3">
            <CheckCircle2 className="w-4 h-4 text-brand-teal-500 mt-0.5 shrink-0" />
            <p className="text-xs text-brand-teal-700 leading-relaxed">
              The student will receive a Supabase invite email. Once they accept and set a password, they'll have access to the Student dashboard.
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
              {loading ? 'Enrolling...' : 'Enroll & Send Invite'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Confirm Remove Dialog ────────────────────────────────────────────────────

function ConfirmRemoveDialog({ student, onConfirm, onCancel, loading }: {
  student: StudentRecord;
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
            <h3 className="font-manrope font-bold text-brand-text">Remove Student?</h3>
            <p className="text-xs text-brand-text-mute mt-0.5">{student.name ?? student.email}</p>
          </div>
        </div>
        <p className="text-sm text-brand-text">
          This will remove <strong>{student.email}</strong> from your institute. Their account will remain but they'll lose institute access.
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

export default function StudentOnboarding() {
  const { toast } = useToast();
  const [students, setStudents] = useState<StudentRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [removeTarget, setRemoveTarget] = useState<StudentRecord | null>(null);
  const [removeLoading, setRemoveLoading] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetchStudents();
      setStudents(res.data);
    } catch (err: any) {
      toast({ title: 'Failed to load students', description: err.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => { load(); }, [load]);

  const handleRemove = async () => {
    if (!removeTarget) return;
    setRemoveLoading(true);
    try {
      await removeStudent(removeTarget.userId);
      setStudents(prev => prev.filter(s => s.userId !== removeTarget.userId));
      toast({ title: '🗑️ Student Removed', description: `${removeTarget.email} has been removed.` });
      setRemoveTarget(null);
    } catch (err: any) {
      toast({ title: 'Failed to remove student', description: err.message, variant: 'destructive' });
    } finally {
      setRemoveLoading(false);
    }
  };

  const handleToggleStatus = async (student: StudentRecord) => {
    try {
      await updateStudentStatus(student.userId, !student.isActive);
      setStudents(prev => prev.map(s =>
        s.userId === student.userId ? { ...s, isActive: !s.isActive } : s
      ));
      toast({ title: student.isActive ? '⏸ Student Deactivated' : '✅ Student Activated', description: student.email });
    } catch (err: any) {
      toast({ title: 'Failed to update status', description: err.message, variant: 'destructive' });
    }
  };

  const filteredStudents = students.filter(s =>
    (s.name ?? '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <InstituteAdminLayout activeTab="students-onboard">
      {showAddModal && <AddStudentModal onClose={() => setShowAddModal(false)} onAdded={load} />}
      {removeTarget && (
        <ConfirmRemoveDialog
          student={removeTarget}
          onConfirm={handleRemove}
          onCancel={() => setRemoveTarget(null)}
          loading={removeLoading}
        />
      )}

          <div className="w-full max-w-[1200px] mx-auto space-y-6 p-4 sm:p-6 lg:p-8">

            {/* Header */}
            <div className="flex items-start justify-between gap-3">
              <div>
                <h1 className="font-manrope text-xl sm:text-2xl font-bold text-brand-text">Student Onboarding</h1>
                <p className="text-sm text-brand-text-mute mt-0.5">
                  {loading ? '...' : `${students.length} student${students.length !== 1 ? 's' : ''} enrolled in your institute`}
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
                  placeholder="Search students..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-brand-bg-alt border border-brand-line rounded-lg text-sm text-brand-text transition-all focus:outline-none focus:ring-2 focus:ring-brand-teal-500/20 focus:border-brand-teal-500 placeholder:text-brand-text-mute"
                />
              </div>
              <button
                onClick={() => setShowAddModal(true)}
                className="flex w-full sm:w-auto items-center justify-center gap-2 px-4 py-3 bg-brand-teal-600 hover:bg-brand-teal-700 text-white rounded-lg text-sm font-semibold transition-colors shadow-sm"
              >
                <Plus className="w-4 h-4" /> Add Student
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
                        <th className="pb-4 pt-2 font-jetbrains text-[11px] font-semibold uppercase tracking-wider pl-2">Student</th>
                        <th className="pb-4 pt-2 font-jetbrains text-[11px] font-semibold uppercase tracking-wider">Contact</th>
                        <th className="pb-4 pt-2 font-jetbrains text-[11px] font-semibold uppercase tracking-wider">Enrolled</th>
                        <th className="pb-4 pt-2 font-jetbrains text-[11px] font-semibold uppercase tracking-wider">Status</th>
                        <th className="pb-4 pt-2 font-jetbrains text-[11px] font-semibold uppercase tracking-wider text-right pr-2">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-brand-line">
                      {filteredStudents.map((student) => (
                        <tr key={student.id} className="hover:bg-brand-bg-alt transition-colors group">
                          <td className="py-4 pl-2">
                            <div className="flex items-center gap-3">
                              {student.profileImage ? (
                                <img src={student.profileImage} alt="" className="w-9 h-9 rounded-md object-cover shrink-0" />
                              ) : (
                                <div className="w-9 h-9 rounded-md bg-brand-teal-100 text-brand-teal-700 flex items-center justify-center text-xs font-bold shrink-0">
                                  {getInitials(student.name, student.email)}
                                </div>
                              )}
                              <div>
                                <div className="font-semibold text-sm text-brand-text">
                                  {student.name ?? <span className="italic text-brand-text-mute font-normal">No name yet</span>}
                                </div>
                                <div className="text-xs text-brand-text-mute mt-0.5">{student.email}</div>
                              </div>
                            </div>
                          </td>
                          <td className="py-4">
                            <div className="text-sm text-brand-text">{student.phone ?? '—'}</div>
                          </td>
                          <td className="py-4">
                            <div className="text-xs text-brand-text-mute">{formatDate(student.enrolledAt)}</div>
                          </td>
                          <td className="py-4">
                            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded font-jetbrains text-[10px] font-bold tracking-wider ${
                              student.isActive
                                ? 'bg-emerald-100 text-emerald-700'
                                : 'bg-amber-100 text-amber-700'
                            }`}>
                              <span className={`w-1.5 h-1.5 rounded-full ${student.isActive ? 'bg-emerald-500' : 'bg-amber-500'}`} />
                              {student.isActive ? 'ACTIVE' : 'INACTIVE'}
                            </span>
                          </td>
                          <td className="py-4 text-right pr-2">
                            <StudentRowMenu
                              isActive={student.isActive}
                              onToggleStatus={() => handleToggleStatus(student)}
                              onRemove={() => setRemoveTarget(student)}
                            />
                          </td>
                        </tr>
                      ))}
                      {filteredStudents.length === 0 && !loading && (
                        <tr>
                          <td colSpan={5} className="py-12 text-center">
                            <UserCheck className="w-12 h-12 text-brand-line mx-auto mb-3" />
                            <p className="text-brand-text-mute text-sm">
                              {searchQuery ? `No students matching "${searchQuery}"` : 'No students yet. Add one to get started.'}
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