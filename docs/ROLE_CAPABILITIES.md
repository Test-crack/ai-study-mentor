# Platform Roles & Capabilities

**What each type of user can actually do on the platform**
**By:** Gokul (Frontend Engineering) · 19 Aug 2026
**Source:** the live codebase — role guards in `core/App.tsx`, plus each role's own sidebar and pages. This is what the product does today, not what's planned.

---

## The six user types

| Role | Who they are | Where they land |
|---|---|---|
| **Student** | A learner enrolled at an institute | `/student/dashboard` |
| **Instructor / Tutor** | Teaches one or more batches | `/instructor/dashboard` |
| **Institute Admin** | Runs day-to-day operations for one institute | `/institute-admin/dashboard` |
| **Institute Owner** | Owns the institute; sits above the admin | `/institute-owner/dashboard` |
| **Super Admin** | TestCrack's own team, across all institutes | `/superadmin/dashboard` |
| **B2C User** | Direct consumer, games only — separate from the institute system | `/b2c/dashboard` |

Every page is locked to its role. A student who types an instructor URL is redirected; the check happens on every route.

---

# 1. STUDENT

The most feature-rich role. A student's entire journey lives here.

### What they see and do

| Section | What it does |
|---|---|
| **Dashboard** | Their current band, target band, momentum score, daily streak, per-skill bands, and today's recommended action |
| **Daily Challenge (LexiGrid)** | A daily vocabulary game that must be played to unlock the rest of the day's work |
| **Mid-Week Assessment** | A formal assessment every third day, AI-scored |
| **Full Mock Test** | A complete simulated exam, once a month |
| **History** | Every assessment ever taken — scores, misses, mock results, diagnostic report |
| **My Roadmap** | Their diagnostic results turned into a skill-by-skill improvement plan |
| **Recommendations** | What to practise next, chosen from their weakest sub-skills |
| **Report** | Their overall performance report |
| **My Courses** | Enrolled course content and lessons |
| **Settings / Profile** | Target band, exam date, personal details |
| **How It Works** | In-product explanation of the scoring and drill system |

### Practice modules

Listening · Reading · Writing · Speaking · Speed Reading — each with its own practice area, AI evaluation and history.

### Rules the platform enforces on students

These are real gates in the code, not guidelines:

1. **Diagnostic first.** Until the one-time diagnostic is complete, the roadmap and most sections stay locked (`StudentDiagnosisGuard`).
2. **Daily drills unlock the dashboard.** Practice sections stay locked until the day's required drills are done (`StudentDrillLockGuard` checks this on every visit).
3. **Drill quality gate.** A student must hit a minimum daily competency score to qualify for their next assessment — practising badly doesn't count as practising.
4. **Limited daily sessions**, with the option to buy an extra session using momentum points.
5. **Must belong to an active institute.** If their institute is deactivated they're routed to a "not enrolled" page.

**In short:** a student can practise, be assessed, and track progress — but cannot skip the diagnostic, cannot practise unlimited amounts, and cannot reach an assessment without earning it.

---

# 2. INSTRUCTOR / TUTOR

Works with the students in their assigned batches. Cannot see other tutors' batches.

### What they see and do

| Section | What it does |
|---|---|
| **Dashboard** | Batch overview, engagement pulse, students needing attention |
| **Batch Management** | Their batches and every student inside them |
| **Student Assessments** | Review and monitor assessment activity across their students |
| **Reports** | Generate student and batch reports |
| **Workflow** | Their teaching workflow view |
| **Alignment / Tech Prep** | Supporting teaching tools |
| **Course Management** | Manage course content for their students |

### Individual student progress view — 5 tabs

Their most powerful screen. For any student in their batch:

1. **Overview** — current band, target, momentum, streak, competency radar, and **diagnostic baseline vs current band per skill** (the growth view)
2. **Assessments** — every mid-week assessment, scores and misses
3. **Mock Tests** — full mock history and section breakdowns
4. **Drills** — daily practice activity, drill quality scores, streak calendar, which sub-skills were practised
5. **Diagnostic** — the original diagnostic result and its sub-scores

**What they cannot do:** create or delete students, change billing, or touch another tutor's batch.

---

# 3. INSTITUTE ADMIN

Runs the institute day to day. This is the operational role.

### What they see and do

| Section | What it does |
|---|---|
| **Dashboard** | Institute-wide activity summary |
| **Batch Allocation** | Create batches and assign students and tutors to them |
| **Tutor Accounts** | Manage existing tutor accounts |
| **Tutor Onboarding** | Add new tutors to the institute |
| **Students** | Full student list, with access to any student's progress view |
| **Student Onboarding** | Enrol new students |
| **Reports** | Institute-level reporting |
| **Billings & Plans** | The institute's subscription and billing |
| **Institute Settings** | Institute configuration |

**Key powers:** creating accounts (students and tutors), allocating batches, and seeing billing. They can open the same detailed student progress view instructors use — for **any** student in the institute, not just one batch.

---

# 4. INSTITUTE OWNER

Sits above the admin. Everything the admin can do, **plus** ownership-level analytics and control over admins.

### What they see and do

| Section | What it does | Status |
|---|---|---|
| **Overview** | Institute-wide performance dashboard | Live |
| **Batches** | Batch insight and comparison across the institute | Live |
| **Students** | Every student, with full progress access | Live |
| **Instructors** | Every instructor, including tutor effectiveness | Live |
| **Analytics** | Performance analytics across batches and tutors | Live |
| **Manage Admins** | Create and manage institute admin accounts | Live |
| **Batch Analytics** | Deep per-batch analytics and detail pages | Live |
| **Financial (ROI)** | Return-on-investment analytics | **Coming soon — placeholder page** |
| **Marketing (Strategic Report)** | Strategic reporting | **Coming soon — placeholder page** |
| **Career Launch (AI Calibration)** | AI calibration view | **Coming soon — placeholder page** |

> **Worth knowing:** the owner also has access to **every Institute Admin page** — batches, tutors, students, onboarding, billings and settings all accept the owner role too. So the owner is a strict superset of the admin, not a parallel role.

**Unique to the owner:** creating admin accounts, and tutor-effectiveness comparison. Three of their nine menu items are currently placeholder pages.

---

# 5. SUPER ADMIN (TestCrack team)

Operates across **all** institutes. This is our internal control panel.

### What they see and do

| Section | What it does |
|---|---|
| **Dashboard** | Platform-wide summary across every institute |
| **Institutes** | Every institute on the platform — create, view, manage |
| **All Users** | Every user of every role, platform-wide |
| **Subscription** | Institute subscriptions and plan states |
| **Pricing Config** | Configure the platform's pricing |
| **Question Bank** | Upload and assign question banks to institutes, batches, skills and modules — with validation before upload |
| **Support Tickets** | Handle support requests from institutes |
| **Platform Analytics** | Usage and performance across the whole platform |

**Key powers no one else has:** creating institutes, setting pricing, uploading question banks, and seeing every user on the platform.

---

# 6. B2C USER (separate track)

A consumer-facing area, deliberately separate from the institute system — its own login and its own guard.

| Section | What it does |
|---|---|
| **Dashboard** | Personal progress across games |
| **Leaderboard** | Ranking against other B2C users |
| **6 Games** | LexiGrid, Trap Spotter, Band Ladder, Sentence Surgery, Inference Sprint, Connector Chain |

**No assessments, no institute, no tutor.** Games and leaderboard only.

---

# How the roles stack up

```
SUPER ADMIN          all institutes · pricing · question banks · every user
      │
INSTITUTE OWNER      one institute, everything in it + manages admins
      │              (has every Institute Admin power as well)
INSTITUTE ADMIN      one institute · creates students & tutors · batches · billing
      │
INSTRUCTOR           only their own batches · view & report, cannot create accounts
      │
STUDENT              only themselves · practise, be assessed, track progress

B2C USER             separate track · games and leaderboard only
```

**The pattern:** each level up widens the scope (self → batch → institute → platform) and adds creation rights. Students act on themselves, instructors observe their batch, admins create and organise, owners oversee and appoint, super admins control the platform.

---

# Two things a reader should know

**1. Detailed student progress is shared, not duplicated.** Instructors, institute admins and institute owners all open the *same* five-tab student progress view. The difference is which students they can reach — one batch, the whole institute, or the whole institute plus admin control. One component, three roles, so a change benefits all three at once.

**2. Three Institute Owner pages are placeholders.** Financial/ROI, Marketing/Strategic Report and Career Launch/AI Calibration currently render "coming soon" pages. They appear in the menu, so a demo to an owner will show them — worth knowing before showing that dashboard to a prospect.
