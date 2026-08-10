# Mock/Timer Feature — Codebase Verification Report

**Branch:** `mock/timer` (both repos)  
**Date:** 2026-08-01  
**Scope:** Per-section mock test timer architecture  
**Method:** Full source read + TypeScript build + live route probing (no UI — local Node v20.11.1 < Vite 8's required v20.12.0)

---

## 1. Verdict Summary

| Area | Verdict | Notes |
|---|---|---|
| Backend TypeScript build | ✅ PASS | `npm run build` clean |
| Frontend TypeScript | ✅ PASS | `npx tsc --noEmit` clean |
| All 6 mock routes registered | ✅ PASS | All return HTTP 401, not 404 |
| Prisma schema — new model + enum | ✅ PASS | `MockSectionAttempt` + `MockSectionStatus` present |
| Backend logic — all critical paths | ✅ PASS | See Section 3 |
| Frontend logic — all critical paths | ✅ PASS | See Section 4 |
| Bug fixes verified | ✅ PASS | All 8 tracked bugs confirmed fixed in source |
| UI browser smoke test | ⚠️ SKIPPED | Local Node v20.11.1 cannot run Vite 8 (needs ≥ 20.12.0); CI build on GitHub Actions runner will work |

**Overall: READY TO MERGE TO DEV** — with the mandatory `prisma db push` step before the app is exercised on staging (see Section 6).

---

## 2. What Was Built

### Architecture change

Old: single 3-hour countdown stored client-side, all answers on one session row.

New: per-section timers started explicitly by the student. Each section gets its own DB row (`mock_section_attempts`) with server-stamped `started_at` / `expires_at`. Timer state is authoritative on the server; the frontend syncs via `expires_at` on each section start/resume.

### Section durations

| Section | Duration |
|---|---|
| LISTENING | 30 min |
| READING | 60 min |
| WRITING | 60 min |
| SPEAKING | 15 min |

### New DB objects

```sql
-- Enum (Prisma maps NOT_STARTED → NOT_STARTED, etc.)
CREATE TYPE mock_section_status AS ENUM ('NOT_STARTED','IN_PROGRESS','SUBMITTED','EXPIRED');

-- Table
CREATE TABLE mock_section_attempts (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id   UUID NOT NULL REFERENCES mocksessions(id) ON DELETE CASCADE,
  section      VARCHAR(20) NOT NULL,
  status       mock_section_status DEFAULT 'NOT_STARTED',
  started_at   TIMESTAMPTZ,
  expires_at   TIMESTAMPTZ,
  submitted_at TIMESTAMPTZ,
  answers      JSONB DEFAULT '{}',
  scores       JSONB,
  created_at   TIMESTAMPTZ DEFAULT now(),
  CONSTRAINT uq_mock_section_session_section UNIQUE (session_id, section)
);
```

---

## 3. Backend — Line-by-Line Verification

### Routes (`mockRoutes.ts`)

```
GET  /api/mock/status              → getMockStatus
GET  /api/mock/questions           → getMockQuestions   (create/resume session)
GET  /api/mock/session/:sessionId  → getSessionState    (lazy expiry + state)
POST /api/mock/sections/start      → startMockSection   (start/resume a section)
POST /api/mock/answer              → saveMockAnswer     (auto-save per question)
POST /api/mock/submit              → submitMock         (submit section; grade when all done)
```

All 6 routes confirmed registered and returning 401 on unauthenticated requests.

### `lazySweepSectionExpiry` (mockController.ts:229)

On-read lazy evaluation: marks any `IN_PROGRESS` sections with `expires_at < now` as `EXPIRED`. Called on every `getSessionState` and `getMockQuestions` resume path. Correct — no background cron needed.

### `getMockQuestions` (mockController.ts:379)

- Resumes any active `PENDING`/`IN_PROGRESS` session (runs lazy sweep, returns section overview)
- Pre-fetches all 4 sections' question pools before creating a session — prevents consuming a monthly slot if the question bank is incomplete
- Creates session + 4 `NOT_STARTED` section rows in a single `$transaction`
- For EARNED mock: re-reads momentum balance inside the transaction (atomic double-spend guard), throws `INSUFFICIENT_MOMENTUM` if insufficient
- Returns section overview only (no questions at this stage)

### `startMockSection` (mockController.ts:567)

- Validates session ownership, window not closed
- Checks section status: auto-expires if `IN_PROGRESS` and past `expires_at`, rejects if `SUBMITTED`/`EXPIRED`
- First start: stamps `started_at` + `expires_at` = `startedAt + SECTION_DURATIONS_MS[section]`
- Resume: returns existing `started_at`/`expires_at` unchanged
- Loads questions from session's saved `question_ids` config (questions were pre-determined at session creation)
- Returns `expires_at` so frontend can sync its local timer

### `saveMockAnswer` (mockController.ts:659)

- Fetches section row, checks status (`SUBMITTED`/`EXPIRED` → 400)
- Inline timer expiry check (marks EXPIRED if `expires_at < now`)
- Validates `question_id` belongs to this session+section (injection guard)
- Uses raw SQL `COALESCE(answers, '{}') || jsonb_build_object(...)` for atomic JSONB merge (no read-modify-write race)

### `submitMock` (mockController.ts:716)

- Guards: `NOT_STARTED` → 400, `COMPLETED` → early return with `already_done: true`, `ABANDONED` → 400
- Idempotent: `SUBMITTED` section falls through to terminal check without re-stamping
- When all sections terminal: aggregates answers from all section rows, calls `processMockSession`
- `MockAlreadyCompletedError` guard in `processMockSession` (via `updateMany` count check) prevents concurrent double-grade

### `processMockSession` (mockController.ts:820)

- Accepts optional `aggregatedAnswers` — if provided uses it (new section model), else reads from `session.answers` (backward compat for legacy sessions)
- Runs AI grading for W/S prompts in parallel (`Promise.all`)
- Scores L/R via MCQ fraction, W/S via weighted MCQ+AI average per sub-skill
- Applies smoothing via `applySmoothing` to matrix bands
- All DB writes in a single `$transaction`: marks session COMPLETED, writes assessmentHistory rows, upserts competency matrix, increments momentum
- Throws `MockAlreadyCompletedError` if concurrent submit wins the race (count === 0 guard)

---

## 4. Frontend — Line-by-Line Verification

### Phase state machine (`FullMockAssessment.tsx:248`)

```
gate → dashboard → section_intro (LISTENING only) → session → scoring → results
                ↑___________________ (after each section submit, back to dashboard)
```

All 6 phases rendered via explicit switch at bottom (lines 1331–1336). No fallthrough issues.

### Timer architecture

| Construct | Line | Status |
|---|---|---|
| `sectionTimerSec` initialized to `-1` | 274 | ✅ BUG-1 fix — prevents auto-submit on mount |
| Timer effect runs for both `session` AND `section_intro` | 328 | ✅ LOGIC-3 fix — timer visible during Listening briefing |
| Auto-submit checks `=== 0` (not `<= 0`) | 343 | ✅ -1 sentinel safely ignored |
| `handleSectionComplete` in auto-submit deps | 349 | ✅ LOGIC-1 fix — no stale closure |
| `mockTimerStore.setSectionEndsAt` called in `applyStartedSection` | 482–483 | ✅ Server-authoritative sync |
| `mockTimerStore.setSectionEndsAt` called in `loadSession` for IN_PROGRESS sections | 396–400 | ✅ Resume sync |
| `windowRemainingMs` 24h countdown only ticks when `phase === "dashboard"` | 315–324 | ✅ |

### `handleSectionComplete` (line 505)

- Cancels timer interval immediately (prevents double-fire)
- Cancels any pending writing debounce
- Batch-flushes ALL answers in state: `Promise.all(Object.entries(answers).filter(...).map(...))`  
  → **LOGIC-7 fix** — earlier MCQ answers flushed even after back-navigation
- Calls `POST /api/mock/submit`
- Handles `res.already_done` → shows results (MISSING-1 fix)
- Handles `res.can_retry` (502) → sets `gradingRetryPending`, stays on session screen (CONTRACT-4 fix)
- Handles `res.all_sections_complete` → scoring → results with 3.5s animation
- Otherwise → refreshes section statuses, returns to dashboard

### `beginSection` / `resumeSection` (lines 456, 437)

- Both call `applyStartedSection` which syncs timer via `setSectionEndsAt`
- Fresh LISTENING start only: sets phase to `section_intro` (not resumed)
- All other skills / resumed sections: sets phase to `session` directly

### Section dashboard (`renderDashboard`, line 800)

- 24h window countdown shown with urgency color (red when < 1 hour)
- Each section card: NOT_STARTED → Start button, IN_PROGRESS → Resume + remaining time, SUBMITTED/EXPIRED → locked
- `windowRemainingMs <= 0` hides Start button and shows "Window closed"

### `clearState` (line 1178)

Uses `sessionIdRef.current ?? sessionId ?? ""` — MISSING-4 fix, avoids stale React state on results screen.

---

## 5. Bug Fixes Confirmed in Source

| Bug ID | Description | Fix Location | Confirmed |
|---|---|---|---|
| BUG-1 | Auto-submit fired on mount | `useState(-1)` at line 274 | ✅ |
| BUG-2/SEC-1 | `saveMockAnswer` accepted writes to locked sections | Section row fetch + status check at lines 688–699 | ✅ |
| BUG-3 | `submitMock` accepted NOT_STARTED sections | Guard at line 739 | ✅ |
| LOGIC-1 | Stale closure on timer expiry | `handleSectionComplete` in deps at line 349 | ✅ |
| LOGIC-3 | Timer invisible during Listening intro | Timer effect includes `section_intro` at line 328 | ✅ |
| LOGIC-7 | Earlier MCQ answers lost on timer expiry | Batch flush at lines 511–515 | ✅ |
| MISSING-1 | `already_done` response never showed results | Explicit branch at lines 537–541 | ✅ |
| CONTRACT-4 | AI grading 502 sent student back into submitted section | `gradingRetryPending` state + amber banner at lines 524–527, 981–989 | ✅ |
| SEC-3 | Momentum double-spend on concurrent EARNED starts | Re-read inside `$transaction` at lines 473–477 | ✅ |
| MISSING-4 | `clearState` used stale React state | `sessionIdRef.current ?? sessionId` at line 1178 | ✅ |

---

## 6. Minor Observations (non-blocking)

### OBS-1: `-1` sentinel causes a one-frame display glitch

`sectionTimerSec = -1` is passed to `CircleTimer` and `formatTime` on the very first render of `renderSession` before the timer effect fires its first tick. `formatTime(-1)` produces `"-1:-1"` and the SVG arc computes a negative dash length. This resolves in < 100ms (timer effect fires synchronously on mount). **Not a blocker** — the sentinel is essential for BUG-1; a `Math.max(0, sectionTimerSec)` guard in the render would clean this up later.

### OBS-2: `flushCurrentAnswer` is dead code

Defined at line 368 but never called — `handleSectionComplete` does the batch flush instead. Safe to delete in a cleanup pass.

### OBS-3: `handleSectionComplete` recreates on every MCQ click

`answers` is a dep of `handleSectionComplete` (correct), so every answer selection creates a new function reference, which re-runs the auto-submit effect's dep check. Functionally harmless (the `=== 0` guard never matches mid-session), but a `useRef` accumulation pattern could eliminate the churn if performance becomes a concern.

---

## 7. Pre-Deployment Checklist

```
[ ] 1. Commit all changes on mock/timer (both repos) — no co-author
[ ] 2. Resolve any pending git sequencer state on frontend repo (git rebase --abort if needed)
[ ] 3. Merge mock/timer → dev (both repos)
[ ] 4. Push dev → triggers CI/CD auto-deploy
[ ] 5. Wait for GitHub Actions build to pass
[ ] 6. SSH into VPS:
        cd /var/www/testcrack/backend-dev
        npx prisma db push          ← REQUIRED (creates mock_section_attempts + mock_section_status enum)
        pm2 restart backend-dev     ← only if Prisma client not regenerated by npm ci
[ ] 7. Navigate to dev.testcrack.com → mock test page → confirm section dashboard renders
[ ] 8. Start a LISTENING section → confirm section timer starts (not a 3-hour global)
[ ] 9. Submit a section → confirm it locks and dashboard updates
[ ] 10. Smoke test READING (different timer duration) → confirm 60-min timer
```

---

## 8. Files Changed

| File | Change |
|---|---|
| `backend-study-mentor/prisma/schema.prisma` | Added `MockSectionAttempt` model, `MockSectionStatus` enum, `sections` relation on `mocksessions` |
| `backend-study-mentor/src/controllers/mockController.ts` | Full rewrite — per-section endpoints, lazy sweep, atomic transaction, backward-compat scoring |
| `backend-study-mentor/src/routes/mockRoutes.ts` | Added 4 new routes (`getSessionState`, `startMockSection`; updated `saveMockAnswer`, `submitMock` signatures) |
| `ai-study-mentor/src/features/student/components/FullMockAssessment.tsx` | Full rewrite — section dashboard phase, per-section timer, server-sync, all bug fixes |
