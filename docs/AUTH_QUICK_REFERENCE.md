# Auth Quick Reference Card

## 🚀 Quick Start (30 seconds)

```typescript
// 1. Import
import { getAuthHeaders } from './auth';

// 2. Add parameter
export const myApi = async (authenticated = false) => {
  const headers = authenticated ? await getAuthHeaders() : {};
  const response = await fetch(url, { headers });
  return response.json();
};

// 3. Use it
const data = await myApi(true);  // Authenticated
const data = await myApi();      // Public
```

## 📚 Three Ways to Use

### 1️⃣ Add Parameter (Recommended)
```typescript
import { getAuthHeaders } from './auth';

export const fetchData = async (authenticated = false) => {
  const headers = authenticated ? await getAuthHeaders() : {};
  // ... rest of code
};
```

### 2️⃣ Use authClient
```typescript
import { authClient } from '@/lib/auth';

const response = await authClient.post('/api/submit', data);
const result = await response.json();
```

### 3️⃣ Use React Hook
```typescript
import { useAuthenticatedApi } from '@/lib/auth';

function MyComponent() {
  const { loading, post } = useAuthenticatedApi();
  
  const submit = async () => {
    const result = await post('/api/submit', data);
  };
}
```

## 🔑 Core Functions

### `getAuthHeaders()`
Returns headers with Bearer token.

```typescript
const headers = await getAuthHeaders();
// { 'Authorization': 'Bearer <token>', 'Content-Type': 'application/json' }
```

### `authClient.get(url)`
Make authenticated GET request.

```typescript
const response = await authClient.get('/api/data');
const data = await response.json();
```

### `authClient.post(url, body)`
Make authenticated POST request.

```typescript
const response = await authClient.post('/api/submit', { key: 'value' });
const result = await response.json();
```

## 🎯 Common Use Cases

### Public Endpoint
```typescript
const data = await fetchData();
```

### Private Endpoint
```typescript
const data = await fetchData(true);
```

### Always Authenticated
```typescript
export const privateApi = async () => {
  const headers = await getAuthHeaders();
  // ...
};
```

### Auto-detect Auth
```typescript
const { data: { session } } = await supabase.auth.getSession();
const headers = session ? await getAuthHeaders() : {};
```

## 🛠️ Backend Setup

```typescript
// Middleware
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

// Route
router.post('/api/submit', requireAuth, handler);
```

## 📝 Cheat Sheet

| Task | Code |
|------|------|
| Import auth | `import { getAuthHeaders } from './auth';` |
| Get headers | `const headers = await getAuthHeaders();` |
| Optional auth | `async (authenticated = false) => { ... }` |
| Always auth | `const headers = await getAuthHeaders();` |
| Use authClient | `await authClient.post(url, data)` |
| Use hook | `const { post } = useAuthenticatedApi();` |
| Public call | `await myApi()` |
| Auth call | `await myApi(true)` |

## ⚡ Examples

### Example 1: Simple API
```typescript
import { getAuthHeaders } from './auth';

export const fetchUsers = async (authenticated = false) => {
  const headers = authenticated ? await getAuthHeaders() : {};
  const response = await fetch('/api/users', { headers });
  return response.json();
};
```

### Example 2: POST Request
```typescript
import { getAuthHeaders } from './auth';

export const createUser = async (data: UserData) => {
  const headers = await getAuthHeaders();
  const response = await fetch('/api/users', {
    method: 'POST',
    headers,
    body: JSON.stringify(data)
  });
  return response.json();
};
```

### Example 3: React Component
```typescript
import { useAuthenticatedApi } from '@/lib/auth';

function UserForm() {
  const { loading, post } = useAuthenticatedApi();
  
  const handleSubmit = async (data) => {
    const result = await post('/api/users', data);
    console.log(result);
  };
  
  return <button onClick={handleSubmit} disabled={loading}>Submit</button>;
}
```

## 🐛 Troubleshooting

| Error | Solution |
|-------|----------|
| "No authentication token" | User not logged in |
| 401 Unauthorized | Token expired, re-login |
| CORS error | Check backend CORS config |
| "Missing token" | Pass `authenticated=true` |

## 📖 Full Documentation

- **README.md** - Complete API reference
- **USAGE_EXAMPLES.md** - 10 real-world examples
- **ARCHITECTURE.md** - System design
- **This file** - Quick reference

## ✅ Checklist

- [ ] Import `getAuthHeaders` from `./auth`
- [ ] Add `authenticated = false` parameter
- [ ] Use conditional headers
- [ ] Test public access
- [ ] Test authenticated access
- [ ] Add backend middleware
- [ ] Handle errors

## 🎓 Remember

1. **One file** - No duplicate API files needed
2. **One import** - Just `getAuthHeaders` from `./auth`
3. **One parameter** - Add `authenticated = false`
4. **One condition** - `authenticated ? await getAuthHeaders() : {}`

---

**Keep this card handy for quick reference!** 📌
