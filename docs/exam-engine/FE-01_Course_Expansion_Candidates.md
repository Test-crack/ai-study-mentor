# Course Expansion — 10 Candidates, Config-Shaped

**By:** Gokul (Frontend Engineering)
**Date:** 20 August 2026
**Reads with:** `EE-01_Exam_Engine_Spec_v2.md` (the contract) · `exam-engine-config.v2.json` (the shape) · `FE-00_Frontend_Parallel_Work_Plan.md`
**Purpose:** ten courses we could add, each expressed in the v2 engine's own vocabulary — components, subskills, scale, aggregation, strategy — so each entry is close to copy-pasteable into `exams.*`.

---

## 0 · How to read this

Every course below is written as the engine expects an exam to be written (`EE-01` §1):

> A **component** is a unit of the course. A **scale** is how a number is expressed. An **aggregation rule** is how components combine — or that they do not.

**The dividing line that matters** (`EE-01` §10): if a course's aggregation maths already exists, adding it is **config only, zero code**. If the maths is genuinely new, it is a new strategy — a real code change. Every entry states which.

### Two rules I held while writing this

**1. I did not invent anybody's official rubric or cut scores.** The v2 config carries `_subskill_todo: "Do not invent them"` on OET Writing and Speaking for exactly this reason (`EE-00` §5.2). So each entry separates:

- **Structure** — what the test publicly is. Where I give specific numbers I mark them `⚠ verify` if they need a primary source before they go in config.
- **Our rubric** — the subskill partition *we* would score on. This is our construct and we own it, the same way Spoken English's six subskills are ours.

Where a real test publishes analytic criteria I have not verified, the entry says so instead of guessing.

**2. Trademark status is on every entry.** Half of these are encumbered marks and get the OET treatment from `EE-05` §13 — a generic product name plus a counsel gate. The other half are courses we own outright with zero trademark exposure. That split changes launch order, so it is the first column of the summary table.

---

## 1 · What I selected for, and what I threw out

**Selected for:**

- **No mathematical content.** Nothing needing equation rendering, figures, or a calculator — so nothing lands on FE-20 (quantitative renderer) or FE-21 (Data Insights renderer), the two most expensive items on the frontend board.
- **Runner reuse.** `EE-00` §5.1: anything tagged `reading` / `listening` / `writing` / `speaking` renders in a runner we already have. 9 of 10 courses here reuse existing runners entirely.
- **Infrastructure we already built.** LexiGrid (vocabulary), speed-reading, the viva recorder, the essay runner, the passage/item runner.
- **Sellable to your actual customers** — Indian institutes B2B, plus B2C.

**Excluded deliberately:**

| Excluded | Why |
|---|---|
| IELTS, Spoken English, OET, GRE, GMAT | Already in `exam-engine-config.v2.json`. |
| TOEFL, PTE | Already reserved in the Prisma enum. |
| SAT, ACT, CAT, actuarial, engineering entrance | Heavily mathematical — fails the constraint and forces FE-20/FE-21. |
| Duolingo English Test | Computer-adaptive with an undisclosed item-selection algorithm and an unpublished scoring formula. Same problem as the GMAT total (`EE-05` §4): **we could not compute it, so any score we showed would be an invention sitting next to a real scale.** Excluded on the same principle that keeps `unofficial_aggregate` disabled. |

---

## 2 · Summary

| # | Course | Trademark | Scale | `overall.mode` | Strategy | Runners | Cost |
|---|---|---|---|---|---|---|---|
| 1 | CEFR Certificate Preparation (B2/C1) | ⚠ Cambridge | new numeric | `aggregate` | `band_mean` ♻ | reuse | **config only** |
| 2 | Canadian Immigration English | ⚠ Paragon | new ordinal 1–12 | `per_component` | none needed | reuse | **config only** |
| 3 | Workplace English Proficiency | ⚠ ETS | new numeric ×2 | `aggregate` ×2 | `band_mean` ♻ | reuse | **config only** |
| 4 | Law Admissions Reasoning | ⚠ LSAC | new numeric 120–180 | `aggregate` | 🆕 `raw_to_scaled` | reuse | new strategy |
| 5 | Aviation English (ICAO) | ✅ open standard | new ordinal 1–6 | `aggregate` | 🆕 `min_of_subskills` | reuse | new strategy |
| 6 | Business & Professional Writing | ✅ ours | `cefr_6` ♻ | `aggregate` | `cefr_hybrid` ♻ | reuse | **config only** |
| 7 | Interview & Group Discussion Readiness | ✅ ours | `cefr_6` ♻ | `aggregate` | `cefr_hybrid` ♻ | ⚠ 2 new | new UI |
| 8 | Presentation & Public Speaking | ✅ ours | `cefr_6` ♻ | `aggregate` | `cefr_hybrid` ♻ | reuse | **config only** |
| 9 | Pronunciation & Intelligibility | ✅ ours | `cefr_6` ♻ | `aggregate` | `cefr_hybrid` ♻ | reuse | **config only** |
| 10 | Competitive Exam English (SSC / Bank / UPSC) | ✅ ours | new numeric | `aggregate` | 🆕 `raw_with_penalty` | reuse | new strategy |

♻ = reuses something already in config · 🆕 = new strategy, i.e. a code change

**Totals: 6 config-only · 3 new strategies · 1 needing new UI · 0 needing the quantitative or Data Insights renderers.**

That last number is the point. Because the brief excluded mathematical content, **the two most expensive frontend items on the board are untouched by all ten courses.** The engine carries them almost for free; the cost is content, not code.

**And 4 of 10 are courses we own outright** — no rights holder, no counsel gate, no `BLOCKED_ON_COUNSEL`. Those can ship on our own schedule, which the four encumbered ones cannot.

---

## 3 · The three new strategies

Specified here so they can be built once and reused, exactly as `band_mean` and `cefr_hybrid` are.

### 3.1 `min_of_subskills` — the one that would have been a real bug

Used by: Aviation English.

**ICAO language proficiency is graded on the *lowest* of its six subskills, not the average.** A pilot at Level 5 on five descriptors and Level 3 on one is **Level 3** — below operational — because the weakest link is the safety risk.

```
scoreOverall(subskills) = min(level(s) for s in subskills)
```

**Why this matters beyond one course:** implement it with `average_then_map` — the rule `cefr_hybrid` uses — and the example above scores 4.67 → Level 5 and passes an operationally unfit candidate. Same class of error as the `overall.mode` finding in `EE-00` §2: an aggregation assumption that is silently wrong for a specific exam. It needs its own strategy, and the validator should reject `average_then_map` on any scale flagged `aggregation: weakest_link`.

### 3.2 `raw_to_scaled` — lookup, not arithmetic

Used by: Law Admissions Reasoning.

Raw correct-count maps to a scaled score through a **per-form conversion table**, because forms differ in difficulty. There is no formula.

```jsonc
{ "strategy": "raw_to_scaled",
  "params": { "table_ref": "form_conversion_table_id", "on_missing_table": "throw" } }
```

**Constraint:** the table is per test form, so it is content, not config — it belongs in a table keyed by form id, referenced by id (the same "reference content, never embed" rule `EE-05` §11.1 sets for remediation). `on_missing_table: throw` matters: a missing table must fail loudly, never silently fall back to a percentage, which would produce a plausible wrong score — the failure mode `EE-01` §2 calls the worst available.

### 3.3 `raw_with_penalty` — negative marking

Used by: Competitive Exam English.

Indian competitive exams deduct for wrong answers, typically ¼ or ⅓ of a mark, with **no penalty for unattempted items**. That distinction is the whole point of the strategy — unattempted and wrong must not be conflated.

```jsonc
{ "strategy": "raw_with_penalty",
  "params": { "correct": 1.0, "incorrect": -0.25, "unattempted": 0.0, "floor_at_zero": true } }
```

Requires the item runner to distinguish **wrong** from **unattempted** in its submitted payload. Worth checking our existing `passage_item_set` runner does that today — if it submits blanks as wrong, every score is depressed.

---

## 4 · The ten courses

### 1 · CEFR Certificate Preparation (B2 / C1)

General-purpose CEFR-anchored English certification prep. Distinct from our Spoken English course, which is speaking-only — this one assesses all four skills plus explicit grammar and vocabulary control.

**Trademark:** ⚠ Cambridge Assessment English. Product name must not use the mark; treat as `BLOCKED_ON_COUNSEL` until cleared, same posture as OET.

**Structure:** four papers — Reading & Use of English, Writing, Listening, Speaking. Overall is the **mean of the paper scores**, which is `band_mean` with a different scale. `⚠ verify` the exact reporting range and pass boundaries against a primary source before they go in config.

**Our rubric:**

| Component | Modality | Assessed | Subskills / item tags |
|---|---|---|---|
| `reading_use_of_english` | reading | ✅ | tags: `multiple_choice_cloze`, `open_cloze`, `word_formation`, `key_word_transformation`, `gapped_text`, `multiple_matching` |
| `writing` | writing | ✅ | subskills: `content`, `communicative_achievement`, `organisation`, `language_range_accuracy` |
| `listening` | listening | ✅ | tags: `gist`, `detail`, `attitude_opinion`, `multiple_matching` |
| `speaking` | speaking | ✅ | subskills: `grammar_vocabulary`, `discourse_management`, `pronunciation`, `interactive_communication` |

```jsonc
"overall": { "mode": "aggregate", "strategy": "band_mean",
             "components": ["reading_use_of_english","writing","listening","speaking"] }
```

**Why it fits:** the `key_word_transformation` and `open_cloze` item types are a natural extension of LexiGrid. Remediation attaches at `item_tag` on Reading/Listening and `subskill` on Writing/Speaking — the exact pattern IELTS already uses.

---

### 2 · Canadian Immigration English

Four-skill English for Canadian immigration and professional registration.

**Trademark:** ⚠ Paragon Testing Enterprises. Generic product name; counsel gate.

**Structure:** four components, each reported on a **level scale of 1–12** ⚠ verify, and — importantly — **no overall score is issued.** Requirements are set per component by the receiving authority.

```jsonc
"overall": { "mode": "per_component", "strategy": null, "components": [] }
```

**This is the highest-value entry on the list architecturally.** It is a second consumer of the `per_component` path that `EE-00` §2 forced us to build for OET. Two courses on that path means it is a real code path with real tests, not an OET special case — and it validates the decision to make `overall` nullable from day one.

| Component | Modality | Assessed | Subskills / tags |
|---|---|---|---|
| `listening` | listening | ✅ | tags: `problem_solving`, `daily_life_conversation`, `news_item`, `discussion`, `viewpoints` |
| `reading` | reading | ✅ | tags: `correspondence`, `applied_instructions`, `information`, `viewpoints` |
| `writing` | writing | ✅ | subskills: `content_coherence`, `vocabulary`, `readability`, `task_fulfilment` |
| `speaking` | speaking | ✅ | subskills: `content_coherence`, `vocabulary`, `listenability`, `task_fulfilment` |

**Target model:** per-component, with presets per receiving authority — structurally identical to OET's `presets` block for GMC / NMC / Ahpra. Same UI (FE-14), no new work.

---

### 3 · Workplace English Proficiency

Business and workplace English. Very large B2B corporate-training market, and the closest fit to institutes that already sell communication training.

**Trademark:** ⚠ ETS. Note from `EE-05` §13 — ETS is the *most workable* of the restricted marks because it publishes an explicit third-party policy with an exact attribution string and a review address. Follow it and we are on documented ground, unlike OET.

**Structure — and an engine limitation worth naming.** This test exists as **two separately administered halves**: Listening & Reading (one combined scaled score) and Speaking & Writing (a separate combined score). They are not aggregated into one figure.

Our engine has no concept of *component groups*, so modelling this as one exam would need either a new grouping feature or a fake headline. **Neither is necessary — model it as two exam entries:**

```jsonc
"workplace_english_lr": { "overall": { "mode": "aggregate", "strategy": "band_mean",
                                       "components": ["listening","reading"] } },
"workplace_english_sw": { "overall": { "mode": "aggregate", "strategy": "band_mean",
                                       "components": ["speaking","writing"] } }
```

Two config objects, zero code. **This is the engine working as designed** — a structural mismatch resolved in config instead of a feature request. Worth noting for the backend dev as evidence the config-as-data call (D1) was right.

| Component | Modality | Subskills / tags |
|---|---|---|
| `listening` | listening | tags: `short_conversation`, `announcement`, `talk`, `meeting_extract` |
| `reading` | reading | tags: `sentence_completion`, `email_correspondence`, `notice_form`, `double_passage` |
| `speaking` | speaking | subskills: `pronunciation`, `intonation_stress`, `grammar`, `vocabulary`, `cohesion`, `task_relevance` |
| `writing` | writing | subskills: `task_completion`, `organisation`, `grammar_accuracy`, `register_tone` |

---

### 4 · Law Admissions Reasoning

Verbal reasoning and reading for law admissions. **Almost entirely non-mathematical** — arguably the best pure fit for the no-math constraint of any real standardized test.

**Trademark:** ⚠ LSAC. No published third-party carve-out that I have verified — treat as restrictive until counsel says otherwise, the GMAC posture from `EE-05` §13.

**Structure:** scored sections are **logical reasoning** (multiple sections) and **reading comprehension**, reported as a single scaled score in a **120–180** band ⚠ verify. A **writing sample is submitted but not scored** — it goes to admissions bodies unscored.

That last fact is a clean use of the `assessed` flag from `EE-05` §3:

```jsonc
"components": [
  { "id": "logical_reasoning",     "assessed": true,  "modality": "reading" },
  { "id": "reading_comprehension", "assessed": true,  "modality": "reading" },
  { "id": "writing_sample",        "assessed": false, "modality": "writing" }
],
"overall": { "mode": "aggregate", "strategy": "raw_to_scaled",
             "components": ["logical_reasoning","reading_comprehension"] }
```

The writing sample stays fully in the product — students draft it, it is stored and returned — but it never enters the headline. Exactly the Spoken English practice-surface pattern (`EE-05` §14.5), reused with no new mechanism.

| Component | Item tags |
|---|---|
| `logical_reasoning` | `assumption`, `strengthen_weaken`, `flaw_in_reasoning`, `inference`, `parallel_reasoning`, `paradox_resolution`, `principle_application`, `method_of_argument` |
| `reading_comprehension` | `main_point`, `author_attitude`, `inference`, `comparative_passage`, `function_of_statement` |

**Fits our infrastructure well:** `logical_reasoning` items are short passage + stem + five options — the `passage_item_set` runner handles them unchanged. Speed-reading also transfers directly, since the binding constraint on this test is reading rate under time pressure.

---

### 5 · Aviation English (ICAO Language Proficiency)

Radiotelephony English for pilots and air traffic controllers. Regulated, recurrent (re-testing is mandatory on a cycle), and priced accordingly — the strongest commercial margin on this list.

**Trademark: ✅ none.** ICAO language proficiency requirements are a **published international standard**, not a proprietary test. Any provider may assess against the rating scale. This is the CEFR situation from `EE-05` §13, not the OET one — **the exposure is misrepresentation, not infringement.** We may say "assessed against the ICAO rating scale"; we may not imply we issue a licence endorsement, which only a national aviation authority can do.

**Structure:** six subskills, rated **1–6**, with **operational proficiency at Level 4**.

**The scoring rule is the important part — and it is not an average.** The overall rating is the **lowest of the six**:

```jsonc
"scales": {
  "icao_6": { "kind": "ordinal", "levels": ["1","2","3","4","5","6"],
              "aggregation": "weakest_link", "operational_minimum": "4" } },
"overall": { "mode": "aggregate", "strategy": "min_of_subskills", "components": ["radiotelephony"] }
```

| Component | Modality | Delivery | Subskills |
|---|---|---|---|
| `radiotelephony` | speaking | `viva` | `pronunciation`, `structure`, `vocabulary`, `fluency`, `comprehension`, `interactions` |
| `listening_comprehension` | listening | `audio_item_set` | practice surface — `assessed: false` |

**Note the near-identity with Spoken English's six subskills** (Range, Accuracy, Fluency, Interaction, Coherence, Phonology). Different names, same territory — so the viva recorder, the six-subskill profile view (FE-17) and the remediation surface all transfer directly. Only the aggregation differs, and that is one new strategy.

**Content caveat:** items must use real radiotelephony phraseology and handle non-routine situations. That is specialist content requiring an aviation SME — the dominant cost here is content, not engineering.

---

### 6 · Business & Professional Writing

Workplace writing: email, reports, proposals, summarisation. **We own this outright.**

**Trademark: ✅ ours.** No rights holder, no counsel gate, no naming constraint. Ships on our schedule.

**Scoring: reuses `cefr_hybrid` unchanged** — percent per subskill, averaged, mapped to `cefr_6`, full profile always returned. **Zero new code.**

| Component | Modality | Delivery | Assessed |
|---|---|---|---|
| `correspondence` | writing | `essay` | ✅ |
| `reports_proposals` | writing | `essay` | ✅ |
| `summarisation` | writing | `essay` | ✅ |

**Our rubric** (ours, so no verification needed — we define it):

`task_achievement` · `organisation_cohesion` · `register_tone` · `clarity_concision` · `grammatical_accuracy` · `audience_awareness`

```jsonc
"overall": { "mode": "aggregate", "strategy": "cefr_hybrid",
             "components": ["correspondence","reports_proposals","summarisation"],
             "params": { "rule": "average_subskill_pct_then_map",
                         "show_per_subskill_profile": true, "within_level_progress": true } }
```

**Best first candidate on the whole list.** No legal gate, no new strategy, no new runner, no new UI — it is genuinely just a config object plus content. If we want to prove the "config-only exam" DoD from `EE-03` §4 with something real rather than hypothetical, **this is the one to do it with.**

---

### 7 · Interview & Group Discussion Readiness

Placement and admissions interview preparation. Enormous demand in the Indian campus-placement market, and a natural upsell to institutes already running IELTS batches.

**Trademark: ✅ ours.**

**Honest cost warning — this is the one entry with real new UI**, and I would not put it early:

| Component | Delivery | Status |
|---|---|---|
| `personal_interview` | `viva` | ♻ reuses the viva recorder |
| `behavioural_interview` | `viva` | ♻ reuses the viva recorder |
| `group_discussion` | `group_viva` | ⚠ **new** — multi-participant turn-taking has no analogue in the platform |

Two genuinely new capabilities hide here:

1. **Multi-party group discussion** — several speakers, interruption handling, turn attribution. Not a variation on the viva recorder; a different thing.
2. **Any body-language or eye-contact criterion needs video**, and we assess audio today. I have deliberately **left non-verbal criteria out of the rubric below** rather than declaring a subskill we cannot score — the discipline `EE-00` §5.2 sets. Add it when video capture exists, as a config change.

**Our rubric (audio-only, deliberately):** `content_relevance` · `structure_star` · `fluency_confidence` · `persuasiveness` · `active_listening_turn_taking` · `question_handling`

Reuses `cefr_hybrid`. Recommendation: **ship `personal_interview` and `behavioural_interview` first as a config-only course**, and treat `group_discussion` as a separate later milestone. That splits a blocked course into a shippable one plus a backlog item.

---

### 8 · Presentation & Public Speaking

Structured spoken delivery — prepared talks, impromptu speaking, handling questions.

**Trademark: ✅ ours.**

| Component | Modality | Delivery |
|---|---|---|
| `prepared_talk` | speaking | `viva` ♻ |
| `impromptu_speaking` | speaking | `viva` ♻ |
| `question_handling` | speaking | `viva` ♻ |

**Our rubric:** `structure_signposting` · `delivery_pacing` · `vocal_variety` · `audience_engagement` · `language_accuracy` · `content_depth`

Reuses `cefr_hybrid`. **Config-only.** The viva recorder needs one addition — a longer single-take recording than a Q&A turn — which is a parameter, not a rewrite.

Pairs naturally with course 7 as a single "communication skills" bundle for institutes, while staying two independent config objects.

---

### 9 · Pronunciation & Intelligibility

Focused phonological training. Directly serves the BPO / voice-process and customer-support market, which is large in India and buys recurrent training.

**Trademark: ✅ ours.**

**A framing decision I want to flag, because it is both an ethics and a validity question.** This must be sold as **intelligibility and clarity**, never as "accent reduction" or "neutral accent":

- **Validity:** the defensible construct is *can a listener understand this speaker*, not *how close is this speaker to a native model*. Scoring against native-likeness measures conformity, not communicative success.
- **Product risk:** it is the same species of overclaim as "CEFR certified" (`EE-04` §4) — a claim about something that is not actually being measured.

So the headline subskill is `comprehensibility`, and the copy says clarity. Cheap to get right now; expensive to re-position after launch.

| Component | Modality | Delivery |
|---|---|---|
| `segmental_accuracy` | speaking | `viva` ♻ |
| `prosody` | speaking | `viva` ♻ |
| `connected_speech` | speaking | `viva` ♻ |

**Our rubric:** `consonant_vowel_accuracy` · `word_stress` · `sentence_stress_rhythm` · `intonation` · `linking_elision` · `comprehensibility`

Reuses `cefr_hybrid`. **Config-only.** Leans directly on the `phonology` work already done for Spoken English (`_subskill_provenance` cites the CEFR Companion Volume Appendix 3 — the same source applies here).

---

### 10 · Competitive Exam English (SSC / Banking / UPSC)

The English section of Indian government and banking recruitment exams, taken as a standalone course. **We take only the verbal section**, which is how the no-math constraint is satisfied — the quantitative and reasoning sections are simply not in scope.

**Trademark: ✅ ours** — these are government examination *syllabi*, not proprietary branded tests. Naming should still describe the target ("Banking & Government Exam English") rather than imply official affiliation.

**Structure and the new strategy.** These exams use **negative marking**, typically ¼ mark per wrong answer, with **no penalty for unattempted questions** — hence `raw_with_penalty` (§3.3).

```jsonc
"overall": { "mode": "aggregate", "strategy": "raw_with_penalty",
             "params": { "correct": 1.0, "incorrect": -0.25,
                         "unattempted": 0.0, "floor_at_zero": true } }
```

⚠ The exact penalty differs by exam body and year — it must be a **config value per variant**, never a constant. This is a textbook `variants` case (`EE-05` §9): one course, several exam bodies, differing marking schemes and section weights.

| Component | Modality | Item tags |
|---|---|---|
| `reading_comprehension` | reading | `main_idea`, `inference`, `vocabulary_in_context`, `tone` |
| `grammar_error_detection` | reading | `spotting_errors`, `sentence_improvement`, `fill_in_the_blanks` |
| `vocabulary` | reading | `synonyms_antonyms`, `idioms_phrases`, `one_word_substitution`, `spelling` |
| `verbal_arrangement` | reading | `para_jumbles`, `cloze_test`, `sentence_rearrangement` |
| `descriptive_writing` | writing | subskills: `content`, `structure`, `language_accuracy`, `precision` |

**Strong infrastructure fit:** `vocabulary` maps almost directly onto LexiGrid, and the whole section is speed-constrained, which is what the speed-reading module already trains. This is the entry that reuses the most of what we have already built.

---

## 5 · Recommended sequencing

Ordered by cost-to-ship, not by market size — cheapest proof first.

| Order | Course | Rationale |
|---|---|---|
| **1** | **Business & Professional Writing** (6) | Zero legal gate, zero new code, zero new UI. **The honest test of the "config-only exam" DoD.** If this needs a code change, the abstraction leaked and we want to know before the encumbered courses. |
| **2** | Pronunciation & Intelligibility (9) | Config-only. Reuses the Spoken English phonology work almost wholesale. |
| **3** | Presentation & Public Speaking (8) | Config-only. One viva parameter. |
| **4** | Competitive Exam English (10) | One new strategy, but the largest addressable market on the list and the heaviest reuse of LexiGrid and speed-reading. |
| **5** | Aviation English (5) | One new strategy. No trademark gate. Best margin. Gated on finding an aviation SME for content, not on engineering. |
| **6** | Interview & GD — interview components only (7) | Config-only if `group_discussion` is deferred. |
| **7+** | The four encumbered courses (1, 2, 3, 4) | **Sequence behind counsel, not behind engineering.** Of these, Workplace English (3) is the safest first because ETS publishes an explicit third-party policy; the others have no verified carve-out. |
| **Later** | `group_discussion` (7) | Multi-party recording. Real new build; size it separately. |

**The reason for this order:** the six config-only courses are engineering-free and legally clear, so they can absorb content-team capacity while the exam engine itself is still being built. Nothing in items 1–3 is blocked on the backend board at all.

---

## 6 · Before any of this goes in config

| # | Item | Owner |
|---|---|---|
| 1 | **Verify every `⚠ verify` number** against a primary source — scale ranges, level counts, penalty fractions. `EE-00` found two arithmetic errors in v1 that survived review because nobody checked. Do not let this doc become the third generation. | Me + senior |
| 2 | **Counsel review for courses 1–4** before any content spend. `EE-05` §13: OET's rights holder publishes no carve-out and there was *"a real chance of no"*. Assume the same until told otherwise. | Senior / counsel |
| 3 | **Confirm the item runner distinguishes wrong from unattempted** — otherwise `raw_with_penalty` under-scores every candidate (§3.3). | Backend |
| 4 | **Do not populate rubric criteria for courses 1–4 from memory.** Where a real test publishes analytic criteria, cite them; where we have not verified them, leave the `_subskill_todo` marker in place, as OET Writing and Speaking do today. | Me |
| 5 | **Decide whether the three new strategies are wanted at all.** Each is a code change. If the answer is "config-only or not at all", the list shortens to the six config-only courses — which is still six. | Senior |

---

## 7 · The one-line summary

**Six of these ten are pure config against the existing engine — no new maths, no new runners, no legal gate.** The remaining four split into three needing one new scoring strategy each and one needing multi-party recording. None of the ten touches the quantitative or Data Insights renderers, which is the direct payoff of the no-mathematics constraint.

The binding constraint on all ten is **content**, not engineering — which is exactly what `EE-05` §17 predicted would happen once the engine stopped being the bottleneck.
