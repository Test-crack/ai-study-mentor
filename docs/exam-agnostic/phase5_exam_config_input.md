# Exam Config — Info Needed (for Phase 5)

**For:** Paul
**Why:** We're building a single "exam engine" so each exam's names, legal text, skills, and scoring live in one place. We need the real values for the two exams going live now — **IELTS** and **Spoken English**. IELTS is mostly confirmation; **Spoken English scoring is the main unknown.**

Please fill the blanks (rough is fine — we'll tighten). Anything you leave blank, we'll stub with a `TODO` and it won't block the rest of Phase 5.

---

## A. Legal & naming (both exams)

These three fields exist so no developer ever hand-types an exam name into the UI — it all reads from your values.

| Field | IELTS | Spoken English |
|---|---|---|
| **Public display name** (short UI label) | `IELTS` ? | `Spoken English` ? |
| **Legal display name** (marketing-safe phrasing) | e.g. "Preparation for IELTS" — confirm | e.g. "Spoken English (CEFR)" — confirm |
| **Required legal disclaimer** (verbatim text to show) | ? | ? |
| **Trademark owner** (exact legal entity) | British Council / IDP / Cambridge? confirm | Council of Europe? confirm |

---

## B. IELTS — confirm (we already implement this)

1. Skills tested: **Listening, Reading, Writing, Speaking** — correct?
2. Scoring stays: band **4.0–9.0**, in **0.5** steps, overall = **mean of 4 skills rounded to nearest 0.5** — correct?
3. Anything about IELTS scoring/display that should change? (default: no change)

---

## C. Spoken English (CEFR) — the main input we need

**Naming/format**
1. Which skills does it assess? Just **Speaking**, or **Speaking + Listening**?
2. Which **sub-skills** are scored? (e.g. Fluency, Pronunciation, Grammar, Vocabulary, Coherence — tick which apply)
3. Delivery format = **viva** (spoken Q&A), correct? Max number of viva questions per session? (we assumed **10**)
4. Does it reuse the existing Speaking question bank, or is there separate content?

**Scoring — the key part**
5. Which CEFR levels do we report? **A1, A2, B1, B2, C1, C2** — all, or a subset?
6. **Per-skill mapping:** for a performance score of 0–100%, what % range maps to each level? e.g.

   | Level | Score range |
   |---|---|
   | A1 | 0–? % |
   | A2 | ?–? % |
   | B1 | ?–? % |
   | B2 | ?–? % |
   | C1 | ?–? % |
   | C2 | ?–100 % |

7. **Overall level rule** — how is the single overall CEFR level decided from the sub-skills? Pick one (or describe):
   - (a) Average the sub-skill %s, then map that average to a level.
   - (b) The level where **all** sub-skills clear that level's threshold (weakest-link).
   - (c) Something else: ______________________
8. Is there a **target level** concept for students (like IELTS target band), or a **pass/certification** threshold?

---

## D. Product scope for Spoken English (helps us wire it right later)

9. Does Spoken English have a **diagnostic + drills** like IELTS, or **only the viva assessment**?
10. Any exam-specific rules we should know (time limits, retakes, minimum attempts)?

---

### Priority
The one thing that actually blocks scoring is **Section C, questions 5–7 (the CEFR mapping + overall rule)**. Everything else we can proceed on sensible defaults and refine. Legal text (Section A) we need before anything Spoken-English-branded is shown to users.
