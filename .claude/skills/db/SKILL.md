---
name: db
description: Safe, read-only inspection of the live shared Postgres over the tunnel (localhost:5433). Use whenever you need to look at the DB — row counts, column shapes ("is correct_answer bare-letter or jsonb?"), "did the migration land?", confirming a seed took. Read-only by DEFAULT; any write/DDL/migration goes through a dry-run + STOP-and-paste approval wall. /seed-content and /verify-exam lean on this to connect safely.
---

# /db — live DB inspection (READ-ONLY by default)

`localhost:5433` is the **live shared Postgres** (real users' data), reached over an SSH tunnel to the VPS. **Two databases share that port** — always know which one you're on:

| DB name | What it is | Rule |
|---|---|---|
| `testcrack_db_dev` | Shared **dev** DB (the default) | Still live & shared with the team — read freely, write only through §4. |
| `testcrack_db_main` | **PRODUCTION** — real paying users | Reads: state it loudly first. **Writes: effectively forbidden** without an explicit, unmistakable go-ahead. |

## Golden rules (never violate)
1. **Read-only by default.** Every inspection query runs under `SET default_transaction_read_only = on` (§1). A stray write in that session *errors out* — that's the safety floor, not politeness.
2. **Never run a write / DDL directly** (`INSERT`/`UPDATE`/`DELETE`/`ALTER`/`DROP`/`TRUNCATE`/`CREATE`/`db push`). → the **Write Wall (§4)**: dry-run in a rolled-back transaction, then STOP and paste the exact SQL for the user to approve.
3. **Say which DB you're about to hit** (parse it from the URL) *before* running anything. Default dev. Never touch `main` on assumption.
4. **Never hardcode or print credentials.** Read `DATABASE_URL` from the backend `.env` at runtime; mask the password in anything you echo.
5. **Don't guess schema/data.** If unsure of a column or its type, inspect it (`\d+ table`) — assumptions about the live DB are how you corrupt it.

## 0. Connect (kills the "how do I even connect" friction)

The connection lives in the backend repo. Work from there:
```bash
cd e:/FreeLance/edtech/backend-study-mentor
```
**a. Tunnel up?**
```bash
(exec 3<>/dev/tcp/127.0.0.1/5433) 2>/dev/null && echo "tunnel UP" || echo "tunnel DOWN"
```
If DOWN, start it (key-based auth — no secret in this command), backgrounded:
```bash
ssh -L 5433:localhost:5432 dev@72.60.221.118 -N -f
```
**b. Which DB?** Resolve the active URL and confirm the target, password masked:
```bash
grep -E '^DATABASE_URL=' .env | sed -E 's#://([^:]+):[^@]+@#://\1:***@#'
```
It must end in `testcrack_db_dev` (default) or `testcrack_db_main` (PROD). **Say which to the user.**
**c. Ping** with the read harness (§1) running `SELECT 1;`. If psql isn't found, it must be installed / on PATH — stop and tell the user rather than improvising another client.

## 1. The read harness — use this for EVERY inspection

One psql session, read-only enforced, fail-fast, no pager, no psqlrc surprises:
```bash
DBURL="$(grep -E '^DATABASE_URL=' .env | head -1 | sed -E 's/^DATABASE_URL=//' | tr -d '"[:space:]')"
psql -X -v ON_ERROR_STOP=1 --pset pager=off -d "$DBURL" <<'SQL'
SET default_transaction_read_only = on;
-- your SELECT / \d / information_schema query here
SELECT 1;
SQL
```
**Flags go BEFORE `-d "$DBURL"` on purpose.** git-bash's getopt is POSIX-mode: the connection
string as the first positional stops option parsing, so `psql "$DBURL" -v …` silently *drops*
`-v/-X/--pset` ("extra command-line argument … ignored") and you lose `ON_ERROR_STOP`. Options
first, `-d` last. (Value is stripped of quotes/whitespace so it stays a single clean token.)
`SET default_transaction_read_only = on` makes any data-modifying or DDL statement in that
session fail with *"cannot execute … in a read-only transaction"* — for every role, superuser
included. If a query you thought was a read errors this way, that's the guard working; don't
"work around" it — switch to §4.

### Targeting `main` (production) — deliberate only
The main URL is the commented line in `.env`. Resolve it explicitly, and **only after the user
says main**:
```bash
DBURL_MAIN="$(grep -E '^# *DATABASE_URL=.*testcrack_db_main' .env | head -1 | sed -E 's/^# *DATABASE_URL=//' | tr -d '"[:space:]')"
# then, same flags-first form: psql -X -v ON_ERROR_STOP=1 --pset pager=off -d "$DBURL_MAIN"
```
Reads on main are allowed but announce it. Writes on main → do not, barring an explicit,
spelled-out instruction naming production.

## 2. Known-good queries (the high-frequency ones)

**Row counts across the question banks** (the "how much content is there" check):
```sql
SELECT 'drill' AS bank, count(*) FROM drill_questions
UNION ALL SELECT 'diagnostic', count(*) FROM diagnostic_questions
UNION ALL SELECT 'ia', count(*) FROM ia_questions
UNION ALL SELECT 'mock', count(*) FROM mock_questions
ORDER BY bank;
```
**Per-exam breakdown** (swap the table):
```sql
SELECT exam_id, skill, count(*) FROM drill_questions GROUP BY 1,2 ORDER BY 1,2;
```
**"Is `correct_answer` a bare letter or jsonb?"** — check the declared type, then eyeball samples:
```sql
SELECT table_name, data_type FROM information_schema.columns
 WHERE column_name='correct_answer' AND table_name LIKE '%questions' ORDER BY 1;
SELECT correct_answer, pg_typeof(correct_answer) FROM diagnostic_questions
 WHERE correct_answer IS NOT NULL LIMIT 5;
```
**"Did the migration land?"** — column/table existence + recent Prisma history:
```sql
SELECT column_name, data_type FROM information_schema.columns
 WHERE table_name='drill_questions' AND column_name='exam_id';
SELECT migration_name, finished_at FROM _prisma_migrations ORDER BY finished_at DESC NULLS FIRST LIMIT 10;
```
**Introspection** (psql meta-commands work inside the harness heredoc): `\dt` list tables,
`\d+ drill_questions` describe a table, `\dn` schemas.

## 3. Reporting back
State the **DB name**, the query run, and the result compactly. For a "shape" question, give the
declared type *and* a sample value (they can disagree with intent). Never paste rows containing
personal user data beyond what the question needs.

## 4. THE WRITE WALL — writes, DDL, migrations, `db push`

Anything that changes data or schema. **You do not run the committing version.** Procedure:

1. **Confirm intent + target DB** with the user in words. If target is `main`, escalate — restate that it's production and require an unmistakable yes.
2. **Dry-run** the exact statement in a rolled-back transaction (note: no read-only SET here — this flow is deliberately a write path, but it never commits):
   ```bash
   psql -X -v ON_ERROR_STOP=1 --pset pager=off -d "$DBURL" <<'SQL'
   BEGIN;
   -- the exact write, verbatim:
   UPDATE drill_questions SET is_active = true WHERE id = '…';
   -- verify the blast radius before deciding:
   -- (UPDATE/DELETE print the affected row count)
   ROLLBACK;
   SQL
   ```
   Report the affected-row count / any error. A count far bigger than expected = stop.
3. **STOP and paste** the exact, final SQL to the user in a code block, with: target DB, dry-run
   row count, and whether it's reversible. Then **wait**. Do not proceed on implied consent.
4. **Prefer the user runs it themselves** (paste-ready). If they explicitly tell *you* to run it,
   run the identical statement with `COMMIT` (or `prisma db push` for schema) — nothing changed
   from what they approved — then re-query to confirm the effect.
5. Schema changes: the authoritative schema is `prisma/schema.prisma`; a hand `ALTER` on the live
   DB must be mirrored there (and coordinated with the deploy's schema-drift gate — see the
   `deploy-dev` skill). Any *"may cause data loss" / DROP / destructive ALTER* prompt → STOP, paste,
   wait, every time.

## 5. Who leans on this
`/seed-content` and `/verify-exam` should route their DB access through §0–§1 (connect + read
harness) and §4 (write wall) rather than re-deriving connection details or writing ad-hoc. If you
extend those skills, call back to this one instead of duplicating the connection/safety logic.

---
_Harden this skill after each real session: if a connect step was fiddly, a "safe" query wasn't,
or the write wall had a gap, tighten it here. The wall only works if it's never quietly skipped._
