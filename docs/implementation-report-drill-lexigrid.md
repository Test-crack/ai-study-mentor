# Technical Implementation Report — Drill Session & LexiGrid Flow

> Generated: 2026-04-25
> Scope: Daily drill lock/unlock system, LexiGrid gate, momentum economy, backend persistence

---

## 1. Database Schema

### `institute_students` (existing table, extended)


| Column           | Type  | Default | Purpose                                                                                                                                                                          |
| ---------------- | ----- | ------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `momentum_score` | `INT` | `0`     | Persisted authoritative momentum total. Updated server-side on every drill completion and LexiGrid completion. Replaces the previous localStorage-only value as source of truth. |


### `drill_sessions` (existing table, extended)


| Column             | Type       | Default | Purpose                                                                                               |
| ------------------ | ---------- | ------- | ----------------------------------------------------------------------------------------------------- |
| `correct_answers`  | `SMALLINT` | `0`     | How many of the 5 MCQ prompts were answered correctly. Used server-side to compute `momentum_earned`. |
| `total_questions`  | `SMALLINT` | `5`     | Always 5 — explicit for future queries and analytics.                                                 |
| `is_extra_session` | `BOOLEAN`  | `false` | Marks sessions that were purchased with 75 pts beyond the 2 free daily sessions.                      |


### `student_game_scores` (new table)


| Column            | Type          | Notes                                                |
| ----------------- | ------------- | ---------------------------------------------------- |
| `id`              | `UUID`        | PK                                                   |
| `student_id`      | `UUID`        | FK → `institute_students.id`                         |
| `game_type`       | `VARCHAR(30)` | `'LEXIGRID'` or `'GRAMMAR_SWIPE'` (future)           |
| `session_date`    | `DATE`        | Calendar date of play. Unique per student+game+date. |
| `words_solved`    | `INT`         | How many words the student solved (0–5 for LexiGrid) |
| `total_attempts`  | `INT`         | Total letter submissions made across all words       |
| `bonus_eligible`  | `BOOLEAN`     | `true` if every solved word used ≤ 3 attempts        |
| `momentum_earned` | `INT`         | Awarded momentum (10 base + 5 bonus if eligible)     |
| `completed`       | `BOOLEAN`     | `true` once `words_solved >= 5`                      |
| `score_data`      | `JSONB`       | Flexible extension slot (unused for now)             |


**Constraint:** `UNIQUE(student_id, game_type, session_date)` — enforces one LexiGrid session per student per calendar day. The upsert logic means a student can be in mid-session and resume without duplicate rows.

---

## 2. SQL Queries (run in pgAdmin in order)

```sql
-- ═══════════════════════════════════════════════════════
-- BLOCK 1 — Add momentum_score to institute_students
-- ═══════════════════════════════════════════════════════
ALTER TABLE institute_students
  ADD COLUMN momentum_score INTEGER NOT NULL DEFAULT 0;


-- ═══════════════════════════════════════════════════════
-- BLOCK 2 — Enrich drill_sessions with scoring fields
-- ═══════════════════════════════════════════════════════
ALTER TABLE drill_sessions
  ADD COLUMN correct_answers  SMALLINT NOT NULL DEFAULT 0,
  ADD COLUMN total_questions  SMALLINT NOT NULL DEFAULT 5,
  ADD COLUMN is_extra_session BOOLEAN  NOT NULL DEFAULT FALSE;


-- ═══════════════════════════════════════════════════════
-- BLOCK 3 — Generic mini-game scores table
-- ═══════════════════════════════════════════════════════
CREATE TABLE student_game_scores (
  id               UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id       UUID         NOT NULL REFERENCES institute_students(id) ON DELETE CASCADE,
  game_type        VARCHAR(30)  NOT NULL CHECK (game_type IN ('LEXIGRID', 'GRAMMAR_SWIPE')),
  session_date     DATE         NOT NULL DEFAULT CURRENT_DATE,
  words_solved     INTEGER      NOT NULL DEFAULT 0,
  total_attempts   INTEGER      NOT NULL DEFAULT 0,
  bonus_eligible   BOOLEAN      NOT NULL DEFAULT FALSE,
  momentum_earned  INTEGER      NOT NULL DEFAULT 0,
  completed        BOOLEAN      NOT NULL DEFAULT FALSE,
  score_data       JSONB,
  created_at       TIMESTAMPTZ  NOT NULL DEFAULT NOW(),

  CONSTRAINT uq_student_game_date UNIQUE (student_id, game_type, session_date)
);

CREATE INDEX idx_game_scores_student ON student_game_scores(student_id);
CREATE INDEX idx_game_scores_date    ON student_game_scores(session_date);
```

After running the SQL, regenerate the Prisma client:

```bash
cd backend-study-mentor
npx prisma generate
```

---

## 3. System Constants


| Constant                   | Value    | Location                 |
| -------------------------- | -------- | ------------------------ |
| `FREE_SESSIONS_PER_DAY`    | `2`      | `gameScoreController.ts` |
| `MAX_SESSIONS_PER_DAY`     | `5`      | `gameScoreController.ts` |
| `EXTRA_SESSION_COST`       | `75 pts` | `gameScoreController.ts` |
| `LEXIGRID_BASE_PTS`        | `10`     | `gameScoreController.ts` |
| `LEXIGRID_BONUS_PTS`       | `5`      | `gameScoreController.ts` |
| `DRILL_BASE_PTS`           | `15`     | `drillController.ts`     |
| `DRILL_PER_CORRECT`        | `10`     | `drillController.ts`     |
| `QUESTIONS_PER_SESSION`    | `5`      | `drillController.ts`     |
| Max drill momentum/session | `65 pts` | `15 + 5×10`              |
| Min drill momentum/session | `15 pts` | all wrong                |


---

## 4. Backend — API Endpoints

### `GET /api/student/daily-drill-state`

**Auth:** Required (STUDENT role)
**Purpose:** Single source of truth the dashboard calls on mount to determine the student's exact position in the day's flow.

**Logic:**

1. Queries `drill_sessions` where `created_at >= today_midnight` → `drills_completed_today`
2. Queries `student_game_scores` where `game_type = 'LEXIGRID'` AND `session_date >= today_midnight` AND `completed = true` → `lexigrid_completed_today`
3. Derives `dashboard_unlocked = drills_completed_today >= 2`
4. Computes `next_action` via this decision tree:

```
drills_today = 0                              → DRILL_1
drills_today = 1, lexigrid_done = false       → LEXIGRID
drills_today = 1, lexigrid_done = true        → DRILL_2
drills_today >= MAX (5)                       → DAILY_LIMIT_REACHED
drills_today >= FREE (2), momentum >= 75      → EXTRA_DRILL_AVAILABLE
drills_today >= FREE (2), momentum < 75       → DRILL_LOCKED_INSUFFICIENT_PTS
```

1. Returns: `drills_completed_today`, `lexigrid_completed_today`, `dashboard_unlocked`, `next_action`, `extra_sessions_today`, `sessions_remaining`, `momentum_score`, `can_buy_extra`, `free_sessions`, `extra_session_cost`

**Critical detail:** The cutoff uses `todayStart = new Date(); todayStart.setHours(0,0,0,0)` — a calendar-day boundary, not a rolling 24-hour window. Sessions reset at midnight.

---

### `POST /api/student/game-score`

**Auth:** Required (STUDENT role)
**Body:** `{ game_type, words_solved, total_attempts, bonus_eligible }`
**Purpose:** Called by LexiGrid when the student finishes their session (5 words solved or session ends).

**Logic:**

1. `completed = words_solved >= 5`
2. `momentum_earned = 10 + (bonus_eligible ? 5 : 0)` — only when completed
3. Upserts `student_game_scores` with unique key `(student_id, game_type, session_date)` — idempotent if called multiple times
4. If `completed && momentum_earned > 0`: increments `institute_students.momentum_score`
5. Returns: `{ momentum_earned, momentum_score, next_action }` where `next_action = 'DRILL_2'` on completion

---

### `GET /api/student/next-action-drill`

**Auth:** Required (STUDENT role)
**Purpose:** Returns the prioritized ordered list of sub-skills to drill today, filtered to exclude what was already done today.

**Logic:**

1. Builds `DrillItem[]` from `StudentCompetencyMatrix` — maps each sub-score into `{ skill, sub_skill, skill_band_score, sub_skill_score }`
2. Groups by skill, sorts within each skill by score ascending (weakest first)
3. Ranks skill queues by their lowest sub-skill score (weakest skill prioritised)
4. Interleaves queues in round-robin — alternates skills instead of exhausting one skill before moving to the next
5. Filters out sub-skills already practiced today (same calendar-day boundary)
6. Early-returns empty list if `drills_today >= MAX_DAILY_SESSIONS`
7. Returns: `recommended_drills[]`, `daily_sessions_completed`, `daily_limit`, `sessions_remaining`, `message`

---

### `GET /api/drills/questions`

**Auth:** Required (STUDENT role)
**Query params:** `skill`, `subskill`, `level`
**Purpose:** Fetches exactly 5 random active questions for the given skill/subskill/level.

Uses Prisma `$queryRaw` with `ORDER BY RANDOM() LIMIT 5`. The `count` query param is no longer accepted from the client — always 5. Filters: `is_active = true`, exact Postgres enum casts.

---

### `POST /api/drills/session`

**Auth:** Required (STUDENT role)
**Body:** `{ skill, subskill, prompts_completed, correct_answers, is_extra_session }`
**Purpose:** Saves a completed drill session and awards momentum atomically.

**Logic:**

1. Validates required fields
2. Computes `momentum_earned = 15 + correct_answers * 10`
3. Runs a **Prisma `$transaction`** that atomically:
  - Creates a `DrillSession` record with all fields
  - Increments `institute_students.momentum_score` by `momentum_earned`
4. Returns: `{ data: session, momentum_earned, momentum_score }`

The returned `momentum_score` is the new authoritative total which the frontend uses to sync its local state via `syncMomentum()`.

---

### `POST /api/drills/authorize-extra`

**Auth:** Required (STUDENT role)
**Purpose:** Pre-authorizes an extra drill session by deducting 75 pts before the student starts drilling.

**Guards (all checked before deducting):**

- `momentum_score >= 75` — student has enough pts
- `drills_today >= FREE_SESSIONS_PER_DAY` — free sessions already used
- `drills_today < MAX_SESSIONS_PER_DAY` — daily cap not hit

Deducts via `institute_students.update({ momentum_score: { decrement: 75 } })`. Returns `{ momentum_score, sessions_remaining }`. The frontend then navigates to `/student/drill?...&extra=true`, and when the session saves, `is_extra_session: true` is passed in the body.

---

## 5. Frontend — Component-Level Implementation

### `MomentumContext.tsx`

**Pattern:** React context + localStorage persistence with backend override capability.

**State:**

- `totalMomentum` — initialized from `localStorage['testcrack_momentum']` or `120` (default)
- `streak` — initialized from `localStorage['testcrack_streak']` or `2`
- `appliedPenalties` — `Set<string>` of cycle keys, prevents double-deduction on re-renders

**Functions:**

- `addPoints(pts)` — increments `totalMomentum`, persists to localStorage
- `deductPoints(pts)` — decrements, floors at 0 (momentum cannot go negative)
- `syncMomentum(serverScore)` — **overwrites** `totalMomentum` with the backend value. Called after every drill save, LexiGrid completion, and on dashboard mount. This is how frontend stays in sync with the DB without polling.
- `applyMissPenalty(missCount, cycleKey)` — checks `appliedPenalties` set; if key not seen, deducts 20 or 40 pts and adds key to set; returns `true` if newly applied. Miss 1 = −20 pts, Miss 2 = −40 pts.

**Known limitation:** `totalMomentum` initializes from localStorage on page load. The `fetchDailyDrillState()` call on dashboard mount overwrites it immediately via `syncMomentum`, so there is a brief flash of the stale localStorage value before the real one loads.

---

### `StudentDashboardPage.tsx`

**New state:**

- `dailyDrillState` — full response object from `GET /api/student/daily-drill-state`
- `buyingExtra` — boolean, prevents double-click on the "Spend 75 pts" button

**On mount (`useEffect([], [])`) — three parallel async calls:**

1. `fetchCompetencyScores()` → `GET /api/student/competency-scores` → populates `skillBands`
2. `fetchNextActionDrill()` → `GET /api/student/next-action-drill` → populates `nextActionDrill`
3. `fetchDailyDrillState()` → `GET /api/student/daily-drill-state` → populates `dailyDrillState`, calls `syncMomentum(resData.momentum_score)`

Plus: localStorage-based `completedDrills` restore (kept as fallback), attendance/streak tracking.

`**isLocked` logic:**

```typescript
// Backend is authoritative once loaded; localStorage is fallback during initial fetch
isLocked = dailyDrillState
  ? (!dailyDrillState.dashboard_unlocked || missedData.misses >= 2)
  : (completedDrills.length < 2 || missedData.misses >= 2)
```

**Lock banner:** Renders when `isLocked && missedData.misses < 2 && dailyDrillState`. Message dynamically switches:

- `next_action === 'LEXIGRID'` → "Complete LexiGrid (5 words) to unlock Drill 2"
- Otherwise → "Complete N more priority drills..."

**FocusAreaCard section (IIFE):**
Reads `dailyDrillState` to derive `drillsToday`, `nextAction`, `drillLocked`, `canBuyExtra`.

- `isLocked || drillLocked` passed to the card to grey/disable the start button
- `onStart` navigates to `/student/drill?skill=...&sub_skill=...` and appends `extra=true` if it's a paid session
- Renders the "Spend 75 pts" purchase button when `drillsToday >= 2 && nextAction !== 'DAILY_LIMIT_REACHED'`
- `handleBuyExtra()`: calls `POST /api/drills/authorize-extra`, on success syncs momentum and re-fetches `daily-drill-state` to update button state

**LexiGrid card section (IIFE):**

- `isLexiGate = next_action === 'LEXIGRID'`
- `lexiBlocked = !isLexiGate && isLocked` — LexiGrid is accessible even while dashboard is locked if it's the active gate
- Shows pulsing "Active Gate" badge when it's the gate; "✓ Done" when `lexigrid_completed_today = true`
- Border switches from `indigo` to `teal` when it's the active gate

---

### `DrillScreen.tsx`

**URL params read:** `skill`, `sub_skill`, `level`, `extra` (new — `'true'` when purchased extra session)

**Question fetch:**
`GET /api/drills/questions?skill=...&subskill=...&level=...` — no `count` param, backend always returns 5. `totalPrompts = prompts.length || 5`.

`**saveSessionAndComplete(finalCorrectCount)`:**

- Computes `earned = 15 + finalCorrectCount * 10` locally (mirrors backend formula) for immediate display
- Posts to `POST /api/drills/session` with `{ skill, subskill, prompts_completed, correct_answers, is_extra_session }`
- On success: calls `syncMomentum(res.momentum_score)` to sync the context with the backend's authoritative total
- Navigates to `DrillResultCard` on completion

`**handleNextPrompt(pointsEarnedThisPrompt)`:**
`McqDrill` passes `10` for correct, `2` for incorrect. `pointsEarnedThisPrompt === 10` is the correct-answer signal. Increments `correctAnswersCount` only on correct answers. On the final prompt, calls `saveSessionAndComplete(newCorrectCount)`.

---

### `McqDrill.tsx`

Renders a single MCQ prompt with 4 options (A/B/C/D).

**Correct answer parsing:** Handles both raw string and JSON-wrapped string (`JSON.parse` with try/catch fallback). Normalizes to uppercase for comparison.

**Scoring signal:** Calls `onComplete(10)` for correct, `onComplete(2)` for incorrect — so DrillScreen's `=== 10` check is unambiguous.

**UX:** Shows color-coded feedback (green = correct, red = wrong, blue = revealed correct answer on wrong) + explanation text before advancing.

---

### `LexiGrid.tsx`

**New additions to the existing game:**

**Refs added:**

- `totalAttemptsRef` — accumulates total letter submissions across the entire session
- `allBonusEligibleRef` — starts `true`, set to `false` if any single word took more than `MAX_TRIES` attempts

`**triggerWinAnimation(attemptsForThisWord)`** (updated signature):

- Receives `attemptsForThisWord = MAX_TRIES - triesLeft + 1`
- If `attemptsForThisWord > MAX_TRIES` → sets `allBonusEligibleRef.current = false`
- Adds to `totalAttemptsRef.current`
- Still fires the flying score animation and calls `addPoints(POINTS_PER_WORD)` locally for immediate UI feedback

`**submitLexiGridSession(finalWordsWon)**` (new):

- Called when `nextIndex >= DAILY_LIMIT` (5th word processed)
- Reads `totalAttemptsRef.current` and `allBonusEligibleRef.current`
- `bonusEligible = allBonusEligibleRef.current && finalWordsWon >= DAILY_LIMIT`
- Posts to `POST /api/student/game-score`
- On success: calls `syncMomentum(res.momentum_score)`

**Note:** The local `addPoints` fires per-word for immediate UI feedback. The backend call at the end reconciles the authoritative total, which `syncMomentum` then applies. Intentional dual-write — user sees points in real-time, backend total corrects it cleanly at session end.

---

### `DrillResultCard.tsx`

After a drill completes:

- Shows momentum earned, total momentum, streak
- Video recommendation gate (YouTube link, 30s timer before "Mark as Watched" enables)
- Reflection submission (minimum 8 words)
- On reflection submit: writes `subSkill` to `localStorage['completed_drills_today']` (still used as fallback for `completedDrills` state in dashboard before backend state loads)
- Calls `onUnlockNext()` which navigates to `ApplyDrillScreen`

---

### `ApplyDrillScreen.tsx`

The free-response "apply" step shown after the video reflection. On completion: calls `addPoints(initialScore + 30)` locally (flat +30 pts for completing the full daily loop). **No backend call here** — momentum from this step is not yet persisted to `institute_students.momentum_score`.

---

### `StudentSidebar.tsx`

Receives `isLocked` as a prop from the dashboard. Each nav item checks `isPlatformLocked`. Locked items render with a lock icon, reduced opacity, and disabled `pointer-events`. The sidebar reflects the dashboard's lock state but does not independently fetch from the backend.

---

## 6. End-to-End Daily Flow

```
LOGIN
  │
  ├── Dashboard mounts
  │     ├── fetchDailyDrillState()     → next_action = 'DRILL_1'
  │     ├── fetchNextActionDrill()     → recommended_drills[0] = weakest sub-skill
  │     └── fetchCompetencyScores()   → skillBands populated
  │     isLocked = true (0/2 drills)
  │
  ├── Student clicks "Start Drill" on FocusAreaCard
  │     → /student/drill?skill=X&sub_skill=Y
  │
  ├── DrillScreen fetches 5 MCQ questions from /api/drills/questions
  │
  ├── Student answers 5 prompts (McqDrill tracks correct/incorrect)
  │
  ├── DrillScreen calls POST /api/drills/session
  │     ← { momentum_earned: 15+N*10, momentum_score: updated_total }
  │     → syncMomentum(momentum_score)
  │
  ├── DrillResultCard → video → reflection → ApplyDrillScreen
  │     → localStorage['completed_drills_today'] updated
  │
  ├── Student returns to dashboard
  │     → fetchDailyDrillState() → next_action = 'LEXIGRID'
  │     isLocked = true (1/2 drills)
  │     LexiGrid card shows "Active Gate" + teal border + pulse badge
  │
  ├── Student plays LexiGrid (5 words)
  │     → submitLexiGridSession() → POST /api/student/game-score
  │     ← { momentum_earned: 10(+5 bonus), momentum_score: updated }
  │     → syncMomentum()
  │
  ├── Dashboard refresh
  │     → fetchDailyDrillState() → next_action = 'DRILL_2'
  │     isLocked = true (1/2 drills, lexigrid done, drill 2 not yet done)
  │
  ├── Student does Drill 2
  │     → same DrillScreen flow
  │     → POST /api/drills/session
  │
  ├── Dashboard refresh
  │     → fetchDailyDrillState()
  │     → dashboard_unlocked = true, next_action = 'EXTRA_DRILL_AVAILABLE'
  │     isLocked = false  ← FULL SIDEBAR UNLOCKED
  │     "Spend 75 pts" button appears
  │
  └── Student can spend 75 pts × up to 3 more times → up to 5 drills total
        POST /api/drills/authorize-extra → deducts 75 pts
        → /student/drill?...&extra=true
        → POST /api/drills/session with is_extra_session=true
```

---

## 7. Files Changed

### Backend (`backend-study-mentor/`)


| File                                     | Change                                                                                                                                                                                                                                                                 |
| ---------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `prisma/schema.prisma`                   | Added `momentum_score` to `institute_students`; added `correct_answers`, `total_questions`, `is_extra_session` to `DrillSession`; added new `StudentGameScore` model                                                                                                   |
| `src/controllers/drillController.ts`     | `saveDrillSession` now takes `correct_answers`, computes `15 + correct * 10`, increments `momentum_score` in a Prisma transaction; `getDrillQuestions` pinned to 5 questions; `getNextActionDrill` switched to calendar-day cutoff with `MAX_DAILY_SESSIONS = 5` guard |
| `src/controllers/gameScoreController.ts` | **New file** — `getDailyDrillState`, `saveGameScore` (LexiGrid), `authorizeExtraDrill`                                                                                                                                                                                 |
| `src/routes/studentRoutes.ts`            | Added `GET /daily-drill-state`, `POST /game-score`                                                                                                                                                                                                                     |
| `src/routes/drillRoutes.ts`              | Added `POST /authorize-extra`                                                                                                                                                                                                                                          |


### Frontend (`ai-study-mentor/`)


| File                                                       | Change                                                                                                                                                                                                                                              |
| ---------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `src/features/student/Context/MomentumContext.tsx`         | Added `syncMomentum(serverScore)` to interface and implementation                                                                                                                                                                                   |
| `src/features/student/components/Drills/DrillScreen.tsx`   | Reads `extra` URL param; sends `correct_answers` + `is_extra_session`; calls `syncMomentum` after session save; removed random count                                                                                                                |
| `src/features/student/components/LexiGrid.tsx`             | Added `totalAttemptsRef`, `allBonusEligibleRef`; added `submitLexiGridSession()`; updated `triggerWinAnimation` signature; calls backend on 5th word completion                                                                                     |
| `src/features/student/components/StudentDashboardPage.tsx` | Added `dailyDrillState` + `buyingExtra` state; fetches `daily-drill-state` on mount; `isLocked` uses backend truth; lock banner shows gate-aware message; LexiGrid card shows "Active Gate" UI; "Spend 75 pts" button with `handleBuyExtra` handler |


---

## 8. Known Gaps & Pending Work


| Gap                                              | Detail                                                                                                                                                                                                                       |
| ------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Prisma client stale**                          | All new columns/models will throw TypeScript errors until `npx prisma generate` is run after SQL is applied                                                                                                                  |
| `**missedData` is mock**                         | `MOCK_MISSED_STATE = 1` hardcoded in `StudentDashboardPage`. Tutor-alert and IA miss penalties not yet wired to a real backend endpoint                                                                                      |
| `**ApplyDrillScreen` momentum not persisted**    | The `addPoints(initialScore + 30)` call is local-only. A backend call should be added here to persist the +30 pts                                                                                                            |
| **No auto-refresh after drill**                  | After a drill/LexiGrid completes, the student must navigate back to the dashboard for `fetchDailyDrillState()` to re-run. No post-completion callback or polling is wired                                                    |
| **Two sources of truth for completed drills**    | `localStorage['completed_drills_today']` (by sub-skill name) and the backend `DrillSession` count coexist. The localStorage list is still the source for the `DrillResultCard` sub-skill knockout and the dashboard fallback |
| `**level` param hardcoded**                      | `DrillScreen` defaults to `'INTERMEDIATE'`. No logic yet to infer the correct level from the student's competency matrix band score                                                                                          |
| `**getNextActionDrill` vs `getDailyDrillState`** | Both called independently on mount. `getNextActionDrill` does not enforce the free/paid session boundary — it only filters by today's practiced set. Lock enforcement lives solely in `getDailyDrillState`                   |
| **No IA (Internal Assessment) backend**          | The IA trigger (6 drill sessions + 2 calendar days + avg DCS ≥ 40%) is not yet implemented                                                                                                                                   |
| **LexiGrid mid-session abandon**                 | If a student solves 3/5 words and closes the tab, `submitLexiGridSession` is never called. The localStorage state preserves their progress but the backend has no partial record until they return and finish                |


