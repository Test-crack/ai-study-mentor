# AI Study Mentor - Quick Reference

## Tech Stack
| Category | Technology |
|----------|------------|
| Framework | React 18 + TypeScript |
| Build | Vite 5.4 |
| Styling | Tailwind CSS + shadcn/ui |
| State | TanStack Query |
| Auth/DB | Supabase |
| Payments | Razorpay (India) / Stripe (International) |

## Commands
```bash
npm run dev      # Dev server → localhost:8080
npm run build    # Production build
npm run lint     # ESLint
```

## Project Structure
```
src/
├── core/           # App.tsx, router
├── features/       # auth, courses, notes, payment, profile, assessments
├── shared/         # UI components, hooks, utils
├── config/         # Constants, feature flags
├── integrations/   # Supabase client
└── styles/         # Global CSS
```

## Routes
| Path | Auth | Description |
|------|------|-------------|
| `/` | No | Landing page |
| `/auth` | No | Login/signup |
| `/courses` | No | Course catalog |
| `/courses/:slug` | No | Course details |
| `/pricing` | No | Pricing plans |
| `/dashboard` | Yes | User dashboard |
| `/learn/:slug` | Yes | Learning experience |
| `/notes` | Yes | Notes & study materials |
| `/assessment` | Yes | Reading assessment |
| `/profile` | Yes | User profile |

## API Calls
```typescript
// Authenticated request
import { callBackend } from '@/features/auth/services/authClient';
const data = await callBackend('/api/endpoint');

// With body
await callBackend('/api/endpoint', {
  method: 'POST',
  body: JSON.stringify({ key: 'value' })
});
```

## Import Alias
```typescript
import { Button } from '@/shared/components/ui/button';
import { useAuth } from '@/features/auth/hooks/useAuth';
```

## Environment Variables
```env
VITE_SUPABASE_URL=
VITE_SUPABASE_PUBLISHABLE_KEY=
VITE_BACKEND_URL=
VITE_RAZORPAY_KEY_ID=
VITE_STRIPE_PUBLIC_KEY=
```

## Feature Module Pattern
```
feature/
├── components/   # UI
├── hooks/        # Custom hooks
├── services/     # API calls
├── types/        # TypeScript types
└── index.ts      # Public exports
```

## Key Hooks
- `useAuth()` → user, loading, signOut
- `useToast()` → toast notifications
- `useCourses()` → course list with filters
- `useCourseDetail()` → single course data
- `useSubscription()` → subscription status
