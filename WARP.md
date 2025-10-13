# WARP.md

This file provides guidance to WARP (warp.dev) when working with code in this repository.

## Project Overview

AI Study Mentor is an educational technology platform built with React, TypeScript, and Vite. It provides AI-powered learning tools including note analysis, YouTube video summarization, study guide generation, and reading speed assessments. The application uses Supabase for backend services and authentication.

## Development Commands

### Core Commands
- `npm run dev` - Start development server on port 8080
- `npm run build` - Production build 
- `npm run build:dev` - Development build
- `npm run lint` - Run ESLint for code quality
- `npm run preview` - Preview production build

### Testing Single Components
To test individual components during development:
- Navigate to `/src/pages/Index.tsx` and modify the `activeTab` state
- Or directly import and render components in isolation

### Supabase Local Development
- Local API: `http://localhost:54321`
- Studio UI: `http://localhost:54323` 
- Database: `localhost:54322`

## Architecture Overview

### Frontend Stack
- **React 18** with TypeScript
- **Vite** for build tooling and dev server
- **shadcn/ui** component library with Radix UI primitives
- **Tailwind CSS** for styling
- **React Router** for navigation
- **TanStack Query** for server state management
- **React Hook Form + Zod** for form validation

### Backend Integration
- **Supabase** for authentication, database, and edge functions
- **External Backend API** at `http://localhost:4000` for YouTube analysis
- **Stripe/Razorpay** for payment processing

### Key Application Components

#### Authentication & Routing
- `useAuth` hook manages Supabase auth state
- Protected routes require authentication
- Guest users redirected to auth page

#### Core Features
1. **Notes Upload (`NotesUpload.tsx`)**
   - File upload with 50MB limit
   - AI document analysis via Supabase Edge Functions
   - Support for text, PDF, and image files (OCR)
   - Study session tracking with timer functionality

2. **YouTube Analyzer (`YouTubeAnalyzer.tsx`)**
   - Integrates with external backend API for transcript extraction
   - Two-step process: extract transcript → generate study notes
   - Supports YouTube URL validation and processing

3. **Study Guides (`StudyGuides.tsx`)**
   - AI-generated personalized learning paths
   - Progress tracking and completion states
   - Integration with uploaded notes as source material

4. **Speed Assessment (`pages/SpeedAssessment.tsx`)**
   - Reading speed testing and improvement
   - Performance tracking and analytics

#### UI Architecture
- Consistent design system using shadcn/ui components
- Gradient-based color schemes (purple/blue theme)
- Responsive design with mobile-first approach
- Toast notifications for user feedback

### Database Schema (Supabase)
Key tables include:
- `notes` - User uploaded documents and analysis results
- Payment-related tables for subscription management
- User progress and analytics tracking

### Environment Configuration
Required environment variables:
- `VITE_SUPABASE_URL` - Supabase project URL
- `VITE_SUPABASE_ANON_KEY` - Supabase anonymous key  
- `VITE_BACKEND_URL` - External API endpoint (default: http://localhost:4000)

## Development Guidelines

### File Organization
- `src/components/` - Reusable UI components
- `src/components/ui/` - shadcn/ui components (auto-generated)
- `src/pages/` - Route-level components
- `src/hooks/` - Custom React hooks
- `src/lib/` - Utility functions and configurations
- `src/integrations/` - External service integrations

### State Management Patterns
- Use React Query for server state
- Local component state for UI interactions
- Context providers for global state (auth, themes)

### API Integration
- Supabase client configured in `src/lib/supabase.ts`
- Edge functions for AI processing (analyze-document, generate-study-guide)
- External API calls for YouTube functionality

### TypeScript Configuration
- Relaxed strictness settings for rapid development
- Path aliases: `@/*` maps to `./src/*`
- Skip lib checks enabled for faster compilation

### Styling Guidelines
- Tailwind utility-first approach
- CSS variables for theme customization
- Gradient backgrounds for visual appeal
- Consistent spacing and typography scales

### Component Patterns
- Extensive use of compound components (Card, Dialog, etc.)
- Icon integration with Lucide React
- Loading states and error handling built into components
- Form validation with React Hook Form + Zod schemas

## Key Dependencies

### UI & Styling
- `@radix-ui/*` - Unstyled, accessible components
- `tailwindcss` - Utility-first CSS framework
- `class-variance-authority` - Conditional styling
- `lucide-react` - Icon library

### Functionality
- `@supabase/supabase-js` - Backend integration
- `react-router-dom` - Client-side routing
- `@tanstack/react-query` - Server state management
- `framer-motion` - Animations
- `react-dropzone` - File upload handling
- `react-markdown` - Markdown rendering

### Development Tools
- `@vitejs/plugin-react-swc` - Fast React refresh
- `typescript-eslint` - TypeScript linting
- `lovable-tagger` - Development component tagging

## Common Troubleshooting

### Build Issues
- Ensure all environment variables are set
- Check TypeScript errors with `npm run lint`
- Verify Supabase connection and API keys

### Authentication Problems
- Check Supabase project configuration
- Verify redirect URLs in auth settings
- Ensure environment variables match project settings

### API Integration
- External backend must be running on port 4000 for YouTube features
- Supabase Edge Functions require proper deployment
- Check CORS settings for cross-origin requests

## Deployment Notes

The application is configured for deployment via Lovable platform, but can be deployed to any static hosting service. Ensure environment variables are properly configured for production Supabase instance.