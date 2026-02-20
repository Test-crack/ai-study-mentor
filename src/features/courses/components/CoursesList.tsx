import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/shared/components/ui/card';
import { Badge } from '@/shared/components/ui/badge';
import { Button } from '@/shared/components/ui/button';
import { Clock, Star, BookOpen, TrendingUp } from 'lucide-react';
import { DifficultyType, CoursesFilters as FiltersType } from '../types';
import { useCourses } from '../hooks/useCourses';
import { CoursesFilters } from './CoursesFilters';
import { CoursesPagination } from './CoursesPagination';
import { CoursesGridSkeleton } from './CourseCardSkeleton';

export function CoursesList() {
  const navigate = useNavigate();
  const [filters, setFilters] = useState<FiltersType>({
    page: 1,
    limit: 12,
    sortBy: 'created_at',
    sortOrder: 'desc',
  });

  const { courses, loading, error, pagination, refetch } = useCourses(filters);

  const handleFiltersChange = (newFilters: FiltersType) => {
    setFilters(newFilters);
    refetch(newFilters);
  };

  const handlePageChange = (page: number) => {
    const newFilters = { ...filters, page };
    setFilters(newFilters);
    refetch(newFilters);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleCourseClick = (slug: string | undefined, courseId: string) => {
    // Use slug for URL (better UX), pass courseId via state for API call
    const urlSlug = slug || courseId;
    navigate(`/courses/${urlSlug}`, { state: { courseId } });
  };

  const getDifficultyColor = (difficulty: DifficultyType | null) => {
    switch (difficulty) {
      case DifficultyType.BEGINNER:
        return 'bg-green-50 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800';
      case DifficultyType.INTERMEDIATE:
        return 'bg-yellow-50 text-yellow-700 border-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-400 dark:border-yellow-800';
      case DifficultyType.ADVANCED:
        return 'bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-900/30 dark:text-orange-400 dark:border-orange-800';
      default:
        return 'bg-gray-50 text-gray-700 border-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700';
    }
  };

  const formatDuration = (minutes: number | null) => {
    if (!minutes) return 'Self-paced';
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours === 0) return `${mins}m`;
    return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
  };

  const formatPrice = (price: number | null) => {
    if (!price || price === 0) return 'Free';
    return `₹${price.toLocaleString('en-IN')}`;
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <CoursesFilters filters={filters} onFiltersChange={handleFiltersChange} />
        <CoursesGridSkeleton count={filters.limit || 12} />
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <CoursesFilters filters={filters} onFiltersChange={handleFiltersChange} />
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center space-y-4 max-w-md">
            <div className="text-red-600 dark:text-red-400 text-lg font-semibold">Error Loading Courses</div>
            <p className="text-gray-600 dark:text-gray-400">{error}</p>
            <Button onClick={() => refetch(filters)} variant="outline">
              Try Again
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (!courses || courses.length === 0) {
    return (
      <div className="space-y-6">
        <CoursesFilters filters={filters} onFiltersChange={handleFiltersChange} />
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center space-y-4 max-w-md">
            <BookOpen className="h-16 w-16 text-gray-400 dark:text-gray-600 mx-auto" />
            <div className="text-gray-900 dark:text-white text-lg font-semibold">No Courses Found</div>
            <p className="text-gray-600 dark:text-gray-400">
              Try adjusting your filters or check back soon for new courses!
            </p>
            <Button
              onClick={() => handleFiltersChange({ page: 1, limit: filters.limit })}
              variant="outline"
            >
              Clear Filters
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Filters */}
      <CoursesFilters filters={filters} onFiltersChange={handleFiltersChange} />

      {/* Results Summary */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">All Courses</h2>
          {pagination && (
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              Showing {(pagination.page - 1) * pagination.limit + 1} -{' '}
              {Math.min(pagination.page * pagination.limit, pagination.total)} of{' '}
              {pagination.total} courses
            </p>
          )}
        </div>
      </div>

      {/* Courses Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {courses.map((course) => (
          <Card
            key={course.id}
            className="group cursor-pointer border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 hover:shadow-xl dark:hover:shadow-indigo-900/10 transition-all duration-200 overflow-hidden flex flex-col"
            onClick={() => handleCourseClick(course.slug, course.id)}
          >
            {/* Course Image Placeholder */}
            <div className="h-40 bg-gradient-to-br from-purple-500 to-indigo-600 relative overflow-hidden">
               {course.thumbnail ? (
                  <img 
                    src={course.thumbnail} 
                    alt={course.title}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
               ) : (
                  <div className="absolute inset-0 bg-gradient-to-br from-purple-500 to-indigo-600" />
               )}
              <div className="absolute inset-0 bg-black/10 group-hover:bg-black/0 transition-colors" />
              {course.difficulty && (
                <Badge
                  className={`absolute top-3 right-3 ${getDifficultyColor(
                    course.difficulty
                  )} border backdrop-blur-sm`}
                >
                  {course.difficulty}
                </Badge>
              )}
              {course._count && course._count.CourseModule > 0 && (
                <div className="absolute bottom-3 left-3 bg-black/60 backdrop-blur-sm text-white px-2 py-1 rounded text-xs font-medium">
                  {course._count.CourseModule} modules
                </div>
              )}
            </div>

            <CardContent className="p-4 space-y-3 flex-1 flex flex-col">
              {/* Domain Badge */}
              {course.Domain && (
                <Badge variant="outline" className="text-xs font-normal w-fit dark:border-gray-700 dark:text-gray-300">
                  {course.Domain.name}
                </Badge>
              )}

              {/* Title */}
              <h3 className="font-bold text-gray-900 dark:text-gray-100 line-clamp-2 group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors min-h-[3rem]">
                {course.title}
              </h3>

              {/* Description */}
              <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2 min-h-[2.5rem] flex-1">
                {course.description || 'Enhance your skills with this comprehensive course'}
              </p>

              {/* Meta Info */}
              <div className="flex items-center gap-3 text-xs text-gray-500 dark:text-gray-400 pt-2">
                <div className="flex items-center gap-1">
                  <Clock className="h-3.5 w-3.5" />
                  <span>{formatDuration(course.duration_minutes)}</span>
                </div>
                <div className="flex items-center gap-1">
                  <TrendingUp className="h-3.5 w-3.5" />
                  <span>
                    {course.difficulty === DifficultyType.BEGINNER
                      ? 'Beginner'
                      : course.difficulty === DifficultyType.INTERMEDIATE
                      ? 'Intermediate'
                      : course.difficulty === DifficultyType.ADVANCED
                      ? 'Advanced'
                      : 'All Levels'}
                  </span>
                </div>
              </div>

              {/* Rating (Mock) */}
              <div className="flex items-center gap-2 pt-1">
                <div className="flex items-center gap-1">
                  <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                  <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">4.7</span>
                </div>
                <span className="text-xs text-gray-500 dark:text-gray-400">(1.2k)</span>
              </div>

              {/* Price & CTA */}
              <div className="flex items-center justify-between pt-3 border-t border-gray-100 dark:border-gray-800 mt-auto">
                <div className="text-lg font-bold text-gray-900 dark:text-gray-100">
                  {formatPrice(course.price)}
                </div>
                <Button
                  size="sm"
                  className="bg-indigo-700 hover:bg-purple-700 text-white dark:bg-indigo-600 dark:hover:bg-purple-600"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleCourseClick(course.slug, course.id);
                  }}
                >
                  View Course
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Pagination */}
      {pagination && pagination.totalPages > 1 && (
        <CoursesPagination
          currentPage={pagination.page}
          totalPages={pagination.totalPages}
          onPageChange={handlePageChange}
        />
      )}
    </div>
  );
}