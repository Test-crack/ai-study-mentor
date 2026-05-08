# IA Completed Session Display

**Date:** 8 May 2026  
**Status:** ✅ Implemented  
**Feature:** Show completed IA results when student revisits the IA page on the same day

---

## Overview

When a student completes an Internal Assessment and returns to the IA page later the same day, they now see a **completed session screen** with their scores, momentum earned, and next IA date instead of being able to start a new test.

---

## Implementation

### Backend API

**Endpoint:** `GET /api/ia/status`

**Response includes:**
```typescript
{
  has_completed_session: boolean;
  today_completed_session?: {
    session_id: string;
    ia_number: number;
    scores: Array<{
      skill: string;
      sub_skill: string;
      band: number;
      correct?: number;
      total?: number;
      ai_graded?: boolean;
      previous_band?: number | null;
      delta?: number | null;
    }>;
    momentum_awarded: number;
    time_submitted_at: string;
  };
  // ... other status fields
}
```

**When populated:**
- `has_completed_session = true` when an IA was completed today (same IST date)
- `today_completed_session` contains the full session data including scores
- Scores follow the format documented in `docs/backend/ia_scores_jsonb_format.md`

---

### Frontend Changes

**File:** `src/features/student/components/Assessment.tsx`

#### 1. Type Definition Updated

```typescript
interface IAStatusResponse {
  // ... existing fields
  today_completed_session?: {
    session_id: string;
    ia_number: number;
    scores: Array<{
      skill: string;
      sub_skill: string;
      band: number;
      correct?: number;
      total?: number;
      ai_graded?: boolean;
      previous_band?: number | null;
      delta?: number | null;
    }>;
    momentum_awarded: number;
    time_submitted_at: string;
  };
}
```

#### 2. Routing Logic Updated

```typescript
{phase === "gate" && (() => {
  if (!iaStatus?.has_schedule || !iaStatus?.prerequisites_met) return renderNotEligible();
  if (!iaStatus.is_ia_day)                                       return renderScheduled();
  if (iaStatus.today_completed_session)                          return renderCompletedToday(); // ← NEW
  if (!iaStatus.dcs_eligible)                                    return renderIaDayLowDCS();
  return renderGate();
})()}
```

**Priority order:**
1. Not eligible (prerequisites not met)
2. Not IA day (scheduled for future)
3. **Completed today** ← NEW CHECK
4. IA day but low DCS
5. Ready to start/continue

#### 3. Render Function: `renderCompletedToday()`

**Features:**
- ✅ Shows completion banner with timestamp
- ✅ Displays momentum earned
- ✅ Shows 2 sub-skill score cards with:
  - Band score (0-9 scale)
  - Delta vs previous (↑/↓ indicators)
  - MCQ accuracy (correct/total)
  - AI graded badge (if applicable)
- ✅ Shows next IA date
- ✅ Dashboard navigation button

---

## UI Components

### Completion Banner
```
┌─────────────────────────────────────────────────────┐
│ ✓ Assessment Completed Today                        │
│                                                     │
│ Submitted at 2:45 PM                                │
│ Your competency matrix has been updated             │
└─────────────────────────────────────────────────────┘
```

### Momentum Card
```
┌─────────────────────────────────────────────────────┐
│ MOMENTUM EARNED                                     │
│                                                     │
│        +175                                         │
└─────────────────────────────────────────────────────┘
```

### Score Cards (2 columns)
```
┌──────────────────────────┐ ┌──────────────────────────┐
│ 📝 WRITING — Coherence   │ │ 🎤 SPEAKING — Fluency    │
│ WRITING · AI Graded      │ │ SPEAKING · AI Graded     │
│                          │ │                          │
│ 6.5  +1.0 vs Last IA     │ │ 5.5  +0.5 vs Last IA     │
│                          │ │                          │
│ Previous: 5.5            │ │ Previous: 5.0            │
│ ↑ Improved               │ │ ↑ Improved               │
│                          │ │                          │
│ 6/8 MCQ correct          │ │ 7/8 MCQ correct          │
│                          │ │                          │
│ [↑ Improved]             │ │ [↑ Improved]             │
└──────────────────────────┘ └──────────────────────────┘
```

### Next IA Info
```
┌─────────────────────────────────────────────────────┐
│ Next Internal Assessment                            │
│                                                     │
│ Sat, 10 May                                         │
│ In 3 days                                           │
└─────────────────────────────────────────────────────┘
```

---

## User Flow

### Scenario 1: Complete IA and Return Same Day

1. Student completes IA at 2:45 PM
2. Navigates away to dashboard
3. Returns to `/student/internal` at 4:00 PM
4. **Sees:** Completed session screen with scores
5. **Cannot:** Start a new IA (must wait for next scheduled date)

### Scenario 2: Complete IA and Return Next Day

1. Student completes IA on Day 1
2. Returns to `/student/internal` on Day 2
3. **Sees:** Scheduled screen showing next IA date
4. **Cannot:** See yesterday's scores (use dashboard widget or competency matrix)

---

## Data Flow

```
User visits /student/internal
         ↓
GET /api/ia/status
         ↓
Backend checks for completed session today
         ↓
If found: returns today_completed_session with scores
         ↓
Frontend checks iaStatus.today_completed_session
         ↓
If present: renders renderCompletedToday()
         ↓
Shows scores, momentum, next IA date
```

---

## Edge Cases Handled

### Case 1: No Delta (First IA)
- `previous_band = null`
- Delta section hidden
- Shows "vs Diagnostic" label

### Case 2: No MCQ Questions (Future)
- `correct` and `total` undefined
- MCQ accuracy line hidden
- Only shows band score

### Case 3: No AI Grading (READING/LISTENING)
- `ai_graded = false`
- No "AI Graded" badge shown
- Only MCQ accuracy displayed

### Case 4: Multiple Visits Same Day
- Always shows same completed session
- Consistent data (no re-fetching from different endpoint)
- Prevents duplicate submissions

---

## Benefits

### For Students
- ✅ Clear confirmation that IA was submitted
- ✅ Immediate access to scores without waiting
- ✅ See improvement vs previous attempts
- ✅ Know when next IA is scheduled
- ✅ Prevents accidental duplicate submissions

### For System
- ✅ Prevents duplicate IA sessions on same day
- ✅ Single source of truth (status endpoint)
- ✅ Consistent with backend session status
- ✅ No need for separate "get scores" endpoint

---

## Testing Checklist

- [ ] Complete an IA successfully
- [ ] Return to `/student/internal` same day
- [ ] Verify completed session screen shows
- [ ] Verify scores match submit response
- [ ] Verify momentum amount is correct
- [ ] Verify next IA date is shown
- [ ] Verify "Dashboard" button works
- [ ] Verify cannot start new IA same day
- [ ] Return next day and verify scheduled screen shows
- [ ] Test with first IA (no previous_band)
- [ ] Test with READING/LISTENING (no AI grading)
- [ ] Test with improved scores (↑ indicator)
- [ ] Test with dropped scores (↓ indicator)

---

## Related Documentation

- **Backend API:** `docs/ia_context_llm.md` (Section 4: Backend Endpoints)
- **Score Format:** `docs/backend/ia_scores_jsonb_format.md`
- **Frontend Integration:** `docs/frontend/IA_AUDIO_INTEGRATION.md`
- **Testing Guide:** `docs/ia_testing_checklist.md`

---

## Future Enhancements

### Phase 2 (Optional)
- [ ] Add AI feedback display (rationale + key observations)
- [ ] Add "Share Results" button
- [ ] Add "Download Report" PDF export
- [ ] Add comparison chart (current vs all past IAs)
- [ ] Add skill-specific recommendations based on scores

---

**Status:** ✅ Complete and ready for testing  
**Last Updated:** 8 May 2026
