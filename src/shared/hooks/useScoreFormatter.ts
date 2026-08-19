// src/shared/hooks/useScoreFormatter.ts
//
// The drop-in replacement for `someScore.toFixed(1)`.
//
// Why a hook returning a function rather than a <ScoreDisplay> component: the
// ~174 existing call sites render scores inside already-styled spans with their
// own colour and typography classes. A wrapping component would force those
// styles to move; a formatter function drops in where `.toFixed(1)` was and
// leaves the surrounding JSX untouched. That keeps "zero visual change for
// IELTS" verifiable by reading the diff.
//
// Refs: TC-04 §2, §10 · TC-03 D1

import { useCallback } from 'react';
import { useExamConfig } from '@/shared/context/ExamContext';
import type { SubScores } from '@/shared/types/exam';

export interface ScoreFormatter {
  /** The score as text: "6.5" (IELTS), "B2" (SPOKEN), "B" (OET). Em dash if absent. */
  (raw: number | null | undefined, sub?: SubScores): string;
  /** What this exam calls its score: "Band", "CEFR Level", "Grade". */
  label: string;
  /** Longer form for tooltips, where the exam provides one. */
  describe: (raw: number | null | undefined, sub?: SubScores) => string | undefined;
}

/**
 * Formats scores for the active exam.
 *
 *   const score = useScoreFormatter();
 *   <span className="...">{score(row.band)}</span>       // was row.band.toFixed(1)
 *   <span className="...">{score.label}</span>           // was the literal "Band"
 *
 * Do not reach for `if (examType === …)` at the call site — TC-04 §10. If a
 * surface needs something this doesn't express, add a field to ExamUiConfig.
 */
export function useScoreFormatter(): ScoreFormatter {
  const { config } = useExamConfig();

  const format = useCallback(
    (raw: number | null | undefined, sub?: SubScores) => config.formatOverall(raw, sub).display,
    [config],
  ) as ScoreFormatter;

  format.label = config.formatOverall(null).label;
  format.describe = (raw, sub) => config.formatOverall(raw, sub).description;

  return format;
}

/**
 * Same thing for a single skill rather than an overall score. Separate because
 * the two genuinely differ for some exams — OET aggregates overall as the
 * weakest skill grade, so a skill score and an overall score are not the same
 * computation even though they share a scale.
 */
export function useSkillScoreFormatter(): ScoreFormatter {
  const { config } = useExamConfig();

  const format = useCallback(
    (raw: number | null | undefined, sub?: SubScores) => config.formatSkillScore(raw, sub).display,
    [config],
  ) as ScoreFormatter;

  format.label = config.formatSkillScore(null).label;
  format.describe = (raw, sub) => config.formatSkillScore(raw, sub).description;

  return format;
}
