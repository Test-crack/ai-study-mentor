import { Card, CardContent } from '@/shared/components/ui/card';

export function CourseCardSkeleton() {
  return (
    <Card className="border border-gray-200 overflow-hidden animate-pulse">
      {/* Image Skeleton */}
      <div className="h-40 bg-gray-200" />

      <CardContent className="p-4 space-y-3">
        {/* Badge Skeleton */}
        <div className="h-5 w-20 bg-gray-200 rounded" />

        {/* Title Skeleton */}
        <div className="space-y-2">
          <div className="h-5 bg-gray-200 rounded w-full" />
          <div className="h-5 bg-gray-200 rounded w-3/4" />
        </div>

        {/* Description Skeleton */}
        <div className="space-y-2">
          <div className="h-4 bg-gray-200 rounded w-full" />
          <div className="h-4 bg-gray-200 rounded w-5/6" />
        </div>

        {/* Meta Info Skeleton */}
        <div className="flex items-center gap-3 pt-2">
          <div className="h-4 w-16 bg-gray-200 rounded" />
          <div className="h-4 w-20 bg-gray-200 rounded" />
        </div>

        {/* Rating Skeleton */}
        <div className="flex items-center gap-2 pt-1">
          <div className="h-4 w-12 bg-gray-200 rounded" />
          <div className="h-4 w-16 bg-gray-200 rounded" />
        </div>

        {/* Price & Button Skeleton */}
        <div className="flex items-center justify-between pt-3 border-t">
          <div className="h-6 w-16 bg-gray-200 rounded" />
          <div className="h-9 w-24 bg-gray-200 rounded" />
        </div>
      </CardContent>
    </Card>
  );
}

export function CoursesGridSkeleton({ count = 12 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {Array.from({ length: count }).map((_, index) => (
        <CourseCardSkeleton key={index} />
      ))}
    </div>
  );
}
