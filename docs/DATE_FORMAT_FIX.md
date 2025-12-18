# Date Format Fix for Assessment History

## Issue
The assessment history was showing "Invalid Date" because:
1. Backend returns `createdAt` field, but frontend was looking for `completedAt`
2. Scores were in decimal format (0-1) but frontend expected percentages (0-100)
3. Missing `passageTitle` field in some responses

## Solution

### 1. Updated Type Definition
**File:** `src/lib/reading-api.ts`

Made the interface more flexible to handle both field names:
```typescript
export interface AssessmentHistoryItem {
  // ... other fields
  completedAt?: string;  // Optional
  createdAt?: string;    // Optional - backend uses this
  passageTitle?: string; // Optional - may not always be present
  passageId?: string;    // Alternative identifier
}
```

### 2. Date Handling
**Files:** 
- `src/components/readingAssessment/HistoryTable.tsx`
- `src/components/readingAssessment/HistoryChart.tsx`

Added helper function to get the correct date field:
```typescript
const getDateString = (item: AssessmentHistoryItem) => {
  return item.completedAt || item.createdAt || new Date().toISOString();
};
```

### 3. Score Normalization
**Files:**
- `src/components/readingAssessment/HistoryTable.tsx`
- `src/components/readingAssessment/AssessmentHistory.tsx`
- `src/components/readingAssessment/HistoryChart.tsx`

Added helper to handle both decimal (0-1) and percentage (0-100) formats:
```typescript
const formatScore = (score: number) => {
  return score <= 1 ? Math.round(score * 100) : Math.round(score);
};
```

### 4. Missing Passage Title
**File:** `src/components/readingAssessment/HistoryTable.tsx`

Fallback to category-based title:
```typescript
{item.passageTitle || `${item.category} Passage`}
```

## Backend Data Format

The backend returns data in this format:
```json
{
  "id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "userId": "f9e8d7c6-b5a4-3210-9876-543210fedcba",
  "passageId": "passage_001",
  "difficulty": "intermediate",
  "category": "Science",
  "wordCount": 450,
  "readingTimeSeconds": 120,
  "actualWPM": 225.0,
  "weightedWPM": 202.5,
  "accuracy": 0.92,           // Decimal format (0-1)
  "retention": 0.85,          // Decimal format (0-1)
  "speedLearningScore": 0.88, // Decimal format (0-1)
  "focusRatio": 0.95,         // Decimal format (0-1)
  "integrityScore": 0.90,     // Decimal format (0-1)
  "tabSwitches": 2,
  "createdAt": "2025-12-18T10:30:45.123Z" // ISO 8601 format
}
```

## Frontend Display

The frontend now correctly:
1. ✅ Parses ISO 8601 dates from `createdAt` field
2. ✅ Converts decimal scores (0-1) to percentages (0-100)
3. ✅ Handles missing `passageTitle` with fallback
4. ✅ Displays dates in user-friendly format
5. ✅ Shows all metrics correctly in charts and tables

## Testing

To verify the fix works:
1. Check that dates display correctly in the history table
2. Verify chart tooltips show proper dates
3. Confirm scores are shown as percentages (e.g., 92% not 0.92)
4. Ensure missing passage titles show category fallback

## Example Output

**Before Fix:**
- Date: "Invalid Date"
- Accuracy: "0" or "1%"
- Title: "undefined"

**After Fix:**
- Date: "Dec 18, 2025" and "10:30 AM"
- Accuracy: "92%"
- Title: "Science Passage" (if passageTitle missing)
