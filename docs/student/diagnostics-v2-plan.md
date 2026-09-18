# Diagnostics Engine V2 — Plan & Task Split

**Date:** 2026-08-05  
**Status:** Planning  
**Authors:** Engineering Team

---

## 1. Current State Assessment

### What We Have (V1)

The diagnostic is a **one-time, 4-skill sequential assessment** that:

| Aspect | V1 Reality |
|---|---|
| **Flow** | Onboarding → L → R → W → S → Summary |
| **Level selection** | Fixed: target band → A/B/C → random set |
| **Listening/Reading** | MCQ + TFNG, objective grading (correct/total → band 4–9) |
| **Writing** | Gemini 2.5 Flash, 4 criteria averaged, anti-gaming word-count cap |
| **Speaking** | Gemini 2.5 Flash, 3-layer content validation, 90s max, WebM upload |
| **Output** | One band score per skill, level badge, basic AI feedback |
| **Anti-gaming** | Server-side denominator, word-count cap, speaking content validation |
| **Resilience** | localStorage resume, tab-lock via BroadcastChannel, 10s status polling |
| **Retake** | ❌ One-time only, locked after all 4 skills |
| **Sub-skill breakdown** | ⚠️ Only for Writing (4 criteria) and Speaking (4 criteria); L/R only accuracy % |
| **Adaptive difficulty** | ❌ Fixed level from target band, no in-session adaptation |
| **Progress tracking** | ⚠️ AssessmentHistory table exists but no UI to view history |

### What V1 Does Well

- Secure one-time assessment with server enforcement
- Gemini-powered writing and speaking grading with strict IELTS rubrics
- Anti-inflation prompting ("accuracy not encouragement")
- Tab conflict detection prevents exam duplication
- Question set pinning (M-20) prevents silent re-rolling on refresh
- Absolute band floor 4.0 — no junk scores

### What V1 Lacks (Market Gap)

1. No adaptive difficulty — same level from start to finish regardless of answers
2. Sub-skill diagnosis for Listening/Reading (only accuracy %, no category breakdown)
3. No learning roadmap generated from the diagnostic result
4. No instructor dashboard analytics on diagnostic completion/distribution
5. No retake mechanism — single bad session locks the student permanently
6. Generic result cards — no visual "where you stand" chart
7. No estimated time-to-target-band calculation
8. Speaking lacks pronunciation phoneme details and WPM/fluency metrics

---

## 2. V2 Vision — What "Market-Sellable" Looks Like

> A diagnostic that doesn't just tell a student their band — it tells them exactly **why**, shows them **where they leak marks**, and hands the instructor a **cohort heat-map** they can act on in the same session.

### V2 Core Pillars

| Pillar | What It Means |
|---|---|
| **Granular sub-skill diagnosis** | Every skill broken into 3–4 measurable sub-skills with individual scores |
| **Personalised learning roadmap** | Post-diagnostic page shows priority sub-skills, recommended exercises, estimated weeks to target |
| **Instructor cohort analytics** | Real-time completion rate, band distribution, flagged at-risk students |
| **Controlled retake** | Instructor-triggered re-diagnosis (e.g. after 4 weeks of practice) |
| **Enhanced AI feedback** | Sentence-level writing annotations, phoneme-level speaking notes |
| **Visual identity** | Radar/spider chart replacing the plain 2×2 grid on the summary screen |

---

## 3. Task Split

---

## GOKUL — Frontend Tasks

### G-D1 · Diagnostic Summary Screen — Radar Chart

**File:** `Diagnosis.tsx` lines 1790–1871 (`DiagnosticSummaryScreen` component)

**Current:** 2×2 grid of 4 skill cards showing band + level badge.

**Change:**
- Replace the 2×2 grid with a **radar/spider chart** (canvas-based, no CDN):
  - 4 axes: Listening, Reading, Writing, Speaking
  - Student's band plotted on each axis (4–9 scale)
  - Target band shown as a second dotted polygon
  - Band scores listed below the chart with colour-coded chips
- Retain the "overall average band" hero number above the chart
- Retain the level badge + message
- Add a "Download Report" button (triggers a printable view — see G-D4)

**Skills to add below the chart (collapsed by default, expandable):**
- Writing: Task Achievement / Coherence / Vocabulary / Grammar mini-bars
- Speaking: Fluency / Vocabulary / Grammar / Pronunciation mini-bars
- L/R: accuracy % + MCQ vs TFNG breakdown (data already in sub_scores)

---

### G-D2 · Diagnostic Result Cards — Sub-skill Breakdowns

**Files:**
- `InterimResultCard` (Diagnosis.tsx lines 517–623)
- `SpeakingResultCard` (Diagnosis.tsx lines 1683–1784)

**Current:** Band score + level badge + plain text feedback.

**Change (InterimResultCard for Writing):**
- Show 4 horizontal progress bars (Task Achievement / Coherence / Vocabulary / Grammar)
- Each bar colour-coded: red <5.5, amber 5.5–6.5, green ≥7.0
- One highlighted "priority action" callout box from `feedback.priority_action`
- One collapsible "Detailed Feedback" accordion showing per-criterion rationale + error examples

**Change (InterimResultCard for Listening/Reading):**
- Show "N / M correct" prominently
- Break down by question type (MCQ vs TFNG) if both present
- Accuracy % as a circular progress ring

**Change (SpeakingResultCard):**
- Keep criterion table but add **filler word count** chip (data already in `feedback.filler_words_detected`)
- Add "Strongest area" / "Weakest area" highlight chips
- Show priority action callout with icon

---

### G-D3 · Post-Diagnostic Learning Roadmap Page

**New page:** `/student/diagnostic/roadmap`  
**Component:** `DiagnosticRoadmap.tsx` (new file)

**Triggered:** "Go to Dashboard" on summary screen should route to roadmap first (one-time, on first diagnosis completion). Can be re-visited from dashboard.

**Layout:**
- Header: "Your Personalised IELTS Roadmap" + current bands
- **Priority Focus** section: top 2 weakest sub-skills highlighted with "Start here" CTA
- **Skill Cards** (4): each shows current band → target band gap, top 3 improvement actions
- **Estimated Timeline** card: weeks to target based on gap and historical improvement curves (static formula first: 2 weeks per 0.5 band improvement)
- "Start Practice" button per skill that links to the relevant drill section

**Data source:** Use existing `StudentCompetencyMatrix` + `AssessmentHistory` already saved; no new backend endpoint needed for V1 of this page.

---

### G-D4 · Printable Diagnostic Report

**Trigger:** "Download Report" button on summary screen and roadmap page.

**Approach:** `window.print()` on a styled `@media print` page, no server-side PDF needed.

**Content:**
- Student name, date, institute
- Radar chart (rendered canvas → `toDataURL`)
- Skill-by-skill breakdown table
- AI feedback summary per skill
- Recommended next steps

---

### G-D5 · Instructor Diagnostic Overview — Cohort Analytics

**File:** `DiagnosticOverviewTab.tsx`

**Current:** Table with student name, status, L/R/W/S bands, date.

**Add:**

**Summary row at top:**
```
[Completed: 12/20]  [Avg Band: 6.2]  [At Risk (<5.5): 3]  [Pending: 8]
```
- "At Risk" = students with any skill < 5.5
- Clicking "At Risk" filters the table

**Band Distribution mini-chart:**
- 5 columns: <5.0 / 5.0–5.5 / 6.0–6.5 / 7.0–7.5 / ≥8.0
- Bar height proportional to student count
- Per-skill selector (Listening/Reading/Writing/Speaking/Overall)

**Table enhancements:**
- Colour-code band cells: red <5.5, amber 5.5–6.5, green ≥7.0 (already partially done, confirm consistent)
- Add "Retake" button per student row (calls backend retake endpoint — see Shalom S-D3)
- Sortable columns (band score, date, status)

---

### G-D6 · Instructor Student Diagnostic Detail — DiagnosticTab

**File:** `DiagnosticTab.tsx`

**Current:** Shows skill cards with band + feedback + mini bar charts.

**Add:**
- Timeline section: shows all previous diagnostic attempts if retakes enabled (array from AssessmentHistory)
- "Band over time" sparkline per skill (simple SVG, no library)
- "Request Retake" button → opens confirmation modal → calls retake endpoint

---

### G-D7 · Diagnostic Onboarding Screen Polish

**File:** `Diagnosis.tsx` — `OnboardingScreen` component

**Current:** Collects name + target band. Minimal design.

**Change:**
- Add a visual **"what to expect"** section: 4 step pills (Listening ~8 min → Reading 5 min → Writing 20 min → Speaking 2 min)
- Show time estimate badge: "Total: ~35 minutes"
- Ensure mobile-responsive (the current grid may break on 375px)
- Add a "Tips before you start" collapsible (mute environment, check mic, etc.)

---

## SHALOM — Backend Tasks

### S-D1 · API Verification — All 4 Endpoints

Verify each endpoint works correctly in dev environment and document actual vs. expected behaviour.

#### S-D1a · GET `/api/diagnostic/status`

**Verify:**
- [ ] Returns `{ isDiagnosed: true, all_flags: true }` when `student.isDiagnosed = true`
- [ ] Returns correct partial status from `diagnostic_status` VIEW when only some skills done
- [ ] Returns all-false row when student has no entries in `StudentCompetencyMatrix`
- [ ] Returns 401 when no auth token
- [ ] Returns 404 when studentId not in institute_students
- [ ] `diagnostic_status` VIEW exists in DB — run `\dv "diagnostic_status"` on VPS

**Known risk:** If the `diagnostic_status` VIEW was created manually (diagnostic_setup.sql) it may not exist on dev/prod DB. Verify it exists or re-run the SQL.

#### S-D1b · GET `/api/diagnostic/questions/:skill`

**Verify:**
- [ ] Returns a set for LISTENING with `set_id`, `audio_url`, and `questions[]`
- [ ] Returns a set for READING with `set_id` and `questions[]` (no audio)
- [ ] Returns single prompt for WRITING with `id`, `topic`, `minWords`
- [ ] Returns single prompt for SPEAKING with `id`, `topic`
- [ ] `?set_id=` pin re-serves same questions for L/R
- [ ] `?question_id=` pin re-serves same prompt for W/S
- [ ] Invalid `?set_id=` falls back to random pick (no 500)
- [ ] Returns 404 / graceful error when **no active questions exist** for the level+skill combination

**Known risk (critical):** If `diagnostic_questions` table has no rows for a given level+skill, `pickRandomSetId` likely returns `undefined` and the subsequent `findMany` returns `[]` — frontend will show blank question screen. Need explicit "no questions available" error response.

#### S-D1c · POST `/api/diagnostic/submit/:skill`

**Verify:**
- [ ] Listening: correct band returned when all answers correct
- [ ] Listening: band = 4.0 when all answers wrong
- [ ] Reading: same
- [ ] Writing: returns 422 with `error: 'text_too_short'` when < 10 words
- [ ] Writing: band capped ≤ 5.0 when under minWords (150/250)
- [ ] Resubmission blocked: second POST for same skill returns 409
- [ ] isDiagnosed=true student blocked: returns 409 on any submit
- [ ] Missing `answers` field: returns 400

#### S-D1d · POST `/api/diagnostic/submit/speaking`

**Verify:**
- [ ] Valid WebM audio → returns band score + transcript + sub_scores
- [ ] Empty/silent file → returns `{ error: 'no_speech_detected', can_retry: true }`
- [ ] File > 15 MB → Multer returns 413 (test with a large file)
- [ ] No file attached → returns 400 `{ error: 'Audio file required.' }`
- [ ] After submission, audio file is deleted from disk (not left in uploads/)
- [ ] `needs_retry: true` path: student can submit a second recording without being blocked

---

### S-D2 · Evaluation Engine Improvements

#### S-D2a · Writing — Sentence-Level Feedback

**Current:** `ieltsWritingService.ts` returns feedback per criterion (e.g. "observed_issues": ["Generic examples used"]).

**V2:** Add a `sentence_annotations` array to the response:

```json
"sentence_annotations": [
  {
    "original": "The graph show an increase.",
    "issue": "Subject-verb agreement error",
    "correction": "The graph shows an increase.",
    "criterion": "grammar"
  }
]
```

**Implementation:**
- Extend the Gemini prompt to output `sentence_annotations[]` alongside existing fields
- Add post-processing validation: max 5 annotations, strip anything > 100 chars
- Store in `sub_scores.sentence_annotations` (JSON column, no schema change)
- Frontend (Gokul G-D2) reads this to render inline highlights

**Model:** Keep Gemini 2.5 Flash — add ~200 tokens to the prompt, test latency impact.

#### S-D2b · Speaking — WPM + Filler Rate Metrics

**Current:** `filler_words_detected` string array, `transcript` text.

**V2:** Add to `sub_scores`:

```json
"words_per_minute": 112,
"filler_rate_percent": 8,
"meaningful_word_count": 87,
"total_duration_seconds": 62
```

**Implementation:**
- `words_per_minute`: `meaningful_word_count / (duration_seconds / 60)`
- `filler_rate_percent`: `filler_count / total_word_count * 100`
- `duration_seconds`: derive from file size (approx) or add a `duration` field to the multipart form
- Frontend (Gokul G-D2) shows WPM chip on SpeakingResultCard
- All calculated post-transcript, no additional Gemini call

#### S-D2c · Listening/Reading — Question-Type Sub-Scores

**Current:** Returns `by_question_type: { mcq: { correct: N, total: M }, tfng: { correct: N, total: M } }` in sub_scores — already computed but frontend doesn't surface it.

**V2 (no code change needed on backend):** Confirm the data is present, then hand off to Gokul G-D2 to display it.

**Verify:** Check that `byType` in `diagnosticController.ts` line 336 actually outputs per-type data in the response and it reaches the frontend.

#### S-D2d · Band Calculation — Weighted Criteria (Writing V2)

**Current:** Simple average of 4 criteria.

**IELTS standard weighting:**
- Task 1: Task Achievement 25%, Coherence 25%, Vocabulary 25%, Grammar 25% → same as current ✅
- Task 2: Task Response 25%, Coherence 25%, Vocabulary 25%, Grammar 25% → same ✅

**No change needed** — current implementation matches IELTS. Document this explicitly.

---

### S-D3 · Instructor-Triggered Retake Endpoint

**New endpoint:** `POST /api/diagnostic/retake`

**Auth:** Instructor JWT only (not student).

**Body:**
```json
{ "student_id": "uuid" }
```

**Logic:**
1. Verify requesting user is instructor/admin
2. Check student exists in `institute_students`
3. Set `isDiagnosed = false`
4. Do NOT delete `AssessmentHistory` (keep history)
5. Do NOT clear `StudentCompetencyMatrix` (keep current scores; they'll be overwritten on next submission)
6. Return `{ ok: true, message: "Retake enabled for student." }`

**On frontend (Gokul G-D6):** "Request Retake" button calls this endpoint, then student can re-do the diagnostic. Second diagnostic submission UPDATEs the `StudentCompetencyMatrix` row (upsert already handles this).

**Security note:** Only instructor role can call this. Verify `authMiddleware` role check.

---

### S-D4 · Question Bank Audit — Relevancy & Count

**Goal:** Ensure every level×skill combination has enough questions to serve reliably.

**Minimum viable counts:**

| Skill | Level | Minimum sets/prompts |
|---|---|---|
| Listening | A | ≥ 3 sets (each set ~8 questions) |
| Listening | B | ≥ 3 sets |
| Listening | C | ≥ 3 sets |
| Reading | A | ≥ 3 sets |
| Reading | B | ≥ 3 sets |
| Reading | C | ≥ 3 sets |
| Writing | A | ≥ 5 prompts |
| Writing | B | ≥ 5 prompts |
| Writing | C | ≥ 5 prompts |
| Speaking | A | ≥ 5 prompts |
| Speaking | B | ≥ 5 prompts |
| Speaking | C | ≥ 5 prompts |

**Audit queries to run on DB:**

```sql
-- Sets per level+skill (Listening/Reading)
SELECT skill, level, COUNT(DISTINCT set_id) AS sets, COUNT(*) AS total_questions
FROM diagnostic_questions
WHERE skill IN ('LISTENING', 'READING') AND is_active = TRUE
GROUP BY skill, level
ORDER BY skill, level;

-- Prompts per level+skill (Writing/Speaking)
SELECT skill, level, COUNT(*) AS prompts
FROM diagnostic_questions
WHERE skill IN ('WRITING', 'SPEAKING') AND is_active = TRUE
GROUP BY skill, level
ORDER BY skill, level;
```

**Deliverable:** Run these queries, document the actual counts in a table, flag any combination with fewer than the minimum, seed additional questions as needed using the idempotent seed runner.

**Relevancy check (manual review):**
- Are Writing prompts clearly IELTS Task 1 or Task 2 format? (`min_words` ≥ 250 → Task 2, < 250 → Task 1)
- Are Speaking prompts genuine Part 2 cue cards (describe a person/place/experience)?
- Are Listening passages at the right difficulty per level?
- Are correct answers verified for all MCQ/TFNG questions?

---

### S-D5 · Edge Case Hardening

#### S-D5a · No Questions Available (Critical)

**Issue:** `pickRandomSetId` returns `undefined` when no active questions exist for a level+skill. Downstream `findMany` silently returns `[]` — frontend shows blank question screen with no error.

**Fix in `diagnosticController.ts` (questions route, ~line 131):**
```typescript
const setId = await pickRandomSetId(level, skill);
if (!setId) {
  return res.status(503).json({
    ok: false,
    error: 'no_questions_available',
    message: `No active ${skill} questions available for level ${level}. Please contact support.`
  });
}
```

Same pattern for Writing/Speaking (`rows.length === 0` check already exists — confirm it returns 503 not 500).

#### S-D5b · AI Service Timeout / Outage

**Current:** Writing: no timeout configured. Speaking: catches `aiErr` → 502 `can_retry: true`.

**Fix for Writing:** Add a `Promise.race` timeout:
```typescript
const WRITING_TIMEOUT_MS = 30_000;
const analysis = await Promise.race([
  analyzeWriting(topic, text, taskType),
  new Promise((_, reject) =>
    setTimeout(() => reject(new Error('grading_timeout')), WRITING_TIMEOUT_MS)
  )
]);
```
On timeout → return 504 `{ error: 'grading_timeout', can_retry: true }`.

**Verify Speaking timeout:** `ieltsSpeakingService.ts` — does it have a Gemini timeout? Check `generationConfig` or wrap similarly.

#### S-D5c · Concurrent Submit Race

**Scenario:** Student double-taps "Submit", sends two identical POST requests within milliseconds.

**Current protection:** `isSkillAlreadyScored()` checks `AssessmentHistory` but both requests may pass this check before either inserts.

**Fix:** Add a unique constraint to `AssessmentHistory` on `(student_id, skill, mode)` — this will cause the second insert to fail with a unique violation, which the controller should catch and return 409.

```sql
ALTER TABLE "AssessmentHistory" ADD CONSTRAINT uq_assessment_student_skill_mode
UNIQUE (student_id, skill, mode);
```

**Note:** Only safe if a student can only have one DIAGNOSTIC entry per skill, which is the intended design. Retakes would need mode differentiation (e.g. `DIAGNOSTIC_RETAKE`).

#### S-D5d · Speaking File Cleanup on All Error Paths

**Current:** File is deleted in `finally` block for the happy path. But check that the pre-flight checks (isDiagnosed, isSkillAlreadyScored) also delete the file before returning 409.

**Verify lines 429–443:** Confirm both early returns call `fs.unlink(req.file.path)`.

#### S-D5e · `diagnostic_status` VIEW Missing on VPS

**Current:** Controller queries `SELECT * FROM "diagnostic_status"`. If the VIEW doesn't exist on VPS DB, this 500s for every student checking status.

**Verify:** SSH to VPS, run `psql -d testcrack_db_dev -c "\dv"` and confirm `diagnostic_status` exists. If not, run `diagnostic_setup.sql` section for the VIEW.

---

### S-D6 · Assessment History API (New — enables retake history UI)

**New endpoint:** `GET /api/diagnostic/history`

**Auth:** Student JWT.

**Response:**
```json
{
  "ok": true,
  "attempts": [
    {
      "attempt_number": 1,
      "created_at": "2026-07-01T10:30:00Z",
      "skills": {
        "LISTENING": { "band_score": 6.0, "sub_scores": {} },
        "READING":   { "band_score": 6.5, "sub_scores": {} },
        "WRITING":   { "band_score": 5.5, "sub_scores": {} },
        "SPEAKING":  { "band_score": 6.0, "sub_scores": {} }
      }
    }
  ]
}
```

**Query:** Group `AssessmentHistory` rows by `mode = 'DIAGNOSTIC'`, order by `created_at`, group by closest timestamp cluster (within 1 hour = same attempt).

**Used by:** Gokul G-D6 (sparkline chart on DiagnosticTab).

---

## 4. Feasibility & Priority

| Task | Owner | Effort | Priority |
|---|---|---|---|
| G-D1 Radar chart | Gokul | M (2–3 days) | HIGH |
| G-D2 Sub-skill breakdowns on result cards | Gokul | M (2 days) | HIGH |
| G-D3 Learning roadmap page | Gokul | L (3–4 days) | HIGH |
| G-D4 Printable report | Gokul | S (1 day) | MEDIUM |
| G-D5 Instructor cohort analytics | Gokul | M (2–3 days) | HIGH |
| G-D6 Instructor student diagnostic detail | Gokul | S (1 day) | MEDIUM |
| G-D7 Onboarding screen polish | Gokul | S (half day) | LOW |
| S-D1 API verification | Shalom | S (1 day) | CRITICAL |
| S-D2a Sentence-level feedback | Shalom | M (2 days) | HIGH |
| S-D2b Speaking WPM/filler metrics | Shalom | S (half day) | MEDIUM |
| S-D3 Retake endpoint | Shalom | S (1 day) | HIGH |
| S-D4 Question bank audit | Shalom | M (1–2 days) | CRITICAL |
| S-D5 Edge case hardening | Shalom | M (1–2 days) | HIGH |
| S-D6 History API | Shalom | S (half day) | MEDIUM |

**Suggested order:**
1. Shalom: S-D1 (verify APIs work end-to-end) → S-D4 (question bank audit) → S-D5 (edge cases) → S-D3 (retake) → S-D2 (enhancements)
2. Gokul: G-D2 (result card sub-skills, uses existing data) → G-D1 (radar chart) → G-D5 (instructor analytics) → G-D3 (roadmap) → G-D4/G-D6/G-D7

---

## 5. What Makes V2 Sellable

> **Talking points for demos and sales:**

- **"We don't just test — we diagnose."** Unlike generic IELTS prep apps, we break Writing into Task Achievement, Coherence, Vocabulary, and Grammar — the same 4 criteria IELTS examiners use. Students know exactly which criterion is holding their band down.
- **"AI examiner, not AI autocorrect."** Our Gemini-powered writing grader is calibrated to be strict — the same calibration the British Council uses. Students get accurate bands on day one, not inflated numbers that mislead them.
- **"Re-diagnose after 4 weeks."** Instructors can unlock a re-diagnosis after a coaching block. The student's improvement curve is visible at a glance — a clear ROI story for institutes.
- **"Cohort heat-map."** In 30 seconds, an instructor can see which 3 students in a 20-student batch are at risk of not reaching their target band before their exam date.
- **"No surprises on exam day."** Our speaking validator catches silent recordings, filler-only responses, and off-topic answers — the same failure modes that trip students on real IELTS.

---

## 6. Appendix — File Reference

| File | Relevant Lines | What It Does |
|---|---|---|
| `diagnosticController.ts` | 1–507 | All 4 API handlers + save + mark-diagnosed logic |
| `diagnosticRoutes.ts` | 25–34 | Route definitions |
| `bandScale.ts` | all | fractionToBand, internalToBand, toBand, bandToLevel |
| `ieltsWritingService.ts` | 1–194 | Gemini writing grading |
| `ieltsSpeakingService.ts` | 96–256 | Gemini speaking grading + 3-layer content validation |
| `Diagnosis.tsx` | 1–2390 | Full student diagnostic flow (frontend) |
| `DiagnosticTab.tsx` | all | Instructor student detail view |
| `DiagnosticOverviewTab.tsx` | all | Instructor cohort overview |
| `schema.prisma` | 918–937 | `diagnostic_questions` model |
| `schema.prisma` | 666–697 | `StudentCompetencyMatrix` + `AssessmentHistory` |
