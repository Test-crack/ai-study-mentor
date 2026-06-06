// Types for the Student Deep Dive page — derived from
// GET /api/instructor/batches/:batchId/students/:studentId/full-progress

export interface SectionScore {
  section: string;
  band:    number;
  correct: number;
  total:   number;
  ai_feedback?: string;
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

export interface MockSkillScore {
  skill:            string;
  band_score:       number;
  sub_skill_scores: Array<{ sub_skill: string; score: number }>;
}

export interface MockSession {
  id:               string;
  month_year:       string;   // "YYYY-MM"
  attempt_type:     string;
  status:           'PENDING' | 'IN_PROGRESS' | 'COMPLETED';
  scores:           MockSkillScore[] | null;
  real_band_score:  number | null;
  momentum_awarded: number | null;
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

export interface StudentFullProgress {
  student: {
    id:     string;
    name:   string;
    email:  string;
    avatar: string | null;
  };
  competency:     CompetencyRow[];
  target_band:    number | null;
  current_band:   number | null;
  momentum_score: number;
  daily_streak:   number;
  ia_sessions:    IASession[];
  mock_sessions:  MockSession[];
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
  ia_eligibility: {
    prerequisites_met: boolean;
    avg_dcs:           number;
    drills_completed:  number;
    next_ia_date:      string | null;
  };
}
