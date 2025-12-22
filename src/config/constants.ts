// Application-wide constants
export const APP_NAME = 'AI Study Mentor';
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';
export const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
export const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Feature flags
export const FEATURES = {
  PAYMENT_ENABLED: true,
  READING_ASSESSMENT: true,
  SPEED_ASSESSMENT: true,
  NOTES_GENERATION: true,
} as const;

// Pagination defaults
export const DEFAULT_PAGE_SIZE = 10;
export const MAX_PAGE_SIZE = 100;
