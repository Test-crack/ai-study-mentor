# Exam Engine — What Changed, and Why

**From:** Founder
**To:** Backend Engineering
**Date:** 20 August 2026
**Supersedes:** `phase5_implementation_plan.md`, `exam-engine-spec.md`, `exam-engine-config.json`, `exam-engine-test-vectors.md`, `dev-task-board.md`
**Read with:** `EE-00` (full review) · `EE-01` (spec v2) · `EE-02` (vectors v2) · `EE-03` (task board v2) · `EE-04` (calibration) · `exam-engine-config.v2.json` · `reference-impl.js`

---

## 0 · Why there is a v2 at all

Two things happened after you sent the blocker list.

First, I answered the open items you flagged — retake policy, graded attempts, the unlock rule, and the speaking-only question. Those answers are now config, not prose.

Second, we widened the scope: the engine has to carry **OET, GRE and GMAT**, not just IELTS and Spoken English. That widening broke an assumption sitting underneath all four documents, and finding it early is the reason this brief exists.

We also **executed** the test vectors rather than reading them. That surfaced three defects that had survived review. None of them were judgement calls — they were the kind of thing only a runner catches.

**Nothing here is a criticism of the direction.** The direction was right, and most of the architecture survives intact. What changed is listed below with the reason attached to each item, so you can push back on any of it.

---

## 1 · What is NOT changing — your calls that were correct

Worth stating explicitly so you don't rebuild things that were already right.

| Your decision | Status |
|---|---|
| **Engine lives in the backend. Scoring is backend-owned and authoritative.** | **Kept.** Correct and not up for debate. |
| **Client syncs via an API projection, not a copy.** | **Kept, and now enforced.** See §5 — v1's task board contradicted this and the projection wins. |
| **Scoring functions never leave the server.** | **Kept.** |
| **IELTS wraps existing `bandScale.ts` logic byte-for-byte. Zero behaviour change is the correctness bar.** | **Kept.** Still the single most important guardrail in the project. |
| **`band_score` stays `Decimal`; non-numeric scales live in `sub_scores` JSON.** | **Kept.** |
| **A scoring strategy is a pluggable object selected by name, never an `if (examId === …)`.** | **Kept.** You wrote this was "the single most important line in this doc." Agreed, and it's why the components model works at all. |
| **Legal strings in config, `DRAFT_FOR_COUNSEL`, editable without a deploy.** | **Kept and extended** — the legal block is now machine-checkable (§12). |
| **`never_inflate_assessed_score`. The placebo is framing, never a fake number.** | **Kept.** The corrected progression layer is *more* faithful to this principle, not less. |
| **Fail-loud config validation on load.** | **Kept and expanded** to 40+ rules, all implemented in `reference-impl.js`. |
| **Half-up rounding, explicitly not banker's.** | **Kept.** Your `roundHalfUpToStep` with the epsilon is correct as written; it passes all nine rounding vectors unchanged. |

---

## 2 · Change 1 — one architecture, not two

**What changed:** we're going with **config-as-data**. Exam declaration lives in a config document loaded and validated at boot. Strategies stay as code, selected by name.

**Why:** `phase5_implementation_plan.md` and the spec/task-board set describe two different engines, and you can't build both.

| | Implementation plan | Spec + task board |
|---|---|---|
| Exam data | `exams/ielts.ts`, `exams/spoken.ts` | `exam-engine-config.json` |
| Registry | `EXAM_REGISTRY: Record<ExamType, ExamConfig>` | JSON, loaded and cached |
| Strategy interface | `formatSkillScore(fraction)` + `overall(...)` | `scoreSubskill` / `scoreSkill` / `scoreOverall` / `validateConfig` |
| Route | `GET /api/exams` | `GET /exams/{exam_id}/config` |
| **Adding exam #3** | **a new `.ts` file — a code change** | **a config object — config only** |

The task board's definition of done says *"a hypothetical exam #3 with existing scoring = config-only, zero code change."* The plan's architecture makes exam #3 a new TypeScript file. If you'd built from the plan, you'd have failed a bar you were never building against. That's on the documents, not on you.

**One addition:** put the config in an `exam_configs` table, keyed `(exam_id, config_version)`, seeded from the JSON file. The file stays in the repo as the reviewable artefact; the table is what the engine reads. Without this, "config-only change" still means "deploy" — including the post-calibration threshold change we already know is coming and the OET regulator-target updates.

---

## 3 · Change 2 — `skills` becomes `components`, and the model splits in three

**What changed:** the `skills` array is gone. Exams declare `components`. Modality (reading / listening / writing / speaking / quantitative / integrated) is an **optional tag** on a component, not the organising rule.

**Why:** "four language skills" fits IELTS, Spoken English and OET. It does not fit GRE (Verbal / Quant / Analytical Writing) or GMAT (Quant / Verbal / Data Insights) — neither has listening or speaking at all. Forcing them into a four-skill shape means either empty skills or special-casing, and special-casing is exactly what the strategy slot exists to prevent.

**The refinement worth understanding:** the generalisation isn't one concept, it's three. v1 conflated them, which is why GRE didn't fit.

> A **component** is a unit of the exam.
> A **scale** is how a number is expressed.
> An **aggregation rule** is how components combine — or that they do not.

Scales are now defined once at the top level and referenced by id, so `ielts_band`, `cefr_6`, `oet_500`, `gre_section`, `gre_analytical_writing`, `gmat_section` and `gmat_total` are declared in one place and reused.

```jsonc
{
  "id": "speaking",
  "label": "Speaking",
  "modality": "speaking",     // OPTIONAL tag — picks the runner, carries no scoring meaning
  "assessed": true,           // false = practice surface
  "scale": "cefr_6",
  "delivery": "viva",
  "weight": 1.0,
  "subskills": [...],
  "item_tags": [...],
  "remediation": {...},
  "variant_scoped": false
}
```

**Also merged:** v1 had `surface_only` on a skill *and* `skills_in_overall` on the scoring block — two mechanisms encoding one fact, which drift the moment someone edits one. Now it's `assessed: true|false` only, and the validator asserts `overall.components ⊆ {components where assessed}`. Same for `viva.applies_to_modules`, which duplicated `modules.*.speaking_mode` — removed and derived instead.

---

## 4 · Change 3 — `overall.mode`, and a nullable `overall` — **the important one**

**What changed:** the result envelope's `overall` is now **nullable**, gated by a new field:

```jsonc
"overall": { "mode": "aggregate", "strategy": "band_mean", "components": [...] }
"overall": { "mode": "per_component" }
```

**Why: three of the five exams have no headline score. This is a fact about the exams, not a gap in the spec.**

| Exam | Overall? | Source |
|---|---|---|
| IELTS | Yes — mean of four, half-up | — |
| Spoken English | Yes — our own construct | — |
| **OET** | **None. By design.** | CBLA states it three separate ways: Test Regulations (*"An overall grade for the OET Test is not issued"*), results page (*"There is no overall grade for the OET Test"*), statistics page (*"OET does not report overall scores or grades"*). |
| **GRE** | **No official composite.** | ETS's *Guide to the Use of Scores*: *"Consider Verbal Reasoning, Quantitative Reasoning and Analytical Writing Scores as Three Separate and Independent Measures."* The 260–340 "total" is third parties summing V+Q. |
| **GMAT** | Total exists (205–805), **not computable.** | GMAC doesn't publish the formula. It's a proprietary scaled composite of three IRT-scaled section scores. Three sections of 60–90 sum to 180–270 and average to 60–90 — neither maps to 205–805. |

Every one of the four v1 documents assumes `overall` always exists: the envelope requires it, the progression layer climbs a single ladder, the invariant compares against it.

**Build that and OET breaks it — and OET is exam 3, not a hypothetical.**

`per_component` doesn't mean "no result". It means the report is a set of component scores with no headline — which is exactly how OET results are read, and precisely why regulators specify per sub-test (GMC: B in all four; NMC: B in Listening, Reading, Speaking and C+ in Writing; Ahpra from 23 April 2026: Listening 350, Reading 360, Writing 350, Speaking 360).

**What this means for you:**

- The envelope's `overall` is nullable, and there's a per-component report path. That path is *also* what the OET regulator-target feature needs, so it isn't throwaway.
- `target` becomes per-component for these exams. A single "target band" input is IELTS-shaped.
- **Please add a frontend test for `overall: null`.** It's the case most likely to throw a null-dereference in production, because every exam we've built so far has a headline.

**And a rule:** do not ship an estimated GMAT total or enable the GRE V+Q sum. Any number we invent sits next to a famous scale and reads as a prediction of it — the fastest route to a calibration claim we can't defend, which is the one thing this product can't afford. The V+Q aggregate is in the config as `unofficial_aggregate` with `enabled: false`, so the decision is visible rather than accidental.

---

## 5 · Change 4 — progression splits into `headline` and `momentum`

**What changed:**

```jsonc
"progression": {
  "headline": { "value": 6.0, "label": "6.0" },                 // == overall.value. GUARDED.
  "momentum": { "next_rung": 6.5, "progress_to_next": 0.30 }    // free to differ. NOT guarded.
}
```

**Why: the v1 invariant fires on a legitimate result, and the documents say so.**

- Task board §0: *"`progression.current.value` must equal `overall.value`. Assert it; throw if not."*
- Spec §7, same page: *"the headline band and current_rung intentionally differ at s=5.90 (band 6.0, rung 5.5) — that's expected."*
- Test vectors §3 publishes that exact row, **and then** publishes a case asserting the builder must throw when current is 6.0 and overall is 5.5.

So the set says the two must be equal, will legitimately differ, and that differing is a throwable bug. Root cause: **one field name doing two jobs.** `progression.current` was being used both for the assessed headline and for the bottom of the momentum bar.

Now `headline` is **copied** from `overall` rather than recomputed, so the invariant is structurally true rather than a runtime hope, and divergence lives in `momentum` where it's legal.

**There was a UX bug underneath the assertion bug.** At a continuous mean of 5.90, v1 renders "Band 6.0" and "80% of the way to 6.0" on the same screen. Telling a student they're 80% of the way to a band they already hold is worse than showing nothing.

**Corrected model — the bar spans the rounding interval of the current headline.** Band 6.0 covers continuous means [5.75, 6.25); filling the bar is exactly the moment the headline rounds up.

```js
const lo    = headline - scale.step / 2;
const atCap = headline >= scale.max;
next_rung        = atCap ? null : headline + scale.step;
progress_to_next = atCap ? null : clamp((continuousMean - lo) / scale.step, 0, 1);
```

| mean | headline | next | progress |
|---|---|---|---|
| 5.60 | 5.5 | 6.0 | 0.70 |
| 5.90 | **6.0** | **6.5** | 0.30 |
| 6.00 | 6.0 | 6.5 | 0.50 |
| 6.24 | 6.0 | 6.5 | 0.98 |
| 6.25 | 6.5 | 7.0 | 0.00 |
| 9.00 | 9.0 | **null** | **null** |

**At the cap: null, not `1.00`.** v1 published 1.00, which renders a full bar toward a level that doesn't exist — and contradicted its own §2, which gave 0.286 for the same input.

---

## 6 · Change 5 — CEFR thresholds corrected

**What changed:** `0 / 14 / 24 / 41 / 59 / 79 / 93` → `0 / 15 / 25 / 41.25 / 61.25 / 82.5 / 93.75`.

**Why: they didn't match their own stated provenance.** The config documents them as *"GSE-anchored (Pearson Global Scale of English 10–90) converted to 0–100%."* Pearson's published mapping is below A1 10–21, A1 22–29, A2 30–42, B1 43–58, B2 59–75, C1 76–84, C2 85–90. Applying `pct = (GSE − 10) / 80 × 100`:

| Level | GSE min | Correct % | v1 | Error |
|---|---|---|---|---|
| A1 | 22 | 15.00 | 14 | −1.00 |
| A2 | 30 | 25.00 | 24 | −1.00 |
| B1 | 43 | 41.25 | 41 | −0.25 |
| **B2** | 59 | **61.25** | **59** | **−2.25** |
| **C1** | 76 | **82.50** | **79** | **−3.50** |
| C2 | 85 | 93.75 | 93 | −0.75 |

B2 and C1 are materially wrong — it looks like the raw GSE number was used for B2 instead of its percentage. **Every student scoring between 59% and 61.25% was being promoted from B1 to B2 by an arithmetic slip.**

**Two caveats now recorded in the config.** These boundaries import *Pearson's* alignment of GSE to CEFR — we're borrowing a vendor's alignment claim, not making our own. And they stay provisional until the calibration study runs. The scale carries `_calibration_status: PROVISIONAL_UNCALIBRATED`, the validator warns on it, and results carry `provisional: true`. That's deliberate: it stops "provisional" quietly becoming permanent.

---

## 7 · Change 6 — three defects in the test vectors

Found by executing them. All three are now corrected in `EE-02`, and the runner is `run-vectors.js` — **75 vectors, 75 passing.** Put it in CI.

**a) "Phonology 45% → A2" is wrong.** With `b1: 41`, 45 ≥ 41, so it's **B1**. With the corrected 41.25, still B1. Wrong under both.

This one matters beyond the row: it's the *"assert the profile is never dropped"* test — the one guarding our honest-weakness-reporting feature. Written against a wrong expected value, the natural fix would have been to make the code wrong.

**b) The vectors contradict themselves.** 95% at C2: §2 says `withinBandProgress` = 0.286; §3 says `progress_to_next` = 1.00. Same input, two published answers. (Correct behaviour: `next_rung` and `progress_to_next` are null at the cap; `within_level_progress` is 0.20 under the corrected thresholds.)

**c) "a2 → b1 = +2 levels."** a2 = 2, b1 = 3. It's +1.

**Process note, offered rather than imposed:** all three would have been caught by running the vectors once. That's the argument for `reference-impl.js` existing at all — it's a specification you can execute, so the doc and the maths can't drift.

---

## 8 · Change 7 — explicit score units

**What changed:** a `RawScore` type at the boundary, and strategies declare what they consume.

```ts
type RawScore =
  | { unit: 'percent'; value: number }               // 0–100
  | { unit: 'band'; value: number; scale: string }
  | { unit: 'raw'; correct: number; total: number };
```

**Why:** v1 used three different numeric domains with no declared conversion — the plan's `formatSkillScore(fraction)` is 0–1, spec §2's IELTS input is a 0.0–9.0 band, spec §3's CEFR input is a 0–100 percent. Nothing said where conversion happens.

A silent unit mismatch here produces scores that are **wrong but entirely plausible**. Nothing crashes, nothing looks odd, and nobody notices for months. That's the worst failure mode available to us, and it's cheap to close: declare the unit, validate at the boundary, throw on mismatch at load.

---

## 9 · Change 8 — variants

**What changed:** a `variants` block per exam (`dimension`, `options`, `applies_to_components`, `default`) plus `variant_scoped: true|false` per component.

**Why:** IELTS is Academic **or** General Training — different Reading and Writing papers, different published reliabilities. OET's Writing and Speaking are **profession-specific across 12 professions** while Listening and Reading are shared. Neither the v1 config nor the schema had anywhere to put this, and content selection, scoring norms and question banks all depend on it.

**Heads-up on cost:** this is the single biggest content fact about OET — 2 shared banks plus 2 × N profession-specific banks. Launch scope is nursing only, and that's now explicit in the config rather than discovered later.

**Schema gap:** there's no variant column today. Flagged as **B23** on the task board.

---

## 10 · Change 9 — provenance on every result

**What changed:** every stored result records `engine_version` and `config_version`. `rescore_historical_on_config_change: false`.

**Why:** we already know the CEFR thresholds change when calibration completes. Without provenance, that change silently reinterprets every historical result, every trend line mixes two scales, and — because retakes are `school_strict` — no student can re-sit to get a comparable score.

**This has to land before the first CEFR result is stored.** It's the cheapest item on the board and the only one that can't be added retrospectively.

---

## 11 · Change 10 — remediation at three levels

**What changed:** `remediation` can attach at `component`, `subskill` **or `item_tag`** level, with a trigger (`below_pct`, `below_level`, `below_score`), `content_refs`, `drill_tags` and `max_items`.

**Why the `item_tag` level isn't a nicety:** Listening and Reading have **no scored subskills** by design — their tags are analytics only. They're also where students spend most of their drilling time. Without tag-level remediation, the feature can't work at all on the two components that need it most. Tag-level is what lets us say "you keep missing matching-headings, here's the video."

**Three corrections to how this was scoped:**

1. **Reference content, never embed URLs.** `content_refs` are IDs resolved against the content table. Put URLs in config and the config becomes a CMS — every video swap becomes a deploy, and the media team needs a developer.
2. **Language is "suggested practice", not "your weakness is X".** Sub-skill scores are far less reliable than composites — that's why IELTS publishes composite reliability around 0.97 against roughly 0.90 for single skills. A confident weakness claim from one noisy sub-score is exactly the overclaiming our calibration thesis exists to avoid.
3. **The validator now rejects** `remediation.level: 'subskill'` on a component with no subskills, and warns when remediation is declared with nothing to surface. All 15 components warn today — the library is empty, which is fine, but it should be visible rather than assumed.

---

## 12 · Change 11 — config projection and two endpoints

**What changed:**

| Route | Auth | Returns |
|---|---|---|
| `GET /api/exams/public` | none | `exam_id`, naming, legal text, `status` |
| `GET /api/exams` | authenticated | Full `PublicExamConfig[]` — components, labels, scale *shape*, targets, module flags |

`toPublicConfig()` strips every key beginning `_`, all `thresholds_min_pct`, and all strategy params.

**Why:** task board B1 said the endpoint *"returns the exam object verbatim"*; the implementation plan said scoring never leaves the server. Both can't hold — the config contains `thresholds_min_pct`, which is scoring. Verbatim also ships `_status: DRAFT_FOR_COUNSEL` and every internal note to the browser, and lets any student read the exact percentage needed for B2.

The unauthenticated split is new: marketing pages render exam names before login.

---

## 13 · Change 12 — the legal block is now machine-checkable

**What changed:** `rights_holder`, `may_use_mark_in_product_name`, `required_attribution`, `permission_status`, `review_contact`, `banned_terms_near_output`. A `live` exam whose `legal._status` starts with `BLOCKED` **fails config load**.

**Why:** "did anyone check the legal wording?" becomes a build failure instead of a memory test. It immediately caught one thing — IELTS has `may_use_mark_in_product_name: false` while the display name is "IELTS Preparation". That's a legal judgement, not an engineering one, so the validator warns rather than silently passing.

**The three restricted marks are not equally restricted, and this affects sequencing:**

- **GRE / ETS — most workable.** ETS publishes an explicit third-party policy: exact attribution *"GRE is a registered trademark of ETS. This product is not endorsed or approved by ETS."*, no ETS marks in company, domain or product names, no logos, and materials submitted to trademarks@ets.org for review (~10 working days). Build that review step into the launch checklist.
- **GMAT / GMAC — unclear.** No public third-party guidance; the only route is legal@gmac.com. Absence of a carve-out is not permission.
- **OET / CBLA — most restrictive, and it's our exam 3.** CBLA's IP policy says its marks *"cannot be used without the prior express written permission of CBLA"*, and there's **no published nominative-use carve-out for preparation providers** — they run a paid Preparation Provider Programme instead. Materially more restrictive than the IELTS position.

**OET's display name is now "Healthcare English Preparation" and its legal block is `BLOCKED_ON_COUNSEL`, so it cannot go live on this config.** I'm getting counsel's answer before we commit content spend. Don't treat that as a formality — there's a real chance of "no".

**CEFR is a different kind of risk.** The v1 config lists the Council of Europe as `trademark_owner`; the CEFR is a published framework, not a licensed mark, so the exposure is misrepresentation rather than infringement. And the specific thing to avoid is sharper than "don't say certified": the Council of Europe states it *"is not the role of the Council of Europe to verify and validate the quality of the link between language examinations and the CEFR's proficiency levels."* **There is no such thing as CEFR certification.** Anyone claiming it is describing something that doesn't exist.

---

## 14 · Your open items — answered

Moved to a platform-wide `defaults` block, since these are the same for every exam and a per-exam `rules` block can't express that without repetition.

```jsonc
"attempts": { "retake_policy": "school_strict", "allow_retake": false, "on_missed_window": "forfeit" },
"graded_attempts": {
  "internal_assessment": { "per": "scheduled_session", "count": 1, "forfeited_counts_toward_unlock": false },
  "full_mock": { "per": "rolling_30_days", "count": 1,
    "unlock_requirement": { "min_internal_assessments_completed": 6,
                            "window": "rolling_30_days",
                            "or_all_scheduled_in_window": true } }
}
```

**1. Retake policy — school-strict.** Assessments are scheduled; missing the window forfeits the attempt; no retake. Practice and drills stay unlimited and ungraded. Platform-wide.

**2. Graded attempts.** One graded attempt per scheduled IA. One full mock per rolling 30 days, once unlocked.

**3. Unlock rule.** Six completed IAs in the window. **With one change you should know about:** I've added `or_all_scheduled_in_window`, making the rule `completed >= min(6, scheduled_in_window)`.

Reason: if an institute schedules only five IAs in a month, a student can **never** unlock the mock through no fault of their own. And a student who misses one of six is locked out for a month by a single absence. The fallback fixes both. If you think six should mean six, say so — it's defensible as a discipline mechanism, just harsher than I intend.

**4. "Per month" is now rolling 30 days**, resolved in the institute's timezone. Calendar months punish a student who starts on the 28th, and window boundaries without a declared timezone make students in other timezones forfeit early. `src/lib/timezone.ts` already exists.

**5. Speaking-only for Spoken English — confirmed, and it's easier, not harder.** Two config facts:

```jsonc
"components": [ { "id": "speaking", "assessed": true, ... },
                { "id": "listening", "assessed": false, ... }, ... ],
"overall": { "mode": "aggregate", "components": ["speaking"] }
```

Listening, Reading and Writing stay in the product as practice surfaces with full drills and remediation — they just don't enter the headline. Adding them later is one line. **No code changes either way.**

> **One trap:** the diagnostic must compute the baseline using the **same** `overall.components` rule as a live assessment. If the diagnostic averages four components while assessments average one, `improvement_since_baseline` compares two different quantities and every number in the progression layer is quietly wrong.

### Four questions the answers surfaced — still mine to close

| # | Question | Interim default |
|---|---|---|
| 1 | Is `completed >= min(6, scheduled)` right, or is six strictly six? | fallback enabled |
| 2 | **B2C has no scheduler.** `school_strict` assumes someone schedules assessments, so nothing is ever "missed" *and* the mock never unlocks. | flagged `_b2c_gap`; override field built |
| 3 | Unused mock entitlement at window roll — lapse or carry? | lapse |
| 4 | B2C grace retake — a paid forfeited attempt with no retake is a refund conversation. | 0 for institutes; field exists |

Build the fields now, fill them later. None block starting.

---

## 15 · Two more corrections

**a) `report_floor` was eating the improvement signal.** The baseline is *"intentionally hard and zero-based"*, and the reported band clamps at 4.0. So a student genuinely moving 3.0 → 4.5 shows **+0.5**, not +1.5 — and because diagnostics are deliberately hard, most baselines clamp to exactly 4.0, making every student's "improvement since baseline" start from the same floor.

Fix: `band_mean` returns both `value_raw` (unclamped) and `value` (clamped). Display `value`; compute improvement on `value_raw`. One field.

**b) The trend rule was undefined and mixed instruments.** Spec §7 says *"sign of the slope"*; the vectors imply first-versus-last. On `[4.0, 7.0, 5.0]` those give opposite answers. **v2 implements first-versus-last** — change the code and the spec together if you prefer least-squares.

Separately: with one IA per session and one mock per month, a 3-session window mixes two instruments of different difficulty, so the trend measures *which instrument you last sat*. `trend_within_instrument_only: true` is now set.

---

## 16 · Three decisions I need from you before you write code

These are load-bearing. Everything else can be adjusted as we go.

| # | Decision | My recommendation | Cost of deferring |
|---|---|---|---|
| **D1** | Config-as-data, or a TypeScript module per exam? | **Config-as-data**, seeded into `exam_configs`. Strategies stay code. | Every threshold and regulator-target change becomes a deploy. The config-only DoD becomes unmeetable. |
| **D2** | Prisma `ExamType` enum, or an `Exam` table? | **`Exam` table**, string FK. If you'd rather defer: add every planned enum value now and keep `prisma_enum` in each config. | **GMAT isn't in the enum** — so registering it needs a migration, i.e. the config-only promise failing on the very first new exam. Also: the enum says `SPOKEN`, the config says `spoken_english`, the short code says `SPK-EN`. Three names, nothing pinning them. Cheap now; a migration under load after exam 3 ships. |
| **D3** | Is `overall` nullable from day one? | **Yes.** | The most expensive item to retrofit. OET forces a rewrite of the result contract and every consumer of it. |

Push back on any of these with reasoning and I'll take it.

---

## 17 · What this does to your schedule

**Roughly neutral, with the work redistributed.**

**Not more work:** the components rename is mechanical. The scale extraction is a refactor of data you'd already written. `overall.mode` is one branch you'd have needed anyway once OET landed — it's cheaper now than later. The corrected thresholds and vectors are a find-and-replace.

**Genuinely new:** `per_component` result path (**B7**), provenance (**B9**), `RawScore` boundary (**B4**), variant scoping (**B23**), tag-level remediation (**B24**). Call it a week.

**Removed from your plate:** `exams/ielts.ts` / `exams/spoken.ts` / `exams/oet.ts` as separate modules — that's config now.

**Not in the backend estimate at all**, and sized separately as frontend work: of 18 components across the five exams, **15 reuse existing runners** via the modality tag. Three don't — a quantitative item renderer (GRE Quant + GMAT Quant, built once), a Data Insights renderer (five distinct interaction patterns, the most expensive thing in the config), and OET Speaking roleplay.

That's the honest shape of "no future rewrites": the engine stops being the bottleneck and item rendering becomes it. Worth saying now so nobody's surprised at exam 4.

---

## 18 · Start here

**Week 1** — D1/D2/D3 answered, then **B1** (config loader + table + seed) → **B2** (validator; port the 40+ rules from `reference-impl.js`) → **B3** (strategy interface + registry) → **B4** (`RawScore` boundary).

**Start immediately, no dependencies:** **B22**, CEFR-tagging the shared speaking bank. It blocks the viva work (B20) and nothing blocks it.

**Everything through week 3 is unit-testable** against `run-vectors.js` with no frontend and no live API.

**Definition of done, unchanged in spirit and sharpened in detail:** grep for `IELTS`, `B1`, `6.5`, `41.25` — hits in `src/` outside the config loader mean the abstraction leaked. Legitimate exceptions are the strategy *name* registry and the Prisma enum until D2 lands.

---

## 19 · The files

| File | What it's for |
|---|---|
| `EE-00_Review_and_Corrections.md` | The full review, with every finding and its evidence. Read if you want the reasoning behind anything above. |
| `EE-01_Exam_Engine_Spec_v2.md` | The spec. Replaces `exam-engine-spec.md`. |
| `EE-02_Test_Vectors_v2.md` | Corrected and extended vectors. Every value computed, not asserted. |
| `EE-03_Backend_Task_Board_v2.md` | B1–B24, sequenced for one developer. |
| `EE-04_CEFR_Calibration_Protocol.md` | The calibration study — sample sizes, methods, acceptance thresholds. |
| `exam-engine-config.v2.json` | The config. Five exams. |
| `reference-impl.js` | Executable reference implementation + validator. Port the maths, not the style. |
| `run-vectors.js` | **75 vectors, 75 passing.** Put it in CI. |

---

**Last thing.** Most of what changed here came from widening the scope to five exams and from executing the vectors rather than reading them. Both were my call to make, and neither was available to you when you wrote the originals. The core discipline you set — config over code, pluggable strategies, never inflate the assessed score — is what made the corrections possible at all, because there was a clear rule to check each change against.

If any of this looks wrong, say so before you build it.
