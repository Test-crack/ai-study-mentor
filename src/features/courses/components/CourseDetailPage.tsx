import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { CoursesNavbar } from './CoursesNavbar';
import { CourseDetailContent } from './CourseDetailContent';
import { CourseDetailSidebar } from './CourseDetailSidebar';
import { useCourseDetail } from '../hooks/useCourseDetail';
import { Button } from '@/shared/components/ui/button';
import { ArrowLeft, AlertCircle } from 'lucide-react';

const CourseDetailPage = () => {
  const { slug } = useParams<{ slug: string }>();
  const location = useLocation();
  const navigate = useNavigate();

  // Get courseId from navigation state, or use slug as fallback (for direct URL access)
  const courseId = (location.state as { courseId?: string })?.courseId || slug || '';

  const { course, loading, error } = useCourseDetail(courseId);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <CoursesNavbar />
        <div className="flex items-center justify-center min-h-[calc(100vh-64px)]">
          <div className="text-center space-y-4">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
            <p className="text-gray-600">Loading course details...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error || !course) {
    return (
      <div className="min-h-screen bg-gray-50">
        <CoursesNavbar />
        <div className="flex items-center justify-center min-h-[calc(100vh-64px)]">
          <div className="text-center space-y-4 max-w-md px-4">
            <AlertCircle className="h-16 w-16 text-red-500 mx-auto" />
            <h2 className="text-xl font-semibold text-gray-900">Course Not Found</h2>
            <p className="text-gray-600">
              {error || "The course you're looking for doesn't exist or has been removed."}
            </p>
            <Button onClick={() => navigate('/courses')} variant="outline">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Courses
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <CoursesNavbar />

      {/* Hero Section */}
      <div className="bg-gradient-to-r from-gray-900 to-gray-800 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-12">
          <Button
            variant="ghost"
            onClick={() => navigate('/courses')}
            className="text-gray-300 hover:text-white hover:bg-white/10 mb-4 -ml-2"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            All Courses
          </Button>
          <div className="lg:hidden">
            <h1 className="text-2xl sm:text-3xl font-bold mb-3">{course.title}</h1>
            <p className="text-gray-300 text-sm sm:text-base line-clamp-3">
              {course.description}
            </p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Left Content - 70% */}
          <div className="w-full lg:w-[70%]">
            <CourseDetailContent course={course} />
          </div>

          {/* Right Sidebar - 30% */}
          <div className="w-full lg:w-[30%]">
            <CourseDetailSidebar course={course} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default CourseDetailPage;
