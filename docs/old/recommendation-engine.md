# IELTS Personalized Recommendation Engine

**Status:** Planning · **Author:** Engineering Team · **Last Updated:** 2026-04-03

---

## 1. Overview

The Recommendation Engine surfaces curated learning resources (YouTube videos, blog articles, practice tests) to students on their dashboard. Resources are selected **independently per skill** based on the student's current band score for each IELTS module:

- **L** — Listening
- **R** — Reading
- **W** — Writing
- **S** — Speaking

There is **no cross-skill dependency**. A student's Reading level doesn't affect what Speaking resources they see. Each skill is classified into a `RecommendationLevel` tier, and matching resources are fetched for that tier.

---

## 2. Band Score → Level Classification

| Band Score Range | Level Enum      | Description                        |
|------------------|-----------------|------------------------------------|
| 0.0 – 4.5        | `BEGINNER`      | Foundational skills needed         |
| 5.0 – 6.5        | `INTERMEDIATE`  | Core exam readiness                |
| 7.0 – 9.0        | `ADVANCED`      | Refinement and top-band targeting  |

### Classification Logic (TypeScript)

```typescript
export type RecommendationLevel = 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED';

export function getBandLevel(bandScore: number): RecommendationLevel {
  if (bandScore <= 4.5) return 'BEGINNER';
  if (bandScore <= 6.5) return 'INTERMEDIATE';
  return 'ADVANCED';
}
```

> **Edge Case:** If a student has no recorded score (score = 0, or no row in `StudentCompetencyMatrix`), default to `BEGINNER`.

---

## 3. Enums

### `IeltsSkillType`
Identifies which skill a resource targets.

```typescript
enum IeltsSkillType {
  LISTENING  = 'LISTENING',
  READING    = 'READING',
  WRITING    = 'WRITING',
  SPEAKING   = 'SPEAKING',
}
```

### `RecommendationLevel`
The learner tier a resource is aimed at.

```typescript
enum RecommendationLevel {
  BEGINNER     = 'BEGINNER',
  INTERMEDIATE = 'INTERMEDIATE',
  ADVANCED     = 'ADVANCED',
}
```

### `RecommendationType`
The format/category of the resource link. Used on the frontend to render icons and appropriate UI.

```typescript
enum RecommendationType {
  VIDEO          = 'VIDEO',           // YouTube, Vimeo, etc.
  BLOG           = 'BLOG',            // Written articles, guides
  PRACTICE_TEST  = 'PRACTICE_TEST',   // Mock tests, exercises
}
```

---

## 4. Database Schema

### Table: `recommendation_items`

This is the central data table. Admins / super-admins will populate it via the admin panel or direct seeding.

```sql
-- ============================================================
-- Migration: Recommendation Engine Schema
-- ============================================================

CREATE TYPE "IeltsSkillType" AS ENUM (
  'LISTENING', 'READING', 'WRITING', 'SPEAKING'
);

CREATE TYPE "RecommendationLevel" AS ENUM (
  'BEGINNER', 'INTERMEDIATE', 'ADVANCED'
);

CREATE TYPE "RecommendationType" AS ENUM (
  'VIDEO', 'BLOG', 'PRACTICE_TEST'
);

CREATE TABLE IF NOT EXISTS recommendation_items (
  id           UUID              PRIMARY KEY DEFAULT gen_random_uuid(),
  title        VARCHAR(300)      NOT NULL,
  url          TEXT              NOT NULL,
  description  TEXT,
  thumbnail_url TEXT,                          -- Optional: for blog/practice test thumbnails
  source       VARCHAR(150),                   -- E.g. "IELTS Liz", "British Council"
  duration_min INTEGER,                        -- Approximate duration in minutes (nullable for blogs)
  type         "RecommendationType" NOT NULL,
  skill_type   "IeltsSkillType"    NOT NULL,
  level        "RecommendationLevel" NOT NULL,
  is_active    BOOLEAN           NOT NULL DEFAULT true,
  created_at   TIMESTAMPTZ       NOT NULL DEFAULT now(),
  updated_at   TIMESTAMPTZ       NOT NULL DEFAULT now()
);

-- Efficient query index: the most common query pattern
CREATE INDEX idx_rec_items_skill_level
  ON recommendation_items (skill_type, level, is_active);

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION update_recommendation_items_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_rec_items_updated_at
  BEFORE UPDATE ON recommendation_items
  FOR EACH ROW EXECUTE FUNCTION update_recommendation_items_updated_at();
```

### Field Reference

| Column          | Type                  | Required | Notes                                              |
|-----------------|-----------------------|----------|----------------------------------------------------|
| `id`            | UUID                  | ✅       | Auto-generated primary key                         |
| `title`         | VARCHAR(300)          | ✅       | Display title of the resource                      |
| `url`           | TEXT                  | ✅       | Full URL (YouTube link, blog URL, test URL)        |
| `description`   | TEXT                  | ❌       | Short description shown in card                    |
| `thumbnail_url` | TEXT                  | ❌       | For non-YouTube resources (blog/practice tests)    |
| `source`        | VARCHAR(150)          | ❌       | Creator/publisher name (e.g. "E2 IELTS")           |
| `duration_min`  | INTEGER               | ❌       | Estimated time in minutes; null for articles       |
| `type`          | `RecommendationType`  | ✅       | `VIDEO`, `BLOG`, or `PRACTICE_TEST`                |
| `skill_type`    | `IeltsSkillType`      | ✅       | `LISTENING`, `READING`, `WRITING`, `SPEAKING`      |
| `level`         | `RecommendationLevel` | ✅       | `BEGINNER`, `INTERMEDIATE`, or `ADVANCED`          |
| `is_active`     | BOOLEAN               | ✅       | Soft-delete / feature-flag per item                |

---

## 5. API Design

### Endpoint

```
GET /api/student/recommendations
```

**Auth:** Requires valid Supabase session token (same authClient pattern used across the app).

### Response Shape

```typescript
interface RecommendationItem {
  id: string;
  title: string;
  url: string;
  description: string | null;
  thumbnail_url: string | null;
  source: string | null;
  duration_min: number | null;
  type: 'VIDEO' | 'BLOG' | 'PRACTICE_TEST';
  level: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED';
}

interface RecommendationsResponse {
  success: boolean;
  levels: {
    LISTENING: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED';
    READING:   'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED';
    WRITING:   'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED';
    SPEAKING:  'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED';
  };
  data: {
    LISTENING: RecommendationItem[];
    READING:   RecommendationItem[];
    WRITING:   RecommendationItem[];
    SPEAKING:  RecommendationItem[];
  };
}
```

### Example Response

```json
{
  "success": true,
  "levels": {
    "LISTENING": "INTERMEDIATE",
    "READING": "BEGINNER",
    "WRITING": "INTERMEDIATE",
    "SPEAKING": "BEGINNER"
  },
  "data": {
    "LISTENING": [
      {
        "id": "uuid-...",
        "title": "IELTS Listening: Multiple Choice Traps Exposed",
        "url": "https://www.youtube.com/watch?v=eig1L1OMZmY",
        "description": "Understand how test-makers create distractor answers...",
        "thumbnail_url": null,
        "source": "IELTS Advantage",
        "duration_min": 14,
        "type": "VIDEO",
        "level": "INTERMEDIATE"
      }
    ],
    "READING": [ ... ],
    "WRITING": [ ... ],
    "SPEAKING": [ ... ]
  }
}
```

---

## 6. Backend Service Architecture

### File: `src/services/recommendationService.ts` (NEW)

**Responsibilities:**
1. Accept a `userId` and fetch their `StudentCompetencyMatrix` rows for L/R/W/S
2. Map each score → `RecommendationLevel` using `getBandLevel()`
3. Run 4 concurrent DB queries, one per skill, filtered by `(skill_type, level, is_active = true)`
4. Return structured payload

```typescript
// Pseudocode structure
async function getRecommendations(userId: string) {
  const scores = await fetchCompetencyScores(userId); // { L, R, W, S }

  const levels = {
    LISTENING: getBandLevel(scores.LISTENING ?? 0),
    READING:   getBandLevel(scores.READING   ?? 0),
    WRITING:   getBandLevel(scores.WRITING   ?? 0),
    SPEAKING:  getBandLevel(scores.SPEAKING  ?? 0),
  };

  // Concurrent fetch — limit to top N items per skill (e.g., 4)
  const LIMIT = 4;
  const [listening, reading, writing, speaking] = await Promise.all([
    db.recommendation_items.findMany({ where: { skill_type: 'LISTENING', level: levels.LISTENING, is_active: true }, take: LIMIT }),
    db.recommendation_items.findMany({ where: { skill_type: 'READING',   level: levels.READING,   is_active: true }, take: LIMIT }),
    db.recommendation_items.findMany({ where: { skill_type: 'WRITING',   level: levels.WRITING,   is_active: true }, take: LIMIT }),
    db.recommendation_items.findMany({ where: { skill_type: 'SPEAKING',  level: levels.SPEAKING,  is_active: true }, take: LIMIT }),
  ]);

  return { levels, data: { LISTENING: listening, READING: reading, WRITING: writing, SPEAKING: speaking } };
}
```

### File: `src/controllers/recommendationController.ts` (NEW)

- Thin controller that calls `recommendationService.getRecommendations(req.user.id)`
- Wraps response with `{ success: true, ... }`
- Handles try/catch with structured error responses

### File: `src/routes/studentRoutes.ts` (MODIFY)

```typescript
// Add to existing student routes:
router.get('/recommendations', authMiddleware, recommendationController.getRecommendations);
```

---

## 7. Frontend Integration

### File: `src/features/student/components/Suggestions.tsx` (MODIFY)

The existing `Suggestions.tsx` uses `MOCK_SUGGESTIONS` — a flat, hardcoded array. This will be replaced with:

1. **API fetch** on component mount using `callBackend('/api/student/recommendations')`
2. **Skill tabs** — tabs for L / R / W / S (or a segmented control), showing the items for the selected skill
3. **Level badge** — display the student's current level per skill (e.g., "You are at Intermediate for Reading")
4. **Loading skeleton** — while fetching
5. **Empty state** — "No resources available for this skill yet" if array is empty

#### UI Layout

```
┌─────────────────────────────────────────────────────┐
│  Targeted Learning                                   │
│  [Listening] [Reading] [Writing] [Speaking]  ← tabs │
│                                                      │
│  Your level: INTERMEDIATE  ← pill badge              │
│                                                      │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────┐│
│  │ VIDEO    │  │ BLOG     │  │PRACTICE  │  │ ...  ││
│  │ card     │  │ card     │  │TEST card │  │      ││
│  └──────────┘  └──────────┘  └──────────┘  └──────┘│
└─────────────────────────────────────────────────────┘
```

#### Type Badge Rendering

| `type`           | Icon          | Badge Color     |
|------------------|---------------|-----------------|
| `VIDEO`          | Youtube icon  | Red/dark        |
| `BLOG`           | FileText icon | Blue            |
| `PRACTICE_TEST`  | ClipboardList | Amber/orange    |

---

## 8. Seed Data Strategy

Before going live, populate `recommendation_items` with curated content. The existing mock data in `Suggestions.tsx` (50 videos) provides a ready seed baseline — migrate and tag each item with:
- `skill_type`: map from `weaknessArea` field
- `level`: assign per editorial judgment
- `type`: `VIDEO` for all current items (add `BLOG` and `PRACTICE_TEST` items in later sprint)

Seed script location: `supabase/seed/recommendation_items.sql`

---

## 9. Admin Panel Consideration (Future Scope)

A Super Admin UI can be built later to:
- Add/Edit/Soft-delete recommendation items
- Filter by skill, level, type
- Re-order items (add a `sort_order INTEGER` column later if needed)

---

## 10. Open Questions

| # | Question | Owner | Status |
|---|----------|-------|--------|
| 1 | Should we randomize which items are shown (from a larger pool) or always show fixed top N? | Product | Open |
| 2 | Do we want a "completed/bookmarked" state persisted to DB vs localStorage? | Product | Open |
| 3 | Should instructors be able to pin specific items for their students? | Product | Open |
| 4 | Max items to show per skill tab on the dashboard widget? (Suggested: 3–4) | Engineering | Decided: 4 |

---

## 11. Implementation Order

```
Phase 1 — Database
  [x] Write migration SQL for enums + recommendation_items table
  [ ] Run migration on Supabase (staging first)
  [ ] Seed with initial content from existing mock data

Phase 2 — Backend
  [ ] Create recommendationService.ts
  [ ] Create recommendationController.ts
  [ ] Register route in studentRoutes.ts
  [ ] Test endpoint with Postman / curl

Phase 3 — Frontend
  [ ] Refactor Suggestions.tsx to fetch real data
  [ ] Add skill tabs (L/R/W/S)
  [ ] Add level badge per tab
  [ ] Handle loading & empty states
  [ ] Add BLOG and PRACTICE_TEST card variants

Phase 4 — Polish
  [ ] Seed BLOG and PRACTICE_TEST items
  [ ] Add thumbnail support for non-video items
  [ ] QA across all band score scenarios
```
