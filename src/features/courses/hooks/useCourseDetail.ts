import { useState, useEffect, useRef } from 'react';
import { CourseDetail } from '../types';
import { coursesService } from '../services/coursesService';

interface UseCourseDetailReturn {
  course: CourseDetail | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export function useCourseDetail(courseId: string): UseCourseDetailReturn {
  const [course, setCourse] = useState<CourseDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const hasFetchedRef = useRef(false);
  const currentIdRef = useRef(courseId);

  const fetchCourse = async () => {
    if (!courseId) {
      setError('Course ID is required');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const response = await coursesService.getCourseById(courseId);
      setCourse(response.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load course');
      console.error('Error fetching course:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Reset and fetch if courseId changes
    if (currentIdRef.current !== courseId) {
      currentIdRef.current = courseId;
      hasFetchedRef.current = false;
    }

    if (!hasFetchedRef.current && courseId) {
      hasFetchedRef.current = true;
      fetchCourse();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [courseId]);

  return { course, loading, error, refetch: fetchCourse };
}
