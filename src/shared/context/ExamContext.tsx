// src/shared/context/ExamContext.tsx
//
// Holds which exam the current user is looking at, and exposes that exam's
// config. Every score, label and exam name in the UI reads from here.
//
// Refs: TC-04 §3.5 · TC-03 §3.1 Q5, §5.1

import { createContext, useCallback, useContext, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import type { ExamType, ExamUiConfig } from '@/shared/types/exam';
import { EXAM_REGISTRY, isExamType } from '@/shared/config/examRegistry';

interface ExamContextValue {
  /** The exam currently being viewed. */
  activeExam: ExamType;
  /** Config for `activeExam` — the only sanctioned source of exam labels/scores. */
  config: ExamUiConfig;
  /** Exams active for this user's institute. */
  availableExams: readonly ExamType[];
  setActiveExam: (exam: ExamType) => void;
  /**
   * TC-03 §3.1 Q5 / TC-04 §3.5: the exam picker renders ONLY when more than one
   * exam is active. Single-exam institutes must see no new UI at all — so this
   * is exposed as a derived flag rather than left to each call site to compute.
   */
  showExamSwitcher: boolean;
}

const ExamContext = createContext<ExamContextValue | null>(null);

/**
 * Where the active exam is remembered.
 *
 * ⚠️ PROVISIONAL. Backend contract ask #5 (does switcher selection persist
 * server-side or client-only?) is open as of 18 Aug. Client-only via
 * sessionStorage until answered — deliberately session-scoped, so if the answer
 * is "server-side" we swap this one function and no stale cross-session state
 * has to be cleaned up.
 */
const STORAGE_KEY = 'testcrack.activeExam';

function readStoredExam(fallback: ExamType): ExamType {
  try {
    const stored = sessionStorage.getItem(STORAGE_KEY);
    return isExamType(stored) ? stored : fallback;
  } catch {
    return fallback; // private mode / storage disabled
  }
}

interface ExamProviderProps {
  children: ReactNode;
  /**
   * Exams active for the institute. Defaults to IELTS only, which is the
   * truthful state today: SPOKEN is not live until Week 7–8 (TC-07). This
   * becomes API-driven when institute_exam_subscriptions is exposed.
   */
  availableExams?: readonly ExamType[];
}

export function ExamProvider({ children, availableExams = ['IELTS'] }: ExamProviderProps) {
  const fallback = availableExams[0] ?? 'IELTS';
  const [activeExam, setActiveExamState] = useState<ExamType>(() => {
    const stored = readStoredExam(fallback);
    // Never leave the user on an exam their institute no longer has.
    return availableExams.includes(stored) ? stored : fallback;
  });

  const setActiveExam = useCallback((exam: ExamType) => {
    setActiveExamState(exam);
    try {
      sessionStorage.setItem(STORAGE_KEY, exam);
    } catch {
      // Non-fatal: the switch still works for this render.
    }
  }, []);

  const value = useMemo<ExamContextValue>(
    () => ({
      activeExam,
      config: EXAM_REGISTRY[activeExam],
      availableExams,
      setActiveExam,
      showExamSwitcher: availableExams.length > 1,
    }),
    [activeExam, availableExams, setActiveExam],
  );

  return <ExamContext.Provider value={value}>{children}</ExamContext.Provider>;
}

/**
 * The active exam's config.
 *
 * Use this instead of branching on exam type. TC-04 §10: an exam-type branch in
 * a shared component collapses the monorepo advantage — if you need a branch,
 * ExamUiConfig is missing a field.
 *
 *   const { config } = useExamConfig();
 *   <h2>{config.legalDisplayName}</h2>
 *   <Stat label={config.formatOverall(score, subScores).label}
 *         value={config.formatOverall(score, subScores).display} />
 */
export function useExamConfig(): ExamContextValue {
  const ctx = useContext(ExamContext);
  if (!ctx) {
    throw new Error('useExamConfig must be used within an <ExamProvider>');
  }
  return ctx;
}

/**
 * Config for a specific exam, independent of what's active — for admin surfaces
 * that list several exams at once (question bank manager, superadmin tables).
 */
export function useExamConfigFor(examType: ExamType): ExamUiConfig {
  return EXAM_REGISTRY[examType];
}
