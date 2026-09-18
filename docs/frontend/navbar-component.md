# Generic Navbar Component

## Overview
Created a reusable, modular Navbar component that can be used across all pages in the application. Now includes integrated StepIndicator support and a Dashboard button.

## Component Location
`src/components/Navbar.tsx`

## Features

### Core Functionality
- **Responsive Design**: Mobile-friendly with hamburger menu
- **Sticky Navigation**: Stays at top of viewport
- **Backdrop Blur**: Modern glassmorphism effect
- **Brand Logo**: Clickable TestCrack logo that navigates to home/dashboard
- **Dashboard Button**: Always visible button next to logo for quick access
- **User Info**: Displays logged-in user email
- **Logout Button**: Quick access to sign out
- **Optional Upgrade Button**: Premium/upgrade CTA
- **Integrated Step Indicator**: Shows progress through multi-step processes

### Navigation Modes

#### 1. Simple Mode (No Nav Items)
Used on standalone pages
```tsx
<Navbar showNavItems={false} />
```

#### 2. Full Navigation Mode
Used on main dashboard with tab navigation
```tsx
<Navbar
  showNavItems={true}
  activeTab={activeTab}
  onTabChange={setActiveTab}
  showUpgradeButton={!isPremium}
  onUpgradeClick={() => setShowPremiumModal(true)}
/>
```

#### 3. With Step Indicator
Used on assessment pages with progress tracking
```tsx
<Navbar
  showNavItems={false}
  showStepIndicator={true}
  currentStep={currentStep}
  steps={assessmentSteps}
  onStepClick={handleStepNavigation}
  allowStepNavigation={true}
/>
```

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `showNavItems` | `boolean` | `false` | Show/hide navigation menu items |
| `activeTab` | `string` | - | Currently active tab ID |
| `onTabChange` | `(tab: string) => void` | - | Callback when tab changes |
| `showUpgradeButton` | `boolean` | `false` | Show/hide upgrade button |
| `onUpgradeClick` | `() => void` | - | Callback for upgrade button |
| `showStepIndicator` | `boolean` | `false` | Show/hide step progress indicator |
| `currentStep` | `string` | - | Current step ID for indicator |
| `steps` | `Step[]` | `[]` | Array of step objects |
| `onStepClick` | `(stepId: string) => void` | - | Callback when step is clicked |
| `allowStepNavigation` | `boolean` | `false` | Allow clicking on completed steps |

## Navigation Items

Default navigation items (when `showNavItems={true}`):
- Dashboard (Home icon) - Tab navigation or route to `/`
- Notes (FileText icon) - Tab navigation
- Videos (Video icon) - Tab navigation
- Study Guides (BookMarked icon) - Tab navigation
- Progress (TrendingUp icon) - Tab navigation

## Dashboard Button

- **Always Visible**: Shows next to logo on all pages
- **Smart Navigation**: 
  - On home page: Switches to dashboard tab
  - On other pages: Navigates to home page
- **Styling**: Purple accent with hover effects

## Step Indicator Integration

When `showStepIndicator={true}`, the StepIndicator component is rendered below the navbar:
- Shows progress through multi-step processes
- Allows navigation to completed steps (if `allowStepNavigation={true}`)
- Responsive design with short labels on mobile
- Visual feedback with colors and checkmarks

## Mobile Behavior

- **Hamburger Menu**: Appears on screens < 1024px (lg breakpoint)
- **Slide-in Drawer**: Animated mobile menu from top
- **Backdrop**: Semi-transparent overlay with blur
- **Auto-close**: Menu closes on navigation or backdrop click

## Usage Examples

### Dashboard Page
```tsx
import { Navbar } from "@/components/Navbar";

<Navbar
  showNavItems={true}
  activeTab="dashboard"
  onTabChange={(tab) => setActiveTab(tab)}
  showUpgradeButton={true}
  onUpgradeClick={() => setShowPremiumModal(true)}
/>
```

### Assessment Pages with Steps
```tsx
import { Navbar } from "@/components/Navbar";

const steps = [
  { id: "select", label: "Select Module", shortLabel: "Select" },
  { id: "read", label: "Read Passage", shortLabel: "Read" },
  { id: "questions", label: "Questions", shortLabel: "Q&A" },
  { id: "results", label: "Results", shortLabel: "Results" },
];

<Navbar
  showNavItems={false}
  showStepIndicator={true}
  currentStep={currentStep}
  steps={steps}
  onStepClick={handleStepClick}
  allowStepNavigation={true}
/>
```

### Simple Pages
```tsx
import { Navbar } from "@/components/Navbar";

<Navbar showNavItems={false} />
```

## Styling

- **Background**: White with 80% opacity + backdrop blur
- **Border**: Bottom border for separation
- **Height**: 56px (mobile) / 64px (desktop)
- **Z-index**: 50 (sticky positioning)
- **Logo**: Purple to blue gradient text
- **Dashboard Button**: Purple accent with hover effects
- **Buttons**: Consistent with design system

## Integration

### Pages Updated
1. ✅ `src/pages/Index.tsx` - Main dashboard
2. ✅ `src/pages/SpeedAssessment.tsx` - Speed assessment with steps
3. ✅ `src/pages/ReadingAssessment.tsx` - Reading assessment

### Components Used
- ✅ `src/components/speedAssessment/StepIndicator.tsx` - Integrated into Navbar

### Removed Components
- ❌ `src/components/speedAssessment/AssessmentNavbar.tsx` (replaced by generic Navbar)

## Benefits

1. **DRY Principle**: Single source of truth for navigation
2. **Consistency**: Same look and feel across all pages
3. **Maintainability**: Update once, applies everywhere
4. **Flexibility**: Configurable for different page types
5. **Responsive**: Works seamlessly on all screen sizes
6. **Integrated Progress**: Step indicator built-in for assessments
7. **Smart Navigation**: Context-aware dashboard button
