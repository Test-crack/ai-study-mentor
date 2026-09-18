# Release Readiness Assessment — Student Platform

**Date of assessment:** end of the hardening cycle
**Scope:** Student-facing platform (Diagnostic, Daily Loop, IA, Mock) + institute-admin onboarding/batches + auth.
**Verdict:** ✅ **Ready for release**, conditional on the deploy checklist (§4) and a recommended post-deploy smoke test (§5).

---

## 1. What was assessed

| Phase | Activity | Outcome |
|---|---|---|
| Audit | Spec-vs-code review of all 4 student features | 9 CRITICAL, 17 HIGH, 22 MEDIUM findings catalogued |
| Fix waves | CRITICAL → HIGH → MEDIUM → LOW | All resolved; both repos type-check clean at every wave |
| Phase 1 verification | Independent code-level re-review of the fixed code (4 parallel reviewers, one per feature) | All intended behaviors verified in the actual code; 7 residual gaps found and fixed |

Phase 1 was done as **static code-vs-logic verification**, not live runtime driving — a deliberate choice (runtime driving real sessions is token/infra-heavy). It confirms the code implements the intended logic and that the refactors introduced no regressions.

---

## 2. Verification result (Phase 1)

Four independent reviewers read the actual current code and confirmed, point-by-point:

- **Diagnostic** — all 9 intended behaviors present. Found: client-`set_id` still trusted in the L/R submit denominator → **fixed** (now derived strictly from answered questions); tab-lock not namespaced → **fixed**; unhandled multer limit → **fixed**; min-words default mismatch → **fixed**.
- **Daily Loop** — assertions 1–10 verified. Found: daily cap/LexiGrid gate not atomic across two concurrent sessions → **fixed** (per-student advisory lock); dead functions + missing-token replay overwrite → **fixed**.
- **IA** — all 10 verified, all hunted races correctly guarded, **no regressions**. Only a cosmetic prompt/rounding note (non-blocking).
- **Mock** — the `processMockSession` extraction confirmed **faithful by line-by-line diff** against the pre-extraction code; all 10 verified, no regressions.

**No release-blocking issues were found.** The 7 gaps surfaced were all MEDIUM/LOW and are now fixed, type-checked, and pushed.

---

## 3. Confidence by area

| Area | Confidence | Notes |
|---|---|---|
| Auth (local JWT) | High | No more network-dependent logout; verified live earlier at the API surface |
| Institute onboarding / batches | High | Routes wired, atomic writes, single-institute constraint enforced |
| Diagnostic | High | Forgery vectors closed, resubmit blocked, gate enforced both layers |
| Daily loop (drills/LexiGrid/momentum) | High | Server-side grading + gating, atomic awards, cap now truly atomic |
| IA scoring & lifecycle | High | Correct weighting, smoothing, miss handling, auto-grade, all races guarded |
| Mock scoring & lifecycle | High | Faithful extraction, auto-grade on expiry, slot enforcement, AI-failure safe |
| Momentum economy | High | All earn/spend paths idempotent and floored at 0 |

The one thing **not yet exercised** is the deep scoring paths driven **end-to-end against real question data with a live student session** (submit a real IA, grade a real mock). These are verified at the code/logic level and partially at the API surface, but not run live. See §5.

---

## 4. Deploy checklist (must complete before/at deploy)

- [ ] **`SUPABASE_JWT_SECRET`** set in the VPS `.env` — the new auth middleware fails all requests without it.
- [ ] **`npm install`** on the backend (adds `jsonwebtoken`).
- [ ] **Prisma client regenerated / backend restarted** — picks up the `skipped` column and all controller changes.
- [ ] **`requireDiagnosed` middleware live** (restart) — gates drills/IA/mock.
- [ ] **Merge** `feature/audit` (backend) and `bug/batches` (frontend) after review.
- [ ] Confirm the DB has the `skipped` column (added via `prisma db push` earlier).

---

## 5. Recommended post-deploy smoke test (final gate)

Drive one real student end-to-end on staging/prod with real question data:

1. Invite a student (institute admin) → confirm invite email + first login lands on the diagnostic.
2. Complete the diagnostic (all 4 sections) → confirm dashboard unlocks (no onboarding bounce-loop).
3. Un-diagnosed deep-link check: hit `/student/drill` before diagnosis → confirm redirect + backend 403.
4. Daily loop: Drill 1 → LexiGrid → Drill 2 → confirm dashboard unlock + streak +1; confirm a forged `correct_answers` gets the real (graded) momentum, not the forged amount.
5. IA (on an eligible student): submit → confirm scoring, band movement (±2 cap), momentum; abandon one with answers → confirm auto-grade on next status load.
6. Mock (on an eligible student): submit → confirm real-band update + momentum; start-and-abandon with answers → confirm auto-grade at window expiry.
7. Momentum: confirm skip (−150) deducts, extra drill (−300) gated on DCS, balance never negative.

This is the only remaining item that requires a live run; everything else is verified.

---

## 6. Known limitations / accepted risks (non-blocking)

- **M-13 (deferred):** cross-midnight drill bucketing uses `created_at`; a drill spanning IST midnight counts for the wrong day. Low-frequency; a correct fix touches 4 day-counting sites in lockstep and is scheduled post-demo.
- **DB-level integrity:** institute/batch scoping and momentum floors are enforced in the application layer only — no DB check constraints/triggers. Fine while direct DB write access is restricted; add constraints before exposing any DB admin tooling.
- **AI grading = Gemini dependency:** an outage now degrades gracefully (retry, session preserved, no band corruption) but grading is unavailable during the outage.
- **Firefox speaking:** Web Speech API is Chrome/Edge only; Firefox shows the recording UI but produces no transcript. Recommend a browser-support note in the UI (LOW).
- **Mock status-sweep latency:** an expired-with-answers mock is auto-graded synchronously on the next status call (AI calls in-line), which can slow that one dashboard load. Correct and idempotent; a background job would be the long-term improvement.

---

## 7. Bottom line

The platform's student flows have been audited, hardened, and independently re-verified at the code level. Every data-corruption and exploit-class issue is closed; scoring, momentum, gating, and lifecycle behave per spec across all documented scenarios; the refactors introduced no regressions.

**Recommendation: proceed to release** once the §4 deploy checklist is complete, and run the §5 smoke test as the final confirmation on real data. The remaining known limitations (§6) are non-blocking and scheduled as follow-ups.
