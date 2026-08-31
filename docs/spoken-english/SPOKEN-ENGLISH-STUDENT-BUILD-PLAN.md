# Spoken English — Student Platform Build Plan (IELTS parity)

Goal: bring the Spoken English student experience to full parity with IELTS across **every
page**, reusing IELTS logic/components made **exam-aware** (like the drill engine), never
forking IELTS. Config-driven via `examDisplay` + `spokenEnglishSubskills`.

---

## Where we are (done)
- **Diagnostic viva** → CEFR + 6-subskill profile + feedback.
- **Dashboard core**: The Climb (CEFR), 3-drill unlock gate, standalone LexiGrid, subskill
  profile + per-subskill Practice, coaching notes, momentum/streak sync, clean drill completion.
- **Drill flow**: shared `DrillScreen` + exam-aware `getNextActionDrill` (weakest not-done-today
  subskill), MCQ content live (5 subskills; `interaction` pending the enum migration + import).
- **Exam-prefixed routes**, dashboard dispatch, drill-gate skip, sidebar filter.

## Gap analysis — IELTS has, SE lacks
| Area | IELTS | SE status |
|---|---|---|
| Skill cards (rich, with subskills) | 4 skill cards | have profile bars → upgrade to cards |
| Weekly rhythm ("This week") | ✅ | ✗ |
| Momentum Wallet (redeem) | ✅ | ✗ |
| Predicted readiness | exam-date/band | ✗ (needs CEFR-target model) |
| Catch-up banners (missed IA) | ✅ | ✗ (needs IA) |
| **Internal Assessment (IA)** | full flow + schedule widget + page | ✗ **(needs BE + content)** |
| **Mock** | full flow + widget + page | ✗ **(needs BE + content)** |
| Skill Modules nav | ✅ | partial (Practice buttons) |
| Reports / diagnostic report page | ✅ | ✗ (CEFR view) |
| Assessment history page | ✅ | ✗ (SE view) |
| Recommendations / roadmap | ✅ | ✗ (subskill) |
| Settings/Profile goal | target band + date | ✗ (CEFR target) |

## Principles
1. **Exam-aware reuse, not forks.** Extend the shared backend (IA/mock/recommendation) with an
   `exam_id` branch that reads the CEFR subskill model; keep IELTS paths byte-identical.
2. **Shared components.** Extract the internal dashboard widgets (WeeklyRhythm, MomentumWallet,
   SkillCard) into shared, prop-driven components both dashboards use.
3. **Grade speaking via the viva pipeline.** SE IA + Mock answers are audio → graded by
   `services/viva` (same as the diagnostic), producing CEFR + subskills.
4. **Content dependencies** (data team, per the content-data-requirement doc): IA = 24 speaking
   prompts; Mock = 21 (3 forms). Drills already delivered.

---

## Phases

### Phase 1 — Dashboard parity (no new content/BE) ← start here
- **FE**: add to the SE dashboard, reusing/reimplementing the IELTS widgets exam-aware:
  - Weekly rhythm ("This week" streak strip).
  - Momentum Wallet (momentum + redeem for extra practice — momentum is exam-agnostic).
  - Skill-modules row (the 6 subskills as tap-to-practice cards).
  - Upgrade the subskill profile rows to richer cards (optional polish).
- **FE polish**: the drill intro's "CURRENT SUB-SCORE —" → show the subskill's CEFR level.
- **BE**: none (reuses momentum/streak/daily-drill-state).

### Phase 2 — Internal Assessment (IA)   *(BE + FE + content)*
- **BE**: make `iaController` exam-aware — for SE, serve speaking IA prompts from `ia_questions`
  (exam-scoped), grade audio via the viva pipeline, update `StudentCompetencyMatrix` (CEFR +
  subskills), and drive the IA schedule/"re-scores your sub-scores" cadence.
- **FE**: SE IA page (record-and-submit, reuse the viva recorder), IA schedule widget (exam-aware),
  catch-up banners (missed IA → momentum dip).
- **Content**: 24 IA speaking prompts.

### Phase 3 — Mock   *(BE + FE + content)*
- **BE**: make `mockController` exam-aware — SE speaking mock (one form = full viva), viva grading
  → CEFR result, monthly availability.
- **FE**: SE Mock widget + mock page (speaking, reuse recorder), result screen (CEFR).
- **Content**: 21 mock prompts (3 forms).

### Phase 4 — Supporting pages (exam-aware)
- **Reports / diagnostic-report**: CEFR headline + 6-subskill profile + feedback + history.
- **Assessment history**: SE rows (CEFR) + empty state when none.
- **Recommendations / roadmap**: per-subskill (weakest → practice + lessons).
- **Settings / Profile**: CEFR target (or hidden) instead of band + exam date.
- **Speaking history**: viva/IA/mock results over time.

### Phase 5 — Readiness + polish
- **Predicted readiness**: CEFR-target model (target level + optional date) or a "progress to next
  level" card instead of the band/exam-date one.
- Empty states, PDF export, a11y, edge cases (withheld, not-diagnosed, C1 with no drills).

---

## Decisions needed
1. **Predicted readiness for SE** — do we introduce a CEFR *target level* (+ optional date), or
   replace readiness with a simple "progress to next CEFR level" card? (Affects Phase 1/5 + onboarding.)
2. **IA / Mock cadence for SE** — same as IELTS (weekly IA, monthly mock), or different?
3. **IA/Mock content timeline** — Phases 2–3 are blocked on the 24 IA + 21 mock speaking prompts.

## Sequencing note
Phase 1 ships now (visible parity, zero dependencies). Phases 2–3 are the heavy lifts and are
**content-gated** — the backend/FE can be built against a small sample set (like the drills) while
the data team produces the full content, then swapped in.
