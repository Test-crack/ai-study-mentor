import { useCallback, useRef } from 'react';
import {
  coursesService,
  ContentCompleteResponse,
} from '../services/coursesService';

interface UseProgressTrackingProps {
  courseId: string;
  moduleIndex: number;
  onModuleComplete?: (nextModuleIndex: number | null) => void;
  onProgressUpdate?: (courseProgress: number, moduleProgress: number) => void;
}

interface UseProgressTrackingReturn {
  trackAccess: (contentItemId: string) => Promise<void>;
  markComplete: (contentItemId: string) => Promise<ContentCompleteResponse | null>;
}

/**
 * Hook for tracking user progress through course content
 * 
 * Features:
 * - Tracks content access (marks as IN_PROGRESS)
 * - Marks content as complete
 * - Prevents duplicate API calls for same content
 * - Handles module advancement
 * 
 * @example
 * const { trackAccess, markComplete } = useProgressTracking({
 *   courseId: 'abc-123',
 *   moduleIndex: 0,
 *   onModuleComplete: (nextIndex) => setCurrentModule(nextIndex),
 *   onProgressUpdate: (course, module) => updateUI(course, module),
 * });
 * 
 * // When content is viewed
 * useEffect(() => {
 *   trackAccess(currentContentId);
 * }, [currentContentId]);
 * 
 * // When user clicks "Mark Complete"
 * const handleComplete = async () => {
 *   await markComplete(currentContentId);
 * };
 */
export function useProgressTracking({
  courseId,
  moduleIndex,
  onModuleComplete,
  onProgressUpdate,
}: UseProgressTrackingProps): UseProgressTrackingReturn {
  // Track which content items have been accessed to prevent duplicate calls
  const accessedContentRef = useRef<Set<string>>(new Set());
  // Track which content items have been completed
  const completedContentRef = useRef<Set<string>>(new Set());

  /**
   * Track content access - call when user views a content item
   * This marks the content as IN_PROGRESS in the backend
   */
  const trackAccess = useCallback(
    async (contentItemId: string): Promise<void> => {
      // Skip if already accessed in this session
      if (accessedContentRef.current.has(contentItemId)) {
        return;
      }

      try {
        await coursesService.trackContentAccess(
          courseId,
          moduleIndex,
          contentItemId
        );
        accessedContentRef.current.add(contentItemId);
      } catch (error) {
        // Log but don't throw - access tracking is non-critical
        console.warn('Failed to track content access:', error);
      }
    },
    [courseId, moduleIndex]
  );

  /**
   * Mark content as complete - call when user completes a content item
   * Returns the response with updated progress data
   */
  const markComplete = useCallback(
    async (contentItemId: string): Promise<ContentCompleteResponse | null> => {
      // Skip if already completed
      if (completedContentRef.current.has(contentItemId)) {
        return null;
      }

      try {
        const response = await coursesService.markContentComplete(
          courseId,
          moduleIndex,
          contentItemId
        );

        completedContentRef.current.add(contentItemId);

        // Notify about progress updates
        if (onProgressUpdate) {
          onProgressUpdate(
            response.data.courseProgress.progress_percent,
            response.data.moduleProgress.progress_percent
          );
        }

        // Handle module advancement
        if (response.data.moduleAdvanced && onModuleComplete) {
          onModuleComplete(response.data.nextModuleIndex);
        }

        return response;
      } catch (error) {
        console.error('Failed to mark content complete:', error);
        throw error;
      }
    },
    [courseId, moduleIndex, onModuleComplete, onProgressUpdate]
  );

  return {
    trackAccess,
    markComplete,
  };
}

/**
 * Reset the tracking refs when module changes
 * Call this in useEffect when moduleIndex changes
 */
export function createProgressTracker() {
  const accessedContent = new Set<string>();
  const completedContent = new Set<string>();

  return {
    hasAccessed: (id: string) => accessedContent.has(id),
    markAccessed: (id: string) => accessedContent.add(id),
    hasCompleted: (id: string) => completedContent.has(id),
    markCompleted: (id: string) => completedContent.add(id),
    reset: () => {
      accessedContent.clear();
      completedContent.clear();
    },
  };
}
