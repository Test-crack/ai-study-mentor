import React, { useState, useEffect, useCallback } from 'react';
import {
  Layers, Users, RefreshCw, Loader2, GraduationCap,
  ChevronDown, ChevronUp, Mail, Phone, Building2,
  CheckCircle2, Clock, XCircle, Search, BarChart3,
} from 'lucide-react';
import { InstructorSidebar } from '../components/dashboard/InstructorSidebar';
import { InstructorTopbar } from '../components/dashboard/InstructorTopbar';
import { callBackend } from '@/features/auth/services/authClient';
import { getBackendUrl } from '@/shared/utils';
import { useToast } from '@/shared/hooks/use-toast';
import { useNavigate } from 'react-router-dom';

// ─── Types ────────────────────────────────────────────────────────────────────

interface BatchStudent {
  userId: string;
  name: string | null;
  email: string;
  phone: string | null;
  profileImage: string | null;
  enrolledAt: string;
}

interface BatchInstructor {
  userId: string;
  name: string | null;
  email: string;
  profileImage: string | null;
}

interface InstructorBatch {
  id: string;
  name: string;
  description: string | null;
  status: 'ACTIVE' | 'INACTIVE' | 'COMPLETED';
  maxStudents: number | null;
  createdAt: string;
  institute: { id: string | null; name: string | null };
  instructorCount: number;
  studentCount: number;
  instructors: BatchInstructor[];
  students: BatchStudent[];
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const getInitials = (name: string | null, email: string) =>
  (name ?? email).split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase();

const formatDate = (iso: string) => {
  try { return new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }); }
  catch { return '—'; }
};

const STATUS_CONFIG = {
  ACTIVE:    { label: 'Active',    dot: 'bg-emerald-500', cls: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400', Icon: CheckCircle2 },
  INACTIVE:  { label: 'Inactive',  dot: 'bg-amber-500',   cls: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',         Icon: Clock       },
  COMPLETED: { label: 'Completed', dot: 'bg-slate-400',   cls: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400',            Icon: XCircle     },
};

// ─── Skeletons ────────────────────────────────────────────────────────────────

function StatsSkeleton() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
      {[1, 2, 3].map(i => (
        <div key={i} className="rounded-2xl p-5 h-[104px] bg-slate-200 dark:bg-[#26252D] animate-pulse shadow-sm" />
      ))}
    </div>
  );
}

function BatchSkeleton() {
  return (
    <div className="bg-white dark:bg-[#15141B] rounded-2xl border border-slate-200 dark:border-[#26252D] p-5 shadow-sm">
      <div className="flex items-start justify-between gap-4 animate-pulse">
        <div className="flex items-start gap-4">
          <div className="w-11 h-11 rounded-xl bg-slate-200 dark:bg-[#26252D] shrink-0" />
          <div className="space-y-2 py-1">
            <div className="h-5 w-48 bg-slate-200 dark:bg-[#26252D] rounded" />
            <div className="h-3 w-32 bg-slate-200 dark:bg-[#26252D] rounded" />
          </div>
        </div>
        <div className="w-20 h-6 bg-slate-200 dark:bg-[#26252D] rounded-full shrink-0" />
      </div>
      <div className="mt-4 flex items-center gap-6 animate-pulse">
        <div className="h-8 w-24 bg-slate-200 dark:bg-[#26252D] rounded" />
        <div className="h-8 w-32 bg-slate-200 dark:bg-[#26252D] rounded" />
        <div className="h-2 w-24 bg-slate-200 dark:bg-[#26252D] rounded-full ml-auto" />
      </div>
    </div>
  );
}

// ─── Student Row ──────────────────────────────────────────────────────────────

function StudentRow({ student, onAnalyze }: { student: BatchStudent, onAnalyze: (s: BatchStudent) => void }) {
  return (
    <div className="flex items-center gap-3 py-3 px-4 rounded-xl hover:bg-slate-50 dark:hover:bg-white/[0.03] transition-colors group">
      {student.profileImage ? (
        <img src={student.profileImage} alt="" className="w-10 h-10 rounded-lg object-cover shrink-0 ring-2 ring-white dark:ring-[#1E1D27]" />
      ) : (
        <div className="w-10 h-10 rounded-lg bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300 flex items-center justify-center text-sm font-bold shrink-0">
          {getInitials(student.name, student.email)}
        </div>
      )}
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold text-slate-900 dark:text-gray-100 truncate">
          {student.name ?? <span className="italic text-slate-400 font-normal text-xs">Name not set</span>}
        </p>
        <div className="flex items-center gap-3 mt-0.5 flex-wrap">
          <span className="flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400">
            <Mail className="w-3 h-3" /> {student.email}
          </span>
          {student.phone && (
            <span className="flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400">
              <Phone className="w-3 h-3" /> {student.phone}
            </span>
          )}
        </div>
      </div>
      <div className="flex items-center gap-4 shrink-0">
        <span className="text-xs text-slate-400 dark:text-slate-500 hidden sm:block">
          Enrolled {formatDate(student.enrolledAt)}
        </span>
        <button
          onClick={(e) => { e.stopPropagation(); onAnalyze(student); }}
          className="flex items-center gap-2 px-4 py-1.5 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white rounded-full text-xs font-semibold shadow-md shadow-indigo-500/20 hover:shadow-lg hover:shadow-indigo-500/30 transition-all opacity-100 sm:opacity-0 sm:group-hover:opacity-100 focus:opacity-100 transform hover:-translate-y-0.5"
        >
          <BarChart3 className="w-3.5 h-3.5" />
          Analyze Progress
        </button>
      </div>
    </div>
  );
}

// ─── Batch Card ───────────────────────────────────────────────────────────────

function BatchCard({ batch, onAnalyzeStudent, navigate }: { batch: InstructorBatch, onAnalyzeStudent: (s: BatchStudent) => void, navigate: any }) {
  const [expanded, setExpanded] = useState(false);
  const [search, setSearch] = useState('');
  const cfg = STATUS_CONFIG[batch.status] ?? STATUS_CONFIG.ACTIVE;

  const filtered = batch.students.filter(s =>
    (s.name ?? '').toLowerCase().includes(search.toLowerCase()) ||
    s.email.toLowerCase().includes(search.toLowerCase())
  );

  const fillPct = batch.maxStudents
    ? Math.min(100, Math.round((batch.studentCount / batch.maxStudents) * 100))
    : null;

  return (
    <div className="bg-white dark:bg-[#15141B] rounded-2xl border border-slate-200 dark:border-[#26252D] shadow-sm overflow-hidden transition-all duration-200">
      {/* Card Header */}
      <button
        onClick={() => setExpanded(v => !v)}
        className="w-full text-left p-5 hover:bg-slate-50/50 dark:hover:bg-white/[0.02] transition-colors"
      >
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-4 min-w-0">
            <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shrink-0 shadow-lg shadow-indigo-500/20">
              <Layers className="w-5 h-5 text-white" />
            </div>
            <div className="min-w-0">
              <h3 className="font-bold text-slate-900 dark:text-white text-base leading-tight">{batch.name}</h3>
              {batch.description && (
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-1">{batch.description}</p>
              )}
              {batch.institute.name && (
                <div className="flex items-center gap-1 mt-1">
                  <Building2 className="w-3 h-3 text-slate-400" />
                  <span className="text-xs text-slate-500 dark:text-slate-400">{batch.institute.name}</span>
                </div>
              )}
            </div>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold ${cfg.cls}`}>
              <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
              {cfg.label}
            </span>
            {expanded
              ? <ChevronUp className="w-4 h-4 text-slate-400" />
              : <ChevronDown className="w-4 h-4 text-slate-400" />
            }
          </div>
        </div>

        {/* Stats row */}
        <div className="mt-4 flex items-center gap-6 flex-wrap">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-indigo-50 dark:bg-indigo-900/30 rounded-lg">
              <GraduationCap className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
            </div>
            <div>
              <span className="text-lg font-bold text-slate-900 dark:text-white">{batch.studentCount}</span>
              <span className="text-xs text-slate-500 dark:text-slate-400 ml-1">
                {batch.maxStudents ? `/ ${batch.maxStudents}` : ''} students
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-purple-50 dark:bg-purple-900/30 rounded-lg">
              <Users className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
            </div>
            <span className="text-sm text-slate-600 dark:text-slate-400">{batch.instructorCount} instructor{batch.instructorCount !== 1 ? 's' : ''}</span>
          </div>
          {fillPct !== null && (
            <div className="flex items-center gap-2 flex-1 min-w-[120px]">
              <div className="flex-1 h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all ${fillPct >= 90 ? 'bg-rose-500' : fillPct >= 70 ? 'bg-amber-500' : 'bg-emerald-500'}`}
                  style={{ width: `${fillPct}%` }}
                />
              </div>
              <span className="text-xs font-medium text-slate-500">{fillPct}%</span>
            </div>
          )}
        </div>
      </button>

      {/* Expanded: Student List */}
      {expanded && (
        <div className="border-t border-slate-100 dark:border-[#26252D]">
          {/* Co-instructors */}
          {batch.instructors.length > 1 && (
            <div className="px-5 py-3 border-b border-slate-100 dark:border-[#26252D] flex items-center gap-2 flex-wrap">
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mr-1">Co-instructors:</span>
              {batch.instructors.map(i => (
                <span key={i.userId} className="inline-flex items-center gap-1.5 px-2 py-1 rounded-full bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300 text-xs font-medium">
                  {i.profileImage
                    ? <img src={i.profileImage} className="w-4 h-4 rounded-full" alt="" />
                    : <span className="w-4 h-4 rounded-full bg-purple-200 dark:bg-purple-700 flex items-center justify-center text-[9px] font-bold">{getInitials(i.name, i.email)}</span>
                  }
                  {i.name ?? i.email}
                </span>
              ))}
            </div>
          )}

          {/* Search */}
          <div className="px-5 py-3 border-b border-slate-100 dark:border-[#26252D]">
            <div className="relative max-w-xs">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
              <input
                type="text" value={search} onChange={e => setSearch(e.target.value)}
                placeholder="Search students…"
                className="w-full pl-9 pr-4 py-2 bg-slate-50 dark:bg-[#0A0A0B] border border-slate-200 dark:border-[#26252D] rounded-lg text-sm focus:outline-none focus:border-indigo-400 dark:text-white placeholder-slate-400"
              />
            </div>
          </div>

          {/* Student list */}
          <div className="px-1 py-2 divide-y divide-slate-50 dark:divide-[#26252D]/50">
            {filtered.length === 0 ? (
              <div className="py-8 text-center">
                <GraduationCap className="w-10 h-10 text-slate-200 dark:text-slate-700 mx-auto mb-2" />
                <p className="text-sm text-slate-400 dark:text-slate-500">
                  {search ? `No students matching "${search}"` : 'No students enrolled yet.'}
                </p>
              </div>
            ) : (
              filtered.map(s => <StudentRow key={s.userId} student={s} onAnalyze={onAnalyzeStudent} />)
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function InstructorBatchView() {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [batches, setBatches] = useState<InstructorBatch[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await callBackend(`${getBackendUrl()}/api/instructor/batches`);
      setBatches(res.data ?? []);
    } catch (err: any) {
      toast({ title: 'Failed to load batches', description: err.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => { load(); }, [load]);

  const totals = {
    batches: batches.length,
    students: batches.reduce((a, b) => a + b.studentCount, 0),
    active: batches.filter(b => b.status === 'ACTIVE').length,
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-[#09090E] text-slate-900 dark:text-slate-200 transition-colors duration-300">
      <InstructorSidebar
        activeTab="batches"
        isCollapsed={isCollapsed}
        toggleCollapse={() => setIsCollapsed(v => !v)}
      />

      <div className={`transition-all duration-300 flex flex-col min-h-screen ${isCollapsed ? 'lg:pl-[112px]' : 'lg:pl-[288px]'}`}>
        
        {/* Topbar integration */}
        <InstructorTopbar />

        <main className="flex-1 p-4 sm:p-6 lg:p-8">
          <div className="max-w-[1000px] mx-auto space-y-6">

            {/* Header */}
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-slate-900 dark:text-white">My Batches</h1>
                {loading ? (
                  <div className="h-4 w-48 bg-slate-200 dark:bg-slate-800 rounded animate-pulse mt-1.5" />
                ) : (
                  <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
                    {totals.batches} batch{totals.batches !== 1 ? 'es' : ''} assigned · {totals.students} total students
                  </p>
                )}
              </div>
              <button onClick={load} className="p-2 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-slate-100 dark:hover:bg-white/5 transition-colors">
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-indigo-500' : ''}`} />
              </button>
            </div>

            {loading ? (
              <>
                <StatsSkeleton />
                <div className="space-y-4 mt-6">
                  <BatchSkeleton />
                  <BatchSkeleton />
                  <BatchSkeleton />
                </div>
              </>
            ) : batches.length === 0 ? (
              <div className="py-24 text-center bg-white dark:bg-[#15141B] rounded-2xl border border-slate-200 dark:border-[#26252D]">
                <div className="w-16 h-16 rounded-2xl bg-indigo-50 dark:bg-indigo-900/20 flex items-center justify-center mx-auto mb-4">
                  <Layers className="w-8 h-8 text-indigo-400" />
                </div>
                <h3 className="font-bold text-slate-900 dark:text-white">No batches assigned yet</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 max-w-xs mx-auto">
                  Your institute admin will assign you to batches. Check back later.
                </p>
              </div>
            ) : (
              <>
                {/* Summary cards */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {[
                    { label: 'Total Batches', value: totals.batches, grad: 'from-indigo-500 to-purple-500' },
                    { label: 'Active Batches', value: totals.active,    grad: 'from-emerald-500 to-teal-500' },
                    { label: 'Total Students', value: totals.students, grad: 'from-rose-500 to-pink-500'    },
                  ].map(s => (
                    <div key={s.label} className="relative overflow-hidden rounded-2xl p-5 text-white shadow-lg">
                      <div className={`absolute inset-0 bg-gradient-to-br ${s.grad} opacity-100`} />
                      <div className="relative z-10">
                        <p className="text-xs font-semibold text-white/70 uppercase tracking-wider">{s.label}</p>
                        <p className="text-3xl font-bold mt-1">{s.value}</p>
                      </div>
                      <div className="absolute bottom-0 right-0 w-20 h-20 rounded-full bg-white/10 translate-x-4 translate-y-4" />
                    </div>
                  ))}
                </div>

                {/* Batch cards */}
                <div className="space-y-4">
                  {batches.map(batch => (
                    <BatchCard 
                      key={batch.id} 
                      batch={batch} 
                      onAnalyzeStudent={(s) => navigate(`/instructor/student/${s.userId}/progress`, { state: { student: s }})} 
                      navigate={navigate} 
                    />
                  ))}
                </div>
              </>
            )}

          </div>
        </main>
      </div>
    </div>
  );
}