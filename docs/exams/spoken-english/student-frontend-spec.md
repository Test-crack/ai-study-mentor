# Spoken English — Student Frontend Spec & Handoff

**Audience:** frontend engineer completing the Spoken English (SE) student experience.
**Scope:** *display only.* All scoring is computed server-side. Your job is to render the data
correctly **per exam** and keep the existing **IELTS** experience 100% intact.

> **Status of this doc (2026-09-01):** The backend is **done** for cohort 1. A large part of the
> frontend is **already built** (dashboard, drills, viva, IA, routing, sidebar). What remains is
> the **assessment/report/onboarding surfaces** (CEFR-ify them) and **verifying the exam routing
> actually engages** for SE students. See §0.1 for the at-a-glance status.

---

## 0. The one rule that governs everything

> **Never remove or rewrite an IELTS code path. Branch on the exam and add a Spoken English path beside it.**

Every change is either `if (isSpokenEnglish) { …new… } else { …existing IELTS… }` or data-driven
(read labels/scale from the API/config instead of hard-coding IELTS). If you're editing the IELTS
branch, stop — you're doing it wrong.

---

## 0.1 Status at a glance

**Legend:** ✅ done & on `dev` · 🔲 to-do (your work) · 🔷 backend done, frontend pending · ⚠️ known issue to verify

| Area | Status | Notes |
|---|---|---|
| **Exam detection + config** (`examDisplay`, `spokenEnglishSubskills`, `exam.ts`) | ✅ | `isSpokenEnglish`, `EXAM_DISPLAY`, `SE_SUBSKILLS` all landed |
| **Exam-prefixed routing** (`/:examSlug/*`, dispatch layer) | ✅ / ⚠️ | Built in `App.tsx`; **verify it engages** — see ⚠️ below |
| **SE Student Dashboard** (`SpokenEnglishDashboardPage.tsx`) | ✅ | CEFR Climb, 3-drill gate, LexiGrid, 6-subskill profile, momentum, widgets |
| **Sidebar** (SE nav filtering) | ✅ | `SE_ALLOWED` set; exam-path rewrite |
| **Diagnostic viva** (`VivaDiagnostic.tsx`) | ✅ | Audio/read-aloud, record/replay, CEFR result + feedback |
| **Drills** (`DrillScreen`, `DrillResultCard`, brief) | ✅ | Exam-aware; MCQ-only; CEFR focus queue |
| **Internal Assessment** (`SpokenEnglishIAPage.tsx` + `/api/ia/se/*`) | ✅ | Record-and-submit, per-subskill CEFR deltas |
| **Assessment History** (`AssessmentHistoryPage.tsx`) | 🔷 🔲 | **Main remaining work** — CEFR-ify, §7.3 |
| **Diagnostic Report / Report** (`Report.tsx`, `diagnostic-report`) | 🔷 🔲 | CEFR headline + 6-subskill + feedback, §7.4 |
| **Speaking history** (`StudentSpeakingHistoryPage.tsx`) | 🔷 🔲 | CEFR list, §7.5 |
| **Onboarding / Profile / Settings** (CEFR target, disclaimer) | 🔷 🔲 | §7.6 |
| **Roadmap / Recommendations** | 🔲 | Hidden for SE cohort 1 today; enable later (config flip) |

⚠️ **Known issue — SE student is seeing the IELTS dashboard.** In the current screenshots an SE
account renders IELTS "The Climb" (band 5.5, "goal band 6.5", "Intermediate") and the **full IELTS
sidebar** (Listening/Reading/Writing/Speaking/Roadmap/Recommendations/Report). That means the
student is landing on `/student/dashboard` (the IELTS page) instead of `/{examSlug}/dashboard`, so
the SE dispatch never runs. **First task: make sure SE students actually route through the
exam-prefixed dispatch** (§7.0). Everything downstream depends on it.

---

## 1. How to detect the exam

`GET /api/profile` (already on `useAuth().profile`) carries:

| field | type | meaning |
|---|---|---|
| `examId` | `string` | `"ielts"` \| `"spoken_english"` \| … |
| `examLabel` | `string` | display name, e.g. `"Spoken English"` |
| `batchName` | `string \| null` | current batch |
| `vivaDiagnostic` | `boolean` | `true` when the diagnostic is a viva (Spoken English) |
| `isDiagnosed` | `boolean` | diagnosed **for this exam** |
| `isEnrolled` | `boolean` | — |
| `targetBand` | `number \| null` | IELTS target; ignore for SE (see §7.6) |

Helper (already exists): `src/features/student/utils/exam.ts`

```ts
export const isSpokenEnglish = (examId?: string | null) => examId === "spoken_english";
export const isVivaExam = (p?: { vivaDiagnostic?: boolean }) => !!p?.vivaDiagnostic;
```

> Do **not** scatter `examId === "spoken_english"` string checks through JSX. Use the centralised
> `examDisplay` config (§3) so onboarding a 3rd exam is a config edit, not a code hunt.

---

## 2. What is fundamentally different about Spoken English

| Concept | IELTS | Spoken English |
|---|---|---|
| Assessed skills | 4 (Listening, Reading, Writing, Speaking) | **1** (Speaking) |
| Sub-dimensions | per-skill sub-scores | **6 subskills** of the one skill |
| Scale | band **0–9** (shown 4.0–9.0) | **CEFR** level (`A1 … C2`, with `A2+/B1+/B2+` half-steps) |
| Headline number | overall band | **CEFR level** (e.g. `B1`) |
| Diagnostic | 4 sections | **viva** (record-and-submit) ✅ |
| Drills | 4-skill MCQ + LexiGrid gate | **MCQ only**, subskill-based; 3-drill gate; LexiGrid standalone ✅ |
| Internal Assessment | written/band | **record-and-submit viva**, CEFR ✅ |
| Target | target band + exam date | target CEFR level (or none) |

**The 6 subskills** (render labels from the data, don't hard-code): Range, Accuracy, Fluency,
Responsiveness (id `interaction`), Coherence, Phonological Control (id `phonology`).

**Golden display rule:** for SE, **never show `band_score` as a number.** It stores a CEFR *ordinal*
(0–6) for storage reasons; always display `cefrLabel` from `sub_scores` instead.

---

## 3. Per-exam display config  ✅ (already added)

`src/features/student/config/examDisplay.ts` — `EXAM_DISPLAY` (`ielts` / `spoken_english`) +
`examDisplay(examId)`. `src/features/student/config/spokenEnglishSubskills.ts` — `SE_SUBSKILLS`
(6 subskills with drill-enum mapping), `seSubskill`, `seSubskillByEnum`, `cefrToDrillLevel`,
`nextCefr`, `withinLevelProgress`.

```ts
export interface ExamDisplay {
  examId: string;
  scale: "band" | "cefr";
  headlineLabel: string;              // "Overall band" | "CEFR level"
  showSkills: string[];               // which skill cards to render
  showTargetAndReadiness: boolean;    // band target + exam-date readiness (IELTS only)
  showTiles: { mock: boolean; ia: boolean; lexigrid: boolean; drills: boolean };
  disclaimer?: string;                // CEFR legal text (SE, §6)
}
```

> Read from this config instead of branching inline. To enable a hidden SE surface later
> (e.g. roadmap), flip a flag here — don't add new `if`s.

---

## 4. Data contracts (what the API returns)  🔷 backend done

All endpoints resolve the student's **single** enrollment, so an SE student's responses only contain
SE data. No exam param needed today.

### 4.1 `GET /api/student/competency-scores`
```jsonc
{
  "success": true,
  "data": [ /* StudentCompetencyMatrix rows */
    {
      "skill": "SPEAKING",
      "band_score": "3.0",          // CEFR ORDINAL — do NOT display as a band for SE
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
First `DIAGNOSTIC` entry per skill — the baseline. For SE it's the viva result (same `sub_scores`
shape). Use for the "your diagnostic" report view.

### 4.3 `GET /api/student/assessment-history`
`INTERNAL_ASSESSMENT` + `MOCK` rows only (newest first), each `{ id, skill, mode, band_score,
sub_scores, feedback_json, created_at }`. **SE IA rows now populate here once a student completes an
IA** (`sub_scores` = CEFR shape as §4.1). Mock is empty for SE cohort 1 → empty state, not an error.

### 4.4 Diagnostic result (live, at end of viva)  ✅ rendered
`POST /api/diagnostic/viva/submit` → `{ result }` with the same `sub_scores` fields. Already rendered
in `VivaDiagnostic.tsx` — **reuse those presentational pieces** on the dashboard/report.

### 4.5 Internal Assessment (SE)  ✅ wired  — NEW endpoints
- `GET /api/ia/se/questions` → `{ session_id, prompts: [{ id, type, text?, audio_url?, options }] }`
  (2 weakest×drilled subskills that have IA prompts; `SPEAKING_PROMPT`).
- `POST /api/ia/se/submit` (multipart: `session_id` + one audio file per `prompt.id`) →
  per-subskill CEFR result with deltas. Writes an `INTERNAL_ASSESSMENT` row (shows up in §4.3) and
  updates the competency matrix.
- IA **scheduling/availability**: reuse the exam-agnostic `getIAStatus` (drill-date/interval/DCS
  driven). The SE dashboard `IACard` already reads it and links `/{examId}/internal`.

---

## 5. CEFR display building blocks  ✅ (reuse, don't re-derive)

- **Headline**: big `cefrLabel` (e.g. **B1**) + optional caption `"Based on N graded answers"`
  (`scoredPromptCount`).
- **Subskill profile**: radar (6 axes) or 6 horizontal bars from `subskillProfile`
  (`label`, `level`, `score`). Colour by level (a2 warm → c1 green). Weakest = below B1.
- **Within-level progress** (optional): thin bar from `meanScore` toward the next level
  (`withinLevelProgress` / `nextCefr` helpers).

The dashboard already implements these; the remaining pages (§7.3–7.6) should **import/reuse the same
presentational pieces**, not reinvent them.

---

## 6. Legal / compliance (Spoken English only — non-negotiable)

Wherever a CEFR score is shown:
- Show the short disclaimer (`examDisplay(examId).disclaimer`) near the result.
- Show the **full** disclaimer at onboarding.
- **Banned words near any score**: "certified", "certificate", "certification", "official CEFR
  level", "CEFR accredited", "recognised by the Council of Europe". Never render these for SE.

---

## 7. Page-by-page (status + what to do)

### 7.0 Exam routing / dispatch  ⚠️ VERIFY FIRST
The app has a `/:examSlug` layout (`StudentExamLayout`) and dispatch components
(`StudentDashboardDispatch`, `InternalAssessmentDispatch`) in `App.tsx` that render the SE variant
when `isSpokenEnglish(examSlug)`. **But the screenshots show an SE student on the IELTS dashboard**,
which means one of:
1. The student is being sent to `/student/dashboard` (IELTS) at login instead of
   `/{examId}/dashboard`. → Fix the post-login/redirect to use the profile's `examId`.
2. The dispatch isn't reading `examSlug`/`examId` correctly. → Confirm `useParams().examSlug` (or
   `profile.examId`) resolves to `"spoken_english"` for this account.

**Acceptance:** an SE account lands on the SE dashboard (CEFR Climb, no band, SE-filtered sidebar)
**without** manually typing the URL. Do this before anything else — the other pages can't be
verified until routing is correct.

### 7.1 Student Dashboard  ✅ `SpokenEnglishDashboardPage.tsx`
Built: CEFR "Climb" (current→next level, within-level progress), 3-drill gate (no LexiGrid step),
standalone LexiGrid, 6-subskill profile + Practice, coaching notes, momentum sync (`syncMomentum`/
`updateStreak`), WeeklyRhythm, MomentumWallet, PredictedReadiness (CEFR), IACard (reads
`getIAStatus`). Uses exam-aware `getNextActionDrill` for the next drill. **No action** unless §7.0
reveals it isn't being reached.

### 7.2 Sidebar  ✅ `dashboard/StudentSidebar.tsx`
`SE_ALLOWED = { dashboard, games, internal, how-it-works }` filters the nav; `toExamPath` rewrites
`/student/*` → `/{examSlug}/*`. Depends on `examSlug` being present (see §7.0). **No action** beyond
routing.

### 7.3 Assessment History — `AssessmentHistoryPage.tsx`  🔷 🔲 **MAIN REMAINING WORK**
Today this page is band-shaped throughout (`bandColor`/`bandBg`/`bandGaugeColor`, `BandBadge`
`band.toFixed(1)`, the band-over-time chart plotting 0–9, 4-skill `SKILL_CONFIG`, IELTS-subskill
configs). Make it exam-aware **reusing the same widgets/styling**:
- **Score formatter**: add `scoreLabel(examId, value, subScores)` → `"B1"` for SE (from
  `sub_scores.cefrLabel`), `value.toFixed(1)` for IELTS. Thread it through `BandBadge`, the stat
  pills, the list rows, and the chart y-axis.
- **Skill/subskill config**: SE = 1 skill (Speaking) + the 6 CEFR subskills (from
  `SE_SUBSKILLS`), replacing the 4-skill filter and IELTS subskill config.
- **Chart**: CEFR y-axis (below_a1…c2) for SE instead of 0–9; reuse the same chart component with
  an exam-aware scale/formatter.
- **Tabs**: Internal Assessments (SE IA rows now populate, §4.3/4.5), Mock (empty state for cohort
  1), Diagnostic Report (viva result).
- **Cleanest approach** (keeps IELTS byte-identical): route dispatch → an SE assessment-record
  variant that composes the **same widgets** with the CEFR formatter + SE config, mirroring how the
  dashboard/IA dispatch works. Do **not** feed a CEFR ordinal into band widgets.

### 7.4 Diagnostic report / Reports — `Report.tsx`, `diagnostic-report`  🔷 🔲
SE: render CEFR headline + 6-subskill profile + per-answer feedback from the DIAGNOSTIC `sub_scores`
(§4.2) — reuse the VivaDiagnostic result/feedback components. This is the SE student's main
"results" surface. IELTS: unchanged.

### 7.5 Speaking history — `StudentSpeakingHistoryPage.tsx`  🔷 🔲
SE: list viva/IA results (CEFR + subskills). IELTS: unchanged.

### 7.6 Onboarding / Profile / Settings — `OnboardingWalkthrough.tsx`, `StudentProfilePage.tsx`  🔷 🔲
Replace "target band + exam date" with **target CEFR level** (dropdown A1…C2) **or hide** the goal
step for SE (confirm with product). Never show band 0–9 inputs for SE. Show the **full CEFR
disclaimer** at onboarding (§6).

### 7.7 Diagnostic (viva) — `VivaDiagnostic.tsx`  ✅
Done: audio-only questions vs read-aloud text, record/replay, IndexedDB persistence, CEFR result +
subskills + feedback. **Reuse its result/feedback components** on the dashboard/report so there's
one source of truth for CEFR rendering.

### 7.8 Drills — `Drills/DrillScreen.tsx`, `DrillResultCard.tsx`  ✅
Done: exam-aware brief (CEFR focus queue from `subskillProfile`, SE subskill labels via
`seSubskillByEnum`), MCQ-only, clean SE result card (no video/reflection/LexiGrid gate). Uses the
shared IELTS `getNextActionDrill` made exam-aware. **No action.**

### 7.9 Internal Assessment — `SpokenEnglishIAPage.tsx`  ✅
Done: record-and-submit IA reusing the viva recorder + `vivaRecordingCache` (namespaced
`${examId}-ia`); fetches `/api/ia/se/questions`, submits FormData to `/api/ia/se/submit`, shows
per-subskill CEFR result with deltas. **No action** beyond the routing (§7.0) reaching it via
`/{examId}/internal`.

### 7.10 Anywhere a "band" is printed
Search for band rendering (`overallBand`, `bandFillPct`, `.band_score`, "Band"/"/9" labels). For
each, branch: SE → CEFR label from `sub_scores`; IELTS → existing. Do **not** feed a CEFR ordinal
into band widgets.

---

## 8. What to HIDE for Spoken English (cohort 1)  ✅ config-driven
Driven by `examDisplay` / `SE_ALLOWED`, not deletion:
- Listening / Reading / Writing skill cards + practice pages.
- Band target, exam-date readiness/prediction (dashboard already uses CEFR readiness).
- Full Mock (Phase 3, not yet), Roadmap, Recommendations, My Courses — hidden for cohort 1.
- Any 0–9 band number, `/9` suffixes, "band" wording.

*(To keep L/R/W as practice surfaces later, flip flags in `examDisplay`.)*

---

## 9. Edge cases
- **Not diagnosed** (`isDiagnosed === false`): dashboard shows a "take your speaking diagnostic" CTA
  → `/{examId}/diagnosis`. No CEFR panel yet. ✅
- **Withheld diagnostic** (`sub_scores` absent / `status: "withheld"`): show "Diagnostic incomplete —
  retake", not a broken/empty panel.
- **No matrix row / empty data**: empty state, never a crash.
- **No IA yet**: assessment-history IA tab shows an empty state (not an error) until the student
  completes their first SE IA.
- **Multi-exam (future)**: keep everything keyed off `examId`; don't assume a single global.

---

## 10. Acceptance checklist
- [ ] **SE account auto-routes to the SE dashboard** (no manual URL), IELTS-shaped Climb/sidebar
      gone. *(§7.0 — currently failing per screenshots.)*
- [ ] IELTS student dashboard/history/reports/sidebar are **pixel-identical** to before.
- [ ] SE dashboard shows CEFR level + 6-subskill profile + feedback (no 4 skill cards, no band). ✅
- [ ] No `band_score` ordinal is ever shown as a number for SE.
- [ ] SE sidebar hides IELTS-only nav; SE student is not blocked by the drill-lock gate. ✅
- [ ] **Assessment history CEFR-ified** (formatter + SE config + CEFR chart), IA rows visible,
      empty states for mock. *(§7.3 — main remaining.)*
- [ ] Diagnostic report / Report renders CEFR + 6 subskills + feedback. *(§7.4)*
- [ ] Speaking history renders CEFR list. *(§7.5)*
- [ ] Onboarding shows CEFR target (or hidden) for SE, band target for IELTS; full disclaimer at
      onboarding; short disclaimer near results; no banned terms. *(§7.6)*
- [ ] Adding a 3rd exam later is a config edit in `examDisplay`, not new `if` branches.

---

## 11. Backend touch-points  🔷 DONE (cohort 1)
All endpoints below are live on `dev`. If a display need can't be met from the current responses,
file it — a small backend shaping change is cheaper than frontend guesswork. **Don't recompute CEFR
on the client.**

| Endpoint | Purpose | SE notes |
|---|---|---|
| `GET /api/profile` | exam context | `examId, examLabel, batchName, vivaDiagnostic, isDiagnosed` |
| `GET /api/student/competency-scores` | matrix rows | SE: 1 SPEAKING row, CEFR in `sub_scores`; ⚠️ `current_band` is a band-avg — ignore for SE |
| `GET /api/student/diagnostic-report` | baseline DIAGNOSTIC per skill | SE viva result (§4.2) |
| `GET /api/student/assessment-history` | IA + MOCK rows | SE IA rows populate after first IA; mock empty cohort 1 |
| `GET / POST /api/diagnostic/viva/prompts \| submit` | viva flow | DB-driven prompts, session-pinned version vector |
| `GET /api/ia/se/questions` | SE IA prompts | 2 weakest×drilled subskills w/ IA prompts |
| `POST /api/ia/se/submit` | SE IA grade | multipart audio; per-subskill CEFR + deltas; writes IA row + matrix |
| drill engine (`getNextActionDrill`, `getDrillQuestions`) | exam-aware weakness ranking + MCQ | SE branch from `subskillProfile` |
| IA scheduling (`getIAStatus`) | availability | exam-agnostic; reused as-is |

> **Session-side (not the frontend engineer's concern — we'll handle):** DB scripts to run on the
> dev DB (`band_range_cefr.sql`, `add_interaction_subskill.sql` + interaction drill import), SE IA
> content seeding (per `SPOKEN-ENGLISH-IA-DATA-REQUIREMENT.md`), and Phase 3 Mock.
