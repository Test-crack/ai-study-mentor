# TestCrack — Daily Drill & LexiGrid System
### Implementation Report · Phase 1 Release
> **Version:** 1.0.0 — Production Release  
> **Date:** 2026-04-25  
> **Status:** ✅ Shipped — Ready for Live Users  
> **Authors:** Engineering Team  

---

## Part A — For Everyone

### What This Is

TestCrack's **Daily Learning Loop** — the structured, gated sequence every student completes before they can freely use the platform. It exists because research on IELTS preparation consistently shows that students who skip daily practice consistently fall short of their target bands. This system makes skipping impossible by design.

### What a Student Experiences Every Day

```
Log in
  ↓
Drill 1  →  LexiGrid vocab game  →  Drill 2  →  Drill 3  →  [Full platform unlocked]
  (weakest skill)  (gate: 5 words)  (any skill)  (free)      (earn extra drills with pts)
```

1. **Drill 1 — Assigned** · 5 MCQ questions targeting the student's weakest IELTS sub-skill (system decides, not the student).  
2. **LexiGrid Gate** · Student must work through 5 Band 7–8 synonym puzzles before Drill 2 unlocks. This is the vocabulary-building gate — daily, contextual, tied to their actual weak areas.  
3. **Drill 2 — Opens Platform** · The moment Drill 2 is accessed, the entire platform sidebar unlocks for the day.  
4. **Drill 3 — Free** · A third drill is available immediately after Drill 2 with no gate.  
5. **Extra Drills — Earned** · Students who score ≥ 75% accuracy (DCS) across today's drills can spend 75 Momentum points to unlock additional sessions. No daily hard cap.

### The Engagement Economy

Every action earns **Momentum Points (pts)** — the platform's reward currency.

| Action | Points |
|---|---|
| Complete a drill (base) | +15 pts |
| Each correct MCQ answer | +10 pts (max +50 for 5/5) |
| Max per drill session | **+65 pts** |
| Apply Drill (free-response step) | +30 pts |
| LexiGrid — per word solved | +15 pts (max +75 for 5/5) |
| LexiGrid — bonus (all ≤3 attempts) | +5 pts |
| Missed assessment penalty | −20 pts (1st) / −40 pts (2nd) |
| Extra drill cost | −75 pts |

**Streak:** Completing ≥ 2 drills in a day counts as an active streak day. Streak is tracked server-side — no localStorage manipulation possible.

### Why These Exact Rules

| Rule | Reason |
|---|---|
| 3 free drills (not 2) | More retrieval practice without financial pressure. Matches spaced repetition research. |
| LexiGrid between Drill 1 and 2 | Breaks the drill monotony. Vocabulary gaps are a top IELTS failure mode. |
| DCS ≥ 75% for extra drill | Prevents students from grinding low-quality sessions just to collect points. Extra time must be earned with accuracy. |
| Platform locked until Drill 2 | Forces the habit before rewards. One day of skipping compounds into chronic underpreparation. |
| Credits survive logout | If a student pays for an extra drill but gets disconnected, their credit is preserved. They don't lose the 75 pts. |

---

## Part B — Launch Checklist

Run these **in order** before the first real user hits the system.

### Database (run in pgAdmin on the VPS)

```sql
-- 1. Core momentum field
ALTER TABLE institute_students
  ADD COLUMN IF NOT EXISTS momentum_score INTEGER NOT NULL DEFAULT 0;

-- 2. Drill session scoring
ALTER TABLE drill_sessions
  ADD COLUMN IF NOT EXISTS correct_answers  SMALLINT NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS total_questions  SMALLINT NOT NULL DEFAULT 5,
  ADD COLUMN IF NOT EXISTS is_extra_session BOOLEAN  NOT NULL DEFAULT FALSE;

-- 3. Mini-game scores (LexiGrid + future games)
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

-- 4. Streak tracking
ALTER TABLE institute_students
  ADD COLUMN IF NOT EXISTS daily_streak     INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS last_streak_date DATE;

-- 5. Extra drill credit wallet (survives logout/disconnect)
ALTER TABLE institute_students
  ADD COLUMN IF NOT EXISTS extra_drill_credits INTEGER NOT NULL DEFAULT 0;

-- 6. LexiGrid word bank
-- Run the full contents of docs/lexigrid-words-seed.sql
-- (creates the lexigrid_words table and inserts 25 seed words)
```

### After SQL

```bash
# In backend-study-mentor/
npx prisma generate

# Verify PostgreSQL timezone (must return UTC)
# Run in psql: SHOW timezone;
```

### Smoke Test (manual, 5 minutes)

- [ ] Login as a test student
- [ ] Drill 1 completes → LexiGrid gate shows, drill button greyed with "Complete LexiGrid to unlock"
- [ ] Complete LexiGrid → returns to dashboard → Drill 2 unlocks, platform still locked
- [ ] Complete Drill 2 → sidebar unlocks
- [ ] Complete Drill 3 → DCS meter shows in card
- [ ] Verify Momentum pts are correct after each step
- [ ] Verify streak increments on day 2 (requires a second test session tomorrow)
- [ ] Run `SHOW timezone;` in psql on the VPS — must return `UTC`

---

## Part C — Technical Reference

### System Constants

| Constant | Value |
|---|---|
| Free drills per day | 3 |
| Extra drill cost | 75 pts |
| DCS required for extra drill | ≥ 75% |
| Max extra drills per day | No hard cap — can keep buying as long as DCS ≥ 75% and pts ≥ 75 |
| Streak threshold | ≥ 2 drills completed in the same IST calendar day |
| Drill base momentum | 15 pts |
| Drill per correct answer | +10 pts |
| Drill max per session | 65 pts (15 + 5×10) |
| Apply Drill bonus | +30 pts |
| LexiGrid per word | +15 pts |
| LexiGrid completion bonus | +5 pts (all 5 solved in ≤ 3 attempts each) |
| Platform unlock trigger | drills_completed_today ≥ 2 |
| Words per LexiGrid session | 5 |
| LexiGrid word bank | 25 words (8 BEGINNER, 10 INTERMEDIATE, 7 ADVANCED) |

---

### Database Schema — New Columns and Tables

**`institute_students` — columns added:**

| Column | Type | Purpose |
|---|---|---|
| `momentum_score` | `INT DEFAULT 0` | Authoritative pts balance. Server-only writes. |
| `daily_streak` | `INT DEFAULT 0` | Consecutive days with ≥ 2 drills. Server-incremented. |
| `last_streak_date` | `DATE` | Last IST day the streak was updated. Used to detect gaps. |
| `extra_drill_credits` | `INT DEFAULT 0` | Pre-paid extra drill slots not yet consumed. Survives disconnects. |

**`drill_sessions` — columns added:**

| Column | Type | Purpose |
|---|---|---|
| `correct_answers` | `SMALLINT DEFAULT 0` | Correct MCQ answers. Drives `momentum_earned = 15 + correct × 10`. |
| `total_questions` | `SMALLINT DEFAULT 5` | Always 5. Explicit for DCS calculation. |
| `is_extra_session` | `BOOLEAN DEFAULT false` | Marks sessions purchased beyond 3 free. Consumes one `extra_drill_credits`. |

**New tables:** `student_game_scores`, `lexigrid_words` — see SQL above.

---

### Timezone Architecture

**The problem with the standard approach:**

```typescript
// WRONG on a UTC server — produces UTC midnight, not IST midnight
const d = new Date();
d.setHours(0, 0, 0, 0);
```

This caused `lexigrid_completed_today` to always be `false` because sessions stored as `DATE 2026-04-24` (UTC) were compared against `18:30 UTC` boundaries that never matched.

**The fix — `src/lib/timezone.ts`:**

```typescript
const IST_OFFSET_MS = 5.5 * 60 * 60 * 1000; // never touches OS timezone

todayStartIST()    // IST midnight as UTC — for TIMESTAMPTZ >= queries on drill_sessions
currentISTDate()   // UTC midnight of current IST date — for DATE column storage/queries
yesterdayISTDate() // for streak continuity check on last_streak_date
```

**Server compatibility:**

| Machine | `Date.now()` | Behaviour |
|---|---|---|
| IST Windows dev | UTC ms | Correct ✓ |
| UTC Ubuntu VPS (production) | UTC ms | Correct ✓ |

No VPS timezone change needed. Code uses `Date.now()` + explicit arithmetic — never `new Date()` local methods.

**One check to run on the VPS:**
```sql
-- Must return UTC or Etc/UTC
SHOW timezone;
```

---

### API Reference

#### `GET /api/student/daily-drill-state`
Single source of truth. Called on every dashboard mount and after every drill/LexiGrid completion.

**Response:**
```json
{
  "drills_completed_today": 2,
  "lexigrid_completed_today": true,
  "dashboard_unlocked": true,
  "next_action": "DRILL_3",
  "momentum_score": 235,
  "daily_streak": 1,
  "daily_dcs": 80,
  "dcs_threshold": 75,
  "target_band": 7.5,
  "current_band": 5.0,
  "can_buy_extra": false,
  "extra_drill_credits": 0,
  "sessions_remaining": 98,
  "extra_session_cost": 75
}
```

**`next_action` values and what they mean:**

| Value | Student State | UI |
|---|---|---|
| `DRILL_1` | Fresh day, no drills yet | Blue "Start Priority Drill" button |
| `LEXIGRID` | Drill 1 done, gate open | Drill card locked, LexiGrid active gate |
| `DRILL_2` | LexiGrid done, Drill 2 pending | Both cards active, lock banner |
| `DRILL_3` | 2 drills done, platform unlocked | Blue "Start Priority Drill", no lock |
| `EXTRA_DRILL_READY` | Paid credit unused (e.g., after disconnect) | Green "Start Extra Drill — Session Ready" |
| `EXTRA_DRILL_AVAILABLE` | DCS ≥ 75%, pts ≥ 75, can pay | Amber "Unlock Extra Drill — 75 pts" + confirm |
| `DRILL_LOCKED_LOW_DCS` | DCS < 75% after 3 drills | DCS meter (red, Not eligible) + grey button |
| `DRILL_LOCKED_INSUFFICIENT_PTS` | DCS OK but not enough pts | DCS meter (green) + "Need 75 pts" grey button |

#### `POST /api/drills/session`
Saves a completed drill. Awards momentum atomically in a Prisma `$transaction`. Increments streak when `drills_today` crosses 2. Consumes one `extra_drill_credits` if `is_extra_session = true`.

**Body:** `{ skill, subskill, prompts_completed, correct_answers, is_extra_session }`  
**Returns:** `{ momentum_earned, momentum_score, daily_streak }`

#### `POST /api/drills/authorize-extra`
Pre-authorizes one extra drill. Guards: `drills_today >= 3`, `DCS >= 75%`, `momentum >= 75`. Atomically deducts 75 pts and increments `extra_drill_credits`. Frontend navigates to drill immediately on success — no state refresh needed.

#### `POST /api/student/game-score`
Saves a LexiGrid session. Always sets `completed = true` (API is only called at end of a full session). Awards `words_solved × 15 + bonus` pts. Idempotent — checks existing record before awarding momentum.

#### `GET /api/student/lexigrid-words?difficulty=INTERMEDIATE`
Returns 5 random active words at the requested difficulty. Falls back to any difficulty if fewer than 5 exist. Increments `times_served` fire-and-forget (never blocks response).

#### `POST /api/drills/apply-complete`
Awards +30 pts for the free-response Apply Drill step. No body required.

---

### Extra Drill Credit Lifecycle

Prevents students from losing 75 pts if they disconnect after paying but before completing.

```
Student pays 75 pts
        ↓
extra_drill_credits += 1  (DB, survives logout)
momentum_score     -= 75
        ↓
Navigate to drill screen
        ↓
  [if disconnected here]
        ↓
Student logs back in → getDailyDrillState → credits > 0 → next_action = EXTRA_DRILL_READY
        ↓
"Start Extra Drill — Session Ready" (no re-payment)
        ↓
Drill session saved (is_extra_session = true)
        ↓
extra_drill_credits -= 1  (credit consumed)
```

---

### Frontend State Machine (FocusAreaCard)

The drill card renders entirely based on `next_action`. No mixed conditional logic:

| `next_action` | Badge | CTA |
|---|---|---|
| `DRILL_1/2/3` | "Required: N Left" if locked | Blue **Start Priority Drill** |
| `LEXIGRID` | — | Grey **Complete LexiGrid to unlock** |
| `DRILL_LOCKED_LOW_DCS` | Green **3/3 Done** | DCS meter (red) + Grey **Improve accuracy to unlock extra** |
| `DRILL_LOCKED_INSUFFICIENT_PTS` | Green **3/3 Done** | DCS meter (green) + Grey **Need 75 pts to unlock** |
| `EXTRA_DRILL_AVAILABLE` | Green **3/3 Done** | DCS meter (green, Eligible) + Amber **Unlock Extra Drill — 75 pts** → confirm |
| `EXTRA_DRILL_READY` | Green **3/3 Done** | Green **Start Extra Drill — Session Ready** (no payment) |

**Sidebar lock:** Driven entirely by `isLocked` prop from dashboard (`dashboard_unlocked` from backend). The old localStorage-based `completed_drills_today` check has been fully removed.

---

### Key Bug Fixes (for posterity)

| Bug | Root Cause | Fix |
|---|---|---|
| `lexigrid_completed_today` always `false` | `setHours(0,0,0,0)` on IST machine stored DATE 2026-04-24 but queried `>= 18:30 UTC` → `00:00 < 18:30` = FALSE | `currentISTDate()` stores UTC midnight of IST date → consistent |
| LexiGrid gate never clearing | `completed = words_solved >= 5`. Scoring 3/5 → `completed=false` → gate stuck | `completed = true` always — end of session = done |
| Momentum vanishing after LexiGrid | Backend awarded 10–15 pts, frontend had added 3×15=45. `syncMomentum()` wiped the local additions | Backend now awards `words_solved × 15`. `syncMomentum` lands at the same value as local |
| Sidebar always locked after drills | `StudentSidebar` used its own `localStorage['completed_drills_today']` check (always empty since Phase 1 removed those writes) | Sidebar now uses `isLocked` prop from dashboard |
| Extra drill re-charges after disconnect | `handleBuyExtra` refreshed state after paying → `next_action` re-evaluated to `EXTRA_DRILL_AVAILABLE` → button reappears | Navigate to drill immediately on success. Credit tracked server-side via `extra_drill_credits` |
| Streak hardcoded to "2" | `MomentumContext` localStorage default was `2` | Default → `0`. `updateStreak(daily_streak)` called after every `fetchDailyDrillState` |
| LexiGrid blocked in DRILL_2 state | `lexiBlocked = !isLexiGate && isLocked` = `true` even when `lexiDone = true` | Fixed to `!isLexiGate && isLocked && !lexiDone` |

---

## Part D — Phase 2 Roadmap

These items are tracked, scoped, and intentionally deferred. None block the Phase 1 launch.

| Item | Priority | What it unlocks |
|---|---|---|
| **Missed Assessment backend** | P0 | Replace `MOCK_MISSED_STATE = 1`. Wire `/api/student/missed-assessments` returning real `consecutive_misses`. |
| **Internal Assessment (IA) trigger** | P0 | After 6 drills + 2 days + avg DCS ≥ 40%, unlock the IA flow. `computeDailyDCS()` is already built — extend for lifetime average. |
| **Apply Drill idempotency** | P1 | `POST /api/drills/apply-complete` can be called twice (+60 pts). Guard with `content_completions` insert + `409` on re-submit. |
| **Streak decay** | P1 | Per spec: −5 pts/day after 3 consecutive non-qualifying days. |
| **Grammar Swipe** | P2 | Second vocabulary gate (Drill 2 → Drill 3). Architecture is already extensible — `student_game_scores.game_type` is already `VARCHAR(30)`. |
| **DCS in competency API** | P2 | `getCompetencyScores` doesn't yet return `daily_dcs`. Currently only available via `getDailyDrillState`. |
| **LexiGrid abandon recovery** | P2 | `submitLexiGridSession` never called if tab closes mid-session. `localStorage` preserves client progress but no backend partial record. |

---

*TestCrack Engineering · Phase 1 · 2026-04-25*
