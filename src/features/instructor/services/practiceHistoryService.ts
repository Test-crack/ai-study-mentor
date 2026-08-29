// src/features/instructor/services/practiceHistoryService.ts
//
// Per-student practice history for instructors. All three endpoints were live
// and authorised but called by nothing (DATA_AUDIT §5b), so an instructor could
// see assessment results but not the practice work behind them.
//
// Note on the pre-existing fetchStudentReadingHistoryForInstructor in
// student/services/readingPracticeService.ts: it casts `response.data` to an
// array, but this endpoint returns `{ sessions, summary }`. That cast could
// never have produced usable data, which is likely why nothing ever imported
// it. These functions read the real shape instead.

import { callBackend } from '@/features/auth/services/authClient';
import { getBackendUrl } from '@/shared/utils';

/**
 * Which portal's routes to call. All three serve the SAME payload from the same
 * shared computations (backend lib/practiceHistoryQueries); they differ only in
 * authorisation scope — batch assignment for the instructor, institute
 * membership for the owner and admin.
 */
export type PracticeHistoryScope = 'instructor' | 'institute-owner' | 'institute-admin';

const BASE = (scope: PracticeHistoryScope) => `${getBackendUrl()}/api/${scope}`;

// ─── Reading ──────────────────────────────────────────────────────────────────

export interface ReadingPracticeSession {
  id: string;
  passageTitle: string;
  category: string;
  wordCount: number;
  readingTimeSeconds: number;
  wpm: number;
  accuracy: number;
  retentionScore: number;
  efficiencyScore: number;
  speedLearningScore: number;
  grade: string;
  speedCategory: string | null;
  totalQuestions: number;
  correctAnswers: number;
  feedbackTips: string[];
  createdAt: string;
}

export interface ReadingSummary {
  totalSessions: number;
  avgWpm: number;
  avgAccuracy: number;
  bestScore: number;
}

// ─── Speaking ─────────────────────────────────────────────────────────────────

export interface SpeakingPracticeSession {
  id: string;
  topicId: string;
  topicTitle: string;
  bandLevel: string;
  fluencyScore: number;
  weightedWpm: number;
  keywordsHit: number;
  totalKeywords: number;
  frequentFillers: { word: string; count: number }[];
  createdAt: string;
}

export interface SpeakingSummary {
  totalSessions: number;
  avgFluency: number;
  avgWpm: number;
  bestScore: number;
}

// ─── Writing ──────────────────────────────────────────────────────────────────

export interface WritingPracticeSession {
  id: string;
  wordCount: number;
  /** VarChar(10) on the model — a string, not a number. */
  aiBandScore: string | null;
  aiGrammarScore: number | null;
  aiVocabularyScore: number | null;
  aiCoherenceScore: number | null;
  aiTaskResponseScore: number | null;
  createdAt: string;
  IeltsWritingTask?: { id: string; title: string; topic: string } | null;
}

export interface WritingSummary {
  totalSessions: number;
  avgScore: number;
}

// ─── Fetchers ─────────────────────────────────────────────────────────────────

interface HistoryEnvelope<S, U> { sessions: S[]; summary: U }

async function getHistory<S, U>(
  scope: PracticeHistoryScope,
  studentId: string,
  path: string,
  emptySummary: U
): Promise<HistoryEnvelope<S, U>> {
  const res = await callBackend(`${BASE(scope)}/students/${studentId}/${path}`);
  return {
    sessions: res?.data?.sessions ?? [],
    summary: res?.data?.summary ?? emptySummary,
  };
}

export const fetchReadingHistory = (studentId: string, scope: PracticeHistoryScope = 'instructor') =>
  getHistory<ReadingPracticeSession, ReadingSummary>(scope, studentId, 'reading-history', {
    totalSessions: 0, avgWpm: 0, avgAccuracy: 0, bestScore: 0,
  });

export const fetchSpeakingHistory = (studentId: string, scope: PracticeHistoryScope = 'instructor') =>
  getHistory<SpeakingPracticeSession, SpeakingSummary>(scope, studentId, 'speaking-history', {
    totalSessions: 0, avgFluency: 0, avgWpm: 0, bestScore: 0,
  });

export const fetchWritingHistory = (studentId: string, scope: PracticeHistoryScope = 'instructor') =>
  getHistory<WritingPracticeSession, WritingSummary>(scope, studentId, 'writing-history', {
    totalSessions: 0, avgScore: 0,
  });
