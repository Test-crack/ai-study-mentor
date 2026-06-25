# TestCrack B2B Flow — Complete Reference

> Last updated: June 2026
> Branch: `b2c-branch` | Platform: React + TypeScript (frontend), Node.js + Prisma (backend), Supabase (auth + DB)

---

## Overview

TestCrack operates two parallel product lines:

| Mode | Who | Auth | Access |
|------|-----|------|--------|
| **B2B** | Institutions (coaching centres, schools) | Email invite via Supabase magic-link | Role-gated dashboards |
| **B2C** | Individual students | Email magic-link, no institution affiliation | Personal dashboard + games |

This document covers the **B2B flow** end-to-end — from super admin creating an institute through to students drilling inside a batch.

---

## Role Hierarchy

```
Super Admin (TestCrack platform staff)
  └── Institute Owner (institution principal / director)
        └── Institute Admin (operations staff)
              ├── Instructor / Tutor
              └── Student
```

Roles are stored as a `UserRole` enum on the `users` table:

```
STUDENT | INSTRUCTOR | ADMIN | SUPERADMIN | INSTITUTE_OWNER | INSTITUTE_ADMIN
```

---

## Onboarding Flow (Step by Step)

### Step 1 — Super Admin Creates an Institute

**Frontend:** `src/features/TestCrackSuperAdmin/dashboard/SuperAdminInstitutes.tsx`
**Backend route:** `POST /api/superadmin/institutes`
**Controller:** `src/controllers/superadminController.ts` → `createInstitute()`

What happens:
1. Super admin fills in institute name, address, logo, and owner email.
2. Backend calls `supabaseAdmin.auth.admin.inviteUserByEmail()` → owner receives a magic-link email.
3. A `User` record is created/updated in DB (or marked pending if Supabase invite fails).
4. An `institutes` record is created and an `institute_owners` relationship is linked.

---

### Step 2 — Institute Owner Adds Admins

**Frontend:** `src/features/InstituteOwner/dashboard/InstituteAdmins.tsx`
**Backend route:** `POST /api/institute-owner/admins`
**Controller:** `src/controllers/instituteOwnerController.ts` → `addAdmin()`

- Owner-only action.
- Same Supabase invite flow → creates `institute_admins` relationship.

---

### Step 3 — Institute Admin Onboards Students & Tutors

**Frontend (students):** `src/features/Institute/dashboard/StudentOnboarding.tsx`
**Frontend (tutors):** `src/features/Institute/dashboard/TutorOnboarding.tsx`

**Student route:** `POST /api/institute-admin/students`
**Tutor route:** `POST /api/institute-admin/tutors`
**Controller:** `src/controllers/instituteAdminController.ts`

- Invite is sent via Supabase; `institute_students` / `institute_instructors` records are created.
- A student **cannot** be enrolled in more than one institute (unique constraint on `user_id` in `institute_students`).
- Instructors **can** belong to multiple institutes.
- Removing a tutor downgrades their role back to `STUDENT`.

---

### Step 4 — Admin Creates Batches and Assigns Members

**Frontend:** `src/features/Institute/dashboard/InstituteBatches.tsx`, `BatchAllocation.tsx`
**Routes:** `POST /api/institute-admin/batches`, batch member routes
**Controller:** `src/controllers/batchController.ts`

Batch lifecycle:
- Create batch with name, description, optional `max_students` capacity.
- Assign instructors: `POST /api/institute-admin/batches/:id/instructors`
- Enroll students: `POST /api/institute-admin/batches/:id/students` (capacity check enforced)
- Update/delete batch as needed.

---

## Frontend — File Map

### Super Admin Portal (`/superadmin/*`)
| File | Purpose |
|------|---------|
| `src/features/TestCrackSuperAdmin/Components/SuperadminSidebar.tsx` | Navigation sidebar |
| `src/features/TestCrackSuperAdmin/Components/Superadmintopbar.tsx` | Top bar with theme toggle |
| `src/features/TestCrackSuperAdmin/dashboard/SuperAdminDashboard.tsx` | Platform-wide KPIs |
| `src/features/TestCrackSuperAdmin/dashboard/SuperAdminInstitutes.tsx` | Create, edit, activate/deactivate institutes |
| `src/features/TestCrackSuperAdmin/dashboard/Subscription.tsx` | View all institute subscriptions, MRR, renewal dates |
| `src/features/TestCrackSuperAdmin/dashboard/PricingConfig.tsx` | Configure plan tiers + revenue simulator |
| `src/features/TestCrackSuperAdmin/dashboard/AllUsers.tsx` | User directory with role filter and pagination |
| `src/features/TestCrackSuperAdmin/dashboard/SupportTicket.tsx` | Support ticket management |
| `src/features/TestCrackSuperAdmin/dashboard/PlatformAnalytics.tsx` | Platform-wide analytics |
| `src/features/TestCrackSuperAdmin/dashboard/Questionbankmanager.tsx` | Question bank content management |
| `src/features/TestCrackSuperAdmin/services/superadminService.ts` | API service layer for all super admin calls |

### Institute Owner Portal (`/institute-owner/*`)
| File | Purpose |
|------|---------|
| `src/features/InstituteOwner/components/InstitiuteOwnerSidebar.tsx` | Navigation sidebar |
| `src/features/InstituteOwner/components/InstituteOwnerTopbar.tsx` | Top bar |
| `src/features/InstituteOwner/dashboard/InstituteOwnerDashboard.tsx` | KPIs: total students, active today, at-risk count, batch cards |
| `src/features/InstituteOwner/dashboard/InstituteStudentsPage.tsx` | All students with band scores and progress |
| `src/features/InstituteOwner/dashboard/InstituteInstructorsPage.tsx` | Instructors with effectiveness metrics |
| `src/features/InstituteOwner/dashboard/InstituteAdmins.tsx` | Add/remove institute admin accounts |
| `src/features/InstituteOwner/dashboard/InstituteBatchDetailPage.tsx` | Batch analytics: performance, at-risk, band distribution |
| `src/features/InstituteOwner/dashboard/InstituteOwnerStudentProgressPage.tsx` | Individual student progress drill-down |
| `src/features/InstituteOwner/dashboard/BatchInsight.tsx` | Batch insights |
| `src/features/InstituteOwner/dashboard/BatchAnalyticsView.tsx` | Detailed batch analytics visualisation |
| `src/features/InstituteOwner/dashboard/Performance.tsx` | Overall platform performance |
| `src/features/InstituteOwner/dashboard/TutorEffective.tsx` | Tutor effectiveness analysis |
| `src/features/InstituteOwner/dashboard/RoiAnalytics.tsx` | ROI analytics (coming soon) |
| `src/features/InstituteOwner/dashboard/StrategicReport.tsx` | Strategic reports (coming soon) |
| `src/features/InstituteOwner/dashboard/AiCalibration.tsx` | AI calibration reports (coming soon) |
| `src/features/InstituteOwner/services/instituteOwnerService.ts` | API service layer for all owner calls + Phase 2 analytics |

### Institute Admin Portal (`/institute-admin/*`)
| File | Purpose |
|------|---------|
| `src/features/Institute/components/InstituteSidebar.tsx` | Navigation: dashboard, batches, tutors, students, billings, reports, settings |
| `src/features/Institute/components/InstituteTopbar.tsx` | Top bar with mobile menu |
| `src/features/Institute/dashboard/InstituteDashboard.tsx` | Summary: student count, batch count, onboarding requests, active tutors |
| `src/features/Institute/dashboard/InstituteBatches.tsx` | Batch list, create/edit batches |
| `src/features/Institute/dashboard/BatchAllocation.tsx` | Student-batch assignment UI |
| `src/features/Institute/dashboard/InstituteTutor.tsx` | Tutor list with search/filter |
| `src/features/Institute/dashboard/InstituteStudents.tsx` | Student list filtered by batch |
| `src/features/Institute/dashboard/InstituteBillings.tsx` | Plan tiers display (Per Student vs Pro) with pricing/FAQs |
| `src/features/Institute/dashboard/InstituteReports.tsx` | Analytics and reports |
| `src/features/Institute/dashboard/InstituteSetting.tsx` | Institute profile, branding, notifications, domain config |
| `src/features/Institute/dashboard/StudentOnboarding.tsx` | Invite students by email, manage active/inactive, remove |
| `src/features/Institute/dashboard/TutorOnboarding.tsx` | Invite tutors by email with specialisation, remove |
| `src/features/Institute/services/instituteAdminService.ts` | Student/tutor CRUD API calls |
| `src/features/Institute/services/batchService.ts` | Batch CRUD + member management API calls |

### Auth & Routing
| File | Purpose |
|------|---------|
| `src/core/App.tsx` | All routes: B2B under `/institute-admin/*`, `/institute-owner/*`, `/superadmin/*`; B2C under `/b2c/*` |
| `src/features/auth/components/RequireActiveInstitute.tsx` | Route guard — blocks access if institute is deactivated |
| `src/features/auth/types/index.ts` | `UserProfile` type with all roles + `instituteIsActive` flag |

---

## Backend — File Map

### Routes
| File | Mounted At | Coverage |
|------|-----------|---------|
| `src/routes/superadminRoutes.ts` | `/api/superadmin` | Institute CRUD, user directory |
| `src/routes/instituteOwnerRoutes.ts` | `/api/institute-owner` | Admin management, dashboard, analytics |
| `src/routes/instituteAdminRoutes.ts` | `/api/institute-admin` | Student/tutor/batch operations |
| `src/routes/instructorRoutes.ts` | `/api/instructor` | Instructor batch view and student progress |
| `src/routes/studentRoutes.ts` | `/api/student` | Student batch enrolment view |

### Controllers
| File | Responsibility |
|------|--------------|
| `src/controllers/superadminController.ts` | Institute lifecycle, global user listing, status toggle |
| `src/controllers/instituteOwnerController.ts` | Admin invite/remove, dashboard summary, at-risk computation, analytics |
| `src/controllers/instituteAdminController.ts` | Student & tutor invite/remove, status toggle, institute context resolution |
| `src/controllers/batchController.ts` | Batch CRUD, capacity enforcement, instructor/student assignment |
| `src/controllers/userProfileController.ts` | Role-aware profile data, institute activity reflection |

### Middleware
| File | Function |
|------|---------|
| `src/middleware/auth.ts` | Validate Supabase JWT, extract user identity |
| `src/middleware/ensureUser.ts` | Create/update `User` DB record on first login; account-link by email |
| `src/middleware/rbac.ts` | Role-based access check — `authorize(role1, role2, ...)` |

### Shared Query Libraries
| File | What it computes |
|------|-----------------|
| `src/lib/batchDashboardQueries.ts` | `computeBatchDashboard()` — engagement today, at-risk list, band overview per student, 7-day IA / monthly mock period summary |
| `src/lib/studentProgressQueries.ts` | `computeStudentFullProgress()` — competency matrix, IA/Mock/Drill history, LexiGrid calendar, eligibility, band trends, momentum |
| `src/lib/timezone.ts` | IST offset helpers — `toISTDateString()`, `todayISTString()`, `daysBeforeIST()` |
| `src/lib/streak.ts` | Daily streak computation |
| `src/lib/iaProcessor.ts` | IA session scoring and grading |
| `src/lib/iaMissDetector.ts` | Missed IA detection for at-risk flags |

### Prisma Schema — Key B2B Models
```
institutes               — institute name, address, logo, active flag
institute_owners         — links User → institute (one owner per institute)
institute_admins         — links User → institute (many admins per institute)
institute_students       — links User → institute (unique: one institute per student)
institute_instructors    — links User → institute (multi-institute allowed)
ielts_batches            — batch name, description, max_students, institute FK
ielts_batch_students     — many-to-many: batch ↔ student
ielts_batch_instructors  — many-to-many: batch ↔ instructor
```

---

## Key API Endpoints Reference

### Super Admin
| Method | Path | Action |
|--------|------|--------|
| GET | `/api/superadmin/institutes` | List all institutes with owner info and counts |
| POST | `/api/superadmin/institutes` | Create institute + invite owner |
| PATCH | `/api/superadmin/institutes/:id` | Update name / address / logo |
| PATCH | `/api/superadmin/institutes/:id/status` | Toggle active/inactive |
| GET | `/api/superadmin/users` | All users; filter by role, search, paginate |

### Institute Owner
| Method | Path | Action |
|--------|------|--------|
| GET | `/api/institute-owner/summary` | Dashboard KPIs |
| GET | `/api/institute-owner/batches` | List batches |
| GET | `/api/institute-owner/batches/:id/dashboard-summary` | Batch-level engagement + at-risk |
| GET | `/api/institute-owner/students` | All students |
| GET | `/api/institute-owner/students/:id/full-progress` | Individual student deep-dive |
| GET | `/api/institute-owner/at-risk` | At-risk student list with flags |
| GET | `/api/institute-owner/instructors` | Instructor list |
| GET | `/api/institute-owner/admins` | Admin list |
| POST | `/api/institute-owner/admins` | Invite new admin |
| DELETE | `/api/institute-owner/admins/:userId` | Remove admin |
| GET | `/api/institute-owner/assessment-overview` | IA/Mock/Diagnostic table |
| GET | `/api/institute-owner/analytics/*` | Phase 2 analytics (cohort, batch comparison, engagement, etc.) |

### Institute Admin
| Method | Path | Action |
|--------|------|--------|
| GET | `/api/institute-admin/students` | Student list with search |
| POST | `/api/institute-admin/students` | Invite student |
| DELETE | `/api/institute-admin/students/:userId` | Remove student |
| PATCH | `/api/institute-admin/students/:userId/status` | Toggle student active/inactive |
| GET | `/api/institute-admin/tutors` | Tutor list |
| POST | `/api/institute-admin/tutors` | Invite tutor |
| DELETE | `/api/institute-admin/tutors/:userId` | Remove tutor |
| GET | `/api/institute-admin/batches` | Batch list |
| POST | `/api/institute-admin/batches` | Create batch |
| GET | `/api/institute-admin/batches/:id` | Batch detail |
| PATCH | `/api/institute-admin/batches/:id` | Update batch |
| DELETE | `/api/institute-admin/batches/:id` | Delete batch |
| POST | `/api/institute-admin/batches/:id/instructors` | Add instructor to batch |
| DELETE | `/api/institute-admin/batches/:id/instructors/:userId` | Remove instructor |
| POST | `/api/institute-admin/batches/:id/students` | Enroll student in batch |
| DELETE | `/api/institute-admin/batches/:id/students/:userId` | Remove student from batch |

---

## Subscription / Pricing (UI Only — No DB Model Yet)

The billing UI exists in `InstituteBillings.tsx` and `PricingConfig.tsx` with these tiers:

| Plan | Pricing | Target |
|------|---------|--------|
| Per Student | ₹2,500 / student / month | Small institutes |
| Institute Pro | ₹50,000 base + ₹500/student/month | Mid-size institutes |
| Enterprise | Custom | Large orgs |

> **Note:** As of the current codebase, there is no subscription table or billing enforcement in the backend. The `CourseOrder` table (Razorpay) only handles individual B2C course purchases. B2B access is unlimited — no seat limits or plan-gating are enforced at the API level.

---

## At-Risk Student Logic

Computed in `src/lib/batchDashboardQueries.ts` and `instituteOwnerController.ts → computeAtRiskFlags()`.

A student is flagged at-risk if **any** of these conditions apply:

| Flag | Condition |
|------|-----------|
| `not_diagnosed` | Diagnostic assessment not completed |
| `no_activity` | No platform activity in the last N days |
| `missed_ia` | Missed a scheduled IA session |
| `band_decline` | Band score trending downward across last 2 IAs |

---

## B2B vs B2C — Key Differences

| | B2B | B2C |
|---|---|---|
| **Auth** | Supabase invite email | Self-signup magic-link |
| **Login page** | Institution login | `src/features/B-C/pages/B2cloginpage.tsx` |
| **Dashboard** | Role-based portal (admin/owner/superadmin) | `src/features/B-C/pages/B2cstudentdashboard.tsx` |
| **Student grouping** | Batches (classroom model) | Individual, no grouping |
| **Games** | Not in B2B dashboards | 6 games: BandLadder, ConnectorChain, InferenceSprint, LexiGrid, SentenceSurgery, TrapSpotter |
| **Payment** | Institution-level billing (UI only) | Razorpay via `CourseOrder` |
| **Route guard** | `RequireActiveInstitute` wraps all B2B routes | `B2CProtectedRoute` uses sessionStorage |
| **Progress tracking** | Shared across admin/owner/instructor | Personal only |

---

## Environment & Infrastructure

```
Frontend dev server:   http://localhost:8080
Backend API:           http://localhost:4000
Supabase local API:    http://localhost:54321
Supabase Studio:       http://localhost:54323
Supabase DB:           localhost:54322
```

CORS origins allowed by backend: `localhost:8080`, `testcrack.com`, VPS frontend IP.

Body size limit: **50 MB** (supports base64 audio for speaking/mock submissions).

---

## Quick Dev Tips

- To test a specific B2B role, log in with an account that has that role assigned in Supabase and the DB.
- `RequireActiveInstitute` will block the entire dashboard if `institute_is_active = false` — toggle via super admin.
- IST timezone is critical for streak, IA scheduling, and engagement metrics — all time helpers live in `src/lib/timezone.ts`.
- Removing an instructor resets their role to `STUDENT` — intentional, accounts have a single primary role.
- Batch capacity (`max_students`) is enforced only on student enrollment; no cap on instructors per batch.
