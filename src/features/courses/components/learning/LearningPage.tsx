import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { Button } from '@/shared/components/ui/button';
import { ArrowLeft, Menu, X } from 'lucide-react';
import { useCourseDetail } from '../../hooks/useCourseDetail';
import { coursesService } from '../../services/coursesService';
import { ModuleData } from '../../types';
import { LearningSidebar } from './LearningSidebar';
import { ModuleContent } from './ModuleContent';

const LearningPage = () => {
  const { slug } = useParams<{ slug: string }>();
  const location = useLocation();
  const navigate = useNavigate();

  // Get courseId and resume data from navigation state
  const locationState = location.state as {
    courseId?: string;
    resumeModuleIndex?: number;
    resumeContentId?: string | null;
  } | null;

  const courseId = locationState?.courseId || slug || '';
  const resumeModuleIndex = locationState?.resumeModuleIndex;
  const resumeContentId = locationState?.resumeContentId;

  const {
    course,
    loading: courseLoading,
    error: courseError,
  } = useCourseDetail(courseId);

  // Initialize module index from resume data or course data
  const [currentModuleIndex, setCurrentModuleIndex] = useState<number | null>(null);
  const [moduleData, setModuleData] = useState<ModuleData | null>(null);
  const [moduleLoading, setModuleLoading] = useState(false);
  const [moduleError, setModuleError] = useState<string | null>(null);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [completedModules, setCompletedModules] = useState<Set<number>>(
    new Set()
  );

  const hasFetchedModule = useRef<number | null>(null);
  const hasInitialized = useRef(false);

  // Set initial module index from resume data or course data when loaded
  useEffect(() => {
    if (course && !hasInitialized.current) {
      hasInitialized.current = true;

      // Priority: resumeModuleIndex > course.moduleIndex > 0
      let startIndex = 0;

      if (resumeModuleIndex !== undefined) {
        startIndex = resumeModuleIndex;
      } else if (course.moduleIndex !== undefined) {
        startIndex = course.moduleIndex;
      }

      // Ensure the index is within bounds
      const validIndex = Math.min(
        Math.max(0, startIndex),
        course.modules.length - 1
      );
      setCurrentModuleIndex(validIndex);

      // Mark all modules before the current one as completed
      if (validIndex > 0) {
        const completed = new Set<number>();
        for (let i = 0; i < validIndex; i++) {
          completed.add(i);
        }
        setCompletedModules(completed);
      }
    }
  }, [course, resumeModuleIndex]);

  // Fetch module content when module index changes
  useEffect(() => {
    if (!course || currentModuleIndex === null || hasFetchedModule.current === currentModuleIndex) return;

    const fetchModuleContent = async () => {
      try {
        setModuleLoading(true);
        setModuleError(null);
        hasFetchedModule.current = currentModuleIndex;

        const response = await coursesService.getModuleContent(
          course.id,
          currentModuleIndex
        );
        setModuleData(response.data.module);
      } catch (err) {
        setModuleError(
          err instanceof Error ? err.message : 'Failed to load module'
        );
        console.error('Error fetching module:', err);
      } finally {
        setModuleLoading(false);
      }
    };

    fetchModuleContent();
  }, [course, currentModuleIndex]);

  const handleModuleSelect = (index: number) => {
    if (currentModuleIndex !== null && index !== currentModuleIndex) {
      hasFetchedModule.current = null;
      setCurrentModuleIndex(index);
      setMobileSidebarOpen(false);
    }
  };

  const handleNextModule = () => {
    if (course && currentModuleIndex !== null && currentModuleIndex < course.modules.length - 1) {
      // Mark current module as completed
      setCompletedModules((prev) => new Set(prev).add(currentModuleIndex));
      hasFetchedModule.current = null;
      setCurrentModuleIndex((prev) => (prev !== null ? prev + 1 : 0));
    }
  };

  const handlePrevModule = () => {
    if (currentModuleIndex !== null && currentModuleIndex > 0) {
      hasFetchedModule.current = null;
      setCurrentModuleIndex((prev) => (prev !== null ? prev - 1 : 0));
    }
  };

  if (courseLoading || currentModuleIndex === null) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
          <p className="text-gray-600">Loading course...</p>
        </div>
      </div>
    );
  }

  if (courseError || !course) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center space-y-4 max-w-md px-4">
          <p className="text-gray-900 font-semibold">Course not found</p>
          <p className="text-gray-600 text-sm">{courseError}</p>
          <Button onClick={() => navigate('/courses')} variant="outline">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Courses
          </Button>
        </div>
      </div>
    );
  }

  if (!course.isEnrolled) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center space-y-4 max-w-md px-4">
          <p className="text-gray-900 font-semibold">Access Denied</p>
          <p className="text-gray-600 text-sm">
            You need to enroll in this course to access the content.
          </p>
          <Button
            onClick={() => navigate(`/courses/${slug}`)}
            className="bg-purple-600 hover:bg-purple-700"
          >
            View Course Details
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-gray-100">
      {/* Top Header */}
      <header className="bg-white border-b h-14 flex items-center px-4 flex-shrink-0 shadow-sm">
        <div className="flex items-center gap-4 flex-1">
          {/* Mobile menu button */}
          <Button
            variant="ghost"
            size="sm"
            className="lg:hidden"
            onClick={() => setMobileSidebarOpen(!mobileSidebarOpen)}
          >
            {mobileSidebarOpen ? (
              <X className="h-5 w-5" />
            ) : (
              <Menu className="h-5 w-5" />
            )}
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate(`/courses/${slug}`, { state: { courseId: course.id } })}
            className="text-gray-600 hover:text-gray-900"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            <span className="hidden sm:inline">Exit Course</span>
          </Button>

          <div className="h-6 w-px bg-gray-200 hidden sm:block" />

          <h1 className="text-sm font-medium text-gray-900 truncate hidden sm:block">
            {course.title}
          </h1>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Mobile Sidebar Overlay */}
        {mobileSidebarOpen && (
          <div
            className="fixed inset-0 bg-black/50 z-40 lg:hidden"
            onClick={() => setMobileSidebarOpen(false)}
          />
        )}

        {/* Sidebar */}
        <div
          className={`
            fixed lg:relative inset-y-0 left-0 z-50 lg:z-auto
            transform lg:transform-none transition-transform duration-300
            ${mobileSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
            top-14 lg:top-0
          `}
        >
          <LearningSidebar
            courseTitle={course.title}
            modules={course.modules}
            currentModuleIndex={currentModuleIndex}
            onModuleSelect={handleModuleSelect}
            isCollapsed={sidebarCollapsed}
            onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
            progressPercent={course.enrollment?.progress_percent || 0}
            completedModules={completedModules}
          />
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-hidden">
          <ModuleContent
            module={moduleData}
            loading={moduleLoading}
            error={moduleError}
            onNextModule={handleNextModule}
            onPrevModule={handlePrevModule}
            hasNextModule={currentModuleIndex < course.modules.length - 1}
            hasPrevModule={currentModuleIndex > 0}
            courseId={course.id}
            moduleIndex={currentModuleIndex}
            resumeContentId={
              currentModuleIndex === resumeModuleIndex ? resumeContentId : null
            }
            onProgressUpdate={(courseProgress, moduleProgress) => {
              console.log('Progress updated:', { courseProgress, moduleProgress });
            }}
          />
        </div>
      </div>
    </div>
  );
};

export default LearningPage;
