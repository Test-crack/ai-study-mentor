import { callBackend } from '@/features/auth/services/authClient';
import { getBackendUrl } from '@/shared/utils';

const BASE = () => `${getBackendUrl()}/api/institute-owner`;

// ─── Admin Management ─────────────────────────────────────────────────────────

export interface AdminRecord {
    id: string;
    userId: string;
    name: string | null;
    email: string;
    profileImage: string | null;
    addedAt: string;
}

export async function fetchAdmins(): Promise<{ data: AdminRecord[]; instituteId: string }> {
    return callBackend(`${BASE()}/admins`);
}

export async function addAdmin(payload: { adminName: string; adminEmail: string }) {
    return callBackend(`${BASE()}/admins`, { method: 'POST', body: JSON.stringify(payload) });
}

export async function removeAdmin(userId: string) {
    return callBackend(`${BASE()}/admins/${userId}`, { method: 'DELETE' });
}

// ─── Phase 1 — Operational ────────────────────────────────────────────────────

export async function fetchSummary(): Promise<{ success: boolean; data: InstituteSummary }> {
    return callBackend(`${BASE()}/summary`);
}

export async function fetchBatches(): Promise<{ success: boolean; data: BatchRow[] }> {
    return callBackend(`${BASE()}/batches`);
}

export async function fetchBatchDashboardSummary(batchId: string): Promise<{ success: boolean; data: BatchDashboardSummary }> {
    return callBackend(`${BASE()}/batches/${batchId}/dashboard-summary`);
}

export async function fetchStudents(params?: { batchId?: string; at_risk?: boolean }): Promise<{ success: boolean; data: StudentRow[]; total: number }> {
    const q = new URLSearchParams();
    if (params?.batchId)    q.set('batchId', params.batchId);
    if (params?.at_risk)    q.set('at_risk', 'true');
    const qs = q.toString() ? `?${q}` : '';
    return callBackend(`${BASE()}/students${qs}`);
}

export async function fetchStudentFullProgress(studentId: string): Promise<{ success: boolean; data: StudentFullProgress }> {
    return callBackend(`${BASE()}/students/${studentId}/full-progress`);
}

export async function fetchAtRisk(): Promise<{ success: boolean; data: AtRiskRow[]; total: number }> {
    return callBackend(`${BASE()}/at-risk`);
}

export async function fetchInstructors(): Promise<{ success: boolean; data: InstructorRow[] }> {
    return callBackend(`${BASE()}/instructors`);
}

export async function fetchAssessmentOverview(params?: { batch_id?: string }): Promise<{ success: boolean; data: AssessmentOverview }> {
    const q = new URLSearchParams();
    if (params?.batch_id)  q.set('batch_id', params.batch_id);
    const qs = q.toString() ? `?${q}` : '';
    return callBackend(`${BASE()}/assessment-overview${qs}`);
}

// ─── Phase 2 — Analytics ──────────────────────────────────────────────────────

export async function fetchCohortProgress(): Promise<{ success: boolean; data: CohortProgressData }> {
    return callBackend(`${BASE()}/analytics/cohort-progress`);
}

export async function fetchBatchComparison(): Promise<{ success: boolean; data: BatchComparisonRow[] }> {
    return callBackend(`${BASE()}/analytics/batch-comparison`);
}

export async function fetchInstructorEffectiveness(): Promise<{ success: boolean; data: InstructorEffectivenessRow[] }> {
    return callBackend(`${BASE()}/analytics/instructor-effectiveness`);
}

export async function fetchEngagementTrends(): Promise<{ success: boolean; data: EngagementWeek[] }> {
    return callBackend(`${BASE()}/analytics/engagement-trends`);
}

export async function fetchGoalAchievement(): Promise<{ success: boolean; data: GoalAchievementData }> {
    return callBackend(`${BASE()}/analytics/goal-achievement`);
}

export async function fetchSubskillHeatmap(): Promise<{ success: boolean; data: SubskillHeatmapRow[] }> {
    return callBackend(`${BASE()}/analytics/subskill-heatmap`);
}

// ─── Types ────────────────────────────────────────────────────────────────────

export interface InstituteSummary {
    institute_name: string;
    total_students: number;
    active_today: number;
    platform_unlocked_today: number;
    at_risk_count: number;
    total_batches: number;
    avg_band: number | null;
    ia_completion_last_7_days: { completed: number; total_eligible: number };
    mock_completed_this_month: number;
    admins_count: number;
}

export interface BatchRow {
    id: string;
    name: string;
    status: string;
    student_count: number;
    max_students: number | null;
    capacity_pct: number | null;
    instructors: { userId: string; name: string; profileImage: string | null }[];
    avg_band: number | null;
    at_risk_count: number;
    active_today: number;
    ia_completion_rate: number;
}

export interface BatchDashboardSummary {
    engagement_today: {
        active_students: number; avg_dcs: number; streaks_alive: number;
        platform_unlocked: number; active_yesterday: number; avg_dcs_yesterday: number;
    };
    at_risk: AtRiskRow[];
    band_overview: BandOverviewRow[];
    period_summary: {
        ia_completed_last_7_days: number; ia_total_students: number;
        mock_completed_this_month: number; mock_total_students: number;
    };
}

export interface BandOverviewRow {
    student_id: string; user_id: string; name: string; avatar: string | null;
    current_band: number | null; target_band: number | null; gap: number | null;
    last_ia_date: string | null; band_trend: 'up' | 'flat' | 'down' | null;
    drilled_today: boolean; drills_count_today: number;
    streak: number;
    lexigrid_done_today: boolean; lexigrid_words_today: number | null;
    is_at_risk: boolean; risk_primary_flag: string | null;
}

export interface AtRiskRow {
    student_id: string; user_id: string; name: string; avatar: string | null;
    batch_id: string; batch_name: string;
    flags: string[]; primary_flag: string;
    days_inactive: number; missed_ia_count: number;
    current_band: number | null; target_band: number | null;
}

export interface StudentRow {
    student_id: string; user_id: string; name: string; avatar: string | null;
    batch_id: string; batch_name: string;
    current_band: number | null; target_band: number | null; gap: number | null;
    band_trend: 'up' | 'flat' | 'down' | null;
    daily_streak: number; drilled_today: boolean; drills_count_today: number;
    momentum_score: number; is_at_risk: boolean; primary_flag: string | null;
    last_active: string | null;
}

export interface StudentFullProgress {
    student: { id: string; name: string; email: string; avatar: string | null };
    competency: { skill: string; band_score: number }[];
    target_band: number | null;
    current_band: number | null;
    momentum_score: number;
    daily_streak: number;
    ia_sessions: any[];
    mock_sessions: any[];
    drill_stats: {
        last_14_days: { date: string; dcs: number | null; count: number }[];
        sub_skill_counts: { skill: string; sub_skill: string; count: number; avg_accuracy: number }[];
        streak_calendar: { date: string; active: boolean }[];
        total_drills_all_time: number;
        avg_dcs_lifetime: number;
    };
    lexigrid_stats: { games_last_14: number; avg_words_solved: number; bonus_rate: number };
    ia_eligibility: { prerequisites_met: boolean; avg_dcs: number; drills_completed: number; next_ia_date: string | null };
}

export interface InstructorRow {
    user_id: string; name: string; email: string; avatar: string | null;
    batches: { batch_id: string; batch_name: string; student_count: number }[];
    total_students: number;
}

export interface AssessmentOverview {
    ia_overview: any[];
    mock_overview: any[];
    diagnostic_overview: any[];
    institute_ia_summary: { avg_band: number; completion_rate: number; high_miss_count: number };
    institute_mock_summary: { avg_real_band: number; at_or_above_target: number; no_mock_yet: number };
}

export interface CohortProgressData {
    monthly_points: { month: string; avg_ia_band: number | null; avg_real_band: number | null }[];
}

export interface BatchComparisonRow {
    batch_id: string; batch_name: string;
    student_count: number; avg_band: number | null; diagnostic_baseline: number | null;
    improvement_delta: number | null; ia_completion_rate: number; engagement_rate: number;
    at_risk_pct: number;
}

export interface InstructorEffectivenessRow {
    user_id: string; name: string; avatar: string | null;
    batch_count: number; student_count: number; avg_band_improvement: number | null;
    ia_completion_rate: number; at_risk_students: number;
    students_at_target: number; avg_student_streak: number;
}

export interface EngagementWeek {
    week_start: string; engagement_rate: number; avg_dcs: number | null; active_students: number;
}

export interface GoalAchievementData {
    below: number; near: number; at_or_above: number; exam_ready: number;
    by_batch: { batch_id: string; batch_name: string; below: number; near: number; at_or_above: number; exam_ready: number }[];
}

export interface SubskillHeatmapRow {
    skill: string; sub_skill: string; avg_accuracy: number; drill_count: number;
}
