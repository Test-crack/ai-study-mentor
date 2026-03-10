import { callBackend } from '@/features/auth/services/authClient';
import { getBackendUrl } from '@/shared/utils';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface AdminRecord {
    id: string;           // institute_admins row id
    userId: string;
    name: string | null;
    email: string;
    profileImage: string | null;
    addedAt: string;
}

// ─── API calls ────────────────────────────────────────────────────────────────

export async function fetchAdmins(): Promise<{ data: AdminRecord[]; instituteId: string }> {
    const url = `${getBackendUrl()}/api/institute-owner/admins`;
    return callBackend(url);
}

export async function addAdmin(payload: {
    adminName: string;
    adminEmail: string;
}): Promise<{ data: { userId: string; name: string | null; email: string; inviteEmailSent: boolean } }> {
    const url = `${getBackendUrl()}/api/institute-owner/admins`;
    return callBackend(url, { method: 'POST', body: JSON.stringify(payload) });
}

export async function removeAdmin(
    userId: string
): Promise<{ data: { removed: boolean; userId: string } }> {
    const url = `${getBackendUrl()}/api/institute-owner/admins/${userId}`;
    return callBackend(url, { method: 'DELETE' });
}
