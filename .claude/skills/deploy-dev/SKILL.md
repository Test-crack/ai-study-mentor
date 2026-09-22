---
name: deploy-dev
description: Deploy feature work to the LIVE dev site safely. Use when the user says to deploy, ship, release, "push to dev", or promote a branch — for the frontend repo, the backend repo, or both. Encodes the backward-compatible-schema rule, the DB-target check, the typecheck+build gate, branch discipline, verification, and safe rollback.
disable-model-invocation: true
---

# Deploy to dev (LIVE)

`dev` is the public site with real users. Pushing `dev` triggers an automatic deploy on
both repos (GitHub Actions → VPS). This skill is the safe path from a feature branch to a
live deploy.

## Setup — fill once (env-specific, not in the repo)

- **Live dev frontend URL:** `<FILL ONCE>`
- **Live dev backend base URL:** `<FILL ONCE>` (its `/health` should return `{"status":"ok"}`)

These are set at the host, not in `.env` (local `.env` only has `http://localhost:4000`). Fill
them here the first time this skill runs; never leave it as "confirm mid-deploy."

## Golden rules (never violate)

- **This skill NEVER pushes `main`.** `main` also auto-deploys (production). Promotion to
  `main` is a separate, manual, explicitly-requested process — "release/ship this" means
  `dev` unless the user names `main`. (settings.json also *denies* `git push origin main`.)
- Feature work lives on a **branch**, never committed straight to `dev`/`main`.
- **Confirm with the user exactly what commits are being deployed** before pushing `dev`.
- **On ANY DB "may cause data loss" / `DROP` / destructive `ALTER` prompt: STOP and paste
  the exact prompt to the user; wait for an explicit decision.** Never accept unattended.
- Commits: **NO `Co-Authored-By` line.** Conventional-commit style.

## Repos & where they deploy

Paths are relative so this stays portable. **Frontend root** = the repo this skill lives in.
**Backend root** = `../backend-study-mentor`.

- **Frontend** push `dev` → GH Actions → VPS `frontend-dev` (atomic swap; keeps ONE previous
  build in `dist-previous` for instant rollback). No `last-good` git tag.
- **Backend** push `dev` → GH Actions → VPS `backend-dev` (:4001). Success moves the
  **`last-good-dev`** git tag; failure does not. Has a **schema-drift gate** (see step 3).

Shell is **PowerShell** (primary); the Bash tool is available for POSIX one-liners.

## 0. Scope the deploy

Determine which repo(s) changed and exactly which commits ship. On the feature branch:
`git log --oneline dev..HEAD`, `git status`, `git diff --stat dev...HEAD`. State it back to
the user and get confirmation. If both repos changed with an API/contract dependency,
**deploy backend first**, verify, then frontend.

## 1. Merge onto dev LOCALLY (do not push yet)

Merge first, so the gates in step 2 test *what actually ships*, not the feature branch alone.
Sync before merging — merging then rebasing can mangle the merge commit:

```
git checkout dev
git status                      # MUST be clean — if not, STOP (don't autostash; investigate)
git pull --ff-only origin dev   # take teammates' commits first
git merge --no-ff <feature-branch>   # or cherry-pick the confirmed commits — LOCAL only
```

If the merge conflicts, resolve fully before continuing (nothing has shipped yet — good).

## 2. Pre-flight gates — run on the MERGED dev

**Frontend (if it changed), from the frontend root.** `vite build` transpiles but does NOT
typecheck (a type error deploys green then blank-screens), so run BOTH:

```
npx tsc --noEmit -p tsconfig.app.json      # types
npm run build                              # catches missing / wrong-case imports
```

- `npm run build` matters even though it doesn't typecheck: you develop on case-insensitive
  Windows, the VPS builds on case-sensitive Linux, so a wrong-case import (`./button` vs
  `./Button`) passes `tsc` locally but fails the Linux build — catch it here, before the live
  pipeline. (Adding `forceConsistentCasingInFileNames: true` to `tsconfig.app.json` catches it
  in `tsc` too — it's currently NOT set.)
- **Gate mechanically on 0 NEW errors in changed files** (the app has pre-existing errors —
  don't chase them, but don't let the count grow). PowerShell:

  ```powershell
  $changed = git diff --name-only dev...HEAD -- "*.ts" "*.tsx"
  $errs = npx tsc --noEmit -p tsconfig.app.json 2>&1 | Select-String "error TS"
  $mine = $errs | Where-Object { $p = ($_ -split '\(')[0]; $changed -contains $p }
  if ($mine) { $mine; "GATE FAIL" } else { "GATE PASS ($($errs.Count) pre-existing)" }
  ```
  Record the pre-existing count in the report so you can see if it's creeping up.

**Backend (if it changed), from the backend root:** `npx tsc --noEmit -p tsconfig.json` then
`npm run build`. Must compile clean (the CI build gate rejects it otherwise).

## 3. Schema changes — BACKEND only (if `schema.prisma` / an ALTER changed)

Two independent hazards; handle both, BEFORE the push.

**(a) Backward compatibility with the CURRENTLY DEPLOYED code.** The DB change is applied
*before* the new code goes live, so the still-running old backend hits the changed schema
during the deploy window. It MUST be safe for that old code:

- **OK in one deploy (expand):** add a nullable column, a table, an index, a column WITH a
  default.
- **NOT OK in one deploy:** rename, drop, change a column type, add NOT NULL without a
  default. → **STOP and propose the expand/contract split:** deploy 1 = expand + code that
  handles both shapes; deploy 2 (later) = contract.

**(b) The schema-drift gate.** The backend deploy fails on purpose if the code expects DB
changes the DB doesn't have. So apply the DB change **first, in the same window**, then push:

1. **Read `.claude/skills/db/SKILL.md` §0–§1 and follow it** to connect + confirm the target
   (it resolves the real URL from `.env` and masks the password — don't rely on
   `$env:DATABASE_URL`, nothing loads it into the shell). The dev DB is **`testcrack_db_dev`**;
   **`testcrack_db_main` is PRODUCTION** — a dev deploy's schema change must NEVER land there.
   If the resolved target isn't `testcrack_db_dev`, STOP.
2. Apply the change through the **`/db` write wall** (preview → STOP-and-paste → run):
   `npx prisma db push`, or a hand migration `psql … -f prisma/seeds/<file>.sql` using the
   `/db` harness's resolved `$DBURL`. **`db push` is manual here — NEVER in CI.**
3. Any data-loss prompt → STOP and paste to the user (the write wall enforces this).

## 4. Push

```
git push origin dev             # triggers the deploy
```

## 5. Verify the deploy landed

- **Backend:** watch the run (`gh run watch` / `gh run list -L 3`). Success moves
  `last-good-dev` (`git fetch --tags; git log -1 last-good-dev`); a failed deploy does not, so
  a moved tag is itself a green signal. Smoke the live backend base URL's `/health` →
  `{"status":"ok"}` (liveness only — it does NOT report the deployed SHA today; a worthwhile
  future hardening is to return the git SHA so you can prove your exact commit is live). Then
  exercise the endpoint you changed.
- **Frontend:** load the live dev site and exercise the changed screen; watch for a blank
  screen (an import/type error that slipped the gate).

## 6. Rollback (if the deploy is bad)

**Default — roll FORWARD or `git revert` (no history rewrite; safe on a shared live branch):**
```
git revert <bad-commit(s)>      # on dev
git push origin dev             # re-deploys the reverted state
```

⚠️ **If you applied a schema EXPAND this window, a code-only revert will trip the drift gate**
and fail the rollback deploy — the gate compares live-DB state to the code's `schema.prisma`,
and after an expand the DB now has *more* than the reverted code declares (diff → `DROP` →
gate fails). So when a schema change is involved, **prefer rolling forward** (fix + redeploy).
A true rollback then also requires deliberately reverting the DB (confirm with the user; never
guess a destructive reversal) — or temporarily relaxing the gate to tolerate additive drift.

**Backend fast path (last resort):** reset to the last good tag — confirm with the user first,
list the commits that will be discarded, ensure you're on `dev` with a clean tree:
```
git fetch origin --tags
git reset --hard last-good-dev
git push origin dev --force-with-lease
```
**Frontend has no git tag.** Its instant fix is the VPS atomic swap (SSH in, restore
`dist-previous`) — but that only holds ONE previous build (two bad deploys in a row leave
nothing to swap back to), and it does NOT change `dev`, so the next push by anyone redeploys
the bad commit. **Always follow a `dist-previous` swap with a `git revert` on `dev`.**

## 7. Report (always end with this)

```
DEPLOY REPORT
- Repos deployed:      frontend? backend? (which commits: <sha> <subject>)
- Schema change:       none | applied to testcrack_db_dev (expand/contract? backward-compat?)
- Gates:               fe tsc [pass/fail, N pre-existing] · fe build [pass/fail] · be tsc+build [pass/fail]
- Push:                dev @ <sha>
- Verify:              be /health [ok?] · endpoint smoke [?] · fe screen [?]
- Rollback ready:      last-good-dev @ <sha> (be) · dist-previous (fe, single slot)
```

---
_Harden this skill after each real deploy: if a step was missing, ambiguous, or a check
didn't catch something, tighten it here._
