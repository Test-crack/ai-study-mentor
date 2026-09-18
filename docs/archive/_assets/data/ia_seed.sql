-- ============================================================
-- IAQuestion Seed — 4 skill-wise INSERT commands
-- Run in pgAdmin Query Tool in the order shown below.
--
-- STEP 0 (run once): load the raw JSON into a temp staging table.
-- Paste the ENTIRE contents of ia_questions_seed.json (the full
-- JSON array) between the two $seed$ dollar-quote markers.
-- ============================================================

-- ── STEP 0: Staging table ─────────────────────────────────────
DROP TABLE IF EXISTS _ia_seed_stage;
CREATE TEMP TABLE _ia_seed_stage AS
SELECT jsonb_array_elements($seed$
PASTE_FULL_JSON_ARRAY_HERE
$seed$::jsonb) AS q;

-- Verify row count before inserting (should be 300):
-- SELECT COUNT(*), q->>'skill' AS skill FROM _ia_seed_stage GROUP BY skill ORDER BY skill;


-- ── COMMAND 1: WRITING — 120 questions ────────────────────────

INSERT INTO "IAQuestion"
  (skill, sub_skill, question_type, passage_id, passage_text,
   audio_url, prompt_text, options, correct_answer, explanation, difficulty)
SELECT
    (q->>'skill')::"IeltsSkillType",
    (q->>'sub_skill')::"IeltsSubSkillType",
    q->>'question_type',
    NULLIF(q->>'passage_id',    ''),
    NULLIF(q->>'passage_text',  ''),
    NULLIF(q->>'audio_url',     ''),
    q->>'prompt_text',
    CASE WHEN q->'options'       = 'null'::jsonb OR q->'options'       IS NULL THEN NULL ELSE q->'options'       END,
    CASE WHEN q->'correct_answer'= 'null'::jsonb OR q->'correct_answer' IS NULL THEN NULL ELSE q->'correct_answer' END,
    NULLIF(q->>'explanation', ''),
    (q->>'difficulty')::"DifficultyType"
FROM _ia_seed_stage
WHERE q->>'skill' = 'WRITING';

-- Expected rows inserted: 120


-- ── COMMAND 2: SPEAKING — 120 questions ───────────────────────

INSERT INTO "IAQuestion"
  (skill, sub_skill, question_type, passage_id, passage_text,
   audio_url, prompt_text, options, correct_answer, explanation, difficulty)
SELECT
    (q->>'skill')::"IeltsSkillType",
    (q->>'sub_skill')::"IeltsSubSkillType",
    q->>'question_type',
    NULLIF(q->>'passage_id',    ''),
    NULLIF(q->>'passage_text',  ''),
    NULLIF(q->>'audio_url',     ''),
    q->>'prompt_text',
    CASE WHEN q->'options'       = 'null'::jsonb OR q->'options'       IS NULL THEN NULL ELSE q->'options'       END,
    CASE WHEN q->'correct_answer'= 'null'::jsonb OR q->'correct_answer' IS NULL THEN NULL ELSE q->'correct_answer' END,
    NULLIF(q->>'explanation', ''),
    (q->>'difficulty')::"DifficultyType"
FROM _ia_seed_stage
WHERE q->>'skill' = 'SPEAKING';

-- Expected rows inserted: 120


-- ── COMMAND 3: READING — 30 questions ─────────────────────────

INSERT INTO "IAQuestion"
  (skill, sub_skill, question_type, passage_id, passage_text,
   audio_url, prompt_text, options, correct_answer, explanation, difficulty)
SELECT
    (q->>'skill')::"IeltsSkillType",
    (q->>'sub_skill')::"IeltsSubSkillType",
    q->>'question_type',
    NULLIF(q->>'passage_id',    ''),
    NULLIF(q->>'passage_text',  ''),
    NULLIF(q->>'audio_url',     ''),
    q->>'prompt_text',
    CASE WHEN q->'options'       = 'null'::jsonb OR q->'options'       IS NULL THEN NULL ELSE q->'options'       END,
    CASE WHEN q->'correct_answer'= 'null'::jsonb OR q->'correct_answer' IS NULL THEN NULL ELSE q->'correct_answer' END,
    NULLIF(q->>'explanation', ''),
    (q->>'difficulty')::"DifficultyType"
FROM _ia_seed_stage
WHERE q->>'skill' = 'READING';

-- Expected rows inserted: 30


-- ── COMMAND 4: LISTENING — 30 questions ───────────────────────

INSERT INTO "IAQuestion"
  (skill, sub_skill, question_type, passage_id, passage_text,
   audio_url, prompt_text, options, correct_answer, explanation, difficulty)
SELECT
    (q->>'skill')::"IeltsSkillType",
    (q->>'sub_skill')::"IeltsSubSkillType",
    q->>'question_type',
    NULLIF(q->>'passage_id',    ''),
    NULLIF(q->>'passage_text',  ''),
    NULLIF(q->>'audio_url',     ''),
    q->>'prompt_text',
    CASE WHEN q->'options'       = 'null'::jsonb OR q->'options'       IS NULL THEN NULL ELSE q->'options'       END,
    CASE WHEN q->'correct_answer'= 'null'::jsonb OR q->'correct_answer' IS NULL THEN NULL ELSE q->'correct_answer' END,
    NULLIF(q->>'explanation', ''),
    (q->>'difficulty')::"DifficultyType"
FROM _ia_seed_stage
WHERE q->>'skill' = 'LISTENING';

-- Expected rows inserted: 30


-- ── STEP 5: Verify ────────────────────────────────────────────
SELECT
    skill::text,
    sub_skill::text,
    difficulty::text,
    question_type,
    COUNT(*) AS cnt
FROM "IAQuestion"
GROUP BY skill, sub_skill, difficulty, question_type
ORDER BY skill, sub_skill, difficulty, question_type;

-- Grand total should be 300:
-- SELECT COUNT(*) FROM "IAQuestion";
