import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { Button } from '@/shared/components/ui/button';
import { ArrowLeft, Menu, X } from 'lucide-react';
import { useCourseDetail } from '../../hooks/useCourseDetail';
import { coursesService } from '../../services/coursesService';
import { ModuleData, ContentItem } from '../../types';
import { LearningSidebar } from './LearningSidebar';
import { ModuleContent } from './ModuleContent';

const LearningPage = () => {
  const { slug } = useParams<{ slug: string }>();
  const location = useLocation();
  const navigate = useNavigate();

  // Get courseId from navigation state
  const locationState = location.state as {
    courseId?: string;
    resumeModuleIndex?: number;
  } | null;

  const courseId = locationState?.courseId || slug || '';
  const resumeModuleIndex = locationState?.resumeModuleIndex;

  const { course, loading: courseLoading, error: courseError } = useCourseDetail(courseId);

  // Module state
  const [currentModuleIndex, setCurrentModuleIndex] = useState<number | null>(null);
  const [moduleData, setModuleData] = useState<ModuleData | null>(null);
  const [contentItems, setContentItems] = useState<ContentItem[]>([]);
  const [moduleLoading, setModuleLoading] = useState(false);
  const [moduleError, setModuleError] = useState<string | null>(null);

  // UI state
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [completedModules, setCompletedModules] = useState<Set<number>>(new Set());

  // Refs to prevent duplicate fetches
  const fetchedModuleRef = useRef<number | null>(null);
  const initializedRef = useRef(false);

  // Initialize module index when course loads
  useEffect(() => {
    if (!course || initializedRef.current) return;
    initializedRef.current = true;

    // Priority: resumeModuleIndex > course.moduleIndex > 0
    let startIndex = 0;
    if (resumeModuleIndex !== undefined) {
      startIndex = resumeModuleIndex;
    } else if (course.moduleIndex !== undefined) {
      startIndex = course.moduleIndex;
    }

    // Ensure within bounds
    const validIndex = Math.min(Math.max(0, startIndex), course.modules.length - 1);
    setCurrentModuleIndex(validIndex);

    // Mark previous modules as completed
    if (validIndex > 0) {
      const completed = new Set<number>();
      for (let i = 0; i < validIndex; i++) {
        completed.add(i);
      }
      setCompletedModules(completed);
    }
  }, [course, resumeModuleIndex]);

  // Fetch module content when index changes
  useEffect(() => {
    if (!course || currentModuleIndex === null) return;
    if (fetchedModuleRef.current === currentModuleIndex) return;

    const fetchModule = async () => {
      setModuleLoading(true);
      setModuleError(null);
      fetchedModuleRef.current = currentModuleIndex;

      try {
        const response = await coursesService.getModuleContent(course.id, currentModuleIndex);
        setModuleData(response.data.module);
        setContentItems(response.data.contentItems);
      } catch (err) {
        setModuleError(err instanceof Error ? err.message : 'Failed to load module');
        console.error('Error fetching module:', err);
      } finally {
        setModuleLoading(false);
      }
    };

    fetchModule();
  }, [course, currentModuleIndex]);

  // Handlers
  const handleModuleSelect = (index: number) => {
    if (currentModuleIndex !== null && index !== currentModuleIndex) {
      fetchedModuleRef.current = null;
      setCurrentModuleIndex(index);
      setMobileSidebarOpen(false);
    }
  };

  const handleNextModule = () => {
    if (!course || currentModuleIndex === null) return;
    if (currentModuleIndex < course.modules.length - 1) {
      setCompletedModules((prev) => new Set(prev).add(currentModuleIndex));
      fetchedModuleRef.current = null;
      setCurrentModuleIndex(currentModuleIndex + 1);
    }
  };

  const handlePrevModule = () => {
    if (currentModuleIndex !== null && currentModuleIndex > 0) {
      fetchedModuleRef.current = null;
      setCurrentModuleIndex(currentModuleIndex - 1);
    }
  };

  // Loading state
  if (courseLoading || currentModuleIndex === null) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto" />
          <p className="text-gray-600">Loading course...</p>
        </div>
      </div>
    );
  }

  // Error state
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

  // Not enrolled
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
      {/* Header */}
      <header className="bg-white border-b h-14 flex items-center px-4 flex-shrink-0 shadow-sm">
        <div className="flex items-center gap-4 flex-1">
          <Button
            variant="ghost"
            size="sm"
            className="lg:hidden"
            onClick={() => setMobileSidebarOpen(!mobileSidebarOpen)}
          >
            {mobileSidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
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
        {/* Mobile Overlay */}
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
            progressPercent={course.progressPercent ?? 0}
            completedModules={completedModules}
          />
        </div>

        {/* Content */}
        <div className="flex-1 overflow-hidden">
          <ModuleContent
            module={moduleData}
            contentItems={contentItems}
            loading={moduleLoading}
            error={moduleError}
            onNextModule={handleNextModule}
            onPrevModule={handlePrevModule}
            hasNextModule={currentModuleIndex < course.modules.length - 1}
            hasPrevModule={currentModuleIndex > 0}
            courseId={course.id}
            moduleIndex={currentModuleIndex}
            onProgressUpdate={(courseProgress) => {
              console.log('Course progress:', courseProgress);
            }}
          />
        </div>
      </div>
    </div>
  );
};

export default LearningPage;
