# Frontend Progress Tracking System

This document describes how progress tracking is implemented in the frontend for the course learning experience.

---

## Overview

The progress tracking system tracks user progress at three levels:
1. **Content Level** - Individual notes/MCQs within a module
2. **Module Level** - Completion percentage of a module
3. **Course Level** - Overall course completion percentage

---

## API Integration

### Service Methods (`coursesService.ts`)

```typescript
// Track when user views content (marks as IN_PROGRESS)
await coursesService.trackContentAccess(courseId, moduleIndex, contentItemId);

// Mark content as complete (marks as COMPLETED)
const response = await coursesService.markContentComplete(courseId, moduleIndex, contentItemId);

// Get user's resume position
const resumeData = await coursesService.getResumeData(courseId);
```

### Resume API Response
```typescript
{
  currentModuleIndex: number;      // Module to resume at
  courseStatus: string;            // NOT_STARTED | IN_PROGRESS | COMPLETED
  moduleProgress: number;          // 0-100
  moduleStatus: string | null;
  lastContentItemId: string | null; // Content item to resume at
  lastContentStatus: string | null;
  lastAccessedAt: string | null;
}
```

---

## Components

### CourseDetailSidebar

All enrolled user actions now use the Resume API:

| Status | Button | Behavior |
|--------|--------|----------|
| Not logged in | "Sign in to Enroll" | Navigate to `/auth` |
| Not enrolled | "Enroll Now" | Open enrollment modal |
| NOT_STARTED | "Start Learning" | Fetch resume → Navigate (defaults to module 0) |
| IN_PROGRESS | "Continue Learning" | Fetch resume → Navigate to last position |
| COMPLETED | "Review Course" | Fetch resume → Navigate to last position |

**Key Change:** Even "Start Learning" uses the resume API to ensure consistent behavior and handle edge cases where progress exists but status wasn't updated.

### ModuleContent

**New Props:**
```typescript
interface ModuleContentProps {
  // ... existing props
  resumeContentId?: string | null;  // Content item to resume at
}
```

**Resume Behavior:**
1. When `resumeContentId` is provided, finds the content index
2. Marks all content items before that index as "completed" (for navigation)
3. Sets current content to the resume position
4. Only applies once per module load (uses ref to track)

### LearningPage

**Navigation State:**
```typescript
interface LocationState {
  courseId: string;
  resumeModuleIndex?: number;       // Module to start at (default: 0)
  resumeContentId?: string | null;  // Content to start at (default: first)
}
```

**Resume Content Logic:**
- Only passes `resumeContentId` to ModuleContent when on the resume module
- Prevents incorrect content positioning when navigating between modules

---

## Flow Diagrams

### Course Entry Flow (All Enrolled Users)
```
User clicks any "Go to Course" button
       ↓
GET /resume API
       ↓
┌─────────────────────────────────────┐
│ Response contains:                   │
│ - currentModuleIndex (default: 0)   │
│ - lastContentItemId (default: null) │
└─────────────────────────────────────┘
       ↓
Navigate with state: {
  courseId,
  resumeModuleIndex,
  resumeContentId
}
       ↓
LearningPage initializes at correct module
       ↓
ModuleContent navigates to correct content
```

### Content Access Flow
```
User opens content (or navigates to it)
       ↓
Check if already tracked (ref)
       ↓
If not tracked → POST /access API
       ↓
Mark as tracked in ref
```

### Content Completion Flow
```
User clicks "Mark Complete" or submits MCQ
       ↓
POST /complete API
       ↓
Update local completed state
       ↓
Call onProgressUpdate callback
       ↓
If moduleAdvanced → trigger module change
```

---

## State Management

### Local State (ModuleContent)
- `currentContentIndex: number` - Current content being viewed
- `completedItems: Set<string>` - Content IDs completed in current session
- `accessedContentRef: Set<string>` - Prevents duplicate access API calls
- `hasResumedRef: boolean` - Ensures resume only happens once per module
- `isMarkingComplete: boolean` - Loading state for complete button

### Local State (LearningPage)
- `currentModuleIndex: number` - Current module being viewed
- `completedModules: Set<number>` - Modules completed in current session
- `hasInitialized: boolean` - Ensures initialization only happens once

---

## Error Handling

| Scenario | Behavior |
|----------|----------|
| Resume API fails | Fallback to module 0, content 0 |
| Access tracking fails | Log warning, continue (non-critical) |
| Complete marking fails | Log error, still update local state for UX |
| Invalid resumeContentId | Start at content 0 |

---

## Default Behavior

When no progress exists:
- `currentModuleIndex` defaults to `0`
- `lastContentItemId` defaults to `null`
- User starts at Module 1, Content 1

---

## Usage Example

```tsx
// CourseDetailSidebar - All buttons use resume
const handleResumeCourse = async () => {
  const response = await coursesService.getResumeData(course.id);
  navigate(`/learn/${course.slug}`, {
    state: {
      courseId: course.id,
      resumeModuleIndex: response.data.currentModuleIndex ?? 0,
      resumeContentId: response.data.lastContentItemId ?? null,
    },
  });
};

// LearningPage - Pass resumeContentId only for resume module
<ModuleContent
  resumeContentId={
    currentModuleIndex === resumeModuleIndex ? resumeContentId : null
  }
  // ... other props
/>

// ModuleContent - Handle resume on mount
useEffect(() => {
  if (!hasResumedRef.current && resumeContentId && contentItems.length > 0) {
    const resumeIndex = contentItems.findIndex(item => item.id === resumeContentId);
    if (resumeIndex > 0) {
      // Mark previous items as completed for navigation
      const completed = new Set<string>();
      for (let i = 0; i < resumeIndex; i++) {
        completed.add(contentItems[i].id);
      }
      setCompletedItems(completed);
      setCurrentContentIndex(resumeIndex);
    }
    hasResumedRef.current = true;
  }
}, [resumeContentId, contentItems]);
```
