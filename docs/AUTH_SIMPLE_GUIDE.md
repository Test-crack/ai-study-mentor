# Simple Authentication Guide

## Overview

This is a simple JWT-based authentication system using Supabase. One function handles all authenticated API calls.

## Quick Start (30 seconds)

### 1. Import the function
```typescript
import { callBackend } from '@/lib/auth';
```

### 2. Make authenticated calls
```typescript
// GET request
const data = await callBackend('/api/reading/modules');

// POST request
const result = await callBackend('/api/reading/submit', {
  method: 'POST',
  body: JSON.stringify({ data })
});
```

That's it! The JWT token is automatically included.

## How It Works

```typescript
// src/lib/auth/authClient.ts
import { supabase } from '@/integrations/supabase/client';

async function getAccessToken() {
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;
  if (!token) throw new Error('Not authenticated');
  return token;
}

export async function callBackend(path: string, options: RequestInit = {}) {
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
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || `API error: ${res.status}`);
  }
  
  return res.json();
}
```

## Usage in API Files

### Example: reading-api.ts

```typescript
import { callBackend } from './auth';

export const fetchReadingModules = async (authenticated = false) => {
  const fullUrl = `${backendUrl}/api/reading/modules`;
  
  if (authenticated) {
    return await callBackend(fullUrl);
  }
  
  // Public call
  const response = await fetch(fullUrl);
  return response.json();
};

// Usage
const modules = await fetchReadingModules(true);  // Authenticated
const modules = await fetchReadingModules();      // Public
```

## Usage in React Components

### Option 1: Direct call
```typescript
import { callBackend } from '@/lib/auth';

function MyComponent() {
  const handleSubmit = async () => {
    try {
      const result = await callBackend('/api/submit', {
        method: 'POST',
        body: JSON.stringify(data)
      });
      console.log('Success:', result);
    } catch (error) {
      console.error('Error:', error);
    }
  };
}
```

### Option 2: Use hook (with loading states)
```typescript
import { useAuthenticatedApi } from '@/lib/auth';

function MyComponent() {
  const { loading, post } = useAuthenticatedApi();
  
  const handleSubmit = async () => {
    const result = await post('/api/submit', data);
    console.log('Success:', result);
  };
  
  return <button onClick={handleSubmit} disabled={loading}>Submit</button>;
}
```

## Backend Middleware

Your backend validates the JWT token:

```typescript
// Backend: middleware/auth.ts
import { supabaseAdmin } from '../config/supabase';

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
  req.userEmail = data.user.email;
  next();
}

// Use in routes
router.post('/api/reading/submit', requireAuth, handler);
```

## Complete Example

### Frontend API
```typescript
// src/lib/reading-api.ts
import { getBackendUrl } from './api-utils';
import { callBackend } from './auth';

export const submitAssessment = async (data: AssessmentData, authenticated = false) => {
  const fullUrl = `${getBackendUrl()}/api/reading/submit`;
  
  if (authenticated) {
    return await callBackend(fullUrl, {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }
  
  // Public submission (if allowed)
  const response = await fetch(fullUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
  
  return response.json();
};
```

### Component Usage
```typescript
// src/components/AssessmentForm.tsx
import { submitAssessment } from '@/lib/reading-api';

function AssessmentForm() {
  const handleSubmit = async (data) => {
    try {
      const result = await submitAssessment(data, true); // Authenticated
      console.log('Submitted:', result);
    } catch (error) {
      console.error('Failed:', error);
    }
  };
}
```

## Error Handling

```typescript
try {
  const result = await callBackend('/api/submit', {
    method: 'POST',
    body: JSON.stringify(data)
  });
} catch (error) {
  if (error.message === 'Not authenticated') {
    // Redirect to login
  } else if (error.message.includes('API error: 401')) {
    // Token expired, refresh session
  } else {
    // Other errors
    console.error(error);
  }
}
```

## Benefits

✅ **Simple** - One function for all authenticated calls  
✅ **Automatic** - JWT token added automatically  
✅ **Clean** - No duplicate API files needed  
✅ **Flexible** - Works with any endpoint  
✅ **Type-safe** - Full TypeScript support  

## Files

- `src/lib/auth/authClient.ts` - Core auth function
- `src/lib/auth/useAuthenticatedApi.ts` - React hook
- `src/lib/auth/index.ts` - Exports

## Checklist

- [x] Import `callBackend` from `@/lib/auth`
- [x] Use `callBackend(url, options)` for authenticated calls
- [x] Add `authenticated` parameter to API functions
- [x] Add `requireAuth` middleware to backend routes
- [x] Test authenticated and public access

---

**That's it!** Simple, clean, and effective.
