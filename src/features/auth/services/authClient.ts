/**
 * Simple auth utilities for making authenticated API calls
 */

import { supabase } from '@/integrations/supabase/client';

/**
 * Get the current access token from Supabase session
 */
async function getAccessToken(): Promise<string> {
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;
  if (!token) throw new Error('Not authenticated');
  return token;
}

/**
 * Make an authenticated API call to your backend
 * Automatically includes the JWT token in the Authorization header
 * 
 * @param path - API path (e.g., '/api/reading/modules')
 * @param options - Fetch options (method, body, etc.)
 * @returns Response JSON
 * 
 * @example
 * // GET request
 * const data = await callBackend('/api/reading/modules');
 * 
 * @example
 * // POST request
 * const result = await callBackend('/api/reading/submit', {
 *   method: 'POST',
 *   body: JSON.stringify({ data })
 * });
 */
export async function callBackend(path: string, options: RequestInit = {}): Promise<any> {
  const token = await getAccessToken();

  const res = await fetch(path, {
    ...options,
    headers: {
      ...(options.headers || {}),
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
  });

  if (!res.ok) {
    if (res.status === 401) {
      window.dispatchEvent(new CustomEvent('auth:unauthorized'));
    }
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || `API error: ${res.status}`);
  }

  return res.json();
}

/**
 * Upload a file to the backend
 *
 * @param path - API path
 * @param formData - FormData object containing the file
 * @param method - HTTP method (default PUT)
 */
export async function uploadFileToBackend(path: string, formData: FormData, method: string = 'PUT'): Promise<any> {
  const token = await getAccessToken();

  const res = await fetch(path, {
    method,
    headers: {
      Authorization: `Bearer ${token}`,
      // Note: Content-Type is NOT set here so the browser can set it with the boundary for FormData
    },
    body: formData,
  });

  if (!res.ok) {
    if (res.status === 401) {
      window.dispatchEvent(new CustomEvent('auth:unauthorized'));
    }
    const errorData = await res.json().catch(() => ({}));
    const err = new Error(errorData.error || `API error: ${res.status}`);
    // Attach full body so callers can inspect fields like can_retry, message etc.
    (err as any).statusCode   = res.status;
    (err as any).responseData = errorData;
    throw err;
  }

  return res.json();
}
