import { useQuery } from '@tanstack/react-query';
import { coursesService } from '../services/coursesService';
import { InstructorCoursesFilters } from '../types';

export const useInstructorCourses = (filters: InstructorCoursesFilters = {}) => {
    return useQuery({
        queryKey: ['instructor-courses', filters],
        queryFn: () => coursesService.getInstructorCourses(filters),
        placeholderData: (previousData) => previousData,
    });
};
