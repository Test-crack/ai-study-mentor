# Spoken English — Content / Data Requirement (for the data & content team)

**Goal:** the exact content to author + seed so a Spoken English student has a full journey:
**Diagnostic → Daily Drills → Internal Assessment (IA) → Mock**. Every item is an **AI-graded
speaking prompt** (there is no MCQ / answer key). Everything is tagged `exam_id = 'spoken_english'`
so it never mixes with IELTS content.

---

## 0. The model you're authoring against

- **One skill:** Speaking. **Six subskills** (the only tags that matter):
  `range`, `accuracy`, `fluency`, `interaction`, `coherence`, `phonology`.
- **Levels are CEFR:** `a1, a2, b1, b2, c1` (author to these; cohort 1 focuses **A1–B2**, C1 optional).
- Grouped into 3 **bands** for pooling: **A** = a1–a2, **B** = b1–b2, **C** = c1+.
- Every item = a **prompt** the student answers by speaking. Two delivery styles (same as the diagnostic):
  - **audio** — student *hears* the question (recorded stimulus), can replay, then speaks. No text shown.
  - **text** — read-aloud: an on-screen passage the student reads. No audio.
  - **reply** — student hears a short voice message and replies (tests `interaction`). Needs a recorded stimulus.

> There is **no `correct_answer`** — grading is done by the AI rubric. Instead you provide an
> optional **`exemplar`/`focus_tip`** (what a good answer contains / the one coaching cue). This is
> reference material for feedback, not a marking key.

---

## 1. Diagnostic — ✅ DONE (review only)

Already authored + seeded (17 rows: 7 prompt sets, p6 with 5 variants) in
`backend/prisma/seeds/spoken_english_viva.sql`, audio in
`frontend/public/diagnostics/spoken-english/`.

**Review checklist:**
- [ ] Each prompt's on-screen/spoken text matches its audio (transcripts were auto-generated — spot-check).
- [ ] Read-aloud (prompt 2) passages read naturally at ~B1–B2 difficulty.
- [ ] Voice-message variants (prompt 6, v1–v5) each state a clear dilemma in ~20s.
- [ ] Audio is clean, single speaker, normalized volume.

No new diagnostic content needed.

---

## 2. Daily Drill — targeted per-subskill speaking practice

**Purpose:** a short daily prompt targeting the student's weak subskill(s) (remediation triggers
below B1). One drill = one speaking prompt.

**Minimum counts** (per subskill × band, distinct prompts so daily rotation doesn't repeat):

| Subskill | Band A (a1–a2) | Band B (b1–b2) | Band C (c1) | Cohort-1 min (A+B) |
|---|---|---|---|---|
| range | 6 | 6 | 6 | 12 |
| accuracy | 6 | 6 | 6 | 12 |
| fluency | 6 | 6 | 6 | 12 |
| interaction | 6 | 6 | 6 | 12 |
| coherence | 6 | 6 | 6 | 12 |
| phonology | 6 | 6 | 6 | 12 |
| **Total** | 36 | 36 | 36 | **72** |

- **Cohort-1 minimum: 72** prompts (6 subskills × 2 bands × 6). **Full: 108** (add band C).
- `phonology` band items should be **read-aloud** (text) or minimal-pair sentences; the rest are
  short open prompts (audio or text-question).
- `interaction` items should be **reply** style (short voice-message → student responds).

**Lands in:** `drill_questions` — `skill=SPEAKING`, `exam_id='spoken_english'`, `drill_type='SPEAKING_PROMPT'`.

---

## 3. Internal Assessment (IA) — periodic mini-viva

**Purpose:** a monthly checkpoint. Each IA picks a few subskills to assess (3–4 prompts covering
selected subskills). Needs enough items to pick fresh ones each cycle.

**Minimum counts** (per subskill, across levels):

| Subskill | a2 | b1 | b2 | min per subskill |
|---|---|---|---|---|
| range / accuracy / fluency / interaction / coherence / phonology | 1 | 2 | 1 | **4 each** |

- **Minimum: 24** IA prompts (6 subskills × 4). Enough for ~4–6 monthly IA cycles without repeats.
- Same delivery rules (interaction→reply, phonology→read-aloud).

**Lands in:** `ia_questions` — `skill=SPEAKING`, `exam_id='spoken_english'`, `question_type='SPEAKING_PROMPT'`,
`difficulty ∈ {BEGINNER, INTERMEDIATE, ADVANCED}` (map a1–a2→BEGINNER, b1–b2→INTERMEDIATE, c1→ADVANCED).

---

## 4. Mock — full speaking mock (a fresh viva)

**Purpose:** a full mock = a complete viva covering all 6 subskills, structured like the diagnostic
(warm-up → range of task types → harder abstract/proposal). One mock **form** = 6–7 prompts.

**Minimum counts:**

| | Prompts per form | Forms | Total |
|---|---|---|---|
| Mock | 7 (1 warm-up, 1 read-aloud, 1 reply, 4 open across levels) | **3** | **21** |

- **Minimum: 21** (3 alternate forms × 7) — ≈ one quarter of monthly mocks. Each form must span
  A1→B2+ within the set (like the diagnostic ladder), so it can place any student.

**Lands in:** `mock_questions` — `skill=SPEAKING`, `exam_id='spoken_english'`, `question_type='SPEAKING_PROMPT'`,
`task_type` = the prompt type (warm_up / read_aloud / reply / open), `sub_skill` optional (the primary one).

---

## 5. The exact format to fill (one sheet, all types)

Author every item as a row with **these columns**. It maps 1:1 to the DB (backend loads it):

| Column | Required | Values / notes |
|---|---|---|
| `source_key` | ✅ | unique id, e.g. `se_drill_range_b1_01`, `se_ia_fluency_b2_02`, `se_mock_f1_p3`. **Never reuse.** |
| `usage` | ✅ | `drill` \| `ia` \| `mock` (which pool → which table) |
| `subskill` | ✅ | `range \| accuracy \| fluency \| interaction \| coherence \| phonology` (for mock: the primary one) |
| `target_level` | ✅ | CEFR the item is pitched at: `a1 \| a2 \| b1 \| b2 \| c1` |
| `display` | ✅ | `audio` \| `text` \| `reply` |
| `prompt_text` | ✅ | the question/instruction. For `audio`/`reply` it's the transcript of the stimulus (grader context); for `text` it's the read-aloud instruction |
| `passage_text` | text only | the sentence/paragraph the student reads aloud |
| `audio_file` | audio/reply | filename you deliver, e.g. `se_drill_interaction_b1_01.wav` (see §6) |
| `prep_seconds` | ✅ | thinking time before speaking (e.g. 0–30) |
| `speak_seconds` | ✅ | speaking limit (e.g. 45–120) |
| `scored_subskills` | optional | which subskills the answer feeds; default = `subskill`. Read-aloud → `phonology,fluency` |
| `exemplar` | optional | 1–2 lines: what a strong answer contains (reference for feedback; NOT a key) |
| `focus_tip` | optional | the single coaching cue for this item |
| `mock_form` | mock only | which form (`1/2/3`) and sequence, e.g. `f1:3` |

**Example rows (CSV-style):**
```
source_key,usage,subskill,target_level,display,prompt_text,passage_text,audio_file,prep_seconds,speak_seconds,scored_subskills,exemplar,focus_tip
se_drill_fluency_b1_01,drill,fluency,b1,audio,"Talk for a minute about your favourite way to spend a weekend.",,se_drill_fluency_b1_01.wav,10,60,fluency,"keeps going without long pauses; links ideas","don't stop to translate — paraphrase"
se_drill_phonology_a2_01,drill,phonology,a2,text,"Read the sentence aloud clearly.","She sells fresh fish and chips by the ship's shop.",,15,30,"phonology,fluency",,"contrast /s/ and /ʃ/"
se_ia_interaction_b1_01,ia,interaction,b1,reply,"Reply to your friend's message with advice.",,se_ia_interaction_b1_01.wav,20,75,interaction,"acknowledges the problem, gives a clear recommendation + reason","respond to what they actually asked"
se_mock_f1_p1,mock,fluency,a1,audio,"Introduce yourself — name, where you're from, what you do.",,se_mock_f1_p1.wav,0,45,,"clear self-intro","warm-up — just get talking"
```

---

## 6. Audio you must record + deliver (for `audio` and `reply` items)

- Format: **WAV**, mono, clean single speaker, normalized. ~0.5–1 MB each is fine.
- **Naming = `source_key` + `.wav`** (e.g. `se_drill_fluency_b1_01.wav`).
- `text` (read-aloud) items need **no audio**.
- Delivered into `frontend/public/diagnostics/spoken-english/<usage>/…` (backend `audio_url` points there).
- `reply` items: the voice message states a clear, everyday dilemma in ~15–20s (like diagnostic prompt 6).

---

## 7. Backend prerequisites (flag to the backend team — NOT the content team's job)

These must land before the above can be seeded cleanly (content authoring can proceed in parallel):
1. **Subskill tags:** `SubSkillType` enum lacks `range/accuracy/interaction/phonology`. Either extend
   the enum, or store the CEFR subskill in `options.subskill` + map. (Recommend: store in `options`,
   like the diagnostic, to avoid an enum migration.)
2. **No answer key:** `drill_questions.correct_answer` is `NOT NULL` (built for MCQ). For speaking,
   allow null or store `{}`; put `exemplar/focus_tip` in `explanation`/`options`.
3. **Level mapping:** drill uses `RecommendationLevel` (BEGINNER/INTERMEDIATE/ADVANCED), IA uses
   `DifficultyType`. Keep the true CEFR `target_level` in `options`; map to the enum bucket for the column.
4. **Grading reuse:** drill/IA/mock speaking answers should be graded by the **same viva pipeline**
   (`services/viva`) with the item's `scored_subskills`, so scores stay CEFR-consistent.

---

## 8. Minimum totals (cohort 1)

| Content | Minimum items | Audio files needed |
|---|---|---|
| Diagnostic | ✅ done (17) | done |
| Daily Drill | **72** (A+B bands) | ~ the audio/reply subset (~40–50) |
| IA | **24** | ~ the audio/reply subset (~16) |
| Mock | **21** (3 forms × 7) | ~ the audio/reply subset (~15) |
| **New total** | **≈ 117 prompts** | **≈ 70–80 WAV files** |

*Full coverage (adds band C to drills): ~153 prompts.*

Deliver as one spreadsheet (columns in §5), one tab per `usage`, plus the WAV files named by
`source_key`. Backend seeds each tab into its table with `exam_id='spoken_english'`.
