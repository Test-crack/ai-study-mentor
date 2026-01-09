import {
  CoursesResponse,
  CoursesFilters,
  CourseDetailResponse,
  ModuleContentResponse,
} from '../types';
import { callBackend } from '@/features/auth/services/authClient';
import { getBackendUrl } from '@/shared/utils';
import { supabase } from '@/integrations/supabase/client';

/**
 * Make a public API call (no auth required)
 */
async function callPublicApi(url: string): Promise<any> {
  const res = await fetch(url, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || `API error: ${res.status}`);
  }

  return res.json();
}

/**
 * Make an API call with optional auth (uses token if available)
 */
async function callApiWithOptionalAuth(
  url: string,
  options: RequestInit = {}
): Promise<any> {
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const res = await fetch(url, {
    ...options,
    headers: {
      ...(options.headers || {}),
      ...headers,
    },
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || `API error: ${res.status}`);
  }

  return res.json();
}

// ============================================================================
// Types for Progress Tracking
// ============================================================================

export interface ContentAccessResponse {
  message: string;
  data: {
    status: 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED';
    last_accessed_at: string;
  };
}

export interface ContentCompleteResponse {
  message: string;
  data: {
    contentProgress: {
      status: 'COMPLETED';
      completed_at: string;
    };
    moduleProgress: {
      progress_percent: number;
      status: 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED';
      completed_items: number;
      total_required_items: number;
    };
    courseProgress: {
      progress_percent: number;
      status: 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED';
    };
    moduleAdvanced: boolean;
    nextModuleIndex: number | null;
  };
}

export interface ResumeDataResponse {
  data: {
    currentModuleIndex: number;
    courseStatus: 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED' | null;
    moduleProgress: number;
    moduleStatus: 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED' | null;
    // Furthest point in the course (by sequence)
    furthestContentItemId: string | null;
    furthestContentStatus: 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED' | null;
    // Last accessed (for "continue where you left off")
    lastAccessedContentItemId: string | null;
    lastAccessedContentStatus: 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED' | null;
    lastAccessedAt: string | null;
  };
}

// ============================================================================
// Courses Service
// ============================================================================

class CoursesService {
  private baseUrl: string;

  constructor() {
    this.baseUrl = getBackendUrl();
  }

  // ==========================================================================
  // Public APIs
  // ==========================================================================

  /**
   * Get list of courses (public - no auth required)
   */
  async getCourses(filters?: CoursesFilters): Promise<CoursesResponse> {
    try {
      const params = new URLSearchParams();

      if (filters?.page) params.append('page', filters.page.toString());
      if (filters?.limit) params.append('limit', filters.limit.toString());
      if (filters?.difficulty) params.append('difficulty', filters.difficulty);
      if (filters?.domain) params.append('domain', filters.domain);
      if (filters?.search) params.append('search', filters.search);
      if (filters?.sortBy) params.append('sortBy', filters.sortBy);
      if (filters?.sortOrder) params.append('sortOrder', filters.sortOrder);

      const queryString = params.toString();
      const url = `${this.baseUrl}/api/courses${queryString ? `?${queryString}` : ''}`;

      const response = await callPublicApi(url);
      return response;
    } catch (error) {
      console.error('Error fetching courses:', error);
      throw new Error('Failed to fetch courses');
    }
  }

  /**
   * Get course details (public with optional auth for enrollment status)
   */
  async getCourseById(
    courseId: string,
    userId?: string
  ): Promise<CourseDetailResponse> {
    try {
      const params = new URLSearchParams();
      if (userId) params.append('userId', userId);

      const queryString = params.toString();
      const url = `${this.baseUrl}/api/courses/${courseId}${queryString ? `?${queryString}` : ''}`;

      const response = await callApiWithOptionalAuth(url, { method: 'GET' });
      return response;
    } catch (error) {
      console.error('Error fetching course:', error);
      throw new Error('Failed to fetch course details');
    }
  }

  // ==========================================================================
  // Protected APIs - Require Authentication
  // ==========================================================================

  /**
   * Get module content (requires enrollment)
   */
  async getModuleContent(
    courseId: string,
    orderIndex: number
  ): Promise<ModuleContentResponse> {
    try {
      const url = `${this.baseUrl}/api/courses/${courseId}/module/${orderIndex}`;
      const response = await callBackend(url, {
        method: 'GET',
      });
      return response;
    } catch (error) {
      console.error('Error fetching module content:', error);
      throw new Error('Failed to fetch module content');
    }
  }

  /**
   * Enroll user in a course
   */
  async enrollInCourse(courseId: string): Promise<void> {
    try {
      await callBackend(`${this.baseUrl}/api/courses/enroll`, {
        method: 'POST',
        body: JSON.stringify({ courseId }),
      });
    } catch (error) {
      console.error('Error enrolling in course:', error);
      throw new Error('Failed to enroll in course');
    }
  }

  // ==========================================================================
  // Progress Tracking APIs
  // ==========================================================================

  /**
   * Track content access - marks content as IN_PROGRESS
   * Call this when user opens/views a content item
   */
  async trackContentAccess(
    courseId: string,
    moduleIndex: number,
    contentItemId: string
  ): Promise<ContentAccessResponse> {
    try {
      const url = `${this.baseUrl}/api/courses/${courseId}/modules/${moduleIndex}/content/${contentItemId}/access`;
      const response = await callBackend(url, {
        method: 'POST',
      });
      return response;
    } catch (error) {
      console.error('Error tracking content access:', error);
      throw new Error('Failed to track content access');
    }
  }

  /**
   * Mark content as complete
   * Call this when user clicks "Mark Complete" or submits MCQ
   */
  async markContentComplete(
    courseId: string,
    moduleIndex: number,
    contentItemId: string
  ): Promise<ContentCompleteResponse> {
    try {
      const url = `${this.baseUrl}/api/courses/${courseId}/modules/${moduleIndex}/content/${contentItemId}/complete`;
      const response = await callBackend(url, {
        method: 'POST',
      });
      return response;
    } catch (error) {
      console.error('Error marking content complete:', error);
      throw new Error('Failed to mark content as complete');
    }
  }

  /**
   * Get resume data for a course
   * Returns user's current position to continue learning
   */
  async getResumeData(courseId: string): Promise<ResumeDataResponse> {
    try {
      const url = `${this.baseUrl}/api/courses/${courseId}/resume`;
      const response = await callBackend(url, {
        method: 'GET',
      });
      return response;
    } catch (error) {
      console.error('Error fetching resume data:', error);
      throw new Error('Failed to fetch resume data');
    }
  }

  /**
   * Mark course as completed
   * Call this when user finishes all modules
   */
  async completeCourse(courseId: string): Promise<{ message: string; data: { completedAt: string } }> {
    try {
      const url = `${this.baseUrl}/api/courses/${courseId}/complete`;
      const response = await callBackend(url, {
        method: 'POST',
      });
      return response;
    } catch (error) {
      console.error('Error completing course:', error);
      throw new Error('Failed to complete course');
    }
  }
}

export const coursesService = new CoursesService();
