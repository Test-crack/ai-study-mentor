import { getBackendUrl } from '@/shared/utils';
import { callBackend } from '@/features/auth/services/authClient';

export interface WritingTask {
  id: string;
  title: string;
  topic: string;
  assignedDate: string;
}

export interface WritingAssessmentHistoryItem {
  id: string;
  taskId: string;
  writtenContent: string;
  wordCount: number;
  aiBandScore: string;
  aiGrammarScore: number;
  aiVocabularyScore: number;
  aiCoherenceScore: number;
  aiTaskResponseScore: number;
  aiFeedbackData: any;
  manualBandScore?: string;
  manualFeedback?: string;
  createdAt: string;
  IeltsWritingTask?: WritingTask;
}

export const fetchWritingTasks = async () => {
  const backendUrl = getBackendUrl();
  const res = await callBackend(`${backendUrl}/api/ielts-writing`);
  return res.data;
};

export const submitWritingSession = async (taskId: string, content: string, wordCount: number) => {
  const backendUrl = getBackendUrl();
  const res = await callBackend(`${backendUrl}/api/ielts-writing/submit`, {
    method: 'POST',
    body: JSON.stringify({ taskId, content, wordCount }),
    headers: { 'Content-Type': 'application/json' },
  });
  if (res.success) return res.data as WritingAssessmentHistoryItem;
  throw new Error(res.error || 'Failed to submit writing');
};

export const fetchWritingHistory = async () => {
  const backendUrl = getBackendUrl();
  const res = await callBackend(`${backendUrl}/api/ielts-writing/history`);
  if (res.success) return res.data as WritingAssessmentHistoryItem[];
  throw new Error(res.error || 'Failed to fetch history');
};
