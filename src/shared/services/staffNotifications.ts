// src/shared/services/staffNotifications.ts
//
// Read/mark/dismiss against the recipient-generic user_notifications endpoints.
// One implementation for every staff portal — the backend handlers
// (getUserNotifications / markUserNotificationsRead / dismissUserNotification)
// are already role-agnostic and identical per mount point, so the only thing
// that varies is the path prefix.
//
// NOTE: /api/institute-owner/notifications is NOT mounted yet — see
// docs/BACKEND_REQUEST_dropout_risk_notifications.md Request 2. Until it is,
// calls for that scope 404. Callers must treat a failure as "no notifications"
// and stay silent: this is a topbar widget, and an error toast on every page
// load in the owner portal would be worse than an empty bell.

import { callBackend } from '@/features/auth/services/authClient';
import { getBackendUrl } from '@/shared/utils';
import type { StaffScope } from '@/shared/notifications/staffEvents';

const BASE = (scope: StaffScope) => `${getBackendUrl()}/api/${scope}`;

export interface StaffNotificationEvent {
    id: string;
    type: string;
    payload: Record<string, any>;
    created_at: string;
    read_at: string | null;
    dismissed_at: string | null;
}

export interface StaffNotificationsResponse {
    success: boolean;
    events: StaffNotificationEvent[];
    unread_count: number;
    next_cursor: string | null;
}

export async function fetchStaffNotifications(scope: StaffScope): Promise<StaffNotificationsResponse> {
    return callBackend(`${BASE(scope)}/notifications`);
}

export async function markStaffNotificationsRead(
    scope: StaffScope,
    body: { all?: boolean; ids?: string[] }
): Promise<{ success: boolean }> {
    return callBackend(`${BASE(scope)}/notifications/read`, {
        method: 'POST',
        body: JSON.stringify(body),
    });
}

export async function dismissStaffNotification(
    scope: StaffScope,
    id: string
): Promise<{ success: boolean }> {
    return callBackend(`${BASE(scope)}/notifications/${id}/dismiss`, { method: 'POST' });
}
