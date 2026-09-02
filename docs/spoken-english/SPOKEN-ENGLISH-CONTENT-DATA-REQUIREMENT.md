# Spoken English — Content / Data Requirement (for the data & content team)

**Goal:** the exact content to author + seed so a Spoken English student has a full journey:
**Diagnostic → Daily Drills → Internal Assessment (IA) → Mock**. Everything is tagged
`exam_id = 'spoken_english'` so it never mixes with IELTS content.

**Two content shapes (important):**
- **Daily Drills = MCQs** (recognition practice on the 6 subskills). Fits the existing MCQ drill
  architecture — fast to author, no audio, no AI grading. *(This replaces the earlier audio-drill idea.)*
- **Diagnostic / IA / Mock = AI-graded speaking prompts** (record-and-submit, like the viva).
- **LexiGrid** (vocab game) is **not** part of SE content — it may be removed for SE later; the
  MCQ `range` drills cover vocabulary. Do **not** author LexiGrid content for SE.

---

## 0. The model you're authoring against

- **One skill:** Speaking. **Six subskills** (the only tags that matter):
  `range`, `accuracy`, `fluency`, `interaction`, `coherence`, `phonology`.
- **Levels are CEFR:** `a1, a2, b1, b2, c1`. Cohort 1 focuses **A1–B2**; C1 optional.
- Grouped into 3 **bands** for pooling: **A** = a1–a2, **B** = b1–b2, **C** = c1+.

---

## 1. Diagnostic — ✅ DONE (review only)

Seeded (17 rows: 7 prompt sets, p6 with 5 variants) in
`backend/prisma/seeds/spoken_english_viva.sql`; audio in `frontend/public/diagnostics/spoken-english/`.

**Review checklist:** on-screen/spoken text matches audio · read-aloud passage reads naturally
(~B1–B2) · voice-message variants state a clear ~20s dilemma · audio clean, single speaker, normalized.

No new diagnostic content needed.

---

## 2. Daily Drill — **MCQs only**, subskill-based

**Purpose:** a short daily set of MCQs targeting the student's weak subskill(s). A drill session
serves ~5 questions. No audio, no recording — pure MCQ (stem + 3–4 options + correct answer +
explanation). Grading is automatic (exact match).

**How each subskill is tested as an MCQ:**
| Subskill | MCQ idea | Example stem |
|---|---|---|
| `range` | best word / synonym / collocation | "Choose the word closest to **exhausted**." |
| `accuracy` | pick the correct sentence / fix the error | "Which sentence is grammatically correct?" |
| `fluency` | most natural phrasing / linking chunk | "Which sounds most natural in conversation?" |
| `interaction` | appropriate response / register | "A colleague says '…'. Which reply is most appropriate?" |
| `coherence` | best connector / sentence order | "Choose the best linking word: '… , ___ , …'." |
| `phonology` | same sound / word stress / minimal pair | "Which word has the same vowel sound as **ship**?" |

**Minimum counts** (distinct MCQs per subskill × band):

| Subskill | Band A (a1–a2) | Band B (b1–b2) | Band C (c1) | Cohort-1 min (A+B) |
|---|---|---|---|---|
| range / accuracy / fluency / interaction / coherence / phonology | 12 each | 12 each | 12 each | 24 each |
| **Totals** | 72 | 72 | 72 | **144** |

- **Cohort-1 minimum: 144 MCQs** (6 subskills × 2 bands × 12). **Full: 216** (add band C).
- 12 per (subskill × band) ≈ 2–3 fresh 5-question sessions before recycling.

**Lands in:** `drill_questions` — `skill=SPEAKING`, `exam_id='spoken_english'`, `drill_type='MCQ'`,
`options` + `correct_answer` + `explanation` populated. **Format in §5A.**

---

## 3. Internal Assessment (IA) — periodic mini-viva (**audio, speaking**)

**Purpose:** a monthly checkpoint. Each IA picks a few subskills (3–4 speaking prompts). AI-graded.

**Minimum counts** (speaking prompts per subskill, across levels):

| Subskill | a2 | b1 | b2 | min per subskill |
|---|---|---|---|---|
| range / accuracy / fluency / interaction / coherence / phonology | 1 | 2 | 1 | **4 each** |

- **Minimum: 24** speaking prompts (6 × 4) → ~4–6 monthly cycles without repeats.
- `interaction` → **reply** style (voice message → respond); `phonology` → **read-aloud**.

**Lands in:** `ia_questions` — `skill=SPEAKING`, `exam_id='spoken_english'`, `question_type='SPEAKING_PROMPT'`,
`difficulty ∈ {BEGINNER, INTERMEDIATE, ADVANCED}` (a1–a2→BEGINNER, b1–b2→INTERMEDIATE, c1→ADVANCED). **Format §5B.**

---

## 4. Mock — full speaking mock (**audio, speaking**)

**Purpose:** a full mock = a complete viva covering all 6 subskills, structured like the diagnostic
(warm-up → varied task types → abstract/proposal). One **form** = 6–7 prompts spanning A1→B2+.

| | Prompts per form | Forms | Total |
|---|---|---|---|
| Mock | 7 (1 warm-up, 1 read-aloud, 1 reply, 4 open across levels) | **3** | **21** |

- **Minimum: 21** (3 alternate forms × 7).

**Lands in:** `mock_questions` — `skill=SPEAKING`, `exam_id='spoken_english'`, `question_type='SPEAKING_PROMPT'`,
`task_type` = warm_up / read_aloud / reply / open. **Format §5B.**

---

## 5A. MCQ format — Daily Drills

One row per MCQ (maps 1:1 to `drill_questions`):

| Column | Required | Values / notes |
|---|---|---|
| `source_key` | ✅ | unique, e.g. `se_drill_range_b1_01`. Never reuse. |
| `subskill` | ✅ | `range \| accuracy \| fluency \| interaction \| coherence \| phonology` |
| `target_level` | ✅ | `a1 \| a2 \| b1 \| b2 \| c1` |
| `drill_type` | ✅ | `MCQ` (or a finer tag: `best_word`, `error_id`, `linker`, `response_choice`, `sound_match`) |
| `prompt_text` | ✅ | the question stem |
| `options` | ✅ | 3–4 choices, e.g. `["tired","angry","hungry","late"]` |
| `correct_answer` | ✅ | the correct choice (value or 0-based index) |
| `explanation` | ✅ | one line shown after answering (why it's right) |

**Example rows (CSV-style):**
```
source_key,subskill,target_level,drill_type,prompt_text,options,correct_answer,explanation
se_drill_range_b1_01,range,b1,best_word,"Choose the word closest to 'exhausted'.","[""tired"",""angry"",""hungry"",""late""]",tired,"'exhausted' = very tired"
se_drill_accuracy_a2_03,accuracy,a2,error_id,"Which sentence is correct?","[""He go to work"",""He goes to work"",""He going to work""]","He goes to work","3rd person singular takes -s"
se_drill_coherence_b2_02,coherence,b2,linker,"'I was tired; ___, I finished the report.'","[""however"",""because"",""nevertheless"",""so""]",nevertheless,"contrast despite difficulty"
se_drill_phonology_a2_05,phonology,a2,sound_match,"Which word rhymes with 'ship'?","[""sheep"",""chip"",""shape"",""shop""]",chip,"short /ɪ/ vowel"
```

## 5B. Speaking-prompt format — IA & Mock (same shape as the diagnostic)

One row per prompt:

| Column | Required | Values / notes |
|---|---|---|
| `source_key` | ✅ | unique, e.g. `se_ia_fluency_b2_02`, `se_mock_f1_p3` |
| `usage` | ✅ | `ia` \| `mock` |
| `subskill` | ✅ | primary subskill (mock: the one it most tests) |
| `target_level` | ✅ | `a1…c1` |
| `display` | ✅ | `audio` (hear the question) \| `text` (read-aloud) \| `reply` (voice message → respond) |
| `prompt_text` | ✅ | transcript of the stimulus (grader context) / read-aloud instruction |
| `passage_text` | text only | the sentence/paragraph to read aloud |
| `audio_file` | audio/reply | WAV filename = `source_key`.wav (see §6) |
| `prep_seconds` / `speak_seconds` | ✅ | e.g. 0–30 / 45–120 |
| `scored_subskills` | optional | default = `subskill`; read-aloud → `phonology,fluency` |
| `exemplar` / `focus_tip` | optional | what a strong answer contains / one coaching cue (reference, not a key) |
| `mock_form` | mock only | form + sequence, e.g. `f1:3` |

---

## 6. Audio to record + deliver (IA & Mock only — **drills need none**)

- WAV, mono, clean single speaker, normalized (~0.5–1 MB each). Filename = `source_key`.wav.
- `text` (read-aloud) items need no audio; `audio`/`reply` items do.
- Delivered into `frontend/public/diagnostics/spoken-english/<usage>/…`.
- `reply` items: a clear everyday dilemma in ~15–20s (like diagnostic prompt 6).

---

## 7. Backend prerequisites (flag to backend — NOT the content team's job)

1. **Subskill tags:** `SubSkillType` enum lacks `range/accuracy/interaction/phonology`. For **MCQ
   drills** (which select on the `sub_skill` column) map to existing where clean —
   `range→VOCABULARY, accuracy→GRAMMAR, fluency→FLUENCY, coherence→COHERENCE, phonology→PRONUNCIATION`
   — and add **`INTERACTION`** (or reuse `TASK_RESPONSE`). Keep the true CEFR subskill in a column/`options` too.
2. **Level mapping:** drill uses `RecommendationLevel`, IA uses `DifficultyType` (both BEGINNER/
   INTERMEDIATE/ADVANCED). Store the true CEFR `target_level` in `options`; map to the bucket for the column.
3. **IA/Mock grading:** speaking answers graded by the **same viva pipeline** (`services/viva`) with
   the item's `scored_subskills`, so scores stay CEFR-consistent. (Drills are auto-scored — no AI.)
4. ~~`drill_questions.correct_answer` NOT NULL workaround~~ — **no longer needed**: MCQ drills have real answers.

---

## 8. Minimum totals (cohort 1)

| Content | Shape | Minimum items | Audio files |
|---|---|---|---|
| Diagnostic | speaking | ✅ done (17) | done |
| Daily Drill | **MCQ** | **144** (A+B; full 216) | **none** |
| IA | speaking | **24** | ~16 (audio/reply subset) |
| Mock | speaking | **21** (3 forms × 7) | ~15 (audio/reply subset) |
| **New total** | — | **144 MCQ + 45 speaking** | **≈ 30 WAV** |

Deliver as **one spreadsheet, one tab per type** (Drills tab uses §5A columns; IA + Mock tabs use
§5B), plus the WAV files (IA/mock only) named by `source_key`. Backend seeds each tab into its table
with `exam_id='spoken_english'`.
