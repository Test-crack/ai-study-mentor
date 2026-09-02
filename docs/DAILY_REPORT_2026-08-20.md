# Daily Report — 20 Aug 2026

**By:** Gokul (Frontend Engineering) · 20 Aug 2026
**Branch:** `feature/new-2-branch`
**Two workstreams:** (1) exam-engine v2 — reviewing the new doc set and planning frontend work so I don't idle while backend builds; (2) Institute Admin portal — bringing it to visual parity with the other five roles.

**Summary:**

| # | Work | Output | State |
|---|---|---|---|
| 1 | Reviewed the exam-engine **v2** doc set (8 files) shared by senior | — | Read, superseded v1 identified |
| 2 | **Frontend parallel work plan** — 27 tasks, priority-ordered, dependency-tagged | `docs/exam-engine/FE-00_…md` | Done |
| 3 | Vendored the whole doc set into the repo + verified the reference impl runs | `docs/exam-engine/` | Done, 75/75 vectors pass |
| 4 | Folded in `EE-04` after it arrived — one new task, one widened | `FE-00` §0, FE-07, FE-27 | Done |
| 5 | **10 course-expansion candidates**, each in config shape | `docs/exam-engine/FE-01_…md` | Done |
| 6 | **Institute Admin theme parity** — dark hero + Manrope pass | 12 files, +179/−128 | Done, typecheck clean |
| 7 | Diagnosed a DB/schema divergence; stopped a destructive `db push` | — | Backend fixed it separately |

**Not verified:** the Institute Admin screens are behind `RoleProtectedRoute`, so I confirmed typecheck-clean, build-clean and console-clean but could not eyeball the authenticated pages myself.

---

# 1 · Exam engine v2 — what the doc set actually changed

The senior shared a corrected v2 set that supersedes the originals (`EE-05` §19). **Only v2 is live.** The three v1 files are quarantined in `docs/exam-engine/superseded-v1/` — they contain two arithmetic errors and one self-contradiction, so building against them would have been actively wrong.

The five changes that land on frontend:

| Change | Impact on my side |
|---|---|
| `skills` → `components` | Every UI iterating "L/R/W/S" is now wrong. `modality` becomes an optional tag. |
| **`overall` is nullable** (`overall.mode: per_component`) | OET, GRE and GMAT have **no headline score by design**. Needs a per-component report layout that doesn't exist. `EE-05` §4 asks me directly for a null-`overall` test. |
| `progression.current` → `headline` + `momentum` | The old design rendered "Band 6.0 — 80% of the way to 6.0". Momentum now spans the rounding interval and is **`null` at the scale cap, never a full bar**. |
| `label` → `name` / `display` | v1 used one field name for two meanings in the same payload. Touches every result-rendering component. |
| Config served via projection, thresholds stripped | The frontend can never compute a CEFR level client-side. All scores are server-given. |

---

# 2 · Repo audit — what's already wrong today

Done so the plan is a work plan rather than a restatement of the spec. Every item has a location.

## 2.1 Exam identity is hardcoded twice, and both copies are wrong

`src/shared/constants/examTypes.ts` — its own comment claims it is *"the ONE place the frontend defines exam identity"*:

- `EXAM_TYPES` is missing **GMAT**, which config v2 ships. Same gap as the Prisma enum (`EE-00` §4.1).
- `EXAM_LABELS` hardcodes `OET: 'OET'` and `GRE: 'GRE'`. **Config v2 renames these to "Healthcare English Preparation" and "Graduate Admissions Test Preparation"** because the marks are restricted — CBLA publishes no nominative-use carve-out and its legal block is `BLOCKED_ON_COUNSEL` (`EE-05` §13). **Shipping `OET` as a display label is a live legal exposure in current code**, not a future task.
- Every label here is a DoD violation: `EE-01` §10 greps for `IELTS` and treats hits outside the config loader as a leaked abstraction.

`Questionbankmanager.tsx:13` — a **second, conflicting** union: `'IELTS' | 'GMAT' | 'SPOKEN_ENGLISH' | 'PTE' | 'TOEFL'`. Has GMAT (which the shared file lacks), uses `SPOKEN_ENGLISH` where shared says `SPOKEN` and config says `spoken_english`, and omits OET and GRE entirely.

## 2.2 `EXAM_SKILLS` is the components model violated — inside superadmin

`Questionbankmanager.tsx:46` hardcodes a per-exam component list. It is also factually wrong: GMAT Focus is Quant / Verbal / **Data Insights**, not `INTEGRATED`, and `SPOKEN_ENGLISH: ['SPEAKING','LISTENING']` drops Reading and Writing, which config v2 keeps as `assessed: false` practice surfaces.

This file is in the section I'm currently working on — which is the overlap between the two tracks, and the reason the exam-engine work doesn't compete with superadmin.

## 2.3 `bandScale.ts` hardcodes the IELTS scale platform-wide

`BAND_MIN = 4.0`, `BAND_MAX = 9.0`, `bandToLevel()` with literal `5.5`/`7.0` cutoffs. Config v2 has **seven** scales. An OET 0–500 or GRE 130–170 score through `bandFillPct()` silently clamps to 100%. Must be widened, not rewritten — `EE-05` §1 makes byte-for-byte IELTS behaviour the correctness bar.

## 2.4 There is no test runner in this project

No vitest, no jest, no testing-library, zero test files. `EE-05` §4 and `EE-02` §7 both ask for a null-`overall` test. **That makes standing up the runner the genuine first task**, and it's fully backend-independent.

## 2.5 `momentum` already means something else here

We ship `MomentumProvider`, `momentum_awarded`, and `b2c_momentum` seeded at 920 — a **gamification points score**. `EE-01` §5.1's `progression.momentum` is a **progress-toward-next-rung bar**. Two unrelated meanings, one word, same app. Needs a naming decision before that UI lands.

## 2.6 A doc claim that doesn't hold for this repo

`EE-00` §5.1 and `EE-03` §6 both state OET roleplay is *"reserved as an enum value in the frontend."* There is **no `SpeakingFormat` enum in this codebase**. So that task is larger than sized — the enum has to be introduced, not just implemented. Flagged for the senior so the estimate isn't quietly wrong.

---

# 3 · The plan: `FE-00_Frontend_Parallel_Work_Plan.md`

**Conclusion: don't wait for backend, and don't stay only on superadmin.** Only **4 of 27** tasks are genuinely blocked.

- The contract is already frozen in writing (`EE-01` §6, `EE-03` §1, `EE-02`).
- `reference-impl.js` is runnable locally, so I can generate **provably correct** fixtures rather than inventing payload shapes.
- `EE-03` §3 says backend weeks 1–3 are *"unit-testable with no frontend and no live API"* — he isn't blocked on me either.
- The three missing renderers (`EE-03` §6) are 26–40 days of frontend work with **zero** backend dependency.

| Tier | Content | Size |
|---|---|---|
| **P0** | Test infra, fixtures from the reference impl, contract types, exam-identity collapse, scale widening, config hook, legal layer | ≈8 days, **all zero-dependency** |
| **P1** | Nullable-`overall` report, progression UI, targets, variants, CEFR profile, remediation, field renames | ≈18 days, mock-only |
| **P2** | Quantitative renderer, Data Insights renderer, OET roleplay | 26–40 days, never blocked |
| **P3** | Live endpoint wiring, viva runner, unlock UI, provenance | blocked (4 tasks) |

Only **D3** (is `overall` nullable) gates me, and since `EE-05` §16 calls it the most expensive item to retrofit, I plan as if yes regardless.

---

# 4 · Making the doc set survive

The v2 docs were living in a WhatsApp cache folder that will rot. All of it is now in `docs/exam-engine/` — 8 source docs, the config, the reference impl, and v1 quarantined in `superseded-v1/`.

**Rule recorded in `FE-00` §0: never restate a number from these files — reference them.** `EE-00` §7 exists because v1's numbers were hand-copied and two were wrong; transcribing the envelope or the CEFR thresholds into a summary would re-create that exact failure.

## 4.1 Finding worth passing to the backend dev

**This project is ESM (`"type": "module"`), so the reference implementation cannot run as `.js` here** — Node treats it as an ES module and `require` throws immediately. Renamed to `reference-impl.cjs` / `run-vectors.cjs` and updated the internal require; the maths is untouched.

```
node docs/exam-engine/run-vectors.cjs   →  75 passed, 0 failed
```

If his project is also ESM he'll hit the identical error, and it presents as a broken reference impl rather than a module-system mismatch.

## 4.2 `EE-04` arrived later and changed the board

I had flagged `EE-04` as missing from the original batch. When it arrived, my first characterisation of it was wrong — I'd said it was threshold values only. The threshold part holds (§5: one config block, no code), but two items are squarely frontend:

- **FE-27 · Viva consent + retention capture — the only item on the board with a hard deadline.** `EE-04` §3: *"Get the consent wording right at launch and Stage 3 starts with a corpus instead of a recruitment problem. Getting it wrong means re-collecting."* Stage 3 needs 60–90 benchmarked performances and Stage 5 needs 200–300 double-rated ones; the cheap source is the vivas students sit anyway. Miss the wording before Spoken English ships and a 9–11 week protocol restarts on recruitment.
- **FE-07 widened.** The config's `banned_terms_near_output` list is narrower than `EE-04` §4's claims table — that adds "official CEFR level", "recognised by the Council of Europe", any implication of immigration/admissions eligibility, plus required positive framing. Guarding only the config list would have left gaps.

Also noted: `EE-04` Stage 1 familiarisation is *"minimum three hours per participant, and everyone who touches scoring does it, engineers included."* That includes me.

---

# 5 · `FE-01_Course_Expansion_Candidates.md` — 10 courses

Ten courses we could adapt, each written in the engine's own vocabulary (components → subskills → scale → aggregation → strategy) so entries are close to copy-pasteable into `exams.*`. Constraint held: **low/no mathematical content**, and no repeats of IELTS, Spoken English, OET, GRE, GMAT, TOEFL or PTE.

**Headline: 6 of 10 are pure config — no new maths, no new runners, no legal gate. None of the ten touches the quantitative or Data Insights renderers**, which is the direct payoff of the no-maths constraint.

| Grouping | Courses |
|---|---|
| Config-only, **ours outright** (no rights holder) | Business & Professional Writing · Pronunciation & Intelligibility · Presentation & Public Speaking |
| Config-only, trademark-gated | CEFR Certificate Prep (B2/C1) · Canadian Immigration English · Workplace English |
| One new strategy each | Aviation English (ICAO) · Law Admissions Reasoning · Competitive Exam English |
| Real new UI | Interview & Group Discussion (only the GD half) |

Three findings from that exercise:

1. **Aviation English would have been a genuine scoring bug.** ICAO grades on the **lowest** of its six subskills, not the average. A candidate at Level 5 on five descriptors and Level 3 on one is Level 3 — the weakest link is the safety risk. Scored with `average_then_map` (the rule `cefr_hybrid` uses) that candidate reads 4.67 → Level 5 and **passes as operationally fit**. Needs a `min_of_subskills` strategy. Same class of error as the `overall.mode` finding in `EE-00` §2, caught before anyone built it.
2. **Workplace English exposed an engine limitation that config solved.** It's two separately administered halves with no combined figure, and we have no component-group concept. Modelled as two exam objects — zero code. Evidence the config-as-data call (D1) was right.
3. **Canadian Immigration English is the architecturally valuable one** — a second consumer of the `per_component` / nullable-`overall` path, which makes that a real code path with real tests rather than an OET special case.

I did **not** fabricate any real test's official rubric or cut scores. Anything needing a primary source carries a `⚠ verify` marker, following the `_subskill_todo: "Do not invent them"` discipline already in the OET config.

**Cheapest proof:** Business & Professional Writing — no legal gate, no new strategy, no new runner, no new UI. The honest test of the "config-only exam, zero code change" DoD in `EE-03` §4.

---

# 6 · Institute Admin — theme parity

## 6.1 Diagnosis: not what it looked like

The portal *looked* un-themed, but the colour pass and shell pass were both already done:

- All 16 files use `brand-*` tokens, and Institute had the **lowest** legacy-colour density of any role (125 hits / 16 files vs InstituteOwner's 205 / 16)
- `InstituteAdminLayout.tsx` already set `bg-brand-bg font-plex text-brand-text antialiased`, so **body font was never the problem**
- Sidebar and topbar were already restyled; `font-jetbrains` eyebrows present in 14/16 files

Two specific things had been skipped:

1. **Headings never got Manrope.** `font-manrope` appeared in **0 of the 9 main dashboard pages** (only the two Onboarding pages had it), against 10 of 14 for InstituteOwner. Every heading fell back to the default sans while every other role rendered Manrope — enough on its own to read as a different design system with an identical palette.
2. **No dark ink hero.** Only 2 of 11 pages used a `bg-brand-ink` surface vs 7 of 14 for InstituteOwner. `InstituteDashboard`'s hero was a light mint-tint card where the reference (`Diagnosis.tsx`) is a dark ink hero with a JetBrains eyebrow pill and white Manrope display type. That dark anchor is the most recognisable element of the system.

## 6.2 What changed — 12 files, +179/−128

**New shared primitives** in `Institute/components/shared/primitives.tsx`:

- `PageHero` — dark `bg-brand-ink-deep` banner, teal glow, JetBrains eyebrow pill, white Manrope heading, copied from the InstituteOwner reference
- `HeroAction` — translucent button for the dark surface, since solid teal buttons don't read correctly there
- `KpiCard` values now Manrope with `tracking-tight`

**Dark hero applied to 7 pages:** Dashboard, Students, Tutor Accounts, Reports, Settings, Batch Management, Batch Allocation. The Dashboard picked up the `Great to see you, <name>` mint-accent treatment the owner portal uses.

**Typography pass:** 21 headings across the feature picked up `font-manrope`.

**Adoption, before → after:**

| Metric | Institute before | Institute after | InstituteOwner |
|---|---|---|---|
| Files using `font-manrope` | 4 / 16 | **9 / 16** | 12 / 16 |
| Files with a dark hero surface | 4 / 16 | **10 / 16** | 9 / 16 |

## 6.3 A real bug the screenshot caught

Reviewing the live page surfaced a gap in my own change: `HeroBanner` was inside the success branch, so on a failed API load the page rendered a **headless grey skeleton with no header at all**. InstituteOwner renders its hero unconditionally and gates only the content below.

Fixed — `HeroBanner` now takes `summary: InstituteSummary | null`, renders always with fallback title and subtitle, and only the KPI/table block sits behind the loading gate. Institute now matches the owner pattern.

## 6.4 Deliberate exclusions

- **Billings** stays a centered marketing layout — it's a pricing/plans page, not a data dashboard. Manrope pass only; converting it to a left-aligned hero would break a deliberately different page type.
- **Student Progress** got no hero — it composes the already-themed shared instructor components, and the owner's equivalent page has no hero either, so adding one would make Institute the odd one out.

## 6.5 Verification

| Check | Result |
|---|---|
| `npx tsc -p tsconfig.app.json --noEmit` | **No errors in `src/features/Institute/`** |
| `npx vite build` | Clean, built in 4.43s |
| Dev server :8080 console + server logs | No errors |
| Authenticated screens | **Not verified** — behind `RoleProtectedRoute`, needs a login I can't perform |

Pre-existing typecheck errors elsewhere (courses, notes, payment, home, one instructor file) were present before today and are untouched.

---

# 7 · Database divergence — flagged, then stopped

The admin dashboard was failing with three Prisma `P2022` errors: `batches.exam_type` and `institute_students.exam_type` *"does not exist in the current database."*

`npx prisma db push` offered to fix it **by resetting the database**. Inspecting the generated SQL first showed it wanted to do considerably more than add a column:

- `DROP TABLE "exam_configs"`
- drop `engine_version` and `config_version` from `assessment_history`
- drop `exam_id` from 9 tables, replacing it with `exam_type`
- drop `date_of_birth` / `is_minor` from `institute_students`
- drop the `viva_sessions`, `viva_answers`, `guardian_consent` foreign keys

Read against the docs, that list **is the exam-engine v2 groundwork** — `exam_configs`, `exam_id`, `engine_version`/`config_version`, viva tables. So `schema.prisma` was the *older* enum-based version and the database was **ahead** of it. `db push` would have deleted the v2 work, including `record_config_version` — which `EE-01` §8 calls the one thing that cannot be added retrospectively.

Recommended against running it. **Backend resolved the issue separately.**

Worth noting for the record: this is `EE-00` §4.1's argument playing out in practice — the enum-vs-`Exam`-table decision (D2) creating migration cost **before exam 3**, exactly as predicted.

---

# 8 · Open items

| # | Item | Owner |
|---|---|---|
| 1 | **D3** — is `overall` nullable from day one? Only decision gating my work. | Backend |
| 2 | Canonical exam identifier on the wire — `SPOKEN` / `spoken_english` / `SPK-EN` / `SPOKEN_ENGLISH` is a four-way drift. | Backend |
| 3 | `momentum` naming collision (§2.5). | Senior |
| 4 | **Viva consent wording** — needed before Spoken English ships or the calibration corpus is unusable (FE-27). | Senior / counsel |
| 5 | OET counsel outcome. Until then, don't ship "OET" as a display label — it's in `EXAM_LABELS` today. | Senior |
| 6 | Verify every `⚠ verify` number in `FE-01` before it becomes config. | Me + senior |

**Uncommitted at end of day:** 12 modified files under `src/features/Institute/`, plus `docs/exam-engine/` and this report untracked.

**Recommended next:** FE-01 (test runner) and FE-02 (fixtures from the reference impl) — the frontend equivalent of B22: nothing blocks them, and they block everything downstream.
