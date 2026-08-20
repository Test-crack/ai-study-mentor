/**
 * Exam ids — mirror the backend `Exam` registry table (source of truth).
 * These string ids match `exams.id` and the `exam_id` columns (decision D2:
 * the old `ExamType` enum was replaced by a string id).
 *
 * INTERIM: hardcoded here to mirror the registry. Phase 5 · B1 will source this
 * list (and labels) from `GET /api/exams` so the frontend can't drift from the
 * backend config. Until then, keep this in sync with the seed in the migration.
 *
 * This is the ONE place the frontend defines exam identity. Do not hand-type
 * exam strings elsewhere (e.g. the old ad-hoc list in Questionbankmanager.tsx).
 */

export const EXAM_TYPES = ['ielts', 'spoken_english', 'oet', 'gre', 'gmat'] as const;

export type ExamType = (typeof EXAM_TYPES)[number];

/** Human-facing labels, keyed by exam id. */
export const EXAM_LABELS: Record<ExamType, string> = {
  ielts: 'IELTS',
  spoken_english: 'Spoken English',
  oet: 'Healthcare English',
  gre: 'GRE',
  gmat: 'GMAT',
};

/**
 * Which exams are offerable today. IELTS + Spoken English are live; the rest are
 * in the registry but not content-ready, so the UI shows them as "coming soon"
 * rather than offering them for selection.
 */
export const EXAM_AVAILABILITY: Record<ExamType, 'live' | 'soon'> = {
  ielts: 'live',
  spoken_english: 'live',
  oet: 'soon',
  gre: 'soon',
  gmat: 'soon',
};

export type BillingStatus = 'TRIAL' | 'ACTIVE' | 'CANCELLED';

export const BILLING_STATUSES: readonly BillingStatus[] = ['TRIAL', 'ACTIVE', 'CANCELLED'] as const;
