# Skip LexiGrid Gate — Implementation Report

**Feature:** Student spends 150 momentum pts to skip the LexiGrid gate and immediately unlock Drill 2.  
**Status:** ✅ Complete — backend implemented, frontend was pre-built.  
**Change scope:** 3 files, 1 schema migration.

---

## Architecture Overview

```
Student Dashboard
   │
   ├── next_action = 'LEXIGRID'  (after Drill 1, before Drill 2)
   │
   └── LexiGrid Component  (/student/lexigrid?mode=gate)
          │
          ├── Play normally → POST /api/student/game-score  { words_solved, ... }
          │         → lexigrid_completed_today = true → next_action = 'DRILL_2'
          │
          └── Click "Skip Gate · 150 ⚡" → POST /api/student/game-score  { status: 'skipped', ... }
                    → Deduct 150 pts, mark gate passed → next_action = 'DRILL_2'
                    → Navigate to dashboard → Drill 2 card unlocked
                              │
                              └── Complete Drill 2 → drills_completed_today = 2
                                        → dashboard_unlocked = true ✓
```

---

## What Was Already Built (Frontend)

**File:** `src/features/student/components/LexiGrid.tsx`

| Item | Detail |
|---|---|
| Constant | `SKIP_GATE_COST = 150` (line 35) |
| Handler | `handleSkipGate()` (lines 450–489) |
| UI | Two placements — header button + below-vault button, gate mode only |
| Guard | Button disabled when `localMomentum < 150`; `isSkipping` flag blocks double-tap |
| Client flow | `addPoints(-150)` immediately → POST → `syncMomentum(res.momentum_score)` → navigate with `{ lexigridCompleted: true }` |

The frontend sends exactly:
```json
POST /api/student/game-score
{
  "game_type": "LEXIGRID",
  "status": "skipped",
  "momentum_spent": 150,
  "session_token": "<token or null>"
}
```

---

## What Was Built (Backend)

**File:** `backend-study-mentor/src/controllers/gameScoreController.ts`  
**Function:** `saveGameScore()` — added a skip branch and updated the catch block.

### New constant
```typescript
const SKIP_GATE_COST = 150;  // must match frontend SKIP_GATE_COST
```

### Skip branch — early return before normal completion logic

The entire skip path runs inside `prisma.$transaction(async (tx) => {...})` for atomicity.

#### Step-by-step inside the transaction

| Step | Action | Why |
|---|---|---|
| 1 | `tx.studentGameScore.findFirst(...)` | Idempotency check — if record exists, gate already open |
| 2 | If exists → return current balance, `already_done: true` | No double-deduct on retry/duplicate request |
| 3 | `tx.institute_students.updateMany({ WHERE momentum_score >= 150 })` | Atomic guard — if student has < 150, `count=0` |
| 4 | If `count === 0` → `throw new Error('INSUFFICIENT_MOMENTUM')` | Triggers transaction rollback, record not created |
| 5 | `tx.studentGameScore.create({ completed: true, skipped: true, words_solved: 0 })` | Marks gate passed and explicitly flags this as a skip |
| 6 | Re-fetch `momentum_score` from DB | Authoritative post-deduction balance for response |

#### Response shape
```json
{ "success": true, "skipped": true, "already_done": false, "momentum_score": 1100 }
```

### Updated catch block
```typescript
} catch (err: any) {
    if (err?.message === 'INSUFFICIENT_MOMENTUM') {
        return res.status(400).json({
            success:  false,
            error:    "Insufficient momentum. You need 150 pts to skip the LexiGrid gate.",
            required: 150,
        });
    }
    // ... existing 500 handler
}
```

---

## Schema Change

**File:** `backend-study-mentor/prisma/schema.prisma`

Added `skipped Boolean @default(false)` to `StudentGameScore`:

```prisma
model StudentGameScore {
  ...
  completed       Boolean   @default(false)
  skipped         Boolean   @default(false)   // ← new
  played_word_ids Json?
  ...
}
```

Applied via `prisma db push` (no shadow DB required). All existing rows default to `skipped = false`.

### How to read skip records in the DB

| `skipped` | `words_solved` | `total_attempts` | Meaning |
|---|---|---|---|
| `true` | `0` | `0` | Gate skipped — student spent 150 momentum |
| `false` | `0` | `> 0` | Gate played, all words failed |
| `false` | `> 0` | `> 0` | Gate played normally |

#### Backfill for existing pre-column rows

```sql
UPDATE student_game_scores
SET skipped = true
WHERE game_type = 'LEXIGRID'
  AND words_solved = 0
  AND total_attempts = 0
  AND completed = true;
```

Safe because a legitimate zero-score play always has `total_attempts > 0`.

---

## Frontend Fix: `played_word_ids` Always Null

**File:** `src/features/student/components/LexiGrid.tsx`

Three changes made to ensure word IDs flow from API response → state → submit payload:

1. **`WordItem` interface** — added `id?: string`
2. **`fetchWords` mapping** — added `id: w.id` to preserve the ID from the API response
3. **`submitLexiGridSession`** — builds `playedIds` from `dailyWords` and includes `played_word_ids` in POST body

```typescript
const playedIds = dailyWords.map(w => w.id).filter(Boolean) as string[];
const payload = {
  ...
  played_word_ids: playedIds.length > 0 ? playedIds : undefined,
};
```

Fallback words (from `FALLBACK_WORD_BANK`) have no `id`, so `played_word_ids` is omitted rather than sent as an empty array.

**Backend** (`gameScoreController.ts` upsert `update` path) also updated to write `played_word_ids` on re-submissions (was only in `create` before).

---

## Why `$transaction` — Not Just Separate Queries

| Threat | How the transaction stops it |
|---|---|
| **Double-spend (network retry)** | Second call hits idempotency check inside tx (read-consistent) → returns without deducting |
| **Race condition (two concurrent skip requests)** | First deducts and creates record. Second: INSERT fails on unique constraint `(student_id, game_type, session_date)` → unique violation throws → Prisma rolls back the deduct |
| **Momentum deducted but record not written** | If `create` fails for any reason, the entire tx rolls back including the `updateMany` |
| **Record created without deduction** | If `updateMany` returns `count=0`, we `throw` before reaching `create` → tx rolls back |

The pattern mirrors `authorizeExtraDrill()` which uses the same `updateMany` WHERE-guard pattern, extended here with a full interactive transaction.

---

## How `lexigrid_completed_today` Gets Set

`getDailyDrillState()` computes:
```typescript
const lexiGridRecord = await prisma.studentGameScore.findFirst({
    where: { student_id: student.id, game_type: 'LEXIGRID', session_date: sessionToday }
});
const lexigrid_completed_today = !!lexiGridRecord;  // any record = gate passed
```

The skip creates a record with `completed: true`, `skipped: true`, `words_solved: 0`. This record is found by the above query → `lexigrid_completed_today = true` → `next_action` flips from `LEXIGRID` to `DRILL_2`. No change to `getDailyDrillState()` was needed.

---

## How Dashboard Unlocks After Drill 2

`getDailyDrillState()`:
```typescript
const dashboard_unlocked = drills_completed_today >= 2;
```

Skip does not count as a drill. The unlock path is unchanged:
1. Student skips LexiGrid → gate passed
2. Student completes Drill 2 → `drills_completed_today = 2`
3. Dashboard `dashboard_unlocked = true`

No change to drill or dashboard logic was needed.

---

## Edge Cases Handled

| Case | Behaviour |
|---|---|
| Skip called twice (double-tap / network retry) | Idempotency check inside tx → `already_done: true`, no second deduction |
| Student already played LexiGrid, then skip called | Idempotency check finds existing record → `already_done: true`, no deduction |
| Student skipped, then plays LexiGrid in standalone mode | Record exists; normal completion upsert updates `words_solved` but `wasAlreadyComplete = true` → no double momentum award |
| Insufficient momentum (< 150) | `updateMany` WHERE guard returns `count=0` → throws → tx rolls back → 400 response |
| Two concurrent skip requests race | Second INSERT hits unique constraint → tx rolls back deduct → 409/500 from Prisma, first request succeeds cleanly |
| Skip sent with invalid `game_type` | Immediate 400 before any DB write |
| `momentum_spent` client value tampered | Ignored — server uses `SKIP_GATE_COST = 150` constant |
| Session token absent / invalid | Not validated for skip path — student may not have loaded words yet |

---

## Idempotency Key

No separate idempotency header is needed. The natural key is:

```
(student_id, game_type = 'LEXIGRID', session_date = <today IST>)
```

This is enforced by the `@@unique` constraint on `StudentGameScore`:
```prisma
@@unique([student_id, game_type, session_date])
```

Any second attempt — whether from a retry, double-tap, or concurrent request — either:
- Hits the `findFirst` check inside the transaction (already_done), or
- Fails on the unique constraint INSERT (which rolls back the deduct)

---

## What Did NOT Change

| Item | Status |
|---|---|
| `getDailyDrillState()` | Unchanged — already uses `!!lexiGridRecord` |
| Drill controller | Unchanged — skip + normal play both set the same gate flag |
| Dashboard unlock logic | Unchanged — still `drills_completed >= 2` |
| Frontend skip handler (`handleSkipGate`) | Unchanged — was pre-built |
| Frontend (StudentDashboardPage.tsx) | Unchanged — already handles `lexigridCompleted` state |
| Routes | Unchanged — same `POST /api/student/game-score` endpoint |

---

## Files Changed

| File | Change |
|---|---|
| `backend-study-mentor/prisma/schema.prisma` | Added `skipped Boolean @default(false)` to `StudentGameScore` |
| `backend-study-mentor/src/controllers/gameScoreController.ts` | Added `SKIP_GATE_COST = 150`; added skip branch; added `skipped: true` to create; added `played_word_ids` to upsert update path; updated catch block |
| `src/features/student/components/LexiGrid.tsx` | Added `id` to `WordItem` interface; preserved `id` in `fetchWords` mapping; added `played_word_ids` to submit payload |

---

## Audit Checklist

- [x] Atomic — deduct and record creation in single `$transaction`
- [x] Idempotent — existing record check inside tx prevents double-deduct
- [x] Race-safe — unique constraint + WHERE guard cover concurrent requests
- [x] No free skips — `count=0` throw rolls back any partial state
- [x] Client value ignored — `momentum_spent` from body not used; server constant enforced
- [x] Gate state correct — `completed: true` record triggers `lexigrid_completed_today = true`
- [x] Drill 2 unlock — `next_action = 'DRILL_2'` follows naturally from gate state
- [x] Dashboard unlock — unchanged path; still requires completing Drill 2
- [x] Skips distinguishable in data — `skipped = true` column, backfill SQL provided
- [x] `played_word_ids` now populated — frontend maps word IDs, backend persists on both create and update paths
