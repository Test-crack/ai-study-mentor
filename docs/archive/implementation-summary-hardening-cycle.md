# Implementation Summary — Student Platform Hardening Cycle

**Audience:** Engineering + QA team
**Scope:** Everything completed in this remediation cycle across the frontend (`ai-study-mentor`) and backend (`backend-study-mentor`) repos.
**Status:** All CRITICAL, HIGH, and MEDIUM audit findings resolved and pushed. LOW/cleanup batch and live production verification pending.

---

## 1. How This Cycle Ran

The work happened in distinct waves, each committed and pushed separately:

1. **Platform bug fixes** — auth logout, institute-admin routing, onboarding atomicity, batch integrity, diagnostic-tab regression.
2. **Spec-vs-code audit** — a full review of all four student features (Diagnostic, Daily Loop, IA, Mock) against the two behaviour specs (`student-lifecycle.md`, `student-cycle.md`). Findings catalogued in `release-audit-findings.md` and fixed in three waves: CRITICAL → HIGH → MEDIUM.

Branches: backend `feature/audit`, frontend `bug/batches`. Both type-check clean after every wave.

---

## 2. Platform Bug Fixes (pre-audit)

### 2.1 Auth auto-logout (the #1 reported bug)
**Problem:** The auth middleware called `supabaseAdmin.auth.getUser(token)` — an outbound HTTP call to Supabase — on **every request**. Any network blip returned 401, which the frontend interpreted as "session invalid" and force-logged-out the user mid-drill.

**Fix:** Replaced remote validation with **local JWT verification** (`jwt.verify(token, SUPABASE_JWT_SECRET)`). Auth is now a pure in-process check — no network dependency.
- Expired tokens → `401 "Session expired. Please login again."`
- Malformed tokens → `401 "Invalid token."`
- Requires `SUPABASE_JWT_SECRET` env var (Supabase → Settings → JWT Keys → Legacy JWT Secret).

**Files:** `backend/src/middleware/auth.ts`, `.env.example`.

### 2.2 Institute-admin routes were dead code
**Problem:** `instituteAdminRoutes.ts` imported only from the read-only owner controller. Every write operation (student onboarding, tutor onboarding, batch CRUD, batch member assignment — 15 routes) returned 404. The dashboard's "Add Student", "Add Tutor", batch management were all broken.

**Fix:** Wired all 15 missing routes to `instituteAdminController` + `batchController`. The `GET /api/institute-admin/tutors` 404 in the console (the original symptom) is resolved.

**Files:** `backend/src/routes/instituteAdminRoutes.ts`.

### 2.3 Onboarding atomicity + duplicate handling
**Problem:** `addStudent`/`addTutor` created the User row and the enrollment row as separate writes with no transaction; a failure after the Supabase invite left orphaned/partial state. Concurrent double-submit returned a raw 500.

**Fix:** Wrapped User + enrollment creation in `prisma.$transaction`; `P2002` (unique violation) now returns a clean 409 with a friendly message. Single-institute constraint (`@@unique([user_id])`) confirmed correct.

**Files:** `backend/src/controllers/instituteAdminController.ts`.

### 2.4 Batch cross-institute integrity
**Verified (no bug):** All 9 batch operations correctly scope the batch to the caller's institute AND verify the member belongs to the same institute. A cross-institute assignment is impossible via the API — the one observed in dev was a manual DB insert. Noted: enforcement is application-layer only (no DB check constraint).

### 2.5 Diagnostic tab regression
**Problem:** During a refactor that extracted `computeStudentFullProgress` into a shared lib, the diagnostic-history query and the `diagnostic_baseline`/`diagnostic_results` output fields were dropped — so the Diagnostics tab showed "No diagnostic results yet" on both instructor and institute-owner dashboards.

**Fix:** Restored the `assessmentHistory` DIAGNOSTIC query and both output fields in `studentProgressQueries.ts`.

---

## 3. Audit Remediation — CRITICAL (9)

These were data-corruption or exploit-class bugs.

| ID | Area | Fix |
|---|---|---|
| CR-1 | IA scoring | W/S grade weighting was **inverted** (MCQ counted 2×, AI 1×). Now correctly `(MCQ×1 + AI×2)/3`. Every W/S IA band since launch had been computed wrong. |
| CR-2 | IA + Mock | AI-grading failure returned a fabricated `band: 1` that got blended into the real band (uncapped on the mock path). Now throws `AIGradingError`; the session stays recoverable, nothing is written. |
| CR-3 | IA | A late submit was marked MISSED, **discarding answered work**. Now auto-grades saved answers (COMPLETED, no penalty); only genuinely empty attempts are MISSED. |
| CR-4 | Diagnostic | L/R graded against the client-submitted subset — one correct answer = band 9.0. Now grades against the **full DB question set** (unanswered = wrong). |
| CR-5 | Diagnostic | No resubmit/retake guard — a diagnosed student could rewrite their baseline. Now returns 409 if the skill is already scored. |
| CR-6 | Diagnostic | A reachable speaking **stub** assigned a fake band 6.0 with no audio (via encoded URL paths). Stub removed; JSON endpoint rejects SPEAKING. |
| CR-7 | Drills | `correct_answers` was trusted from the client and unbounded → forgeable momentum, DCS > 100%. Now **graded server-side** from stored answers. |
| CR-8 | Drills | Daily cap (3 free + 1 paid) and the LexiGrid gate were **UI-only**. Now enforced server-side in `completeDrillSession`. |
| CR-9 | Drills | Two legacy endpoints (`/drills/session`, `/drills/apply-complete`) awarded momentum with no idempotency — unlimited faucets. Routes removed; frontend fallback rewired. |

---

## 4. Audit Remediation — HIGH (17)

| ID | Area | Fix |
|---|---|---|
| H-1 | Access control | Un-diagnosed students could deep-link into drills/IA/mock. Added `requireDiagnosed` backend middleware + wrapped the frontend routes in `StudentDiagnosisGuard`. |
| H-2 | Onboarding | **Happy-path blocker:** finishing the diagnostic didn't refresh the cached profile, bouncing every student back into onboarding in a loop. Now force-refreshes profile before navigating. |
| H-3 | Diagnostic | localStorage keys weren't namespaced — on a shared device, Student B saw Student A's answers/scores. Now namespaced per student id. |
| H-4 | Diagnostic | Writing anti-gaming caps were prompt-only. Under-length cap + correct Task-1/2 threshold now enforced server-side. |
| H-5 | Security | Speaking service disabled TLS validation process-wide (`NODE_TLS_REJECT_UNAUTHORIZED='0'`) during every grade. Removed. |
| H-6 | IA | 20-min section timer wasn't enforced server-side; `section_advance` could reset it indefinitely. Now enforced + monotonic. |
| H-7 | IA | Final answer fired fire-and-forget then submit raced it → last question graded as unanswered. Now awaits persistence before submit. |
| H-8 | IA | 90-day schedule ceiling made IAs un-startable past day 90 while the miss-detector kept penalizing. Schedule now computed dynamically. |
| H-9 | IA | An AI-infra failure during the miss-detector's auto-grade converted an answered IA into MISSED −20. Now leaves it recoverable, never penalizes. |
| H-10 | IA | The "+25 improved vs last IA" bonus was structurally unreachable (14-day exclusion). Now compares against the last IA that actually tested each sub-skill. |
| H-11 | Mock | Sessions could be created with empty/underfilled sections (band 0 blended in, slot consumed, blank screen). Now validates all sections before create; 503 without consuming the slot. |
| H-12 | Mock | Lost-update race on the answers JSON dropped saved answers. Now an atomic single-key JSONB merge. |
| H-13 | Mock | MCQ answers weren't persisted on selection; final answer raced submit. Fixed (await persist before submit). |
| H-14 | Daily loop | Non-atomic check-then-award double-awarded momentum on concurrent retries (drill/LexiGrid/reflection/apply). All made atomic via guarded transitions. |
| H-15 | LexiGrid | Session token had no date binding — a token could be replayed forever. Now date-bound + a server-side bonus plausibility clamp. |
| H-16 | Daily loop | Extra-drill credit consumption was non-atomic and could go negative. Now a guarded decrement. |
| H-17 | Dashboard | A hard-coded `MOCK_MISSED_STATE = 1` test scaffold shipped — fake "behind schedule" banner, fake −20/week penalty, could lock the dashboard for every student. Removed. |

---

## 5. Audit Remediation — MEDIUM (22)

Fixed directly: M-3 (mock concurrent-start → 409), M-4 (mock auto-grades saved answers on expiry via extracted `processMockSession`), M-6 (month-end date overflow), M-7 (IA prereq counts completed drills only), M-9 (IA answers atomic JSONB merge), M-10 (miss-penalty mark+deduct atomic), M-11 (retroactive MISSED gated on DCS eligibility), M-12 (streak increment guarded against races), M-14 (LexiGrid bonus disqualified by a 3rd-try solve), M-16 (drill selection uses the documented weakness formula), M-17 (momentum skip deduction sign bug), M-20 (diagnostic re-serves the same question set on refresh).

Resolved incidentally during CRITICAL/HIGH: M-1, M-2, M-8, M-19, M-21, M-22.

Doc-resolution (code was already correct / design decision): M-5 (per-sub-skill mock blend documented), M-15 (spec-consistent), M-18 (doc example corrected).

**Deliberately deferred:** M-13 (cross-midnight drill bucketing) — a correct fix touches four day-counting query sites in lockstep; a partial change would desync the dashboard from the gate logic. Low-frequency edge case (a drill spanning IST midnight), scheduled for post-demo.

---

## 6. Architectural Changes Worth Noting

- **`processMockSession(session, student)`** — the mock grading + matrix update + momentum award + COMPLETED transition is now a single reusable function. Both `submitMock` and the abandoned-session auto-grade sweep call it (no duplicated scoring logic).
- **`applyMissPenalty(studentId, mark)`** — miss-penalty marking and momentum deduction now commit atomically per session (no orphaned penalties on crash).
- **`requireDiagnosed` middleware** — a single, testable server-side gate for all gameplay endpoints, replacing the previous "frontend guard only" posture.
- **`AIGradingError`** — a distinct error class so infra failures (outage, quota, parse error) are handled separately from a legitimately low/empty answer everywhere grading is consumed.
- **Atomicity pattern** — the "guarded `updateMany` / insert-wins claim" pattern (from the pre-existing skip-gate and extra-drill purchase code) is now applied consistently across every momentum award and status transition.

---

## 7. Momentum Economy (as implemented)

| Action | Momentum |
|---|---|
| Complete a drill | +15 base, +10 per correct answer (max +65) |
| Drill reflection | +25 |
| Apply-stage completion | +30 |
| LexiGrid (first session of the day only) | +15/word, +5 perfect bonus (all 5 in ≤2 tries) — max +80 |
| Complete an IA | +100 base, +25 per improved sub-skill, +50 per personal best |
| Complete a mock | +200; +500 if the real band crosses a 0.5 threshold |
| Skip LexiGrid gate | −150 |
| Buy extra (4th) drill | −300 (requires ≥40% daily accuracy) |
| Buy extra mock | −1500 |
| Miss an IA | −20 per missed IA |

All deductions are floored at 0 and applied via guarded writes.

---

## 8. Known Limitations / Follow-ups

- **M-13** cross-midnight drill bucketing — deferred (see §5).
- **DB-level integrity** — batch/institute scoping is enforced in the application layer only; no DB check constraints or triggers. Fine while direct DB write access is restricted, but worth adding before exposing any DB admin tooling.
- **AI grading is Gemini-dependent** — an outage now degrades gracefully (retry prompt, session preserved) instead of corrupting bands, but grading itself is unavailable during an outage.
- **Firefox speaking** — Web Speech API is Chrome/Edge only; on Firefox the recording UI shows but produces no transcript (LOW-priority item).
- **LOW/cleanup batch (~20 items)** — dead code (unrouted `Internalassessmentpage.tsx`, a committed `.tmp` file), `already_done` response-shape gaps, validation polish, wrong route comments. Not release-blocking; scheduled next.
- **Live production verification** — the deep scoring paths (submit IA, grade mock, complete drill) have been verified at the code/type level and partially at the API surface (auth + gating confirmed live), but not yet driven end-to-end against real question data with a real student session. Planned as the final pre-release step.

---

## 9. Deploy Checklist

- [ ] `SUPABASE_JWT_SECRET` present in the VPS `.env` (required by the new auth middleware)
- [ ] `jsonwebtoken` dependency installed (`npm install` on deploy)
- [ ] Prisma client regenerated / backend restarted (picks up the `skipped` column + all controller changes)
- [ ] `requireDiagnosed` middleware live (restart)
- [ ] Merge `feature/audit` (backend) and `bug/batches` (frontend) after review
- [ ] Smoke-test: login → diagnostic → dashboard unlock → drill → LexiGrid → IA → mock

---

*Full finding-by-finding detail, including severity and file:line, is in `release-audit-findings.md`. Behaviour specs are in `student-lifecycle.md` and `student-cycle.md`.*
