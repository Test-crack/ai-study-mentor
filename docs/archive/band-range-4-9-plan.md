# Band-Range Migration Plan — [0,9] → [4,9]

**Goal:** The platform's IELTS band domain becomes **4.0 (minimum) to 9.0 (maximum)** everywhere — diagnostics, IA, mock, competency matrix, targets, levels, and all displays.
**Status:** Plan only. No code changed yet. Built from a full 3-part code inventory (backend scoring, backend levels/DB/targets, frontend).

---

## 1. Locked Decisions

| # | Decision | Choice |
|---|---|---|
| D1 | Performance → band mapping | **Rescale** onto [4,9] (not clamp) |
| D2 | Floor for empty/invalid attempts | **Absolute 4.0** for everyone (IELTS-standard base) |
| D3 | Level A/B/C cutoffs | **Even thirds:** A = 4.0–5.5, B = 5.5–7.0, C = 7.0–9.0 |
| D4 | Weakness "band gap" normalization | **Rebase** to `(band−4)/5` |

**Consequence of D1+D2:** every band-producing path maps a 0–1 mastery fraction onto [4,9] with 4.0 as an absolute floor and 9.0 ceiling; there is no valid band below 4.0 anywhere.

---

## 2. Canonical Transforms (the single source of truth for the math)

Introduce **one shared helper module** (`lib/bandScale.ts`) and route all scoring through it, so the range can never drift again:

```ts
export const BAND_MIN = 4.0;
export const BAND_MAX = 9.0;
export const BAND_SPAN = BAND_MAX - BAND_MIN; // 5.0

/** Round to nearest 0.5 and clamp to [4,9]. The universal exit gate for any band. */
export function toBand(x: number): number {
  const r = Math.round(x * 2) / 2;
  return Math.min(BAND_MAX, Math.max(BAND_MIN, r));
}

/** Map a 0..1 mastery fraction onto [4,9]. Objective (MCQ/L-R) scoring. */
export function fractionToBand(frac: number): number {
  const f = Math.min(1, Math.max(0, frac));
  return toBand(BAND_MIN + f * BAND_SPAN);
}

/** Map the internal 1..10 grading scale onto [4,9]. (Replaces `score - 1`.) */
export function internalToBand(score1to10: number): number {
  return toBand(BAND_MIN + ((score1to10 - 1) / 9) * BAND_SPAN);
}

/** A/B/C level from a band (even thirds of 4–9). */
export function bandToLevel(band: number): 'A' | 'B' | 'C' {
  if (band < 5.5) return 'A';
  if (band < 7.0) return 'B';
  return 'C';
}

/** Weakness gap 0..1 for drill/IA targeting (4 = fully weak, 9 = no gap). */
export function bandGap(band: number): number {
  return 1 - (Math.min(BAND_MAX, Math.max(BAND_MIN, band)) - BAND_MIN) / BAND_SPAN;
}
```

**Two grading families, handled differently (important):**
- **Objective (MCQ, L/R):** deterministic — `fractionToBand(correct/total)`.
- **Subjective (AI-graded W/S):** the AI keeps its **internal 1–10 scale**; only the final conversion becomes `internalToBand(...)`. The AI's calibrated judgment is *not* numerically re-inflated — we rebase the scale it lands on, not multiply its output. For the diagnostic writing/speaking services (which grade directly in IELTS bands, not 1–10), we **reinstruct the prompt to 4.0–9.0** and clamp with `toBand`.
- **Empty/invalid (D2):** all anti-gaming caps (empty audio, off-topic, <10 words, no transcript) resolve to **`BAND_MIN` (4.0)** via `toBand`, since 4.0 is now the absolute floor.

---

## 3. Backend — Scoring Engine Changes (exact sites)

### 3.1 Shared smoothing — `lib/iaProcessor.ts`
| Line | Now | Change |
|---|---|---|
| 28, 34 | `Math.min(9, Math.max(0, round))` | use `toBand(...)` (clamp [4,9]) |
| 189 | `(combinedScore - 1)` → band | `internalToBand(combinedScore)` |
| 307 | `Math.min(9, Math.max(0, newSkillBand))` | `toBand(newSkillBand)` |
| 171 | `1 + (correct/total)*9` (MCQ→internal 1–10) | **unchanged** (internal scale stays 1–10) |
| 236, 246 | personal-best baseline `?? 0` | `?? BAND_MIN` (else first IA always fires "personal best") |
| 305 | mean of sub-scores | unchanged; exits via `toBand` at 307 |

### 3.2 Mock — `controllers/mockController.ts`
| Line | Now | Change |
|---|---|---|
| 68–69 | `scaleToIELTS`: `(score-1)` clamp[0,9] | delegate to `internalToBand` |
| 692 | L/R: `(correct/total)*9` clamp[0,9], empty→0 | `fractionToBand(correct/total)`, empty→`BAND_MIN` |
| 716 | `1 + (ssCorrect/total)*9` (internal) | unchanged (internal) |
| 722 | empty combined → `1` | unchanged (internal floor 1 → `internalToBand` → 4.0) |
| 741–743 | W/S skill band mean, empty→`0` | empty→`BAND_MIN`; wrap mean in `toBand` |
| 817–818 | real band mean, clamp[0,9] | `toBand(mean)` |
| 820–822 | `prevOverall` missing skill `?? 0` | `?? BAND_MIN` (a skill with no data shouldn't drag the average below the floor) |
| 788, 808 | `applySmoothing(...)` | unchanged (fixed via 3.1) |

### 3.3 IA — `controllers/iaController.ts`
| Line | Now | Change |
|---|---|---|
| 262–266 | `getDifficulty`: <5.5 BEGINNER / ≥7 ADVANCED | align to D3 via `bandToLevel` (or keep — see §6) |
| 274–280 | `getBandForSubSkill` default `5.0` | keep `5.0` (in range) |
| 277 | preview `applySmoothing` | unchanged |

### 3.4 Diagnostic — `controllers/diagnosticController.ts`
| Line | Now | Change |
|---|---|---|
| 12–16 | `resolveLevel` A≤5.5/C≥7 (on **target** band) | rebase to D3 via `bandToLevel` |
| 338 | L/R: `(correct/total)*9` | `fractionToBand(correct/total)` |
| 353 | writing <10 words → `0` | → `BAND_MIN` |
| 385 | writing AI fallback `?? 0` | → `BAND_MIN` |
| 392 | under-length cap `min(band,5.0)` | keep 5.0 (in range, above floor) |
| 408 | final `min(round,9.0)` — **no floor** | `toBand(...)` (adds the missing floor) |
| 468–469 | speaking AI fallback `1.0`, floor `max(...,1.0)` | fallback + floor → `BAND_MIN` |

### 3.5 Diagnostic AI services (direct IELTS-band graders)
**`services/ieltsWritingService.ts`**
- L34 prompt "scale from 1.0 to 9.0" → **"4.0 to 9.0"**; L32–33 trivial/off-topic caps (1.0/2.0) → **4.0**; L177–178 mean → wrap in `toBand`.
- Descriptors (L42–106) already bottom at 4.0 — keep, but drop sub-4 penalty language.

**`services/ieltsSpeakingService.ts`**
- `enforceScores` caps (L35–46: 1.0/1.5/2.0/3.0) → all **4.0** (D2: invalid = floor).
- `emptyAudioResponse` (L69–86) all-`1.0` → all **4.0**.
- L138 prompt "1.0 to 9.0" → **"4.0 to 9.0"**; L62 mean → wrap in `toBand`.
- `<5KB` pre-flight empty → 4.0.

**`lib/iaGrading.ts`** (IA/Mock W/S, internal 1–10)
- Internal scale **stays 1–10** (descriptors L44–114, prompt L166/180, output L218/228/238 unchanged).
- L138 clamp `[1,10]` unchanged (internal).
- L255/279 empty-answer `band: 1` unchanged (internal 1 → `internalToBand` → 4.0 downstream). ✅ no change needed because the conversion rebases it.

> **Net for AI:** iaGrading needs **no change** (conversion in iaProcessor/mock does the rebase). Only the two *diagnostic* services need prompt/cap edits because they emit bands directly.

### 3.6 Weakness formula (D4) — two live sites
| Site | Now | Change |
|---|---|---|
| `lib/subskillSelector.ts:86` | `(1 - band/9) * 0.4` clamp[0,9] | `bandGap(band) * 0.4` |
| `controllers/drillController.ts:69` | `0.4 * (1 - band/9)` clamp[0,9] | `0.4 * bandGap(band)` |
| `drillController.ts:75,88,99` | reads default `band ?? 0` | default `?? BAND_MIN` |
| `subskillSelector.ts:106,120` | default `5.0` | keep (in range) |

### 3.7 Read-side band aggregates (defaults `?? 0` → floor)
These compute `current_band` / averages and default missing bands to `0`, which would drag averages below the floor and (post-migration) be impossible values. Change `?? 0` / `?? '0'` → `?? BAND_MIN` **or** keep the existing `> 0` filters (they already exclude zeros). Decide one consistent approach:
- `lib/batchDashboardQueries.ts:61-71` (`computeCurrentBand`, filters `>0`) — safe; optional.
- `controllers/studentController.ts:109-112` (filters `>0`) — safe.
- `controllers/gameScoreController.ts:57-62` (fallback `0`) — set floor.
- `controllers/instituteOwnerController.ts:693,821,1749,1760,1891,1900` (`?? '0'` in averages) — set floor or filter.
- `controllers/recommendationController.ts:76` (`?? 0`), `services/recommendationService.ts:7-11` thresholds (≤4.5/≤6.5) — thresholds still valid; default → floor.

---

## 4. Database Changes (ordered — backfill BEFORE constraint)

**Affected columns:** `StudentCompetencyMatrix.band_score`, `AssessmentHistory.band_score` (NOT NULL), `mocksessions.real_band_score`, `institute_students.target_band` (Float), `LexiGridWord.target_band` (seed, default 7.0). `Decimal(2,1)` holds 4.0–9.0 fine — no type change. **No band CHECK constraints currently exist.**

**Migration order (single transaction where possible):**
1. **Backfill existing sub-4 data** (historical rows floored at 0):
   ```sql
   UPDATE "StudentCompetencyMatrix" SET band_score = 4.0 WHERE band_score IS NOT NULL AND band_score < 4.0;
   UPDATE "AssessmentHistory"       SET band_score = 4.0 WHERE band_score < 4.0;
   UPDATE mocksessions              SET real_band_score = 4.0 WHERE real_band_score IS NOT NULL AND real_band_score < 4.0;
   UPDATE institute_students        SET target_band = 4.0 WHERE target_band IS NOT NULL AND target_band < 4.0;
   ```
2. **Add range CHECK constraints** (now safe):
   ```sql
   ALTER TABLE "StudentCompetencyMatrix" ADD CONSTRAINT chk_scm_band_range
     CHECK (band_score IS NULL OR (band_score >= 4.0 AND band_score <= 9.0));
   ALTER TABLE "AssessmentHistory" ADD CONSTRAINT chk_ah_band_range
     CHECK (band_score >= 4.0 AND band_score <= 9.0);
   ALTER TABLE mocksessions ADD CONSTRAINT chk_mock_band_range
     CHECK (real_band_score IS NULL OR (real_band_score >= 4.0 AND real_band_score <= 9.0));
   ALTER TABLE institute_students ADD CONSTRAINT chk_target_band_range
     CHECK (target_band IS NULL OR (target_band >= 4.0 AND target_band <= 9.0));
   ```
3. **(Optional) ±2 movement cap trigger** — the previously-drafted `band_cap_guardrails.sql`, with the range updated to [4,9]. Keep it keyed on `assessments_count` increment so the diagnostic INSERT baseline and admin corrections are exempt.

> **Ordering matters:** apply the code floor-changes (§3) and this backfill **together** — if code still writes sub-4 bands, the CHECK will start rejecting valid submissions.

---

## 5. Frontend Changes (exact sites)

### 5.1 Progress bars / gauges — `/9` → `(band−4)/5`
Add a shared `frontend` helper `bandFillPct(band) = ((clamp(band,4,9) − 4) / 5) * 100`.

| File:line | Now |
|---|---|
| `student/components/StudentDashboardPage.tsx:1139` | `(band.score / 9) * 100` |
| `student/components/SpeakingAssessment.tsx:176` | `score / 9` (arc) |
| `student/components/SpeakingAssessment.tsx:217` | `(score / 9) * 100` |
| `instructor/.../OverviewTab.tsx:64,71,190` | `(x / 9) * 100` (×3) |
| `instructor/.../MockSessionsTab.tsx:59` | `(band / 9) * 100` |
| `instructor/.../report/StudentReportTemplate.tsx:196,202,249` | `(x / 9) * 100` (×3) |

### 5.2 Chart axes `[0,9]` → `[4,9]`
| File:line | Now |
|---|---|
| `student/components/Report.tsx:220` | `domain={[0,9]}` (radar) |
| `instructor/.../OverviewTab.tsx:163` | `domain={[0,9]}` |
| `InstituteOwner/dashboard/Performance.tsx:93` | `domain={[0,9]}` |
| `InstituteOwner/dashboard/BatchAnalyticsView.tsx:317,639` | `domain={[0,9]}` ticks `[0..9]` → `[4..9]` |

### 5.3 Target picker & ladder
- `Diagnosis.tsx:2308` — options `[4.5..9.0]` → **prepend 4.0** (`[4.0, 4.5, …, 9.0]`).
- `Diagnosis.tsx:2240` — default target `7.0` (keep).
- `StudentDashboardPage.tsx:793` — ladder loop `for (b=0.5; …)` → **start at 4.0**.
- `StudentDashboardPage.tsx:91-92` `overallBand` — clamp result to ≥4 (or leave; inputs will be ≥4 post-migration).

### 5.4 Level maps & tiers (align to D3)
- `Diagnosis.tsx:76-80` `getBandLevel` (≤4.5 A / ≤6.5 B) → **A<5.5 / B<7.0 / C** (D3).
- `Diagnosis.tsx:82-110` `getLevelConfig` copy — verify labels still fit new bands.
- `StudentDashboardPage.tsx:82-87` `scoreTier` — the `<4.0` bucket becomes dead; rebase tiers within 4–9.
- `StudentDashboardPage.tsx:104-108` `getLevelFromScore` (<5.0/<7.0) — rebase if desired.

### 5.5 Fallback defaults `?? 0` → floor / placeholder
- `Diagnosis.tsx:114` `getAverageScore` `?? 0` → `?? 4.0` (or filter).
- `StudentDashboardPage.tsx:34-38` initial `SKILL_BANDS` `score:0.0` — pre-fetch placeholder; set to `4.0` or render a skeleton so no "0.0" flashes.
- `FullMockAssessment.tsx:1041-1043` `?? 0` for real band/prev/delta — display-guard (delta can stay 0).
- `StudentDashboardPage.tsx:236` drill card `?? 5.0` — in range, keep.

### 5.6 Color thresholds (optional palette rebalance)
`AssessmentHistoryPage.tsx:144-151`, `SpeakingAssessment.tsx:180`, and the instructor/owner `bandColor*` helpers use fixed breakpoints (≥7.5/≥6/≥5). The bottom bucket now = 4.0–4.9. Rebalance only if the compressed range makes the palette look off — cosmetic, not blocking.

### 5.7 Copy
- `HowItWorks.tsx:439` "Band cap 9.0" — optionally add "bands range 4.0–9.0".

---

## 6. Level Semantics — one clarification to confirm during build

There are **two** band→level mappings and they serve different inputs:
- **Diagnostic `resolveLevel(target_band)`** — picks question difficulty from the student's *target*.
- **IA `getDifficulty(competency_band)`** — picks question difficulty from the student's *current* sub-skill band.

D3 (even thirds) will be applied to **both** via `bandToLevel`. Note these map to different enums (`'A'/'B'/'C'` for diagnostic question sets vs `BEGINNER/INTERMEDIATE/ADVANCED` for drill/IA `RecommendationLevel`). Keep `bandToLevel` returning A/B/C and add a thin `bandToDifficulty` returning the enum, both from the same thresholds.

---

## 7. Sequencing & Rollout

1. **Backend shared module** `lib/bandScale.ts` (+ frontend twin) — no behavior change alone.
2. **Backend scoring rewrite** (§3) — route every site through the helpers. Type-check.
3. **Diagnostic AI prompt/cap edits** (§3.5).
4. **DB backfill + CHECK constraints** (§4) — deploy **in lockstep** with #2/#3 (code must stop writing sub-4 before the CHECK lands).
5. **Frontend** (§5) — bars, axes, picker, ladder, levels, fallbacks.
6. **Docs** — update `student-lifecycle.md`, `ia-mock-behavior.md`, `student-cycle.md` (§A.1 formulas, level ranges), and `implementation-summary.md`.
7. **Verification** — re-run the 4-way scoring verification against the new range; add explicit cases: 0% → 4.0, 100% → 9.0, empty/off-topic → 4.0, band never <4 or >9, level boundaries at 5.5/7.0.

---

## 8. Risk Register

| Risk | Mitigation |
|---|---|
| CHECK lands before code floors → valid submissions rejected | Deploy §3+§4 together; backfill first |
| Score inflation surprises users (50% MCQ now 6.5 not 4.5) | Expected under rescale (D1); call out in release notes |
| AI double-inflation if we both rescale AND reinstruct | Do **not** numerically rescale AI output; only rebase the scale it grades on (§2) |
| Missed `/9` bar or `[0,9]` axis → visually wrong | Full site list in §5; grep `/ 9`, `/9`, `[0, 9]`, `[0,9]` as a final sweep |
| Personal-best/`?? 0` baselines fire falsely | Default baselines to `BAND_MIN` (§3.1, §3.2) |
| Existing analytics/history show pre-migration sub-4 bands | Backfill covers stored rows; historical AssessmentHistory rows are floored |
| Momentum threshold-cross math (`floor(band/0.5)`) | Unaffected — operates on corrected bands |
| DCS gates | **Unaffected** — DCS is accuracy %, not a band |

---

## 9. Explicitly NOT affected (confirmed by inventory)
- **DCS** (`lib/dcs.ts`) — accuracy %, no band math.
- **Momentum economy** — points, not bands.
- **`Decimal(2,1)`** — holds 4.0–9.0; no schema type change.
- **LexiGrid gameplay** — `target_band` is a passthrough label only; no scoring.
- **Reading/speaking practice fluency metrics** — 0–100 scales, not IELTS bands.
- `diagnostic_questions` has **no** band column (keys off `level`).

---

## 10. Effort Estimate (rough)
- Backend scoring + shared module + AI prompts: ~1 focused day.
- DB backfill + constraints (+ optional trigger): ~half day incl. verification on a copy.
- Frontend bars/axes/picker/levels/fallbacks: ~1 day.
- Docs + verification pass: ~half day.

**Total ≈ 3 days**, best done as one coordinated branch (backend + DB + frontend must ship together — a half-migrated range is worse than either state).
