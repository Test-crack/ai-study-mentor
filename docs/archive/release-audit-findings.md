# Student Dashboard — Release Audit Findings

**Scope:** Full spec-vs-code review of the four student-facing feature areas (Diagnostic, Daily Loop, IA, Mock) against `student-lifecycle.md` and `student-cycle.md`.
**Method:** Four parallel deep-dive code reviews; every finding below was verified by reading the actual code, not inferred.
**Priority per user:** Evaluation & scoring correctness, primarily IA and Mock.

Legend: 🔴 CRITICAL (release blocker) · 🟠 HIGH · 🟡 MEDIUM · ⚪ LOW

---

## The Big Picture

Two systemic problems cut across every feature:

1. **The server trusts the client for scoring and gating.** Momentum, correct-answer counts, drill caps, the daily-sequence gate, and IA section timers are all enforced only in the UI. Anyone hitting the API directly bypasses them.
2. **AI-grading failure silently writes band ≈0 and permanently corrupts the student's real band** (both IA and Mock), because the grader returns `band: 1` on any error and the result is blended into the competency matrix — with no retry path and, for Mock, no ±2 cap.

Everything else is a variation or a consequence of these two.

---

## 🔴 CRITICAL — Must fix before release

### CR-1. IA W/S grade weighting is inverted
**File:** `backend/src/lib/iaProcessor.ts:181-185`
Code weights by *question count* → effectively `(2×MCQ + 1×AI)/3`. Spec says `(1×MCQ + 2×AI)/3`. **Every Writing/Speaking IA band since launch is wrong** — MCQ counts double what it should. Feeds directly into the competency matrix.
**Fix:** Weight the two aggregate grades, not question counts: `(mcqScore*1 + aiAvgScore*2)/3`.

### CR-2. AI-grading failure destroys bands (IA + Mock)
**Files:** `backend/src/lib/iaGrading.ts:247-256, 273-282`; consumed at `mockController.ts:680`, `iaProcessor.ts`
Any Gemini error (outage, quota, parse fail) returns `band: 1`. That fake score is blended 60/40 (Mock) / 40/60 (IA) into the matrix. **Mock has no ±2 cap**, so one AI outage can drop a band-7 student ~2.5 bands per sub-skill. Session completes, slot consumed, regrade impossible.
Spec: "AI down ⇒ retry prompt; nothing saved; no fallback score."
**Fix:** Distinguish *empty response* (band 1 legitimate) from *infra error* (throw). On throw, leave session IN_PROGRESS for retry.

### CR-3. IA late-submit marks answered IA as MISSED and loses the work
**File:** `backend/src/controllers/iaController.ts:697-704`
Submit after `window_closes_at` immediately flips to MISSED. The auto-grade path only handles IN_PROGRESS, so answers are permanently lost. A student clicking Submit at 00:00:30 IST loses the whole IA (and inconsistently gets no −20 either).
Spec 4.6: late submit → auto-grade the answers, COMPLETED, no penalty.
**Fix:** If real answers exist, call `processIASession` inline; else penalize via the detector's path.

### CR-4. Diagnostic L/R bands are forgeable (band 9.0 via one question)
**File:** `backend/src/controllers/diagnosticController.ts:209-232`
Denominator = number of answers the client sends, not the fixed 6/4. Submit one correct answer → `1/1 × 9 = 9.0`. Combined with CR-5 (resubmit allowed), a student brute-forces one question's 4 options to band 9.0.
**Fix:** Load the full question set server-side by `set_id`; count unanswered as wrong.

### CR-5. Diagnostic has no resubmit/retake guard
**File:** `backend/src/controllers/diagnosticController.ts:191-284, 288-359`
Neither submit handler checks `isDiagnosed` or whether the skill is already scored; the matrix upsert overwrites the prior band. Any diagnosed student can rewrite their baseline via API.
Spec: "can never be re-entered / never retaken."
**Fix:** Return 409 if the skill is already scored or `isDiagnosed` is true.

### CR-6. Diagnostic speaking stub reachable → fake band 6.0, no audio
**File:** `backend/src/controllers/diagnosticController.ts:269-272`, `routes/diagnosticRoutes.ts:15-18`
A stub branch assigns SPEAKING = 6.0. It's meant to be shadowed by the literal `/submit/speaking` route, but encoded paths (`%73peaking`, or `ſpeaking` U+017F) match `/submit/:skill` instead and hit the stub — saving a real 6.0 speaking band with no audio, counting toward `isDiagnosed`.
**Fix:** Delete the stub branch; return 400 for SPEAKING in the JSON handler.

### CR-7. Momentum is forgeable — `correct_answers` trusted & unbounded
**File:** `backend/src/controllers/drillController.ts:687-688, 247-248`
`momentum = 15 + correctCount*10` with no clamp; correct answers are even shipped to the client. `complete` with `correct_answers: 100000` → ~1M momentum. Also inflates DCS >100%, unlocking the extra-drill gate.
**Fix:** Grade server-side from stored `question_ids` + submitted answers; at minimum `Math.min(correctCount, totalQuestions)`.

### CR-8. Daily cap + LexiGrid gate not enforced server-side
**File:** `backend/src/controllers/drillController.ts:484-594, 658-758`
No check of today's drill count, LexiGrid state, or extra credits in start/complete. Reachable through the normal UI (`DrillScreen` never checks `next_action`; per-subskill drill buttons deep-link). Consequences: unlimited drills → unlimited momentum; Drill 2 before LexiGrid → dashboard unlock + streak +1 with no LexiGrid; 4th drill free by sending `is_extra_session:false`.
**Fix:** Recompute count + lexigrid state server-side; reject DRILL_2 before a LexiGrid record exists, reject beyond 3 unless a credit exists, consume credit with a guarded `updateMany`.

### CR-9. Two legacy endpoints are unlimited momentum faucets
**Files:** `backend/src/controllers/drillController.ts:411-434` (apply-complete, +30 no guard), `:276-287` (saveDrillSession creates STARTED, so the idempotency guard never matches → re-award every call). Both still routed; the shipping frontend calls apply-complete as a fallback.
**Fix:** Delete both legacy routes (or add idempotency guards + correct status).

---

## 🟠 HIGH

| ID | Area | File | Issue | Fix |
|---|---|---|---|---|
| H-1 | Diagnostic | `App.tsx:277-314` | Route guard covers only `/student/dashboard`; drills/IA/mock deep-linkable un-diagnosed; **no backend `isDiagnosed` check anywhere** | Wrap all `/student/*` learning routes; add server-side `isDiagnosed` gate |
| H-2 | Diagnostic | `Diagnosis.tsx:2030`, `useAuth.tsx:44-68` | **Happy-path blocker:** completing diagnostic doesn't `refreshProfile()`; stale cached `isDiagnosed:false` bounces student to onboarding → loop | Call `refreshProfile()` when `overallComplete` |
| H-3 | Diagnostic | `Diagnosis.tsx:164-175` | localStorage keys not namespaced per student; shared device leaks A's scores/essay/speaking result into B, B skips gate/recording | Prefix keys with student id; clear on sign-out |
| H-4 | Diagnostic | `ieltsWritingService.ts:32-36` | Writing anti-gaming caps (TA≤5 under-length, ≤2 off-topic) are prompt-only, not code-enforced; `taskType` always Task 1 | Enforce caps server-side from `min_words`; derive task type from question |
| H-5 | Diagnostic | `ieltsSpeakingService.ts:218-228` | `NODE_TLS_REJECT_UNAUTHORIZED='0'` disables cert validation process-wide during every speaking grade | Remove; use `NODE_EXTRA_CA_CERTS` if needed |
| H-6 | IA | `iaController.ts:755-808` | 20-min section timer not enforced server-side; `section_advance` client-controlled → resets timer for fresh 20 min indefinitely | Reject answers past `section_started_at + 20min`; monotonic section index only |
| H-7 | IA | `Assessment.tsx:484-504` | Final answer fired fire-and-forget then submit races it; last MCQ can grade as unanswered | `await` persist before submit, or send answers in submit body |
| H-8 | IA | `iaController.ts:141` vs `iaMissDetector.ts:181-186` | After first_drill+90d, no IA can start but −20 accrues every 3 days forever (lookahead 30 vs unbounded detector) | One shared schedule fn; cap detector = lookahead |
| H-9 | IA | `iaGrading.ts` + `iaMissDetector.ts:113-129` | Missing API key throws → detector converts answered IA to MISSED −20 (spec: no penalty) | Distinguish infra failure; never penalize answered IA |
| H-10 | IA | `iaProcessor.ts:219-251` | +25 "improved vs last IA" bonus structurally unreachable (14-day exclusion guarantees last IA never tested this subskill) | Compare vs most recent IA that tested that subskill |
| H-11 | Mock | `mockController.ts:94,107,417-451` | Session created with underfilled/empty sections → band 0 blended in, slot consumed, blank screen | Validate section counts before create; 503 without consuming slot |
| H-12 | Mock | `mockController.ts:496-511` | Lost-update race on `answers` JSON (read-modify-write, frontend fires unawaited) → saved answers dropped | Atomic JSONB merge / per-question table / transaction |
| H-13 | Mock | `FullMockAssessment.tsx:298-303, 860` | MCQ not persisted on selection; 3h-expiry path drops current selection; last-answer race vs submit | Persist MCQ on click; await saves before submit |
| H-14 | Daily | `gameScoreController.ts:276-319` etc. | Non-atomic check-then-award; concurrent retry double-awards drill/LexiGrid/reflection/apply momentum | Transaction + guarded `updateMany` (copy skip-branch pattern) |
| H-15 | Daily | `lexiGridSession.ts:53-58` | HMAC token has no date/nonce & trusts `bonus_eligible`/`total_attempts`; replay forever for 80 momentum/day | Embed IST date; bind attempts/bonus server-side |
| H-16 | Daily | `drillController.ts:690,710` | Extra-credit consumption non-atomic, no `WHERE credits>0` guard → credits go negative under concurrency | Guarded decrement |
| H-17 | Daily | `StudentDashboardPage.tsx:153-222` | **Hard-coded `MOCK_MISSED_STATE=1` ships** — fabricates missed assessment, fake −20/week in display, can lock dashboard | Remove the test scaffold; drive from real data |

---

## 🟡 MEDIUM (correctness/UX — fix soon after release)

| ID | Area | Issue |
|---|---|---|
| M-1 | Mock | L/R denominator is actual question count, not 20 (`mockController.ts:641`) — inflates band if section underfilled |
| M-2 | Mock | EARNED 1500 decrement reads balance outside tx → negative balance under concurrent spend |
| M-3 | Mock | Concurrent-start races 500 instead of 409; STANDARD+EARNED can both create simultaneously; `/questions` is a GET with side effects (deduct) |
| M-4 | Mock | No auto-submit when 3h expires with browser closed — 79/80 answered work discarded at 72h ABANDONED |
| M-5 | Mock | W/S band blends per-subskill then averages (per-item rounding) vs spec's per-skill 60/40; missing sub_score takes mock at 100% |
| M-6 | Mock | `firstOfNextMonth()` overflows at month-end (Jan 31 → March 1), uses browser TZ not IST (display only) |
| M-7 | IA | 6-drill prereq counts STARTED in status but DRILL_DONE at start → false "can start", silent 403 |
| M-8 | IA | Sentinel/empty answers (`'[no transcript]'`, `''`) count as "real" → abandoned empty IA becomes COMPLETED +100 instead of MISSED −20 (farmable) |
| M-9 | IA | Lost-update race on answers JSON (same as H-12, IA side) |
| M-10 | IA | Miss-penalty mark + decrement not atomic; crash leaves MISSED with no deduction (unrecoverable) |
| M-11 | IA | Retroactive MISSED ignores DCS prereq → −20 for IAs the system forbade starting |
| M-12 | Daily | Streak clobbered to 1 or skipped by completion race; `===2` + `[yesterday,today)` stricter than spec's "≥ yesterday" |
| M-13 | Daily | Cross-midnight IST drill bucketed by `created_at` not completion → lost from today's gate/streak/DCS |
| M-14 | Daily | LexiGrid perfect bonus allows 3 tries (spec: ≤2) and is client-trusted |
| M-15 | Daily | Momentum awarded for first LexiGrid even if standalone before Drill 1; pre-marks gate (ordering not enforced) |
| M-16 | Daily | Drill subskill selection sorts by band only — ignores the 0.6/0.4 weakness formula (IA path is correct) |
| M-17 | Daily | Client `addPoints(-150)` uses `Math.abs` → topbar *adds* 150 on skip until sync corrects |
| M-18 | Diagnostic | Rounding `Math.round(x*2)/2` rounds .75 up → 3/4 reading = 7.0, contradicts spec's own "6.5" example |
| M-19 | Diagnostic | Writing AI failure returns 500 not 502+`can_retry` |
| M-20 | Diagnostic | Mid-section refresh re-picks random `set_id` → different questions, wiped answers (latent if >1 set/level) |
| M-21 | Diagnostic | Partial completion on new device: scored bands invisible (only in localStorage), summary average wrong |
| M-22 | Diagnostic | `diagnostic_status` view reads matrix (also written by IA/mock) → could flip `isDiagnosed` without diagnostic if H-1 ungated |

---

## ⚪ LOW (polish / cleanup — batch later)

- **Dead/stray code:** unrouted `Internalassessmentpage.tsx` (1177 lines, contradicts 3-day schedule); committed temp file `iaMissDetector.ts.tmp.*` (older, no TOCTOU guards); unused `TodaysPracticeGate.tsx`; dead `diagnosticQuestions.ts` data; wrong route comments (150 vs 300); `extraCost ?? 75` fallback.
- **Response-shape bugs:** IA/Mock `already_done` responses miss `momentum_breakdown`/`skill_scores` → blank results screen if the dedup response lands last; Decimal `real_band_score` serializes as string → `toFixed` throws.
- **Validation gaps:** `saveMockAnswer`/`saveIAAnswer` accept arbitrary `question_id` and `NaN` `section_advance` → JSON bloat / blank resume screen; unguarded `JSON.parse(answers)`; no multer file-size limit on speaking upload.
- **UX:** Firefox speaking is silent no-op but `"[no transcript]"` passes gate; +200 momentum for empty mock submission; reading 5-min timer advisory only; audio "play once" is client-state only; IA gate copy says "four sections back-to-back" (it's 2×20min); IA delta labeled "vs Last IA" but computed vs smoothed matrix.
- **Race polish:** skip double-tap returns 500 not `already_done` (P2002 unmapped); concurrent first-open IA/Mock loser 500s on unique constraint; LexiGrid replay overwrites gate record stats.

---

## What's Verified CORRECT (no action)

- IA smoothing (0.4/0.6, ±2 cap before rounding, clamp 0-9, null→adopt) — matches spec exactly.
- IST handling across controllers (timezone.ts, DATE vs TIMESTAMPTZ) — consistent, no DST bug.
- Skip-gate transaction, extra-drill *purchase* (`authorizeExtraDrill`), Mock EARNED deduct+create atomicity — the best-implemented paths; copy their guarded-`updateMany` pattern for the fixes.
- `next_action` decision tree — matches spec chain exactly.
- Speaking hard-caps genuinely applied post-AI in diagnostic; <5KB pre-flight; AI failure saves nothing (diagnostic path).
- Sequential resubmit (non-concurrent) awards zero extra momentum everywhere.
- Submit/miss-detector idempotency via status-guarded `updateMany` — solid (modulo atomicity notes).

---

## Recommended Fix Order for This Week

**Wave 1 — scoring integrity (do first, these corrupt data permanently):**
CR-1 (inverted IA weight), CR-2 (AI-fail band destruction, IA+Mock), CR-4 (forgeable L/R), CR-5 (resubmit guard), CR-6 (speaking stub).

**Wave 2 — momentum/gate integrity (exploitable faucets):**
CR-7 (clamp/grade server-side), CR-8 (server-side gate+cap), CR-9 (kill legacy endpoints), H-17 (remove `MOCK_MISSED_STATE`).

**Wave 3 — happy-path & data-loss:**
H-2 (onboarding bounce loop — every user hits this), CR-3 (IA late-submit), H-7/H-13 (last-answer race), H-11 (empty mock sections), H-1 (backend isDiagnosed gate).

**Wave 4:** remaining HIGH, then MEDIUM.

LOW items are a cleanup batch, not release-blocking.
