import { callBackend } from '@/features/auth/services/authClient';
import { getBackendUrl } from '@/shared/utils';

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
