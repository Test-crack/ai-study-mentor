# A4 — Exam config: view-only explorer + draft/export

**Decision (2026-08-23): scoring config stays FILE-SOURCED + code-reviewed.** We briefly built a
DB-backed read path + live edit API (A4.1/A4.2) and **reverted it** — editing scoring config from a
live UI is a production-safety risk (a validator-*passing* edit can still semantically break scoring
for real students; scoring belongs behind code review + deploy). The engine reads
`exam-engine-config.v2.json`, as before.

## What A4 is (shipped)
A SuperAdmin **read-only** config explorer:
- **View** each exam's config — components, scale ref, overall strategy, status — so the admin
  understands how an exam is shaped.
- **Draft & export** — copy/download the config JSON as a template to build a new exam, then hand it
  to a **developer** who reviews and commits it to the file. This is the "draft a config, pass it to
  the dev" flow, with the code-review gate intact.
- **No live config writes.** Backend endpoints are READ-only (`GET /api/superadmin/exams`,
  `GET /api/superadmin/exams/:id/config`).

## Why (the safety argument)
- `validateConfig` guarantees *structural* validity, not *semantic* safety — a passing edit can still
  drop a component, change a weight, or flip a strategy and silently mis-score real students.
- The DB-backed read path itself moved scoring's source of truth from a code-reviewed file to mutable
  DB state — the exact production-risk surface we want to avoid. So we kept the file as the source.

## Safe changes (declarative, non-scoring)
Truly safe fields (status/availability/label/legal text) don't affect scoring. Today they're managed
via the existing registry/subscription flows (A0). A tightly-scoped safe-field editor could be added
later, but it is deliberately **not** a general config editor.

## To add or change an exam
Draft in the explorer → hand JSON to a developer → developer reviews + edits
`exam-engine-config.v2.json` → deploy → the engine seeds/serves it. (See the onboarding matrix in
[TRACK-A-DASHBOARDS-PLAN.md](./TRACK-A-DASHBOARDS-PLAN.md) §4.)
