# Feature Template

Use this template when creating a new feature.

## Structure

```
feature-name/
├── components/
│   ├── FeatureNamePage.tsx
│   ├── FeatureComponent.tsx
│   └── index.ts
├── hooks/
│   ├── useFeatureData.ts
│   └── index.ts
├── services/
│   ├── feature-api.ts
│   └── index.ts
├── types/
│   └── index.ts
└── index.ts
```

## Files to Create

### 1. Main Page Component
**Path:** `components/FeatureNamePage.tsx`

```typescript
import { useFeatureData } from '../hooks/useFeatureData';
import { FeatureComponent } from './FeatureComponent';

export default function FeatureNamePage() {
  const { data, loading, error } = useFeatureData();

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;

  return (
    <div>
      <h1>Feature Name</h1>
      <FeatureComponent data={data} />
    </div>
  );
}
```

### 2. Feature Component
**Path:** `components/FeatureComponent.tsx`

```typescript
interface FeatureComponentProps {
  data: any;
}

export function FeatureComponent({ data }: FeatureComponentProps) {
  return (
    <div>
      {/* Component content */}
    </div>
  );
}
```

### 3. Components Index
**Path:** `components/index.ts`

```typescript
export { default as FeatureNamePage } from './FeatureNamePage';
export { FeatureComponent } from './FeatureComponent';
```

### 4. Custom Hook
**Path:** `hooks/useFeatureData.ts`

```typescript
import { useState, useEffect } from 'react';
import { featureApi } from '../services/feature-api';

export function useFeatureData() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    featureApi.getData()
      .then(setData)
      .catch(setError)
      .finally(() => setLoading(false));
  }, []);

  return { data, loading, error };
}
```

### 5. Hooks Index
**Path:** `hooks/index.ts`

```typescript
export { useFeatureData } from './useFeatureData';
```

### 6. API Service
**Path:** `services/feature-api.ts`

```typescript
import { callBackend } from '@/features/auth/services/authClient';

export const featureApi = {
  async getData() {
    return callBackend('/api/feature/data');
  },

  async createItem(data: any) {
    return callBackend('/api/feature/items', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async updateItem(id: string, data: any) {
    return callBackend(`/api/feature/items/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  async deleteItem(id: string) {
    return callBackend(`/api/feature/items/${id}`, {
      method: 'DELETE',
    });
  },
};
```

### 7. Services Index
**Path:** `services/index.ts`

```typescript
export { featureApi } from './feature-api';
```

### 8. Types
**Path:** `types/index.ts`

```typescript
export interface FeatureData {
  id: string;
  name: string;
  description: string;
  createdAt: string;
}

export interface FeatureItem {
  id: string;
  featureId: string;
  value: string;
}

export interface CreateFeatureItemDto {
  featureId: string;
  value: string;
}
```

### 9. Feature Index (Public API)
**Path:** `index.ts`

```typescript
// Components
export { FeatureNamePage } from './components';
export { FeatureComponent } from './components';

// Hooks
export { useFeatureData } from './hooks';

// Services
export { featureApi } from './services';

// Types
export * from './types';
```

## Add Route

**Path:** `src/core/router.tsx`

```typescript
import { FeatureNamePage } from '@/features/feature-name';

// Add to routes array
{
  path: '/feature-name',
  element: <FeatureNamePage />,
}
```

## Add Navigation Link

**Path:** `src/shared/components/layout/Navbar.tsx`

```typescript
<Link to="/feature-name">Feature Name</Link>
```

## Testing

### Unit Tests
Create `__tests__` folder in feature directory:

```
feature-name/
├── __tests__/
│   ├── FeatureComponent.test.tsx
│   ├── useFeatureData.test.ts
│   └── feature-api.test.ts
```

### Integration Tests
Test the complete feature flow:

```typescript
describe('Feature Name', () => {
  it('should load and display data', async () => {
    render(<FeatureNamePage />);
    await waitFor(() => {
      expect(screen.getByText('Feature Name')).toBeInTheDocument();
    });
  });
});
```

## Documentation

Create `README.md` in feature directory:

```markdown
# Feature Name

## Overview
Brief description of the feature.

## Components
- `FeatureNamePage`: Main page component
- `FeatureComponent`: Feature-specific component

## Hooks
- `useFeatureData`: Fetches and manages feature data

## API
- `featureApi.getData()`: Get all data
- `featureApi.createItem()`: Create new item

## Types
- `FeatureData`: Main data type
- `FeatureItem`: Item type

## Usage
\`\`\`typescript
import { FeatureNamePage, useFeatureData } from '@/features/feature-name';
\`\`\`
```

## Checklist

- [ ] Created all required files
- [ ] Added types for all data structures
- [ ] Implemented API service
- [ ] Created custom hooks
- [ ] Built UI components
- [ ] Added route to router
- [ ] Added navigation link
- [ ] Wrote unit tests
- [ ] Wrote integration tests
- [ ] Created documentation
- [ ] Tested feature end-to-end
