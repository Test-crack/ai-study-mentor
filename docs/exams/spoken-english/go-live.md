# Spoken English — Go-Live Requirements & Open Questions

**For:** Paul
**Purpose:** what we need (inputs + decisions) to launch **Spoken English (CEFR-aligned)** as a standalone exam. This deployment will offer **only Spoken English**.
**TL;DR:** the *platform* is ready — registration, subscriptions, the CEFR scoring **engine**, and exam-scoped content all exist. What's missing is **exam-specific**: (1) the **scoring rubric/logic** that turns a spoken answer into subskill scores, (2) the **diagnostic questions**, (3) a **calibration decision**, and (4) some **UI work** (ours). This doc lists exactly what we need from you vs. what we build.

---

## 1. What already exists (the foundation) ✅
- **Registration & subscriptions** — an institute can be created and subscribed to Spoken English today.
- **Exam config** — Spoken English is already defined: CEFR-aligned, **Speaking is the only scored component**; Listening/Reading/Writing are optional practice surfaces (not scored). Speaking has **6 subskills**: Range, Accuracy, Fluency, Interaction, Coherence, Phonological Control. Delivery is a 15-minute **viva** (spoken interaction).
- **Scoring engine (aggregation)** — the engine can take a **percentage (0–100) per subskill**, average them, and map the result to a **CEFR level** (Below A1 → C2), plus show a per-subskill breakdown. This is built and tested.
- **Content is exam-scoped** — once Spoken English questions are loaded, students on this exam automatically get *those* questions (not IELTS).

So the "plumbing" is done. The remaining work is the **Spoken-English-specific brains and content**.

---

## 2. What we need to go live

### A. 🔴 The scoring logic (Speaking grader) — needs your input
The engine can *aggregate* subskill scores, but it can't yet *produce* them. We need the **grading rubric**: given a student's spoken response, how do we score each of the **6 subskills**?

The engine expects a **0–100 score per subskill** (or a CEFR level per subskill that we convert). To build the AI grader, we need from you:
1. **A rubric / descriptors for each of the 6 subskills** — ideally what an A1 / A2 / B1 / B2 / C1 / C2 answer looks like for *each* of Range, Accuracy, Fluency, Interaction, Coherence, Phonology. (This is the single most important input — it *is* the scoring logic.)
2. **How a response maps to a score** — do you want the AI to assign a CEFR level per subskill (we convert to %), or a direct 0–100? Any weighting between the 6, or equal?
3. **Hard rules / guardrails** — e.g., no speech / too short / off-topic / inaudible → what happens (floor to Below A1? ask to retry?).
4. **Reference material** — any existing rubric, sample-graded answers, or examiner guidance we can encode/calibrate against.

> Without the rubric, we can build the *mechanism* but not the *judgement*. This is the critical path.

### B. 🔴 Diagnostic questions (content) — needs your content
We need the **Spoken English diagnostic question bank** — the prompts a student speaks to during the diagnostic. We need:
1. **The prompts themselves** — the viva is configured for **5–10 questions**. What are they? (open-ended speaking prompts, describe-a-picture, opinion questions, role-play, etc.)
2. **Format & structure** — one fixed set, or several sets? Any warm-up vs. main questions? Follow-up prompts?
3. **Difficulty / level tagging** — should prompts be tagged by level (so we serve an appropriate set), or is it one universal diagnostic?
4. **Timing** — time allowed per question / overall (config default is 15 min total).
5. *(Later, not needed for first launch)* the same for daily drills, internal assessments, and mock tests — but **diagnostic questions are the priority to start.**

### C. 🟡 CEFR level calibration — a decision
The CEFR cut-offs (what % = A1 vs A2 vs B1 …) are currently **provisional** — borrowed from a published GSE→CEFR mapping, **not our own validated calibration**. The config already labels results as *estimates, not official CEFR certification*.
- **Decision needed:** launch with **provisional thresholds + the "estimate, not certified" disclaimer** (recommended — get live, calibrate later with real data), **or** run a calibration study first (delays launch).
- **Our recommendation:** launch provisional with the disclaimer; refine thresholds after we have real graded responses.

### D. 🔴 Student & instructor UI (our engineering work — flagging for awareness)
The current student and instructor screens are **hardcoded for IELTS** (they show 4 skills and a 4–9 band score). A Spoken English student would see a confusing 4-skill dashboard with a band scale that doesn't apply. **We will make the UI read the exam config** so a Spoken English user correctly sees **one Speaking component and CEFR levels**. This is on us — no input needed — but it's real work and part of go-live.
- **One small question:** for a Spoken-English-only product, should we **hide** the unused Listening/Reading/Writing practice surfaces entirely, or show them as optional practice?

### E. 🟡 Viva delivery / flow — confirm
Speaking is delivered as an interactive **viva** (record spoken answers to prompts). We need to confirm the exact flow:
- Fixed prompts or adaptive follow-ups?
- Record once per question, or continuous?
- Any live interaction, or record-and-submit?

---

## 3. Open questions for Paul (please answer these)
1. **Rubric:** can you provide CEFR descriptors (A1–C2) for each of the 6 subskills — Range, Accuracy, Fluency, Interaction, Coherence, Phonology?
2. **Scoring shape:** AI assigns a **CEFR level per subskill** (we convert to %), or a direct **0–100**? Equal weight across the 6, or weighted?
3. **Guardrails:** what should happen for no-speech / too-short / off-topic / inaudible responses?
4. **Diagnostic prompts:** the actual questions (5–10), their format, and whether they're level-tagged.
5. **Timing:** per-question and overall time limits for the viva.
6. **Calibration:** launch with provisional thresholds + disclaimer (recommended), or calibrate first?
7. **Practice surfaces:** hide Listening/Reading/Writing, or offer them as optional practice?
8. **Viva flow:** fixed vs adaptive, recording model, any live element?
9. **Target levels:** what CEFR levels are we targeting/marketing (e.g., A1–C1)? Any pass/target level per the product?

---

## 4. Who provides what

| Item | Owner | Status |
|---|---|---|
| Platform (registration, subscriptions, exam-scoping) | Eng | ✅ done |
| CEFR aggregation engine (subskill % → level) | Eng | ✅ done |
| **Speaking grading rubric / descriptors** | **Paul / academic** | ⛔ needed |
| **AI grader that outputs 6 subskill scores** | Eng (needs the rubric) | ⛔ blocked on rubric |
| **Diagnostic question bank** | **Paul / content** | ⛔ needed |
| CEFR threshold calibration | Paul (decision) + Eng | 🟡 decision |
| Student/instructor UI → config-driven (CEFR, 1 skill) | Eng | 🔴 to build |
| Viva delivery/runner | Eng | 🟡 confirm + finish |

---

## 5. Rough sequence
1. **Paul provides:** the 6-subskill rubric + the diagnostic prompts + answers to the questions above.
2. **Eng builds:** the CEFR Speaking grader (produces the 6 subskill scores) + wires it into the diagnostic → engine → CEFR result.
3. **Eng builds:** the config-driven student/instructor UI (Speaking-only, CEFR display) + confirms the viva flow.
4. **Load** the diagnostic question bank for Spoken English.
5. **Launch** with provisional CEFR thresholds + disclaimer; **calibrate** thresholds afterward with real data.

**Critical path = items A (rubric) and B (questions).** Everything else is engineering we can start in parallel, but the grader can't be finished without the rubric, and the diagnostic can't run without the questions.
