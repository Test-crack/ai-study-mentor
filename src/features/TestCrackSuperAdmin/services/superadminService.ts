import { callBackend } from '@/features/auth/services/authClient';
import { getBackendUrl } from '@/shared/utils';
import type { ExamType, BillingStatus } from '@/shared/constants/examTypes';

export type UserRoleFilter = 'ALL' | 'SUPERADMIN' | 'INSTITUTE_OWNER' | 'INSTITUTE_ADMIN' | 'INSTRUCTOR' | 'STUDENT';

export interface UserRecord {
    id: string;
    name: string | null;
    email: string;
    role: string;
    createdAt: string;
    profileImage: string | null;
    instituteId: string | null;
    instituteName: string | null;
}

export interface UsersMeta {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
}

export interface FetchUsersResult {
    data: UserRecord[];
    meta: UsersMeta;
}

// ─── Institutes ───────────────────────────────────────────────────────────────

export interface InstituteOwnerSummary {
    id: string;
    name: string | null;
    email: string;
    profileImage: string | null;
}

export interface InstituteExamRecord {
    examType: ExamType;
    billingStatus: BillingStatus;
    trialEndsAt: string | null;
    seatCap: number | null;
}

export interface InstituteRecord {
    id: string;
    name: string;
    address: string | null;
    logoUrl: string | null;
    contactEmail: string | null;
    contactPhone: string | null;
    isActive: boolean;
    createdAt: string;
    studentCount: number;
    instructorCount: number;
    owner: InstituteOwnerSummary | null;
    exams: InstituteExamRecord[];
}

export async function fetchInstitutes(search?: string): Promise<{ data: InstituteRecord[] }> {
    const qs = new URLSearchParams();
    if (search) qs.set('search', search);
    const url = `${getBackendUrl()}/api/superadmin/institutes?${qs.toString()}`;
    return callBackend(url);
}

export async function createInstitute(payload: {
    instituteName: string;
    address?: string;
    ownerName: string;
    ownerEmail: string;
    ownerPhone?: string;
    examTypes: ExamType[];
}): Promise<{ data: { institute: { id: string; name: string }; owner: { id: string; email: string; name: string | null }; exams: InstituteExamRecord[]; inviteEmailSent: boolean } }> {
    const url = `${getBackendUrl()}/api/superadmin/institutes`;
    return callBackend(url, { method: 'POST', body: JSON.stringify(payload) });
}

export async function toggleInstituteStatus(
    id: string,
    isActive: boolean
): Promise<{ data: { id: string; name: string; isActive: boolean } }> {
    const url = `${getBackendUrl()}/api/superadmin/institutes/${id}/status`;
    return callBackend(url, { method: 'PATCH', body: JSON.stringify({ isActive }) });
}

export async function updateInstitute(
    id: string,
    payload: { name?: string; address?: string; logoUrl?: string; contactEmail?: string; contactPhone?: string; }
): Promise<{ data: { id: string; name: string; address: string | null; logoUrl: string | null; contactEmail: string | null; contactPhone: string | null; } }> {
    const url = `${getBackendUrl()}/api/superadmin/institutes/${id}`;
    return callBackend(url, { method: 'PATCH', body: JSON.stringify(payload) });
}

/** Set the full list of exams an institute offers (diff handled server-side). */
export async function setInstituteExams(
    id: string,
    examTypes: ExamType[]
): Promise<{ data: InstituteExamRecord[] }> {
    const url = `${getBackendUrl()}/api/superadmin/institutes/${id}/exams`;
    return callBackend(url, { method: 'PUT', body: JSON.stringify({ examTypes }) });
}

/** Set the billing status of one exam for an institute. */
export async function setExamStatus(
    id: string,
    examType: ExamType,
    billingStatus: BillingStatus
): Promise<{ data: InstituteExamRecord }> {
    const url = `${getBackendUrl()}/api/superadmin/institutes/${id}/exams/${examType}`;
    return callBackend(url, { method: 'PATCH', body: JSON.stringify({ billingStatus }) });
}

// ─── Subscriptions (flat view) ──────────────────────────────────────────────

export interface SubscriptionRecord {
    id: string;
    instituteId: string;
    instituteName: string;
    instituteActive: boolean;
    examType: ExamType;
    billingStatus: BillingStatus;
    trialEndsAt: string | null;
    seatCap: number | null;
    studentCount: number;
    createdAt: string;
}

export interface SubscriptionSummary {
    total: number;
    active: number;
    trial: number;
    cancelled: number;
}

export async function fetchSubscriptions(params?: {
    status?: BillingStatus;
    search?: string;
}): Promise<{ data: SubscriptionRecord[]; summary: SubscriptionSummary }> {
    const qs = new URLSearchParams();
    if (params?.status) qs.set('status', params.status);
    if (params?.search) qs.set('search', params.search);
    const url = `${getBackendUrl()}/api/superadmin/subscriptions?${qs.toString()}`;
    return callBackend(url);
}

/**
 * GET /api/superadmin/users
 * Fetch all platform users — SUPERADMIN only.
 */
export async function fetchAllUsers(params: {
    role?: UserRoleFilter;
    search?: string;
    page?: number;
    limit?: number;
}): Promise<FetchUsersResult> {
    const { role, search, page = 1, limit = 50 } = params;

    const qs = new URLSearchParams();
    if (role && role !== 'ALL') qs.set('role', role);
    if (search) qs.set('search', search);
    qs.set('page', String(page));
    qs.set('limit', String(limit));

    const url = `${getBackendUrl()}/api/superadmin/users?${qs.toString()}`;
    return callBackend(url);
}
