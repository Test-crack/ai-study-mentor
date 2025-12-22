# Architecture Documentation

## Overview
This application follows a **feature-based modular architecture** for scalability and maintainability.

## Core Principles

### 1. Feature-Based Organization
- Code organized by business domain/feature, not technical layer
- Each feature is self-contained and independently deployable
- Clear boundaries between features

### 2. Separation of Concerns
- **Components**: UI presentation
- **Hooks**: Stateful logic and side effects
- **Services**: API calls and business logic
- **Types**: TypeScript interfaces and types

### 3. Dependency Flow
```
Features → Shared → External Libraries
```
- Features can depend on shared code
- Shared code cannot depend on features
- Features should not depend on each other

## Directory Structure

### `/src/core`
Application bootstrap and routing
- `App.tsx`: Root component
- `main.tsx`: Entry point
- `router.tsx`: Route configuration

### `/src/features`
Feature modules organized by domain

**Structure per feature:**
```
feature-name/
├── components/      # UI components
│   ├── FeaturePage.tsx
│   ├── FeatureComponent.tsx
│   └── index.ts
├── hooks/          # Custom hooks
│   └── useFeature.ts
├── services/       # API & business logic
│   └── feature-api.ts
├── types/          # TypeScript types
│   └── index.ts
└── index.ts        # Public API (barrel export)
```

**Current Features:**
- `auth`: Authentication & authorization
- `notes`: Note-taking & study materials
- `reading-assessment`: Reading comprehension tests
- `speed-assessment`: Speed reading tests
- `payment`: Subscriptions & payments
- `profile`: User profile & dashboard
- `home`: Landing page

### `/src/shared`
Code shared across multiple features

```
shared/
├── components/
│   ├── layout/     # Navbar, Footer, etc.
│   └── ui/         # Design system (shadcn/ui)
├── hooks/          # Reusable hooks
├── services/       # Shared services (Supabase)
├── types/          # Common types
└── utils/          # Utility functions
```

### `/src/config`
Application configuration
- Constants
- Environment variables
- Feature flags

### `/src/styles`
Global styles and CSS

## Import Strategy

### Barrel Exports
Each feature exports through `index.ts`:

```typescript
// features/auth/index.ts
export { AuthPage } from './components/AuthPage';
export { useAuth } from './hooks/useAuth';
export { authClient } from './services/authClient';
export * from './types';
```

### Import Patterns

✅ **Correct:**
```typescript
import { useAuth, AuthPage } from '@/features/auth';
import { Button, Card } from '@/shared/components/ui';
```

❌ **Incorrect:**
```typescript
import { useAuth } from '@/features/auth/hooks/useAuth';
import { Button } from '@/shared/components/ui/button';
```

## Data Flow

### 1. Component → Hook → Service → API

```typescript
// Component
function MyComponent() {
  const { data, loading } = useFeatureData();
  return <div>{data}</div>;
}

// Hook
function useFeatureData() {
  const [data, setData] = useState();
  useEffect(() => {
    featureService.getData().then(setData);
  }, []);
  return { data, loading };
}

// Service
export const featureService = {
  async getData() {
    return callBackend('/api/feature');
  }
};
```

### 2. State Management
- Local state: `useState`, `useReducer`
- Server state: React Query (if added)
- Global state: Context API (minimal use)
- Form state: React Hook Form

## API Layer

### Authentication
```typescript
// All API calls include auth token
import { callBackend } from '@/features/auth/services/authClient';

const data = await callBackend('/api/endpoint', {
  method: 'POST',
  body: JSON.stringify(payload)
});
```

### Error Handling
```typescript
try {
  const result = await apiCall();
  toast.success('Success!');
} catch (error) {
  toast.error(error.message);
  console.error(error);
}
```

## Component Patterns

### Page Components
Located in `features/*/components/*Page.tsx`
- Handle routing
- Fetch data
- Compose feature components

### Feature Components
Located in `features/*/components/*.tsx`
- Specific to one feature
- Receive props from page
- Use feature hooks

### Shared Components
Located in `shared/components/`
- Reusable across features
- Generic, not domain-specific
- UI library components

## Testing Strategy

### Unit Tests
- Test hooks in isolation
- Test utility functions
- Test services with mocked APIs

### Integration Tests
- Test feature flows
- Test component interactions
- Test API integration

### E2E Tests
- Test critical user journeys
- Test across features

## Performance Considerations

### Code Splitting
```typescript
// Lazy load features
const AuthPage = lazy(() => import('@/features/auth'));
```

### Memoization
```typescript
const memoizedValue = useMemo(() => compute(a, b), [a, b]);
const memoizedCallback = useCallback(() => {}, []);
```

### Bundle Size
- Tree-shaking through barrel exports
- Dynamic imports for large features
- Analyze with `vite-bundle-visualizer`

## Security

### Authentication
- JWT tokens in HTTP-only cookies
- Token refresh mechanism
- Protected routes

### Authorization
- Role-based access control
- Feature flags
- API-level permissions

### Data Validation
- Zod schemas for API responses
- Form validation with React Hook Form
- Sanitize user inputs

## Scalability

### Adding New Features
1. Create feature directory
2. Add components, hooks, services
3. Create public API (index.ts)
4. Add routes
5. Update documentation

### Splitting Large Features
When a feature grows too large:
1. Identify sub-domains
2. Create sub-features
3. Move shared code to parent feature
4. Update imports

### Micro-frontends (Future)
Features are designed to be extracted into micro-frontends:
- Self-contained
- Clear boundaries
- Independent deployment

## Development Workflow

### 1. Start New Feature
```bash
mkdir -p src/features/new-feature/{components,hooks,services,types}
touch src/features/new-feature/index.ts
```

### 2. Implement Feature
- Create components
- Add hooks for logic
- Implement services
- Define types
- Export through index.ts

### 3. Integrate
- Add route in `core/router.tsx`
- Update navigation
- Add tests

### 4. Deploy
- Feature flags for gradual rollout
- Monitor performance
- Gather feedback

## Best Practices

### DO
✅ Keep features independent
✅ Use barrel exports
✅ Co-locate related code
✅ Write TypeScript types
✅ Handle errors gracefully
✅ Use semantic naming

### DON'T
❌ Import from feature internals
❌ Create circular dependencies
❌ Mix concerns in components
❌ Ignore TypeScript errors
❌ Skip error handling
❌ Use magic numbers/strings

## Tools & Libraries

### Core
- React 18
- TypeScript
- Vite

### UI
- Tailwind CSS
- shadcn/ui
- Radix UI

### State & Data
- React hooks
- Supabase (backend)

### Routing
- React Router v6

### Forms
- React Hook Form
- Zod validation

### Utilities
- date-fns
- clsx/cn

## Future Enhancements

### Planned
- [ ] React Query for server state
- [ ] Zustand for global state
- [ ] Storybook for component docs
- [ ] Vitest for testing
- [ ] MSW for API mocking

### Considerations
- GraphQL migration
- Micro-frontend architecture
- Server-side rendering
- Progressive Web App
