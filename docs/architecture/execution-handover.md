# TestCrack — Execution & Handover Brief

**For:** Backend/full-stack dev
**From:** Paul

---

## 1. Read this first

You have seven tasks. Do them in the order written. Do not reorder them, do not add to them, do not improve things that are not on the list.

Every decision you might want to ask me about is already answered in Section 3. Read Section 3 before you start. If something is genuinely not covered there, follow the stuck rule in Section 5 — do not wait on me.

At the end you hand back **one deliverable**, described in Section 7. Not a document, not a status update, not a Slack thread. One thing.

**Week blocks**

| Block | Tasks |
|---|---|
| Week 1 | T1, T2, T3 |
| Week 2–3 | T4 |
| Week 4 | T5, T6, T7 |

If you finish a block early, start the next one. If you fall behind, read Section 8 before doing anything else.

---

## 2. The rules

1. **Never edit an IELTS code path.** Not to clean it, not to improve it. If IELTS behaviour changes, the task has failed regardless of what else works. Branch on exam identity or read from config instead.
2. **Additive only.** Add new paths beside old ones. Do not rip out existing hardcoded logic beyond exactly what a task names. A half-finished refactor is worse than no refactor, and you are on a clock.
3. **One task, one branch, one PR.** Do not batch. Do not let a branch cross task boundaries.
4. **Every PR runs the full existing test suite and it passes.** All of it, not the tests near your change.
5. **No new architecture documents, design docs, or markdown files.** Except `HANDOVER.md`, which is Section 7. Notes go in the PR description.
6. **No new dependencies, no new services, no new infra.** Nothing that needs a deploy step nobody else knows about.
7. **No renaming, no folder restructuring, no formatter run across files you didn't otherwise touch.** It destroys the diff and the next person cannot read it.
8. **When in doubt, do the smaller thing.** Every time.

---

## 3. Decisions already made — do not ask, do not reopen

These are settled. They are here so you never have to call me.

| Question | Answer |
|---|---|
| Score storage: keep squeezing exam scores into the IELTS 0–9 column, or store native? | **Store native.** New column for the raw score plus a scale identifier alongside it. Leave the old column populated as-is for backward compatibility. Do not migrate historical data. Do not drop anything. |
| Should a student be able to take two exams at once? | **No.** One account, one exam. This is the product model now. Do not build toward multi-enrolment, do not add tables for it. |
| Should we compute an overall score for exams that don't have one? | **No.** Read the aggregation mode from config. If config says no overall score, show none. |
| OET: how far do we take it? | **Two fixes and merge with the exam switched off.** Nothing else. No enrolment, no drills, no content, no reporting. |
| A test is failing that was already failing before I touched it. | Leave it. Note it in `HANDOVER.md`. Do not fix unrelated tests. |
| The AI agent wants to refactor something adjacent to make my change cleaner. | Say no. Scope creep from an agent is still scope creep. |
| I found another bug not on this list. | One line in `HANDOVER.md` under "Known issues". Do not fix it. |
| I think a task is designed wrong. | Do it as written, then put your objection in the PR description. Do not redesign it and tell us after. |
| Should I write tests? | Yes, for the new behaviour in each task's acceptance criteria. Nothing beyond that. |
| Should I write documentation? | Only `HANDOVER.md`. |
| Deploy/restart/config server steps? | Do not deploy anything. Everything merges to `dev` only. |

---

## 4. How to work with the AI agent

You are expected to use an AI coding agent for this. It is the reason this timeline is realistic. Use it correctly.

### 4.1 Standing context — paste this at the start of every new session

```
You are working in the TestCrack codebase. Context you must respect at all times:

- This is a multi-exam test-prep platform. IELTS is the original and only fully
  built exam. Spoken English (SE) is partially built. OET exists on a branch and
  is switched off.
- HARD RULE: never modify IELTS behaviour. Not logic, not output, not stored
  values, not formatting. If a change would touch a shared path that IELTS uses,
  add a branch on exam identity or a config read instead of editing the existing
  path.
- HARD RULE: additive changes only. Do not remove, rename, or restructure
  existing code unless I explicitly ask for that exact removal.
- HARD RULE: no new dependencies, no new services, no folder moves, no
  project-wide formatting.
- Keep diffs minimal. If you think something adjacent should be refactored, say
  so in one sentence and do not do it.
- Before writing code: locate the relevant files and show me what you found and
  what you plan to change, as a short list. Wait for me to confirm.
- After writing code: run the full test suite and report the result honestly,
  including pre-existing failures.

Acknowledge these rules, then wait for my task.
```

### 4.2 The loop for every task

1. Paste the standing context into a fresh session.
2. Paste the task prompt from Section 5.
3. **Let the agent explore and report before it writes.** If it starts editing files without telling you what it found, stop it and make it explain first.
4. Read the plan it gives you. If the plan touches an IELTS path, reject it and tell it to branch instead.
5. Let it write. Review the diff yourself. You are accountable for it, not the agent.
6. Run the full suite.
7. Test the acceptance criteria by hand, as a user, in a browser. The agent's word that something works is not evidence.
8. Commit, push, open the PR, write the description.
9. **Start a fresh session for the next task.** Do not carry a long polluted context between tasks.

### 4.3 Rules for the agent specifically

- If the agent says a test is "unrelated" or "flaky", check yourself. It is usually wrong about that.
- If the agent produces a large diff for a small task, throw it away and re-prompt with a narrower ask. Do not try to trim it down.
- Never let it run migrations, seeds, or anything that writes to a shared database.
- If you are two hours into fighting the agent on one task, stop using it for that task and write the code yourself. It is a tool, not a commitment.

---

## 5. The tasks

Each task has: what, the prompt, and how you prove it's done. Prove it by using the product, not by reading code.

**Stuck rule for all tasks:** blocked for more than two hours on the same thing, do this — post one message to me on Slack stating the task number, what you tried, and what you need. Then move to the next task immediately. Do not wait for a reply. Do not sit on it. A skipped task that is written up is fine. A silent week is not.

---

### T1 — Fix exam routing

**What:** Spoken English accounts log in and land on the IELTS dashboard with the IELTS sidebar, instead of their own. Fix that. Also find every place in the codebase that determines a student's exam by asking "is this **not** IELTS?" and replace it with a positive check on exam identity.

**Why it's first:** it is the multi-exam switch failing at the smallest possible scale, and T5 is the same mechanism much larger.

**Prompt:**

```
Task: fix student post-login routing so that a student lands on their own exam's
dashboard and sidebar.

Step 1 — investigate only, no code yet. Find and show me:
a) Where post-login redirect for a student is decided.
b) Where the dashboard route and the sidebar component decide which exam's
   navigation to render.
c) Every place in the codebase that infers a student's exam by testing for NOT
   being IELTS (e.g. `!== 'ielts'`, `if not ielts`, `exam != IELTS`, or any
   equivalent). List file and line for each. This is important — I want the full
   list even where you are not going to change it.

Report all three as a list. Do not edit anything yet.

Step 2 — after I confirm: make the redirect and the sidebar resolve the exam
from the student's own exam identity and route to that exam's dashboard.
IELTS students must follow exactly the same path they do today. Do not change
the IELTS branch. Add the new path beside it.

Then run the full test suite and report the result.
```

**Done when:** an SE test account logs in and lands on the SE dashboard with the SE sidebar; an IELTS test account is byte-for-byte unchanged in behaviour; the full list of negation checks is in the PR description.

---

### T2 — Close out OET

**What:** two small fixes, then merge the OET branch with the exam switched off. Nothing else on OET. Ever.

**Fix A:** the shared scoring change broke the listening and reading sections of Spoken English — they error where they previously worked. Add a guard that checks the submitted section actually belongs to the student's exam, and return a clear message instead of erroring.

**Fix B:** one of the nine speaking criteria is named differently in the config file than in the scoring code. Make them match. One-word change. Do it now, while no real results exist.

**Also:** delete the stale paragraph in the OET notes claiming the marking criteria are reused from IELTS. The later section is correct; the code follows it. Just remove the wrong paragraph.

**Prompt:**

```
Task: two targeted fixes on the feature/oet-nursing branch, then it merges
switched off.

Fix A: a shared scoring code path was modified for OET, and as a side effect the
listening and reading section submissions for the Spoken English exam now throw
an error. Find that shared path. Add a guard that validates the submitted
section belongs to the sections defined for the student's own exam, and returns
a clear, non-error response when it does not. Do not change behaviour for IELTS
or for OET.

Fix B: the OET speaking rubric has nine criteria. One criterion key is spelled
differently in the OET config file than in the scoring code, so it silently
resolves to nothing. Find the mismatch, show me both spellings, and align them
on the config file's spelling.

Investigate and show me what you found for both before changing anything.
Then run the full test suite.
```

**Done when:** Spoken English listening and reading submissions work again; the criterion key matches in both places; branch merged to `dev` with the OET exam switched off; IELTS and SE both regression-passed by hand.

---

### T3 — Three safety guards

**What:** three guards that stop the platform doing permanent damage. These are not exam-specific — they protect every exam we add later.

**Guard 1 — refuse to score an empty question bank.**
The system cannot tell "the student answered nothing" from "there are no questions to answer". With no content loaded, a student can complete an assessment, be recorded at the bottom of the scale on every section, and be permanently marked as assessed — and these assessments are one-time-only, so they can never retake it. It also unlocks downstream modules they shouldn't reach. This will fire the moment anyone registers a new exam, because "registered but not yet seeded" is a state that happens by definition.

**Guard 2 — modules must refuse exams they weren't built for.**
Drills, internal assessments, mock tests and study recommendations were written when IELTS was the only exam. They currently treat an unrecognised exam as a known one and carry on. They must fail closed with a clear message.

**Guard 3 — separate the speaking session slots.**
Two different routes into a speaking assessment write to the same session slot with different payload shapes. Whichever writes first wins, and the other renders an empty screen with no recovery path for the student or the teacher.

**Prompt (run these as three separate prompts, one guard at a time):**

```
Task: add a safety guard. Investigate first, show me what you found, then wait.

Guard: when a student submits or completes an assessment section, the system
must distinguish "student submitted no answers" from "this section has zero
questions available". Right now both produce a scored result at the bottom of
the scale, and the assessment gets marked complete — which is irreversible
because these assessments are one-time-only.

Find:
a) Where a section result is scored and persisted.
b) Where an assessment is marked complete / where completion unlocks downstream
   modules.
c) Whether the item count for the section is available at that point.

Then implement: if the available item count for the section is zero, do not
persist a score, do not mark the assessment complete, and return a clear message
stating the exam has no content loaded. Add a test for this case.

Do not change behaviour when the item count is greater than zero.
```

```
Task: make exam-specific modules fail closed instead of guessing.

Find every module that assumes IELTS: practice drills, internal assessments,
mock tests, and study recommendations. For each, find where it determines
scoring scale, difficulty, or exam behaviour.

Show me the list first.

Then implement: each of these modules declares which exams it supports. If a
student's exam is not in that list, it returns a clear "not available for this
exam" response instead of proceeding with IELTS assumptions. It must not throw
an unhandled error and it must not silently continue.

IELTS behaviour must be identical to today. Add a test per module for the
unsupported-exam case.
```

```
Task: fix a session slot collision in speaking assessments.

There are two different entry paths into a speaking assessment. Both persist
session state into the same slot/key, but they store different payload shapes.
Whichever writes first wins, and the other path then renders an empty state with
no recovery.

Find both entry paths and the shared slot. Show me the two payload shapes.

Then implement: separate the storage so each path has its own slot, or key the
slot by assessment type. Existing IELTS speaking sessions must continue to work
unchanged, including any in-flight sessions. Add a test that exercises both
paths in sequence.
```

**Done when:** you deliberately trigger all three — an exam with no questions loaded, an unsupported exam hitting each of the four modules, and both speaking paths in sequence — and each one refuses cleanly with no record written and no unhandled error.

---

### T4 — Spoken English cohort 1 frontend

**What:** the remaining surfaces from the SE frontend spec: Assessment History (§7.3), Diagnostic Report (§7.4), Speaking History (§7.5), Onboarding / Profile / Settings with CEFR target and disclaimer (§7.6).

**Why it matters:** this is the only paying cohort riding on this work and it is our reference customer. It is the single most important task on this list. Everything else on this page can slip. This cannot.

**Prompt (do one surface at a time — four separate sessions, never all at once):**

```
Task: build one Spoken English student surface, following the SE frontend spec
section I paste below.

[paste the spec section here]

Constraints, in priority order:
1. Do not edit any IELTS component or IELTS code path. If an existing component
   is shared with IELTS, either branch inside it on exam identity or create an
   SE-specific component beside it. Your choice, but tell me which and why in
   one sentence.
2. All levels, bands and targets display as CEFR throughout this surface. No
   IELTS band values anywhere in the SE journey.
3. Read display strings, scale, and section names from existing SE config
   wherever they already exist. Do not hand-type new ones.

Step 1: show me which existing components you'll reuse, which you'll branch, and
which are new. Wait for my confirmation.
Step 2: build it.
Step 3: run the full test suite.
```

**Done when:** an SE student goes diagnostic → drills → internal assessment → report end to end, in a browser, with CEFR displayed at every step; and you re-run the full IELTS student journey by hand and it is unchanged.

---

### T5 — Exam config layer (internal only)

**What:** make an exam a row of data instead of branches in code. **No admin UI.** This is an internal registry plus a validator. Someone else builds the UI later.

Per exam the registry holds: slug, display strings, sections and sub-tests, timing, item types, native scoring scale, grade/band mapping, aggregation mode, available module types, and an empty rubric block.

Three things that must be right:

- **Native score storage.** Store the raw score on the exam's own scale with a scale identifier. Do not normalise into the IELTS-shaped column. Additive: new fields beside the old one, old one still populated.
- **Targets are per-section.** A single overall target is the degenerate case of a per-section target vector, not the other way round. Several exams have sectional cutoffs.
- **Aggregation is read at render time.** Some exams issue no overall score at all. Config already records that correctly today and the result screens average anyway. The read path has to actually consult config or the config is decoration.

**Prompt:**

```
Task: build an internal exam config registry. No admin UI — schema, loader, and
validator only.

Step 1 — investigate and report, no code:
a) Find the existing exam config file(s) and show me the current schema.
b) Find where exam display strings, section names, scoring scale, band/grade
   mapping, and timing are currently read — and where any of those are
   hardcoded instead.
c) Find where a section score is persisted, and where an overall/aggregate score
   is computed for display.
d) Find where a student's target score is stored.

Step 2 — after I confirm, extend the config schema so that per exam it defines:
slug, display strings, sections/sub-tests, timing, item types, native scoring
scale (min, max, step), grade/band mapping, aggregation mode (including a
"none" mode meaning no overall score exists), available module types, and an
empty rubric block.

Step 3 — implement three reads:
1. Score persistence writes the native score plus a scale identifier into new
   fields. Keep writing the existing legacy field exactly as it does today. Do
   not migrate old rows.
2. Target storage supports a per-section map. A single overall target is stored
   as the degenerate one-entry case. Keep the existing field working.
3. The results/overall display reads aggregation mode from config. When mode is
   "none", no overall figure is rendered or computed. Also: a legitimate score
   of zero must be included when averaging, not dropped.

Step 4 — a validator that rejects a malformed exam config with a readable,
field-level error message at load time.

Additive only throughout. IELTS output must be identical before and after.
Run the full suite after each step.
```

**Done when:** you can add a dummy exam ("Sample Exam") to the registry and it renders with correct labels, sections, scale and aggregation on the student dashboard and sidebar with **zero code changes**; and IELTS is unchanged.

---

### T6 — Seeding path (internal)

**What:** the path our ops team uses to load questions into an exam. Internal, rough, functional. No polish, no product surface.

Required:
1. A downloadable template per module type, generated from the exam's config.
2. Excel or JSON upload, validated against the schema. Field-level errors in plain language with row numbers ("row 12: answer must be one of A/B/C/D"). Nothing saves unless it validates. **No silent coercion of bad data — ever.**
3. Partial import: valid rows go in, invalid rows are reported for correction and re-upload.
4. Duplicate detection within that exam's existing bank so a re-upload doesn't double-seed.
5. Provenance on every item: source, verified by, verified on.
6. An attestation checkbox on publish confirming content is original and not copied from real exam papers.
7. **Difficulty is set explicitly in the template, and defaults to the middle tier.** Right now difficulty is selected from the student's target, and a student with no target gets the hardest tier — so a bank seeded only at easier tiers is invisible to every new student. Do not let this ship wrong.

**Prompt:**

```
Task: build an internal bulk question import path. Internal tooling only — no
design work, no customer-facing polish. Function over form.

Step 1 — investigate and report:
a) How question bank items are currently stored, including all required fields.
b) Whether any bulk import exists today, and if so where.
c) How question difficulty is selected when serving questions to a student, and
   what happens when the student has no target set.

Step 2 — after I confirm, build:
1. Template generation: given an exam and a module type, generate a downloadable
   template (Excel and JSON) with the correct columns derived from config.
2. Upload + validate: parse the file, validate every row against the schema,
   and return field-level errors with row numbers in plain language. Nothing is
   written unless the row is valid. Never coerce or default a bad value silently.
3. Partial import: valid rows are inserted, invalid rows returned in a report.
4. Duplicate detection against the existing bank for that exam, matched on
   normalised question stem, so re-uploads do not double-seed.
5. Every imported item stores: source, verified_by, verified_on.
6. A required attestation flag on publish.
7. Difficulty is an explicit template column. If absent, default to the middle
   tier, never the hardest.

Add a test that imports a file with a mix of valid and invalid rows and asserts
the valid ones landed and the invalid ones did not.
```

**Done when:** you import a 200-item file containing 15 deliberately broken rows — 185 land, the 15 come back with errors a non-technical person can act on, and a corrected re-upload completes the set with no duplicates.

---

### T7 — Write `HANDOVER.md`

**What:** one file at the repo root. This is how the next person picks this up without you. Write it as you go, not on the last day.

Sections, in this order, nothing else:

1. **How to run this locally.** Exact commands, from a clean clone. Environment variables needed and where to get them. If a step is undocumented tribal knowledge, that is precisely the step to write down.
2. **What I changed.** One line per task T1–T6: what it does, and the PR link.
3. **What is unfinished.** Anything you skipped or half-did, and exactly where it stops. Be blunt. An honest gap is useful; a hidden one costs the next person a week.
4. **Known issues.** Every bug you found and did not fix. One line each, with the file if you know it.
5. **Traps.** The things that would bite someone who doesn't know this codebase. Shared code paths where a change silently affects IELTS. Anything where the obvious change is the wrong one. This section is the most valuable thing in the file — spend real time on it.
6. **How to add a new exam.** The ordered steps, written from actually doing it once, not from the plan. Include what breaks if you skip a step.
7. **Anything only you know.** Credentials location, deploy quirks, that one service that has to be restarted, which test account is which.

No architecture. No rationale essays. Operational facts only.

---

## 6. Definition of done — applies to every task

A task is not done until all four are true:

1. Merged to `dev`.
2. The full test suite passes.
3. **You have used it yourself, in a browser, as a student.** Not read the code. Not trusted the agent. Used it.
4. **IELTS regression passed by hand** — you logged in as an IELTS student and walked the journey, and nothing changed.

Screenshots are not evidence. Working software is.

---

## 7. The one deliverable

At the end, you give me **one thing**: a single screen recording, plus the merged branch.

The recording walks through, in one take:

1. SE student logs in → lands on SE dashboard with SE sidebar.
2. SE student completes diagnostic → drills → internal assessment → report, with CEFR shown throughout.
3. IELTS student logs in and walks the full journey unchanged.
4. Each of the three safety guards triggered deliberately and refusing cleanly.
5. "Sample Exam" appearing correctly from config alone, with no code change.
6. A 200-item import with 15 broken rows: 185 in, 15 reported, re-upload clean.
7. `HANDOVER.md` open on screen, scrolled through end to end.

Whatever you did not finish, say so out loud in the recording and point at where it stops in `HANDOVER.md`. An honest gap is fine. A gap I discover myself after you've gone is not.

Send me that one link. Nothing else.

---

## 8. If you run out of time

Cut from the bottom up. This is the order things get dropped:

1. **T6** — seeding path. Drop first. Ops can load content by hand in the short term.
2. **T5** — config layer. Drop second, but **only cleanly**: if you have started it, either finish the schema and validator or revert it entirely. Do not leave the codebase half-reading from config and half-hardcoded. That state is worse than not starting.
3. **T3** — guards 2 and 3. Guard 1 (the empty bank) does not get dropped under any circumstances.

**Never cut:** T1, T2, T4, T7, and guard 1 of T3.

If you can see a week out that you will not finish everything, tell me then, in one message. Not in the last week. I can move work to someone else with three weeks of notice and I cannot with three days.
