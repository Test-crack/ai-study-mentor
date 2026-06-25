# TestCrack B2B Flow — Frontend Reference

> Last updated: June 2026
> Stack: React 18 + TypeScript + Vite + shadcn/ui + Tailwind CSS + TanStack Query

---

## Role Hierarchy

```
Super Admin
  └── Institute Owner
        └── Institute Admin
              ├── Instructor / Tutor
              └── Student
```

Each role maps to a dedicated portal with its own routes, sidebar, and dashboards.

---

## Routing Structure (`src/core/App.tsx`)

| Prefix | Portal | Route Guard |
|--------|--------|-------------|
| `/superadmin/*` | TestCrack Super Admin | `RoleProtectedRoute` (SUPERADMIN) |
| `/institute-owner/*` | Institute Owner | `RoleProtectedRoute` (INSTITUTE_OWNER) + `RequireActiveInstitute` |
| `/institute-admin/*` | Institute Admin | `RoleProtectedRoute` (INSTITUTE_ADMIN) + `RequireActiveInstitute` |
| `/b2c/*` | B2C Student | `B2CProtectedRoute` (sessionStorage-based) |

`RequireActiveInstitute` (`src/features/auth/components/RequireActiveInstitute.tsx`) blocks all B2B routes and shows a deactivation overlay if the institute is toggled off by a super admin.

---

## Super Admin Portal

**Base route:** `/superadmin/*`

### Layout
| File | Purpose |
|------|---------|
| `src/features/TestCrackSuperAdmin/Components/SuperadminSidebar.tsx` | Left nav sidebar |
| `src/features/TestCrackSuperAdmin/Components/Superadmintopbar.tsx` | Top bar with theme toggle |

### Dashboard Pages
| File | Route | What it does |
|------|-------|-------------|
| `SuperAdminDashboard.tsx` | `/superadmin/dashboard` | Platform-wide KPIs and metrics |
| `SuperAdminInstitutes.tsx` | `/superadmin/institutes` | Create institutes (name + owner email), list all, toggle active/inactive, edit details (name, address, logo) |
| `Subscription.tsx` | `/superadmin/subscriptions` | View all institute subscriptions — plan type, MRR, trial status, renewal dates |
| `PricingConfig.tsx` | `/superadmin/pricing` | Configure plan tiers (Per Student / Pro / Enterprise) + revenue simulator |
| `AllUsers.tsx` | `/superadmin/users` | Full user directory — filter by role, search, paginate |
| `SupportTicket.tsx` | `/superadmin/support` | Support ticket management |
| `PlatformAnalytics.tsx` | `/superadmin/analytics` | Platform-wide analytics |
| `Questionbankmanager.tsx` | `/superadmin/question-bank` | Question bank content management |

All files live in: `src/features/TestCrackSuperAdmin/dashboard/`

### Service Layer
`src/features/TestCrackSuperAdmin/services/superadminService.ts`

| Function | Description |
|----------|-------------|
| `fetchInstitutes()` | Get all institutes with owner info and student/instructor counts |
| `createInstitute(payload)` | POST new institute — triggers Supabase owner invite on backend |
| `toggleInstituteStatus(id)` | PATCH active/inactive |
| `updateInstitute(id, payload)` | PATCH name / address / logo |
| `fetchAllUsers(filters)` | GET users with role filter, search, pagination |

---

## Institute Owner Portal

**Base route:** `/institute-owner/*`

### Layout
| File | Purpose |
|------|---------|
| `src/features/InstituteOwner/components/InstitiuteOwnerSidebar.tsx` | Left nav sidebar |
| `src/features/InstituteOwner/components/InstituteOwnerTopbar.tsx` | Top bar |

### Dashboard Pages
| File | Route | What it does |
|------|-------|-------------|
| `InstituteOwnerDashboard.tsx` | `/institute-owner/dashboard` | KPIs: total students, active today, at-risk count; batch summary cards; at-risk alerts |
| `InstituteStudentsPage.tsx` | `/institute-owner/students` | All students with band scores, enrollment status, progress tracking |
| `InstituteInstructorsPage.tsx` | `/institute-owner/instructors` | Instructors list with effectiveness metrics and batch assignments |
| `InstituteAdmins.tsx` | `/institute-owner/admins` | Add/remove institute admin accounts; invite via email |
| `InstituteBatchDetailPage.tsx` | `/institute-owner/batches/:id` | Batch analytics: student performance, at-risk indicators, band distributions |
| `InstituteOwnerStudentProgressPage.tsx` | `/institute-owner/students/:id` | Full individual student progress — competency, IA/Mock/Drill history |
| `BatchInsight.tsx` | `/institute-owner/batch-insight` | Batch-level insights |
| `BatchAnalyticsView.tsx` | `/institute-owner/batch-analytics` | Detailed batch analytics visualisation |
| `Performance.tsx` | `/institute-owner/performance` | Overall platform performance metrics |
| `TutorEffective.tsx` | `/institute-owner/tutor-effectiveness` | Tutor effectiveness analysis |
| `RoiAnalytics.tsx` | `/institute-owner/roi` | ROI analytics *(coming soon)* |
| `StrategicReport.tsx` | `/institute-owner/strategic-report` | Strategic reports *(coming soon)* |
| `AiCalibration.tsx` | `/institute-owner/ai-calibration` | AI calibration reports *(coming soon)* |
| `ComingSoonPages.tsx` | — | Shared placeholder for upcoming pages |

All files live in: `src/features/InstituteOwner/dashboard/`

### Service Layer
`src/features/InstituteOwner/services/instituteOwnerService.ts`

| Function | Description |
|----------|-------------|
| `fetchSummary()` | Dashboard KPIs |
| `fetchBatches()` | All institute batches |
| `fetchStudents()` | All institute students |
| `fetchAtRisk()` | At-risk students with flags |
| `fetchInstructors()` | All institute instructors |
| `fetchAdmins()` | All institute admins |
| `addAdmin(payload)` | Invite new admin |
| `removeAdmin(userId)` | Remove admin |
| `fetchBatchDashboard(batchId)` | Batch-level engagement + at-risk summary |
| `fetchStudentFullProgress(studentId)` | Individual student deep-dive |
| `fetchAssessmentOverview()` | IA/Mock/Diagnostic table |
| Phase 2 analytics: | `fetchCohortProgress()`, `fetchBatchComparison()`, `fetchInstructorEffectiveness()`, `fetchEngagementTrends()`, `fetchGoalAchievement()`, `fetchSubskillHeatmap()` |

---

## Institute Admin Portal

**Base route:** `/institute-admin/*`

### Layout
| File | Purpose |
|------|---------|
| `src/features/Institute/components/InstituteSidebar.tsx` | Left nav: Dashboard, Batches, Tutors, Students, Billings, Reports, Settings |
| `src/features/Institute/components/InstituteTopbar.tsx` | Top bar with mobile hamburger menu |

### Dashboard Pages
| File | Route | What it does |
|------|-------|-------------|
| `InstituteDashboard.tsx` | `/institute-admin/dashboard` | Summary cards: student count, batch count, onboarding requests, active tutors |
| `InstituteBatches.tsx` | `/institute-admin/batches` | Batch list — create and edit batches; view performance metrics |
| `BatchAllocation.tsx` | `/institute-admin/batches/:id/allocate` | Student-batch assignment UI |
| `InstituteTutor.tsx` | `/institute-admin/tutors` | Tutor list with search and filtering |
| `InstituteStudents.tsx` | `/institute-admin/students` | Student list; filter by batch |
| `StudentOnboarding.tsx` | `/institute-admin/students/onboard` | Invite students by email, toggle active/inactive, remove |
| `TutorOnboarding.tsx` | `/institute-admin/tutors/onboard` | Invite tutors by email with specialisation, remove |
| `InstituteBillings.tsx` | `/institute-admin/billing` | Plan tiers display (Per Student vs Pro) with features, pricing, and FAQs |
| `InstituteReports.tsx` | `/institute-admin/reports` | Analytics and reports |
| `InstituteSetting.tsx` | `/institute-admin/settings` | Institute profile, branding, notifications, domain configuration |

All files live in: `src/features/Institute/dashboard/`

### Service Layer

**`src/features/Institute/services/instituteAdminService.ts`**

| Function | Description |
|----------|-------------|
| `fetchStudents()` | GET students for the institute |
| `addStudent(payload)` | POST — invite student via email |
| `removeStudent(userId)` | DELETE student enrollment |
| `updateStudentStatus(userId, status)` | PATCH active/inactive |
| `fetchTutors()` | GET instructors for the institute |
| `addTutor(payload)` | POST — invite tutor via email |
| `removeTutor(userId)` | DELETE tutor from institute |

**`src/features/Institute/services/batchService.ts`**

| Function | Description |
|----------|-------------|
| `fetchBatches()` | GET all batches |
| `fetchBatchDetail(batchId)` | GET batch with all members |
| `createBatch(payload)` | POST new batch |
| `updateBatch(batchId, payload)` | PATCH batch name / description / status / capacity |
| `deleteBatch(batchId)` | DELETE batch |
| `addInstructor(batchId, userId)` | POST instructor to batch |
| `removeInstructor(batchId, userId)` | DELETE instructor from batch |
| `addStudent(batchId, userId)` | POST student to batch (capacity enforced on backend) |
| `removeStudent(batchId, userId)` | DELETE student from batch |

---

## Auth & Route Guards

| File | Type | Logic |
|------|------|-------|
| `src/features/auth/components/RequireActiveInstitute.tsx` | HOC / wrapper | Reads `instituteIsActive` from user profile; shows deactivation overlay if false |
| `src/features/auth/types/index.ts` | Types | `UserProfile` with `role: UserRole` and `instituteIsActive: boolean` |
| `src/core/App.tsx` | Router | `RoleProtectedRoute` wraps B2B portals; `B2CProtectedRoute` (sessionStorage) wraps B2C |

**`UserRole` enum:**
```ts
STUDENT | INSTRUCTOR | ADMIN | SUPERADMIN | INSTITUTE_OWNER | INSTITUTE_ADMIN
```

---

## B2C Features (Separate Product)

**Base route:** `/b2c/*`

| File | Purpose |
|------|---------|
| `src/features/B-C/pages/B2cloginpage.tsx` | Email-only magic-link login; no institute affiliation |
| `src/features/B-C/pages/B2cstudentdashboard.tsx` | Personal dashboard with leaderboard and game progress |
| `src/features/B-C/components/B2csidebar.tsx` | B2C sidebar |
| `src/features/B-C/components/B2ctopbar.tsx` | B2C top bar |
| `src/features/B-C/components/B2cgameshell.tsx` | Game wrapper/shell |
| `src/features/B-C/components/B2CVideoLibrary.tsx` | Video library |

**Games:**
| File | Game |
|------|------|
| `src/features/B-C/games/Bandladdergame.tsx` | Band Ladder |
| `src/features/B-C/games/Connectorchaingame.tsx` | Connector Chain |
| `src/features/B-C/games/Inferencesprintgame.tsx` | Inference Sprint |
| `src/features/B-C/games/Lexigridgame.tsx` | LexiGrid |
| `src/features/B-C/games/Sentencesurgerygame.tsx` | Sentence Surgery |
| `src/features/B-C/games/Trapspottergame.tsx` | Trap Spotter |

---

## Subscription / Pricing Tiers (UI Only)

Displayed in `InstituteBillings.tsx` (admin view) and `PricingConfig.tsx` (super admin config):

| Plan | Price | Target |
|------|-------|--------|
| Per Student | ₹2,500 / student / month | Small institutes |
| Institute Pro | ₹50,000 base + ₹500 / student / month | Mid-size institutes |
| Enterprise | Custom | Large organisations |

> No billing enforcement exists in the backend yet — access is unlimited regardless of plan.

---

## Shared UI & State

- **Component library:** `src/shared/components/ui/` — all shadcn/ui primitives (Button, Card, Dialog, Table, Tabs, etc.)
- **Subscription hook:** `src/shared/hooks/useSubscription.ts` — checks active plan, credits, cancel/resume (used in B2C; B2B billing is institutional)
- **Payment modal:** `src/features/payment/components/PremiumModal.tsx` — B2C upgrade prompt
- **Supabase client:** `src/integrations/supabase/client.ts`

---

## B2B vs B2C — Quick Comparison

| | B2B | B2C |
|---|---|---|
| Login | Institute invite (magic-link email) | Self-signup magic-link |
| Route guard | `RequireActiveInstitute` | `B2CProtectedRoute` (sessionStorage) |
| Student grouping | Batches (classroom model) | Individual, no grouping |
| Progress visibility | Admin / Owner / Instructor can view all | Personal only |
| Games | Not in B2B portals | 6 games available |
| Payment | Institution billing (UI only) | Razorpay per course |

---

## Dev Tips

- Each portal (super admin / owner / admin) is fully self-contained under its own `src/features/` folder — changes to one portal don't affect others.
- `RequireActiveInstitute` wraps all B2B routes at the router level — if an institute is deactivated by super admin, every user in that institute sees a block screen immediately.
- B2C auth uses `sessionStorage`, not Supabase session — keep this in mind when debugging login state for B2C users.
- The `InstituteBillings.tsx` page is display-only; no API calls are wired for plan changes from the admin side.
- "Coming soon" pages (`RoiAnalytics`, `StrategicReport`, `AiCalibration`) all render `ComingSoonPages.tsx` — they are placeholders with no logic yet.
