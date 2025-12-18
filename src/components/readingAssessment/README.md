# Reading Assessment Components

This directory contains the comprehensive reading assessment system with profile tracking, history, and analytics.

## Components

### ReadingAssessment (Page)
Main page component that orchestrates the entire reading assessment experience with tabs for:
- Profile view
- Assessment taking
- History and analytics

### ReadingProfile
Displays the user's reading profile with:
- Current performance metrics (WPM, retention, speed learning, focus ratio, integrity)
- Personal best records
- New user onboarding experience
- Call-to-action to start assessments

**Features:**
- Handles 404 responses for new users gracefully
- Beautiful gradient cards for each metric
- Progress bars and badges for visual feedback
- Responsive grid layout

### AssessmentHistory
Shows user's assessment history with filtering and visualization options:
- Filter by difficulty level (easy, medium, hard)
- Filter by time range (7, 30, 90, 365 days)
- Toggle between chart and table views
- Summary statistics

### HistoryChart
Interactive charts for visualizing progress over time:
- Multiple chart types (line, area, bar)
- Tabbed views for different metrics:
  - Overview (combined metrics)
  - Speed progress
  - Comprehension & retention
  - Focus & speed learning
- Built with Recharts library
- Custom tooltips with detailed information

### HistoryTable
Detailed table view of assessment history:
- Sortable columns
- Color-coded difficulty badges
- Performance indicators
- Click to view detailed assessment results
- Modal dialog with comprehensive metrics

## API Integration

Uses the following endpoints from `/lib/reading-api.ts`:

- `getUserProfile()` - GET /api/reading/profile
- `getAssessmentHistory(limit, difficulty, days)` - GET /api/reading/history

## Usage

```tsx
import ReadingAssessment from '@/pages/ReadingAssessment';

// In your router
<Route path="/assessment" element={<ReadingAssessment />} />
```

## Design Principles

1. **Progressive Disclosure**: Show summary first, details on demand
2. **Visual Hierarchy**: Use color, size, and spacing to guide attention
3. **Responsive Design**: Works on mobile, tablet, and desktop
4. **Accessibility**: Proper ARIA labels, keyboard navigation
5. **Performance**: Lazy loading, optimized re-renders
6. **Error Handling**: Graceful degradation, helpful error messages

## Color Scheme

- Purple (#8b5cf6): Primary actions, speed metrics
- Blue (#3b82f6): Comprehension, accuracy
- Green (#10b981): Retention, positive outcomes
- Yellow (#f59e0b): Focus, warnings
- Red (#ef4444): Errors, hard difficulty

## Future Enhancements

- Export history as CSV/PDF
- Comparison with other users (anonymized)
- Goal setting and tracking
- Personalized recommendations
- Achievement badges
- Streak tracking
