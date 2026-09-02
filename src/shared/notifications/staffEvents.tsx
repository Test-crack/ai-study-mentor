// src/shared/notifications/staffEvents.tsx
//
// ONE definition of every staff-facing notification event, shared by the
// instructor, institute-admin and institute-owner bells.
//
// Before this, each portal carried its own copy: the instructor bell had an
// EVENT_DISPLAY map and the admin bell a `renderEvent` switch, so the same event
// could be worded differently depending on who read it. Adding an event type
// meant editing two places and usually forgetting one.
//
// Contract source: docs/BACKEND_REQUEST_dropout_risk_notifications.md (Request 5).
// The dropout event types below are NOT produced by the backend yet. That is
// safe: describeEvent returns null for anything it does not recognise and the
// bells skip null rows, so these entries sit inert until the producer ships and
// then light up with no further frontend work.

import type { JSX } from 'react';
import { UserX, TrendingDown, ShieldAlert, BarChart3 } from 'lucide-react';

// ─── Scopes ───────────────────────────────────────────────────────────────────

/** Which portal is rendering. Drives route targets and the allow-list below. */
export type StaffScope = 'instructor' | 'institute-admin' | 'institute-owner';

/**
 * Which event types each portal may render. Anything not listed is dropped.
 *
 * This exists to keep the OWNER's bell strictly a retention signal. The owner is
 * a governance role: they should hear about students at genuine risk of dropping
 * off — and nothing else. No single missed assessment, no diagnostic
 * completions, no per-student operational chatter. An owner bell that fills with
 * day-to-day events is one nobody reads, and it also undermines the escalation
 * ladder: if the owner sees everything the instructor sees, the middle tiers
 * stop owning their students.
 *
 * The ladder these sets encode:
 *   instructor       — first alert, plus their own per-miss events
 *   institute-admin  — escalations they must chase, plus existing ops events
 *   institute-owner  — escalations only, plus the weekly aggregate
 *
 * This is a SECOND line of defence, not the primary one. The backend producer is
 * still responsible for choosing recipients correctly (see
 * docs/BACKEND_REQUEST_dropout_risk_notifications.md Request 4). This guard means
 * a producer bug leaks nothing into the owner's bell.
 */
const SCOPE_EVENTS: Record<StaffScope, ReadonlySet<string>> = {
  'instructor':       new Set(['STUDENT_IA_MISSED', 'STUDENT_DROPOUT_RISK']),
  'institute-admin':  new Set(['STUDENT_IA_MISSED', 'STUDENT_DROPOUT_ESCALATED']),
  // Retention only. Remove INSTITUTE_RISK_DIGEST here if the owner's bell should
  // be strictly per-student — that one line is the whole switch.
  'institute-owner':  new Set(['STUDENT_DROPOUT_ESCALATED', 'INSTITUTE_RISK_DIGEST']),
};

/** Whether a portal is allowed to render a given event type. */
export function isEventVisibleTo(type: string, scope: StaffScope): boolean {
  return SCOPE_EVENTS[scope]?.has(type) ?? false;
}

// ─── Payload contracts ────────────────────────────────────────────────────────

export interface BatchRef {
  batch_id: string;
  batch_name: string;
  instructors: Array<{ user_id: string; name: string | null }>;
}

export type RiskTier = 'WATCH' | 'AT_RISK' | 'CRITICAL';

/**
 * STUDENT_DROPOUT_RISK (→ instructors) and STUDENT_DROPOUT_ESCALATED (→ admins).
 *
 * `batches` is a LIST because BatchStudent's unique key is (batch_id, user_id) —
 * a student can sit in more than one batch, so "their instructor" is not
 * singular. Every field is optional-tolerant at render time: a partially
 * populated payload degrades to a shorter line rather than printing "undefined".
 */
export interface DropoutRiskPayload {
  student_user_id?: string;
  student_name?: string;
  batches?: BatchRef[];
  tier?: RiskTier;
  reasons?: string[];
  days_inactive?: number;
  missed_ia_count?: number;
  daily_streak?: number;
  momentum_score?: number;
  current_band?: number | null;
  target_band?: number | null;
  exam_date?: string | null;   // "YYYY-MM-DD"
  /**
   * When the instructor was first alerted about this student.
   *
   * Only meaningful on STUDENT_DROPOUT_ESCALATED. Escalation fires because the
   * instructor's alert was still unread after the grace period, so this date is
   * the answer to the admin's and owner's first question: "how long has this
   * been sitting with the tutor?"
   *
   * Accepts a date ("YYYY-MM-DD") or a full ISO timestamp.
   */
  instructor_notified_at?: string | null;
}

/** INSTITUTE_RISK_DIGEST (→ institute owner). Weekly aggregate, never per-student. */
export interface RiskDigestPayload {
  period_start?: string;       // "YYYY-MM-DD"
  period_end?: string;         // "YYYY-MM-DD"
  flagged_total?: number;
  by_tier?: { watch?: number; at_risk?: number; critical?: number };
  recovered_count?: number;
  top_concentrations?: Array<{
    batch_id: string;
    batch_name: string;
    instructor_names?: string[];
    flagged_count: number;
  }>;
}

// ─── Rendered view ────────────────────────────────────────────────────────────

export interface EventView {
  icon:   JSX.Element;
  iconBg: string;
  title:  string;
  /** The "Batch B · Tutor: Sarah Khan" line. Omitted when unknown. */
  meta?:  string;
  body:   string;
  route:  string | null;
  /**
   * Router state to pass alongside `route`.
   *
   * The institute-admin and institute-owner progress pages resolve the student
   * from `location.state.studentId` and ignore the URL slug, so a path-only
   * navigate lands on their "Session expired or direct URL access" message.
   * This is why the existing admin bell routed to the students LIST instead of
   * deep-linking. Passing state fixes that.
   */
  state?: Record<string, unknown>;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const fmtDay = (iso: string) =>
  new Date(`${iso}T12:00:00`).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });

/**
 * Same output as fmtDay but tolerant of either a date ("2026-08-19") or a full
 * ISO timestamp ("2026-08-19T04:30:00.000Z") — notification timestamps arrive in
 * both shapes depending on whether the column is DATE or TIMESTAMPTZ. Returns
 * null on anything unparseable so callers omit the clause rather than printing
 * "Invalid Date".
 */
function fmtDayLoose(value: string): string | null {
  const d = new Date(/^\d{4}-\d{2}-\d{2}$/.test(value) ? `${value}T12:00:00` : value);
  return isNaN(d.getTime())
    ? null
    : d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
}

/** Whole calendar days from today until an exam date. Negative once it has passed. */
function daysUntil(iso: string): number | null {
  const target = new Date(`${iso}T00:00:00`);
  if (isNaN(target.getTime())) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return Math.round((target.getTime() - today.getTime()) / 86400000);
}

/** "Batch B · Tutor: Sarah Khan" — or across several batches, "· 2 batches". */
function batchMeta(batches?: BatchRef[]): string | undefined {
  if (!batches || batches.length === 0) return undefined;

  const [first] = batches;
  const tutors = (first.instructors ?? [])
    .map(i => i.name)
    .filter((n): n is string => !!n);

  const tutorPart =
    tutors.length === 0 ? null
    : tutors.length === 1 ? `Tutor: ${tutors[0]}`
    : `Tutors: ${tutors.join(', ')}`;

  // More than one batch is stated rather than hidden — picking the first
  // silently is what the owner controller already does, and it misleads.
  const extra = batches.length > 1 ? `+${batches.length - 1} more batch${batches.length > 2 ? 'es' : ''}` : null;

  return [first.batch_name, tutorPart, extra].filter(Boolean).join(' · ');
}

/**
 * Route to a student's progress page in whichever portal is asking.
 * Returns null when the payload lacks what that portal's route needs, which
 * makes the row non-clickable rather than sending someone to a broken page.
 */
function studentRoute(scope: StaffScope, p: DropoutRiskPayload): Pick<EventView, 'route' | 'state'> {
  const id = p.student_user_id;
  if (!id) return { route: null };

  if (scope === 'instructor') {
    // The instructor route is batch-scoped, so it needs a batch to key off.
    const batchId = p.batches?.[0]?.batch_id;
    return batchId
      ? { route: `/instructor/batches/${batchId}/students/${id}/progress`, state: { studentId: id } }
      : { route: null };
  }

  const base = scope === 'institute-owner' ? '/institute-owner' : '/institute-admin';
  return { route: `${base}/students/${id}/progress`, state: { studentId: id } };
}

const TIER_STYLE: Record<RiskTier, { iconBg: string; label: string }> = {
  WATCH:    { iconBg: 'bg-amber-50',  label: 'Watch' },
  AT_RISK:  { iconBg: 'bg-orange-50', label: 'At risk' },
  CRITICAL: { iconBg: 'bg-rose-50',   label: 'Critical' },
};

/** Facts worth stating even when the backend sends no `reasons` array. */
function fallbackReasons(p: DropoutRiskPayload): string[] {
  const out: string[] = [];
  if (typeof p.days_inactive === 'number' && p.days_inactive > 0) {
    out.push(`inactive ${p.days_inactive} day${p.days_inactive === 1 ? '' : 's'}`);
  }
  if (typeof p.missed_ia_count === 'number' && p.missed_ia_count > 0) {
    out.push(`${p.missed_ia_count} assessment${p.missed_ia_count === 1 ? '' : 's'} missed`);
  }
  if (p.daily_streak === 0) out.push('streak broken');
  return out;
}

/** "Band 6.0 · target 7.5 · exam in 41 days" */
function bandLine(p: DropoutRiskPayload): string | null {
  const parts: string[] = [];
  if (p.current_band != null) parts.push(`Band ${p.current_band.toFixed(1)}`);
  if (p.target_band != null)  parts.push(`target ${p.target_band.toFixed(1)}`);
  if (p.exam_date) {
    const d = daysUntil(p.exam_date);
    if (d != null) {
      parts.push(d < 0 ? 'exam has passed' : d === 0 ? 'exam today' : `exam in ${d} day${d === 1 ? '' : 's'}`);
    }
  }
  return parts.length > 0 ? parts.join(' · ') : null;
}

// ─── The registry ─────────────────────────────────────────────────────────────

/**
 * Describes one persisted notification for display, or null if this portal has
 * nothing to show for that type. Callers MUST treat null as "skip this row" —
 * that is what keeps unshipped and future event types from rendering broken.
 */
export function describeEvent(
  type: string,
  payload: Record<string, any> | null | undefined,
  scope: StaffScope
): EventView | null {
  const p = payload ?? {};

  // Portal boundary first — an event this role should never see is dropped
  // before any rendering, whatever the producer sent.
  if (!isEventVisibleTo(type, scope)) return null;

  switch (type) {
    // ── Live today ───────────────────────────────────────────────────────────
    case 'STUDENT_IA_MISSED': {
      const name = p.student_name ?? 'A student';
      const when = p.ia_date ? fmtDay(p.ia_date) : 'recently';
      const nav  = studentRoute(scope, {
        student_user_id: p.student_user_id,
        // This event carries a flat batch_id rather than a batches[] list.
        batches: p.batch_id ? [{ batch_id: p.batch_id, batch_name: '', instructors: [] }] : undefined,
      });
      return {
        icon:   <UserX className="w-4 h-4 text-rose-600" />,
        iconBg: 'bg-rose-50',
        title:  `${name} missed an assessment`,
        body:   `IA #${p.ia_number ?? '?'} scheduled for ${when} slipped by — their momentum dipped by ${p.momentum_deducted ?? 20} pts. A quick check-in could help.`,
        ...nav,
      };
    }

    // ── Awaiting the backend producer (Request 4) ─────────────────────────────
    case 'STUDENT_DROPOUT_RISK':
    case 'STUDENT_DROPOUT_ESCALATED': {
      const d        = p as DropoutRiskPayload;
      const name     = d.student_name ?? 'A student';
      const tier     = d.tier && TIER_STYLE[d.tier] ? d.tier : 'AT_RISK';
      const style    = TIER_STYLE[tier];
      const escalated = type === 'STUDENT_DROPOUT_ESCALATED';

      const reasons = (d.reasons && d.reasons.length > 0 ? d.reasons : fallbackReasons(d)).slice(0, 3);
      const band    = bandLine(d);

      // Escalation exists BECAUSE the tutor's alert went unread past the grace
      // period, so stating when they were told is the point of the row — it is
      // the first thing an admin or owner needs in order to chase it.
      const notified = escalated && d.instructor_notified_at
        ? fmtDayLoose(d.instructor_notified_at)
        : null;
      const notifiedLine = notified ? `Tutor notified ${notified}, unopened since.` : null;

      return {
        icon:   escalated
          ? <ShieldAlert  className="w-4 h-4 text-rose-600" />
          : <TrendingDown className="w-4 h-4 text-orange-600" />,
        iconBg: escalated ? 'bg-rose-50' : style.iconBg,
        title:  escalated
          ? `${name} still needs attention`
          : `${name} is at risk of dropping off`,
        meta:   batchMeta(d.batches),
        body:   [
          escalated ? `${style.label} — not resolved yet.` : `${style.label}.`,
          reasons.length > 0 ? reasons.join(' · ') : null,
          band,
          notifiedLine,
        ].filter(Boolean).join(' '),
        ...studentRoute(scope, d),
      };
    }

    case 'INSTITUTE_RISK_DIGEST': {
      const d = p as RiskDigestPayload;
      const period = d.period_start && d.period_end
        ? `${fmtDay(d.period_start)} – ${fmtDay(d.period_end)}`
        : 'this week';

      const tiers = d.by_tier ?? {};
      const tierLine = [
        tiers.critical ? `${tiers.critical} critical` : null,
        tiers.at_risk  ? `${tiers.at_risk} at risk`   : null,
        tiers.watch    ? `${tiers.watch} watch`       : null,
      ].filter(Boolean).join(' · ');

      const top = d.top_concentrations?.[0];
      const concentration = top
        ? `Most concentrated in ${top.batch_name}${
            top.instructor_names?.length ? ` (${top.instructor_names.join(', ')})` : ''
          } — ${top.flagged_count}.`
        : null;

      // Recovery is stated whenever the backend sends it, including zero — "0
      // recovered" is a real and useful answer, not a missing value.
      const recovered = typeof d.recovered_count === 'number'
        ? `${d.recovered_count} recovered after contact.`
        : null;

      return {
        icon:   <BarChart3 className="w-4 h-4 text-brand-teal-600" />,
        iconBg: 'bg-brand-teal-50',
        title:  `${d.flagged_total ?? 0} student${d.flagged_total === 1 ? '' : 's'} flagged — ${period}`,
        body:   [tierLine || null, concentration, recovered].filter(Boolean).join(' '),
        // Aggregate event: no single student to open, so it lands on the list.
        route:  scope === 'institute-owner' ? '/institute-owner/students' : '/institute-admin/students',
      };
    }

    default:
      // Unknown or not-relevant-to-this-scope: skipped, never rendered broken.
      return null;
  }
}
