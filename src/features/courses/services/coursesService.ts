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

class CoursesService {
  private baseUrl: string;

  constructor() {
    this.baseUrl = getBackendUrl();
  }

  // Public API - no auth required
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

      // Use public API for course listing
      const response = await callPublicApi(url);
      return response;
    } catch (error) {
      console.error('Error fetching courses:', error);
      throw new Error('Failed to fetch courses');
    }
  }

  // Public API with optional auth - shows enrollment status if logged in
  async getCourseById(
    courseId: string,
    userId?: string
  ): Promise<CourseDetailResponse> {
    try {
      const params = new URLSearchParams();
      if (userId) params.append('userId', userId);

      const queryString = params.toString();
      const url = `${this.baseUrl}/api/courses/${courseId}${queryString ? `?${queryString}` : ''}`;

      // Use optional auth - will include enrollment info if logged in
      const response = await callApiWithOptionalAuth(url, { method: 'GET' });
      return response;
    } catch (error) {
      console.error('Error fetching course:', error);
      throw new Error('Failed to fetch course details');
    }
  }

  // Protected API - requires auth
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

  // Protected API - requires auth
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
}

export const coursesService = new CoursesService();
