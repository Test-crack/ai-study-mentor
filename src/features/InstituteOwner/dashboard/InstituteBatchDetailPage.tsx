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
  if (band === null) return <span className="text-xs text-brand-text-mute">—</span>;
  const b = Number(band);
  let cls = 'text-xs font-semibold px-2 py-0.5 rounded-full ';
  if (b >= 7)      cls += 'bg-emerald-100 text-emerald-700';
  else if (b >= 6) cls += 'bg-sky-100 text-sky-700';
  else if (b >= 5) cls += 'bg-amber-100 text-amber-700';
  else             cls += 'bg-rose-100 text-rose-700';
  return <span className={cls}>{b.toFixed(1)}</span>;
}

function trendIcon(trend: 'up' | 'flat' | 'down' | null) {
  if (trend === 'up')   return <TrendingUp className="h-4 w-4 text-emerald-500" />;
  if (trend === 'down') return <TrendingDown className="h-4 w-4 text-rose-500" />;
  return <ArrowRight className="h-4 w-4 text-brand-text-mute" />;
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

function KpiCard({ icon, label, value, sub, accent = 'text-brand-teal-600' }: KpiCardProps) {
  return (
    <div className="bg-white border border-brand-line rounded-2xl shadow-sm p-4 sm:p-5 flex flex-col gap-3">
      <div className="flex items-center justify-between gap-2">
        <span className="font-jetbrains text-[10px] sm:text-xs font-bold text-brand-text-mute uppercase tracking-wider">{label}</span>
        <div className={`${accent} opacity-80 shrink-0`}>{icon}</div>
      </div>
      <div>
        <span className={`text-2xl sm:text-3xl font-black ${accent}`}>{value}</span>
        {sub && <p className="text-xs text-brand-text-mute mt-1">{sub}</p>}
      </div>
    </div>
  );
}

// ─── Skeletons ────────────────────────────────────────────────────────────────

function KpiSkeleton() {
  return (
    <div className="animate-pulse bg-white border border-brand-line rounded-2xl shadow-sm p-4 sm:p-5 space-y-3">
      <div className="h-3 bg-brand-bg-alt rounded w-24" />
      <div className="h-8 bg-brand-bg-alt rounded w-16" />
    </div>
  );
}

// ─── At-Risk List ─────────────────────────────────────────────────────────────

function AtRiskList({ rows }: { rows: AtRiskRow[] }) {
  if (rows.length === 0) {
    return (
      <div className="flex items-center gap-2 py-6 text-brand-text-mute text-sm justify-center">
        <CheckCircle className="h-5 w-5 text-emerald-500" />
        No at-risk students in this batch
      </div>
    );
  }
  return (
    <div className="divide-y divide-brand-line">
      {rows.map(r => (
        <div key={r.student_id} className="flex items-center gap-4 px-4 py-3">
          <div className="h-9 w-9 rounded-full bg-rose-100 flex items-center justify-center flex-shrink-0">
            <span className="text-xs font-bold text-rose-600">{r.name.charAt(0).toUpperCase()}</span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-brand-text truncate">{r.name}</p>
            <p className="text-xs text-brand-text-mute truncate">{r.primary_flag}</p>
          </div>
          <div className="text-right flex-shrink-0">
            <p className="text-xs text-rose-600 font-semibold">{r.days_inactive < 0 ? 'Never active' : `${r.days_inactive}d inactive`}</p>
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
    return <p className="text-sm text-brand-text-mute py-6 text-center">No data available</p>;
  }
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-brand-line bg-brand-bg-alt">
            {['Name', 'Band', 'Target', 'Gap', 'Trend', 'Streak', 'Drilled', 'Last IA'].map(h => (
              <th key={h} className="text-left font-jetbrains text-[10px] font-bold text-brand-text-mute uppercase tracking-wider px-4 py-3 whitespace-nowrap">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-brand-line">
          {rows.map(row => (
            <tr
              key={row.student_id}
              onClick={() => onRowClick(row)}
              className="hover:bg-brand-bg-alt cursor-pointer transition-colors"
            >
              <td className="px-4 py-3 whitespace-nowrap">
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 rounded-full bg-brand-teal-50 flex items-center justify-center flex-shrink-0">
                    <span className="text-xs font-bold text-brand-teal-600">{row.name.charAt(0).toUpperCase()}</span>
                  </div>
                  <span className="font-medium text-brand-text truncate max-w-[120px]">{row.name}</span>
                  {row.is_at_risk && <AlertTriangle className="h-3.5 w-3.5 text-rose-500 flex-shrink-0" />}
                </div>
              </td>
              <td className="px-4 py-3 whitespace-nowrap">{bandPill(row.current_band)}</td>
              <td className="px-4 py-3 whitespace-nowrap">
                <span className="text-xs text-brand-text-mute">{row.target_band ?? '—'}</span>
              </td>
              <td className="px-4 py-3 whitespace-nowrap">
                <span className={`text-xs font-medium ${
                  row.gap !== null
                    ? row.gap <= 0 ? 'text-emerald-600' : 'text-rose-600'
                    : 'text-brand-text-mute'
                }`}>
                  {row.gap !== null ? (row.gap > 0 ? `+${row.gap.toFixed(1)}` : row.gap.toFixed(1)) : '—'}
                </span>
              </td>
              <td className="px-4 py-3 whitespace-nowrap">{trendIcon(row.band_trend)}</td>
              <td className="px-4 py-3 whitespace-nowrap">
                <span className="text-sm font-semibold text-brand-text">🔥 {row.streak}</span>
              </td>
              <td className="px-4 py-3 whitespace-nowrap">
                {row.drilled_today
                  ? <CheckCircle className="h-4 w-4 text-emerald-500" />
                  : <Minus className="h-4 w-4 text-brand-text-mute" />
                }
              </td>
              <td className="px-4 py-3 whitespace-nowrap">
                <span className="text-xs text-brand-text-mute">{formatDate(row.last_ia_date)}</span>
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
    <div className="relative min-h-screen font-plex antialiased overflow-x-hidden bg-brand-bg text-brand-text">
      <InstituteOwnerSidebar
        activeTab="batches"
        isCollapsed={isSidebarCollapsed}
        toggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
      />
      <div className={`relative z-10 transition-all duration-300 ${isSidebarCollapsed ? 'lg:pl-24' : 'lg:pl-72'}`}>
        <InstituteOwnerTopbar />
        <main className="px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-8 max-w-[90rem] mx-auto pb-16">

            {/* Back + Title */}
            <div className="flex flex-wrap items-center gap-3">
              <button
                onClick={() => navigate(-1)}
                className="flex items-center gap-1.5 min-h-[40px] text-sm font-medium text-brand-text-mute hover:text-brand-teal-600 transition-colors"
              >
                <ArrowLeft className="h-4 w-4" />
                Back
              </button>
              <span className="text-brand-line">/</span>
              <h1 className="font-manrope text-xl sm:text-2xl font-black tracking-tight text-brand-text">Batch Analytics</h1>
            </div>

            {/* KPI Cards */}
            {loading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {[1, 2, 3, 4].map(i => <KpiSkeleton key={i} />)}
              </div>
            ) : data ? (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <KpiCard
                    icon={<Users className="h-5 w-5" />}
                    label="Active Students"
                    value={data.engagement_today.active_students}
                    sub={`${delta(data.engagement_today.active_students, data.engagement_today.active_yesterday)} vs yesterday`}
                    accent="text-brand-teal-600"
                  />
                  <KpiCard
                    icon={<Activity className="h-5 w-5" />}
                    label="Avg DCS"
                    value={data.engagement_today.avg_dcs.toFixed(1)}
                    sub={`${delta(Math.round(data.engagement_today.avg_dcs * 10), Math.round(data.engagement_today.avg_dcs_yesterday * 10)) || '—'} vs yesterday`}
                    accent="text-sky-600"
                  />
                  <KpiCard
                    icon={<Flame className="h-5 w-5" />}
                    label="Streaks Alive"
                    value={data.engagement_today.streaks_alive}
                    accent="text-amber-600"
                  />
                  <KpiCard
                    icon={<Unlock className="h-5 w-5" />}
                    label="Platform Unlocked"
                    value={data.engagement_today.platform_unlocked}
                    accent="text-emerald-600"
                  />
                </div>

                {/* Period Summary */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="bg-white border border-brand-line rounded-2xl shadow-sm p-4 sm:p-5 flex items-center gap-4">
                    <div className="h-10 w-10 rounded-xl bg-brand-teal-50 flex items-center justify-center flex-shrink-0">
                      <ClipboardList className="h-5 w-5 text-brand-teal-600" />
                    </div>
                    <div className="min-w-0">
                      <p className="font-jetbrains text-[10px] font-bold text-brand-text-mute uppercase tracking-wider">IA Completed (7 days)</p>
                      <p className="text-2xl font-black text-brand-text mt-0.5">
                        {data.period_summary.ia_completed_last_7_days}
                        <span className="text-sm font-normal text-brand-text-mute ml-1">/ {data.period_summary.ia_total_students}</span>
                      </p>
                    </div>
                  </div>
                  <div className="bg-white border border-brand-line rounded-2xl shadow-sm p-4 sm:p-5 flex items-center gap-4">
                    <div className="h-10 w-10 rounded-xl bg-brand-blue-50 flex items-center justify-center flex-shrink-0">
                      <BookOpen className="h-5 w-5 text-brand-blue-600" />
                    </div>
                    <div className="min-w-0">
                      <p className="font-jetbrains text-[10px] font-bold text-brand-text-mute uppercase tracking-wider">Mock Completed (month)</p>
                      <p className="text-2xl font-black text-brand-text mt-0.5">
                        {data.period_summary.mock_completed_this_month}
                        <span className="text-sm font-normal text-brand-text-mute ml-1">/ {data.period_summary.mock_total_students}</span>
                      </p>
                    </div>
                  </div>
                </div>

                {/* Two-column section: at-risk + band overview */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* At-Risk */}
                  <div className="bg-white border border-brand-line rounded-2xl shadow-sm overflow-hidden">
                    <div className="flex items-center gap-2 px-4 py-3 border-b border-brand-line">
                      <AlertTriangle className="h-4 w-4 text-rose-500" />
                      <h2 className="font-jetbrains text-[11px] font-bold uppercase tracking-[0.15em] text-brand-text">At-Risk Students</h2>
                      {data.at_risk.length > 0 && (
                        <span className="ml-auto text-xs bg-rose-100 text-rose-600 px-2 py-0.5 rounded-full font-semibold">
                          {data.at_risk.length}
                        </span>
                      )}
                    </div>
                    <AtRiskList rows={data.at_risk} />
                  </div>

                  {/* Band Overview */}
                  <div className="lg:col-span-2 bg-white border border-brand-line rounded-2xl shadow-sm overflow-hidden">
                    <div className="flex flex-wrap items-center gap-2 px-4 py-3 border-b border-brand-line">
                      <TrendingUp className="h-4 w-4 text-brand-teal-500" />
                      <h2 className="font-jetbrains text-[11px] font-bold uppercase tracking-[0.15em] text-brand-text">Band Overview</h2>
                      <span className="ml-auto text-xs text-brand-text-mute">Click a row to view full progress</span>
                    </div>
                    <BandTable rows={data.band_overview} onRowClick={handleStudentClick} />
                  </div>
                </div>
              </>
            ) : (
              <div className="flex flex-col items-center justify-center py-24 text-center bg-white border border-brand-line rounded-2xl shadow-sm">
                <p className="text-brand-text-mute font-medium">No data found for this batch</p>
              </div>
            )}

        </main>
      </div>
    </div>
  );
}
