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
  if (band === null) return <span className="text-xs text-brand-text-mute">—</span>;
  const b = Number(band);
  let cls = 'inline-flex items-center justify-center text-xs font-bold tabular-nums px-2.5 py-0.5 rounded-full ring-1 ring-inset ';
  if (b >= 7)      cls += 'bg-emerald-50 text-emerald-700 ring-emerald-600/20';
  else if (b >= 6) cls += 'bg-brand-blue-50 text-brand-blue-600 ring-brand-blue-600/20';
  else if (b >= 5) cls += 'bg-amber-50 text-amber-700 ring-amber-600/20';
  else             cls += 'bg-rose-50 text-rose-700 ring-rose-600/20';
  return <span className={cls}>{b.toFixed(1)}</span>;
}

function trendIcon(trend: 'up' | 'flat' | 'down' | null) {
  if (trend === 'up')   return <TrendingUp className="h-4 w-4 text-emerald-500" />;
  if (trend === 'down') return <TrendingDown className="h-4 w-4 text-rose-500" />;
  return <ArrowRight className="h-4 w-4 text-brand-text-mute" />;
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
        <img src={avatar} alt={name} className="h-8 w-8 rounded-full object-cover flex-shrink-0 ring-1 ring-brand-line" />
      ) : (
        <div className="h-8 w-8 rounded-full bg-brand-teal-50 ring-1 ring-brand-teal-200 flex items-center justify-center flex-shrink-0">
          <span className="text-xs font-bold text-brand-teal-600">
            {name.charAt(0).toUpperCase()}
          </span>
        </div>
      )}
      <span className="font-medium text-[13px] text-brand-text truncate max-w-[140px]">{name}</span>
    </div>
  );
}

// ─── Loading Skeleton ─────────────────────────────────────────────────────────

function TableSkeleton() {
  return (
    <div className="space-y-3">
      {[1, 2, 3].map(i => (
        <div key={i} className="animate-pulse flex gap-4 px-4 py-3 bg-white rounded-xl border border-brand-line">
          <div className="h-8 w-8 rounded-full bg-brand-bg-alt flex-shrink-0" />
          <div className="flex-1 space-y-2 my-auto">
            <div className="h-3 bg-brand-bg-alt rounded w-32" />
            <div className="h-2 bg-brand-bg-alt rounded w-20" />
          </div>
          {[...Array(6)].map((_, j) => (
            <div key={j} className="hidden sm:block h-4 bg-brand-bg-alt rounded w-12 my-auto" />
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
    <div className="relative min-h-screen font-plex antialiased overflow-x-hidden bg-brand-bg text-brand-text">
      <InstituteOwnerSidebar
        activeTab="students"
        isCollapsed={isSidebarCollapsed}
        toggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
      />
      <div className={`relative z-10 transition-all duration-300 ${isSidebarCollapsed ? 'lg:pl-24' : 'lg:pl-72'}`}>
        <InstituteOwnerTopbar />
        <main className="px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6 max-w-[90rem] mx-auto pb-16">
          <div>

            {/* ── Hero Banner ─────────────────────────────────────────────── */}
            <section className="relative overflow-hidden rounded-2xl sm:rounded-3xl border border-brand-line-16 bg-brand-ink-deep text-white p-6 sm:p-8 shadow-sm">
              <div className="relative">
                <span className="font-jetbrains inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.2em] text-brand-on-ink-mute bg-white/5 border border-brand-line-12 px-2.5 py-1 rounded-full">
                  Owner Portal
                </span>
                <h1 className="font-manrope mt-3 text-2xl sm:text-3xl font-black tracking-tight text-white">
                  Students
                </h1>
                <p className="mt-1.5 text-sm text-brand-on-ink">
                  {loading ? 'Loading…' : `${visible.length} student${visible.length !== 1 ? 's' : ''} shown`}
                </p>
              </div>
            </section>

            {/* ── Filter Bar ──────────────────────────────────────────────── */}
            <div className="mt-6 rounded-2xl bg-white border border-brand-line shadow-sm p-4 sm:p-5 flex flex-wrap gap-3 items-center">
              {/* Search */}
              <div className="relative flex-1 basis-full sm:basis-auto min-w-[200px]">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-brand-text-mute" />
                <input
                  type="text"
                  placeholder="Search by name…"
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  className="w-full pl-9 pr-3 py-2.5 min-h-[44px] text-sm bg-brand-bg-alt border border-brand-line rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-teal-500/30 focus:border-brand-teal-300 text-brand-text placeholder:text-brand-text-mute transition-colors"
                />
              </div>

              {/* Batch */}
              <select
                value={batchFilter}
                onChange={e => setBatchFilter(e.target.value)}
                className="flex-1 sm:flex-none min-h-[44px] text-sm bg-brand-bg-alt border border-brand-line rounded-xl px-3 py-2.5 text-brand-text focus:outline-none focus:ring-2 focus:ring-brand-teal-500/30 transition-colors"
              >
                <option value="">All Batches</option>
                {batchOptions.map(([id, name]) => (
                  <option key={id} value={id}>{name}</option>
                ))}
              </select>

              {/* At-risk toggle */}
              <button
                onClick={() => setAtRiskOnly(!atRiskOnly)}
                className={`flex-1 sm:flex-none justify-center flex items-center gap-2 min-h-[44px] text-sm font-medium px-3.5 py-2.5 rounded-xl border transition-all ${
                  atRiskOnly
                    ? 'bg-rose-50 border-rose-300 text-rose-600 shadow-sm'
                    : 'bg-brand-bg-alt border-brand-line text-brand-text hover:border-rose-200'
                }`}
              >
                <AlertTriangle className="h-4 w-4" />
                At-Risk Only
              </button>
            </div>

            {/* ── Table ───────────────────────────────────────────────────── */}
            <div className="mt-6 rounded-2xl bg-white border border-brand-line shadow-sm overflow-hidden">
              {loading ? (
                <div className="p-4"><TableSkeleton /></div>
              ) : visible.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 px-4 text-center">
                  <div className="w-14 h-14 rounded-2xl bg-brand-bg-alt flex items-center justify-center mb-4">
                    <Users className="h-7 w-7 text-brand-text-mute" />
                  </div>
                  <p className="text-brand-text font-semibold">No students found</p>
                  <p className="text-sm text-brand-text-mute mt-1">Try adjusting your filters</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-brand-line bg-brand-bg-alt">
                        {['Name', 'Batch', 'Band', 'Target', 'Gap', 'Streak', 'Drilled', 'Last Active', 'Flag'].map((h, i) => (
                          <th key={h} className={`font-jetbrains text-left text-[10px] font-bold text-brand-text-mute uppercase tracking-[0.15em] px-4 py-3 whitespace-nowrap ${i === 0 ? 'pl-4 sm:pl-6' : ''}`}>
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-brand-line">
                      {visible.map(row => (
                        <tr
                          key={row.student_id}
                          onClick={() => navigate(`/institute-owner/students/${toSlug(row.name)}/progress`, { state: { studentId: row.user_id } })}
                          className="hover:bg-brand-bg-alt cursor-pointer transition-colors"
                        >
                          <td className="px-4 pl-4 sm:pl-6 py-3 whitespace-nowrap">
                            <AvatarCell name={row.name} avatar={row.avatar} />
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            <span className="text-brand-text-mute text-xs">{row.batch_name}</span>
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap">{bandPill(row.current_band)}</td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            <span className="text-brand-text-mute text-xs tabular-nums">{row.target_band ?? '—'}</span>
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            <div className="flex items-center gap-1">
                              {trendIcon(row.band_trend)}
                              <span className={`text-xs font-semibold tabular-nums ${
                                row.gap !== null
                                  ? row.gap <= 0 ? 'text-emerald-600' : 'text-rose-600'
                                  : 'text-brand-text-mute'
                              }`}>
                                {row.gap !== null ? (row.gap > 0 ? `+${row.gap.toFixed(1)}` : row.gap.toFixed(1)) : '—'}
                              </span>
                            </div>
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            <span className="inline-flex items-center gap-1 text-xs font-bold tabular-nums text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full ring-1 ring-inset ring-amber-600/10">
                              <Flame className="h-3 w-3" /> {row.daily_streak}
                            </span>
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            {row.drilled_today
                              ? <CheckCircle className="h-4 w-4 text-emerald-500" />
                              : <Minus className="h-4 w-4 text-brand-text-mute" />
                            }
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            <span className="text-xs tabular-nums text-brand-text-mute">{relativeTime(row.last_active)}</span>
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            {row.is_at_risk ? (
                              <span className="inline-flex items-center text-[11px] font-medium bg-rose-50 text-rose-700 px-2 py-0.5 rounded-full ring-1 ring-inset ring-rose-600/10 truncate max-w-[100px]">
                                {row.primary_flag ?? 'At Risk'}
                              </span>
                            ) : (
                              <span className="text-brand-text-mute text-xs">—</span>
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