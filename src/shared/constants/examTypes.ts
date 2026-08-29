/**
 * Exam types — mirrors the Prisma `ExamType` enum (backend source of truth).
 * Keep this list in sync with prisma/schema.prisma `enum ExamType`.
 *
 * This is the ONE place the frontend defines exam identity. Do not hand-type
 * exam strings elsewhere. (The conflicting ad-hoc union in Questionbankmanager.tsx
 * is gone — that file was unrouted dead code and was deleted on 21 Aug 2026.)
 */

export const EXAM_TYPES = ['IELTS', 'SPOKEN', 'OET', 'GRE', 'TOEFL', 'PTE'] as const;

export type ExamType = (typeof EXAM_TYPES)[number];

/** Human-facing labels. */
export const EXAM_LABELS: Record<ExamType, string> = {
  IELTS: 'IELTS',
  SPOKEN: 'Spoken English',
  OET: 'OET',
  GRE: 'GRE',
  TOEFL: 'TOEFL',
  PTE: 'PTE',
};

/**
 * Which exams are actually deliverable today. IELTS is live; Spoken English is
 * next. The rest are reserved in the enum but not yet content-ready, so the UI
 * can show them as "coming soon" rather than offering them for selection.
 */
export const EXAM_AVAILABILITY: Record<ExamType, 'live' | 'soon'> = {
  IELTS: 'live',
  SPOKEN: 'live',
  OET: 'soon',
  GRE: 'soon',
  TOEFL: 'soon',
  PTE: 'soon',
};

export type BillingStatus = 'TRIAL' | 'ACTIVE' | 'CANCELLED';

export const BILLING_STATUSES: readonly BillingStatus[] = ['TRIAL', 'ACTIVE', 'CANCELLED'] as const;
