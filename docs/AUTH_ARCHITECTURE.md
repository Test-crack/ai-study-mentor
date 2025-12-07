# Auth Architecture - Clean Approach

## Overview

This architecture centralizes all authentication logic in the `auth` folder, eliminating the need for duplicate API files.

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                     Component Layer                          │
│  (React Components, Pages, Hooks)                           │
└────────────────┬────────────────────────────────────────────┘
                 │
                 │ Calls API functions
                 │
┌────────────────▼────────────────────────────────────────────┐
│                      API Layer                               │
│  reading-api.ts, user-api.ts, etc.                          │
│                                                              │
│  fetchReadingModules(authenticated = false)                 │
│  fetchReadingPassage(id, difficulty, authenticated = false) │
│  submitAssessmentResults(data, authenticated = false)       │
└────────────────┬────────────────────────────────────────────┘
                 │
                 │ Uses getAuthHeaders() when authenticated=true
                 │
┌────────────────▼────────────────────────────────────────────┐
│                    Auth Layer                                │
│  src/lib/auth/                                              │
│                                                              │
│  ┌──────────────────────────────────────────────┐          │
│  │ authClient.ts                                 │          │
│  │  - getAuthHeaders() ← Main function          │          │
│  │  - authClient (singleton)                    │          │
│  │  - get(), post(), put(), delete()            │          │
│  └──────────────────────────────────────────────┘          │
│                                                              │
│  ┌──────────────────────────────────────────────┐          │
│  │ useAuthenticatedApi.ts                       │          │
│  │  - React hook for components                 │          │
│  │  - Handles loading states                    │          │
│  │  - Shows error toasts                        │          │
│  └──────────────────────────────────────────────┘          │
└────────────────┬────────────────────────────────────────────┘
                 │
                 │ Gets token from
                 │
┌────────────────▼────────────────────────────────────────────┐
│                  Supabase Client                             │
│  @/integrations/supabase/client                             │
│                                                              │
│  - Manages auth session                                     │
│  - Auto-refreshes tokens                                    │
│  - Stores in localStorage                                   │
└────────────────┬────────────────────────────────────────────┘
                 │
                 │ Validates with
                 │
┌────────────────▼────────────────────────────────────────────┐
│                  Backend Server                              │
│                                                              │
│  requireAuth middleware validates Bearer token              │
│  ensureUser middleware creates/fetches user                 │
└─────────────────────────────────────────────────────────────┘
```

## Request Flow

### Public Request (authenticated = false)
```
Component
   │
   ├─ fetchReadingModules(false)
   │
   ├─ headers = { 'Content-Type': 'application/json' }
   │
   ├─ fetch(url, { headers })
   │
   └─ Backend (no auth required)
```

### Authenticated Request (authenticated = true)
```
Component
   │
   ├─ fetchReadingModules(true)
   │
   ├─ getAuthHeaders()
   │    │
   │    ├─ authClient.getToken()
   │    │    │
   │    │    └─ supabase.auth.getSession()
   │    │
   │    └─ returns { 'Authorization': 'Bearer <token>', ... }
   │
   ├─ fetch(url, { headers })
   │
   └─ Backend
        │
        ├─ requireAuth middleware
        │    │
        │    ├─ Extract token from header
        │    ├─ Validate with Supabase
        │    └─ Attach user ID to request
        │
        └─ Route handler
```

## File Organization

```
src/lib/
├── auth/                          # Auth utilities (centralized)
│   ├── authClient.ts              # Core auth logic
│   ├── useAuthenticatedApi.ts     # React hook
│   ├── index.ts                   # Exports
│   ├── README.md                  # Documentation
│   ├── USAGE_EXAMPLES.md          # Examples
│   └── ARCHITECTURE.md            # This file
│
├── reading-api.ts                 # Reading API (with auth support)
├── user-api.ts                    # User API (with auth support)
├── assessment-api.ts              # Assessment API (with auth support)
└── api-utils.ts                   # Shared utilities
```

## Key Design Decisions

### 1. Single Source of Truth
All auth logic lives in `src/lib/auth/`. No auth code scattered across API files.

### 2. Optional Authentication
API functions accept an `authenticated` parameter, making them flexible:
```typescript
fetchData()      // Public
fetchData(true)  // Authenticated
```

### 3. No Duplication
Instead of:
```
reading-api.ts
reading-api.authenticated.ts  ❌ Duplicate!
```

We have:
```
reading-api.ts  ✅ Handles both!
```

### 4. Backward Compatible
Existing code continues to work without changes:
```typescript
// Old code still works
const modules = await fetchReadingModules();

// New code adds auth when needed
const modules = await fetchReadingModules(true);
```

## Three Usage Patterns

### Pattern 1: Optional Auth (Most Flexible)
```typescript
export const fetchData = async (authenticated = false) => {
  const headers = authenticated ? await getAuthHeaders() : {};
  // ...
};
```

**Use when:** Endpoint can be public or private

### Pattern 2: Always Auth (Most Secure)
```typescript
export const fetchPrivateData = async () => {
  const headers = await getAuthHeaders();
  // ...
};
```

**Use when:** Endpoint always requires authentication

### Pattern 3: Auto-detect Auth (Most Convenient)
```typescript
export const fetchSmartData = async () => {
  const { data: { session } } = await supabase.auth.getSession();
  const headers = session ? await getAuthHeaders() : {};
  // ...
};
```

**Use when:** Want automatic behavior based on login state

## Benefits

### For Developers
- ✅ One place to look for auth code
- ✅ Easy to add auth to any API
- ✅ No duplicate files to maintain
- ✅ Clear, predictable patterns

### For Codebase
- ✅ Less code duplication
- ✅ Easier to refactor
- ✅ Consistent auth handling
- ✅ Better type safety

### For Users
- ✅ Seamless auth experience
- ✅ Automatic token refresh
- ✅ Secure by default
- ✅ Fast performance

## Security Considerations

1. **Token Storage**: Handled by Supabase (localStorage with encryption)
2. **Token Refresh**: Automatic via Supabase client
3. **HTTPS Only**: Enforced in production
4. **Token Validation**: Backend validates every request
5. **No Token Exposure**: Never logged or exposed in errors

## Performance

- **Token Caching**: AuthClient caches token to avoid repeated calls
- **Lazy Loading**: Token only fetched when needed
- **Parallel Requests**: Multiple requests can share same token
- **Auto Refresh**: Supabase handles refresh in background

## Testing Strategy

```typescript
// Test public access
describe('Public API', () => {
  it('should fetch without auth', async () => {
    const data = await fetchData(false);
    expect(data).toBeDefined();
  });
});

// Test authenticated access
describe('Authenticated API', () => {
  it('should fetch with auth', async () => {
    const data = await fetchData(true);
    expect(data).toBeDefined();
  });
  
  it('should fail without token', async () => {
    // Mock no session
    await expect(fetchData(true)).rejects.toThrow();
  });
});
```

## Migration Guide

### Step 1: Import getAuthHeaders
```typescript
import { getAuthHeaders } from './auth';
```

### Step 2: Add Parameter
```typescript
// Before
export const myApi = async () => {

// After
export const myApi = async (authenticated = false) => {
```

### Step 3: Use Conditional Headers
```typescript
// Before
const response = await fetch(url);

// After
const headers = authenticated ? await getAuthHeaders() : {};
const response = await fetch(url, { headers });
```

### Step 4: Update Calls
```typescript
// Public (no change needed)
const data = await myApi();

// Authenticated (add true)
const data = await myApi(true);
```

## Common Patterns

### Pattern: Mixed Endpoints
```typescript
// Some endpoints public, some private
export const getPublicData = async () => {
  const response = await fetch('/api/public');
  return response.json();
};

export const getPrivateData = async () => {
  const headers = await getAuthHeaders();
  const response = await fetch('/api/private', { headers });
  return response.json();
};
```

### Pattern: Conditional Data
```typescript
// Return different data based on auth
export const getContent = async (authenticated = false) => {
  const headers = authenticated ? await getAuthHeaders() : {};
  const response = await fetch('/api/content', { headers });
  // Backend returns more data if authenticated
  return response.json();
};
```

### Pattern: Batch Operations
```typescript
// Multiple authenticated requests
export const batchFetch = async (urls: string[]) => {
  const headers = await getAuthHeaders();
  const promises = urls.map(url => fetch(url, { headers }));
  return Promise.all(promises);
};
```

## Troubleshooting

### Issue: "No authentication token available"
**Cause:** User not logged in  
**Solution:** Check if user has active session before calling

### Issue: 401 Unauthorized
**Cause:** Token expired or invalid  
**Solution:** Supabase auto-refreshes; if persists, re-login

### Issue: CORS error
**Cause:** Backend not configured for auth headers  
**Solution:** Add Authorization to allowed headers in CORS config

## Future Enhancements

- [ ] Add token refresh retry logic
- [ ] Add request queuing during token refresh
- [ ] Add request caching
- [ ] Add offline support
- [ ] Add request interceptors
- [ ] Add response transformers

---

**Architecture Status:** ✅ Production Ready  
**Pattern:** Centralized, Clean, No Duplication  
**Maintainability:** High  
**Security:** Strong
