# Track A — Multi-Role Dashboards & Context Switch (Execution Plan)

Builds the user-visible model in [PLATFORM-ROLES-AND-FLOWS.md](./PLATFORM-ROLES-AND-FLOWS.md). Runs in parallel with the IELTS extraction (Track B). This plan bakes in the constraints: **scalable & adaptable** (auth can move to JWT + Redis later without a rewrite), and **reliable, secure, fast** now.

---

## 1 · Architecture — built to swap later, safe today

Three seams, each an interface the app depends on, so today's implementation can be replaced without touching call sites.

### 1.1 Auth / session port (swap-ready for JWT + Redis)
- Define a single **`SessionProvider` interface**: `verify(req) → { userId, roles, instituteId }`. All routes depend on this, never on the concrete provider.
- **Today:** the current provider sits behind it. **Later:** a JWT-verify + Redis-session adapter is a drop-in — no controller changes.
- Identity is resolved **server-side per request**; the client never asserts its own roles.

### 1.2 Context resolver middleware (the heart of the switch model)
- One middleware: `resolveContext(user, requested)` where `requested` = `exam_id` (owner/admin) or `batch_id` (instructor/student).
- It **authorizes** (does this user's role grant this context in this institute?) then **injects a scoped filter** (`req.ctx = { instituteId, examId?, batchId? }`) that every downstream query MUST use.
- **Deny by default:** unknown/unauthorized context → 403, never a silent empty result that could mask a bug.
- **Cache-ready:** the authorization lookup (user → institute → subscriptions/batches) is a pure function of IDs — trivially Redis-cacheable later; today a single indexed query (indexes already exist: `idx_*_institute`, `institute_exam_subs`).

### 1.3 Data isolation (the security guarantee)
- Every context-scoped query filters by `req.ctx.examId` / `batchId` **server-side**. The client-sent context is a *hint*, validated, never trusted.
- **Zero cross-context leakage** is the acceptance test: switch exam/batch → the other's rows must be unreachable, verified per endpoint.

### 1.4 Performance
- Exam registry/config is already **in-memory** (`loadExamEngine()` at boot) — context resolution never hits disk for config.
- Scoped lookups ride existing indexes. Add a **Redis seam** (interface only now) for session + permission caching when traffic warrants — no schema change needed.
- Frontend: the selected context lives in one store; switching **refetches only the scoped data**, not a full reload.

---

## 2 · Build order (each a releasable, isolated checkpoint)

| Phase | Deliverable | Notes | Depends on |
|---|---|---|---|
| **A0** | SuperAdmin: add institute+owner, edit, subscription **ACTIVE/CANCELLED** (TRIAL≈ACTIVE, CANCELLED=deactivate). **Exam list from `GET /api/exams`** (kills the hardcoded `examTypes.ts` drift). | first releasable slice; folds in Part 5's UI item | existing models + endpoint |
| **A1** | Owner/Admin **exam context switch** + scoped operations/insights + isolation | uses the resolver middleware | A0, registry |
| **A2** | Instructor **batch context switch** (dashboard / student-assessment / report) | batch carries its exam | A1 pattern |
| **A3** | Student **batch(+exam) switch** post-login; single-exam users keep today's flow untouched | switch UI only appears when >1 context | A2 pattern |
| **A4** | SuperAdmin **exam-config pages** (guarded create/edit) | the "configs page" you want before merge | Phase 6 (config is source of truth) |

Each phase: build the resolver-scoped API + the scoped UI, then a **per-role isolation test** (switch context → correct data, zero leak) before the next.

---

## 3 · A4 — the exam-config pages (what's editable vs code)

Driven by the extraction's boundary ([../ielts-extraction/IELTS-EXTRACTION-GUIDELINE.md §9](../ielts-extraction/IELTS-EXTRACTION-GUIDELINE.md)):

| Field | In the config UI? |
|---|---|
| Exam id, label, status (live/reserved/disabled), availability | ✅ editable (guarded) |
| Components: which exist, `assessed`, `weight`, `time_limit`, `scale` ref | ✅ editable |
| Level/difficulty cuts, weakness domain, thresholds | ✅ editable **with validation** (a bad edit is rejected before it can mis-score a live cohort) |
| Overall **strategy choice** (`band_mean`/`cefr_hybrid`), **scale shape** | 🔒 shown read-only; changing the scoring *shape* is a code/review action |
| AI rubric / blend / smoothing (Layer B) | 🔒 not in UI — bespoke code module |

**Guard-rail:** every save runs `validateConfig` (40+ rules) + the vector suite before it can go live. That is what lets the declarative fields be safely super-admin-editable. `exam_configs` is versioned — a save bumps `config_version`, and provenance keeps old results interpretable.

---

## 4 · How long does each new exam take?

The whole point of the extraction is that **code cost drops sharply after the first exam** — the recurring cost becomes **content authoring**, which is not engineering-bound.

| Work | First AI-graded exam (Spoken English) | Subsequent AI-graded exam | Numeric/MCQ exam reusing IELTS runners |
|---|---|---|---|
| Register + subscribe (dashboard) | minutes | minutes | minutes |
| Config entry (components/scale/strategy/thresholds) | ~0.5–1 day | hours | hours |
| Scoring (overall/level/targeting) | **free** (engine, via config) | free | free |
| AI grading adapter (bespoke rubric) | ~3–5 days eng + calibration | ~2–4 days | n/a |
| Delivery/runners (only if components render differently) | ~2–4 days (variable) | reuse → ~0 | reuse → ~0 |
| **One-time**: prove the multi-exam student path end-to-end | folded into Track A | already done | already done |
| **Engineering total** | **~1–2 weeks** | **~2–4 days** | **~hours–1 day** |
| Content (question banks / prompts) | separate — content team, days–weeks | separate | separate |

**Read:** Spoken English (the first, AI-graded) is the trailblazer — ~1–2 weeks of eng because it also shakes out the multi-exam runner + context path. After that, a similar exam is **days**, and a plain numeric/MCQ exam is **hours**. In every case **content authoring is the real recurring cost, not code** — which is exactly the outcome the extraction was for.

> Estimates assume Track A (A0–A4) is in place and the exam reuses an existing scoring shape. A genuinely new scoring *shape* adds a one-time new-strategy cost (~2–4 days), after which every exam of that shape is config-only.

---

## 5 · Security & reliability checklist (applied every phase)
- [ ] Server-side role+context authorization on every scoped route (deny by default).
- [ ] Context-scoped queries filter by `req.ctx` IDs — no client-trusted scoping.
- [ ] Cross-context isolation test per endpoint (switch → zero foreign rows).
- [ ] No data deletion on deactivate/cancel — access changes only.
- [ ] Auth behind the `SessionProvider` port so JWT+Redis is a later adapter, not a rewrite.
- [ ] Redis seam defined (interface) for session/permission caching; wire when needed.
- [ ] Single-exam / single-batch users keep today's exact flow (switch UI hidden).

## 6 · Sequencing with the dev merge
- **Option (recommended):** merge **Phase 6** to `dev` right after its E2E gate (it's self-contained, low-risk), then land A0–A4 as their own checkpoints. Smaller, safer merges.
- **Your stated preference:** hold everything on `platform/s4` until A0–A4 + config pages are in, test all roles + IELTS together, then one merge to `dev`. Fine too — just a bigger single test surface. Either way, the Phase 6 dev E2E must pass before that code is trusted.
