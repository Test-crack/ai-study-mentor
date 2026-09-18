# Exam Engine — Frontend Parallel Work Plan

**By:** Gokul (Frontend Engineering)
**Date:** 20 August 2026
**Reads with:** `EE-00` (review) · `EE-01` (spec v2) · `EE-02` (vectors v2) · `EE-03` (backend board) · `EE-05` (change brief) · `exam-engine-config.v2.json` · `reference-impl.js`
**Purpose:** answer "do I wait for backend?" with a dependency-mapped, priority-ordered frontend board.

> **Only v2 is live.** `exam-engine-spec-paul.md`, `exam-engine-test-vectors-paul.md` and `exam-engine-config-paul.json` are superseded (`EE-05` §19). Do not build against them — two of their published numbers are arithmetically wrong and one contradicts itself. They are kept in `superseded-v1/` for history only.

---

## 0 · Read this first — resuming work in a new session

**This file is the entry point. Everything it references now lives in the repo beside it**, so no external paths and no hand-copied numbers are needed.

```
docs/exam-engine/
├── FE-00_Frontend_Parallel_Work_Plan.md   ← you are here. The frontend board.
├── EE-01_Exam_Engine_Spec_v2.md           ← THE CONTRACT. §6 = result envelope. Authoritative.
├── EE-02_Test_Vectors_v2.md               ← every expected number. 75 vectors.
├── EE-00_Review_and_Corrections.md        ← why v2 exists. Read for reasoning, not rules.
├── EE-03_Backend_Task_Board_v2.md         ← B1–B24. §1 = the API contract handed to me.
├── EE-04_CEFR_Calibration_Protocol.md     ← §4 = the claims table (FE-07). §3 = viva consent (FE-27).
├── EE-05_Change_Brief_for_Backend.md       ← the change summary. §4 is the one aimed at frontend.
├── exam-engine-config.v2.json             ← the config. All 7 scales, all 5 exams.
├── reference-impl.cjs                     ← executable maths + 40-rule validator.
├── run-vectors.cjs                        ← `node docs/exam-engine/run-vectors.cjs` → 75 pass, 0 fail.
└── superseded-v1/                         ← v1. Do not build against.
```

**Rule for any future session: never restate a number from these files — import or reference it.** `EE-00` §7 exists because v1's numbers were hand-copied and two were wrong. Transcribing the envelope, the CEFR thresholds or the vector tables into a chat or a summary re-creates that failure. Read the source file.

**If a chat has only this file and not the others**, say so before starting — the plan is not a substitute for `EE-01` §6.

### Where things stand

| | Status |
|---|---|
| Repo audit (§3) | **Done, 20 Aug 2026.** Findings are file-and-line accurate as of commit on `feature/new-2-branch`. Re-verify before acting if the branch has moved. |
| Vectors | **Verified running in this repo:** `node docs/exam-engine/run-vectors.cjs` → 75 passed, 0 failed. |
| Code written | **None.** No task on the board is started. |
| Backend | Has the same v2 doc set. D1/D2/D3 unanswered as of this writing. |
| `EE-04` (CEFR calibration protocol) | **Present.** Contrary to a first read, it is *not* backend-only: §4 sets the claims/banned-wording table (feeds FE-07) and §3 makes viva consent wording a launch-critical frontend item (FE-27). §5 confirms the thresholds themselves are a config-only change. |

### Porting note found while verifying

This project is ESM (`"type": "module"` in `package.json`), so the reference implementation **cannot run as `.js`** here — Node treats it as an ES module and `require` throws. Both files were renamed to `.cjs` and the internal require updated. Nothing else changed; the maths is untouched and all 75 vectors pass. **Worth telling the backend dev** — if his project is also ESM he will hit the identical error, and it looks like a broken reference impl rather than a module-system mismatch.

---

## 1 · The answer: don't wait, and don't stay only on superadmin

**Parallel work is available, and the docs practically hand over the seam.**

| Why waiting is wrong | Evidence |
|---|---|
| The contract is already frozen **in writing** | `EE-01` §6 gives the exact result envelope. `EE-03` §1 gives the exact routes and auth split. `EE-02` gives every expected number. |
| The maths is **runnable locally, today** | `reference-impl.js` is executable Node. I can generate real fixture payloads from it — provably correct shapes, not invented ones. |
| Backend weeks 1–3 need **nothing from me** | `EE-03` §3: everything through week 3 is *"unit-testable against `run-vectors.js` with no frontend and no live API."* |
| The biggest frontend items touch **no backend at all** | `EE-03` §6 sizes three missing renderers as frontend work, explicitly outside the backend estimate. |
| `EE-05` §4 **asks me directly** for work | *"Please add a frontend test for `overall: null`."* We have no test runner at all today — see §3.4. |

**And staying only on superadmin is also wrong**, because superadmin is where two of the worst config violations currently live (§3.1, §3.2). The exam-engine work and the superadmin work overlap — they are not competing tracks.

**Recommended split:** superadmin stays the primary commitment; the P0 block below runs alongside it, because P0 *is partly superadmin work*.

---

## 2 · Dependency map — where I am genuinely blocked

```
Backend (EE-03)                        Frontend (this doc)
─────────────────────────────────────  ────────────────────────────────────────
D1/D2/D3 decisions ──────────────────► only D3 gates me (overall nullable)
B1  config loader + table                     │
B2  validator                                 │  P0: build against the frozen
B3  strategy interface                        │      contract + local fixtures
B4  RawScore boundary                         │      generated from reference-impl.js
B5  band_mean          ─────────────┐         │
B6  cefr_hybrid                     │         ▼
B7  per_component path              ├──► P1: full result / progression UI
B8  envelope builder                │        against mocks. Swap mocks for the
B9  provenance                      │        real endpoint at the very end.
B10–B15 progression   ──────────────┘
B16–B19 attempts/unlock ────────────────► P3: unlock + entitlement UI (blocked)
B20 viva session      ─────────────────► P3: viva runner wiring (blocked)
B21 delivery wiring
B23 variant scoping   ─────────────────► P1 variant selector needs only config
B24 remediation resolver ──────────────► P1 remediation surface needs only shape
                                       P2: 3 new renderers — never blocked
```

**Only one backend decision gates me: D3 — is `overall` nullable.** The recommendation is an unambiguous yes and `EE-05` §16 calls it *"the most expensive item to retrofit"*, so I plan as if it is yes regardless of when he answers. If he somehow says no, FE-09 is the only wasted task.

**Genuinely blocked on backend:** real endpoint wiring, viva session state, unlock-rule UI, provenance display. That is 4 tasks out of 26.

---

## 3 · What is already wrong in this repo (audited, with locations)

This is the part that makes the plan a work plan rather than a restatement of the spec.

### 3.1 Exam identity is hardcoded twice, and both copies are wrong

`src/shared/constants/examTypes.ts` — the file's own comment claims it is *"the ONE place the frontend defines exam identity"*:

- `EXAM_TYPES = ['IELTS','SPOKEN','OET','GRE','TOEFL','PTE']` — **GMAT is missing.** Config v2 ships GMAT. Same gap as the Prisma enum (`EE-00` §4.1).
- `EXAM_LABELS` hardcodes `OET: 'OET'` and `GRE: 'GRE'`. **Config v2 sets those display names to "Healthcare English Preparation" and "Graduate Admissions Test Preparation"** precisely because the marks are restricted (`EE-05` §13). Shipping `OET` as a label is the exact legal exposure the config was rewritten to avoid.
- `EXAM_AVAILABILITY` hardcodes live/soon. Config v2 has `status: live | reserved`.
- Every label here is a DoD violation: `EE-01` §10 says grep for `IELTS` — hits in `src/` outside the config loader mean the abstraction leaked.

`src/features/TestCrackSuperAdmin/dashboard/Questionbankmanager.tsx:13` — a **second, conflicting** union: `'IELTS' | 'GMAT' | 'SPOKEN_ENGLISH' | 'PTE' | 'TOEFL'`. It has GMAT (which the shared one lacks), uses `SPOKEN_ENGLISH` (shared says `SPOKEN`, config says `spoken_english`, short code says `SPK-EN` — `EE-00` §4.1 flags exactly this name drift), and omits OET and GRE entirely.

### 3.2 `EXAM_SKILLS` is the components model violated, inside superadmin

`Questionbankmanager.tsx:46`:

```ts
const EXAM_SKILLS: Record<ExamType, Skill[]> = {
  IELTS:          ['LISTENING','READING','WRITING','SPEAKING'],
  GMAT:           ['VERBAL','QUANTITATIVE','INTEGRATED'],
  SPOKEN_ENGLISH: ['SPEAKING','LISTENING'],
  ...
};
```

A hardcoded per-exam component list — the exact thing `EE-05` §3 replaced with config-declared `components`. It is also factually wrong: GMAT Focus is Quant / Verbal / **Data Insights**, and `SPOKEN_ENGLISH: ['SPEAKING','LISTENING']` drops Reading and Writing, which config v2 keeps as `assessed: false` practice surfaces. `TRAP_TYPES_IELTS` / `TRAP_TYPES_GMAT` beside it are the same pattern.

**This file is in the section I am working on right now.** That is the bridge between the two tracks.

### 3.3 `bandScale.ts` hardcodes the IELTS scale platform-wide

`src/shared/utils/bandScale.ts`: `BAND_MIN = 4.0`, `BAND_MAX = 9.0`, `bandToLevel()` with literal `5.5` / `7.0` cutoffs, `BAND_OPTIONS` built on a literal `0.5` step. The file comment instructs: *"use these for every band display."*

Under config v2 there are **seven** scales (`ielts_band`, `cefr_6`, `oet_500`, `gre_section`, `gre_analytical_writing`, `gmat_section`, `gmat_total`). An OET 0–500 or GRE 130–170 score rendered through `bandFillPct()` is silently wrong — `bandFillPct(350)` clamps to 100%.

**Constraint from `EE-05` §1:** IELTS behaviour must stay byte-for-byte identical. So this is a *widening*, not a rewrite — keep the IELTS numbers exactly, source them from the scale object.

### 3.4 There is no test runner in this project

`package.json` has no vitest, no jest, no testing-library. Zero test files anywhere.

`EE-05` §4 asks for a frontend test for `overall: null`, and `EE-02` §7 repeats it — *"the case most likely to throw a null-dereference in production."* That cannot be delivered without standing up the runner first, which makes **FE-01 the true first task**, and it is 100% backend-independent.

### 3.5 Result types are skill-shaped, and `overall` is effectively non-nullable

- `src/features/instructor/components/student-progress/types.ts` — `SectionScore.skill`, `MockSkillScore`, `CompetencyRow.skill`, and `MockSession.real_band_score: number | null`. That null means "not yet scored", **not** "this exam has no headline" — two different facts sharing one field, which is precisely the `progression.current` mistake `EE-05` §5 diagnosed.
- `src/features/student/components/StudentDashboardPage.tsx:25` — `skill: "Listening" | "Reading" | "Writing" | "Speaking"` as a literal union, with a hardcoded four-row array below it.
- `src/features/student/utils/useTodaySkill.ts` and `passportUtils.ts` — same shape.

### 3.6 `momentum` already means something else here — naming collision

We already ship a `momentum` concept: `MomentumProvider` in `src/core/App.tsx`, `momentum_awarded` on IA and mock sessions, `b2c_momentum` in sessionStorage seeded at `920`. That is a **gamification points score**.

`EE-01` §5.1's `progression.momentum` is a **progress-toward-next-rung bar**. Two unrelated meanings, one word, same app. Importing the spec's name as-is guarantees every future reader conflates them. Flagged as FE-11 — needs a decision *before* FE-10 lands, not after.

### 3.7 Zero legal strings exist in the frontend

`grep -rni "disclaimer|trademark|not affiliated"` over `src/` → **no matches.** `EE-01` §9 requires `disclaimer_full` at onboarding per exam, `disclaimer_short` in the footer, and `banned_terms_near_output` enforced **in the UI**. Entirely greenfield and entirely backend-independent — the strings arrive on the unauthenticated `/api/exams/public` route, which I can mock from the config file today.

### 3.8 One doc claim does not hold for this repo

`EE-00` §5.1 and `EE-03` §6 both state OET roleplay is *"reserved as an enum value in the frontend."* There is **no `SpeakingFormat` enum in this codebase** — `grep -rni "SpeakingFormat|roleplay"` returns nothing. FE-22 is therefore slightly larger than sized: the enum has to be introduced, not just implemented. Worth telling the senior so the estimate isn't quietly wrong.

---

## 4 · Task board

**Tags:** 🟢 `NO-BACKEND` = needs nothing from anyone · 🟡 `MOCK-ONLY` = needs the frozen contract + local fixtures, no live API · 🔴 `BLOCKED` = genuinely needs backend running.
Sizes are rough working days, solo.

### P0 — start today. Zero backend dependency, unblocks everything else.

| # | Task | Tag | Size | Why first |
|---|---|---|---|---|
| **FE-01** | Stand up Vitest + React Testing Library. One smoke test. | 🟢 | 0.5 | Nothing can be asserted without it. Blocks FE-09's required null-`overall` test. §3.4 |
| **FE-02** | Wire `docs/exam-engine/reference-impl.cjs` into the test setup (already vendored and verified — 75/75). Add `npm run vectors` → `node docs/exam-engine/run-vectors.cjs`, put it in CI. Write a fixture generator emitting `EE-01` §6 envelopes for: IELTS aggregate, Spoken English CEFR, OET per-component (`overall: null`), at-cap, and clamped-floor. | 🟢 | 1.5 | Gives **provably correct** payloads to build every UI against. Highest-leverage task on the board. Note the `.cjs` extension — see §0. |
| **FE-03** | Contract types from `EE-01` §2 + §6: `PublicExamConfig`, `Component`, `Scale`, `ResultEnvelope` (**`overall: Overall \| null`**), `Progression` (`headline` + `momentum`), `RawScore`. Mirror the spec; invent nothing. | 🟢 | 1 | Every later task imports these. Making `overall` nullable here propagates null-safety for free. |
| **FE-04** | Collapse exam identity to one config-driven source. Delete the `Questionbankmanager.tsx` union and `EXAM_SKILLS`; drive both from config. Add GMAT. Fix OET/GRE display names to the config's. | 🟢 | 1.5 | §3.1, §3.2. **This is superadmin work** — the overlap. Also removes the OET naming legal risk. |
| **FE-05** | Widen `bandScale.ts` → `scaleUtils.ts` taking a `Scale` object. **IELTS output must be identical** — assert with FE-02 vectors. Keep a thin `bandScale` re-export so nothing breaks in one commit. | 🟢 | 1.5 | §3.3. `EE-05` §1: byte-for-byte IELTS is the correctness bar. |
| **FE-06** | `useExamConfig()` hook + service against `GET /api/exams/public` and `GET /api/exams`, with a `VITE_EXAM_CONFIG_MOCK` flag serving a `toPublicConfig()`-projected fixture (`_`-keys, `thresholds_min_pct` and strategy params stripped — `EE-03` §1). | 🟢 | 1 | The seam. After this every UI below is real code and go-live is one flag flip. |
| **FE-07** | Legal layer: `disclaimer_full` once per exam at onboarding, `disclaimer_short` in footer, all from config. Plus a `banned_terms_near_output` dev-time guard so "certified"/"certificate" can never render near CEFR output. **Take the full claims table from `EE-04` §4, not just the config list** — it adds "official CEFR level", "recognised by the Council of Europe", and any implication of immigration or admissions eligibility, plus the required positive framing *"for guidance and placement; not a substitute for an accredited certificate."* | 🟢 | 1.5 | §3.7. Greenfield, zero dependency, and the one item with real legal exposure. |

**P0 ≈ 8 days, all 🟢.** Nothing here can be invalidated by a backend decision.

### P1 — the real UI. Mock-only; swap to live at the end.

| # | Task | Tag | Size | Notes |
|---|---|---|---|---|
| **FE-08** | Migrate result types skill-shaped → component-shaped across instructor `types.ts` and the student dashboard. | 🟡 | 2 | §3.5 |
| **FE-09** | **Nullable `overall` + per-component report layout**, plus the regression test `EE-05` §4 explicitly asks for. | 🟡 | 2.5 | Highest-risk item in the set. Doubles as the OET regulator-target layout, so not throwaway (`EE-00` §2.2). |
| **FE-10** | Progression UI: `headline` (read from `overall`) vs `momentum`. Momentum bar on the rounding-interval model, **with a real at-cap state — `null`, never a full bar** (`EE-02` §5a). | 🟡 | 2 | Fixes the v1 UX bug: "Band 6.0 — 80% of the way to 6.0". |
| **FE-11** | Resolve the `momentum` naming collision before FE-10 merges. | 🟢 | 0.5 | §3.6. Cheap now, confusing forever if skipped. |
| **FE-12** | "Challenge Baseline" disclosure + improvement-since-baseline, computed on `value_raw`. | 🟡 | 1 | `EE-05` §15a — the clamp must not eat the signal. |
| **FE-13** | Trend chip (up/flat/down), first-versus-last, **filtered to one instrument type**. | 🟡 | 0.5 | `EE-01` §5.5 |
| **FE-14** | Per-component target picker + OET regulator presets (GMC / NMC / Ahpra). Retire the single "target band" input for non-aggregate exams. | 🟡 | 2 | Today's picker is IELTS-shaped (`BAND_OPTIONS`). |
| **FE-15** | Variant selector (IELTS Academic/GT; OET profession) + variant-scoped content display. | 🟡 | 1.5 | Config-only on my side; backend B23 is separate. |
| **FE-16** | `provisional: true` badge on CEFR output while thresholds are `PROVISIONAL_UNCALIBRATED`. | 🟡 | 0.5 | `EE-01` §4.1. Small, and stops "provisional" quietly becoming permanent. |
| **FE-17** | CEFR profile view — all 6 subskills **always rendered**, with within-level progress. | 🟡 | 1.5 | `EE-01` §4.3 calls this a product commitment, not an implementation note. |
| **FE-18** | Remediation surface at component / subskill / item_tag. **Copy must read "suggested practice", never "your weakness is X"** (`EE-05` §11.2). | 🟡 | 2 | Renders empty until the content library exists — build the empty state deliberately. |
| **FE-19** | Field-naming migration: `name` = what a thing is called, `display` = the rendered value. | 🟡 | 1 | `EE-01` §6 |
| **FE-27** | **Viva consent + retention capture** in the recording flow, worded so sat vivas are usable as calibration benchmark material. | 🟢 | 1 | `EE-04` §3: *"Get the consent wording right at launch and Stage 3 starts with a corpus instead of a recruitment problem. Getting it wrong means re-collecting."* See note below — this is the one item on the board with a hard deadline. |

**P1 ≈ 18 days.**

> **FE-27 is the only genuinely time-critical item here, and it is easy to miss.** Every other task can be done late at ordinary cost. This one cannot: `EE-04` Stage 3 needs 60–90 benchmarked performances, Stage 5 needs 200–300 double-rated ones, and the cheap way to get them is the vivas students sit anyway. If the consent and retention wording is not in place *before* Spoken English ships, that corpus is unusable and the study starts with a recruitment problem instead — on a 9–11 week protocol. The wording itself is a counsel/senior question; the UI is mine. **Raise it before Spoken English launch, not during.**
>
> Also from `EE-04` Stage 1: familiarisation is *"minimum three hours per participant, and everyone who touches scoring does it, engineers included."* That includes me. Budget it rather than discover it.

### P2 — the three missing renderers. Never blocked, and the real cost.

| # | Task | Tag | Size | Notes |
|---|---|---|---|---|
| **FE-20** | Quantitative item renderer — maths notation, figures, quantitative-comparison layout, on-screen calculator. | 🟢 | 8–12 | Built once, serves GRE Quant **and** GMAT Quant. |
| **FE-21** | Data Insights renderer — sortable tables, multi-source tabbed panels, chart interpretation, two-part answer grids. | 🟢 | 12–18 | `EE-03` §6: *"the most expensive item in the config."* Five interaction patterns, no analogue in the platform. |
| **FE-22** | OET Speaking roleplay UI — **including introducing the `SpeakingFormat` enum**, which does not exist here (§3.8). | 🟢 | 6–10 | Gated on OET counsel (`BLOCKED_ON_COUNSEL`) — do not start before that answer lands. |

> `EE-05` §17: *"the engine stops being the bottleneck and item rendering becomes it."* P2 is 26–40 days of frontend work with zero backend dependency. It is the strongest single argument against waiting.

### P3 — genuinely blocked on backend

| # | Task | Blocked by |
|---|---|---|
| **FE-23** | Swap mocks for live endpoints; contract-diff the real payload against the FE-02 fixtures. | B1, B8 |
| **FE-24** | Viva session runner wiring — min/max questions, per-question independent state, the four failure modes. | B20 |
| **FE-25** | Full-mock unlock + entitlement UI (`completed >= min(6, scheduled_in_window)`). | B17, B18 |
| **FE-26** | Provenance display / cross-version comparison labelling. | B9 |

---

## 5 · Suggested sequence

| When | Focus |
|---|---|
| **Week 1** | FE-01 → FE-02 → FE-03, then FE-04 (which is superadmin work). Backend is on D1/D2/D3 + B1–B4 — no contact needed. |
| **Week 2** | FE-05, FE-06, FE-07, FE-11. By end of week 2 the whole contract layer exists and is fixture-tested. |
| **Week 3** | FE-09 first (highest risk, and B7 lands the same week so we can compare notes), then FE-08, FE-10. |
| **Week 4** | FE-12 → FE-19 as capacity allows. |
| **Week 5+** | FE-20 starts. FE-23 as soon as B8 is deployable. |

**Start immediately regardless of anything else:** FE-01 and FE-02. They are the frontend equivalent of B22 — no dependencies, and they block work downstream.

---

## 6 · How this sits with the superadmin track

Not competing. **FE-04 is superadmin work**: `Questionbankmanager.tsx` is where both hardcoded exam lists and `EXAM_SKILLS` live, and it is the file already open in front of me. Doing it as an exam-engine task and as superadmin cleanup is the same edit.

FE-06 and FE-07 also land partly in superadmin surfaces — an institute's offered exams and their display names should come from the same config-driven source, which is exactly what `superadmin_institute_plan.md` already asserts (*"exam is data, not code"*).

So: superadmin stays the primary commitment, and P0 runs as the parallel track, because P0 partly *is* superadmin.

---

## 7 · What I need answered (non-blocking — I proceed on the stated assumption)

| # | Question | To | My assumption if unanswered |
|---|---|---|---|
| 1 | **D3 — is `overall` nullable from day one?** | Backend | **Yes.** The only decision that gates me; the recommendation is unambiguous. |
| 2 | Confirm `toPublicConfig()` strips `thresholds_min_pct`, so the frontend can never compute a CEFR level client-side. | Backend | Yes — I treat all scores as server-given and never map percent→level in the UI. |
| 3 | The four-way name drift (`SPOKEN` / `spoken_english` / `SPK-EN` / `SPOKEN_ENGLISH`) — which string is canonical on the wire? | Backend | Config's `exam_id` (`spoken_english`) is canonical; `prisma_enum` is internal only. |
| 4 | The `momentum` naming collision with the existing gamification score (§3.6). | Senior | I rename the new one `rungProgress` in the UI layer and keep `momentum` on the wire. |
| 5 | OET counsel outcome — currently `BLOCKED_ON_COUNSEL`. | Senior | Do **not** start FE-22, and do not ship "OET" as a display label anywhere. |
| 6 | **Viva consent + retention wording** — needed before Spoken English ships, or the calibration corpus is unusable (FE-27). | Senior / counsel | I build the capture UI with placeholder copy and hard-block launch on the real wording. |

---

## 8 · Frontend definition of done

- `grep -rn "IELTS\|OET\|6\.5\|4\.0\|41\.25" src/` returns no hits outside the config layer and the fixture files.
- One exam identity source, config-driven. No literal exam union anywhere in `src/features/`.
- An exam with `overall.mode: "per_component"` renders a **complete, non-crashing** report — with a test proving it.
- `progression.headline` is only ever read from `overall`; the UI never recomputes it.
- The momentum bar renders a distinct at-cap state; `progress_to_next: null` never renders as a full bar.
- No banned term can render adjacent to CEFR output — enforced in code, not caught in review.
- IELTS band rendering is byte-for-byte unchanged from today, asserted by vectors.
- `npm run vectors` green in CI.
