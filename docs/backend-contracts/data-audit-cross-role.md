# Data Audit — Existing Data We Fetch But Don't Use

**Task:** Analysing and finding usable data across the different roles, to display it in appropriate places
**By:** Gokul (Frontend Engineering) · 19 Aug 2026
**Scope:** Current codebase only — frontend and backend routes both checked. Every claim below has a file reference.

**Method:** for each role, compared the fields the API actually returns against the fields components actually render. Then checked backend routes to confirm which role is *allowed* to fetch each one.

**Roles audited:** Student · Instructor · Institute Admin · Institute Owner · Super Admin · B2C

**Summary of what's sitting unused, by role:**

| Role | Finding | Backend needed |
|---|---|---|
| **Student** | Predicted Readiness fed a hardcoded zero; a complete catch-up UI no student can reach; growth-since-diagnostic never shown | No |
| **Instructor** | Manual writing-grade override endpoint exists with **no UI at all**; three per-student practice-history endpoints unused | No |
| **Institute Admin** | Two of its own six analytics endpoints have no admin UI (the Owner has both) | No |
| **Institute Owner** | No unused data. Three sidebar items are placeholder pages | n/a |
| **Super Admin** | Largely clean. Question Bank Manager runs on hardcoded mock data while real institute data is available | No |
| **B2C** | Games/leaderboard only — nothing served-but-unused | n/a |

---

# 1. Predicted Readiness — the flagship case

## Why it isn't working today

The function is not a stub. `computeReadiness()` at `StudentDashboardPage.tsx:67` is complete and runs on every dashboard load. The problem is what it's fed.

```ts
// StudentDashboardPage.tsx:46
const BASE_PACE_PER_WEEK = 0.125;          // assumed pace — identical for every student

// StudentDashboardPage.tsx:50
const consistencyFactor = (misses, streak) => {
  if (misses >= 2) return 0.6;
  if (misses === 1) return 0.8;
  return streak >= 7 ? 1.1 : 1.0;
};

// StudentDashboardPage.tsx:216
const missedData = { misses: 0, subSkills: [] as string[] };   // hardcoded

// StudentDashboardPage.tsx:97
projected = current + BASE_PACE_PER_WEEK * factor * weeksLeft
```

Because `misses` is permanently `0`, `consistencyFactor` can only ever return **1.0 or 1.1**. Combined with a fixed pace constant, the outcome is:

> **Two students at band 5.0 with the same exam date receive an identical prediction — whether one has completed 30 assessments or missed 26 of them.**

There is no student-specific evidence in the projection at all. It looks like a working feature and behaves like a static formula.

*(For context, the hardcoded zero was a deliberate earlier fix — the comment at line 211 explains that a previous `MOCK_MISSED_STATE = 1` was shipping a fake "behind schedule" banner and a fake momentum penalty. Zero was the safe choice at the time; it was never revisited.)*

## What makes it live

Readiness needs six inputs. **Four are already in memory on the dashboard:**

| Input | Source | Status |
|---|---|---|
| Current band | `competency-scores` | ✅ already fetched (line 274) |
| Target band | `daily-drill-state` / `competency-scores` | ✅ already fetched (lines 242, 277) |
| Exam date | `competency-scores` | ✅ already fetched (line 281) |
| Daily streak | `daily-drill-state` | ✅ already fetched |
| **Missed count + miss streak** | `GET /api/student/ia-history` | ⬅ **exists, unused here** |
| **Observed improvement pace** | `ia-history` + `GET /api/student/mock-history` | ⬅ **exists, unused here** |

**Two added fetches. No backend work.** Verified in `studentRoutes.ts:62` and `:65` — both are student-authorised routes, already used by `AssessmentHistoryPage`.

### 1a. Real miss count replaces the hardcoded zero

`ia-history` returns per-IA `status: COMPLETED | MISSED` (confirmed in the controller's `select`). `AssessmentHistoryPage` already derives both the total and the consecutive-miss streak from it — `getAttendance()` and the miss-streak loop in `getRecordInsight()` are working code we can reuse rather than rewrite.

Our test student: **26 misses, 13-miss streak.** Today's dashboard scores them as perfect attendance.

### 1b. Observed pace replaces the assumed constant

`ia-history` and `mock-history` both return dated, scored entries (`mock-history` includes `real_band_score`, parsed to float in the controller). That gives a series of real band points per student — i.e. **their actual improvement slope**, instead of `0.125` for everybody.

Same formula, real inputs:

| Term | Today | After |
|---|---|---|
| pace | fixed `0.125`/week, all students | slope of that student's own band history |
| consistency factor | always 1.0 / 1.1 | genuine, from real miss counts |

### Known limitation, stated up front

A fuller model would also use **lifetime drill accuracy**. That field (`avg_dcs_lifetime`) is instructor-only, so including it would require backend work — see §9. This proposal deliberately routes around it by deriving pace from band history instead, which is arguably the stronger signal anyway: actual band movement predicts a future band more directly than drill scores do.

Today's drill quality *is* available (`daily_dcs` from `daily-drill-state`, already fetched) if we want it as a modifier later.

---

# 2. A complete UI that no student can ever see

The same hardcoded `missedData.misses = 0` gates **five** places. Four are unreachable:

| Line | Branch | Actual behaviour |
|---|---|---|
| 227 | feeds `computeReadiness()` | §1 above |
| **393** | `misses >= 2 &&` → "Let's pick things back up" catch-up banner | **Dead code — can never render** |
| 418 | `isLocked && misses < 2` | always takes the `< 2` path |
| 450 | `misses < 2 && (...)` drill panel | always renders |
| **528** | `misses < 2 ? "lg:col-span-6" : "lg:col-span-12"` | layout never switches to the wide recovery variant |

So a **recovery flow was fully built** — banner, copy, icon, animation, and a dedicated wide layout — and the data feed was never connected. The single `ia-history` fetch in §1 switches all of it on.

**`missedData.subSkills`** is a permanently empty array. `ia-history` entries carry **`carry_forward_subskills`** (`{skill, sub_skill}[]`) — literally the sub-skills a missed IA deferred. That makes the banner actionable: *"you missed Coherence and Word Stress — start there"*, linking into drills.

---

# 3. Students can't see their own growth — their tutor can

The student dashboard's `SkillBand` type carries a `delta` field. Every card sets it to zero (`StudentDashboardPage.tsx:292`) and **nothing renders it**. The field was reserved for per-skill growth and never wired.

The instructor has the finished version: `BaselineComparison` at `student-progress/OverviewTab.tsx:36` renders diagnostic baseline against current band per skill, with baseline markers and a legend reading *"Δ = current − baseline"*.

**The endpoint was purpose-built for this.** `getDiagnosticReport` in `studentController.ts` contains:

> *"Keep only the first (oldest) entry per skill — that is the initial diagnostic baseline"*

It already computes exactly what the delta needs, returns `skill`, `band_score` and `sub_scores`, and is student-authorised (`studentRoutes.ts:68`). The frontend currently uses it only to populate a history tab.

**Uses:** fill the existing `delta` field on the skill cards (`↑ 1.5 since diagnostic`), and a hero line — *"You started at 4.0. You're at 5.5."*

---

# 4. Endpoints the student dashboard doesn't call

Currently: `daily-drill-state`, `next-action-drill`, `competency-scores`. Available, working, student-authorised, unused here:

| Endpoint | Carries | Would show |
|---|---|---|
| `ia-history` | status, scores, `momentum_awarded`, `carry_forward_subskills` | §1, §2 |
| `diagnostic-report` | oldest-per-skill baseline | §3 |
| `mock-history` | `real_band_score`, per-skill scores, `attempt_type` | measured band trend beside the projection |
| `speaking-history` | speaking attempts over time | speaking trajectory |

---

# 5. INSTRUCTOR role — unused capability

### 5a. Manual writing grading exists in the backend with no UI at all

```
PATCH /api/instructor/writing-assessment/:assessmentId/grade
```

**Verified: not called anywhere in the frontend.** No component, no service function, nothing.

So an instructor can currently *see* an AI-generated writing score but has no way to **override or correct it** — even though the backend supports exactly that. For a product whose credibility rests on AI scoring, "the tutor can correct the AI" is a meaningful trust feature that is already built server-side.

**Where it belongs:** the Assessments tab of the student progress view, or the writing assessment detail — an editable score with the AI value shown alongside.

### 5b. Per-student skill history — endpoints served, two of three unused

| Endpoint | Frontend status |
|---|---|
| `GET /instructor/students/:id/reading-history` | Service function exists (`fetchStudentReadingHistoryForInstructor`) but **no component imports it** |
| `GET /instructor/students/:id/speaking-history` | Not called |
| `GET /instructor/students/:id/writing-history` | **Never called by anything** |

The student progress view has five tabs — Overview, Assessments, Mock Tests, Drills, Diagnostic — and **no per-skill practice history**. An instructor can see assessment results but not the practice work behind them, despite all three endpoints being live.

Also unused: `fetchBatchReadingAnalytics` — a written service function wrapping `GET /instructor/batches/:id/reading-analytics`, imported by **zero components**.

**Where it belongs:** a "Practice History" tab in the student progress view, reusing the three endpoints.

---

# 6. INSTITUTE ADMIN role — analytics served but not shown

The admin's own routes expose **six** analytics endpoints. The Institute Owner has UI for all six. The admin has UI for four:

| Analytics endpoint | Owner UI | Admin UI |
|---|---|---|
| `subskill-heatmap` | ✅ | ✅ |
| `cohort-progress` | ✅ | ✅ |
| `goal-achievement` | ✅ | ✅ |
| `batch-comparison` | ✅ | ✅ |
| **`engagement-trends`** | ✅ | **✗ route authorised, no UI** |
| **`instructor-effectiveness`** | ✅ | **✗ route authorised, no UI** |

`GET /api/institute-admin/analytics/engagement-trends` and `.../instructor-effectiveness` are live and authorised for the admin role — the frontend simply never calls them from any admin page.

This matters because the **admin is the operational role**. Instructor effectiveness and engagement trends are exactly what a day-to-day operator acts on; the owner looks at them monthly. The data is being served to the person who needs it least.

**Where it belongs:** the Institute Admin Reports page — the owner's existing components can be reused as-is.

---

# 7. INSTITUTE OWNER role

Audited: the owner uses all six analytics endpoints, `at-risk`, `assessment-overview`, batch analytics, `admins` management and `diagnostic/reset`. **No unused server data found for this role.**

Separate issue, not a data gap: three sidebar items — **Financial (ROI)**, **Marketing (Strategic Report)** and **Career Launch (AI Calibration)** — render "coming soon" placeholder pages (`ComingSoonPages.tsx`). There are no backend endpoints behind them either, so these need building, not wiring.

---

# 8. SUPER ADMIN role

Audited and **largely clean** — `superadminService.ts` wires the real endpoints, and Dashboard, Institutes, Subscription and All Users all consume it.

*(I initially flagged these as mock-only; that was wrong — the API calls live in the service layer, not the page files.)*

Genuinely without data: **Pricing Config**, **Support Tickets** and **Platform Analytics** run on static data — but there are **no backend routes** for them either (superadmin exposes only `institutes`, `subscriptions`, `users`). So these need backend work, not wiring, and don't belong in this audit.

One real item: **Question Bank Manager** uses a hardcoded `MOCK_HISTORY` array and a `setTimeout` fake for its institute/batch lists, while real institute data is available via `superadminService`.


---

# 9. What genuinely needs backend work

| Item | Why | Size |
|---|---|---|
| Practice-coverage panel (`sub_skill_counts`), streak heatmap (`streak_calendar`), lifetime effort (`total_drills_all_time`) | Built in `src/lib/studentProgressQueries.ts`, served **only** via the instructor endpoint. No student route exists, and students can't call an instructor-authorised route. | Small — the query exists. Either `GET /api/student/drill-stats` reusing it, or add the fields to `daily-drill-state`. |
| LexiGrid stats for students | `router.post('/game-score')` is **POST only** — students can write a score but not read their aggregate. | Needs a `GET`. |

These are the **additive panels**, not the fixes. Nothing in §1–§3 depends on them, so they shouldn't be bundled into the readiness work.

---

# 10. Smaller finds

- **`student.email`** — in the instructor's `StudentFullProgress` payload, rendered by nothing. Useful as a subtitle under the student's name for confirming identity.
- **Instructor-only drill data** — see §9; usable for students (practice coverage, streak pattern) and for institute admins (batch-wide attendance patterns before they show up in bands).

---

# 11. Fixed today

- **`current_band` on the student profile header** — was in the payload and already used to compute the "band gap" badge, but never displayed, so the badge read "3.0 band gap" with no band on screen to explain it. Added as a stats tile in the shared header → instructor, institute-admin and institute-owner all gained it.
- **"Current band" on assessment history** — was showing the average of the *most recent assessment only*, so a Speaking-only IA scoring 0.5 displayed as the student's band while their Listening sat at 7.0. Same student read **0.5** there but **5.0** on their own dashboard and on the instructor's screen. Relabelled "Last assessment" and corrected panel copy claiming the band was "frozen at 0.5" — no number changed, contradiction gone.

---

# 12. Checked and already correct

Recorded so nobody re-audits them:

- `daily_dcs` / `dcs_threshold` — properly rendered on the student dashboard with an eligibility bar.
- Upcoming IA dates — students **do** get these via `IAScheduleWidget` from `/api/ia/status` (`upcoming_ias`, `days_away`).
- `momentum_awarded`, `carry_forward_subskills`, `ai_feedback`, `ai_band`, `total_mcq`, `attempt_type` — all consumed on the student side.
- `competency.sub_scores` — used by both student and instructor surfaces.
- `lexigrid_stats` — used by instructor, institute-admin and institute-owner.

---

# Proposed order

| # | Change | Backend needed | Effort | Why |
|---|---|---|---|---|
| 1 | Fetch `ia-history` → real misses into `missedData` | **No** | ~½ day | Fixes readiness inputs **and** switches on the built-but-invisible catch-up UI + wide layout |
| 2 | `diagnostic-report` → per-skill growth delta | **No** | ~1 day | Students finally see their own progress |
| 3 | Observed pace + `mock-history` trend | **No** | ~½ day | Readiness stops being a static formula |
| 4 | Practice coverage / streak heatmap / LexiGrid stat | **Yes** — §9 | small BE + ~1 day FE | Additive; raise as one small request |

| 5 | Instructor writing-grade override UI (§5a) | **No** | ~1 day | Lets a tutor correct the AI — trust feature, endpoint already live |
| 6 | Admin `engagement-trends` + `instructor-effectiveness` pages (§6) | **No** | ~½ day | Reuse the Owner's existing components |
| 7 | Instructor practice-history tab (§5b) | **No** | ~1 day | Three live endpoints, currently invisible |
| 8 | Question Bank Manager → real institute data (§8) | **No** | ~½ day | Remove mock arrays, use `superadminService` |

**Everything above is frontend-only except item 4.**

---

# One decision needed before item 3

Replacing the assumed pace with an observed one means **the projection can go down** when a student stalls, and it becomes student-specific rather than uniformly encouraging. That's a product call on honesty versus motivation — worth deciding before I build it, not after.

The same applies to §3: showing growth honestly also shows regression.
