import { getBackendUrl } from '@/shared/utils';
import { callBackend } from '@/features/auth/services/authClient';

export interface IeltsReadingPracticeList {
    id: string;
    title: string;
    type: string;
    words: number;
    phrases: number;
    band: string;
}

export interface IeltsReadingPractice extends IeltsReadingPracticeList {
    modelAnswer: string;
    keywords: string[];
    keywordMap: Array<{ word: string, meaning: string }>;
    tips: string[];
}

export interface TopicsResponse {
    success: boolean;
    data: IeltsReadingPracticeList[];
    pagination: {
        total: number;
        page: number;
        limit: number;
        totalPages: number;
    };
}

/**
 * Fetch IELTS reading practice topics with optional filtering and pagination
 */
export const fetchIeltsReadingTopics = async (
    band?: string,
    page: number = 1,
    limit: number = 10
): Promise<TopicsResponse> => {
    const backendUrl = getBackendUrl();
    const params = new URLSearchParams();
    if (band && band !== 'All') params.append('band', band);
    params.append('page', page.toString());
    params.append('limit', limit.toString());

    const fullUrl = `${backendUrl}/api/ielts-reading/topics?${params.toString()}`;

    try {
        const response = await callBackend(fullUrl);
        return response as TopicsResponse;
    } catch (error) {
        console.error('Error fetching IELTS reading topics:', error);
        throw error;
    }
};

/**
 * Fetch full IELTS reading practice topic details by ID
 */
export const fetchIeltsReadingTopicById = async (id: string): Promise<IeltsReadingPractice> => {
    const backendUrl = getBackendUrl();
    const fullUrl = `${backendUrl}/api/ielts-reading/topics/${id}`;

    try {
        const response = await callBackend(fullUrl);
        return response.data;
    } catch (error) {
        console.error(`Error fetching topic ${id}:`, error);
        throw error;
    }
};

/**
 * Save and analyze IELTS reading practice results
 */
export const saveIeltsReadingAssessment = async (data: {
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
                'Content-Type': 'application/json'
            }
        });
        return response;
    } catch (error) {
        console.error('Error saving reading assessment:', error);
        throw error;
    }
};

/**
 * Fetch student's personal speaking history
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
