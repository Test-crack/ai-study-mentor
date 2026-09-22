# ai-study-mentor — Claude working notes

Vite + React 18 + TypeScript, shadcn/ui + Tailwind, TanStack Query, react-router. The
"TestCrack" student/superadmin frontend. The backend is a separate repo at
`../backend-study-mentor` — most features are full-stack.

## The platform in one idea

Exam-agnostic platform: one UI renders **every** exam from backend config. **An exam is
data, not code** → render from the exam's config, never hardcode an exam. Full vision:
[../backend-study-mentor/docs/architecture/platform-vision.md](../backend-study-mentor/docs/architecture/platform-vision.md).

## Non-negotiable rails

- **`dev` auto-deploys to the public site on push.** Branch for feature work; merge only
  when told to deploy. If `dev` diverged: `git pull --rebase --autostash origin dev`.
- **Typecheck trap — the default checks NOTHING.** `tsc -p tsconfig.json` is
  references-only, and **`vite build` transpiles but does NOT typecheck** (a type error
  builds green → blank screen at runtime). The real check before pushing:

  ```
  npx tsc --noEmit -p tsconfig.app.json
  ```

  Gate on **0 errors in the files you changed** (pre-existing errors elsewhere aren't yours
  to chase).
- **Exam-agnostic rendering:** exam shape comes from `GET /api/exams` via
  `ExamConfigProvider` — **gate screens on `useExamConfigReady`** (the fallback config only
  knows `ielts`, so reading early makes every exam look like IELTS). Helpers: `resolveExam`,
  `formatScore`, `ScorePill`. **Never regress IELTS or Spoken English.** OET has no overall
  band — guard against placeholders like `"Overall"` / `"Loading..."`.

## Commands

- Dev: `npm run dev` · Build: `npm run build` (does not typecheck) · Lint: `npm run lint`
  · Test: `npm test` (vitest)
- Typecheck (the real one): `npx tsc --noEmit -p tsconfig.app.json`

## Conventions

- `origin` → `github.com/puobyt/ai-study-mentor`. File refs in chat use markdown
  `[file.tsx](src/file.tsx)`, not backticks.
