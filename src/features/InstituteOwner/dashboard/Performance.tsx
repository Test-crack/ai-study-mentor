import React, { useState, useEffect, useCallback } from 'react';
import {
  BarChart2, TrendingUp, Users, Target, AlertTriangle,
  Loader2, RefreshCw, ChevronDown, ChevronUp,
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
  return <div className={`${h} bg-white dark:bg-[#121214] border border-slate-200 dark:border-[#27272a] rounded-xl animate-pulse`} />;
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
    <div className="bg-white dark:bg-[#121214] border border-slate-200 dark:border-[#27272a] rounded-xl p-6 shadow-sm">
      <h3 className="font-bold text-slate-800 dark:text-white mb-1">6-Month Band Progress</h3>
      <p className="text-xs text-slate-500 mb-5">Average band scores across all batches, tracked by IA sessions.</p>
      <div className="h-72">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" strokeOpacity={0.5} />
            <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
            <YAxis domain={[4, 9]} tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
            <Tooltip contentStyle={{ borderRadius: 8, fontSize: 12 }} />
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
      <div className="bg-white dark:bg-[#121214] border border-slate-200 dark:border-[#27272a] rounded-xl p-12 text-center text-slate-500 shadow-sm">
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
      <div className="bg-white dark:bg-[#121214] border border-slate-200 dark:border-[#27272a] rounded-xl p-6 shadow-sm">
        <h3 className="font-bold text-slate-800 dark:text-white mb-4">Avg Band by Batch</h3>
        <div className="h-56">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} strokeOpacity={0.5} />
              <XAxis dataKey="name" tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
              <YAxis domain={[0, 9]} tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ borderRadius: 8, fontSize: 12 }} />
              <Bar dataKey="band" name="Avg Band" fill="#6366f1" radius={[4, 4, 0, 0]} />
              <Bar dataKey="imp" name="Improvement" fill="#10b981" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="bg-white dark:bg-[#121214] border border-slate-200 dark:border-[#27272a] rounded-xl shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 dark:border-[#27272a]">
          <h3 className="font-bold text-slate-800 dark:text-white">Batch Details</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-[11px] uppercase tracking-widest text-slate-400 border-b border-slate-100 dark:border-[#27272a]">
                <th className="px-6 py-3 text-left">Batch</th>
                <th className="px-4 py-3 text-center">Students</th>
                <th className="px-4 py-3 text-center">Avg Band</th>
                <th className="px-4 py-3 text-center">Improvement</th>
                <th className="px-4 py-3 text-center">IA Rate</th>
                <th className="px-4 py-3 text-center">At Risk</th>
                <th className="px-4 py-3 text-center">On Target</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 dark:divide-[#27272a]">
              {rows.map(b => (
                <React.Fragment key={b.batch_id}>
                  <tr
                    className="hover:bg-slate-50 dark:hover:bg-white/[0.02] cursor-pointer transition-colors"
                    onClick={() => setExpanded(expanded === b.batch_id ? null : b.batch_id)}
                  >
                    <td className="px-6 py-3">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-slate-800 dark:text-slate-200">{b.batch_name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-center font-bold">{b.student_count}</td>
                    <td className="px-4 py-3 text-center font-bold text-indigo-600 dark:text-indigo-400">
                      {b.avg_band !== null ? b.avg_band.toFixed(1) : '—'}
                    </td>
                    <td className="px-4 py-3 text-center">
                      {b.improvement_delta !== null ? (
                        <span className={`font-bold ${(b.improvement_delta ?? 0) > 0 ? 'text-emerald-600 dark:text-emerald-400' : (b.improvement_delta ?? 0) < 0 ? 'text-rose-500' : 'text-slate-400'}`}>
                          {(b.improvement_delta ?? 0) > 0 ? '+' : ''}{(b.improvement_delta ?? 0).toFixed(1)}
                        </span>
                      ) : '—'}
                    </td>
                    <td className="px-4 py-3 text-center text-sm">{b.ia_completion_rate}%</td>
                    <td className="px-4 py-3 text-center">
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${b.at_risk_pct > 20 ? 'bg-rose-50 dark:bg-rose-500/10 text-rose-700 dark:text-rose-400' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'}`}>
                        {b.at_risk_pct}%
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center text-slate-400 text-sm">—</td>
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
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        {[
          { label: 'Active Rate (latest week)', value: `${latest?.engagement_rate ?? 0}%` },
          { label: 'Avg DCS (latest week)', value: `${latest?.avg_dcs ?? 0}%` },
          { label: 'Weeks tracked', value: weeks.length },
        ].map(m => (
          <div key={m.label} className="bg-white dark:bg-[#121214] border border-slate-200 dark:border-[#27272a] rounded-xl p-4 shadow-sm">
            <p className="text-xs text-slate-500 mb-1">{m.label}</p>
            <p className="text-2xl font-bold">{m.value}</p>
          </div>
        ))}
      </div>
      <div className="bg-white dark:bg-[#121214] border border-slate-200 dark:border-[#27272a] rounded-xl p-6 shadow-sm">
        <h3 className="font-bold text-slate-800 dark:text-white mb-4">8-Week Engagement Trend</h3>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} strokeOpacity={0.5} />
              <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#64748b' }} axisLine={false} tickLine={false} />
              <YAxis domain={[0, 100]} unit="%" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ borderRadius: 8, fontSize: 12 }} formatter={(v) => `${v}%`} />
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
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Below Target', value: data.below, pct: pct(data.below), color: 'text-rose-600 dark:text-rose-400', bg: 'bg-rose-50 dark:bg-rose-500/10' },
          { label: 'Near Target (≤0.5)', value: data.near, pct: pct(data.near), color: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-50 dark:bg-amber-500/10' },
          { label: 'At / Above Target', value: data.at_or_above, pct: pct(data.at_or_above), color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-50 dark:bg-emerald-500/10' },
          { label: 'Exam Ready', value: data.exam_ready, pct: total > 0 ? Math.round(data.exam_ready / total * 100) : 0, color: 'text-indigo-600 dark:text-indigo-400', bg: 'bg-indigo-50 dark:bg-indigo-500/10' },
        ].map(m => (
          <div key={m.label} className={`${m.bg} border border-slate-200 dark:border-[#27272a] rounded-xl p-4 shadow-sm`}>
            <p className="text-xs text-slate-600 dark:text-slate-400 mb-2 font-medium">{m.label}</p>
            <p className={`text-3xl font-bold ${m.color}`}>{m.value}</p>
            <p className="text-xs text-slate-400 mt-1">{m.pct}% of students with target</p>
          </div>
        ))}
      </div>

      {data.by_batch.length > 0 && (
        <div className="bg-white dark:bg-[#121214] border border-slate-200 dark:border-[#27272a] rounded-xl p-6 shadow-sm">
          <h3 className="font-bold text-slate-800 dark:text-white mb-4">Goal Progress by Batch</h3>
          <div className="space-y-3">
            {data.by_batch.map(b => {
              const bTotal = b.below + b.near + b.at_or_above;
              const atPct = bTotal > 0 ? Math.round(b.at_or_above / bTotal * 100) : 0;
              return (
                <div key={b.batch_id}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="font-medium text-slate-700 dark:text-slate-300">{b.batch_name}</span>
                    <span className="text-xs text-slate-400">{b.at_or_above}/{bTotal} on target ({atPct}%)</span>
                  </div>
                  <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2 flex overflow-hidden">
                    <div className="bg-rose-400 h-2 transition-all" style={{ width: `${bTotal > 0 ? b.below / bTotal * 100 : 0}%` }} />
                    <div className="bg-amber-400 h-2 transition-all" style={{ width: `${bTotal > 0 ? b.near / bTotal * 100 : 0}%` }} />
                    <div className="bg-emerald-500 h-2 transition-all" style={{ width: `${atPct}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
          <div className="flex items-center gap-4 mt-4 text-xs text-slate-400">
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
  if (rows.length === 0) return <div className="bg-white dark:bg-[#121214] border border-slate-200 dark:border-[#27272a] rounded-xl p-12 text-center text-slate-500">No drill data yet.</div>;

  const bySkill = rows.reduce<Record<string, SubskillHeatmapRow[]>>((acc, r) => {
    (acc[r.skill] ??= []).push(r);
    return acc;
  }, {});

  return (
    <div className="space-y-4">
      {Object.entries(bySkill).map(([skill, subrows]) => (
        <div key={skill} className="bg-white dark:bg-[#121214] border border-slate-200 dark:border-[#27272a] rounded-xl p-6 shadow-sm">
          <h3 className="font-bold text-slate-800 dark:text-white mb-4 capitalize">{skill.toLowerCase()}</h3>
          <div className="space-y-2">
            {subrows.map(r => (
              <div key={r.sub_skill} className="flex items-center gap-3">
                <span className="text-xs text-slate-500 w-40 shrink-0 truncate" title={r.sub_skill}>{r.sub_skill}</span>
                <div className="flex-1 bg-slate-100 dark:bg-slate-800 rounded-full h-3 relative overflow-hidden">
                  <div
                    className={`h-3 rounded-full transition-all ${
                      r.avg_accuracy >= 75 ? 'bg-emerald-500'
                      : r.avg_accuracy >= 50 ? 'bg-amber-500'
                      : 'bg-rose-500'
                    }`}
                    style={{ width: `${r.avg_accuracy}%` }}
                  />
                </div>
                <span className="text-xs font-bold w-10 text-right text-slate-700 dark:text-slate-300">{r.avg_accuracy}%</span>
                <span className="text-xs text-slate-400 w-16 text-right">{r.drill_count} drills</span>
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
          <div className="max-w-[1400px] mx-auto space-y-6">

            {/* Header */}
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold">Performance Analytics</h1>
                <p className="text-sm text-slate-500 mt-0.5">Cohort trends, batch comparison, and engagement insights</p>
              </div>
              <button
                onClick={loadAll}
                disabled={loading}
                className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-indigo-600 transition-colors"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} /> Refresh
              </button>
            </div>

            {/* Tabs */}
            <div className="flex gap-1 bg-slate-100 dark:bg-[#1a1a1c] rounded-xl p-1 w-fit overflow-x-auto">
              {TABS.map(t => (
                <button
                  key={t.key}
                  onClick={() => setActiveTab(t.key)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all ${
                    activeTab === t.key
                      ? 'bg-white dark:bg-[#27272a] text-slate-900 dark:text-white shadow-sm'
                      : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>

            {loading ? (
              <div className="flex items-center justify-center h-64">
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
        </main>
      </div>
    </div>
  );
}
