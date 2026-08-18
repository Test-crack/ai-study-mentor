// src/features/Institute/dashboard/InstituteReports.tsx
// Reports — real analytics (replaces the mock struggle-groups page).
// All data comes from the analytics endpoints already mounted on
// /api/institute-admin/analytics/* (shared owner handlers):
// cohort progress, batch comparison, goal achievement, sub-skill heatmap.
import { useCallback, useEffect, useState } from "react";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from "recharts";
import { TrendingUp, Layers, Target, Grid3X3 } from "lucide-react";
import { InstituteAdminLayout } from "../components/InstituteAdminLayout";
import { SectionCard, StatusBadge, BandPill, TableSkeleton, EmptyState, ErrorBanner } from "../components/shared/primitives";
import { callBackend } from "@/features/auth/services/authClient";
import { getBackendUrl } from "@/shared/utils";
import type {
  CohortProgressData, BatchComparisonRow, GoalAchievementData, SubskillHeatmapRow,
} from "@/features/InstituteOwner/services/instituteOwnerService";

const BASE = () => `${getBackendUrl()}/api/institute-admin`;

// ─── Sub-skill heatmap cell coloring (accuracy %) ─────────────────────────────

function heatClass(acc: number): string {
  if (acc >= 80) return "bg-emerald-500/90 text-white";
  if (acc >= 65) return "bg-emerald-300/80 text-emerald-950";
  if (acc >= 50) return "bg-amber-300/80 text-amber-950";
  if (acc >= 35) return "bg-orange-400/80 text-white";
  return "bg-rose-500/85 text-white";
}

export default function InstituteReports() {
  const [cohort, setCohort] = useState<CohortProgressData | null>(null);
  const [comparison, setComparison] = useState<BatchComparisonRow[]>([]);
  const [goals, setGoals] = useState<GoalAchievementData | null>(null);
  const [heatmap, setHeatmap] = useState<SubskillHeatmapRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [cohortRes, compRes, goalRes, heatRes] = await Promise.all([
        callBackend(`${BASE()}/analytics/cohort-progress`),
        callBackend(`${BASE()}/analytics/batch-comparison`),
        callBackend(`${BASE()}/analytics/goal-achievement`),
        callBackend(`${BASE()}/analytics/subskill-heatmap`),
      ]);
      setCohort(cohortRes.data ?? null);
      setComparison(compRes.data ?? []);
      setGoals(goalRes.data ?? null);
      setHeatmap(heatRes.data ?? []);
    } catch (err: any) {
      setError(err?.message ?? "Failed to load reports.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const goalTotal = goals ? goals.below + goals.near + goals.at_or_above + goals.exam_ready : 0;

  // Group heatmap rows by skill for the grid
  const heatBySkill = heatmap.reduce<Record<string, SubskillHeatmapRow[]>>((acc, r) => {
    (acc[r.skill] = acc[r.skill] ?? []).push(r);
    return acc;
  }, {});

  return (
    <InstituteAdminLayout activeTab="reports">
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-brand-text">Reports</h1>
        <p className="text-sm text-brand-text-mute mt-0.5">Institute-wide performance, straight from live assessment and drill data.</p>
      </div>

      {error && <ErrorBanner message={error} onRetry={load} />}

      {loading ? (
        <TableSkeleton rows={8} />
      ) : (
        <>
          {/* Cohort progress */}
          <SectionCard title="Cohort Band Progress" icon={TrendingUp}>
            {!cohort || cohort.monthly_points.length === 0 ? (
              <EmptyState title="Not enough data yet" hint="Band trends appear once students complete assessments across months." />
            ) : (
              <div className="h-56 sm:h-64 lg:h-72 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={cohort.monthly_points} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="currentColor" className="text-brand-line" />
                    <XAxis dataKey="month" tick={{ fontSize: 12 }} stroke="#94a3b8" />
                    <YAxis domain={[4, 9]} tick={{ fontSize: 12 }} stroke="#94a3b8" />
                    <Tooltip contentStyle={{ borderRadius: 12, fontSize: 12 }} />
                    <Legend wrapperStyle={{ fontSize: 12 }} />
                    <Line type="monotone" dataKey="avg_ia_band" name="Avg IA band" stroke="#12897C" strokeWidth={2.5} dot={{ r: 3 }} connectNulls />
                    <Line type="monotone" dataKey="avg_real_band" name="Avg mock band" stroke="#10b981" strokeWidth={2.5} dot={{ r: 3 }} connectNulls />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}
          </SectionCard>

          {/* Goal achievement */}
          <SectionCard title="Goal Achievement" icon={Target}>
            {!goals || goalTotal === 0 ? (
              <EmptyState title="No goal data yet" hint="Appears once students set target bands and complete assessments." />
            ) : (
              <>
                <div className="flex h-4 rounded-full overflow-hidden mb-3">
                  {goals.below > 0 && <div className="bg-rose-400" style={{ width: `${(goals.below / goalTotal) * 100}%` }} />}
                  {goals.near > 0 && <div className="bg-amber-400" style={{ width: `${(goals.near / goalTotal) * 100}%` }} />}
                  {goals.at_or_above > 0 && <div className="bg-emerald-400" style={{ width: `${(goals.at_or_above / goalTotal) * 100}%` }} />}
                  {goals.exam_ready > 0 && <div className="bg-brand-teal-500" style={{ width: `${(goals.exam_ready / goalTotal) * 100}%` }} />}
                </div>
                <div className="flex flex-wrap gap-x-4 sm:gap-x-5 gap-y-1.5 text-xs font-medium text-brand-text-mute">
                  <span><span className="inline-block w-2.5 h-2.5 rounded-full bg-rose-400 mr-1.5" />Below target: <strong>{goals.below}</strong></span>
                  <span><span className="inline-block w-2.5 h-2.5 rounded-full bg-amber-400 mr-1.5" />Near target: <strong>{goals.near}</strong></span>
                  <span><span className="inline-block w-2.5 h-2.5 rounded-full bg-emerald-400 mr-1.5" />At / above: <strong>{goals.at_or_above}</strong></span>
                  <span><span className="inline-block w-2.5 h-2.5 rounded-full bg-brand-teal-500 mr-1.5" />Exam ready: <strong>{goals.exam_ready}</strong></span>
                </div>
              </>
            )}
          </SectionCard>

          {/* Batch comparison */}
          <SectionCard title="Batch Comparison" icon={Layers}>
            {comparison.length === 0 ? (
              <EmptyState title="No batches to compare" hint="Create batches and enroll students to see comparisons." />
            ) : (
              <div className="overflow-x-auto -mx-4 px-4 sm:-mx-5 sm:px-5">
                <table className="w-full min-w-[640px] text-left">
                  <thead>
                    <tr className="font-jetbrains text-[10px] uppercase tracking-[0.12em] text-brand-text-mute border-b border-brand-line">
                      <th className="py-2 pr-4 font-bold whitespace-nowrap">Batch</th>
                      <th className="py-2 px-3 font-bold whitespace-nowrap">Students</th>
                      <th className="py-2 px-3 font-bold whitespace-nowrap">Avg Band</th>
                      <th className="py-2 px-3 font-bold whitespace-nowrap">Improvement</th>
                      <th className="py-2 px-3 font-bold whitespace-nowrap">IA Completion</th>
                      <th className="py-2 px-3 font-bold whitespace-nowrap">Engagement</th>
                      <th className="py-2 px-3 font-bold whitespace-nowrap">At Risk</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-brand-line">
                    {comparison.map((b) => (
                      <tr key={b.batch_id} className="hover:bg-brand-bg-alt/60 transition-colors">
                        <td className="py-3 pr-4 text-sm font-semibold text-brand-text whitespace-nowrap">{b.batch_name}</td>
                        <td className="py-3 px-3 text-sm text-brand-text-mute tabular-nums">{b.student_count}</td>
                        <td className="py-3 px-3"><BandPill band={b.avg_band} /></td>
                        <td className="py-3 px-3 text-sm font-bold tabular-nums">
                          {b.improvement_delta == null ? <span className="text-brand-text-mute">—</span> : (
                            <span className={b.improvement_delta >= 0 ? "text-emerald-600" : "text-rose-600"}>
                              {b.improvement_delta >= 0 ? "+" : ""}{b.improvement_delta.toFixed(1)}
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-3 text-sm text-brand-text-mute tabular-nums">{Math.round(b.ia_completion_rate * 100)}%</td>
                        <td className="py-3 px-3 text-sm text-brand-text-mute tabular-nums">{Math.round(b.engagement_rate * 100)}%</td>
                        <td className="py-3 px-3">
                          {b.at_risk_pct > 0.25
                            ? <StatusBadge tone="danger">{Math.round(b.at_risk_pct * 100)}%</StatusBadge>
                            : <StatusBadge tone={b.at_risk_pct > 0 ? "warning" : "success"}>{Math.round(b.at_risk_pct * 100)}%</StatusBadge>}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </SectionCard>

          {/* Sub-skill heatmap */}
          <SectionCard title="Sub-skill Mastery Heatmap" icon={Grid3X3}>
            {heatmap.length === 0 ? (
              <EmptyState title="No drill data yet" hint="The heatmap fills in as students complete drills across sub-skills." />
            ) : (
              <div className="space-y-4">
                {Object.entries(heatBySkill).map(([skill, rows]) => (
                  <div key={skill}>
                    <p className="font-jetbrains text-xs font-black uppercase tracking-wide text-brand-text-mute mb-2">{skill}</p>
                    <div className="flex flex-wrap gap-2">
                      {rows.map((r) => (
                        <div
                          key={`${r.skill}-${r.sub_skill}`}
                          className={`rounded-xl px-2.5 sm:px-3 py-2 text-[11px] sm:text-xs font-bold max-w-full break-words ${heatClass(r.avg_accuracy)}`}
                          title={`${r.drill_count} drills`}
                        >
                          {r.sub_skill.replace(/_/g, " ")} · {Math.round(r.avg_accuracy)}%
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
                <p className="text-[11px] text-brand-text-mute">Accuracy across all completed drills — hover a tile for volume.</p>
              </div>
            )}
          </SectionCard>
        </>
      )}
    </InstituteAdminLayout>
  );
}
