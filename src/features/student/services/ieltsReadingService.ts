/**
 * ieltsReadingService.ts — DEPRECATED
 *
 * This file is kept for backward compatibility only.
 * All content has been moved to ieltsSpeakingService.ts because this feature
 * is actually the IELTS Speaking Practice (not Reading Practice).
 *
 * The new Reading Practice feature uses speedReadingService.ts instead.
 *
 * @deprecated Import from ieltsSpeakingService.ts directly.
 */

export type { IeltsSpeakingPracticeList as IeltsReadingPracticeList } from './ieltsSpeakingService';
export type { IeltsSpeakingPractice as IeltsReadingPractice } from './ieltsSpeakingService';
export type { SpeakingTopicsResponse as TopicsResponse } from './ieltsSpeakingService';
export {
  fetchIeltsSpeakingTopics as fetchIeltsReadingTopics,
  fetchIeltsSpeakingTopicById as fetchIeltsReadingTopicById,
  saveIeltsSpeakingAssessment as saveIeltsReadingAssessment,
  fetchSpeakingHistory,
} from './ieltsSpeakingService';
