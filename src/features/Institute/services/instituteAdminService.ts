import { callBackend } from '@/features/auth/services/authClient';
import { getBackendUrl } from '@/shared/utils';
import type { InstituteSummary, StudentRow, InstructorRow } from '@/features/InstituteOwner/services/instituteOwnerService';

const BASE = () => `${getBackendUrl()}/api/institute-admin`;

// ─── Types ────────────────────────────────────────────────────────────────────

export interface StudentRecord {
    id: string;
    userId: string;
    name: string | null;
    email: string;
    phone: string | null;
    profileImage: string | null;
    enrolledAt: string;
    isActive: boolean;
    createdAt: string;
}

export interface TutorRecord {
    id: string;
    userId: string;
    name: string | null;
    email: string;
    phone: string | null;
    profileImage: string | null;
    specialization: string | null;
    bio: string | null;
    createdAt: string;
}

// ─── Students ─────────────────────────────────────────────────────────────────

export async function fetchStudents(search?: string): Promise<{ data: StudentRecord[]; instituteId: string }> {
    const qs = new URLSearchParams();
    if (search) qs.set('search', search);
    const url = `${getBackendUrl()}/api/institute-admin/students?${qs.toString()}`;
    return callBackend(url);
}

export async function addStudent(payload: {
    studentName: string;
    studentEmail: string;
}): Promise<{ data: { userId: string; name: string | null; email: string; inviteEmailSent: boolean } }> {
    const url = `${getBackendUrl()}/api/institute-admin/students`;
    return callBackend(url, { method: 'POST', body: JSON.stringify(payload) });
}

export async function removeStudent(
    userId: string
): Promise<{ data: { removed: boolean; userId: string } }> {
    const url = `${getBackendUrl()}/api/institute-admin/students/${userId}`;
    return callBackend(url, { method: 'DELETE' });
}

export async function updateStudentStatus(
    userId: string,
    isActive: boolean
): Promise<{ data: { updated: boolean; userId: string; isActive: boolean } }> {
    const url = `${getBackendUrl()}/api/institute-admin/students/${userId}/status`;
    return callBackend(url, { method: 'PATCH', body: JSON.stringify({ isActive }) });
}

// ─── Tutors ───────────────────────────────────────────────────────────────────

export async function fetchTutors(search?: string): Promise<{ data: TutorRecord[]; instituteId: string }> {
    const qs = new URLSearchParams();
    if (search) qs.set('search', search);
    const url = `${getBackendUrl()}/api/institute-admin/tutors?${qs.toString()}`;
    return callBackend(url);
}

export async function addTutor(payload: {
    tutorName: string;
    tutorEmail: string;
    specialization?: string;
}): Promise<{ data: { userId: string; name: string | null; email: string; inviteEmailSent: boolean } }> {
    const url = `${getBackendUrl()}/api/institute-admin/tutors`;
    return callBackend(url, { method: 'POST', body: JSON.stringify(payload) });
}

export async function removeTutor(
    userId: string
): Promise<{ data: { removed: boolean; userId: string } }> {
    const url = `${getBackendUrl()}/api/institute-admin/tutors/${userId}`;
    return callBackend(url, { method: 'DELETE' });
}

// ─── Dashboard / overview (owner handlers reused on admin routes) ─────────────

export async function fetchSummary(): Promise<{ success: boolean; data: InstituteSummary }> {
    return callBackend(`${BASE()}/summary`);
}

export async function fetchStudentsOverview(params?: { search?: string; batch_id?: string; at_risk?: boolean }):
    Promise<{ success: boolean; data: StudentRow[] }> {
    const qs = new URLSearchParams();
    if (params?.search) qs.set('search', params.search);
    if (params?.batch_id) qs.set('batch_id', params.batch_id);
    if (params?.at_risk) qs.set('at_risk', 'true');
    return callBackend(`${BASE()}/students-overview?${qs.toString()}`);
}

export async function fetchInstructorsOverview(): Promise<{ success: boolean; data: InstructorRow[] }> {
    return callBackend(`${BASE()}/instructors`);
}

// ─── Onboarding status ("needs attention") ────────────────────────────────────

export interface OnboardingPerson {
    userId: string;
    name: string | null;
    email: string;
    profileImage: string | null;
    invitedAt: string;
}

export async function fetchOnboardingStatus(): Promise<{
    data: { students_not_started: OnboardingPerson[]; tutors_unassigned: OnboardingPerson[] };
}> {
    return callBackend(`${BASE()}/onboarding-status`);
}

export async function resendStudentInvite(userId: string): Promise<{ data: { emailSent: boolean } }> {
    return callBackend(`${BASE()}/students/${userId}/resend-invite`, { method: 'POST' });
}

// ─── Institute profile (Settings) ─────────────────────────────────────────────

export interface InstituteProfile {
    id: string;
    name: string;
    address: string | null;
    logoUrl: string | null;
    isActive: boolean;
    createdAt: string;
}

export async function fetchInstituteProfile(): Promise<{ data: InstituteProfile }> {
    return callBackend(`${BASE()}/institute`);
}

export async function updateInstituteProfile(payload: {
    name?: string; address?: string; logoUrl?: string;
}): Promise<{ data: Pick<InstituteProfile, 'id' | 'name' | 'address' | 'logoUrl'> }> {
    return callBackend(`${BASE()}/institute`, { method: 'PATCH', body: JSON.stringify(payload) });
}

// ─── Notifications (recipient-generic user_notifications) ─────────────────────

export interface AdminNotificationEvent {
    id: string;
    type: string;
    payload: Record<string, any>;
    created_at: string;
    read_at: string | null;
    dismissed_at: string | null;
}

export async function fetchAdminNotifications(): Promise<{
    success: boolean; events: AdminNotificationEvent[]; unread_count: number; next_cursor: string | null;
}> {
    return callBackend(`${BASE()}/notifications`);
}

export async function markAdminNotificationsRead(body: { all?: boolean; ids?: string[] }): Promise<{ success: boolean }> {
    return callBackend(`${BASE()}/notifications/read`, { method: 'POST', body: JSON.stringify(body) });
}

export async function dismissAdminNotification(id: string): Promise<{ success: boolean }> {
    return callBackend(`${BASE()}/notifications/${id}/dismiss`, { method: 'POST' });
}
