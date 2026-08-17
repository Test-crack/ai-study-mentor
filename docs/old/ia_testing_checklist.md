# IA Testing Checklist
**Branch:** `feature/ielts-flow` | **Date:** 7 May 2026

---

## Pre-flight

Before any test run, confirm:
- [ ] Backend server running (`npm run dev` in `backend-study-mentor`)
- [ ] Frontend server running (`npm run dev` in `ai-study-mentor`)
- [ ] `VITE_BACKEND_URL` in frontend `.env` points to the running backend
- [ ] DB seeded — run in pgAdmin: `SELECT COUNT(*) FROM ia_questions;` → must be > 0
- [ ] Student account exists and has completed **≥ 6 drill sessions** over **≥ 2 calendar days** (required to unlock IA day)

---

## Path A — Happy Path: Complete IA in one sitting

### A1. Eligibility gate shows correctly
1. Log in as the test student.
2. Navigate to **Internal Assessment** (`/student/internal-assessment`).
3. **Expected:** Gate screen shows IA schedule with an upcoming IA date.

If today is not a scheduled IA day, `can_start_test = false` and the "Start Test" button is hidden. Check `next_ia.date` on the gate to see when the next window opens.

To force today to be an IA day without waiting: in the DB, update the student's first drill session `created_at` so that `DATEDIFF(days, created_at, GETDATE()) % 3 = 0` (i.e., it's a multiple of 3 days from first drill).

### A2. Start test — questions load
1. On an IA day, click **Start Test**.
2. **Expected (`GET /api/ia/questions`):**
   - 2 sections appear, each with 10 questions
   - Section header shows sub-skill name (GRAMMAR, VOCABULARY, READING, etc.)
   - 20-minute timer starts counting down
   - DB: `ia_sessions` row created with `status = IN_PROGRESS`, `time_started_at` set

**DB verify:**
```sql
SELECT id, student_id, ia_number, ia_date, status, selected_subskills, 
       time_started_at, window_closes_at
FROM ia_sessions
ORDER BY created_at DESC LIMIT 1;
```

### A3. Answer questions and save mid-session
1. Answer a question in Section 1.
2. **Expected (`POST /api/ia/answer`):** each answer fires silently to the backend.

**DB verify (after answering a few):**
```sql
SELECT answers FROM ia_sessions ORDER BY created_at DESC LIMIT 1;
```
The `answers` JSONB should contain `{ "question_uuid": "A", ... }`.

### A4. Complete Section 1 → advance to Section 2
1. Click through all 10 questions in Section 1.
2. **Expected:** Brief "Section Complete" interim screen appears, then Section 2 loads.
3. Answer all 10 questions in Section 2.

### A5. Submit IA → results screen
1. Click **Submit IA** on the last question.
2. **Expected (`POST /api/ia/submit { session_id }`):**
   - Scoring screen shows briefly
   - Results screen appears with:
     - `+ N` momentum banner (amber, large number)
     - 2 section score cards showing sub-skill, band (e.g. 6.5), correct/total
   - Momentum in top nav updates immediately

**DB verify:**
```sql
-- Session marked complete
SELECT status, scores, momentum_awarded, time_submitted_at
FROM ia_sessions ORDER BY created_at DESC LIMIT 1;

-- AssessmentHistory rows created (one per sub-skill)
SELECT skill, mode, band_score, sub_scores, created_at
FROM assessment_history
WHERE mode = 'INTERNAL_ASSESSMENT'
ORDER BY created_at DESC LIMIT 5;

-- CompetencyMatrix updated
SELECT skill, band_score, sub_scores, assessments_count, last_updated
FROM student_competency_matrix
WHERE student_id = '<student_uuid>'
ORDER BY last_updated DESC;

-- Momentum incremented
SELECT momentum_score FROM institute_students WHERE id = '<student_uuid>';
```

**Momentum calculation to verify manually:**
- Base: +100
- Per sub-skill: +50 if band > 0 (first-ever IA = personal best)
- If second+ IA: +25 if improved vs last IA band; +50 if new all-time best
- First IA with 2 sub-skills both > 0 band → should see **+200** total

---

## Path B — Resume: Mid-exit and re-entry

### B1. Exit mid-test and re-enter
1. Start the test (click Start Test → questions load).
2. Answer 3-4 questions.
3. **Navigate away** (close the tab or go to dashboard) without submitting.
4. Return to Internal Assessment on the same IA day.
5. Click **Continue Test**.
6. **Expected (`GET /api/ia/questions` with existing session):**
   - Response has `resume: true`
   - Previously answered questions are **pre-filled** with saved answers
   - Timer continues from remaining time (not reset to 20:00)
   - No new session row created

**DB verify:**
```sql
SELECT COUNT(*) FROM ia_sessions WHERE student_id = '<student_uuid>';
-- Should be 1 (not 2) — no duplicate session created
```

### B2. Submit resumed session
1. Complete remaining questions after re-entry.
2. Submit normally.
3. **Expected:** Same results screen as Path A.

---

## Path C — Miss Detection

### C1. Simulate a missed IA
In pgAdmin, create a past IA session with `status = PENDING` or `IN_PROGRESS`:
```sql
-- Find the student_id
SELECT id FROM institute_students WHERE user_id = '<supabase_user_uuid>';

-- Insert a stale session dated yesterday
INSERT INTO ia_sessions (
  student_id, ia_number, ia_date, status,
  selected_subskills, question_ids, answers,
  window_closes_at, carry_forward_subskills
) VALUES (
  '<student_uuid>',
  1,
  CURRENT_DATE - INTERVAL '3 days',   -- a past IA day
  'PENDING',
  '[{"skill":"WRITING","sub_skill":"GRAMMAR"}]',
  '[]',
  '{}',
  (CURRENT_DATE - INTERVAL '3 days')::timestamp + INTERVAL '18 hours 30 minutes',
  '[]'
);
```

### C2. Trigger detection via status call
1. Load or refresh the Internal Assessment page (triggers `GET /api/ia/status`).
2. **Expected response** includes `missed_count: 1`.
3. Dashboard can optionally show a "You missed an IA" banner if `missed_count > 0`.

**DB verify:**
```sql
-- Session must now be MISSED
SELECT id, ia_date, status, carry_forward_subskills
FROM ia_sessions WHERE student_id = '<student_uuid>';

-- Momentum must have been decremented by 20
SELECT momentum_score FROM institute_students WHERE id = '<student_uuid>';
```

### C3. Confirm no double-penalty
1. Refresh the page again (second `GET /api/ia/status` call).
2. **Expected:** `missed_count: 0` — the session is already `MISSED` so it won't be found by the sweep again.
3. Momentum is NOT decremented a second time.

---

## Edge Cases

### E1. Double-submit guard
1. Complete an IA (status = `COMPLETED`).
2. Manually call `POST /api/ia/submit` with the same `session_id` again (via Postman or curl).
3. **Expected response:** `{ success: true, already_done: true }` — no duplicate writes.

```bash
curl -X POST http://localhost:4000/api/ia/submit \
  -H "Authorization: Bearer <jwt>" \
  -H "Content-Type: application/json" \
  -d '{"session_id": "<completed_session_uuid>"}'
```

### E2. Auto-submit on timer expiry
1. Start test.
2. In DevTools, override `timeLeft` state to `1` (or simply wait if practical).
3. **Expected:** Timer hits 0 → `handleSectionComplete` fires automatically → IA submits → results screen appears.

### E3. Already completed / missed session
1. On a day where a session is `COMPLETED` or `MISSED`, click Start Test.
2. **Expected (`GET /api/ia/questions`):** Returns `{ already_done: true }` → frontend re-fetches status and shows the gate/schedule screen (no questions rendered).

### E4. Wrong student trying to submit
1. Call `POST /api/ia/submit` with a valid `session_id` that belongs to a **different** student.
2. **Expected:** `403 Forbidden`.

---

## API Reference (for Postman / curl testing)

All endpoints require `Authorization: Bearer <supabase_jwt>`.

| Method | Endpoint | Body | Description |
|---|---|---|---|
| GET | `/api/ia/status` | — | Schedule, eligibility, DCS, miss detection |
| GET | `/api/ia/questions` | — | Load/resume session, get questions |
| POST | `/api/ia/answer` | `{ session_id, question_id, answer }` | Save one answer |
| POST | `/api/ia/submit` | `{ session_id }` | Score and complete session |

---

## Scoring Logic (for manual result verification)

```
band = Math.min( Math.round( (correct / total) * 9 * 2 ) / 2, 9.0 )

Examples:
  10/10 correct → band 9.0
   7/10 correct → (7/10)*9 = 6.3 → rounds to nearest 0.5 → 6.5
   5/10 correct → (5/10)*9 = 4.5 → rounds to nearest 0.5 → 4.5
   0/10 correct → band 0.0

Momentum:
  +100  always (participation)
  +50   per sub-skill if band > previous personal best (0 if first IA)
  +25   per sub-skill if band > last IA band (doesn't apply to first IA)

  First IA, both sub-skills score > 0:  +100 + 50 + 50 = 200
  Second IA, both improved:             +100 + 25 + 25 = 150
  Second IA, one improved + new PB:     +100 + 75 + 25 = 200
```

---

## Known Phase 2 Gaps (not blocking Phase 1 testing)

| Gap | Impact |
|---|---|
| WRITING_PROMPT / SPEAKING_PROMPT questions not auto-scored | `correct=0, total=0, band=0.0` — shows `—` in results. Phase 2 wires `analyzeWriting` / `analyzeSpeaking`. |
| LISTENING questions (audio) not seeded | Section falls back to cross-difficulty pool; may return empty if no audio questions exist. |
| `carry_forward_subskills` not yet used in next session creation | Sub-skills from a missed IA are stored but not yet fed back into `selectPrioritySubSkills`. |
