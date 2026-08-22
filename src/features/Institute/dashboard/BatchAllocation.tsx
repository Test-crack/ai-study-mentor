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
  ACTIVE:    { label: 'Active',    cls: 'bg-emerald-100 text-emerald-700' },
  INACTIVE:  { label: 'Inactive',  cls: 'bg-amber-100 text-amber-700' },
  COMPLETED: { label: 'Completed', cls: 'bg-brand-bg-alt text-brand-text-mute' },
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-brand-ink/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-sm w-full max-w-md max-h-[90vh] overflow-y-auto border border-brand-line">
        <div className="flex items-center justify-between px-4 sm:px-6 py-4 sm:py-5 border-b border-brand-line">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-brand-teal-50 rounded-lg shrink-0">
              <Layers className="w-5 h-5 text-brand-teal-600" />
            </div>
            <div>
              <h2 className="font-bold text-brand-text">{isEdit ? 'Edit Batch' : 'New Batch'}</h2>
              <p className="text-xs text-brand-text-mute mt-0.5">
                {isEdit ? 'Update batch details' : 'Create a new student batch'}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-brand-bg-alt text-brand-text-mute hover:text-brand-text transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-4">
          <div className="space-y-1.5">
            <label className="font-jetbrains text-xs font-semibold text-brand-text-mute uppercase tracking-wider">Batch Name *</label>
            <input
              type="text" required value={form.name}
              onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
              placeholder="e.g. IELTS Morning Batch 12"
              className="w-full bg-brand-bg-alt border border-brand-line rounded-lg px-3 py-2.5 min-h-[40px] text-sm text-brand-text focus:outline-none focus:border-brand-teal-500 placeholder-brand-text-mute"
            />
          </div>
          <div className="space-y-1.5">
            <label className="font-jetbrains text-xs font-semibold text-brand-text-mute uppercase tracking-wider">Description</label>
            <textarea
              value={form.description}
              onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
              placeholder="Optional details about this batch…"
              rows={2}
              className="w-full bg-brand-bg-alt border border-brand-line rounded-lg px-3 py-2.5 text-sm text-brand-text focus:outline-none focus:border-brand-teal-500 placeholder-brand-text-mute resize-none"
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="font-jetbrains text-xs font-semibold text-brand-text-mute uppercase tracking-wider">Status</label>
              <select value={form.status} onChange={e => setForm(p => ({ ...p, status: e.target.value as BatchStatus }))}
                className="w-full bg-brand-bg-alt border border-brand-line rounded-lg px-3 py-2.5 min-h-[40px] text-sm text-brand-text focus:outline-none focus:border-brand-teal-500">
                <option value="ACTIVE">Active</option>
                <option value="INACTIVE">Inactive</option>
                <option value="COMPLETED">Completed</option>
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="font-jetbrains text-xs font-semibold text-brand-text-mute uppercase tracking-wider">Max Students</label>
              <input type="number" min={1} value={form.maxStudents}
                onChange={e => setForm(p => ({ ...p, maxStudents: e.target.value }))}
                placeholder="Unlimited"
                className="w-full bg-brand-bg-alt border border-brand-line rounded-lg px-3 py-2.5 min-h-[40px] text-sm text-brand-text focus:outline-none focus:border-brand-teal-500 placeholder-brand-text-mute"
              />
            </div>
          </div>
          <div className="flex flex-col-reverse sm:flex-row gap-3 pt-2">
            <button type="button" onClick={onClose}
              className="flex-1 py-2.5 min-h-[40px] rounded-lg border border-brand-line text-sm font-medium text-brand-text hover:bg-brand-bg-alt transition-colors">
              Cancel
            </button>
            <button type="submit" disabled={loading}
              className="flex-1 py-2.5 min-h-[40px] rounded-lg bg-brand-teal-600 hover:bg-brand-teal-700 text-white text-sm font-semibold transition-colors flex items-center justify-center gap-2 disabled:opacity-60">
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
        className="p-2 rounded-lg hover:bg-brand-bg-alt text-brand-text-mute hover:text-brand-text transition-colors">
        <MoreVertical className="w-4 h-4" />
      </button>
      {open && (
        <div className="absolute right-0 top-full mt-1 z-30 w-36 bg-white border border-brand-line rounded-xl shadow-sm py-1">
          <button onClick={() => { setOpen(false); onEdit(); }}
            className="w-full flex items-center gap-2.5 px-3.5 py-2.5 min-h-[40px] text-sm font-medium text-brand-teal-600 hover:bg-brand-teal-50 transition-colors">
            <Edit2 className="w-3.5 h-3.5" /> Edit
          </button>
          <button onClick={() => { setOpen(false); onDelete(); }}
            className="w-full flex items-center gap-2.5 px-3.5 py-2.5 min-h-[40px] text-sm font-medium text-rose-600 hover:bg-rose-50 transition-colors">
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
    ? 'bg-brand-blue-100 text-brand-blue-700'
    : 'bg-brand-teal-100 text-brand-teal-700';
  return (
    <div className="flex items-center gap-3 py-2.5 px-3 rounded-xl hover:bg-brand-bg-alt transition-colors group">
      {member.profileImage ? (
        <img src={member.profileImage} alt="" className="w-8 h-8 rounded-lg object-cover shrink-0" />
      ) : (
        <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold shrink-0 ${bg}`}>
          {getInitials(member.name, member.email)}
        </div>
      )}
      <div className="min-w-0 flex-1">
        <div className="text-sm font-medium text-brand-text truncate">
          {member.name ?? <span className="italic text-brand-text-mute text-xs font-normal">No name</span>}
        </div>
        <div className="text-xs text-brand-text-mute truncate">{member.email}</div>
      </div>
      <button onClick={onRemove} disabled={removing}
        className="opacity-100 sm:opacity-0 sm:group-hover:opacity-100 p-2 rounded-lg text-rose-400 hover:text-rose-600 hover:bg-rose-50 transition-all disabled:opacity-40">
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
        className="flex items-center gap-1.5 px-3 py-1.5 min-h-[40px] text-xs font-semibold text-brand-teal-700 bg-brand-teal-50 hover:bg-brand-teal-100 rounded-lg transition-colors border border-brand-teal-200 disabled:opacity-50">
        {adding ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <UserPlus className="w-3.5 h-3.5" />}
        {label}
      </button>
      {open && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-brand-ink/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-sm w-full max-w-md border border-brand-line flex flex-col max-h-[90vh] sm:max-h-[80vh]">
            <div className="flex items-center justify-between px-4 sm:px-6 py-4 sm:py-5 border-b border-brand-line">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-brand-teal-50 rounded-lg shrink-0">
                  <UserPlus className="w-5 h-5 text-brand-teal-600" />
                </div>
                <h2 className="font-bold text-brand-text">{label}</h2>
              </div>
              <button onClick={() => setOpen(false)} className="p-2 rounded-lg hover:bg-brand-bg-alt text-brand-text-mute hover:text-brand-text transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-3">
              {candidates.length === 0 ? (
                <div className="p-8 text-center text-sm text-brand-text-mute">
                  No available members to add.
                </div>
              ) : (
                <div className="space-y-1">
                  {candidates.map(c => (
                    <button key={c.userId}
                      onClick={() => { setOpen(false); onAdd(c.userId); }}
                      className="group w-full flex items-center gap-3 px-3 sm:px-4 py-3 rounded-xl hover:bg-brand-bg-alt transition-colors text-left"
                    >
                      <div className="w-10 h-10 rounded-lg bg-brand-bg-alt flex items-center justify-center text-sm font-bold shrink-0 text-brand-text">
                        {getInitials(c.name, c.email)}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="text-sm font-semibold text-brand-text truncate">{c.name ?? '—'}</div>
                        <div className="text-xs text-brand-text-mute truncate">{c.email}</div>
                      </div>
                      <div className="w-8 h-8 rounded-full bg-brand-teal-50 text-brand-teal-600 flex items-center justify-center shrink-0 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
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
    <div className="fixed inset-y-0 right-0 z-40 w-full sm:max-w-[420px] bg-white border-l border-brand-line shadow-sm flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between gap-2 px-4 sm:px-5 py-4 border-b border-brand-line shrink-0">
        <div className="min-w-0">
          <h3 className="font-bold text-brand-text text-base truncate">{batchName}</h3>
          <p className="text-xs text-brand-text-mute mt-0.5">Manage members</p>
        </div>
        <button onClick={onClose} className="p-2 rounded-lg hover:bg-brand-bg-alt text-brand-text-mute hover:text-brand-text transition-colors shrink-0">
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 px-4 sm:px-5 pt-3 pb-0 border-b border-brand-line shrink-0">
        {([
          { key: 'instructors', label: 'Instructors', icon: Users, count: detail?.instructors.length ?? 0 },
          { key: 'students', label: 'Students', icon: GraduationCap, count: detail?.students.length ?? 0 },
        ] as const).map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`pb-3 px-3 text-sm font-medium flex items-center gap-2 relative transition-colors ${
              activeTab === tab.key
                ? 'text-brand-teal-600'
                : 'text-brand-text-mute hover:text-brand-text'
            }`}
          >
            <tab.icon className="w-3.5 h-3.5" />
            {tab.label}
            <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
              activeTab === tab.key
                ? 'bg-brand-teal-100 text-brand-teal-600'
                : 'bg-brand-bg-alt text-brand-text-mute'
            }`}>{tab.count}</span>
            {activeTab === tab.key && (
              <div className="absolute bottom-0 left-0 w-full h-0.5 bg-brand-teal-600 rounded-t-full" />
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
          <div className="p-3 sm:p-4 space-y-1">
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
                    <Users className="w-10 h-10 text-brand-line mx-auto mb-2" />
                    <p className="text-sm text-brand-text-mute">No instructors assigned yet.</p>
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
                    <GraduationCap className="w-10 h-10 text-brand-line mx-auto mb-2" />
                    <p className="text-sm text-brand-text-mute">No students enrolled yet.</p>
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </div>

      {/* Add Member Footer */}
      <div className="px-4 sm:px-5 py-4 border-t border-brand-line shrink-0 flex justify-end">
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-brand-ink/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-sm w-full max-w-sm max-h-[90vh] overflow-y-auto border border-brand-line p-5 sm:p-6 space-y-5">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-rose-50 rounded-lg shrink-0">
                <Trash2 className="w-5 h-5 text-rose-600" />
              </div>
              <div className="min-w-0">
                <h3 className="font-bold text-brand-text">Delete Batch?</h3>
                <p className="text-xs text-brand-text-mute mt-0.5 truncate">{deleteTarget.name}</p>
              </div>
            </div>
            <p className="text-sm text-brand-text-mute">
              This will permanently delete <strong className="text-brand-text">{deleteTarget.name}</strong> and remove all {deleteTarget.studentCount} enrolled students and {deleteTarget.instructorCount} instructor assignments.
            </p>
            <div className="flex flex-col-reverse sm:flex-row gap-3">
              <button onClick={() => setDeleteTarget(null)} className="flex-1 py-2.5 min-h-[40px] rounded-lg border border-brand-line text-sm font-medium text-brand-text hover:bg-brand-bg-alt transition-colors">
                Cancel
              </button>
              <button onClick={handleDelete} disabled={deleteLoading}
                className="flex-1 py-2.5 min-h-[40px] rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-sm font-semibold transition-colors flex items-center justify-center gap-2 disabled:opacity-60">
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
          <div className="fixed inset-0 z-30 bg-brand-ink/20" onClick={() => setSelectedBatchId(null)} />
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
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h1 className="text-xl sm:text-2xl font-bold text-brand-text">Batch Allocation</h1>
                <p className="text-sm text-brand-text-mute mt-0.5">
                  {loading ? '…' : `${batches.length} batch${batches.length !== 1 ? 'es' : ''} · Click a row to manage members`}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={load} className="p-2 min-h-[40px] min-w-[40px] flex items-center justify-center rounded-lg text-brand-text-mute hover:text-brand-teal-600 hover:bg-brand-bg-alt transition-colors" title="Refresh">
                  <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                </button>
                <button onClick={() => setShowForm(true)}
                  className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2.5 min-h-[40px] bg-brand-teal-600 hover:bg-brand-teal-700 text-white rounded-lg text-sm font-medium transition-colors shadow-sm">
                  <Plus className="w-4 h-4" /> New Batch
                </button>
              </div>
            </div>

            {/* Stats Row */}
            {!loading && batches.length > 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {[
                  { label: 'Total Batches', value: batches.length, cls: 'text-brand-blue-600' },
                  { label: 'Active',         value: batches.filter(b => b.status === 'ACTIVE').length, cls: 'text-emerald-600' },
                  { label: 'Total Students', value: batches.reduce((a, b) => a + b.studentCount, 0), cls: 'text-brand-teal-600' },
                ].map(stat => (
                  <div key={stat.label} className="bg-white border border-brand-line rounded-xl p-4 shadow-sm">
                    <p className="text-xs font-medium text-brand-text-mute">{stat.label}</p>
                    <p className={`text-2xl font-bold mt-1 tabular-nums ${stat.cls}`}>{stat.value}</p>
                  </div>
                ))}
              </div>
            )}

            {/* Batch Table */}
            <div className="bg-white border border-brand-line rounded-xl shadow-sm overflow-hidden">
              {loading ? (
                <div className="py-16 flex justify-center">
                  <Loader2 className="w-6 h-6 animate-spin text-brand-teal-500" />
                </div>
              ) : batches.length === 0 ? (
                <div className="py-16 px-4 text-center">
                  <Layers className="w-14 h-14 text-brand-line mx-auto mb-3" />
                  <p className="text-brand-text font-semibold">No batches yet</p>
                  <p className="text-sm text-brand-text-mute mt-1">Create your first batch to start allocating students.</p>
                  <button onClick={() => setShowForm(true)} className="mt-4 flex items-center gap-2 mx-auto px-4 py-2 min-h-[40px] bg-brand-teal-600 hover:bg-brand-teal-700 text-white rounded-lg text-sm font-medium transition-colors">
                    <Plus className="w-4 h-4" /> Create Batch
                  </button>
                </div>
              ) : (
                <div className="w-full overflow-x-auto px-2 sm:px-4 py-2">
                  <table className="w-full text-left border-collapse min-w-[640px]">
                    <thead>
                      <tr className="border-b border-brand-line text-brand-text-mute">
                        <th className="font-jetbrains pb-4 pt-2 pl-2 text-[10px] font-black uppercase tracking-[0.12em] whitespace-nowrap">Batch Name</th>
                        <th className="font-jetbrains pb-4 pt-2 text-[10px] font-black uppercase tracking-[0.12em] whitespace-nowrap">Status</th>
                        <th className="font-jetbrains pb-4 pt-2 text-[10px] font-black uppercase tracking-[0.12em] whitespace-nowrap">Instructors</th>
                        <th className="font-jetbrains pb-4 pt-2 text-[10px] font-black uppercase tracking-[0.12em] whitespace-nowrap">Students</th>
                        <th className="font-jetbrains pb-4 pt-2 text-[10px] font-black uppercase tracking-[0.12em] whitespace-nowrap">Capacity</th>
                        <th className="font-jetbrains pb-4 pt-2 pr-2 text-right text-[10px] font-black uppercase tracking-[0.12em] whitespace-nowrap">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-brand-line">
                      {batches.map(batch => {
                        const statusCfg = STATUS_CONFIG[batch.status] ?? STATUS_CONFIG.ACTIVE;
                        const isSelected = selectedBatchId === batch.id;
                        return (
                          <tr
                            key={batch.id}
                            onClick={() => setSelectedBatchId(isSelected ? null : batch.id)}
                            className={`hover:bg-brand-teal-50/50 transition-colors cursor-pointer ${isSelected ? 'bg-brand-teal-50/60' : ''}`}
                          >
                            <td className="py-4 pl-2">
                              <div className="flex items-center gap-2">
                                <div className="w-8 h-8 rounded-lg bg-brand-teal-100 text-brand-teal-700 flex items-center justify-center shrink-0">
                                  <Layers className="w-4 h-4" />
                                </div>
                                <div>
                                  <div className="font-semibold text-sm text-brand-text">{batch.name}</div>
                                  {batch.description && (
                                    <div className="text-xs text-brand-text-mute mt-0.5 truncate max-w-[200px]">{batch.description}</div>
                                  )}
                                </div>
                              </div>
                            </td>
                            <td className="py-4">
                              <span className={`font-jetbrains inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold tracking-wider whitespace-nowrap ${statusCfg.cls}`}>
                                <span className="w-1.5 h-1.5 rounded-full bg-current" />
                                {statusCfg.label.toUpperCase()}
                              </span>
                            </td>
                            <td className="py-4">
                              <div className="flex items-center gap-2">
                                {/* Instructor avatar stack */}
                                <div className="flex -space-x-2">
                                  {batch.instructors.slice(0, 3).map(i => (
                                    <div key={i.userId} className="w-6 h-6 rounded-full bg-brand-blue-100 border-2 border-white text-brand-blue-700 text-[8px] font-bold flex items-center justify-center">
                                      {getInitials(i.name, i.email)}
                                    </div>
                                  ))}
                                </div>
                                <span className="text-sm text-brand-text-mute tabular-nums">{batch.instructorCount}</span>
                              </div>
                            </td>
                            <td className="py-4">
                              <span className="text-sm font-semibold text-brand-teal-600 tabular-nums">{batch.studentCount}</span>
                            </td>
                            <td className="py-4">
                              {batch.maxStudents ? (
                                <div className="flex items-center gap-2">
                                  <div className="w-16 sm:w-20 h-1.5 bg-brand-bg-alt rounded-full overflow-hidden shrink-0">
                                    <div
                                      className="h-full bg-brand-teal-500 rounded-full"
                                      style={{ width: `${Math.min(100, (batch.studentCount / batch.maxStudents) * 100)}%` }}
                                    />
                                  </div>
                                  <span className="text-xs text-brand-text-mute whitespace-nowrap tabular-nums">
                                    {batch.studentCount}/{batch.maxStudents}
                                  </span>
                                </div>
                              ) : (
                                <span className="text-xs text-brand-text-mute">Unlimited</span>
                              )}
                            </td>
                            <td className="py-4 text-right pr-2" onClick={e => e.stopPropagation()}>
                              <div className="flex items-center justify-end gap-1">
                                <button
                                  onClick={() => setSelectedBatchId(isSelected ? null : batch.id)}
                                  className="p-2 rounded-lg text-brand-text-mute hover:text-brand-teal-600 hover:bg-brand-teal-50 transition-colors"
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
              <div className="flex items-start gap-2 bg-brand-teal-50 border border-brand-teal-100 rounded-xl p-4">
                <CheckCircle2 className="w-4 h-4 text-brand-teal-500 mt-0.5 shrink-0" />
                <p className="text-xs text-brand-teal-700">
                  Click any batch row or the <ChevronRight className="w-3 h-3 inline" /> button to open the member panel. The same instructor can be assigned to multiple batches.
                </p>
              </div>
            )}
          </div>
    </InstituteAdminLayout>
  );
}
