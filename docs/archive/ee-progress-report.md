# Exam Engine — Progress Report (for the team)

**Branch:** `platform/s3` (both repos, pushed to origin — **not** on `main`/`dev`, so nothing is deployed yet).
**Date:** 2026-08-20.
**Scope of this report:** Phase 5 (the exam engine) from the v2 package (EE-00…EE-05) through the config/scoring/projection layer, plus the Step 0 schema migration that preceded it.

---

## TL;DR

The **entire config-driven scoring engine is built and objectively verified**, and **none of it touches a live path yet**. Exam behaviour is now data (`exam-engine-config.v2.json` → `exam_configs` table); scoring maths is pluggable code selected by name. A CI-runnable vector suite reproduces the reference implementation's numbers: **`npm run exam-engine:vectors` → 79 checks, 0 failures.**

The next phase (Phase 6) is the first that modifies code students actually hit — routing live IELTS scoring through the engine with **zero behaviour change** as the bar. It has not been started and needs a deliberate go-ahead.

---

## Decisions locked (full reasoning in `EE-DECISIONS.md`)

- **D1 — config-as-data.** Exams are declared in a JSON config, seeded into an `exam_configs` table; strategies stay as code, selected by `overall.strategy` name.
- **D2 — `Exam` table replaces the `ExamType` enum.** Exam identity is a validated string id (`ielts`, `spoken_english`, `oet`, `gre`, `gmat`), so a new exam is a data row, not a migration. This reversed the Phase 1 enum — done while all data was still `IELTS`, so it was a zero-reinterpretation retype.
- **D3 — `overall` is nullable** (`overall.mode`). Three of five exams (OET/GRE/GMAT) have no computable headline; the result contract handles that from day one.

---

## What's done

### Step 0 — schema migration (applied to local DB; committed)
- New **`Exam`** registry table + **`ExamConfig`** table (versioned config JSON).
- **`exam_type` (enum) → `exam_id` (string)** on 10 models: `InstituteStudent`, `AssessmentHistory`, `StudentCompetencyMatrix`, `DrillQuestion`, `IAQuestion`, `MockQuestion`, `DiagnosticQuestion`, `Batch`, `InstituteExamSubscription`, `VivaSession`; the `ExamType` enum dropped.
- **Provenance columns** `engine_version` + `config_version` on `AssessmentHistory` and `VivaAnswer`.
- Super-admin controller + frontend `examTypes.ts` updated to the new string ids.
- Migration script: `backend/docs/migrations/s3-pre-push.sql` (maps `SPOKEN`→`spoken_english` etc. so non-IELTS rows survive). **Must be run per environment before `prisma db push`.**
- `SkillType`/`SubSkillType` and the IELTS drill/diagnostic pipeline are **unchanged** — the engine's *components* are a config concept that maps onto existing skill data.

### The engine — `backend/src/exam-engine/`
| Task | File | What it does |
|---|---|---|
| B1 | `loader.ts` | Reads the JSON seed → validates → caches → best-effort seeds `exam_configs`. Wired **fail-loud** into `startServer()` (invalid config = process exits). |
| B2 | `validator.ts` | Faithful port of the reference 40+-rule validator (scales ascending, referenced scales exist, legal gate for live exams, grade bands tile at the scale step, etc.). |
| B3 | `registry.ts` | `ScoringStrategy` selected by name (`band_mean`, `cefr_hybrid`). No `if (examId === …)` anywhere. |
| B4 | `rawScore.ts` | Unit-tagged boundary (`percent`/`band`/`raw`); throws on a unit mismatch instead of computing a wrong-but-plausible number. |
| B5 | `scoring.ts` | `band_mean` (IELTS): mean → half-up round to step → clamp to floor; returns `value_raw` (unclamped, for improvement) + `value` (displayed). |
| B6 | `scoring.ts` | `cefr_hybrid` (Spoken English): average subskill percents → CEFR level, full 6-subskill profile; corrected **provisional** thresholds. |
| B8 | `progression.ts` | Mode-aware envelope: aggregate exams get `overall` + progression; per_component exams get `overall: null` + a `components[]` body. |
| B9 | `progression.ts` / `loader.ts` | Every result stamps `engine_version` + `config_version`; `provenance()` helper for write paths. |
| — | `progression.ts` | Momentum (numeric rounding-interval + ordinal), trend (first-vs-last), the guarded `headline == overall` invariant. |
| — | `publicConfig.ts` | `toPublicConfig()` / `toPublicExamSummary()` — the client projection. |

### API — config projection (additive, no existing route touched)
- `GET /api/exams/public` (unauthenticated) — naming + legal text + status, for marketing pages.
- `GET /api/exams` (authenticated) — full `PublicExamConfig[]` the app renders from.
- The projection **strips** every `_*` key, `thresholds_min_pct` (CEFR cut scores), strategy name + params, and remediation logic. It ships only naming, legal text, components, and scale **shape** (levels/labels/min/max/step). Verified: a student cannot read the percentage needed for B2.

### Verification
- **`npm run exam-engine:vectors` → 79 passed, 0 failed** — reproduces EE-02 §0–§8 against our engine: config validation, IELTS `band_mean` (incl. clamp/`value_raw`), CEFR `pctToLevel` + `cefr_hybrid`, numeric + ordinal momentum (null at cap), trend, the envelope invariant, per_component (`overall: null`) + provenance, and OET grade banding.
- `tsc --noEmit` clean in both repos.
- Config loads with **0 errors / 15 warnings** — the expected set: provisional CEFR, empty-remediation-library on all 15 components, and the IELTS-naming flag.

---

## What is deliberately NOT done yet (boundaries)

- **No live scoring path is routed through the engine.** `diagnosticController`, drills, mocks still use `bandScale.ts` directly. That's Phase 6.
- **CEFR thresholds are provisional** (`PROVISIONAL_UNCALIBRATED`), borrowed from Pearson's GSE mapping; results are flagged `provisional`. Calibration is EE-04 (Q1).
- **OET is `reserved` + `BLOCKED_ON_COUNSEL`** — cannot go live on this config (validator enforces).
- **Viva, policy engine, remediation resolver (B16–B24)** are not built.
- **Frontend still uses the hardcoded `examTypes.ts` list** (interim); it should move to `GET /api/exams`.

---

## Next steps (detailed)

### 1. Phase 6 — extract live IELTS scoring behind the engine ⚠️ first live-path change
The goal: every place IELTS produces a band today calls the engine strategy instead of hardcoded logic, with **byte-for-byte identical output**.
- **Map** all live IELTS scoring sites: `diagnosticController` (per-skill band + overall), drill scoring, `iaController`, mock scoring, `recommendationService`, competency-matrix writes.
- **Route** each through `getStrategy('band_mean')` / the engine, keeping `bandScale.ts` as the underlying maths (the strategy wraps it).
- **Stamp provenance** (`provenance()`) on every `AssessmentHistory` / result write.
- **Prove zero change:** the vector suite stays green, plus spot-check real diagnostic/drill/mock results before vs after on a seeded student. This is the hard gate (Phase 7): IELTS must be identical.
- **Risk:** this touches student-facing scoring. Do it behind the vector checks + a before/after diff, and merge to `dev` for a full manual IELTS run before `main`.

### 2. Finish the remaining Phase 5 backend tasks (B16–B24)
- **B16–B19 Policy:** attempt policy (`school_strict`), graded-attempt ledger (1 IA/session, 1 mock/rolling-30-days), full-mock unlock (`completed ≥ min(6, scheduled)`), timezone windows. Reads the `defaults` block.
- **B20–B22 Viva:** config-driven viva session logic (each answer an independent row → maps to our `VivaAnswer`), wire modules to `delivery`, and **CEFR-tag the speaking bank (B22) — startable immediately, blocks the viva.**
- **B23 Variants** (IELTS Academic/GT, OET profession) and **B24 remediation resolver** (tag-level, resolves `content_refs` to the content table).

### 3. Register Spoken English (Phase 8)
Config is already present (`cefr_hybrid`, provisional thresholds). Needs: the viva engine (B20), CEFR tagging (B22), and the frontend viva UI + CEFR score display. Then it's a live exam. **Get viva-recording consent + retention wording right at launch** (ties to `GuardianConsent` / `VivaAnswer.retention_until`) so early vivas can feed the calibration corpus (EE-04 §3).

### 4. Frontend
- Consume `GET /api/exams` — replace the hardcoded `examTypes.ts` labels/availability with server data (keep the union only for typing).
- **Per-component result UI** — render a result with `overall: null` (OET/GRE/GMAT); add a test for it (most likely null-deref site).
- CEFR score display (level + within-level progress + the honest provisional notice).

### 5. Deploy path for this branch
`platform/s3` is safe to run but **requires the Step 0 migration on each environment first**: run `s3-pre-push.sql` → `npx prisma db push` on that env's DB, else the Prisma client (expecting `exam_id`, no enum) mismatches the DB. Sequence when ready: `platform/s3` → merge to `dev` (run migration on dev DB, verify) → `main`.

### 6. Founder-open items (build the field, decide later — none block)
Mock-unlock fallback (`min(6, scheduled)` vs strict 6), B2C policy gap, unused-entitlement lapse/carry, B2C grace retake, OET naming (counsel), CEFR calibration budget. See `EE-DECISIONS.md §5`.

---

## How to run / verify locally
```bash
cd backend-study-mentor
npm run exam-engine:vectors        # 79/79 — the engine's objective gate
# after Step 0 migration + boot under Node 22:
#   GET /api/exams/public          # unauth projection
#   GET /api/exams                 # auth projection
```

**Bottom line:** the engine and its config are done and proven; the risky, valuable next step is Phase 6 (IELTS extraction), after which new exams are largely configuration.
