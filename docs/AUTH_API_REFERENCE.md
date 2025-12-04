# Authentication Utilities

This folder contains centralized authentication utilities that can be used across your entire application.

## Quick Start

### Option 1: Add `authenticated` parameter to API functions (Recommended)

```typescript
// In your API file (e.g., reading-api.ts)
import { getAuthHeaders } from './auth';

export const fetchData = async (authenticated = false) => {
  const headers = authenticated 
    ? await getAuthHeaders() 
    : { 'Content-Type': 'application/json' };
    
  const response = await fetch(url, { headers });
  return response.json();
};

// Usage
const data = await fetchData(true);  // Authenticated
const data = await fetchData();      // Public
```

### Option 2: Use `authClient` directly

```typescript
import { authClient } from '@/lib/auth';

// GET request
const response = await authClient.get('/api/data');
const data = await response.json();

// POST request
const response = await authClient.post('/api/submit', { key: 'value' });
const result = await response.json();
```

### Option 3: Use React hook for components

```typescript
import { useAuthenticatedApi } from '@/lib/auth';

function MyComponent() {
  const { loading, post } = useAuthenticatedApi();
  
  const handleSubmit = async () => {
    const result = await post('/api/submit', data);
    console.log(result);
  };
  
  return <button onClick={handleSubmit} disabled={loading}>Submit</button>;
}
```

## API Reference

### `getAuthHeaders()`
Returns headers with Bearer token for authenticated requests.

```typescript
const headers = await getAuthHeaders();
// Returns: { 'Authorization': 'Bearer <token>', 'Content-Type': 'application/json' }
```

### `authClient`
Singleton instance for making authenticated requests.

**Methods:**
- `get(url)` - GET request
- `post(url, body)` - POST request
- `put(url, body)` - PUT request
- `delete(url)` - DELETE request
- `fetch(url, options)` - Custom request

### `useAuthenticatedApi(options?)`
React hook for authenticated API calls with loading states.

**Returns:**
- `loading` - Boolean loading state
- `error` - Error object if request fails
- `get(url)` - GET request
- `post(url, body)` - POST request
- `put(url, body)` - PUT request
- `delete(url)` - DELETE request

**Options:**
- `showErrorToast` - Show toast on error (default: true)
- `onError` - Custom error handler

## Backend Middleware

Your backend should validate the Bearer token:

```typescript
// Backend middleware
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
router.post('/api/submit', requireAuth, handler);
```

## Examples

### Making any API call authenticated

```typescript
// Before (public)
const response = await fetch('/api/data');

// After (authenticated) - Option 1
import { getAuthHeaders } from '@/lib/auth';
const response = await fetch('/api/data', { 
  headers: await getAuthHeaders() 
});

// After (authenticated) - Option 2
import { authClient } from '@/lib/auth';
const response = await authClient.get('/api/data');
```

### Converting existing API functions

```typescript
// Before
export const fetchData = async () => {
  const response = await fetch(url);
  return response.json();
};

// After - Add optional parameter
import { getAuthHeaders } from './auth';

export const fetchData = async (authenticated = false) => {
  const headers = authenticated ? await getAuthHeaders() : {};
  const response = await fetch(url, { headers });
  return response.json();
};
```

## Benefits

✅ **No duplicate files** - One API file handles both public and authenticated calls  
✅ **Centralized auth logic** - All auth code in one place  
✅ **Flexible** - Choose the approach that fits your use case  
✅ **Type-safe** - Full TypeScript support  
✅ **Automatic token refresh** - Handled by Supabase client  
✅ **Easy migration** - Add `authenticated` parameter to existing functions
