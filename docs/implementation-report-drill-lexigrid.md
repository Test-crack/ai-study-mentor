# Technical Implementation Report — Drill Session & LexiGrid Flow

> Last updated: 2026-04-24 (Phase 5 — Production hardening pass)
> Scope: Daily drill lock/unlock system, LexiGrid gate, momentum economy, streak tracking, backend persistence

---

## 1. Database Schema

### `institute_students` (existing table, extended)

| Column              | Type      | Default | Purpose                                                                                                                                                                          |
| ------------------- | --------- | ------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `momentum_score`    | `INT`     | `0`     | Persisted authoritative momentum total. Updated server-side on every drill completion and LexiGrid completion. Replaces the previous localStorage-only value as source of truth. |
| `daily_streak`      | `INT`     | `0`     | Number of consecutive days the student has completed ≥ 2 drills. Incremented in `saveDrillSession` when the 2nd drill of the day is saved.                                       |
| `last_streak_date`  | `DATE`    | `NULL`  | The calendar date when `daily_streak` was last incremented. Used to detect gap days and decide whether to extend or reset the streak.                                            |

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

**Constraint:** `UNIQUE(student_id, game_type, session_date)` — enforces one LexiGrid session per student per calendar day.

---

## 2. SQL Queries (run in pgAdmin in order)

```sql
-- ═══════════════════════════════════════════════════════
-- BLOCK 1 — Add momentum_score to institute_students
-- ═══════════════════════════════════════════════════════
ALTER TABLE institute_students
  ADD COLUMN IF NOT EXISTS momentum_score INTEGER NOT NULL DEFAULT 0;


-- ═══════════════════════════════════════════════════════
-- BLOCK 2 — Enrich drill_sessions with scoring fields
-- ═══════════════════════════════════════════════════════
ALTER TABLE drill_sessions
  ADD COLUMN IF NOT EXISTS correct_answers  SMALLINT NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS total_questions  SMALLINT NOT NULL DEFAULT 5,
  ADD COLUMN IF NOT EXISTS is_extra_session BOOLEAN  NOT NULL DEFAULT FALSE;


-- ═══════════════════════════════════════════════════════
-- BLOCK 3 — Generic mini-game scores table
-- ═══════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS student_game_scores (
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

CREATE INDEX IF NOT EXISTS idx_game_scores_student ON student_game_scores(student_id);
CREATE INDEX IF NOT EXISTS idx_game_scores_date    ON student_game_scores(session_date);


-- ═══════════════════════════════════════════════════════
-- BLOCK 4 — Streak tracking on institute_students (Phase 5)
-- ═══════════════════════════════════════════════════════
ALTER TABLE institute_students
  ADD COLUMN IF NOT EXISTS daily_streak     INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS last_streak_date DATE;


-- ═══════════════════════════════════════════════════════
-- BLOCK 5 — LexiGrid test data
-- Replace '<YOUR_STUDENT_UUID>' with a real id from:
--   SELECT id FROM institute_students LIMIT 5;
-- ═══════════════════════════════════════════════════════

-- Simulate: student completed LexiGrid yesterday (for streak testing)
INSERT INTO student_game_scores
  (student_id, game_type, session_date, words_solved, total_attempts, bonus_eligible, momentum_earned, completed)
VALUES
  ('<YOUR_STUDENT_UUID>', 'LEXIGRID', CURRENT_DATE - INTERVAL '1 day', 5, 12, true,  15, true),
  ('<YOUR_STUDENT_UUID>', 'LEXIGRID', CURRENT_DATE - INTERVAL '2 day', 5, 18, false, 10, true),
  ('<YOUR_STUDENT_UUID>', 'LEXIGRID', CURRENT_DATE - INTERVAL '3 day', 3,  9, false,  0, false)
ON CONFLICT (student_id, game_type, session_date) DO NOTHING;

-- Simulate: two drill sessions yesterday (so streak = 1 going into today)
-- First get the sub-skill enum values your DB uses:
--   SELECT unnest(enum_range(NULL::"IeltsSubSkillType"));
INSERT INTO drill_sessions
  (student_id, skill, sub_skill, prompts_completed, correct_answers, total_questions, momentum_earned, is_extra_session)
VALUES
  ('<YOUR_STUDENT_UUID>', 'SPEAKING', 'PRONUNCIATION', 5, 3, 5, 45, false),
  ('<YOUR_STUDENT_UUID>', 'SPEAKING', 'FLUENCY',       5, 4, 5, 55, false)
ON CONFLICT DO NOTHING;

-- Bump momentum and streak on the student row to match the test data
UPDATE institute_students
SET
  momentum_score   = 120,
  daily_streak     = 1,
  last_streak_date = CURRENT_DATE - INTERVAL '1 day'
WHERE id = '<YOUR_STUDENT_UUID>';


-- ═══════════════════════════════════════════════════════
-- BLOCK 6 — Sample MCQ drill questions (5 per sub-skill)
-- Adjust skill/sub_skill/level enums to match your DB
-- ═══════════════════════════════════════════════════════
INSERT INTO drill_questions
  (skill, sub_skill, level, drill_type, prompt_text, options, correct_answer, explanation, is_active)
VALUES
  -- SPEAKING / PRONUNCIATION / INTERMEDIATE
  ('SPEAKING', 'PRONUNCIATION', 'INTERMEDIATE', 'MCQ',
   'Which word has a different stress pattern from the others?',
   '["A) phoTOgraphy", "B) phoTOgraph", "C) phoTOgraphic", "D) PHOtograph"]',
   '"D"',
   'PHOtograph has stress on the first syllable; the others stress the second.',
   true),
  ('SPEAKING', 'PRONUNCIATION', 'INTERMEDIATE', 'MCQ',
   'The "th" in "thin" is pronounced as which sound?',
   '["A) /d/", "B) /t/", "C) /θ/", "D) /ð/"]',
   '"C"',
   '/θ/ is the voiceless dental fricative used in "thin", "think", "therapy".',
   true),
  ('SPEAKING', 'PRONUNCIATION', 'INTERMEDIATE', 'MCQ',
   'Which sentence uses the correct word stress?',
   '["A) I need to reCORD this.", "B) Hand me the reCORD.", "C) Play the REcord.", "D) Both A and C"]',
   '"D"',
   'As a verb "record" stresses the second syllable; as a noun it stresses the first.',
   true),
  ('SPEAKING', 'PRONUNCIATION', 'INTERMEDIATE', 'MCQ',
   'Which vowel sound is in the word "heat"?',
   '["A) /ɪ/ as in hit", "B) /iː/ as in see", "C) /e/ as in bed", "D) /æ/ as in hat"]',
   '"B"',
   '"heat" uses the long /iː/ vowel, the same as "feet", "meet", "see".',
   true),
  ('SPEAKING', 'PRONUNCIATION', 'INTERMEDIATE', 'MCQ',
   'In connected speech, "going to" is most naturally reduced to:',
   '["A) gonna", "B) goin' to", "C) go to", "D) gonna or going to equally"]',
   '"A"',
   'In natural speech "going to" reduces to "gonna" before a verb; e.g. "I'm gonna study".',
   true),

  -- WRITING / GRAMMAR / INTERMEDIATE
  ('WRITING', 'GRAMMAR', 'INTERMEDIATE', 'MCQ',
   'Choose the correct sentence:',
   '["A) Neither the students nor the teacher were ready.", "B) Neither the students nor the teacher was ready.", "C) Neither the students nor the teacher are ready.", "D) A and B are both acceptable."]',
   '"B"',
   'With "neither…nor", the verb agrees with the subject closest to it — here "the teacher" is singular.',
   true),
  ('WRITING', 'GRAMMAR', 'INTERMEDIATE', 'MCQ',
   'Which is the correct use of the present perfect?',
   '["A) I have seen that film yesterday.", "B) I saw that film since 2020.", "C) I have seen that film three times.", "D) I have seen that film last week."]',
   '"C"',
   'Present perfect is used with "three times" (indefinite time); "yesterday" and "last week" require simple past.',
   true),
  ('WRITING', 'GRAMMAR', 'INTERMEDIATE', 'MCQ',
   'Identify the dangling modifier: "Running down the street, the bus drove past me."',
   '["A) Running down the street", "B) the bus drove past me", "C) There is no error", "D) past me"]',
   '"A"',
   '"Running down the street" modifies the nearest noun, "the bus" — but the bus wasn''t running. The subject should be "I".',
   true),
  ('WRITING', 'GRAMMAR', 'INTERMEDIATE', 'MCQ',
   'Which sentence correctly uses a relative clause?',
   '["A) The book which I borrowed it was fascinating.", "B) The book that I borrowed was fascinating.", "C) The book, that I borrowed, was fascinating.", "D) The book which I borrowed it, was fascinating."]',
   '"B"',
   'Restrictive relative clauses don''t use commas and don''t repeat the pronoun (no "it").',
   true),
  ('WRITING', 'GRAMMAR', 'INTERMEDIATE', 'MCQ',
   'Choose the sentence with correct subject-verb agreement:',
   '["A) The data shows a clear trend.", "B) The data show a clear trend.", "C) Both are acceptable in academic writing.", "D) Neither is acceptable."]',
   '"C"',
   '"Data" can be treated as singular (formal American) or plural (traditional British); both are accepted in IELTS academic writing.',
   true)
ON CONFLICT DO NOTHING;
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
| `APPLY_DRILL_BONUS`        | `30`     | `drillController.ts`     |
| `QUESTIONS_PER_SESSION`    | `5`      | `drillController.ts`     |
| Max drill momentum/session | `65 pts` | `15 + 5×10`              |
| Min drill momentum/session | `15 pts` | all wrong                |
| Streak threshold           | `≥ 2 drills/day` | `drillController.ts` |

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

**Returns:** `drills_completed_today`, `lexigrid_completed_today`, `dashboard_unlocked`, `next_action`, `extra_sessions_today`, `sessions_remaining`, `momentum_score`, **`daily_streak`** (Phase 5), `can_buy_extra`, `free_sessions`, `extra_session_cost`

**Critical detail:** The cutoff uses `todayStart.setHours(0,0,0,0)` — calendar-day boundary, not rolling 24-hour window. Sessions reset at midnight.

---

### `POST /api/student/game-score`

**Auth:** Required (STUDENT role)
**Body:** `{ game_type, words_solved, total_attempts, bonus_eligible }`
**Purpose:** Called by LexiGrid when the student finishes their session (5 words solved or session ends).

**Logic:**

1. `completed = words_solved >= 5`
2. `momentum_earned = 10 + (bonus_eligible ? 5 : 0)` — only when completed
3. Upserts `student_game_scores` — idempotent on `(student_id, game_type, session_date)`
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

### `GET /api/student/competency-scores`

**Auth:** Required (STUDENT role)
**Purpose:** Returns the student's competency matrix plus profile-level stats.
**Returns:** `{ data: matrix[], target_band, momentum_score, daily_streak }` — (Phase 5) added `momentum_score` and `daily_streak` to allow the dashboard to initialize from the profile API as an alternative to `daily-drill-state`.

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
4. **Streak logic (Phase 5):** After the transaction, counts today's sessions. If `drills_today === 2` (just crossed the 2-drill threshold):
   - If `last_streak_date` was yesterday → `daily_streak += 1`
   - Otherwise → `daily_streak = 1` (reset or start)
   - Updates `daily_streak` and `last_streak_date = today` atomically
5. Returns: `{ data: session, momentum_earned, momentum_score, daily_streak }`

---

### `POST /api/drills/authorize-extra`

**Auth:** Required (STUDENT role)
**Purpose:** Pre-authorizes an extra drill session by deducting 75 pts before the student starts drilling.

**Guards (all checked before deducting):**

- `momentum_score >= 75` — student has enough pts
- `drills_today >= FREE_SESSIONS_PER_DAY` — free sessions already used
- `drills_today < MAX_SESSIONS_PER_DAY` — daily cap not hit

Deducts via `institute_students.update({ momentum_score: { decrement: 75 } })`. Returns `{ momentum_score, sessions_remaining }`.

---

### `POST /api/drills/apply-complete` *(Phase 5 — new)*

**Auth:** Required (STUDENT role)
**Body:** (none required)
**Purpose:** Awards +30 momentum pts when the student submits the Apply Drill free-response step.

**Logic:** Increments `institute_students.momentum_score` by 30. Returns `{ momentum_earned: 30, momentum_score }`. The frontend calls `syncMomentum(res.momentum_score)` to sync the context.

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
- `syncMomentum(serverScore)` — **overwrites** `totalMomentum` with the backend value. Called after every drill save, LexiGrid completion, apply-drill completion, and on dashboard mount.
- `applyMissPenalty(missCount, cycleKey)` — checks `appliedPenalties` set; if key not seen, deducts 20 or 40 pts. Miss 1 = −20 pts, Miss 2 = −40 pts.

**Known limitation:** `totalMomentum` initializes from localStorage on page load. The `fetchDailyDrillState()` call on dashboard mount overwrites it immediately via `syncMomentum`, so there is a brief flash of the stale localStorage value.

---

### `StudentDashboardPage.tsx` *(major Phase 5 refactor)*

**New state:**

- `dailyDrillState` — full response object from `GET /api/student/daily-drill-state`; type now includes `daily_streak`
- `buyingExtra` — boolean, prevents double-click on the "Spend 75 pts" button
- **Removed:** `completedDrills` state and all associated localStorage reads/writes

**Extracted `useCallback` helpers (component-level, not inside useEffect):**

- `fetchDailyDrillState()` — fetches `/api/student/daily-drill-state`, calls `syncMomentum`
- `fetchNextActionDrill()` — fetches `/api/student/next-action-drill`, populates `nextActionDrill`

**Effects:**

1. **Mount effect** (`deps: [fetchDailyDrillState, fetchNextActionDrill]`): calls `fetchCompetencyScores`, `fetchNextActionDrill`, `fetchDailyDrillState`, and attendance-streak localStorage tracker.
2. **Auto-refresh effect** (`deps: [location.state?.drillCompleted, ...]`): when `ApplyDrillScreen` navigates back with `{ state: { drillCompleted: true } }`, this effect fires and calls `fetchDailyDrillState()` + `fetchNextActionDrill()` so the dashboard reflects the new state immediately.

**`isLocked` logic (simplified):**

```typescript
// Backend is the sole truth — locked until state loads OR dashboard is unlocked
const isLocked = !dailyDrillState || !dailyDrillState.dashboard_unlocked || missedData.misses >= 2;
```

**`focusData` (Phase 5 — replaced `getPriorityFocusArea`):**

```typescript
const focusData = nextActionDrill
  ? { sub_skill: nextActionDrill.sub_skill, band: nextActionDrill.sub_skill_score, skill: nextActionDrill.skill }
  : { sub_skill: "Loading...", band: 5.0, skill: "Overall" };
```

**Level inference (Phase 5):**
Drill URL now includes `level` param computed from `focusData.band`:
```typescript
const getLevelFromScore = (score: number): string => {
  if (score < 5.0) return 'BEGINNER';
  if (score < 7.0) return 'INTERMEDIATE';
  return 'ADVANCED';
};
// In onStart:
const params = new URLSearchParams({ skill, sub_skill, level: getLevelFromScore(focusData.band), ... });
```

**Hero section (Phase 5):**
- Streak text uses `dailyDrillState?.daily_streak ?? currentStreak` (backend authoritative, localStorage fallback)
- New "Momentum" stat card showing `totalMomentum` from context alongside the "Overall Band" card

---

### `DrillScreen.tsx`

**URL params read:** `skill`, `sub_skill`, `level` (now passed from dashboard), `extra`

**Question fetch:**
`GET /api/drills/questions?skill=...&subskill=...&level=...` — always returns 5. `level` no longer hardcoded as `'INTERMEDIATE'`.

**`saveSessionAndComplete(finalCorrectCount):`**

- Posts to `POST /api/drills/session` with `{ skill, subskill, prompts_completed, correct_answers, is_extra_session }`
- On success: calls `syncMomentum(res.momentum_score)` + `updateStreak(res.daily_streak)` (once `daily_streak` is returned)

---

### `LexiGrid.tsx`

**New additions to the existing game:**

**Refs added:**

- `totalAttemptsRef` — accumulates total letter submissions across the entire session
- `allBonusEligibleRef` — starts `true`, set to `false` if any single word took more than `MAX_TRIES` attempts

**`triggerWinAnimation(attemptsForThisWord)`** (updated signature):

- Receives `attemptsForThisWord = MAX_TRIES - triesLeft + 1`
- If `attemptsForThisWord > MAX_TRIES` → sets `allBonusEligibleRef.current = false`
- Adds to `totalAttemptsRef.current`
- Calls `addPoints(POINTS_PER_WORD)` locally for immediate UI feedback

**`submitLexiGridSession(finalWordsWon)`** (new):

- Called when `nextIndex >= DAILY_LIMIT` (5th word processed)
- Posts to `POST /api/student/game-score`
- On success: calls `syncMomentum(res.momentum_score)`

---

### `DrillResultCard.tsx` *(Phase 5 fix)*

After a drill completes:

- Shows momentum earned, total momentum, streak
- Video recommendation gate (YouTube link, 30s timer before "Mark as Watched" enables)
- Reflection submission (minimum 8 words)
- On reflection submit: **no longer writes to `localStorage['completed_drills_today']`** — calls `onUnlockNext()` directly
- Source of truth for "how many drills done" is now entirely the backend's `drills_completed_today`

---

### `ApplyDrillScreen.tsx` *(Phase 5 fix)*

The free-response "apply" step shown after the video reflection.

- **On submit:** calls `POST /api/drills/apply-complete` to persist +30 pts to the DB, then calls `syncMomentum(res.momentum_score)` to sync the context
- **On navigate back to dashboard:** uses `navigate('/student/dashboard', { state: { drillCompleted: true } })` to trigger the auto-refresh effect in the dashboard

---

### `StudentSidebar.tsx`

Receives `isLocked` as a prop from the dashboard. Each nav item checks `isPlatformLocked`. Locked items render with a lock icon, reduced opacity, and disabled `pointer-events`.

---

## 6. End-to-End Daily Flow

```
LOGIN
  │
  ├── Dashboard mounts
  │     ├── fetchDailyDrillState()     → next_action = 'DRILL_1', daily_streak = N
  │     ├── fetchNextActionDrill()     → recommended_drills[0] = weakest sub-skill
  │     └── fetchCompetencyScores()   → skillBands populated
  │     isLocked = true (0/2 drills)
  │     Hero shows: streak = daily_streak from backend, momentum = totalMomentum from context
  │
  ├── Student clicks "Start Drill" on FocusAreaCard
  │     → /student/drill?skill=X&sub_skill=Y&level=BEGINNER|INTERMEDIATE|ADVANCED
  │
  ├── DrillScreen fetches 5 MCQ questions from /api/drills/questions?level=...
  │
  ├── Student answers 5 prompts (McqDrill tracks correct/incorrect)
  │
  ├── DrillScreen calls POST /api/drills/session
  │     ← { momentum_earned: 15+N*10, momentum_score: updated_total, daily_streak }
  │     → syncMomentum(momentum_score)
  │
  ├── DrillResultCard → video → reflection (no localStorage write) → ApplyDrillScreen
  │
  ├── ApplyDrillScreen → POST /api/drills/apply-complete → +30 pts
  │     → syncMomentum(res.momentum_score)
  │     → navigate('/student/dashboard', { state: { drillCompleted: true } })
  │
  ├── Dashboard auto-refresh (location.state.drillCompleted)
  │     → fetchDailyDrillState() → next_action = 'LEXIGRID'
  │     → fetchNextActionDrill() → updated recommendations
  │     isLocked = true (1/2 drills)
  │     LexiGrid card shows "Active Gate" + teal border + pulse badge
  │
  ├── Student plays LexiGrid (5 words)
  │     → submitLexiGridSession() → POST /api/student/game-score
  │     ← { momentum_earned: 10(+5 bonus), momentum_score: updated }
  │     → syncMomentum()
  │
  ├── (Student returns to dashboard — fetchDailyDrillState on mount)
  │     → next_action = 'DRILL_2'
  │
  ├── Student does Drill 2
  │     → same DrillScreen flow
  │     → POST /api/drills/session (drills_today hits 2 → streak incremented)
  │
  ├── ApplyDrillScreen → navigate with drillCompleted: true
  │
  ├── Dashboard auto-refresh
  │     → fetchDailyDrillState()
  │     → dashboard_unlocked = true, next_action = 'EXTRA_DRILL_AVAILABLE'
  │     isLocked = false  ← FULL SIDEBAR UNLOCKED
  │     daily_streak in hero reflects new streak value
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

| File                                     | Change                                                                                                                                                                                                                                                                                        |
| ---------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `prisma/schema.prisma`                   | Added `momentum_score`, `daily_streak`, `last_streak_date` to `institute_students`; added `correct_answers`, `total_questions`, `is_extra_session` to `DrillSession`; added new `StudentGameScore` model                                                                                      |
| `src/controllers/drillController.ts`     | `saveDrillSession` now has streak logic (updates `daily_streak` + `last_streak_date` when drills_today hits 2); `getDrillQuestions` pinned to 5 questions; `getNextActionDrill` calendar-day cutoff; **new** `completeApplyDrill` function (+30 pts for apply step)                            |
| `src/controllers/gameScoreController.ts` | `getDailyDrillState` now returns `daily_streak`                                                                                                                                                                                                                                               |
| `src/controllers/studentController.ts`   | `getCompetencyScores` now returns `momentum_score` and `daily_streak`                                                                                                                                                                                                                         |
| `src/routes/studentRoutes.ts`            | Added `GET /daily-drill-state`, `POST /game-score`                                                                                                                                                                                                                                            |
| `src/routes/drillRoutes.ts`              | Added `POST /authorize-extra`, **`POST /apply-complete`** (Phase 5)                                                                                                                                                                                                                           |

### Frontend (`ai-study-mentor/`)

| File                                                       | Change                                                                                                                                                                                                                                                                                                                                         |
| ---------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `src/features/student/Context/MomentumContext.tsx`         | Added `syncMomentum(serverScore)` to interface and implementation                                                                                                                                                                                                                                                                              |
| `src/features/student/components/Drills/DrillScreen.tsx`   | Reads `extra` URL param; sends `correct_answers` + `is_extra_session`; calls `syncMomentum` after session save                                                                                                                                                                                                                                 |
| `src/features/student/components/LexiGrid.tsx`             | Added `totalAttemptsRef`, `allBonusEligibleRef`; added `submitLexiGridSession()`; updated `triggerWinAnimation` signature; calls backend on 5th word completion                                                                                                                                                                                |
| `src/features/student/components/StudentDashboardPage.tsx` | **Phase 5:** extracted `fetchDailyDrillState`/`fetchNextActionDrill` as `useCallback`; added auto-refresh effect; removed `completedDrills` state + localStorage; replaced `focusData` with `nextActionDrill`; added `level` param to drill URL; added momentum stat card to hero; hero streak uses `dailyDrillState?.daily_streak` from backend |
| `src/features/student/components/Drills/DrillResultCard.tsx` | Removed `localStorage['completed_drills_today']` write from `handleSubmitReflection`                                                                                                                                                                                                                                                          |
| `src/features/student/components/Drills/ApplyDrillScreen.tsx` | Replaced local `addPoints(initialScore + 30)` with `POST /api/drills/apply-complete` + `syncMomentum`; navigate back to dashboard passes `{ state: { drillCompleted: true } }` for auto-refresh                                                                                                                                               |

---

## 8. Known Gaps & Pending Work

| Gap                                              | Detail                                                                                                                                                                                                                                                  |
| ------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Prisma client stale**                          | All new columns/models throw TypeScript errors until `npx prisma generate` is run after SQL blocks 1–4 are applied                                                                                                                                      |
| `**missedData` is mock**                         | `MOCK_MISSED_STATE = 1` hardcoded in `StudentDashboardPage`. Tutor-alert and IA miss penalties not yet wired to a real backend endpoint                                                                                                                  |
| **`ApplyDrillScreen` +30 pts idempotency**       | A student who submits the apply form twice will earn +30 pts twice. No server-side guard against double-submission. Mitigation: add a `content_completions` row on first call and guard on re-calls                                                      |
| **LexiGrid mid-session abandon**                 | If a student solves 3/5 words and closes the tab, `submitLexiGridSession` is never called. localStorage preserves progress but the backend has no partial record until they return and finish                                                            |
| **No IA (Internal Assessment) backend**          | The IA trigger (6 drill sessions + 2 calendar days + avg DCS ≥ 40%) is not yet implemented                                                                                                                                                              |
| `**getNextActionDrill` vs `getDailyDrillState`** | Both called independently on mount. `getNextActionDrill` does not enforce the free/paid session boundary — lock enforcement lives solely in `getDailyDrillState`                                                                                          |
| **`DrillScreen` → dashboard auto-refresh path**  | Auto-refresh fires when `ApplyDrillScreen` navigates back. If the student presses browser Back from `DrillResultCard` without completing the apply step, `fetchDailyDrillState` won't re-run until the component unmounts and remounts (next page visit) |
