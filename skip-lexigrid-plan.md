# Skip LexiGrid — Implementation Plan

## What's Already Done (Frontend)

`LexiGrid.tsx` is **fully implemented**. No frontend changes needed.

### What the frontend already does:

- `SKIP_GATE_COST = 150` constant (line 35)
- `handleSkipGate()` (lines 450–489):
  1. `addPoints(-150)` — immediate client-side deduction so topbar reflects it instantly
  2. `POST /api/student/game-score` with body `{ game_type: "LEXIGRID", status: "skipped", momentum_spent: 150, session_token: <token> }`
  3. `syncMomentum(res.momentum_score)` — reconciles if server value differs
  4. Clears localStorage `lexigrid_state`
  5. `navigate('/student/dashboard', { state: { lexigridCompleted: true } })`
- Skip button shown only in `mode=gate`, disabled if `localMomentum < 150`
- Dashboard already re-fetches `GET /api/student/daily-drill-state` on `lexigridCompleted` state flag

---

## What Needs to Be Built (Backend)

Only **one function** needs to change: `saveGameScore()` in  
`backend-study-mentor/src/controllers/gameScoreController.ts`

The endpoint is `POST /api/student/game-score` — same one used for normal completion.

---

## Current vs Target Behaviour

| Scenario | `lexigrid_completed_today` | `next_action` returned | Momentum |
|---|---|---|---|
| Normal completion (5 words) | true | DRILL_2 | +15–80 pts |
| **Skip (new)** | **true** | **DRILL_2** | **−150 pts** |
| No LexiGrid today | false | LEXIGRID | — |

---

## Backend Change: `saveGameScore()` — Handle `status: 'skipped'`

### Location
`backend-study-mentor/src/controllers/gameScoreController.ts`  
Function: `saveGameScore` (line ~140)

### Logic to add at the top of the handler, before normal-completion logic:

```
IF req.body.status === 'skipped':
  1. Validate
     - `game_type` must be 'LEXIGRID'
     - Only valid in gate context (cannot skip standalone) — enforce via momentum check, not flag
     - `momentum_spent` must equal SKIP_GATE_COST (150) — server-side constant wins, ignore client value

  2. Load student record
     - `instStudent = institute_students.findFirst({ where: { user_id: appUserId } })`
     - If not found → 403

  3. Check idempotency
     - Query `studentGameScore` for (student_id, 'LEXIGRID', todayIST)
     - If record exists AND completed = true → return current momentum_score (already skipped/completed)

  4. Atomic deduct + record (single transaction)
     - `institute_students.updateMany({
         where: { id: instStudent.id, momentum_score: { gte: SKIP_GATE_COST } },
         data:  { momentum_score: { decrement: SKIP_GATE_COST } }
       })`
     - If count === 0 → 400 "Insufficient momentum"
     - `studentGameScore.upsert({
         where: { student_id_game_type_session_date: { student_id, game_type: 'LEXIGRID', session_date: todayISTDate } },
         create: { student_id, game_type: 'LEXIGRID', session_date: todayISTDate,
                   words_solved: 0, total_words: 5, total_attempts: 0,
                   bonus_eligible: false, momentum_earned: 0, completed: true },
         update: { completed: true }   // idempotent in case a partial record exists
       })`

  5. Fetch updated momentum
     - `updated = institute_students.findUnique({ where: { id: instStudent.id }, select: { momentum_score } })`

  6. Return
     - `{ success: true, momentum_score: updated.momentum_score, skipped: true }`
     - Early return — do NOT fall through to normal completion logic
```

### Why `completed: true` matters

`getDailyDrillState()` determines `lexigrid_completed_today` by querying:
```
studentGameScore WHERE student_id = X AND game_type = 'LEXIGRID'
                       AND session_date = todayIST AND completed = true
```
Setting `completed: true` on the skip record makes `next_action` flip to `DRILL_2` immediately.

### Constants (use server-side, not client-supplied value)

```typescript
const SKIP_GATE_COST = 150;   // same as frontend constant — single source of truth on server
```

---

## What Does NOT Change

| Item | Status | Reason |
|---|---|---|
| Frontend (LexiGrid.tsx) | No change | Fully implemented |
| Frontend (Dashboard) | No change | Already handles `lexigridCompleted` state |
| `getDailyDrillState()` | No change | Already uses `completed` flag |
| `POST /api/student/game-score` route | No change | Same endpoint, same path |
| Prisma schema | No change | No new columns needed |
| `studentGameScore` unique constraint | No change | `(student_id, game_type, session_date)` handles idempotency |
| Session token | Skip — do not validate HMAC | Student may skip before words load; token may not exist |

---

## Edge Cases to Handle

| Case | Handling |
|---|---|
| Student has exactly 150 momentum | `gte: 150` check passes — allowed |
| Student has < 150 momentum | `updateMany` returns count=0 → 400 error |
| Student already completed LexiGrid today (played it before skipping) | Idempotency check returns current score, no double-deduction |
| Student calls skip twice (double-tap) | First deducts, second hits idempotency check (completed=true already) |
| Skip outside gate mode (standalone) | Frontend prevents this (button only shown in gate mode); backend doesn't care — momentum deducted anyway |
| No `institute_students` record | 403 — standard check |

---

## Files to Change

| File | Change |
|---|---|
| `backend-study-mentor/src/controllers/gameScoreController.ts` | Add skip branch in `saveGameScore()` |

That's it — one file, one function.
