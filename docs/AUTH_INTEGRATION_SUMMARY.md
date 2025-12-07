# Authentication Integration - Clean Approach ✅

## What Changed

Instead of creating duplicate API files (like `reading-api.authenticated.ts`), we've implemented a **centralized auth approach** where:

1. **Auth logic lives in `src/lib/auth/`** - One place for all authentication
2. **API files stay clean** - Just add an optional `authenticated` parameter
3. **No duplication** - Same API file handles both public and authenticated calls

## File Structure

```
src/lib/
├── auth/
│   ├── authClient.ts          # Core auth client + getAuthHeaders()
│   ├── useAuthenticatedApi.ts # React hook for components
│   ├── index.ts               # Exports
│   ├── README.md              # Documentation
│   └── USAGE_EXAMPLES.md      # Real-world examples
├── reading-api.ts             # Updated with auth support
└── api-utils.ts               # Existing utilities
```

## How It Works

### 1. Core Auth Function: `getAuthHeaders()`

```typescript
// src/lib/auth/authClient.ts
export async function getAuthHeaders(): Promise<HeadersInit> {
  const token = await authClient.getToken();
  return {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  };
}
```

### 2. Use in Any API File

```typescript
// src/lib/reading-api.ts
import { getAuthHeaders } from './auth';

export const fetchReadingModules = async (authenticated = false) => {
  const headers = authenticated 
    ? await getAuthHeaders() 
    : { 'Content-Type': 'application/json' };
    
  const response = await fetch(url, { headers });
  return response.json();
};
```

### 3. Call from Components

```typescript
// Public call
const modules = await fetchReadingModules();

// Authenticated call
const modules = await fetchReadingModules(true);
```

## Three Ways to Use Auth

### Option 1: Add Parameter (Recommended for existing APIs)
```typescript
export const myApi = async (authenticated = false) => {
  const headers = authenticated ? await getAuthHeaders() : {};
  // ... rest of code
};
```

### Option 2: Use authClient Directly
```typescript
import { authClient } from '@/lib/auth';

const response = await authClient.post('/api/submit', data);
```

### Option 3: Use React Hook
```typescript
import { useAuthenticatedApi } from '@/lib/auth';

function MyComponent() {
  const { loading, post } = useAuthenticatedApi();
  // ...
}
```

## Benefits

✅ **No duplicate files** - One API file, not two  
✅ **Centralized auth** - All auth logic in `src/lib/auth/`  
✅ **Backward compatible** - Existing calls still work  
✅ **Easy to add auth** - Just pass `true` parameter  
✅ **Type-safe** - Full TypeScript support  
✅ **Flexible** - Choose the approach that fits your needs  

## Updated Files

1. **src/lib/auth/authClient.ts** - Added `getAuthHeaders()` function
2. **src/lib/auth/index.ts** - Exported new function
3. **src/lib/reading-api.ts** - Added `authenticated` parameter to all functions
4. **Deleted** - `src/lib/reading-api.authenticated.ts` (no longer needed)

## Backend Middleware (Same as Before)

```typescript
// Backend: requireAuth middleware
export async function requireAuth(req, res, next) {
  const authHeader = req.headers.authorization;
  
  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Missing token' });
  }
  
  const token = authHeader.split(' ')[1];
  const { data, error } = await supabaseAdmin.auth.getUser(token);
  
  if (error || !data.user) {
    return res.status(401).json({ message: 'Invalid token' });
  }
  
  req.supabaseUserId = data.user.id;
  next();
}

// Use in routes
router.post('/api/reading/submit', requireAuth, handler);
```

## Migration Example

### Before (Public only)
```typescript
const modules = await fetchReadingModules();
```

### After (Add auth when needed)
```typescript
// Public call (unchanged)
const modules = await fetchReadingModules();

// Authenticated call (just add true)
const modules = await fetchReadingModules(true);
```

## Quick Start

1. **For new API functions:**
   ```typescript
   import { getAuthHeaders } from './auth';
   
   export const myApi = async (authenticated = false) => {
     const headers = authenticated ? await getAuthHeaders() : {};
     const response = await fetch(url, { headers });
     return response.json();
   };
   ```

2. **For existing API functions:**
   - Add `import { getAuthHeaders } from './auth';`
   - Add `authenticated = false` parameter
   - Use conditional headers: `authenticated ? await getAuthHeaders() : {}`

3. **In components:**
   ```typescript
   // When you need auth
   const data = await myApi(true);
   
   // When you don't
   const data = await myApi();
   ```

## Documentation

- **README.md** - API reference and quick start
- **USAGE_EXAMPLES.md** - 10 real-world examples
- **This file** - Summary of the approach

## Next Steps

1. ✅ Auth system is ready to use
2. ✅ Reading API updated with auth support
3. ✅ Documentation complete
4. 🔄 Update other API files as needed (same pattern)
5. 🔄 Add backend middleware to protected routes

## Testing

```typescript
// Test public access
const modules = await fetchReadingModules();
console.log('Public:', modules);

// Test authenticated access
const authModules = await fetchReadingModules(true);
console.log('Authenticated:', authModules);
```

---

**Status:** ✅ Complete and ready to use  
**Approach:** Clean, centralized, no duplication  
**Backward Compatible:** Yes  
**TypeScript Errors:** None
