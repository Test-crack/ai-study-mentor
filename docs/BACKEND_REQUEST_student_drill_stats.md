# Backend Request — Student access to their own drill stats + LexiGrid aggregate

**From:** Gokul (Frontend)
**Date:** 21 August 2026
**Size:** small — the hard part (the query) already exists
**Blocking:** DATA_AUDIT item 4. Nothing else depends on it; this is additive.

---

## The problem in one line

Three practice metrics are already computed and already rendered — **in the instructor's view**. Students cannot see their own.

The fields are `sub_skill_counts`, `streak_calendar` and `total_drills_all_time`. They ship through instructor-authorised endpoints only, and there is **no student route** that exposes them. A student can't call an instructor route, so their own practice history is visible to their tutor and not to them.

Separately, LexiGrid is **write-only** for students: `POST /api/student/game-score` exists, there is no `GET`. A student can record a score and never read their own aggregate.

## Evidence

| Claim | Where |
|---|---|
| The three fields are computed and returned | instructor student-progress payload (`drill_stats`) |
| They are already fully rendered | `src/features/instructor/components/student-progress/DrillsTab.tsx:58` destructures all of them; a working `StreakCalendar` component renders `streak_calendar` at line 124 |
| Also used in the printable report | `src/features/instructor/components/report/StudentReportTemplate.tsx:75` |
| No student route exists | `grep -n "drill-stats" src/routes/studentRoutes.ts` → no match |
| LexiGrid is POST-only | `src/routes/studentRoutes.ts:37` — `router.post('/game-score', saveGameScore)`, no GET |

So the frontend UI for two of the three already exists and is proven against real data. This is an authorisation and routing gap, not new feature work.

---

## Request 1 — student-readable drill stats

Either option works for me. **Option A is my preference** — it keeps the payload shapes identical between roles so the existing components drop straight in.

### Option A (preferred): a new student route reusing the existing query

```
GET /api/student/drill-stats
```

Auth: student only. Scoped to the calling student — no `:studentId` param, so there is no way to request someone else's data.

Response — **same shape the instructor endpoint already returns** for `drill_stats`:

```jsonc
{
  "success": true,
  "data": {
    "last_14_days":          [ /* existing shape, unchanged */ ],
    "sub_skill_counts":      [ { "skill": "WRITING", "sub_skill": "Coherence", "count": 12, "avg_accuracy": 68 } ],
    "streak_calendar":       [ { "date": "2026-08-19", "active": true } ],
    "total_drills_all_time": 214
  }
}
```

**Please do not include `avg_dcs_lifetime`.** The audit flagged it as instructor-only and I have deliberately routed around it — see "Explicitly out of scope" below.

### Option B: fold the fields into an existing response

Add `sub_skill_counts`, `streak_calendar` and `total_drills_all_time` to the existing `GET /api/student/daily-drill-state`.

Cheaper (no new route, no extra request from the dashboard), but it makes an already-large response larger and couples per-day drill state to lifetime history. Your call.

---

## Request 2 — LexiGrid aggregate read

```
GET /api/student/lexigrid-stats
```

Auth: student only, own data.

Shape is yours to define — whatever `lexigrid_stats` already contains on the instructor/institute side is ideal, since that shape is already consumed by instructor, institute-admin and institute-owner surfaces and I can reuse the rendering. Something like:

```jsonc
{
  "success": true,
  "data": {
    "games_played": 42,
    "best_score": 880,
    "avg_score": 615,
    "total_momentum_earned": 1240
  }
}
```

If the aggregate is cheap to compute, returning it from the existing daily-drill-state response is also fine.

---

## Explicitly out of scope

- **`avg_dcs_lifetime`** — instructor-only by design. I am not asking for it. The readiness model derives improvement pace from band history instead, which is arguably the stronger signal anyway: actual band movement predicts a future band more directly than drill accuracy does.
- **Anything per-student for another role.** These are self-service reads only.

---

## What I will build with it

| Field | Student-facing panel |
|---|---|
| `sub_skill_counts` | Practice-coverage panel — reveals blind spots ("you've never drilled Word Stress") |
| `streak_calendar` | Practice heatmap — the `StreakCalendar` component already exists |
| `total_drills_all_time` | Lifetime-effort stat tile |
| LexiGrid aggregate | Personal-best / games-played tile |

Roughly one day of frontend work once the routes land, because the instructor-side components are reusable.

---

## Two unrelated items worth fixing while you are in this area

Both were found while wiring the admin analytics pages. Neither blocks the above.

### 1. `_rate` / `_pct` fields return percents, not fractions

Confirmed against live data on 21 Aug 2026: `BatchComparisonRow.at_risk_pct` arrived as `100` for a batch where every student was at risk, and `engagement_rate` as `12` for 12%.

The frontend had been multiplying by 100, so the admin Reports page was rendering **`10000%`** and **`1200%`**. Fixed at the call sites, but the field names still imply fractions and there is now a defensive tolerance in the frontend (`pctOf`) that I would like to delete.

**Ask:** pick one convention and make the names honest — either send fractions and keep `_rate`/`_pct`, or keep percents and rename to `_percent`. Note `EngagementWeek.engagement_rate` and `BatchComparisonRow.engagement_rate` currently share a name and disagree on units.

### 2. `getStudentWritingHistory` averages AI scores only

`avgScore` is computed from `aiBandScore` alone. Low priority now that manual grading is dropped, but if instructor override ever returns, the summary will silently ignore every correction.

---

## Summary

| # | Ask | Effort |
|---|---|---|
| 1 | `GET /api/student/drill-stats` (or fold 3 fields into `daily-drill-state`) | Small — query exists |
| 2 | `GET` for LexiGrid aggregate | Small |
| 3 | Settle the `_rate`/`_pct` unit convention | Naming decision + rename |
| 4 | `getStudentWritingHistory.avgScore` prefer manual band | Trivial, low priority |

Items 1 and 2 are what unblock me. 3 and 4 are cleanup.
