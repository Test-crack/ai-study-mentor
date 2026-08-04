import { useState, useEffect, useCallback, useRef } from 'react';
import { Button } from '@/shared/components/ui/button';
import { Badge } from '@/shared/components/ui/badge';
import { Progress } from '@/shared/components/ui/progress';
import {
  ChevronLeft,
  ChevronRight,
  BookOpen,
  HelpCircle,
  Loader2,
  AlertCircle,
  CheckCircle,
  Circle,
  Award,
} from 'lucide-react';
import {
  ModuleData,
  ContentItem,
  NoteContent as NoteType,
  MCQContent as MCQType,
} from '../../types';
import { NoteContent } from './NoteContent';
import { MCQContent } from './MCQContent';
import { cn } from '@/shared/utils/utils';
import { coursesService } from '../../services/coursesService';

interface ModuleContentProps {
  module: ModuleData | null;
  contentItems: ContentItem[];
  loading: boolean;
  error: string | null;
  onNextModule: () => void;
  onPrevModule: () => void;
  onCourseComplete: () => void;
  hasNextModule: boolean;
  hasPrevModule: boolean;
  courseId: string;
  moduleIndex: number;
  onProgressUpdate?: (courseProgress: number, moduleProgress: number) => void;
  // FOCUS MODE PROPS
  isFocusMode?: boolean;
  onToggleFocus?: () => void;
}

export function ModuleContent({
  module,
  contentItems,
  loading,
  error,
  onNextModule,
  onPrevModule,
  onCourseComplete,
  hasNextModule,
  hasPrevModule,
  courseId,
  moduleIndex,
  onProgressUpdate,
  isFocusMode = false,
  onToggleFocus,
}: ModuleContentProps) {
  const [currentIndex, setCurrentIndex] = useState<number | null>(null);
  const [localCompletedIds, setLocalCompletedIds] = useState<Set<string>>(new Set());
  const [isMarkingComplete, setIsMarkingComplete] = useState(false);
  const [isReady, setIsReady] = useState(false);

  // Refs for tracking - preserved from your original code
  const accessedIdsRef = useRef<Set<string>>(new Set());
  const lastModuleIdRef = useRef<string | null>(null);

  // Check if item is completed
  const isItemCompleted = useCallback(
    (item: ContentItem) => item.status === 'COMPLETED' || localCompletedIds.has(item.id),
    [localCompletedIds]
  );

  // Initialize when module data arrives - runs once per module
  useEffect(() => {
    if (!module || contentItems.length === 0) {
      setCurrentIndex(null);
      setIsReady(false);
      return;
    }

    // Skip if same module
    if (lastModuleIdRef.current === module.id) {
      return;
    }

    // New module - reset everything
    lastModuleIdRef.current = module.id;
    accessedIdsRef.current = new Set();
    setLocalCompletedIds(new Set());

    // Find first incomplete item
    let startIdx = 0;
    for (let i = 0; i < contentItems.length; i++) {
      if (contentItems[i].status !== 'COMPLETED') {
        startIdx = i;
        break;
      }
    }

    setCurrentIndex(startIdx);
    setIsReady(true);

    // Track access for the starting item (if not completed)
    const startItem = contentItems[startIdx];
    if (startItem && startItem.status !== 'COMPLETED') {
      accessedIdsRef.current.add(startItem.id);
      coursesService
        .trackContentAccess(courseId, moduleIndex, startItem.id)
        .catch((err) => console.warn('Failed to track initial access:', err));
    }
  }, [module?.id, contentItems, courseId, moduleIndex]);

  // Track access when user navigates
  const trackAccessForItem = useCallback(
    (item: ContentItem) => {
      if (!item || accessedIdsRef.current.has(item.id)) return;
      if (item.status === 'COMPLETED' || localCompletedIds.has(item.id)) return;

      accessedIdsRef.current.add(item.id);
      coursesService
        .trackContentAccess(courseId, moduleIndex, item.id)
        .catch((err) => console.warn('Failed to track access:', err));
    },
    [courseId, moduleIndex, localCompletedIds]
  );

  // Current item
  const currentItem = currentIndex !== null ? contentItems[currentIndex] : null;
  const isCurrentCompleted = currentItem ? isItemCompleted(currentItem) : false;

  // Progress calculations
  const totalItems = contentItems.length;
  const completedCount = contentItems.filter(isItemCompleted).length;
  const allCompleted = completedCount === totalItems && totalItems > 0;
  const progressPercent = totalItems > 0 ? Math.round((completedCount / totalItems) * 100) : 0;

  // Mark complete handler
  const markComplete = useCallback(async () => {
    if (!currentItem || isItemCompleted(currentItem)) return;

    setIsMarkingComplete(true);
    try {
      const response = await coursesService.markContentComplete(
        courseId,
        moduleIndex,
        currentItem.id
      );
      setLocalCompletedIds((prev) => new Set(prev).add(currentItem.id));
      onProgressUpdate?.(
        response.data.courseProgress.progress_percent,
        response.data.moduleProgress.progress_percent
      );
    } catch (err) {
      console.error('Failed to mark complete:', err);
      setLocalCompletedIds((prev) => new Set(prev).add(currentItem.id));
    } finally {
      setIsMarkingComplete(false);
    }
  }, [currentItem, isItemCompleted, courseId, moduleIndex, onProgressUpdate]);

  // Navigation handlers
  const goNext = useCallback(() => {
    if (currentIndex === null || currentIndex >= totalItems - 1) return;
    const nextIdx = currentIndex + 1;
    const nextItem = contentItems[nextIdx];
    setCurrentIndex(nextIdx);
    trackAccessForItem(nextItem);
  }, [currentIndex, totalItems, contentItems, trackAccessForItem]);

  const goPrev = useCallback(() => {
    if (currentIndex === null || currentIndex <= 0) return;
    setCurrentIndex(currentIndex - 1);
  }, [currentIndex]);

  const goToIndex = useCallback(
    (index: number) => {
      if (currentIndex === null) return;
      const targetItem = contentItems[index];
      if (!targetItem) return;
      if (index <= currentIndex || isItemCompleted(targetItem)) {
        setCurrentIndex(index);
        trackAccessForItem(targetItem);
      }
    },
    [currentIndex, contentItems, isItemCompleted, trackAccessForItem]
  );

  // Status screens
  if (loading || !isReady || currentIndex === null) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin text-brand-blue-600 mx-auto" />
          <p className="text-gray-600">Loading module content...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center space-y-4 max-w-md">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto" />
          <p className="text-gray-900 font-semibold">Failed to load content</p>
          <p className="text-gray-600 text-sm">{error}</p>
        </div>
      </div>
    );
  }

  if (!module || contentItems.length === 0) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center space-y-4">
          <BookOpen className="h-12 w-12 text-gray-400 mx-auto" />
          <p className="text-gray-600">No content available for this module</p>
        </div>
      </div>
    );
  }

  const getTitle = (item: ContentItem) => {
    if (item.type === 'NOTES' && item.title) return item.title;
    if (item.type === 'MCQ') return 'Assessment';
    return `Content ${item.index + 1}`;
  };

  return (
    <div className="flex flex-col h-full bg-white transition-all duration-500">
      {/* Header and Pill Navigation - Hidden in Focus Mode */}
      {!isFocusMode && (
        <>
          <div className="border-b px-6 py-4 bg-gray-50 transition-all duration-500 animate-in fade-in slide-in-from-top-4">
            <div className="flex items-center justify-between mb-3">
              <div>
                <p className="text-sm text-gray-500 mb-1">Module {module.order_index + 1}</p>
                <h1 className="text-xl font-bold text-gray-900">{module.title}</h1>
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-500">Progress</p>
                <p className="text-lg font-semibold text-brand-blue-600">
                  {completedCount}/{totalItems}
                </p>
              </div>
            </div>
            <Progress value={progressPercent} className="h-2" />
          </div>

          <div className="border-b px-6 py-3 bg-white transition-all duration-500 animate-in fade-in">
            <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
              {contentItems.map((item) => {
                const isActive = item.index === currentIndex;
                const itemCompleted = isItemCompleted(item);
                const canAccess = item.index <= currentIndex || itemCompleted;

                return (
                  <button
                    key={item.id}
                    onClick={() => goToIndex(item.index)}
                    disabled={!canAccess}
                    className={cn(
                      'flex items-center gap-2 px-3 py-2 rounded-full text-sm whitespace-nowrap transition-all',
                      isActive
                        ? 'bg-brand-blue-600 text-white'
                        : itemCompleted
                        ? 'bg-green-100 text-green-700 hover:bg-green-200'
                        : canAccess
                        ? 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        : 'bg-gray-50 text-gray-400 cursor-not-allowed'
                    )}
                  >
                    {itemCompleted ? <CheckCircle className="h-4 w-4" /> : <Circle className="h-4 w-4" />}
                    <span>
                      {item.type === 'NOTES' ? (
                        <BookOpen className="h-3.5 w-3.5 inline mr-1" />
                      ) : (
                        <HelpCircle className="h-3.5 w-3.5 inline mr-1" />
                      )}
                      {item.index + 1}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </>
      )}

      {/* Main Content Area */}
      <div className={cn("flex-1 overflow-y-auto min-h-0 transition-all duration-500", isFocusMode ? "bg-slate-50/50" : "bg-white")}>
        <div className={cn("p-6 md:p-8 max-w-4xl mx-auto transition-all", isFocusMode && "py-12 md:py-16")}>
          {!isFocusMode && (
            <div className="mb-6">
              <div className="flex items-center gap-3 mb-2">
                <Badge
                  variant="outline"
                  className={cn(
                    'text-xs',
                    currentItem?.type === 'NOTES'
                      ? 'border-blue-200 text-blue-700 bg-blue-50'
                      : 'border-brand-blue-200 text-brand-blue-700 bg-brand-blue-50'
                  )}
                >
                  {currentItem?.type === 'NOTES' ? (
                    <>
                      <BookOpen className="h-3 w-3 mr-1" />
                      Reading Material
                    </>
                  ) : (
                    <>
                      <HelpCircle className="h-3 w-3 mr-1" />
                      Assessment
                    </>
                  )}
                </Badge>
                <span className="text-sm text-gray-500">
                  {currentIndex + 1} of {totalItems}
                </span>
              </div>
              <h2 className="text-2xl font-bold text-gray-900">
                {currentItem ? getTitle(currentItem) : 'Loading...'}
              </h2>
            </div>
          )}

          {currentItem?.type === 'NOTES' && currentItem.content && (
            <NoteContent 
              note={currentItem.content as NoteType} 
              isFocusMode={isFocusMode}
              onToggleFocus={onToggleFocus}
            />
          )}

          {currentItem?.type === 'MCQ' && currentItem.content && (
            <MCQContent
              mcq={currentItem.content as MCQType}
              onComplete={markComplete}
              isAlreadyCompleted={isCurrentCompleted}
              isFocusMode={isFocusMode}
              onToggleFocus={onToggleFocus}
            />
          )}
        </div>
      </div>

      {/* Navigation Footer */}
      <div className={cn(
        "border-t px-6 py-4 z-10 transition-all duration-500 shadow-[0_-2px_10px_rgba(0,0,0,0.05)]", 
        isFocusMode ? "bg-slate-900 text-white border-slate-800" : "bg-white"
      )}>
        <div className="flex items-center justify-between max-w-4xl mx-auto">
          <Button
            variant={isFocusMode ? "ghost" : "outline"}
            onClick={hasPrevModule && currentIndex === 0 ? onPrevModule : goPrev}
            disabled={currentIndex === 0 && !hasPrevModule}
            className={cn("gap-2", isFocusMode && "text-gray-400 hover:text-white hover:bg-white/10")}
          >
            <ChevronLeft className="h-4 w-4" />
            {currentIndex === 0 ? 'Previous Module' : 'Previous'}
          </Button>

          <div className="flex items-center gap-3">
            {!isFocusMode && (
              <span className="text-sm text-gray-500 hidden sm:block">
                {completedCount} of {totalItems} completed
              </span>
            )}
            
            {!isCurrentCompleted && currentItem?.type === 'NOTES' && (
              <Button
                onClick={markComplete}
                disabled={isMarkingComplete}
                className="bg-green-600 hover:bg-green-700 text-white gap-2"
              >
                {isMarkingComplete ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <CheckCircle className="h-4 w-4" />
                )}
                {isMarkingComplete ? 'Saving...' : 'Mark Complete'}
              </Button>
            )}
            
            {isCurrentCompleted && (
              <span className={cn(
                "flex items-center gap-1.5 text-sm font-medium px-3 py-1.5 rounded-full border",
                isFocusMode 
                  ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400" 
                  : "bg-green-50 border-green-100 text-green-600"
              )}>
                <CheckCircle className="h-4 w-4" />
                Completed
              </span>
            )}
          </div>

          {/* Logic-dense Navigation Button */}
          {currentIndex < totalItems - 1 ? (
            <Button
              onClick={goNext}
              disabled={!isCurrentCompleted}
              className={cn(
                'gap-2 transition-all',
                isCurrentCompleted
                  ? 'bg-brand-blue-600 hover:bg-brand-blue-700 shadow-md hover:shadow-lg'
                  : 'bg-gray-300 cursor-not-allowed'
              )}
            >
              Next
              <ChevronRight className="h-4 w-4" />
            </Button>
          ) : hasNextModule ? (
            <Button
              onClick={() => { if (allCompleted) onNextModule(); }}
              disabled={!allCompleted}
              className={cn(
                'gap-2 transition-all',
                allCompleted
                  ? 'bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 shadow-md hover:shadow-lg'
                  : 'bg-gray-300 cursor-not-allowed'
              )}
            >
              {allCompleted ? 'Next Module' : `Complete ${totalItems - completedCount} more`}
              <ChevronRight className="h-4 w-4" />
            </Button>
          ) : (
            <Button
              onClick={() => { if (allCompleted) onCourseComplete(); }}
              disabled={!allCompleted}
              className={cn(
                'gap-2 transition-all',
                allCompleted
                  ? 'bg-gradient-to-r from-brand-blue-600 to-brand-teal-600 hover:from-brand-blue-700 hover:to-brand-teal-700 shadow-lg hover:shadow-xl'
                  : 'bg-gray-300 cursor-not-allowed'
              )}
            >
              {allCompleted ? (
                <>
                  <Award className="h-4 w-4" />
                  Complete Course
                </>
              ) : (
                `Complete ${totalItems - completedCount} more`
              )}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}