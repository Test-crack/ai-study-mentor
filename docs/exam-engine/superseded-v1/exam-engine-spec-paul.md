# Exam Engine — Developer Spec

**Companion to:** `exam-engine-config.json`
**Audience:** backend + frontend devs (readable independently — do not assume the founder is available to clarify).
**Status:** approved by founder. Legal strings are DRAFT_FOR_COUNSEL (see §5).

---

## 1. The one rule that makes this an "engine"

Every exam-specific value — names, legal text, skills, subskills, scoring, module list — lives in `exam-engine-config.json`. **Code reads config; code never hard-codes an exam.**

Scoring is the part most likely to rot. Enforce this:

> A scoring strategy is a **pluggable object selected by `scoring.strategy`**, never an `if (examId === "ielts")` branch inside shared code.

Two strategies exist today: `band_mean` (IELTS) and `cefr_hybrid` (Spoken English). Adding exam #3 that scores differently = write a new strategy class implementing the same interface. If viva-vs-band logic ever leaks into shared branching code, the engine is dead. This is the single most important line in this doc.

**Suggested interface (name it however your stack prefers):**

```
interface ScoringStrategy {
  scoreSubskill(rawInput, params) -> SubskillResult
  scoreSkill(subskillResults, params) -> SkillResult
  scoreOverall(skillResults, params) -> OverallResult
  validateConfig(params) -> void   // throws on bad config, see §4
}
```

---

## 2. Strategy `band_mean` (IELTS)

**Input:** each of the 4 skills has a band score already (0.0–9.0 in 0.5 steps). Writing & Speaking additionally carry subskill scores; Listening & Reading do not (their `item_tags` are for drill analytics only, not scored).

**Overall:**
1. `mean = (listening + reading + writing + speaking) / 4`
2. Round the **mean** half-up to the nearest 0.5.
3. Clamp the reported value to `report_floor` (4.0). A computed mean below 4.0 displays as 4.0.

**Rounding — this is a real bug source. Do NOT use language-default rounding (banker's rounding gets these wrong):**

| Mean | Correct reported band |
|---|---|
| 6.25 | 6.5  (half rounds up) |
| 6.75 | 7.0  (half rounds up) |
| 6.10 | 6.0 |
| 6.24 | 6.0 |
| 6.26 | 6.5 |

Reference implementation:

```
function roundHalfUpToStep(value, step = 0.5) {
  return Math.round(value / step + 1e-9) * step;   // +epsilon forces .5 up
}
```

**Unit tests to write (mandatory):** 6.25→6.5, 6.75→7.0, 6.24→6.0, 3.0→clamped to 4.0.

> Note for founder's awareness (already decided, do not change): the official IELTS scale is 1.0–9.0. `report_floor: 4.0` is a deliberate product choice — genuine sub-4.0 performances display as 4.0. `scale_min` is kept at 0.0 internally so nothing breaks if the floor is ever lowered in config.

---

## 3. Strategy `cefr_hybrid` (Spoken English)

**Input:** the viva scorer outputs a **percent 0–100 per subskill** (the 6 subskills in config). For each subskill you produce **both** a CEFR band **and** a within-band progress %.

### 3a. Percent → CEFR level

Use `level_thresholds_min_pct` from config (ascending). Pick the **highest** level whose threshold ≤ score.

```
function pctToLevel(pct, thresholds) {
  // thresholds e.g. { below_a1:0, a1:14, a2:24, b1:41, b2:59, c1:79, c2:93 }
  const ordered = Object.entries(thresholds).sort((a,b) => a[1]-b[1]);
  let level = ordered[0][0];
  for (const [name, min] of ordered) if (pct >= min) level = name;
  return level;
}
```

Current thresholds (GSE-anchored placeholder):

| Level | min % (inclusive) |
|---|---|
| Below A1 | 0 |
| A1 | 14 |
| A2 | 24 |
| B1 | 41 |
| B2 | 59 |
| C1 | 79 |
| C2 | 93 |

### 3b. Within-band progress % (the "hybrid" motivational bit)

For a score inside a level: `progress = (pct − thisLevelMin) / (nextLevelMin − thisLevelMin)`. For C2 the upper bound is 100.

```
function withinBandProgress(pct, level, thresholds) {
  const ordered = Object.entries(thresholds).sort((a,b)=>a[1]-b[1]);
  const i = ordered.findIndex(([n]) => n === level);
  const lo = ordered[i][1];
  const hi = (i+1 < ordered.length) ? ordered[i+1][1] : 100;
  return Math.min(1, Math.max(0, (pct - lo) / (hi - lo)));
}
```

**Worked example** — subskill = 50%: level = **B1** (≥41, <59). Progress = (50−41)/(59−41) = **50%** → UI: *"B1 — halfway to B2."*

### 3c. Overall level — rule (b): average-then-map + always show profile

1. `avg = mean of the 6 subskill percents`
2. `overallLevel = pctToLevel(avg, thresholds)`
3. **Always** return the full 6-subskill profile alongside the headline. The headline is stable; the profile keeps weaknesses honest. Frontend must render both.

> Design decision I made for you (please confirm): the **headline Spoken English CEFR level is driven by the Speaking skill only** (`skills_in_overall: ["speaking"]`). Listening/Reading/Writing are practice surfaces (`surface_only: true`) — present in the product, not folded into the CEFR headline. This is the honest reading of "Spoken English." It's one config line to change later if you want a multi-skill CEFR profile.

---

## 4. Config validation (run on load — fail loud)

- `level_thresholds_min_pct` strictly ascending, first = 0, all within 0–100.
- Every `subskills` entry has a matching scored_subskill on the speaking skill.
- `skills_in_overall` all reference real skill ids.
- IELTS: `report_floor` between `scale_min` and `scale_max`; `step` divides the scale evenly.
- Every question in the `shared_speaking_bank` used by Spoken English carries a `cefr` tag (viva requires it).
- Reject unknown `scoring.strategy` values.

---

## 5. Legal strings (render verbatim from config)

Pull from `legal.disclaimer_full` / `legal.disclaimer_short` — **never hard-code**. Behaviour: show `disclaimer_full` once at onboarding (per exam), show `disclaimer_short` in the footer. The word **"certified/certificate"** must never appear near CEFR output — config uses "estimate." Strings are DRAFT_FOR_COUNSEL; when the lawyer edits wording, it's a config edit, zero code change.

---

## 7. Progression / motivation layer (strategy A + B)

This is a **display layer that sits on top of scoring — it never changes the assessed score.** Its job: make the student feel real momentum from a deliberately hard baseline and get pulled toward their peak.

### The one invariant (non-negotiable)

> `never_inflate_assessed_score = true`. The band / CEFR level we report is always the true assessed value. The "placebo" is **framing** — a hard baseline, personal-best-relative progress, next-rung, and trajectory — **never** a fake number. This is what keeps it from collapsing on test day.

### B — Challenge baseline

The diagnostic is intentionally hard and zero-based. Store its result as `baseline` and **disclose it** to the student as a "Challenge Baseline" (config `baseline.disclose_as` + `note_to_student`). Because the baseline is genuinely tough, later real scores read as a big jump — honestly, because they *are* a real gain from a real (hard) starting point.

### A — Honest-generous display

Every session returns, alongside the true score, a `progression` object with three framing signals. All reuse the exam's own scale — no new per-exam code.

**1. Next rung + progress toward it** (reuses within-band math from §3b)

- **CEFR:** `current = pctToLevel(avg)`, `next = nextLevel(current)`, `progress = withinBandProgress(avg, current)`.
- **IELTS:** use the *continuous* (pre-rounded) mean `s`. `current_rung = highest rung ≤ s` (rungs = 4.0,4.5,…,9.0). `next_rung = current_rung + step`. `progress = clamp((s − current_rung)/step, 0, 1)`.
  - Note: the **headline band** is still the half-up rounded value from §2. The progress widget uses the continuous mean and floor-to-rung — these are two different displays (assessed band vs. momentum bar). Keep them distinct; don't try to force them equal.

**2. Improvement since baseline** — `current − baseline`, in bands (IELTS) or level-steps (CEFR). Real delta from the hard baseline; this is the number that reads big and motivating.

**3. Recent trend** — sign of the slope over the last `trend_window_sessions` (default 3): `up` / `flat` / `down`. Simple and honest.

### Result envelope addition

```json
"progression": {
  "baseline": { "value": 4.0, "label": "4.0", "style": "challenge" },
  "current":  { "value": 5.5, "label": "5.5" },
  "next_rung": { "label": "6.0", "progress_to_next": 0.40 },
  "improvement_since_baseline": { "value": 1.5, "label": "+1.5 bands" },
  "recent_trend": "up"
}
```

### Guardrail to implement

Add an assertion in the result builder: the value inside `progression.current` **must equal** the assessed `overall.value`. If they ever diverge, throw — that divergence is exactly the failure mode we're preventing.

---

## 6. Open items still owned by the founder (TBD_FOUNDER in config)

1. Retake policy (both exams).
2. Graded attempts per cycle for IA / Full Mock.
3. Minimum attempts, if any.
4. Confirm the "Speaking-only headline" decision in §3c.
5. CEFR thresholds are a **placeholder** — calibrate against ~30 examiner-rated sample vivas post-launch, then adjust `level_thresholds_min_pct` (config-only change).
