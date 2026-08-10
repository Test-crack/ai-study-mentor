// src/features/InstituteOwner/dashboard/InstituteStudentsPage.tsx
import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search, Filter, AlertTriangle, CheckCircle, Minus,
  TrendingUp, TrendingDown, ArrowRight, Users, Sparkles, Flame
} from 'lucide-react';
import { InstituteOwnerSidebar } from '../components/InstitiuteOwnerSidebar';
import { InstituteOwnerTopbar } from '../components/InstituteOwnerTopbar';
import { fetchStudents, StudentRow } from '../services/instituteOwnerService';
import { useToast } from '@/shared/hooks/use-toast';

const toSlug = (name: string) => name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

// ─── Helpers ──────────────────────────────────────────────────────────────────

function bandPill(band: number | null) {
  if (band === null) return <span className="text-xs text-slate-400">—</span>;
  const b = Number(band);
  let cls = 'inline-flex items-center justify-center text-xs font-bold tabular-nums px-2.5 py-0.5 rounded-full ring-1 ring-inset ';
  if (b >= 7)      cls += 'bg-emerald-50 text-emerald-700 ring-emerald-600/20 dark:bg-emerald-500/10 dark:text-emerald-400 dark:ring-emerald-400/25';
  else if (b >= 6) cls += 'bg-blue-50 text-blue-700 ring-blue-600/20 dark:bg-blue-500/10 dark:text-blue-400 dark:ring-blue-400/25';
  else if (b >= 5) cls += 'bg-amber-50 text-amber-700 ring-amber-600/20 dark:bg-amber-500/10 dark:text-amber-400 dark:ring-amber-400/25';
  else             cls += 'bg-rose-50 text-rose-700 ring-rose-600/20 dark:bg-rose-500/10 dark:text-rose-400 dark:ring-rose-400/25';
  return <span className={cls}>{b.toFixed(1)}</span>;
}

function trendIcon(trend: 'up' | 'flat' | 'down' | null) {
  if (trend === 'up')   return <TrendingUp className="h-4 w-4 text-emerald-500" />;
  if (trend === 'down') return <TrendingDown className="h-4 w-4 text-rose-500" />;
  return <ArrowRight className="h-4 w-4 text-slate-400" />;
}

function relativeTime(iso: string | null): string {
  if (!iso) return '—';
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

function AvatarCell({ name, avatar }: { name: string; avatar: string | null }) {
  return (
    <div className="flex items-center gap-2.5">
      {avatar ? (
        <img src={avatar} alt={name} className="h-8 w-8 rounded-full object-cover flex-shrink-0 ring-1 ring-slate-200/70 dark:ring-white/10" />
      ) : (
        <div className="h-8 w-8 rounded-full bg-gradient-to-br from-brand-teal-100 to-brand-blue-100 dark:from-brand-teal-500/20 dark:to-brand-blue-500/20 ring-1 ring-brand-teal-200/60 dark:ring-brand-teal-500/20 flex items-center justify-center flex-shrink-0">
          <span className="text-xs font-bold text-brand-teal-600 dark:text-brand-teal-400">
            {name.charAt(0).toUpperCase()}
          </span>
        </div>
      )}
      <span className="font-medium text-[13px] text-slate-800 dark:text-slate-200 truncate max-w-[140px]">{name}</span>
    </div>
  );
}

// ─── Loading Skeleton ─────────────────────────────────────────────────────────

function TableSkeleton() {
  return (
    <div className="space-y-3">
      {[1, 2, 3].map(i => (
        <div key={i} className="animate-pulse flex gap-4 px-4 py-3 bg-white dark:bg-[#131318] rounded-xl border border-slate-200/70 dark:border-white/[0.08]">
          <div className="h-8 w-8 rounded-full bg-slate-200 dark:bg-slate-700 flex-shrink-0" />
          <div className="flex-1 space-y-2 my-auto">
            <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded w-32" />
            <div className="h-2 bg-slate-100 dark:bg-slate-800 rounded w-20" />
          </div>
          {[...Array(6)].map((_, j) => (
            <div key={j} className="h-4 bg-slate-100 dark:bg-slate-800 rounded w-12 my-auto" />
          ))}
        </div>
      ))}
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function InstituteStudentsPage() {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [students, setStudents] = useState<StudentRow[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch]           = useState('');
  const [batchFilter, setBatchFilter] = useState('');
  const [atRiskOnly, setAtRiskOnly]   = useState(false);

  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    async function load() {
      try {
        setLoading(true);
        const params: { batchId?: string; at_risk?: boolean } = {};
        if (batchFilter) params.batchId = batchFilter;
        if (atRiskOnly)  params.at_risk = true;
        const res = await fetchStudents(params);
        if (res.success) setStudents(res.data);
      } catch {
        toast({ title: 'Failed to load students', variant: 'destructive' });
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [batchFilter, atRiskOnly]);

  // Derived filter options
  const batchOptions = useMemo(() => {
    const map = new Map<string, string>();
    students.forEach(s => map.set(s.batch_id, s.batch_name));
    return Array.from(map.entries());
  }, [students]);

  // Client-side name search
  const visible = useMemo(() => {
    if (!search.trim()) return students;
    const q = search.toLowerCase();
    return students.filter(s => s.name.toLowerCase().includes(q));
  }, [students, search]);

  return (
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-[#0a0a0a] font-sans text-slate-900 dark:text-white transition-colors duration-300">
      <div className="hidden lg:block">
        <InstituteOwnerSidebar
          activeTab="students"
          isCollapsed={isSidebarCollapsed}
          toggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
        />
      </div>
      <div className={`transition-all duration-300 flex flex-col min-h-screen ${isSidebarCollapsed ? 'lg:pl-20' : 'lg:pl-64'}`}>
        <InstituteOwnerTopbar />
        <main className="flex-1 p-4 sm:p-6 lg:p-8">
          <div className="max-w-[1400px] mx-auto">

            {/* ── Hero Banner ─────────────────────────────────────────────── */}
            <section className="relative overflow-hidden rounded-2xl sm:rounded-3xl border border-brand-teal-100/80 dark:border-white/[0.06] bg-gradient-to-r from-[#eff4ff] via-[#f4f1ff] to-[#f3f0ff] dark:from-[#111827] dark:via-[#161a38] dark:to-[#1e1b4b] px-5 sm:px-8 pt-6 sm:pt-8 pb-16 sm:pb-20 shadow-sm">
              <div aria-hidden className="pointer-events-none select-none absolute inset-0">
                <div className="absolute -top-20 -right-12 w-64 h-64 rounded-full bg-brand-teal-300/25 dark:bg-brand-teal-500/15 blur-3xl" />
                <div className="absolute -bottom-28 left-1/3 w-72 h-72 rounded-full bg-brand-blue-300/20 dark:bg-brand-blue-500/10 blur-3xl" />
              </div>

              <div className="relative">
                <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-brand-teal-600 dark:text-brand-teal-300 bg-white/60 dark:bg-white/[0.06] border border-white/70 dark:border-white/[0.08] backdrop-blur px-2.5 py-1 rounded-full">
           Owner Portal
                </span>
                <h1 className="mt-3 text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
                  Students
                </h1>
                <p className="mt-1.5 text-sm text-slate-500 dark:text-slate-400">
                  {loading ? 'Loading…' : `${visible.length} student${visible.length !== 1 ? 's' : ''} shown`}
                </p>
              </div>
            </section>

            {/* ── Filter Bar (overlaps hero) ──────────────────────────────── */}
            <div className="relative z-10 -mt-8 sm:-mt-10 rounded-2xl bg-white/85 dark:bg-[#131318]/90 backdrop-blur-xl border border-white/20 dark:border-white/[0.08] ring-1 ring-slate-900/[0.05] dark:ring-0 shadow-sm p-3.5 sm:p-4 flex flex-wrap gap-3 items-center">
              {/* Search */}
              <div className="relative flex-1 min-w-[200px]">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search by name…"
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-sm bg-slate-50 dark:bg-white/[0.04] border border-slate-200/70 dark:border-white/[0.08] rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-teal-500/30 focus:border-brand-teal-300 dark:focus:border-brand-teal-500/40 text-slate-700 dark:text-slate-200 placeholder:text-slate-400 transition-colors"
                />
              </div>

              {/* Batch */}
              <select
                value={batchFilter}
                onChange={e => setBatchFilter(e.target.value)}
                className="text-sm bg-slate-50 dark:bg-white/[0.04] border border-slate-200/70 dark:border-white/[0.08] rounded-xl px-3 py-2 text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-teal-500/30 transition-colors"
              >
                <option value="">All Batches</option>
                {batchOptions.map(([id, name]) => (
                  <option key={id} value={id}>{name}</option>
                ))}
              </select>

              {/* At-risk toggle */}
              <button
                onClick={() => setAtRiskOnly(!atRiskOnly)}
                className={`flex items-center gap-2 text-sm font-medium px-3.5 py-2 rounded-xl border transition-all ${
                  atRiskOnly
                    ? 'bg-rose-50 dark:bg-rose-500/10 border-rose-300 dark:border-rose-500/40 text-rose-600 dark:text-rose-400 shadow-sm'
                    : 'bg-slate-50 dark:bg-white/[0.04] border-slate-200/70 dark:border-white/[0.08] text-slate-600 dark:text-slate-400 hover:border-rose-200 dark:hover:border-rose-500/30'
                }`}
              >
                <AlertTriangle className="h-4 w-4" />
                At-Risk Only
              </button>
            </div>

            {/* ── Table ───────────────────────────────────────────────────── */}
            <div className="mt-6 rounded-2xl bg-white dark:bg-[#131318] border border-slate-200/70 dark:border-white/[0.08] shadow-sm overflow-hidden">
              {loading ? (
                <div className="p-4"><TableSkeleton /></div>
              ) : visible.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 text-center">
                  <div className="w-14 h-14 rounded-2xl bg-slate-50 dark:bg-white/[0.04] flex items-center justify-center mb-4">
                    <Users className="h-7 w-7 text-slate-300 dark:text-slate-600" />
                  </div>
                  <p className="text-slate-600 dark:text-slate-300 font-semibold">No students found</p>
                  <p className="text-sm text-slate-400 mt-1">Try adjusting your filters</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-slate-100 dark:border-white/[0.06] bg-slate-50/60 dark:bg-white/[0.02]">
                        {['Name', 'Batch', 'Band', 'Target', 'Gap', 'Streak', 'Drilled', 'Last Active', 'Flag'].map((h, i) => (
                          <th key={h} className={`text-left text-[10px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-[0.12em] px-4 py-2.5 whitespace-nowrap ${i === 0 ? 'pl-5 sm:pl-6' : ''}`}>
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50 dark:divide-white/[0.04]">
                      {visible.map(row => (
                        <tr
                          key={row.student_id}
                          onClick={() => navigate(`/institute-owner/students/${toSlug(row.name)}/progress`, { state: { studentId: row.user_id } })}
                          className="hover:bg-slate-50 dark:hover:bg-white/[0.03] cursor-pointer transition-colors"
                        >
                          <td className="px-4 pl-5 sm:pl-6 py-2.5 whitespace-nowrap">
                            <AvatarCell name={row.name} avatar={row.avatar} />
                          </td>
                          <td className="px-4 py-2.5 whitespace-nowrap">
                            <span className="text-slate-500 dark:text-slate-400 text-xs">{row.batch_name}</span>
                          </td>
                          <td className="px-4 py-2.5 whitespace-nowrap">{bandPill(row.current_band)}</td>
                          <td className="px-4 py-2.5 whitespace-nowrap">
                            <span className="text-slate-500 dark:text-slate-400 text-xs tabular-nums">{row.target_band ?? '—'}</span>
                          </td>
                          <td className="px-4 py-2.5 whitespace-nowrap">
                            <div className="flex items-center gap-1">
                              {trendIcon(row.band_trend)}
                              <span className={`text-xs font-semibold tabular-nums ${
                                row.gap !== null
                                  ? row.gap <= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'
                                  : 'text-slate-400'
                              }`}>
                                {row.gap !== null ? (row.gap > 0 ? `+${row.gap.toFixed(1)}` : row.gap.toFixed(1)) : '—'}
                              </span>
                            </div>
                          </td>
                          <td className="px-4 py-2.5 whitespace-nowrap">
                            <span className="inline-flex items-center gap-1 text-xs font-bold tabular-nums text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-500/10 px-2 py-0.5 rounded-full ring-1 ring-inset ring-amber-600/10 dark:ring-amber-400/20">
                              <Flame className="h-3 w-3" /> {row.daily_streak}
                            </span>
                          </td>
                          <td className="px-4 py-2.5 whitespace-nowrap">
                            {row.drilled_today
                              ? <CheckCircle className="h-4 w-4 text-emerald-500" />
                              : <Minus className="h-4 w-4 text-slate-300 dark:text-slate-600" />
                            }
                          </td>
                          <td className="px-4 py-2.5 whitespace-nowrap">
                            <span className="text-xs tabular-nums text-slate-500 dark:text-slate-400">{relativeTime(row.last_active)}</span>
                          </td>
                          <td className="px-4 py-2.5 whitespace-nowrap">
                            {row.is_at_risk ? (
                              <span className="inline-flex items-center text-[11px] font-medium bg-rose-50 dark:bg-rose-500/10 text-rose-700 dark:text-rose-400 px-2 py-0.5 rounded-full ring-1 ring-inset ring-rose-600/10 dark:ring-rose-400/20 truncate max-w-[100px]">
                                {row.primary_flag ?? 'At Risk'}
                              </span>
                            ) : (
                              <span className="text-slate-300 dark:text-slate-700 text-xs">—</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

          </div>
        </main>
      </div>
    </div>
  );
}