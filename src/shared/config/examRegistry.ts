// src/shared/config/examRegistry.ts
//
// The exam registry — the frontend mirror of TC-04 §3's EXAM_REGISTRY.
//
// Adding an exam to the UI should be *this file plus a formatter*, nothing else.
// If registering an exam requires edits anywhere in shared/components, the
// abstraction leaked (TC-07 "one number to watch").
//
// Refs: TC-04 §3, §4.5 · TC-03 D1, §1.1, §5.1, §7

import type {
  ExamType,
  ExamUiConfig,
  FormattedScore,
  SubScores,
} from '@/shared/types/exam';

// ─── Helpers ──────────────────────────────────────────────────────────────────

const EMPTY = '—';

function subString(sub: SubScores, key: string): string | null {
  const v = sub?.[key];
  return typeof v === 'string' && v.length > 0 ? v : null;
}

// ─── IELTS · mean rounded to 0.5 (TC-04 §3) ───────────────────────────────────

/** Round to the nearest 0.5, the IELTS banding rule. */
function toBand(raw: number): number {
  return Math.round(raw * 2) / 2;
}

/**
 * Overall IELTS band: mean rounded to 0.5 (TC-04 §3).
 */
function formatIeltsOverall(raw: number | null | undefined): FormattedScore {
  if (raw === null || raw === undefined || Number.isNaN(raw)) {
    return { display: EMPTY, label: 'Band' };
  }
  return { display: toBand(raw).toFixed(1), label: 'Band' };
}

/**
 * A single IELTS skill score: one decimal place, NOT rounded to 0.5.
 *
 * Deliberately different from `formatIeltsOverall`. Only the *overall* band is
 * banded to 0.5 — a sub-skill mean of 6.25 is shown as "6.3", which is what
 * every existing surface already renders via `.toFixed(1)`. Banding sub-skills
 * would round 6.25 up to "6.5" and silently inflate displayed skill scores.
 */
function formatIeltsSkill(raw: number | null | undefined): FormattedScore {
  if (raw === null || raw === undefined || Number.isNaN(raw)) {
    return { display: EMPTY, label: 'Band' };
  }
  return { display: raw.toFixed(1), label: 'Band' };
}

// ─── SPOKEN · CEFR banded threshold (TC-03 D1) ────────────────────────────────
//
// Genuinely different from IELTS banding, and deliberately so: TC-03 §1.1 —
// reusing IELTS banding for exam 2 "proves nothing". This is the formatter that
// tests whether the abstraction holds.

export const CEFR_LEVELS = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'] as const;
export type CefrLevel = (typeof CEFR_LEVELS)[number];

const CEFR_DESCRIPTIONS: Record<CefrLevel, string> = {
  A1: 'Beginner',
  A2: 'Elementary',
  B1: 'Intermediate',
  B2: 'Upper Intermediate',
  C1: 'Advanced',
  C2: 'Proficient',
};

/**
 * Threshold table over the generic 0–9 numeric score.
 *
 * ⚠️ PROVISIONAL. Backend contract ask #3 (exact `sub_scores` CEFR shape) is
 * open as of 18 Aug. When the backend returns an explicit `cefr_level` string
 * we prefer it and this table becomes a fallback only — which is already how
 * `cefrFromScore` is wired below, so answering the ask needs no code change here.
 */
const CEFR_THRESHOLDS: ReadonlyArray<{ min: number; level: CefrLevel }> = [
  { min: 8.0, level: 'C2' },
  { min: 7.0, level: 'C1' },
  { min: 5.5, level: 'B2' },
  { min: 4.0, level: 'B1' },
  { min: 2.5, level: 'A2' },
  { min: 0.0, level: 'A1' },
];

export function cefrFromScore(raw: number): CefrLevel {
  return CEFR_THRESHOLDS.find(t => raw >= t.min)?.level ?? 'A1';
}

function formatCefr(raw: number | null | undefined, sub?: SubScores): FormattedScore {
  // Prefer an explicit level from the API over our own thresholding.
  const explicit = subString(sub, 'cefr_level');
  const level = explicit && (CEFR_LEVELS as readonly string[]).includes(explicit)
    ? (explicit as CefrLevel)
    : raw === null || raw === undefined || Number.isNaN(raw)
      ? null
      : cefrFromScore(raw);

  if (!level) return { display: EMPTY, label: 'CEFR Level' };

  return {
    display: level,
    label: 'CEFR Level',
    description: `${level} — ${CEFR_DESCRIPTIONS[level]}`,
  };
}

// ─── OET · weakest-skill grade (TC-04 §3) ─────────────────────────────────────
//
// Registered for completeness so the third formatter exists behind the same
// interface. No OET UI ships until Week 11+ (TC-07).

export const OET_GRADES = ['A', 'B', 'C+', 'C', 'D', 'E'] as const;
export type OetGrade = (typeof OET_GRADES)[number];

const OET_THRESHOLDS: ReadonlyArray<{ min: number; grade: OetGrade }> = [
  { min: 450, grade: 'A' },
  { min: 350, grade: 'B' }, // the Grade B target — TC-03 §7 Q11
  { min: 300, grade: 'C+' },
  { min: 200, grade: 'C' },
  { min: 100, grade: 'D' },
  { min: 0, grade: 'E' },
];

export function oetGradeFromNumeric(numeric: number): OetGrade {
  return OET_THRESHOLDS.find(t => numeric >= t.min)?.grade ?? 'E';
}

function formatOetGrade(raw: number | null | undefined, sub?: SubScores): FormattedScore {
  const explicit = subString(sub, 'oet_grade');
  const grade = explicit && (OET_GRADES as readonly string[]).includes(explicit)
    ? (explicit as OetGrade)
    : raw === null || raw === undefined || Number.isNaN(raw)
      ? null
      : oetGradeFromNumeric(raw);

  if (!grade) return { display: EMPTY, label: 'Grade' };
  return { display: grade, label: 'Grade' };
}

// ─── The registry ─────────────────────────────────────────────────────────────

export const EXAM_REGISTRY: Record<ExamType, ExamUiConfig> = {
  IELTS: {
    examType: 'IELTS',
    legalDisplayName: 'International English Language Testing System (IELTS™)',
    legalDisclaimer:
      'TestCrack is a preparation and coaching platform. We are not an official IELTS test provider and are not affiliated with, endorsed by, or associated with the owners of the IELTS™ mark.',
    trademarkOwner: 'British Council, IDP: IELTS Australia and Cambridge University Press & Assessment',
    shortLabel: 'IELTS',
    formatOverall: formatIeltsOverall,
    formatSkillScore: formatIeltsSkill,
    skills: ['LISTENING', 'READING', 'WRITING', 'SPEAKING'],
    speakingFormat: 'monologue',
    selfRegistration: false, // B2B (TC-03 §2.3 Q3)
    routeSlug: 'ielts',
  },

  SPOKEN: {
    examType: 'SPOKEN',
    // TC-03 §5.1: no exam name we don't own, and nothing implying an official test.
    legalDisplayName: 'Spoken English Assessment',
    legalDisclaimer:
      'TestCrack is a preparation and coaching platform. Spoken English proficiency is reported against the Common European Framework of Reference for Languages (CEFR), a public reference framework.',
    trademarkOwner: 'Council of Europe (CEFR reference framework)',
    shortLabel: 'Spoken English',
    formatOverall: formatCefr,
    formatSkillScore: formatCefr,
    skills: ['SPEAKING'], // v1 is speaking-only viva (TC-03 §7 Q23)
    speakingFormat: 'viva',
    selfRegistration: true, // true-capable per TC-03 §2.3 Q3; screen not built
    routeSlug: 'spoken',
    maxVivaQuestions: 10, // TC-03 §7.1 sizing; authoritative value comes from the API
  },

  OET: {
    examType: 'OET',
    legalDisplayName: 'Preparation for the Occupational English Test (OET®)',
    legalDisclaimer:
      'TestCrack is a preparation and coaching platform. We are not an official OET test provider and are not affiliated with, endorsed by, or associated with Cambridge Boxhill Language Assessment.',
    trademarkOwner: 'Cambridge Boxhill Language Assessment',
    shortLabel: 'OET',
    formatOverall: formatOetGrade,
    formatSkillScore: formatOetGrade,
    skills: ['LISTENING', 'READING', 'WRITING'], // L+R+W only (TC-03 §7 Q10)
    speakingFormat: null, // role-play deferred; enum value reserved
    selfRegistration: false,
    routeSlug: 'oet',
  },
};

/** Registration order per TC-03 §0. */
export const REGISTERED_EXAMS: readonly ExamType[] = ['IELTS', 'SPOKEN', 'OET'];

export function getExamConfig(examType: ExamType): ExamUiConfig {
  return EXAM_REGISTRY[examType];
}

export function isExamType(value: unknown): value is ExamType {
  return typeof value === 'string' && value in EXAM_REGISTRY;
}
