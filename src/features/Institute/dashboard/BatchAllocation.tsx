import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Plus, X, Loader2, RefreshCw, Trash2, MoreVertical,
  Users, GraduationCap, Layers, CheckCircle2, ChevronRight,
  UserMinus, UserPlus, Edit2, Check,
} from 'lucide-react';
import { InstituteAdminLayout } from '../components/InstituteAdminLayout';
import {
  fetchBatches, fetchBatchDetail, createBatch, updateBatch, deleteBatch,
  addInstructor as batchAddInstructor,
  removeInstructor as batchRemoveInstructor,
  addStudent as batchAddStudent,
  removeStudent as batchRemoveStudent,
  BatchSummary, BatchDetail, BatchMember, BatchStatus,
} from '../services/batchService';
import { fetchTutors, fetchStudents, TutorRecord, StudentRecord } from '../services/instituteAdminService';
import { useToast } from '@/shared/hooks/use-toast';

// ─── Helpers ──────────────────────────────────────────────────────────────────

const getInitials = (name: string | null, email: string) =>
  (name ?? email).split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase();

const STATUS_CONFIG: Record<BatchStatus, { label: string; cls: string }> = {
  ACTIVE:    { label: 'Active',    cls: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' },
  INACTIVE:  { label: 'Inactive',  cls: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' },
  COMPLETED: { label: 'Completed', cls: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400' },
};

// ─── Create / Edit Batch Modal ────────────────────────────────────────────────

interface BatchFormModalProps {
  initial?: BatchSummary;
  onClose: () => void;
  onSaved: (batch: BatchSummary) => void;
}

function BatchFormModal({ initial, onClose, onSaved }: BatchFormModalProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    name: initial?.name ?? '',
    description: initial?.description ?? '',
    status: initial?.status ?? 'ACTIVE' as BatchStatus,
    maxStudents: initial?.maxStudents?.toString() ?? '',
  });
  const isEdit = !!initial;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) return;
    setLoading(true);
    try {
      const payload = {
        name: form.name.trim(),
        description: form.description.trim() || undefined,
        status: form.status,
        maxStudents: form.maxStudents ? parseInt(form.maxStudents) : null,
      };

      let result: BatchSummary;
      if (isEdit && initial) {
        const res = await updateBatch(initial.id, payload);
        result = { ...initial, ...res.data, instructorCount: initial.instructorCount, studentCount: initial.studentCount, instructors: initial.instructors, createdAt: initial.createdAt };
      } else {
        const res = await createBatch(payload);
        result = res.data;
      }
      toast({ title: isEdit ? '✅ Batch Updated' : '✅ Batch Created', description: result.name });
      onSaved(result);
      onClose();
    } catch (err: any) {
      toast({ title: 'Failed', description: err.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white dark:bg-[#15141B] rounded-2xl shadow-2xl w-full max-w-md border border-slate-200 dark:border-[#26252D]">
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100 dark:border-[#26252D]">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-brand-teal-50 dark:bg-brand-teal-900/30 rounded-lg">
              <Layers className="w-5 h-5 text-brand-teal-600 dark:text-brand-teal-400" />
            </div>
            <div>
              <h2 className="font-bold text-slate-900 dark:text-white">{isEdit ? 'Edit Batch' : 'New Batch'}</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                {isEdit ? 'Update batch details' : 'Create a new student batch'}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-white/10 text-slate-400 transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Batch Name *</label>
            <input
              type="text" required value={form.name}
              onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
              placeholder="e.g. IELTS Morning Batch 12"
              className="w-full bg-slate-50 dark:bg-[#0A0A0B] border border-slate-200 dark:border-[#26252D] rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-brand-teal-500 dark:text-white placeholder-slate-400"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Description</label>
            <textarea
              value={form.description}
              onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
              placeholder="Optional details about this batch…"
              rows={2}
              className="w-full bg-slate-50 dark:bg-[#0A0A0B] border border-slate-200 dark:border-[#26252D] rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-brand-teal-500 dark:text-white placeholder-slate-400 resize-none"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Status</label>
              <select value={form.status} onChange={e => setForm(p => ({ ...p, status: e.target.value as BatchStatus }))}
                className="w-full bg-slate-50 dark:bg-[#0A0A0B] border border-slate-200 dark:border-[#26252D] rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-brand-teal-500 dark:text-white">
                <option value="ACTIVE">Active</option>
                <option value="INACTIVE">Inactive</option>
                <option value="COMPLETED">Completed</option>
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Max Students</label>
              <input type="number" min={1} value={form.maxStudents}
                onChange={e => setForm(p => ({ ...p, maxStudents: e.target.value }))}
                placeholder="Unlimited"
                className="w-full bg-slate-50 dark:bg-[#0A0A0B] border border-slate-200 dark:border-[#26252D] rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-brand-teal-500 dark:text-white placeholder-slate-400"
              />
            </div>
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose}
              className="flex-1 py-2.5 rounded-lg border border-slate-200 dark:border-[#26252D] text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-white/5 transition-colors">
              Cancel
            </button>
            <button type="submit" disabled={loading}
              className="flex-1 py-2.5 rounded-lg bg-brand-teal-600 hover:bg-brand-teal-700 text-white text-sm font-semibold transition-colors flex items-center justify-center gap-2 disabled:opacity-60">
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
              {loading ? 'Saving…' : isEdit ? 'Save Changes' : 'Create Batch'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Batch Row Actions ────────────────────────────────────────────────────────

function BatchRowMenu({ onEdit, onDelete }: { onEdit: () => void; onDelete: () => void }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const h = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    if (open) document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, [open]);
  return (
    <div ref={ref} className="relative">
      <button onClick={() => setOpen(v => !v)}
        className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-white/10 text-slate-400 hover:text-slate-700 dark:hover:text-white transition-colors">
        <MoreVertical className="w-4 h-4" />
      </button>
      {open && (
        <div className="absolute right-0 top-full mt-1 z-30 w-36 bg-white dark:bg-[#1E1D27] border border-slate-200 dark:border-[#2E2D3A] rounded-xl shadow-xl py-1">
          <button onClick={() => { setOpen(false); onEdit(); }}
            className="w-full flex items-center gap-2.5 px-3.5 py-2.5 text-sm font-medium text-brand-teal-600 dark:text-brand-teal-400 hover:bg-brand-teal-50 dark:hover:bg-brand-teal-900/20 transition-colors">
            <Edit2 className="w-3.5 h-3.5" /> Edit
          </button>
          <button onClick={() => { setOpen(false); onDelete(); }}
            className="w-full flex items-center gap-2.5 px-3.5 py-2.5 text-sm font-medium text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-900/20 transition-colors">
            <Trash2 className="w-3.5 h-3.5" /> Delete
          </button>
        </div>
      )}
    </div>
  );
}

// ─── Batch Detail Panel ───────────────────────────────────────────────────────

type DetailTab = 'instructors' | 'students';

interface MemberRowProps {
  member: BatchMember;
  accentColor: 'purple' | 'indigo';
  onRemove: () => void;
  removing: boolean;
}

function MemberRow({ member, accentColor, onRemove, removing }: MemberRowProps) {
  const bg = accentColor === 'purple'
    ? 'bg-brand-blue-100 dark:bg-[#142B3A] text-brand-blue-700 dark:text-[#D97CFF]'
    : 'bg-brand-teal-100 dark:bg-[#1C1A2F] text-brand-teal-700 dark:text-[#256B8B]';
  return (
    <div className="flex items-center gap-3 py-2.5 px-3 rounded-xl hover:bg-slate-50 dark:hover:bg-white/[0.03] transition-colors group">
      {member.profileImage ? (
        <img src={member.profileImage} alt="" className="w-8 h-8 rounded-lg object-cover shrink-0" />
      ) : (
        <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold shrink-0 ${bg}`}>
          {getInitials(member.name, member.email)}
        </div>
      )}
      <div className="min-w-0 flex-1">
        <div className="text-sm font-medium text-slate-900 dark:text-gray-200 truncate">
          {member.name ?? <span className="italic text-slate-400 text-xs font-normal">No name</span>}
        </div>
        <div className="text-xs text-slate-500 dark:text-gray-500 truncate">{member.email}</div>
      </div>
      <button onClick={onRemove} disabled={removing}
        className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg text-rose-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/20 transition-all disabled:opacity-40">
        {removing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <UserMinus className="w-3.5 h-3.5" />}
      </button>
    </div>
  );
}

interface AddMemberModalProps {
  label: string;
  candidates: { userId: string; name: string | null; email: string }[];
  onAdd: (userId: string) => Promise<void>;
  adding: boolean;
}

function AddMemberModal({ label, candidates, onAdd, adding }: AddMemberModalProps) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button onClick={() => setOpen(true)} disabled={adding}
        className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-brand-teal-700 dark:text-brand-teal-300 bg-brand-teal-50 dark:bg-brand-teal-900/30 hover:bg-brand-teal-100 dark:hover:bg-brand-teal-900/50 rounded-lg transition-colors border border-brand-teal-200 dark:border-brand-teal-800/50 disabled:opacity-50">
        {adding ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <UserPlus className="w-3.5 h-3.5" />}
        {label}
      </button>
      {open && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-[#15141B] rounded-2xl shadow-2xl w-full max-w-md border border-slate-200 dark:border-[#26252D] flex flex-col max-h-[80vh]">
            <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100 dark:border-[#26252D]">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-brand-teal-50 dark:bg-brand-teal-900/30 rounded-lg">
                  <UserPlus className="w-5 h-5 text-brand-teal-600 dark:text-brand-teal-400" />
                </div>
                <h2 className="font-bold text-slate-900 dark:text-white">{label}</h2>
              </div>
              <button onClick={() => setOpen(false)} className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-white/10 text-slate-400 transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-3">
              {candidates.length === 0 ? (
                <div className="p-8 text-center text-sm text-slate-500 dark:text-slate-400">
                  No available members to add.
                </div>
              ) : (
                <div className="space-y-1">
                  {candidates.map(c => (
                    <button key={c.userId}
                      onClick={() => { setOpen(false); onAdd(c.userId); }}
                      className="group w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-slate-50 dark:hover:bg-white/5 transition-colors text-left"
                    >
                      <div className="w-10 h-10 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-sm font-bold shrink-0 text-slate-600 dark:text-slate-300">
                        {getInitials(c.name, c.email)}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="text-sm font-semibold text-slate-900 dark:text-gray-200 truncate">{c.name ?? '—'}</div>
                        <div className="text-xs text-slate-500 dark:text-slate-400 truncate">{c.email}</div>
                      </div>
                      <div className="w-8 h-8 rounded-full bg-brand-teal-50 dark:bg-brand-teal-900/30 text-brand-teal-600 dark:text-brand-teal-400 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <Plus className="w-4 h-4" />
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}

interface BatchDetailPanelProps {
  batchId: string;
  batchName: string;
  onClose: () => void;
  allTutors: TutorRecord[];
  allStudents: StudentRecord[];
}

function BatchDetailPanel({ batchId, batchName, onClose, allTutors, allStudents }: BatchDetailPanelProps) {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<DetailTab>('instructors');
  const [detail, setDetail] = useState<BatchDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [addingMember, setAddingMember] = useState(false);
  const [removingId, setRemovingId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetchBatchDetail(batchId);
      setDetail(res.data);
    } catch (err: any) {
      toast({ title: 'Failed to load batch', description: err.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  }, [batchId, toast]);

  useEffect(() => { load(); }, [load]);

  const handleAddInstructor = async (userId: string) => {
    setAddingMember(true);
    try {
      const res = await batchAddInstructor(batchId, userId);
      setDetail(prev => prev ? { ...prev, instructors: [...prev.instructors, { ...res.data, assignedAt: new Date().toISOString() }] } : null);
      toast({ title: '✅ Instructor assigned successfully' });
    } catch (err: any) {
      toast({ title: 'Failed to assign instructor', description: err.message, variant: 'destructive' });
    } finally {
      setAddingMember(false);
    }
  };

  const handleRemoveInstructor = async (userId: string) => {
    setRemovingId(userId);
    try {
      await batchRemoveInstructor(batchId, userId);
      setDetail(prev => prev ? { ...prev, instructors: prev.instructors.filter(i => i.userId !== userId) } : null);
      toast({ title: 'Instructor removed' });
    } catch (err: any) {
      toast({ title: 'Failed to remove', description: err.message, variant: 'destructive' });
    } finally {
      setRemovingId(null);
    }
  };

  const handleAddStudent = async (userId: string) => {
    setAddingMember(true);
    try {
      const res = await batchAddStudent(batchId, userId);
      setDetail(prev => prev ? { ...prev, students: [...prev.students, { ...res.data, enrolledAt: new Date().toISOString() }] } : null);
      toast({ title: '✅ Student enrolled in batch' });
    } catch (err: any) {
      toast({ title: 'Failed to enroll student', description: err.message, variant: 'destructive' });
    } finally {
      setAddingMember(false);
    }
  };

  const handleRemoveStudent = async (userId: string) => {
    setRemovingId(userId);
    try {
      await batchRemoveStudent(batchId, userId);
      setDetail(prev => prev ? { ...prev, students: prev.students.filter(s => s.userId !== userId) } : null);
      toast({ title: 'Student removed from batch' });
    } catch (err: any) {
      toast({ title: 'Failed to remove', description: err.message, variant: 'destructive' });
    } finally {
      setRemovingId(null);
    }
  };

  // Candidates = institute members NOT already in this batch
  const assignedInstructorIds = new Set(detail?.instructors.map(i => i.userId) ?? []);
  const assignedStudentIds = new Set(detail?.students.map(s => s.userId) ?? []);
  const availableInstructors = allTutors.filter(t => !assignedInstructorIds.has(t.userId));
  const availableStudents = allStudents.filter(s => !assignedStudentIds.has(s.userId));

  return (
    <div className="fixed inset-y-0 right-0 z-40 w-full max-w-[420px] bg-white dark:bg-[#15141B] border-l border-slate-200 dark:border-[#26252D] shadow-2xl flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 dark:border-[#26252D] shrink-0">
        <div>
          <h3 className="font-bold text-slate-900 dark:text-white text-base truncate max-w-[300px]">{batchName}</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Manage members</p>
        </div>
        <button onClick={onClose} className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-white/10 text-slate-400 transition-colors">
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 px-5 pt-3 pb-0 border-b border-slate-100 dark:border-[#26252D] shrink-0">
        {([
          { key: 'instructors', label: 'Instructors', icon: Users, count: detail?.instructors.length ?? 0 },
          { key: 'students', label: 'Students', icon: GraduationCap, count: detail?.students.length ?? 0 },
        ] as const).map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`pb-3 px-3 text-sm font-medium flex items-center gap-2 relative transition-colors ${
              activeTab === tab.key
                ? 'text-brand-teal-600 dark:text-white'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
            }`}
          >
            <tab.icon className="w-3.5 h-3.5" />
            {tab.label}
            <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
              activeTab === tab.key
                ? 'bg-brand-teal-100 dark:bg-brand-teal-900/40 text-brand-teal-600 dark:text-brand-teal-300'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
            }`}>{tab.count}</span>
            {activeTab === tab.key && (
              <div className="absolute bottom-0 left-0 w-full h-0.5 bg-brand-teal-600 dark:bg-white rounded-t-full" />
            )}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="flex justify-center py-16">
            <Loader2 className="w-6 h-6 animate-spin text-brand-teal-500" />
          </div>
        ) : (
          <div className="p-4 space-y-1">
            {activeTab === 'instructors' && (
              <>
                {detail?.instructors.map(member => (
                  <MemberRow key={member.userId} member={member} accentColor="purple"
                    onRemove={() => handleRemoveInstructor(member.userId)}
                    removing={removingId === member.userId}
                  />
                ))}
                {detail?.instructors.length === 0 && (
                  <div className="py-8 text-center">
                    <Users className="w-10 h-10 text-slate-200 dark:text-slate-700 mx-auto mb-2" />
                    <p className="text-sm text-slate-500 dark:text-slate-400">No instructors assigned yet.</p>
                  </div>
                )}
              </>
            )}
            {activeTab === 'students' && (
              <>
                {detail?.students.map(member => (
                  <MemberRow key={member.userId} member={member} accentColor="indigo"
                    onRemove={() => handleRemoveStudent(member.userId)}
                    removing={removingId === member.userId}
                  />
                ))}
                {detail?.students.length === 0 && (
                  <div className="py-8 text-center">
                    <GraduationCap className="w-10 h-10 text-slate-200 dark:text-slate-700 mx-auto mb-2" />
                    <p className="text-sm text-slate-500 dark:text-slate-400">No students enrolled yet.</p>
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </div>

      {/* Add Member Footer */}
      <div className="px-5 py-4 border-t border-slate-100 dark:border-[#26252D] shrink-0 flex justify-end">
        {activeTab === 'instructors' ? (
          <AddMemberModal
            label="Assign Instructor"
            candidates={availableInstructors.map(t => ({ userId: t.userId, name: t.name, email: t.email }))}
            onAdd={handleAddInstructor}
            adding={addingMember}
          />
        ) : (
          <AddMemberModal
            label="Enroll Student"
            candidates={availableStudents.map(s => ({ userId: s.userId, name: s.name, email: s.email }))}
            onAdd={handleAddStudent}
            adding={addingMember}
          />
        )}
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function BatchAllocation() {
  const { toast } = useToast();
  const [batches, setBatches] = useState<BatchSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editTarget, setEditTarget] = useState<BatchSummary | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<BatchSummary | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [selectedBatchId, setSelectedBatchId] = useState<string | null>(null);

  // For member management dropdowns — load institute members once
  const [allTutors, setAllTutors] = useState<TutorRecord[]>([]);
  const [allStudents, setAllStudents] = useState<StudentRecord[]>([]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [batchRes, tutorRes, studentRes] = await Promise.all([
        fetchBatches(),
        fetchTutors(),
        fetchStudents(),
      ]);
      setBatches(batchRes.data);
      setAllTutors(tutorRes.data);
      setAllStudents(studentRes.data);
    } catch (err: any) {
      toast({ title: 'Failed to load data', description: err.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => { load(); }, [load]);

  const handleBatchSaved = (batch: BatchSummary) => {
    setBatches(prev => {
      const idx = prev.findIndex(b => b.id === batch.id);
      if (idx >= 0) { const next = [...prev]; next[idx] = batch; return next; }
      return [batch, ...prev];
    });
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleteLoading(true);
    try {
      await deleteBatch(deleteTarget.id);
      setBatches(prev => prev.filter(b => b.id !== deleteTarget.id));
      if (selectedBatchId === deleteTarget.id) setSelectedBatchId(null);
      toast({ title: '🗑️ Batch Deleted', description: deleteTarget.name });
      setDeleteTarget(null);
    } catch (err: any) {
      toast({ title: 'Failed to delete', description: err.message, variant: 'destructive' });
    } finally {
      setDeleteLoading(false);
    }
  };

  const selectedBatch = batches.find(b => b.id === selectedBatchId);

  return (
    <InstituteAdminLayout activeTab="batches">
      {/* Modals */}
      {(showForm || editTarget) && (
        <BatchFormModal
          initial={editTarget ?? undefined}
          onClose={() => { setShowForm(false); setEditTarget(null); }}
          onSaved={handleBatchSaved}
        />
      )}

      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-[#15141B] rounded-2xl shadow-2xl w-full max-w-sm border border-slate-200 dark:border-[#26252D] p-6 space-y-5">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-rose-50 dark:bg-rose-900/30 rounded-lg">
                <Trash2 className="w-5 h-5 text-rose-600 dark:text-rose-400" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 dark:text-white">Delete Batch?</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{deleteTarget.name}</p>
              </div>
            </div>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              This will permanently delete <strong>{deleteTarget.name}</strong> and remove all {deleteTarget.studentCount} enrolled students and {deleteTarget.instructorCount} instructor assignments.
            </p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteTarget(null)} className="flex-1 py-2.5 rounded-lg border border-slate-200 dark:border-[#26252D] text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-white/5 transition-colors">
                Cancel
              </button>
              <button onClick={handleDelete} disabled={deleteLoading}
                className="flex-1 py-2.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-sm font-semibold transition-colors flex items-center justify-center gap-2 disabled:opacity-60">
                {deleteLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                {deleteLoading ? 'Deleting…' : 'Yes, Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Detail Panel overlay */}
      {selectedBatchId && selectedBatch && (
        <>
          <div className="fixed inset-0 z-30 bg-black/20 dark:bg-black/40" onClick={() => setSelectedBatchId(null)} />
          <BatchDetailPanel
            batchId={selectedBatchId}
            batchName={selectedBatch.name}
            onClose={() => setSelectedBatchId(null)}
            allTutors={allTutors}
            allStudents={allStudents}
          />
        </>
      )}

          <div className="max-w-[1200px] mx-auto space-y-6">

            {/* Header */}
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Batch Allocation</h1>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
                  {loading ? '…' : `${batches.length} batch${batches.length !== 1 ? 'es' : ''} · Click a row to manage members`}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={load} className="p-2 rounded-lg text-slate-400 hover:text-brand-teal-600 hover:bg-slate-100 dark:hover:bg-white/5 transition-colors" title="Refresh">
                  <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                </button>
                <button onClick={() => setShowForm(true)}
                  className="flex items-center gap-2 px-4 py-2.5 bg-brand-teal-600 hover:bg-brand-teal-700 dark:bg-[#185A78] dark:hover:bg-[#185A78] text-white rounded-lg text-sm font-medium transition-colors shadow-sm">
                  <Plus className="w-4 h-4" /> New Batch
                </button>
              </div>
            </div>

            {/* Stats Row */}
            {!loading && batches.length > 0 && (
              <div className="grid grid-cols-3 gap-4">
                {[
                  { label: 'Total Batches', value: batches.length, color: 'indigo' },
                  { label: 'Active',         value: batches.filter(b => b.status === 'ACTIVE').length, color: 'emerald' },
                  { label: 'Total Students', value: batches.reduce((a, b) => a + b.studentCount, 0), color: 'purple' },
                ].map(stat => (
                  <div key={stat.label} className="bg-white dark:bg-[#15141B] border border-slate-200 dark:border-[#26252D] rounded-xl p-4">
                    <p className="text-xs font-medium text-slate-500 dark:text-slate-400">{stat.label}</p>
                    <p className={`text-2xl font-bold mt-1 text-${stat.color}-600 dark:text-${stat.color}-400`}>{stat.value}</p>
                  </div>
                ))}
              </div>
            )}

            {/* Batch Table */}
            <div className="bg-white dark:bg-transparent border border-slate-200 dark:border-transparent rounded-xl shadow-sm dark:shadow-none overflow-hidden">
              {loading ? (
                <div className="py-16 flex justify-center">
                  <Loader2 className="w-6 h-6 animate-spin text-brand-teal-500" />
                </div>
              ) : batches.length === 0 ? (
                <div className="py-16 text-center">
                  <Layers className="w-14 h-14 text-slate-200 dark:text-slate-700 mx-auto mb-3" />
                  <p className="text-slate-700 dark:text-slate-300 font-semibold">No batches yet</p>
                  <p className="text-sm text-slate-500 dark:text-slate-500 mt-1">Create your first batch to start allocating students.</p>
                  <button onClick={() => setShowForm(true)} className="mt-4 flex items-center gap-2 mx-auto px-4 py-2 bg-brand-teal-600 hover:bg-brand-teal-700 text-white rounded-lg text-sm font-medium transition-colors">
                    <Plus className="w-4 h-4" /> Create Batch
                  </button>
                </div>
              ) : (
                <div className="w-full overflow-x-auto px-4 py-2">
                  <table className="w-full text-left border-collapse min-w-[640px]">
                    <thead>
                      <tr className="border-b border-slate-100 dark:border-gray-800 text-slate-500 dark:text-gray-500 text-sm">
                        <th className="pb-4 font-semibold dark:font-normal pl-2">Batch Name</th>
                        <th className="pb-4 font-semibold dark:font-normal">Status</th>
                        <th className="pb-4 font-semibold dark:font-normal">Instructors</th>
                        <th className="pb-4 font-semibold dark:font-normal">Students</th>
                        <th className="pb-4 font-semibold dark:font-normal">Capacity</th>
                        <th className="pb-4 font-semibold dark:font-normal text-right pr-2">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-gray-800/50">
                      {batches.map(batch => {
                        const statusCfg = STATUS_CONFIG[batch.status] ?? STATUS_CONFIG.ACTIVE;
                        const isSelected = selectedBatchId === batch.id;
                        return (
                          <tr
                            key={batch.id}
                            onClick={() => setSelectedBatchId(isSelected ? null : batch.id)}
                            className={`hover:bg-slate-50 dark:hover:bg-white/[0.02] transition-colors cursor-pointer ${isSelected ? 'bg-brand-teal-50/50 dark:bg-brand-teal-900/10' : ''}`}
                          >
                            <td className="py-4 pl-2">
                              <div className="flex items-center gap-2">
                                <div className="w-8 h-8 rounded-lg bg-brand-teal-100 dark:bg-[#1C1A2F] text-brand-teal-700 dark:text-[#256B8B] flex items-center justify-center shrink-0">
                                  <Layers className="w-4 h-4" />
                                </div>
                                <div>
                                  <div className="font-semibold text-sm text-slate-900 dark:text-gray-200">{batch.name}</div>
                                  {batch.description && (
                                    <div className="text-xs text-slate-500 dark:text-gray-500 mt-0.5 truncate max-w-[200px]">{batch.description}</div>
                                  )}
                                </div>
                              </div>
                            </td>
                            <td className="py-4">
                              <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold tracking-wider ${statusCfg.cls}`}>
                                <span className="w-1.5 h-1.5 rounded-full bg-current" />
                                {statusCfg.label.toUpperCase()}
                              </span>
                            </td>
                            <td className="py-4">
                              <div className="flex items-center gap-2">
                                {/* Instructor avatar stack */}
                                <div className="flex -space-x-2">
                                  {batch.instructors.slice(0, 3).map(i => (
                                    <div key={i.userId} className="w-6 h-6 rounded-full bg-brand-blue-100 dark:bg-brand-blue-900/40 border-2 border-white dark:border-[#0B0A10] text-brand-blue-700 dark:text-brand-blue-300 text-[8px] font-bold flex items-center justify-center">
                                      {getInitials(i.name, i.email)}
                                    </div>
                                  ))}
                                </div>
                                <span className="text-sm text-slate-600 dark:text-slate-400">{batch.instructorCount}</span>
                              </div>
                            </td>
                            <td className="py-4">
                              <span className="text-sm font-semibold text-brand-teal-600 dark:text-brand-teal-400">{batch.studentCount}</span>
                            </td>
                            <td className="py-4">
                              {batch.maxStudents ? (
                                <div className="flex items-center gap-2">
                                  <div className="w-20 h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                                    <div
                                      className="h-full bg-brand-teal-500 rounded-full"
                                      style={{ width: `${Math.min(100, (batch.studentCount / batch.maxStudents) * 100)}%` }}
                                    />
                                  </div>
                                  <span className="text-xs text-slate-500 dark:text-slate-400 whitespace-nowrap">
                                    {batch.studentCount}/{batch.maxStudents}
                                  </span>
                                </div>
                              ) : (
                                <span className="text-xs text-slate-400 dark:text-slate-600">Unlimited</span>
                              )}
                            </td>
                            <td className="py-4 text-right pr-2" onClick={e => e.stopPropagation()}>
                              <div className="flex items-center justify-end gap-1">
                                <button
                                  onClick={() => setSelectedBatchId(isSelected ? null : batch.id)}
                                  className="p-1.5 rounded-lg text-slate-400 hover:text-brand-teal-600 hover:bg-brand-teal-50 dark:hover:bg-brand-teal-900/20 transition-colors"
                                  title="Manage members"
                                >
                                  <ChevronRight className={`w-4 h-4 transition-transform ${isSelected ? 'rotate-90' : ''}`} />
                                </button>
                                <BatchRowMenu
                                  onEdit={() => setEditTarget(batch)}
                                  onDelete={() => setDeleteTarget(batch)}
                                />
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Tip */}
            {!loading && batches.length > 0 && (
              <div className="flex items-start gap-2 bg-brand-teal-50 dark:bg-brand-teal-900/10 border border-brand-teal-100 dark:border-brand-teal-800/30 rounded-xl p-4">
                <CheckCircle2 className="w-4 h-4 text-brand-teal-500 mt-0.5 shrink-0" />
                <p className="text-xs text-brand-teal-700 dark:text-brand-teal-300">
                  Click any batch row or the <ChevronRight className="w-3 h-3 inline" /> button to open the member panel. The same instructor can be assigned to multiple batches.
                </p>
              </div>
            )}
          </div>
    </InstituteAdminLayout>
  );
}
