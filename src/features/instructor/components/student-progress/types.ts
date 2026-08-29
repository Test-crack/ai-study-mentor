// Types for the Student Deep Dive page — derived from
// GET /api/instructor/batches/:batchId/students/:studentId/full-progress

export interface SectionScore {
  skill:      string;
  sub_skill:  string;
  band:       number | null;
  correct:    number;
  total:      number;
  ai_graded:  boolean;
  ai_feedback?: {
    rationale:        string;
    key_observations: string[];
  };
}

export interface IASession {
  id:                     string;
  ia_number:              number;
  ia_date:                string;    // "YYYY-MM-DD"
  status:                 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'MISSED';
  selected_subskills:     string[] | null;
  scores:                 SectionScore[] | null;
  momentum_awarded:       number | null;
  carry_forward_subskills: string[] | null;
  time_submitted_at:      string | null;
}

export interface MockSubSkillScore {
  sub_skill:  string;
  band:       number | null;
  ai_band?:   number;
  correct:    number;
  total_mcq:  number;
  ai_feedback?: {
    rationale:        string;
    key_observations: string[];
  };
}

export interface MockSkillScore {
  skill:             string;
  band:              number | null;
  total:             number;
  correct:           number;
  ai_graded:         boolean;
  sub_skill_scores?: MockSubSkillScore[];
}

export interface MockSession {
  id:                string;
  month_year:        string;   // "YYYY-MM"
  attempt_type:      string;
  status:            'PENDING' | 'IN_PROGRESS' | 'COMPLETED';
  scores:            MockSkillScore[] | null;
  real_band_score:   number | null;
  momentum_awarded:  number | null;
  time_submitted_at: string | null;
}

export interface CompetencyRow {
  skill:      string;
  band_score: number;
}

export interface DrillDay {
  date:  string;   // "YYYY-MM-DD"
  dcs:   number | null;
  count: number;
}

export interface SubSkillCount {
  skill:        string;
  sub_skill:    string;
  count:        number;
  avg_accuracy: number;
}

export interface StreakDay {
  date:   string;
  active: boolean;
}

/**
 * A student's own written reflection from the drill "apply" step.
 * Newest first, capped at 10 by the server.
 */
export interface DrillReflection {
  id:                 string;
  skill:              string;
  sub_skill:          string;
  reflection_text:    string;
  created_at:         string;
  apply_completed_at: string | null;
}

// sub_scores shape varies by skill — typed loosely, components narrow as needed
export interface DiagnosticSubScoresLR {
  total_questions:    number;
  correct_answers:    number;
  accuracy_percentage: number;
  by_question_type?:  Record<string, { correct: number; total: number }>;
}

export interface DiagnosticSubScoresWriting {
  word_count?:        number;
  grammarScore?:      number;
  vocabularyScore?:   number;
  coherenceScore?:    number;
  taskResponseScore?: number;
  feedback?:          string;
}

export interface DiagnosticSubScoresSpeaking {
  fluencyScore?:       number;
  vocabularyScore?:    number;
  grammarScore?:       number;
  pronunciationScore?: number;
  content_assessment?: string;
  feedback?:           string;
}

export interface DiagnosticFeedback {
  band?:             number;
  rationale?:        string;
  key_observations?: string[];
  feedback?:         string;
}

export interface DiagnosticSkillResult {
  skill:        string;
  band_score:   number;
  sub_scores:   DiagnosticSubScoresLR | DiagnosticSubScoresWriting | DiagnosticSubScoresSpeaking | null;
  feedback_json: DiagnosticFeedback | null;
  created_at:   string;
}

export interface StudentFullProgress {
  student: {
    id:     string;
    name:   string;
    email:  string;
    avatar: string | null;
  };
  competency:     CompetencyRow[];
  target_band:    number | null;
  /** "YYYY-MM-DD" — the student's own declared exam date, null if they haven't set one. */
  exam_date:      string | null;
  current_band:   number | null;
  momentum_score: number;
  daily_streak:   number;
  ia_sessions:         IASession[];
  mock_sessions:       MockSession[];
  diagnostic_baseline: { L: number | null; R: number | null; W: number | null; S: number | null };
  diagnostic_results:  DiagnosticSkillResult[];
  drill_stats: {
    last_14_days:          DrillDay[];
    sub_skill_counts:      SubSkillCount[];
    streak_calendar:       StreakDay[];
    total_drills_all_time: number;
    avg_dcs_lifetime:      number;
  };
  lexigrid_stats: {
    games_last_14:    number;
    avg_words_solved: number;
    bonus_rate:       number;
  };
  recent_reflections: DrillReflection[];
  ia_eligibility: {
    prerequisites_met: boolean;
    avg_dcs:           number;
    drills_completed:  number;
    next_ia_date:      string | null;
  };
}
