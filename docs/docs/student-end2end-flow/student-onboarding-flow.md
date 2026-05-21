# Student Onboarding Flow - End-to-End Documentation

## Overview
This document outlines the complete backend process for student onboarding in the TestCrack platform, including authentication, enrollment, and initial setup.

---

## 1. Onboarding Initiation

### Entry Point: Institute Admin Dashboard
**Endpoint:** `POST /api/institute-admin/students`

**Request Body:**
```json
{
  "studentName": "John Doe",
  "studentEmail": "john.doe@example.com"
}
```

**Process Flow:**

### Step 1: Validation & Authorization
- Institute Admin/Owner must be authenticated (`requireAuth` middleware)
- System validates that the caller is part of an institute
- Checks if `studentName` and `studentEmail` are provided

### Step 2: Duplicate Check
The system performs two checks:

**A. Email Already Exists?**
```typescript
let dbUser = await prisma.user.findUnique({ where: { email: studentEmail } });
```

If user exists:
- ✅ **Role is STUDENT**: Proceed to enrollment check
- ❌ **Role is NOT STUDENT**: Return `409 Conflict` - "Email already linked with existing user"

**B. Already Enrolled in Institute?**
```typescript
const alreadyEnrolled = await prisma.institute_students.findFirst({
  where: { user_id: dbUser.id, institute_id: instituteId }
});
```

If already enrolled:
- ❌ Return `409 Conflict` - "This student is already enrolled in your institute"

---

## 2. Supabase Invitation

### Step 3: Send Invite Email
```typescript
const { data: inviteData, error: inviteError } = 
  await supabaseAdmin.auth.admin.inviteUserByEmail(
    studentEmail,
    {
      data: { full_name: studentName, role: 'STUDENT' },
      redirectTo: `${process.env.FRONTEND_URL}/login`
    }
  );
```

**What Happens:**
- Supabase creates an auth user (if doesn't exist)
- Sends a magic link email to the student
- Email contains a link to set password and access the platform
- Returns `supabaseUserId` for linking

**Error Handling:**
- If error message includes "already been registered", the process continues
- Other errors are thrown and handled

---

## 3. Database User Creation

### Step 4: Create/Update User Record

**If User Doesn't Exist:**
```typescript
dbUser = await prisma.user.create({
  data: {
    email: studentEmail,
    name: studentName,
    role: UserRoleType.STUDENT,
    supabaseuserid: supabaseUserId ?? `pending-${Date.now()}`
  }
});
```

**User Table Schema:**
```prisma
model User {
  id                String       @id @default(uuid)
  supabaseuserid    String       @unique
  email             String       @unique
  name              String?
  role              UserRoleType @default(STUDENT)
  profileImage      String?
  phoneNo           String?
  countryCode       String?
  createdAt         DateTime     @default(now())
  updatedAt         DateTime     @default(now())
}
```

---

## 4. Institute Enrollment

### Step 5: Link Student to Institute
```typescript
await prisma.institute_students.upsert({
  where: { user_id: dbUser.id },
  update: { institute_id: instituteId, is_active: true },
  create: { user_id: dbUser.id, institute_id: instituteId }
});
```

**institute_students Table Schema:**
```prisma
model institute_students {
  id                   String    @id @default(uuid)
  user_id              String    @unique
  institute_id         String
  enrollment_date      DateTime  @default(CURRENT_DATE)
  is_active            Boolean   @default(true)
  isDiagnosed          Boolean   @default(false)
  recommendationSeeded Boolean   @default(false)
  target_band          Float?
  momentum_score       Int       @default(0)
  daily_streak         Int       @default(0)
  last_streak_date     DateTime?
  extra_drill_credits  Int       @default(0)
  created_at           DateTime  @default(now())
  updated_at           DateTime  @default(now())
}
```

**Initial State:**
- `is_active`: `true`
- `isDiagnosed`: `false` (student hasn't taken diagnostic test)
- `recommendationSeeded`: `false` (no AI recommendations yet)
- `momentum_score`: `0`
- `daily_streak`: `0`
- `extra_drill_credits`: `0`

---

## 5. Student Receives Email & Sets Password

### Step 6: Student Email Flow
1. Student receives Supabase invite email
2. Clicks the magic link
3. Redirected to frontend login page
4. Sets their password
5. Supabase auth user is now fully activated

---

## 6. First Login - Authentication Flow

### Step 7: Student Logs In
**Frontend sends:** `Authorization: Bearer <supabase_jwt_token>`

### Middleware Chain:
```
requireAuth → ensureUser → authorize(STUDENT)
```

#### A. `requireAuth` Middleware
```typescript
// Validates Supabase JWT token
const { data, error } = await supabaseAdmin.auth.getUser(token);

// Extracts:
req.supabaseUserId = data.user.id;
req.userEmail = data.user.email;
req.userMetadata = data.user.user_metadata;
```

#### B. `ensureUser` Middleware
```typescript
// 1. Find user by Supabase ID
let user = await prisma.user.findUnique({
  where: { supabaseuserid: supabaseUserId }
});

// 2. If not found, try by email (account linking)
if (!user && email) {
  const existingUserByEmail = await prisma.user.findUnique({
    where: { email }
  });
  
  if (existingUserByEmail) {
    // Link existing user to new Supabase ID
    user = await prisma.user.update({
      where: { id: existingUserByEmail.id },
      data: { supabaseuserid: supabaseUserId }
    });
  }
}

// 3. If still no user, create new one
if (!user) {
  user = await prisma.user.create({
    data: {
      supabaseuserid: supabaseUserId,
      email: email ?? `no-email-${supabaseUserId}@placeholder.local`,
      name: metadata.full_name || undefined,
      profileImage: metadata.avatar_url || undefined
    }
  });
}

// Attach to request
req.appUserId = user.id;
req.userRole = user.role;
```

#### C. `authorize(STUDENT)` Middleware
- Verifies `req.userRole === UserRoleType.STUDENT`
- Blocks access if role doesn't match

---

## 7. Student Dashboard Access

### Available Endpoints After Login:

#### Student Profile & Batches
- `GET /api/student/batches` - View enrolled batches with instructors
- `GET /api/student/competency-scores` - View competency matrix
- `GET /api/student/speaking-history` - Past analytics

#### Learning & Practice
- `GET /api/student/next-action-drill` - Next prioritized drill
- `GET /api/student/daily-drill-state` - Lock/unlock state for the day
- `GET /api/student/lexigrid-words?difficulty=INTERMEDIATE` - Daily word set
- `POST /api/student/game-score` - Record LexiGrid completion

#### Recommendations
- `GET /api/student/recommendations` - AI recommendations
- `GET /api/student/drill-recommendation?skill=X&sub_skill=Y` - Specific drill recommendations

---

## 8. Batch Assignment (Optional)

### Step 8: Admin Assigns Student to Batch
**Endpoint:** `POST /api/institute-admin/batches/:id/students`

**Request Body:**
```json
{
  "userId": "student-uuid"
}
```

**Process:**
```typescript
await prisma.ielts_batch_students.create({
  data: {
    batch_id: batchId,
    user_id: userId,
    enrolled_at: new Date()
  }
});
```

**ielts_batch_students Table:**
```prisma
model ielts_batch_students {
  id          String   @id @default(uuid)
  batch_id    String
  user_id     String
  enrolled_at DateTime @default(now())
  
  @@unique([batch_id, user_id])
}
```

---

## 9. Complete Onboarding Flow Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│ 1. Institute Admin Enrolls Student                              │
│    POST /api/institute-admin/students                           │
│    { studentName, studentEmail }                                │
└────────────────────┬────────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────────┐
│ 2. System Checks                                                 │
│    ✓ Email exists?                                              │
│    ✓ Already enrolled?                                          │
│    ✓ Role conflict?                                             │
└────────────────────┬────────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────────┐
│ 3. Supabase Invitation                                          │
│    - Create auth user                                           │
│    - Send magic link email                                      │
│    - Get supabaseUserId                                         │
└────────────────────┬────────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────────┐
│ 4. Create User Record                                           │
│    - Insert into User table                                     │
│    - role: STUDENT                                              │
│    - Link supabaseUserId                                        │
└────────────────────┬────────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────────┐
│ 5. Institute Enrollment                                         │
│    - Insert into institute_students                             │
│    - is_active: true                                            │
│    - isDiagnosed: false                                         │
└────────────────────┬────────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────────┐
│ 6. Student Receives Email                                       │
│    - Clicks magic link                                          │
│    - Sets password                                              │
│    - Account activated                                          │
└────────────────────┬────────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────────┐
│ 7. First Login                                                  │
│    - Frontend sends JWT token                                   │
│    - requireAuth validates token                                │
│    - ensureUser links/creates User record                       │
│    - authorize checks STUDENT role                              │
└────────────────────┬────────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────────┐
│ 8. Access Student Dashboard                                     │
│    - View batches                                               │
│    - Access drills                                              │
│    - Get recommendations                                        │
└─────────────────────────────────────────────────────────────────┘
```

---

## 10. Identified Issues & Bugs

Issues are tagged: ✅ Fixed | ⏭️ Skip for pilot (self-healing or low risk) | 🚀 Post-pilot

---

### ✅ Issue #1: Silent Institute Reassignment
**Location:** `instituteAdminController.ts` — `addStudent`

**Problem (was):**
- `alreadyEnrolled` check only filtered by the *current* institute.
- A student enrolled at **another** institute would pass the check and the subsequent `upsert` would overwrite their `institute_id`, silently moving them out of the other institute and destroying that enrollment.

**Fix applied:**
- Changed to `findUnique({ where: { user_id } })` — covers all institutes since `user_id` has a unique constraint in `institute_students`.
- Returns 409 with distinct messages: "already enrolled in your institute" vs "already enrolled at another institute".
- Replaced the `upsert` with a plain `create` — safe because we've already confirmed no record exists.

---

### ✅ Issue #2: Pending Supabase ID not updating
**Location:** `instituteAdminController.ts` — `addStudent`

**Problem (was):**
- When Supabase returned "already been registered", `inviteData` was null so `supabaseUserId` was undefined.
- If a matching User record already existed with a `pending-*` ID, it was never corrected.

**Fix applied:**
- After the invite call, if we received a real `supabaseUserId` and the stored one starts with `pending-`, we now update the User row immediately.
- Remaining `pending-*` cases (Supabase returned no ID at all) self-heal on the student's first login: `ensureUser` finds the user by email and overwrites the Supabase ID with the real one.

---

### ⏭️ Issue #3: Duplicate User on Google OAuth before invite accept
**Location:** `ensureUser.ts`

**Status:** Skip for pilot.
`ensureUser` already performs email-based account linking (step 2 in the middleware). If a student registered via Google before the admin enrolled them, the middleware links the records on first login. No production failure occurs — the student lands with the correct `institute_students` row already in place from enrollment.

---

### ⏭️ Issue #4: Supabase invite succeeds but DB insert fails
**Status:** Skip for pilot.
If the DB `user.create` or `institute_students.create` fails after the invite email has already been sent:
- Student has a valid Supabase auth account.
- Admin receives a 500 error and can simply re-enroll the student.
- On re-enroll, the `dbUser` lookup finds the existing User (by email), the enrollment check finds no `institute_students` row, and the flow completes normally.
- No phantom or orphaned state results.

Adding a Supabase-aware rollback would require a compensating call to `supabaseAdmin.auth.admin.deleteUser()` on DB failure — not worth the complexity for a pilot.

---

### 🚀 Issue #5: No invite status tracking (PENDING / ACCEPTED)
**Status:** Post-pilot.
Admin currently cannot tell if a student has accepted their invite. Tracking this requires either a Supabase webhook or polling. Defer until the admin panel needs an "invite status" column.

---

### 🚀 Issue #6: Rate limiting on student addition
**Status:** Post-pilot. Low risk for a controlled pilot with a known set of admins.

---

## 11. Recommended Improvements

### A. Add Onboarding Checklist API
```typescript
GET /api/student/onboarding-status
Response:
{
  "completed": false,
  "steps": {
    "profile_setup": { "completed": true, "completedAt": "2024-01-15" },
    "diagnostic_test": { "completed": false },
    "tutorial": { "completed": false },
    "first_drill": { "completed": false }
  }
}
```

### B. Add Resend Invite Endpoint
```typescript
POST /api/institute-admin/students/:userId/resend-invite
```

### C. Add Student Activation Webhook
```typescript
POST /api/webhooks/supabase/user-activated
Body: { userId, email, timestamp }
```

### D. Add Bulk Student Import
```typescript
POST /api/institute-admin/students/bulk
Body: {
  students: [
    { name: "John Doe", email: "john@example.com" },
    { name: "Jane Smith", email: "jane@example.com" }
  ]
}
```

### E. Add Student Onboarding Analytics
```typescript
GET /api/institute-admin/analytics/onboarding
Response: {
  "total_invited": 50,
  "activated": 35,
  "pending": 15,
  "avg_activation_time": "2.5 days"
}
```

---

## 12. Testing Checklist

### Manual Testing Steps:

#### ✅ Happy Path
1. Admin enrolls student with valid email
2. Student receives email
3. Student clicks link and sets password
4. Student logs in successfully
5. Student sees dashboard

#### ✅ Edge Cases
1. Enroll student with existing email (different role)
2. Enroll same student twice
3. Supabase invite fails
4. Database insert fails
5. Student never accepts invite
6. Student signs up via OAuth before accepting invite

#### ✅ Security Testing
1. Non-admin tries to enroll student
2. Admin from Institute A tries to enroll in Institute B
3. Invalid email format
4. SQL injection in student name/email
5. Rate limiting on bulk invites

---

## 13. Database Queries for Debugging

### Check Student Enrollment Status
```sql
SELECT 
  u.id,
  u.email,
  u.name,
  u.role,
  u.supabaseuserid,
  ist.is_active,
  ist.isDiagnosed,
  ist.enrollment_date,
  i.name as institute_name
FROM "User" u
JOIN institute_students ist ON u.id = ist.user_id
JOIN institutes i ON ist.institute_id = i.id
WHERE u.email = 'student@example.com';
```

### Find Students with Pending Supabase IDs
```sql
SELECT id, email, name, supabaseuserid
FROM "User"
WHERE supabaseuserid LIKE 'pending-%';
```

### Check Batch Assignments
```sql
SELECT 
  u.name,
  u.email,
  b.name as batch_name,
  bs.enrolled_at
FROM "User" u
JOIN ielts_batch_students bs ON u.id = bs.user_id
JOIN ielts_batches b ON bs.batch_id = b.id
WHERE u.id = 'student-uuid';
```

---

## 14. Environment Variables Required

```env
# Supabase
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Frontend
FRONTEND_URL=https://testcrack.com

# Database
DATABASE_URL=postgresql://user:password@host:5432/dbname
```

---

## 15. Next Steps for Testing

1. **Create Test Institute & Admin**
   - Use superadmin endpoint to create test institute
   - Create test admin user

2. **Test Student Enrollment**
   - Use Postman/Thunder Client to call enrollment endpoint
   - Verify email is sent (check Supabase dashboard)
   - Check database records

3. **Test Student Login**
   - Accept invite email
   - Set password
   - Login via frontend
   - Verify JWT token works

4. **Test Batch Assignment**
   - Create test batch
   - Assign student to batch
   - Verify student can see batch

5. **Test Edge Cases**
   - Duplicate enrollment
   - Invalid emails
   - Role conflicts

---

## Summary

The student onboarding flow is functional but has several areas for improvement:

**✅ Working:**
- Basic enrollment via admin
- Supabase email invites
- User creation and linking
- Authentication flow
- Role-based access control

**⚠️ Needs Attention:**
- Pending Supabase ID handling
- Onboarding status tracking
- Email verification status
- Rollback on partial failures
- Rate limiting
- Admin notifications

**🚀 Recommended Enhancements:**
- Onboarding checklist API
- Resend invite functionality
- Bulk student import
- Activation webhooks
- Analytics dashboard
