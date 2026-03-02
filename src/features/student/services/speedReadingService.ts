import { getBackendUrl } from '@/shared/utils';
import { callBackend } from '@/features/auth/services/authClient';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface SpeedReadingReportSummary {
    id: string;
    category: string;
    title: string;
    source: string;
    wordCount: number;
}

export type QuestionType = 'MCQ' | 'TRUE_FALSE_NOT_GIVEN';

export interface SpeedReadingQuestion {
    id: string;
    type: QuestionType;
    stem: string;
    options: string[];
    answer: string;
    explanation?: string;
}

export interface SpeedReadingReport extends SpeedReadingReportSummary {
    text: string;
    questions: SpeedReadingQuestion[] | null;
}

// ─── Submit types ─────────────────────────────────────────────────────────────

export interface ScoredAnswer {
    questionId: string;
    type: string;
    stem: string;
    options: string[];
    correctAnswer: string;
    userAnswer: string;
    isCorrect: boolean;
    explanation: string | null;
}

export interface SessionEvaluation {
    retentionScore: number;   // 0–100
    wpm: number;
    readingTimeSeconds: number;
    correct: number;
    total: number;
    grade: string;            // A+, A, B, C, D, F
    speedCategory: string;    // Beginner → Elite
    speedScore: number;       // 0–100 normalised WPM
    efficiencyScore: number;  // weighted blend of retention + speed
    feedback: string[];       // 2 actionable insights
    idealWpmSuggestion: number;
    scoredAnswers: ScoredAnswer[];
}

// ─── API functions ────────────────────────────────────────────────────────────

export const fetchSpeedReadingReports = async (): Promise<SpeedReadingReportSummary[]> => {
    const url = `${getBackendUrl()}/api/ielts-reading/speed-reading/reports`;
    try {
        const res = await callBackend(url);
        return res.data as SpeedReadingReportSummary[];
    } catch (err) {
        console.error('Error fetching speed reading reports:', err);
        throw err;
    }
};

export const fetchSpeedReadingReportById = async (id: string): Promise<SpeedReadingReport> => {
    const url = `${getBackendUrl()}/api/ielts-reading/speed-reading/reports/${id}`;
    try {
        const res = await callBackend(url);
        return res.data as SpeedReadingReport;
    } catch (err) {
        console.error(`Error fetching speed reading report ${id}:`, err);
        throw err;
    }
};

export const submitSpeedReadingSession = async (payload: {
    reportId: string;
    readingTimeSeconds: number;
    wpm: number;
    answers: { questionId: string; selectedOption: string }[];
}): Promise<SessionEvaluation> => {
    const url = `${getBackendUrl()}/api/ielts-reading/speed-reading/submit`;
    try {
        const res = await callBackend(url, {
            method: 'POST',
            body: JSON.stringify(payload),
            headers: { 'Content-Type': 'application/json' },
        });
        return res.data as SessionEvaluation;
    } catch (err) {
        console.error('Error submitting speed reading session:', err);
        throw err;
    }
};
