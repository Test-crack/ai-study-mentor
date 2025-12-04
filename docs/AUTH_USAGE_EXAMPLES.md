# Real-World Usage Examples

## Example 1: Reading API (Current Implementation)

```typescript
// src/lib/reading-api.ts
import { getAuthHeaders } from './auth';

export const fetchReadingModules = async (authenticated = false) => {
  const headers = authenticated 
    ? await getAuthHeaders() 
    : { 'Content-Type': 'application/json' };
    
  const response = await fetch(`${backendUrl}/api/reading/modules`, { headers });
  return response.json();
};

// Usage in component
const modules = await fetchReadingModules(true);  // Authenticated
const modules = await fetchReadingModules();      // Public
```

## Example 2: User Profile API

```typescript
// src/lib/user-api.ts
import { getAuthHeaders } from './auth';

export const getUserProfile = async (userId: string, authenticated = false) => {
  const headers = authenticated ? await getAuthHeaders() : {};
  const response = await fetch(`/api/users/${userId}`, { headers });
  return response.json();
};

export const updateUserProfile = async (userId: string, data: any) => {
  // Always authenticated for updates
  const headers = await getAuthHeaders();
  const response = await fetch(`/api/users/${userId}`, {
    method: 'PUT',
    headers,
    body: JSON.stringify(data)
  });
  return response.json();
};
```

## Example 3: Using authClient for Complex Requests

```typescript
// src/lib/assessment-api.ts
import { authClient } from './auth';

export const submitAssessment = async (data: AssessmentData) => {
  const response = await authClient.post('/api/assessments/submit', data);
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message);
  }
  
  return response.json();
};

export const getAssessmentHistory = async (limit = 10) => {
  const response = await authClient.get(`/api/assessments/history?limit=${limit}`);
  return response.json();
};
```

## Example 4: React Component with Hook

```typescript
// src/components/AssessmentForm.tsx
import { useAuthenticatedApi } from '@/lib/auth';
import { useState } from 'react';

export function AssessmentForm() {
  const { loading, post } = useAuthenticatedApi();
  const [formData, setFormData] = useState({});

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const result = await post('/api/assessments/submit', formData);
      console.log('Success:', result);
    } catch (error) {
      // Error toast is shown automatically
      console.error('Failed:', error);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      {/* form fields */}
      <button type="submit" disabled={loading}>
        {loading ? 'Submitting...' : 'Submit'}
      </button>
    </form>
  );
}
```

## Example 5: Mixed Public/Private Endpoints

```typescript
// src/lib/content-api.ts
import { getAuthHeaders } from './auth';

// Public endpoint - anyone can view
export const getPublicContent = async () => {
  const response = await fetch('/api/content/public');
  return response.json();
};

// Private endpoint - requires auth
export const getUserContent = async () => {
  const headers = await getAuthHeaders();
  const response = await fetch('/api/content/private', { headers });
  return response.json();
};

// Flexible endpoint - different data based on auth
export const getContent = async (authenticated = false) => {
  const headers = authenticated ? await getAuthHeaders() : {};
  const response = await fetch('/api/content', { headers });
  return response.json();
};
```

## Example 6: Error Handling

```typescript
// src/lib/api-with-error-handling.ts
import { authClient } from './auth';

export const fetchDataWithRetry = async (url: string, retries = 3) => {
  for (let i = 0; i < retries; i++) {
    try {
      const response = await authClient.get(url);
      
      if (!response.ok) {
        if (response.status === 401) {
          // Token expired, Supabase will auto-refresh
          await new Promise(resolve => setTimeout(resolve, 1000));
          continue;
        }
        throw new Error(`HTTP ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      if (i === retries - 1) throw error;
      await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)));
    }
  }
};
```

## Example 7: File Upload with Auth

```typescript
// src/lib/upload-api.ts
import { authClient } from './auth';

export const uploadFile = async (file: File) => {
  const formData = new FormData();
  formData.append('file', file);
  
  const token = await authClient.getToken();
  
  const response = await fetch('/api/upload', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`
      // Don't set Content-Type for FormData
    },
    body: formData
  });
  
  return response.json();
};
```

## Example 8: Conditional Auth Based on User State

```typescript
// src/lib/smart-api.ts
import { supabase } from '@/integrations/supabase/client';
import { getAuthHeaders } from './auth';

export const fetchContent = async (contentId: string) => {
  // Check if user is logged in
  const { data: { session } } = await supabase.auth.getSession();
  const isAuthenticated = !!session;
  
  // Use auth headers if logged in
  const headers = isAuthenticated ? await getAuthHeaders() : {};
  
  const response = await fetch(`/api/content/${contentId}`, { headers });
  return response.json();
};
```

## Example 9: Batch Requests

```typescript
// src/lib/batch-api.ts
import { authClient } from './auth';

export const batchFetch = async (urls: string[]) => {
  const promises = urls.map(url => authClient.get(url));
  const responses = await Promise.all(promises);
  const data = await Promise.all(responses.map(r => r.json()));
  return data;
};

// Usage
const [modules, passages, results] = await batchFetch([
  '/api/reading/modules',
  '/api/reading/passages',
  '/api/reading/results'
]);
```

## Example 10: Custom Hook for Specific API

```typescript
// src/hooks/useReadingApi.ts
import { useAuthenticatedApi } from '@/lib/auth';
import { useCallback } from 'react';

export function useReadingApi() {
  const { loading, post, get } = useAuthenticatedApi();

  const fetchModules = useCallback(() => {
    return get('/api/reading/modules');
  }, [get]);

  const submitAssessment = useCallback((data: any) => {
    return post('/api/reading/submit', data);
  }, [post]);

  return {
    loading,
    fetchModules,
    submitAssessment
  };
}

// Usage in component
function ReadingComponent() {
  const { loading, fetchModules, submitAssessment } = useReadingApi();
  
  // Use the methods...
}
```

## Migration Checklist

When adding auth to existing API functions:

1. ✅ Import `getAuthHeaders` from `@/lib/auth`
2. ✅ Add `authenticated = false` parameter
3. ✅ Use conditional headers: `authenticated ? await getAuthHeaders() : {}`
4. ✅ Update function calls to pass `true` when auth is needed
5. ✅ Test both authenticated and public access
6. ✅ Update backend to use `requireAuth` middleware

## Common Patterns

### Pattern 1: Always Authenticated
```typescript
export const privateApi = async () => {
  const headers = await getAuthHeaders();
  // ...
};
```

### Pattern 2: Optional Authentication
```typescript
export const flexibleApi = async (authenticated = false) => {
  const headers = authenticated ? await getAuthHeaders() : {};
  // ...
};
```

### Pattern 3: Auto-detect Authentication
```typescript
export const smartApi = async () => {
  const { data: { session } } = await supabase.auth.getSession();
  const headers = session ? await getAuthHeaders() : {};
  // ...
};
```
 