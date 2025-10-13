// API utility functions

/**
 * Get the backend URL for API calls
 * In development, returns empty string to use relative URLs with Vite proxy
 * In production, returns the configured backend URL
 */
export const getBackendUrl = (): string => {
  // In development, use relative URLs to leverage Vite's proxy
  if (import.meta.env.DEV) {
    return ''; // Use relative URLs, proxy will handle the routing
  }
  return import.meta.env.VITE_BACKEND_URL || 'http://localhost:4000';
};

/**
 * Enhanced fetch function that automatically handles CORS and backend URL
 */
export const apiRequest = async (
  endpoint: string, 
  options: RequestInit = {}
): Promise<Response> => {
  const backendUrl = getBackendUrl();
  const url = `${backendUrl}${endpoint}`;
  
  try {
    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });
    
    return response;
  } catch (error) {
    if (error instanceof TypeError && error.message.includes('Failed to fetch')) {
      throw new Error(`CORS_ERROR: Cannot connect to backend server at ${backendUrl}. This might be due to CORS policy or network issues.`);
    }
    throw error;
  }
};