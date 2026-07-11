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

function Skeleton({ h = 'h-64' }: { h?: string }) {
  return <div className={`${h} bg-white dark:bg-[#131318] border border-slate-200/70 dark:border-white/[0.08] rounded-2xl animate-pulse`} />;
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
    <div className="bg-white dark:bg-[#131318] border border-slate-200/70 dark:border-white/[0.08] rounded-2xl p-5 sm:p-6 shadow-sm">
      <h3 className="font-bold tracking-tight text-slate-900 dark:text-white mb-1">6-Month Band Progress</h3>
      <p className="text-xs text-slate-400 dark:text-slate-500 mb-5">Average band scores across all batches, tracked by IA sessions.</p>
      <div className="h-72">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" strokeOpacity={0.5} />
            <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
            <YAxis domain={[4, 9]} tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
            <Tooltip contentStyle={{ borderRadius: 12, fontSize: 12, border: '1px solid rgba(148,163,184,0.25)', boxShadow: '0 4px 16px rgba(0,0,0,0.08)' }} />
            <Legend wrapperStyle={{ fontSize: 12 }} />
            <Line type="monotone" dataKey="avg"  name="IA Avg Band"   stroke="#6366f1" strokeWidth={3} dot={{ r: 4 }} connectNulls />
            <Line type="monotone" dataKey="mock" name="Mock Avg Band" stroke="#10b981" strokeWidth={2} dot={{ r: 3 }} strokeDasharray="4 2" connectNulls />
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
      <div className="bg-white dark:bg-[#131318] border border-slate-200/70 dark:border-white/[0.08] rounded-2xl p-12 text-center text-slate-500 dark:text-slate-400 shadow-sm">
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
      <div className="bg-white dark:bg-[#131318] border border-slate-200/70 dark:border-white/[0.08] rounded-2xl p-5 sm:p-6 shadow-sm">
        <h3 className="font-bold tracking-tight text-slate-900 dark:text-white mb-4">Avg Band by Batch</h3>
        <div className="h-56">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} strokeOpacity={0.5} />
              <XAxis dataKey="name" tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
              <YAxis domain={[0, 9]} tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ borderRadius: 12, fontSize: 12, border: '1px solid rgba(148,163,184,0.25)', boxShadow: '0 4px 16px rgba(0,0,0,0.08)' }} />
              <Bar dataKey="band" name="Avg Band" fill="#6366f1" radius={[4, 4, 0, 0]} />
              <Bar dataKey="imp" name="Improvement" fill="#10b981" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="bg-white dark:bg-[#131318] border border-slate-200/70 dark:border-white/[0.08] rounded-2xl shadow-sm overflow-hidden">
        <div className="px-5 sm:px-6 py-4 border-b border-slate-100 dark:border-white/[0.06]">
          <h3 className="font-bold tracking-tight text-slate-900 dark:text-white">Batch Details</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-[10px] uppercase tracking-[0.12em] text-slate-400 dark:text-slate-500 border-b border-slate-100 dark:border-white/[0.06] bg-slate-50/60 dark:bg-white/[0.02]">
                <th className="px-5 sm:px-6 py-2.5 text-left font-semibold">Batch</th>
                <th className="px-4 py-2.5 text-center font-semibold">Students</th>
                <th className="px-4 py-2.5 text-center font-semibold">Avg Band</th>
                <th className="px-4 py-2.5 text-center font-semibold">Improvement</th>
                <th className="px-4 py-2.5 text-center font-semibold">IA Rate</th>
                <th className="px-4 py-2.5 text-center font-semibold">At Risk</th>
                <th className="px-4 py-2.5 text-center font-semibold">On Target</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 dark:divide-white/[0.04]">
              {rows.map(b => (
                <React.Fragment key={b.batch_id}>
                  <tr
                    className="hover:bg-slate-50 dark:hover:bg-white/[0.03] cursor-pointer transition-colors"
                    onClick={() => setExpanded(expanded === b.batch_id ? null : b.batch_id)}
                  >
                    <td className="px-5 sm:px-6 py-2.5">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-[13px] text-slate-800 dark:text-slate-200">{b.batch_name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-2.5 text-center font-bold tabular-nums">{b.student_count}</td>
                    <td className="px-4 py-2.5 text-center">
                      <span className="inline-flex items-center justify-center text-xs font-bold tabular-nums px-2.5 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-500/10 text-indigo-700 dark:text-indigo-400 ring-1 ring-inset ring-indigo-600/20 dark:ring-indigo-400/25">
                        {b.avg_band !== null ? b.avg_band.toFixed(1) : '—'}
                      </span>
                    </td>
                    <td className="px-4 py-2.5 text-center">
                      {b.improvement_delta !== null ? (
                        <span className={`font-bold tabular-nums ${(b.improvement_delta ?? 0) > 0 ? 'text-emerald-600 dark:text-emerald-400' : (b.improvement_delta ?? 0) < 0 ? 'text-rose-500' : 'text-slate-400'}`}>
                          {(b.improvement_delta ?? 0) > 0 ? '+' : ''}{(b.improvement_delta ?? 0).toFixed(1)}
                        </span>
                      ) : '—'}
                    </td>
                    <td className="px-4 py-2.5 text-center text-sm tabular-nums text-slate-600 dark:text-slate-300">{b.ia_completion_rate}%</td>
                    <td className="px-4 py-2.5 text-center">
                      <span className={`text-xs font-semibold tabular-nums px-2 py-0.5 rounded-full ring-1 ring-inset ${b.at_risk_pct > 20 ? 'bg-rose-50 dark:bg-rose-500/10 text-rose-700 dark:text-rose-400 ring-rose-600/10 dark:ring-rose-400/20' : 'bg-slate-100 dark:bg-white/[0.06] text-slate-600 dark:text-slate-300 ring-slate-400/20 dark:ring-white/10'}`}>
                        {b.at_risk_pct}%
                      </span>
                    </td>
                    <td className="px-4 py-2.5 text-center text-slate-300 dark:text-slate-600 text-sm">—</td>
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
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4">
        {[
          { label: 'Active Rate (latest week)', value: `${latest?.engagement_rate ?? 0}%` },
          { label: 'Avg DCS (latest week)', value: `${latest?.avg_dcs ?? 0}%` },
          { label: 'Weeks tracked', value: weeks.length },
        ].map(m => (
          <div key={m.label} className="rounded-2xl bg-white/85 dark:bg-[#131318]/90 backdrop-blur-xl border border-white/20 dark:border-white/[0.08] ring-1 ring-slate-900/[0.05] dark:ring-0 p-4 sm:p-5 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-300">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">{m.label}</p>
            <p className="text-2xl sm:text-3xl font-bold tracking-tight tabular-nums text-slate-900 dark:text-white">{m.value}</p>
          </div>
        ))}
      </div>
      <div className="bg-white dark:bg-[#131318] border border-slate-200/70 dark:border-white/[0.08] rounded-2xl p-5 sm:p-6 shadow-sm">
        <h3 className="font-bold tracking-tight text-slate-900 dark:text-white mb-4">8-Week Engagement Trend</h3>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} strokeOpacity={0.5} />
              <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#64748b' }} axisLine={false} tickLine={false} />
              <YAxis domain={[0, 100]} unit="%" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ borderRadius: 12, fontSize: 12, border: '1px solid rgba(148,163,184,0.25)', boxShadow: '0 4px 16px rgba(0,0,0,0.08)' }} formatter={(v) => `${v}%`} />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Line type="monotone" dataKey="active" name="Active %" stroke="#6366f1" strokeWidth={2} dot={{ r: 3 }} />
              <Line type="monotone" dataKey="dcs" name="DCS %" stroke="#10b981" strokeWidth={2} dot={{ r: 3 }} />
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
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {[
          { label: 'Below Target', value: data.below, pct: pct(data.below), color: 'text-rose-600 dark:text-rose-400', bg: 'bg-rose-50/80 dark:bg-rose-500/[0.07]', ring: 'ring-rose-600/10 dark:ring-rose-400/15' },
          { label: 'Near Target (≤0.5)', value: data.near, pct: pct(data.near), color: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-50/80 dark:bg-amber-500/[0.07]', ring: 'ring-amber-600/10 dark:ring-amber-400/15' },
          { label: 'At / Above Target', value: data.at_or_above, pct: pct(data.at_or_above), color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-50/80 dark:bg-emerald-500/[0.07]', ring: 'ring-emerald-600/10 dark:ring-emerald-400/15' },
          { label: 'Exam Ready', value: data.exam_ready, pct: total > 0 ? Math.round(data.exam_ready / total * 100) : 0, color: 'text-indigo-600 dark:text-indigo-400', bg: 'bg-indigo-50/80 dark:bg-indigo-500/[0.07]', ring: 'ring-indigo-600/10 dark:ring-indigo-400/15' },
        ].map(m => (
          <div key={m.label} className={`${m.bg} rounded-2xl p-4 sm:p-5 shadow-sm ring-1 ring-inset ${m.ring} hover:shadow-md hover:-translate-y-0.5 transition-all duration-300`}>
            <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">{m.label}</p>
            <p className={`text-2xl sm:text-3xl font-bold tracking-tight tabular-nums ${m.color}`}>{m.value}</p>
            <p className="text-xs text-slate-400 dark:text-slate-500 mt-1.5">{m.pct}% of students with target</p>
          </div>
        ))}
      </div>

      {data.by_batch.length > 0 && (
        <div className="bg-white dark:bg-[#131318] border border-slate-200/70 dark:border-white/[0.08] rounded-2xl p-5 sm:p-6 shadow-sm">
          <h3 className="font-bold tracking-tight text-slate-900 dark:text-white mb-4">Goal Progress by Batch</h3>
          <div className="space-y-4">
            {data.by_batch.map(b => {
              const bTotal = b.below + b.near + b.at_or_above;
              const atPct = bTotal > 0 ? Math.round(b.at_or_above / bTotal * 100) : 0;
              return (
                <div key={b.batch_id}>
                  <div className="flex justify-between items-baseline text-sm mb-1.5">
                    <span className="font-medium text-slate-700 dark:text-slate-300">{b.batch_name}</span>
                    <span className="text-xs tabular-nums text-slate-400 dark:text-slate-500">{b.at_or_above}/{bTotal} on target ({atPct}%)</span>
                  </div>
                  <div className="w-full bg-slate-100 dark:bg-white/[0.06] rounded-full h-2 flex overflow-hidden">
                    <div className="bg-rose-400 h-2 transition-all" style={{ width: `${bTotal > 0 ? b.below / bTotal * 100 : 0}%` }} />
                    <div className="bg-amber-400 h-2 transition-all" style={{ width: `${bTotal > 0 ? b.near / bTotal * 100 : 0}%` }} />
                    <div className="bg-emerald-500 h-2 transition-all" style={{ width: `${atPct}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
          <div className="flex items-center gap-4 mt-5 pt-4 border-t border-slate-100 dark:border-white/[0.06] text-xs text-slate-400 dark:text-slate-500">
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
  if (rows.length === 0) return <div className="bg-white dark:bg-[#131318] border border-slate-200/70 dark:border-white/[0.08] rounded-2xl p-12 text-center text-slate-500 dark:text-slate-400 shadow-sm">No drill data yet.</div>;

  const bySkill = rows.reduce<Record<string, SubskillHeatmapRow[]>>((acc, r) => {
    (acc[r.skill] ??= []).push(r);
    return acc;
  }, {});

  return (
    <div className="space-y-4">
      {Object.entries(bySkill).map(([skill, subrows]) => (
        <div key={skill} className="bg-white dark:bg-[#131318] border border-slate-200/70 dark:border-white/[0.08] rounded-2xl p-5 sm:p-6 shadow-sm">
          <h3 className="font-bold tracking-tight text-slate-900 dark:text-white mb-4 capitalize">{skill.toLowerCase()}</h3>
          <div className="space-y-2.5">
            {subrows.map(r => (
              <div key={r.sub_skill} className="flex items-center gap-3">
                <span className="text-xs text-slate-500 dark:text-slate-400 w-40 shrink-0 truncate" title={r.sub_skill}>{r.sub_skill}</span>
                <div className="flex-1 bg-slate-100 dark:bg-white/[0.06] rounded-full h-2.5 relative overflow-hidden">
                  <div
                    className={`h-2.5 rounded-full transition-all ${
                      r.avg_accuracy >= 75 ? 'bg-gradient-to-r from-emerald-400 to-emerald-500'
                      : r.avg_accuracy >= 50 ? 'bg-gradient-to-r from-amber-400 to-amber-500'
                      : 'bg-gradient-to-r from-rose-400 to-rose-500'
                    }`}
                    style={{ width: `${r.avg_accuracy}%` }}
                  />
                </div>
                <span className="text-xs font-bold tabular-nums w-10 text-right text-slate-700 dark:text-slate-300">{r.avg_accuracy}%</span>
                <span className="text-xs tabular-nums text-slate-400 dark:text-slate-500 w-16 text-right">{r.drill_count} drills</span>
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
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-[#0a0a0a] font-sans text-slate-900 dark:text-white transition-colors duration-300">
      <div className="hidden lg:block">
        <InstituteOwnerSidebar
          activeTab="performance"
          isCollapsed={isSidebarCollapsed}
          toggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
        />
      </div>

      <div className={`transition-all duration-300 flex flex-col min-h-screen ${isSidebarCollapsed ? 'lg:pl-20' : 'lg:pl-64'}`}>
        <InstituteOwnerTopbar />

        <main className="flex-1 p-4 sm:p-6 lg:p-8">
          <div className="max-w-[1400px] mx-auto">

            {/* ── Hero Banner ─────────────────────────────────────────────── */}
            <section className="relative overflow-hidden rounded-2xl sm:rounded-3xl border border-indigo-100/80 dark:border-white/[0.06] bg-gradient-to-r from-[#eff4ff] via-[#f4f1ff] to-[#f3f0ff] dark:from-[#111827] dark:via-[#161a38] dark:to-[#1e1b4b] px-5 sm:px-8 pt-6 sm:pt-8 pb-14 sm:pb-16 shadow-sm">
              <div aria-hidden className="pointer-events-none select-none absolute inset-0">
                <div className="absolute -top-20 -right-12 w-64 h-64 rounded-full bg-indigo-300/25 dark:bg-indigo-500/15 blur-3xl" />
                <div className="absolute -bottom-28 left-1/3 w-72 h-72 rounded-full bg-violet-300/20 dark:bg-violet-500/10 blur-3xl" />
                <div className="absolute top-8 -left-10 w-44 h-44 rounded-full bg-sky-300/20 dark:bg-sky-500/10 blur-3xl" />
              </div>

              <div className="relative flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                <div>
                  <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-indigo-600 dark:text-indigo-300 bg-white/60 dark:bg-white/[0.06] border border-white/70 dark:border-white/[0.08] backdrop-blur px-2.5 py-1 rounded-full">
                    <Sparkles className="w-3 h-3" /> Owner Portal
                  </span>
                  <h1 className="mt-3 text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
                    Performance <span className="text-indigo-600 dark:text-indigo-400">Analytics</span>
                  </h1>
                  <p className="mt-1.5 text-sm text-slate-500 dark:text-slate-400">
                    Cohort trends, batch comparison, and engagement insights
                  </p>
                </div>

                <button
                  onClick={loadAll}
                  disabled={loading}
                  className="self-start shrink-0 inline-flex items-center gap-1.5 text-xs font-medium text-slate-600 dark:text-slate-300 bg-white/70 dark:bg-white/[0.06] hover:bg-white dark:hover:bg-white/[0.12] border border-white/70 dark:border-white/[0.08] backdrop-blur px-3.5 py-2 rounded-full shadow-sm transition-all disabled:opacity-60"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} /> Refresh
                </button>
              </div>
            </section>

            {/* ── Tabs (overlap hero) ─────────────────────────────────────── */}
            <div className="relative z-10 -mt-7 sm:-mt-8">
              <div className="inline-flex max-w-full gap-1 bg-white/85 dark:bg-[#131318]/90 backdrop-blur-xl border border-white/20 dark:border-white/[0.08] ring-1 ring-slate-900/[0.05] dark:ring-0 rounded-2xl p-1.5 shadow-sm overflow-x-auto">
                {TABS.map(t => (
                  <button
                    key={t.key}
                    onClick={() => setActiveTab(t.key)}
                    className={`px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-all ${
                      activeTab === t.key
                        ? 'bg-indigo-600 text-white shadow-sm dark:bg-indigo-500'
                        : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-50 dark:hover:bg-white/[0.04]'
                    }`}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            </div>

            {/* ── Panels ──────────────────────────────────────────────────── */}
            <div className="mt-6 pb-4">
              {loading ? (
                <div className="flex items-center justify-center h-64 rounded-2xl bg-white dark:bg-[#131318] border border-slate-200/70 dark:border-white/[0.08] shadow-sm">
                  <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
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

          </div>
        </main>
      </div>
    </div>
  );
}