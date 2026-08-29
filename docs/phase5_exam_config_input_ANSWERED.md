# Exam Config — Info Needed (for Phase 5)

**For:** Paul
**Answered by:** Gokul (Frontend Engineering) · 19 Aug 2026
**Why:** We're building a single "exam engine" so each exam's names, legal text, skills, and scoring live in one place. We need the real values for the two exams going live now — **IELTS** and **Spoken English**. IELTS is mostly confirmation; **Spoken English scoring is the main unknown.**

---

## How to read my answers

Most of this is already settled in the handbook, so rather than leave it blank I've filled it in with the source. Three markers:

| Marker | Meaning |
|---|---|
| ✅ **Confirmed** | Already decided in TC-03 / TC-04 / TC-07. Cited. Not my opinion — just pointing at where it's written. |
| 🟡 **Implemented provisionally — please confirm** | I've already built this into the frontend exam registry so Phase 5 isn't blocked, using a sensible default. It is a **guess** and will ship if nobody corrects it. |
| 🔴 **Still needs a decision** | Genuinely open. Not something I should invent. |

**⚠️ One thing to read before anything else — see §C6.** There's a unit mismatch between this document and what we store. It affects the whole scoring section.

---

## A. Legal & naming (both exams)

These three fields exist so no developer ever hand-types an exam name into the UI — it all reads from your values.

| Field | IELTS | Spoken English |
|---|---|---|
| **Public display name** (short UI label) | ✅ `IELTS` | 🟡 `Spoken English` |
| **Legal display name** | 🟡 "International English Language Testing System (IELTS™)" | 🟡 "Spoken English Assessment" |
| **Required legal disclaimer** | 🔴 draft below — **needs legal sign-off** | 🔴 draft below — **needs legal sign-off** |
| **Trademark owner** | ✅ British Council, IDP: IELTS Australia, and Cambridge University Press & Assessment | 🟡 Council of Europe (CEFR reference framework) |

**Drafts currently in the code** (placeholders, not approved copy):

> **IELTS:** "TestCrack is a preparation and coaching platform. We are not an official IELTS test provider and are not affiliated with, endorsed by, or associated with the owners of the IELTS™ mark."

> **Spoken English:** "TestCrack is a preparation and coaching platform. Spoken English proficiency is reported against the Common European Framework of Reference for Languages (CEFR), a public reference framework."

**Three rules I've encoded, from TC-03 §5.1 — flagging so you know the constraints the fields enforce:**
1. **No exam name in any domain, product name or app name.** `testcrack.com/oet-preparation` is fine; "TestCrack OET" as a product name is not.
2. **Referential, descriptive use only** — "Preparation for the Occupational English Test (OET®)", never "OET Testing" or "Official OET".
3. **No third-party logos, marks or styling, ever.**

TC-03 §5.1 also flags a **1-hour opinion from an Indian IP lawyer** as a Founder action before any exam-name-bearing marketing copy ships. The disclaimer wording above is exactly the kind of text that should go through that review — please don't treat my drafts as approved.

**Note on Spoken English naming:** I deliberately avoided "CEFR" in the *public display name*. CEFR is a Council of Europe framework and safe to reference descriptively, but naming our product after it invites the same class of problem as rule 1. Referencing it in the disclaimer and as the score label is the safer split. Happy to be overruled.

---

## B. IELTS — confirm (we already implement this)

**1. Skills tested: Listening, Reading, Writing, Speaking — correct?**
✅ **Correct.** All four, unchanged. (TC-04 §2)

**2. Scoring stays: band 4.0–9.0, in 0.5 steps, overall = mean of 4 skills rounded to nearest 0.5 — correct?**
✅ **The overall rule is correct and is what we implement** — mean of the four skills, rounded to nearest 0.5. (TC-04 §3)

🟡 **Two clarifications on the details, both worth a yes/no from you:**

- **Range:** we don't currently enforce a **4.0 floor**. Our formatter handles the full 0–9 range, so a genuinely low score renders as e.g. `2.5`, not clamped to `4.0`. If the product should never display below 4.0, that's a one-line change — but I'd want it confirmed, because clamping means a student scoring 2.0 sees "4.0", which feels worse than showing the truth.
- **0.5 steps apply to the overall band only, not sub-skills.** A sub-skill mean of 6.25 displays as `6.3`, not `6.5`. This matters: rounding sub-skills to 0.5 would inflate them upward. I verified this against every existing screen today so nothing changed visually. Confirm this is the intended behaviour.

**3. Anything about IELTS scoring/display that should change?**
✅ **No change.** IELTS is the regression guard for the whole restructuring — TC-07 gate 1 is "zero IELTS regression / CI green" before any new exam registers, so we're deliberately changing nothing here.

---

## C. Spoken English (CEFR) — the main input we need

### Naming/format

**1. Which skills does it assess? Just Speaking, or Speaking + Listening?**
✅ **Speaking only for v1.** TC-03 §7 Q23: "Spoken English v1 scope — Speaking-only viva."

**2. Which sub-skills are scored?**
✅ **Five, and they're already specified** in TC-04 §4:

- Fluency
- Pronunciation (word-stress)
- Grammatical range
- Lexical resource
- Coherence

TC-04 §4 is also explicit about *why* these are scored per-question independently: it isolates each sub-skill "without a running conversation confounding them."

**3. Delivery format = viva, correct? Max viva questions per session?**
✅ **Viva, correct.** ✅ **10 is right, and it's cost-modelled** — TC-03 §7.1 prices a 10-question session at ≈$0.04 (≈₹3.5). Our config carries `maxVivaQuestions: 10`.

One note from TC-04 §4.5: the cap exists **not for cost** but because "an uncapped loop is an uncapped failure surface." So we treat it as a hard limit, not a suggestion. If you want a different number, the cost is negligible either way — but the API should be the authority on it, not the frontend.

**4. Does it reuse the existing Speaking question bank, or separate content?**
✅ **Reuses the existing bank.** TC-07 (Media Production): "Spoken English needs no new content — it reuses existing Speaking banks." The near-term work there is *curating and tagging* the existing bank for viva delivery (disconnected questions, sub-skill coverage), not writing new items.

⚠️ **One design property not to accidentally "fix":** viva questions are **deliberately disconnected** — no shared context between them (TC-04 §4). That's what isolates sub-skills. If the bank is tagged for conversational flow, it breaks the measurement.

---

### Scoring — the key part

**5. Which CEFR levels do we report? A1–C2, all or a subset?**
🟡 **We report all six** (A1, A2, B1, B2, C1, C2). This is my assumption, not a decision I found written down.

Worth noting two anchors from TC-03 that suggest the full range matters: German nursing recruiters specify **B2** explicitly (§2.1), and OET Grade B ≈ **C1** (§1.1). So at minimum B2 and C1 must be distinguishable.

**6. Per-skill mapping: for a score of 0–100%, what % range maps to each level?**

🔴 **This is the real blocker, and I want to flag a problem with the question itself before you answer it.**

⚠️ **Unit mismatch.** This document asks for a **0–100%** mapping. But TC-04 §2 stores the score in a **generic `band_score` Decimal**, and everything downstream — the competency matrix, the radar chart, drill targeting — is on the **0–9 scale** shared with IELTS. TC-04 §2 is explicit that a second exam must **not** get its own score column: "The moment a second exam needs its own score column, the model has failed."

So one of these needs deciding **before** the mapping table is filled in:

- **(i)** Spoken English scores are stored on the **0–9 scale** like IELTS, and the CEFR mapping is defined over 0–9. Keeps one scale everywhere, no schema change, competency matrix works unchanged. **My recommendation.**
- **(ii)** Scores are genuinely 0–100%, stored in `sub_scores` JSON, and the frontend converts. Then the radar chart and drill targeting need to know which scale they're reading, per exam.

**Answering the % table without settling this will give us a mapping we can't apply.**

🟡 **What we've implemented in the meantime** — over 0–9, so Phase 5 isn't blocked. **These numbers are a guess. They will ship if nobody corrects them:**

| Level | Our provisional range (0–9) | Equivalent if 0–100% |
|---|---|---|
| A1 | 0.0 – 2.4 | 0–27% |
| A2 | 2.5 – 3.9 | 28–43% |
| B1 | 4.0 – 5.4 | 44–60% |
| B2 | 5.5 – 6.9 | 61–77% |
| C1 | 7.0 – 7.9 | 78–88% |
| C2 | 8.0 – 9.0 | 89–100% |

The code prefers an explicit `cefr_level` string from the API over its own thresholding whenever one is present — so **once you give us the real mapping, or the backend starts returning the level directly, no frontend change is needed.**

**7. Overall level rule — how is the single overall CEFR level decided?**
✅ **Answered: (a) — average the sub-skill scores, then map that average to a level.**

TC-04 §3 specifies SPOKEN as "**Banded threshold over sub-skill means**", shape "Thresholding". That's option (a), and it's deliberately different from OET, which is weakest-link ("Weakest skill grade", shape "Minimum").

Worth knowing *why* this matters, from TC-03 §1.1: using a genuinely different aggregation from IELTS is the **point** of making Spoken English exam 2. Reusing IELTS banding "proves nothing" — it would only prove one code path still runs. So (a) vs (b) isn't cosmetic; if you'd prefer weakest-link, tell us now, because it changes what the abstraction is being tested against.

**8. Is there a target level concept, or a pass/certification threshold?**
🔴 **Open — needs a product decision.**

IELTS has `target_band`, used across the student dashboard, the diagnostic roadmap and the instructor "band gap" badge. Spoken English has no equivalent yet, so today those surfaces would show nothing for a Spoken English student.

🟡 If you want my default: **a target CEFR level per student, defaulting to B2** — it's the level German nursing recruitment specifies (TC-03 §2.1) and the most commonly requested corporate benchmark. That would let the existing gap/progress UI work unchanged.

On **certification**: I'd flag that any "pass" or "certified at B2" language needs a look at TC-03 §5.3 (CCPA Coaching Guidelines 2024) first. We're a preparation platform, not a certifying body, and outcome-style claims are regulated.

---

## D. Product scope for Spoken English

**9. Diagnostic + drills like IELTS, or only the viva assessment?**
✅ **Viva only for v1** (TC-03 §7 Q23).

🟡 **But with a nuance worth confirming:** TC-04 §4 says viva sub-skill means feed the **StudentCompetencyMatrix**, driving "radar chart and drill targeting, no special-casing." So the *plumbing* for drills is there even though no Spoken-English-specific drill content exists. My reading: a Spoken English student gets a competency radar from day one, and drill targeting becomes available as soon as speaking drills are tagged. Confirm whether that's the intent, or whether drills should be hidden entirely for Spoken English v1.

**10. Any exam-specific rules? (time limits, retakes, minimum attempts)**
🔴 **Time limits, retakes and minimum attempts: not specified anywhere I can find. Needs your input.**

✅ **The session rules we do have** (TC-04 §4.5) — these are already built as UI requirements, not edge cases:

| Situation | Behaviour |
|---|---|
| Mic or upload fails | `audio_url` null, allow re-record on that question, **never lose prior answers** |
| Transcription garbled | `scored_at` null, flag for retry, **do not block the session** |
| Session abandoned | Marked `ABANDONED`, partial results viewable, **never counts toward the Real Band Score** |
| Question cap | Hard limit from `maxVivaQuestions` |

Also relevant: **voice recordings are personal data under DPDP Rules 2025** (TC-04 §11 / TC-03 §5.4). Retention has to be set at build time — `retention_until` on `viva_answer` plus a scheduled purge — and under-18 students need verifiable guardian consent. If there's a retention period you want (30/90/365 days), that's worth stating here rather than discovering later.

---

### Priority — my summary of what's actually blocking

| # | Item | Status |
|---|---|---|
| **C6** | **Scale decision (0–9 vs 0–100%) — answer this first** | 🔴 blocks the mapping itself |
| **C6** | The CEFR threshold table | 🔴 blocking, provisional values shipping meanwhile |
| **A** | Legal disclaimer wording | 🔴 needed before anything Spoken-English-branded is shown to users |
| C5, C8, D9, D10 | Level subset, target level, drill visibility, time limits | 🟡 defaults in place, refine when you can |
| **B, C1–C4, C7** | Everything else | ✅ answered from the handbook — just confirm I've read it right |

**What's unblocked regardless:** the exam registry, the three legal fields, and the score-formatting layer are built and passing on IELTS with no visual change. Spoken English will render CEFR levels the moment the mapping is confirmed — and if the backend returns `cefr_level` directly, no frontend change is needed at all.
