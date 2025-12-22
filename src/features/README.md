# Features Directory

This directory contains feature modules organized by domain/functionality.

## Structure

Each feature follows this structure:

```
feature-name/
├── components/      # UI components specific to this feature
├── hooks/          # Custom hooks for this feature
├── services/       # API calls and business logic
├── types/          # TypeScript types/interfaces
└── index.ts        # Public API (barrel export)
```

## Current Features

### auth
Authentication and authorization
- Login/signup components
- useAuth hook
- Auth API client

### notes
Note-taking and study materials
- Notes upload and display
- YouTube transcript extraction
- Study guides generation

### reading-assessment
Reading comprehension assessment
- Assessment history
- Reading profile
- Performance tracking

### speed-assessment
Speed reading assessment
- Timed reading passages
- Question answering
- WPM calculation

### payment
Payment and subscription management
- Pricing page
- Payment processing (Razorpay/Stripe)
- Subscription status

### profile
User profile and dashboard
- Progress tracking
- User settings

### home
Landing/home page

## Guidelines

1. **Self-contained**: Each feature should be independent
2. **Public API**: Export through index.ts only
3. **No cross-feature imports**: Use shared/ for common code
4. **Clear naming**: Use descriptive, domain-specific names
