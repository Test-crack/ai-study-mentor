// src/shared/components/analytics/InstructorEffectivenessTable.tsx
//
// Instructor effectiveness, rendered identically for every role authorised to
// see it. GET /api/institute-{owner,admin}/analytics/instructor-effectiveness is
// the SAME shared handler for both, so the table lived in the admin's Reports
// page as a one-off while the Owner — the role that actually governs tutor
// performance — had no UI for it at all (its only "tutor effectiveness" page,
// TutorEffective.tsx, was hardcoded mock data and was never routed).
//
// Deliberately chrome-less: callers wrap it in their own card/section component
// so this stays usable from both portals without either importing the other's
// primitives.

import type { InstructorEffectivenessRow } from '@/features/InstituteOwner/services/instituteOwnerService';

/**
 * Renders a rate as a whole percent, tolerating both conventions this codebase
 * uses for `_rate` fields.
 *
 * CONFIRMED against live data (21 Aug 2026): these endpoints send PERCENTS
 * (0..100). The `<= 1` branch exists only so a genuine 0.87 would still read
 * 87% if an endpoint is later corrected to send fractions — it is not a
 * substitute for the field names being honest.
 */
export function pctOf(rate: number | null | undefined): string {
  if (rate == null) return '—';
  const pct = Math.abs(rate) <= 1 ? rate * 100 : rate;
  return `${Math.round(pct)}%`;
}

function RiskBadge({ atRisk, studentCount }: { atRisk: number; studentCount: number }) {
  if (atRisk === 0) {
    return (
      <span className="inline-flex items-center rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-xs font-bold text-emerald-700">
        0
      </span>
    );
  }
  const severe = atRisk / Math.max(studentCount, 1) > 0.25;
  return (
    <span
      className={
        severe
          ? 'inline-flex items-center rounded-full border border-rose-200 bg-rose-50 px-2 py-0.5 text-xs font-bold text-rose-700'
          : 'inline-flex items-center rounded-full border border-amber-200 bg-amber-50 px-2 py-0.5 text-xs font-bold text-amber-700'
      }
    >
      {atRisk}
    </span>
  );
}

function ImprovementCell({ value, suffix = '' }: { value: number | null; suffix?: string }) {
  // null means "not enough data to compute a slope", which is a different fact
  // from "no improvement". Never render 0.0.
  if (value == null) return <span className="text-brand-text-mute">—</span>;
  return (
    <span className={value >= 0 ? 'text-emerald-600' : 'text-rose-600'}>
      {value >= 0 ? '+' : ''}{value.toFixed(1)}{suffix}
    </span>
  );
}

export function InstructorEffectivenessTable({ rows }: { rows: InstructorEffectivenessRow[] }) {
  // Spoken English uses a CEFR (0-6) scale, not an IELTS band (0-9) — the two are
  // never averaged together server-side, so this table shows them as separate
  // columns rather than one blended "Avg Improvement" number. The CEFR column is
  // only shown when at least one row actually has SE students, so an
  // IELTS-only institute sees exactly the table it saw before this field existed.
  const hasAnySE = rows.some(r => r.avg_cefr_improvement != null);

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left border-collapse min-w-[720px]">
        <thead>
          <tr className="text-[11px] uppercase tracking-wide text-brand-text-mute border-b border-brand-line">
            <th className="py-2 pr-4 font-bold whitespace-nowrap">Instructor</th>
            <th className="py-2 px-3 font-bold whitespace-nowrap">Batches</th>
            <th className="py-2 px-3 font-bold whitespace-nowrap">Students</th>
            <th className="py-2 px-3 font-bold whitespace-nowrap">Avg Improvement</th>
            {hasAnySE && <th className="py-2 px-3 font-bold whitespace-nowrap">Avg CEFR Δ</th>}
            <th className="py-2 px-3 font-bold whitespace-nowrap">IA Completion</th>
            <th className="py-2 px-3 font-bold whitespace-nowrap">At Target</th>
            <th className="py-2 px-3 font-bold whitespace-nowrap">Avg Streak</th>
            <th className="py-2 px-3 font-bold whitespace-nowrap">At Risk</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-brand-line">
          {rows.map((r) => (
            <tr key={r.user_id} className="hover:bg-brand-bg-alt/60 transition-colors">
              <td className="py-3 pr-4 text-sm font-semibold text-brand-text whitespace-nowrap">{r.name}</td>
              <td className="py-3 px-3 text-sm text-brand-text-mute tabular-nums">{r.batch_count}</td>
              <td className="py-3 px-3 text-sm text-brand-text-mute tabular-nums">{r.student_count}</td>
              <td className="py-3 px-3 text-sm font-bold tabular-nums">
                <ImprovementCell value={r.avg_band_improvement} />
              </td>
              {hasAnySE && (
                <td className="py-3 px-3 text-sm font-bold tabular-nums">
                  <ImprovementCell value={r.avg_cefr_improvement} />
                </td>
              )}
              <td className="py-3 px-3 text-sm text-brand-text-mute tabular-nums">{pctOf(r.ia_completion_rate)}</td>
              <td className="py-3 px-3 text-sm text-brand-text-mute tabular-nums">
                {r.students_at_target}
                {r.student_count > 0 && <span className="text-brand-text-mute/70"> / {r.student_count}</span>}
              </td>
              <td className="py-3 px-3 text-sm text-brand-text-mute tabular-nums">{r.avg_student_streak}</td>
              <td className="py-3 px-3">
                <RiskBadge atRisk={r.at_risk_count} studentCount={r.student_count} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <p className="text-[11px] text-brand-text-mute mt-3">
        Improvement is average band change across each instructor's students
        {hasAnySE ? ' (IELTS students; Spoken English students are shown separately as CEFR level change)' : ''}.
        "—" means too little data to compute, not zero progress. Assignment is not attribution — treat these as
        prompts to look, not rankings.
      </p>
    </div>
  );
}
