import { useState, useEffect, useMemo } from 'react';
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

interface ModuleContentProps {
  module: ModuleData | null;
  loading: boolean;
  error: string | null;
  onNextModule: () => void;
  onPrevModule: () => void;
  hasNextModule: boolean;
  hasPrevModule: boolean;
}

// Flatten all content items from all concepts into a single list
function flattenContentItems(module: ModuleData): ContentItem[] {
  const items: ContentItem[] = [];
  module.concepts.forEach((concept) => {
    concept.contentItems.forEach((item) => {
      items.push(item);
    });
  });
  return items;
}

export function ModuleContent({
  module,
  loading,
  error,
  onNextModule,
  onPrevModule,
  hasNextModule,
  hasPrevModule,
}: ModuleContentProps) {
  const [currentContentIndex, setCurrentContentIndex] = useState(0);
  const [completedItems, setCompletedItems] = useState<Set<string>>(new Set());

  // Flatten content items
  const contentItems = useMemo(() => {
    if (!module) return [];
    return flattenContentItems(module);
  }, [module]);

  // Reset when module changes
  useEffect(() => {
    setCurrentContentIndex(0);
    setCompletedItems(new Set());
  }, [module?.id]);

  const currentItem = contentItems[currentContentIndex];
  const totalItems = contentItems.length;
  const completedCount = completedItems.size;
  const allCompleted = completedCount === totalItems && totalItems > 0;
  const progressPercent = totalItems > 0 ? Math.round((completedCount / totalItems) * 100) : 0;

  const markCurrentAsComplete = () => {
    if (currentItem) {
      setCompletedItems((prev) => new Set(prev).add(currentItem.id));
    }
  };

  const handleNext = () => {
    // For Notes, user must mark complete first (button is disabled until then)
    // For MCQ, completion is handled by the MCQContent component
    if (currentContentIndex < totalItems - 1) {
      setCurrentContentIndex((prev) => prev + 1);
    }
  };

  const handlePrev = () => {
    if (currentContentIndex > 0) {
      setCurrentContentIndex((prev) => prev - 1);
    }
  };

  const handleNextModule = () => {
    if (allCompleted && hasNextModule) {
      onNextModule();
    }
  };

  const handleContentSelect = (index: number) => {
    // Can only go to completed items or the next uncompleted one
    const canNavigate =
      index <= currentContentIndex ||
      completedItems.has(contentItems[index]?.id);
    if (canNavigate) {
      setCurrentContentIndex(index);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin text-purple-600 mx-auto" />
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

  const getContentTitle = (item: ContentItem) => {
    if (item.type === 'NOTES' && item.title) {
      return item.title;
    }
    if (item.type === 'MCQ') {
      return 'Assessment';
    }
    return `Content ${currentContentIndex + 1}`;
  };

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Module Header */}
      <div className="border-b px-6 py-4 bg-gray-50">
        <div className="flex items-center justify-between mb-3">
          <div>
            <p className="text-sm text-gray-500 mb-1">
              Module {module.order_index + 1}
            </p>
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
          {contentItems.map((item, index) => {
            const isActive = index === currentContentIndex;
            const isCompleted = completedItems.has(item.id);
            const canAccess = index <= currentContentIndex || isCompleted;

            return (
              <button
                key={item.id}
                onClick={() => handleContentSelect(index)}
                disabled={!canAccess}
                className={cn(
                  'flex items-center gap-2 px-3 py-2 rounded-full text-sm whitespace-nowrap transition-all',
                  isActive
                    ? 'bg-purple-600 text-white'
                    : isCompleted
                    ? 'bg-green-100 text-green-700 hover:bg-green-200'
                    : canAccess
                    ? 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    : 'bg-gray-50 text-gray-400 cursor-not-allowed'
                )}
              >
                {isCompleted ? (
                  <CheckCircle className="h-4 w-4" />
                ) : (
                  <Circle className="h-4 w-4" />
                )}
                <span>
                  {item.type === 'NOTES' ? (
                    <BookOpen className="h-3.5 w-3.5 inline mr-1" />
                  ) : (
                    <HelpCircle className="h-3.5 w-3.5 inline mr-1" />
                  )}
                  {index + 1}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Content Area */}
      <ScrollArea className="flex-1">
        <div className="p-6 md:p-8 max-w-4xl mx-auto">
          {/* Content Header */}
          <div className="mb-6">
            <div className="flex items-center gap-3 mb-2">
              <Badge
                variant="outline"
                className={cn(
                  'text-xs',
                  currentItem.type === 'NOTES'
                    ? 'border-blue-200 text-blue-700 bg-blue-50'
                    : 'border-purple-200 text-purple-700 bg-purple-50'
                )}
              >
                {currentItem.type === 'NOTES' ? (
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
                {currentContentIndex + 1} of {totalItems}
              </span>
            </div>
            <h2 className="text-2xl font-bold text-gray-900">
              {getContentTitle(currentItem)}
            </h2>
          </div>

          {/* Render Content */}
          {currentItem.type === 'NOTES' && currentItem.content && (
            <NoteContent note={currentItem.content as NoteType} />
          )}

          {currentItem.type === 'MCQ' && currentItem.content && (
            <MCQContent
              mcq={currentItem.content as MCQType}
              onComplete={markCurrentAsComplete}
            />
          )}
        </div>
      </ScrollArea>

      {/* Navigation Footer */}
      <div className="border-t bg-white px-6 py-4">
        <div className="flex items-center justify-between max-w-4xl mx-auto">
          <Button
            variant="outline"
            onClick={hasPrevModule && currentContentIndex === 0 ? onPrevModule : handlePrev}
            disabled={currentContentIndex === 0 && !hasPrevModule}
          >
            <ChevronLeft className="h-4 w-4 mr-2" />
            {currentContentIndex === 0 ? 'Previous Module' : 'Previous'}
          </Button>

          {/* Mark Complete button for Notes - required before Next */}
          <div className="flex items-center gap-2">
            {!completedItems.has(currentItem?.id) && currentItem?.type === 'NOTES' && (
              <Button
                onClick={markCurrentAsComplete}
                className="bg-green-600 hover:bg-green-700 text-white"
              >
                <CheckCircle className="h-4 w-4 mr-2" />
                Mark Complete
              </Button>
            )}
            {completedItems.has(currentItem?.id) && (
              <span className="flex items-center gap-1 text-green-600 text-sm font-medium">
                <CheckCircle className="h-4 w-4" />
                Completed
              </span>
            )}
          </div>

          {currentContentIndex < totalItems - 1 ? (
            <Button
              onClick={handleNext}
              disabled={!completedItems.has(currentItem?.id)}
              className={cn(
                !completedItems.has(currentItem?.id)
                  ? 'bg-gray-300 cursor-not-allowed'
                  : 'bg-purple-600 hover:bg-purple-700'
              )}
            >
              Next
              <ChevronRight className="h-4 w-4 ml-2" />
            </Button>
          ) : (
            <Button
              onClick={handleNextModule}
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
