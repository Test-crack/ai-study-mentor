# Spoken English — Scoring Rubric & Diagnostic Content Pack

**From:** Paul
**Purpose:** unblocks items A (rubric) and B (diagnostic questions) in `SPOKEN-ENGLISH-GO-LIVE.md`, plus answers all 9 open questions.
**Product decisions made:** first cohort = general adult learners (no specific exam/job goal) · viva = fixed prompts, record-and-submit · Listening/Reading/Writing hidden entirely.

---

## 0. Answers to the 9 open questions (quick reference)

| # | Question | Decision |
|---|---|---|
| 1 | Rubric for 6 subskills | Section 2 below. Adapted from the CEFR Companion Volume's *Qualitative features of spoken language* grid, rewritten as scoring rules. |
| 2 | Scoring shape | AI assigns a **CEFR level per subskill** (half-steps allowed), we convert to a number. **Equal weight** across all six. |
| 3 | Guardrails | Section 4. Key rule: silence/inaudible = **retry then withhold**, never floor to Below A1. |
| 4 | Diagnostic prompts | Section 5. **8 prompts, one universal set, not level-tagged.** |
| 5 | Timing | Section 5. ~13 min of student-facing time inside the 15-min config. |
| 6 | Calibration | **Launch provisional + "estimate, not certified" disclaimer.** Calibrate after ~200 real graded responses. |
| 7 | Practice surfaces | **Hide L/R/W entirely.** Single-skill product. |
| 8 | Viva flow | Fixed prompts, record once per question, submit. No adaptive follow-ups in v1. |
| 9 | Target levels | Market **A1–B2**. C1/C2 remain scoreable but are not what we advertise or build content for. |

---

## 1. The one structural change: Interaction

CEFR's Interaction descriptor is about turn-taking with a live partner. Record-and-submit gives the grader no interlocutor, so the subskill has nothing to measure and the AI will produce noise.

**Do not remove it from the config.** Instead, for v1:

- **Internal name stays** `interaction` — no schema or config change.
- **Graded as:** how fully and directly the response addresses what was actually asked, and whether the speaker orients to a listener (acknowledges the question, signposts, uses appropriate register, closes the turn).
- **Student-facing label:** "Responsiveness".
- **Prompt 6** is a reply-to-a-voice-message task specifically so this subskill has genuine evidence.

When we build adaptive follow-ups later, this subskill reverts to true CEFR Interaction with no data model change.

---

## 2. The rubric — 6 subskills × 6 levels

Grader instruction: **assign one CEFR level per subskill independently.** Half-steps (`A2+`, `B1+`, `B2+`) are allowed. Do not average in your head — score each subskill on its own evidence, the aggregation engine handles the rest.

### 2.1 Range (what they can say)

| Level | What it looks like |
|---|---|
| Below A1 | Isolated words, memorised fragments. Cannot form a clause. |
| A1 | Basic phrases about self, family, immediate surroundings. Heavy repetition of the same few structures. |
| A2 | Enough vocabulary for routine everyday topics — work, shopping, family, habits. Simple sentences, mostly present tense, joined with "and"/"but"/"because". |
| B1 | Can talk about familiar topics without obviously searching for words, though vocabulary is plain and repetitive on unfamiliar ground. Can express opinion, describe experiences, narrate. |
| B2 | Broad enough range to describe, argue and explain without conspicuous searching. Varied sentence structures. Some idiom, occasionally imprecise. |
| C1 | Wide range, flexible reformulation. Can express fine shades of meaning; little sense of restriction. |
| C2 | Full flexibility. Precise, idiomatic, reformulates effortlessly. |

### 2.2 Accuracy (grammatical control)

| Level | What it looks like |
|---|---|
| Below A1 | No systematic grammar. |
| A1 | Controls a few memorised patterns; systematic basic errors throughout. |
| A2 | Simple structures mostly correct; still makes basic errors (tense, agreement, articles, prepositions) but meaning is usually clear. |
| B1 | Reasonable control of common structures. Errors occur, especially under pressure or on complex sentences, but rarely obscure meaning. |
| B2 | Good control. Errors are occasional, non-systematic, and often self-corrected. Does not cause misunderstanding. |
| C1 | Consistently high accuracy; errors are rare and hard to spot. |
| C2 | Consistent control of complex language, even while attending to other things. |

> **Note for Indian English:** do not penalise standard Indian English usage (e.g. "I am having a doubt", "do the needful", present continuous for habitual). Penalise only what would impede a non-Indian listener.

### 2.3 Fluency

| Level | What it looks like |
|---|---|
| Below A1 | Cannot sustain speech. |
| A1 | Very short isolated utterances, heavy pausing, frequent restarts and false starts. |
| A2 | Makes themselves understood in short turns; pausing, hesitation and reformulation are very evident. |
| B1 | Can keep going comprehensibly, though pausing for grammar and vocabulary is noticeable, especially in longer stretches. |
| B2 | Fairly even tempo. Few noticeably long pauses. Hesitation exists but doesn't strain the listener. |
| C1 | Fluent and spontaneous. Almost effortless; only conceptually difficult content slows delivery. |
| C2 | Natural, effortless, well-paced throughout. |

### 2.4 Interaction → **Responsiveness** (v1 definition, see §1)

| Level | What it looks like |
|---|---|
| Below A1 | Response bears no relation to the prompt. |
| A1 | Answers only the most literal part of the question, in a word or phrase. |
| A2 | Answers the question but partially — misses a sub-part, or answers a simpler question than the one asked. Little listener orientation. |
| B1 | Answers the whole question. Some signposting ("first…", "the reason is…"). Register broadly appropriate. |
| B2 | Fully addresses the prompt including implied parts. Clear orientation to a listener — frames, signposts, closes the turn cleanly. |
| C1 | Handles the prompt with nuance; anticipates what the listener needs, adjusts register naturally. |
| C2 | Complete control of the task; shapes the response around the listener throughout. |

### 2.5 Coherence

| Level | What it looks like |
|---|---|
| Below A1 | No connected discourse. |
| A1 | Words and phrases linked with basic connectors ("and", "then"). |
| A2 | Can link a short sequence of points into a simple, mostly linear account. |
| B1 | Connects points into clear, connected discourse, though sequencing may jump and linking can be repetitive. |
| B2 | Clear, well-structured. Uses a range of linking and organisational devices; ideas develop logically. |
| C1 | Controlled use of organisational patterns and cohesive devices; smooth, well-shaped discourse. |
| C2 | Coherent and cohesive throughout, with full control of structuring devices. |

### 2.6 Phonological Control

| Level | What it looks like |
|---|---|
| Below A1 | Unintelligible. |
| A1 | Pronunciation of a very limited repertoire understandable only with effort from a sympathetic listener. |
| A2 | Generally intelligible despite a noticeable accent; listener sometimes needs to ask for repetition. |
| B1 | Clearly intelligible throughout, though accent is evident and individual sounds/stress are sometimes mispronounced. |
| B2 | Clear, natural pronunciation and intonation. Accent present but does not affect intelligibility. |
| C1 | Varies intonation and places stress correctly to express fine shades of meaning. |
| C2 | Full range of phonological features with high control, including stress, rhythm and intonation. |

> **Accent is not an error.** Score intelligibility and prosody, never accent proximity to a British or American norm. A strong Malayali accent that is fully intelligible is B2.

---

## 3. Level → number conversion (for the aggregation engine)

The engine takes 0–100 per subskill. We use the GSE-aligned 10–90 space **directly** — no rescaling. Nothing will ever score below 10 or above 90, and that's fine.

**Grader output → score:**

| Level | Score |
|---|---|
| Below A1 | 15 |
| A1 | 25 |
| A2 | 33 |
| A2+ | 39 |
| B1 | 46 |
| B1+ | 54 |
| B2 | 62 |
| B2+ | 71 |
| C1 | 80 |
| C2 | 87 |

**Mean of the 6 → reported CEFR level:**

| Mean score | Reported level |
|---|---|
| < 22 | Below A1 |
| 22 – 29 | A1 |
| 30 – 42 | A2 |
| 43 – 58 | B1 |
| 59 – 75 | B2 |
| 76 – 84 | C1 |
| 85 + | C2 |

These thresholds are **provisional**, borrowed from the published GSE↔CEFR alignment. They are not our calibration. Every result carries the "estimate, not official CEFR certification" disclaimer. Revisit after ~200 real graded responses.

---

## 4. Guardrails

Applied **per response**, before grading:

| Condition | Action |
|---|---|
| No speech, or under ~5 words | Not scored. Prompt student to retry once. |
| Retry also empty | Mark response `no_response`, exclude from all subskill averages. |
| Audio inaudible / unusable quality | Retry once. **Never charge this to Phonology** — it's an equipment problem. |
| Response not in English | Not scored, retry once, then `no_response`. |
| Under ~25 words on a main prompt (not warm-up) | Grade it, but **cap every subskill at A2** and note "response too short to demonstrate higher level". |
| Off-topic but fluent | Grade Range / Accuracy / Fluency / Phonology normally. **Cap Responsiveness and Coherence at A2.** |
| ≥ 4 of 8 prompts end as `no_response` | **Withhold the result.** Show "Diagnostic incomplete — please retake". Do **not** report Below A1. |

**The rule that matters:** a dead microphone and a genuine beginner produce identical audio. Flooring silence to Below A1 tells a paying student they can't speak English because their laptop failed. Always retry, then withhold.

Scripted/memorised delivery: flag it in the internal record for review, but do not auto-penalise in v1.

---

## 5. Diagnostic question bank — 8 prompts

**One universal set, not level-tagged.** A diagnostic has to find the student's level, so it must span A1 to C1 within a single sitting. The ladder below does that: prompts 1–3 are answerable at A1–A2, 4–6 need B1, 7–8 need B2+. A student's ceiling shows up naturally as the prompts get harder.

Total student-facing time ≈ 13 min, inside the 15-min config.

| # | Type | Prompt | Prep | Speak |
|---|---|---|---|---|
| 1 | Warm-up | Tell us about yourself — your name, where you're from, and what you do. | 0s | 45s |
| 2 | Routine | Describe a typical day for you, from morning to evening. | 10s | 60s |
| 3 | Description | Describe a place you know well — your home, your neighbourhood, or your workplace. What does it look like, and what do you like about it? | 15s | 75s |
| 4 | Narration | Tell us about a journey or a day you remember clearly. What happened, and why has it stayed with you? | 20s | 90s |
| 5 | Opinion | If you could change one thing about the place you live, what would it be and why? | 20s | 90s |
| 6 | **Reply task** | *[Student hears a ~20s recorded voice message: a friend asking for advice about whether to take a new job in another city.]* Reply to your friend. Give them your advice and your reasons. | 20s | 90s |
| 7 | Compare | Some people prefer learning in a classroom, others prefer learning online. Compare the two, and say which suits you better. | 25s | 105s |
| 8 | Abstract | Imagine you were put in charge of education in your state for one year. What would you change — and what do you think would be difficult about actually doing it? | 30s | 120s |

**Engineering notes:**
- Prompt 6 needs one recorded audio asset (~20s). Any clear speaker. This is the only prompt that carries real Responsiveness evidence — don't cut it.
- Prompts are shown as text **and** read aloud. Some target users at A1–A2 read English better than they hear it, and vice versa; showing both stops us accidentally testing reading.
- No prompt requires cultural or specialist knowledge. This is deliberate — general adult learners, no assumed background.
- Record once per prompt. One retry only if a guardrail in §4 fires.
- Sets: build one set now. Structure the schema so alternate sets can be added later (retake integrity) without a code change.

---

## 6. What's still open (not blocking)

- Daily drills, internal assessments and mock test content — deferred. Diagnostic first.
- Calibration study — after launch, on real data.
- Adaptive follow-ups / live conversation — v2. Responsiveness reverts to true Interaction then.
