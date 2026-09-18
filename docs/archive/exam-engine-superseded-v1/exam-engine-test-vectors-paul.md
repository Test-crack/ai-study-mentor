# Exam Engine — Test Vectors

**Purpose:** copy these straight into unit tests. Each row is `input → expected output`. If all pass, the scoring + progression logic is correct. Covers the bug-prone cases deliberately.

**Reads with:** `exam-engine-spec.md` (algorithms), `exam-engine-config.json` (thresholds).

---

## §1 — IELTS `band_mean` (spec §2)

### Overall = half-up mean, floor 4.0

| L | R | W | S | raw mean | expected band | why |
|---|---|---|---|---|---|---|
| 6.0 | 6.5 | 6.0 | 6.5 | 6.25 | **6.5** | half rounds **up** |
| 7.0 | 6.5 | 7.0 | 6.5 | 6.75 | **7.0** | half rounds **up** |
| 6.0 | 6.0 | 6.5 | 6.0 | 6.125 | **6.0** | below .25 → down |
| 6.5 | 6.5 | 6.0 | 6.5 | 6.375 | **6.5** | at/above .25 → up to .5 |
| 3.0 | 4.0 | 3.5 | 3.5 | 3.5 | **4.0** | below floor → clamp to 4.0 |
| 9.0 | 9.0 | 9.0 | 9.0 | 9.0 | **9.0** | ceiling |

### Rounding helper (isolate this)

`roundHalfUpToStep(v, 0.5)`: `6.25 → 6.5`, `6.75 → 7.0`, `6.24 → 6.0`, `6.26 → 6.5`, `5.75 → 6.0`, `5.74 → 5.5`.
**Must NOT use banker's rounding** (it returns 6.25→6.0, 6.75→7.0 — the 6.25 case would be wrong).

---

## §2 — Spoken English `cefr_hybrid` (spec §3)

Thresholds (min %): below_a1 0 · a1 14 · a2 24 · b1 41 · b2 59 · c1 79 · c2 93.

### `pctToLevel(pct)` — boundary cases

| pct | expected level | why |
|---|---|---|
| 0 | below_a1 | floor |
| 13 | below_a1 | just under a1 |
| 14 | **a1** | exact threshold is inclusive |
| 40 | a2 | just under b1 |
| 41 | **b1** | exact threshold |
| 58 | b1 | just under b2 |
| 59 | **b2** | exact threshold |
| 92 | c1 | just under c2 |
| 93 | **c2** | exact threshold |
| 100 | c2 | ceiling |

### `withinBandProgress(pct, level)`

| pct | level | expected progress | math |
|---|---|---|---|
| 50 | b1 | **0.50** | (50−41)/(59−41)=9/18 |
| 41 | b1 | 0.00 | at lower bound |
| 58 | b1 | ~0.944 | (58−41)/18 |
| 95 | c2 | ~0.286 | (95−93)/(100−93) |
| 93 | c2 | 0.00 | at lower bound |

### Overall = average-then-map + full profile

Subskill %: range 60, accuracy 55, fluency 62, interaction 50, coherence 58, phonology 45.
- avg = (60+55+62+50+58+45)/6 = **55.0**
- overall level = pctToLevel(55) = **b1**
- within-band progress = (55−41)/18 = **0.778**
- **Assert:** result includes all 6 subskill levels (profile never dropped), e.g. phonology 45 → a2.

---

## §3 — Progression layer (spec §7)

### IELTS next-rung (continuous mean, floor-to-rung)

| continuous mean s | headline band (half-up) | current_rung | next_rung | progress_to_next |
|---|---|---|---|---|
| 5.60 | 5.5 | 5.5 | 6.0 | (5.60−5.5)/0.5 = **0.20** |
| 5.90 | 6.0 | 5.5 | 6.0 | (5.90−5.5)/0.5 = **0.80** |
| 6.00 | 6.0 | 6.0 | 6.5 | **0.00** |
| 8.90 | 9.0 | 8.5 | 9.0 | **0.80** |
| 9.00 | 9.0 | 9.0 | (none — cap) | **1.00** |

Note the headline band and current_rung intentionally differ at s=5.90 (band 6.0, rung 5.5) — that's expected (assessed band vs momentum bar).

### CEFR next-rung

avg 55 → current b1, next b2, progress_to_next = **0.778** (same as within-band).
avg 95 → current c2, next none (cap), progress_to_next = **1.00**.

### Improvement since baseline

- IELTS: baseline 4.0 (challenge), current 5.5 → improvement **+1.5 bands**.
- CEFR: baseline a2 (index 2), current b1 (index 3) → improvement **+1 level**. (Order: below_a1=0, a1=1, a2=2, b1=3, b2=4, c1=5, c2=6.)

### Trend (window 3)

| last 3 overall values | expected trend |
|---|---|
| 5.0, 5.5, 6.0 | up |
| 6.0, 6.0, 6.0 | flat |
| 6.5, 6.0, 5.5 | down |

### Invariant (must throw)

Construct a result where `progression.current.value = 6.0` but `overall.value = 5.5` → builder must **throw**. This guards against ever inflating the assessed score.

---

## §4 — Config validation (spec §4)

| bad config | expected |
|---|---|
| CEFR thresholds not ascending (b1=41, b2=39) | reject on load |
| `report_floor` (10.0) > `scale_max` (9.0) | reject |
| `scoring.strategy` = "unknown" | reject |
| speaking item in shared bank missing `cefr` tag | reject / warn before viva use |
