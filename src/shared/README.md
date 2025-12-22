# Shared Directory

Code shared across multiple features.

## Structure

```
shared/
├── components/
│   ├── layout/     # Layout components (Navbar, Footer)
│   └── ui/         # UI library components (shadcn/ui)
├── hooks/          # Reusable hooks
├── services/       # Shared services (Supabase client)
├── types/          # Common TypeScript types
└── utils/          # Utility functions
```

## When to Use Shared

Move code to shared/ when:
- Used by 2+ features
- Generic/reusable functionality
- UI components from design system
- Common utilities (date formatting, validation)

## When NOT to Use Shared

Keep in feature when:
- Feature-specific logic
- Only used in one feature
- Domain-specific types

## Examples

### ✅ Belongs in Shared
- Button, Card, Dialog (UI components)
- useToast, useMobile (generic hooks)
- cn() utility function
- Supabase client
- API response types

### ❌ Belongs in Feature
- useAuth (auth-specific)
- PaymentService (payment-specific)
- AssessmentResult type (assessment-specific)
