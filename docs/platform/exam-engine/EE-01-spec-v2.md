# Exam Engine — Developer Spec (v2)

**Companion to:** `exam-engine-config.v2.json` · `reference-impl.js`
**Audience:** backend and frontend devs. Readable without the founder present.
**Supersedes:** `exam-engine-spec.md` v1. Changes are summarised in `EE-00_Review_and_Corrections.md`.

---

## 1 · The three concepts

v1 had one organising idea — "an exam has four language skills". That fits IELTS, Spoken English and OET. It does not fit GRE or GMAT, which have no listening or speaking at all.

v2 replaces it with three orthogonal concepts. Keeping them separate is what makes a new exam a config entry.

> A **component** is a unit of the exam.
> A **scale** is how a number is expressed.
> An **aggregation rule** is how components combine — *or that they do not*.

### 1.1 Component

```jsonc
{
  "id": "speaking",
  "label": "Speaking",
  "modality": "speaking",        // OPTIONAL tag: reading|listening|writing|speaking|quantitative|integrated
  "assessed": true,              // false = practice surface, present but outside the headline
  "scale": "cefr_6",             // references scales.*
  "delivery": "viva",            // which runner renders it
  "weight": 1.0,
  "time_limit_minutes": 15,
  "variant_scoped": false,
  "subskills": [ { "id": "fluency", "label": "Fluency" } ],
  "item_tags": ["gist", "detail"],
  "remediation": { "level": "subskill", "trigger": {...}, "content_refs": [], "max_items": 3 }
}
```

**`modality` is a tag, not the organising rule.** It exists so a component can reuse an existing runner: anything tagged `reading` renders in the passage/item runner whether it is IELTS Reading, GRE Verbal or GMAT Verbal. It carries no scoring meaning.

**`assessed` replaces v1's `surface_only`.** One mechanism, not two. The validator enforces `overall.components ⊆ {components where assessed === true}`.

### 1.2 Scale

Scales are defined once at the top level and referenced by id. Two kinds:

```jsonc
"ielts_band": { "kind": "numeric", "min": 0, "max": 9, "step": 0.5,
                "report_floor": 4.0, "rounding": "half_up_to_step" }

"cefr_6":     { "kind": "ordinal", "levels": [...], "labels": {...},
                "thresholds_min_pct": {...}, "supports_within_level_progress": true }
```

A numeric scale may declare `grade_bands` (OET) and `computable: false` (GMAT total — declared so a real score can be stored, never computed).

### 1.3 Aggregation

```jsonc
"overall": { "mode": "aggregate", "strategy": "band_mean", "components": [...], "scale": "ielts_band" }
"overall": { "mode": "per_component" }
```

**`per_component` is not an absence of a result.** It is the correct model for OET (no overall grade is issued), GRE (three independent measures) and GMAT (total exists but is not computable). See EE-00 §2.

---

## 2 · The one rule that makes this an engine

Every exam-specific value — names, legal text, components, scales, thresholds, policy — lives in config. **Code reads config; code never hard-codes an exam.**

> A scoring strategy is a **pluggable object selected by `overall.strategy`**, never an `if (examId === "ielts")` branch inside shared code.

Two strategies exist: `band_mean` and `cefr_hybrid`. A third exam that scores differently means a new strategy implementing the same interface — that is a legitimate code change. A third exam that scores like an existing one means **config only**.

```ts
type RawScore =
  | { unit: 'percent'; value: number }               // 0–100
  | { unit: 'band'; value: number; scale: string }   // scale-native
  | { unit: 'raw'; correct: number; total: number };

interface ScoringStrategy {
  readonly id: string;
  readonly consumes: RawScore['unit'];
  scoreComponent(inputs: Record<string, RawScore>, scale: Scale, params: object): ComponentResult;
  scoreOverall(components: Record<string, ComponentResult>, scale: Scale, params: object): OverallResult;
  validate(params: object, scale: Scale): void;   // throws; runs at config load
}
```

**`consumes` is not decoration.** v1 mixed three numeric domains — 0–1 fractions in the plan, 0–9 bands in §2, 0–100 percents in §3 — with no declared conversion. A silent unit mismatch produces scores that are wrong but plausible, which is the worst failure mode available. Declare the unit; validate at the boundary.

---

## 3 · Strategy `band_mean` (IELTS)

**Input:** one band per assessed component, on the component's scale.

**Algorithm:**
1. `mean = sum(component bands) / count`
2. `rounded = roundHalfUpToStep(mean, scale.step)`
3. `reported = clamp(rounded, scale.report_floor, scale.max)`
4. Return **both** `value_raw` (step 2, unclamped) and `value` (step 3).

Step 4 is not optional. Improvement-since-baseline is computed on `value_raw`; if it used the clamped value, a student moving from a true 3.0 to a true 4.5 would show +0.5 instead of +1.5 — the floor would eat exactly the signal the progression layer exists to produce.

**Rounding — a real bug source. Do NOT use language-default (banker's) rounding:**

```js
function roundHalfUpToStep(value, step) {
  return Math.round(value / step + 1e-9) * step;   // epsilon defends against float representation
}
```

| Mean | Reported | Banker's rounding would give |
|---|---|---|
| 6.25 | **6.5** | 6.0 ✗ |
| 6.75 | 7.0 | 7.0 ✓ |
| 6.24 | 6.0 | 6.0 ✓ |
| 6.26 | 6.5 | 6.5 ✓ |

> `report_floor: 4.0` is a deliberate product choice, not the official scale — IELTS runs 1.0–9.0. `scale.min` stays 0.0 so the floor can be lowered in config without a code change.

---

## 4 · Strategy `cefr_hybrid` (Spoken English)

**Input:** a percent 0–100 per subskill of the assessed component.

### 4.1 Percent → level

Pick the **highest** level whose threshold ≤ score. Thresholds are **inclusive**.

```js
function pctToLevel(pct, scale) {
  const ordered = Object.entries(scale.thresholds_min_pct).sort((a, b) => a[1] - b[1]);
  let level = ordered[0][0];
  for (const [name, min] of ordered) if (pct >= min) level = name;
  return level;
}
```

**Corrected thresholds** (v1's did not match their own stated GSE derivation — see EE-00 §3.4):

| Level | GSE min | min % |
|---|---|---|
| Below A1 | 10 | 0 |
| A1 | 22 | 15.00 |
| A2 | 30 | 25.00 |
| B1 | 43 | 41.25 |
| B2 | 59 | **61.25** |
| C1 | 76 | **82.50** |
| C2 | 85 | 93.75 |

Derivation: `pct = (GSE − 10) / 80 × 100`, applied to each level's minimum GSE in Pearson's published GSE→CEFR mapping.

> **These are provisional.** They import Pearson's alignment rather than establishing our own, and they are marked `_calibration_status: PROVISIONAL_UNCALIBRATED`. The validator emits a warning, and results must carry a provisional notice until EE-04 completes.

### 4.2 Within-level progress

```js
progress = clamp((pct − thisLevelMin) / (nextLevelMin − thisLevelMin), 0, 1)   // top level's upper bound is 100
```

Worked: 50% → B1 (≥41.25, <61.25), progress (50−41.25)/20 = **0.4375** → *"B1 — 44% of the way to B2."*

### 4.3 Overall

1. `avg = mean of the subskill percents`
2. `overallLevel = pctToLevel(avg)`
3. **Always** return the full subskill profile alongside the headline.

Step 3 is a product commitment, not an implementation note: the headline is stable, the profile keeps weaknesses honest, and the frontend must render both.

> **Confirmed:** the headline is driven by the **Speaking component alone** (`overall.components: ["speaking"]`). Listening, Reading and Writing are `assessed: false` — present in the product as practice surfaces, absent from the headline. Changing this later is one config line.

> **Trap:** the diagnostic must compute the baseline with the **same** `overall.components` rule as a live assessment. Otherwise `improvement_since_baseline` compares two different quantities.

---

## 5 · Progression layer

A **display layer on top of scoring. It never changes the assessed score.**

### 5.1 The invariant, corrected

v1 required `progression.current.value === overall.value` while simultaneously documenting that they legitimately differ at a continuous mean of 5.90. Both cannot hold. The cause was one name doing two jobs.

```jsonc
"progression": {
  "headline": { "value": 6.0, "label": "6.0" },   // == overall.value. GUARDED. Throw on divergence.
  "momentum": { "next_rung": 6.5, "progress_to_next": 0.30 }   // free to differ. Not guarded.
}
```

`headline` is **copied** from `overall`, never recomputed — the invariant becomes structurally true rather than a runtime hope. Divergence lives in `momentum`, where it is legal and meaningful.

### 5.2 Momentum on a numeric scale

The bar spans the **rounding interval of the current headline**. Band 6.0 covers continuous means [5.75, 6.25); filling the bar is exactly the moment the headline rounds up.

```js
const lo   = headline - scale.step / 2;
const atCap = headline >= scale.max;
next_rung        = atCap ? null : headline + scale.step;
progress_to_next = atCap ? null : clamp((continuousMean - lo) / scale.step, 0, 1);
```

| mean | headline | next | progress |
|---|---|---|---|
| 5.60 | 5.5 | 6.0 | 0.70 |
| 5.90 | 6.0 | 6.5 | 0.30 |
| 6.24 | 6.0 | 6.5 | 0.98 |
| 6.25 | 6.5 | 7.0 | 0.00 |
| 9.00 | 9.0 | **null** | **null** |

**At the cap, report `null` — never a full bar toward a level that does not exist.** v1 published `1.00` here, which is a fake full bar and contradicted its own §2.

### 5.3 Momentum on an ordinal scale

`current = pctToLevel(avg)`, `next = nextLevel(current)`, `progress = withinLevelProgress(avg, current)`. At C2, `next_rung` and `progress_to_next` are `null`; `within_level_progress` is still reported separately if you want to show movement inside the top level.

### 5.4 Improvement since baseline

`current − baseline`, in scale units (bands) or level-steps (CEFR, indexed `below_a1`=0 … `c2`=6). **Computed on the unclamped `value_raw`.**

### 5.5 Trend

Sign of the change over the last `trend_window_sessions` (default 3). **Two corrections:**

1. **Define the rule.** v1's spec said "sign of the slope" while its vectors implied first-versus-last. On `[4.0, 7.0, 5.0]` those disagree — first-vs-last says *up*, least-squares says *down*. This spec uses **first-versus-last** (implemented in `reference-impl.js`). If you prefer least-squares, change both the code and this line together.
2. **Compare like with like.** With 1 graded IA per session and 1 mock per month, a 3-session window mixes instruments of different difficulty and measures *which instrument you last sat*. `trend_within_instrument_only: true` is set in defaults.

### 5.6 The honesty guardrail

`never_inflate_assessed_score: true`. The band or level reported is always the true assessed value. The motivational element is **framing** — a hard disclosed baseline, personal-best-relative progress, next rung, trajectory — **never a fake number**. This is what stops the whole thing collapsing on test day.

---

## 6 · Result envelope

```jsonc
{
  "exam_id": "spoken_english",
  "engine_version": "2.0.0",
  "config_version": "2.0.0",          // REQUIRED. See §8.
  "strategy": "cefr_hybrid",
  "overall": {                         // NULLABLE — null when overall.mode === "per_component"
    "kind": "cefr_level",
    "value": "b1",
    "label": "B1",
    "within_level_progress": 0.4375,
    "provisional": true                // set when the scale is PROVISIONAL_UNCALIBRATED
  },
  "components": [
    { "id": "speaking", "assessed": true, "kind": "cefr_level", "value": "b1", "display": "B1",
      "subskills": [ { "id": "fluency", "name": "Fluency", "percent": 62, "value": "b2", "display": "B2" } ] }
  ],
  "progression": {
    "baseline": { "value": "a2", "display": "A2", "style": "challenge" },
    "headline": { "value": "b1", "display": "B1" },
    "momentum": { "next_rung": "b2", "next_rung_display": "B2", "progress_to_next": 0.4375 },
    "improvement_since_baseline": { "value": 1, "display": "+1 level" },
    "recent_trend": "up"
  },
  "remediation": [ { "scope": "subskill", "id": "phonology", "content_refs": ["vid_..."], "drill_tags": [] } ],
  "disclaimer_short": "…"
}
```

**Field naming — fix v1's inconsistency.** v1 used `label` for the *value* at skill level ("B1") and for the *name* at subskill level ("Fluency"), with `label_value` for the subskill's value. One field name, two meanings, in the same payload. v2 uses **`name`** for what a thing is called and **`display`** for the rendered value, everywhere.

---

## 7 · Config validation (runs on load — fail loud)

Implemented in `reference-impl.js#validateConfig`. Errors block startup; warnings are logged.

**Scales:** ordinal thresholds strictly ascending, first is 0, all within 0–100; every threshold key is a declared level; every level has a label. Numeric `report_floor` within `[min, max]`; `step` divides the scale evenly. **Grade bands must tile at the scale's step, not at 1** — OET's bands look non-contiguous (B tops at 440, C+ starts at 300) but tile exactly because the scale increments in 10s. A naive 1-point tiling check wrongly rejects them.

**Exams:** `overall.mode` is known; `aggregate` requires a known strategy and a non-empty component list; `per_component` must list none. Every `overall.components` entry exists **and is `assessed: true`**. Every assessed component has a scale, and every referenced scale exists. `remediation.level: 'subskill'` requires declared subskills; `'item_tag'` requires declared tags; `below_level` triggers require an ordinal scale and a real level. `variant_scoped` requires the exam to declare variants, and `variants.default` must be one of the declared options.

**Legal gate:** a `live` exam must have both disclaimers; a `live` exam whose `legal._status` starts with `BLOCKED` **fails load**; and if `may_use_mark_in_product_name` is false while the display name contains the mark, warn. This turns "did anyone check the legal wording?" into a build failure rather than a memory test.

---

## 8 · Result provenance — non-negotiable

Every stored result records `engine_version` and `config_version`.

You already know the CEFR thresholds will change when EE-04 completes. Without provenance, that change silently reinterprets every historical result, every trend line mixes two scales, and — because retakes are `school_strict` — no student can re-sit to obtain a comparable score. `rescore_historical_on_config_change` is `false`: history stays as scored, and comparisons across a version boundary must be labelled.

**This must land before the first CEFR result is stored.**

---

## 9 · Legal strings

Render from config, never hard-code. `disclaimer_full` once at onboarding per exam; `disclaimer_short` in the footer. `banned_terms_near_output` is enforced in the UI.

For CEFR specifically: **there is no such thing as CEFR certification or accreditation.** The Council of Europe states it does not verify or validate links between examinations and CEFR levels. "Aligned to", "CEFR-referenced" and "estimated CEFR level" are defensible; "certified", "official CEFR level" and "recognised by the Council of Europe" describe something that does not exist.

Strings are `DRAFT_FOR_COUNSEL`. When the lawyer edits wording it is a config edit — zero code change. OET's block is `BLOCKED_ON_COUNSEL` and will fail config load if set live.

---

## 10 · Adding an exam — the actual checklist

1. Add the object under `exams`. Declare components, scales (reuse where possible), `overall.mode`.
2. If its aggregation maths already exists, **stop — you are done.**
3. If not, add a strategy implementing the interface in §2 and register its name.
4. If a component's `delivery` has no runner, build the renderer. **This is the real cost** — of 18 components across the five exams in v2, 15 reuse existing runners; the exceptions are a quantitative item renderer (GRE Quant, GMAT Quant), a Data Insights renderer (GMAT), and OET Speaking roleplay.
5. Run the validator. Run `run-vectors.js`.

**The DoD test:** grep the codebase for `IELTS`, `B1`, `6.5`, `41.25`. Hits in `src/` outside the config loader mean the abstraction leaked. The one legitimate exception is the strategy registry, where strategy *names* are code by design — and, until §4.1 of EE-00 is resolved, the Prisma `ExamType` enum.
