# Mock Test — Full Implementation Plan
**Date:** 14 May 2026 | **Follows:** IA implementation (`feature/ielts-flow`)

## ⚠️ Actual Prisma Model Names (after db pull)

| Plan name | Actual Prisma model | DB table |
|---|---|---|
| `MockQuestion` | `mockquestions` | `mock_questions` |
| `MockSession` | `mocksessions` | `mock_sessions` |

Use `prisma.mockquestions` and `prisma.mocksessions` in all controller code.
Enums: `MockAttemptType` (STANDARD / EARNED), `MockSessionStatus` (PENDING / IN_PROGRESS / COMPLETED / ABANDONED) ✅

---

## 1. Concept Delta: Mock vs IA

| Dimension | Internal Assessment (IA) | Mock Test |
|---|---|---|
| Skills covered | 2 targeted sub-skills | All 4 skills (full IELTS) |
| Questions per section | 10 | 10 (Phase 1); full IELTS count (Phase 2) |
| Timer per section | 20 min | 30 min (L/R) / 40 min (W) / 20 min (S) |
| Frequency | Every 3 drill days | 1 per calendar month |
| Eligibility | 6 drills + DCS ≥ 40% | 6 IAs (≥1 per skill) + ≥0.5 band improvement |
| Extra access | — | 1500 momentum exchange (hard cap: 2/month) |
| Scoring formula | Weighted MCQ + AI per sub-skill | `Mock × 0.60 + Current Matrix × 0.40` per skill |
| Momentum | +100 / +25 / +50 | +200 flat + +500 if new 0.5 threshold crossed |
| Result screen | 2 sub-skill bands + delta | 4 skill bands + diagnostic baseline + overall Real Band |
| Session window | IST midnight same day | 72 hours from first open |

---

## 2. What Is Fully Reused

- Per-section timer architecture (`__meta` in `answers` JSONB, `section_started_at`, resume)
- `POST /api/mock/answer` — identical to `POST /api/ia/answer` (same JSONB merge + section_advance pattern)
- AI grading library (`iaGrading.ts` — reuse `gradeIAWritingPrompt` / `gradeIASpeakingPrompt` as-is)
- MCQ/TFNG scoring formula (`correct/total × 9`)
- Frontend session phase machine: `gate → session → interim → session → ... → scoring → results`
- Speaking recording (Web Speech API)
- Writing debounced auto-save
- Momentum increment pattern

---

## 3. Database Changes

### 3a. New Enum

```sql
CREATE TYPE MockSessionStatus AS ENUM ('PENDING', 'IN_PROGRESS', 'COMPLETED', 'ABANDONED');
CREATE TYPE MockAttemptType   AS ENUM ('STANDARD', 'EARNED');
```

`ABANDONED` = student opened but never completed within the 72h window (separate from IA's MISSED — no momentum penalty for mock; they just lose their standard slot for the month).

### 3b. `mock_questions` table

Structurally identical to `ia_questions`. Separate table to keep question banks clean.

```prisma
model MockQuestion {
  id             String         @id @default(dbgenerated("uuid_generate_v4()")) @db.Uuid
  skill          IeltsSkillType  // LISTENING | READING | WRITING | SPEAKING
  sub_skill      IeltsSubSkillType?  // nullable — mock questions can be skill-level
  question_type  String         @db.VarChar(30)  // MCQ | TFNG | WRITING_PROMPT | SPEAKING_PROMPT
  task_type      String?        @db.VarChar(20)  // Task1 | Task2 (Writing) | Part1 | Part2 | Part3 (Speaking)
  passage_id     String?        @db.VarChar(50)
  passage_text   String?
  audio_url      String?        @db.VarChar(500)
  prompt_text    String
  options        Json?
  correct_answer Json?
  explanation    String?
  is_active      Boolean        @default(true)
  created_at     DateTime       @default(now()) @db.Timestamptz(6)

  @@index([skill, is_active])
  @@index([skill, question_type])
}
```

Note: No `difficulty` field — all mock questions are at exam difficulty level.

### 3c. `mock_sessions` table

```prisma
model MockSession {
  id                 String            @id @default(dbgenerated("uuid_generate_v4()")) @db.Uuid
  student_id         String            @db.Uuid
  attempt_type       MockAttemptType   @default(STANDARD)
  month_year         String            @db.VarChar(7)   // "2026-05" — deduplication key
  status             MockSessionStatus @default(PENDING)
  // Structured as [{ skill, ids: [uuid,...] }] for all 4 sections
  question_ids       Json              @default("[]")
  // { "q_uuid": "A", "__meta": { current_section, section_started_at } }
  answers            Json              @default("{}")
  time_started_at    DateTime?         @db.Timestamptz(6)
  time_submitted_at  DateTime?         @db.Timestamptz(6)
  window_closes_at   DateTime          @db.Timestamptz(6)  // 72h from first open
  // [{ skill, band, correct, total, ai_graded }]
  scores             Json?
  // Real Band after formula: Mock×0.6 + CurrentMatrix×0.4 per skill
  real_band_score    Decimal?          @db.Decimal(2, 1)
  momentum_awarded   Int?
  created_at         DateTime          @default(now()) @db.Timestamptz(6)
  institute_students institute_students @relation(fields: [student_id], references: [id], onDelete: Cascade)

  @@unique([student_id, month_year, attempt_type])  // one STANDARD + one EARNED per month max
  @@index([student_id])
  @@index([student_id, month_year])
  @@index([status])
}
```

### 3d. `institute_students` — no changes needed

Momentum is already tracked. `created_at` already exists for the 14-day check.

### 3e. Existing tables touched on mock submit

- `AssessmentHistory` — one row per skill (`mode = MOCK`), reusing existing model
- `StudentCompetencyMatrix` — `band_score` updated per skill using `Mock × 0.60 + current × 0.40`

---

## 4. Scoring Algorithm

### Per-skill band (at submission)

```
For each skill in [LISTENING, READING, WRITING, SPEAKING]:
  mock_skill_band = weighted(MCQ, AI prompts)    // same formula as IA
  current_matrix_band = student_competency_matrix.band_score for this skill
  new_band = mock_skill_band × 0.60 + current_matrix_band × 0.40
  new_band = round(new_band × 2) / 2             // nearest 0.5
  new_band = clamp(0, 9)
```

### Overall Real Band

```
real_band = mean(new_band for each of 4 skills)
real_band = round(real_band × 2) / 2
```

### Momentum

```
+200  always (participation)
+500  if real_band ≥ any new 0.5 threshold
      (e.g. was 5.5, now 6.0 or above → +500)
      Threshold crossed = floor(new_real_band / 0.5) > floor(prev_real_band / 0.5)
```

### Previous Real Band (for comparison)

```
prev_real_band = mean(band_score from student_competency_matrix for all 4 skills)
```

---

## 5. Backend — Step-by-Step

### Files to create

| File | Purpose |
|---|---|
| `src/controllers/mockController.ts` | All 4 endpoints |
| `src/routes/mockRoutes.ts` | Router |

Register in `src/app.ts` (or wherever routes are mounted): `app.use('/api/mock', mockRoutes)`.

---

### Step 1 — `GET /api/mock/status`

**Checks (in order):**
1. Count completed `ia_sessions` per student — need ≥ 6 total AND ≥ 1 per skill
2. Check band improvement: `student_competency_matrix.band_score - diagnostic_band ≥ 0.5` for any skill
   - Diagnostic band = `AssessmentHistory` where `mode = DIAGNOSTIC`, latest per skill
3. Standard mock this month: query `mock_sessions` where `student_id = X AND month_year = currentMonth AND attempt_type = STANDARD AND status IN (PENDING, IN_PROGRESS, COMPLETED)`
4. Active session: `status IN (PENDING, IN_PROGRESS)`
5. Earned mock availability: `momentum_score ≥ 1500 AND ia_count ≥ 4 AND days_since_enrollment ≥ 14 AND band_improvement ≥ 0.5`
6. Earned mock used this month: query `attempt_type = EARNED AND status = COMPLETED` this month

**Response shape:**
```json
{
  "success": true,
  "is_eligible": true,
  "eligibility_reasons": [],
  "can_start_mock": true,
  "has_active_session": false,
  "active_session_id": null,
  "standard_used_this_month": false,
  "earned_mock_available": false,
  "earned_mock_eligible": false,
  "earned_mock_reasons": ["Need 1500 momentum (currently 810)"],
  "next_standard_available": null,
  "progress": {
    "ia_completed": 7,
    "ia_required": 6,
    "ia_per_skill": { "WRITING": 2, "SPEAKING": 2, "READING": 2, "LISTENING": 1 },
    "ia_per_skill_required": 1,
    "band_improved": true,
    "best_improvement": 1.5,
    "skill_improved": "WRITING"
  }
}
```

---

### Step 2 — `GET /api/mock/questions`

Analogous to `GET /api/ia/questions`. The key differences:

**New session flow:**
1. Validate eligibility (same checks as Step 1)
2. Validate no completed/active mock this month (for STANDARD type)
3. For each of 4 skills, call `fetchMockSectionQuestions(skill)`:
   - 10 MCQ/TFNG + 2 AI prompts for WRITING/SPEAKING (same as IA)
   - LISTENING: pick random `audio_url` group
   - READING: pick random `passage_id` group
4. Create `MockSession` with `window_closes_at = now() + 72h`
5. Store `question_ids = [{ skill, ids:[...] }, ...]` for all 4 sections
6. Set `answers.__meta = { current_section: 0, section_started_at: Date.now() }`

**Resume flow:**
- Same `__meta` → `current_section_idx` + `time_remaining_ms` per-section timer pattern

**Response:**
```json
{
  "success": true,
  "session_id": "uuid",
  "resume": false,
  "current_section_idx": 0,
  "sections": [
    { "skill": "LISTENING", "section_type": "AUDIO", "audio_url": "...", "questions": [...] },
    { "skill": "READING",   "section_type": "PASSAGE", "passage_text": "...", "questions": [...] },
    { "skill": "WRITING",   "section_type": "MCQ_MIX", "questions": [...] },
    { "skill": "SPEAKING",  "section_type": "MCQ_MIX", "questions": [...] }
  ],
  "saved_answers": {},
  "window_closes_at": "ISO",
  "time_remaining_ms": 1800000
}
```

---

### Step 3 — `POST /api/mock/answer`

**Body:** `{ session_id, question_id, answer }` OR `{ session_id, section_advance: N }`

Identical logic to `POST /api/ia/answer`. Copy, rename session lookup to `MockSession`.

---

### Step 4 — `POST /api/mock/submit`

**Pipeline:**

1. Validate: session exists, belongs to student, not COMPLETED, not past `window_closes_at`
2. Load `question_ids` for all 4 sections, fetch all questions with `prompt_text`
3. Strip `__meta` from answers
4. Parallel AI grading (same `Promise.all` pattern as IA)
5. Per-skill scoring: MCQ band + AI band → combined (same weighted formula)
6. Pre-fetch `StudentCompetencyMatrix.band_score` for all 4 skills (current matrix bands)
7. Apply scoring formula: `new_band = mock_band × 0.60 + current_matrix_band × 0.40`
8. Compute `real_band_score = mean(new_band for 4 skills)` → rounded to 0.5
9. Compare to `prev_real_band = mean(current matrix bands)` for threshold check
10. Compute momentum: +200 + (+500 if threshold crossed)
11. Fetch diagnostic bands for result display (from `AssessmentHistory` where `mode = DIAGNOSTIC`)

**DB Transaction:**
```
a) mock_sessions.update → status=COMPLETED, scores, real_band_score, momentum_awarded, time_submitted_at
b) AssessmentHistory.create × 4 (one per skill, mode=MOCK)
c) StudentCompetencyMatrix.upsert × 4 (update band_score to new_band per skill)
   Note: For mock, update band_score DIRECTLY (not sub-skill-level weighted update)
   Sub-skill scores in sub_scores JSONB are preserved unchanged
d) institute_students.update → momentum_score += momentumAwarded
```

**Response:**
```json
{
  "success": true,
  "real_band_score": 6.5,
  "prev_real_band": 5.5,
  "real_band_delta": 1.0,
  "threshold_crossed": true,
  "momentum_awarded": 700,
  "momentum_breakdown": [
    { "reason": "Participation", "points": 200 },
    { "reason": "New band threshold — crossed 6.0", "points": 500 }
  ],
  "updated_momentum": 2100,
  "skill_scores": [
    {
      "skill": "LISTENING",
      "mock_band": 7.0,
      "previous_matrix_band": 5.0,
      "new_matrix_band": 6.2,     // 7.0×0.6 + 5.0×0.4
      "diagnostic_band": 4.5,
      "delta_from_diagnostic": 1.7,
      "correct": 7, "total": 8, "ai_graded": false
    },
    ...
  ]
}
```

---

## 6. Frontend — Step-by-Step

### New file: `src/features/student/components/MockTest.tsx`

Copy `Assessment.tsx` as the base. The component structure is ~80% identical.

**What changes vs Assessment.tsx:**

| Aspect | Assessment.tsx (IA) | MockTest.tsx (Mock) |
|---|---|---|
| API base path | `/api/ia/...` | `/api/mock/...` |
| Number of sections | 2 | 4 |
| Section timer | 20 min | Varies per skill (L: 30, R: 30, W: 40, S: 20) |
| Gate screen | IA schedule + DCS | Eligibility check + monthly status |
| Gate eligibility | `can_start_test` | `can_start_mock` |
| Gate "earned" path | — | Show momentum exchange button (1500 pts) |
| Results screen | 2 sub-skill bands | 4 skill bands + Overall Real Band + diagnostic delta |
| Timer label | "IA Score" | "Mock Score" |
| Competency display | sub-skill → matrix band | skill → Real Band |

### Step 1 — Gate screen (`renderMockGate`)

Show:
- Eligibility status with progress (IAs done, band improvement)
- "Start Mock" button if eligible + not used this month
- "Mock used this month — next available: June 1" if used
- "Exchange 1500 Momentum" button if earned path available

### Step 2 — Session screen

Same as IA with 4 sections. Section order: LISTENING → READING → WRITING → SPEAKING (IELTS order).

Per-section timers:
```typescript
const MOCK_SECTION_MS: Record<string, number> = {
  LISTENING: 30 * 60 * 1000,
  READING:   30 * 60 * 1000,
  WRITING:   40 * 60 * 1000,
  SPEAKING:  20 * 60 * 1000,
};
```

On section advance, use the next section's timer (not a flat reset to 20 min).

### Step 3 — Interim screen

Show: next skill name, section number (e.g., "Section 2 of 4"), next section timer duration.

### Step 4 — Results screen (`renderMockResults`)

Structure:
```
┌─── OVERALL REAL BAND ────────────────────┐
│         6.5  ↑ +1.0 from diagnostic      │
│  "Real Band = Mock×60% + Matrix×40%"     │
└──────────────────────────────────────────┘

┌──────────────── 4 SKILL GRID ───────────┐
│  LISTENING  READING  WRITING  SPEAKING  │
│  Diag: 4.5  5.0      4.0     4.5       │
│  Now:  6.2  6.0      6.5     6.5       │
│  ↑+1.7 ↑+1.0  ↑+2.5  ↑+2.0           │
└─────────────────────────────────────────┘

┌─ MOMENTUM ──────────────────────────────┐
│  +700  (+200 participation, +500 new    │
│         threshold 6.0 crossed)          │
└─────────────────────────────────────────┘
```

Fields needed from API response per skill:
- `mock_band` — what they scored in this mock
- `new_matrix_band` — Real Band after formula
- `diagnostic_band` — baseline from first diagnostic
- `delta_from_diagnostic` — improvement since start

### Step 5 — Route registration

Add `MockTest` page to the router at `/student/mock-test`.

---

## 7. Section Timer Logic (per-skill)

Unlike IA (flat 20 min), mock has different timers per skill. The frontend `advanceToNextSection` needs to know the NEXT section's duration:

```typescript
// After advancing to section N, set timer to that section's duration
const nextSection = isSections?.[nextIdx];
const nextTimerMs = nextSection?.skill
  ? MOCK_SECTION_MS[nextSection.skill.toUpperCase()] ?? 30 * 60 * 1000
  : 30 * 60 * 1000;
setTimeLeft(Math.floor(nextTimerMs / 1000));
```

For resume, `time_remaining_ms` from backend already reflects elapsed real time — same `Date.now() - section_started_at` formula.

---

## 8. Execution Order Checklist

### Phase 0 — DB
- [ ] Add `MockSessionStatus` and `MockAttemptType` enums to schema
- [ ] Add `MockQuestion` model to schema
- [ ] Add `MockSession` model to schema
- [ ] Run migration: `prisma migrate dev --name add_mock_tables`
- [ ] Verify `mock_sessions` and `mock_questions` tables in pgAdmin

### Phase 1 — Backend
- [ ] `src/routes/mockRoutes.ts` — 4 routes: GET status, GET questions, POST answer, POST submit
- [ ] Register `mockRoutes` in app entry point
- [ ] `GET /api/mock/status` — eligibility, monthly check, earned check
- [ ] `GET /api/mock/questions` — new + resume with per-skill timer
- [ ] `POST /api/mock/answer` — copy `saveIAAnswer`, swap model name
- [ ] `POST /api/mock/submit` — scoring with `Mock×0.60 + Matrix×0.40` formula, real band
- [ ] TypeScript compile clean

### Phase 2 — Question Seeding
- [ ] Seed LISTENING questions (10 questions around 1 audio passage)
- [ ] Seed READING questions (10 TFNG/MCQ around 1 passage)
- [ ] Seed WRITING questions (8 MCQ for grammar/vocabulary + 2 WRITING_PROMPT Task 1 + Task 2)
- [ ] Seed SPEAKING questions (8 MCQ for fluency/grammar + 2 SPEAKING_PROMPT Parts 1+2)
- [ ] Verify `SELECT COUNT(*) FROM mock_questions GROUP BY skill;`

### Phase 3 — Frontend
- [ ] `MockTest.tsx` — base from Assessment.tsx
- [ ] Update API paths (`/api/mock/...`)
- [ ] Per-skill section timers (`MOCK_SECTION_MS` map)
- [ ] `advanceToNextSection` uses next section's timer (not flat 20 min)
- [ ] Gate screen: eligibility progress + "Start Mock" + "Exchange" button
- [ ] Results screen: Overall Real Band + 4-skill grid with diagnostic delta + momentum
- [ ] Route registration at `/student/mock-test`

### Phase 4 — Integration
- [ ] Test Path A: Full 4-section completion, check Real Band formula in DB
- [ ] Test Path B: Mid-exit after Section 2, resume with correct timer
- [ ] Test eligibility gate: <6 IAs → blocked correctly
- [ ] Test monthly cap: second standard mock in same month → blocked
- [ ] Test earned mock: 1500 pts deducted from momentum on start
- [ ] Test threshold bonus: verify +500 fires when crossing a new 0.5 boundary
- [ ] TypeScript compile clean on both repos

---

## 9. Key Implementation Notes

**`mock_sessions` unique constraint:** `(student_id, month_year, attempt_type)` — enforces 1 STANDARD + 1 EARNED per month at the DB level. The `month_year` string `"2026-05"` is computed as `toISTDateString(new Date()).slice(0, 7)`.

**Real Band formula applies at SKILL level, not sub-skill level.** The IA updated individual sub-skill scores inside `sub_scores` JSONB. The mock updates the top-level `band_score` per skill directly (the weighted formula uses the current `band_score`, not sub-skill averages). Sub-skill `sub_scores` entries are NOT modified by a mock — they remain from IA history.

**Diagnostic band for delta display** — fetch from `AssessmentHistory` where `mode = DIAGNOSTIC`, latest per skill. This is the "Before" baseline for the result screen.

**1500 momentum exchange flow:** On `GET /api/mock/questions`, if `?attempt_type=earned`:
- Validate earned eligibility
- Validate no earned mock this month
- Atomically: deduct 1500 from `momentum_score` + create `mock_sessions` row with `attempt_type = EARNED`

**Abandoned sessions:** A cron or background check (similar to IA miss detection in `getMockStatus`) marks sessions as `ABANDONED` if `now > window_closes_at AND status IN (PENDING, IN_PROGRESS)`. No momentum penalty — student loses their standard slot for the month, that's all.
