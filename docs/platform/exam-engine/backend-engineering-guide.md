# TC-05 · Backend Engineering Guide
**Part II · Build** · Document 5 of 8 · **TestCrack Operating Handbook v1.0**
**Read alongside:** TC-04 §3–§4 for interface shapes, and TC-03 for the decisions and their reasoning
**Audience:** Backend Engineering

> **Build sequence and interfaces**, written so the backend can proceed without escalating mid-task. This is guidance and ordering, not new decisions.
>
> **What this version changed:** Exam 2 is Spoken English (CEFR), not OET. Three additions to Step 1 — billing hooks, DPDP fields, legal fields. Step 5 registers SPOKEN; OET becomes Step 6 behind a content gate. The TC-02 blocker is lifted.
>
> These are recommendations. If a better path is visible, flag it — but do not silently diverge, because Frontend Engineering and Platform Services build against these interfaces.

---

## The mission in one line

Make a new exam **data, not code**. When that is done, adding Spoken English, OET, GRE or TOEFL should mean *registering a config and seeding content* — not editing controllers.

**And the measurable version of that:** if registering Exam 3 costs materially more engineering time than Exam 2 did, the abstraction leaked. That comparison is the honest verdict on this entire workstream, and it must be reported explicitly.

---

## Build order

### Step 1 — Land the schema migrations first (they unblock everyone)

Order matters:

1. `enum ExamType { IELTS SPOKEN OET GRE TOEFL PTE }` — nothing else compiles without it. **▲ SPOKEN is position 2 now.**
2. Rename `IeltsSkillType → SkillType` and `IeltsSubSkillType → SubSkillType` — one migration + one codebase-wide find-replace, in a **single PR** so the rename is atomic.
3. Add `exam_type ExamType @default(IELTS)` to: `diagnostic_questions`, `AssessmentHistory`, `StudentCompetencyMatrix`, `DrillQuestion`, `IAQuestion`, `MockQuestion`, `institute_students`. The default preserves every existing IELTS row.
4. Rename `ielts_batches → batches` (+ `exam_type`), `ielts_batch_students → batch_students`, `ielts_batch_instructors → batch_instructors`.
5. Create `institute_exam_subscriptions` — **▲ with the commercial fields** (`plan_tier`, `seat_cap`, `billing_status`, `trial_ends_at`). TC-04 §2.

   **Don't skip `trial_ends_at`.** Our GTM is a free 30-day pilot before any paid conversation, and that trial is now *per exam* — an institute can pay for IELTS while trialling Spoken English. Without the field that state is unrepresentable and someone will hardcode it.

6. **▲ DPDP fields** (TC-04 §9): `date_of_birth` / `is_minor` on the student record, a `guardian_consent` table, and `retention_until` on `viva_answer` with a scheduled purge. Institute students include under-18s, and we are storing voice recordings. Three columns now beats a compliance retrofit on live student data.

All additive except the two deliberate renames. Run against staging first; verify IELTS reads/writes unchanged before touching prod.

### Step 2 — Build the exam registry as pure interfaces (`packages/exam-engine`)

`ExamConfig` and `ScoringStrategy` are TypeScript interfaces only — **no exam logic in the package**. Shapes in TC-04 §3.1–3.2. Keep it dependency-free so any app or the backend can import it.

**▲ Include the three legal fields:** `legalDisplayName`, `legalDisclaimer`, `trademarkOwner`. These exist so no developer ever hand-types an exam name into a component — it makes a whole class of trademark mistake unavailable to the codebase. Three fields, permanently cheap. Rationale in TC-03 §5.1.

### Step 3 — Extract the IELTS logic behind the interfaces (don't change behaviour)

- `bandScale.ts → scoringUtils.ts`; keep `fractionToBand()` untouched, add the IELTS `ScoringStrategy` wrapper around it.
- Abstract the Gemini call in `ieltsWritingService` / `ieltsSpeakingService`: move IELTS descriptors into `exams/ielts/prompts.ts`; the service takes criteria as a parameter. Spoken English later passes `exams/spoken/prompts.ts` through the same call.
- `diagnosticController`: read `exam_type` from the request, resolve `EXAM_REGISTRY[examType]`, route to that strategy.

### Step 4 — Prove the abstraction on IELTS BEFORE registering anything

Route IELTS entirely through `EXAM_REGISTRY.IELTS`. If IELTS still passes CI green through the config path, the abstraction holds. **This is the single most important de-risking step — do not skip it to save time.**

### Step 5 — ▲ Register SPOKEN as the second strategy (CEFR)

**This is the step that actually tests the design**, and it's why the CEFR decision matters more than it looks:

| Exam | `formatSkillScore` | `overall()` |
|---|---|---|
| IELTS | `fractionToBand()` → "6.5" | mean of 4 skills, rounded to 0.5 |
| **SPOKEN** | `fractionToCEFR()` → "B2" | **banded threshold** over sub-skill means |
| OET | `fractionToOETScore()` + `numericToOETGrade()` | **weakest** skill grade |

Mean-rounding, threshold-banding and weakest-of are three structurally different operations. Registering an Exam 2 that reused IELTS banding would have proven only that the code path still runs. CEFR proves the interface actually generalises.

Spoken English also needs **no new content** — it reuses existing Speaking question data and sub-skill descriptors, delivered through the Viva engine. `skills: [SPEAKING]`, `speakingFormat: 'viva'`.

**Report explicitly at the end of this step:** did CEFR threshold-banding fit `overall()` without a special case? If it needed one, fix the interface here. Fixing it at Exam 3 costs three times as much.

### Step 6 — Register OET third, behind the content gate

Only once Platform Services' verification engine has shipped and the content pipeline (TC-03 §6.1) has produced a validated bank. Nursing-only, L+R+W, `speakingFormat: 'roleplay'` reserved but unused.

---

## Route convention

Exam-prefix everything: `/api/ielts/diagnostic/…`, `/api/spoken/viva/…`, `/api/oet/writing/submit`. Rename existing IELTS-named routes as part of Step 3 so nothing is exam-anonymous.

---

## Hard rules (these protect the whole team)

1. **Zero IELTS regression is the gate.** No new exam registers until CI is green on IELTS post-migration. Treat a red IELTS build as stop-the-line.
2. **No `if (examType === 'X')` in shared code.** Exam behaviour lives in the config/strategy. Shared services accept parameters; they never know which exam they're serving. The moment a branch appears in a shared file, the abstraction is leaking — push it into the exam module.
3. **`band_score` stays a generic `Decimal`.** It holds `6.5` (IELTS) or `350` (OET numeric). Non-numeric representations — OET's letter grade, CEFR's level — go in the existing `sub_scores` JSON. **Never add a score column for a new exam's scale.**
4. **Additive migrations only** (besides the two deliberate renames). Every new exam column defaults to `IELTS`.
5. **▲ Deactivation is a read-access change, never a delete.** When `billing_status → CANCELLED`, the student keeps their competency matrix, history and predictions. That history is why they stay with us if they move institutes. No cascades.
6. **▲ Access restrictions live in one named function.** Cross-institute enrollment is schema-permissive and RBAC-restricted for v1 (TC-03 §4.2). Write the guard as a single `canAccessEnrollment(user, enrollment)` — when we lift the restriction, only one function should change, not scattered checks.

---

## The backend surface for the new features

### Viva / Conversation-Analysis Engine (TC-04 §4)

**▲ This moved onto the revenue path.** It is no longer a standout feature waiting for a slot — it is the delivery vehicle for Spoken English, so it now runs alongside Step 5 rather than after it.

It is orchestration over parts that already exist:

- New tables `viva_session`, `viva_answer` (TC-04 §4.2, including `retention_until`).
- Reuse the existing question bank (now `exam_type`-tagged), existing Cloudinary upload, and the abstracted Gemini call.
- Per question: serve → receive audio → transcribe → evaluate against `ExamConfig` sub-skill descriptors → persist → advance. Questions are **independent rows**, so a failure on one never loses the others.
- Aggregate per-sub-skill means into `StudentCompetencyMatrix` so viva results appear on the radar and drive drill targeting with no special-casing — including for Spoken English, whose CEFR level is a *presentation* of the same underlying sub-skill numbers.
- **Gemini audio-in** (one call transcribes + grades). Decided — TC-03 §7.

**▲ Cost design — the one optimisation worth doing up front.** ≈$0.004 per question, ≈₹3.5 per 10-question session. At that price, cost is not a business constraint; don't over-engineer for it. But **cache the rubric prompt** — cached input is ~10× cheaper and the descriptors are identical across every session for a given exam. Nearly free to implement. And **log token usage per call from day one**: when we sell the Speaking Evaluation API, that data sets the price.

Still cap questions per session via `ExamConfig.maxVivaQuestions` — not for cost, but because an uncapped loop is an uncapped failure surface.

### Predictive Readiness (TC-04 §5)

v1 is rule-based/regression over data you already store — competency trajectory, drill trend, IA/mock history, Momentum. One new table `readiness_prediction` with a `predicted_at` timestamp (that timestamp *is* the calibration proof). No ML infra for v1.

**▲ Build it; hold the public claim.** India's CCPA Coaching Guidelines 2024 make an unsubstantiated public success-metric claim a regulatory matter, not just a reputational one. Internal calibration first. TC-03 §5.3.

---

## Interfaces with Platform Services (so the two workstreams don't collide)

- Platform Services is building the **exam verification engine** — 3 difficulty levels, edge-case tuning (obvious distractors made relevantly hard). Output: a validated question bank with difficulty metadata.
- **▲ The engine is now on the critical path** — it gates OET content sourcing. Your Step 6 depends on his output.
- **Contract:** agree the question schema (`exam_type`, `skill`, `difficulty`, distractor metadata) in **week 1**. **▲ Corrected by TC-06 §1.2:** `level` (A/B/C) is **nullable and drills-only** — it is being retired from diagnostic selection by the difficulty-disconnect initiative. `difficulty` is universal and becomes *more* important, not less: with a single untiered pool, every item has to discriminate because every student sees it. It's the seam between the two workstreams — and per TC-03 §6.3 the difficulty metadata is now a **licensable commercial asset**, so the schema needs to be clean enough to publish externally, not just internally convenient.
- Platform Services works on isolated dev/infra, so his feature work never touches the production path. **Backend consumes the output (questions), never the runtime** — and the licensing product must never have a read path back to the platform DB.

---
s
## Testing & CI

- IELTS regression suite green before every new-exam merge (rule #1).
- A small **contract test per `ScoringStrategy`**: given `(correct, total)`, assert the formatted score. Cheap, and it catches CEFR threshold bugs and OET grade-boundary bugs early.
- One end-to-end smoke test running a full IELTS journey through the config path — the Step 4 proof, kept permanently as a guard.
- **▲ Add the same smoke test for SPOKEN once registered.** Two exams green through one config path is the actual evidence.

---

## First 5 things to do this week

1. Open the enum + rename migration PR (Step 1.1–1.2), run on staging.
2. Stand up `packages/exam-engine` with the two interfaces **plus the three legal fields**.
3. Wrap IELTS scoring in a `ScoringStrategy` (no behaviour change).
4. **Agree the question-bank schema with Platform Services** — now doubly important, since the difficulty metadata is a commercial asset.
5. Write the IELTS-through-registry smoke test — the Step 4 proof.

If any of these fights the current codebase in a way this doc didn't anticipate, raise it — better a five-minute flag than a diverged interface.

---

**TestCrack Operating Handbook · v1.0 · August 2026** · TC-05
