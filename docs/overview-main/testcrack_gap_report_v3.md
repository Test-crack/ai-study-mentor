# TestCrack — Gap Report vs Flow v3

**Date:** 2 May 2026 | **Branch:** `main` | **Reference:** `docs/testcrack_flow_v3.html`

---

## What Is Done ✅

| Feature | Frontend | Backend |
|---|---|---|
| Diagnostic (first-time test) | ✅ `Diagnosis.tsx` | ✅ `diagnosticController.ts` |
| Dashboard + Skill Bands | ✅ `StudentDashboardPage.tsx` | ✅ `studentController.ts` |
| Drill 1–3 (session runner, types) | ✅ `Drills/*` | ✅ `drillController.ts` |
| LexiGrid Gate (5-word unlock) | ✅ `LexiGrid.tsx` | ✅ `lexiGridController.ts` |
| Momentum (earn/spend/streak) | ✅ `MomentumContext.tsx` | ✅ `gameScoreController.ts` |
| Streak (≥ 2 drills/day rule) | ✅ (via momentum context) | ✅ `streak.ts` |
| DCS calculation | — | ✅ `dcs.ts` |
| Extra (4th) drill via 75 pts | ✅ (UI button) | ✅ `authorize-extra` endpoint |
| Band scores / Competency Matrix | ✅ `Report.tsx` | ✅ `studentController.ts` |
| Reports page | ✅ | — |
| Sidebar navigation (all roles) | ✅ `StudentSidebar.tsx` | — |

---

## What Is Partially Done ⚠️

### 1. Internal Assessment — UI shell exists, backend is missing

- **Frontend:** `/student/internal` → `Assessment.tsx` exists. It renders an IELTS-style assessment with 4 skills, timing, and scoring. However, it appears to be wired to the diagnostic-style flow, not the periodic IA cycle defined in v3.
- **Backend:** Zero IA-specific controllers, routes, or database tables. A comment in `dcs.ts` says _"IA eligibility check (future) → must be ≥ 40% average"_ — confirming this was deferred.
- **Gap:** The eligibility gate, 24-hour wait window, window expiry, scoring pipeline, carry-forward logic, and Momentum rewards are all missing end-to-end.

### 2. Mock Test — UI shell exists, gate logic missing

- **Frontend:** `/student/mock` → `FullMockAssessment.tsx` exists with 4-section IELTS simulation, phase management, and result display.
- **Backend:** No mock test controller, no eligibility gate, no band recalculation formula (`Mock × 0.60 + Last IA × 0.40`), no monthly cap enforcement.
- **Gap:** The screen works in isolation but cannot be reached through the correct flow — any student can access it directly without completing 6 IAs or showing 0.5 band improvement.

### 3. Sidebar Unlock — client-side only, not persisted

- **Frontend:** Sidebar states are managed locally but there is no backend endpoint confirming whether "Drill 2 was ever accessed" for a given student. On app reload or new device, the locked state may not restore correctly.
- **Gap:** No `drill_2_accessed_at` or `sidebar_unlocked` field tracked server-side.


---

## What Is Fully Missing ❌

### Internal Assessment System (complete build)

| Sub-feature | Status |
|---|---|
| Eligibility check (6 drills + 2 days + DCS ≥ 40%) | ❌ |
| 24-hour consolidation wait after eligibility notification | ❌ |
| 24-hour response window with expiry | ❌ |
| 10-question session per sub-skill, 20-min visible timer | ❌ |
| Mid-test exit → state save per question, resume within window | ❌ |
| Path A: Completion → score update, DCS recalc, +100/+25/+50 Momentum | ❌ |
| Path C: Missed → −20 Momentum, "Not Completed" flag, carry-forward | ❌ |
| Second consecutive miss → tutor Level 2 alert | ❌ |
| Min 2–3 day gap enforced between IA windows | ❌ |

### Mock Test Gate & Scoring System

| Sub-feature | Status |
|---|---|
| 6 IAs completed gate (min 1 per skill) | ❌ |
| ≥ 0.5 band improvement requirement check | ❌ |
| Real Band formula: `Mock × 0.60 + Last IA × 0.40` | ❌ |
| Standard: 1 mock per calendar month (enforced server-side) | ❌ |
| Momentum unlock: 1500 pts + min 4 IAs + 14 days on platform | ❌ |
| Hard cap: max 2 mocks/month (server enforced) | ❌ |
| Mock result comparison card (diagnostic baseline vs today) | ❌ |



---

## Execution Plan

### Phase 1 — Internal Assessment Backend (Day 1 - 3)

**Priority: Blocker for the entire v3 cycle**

1. **Database schema** — Add `InternalAssessment` table: `studentId`, `subSkills[]`, `windowOpensAt`, `windowClosesAt`, `startedAt`, `submittedAt`, `status` (PENDING / IN_PROGRESS / COMPLETED / MISSED), `answers` (JSONB per question), `scores` (JSONB), `momentumAwarded`, `missedSubSkills[]` (carry-forward).

2. **Eligibility endpoint** `GET /api/ia/eligibility` — Checks: total drill sessions ≥ 6, `created_at` of first drill ≥ 2 calendar days ago, average DCS ≥ 40%. Returns eligibility status + reason if blocked. Awards +50 Momentum on first eligible call.

3. **Window management endpoints:**
   - `POST /api/ia/notify` — Sets `windowOpensAt = now + 24hr`. Called server-side after eligibility confirmed.
   - `POST /api/ia/start` — Validates window is open, creates session, returns questions (10 per sub-skill), starts 20-min countdown.
   - `POST /api/ia/answer` — Saves one answered question (state-per-question persistence for exit/resume).
   - `POST /api/ia/submit` — Finalises session, runs scoring, updates competency matrix, awards Momentum.

4. **Miss detection cron/job** — Background check: if window closes and session was never started or not submitted, mark MISSED, apply −20 Momentum, set carry-forward list.

5. **Gap enforcement** — After completion, set `nextIaEligibleAfter = now + 2 days`. Eligibility endpoint respects this.

---

### Phase 2 — Internal Assessment Frontend Wiring (Day 3 - 4)

1. **Eligibility gate screen** in `Assessment.tsx` — Call `/api/ia/eligibility` on mount. If not eligible, show progress card (drills done / 6, days elapsed / 2, DCS / 40%). If eligible but in 24hr wait, show countdown. If window open, show "Start IA" CTA.

2. **Timer bar** — Visible 20-minute countdown per skill section. Cannot pause. Auto-submits on expiry.

3. **Mid-test exit handling** — On unmount or browser close, question state is already saved per answer. On re-entry within window, resume from last answered question with remaining time.

4. **Result screen** — Show per-sub-skill scores, band delta vs last IA, Momentum earned. Trigger "new drill cycle" with updated priorities.

5. **Carry-forward banner** — If student has missed sub-skills from a prior IA, show them as pre-added to the upcoming IA session.

---

### Phase 3 — Mock Test Gate (Day 5 - 7)

1. **Backend eligibility endpoint** `GET /api/mock/eligibility` — Checks: IAs completed across all 4 skills ≥ 6, Real Band improved ≥ 0.5 on at least 1 skill vs diagnostic. Returns `eligible: true/false`, reason if blocked.

2. **Monthly cap enforcement** — Track `mock_sessions` table with `takenAt`. Endpoint rejects if standard monthly slot used. Momentum path: additional check for 1500 pts balance, ≥ 4 IAs, ≥ 14 days on platform, max 2 total this month.

3. **Band formula endpoint** `POST /api/mock/submit` — After mock scoring runs: `Real Band = (mockBand × 0.60) + (lastIaBand × 0.40)`, rounded to nearest 0.5. Updates `StudentCompetencyMatrix`.

4. **Frontend gate** in `FullMockAssessment.tsx` — Call `/api/mock/eligibility` on mount. Show lock screen with progress if not eligible: _"Complete 6 Internal Assessments and show measurable improvement."_ Show Momentum-unlock path as secondary CTA once 4 IAs are done.

5. **Result comparison card** — Diagnostic band vs today's band, per skill + overall. One priority action per skill. Next mock date shown.

---



## Summary for Stakeholders

| Phase | What | Duration | Blocker? |
|---|---|---|---|
| 1 | IA backend (DB schema + all endpoints) | 1–2 weeks | Yes — gates Phase 2, 3, 4 |
| 2 | IA frontend wiring + timer + result | 1 week | Depends on Phase 1 |
| 3 | Mock Test gate + band formula + result card | 1 week | Depends on Phase 1 (needs IA count) |


**Total estimated: 1-2 weeks to full v3 completion.**

The frontend shells for both IA (`Assessment.tsx`) and Mock Test (`FullMockAssessment.tsx`) exist. The critical gap is entirely in the **backend IA pipeline** — once that is built, frontend wiring and Mock gate work can proceed in parallel.
