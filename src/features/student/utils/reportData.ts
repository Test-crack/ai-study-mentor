// src/features/student/utils/reportData.ts
//
// Assembles the student Reports page from real feeds. Every panel there ran on
// four hardcoded arrays (BAND_ARC_DATA, RADAR_DATA, READINESS_DATA,
// PERFORMANCE_TABLE) with a shipped subtitle reading "all mock data until
// Wednesday integration". Sources, all student-authorised and already used
// elsewhere in the app:
//
//   competency-scores → current band + target per skill
//   ia-history        → dated per-skill section bands, session counts
//   mock-history      → dated per-skill bands and the overall real_band_score
//
// Deliberate constraint: sub-skill bands are averaged WITHIN a skill to get that
// skill's band for a sitting, never ACROSS skills. Averaging across skills
// produces a number that is not a band — the confusion DATA_AUDIT §11 recorded,
// where a Speaking-only IA scoring 0.5 was displayed as the student's band.

export const REPORT_SKILLS = ['Listening', 'Reading', 'Writing', 'Speaking'] as const;
export type ReportSkill = (typeof REPORT_SKILLS)[number];

export interface ScoreEntry {
  band: number;
  skill: string;
}

export interface DatedSitting {
  date: string;
  scores: ScoreEntry[];
}

const canonicalSkill = (raw: string): ReportSkill | null => {
  const k = raw.trim().toLowerCase();
  const hit = REPORT_SKILLS.find((s) => s.toLowerCase() === k);
  return hit ?? null;
};

const round1 = (v: number) => Math.round(v * 10) / 10;

/**
 * Per-skill band for one sitting: the mean of that skill's section bands.
 * Bands of 0 are treated as unscored rather than as a zero band — an unattempted
 * section would otherwise drag the skill average toward zero.
 */
export function skillBandsForSitting(scores: ScoreEntry[]): Partial<Record<ReportSkill, number>> {
  const buckets = new Map<ReportSkill, number[]>();
  for (const s of scores ?? []) {
    const skill = canonicalSkill(s?.skill ?? '');
    const band = Number(s?.band);
    if (!skill || isNaN(band) || band <= 0) continue;
    const arr = buckets.get(skill) ?? [];
    arr.push(band);
    buckets.set(skill, arr);
  }
  const out: Partial<Record<ReportSkill, number>> = {};
  for (const [skill, arr] of buckets) {
    out[skill] = round1(arr.reduce((a, b) => a + b, 0) / arr.length);
  }
  return out;
}

export interface BandArcPoint {
  date: string;
  iso: string;
  Listening: number | null;
  Reading: number | null;
  Writing: number | null;
  Speaking: number | null;
}

const fmtShort = (iso: string) => {
  const d = new Date(iso);
  return isNaN(d.getTime())
    ? iso
    : d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
};

/**
 * Band progression over time, one point per scored sitting, oldest first.
 *
 * A skill missing from a sitting is `null`, not carried forward: a flat line
 * through a session the student did not sit would imply a measurement that
 * never happened. Recharts `connectNulls` joins the gap visually without
 * inventing a data point.
 */
export function buildBandArc(sittings: DatedSitting[]): BandArcPoint[] {
  return sittings
    .filter((s) => !isNaN(new Date(s.date).getTime()))
    .map((s) => ({ ...s, bands: skillBandsForSitting(s.scores) }))
    .filter((s) => Object.keys(s.bands).length > 0)
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .map((s) => ({
      date: fmtShort(s.date),
      iso: s.date,
      Listening: s.bands.Listening ?? null,
      Reading: s.bands.Reading ?? null,
      Writing: s.bands.Writing ?? null,
      Speaking: s.bands.Speaking ?? null,
    }));
}

export interface RadarRow {
  skill: ReportSkill;
  current: number;
  target: number;
}

/** Current band vs target per skill. Skills with no score are omitted. */
export function buildRadar(
  competency: { skill: string; band_score: number | string | null }[],
  targetBand: number
): RadarRow[] {
  const rows: RadarRow[] = [];
  for (const skill of REPORT_SKILLS) {
    const row = competency.find((c) => canonicalSkill(c.skill) === skill);
    const band = row == null ? NaN : Number(row.band_score);
    if (isNaN(band) || band <= 0) continue;
    rows.push({ skill, current: round1(band), target: targetBand });
  }
  return rows;
}

export type PerfStatus = 'On Track' | 'At Risk' | 'Critical' | 'Not scored';

export interface PerfRow {
  skill: ReportSkill;
  current: number | null;
  target: number;
  gap: number | null;
  sessions: number;
  delta: number | null;
  status: PerfStatus;
}

/**
 * Status from the remaining gap to target. Thresholds mirror the dashboard's
 * readiness bands so the two surfaces cannot disagree about the same student.
 */
function statusFor(gap: number | null): PerfStatus {
  if (gap === null) return 'Not scored';
  if (gap <= 0) return 'On Track';
  if (gap <= 1.0) return 'On Track';
  if (gap <= 2.0) return 'At Risk';
  return 'Critical';
}

/**
 * Per-skill snapshot. `delta` is the change between the two most recent scored
 * sittings for that skill, and is null with fewer than two — the mock version
 * showed a uniform "+0.5" for every row regardless of history.
 */
export function buildPerformanceTable(
  competency: { skill: string; band_score: number | string | null }[],
  targetBand: number,
  sittings: DatedSitting[]
): PerfRow[] {
  const ordered = sittings
    .filter((s) => !isNaN(new Date(s.date).getTime()))
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .map((s) => skillBandsForSitting(s.scores));

  return REPORT_SKILLS.map((skill) => {
    const series = ordered
      .map((b) => b[skill])
      .filter((v): v is number => v != null);

    const row = competency.find((c) => canonicalSkill(c.skill) === skill);
    const raw = row == null ? NaN : Number(row.band_score);
    const current = isNaN(raw) || raw <= 0 ? null : round1(raw);
    const gap = current === null ? null : round1(targetBand - current);
    const delta =
      series.length >= 2
        ? round1(series[series.length - 1] - series[series.length - 2])
        : null;

    return {
      skill,
      current,
      target: targetBand,
      gap,
      sessions: series.length,
      delta,
      status: statusFor(gap),
    };
  });
}

export interface TrajectoryPoint {
  date: string;
  iso: string;
  projected: number;
  target: number;
}

/**
 * Projected band from today to the exam date, sampled evenly.
 *
 * Takes the already-resolved pace so this shares one projection model with the
 * dashboard — two surfaces disagreeing about the same student's projected band
 * is the failure DATA_AUDIT §11 documented for current band.
 */
export function buildTrajectory(
  current: number,
  targetBand: number,
  examDateIso: string | null,
  pacePerWeek: number,
  todayIso: string,
  points = 7
): TrajectoryPoint[] {
  if (!examDateIso) return [];
  const start = new Date(todayIso).getTime();
  const end = new Date(examDateIso).getTime();
  if (isNaN(start) || isNaN(end) || end <= start) return [];

  const out: TrajectoryPoint[] = [];
  for (let i = 0; i < points; i++) {
    const t = start + ((end - start) * i) / (points - 1);
    const weeks = (t - start) / 604800000;
    // Same floors as the dashboard: never below current, never above 9.
    const projected = Math.min(9, Math.max(current, current + pacePerWeek * weeks));
    const iso = new Date(t).toISOString();
    out.push({ date: fmtShort(iso), iso, projected: round1(projected), target: targetBand });
  }
  return out;
}
