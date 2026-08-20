# Phase 6 — Extract IELTS Scoring Behind the Engine (DRAFT for review)

**Status:** draft — no code written yet. Full-extraction scope.
**The one rule:** **zero behaviour change.** Every band, level, and difficulty IELTS produces today must be byte-identical after this. This is the Phase 7 hard gate: if IELTS output changes at all, we stop and fix before any new exam.

---

## 0 · What "extract behind the engine" means here

Today, IELTS band maths lives in `src/lib/bandScale.ts` and is called directly from 10 files. After Phase 6:

- The **engine is the single facade** for all IELTS scoring — call sites ask the engine, not `bandScale` directly.
- The engine selects behaviour by **exam config** (the `ielts` entry / `ielts_band` scale), never `if (exam === 'ielts')`.
- **`bandScale.ts` stays as the proven low-level maths** and the IELTS strategy *delegates* to it. This is what makes zero-change trivially true: the same functions run, just reached through the config-driven facade. (We are wrapping, not rewriting.)
- IELTS-specific thresholds (level cuts, AI internal scale, weakness gap) become **declared config data** so a future exam overrides them without code — but the IELTS values equal today's `bandScale` constants exactly.

---

## 1 · Full map of live IELTS scoring (what moves)

### ① Overall aggregation — mean of skill bands → headline band
| Site | Today |
|---|---|
| `mockController.ts:996` | `toBand(realBandRaw)` — overall mock band |
| `mockController.ts:933` | `toBand(mean of sub-skill bands)` — per-skill aggregate |
| `gameScoreController.ts` (`current_band`) | `Math.round(avg*2)/2` over competency skill bands |
| competency-scores endpoint / dashboard | same mean-of-skills |
→ Engine: **`band_mean.scoreOverall(skillBands, ielts_band)`** (already built + vector-proven). Preserve every "no data → 0/null" sentinel.

### ② Per-component band production — raw performance → band
| Site | Today |
|---|---|
| `diagnosticController.ts:360` | `fractionToBand(correct/total)` (MCQ: L/R) |
| `diagnosticController.ts:438,506` | `toBand(AI bandScore)` (Writing/Speaking) |
| `mockController.ts:77,889` | `internalToBand(score1to10)`, `fractionToBand(correct/total)` |
| `ieltsWritingService.ts:175-187` | `toBand` per criterion + `toBand(avg of 4)` |
| `ieltsSpeakingService.ts:58-69` | `toBand` per criterion + `toBand(avg of 4)` |
| `iaProcessor.ts:29,35,192,312` | `internalToBand`, `toBand` |
→ Engine: **`ieltsStrategy.scoreComponent(raw, ielts_band)`** with a `RawScore` unit — `raw`(correct/total) for MCQ, `internal`(1–10) for AI. Delegates to `fractionToBand` / `internalToBand` / `toBand`.

### ③ Band → level / difficulty / weakness (IELTS thresholds)
| Site | Today |
|---|---|
| `diagnosticController.ts:17` | `bandToLevel(targetBand)` → A/B/C |
| `recommendationController.ts:79`, `recommendationService.ts:11`, `iaController.ts:265` | `bandToDifficulty(band)` → BEGINNER/INTERMEDIATE/ADVANCED |
| `drillController.ts:78`, `subskillSelector.ts:88` | `bandGap(band)` → weakness weight |
→ Engine: config-declared **proficiency bands** (A<5.5, B<7.0, else C) + **`weaknessGap(band, scale)`**, IELTS values equal to `bandScale` today.

---

## 2 · Engine API after Phase 6 (what call sites will use)

New surface on the exam engine (all exam-config-driven; IELTS delegates to `bandScale`):

```ts
// per-component: raw performance → band on the exam's component scale
scoreComponent(examId, componentId, raw: RawScore): ComponentResult   // { value_raw, value, label }
// overall: assessed component bands → headline (already exists as band_mean)
scoreOverall(examId, componentBands): OverallResult
// proficiency band for targeting (A/B/C) and difficulty (BEGINNER/…)
proficiencyLevel(examId, band): string
difficulty(examId, band): 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED'
// weakness gap 0..1 for drill/IA selection
weaknessGap(examId, band): number
```

Internally the IELTS strategy calls the existing `bandScale` functions, so outputs are identical by construction.

---

## 3 · Config additions required (as data, IELTS = today's constants)

Add to the `ielts` config / `ielts_band` scale (validator + vectors updated in lockstep):

```jsonc
"ielts_band": {
  "kind": "numeric", "min": 0, "max": 9, "step": 0.5, "report_floor": 4.0,
  "proficiency_bands": [                    // was bandToLevel / bandToDifficulty
    { "level": "A", "difficulty": "BEGINNER",     "max_exclusive": 5.5 },
    { "level": "B", "difficulty": "INTERMEDIATE", "max_exclusive": 7.0 },
    { "level": "C", "difficulty": "ADVANCED",     "max_exclusive": 9.01 }
  ],
  "weakness_gap": { "from": 4.0, "to": 9.0 }  // bandGap domain (report_floor..max)
}
```
AI-graded components declare their input scale:
```jsonc
{ "id": "writing", "assessed": true, "scale": "ielts_band",
  "raw_input": { "kind": "internal", "min": 1, "max": 10 } }   // internalToBand anchors
```
> These are additive config keys. `_`-prefixed nothing; they pass `toPublicConfig` as scale shape (no cut scores leaked).

---

## 4 · Site-by-site migration (10 files)

| # | File | Change | Risk |
|---|---|---|---|
| 1 | `ieltsWritingService.ts` | per-criterion `toBand` + avg → engine `scoreComponent`/`scoreOverall` | low (pure fn swap) |
| 2 | `ieltsSpeakingService.ts` | same | low |
| 3 | `diagnosticController.ts` | `fractionToBand`/`toBand` → `scoreComponent`; `bandToLevel` → `proficiencyLevel` | **med (student-facing)** |
| 4 | `mockController.ts` | `internalToBand`/`fractionToBand`/`toBand` → engine | **med (student-facing)** |
| 5 | `iaProcessor.ts` | `internalToBand`/`toBand` → engine | **med** |
| 6 | `iaController.ts` | `bandToDifficulty` → `difficulty` | low |
| 7 | `recommendationController.ts` | `bandToDifficulty` → `difficulty` | low |
| 8 | `recommendationService.ts` | `bandToDifficulty` → `difficulty` | low |
| 9 | `drillController.ts` | `bandGap` → `weaknessGap` | low (targeting only) |
| 10 | `subskillSelector.ts` | `bandGap` → `weaknessGap` | low (targeting only) |

`bandScale.ts` remains (delegated to). Optionally later becomes a thin re-export from the engine.

---

## 5 · Execution sequence (safest → riskiest, each verified before the next)

1. **Engine surface + config** — add `scoreComponent`, `proficiencyLevel`, `difficulty`, `weaknessGap` to the IELTS strategy (delegating to `bandScale`) + the config keys + validator/vector updates. No call sites changed yet.
2. **Parity harness** — a check that runs a dense grid of inputs through BOTH `bandScale` (old) and the engine (new) and asserts identical. Must be 100% before any site migrates.
3. **Low-risk sites first** — §4 rows 6–10 (level/difficulty/gap; targeting only, not stored scores).
4. **AI services** — rows 1–2 (writing/speaking); compare stored `AssessmentHistory` bands before/after on a seeded student.
5. **Student-facing scorers** — rows 3–5 (diagnostic, mock, IA) one at a time, each with a before/after band diff.
6. **Remove direct `bandScale` imports** from migrated sites (or leave `bandScale` as the delegated impl).

---

## 6 · Verification (the Phase 7 gate)

- **`npm run exam-engine:vectors`** stays green (extended with proficiency/difficulty/gap vectors).
- **Parity harness green** — old vs new identical across a full input grid (fractions 0–1 in 0.01 steps, internal 1–10, all band means).
- **Manual E2E on `dev`** — run a full IELTS journey (diagnostic → drills → IA → mock) on a seeded student, snapshot every band/level before and after; must match.
- **Report** confirming zero change, kept as the Phase 7 artefact.

---

## 7 · Rollout, risks, rollback

- **Rollout:** all work on `platform/s3` → merge to `dev`, run the manual IELTS regression there → only then `main`. No new exam registers until this is green (hard gate).
- **Risks:** (a) a subtle rounding/clamp difference — mitigated by delegating to `bandScale` + the parity harness; (b) a stored-score shift — mitigated by before/after diffs on real results; (c) sentinel/edge cases (no-data → 0) — explicitly preserved, not routed through the clamp.
- **Rollback:** pure-logic change, no schema; revert the commit + redeploy. The provenance stamp (`config_version`) means any result written during the window is still interpretable.

---

## 8 · Open questions before execution
1. Keep `bandScale.ts` as the delegated implementation (recommended, lowest risk) or fully port its maths into the engine and retire it?
2. Are the `proficiency_bands` (A<5.5 / B<7.0) and `internal 1–10` anchors the canonical IELTS values, or should any move with calibration later?
3. OK to add the config keys in §3 to `exam-engine-config.v2.json` now (they're additive, IELTS-only, and pass the projection)?

---

**Recommendation:** approve §1–§7 as the plan; I'd still *execute* it in the §5 order (safest sites first, parity-verified) rather than all at once — same full scope, sequenced to keep each step provably zero-change.
