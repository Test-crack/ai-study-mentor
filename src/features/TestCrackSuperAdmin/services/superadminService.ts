import { callBackend } from '@/features/auth/services/authClient';
import { getBackendUrl } from '@/shared/utils';

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

export interface InstituteRecord {
    id: string;
    name: string;
    address: string | null;
    logoUrl: string | null;
    isActive: boolean;
    createdAt: string;
    studentCount: number;
    instructorCount: number;
    owner: InstituteOwnerSummary | null;
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
}): Promise<{ data: { institute: { id: string; name: string }; owner: { id: string; email: string; name: string | null }; inviteEmailSent: boolean } }> {
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
