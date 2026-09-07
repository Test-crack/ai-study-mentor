import { callBackend } from '@/features/auth/services/authClient';
import { getBackendUrl } from '@/shared/utils';
import type { StudentFullProgress } from '@/features/instructor/components/student-progress/types';
import type {
    IAOverviewRow, MockOverviewRow, DiagnosticOverviewRow,
} from '@/features/instructor/components/assessments/types';

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

/**
 * The batch filter param is `batch_id` — that is what getInstituteStudents reads
 * (`req.query.batch_id`). This sent `batchId`, so the server never saw a filter
 * and silently returned every student in the institute; the page's batch
 * dropdown appeared to do nothing.
 */
export async function fetchStudents(params?: { batchId?: string; at_risk?: boolean }): Promise<{ success: boolean; data: StudentRow[] }> {
    const q = new URLSearchParams();
    if (params?.batchId)    q.set('batch_id', params.batchId);
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
    instructor_count: number;
    unassigned_tutor_count: number;
    invited_not_started_count: number;
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

/**
 * Mirrors getInstituteStudents in instituteOwnerController.ts.
 *
 * Previously declared `drills_count_today`, which that endpoint has never sent,
 * and omitted `email` / `is_diagnosed`, which it always has. `batch_id` was
 * declared but genuinely missing from the response until the controller was
 * corrected — the students page keys its batch filter by it, so the dropdown
 * was building options from `undefined`. Keep this aligned with the controller.
 */
export interface StudentRow {
    student_id: string; user_id: string; name: string; avatar: string | null;
    email: string;
    /** Empty string when the student is not assigned to any batch. */
    batch_id: string; batch_name: string;
    current_band: number | null; target_band: number | null; gap: number | null;
    band_trend: 'up' | 'flat' | 'down' | null;
    daily_streak: number; drilled_today: boolean;
    momentum_score: number; is_at_risk: boolean; primary_flag: string | null;
    last_active: string | null;
    is_diagnosed: boolean;
    /** "YYYY-MM-DD" — the student's own declared exam date, or null if unset. */
    exam_date: string | null;
    /** "ielts" | "spoken_english" | … — branch display with isSpokenEnglish(). */
    exam_id: string;
}

/**
 * Owner and instructor read the SAME payload — both endpoints delegate to
 * computeStudentFullProgress in src/lib/studentProgressQueries.ts. This file
 * used to redeclare it, and the copy had drifted: it was missing
 * `diagnostic_baseline` and `diagnostic_results`, so the baseline-vs-current
 * comparison looked like owner-unavailable data when the endpoint had been
 * returning it all along. Re-exported instead of redeclared so it cannot
 * drift again.
 */
export type { StudentFullProgress };

export interface InstructorRow {
    user_id: string; name: string; email: string; avatar: string | null;
    batches: { batch_id: string; batch_name: string; student_count: number }[];
    total_students: number;
}

/**
 * Institute-wide assessment overview.
 *
 * Row shapes are identical to the instructor's per-batch endpoint — the two
 * handlers compute the same fields — so the row types are reused rather than
 * re-declared as `any[]`. Only the summary keys differ: the owner endpoint sends
 * `institute_*` where the instructor sends `batch_*`.
 */
export interface AssessmentOverview {
    ia_overview:         IAOverviewRow[];
    mock_overview:       MockOverviewRow[];
    diagnostic_overview: DiagnosticOverviewRow[];
    institute_ia_summary:   { avg_band: number; completion_rate: number; high_miss_count: number };
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

/**
 * Mirrors getAnalyticsInstructorEffectiveness in instituteOwnerController.ts.
 *
 * This interface previously declared `at_risk_students`, which the endpoint has
 * never sent — the field is `at_risk_count`. Nothing consumed this type, so the
 * mismatch went unnoticed until the admin Reports page rendered it and the
 * column came out blank. Keep it aligned with the controller.
 */
export interface InstructorEffectivenessRow {
    user_id: string; name: string; avatar: string | null;
    batch_count: number; student_count: number;
    /** IELTS-only (0-9 band scale) — Spoken English students are excluded, see avg_cefr_improvement. */
    avg_band_improvement: number | null;
    /** Spoken English-only (CEFR 0-6 ordinal scale) — null when the instructor has no SE students. */
    avg_cefr_improvement: number | null;
    /** Percent, 0..100 — completed IAs / scheduled IAs. */
    ia_completion_rate: number;
    at_risk_count: number;
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
