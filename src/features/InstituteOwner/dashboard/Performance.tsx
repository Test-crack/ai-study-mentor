// src/features/InstituteOwner/dashboard/Performance.tsx
import React, { useState, useEffect, useCallback } from 'react';
import {
  BarChart2, TrendingUp, Users, Target, AlertTriangle,
  Loader2, RefreshCw, ChevronDown, ChevronUp, Sparkles,
} from 'lucide-react';
import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Legend,
} from 'recharts';

import { InstituteOwnerSidebar } from '../components/InstitiuteOwnerSidebar';
import { InstituteOwnerTopbar } from '../components/InstituteOwnerTopbar';
import { useToast } from '@/shared/hooks/use-toast';
import {
  fetchBatchComparison, fetchEngagementTrends, fetchGoalAchievement,
  fetchCohortProgress, fetchSubskillHeatmap,
  type BatchComparisonRow, type EngagementWeek, type GoalAchievementData,
  type CohortProgressData, type SubskillHeatmapRow,
} from '../services/instituteOwnerService';

// ─── Helpers ──────────────────────────────────────────────────────────────────

type Tab = 'overview' | 'batches' | 'engagement' | 'goals' | 'heatmap';

const TABS: { key: Tab; label: string }[] = [
  { key: 'overview',    label: 'Cohort Progress' },
  { key: 'batches',     label: 'Batch Comparison' },
  { key: 'engagement',  label: 'Engagement Trends' },
  { key: 'goals',       label: 'Goal Achievement' },
  { key: 'heatmap',     label: 'Subskill Heatmap' },
];

// Chart palette — literal hex values of the brand tokens (chart libs need hex)
const CHART_PRIMARY   = '#12897C'; // brand-teal-500
const CHART_SECONDARY = '#185A78'; // brand-blue-600
const CHART_GRID      = '#D8E0E2'; // brand-line
const CHART_AXIS      = '#5E6B73'; // brand-text-mute

const CHART_TOOLTIP_STYLE = {
  borderRadius: 12,
  fontSize: 12,
  border: `1px solid ${CHART_GRID}`,
  boxShadow: '0 4px 16px rgba(0,0,0,0.08)',
} as const;

function Skeleton({ h = 'h-64' }: { h?: string }) {
  return <div className={`${h} bg-white border border-brand-line rounded-2xl animate-pulse`} />;
}

// ─── Sub-panels ───────────────────────────────────────────────────────────────

function CohortPanel({ data }: { data: CohortProgressData | null }) {
  if (!data) return <Skeleton />;
  const chartData = (data.monthly_points ?? []).map(m => ({
    name: m.month,
    avg: m.avg_ia_band ?? undefined,
    mock: m.avg_real_band ?? undefined,
  }));

  return (
    <div className="bg-white border border-brand-line rounded-2xl p-4 sm:p-6 shadow-sm">
      <h3 className="font-jetbrains text-[11px] font-bold uppercase tracking-[0.15em] text-brand-text mb-1">6-Month Band Progress</h3>
      <p className="text-xs text-brand-text-mute mb-5">Average band scores across all batches, tracked by IA sessions.</p>
      <div className="h-64 sm:h-80 lg:h-96 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={CHART_GRID} strokeOpacity={0.8} />
            <XAxis dataKey="name" tick={{ fontSize: 11, fill: CHART_AXIS }} axisLine={false} tickLine={false} />
            <YAxis domain={[4, 9]} tick={{ fontSize: 11, fill: CHART_AXIS }} axisLine={false} tickLine={false} />
            <Tooltip contentStyle={CHART_TOOLTIP_STYLE} />
            <Legend wrapperStyle={{ fontSize: 12 }} />
            <Line type="monotone" dataKey="avg"  name="IA Avg Band"   stroke={CHART_PRIMARY} strokeWidth={3} dot={{ r: 4 }} connectNulls />
            <Line type="monotone" dataKey="mock" name="Mock Avg Band" stroke={CHART_SECONDARY} strokeWidth={2} dot={{ r: 3 }} strokeDasharray="4 2" connectNulls />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

function BatchCompPanel({ rows }: { rows: BatchComparisonRow[] }) {
  const [expanded, setExpanded] = useState<string | null>(null);

  if (rows.length === 0) {
    return (
      <div className="bg-white border border-brand-line rounded-2xl p-12 text-center text-brand-text-mute shadow-sm">
        No batch data available yet.
      </div>
    );
  }

  const chartData = rows.map(b => ({
    name: b.batch_name.length > 14 ? b.batch_name.slice(0, 14) + '…' : b.batch_name,
    band: b.avg_band ?? 0, imp: b.improvement_delta ?? 0,
  }));

  return (
    <div className="space-y-4">
      <div className="bg-white border border-brand-line rounded-2xl p-4 sm:p-6 shadow-sm">
        <h3 className="font-jetbrains text-[11px] font-bold uppercase tracking-[0.15em] text-brand-text mb-4">Avg Band by Batch</h3>
        <div className="h-64 sm:h-80 lg:h-96 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={CHART_GRID} strokeOpacity={0.8} />
              <XAxis dataKey="name" tick={{ fontSize: 10, fill: CHART_AXIS }} axisLine={false} tickLine={false} />
              <YAxis domain={[4, 9]} tick={{ fontSize: 11, fill: CHART_AXIS }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={CHART_TOOLTIP_STYLE} />
              <Bar dataKey="band" name="Avg Band" fill={CHART_PRIMARY} radius={[4, 4, 0, 0]} />
              <Bar dataKey="imp" name="Improvement" fill={CHART_SECONDARY} radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="bg-white border border-brand-line rounded-2xl shadow-sm overflow-hidden">
        <div className="px-4 sm:px-6 py-4 border-b border-brand-line">
          <h3 className="font-jetbrains text-[11px] font-bold uppercase tracking-[0.15em] text-brand-text">Batch Details</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="font-jetbrains text-[10px] uppercase tracking-[0.12em] text-brand-text-mute border-b border-brand-line bg-brand-bg-alt">
                <th className="px-4 sm:px-6 py-2.5 text-left font-bold">Batch</th>
                <th className="px-4 py-2.5 text-center font-bold">Students</th>
                <th className="px-4 py-2.5 text-center font-bold">Avg Band</th>
                <th className="px-4 py-2.5 text-center font-bold">Improvement</th>
                <th className="px-4 py-2.5 text-center font-bold">IA Rate</th>
                <th className="px-4 py-2.5 text-center font-bold">At Risk</th>
                <th className="px-4 py-2.5 text-center font-bold">On Target</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-brand-line">
              {rows.map(b => (
                <React.Fragment key={b.batch_id}>
                  <tr
                    className="hover:bg-brand-bg-alt cursor-pointer transition-colors"
                    onClick={() => setExpanded(expanded === b.batch_id ? null : b.batch_id)}
                  >
                    <td className="px-4 sm:px-6 py-3">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-[13px] text-brand-text">{b.batch_name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-center font-bold tabular-nums text-brand-text">{b.student_count}</td>
                    <td className="px-4 py-3 text-center">
                      <span className="inline-flex items-center justify-center text-xs font-bold tabular-nums px-2.5 py-0.5 rounded-full bg-brand-teal-50 text-brand-teal-700 ring-1 ring-inset ring-brand-teal-600/20">
                        {b.avg_band !== null ? b.avg_band.toFixed(1) : '—'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      {b.improvement_delta !== null ? (
                        <span className={`font-bold tabular-nums ${(b.improvement_delta ?? 0) > 0 ? 'text-emerald-600' : (b.improvement_delta ?? 0) < 0 ? 'text-rose-500' : 'text-brand-text-mute'}`}>
                          {(b.improvement_delta ?? 0) > 0 ? '+' : ''}{(b.improvement_delta ?? 0).toFixed(1)}
                        </span>
                      ) : '—'}
                    </td>
                    <td className="px-4 py-3 text-center text-sm tabular-nums text-brand-text">{b.ia_completion_rate}%</td>
                    <td className="px-4 py-3 text-center">
                      <span className={`text-xs font-semibold tabular-nums px-2 py-0.5 rounded-full ring-1 ring-inset ${b.at_risk_pct > 20 ? 'bg-rose-50 text-rose-700 ring-rose-600/10' : 'bg-brand-bg-alt text-brand-text-mute ring-brand-line'}`}>
                        {b.at_risk_pct}%
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center text-brand-text-mute text-sm">—</td>
                  </tr>
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function EngagementPanel({ weeks }: { weeks: EngagementWeek[] }) {
  if (weeks.length === 0) return <Skeleton />;
  const latest = weeks[weeks.length - 1];
  const chartData = weeks.map(w => ({
    name: w.week_start.slice(5),
    active: w.engagement_rate, dcs: w.avg_dcs ?? 0,
  }));

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {[
          { label: 'Active Rate (latest week)', value: `${latest?.engagement_rate ?? 0}%` },
          { label: 'Avg DCS (latest week)', value: `${latest?.avg_dcs ?? 0}%` },
          { label: 'Weeks tracked', value: weeks.length },
        ].map(m => (
          <div key={m.label} className="rounded-2xl bg-white border border-brand-line p-4 sm:p-5 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-300">
            <p className="font-jetbrains text-[10px] font-bold uppercase tracking-wider text-brand-text-mute mb-2">{m.label}</p>
            <p className="text-2xl sm:text-3xl font-black tracking-tight tabular-nums text-brand-text">{m.value}</p>
          </div>
        ))}
      </div>
      <div className="bg-white border border-brand-line rounded-2xl p-4 sm:p-6 shadow-sm">
        <h3 className="font-jetbrains text-[11px] font-bold uppercase tracking-[0.15em] text-brand-text mb-4">8-Week Engagement Trend</h3>
        <div className="h-64 sm:h-80 lg:h-96 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={CHART_GRID} strokeOpacity={0.8} />
              <XAxis dataKey="name" tick={{ fontSize: 10, fill: CHART_AXIS }} axisLine={false} tickLine={false} />
              <YAxis domain={[0, 100]} unit="%" tick={{ fontSize: 11, fill: CHART_AXIS }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={CHART_TOOLTIP_STYLE} formatter={(v) => `${v}%`} />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Line type="monotone" dataKey="active" name="Active %" stroke={CHART_PRIMARY} strokeWidth={2} dot={{ r: 3 }} />
              <Line type="monotone" dataKey="dcs" name="DCS %" stroke={CHART_SECONDARY} strokeWidth={2} dot={{ r: 3 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}

function GoalsPanel({ data }: { data: GoalAchievementData | null }) {
  if (!data) return <Skeleton />;

  const total = data.below + data.near + data.at_or_above;
  const pct = (n: number) => total > 0 ? Math.round(n / total * 100) : 0;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {[
          { label: 'Below Target', value: data.below, pct: pct(data.below), color: 'text-rose-600', bg: 'bg-rose-50', ring: 'ring-rose-600/10' },
          { label: 'Near Target (≤0.5)', value: data.near, pct: pct(data.near), color: 'text-amber-600', bg: 'bg-amber-50', ring: 'ring-amber-600/10' },
          { label: 'At / Above Target', value: data.at_or_above, pct: pct(data.at_or_above), color: 'text-emerald-600', bg: 'bg-emerald-50', ring: 'ring-emerald-600/10' },
          { label: 'Exam Ready', value: data.exam_ready, pct: total > 0 ? Math.round(data.exam_ready / total * 100) : 0, color: 'text-brand-teal-600', bg: 'bg-brand-teal-50', ring: 'ring-brand-teal-600/10' },
        ].map(m => (
          <div key={m.label} className={`${m.bg} rounded-2xl p-4 sm:p-5 shadow-sm ring-1 ring-inset ${m.ring} hover:shadow-md hover:-translate-y-0.5 transition-all duration-300`}>
            <p className="font-jetbrains text-[10px] font-bold uppercase tracking-wider text-brand-text-mute mb-2">{m.label}</p>
            <p className={`text-2xl sm:text-3xl font-black tracking-tight tabular-nums ${m.color}`}>{m.value}</p>
            <p className="text-xs text-brand-text-mute mt-1.5">{m.pct}% of students with target</p>
          </div>
        ))}
      </div>

      {data.by_batch.length > 0 && (
        <div className="bg-white border border-brand-line rounded-2xl p-4 sm:p-6 shadow-sm">
          <h3 className="font-jetbrains text-[11px] font-bold uppercase tracking-[0.15em] text-brand-text mb-4">Goal Progress by Batch</h3>
          <div className="space-y-4">
            {data.by_batch.map(b => {
              const bTotal = b.below + b.near + b.at_or_above;
              const atPct = bTotal > 0 ? Math.round(b.at_or_above / bTotal * 100) : 0;
              return (
                <div key={b.batch_id}>
                  <div className="flex flex-wrap justify-between items-baseline gap-2 text-sm mb-1.5">
                    <span className="font-medium text-brand-text">{b.batch_name}</span>
                    <span className="text-xs tabular-nums text-brand-text-mute">{b.at_or_above}/{bTotal} on target ({atPct}%)</span>
                  </div>
                  <div className="w-full bg-brand-bg-alt rounded-full h-2 flex overflow-hidden">
                    <div className="bg-rose-400 h-2 transition-all" style={{ width: `${bTotal > 0 ? b.below / bTotal * 100 : 0}%` }} />
                    <div className="bg-amber-400 h-2 transition-all" style={{ width: `${bTotal > 0 ? b.near / bTotal * 100 : 0}%` }} />
                    <div className="bg-emerald-500 h-2 transition-all" style={{ width: `${atPct}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
          <div className="flex flex-wrap items-center gap-4 mt-5 pt-4 border-t border-brand-line font-jetbrains text-[10px] uppercase tracking-wider text-brand-text-mute">
            <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-rose-400 inline-block" />Below</span>
            <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-amber-400 inline-block" />Near</span>
            <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block" />On/Above target</span>
          </div>
        </div>
      )}
    </div>
  );
}

function HeatmapPanel({ rows }: { rows: SubskillHeatmapRow[] }) {
  if (rows.length === 0) return <div className="bg-white border border-brand-line rounded-2xl p-12 text-center text-brand-text-mute shadow-sm">No drill data yet.</div>;

  const bySkill = rows.reduce<Record<string, SubskillHeatmapRow[]>>((acc, r) => {
    (acc[r.skill] ??= []).push(r);
    return acc;
  }, {});

  return (
    <div className="space-y-4">
      {Object.entries(bySkill).map(([skill, subrows]) => (
        <div key={skill} className="bg-white border border-brand-line rounded-2xl p-4 sm:p-6 shadow-sm">
          <h3 className="font-jetbrains text-[11px] font-bold uppercase tracking-[0.15em] text-brand-text mb-4">{skill.toLowerCase()}</h3>
          <div className="space-y-2.5">
            {subrows.map(r => (
              <div key={r.sub_skill} className="flex items-center gap-2 sm:gap-3">
                <span className="text-xs text-brand-text-mute w-24 sm:w-40 shrink-0 truncate" title={r.sub_skill}>{r.sub_skill}</span>
                <div className="flex-1 min-w-0 bg-brand-bg-alt rounded-full h-2.5 relative overflow-hidden">
                  <div
                    className={`h-2.5 rounded-full transition-all ${
                      r.avg_accuracy >= 75 ? 'bg-gradient-to-r from-emerald-400 to-emerald-500'
                      : r.avg_accuracy >= 50 ? 'bg-gradient-to-r from-amber-400 to-amber-500'
                      : 'bg-gradient-to-r from-rose-400 to-rose-500'
                    }`}
                    style={{ width: `${r.avg_accuracy}%` }}
                  />
                </div>
                <span className="text-xs font-bold tabular-nums w-10 text-right text-brand-text">{r.avg_accuracy}%</span>
                <span className="hidden sm:inline text-xs tabular-nums text-brand-text-mute w-16 text-right">{r.drill_count} drills</span>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────

export default function Performance() {
  const { toast } = useToast();
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [activeTab, setActiveTab] = useState<Tab>('overview');
  const [loading, setLoading] = useState(true);

  const [cohort, setCohort]         = useState<CohortProgressData | null>(null);
  const [batches, setBatches]       = useState<BatchComparisonRow[]>([]);
  const [weeks, setWeeks]           = useState<EngagementWeek[]>([]);
  const [goals, setGoals]           = useState<GoalAchievementData | null>(null);
  const [heatmap, setHeatmap]       = useState<SubskillHeatmapRow[]>([]);

  const loadAll = useCallback(async () => {
    setLoading(true);
    try {
      const [cohortRes, batchRes, engRes, goalRes, heatRes] = await Promise.all([
        fetchCohortProgress(),
        fetchBatchComparison(),
        fetchEngagementTrends(),
        fetchGoalAchievement(),
        fetchSubskillHeatmap(),
      ]);
      setCohort(cohortRes.data);
      setBatches(batchRes.data ?? []);
      setWeeks(engRes.data ?? []);
      setGoals(goalRes.data);
      setHeatmap(heatRes.data ?? []);
    } catch (err: any) {
      toast({ title: 'Failed to load analytics', description: err.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => { loadAll(); }, [loadAll]);

  return (
    <div className="relative min-h-screen font-plex antialiased overflow-x-hidden bg-brand-bg text-brand-text">
      <InstituteOwnerSidebar
        activeTab="performance"
        isCollapsed={isSidebarCollapsed}
        toggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
      />

      <div className={`relative z-10 transition-all duration-300 ${isSidebarCollapsed ? 'lg:pl-24' : 'lg:pl-72'}`}>
        <InstituteOwnerTopbar />

        <main className="px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-8 max-w-[90rem] mx-auto pb-16">

            {/* ── Hero Banner ─────────────────────────────────────────────── */}
            <section className="relative overflow-hidden rounded-2xl sm:rounded-3xl border border-brand-line-16 bg-brand-ink-deep text-white px-5 sm:px-8 pt-6 sm:pt-8 pb-6 sm:pb-8 shadow-sm">
              <div className="relative flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                <div>
                  <span className="inline-flex items-center gap-1.5 font-jetbrains text-[10px] font-bold uppercase tracking-[0.2em] text-brand-teal-300 bg-brand-teal-500/10 border border-brand-teal-500/25 px-2.5 py-1 rounded-full">
                    <Sparkles className="w-3 h-3" /> Owner Portal
                  </span>
                  <h1 className="mt-3 font-manrope text-2xl sm:text-3xl font-black tracking-tight text-white">
                    Performance <span className="text-brand-mint">Analytics</span>
                  </h1>
                  <p className="mt-1.5 text-sm text-brand-on-ink">
                    Cohort trends, batch comparison, and engagement insights
                  </p>
                </div>

                <button
                  onClick={loadAll}
                  disabled={loading}
                  className="self-start shrink-0 inline-flex items-center gap-1.5 min-h-[40px] text-xs font-bold text-white bg-white/5 hover:bg-white/10 border border-brand-line-16 px-4 py-2 rounded-full transition-all disabled:opacity-60"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} /> Refresh
                </button>
              </div>
            </section>

            {/* ── Tabs ────────────────────────────────────────────────────── */}
            <div className="relative z-10">
              <div className="flex flex-wrap gap-1 bg-white border border-brand-line rounded-2xl p-1.5 shadow-sm">
                {TABS.map(t => (
                  <button
                    key={t.key}
                    onClick={() => setActiveTab(t.key)}
                    className={`min-h-[40px] px-4 py-2 rounded-xl text-sm font-semibold whitespace-nowrap transition-all ${
                      activeTab === t.key
                        ? 'bg-brand-teal-600 text-white shadow-sm'
                        : 'text-brand-text-mute hover:text-brand-text hover:bg-brand-bg-alt'
                    }`}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            </div>

            {/* ── Panels ──────────────────────────────────────────────────── */}
            <div className="pb-4">
              {loading ? (
                <div className="flex items-center justify-center h-64 rounded-2xl bg-white border border-brand-line shadow-sm">
                  <Loader2 className="w-8 h-8 animate-spin text-brand-teal-500" />
                </div>
              ) : (
                <>
                  {activeTab === 'overview'   && <CohortPanel data={cohort} />}
                  {activeTab === 'batches'    && <BatchCompPanel rows={batches} />}
                  {activeTab === 'engagement' && <EngagementPanel weeks={weeks} />}
                  {activeTab === 'goals'      && <GoalsPanel data={goals} />}
                  {activeTab === 'heatmap'    && <HeatmapPanel rows={heatmap} />}
                </>
              )}
            </div>

        </main>
      </div>
    </div>
  );
}
