/**
 * readingPracticeService.ts
 *
 * Service for the IELTS Reading Practice feature (ReadingPractice.tsx).
 *
 * This is SEPARATE from speedReadingService.ts (which handles the RSVP
 * word-flash Speed Reading feature). Reading Practice uses the same
 * passages (IeltsSpeedReadingReport) but saves results to the new
 * IeltsReadingAssessment table.
 *
 * Backend tables:
 *   - IeltsSpeedReadingReport  (source passages — read only)
 *   - IeltsSpeedReadingExercise (MCQ questions — read only)
 *   - IeltsReadingAssessment   (NEW — stores each reading session result)
 *
 * API Endpoints:
 *   GET  /api/ielts-reading/speed-reading/reports       → list passages
 *   GET  /api/ielts-reading/speed-reading/reports/:id  → passage + questions
 *   POST /api/reading-practice/submit                  → save + evaluate session → IeltsReadingAssessment
 *   GET  /api/reading-practice/history                 → student's own reading history
 */

import { getBackendUrl } from '@/shared/utils';
import { callBackend } from '@/features/auth/services/authClient';
import {
  fetchSpeedReadingReports,
  fetchSpeedReadingReportById,
  type SpeedReadingReportSummary,
  type SpeedReadingReport,
} from './speedReadingService';

// ─── Re-export passage fetchers (from speedReadingService, read-only) ─────────
export { fetchSpeedReadingReports as fetchReadingPassages, fetchSpeedReadingReportById as fetchReadingPassageById };
export type { SpeedReadingReportSummary as ReadingPassageSummary, SpeedReadingReport as ReadingPassage };

// ─── Types specific to Reading Practice ──────────────────────────────────────

export interface ReadingPracticeSubmission {
  reportId: string;          // IeltsSpeedReadingReport.id
  passageTitle: string;
  category: string;
  wordCount: number;
  readingTimeSeconds: number;
  wpm: number;               // computed client-side
  answers: Array<{
    questionId: string;
    selectedOption: string;
  }>;
}

export interface ScoredAnswer {
  questionId: string;
  stem: string;
  userAnswer: string;
  correctAnswer: string;
  isCorrect: boolean;
  explanation?: string;
}

export interface ReadingPracticeResult {
  id: string;                // IeltsReadingAssessment.id (DB row)
  grade: string;             // A+, A, B, C, D, F
  wpm: number;
  retentionScore: number;
  efficiencyScore: number;
  speedLearningScore: number;
  accuracy: number;
  correct: number;
  total: number;
  readingTimeSeconds: number;
  speedCategory: string;
  idealWpmSuggestion: number;
  scoredAnswers: ScoredAnswer[];
  feedback: string[];
}

/** Row shape returned by history endpoints (all roles) */
export interface ReadingAssessmentHistoryItem {
  id: string;
  reportId: string;
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
  totalQuestions: number;
  correctAnswers: number;
  createdAt: string;
}

/** Batch-level reading analytics returned for instructors / institute owners */
export interface BatchReadingAnalytics {
  batchName: string;
  summary: {
    totalStudents: number;
    avgWPM: number;
    avgAccuracy: number;
    avgSpeedLearningScore: number;
    totalSessions: number;
  };
  wpmTrends: Array<{ date: string; avgWpm: number; avgAccuracy: number }>;
  studentLeaderboard: Array<{
    studentId: string;
    name: string;
    avatar?: string;
    avgWPM: number;
    avgAccuracy: number;
    bestSpeedLearningScore: number;
    totalSessions: number;
  }>;
}

// ─── API Calls ────────────────────────────────────────────────────────────────

/**
 * Submit a completed Reading Practice session.
 * Saves to IeltsReadingAssessment and returns graded results.
 *
 * NOTE: Falls back to the legacy speed-reading submit endpoint while the new
 * dedicated endpoint is being implemented on the backend. Once
 * POST /api/reading-practice/submit is deployed, remove the fallback.
 */
export const submitReadingPracticeSession = async (
  submission: ReadingPracticeSubmission
): Promise<ReadingPracticeResult> => {
  const backendUrl = getBackendUrl();

  // Try the new dedicated endpoint first
  try {
    const response = await callBackend(`${backendUrl}/api/reading-practice/submit`, {
      method: 'POST',
      body: JSON.stringify(submission),
      headers: { 'Content-Type': 'application/json' },
    });
    if (response.success) return response.data as ReadingPracticeResult;
    throw new Error(response.error || 'Submission failed');
  } catch (err: any) {
    // Fallback: use the speed-reading submit endpoint (works while new endpoint
    // is not yet deployed — saves to ReadingAssessmentHistory instead)
    console.warn(
      '[readingPracticeService] New reading-practice endpoint not available, falling back to speed-reading/submit:',
      err.message
    );
    const fallback = await callBackend(`${backendUrl}/api/ielts-reading/speed-reading/submit`, {
      method: 'POST',
      body: JSON.stringify({
        reportId: submission.reportId,
        readingTimeSeconds: submission.readingTimeSeconds,
        wpm: submission.wpm,
        answers: submission.answers,
      }),
      headers: { 'Content-Type': 'application/json' },
    });
    if (fallback.success) return fallback.data as ReadingPracticeResult;
    throw new Error(fallback.error || 'Submission failed (fallback)');
  }
};

/**
 * Fetch the student's own Reading Practice history from IeltsReadingAssessment.
 */
export const fetchStudentReadingHistory = async (
  params?: { limit?: number; category?: string }
): Promise<ReadingAssessmentHistoryItem[]> => {
  const backendUrl = getBackendUrl();
  const qs = new URLSearchParams();
  if (params?.limit) qs.append('limit', params.limit.toString());
  if (params?.category) qs.append('category', params.category);

  try {
    const response = await callBackend(
      `${backendUrl}/api/reading-practice/history?${qs.toString()}`
    );
    return response.data as ReadingAssessmentHistoryItem[];
  } catch (err: any) {
    console.error('Error fetching reading practice history:', err.message);
    return [];
  }
};

/**
 * Fetch a specific student's Reading Practice history (for instructors).
 */
export const fetchStudentReadingHistoryForInstructor = async (
  studentId: string
): Promise<ReadingAssessmentHistoryItem[]> => {
  const backendUrl = getBackendUrl();
  try {
    const response = await callBackend(
      `${backendUrl}/api/instructor/students/${studentId}/reading-history`
    );
    return response.data as ReadingAssessmentHistoryItem[];
  } catch (err: any) {
    console.warn('Instructor reading history endpoint not available:', err.message);
    return [];
  }
};

/**
 * Fetch batch-level Reading Practice analytics.
 * Role-aware: uses different base paths for INSTRUCTOR vs INSTITUTE_OWNER.
 */
export const fetchBatchReadingAnalytics = async (
  batchId: string,
  role: 'INSTRUCTOR' | 'INSTITUTE_OWNER'
): Promise<BatchReadingAnalytics | null> => {
  const backendUrl = getBackendUrl();
  const base = role === 'INSTITUTE_OWNER' ? 'institute-owner' : 'instructor';
  try {
    const response = await callBackend(
      `${backendUrl}/api/${base}/batches/${batchId}/reading-analytics`
    );
    return response.data as BatchReadingAnalytics;
  } catch (err: any) {
    console.warn('Batch reading analytics endpoint not available:', err.message);
    return null;
  }
};
