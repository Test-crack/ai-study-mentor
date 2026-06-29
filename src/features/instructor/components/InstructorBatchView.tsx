// src/features/Instructor/components/InstructorBatchView.tsx
import { useState, useEffect, useCallback, useMemo, type ReactNode } from 'react';
import {
  Layers, Users, RefreshCw, Loader2, GraduationCap,
  ChevronDown, ChevronUp, Mail, Search, Flame,
  AlertTriangle, ArrowRight, Building2,
} from 'lucide-react';
import { InstructorSidebar } from '../components/dashboard/InstructorSidebar';
import { InstructorTopbar } from '../components/dashboard/InstructorTopbar';
import { callBackend } from '@/features/auth/services/authClient';
import { getBackendUrl } from '@/shared/utils';
import { useToast } from '@/shared/hooks/use-toast';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/shared/utils';

// ─── Types ────────────────────────────────────────────────────────────────────

interface BatchStudent {
  userId:      string;
  name:        string | null;
  email:       string;
  phone:       string | null;
  profileImage: string | null;
  enrolledAt:  string;
}

interface BatchInstructor {
  userId:       string;
  name:         string | null;
  email:        string;
  profileImage: string | null;
}

interface InstructorBatch {
  id:             string;
  name:           string;
  description:    string | null;
  status:         'ACTIVE' | 'INACTIVE' | 'COMPLETED';
  maxStudents:    number | null;
  createdAt:      string;
  institute:      { id: string | null; name: string | null };
  instructorCount: number;
  studentCount:   number;
  instructors:    BatchInstructor[];
  students:       BatchStudent[];
}

interface BandOverviewItem {
  student_id:      string;
  user_id:         string;
  name:            string;
  avatar:          string | null;
  current_band:    number | null;
  target_band:     number | null;
  gap:             number | null;
  last_ia_date:    string | null;
  band_trend:      'up' | 'flat' | 'down' | null;
  drilled_today:   boolean;
  drills_count_today: number;
  streak:          number;
  is_at_risk:      boolean;
  risk_primary_flag: string | null;
}

interface BatchEnrichment {
  engagement_today: {
    active_students:  number;
    avg_dcs:          number;
    streaks_alive:    number;
    active_yesterday: number;
    avg_dcs_yesterday: number;
  };
  at_risk:      Array<{ student_id: string; primary_flag: string }>;
  band_overview: BandOverviewItem[];
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const getInitials = (name: string | null, email: string) =>
  (name ?? email).split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase();

const formatDate = (iso: string) => {
  try { return new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }); }
  catch { return '—'; }
};

function slugify(name: string | null, fallback = 'student') {
  return (name ?? fallback).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || fallback;
}

function bandColorText(b: number | null): string {
  if (b === null) return 'text-slate-400';
  if (b >= 7.5) return 'text-emerald-600 dark:text-emerald-400';
  if (b >= 6.0) return 'text-amber-600 dark:text-amber-400';
  if (b > 0)    return 'text-rose-600 dark:text-rose-400';
  return 'text-slate-400';
}

function bandBg(b: number | null): string {
  if (b === null) return 'bg-slate-100 dark:bg-white/[0.05] text-slate-400';
  if (b >= 7.5) return 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-500/30 dark:shadow-[0_0_10px_rgba(16,185,129,0.15)]';
  if (b >= 6.0) return 'bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-500/30 dark:shadow-[0_0_10px_rgba(245,158,11,0.15)]';
  if (b > 0)    return 'bg-rose-50 dark:bg-rose-500/10 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-500/30 dark:shadow-[0_0_10px_rgba(244,63,94,0.15)]';
  return 'bg-slate-100 dark:bg-white/[0.05] text-slate-400';
}

function iaStatusConfig(item: BandOverviewItem | undefined) {
  if (!item) return null;
  const flag = item.risk_primary_flag ?? '';
  if (flag.toLowerCase().includes('missed') && flag.toLowerCase().includes('assessment')) {
    return { dot: 'bg-rose-500', cls: 'bg-rose-50 dark:bg-rose-500/10 text-rose-700 dark:text-rose-400 border-rose-200 dark:border-rose-500/30', label: 'Missed IA' };
  }
  if (item.last_ia_date) {
    const daysAgo = Math.floor((Date.now() - new Date(item.last_ia_date).getTime()) / 86_400_000);
    if (daysAgo <= 7) {
      return { dot: 'bg-emerald-500', cls: 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/30', label: 'IA recent' };
    }
  }
  return { dot: 'bg-slate-300 dark:bg-slate-600', cls: 'bg-slate-100 dark:bg-white/[0.05] text-slate-500 dark:text-slate-400 border-slate-200 dark:border-white/[0.07]', label: 'No IA yet' };
}

// ─── Status config ─────────────────────────────────────────────────────────────

const STATUS_CONFIG = {
  ACTIVE:    { label: 'Active',    dot: 'bg-emerald-500', cls: 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/30' },
  INACTIVE:  { label: 'Inactive',  dot: 'bg-amber-500',   cls: 'bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-500/30' },
  COMPLETED: { label: 'Completed', dot: 'bg-slate-400',   cls: 'bg-slate-100 dark:bg-white/[0.05] text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-white/[0.07]' },
} as const;

// ─── Skeletons ────────────────────────────────────────────────────────────────

function StatsSkeleton() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
      {[0, 1, 2].map(i => (
        <div key={i} className="rounded-2xl h-[104px] bg-slate-200 dark:bg-white/[0.04] animate-pulse" />
      ))}
    </div>
  );
}

function BatchSkeleton() {
  return (
    <div className="bg-white dark:bg-[#0E0E16] rounded-2xl border border-slate-200/70 dark:border-white/[0.06] p-5 shadow-[0_2px_12px_-4px_rgba(15,23,42,0.08)] dark:shadow-none">
      <div className="flex items-start justify-between gap-4 animate-pulse">
        <div className="flex items-start gap-4">
          <div className="w-11 h-11 rounded-xl bg-slate-200 dark:bg-white/5 shrink-0" />
          <div className="space-y-2 py-1">
            <div className="h-5 w-48 bg-slate-200 dark:bg-white/5 rounded" />
            <div className="h-3 w-32 bg-slate-200 dark:bg-white/5 rounded" />
          </div>
        </div>
        <div className="w-20 h-6 bg-slate-200 dark:bg-white/5 rounded-full" />
      </div>
    </div>
  );
}

// ─── Student Row ──────────────────────────────────────────────────────────────

function StudentRow({
  student,
  batchId,
  enrich,
  navigate,
}: {
  student: BatchStudent;
  batchId: string;
  enrich?: BandOverviewItem;
  navigate: ReturnType<typeof useNavigate>;
}) {
  const slug = slugify(student.name);
  const ia   = iaStatusConfig(enrich);

  const goToProgress = () => {
    navigate(`/instructor/batches/${batchId}/students/${student.userId}/progress`, {
      state: { studentId: student.userId },
    });
  };

  return (
    <div className="flex items-center gap-3 py-2.5 px-4 rounded-xl hover:bg-indigo-50/50 dark:hover:bg-indigo-500/[0.06] transition-colors group">
      {/* Avatar */}
      {student.profileImage ? (
        <img src={student.profileImage} alt="" className="w-9 h-9 rounded-full object-cover shrink-0 ring-2 ring-white dark:ring-white/[0.06]" />
      ) : (
        <div className="w-9 h-9 rounded-full bg-indigo-100 dark:bg-indigo-500/20 flex items-center justify-center text-xs font-black text-indigo-600 dark:text-indigo-400 shrink-0">
          {getInitials(student.name, student.email)}
        </div>
      )}

      {/* Name + email */}
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold text-slate-800 dark:text-slate-100 truncate leading-tight">
          {student.name ?? <span className="italic text-slate-400 font-normal text-xs">Name not set</span>}
        </p>
        <p className="flex items-center gap-1 text-xs text-slate-400 dark:text-slate-500 mt-0.5 truncate">
          <Mail className="w-3 h-3 shrink-0" />
          {student.email}
        </p>
      </div>

      {/* ── Fixed-width columns (matches header) ── */}
      <div className="hidden sm:flex items-center shrink-0">

        {/* Band — w-16 */}
        <div className="w-16 flex justify-center">
          <span className={cn('inline-flex items-center px-2 py-0.5 rounded-lg text-xs font-black', bandBg(enrich?.current_band ?? null))}>
            {enrich?.current_band != null ? enrich.current_band.toFixed(1) : '—'}
          </span>
        </div>

        {/* Streak — w-16 */}
        <div className="w-16 flex justify-center">
          <span className={cn(
            'inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-xs font-bold',
            enrich && (enrich.streak > 0 || enrich.drilled_today)
              ? 'bg-orange-50 dark:bg-orange-500/10 text-orange-600 dark:text-orange-400 border border-orange-200 dark:border-orange-500/30'
              : 'bg-slate-100 dark:bg-white/[0.05] text-slate-400'
          )}>
            <Flame className="w-3 h-3 shrink-0" />
            {enrich && enrich.streak > 0 ? enrich.streak : '—'}
          </span>
        </div>

        {/* IA Status — w-28 */}
        <div className="w-28 flex justify-center">
          {ia ? (
            <span className={cn('inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-xs font-bold border', ia.cls)}>
              <span className={cn('w-1.5 h-1.5 rounded-full shrink-0', ia.dot)} />
              {ia.label}
            </span>
          ) : (
            <span className="text-xs text-slate-300 dark:text-slate-600">—</span>
          )}
        </div>

        {/* Enrolled — w-24 (hidden below lg) */}
        <div className="w-24 hidden lg:flex justify-end">
          <span className="text-xs text-slate-400 dark:text-slate-500">{formatDate(student.enrolledAt)}</span>
        </div>

        {/* View button — w-20 */}
        <div className="w-20 flex justify-end">
          <button
            onClick={goToProgress}
            className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 bg-indigo-50 dark:bg-indigo-500/10 hover:bg-indigo-100 dark:hover:bg-indigo-500/20 rounded-lg transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100"
          >
            View <ArrowRight className="w-3 h-3" />
          </button>
        </div>
      </div>

      {/* Mobile-only View button */}
      <button
        onClick={goToProgress}
        className="sm:hidden flex items-center gap-1 px-2.5 py-1.5 text-xs font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-500/10 rounded-lg shrink-0"
      >
        View <ArrowRight className="w-3 h-3" />
      </button>
    </div>
  );
}

// ─── Batch Summary Bar ────────────────────────────────────────────────────────

function BatchSummaryBar({ batch, enrichment }: { batch: InstructorBatch; enrichment: BatchEnrichment | null }) {
  const avgBand = useMemo(() => {
    if (!enrichment) return null;
    const bands = enrichment.band_overview.map(b => b.current_band).filter((b): b is number => b !== null);
    return bands.length > 0 ? (bands.reduce((a, b) => a + b, 0) / bands.length) : null;
  }, [enrichment]);

  const activeToday = enrichment?.engagement_today.active_students ?? null;
  const atRiskCount = enrichment?.at_risk.length ?? null;

  const items = [
    { label: `${batch.studentCount} student${batch.studentCount !== 1 ? 's' : ''}`, cls: 'text-slate-600 dark:text-slate-300', icon: null },
    avgBand !== null
      ? { label: `Avg Band: ${avgBand.toFixed(1)}`, cls: bandColorText(avgBand), icon: null }
      : null,
    activeToday !== null
      ? { label: `${activeToday} active today`, cls: 'text-indigo-600 dark:text-indigo-400', icon: null }
      : null,
    atRiskCount !== null && atRiskCount > 0
      ? { label: `${atRiskCount} at risk`, cls: 'text-rose-600 dark:text-rose-400', icon: <AlertTriangle className="w-3 h-3" /> }
      : null,
  ].filter(Boolean) as Array<{ label: string; cls: string; icon: ReactNode }>;

  return (
    <div className="flex items-center gap-0 flex-wrap px-5 py-3 border-b border-slate-100 dark:border-white/[0.05] bg-slate-50/80 dark:bg-white/[0.02]">
      {items.map((item, i) => (
        <span key={i} className="flex items-center gap-1">
          {i > 0 && <span className="text-slate-300 dark:text-slate-600 mx-2">·</span>}
          {item.icon}
          <span className={cn('text-xs font-semibold', item.cls)}>{item.label}</span>
        </span>
      ))}
    </div>
  );
}

// ─── Batch Card ───────────────────────────────────────────────────────────────

function BatchCard({
  batch,
  navigate,
}: {
  batch: InstructorBatch;
  navigate: ReturnType<typeof useNavigate>;
}) {
  const [expanded,   setExpanded]   = useState(false);
  const [search,     setSearch]     = useState('');
  const [enrichment, setEnrichment] = useState<BatchEnrichment | null>(null);
  const [enrichLoading, setEnrichLoading] = useState(false);

  const cfg = STATUS_CONFIG[batch.status] ?? STATUS_CONFIG.ACTIVE;

  // Lazy-load enrichment when expanded
  useEffect(() => {
    if (!expanded || enrichment || enrichLoading) return;
    setEnrichLoading(true);
    callBackend(`${getBackendUrl()}/api/instructor/batches/${batch.id}/dashboard-summary`)
      .then(res => setEnrichment(res.data ?? null))
      .catch(() => {})
      .finally(() => setEnrichLoading(false));
  }, [expanded, batch.id, enrichment, enrichLoading]);

  const enrichMap = useMemo(() => {
    if (!enrichment) return new Map<string, BandOverviewItem>();
    return new Map(enrichment.band_overview.map(b => [b.user_id, b]));
  }, [enrichment]);

  const filtered = batch.students.filter(s => {
    const q = search.toLowerCase();
    return (s.name ?? '').toLowerCase().includes(q) || s.email.toLowerCase().includes(q);
  });

  const fillPct = batch.maxStudents
    ? Math.min(100, Math.round((batch.studentCount / batch.maxStudents) * 100))
    : null;

  return (
    <div className="bg-white dark:bg-[#0E0E16] rounded-2xl border border-slate-200/70 dark:border-white/[0.06] shadow-[0_2px_12px_-4px_rgba(15,23,42,0.08)] dark:shadow-none overflow-hidden transition-all duration-200">
      {/* ── Card Header ── */}
      <button
        onClick={() => setExpanded(v => !v)}
        className="w-full text-left p-5 hover:bg-slate-50/60 dark:hover:bg-white/[0.02] transition-colors"
      >
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-4 min-w-0">
            <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center shrink-0 shadow-md shadow-indigo-500/25">
              <Layers className="w-5 h-5 text-white" />
            </div>
            <div className="min-w-0">
              <h3 className="font-bold text-slate-900 dark:text-white text-base leading-tight">{batch.name}</h3>
              {batch.description && (
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5 truncate">{batch.description}</p>
              )}
              {batch.institute.name && (
                <div className="flex items-center gap-1 mt-1">
                  <Building2 className="w-3 h-3 text-slate-400" />
                  <span className="text-xs text-slate-400 dark:text-slate-500">{batch.institute.name}</span>
                </div>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2.5 shrink-0">
            <span className={cn('inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold', cfg.cls)}>
              <span className={cn('w-1.5 h-1.5 rounded-full', cfg.dot)} />
              {cfg.label}
            </span>
            {expanded
              ? <ChevronUp className="w-4 h-4 text-slate-400" />
              : <ChevronDown className="w-4 h-4 text-slate-400" />}
          </div>
        </div>

        {/* Stats row */}
        <div className="mt-4 flex items-center gap-5 flex-wrap">
          <div className="flex items-center gap-2">
            <GraduationCap className="w-3.5 h-3.5 text-indigo-500" />
            <span className="text-sm font-bold text-slate-800 dark:text-white">{batch.studentCount}</span>
            <span className="text-xs text-slate-400 dark:text-slate-500">
              {batch.maxStudents ? `/ ${batch.maxStudents} ` : ''}students
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Users className="w-3.5 h-3.5 text-violet-500" />
            <span className="text-xs text-slate-500 dark:text-slate-400">
              {batch.instructorCount} instructor{batch.instructorCount !== 1 ? 's' : ''}
            </span>
          </div>
          {fillPct !== null && (
            <div className="flex items-center gap-2 flex-1 min-w-[120px]">
              <div className="flex-1 h-1.5 bg-slate-100 dark:bg-white/[0.06] rounded-full overflow-hidden">
                <div
                  className={cn(
                    'h-full rounded-full transition-all',
                    fillPct >= 90 ? 'bg-rose-500' : fillPct >= 70 ? 'bg-amber-500' : 'bg-emerald-500'
                  )}
                  style={{ width: `${fillPct}%` }}
                />
              </div>
              <span className="text-xs font-medium text-slate-400 dark:text-slate-500">{fillPct}%</span>
            </div>
          )}
        </div>
      </button>

      {/* ── Expanded Section ── */}
      {expanded && (
        <div className="border-t border-slate-100 dark:border-white/[0.05]">
          {/* Summary bar */}
          <BatchSummaryBar batch={batch} enrichment={enrichment} />

          {/* Co-instructors */}
          {batch.instructors.length > 1 && (
            <div className="px-5 py-3 border-b border-slate-100 dark:border-white/[0.05] flex items-center gap-2 flex-wrap">
              <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mr-1">Co-instructors:</span>
              {batch.instructors.map(i => (
                <span key={i.userId} className="inline-flex items-center gap-1.5 px-2 py-1 rounded-full bg-violet-50 dark:bg-violet-500/10 text-violet-700 dark:text-violet-300 text-xs font-medium border border-violet-200 dark:border-violet-500/20">
                  {i.profileImage
                    ? <img src={i.profileImage} className="w-4 h-4 rounded-full object-cover" alt="" />
                    : <span className="w-4 h-4 rounded-full bg-violet-200 dark:bg-violet-700 flex items-center justify-center text-[9px] font-bold">{getInitials(i.name, i.email)}</span>
                  }
                  {i.name ?? i.email}
                </span>
              ))}
            </div>
          )}

          {/* Search + enrichment hint */}
          <div className="px-5 py-3 border-b border-slate-100 dark:border-white/[0.05] flex items-center gap-4 flex-wrap">
            <div className="relative flex-1 min-w-[200px] max-w-xs">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
              <input
                type="text"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search students…"
                className="w-full pl-9 pr-4 py-2 text-sm bg-slate-50 dark:bg-white/[0.04] border border-slate-200 dark:border-white/[0.07] rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/30 text-slate-800 dark:text-slate-200 placeholder:text-slate-400"
              />
            </div>
            {enrichLoading && (
              <div className="flex items-center gap-1.5 text-xs text-slate-400">
                <Loader2 className="w-3 h-3 animate-spin" />
                Loading stats…
              </div>
            )}
          </div>

          {/* Column header — widths must match StudentRow fixed columns exactly */}
          {batch.students.length > 0 && (
            <div className="hidden sm:flex items-center px-4 py-1.5 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider border-b border-slate-100 dark:border-white/[0.05] bg-slate-50/60 dark:bg-white/[0.02]">
              <div className="w-9 shrink-0" />
              <div className="flex-1 min-w-0 pl-3">Student</div>
              <div className="flex items-center shrink-0">
                <span className="w-16 text-center">Band</span>
                <span className="w-16 text-center">Streak</span>
                <span className="w-28 text-center">IA Status</span>
                <span className="w-24 text-right hidden lg:block">Enrolled</span>
                <span className="w-20" />
              </div>
            </div>
          )}

          {/* Student list */}
          <div className="px-1 py-2 divide-y divide-slate-50 dark:divide-white/[0.03]">
            {filtered.length === 0 ? (
              <div className="py-10 text-center">
                <GraduationCap className="w-8 h-8 text-slate-300 dark:text-slate-600 mx-auto mb-2" />
                <p className="text-sm text-slate-400">
                  {search ? `No students matching "${search}"` : 'No students enrolled yet.'}
                </p>
              </div>
            ) : (
              filtered.map(s => (
                <StudentRow
                  key={s.userId}
                  student={s}
                  batchId={batch.id}
                  enrich={enrichMap.get(s.userId)}
                  navigate={navigate}
                />
              ))
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
  const navigate  = useNavigate();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [batches,     setBatches]     = useState<InstructorBatch[]>([]);
  const [loading,     setLoading]     = useState(true);

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
    batches:  batches.length,
    students: batches.reduce((a, b) => a + b.studentCount, 0),
    active:   batches.filter(b => b.status === 'ACTIVE').length,
  };

  return (
    <div className="
      relative min-h-screen
      bg-[#f8fafc] text-slate-900
      dark:bg-[#0A0A0F] dark:text-slate-200
      transition-colors duration-500
    ">
      {/* Ambient page glows (dark only) */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden hidden dark:block">
        <div className="absolute -top-60 left-1/4 w-[44rem] h-[44rem] rounded-full bg-blue-700/10 blur-[140px]" />
        <div className="absolute -bottom-20 -left-20 w-[32rem] h-[32rem] rounded-full bg-indigo-600/8 blur-[130px]" />
      </div>

      <InstructorSidebar
        activeTab="batches"
        isCollapsed={isCollapsed}
        toggleCollapse={() => setIsCollapsed(v => !v)}
      />

      <div className={cn('relative z-10 transition-all duration-300 flex flex-col min-h-screen', isCollapsed ? 'lg:pl-[112px]' : 'lg:pl-[288px]')}>
        <InstructorTopbar />

        <main className="flex-1 p-4 sm:p-6 lg:p-8">
          <div className="max-w-[1000px] mx-auto space-y-6">

            {/* Header */}
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">My Batches</h1>
                {loading ? (
                  <div className="h-4 w-48 bg-slate-200 dark:bg-white/5 rounded animate-pulse mt-1.5" />
                ) : (
                  <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
                    {totals.batches} batch{totals.batches !== 1 ? 'es' : ''} · {totals.students} total students
                  </p>
                )}
              </div>
              <button
                onClick={load}
                className="p-2 rounded-xl text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-slate-100 dark:hover:bg-white/[0.05] transition-colors"
              >
                <RefreshCw className={cn('w-4 h-4', loading && 'animate-spin text-indigo-500')} />
              </button>
            </div>

            {loading ? (
              <>
                <StatsSkeleton />
                <div className="space-y-4 mt-6">
                  <BatchSkeleton />
                  <BatchSkeleton />
                </div>
              </>
            ) : batches.length === 0 ? (
              <div className="py-24 text-center bg-white dark:bg-[#0E0E16] rounded-2xl border border-slate-200/70 dark:border-white/[0.06] shadow-[0_2px_12px_-4px_rgba(15,23,42,0.08)] dark:shadow-none">
                <div className="w-16 h-16 rounded-2xl bg-indigo-50 dark:bg-indigo-500/10 flex items-center justify-center mx-auto mb-4">
                  <Layers className="w-8 h-8 text-indigo-400" />
                </div>
                <h3 className="font-bold text-slate-900 dark:text-white">No batches assigned yet</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 max-w-xs mx-auto">
                  Your institute admin will assign you to batches. Check back later.
                </p>
              </div>
            ) : (
              <>
                {/* Summary stat cards — tinted like Engagement Pulse */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {[
                    { label: 'Total Batches',  value: totals.batches,  cls: 'text-indigo-700 dark:text-indigo-300',  cardBg: 'bg-indigo-50/80 border-indigo-100 dark:bg-indigo-950/40 dark:border-indigo-500/20 dark:shadow-[0_0_28px_rgba(99,102,241,0.18)]' },
                    { label: 'Active Batches', value: totals.active,   cls: 'text-emerald-700 dark:text-emerald-300', cardBg: 'bg-emerald-50/80 border-emerald-100 dark:bg-emerald-950/40 dark:border-emerald-500/20 dark:shadow-[0_0_28px_rgba(16,185,129,0.15)]' },
                    { label: 'Total Students', value: totals.students, cls: 'text-violet-700 dark:text-violet-300',   cardBg: 'bg-violet-50/80 border-violet-100 dark:bg-violet-950/40 dark:border-violet-500/20 dark:shadow-[0_0_28px_rgba(139,92,246,0.16)]' },
                  ].map(s => (
                    <div key={s.label} className={cn(
                      'rounded-2xl border p-5 text-center transition-all duration-200 hover:-translate-y-0.5',
                      'shadow-[0_2px_8px_-2px_rgba(15,23,42,0.06)] dark:backdrop-blur-sm',
                      s.cardBg
                    )}>
                      <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">{s.label}</p>
                      <p className={cn('text-3xl font-black mt-1', s.cls)}>{s.value}</p>
                    </div>
                  ))}
                </div>

                {/* Batch cards */}
                <div className="space-y-4">
                  {batches.map(batch => (
                    <BatchCard key={batch.id} batch={batch} navigate={navigate} />
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