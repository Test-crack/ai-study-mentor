# Backend Request — Dropout-risk notifications for staff roles

**From:** Gokul (Frontend)
**Date:** 22 August 2026
**Size:** medium — most of it is wiring, but **Request 1 is genuinely new infrastructure**
**Blocking:** DATA_AUDIT item C3, plus the dropout-risk feature we want to sell as a retention story

> **The frontend is already built and merged against this contract.**
> Bells exist for instructor, institute-admin and institute-owner, and all three
> render every event type below from one shared registry
> (`src/shared/notifications/staffEvents.tsx`).
>
> Nothing is waiting on me. Today the new event types simply never arrive, so the
> bells show "You're all caught up" — unrecognised types are skipped by design.
> The owner bell additionally 404s silently until Request 2 lands. **The moment
> your producer writes a row, it renders.** No frontend deploy needed.
>
> That also means the payload shapes in Request 5 are the live contract, not a
> proposal. If you need to change one, tell me and I'll adjust the renderer.

---

## The problem in one line

The notification system has **exactly one producer**, and it only ever notifies students and instructors — so the institute-admin bell is wired end-to-end but can never receive anything, and the institute-owner has no bell at all.

---

## Read this part first — the prerequisite

Everything else in this doc is straightforward. This one is not, and it decides whether the feature is possible as designed.

**Missed-assessment detection is triggered by the student's own activity.** `detectAndMarkMissedIAs()` is called from three places, and all three are student-authenticated endpoints:

| Call site | Endpoint it serves |
|---|---|
| `src/controllers/iaController.ts:133` | `GET /api/ia/status` (student) |
| `src/controllers/studentController.ts:384` | `GET /api/student/pending-notifications` |
| `src/controllers/studentController.ts:440` | `GET /api/student/notifications` |

And there is **no scheduler in the backend at all** — I grepped for `node-cron`, `cron.schedule`, `setInterval`, `agenda` and `bullmq` across `backend/src`. Zero matches.

So a student's misses are only recorded when *that student* logs in and loads their own dashboard.

> **The consequence:** the more disengaged a student becomes, the less likely the platform notices. The exact student we want to flag — the one who stopped opening the app — is the one whose misses never get swept, so they never cross a threshold, so nobody is ever alerted.

Dropout detection cannot ride on this trigger model. It needs a scheduled sweep. That's Request 1.

---

## What already exists and should NOT be rebuilt

This is the good news — the architecture is already right and recipient-generic.

| Piece | Where | Status |
|---|---|---|
| Single notification table, keyed by `User.id` | `user_notifications` (`prisma/schema.prisma`) | Ready for any recipient |
| Idempotent write API | `notifyUser(userId, type, payload, dedupeKey)` in `src/lib/studentNotify.ts` | Ready, role-agnostic |
| Read/mark/dismiss handlers | `src/controllers/userNotificationController.ts` | Ready, role-agnostic |
| Instructor fan-out pattern | `notifyInstructorsOfMissedIA()` in `studentNotify.ts` | Working reference implementation |
| Dedupe guard | `@@unique([user_id, dedupe_key])` | Already in place — see Request 4 on why this matters |

Routes currently mounted:

| Role | `/notifications` mounted? | Bell in UI? | Ever receives anything? |
|---|---|---|---|
| Student | Yes | Yes | Yes — `IA_MISSED` |
| Instructor | Yes | Yes | Yes — `STUDENT_IA_MISSED` |
| Institute Admin | Yes | Yes | **No — no producer targets admins** |
| Institute Owner | **No** | **No** (commented out in `InstituteOwnerTopbar`) | No |

To confirm the admin bell has never received anything:

```sql
SELECT type, count(*) FROM user_notifications GROUP BY type;
```

Expect only `IA_MISSED` and `STUDENT_IA_MISSED`.

**Every input a risk model needs is already in the database.** Nothing new needs tracking:

| Signal | Source |
|---|---|
| Days since last activity | `drill_sessions` — `MAX(created_at)` per student |
| Streak / momentum | `institute_students.daily_streak`, `.momentum_score`, `.last_streak_date` |
| Missed assessments | `ia_sessions` where `status = 'MISSED'` |
| Never started | `institute_students.isDiagnosed = false` |
| Band + trend | `student_competency_matrix`, plus last 2 completed `ia_sessions.scores` |
| Baseline | `assessment_history` where `mode = 'DIAGNOSTIC'` (first row per skill) |
| Exam proximity | `institute_students.exam_date` |
| Drill accuracy (DCS) | `drill_sessions.correct_answers / total_questions` |

---

## Request 1 — a scheduled sweep (the prerequisite)

A nightly job, per institute, over **active** students (`institute_students.is_active = true`), that:

1. runs the existing `detectAndMarkMissedIAs()` for each student, so misses are recorded regardless of whether the student logged in;
2. evaluates the risk model (Request 3);
3. emits events on tier transitions (Request 4).

Timing suggestion: shortly after IST midnight, so the IST calendar-day boundaries the codebase already uses (`todayStartIST()`, `toISTDateString()`) line up.

Two things to be careful about:

- **Keep it idempotent.** If it runs twice, or is re-run manually after a failure, it must not double-deduct momentum or duplicate notifications. `detectAndMarkMissedIAs` already guards status transitions; the notification side is covered by `dedupe_key`.
- **Batch it.** Whole-institute sweeps should use the existing `IN`-clause + in-memory grouping style from `src/lib/batchDashboardQueries.ts` rather than per-student queries.

Runner choice is yours (in-process cron vs. an external scheduler hitting a protected endpoint). If it's an endpoint, it needs to be locked down — not reachable with a normal user JWT.

---

## Request 2 — mount notification routes for `INSTITUTE_OWNER`

Pure wiring. The handlers already exist and are recipient-generic; the owner router just never mounted them.

```
GET  /api/institute-owner/notifications
POST /api/institute-owner/notifications/read           { all: true } | { ids: [...] }
POST /api/institute-owner/notifications/:id/dismiss
```

Same three handlers already used by `instituteAdminRoutes.ts`:
`getUserNotifications`, `markUserNotificationsRead`, `dismissUserNotification`.

I'll build the owner bell on the frontend once these exist.

---

## Request 3 — the risk model

### 3a. Please split this into two concepts, not one score

We listed streak + missed assessments + scores as inputs to one "dropout risk" number. I'd argue against merging them — they're two different problems, with different owners and different fixes:

| Concept | Signals | Means | Fix |
|---|---|---|---|
| **Disengagement risk** | days inactive, streak broken, missed IAs, never diagnosed, no mock ever | Student is leaving | Someone contacts them |
| **Performance risk** | band flat/declining, low DCS, gap to target vs. exam date | Student is trying but stuck | Someone teaches differently |

A student who drills daily but has plateaued at 5.5, and a student who vanished 12 days ago, both land in one bucket today. That's why at-risk lists get ignored. Split, and each list is short and each action is obvious.

For **dropout** specifically, weight **inactivity recency heaviest**. Band decline is a weak dropout predictor; a 9-day silence is a strong one.

### 3b. Ordinal tiers, not a 0–100 score

Suggest `WATCH` / `AT_RISK` / `CRITICAL`, each carrying the human-readable reasons that triggered it.

Rationale: we sell this to institutes, and "why is this student flagged?" must have a one-sentence answer. A weighted score can't give one. The existing `computeAtRiskFlags` already emits readable reason strings — that instinct is right, keep it.

### 3c. While you're here: the two at-risk implementations disagree

There are currently two flag generators, and they produce **different flag sets for the same student**:

| Flag | `batchDashboardQueries.ts` (`computeBatchDashboard`) | `instituteOwnerController.ts` (`computeAtRiskFlags`) |
|---|---|---|
| Not yet diagnosed | Yes | Yes |
| Never drilled | Yes | Yes |
| No activity for N days (≥3) | Yes | Yes |
| Missed N internal assessments (≥2) | Yes | Yes |
| Band score declining | Yes | Yes |
| **Streak broken** | Yes | **No** |
| **Low momentum** (< 100) | Yes | **No** |

So a student can be "at risk" on the instructor's batch dashboard and not on the owner's institute list. Whatever the notification model uses should be **one** shared definition, and ideally these two collapse into it.

---

## Request 4 — event producer + escalation ladder

### The ladder — DECIDED

| Day | Trigger | Event | Goes to |
|---|---|---|---|
| **0** | Student enters `AT_RISK` | `STUDENT_DROPOUT_RISK` | Every instructor of every batch they're in |
| **N** (suggest 3) | The instructor's day-0 notification is **still unread** — `read_at IS NULL` | `STUDENT_DROPOUT_ESCALATED` | Institute admins **and** the institute owner |
| Weekly | Scheduled | `INSTITUTE_RISK_DIGEST` | Institute owner |

**Escalation is read-based.** `user_notifications.read_at` on the day-0 row is the trigger — no tier history or outcome tracking needed, which is why we picked it. It's the simplest thing that works today.

Known limitation, accepted deliberately: a tutor who opens the alert and does nothing looks resolved, and a tutor who acts without opening it still escalates. We're taking that trade for simplicity. If it proves noisy in practice, the stronger signal is whether the *student's* behaviour changed (a new `drill_sessions` row or a completed IA since day 0) — worth revisiting then, not now.

**Why a ladder and not a broadcast:** if every role gets the same alert simultaneously, nobody owns it — each assumes someone more senior handled it. Escalating makes ownership unambiguous, and it tells the owner something more useful than "a student is struggling": that the process didn't work.

### The owner's bell is retention-only — this is a hard boundary

The owner must receive **only** dropout-risk events. Specifically **not**:

- `STUDENT_IA_MISSED` — a single missed assessment is the tutor's business, not the owner's
- diagnostic completions, mock-graded events, onboarding events
- anything else per-student and operational

An owner bell that fills with day-to-day activity is one nobody reads, and it undermines the ladder above.

The frontend enforces this too, as a second line of defence: `SCOPE_EVENTS` in `src/shared/notifications/staffEvents.tsx` is a per-portal allow-list, and anything outside it is dropped before rendering. So a producer bug can't leak operational noise into the owner's bell. **That does not remove your responsibility to pick recipients correctly** — it just means a mistake is invisible rather than embarrassing.

### Dedupe on tier transition, not on a timer

This is the thing most likely to go wrong. The sweep runs nightly; if it re-alerts every night while a student sits in a tier, the bell is worthless inside a week.

Fire only when the tier **changes** (`WATCH → AT_RISK → CRITICAL`). Suggested keys:

```
DROPOUT_RISK:<student_user_id>:<tier>          # day 0, per instructor
DROPOUT_ESCALATED:<student_user_id>:<tier>     # day N, per admin/owner
```

With the existing `@@unique([user_id, dedupe_key])` + upsert, re-running the sweep is a no-op.

### Event types — final

```
STUDENT_DROPOUT_RISK       → instructors only        (per-student, day 0)
STUDENT_DROPOUT_ESCALATED  → admins + owner          (per-student, day N)
INSTITUTE_RISK_DIGEST      → owner only              (weekly aggregate)
```

These names are what the frontend renders today. If you change one, tell me and I'll update the registry and its tests.

---

## Request 5 — payload contract

This is the part I need pinned down, because it's what I render. The ask is that a staff member can understand the situation **without clicking through** — so the student must arrive with their batch and instructor attached.

```jsonc
{
  "student_user_id": "uuid",          // User.id — I navigate with this
  "student_name":    "Arun Kumar",
  "batches": [                         // see note below — this is a LIST
    { "batch_id": "uuid", "batch_name": "Batch B",
      "instructors": [ { "user_id": "uuid", "name": "Sarah Khan" } ] }
  ],
  "tier":    "AT_RISK",                // WATCH | AT_RISK | CRITICAL
  "reasons": [                         // human-readable, ordered by weight
    "No activity for 9 days",
    "Missed 3 internal assessments",
    "Band score declining"
  ],
  "days_inactive":   9,
  "missed_ia_count": 3,
  "daily_streak":    0,
  "momentum_score":  40,
  "current_band":    6.0,
  "target_band":     7.5,
  "exam_date":       "2026-10-02",     // nullable

  // ESCALATED ONLY — the day the instructor was first told. This is the first
  // thing an admin or owner needs in order to chase it, and it is the reason the
  // escalation exists at all. Date or full ISO timestamp, both accepted.
  "instructor_notified_at": "2026-08-19"
}
```

Which renders, for an escalation in the admin or owner bell, as:

> **Arun Kumar still needs attention**
> Batch B · Tutor: Sarah Khan
> Critical — not resolved yet. No activity for 9 days · Missed 3 internal assessments
> Band 6.0 · target 7.5 · exam in 41 days **Tutor notified 19 Aug, unopened since.**

Clicking it opens that student's progress page in whichever portal you're in.

**Important — `batches` must be a list, not a single object.** `BatchStudent`'s unique key is `(batch_id, user_id)`, so a student can belong to more than one batch, and `getInstituteStudents` already works around this with a "use first batch if student in multiple" comment. Please decide explicitly: return all batches, or designate a primary. Silently picking the first is what we have now and it's misleading on the instructor line.

Every field above already exists in the DB (see the signal table earlier) — this is assembly, not new tracking.

### The owner digest payload

`INSTITUTE_RISK_DIGEST` carries an aggregate, never a student. This is the shape the frontend already renders:

```jsonc
{
  "period_start":    "2026-08-16",
  "period_end":      "2026-08-22",
  "flagged_total":   14,
  "by_tier":         { "watch": 6, "at_risk": 5, "critical": 3 },
  "recovered_count": 9,                 // Request 6 — send 0, don't omit it
  "top_concentrations": [
    { "batch_id": "uuid", "batch_name": "Batch B",
      "instructor_names": ["Sarah Khan"], "flagged_count": 6 }
  ]
}
```

Renders as:

> **14 students flagged — 16 Aug – 22 Aug**
> 3 critical · 5 at risk · 6 watch. Most concentrated in Batch B (Sarah Khan) — 6. 9 recovered after contact.

`recovered_count: 0` is rendered as "0 recovered after contact" — that's a real answer and the frontend states it. Omitting the field hides it entirely, so please send it even when zero.

### Tolerance the frontend already provides

You don't need to send every field. The renderer degrades to a shorter line rather than printing `undefined`:

- No `reasons[]` → it reconstructs a short one from `days_inactive`, `missed_ia_count` and `daily_streak`.
- No `batches[]` → the batch/tutor line is omitted rather than blank.
- No `current_band` / `target_band` / `exam_date` → those clauses drop out.
- Missing `student_user_id`, or (for the instructor route) no batch → the row renders but isn't clickable, instead of linking to a broken page.
- Unrecognised `type` → the row is skipped entirely.

So a first cut that sends only `student_user_id`, `student_name`, `tier` and `reasons[]` will already render correctly. The rest is enrichment.

---

## Request 6 — the recovery signal

Worth treating as part of this feature rather than a follow-up, because **this is the commercial payload**.

When a flagged student becomes active again, record it. That gives the owner "14 students flagged, 9 recovered after contact this month" — which is the renewal argument, and the only version of this feature that proves the platform works rather than just reporting bad news.

Minimum viable: when a student's tier improves, emit an event and/or store the transition so a monthly count can be derived. If tier history isn't stored anywhere, this becomes impossible to report later, so it's worth deciding now.

---

## Request 7 — add `instructors[]` to `GET /at-risk`

Small, and it reuses whatever you build for Request 5.

The owner and admin already have a **browsable** at-risk list — `GET /at-risk`, rendered as a paginated table on `InstituteOwnerDashboard`. It currently shows student name · batch · primary flag · days inactive. The payload has no instructor field at all:

```
student_id · user_id · name · avatar · batch_id · batch_name ·
flags · primary_flag · days_inactive · missed_ia_count ·
current_band · target_band
```

So the table reads:

> Arun Kumar · Batch B · No activity for 9 days
> Priya S · Batch B · Missed 3 internal assessments
> Rahul K · Batch B · Streak broken
> …9 more

An owner cannot see that all twelve are the same tutor's students. That's the single most useful fact on the screen for them — it turns a list of individuals into one staffing conversation. Their job is patterns, not individuals, and tutor concentration is the pattern.

**Ask:** add the same `instructors[]` shape Request 5 already needs:

```jsonc
{
  // ...existing fields unchanged...
  "instructors": [ { "user_id": "uuid", "name": "Sarah Khan" } ]
}
```

Notes:

- The join already exists in `getInstituteInstructors` (batch → `batch_instructors` → `User`), so this is reuse, not new work.
- Same multi-batch caveat as Request 5 — a student can sit in several batches, so this is a list.
- The handler is mounted on **both** `/institute-owner/at-risk` and `/institute-admin/at-risk`, so one change serves both portals.
- Purely additive. Nothing breaks if it ships later than the rest.

I'll add the column once the field exists — a column of em-dashes isn't worth shipping before then.

**Why this matters for scoping the bell:** with the tutor on this table, the owner can survey the whole at-risk population whenever they want. That's what lets the bell stay narrow (escalations only) instead of becoming a feed. Dashboard for browsing, bell for exceptions.

---

## Open decisions for you

Settled since the first draft: escalation is **read-based** (`read_at IS NULL` on the day-0 row), and the owner **does** get the per-student escalation — carrying student name, batch, tutor and `instructor_notified_at` — but nothing else.

| # | Decision | My lean |
|---|---|---|
| 1 | Scheduler: in-process cron vs. external hitting a protected endpoint | Either; external is easier to observe and re-run |
| 2 | Thresholds for `WATCH` / `AT_RISK` / `CRITICAL` | Reuse the existing cut-offs (inactive ≥3, missed ≥2) so bells and at-risk lists agree |
| 3 | Days unread before escalation | 3 |
| 4 | Multi-batch students: all batches, or a primary? | List all; the tutor line is the point of the notification |
| 5 | Store tier history, or derive recovery some other way? | Store it — Request 6 is impossible retroactively |
| 6 | Consolidate the two at-risk flag generators? | Yes, into one shared definition |
| 7 | Keep the weekly owner digest, or per-student escalations only? | Keep it, but it's one line to drop in the frontend allow-list if you'd rather not build it |

---

## Explicitly out of scope

- **Risk-labelled notifications to students.** Telling a student they're at high dropout risk is demotivating and somewhat self-fulfilling. The codebase already takes this stance deliberately — `readinessProjection.ts` floors negative projections with a documented honesty-vs-motivation rationale, and the dashboard catch-up banner uses neutral copy ("Let's pick things back up"). Students should get a nudge framed as a next action, never a diagnosis. If we want to nudge disengaged students, that's a separate piece of work with different copy rules.
- **Per-student bell events for the institute owner.** Aggregate only — see Request 4.
- **New tracking or new columns.** Everything needed is already stored.
- **Push / email / SMS.** In-app bell only for now. Worth noting that if we later want email for genuinely disengaged students, the bell is useless for them by definition — they aren't logging in. That's a real follow-up conversation, not part of this.

---

## What I will build with it

| Backend item | Frontend work |
|---|---|
| Request 2 (owner routes) | Owner notification bell — I'll generalise the existing `AdminNotificationBell` to take a portal scope, so both portals share one component |
| Request 4 event types | Render cases per type, with the batch/tutor line from Request 5 |
| Request 5 payload | The card layout shown above |
| Request 6 recovery | An owner-facing "flagged vs. recovered" panel |

Roughly 1–2 days of frontend work once Requests 2, 4 and 5 land. Request 1 unblocks the whole thing but needs no frontend work at all.

---

## Adjacent findings — not part of this feature

Both came out of the same audit. Neither blocks anything above; both are yours to own.

### 1. `POST /instructor/batches/:batchId/students/:id/diagnostic/retake` does not exist

The instructor Diagnostic-overview table had a per-row **Retake** button posting to that path. There is no such route anywhere in the backend — I grepped for `retake` across `src/routes` and `src/controllers`. Every click 404'd. The component even carried a comment reading *"Contract unconfirmed as of writing — check before relying on this."*

**Done on the frontend:** the button and its confirmation modal are removed. Nothing calls that path any more.

The only working equivalent is the owner/admin `POST /students/:id/diagnostic/reset`, which is already wired into the Diagnostic tab of the student progress page. So the capability exists for those roles and no functionality was lost.

**Open question for you:** should instructors get a working diagnostic reset? If yes it needs a batch-scoped route reusing `resetStudentDiagnostic`'s logic. If no, nothing to do — this is already resolved.

### 2. Three columns that are never written

Verified across the whole repo: no writer, no reader, no reference. Every row is NULL, so dropping them loses no data.

| Column | Note |
|---|---|
| `assessment_history.engine_version` | Added as scoring provenance. The only writers to this table are `diagnosticController`, `mockController` and `lib/iaProcessor`; none set it. |
| `assessment_history.config_version` | Same. |
| `drill_sessions.ai_feedback_json` | Zero references anywhere. Per-drill AI feedback isn't generated — a drill's qualitative output is the student's `reflection_text`. |

**Do NOT confuse with `exam_configs.config_version`** — that one is real and load-bearing: part of the `(exam_id, config_version)` unique key, seeded from `exam-engine-config.v2.json`, read by `exam-engine/loader.ts`.

Also left alone deliberately: `viva_answers.engine_version` / `config_version`. That table is a documented Phase-4 scaffold whose every column is unwritten because the Viva engine has no serving logic yet — dropping two of its columns while leaving the other eight would be arbitrary.

**Two options.** Either drop them, or start populating them — provenance on a scoring product is arguably worth having, and today you can't tell which engine version produced any historical result.

If you drop them, **order matters.** Prisma emits explicit column lists, so a client generated from the old schema keeps SELECTing them; drop the columns while that client is live and every read of `assessment_history` or `drill_sessions` without an explicit `select` fails at runtime. Sequence: regenerate the client → deploy → then drop.

*(I prepared this change and then reverted it — `schema.prisma` is untouched and no migration was ever applied. It's documented here rather than done, so it's your call.)*

---

## Summary

| # | Ask | Effort | Note |
|---|---|---|---|
| 1 | **Nightly scheduled sweep** | Medium — new infra | **Prerequisite.** Nothing works without it |
| 2 | Mount `/notifications` for `INSTITUTE_OWNER` | Trivial | Handlers already exist |
| 3 | Risk model: split disengagement vs. performance; ordinal tiers | Medium | All inputs already in DB |
| 4 | Producer + escalation ladder, dedupe on tier transition | Medium | Reuse `notifyUser` |
| 5 | Payload contract incl. batch + instructor | Small | Assembly only |
| 6 | Recovery signal / tier history | Small–medium | Do it now or lose it retroactively |
| 7 | `instructors[]` on `GET /at-risk` | Small | Reuses Request 5's join; serves owner + admin |

Plus two adjacent findings above (dead `diagnostic/retake` route, three never-written columns) — independent of this feature.

**Start with 1 and 2.** Request 2 is a few lines and lets me build the owner bell in parallel; Request 1 is the real work and everything else depends on it.

**Request 7 is the best small win** — it's additive, breaks nothing, and gives the owner the tutor concentration they currently can't see.
