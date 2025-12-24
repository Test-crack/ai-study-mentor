import { useState, useEffect, useRef } from 'react';
import { Course, CoursesFilters } from '../types';
import { coursesService } from '../services/coursesService';

interface UseCoursesReturn {
  courses: Course[];
  loading: boolean;
  error: string | null;
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasMore: boolean;
  } | null;
  refetch: (newFilters?: CoursesFilters) => Promise<void>;
}

export function useCourses(initialFilters?: CoursesFilters): UseCoursesReturn {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState<UseCoursesReturn['pagination']>(null);
  const filtersRef = useRef<CoursesFilters>(initialFilters || {});
  const hasFetchedRef = useRef(false);

  const fetchCourses = async (newFilters?: CoursesFilters) => {
    try {
      setLoading(true);
      setError(null);
      const currentFilters = newFilters || filtersRef.current;
      const response = await coursesService.getCourses(currentFilters);
      setCourses(response.data);
      setPagination(response.pagination);
      if (newFilters) {
        filtersRef.current = newFilters;
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load courses');
      console.error('Error fetching courses:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!hasFetchedRef.current) {
      hasFetchedRef.current = true;
      fetchCourses();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return { courses, loading, error, pagination, refetch: fetchCourses };
}
