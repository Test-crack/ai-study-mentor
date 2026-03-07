import { callBackend } from '@/features/auth/services/authClient';
import { getBackendUrl } from '@/shared/utils';

// ─── Types ────────────────────────────────────────────────────────────────────

export type BatchStatus = 'ACTIVE' | 'INACTIVE' | 'COMPLETED';

export interface BatchMember {
    userId: string;
    name: string | null;
    email: string;
    profileImage: string | null;
    phone?: string | null;
    assignedAt?: string;
    enrolledAt?: string;
}

export interface BatchSummary {
    id: string;
    name: string;
    description: string | null;
    status: BatchStatus;
    maxStudents: number | null;
    createdAt: string;
    instructorCount: number;
    studentCount: number;
    instructors: BatchMember[]; // first-level for quick display
}

export interface BatchDetail extends BatchSummary {
    instructors: BatchMember[];
    students: BatchMember[];
}

// ─── Batches CRUD ─────────────────────────────────────────────────────────────

export async function fetchBatches(): Promise<{ data: BatchSummary[] }> {
    return callBackend(`${getBackendUrl()}/api/institute-admin/batches`);
}

export async function fetchBatchDetail(id: string): Promise<{ data: BatchDetail }> {
    return callBackend(`${getBackendUrl()}/api/institute-admin/batches/${id}`);
}

export async function createBatch(payload: {
    name: string;
    description?: string;
    maxStudents?: number | null;
    status?: BatchStatus;
}): Promise<{ data: BatchSummary }> {
    return callBackend(`${getBackendUrl()}/api/institute-admin/batches`, {
        method: 'POST', body: JSON.stringify(payload),
    });
}

export async function updateBatch(
    id: string,
    payload: { name?: string; description?: string; status?: BatchStatus; maxStudents?: number | null },
): Promise<{ data: { id: string; name: string; status: BatchStatus; maxStudents: number | null } }> {
    return callBackend(`${getBackendUrl()}/api/institute-admin/batches/${id}`, {
        method: 'PATCH', body: JSON.stringify(payload),
    });
}

export async function deleteBatch(id: string): Promise<{ data: { deleted: boolean } }> {
    return callBackend(`${getBackendUrl()}/api/institute-admin/batches/${id}`, { method: 'DELETE' });
}

// ─── Batch Members ────────────────────────────────────────────────────────────

export async function addInstructor(batchId: string, userId: string): Promise<{ data: BatchMember }> {
    return callBackend(`${getBackendUrl()}/api/institute-admin/batches/${batchId}/instructors`, {
        method: 'POST', body: JSON.stringify({ userId }),
    });
}

export async function removeInstructor(batchId: string, userId: string): Promise<void> {
    await callBackend(`${getBackendUrl()}/api/institute-admin/batches/${batchId}/instructors/${userId}`, {
        method: 'DELETE',
    });
}

export async function addStudent(batchId: string, userId: string): Promise<{ data: BatchMember }> {
    return callBackend(`${getBackendUrl()}/api/institute-admin/batches/${batchId}/students`, {
        method: 'POST', body: JSON.stringify({ userId }),
    });
}

export async function removeStudent(batchId: string, userId: string): Promise<void> {
    await callBackend(`${getBackendUrl()}/api/institute-admin/batches/${batchId}/students/${userId}`, {
        method: 'DELETE',
    });
}
