# Auth Logout & "No Drills" Flicker — Debug & Fix

**Reported issues:**
1. Paul got logged out immediately after selecting the first answer in a drill
2. Another user saw "No Drills today" error on first load after login — drill loaded fine on retry

---

## Root Cause Analysis

### Issue 1 — Paul logged out after first answer

**The exact chain:**

```
Select answer → saveProgress() → PATCH /api/drills/session/:id/progress
    → auth middleware: supabaseAdmin.auth.getUser(token)  ← NETWORK CALL to Supabase
        → if this call fails/times out/errors → returns 401
    → callBackend() receives 401
    → dispatches auth:unauthorized event
    → useAuth handler calls supabase.auth.signOut() → navigates to /login
```

**The problem**: the auth middleware doesn't do local JWT verification — it calls
`supabaseAdmin.auth.getUser(token)` on **every single request**. That's an outbound
HTTP call from the VPS to Supabase's servers. Any of these causes a 401 and triggers
auto-logout:
- Supabase momentarily unreachable from VPS
- `getUser()` times out (no timeout is set, so it can hang indefinitely)
- Supabase rate-limiting the admin key
- VPS network hiccup lasting even 1–2 seconds

`saveProgress` uses `callBackend()` so the 401 → logout chain is live even on a
fire-and-forget call.

### Issue 2 — "No Drills today" on first load

Same root cause, different surface. On first load after login:
- Frontend fires `GET /api/student/daily-drill-state` immediately
- Auth middleware calls `getUser()` — if Supabase is slow (cold path) this can take 500ms+
- If it errors → 401 → component renders the empty/error fallback ("No Drills today")
- Second attempt (refresh or re-navigation) hits a warm Supabase connection → succeeds

The "loaded fine after" is the classic symptom of a transient network call on a cold path.

---

## How to Confirm Right Now

SSH into the VPS and run:

```bash
# See recent 401s with timestamps
pm2 logs --lines 500 | grep -E "401|Invalid token|Session expired|getUser|ETIMEDOUT|ECONNRESET"

# Watch live
pm2 logs --raw | grep --line-buffered -E "401|error|Error"

# Check if the process is memory-pressured (causes slow outbound calls)
pm2 monit
```

Add this temporarily to `src/middleware/auth.ts` to get timestamps on every `getUser` failure:

```typescript
const t0 = Date.now();
const { data, error } = await supabaseAdmin.auth.getUser(token);
const elapsed = Date.now() - t0;
if (error || !data.user) {
    console.error(`[Auth] getUser failed in ${elapsed}ms — ${error?.message}`);
    return res.status(401).json({ message: 'Invalid token' });
}
if (elapsed > 300) {
    console.warn(`[Auth] getUser slow: ${elapsed}ms for user ${data.user.id}`);
}
```

This will immediately show: is it timing out, erroring, or just slow?

---

## The Real Fix — Stop Calling `getUser()` on Every Request

`getUser()` is meant for cases where you need to check live session revocation.
For a drill answer save you don't need that — the JWT itself is proof of identity.
Switch to local JWT verification using the Supabase JWT secret.

### Step 1 — Install jsonwebtoken (if not already present)

```bash
npm install jsonwebtoken
npm install --save-dev @types/jsonwebtoken
```

### Step 2 — Add the JWT secret to .env

```
SUPABASE_JWT_SECRET=your-secret-from-supabase-dashboard
```

Get it from: Supabase Dashboard → Project Settings → API → **JWT Secret**

### Step 3 — Replace `getUser()` with local verify in `src/middleware/auth.ts`

```typescript
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.SUPABASE_JWT_SECRET!;

export async function requireAuth(req: AuthRequest, res: Response, next: NextFunction) {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
        return res.status(401).json({ message: 'No token provided.' });
    }
    const token = authHeader.split(' ')[1];
    try {
        const payload = jwt.verify(token, JWT_SECRET) as any;
        // Supabase puts the authenticated user id in `sub`
        req.user            = { id: payload.sub, email: payload.email };
        (req as any).appUserId = payload.sub;
        return next();
    } catch (err: any) {
        if (err.name === 'TokenExpiredError') {
            return res.status(401).json({ message: 'Session expired. Please login again.' });
        }
        return res.status(401).json({ message: 'Invalid token.' });
    }
}
```

### What you give up

The only tradeoff is **instant session revocation** — if you explicitly revoke a user's
session in Supabase, their JWT remains valid until it naturally expires (default: 1 hour).
For a study app this is an acceptable tradeoff.

---

## Summary

| | Issue 1 — Paul logout | Issue 2 — No Drills flicker |
|---|---|---|
| **Trigger** | `PATCH /progress` → auth middleware → `getUser()` network blip | `GET /daily-drill-state` → `getUser()` slow on cold path |
| **VPS related?** | Partially — VPS→Supabase latency/reliability | Partially — cold connection |
| **Code related?** | Yes — `getUser()` on every request is the design flaw | Yes — same root cause |
| **Fix** | Switch to local JWT verify | Same fix eliminates both |

Check the logs first to confirm the exact error and elapsed time, then apply the
local JWT verification to permanently eliminate both issues.
