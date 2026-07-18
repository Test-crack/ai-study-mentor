# Student Notifications — Architecture & Implementation Plan

**Status:** In progress
**Owner:** Sarthak
**Last updated:** 2026-07-18

---

## 1. Problem

The dashboard currently stacks one full-width banner per notification (e.g., 3 missed
IAs = 3 banners), consuming the prime dashboard space on every login. Dismissals live
in `sessionStorage`, so they don't survive a browser restart and don't sync across
devices. There is no notification history and no read state.

## 2. Design

### Two kinds of notifications (the core decision)

| Kind | Types | Storage | Read state | Lifecycle |
|---|---|---|---|---|
| **Live CTAs** | `IA_PENDING`, `IA_IN_PROGRESS`, `MOCK_PENDING`, `MOCK_IN_PROGRESS` | **Derived** on the fly from session state (unchanged from today) | None — resolving them IS reading them | Auto-appear/disappear with the underlying IA/Mock session |
| **Events** | `IA_MISSED` (+ future: mock graded, momentum awards, announcements…) | **Persisted** in `student_notifications` table | `read_at` (bell badge) + `dismissed_at` (dashboard banner X) | Created once at the moment the event happens; kept as history |

Why: persisting CTAs would create sync bugs (a stored "IA pending" row lying around
after the IA completes). Deriving events would mean no read state and no history.
Each kind is stored the way it naturally behaves.

### Read vs. dismissed — two different gestures

- **read_at** — explicit, per Sarthak's feedback (2026-07-18): clicking one
  notification marks only that one read; the dropdown header has a "Mark all
  read" button. No auto-read-on-open. Item stays visible in the bell list.
- **dismissed_at** — set when the student clicks ✕ on a dashboard banner. Removes it
  from the dashboard permanently (cross-device), but it remains in the bell history.

### Display rules

- **Dashboard (`DailyNotices`)**: CTAs first, then un-dismissed events, **max 3 total**.
- **Bell dropdown**: CTAs pinned at top, then all events newest-first (paginated).
  Badge shows count of unread events. Click an item → that item is read;
  "Mark all read" button clears the rest.

## 3. Database

> **Consolidated 2026-07-18 (Phase 3):** the original per-role
> `student_notifications` table was merged into ONE recipient-generic table.

Single table for ALL persisted events, keyed by `User.id` (Prisma model
`UserNotification` → `user_notifications`):

```prisma
model UserNotification {
  id           String    @id @default(dbgenerated("uuid_generate_v4()")) @db.Uuid
  user_id      String    @db.Uuid
  type         String    @db.VarChar(50)
  payload      Json      @default("{}")
  dedupe_key   String?   @db.VarChar(160)
  created_at   DateTime  @default(now()) @db.Timestamptz(6)
  read_at      DateTime? @db.Timestamptz(6)
  dismissed_at DateTime? @db.Timestamptz(6)
  User         User      @relation(fields: [user_id], references: [id], onDelete: Cascade, onUpdate: NoAction)

  @@unique([user_id, dedupe_key], map: "uq_user_notification_dedupe")
  @@index([user_id, created_at(sort: Desc)], map: "idx_user_notifications_feed")
  @@map("user_notifications")
}
```

Why one table: students are Users (`institute_students.user_id` is unique), a
future event can target any mix of roles without a which-table decision, and
one store means one producer, one read/dismiss controller, one set of fixes.
Role-specific behavior (the student's merged-CTA feed, per-role display copy)
lives in endpoints and UI, not in storage.

`dedupe_key` (e.g. `IA_MISSED:2026-07-16`) makes producers idempotent — critical
because the miss-detection sweep runs on every dashboard load.

## 4. Backend (backend-study-mentor)

### 4.1 Producer helper — `src/lib/studentNotify.ts`
`notify(studentId, type, payload, dedupeKey)` — upsert on `(student_id, dedupe_key)`,
swallow-and-log errors (notifications must never break the calling flow). This is the
ONE entry point every future feature calls.

### 4.2 Emit on miss — `src/lib/iaMissDetector.ts`
After each successfully applied penalty (all three sites: auto-grade-failure, stale
PENDING/IN_PROGRESS, retroactive Case D), call
`notify(studentId, 'IA_MISSED', { ia_number, ia_date, momentum_deducted }, 'IA_MISSED:<date>')`.
Fire after the penalty transaction commits (best-effort, non-transactional).

### 4.3 Endpoints — `studentController.ts` + `studentRoutes.ts`
| Method & path | Behavior |
|---|---|
| `GET /api/student/notifications?limit=20&cursor=<id>` | `{ success, cta: [...derived, same shape as today], events: [...rows], unread_count, next_cursor }` |
| `POST /api/student/notifications/read` | Body `{ all: true }` or `{ ids: [...] }` → sets `read_at` where null |
| `POST /api/student/notifications/:id/dismiss` | Sets `dismissed_at` (scoped to the student) |

The CTA derivation in `getPendingNotifications` is extracted into a shared helper so
old and new endpoints serve identical CTA data during migration. The old
`GET /pending-notifications` stays until the frontend fully migrates, then dies.

### 4.4 Backfill
One-time SQL: insert `IA_MISSED` notification rows for existing `MISSED` IASessions
from the last 7 days (so current students' banners carry over with dedupe keys).

## 5. Frontend (ai-study-mentor)

### 5.1 `NotificationsProvider` + `useNotifications()`
`src/features/student/Context/NotificationsContext.tsx` — single fetch of
`GET /api/student/notifications` shared by the bell and the dashboard (no double
fetch, no disagreement). Exposes: `cta`, `events`, `unreadCount`, `markAllRead()`,
`dismiss(id)`, `refresh()`. Refetch on mount + window focus. Mounted in
`StudentLayout` so every student page gets it.

### 5.2 `NotificationBell` — in `StudentTopbar`
Bell icon (already imported, unused) placed left of the avatar. Unread badge dot/count.
Dropdown: CTAs pinned on top (with their CTA buttons), events below newest-first,
relative timestamps, empty state. Opening the dropdown → `markAllRead()`.

### 5.3 `DailyNotices` refactor
- Consumes `useNotifications()` instead of fetching itself.
- Renders CTAs first, then un-dismissed events, capped at **3**; if more exist, a
  "View all in notifications" hint pointing at the bell.
- Banner ✕ → `dismiss(id)` API (replaces sessionStorage) for events; CTAs keep
  sessionStorage dismissal (they're transient by nature and have no DB row).
- Existing `BannerConfig` styling/copy reused as-is.

## 6. Task checklist

### Backend
- [x] B1. Prisma model + SQL DDL for `student_notifications` (`prisma/sql/student_notifications.sql`)
- [x] B2. `src/lib/studentNotify.ts` producer helper
- [x] B3. Emit `IA_MISSED` from `iaMissDetector.ts` (3 call sites)
- [x] B4. Extract shared CTA-derivation helper (`deriveCtaNotifications`)
- [x] B5. `GET /api/student/notifications` (merged feed + unread_count + pagination)
- [x] B6. `POST /api/student/notifications/read`
- [x] B7. `POST /api/student/notifications/:id/dismiss`
- [x] B8. Routes wired in `studentRoutes.ts`
- [x] B9. Backfill SQL for existing recent MISSED sessions (same file as B1)
- [x] B10. `tsc` clean build

### Frontend
- [x] F1. `NotificationsContext.tsx` (provider + hook)
- [x] F2. Mount provider at **app root** (not StudentLayout — 14 student pages
      render `StudentTopbar` outside the layout; fetch is gated on
      `profile.role === 'STUDENT'` so other roles never call the endpoint)
- [x] F3. `NotificationBell.tsx` + wire into `StudentTopbar` (shared display
      config extracted to `notificationConfig.tsx`)
- [x] F4. Refactor `DailyNotices` (consume context, cap 3, API dismiss)
- [x] F5. Frontend build clean

### Rollout
- [ ] R1. Run DDL + backfill SQL on Supabase
- [ ] R2. Deploy backend, then frontend
- [ ] R3. Verify: badge count, mark-read on open, dismiss persistence across refresh/devices
- [ ] R4. Retire `GET /pending-notifications` once stable

---

## Phase 2 — Instructor notifications (2026-07-18)

### Design
Same event architecture, new audience, one generalization: a **recipient-generic
`user_notifications` table keyed by `User.id`** (not a bespoke per-role table).
Instructors use it today; owners/admins plug in later with zero schema change —
just mount the same generic controller on their routers.

- **Event**: `STUDENT_IA_MISSED` — fan-out: student misses IA → one notification
  per instructor of every batch that student is in (resolved via
  `ielts_batch_students(user_id)` → `batch_id` → `ielts_batch_instructors`).
- **Dedupe**: `STUDENT_IA_MISSED:<student_user_id>:<ia_date>` per instructor —
  an instructor sharing two batches with the student gets ONE row.
- **Curated message**: "Sarthak missed an assessment" + IA number, date,
  momentum impact; **click → `/instructor/batches/:batchId/students/:studentUserId/progress`**
  (payload carries `batch_id` + `student_user_id` for the deep link).
- **Read model**: identical to student bell — per-item read on click,
  "Mark all read" button, `dismissed_at` reserved for future banner surfaces.

### Pieces
| Layer | File | What |
|---|---|---|
| DB | `prisma/sql/user_notifications.sql` | DDL + instructor backfill (last 7 days of MISSED IAs, joined through batches) |
| Schema | `schema.prisma` → `UserNotification` | `@@map("user_notifications")`, unique `(user_id, dedupe_key)` |
| Producer | `src/lib/studentNotify.ts` | `notifyUser()` + `notifyInstructorsOfMissedIA()` (fan-out, best-effort) |
| Emit | `src/lib/iaMissDetector.ts` | fan-out fires at the same 3 penalty sites as the student event |
| API | `src/controllers/userNotificationController.ts` | generic GET feed / POST read / POST dismiss, keyed by appUserId only |
| Routes | `instructorRoutes.ts` | `/api/instructor/notifications[...]` behind INSTRUCTOR RBAC |
| FE state | `instructor/Context/InstructorNotificationsContext.tsx` | root-mounted, gated `role === 'INSTRUCTOR'` |
| FE UI | `instructor/components/dashboard/InstructorNotificationBell.tsx` | bell + dropdown; `EVENT_DISPLAY` map = one entry per event type |
| FE wire | `InstructorTopbar.tsx` | bell between theme toggle and profile block |

### Checklist
- [x] P2-1. `UserNotification` model + `user_notifications.sql` (DDL + backfill)
- [x] P2-2. `notifyUser` + `notifyInstructorsOfMissedIA` producers
- [x] P2-3. Emit at all 3 miss-detector penalty sites
- [x] P2-4. Generic controller + instructor routes
- [x] P2-5. Backend `tsc` clean
- [x] P2-6. `InstructorNotificationsContext` + root mount (role-gated)
- [x] P2-7. `InstructorNotificationBell` + topbar wiring
- [x] P2-8. Frontend build clean
- [ ] P2-R1. Run `prisma/sql/user_notifications.sql` on the database
- [ ] P2-R2. Deploy backend + frontend; verify bell as instructor (Rahul) after a student miss

---

## Phase 3 — Single-table consolidation (2026-07-18)

`student_notifications` merged into `user_notifications`. Changes:

- `notifyStudent()` is now a thin wrapper: resolves `student_id → user_id`,
  delegates to `notifyUser()`. Call sites (miss detector) unchanged.
- `getStudentNotifications` reads events from `user_notifications` by
  `appUserId`; still sweeps + merges derived CTAs (that behavior is the
  endpoint's, not the table's).
- Student read/dismiss routes now mount the SAME generic handlers from
  `userNotificationController.ts` that instructors use. The duplicated
  student-specific handlers were deleted.
- `StudentNotification` model removed from schema.
- SQL: `user_notifications.sql` now carries BOTH backfills (fresh installs);
  `consolidate_notifications.sql` migrates + drops for DBs that already ran
  the old file; `student_notifications.sql` retired to a pointer stub.
- Frontend: zero changes — endpoints and response shapes are identical.

### Checklist
- [x] P3-1. Migration SQL (`consolidate_notifications.sql`)
- [x] P3-2. Schema: drop `StudentNotification`
- [x] P3-3. `notifyStudent` → wrapper over `notifyUser`
- [x] P3-4. Student feed reads `user_notifications`; generic read/dismiss reused
- [x] P3-5. Backend tsc + frontend build clean
- [ ] P3-R1. Run `consolidate_notifications.sql` in psql (AFTER `user_notifications.sql`)
- [ ] P3-R2. Pull + `prisma generate` + restart backend on VPS
- [ ] P3-R3. Verify: student banners/bell intact, instructor bell intact,
      `SELECT type, COUNT(*) FROM user_notifications GROUP BY type;`

## 7. Explicitly out of scope (for now)
- WebSockets / push — polling on mount + focus is sufficient at current scale
- Read/unread filters, notification preferences/settings page
- Owner/admin notifications (supported by `user_notifications` — just mount the
  generic controller on their routers and add an `EVENT_DISPLAY` entry)
