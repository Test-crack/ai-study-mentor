// Shared types for the instructor dashboard — all derived from
// GET /api/instructor/batches/:batchId/dashboard-summary

export interface EngagementToday {
  active_students: number;
  avg_dcs: number;
  streaks_alive: number;
  platform_unlocked: number;
  active_yesterday: number;
  avg_dcs_yesterday: number;
}

export interface AtRiskStudent {
  student_id: string;
  user_id: string;
  name: string;
  avatar: string | null;
  flags: string[];
  primary_flag: string;
  days_inactive: number;   // -1 means never drilled
  missed_ia_count: number;
  current_band: number | null;
}

export interface BandOverviewRow {
  student_id: string;
  user_id: string;
  name: string;
  avatar: string | null;
  current_band: number | null;
  target_band: number | null;
  gap: number | null;
  last_ia_date: string | null;   // "YYYY-MM-DD"
  band_trend: 'up' | 'flat' | 'down' | null;
  // Today's activity fields (used by StudentActivityGrid)
  drilled_today: boolean;
  drills_count_today: number;
  streak: number;
  lexigrid_done_today: boolean;
  lexigrid_words_today: number | null;
  is_at_risk: boolean;
  risk_primary_flag: string | null;
  /** "ielts" | "spoken_english" | … — branch display with isSpokenEnglish(). */
  exam_id: string;
}

export interface PeriodSummary {
  ia_completed_last_7_days: number;
  ia_total_students: number;
  mock_completed_this_month: number;
  mock_total_students: number;
}

export interface DashboardSummary {
  engagement_today: EngagementToday;
  at_risk: AtRiskStudent[];
  band_overview: BandOverviewRow[];
  period_summary: PeriodSummary;
}

// Batch from GET /api/instructor/batches
export interface InstructorBatch {
  id: string;
  name: string;
  status: string;
  studentCount: number;
  instructorCount: number;
}
