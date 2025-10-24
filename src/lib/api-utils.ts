// API utility functions

/**
 * Get the backend URL for API calls
 * Reads from VITE_BACKEND_URL environment variable
 * Defaults to localhost:4000 if not set
 */
export const getBackendUrl = (): string => {
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