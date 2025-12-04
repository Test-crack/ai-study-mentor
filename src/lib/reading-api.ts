// Reading Assessment API utilities

import { getBackendUrl } from './api-utils';
import { callBackend } from './auth';

export interface ReadingModule {
  id: string;
  name: string;
  description: string;
  difficulties: string[];
}

export interface Question {
  id: string;
  stem: string;
  options: string[];
}

export interface PassageData {
  id: string;
  title: string;
  category: string;
  difficulty: string;
  text: string;
  wordCount: number;
  idealWPM: number;
  estimatedReadingTime: number;
  questions: Question[];
}

export interface SubmissionAnswer {
  questionId: string;
  selectedOption: string;
}

export interface AssessmentSubmission {
  passageId: string;
  readingTimeSeconds: number;
  answers: SubmissionAnswer[];
  focusData?: {
    focusTime: number;
    totalSessionTime: number;
    focusRatio: number;
    tabSwitches: number;
  };
}

export interface AssessmentResult {
  metrics: {
    weightedWPM: number;
    accuracy: number;
    retention: number;
    speedLearningScore: number;
  };
  baseMetrics: {
    weightedWPM: number;
    accuracy: number;
    retention: number;
    speedLearningScore: number;
  };
  feedback: string;
  integrityFeedback: string;
  integrityFlags: {
    lowFocusRatio: boolean;
    excessiveTabSwitches: boolean;
    suspiciousBehavior: boolean;
    integrityScore: number;
  };
  focusData: {
    focusRatio: number;
    tabSwitches: number;
    focusTime: number;
    totalSessionTime: number;
  };
  answerReview: {
    questionId: string;
    selectedOption: string;
    correctAnswer: string;
    isCorrect: boolean;
  }[];
  passageInfo: {
    id: string;
    title: string;
    difficulty: string;
  };
}

export interface ReadingTimeError {
  error: string;
  flag: "too_fast";
  suggestedMinTime: number;
  actualTime: number;
}

export interface ModulesResponse {
  modules: ReadingModule[];
  total: number;
}

/**
 * Fetch available reading modules
 * @param authenticated - If true, uses JWT authentication
 */
export const fetchReadingModules = async (authenticated = false): Promise<ModulesResponse> => {
  const backendUrl = getBackendUrl();
  const fullUrl = `${backendUrl}/api/reading/modules`;
  
  console.log('Fetching modules from:', fullUrl);
  
  try {
    if (authenticated) {
      return await callBackend(fullUrl);
    }
    
    const response = await fetch(fullUrl);
    
    if (!response.ok) {
      const errorText = await response.text().catch(() => 'Unknown error');
      throw new Error(`Failed to fetch modules: ${response.status} ${response.statusText}. ${errorText}`);
    }
    
    return response.json();
  } catch (error) {
    if (error instanceof TypeError && error.message.includes('Failed to fetch')) {
      const errorMessage = `CORS_ERROR: Cannot connect to backend server at ${backendUrl}. 
      
Possible solutions:
1. Ensure the backend server is running
2. Check if VITE_BACKEND_URL is set correctly in your .env file
3. Verify CORS is configured on the backend
4. Check if the backend URL is accessible

Current backend URL: ${backendUrl}
Full request URL: ${fullUrl}`;
      throw new Error(errorMessage);
    }
    throw error;
  }
};

/**
 * Fetch a reading passage for assessment
 * @param authenticated - If true, uses JWT authentication
 */
export const fetchReadingPassage = async (
  moduleId: string, 
  difficulty: string,
  authenticated = false
): Promise<PassageData> => {
  const backendUrl = getBackendUrl();
  const fullUrl = `${backendUrl}/api/reading/passage/random`;
  
  console.log('Fetching passage from:', fullUrl, { moduleId, difficulty });
  
  try {
    if (authenticated) {
      return await callBackend(fullUrl, {
        method: 'POST',
        body: JSON.stringify({ module: moduleId, difficulty })
      });
    }
    
    const response = await fetch(fullUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ module: moduleId, difficulty })
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `Failed to fetch passage: ${response.status} ${response.statusText}`);
    }
    
    return response.json();
  } catch (error) {
    if (error instanceof TypeError && error.message.includes('Failed to fetch')) {
      const errorMessage = `CORS_ERROR: Cannot connect to backend server at ${backendUrl}. 
      
Possible solutions:
1. Ensure the backend server is running
2. Check if VITE_BACKEND_URL is set correctly in your .env file
3. Verify CORS is configured on the backend
4. Check if the backend URL is accessible

Current backend URL: ${backendUrl}
Full request URL: ${fullUrl}`;
      throw new Error(errorMessage);
    }
    throw error;
  }
};

/**
 * Submit assessment results
 * @param authenticated - If true, uses JWT authentication
 */
export const submitAssessmentResults = async (
  submission: AssessmentSubmission,
  authenticated = false
): Promise<AssessmentResult> => {
  const backendUrl = getBackendUrl();
  const fullUrl = `${backendUrl}/api/reading/submit`;
  
  console.log('Submitting assessment to:', fullUrl);
  
  try {
    if (authenticated) {
      return await callBackend(fullUrl, {
        method: 'POST',
        body: JSON.stringify(submission)
      });
    }
    
    const response = await fetch(fullUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(submission)
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      
      // Handle special reading time error
      if (errorData.flag === "too_fast") {
        const readingTimeError: ReadingTimeError = {
          error: errorData.error,
          flag: errorData.flag,
          suggestedMinTime: errorData.suggestedMinTime,
          actualTime: errorData.actualTime
        };
        throw readingTimeError;
      }
      
      throw new Error(errorData.error || `Failed to submit assessment: ${response.status} ${response.statusText}`);
    }
    
    return response.json();
  } catch (error) {
    if (error instanceof TypeError && error.message.includes('Failed to fetch')) {
      const errorMessage = `CORS_ERROR: Cannot connect to backend server at ${backendUrl}. 
      
Possible solutions:
1. Ensure the backend server is running
2. Check if VITE_BACKEND_URL is set correctly in your .env file
3. Verify CORS is configured on the backend
4. Check if the backend URL is accessible

Current backend URL: ${backendUrl}
Full request URL: ${fullUrl}`;
      throw new Error(errorMessage);
    }
    throw error;
  }
};

