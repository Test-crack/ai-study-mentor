-- ═══════════════════════════════════════════════════════════════════════════
-- LexiGrid Words — Schema + Seed Data
-- Run this in pgAdmin after prisma generate.
-- ═══════════════════════════════════════════════════════════════════════════

-- ── BLOCK 1: Create table ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS lexigrid_words (
  id           UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  base_word    VARCHAR(100)  NOT NULL,          -- Simple word shown to student
  target_word  VARCHAR(100)  NOT NULL,          -- Band 7-8 synonym they must type (stored UPPERCASE)
  hint         TEXT          NOT NULL,          -- Definition / contextual clue
  category     VARCHAR(50),                     -- 'academic' | 'descriptive' | 'formal'
  difficulty   VARCHAR(20)   NOT NULL DEFAULT 'INTERMEDIATE'
                             CHECK (difficulty IN ('BEGINNER','INTERMEDIATE','ADVANCED')),
  target_band  DECIMAL(2,1)  DEFAULT 7.0,       -- IELTS band level this word targets
  is_active    BOOLEAN       NOT NULL DEFAULT TRUE,
  times_served INTEGER       NOT NULL DEFAULT 0,
  created_at   TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_lexigrid_words_difficulty ON lexigrid_words(difficulty) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_lexigrid_words_active     ON lexigrid_words(is_active);


-- ── BLOCK 2: Seed 25 words ────────────────────────────────────────────────
-- 8 BEGINNER · 10 INTERMEDIATE · 7 ADVANCED
-- All target_word values stored UPPERCASE so the frontend string comparison works out-of-the-box.

INSERT INTO lexigrid_words (base_word, target_word, hint, category, difficulty, target_band) VALUES

-- ── BEGINNER (Band 5.5–6.0) ──────────────────────────────────────────────
('BRIEF',         'CONCISE',       'Giving a lot of information clearly and in a few words.',                                   'academic',     'BEGINNER', 5.5),
('SHOW',          'DEMONSTRATE',   'Clearly show the existence or truth of something by giving proof or evidence.',              'academic',     'BEGINNER', 5.5),
('IMPROVE',       'ENHANCE',       'Intensify, increase, or further improve the quality, value, or extent of something.',       'academic',     'BEGINNER', 6.0),
('AMAZING',       'REMARKABLE',    'Worthy of attention; striking or extraordinary in some way.',                               'descriptive',  'BEGINNER', 5.5),
('GET BIGGER',    'EXPAND',        'Become or make larger or more extensive in scope or scale.',                                'academic',     'BEGINNER', 5.5),
('USE',           'UTILISE',       'Make practical and effective use of something.',                                            'academic',     'BEGINNER', 6.0),
('HELP',          'FACILITATE',    'Make an action or process easy or easier; assist the progress of.',                        'formal',       'BEGINNER', 6.0),
('LOOK AT',       'EXAMINE',       'Inspect in detail and subject to an analysis in order to discover essential features.',     'academic',     'BEGINNER', 5.5),

-- ── INTERMEDIATE (Band 6.0–7.0) ───────────────────────────────────────────
('IMPORTANT',     'CRUCIAL',       'Decisive or critical, especially in the success or failure of something.',                  'academic',     'INTERMEDIATE', 6.5),
('VERY HAPPY',    'ECSTATIC',      'Feeling or expressing overwhelming happiness or joyful excitement.',                        'descriptive',  'INTERMEDIATE', 6.5),
('POOR',          'DESTITUTE',     'Without the basic necessities of life; in a state of extreme poverty.',                    'descriptive',  'INTERMEDIATE', 7.0),
('LAZY',          'LETHARGIC',     'Affected by lethargy; sluggish, apathetic, and lacking energy.',                           'descriptive',  'INTERMEDIATE', 6.5),
('BRAVE',         'INTREPID',      'Fearless and adventurous, often used in formal or rhetorical contexts.',                   'descriptive',  'INTERMEDIATE', 7.0),
('CAREFUL',       'METICULOUS',    'Showing great attention to detail; very careful and precise.',                              'descriptive',  'INTERMEDIATE', 7.0),
('BAD',           'DETRIMENTAL',   'Tending to cause harm or damage; having an adverse effect.',                               'academic',     'INTERMEDIATE', 6.5),
('UNCLEAR',       'AMBIGUOUS',     'Open to more than one interpretation; not having one obvious meaning.',                    'academic',     'INTERMEDIATE', 7.0),
('NECESSARY',     'IMPERATIVE',    'Of vital importance; absolutely essential; critically urgent.',                             'formal',       'INTERMEDIATE', 7.0),
('COMPLEX',       'INTRICATE',     'Very complicated or detailed; having many interrelated parts.',                            'academic',     'INTERMEDIATE', 7.0),

-- ── ADVANCED (Band 7.0–8.5) ───────────────────────────────────────────────
('MANY',          'MYRIAD',        'A countless or extremely great number; used to emphasise vast quantity.',                   'academic',     'ADVANCED', 7.5),
('FAKE',          'SPURIOUS',      'Not being what it purports to be; false or falsely attributed.',                           'academic',     'ADVANCED', 8.0),
('HARMFUL',       'PERNICIOUS',    'Having a harmful effect, especially in a gradual or subtle way.',                          'academic',     'ADVANCED', 8.0),
('WIDESPREAD',    'PERVASIVE',     'Spreading widely throughout an area or a group of people; omnipresent.',                   'academic',     'ADVANCED', 7.5),
('HINDER',        'IMPEDE',        'Delay or prevent progress by obstructing or interfering.',                                 'academic',     'ADVANCED', 7.5),
('RISKY',         'PRECARIOUS',    'Not securely held or in position; dangerously likely to deteriorate.',                    'descriptive',  'ADVANCED', 7.5),
('FRIENDLY',      'AMICABLE',      'Having a spirit of friendliness; showing goodwill without serious disagreement.',          'formal',       'ADVANCED', 7.5)

ON CONFLICT DO NOTHING;


-- ── Verification query ────────────────────────────────────────────────────
SELECT difficulty, COUNT(*) AS word_count
FROM   lexigrid_words
WHERE  is_active = true
GROUP  BY difficulty
ORDER  BY difficulty;
-- Expected: ADVANCED=7, BEGINNER=8, INTERMEDIATE=10
