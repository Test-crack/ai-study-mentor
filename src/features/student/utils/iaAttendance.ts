// src/features/student/utils/iaAttendance.ts
//
// Attendance derivations over /api/student/ia-history.
//
// These were previously implemented only inside AssessmentHistoryPage
// (getAttendance + the miss-streak loop in getRecordInsight). The student
// dashboard needed the same facts to replace its hard-coded
// `missedData = { misses: 0, subSkills: [] }`, so the logic lives here once
// rather than being copied.

export interface IAHistoryEntry {
  id: string;
  ia_number: number;
  ia_date: string;
  status: "COMPLETED" | "MISSED";
  time_submitted_at: string | null;
  momentum_awarded: number | null;
  carry_forward_subskills: { skill: string; sub_skill: string }[];
  /** Per-section bands for the sitting. Present on scored IAs. */
  scores?: { band: number; skill: string; sub_skill?: string }[];
}

const byDateDesc = (a: IAHistoryEntry, b: IAHistoryEntry) =>
  new Date(b.ia_date).getTime() - new Date(a.ia_date).getTime();

/**
 * Consecutive misses ending at the most recent assessment.
 *
 * This — not the lifetime total — is what gates the catch-up UI. A lifetime
 * count only ever grows, so a student who missed two assessments a year ago
 * could never leave the catch-up state. A streak clears as soon as they sit one.
 */
export function getMissStreak(history: IAHistoryEntry[]): number {
  let streak = 0;
  for (const e of history.slice().sort(byDateDesc)) {
    if (e.status === "MISSED") streak++;
    else break;
  }
  return streak;
}

/** Lifetime missed count. Display only — never gate recoverable UI on this. */
export function getMissedCount(history: IAHistoryEntry[]): number {
  return history.filter((e) => e.status === "MISSED").length;
}

export function getAttendancePct(history: IAHistoryEntry[]): number {
  if (history.length === 0) return 0;
  const taken = history.filter((e) => e.status === "COMPLETED").length;
  return Math.round((taken / history.length) * 100);
}

/**
 * Sub-skills deferred by the current run of missed assessments, most recent
 * first, de-duplicated. These are what the catch-up banner points a student at.
 *
 * Scoped to the miss streak on purpose: the actionable set is "what you just
 * deferred", not every sub-skill ever carried forward.
 */
export function getCarryForwardSubSkills(history: IAHistoryEntry[]): string[] {
  const out: string[] = [];
  for (const e of history.slice().sort(byDateDesc)) {
    if (e.status !== "MISSED") break;
    for (const s of e.carry_forward_subskills ?? []) {
      if (s?.sub_skill && !out.includes(s.sub_skill)) out.push(s.sub_skill);
    }
  }
  return out;
}

/**
 * Observed band improvement per week from dated, scored points.
 * Returns null when there is not enough signal to claim a slope.
 */
export function observedPacePerWeek(
  points: { date: string; band: number }[]
): number | null {
  const valid = points
    .filter((p) => p.band != null && !isNaN(new Date(p.date).getTime()))
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  if (valid.length < 2) return null;
  const first = valid[0];
  const last = valid[valid.length - 1];
  const weeks =
    (new Date(last.date).getTime() - new Date(first.date).getTime()) / 604800000;
  if (weeks < 1) return null;
  return (last.band - first.band) / weeks;
}

/**
 * Dates of the current run of missed assessments, oldest first, formatted for
 * display ("12 Aug").
 *
 * The catch-up banner summarises what the per-IA notices used to say one at a
 * time, so it has to carry the actual dates — a summary that only says "a couple
 * of sessions" is less informative than the notices it replaces.
 */
export function getMissStreakDates(history: IAHistoryEntry[]): string[] {
  const dates: string[] = [];
  for (const e of history.slice().sort(byDateDesc)) {
    if (e.status !== "MISSED") break;
    dates.push(e.ia_date);
  }
  return dates
    .reverse()
    .map((d) => {
      const dt = new Date(`${d}T12:00:00`);
      return isNaN(dt.getTime())
        ? null
        : dt.toLocaleDateString("en-IN", { day: "numeric", month: "short" });
    })
    .filter((d): d is string => d !== null);
}

/** "12, 15 and 18 Aug" — an Oxford-comma-free list for inline prose. */
export function formatDateList(dates: string[]): string {
  if (dates.length === 0) return "";
  if (dates.length === 1) return dates[0];
  return `${dates.slice(0, -1).join(", ")} and ${dates[dates.length - 1]}`;
}
