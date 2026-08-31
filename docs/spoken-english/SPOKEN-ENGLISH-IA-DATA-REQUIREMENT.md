# Spoken English — Internal Assessment (IA) Content Data Requirement

**For:** the content/data team.
**What this is:** the exact content to author + seed so a Spoken English student's **monthly
Internal Assessment (IA)** works. Everything is tagged `exam_id = 'spoken_english'` so it never
mixes with IELTS IA content.

---

## 0. How the SE IA works (so you know what to author)

An IA is a **short speaking re-assessment** that updates the student's CEFR sub-scores.

1. The system picks the **2 subskills** the student should be assessed on — the **weakest**
   ones where they've also **been drilling** (so they can show improvement). Same idea as the
   IELTS IA "carry-forward + fresh weakest."
2. For each of those 2 subskills, the student answers **2 speaking prompts** targeting that
   subskill (record-and-submit, exactly like the diagnostic viva).
3. Answers are graded by the same viva pipeline → CEFR levels per subskill → the competency
   matrix updates (with smoothing), momentum is awarded.

So you author a **pool of speaking prompts, tagged by subskill and level.** The IA draws from
that pool for whichever 2 subskills a given student needs.

## The 6 subskills (tags)
`range`, `accuracy`, `fluency`, `interaction`, `coherence`, `phonology`
(These are the same CEFR subskills used in the diagnostic and drills.)

## Levels (difficulty buckets)
`BEGINNER` (CEFR a1–a2) · `INTERMEDIATE` (b1–b2) · `ADVANCED` (c1). Cohort 1 focuses
**BEGINNER + INTERMEDIATE**; ADVANCED optional.

---

## 1. Minimum content (the pool)

**Per subskill, per level: ≥ 3 speaking prompts.** The IA serves 2 per subskill and must not
repeat across a student's monthly IAs, so a pool of 3+ per (subskill × level) gives several
IA cycles before recycling.

| Subskill | BEGINNER | INTERMEDIATE | ADVANCED | Cohort-1 min (B+I) |
|---|---|---|---|---|
| range / accuracy / fluency / interaction / coherence / phonology | 3 each | 3 each | 3 each | 6 each |
| **Totals** | 18 | 18 | 18 | **36** |

- **Cohort-1 minimum: 36 prompts** (6 subskills × 2 levels × 3). **Full: 54** (add ADVANCED).
- These are **speaking** prompts (audio answers), *not* MCQs. MCQs are only for daily drills.

---

## 2. Prompt format (one row per prompt → seeds `ia_questions`)

| Column | Required | Values / notes |
|---|---|---|
| `source_key` | ✅ | unique, e.g. `se_ia_fluency_b1_01`. Never reuse. |
| `subskill` | ✅ | `range \| accuracy \| fluency \| interaction \| coherence \| phonology` (the subskill this prompt primarily assesses) |
| `target_level` | ✅ | `a1 \| a2 \| b1 \| b2 \| c1` (we bucket to BEGINNER/INTERMEDIATE/ADVANCED) |
| `display` | ✅ | `audio` (student hears the question) · `text` (read-aloud passage) · `reply` (hears a voice message, then replies) |
| `prompt_text` | ✅ | the question wording. For `reply`, an instruction; for `text`, the read-aloud passage goes in `passage_text` |
| `passage_text` | text only | the exact sentence/paragraph the student reads aloud |
| `audio_file` | audio/reply | WAV filename = `source_key`.wav (see §3). Not needed for `text` items |
| `prep_seconds` | ✅ | thinking time, e.g. 10–30 |
| `speak_seconds` | ✅ | speaking limit, e.g. 45–120 |
| `scored_subskills` | optional | defaults to `subskill`. Read-aloud → `phonology,fluency`. Reply → include `interaction` |
| `exemplar` / `focus_tip` | optional | what a strong answer contains / one coaching cue (reference, not an answer key) |

**Which display type suits which subskill (guidance, not a hard rule):**
- `interaction` → **reply** (voice message → respond) — this is where Responsiveness shows.
- `phonology` → **text** (read-aloud) and/or `audio`.
- `range / accuracy / fluency / coherence` → **audio** (open speaking question).

### Example rows (CSV-style)
```
source_key,subskill,target_level,display,prompt_text,passage_text,audio_file,prep_seconds,speak_seconds,scored_subskills
se_ia_fluency_b1_01,fluency,b1,audio,"Describe a hobby you enjoy and why you find it relaxing.",,se_ia_fluency_b1_01.wav,15,75,
se_ia_phonology_a2_02,phonology,a2,text,"Read the sentence aloud clearly.","The weather changes quickly in the mountains, so pack warm clothes.",,20,45,"phonology,fluency"
se_ia_interaction_b2_01,interaction,b2,reply,"Listen to the voice message and reply with your advice.",,se_ia_interaction_b2_01.wav,20,90,"interaction,coherence"
```

---

## 3. Audio to record + deliver (only `audio` / `reply` items; `text` needs none)
- WAV, mono, clean single speaker, normalized (~0.5–1 MB each). Filename = `source_key`.wav.
- `reply` items: a natural ~15–20s everyday voice message (like diagnostic Prompt 6).
- Delivered into `frontend/public/ia/spoken-english/` (folder per subskill is fine).

---

## 4. Backend fields (reference — not the content team's job)
Seeds into `ia_questions` with `skill='SPEAKING'`, `question_type='SPEAKING_PROMPT'`,
`sub_skill=<SubSkillType>` (range→VOCABULARY, accuracy→GRAMMAR, fluency→FLUENCY,
interaction→INTERACTION, coherence→COHERENCE, phonology→PRONUNCIATION),
`difficulty=<BEGINNER|INTERMEDIATE|ADVANCED>`, `exam_id='spoken_english'`, and
`prep/speak/display/scored_subskills` in `options` (JSON). Grading uses the viva pipeline.

---

## 5. Delivery
One spreadsheet (columns per §2) + the WAV files named by `source_key`. Backend seeds it into
`ia_questions` with `exam_id='spoken_english'`. **Cohort-1 minimum: 36 speaking prompts + ~24 WAVs**
(the `text`/read-aloud items need no audio).
