import { useState, useEffect } from 'react';
import { useNavigate, useLocation, useParams } from 'react-router-dom';
import {
  ArrowLeft, Users, TrendingUp, TrendingDown, ArrowRight,
  Flame, Unlock, Activity, AlertTriangle, CheckCircle, Minus,
  ClipboardList, BookOpen
} from 'lucide-react';
import { InstituteOwnerSidebar } from '../components/InstitiuteOwnerSidebar';
import { InstituteOwnerTopbar } from '../components/InstituteOwnerTopbar';
import {
  fetchBatchDashboardSummary,
  BatchDashboardSummary,
  AtRiskRow,
  BandOverviewRow
} from '../services/instituteOwnerService';
import { useToast } from '@/shared/hooks/use-toast';

const toSlug = (name: string) => name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

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

function formatDate(iso: string | null): string {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
}

function delta(now: number, prev: number): string {
  const d = now - prev;
  if (d === 0) return '';
  return d > 0 ? `+${d}` : `${d}`;
}

// ─── KPI Card ─────────────────────────────────────────────────────────────────

interface KpiCardProps {
  icon: React.ReactNode;
  label: string;
  value: number | string;
  sub?: string;
  accent?: string;
}

function KpiCard({ icon, label, value, sub, accent = 'text-indigo-600 dark:text-indigo-400' }: KpiCardProps) {
  return (
    <div className="bg-white dark:bg-[#121214] border border-slate-200 dark:border-[#27272a] rounded-xl shadow-sm p-5 flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-slate-500 dark:text-gray-400 uppercase tracking-wider">{label}</span>
        <div className={`${accent} opacity-80`}>{icon}</div>
      </div>
      <div>
        <span className={`text-3xl font-bold ${accent}`}>{value}</span>
        {sub && <p className="text-xs text-slate-500 dark:text-gray-400 mt-1">{sub}</p>}
      </div>
    </div>
  );
}

// ─── Skeletons ────────────────────────────────────────────────────────────────

function KpiSkeleton() {
  return (
    <div className="animate-pulse bg-white dark:bg-[#121214] border border-slate-200 dark:border-[#27272a] rounded-xl shadow-sm p-5 space-y-3">
      <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded w-24" />
      <div className="h-8 bg-slate-200 dark:bg-slate-700 rounded w-16" />
    </div>
  );
}

// ─── At-Risk List ─────────────────────────────────────────────────────────────

function AtRiskList({ rows }: { rows: AtRiskRow[] }) {
  if (rows.length === 0) {
    return (
      <div className="flex items-center gap-2 py-6 text-slate-400 text-sm justify-center">
        <CheckCircle className="h-5 w-5 text-emerald-500" />
        No at-risk students in this batch
      </div>
    );
  }
  return (
    <div className="divide-y divide-slate-50 dark:divide-[#1a1a1a]">
      {rows.map(r => (
        <div key={r.student_id} className="flex items-center gap-4 px-4 py-3">
          <div className="h-8 w-8 rounded-full bg-rose-100 dark:bg-rose-900/30 flex items-center justify-center flex-shrink-0">
            <span className="text-xs font-bold text-rose-600 dark:text-rose-400">{r.name.charAt(0).toUpperCase()}</span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-slate-800 dark:text-white truncate">{r.name}</p>
            <p className="text-xs text-slate-500 dark:text-gray-400 truncate">{r.primary_flag}</p>
          </div>
          <div className="text-right flex-shrink-0">
            <p className="text-xs text-rose-600 dark:text-rose-400 font-semibold">{r.days_inactive < 0 ? 'Never active' : `${r.days_inactive}d inactive`}</p>
            {bandPill(r.current_band)}
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Band Overview Table ──────────────────────────────────────────────────────

function BandTable({ rows, onRowClick }: { rows: BandOverviewRow[]; onRowClick: (row: BandOverviewRow) => void }) {
  if (rows.length === 0) {
    return <p className="text-sm text-slate-400 py-6 text-center">No data available</p>;
  }
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-slate-100 dark:border-[#27272a]">
            {['Name', 'Band', 'Target', 'Gap', 'Trend', 'Streak', 'Drilled', 'Last IA'].map(h => (
              <th key={h} className="text-left text-xs font-semibold text-slate-500 dark:text-gray-400 uppercase tracking-wider px-4 py-3 whitespace-nowrap">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-50 dark:divide-[#1a1a1a]">
          {rows.map(row => (
            <tr
              key={row.student_id}
              onClick={() => onRowClick(row)}
              className="hover:bg-slate-50 dark:hover:bg-[#1a1a1a] cursor-pointer transition-colors"
            >
              <td className="px-4 py-3 whitespace-nowrap">
                <div className="flex items-center gap-3">
                  <div className="h-7 w-7 rounded-full bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center flex-shrink-0">
                    <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400">{row.name.charAt(0).toUpperCase()}</span>
                  </div>
                  <span className="font-medium text-slate-800 dark:text-white truncate max-w-[120px]">{row.name}</span>
                  {row.is_at_risk && <AlertTriangle className="h-3.5 w-3.5 text-rose-500 flex-shrink-0" />}
                </div>
              </td>
              <td className="px-4 py-3 whitespace-nowrap">{bandPill(row.current_band)}</td>
              <td className="px-4 py-3 whitespace-nowrap">
                <span className="text-xs text-slate-500 dark:text-gray-400">{row.target_band ?? '—'}</span>
              </td>
              <td className="px-4 py-3 whitespace-nowrap">
                <span className={`text-xs font-medium ${
                  row.gap !== null
                    ? row.gap <= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'
                    : 'text-slate-400'
                }`}>
                  {row.gap !== null ? (row.gap > 0 ? `+${row.gap.toFixed(1)}` : row.gap.toFixed(1)) : '—'}
                </span>
              </td>
              <td className="px-4 py-3 whitespace-nowrap">{trendIcon(row.band_trend)}</td>
              <td className="px-4 py-3 whitespace-nowrap">
                <span className="text-sm font-semibold text-slate-700 dark:text-slate-200">🔥 {row.streak}</span>
              </td>
              <td className="px-4 py-3 whitespace-nowrap">
                {row.drilled_today
                  ? <CheckCircle className="h-4 w-4 text-emerald-500" />
                  : <Minus className="h-4 w-4 text-slate-300 dark:text-slate-600" />
                }
              </td>
              <td className="px-4 py-3 whitespace-nowrap">
                <span className="text-xs text-slate-500 dark:text-gray-400">{formatDate(row.last_ia_date)}</span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function InstituteBatchDetailPage() {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [data, setData] = useState<BatchDashboardSummary | null>(null);
  const [loading, setLoading] = useState(true);

  const navigate = useNavigate();
  const location = useLocation();
  const params = useParams<{ batchSlug: string }>();
  const { toast } = useToast();

  // Resolve batchId from location state OR URL param
  const batchId: string = (location.state as any)?.batchId ?? params.batchSlug ?? '';

  useEffect(() => {
    if (!batchId) {
      toast({ title: 'No batch ID provided', variant: 'destructive' });
      setLoading(false);
      return;
    }
    async function load() {
      try {
        setLoading(true);
        const res = await fetchBatchDashboardSummary(batchId);
        if (res.success) setData(res.data);
      } catch {
        toast({ title: 'Failed to load batch details', variant: 'destructive' });
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [batchId]);

  const handleStudentClick = (row: BandOverviewRow) => {
    navigate(`/institute-owner/students/${toSlug(row.name)}/progress`, { state: { studentId: row.user_id } });
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-[#0a0a0a] font-sans text-slate-900 dark:text-white transition-colors duration-300">
      <div className="hidden lg:block">
        <InstituteOwnerSidebar
          activeTab="batches"
          isCollapsed={isSidebarCollapsed}
          toggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
        />
      </div>
      <div className={`transition-all duration-300 flex flex-col min-h-screen ${isSidebarCollapsed ? 'lg:pl-20' : 'lg:pl-64'}`}>
        <InstituteOwnerTopbar />
        <main className="flex-1 p-4 sm:p-6 lg:p-8">
          <div className="max-w-[1400px] mx-auto space-y-6">

            {/* Back + Title */}
            <div className="flex items-center gap-3">
              <button
                onClick={() => navigate(-1)}
                className="flex items-center gap-1.5 text-sm text-slate-500 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
              >
                <ArrowLeft className="h-4 w-4" />
                Back
              </button>
              <span className="text-slate-300 dark:text-slate-700">/</span>
              <h1 className="text-xl font-bold text-slate-900 dark:text-white">Batch Analytics</h1>
            </div>

            {/* KPI Cards */}
            {loading ? (
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {[1, 2, 3, 4].map(i => <KpiSkeleton key={i} />)}
              </div>
            ) : data ? (
              <>
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                  <KpiCard
                    icon={<Users className="h-5 w-5" />}
                    label="Active Students"
                    value={data.engagement_today.active_students}
                    sub={`${delta(data.engagement_today.active_students, data.engagement_today.active_yesterday)} vs yesterday`}
                    accent="text-indigo-600 dark:text-indigo-400"
                  />
                  <KpiCard
                    icon={<Activity className="h-5 w-5" />}
                    label="Avg DCS"
                    value={data.engagement_today.avg_dcs.toFixed(1)}
                    sub={`${delta(Math.round(data.engagement_today.avg_dcs * 10), Math.round(data.engagement_today.avg_dcs_yesterday * 10)) || '—'} vs yesterday`}
                    accent="text-sky-600 dark:text-sky-400"
                  />
                  <KpiCard
                    icon={<Flame className="h-5 w-5" />}
                    label="Streaks Alive"
                    value={data.engagement_today.streaks_alive}
                    accent="text-amber-600 dark:text-amber-400"
                  />
                  <KpiCard
                    icon={<Unlock className="h-5 w-5" />}
                    label="Platform Unlocked"
                    value={data.engagement_today.platform_unlocked}
                    accent="text-emerald-600 dark:text-emerald-400"
                  />
                </div>

                {/* Period Summary */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="bg-white dark:bg-[#121214] border border-slate-200 dark:border-[#27272a] rounded-xl shadow-sm p-5 flex items-center gap-4">
                    <div className="h-10 w-10 rounded-xl bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center flex-shrink-0">
                      <ClipboardList className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-slate-500 dark:text-gray-400 uppercase tracking-wider">IA Completed (7 days)</p>
                      <p className="text-2xl font-bold text-slate-900 dark:text-white mt-0.5">
                        {data.period_summary.ia_completed_last_7_days}
                        <span className="text-sm font-normal text-slate-500 dark:text-gray-400 ml-1">/ {data.period_summary.ia_total_students}</span>
                      </p>
                    </div>
                  </div>
                  <div className="bg-white dark:bg-[#121214] border border-slate-200 dark:border-[#27272a] rounded-xl shadow-sm p-5 flex items-center gap-4">
                    <div className="h-10 w-10 rounded-xl bg-violet-100 dark:bg-violet-900/30 flex items-center justify-center flex-shrink-0">
                      <BookOpen className="h-5 w-5 text-violet-600 dark:text-violet-400" />
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-slate-500 dark:text-gray-400 uppercase tracking-wider">Mock Completed (month)</p>
                      <p className="text-2xl font-bold text-slate-900 dark:text-white mt-0.5">
                        {data.period_summary.mock_completed_this_month}
                        <span className="text-sm font-normal text-slate-500 dark:text-gray-400 ml-1">/ {data.period_summary.mock_total_students}</span>
                      </p>
                    </div>
                  </div>
                </div>

                {/* Two-column section: at-risk + band overview */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* At-Risk */}
                  <div className="bg-white dark:bg-[#121214] border border-slate-200 dark:border-[#27272a] rounded-xl shadow-sm overflow-hidden">
                    <div className="flex items-center gap-2 px-4 py-3 border-b border-slate-100 dark:border-[#27272a]">
                      <AlertTriangle className="h-4 w-4 text-rose-500" />
                      <h2 className="font-semibold text-sm text-slate-800 dark:text-white">At-Risk Students</h2>
                      {data.at_risk.length > 0 && (
                        <span className="ml-auto text-xs bg-rose-100 dark:bg-rose-900/20 text-rose-600 dark:text-rose-400 px-2 py-0.5 rounded-full font-semibold">
                          {data.at_risk.length}
                        </span>
                      )}
                    </div>
                    <AtRiskList rows={data.at_risk} />
                  </div>

                  {/* Band Overview */}
                  <div className="lg:col-span-2 bg-white dark:bg-[#121214] border border-slate-200 dark:border-[#27272a] rounded-xl shadow-sm overflow-hidden">
                    <div className="flex items-center gap-2 px-4 py-3 border-b border-slate-100 dark:border-[#27272a]">
                      <TrendingUp className="h-4 w-4 text-indigo-500" />
                      <h2 className="font-semibold text-sm text-slate-800 dark:text-white">Band Overview</h2>
                      <span className="ml-auto text-xs text-slate-500 dark:text-gray-400">Click a row to view full progress</span>
                    </div>
                    <BandTable rows={data.band_overview} onRowClick={handleStudentClick} />
                  </div>
                </div>
              </>
            ) : (
              <div className="flex flex-col items-center justify-center py-24 text-center bg-white dark:bg-[#121214] border border-slate-200 dark:border-[#27272a] rounded-xl">
                <p className="text-slate-500 dark:text-gray-400 font-medium">No data found for this batch</p>
              </div>
            )}

          </div>
        </main>
      </div>
    </div>
  );
}
