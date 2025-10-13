// Reading Assessment API utilities

const getBackendUrl = () => {
  // In development, use relative URLs to leverage Vite's proxy
  if (import.meta.env.DEV) {
    return ''; // Use relative URLs, proxy will handle the routing
  }
  return import.meta.env.VITE_BACKEND_URL || 'http://localhost:4000';
};

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
}

export interface AssessmentResult {
  metrics: {
    wpm: number;
    accuracy: number;
    retention: number;
    speedLearningScore: number;
  };
  feedback: string;
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

export interface ModulesResponse {
  modules: ReadingModule[];
  total: number;
}

/**
 * Fetch available reading modules
 */
export const fetchReadingModules = async (): Promise<ModulesResponse> => {
  const backendUrl = getBackendUrl();
  
  try {
    const response = await fetch(`${backendUrl}/api/reading/modules`);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch modules: ${response.status} ${response.statusText}`);
    }
    
    return response.json();
  } catch (error) {
    if (error instanceof TypeError && error.message.includes('Failed to fetch')) {
      throw new Error(`CORS_ERROR: Cannot connect to backend server at ${backendUrl}. This might be due to CORS policy or network issues.`);
    }
    throw error;
  }
};

/**
 * Fetch a reading passage for assessment
 */
export const fetchReadingPassage = async (
  moduleId: string, 
  difficulty: string
): Promise<PassageData> => {
  const backendUrl = getBackendUrl();
  
  try {
    const response = await fetch(`${backendUrl}/api/reading/passage/random`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        module: moduleId,
        difficulty
      })
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `Failed to fetch passage: ${response.status} ${response.statusText}`);
    }
    
    return response.json();
  } catch (error) {
    if (error instanceof TypeError && error.message.includes('Failed to fetch')) {
      throw new Error(`CORS_ERROR: Cannot connect to backend server at ${backendUrl}. This might be due to CORS policy or network issues.`);
    }
    throw error;
  }
};

/**
 * Submit assessment results
 */
export const submitAssessmentResults = async (submission: AssessmentSubmission): Promise<AssessmentResult> => {
  const backendUrl = getBackendUrl();
  
  try {
    const response = await fetch(`${backendUrl}/api/reading/submit`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(submission)
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `Failed to submit assessment: ${response.status} ${response.statusText}`);
    }
    
    return response.json();
  } catch (error) {
    if (error instanceof TypeError && error.message.includes('Failed to fetch')) {
      throw new Error(`CORS_ERROR: Cannot connect to backend server at ${backendUrl}. This might be due to CORS policy or network issues.`);
    }
    throw error;
  }
};

