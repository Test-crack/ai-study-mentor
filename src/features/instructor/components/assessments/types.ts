// Types for the Instructor Assessment Overview page
// Source: GET /api/instructor/batches/:batchId/assessment-overview

export interface IAOverviewRow {
  student_id:   string;
  user_id:      string;  // User.id — use this for navigation to full-progress
  name:         string;
  avatar:       string | null;
  ia_completed: number;
  ia_missed:    number;
  last_ia_band: number | null;
  best_ia_band: number | null;
  avg_ia_band:  number | null;
  last_ia_date: string | null;   // "YYYY-MM-DD"
  ia_eligible:  boolean;
  /** "ielts" | "spoken_english" | … — branch display with isSpokenEnglish(). */
  exam_id:      string;
}

export interface MockOverviewRow {
  student_id:       string;
  user_id:          string;  // User.id
  name:             string;
  avatar:           string | null;
  mock_count:       number;
  latest_real_band: number | null;
  best_real_band:   number | null;
  target_band:      number | null;
  /** "ielts" | "spoken_english" | … — branch display with isSpokenEnglish(). */
  exam_id:          string;
}

export interface DiagnosticOverviewRow {
  student_id:     string;
  user_id:        string;  // User.id
  name:           string;
  avatar:         string | null;
  is_diagnosed:   boolean;
  baseline_bands: { L: number | null; R: number | null; W: number | null; S: number | null };
  diagnosed_at:   string | null;
  /**
   * Raw AssessmentHistory.sub_scores JSON from the diagnostic entry (Speaking,
   * for Spoken English — its full CEFR profile: cefrLabel + per-subskill
   * breakdown). Optional/untyped — shape is exam-specific and not modeled here;
   * IELTS rows may carry a differently-shaped sub_scores or none at all.
   */
  sub_scores?:    unknown | null;
}

export interface BatchIASummary {
  avg_band:        number;
  completion_rate: number;
  high_miss_count: number;
}

export interface BatchMockSummary {
  avg_real_band:      number;
  at_or_above_target: number;
  no_mock_yet:        number;
}

export interface AssessmentOverview {
  ia_overview:         IAOverviewRow[];
  mock_overview:       MockOverviewRow[];
  diagnostic_overview: DiagnosticOverviewRow[];
  batch_ia_summary:    BatchIASummary;
  batch_mock_summary:  BatchMockSummary;
}
