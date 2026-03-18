/**
 * ieltsSpeakingService.ts
 *
 * Service for the IELTS Speaking Practice feature
 * (StudentReadingAssessmentPage.tsx / "Speaking-Assessment" route).
 *
 * Previously named ieltsReadingService.ts — renamed to avoid confusion with
 * the new Reading Practice feature (ReadingPractice.tsx).
 *
 * Backend tables:
 *   - IeltsSpeakingPractice  (renamed from IeltsReadingPractice)
 *   - IeltsSpeakingReport    (renamed from IeltsReadingReport/IeltsReadingAssessment)
 *
 * API endpoints (unchanged on the backend — route paths will be updated in a
 * backend migration; for now they still hit /api/ielts-reading/*):
 *   GET  /api/ielts-reading/topics
 *   GET  /api/ielts-reading/topics/:id
 *   POST /api/ielts-reading/save-assessment
 *   GET  /api/student/speaking-history
 */

import { getBackendUrl } from '@/shared/utils';
import { callBackend } from '@/features/auth/services/authClient';

// ─── Types ────────────────────────────────────────────────────────────────────

/** List-view shape (no heavy fields) */
export interface IeltsSpeakingPracticeList {
  id: string;
  title: string;
  type: string;
  words: number;
  phrases: number;
  band: string;
}

/** Detail view (includes model answer, keywords, tips) */
export interface IeltsSpeakingPractice extends IeltsSpeakingPracticeList {
  modelAnswer: string;
  keywords: string[];
  keywordMap: Array<{ word: string; meaning: string }>;
  tips: string[];
}

export interface SpeakingTopicsResponse {
  success: boolean;
  data: IeltsSpeakingPracticeList[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

// ─── API Calls ────────────────────────────────────────────────────────────────

/**
 * Fetch paginated IELTS speaking topics with optional band filter.
 */
export const fetchIeltsSpeakingTopics = async (
  band?: string,
  page: number = 1,
  limit: number = 10
): Promise<SpeakingTopicsResponse> => {
  const backendUrl = getBackendUrl();
  const params = new URLSearchParams();
  if (band && band !== 'All') params.append('band', band);
  params.append('page', page.toString());
  params.append('limit', limit.toString());

  const fullUrl = `${backendUrl}/api/ielts-reading/topics?${params.toString()}`;

  try {
    const response = await callBackend(fullUrl);
    return response as SpeakingTopicsResponse;
  } catch (error) {
    console.error('Error fetching IELTS speaking topics:', error);
    throw error;
  }
};

/**
 * Fetch full IELTS speaking topic details by ID.
 */
export const fetchIeltsSpeakingTopicById = async (id: string): Promise<IeltsSpeakingPractice> => {
  const backendUrl = getBackendUrl();
  const fullUrl = `${backendUrl}/api/ielts-reading/topics/${id}`;

  try {
    const response = await callBackend(fullUrl);
    return response.data;
  } catch (error) {
    console.error(`Error fetching speaking topic ${id}:`, error);
    throw error;
  }
};

/**
 * Save and analyze a completed IELTS speaking practice session.
 * Saves to IeltsSpeakingReport (DB) and returns scored metrics.
 */
export const saveIeltsSpeakingAssessment = async (data: {
  topicId: string;
  userId: string;
  band: string;
  pass1: any;
  pass2: any;
}): Promise<any> => {
  const backendUrl = getBackendUrl();
  const fullUrl = `${backendUrl}/api/ielts-reading/save-assessment`;

  try {
    const response = await callBackend(fullUrl, {
      method: 'POST',
      body: JSON.stringify(data),
      headers: {
        'Content-Type': 'application/json',
      },
    });
    return response;
  } catch (error) {
    console.error('Error saving speaking assessment:', error);
    throw error;
  }
};

/**
 * Fetch the student's personal speaking practice history.
 */
export const fetchSpeakingHistory = async (): Promise<any> => {
  const backendUrl = getBackendUrl();
  const fullUrl = `${backendUrl}/api/student/speaking-history`;

  try {
    const response = await callBackend(fullUrl);
    return response;
  } catch (error) {
    console.error('Error fetching speaking history:', error);
    throw error;
  }
};

// ─── Backward-compatibility re-exports ──────────────────────────────────────
// These allow us to rename without breaking any other files that haven't been
// updated yet. We can remove these once all consumers are migrated.

/** @deprecated Use IeltsSpeakingPracticeList */
export type IeltsReadingPracticeList = IeltsSpeakingPracticeList;

/** @deprecated Use IeltsSpeakingPractice */
export type IeltsReadingPractice = IeltsSpeakingPractice;

/** @deprecated Use fetchIeltsSpeakingTopics */
export const fetchIeltsReadingTopics = fetchIeltsSpeakingTopics;

/** @deprecated Use fetchIeltsSpeakingTopicById */
export const fetchIeltsReadingTopicById = fetchIeltsSpeakingTopicById;

/** @deprecated Use saveIeltsSpeakingAssessment */
export const saveIeltsReadingAssessment = saveIeltsSpeakingAssessment;
