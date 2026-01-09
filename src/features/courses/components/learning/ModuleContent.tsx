import { useState, useEffect, useCallback, useRef } from 'react';
import { Button } from '@/shared/components/ui/button';
import { Badge } from '@/shared/components/ui/badge';
import { Progress } from '@/shared/components/ui/progress';
import { ScrollArea } from '@/shared/components/ui/scroll-area';
import {
  ChevronLeft,
  ChevronRight,
  BookOpen,
  HelpCircle,
  Loader2,
  AlertCircle,
  CheckCircle,
  Circle,
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
  hasNextModule: boolean;
  hasPrevModule: boolean;
  courseId: string;
  moduleIndex: number;
  onProgressUpdate?: (courseProgress: number, moduleProgress: number) => void;
}

export function ModuleContent({
  module,
  contentItems,
  loading,
  error,
  onNextModule,
  onPrevModule,
  hasNextModule,
  hasPrevModule,
  courseId,
  moduleIndex,
  onProgressUpdate,
}: ModuleContentProps) {
  const [currentIndex, setCurrentIndex] = useState<number | null>(null);
  const [localCompletedIds, setLocalCompletedIds] = useState<Set<string>>(new Set());
  const [isMarkingComplete, setIsMarkingComplete] = useState(false);
  const [isReady, setIsReady] = useState(false);

  // Refs for tracking - these persist across renders
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

  // Track access when user navigates (not on initialization)
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

  // Progress
  const totalItems = contentItems.length;
  const completedCount = contentItems.filter(isItemCompleted).length;
  const allCompleted = completedCount === totalItems && totalItems > 0;
  const progressPercent = totalItems > 0 ? Math.round((completedCount / totalItems) * 100) : 0;

  // Mark complete
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

  // Navigation - track access on navigate
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
    // Don't track access for going back - already accessed
  }, [currentIndex]);

  const goToIndex = useCallback(
    (index: number) => {
      if (currentIndex === null) return;
      const targetItem = contentItems[index];
      if (!targetItem) return;
      // Can navigate to completed or previous items
      if (index <= currentIndex || isItemCompleted(targetItem)) {
        setCurrentIndex(index);
        trackAccessForItem(targetItem);
      }
    },
    [currentIndex, contentItems, isItemCompleted, trackAccessForItem]
  );

  // Loading
  if (loading || !isReady || currentIndex === null) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin text-purple-600 mx-auto" />
          <p className="text-gray-600">Loading module content...</p>
        </div>
      </div>
    );
  }

  // Error
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

  // Empty
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
    <div className="flex flex-col h-full bg-white">
      {/* Module Header */}
      <div className="border-b px-6 py-4 bg-gray-50">
        <div className="flex items-center justify-between mb-3">
          <div>
            <p className="text-sm text-gray-500 mb-1">Module {module.order_index + 1}</p>
            <h1 className="text-xl font-bold text-gray-900">{module.title}</h1>
          </div>
          <div className="text-right">
            <p className="text-sm text-gray-500">Progress</p>
            <p className="text-lg font-semibold text-purple-600">
              {completedCount}/{totalItems}
            </p>
          </div>
        </div>
        <Progress value={progressPercent} className="h-2" />
      </div>

      {/* Content Navigation Pills */}
      <div className="border-b px-6 py-3 bg-white">
        <div className="flex items-center gap-2 overflow-x-auto pb-1">
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
                    ? 'bg-purple-600 text-white'
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

      {/* Content Area */}
      <ScrollArea className="flex-1">
        <div className="p-6 md:p-8 max-w-4xl mx-auto">
          <div className="mb-6">
            <div className="flex items-center gap-3 mb-2">
              <Badge
                variant="outline"
                className={cn(
                  'text-xs',
                  currentItem?.type === 'NOTES'
                    ? 'border-blue-200 text-blue-700 bg-blue-50'
                    : 'border-purple-200 text-purple-700 bg-purple-50'
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

          {currentItem?.type === 'NOTES' && currentItem.content && (
            <NoteContent note={currentItem.content as NoteType} />
          )}

          {currentItem?.type === 'MCQ' && currentItem.content && (
            <MCQContent
              mcq={currentItem.content as MCQType}
              onComplete={markComplete}
              isAlreadyCompleted={isCurrentCompleted}
            />
          )}
        </div>
      </ScrollArea>

      {/* Navigation Footer */}
      <div className="border-t bg-white px-6 py-4">
        <div className="flex items-center justify-between max-w-4xl mx-auto">
          <Button
            variant="outline"
            onClick={hasPrevModule && currentIndex === 0 ? onPrevModule : goPrev}
            disabled={currentIndex === 0 && !hasPrevModule}
          >
            <ChevronLeft className="h-4 w-4 mr-2" />
            {currentIndex === 0 ? 'Previous Module' : 'Previous'}
          </Button>

          <div className="flex items-center gap-2">
            {!isCurrentCompleted && currentItem?.type === 'NOTES' && (
              <Button
                onClick={markComplete}
                disabled={isMarkingComplete}
                className="bg-green-600 hover:bg-green-700 text-white"
              >
                {isMarkingComplete ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <CheckCircle className="h-4 w-4 mr-2" />
                )}
                {isMarkingComplete ? 'Saving...' : 'Mark Complete'}
              </Button>
            )}
            {isCurrentCompleted && (
              <span className="flex items-center gap-1 text-green-600 text-sm font-medium">
                <CheckCircle className="h-4 w-4" />
                Completed
              </span>
            )}
          </div>

          {currentIndex < totalItems - 1 ? (
            <Button
              onClick={goNext}
              disabled={!isCurrentCompleted}
              className={cn(
                !isCurrentCompleted
                  ? 'bg-gray-300 cursor-not-allowed'
                  : 'bg-purple-600 hover:bg-purple-700'
              )}
            >
              Next
              <ChevronRight className="h-4 w-4 ml-2" />
            </Button>
          ) : (
            <Button
              onClick={onNextModule}
              disabled={!allCompleted || !hasNextModule}
              className={cn(
                allCompleted && hasNextModule
                  ? 'bg-green-600 hover:bg-green-700'
                  : 'bg-gray-300 cursor-not-allowed'
              )}
            >
              {!hasNextModule
                ? 'Module Complete'
                : allCompleted
                  ? 'Next Module'
                  : 'Complete All First'}
              <ChevronRight className="h-4 w-4 ml-2" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
