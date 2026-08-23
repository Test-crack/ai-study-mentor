# A4 — DB-backed exam config (SuperAdmin-editable)

Turns exam config from a repo file into DB-backed, SuperAdmin-editable data — the full
"exam is data" vision. Touches the engine's **read path**, so it's phased and zero-change-gated.

## The current gap
`loadExamEngine()` reads `exam-engine-config.v2.json`, caches it in memory, and best-effort
*seeds* `exam_configs`. The read path (`getExamConfig`) returns the **JSON cache** — the DB
table is written but never read. So UI edits to the DB do nothing until the read path changes.

## Target architecture
- **JSON = bootstrap seed + structural source.** Shared `scales` (incl. the scale-math and
  proficiency/weakness thresholds), `defaults`, and engine metadata stay JSON — engineering-owned,
  code-reviewed, validator-gated. (Editing scale *math* from a UI is out of scope; it's a
  correctness surface, per the guideline §9.)
- **DB = authoritative per-exam source.** Each exam's entry (`naming`, `status`, `legal`,
  `components`, `overall.components`, `target`, `remediation`) is loaded from the **active**
  `exam_configs` row. SuperAdmin edits create a new `config_version` (validated) and flip active.
- **Assembled config** = `{ ...json (scales/defaults/meta), exams: { ...json.exams, ...dbActiveExams } }`.
  On a fresh deploy (no edits yet) `dbActiveExams === json.exams` → **byte-identical** (zero-change).

## Reconciliation (JSON vs DB)
- **Bootstrap:** on boot, `seedExamConfigs(json)` upserts the JSON version if that
  `(exam_id, config_version)` isn't present (idempotent — never overwrites a newer edit).
- **Post-bootstrap:** the DB **active** row wins. A SuperAdmin edit is a new version marked active;
  the old one is deactivated but retained (provenance/history).
- A new JSON `config_version` on a later deploy seeds as a new version — promotion to active is a
  deliberate action (not automatic), so a deploy can't silently clobber a live edit.

## Phases (each verified, zero-change until proven)
- **A4.1 — read path from DB (this phase):** loader assembles the read cache from DB active
  per-exam configs merged over JSON scales/meta; JSON still seeds. **Zero-change** because the DB
  was just seeded from the JSON. Verify: vectors green (they read the JSON directly — unaffected)
  **+ a full IELTS dev journey producing identical scores reading config from the DB.**
- **A4.2 — save API + validation + reload:** `PUT /api/superadmin/exams/:id/config` → `validateConfig`
  on the assembled result → write new `config_version` (active) → reload the in-memory cache.
  Rejects any config that fails the 40+ validator rules before it can go live.
- **A4.3 — SuperAdmin config editor UI:** create an exam (registry + first config version); edit the
  declarative per-exam fields (label/status/availability/components/`overall.components`/target).
  Strategy choice + scale math shown read-only (engineering surface). Every save is validator-gated.

## Guard-rails
- `validateConfig` (40+ rules) gates **every** save; an invalid config can't be persisted/activated.
- `exam_configs` is versioned; a save bumps `config_version`, and result provenance keeps old
  results interpretable.
- Fail-loud on boot if the assembled config is invalid (a bad DB state must refuse to serve, not
  mis-score).
