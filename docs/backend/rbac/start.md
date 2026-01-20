Instructor Dashboard & RBAC Implementation Walkthrough
I have completed the core structural work for the Instructor Dashboard and the Role-Based Access Control (RBAC) system.

Changes Made
1. Database Schema
New Enum: UserRoleType with STUDENT, INSTRUCTOR, and ADMIN.
User Updates: Added role field (defaulting to STUDENT).
Instructor Table: Created a specialized table for instructor metadata (bio, specialization, etc.).
Course Relationship: Courses now link to an 
Instructor
 instead of a generic 
User
.
2. Middleware & RBAC
Auth Updates: 
AuthRequest
 now carries the user's role.
Role Extraction: 
ensureUser
 middleware now fetches and attaches the role from the database on every authenticated request.
Authorization Helper: Created 
authorize(...roles: UserRoleType[])
 in 
src/middleware/rbac.ts
 to easily protect routes.
3. Instructor Dashboard & Profile
Created 
instructorRoutes.ts
 and 
instructorController.ts
.
Unified Profile API: GET /api/profile now automatically includes the 
Instructor
 object (bio, specialization, social links) if the user has the INSTRUCTOR role.
Role-Specific Update: PUT /api/instructor/profile allows instructors to update both their core 
User
 data and 
Instructor
 metadata in a single atomic transaction.
Protected Endpoints:
GET /api/instructor/courses: Returns courses for the logged-in instructor.
POST /api/instructor/courses: Creates a new course and links it to the instructor profile.
Verification Details
Manual Steps Required
WARNING

Prisma Client Generation: The npx prisma generate command is currently failing because the file query_engine-windows.dll.node is locked by your running dev server (npm run dev).

To fix the lint errors and activate types, please:

Stop the npm run dev process in your terminal.
Run npx prisma generate.
Restart the dev server.
Testing the RBAC
You can test the restrictions by:

Assigning a role: Use UPDATE "User" SET role = 'INSTRUCTOR' WHERE email = 'your-email@example.com'; in pgAdmin.
Accessing routes: Try hitting /api/instructor/courses with a student account vs. an instructor account.
