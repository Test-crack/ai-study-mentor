# IELTS Extraction — Phased Implementation Plan (checkpointed)

Companion to [IELTS-EXTRACTION-GUIDELINE.md](./IELTS-EXTRACTION-GUIDELINE.md). This is the *execution* plan: the work is broken into **Parts**, each ending at a **stable checkpoint** — IELTS fully working, the tree committable and deployable, nothing half-migrated. After each Part you verify IELTS yourself (steps given), and the plan states **exactly how much of a new exam is dashboard vs config vs code at that point.**

## How to read each Part
- **Goal** — what this Part delivers.
- **Touches** — files.
- **Stability** — why IELTS still works / what can't have changed.
- **You verify** — the concrete check you run before we move on.
- **New-exam status here** — for onboarding **Spoken English** next, split into 🟢 dashboard / 🟡 config (codebase data edit) / 🔴 code (engineering).

> **The three axes of "adding an exam"** — keep these separate, they progress independently:
> 1. **Register + sell** — the exam exists in the registry + institutes subscribe.
> 2. **Score** — raw performance → bands/levels/overall.
> 3. **Deliver + AI-grade** — which components exist, how they render, and the AI rubric.
> Phase 6 makes **axis 2 (scoring) config-driven.** Axes 1 and 3 are addressed separately (noted per Part).

---

## Part 0 — Baseline `dev-stable-2026-08-21` ✅ DONE
- **Goal:** stable rollback point; engine built (Phases 1–5) but **not yet wired into IELTS scoring**.
- **Stability:** IELTS runs entirely on `bandScale.ts` + controllers, as it always has.
- **You verify:** already done — dev site works, full IELTS run scores normally.
- **New-exam status here:**
  - 🟢 **Register + sell:** an exam already in config (e.g. `spoken_english`, `oet`) is seeded to the `exams` table on boot; institutes can be subscribed from the Super-Admin portal.
  - 🔴 **Score:** none — a non-IELTS exam has `strategy: null` / `per_component`; nothing computes its scores.
  - 🔴 **Deliver + AI-grade:** none.

---

## Part 1 — Engine scoring surface complete + parity-proven (NO call sites touched)

### Part 1a ✅ DONE (verified)
- **Goal:** config-drive **level / difficulty / weakness-gap**.
- **Touched:** `exam-engine-config.v2.json` (`ielts_band.proficiency_bands` + `weakness_gap`), `scoring.ts` (`proficiencyLevel`/`difficulty`/`weaknessGap`), `validator.ts`, `publicConfig.ts`, `index.ts`, `vectors.check.ts` (§9 parity).
- **Stability:** pure additions; no existing call site calls the new functions yet.
- **Verified:** `npm run exam-engine:vectors` → **84/84**, incl. `107 bands identical to bandScale, 0 mismatches`; `tsc --noEmit` → clean.

### Part 1b — component & overall scoring surface ✅ DONE (verified)
- **Goal:** add `scoreComponent(examId, componentId, raw)` so *every* IELTS number can be produced from config. Add an **`internal` RawScore unit** (for the AI 1–10 scale) + `raw_input` config on writing/speaking. `band_mean`/`cefr_hybrid` already exist for overall.
- **Done:** `exam-engine/component.ts` (`componentBand`/`scoreComponent`, delegates to bandScale, dispatches on unit); `internal` unit in `types.ts`/`rawScore.ts`; `raw_input` config; validator + §10 vectors. **Verified:** `tsc` clean; vectors 88/88 incl. `980 component inputs identical to bandScale, 0 mismatches`. No call sites migrated — engine surface is now complete; IELTS runtime unchanged.
- **Touches:** `types.ts` (RawScore + `internal`), `rawScore.ts` (extractor), `scoring.ts`/new strategy fn, `registry.ts` (`consumes`), config `raw_input` on writing/speaking, `vectors.check.ts` (component parity vs `fractionToBand`/`internalToBand`/`toBand`).
- **Stability:** still **no call site migrated** — IELTS runtime path unchanged.
- **You verify:** `npm run exam-engine:vectors` green (new component-parity section 100%); `tsc` clean. Nothing to check on the live site — behaviour is unchanged by construction.
- **New-exam status here:**
  - 🟢 **Register + sell:** unchanged (works).
  - 🟡 **Score:** the engine can now produce a full numeric or CEFR score **from config alone** — but IELTS controllers still call `bandScale`, so a new exam can't yet ride a shared scoring path until Part 4 makes the controllers engine-driven.
  - 🔴 **Deliver + AI-grade:** unchanged.

---

## Part 2 — Migrate the targeting sites (rows 1–5) — *lowest risk* ✅ DONE (verified)
- **Goal:** point difficulty/level/weakness-gap **consumers** at the engine: `iaController`, `recommendationController`, `recommendationService`, `drillController`, `subskillSelector`.
- **Done via** an examId facade (`exam-engine/proficiency.ts`: `examDifficulty`/`examWeaknessGap`). Call sites now read the cuts from `ielts` config. **Verified:** `tsc` clean; vectors 87/87 (facade resolves `ielts_band`, 107-band parity 0 mismatches).
- **Stability:** these drive **drill/IA targeting and recommendation difficulty only — never a stored or displayed band.** Engine output is parity-proven identical (Part 1a), so targeting decisions are unchanged.
- **You verify (dev):** for a seeded student, drills target the same sub-skills and recommendation difficulty (BEGINNER/…) reads the same as before. Quick before/after on one student.
- **New-exam status here:**
  - 🟡 **Score (targeting slice):** a new exam's drill difficulty + weakness targeting now come straight from its config cuts — **zero code** for that slice.
  - Register/sell 🟢, full scoring 🟡, deliver/grade 🔴 — unchanged.

---

## Part 3 — Migrate AI-service band maths (rows 6–7) 🟡 CODE DONE, needs dev E2E
- **Goal:** in `ieltsWritingService` + `ieltsSpeakingService`, route the **mean-of-4** aggregation through the engine (`scoreComponentFromSubskills` → `band_mean` on `ielts_band`). **The rubric/prompt, word-count penalties, content-floor, and per-criterion clamps stay exactly as they are** (Layer B, untouched).
- **Done:** both services now call the engine for the component band. **Locally verified:** `tsc` clean; vectors 89/89 incl. §11 `14641 criterion quads: band_mean == toBand(avg), 0 mismatches`.
- **⏳ Dev E2E to confirm before trust:** submit one Writing + one Speaking task on dev; band + criterion breakdown must match a pre-migration snapshot. (The services now require the engine loaded at boot — it is, via `loadExamEngine()`.)
- **Stability:** only the arithmetic that turns already-graded criteria into a band moves; the AI judgement is identical.
- **You verify (dev):** submit one Writing and one Speaking task; the returned band + criterion breakdown match a pre-migration snapshot.
- **New-exam status here:**
  - 🟡 **Score:** band aggregation for AI components is now engine-driven (config picks the scale/strategy).
  - 🔴 **AI-grade:** the **rubric itself is still per-exam code** — a new AI-graded exam brings its own grading module. (This is the honest, unavoidable code cost for AI exams.)

---

## Part 4 — Migrate the student-facing scorers + provenance — 🟡 CODE DONE, needs dev E2E
Done as three sub-checkpoints (all `tsc` clean, vectors 89/89):
- **4a — `diagnosticController`** ✅ code: L/R via `scoreComponent({unit:'raw'})`, `resolveLevel` via `examProficiencyLevel`, `assessment_history` stamps `provenance()`.
- **4b — `mockController`** ✅ code: L/R via `scoreComponent`; **headline `real_band` via config-driven `scoreOverall` (band_mean)**; `assessment_history` stamps provenance. (`MockSession` has no provenance columns → not stamped; W/S blend + per-skill mean stay on `bandScale` — Layer B.)
- **4c — `iaProcessor`** ✅ code: `assessment_history` stamps provenance; blend 2:1 + smoothing 0.4/0.6 untouched (Layer B).
- **⏳ Dev E2E to confirm before trust:** full IELTS journey (diagnostic → drills → IA → mock) on a seeded student; every band/level/difficulty must match a pre-migration snapshot, and `engine_version`/`config_version` must now be populated on new `assessment_history` rows.
- **Stability:** each sub-part is a pure function swap delegating to the same maths; provenance is additive (columns already exist).
- **You verify (dev):** run the **full IELTS journey** (diagnostic → drills → IA → mock) on a seeded student; snapshot every band/level/difficulty before and after — **must match**. Confirm `engine_version`/`config_version` are now populated on new result rows.
- **New-exam status here:**
  - 🟢 **Score:** overall aggregation + component production are now fully engine-driven. A new **numeric or CEFR** exam that reuses these controller flows scores **end-to-end from config, zero scoring code.**

---

## Part 5 — Tidy + frontend exam list from the API
- **Goal:** drop now-dead direct `bandScale` imports (or leave `bandScale` as the delegated impl). Frontend sources the exam list from `GET /api/exams` (Phase-5 B1) instead of the hardcoded `examTypes.ts`, so the UI can't drift from the registry.
- **You verify:** full regression green; a config-only exam appears in the UI automatically.
- **Merge to `dev` → run the manual IELTS regression there → then `main`.** No new exam registers as `live` until this whole phase is green (hard gate).

---

## After Phase 6 — onboarding **Spoken English**: the code-vs-dashboard breakdown

This is the concrete answer to "how much is code, how much is dashboard" for the next exam. Spoken English is **CEFR-based** (`cefr_hybrid` + `cefr_6` scale already exist), and it's **AI-graded** (speaking).

| Axis | Work | Where | Effort |
|---|---|---|---|
| Register the exam (id, label, status, availability) | 🟢 Dashboard¹ *or* 🟡 config entry | Super-Admin *(if create-exam UI built)* / `exam-engine-config.v2.json` | minutes |
| Subscribe institutes | 🟢 Dashboard | Super-Admin → Subscriptions | minutes |
| Scale + strategy | 🟡 Config — reuse `cefr_6` + `overall.strategy: "cefr_hybrid"` | config file (validator + vectors green) | small, no logic |
| Components / subskills + thresholds | 🟡 Config — declare the CEFR subskills + `thresholds_min_pct` | config file | small, no logic |
| Overall/level/targeting scoring | 🟢 **Free** — engine already does CEFR via config after Phase 6 | — | none |
| Speaking AI grading (the rubric) | 🔴 **Code** — a CEFR speaking grading adapter (bespoke criteria) | new module, selected by config | real engineering |
| Delivery / runners (if its components render differently than IELTS) | 🔴 **Code** — only if the flow shape differs | controllers/runners | depends |

¹ **Today there is no "Create Exam" UI** — an exam is created by adding it to the config file, which auto-seeds the registry on boot. A Super-Admin *Create Exam* screen (writing the registry row + declarative config through a guarded API) is a **separate frontend build** we can schedule; until then, exam creation is a 🟡 config edit. Tell me if you want that UI in scope.

**Rule of thumb for any new exam after Phase 6:**
- **Numeric or CEFR, MCQ-only** → 🟢🟡 config + dashboard, **no scoring code**.
- **Adds AI grading** → the above **+ one bespoke grading module** (🔴), because a rubric is domain knowledge, not a threshold.

---

## Checkpoint ledger (what's committable & green at each step)

| Part | IELTS stable? | Verify | New-exam scoring |
|---|---|---|---|
| 0 baseline | ✅ | dev site | none |
| 1a ✅ | ✅ | vectors 84/84 | level/diff/gap config-ready |
| 1b | ✅ | vectors + tsc | full score config-ready (not yet wired) |
| 2 | ✅ | targeting diff | targeting via config |
| 3 | ✅ | W/S band snapshot | AI band-agg via config |
| 4a/b/c | ✅ | full journey diff | **end-to-end via config** |
| 5 | ✅ | full regression + UI | new exam visible from config |
