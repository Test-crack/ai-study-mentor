# Exam Engine v2 — Review Summary & Decisions

**Inputs reviewed:** the 9-file `to-be-reviewed/` package (EE-00…EE-05, `exam-engine-config.v2.json`, `reference-impl.js`, `run-vectors.js`) + our own `phase5_implementation_plan.md` and the current `platform/s2` codebase (Phases 1–4 shipped).
**Author of decisions:** backend (full codebase context).
**Verdict:** adopt v2 wholesale. It supersedes my Phase 5 plan and is a genuine improvement. Three decisions are load-bearing; one of them (D2) reverses part of our Phase 1 work — flagged prominently below.

---

## 1 · What we received

| File | What it is | Our stance |
|---|---|---|
| `EE-00_Review_and_Corrections.md` | Line-by-line review of our v1 plan; 18 findings, 3 blocking | **Accept** — findings are correct and evidenced |
| `EE-01_Exam_Engine_Spec_v2.md` | The v2 spec: Component/Scale/Aggregation, strategies, envelope | **Adopt as the spec** |
| `EE-02_Test_Vectors_v2.md` | 75 corrected test vectors | **Adopt as our contract tests** |
| `EE-03_Backend_Task_Board_v2.md` | B1–B24, sequenced for one backend dev | **Adopt as the Phase 5 board** (adapted to our repo) |
| `EE-04_CEFR_Calibration_Protocol.md` | The real CEFR calibration study (9–11 weeks) | **Accept**; ship provisional, calibrate in Q1 |
| `EE-05_Change_Brief_for_Backend.md` | Founder's summary of what changed + the 3 decisions | **Accept** |
| `exam-engine-config.v2.json` | The 5-exam config (data source of truth) | **Adopt as the seed** |
| `reference-impl.js` | Executable maths + 40-rule validator | **Port the maths**, not the style |
| `run-vectors.js` | Runs all 75 vectors | **Put in CI** |

---

## 2 · The core shift (v1 → v2)

My v1 plan organised an exam as "four language skills" with a `ScoringStrategy { formatSkillScore, overall }` and a **TypeScript module per exam** in a code registry. v2 replaces this with **three orthogonal concepts** and **config-as-data**:

> A **component** is a unit of the exam. A **scale** is how a number is expressed. An **aggregation rule** is how components combine — *or that they do not*.

This is strictly better: it fits GRE/GMAT (no listening/speaking) and makes "exam N = a config object" real. My "engine in backend + client syncs via projection + scoring server-side + IELTS byte-for-byte + strategy-by-name" calls were all kept (EE-05 §1). What changed is the *shape* of the config and three structural facts I missed.

---

## 3 · How v2 lands on our Phase 1–4 code

| Our shipped artefact | v2 impact | Action |
|---|---|---|
| `enum ExamType { IELTS SPOKEN OET GRE TOEFL PTE }` (Phase 1) | **Removed** — becomes an `Exam` table + string `exam_id`. See **D2**. | Migrate (now, while all data is `IELTS`) |
| `exam_type ExamType` on 8 tables (Phase 2/3.5/4) | Column type enum → `String` FK to `Exam` | Alter columns (data is all `'IELTS'`) |
| `InstituteExamSubscription.exam_type` (Phase 3.5) | Same retype; **commercial layer unchanged** | Retype to `exam_id` |
| `VivaSession/VivaAnswer` (Phase 4) | `VivaAnswer.retention_until` now clearly serves the CEFR consent/retention need (EE-04 §3) | Keep; wire consent later |
| `GuardianConsent` + DPDP fields (Phase 4) | Complements EE-04's "get viva-recording consent right at launch" | Keep |
| `SkillType` / `SubSkillType` enums (Phase 1) | **Kept.** The engine's *components* are a config concept; the IELTS drill/diagnostic pipeline keeps using skill columns. Engine maps config components → existing skill data. | No change |
| `examTypes.ts` (frontend, Phase 3.5) | Keep the union **only** for strategy selection; exam identity becomes a validated string sourced from `/api/exams`; labels/legal come from the server, not hardcoded | Refactor to server-sourced |
| `superadminController` exam selection (Phase 3.5) | Unaffected in shape; `exam_type` field becomes `exam_id` string | Retype |

**Coexistence principle:** the engine config says *how an exam scores*; `InstituteExamSubscription` says *which exams an institute may offer*. Two separate concerns, both data-driven. No conflict.

---

## 4 · Major decisions

### D1 — Config-as-data (not a TS module per exam) ✅ ADOPT
Exam declaration lives in an `exam_configs` table, keyed `(exam_id, config_version)`, **seeded from `exam-engine-config.v2.json`**. The engine reads the table; the JSON stays in the repo as the reviewable seed. Strategies (`band_mean`, `cefr_hybrid`) stay as **code, selected by `overall.strategy` name** — different maths, not different parameters.
**Why:** my v1 file-per-exam registry made "exam #3" a code change, defeating the entire thesis. DB-backed config also means the coming CEFR threshold recalibration and OET regulator-target edits are **data changes, not deploys**. This supersedes my `phase5_implementation_plan.md`.

### D2 — Replace `ExamType` enum with an `Exam` table ✅ ADOPT **NOW** (reverses part of Phase 1)
```prisma
model Exam {
  id       String @id           // "ielts", "spoken_english", "oet", "gre", "gmat"
  label    String
  status   String               // live | reserved | disabled
  // exam_configs (exam_id, config_version) holds the versioned JSON
}
```
Every `exam_type` column becomes `exam_id String` referencing `Exam.id`.
**Why now:** our enum is `{IELTS SPOKEN OET GRE TOEFL PTE}` but the config needs `gmat` (absent) and doesn't use `TOEFL`/`PTE` — registering GMAT would need a migration, i.e. the config-only promise failing on the very first new exam. There's also a 3-way identifier collision today (`enum SPOKEN` vs config `spoken_english` vs short code `SPK-EN`). **The migration is cheapest right now**: every `exam_type` column on `platform/s2` holds only `'IELTS'` (defaults), so it's a type change with zero data reinterpretation. After exam 3 ships with real data it becomes a migration under load.
**This is the one call that undoes shipped work (the Phase 1 enum).** I'm making it because the window is ideal and the thesis demands it — but it's the item most worth a veto if you disagree. Fallback if we defer: add `gmat` (+ any roadmap exams) to the enum now and keep `prisma_enum` in each config as the bridge (the config already carries `prisma_enum`).

### D3 — `overall` is nullable from day one (`overall.mode`) ✅ ADOPT
The result envelope's `overall` is nullable, gated by `overall.mode: "aggregate" | "per_component"`.
**Why:** OET issues **no** overall grade (by design), GRE has no official composite, GMAT's total isn't computable — 3 of 5 exams. If the envelope assumes a headline, OET (exam 3) forces a rewrite of the result contract and every consumer. Cheapest to build in now. **We will not** invent a GMAT total or enable the GRE V+Q sum.

### Derived decisions (not optional, follow from D1–D3)
- **Provenance columns** — every stored result records `engine_version` + `config_version`; `rescore_historical_on_config_change: false`. **Must land before the first CEFR result is stored** — the only item that can't be added retroactively. Add to `AssessmentHistory`, viva results, and any new result rows.
- **Two config endpoints** — `GET /api/exams/public` (unauth: naming + legal + status, for marketing) and `GET /api/exams` (auth: `PublicExamConfig[]`). `toPublicConfig()` strips every `_*` key, all `thresholds_min_pct`, and strategy params. **Never serve the config verbatim** (it contains the cut scores + counsel notes).
- **RawScore boundary** — `{unit:'percent'|'band'|'raw', …}`; strategies declare `consumes`; the validator throws on unit mismatch at load. Closes the silent 0–1 / 0–9 / 0–100 mismatch.
- **Progression split** — `headline` (copied from `overall`, guarded) vs `momentum` (free to differ). Momentum bar spans the rounding interval; `null` at the cap, never `1.00`.
- **IELTS unchanged** — `band_mean` wraps existing `bandScale.ts` byte-for-byte; returns `value_raw` (unclamped, for improvement) + `value` (clamped to `report_floor 4.0`, for display).
- **CEFR ships provisional** — `PROVISIONAL_UNCALIBRATED`, `provisional: true` on results, calibrate in Q1 (EE-04). **Get viva-recording consent + retention wording right at launch** so every early viva becomes benchmark material (ties to our `GuardianConsent` / `VivaAnswer.retention_until`).
- **Legal** — OET stays `reserved` + `BLOCKED_ON_COUNSEL` ("Healthcare English Preparation"); CEFR framed as *aligned/estimated*, never *certified*; the legal block is validator-enforced (a `live` exam with `BLOCKED` legal fails config load).
- **CI** — `run-vectors.js` (75 vectors) runs in CI; config validation fails the build on load errors.

---

## 5 · Open items for the founder (build the field, decide later — none block starting)

| # | Item | Interim default |
|---|---|---|
| 1 | Full-mock unlock: `completed >= min(6, scheduled)` or strictly six? | fallback enabled |
| 2 | B2C has no scheduler → `school_strict` never forfeits *and* mock never unlocks | flagged `_b2c_gap` |
| 3 | Unused mock entitlement at window roll — lapse or carry? | lapse |
| 4 | B2C grace retake (paid forfeited attempt = refund risk) | 0 for institutes; field exists |
| 5 | OET naming — counsel question, real chance of "no" | `BLOCKED_ON_COUNSEL` |
| 6 | IELTS "IELTS Preparation" vs `may_use_mark_in_product_name:false` | validator warns |
| 7 | CEFR calibration budget (30 = pilot, not calibration) | provisional thresholds |

---

## 6 · Net effect on the plan

Phase 5 is **re-scoped to EE-03's B1–B24**, executed in our backend, with D1/D2/D3 baked in and the schema migration (enum → `Exam` table + provenance columns) as the first step. Effort is ~neutral vs my v1 plan (components rename is mechanical; `overall.mode` and provenance are new but small). The honest new cost is **frontend item renderers** (quant, Data Insights, OET roleplay) — but those are exam 4+ and out of Phase 5 scope. See the rewritten `phase5_implementation_plan.md`.
