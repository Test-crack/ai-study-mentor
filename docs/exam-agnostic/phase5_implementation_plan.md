# Phase 5 — The Exam Engine (plain-language plan)

**What this is:** the layer that turns "which exam is this and how does it score?" from **code** into **data**. Today IELTS scoring is hard-wired. After Phase 5, an exam is a JSON config the engine reads — so adding Spoken English (and later OET/GRE/GMAT) is mostly editing data, not rewriting code.

**Source docs:** decisions in `EE-DECISIONS.md`; the team's spec in `EE-01`, test vectors `EE-02`, task board `EE-03`, CEFR study `EE-04`, the config `exam-engine-config.v2.json`, and the executable reference `reference-impl.js` (+ `run-vectors.js`).

---

## 1 · The mental model — three ideas

The whole design rests on separating three things that v1 (my first plan) had mashed together. Keep these separate and every new exam becomes a config entry.

**① Component** — *a unit of an exam.* IELTS has 4 (Listening, Reading, Writing, Speaking). Spoken English has the same 4 but only Speaking counts toward the score. GRE has 3 (Verbal, Quant, Analytical Writing) — no listening or speaking at all. A component has a `modality` tag (reading/listening/speaking/…) that only decides **which UI renderer** shows it — it carries no scoring meaning.

**② Scale** — *how a number is expressed.* IELTS uses `ielts_band` (0–9, steps of 0.5). Spoken English uses `cefr_6` (A1…C2 levels). OET uses `oet_500` (0–500 + letter grades). Scales are defined once at the top of the config and referenced by name, so many components can share one.

**③ Aggregation** — *how components combine into a headline — or that they don't.*
- `aggregate` + a strategy → one headline number (IELTS = mean of 4; Spoken = a CEFR construct).
- `per_component` → **no headline at all.** This is not "missing" — it's correct for OET (issues no overall grade, by design), GRE (three independent measures) and GMAT (total isn't computable).

> Concrete: IELTS = 4 components, `ielts_band` scale, `aggregate` (mean). Spoken English = 4 components but only Speaking is `assessed`, `cefr_6` scale, `aggregate`. OET = 4 components, `oet_500` scale, `per_component` (no headline).

---

## 2 · The two ideas that make it an "engine"

**A. Exam declaration is data; scoring maths is code.**
The *facts* about an exam (its components, scales, legal text, thresholds, policy) live in the config. The *maths* (how you turn scores into a band or a level) is a small set of **strategy** functions in code, and the config picks one **by name**. There are exactly two strategies:
- `band_mean` — average the component bands, round half-up, clamp for display (IELTS).
- `cefr_hybrid` — average the sub-skill percents, map to a CEFR level, keep the full profile (Spoken English).

A future exam that scores *like* one of these = **config only, zero code**. A future exam that scores *differently* = one new strategy function. Never `if (exam === 'ielts')` scattered through the code — that's the thing we're eliminating.

**B. The config lives in the database, seeded from the JSON.**
An `exam_configs` table holds the config, versioned. The JSON file stays in the repo as the reviewable seed. Why the table: the CEFR thresholds *will* change after calibration, and OET's regulator targets will change — those must be **data edits, not deploys**.

---

## 3 · Concepts you'll meet in the code (mini-glossary)

- **RawScore + unit** — every score entering the engine is tagged `percent` (0–100), `band` (0–9), or `raw` (correct/total). v1 silently mixed 0–1 fractions, 0–9 bands and 0–100 percents — a mismatch produces *wrong-but-plausible* scores nobody notices for months. Now the strategy declares what unit it eats, and the loader throws on a mismatch.
- **`overall.mode` + nullable `overall`** — the result may legitimately have no headline (OET/GRE/GMAT). Every consumer must handle `overall: null`.
- **headline vs momentum** — the score screen shows two things: the **headline** (the true assessed band/level, copied from `overall`, never inflated) and a **momentum** bar (progress toward the next rung — *allowed* to differ). v1 used one field for both and contradicted itself. Worked example: a continuous mean of 5.90 → **headline 6.0** (already rounded up) and momentum "30% of the way to 6.5" — not "80% toward 6.0", which would be nonsense.
- **`value_raw` vs `value`** — IELTS clamps the *displayed* band to a floor of 4.0, but improvement-since-baseline is computed on the **unclamped** `value_raw`. Otherwise a student who truly went 3.0 → 4.5 would show +0.5 instead of +1.5 — the floor would eat the exact signal we're trying to show.
- **Provisional CEFR** — our CEFR cut scores are borrowed from Pearson's GSE mapping for now (`PROVISIONAL_UNCALIBRATED`); results carry `provisional: true` until the calibration study (EE-04) runs in Q1. This is honesty by design, not a shortcut.
- **Provenance** — every stored result records the `engine_version` + `config_version` it was scored under. When thresholds change post-calibration, old results stay interpretable instead of being silently reinterpreted. **This must exist before the first CEFR result is ever saved** — it's the one thing that can't be back-filled.
- **Projection** — the browser never receives the raw config (it contains cut scores + legal notes). `toPublicConfig()` strips anything sensitive and serves only what the UI needs to render.

---

## 4 · Step 0 — the schema migration (do this first)

Safe to do now because every `exam_type` column currently holds only `'IELTS'` — nothing to reinterpret. One pre-push SQL + `prisma db push`, all additive/retype.

1. **`Exam` table** — string id (`ielts`, `spoken_english`, `oet`, `gre`, `gmat`), `label`, `status` (`live|reserved|disabled`). This replaces the `ExamType` enum (decision D2).
2. **`exam_configs` table** — `(exam_id, config_version)`, the config JSON, `is_active`. Seeded from `exam-engine-config.v2.json`.
3. **Retype `exam_type` → `exam_id String`** (FK → `Exam.id`) on the 10 models that carry it (`InstituteStudent`, `AssessmentHistory`, `StudentCompetencyMatrix`, `DrillQuestion`, `IAQuestion`, `MockQuestion`, `DiagnosticQuestion`, `Batch`, `InstituteExamSubscription`, `VivaSession`), then **drop the `ExamType` enum**.
4. **Provenance columns** — `engine_version` + `config_version` (nullable) on `AssessmentHistory` and the viva result path.
5. **Variant column** — reserved (`variant String?`); only wire it when OET/IELTS-GT needs it. Noted now so it's not a surprise.

Kept unchanged: `SkillType`/`SubSkillType` and the whole IELTS drill/diagnostic pipeline. The engine's *components* are a config concept that **maps onto** the existing skill data — we are not rewriting the IELTS flow.

Frontend: `examTypes.ts` keeps its union only for strategy-name typing; exam identity + labels now come from `/api/exams`.

---

## 5 · The build, in five readable stages

Each B-number is a task from the team's board (`EE-03`); the **why** is what makes it worth doing.

### Stage A — Foundation (the plumbing; no scoring yet)
| # | Task | In plain terms |
|---|---|---|
| B1 | Config loader + `exam_configs` table + seed | Read the config on boot, validate it, cache it. If it's invalid, **the server refuses to start** — better than scoring wrong. |
| B2 | Config validator | Port the 40+ checks from `reference-impl.js` (thresholds ascending, every referenced scale exists, legal block present for live exams, etc.). |
| B3 | Strategy interface + registry | The plug-in socket for `band_mean`/`cefr_hybrid`, chosen by name. |
| B4 | RawScore boundary | The unit-tagging that stops silent 0–100 vs 0–9 mixups. |

### Stage B — Scoring (turn inputs into results)
| # | Task | In plain terms |
|---|---|---|
| B5 | `band_mean` (IELTS) | Wrap the existing `bandScale.ts` **byte-for-byte** — IELTS output must not change. Return both raw + clamped band. |
| B6 | `cefr_hybrid` (Spoken English) | Average the speaking sub-skill percents → CEFR level, keep the 6-sub-skill profile, use the corrected (provisional) thresholds. |
| B7 | `per_component` path | The no-headline case (OET/GRE/GMAT). Build it now so OET doesn't force a rewrite later. |
| B8 | Result envelope | One result shape for all exams; `overall` may be null. |
| B9 | **Provenance** | Stamp `engine_version` + `config_version` on every result. **Before any CEFR result is stored.** |

### Stage C — Progression (the motivational layer — never fakes a number)
| # | Task | In plain terms |
|---|---|---|
| B10/B11 | Momentum (numeric / ordinal) | The "next rung" bar; `null` at the top (never a fake full bar). |
| B12 | Invariant guard | `headline` is *copied* from the real score, so it can't drift; `momentum` is free to differ. |
| B13 | Baseline capture | Per student, per exam — computed with the **same** components rule as a live assessment (or every progression number is wrong). |
| B14 | Improvement since baseline | Measured on the unclamped `value_raw`. |
| B15 | Trend | First-vs-last over the window, and only within one instrument type (don't mix IAs and mocks). |

### Stage D — Policy (attempts, unlocks, windows)
| # | Task | In plain terms |
|---|---|---|
| B16 | Attempt policy | School-strict: scheduled, miss the window = forfeit, no retake. Drills stay unlimited. |
| B17 | Graded-attempt ledger | 1 IA per scheduled session; 1 full mock per rolling 30 days. |
| B18 | Full-mock unlock | `completed ≥ min(6, scheduled)` so a light schedule can't lock a student out (founder to confirm). |
| B19 | Window/timezone | Rolling 30 days in the institute's timezone. |

### Stage E — Delivery (viva + content wiring)
| # | Task | In plain terms |
|---|---|---|
| B20 | Viva session logic | Config-driven question count; each answer an independent row (maps to our `VivaAnswer`) so one failure doesn't lose the session. |
| B21 | Wire modules to `delivery` | IA/mock read the component's delivery type from config, not hard-coded. |
| B22 | **CEFR-tag the speaking bank** | Blocks the viva work and depends on nothing — **can start immediately**. |
| B23 | Variant scoping | IELTS Academic/GT, OET profession — content filtered by variant. Adds the schema column. |
| B24 | Remediation resolver | "You keep missing X, here's the video" — triggers resolve to content IDs, capped. |

### Plus — the two config endpoints
- `GET /api/exams/public` (no login) — names + legal + status, for marketing pages.
- `GET /api/exams` (logged in) — the full stripped `PublicExamConfig[]` the app renders from.

---

## 6 · Order of work
```
Step 0   schema migration (Exam table, exam_configs, retype exam_id, provenance)
Week 1   B1 → B2 → B3 → B4        (foundation)
Week 2   B5, B6 → B7 → B8 → B9    (scoring + provenance)
Week 3   B10–B12, B13–B15         (progression)
Week 4   B16 → B19                (policy)
Week 5   B20–B24                  (delivery)
Anytime  B22 (CEFR tagging) — start now, unblocks the viva
```
Everything through Week 3 is **unit-testable against `run-vectors.js`** — no frontend, no live API needed.

## 7 · When is Phase 5 "done"
- `run-vectors.js` green in CI (75 vectors); an invalid config fails the build.
- Grepping `IELTS`, `B1`, `6.5`, `41.25` in `src/` finds hits **only** in the config loader / strategy-name registry — nowhere else.
- A hypothetical exam on existing scales/aggregation = **config only, zero code**.
- An exam with `overall: null` still renders a valid result.
- Every stored result carries its `engine_version` + `config_version`.
- **IELTS output is identical to before** — the hard guardrail.

## 8 · Explicitly out of scope (later, exam 4+)
New **frontend renderers** — GRE/GMAT quantitative items, GMAT Data Insights, OET speaking roleplay. The engine stops being the bottleneck; item rendering becomes it. Not Phase 5.

## 9 · Still needs a founder call (fields built now, values later — none block starting)
Mock-unlock fallback, B2C policy gap, unused-entitlement lapse/carry, B2C grace retake, OET naming, CEFR calibration budget. See `EE-DECISIONS.md §5`.
