// src/features/Institute/dashboard/InstituteReports.tsx
// Reports — real analytics (replaces the mock struggle-groups page).
// All data comes from the analytics endpoints already mounted on
// /api/institute-admin/analytics/* (shared owner handlers):
// cohort progress, batch comparison, goal achievement, sub-skill heatmap,
// engagement trends, instructor effectiveness.
//
// The last two were authorised for this role but never called from any admin
// page, so the operational role — the one that acts on engagement and tutor
// performance day to day — could not see them. See DATA_AUDIT §6.
import { useCallback, useEffect, useState } from "react";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from "recharts";
import { TrendingUp, Layers, Target, Grid3X3, Activity, UserCheck } from "lucide-react";
import { InstituteAdminLayout } from "../components/InstituteAdminLayout";
import { SectionCard, StatusBadge, BandPill, TableSkeleton, EmptyState, ErrorBanner, PageHero } from "../components/shared/primitives";
import { callBackend } from "@/features/auth/services/authClient";
import { getBackendUrl } from "@/shared/utils";
import { InstructorEffectivenessTable, pctOf } from "@/shared/components/analytics/InstructorEffectivenessTable";
import type {
  CohortProgressData, BatchComparisonRow, GoalAchievementData, SubskillHeatmapRow,
  EngagementWeek, InstructorEffectivenessRow,
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

// pctOf moved to shared/components/analytics/InstructorEffectivenessTable so the
// admin and owner portals cannot disagree about how a `_rate` field renders.
// Its reasoning (these endpoints send 0..100, not fractions — confirmed against
// live data 21 Aug 2026) is documented at the definition.

/**
 * Shown when a panel's own endpoint failed. Deliberately distinct from
 * EmptyState: "no data yet" and "we could not fetch it" must not look alike.
 */
function FailedState() {
  return (
    <EmptyState
      title="Couldn't load this report"
      hint="The request failed. Use Retry above — other reports on this page may still be showing live data."
    />
  );
}

export default function InstituteReports() {
  const [cohort, setCohort] = useState<CohortProgressData | null>(null);
  const [comparison, setComparison] = useState<BatchComparisonRow[]>([]);
  const [goals, setGoals] = useState<GoalAchievementData | null>(null);
  const [heatmap, setHeatmap] = useState<SubskillHeatmapRow[]>([]);
  const [engagement, setEngagement] = useState<EngagementWeek[]>([]);
  const [instructors, setInstructors] = useState<InstructorEffectivenessRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Which panels failed to load, so each can say "couldn't load" instead of
  // borrowing the "no data yet" empty state. Those are different facts, and
  // showing the wrong one tells an admin their institute has no data when the
  // truth is the request failed.
  const [failed, setFailed] = useState<Set<string>>(new Set());

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);

    // allSettled, not all: these are six independent panels. Promise.all
    // rejects on the first failure and skips every setState, so one flaky
    // endpoint blanked the whole page — six empty panels under a single
    // "API error: 500", with no way to tell which one actually broke.
    const keys = [
      "cohort-progress",
      "batch-comparison",
      "goal-achievement",
      "subskill-heatmap",
      "engagement-trends",
      "instructor-effectiveness",
    ] as const;

    const results = await Promise.allSettled(
      keys.map((k) => callBackend(`${BASE()}/analytics/${k}`))
    );

    const nextFailed = new Set<string>();
    const dataFor = (i: number): any => {
      const r = results[i];
      if (r.status === "fulfilled") return r.value?.data ?? null;
      nextFailed.add(keys[i]);
      return null;
    };

    const [cohortD, compD, goalD, heatD, engD, instD] = keys.map((_, i) => dataFor(i));

    setCohort(cohortD ?? null);
    setComparison(compD ?? []);
    setGoals(goalD ?? null);
    setHeatmap(heatD ?? []);
    setEngagement(engD ?? []);
    setInstructors(instD ?? []);
    setFailed(nextFailed);

    if (nextFailed.size > 0) {
      const first = results.find((r) => r.status === "rejected") as
        | PromiseRejectedResult
        | undefined;
      const detail = first?.reason?.message ?? "request failed";
      setError(
        nextFailed.size === keys.length
          ? `Could not load reports — ${detail}`
          : `${nextFailed.size} of ${keys.length} reports failed to load — ${detail}`
      );
    }

    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const goalTotal = goals ? goals.below + goals.near + goals.at_or_above + goals.exam_ready : 0;

  const latestWeek = engagement.length > 0 ? engagement[engagement.length - 1] : null;
  const engagementChart = engagement.map((w) => ({
    name: w.week_start.slice(5),
    active: w.engagement_rate,
    dcs: w.avg_dcs ?? 0,
  }));

  // Group heatmap rows by skill for the grid
  const heatBySkill = heatmap.reduce<Record<string, SubskillHeatmapRow[]>>((acc, r) => {
    (acc[r.skill] = acc[r.skill] ?? []).push(r);
    return acc;
  }, {});

  return (
    <InstituteAdminLayout activeTab="reports">
      <PageHero
        eyebrow="Admin Portal"
        title="Reports"
        subtitle="Institute-wide performance, straight from live assessment and drill data."
      />

      {error && <ErrorBanner message={error} onRetry={load} />}

      {loading ? (
        <TableSkeleton rows={8} />
      ) : (
        <>
          {/* Cohort progress */}
          <SectionCard title="Cohort Band Progress" icon={TrendingUp}>
            {!cohort || cohort.monthly_points.length === 0 ? (
              failed.has("cohort-progress") ? <FailedState /> : <EmptyState title="Not enough data yet" hint="Band trends appear once students complete assessments across months." />
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
              failed.has("goal-achievement") ? <FailedState /> : <EmptyState title="No goal data yet" hint="Appears once students set target bands and complete assessments." />
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
              failed.has("batch-comparison") ? <FailedState /> : <EmptyState title="No batches to compare" hint="Create batches and enroll students to see comparisons." />
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
                        <td className="py-3 px-3 text-sm text-brand-text-mute tabular-nums">{pctOf(b.ia_completion_rate)}</td>
                        <td className="py-3 px-3 text-sm text-brand-text-mute tabular-nums">{pctOf(b.engagement_rate)}</td>
                        <td className="py-3 px-3">
                          {/* at_risk_pct arrives as a percent (0..100), not a fraction —
                              confirmed against live data, where the previous
                              `* 100` rendered 100% as "10000%". Threshold is
                              therefore 25, not 0.25. */}
                          {b.at_risk_pct > 25
                            ? <StatusBadge tone="danger">{pctOf(b.at_risk_pct)}</StatusBadge>
                            : <StatusBadge tone={b.at_risk_pct > 0 ? "warning" : "success"}>{pctOf(b.at_risk_pct)}</StatusBadge>}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </SectionCard>

          {/* Engagement trends — endpoint was authorised for admin but never called.
              Chart mirrors the Owner's EngagementPanel so both roles read the
              same shape; rendered through this page's primitives. */}
          <SectionCard title="Engagement Trends" icon={Activity}>
            {engagement.length === 0 ? (
              failed.has("engagement-trends") ? <FailedState /> : <EmptyState title="No engagement data yet" hint="Weekly activity appears once students start completing drills." />
            ) : (
              <>
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
                  {[
                    { label: "Active rate (latest week)", value: `${latestWeek?.engagement_rate ?? 0}%` },
                    { label: "Avg DCS (latest week)", value: latestWeek?.avg_dcs == null ? "—" : `${latestWeek.avg_dcs}%` },
                    { label: "Active students", value: latestWeek?.active_students ?? 0 },
                    { label: "Weeks tracked", value: engagement.length },
                  ].map((m) => (
                    <div key={m.label} className="rounded-2xl bg-white border border-brand-line p-4 shadow-sm">
                      <p className="font-jetbrains text-[10px] font-bold uppercase tracking-wider text-brand-text-mute mb-2">{m.label}</p>
                      <p className="text-2xl font-black tracking-tight tabular-nums text-brand-text">{m.value}</p>
                    </div>
                  ))}
                </div>
                <div className="h-56 sm:h-64 lg:h-72 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={engagementChart} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="currentColor" className="text-brand-line" />
                      <XAxis dataKey="name" tick={{ fontSize: 12 }} stroke="#94a3b8" />
                      <YAxis domain={[0, 100]} unit="%" tick={{ fontSize: 12 }} stroke="#94a3b8" />
                      <Tooltip contentStyle={{ borderRadius: 12, fontSize: 12 }} formatter={(v) => `${v}%`} />
                      <Legend wrapperStyle={{ fontSize: 12 }} />
                      <Line type="monotone" dataKey="active" name="Active %" stroke="#12897C" strokeWidth={2.5} dot={{ r: 3 }} connectNulls />
                      <Line type="monotone" dataKey="dcs" name="DCS %" stroke="#10b981" strokeWidth={2.5} dot={{ r: 3 }} connectNulls />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </>
            )}
          </SectionCard>

          {/* Instructor effectiveness — the table itself now lives in
              shared/components/analytics so the Owner's Performance page renders
              the identical view from the identical endpoint. Distinct from the
              instructors roster, which is headcount only. */}
          <SectionCard title="Instructor Effectiveness" icon={UserCheck}>
            {instructors.length === 0 ? (
              failed.has("instructor-effectiveness") ? <FailedState /> : <EmptyState title="No instructor data yet" hint="Appears once tutors are assigned batches and their students complete assessments." />
            ) : (
              <InstructorEffectivenessTable rows={instructors} />
            )}
          </SectionCard>

          {/* Sub-skill heatmap */}
          <SectionCard title="Sub-skill Mastery Heatmap" icon={Grid3X3}>
            {heatmap.length === 0 ? (
              failed.has("subskill-heatmap") ? <FailedState /> : <EmptyState title="No drill data yet" hint="The heatmap fills in as students complete drills across sub-skills." />
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
