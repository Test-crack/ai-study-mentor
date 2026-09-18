# Exam Engine — Review, Corrections and Additions

**Reviewed:** `phase5_implementation_plan.md` · `phase5_exam_config_input.md` · `exam-engine-spec.md` · `exam-engine-config.json` · `exam-engine-test-vectors.md` · `dev-task-board.md`
**Date:** 19 August 2026
**Verdict:** the direction is right and the "config, not code" discipline is the correct instinct. But **the four documents describe two incompatible architectures**, three of the five exams you want to support **cannot produce the headline score the engine assumes exists**, and the published test vectors contain **two arithmetic errors** and **one self-contradiction**.

Every number in this review was computed by executing `reference-impl.js` against `exam-engine-config.v2.json`. **75 vectors, 75 pass.** Nothing here is asserted by eye.

---

## 0 · Findings at a glance

| # | Finding | Severity | Where |
|---|---|---|---|
| 1 | The plan doc and the spec/task-board describe **two different engines**. Different interfaces, different route shapes, different storage. Your dev cannot build both. | **Blocking** | §1 |
| 2 | **OET issues no overall grade. GRE issues no composite. GMAT's total is not computable.** The engine assumes every exam has one headline number. | **Blocking** | §2 |
| 3 | The progression invariant **fires on a legitimate case** and the spec says so in a footnote. As written, the guard cannot ship. | **Blocking** | §3.1 |
| 4 | Test vector "phonology 45% → A2" is **wrong**. It is B1 under the old thresholds and the new ones. | High | §3.2 |
| 5 | Test vectors give **two different answers** for the same input (95% at C2 → 0.286 in §2, 1.00 in §3). | High | §3.3 |
| 6 | CEFR thresholds **do not match their own stated provenance**. B2 is 2.25 points low, C1 is 3.5 points low. | High | §3.4 |
| 7 | **GMAT is not in the Prisma `ExamType` enum.** Registering it needs a migration — the "config-only" promise fails on the first new exam. | **Blocking for GMAT** | §4.1 |
| 8 | Scoring inputs use **three different numeric domains** (0–1 fraction, 0–9 band, 0–100 percent) with no declared conversion. | High | §4.2 |
| 9 | No **variant** concept. IELTS Academic/General and OET's 12 professions have no home. | High | §4.3 |
| 10 | Listening and Reading have **no scored subskills**, so remediation content has nothing to attach to — on the two components students drill most. | High | §5.2 |
| 11 | `surface_only` and `skills_in_overall` are **two mechanisms for one fact**. They will drift. | Medium | §4.4 |
| 12 | No **result provenance**. Recalibrating thresholds silently rewrites every historical score. | High | §4.5 |
| 13 | `report_floor: 4.0` **destroys the improvement signal** the progression layer exists to produce. | Medium | §3.5 |
| 14 | Full-mock unlock (6 IAs/month) **can lock a student out through no fault of their own**, and has no meaning for B2C. | High | §6.2 |
| 15 | Trend over 3 sessions **mixes instruments**; and the spec's rule and the vectors' rule disagree. | Medium | §3.6 |
| 16 | OET's rights holder publishes **no nominative-use carve-out** — materially more restrictive than IELTS. | High | §7.2 |
| 17 | `GET /exams/{id}/config` "verbatim" **contradicts** the plan's "scoring never leaves the server". | Medium | §1.3 |
| 18 | 30 sample vivas is **a pilot, not a calibration**. Six levels need five cut scores. | High | §8 |

---

## 1 · The blocking problem: two architectures

`phase5_implementation_plan.md` and the spec/task-board/config set are not two views of one design. They are two designs.

| | Implementation plan | Spec + task board + config |
|---|---|---|
| Where exam data lives | TypeScript modules — `exams/ielts.ts`, `exams/spoken.ts` | A JSON config file, loaded and cached |
| Registry | `EXAM_REGISTRY: Record<ExamType, ExamConfig>` in code | `exam-engine-config.json` |
| Strategy interface | `formatSkillScore(fraction)` + `overall(Record<SkillType, number>)` | `scoreSubskill` / `scoreSkill` / `scoreOverall` / `validateConfig` |
| Route | `GET /api/exams` → all exams, projected | `GET /exams/{exam_id}/config` → one exam, verbatim |
| Adding exam #3 | A new `.ts` file — **a code change** | A new config object — **config only** |

**These cannot both be true.** The task board's definition of done says *"A hypothetical exam #3 with existing scoring = config-only, zero code change"*; the plan's architecture makes exam #3 a new TypeScript file. If your dev builds from the plan and you later hold him to the task board's DoD, he fails a bar he was never building against.

### 1.1 Which one to keep

**Keep the config-as-data model. Keep the plan's projection idea. Discard the file-per-exam registry.**

Reasoning: the whole value proposition — "any future exam without a rewrite" — is only real if exam declaration is data. A `.ts` file per exam is a perfectly good pattern, it is just not the pattern you asked for.

But **strategies stay as code, selected by name**, and that is not a compromise — it is correct. `band_mean` and `cefr_hybrid` are genuinely different mathematics, not different parameters. The right split:

> **Exam declaration is data. Scoring mathematics is code. The config selects the code by name, and the validator rejects a name it does not recognise.**

### 1.2 Where the config should live

The spec assumes a JSON file in the repo. That makes every threshold change a deploy — including the post-calibration change you already know is coming, and the regulator-target updates in the OET config.

**Recommendation:** an `exam_configs` table, keyed `(exam_id, config_version)`, seeded from the JSON file. The file stays in the repo as the seed and the reviewable artefact; the table is what the engine reads. Cost is one model and one loader. Without it, "config-only change" still means "deploy".

### 1.3 Do not serve the config verbatim

Task board B1 says `GET /exams/{id}/config` *"returns the exam object verbatim"*. The plan says scoring must never leave the server. Both cannot hold: the config contains `thresholds_min_pct`, which is scoring.

Serving it verbatim also ships `_status: DRAFT_FOR_COUNSEL`, `_threshold_provenance`, and every internal note to the browser — and lets any student read the exact percentage needed for B2.

**Fix:** keep the plan's `toPublicConfig()` projection. Strip anything whose key starts with `_`, strip `thresholds_min_pct`, strip strategy params. Ship naming, legal text, component list, labels, and scale *shape* (min/max/step/level labels) — everything the UI needs to render, nothing it needs to score.

Add one more split the plan misses: **naming and legal text must be fetchable unauthenticated**, because marketing pages render exam names before login. Everything else stays behind auth.

---

## 2 · The finding that changes the design

### 2.1 Three of your five exams have no headline score

This is not a gap in the spec. It is a fact about the exams.

| Exam | Overall score? | Evidence |
|---|---|---|
| IELTS | Yes — mean of four, rounded | — |
| Spoken English | Yes — your own construct | — |
| **OET** | **No. None. By design.** | CBLA states it three separate ways: the Test Regulations (*"An overall grade for the OET Test is not issued"*), the results page (*"There is no overall grade for the OET Test"*), and the statistics page (*"OET does not report overall scores or grades"*). |
| **GRE** | **No official composite.** | ETS's *Guide to the Use of Scores* instructs users to *"Consider Verbal Reasoning, Quantitative Reasoning and Analytical Writing Scores as Three Separate and Independent Measures."* The widely quoted 260–340 "total" is third parties summing V+Q; ETS does not compute, report or endorse it, and it discards Analytical Writing entirely. |
| **GMAT** | A total exists (205–805) but **you cannot compute it.** | GMAC does not publish the formula. It is a proprietary scaled composite of three IRT-scaled section scores. It is demonstrably not a sum or mean: three sections of 60–90 sum to 180–270 and average to 60–90 — neither maps to 205–805. |

**Why this is the most important finding in the review.** Every one of the four documents assumes `overall` always exists. The result envelope has a required `overall` object. The progression layer climbs a single ladder. The invariant compares `progression.current` to `overall.value`.

Build that, and **OET breaks it — and OET is exam 3, not some hypothetical future.**

### 2.2 The fix

`overall.mode` with two values:

```json
"overall": { "mode": "aggregate", "strategy": "band_mean", "components": [...] }
"overall": { "mode": "per_component" }
```

`per_component` does not mean "no result". It means the report is a set of component scores with no headline — which is exactly how OET results are read, and exactly why regulators specify requirements per sub-test (GMC: B in all four; NMC: B in Listening, Reading, Speaking and C+ in Writing; Ahpra from 23 April 2026: Listening 350, Reading 360, Writing 350, Speaking 360).

Consequences to plan for now, not later:

- **The envelope's `overall` must be nullable**, and the UI needs a per-component report layout. That layout is *also* what the OET regulator-target feature needs, so it is not wasted work.
- **`target` becomes per-component** for these exams. A single "target band" input is IELTS-shaped.
- **Progression is per-component** where there is no headline.

### 2.3 Do not ship an "estimated GMAT total"

The temptation will be real. Resist it. Any number you invent sits next to a famous scale and reads as a prediction of it. That is the fastest possible route to a calibration claim you cannot defend — and calibration credibility is the entire thesis of the product.

Same for the GRE V+Q sum. I have included it in the config as `unofficial_aggregate` with `enabled: false`, so the decision is visible and reversible rather than accidental.

---

## 3 · Defects in the maths

### 3.1 The progression invariant cannot ship as written

Task board §0: *"`progression.current.value` must equal `overall.value`. Assert it; throw if not."*

Spec §7, on the same page: *"the headline band and current_rung intentionally differ at s=5.90 (band 6.0, rung 5.5) — that's expected."*

Test vectors §3 publishes that exact row **and then** publishes a case asserting the builder must throw when current is 6.0 and overall is 5.5.

So the document set says the two values must be equal, will legitimately differ, and that differing is a throwable bug. Your dev will implement one of the three and be wrong.

**The root cause is one name doing two jobs.** `progression.current` is being used both for *the assessed headline* and for *the bottom of the momentum bar*. Split them:

```json
"progression": {
  "headline": { "value": 6.0, "label": "6.0" },        // == overall.value. GUARDED.
  "momentum": { "next_rung": 6.5, "progress_to_next": 0.30 }   // free to differ
}
```

The invariant then guards `headline`, and becomes structurally true because `headline` is copied from `overall` rather than recomputed. Divergence moves into `momentum`, where it is legal.

**There is also a UX bug underneath the assertion bug.** At s=5.90 the v1 design renders "Band 6.0" and "80% of the way to 6.0" on the same screen. Telling a student they are 80% of the way to a band they already have is worse than showing nothing.

**Corrected model — the momentum bar spans the rounding interval of the current headline.** Band 6.0 covers continuous means [5.75, 6.25). The bar fills across that interval, and reaching 100% is exactly the moment the headline rounds up:

```
lo       = headline - step/2
progress = clamp((continuous_mean - lo) / step, 0, 1)
next     = headline >= scale.max ? null : headline + step
```

Verified output:

| continuous mean | headline | interval | next rung | progress |
|---|---|---|---|---|
| 5.60 | 5.5 | [5.25, 5.75) | 6.0 | 0.70 |
| 5.90 | **6.0** | [5.75, 6.25) | **6.5** | 0.30 |
| 6.00 | 6.0 | [5.75, 6.25) | 6.5 | 0.50 |
| 6.24 | 6.0 | [5.75, 6.25) | 6.5 | 0.98 |
| 6.25 | 6.5 | [6.25, 6.75) | 7.0 | 0.00 |
| 8.90 | 9.0 | — | **null** | **null** |
| 9.00 | 9.0 | — | **null** | **null** |

Monotone, never contradicts the headline, full 0–1 range, and at the cap it reports **null rather than a fake full bar**.

### 3.2 "Phonology 45% → A2" is wrong

Test vectors §2 asserts it. With `b1: 41`, 45 ≥ 41, so it is **B1**. With the corrected `b1: 41.25`, still **B1**.

This matters beyond the row: it is the "assert the profile is never dropped" test — the one guarding your honest-weakness-reporting feature. Written against a wrong expected value, it would have been "fixed" by making the code wrong.

### 3.3 The vectors contradict themselves

For 95% at C2: §2 says `withinBandProgress` = **0.286**; §3 says `progress_to_next` = **1.00**. Same input, two answers.

`1.00` is also the wrong behaviour — it renders a full progress bar toward a level that does not exist. **At the cap, `next_rung` and `progress_to_next` are `null`**, and `within_level_progress` is reported separately if you want to show movement inside C2. (With corrected thresholds that value is **0.20**, not 0.286.)

### 3.4 The CEFR thresholds contradict their own provenance

The config documents them as *"GSE-anchored (Pearson Global Scale of English 10–90) converted to 0–100%"*. Pearson's published mapping is: below A1 10–21, A1 22–29, A2 30–42, B1 43–58, B2 59–75, C1 76–84, C2 85–90. Applying `pct = (GSE − 10) / 80 × 100`:

| Level | GSE min | Correct % | Config v1 | Error |
|---|---|---|---|---|
| A1 | 22 | 15.00 | 14 | −1.00 |
| A2 | 30 | 25.00 | 24 | −1.00 |
| B1 | 43 | 41.25 | 41 | −0.25 |
| **B2** | 59 | **61.25** | **59** | **−2.25** |
| **C1** | 76 | **82.50** | **79** | **−3.50** |
| C2 | 85 | 93.75 | 93 | −0.75 |

B2 and C1 are materially wrong — it looks like the raw GSE number was used for B2 instead of its percentage. **Every student scoring 59–61.25% is currently promoted from B1 to B2 by an arithmetic slip.** Corrected in v2.

Two caveats worth stating plainly. These boundaries import *Pearson's* alignment of GSE to CEFR, itself anchored to North's 2000 CEFR scaling — you are borrowing a vendor's alignment claim, not making your own. And they remain **provisional and uncalibrated** until the study in EE-04 runs. I have added `_calibration_status: PROVISIONAL_UNCALIBRATED` and a validator warning so this cannot quietly become permanent.

### 3.5 `report_floor` eats the improvement signal

Two decisions collide. The baseline is *"intentionally hard and zero-based"*. The reported band is clamped at 4.0. So a student who truly moves 3.0 → 4.5 shows **+0.5**, not +1.5. Worse: because most diagnostics are deliberately hard, most baselines clamp to exactly 4.0, and every student's "improvement since baseline" is computed from the same floor.

**Fix (in v2):** the strategy returns both `value_raw` (unclamped) and `value` (clamped). Display `value`; compute improvement on `value_raw`. One field, and the progression layer starts measuring what it claims to measure.

### 3.6 The trend rule is undefined, and it mixes instruments

The spec says *"sign of the slope over the last 3 sessions"*. The vectors imply first-versus-last. On `[4.0, 7.0, 5.0]` those give opposite answers — first-vs-last says **up**, least-squares slope says **down**. Pick one and write it down.

Separately: with 1 graded IA per scheduled session and 1 full mock per month, a 3-session window mixes IAs and mocks. Those are different instruments with different difficulty, so the trend measures **which instrument you last sat**, not progress. Added `trend_within_instrument_only: true` to the config.

---

## 4 · Structural gaps

### 4.1 The Prisma enum breaks the promise on the first new exam

Current schema: `enum ExamType { IELTS SPOKEN OET GRE TOEFL PTE }`. **GMAT is not in it.** Registering GMAT therefore requires a schema migration, a client regeneration and a deploy — which is exactly the "config-only, zero code change" DoD failing on the very first exam you add.

There is also an identifier collision already: the enum says `SPOKEN`, the config says `spoken_english`, the short code says `SPK-EN`. Three names for one thing, and nothing pins them together.

**Recommendation:** replace the enum with a string FK to an `Exam` table.

```prisma
model Exam {
  id          String  @id            // "ielts", "spoken_english", "oet", "gre", "gmat"
  label       String
  status      String                 // live | reserved | disabled
  config      Json
  version     String
}
```

The cost is a migration touching the handful of models carrying `exam_type` — cheap now, expensive after exam 3 ships and there is production data. If you would rather not do it this sprint, the minimum is: **add every planned enum value now** (GMAT, and anything else on the roadmap), and add `prisma_enum` to each config object so the mapping is explicit. I have added that field.

The same argument applies to the frontend's `ExamType` union. A TypeScript union means a new exam is a frontend code change too. Keep the union **only** for strategy selection, where the values genuinely are code; make exam identity a validated `string` everywhere else.

### 4.2 Three numeric domains, no declared conversion

- Plan: `formatSkillScore(fraction: number)` — 0 to 1
- Spec §2: IELTS input is *"a band score already (0.0–9.0)"*
- Spec §3: CEFR input is *"percent 0–100 per subskill"*

Nothing in any document says where the conversion happens. A silent unit mismatch here produces scores that are wrong but entirely plausible — the worst failure mode available, because nothing crashes and nobody notices for months.

**Fix:** make the input type explicit and validated at the boundary.

```ts
type RawScore =
  | { unit: 'percent'; value: number }        // 0–100
  | { unit: 'band'; value: number; scale: string }
  | { unit: 'raw'; correct: number; total: number };
```

The strategy declares which unit it consumes; the validator rejects a mismatch on load rather than at 2am.

### 4.3 No variant concept

IELTS is Academic **or** General Training — different Reading and Writing papers, different published reliabilities. OET Writing and Speaking are **profession-specific across 12 professions** while Listening and Reading are shared.

Neither the config nor the schema has anywhere to put this. Content selection, scoring norms and question banks all depend on it.

**Added in v2:** a `variants` block per exam with `dimension`, `options`, `applies_to_components`, plus `variant_scoped: true|false` per component. This is also the single biggest content-cost fact about OET — 2 shared banks plus 2 × N profession-specific banks — so it belongs in the plan, not in a surprise later.

### 4.4 One fact, two mechanisms

`surface_only: true` on a skill, and `skills_in_overall: [...]` on the scoring block, encode the same thing. Two mechanisms for one fact drift the moment someone edits one.

**v2 keeps `assessed: true|false` only**, and the validator asserts `overall.components ⊆ {components where assessed}`. Same for `viva.applies_to_modules`, which duplicated `modules.*.speaking_mode` — removed, derived instead.

### 4.5 No result provenance

`config_version` exists on the config but nothing records it **on a result**. You already know the CEFR thresholds will change after calibration. When they do:

- every historical CEFR level was computed under different boundaries;
- every trend line silently mixes two scales;
- and with `school_strict` retakes, a student cannot re-sit to get a comparable score.

**Added to defaults:** `record_engine_version` and `record_config_version` on every stored result, and `rescore_historical_on_config_change: false`. This must land **before the first CEFR result is stored**, not after.

---

## 5 · The components model, and what it does and does not buy you

Your instinct is right and I have implemented it. One refinement: **the generalisation is not one concept but three.** v1 conflated them, which is why GRE did not fit.

> A **component** is a unit of the exam. A **scale** is how a number is expressed. An **aggregation rule** is how components combine — or that they do not.

Splitting those three is what makes GRE fit without a rewrite. GRE's components are Verbal / Quant / Analytical Writing; two scales (130–170 step 1, and 0–6 step 0.5); aggregation `per_component`. No listening or speaking is forced on it, and nothing about the language-exam shape leaks in.

A component in v2 carries: `id`, `label`, optional `modality` tag, `assessed`, `scale`, `delivery`, `weight`, optional `subskills`, optional `item_tags`, optional `remediation`, optional `variant_scoped`, `time_limit_minutes`.

### 5.1 What the modality tag actually buys

This is where the reuse you are hoping for is real — and where it is not.

| Modality | Components across the 5 exams | Existing runner? |
|---|---|---|
| reading | IELTS R, Spoken R, OET R, GRE Verbal, GMAT Verbal | ✅ reuse |
| listening | IELTS L, Spoken L, OET L | ✅ reuse |
| writing | IELTS W, Spoken W, OET W, GRE Analytical Writing | ✅ reuse |
| speaking | IELTS S, Spoken S (viva), OET S (roleplay) | ⚠️ viva and roleplay are new UI |
| quantitative | GRE Quant, GMAT Quant | ❌ **new renderer** |
| integrated | GMAT Data Insights | ❌ **new renderer** |

**The honest answer to "no future rewrites":** of 18 components across 5 exams, **15 reuse existing runners**. Three do not, and no amount of config generalisation makes them free:

1. **A quantitative item renderer** — maths notation, figures, quantitative-comparison layout, on-screen calculator. Built once, serves both GRE and GMAT.
2. **A Data Insights renderer** — sortable tables, multi-source tabbed panels, chart interpretation, two-part answer grids. Five distinct interaction patterns with no analogue in the platform. This is the most expensive thing in the whole config.
3. **OET Speaking roleplay UI** — `roleplay` is reserved as an enum value in the frontend and has never been built.

That is the true shape of it: **the engine stops being the bottleneck; item rendering becomes the bottleneck.** That is a good trade and worth saying out loud, because "no code changes ever" would be a promise the build cannot keep.

### 5.2 Remediation — and the gap it exposes

Added at three levels: `component`, `subskill`, `item_tag`, with a trigger (`below_pct`, `below_level`, `below_score`), `content_refs`, `drill_tags` and `max_items`.

**The `item_tag` level is not a nicety — without it, remediation cannot work at all on Listening and Reading.** Those two components have no scored subskills by design (their tags are analytics only). They are also where students spend most of their drilling time. Attaching remediation to tags is the only way to answer "you keep missing matching-headings, here is the video".

Three corrections to how you described it:

1. **Reference content, never embed URLs.** `content_refs` are IDs resolved against the content table. Put URLs in config and the config becomes a CMS, every video swap becomes a deploy, and the media team needs a developer.
2. **Say "suggested practice", not "your weakness is X".** Sub-skill scores are far less reliable than composites — that is why IELTS publishes composite reliability around 0.97 against roughly 0.90 for single skills. A confident weakness claim from one noisy sub-score is the same overclaiming the calibration thesis exists to avoid.
3. **The validator now rejects** `remediation.level: 'subskill'` on a component with no subskills, and warns when remediation is declared with nothing to surface. All 15 components currently warn — the library is empty and that is fine, but it should be visible rather than assumed.

---

## 6 · Your answered policy items — encoded, with four things still open

### 6.1 What is now in config

Moved to a platform-wide `defaults` block, because you said "same for every exam" and a per-exam `rules` block cannot express that without repetition:

```json
"attempts": { "retake_policy": "school_strict", "allow_retake": false, "on_missed_window": "forfeit" },
"graded_attempts": {
  "internal_assessment": { "per": "scheduled_session", "count": 1, "forfeited_counts_toward_unlock": false },
  "full_mock": { "per": "rolling_30_days", "count": 1,
    "unlock_requirement": { "min_internal_assessments_completed": 6, "window": "rolling_30_days", "or_all_scheduled_in_window": true } }
}
```

### 6.2 Four questions the answers surfaced

**a) The unlock rule can lock a student out through no fault of their own.** Six completed IAs unlock the monthly mock, and forfeited IAs do not count. So a student in an institute that schedules five IAs a month **can never unlock the mock** — and a student who misses one of six is locked out for a month by a single absence.

I have added `or_all_scheduled_in_window: true`, making the rule `completed >= min(6, scheduled_in_window)`. **Confirm this is what you want**, because the alternative reading — six is six, miss one and you wait — is defensible as a discipline mechanism, just harsher than I think you intend.

**b) "Per month" is ambiguous and timezone-sensitive.** Calendar month punishes a student who starts on the 28th. I have set `rolling_30_days`. Window boundaries also need a declared timezone or students in other timezones forfeit early — `src/lib/timezone.ts` already exists, so this is wiring, not building.

**c) B2C has no scheduler.** `school_strict` assumes someone schedules assessments. A self-serve B2C student never "misses a window", so nothing is ever forfeited **and the full mock never unlocks**. Flagged as `_b2c_gap` with the override field built. Decide before B2C launch, not during.

**d) Unused entitlement.** If a mock unlocks and goes unused when the window rolls, does it lapse or carry? Marked `TBD_FOUNDER`, defaulting to lapse.

One more worth raising: a paying B2C customer who forfeits a paid attempt with no retake is a refund conversation and possibly a consumer-protection one. Consider a configurable grace of one retake per cycle, set to **0** for institutes and non-zero for B2C. The field costs nothing now.

### 6.3 "Speaking only" for Spoken English — easier, not harder

Your question: *"If for Spoken English we want speaking only, is the current build plan gonna be harder, or can we easily set up and reuse components?"*

**Easier, and the components model makes it cleaner still.** It is two config facts:

```json
"components": [ { "id": "speaking", "assessed": true, ... },
                { "id": "listening", "assessed": false, ... }, ... ],
"overall": { "mode": "aggregate", "components": ["speaking"] }
```

Listening, Reading and Writing stay in the product as practice surfaces with full drills and remediation — they simply do not enter the headline. Adding them to the CEFR profile later is one line: flip `assessed` and add the id to `overall.components`. **No code changes either way.** This is exactly the case the model is designed for, and it is the honest reading of "Spoken English".

**One trap.** The diagnostic must compute the baseline using the *same* `overall.components` rule as a live assessment. If the diagnostic averages four components while assessments average one, `improvement_since_baseline` compares two different quantities and every number in the progression layer is quietly wrong. Noted in the config.

---

## 7 · Legal

### 7.1 A machine-checkable legal block

Rather than free text, v2 adds fields the validator can enforce: `rights_holder`, `may_use_mark_in_product_name`, `required_attribution`, `permission_status`, `review_contact`, plus `banned_terms_near_output`. A `live` exam whose legal status starts with `BLOCKED` now fails config load. That turns "did anyone check the legal wording?" from a memory problem into a build failure.

It immediately caught one thing: **IELTS has `may_use_mark_in_product_name: false` while the display name is "IELTS Preparation"**. Descriptive use of that kind is common in the prep industry, but it is a legal judgement, not an engineering one. The validator now warns rather than silently passing.

### 7.2 The three restricted marks are not equally restricted

| Exam | Rights holder | Position |
|---|---|---|
| **GRE** | ETS | **Most workable.** ETS publishes an explicit third-party policy: use the exact attribution *"GRE is a registered trademark of ETS. This product is not endorsed or approved by ETS."*, never use ETS marks in company, domain or product names, never use ETS logos, and submit materials to trademarks@ets.org for review (~10 business days). Follow it and you are on documented ground. |
| **GMAT** | GMAC | **Unclear.** No public third-party guidance at all; the only route is legal@gmac.com. Absence of a published carve-out is not permission. |
| **OET** | Cambridge Boxhill Language Assessment | **Most restrictive — flag this one.** CBLA's IP policy states its marks *"cannot be used without the prior express written permission of CBLA"*, and its Terms add *"You are not permitted to use any trade marks, logos or trade names appearing on the Website."* There is **no published nominative-use carve-out for preparation providers.** Instead CBLA runs a Preparation Provider Programme whose Premium tier grants an official logo. |

**OET is materially more restrictive than IELTS, and OET is your exam 3.** I have set its display name to "Healthcare English Preparation" and marked its legal block `BLOCKED_ON_COUNSEL` so it cannot go live on this config. Treat "can we call it OET prep?" as a counsel question with a real chance of "no", and get the answer before the content spend, not after.

### 7.3 CEFR is a different kind of risk

The config lists the Council of Europe as `trademark_owner`. That framing is off. The CEFR is a published framework, not a licensed mark like IELTS or OET — **the exposure is misrepresentation, not infringement.**

And the specific misrepresentation to avoid is sharper than "avoid the word certified": the Council of Europe states plainly that *"it is not the role of the Council of Europe to verify and validate the quality of the link between language examinations and the CEFR's proficiency levels."*

**There is no such thing as CEFR certification or accreditation.** Anyone claiming it is describing something that does not exist. Your `banned_terms_near_output` list now covers it, and the disclaimer says so explicitly.

Defensible: *"aligned to"*, *"CEFR-referenced"*, *"estimated CEFR level"*. Not defensible: *"CEFR certified"*, *"official CEFR level"*, *"recognised by the Council of Europe"*.

---

## 8 · CEFR calibration — 30 is a pilot, not a calibration

You said you want to opt for concrete calibration. Good — the thresholds are currently a borrowed vendor mapping, and that is the single weakest claim in the product.

**The spec's plan of ~30 examiner-rated vivas is not sufficient, and the reason is arithmetic.** Six levels means **five cut scores**, and precision depends on sample density *near each cut*, not on total N. Thirty samples is roughly six per boundary. A 6×6 confusion matrix has 36 cells; 30 samples cannot populate it. The 95% confidence interval on weighted kappa at n=30 with six categories is roughly ±0.2 — wide enough that you could not distinguish an excellent rater from a poor one.

Full protocol with sample sizes, methods, metrics and acceptance thresholds is in **EE-04**. The short version:

- **60–90 locally benchmarked performances** (10–15 per level, deliberately dense at the boundaries), each rated by **≥2 trained raters** with third-rater adjudication on disagreements greater than one level.
- **Standard setting with 10–15 panellists**, two methods, two to three rounds with feedback between them.
- **Validation on 200–300 double-rated performances held out** from any fitting.
- **Acceptance:** quadratic weighted kappa ≥ 0.70, |standardised mean difference| ≤ 0.15, and degradation versus human–human agreement ≤ 0.10 — the Williamson, Xi & Breyer (2012) criteria that ETS applies operationally.
- **Never report weighted kappa alone.** On a six-category scale with most students clustered at A2–B2 it is systematically depressed. Report linear weighted kappa, exact and adjacent agreement, Spearman's rho and the full confusion matrix alongside it.

If 30 is genuinely the budget, run it as a **feasibility pilot** — familiarisation, specification, one standard-setting round — and publish it as provisional with the sample size named as the limitation. That is defensible. Calling it a calibration is not.

---

## 9 · What I have produced

| File | What it is |
|---|---|
| `exam-engine-config.v2.json` | The corrected config. Components model, 3 orthogonal concepts, 5 exams, answered policy encoded, machine-checkable legal block. |
| `reference-impl.js` | Executable reference implementation — strategies, momentum, envelope, and a config validator with 40+ rules. |
| `run-vectors.js` | Runs every published vector. **75 pass, 0 fail.** Run it in CI. |
| `EE-01_Exam_Engine_Spec_v2.md` | The spec, aligned to the components model. |
| `EE-02_Test_Vectors_v2.md` | Corrected and extended vectors — every value computed, not asserted. |
| `EE-03_Backend_Task_Board_v2.md` | Reordered task board with the new blocking items. |
| `EE-04_CEFR_Calibration_Protocol.md` | The concrete calibration study. |

**The three things to settle before your dev writes code:**

1. **Which architecture** — config-as-data (recommended) or file-per-exam. §1.
2. **Prisma enum or `Exam` table.** §4.1. Cheap now, expensive after exam 3 ships.
3. **`overall.mode`.** §2. If this is not in the envelope from day one, OET forces a rewrite of the result contract and every consumer of it.

Everything else on the list can be fixed as you go. Those three are load-bearing.
