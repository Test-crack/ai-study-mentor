# Frontend Developer Plan — Multi-Exam Platform Migration

**Derived from:** TC-03 (Decision Rationale), TC-04 v2 (Platform Architecture), TC-07 (Team Operating Model)
**Scope:** `C:\StudyMentor\frontend` only. Backend/schema work is Backend Engineering's; content is Media Production's.
**Author:** Frontend Engineering · Aug 2026

---

## 0. What the docs actually ask of me

Stripping out everything owned by other functions, my block (TC-07 §"Frontend Engineering") is six items:

| # | Deliverable | Source | Priority |
|---|---|---|---|
| F1 | Close the zero-blocker student journey + 3 named High bugs | TC-07 | **Now** (unblocked) |
| F2 | Extract `packages/ui` from existing shadcn components; IELTS must still build | TC-07, TC-04 §1 | **Now** (unblocked) |
| F3 | **Viva session UI** — record → upload → per-question progress → end-of-session review | TC-07 ▲, TC-04 §4 | **Promoted to top** |
| F4 | **CEFR (A1–C2) score widget** alongside the IELTS Band widget | TC-07 ▲, TC-03 D1 | With F3 |
| F5 | Exam switcher UI, shown only when >1 exam active | TC-04 §3.5, TC-03 §3.1 Q5 | After route contracts |
| F6 | `apps/oet` shell reusing L/R/W phase components | TC-04 §1 | Week 11+ |

**Two things were deleted from my plate — don't build them:**
- **Per-exam domains / Nginx / pm2 per exam.** Reversed in TC-03 §3.1 and TC-04 §9. One domain, exam as a route: `testcrack.com/spoken/…`. The ≥2-week domain lead time dependency is gone.
- **OET Speaking role-play UI.** Deferred (TC-03 §7 Q10). Reserve the `speakingFormat: 'roleplay'` enum value, ship nothing.

**Blocked by (not mine to unblock):** Backend Engineering's exam-prefixed route contracts, `auth-client` extraction (which waits on the custom-JWT migration).

---

## 1. Where the repo is today — the honest gap analysis

I audited the tree before planning. Five findings shape everything below.

### 1.1 There is no monorepo — this is a single Vite app
`C:\StudyMentor\frontend` is one `vite_react_shadcn_ts` app with `src/{core,features,shared,config,integrations}`. TC-04 §1 assumes `testcrack-platform/{packages/*,apps/*}`. So F2 (`packages/ui`) is not "move a folder" — it is **introducing the workspace itself**. That is the single largest structural task and it must land before `apps/spoken` can exist.

Good news: `src/shared/components/ui` already holds **51 shadcn components** and is already imported via the `@/shared/*` alias everywhere. A path-alias-preserving extraction is mechanical, not a rewrite.

### 1.2 There is no central API client — this is the real blocker for exam-prefixed routes
TC-04 §3.3 says every route becomes `/api/{exam}/…`. Right now the base URL is derived **four different ways** across the codebase:

- `src/config/constants.ts:3` — `API_BASE_URL = VITE_API_BASE_URL || '/api'`
- `src/shared/utils` — `getBackendUrl()` (the dominant one)
- `src/core/App.tsx:241` — inline `VITE_BACKEND_URL || 'http://localhost:4000'`
- `src/features/student/components/IeltsWriting.tsx:13` — its own `VITE_API_URL`

…and **~62 files** hand-build path strings like:

```
`${getBackendUrl()}/api/ielts-writing/submit`
`${backendUrl}/api/ielts-reading/speed-reading/submit`
`${backendUrl}/api/ia/questions`
'/api/diagnostic/submit/writing'
```

When Backend Engineering renames routes in their Step 3, **62 files break at once with no compile-time error** — they're template strings. This is the highest-risk item in my workstream and it is why §2 Task A comes first.

### 1.3 `exam_type` does not exist in the frontend yet
The only occurrence is a **local, hardcoded, mock-data type** in `src/features/TestCrackSuperAdmin/dashboard/Questionbankmanager.tsx:13`:

```ts
type ExamType = 'IELTS' | 'GMAT' | 'SPOKEN_ENGLISH' | 'PTE' | 'TOEFL';
```

Note it disagrees with the docs (`SPOKEN`, not `SPOKEN_ENGLISH`; no OET; GMAT/PTE/TOEFL are speculative). This type must be **deleted and replaced** by the one imported from `packages/exam-engine`, or we will ship two competing exam vocabularies.

### 1.4 Band score is assumed to be a number, in ~18 files
`band_score` / `bandScore` appears across student dashboard, diagnosis, mock, report, instructor progress tabs, and `instituteOwnerService`. TC-04 §2 keeps `band_score` as a generic `Decimal` and puts **CEFR levels and OET letter grades in `sub_scores` JSON**. So F4 is not a relabel — every one of those surfaces needs to render through a **formatter chosen by exam**, not by hardcoded `.toFixed(1)`.

### 1.5 The viva UI has more reusable parts than expected
Existing `MediaRecorder` / `getUserMedia` code already lives in:
- `src/features/student/components/SpeakingAssessment.tsx:392` — `MediaRecorder(stream, { mimeType: 'audio/webm;codecs=opus' })`
- `src/features/student/components/MicTest.tsx` — device permission + level check
- `src/features/student/hooks/useSpeechToText.ts`, `useVocalResonance.ts`

There is **no `cloudinary` reference in the frontend** — uploads go through the backend. Confirm with Backend Engineering whether viva audio uses the same backend-mediated path (TC-04 §4.3 says "the existing Cloudinary path", which is server-side). This is a contract question, not a build blocker.

---

## 2. Where to start — the ordered plan

Sequenced against TC-07's dependency map. **Weeks 1–2 work is entirely unblocked; start today.**

### Week 1–2 · Foundation (do not skip to the fun stuff)

#### Task A — Central API client + route registry *(highest leverage, do first)*
Fixes §1.2. Create `src/shared/services/api.ts`:

```ts
// One place that knows how a URL is built. Nothing else builds one.
import { callBackend } from '@/features/auth/services/authClient';

const base = () => import.meta.env.VITE_BACKEND_URL ?? 'http://localhost:4000';

/** exam-scoped: /api/{exam}/... per TC-04 §3.3 */
export const examApi = (exam: ExamType, path: string) =>
  `${base()}/api/${exam.toLowerCase()}${path}`;

/** platform-scoped: /api/... — accounts, profile, admin, payments (TC-04 §2) */
export const platformApi = (path: string) => `${base()}/api${path}`;
```

Then migrate the ~62 call sites. Do it **feature by feature, one PR each** (student → instructor → institute → superadmin), not one giant PR. Add an ESLint `no-restricted-syntax` rule banning literal `'/api/'` in template strings so the old pattern can't come back.

**Why first:** it converts Backend Engineering's Step 3 route rename from a 62-file scramble into a one-file change. Every task after this depends on it.

#### Task B — `ExamType` + score formatting from a single source
1. Delete the local type at `Questionbankmanager.tsx:13`.
2. Add `src/shared/types/exam.ts` as the temporary home (it becomes the `packages/exam-engine` import once the workspace lands):

```ts
export type ExamType = 'IELTS' | 'SPOKEN' | 'OET';

// TC-04 §2 — band_score is generic; non-numeric scales live in sub_scores.
// TC-03 §5.1 — legal display strings live in config, never hand-typed in a component.
export interface ExamUiConfig {
  examType: ExamType;
  legalDisplayName: string;   // "Occupational English Test (OET®)"
  legalDisclaimer: string;
  trademarkOwner: string;
  formatOverall: (raw: number, sub?: Record<string, unknown>) => string;
  scoreLabel: string;         // "Band" | "CEFR Level" | "Grade"
}
```

3. Add `useExamConfig()` reading the active exam from context, and refactor the ~18 `band_score` sites to `config.formatOverall(...)` + `config.scoreLabel`. **Zero visual change for IELTS** — that's the acceptance criterion.

> ⚠️ **TC-03 §5.1 Rule 2 is a hard rule, and it lands in my code.** No developer hand-types "IELTS" or "OET" into a component again. Every user-visible exam name comes from `legalDisplayName`. Grep for hardcoded exam names as part of this task.

#### Task C — Close F1: the journey + the three named High bugs
TC-07 names them explicitly, so treat them as acceptance-tested:
1. **Reading auto-submit** — likely in `ReadingPractice.tsx` / `StudentReadingAssessmentPage.tsx` (both use `setInterval`).
2. **Audio `onError`** — `ListeningPractice.tsx`, `AudioResponseDrill.tsx`; every `<audio>` needs an `onError` path that surfaces a retry, never a silent dead player.
3. **Polling during test** — `setInterval` appears in 14 student components including `FullMockAssessment.tsx`, `ZenAssessmentRunner.tsx`, `Assessment.tsx`. Audit each: polling must pause while a timed assessment is in progress.

Then walk the full loop end to end: diagnostic → drills → content → IA → mock → report.

#### Task D — Agree the viva route contract *in writing*
TC-07's async rule: "here's the new contract, flag within 24h" — never "let's discuss." Post the shape I need for F3 in the shared channel now, so it's settled before week 5:

```
POST   /api/spoken/viva/session            → { sessionId, questions[], maxVivaQuestions }
POST   /api/spoken/viva/answer             → { answerId, audio_url|null, scored_at|null }
GET    /api/spoken/viva/session/:id        → per-question status for progress UI
GET    /api/spoken/viva/session/:id/review → end-of-session sub-skill analysis
```
Explicitly ask: is audio upload multipart-to-backend, or a signed direct upload? (§1.5)

---

### Week 3–4 · The workspace extraction (F2)

Gated on nothing, but do it *after* Task A so the API client moves as one clean unit.

1. Add a workspace root (`pnpm-workspace.yaml` or npm workspaces) with `packages/` and `apps/`.
2. Move current app → `apps/ielts`. **TC-04 §1: "move here, change nothing."**
3. Extract `src/shared/components/ui` (51 components) → `packages/ui`. Keep the `@/shared/components/ui` alias pointing at it initially so no imports change in the same PR.
4. `packages/exam-engine` — **interfaces only, zero dependencies** (TC-04 §1). Move `src/shared/types/exam.ts` here.
5. `packages/auth-client` — wraps `callBackend` + `useAuth`. **Blocked on the custom-JWT migration**; stub the boundary, land the move later.
6. Turborepo pipeline so only changed packages build.

**Gate (TC-07 gate 1, absolute): IELTS CI green.** A red IELTS build is stop-the-line for the whole team, not just me. Nothing merges past this until it's green.

---

### Week 5–6 · Viva UI + CEFR widget (F3, F4) — the revenue path

This *is* the Spoken English product surface. Build `apps/spoken`, reusing from `apps/ielts`.

**Session flow, mapped 1:1 to TC-04 §4:**

| Step | Component | Reuse from |
|---|---|---|
| Serve question | `VivaQuestionCard` | drill card patterns |
| Record & upload | `VivaRecorder` | `SpeakingAssessment.tsx:392`, `MicTest.tsx` |
| Per-question progress | `VivaProgressRail` | new — dots with 4 states |
| End-of-session review | `VivaSessionReview` | `Report` / competency radar |

**The four failure modes are UI requirements, not edge cases (TC-04 §4.5). Build them in from the first commit:**

| Failure | Required UI behaviour |
|---|---|
| Mic/upload fails (`audio_url: null`) | Offer re-record on *that* question. **Never lose prior answers.** |
| Transcription garbled (`scored_at: null`) | Show "pending retry" on that question; **do not block the session.** |
| Session abandoned (`ABANDONED`) | Partial results viewable, clearly marked as **not counting toward the Real Band Score.** |
| Uncapped loop | Respect `maxVivaQuestions` from config; never render past it. |

Because each answer is an independent row, the progress rail must render **per-question state independently** — one failed question shows as failed while the rest stay valid. Don't model the session as a single pass/fail.

> **Don't "improve" the disconnected questions.** TC-04 §4 is explicit: no shared context across questions is a *deliberate design property* that isolates sub-skills. No conversational threading, no "as you mentioned earlier" UI.

**F4 — CEFR widget.** A genuinely different presentation, not a relabel (TC-07 ▲):
- IELTS → numeric band, one decimal, `6.5`
- **SPOKEN → A1/A2/B1/B2/C1/C2 as a 6-step ladder** with the current level marked. Sourced from `sub_scores` JSON per TC-04 §2, formatted via `formatOverall`.
- OET Grade widget later — same interface, third formatter.

**Compliance in the UI (TC-04 §11 / TC-03 §5.4):** viva records people's voices. The consent state and retention notice are backend-modelled, but the **notice and withdrawal affordance are frontend**. Coordinate on where the DPDP notice renders — enrollment, or first viva session. Ask before building; don't guess.

---

### Week 7–8 · Spoken English live · then F5

- **★ Spoken English launch** — first paid module line. My F3/F4 gate it.
- **F5 — exam switcher.** Only now, once route contracts are stable. Institute command centre gets an exam toggle filtering batches, heatmaps, funnels, instructor rankings by `exam_type` (TC-04 §3.5). **Tutor and student dashboards render the picker only when >1 exam is active** — single-exam institutes must see *no new UI at all* (TC-03 §3.1 Q5). Default to "hidden" and make >1 the explicit condition.
- Marketing pages as **routes, not domains**: `/spoken-english`, `/oet-preparation` (TC-04 §9).

### Week 9–10 · Predictive readiness UI
Blocked on Backend Engineering's rule-based v1. A predicted score **plus a confidence band** — the band is not optional decoration.

> ⚠️ **CCPA guard (TC-03 §5.3, TC-07):** predicted-band displays are **internal-facing only** until calibration is proven. Any public-facing surface showing a predicted outcome needs a uniform-font disclaimer with sample size and error band. If a ticket asks me to put a predicted band on a public or marketing page, I stop and flag it rather than shipping it.

### Week 11+ · F6 — OET app shell
`apps/oet` reusing L/R/W phase components. Gated on Exam 3 backend, which is gated on the verification engine → content. **Nursing only, L+R+W, Grade B target** (TC-03 §7). No Speaking surface for OET v1.

---

## 3. Anti-patterns that are specifically mine to avoid

From TC-04 §10, filtered to frontend:

- ❌ **`if (examType === 'IELTS')` inside a shared component.** This is the one that collapses the whole monorepo advantage. Exam differences go into `ExamConfig`, and the component reads config. If I catch myself writing an exam branch in `packages/ui`, the config is missing a field.
- ❌ **A new score field/column for a new scale.** `sub_scores` JSON exists precisely for this.
- ❌ **Hand-typing an exam name in JSX.** Use `legalDisplayName`.
- ❌ **Any CBLA/IELTS logo, colourway or lockup.** Our own visual identity only.
- ❌ **Forking the app per exam.** `apps/*` shells share `packages/ui`; they do not duplicate it.
- ❌ Building `apps/oet` as a separate domain. Withdrawn recommendation.

---

## 4. My first five things this week

Mirroring TC-03 §8.1's structure for my own workstream:

1. **Open the API-client PR** — `src/shared/services/api.ts` with `examApi()` / `platformApi()`, plus the ESLint rule. No call-site migration yet, just the seam.
2. **Post the viva route contract** in the shared channel with the shape written out, 24h flag window (Task D).
3. **Delete the rogue `ExamType`** in `Questionbankmanager.tsx:13`; land `shared/types/exam.ts` with the three legal fields.
4. **Fix the three named High bugs** (reading auto-submit, audio `onError`, polling-during-test) — these are journey blockers and fully unblocked.
5. **Spike the workspace extraction on a branch** — prove `packages/ui` + `apps/ielts` builds green before committing to the migration order.

---

## 5. Open questions I need answered (none block week 1–2)

| Question | Owner | Blocks |
|---|---|---|
| Viva audio upload: multipart-to-backend or signed direct upload? | Backend Engineering | F3 recorder, week 5 |
| Exact `sub_scores` JSON shape for CEFR levels | Backend Engineering | F4 widget, week 5 |
| Where the DPDP notice + withdrawal affordance renders | Backend Engineering / Founder | F3 compliance, week 5 |
| Is `apps/spoken` a new shell or a route group inside `apps/ielts`? | Me + Backend Engineering | Week 3 extraction shape |
| Does the exam switcher persist per-user server-side, or client-only? | Backend Engineering | F5, week 7 |

Per TC-03's closing line: a five-minute flag beats a diverged interface. I'll flag rather than guess.

---

## 6. The number I'm measured on

TC-07: **engineering time to register Exam 3 (OET) vs Exam 2 (Spoken English)**. On the frontend that reduces to a concrete test: when OET arrives, `apps/oet` should be *a shell plus one formatter plus one widget*. If it needs edits inside `packages/ui`, the abstraction leaked in my layer and I fix it before Exam 4.

Corollary worth stating: **Task A and Task B are what make that number good.** A central API client and a config-driven score formatter are the entire difference between "register an exam" and "port an app."
