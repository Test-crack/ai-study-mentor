// src/features/auth/services/authClient.ts

import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { getSelectedExamId } from '@/shared/state/examContext';

// ─── Human-friendly messages per HTTP status ────────────────────────
const HTTP_MESSAGES: Record<number, string> = {
  400: 'Something went wrong with that request',
  401: 'Your session has expired — please log in again',
  403: "You don't have permission to do that",
  404: "That resource wasn't found",
  405: 'This action is not supported — please refresh and try again',
  408: 'The request timed out — please try again',
  409: 'There was a conflict — please refresh and try again',
  422: 'Invalid data — please check your input and try again',
  429: 'Too many requests — please wait a moment and retry',
  500: 'Something went wrong on our end — please try again',
  502: 'Server is temporarily unavailable — try again shortly',
  503: 'Server is temporarily unavailable — try again shortly',
  504: 'Server took too long to respond — please try again',
};

function friendlyMessage(status: number, serverMsg?: string): string {
  if (HTTP_MESSAGES[status]) return HTTP_MESSAGES[status];
  if (status >= 500) return 'Something went wrong on our end — please try again';
  return serverMsg || 'Something went wrong — please try again';
}

// Simple dedup: don't fire the same toast message within 2 seconds
let lastToast = { msg: '', at: 0 };
function dedupeToast(msg: string) {
  const now = Date.now();
  if (msg === lastToast.msg && now - lastToast.at < 2000) return;
  lastToast = { msg, at: now };
  toast.error(msg);
}

// ─── Token ──────────────────────────────────────────────────────────
async function getAccessToken(): Promise<string> {
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;
  if (!token) throw new Error('Not authenticated');
  return token;
}

// ─── Core fetch wrapper with global error interception ──────────────

function handleNetworkError(err: unknown, silent?: boolean): never {
  if (!navigator.onLine) {
    // Banner already visible — don't toast, just throw
    const offlineErr = new Error("You're offline — please check your internet connection");
    (offlineErr as any).isOffline = true;
    (offlineErr as any)._toasted = true; // signal QueryCache to skip
    throw offlineErr;
  }
  if (!silent) dedupeToast('Unable to reach the server — please try again');
  const netErr = err instanceof Error ? err : new Error('Network error');
  (netErr as any)._toasted = true;
  throw netErr;
}

async function handleHttpError(res: Response, silent?: boolean): Promise<never> {
  if (res.status === 401) {
    window.dispatchEvent(new CustomEvent('auth:unauthorized'));
  }

  const errorData = await res.json().catch(() => ({}));
  const msg = friendlyMessage(res.status, errorData?.error);

  // Don't toast 401 if we're dispatching the auth event (redirect handles it).
  // Also skip for calls the caller has marked best-effort/silent — they already
  // handle the failure themselves (e.g. falling back to unscoped data) and
  // don't want a user-facing error for something that isn't one.
  if (res.status !== 401 && !silent) {
    dedupeToast(msg);
  }

  const err = new Error(errorData?.error || `API error: ${res.status}`);
  (err as any).statusCode = res.status;
  (err as any).responseData = errorData;
  (err as any)._toasted = true;
  throw err;
}

// ─── Public API (unchanged signatures) ──────────────────────────────

export async function callBackend(path: string, options: RequestInit = {}, config?: { silent?: boolean }): Promise<any> {
  // Pre-flight: if already offline, fail fast
  if (!navigator.onLine) {
    const err = new Error("You're offline — please check your internet connection");
    (err as any).isOffline = true;
    (err as any)._toasted = true;
    throw err;
  }

  const token = await getAccessToken();
  const examId = getSelectedExamId();

  let res: Response;
  try {
    res = await fetch(path, {
      ...options,
      headers: {
        ...(options.headers || {}),
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
        // Owner/Admin exam context; backend ignores it on non-owner/admin routes.
        ...(examId ? { 'X-Exam-Id': examId } : {}),
      },
    });
  } catch (err) {
    handleNetworkError(err, config?.silent);
  }

  if (!res.ok) {
    await handleHttpError(res, config?.silent);
  }

  return res.json();
}

export async function uploadFileToBackend(
  path: string,
  formData: FormData,
  method: string = 'PUT'
): Promise<any> {
  if (!navigator.onLine) {
    const err = new Error("You're offline — please check your internet connection");
    (err as any).isOffline = true;
    (err as any)._toasted = true;
    throw err;
  }

  const token = await getAccessToken();

  let res: Response;
  try {
    res = await fetch(path, {
      method,
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: formData,
    });
  } catch (err) {
    handleNetworkError(err);
  }

  if (!res.ok) {
    await handleHttpError(res);
  }

  return res.json();
}

/**
 * Send a FormData body (POST) or a plain GET and get back a raw file (not
 * JSON) — e.g. a CSV/xlsx export. Reads the filename from
 * Content-Disposition when the server sets one, falling back to a generic
 * name otherwise. Pass method: 'GET' with formData omitted for a bodyless
 * download (GET requests cannot carry a body).
 */
export async function downloadFileFromBackend(
  path: string,
  formData?: FormData,
  method: 'POST' | 'GET' = 'POST'
): Promise<{ blob: Blob; filename: string }> {
  if (!navigator.onLine) {
    const err = new Error("You're offline — please check your internet connection");
    (err as any).isOffline = true;
    (err as any)._toasted = true;
    throw err;
  }

  const token = await getAccessToken();

  let res: Response;
  try {
    res = await fetch(path, {
      method,
      headers: { Authorization: `Bearer ${token}` },
      ...(method === 'POST' ? { body: formData } : {}),
    });
  } catch (err) {
    handleNetworkError(err);
  }

  if (!res.ok) {
    await handleHttpError(res);
  }

  const disposition = res.headers.get('Content-Disposition') ?? '';
  const match = /filename="?([^";]+)"?/.exec(disposition);
  const filename = match?.[1] ?? 'download';

  return { blob: await res.blob(), filename };
}