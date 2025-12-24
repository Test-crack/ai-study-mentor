import { CoursesResponse, CoursesFilters, Course } from '../types';
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

  async getCourseById(courseId: string): Promise<Course> {
    try {
      const response = await callBackend(`${this.baseUrl}/api/courses/${courseId}`, {
        method: 'GET',
      });

      return response.course;
    } catch (error) {
      console.error('Error fetching course:', error);
      throw new Error('Failed to fetch course details');
    }
  }

  async enrollInCourse(courseId: string): Promise<void> {
    try {
      await callBackend(`${this.baseUrl}/api/courses/${courseId}/enroll`, {
        method: 'POST',
      });
    } catch (error) {
      console.error('Error enrolling in course:', error);
      throw new Error('Failed to enroll in course');
    }
  }
}

export const coursesService = new CoursesService();
