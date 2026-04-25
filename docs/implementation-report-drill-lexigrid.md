# Implementation Report — Daily Drill & LexiGrid System
> Phase 1 — Production Hardening Pass  
> Last updated: 2026-04-25  
> Status: **Complete ✓**

---

## Executive Summary

This document covers the end-to-end build of the student's **Daily Learning Loop** — the core engagement mechanic that drives every session in the platform.

### What Was Built

Every day a student logs in, they go through a locked, structured sequence of activities before they can access the rest of the platform:

1. **Drill 1** — An AI-guided 5-question assessment targeting their weakest IELTS sub-skill.
2. **LexiGrid** — A vocabulary gate: the student must solve 5 Band 7–8 synonym puzzles to proceed.
3. **Drill 2** — A second targeted drill. Completing it **unlocks the full platform** for the day.

After the 2 free drills, students can spend Momentum points (75 pts each) to unlock up to 3 additional sessions (5 drills maximum per day).

### Why It Was Built This Way

- **Learning science**: spaced, low-stakes retrieval practice before open platform access trains consistent daily habits and prevents students from skipping foundational work.
- **Engagement economy**: Momentum points are the platform's reward currency. Every correct answer, completed drill, and vocabulary word adds points. Missed assessments deduct them. This creates a visible feedback loop that motivates students.
- **Data quality**: because drills are backend-persisted (not localStorage), the platform has reliable data for analytics, tutor dashboards, and AI recommendations.

### Business Impact

| Metric | Before | After |
|---|---|---|
| Streak tracking | localStorage-only, fake default "2" | Backend-authoritative, real-time |
| Momentum source of truth | localStorage | PostgreSQL (synced to client) |
| Drill completion tracking | localStorage | PostgreSQL drill_sessions table |
| Word difficulty | Hardcoded INTERMEDIATE | Adapts to student's actual band score |
| LexiGrid words | 8 hardcoded client-side words | 25 words in DB, 5 served per session by difficulty |
| Platform flow enforcement | None — all sections always accessible | Gated: Drill 1 → LexiGrid → Drill 2 → Unlock |

### Known Limitations (Non-Blocking for Phase 1)

| Item | Status |
|---|---|
| Missed Assessment backend | Mock data — real backend endpoint not yet implemented |
| Apply Drill idempotency | No double-submission guard on server side |
| LexiGrid mid-session abandon | Backend record only written on session complete |
| Internal Assessment trigger | Not yet implemented |

---

## 1. Database Schema

### `institute_students` (extended in Phase 5)

| Column | Type | Default | Purpose |
|---|---|---|---|
| `momentum_score` | `INT` | `0` | Authoritative momentum total. Every drill, LexiGrid, and apply step increments this on the server. |
| `daily_streak` | `INT` | `0` | Consecutive days with ≥ 2 completed drills. Incremented server-side — never trusts the client. |
| `last_streak_date` | `DATE` | `NULL` | Last calendar day the streak was incremented. Detects gap days so the streak resets correctly. |

### `drill_sessions` (extended)

| Column | Type | Default | Purpose |
|---|---|---|---|
| `correct_answers` | `SMALLINT` | `0` | Drives momentum calculation: `15 + correct_answers × 10` per session. |
| `total_questions` | `SMALLINT` | `5` | Always 5. Explicit for analytics queries. |
| `is_extra_session` | `BOOLEAN` | `false` | Marks sessions bought beyond the 2 free daily sessions. |

### `student_game_scores` (new table)

| Column | Type | Notes |
|---|---|---|
| `id` | `UUID` | PK |
| `student_id` | `UUID` | FK → `institute_students.id` |
| `game_type` | `VARCHAR(30)` | `'LEXIGRID'` today; extensible for future mini-games |
| `session_date` | `DATE` | Calendar day. Unique per student + game + date — prevents duplicate scoring. |
| `words_solved` | `INT` | 0–5 for LexiGrid |
| `total_attempts` | `INT` | Total letter submissions across the session |
| `bonus_eligible` | `BOOLEAN` | `true` if every word was solved within 3 attempts |
| `momentum_earned` | `INT` | 10 base + 5 bonus if eligible |
| `completed` | `BOOLEAN` | `true` when words_solved ≥ 5 |
| `score_data` | `JSONB` | Extension slot for future per-word analytics |

**Constraint:** `UNIQUE(student_id, game_type, session_date)` — upsert on conflict; safe to call multiple times.

### `lexigrid_words` (new table)

| Column | Type | Notes |
|---|---|---|
| `id` | `UUID` | PK |
| `base_word` | `VARCHAR(100)` | Common word shown to student (e.g. "HARMFUL") |
| `target_word` | `VARCHAR(100)` | Band 7–8 synonym to type (e.g. "PERNICIOUS"), stored UPPERCASE |
| `hint` | `TEXT` | Contextual definition shown on hint reveal |
| `category` | `VARCHAR(50)` | `'academic'`, `'descriptive'`, or `'formal'` |
| `difficulty` | `VARCHAR(20)` | `BEGINNER`, `INTERMEDIATE`, or `ADVANCED` |
| `target_band` | `DECIMAL(2,1)` | IELTS band this word targets |
| `is_active` | `BOOLEAN` | Soft-delete flag |
| `times_served` | `INT` | Fire-and-forget usage counter for future rotation logic |

Seeded with **25 words** across all three difficulty levels (8 BEGINNER, 10 INTERMEDIATE, 7 ADVANCED). Seed SQL: `docs/lexigrid-words-seed.sql`.

---

## 2. SQL Migration Blocks (run in order in pgAdmin)

```sql
-- BLOCK 1: momentum_score on institute_students
ALTER TABLE institute_students
  ADD COLUMN IF NOT EXISTS momentum_score INTEGER NOT NULL DEFAULT 0;

-- BLOCK 2: enriched drill session scoring
ALTER TABLE drill_sessions
  ADD COLUMN IF NOT EXISTS correct_answers  SMALLINT NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS total_questions  SMALLINT NOT NULL DEFAULT 5,
  ADD COLUMN IF NOT EXISTS is_extra_session BOOLEAN  NOT NULL DEFAULT FALSE;

-- BLOCK 3: mini-game scores table
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

-- BLOCK 4: streak tracking
ALTER TABLE institute_students
  ADD COLUMN IF NOT EXISTS daily_streak     INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS last_streak_date DATE;

-- BLOCK 5: LexiGrid words table + seed (see docs/lexigrid-words-seed.sql)
-- Run the full contents of docs/lexigrid-words-seed.sql here.
```

After all SQL blocks are applied:
```bash
cd backend-study-mentor
npx prisma generate
```

---

## 3. System Constants

| Constant | Value | File |
|---|---|---|
| Free drills per day | 2 | `gameScoreController.ts` |
| Max drills per day | 5 | `gameScoreController.ts` |
| Extra session cost | 75 pts | `gameScoreController.ts` |
| LexiGrid base reward | 10 pts | `gameScoreController.ts` |
| LexiGrid bonus (all ≤3 attempts) | +5 pts | `gameScoreController.ts` |
| Drill base reward | 15 pts | `drillController.ts` |
| Drill per correct answer | +10 pts | `drillController.ts` |
| Apply drill bonus | +30 pts | `drillController.ts` |
| Max drill momentum/session | 65 pts | `15 + 5×10` |
| Streak threshold | ≥ 2 drills/day | `drillController.ts` |
| Words per LexiGrid session | 5 | `lexiGridController.ts` |

---

## 4. Backend API Reference

### `GET /api/student/daily-drill-state`

**Auth:** STUDENT role required  
**Purpose:** Single source of truth the dashboard calls on mount to determine what the student should do next.

**Response fields:**

| Field | Type | Description |
|---|---|---|
| `drills_completed_today` | `number` | Sessions saved since midnight |
| `lexigrid_completed_today` | `boolean` | Whether today's LexiGrid is done |
| `dashboard_unlocked` | `boolean` | `true` when drills_today ≥ 2 |
| `next_action` | `string` | See decision tree below |
| `momentum_score` | `number` | Authoritative current total |
| `daily_streak` | `number` | Current streak (backend-computed) |
| `target_band` | `number` | Student's target IELTS band |
| `current_band` | `number` | Avg of 4 skill band scores (rounded to nearest 0.5) |
| `can_buy_extra` | `boolean` | Whether student can unlock an extra session |
| `sessions_remaining` | `number` | Sessions left before daily cap |
| `extra_session_cost` | `number` | Points cost per extra session |

**`next_action` decision tree:**
```
drills_today = 0                           → DRILL_1
drills_today = 1, lexigrid done = false    → LEXIGRID
drills_today = 1, lexigrid done = true     → DRILL_2
drills_today >= 5                          → DAILY_LIMIT_REACHED
drills_today >= 2, momentum >= 75          → EXTRA_DRILL_AVAILABLE
drills_today >= 2, momentum < 75           → DRILL_LOCKED_INSUFFICIENT_PTS
```

---

### `POST /api/student/game-score`

**Auth:** STUDENT role required  
**Body:** `{ game_type, words_solved, total_attempts, bonus_eligible }`  
**Purpose:** Called by LexiGrid when the student's session ends.

**Logic:**
1. `completed = words_solved >= 5`
2. `momentum_earned = 10 + (bonus_eligible ? 5 : 0)` — only on completion
3. Upserts `student_game_scores` — safe to call multiple times (idempotent per day)
4. Awards momentum on first completion only

**Response:** `{ momentum_earned, momentum_score, next_action }`

---

### `GET /api/student/next-action-drill`

**Auth:** STUDENT role required  
**Purpose:** Returns the prioritized list of sub-skills for today's drill.

**Ranking logic:**
1. Pulls `StudentCompetencyMatrix` — one row per IELTS skill
2. Within each skill, ranks sub-skills by band score ascending (weakest first)
3. Interleaves skills in round-robin so the student alternates rather than exhausting one skill
4. Filters sub-skills already drilled today
5. Returns up to `MAX_DAILY_SESSIONS` recommendations

**Response:** `{ recommended_drills[], daily_sessions_completed, sessions_remaining }`

---

### `GET /api/student/competency-scores`

**Auth:** STUDENT role required  
**Purpose:** Full competency matrix for the student.

**Response:** `{ data: matrix[], target_band, current_band, momentum_score, daily_streak }`

---

### `GET /api/drills/questions`

**Auth:** STUDENT role required  
**Query params:** `skill`, `subskill`, `level`  
**Purpose:** Returns exactly 5 random active MCQ questions for the given parameters.

Implementation: Prisma `$queryRaw` with `ORDER BY RANDOM() LIMIT 5`. `level` maps to the `RecommendationLevel` enum: `BEGINNER | INTERMEDIATE | ADVANCED`. Level is inferred server-side from the student's actual band score — not hardcoded.

---

### `POST /api/drills/session`

**Auth:** STUDENT role required  
**Body:** `{ skill, subskill, prompts_completed, correct_answers, is_extra_session }`  
**Purpose:** Persists a completed drill and awards momentum atomically.

**Logic:**
1. `momentum_earned = 15 + correct_answers × 10`
2. Prisma `$transaction`: creates `DrillSession` + increments `momentum_score` atomically
3. **Streak logic** (fires only when `drills_today === 2` exactly, never on 3rd+ session):
   - If `last_streak_date` was yesterday → `daily_streak += 1`
   - Otherwise → `daily_streak = 1` (streak starts fresh)
   - Updates `daily_streak` + `last_streak_date` atomically

**Response:** `{ data: session, momentum_earned, momentum_score, daily_streak }`

---

### `POST /api/drills/authorize-extra`

**Auth:** STUDENT role required  
**Purpose:** Pre-authorizes one extra drill by deducting 75 pts.

**Guards (all enforced before deducting):**
- `momentum_score >= 75`
- `drills_today >= 2` (free sessions used)
- `drills_today < 5` (daily cap not hit)

---

### `POST /api/drills/apply-complete`

**Auth:** STUDENT role required  
**Purpose:** Awards +30 pts when the student submits the Apply Drill free-response step.

**Response:** `{ momentum_earned: 30, momentum_score }`

---

### `GET /api/student/lexigrid-words`

**Auth:** STUDENT role required  
**Query params:** `difficulty` (BEGINNER | INTERMEDIATE | ADVANCED)  
**Purpose:** Returns 5 random active LexiGrid words at the requested difficulty.

**Fallback behaviour:** If fewer than 5 words exist at the requested difficulty, top-up from any difficulty. If the table is empty, returns `404` with a helpful message.

**Fire-and-forget:** After responding, increments `times_served` on each served word via `updateMany` — never blocks the response.

---

## 5. Frontend Component Guide

### Flow Control Logic (StudentDashboardPage)

The entire platform gate lives in one computed value:
```typescript
const isLocked = !dailyDrillState || !dailyDrillState.dashboard_unlocked || missedData.misses >= 2;
```

The `next_action` field from the backend drives which cards are shown:

| `next_action` | FocusAreaCard (Drill) | LexiGrid Card | Width |
|---|---|---|---|
| `DRILL_1` | Visible, active | Visible, blocked | 6 / 6 |
| `LEXIGRID` | **Hidden** | Visible, active gate | **12 (full width)** |
| `DRILL_2` | Visible, active | Visible, done badge | 6 / 6 |
| `EXTRA_DRILL_AVAILABLE` | Visible + buy button | Visible, done badge | 6 / 6 |
| `DAILY_LIMIT_REACHED` | Visible, locked | Visible, done badge | 6 / 6 |

This is why Bug 1 existed: there was no `if (lexiGridIsGate) return null` guard on the drill card IIFE.

---

### MomentumContext

Manages `totalMomentum` and `streak` with localStorage persistence and backend override.

**Key functions:**
- `syncMomentum(serverScore)` — overwrites local state with backend value. Called after every API mutation.
- `updateStreak(n)` — sets streak and persists to localStorage. Called after `fetchDailyDrillState` and `saveDrillSession`.
- `addPoints(pts)` — local-only increment (for immediate LexiGrid UI feedback).
- `applyMissPenalty(missCount, cycleKey)` — deducts 20 or 40 pts once per unique cycle key. Idempotent.

**Why streak was showing "2":** The localStorage default was hardcoded to `2`. Fixed to `0`. Backend value syncs within ~200ms of dashboard mount.

---

### StudentDashboardPage

**State owned:**
- `dailyDrillState` — full backend response; single source of truth for lock/flow state
- `skillBands` — competency matrix mapped to display-friendly shape
- `nextActionDrill` — top recommendation from `/api/student/next-action-drill`
- `targetBand` — populated from backend; overrides the static `READINESS.targetBand` constant

**Effects:**
1. **Mount** — fires `fetchCompetencyScores`, `fetchNextActionDrill`, `fetchDailyDrillState`
2. **Auto-refresh** — fires when `location.state?.drillCompleted` is set (set by `ApplyDrillScreen` on navigate back)

**Level inference** — determines question difficulty from band score:
```typescript
const getLevelFromScore = (score: number): string => {
  if (score < 5.0) return 'BEGINNER';
  if (score < 7.0) return 'INTERMEDIATE';
  return 'ADVANCED';
};
```

---

### DrillScreen

Reads `skill`, `sub_skill`, `level`, `extra` from URL params. After the 5th question:
1. Calls `POST /api/drills/session`
2. Calls `syncMomentum(res.momentum_score)`
3. Calls `updateStreak(res.daily_streak)` ← new in Phase 1 bug fix

Navigates to `DrillResultCard` which shows the video + reflection gate before proceeding to `ApplyDrillScreen`.

---

### DrillResultCard

After the student watches the video and submits a ≥8-word reflection:
- Calls `onUnlockNext()` — navigates to `/student/apply-drill`
- **No longer writes to localStorage** — `drills_completed_today` is owned by the backend

---

### ApplyDrillScreen

Displays a free-response prompt (audio for Speaking, text for Writing).  
On submit:
1. Calls `POST /api/drills/apply-complete` — awards +30 pts
2. Calls `syncMomentum(res.momentum_score)`
3. Navigates: `navigate('/student/dashboard', { state: { drillCompleted: true } })`  
   The `state` object triggers the dashboard's auto-refresh effect.

---

### LexiGrid

**Initialization:**
1. Check localStorage for a valid today-dated save → resume if found
2. Otherwise fetch `GET /api/student/lexigrid-words?difficulty=${difficulty}`
3. Map DB columns (`base_word`, `target_word`, `hint`) → game shape (`base`, `target`, `hint`)
4. On API failure → silently fall back to 8-word hardcoded bank + show offline warning banner

**Session complete trigger:** When `nextIndex >= 5` (all 5 words processed), calls `submitLexiGridSession(wordsWon)` → `POST /api/student/game-score`.

**Difficulty** is passed from the dashboard via `?difficulty=BEGINNER|INTERMEDIATE|ADVANCED`, computed from the student's overall band score.

---

## 6. End-to-End Daily Flow

```
LOGIN
  │
  └── Dashboard mounts
        fetchDailyDrillState()  → next_action='DRILL_1', streak=N, target_band, current_band
        fetchNextActionDrill()  → weakest sub-skill
        fetchCompetencyScores() → all 4 skill bands
        isLocked = true (0/2 drills done)
        Streak synced to backend value (Bug 3 fix)
        FocusAreaCard shows  |  LexiGrid shows (blocked)

  ── Student clicks Start Drill ──────────────────────────────────────
  │   → /student/drill?skill=X&sub_skill=Y&level=BEGINNER|INTERMEDIATE|ADVANCED
  │
  ├── DrillScreen: 5 MCQ questions fetched from /api/drills/questions?level=...
  ├── Student answers 5 questions
  ├── POST /api/drills/session → momentum + streak synced
  ├── DrillResultCard: video (30s lock) + reflection (≥8 words)
  ├── ApplyDrillScreen: free-response prompt
  │   POST /api/drills/apply-complete → +30 pts synced
  │   navigate('/student/dashboard', { state: { drillCompleted: true } })
  │
  └── Dashboard auto-refresh
        fetchDailyDrillState() → next_action='LEXIGRID'
        FocusAreaCard HIDDEN   |  LexiGrid FULL WIDTH, Active Gate badge  ← Bug 1 fix
        Lock banner: "Complete LexiGrid to unlock your second drill"

  ── Student plays LexiGrid ──────────────────────────────────────────
  │   Difficulty = getLevelFromScore(overall band)
  │   5 words from DB, served by difficulty
  │   submitLexiGridSession() → POST /api/student/game-score → momentum synced
  │
  └── Student returns to dashboard (or navigates back)
        fetchDailyDrillState() → next_action='DRILL_2'
        FocusAreaCard reappears  |  LexiGrid shows ✓ Done badge

  ── Student completes Drill 2 ────────────────────────────────────────
  │   Same flow as Drill 1
  │   POST /api/drills/session: drills_today hits 2 → streak incremented
  │
  └── Dashboard auto-refresh
        dashboard_unlocked = true
        isLocked = false  ← FULL SIDEBAR UNLOCKED
        daily_streak reflects new value in hero text

  ── Optional: Extra Drills ───────────────────────────────────────────
        POST /api/drills/authorize-extra → deduct 75 pts
        Up to 3 more sessions (5 total per day)
```

---

## 7. Files Changed

### Backend (`backend-study-mentor/`)

| File | Change |
|---|---|
| `prisma/schema.prisma` | Added `daily_streak`, `last_streak_date` to `institute_students`; added `correct_answers`, `total_questions`, `is_extra_session` to `DrillSession`; added `StudentGameScore` and `LexiGridWord` models |
| `src/controllers/drillController.ts` | `saveDrillSession`: streak logic when drills_today hits 2; `getDrillQuestions` pinned to 5; new `completeApplyDrill` (+30 pts) |
| `src/controllers/gameScoreController.ts` | `getDailyDrillState` now returns `daily_streak`, `target_band`, `current_band` (avg of matrix scores); `saveGameScore` is idempotent upsert |
| `src/controllers/studentController.ts` | `getCompetencyScores` returns `current_band` + `daily_streak` |
| `src/controllers/lexiGridController.ts` | **New** — `getLexiGridWords`: 5 random words by difficulty, graceful fallback, fire-and-forget `times_served` increment |
| `src/routes/drillRoutes.ts` | Added `POST /apply-complete` |
| `src/routes/studentRoutes.ts` | Added `GET /lexigrid-words` |

### Frontend (`ai-study-mentor/`)

| File | Change |
|---|---|
| `src/features/student/Context/MomentumContext.tsx` | Streak default changed `2` → `0`; added `updateStreak`, `syncMomentum` |
| `src/features/student/components/StudentDashboardPage.tsx` | Extracts `fetchDailyDrillState`/`fetchNextActionDrill` as `useCallback`; auto-refresh on `location.state.drillCompleted`; hides drill card when `next_action=LEXIGRID`; LexiGrid expands to full width as gate; `targetBand` state driven from backend; `updateStreak` called after every fetch; `focusData` from backend recommendation |
| `src/features/student/components/Drills/DrillScreen.tsx` | Calls `updateStreak(res.daily_streak)` after session save; reads `level` from URL param instead of hardcoding |
| `src/features/student/components/Drills/DrillResultCard.tsx` | Removed all `localStorage['completed_drills_today']` writes |
| `src/features/student/components/Drills/ApplyDrillScreen.tsx` | Replaced local `addPoints` with `POST /api/drills/apply-complete` + `syncMomentum`; navigates with `{ state: { drillCompleted: true } }` |
| `src/features/student/components/LexiGrid.tsx` | DB-backed word fetch with `useSearchParams` difficulty; `FALLBACK_WORD_BANK` for offline; `fetchError` banner; `Loader2` spinner; `submitLexiGridSession` on completion |

---

## 8. Known Gaps (Post Phase 1 Backlog)

| Gap | Priority | Detail |
|---|---|---|
| `missedData` is mocked | High | `MOCK_MISSED_STATE = 1` hardcoded. Needs a `/api/student/missed-assessments` endpoint returning `consecutive_misses` and `missed_sub_skills`. |
| Apply Drill double-submission | Medium | No server-side idempotency guard. A student who submits twice earns +60 pts. Fix: insert into `content_completions` on first call and reject duplicates. |
| LexiGrid mid-session abandon | Low | `submitLexiGridSession` is never called if the tab is closed mid-session. localStorage preserves progress; backend never gets a partial record. |
| Internal Assessment (IA) backend | High | IA trigger (6 drills + 2 days + avg DCS ≥ 40%) is not yet implemented. |
| `DrillScreen` → dashboard refresh path | Low | If student presses browser Back from `DrillResultCard` without completing the apply step, `fetchDailyDrillState` won't re-run until a fresh mount. |
