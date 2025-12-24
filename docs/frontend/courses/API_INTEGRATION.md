# Courses API Integration

## Overview
Complete integration with backend courses API including filtering, sorting, and pagination.

## API Endpoint
```
GET /api/courses
```

## Query Parameters

| Parameter | Type | Options | Description |
|-----------|------|---------|-------------|
| `page` | number | 1+ | Current page number (default: 1) |
| `limit` | number | 1-100 | Results per page (default: 10) |
| `difficulty` | string | BEGINNER, INTERMEDIATE, ADVANCED | Filter by difficulty level |
| `domain` | string | any | Filter by domain name (case-insensitive) |
| `sortBy` | string | price, duration_minutes, created_at, updated_at | Sort field |
| `sortOrder` | string | asc, desc | Sort direction (default: desc) |

## Response Structure

```typescript
{
  data: Course[],
  pagination: {
    page: number,
    limit: number,
    total: number,
    totalPages: number,
    hasMore: boolean
  }
}
```

## Course Object

```typescript
interface Course {
  id: string;
  title: string;
  description: string | null;
  Domain: {
    id: string;
    name: string;
    slug: string;
  } | null;
  difficulty: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED' | null;
  duration_minutes: number | null;
  price: number | null;
  created_at: string | null;
  updated_at: string | null;
  _count: {
    CourseModule: number;
  };
}
```

## Frontend Implementation

### 1. Service Layer (`coursesService.ts`)
- Handles API communication
- Builds query parameters from filters
- Uses `callBackend` for authenticated requests

### 2. Custom Hook (`useCourses.ts`)
- Manages courses state
- Handles loading and error states
- Provides `refetch` function for filter updates
- Returns pagination data

### 3. Filters Component (`CoursesFilters.tsx`)
- Difficulty dropdown (All, Beginner, Intermediate, Advanced)
- Sort options (Recent, Price, Duration)
- Results per page selector (8, 12, 24, 48)
- Clear filters button

### 4. Pagination Component (`CoursesPagination.tsx`)
- Smart page number display
- Previous/Next navigation
- Disabled states for boundaries
- Ellipsis for large page counts

### 5. Courses List (`CoursesList.tsx`)
- Displays courses in responsive grid
- Shows loading/error/empty states
- Integrates filters and pagination
- Smooth scroll to top on page change

## Features Implemented

✅ **Filtering**
- By difficulty level
- By domain (ready for implementation)
- Clear all filters

✅ **Sorting**
- Most recent / Oldest first
- Price: Low to High / High to Low
- Duration: Short to Long / Long to Short

✅ **Pagination**
- Configurable results per page
- Smart page number display
- Previous/Next navigation
- Results count display

✅ **Professional UI**
- Udemy/Coursera-inspired design
- Course cards with image placeholders
- Difficulty badges
- Module count display
- Mock ratings
- Price formatting (₹ symbol, "Free" for zero)
- Duration formatting (hours/minutes)

✅ **User Experience**
- Loading states with spinner
- Error handling with retry
- Empty state with clear filters option
- Smooth scroll on page change
- Responsive grid (1/2/3/4 columns)

## Usage Example

```typescript
// In a component
const [filters, setFilters] = useState<CoursesFilters>({
  page: 1,
  limit: 12,
  difficulty: DifficultyType.BEGINNER,
  sortBy: 'price',
  sortOrder: 'asc'
});

const { courses, loading, error, pagination, refetch } = useCourses(filters);

// Update filters
const handleFilterChange = (newFilters: CoursesFilters) => {
  setFilters(newFilters);
  refetch(newFilters);
};
```

## Future Enhancements

- [ ] Domain filter dropdown (requires domain list API)
- [ ] Search by course title
- [ ] Price range filter
- [ ] Duration range filter
- [ ] Instructor filter
- [ ] Bookmarking/favorites
- [ ] Course preview on hover
- [ ] Skeleton loading states
- [ ] Infinite scroll option
