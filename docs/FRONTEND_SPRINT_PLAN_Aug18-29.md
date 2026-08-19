# Frontend Build Plan — Sprint 1 (18–29 August 2026)

**For approval** · Frontend Engineering
**Scope: frontend repo only.** Every task below is code in `StudyMentor/frontend`. Nothing here asks another function to write code, and nothing here is a backend deliverable.
**Basis:** TC-03 §8.1, TC-04 §1/§2/§3.3, TC-07 (Frontend Engineering block, Week 1–2 of the dependency map)
**Full technical detail:** `docs/FRONTEND_PLAN_TC03-04-07.md`

---

## 1. How this sprint is ordered

**Ordering rule: backend dependency, ascending.** Work that needs nothing from Backend Engineering runs first; work that needs the API merely *running* runs second; work that needs API endpoints that don't exist yet is out of this sprint entirely.

That means if Backend Engineering's exam-switching work slips, runs late, or breaks the dev API for a day, **Tier 0 keeps moving regardless** — it's ~7 of my 10 working days and it can be verified with `tsc` and `npm run build` alone.

| Tier | Backend dependency | Verified by | Days |
|---|---|---|---|
| **Tier 0** | **None.** Pure frontend refactor + structure. | Typecheck + build + lint. No API call needed. | 7 |
| **Tier 1** | Needs the **existing** dev API *running*. No new backend work. | Manual run-through in the browser. | 3 |
| **Tier 2** | Needs endpoints that **do not exist yet**. | — | **0 — out of sprint** |

---

## 2. Tier 0 — zero backend dependency *(days 1–7)*

These four items compile, build and lint without a single API call. If the backend is down all week, all four still ship.

| ID | Deliverable | Why it's first |
|---|---|---|
| **FE-1** | Single `ExamType` + `ExamConfig` with the three legal fields (`legalDisplayName`, `legalDisclaimer`, `trademarkOwner`) | TC-03 §5.1 / §8.1 item 2. Pure type + config work. Deletes the rogue mock `ExamType` at `Questionbankmanager.tsx:13`. |
| **FE-2** | Central API client — `examApi()` / `platformApi()` + ESLint rule banning literal `/api/` strings | Prerequisite for TC-04 §3.3 exam-prefixed routes. **Writing** the client calls nothing; see §5 for why this is the item I want signed off. |
| **FE-3** | Migrate ~62 call sites onto the client | Mechanical string refactor. Compile-time verifiable; runtime smoke test is Tier 1. |
| **FE-4** | `packages/ui` + `packages/exam-engine` + `apps/ielts` workspace extraction, Turborepo pipeline | TC-07 Week 1–2, TC-04 §1. Build-system work — the least backend-coupled task in the whole expansion. |

## 3. Tier 1 — needs the existing API running, but no new backend work *(days 8–10)*

Nothing new has to be built for these. They need the dev API up so I can reproduce and verify against real responses.

| ID | Deliverable | What it needs |
|---|---|---|
| **FE-5** | Three named High bugs closed — reading auto-submit, audio `onError`, polling-during-test | Dev API running, to reproduce and confirm the fix. |
| **FE-6** | Zero-blocker journey walkthrough (diagnostic → drills → content loop → IA → mock → report) + triaged blocker list | Dev API running, seeded student account. |

## 4. Tier 2 — out of this sprint, and why

Not deferred by choice — these are **unbuildable** until endpoints exist. Listing them so the boundary is explicit.

| Deliverable | Blocked on | TC-07 schedule |
|---|---|---|
| Viva session UI | `/api/spoken/viva/*` — does not exist | Week 5–6 |
| CEFR (A1–C2) widget | `sub_scores` JSON shape for CEFR | Week 5–6 |
| Exam switcher UI | Stable exam-prefixed route contracts | Week 7 |
| Predictive readiness UI | Rule-based v1 backend | Week 9–10 |
| `apps/oet` shell | Exam 3 backend (itself gated on the verification engine) | Week 11+ |

**The only Tier 2 action I take this sprint is asking for the contracts** — a written post in the shared channel on day 1 (~30 minutes, TC-07's "here's the contract, flag within 24h" rule). It's an unblocking action for Week 5, not sprint work, and **no task in this sprint waits on the reply.** Details in §6.

**Also permanently off my plate:** per-exam domains / Nginx / pm2 per exam (withdrawn by TC-03 §3.1 and TC-04 §9), and OET role-play Speaking UI (deferred, TC-03 §7 Q10).

---

## 5. Day-by-day

### Week 1 · Tue 18 – Sat 22 Aug — *Tier 0*

| Day | Work | Output |
|---|---|---|
| **Tue 18** | Post the Week-5 contract asks (§6, ~30 min, fire-and-forget). Then **FE-1**: delete the rogue `ExamType` at `Questionbankmanager.tsx:13`; add `shared/types/exam.ts` with the three legal fields; add `useExamConfig()`. | Asks posted. PR #1. |
| **Wed 19** | **FE-1** cont. — refactor the ~18 `band_score` sites to `config.formatOverall()` + `config.scoreLabel`. Zero visual change for IELTS. | PR #1 merged. |
| **Thu 20** | **FE-2**: `src/shared/services/api.ts` with `examApi()`/`platformApi()`, plus the ESLint `no-restricted-syntax` rule. | PR #2 (small, fast review). |
| **Fri 21** | **FE-3** wave 1 — `features/student` call sites. | PR #3. |
| **Sat 22** | **FE-3** wave 2 — `features/instructor`, `Institute`, `InstituteOwner`, `superadmin`. Grep-verify zero literal `/api/` remain. | PR #4. |

### Week 2 · Mon 24 – Sat 29 Aug — *Tier 0 finishes, Tier 1 runs*

| Day | Work | Output |
|---|---|---|
| **Mon 24** | **FE-4** spike on a branch: workspace root, `apps/ielts` (move, change nothing), `packages/ui` from the existing 51 shadcn components with the `@/shared/components/ui` alias preserved. | Green spike branch, or a written "here's what blocks it". |
| **Tue 25** | **FE-4** migrate for real + `packages/exam-engine` (interfaces only, zero deps) + Turborepo pipeline. | PR #5 (the big one). |
| **Wed 26** | **FE-4** gate check — IELTS CI green end to end. Fix fallout. *(TC-07 gate 1 is absolute: nothing merges red.)* | CI green. |
| **Thu 27** | **FE-5** bug 1 — reading auto-submit (`ReadingPractice.tsx`, `StudentReadingAssessmentPage.tsx`). Bug 2 — audio `onError` across `ListeningPractice.tsx`, `AudioResponseDrill.tsx` and every `<audio>`: a failed load surfaces a retry, never a silent dead player. | PR #6, PR #7. |
| **Fri 28** | **FE-5** bug 3 — polling during test. Audit the 14 student components using `setInterval` (incl. `FullMockAssessment`, `ZenAssessmentRunner`, `Assessment`); polling pauses while a timed assessment is in progress. Plus the FE-3 runtime smoke test now that the API is in play. | PR #8. |
| **Sat 29** | **FE-6** journey walkthrough + triaged blocker list. Sprint report + Week 3–4 plan. | Written report to you. |

**One trade-off this ordering creates, stated plainly.** Backend-independent-first puts the three High bugs in the last three days. That's correct by the ordering rule — but it means if FE-4 (the workspace extraction) overruns, the bugs are what slip. My mitigation is Monday's spike: if the extraction looks bigger than two days, I stop, carry FE-4 into Week 3, and pull the bugs forward to Wednesday instead. **I'd rather carry a structural task than a user-visible bug.** Say the word if you'd prefer the bugs pulled to Week 1 outright — that's a one-line change to this plan.

---

## 6. The one decision I need from you

**FE-2 + FE-3 is scope I'm adding beyond TC-07's literal text, and I'd like it approved explicitly.**

TC-04 §3.3 says routes become `/api/{exam}/…`, and TC-07 has Backend Engineering renaming them in their Step 3. The frontend is not ready. I audited it:

- Base URL is derived **four different ways** — `config/constants.ts:3`, `getBackendUrl()` in `shared/utils`, an inline literal at `core/App.tsx:241`, and its own `VITE_API_URL` at `features/student/components/IeltsWriting.tsx:13`.
- **~62 files** hand-build path strings: `` `${getBackendUrl()}/api/ielts-writing/submit` ``, `` `${backendUrl}/api/ia/questions` ``, `'/api/diagnostic/submit/writing'`.

They're template strings, so when the routes rename, **all 62 break at runtime with no compile-time error** — surfacing as a live IELTS regression, which TC-07 gate 1 calls stop-the-line for everyone.

FE-2 + FE-3 turns that into a one-file change. It costs three days (Thu 20 – Sat 22) and it's Tier 0, so it carries no schedule risk from anyone else's work.

**Ask: approve it as sprint scope.** If you'd rather those three days went elsewhere, I'll do that — but the route rename then needs its own slot on the calendar *before* Backend Engineering's Step 3 lands.

---

## 7. Contract asks going out on day 1

Posted Tuesday, 24h flag window. **No sprint task waits on these** — they exist so Week 5 isn't a cold start.

| # | Ask | Needed by |
|---|---|---|
| 1 | Viva route shapes — session / answer / progress / review | Week 5 |
| 2 | Viva audio upload: multipart-to-backend or signed direct upload? *(There's no `cloudinary` reference in the frontend today, so uploads look backend-mediated — confirming.)* | Week 5 |
| 3 | Exact `sub_scores` JSON shape for CEFR levels (TC-04 §2 keeps `band_score` generic) | Week 5 |
| 4 | Is `apps/spoken` its own shell, or a route group inside `apps/ielts`? | **Mon 24** — affects FE-4's shape |
| 5 | Does exam-switcher selection persist server-side or client-only? | Week 7 |

#4 is the only one with a date inside this sprint. If it's unanswered by Monday I build the extraction to support either shape and document the assumption — it does not stop FE-4.

---

## 8. Risks

| Risk | Handling |
|---|---|
| FE-4 breaks the IELTS build | Spike on a branch first (Mon 24). Alias stays pointed at the old path in the same PR so no imports change at once. Nothing merges red. |
| FE-4 overruns and squeezes the bugs | Monday's spike is the decision point — carry FE-4, pull bugs forward. See §5. |
| FE-3 misses a call site | ESLint rule catches new ones; grep-verify zero literal `/api/` before closing PR #4; runtime smoke test Fri 28. |
| Journey walkthrough surfaces more than three bugs | Expected. I triage into "blocks the zero-blocker journey" vs "backlog" and bring you the split rather than silently expanding the sprint. |
| Dev API unavailable during Week 2 | Tier 0 is unaffected. Tier 1 shifts within the week; it's 3 days of 10. |

---

## 9. Definition of done

1. No file in the frontend builds an API URL by hand — all go through `examApi()`/`platformApi()`, with a lint rule keeping it that way.
2. One `ExamType`, one `ExamConfig`, and no exam name hand-typed anywhere in JSX (TC-03 §5.1 Rule 2).
3. `packages/ui`, `packages/exam-engine` and `apps/ielts` exist **and IELTS CI is green** — or FE-4 is explicitly carried with a written reason.
4. The three named High bugs are closed and verified in the running app.
5. The zero-blocker journey has a written walkthrough with every remaining blocker triaged.

**Zero visual change to IELTS is the acceptance criterion on FE-1, FE-2, FE-3 and FE-4.** All four are structural. If a user notices them, I did them wrong.

---

*Requesting approval on §6 (FE-2/FE-3 scope) and the tiering in §1. Everything else follows TC-07's dependency map as written.*
