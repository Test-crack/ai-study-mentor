import {
  CoursesResponse,
  CoursesFilters,
  CourseDetailResponse,
  ModuleContentResponse,
} from '../types';
import { callBackend } from '@/features/auth/services/authClient';
import { getBackendUrl } from '@/shared/utils';

class CoursesService {
  private baseUrl: string;

  constructor() {
    this.baseUrl = getBackendUrl();
  }

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

      const response = await callBackend(url, {
        method: 'GET',
      });

      return response;
    } catch (error) {
      console.error('Error fetching courses:', error);
      throw new Error('Failed to fetch courses');
    }
  }

  async getCourseById(
    courseId: string,
    userId?: string
  ): Promise<CourseDetailResponse> {
    try {
      const params = new URLSearchParams();
      if (userId) params.append('userId', userId);

      const queryString = params.toString();
      const url = `${this.baseUrl}/api/courses/${courseId}${queryString ? `?${queryString}` : ''}`;

      const response = await callBackend(url, {
        method: 'GET',
      });

      return response;
    } catch (error) {
      console.error('Error fetching course:', error);
      throw new Error('Failed to fetch course details');
    }
  }

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
