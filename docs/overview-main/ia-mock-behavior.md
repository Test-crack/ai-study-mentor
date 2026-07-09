# IA & Mock Test — Behaviour Reference (Every Scenario)

**Audience:** QA / Testing team.
**Purpose:** For the Internal Assessment (IA) and the Mock Test, this document states exactly what the system does and what the resulting state is for every user scenario — correct answers, wrong answers, partial attempts, no attempt, no submit, exit midway, expiry, auto-submit, and network issues. All behaviour here reflects the implemented system after the hardening cycle.

> **How to read the "resulting state" columns**
> - **Session status** — the DB status of the assessment session (`PENDING`, `IN_PROGRESS`, `COMPLETED`, `MISSED`, `ABANDONED`).
> - **Band change** — whether the student's stored band scores (competency matrix) are updated.
> - **Momentum** — points awarded or deducted.
> - **Slot / attempt** — whether the attempt is consumed (mock monthly slot; IA schedule slot).

---

## Part A — Shared Grading Mechanics (read first)

### A.1 How a single section/skill is scored

**Listening & Reading (pure MCQ):**
```
band = (correct ÷ total_questions) × 9, rounded to nearest 0.5, clamped 0–9
```
Unanswered questions count as wrong (the denominator is the full question set, never the subset the student answered).

**Writing & Speaking (MCQ + AI prompt):**
Each sub-skill is scored on a 1–10 internal scale, then converted to the 0–9 band:
```
mcqScore  = 1 + (correct ÷ mcqCount) × 9        (1–10; null if no MCQs)
aiScore   = AI grade of the prompt              (1–10; null if no prompt)
combined  = (mcqScore × 1 + aiScore × 2) ÷ 3    (AI weighted 2×, MCQ 1×)
band      = (combined − 1) × 0.5, rounded to 0.5, clamped 0–9
```
If both are missing, `combined = 1` → band 0.

### A.2 How a band gets updated (never overwritten)

Both IA and Mock blend the new result with the existing stored band — a single session can never swing a band wildly:

- **IA:** `new = 0.4 × old + 0.6 × result`, then **capped at ±2 bands of movement**, rounded to 0.5, clamped 0–9. A brand-new sub-skill with no prior score adopts the result directly.
- **Mock:** `new = 0.6 × result + 0.4 × old`, rounded to 0.5, clamped 0–9. For W/S this blend is applied **per sub-skill**, then the skill band = average of the four updated sub-skills. (No ±2 cap on the mock path.)

### A.3 What counts as a "real answer"

Throughout, an answer is only "real" if it is non-empty and not the `[no transcript]` sentinel (which the client writes when speech recognition produced nothing). This matters for the "opened but didn't attempt" vs "attempted" distinction below.

### A.4 AI grading failure (applies to any W/S grading)

If the AI grader (Gemini) is unavailable — outage, quota, network, unparseable response — the system **throws** rather than inventing a score:
- The session is **left un-graded and recoverable** (status unchanged, nothing written to bands or momentum).
- The student sees a retry prompt (`502 can_retry`) on manual submit, or the auto-grade sweep simply retries on the next status check.
- **No fabricated band, no penalty, no slot consumed.** This is the single most important safety property of the grading path.

---

## Part B — Internal Assessment (IA)

**Structure:** 2 sections (2 sub-skills), 20 minutes each. L/R sections = 10 MCQ; W/S sections = 8 MCQ + 2 prompts.
**Availability:** every 3 days from the first drill; open for one IST calendar day. Prerequisites: ≥6 completed drills, ≥2 days since first drill, avg DCS ≥40%.
**Momentum on completion:** +100 base, +25 per sub-skill improved vs. the last IA that tested it, +50 per sub-skill personal best.
**Miss penalty:** −20 momentum (floored at 0).

### B.1 Answering scenarios (student completes and submits)

| # | Scenario | Grading | Band change | Momentum | Session status |
|---|---|---|---|---|---|
| 1 | **All answers correct** | Each section scores near band 9 | Both sub-skills move up (0.4·old + 0.6·new, capped +2) | +100, +25/improved, +50/personal-best (up to +250) | COMPLETED |
| 2 | **Some correct, some wrong** | Proportional per section | Move toward the blended result | +100, plus improvement/PB bonuses where earned | COMPLETED |
| 3 | **All answers wrong** | MCQ contributes 0-correct → floor; AI grades the prompt on its merits | Bands blend downward, but **cannot drop more than 2 bands** in one IA | +100 participation (improvement/PB bonuses won't fire) | COMPLETED |
| 4 | **Blank submit** (opened all questions, entered nothing, then hit Submit) | Every section scores at the floor (MCQ 0, no AI text → band ~0) | Bands blend down (±2 cap) | +100 participation only | COMPLETED |

> **Note on #3/#4:** a completed-but-poor IA still counts as *completed* (no miss penalty) and still awards the +100 participation. The ±2 cap prevents a single bad IA from tanking a band.

### B.2 Not-submitting / abandoning scenarios

| # | Scenario | System behaviour | Band change | Momentum | Session status |
|---|---|---|---|---|---|
| 5 | **Opens IA, never begins** (session created, no answers, window passes) | Detected on next IA-status load → MISSED | none | **−20** | MISSED |
| 6 | **Doesn't even open the IA** (no session created, scheduled day passes) | A MISSED row is created **retroactively** on next status load — *only if* the student was eligible (≥6 drills AND avg DCS ≥40%; sub-40% students are not penalized) | none | **−20** (if eligible) | MISSED (retroactive) |
| 7 | **Answers some, never submits, window passes** | On next status load the saved answers are **auto-graded** → COMPLETED | Bands update from what was answered | **+100** (+ bonuses); **no −20** | COMPLETED |
| 8 | **Opens + answers nothing, window passes** | Auto-grade sees no real answers → treated as a miss | none | **−20** | MISSED |
| 9 | **Exits midway (browser closed), returns same day within window** | Session is IN_PROGRESS; resumes with prior answers intact; the section timer continues from real elapsed time (not reset) | pending until submit/expiry | pending | IN_PROGRESS → resolves on submit/expiry |
| 10 | **Late submit** (clicks Submit just after the day boundary) | If real answers exist → auto-graded as COMPLETED (no penalty); if empty → MISSED −20 | per #7 / #8 | per #7 / #8 | COMPLETED or MISSED |

### B.3 Timing scenarios

| # | Scenario | System behaviour |
|---|---|---|
| 11 | **20-min section timer expires** | The client advances/submits automatically. Server-side, answers saved into an expired section are rejected (the section timer is enforced on the API, not just the UI). |
| 12 | **Starts IA with <40 min left in the day** | Blocked — the IA won't start ("not enough time to finish"), preventing an 11:58 PM start. |
| 13 | **Tries to game the section timer** (re-send `section_advance` to reset the clock) | Rejected — `section_advance` must be strictly forward (monotonic); it can't re-arm an earlier section's 20-minute window. |

### B.4 Concurrency / integrity scenarios

| # | Scenario | System behaviour |
|---|---|---|
| 14 | **Submits twice / double-clicks Submit** | The status-guarded transaction grades exactly once; the second call returns the stored result (`already_done`). No double band update, no double momentum. |
| 15 | **Submit races the miss-detector** | Same guard: whichever commits first wins; the other returns the stored result. Never double-processed. |
| 16 | **Answers save concurrently** (fast typing + navigation) | Each answer is an atomic single-key JSONB merge — concurrent saves don't clobber each other. |
| 17 | **AI grader down at submit** | Session left IN_PROGRESS, retry prompt shown; no band/momentum change (see A.4). Re-submitting once the grader recovers grades normally. |
| 18 | **Misses several IAs while away** | All missed slots are recorded on return (bounded by the DCS-eligibility gate), each −20, momentum floored at 0. Each miss is counted and penalized exactly once (idempotent). |

---

## Part C — Mock Test

**Structure:** all 4 skills, 80 questions (L 20 MCQ, R 20 MCQ, W 16 MCQ + 4 prompts, S 16 MCQ + 4 prompts).
**Timing:** 3-hour test timer (client-side pacing) inside a **72-hour submission window** (the hard server deadline).
**Slots:** 1 free (STANDARD) per calendar month + 1 purchasable (EARNED, 1500 momentum). Enforced by a unique `(student, month, attempt_type)` constraint.
**Momentum on completion:** +200 base; +500 bonus if the real band score crosses a 0.5 threshold vs. before.
**No miss penalty** — an unused/abandoned mock costs only the monthly slot.

### C.1 Answering scenarios (student completes and submits)

| # | Scenario | Grading | Band change / Real band | Momentum | Session status |
|---|---|---|---|---|---|
| 1 | **All answers correct** | Each skill scores near band 9 | All 4 skill bands rise (60/40 blend); real band = avg, rounded 0.5 | +200; +500 if real band crosses a 0.5 threshold | COMPLETED |
| 2 | **Some correct, some wrong** | Proportional per skill/sub-skill | Bands blend toward results; real band recomputed | +200 (+500 if threshold crossed) | COMPLETED |
| 3 | **All answers wrong** | MCQ 0-correct; AI grades prompts on merit | Bands blend downward (no ±2 cap on mock, but still 60/40 weighted so one mock can't zero a band) | +200 participation (threshold bonus won't fire) | COMPLETED |
| 4 | **Blank submit** | All skills score at floor | Bands blend down | +200 participation | COMPLETED |

### C.2 Not-submitting / abandoning scenarios

| # | Scenario | System behaviour | Band change | Momentum | Session status |
|---|---|---|---|---|---|
| 5 | **Opens mock, never begins** (no answers, 72h passes) | Expiry sweep on next mock-status load → no real answers → ABANDONED | none | none | ABANDONED |
| 6 | **Never opens the mock** | No session exists; nothing happens; the monthly slot remains available until used or the month rolls over | none | none | — (no session) |
| 7 | **Answers some, never submits, 72h passes** | Expiry sweep **auto-grades** the saved answers via the same path as a manual submit → COMPLETED | Bands update from what was answered | **+200** (+500 if threshold crossed) | COMPLETED |
| 8 | **Exits midway, returns within 72h** | Session IN_PROGRESS; resumes with all prior answers (they persist continuously); the 3-hour timer keeps counting globally | pending until submit/expiry | pending | IN_PROGRESS |
| 9 | **Late submit within 72h** (past the 3-hour timer, before the window closes) | Accepted and graded — the 3-hour timer is client-side pacing; the server's only hard gate is the 72-hour window | normal | normal | COMPLETED |
| 10 | **Submit after 72h window closed** | Rejected; the expiry sweep resolves the session (auto-grade if it has answers, else ABANDONED) | per #7 / #5 | per #7 / #5 | COMPLETED or ABANDONED |

> **Slot consumption:** in every C.2 case where a session was created (5, 7, 8, 10), the monthly slot for that attempt type is consumed — whether it ends COMPLETED or ABANDONED. Only "never opens" (#6) leaves the slot free.

### C.3 Timing scenarios

| # | Scenario | System behaviour |
|---|---|---|
| 11 | **3-hour test timer expires (tab open)** | The client stops accepting new answers and moves toward submission. Server accepts a submit any time before the 72h window closes. |
| 12 | **3-hour timer expires (browser closed, never returns)** | The session sits IN_PROGRESS until the 72h window closes, then the expiry sweep auto-grades saved answers (COMPLETED) or marks ABANDONED if empty. **Answered work is captured, not lost.** |
| 13 | **72-hour window closes** | Hard deadline. Resolved by the sweep as above. |

### C.4 Eligibility / slot scenarios

| # | Scenario | System behaviour |
|---|---|---|
| 14 | **Tries a 2nd free (STANDARD) mock in the same month** | Rejected — the slot is already consumed (409). |
| 15 | **Buys an EARNED mock** | Requires ≥1500 momentum, ≥4 completed IAs, ≥14 days on platform, plus base eligibility. The 1500 deduction and session creation are atomic — a failed create rolls back the spend. |
| 16 | **Two concurrent starts of the same slot** | The unique constraint lets exactly one win; the other gets a clean 409 (not a 500). Any EARNED spend on the losing request rolls back. |
| 17 | **New month rolls over** | A fresh STANDARD slot (and EARNED opportunity) opens; prior months' consumed slots don't carry forward. |

### C.5 Concurrency / integrity scenarios

| # | Scenario | System behaviour |
|---|---|---|
| 18 | **Submits twice / double-clicks** | Status-guarded transaction grades once; the second call returns the stored result (`already_done`). No double band/momentum. |
| 19 | **Answers save concurrently** | Atomic single-key JSONB merge — no lost updates. |
| 20 | **AI grader down at submit** | Session preserved, retry prompt; no band/momentum/slot change. Retries on next submit or on the next expiry sweep (see A.4). |
| 21 | **Question pool incomplete at start** (a section has no questions) | Blocked with a 503 **before** the session is created — the monthly slot is **not** consumed. Prevents a band-0 blend and a blank screen. |

---

## Part D — Network Interruption & Recovery

| Scenario | IA | Mock |
|---|---|---|
| **Connection drops mid-test** | Answers already saved persist server-side; on reconnect the student resumes the IN_PROGRESS session with prior answers and the correct remaining section time. | Same — answers persist continuously; resume within the 72h window with all prior answers and the global timer state. |
| **Connection drops during submit** | If the server recorded completion, the result is retrievable on reconnect (the duplicate-submit guard returns the stored result). If it never reached the server, the session stays IN_PROGRESS and can be resubmitted. | Same — the status-guarded transaction makes a resubmit safe; a completed session returns its stored result. |
| **Answer save fails transiently** | The client retries; because each save is an idempotent single-key merge, a duplicate retry is harmless. | Same. |

---

## Part E — Quick State-Transition Summary

**IA session lifecycle:**
```
(scheduled) → PENDING → IN_PROGRESS ──submit/auto-grade(with answers)──▶ COMPLETED  (+100..+250)
                  │            │
                  │            └──window passes, no real answers──▶ MISSED (−20)
                  └──never opened, eligible, day passes──▶ MISSED (−20, retroactive)
```

**Mock session lifecycle:**
```
(eligible) → PENDING → IN_PROGRESS ──submit/auto-grade(with answers)──▶ COMPLETED  (+200/+700)
                 │            │
                 │            └──72h passes, no real answers──▶ ABANDONED (no penalty)
                 └──(never opened)──▶ no session; slot stays free
```

**Invariants that hold in every scenario:**
- Momentum never goes below 0.
- A band never changes without a graded, completed session.
- AI-grading failure never fabricates a score, never penalizes, never consumes a slot.
- Every award/penalty/transition is idempotent — retries and races resolve to exactly one effect.
- Unanswered questions always count as wrong; scoring never uses only the answered subset.
