# TestCrack — Authentication & Onboarding Specification

> **Purpose of this document**
> This is a complete, implementation-level description of how identity, invites, login,
> password reset, role hierarchy, onboarding and transactional email work on the
> TestCrack platform. It is written so that **another project can read it and reproduce
> the same system**, not just understand ours.
>
> Every flow below is described as it is actually implemented in code, with the real file
> paths, endpoints, table columns and env-var names. Code snippets are copy-adaptable.
> No secret values appear anywhere — only variable names.

**Repositories**
| Repo | Role |
|---|---|
| `ai-study-mentor` | Frontend — React 18 + TypeScript + Vite + React Router + TailwindCSS |
| `backend-study-mentor` | Backend — Node.js + Express + TypeScript + Prisma (PostgreSQL) |

**Auth-relevant dependency versions** (from `backend-study-mentor/package.json`)

| Package | Version | Used for |
|---|---|---|
| `@supabase/supabase-js` | `2.86.0` | admin API (`generateLink`), browser client |
| `jsonwebtoken` | `^9.0.3` | local JWT verification in `requireAuth` |
| `resend` | `^6.17.2` | transactional email |
| `express` | `^5.1.0` | HTTP server |
| `@prisma/client` | `5.22.0` | database access |

---

## Table of Contents

1. [Architecture at a glance](#1-architecture-at-a-glance)
2. [The identity model — two user records, one person](#2-the-identity-model--two-user-records-one-person)
3. [Roles and the permission hierarchy](#3-roles-and-the-permission-hierarchy)
4. [Signup — why there is no public signup](#4-signup--why-there-is-no-public-signup)
5. [The invite system (the real "signup")](#5-the-invite-system-the-real-signup)
6. [Email — Resend, templates, and why not Supabase mail](#6-email--resend-templates-and-why-not-supabase-mail)
7. [The invite acceptance / set-password flow](#7-the-invite-acceptance--set-password-flow)
8. [Login](#8-login)
9. [Forgot password / password reset](#9-forgot-password--password-reset)
10. [Logout and the global 401 handler](#10-logout-and-the-global-401-handler)
11. [Backend request pipeline — requireAuth → ensureUser → authorize](#11-backend-request-pipeline--requireauth--ensureuser--authorize)
12. [Frontend route protection and role-based redirects](#12-frontend-route-protection-and-role-based-redirects)
13. [How the Super Admin is created (the bootstrap problem)](#13-how-the-super-admin-is-created-the-bootstrap-problem)
14. [Onboarding structure — the full org chain](#14-onboarding-structure--the-full-org-chain)
15. [Student onboarding — walkthrough, goal-setting, diagnostic gate](#15-student-onboarding--walkthrough-goal-setting-diagnostic-gate)
16. [Database schema reference](#16-database-schema-reference)
17. [API reference — every auth/onboarding endpoint](#17-api-reference--every-authonboarding-endpoint)
18. [Environment variables](#18-environment-variables)
19. [Security model, rules and known gaps](#19-security-model-rules-and-known-gaps)
20. [Replication guide — adapt this to your project](#20-replication-guide--adapt-this-to-your-project)

---

## 1. Architecture at a glance

TestCrack **does not implement its own password storage, hashing, session or token logic.**
It delegates all credential handling to **Supabase Auth** (a hosted GoTrue instance), and
keeps all *authorization* and *domain* logic in its own Express backend + Postgres schema.

```
┌──────────────────────┐        ┌──────────────────────┐        ┌─────────────────────┐
│  React frontend      │        │  Supabase Auth       │        │  Express backend    │
│  (ai-study-mentor)   │        │  (GoTrue, hosted)    │        │ (backend-study-...) │
├──────────────────────┤        ├──────────────────────┤        ├─────────────────────┤
│ supabase-js client   │──1────▶│ signInWithPassword   │        │                     │
│ (anon/publishable    │◀──2────│ → returns JWT        │        │                     │
│  key, localStorage)  │        │   (access + refresh) │        │                     │
│                      │        │                      │        │                     │
│ callBackend()        │──3─────┼──── Bearer <JWT> ───────────▶ │ requireAuth         │
│                      │        │                      │        │  jwt.verify(token,  │
│                      │        │ SUPABASE_JWT_SECRET ─────────▶│   SUPABASE_JWT_     │
│                      │        │ (shared secret)      │        │   SECRET)           │
│                      │        │                      │        │        ↓            │
│                      │        │                      │        │ ensureUser          │
│                      │        │                      │        │  (find/create row   │
│                      │        │                      │        │   in "User" table)  │
│                      │        │                      │        │        ↓            │
│                      │        │                      │        │ authorize(ROLES)    │
│                      │◀──4────┼──────── JSON ────────────────│        ↓            │
│                      │        │                      │        │ controller          │
│                      │        │                      │        │        ↓            │
│                      │        │ admin.generateLink() │◀──5────│ Prisma → PostgreSQL │
│                      │        │ (service-role key)   │        │ Resend → email      │
└──────────────────────┘        └──────────────────────┘        └─────────────────────┘
```

**Division of responsibility — this is the single most important design decision to copy:**

| Concern | Owner | Notes |
|---|---|---|
| Password storage & hashing | Supabase Auth | We never see or store a password. |
| Session / JWT issuance & refresh | Supabase Auth | `supabase-js` auto-refreshes in the browser. |
| Email verification state | Supabase Auth | `email_confirmed_at` on the auth user. |
| Reset & invite link minting | Supabase Auth (admin API) | Called **server-side** with the service-role key. |
| Transactional email delivery | **Resend** (our own) | We deliberately bypass Supabase's built-in mailer. |
| **Roles & permissions** | **Our Postgres `User.role`** | *Not* Supabase `user_metadata`. This is the source of truth. |
| Org structure (institutes, batches) | Our Postgres | `institutes`, `institute_owners`, etc. |
| Onboarding progress | Our Postgres | `institute_students.isDiagnosed`, `target_band`. |

> **Design rule worth copying:** the JWT proves *who you are*; the database row decides
> *what you may do*. Role is read fresh from the DB on every request (`ensureUser`),
> never trusted from the token. A role change therefore takes effect on the very next
> request — no token refresh, no re-login, no stale-claim window.

---

## 2. The identity model — two user records, one person

Every human has **two** rows:

| Where | Table | Key | Holds |
|---|---|---|---|
| Supabase | `auth.users` | `id` (UUID) | email, encrypted password, `email_confirmed_at`, `user_metadata` |
| Our DB | `"User"` | `id` (UUID) | `supabaseuserid`, email, name, **role**, phone, profileImage |

They are joined by `User.supabaseuserid` ⇄ `auth.users.id`.

### The `pending-` placeholder pattern

When an admin invites someone, we sometimes create our `User` row *before* we have a
confirmed Supabase user id (e.g. the invite API errored but we still want the DB row).
In that case `supabaseuserid` is written as a sentinel:

```ts
supabaseuserid: supabaseUserId ?? `pending-${Date.now()}`,
```

`supabaseuserid` is `UNIQUE NOT NULL`, so a real value can't be used and a null isn't
allowed — the timestamped sentinel satisfies both while remaining recognisable.

### Self-healing via email linking

The sentinel resolves itself on the user's first authenticated request. `ensureUser`
(`backend/src/middleware/ensureUser.ts`) resolves the caller in three steps:

```ts
// 1. Try by Supabase ID (the happy path)
let user = await prisma.user.findUnique({ where: { supabaseuserid: supabaseUserId } });

if (!user && email) {
  // 2. Not found by ID → try by email (ACCOUNT LINKING).
  //    This is what heals `pending-*` rows and links OAuth identities
  //    to a pre-existing invited account.
  const existingUserByEmail = await prisma.user.findUnique({ where: { email } });
  if (existingUserByEmail) {
    user = await prisma.user.update({
      where: { id: existingUserByEmail.id },
      data: {
        supabaseuserid: supabaseUserId,          // adopt the real ID
        name:         existingUserByEmail.name         || fullName,
        profileImage: existingUserByEmail.profileImage || avatarUrl,
      },
    });
  }
}

if (!user) {
  // 3. Genuinely new → create. Role defaults to STUDENT via the schema default.
  user = await prisma.user.create({
    data: {
      supabaseuserid: supabaseUserId,
      email: email ?? `no-email-${supabaseUserId}@placeholder.local`,
      name: fullName || undefined,
      profileImage: avatarUrl || undefined,
    },
  });
}

(req as any).appUserId = user.id;   // our UUID, used by every controller
req.userRole           = user.role; // fresh from DB — never from the JWT
```

It also **backfills** missing `name` / `profileImage` from the JWT's `user_metadata`
(which is where an OAuth provider like Google puts `full_name` / `avatar_url`) without
overwriting values the user has already set:

```ts
if ((!user.name && fullName) || (!user.profileImage && avatarUrl)) {
  user = await prisma.user.update({
    where: { id: user.id },
    data: {
      name:         user.name         || fullName,
      profileImage: user.profileImage || avatarUrl,
    },
  });
}
```

> **Why this matters for replication:** step 2 (email linking) is what makes an
> invite-first system work. The admin creates the DB row at invite time; the identity
> provider creates the auth row when the person accepts. Email is the only thing that
> reliably bridges them.

---

## 3. Roles and the permission hierarchy

```
SUPERADMIN            — TestCrack platform staff. Creates institutes & their owners.
  └── INSTITUTE_OWNER — Institution principal/director. One per institute. Adds admins.
        └── INSTITUTE_ADMIN — Operations staff. Onboards tutors & students, runs batches.
              ├── INSTRUCTOR — Tutor. Sees assigned batches and student progress.
              └── STUDENT    — End learner.
```

Prisma enum (`prisma/schema.prisma`):

```prisma
enum UserRoleType {
  STUDENT
  INSTRUCTOR
  ADMIN            // legacy, unused by current flows
  SUPERADMIN
  INSTITUTE_OWNER
  INSTITUTE_ADMIN
}
```

`User.role` defaults to `STUDENT`:

```prisma
role UserRoleType @default(STUDENT)
```

### Who can create whom

| Actor | Can invite | Endpoint |
|---|---|---|
| `SUPERADMIN` | `INSTITUTE_OWNER` (together with a new institute) | `POST /api/superadmin/institutes` |
| `INSTITUTE_OWNER` | `INSTITUTE_ADMIN` | `POST /api/institute-owner/admins` |
| `INSTITUTE_ADMIN` **or** `INSTITUTE_OWNER` | `INSTRUCTOR` | `POST /api/institute-admin/tutors` |
| `INSTITUTE_ADMIN` **or** `INSTITUTE_OWNER` | `STUDENT` | `POST /api/institute-admin/students` |
| Nobody (via the app) | `SUPERADMIN` | — see [§13](#13-how-the-super-admin-is-created-the-bootstrap-problem) |

**Each level can only create the level directly below it.** An owner cannot mint another
owner; an admin cannot mint another admin. This is enforced by `authorize()` on the route,
not by a check inside the controller.

### Cardinality rules enforced in the schema

| Rule | Mechanism |
|---|---|
| A student belongs to exactly **one** institute | `institute_students.user_id` is `@unique` |
| A tutor belongs to exactly **one** institute | `institute_instructors.user_id` is `@unique` |
| An admin belongs to exactly **one** institute | `institute_admins.user_id` is `@unique` |
| An owner owns exactly **one** institute | `institute_owners.user_id` is `@unique` |
| An institute may have many students/tutors/admins | `institute_id` is indexed, not unique |

> The global `@unique` on `user_id` (rather than a composite `@@unique([user_id, institute_id])`)
> is deliberate: it makes "already enrolled *somewhere else*" a database-level impossibility,
> not just an application check. The controllers rely on this — see the `P2002` handling in §5.

### Role demotion on removal

Removing someone from an institute **downgrades their role to `STUDENT`** rather than
deleting the account:

```ts
// instituteOwnerController.removeAdmin
await prisma.institute_admins.delete({ where: { id: adminRow.id } });
await prisma.user.update({
  where: { id: userId },
  data: { role: UserRoleType.STUDENT },
});
```

The auth user and login still work; they simply land on the "No Institute Access" screen
(see §15). This preserves history and audit trails. The same pattern is used in
`removeTutor`.

---

## 4. Signup — why there is no public signup

**TestCrack is an invite-only B2B platform. There is no self-serve registration.**

This is stated to the user directly on the login screen
(`src/features/auth/components/LoginPage.tsx`):

> **Access controlled** — Accounts are created by administrators. Contact your institute
> or platform admin to get access.

### The legacy public-signup page (dead code — do not copy)

`src/features/auth/components/AuthPage.tsx` still exists in the repo and contains:
- `supabase.auth.signUp({ email, password })` with an email-confirmation redirect,
- `supabase.auth.signInWithOAuth({ provider: 'google' })`,
- a combined sign-in / sign-up / forgot-password toggle.

**It is not reachable.** The router redirects the path away:

```tsx
// src/core/App.tsx
<Route path="/login" element={user ? <LoginRedirect /> : <LoginPage />} />
<Route path="/auth"  element={<Navigate to="/login" replace />} />   {/* ← AuthPage orphaned */}
```

> **If you are replicating this:** decide up front whether you are invite-only or
> self-serve, and *delete* the unused path rather than leaving it orphaned. A routed-away
> signup page is a live liability — if someone re-adds the route, public registration
> silently reopens and anyone can create a `STUDENT` account (the schema default) with
> no institute. Treat this as a cleanup item, not a pattern to imitate.

### The B2C prototype (also not production auth)

`src/features/B-C/pages/B2cloginpage.tsx` is a separate consumer-facing prototype whose
"login" is a **stub**: it validates the email format, then writes it to `sessionStorage`
and navigates. The real call is commented out in the source:

```ts
// ── TODO: Replace with real auth API call ──
// const res = await fetch(`${backendUrl}/api/b2c/auth/magic-link`, { ... });
await new Promise(r => setTimeout(r, 1200));
sessionStorage.setItem('b2c_email', email.trim());
navigate('/b2c/dashboard');
```

Its guard is correspondingly cosmetic:

```tsx
const B2CProtectedRoute = ({ children }) => {
  const email = sessionStorage.getItem('b2c_email');
  return email ? <>{children}</> : <Navigate to="/b2c/login" replace />;
};
```

**This is a demo path with no authentication.** Anyone can set that key from the console.
It is documented here for completeness — **do not copy it into a production system.**
Everything from §5 onward describes the real, production B2B flow.

---

## 5. The invite system (the real "signup")

All account creation flows through one function: `backend/src/lib/sendInvite.ts`.

### Why not `inviteUserByEmail()`

Supabase exposes `supabaseAdmin.auth.admin.inviteUserByEmail()`, which both creates the
auth user *and* sends Supabase's own generic email. We deliberately **split those two
steps** so that we control the email entirely:

```
inviteUserByEmail()        →  creates auth user  +  sends Supabase's generic email  ❌
generateLink({type:'invite'}) →  creates auth user  +  returns the link, sends nothing ✅
        then: our own branded, role-specific email via Resend
```

### `sendInvite()` — the complete implementation

```ts
// backend/src/lib/sendInvite.ts
import { supabaseAdmin } from './supabase';
import { sendMail } from './mailer';
import { buildInviteEmail, InviteRole } from './inviteEmails';

// Origins allowed as an invite redirect base. Must match ALLOWED_ORIGINS in index.ts.
const ORIGINS_DEFAULT = 'https://testcrack.com,https://www.testcrack.com,https://dev.testcrack.com';
const KNOWN_ORIGINS = new Set(
  (process.env.ALLOWED_ORIGINS ?? ORIGINS_DEFAULT)
    .split(',').map(s => s.trim()).filter(s => s.startsWith('https://'))   // https only
);

function inviteRedirect(requestOrigin?: string): string {
  // Prefer the origin the invite was triggered from, so an invite sent from
  // dev.testcrack.com returns to dev, not to production.
  if (requestOrigin && KNOWN_ORIGINS.has(requestOrigin)) {
    return `${requestOrigin.replace(/\/+$/, '')}/auth/callback`;
  }
  const base = process.env.FRONTEND_URL;
  return `${(base || 'http://localhost:8080').replace(/\/+$/, '')}/auth/callback`;
}

export interface SendInviteResult {
  userId:         string | null;  // Supabase auth user id (for pending-* linking)
  alreadyExisted: boolean;        // true → a recovery link was issued instead
  emailSent:      boolean;        // false → auth user exists but email delivery failed
}

export async function sendInvite(opts: {
  email: string; name: string; role: InviteRole;
  institute?: string; origin?: string;
}): Promise<SendInviteResult> {
  const email      = opts.email.trim().toLowerCase();
  const redirectTo = inviteRedirect(opts.origin);
  const data       = { full_name: opts.name, role: opts.role };  // → JWT user_metadata

  let actionLink: string | null = null;
  let userId:     string | null = null;
  let alreadyExisted = false;

  const invite = await supabaseAdmin.auth.admin.generateLink({
    type: 'invite', email, options: { data, redirectTo },
  } as any);

  if (invite.error) {
    const msg = (invite.error.message ?? '').toLowerCase();
    if (msg.includes('already') || msg.includes('registered') || msg.includes('exists')) {
      // Auth user already exists (re-invite, or invited earlier and never accepted).
      // Issue a RECOVERY link instead so they can still (re)set a password and get in.
      alreadyExisted = true;
      const rec = await supabaseAdmin.auth.admin.generateLink({
        type: 'recovery', email, options: { redirectTo },
      } as any);
      if (rec.error) throw rec.error;
      actionLink = rec.data?.properties?.action_link ?? null;
      userId     = rec.data?.user?.id ?? null;
    } else {
      throw invite.error;
    }
  } else {
    actionLink = invite.data?.properties?.action_link ?? null;
    userId     = invite.data?.user?.id ?? null;
  }

  // Send the branded, role-specific email. A send failure is NON-FATAL: the auth user
  // and link already exist, so the caller still writes its DB rows and reports
  // emailSent:false, letting an admin re-invite.
  let emailSent = false;
  if (actionLink) {
    try {
      const { subject, html } = buildInviteEmail(opts.role, opts.name, actionLink, opts.institute);
      await sendMail({ to: email, subject, html });
      emailSent = true;
    } catch (mailErr) {
      console.error('[sendInvite] Resend send failed (auth user was still created):', mailErr);
    }
  }

  return { userId, alreadyExisted, emailSent };
}
```

**Three behaviours worth copying verbatim:**

1. **Origin-aware redirect.** The invite link points back to *the site the invite was sent
   from*, validated against an allow-list. Without this, a staging admin's invite drops
   the recipient onto production. The `startsWith('https://')` filter prevents an
   `http://` origin from ever becoming a redirect target.
2. **Invite → recovery fallback.** Re-inviting an existing user is a normal, expected
   admin action (people lose emails). Rather than erroring, it silently degrades to a
   password-recovery link, which achieves the same outcome: they set a password and get in.
3. **Email failure is non-fatal, but *reported*.** `emailSent: false` propagates all the
   way to the admin's UI response as `inviteEmailSent`, so the admin knows to resend
   rather than assuming success.

### Supabase admin client

```ts
// backend/src/lib/supabase.ts
import { createClient } from '@supabase/supabase-js';

export const supabaseAdmin = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,   // service-role: server-side ONLY
  { auth: { autoRefreshToken: false, persistSession: false } }
);
```

> `autoRefreshToken: false` and `persistSession: false` are correct and important for a
> server client — there is no user session to persist, and a background refresh timer in
> a server process is a leak. **The service-role key must never reach the browser.**

### The invite call sites

All four follow the same shape. Example — `addStudent`
(`backend/src/controllers/instituteAdminController.ts`):

```ts
export async function addStudent(req: AuthRequest, res: Response) {
  const { studentName, studentEmail } = req.body;
  if (!studentName?.trim() || !studentEmail?.trim()) {
    return res.status(400).json({ error: 'studentName and studentEmail are required.' });
  }

  const appUserId   = (req as any).appUserId as string;
  const instituteId = await getInstituteId(appUserId);        // caller's own institute
  if (!instituteId) return res.status(403).json({ error: 'Not part of any institute.' });

  const email = studentEmail.trim().toLowerCase();
  const name  = studentName.trim();

  // 1. Guard: role clash + cross-institute enrollment
  let dbUser = await prisma.user.findUnique({ where: { email } });
  if (dbUser) {
    if (dbUser.role !== UserRoleType.STUDENT) {
      return res.status(409).json({ error: 'Email already linked with a non-student account. ...' });
    }
    const existingEnrollment = await prisma.institute_students.findUnique({
      where: { user_id: dbUser.id },
    });
    if (existingEnrollment) {
      return res.status(409).json({
        error: existingEnrollment.institute_id === instituteId
          ? 'This student is already enrolled in your institute.'
          : 'This student is already enrolled at another institute.',
      });
    }
  }

  // 2. Create auth user + send branded invite
  const { userId: supabaseUserId, emailSent } = await sendInvite({
    email, name, role: 'STUDENT', origin: req.get('origin') ?? undefined,
  });

  // 3+4. ATOMIC: User row and institute_students row in one transaction.
  //      If the link row fails (race), the User write rolls back too.
  const savedUser = await prisma.$transaction(async (tx) => {
    let user = dbUser;
    if (!user) {
      user = await tx.user.create({
        data: {
          email, name, role: UserRoleType.STUDENT,
          supabaseuserid: supabaseUserId ?? `pending-${Date.now()}`,
        },
      });
    } else if (supabaseUserId && user.supabaseuserid.startsWith('pending-')) {
      user = await tx.user.update({
        where: { id: user.id },
        data:  { supabaseuserid: supabaseUserId },   // heal the sentinel
      });
    }
    await tx.institute_students.create({
      data: { user_id: user.id, institute_id: instituteId, is_active: true },
    });
    return user;
  });

  return res.status(201).json({
    data: { userId: savedUser.id, name: savedUser.name, email: savedUser.email,
            inviteEmailSent: emailSent },
  });
}
```

Error handling closes the race the read-check can't:

```ts
catch (err: any) {
  // Two concurrent requests both passed the duplicate check — the second hits the
  // unique constraint. Return 409, not a raw 500.
  if (err.code === 'P2002') {
    return res.status(409).json({ error: 'This student is already enrolled in your institute.' });
  }
  console.error('[InstituteAdmin] addStudent error:', err);
  return res.status(500).json({
    error: 'Enrollment failed. If an invite email was already sent, please retry — the student record was not saved.',
  });
}
```

> **Copy these three things:** the transaction wrapping the two writes; the `P2002`
> translation to 409; and the honest error message that tells the admin what state the
> system is actually in (email possibly sent, record definitely not saved).

**Variations by role:**

| Controller | Function | Extra behaviour |
|---|---|---|
| `superadminController` | `createInstitute` | Also creates the `institutes` row and the `institute_owners` link; sets `created_by` to the acting superadmin. Not transactional. |
| `instituteOwnerController` | `addAdmin` | Resolves the caller's owned institute first; `upsert` on `institute_admins`. |
| `instituteAdminController` | `addTutor` | Accepts optional `specialization`; `upsert` on `institute_instructors`. Transactional. |
| `instituteAdminController` | `addStudent` | Cross-institute enrollment check; `create` (not upsert). Transactional. |

---

## 6. Email — Resend, templates, and why not Supabase mail

### Provider: Resend

```ts
// backend/src/lib/mailer.ts
import { Resend } from 'resend';

const RESEND_API_KEY = process.env.RESEND_API_KEY ?? '';
const MAIL_FROM      = process.env.MAIL_FROM ?? 'TestCrack <auth@mail.testcrack.com>';

if (!RESEND_API_KEY) {
  console.warn('[mailer] RESEND_API_KEY is not set — invite/transactional emails will fail to send.');
}

const resend = new Resend(RESEND_API_KEY);

export interface SendMailArgs {
  to: string; subject: string; html: string;
  text?: string;   // optional plain-text fallback; Resend derives one from html if omitted
}

export async function sendMail({ to, subject, html, text }: SendMailArgs): Promise<void> {
  if (!RESEND_API_KEY) throw new Error('RESEND_API_KEY not configured');

  const { error } = await resend.emails.send({
    from: MAIL_FROM, to, subject, html, ...(text ? { text } : {}),
  });

  // Resend returns { error } rather than throwing on API-level failures.
  if (error) {
    throw new Error(`Resend send failed: ${error.name ?? ''} ${error.message ?? JSON.stringify(error)}`.trim());
  }
}
```

**Two details that bite people:**
- Resend **returns** `{ error }` instead of throwing. A naive `await resend.emails.send(...)`
  with no error check will silently swallow every delivery failure.
- `MAIL_FROM` must be a **verified sending domain** in Resend
  (here a subdomain, `mail.testcrack.com`) with SPF/DKIM DNS records published. Using a
  subdomain for transactional mail keeps a deliverability problem from poisoning the
  reputation of your root domain.

### Why not Supabase's built-in email

| | Supabase built-in | Our Resend layer |
|---|---|---|
| Branding | Generic, one template for all | Full HTML control, our brand |
| Role-specific copy | Impossible | Four distinct templates |
| Rate limits | Low on the free SMTP tier | Resend's plan limits |
| Deliverability | Shared Supabase reputation | Our own verified domain |
| Failure visibility | Opaque | `emailSent` flag surfaced to the admin UI |

### Role-specific templates

`backend/src/lib/inviteEmails.ts` defines four variants keyed on role:

```ts
export type InviteRole = 'INSTITUTE_OWNER' | 'INSTITUTE_ADMIN' | 'INSTRUCTOR' | 'STUDENT';

interface InviteContent {
  subject: string;
  heading: string;
  intro:   string;   // 1–2 sentences of role-specific context
  cta:     string;   // button label
  footer:  string;   // small role-specific note under the button
}
```

| Role | Subject | CTA |
|---|---|---|
| `INSTITUTE_OWNER` | *You're the owner of {institute} on TestCrack* | Set password & open dashboard |
| `INSTITUTE_ADMIN` | *You've been added as an admin for {institute} on TestCrack* | Set password & open dashboard |
| `INSTRUCTOR` | *You've been invited to teach on TestCrack* | Set password & start teaching |
| `STUDENT` | *Your TestCrack IELTS prep is ready* | Set password & start |

Each body tells the recipient **what their role can do and what happens next** — the
student's, for example, names the diagnostic as the immediate first step:

> "You've been enrolled at {institute} to prepare for IELTS on TestCrack. First up is a
> short diagnostic that sets your starting band — then your daily practice unlocks. Set
> your password to begin."

The renderer is a self-contained HTML shell with **inline styles only** (email clients
strip `<style>` blocks), a table-based layout (the only reliable layout primitive in
email), a gradient header bar, the CTA button, and a copy-paste fallback link:

```ts
function renderHtml(c: InviteContent, actionLink: string): string {
  return `<!doctype html>
<html>
  <body style="margin:0;padding:0;background:#f1f5f9;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f1f5f9;padding:32px 0;">
      <tr><td align="center">
        <table role="presentation" width="480" cellpadding="0" cellspacing="0" style="max-width:480px;width:100%;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.08);">
          <tr><td style="background:linear-gradient(135deg,#4f46e5,#7c3aed);padding:28px 32px;">
            <div style="color:#ffffff;font-size:20px;font-weight:800;">TestCrack</div>
          </td></tr>
          <tr><td style="padding:32px;">
            <h1 style="margin:0 0 12px;font-size:22px;line-height:1.3;color:#0f172a;font-weight:800;">${c.heading}</h1>
            <p style="margin:0 0 24px;font-size:15px;line-height:1.6;color:#475569;">${c.intro}</p>
            <table role="presentation" cellpadding="0" cellspacing="0"><tr><td style="border-radius:10px;background:#4f46e5;">
              <a href="${actionLink}" style="display:inline-block;padding:13px 28px;font-size:15px;font-weight:700;color:#ffffff;text-decoration:none;border-radius:10px;">${c.cta}</a>
            </td></tr></table>
            <p style="margin:24px 0 0;font-size:13px;color:#94a3b8;">${c.footer}</p>
            <p style="margin:16px 0 0;font-size:12px;color:#cbd5e1;">If the button doesn't work, copy and paste this link into your browser:<br/>
              <span style="color:#818cf8;word-break:break-all;">${actionLink}</span></p>
          </td></tr>
          <tr><td style="padding:20px 32px;border-top:1px solid #f1f5f9;">
            <p style="margin:0;font-size:12px;color:#94a3b8;">This invite is single-use and expires soon. If you weren't expecting it, you can ignore this email.</p>
          </td></tr>
        </table>
      </td></tr>
    </table>
  </body>
</html>`;
}
```

> **Note for adapters:** `name` and `institute` are interpolated into HTML without
> escaping. Both are admin-entered values in our threat model, but if you ever accept
> these from a less-trusted source, HTML-escape them before interpolation.

---

## 7. The invite acceptance / set-password flow

The invite link lands on **`/auth/callback`** — never on `/login`, and never on a
hardcoded localhost in production.

**Page:** `src/features/auth/components/AuthCallbackPage.tsx`

```
Email CTA clicked
    │
    ▼
FRONTEND_URL/auth/callback#access_token=…&refresh_token=…&type=invite
    │
    ▼
AuthCallbackPage parses the URL hash
    │
    ├─ no access_token      → error: "This link is missing its sign-in token."
    ├─ error_description    → error: show the decoded provider message
    │
    ▼
supabase.auth.setSession({ access_token, refresh_token })   ← session is now live
    │
    ▼
window.history.replaceState(null, "", pathname)             ← strip tokens from the URL
    │
    ├─ type === "recovery" → navigate("/reset-password")
    ├─ type === "invite"   → phase = "set-password"  (form below)
    └─ otherwise           → refreshProfile() → navigate("/dashboard")
```

```tsx
const ran = useRef(false);   // StrictMode / re-mount guard — process the hash exactly once

useEffect(() => {
  if (ran.current) return;
  ran.current = true;

  (async () => {
    const hash = window.location.hash;
    if (!hash || !hash.includes("access_token")) {
      setErrorMsg("This link is missing its sign-in token. Please use the link from your email again.");
      setPhase("error"); return;
    }

    const params       = new URLSearchParams(hash.substring(1));
    const type         = params.get("type") ?? "";
    const accessToken  = params.get("access_token");
    const refreshToken = params.get("refresh_token") ?? "";
    const linkError    = params.get("error_description") ?? params.get("error");

    setLinkType(type);                       // so the error phase can tailor its copy

    if (linkError)    { setErrorMsg(decodeURIComponent(linkError).replace(/\+/g, " ")); setPhase("error"); return; }
    if (!accessToken) { setErrorMsg("Invalid or expired link."); setPhase("error"); return; }

    const { error } = await supabase.auth.setSession({
      access_token: accessToken, refresh_token: refreshToken,
    });
    if (error) { setPhase("error"); return; }

    window.history.replaceState(null, "", window.location.pathname);  // ← scrub tokens

    if (type === "recovery") { navigate("/reset-password", { replace: true }); return; }
    if (type === "invite")   { setPhase("set-password"); return; }

    await refreshProfile().catch(() => {});
    navigate("/dashboard", { replace: true });
  })();
}, [navigate, refreshProfile]);
```

**Three details worth copying:**

1. **`ran.current` guard.** React 18 StrictMode runs effects twice in development. Without
   this, the hash is consumed twice and the second pass fails on an already-cleared URL.
2. **`replaceState` to scrub tokens.** Access tokens in `window.location` leak into browser
   history, the `Referer` header of any outbound link, and analytics. Strip them the moment
   the session is established.
3. **Forced password-set for invitees.** An invited user has **no password at all** — the
   invite link is their only credential. They must be made to set one before entering, or
   they can never log in again.

Set-password submit:

```tsx
const handleSetPassword = async (e: React.FormEvent) => {
  e.preventDefault();
  setFormError("");
  if (password.length < 8)   { setFormError("Password must be at least 8 characters."); return; }
  if (password !== confirm)  { setFormError("Passwords don't match."); return; }

  setSubmitting(true);
  const { error } = await supabase.auth.updateUser({ password });
  if (error) { setFormError(error.message || "Could not set your password. Please try again."); setSubmitting(false); return; }

  await refreshProfile().catch(() => {});   // load role so the redirect is correct
  navigate("/dashboard", { replace: true });
};
```

### Expired-invite UX

When the link is dead, the error phase gives the invitee a **concrete next action**
naming the exact UI control their admin should use:

> **Invite link expired** — This invite link has expired or has already been used.
> **What to do next:** Contact your institute admin and ask them to resend your invite.
> They can find the **Resend Invite** option next to your name in the student list.
> *Already set your password? → Go to login*

That control really exists: `POST /api/institute-admin/students/:userId/resend-invite`,
surfaced in the admin's student list.

### Legacy callback component

`src/features/auth/components/AuthCallback.tsx` is an older, simpler variant that handles
hash tokens landing on the **root** URL and routes by `type` (`recovery` → `/reset-password`,
`signup`/`magiclink` → `/profile?welcome=true`, else `/dashboard`). `AuthCallbackPage` is
the one wired to `/auth/callback` and is the current implementation. Prefer it.

---

## 8. Login

**Page:** `src/features/auth/components/LoginPage.tsx` · **Route:** `/login`

```tsx
const handleLogin = async (e: React.FormEvent) => {
  e.preventDefault();
  setLoading(true);
  try {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;

    // Defence in depth: refuse an unverified account even if Supabase issued a session.
    if (!data.user?.email_confirmed_at) {
      await supabase.auth.signOut();
      throw new Error("Please verify your email before signing in. Check your inbox for the confirmation link.");
    }

    toast({ title: "Welcome back!", description: "You've been signed in successfully." });
    // Navigate to /login — the LoginRedirect component handles the role-based redirect.
    navigate("/login");
  } catch (error: any) {
    toast({ title: "Sign In Failed", description: error.message, variant: "destructive" });
  } finally {
    setLoading(false);
  }
};
```

**The redirect-through-`/login` trick:** rather than each entry point computing a
destination, login always navigates back to `/login`. That route is conditional —

```tsx
<Route path="/login" element={user ? <LoginRedirect /> : <LoginPage />} />
```

— so once a session exists the same URL renders `LoginRedirect`, which is the *single*
place that maps role → home. One implementation, no drift. See §12.

**Form details:** email + password, `minLength={6}` on the password, a show/hide toggle,
an inline "Forgot password?" that flips the same component into reset mode, and a
`?reset=success` query param that raises a confirmation toast after a completed reset.

**Session storage** (`src/integrations/supabase/client.ts`):

```ts
export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  auth: {
    storage: localStorage,
    persistSession: true,
    autoRefreshToken: true,
  }
});
```

Sessions persist in `localStorage` under `sb-*` keys and refresh automatically.

> Two Supabase clients exist in the frontend: `src/integrations/supabase/client.ts`
> (typed, configured as above — **this is the one in use**) and
> `src/shared/services/supabase.ts` (untyped, default options, reads
> `VITE_SUPABASE_ANON_KEY`). Consolidate to one when adapting.

---

## 9. Forgot password / password reset

A three-stage flow. Stages 1 and 3 are rendered by the *same* component as login.

### Stage 1 — request the link (`LoginPage.tsx`, `isForgotPassword` mode)

```tsx
const handleForgotPassword = async (e: React.FormEvent) => {
  e.preventDefault();
  if (!email) {
    toast({ title: "Email Required", description: "Please enter your email address.", variant: "destructive" });
    return;
  }
  setLoading(true);
  try {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    if (error) throw error;
    toast({ title: "Check Your Email", description: "We've sent you a password reset link." });
    setIsForgotPassword(false);
    setEmail("");
  } catch (error: any) {
    toast({ title: "Error", description: error.message, variant: "destructive" });
  } finally {
    setLoading(false);
  }
};
```

> Note the asymmetry with invites: **this call is client-side and uses Supabase's own
> email template**, because it is triggered by an anonymous visitor with no session — there
> is no authenticated backend route to mint a link through. Only *admin-initiated* invites
> get the branded Resend treatment. If you want branded reset emails too, add an
> unauthenticated backend endpoint that calls
> `generateLink({ type: 'recovery' })` and sends via Resend — and rate-limit it hard,
> because it is an unauthenticated email-sending endpoint.
>
> `redirectTo` here uses `window.location.origin` (the live browser origin) rather than the
> server-side allow-list used for invites. Supabase's own **Redirect URLs** allow-list in
> the project dashboard is what constrains it — make sure every environment origin is
> registered there, or reset links will bounce.

### Stage 2 — the link lands

Supabase sends the user to `/reset-password#access_token=…&type=recovery`. If it lands on
`/auth/callback` instead, `AuthCallbackPage` detects `type === "recovery"` and forwards to
`/reset-password`.

### Stage 3 — set the new password (`ResetPasswordPage.tsx`)

Validates that a session actually exists before rendering the form:

```tsx
useEffect(() => {
  const checkSession = async () => {
    try {
      const { data: { session }, error } = await supabase.auth.getSession();
      if (error) { setValidSession(false); return; }
      const hashParams = new URLSearchParams(window.location.hash.substring(1));
      const type = hashParams.get("type");
      if (session && type === "recovery") setValidSession(true);
      else if (session)                   setValidSession(true);
      else                                setValidSession(false);
    } catch { setValidSession(false); }
    finally { setCheckingSession(false); }
  };
  checkSession();
}, []);
```

Submit:

```tsx
const handleResetPassword = async (e: React.FormEvent) => {
  e.preventDefault();
  if (newPassword !== confirmPassword) {
    toast({ title: "Passwords Don't Match", ..., variant: "destructive" }); return;
  }
  const passwordError = validatePassword(newPassword);   // length >= 6
  if (passwordError) { toast({ title: "Invalid Password", description: passwordError, variant: "destructive" }); return; }

  setLoading(true);
  try {
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) throw error;
    toast({ title: "Password Updated!", description: "Your password has been successfully changed." });
    await supabase.auth.signOut();               // ← force re-login with the new password
    navigate("/login?reset=success");
  } catch (error: any) {
    toast({ title: "Error", description: error.message || "Failed to update password.", variant: "destructive" });
  } finally {
    setLoading(false);
  }
};
```

**Notable UX/behaviour:**
- **Sign-out after reset.** The recovery session is discarded and the user must log in with
  the new password. This proves the new credential works and invalidates the recovery token.
- Live "Passwords match / don't match" indicator; submit is disabled while they differ.
- Invalid/expired session renders an "Invalid Link" panel with a route back to sign-in
  instead of a dead form.

### ⚠ Inconsistent password length rules

Three different minimums are enforced in three places:

| Location | Minimum |
|---|---|
| `AuthCallbackPage` (invite set-password) | **8** characters |
| `ResetPasswordPage` (reset) | **6** characters |
| `LoginPage` input `minLength` | **6** characters |

Supabase's own project-level minimum is the real floor. **When adapting, pick one value,
set it in the Supabase dashboard, and mirror that single number everywhere.** Consider
also requiring a character-class mix or checking against a breached-password list — the
current rules allow `12345678`.

---

## 10. Logout and the global 401 handler

### Explicit sign-out (`useAuth.tsx`)

```tsx
const signOut = async () => {
  try { await supabase.auth.signOut(); }
  catch (error) { console.error('Error signing out:', error); }

  setProfile(null); setSession(null); setUser(null);

  localStorage.removeItem(PROFILE_CACHE_KEY);                 // 'ts_user_profile'
  Object.keys(localStorage).forEach(key => {
    if (key.startsWith('sb-')) localStorage.removeItem(key);  // every Supabase key
  });

  navigate('/login', { replace: true });
};
```

The explicit `sb-*` sweep matters: a failed or partial `signOut()` can leave a stale
session blob behind that silently re-authenticates the next visitor on a shared machine.

### Global 401 → forced logout

Any backend 401 triggers a single, deduplicated logout. `authClient.ts` dispatches:

```ts
async function handleHttpError(res: Response): Promise<never> {
  if (res.status === 401) {
    window.dispatchEvent(new CustomEvent('auth:unauthorized'));
  }
  // ... friendly toast for every status except 401 (the redirect is feedback enough)
}
```

`useAuth` listens, guarded by a ref so ten concurrent 401s cause one redirect, not ten:

```tsx
const handlingUnauthorized = useRef(false);

useEffect(() => {
  const handleUnauthorized = async () => {
    if (handlingUnauthorized.current) return;
    handlingUnauthorized.current = true;
    try { await supabase.auth.signOut(); } catch {}
    setProfile(null); setSession(null); setUser(null);
    localStorage.removeItem(PROFILE_CACHE_KEY);
    Object.keys(localStorage).forEach(k => { if (k.startsWith('sb-')) localStorage.removeItem(k); });
    navigate('/login', { replace: true });
  };
  window.addEventListener('auth:unauthorized', handleUnauthorized);
  return () => window.removeEventListener('auth:unauthorized', handleUnauthorized);
}, [navigate]);
```

> **Pattern to copy:** a custom DOM event decouples the fetch layer from the router. The
> API client needs no `useNavigate`, no React context, no import of the auth module — it
> just announces the fact, and whoever owns navigation reacts.

### Auth state changes

```tsx
supabase.auth.onAuthStateChange(async (event, session) => {
  // Skip TOKEN_REFRESHED entirely — Supabase fires it on every tab switch / window focus.
  // The session hasn't meaningfully changed, but calling setSession/setUser with new
  // object references re-renders every useAuth consumer, causing visible dashboard reloads.
  if (event === 'TOKEN_REFRESHED') { setLoading(false); return; }

  if (event === 'SIGNED_OUT') { /* clear everything, return */ }

  const verifiedUser = session?.user?.email_confirmed_at ? session.user : null;

  // Only replace state when the identity actually changed — Supabase hands back a new
  // object on every event even when the user is identical.
  setSession(prev => prev?.user?.id === session?.user?.id ? prev : session);
  setUser(prev   => prev?.id        === verifiedUser?.id  ? prev : verifiedUser);

  if (verifiedUser) {
    const isNewLogin = event === 'SIGNED_IN' || !profileRef.current;
    fetchProfile(
      /* force  */ event === 'SIGNED_IN' || event === 'USER_UPDATED' || !profileRef.current,
      /* silent */ !isNewLogin,
    );
  }
  setLoading(false);
});
```

> **Worth copying:** both guards exist because of real, user-visible bugs. `supabase-js`
> emits `TOKEN_REFRESHED` on window focus and returns fresh object references every time;
> naive state updates turn every tab switch into a full dashboard remount. Compare by
> **id**, not by reference.

### Profile caching

The role-bearing profile is cached in `localStorage` (`ts_user_profile`) and hydrated
synchronously on mount, so a refresh doesn't flash the login screen:

```tsx
const [profile, setProfile] = useState<UserProfile | null>(() => {
  try {
    const cached = localStorage.getItem(PROFILE_CACHE_KEY);
    return cached ? JSON.parse(cached) : null;
  } catch { return null; }
});
```

It is re-fetched in the background and written back only when the payload actually
differs (`JSON.stringify` comparison), avoiding needless re-renders.

> **Security note:** the cached profile contains the role and drives *UI* decisions only.
> Every privileged action is re-authorized server-side from the database. Tampering with
> the cached role reveals menu items, not data.

---

## 11. Backend request pipeline — requireAuth → ensureUser → authorize

Three middlewares, always in this order.

### 1. `requireAuth` — verify the JWT

```ts
// backend/src/middleware/auth.ts
import jwt from 'jsonwebtoken';

export interface AuthRequest extends Request {
  supabaseUserId?: string;
  userEmail?:      string;
  userRole?:       UserRoleType;
  userMetadata?:   any;
}

const JWT_SECRET = process.env.SUPABASE_JWT_SECRET;
if (!JWT_SECRET) {
  console.error('[Auth] SUPABASE_JWT_SECRET is not set — all authenticated requests will fail.');
}

export function requireAuth(req: AuthRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Missing or invalid token' });
  }

  const token = authHeader.split(' ')[1];
  try {
    const payload = jwt.verify(token, JWT_SECRET!) as any;
    // Supabase claims: sub = user UUID, email = email, user_metadata = profile metadata
    req.supabaseUserId = payload.sub;
    req.userEmail      = payload.email ?? undefined;
    req.userMetadata   = payload.user_metadata ?? {};
    return next();
  } catch (err: any) {
    if (err.name === 'TokenExpiredError') return res.status(401).json({ message: 'Session expired. Please login again.' });
    if (err.name === 'JsonWebTokenError') return res.status(401).json({ message: 'Invalid token.' });
    console.error('[Auth] Unexpected JWT error:', err);
    return res.status(401).json({ message: 'Authentication failed.' });
  }
}
```

The backend verifies the Supabase JWT **locally** with the shared
`SUPABASE_JWT_SECRET` (HS256) — no network round-trip to Supabase per request.

> If you adapt this to a Supabase project using **asymmetric (RS256/ES256) JWT signing
> keys**, verify against the project's JWKS endpoint instead of a shared secret, and pin
> the expected `algorithms`, `issuer` and `audience` in the `jwt.verify` options.

### 2. `ensureUser` — resolve to a DB row and load the role

Described fully in [§2](#2-the-identity-model--two-user-records-one-person). Sets:

```ts
(req as any).appUserId = user.id;    // our UUID
req.userRole           = user.role;  // fresh from DB
```

### 3. `authorize(...roles)` — enforce RBAC

```ts
// backend/src/middleware/rbac.ts
export function authorize(...roles: UserRoleType[]) {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.userRole) {
      return res.status(403).json({ message: 'Access denied: No role assigned' });
    }
    if (!roles.includes(req.userRole)) {
      return res.status(403).json({
        message: `Access denied: Required roles: [${roles.join(', ')}]. Your role: ${req.userRole}`
      });
    }
    next();
  };
}
```

> The 403 body echoes the required roles and the caller's own role. Useful in development;
> consider trimming it in production so the error doesn't map out your permission model
> for an attacker.

### Composition — router level

```ts
// backend/src/routes/superadminRoutes.ts — the whole router is SUPERADMIN-only
router.use(requireAuth);
router.use(ensureUser);
router.use(authorize(UserRoleType.SUPERADMIN));
```

```ts
// backend/src/routes/instituteOwnerRoutes.ts — mixed, per-route
router.use(requireAuth);
router.use(ensureUser);

// Owner-only
router.get   ('/admins',            authorize(IO), C.getAdmins);
router.post  ('/admins',            authorize(IO), C.addAdmin);
router.delete('/admins/:userId',    authorize(IO), C.removeAdmin);

// Shared by owner and admin
const shared = authorize(IO, IA);
router.get('/summary',  shared, C.getSummary);
router.get('/students', shared, C.getInstituteStudents);
```

```ts
// backend/src/index.ts — app level
app.use('/api/profile',    requireAuth, ensureUser,                   userProfileRoutes);
app.use('/api/diagnostic', requireAuth, ensureUser,                   diagnosticRoutes);
app.use('/api/ia',         requireAuth, ensureUser, requireDiagnosed, iaRoutes);
app.use('/api/mock',       requireAuth, ensureUser, requireDiagnosed, mockRoutes);
```

### 4. `requireDiagnosed` — the onboarding gate as middleware

```ts
// backend/src/middleware/requireDiagnosed.ts
/**
 * Blocks gameplay endpoints (drills, IA, mock) until the student has completed the
 * one-time diagnostic. The frontend route guard is NOT sufficient on its own — an
 * un-diagnosed student could otherwise deep-link or call these APIs directly and drive
 * drills/IA/mock, populating the competency matrix without ever taking the diagnostic.
 * Must run AFTER requireAuth + ensureUser (needs req.appUserId).
 */
export async function requireDiagnosed(req: AuthRequest, res: Response, next: NextFunction) {
  const appUserId = (req as any).appUserId as string;
  if (!appUserId) return res.status(401).json({ success: false, error: 'Unauthorized.' });

  const student = await prisma.institute_students.findUnique({
    where: { user_id: appUserId }, select: { isDiagnosed: true },
  });
  if (!student)             return res.status(404).json({ success: false, error: 'Student not found.' });
  if (!student.isDiagnosed) return res.status(403).json({ success: false, error: 'diagnostic_required', message: 'Complete the diagnostic assessment first.' });

  return next();
}
```

> **The single most important lesson in this document:** *every* onboarding gate enforced
> in the UI must also be enforced server-side. A frontend guard is UX; the middleware is
> the actual rule. The code comment above documents exactly the attack it closes.

### CORS

```ts
// backend/src/index.ts
const ORIGINS_DEFAULT = 'http://localhost:8080,https://testcrack.com,https://www.testcrack.com,https://dev.testcrack.com,http://72.60.221.118:5000';
const allowedOrigins = (process.env.ALLOWED_ORIGINS ?? ORIGINS_DEFAULT)
  .split(',').map(s => s.trim()).filter(Boolean);

const corsOptions: cors.CorsOptions = {
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) callback(null, true);
    else callback(new Error('Not allowed by CORS'));
  },
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
};
app.use(cors(corsOptions));
```

`ALLOWED_ORIGINS` does double duty: CORS **and** invite-redirect validation (§5). Keep the
two lists in sync — they are read from the same env var precisely so they cannot drift.

> **Two things to fix when adapting:** (a) `!origin → allow` permits non-browser clients
> (curl, Postman) through — acceptable only because every route still requires a valid
> JWT; (b) the request logger in `index.ts` prints full headers and bodies, which means
> **`Authorization: Bearer <jwt>` and any password in a body are written to the logs**.
> Redact both before production.

---

## 12. Frontend route protection and role-based redirects

### `RoleProtectedRoute`

```tsx
// src/shared/components/auth/ProtectedRoute.tsx
export const RoleProtectedRoute = ({ children, allowedRoles }: RoleProtectedRouteProps) => {
  const { user, profile, loading, profileLoading } = useAuth();
  const location = useLocation();

  // Only block on the profile when a specific role is actually required.
  const profileIsRequiredButMissing = allowedRoles && !profile && profileLoading;
  if (loading || profileIsRequiredButMissing) return <VerifyingCredentialsSpinner />;

  if (!user) return <Navigate to="/login" state={{ from: location }} replace />;

  if (allowedRoles && profile && !allowedRoles.includes(profile.role)) {
    // Send them to THEIR OWN home, not to a generic page.
    const roleHome: Record<string, string> = {
      SUPERADMIN:      '/superadmin/dashboard',
      INSTITUTE_OWNER: '/institute-owner/dashboard',
      INSTITUTE_ADMIN: '/institute-admin/dashboard',
      INSTRUCTOR:      '/instructor/dashboard',
      STUDENT:         '/student/dashboard',
    };
    return <Navigate to={roleHome[profile.role] ?? '/'} replace />;
  }

  if (allowedRoles && !profile && !profileLoading) return <Navigate to="/profile" replace />;

  return <>{children}</>;
};
```

Usage:

```tsx
<Route path="/superadmin/dashboard"
  element={<RoleProtectedRoute allowedRoles={['SUPERADMIN']}><SuperAdminDashboard /></RoleProtectedRoute>} />

<Route path="/institute-admin/students"
  element={<RoleProtectedRoute allowedRoles={['INSTITUTE_ADMIN', 'INSTITUTE_OWNER']}><InstituteStudents /></RoleProtectedRoute>} />
```

### `LoginRedirect` — the single source of role → home

```tsx
const LoginRedirect = () => {
  const { profile, loading, profileLoading } = useAuth();
  if (loading || profileLoading) return null;

  if (profile?.role === 'SUPERADMIN')      return <Navigate to="/superadmin/dashboard"      replace />;
  if (profile?.role === 'INSTITUTE_OWNER') return <Navigate to="/institute-owner/dashboard" replace />;
  if (profile?.role === 'INSTITUTE_ADMIN') return <Navigate to="/institute-admin/dashboard" replace />;
  if (profile?.role === 'INSTRUCTOR')      return <Navigate to="/instructor/dashboard"      replace />;

  if (profile?.role === 'STUDENT') {
    if (profile.isEnrolled === false) return <Navigate to="/student/not-enrolled" replace />;
    if (!profile.isDiagnosed)         return <Navigate to="/student/onboarding"   replace />;
  }
  return <Navigate to="/student/dashboard" replace />;
};
```

> **The student branch is the onboarding funnel**, expressed as two ordered conditions.
> Not enrolled outranks not diagnosed, because there is nothing to diagnose without an
> institute. The same ladder is repeated in `ManualDashboardAccess` and
> `StudentDiagnosisGuard` — when adapting, factor it into one helper so the three cannot
> diverge.

### `RequireActiveInstitute` — institute deactivation kill-switch

Wraps every owner/admin route as a layout route. When a SUPERADMIN deactivates an
institute (`PATCH /api/superadmin/institutes/:id/status`), `instituteIsActive` on the
profile flips to `false` and the dashboard is blurred behind a non-dismissible modal:

```tsx
const isRelevantRole = profile?.role === 'INSTITUTE_OWNER' || profile?.role === 'INSTITUTE_ADMIN';
const isDeactivated  = isRelevantRole && profile?.instituteIsActive === false;

<div {...(isDeactivated ? { inert: "" } : {})}
     className={isDeactivated ? "pointer-events-none blur-md select-none opacity-40 …" : ""}>
  {children || <Outlet />}
</div>
{isDeactivated && <AccessRevokedModal onSignOut={signOut} />}
```

The `inert` attribute (plus `pointer-events-none`) removes the blurred subtree from the
accessibility tree and tab order, so the content behind the modal can't be reached by
keyboard or screen reader.

> This is a **presentation-layer** lock. Copy the pattern, but also enforce the
> deactivated state in the API for any route that must be genuinely unreachable.

### Route inventory

| Path | Guard | Component |
|---|---|---|
| `/` | public | `LandingPage` |
| `/login` | conditional (`user ? LoginRedirect : LoginPage`) | — |
| `/auth` | — | `<Navigate to="/login" replace />` |
| `/auth/callback` | public (token-bearing) | `AuthCallbackPage` |
| `/reset-password` | public (session-bearing) | `ResetPasswordPage` |
| `/profile` | `RoleProtectedRoute` (any role) | `ProfilePage` |
| `/student/not-enrolled` | `RoleProtectedRoute(['STUDENT'])` | `StudentNotEnrolledPage` |
| `/student/onboarding` | `RoleProtectedRoute(['STUDENT'])` | `OnboardingWalkthrough` |
| `/student/diagnosis` | `RoleProtectedRoute(['STUDENT'])` | `Diagnosis` |
| `/student/dashboard` | `RoleProtectedRoute(['STUDENT'])` + `StudentDiagnosisGuard` | student shell |
| `/superadmin/*` | `RoleProtectedRoute(['SUPERADMIN'])` | superadmin shell |
| `/institute-owner/*` | `RequireActiveInstitute` + `RoleProtectedRoute(['INSTITUTE_OWNER'])` | owner shell |
| `/institute-admin/*` | `RequireActiveInstitute` + `RoleProtectedRoute(['INSTITUTE_ADMIN','INSTITUTE_OWNER'])` | admin shell |
| `/instructor/*` | `RoleProtectedRoute(['INSTRUCTOR'])` | instructor shell |
| `/b2c/*` | `B2CProtectedRoute` (sessionStorage — **not real auth**) | B2C prototype |

### The API client

```ts
// src/features/auth/services/authClient.ts
async function getAccessToken(): Promise<string> {
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;
  if (!token) throw new Error('Not authenticated');
  return token;
}

export async function callBackend(path: string, options: RequestInit = {}): Promise<any> {
  if (!navigator.onLine) { /* fail fast with an isOffline error */ }

  const token = await getAccessToken();
  let res: Response;
  try {
    res = await fetch(path, {
      ...options,
      headers: { ...(options.headers || {}), 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    });
  } catch (err) { handleNetworkError(err); }

  if (!res.ok) await handleHttpError(res);
  return res.json();
}
```

Every call pulls a **fresh** token from the Supabase session (never a captured variable),
so an auto-refreshed token is picked up transparently. A status→message map turns HTTP
codes into human sentences, and a 2-second dedupe prevents toast storms when several
requests fail at once. `uploadFileToBackend()` is the same wrapper for `FormData`, minus
the JSON content-type.

---

## 13. How the Super Admin is created (the bootstrap problem)

**There is no code path that creates a SUPERADMIN.** This is a deliberate decision, and
it is the honest answer to "how is the super admin created".

Verified by exhaustive search of both repositories: `SUPERADMIN` appears in exactly three
places —

| File | Usage |
|---|---|
| `prisma/schema.prisma` | the enum member |
| `src/routes/superadminRoutes.ts` | `authorize(UserRoleType.SUPERADMIN)` |
| frontend role maps / guards | routing and UI |

There is **no** seed script, no migration, no bootstrap env var (`SUPERADMIN_EMAIL` or
similar), and no `createSuperadmin` endpoint. `prisma/seed.ts` seeds question banks only.

### The actual procedure

The first (and any subsequent) super admin is created **manually, out-of-band**, in two steps:

**Step 1 — create the auth user.** Either via the Supabase dashboard
(*Authentication → Users → Add user*, with "Auto Confirm User" enabled), or with the admin
API using the service-role key.

**Step 2 — create/elevate the application row.** Connect to Postgres and set the role:

```sql
-- If the person has already logged in once (ensureUser created the row):
UPDATE "User"
SET    role = 'SUPERADMIN'
WHERE  email = 'platform-admin@example.com';

-- Or insert directly, using the UUID from Supabase auth.users.id:
INSERT INTO "User" (id, supabaseuserid, email, name, role)
VALUES (uuid_generate_v4(), '<supabase-auth-user-uuid>', 'platform-admin@example.com', 'Platform Admin', 'SUPERADMIN');
```

DB access for this is over an SSH tunnel (per `.env.example`):

```
ssh -L 5433:localhost:5432 <user>@<db-host>
psql -h 127.0.0.1 -p 5433 -U postgres -d study_mentor_db
```

The simplest safe sequence: create the auth user → have them log in once (which creates
the `User` row with the default `STUDENT` role and a correct `supabaseuserid`) → run the
`UPDATE`. Because `ensureUser` reads the role from the DB on every request, the promotion
takes effect on their **next request** — no re-login needed.

### Why no self-service endpoint

Any in-app "create super admin" route is a privilege-escalation target: a single
authorization bug in it compromises every institute on the platform. Keeping the
capability outside the application means an attacker needs database or Supabase-dashboard
credentials, not merely an application flaw.

> **Recommendation when replicating.** Keep bootstrap out of the app, but make it
> *repeatable and auditable* rather than a remembered `psql` incantation:
>
> ```ts
> // prisma/seedSuperadmin.ts — run manually: npx tsx prisma/seedSuperadmin.ts
> const email = process.env.BOOTSTRAP_SUPERADMIN_EMAIL;
> if (!email) throw new Error('BOOTSTRAP_SUPERADMIN_EMAIL not set');
>
> const existing = await prisma.user.findUnique({ where: { email } });
> if (existing?.role === 'SUPERADMIN') { console.log('Already a superadmin — nothing to do.'); return; }
>
> // Create the Supabase auth user if absent, then upsert the row with role SUPERADMIN.
> // Idempotent: safe to re-run. Log loudly — this is a privileged, auditable action.
> ```
>
> Never expose it over HTTP. Additionally, log every `role` change to an audit table:
> today a role edit leaves no trace at all.

---

## 14. Onboarding structure — the full org chain

```
┌──────────────────────────────────────────────────────────────────────────────┐
│ STEP 0 — Bootstrap (manual, out-of-band)                                     │
│   Supabase dashboard + SQL  →  User.role = 'SUPERADMIN'                      │
└──────────────────────────────────────────────────────────────────────────────┘
                                     │
                                     ▼
┌──────────────────────────────────────────────────────────────────────────────┐
│ STEP 1 — Super Admin creates an Institute + its Owner                        │
│   UI    : TestCrackSuperAdmin/dashboard/SuperAdminInstitutes.tsx             │
│   API   : POST /api/superadmin/institutes                                    │
│   Body  : { instituteName, address?, ownerName, ownerEmail }                 │
│   Does  : sendInvite(INSTITUTE_OWNER) → User row → institutes row            │
│           → institute_owners link                                            │
│   Email : "You're the owner of {institute} on TestCrack"                     │
└──────────────────────────────────────────────────────────────────────────────┘
                                     │
                                     ▼
┌──────────────────────────────────────────────────────────────────────────────┐
│ STEP 2 — Owner accepts the invite                                            │
│   /auth/callback#type=invite → set password → /institute-owner/dashboard     │
└──────────────────────────────────────────────────────────────────────────────┘
                                     │
                                     ▼
┌──────────────────────────────────────────────────────────────────────────────┐
│ STEP 3 — Owner adds Institute Admins                                         │
│   UI    : InstituteOwner/dashboard/InstituteAdmins.tsx                       │
│   API   : POST /api/institute-owner/admins   { adminName, adminEmail }       │
│   Does  : sendInvite(INSTITUTE_ADMIN) → User row → institute_admins upsert   │
└──────────────────────────────────────────────────────────────────────────────┘
                                     │
                    ┌────────────────┴────────────────┐
                    ▼                                 ▼
┌───────────────────────────────────┐  ┌───────────────────────────────────────┐
│ STEP 4a — Admin onboards Tutors   │  │ STEP 4b — Admin onboards Students     │
│  UI  : Institute/dashboard/       │  │  UI  : Institute/dashboard/           │
│        TutorOnboarding.tsx        │  │        StudentOnboarding.tsx          │
│  API : POST /api/institute-admin/ │  │  API : POST /api/institute-admin/     │
│        tutors                     │  │        students                       │
│  Body: { tutorName, tutorEmail,   │  │  Body: { studentName, studentEmail }  │
│          specialization? }        │  │  Does: sendInvite(STUDENT)            │
│  Does: sendInvite(INSTRUCTOR)     │  │        → institute_students           │
│        → institute_instructors    │  │          (is_active: true)            │
└───────────────────────────────────┘  └───────────────────────────────────────┘
                    │                                 │
                    └────────────────┬────────────────┘
                                     ▼
┌──────────────────────────────────────────────────────────────────────────────┐
│ STEP 5 — Admin creates Batches and assigns members                           │
│   API : POST /api/institute-admin/batches                                    │
│         POST /api/institute-admin/batches/:id/instructors                    │
│         POST /api/institute-admin/batches/:id/students   (capacity enforced) │
└──────────────────────────────────────────────────────────────────────────────┘
                                     │
                                     ▼
┌──────────────────────────────────────────────────────────────────────────────┐
│ STEP 6 — Student accepts, sets a goal, takes the diagnostic → unlocked       │
│   (see §15)                                                                  │
└──────────────────────────────────────────────────────────────────────────────┘
```

### The "needs attention" panel — onboarding as an admin metric

There is no approve/reject queue: invites activate immediately. What an admin actually
needs is visibility into **who stalled**. `GET /api/institute-admin/onboarding-status`
returns exactly two lists:

```ts
// Students invited but who never completed the diagnostic
prisma.institute_students.findMany({
  where:   { institute_id: instituteId, isDiagnosed: false, is_active: true },
  orderBy: { created_at: 'desc' },
  take:    50,
  include: { User: { select: { id: true, name: true, email: true, profileImage: true } } },
});

// Tutors who exist but are on no batch
const unassignedTutors = tutors.filter(
  t => !t.User.ielts_batch_instructors.some(a => batchIdSet.has(a.batch_id))
);
```

```jsonc
{
  "data": {
    "students_not_started": [{ "userId": "…", "name": "…", "email": "…", "invitedAt": "…" }],
    "tutors_unassigned":    [{ "userId": "…", "name": "…", "email": "…", "invitedAt": "…" }]
  }
}
```

Each stalled student gets a one-click **Resend Invite**
(`POST /api/institute-admin/students/:userId/resend-invite`), which re-runs `sendInvite`
and returns `{ data: { emailSent } }`.

> **Pattern worth copying.** The source comment says it best: *"invites activate
> immediately, so what an admin actually needs to see is who was invited but never
> started, and which tutors have no batch yet."* Design the onboarding dashboard around
> **drop-off**, not around approvals — and pair every stalled-state indicator with the
> action that resolves it.

---

## 15. Student onboarding — walkthrough, goal-setting, diagnostic gate

A student's first session is a four-gate funnel. Each gate is a boolean on the profile
returned by `GET /api/profile`.

```
Invite accepted, password set
        │
        ▼
  GET /api/profile  →  { isEnrolled, isDiagnosed, targetBand, … }
        │
        ▼
┌───────────────────────────────────────────────────────────────┐
│ GATE 1  isEnrolled === false                                  │
│   → /student/not-enrolled   (dead end until an admin enrolls) │
└───────────────────────────────────────────────────────────────┘
        │ enrolled
        ▼
┌───────────────────────────────────────────────────────────────┐
│ GATE 2  !isDiagnosed                                          │
│   → /student/onboarding     (3-slide walkthrough)             │
└───────────────────────────────────────────────────────────────┘
        │ "Start diagnostic"
        ▼
┌───────────────────────────────────────────────────────────────┐
│ GATE 3  !targetBand                                           │
│   → OnboardingScreen inside /student/diagnosis                │
│     collects { name, targetBand } → PUT /api/profile          │
└───────────────────────────────────────────────────────────────┘
        │ goal saved
        ▼
┌───────────────────────────────────────────────────────────────┐
│ GATE 4  the diagnostic itself — 4 skills, one-time            │
│   Listening → Reading → Writing → Speaking                    │
│   all four scored ⇒ institute_students.isDiagnosed = true     │
└───────────────────────────────────────────────────────────────┘
        │
        ▼
   /student/dashboard — daily practice unlocked
```

### Gate 1 — not enrolled

`StudentNotEnrolledPage.tsx`. A `STUDENT` whose `institute_students` row is missing:

> **No Institute Access** — Your account isn't linked to any institute yet. Ask your
> institute admin to enroll you — once they do, you'll have full access.

Computed server-side in `getUserProfile`:

```ts
const isEnrolled = user.role === 'STUDENT' ? !!user.institute_students : true;
```

### Gate 2 — the walkthrough

`src/features/student/components/Onboarding/OnboardingWalkthrough.tsx` — three slides,
framer-motion transitions, a `current + 1 / 3` counter. It is **pure explanation**: it
collects nothing and writes nothing.

| # | Headline | Purpose |
|---|---|---|
| 0 | *Welcome to TestCrack* | The premise: consistent daily practice beats cramming; a fresh 20–30 min session is ready each day, no planning required. |
| 1 | *What Happens Every Day* | The daily loop — Practice → Daily Challenge → … — so the habit is legible before day one. |
| 2 | *First, Let's Find Your Level* | Sets up the diagnostic: all four skills, 15–20 minutes, sets the baseline band and the difficulty of every future question, **done once**. |

The final CTA is a plain navigation:

```tsx
const startDiagnostic = () => navigate('/student/diagnosis');
```

> **Why this earns its place:** the walkthrough exists to make a 20-minute unskippable
> assessment feel like a reasonable ask. It states the cost ("about 15–20 minutes"), the
> benefit ("sets your baseline band"), and the scope ("You only do this once") *before*
> asking for the effort. Copy that structure — three slides, one idea each, cost and
> payoff stated plainly.

### Gate 3 — goal setting

`Diagnosis.tsx` self-gates on a missing target band:

```tsx
export default function Diagnosis() {
  const { profile } = useAuth();
  const [forceDone, setForceDone] = useState(false);

  if (!profile?.targetBand && !forceDone) {
    return <OnboardingScreen onComplete={() => setForceDone(true)} />;
  }
  return <DiagnosisInner />;
}
```

```tsx
await callBackend(`/api/profile`, {
  method: "PUT",
  body: JSON.stringify({ name, targetBand: Number(targetBand) }),
});
await refreshProfile();
onComplete();
```

Server-side validation (`userProfileController.updateUserProfile`):

```ts
// Accept camelCase (primary) and snake_case (fallback)
const targetBand = req.body.targetBand ?? req.body.target_band;
const examDate   = req.body.examDate   ?? req.body.exam_date;

if (targetBand !== undefined && targetBand !== null) {
  const band = Number(targetBand);
  if (!Number.isFinite(band) || band < 4.0 || band > 9.0) {
    return res.status(400).json({ error: 'Target band must be between 4.0 and 9.0.' });
  }
  // Snap to the nearest 0.5 so only valid IELTS bands are stored.
  studentData.target_band = Math.round(band * 2) / 2;
}

if (examDate !== undefined && examDate !== null) {
  const d = new Date(examDate);
  if (isNaN(d.getTime())) return res.status(400).json({ error: 'Invalid exam date.' });
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const cmp   = new Date(d); cmp.setHours(0, 0, 0, 0);
  // must be in the future — compared on calendar day, not time-of-day
}
```

> **Domain-snapping is a pattern to copy.** IELTS bands only exist at 0.5 increments, so
> the server rounds rather than rejecting. Validate to your domain's real value set, and
> prefer coercion over a 400 where the intent is unambiguous.

### Gate 4 — the diagnostic

Four skills, each submitted separately, each **one-time**.

```ts
GET  /api/diagnostic/status            → per-skill scored flags + overall_complete
GET  /api/diagnostic/questions/:skill  → a random question set at the student's level
POST /api/diagnostic/submit/:skill     → listening | reading | writing (JSON)
POST /api/diagnostic/submit/speaking   → multipart/form-data audio, max 15 MB
```

**Difficulty is chosen from the target band** — this is why gate 3 must precede gate 4:

```ts
type DiagnosticLevel = 'A' | 'B' | 'C';
// Even thirds of the [4,9] band domain: A 4.0–5.5, B 5.5–7.0, C 7.0–9.0
function resolveLevel(targetBand: number): DiagnosticLevel { return bandToLevel(targetBand); }
```

Each submission writes history and upserts the competency matrix:

```ts
await prisma.assessmentHistory.create({
  data: { student_id: studentId, skill, mode: 'DIAGNOSTIC', band_score: bandScore,
          raw_answers: answers, sub_scores: subScores }
});
await prisma.studentCompetencyMatrix.upsert({
  where:  { student_id_skill: { student_id: studentId, skill } },
  update: { band_score: bandScore, sub_scores: subScores,
            assessments_count: { increment: 1 }, last_updated: new Date() },
  create: { student_id: studentId, skill, band_score: bandScore, sub_scores: subScores,
            assessments_count: 1 }
});
```

Resubmission is refused:

```ts
/**
 * Returns true if this skill's diagnostic has already been scored, so a resubmit can be
 * rejected. A diagnostic section is one-time and must never be rewritten.
 */
async function isSkillAlreadyScored(studentId, skill): Promise<boolean> {
  const existing = await prisma.assessmentHistory.findFirst({
    where: { student_id: studentId, skill, mode: 'DIAGNOSTIC' }, select: { id: true },
  });
  return !!existing;
}
```

Completion flips the gate, driven by a database view:

```ts
/** Mark diagnosed once all 4 skills are done. */
async function checkAndMarkDiagnosed(studentId: string): Promise<boolean> {
  const statusResult: any[] = await prisma.$queryRaw`
    SELECT * FROM "diagnostic_status" WHERE "student_id" = ${studentId}::uuid
  `;
  if (statusResult[0]?.overall_complete) {
    await prisma.institute_students.update({
      where: { id: studentId }, data: { isDiagnosed: true },
    });
    return true;
  }
  return false;
}
```

> Completion is computed by the `diagnostic_status` **view**, not by counting in
> application code. One definition of "complete", consulted by the submit handler, the
> status endpoint and any reporting query alike.

Speaking uploads get a dedicated multer error translation so a too-large recording is a
clean, retryable 413 rather than a raw 500:

```ts
if (err instanceof multer.MulterError && err.code === 'LIMIT_FILE_SIZE') {
  return res.status(413).json({ error: 'file_too_large', can_retry: true,
    message: 'Recording too large (max 15 MB). Please re-record a shorter answer.' });
}
```

### The profile payload that drives all four gates

```ts
// GET /api/profile → userProfileController.getUserProfile
let instituteIsActive = true;   // default true for roles without an institute
if (user.role === 'INSTITUTE_OWNER' && user.institute_owners?.institutes)
  instituteIsActive = user.institute_owners.institutes.is_active;
else if (user.role === 'INSTITUTE_ADMIN' && user.institute_admins?.institutes)
  instituteIsActive = user.institute_admins.institutes.is_active;

const isEnrolled = user.role === 'STUDENT' ? !!user.institute_students : true;

let isDiagnosed = false, recommendationSeeded = false, targetBand = null;
if (user.role === 'STUDENT' && user.institute_students) {
  isDiagnosed          = user.institute_students.isDiagnosed;
  recommendationSeeded = user.institute_students.recommendationSeeded;
  targetBand           = user.institute_students.target_band;
}

// Strip the join rows — the client gets flat booleans, not the org graph.
delete (user as any).institute_owners;
delete (user as any).institute_admins;
delete (user as any).institute_students;
if (user.role !== 'INSTRUCTOR') delete (user as any).Instructor;

res.json({ user: { ...user, instituteIsActive, isDiagnosed, recommendationSeeded, targetBand, isEnrolled } });
```

Response shape:

```jsonc
{
  "user": {
    "id": "uuid", "email": "…", "name": "…", "countryCode": null, "phoneNo": null,
    "role": "STUDENT",
    "profileImage": null, "createdAt": "…", "updatedAt": "…",
    "instituteIsActive": true,     // drives RequireActiveInstitute
    "isEnrolled": true,            // GATE 1
    "isDiagnosed": false,          // GATE 2 / GATE 4
    "targetBand": null,            // GATE 3
    "recommendationSeeded": false  // downstream: study-plan generation
  }
}
```

> **The pattern to copy:** one endpoint returns a **flat set of booleans** that encode
> onboarding position. The client never reconstructs state by joining tables or chaining
> requests; it reads four flags and picks a route. Adding a gate means adding one boolean
> here and one branch in `LoginRedirect` — plus one middleware if it must actually be
> enforced.

---

## 16. Database schema reference

### `User` — the application identity

```prisma
model User {
  id             String       @id @default(dbgenerated("uuid_generate_v4()")) @db.Uuid
  supabaseuserid String       @unique @db.VarChar(255)   // ⇄ auth.users.id, or `pending-*`
  email          String       @unique @db.VarChar(255)
  createdAt      DateTime     @default(now())            @db.Timestamptz(6)
  updatedAt      DateTime     @default(now())            @db.Timestamptz(6)
  name           String?      @db.VarChar(255)
  countryCode    String?      @db.VarChar(5)
  phoneNo        String?      @db.VarChar(20)
  role           UserRoleType @default(STUDENT)          // ← source of truth for RBAC
  profileImage   String?

  institute_admins      institute_admins?       // at most one — @unique on user_id
  institute_instructors institute_instructors?
  institute_owners      institute_owners?
  institute_students    institute_students?
  institutes            institutes[]            // institutes this user created
  // … domain relations omitted

  @@index([email])
}
```

Note there is **no password column** — Supabase owns credentials entirely.

### `institutes` — the tenant

```prisma
model institutes {
  id         String   @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  name       String   @db.VarChar(255)
  address    String?
  logo_url   String?
  is_active  Boolean  @default(true)          // ← the deactivation kill-switch
  created_by String?  @db.Uuid                // the SUPERADMIN who created it
  created_at DateTime @default(now()) @db.Timestamptz(6)
  updated_at DateTime @default(now()) @db.Timestamptz(6)

  institute_admins      institute_admins[]
  institute_instructors institute_instructors[]
  institute_owners      institute_owners[]
  institute_students    institute_students[]
  ielts_batches         ielts_batches[]

  @@index([is_active], map: "idx_institutes_is_active")
}
```

### The four membership tables

All share the same shape: a globally-`@unique` `user_id`, an indexed `institute_id`, and
`onDelete: Cascade` from the institute.

```prisma
model institute_owners {
  id           String     @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  user_id      String     @unique @db.Uuid
  institute_id String     @db.Uuid
  created_at   DateTime   @default(now()) @db.Timestamptz(6)
  institutes   institutes @relation(fields: [institute_id], references: [id], onDelete: Cascade)
  User         User       @relation(fields: [user_id],      references: [id], onDelete: Cascade)
  @@index([institute_id], map: "idx_institute_owners_institute")
}

model institute_admins { /* identical shape */ }

model institute_instructors {
  // identical, plus:
  bio            String?
  specialization String?  @db.VarChar(255)
  updated_at     DateTime @default(now()) @db.Timestamptz(6)
}
```

### `institute_students` — membership **and** onboarding state

```prisma
model institute_students {
  id                   String    @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  user_id              String    @unique @db.Uuid      // one institute per student, globally
  institute_id         String    @db.Uuid
  enrollment_date      DateTime  @default(dbgenerated("CURRENT_DATE")) @db.Date
  is_active            Boolean   @default(true)
  created_at           DateTime  @default(now()) @db.Timestamptz(6)
  updated_at           DateTime  @default(now()) @db.Timestamptz(6)

  // ── Onboarding / progress state ────────────────────────────────────────────
  isDiagnosed          Boolean   @default(false)   // GATE 4 — set when all 4 skills scored
  recommendationSeeded Boolean   @default(false)   // study plan generated
  target_band          Float?                      // GATE 3 — 4.0–9.0, 0.5 steps
  momentum_score       Int       @default(0)
  daily_streak         Int       @default(0)
  last_streak_date     DateTime? @db.Date
  extra_drill_credits  Int       @default(0)
  exam_date            DateTime? @db.Date

  @@index([is_active],    map: "idx_institute_students_active")
  @@index([institute_id], map: "idx_institute_students_institute")
}
```

> **Design choice to note:** onboarding state lives on the **membership** row, not on
> `User`. A student's diagnostic result belongs to their enrollment at a specific
> institute, not to their global identity. If you support re-enrollment elsewhere, this is
> the shape that makes it coherent.

### Batches

```prisma
model ielts_batches {
  id           String   @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  institute_id String   @db.Uuid
  name         String   @db.VarChar(255)
  description  String?
  status       String   @default("ACTIVE") @db.VarChar(20)
  max_students Int?                                    // capacity, enforced on assignment
  created_by   String?  @db.Uuid
  // …
}

model ielts_batch_students    { batch_id + user_id, @@unique([batch_id, user_id]) }
model ielts_batch_instructors { batch_id + user_id, @@unique([batch_id, user_id]) }
```

A user may be on **many** batches within their institute — the `@@unique` is composite
here, unlike the membership tables.

---

## 17. API reference — every auth/onboarding endpoint

All routes require `Authorization: Bearer <supabase-jwt>` unless marked public.

### Profile — `/api/profile` · `requireAuth` + `ensureUser`

| Method | Path | Roles | Body | Notes |
|---|---|---|---|---|
| `GET` | `/api/profile` | any | — | The onboarding-state payload (§15). |
| `PUT` | `/api/profile` | any | `{ name?, countryCode?, phoneNo?, targetBand?, examDate? }` | Band 4.0–9.0 snapped to 0.5; exam date must be future-dated. |
| `PUT` | `/api/profile/image` | any | `multipart` `profileImage` | 5 MB max, images only (multer `fileFilter`), stored on Cloudinary. |
| `DELETE` | `/api/profile/image` | any | — | |

### Super admin — `/api/superadmin` · `authorize(SUPERADMIN)` on the whole router

| Method | Path | Body | Notes |
|---|---|---|---|
| `GET` | `/users` | `?role=&search=&page=1&limit=50` | Paginated (limit capped at 100); resolves each user's institute across all four membership tables. |
| `GET` | `/institutes` | `?search=` | Includes owner + student/instructor counts. |
| `POST` | `/institutes` | `{ instituteName, address?, ownerName, ownerEmail }` | **Creates institute + invites owner.** `409` if the email belongs to a non-owner. Returns `inviteEmailSent`. |
| `PATCH` | `/institutes/:id` | `{ name?, address?, logoUrl? }` | |
| `PATCH` | `/institutes/:id/status` | `{ isActive: boolean }` | The deactivation kill-switch (§12). |

### Institute owner — `/api/institute-owner`

| Method | Path | Roles | Body |
|---|---|---|---|
| `GET` | `/admins` | `OWNER` | — |
| `POST` | `/admins` | `OWNER` | `{ adminName, adminEmail }` → invite |
| `DELETE` | `/admins/:userId` | `OWNER` | — (demotes to `STUDENT`) |
| `GET` | `/summary`, `/batches`, `/students`, `/instructors`, `/at-risk`, `/assessment-overview` | `OWNER`+`ADMIN` | read-only |
| `GET` | `/analytics/*` | `OWNER`+`ADMIN` | cohort-progress, batch-comparison, instructor-effectiveness, engagement-trends, goal-achievement, subskill-heatmap |

### Institute admin — `/api/institute-admin` · all routes `authorize(INSTITUTE_ADMIN, INSTITUTE_OWNER)`

| Method | Path | Body | Notes |
|---|---|---|---|
| `GET` | `/students` | — | |
| `GET` | `/students-overview` | — | Rich table (band / trend / streak / momentum / at-risk). |
| `POST` | `/students` | `{ studentName, studentEmail }` | Invite + enroll. `409` on role clash or cross-institute enrollment. |
| `DELETE` | `/students/:userId` | — | |
| `PATCH` | `/students/:userId/status` | `{ isActive }` | |
| `POST` | `/students/:userId/resend-invite` | — | Re-runs `sendInvite`; returns `{ emailSent }`. |
| `GET` | `/tutors` | — | |
| `POST` | `/tutors` | `{ tutorName, tutorEmail, specialization? }` | Invite + link. |
| `DELETE` | `/tutors/:userId` | — | Demotes to `STUDENT`. |
| `GET`/`POST` | `/batches` | `{ name, description?, maxStudents? }` | |
| `GET`/`PATCH`/`DELETE` | `/batches/:id` | | |
| `POST`/`DELETE` | `/batches/:id/instructors[/:userId]` | `{ userId }` | |
| `POST`/`DELETE` | `/batches/:id/students[/:userId]` | `{ userId }` | Capacity enforced. |
| `GET`/`PATCH` | `/institute` | `{ name?, address?, logoUrl? }` | Settings page. |
| `GET` | `/onboarding-status` | — | The drop-off panel (§14). |
| `GET`/`POST` | `/notifications`, `/notifications/read`, `/notifications/:id/dismiss` | | |

### Diagnostic — `/api/diagnostic` · `requireAuth` + `ensureUser`

| Method | Path | Notes |
|---|---|---|
| `GET` | `/status` | Per-skill scored flags + `overall_complete`. |
| `GET` | `/questions/:skill` | Random set at the level derived from `target_band`. |
| `POST` | `/submit/:skill` | JSON — listening / reading / writing. One-time per skill. |
| `POST` | `/submit/speaking` | `multipart/form-data` `audio`, 15 MB cap → `413 file_too_large`. |

### Gated routes

`/api/ia` and `/api/mock` additionally require `requireDiagnosed`; failing it returns
`403 { error: 'diagnostic_required' }`.

### Supabase-side operations (no backend route)

| Operation | Called from | Method |
|---|---|---|
| Login | `LoginPage` | `supabase.auth.signInWithPassword` |
| Request reset | `LoginPage` | `supabase.auth.resetPasswordForEmail` |
| Set/update password | `AuthCallbackPage`, `ResetPasswordPage` | `supabase.auth.updateUser({ password })` |
| Establish session from link | `AuthCallbackPage` | `supabase.auth.setSession` |
| Logout | `useAuth` | `supabase.auth.signOut` |
| Mint invite/recovery link | backend `sendInvite` | `supabaseAdmin.auth.admin.generateLink` |

---

## 18. Environment variables

### Backend (`backend-study-mentor/.env`)

| Variable | Purpose | Required for auth |
|---|---|---|
| `SUPABASE_URL` | Supabase project URL | ✅ |
| `SUPABASE_SERVICE_ROLE_KEY` | Admin key for `generateLink` — **server only, never ship to the browser** | ✅ |
| `SUPABASE_JWT_SECRET` | Shared secret for local `jwt.verify` | ✅ |
| `FRONTEND_URL` | Fallback base for the invite redirect. **Must differ per environment.** | ✅ |
| `ALLOWED_ORIGINS` | Comma-separated. CORS **and** invite-redirect allow-list. | ✅ |
| `RESEND_API_KEY` | Transactional email | ✅ |
| `MAIL_FROM` | e.g. `TestCrack <auth@mail.testcrack.com>` — verified domain | ✅ |
| `PORT` | default `4000` | |
| `NODE_ENV` | | |
| `DATABASE_URL` | Prisma connection string | ✅ |
| `CLOUDINARY_CLOUD_NAME` / `_API_KEY` / `_API_SECRET` | Profile images | |
| `GEMINI_API_KEY`, `GEMINI_MODEL` | AI assessment | |
| `LEXIGRID_SESSION_SECRET`, `WS_PORT`, `YT_*` | Other features | |

From `.env.example`:

```bash
NODE_ENV = 'production'
PORT = 4000
SUPABASE_URL = 'https://your-project.supabase.co'
SUPABASE_SERVICE_ROLE_KEY = 'your_service_role_key_here'
SUPABASE_JWT_SECRET = 'your_jwt_secret_here'

# Public URL of the frontend. Used as fallback for invite redirect when the request
# origin is not in ALLOWED_ORIGINS (e.g. server-to-server calls).
# MUST differ per environment: https://testcrack.com for main, https://dev.testcrack.com for dev.
FRONTEND_URL = 'http://localhost:8080'

# Comma-separated list of allowed frontend origins (CORS + invite redirect validation).
# Invite links automatically resolve to whichever origin triggered the invite,
# so dev.testcrack.com invites redirect to dev.testcrack.com, not the main site.
ALLOWED_ORIGINS = 'http://localhost:8080,https://testcrack.com,https://www.testcrack.com,https://dev.testcrack.com'

# Resend (transactional email — invites are minted server-side and sent via Resend)
RESEND_API_KEY = 'your_resend_api_key_here'
MAIL_FROM = 'TestCrack <auth@mail.testcrack.com>'
```

### Frontend (`ai-study-mentor/.env`)

| Variable | Purpose |
|---|---|
| `VITE_SUPABASE_URL` | Supabase project URL |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | Anon/publishable key — used by `src/integrations/supabase/client.ts` (**the active client**) |
| `VITE_SUPABASE_ANON_KEY` | Used by the legacy `src/shared/services/supabase.ts` — consolidate |
| `VITE_BACKEND_URL` | Express base URL (default `http://localhost:4000`) |
| `VITE_API_URL`, `VITE_API_BASE_URL` | Legacy aliases — consolidate |
| `VITE_WS_URL` | WebSocket endpoint |
| `VITE_RAZORPAY_KEY_ID`, `VITE_STRIPE_PUBLIC_KEY` | Payments |

> Anything prefixed `VITE_` is **embedded in the client bundle and publicly readable**.
> Only the anon/publishable key belongs there. The service-role key never does.

### Supabase dashboard configuration (not in any `.env`)

Easy to forget when standing up a new environment:

1. **Authentication → URL Configuration → Redirect URLs** — every origin's
   `/auth/callback` and `/reset-password`. Missing entries make invite and reset links
   bounce.
2. **Authentication → Providers → Email** — enable email/password; decide whether new
   users require confirmation.
3. **Authentication → Policies** — password minimum length (make it match your app code, §9).
4. **Email templates** — the built-in ones still send the *password-reset* mail (§9); invites
   go through Resend.
5. **DNS** — SPF/DKIM for the `MAIL_FROM` domain, verified in Resend.

---

## 19. Security model, rules and known gaps

### Rules the implementation enforces

| Rule | Where |
|---|---|
| Passwords are never seen, stored or hashed by us | Supabase Auth |
| JWTs verified locally, no per-request network hop | `requireAuth` |
| **Role read from DB on every request, never from the token** | `ensureUser` |
| Unverified emails cannot sign in, even with a valid session | `LoginPage`, `useAuth` |
| Invite redirects restricted to an allow-list of `https://` origins | `sendInvite.inviteRedirect` |
| Tokens scrubbed from the URL as soon as a session exists | `AuthCallbackPage` |
| Service-role key is server-side only | `lib/supabase.ts` |
| Every UI gate has a server-side counterpart | `requireDiagnosed` |
| Cross-institute enrollment impossible | DB `@unique` + `P2002` handling |
| Multi-row writes are transactional | `addStudent`, `addTutor` |
| Any 401 forces a full client-side logout | `auth:unauthorized` event |
| Removal demotes rather than deletes | `removeAdmin`, `removeTutor` |
| Diagnostic sections cannot be rewritten | `isSkillAlreadyScored` |

### Gaps to close when adapting

These are real findings from reading the current code. Fix them in your implementation.

1. **The request logger prints secrets.** `index.ts` logs full headers and bodies on every
   request, so every JWT — and any password in a body — lands in the logs. Redact
   `authorization` and password-like fields, or drop body logging in production.
   *Highest-priority item on this list.*
2. **Inconsistent password minimums** (8 / 6 / 6 across three files, §9). Pick one, set it
   in Supabase, mirror it everywhere. `12345678` currently passes.
3. **No rate limiting anywhere.** Login, password-reset requests and the invite endpoints
   are all unthrottled. Add `express-rate-limit` per-IP and per-account; reset-request and
   invite endpoints especially, since both send email.
4. **Orphaned public-signup page.** Delete `AuthPage.tsx` (§4) rather than leaving it
   route-detached.
5. **The B2C path has no authentication at all** (§4). It is a prototype; gate it behind a
   build flag or remove it before production.
6. **403 responses enumerate the permission model** (§11). Trim in production.
7. **`!origin → allow` in CORS** (§11). Tighten if no non-browser clients need access.
8. **No audit log for role changes.** A privilege escalation leaves no trace. Add an audit
   table written on every `role` update.
9. **Two Supabase clients, two env var names** for the same key (§18). Consolidate.
10. **Password reset uses Supabase's generic email** while invites are branded (§9).
    Unify if brand consistency matters.
11. **`createInstitute` is not transactional** — unlike `addStudent`/`addTutor`, its four
    writes can partially fail, leaving an invited owner with no institute. Wrap it in
    `prisma.$transaction`.
12. **Invite email interpolates `name`/`institute` into HTML unescaped** (§6). Escape if
    those values ever come from a less-trusted source.

---

## 20. Replication guide — adapt this to your project

A build order that works, with the decisions that matter called out at each step.

### Step 1 — Decide the identity split

Answer three questions before writing code:

1. **Who owns credentials?** A managed provider (Supabase / Auth0 / Clerk / Cognito) or
   you? TestCrack chose managed, and it removed password hashing, reset-token expiry,
   session refresh and email verification from the codebase entirely. **Recommended.**
2. **Where does role live?** In the provider's metadata, or in your database? TestCrack
   chose the database. Metadata roles are baked into a token and go stale until refresh;
   a DB role takes effect on the next request. **Put role in your database.**
3. **Self-serve or invite-only?** This decides whether "signup" exists at all. For B2B/
   multi-tenant, invite-only is almost always right — and much smaller to build.

### Step 2 — Schema

```
users                       ← id, provider_user_id (unique), email (unique), role, name
tenants                     ← id, name, is_active, created_by
tenant_owners               ← user_id (UNIQUE), tenant_id
tenant_admins               ← user_id (UNIQUE), tenant_id
tenant_members              ← user_id (UNIQUE), tenant_id, + onboarding state columns
```

- Put **onboarding state on the membership row**, not on `users`.
- Use a **global `UNIQUE` on `user_id`** in membership tables to make cross-tenant
  membership structurally impossible.
- `is_active` on the tenant gives you a kill-switch for free.

### Step 3 — The three middlewares

Build them in this order and compose them at the router level:

```
requireAuth   → verify token, attach provider user id + email + metadata
ensureUser    → find-or-create your user row (try provider id, then EMAIL, then create),
                attach your internal id and the role read fresh from the DB
authorize(…)  → compare that role against the route's allow-list
```

Do not skip the **email-linking** branch in `ensureUser` — it is what lets an
invite-created row adopt the auth identity later.

### Step 4 — The invite pipeline

```
admin submits { name, email }
  → guard: existing user? role clash? already a member elsewhere?
  → provider.generateLink({ type: 'invite', redirectTo: <allow-listed>/auth/callback })
      ↳ on "already exists" → generateLink({ type: 'recovery' }) instead
  → send YOUR branded, role-specific email with that link
  → transaction { upsert user row (role set); create membership row }
  → return { inviteEmailSent: boolean }
```

Non-negotiables: validate `redirectTo` against an allow-list; make email failure
non-fatal but **reported**; wrap the writes in a transaction; translate unique-constraint
violations to `409`.

### Step 5 — The callback page

One route, `/auth/callback`, that:
1. guards against double execution (`useRef`),
2. reads the hash, calls `setSession`,
3. **strips the tokens from the URL**,
4. branches on `type`: `invite` → force set-password; `recovery` → reset page; else → home,
5. on failure, shows a *recovery path* ("ask your admin to resend"), not a dead end.

### Step 6 — Login and the redirect hub

Keep **one** component that maps role → home, and make the login route conditional on
session presence so everything funnels through it. Resist per-page redirect logic; it
drifts within a month.

### Step 7 — Onboarding as flags

Expose one `GET /api/profile` returning flat booleans (`isEnrolled`, `isOnboarded`,
`hasGoal`, …). Order the gates in your redirect hub. **For every gate, add the matching
server-side middleware** — the UI guard is UX, the middleware is the rule.

### Step 8 — Bootstrap the first admin

Write an idempotent, manually-run script (`npx tsx prisma/seedSuperadmin.ts`) reading a
`BOOTSTRAP_SUPERADMIN_EMAIL` env var. Never expose it over HTTP. Log the promotion.

### Step 9 — Email

Use a dedicated transactional provider (Resend / Postmark / SES) with a **verified
subdomain**. Role-specific templates, inline styles, table layout, a copy-paste fallback
link, and an explicit check of the provider's error return value.

### Step 10 — Close the gaps in §19 before you ship

Especially: redact the request logger, unify the password policy, and add rate limiting to
every endpoint that sends an email or checks a credential.

### The five ideas most worth carrying over

1. **Token proves identity; database decides permission.** Role read fresh per request.
2. **Email is the bridge** between a provider identity and a pre-created application row.
3. **Every UI gate needs a server-side twin.** Assume the client is hostile.
4. **Invite failure is a state, not an exception.** Surface `emailSent: false` and give
   admins a resend button.
5. **Onboarding dashboards should measure drop-off, not approvals.** Show who stalled, and
   put the fix next to the name.

---

*This document describes the implementation as of the `claude/gallant-keller-88j0ob`
branch of both repositories. Where behaviour is inconsistent or incomplete in the current
code, that is stated plainly rather than smoothed over — an adapter needs the real shape,
including its rough edges.*
