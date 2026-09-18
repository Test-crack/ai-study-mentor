# Spoken English — Implementation Plan (to go live)

**Goal:** launch Spoken English (CEFR-aligned, speaking-only) as a standalone exam.
**Inputs:** Paul's `spoken-english-rubric-and-content.md` (rubric, 8 prompts, decisions, guardrails) — this closes all stakeholder blockers. What remains is **engineering + content seeding**.
**Scope decisions (locked by Paul):** general adult learners · fixed prompts, record-and-submit · L/R/W hidden · market A1–B2 · launch on provisional CEFR thresholds + disclaimer · `interaction` graded as **"Responsiveness"** in v1.

Zero IELTS impact rule: everything here is additive or `spoken_english`-only. IELTS behaviour must not change.

---

## Still owed by content (not eng)
- **Prompt-6 audio asset** — a ~20s recorded voice message (friend asking for job-move advice). Any clear speaker.

---

## What already exists (don't rebuild)
- `spoken_english` config entry (CEFR, speaking-only, 6 subskills, `cefr_hybrid`, `cefr_6`, viva).
- `cefr_hybrid` engine strategy: takes **0–100 per subskill** → averages → maps to CEFR level via `cefr_6.thresholds_min_pct`, returns the per-subskill profile. Built + vector-tested.
- Registration, subscriptions, exam-scoped content queries.

---

## Phase 0 — Config alignment (small, do first)
1. **Update `cefr_6.thresholds_min_pct`** to Paul's Section-3 reported-level cut-offs: `below_a1:0, a1:22, a2:30, b1:43, b2:59, c1:76, c2:85`. (Only `spoken_english` uses `cefr_6` → no IELTS impact.) Keep `_calibration_status: PROVISIONAL_UNCALIBRATED`.
2. **Confirm the 6 subskill ids** in the `speaking` component match the grader/rubric: `range, accuracy, fluency, interaction, coherence, phonology`. Keep `interaction` as the internal id (per §1 of the pack); the **"Responsiveness"** rename is a *display label only*.
3. Update validator/vectors if the CEFR thresholds are asserted anywhere; keep the suite green.
- **Verify:** `npm run exam-engine:vectors` green; `cefr_hybrid` on sample subskill %s maps to the levels Paul's table predicts.

## Phase 1 — CEFR Speaking grader (the core adapter, Layer B)
A new grading module (sibling to `ieltsSpeakingService`), selected for `spoken_english`. It's the bespoke "brain."
1. **Input:** a student's response (audio/transcript) to a prompt.
2. **Output contract (what the engine needs):** a CEFR level per subskill (allowed set incl. half-steps: `Below A1, A1, A2, A2+, B1, B1+, B2, B2+, C1, C2`) → convert via Paul's Section-3 table (`Below A1=15 … C2=87`) → **0–100 per subskill** fed to `cefr_hybrid`.
3. **Prompt:** encode the §2 rubric (6 subskills × level descriptors), the Indian-English/accent notes, and the "score each subskill independently, half-steps allowed" instruction.
4. **Guardrails (§4), applied per response before/around grading:**
   - <5 words / silence / inaudible / non-English → **retry once, then `no_response`** (exclude from averages). **Never floor to Below A1.**
   - inaudible → never charge Phonology (equipment issue).
   - <25 words on a main prompt → grade but **cap every subskill at A2**.
   - off-topic but fluent → **cap Responsiveness + Coherence at A2**, grade the rest.
   - **≥4 of 8 prompts `no_response` → withhold the whole result** ("Diagnostic incomplete — retake").
5. **Selection:** the diagnostic/assessment path picks this grader when `exam_id === 'spoken_english'` (a per-exam grading adapter, chosen by config — not scattered `if`s).
- **Verify:** unit-drive the grader on sample transcripts spanning A1→C1; confirm level→number→profile matches Paul's tables; confirm each guardrail fires.

## Phase 2 — Spoken-English diagnostic flow (backend)
The IELTS diagnostic is 4-skill; Spoken English is a **single speaking viva of 8 prompts**. Make the flow exam-aware.
1. **Serve the viva:** an endpoint that returns the 8 ordered prompts (text + read-aloud, prep/speak seconds, Prompt-6 audio ref) for `spoken_english`.
2. **Submit per prompt:** accept audio, run guardrails, grade via the Phase-1 grader → store per-subskill levels/scores.
3. **Aggregate:** feed the 6 subskill %s (averaged across prompts per subskill) into `cefr_hybrid` → the CEFR result + profile. Stamp provenance.
4. **🔴 Completion logic:** the current `diagnostic_status` view/`checkAndMarkDiagnosed` requires **all 4 skills** scored — a speaking-only exam never completes. Make "diagnosed" **exam-aware**: for `spoken_english`, complete = speaking viva done (respecting the ≥4-no_response withhold rule). (Either an exam-aware view/query or a config-driven completion check reading `overall.components`.)
- **Verify:** a seeded `spoken_english` student completes the viva → gets a CEFR level + 6-subskill profile → is marked diagnosed. IELTS diagnostic completion unchanged.

## Phase 3 — Diagnostic content seeding
1. Seed the **8 prompts** as `spoken_english` diagnostic questions (`exam_id='spoken_english'`), with type/prep/speak metadata and order. One universal set; **schema/seed structured so alternate sets can be added later** without code change (retake integrity, per Paul §5).
2. Store the **Prompt-6 audio asset** and reference it from that prompt.
3. Confirm the `diagnostic_questions` (or viva) table supports: prompt text, read-aloud, prep/speak times, warm-up flag, and an audio asset on one prompt — add fields/convention if missing (additive migration; manual `db push` on VPS per our rule).
- **Verify:** the serve-viva endpoint returns all 8 prompts in order with Prompt-6 audio.

## Phase 4 — Frontend: viva UI + config-driven student shell
1. **Viva runner** (student): 8 prompts, prep timer → speak timer, record-once, submit; Prompt-6 plays the audio message; one retry only when a guardrail fires; progress across 8.
2. **Config-driven student shell** (the exam-agnostic refactor, scoped to what Spoken English needs): read the exam config so the student sees **only Speaking**, **CEFR levels** (not band 4–9), and the 6 subskills with **"Responsiveness"** as the label for `interaction`. Hide L/R/W entirely.
3. **Onboarding + results** tailored: CEFR narrative, per-subskill CEFR profile, the "estimate, not certified" disclaimer on every result.
- **Verify:** a `spoken_english` student sees a correct 1-skill CEFR journey end-to-end; an IELTS student's UI is unchanged.

## Phase 5 — E2E, disclaimer, launch
1. Full journey on dev: register institute → subscribe Spoken English → student takes the viva diagnostic → CEFR level + profile shown, disclaimer present, guardrails behave (silence→retry→withhold).
2. Confirm IELTS regressions clean (shared code paths untouched).
3. Launch with **provisional thresholds + disclaimer**.

---

## Deferred (explicitly not blocking launch)
- Daily drills / internal assessment / mock **content** for Spoken English (diagnostic-first).
- **Calibration** of `cefr_6` thresholds — after ~200 real graded responses.
- **Adaptive follow-ups / live conversation** (v2) — at which point `interaction` reverts to true CEFR Interaction with no data-model change.
- Multi-exam students (a user doing both IELTS + Spoken English) — out of scope; single-exam-per-student holds.

---

## Critical path & ownership
| Phase | Owner | Blocks |
|---|---|---|
| 0 Config | Eng | quick |
| 1 CEFR grader | Eng | **core** — everything scoring depends on it |
| 2 Diagnostic flow | Eng | needs P1 |
| 3 Content seed | Eng + content (prompts done; needs Prompt-6 audio) | needs P2 schema |
| 4 Frontend viva + shell | Eng | needs P2 endpoints |
| 5 E2E + launch | Eng | needs all |

**Recommended order:** P0 → P1 (+ P3 schema/seed in parallel) → P2 → P4 → P5. Start with **P0 + P1** — the grader is the long pole and unblocks everything else.
