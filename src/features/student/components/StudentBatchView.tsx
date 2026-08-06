import React, { useState, useEffect, useCallback } from 'react';
import {
  Layers, Users, RefreshCw, Loader2, Building2,
  CheckCircle2, Clock, XCircle, Mail, GraduationCap,
  Sparkles, ChevronRight,
} from 'lucide-react';
import { StudentSidebar } from '../components/dashboard/StudentSidebar';
import { callBackend } from '@/features/auth/services/authClient';
import { getBackendUrl } from '@/shared/utils';
import { useToast } from '@/shared/hooks/use-toast';

// ─── Types ────────────────────────────────────────────────────────────────────

interface BatchInstructor {
  userId: string;
  name: string | null;
  email: string;
  profileImage: string | null;
}

interface StudentBatch {
  id: string;
  name: string;
  description: string | null;
  status: 'ACTIVE' | 'INACTIVE' | 'COMPLETED';
  maxStudents: number | null;
  enrolledAt: string;
  institute: { id: string | null; name: string | null };
  studentCount: number;
  instructors: BatchInstructor[];
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const getInitials = (name: string | null, email: string) =>
  (name ?? email).split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase();

const formatDate = (iso: string) => {
  try { return new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }); }
  catch { return '—'; }
};

const STATUS_CONFIG = {
  ACTIVE:    { label: 'Active',    dot: 'bg-emerald-500', cls: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',  Icon: CheckCircle2 },
  INACTIVE:  { label: 'Inactive',  dot: 'bg-amber-500',   cls: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',          Icon: Clock        },
  COMPLETED: { label: 'Completed', dot: 'bg-slate-400',   cls: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400',             Icon: XCircle      },
};

// ─── Instructor Avatar Card ───────────────────────────────────────────────────

function InstructorCard({ instructor }: { instructor: BatchInstructor }) {
  return (
    <div className="flex items-center gap-3 p-4 rounded-xl bg-gradient-to-r from-brand-blue-50 to-brand-teal-50 dark:from-brand-blue-900/10 dark:to-brand-teal-900/10 border border-brand-blue-100 dark:border-brand-blue-800/30">
      {instructor.profileImage ? (
        <img src={instructor.profileImage} alt=""
          className="w-12 h-12 rounded-xl object-cover ring-2 ring-white dark:ring-[#26252D] shadow-md" />
      ) : (
        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-brand-blue-500 to-brand-teal-500 text-white font-bold text-sm flex items-center justify-center shadow-md shadow-brand-blue-500/20">
          {getInitials(instructor.name, instructor.email)}
        </div>
      )}
      <div className="min-w-0">
        <p className="font-bold text-slate-900 dark:text-white text-sm">
          {instructor.name ?? <span className="italic font-normal text-slate-400 text-xs">Instructor</span>}
        </p>
        <div className="flex items-center gap-1 mt-0.5">
          <Mail className="w-3 h-3 text-slate-400" />
          <span className="text-xs text-slate-500 dark:text-slate-400 truncate">{instructor.email}</span>
        </div>
        <span className="mt-1 inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold bg-brand-blue-100 dark:bg-brand-blue-900/30 text-brand-blue-700 dark:text-brand-blue-300">
          Instructor
        </span>
      </div>
    </div>
  );
}

// ─── Batch Card ───────────────────────────────────────────────────────────────

function StudentBatchCard({ batch }: { batch: StudentBatch }) {
  const cfg = STATUS_CONFIG[batch.status] ?? STATUS_CONFIG.ACTIVE;

  return (
    <div className="group bg-white dark:bg-[#15141B] rounded-2xl border border-slate-200 dark:border-[#26252D] shadow-sm hover:shadow-md dark:hover:shadow-black/20 transition-all duration-200 overflow-hidden">
      {/* Top accent bar */}
      <div className={`h-1 w-full ${batch.status === 'ACTIVE' ? 'bg-gradient-to-r from-brand-teal-500 via-brand-blue-500 to-pink-500' : batch.status === 'COMPLETED' ? 'bg-slate-300 dark:bg-slate-700' : 'bg-amber-400'}`} />

      <div className="p-5">
        {/* Header */}
        <div className="flex items-start justify-between gap-3 mb-4">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-brand-teal-500 to-brand-blue-600 flex items-center justify-center shrink-0 shadow-lg shadow-brand-teal-500/20">
              <Layers className="w-5 h-5 text-white" />
            </div>
            <div className="min-w-0">
              <h3 className="font-bold text-slate-900 dark:text-white text-base leading-tight truncate">{batch.name}</h3>
              {batch.description && (
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-1">{batch.description}</p>
              )}
            </div>
          </div>
          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold shrink-0 ${cfg.cls}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
            {cfg.label}
          </span>
        </div>

        {/* Meta info */}
        <div className="flex flex-wrap gap-3 mb-5">
          {batch.institute.name && (
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-[#26252D]">
              <Building2 className="w-3.5 h-3.5 text-slate-400" />
              <span className="text-xs text-slate-600 dark:text-slate-400 font-medium">{batch.institute.name}</span>
            </div>
          )}
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-[#26252D]">
            <GraduationCap className="w-3.5 h-3.5 text-slate-400" />
            <span className="text-xs text-slate-600 dark:text-slate-400 font-medium">{batch.studentCount} students</span>
          </div>
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-[#26252D]">
            <Sparkles className="w-3.5 h-3.5 text-slate-400" />
            <span className="text-xs text-slate-600 dark:text-slate-400 font-medium">Enrolled {formatDate(batch.enrolledAt)}</span>
          </div>
        </div>

        {/* Instructors section */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <Users className="w-3.5 h-3.5 text-slate-500" />
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Your Instructor{batch.instructors.length !== 1 ? 's' : ''}
            </span>
          </div>

          {batch.instructors.length === 0 ? (
            <div className="py-6 text-center rounded-xl border border-dashed border-slate-200 dark:border-[#26252D]">
              <Users className="w-8 h-8 text-slate-200 dark:text-slate-700 mx-auto mb-2" />
              <p className="text-xs text-slate-400">No instructor assigned yet</p>
            </div>
          ) : (
            <div className="grid gap-2">
              {batch.instructors.map(instructor => (
                <InstructorCard key={instructor.userId} instructor={instructor} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function StudentBatchView() {
  const { toast } = useToast();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [batches, setBatches] = useState<StudentBatch[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await callBackend(`${getBackendUrl()}/api/student/batches`);
      setBatches(res.data ?? []);
    } catch (err: any) {
      toast({ title: 'Failed to load batch info', description: err.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => { load(); }, [load]);

  return (
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-slate-950 text-slate-900 dark:text-slate-200 transition-colors duration-300">
      <StudentSidebar
        activeTab="batches"
        isCollapsed={isCollapsed}
        toggleCollapse={() => setIsCollapsed(v => !v)}
      />

      <div className={`transition-all duration-300 min-h-screen ${isCollapsed ? 'lg:pl-28' : 'lg:pl-72'}`}>
        <main className="p-4 sm:p-6 lg:p-8">
          <div className="max-w-[800px] mx-auto space-y-6">

            {/* Header */}
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-slate-900 dark:text-white">My Batches</h1>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
                  {loading ? '…' : batches.length === 0
                    ? 'You are not enrolled in any batch yet'
                    : `Enrolled in ${batches.length} batch${batches.length !== 1 ? 'es' : ''}`
                  }
                </p>
              </div>
              <button onClick={load} className="p-2 rounded-lg text-slate-400 hover:text-brand-teal-600 hover:bg-slate-100 dark:hover:bg-white/5 transition-colors">
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              </button>
            </div>

            {/* Enrolled summary banner */}
            {!loading && batches.length > 0 && (
              <div className="relative overflow-hidden rounded-2xl p-5 text-white">
                <div className="absolute inset-0 bg-gradient-to-br from-brand-teal-600 via-brand-blue-600 to-pink-500" />
                <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'radial-gradient(circle at 80% 20%, white 1px, transparent 1px)', backgroundSize: '24px 24px' }} />
                <div className="relative z-10 flex items-center justify-between gap-4">
                  <div>
                    <p className="text-white/70 text-xs font-semibold uppercase tracking-wider">Your Learning Journey</p>
                    <p className="text-3xl font-bold mt-1">{batches.reduce((a, b) => a + b.studentCount, 0)}</p>
                    <p className="text-white/80 text-sm">fellow students across all your batches</p>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <div className="text-right">
                      <p className="text-2xl font-bold">{batches.filter(b => b.status === 'ACTIVE').length}</p>
                      <p className="text-white/70 text-xs">Active batches</p>
                    </div>
                    <div className="flex items-center gap-1 text-white/80 text-xs mt-1">
                      <ChevronRight className="w-3.5 h-3.5" />
                      {batches.reduce((a, b) => a + b.instructors.length, 0)} instructor{batches.reduce((a, b) => a + b.instructors.length, 0) !== 1 ? 's' : ''} assigned
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Batch cards */}
            {loading ? (
              <div className="py-24 flex justify-center">
                <Loader2 className="w-7 h-7 animate-spin text-brand-teal-500" />
              </div>
            ) : batches.length === 0 ? (
              <div className="py-24 text-center bg-white dark:bg-[#15141B] rounded-2xl border border-slate-200 dark:border-[#26252D]">
                <div className="w-16 h-16 rounded-2xl bg-brand-teal-50 dark:bg-brand-teal-900/20 flex items-center justify-center mx-auto mb-4">
                  <Layers className="w-8 h-8 text-brand-teal-400" />
                </div>
                <h3 className="font-bold text-slate-900 dark:text-white">Not in any batch yet</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 max-w-xs mx-auto">
                  Your institute admin will enroll you in a batch. Check back soon!
                </p>
              </div>
            ) : (
              <div className="grid gap-4">
                {batches.map(batch => <StudentBatchCard key={batch.id} batch={batch} />)}
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
