-- ============================================================
-- Internal Assessment — pgAdmin Migration Queries (v2)
-- Changes vs v1:
--   · Table names follow PascalCase convention: "IAQuestion", "IASession"
--   · band_level NUMERIC(2,1) replaced with difficulty "DifficultyType"
--
-- If you already ran the v1 SQL (ia_questions / ia_sessions),
-- run BLOCK 0 first to drop those before proceeding.
-- ============================================================


-- ────────────────────────────────────────────────────────────
-- BLOCK 0: Drop v1 tables if they exist (safe — no data yet)
-- ────────────────────────────────────────────────────────────

DROP TABLE IF EXISTS ia_sessions;
DROP TABLE IF EXISTS ia_questions;


-- ────────────────────────────────────────────────────────────
-- BLOCK 1: Add INTERNAL_ASSESSMENT to AssessmentModeType enum
-- ────────────────────────────────────────────────────────────

ALTER TYPE "AssessmentModeType" ADD VALUE IF NOT EXISTS 'INTERNAL_ASSESSMENT';

-- Verify:
-- SELECT unnest(enum_range(NULL::"AssessmentModeType"));


-- ────────────────────────────────────────────────────────────
-- BLOCK 2: Create IASessionStatus enum
-- ────────────────────────────────────────────────────────────

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'IASessionStatus') THEN
    CREATE TYPE "IASessionStatus" AS ENUM (
      'PENDING',
      'IN_PROGRESS',
      'COMPLETED',
      'MISSED'
    );
  END IF;
END
$$;

-- Verify:
-- SELECT unnest(enum_range(NULL::"IASessionStatus"));


-- ────────────────────────────────────────────────────────────
-- BLOCK 3: Create "IAQuestion" table (PascalCase, DifficultyType)
-- ────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS "IAQuestion" (
  id             UUID          PRIMARY KEY DEFAULT uuid_generate_v4(),
  skill          "IeltsSkillType"     NOT NULL,
  sub_skill      "IeltsSubSkillType"  NOT NULL,
  question_type  VARCHAR(30)   NOT NULL
                   CHECK (question_type IN ('MCQ', 'TFNG', 'WRITING_PROMPT', 'SPEAKING_PROMPT')),
  passage_id     VARCHAR(50),
  passage_text   TEXT,
  audio_url      VARCHAR(500),
  prompt_text    TEXT          NOT NULL,
  options        JSONB,
  correct_answer JSONB,
  explanation    TEXT,
  difficulty     "DifficultyType" NOT NULL,
  is_active      BOOLEAN       NOT NULL DEFAULT true,
  created_at     TIMESTAMPTZ   NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_iaquestion_skill_subskill
  ON "IAQuestion" (skill, sub_skill);

CREATE INDEX IF NOT EXISTS idx_iaquestion_difficulty
  ON "IAQuestion" (difficulty);

CREATE INDEX IF NOT EXISTS idx_iaquestion_active
  ON "IAQuestion" (is_active);

CREATE INDEX IF NOT EXISTS idx_iaquestion_passage
  ON "IAQuestion" (passage_id)
  WHERE passage_id IS NOT NULL;

-- Verify:
-- SELECT column_name, data_type, is_nullable
-- FROM information_schema.columns
-- WHERE table_name = 'IAQuestion'
-- ORDER BY ordinal_position;


-- ────────────────────────────────────────────────────────────
-- BLOCK 4: Create "IASession" table (PascalCase)
-- ────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS "IASession" (
  id                       UUID              PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id               UUID              NOT NULL
                             REFERENCES institute_students(id) ON DELETE CASCADE,
  ia_number                INT               NOT NULL,
  ia_date                  DATE              NOT NULL,
  status                   "IASessionStatus" NOT NULL DEFAULT 'PENDING',
  selected_subskills       JSONB             NOT NULL DEFAULT '[]',
  question_ids             JSONB             NOT NULL DEFAULT '[]',
  answers                  JSONB             NOT NULL DEFAULT '{}',
  time_started_at          TIMESTAMPTZ,
  time_submitted_at        TIMESTAMPTZ,
  window_closes_at         TIMESTAMPTZ       NOT NULL,
  scores                   JSONB,
  momentum_awarded         INT,
  carry_forward_subskills  JSONB             NOT NULL DEFAULT '[]',
  created_at               TIMESTAMPTZ       NOT NULL DEFAULT now(),

  CONSTRAINT uq_iasession_student_date UNIQUE (student_id, ia_date)
);

CREATE INDEX IF NOT EXISTS idx_iasession_student_id
  ON "IASession" (student_id);

CREATE INDEX IF NOT EXISTS idx_iasession_student_date
  ON "IASession" (student_id, ia_date);

CREATE INDEX IF NOT EXISTS idx_iasession_status
  ON "IASession" (status);

CREATE INDEX IF NOT EXISTS idx_iasession_open
  ON "IASession" (student_id, status)
  WHERE status IN ('PENDING', 'IN_PROGRESS');

-- Verify:
-- SELECT column_name, data_type, is_nullable
-- FROM information_schema.columns
-- WHERE table_name = 'IASession'
-- ORDER BY ordinal_position;


-- ────────────────────────────────────────────────────────────
-- BLOCK 5: Sanity check — confirm all objects exist
-- ────────────────────────────────────────────────────────────

SELECT
  '"IAQuestion"' AS table_name,
  COUNT(*)       AS row_count
FROM "IAQuestion"
UNION ALL
SELECT
  '"IASession"',
  COUNT(*)
FROM "IASession";

SELECT typname, enumlabel
FROM pg_enum e
JOIN pg_type t ON e.enumtypid = t.oid
WHERE typname IN ('AssessmentModeType', 'IASessionStatus', 'DifficultyType')
ORDER BY typname, enumsortorder;
