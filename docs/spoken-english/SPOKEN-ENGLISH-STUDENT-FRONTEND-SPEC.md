# Spoken English — Student Frontend Spec

**Audience:** frontend engineer implementing the Spoken English student experience.
**Scope:** *display only.* All scoring is already computed server-side. Your job is to render
the data correctly **per exam**, and to keep the existing **IELTS** experience 100% intact.

---

## 0. The one rule that governs everything

> **Never remove or rewrite an IELTS code path. Branch on the exam and add a Spoken English path beside it.**

Every change in this doc is either:
- `if (isSpokenEnglish) { …new… } else { …existing IELTS… }`, or
- data-driven (read labels/scale from the API/config instead of hard-coding IELTS).

If you find yourself editing the IELTS branch, stop — you're doing it wrong.

---

## 1. How to detect the exam

The profile (`GET /api/profile`, already on `useAuth().profile`) now carries:

| field | type | meaning |
|---|---|---|
| `examId` | `string` | `"ielts"` \| `"spoken_english"` \| … |
| `examLabel` | `string` | display name, e.g. `"Spoken English"` |
| `batchName` | `string \| null` | current batch |
| `vivaDiagnostic` | `boolean` | `true` when the diagnostic is a viva (Spoken English) |
| `isDiagnosed` | `boolean` | diagnosed **for this exam** |
| `isEnrolled` | `boolean` | — |
| `targetBand` | `number \| null` | IELTS target; ignore for SE (see §7) |

Add one tiny helper and use it everywhere:

```ts
// src/features/student/utils/exam.ts
export const isSpokenEnglish = (examId?: string | null) => examId === "spoken_english";
// Prefer a capability flag when it exists:
export const isVivaExam = (p?: { vivaDiagnostic?: boolean }) => !!p?.vivaDiagnostic;
```

> Do **not** scatter `examId === "spoken_english"` string checks through JSX. Centralise the
> exam's display config (see §3) so onboarding a 3rd exam is a config edit, not a code hunt.

---

## 2. What is fundamentally different about Spoken English

| Concept | IELTS | Spoken English |
|---|---|---|
| Assessed skills | 4 (Listening, Reading, Writing, Speaking) | **1** (Speaking) |
| Sub-dimensions | per-skill sub-scores | **6 subskills** of the one skill |
| Scale | band **0–9** (shown 4.0–9.0) | **CEFR** level (`A1 … C2`, with `A2+/B1+/B2+` half-steps) |
| Headline number | overall band | **CEFR level** (e.g. `B1`) |
| Diagnostic | 4 sections | **viva** (record-and-submit, done) |
| Target | target band + exam date | target CEFR level (or none) |

**The 6 subskills** (render labels from the data, don't hard-code): Range, Accuracy, Fluency,
Responsiveness (id `interaction`), Coherence, Phonological Control (id `phonology`).

**Golden display rule:** for SE, **never show `band_score` as a number.** It stores a CEFR
*ordinal* (0–6) for storage reasons; always display `cefrLabel` from `sub_scores` instead.

---

## 3. Add a per-exam display config (frontend)

Create a small config so pages read from it instead of branching inline:

```ts
// src/features/student/config/examDisplay.ts
export interface ExamDisplay {
  examId: string;
  scale: "band" | "cefr";
  headlineLabel: string;              // "Overall band" | "CEFR level"
  showSkills: string[];               // which skill cards to render
  showTargetAndReadiness: boolean;    // band target + exam-date readiness (IELTS only)
  showTiles: { mock: boolean; ia: boolean; lexigrid: boolean; drills: boolean };
  disclaimer?: string;                // shown near any score output (SE legal req, §6)
}

export const EXAM_DISPLAY: Record<string, ExamDisplay> = {
  ielts: {
    examId: "ielts", scale: "band", headlineLabel: "Overall band",
    showSkills: ["listening", "reading", "writing", "speaking"],
    showTargetAndReadiness: true,
    showTiles: { mock: true, ia: true, lexigrid: true, drills: true },
  },
  spoken_english: {
    examId: "spoken_english", scale: "cefr", headlineLabel: "CEFR level",
    showSkills: ["speaking"],           // one skill; render as 6-subskill profile
    showTargetAndReadiness: false,
    showTiles: { mock: false, ia: false, lexigrid: false, drills: false }, // cohort 1 — CONFIRM with product
    disclaimer:
      "CEFR level results are estimates aligned to the Common European Framework of Reference for Languages. They are not official CEFR certifications.",
  },
};

export const examDisplay = (examId?: string | null): ExamDisplay =>
  EXAM_DISPLAY[examId ?? "ielts"] ?? EXAM_DISPLAY.ielts;
```

> `showTiles` for SE is set to all-false for cohort 1 (hide IELTS surfaces). **Confirm with
> product** whether L/R/W practice tiles stay as "practice surfaces" — the exam engine config
> marks them `assessed:false` but "present". Flip the flags, don't add new `if`s.

---

## 4. Data contracts (what the API returns)

All endpoints resolve the student's **single** enrollment, so an SE student's responses only
contain SE data and an IELTS student's only IELTS. No exam param needed (today).

### 4.1 `GET /api/student/competency-scores`
```jsonc
{
  "success": true,
  "data": [ /* StudentCompetencyMatrix rows */
    {
      "skill": "SPEAKING",
      "band_score": "3.0",          // CEFR ORDINAL — do NOT display as a band for SE
      "level": null,
      "exam_id": "spoken_english",
      "sub_scores": {
        "cefrLevel": "b1",
        "cefrLabel": "B1",           // ← the headline to show
        "meanScore": 46.2,           // mean of the 6 subskill percents (0–100)
        "subskillProfile": [
          { "id": "range",       "label": "Range",                 "level": "b1", "score": 44 },
          { "id": "accuracy",    "label": "Accuracy",              "level": "a2", "score": 33 },
          { "id": "fluency",     "label": "Fluency",               "level": "b2", "score": 62 },
          { "id": "interaction", "label": "Responsiveness",        "level": "b1", "score": 46 },
          { "id": "coherence",   "label": "Coherence",             "level": "b1", "score": 48 },
          { "id": "phonology",   "label": "Phonological Control",  "level": "b1", "score": 50 }
        ],
        "feedback": [ { "promptId": "…", "strengths": "…", "improvements": "…" } ],
        "scoredPromptCount": 7,
        "noResponseCount": 0
      }
    }
  ],
  "target_band": 7.0,     // IELTS-only; ignore for SE
  "current_band": 3.0,    // avg of band_scores — MEANINGLESS for SE, do not show
  "momentum_score": 120,
  "daily_streak": 4
}
```
For SE: read `data[0]` (the SPEAKING row) → `sub_scores` is your entire dashboard payload.

### 4.2 `GET /api/student/diagnostic-report`
First `DIAGNOSTIC` entry per skill — the baseline. For SE it's the viva result (same
`sub_scores` shape as above). Use this for a "your diagnostic" report view.

### 4.3 `GET /api/student/assessment-history`
`INTERNAL_ASSESSMENT` + `MOCK` rows only (newest first), each `{ id, skill, mode, band_score,
sub_scores, feedback_json, created_at }`. **Empty for SE cohort 1** (no IA/mock yet) → render an
empty state, not an error.

### 4.4 Diagnostic result (live, at end of viva)
`POST /api/diagnostic/viva/submit` → `{ result }` with the same `sub_scores` fields
(`cefrLevel/cefrLabel/meanScore/subskillProfile/feedback`). Already rendered in
`VivaDiagnostic.tsx` — reuse those presentational pieces on the dashboard.

---

## 5. CEFR display building blocks (add once, reuse)

```ts
// src/features/student/utils/cefr.ts
export const CEFR_ORDER = ["below_a1","a1","a2","a2+","b1","b1+","b2","b2+","c1","c2"] as const;
export const cefrPct = (level: string) => { /* optional: level → 0–100 for bars */ };

// Prefer the label from the data (sub_scores.cefrLabel / subskillProfile[].level).
export const cefrLabel = (id?: string) => (id ? id.toUpperCase().replace("+", "+") : "—");
```

- **Headline**: big `cefrLabel` (e.g. **B1**) + optional caption `"Based on N graded answers"`
  (`scoredPromptCount`).
- **Subskill profile**: a **radar** (6 axes) or **6 horizontal bars** using `subskillProfile`
  (`label`, `level`, `score`). Colour by band (e.g. a2 warm → c1 green). Weakest = below B1.
- **Within-level progress** (optional, config `within_level_progress:true`): a thin bar showing
  progress from the current level toward the next, from `meanScore`.

---

## 6. Legal / compliance (Spoken English only — non-negotiable)

The exam config carries CEFR legal text. Wherever a CEFR score is shown:
- Show the short disclaimer (`examDisplay(examId).disclaimer`) near the result.
- Show the **full** disclaimer at onboarding.
- **Banned words near any score**: "certified", "certificate", "certification", "official CEFR
  level", "CEFR accredited", "recognised by the Council of Europe". Never render these for SE.

---

## 7. Page-by-page

### 7.1 Student Dashboard — `StudentDashboardPage.tsx`  *(highest priority — currently broken for SE)*
Today it hard-codes `SKILL_BANDS` (4 IELTS skills), computes `overallBand(...)`, shows band
targets/readiness, and gates on drill-lock. For SE:

- **Skill area**: replace the 4-card grid with a **CEFR result panel** — headline `cefrLabel`,
  the **6-subskill** radar/bars (from `data[0].sub_scores`), and the diagnostic feedback list
  (reuse the VivaDiagnostic "Your feedback" block). Gate on `examDisplay(examId).showSkills`.
- **Hero / "The Climb"**: drop band math. Show current CEFR level (+ within-level progress).
  Keep the greeting/streak/momentum (skill-agnostic).
- **Target & readiness**: hide when `!showTargetAndReadiness` (SE has no band/exam-date model).
- **Tiles** (Mock / IA / LexiGrid / practice): render each only if `showTiles.*` (hidden for SE
  cohort 1).
- **Drill-lock gate** (`StudentDrillLockGuard`): for a viva exam, **skip the gate** (there are no
  IELTS drills to complete) — an SE diagnosed student should see their dashboard directly.
- **Exam·batch chip**: already added; keep.
- **Not-yet-diagnosed**: SE students route to the viva; the dashboard's "complete your
  diagnostic" CTA should deep-link to `/{examId}/diagnosis`.

### 7.2 Sidebar — `dashboard/StudentSidebar.tsx`
Build the nav item list from `examDisplay(examId)`:
- SE shows: Dashboard, (Report/Diagnostic result), Settings — **hide** Listening/Reading/
  Writing/Speaking practice, Mid-Week (IA), Full Mock, Daily Challenge (LexiGrid), Roadmap,
  Recommendations for cohort 1 (`showTiles`/`showSkills`-driven).
- Keep IELTS's full list unchanged.

### 7.3 Assessment History — `AssessmentHistoryPage.tsx` / `StudentAssessmentHistoryPage.tsx`
- IELTS rows: unchanged (band + sub-scores).
- SE rows: show `sub_scores.cefrLabel` + the 6 subskills instead of a band; `mode` column as-is.
- Cohort 1 SE has no IA/mock rows → **empty state** ("No assessments yet — your diagnostic is
  under *Diagnostic report*"), not an error.

### 7.4 Diagnostic report / Reports — `Report.tsx`, `diagnostic-report`
- SE: render the CEFR headline + 6-subskill profile + per-answer feedback from the DIAGNOSTIC
  `sub_scores`. This is the SE student's main "results" surface.
- IELTS: unchanged.

### 7.5 Speaking history — `StudentSpeakingHistoryPage.tsx`
- SE: list viva results (CEFR + subskills). IELTS: unchanged.

### 7.6 Onboarding / Profile / Settings — `OnboardingWalkthrough.tsx`, `StudentProfilePage.tsx`
- Replace "target band + exam date" with **target CEFR level** (dropdown A1…C2) **or hide** the
  goal step for SE (confirm with product). Never show band 0–9 inputs for SE.
- Show the **full CEFR disclaimer** at onboarding (§6).

### 7.7 Diagnostic (viva) — `VivaDiagnostic.tsx`
Done. Audio-only questions vs read-aloud text, record/replay, IndexedDB persistence, CEFR result
+ subskills + feedback. No change needed; **reuse its result/feedback components** on the
dashboard/report so there's one source of truth for CEFR rendering.

### 7.8 Anywhere a "band" is printed
Search for band rendering (`overallBand`, `bandFillPct`, `.band_score`, "Band"/"/9" labels). For
each, branch: SE → CEFR label from `sub_scores`; IELTS → existing. Do **not** feed a CEFR ordinal
into band widgets.

---

## 8. What to HIDE for Spoken English (cohort 1)
Driven by `examDisplay`, not deletion:
- Listening / Reading / Writing skill cards + practice pages.
- Band target, exam-date readiness/prediction.
- Full Mock, Mid-Week Assessment (IA), Daily Challenge (LexiGrid), Drills — unless product says
  keep L/R/W as practice surfaces.
- Any 0–9 band number, `/9` suffixes, "band" wording.

*(Confirm the hide-vs-keep list with product; it's one config object to flip.)*

---

## 9. Edge cases
- **Not diagnosed** (`isDiagnosed === false`): dashboard shows a "take your speaking diagnostic"
  CTA → `/{examId}/diagnosis`. No CEFR panel yet.
- **Withheld diagnostic** (`sub_scores` absent / `status: "withheld"`): show "Diagnostic
  incomplete — retake", not a broken/empty panel.
- **No matrix row / empty data**: empty state, never a crash.
- **Multi-exam (future)**: today a student has one exam; when multi-exam ships, the same
  components just read the active exam's data — keep everything keyed off `examId`, don't assume
  a single global.

---

## 10. Acceptance checklist
- [ ] IELTS student dashboard/history/reports/sidebar are **pixel-identical** to before.
- [ ] SE student dashboard shows CEFR level + 6-subskill profile + feedback (no 4 skill cards, no band).
- [ ] No `band_score` ordinal is ever shown as a number for SE.
- [ ] SE sidebar hides IELTS-only nav; SE student is not blocked by the drill-lock gate.
- [ ] SE assessment history shows an empty state (not an error) for cohort 1.
- [ ] CEFR short disclaimer near results; full disclaimer at onboarding; no banned terms.
- [ ] Onboarding shows CEFR target (or hidden) for SE, band target for IELTS.
- [ ] Adding a 3rd exam later is a config edit in `examDisplay`, not new `if` branches.

---

## 11. Backend touch-points (reference — mostly done)
- `GET /api/profile` → `examId, examLabel, batchName, vivaDiagnostic, isDiagnosed`.
- `GET /api/student/competency-scores` → matrix rows (SE: 1 SPEAKING row, CEFR in `sub_scores`).
  ⚠️ `current_band` is a band-average — ignore for SE.
- `GET /api/student/diagnostic-report` → baseline DIAGNOSTIC per skill (SE viva result).
- `GET /api/student/assessment-history` → IA/MOCK (empty for SE cohort 1).
- Viva: `GET/POST /api/diagnostic/viva/prompts|submit`.

> If a display need can't be met from the current responses (e.g. you want the CEFR label at the
> top level of `competency-scores` instead of digging into `sub_scores`), file it — a small
> backend shaping change is cheaper than frontend guesswork. Don't recompute CEFR on the client.
