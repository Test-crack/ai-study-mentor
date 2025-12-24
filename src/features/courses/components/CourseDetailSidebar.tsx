import { useState } from 'react';
import { Card, CardContent } from '@/shared/components/ui/card';
import { Button } from '@/shared/components/ui/button';
import { Badge } from '@/shared/components/ui/badge';
import {
  Clock,
  BookOpen,
  Award,
  PlayCircle,
  CheckCircle,
  Star,
  Users,
  Infinity,
} from 'lucide-react';
import { CourseDetail, DifficultyType } from '../types';
import { coursesService } from '../services/coursesService';

interface CourseDetailSidebarProps {
  course: CourseDetail;
}

export function CourseDetailSidebar({ course }: CourseDetailSidebarProps) {
  const [enrolling, setEnrolling] = useState(false);

  const formatPrice = (price: number | null) => {
    if (!price || price === 0) return 'Free';
    return `₹${price.toLocaleString('en-IN')}`;
  };

  const formatDuration = (minutes: number | null) => {
    if (!minutes) return 'Self-paced';
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours === 0) return `${mins} min`;
    return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
  };

  const handleEnroll = async () => {
    try {
      setEnrolling(true);
      await coursesService.enrollInCourse(course.id);
      // TODO: Show success message and redirect to course content
      alert('Successfully enrolled!');
    } catch (error) {
      console.error('Enrollment failed:', error);
      alert('Failed to enroll. Please try again.');
    } finally {
      setEnrolling(false);
    }
  };

  const totalConcepts = course.modules.reduce(
    (acc, module) => acc + (module._count?.ModuleConcept || 0),
    0
  );

  return (
    <div className="lg:sticky lg:top-24">
      <Card className="overflow-hidden shadow-lg">
        {/* Course Preview Image */}
        <div className="h-48 bg-gradient-to-br from-purple-600 to-indigo-700 relative">
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-16 h-16 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center cursor-pointer hover:bg-white/30 transition-colors">
              <PlayCircle className="h-10 w-10 text-white" />
            </div>
          </div>
          <div className="absolute bottom-3 left-3">
            <Badge className="bg-black/50 text-white border-0">
              Preview available
            </Badge>
          </div>
        </div>

        <CardContent className="p-6 space-y-6">
          {/* Price */}
          <div className="text-center">
            <div className="text-3xl font-bold text-gray-900">
              {formatPrice(course.price)}
            </div>
            {course.price && course.price > 0 && (
              <p className="text-sm text-gray-500 mt-1">One-time payment</p>
            )}
          </div>

          {/* Enroll Button */}
          <Button
            className="w-full bg-purple-600 hover:bg-purple-700 text-white py-6 text-lg font-semibold"
            onClick={handleEnroll}
            disabled={enrolling}
          >
            {enrolling ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                Enrolling...
              </>
            ) : course.price && course.price > 0 ? (
              'Enroll Now'
            ) : (
              'Enroll for Free'
            )}
          </Button>

          {/* Guarantee */}
          <p className="text-center text-xs text-gray-500">
            30-Day Money-Back Guarantee
          </p>

          {/* Course Includes */}
          <div className="space-y-4">
            <h4 className="font-semibold text-gray-900">This course includes:</h4>
            <ul className="space-y-3">
              <li className="flex items-center gap-3 text-sm text-gray-700">
                <Clock className="h-4 w-4 text-gray-500" />
                <span>{formatDuration(course.duration_minutes)} of content</span>
              </li>
              <li className="flex items-center gap-3 text-sm text-gray-700">
                <BookOpen className="h-4 w-4 text-gray-500" />
                <span>{course.modules.length} modules</span>
              </li>
              <li className="flex items-center gap-3 text-sm text-gray-700">
                <CheckCircle className="h-4 w-4 text-gray-500" />
                <span>{totalConcepts} learning concepts</span>
              </li>
              <li className="flex items-center gap-3 text-sm text-gray-700">
                <Infinity className="h-4 w-4 text-gray-500" />
                <span>Full lifetime access</span>
              </li>
              <li className="flex items-center gap-3 text-sm text-gray-700">
                <Award className="h-4 w-4 text-gray-500" />
                <span>Certificate of completion</span>
              </li>
            </ul>
          </div>

          {/* Stats */}
          <div className="pt-4 border-t space-y-3">
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2 text-gray-600">
                <Users className="h-4 w-4" />
                <span>Students enrolled</span>
              </div>
              <span className="font-semibold text-gray-900">
                {course._count?.UserCourseEnrollment || 0}
              </span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2 text-gray-600">
                <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                <span>Rating</span>
              </div>
              <span className="font-semibold text-gray-900">4.7 (1.2k reviews)</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
