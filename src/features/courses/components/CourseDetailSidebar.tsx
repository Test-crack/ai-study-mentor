import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/shared/components/ui/card';
import { Button } from '@/shared/components/ui/button';
import { Badge } from '@/shared/components/ui/badge';
import { Progress } from '@/shared/components/ui/progress';
import {
  Clock,
  BookOpen,
  Award,
  PlayCircle,
  CheckCircle,
  Star,
  Users,
  Infinity,
  Play,
  ArrowRight,
} from 'lucide-react';
import { CourseDetail, ProgressStatus } from '../types';
import { EnrollmentModal } from './EnrollmentModal';

interface CourseDetailSidebarProps {
  course: CourseDetail;
  onEnrollmentSuccess?: () => void;
}

export function CourseDetailSidebar({
  course,
  onEnrollmentSuccess,
}: CourseDetailSidebarProps) {
  const [showEnrollModal, setShowEnrollModal] = useState(false);
  const navigate = useNavigate();

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

  const handleEnrollmentSuccess = () => {
    if (onEnrollmentSuccess) {
      onEnrollmentSuccess();
    } else {
      window.location.reload();
    }
  };

  const handleStartCourse = () => {
    // Navigate to course learning page (to be created)
    navigate(`/learn/${course.slug}`);
  };

  const totalConcepts = course.modules.reduce(
    (acc, module) => acc + (module._count?.ModuleConcept || 0),
    0
  );

  // Determine button state based on enrollment
  const getActionButton = () => {
    if (!course.isEnrolled) {
      return (
        <Button
          className="w-full bg-purple-600 hover:bg-purple-700 text-white py-6 text-lg font-semibold"
          onClick={() => setShowEnrollModal(true)}
        >
          {course.price && course.price > 0 ? 'Enroll Now' : 'Enroll for Free'}
        </Button>
      );
    }

    const status = course.enrollment?.status;

    if (status === ProgressStatus.NOT_STARTED) {
      return (
        <Button
          className="w-full bg-green-600 hover:bg-green-700 text-white py-6 text-lg font-semibold"
          onClick={handleStartCourse}
        >
          <Play className="h-5 w-5 mr-2" />
          Start Learning
        </Button>
      );
    }

    if (status === ProgressStatus.IN_PROGRESS) {
      return (
        <Button
          className="w-full bg-blue-600 hover:bg-blue-700 text-white py-6 text-lg font-semibold"
          onClick={handleStartCourse}
        >
          <ArrowRight className="h-5 w-5 mr-2" />
          Continue Learning
        </Button>
      );
    }

    if (status === ProgressStatus.COMPLETED) {
      return (
        <Button
          className="w-full bg-gray-600 hover:bg-gray-700 text-white py-6 text-lg font-semibold"
          onClick={handleStartCourse}
        >
          <CheckCircle className="h-5 w-5 mr-2" />
          Review Course
        </Button>
      );
    }

    // Fallback for enrolled but unknown status
    return (
      <Button
        className="w-full bg-blue-600 hover:bg-blue-700 text-white py-6 text-lg font-semibold"
        onClick={handleStartCourse}
      >
        <ArrowRight className="h-5 w-5 mr-2" />
        Go to Course
      </Button>
    );
  };

  return (
    <>
      <div className="lg:sticky lg:top-24">
        <Card className="overflow-hidden shadow-lg">
          {/* Course Preview Image */}
          <div className="h-48 bg-gradient-to-br from-purple-600 to-indigo-700 relative">
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-16 h-16 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center cursor-pointer hover:bg-white/30 transition-colors">
                <PlayCircle className="h-10 w-10 text-white" />
              </div>
            </div>
            {course.isEnrolled && (
              <div className="absolute top-3 right-3">
                <Badge className="bg-green-500 text-white border-0">
                  Enrolled
                </Badge>
              </div>
            )}
            <div className="absolute bottom-3 left-3">
              <Badge className="bg-black/50 text-white border-0">
                Preview available
              </Badge>
            </div>
          </div>

          <CardContent className="p-6 space-y-6">
            {/* Progress (if enrolled) */}
            {course.isEnrolled && course.enrollment && (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Your Progress</span>
                  <span className="font-semibold text-purple-600">
                    {course.enrollment.progress_percent}%
                  </span>
                </div>
                <Progress
                  value={course.enrollment.progress_percent}
                  className="h-2"
                />
              </div>
            )}

            {/* Price (only if not enrolled) */}
            {!course.isEnrolled && (
              <div className="text-center">
                <div className="text-3xl font-bold text-gray-900">
                  {formatPrice(course.price)}
                </div>
                {course.price && course.price > 0 && (
                  <p className="text-sm text-gray-500 mt-1">One-time payment</p>
                )}
              </div>
            )}

            {/* Action Button */}
            {getActionButton()}

            {/* Guarantee (only if not enrolled) */}
            {!course.isEnrolled && (
              <p className="text-center text-xs text-gray-500">
                30-Day Money-Back Guarantee
              </p>
            )}

            {/* Course Includes */}
            <div className="space-y-4">
              <h4 className="font-semibold text-gray-900">
                {course.isEnrolled ? 'Course includes:' : 'This course includes:'}
              </h4>
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
                <span className="font-semibold text-gray-900">
                  4.7 (1.2k reviews)
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Enrollment Modal */}
      <EnrollmentModal
        course={course}
        isOpen={showEnrollModal}
        onClose={() => setShowEnrollModal(false)}
        onEnrollmentSuccess={handleEnrollmentSuccess}
      />
    </>
  );
}
