# Exam Engine — Test Vectors (v2)

**Reads with:** `EE-01_Exam_Engine_Spec_v2.md` · `exam-engine-config.v2.json`
**Executable form:** `run-vectors.js` against `reference-impl.js` — **75 vectors, 75 pass.**

> **Every value below was computed, not asserted.** v1's vectors were written by hand and contained two arithmetic errors and one self-contradiction that survived review because nobody executed them. Run `node run-vectors.js` in CI; a doc that disagrees with the runner is a doc bug.

**Corrections from v1, up front:**

| v1 said | Correct | Why |
|---|---|---|
| phonology 45% → **A2** | **B1** | 45 ≥ 41 (v1 threshold) and ≥ 41.25 (v2). Wrong under both. |
| 95% at C2 → progress **1.00** (§3) and **0.286** (§2) | `next_rung: null`, `progress_to_next: null`, `within_level_progress: 0.20` | Same input, two published answers. And a full bar toward a level that does not exist is a fake signal. |
| CEFR thresholds 14/24/41/**59**/**79**/93 | 15/25/41.25/**61.25**/**82.50**/93.75 | Did not match their own stated GSE derivation. B2 was 2.25 low, C1 3.5 low. |
| improvement a2→b1 = **"+2 levels"** | **"+1 level"** | a2=2, b1=3. |
| IELTS s=5.90 → rung 5.5, progress 0.80, *and* invariant must throw | headline 6.0, next 6.5, progress 0.30 | v1's own note admits headline and rung diverge here, which trips v1's own invariant. |

---

## §0 · Config validation

```
errors: 0        warnings: 15
```

Expected warnings — all intentional, none blocking:

- `cefr_6: thresholds are PROVISIONAL_UNCALIBRATED` — until EE-04 completes.
- `ielts: may_use_mark_in_product_name=false but public_display_name contains 'IELTS'` — a counsel judgement, surfaced rather than hidden.
- 13 × `remediation declared but has no content_refs or drill_tags` — the remediation library is empty. Correct today; these must go to zero before the feature ships.

**Assert:** `validateConfig(config).errors.length === 0`.

### Negative cases — each must be rejected on load

| Bad config | Expected |
|---|---|
| CEFR thresholds not ascending (b1=41.25, b2=39) | reject |
| Lowest threshold ≠ 0 | reject |
| `report_floor` 10.0 > `scale_max` 9.0 | reject |
| `overall.strategy: "unknown"` | reject |
| `overall.mode: "aggregate"` with empty `components` | reject |
| `overall.mode: "per_component"` **with** components listed | reject |
| `overall.components` names a component with `assessed: false` | reject |
| Assessed component with no `scale` | reject |
| Component references a scale id that does not exist | reject |
| `remediation.level: "subskill"` on a component with no subskills | reject |
| `remediation.trigger.kind: "below_level"` on a numeric scale | reject |
| `variant_scoped: true` on an exam with no `variants` | reject |
| `variants.default` not among the declared options | reject |
| Grade bands that do not tile at the scale's step | reject |
| `status: "live"` with `legal._status` starting `BLOCKED` | reject |
| Speaking item in the shared bank missing its `cefr` tag | reject before viva use |

---

## §1 · `roundHalfUpToStep(v, 0.5)`

Isolate and test this alone — it is the single most bug-prone function in the engine.

| input | expected |
|---|---|
| 6.25 | **6.5** |
| 6.75 | **7.0** |
| 6.24 | 6.0 |
| 6.26 | 6.5 |
| 5.75 | 6.0 |
| 5.74 | 5.5 |
| 6.5 | 6.5 |
| 0.25 | 0.5 |
| −0.25 | 0.0 |

**Must NOT use banker's rounding.** `Math.round` is half-up for positives, so `6.25 / 0.5 = 12.5 → 13 → 6.5`. A banker's implementation returns 12 → 6.0 and fails row 1. The `+1e-9` epsilon defends against binary float representation (12.499999999 for 12.5).

---

## §2 · IELTS `band_mean`

| L | R | W | S | continuous mean | reported band | note |
|---|---|---|---|---|---|---|
| 6.0 | 6.5 | 6.0 | 6.5 | 6.25 | **6.5** | half rounds up |
| 7.0 | 6.5 | 7.0 | 6.5 | 6.75 | **7.0** | half rounds up |
| 6.0 | 6.0 | 6.5 | 6.0 | 6.125 | **6.0** | below .25 → down |
| 6.5 | 6.5 | 6.0 | 6.5 | 6.375 | **6.5** | at/above .25 → up |
| 3.0 | 4.0 | 3.5 | 3.5 | 3.5 | **4.0** | clamped to report_floor |
| 9.0 | 9.0 | 9.0 | 9.0 | 9.0 | **9.0** | ceiling |

**New in v2 — the clamp must not be lossy:**

```
bandMean({3.0, 4.0, 3.5, 3.5}).clamped    === true
bandMean({3.0, 4.0, 3.5, 3.5}).value      === 4.0    // displayed
bandMean({3.0, 4.0, 3.5, 3.5}).value_raw  === 3.5    // used for improvement maths
```

Without `value_raw`, a student moving from a true 3.0 to a true 4.5 shows +0.5 instead of +1.5 — the floor eats the progression signal. Assert both fields.

---

## §3 · CEFR level mapping

Thresholds (min %, inclusive): `below_a1 0 · a1 15 · a2 25 · b1 41.25 · b2 61.25 · c1 82.5 · c2 93.75`

| pct | level | why |
|---|---|---|
| 0 | below_a1 | floor |
| 14 | below_a1 | under a1 |
| 14.99 | below_a1 | just under |
| **15** | **a1** | exact threshold is inclusive |
| 24 | a1 | under a2 |
| **25** | **a2** | exact threshold |
| 41 | a2 | **just under b1 — this is the row v1 got wrong** |
| **41.25** | **b1** | exact threshold |
| 55 | b1 | mid-band |
| 61 | b1 | just under b2 |
| **61.25** | **b2** | exact threshold |
| 82.49 | b2 | just under c1 |
| **82.5** | **c1** | exact threshold |
| 93.74 | c1 | just under c2 |
| **93.75** | **c2** | exact threshold |
| 100 | c2 | ceiling |

### `withinLevelProgress(pct, level)`

| pct | level | progress | maths |
|---|---|---|---|
| 50 | b1 | **0.4375** | (50 − 41.25) / 20 |
| 41.25 | b1 | 0.00 | at lower bound |
| 61 | b1 | 0.9875 | (61 − 41.25) / 20 |
| 95 | c2 | **0.20** | (95 − 93.75) / 6.25 |
| 93.75 | c2 | 0.00 | at lower bound |
| 100 | c2 | 1.00 | ceiling |

---

## §4 · `cefr_hybrid` — overall and profile

Subskill percents: `range 60 · accuracy 55 · fluency 62 · interaction 50 · coherence 58 · phonology 45`

- avg = 330 / 6 = **55.0**
- overall = `pctToLevel(55)` = **b1**
- within-level progress = (55 − 41.25) / 20 = **0.6875**

**The profile is never dropped — assert all six:**

| subskill | % | level | within-level |
|---|---|---|---|
| range | 60 | B1 | 0.9375 |
| accuracy | 55 | B1 | 0.6875 |
| fluency | 62 | **B2** | 0.0353 |
| interaction | 50 | B1 | 0.4375 |
| coherence | 58 | B1 | 0.8375 |
| **phonology** | **45** | **B1** | 0.1875 |

> **v1 asserted phonology 45% → A2.** Wrong under v1's thresholds (b1 min 41) and v2's (41.25). This is the test guarding the honest-weakness-reporting feature; written against a wrong expected value, it would have been "fixed" by breaking the code.

Note `fluency` at 62% sits **0.035 into B2** — barely over the boundary. Good boundary coverage, and a useful reminder that a single subskill crossing a threshold is inside the noise until EE-04 establishes the measurement error.

---

## §5 · Progression

### 5a · IELTS momentum — rounding-interval model

| continuous mean | headline | interval | next rung | progress |
|---|---|---|---|---|
| 5.60 | 5.5 | [5.25, 5.75) | 6.0 | **0.70** |
| 5.90 | **6.0** | [5.75, 6.25) | **6.5** | **0.30** |
| 6.00 | 6.0 | [5.75, 6.25) | 6.5 | 0.50 |
| 6.24 | 6.0 | [5.75, 6.25) | 6.5 | 0.98 |
| 6.25 | 6.5 | [6.25, 6.75) | 7.0 | 0.00 |
| 8.90 | 9.0 | — | **null** | **null** |
| 9.00 | 9.0 | — | **null** | **null** |

**Assert explicitly:** at the cap, `next_rung === null` **and** `progress_to_next === null`. Never `1.00`.

Row 2 is the case that broke v1: headline 6.0 with "80% of the way to 6.0". Under v2 the headline is 6.0 and the bar points at 6.5.

### 5b · CEFR momentum

| avg | current | next | progress_to_next | within_level_progress |
|---|---|---|---|---|
| 55 | b1 | **b2** | 0.6875 | 0.6875 |
| 95 | c2 | **null** | **null** | 0.20 |

### 5c · Improvement since baseline

- IELTS: baseline 4.0 (challenge), current 5.5 → **+1.5 bands** — computed on `value_raw`.
- CEFR: baseline a2 (index 2), current b1 (index 3) → **+1 level**. *(v1 published "+2 levels" for this pair.)*
- Level order: `below_a1 0 · a1 1 · a2 2 · b1 3 · b2 4 · c1 5 · c2 6`.

### 5d · Trend (window 3)

| last 3 | expected |
|---|---|
| 5.0, 5.5, 6.0 | up |
| 6.0, 6.0, 6.0 | flat |
| 6.5, 6.0, 5.5 | down |
| **4.0, 7.0, 5.0** | **up** |

Row 4 is the disambiguation case. First-versus-last says **up**; least-squares slope says **down**. v1's spec said "sign of the slope" while its vectors implied first-versus-last. **This suite implements first-versus-last** — if you change the rule, change this row and the spec in the same commit.

Also assert the window **only contains sessions of one instrument type**. Mixing an IA and a full mock measures difficulty, not progress.

---

## §6 · The envelope invariant

**Guarded field:** `progression.headline.value` must equal `overall.value`. Because `headline` is *copied* from `overall` rather than recomputed, the invariant is structurally true — which is the point.

**Not guarded:** `progression.momentum.*`. Divergence there is legal and expected.

```
buildEnvelope({ overall: bandMean({6,6,6,5.5}) , momentum: numericMomentum(5.875, 6.0) })
  → headline 6.0, momentum next 6.5 at 0.25, trend up      // builds
```

**Regression test for the v1 design:** construct a result where the momentum rung (6.0) is written into `progression.current` while `overall.value` is 5.5. A naive guard throws — which is exactly what v1 would have done on a legitimate result. Assert that v2's envelope **does not** produce that shape.

---

## §7 · Exams with no computable headline

| exam | `overall.mode` | `overall.strategy` |
|---|---|---|
| oet | `per_component` | null |
| gre | `per_component` | null |
| gmat | `per_component` | null |

Also assert:

- `scales.gmat_total.computable === false` — the scale is declared so a real, student-entered GMAT score can be stored; it must never be computed.
- `exams.gre.overall.unofficial_aggregate.enabled === false` — the V+Q sum stays off.
- The envelope's `overall` is **null** for these exams and the consumer renders a per-component report. **Add a frontend test for this** — it is the case most likely to throw a null-dereference in production, because every other exam has a headline.

---

## §8 · OET grade banding

| score | grade |
|---|---|
| 500 | A |
| 450 | A |
| 440 | B |
| 350 | B |
| 340 | C+ |
| 300 | C+ |
| 290 | C |
| 200 | C |
| 190 | D |
| 100 | D |
| 90 | E |
| 0 | E |

Three structural assertions:

1. Bands **tile at step 10** — `band[i].min − band[i−1].max === 10` for every adjacent pair.
2. Bands **span the whole scale** — lowest min 0, highest max 500.
3. **A 1-point tiling check returns false.** Assert that explicitly, so nobody later "fixes" the validator into rejecting a correct config.

---

## §9 · Coverage gaps — write these next

Not yet covered by the runner, in priority order:

1. **Viva session logic** — `max_questions` / `min_questions` enforcement, bank filtering by `required_tag: cefr`, and the four failure modes (upload fails → `audio_url: null`; transcription fails → `scored_at: null`; abandoned session; uncapped loop). Each answer is an independent row, so per-question state must be independently assertable.
2. **Unlock rule** — `completed >= min(6, scheduled_in_window)` across a rolling 30-day window, including the forfeited-does-not-count case and the institute-schedules-fewer-than-6 case.
3. **Baseline parity** — the diagnostic uses the same `overall.components` rule as a live assessment. A one-line bug here quietly corrupts every progression number.
4. **Provenance** — a result scored under `config_version` 2.0.0 is still readable, and still labelled 2.0.0, after the config moves to 2.1.0.
5. **Unit-mismatch rejection** — a strategy declaring `consumes: 'percent'` handed a `{ unit: 'band' }` input must throw at the boundary, not compute.
