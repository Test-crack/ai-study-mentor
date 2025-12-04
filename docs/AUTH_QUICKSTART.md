# Authentication Quick Start ⚡

## 30-Second Setup

### 1. Import
```typescript
import { callBackend } from '@/lib/auth';
```

### 2. Use
```typescript
// GET
const data = await callBackend('/api/reading/modules');

// POST
const result = await callBackend('/api/reading/submit', {
  method: 'POST',
  body: JSON.stringify({ data })
});
```

**That's it!** The JWT token is automatically included.

## How It Works

```typescript
// Automatically adds this header:
Authorization: Bearer <your-jwt-token>
```

## In Your API Files

```typescript
import { callBackend } from './auth';

export const fetchData = async (authenticated = false) => {
  const url = `${backendUrl}/api/data`;
  
  if (authenticated) {
    return await callBackend(url);  // ← Authenticated
  }
  
  const response = await fetch(url);  // ← Public
  return response.json();
};

// Usage
const data = await fetchData(true);  // Authenticated
const data = await fetchData();      // Public
```

## Backend Setup

```typescript
// middleware/auth.ts
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

// routes
router.post('/api/submit', requireAuth, handler);
```

## Complete Example

### Frontend
```typescript
// src/lib/reading-api.ts
import { callBackend } from './auth';

export const submitAssessment = async (data, authenticated = false) => {
  const url = `${backendUrl}/api/reading/submit`;
  
  if (authenticated) {
    return await callBackend(url, {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }
  
  // Public fallback
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
  return response.json();
};
```

### Component
```typescript
// src/components/AssessmentForm.tsx
import { submitAssessment } from '@/lib/reading-api';

function AssessmentForm() {
  const handleSubmit = async (data) => {
    try {
      const result = await submitAssessment(data, true);
      console.log('Success:', result);
    } catch (error) {
      console.error('Error:', error);
    }
  };
}
```

## With React Hook (Optional)

```typescript
import { useAuthenticatedApi } from '@/lib/auth';

function MyComponent() {
  const { loading, post } = useAuthenticatedApi();
  
  const handleSubmit = async () => {
    const result = await post('/api/submit', data);
  };
  
  return <button onClick={handleSubmit} disabled={loading}>Submit</button>;
}
```

## Files

- **Core:** `src/lib/auth/authClient.ts` - The `callBackend()` function
- **Hook:** `src/lib/auth/useAuthenticatedApi.ts` - React hook
- **Exports:** `src/lib/auth/index.ts` - Public API

## Documentation

📖 **Full docs in `docs/` folder:**
- [AUTH_SIMPLE_GUIDE.md](./docs/AUTH_SIMPLE_GUIDE.md) - Complete guide
- [AUTH_QUICK_REFERENCE.md](./docs/AUTH_QUICK_REFERENCE.md) - Quick reference
- [AUTH_USAGE_EXAMPLES.md](./docs/AUTH_USAGE_EXAMPLES.md) - 10+ examples
- [docs/README.md](./docs/README.md) - Documentation index

## Troubleshooting

| Error | Solution |
|-------|----------|
| "Not authenticated" | User not logged in - check session |
| 401 Unauthorized | Token expired - re-login |
| CORS error | Check backend CORS config |

## Benefits

✅ Simple - One function  
✅ Automatic - JWT added automatically  
✅ Clean - No duplicate files  
✅ Flexible - Works everywhere  
✅ Type-safe - Full TypeScript  

---

**Ready to use!** See [docs/AUTH_SIMPLE_GUIDE.md](./docs/AUTH_SIMPLE_GUIDE.md) for more details.
