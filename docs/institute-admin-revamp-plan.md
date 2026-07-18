# Institute Admin Portal — Revamp & Implementation Plan

**Status:** In progress — decisions resolved 2026-07-18: §8.1 reframe to real
data (no approval workflow), §8.2 real Reports + static Billings
**Owner:** Sarthak
**Last updated:** 2026-07-18
**Reference:** Owner portal (`src/features/InstituteOwner`) is the quality bar — its
service-layer, skeleton, KPI-card, badge, and modal patterns are adopted wholesale.

---

## 1. Current state (recon summary)

| Page | Route | Lines | Data today | Verdict |
|---|---|---|---|---|
| Dashboard | `/institute-admin/dashboard` | 388 | 100% mock (names, counts, activity all hardcoded) | **Full revamp** |
| Tutor Accounts | `/institute-admin/tutor` | 268 | 100% mock (fake calibration/ratings) | **Full revamp** |
| Students | `/institute-admin/students` | 323 | 100% mock (16 fake students) | **Full revamp** |
| Institute Setting | `/institute-admin/Setting` | 262 | 100% mock ("Ace English Academy") | **Wire to real data** |
| Batch Allocation | `/institute-admin/batches` | 784 | Real (9 API calls) | Polish only |
| Student Onboarding | `/institute-admin/studentOnboarding` | 433 | Real (4 API calls) | UI/quality polish |
| Tutor Onboarding | `/institute-admin/tutorOnboarding` | 399 | Real (3 API calls) | UI/quality polish |
| Reports | `/institute-admin/reports` | 553 | 100% mock | Decision §8.2 |
| Billings | `/institute-admin/billings` | 331 | Static marketing | Decision §8.2 |

Backend reality: **most data already exists.** All admin routes share owner handlers
(`authorize(IA, IO)`), including the full analytics suite. Gaps: no tutor count in
`getSummary`, no instructor activity tracking, no institute-profile read/update
endpoint, and **no pending-approval flow at all** (invites activate immediately —
the dashboard's "Approve/Reject" panel is fiction).

## 2. Architecture decisions

1. **One service layer, typed end-to-end.** Extend `instituteAdminService.ts`
   with the new endpoints; reuse `instituteOwnerService` types where the payload
   is the same handler (students overview, instructors). No fetch logic inside
   components.
2. **Shared layout + primitives.** New `InstituteAdminLayout` wraps
   sidebar + topbar + content padding (kills the per-page hand-rolling).
   Extract from the owner portal into `src/features/Institute/components/shared/`:
   `KpiCard`, `StatusBadge`, `BandPill`, `TableSkeleton`, `CardSkeleton`,
   `EmptyState`, `ConfirmDialog`. Admin pages import these — no copy-paste.
3. **Reuse owner handlers wherever the data is institute-scoped, not role-scoped.**
   The admin students table and tutor cards read the SAME data the owner sees —
   mount the owner handlers on admin routes (pattern already established).
4. **"Pending Onboarding" reframed to real data** (recommendation, §8.1):
   the truthful state we can show is *invited-but-not-started* — students with
   `isDiagnosed = false` / tutors with no batch assignment yet — plus invite
   recency. Approve/Reject implies a workflow the product doesn't have.
5. **Design language:** owner portal tokens — `rounded-2xl` cards,
   `dark:bg-[#131318]`, indigo accent, semantic badges (emerald/amber/rose),
   lucide icons, skeleton-first loading, toast feedback. Dark mode everywhere.
6. **Notifications:** the admin topbar bell (currently a decorative red dot) wires
   to the existing recipient-generic `user_notifications` endpoints — just mount
   the 3 generic handlers on admin routes. Admin-facing events can come later;
   the pipe will already be live.

## 3. Backend work (backend-study-mentor)

| # | Task | Detail |
|---|---|---|
| A1 | Extend `getSummary` | Add `instructor_count`, `invited_not_started_count` (students `isDiagnosed=false`), `unassigned_tutor_count`. One endpoint feeds all dashboard KPIs. |
| A2 | Admin students overview | Mount owner's rich students handler (band/trend/streak/momentum/at-risk) on `GET /api/institute-admin/students-overview`. Existing basic `GET /students` stays for onboarding page. |
| A3 | Institute profile | `GET /api/institute-admin/institute` + `PATCH /api/institute-admin/institute` (name, address, logo_url) → powers Settings. PATCH restricted: name/address/logo only. |
| A4 | Onboarding-status lists | `GET /api/institute-admin/onboarding-status` → students (invited date, isDiagnosed, is_active) + tutors (invited date, batch count) for the dashboard "needs attention" panel. |
| A5 | Notifications mount | Add `GET /notifications`, `POST /notifications/read`, `POST /notifications/:id/dismiss` to instituteAdminRoutes using the generic `userNotificationController`. |
| A6 | Build check | `npx tsc --noEmit` clean. |

No schema changes required for the recommended scope. (Approval workflow, if
chosen in §8.1, adds a `pending_enrollments` table + 4 endpoints — separate phase.)

## 4. Frontend work — page by page

### P0. Foundation (before any page)
- `InstituteAdminLayout.tsx` (sidebar + topbar + main padding, mobile Sheet)
- `components/shared/`: KpiCard, StatusBadge, BandPill, skeletons, EmptyState, ConfirmDialog
- Service additions in `instituteAdminService.ts` (+types) for A1–A5
- Wire topbar bell → generic notifications (badge + dropdown, reuse student bell patterns)

### P1. Dashboard (full rebuild, replaces 388-line mock)
- **Hero strip**: institute name (real), date, KPI row from `getSummary`:
  Total Students · Active Today · Active Tutors · Active Batches · Needs Attention
- **Needs Attention panel** (replaces fake Approve/Reject): invited-not-started
  students (with "Resend invite" action), tutors with zero batches ("Assign to batch" → Batch Allocation)
- **Batches overview**: real batches with capacity bars (existing `fetchBatches`)
- **Tutor snapshot**: top tutors by student count (real, from instructors endpoint)
- **Recent activity**: real, derived from created_at streams (new enrollments, new batches) — no fake timeline
- Skeletons + error states throughout; every card links to its full page

### P2. Tutor Accounts (full rebuild)
- Real data via owner instructors handler: name, specialization, batches (chips),
  total students, per-batch student counts
- Enrich with at-risk count per tutor (from batch dashboard data)
- Card grid in owner-portal style; actions: view batches, remove tutor (existing endpoint)
- Drop fabricated metrics (calibration %, satisfaction) — no fake numbers survive the revamp

### P3. Students (full rebuild)
- Real searchable/sortable table via students-overview: avatar, name, batch,
  band + trend, streak, momentum, at-risk flag, active status
- Filters: batch, at-risk, active/inactive; pagination (owner table pattern)
- Row click → student full-progress page (admin-prefixed route reusing the
  owner/instructor progress components — endpoint already shared)
- Row actions: toggle active (existing PATCH), remove (existing DELETE)

### P4. Institute Settings (wire to real)
- Profile card ← `GET /institute`; save → `PATCH /institute`, toast on result
- Logo URL with preview; drop the fake notification-preferences block (or mark "coming soon" — no backend)

### P5. Onboarding pages (polish, keep working logic)
- StudentOnboarding + TutorOnboarding: migrate to `InstituteAdminLayout`,
  shared modal pattern (icon-prefix inputs, info box, footer buttons),
  shared skeletons/EmptyState, consistent badges; keep all existing service calls
- BatchAllocation (784 lines): extract BatchFormModal, BatchDetailPanel,
  MemberList into files; migrate to layout; behavior unchanged

### P6. Reports & Billings — per decision §8.2

## 5. Delivery order

Backend A1–A6 → P0 → P1 → P2 → P3 → P4 → P5 → P6.
Each page lands complete (data + skeleton + error + dark mode) before the next starts.
Frontend build verified after each phase; backend tsc after A6.

## 6. Task checklist

### Backend
- [x] A1 getSummary extension (instructor_count, unassigned_tutor_count, invited_not_started_count)
- [x] A2 students-overview mount (owner getInstituteStudents on /students-overview)
- [x] A3 institute GET/PATCH (+ name-required validation; is_active not editable)
- [x] A4 onboarding-status endpoint (+ POST /students/:userId/resend-invite)
- [x] A5 notifications mount on admin routes (generic userNotificationController)
- [x] A6 tsc clean

### Frontend
- [x] P0 InstituteAdminLayout + shared/primitives.tsx (KpiCard, StatusBadge,
      BandPill, skeletons, EmptyState, ErrorBanner, SectionCard) + service
      additions + AdminNotificationBell (replaces the fake red-dot bell)
- [x] P1 Dashboard rebuild — live KPIs, Needs Attention panel (resend invite /
      assign to batch), real batches + tutor snapshot; fake activity feed dropped
- [x] P2 Tutor Accounts rebuild — real batches/student-load per tutor, remove
      with confirm dialog; fabricated calibration/satisfaction metrics deleted
- [x] P3 Students rebuild — band/trend/streak/momentum/at-risk table, filters +
      pagination, row → new admin progress route
      `/institute-admin/students/:slug/progress` (shared tab components)
- [x] P4 Settings wired — GET/PATCH institute (name, address, logo w/ preview);
      fake email/phone/domain/notification prefs removed
- [x] P5 StudentOnboarding, TutorOnboarding, BatchAllocation migrated to
      InstituteAdminLayout (behavior unchanged)
- [x] P6 Reports rebuilt on real analytics (cohort progress chart, goal
      achievement, batch comparison, sub-skill heatmap) + enabled in sidebar;
      Billings stays static & hidden from nav
- [x] Final: frontend build clean (bundle −30 KB from mock removal)

### Rollout
- [ ] Deploy backend (tsc-verified) then frontend
- [ ] Smoke test as INSTITUTE_ADMIN and as INSTITUTE_OWNER (via admin portal)
- [ ] Dark-mode + mobile visual pass on all revamped pages

## 7. Out of scope (this revamp)
- Approval workflow tables/endpoints (unless chosen in §8.1)
- Instructor activity tracking ("last active") — needs event logging that doesn't exist
- Billing/payments integration
- Admin-facing notification *producers* (pipe is mounted; events come with future features)

## 8. Decisions needed before coding

### 8.1 Pending Onboarding
- **(Recommended) Reframe to real data**: "Needs attention" = invited-not-started
  students + unassigned tutors, with resend-invite/assign actions. Zero schema
  changes, honest UI, ships this revamp.
- **Build approval workflow**: new `pending_enrollments` table, apply/approve/
  reject endpoints, public request-to-join form. Real feature work — only worth
  it if institutes actually receive unsolicited join requests.

### 8.2 Reports & Billings pages
- **(Recommended) Reports**: rebuild on the REAL owner analytics endpoints
  (already mounted for admin) — cohort progress, batch comparison, heatmap.
  Effectively a themed reuse of the owner Performance page.
- **Billings**: keep as static pricing page (it's marketing, not a lie) or hide
  from nav until billing exists.
