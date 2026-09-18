# Platform Roles & Flows — the external, user-visible model (LOCKED)

**Status:** LOCKED spec (agreed 2026-08-23). This is what the platform must look like *from the outside* to its four user roles. Companion to the backend work in [../ielts-extraction/](../ielts-extraction/). This doc answers: *what the users see*, and *how it sequences against the IELTS scoring extraction* (parallel vs. after).

---

## 0 · The core pattern — the **context switch**

Every role except SuperAdmin operates **inside a selected context**, chosen at/after login and switchable at any time. All of that role's pages render *scoped to the current context*, with **strict data isolation** between contexts.

| Role | Context dimension | Switch | Scoped pages | Unscoped pages |
|---|---|---|---|---|
| **SuperAdmin** | *(global)* | — | institutes, subscriptions, (later) exam configs | — |
| **Institute Owner** | **Exam** | select/switch exam | operations + insights (overview, batches, students, instructors) | manage admins |
| **Institute Admin** | **Exam** | select/switch exam | same operations + insights | — |
| **Instructor** | **Batch** | select/switch batch | dashboard, student assessment, report | batch mgmt, settings, workflow |
| **Student** | **Batch (+ its Exam)** | select/switch batch (if >1) | the full learning journey (diagnostic → dashboard → drills → IA/mock) | profile |

### LOCKED DECISION — switch model, not a filter/tag
We render pages **under a selected context**, **not** one page with an exam/batch *tag* or filter.
**Why:** exams differ in *logic, features, and components* (IELTS has 4 band components; Spoken English is CEFR with different subskills; OET is per-component grades). A switch lets each exam's pages **diverge cleanly** — extra/fewer components, different scoring shape, different runners — without a page trying to be all exams at once. The context becomes a first-class dimension, so per-exam differences are handled by *what loads under the context*, not by branching inside a shared page.

### HARD RULE — data isolation (security)
The selected context is **never trusted from the client alone.** Every scoped API call must (a) filter by the context's `exam_id` / `batch_id`, **and** (b) verify server-side that the authenticated user's role actually grants access to that context. Switching to Spoken English must return **zero** IELTS rows, and vice-versa. No cross-exam or cross-batch leakage.

---

## 1 · What the data model already supports (grounding)

This is largely **UI context + API scoping**, not new data modelling — the schema is already exam/batch aware:

- `exams` registry (live/reserved/disabled) + `exam_configs` (versioned). ✅
- `institute_exam_subscriptions` — per-(institute, exam) `billing_status` TRIAL|ACTIVE|CANCELLED. ✅
- `Batch.exam_id` — a batch belongs to exactly one exam; `BatchInstructor` / `BatchStudent` joins. ✅
- `InstituteStudent.exam_id` (+ target_band, momentum, streak, exam_date). ✅
- Roles: `InstituteOwner`, `InstituteAdmin`, `InstituteInstructor`, `InstituteStudent`. ✅
- Most `exam_id` columns carry `@default("ielts")`, so today's single-exam data is valid as-is (the switch defaults to IELTS).

**Implication:** the context-switch UX can be built **now**, on the existing model, largely **independent of the scoring extraction.**

---

## 2 · Role-by-role spec

### 2.1 SuperAdmin — *release-stable target*
**Stable for release (build/polish now):**
- Add a new institute **with an institute owner**.
- Edit institute details.
- Manage **subscriptions** per exam — simplified to **ACTIVE** and **CANCELLED** (exact billing logic deferred):
  - **TRIAL → behaves the same as ACTIVE** for now (no gating difference yet).
  - **CANCELLED → the old "deactivate institute" behaviour**, scoped to that exam subscription: access blocked / read-only, **no data deletion** (Hard Rule: destructive-free). Re-activate restores access.

**Later (after exam-config UI is scheduled):**
- Exam config pages — **add a new exam** and edit the **configurable** settings. What's editable here vs. code is already specified in [../ielts-extraction/IELTS-EXTRACTION-GUIDELINE.md §9](../ielts-extraction/IELTS-EXTRACTION-GUIDELINE.md) and the onboarding matrix in the phased plan. Short version: identity/availability/components/thresholds = config (guarded UI or file); strategy *choice* + scale *shape* + AI rubric = code.

### 2.2 Institute Owner & Admin — context = **Exam**
- Owner keeps **Manage Admins** (unscoped, fine as-is).
- On login, pick an **active-subscription exam**; all operations + insights pages (overview, batches, students, instructors) render **for that exam only**. Switch exam → the whole set reloads scoped to the new exam.
- Admin: identical, minus admin-management.
- **Gating:** only exams the institute has an **ACTIVE (or TRIAL)** subscription to are selectable. CANCELLED exams are hidden/read-only.

### 2.3 Instructor — context = **Batch**
- On login, pick a **batch**; dashboard, **student assessment**, and **report** pages map to that batch. Switch batch → rescope.
- **Batch management, settings, workflow** stay **unscoped** (batch is chosen *within* them, not a global lens).
- A batch carries its exam (`Batch.exam_id`), so an instructor's scoped pages are implicitly exam-correct.

### 2.4 Student — context = **Batch (+ Exam)**
- **Single exam / single batch → today's stable flow, unchanged.**
- **Multiple batches/exams enrolled →** after login pick a batch shown as **"Batch name — Exam name"**; switchable.
- Selecting e.g. **OET** runs the **OET journey**: OET diagnostic → dashboard → daily drill → Lexigrid (and other drills) → loop until the dashboard unlocks → IA / mock as required. The *shape* of that journey comes from the exam's config + runners (see dependency layers below).

---

## 3 · The sequencing answer — parallel or after?

**Short answer: mostly PARALLEL. Only one piece must wait for the extraction.** Three dependency layers:

### Layer 0 — SuperAdmin institute + subscription stability
- **Depends on:** nothing new. Existing models + a small access rule (TRIAL≈ACTIVE, CANCELLED=deactivate).
- **Sequence:** **now / in parallel.** This is the first releasable slice. Independent of scoring extraction.

### Layer 1 — the context-switch shell (owner/admin=exam, instructor=batch, student=batch+exam)
- **Depends on:** the exam registry + `exam_id`/`batch_id` scoping (all present) + role authorization. Frontend selector + scoped routing; backend query-scoping + isolation checks.
- **Sequence:** **along the way, in parallel with the extraction.** It needs exams to *exist as data* (they do) — **not** their scoring internals. You can ship the multi-exam shell even while only IELTS is fully runnable; other exams simply show "no content yet."

### Layer 2 — a second exam a student can actually *run* end-to-end
- **Depends on:** ✅ the scoring extraction (Phase 6, Parts 3–4) **+** that exam's **content** (question banks) **+** its **delivery/runners** (if components render differently) **+** an **AI grading adapter** (if AI-graded, e.g. OET/Spoken speaking).
- **Sequence:** **after** the extraction is green *and* the exam is onboarded (config + content + adapter). This is the one piece gated on our current backend work.

```
Track A (this doc):   Layer 0 ──► Layer 1 ─────────────────────────► (multi-exam shell live)
Track B (extraction): Phase 6 Parts 1–5 ──► (engine drives IELTS)
                                                    └──► Layer 2: onboard exam #2 (content+adapter) ──► student runs OET
                       A and B run in parallel; they meet only at Layer 2.
```

**So:** the visible role/context UX does **not** wait for the extraction to finish. It proceeds alongside. The *only* thing that waits is a real student journey through a *new* exam.

---

## 4 · Proposed build phases (Track A), interleaved with Track B

| Phase | Deliverable | Depends on | Releasable? |
|---|---|---|---|
| **A0** | SuperAdmin: add institute+owner, edit, subscription ACTIVE/CANCELLED (TRIAL≈ACTIVE, CANCELLED=deactivate) | existing models | ✅ yes |
| **A1** | Owner/Admin **exam context switch** + scoped operations/insights + isolation | registry + `exam_id` scoping | ✅ yes (IELTS-only content is fine) |
| **A2** | Instructor **batch context switch** for dashboard/assessment/report | `Batch`/`BatchStudent` | ✅ yes |
| **A3** | Student **batch(+exam) switch** post-login; single-exam flow untouched | student/batch enrolment | ✅ yes |
| **A4** | SuperAdmin **exam-config UI** (guarded create/edit) | Phase 6 done (config is the source of truth) | after B |
| **A5** | **Onboard exam #2** end-to-end (content + runners + grading adapter) | B done + A1–A4 | the payoff |

Track B (IELTS extraction) continues on its own checkpoints; A4/A5 consume its output.

---

## 5 · Hard rules (carried from platform decisions)
1. **No data deletion** on deactivate/cancel — access changes only, data preserved.
2. **Server-side authorization** on every context switch — client context is a hint, never the authority.
3. **Zero cross-context leakage** — scoped queries always filter by the authorized `exam_id`/`batch_id`.
4. Single-exam / single-batch users keep **today's exact flow** — the switch UI only appears when there's more than one context.

## 6 · Deferred (not blocking release)
- Exact billing/pricing, trial-expiry actions, seat caps (`seat_cap` reserved, unenforced).
- Payment integration.
- The exam-config authoring UI (A4) until Phase 6 lands.
