# TestCrack — Technical Architecture & Work Summary

> Evidence-based technical brief compiled from a deep inspection of both repositories
> (`ai-study-mentor` frontend, `backend-study-mentor` backend). Everything here is grounded in
> actual repo contents; observations are separated from assumptions, and honest caveats are
> flagged. Intended as raw material for a public write-up — no secrets, credentials, or PII.

_Generated: 2026-09-01._

---

## 1. Product Architecture

**What it is (observed):** TestCrack is a **multi-tenant, exam-prep SaaS** with a B2B2C shape —
institutes own the tenant; owners/admins/instructors manage batches and students; students get a
guided prep workspace. There's also a separate B2C consumer track (`/b2c/*`) with gamified
vocabulary games.

**Major modules (from routes + controllers):**
- **Student journey:** diagnostic → roadmap → daily drills → LexiGrid (vocab game) → Internal
  Assessment (IA) → full mock → reports/history, plus courses.
- **Institute admin/owner/instructor dashboards:** onboarding, batch CRUD, cohort analytics,
  at-risk views, progress.
- **SuperAdmin:** institutes, subscriptions, pricing config, **exam-config explorer**, platform
  analytics.

**Exams represented (observed):** **IELTS** (default, 4 skills L/R/W/S, 0–9 band) and
**Spoken English / CEFR** (`spoken_english`, 1 skill "Speaking" with 6 subskills, CEFR levels). The
exam engine config also *reserves* ids for `oet`, `gre`, `gmat` (status `reserved`), but only IELTS
and Spoken English are implemented.

**Exam-agnostic architecture (the core design, observed):**
- Backend: exam identity is a **string-keyed `Exam` registry** + a **versioned `ExamConfig` JSON**
  (`exam-engine-config.v2.json`), validated on boot and cached in memory. "Registering a new exam is
  a data row, not a migration" (schema comment). `exam_id` columns are threaded across ~12 domain
  tables, defaulting to `"ielts"`, **validated at the app layer, not FK-constrained**.
- Frontend: three coordinated mechanisms — (a) exam detection (`profile.examId` +
  `isSpokenEnglish()`), (b) a config map `EXAM_DISPLAY` (`examDisplay.ts`) driving
  scale/headline/skills/tiles/disclaimer, (c) **route-level dispatch components**
  (`StudentDashboardDispatch`, `InternalAssessmentDispatch`, `DiagnosisDispatch`) that branch once
  and render the exam-specific page while **leaving IELTS pages byte-untouched**.

**Configurable vs hardcoded (honest split):**
- *Config-driven:* score scale (band vs CEFR), headline label, which skills/tiles show, the
  disclaimer, the diagnostic shape (via `profile.vivaDiagnostic`), viva prompt sets + rubric
  (server-supplied), drill-subskill wiring.
- *Still branches on `if (isSpokenEnglish)`:* which page tree renders (the dispatchers), the
  drill-lock skip, and CEFR-vs-band data reshaping in `DrillScreen.tsx`. So *presentation config* is
  data-driven; *component selection* and *data-shape adaptation* are still explicit branches.

---

## 2. Backend Architecture

- **Runtime/framework:** Node + **Express 5** (`^5.1.0`), **TypeScript 5.9**, **Prisma 5.22** over
  **PostgreSQL**. Single process — **no clustering/PM2** in repo.
- **Bootstrap** (`src/index.ts`): `express.json({limit:'50mb'})` (base64 audio), dynamic CORS
  allowlist with custom `X-Exam-Id` header, static `/ia` audio mount (7-day immutable), a verbose
  console request logger. Boot is **fail-loud**: invalid exam config → `process.exit(1)`. **No
  helmet, no rate limiting, no compression, no structured logger** (observed absence — a hardening
  gap, not a strength).
- **API:** 21 route files, **~183 endpoints** under `/api/*`, spanning student, instructor,
  institute-admin, institute-owner, superadmin, drills, IA, mock, diagnostic, courses,
  reading/writing, voice-lab, YouTube-notes, exams, profile.
- **Auth:** **Supabase-issued JWT verified locally** (`jwt.verify` with `SUPABASE_JWT_SECRET`,
  offline, no round-trip). `ensureUser` maps Supabase user → local Prisma `User` (by supabase-id →
  email → create). **No cookies/sessions.**
- **Roles/RBAC:** 6-role enum (`STUDENT, INSTRUCTOR, ADMIN, SUPERADMIN, INSTITUTE_OWNER,
  INSTITUTE_ADMIN`); `authorize(...roles)` allowlist middleware per router.
- **Multi-tenancy:** tenant = `Institute`; role-scoped join tables (`InstituteStudent/Owner/Admin/
  Instructor`, each `user_id @unique`); `InstituteStudent.id` is the FK anchor for **all** learning
  data. Enforced by **FK + cascade + app-layer scoping** (`requireActiveInstitute`,
  `attachExamContext`, `examAccess`) — **not Postgres RLS**.
- **Database:** Postgres with heavy use of **native enums (17)**, **JSONB** (scores/answers/config),
  **UUID PKs**, a **GIN index**, timezone-pinned defaults (`Asia/Kolkata` IST day), and **CHECK
  constraints/views/RPCs managed via hand-applied raw SQL** (no `prisma/migrations/` dir — `db push`
  + manual SQL).
- **Caching:** **no Redis/in-memory cache lib.** HTTP caching on `/ia` static; **content caching in
  Postgres** (YouTube transcripts); a **SQLite** file as an ephemeral WebSocket socket→user store.
- **Realtime:** **WebSockets via `ws`** (`/ws`), streaming audio to Google Cloud STT with
  interim/final transcripts.
- **Background/async:** **none** — no queue/cron/workers. IA scheduling is computed **per-request**;
  missed-IA detection is a **lazy on-read sweep** (`iaMissDetector`); AI grading runs
  **inline/synchronously** on the submit request.
- **External integrations:** **Google Gemini** (`@google/generative-ai`, `gemini-2.5-flash` /
  `gemini-3-flash-preview`) for all LLM grading; **Google Cloud Speech-to-Text** (streaming);
  **Resend** (invite emails); **Cloudinary** (profile images); **Supabase** (identity). *`openai` is
  installed but unused. No payment gateway in code* — billing is a `TRIAL/ACTIVE/CANCELLED`
  subscription state in-DB only.

---

## 3. Data Flow (traced end-to-end)

**A. Speaking assessment (viva) — the signature flow:**
`diagnostic_questions` (prompt version pinned per-session via a compact vector in
`diagnostic_sessions.set_id`) → student records audio in-browser (`MediaRecorder`, cached in
**IndexedDB** so a refresh doesn't lose it) → multipart upload (fieldname = promptId) →
**`gradeResponse`** sends audio as base64 `inlineData` to Gemini in **one multimodal call** doing 4
steps (classify content → transcribe + word-count → score each subskill on the rubric's allowed CEFR
set → feedback) → **`aggregateViva`** applies guardrails (no-response exclusion, short-answer caps,
off-topic caps, **withhold if ≥4 no-responses**), computes per-subskill means and an overall via
`cefrHybrid` → stored in `AssessmentHistory` (append-only) + upserted into
`StudentCompetencyMatrix` (one row per student+skill), `band_score` = CEFR ordinal, `sub_scores` =
full 6-subskill profile. Each write is stamped with **provenance** (`engine_version`,
`config_version`).

**B. Drill selection (personalization):** `getNextActionDrill` ranks weaknesses from the competency
matrix + per-subskill drill accuracy — **`weakness = 0.6·(1−accuracy) + 0.4·(1−score/100)`** — groups
by skill, sorts weakest-first, **round-robin interleaves** so the same skill isn't repeated, and
rotates a persistent cursor across days. Daily gate: 3 free / 4 hard-cap, server-graded momentum
(`15 + 10·correct`), IELTS-only LexiGrid gate on the 2nd drill.

**C. Internal Assessment (IA):** `getIAStatus` gates on 6 completed drills + 2 days + a DCS (Daily
Competency Score) threshold, on a first-drill+3/6/9-day schedule. SE IA picks the **2 weakest×drilled**
subskills (same weakness formula), serves 2 speaking prompts each, grades via the same viva pipeline,
applies **50/50 smoothing** against the prior score, updates the matrix + awards momentum — all
inside one `$transaction`.

**D. Analytics/consumption:** `GET /api/student/competency-scores` returns the matrix + momentum +
validated streak; `assessment-history` returns IA+Mock rows. Frontend reads
`sub_scores.subskillProfile` for the CEFR dashboard.

**E. Recommendations:** weakness-driven only — drill/IA selection + `recommendationService` mapping
band→level to fetch level-matched content. **No separate ML engine.**

---

## 4. Genuinely Interesting Engineering Problems (grounded in code)

1. **Exam-agnostic scoring engine.** One viva pipeline + one scoring module, parameterized by a
   per-exam `VivaRubric` (`getVivaRubric(examId)`) and a `scaleId` (`cefr_6`, `oet_500`, band).
   Scales/strategies (`bandMean` vs `cefrHybrid`) live in versioned JSON config, not code paths.
   Adding a viva exam = rubric + prompts + one registry entry.
2. **Concurrency around slow AI calls.** IA grading takes a **Postgres session-level advisory lock**
   (`pg_try_advisory_lock(hashtext(sessionId))`) to serialize duplicate submits *without* holding a
   DB connection through the multi-second Gemini call, plus an **atomic idempotency guard** — a
   conditional `updateMany(status NOT IN [COMPLETED,MISSED])` inside `$transaction` that rolls back
   *all* side effects if the row was already finalized. Diagnostic and drill starts use **xact-scoped**
   advisory locks.
3. **Multimodal grading with guardrails + per-prompt subskill masking.** Read-aloud prompts only
   score `phonology,fluency` (words are given); the grader classifies empty/inaudible/non-English/
   off-topic and the aggregator caps or withholds accordingly. Content integrity is handled
   explicitly, not assumed.
4. **Onboarding a second exam without forking the first.** The dispatch-at-route pattern + config
   map + subskill-enum bridge let Spoken English **reuse** the IELTS drill engine, recommendation
   engine, IA scheduler, and momentum system, while IELTS pages stay untouched (verifiable in
   `App.tsx` comments and `EXAM_DISPLAY`).
5. **Server-authoritative gamification.** Momentum, streaks, and DCS are computed server-side and
   never trust client counts; daily uniqueness is pinned to an **IST calendar day** at the DB default
   level; LexiGrid sessions use **HMAC-SHA256-signed, date-bound tokens** (`lexiGridSession.ts`).
6. **Streaming STT with stream-limit recovery.** The `ws` server auto-restarts Google's streaming
   recognizer around its ~305s cap by **re-injecting the cached WebM header** so the transcript
   stream is seamless.
7. **JSONB score storage with atomic merges.** Flexible `sub_scores`/`answers` JSONB, with
   **server-side `jsonb || jsonb_build_object(...)` merges** to avoid read-modify-write races on
   concurrent answer saves.
8. **Provenance + reproducibility.** Every graded row records the engine/config version that produced
   it, with an invariant guard that the headline equals the computed overall.
9. **Idempotent, migration-less schema ops.** `source_key @unique` for re-runnable seeds;
   views/CHECKs/RPCs applied as hand-managed SQL outside Prisma (a deliberate, if unusual,
   operational stance).

**Honest caveats (to keep any public claim defensible):** no automated test suite; no
rate-limiting/helmet; single-process (no clustering/queue); AI grading blocks the request inline;
CEFR thresholds are marked `PROVISIONAL_UNCALIBRATED` in config. Do **not** describe the system as
"high-performance", "highly scalable", or "battle-tested" — the code doesn't yet support those
claims. What it *does* support: careful correctness/consistency engineering and clean extensibility.

---

## 5. Contribution Attribution (from git, conservative)

Author `Sarthakyadav98`. **~60% of frontend commits (276/458), ~86% of backend commits (287/332)**;
single largest contributor in both, dominant in backend. Span ~Oct 2025 → Sep 2026, with the
platform work concentrated Jun–Sep 2026.

- **Clearly attributable (sole/overwhelming author):** the Spoken English **viva pipeline**
  (`src/services/viva/`), the **Exam Engine** (`src/exam-engine/`), the **exam-agnostic
  re-architecture** ("Phase 5/6 — Exam table replaces ExamType enum", scoring strategies) and
  **"Track A"** exam-scoping, the **drill / IA / diagnostic / gameScore controllers**, and the SE
  frontend (`SpokenEnglishDashboardPage`, IA page, exam config/dispatch).
- **Likely collaborative:** the core **StudentDashboardPage** and **Diagnosis UI** (shared with
  "Gokul" — Sarthak leads but not sole), and hub files (`schema.prisma`, `index.ts`, `App.tsx`) that
  everyone touches.
- **Unclear / pre-existing:** early `feature/*` branches (courses, reading, smartnotes, razorpay,
  voice-lab) and initial GPT-Engineer scaffolding — partly others', don't claim solely.

**Defensible one-liner:** *primary author of the exam-agnostic assessment engine, the AI viva-grading
pipeline, and the drill/IA/diagnostic backend; co-built the student dashboard and diagnostic UI.*

---

## 6. Tech Stack (actual, with usage)

| Layer | Tech | Where |
|---|---|---|
| Frontend | React 18 + Vite 8 (SWC) + TS 5.5 | SPA; lazy-loaded routes, manual vendor chunks |
| UI | Tailwind 3 + shadcn/Radix + framer-motion + recharts | design system, charts, animation |
| FE data | @tanstack/react-query 5; react-hook-form + zod | server-state, forms |
| FE audio | MediaRecorder + IndexedDB cache | viva recorder resilience |
| Backend | Express 5 + TS 5.9 (Node) | ~183 REST endpoints |
| ORM/DB | Prisma 5.22 + PostgreSQL (JSONB, enums, advisory locks, views) | all persistence |
| Auth | Supabase JWT (local verify) + Prisma user mapping | identity, 6-role RBAC |
| AI | Google Gemini (2.5-flash / 3-flash-preview) | writing/speaking/viva grading, notes, concepts |
| Speech | Google Cloud Speech-to-Text (streaming) via `ws` | live pronunciation transcripts |
| Realtime | `ws` WebSockets | audio streaming |
| Email/Media | Resend (invites), Cloudinary (images) | transactional email, uploads |
| Runtime store | better-sqlite3 | WS socket→user mapping |

---

## 7. Architecture Diagram (description for a later visual)

Three tiers, left→right:

- **Client (React SPA):** exam-prefixed router `/{examSlug}/*` → dispatch layer (IELTS page **or** SE
  page) → viva recorder (MediaRecorder + IndexedDB). WebSocket link for live STT.
- **API (Express 5):** middleware chain `requireAuth (Supabase JWT) → ensureUser → authorize(role) →
  requireActiveInstitute / attachExamContext → requireDiagnosed`. ~183 endpoints across
  student/institute/superadmin domains. A `ws` server on the same HTTP server.
- **Core engine + data:** **Exam Engine** (versioned JSON config, cached) → **Viva pipeline** (Gemini
  multimodal grade → guardrails → CEFR aggregate) → writes to **Postgres**
  (`StudentCompetencyMatrix` snapshot + append-only `AssessmentHistory`, provenance-stamped), guarded
  by **advisory locks + transactional idempotency**.
- **External:** Gemini, Google Cloud STT, Supabase (auth), Resend, Cloudinary. **No queue, no cache
  tier, no payment gateway** (draw as "not present" or omit).

A clean version: three columns (Client / API+Engine / Data+AI), with a callout box on the multi-exam
dispatch and one on the "advisory-lock + idempotent transaction" grading path.

---

## 8. Five Possible Technical Narratives (all grounded)

1. **"Designing an exam-agnostic assessment engine."** From an IELTS-hardcoded schema (`ExamType`
   enum) to a string `Exam` registry + versioned JSON config + pluggable scoring strategies — how a
   new exam becomes a data row and a rubric, not a migration. *(Strongest, most differentiated.)*
2. **"Grading speech with a multimodal LLM — and not trusting it."** One Gemini call that classifies,
   transcribes, scores 6 CEFR subskills, and gives feedback — wrapped in guardrails (withhold on
   silence, cap off-topic, mask read-aloud subskills) so a plausible-but-wrong score never ships.
3. **"Making AI grading safe under concurrency."** Postgres advisory locks + a conditional-update
   idempotency guard inside a transaction, so a slow LLM call can't double-award momentum or corrupt
   a student's competency snapshot.
4. **"Adding a whole new exam without forking the old one."** The dispatch-at-route + config-map +
   subskill-bridge pattern that let Spoken English reuse IELTS's drill/IA/recommendation
   infrastructure while the IELTS UI stayed untouched.
5. **"Server-authoritative learning mechanics."** Weakness-driven drill/IA selection, IST-day-pinned
   streaks, HMAC-signed game sessions, and provenance-stamped results — building trustworthy
   gamification and reproducible scoring into a production SaaS.

---

## Appendix — Key file references

**Backend (`backend-study-mentor/src`):**
- `index.ts` — bootstrap, middleware, route mounting, WS attach.
- `exam-engine/` — `loader.ts`, `scoring.ts`, config `exam-engine-config.v2.json` (scales, strategies, provenance).
- `services/viva/` — `pipeline.ts`, `geminiCompetenceGrader.ts`, `scoring.ts`, `registry.ts`, `rubrics/spokenEnglish.ts`.
- `controllers/` — `diagnosticController.ts`, `drillController.ts`, `iaController.ts`, `spokenEnglishIAController.ts`, `mockController.ts`.
- `lib/` — `iaProcessor.ts` (advisory lock + idempotent txn + smoothing), `iaMissDetector.ts`, `subskillSelector.ts`, `streak.ts`, `dcs.ts`, `lexiGridSession.ts`, `examAccess.ts`, `sessionContext.ts`.
- `middleware/` — `auth.ts`, `ensureUser.ts`, `rbac.ts`, `requireActiveInstitute.ts`, `attachExamContext.ts`, `requireDiagnosed.ts`.
- `wsServer.ts` + `services/sttService.ts` — streaming STT.
- `prisma/schema.prisma` + `prisma/sql/*` (band_range_cefr.sql, add_interaction_subskill.sql).

**Frontend (`ai-study-mentor/src`):**
- `core/App.tsx` — routing, dispatch components, guards, lazy loading.
- `features/auth/services/authClient.ts` — `callBackend` fetch wrapper (JWT + `X-Exam-Id`).
- `shared/state/examContext.ts` — selected-exam context for owner/admin.
- `features/student/config/examDisplay.ts`, `config/spokenEnglishSubskills.ts`, `utils/exam.ts`.
- `features/student/components/Diagnosis/VivaDiagnostic.tsx` + `vivaRecordingCache.ts` (IndexedDB).
- `features/student/components/Drills/DrillScreen.tsx`, `SpokenEnglishDashboardPage.tsx`, `SpokenEnglishIAPage.tsx`.
