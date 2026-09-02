import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Search,
  Users,
  BookOpen,
  GraduationCap,
  MoreVertical,
  Plus,
  X,
  Edit,
  UserPlus,
  UserMinus,
  Trash2,
  Loader2,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';
import { InstituteSidebar } from '../components/InstituteSidebar';
import { InstituteTopbar } from '../components/InstituteTopbar';
import { PageHero, HeroAction } from '../components/shared/primitives';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/shared/components/ui/select';
import {
  fetchBatches, fetchBatchDetail, createBatch, updateBatch, deleteBatch,
  addInstructor, removeInstructor, addStudent, removeStudent,
  type BatchSummary, type BatchDetail, type BatchMember, type BatchStatus,
} from '../services/batchService';
import { fetchTutors, fetchStudents, type TutorRecord, type StudentRecord } from '../services/instituteAdminService';
import { useToast } from '@/shared/hooks/use-toast';

// --- Helpers ---

const getInitials = (name: string | null, email: string) =>
  (name ?? email).split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase();

const formatDate = (iso: string) => {
  try { return new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }); }
  catch { return '—'; }
};

const STATUS_CONFIG: Record<BatchStatus, { label: string; cls: string }> = {
  ACTIVE: { label: 'Active', cls: 'bg-brand-teal-50 text-brand-teal-700 border-brand-teal-200' },
  INACTIVE: { label: 'Inactive', cls: 'bg-amber-50 text-amber-700 border-amber-200' },
  COMPLETED: { label: 'Completed', cls: 'bg-brand-bg-alt text-brand-text-mute border-brand-line' },
};

// --- Create / Edit Batch Modal ---

interface BatchFormModalProps {
  initial?: BatchSummary | null;
  onClose: () => void;
  onSaved: (batch: BatchSummary) => void;
}

function BatchFormModal({ initial, onClose, onSaved }: BatchFormModalProps) {
  const { toast } = useToast();
  const isEdit = !!initial;
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: initial?.name ?? '',
    description: initial?.description ?? '',
    status: (initial?.status ?? 'ACTIVE') as BatchStatus,
    maxStudents: initial?.maxStudents != null ? String(initial.maxStudents) : '',
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) return;
    setLoading(true);
    try {
      const payload = {
        name: formData.name.trim(),
        description: formData.description.trim() || undefined,
        status: formData.status,
        maxStudents: formData.maxStudents ? parseInt(formData.maxStudents, 10) : null,
      };

      let result: BatchSummary;
      if (isEdit && initial) {
        const res = await updateBatch(initial.id, payload);
        result = {
          ...initial,
          ...res.data,
        };
      } else {
        const res = await createBatch(payload);
        result = res.data;
      }
      toast({ title: isEdit ? 'Batch updated' : 'Batch created', description: result.name });
      onSaved(result);
      onClose();
    } catch (err: any) {
      toast({ title: isEdit ? 'Failed to update batch' : 'Failed to create batch', description: err.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-brand-ink/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl border border-brand-line shadow-sm w-full max-w-lg max-h-[90vh] overflow-y-auto animate-in zoom-in-95 duration-200">

        <div className="flex items-center justify-between p-4 sm:p-6 border-b border-brand-line">
          <h2 className="font-manrope text-lg sm:text-xl font-bold text-brand-text">
            {isEdit ? 'Edit Batch' : 'Create New Batch'}
          </h2>
          <button
            onClick={onClose}
            className="p-2 text-brand-text-mute hover:text-brand-text rounded-lg hover:bg-brand-bg-alt transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-4">
          <div>
            <label className="block text-sm font-semibold text-brand-text mb-1.5">Batch Name</label>
            <input
              type="text"
              name="name"
              required
              value={formData.name}
              onChange={handleInputChange}
              placeholder="e.g. IELTS Weekend Intensive"
              className="w-full px-4 py-2 min-h-[40px] bg-brand-bg-alt border border-brand-line rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-teal-500/20 focus:border-brand-teal-500 text-sm text-brand-text"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-brand-text mb-1.5">Description</label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              rows={2}
              placeholder="Optional details about this batch…"
              className="w-full px-4 py-2 bg-brand-bg-alt border border-brand-line rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-teal-500/20 focus:border-brand-teal-500 text-sm text-brand-text resize-none"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-brand-text mb-1.5">Max Students</label>
              <input
                type="number"
                name="maxStudents"
                min="1"
                value={formData.maxStudents}
                onChange={handleInputChange}
                placeholder="Unlimited"
                className="w-full px-4 py-2 min-h-[40px] bg-brand-bg-alt border border-brand-line rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-teal-500/20 focus:border-brand-teal-500 text-sm text-brand-text"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-brand-text mb-1.5">Status</label>
              {/* Radix Select, not a native <select>: a native select's popup is
                  drawn by the browser at the width of its longest option and
                  ignores CSS, overflowing narrow mobile viewports. Radix renders
                  the panel in a portal with collision detection, so it stays on
                  screen and its width/positioning are CSS-controllable. */}
              <Select
                value={formData.status}
                onValueChange={(value) => setFormData(prev => ({ ...prev, status: value as BatchStatus }))}
              >
                <SelectTrigger
                  aria-label="Status"
                  className="w-full px-4 py-2 min-h-[40px] bg-brand-bg-alt border border-brand-line rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-teal-500/20 focus:border-brand-teal-500 text-sm text-brand-text"
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="max-w-[calc(100vw-2rem)]">
                  <SelectItem value="ACTIVE">Active</SelectItem>
                  <SelectItem value="INACTIVE">Inactive</SelectItem>
                  <SelectItem value="COMPLETED">Completed</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="pt-4 flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-end gap-3 border-t border-brand-line mt-6">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 min-h-[40px] text-sm font-semibold text-brand-text hover:bg-brand-bg-alt rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 min-h-[40px] bg-brand-teal-600 hover:bg-brand-teal-700 text-white rounded-lg text-sm font-semibold transition-colors shadow-sm flex items-center justify-center gap-2 disabled:opacity-60"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
              {loading ? 'Saving…' : (isEdit ? 'Save Changes' : 'Create Batch')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// --- Manage Members Modal (Instructors + Students for one batch) ---

type MembersTab = 'instructors' | 'students';

interface ManageMembersModalProps {
  batchId: string;
  batchName: string;
  initialTab: MembersTab;
  allTutors: TutorRecord[];
  allStudents: StudentRecord[];
  onClose: () => void;
  onCountsChanged: (batchId: string, counts: { instructorCount: number; studentCount: number }) => void;
}

function ManageMembersModal({
  batchId, batchName, initialTab, allTutors, allStudents, onClose, onCountsChanged,
}: ManageMembersModalProps) {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<MembersTab>(initialTab);
  const [detail, setDetail] = useState<BatchDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [addingId, setAddingId] = useState<string | null>(null);
  const [removingId, setRemovingId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const res = await fetchBatchDetail(batchId);
      setDetail(res.data);
    } catch (err: any) {
      setLoadError(err.message || 'Could not load batch members.');
    } finally {
      setLoading(false);
    }
  }, [batchId]);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    if (detail) {
      onCountsChanged(batchId, { instructorCount: detail.instructors.length, studentCount: detail.students.length });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [detail]);

  const handleAddInstructor = async (userId: string) => {
    setAddingId(userId);
    try {
      const res = await addInstructor(batchId, userId);
      setDetail(prev => prev ? { ...prev, instructors: [...prev.instructors, res.data] } : prev);
      setPickerOpen(false);
      toast({ title: 'Instructor assigned' });
    } catch (err: any) {
      toast({ title: 'Failed to assign instructor', description: err.message, variant: 'destructive' });
    } finally {
      setAddingId(null);
    }
  };

  const handleRemoveInstructor = async (userId: string) => {
    setRemovingId(userId);
    try {
      await removeInstructor(batchId, userId);
      setDetail(prev => prev ? { ...prev, instructors: prev.instructors.filter(i => i.userId !== userId) } : prev);
      toast({ title: 'Instructor removed' });
    } catch (err: any) {
      toast({ title: 'Failed to remove instructor', description: err.message, variant: 'destructive' });
    } finally {
      setRemovingId(null);
    }
  };

  const handleAddStudent = async (userId: string) => {
    setAddingId(userId);
    try {
      const res = await addStudent(batchId, userId);
      setDetail(prev => prev ? { ...prev, students: [...prev.students, res.data] } : prev);
      setPickerOpen(false);
      toast({ title: 'Student enrolled in batch' });
    } catch (err: any) {
      toast({ title: 'Failed to enroll student', description: err.message, variant: 'destructive' });
    } finally {
      setAddingId(null);
    }
  };

  const handleRemoveStudent = async (userId: string) => {
    setRemovingId(userId);
    try {
      await removeStudent(batchId, userId);
      setDetail(prev => prev ? { ...prev, students: prev.students.filter(s => s.userId !== userId) } : prev);
      toast({ title: 'Student removed from batch' });
    } catch (err: any) {
      toast({ title: 'Failed to remove student', description: err.message, variant: 'destructive' });
    } finally {
      setRemovingId(null);
    }
  };

  const assignedInstructorIds = new Set(detail?.instructors.map(i => i.userId) ?? []);
  const assignedStudentIds = new Set(detail?.students.map(s => s.userId) ?? []);
  const instructorCandidates = allTutors.filter(t => !assignedInstructorIds.has(t.userId));
  const studentCandidates = allStudents.filter(s => !assignedStudentIds.has(s.userId));

  const members: BatchMember[] = activeTab === 'instructors' ? (detail?.instructors ?? []) : (detail?.students ?? []);
  const candidates = activeTab === 'instructors'
    ? instructorCandidates.map(t => ({ userId: t.userId, name: t.name, email: t.email }))
    : studentCandidates.map(s => ({ userId: s.userId, name: s.name, email: s.email }));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-brand-ink/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl border border-brand-line shadow-sm w-full max-w-lg max-h-[90vh] overflow-y-auto animate-in zoom-in-95 duration-200 flex flex-col">

        <div className="flex items-center justify-between p-4 sm:p-6 border-b border-brand-line shrink-0">
          <div className="min-w-0">
            <h2 className="font-manrope text-lg sm:text-xl font-bold text-brand-text truncate">{batchName}</h2>
            <p className="text-xs text-brand-text-mute mt-0.5">Manage instructors and students</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-brand-text-mute hover:text-brand-text rounded-lg hover:bg-brand-bg-alt transition-colors shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 px-4 sm:px-6 pt-3 border-b border-brand-line shrink-0">
          {([
            { key: 'instructors' as const, label: 'Instructors', icon: Users, count: detail?.instructors.length ?? 0 },
            { key: 'students' as const, label: 'Students', icon: GraduationCap, count: detail?.students.length ?? 0 },
          ]).map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`pb-3 px-3 text-sm font-medium flex items-center gap-2 relative transition-colors ${
                activeTab === tab.key ? 'text-brand-teal-600' : 'text-brand-text-mute hover:text-brand-text'
              }`}
            >
              <tab.icon className="w-3.5 h-3.5" />
              {tab.label}
              <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                activeTab === tab.key ? 'bg-brand-teal-100 text-brand-teal-600' : 'bg-brand-bg-alt text-brand-text-mute'
              }`}>{tab.count}</span>
              {activeTab === tab.key && (
                <div className="absolute bottom-0 left-0 w-full h-0.5 bg-brand-teal-600 rounded-t-full" />
              )}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6">
          {loading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="w-6 h-6 animate-spin text-brand-teal-500" />
            </div>
          ) : loadError ? (
            <div className="flex flex-col items-center justify-center py-12 text-center gap-3">
              <AlertCircle className="w-8 h-8 text-rose-500" />
              <p className="text-sm text-brand-text-mute">{loadError}</p>
              <button
                onClick={load}
                className="px-4 py-2 min-h-[40px] bg-brand-teal-600 hover:bg-brand-teal-700 text-white rounded-lg text-sm font-semibold transition-colors"
              >
                Retry
              </button>
            </div>
          ) : (
            <div className="space-y-1">
              {members.map(member => (
                <div key={member.userId} className="flex items-center gap-3 py-2.5 px-3 rounded-xl hover:bg-brand-bg-alt transition-colors group">
                  {member.profileImage ? (
                    <img src={member.profileImage} alt="" className="w-9 h-9 rounded-lg object-cover shrink-0" />
                  ) : (
                    <div className="w-9 h-9 rounded-lg bg-brand-teal-100 text-brand-teal-700 flex items-center justify-center text-xs font-bold shrink-0">
                      {getInitials(member.name, member.email)}
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-medium text-brand-text truncate">
                      {member.name ?? <span className="italic text-brand-text-mute text-xs font-normal">No name yet</span>}
                    </div>
                    <div className="text-xs text-brand-text-mute truncate">{member.email}</div>
                  </div>
                  <button
                    onClick={() => activeTab === 'instructors' ? handleRemoveInstructor(member.userId) : handleRemoveStudent(member.userId)}
                    disabled={removingId === member.userId}
                    className="p-2 rounded-lg text-rose-400 hover:text-rose-600 hover:bg-rose-50 transition-colors disabled:opacity-40 shrink-0"
                    title={activeTab === 'instructors' ? 'Remove instructor' : 'Remove student'}
                  >
                    {removingId === member.userId ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserMinus className="w-4 h-4" />}
                  </button>
                </div>
              ))}
              {members.length === 0 && (
                <div className="py-8 text-center">
                  {activeTab === 'instructors'
                    ? <Users className="w-10 h-10 text-brand-line mx-auto mb-2" />
                    : <GraduationCap className="w-10 h-10 text-brand-line mx-auto mb-2" />}
                  <p className="text-sm text-brand-text-mute">
                    {activeTab === 'instructors' ? 'No instructors assigned yet.' : 'No students enrolled yet.'}
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Add member footer */}
        {!loading && !loadError && (
          <div className="p-4 sm:p-6 border-t border-brand-line shrink-0 relative">
            <button
              onClick={() => setPickerOpen(v => !v)}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 min-h-[40px] text-sm font-semibold text-brand-teal-700 bg-brand-teal-50 hover:bg-brand-teal-100 rounded-lg transition-colors border border-brand-teal-200"
            >
              <UserPlus className="w-4 h-4" />
              {activeTab === 'instructors' ? 'Assign Instructor' : 'Add Student'}
            </button>

            {pickerOpen && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setPickerOpen(false)} />
                <div className="absolute left-4 right-4 sm:left-6 sm:right-6 bottom-full mb-2 z-20 bg-white border border-brand-line rounded-xl shadow-sm max-h-64 overflow-y-auto">
                  {candidates.length === 0 ? (
                    <div className="p-4 text-center text-sm text-brand-text-mute">
                      No available {activeTab === 'instructors' ? 'tutors' : 'students'} to add.
                    </div>
                  ) : (
                    <div className="p-1">
                      {candidates.map(c => (
                        <button
                          key={c.userId}
                          onClick={() => activeTab === 'instructors' ? handleAddInstructor(c.userId) : handleAddStudent(c.userId)}
                          disabled={addingId === c.userId}
                          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-brand-bg-alt transition-colors text-left disabled:opacity-50"
                        >
                          <div className="w-8 h-8 rounded-lg bg-brand-bg-alt flex items-center justify-center text-xs font-bold shrink-0 text-brand-text">
                            {getInitials(c.name, c.email)}
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="text-sm font-semibold text-brand-text truncate">{c.name ?? '—'}</div>
                            <div className="text-xs text-brand-text-mute truncate">{c.email}</div>
                          </div>
                          {addingId === c.userId
                            ? <Loader2 className="w-4 h-4 animate-spin text-brand-teal-600 shrink-0" />
                            : <Plus className="w-4 h-4 text-brand-teal-600 shrink-0" />}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// --- Batch Card Dropdown Menu ---

function BatchCardMenu({ onEdit, onManageInstructors, onAddStudents, onDelete }: {
  onEdit: () => void;
  onManageInstructors: () => void;
  onAddStudents: () => void;
  onDelete: () => void;
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
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(v => !v)}
        className="text-brand-text-mute hover:text-brand-text p-2 rounded-md hover:bg-brand-bg-alt transition-colors"
      >
        <MoreVertical className="w-5 h-5" />
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-52 bg-white border border-brand-line rounded-xl shadow-sm z-20 overflow-hidden py-1 animate-in slide-in-from-top-2 duration-200">
          <button
            onClick={() => { setOpen(false); onEdit(); }}
            className="w-full flex items-center gap-2 px-4 py-2.5 min-h-[40px] text-sm font-medium text-brand-text hover:bg-brand-bg-alt transition-colors"
          >
            <Edit className="w-4 h-4 text-brand-text-mute" /> Edit Batch
          </button>
          <button
            onClick={() => { setOpen(false); onManageInstructors(); }}
            className="w-full flex items-center gap-2 px-4 py-2.5 min-h-[40px] text-sm font-medium text-brand-text hover:bg-brand-bg-alt transition-colors"
          >
            <Users className="w-4 h-4 text-brand-text-mute" /> Manage Instructors
          </button>
          <button
            onClick={() => { setOpen(false); onAddStudents(); }}
            className="w-full flex items-center gap-2 px-4 py-2.5 min-h-[40px] text-sm font-medium text-brand-text hover:bg-brand-bg-alt transition-colors"
          >
            <UserPlus className="w-4 h-4 text-brand-text-mute" /> Add Students
          </button>
          <div className="my-1 border-t border-brand-line" />
          <button
            onClick={() => { setOpen(false); onDelete(); }}
            className="w-full flex items-center gap-2 px-4 py-2.5 min-h-[40px] text-sm font-medium text-rose-600 hover:bg-rose-50 transition-colors"
          >
            <Trash2 className="w-4 h-4" /> Delete Batch
          </button>
        </div>
      )}
    </div>
  );
}

// --- Main Page ---

export default function InstituteBatches() {
  const { toast } = useToast();
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  const [batches, setBatches] = useState<BatchSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  // Institute roster, loaded once for the add-instructor / add-student pickers
  const [allTutors, setAllTutors] = useState<TutorRecord[]>([]);
  const [allStudents, setAllStudents] = useState<StudentRecord[]>([]);

  const [isBatchModalOpen, setIsBatchModalOpen] = useState(false);
  const [editingBatch, setEditingBatch] = useState<BatchSummary | null>(null);

  const [membersModal, setMembersModal] = useState<{ batchId: string; batchName: string; tab: MembersTab } | null>(null);

  const [deleteTarget, setDeleteTarget] = useState<BatchSummary | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
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
      setLoadError(err.message || 'Could not load batches. Please try again.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  // Real, derived-from-API metrics only — no fabricated numbers.
  const totalStudents = batches.reduce((acc, b) => acc + b.studentCount, 0);
  const totalInstructorAssignments = batches.reduce((acc, b) => acc + b.instructorCount, 0);
  const activeBatches = batches.filter(b => b.status === 'ACTIVE').length;

  const dynamicMetrics = [
    { title: "Total Batches", value: batches.length.toString(), icon: BookOpen, color: "text-brand-teal-600", bg: "bg-brand-teal-50", border: "border-brand-teal-100" },
    { title: "Active Batches", value: activeBatches.toString(), icon: CheckCircle2, color: "text-emerald-600", bg: "bg-emerald-50", border: "border-emerald-100" },
    { title: "Total Students", value: totalStudents.toString(), icon: Users, color: "text-brand-blue-600", bg: "bg-brand-blue-50", border: "border-brand-blue-100" },
    { title: "Instructor Assignments", value: totalInstructorAssignments.toString(), icon: GraduationCap, color: "text-brand-teal-600", bg: "bg-brand-teal-50", border: "border-brand-teal-100" },
  ];

  const openCreateModal = () => {
    setEditingBatch(null);
    setIsBatchModalOpen(true);
  };

  const openEditModal = (batch: BatchSummary) => {
    setEditingBatch(batch);
    setIsBatchModalOpen(true);
  };

  const handleBatchSaved = (batch: BatchSummary) => {
    setBatches(prev => {
      const idx = prev.findIndex(b => b.id === batch.id);
      if (idx >= 0) { const next = [...prev]; next[idx] = { ...next[idx], ...batch }; return next; }
      return [batch, ...prev];
    });
  };

  const handleMembersCountsChanged = (batchId: string, counts: { instructorCount: number; studentCount: number }) => {
    setBatches(prev => prev.map(b => b.id === batchId ? { ...b, ...counts } : b));
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleteLoading(true);
    try {
      await deleteBatch(deleteTarget.id);
      setBatches(prev => prev.filter(b => b.id !== deleteTarget.id));
      toast({ title: 'Batch deleted', description: deleteTarget.name });
      setDeleteTarget(null);
    } catch (err: any) {
      toast({ title: 'Failed to delete batch', description: err.message, variant: 'destructive' });
    } finally {
      setDeleteLoading(false);
    }
  };

  // Filter Logic — search by batch name (real field only; the old mock also
  // matched on a single `tutor` string, which no longer exists since a batch
  // can have multiple instructors).
  const filteredBatches = batches.filter(batch =>
    batch.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-brand-bg font-plex text-brand-text">

      {/* Sidebar */}
      <div className="hidden lg:block">
        <InstituteSidebar
          activeTab="batches"
          isCollapsed={isSidebarCollapsed}
          toggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
        />
      </div>

      <div className={`transition-all duration-300 flex flex-col min-h-screen ${isSidebarCollapsed ? 'lg:pl-20' : 'lg:pl-64'}`}>

        <InstituteTopbar />

        <main className="flex-1 p-4 sm:p-6 lg:p-8">
          <div className="max-w-7xl mx-auto space-y-6 sm:space-y-8">

            {/* Page Header & Create Button */}
            <PageHero
              eyebrow="Admin Portal"
              title="Batch Management"
              subtitle="Every batch in your institute, with capacity and instructor assignment."
              actions={
                <>
                  <HeroAction onClick={load} disabled={loading}>
                    <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} /> Refresh
                  </HeroAction>
                  <HeroAction onClick={openCreateModal}>
                    <Plus className="w-3.5 h-3.5" /> Create Batch
                  </HeroAction>
                </>
              }
            />

            {/* Top Metrics */}
            {!loading && !loadError && batches.length > 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {dynamicMetrics.map((metric, idx) => (
                  <div key={idx} className="bg-white rounded-xl border border-brand-line p-4 sm:p-5 shadow-sm flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center shrink-0 border ${metric.bg} ${metric.color} ${metric.border}`}>
                      <metric.icon className="w-6 h-6" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-brand-text-mute">{metric.title}</p>
                      <div className="flex items-baseline gap-2 mt-0.5">
                        <h3 className="text-2xl font-bold tabular-nums text-brand-text">
                          {metric.value}
                        </h3>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Search */}
            <div className="flex flex-col md:flex-row md:items-center justify-end gap-4 bg-white p-4 rounded-xl border border-brand-line shadow-sm">
              <div className="relative w-full md:w-72 shrink-0">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-brand-text-mute" />
                <input
                  type="text"
                  placeholder="Search batches..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-brand-bg-alt border border-brand-line rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-teal-500/20 focus:border-brand-teal-500 transition-all text-sm font-medium text-brand-text placeholder:text-brand-text-mute"
                />
              </div>
            </div>

            {/* Loading state */}
            {loading && (
              <div className="bg-white rounded-xl border border-brand-line shadow-sm py-16 flex justify-center">
                <Loader2 className="w-6 h-6 animate-spin text-brand-teal-500" />
              </div>
            )}

            {/* Error state */}
            {!loading && loadError && (
              <div className="bg-white rounded-xl border border-brand-line shadow-sm py-16 px-4 flex flex-col items-center text-center gap-3">
                <AlertCircle className="w-10 h-10 text-rose-500" />
                <p className="text-brand-text font-semibold">Couldn't load batches</p>
                <p className="text-sm text-brand-text-mute max-w-sm">{loadError}</p>
                <button
                  onClick={load}
                  className="mt-1 flex items-center gap-2 px-4 py-2 min-h-[40px] bg-brand-teal-600 hover:bg-brand-teal-700 text-white rounded-lg text-sm font-semibold transition-colors"
                >
                  <RefreshCw className="w-4 h-4" /> Retry
                </button>
              </div>
            )}

            {/* Empty state */}
            {!loading && !loadError && batches.length === 0 && (
              <div className="bg-white rounded-xl border border-brand-line shadow-sm py-16 px-4 text-center">
                <BookOpen className="w-14 h-14 text-brand-line mx-auto mb-3" />
                <p className="text-brand-text font-semibold">No batches yet</p>
                <p className="text-sm text-brand-text-mute mt-1">Create your first batch to start allocating students.</p>
                <button
                  onClick={openCreateModal}
                  className="mt-4 flex items-center gap-2 mx-auto px-4 py-2 min-h-[40px] bg-brand-teal-600 hover:bg-brand-teal-700 text-white rounded-lg text-sm font-medium transition-colors"
                >
                  <Plus className="w-4 h-4" /> Create Batch
                </button>
              </div>
            )}

            {/* Batch List */}
            {!loading && !loadError && batches.length > 0 && (
              <div className="space-y-4">
                {filteredBatches.map((batch) => {
                  const statusCfg = STATUS_CONFIG[batch.status] ?? STATUS_CONFIG.ACTIVE;
                  const capacityPct = batch.maxStudents ? Math.min(100, Math.round((batch.studentCount / batch.maxStudents) * 100)) : null;
                  return (
                    <div key={batch.id} className="bg-white rounded-xl border border-brand-line shadow-sm hover:shadow-md transition-all flex flex-col lg:flex-row overflow-hidden relative">

                      {/* Left Side (Info) */}
                      <div className="p-4 sm:p-6 flex-1">
                        <div className="flex items-start justify-between gap-2 mb-3">
                          <span className={`font-jetbrains px-2.5 py-1 text-[10px] uppercase tracking-wider font-bold rounded border ${statusCfg.cls}`}>
                            {statusCfg.label}
                          </span>

                          <BatchCardMenu
                            onEdit={() => openEditModal(batch)}
                            onManageInstructors={() => setMembersModal({ batchId: batch.id, batchName: batch.name, tab: 'instructors' })}
                            onAddStudents={() => setMembersModal({ batchId: batch.id, batchName: batch.name, tab: 'students' })}
                            onDelete={() => setDeleteTarget(batch)}
                          />
                        </div>

                        <h2 className="font-manrope text-lg sm:text-xl font-bold text-brand-text mb-1">{batch.name}</h2>
                        {batch.description && (
                          <p className="text-sm text-brand-text-mute mb-4 max-w-xl">{batch.description}</p>
                        )}

                        <div className="flex flex-wrap items-center gap-3 sm:gap-4 text-sm text-brand-text-mute mb-6">
                          <div className="flex items-center gap-1.5">
                            <Users className="w-4 h-4 text-brand-text-mute" />
                            <span className="tabular-nums">
                              {batch.studentCount}{batch.maxStudents != null ? `/${batch.maxStudents}` : ''} students
                            </span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <span className="text-xs">Created {formatDate(batch.createdAt)}</span>
                          </div>
                        </div>

                        <div className="flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-6">
                          {/* Instructors */}
                          <div className="flex items-center gap-2">
                            {batch.instructors.length > 0 ? (
                              <div className="flex -space-x-2" title={batch.instructors.map(i => i.name ?? i.email).join(', ')}>
                                {batch.instructors.slice(0, 4).map(i => (
                                  <div
                                    key={i.userId}
                                    className="w-8 h-8 rounded-full bg-brand-teal-100 border-2 border-white flex items-center justify-center text-brand-teal-700 font-bold text-xs shrink-0"
                                    title={i.name ?? i.email}
                                  >
                                    {getInitials(i.name, i.email)}
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <div className="flex items-center gap-3 bg-brand-bg-alt py-1.5 px-3 rounded-lg border border-brand-line shrink-0">
                                <span className="text-sm font-medium text-brand-text-mute">No instructors assigned</span>
                              </div>
                            )}
                            {batch.instructors.length > 0 && (
                              <span className="text-sm font-semibold text-brand-text">
                                {batch.instructorCount} instructor{batch.instructorCount !== 1 ? 's' : ''}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Right Side (Capacity) */}
                      {capacityPct !== null && (
                        <div className="lg:w-64 border-t lg:border-t-0 lg:border-l border-brand-line bg-brand-bg-alt/60 p-4 sm:p-5 flex flex-col justify-center shrink-0">
                          <p className="text-xs font-semibold text-brand-text-mute mb-1">Capacity</p>
                          <h4 className="text-2xl font-bold text-brand-text mb-2 tabular-nums">{capacityPct}%</h4>
                          <div className="w-full bg-brand-line h-2 rounded-full overflow-hidden">
                            <div
                              className={`${capacityPct > 90 ? 'bg-rose-500' : 'bg-brand-blue-500'} h-full rounded-full`}
                              style={{ width: `${capacityPct}%` }}
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}

                {filteredBatches.length === 0 && (
                  <div className="bg-white rounded-xl border border-brand-line shadow-sm py-12 text-center">
                    <Search className="w-10 h-10 text-brand-line mx-auto mb-2" />
                    <p className="text-brand-text-mute text-sm">No batches matching "{searchTerm}"</p>
                  </div>
                )}
              </div>
            )}

          </div>
        </main>
      </div>

      {/* --- CREATE / EDIT BATCH MODAL --- */}
      {isBatchModalOpen && (
        <BatchFormModal
          initial={editingBatch}
          onClose={() => { setIsBatchModalOpen(false); setEditingBatch(null); }}
          onSaved={handleBatchSaved}
        />
      )}

      {/* --- MANAGE INSTRUCTORS / STUDENTS MODAL --- */}
      {membersModal && (
        <ManageMembersModal
          batchId={membersModal.batchId}
          batchName={membersModal.batchName}
          initialTab={membersModal.tab}
          allTutors={allTutors}
          allStudents={allStudents}
          onClose={() => setMembersModal(null)}
          onCountsChanged={handleMembersCountsChanged}
        />
      )}

      {/* --- DELETE CONFIRM DIALOG --- */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-brand-ink/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl border border-brand-line shadow-sm w-full max-w-sm max-h-[90vh] overflow-y-auto animate-in zoom-in-95 duration-200 p-4 sm:p-6 space-y-5">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-rose-50 rounded-lg shrink-0">
                <Trash2 className="w-5 h-5 text-rose-600" />
              </div>
              <div className="min-w-0">
                <h3 className="font-manrope font-bold text-brand-text">Delete Batch?</h3>
                <p className="text-xs text-brand-text-mute mt-0.5 truncate">{deleteTarget.name}</p>
              </div>
            </div>
            <p className="text-sm text-brand-text-mute">
              This will permanently delete <strong className="text-brand-text">{deleteTarget.name}</strong> and remove all {deleteTarget.studentCount} enrolled students and {deleteTarget.instructorCount} instructor assignments.
            </p>
            <div className="flex flex-col-reverse sm:flex-row items-stretch gap-3">
              <button
                onClick={() => setDeleteTarget(null)}
                className="flex-1 px-4 py-2 min-h-[40px] text-sm font-semibold text-brand-text hover:bg-brand-bg-alt rounded-lg border border-brand-line transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={deleteLoading}
                className="flex-1 px-4 py-2 min-h-[40px] bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-sm font-semibold transition-colors flex items-center justify-center gap-2 disabled:opacity-60"
              >
                {deleteLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                {deleteLoading ? 'Deleting…' : 'Yes, Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
