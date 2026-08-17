# TC-07 · Team Operating Model
**Part III · Execution** · Document 7 of 8 · **TestCrack Operating Handbook v1.0**
**Note:** §"Who owns what" is superseded by TC-06 §4. Gates, async rules and the dependency map below remain current.
**Audience:** All functions

> **Who owns what, written for an async team.** Each block is scoped so its owner can start without waiting on a live conversation.
>
> **What this version changed:** Spoken English is Exam 2, so the viva UI and viva backend move onto the revenue path. The verification engine moves onto the critical path because it gates OET content. Content holds are gated on the engine rather than on outstanding founder decisions — those are resolved in TC-03. Content & Growth gains a publishing constraint.

---

## Confirmed clearance

**Platform Services is cleared to build separate features on the dev version concurrently while Backend Engineering works the exam-switching model.** This is safe **because staging/production separation is done and dev is isolated**. Guardrail: standalone API products live on their own repos/DBs entirely outside the platform pipeline; any dev-version *platform* feature goes dev → staging, never prod. No collision with Backend Engineering's backend path.

---

## Who owns what

### Backend Engineering — Backend / Exam-Switching Model *(critical path)*
- Schema migrations — enum, renames, `exam_type` columns, `institute_exam_subscriptions` **with billing hooks**, **DPDP fields** (TC-05 Step 1).
- `ExamConfig` + `ScoringStrategy` interfaces (`packages/exam-engine`) **including the three legal fields**, and the exam registry.
- Extract IELTS logic behind the interfaces; abstract the Gemini call; exam-prefix routes.
- **Prove the abstraction on IELTS before any exam is registered** (the key de-risk).
- **▲ Register SPOKEN (CEFR) as Exam 2** — and report whether threshold-banding fit `overall()` without a special case.
- Backend for the **Viva Engine** — now on the revenue path, since it delivers Spoken English.
- **Predictive Readiness v1** (rule-based), S4.
- Register OET third, once the content gate clears.
- **Blocks:** Spoken English launch, viva UI (Frontend Engineering), OET backend, predictive readiness UI.
- **Blocked by:** custom-JWT migration (for `auth-client` extraction). *No longer blocked by TC-02 — those answers are in TC-03.*

### Frontend Engineering — Frontend / Student Journey & New UI
- Finish the **zero-blocker student journey** UI (diagnostic → drills → content loop → IA → mock → report) and close frontend High bugs (reading auto-submit, audio `onError`, polling during test).
- Extract `packages/ui` (package existing shadcn components); verify IELTS still builds.
- **▲ Viva session UI — now priority, not S3 nice-to-have.** Mic record → upload → per-question progress → end-of-session detailed review/analysis. This *is* the Spoken English product surface.
- **▲ CEFR score display** (A1–C2 widget) alongside the IELTS Band widget — a genuinely different presentation, not a relabel. Later: OET Grade widget.
- Exam switcher UI (institute/owner); picker appears only when >1 exam is active.
- **▲ Deploy topology changed:** one domain, exam as route (`testcrack.com/spoken/…`). `apps/oet` still exists as a workspace app but **not** as a separate domain. No Nginx/pm2 per-exam work.
- OET app shell reusing L/R/W phase components, when Exam 3 arrives. Role-play Speaking UI deferred (TC-03 §7, Q10).
- **Blocks:** Spoken English launch, viva feature launch.
- **Blocked by:** Backend Engineering's route contracts; `packages/ui` extraction; `auth-client`.

### Platform Services — Verification Engine + Standalone API Products *(concurrent, isolated)*
- **▲ Currently, and now on the critical path:** the exam **verification engine** — 3 difficulty levels, edge-case tuning (obvious distractors made relevantly hard). Output: a validated, difficulty-tagged question bank. **OET content sourcing does not begin until this ships.** That elevates its priority above the API products.
- **Standalone API products** (own repo + DB each), priority order: Writing Eval API → Batch Report Generator → Speaking Eval API → Question Bank licensing. Each ships a TestCrack-branded free tier plus paid tiers.
- **▲ Commercial terms are now decided** (TC-03 §6.3 / TC-02 Q25–27): pay-per-use for evaluation APIs, subscription for Batch Report, licensed access for the Question Bank. **Licensable: questions + difficulty metadata. Never: performance data, competency matrix, calibration model.** No read path of any kind from a licensing product back to the platform DB.
- **Interface contract with Backend Engineering:** agree the question schema (`exam_type`, `skill`, `difficulty`, distractor metadata) in week 1. **▲ Corrected by TC-06 §1.2 —** `level` is nullable and drills-only; it is retiring from diagnostic selection. It now needs to be clean enough to publish externally, since the difficulty metadata is a saleable asset.
- Doubles as the **intern training track** (Claude Code, Cowork, MCP connectors).
- **Blocks:** ▲ OET content sourcing (via the engine).
- **Blocked by:** nothing — paid-tier terms are now answered.

### Content & Growth — Marketing / Content
- Outreach to the **29 institutes** using each institute's real operations; prioritise named contacts; offer the **free 30-day pilot** — now *per exam*, so an institute can pay for IELTS while trialling Spoken English.
- **▲ Re-order the warm list.** Lead with institutes already teaching **Spoken English** (a larger overlap than OET), then OET teachers. The multi-exam pitch is now "whichever exam you already teach, start there."
- **▲ Hard copy constraint — read this.** India's CCPA Coaching Guidelines 2024 apply to coaching operations serving >50 students. **No claims about band improvements, success rates, selection rates or guaranteed outcomes.** Any claim needs a prominent uniform-font disclaimer. Any student testimonial needs **written consent obtained after their result**. Enforcement runs through the Consumer Protection Act 2019.
  **What you *can* say freely:** we diagnose the failing sub-skill and prescribe the drill. That is a description of the product, not a claim about outcomes — and it happens to be the more differentiated message anyway.
- Hold the **calibration-claim** messaging until internal calibration is proven, then publish with sample size and error band. TC-03 §5.3.
- **▲ Never use an exam name in a domain, campaign name or product name.** "Preparation for the Occupational English Test (OET®)" is fine. "OET Testing" is not. TC-03 §5.1.

### Media Production — Content
- **▲ Spoken English needs no new content** — it reuses existing Speaking banks. Your near-term work is **curating and tagging** the existing bank for viva delivery (disconnected questions, sub-skill coverage), not writing new items.
- **▲ OET content is gated on Platform Services' verification engine, not on the Founder's answers.** Scope questions are answered: **Nursing only**, L+R+W, Grade B target (TC-03 §7). Do not begin bulk OET writing until the engine ships — unverified clinical content is worse than late clinical content.
- **▲ Before any contracted SME writes a single item, the IP assignment must be signed.** Under Indian copyright law, commissioned works vest in the **author** absent written assignment — and we intend to license this bank. This is a real blocker, owned by the Founder.
- OET Listening audio: **AI-generated for the pilot bank**, with human recordings only where the assessed sub-skill *is* accent comprehension or clinical register.

### Intern — Trained via Platform Services' track
- Modern AI-assisted dev practices on the standalone products; low-risk because those repos are isolated.

---

## Concurrency & dependency map

```
Week 1–2  ┌ Backend Engineering: migrations + interfaces ┐   ┌ Frontend Engineering: journey bugs + packages/ui   ┐
          │ Platform Services: VERIFICATION ENGINE      │   │ Media Production: curate+tag existing    │
          │         (critical path)          │   │   Speaking bank for viva            │
          └──────────────┬───────────────────┘   └───────────────┬─────────────────────┘
                         │ (question-schema contract agreed here) │
Week 3–4  Backend Engineering: prove abstraction on IELTS ── gate: CI green ──┐
Week 5–6  Backend Engineering: register SPOKEN (CEFR)  +  Frontend Engineering: viva UI      │ Platform Services: Writing Eval API
Week 7–8  ★ SPOKEN ENGLISH LIVE — first paid module line          │ Platform Services: Batch Report Gen
          └─ engine shipped? → OET content pipeline may start
Week 9–10 OET backend + Predictive Readiness v1                   │ Platform Services: Speaking Eval API
Week 11+  OET frontend + pilot; GRE/TOEFL planning on the scaffold
```

**Async rules (no assumption of shared time zone):**
- The **question-schema contract** (Backend Engineering ↔ Platform Services) is the one seam that must be agreed in writing early; everything else is one-directional.
- Any interface change (routes, schemas) is announced in the shared channel with the new shape written out — never "let's discuss," always "here's the new contract, flag within 24h."
- CI-green-on-IELTS is the shared stop-the-line signal; a red build pauses all new-exam merges regardless of who's online.

---

## The gates

1. **Zero IELTS regression / CI green** before any exam registers. *(unchanged, still absolute)*
2. **▲ Verification engine ships before OET content sourcing begins.** *(replaces the old "TC-02 answered" gate, which is now satisfied)*
3. **▲ IP assignment signed before any contracted SME writes an item.** *(new — legal, and it blocks real spend)*

Everything else runs in parallel, which is exactly what the isolated dev environment makes possible.

---

## One number to watch

**Engineering time to register Exam 3 (OET) vs Exam 2 (Spoken English).**

If Exam 3 costs materially more, the abstraction leaked and we fix it before Exam 4. If it costs the same or less, the restructuring paid for itself and every exam after this is close to free. That single comparison is the honest verdict on this whole plan — and it's the number worth reporting.

---

**TestCrack Operating Handbook · v1.0 · August 2026** · TC-07
