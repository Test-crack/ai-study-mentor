# Exam Engine — Backend Task Board (v2)

**Reads with:** `exam-engine-config.v2.json` · `EE-01_Exam_Engine_Spec_v2.md` · `EE-02_Test_Vectors_v2.md` · `reference-impl.js`
**Scope:** backend only. §0 is the contract you hand to frontend.
**Written so the backend dev can work solo.**

---

## §0 · Three decisions that must be made before any code

These are load-bearing. Building without them means rework, not adjustment.

| # | Decision | Recommendation | Cost of getting it wrong later |
|---|---|---|---|
| **D1** | **Config as data, or a TypeScript module per exam?** The plan doc and the spec describe different engines (EE-00 §1). | **Config as data**, seeded from JSON into an `exam_configs` table. Strategies stay as code, selected by name. | Every threshold change and regulator-target update becomes a deploy. The "config-only exam #3" DoD becomes unmeetable. |
| **D2** | **Prisma `ExamType` enum, or an `Exam` table?** GMAT is not in the enum (EE-00 §4.1). | **`Exam` table** with a string FK. If deferred: add every planned enum value now, and keep `prisma_enum` in each config. | Cheap now. After exam 3 ships with production data, it is a data migration under load. |
| **D3** | **Is `overall` nullable in the envelope?** OET, GRE and GMAT have no computable headline (EE-00 §2). | **Yes — `overall.mode` from day one.** | OET forces a rewrite of the result contract and every consumer of it. This is the single most expensive item to retrofit. |

---

## §1 · API contract

**Config fetch — two endpoints, not one.**

| Route | Auth | Returns |
|---|---|---|
| `GET /api/exams/public` | none | `exam_id`, naming, legal text, `status`. For marketing pages that render before login. |
| `GET /api/exams` | authenticated | Full `PublicExamConfig[]` — components, labels, scale *shape*, targets, module flags. |

**Never serve the config verbatim.** `toPublicConfig()` strips every key beginning `_`, all `thresholds_min_pct`, and all strategy params. Serving thresholds both contradicts "scoring never leaves the server" and lets a student read the exact percentage needed for B2.

**Result envelope** — see EE-01 §6. Two things v1 got wrong:

- **`overall` is nullable.** Null when `overall.mode === "per_component"`.
- **`progression.headline` is guarded; `progression.momentum` is not.** v1's single `progression.current` conflated them and tripped its own invariant on a legitimate result.

Field naming: **`name`** = what a thing is called, **`display`** = the rendered value. v1 used `label` for both, in the same payload.

---

## §2 · Tasks

### Foundation

| # | Task | Depends | Notes |
|---|---|---|---|
| **B1** | Config loader + `exam_configs` table + seed from JSON | D1 | Load, validate, cache. Fail startup on validation error. |
| **B2** | Config validator | B1 | Port `reference-impl.js#validateConfig` — 40+ rules. Every negative case in EE-02 §0 must be rejected. **Grade bands tile at the scale's step, not at 1.** |
| **B3** | `ScoringStrategy` interface + registry | §1 | Selected by `overall.strategy`. **No `if (examId === …)` anywhere.** Include `consumes: RawScore['unit']` and validate the unit at the boundary. |
| **B4** | `RawScore` boundary type + conversion | B3 | The three-domain problem (EE-00 §4.2). A unit mismatch must throw on load, not compute a plausible wrong number. |

### Scoring

| # | Task | Depends | Notes |
|---|---|---|---|
| **B5** | Strategy `band_mean` | B3 | Half-up rounding, floor clamp, **and return `value_raw` unclamped**. Vectors: EE-02 §1–2. |
| **B6** | Strategy `cefr_hybrid` | B3 | `pctToLevel` + `withinLevelProgress` + average-then-map + full 6-subskill profile. **Use the corrected thresholds.** Vectors: EE-02 §3–4. |
| **B7** | `per_component` result path | B3, D3 | The no-headline case. **Do not treat as an edge case** — it is three of five exams. |
| **B8** | Result envelope builder | B5, B6, B7 | Same envelope all modes. `overall` nullable. |
| **B9** | Provenance on every result | B8 | Record `engine_version` + `config_version`. **Must land before the first CEFR result is stored** (EE-01 §8). |

### Progression

| # | Task | Depends | Notes |
|---|---|---|---|
| **B10** | Momentum — numeric | B8 | Rounding-interval model. **Null at the cap, never 1.00.** Vectors: EE-02 §5a. |
| **B11** | Momentum — ordinal | B8 | Vectors: EE-02 §5b. |
| **B12** | Invariant guard | B10, B11 | Guards `headline` only. `headline` is *copied* from `overall`, making it structurally true. |
| **B13** | Baseline capture from diagnostic | B8 | Per student **per exam**. **Must use the same `overall.components` rule as a live assessment** — otherwise every progression number is wrong. |
| **B14** | Improvement since baseline | B13 | Computed on `value_raw`, displayed on `value`. |
| **B15** | Trend | B8 | First-versus-last over the window. **Within one instrument type only.** |

### Policy

| # | Task | Depends | Notes |
|---|---|---|---|
| **B16** | Attempt policy engine | B1 | `school_strict`, forfeit on missed window, no retake. Read from `defaults`, allow per-exam override. |
| **B17** | Graded-attempt ledger | B16 | 1 IA per scheduled session; 1 mock per rolling 30 days. Forfeited IAs do not count toward unlock. |
| **B18** | Full-mock unlock rule | B17 | `completed >= min(6, scheduled_in_window)`. **Confirm the `or_all_scheduled_in_window` fallback with the founder** — without it, an institute scheduling five IAs locks every student out permanently. |
| **B19** | Window/timezone resolution | B17 | Rolling 30 days in the institute's timezone. `src/lib/timezone.ts` exists. |

### Delivery

| # | Task | Depends | Notes |
|---|---|---|---|
| **B20** | Viva session logic | B1 | Config-driven `max_questions`/`min_questions`; bank filtered by `required_tag: cefr`. **Each answer is an independent row** — one failed question must not invalidate the session. |
| **B21** | Wire modules to `delivery` | B1 | IA and full mock read `components[].delivery` + `modules[].speaking_delivery`. No hard-coding. |
| **B22** | CEFR tagging on the speaking bank | — | Blocks B20. **Startable immediately, no dependencies.** |
| **B23** | Variant scoping | B1 | Content selection filters on variant (IELTS Academic/GT; OET profession). Schema has no variant column yet. |
| **B24** | Remediation resolver | B8 | Evaluate triggers, resolve `content_refs` against the content table, cap at `max_items`. **Tag-level remediation is what makes Listening and Reading coachable** — they have no subskills. |

---

## §3 · Sequencing for one developer

```
Week 1   D1/D2/D3 answered  →  B1 → B2 → B3 → B4
Week 2   B5, B6 in parallel  →  B7 → B8 → B9
Week 3   B10 → B11 → B12,  with B13/B14/B15 alongside
Week 4   B16 → B17 → B18 → B19
Week 5   B20, B21, B23, B24
Anytime  B22 (CEFR tagging) — no dependencies, blocks B20, start it now
```

Everything through week 3 is unit-testable against `run-vectors.js` with no frontend and no live API.

---

## §4 · Definition of done

- No exam name, label, legal string, scale value or threshold in code. **Grep for `IELTS`, `B1`, `6.5`, `41.25`** — hits in `src/` outside the config loader mean the abstraction leaked. Legitimate exceptions: the strategy *name* registry, and the Prisma enum until D2 is resolved.
- A hypothetical exam #6 whose components use existing scales, aggregation and delivery types is **config-only, zero code change**. If not, the strategy slot leaked.
- **`run-vectors.js` green in CI.** 75 vectors.
- Every negative case in EE-02 §0 is rejected at config load.
- `progression.headline.value` always equals `overall.value`; `momentum` is free to differ.
- The assessed score is never inflated by the progression layer.
- **An exam with `overall.mode: "per_component"` produces a valid, renderable result with `overall: null`.**
- Every stored result carries `engine_version` and `config_version`.

---

## §5 · Still blocked on the founder

Build the fields now, fill them later. None of these block starting.

| # | Item | Default until decided |
|---|---|---|
| 1 | **Unlock fallback** — is `completed >= min(6, scheduled)` right, or is six strictly six? | fallback enabled |
| 2 | **B2C attempt policy** — `school_strict` has no meaning without a scheduler, so the mock never unlocks. | flagged `_b2c_gap`; decide before B2C launch |
| 3 | **Unused mock entitlement** — lapse or carry at window roll? | lapse |
| 4 | **B2C grace retake** — a paid forfeited attempt with no retake is a refund conversation. | 0 for institutes, field exists for B2C |
| 5 | **OET legal** — CBLA publishes no nominative-use carve-out. Counsel question with a real chance of "no". | `BLOCKED_ON_COUNSEL`; config load fails if set live |
| 6 | **IELTS naming** — `may_use_mark_in_product_name: false` vs display name "IELTS Preparation". | validator warns |
| 7 | **CEFR calibration budget** — 30 samples is a pilot, not a calibration. | thresholds marked `PROVISIONAL_UNCALIBRATED`; see EE-04 |

---

## §6 · What is not in this board

Three components across the five configured exams have **no existing runner**, and no amount of config generalisation makes them free. They are frontend work, sized separately:

1. **Quantitative item renderer** — GRE Quant, GMAT Quant. Maths notation, figures, quantitative-comparison layout, on-screen calculator. Built once, serves both.
2. **Data Insights renderer** — GMAT. Sortable tables, multi-source tabbed panels, chart interpretation, two-part answer grids. Five interaction patterns with no analogue in the platform; the most expensive item in the config.
3. **OET Speaking roleplay UI** — reserved as an enum value in the frontend, never built.

The other 15 components reuse existing runners via the `modality` tag. **The engine stops being the bottleneck; item rendering becomes it.** That is the honest shape of "no future rewrites" — worth stating so nobody is surprised at exam 4.
