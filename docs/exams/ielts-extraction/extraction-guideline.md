# IELTS Extraction — Rules, Plan & Onboarding Guideline

**Repos:** backend `backend-study-mentor` (all scoring lives here) · frontend `ai-study-mentor` (superadmin UI + display).
**Branch:** `platform/s4` on both, cut from the `dev-stable-2026-08-21` baseline.
**Scope decision (locked):** *Math layer first (Layer A).* Bespoke AI grading (Layer B) is documented and left untouched this phase.

---

## 0 · The prime directive — nothing IELTS produces may change

Every band, level, difficulty and drill-target IELTS produces today must be **byte-identical** after this extraction. We are **wrapping proven maths behind a config-driven facade, not rewriting it.** The low-level functions in `src/lib/bandScale.ts` keep running exactly as they do now — the extraction only changes *who calls them* (the engine, selected by config) instead of *call sites hard-coding IELTS*.

If any IELTS output changes at any step, we stop and fix before continuing. This is verified at every step (see §7).

---

## 1 · The mental model — "an exam is data, not code"

The whole point of this extraction is that **adding the next exam (OET, Spoken English) is mostly a data action a super-admin can do, not an engineering project.** To make that real, every step of the IELTS extraction is judged by one test:

> **The creatability test:** *After this change, could a second exam get the same behaviour by supplying config — without editing this code path again?*

If yes, the knob moved from code → data and the next exam gets it for free. If no (it's genuinely bespoke, like an AI rubric), we say so explicitly and document the static rule that runs.

### The top-down flow (target state)

```
 SUPER-ADMIN  ──creates an exam──►  exams table (registry)
      │                                   │  id, label, status, availability
      │                                   ▼
      │                          exam_configs  (versioned config JSON per exam)
      │                                   │  components · scale · overall.strategy · thresholds
      │                                   ▼
      │                        EXAM ENGINE  (src/exam-engine/)
      │                          picks behaviour BY CONFIG, never by `if (examId==='ielts')`
      │                                   │
      │            ┌──────────────────────┴───────────────────────┐
      │       LAYER A (config/data)                        LAYER B (code)
      │       scale, aggregation strategy,                 AI rubric + blend + smoothing
      │       level/difficulty cuts, weakness gap          — a per-exam grading module,
      │       → next exam = ZERO code                        selected by config
      ▼
  DISPLAY (frontend) — response shapes unchanged; IELTS students see identical scores
```

### Where we are today vs. the target

- **Today:** an exam is "created" by adding it to `src/exam-engine/exam-engine-config.v2.json`; on server boot `loadExamEngine()` (`loader.ts:30`) validates it and **upserts the `exams` row + an `exam_configs` version** (`seedExamConfigs`, `loader.ts:59`). IELTS, Spoken English and reserved exams already seed this way. The super-admin UI today manages institutes + **exam subscriptions**, and reads the exam list from `frontend/src/shared/constants/examTypes.ts`.
- **Target:** a super-admin "Create Exam" screen writes the registry row (and, for declarative fields, the config) through a guarded API — no redeploy to add an exam that reuses a known scoring shape.

This doc marks, for every knob, whether it becomes a **super-admin control** or stays **static config (engineering-owned, validator-gated)**, so the boundary is explicit.

---

## 2 · The two layers (why "minimal code," told honestly)

| | **Layer A — the scoring maths** | **Layer B — the grading policy** |
|---|---|---|
| Examples | mean-of-components → overall; 0.5 rounding; [4–9] floor; band→level/difficulty; weakness gap; MCQ fraction→band; internal 1–10→band | AI writing/speaking **rubrics** (4 criteria, word-count penalties, content floor); MCQ↔AI **blend** (2:1); IA **smoothing** (0.4 old / 0.6 new, ±2 cap) |
| Lives in | `src/lib/bandScale.ts` (+ mean call sites) | `ieltsWritingService.ts`, `ieltsSpeakingService.ts`, `iaProcessor.ts`, `mockController.ts` |
| Generalizes to | **Config data** — next exam supplies values | **A per-exam code module**, selected by config |
| This phase | **Extracted behind the engine** | **Left exactly as-is, documented** |
| Next exam cost | **Zero code** (numeric/CEFR) | **One bespoke module** (only if AI-graded) |

**The honest promise:** a new **MCQ / numeric** or **CEFR** exam onboards as config (super-admin-ownable, guarded). A new **AI-graded** exam onboards as config **+ one grading module**, because a rubric is domain knowledge, not a threshold — it is inherently bespoke per exam and is *not* something to author from a UI.

---

## 3 · The scoring knobs, top-down — extract, then classify each

For each knob: **what it is → where it lives today → the engine target → super-admin control? (or the static rule we keep) → creatability note.**

### 3.1 · Exam identity & availability
- **Today:** registry rows seeded from config; frontend list in `examTypes.ts` (`EXAM_TYPES`, `EXAM_LABELS`, `EXAM_AVAILABILITY`).
- **Engine target:** `exams` table + config `naming`/`status`; frontend sources the list from `GET /api/exams` (planned Phase-5 B1) instead of the hardcoded constant.
- **Super-admin control: YES (target).** Create/enable/disable an exam, set label + availability (`live`/`soon`). This is the "top of the funnel" the whole flow starts from.
- **Creatability:** adding `oet` / `spoken_english` here is a row + config entry, no scoring code.

### 3.2 · The measurement scale
- **What:** IELTS band domain — `min 0, max 9, step 0.5, report_floor 4.0, rounding half_up_to_step`. Already declared as `scales.ielts_band` (`config json:90`).
- **Today (code):** `bandScale.ts` constants `BAND_MIN=4.0 BAND_MAX=9.0`, `toBand` rounds to 0.5 & clamps.
- **Engine target:** the engine reads the scale from config and delegates the maths to `bandScale`. Values are identical by construction.
- **Super-admin control: NO — static config, engineering + validator-gated.** Changing a scale's shape is a scoring-correctness decision, not a form field. **Static rule kept:** 0–9, 0.5 steps, displayed floor 4.0 (internal min 0 so the floor can be lowered in config without code — see `config json:98`).
- **Creatability:** a new exam references an existing scale id (`ielts_band`) or adds a new `scales.*` entry — "no new scale and no new code" if it reuses one (`config json:88`).

### 3.3 · Overall aggregation (headline score)
- **What:** overall = **mean of the 4 assessed component bands**, rounded to step, clamped to report_floor.
- **Today (code):** `mockController.ts:995` (`realBandRaw = mean(...)` → `toBand`); per-skill means at `mockController.ts:933`; competency means in game/dashboard paths.
- **Engine target:** `overall.strategy = "band_mean"` (already set, `config json:318`) → `bandMean(componentScores, ielts_band)` (`scoring.ts:75`). Returns `{ value_raw (unclamped), value (clamped), label, clamped }` — preserves the unclamped value used for improvement-since-baseline.
- **Super-admin control: NO (choice) / YES (which components feed it).** *Choosing a strategy* (`band_mean` vs `cefr_hybrid`) stays engineering (it's the scoring shape). *Which assessed components feed the headline* (`overall.components`) is declarative and can become a guarded super-admin field. **Static rule kept:** IELTS = `band_mean` over `[listening, reading, writing, speaking]`.
- **Creatability:** any numeric exam that averages its components picks `band_mean`; a CEFR exam picks `cefr_hybrid` (`scoring.ts:112`) — both already exist, so config-only.

### 3.4 · Per-component band production (raw performance → a band)
- **What:** MCQ → `fractionToBand(correct/total)` (`bandScale.ts:32`); AI internal 1–10 → `internalToBand` (`bandScale.ts:41`); final gate `toBand`.
- **Today (code):** `diagnosticController.ts:360`, `mockController.ts:889/909-918`, `iaProcessor.ts:172/187/192`.
- **Engine target:** `scoreComponent(examId, componentId, raw: RawScore)` where `RawScore` carries its unit — `{unit:'raw',correct,total}` for MCQ, `{unit:'band'|internal}` for AI — delegating to the same `fractionToBand`/`internalToBand`. The `raw_input` scale for AI components is declared in config (see §5).
- **Super-admin control: NO — static config + engineering.** **Static rule kept:** MCQ fraction maps linearly 0→4.0, 1→9.0; AI internal 1→4.0, 10→9.0.
- **Note (Layer B boundary):** only the *scale transform* is extracted. The **AI rubric that produces the 1–10** (criteria, penalties, floor) stays in the service (§3.7).

### 3.5 · Band → proficiency level & difficulty
- **What:** `bandToLevel` A<5.5 / B<7.0 / else C (`bandScale.ts:47`); `bandToDifficulty` same cuts → BEGINNER/INTERMEDIATE/ADVANCED (`bandScale.ts:54`).
- **Today (code):** `diagnosticController.ts:17`, `recommendationController.ts:79`, `recommendationService.ts:11`, `iaController.ts:265`.
- **Engine target:** config-declared `proficiency_bands` (see §5) → `proficiencyLevel(examId, band)` / `difficulty(examId, band)`.
- **Super-admin control: NO — static config, validator-gated (calibration risk).** **Static rule kept:** even-thirds cuts A<5.5, B<7.0 (decision D3).
- **Creatability:** a new exam declares its own cut list; no code.

### 3.6 · Weakness gap (drill / IA targeting)
- **What:** `bandGap(band) = 1 − (band−4)/5` (`bandScale.ts:64`) — band 4 = fully weak, band 9 = no gap (D4). Targeting only; **never a stored/displayed score.**
- **Today (code):** `drillController.ts:78`, `subskillSelector.ts:88`.
- **Engine target:** config `weakness_gap {from,to}` → `weaknessGap(examId, band)`.
- **Super-admin control: NO — static config.** **Static rule kept:** domain 4.0..9.0.
- **Creatability:** new exam supplies its own domain; no code.

### 3.7 · AI grading rubrics — **LAYER B, NOT extracted this phase**
- **What (all static code, documented):**
  - **Writing** (`ieltsWritingService.ts:33-42,175-187`): Gemini grades 4 criteria on 4–9; overall = **mean of 4**; **word-count penalties** (Task 1 <150w / Task 2 <250w → Task Achievement ≤ 5.0); criteria clamped to [4,9] before averaging.
  - **Speaking** (`ieltsSpeakingService.ts:24-72`): 4 criteria; **content-assessment floor** — empty/noise/off-topic/too-short → **all criteria = 4.0** (decision D2); mean of 4.
  - **MCQ↔AI blend** (`iaProcessor.ts:187`, `mockController.ts:916`): `(mcq×1 + ai×2)/3` on the 1–10 scale, then `internalToBand`.
  - **IA smoothing** (`iaProcessor.ts:27-36`): `0.4×old + 0.6×new`, deviation capped ±2, rounded 0.5.
- **Super-admin control: NO — never a UI field. Stays code.** These are bespoke IELTS policy. A future AI-graded exam brings its **own** grading module (its rubric/blend), selected by config — see §8.
- **Why left as-is:** they are not `bandScale` calls, so they are naturally outside Layer A; touching them would widen the zero-change surface for no onboarding gain this phase.

### 3.8 · Provenance stamping
- **What:** `engine_version` + `config_version` on every stored result. Columns exist on `assessment_history` / `mockSession`; `provenance()` exists (`loader.ts:110`) **but no write path calls it yet.**
- **Engine target:** wire `provenance()` into the three write paths (`diagnosticController.ts:56`, `mockController.ts:1012`, `iaProcessor.ts:267`) as we migrate them.
- **Super-admin control: NO — automatic.** **Rule:** every result records which engine + config version produced it, so a later calibration (a config bump) never makes old results ambiguous.

---

## 4 · The extraction, site by site (the 10 call sites)

`bandScale.ts` **remains** as the delegated implementation (keeps zero-change trivially true). Each site swaps its direct `bandScale` call for the engine facade.

| # | File | Change | Layer | Super-admin? | Risk |
|---|---|---|---|---|---|
| 1 | `iaController.ts` | `bandToDifficulty` → `difficulty` | A | no (static cuts) | low |
| 2 | `recommendationController.ts` | `bandToDifficulty` → `difficulty` | A | no | low |
| 3 | `recommendationService.ts` | `bandToDifficulty` → `difficulty` | A | no | low |
| 4 | `drillController.ts` | `bandGap` → `weaknessGap` | A | no | low (targeting) |
| 5 | `subskillSelector.ts` | `bandGap` → `weaknessGap` | A | no | low (targeting) |
| 6 | `ieltsWritingService.ts` | per-criterion `toBand` + mean → engine (rubric untouched) | A only | no | low |
| 7 | `ieltsSpeakingService.ts` | per-criterion `toBand` + mean → engine (rubric untouched) | A only | no | low |
| 8 | `diagnosticController.ts` | `fractionToBand`/`toBand` → `scoreComponent`; `bandToLevel` → `proficiencyLevel`; + provenance | A | components list: future | **med (student-facing)** |
| 9 | `mockController.ts` | `fractionToBand`/`internalToBand`/`toBand`/mean → engine; + provenance | A | components list: future | **med (student-facing)** |
| 10 | `iaProcessor.ts` | `internalToBand`/`toBand`/mean → engine (blend & smoothing untouched); + provenance | A | no | **med** |

---

## 5 · Config additions (data — IELTS values equal today's constants exactly)

Additive keys on `scales.ielts_band` and the IELTS components. Validator + vector suite updated in the **same commit**. All pass `toPublicConfig` (no cut-scores leak to the client).

```jsonc
// scales.ielts_band  (add to the existing block at config json:90)
"proficiency_bands": [                         // was bandToLevel / bandToDifficulty
  { "level": "A", "difficulty": "BEGINNER",     "max_exclusive": 5.5 },
  { "level": "B", "difficulty": "INTERMEDIATE", "max_exclusive": 7.0 },
  { "level": "C", "difficulty": "ADVANCED",     "max_exclusive": 9.01 }
],
"weakness_gap": { "from": 4.0, "to": 9.0 }     // bandGap domain (report_floor..max)
```
```jsonc
// AI-graded components declare their raw input scale (writing/speaking)
"raw_input": { "kind": "internal", "min": 1, "max": 10 }   // internalToBand anchors
// MCQ components (listening/reading) imply raw_input fraction 0..1 (fractionToBand)
```

---

## 6 · New engine surface (what call sites use after extraction)

```ts
scoreComponent(examId, componentId, raw: RawScore): { value_raw, value, label }
scoreOverall(examId, componentBands): BandMeanResult      // already exists: band_mean
proficiencyLevel(examId, band): string                    // 'A'|'B'|'C'
difficulty(examId, band): 'BEGINNER'|'INTERMEDIATE'|'ADVANCED'
weaknessGap(examId, band): number                         // 0..1
```
Internally the IELTS strategy calls the existing `bandScale` functions → outputs identical by construction. Strategy is chosen by `overall.strategy` in config, never by `if (examId)`.

---

## 7 · Execution sequence & the zero-change gate

Each step is verified before the next; nothing merges to `dev` until the full regression is green.

1. **Engine surface + config** — add `scoreComponent`/`proficiencyLevel`/`difficulty`/`weaknessGap` to the IELTS strategy (delegating to `bandScale`), add §5 config keys, extend validator + vectors. **No call sites touched.**
2. **Parity harness** — run a dense input grid (fractions 0–1 in 0.01 steps; internal 1–10; all band means) through **old `bandScale` vs new engine**, assert identical. **Must be 100% before any site migrates.**
3. **Low-risk sites** — rows 1–5 (level/difficulty/gap; targeting only).
4. **AI-service maths** — rows 6–7 (the `toBand`+mean arithmetic only; rubric/prompt untouched); diff stored bands on a seeded student.
5. **Student-facing scorers** — rows 8–10, one at a time, each with a before/after band diff; **wire provenance here.**
6. **Tidy** — drop now-dead direct imports (or leave `bandScale` as the delegated impl).

**Verification (the hard gate):**
- `npm run exam-engine:vectors` stays green (extended with proficiency/difficulty/gap vectors).
- Parity harness green across the full grid.
- Manual E2E on `dev`: full IELTS journey (diagnostic → drills → IA → mock) on a seeded student; snapshot every band/level/difficulty before & after — **must match**.
- No new exam registers as `live` until this is green.

**Rollback:** pure-logic change, no schema migration — revert the commit + redeploy. Provenance means any result written during the window stays interpretable.

---

## 8 · Onboarding checklist the extraction leaves behind (the payoff)

After Phase 6, adding an exam:

**A numeric or CEFR exam (e.g. a new numeric test, or Spoken English on CEFR) — CONFIG ONLY, zero code:**
1. Add the `exams` row (super-admin, target).
2. Add the exam entry to config: `naming`, `status`, `components` (ids, `assessed`, `weight`, `scale`, `time_limit`), `overall.strategy` (`band_mean` or `cefr_hybrid`) + `overall.components`, and a scale (reuse `ielts_band`/`cefr_6` or add a `scales.*`), plus `proficiency_bands` / `weakness_gap`.
3. Validator + vectors green → boots and seeds automatically.

**An AI-graded exam (e.g. OET writing/speaking) — CONFIG + one grading module:**
1–3 as above, **plus** one bespoke **grading module** implementing that exam's rubric (its criteria, penalties, floors), selected by config. Everything around it (scale, aggregation, thresholds, provenance) is still data. This module is reviewed engineering work, **not** a super-admin UI field — because a rubric is domain knowledge.

**The creatability test (repeat at every step):** *did this change move an IELTS-specific number out of code and into the `ielts` config entry?* If yes, the next exam gets that knob for free.

---

## 9 · What stays static, and why (super-admin boundary, explicit)

| Knob | Owner | Why not a super-admin field |
|---|---|---|
| Scale shape (min/max/step/floor/rounding) | config file + validator | scoring correctness; a bad edit mis-scores a live cohort |
| Strategy *choice* (`band_mean`/`cefr_hybrid`) | config file + engineering | it's the scoring *shape* — code decides the family |
| Proficiency cuts, weakness domain, raw-input anchors | config file + validator | calibration decisions; bump `config_version`, don't hand-edit live |
| AI rubrics / blend / smoothing (Layer B) | code module per exam | bespoke domain knowledge, never data |
| Exam identity, availability, components list, target band | **super-admin (target)** | declarative — safe to expose with validation |

Config changes are guarded by `validateConfig` (40+ rules) and the vector suite before they can go live — that is the guard-rail that lets declarative fields be super-admin-editable without risking scoring for a live institute.
