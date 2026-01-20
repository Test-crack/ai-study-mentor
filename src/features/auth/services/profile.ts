import { callBackend } from './authClient';
import { getBackendUrl } from '@/shared/utils';

/**
 * Fetch the current user's profile and role.
 * This is the source of truth for application-level roles (STUDENT, INSTRUCTOR, ADMIN).
 */
export const getUserProfile = async () => {
    const backendUrl = getBackendUrl();
    return await callBackend(`${backendUrl}/api/profile`, {
        method: 'GET',
    });
};
