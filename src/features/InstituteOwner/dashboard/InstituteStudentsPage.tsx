import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search, Filter, AlertTriangle, CheckCircle, Minus,
  TrendingUp, TrendingDown, ArrowRight, Users
} from 'lucide-react';
import { InstituteOwnerSidebar } from '../components/InstitiuteOwnerSidebar';
import { InstituteOwnerTopbar } from '../components/InstituteOwnerTopbar';
import { fetchStudents, StudentRow } from '../services/instituteOwnerService';
import { useToast } from '@/shared/hooks/use-toast';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function bandPill(band: number | null) {
  if (band === null) return <span className="text-xs text-slate-400">—</span>;
  const b = Number(band);
  let cls = 'text-xs font-semibold px-2 py-0.5 rounded-full ';
  if (b >= 7)      cls += 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400';
  else if (b >= 6) cls += 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400';
  else if (b >= 5) cls += 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400';
  else             cls += 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400';
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
    <div className="flex items-center gap-3">
      {avatar ? (
        <img src={avatar} alt={name} className="h-8 w-8 rounded-full object-cover flex-shrink-0" />
      ) : (
        <div className="h-8 w-8 rounded-full bg-indigo-100 dark:bg-indigo-900/40 flex items-center justify-center flex-shrink-0">
          <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400">
            {name.charAt(0).toUpperCase()}
          </span>
        </div>
      )}
      <span className="font-medium text-sm text-slate-800 dark:text-white truncate max-w-[140px]">{name}</span>
    </div>
  );
}

// ─── Loading Skeleton ─────────────────────────────────────────────────────────

function TableSkeleton() {
  return (
    <div className="space-y-3">
      {[1, 2, 3].map(i => (
        <div key={i} className="animate-pulse flex gap-4 px-4 py-3 bg-white dark:bg-[#121214] rounded-xl border border-slate-200 dark:border-[#27272a]">
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
  const [examFilter, setExamFilter]   = useState('');
  const [atRiskOnly, setAtRiskOnly]   = useState(false);

  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    async function load() {
      try {
        setLoading(true);
        const params: { batchId?: string; exam_type?: string; at_risk?: boolean } = {};
        if (batchFilter) params.batchId = batchFilter;
        if (examFilter)  params.exam_type = examFilter;
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
  }, [batchFilter, examFilter, atRiskOnly]);

  // Derived filter options
  const batchOptions = useMemo(() => {
    const map = new Map<string, string>();
    students.forEach(s => map.set(s.batch_id, s.batch_name));
    return Array.from(map.entries());
  }, [students]);

  const examOptions = useMemo(() => {
    return [...new Set(students.map(s => s.exam_type))];
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
          <div className="max-w-[1400px] mx-auto space-y-6">

            {/* Header */}
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Students</h1>
                <p className="text-sm text-slate-500 dark:text-gray-400 mt-1">
                  {loading ? 'Loading…' : `${visible.length} student${visible.length !== 1 ? 's' : ''} shown`}
                </p>
              </div>
            </div>

            {/* Filter Bar */}
            <div className="bg-white dark:bg-[#121214] border border-slate-200 dark:border-[#27272a] rounded-xl shadow-sm p-4 flex flex-wrap gap-3 items-center">
              {/* Search */}
              <div className="relative flex-1 min-w-[200px]">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search by name…"
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-sm bg-slate-50 dark:bg-[#0a0a0a] border border-slate-200 dark:border-[#27272a] rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/30 text-slate-700 dark:text-slate-200 placeholder:text-slate-400"
                />
              </div>

              {/* Batch */}
              <select
                value={batchFilter}
                onChange={e => setBatchFilter(e.target.value)}
                className="text-sm bg-slate-50 dark:bg-[#0a0a0a] border border-slate-200 dark:border-[#27272a] rounded-lg px-3 py-2 text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
              >
                <option value="">All Batches</option>
                {batchOptions.map(([id, name]) => (
                  <option key={id} value={id}>{name}</option>
                ))}
              </select>

              {/* Exam type */}
              <select
                value={examFilter}
                onChange={e => setExamFilter(e.target.value)}
                className="text-sm bg-slate-50 dark:bg-[#0a0a0a] border border-slate-200 dark:border-[#27272a] rounded-lg px-3 py-2 text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
              >
                <option value="">All Exams</option>
                {examOptions.map(e => <option key={e} value={e}>{e}</option>)}
              </select>

              {/* At-risk toggle */}
              <button
                onClick={() => setAtRiskOnly(!atRiskOnly)}
                className={`flex items-center gap-2 text-sm px-3 py-2 rounded-lg border transition-colors ${
                  atRiskOnly
                    ? 'bg-rose-50 dark:bg-rose-900/20 border-rose-300 dark:border-rose-700 text-rose-600 dark:text-rose-400'
                    : 'bg-slate-50 dark:bg-[#0a0a0a] border-slate-200 dark:border-[#27272a] text-slate-600 dark:text-slate-400'
                }`}
              >
                <AlertTriangle className="h-4 w-4" />
                At-Risk Only
              </button>
            </div>

            {/* Table */}
            <div className="bg-white dark:bg-[#121214] border border-slate-200 dark:border-[#27272a] rounded-xl shadow-sm overflow-hidden">
              {loading ? (
                <div className="p-4"><TableSkeleton /></div>
              ) : visible.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 text-center">
                  <Users className="h-12 w-12 text-slate-300 dark:text-slate-600 mb-4" />
                  <p className="text-slate-500 dark:text-gray-400 font-medium">No students found</p>
                  <p className="text-sm text-slate-400 mt-1">Try adjusting your filters</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-slate-100 dark:border-[#27272a]">
                        {['Name', 'Batch', 'Exam', 'Band', 'Target', 'Gap', 'Streak', 'Drilled', 'Last Active', 'Flag'].map(h => (
                          <th key={h} className="text-left text-xs font-semibold text-slate-500 dark:text-gray-400 uppercase tracking-wider px-4 py-3 whitespace-nowrap">
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50 dark:divide-[#1a1a1a]">
                      {visible.map(row => (
                        <tr
                          key={row.student_id}
                          onClick={() => navigate(`/institute-owner/students/${row.user_id}/progress`, { state: { student: row } })}
                          className="hover:bg-slate-50 dark:hover:bg-[#1a1a1a] cursor-pointer transition-colors"
                        >
                          <td className="px-4 py-3 whitespace-nowrap">
                            <AvatarCell name={row.name} avatar={row.avatar} />
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            <span className="text-slate-600 dark:text-slate-300 text-xs">{row.batch_name}</span>
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            <span className="text-xs bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 px-2 py-0.5 rounded-full">{row.exam_type}</span>
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap">{bandPill(row.current_band)}</td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            <span className="text-slate-500 dark:text-gray-400 text-xs">{row.target_band ?? '—'}</span>
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            <div className="flex items-center gap-1">
                              {trendIcon(row.band_trend)}
                              <span className={`text-xs font-medium ${
                                row.gap !== null
                                  ? row.gap <= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'
                                  : 'text-slate-400'
                              }`}>
                                {row.gap !== null ? (row.gap > 0 ? `+${row.gap.toFixed(1)}` : row.gap.toFixed(1)) : '—'}
                              </span>
                            </div>
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            <span className="text-sm font-semibold text-slate-700 dark:text-slate-200">
                              🔥 {row.daily_streak}
                            </span>
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            {row.drilled_today
                              ? <CheckCircle className="h-4 w-4 text-emerald-500" />
                              : <Minus className="h-4 w-4 text-slate-300 dark:text-slate-600" />
                            }
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            <span className="text-xs text-slate-500 dark:text-gray-400">{relativeTime(row.last_active)}</span>
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            {row.is_at_risk ? (
                              <span className="text-xs bg-rose-50 dark:bg-rose-900/20 text-rose-600 dark:text-rose-400 px-2 py-0.5 rounded-full border border-rose-200 dark:border-rose-800 truncate max-w-[100px] block">
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
