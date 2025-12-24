# Courses Feature

This feature implements the course system based on the core design document.

## Structure

```
courses/
├── components/
│   ├── CoursesPage.tsx       # Main courses page container
│   ├── CoursesNavbar.tsx     # Dedicated navbar for courses panel
│   └── CoursesList.tsx       # Grid display of available courses
├── hooks/
│   └── useCourses.ts         # Hook for fetching courses data
├── services/
│   └── coursesService.ts     # API service for courses endpoints
├── types/
│   └── index.ts              # TypeScript types and enums
├── index.ts                  # Public exports
└── README.md                 # This file
```

## Features

- **Separate Panel**: Courses have their own dedicated panel with a custom navbar
- **Profile Dropdown**: Access profile and logout from the navbar
- **Course Cards**: Display courses with difficulty, duration, domain, and pricing
- **Responsive Design**: Mobile-friendly grid layout
- **Loading States**: Proper loading and error handling

## Navigation

- Access courses via `/courses` route
- Link available in main app navbar (GraduationCap icon)
- Logo click returns to main dashboard

## API Integration

The feature uses `coursesService` to communicate with backend endpoints:
- `GET /api/courses` - Fetch all published courses
- `GET /api/courses/:id` - Fetch single course details
- `POST /api/courses/:id/enroll` - Enroll in a course

## Types

Based on the core design document:
- `Course` - Main course entity
- `DifficultyType` - BEGINNER | INTERMEDIATE | ADVANCED
- `ProgressStatus` - NOT_STARTED | IN_PROGRESS | COMPLETED

## Future Enhancements

- Course detail page with modules
- Enrollment functionality
- Progress tracking
- Module and concept navigation
- Content rendering (Notes, MCQs, Videos)
