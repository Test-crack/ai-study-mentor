// src/shared/types/exam.ts
//
// The single source of exam vocabulary for the frontend.
//
// Interfaces and types ONLY — no logic, no imports, no dependencies. This file
// is the staging ground for `packages/exam-engine` (TC-04 §1: "interfaces only"),
// so it must stay importable from any app or package without pulling anything in.
//
// Refs: TC-04 §1, §2, §3.2 · TC-03 D1, §5.1

/**
 * The registered exams. This list grows by *registration*, not by code changes
 * elsewhere — TC-04 §0 principle 2, "a new exam is new data".
 *
 * TC-03 §0 ordering: IELTS is exam 1 (and the regression guard), SPOKEN is
 * exam 2, OET is exam 3. GRE/TOEFL/PTE are explicitly *not* registered yet;
 * do not add them here speculatively.
 */
export type ExamType = 'IELTS' | 'SPOKEN' | 'OET';

/** Skills a bank/assessment can be scoped to. */
export type ExamSkill = 'LISTENING' | 'READING' | 'WRITING' | 'SPEAKING';

/**
 * Speaking delivery format. TC-03 §7 Q10: 'roleplay' is reserved for OET but
 * NOT built for v1 — the enum value exists so the variant is architected
 * without any UI shipping.
 */
export type SpeakingFormat = 'monologue' | 'roleplay' | 'viva';

/**
 * The shape of a score as the UI should render it.
 *
 * TC-04 §2: `band_score` stays a generic Decimal on the wire. Non-numeric
 * scales (CEFR levels, OET letter grades) live in the `sub_scores` JSON. So the
 * UI never formats a raw number directly — it asks the exam's config.
 */
export interface FormattedScore {
  /** What the user reads: "6.5", "B2", "B". */
  display: string;
  /** What it's called: "Band", "CEFR Level", "Grade". */
  label: string;
  /** Optional longer form for tooltips: "B2 — Upper Intermediate". */
  description?: string;
}

/** Raw `sub_scores` JSON as it arrives from the API. Deliberately loose. */
export type SubScores = Record<string, unknown> | null | undefined;

/**
 * Everything the frontend needs to know about one exam.
 *
 * The rule this interface exists to enforce (TC-04 §10): a shared component
 * must NEVER branch on exam type. If a component needs
 * `if (examType === 'IELTS')`, this config is missing a field — add the field,
 * don't add the branch.
 */
export interface ExamUiConfig {
  examType: ExamType;

  // ─── Legal display strings (TC-03 §5.1) ──────────────────────────────
  // These three fields exist so no developer ever hand-types an exam name
  // into a component again. Rule 2 of §5.1: referential use only, always
  // descriptive. Hand-typed exam names are how trademark mistakes ship.

  /** Full legally-approved name: "Occupational English Test (OET®)". */
  legalDisplayName: string;
  /** The ToS/footer line for this exam. */
  legalDisclaimer: string;
  /** Mark owner, e.g. "Cambridge Boxhill Language Assessment". */
  trademarkOwner: string;

  /**
   * Short label for chips, tabs, filters and dense table cells.
   * Still config-sourced — a short label is not a licence to hand-type.
   */
  shortLabel: string;

  // ─── Scoring (TC-03 D1 — three genuinely different aggregations) ──────

  /**
   * Format an overall score for display.
   *
   * IELTS  → mean rounded to 0.5, shown as "6.5"
   * SPOKEN → banded threshold over sub-skill means, shown as "B2"
   * OET    → weakest-skill grade, shown as "B"
   *
   * @param raw  the generic numeric `band_score`
   * @param sub  the `sub_scores` JSON, where non-numeric scales live
   */
  formatOverall: (raw: number | null | undefined, sub?: SubScores) => FormattedScore;

  /** Format a single skill's score. */
  formatSkillScore: (raw: number | null | undefined, sub?: SubScores) => FormattedScore;

  // ─── Product shape ───────────────────────────────────────────────────

  /** Skills this exam assesses. OET v1 is L+R+W only (TC-03 §7 Q9/Q10). */
  skills: readonly ExamSkill[];

  /** How speaking is delivered, if at all. */
  speakingFormat: SpeakingFormat | null;

  /**
   * TC-03 §2.3 Q3: false for IELTS/OET (B2B), true-capable for SPOKEN.
   * Build the flag now; build the registration screen only when asked.
   */
  selfRegistration: boolean;

  /**
   * Route prefix for both the API and the app shell.
   * TC-04 §3.3 (`/api/spoken/…`) and §9 (`testcrack.com/spoken/…`).
   */
  routeSlug: string;

  /**
   * Cap on viva questions per session. TC-04 §4.5: not a cost control —
   * an uncapped loop is an uncapped failure surface.
   */
  maxVivaQuestions?: number;
}
