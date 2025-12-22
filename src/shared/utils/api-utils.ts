/**
 * Get the backend API URL from environment variables
 */
export function getBackendUrl(): string {
  return import.meta.env.VITE_BACKEND_URL || 'http://localhost:3000';
}
