import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { Button } from '@/shared/components/ui/button';
import { ArrowLeft, Menu, X, Target, Zap } from 'lucide-react';
import { useCourseDetail } from '../../hooks/useCourseDetail';
import { coursesService } from '../../services/coursesService';
import { ModuleData, ContentItem } from '../../types';
import { LearningSidebar } from './LearningSidebar';
import { ModuleContent } from './ModuleContent';
import { CourseCompletionPage } from './CourseCompletionPage';
import { cn } from '@/shared/utils/utils';

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

  // Course completion state
  const [isCompleted, setIsCompleted] = useState(false);
  const [completedAt, setCompletedAt] = useState<string | null>(null);

  // UI state
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [completedModules, setCompletedModules] = useState<Set<number>>(new Set());

  // NEW: Focus Mode State
  const [isFocusMode, setIsFocusMode] = useState(false);

  // Refs to prevent duplicate fetches
  const fetchedModuleRef = useRef<number | null>(null);
  const initializedRef = useRef(false);
  const completingRef = useRef(false);

  // NEW: Keyboard Shortcut for Focus Mode (Press 'F')
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.key.toLowerCase() === 'f' && e.target === document.body) {
        setIsFocusMode(prev => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, []);

  // Initialize module index when course loads
  useEffect(() => {
    if (!course || initializedRef.current || completingRef.current || isCompleted) return;
    initializedRef.current = true;

    let startIndex = 0;
    if (resumeModuleIndex !== undefined) {
      startIndex = resumeModuleIndex;
    } else if (course.moduleIndex !== undefined) {
      startIndex = course.moduleIndex;
    }

    const validIndex = Math.min(Math.max(0, startIndex), course.modules.length - 1);
    setCurrentModuleIndex(validIndex);

    const completed = new Set<number>();
    if (course.enrollmentStatus === 'COMPLETED') {
      for (let i = 0; i < course.modules.length; i++) {
        completed.add(i);
      }
    } else if (validIndex > 0) {
      for (let i = 0; i < validIndex; i++) {
        completed.add(i);
      }
    }
    setCompletedModules(completed);
  }, [course, resumeModuleIndex]);

  // Fetch module content when index changes
  useEffect(() => {
    if (!course || currentModuleIndex === null || isCompleted) return;
    if (fetchedModuleRef.current === currentModuleIndex) return;

    const fetchModule = async () => {
      setModuleLoading(true);
      setModuleError(null);
      fetchedModuleRef.current = currentModuleIndex;

      try {
        const response = await coursesService.getModuleContent(course.id, currentModuleIndex);
        console.log("DEBUG: Full API Response", response.data);
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
  }, [course, currentModuleIndex, isCompleted]);

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

  const handleCourseComplete = () => {
    if (!course || isCompleted || completingRef.current) return;
    completingRef.current = true;
    const now = new Date().toISOString();
    setCompletedAt(now);
    setIsCompleted(true);
    coursesService.completeCourse(course.id).catch((err) => {
      console.error('Failed to save course completion:', err);
    });
  };

  if (courseLoading || (currentModuleIndex === null && !isCompleted)) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-blue-600 mx-auto" />
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
          <p className="text-gray-600 text-sm">You need to enroll in this course to access the content.</p>
          <Button onClick={() => navigate(`/courses/${slug}`)} className="bg-brand-blue-600 hover:bg-brand-blue-700">
            View Course Details
          </Button>
        </div>
      </div>
    );
  }

  if (isCompleted && completedAt) {
    return <CourseCompletionPage course={course} completedAt={completedAt} />;
  }

  return (
    <div className="h-screen flex flex-col bg-gray-100 overflow-hidden">
      {/* Header - Blurs when Focus Mode is Active */}
      <header className={cn(
        "bg-white border-b h-14 flex items-center px-4 flex-shrink-0 shadow-sm transition-all duration-500 z-30",
        isFocusMode && "blur-md opacity-40 pointer-events-none grayscale"
      )}>
        <div className="flex items-center gap-4 flex-1">
          <Button
            variant="ghost" size="sm" className="lg:hidden"
            onClick={() => setMobileSidebarOpen(!mobileSidebarOpen)}
          >
            {mobileSidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>

          <Button
            variant="ghost" size="sm"
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
        
        {/* Visual Cue for Focus Mode in Header */}
        {isFocusMode && (
          <div className="flex items-center gap-2 text-brand-blue-600 font-bold text-xs animate-pulse">
            <Target className="h-4 w-4" /> FOCUS ACTIVE
          </div>
        )}
      </header>

      {/* Main Content Container */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Mobile Overlay */}
        {mobileSidebarOpen && !isFocusMode && (
          <div
            className="fixed inset-0 bg-black/50 z-40 lg:hidden"
            onClick={() => setMobileSidebarOpen(false)}
          />
        )}

        {/* Sidebar - Slides out and blurs when Focus Mode is Active */}
        <div
          className={cn(
            "fixed lg:relative inset-y-0 left-0 z-50 lg:z-auto transition-all duration-500 transform",
            mobileSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0',
            isFocusMode && "lg:-ml-80 blur-xl opacity-0 pointer-events-none"
          )}
        >
          <LearningSidebar
            courseTitle={course.title}
            modules={course.modules}
            currentModuleIndex={currentModuleIndex ?? 0}
            onModuleSelect={handleModuleSelect}
            isCollapsed={sidebarCollapsed}
            onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
            progressPercent={course.progressPercent ?? 0}
            completedModules={completedModules}
            isCourseCompleted={course.enrollmentStatus === 'COMPLETED'}
            onViewCertificate={() => {
              setCompletedAt(course.enrollment?.completed_at || new Date().toISOString());
              setIsCompleted(true);
            }}
          />
        </div>

        {/* Content Area - Centers and darkens background slightly in Focus Mode */}
        <div className={cn(
          "flex-1 overflow-hidden transition-all duration-700",
          isFocusMode ? "bg-slate-900/5" : "bg-white"
        )}>
          <ModuleContent
            module={moduleData}
            contentItems={contentItems}
            loading={moduleLoading}
            error={moduleError}
            onNextModule={handleNextModule}
            onPrevModule={handlePrevModule}
            onCourseComplete={handleCourseComplete}
            hasNextModule={currentModuleIndex !== null && currentModuleIndex < course.modules.length - 1}
            hasPrevModule={currentModuleIndex !== null && currentModuleIndex > 0}
            courseId={course.id}
            moduleIndex={currentModuleIndex ?? 0}
            onProgressUpdate={(courseProgress) => console.log('Progress:', courseProgress)}
            
            /* Focus Mode Props */
            isFocusMode={isFocusMode}
            onToggleFocus={() => setIsFocusMode(!isFocusMode)}
          />
        </div>
      </div>
    </div>
  );
};

export default LearningPage;