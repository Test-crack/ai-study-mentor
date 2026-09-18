# AI Study Mentor - Frontend Developer Guide

## 1. Overview

AI Study Mentor is an intelligent learning platform with reading assessments, AI-powered notes, course management, and speed reading tools. Built with React, TypeScript, and a feature-based modulthis project.

---

## Table of Contents

1. [Tech Stack](#tech-stack)
2. [Project Architecture](#project-architecture)
3. [Directory Structure](#directory-structure)
4. [Getting Started](#getting-started)
5. [Feature Modules](#feature-modules)
6. [Shared Code](#shared-code)
7. [Routing & Navigation](#routing--navigation)
8. [Authentication](#authentication)
9. [API Integration](#api-integration)
10. [State Management](#state-management)
11. [Styling & Theming](#styling--theming)
12. [UI Components](#ui-components)
13. [Environment Configuration](#environment-configuration)
14. [Development Workflow](#development-workflow)
15. [Best Practices](#best-practices)

---

## Tech Stack

| Category | Technology |
|----------|------------|
| Framework | React 18.3 |
| Language | TypeScript 5.5 |
| Build Tool | Vite 5.4 |
| Styling | Tailwind CSS 3.4 |
| UI Library | shadcn/ui (Radix primitives) |
| State Management | TanStack Query (React Query) 5.x |
| Routing | React Router DOM 6.x |
| Forms | React Hook Form + Zod validation |
| Auth & Database | Supabase |
| Payments | Razorpay + Stripe |
| Animations | Framer Motion |
| Charts | Recharts |
| Icons | Lucide React |

---

## Project Architecture

This project follows a **feature-based modular architecture** designed for scalability and maintainability.

### Core Principles

1. **Feature Isolation** - Each feature is self-contained with its own components, hooks, services, and types
2. **Shared Code** - Common utilities and UI components live in `shared/`
3. **Single Responsibility** - Each module has a clear, focused purpose
4. **Barrel Exports** - Features expose public API through `index.ts`

### Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                         App Entry                           │
│                    (src/core/App.tsx)                       │
├─────────────────────────────────────────────────────────────┤
│                         Router                              │
│                   (src/core/router.tsx)                     │
├─────────────────────────────────────────────────────────────┤
│                      Feature Modules                        │
│  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐          │
│  │  auth   │ │  notes  │ │ courses │ │ payment │  ...      │
│  └─────────┘ └─────────┘ └─────────┘ └─────────┘          │
├─────────────────────────────────────────────────────────────┤
│                       Shared Layer                          │
│  ┌──────────────┐ ┌───────────┐ ┌───────────┐             │
│  │  components  │ │   hooks   │ │   utils   │             │
│  └──────────────┘ └───────────┘ └───────────┘             │
├─────────────────────────────────────────────────────────────┤
│                      Integrations                           │
│                       (Supabase)                            │
└─────────────────────────────────────────────────────────────┘
```

---

## Directory Structure

```
src/
├── core/                          # Application core
│   ├── App.tsx                    # Root component with providers
│   ├── router.tsx                 # Route definitions (alternative)
│   └── main.tsx                   # Entry point
│
├── features/                      # Feature modules
│   ├── auth/                      # Authentication
│   │   ├── components/
│   │   │   └── AuthPage.tsx
│   │   ├── hooks/
│   │   │   ├── useAuth.tsx        # Auth context & hook
│   │   │   └── useAuthenticatedApi.ts
│   │   ├── services/
│   │   │   └── authClient.ts      # API client with JWT
│   │   ├── types/
│   │   │   └── index.ts
│   │   └── index.ts               # Public exports
│   │
│   ├── courses/                   # Course management
│   │   ├── components/
│   │   │   ├── CoursesPage.tsx
│   │   │   ├── CourseDetailPage.tsx
│   │   │   ├── CoursesList.tsx
│   │   │   ├── CoursesFilters.tsx
│   │   │   └── learning/          # Learning experience
│   │   │       └── LearningPage.tsx
│   │   ├── hooks/
│   │   │   ├── useCourses.ts
│   │   │   ├── useCourseDetail.ts
│   │   │   └── useProgressTracking.ts
│   │   ├── services/
│   │   │   └── coursesService.ts
│   │   ├── types/
│   │   │   ├── index.ts
│   │   │   └── learning.ts
│   │   └── index.ts
│   │
│   ├── notes/                     # Notes & study materials
│   │   ├── components/
│   │   │   ├── NotesPage.tsx
│   │   │   ├── NotesUpload.tsx
│   │   │   ├── GeneratedNotesDisplay.tsx
│   │   │   ├── YouTubeAnalyzer.tsx
│   │   │   └── TranscriptViewer.tsx
│   │   ├── services/
│   │   │   └── youtube-transcript.ts
│   │   └── index.ts
│   │
│   ├── reading-assessment/        # Reading comprehension tests
│   │   ├── components/
│   │   │   └── ReadingAssessmentPage.tsx
│   │   ├── services/
│   │   ├── types/
│   │   └── index.ts
│   │
│   ├── speed-assessment/          # Speed reading tests
│   │   ├── components/
│   │   │   └── SpeedAssessmentPage.tsx
│   │   └── index.ts
│   │
│   ├── payment/                   # Payments & subscriptions
│   │   ├── components/
│   │   │   ├── PricingPage.tsx
│   │   │   ├── PaymentSuccess.tsx
│   │   │   └── PremiumModal.tsx
│   │   ├── services/
│   │   │   └── payment-service.ts
│   │   ├── types/
│   │   └── index.ts
│   │
│   ├── profile/                   # User profile
│   │   ├── components/
│   │   │   └── ProfilePage.tsx
│   │   └── index.ts
│   │
│   ├── home/                      # Landing & dashboard
│   │   ├── components/
│   │   │   ├── LandingPage.tsx
│   │   │   └── DashboardPage.tsx
│   │   └── index.ts
│   │
│   ├── README.md                  # Feature guidelines
│   └── FEATURE_TEMPLATE.md        # Template for new features
│
├── shared/                        # Shared code
│   ├── components/
│   │   ├── layout/
│   │   │   ├── Navbar.tsx
│   │   │   └── NotFoundPage.tsx
│   │   └── ui/                    # shadcn/ui components
│   │       ├── button.tsx
│   │       ├── card.tsx
│   │       ├── dialog.tsx
│   │       ├── form.tsx
│   │       ├── input.tsx
│   │       ├── toast.tsx
│   │       └── ... (50+ components)
│   ├── hooks/
│   │   ├── use-mobile.tsx
│   │   ├── use-toast.ts
│   │   ├── usePageVisibility.ts
│   │   └── useSubscription.ts
│   ├── services/
│   │   └── supabase.ts
│   ├── types/
│   │   └── index.ts
│   ├── utils/
│   │   ├── utils.ts               # cn() utility
│   │   └── api-utils.ts
│   └── README.md
│
├── config/                        # Configuration
│   └── constants.ts               # App constants & feature flags
│
├── integrations/                  # External integrations
│   └── supabase/
│       ├── client.ts              # Supabase client instance
│       └── types.ts               # Database types
│
├── styles/                        # Global styles
│   ├── index.css                  # Main styles
│   └── enhanced-markdown.css      # Markdown styling
│
├── index.css                      # Tailwind imports & CSS variables
├── main.tsx                       # App entry point
└── vite-env.d.ts                  # Vite type declarations
```

---

## Getting Started

### Prerequisites

- Node.js 18+ (recommended: use nvm)
- npm or bun

### Installation

```bash
# Clone the repository
git clone <repository-url>
cd <project-directory>

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Edit .env with your Supabase credentials

# Start development server
npm run dev
```

### Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start dev server on port 8080 |
| `npm run build` | Production build |
| `npm run build:dev` | Development build |
| `npm run preview` | Preview production build |
| `npm run lint` | Run ESLint |

---

## Feature Modules

### Feature Structure

Each feature follows this standard structure:

```
feature-name/
├── components/          # React components
│   ├── FeaturePage.tsx  # Main page component
│   ├── SubComponent.tsx # Supporting components
│   └── index.ts         # Component exports
├── hooks/               # Custom React hooks
│   ├── useFeatureData.ts
│   └── index.ts
├── services/            # API calls & business logic
│   ├── feature-api.ts
│   └── index.ts
├── types/               # TypeScript interfaces
│   └── index.ts
└── index.ts             # Public API (barrel export)
```

### Creating a New Feature

1. Copy the template from `src/features/FEATURE_TEMPLATE.md`
2. Create the feature directory structure
3. Implement components, hooks, and services
4. Export public API through `index.ts`
5. Add route in `src/core/App.tsx`

### Feature Guidelines

- **Self-contained**: Features should be independent
- **No cross-feature imports**: Use `shared/` for common code
- **Public API only**: Import from `index.ts`, not internal files
- **Clear naming**: Use domain-specific, descriptive names

---

## Shared Code

### When to Use Shared

Move code to `shared/` when:
- Used by 2+ features
- Generic/reusable functionality
- UI components from design system
- Common utilities

### When NOT to Use Shared

Keep in feature when:
- Feature-specific logic
- Only used in one feature
- Domain-specific types

### Shared Components

#### Layout Components (`shared/components/layout/`)
- `Navbar.tsx` - Main navigation bar
- `NotFoundPage.tsx` - 404 page

#### UI Components (`shared/components/ui/`)

Full shadcn/ui component library including:

| Component | Description |
|-----------|-------------|
| `button` | Button variants (default, destructive, outline, etc.) |
| `card` | Card container with header, content, footer |
| `dialog` | Modal dialogs |
| `form` | Form components with React Hook Form integration |
| `input` | Text input fields |
| `select` | Dropdown select |
| `toast` | Toast notifications |
| `tabs` | Tab navigation |
| `table` | Data tables |
| `dropdown-menu` | Dropdown menus |
| `sheet` | Slide-out panels |
| `skeleton` | Loading skeletons |
| ... | 50+ more components |

### Shared Hooks

| Hook | Purpose |
|------|---------|
| `use-mobile` | Detect mobile viewport |
| `use-toast` | Toast notification system |
| `usePageVisibility` | Track page visibility state |
| `useSubscription` | Subscription status management |

### Shared Utilities

```typescript
// src/shared/utils/utils.ts
import { cn } from '@/shared/utils/utils';

// Merge Tailwind classes conditionally
cn('base-class', condition && 'conditional-class', 'another-class')
```

---

## Routing & Navigation

### Route Configuration

Routes are defined in `src/core/App.tsx`:

```typescript
<Routes>
  {/* Public routes */}
  <Route path="/" element={<LandingPage />} />
  <Route path="/auth" element={<AuthPage />} />
  <Route path="/pricing" element={<PricingPage />} />
  <Route path="/courses" element={<CoursesPage />} />
  <Route path="/courses/:slug" element={<CourseDetailPage />} />
  
  {/* Protected routes (require authentication) */}
  <Route path="/dashboard" element={<DashboardPage />} />
  <Route path="/learn/:slug" element={<LearningPage />} />
  <Route path="/notes" element={<NotesPage />} />
  <Route path="/profile" element={<ProfilePage />} />
  <Route path="/assessment" element={<ReadingAssessmentPage />} />
  
  {/* Fallback */}
  <Route path="*" element={<NotFoundPage />} />
</Routes>
```

### Route Protection

Authentication is handled automatically in `AppRoutes`:
- Unauthenticated users are redirected to `/auth` for protected routes
- Authenticated users are redirected to `/dashboard` when visiting `/auth`

---

## Authentication

### Auth Provider

The app uses Supabase Auth wrapped in a React context:

```typescript
import { useAuth } from '@/features/auth/hooks/useAuth';

function MyComponent() {
  const { user, loading, signOut } = useAuth();
  
  if (loading) return <Spinner />;
  if (!user) return <Navigate to="/auth" />;
  
  return <div>Welcome, {user.email}</div>;
}
```

### Auth Hook API

```typescript
interface AuthContext {
  user: User | null;        // Current user object
  loading: boolean;         // Auth state loading
  signOut: () => Promise<void>;
}
```

---

## API Integration

### Backend API Calls

Use the authenticated API client for backend requests:

```typescript
import { callBackend } from '@/features/auth/services/authClient';

// GET request
const data = await callBackend('/api/courses');

// POST request
const result = await callBackend('/api/courses/enroll', {
  method: 'POST',
  body: JSON.stringify({ courseId: '123' })
});

// PUT request
await callBackend('/api/profile', {
  method: 'PUT',
  body: JSON.stringify({ name: 'New Name' })
});
```

The `callBackend` function:
- Automatically includes JWT token in Authorization header
- Sets Content-Type to application/json
- Handles error responses
- Throws on non-OK responses

### Supabase Direct Access

For direct database operations:

```typescript
import { supabase } from '@/integrations/supabase/client';

// Query data
const { data, error } = await supabase
  .from('notes')
  .select('*')
  .eq('user_id', userId);

// Insert data
const { data, error } = await supabase
  .from('notes')
  .insert({ title: 'New Note', content: '...' });
```

### API Proxy

Development server proxies `/api` requests to the backend:

```typescript
// vite.config.ts
proxy: {
  '/api': {
    target: 'https://study-material-backend.fly.dev',
    changeOrigin: true,
    secure: true,
  }
}
```

---

## State Management

### TanStack Query (React Query)

Used for server state management:

```typescript
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

// Fetch data
const { data, isLoading, error } = useQuery({
  queryKey: ['courses'],
  queryFn: () => callBackend('/api/courses')
});

// Mutate data
const mutation = useMutation({
  mutationFn: (newCourse) => callBackend('/api/courses', {
    method: 'POST',
    body: JSON.stringify(newCourse)
  }),
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ['courses'] });
  }
});
```

### Query Client Configuration

```typescript
// src/core/App.tsx
const queryClient = new QueryClient();

<QueryClientProvider client={queryClient}>
  {/* App content */}
</QueryClientProvider>
```

---

## Styling & Theming

### Tailwind CSS

Primary styling approach using utility classes:

```tsx
<div className="flex items-center gap-4 p-6 bg-white rounded-lg shadow-md">
  <h1 className="text-2xl font-bold text-gray-900">Title</h1>
</div>
```

### CSS Variables (Design Tokens)

Defined in `src/index.css`:

```css
:root {
  --background: 0 0% 100%;
  --foreground: 222.2 84% 4.9%;
  --primary: 222.2 47.4% 11.2%;
  --secondary: 210 40% 96.1%;
  --muted: 210 40% 96.1%;
  --accent: 210 40% 96.1%;
  --destructive: 0 84.2% 60.2%;
  --border: 214.3 31.8% 91.4%;
  --radius: 0.5rem;
}

.dark {
  /* Dark mode overrides */
}
```

### Using Design Tokens

```tsx
<div className="bg-background text-foreground border-border">
  <button className="bg-primary text-primary-foreground">
    Click me
  </button>
</div>
```

### Dark Mode

Enabled via `next-themes` with class-based switching:

```typescript
// tailwind.config.ts
darkMode: ["class"]
```

---

## UI Components

### Using shadcn/ui Components

```tsx
import { Button } from '@/shared/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/shared/components/ui/card';
import { Input } from '@/shared/components/ui/input';

function MyComponent() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Form Title</CardTitle>
      </CardHeader>
      <CardContent>
        <Input placeholder="Enter text..." />
        <Button variant="default">Submit</Button>
      </CardContent>
    </Card>
  );
}
```

### Button Variants

```tsx
<Button variant="default">Default</Button>
<Button variant="destructive">Delete</Button>
<Button variant="outline">Outline</Button>
<Button variant="secondary">Secondary</Button>
<Button variant="ghost">Ghost</Button>
<Button variant="link">Link</Button>
```

### Form Components

Using React Hook Form with Zod validation:

```tsx
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Form, FormField, FormItem, FormLabel, FormControl } from '@/shared/components/ui/form';

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

function LoginForm() {
  const form = useForm({
    resolver: zodResolver(schema),
  });

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)}>
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email</FormLabel>
              <FormControl>
                <Input {...field} />
              </FormControl>
            </FormItem>
          )}
        />
      </form>
    </Form>
  );
}
```

### Toast Notifications

```tsx
import { useToast } from '@/shared/hooks/use-toast';

function MyComponent() {
  const { toast } = useToast();

  const handleClick = () => {
    toast({
      title: 'Success!',
      description: 'Your action was completed.',
    });
  };
}
```

---

## Environment Configuration

### Required Variables

Create a `.env` file in the project root:

```env
# Supabase
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=your-anon-key

# Backend (optional - defaults to /api proxy)
VITE_BACKEND_URL=https://your-backend.com
```

### Accessing Environment Variables

```typescript
// In code
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;

// In config
import { SUPABASE_URL } from '@/config/constants';
```

### Feature Flags

```typescript
// src/config/constants.ts
export const FEATURES = {
  PAYMENT_ENABLED: true,
  READING_ASSESSMENT: true,
  SPEED_ASSESSMENT: true,
  NOTES_GENERATION: true,
} as const;

// Usage
if (FEATURES.PAYMENT_ENABLED) {
  // Show payment features
}
```

---

## Development Workflow

### Adding a New Page

1. Create component in appropriate feature
2. Add route in `src/core/App.tsx`
3. Add navigation link in `Navbar.tsx` if needed

### Adding a New API Endpoint

1. Create service function in feature's `services/`
2. Use `callBackend()` for authenticated requests
3. Create custom hook if needed for data fetching

### Adding a New UI Component

1. Check if shadcn/ui has the component
2. If yes, add via shadcn CLI or copy from docs
3. If no, create in `shared/components/ui/`

### Code Style

- Use TypeScript for all new code
- Follow existing patterns in the codebase
- Use functional components with hooks
- Prefer named exports over default exports

---

## Best Practices

### Component Organization

```tsx
// Good: Small, focused components
function CourseCard({ course }: { course: Course }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{course.title}</CardTitle>
      </CardHeader>
    </Card>
  );
}

// Good: Composition over prop drilling
function CourseList({ courses }: { courses: Course[] }) {
  return (
    <div className="grid gap-4">
      {courses.map(course => (
        <CourseCard key={course.id} course={course} />
      ))}
    </div>
  );
}
```

### Error Handling

```tsx
function DataComponent() {
  const { data, isLoading, error } = useQuery({...});

  if (isLoading) return <Skeleton />;
  if (error) return <ErrorMessage error={error} />;
  if (!data) return <EmptyState />;

  return <DataDisplay data={data} />;
}
```

### Type Safety

```typescript
// Define types in feature's types/index.ts
export interface Course {
  id: string;
  title: string;
  slug: string;
  description: string;
  modules: Module[];
}

// Use types in components
function CourseCard({ course }: { course: Course }) {
  // TypeScript ensures type safety
}
```

### Import Organization

```typescript
// 1. React/external libraries
import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';

// 2. Internal shared code
import { Button } from '@/shared/components/ui/button';
import { useToast } from '@/shared/hooks/use-toast';

// 3. Feature-specific imports
import { useCourses } from '../hooks/useCourses';
import { CourseCard } from './CourseCard';

// 4. Types
import type { Course } from '../types';
```

---

## Additional Resources

- [shadcn/ui Documentation](https://ui.shadcn.com/)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
- [TanStack Query Documentation](https://tanstack.com/query/latest)
- [React Router Documentation](https://reactrouter.com/)
- [Supabase Documentation](https://supabase.com/docs)
- [Zod Documentation](https://zod.dev/)

---

## Support

For questions or issues:
1. Check existing documentation in `docs/` folder
2. Review feature-specific README files
3. Consult the codebase patterns
