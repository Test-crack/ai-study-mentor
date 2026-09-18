# TestCrack — Infrastructure & Architecture Overview

**Audience:** Engineering team  
**Last updated:** July 27, 2026  
**Status:** Verified against actual codebase and CI/CD files — not generated from assumptions.

---

## 1. High-Level Architecture

Everything runs on a single VPS (Hostinger, Mumbai region — `72.60.221.118`, Ubuntu 24.04 LTS). There is no separate staging server — staging and production run side-by-side on the same machine, differentiated by directory, PM2 process name, port, and database.

| Domain | Purpose | Served by |
|---|---|---|
| `testcrack.com` | Production frontend | NGINX → static files from `/var/www/testcrack/frontend-main/dist` |
| `dev.testcrack.com` | Staging frontend | NGINX → static files from `/var/www/testcrack/frontend-dev/dist` |
| `api.testcrack.com` | Production backend API | NGINX → reverse proxy → PM2 `backend-main` on `localhost:4000` |
| `dev-api.testcrack.com` | Staging backend API | NGINX → reverse proxy → PM2 `backend-dev` on `localhost:4001` |

**Stack (verified from `package.json` and codebase):**
- **Backend:** Node.js 20.11.1, TypeScript, Express 5.1.0, Prisma ORM 5.22.0, PostgreSQL 16, PM2
- **Frontend:** React 18.3.1, Vite, TailwindCSS, Radix UI, React Router v6, TanStack Query v5, Framer Motion
- **Infrastructure:** NGINX reverse proxy / static server, Let's Encrypt SSL (auto-renewing), GitHub Actions CI/CD

**Repos:**
- Frontend: `ai-study-mentor` (GitHub: `puobyt/ai-study-mentor`)
- Backend: `backend-study-mentor`

**VPS directory layout:**
```
/var/www/testcrack/
├── backend-main/          (git: main branch)
├── backend-dev/           (git: dev branch)
├── frontend-main/         (git: main branch)
├── frontend-dev/          (git: dev branch)
└── ecosystem.config.js    (PM2 config — both backend processes)
```

---

## 2. Branch → Environment Mapping

Both repos follow the same convention:

| Branch | Environment | Auto-deployed by CI? |
|---|---|---|
| `main` | Production (`testcrack.com` / `api.testcrack.com`) | Yes — on push to `main` |
| `dev` | Staging (`dev.testcrack.com` / `dev-api.testcrack.com`) | Yes — on push to `dev` |
| `feature/*`, `mock/*`, etc. | No environment | No — must be merged to `dev` first |

Both repos have a large number of stale feature branches (`feature/drill`, `feature/ielts-flow`, `feature/momentum`, etc.). These are development artifacts and are not deployed anywhere.

**Current active feature branch:** `mock/timer` — per-section mock test timers (both repos). Must be merged to `dev` before it deploys to staging.

---

## 3. CI/CD Pipeline (verified from `.github/workflows/deploy.yml`)

Both repos use identical pipeline structure:

### Frontend pipeline
1. **Build job** (GitHub runner): `npm ci` → `npm run build`
2. **Deploy job** (SSH into VPS): `git fetch` + `git reset --hard origin/<branch>` → `npm ci` → `npm run build -- --outDir dist-new` → verify `dist-new/index.html` exists → `mv dist dist-previous` → `mv dist-new dist`

The **atomic swap** prevents a half-deployed state — the old build is never removed until the new one is confirmed complete. `dist-previous` is kept for instant rollback.

### Backend pipeline
1. **Build job** (GitHub runner): `npm ci` → `npm run build`
2. **Deploy job** (SSH into VPS): `git fetch` + `git reset --hard origin/<branch>` → `npm ci` → `npm run build` → `pm2 restart backend-main` or `backend-dev`

### ⚠️ What CI/CD does NOT do (important gaps)
- **No `prisma db push`** — schema migrations are never applied automatically. The pipeline only rebuilds the app code. If you push a schema change, you must manually run `prisma db push` on the VPS against the target DB or the deployed app will have mismatched schema.
- **No `prisma generate`** — the pipeline runs `npm run build` which compiles TypeScript but relies on the committed `node_modules/@prisma/client` already being in sync. Locally you run `prisma generate`; on the VPS this happens via `npm ci` + the postinstall hook if configured, or manually.
- **No test gate** — no automated tests exist in either repo. `package.json` has `"test": "echo \"Error: no test specified\" && exit 1"`. CI only verifies the TypeScript build succeeds.
- **No backend rollback** — unlike the frontend's `dist-previous` swap, there is no built-in rollback for the backend. Manual recovery: SSH in, `git reset --hard <last-good-sha>`, `npm ci && npm run build && pm2 restart`.

---

## 4. Environment Variables

### Backend (`.env` on VPS per environment)

| Variable | `backend-main` | `backend-dev` |
|---|---|---|
| `PORT` | `4000` | `4001` |
| `DATABASE_URL` | points to `testcrack_db_main` | points to `testcrack_db_dev` |
| All other keys (AI, email, etc.) | ⚠️ Same credentials assumed — see Section 6 | ⚠️ Same credentials assumed |

### Frontend (`.env` baked in at build time by Vite)

| Variable | `frontend-main` | `frontend-dev` |
|---|---|---|
| `VITE_BACKEND_URL` | `https://api.testcrack.com` | `https://dev-api.testcrack.com` |
| `VITE_WS_URL` | `wss://api.testcrack.com` | `wss://dev-api.testcrack.com` |
| `VITE_SUPABASE_*` | ⚠️ **Identical on both** | ⚠️ **Identical on both** — same prod Supabase project |
| `VITE_RAZORPAY_KEY_ID` | Unverified (should be live key) | Likely `rzp_test_...` |

**Important:** Vite bakes `VITE_*` variables into the compiled JS bundle at build time. Editing `.env` after a build does nothing to the running site — a full rebuild is required. This has caused at least one live bug (wrong `VITE_BACKEND_URL` shipped in a stale build).

### CORS (verified from `src/index.ts`)

The backend `allowedOrigins` array **explicitly includes both origins in the same codebase**:
```ts
const allowedOrigins = [
  'https://testcrack.com',
  'https://dev.testcrack.com',
  'https://www.testcrack.com',
];
```

This means `backend-main` (prod) will accept requests from `dev.testcrack.com` — intentional, as the origin list is shared code. This is a deliberate tradeoff. Consequence: a misconfigured dev frontend pointing at `api.testcrack.com` would not be blocked by CORS (it would be blocked by having the wrong `VITE_BACKEND_URL`, which is env-driven).

---

## 5. Database

### Separation
`testcrack_db_main` and `testcrack_db_dev` are separate PostgreSQL 16 databases on the same VPS instance. Each backend's `DATABASE_URL` points to only one — they cannot cross-write at the application level.

### Credentials
Both databases are accessed via the **same PostgreSQL role** (`testcrack_admin`). A leaked dev `.env` would expose the password that also grants access to `testcrack_db_main`. This was an intentional simplification for the pilot phase. Fix before scaling: create `testcrack_main_admin` / `testcrack_dev_admin` with distinct passwords.

### Schema management
No Prisma migrate workflow — schema is managed via `prisma db push` (direct sync, no migration history). Applied manually per-environment, deliberately not part of CI/CD:

```
1. Edit prisma/schema.prisma locally
2. npx prisma db push  (against dev DB, verify)
3. Push code → CI/CD deploys app code
4. SSH into VPS → backend-dev: npx prisma db push  (dev DB)
5. After smoke test → backend-main: npx prisma db push  (prod DB)
```

### Current schema — tables relevant to active features

The schema currently defines (among others):
- `mocksessions` — one row per mock test attempt per student
- `mock_section_attempts` — **new (mock/timer feature, not yet pushed to dev DB)** — one row per section per session; tracks per-section timer, status, answers, and scores
- `mock_section_status` PostgreSQL enum — `NOT_STARTED | IN_PROGRESS | SUBMITTED | EXPIRED`

**⚠️ Pending before merging `mock/timer` to `dev`:** run `prisma db push` against `testcrack_db_dev` to create the new table and enum. Without this the app will crash on any mock-related request.

---

## 6. Third-Party Services (verified from `package.json`)

| Service | Package | Purpose | Dev/prod isolated? |
|---|---|---|---|
| Supabase | `@supabase/supabase-js` (both repos) | Auth and/or storage — exact usage needs confirming | ❌ **No — same project on both environments** (highest priority gap) |
| Razorpay | `razorpay` (backend) + frontend env key | Payments | ⚠️ Likely test key on dev, live on prod — not confirmed |
| Stripe | `@stripe/stripe-js` (frontend only) | Payments (appears to coexist with Razorpay) | ⚠️ Unconfirmed |
| Google Cloud Speech | `@google-cloud/speech` | Speech-to-text for speaking assessments | ⚠️ Likely shared key |
| Google Generative AI | `@google/genai` + `@google/generative-ai` (both present — migration in progress) | AI grading, feedback generation | ⚠️ Likely shared key |
| OpenAI | `openai` | AI features | ⚠️ Likely shared key |
| Resend | `resend` | Transactional email (invites, notifications) | ⚠️ Unconfirmed |
| Cloudinary | `cloudinary` | Media/asset storage | ⚠️ Unconfirmed |
| Tesseract.js | `tesseract.js` | OCR — local, bundled `eng.traineddata` asset, no external account | ✅ N/A |

**Note on Google AI packages:** Both `@google/generative-ai` (old) and `@google/genai` (new SDK) are present in the backend. This indicates an in-progress migration between SDK versions — worth consolidating to one before they diverge in behavior.

---

## 7. Rollback Procedures

### Frontend (both environments)
```bash
cd /var/www/testcrack/frontend-main   # or frontend-dev
rm -rf dist
mv dist-previous dist
# NGINX immediately serves the previous build — no process restart needed
```
Instant, no downtime. The `dist-previous` directory is always kept after each deploy.

### Backend
No automated rollback. Manual process:
```bash
cd /var/www/testcrack/backend-main   # or backend-dev
git log --oneline -5                  # find last-good SHA
git reset --hard <sha>
npm ci && npm run build
pm2 restart backend-main              # or backend-dev
```
**Schema caveat:** if the rollback crosses a `prisma db push` boundary, the DB schema may be ahead of the code. Prisma will error on fields/tables the old code doesn't know about. Currently this is handled by: don't push to DB until after app code is confirmed working on dev.

---

## 8. Deploying a Feature Branch to Staging — Checklist

For the current `mock/timer` branch (and any future feature with DB schema changes):

```
[ ] 1. Abort or resolve any in-progress git revert on the frontend repo
[ ] 2. Commit all changes on mock/timer (both repos)
[ ] 3. Merge mock/timer → dev (both repos)
[ ] 4. Push dev → triggers CI/CD automatically
[ ] 5. Wait for CI build to pass on GitHub Actions
[ ] 6. SSH into VPS: cd /var/www/testcrack/backend-dev
[ ] 7. npx prisma db push  ← REQUIRED for mock/timer (creates mock_section_attempts + enum)
[ ] 8. pm2 restart backend-dev  ← only if prisma generate wasn't part of the deploy
[ ] 9. Smoke test on dev.testcrack.com
```

---

## 9. Open Risks — Priority Order

| Priority | Risk | Status |
|---|---|---|
| 🔴 | **Supabase shared between dev and prod** — staging auth/storage operations touch production data | Open |
| 🟠 | **All third-party API keys likely shared** (Google AI, OpenAI, Resend, Cloudinary) — staging traffic hits prod quotas and accounts | Open |
| 🟠 | **Single PostgreSQL role for both DBs** — leaked dev `.env` can reach prod DB | Open |
| 🟠 | **Backend has no rollback procedure** — unlike frontend's `dist-previous` swap | Open |
| 🟡 | **Schema migrations not part of CI/CD** — easy to forget `prisma db push` after a schema-changing deploy | Open — mitigate with checklist above |
| 🟡 | **Both Razorpay and Stripe SDKs present** — unclear which is active, both may be configured | Needs audit |
| 🟡 | **Two Google AI SDK versions coexist** (`@google/generative-ai` + `@google/genai`) | Consolidate |
| 🟡 | **`dev.testcrack.com` is publicly reachable** — no auth or IP restriction | Open |
| 🟡 | **Root SSH login still enabled on VPS** | Deferred from setup |
| 🟢 | **No automated tests** — CI only verifies TypeScript build succeeds | Open |
| 🟢 | **Question bank seeding is ad-hoc SQL** — not idempotent, risk of duplicates | Open |
