-- ============================================================
-- Migration: Multi-Tenant Institute Schema (Simplified)
-- Run this in Supabase SQL Editor
-- ============================================================

-- NOTE: The old "Instructor" table remains untouched (has Course relations).
-- The new "instructors" table is the clean go-forward table for institute instructors.

-- ============================================================
-- 1. INSTITUTES  (lean — just identity + address)
-- ============================================================
CREATE TABLE IF NOT EXISTS institutes (
  id           UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  name         VARCHAR(255) NOT NULL,
  address      TEXT,
  logo_url     TEXT,
  is_active    BOOLEAN      NOT NULL DEFAULT true,
  created_by   UUID         REFERENCES "User"(id) ON DELETE SET NULL,
  created_at   TIMESTAMPTZ  NOT NULL DEFAULT now(),
  updated_at   TIMESTAMPTZ  NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_institutes_is_active ON institutes(is_active);

-- ============================================================
-- 2. INSTITUTE OWNERS
-- ============================================================
CREATE TABLE IF NOT EXISTS institute_owners (
  id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID        NOT NULL UNIQUE REFERENCES "User"(id) ON DELETE CASCADE,
  institute_id UUID        NOT NULL REFERENCES institutes(id) ON DELETE CASCADE,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_institute_owners_institute ON institute_owners(institute_id);

-- ============================================================
-- 3. INSTITUTE ADMINS
-- ============================================================
CREATE TABLE IF NOT EXISTS institute_admins (
  id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID        NOT NULL UNIQUE REFERENCES "User"(id) ON DELETE CASCADE,
  institute_id UUID        NOT NULL REFERENCES institutes(id) ON DELETE CASCADE,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_institute_admins_institute ON institute_admins(institute_id);

-- ============================================================
-- 4. INSTRUCTORS  (single clean table; will link to courses later)
-- ============================================================
CREATE TABLE IF NOT EXISTS institute_instructors (
  id             UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id        UUID        NOT NULL UNIQUE REFERENCES "User"(id) ON DELETE CASCADE,
  institute_id   UUID        NOT NULL REFERENCES institutes(id) ON DELETE CASCADE,
  bio            TEXT,
  specialization VARCHAR(255),
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_institute_instructors_institute ON institute_instructors(institute_id);

-- ============================================================
-- 5. INSTITUTE STUDENTS
-- ============================================================
CREATE TABLE IF NOT EXISTS institute_students (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID        NOT NULL UNIQUE REFERENCES "User"(id) ON DELETE CASCADE,
  institute_id    UUID        NOT NULL REFERENCES institutes(id) ON DELETE CASCADE,
  enrollment_date DATE        NOT NULL DEFAULT CURRENT_DATE,
  is_active       BOOLEAN     NOT NULL DEFAULT true,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_institute_students_institute ON institute_students(institute_id);
CREATE INDEX IF NOT EXISTS idx_institute_students_active    ON institute_students(is_active);

-- ============================================================
-- 6. AUTO-UPDATE updated_at triggers
-- ============================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_institutes_updated_at
  BEFORE UPDATE ON institutes
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trg_instructors_updated_at
  BEFORE UPDATE ON institute_instructors
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trg_institute_students_updated_at
  BEFORE UPDATE ON institute_students
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
