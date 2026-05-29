# LexiGrid Gate Diagnostic Report

**Date:** 8 May 2026  
**Issue:** Student was able to complete 2 consecutive drills without LexiGrid in between  
**Expected:** After Drill 1, LexiGrid should be required before Drill 2 is accessible

---

## How the Gate Should Work

### Backend Logic (gameScoreController.ts, lines 85-92)

```typescript
if (drills_completed_today === 0) {
    next_action = 'DRILL_1';
} else if (drills_completed_today === 1 && !lexigrid_completed_today) {
    next_action = 'LEXIGRID';  // ← GATE: Drill 2 blocked until LexiGrid done
} else if (drills_completed_today === 1 && lexigrid_completed_today) {
    next_action = 'DRILL_2';   // ← Drill 2 unlocked after LexiGrid
} else if (drills_completed_today === 2) {
    next_action = 'DRILL_3';
}
```

### Frontend Logic (StudentDashboardPage.tsx, lines 747-840)

```typescript
const isFreeDrill = ['DRILL_1', 'DRILL_2', 'DRILL_3'].includes(nextAction);
const isLexiGate = nextAction === 'LEXIGRID';

// Button rendering:
{isLexiGate && (
  <div>Complete LexiGrid to unlock</div>  // ← Shows lock message
)}

{isFreeDrill && (
  <button onClick={onStartDrill}>Start Priority Drill</button>  // ← Allows drill
)}
```

**Key Point:** Frontend trusts `next_action` from backend. If backend says `DRILL_2`, frontend allows it.

---

## Possible Root Causes

### 1. LexiGrid Completion Not Saved ⚠️ (Most Likely)

**Symptom:** Student completed LexiGrid but `lexigrid_completed_today` stayed `false` in backend.

**Check:**
```sql
-- Run this query to see if LexiGrid record exists for today
SELECT * FROM student_game_scores 
WHERE student_id = '<student_id>' 
  AND game_type = 'LEXIGRID'
  AND session_date = CURRENT_DATE
ORDER BY created_at DESC;
```

**Expected Result:** Should have 1 row with `completed = true` and `words_solved >= 5`

**If No Row Found:**
- LexiGrid session was never submitted to backend
- Frontend localStorage may have saved progress but backend API call failed
- Network error during submission

**If Row Found but `completed = false`:**
- Submission happened but didn't mark as complete
- Check `words_solved` value (should be 5)

---

### 2. Timezone Mismatch 🕐

**Symptom:** LexiGrid was completed yesterday (IST) but backend thinks it's today (UTC).

**Backend uses IST:**
```typescript
// Line 38: drillCutoff (IST midnight as UTC)
// Line 49: session_date matches exact IST date
```

**Check:**
```sql
-- See what date the LexiGrid record has
SELECT session_date, created_at, completed 
FROM student_game_scores 
WHERE student_id = '<student_id>' 
  AND game_type = 'LEXIGRID'
ORDER BY created_at DESC 
LIMIT 5;
```

**If `session_date` is yesterday:** Timezone conversion issue - LexiGrid counted for wrong day.

---

### 3. Frontend Bypassed Backend Check 🚨

**Symptom:** Frontend allowed drill start even though backend said `LEXIGRID`.

**Check Browser Console:**
```javascript
// Look for this log group in console (StudentDashboardPage.tsx line 553)
console.group('🎯 [Dashboard] Drill State');
console.log('next_action:', ...);
console.log('drills_completed_today:', ...);
console.log('lexigrid_completed:', ...);
console.log('isLexiGate:', ...);
```

**If `next_action = 'LEXIGRID'` but drill button was clickable:**
- Frontend rendering bug
- State not refreshed after page load
- Stale `dailyDrillState` from previous session

---

### 4. Race Condition ⏱️

**Symptom:** Student clicked drill button before backend state refreshed after LexiGrid completion.

**Scenario:**
1. Student completes LexiGrid
2. Frontend navigates back to dashboard with `state: { lexigridCompleted: true }`
3. Dashboard triggers `fetchDailyDrillState()` (line 296)
4. **BUT** student clicks drill button before API response arrives
5. Old state still shows `next_action: 'DRILL_1'` or cached value

**Check:**
- Was there a delay between LexiGrid completion and drill start?
- Did the page fully reload or was it a soft navigation?

---

### 5. Database Transaction Issue 💾

**Symptom:** LexiGrid upsert succeeded but wasn't committed before next API call.

**Backend Code (gameScoreController.ts, line 175):**
```typescript
const record = await prisma.studentGameScore.upsert({
    where: { student_id_game_type_session_date: {...} },
    update: { words_solved, completed: true, ... },
    create: { student_id, game_type, session_date, ... }
});
```

**Check:**
- Are there any database transaction errors in backend logs?
- Is Prisma connection pool exhausted?
- Any database locks or deadlocks?

---

## Debugging Steps

### Step 1: Check Backend Logs

Look for these log lines when student completes LexiGrid:

```
[GameScore] saveGameScore called
[TZ] drillCutoff (IST midnight as UTC): ...
[TZ] sessionToday (IST date as UTC 00:00): ...
```

**Expected:** Should see successful upsert with `completed: true`

---

### Step 2: Check Frontend Console

After LexiGrid completion, check dashboard console logs:

```javascript
🎯 [Dashboard] Drill State
next_action: 'LEXIGRID' or 'DRILL_2'  // ← Should be DRILL_2 after LexiGrid
drills_completed_today: 1
lexigrid_completed: true  // ← Should be true
isLexiGate: false  // ← Should be false (gate passed)
```

**If `lexigrid_completed: false`:** Backend didn't register completion.

---

### Step 3: Check API Response

Open Network tab, find `/api/student/daily-drill-state` request after LexiGrid:

```json
{
  "success": true,
  "drills_completed_today": 1,
  "lexigrid_completed_today": true,  // ← Should be true
  "lexigrid_words_solved": 5,
  "next_action": "DRILL_2",  // ← Should be DRILL_2, not LEXIGRID
  "dashboard_unlocked": false
}
```

**If `lexigrid_completed_today: false`:** Database query didn't find the record.

---

### Step 4: Manual Database Check

```sql
-- Check if LexiGrid record exists
SELECT 
    id,
    student_id,
    game_type,
    session_date,
    words_solved,
    completed,
    created_at
FROM student_game_scores
WHERE student_id = (
    SELECT id FROM institute_students 
    WHERE user_id = '<app_user_id>'
)
AND game_type = 'LEXIGRID'
ORDER BY created_at DESC
LIMIT 5;
```

**Expected:** Most recent row should have:
- `session_date` = today (IST)
- `words_solved` = 5
- `completed` = true

---

## Quick Fix (Temporary)

If you need to manually unlock Drill 2 for a student:

```sql
-- Insert a fake LexiGrid completion for today
INSERT INTO student_game_scores (
    student_id,
    game_type,
    session_date,
    words_solved,
    total_attempts,
    completed,
    momentum_earned,
    created_at
) VALUES (
    (SELECT id FROM institute_students WHERE user_id = '<app_user_id>'),
    'LEXIGRID',
    CURRENT_DATE,  -- IST date
    5,
    5,
    true,
    80,  -- 15*5 + 5 bonus
    NOW()
);
```

**Warning:** This bypasses the actual game - only use for testing/debugging.

---

## Permanent Fix Recommendations

### If Root Cause is #1 (Completion Not Saved):

**Check:** `LexiGrid.tsx` line 330 - `submitLexiGridSession` function

```typescript
const submitLexiGridSession = useCallback(async (finalWordsWon: number) => {
  try {
    const res = await callBackend(`${backendUrl}/api/student/game-score`, {
      method: 'POST',
      body: JSON.stringify({
        game_type: 'LEXIGRID',
        words_solved: finalWordsWon,
        total_attempts: attemptsUsed,
        bonus_eligible: finalWordsWon >= 5 && attemptsUsed <= 10
      })
    });
    // ← Add error handling here
  } catch (err) {
    console.error('[LexiGrid] Failed to submit session:', err);
    // ← Add retry logic or user notification
  }
}, [syncMomentum]);
```

**Fix:** Add retry logic and user notification if submission fails.

---

### If Root Cause is #3 (Frontend Bypass):

**Check:** `StudentDashboardPage.tsx` line 747 - Button rendering logic

**Current:**
```typescript
{isFreeDrill && (
  <button onClick={onStartDrill}>Start Priority Drill</button>
)}
```

**Fix:** Add explicit check for LexiGrid gate:
```typescript
{isFreeDrill && !isLexiGate && (
  <button onClick={onStartDrill}>Start Priority Drill</button>
)}
```

---

### If Root Cause is #4 (Race Condition):

**Fix:** Add loading state during API refresh:

```typescript
const [isRefreshing, setIsRefreshing] = useState(false);

useEffect(() => {
  if (location.state?.lexigridCompleted) {
    setIsRefreshing(true);
    fetchDailyDrillState().finally(() => setIsRefreshing(false));
  }
}, [location.state?.lexigridCompleted]);

// Disable drill button while refreshing
<button 
  onClick={onStartDrill}
  disabled={isRefreshing}
>
  {isRefreshing ? 'Updating...' : 'Start Priority Drill'}
</button>
```

---

## Testing Checklist

After implementing fix:

- [ ] Complete Drill 1
- [ ] Verify drill button shows "Complete LexiGrid to unlock"
- [ ] Verify LexiGrid card is active/clickable
- [ ] Complete LexiGrid (5 words)
- [ ] Return to dashboard
- [ ] Verify drill button now shows "Start Priority Drill"
- [ ] Verify `next_action` in console is `DRILL_2`
- [ ] Start Drill 2 successfully
- [ ] Check database has LexiGrid record with `completed: true`

---

## Files to Check

### Backend
1. `backend-study-mentor/src/controllers/gameScoreController.ts`
   - Line 87-90: Gate logic
   - Line 175: LexiGrid upsert
   - Line 218: Returns `next_action: 'DRILL_2'` after LexiGrid

### Frontend
1. `src/features/student/components/StudentDashboardPage.tsx`
   - Line 747: `isLexiGate` flag
   - Line 837: Lock message rendering
   - Line 893: Drill button rendering
   - Line 294: State refresh on LexiGrid completion

2. `src/features/student/components/LexiGrid.tsx`
   - Line 330: `submitLexiGridSession` function
   - Line 521: Navigation back to dashboard

---

**Status:** Awaiting diagnostic data  
**Next Step:** Check backend logs and database for LexiGrid completion record  
**Last Updated:** 8 May 2026
