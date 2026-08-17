# TestCrack — Exam-Agnostic Platform Implementation Plan

**Goal:** Make exam type data, not code. Adding Exam N must cost ≈ the same as adding Exam 2.  
**Exam sequence:** IELTS (live) → Spoken English / CEFR (Exam 2) → OET (Exam 3, gated)  
**Source of truth:** TC-05 (Backend Engineering Guide), TC-07 (Team Operating Model)

---

## Hard Rules — Must Not Be Violated

1. **Zero IELTS regression is the gate.** No exam registers until CI is green on IELTS post-migration.
2. **No `if (examType === 'X')` in shared code.** Exam behaviour lives in config/strategy. Shared services accept parameters; they never know which exam they're serving.
3. **`band_score` stays `Decimal`.** Holds `6.5` (IELTS) or `350` (OET numeric). Non-numeric representations — OET letter grade, CEFR level — go in the existing `sub_scores` JSON. Never add a score column per exam scale.
4. **Additive migrations only**, besides the two deliberate enum renames in Phase 1.
5. **Deactivation is a read-access change, never a delete.** `billing_status → CANCELLED` keeps the student's competency matrix, history, and predictions. No cascades.
6. **Access restrictions in one function:** `canAccessEnrollment(user, enrollment)`. When we lift a restriction, only one function changes.

---

## VPS Deployment Protocol

- `prisma db push` runs **manually on VPS only** — never in CI/CD
- Pre-push SQL migrations must be run **before** `prisma db push` on every phase
- Run against staging first; verify IELTS reads/writes are unchanged before touching prod
- `NODE_ENV = production` on both main and dev VPS instances

---

## Status Board

| Phase | Description | Status | PR |
|-------|-------------|--------|----|
| S0 | DB naming standardization | ✅ Done — `platform/s1` | commit `1779a31` |
| 1 | ExamType enum + SkillType renames | 🔲 Next | `platform/s2` |
| 2 | `exam_type` columns on existing tables | 🔲 | `platform/s2` |
| 3 | Batch table renames | 🔲 | `platform/s2` |
| 4 | New tables: subscriptions, DPDP, Viva | 🔲 | `platform/s2` |
| 5 | `packages/exam-engine` interfaces | 🔲 | `platform/s2` |
| 6 | Extract IELTS logic behind interfaces | 🔲 | `platform/s3` |
| 7 | Prove abstraction: IELTS through registry (gate) | 🔲 | `platform/s3` |
| 8 | Register SPOKEN (CEFR) + Viva Engine backend | 🔲 | `platform/s4` |
| 9 | Predictive Readiness v1 | 🔲 | `platform/s4` |
| 10 | Register OET (behind content gate) | 🔲 | `platform/s5` |

---

## Phase S0 (DONE) — DB Naming Standardization

**Commit:** `1779a31` on `platform/s1`

What was done:
- All 31 Prisma models renamed to PascalCase; `@@map()` added to preserve existing snake_case DB table names
- 2 legacy tables marked: `ReadingAssessmentHistory`, `CourseOrder` (`@@map("..._legacy")` + `/// LEGACY:` doc comment)
- Column `@map()` additions: `is_diagnosed`, `recommendation_seeded`, `created_at`/`updated_at` on `RecommendationItem`
- 27 TypeScript source files updated for new Prisma accessor names (`prisma.instituteStudent`, etc.)
- Raw SQL table references fixed in `courseProgressService.ts` and `iaController.ts`
- `diagnostic_setup.sql` VIEW updated to reference renamed snake_case tables
- VPS migration script: `docs/migrations/s1-pre-push.sql`

**VPS action required before first deploy on this branch:**
1. Run `docs/migrations/s1-pre-push.sql` (drops `diagnostic_status` VIEW, renames tables and columns, recreates VIEW)
2. Then run `npx prisma db push`

---

## Phase 1 — ExamType Enum + Skill Type Renames

**TC-05 Step 1.1–1.2 | Single atomic PR — rename is indivisible**

### 1.1 Add ExamType enum to schema.prisma

```prisma
enum ExamType {
  IELTS
  SPOKEN   // ← position 2 (TC-05 §1.1 — Spoken English is Exam 2)
  OET
  GRE
  TOEFL
  PTE
}
```

### 1.2 Rename IeltsSkillType → SkillType and IeltsSubSkillType → SubSkillType

```prisma
// Before
enum IeltsSkillType { LISTENING READING WRITING SPEAKING }
enum IeltsSubSkillType { ... }

// After
enum SkillType { LISTENING READING WRITING SPEAKING }
enum SubSkillType { ... }
```

VPS pre-push SQL (must run before `prisma db push`):
```sql
ALTER TYPE "IeltsSkillType" RENAME TO "SkillType";
ALTER TYPE "IeltsSubSkillType" RENAME TO "SubSkillType";
```

Codebase changes (find-replace, one PR):
- `IeltsSkillType` → `SkillType` (all TypeScript imports + usages)
- `IeltsSubSkillType` → `SubSkillType` (all TypeScript imports + usages)
- Verify no raw SQL string references to the old enum type names

---

## Phase 2 — Add exam_type to Existing Tables

**TC-05 Step 1.3 | All additive — zero data migration needed**

Add `exam_type ExamType @default(IELTS)` to these models:

| Model | DB Table |
|-------|----------|
| `DiagnosticQuestion` | `diagnostic_questions` |
| `AssessmentHistory` | `assessment_history` |
| `StudentCompetencyMatrix` | `student_competency_matrix` |
| `DrillQuestion` | `drill_questions` |
| `IAQuestion` | `ia_questions` |
| `MockQuestion` | `mock_questions` |
| `InstituteStudent` | `institute_students` |

The `@default(IELTS)` means every existing row gets tagged as IELTS — no backfill script needed.

VPS pre-push SQL: None. These are additive columns; `prisma db push` handles them directly.

---

## Phase 3 — Batch Table Renames

**TC-05 Step 1.4 | Three renames + exam_type on Batch**

### Schema changes

| Old Model | New Model | Old DB Table | New DB Table |
|-----------|-----------|--------------|--------------|
| `IeltsBatch` | `Batch` | `ielts_batches` | `batches` |
| `IeltsBatchStudent` | `BatchStudent` | `ielts_batch_students` | `batch_students` |
| `IeltsBatchInstructor` | `BatchInstructor` | `ielts_batch_instructors` | `batch_instructors` |

Add to `Batch` model:
```prisma
exam_type  ExamType  @default(IELTS)
```

VPS pre-push SQL:
```sql
ALTER TABLE IF EXISTS "ielts_batches" RENAME TO "batches";
ALTER TABLE IF EXISTS "ielts_batch_students" RENAME TO "batch_students";
ALTER TABLE IF EXISTS "ielts_batch_instructors" RENAME TO "batch_instructors";
```

Codebase changes (after running `prisma generate`):

**Prisma client accessors:**
- `prisma.ieltsBatch` → `prisma.batch`
- `prisma.ieltsBatchStudent` → `prisma.batchStudent`
- `prisma.ieltsBatchInstructor` → `prisma.batchInstructor`

**Relation field names on result objects** (these stay as-is in schema; TypeScript shape changes):
- `.ielts_batches` → `.batches` (on `BatchStudent` and `BatchInstructor` result objects)
- `.ielts_batch_students` → `.batch_students` (on `Batch` result objects)
- `.ielts_batch_instructors` → `.batch_instructors` (on `Batch` result objects)

Key files to update: `batchController.ts`, `instituteAdminController.ts`, `instituteOwnerController.ts`, `instructorController.ts`, `studentNotify.ts`, `batchDashboardQueries.ts`

Raw SQL: search for `"ielts_batch"` across all SQL strings.

---

## Phase 4 — New Tables: Subscriptions, DPDP, Viva

**TC-05 Steps 1.5–1.6 + Viva Engine**

### 4.1 institute_exam_subscriptions (TC-05 Step 1.5)

```prisma
model InstituteExamSubscription {
  id              String    @id @default(cuid())
  institute_id    String
  exam_type       ExamType
  plan_tier       String    @default("TRIAL")   // "TRIAL" | "STARTER" | "PRO"
  seat_cap        Int?
  billing_status  String    @default("TRIAL")   // "TRIAL" | "ACTIVE" | "CANCELLED"
  trial_ends_at   DateTime?                     // DO NOT SKIP — GTM is per-exam 30-day pilot
  created_at      DateTime  @default(now())
  updated_at      DateTime  @updatedAt

  institute       Institute @relation(fields: [institute_id], references: [id])

  @@unique([institute_id, exam_type])
  @@map("institute_exam_subscriptions")
}
```

> Do not skip `trial_ends_at`. The GTM is a free 30-day pilot **per exam** — an institute can pay for IELTS while trialling Spoken English. Without this field that state is unrepresentable.

### 4.2 DPDP Fields on InstituteStudent (TC-05 Step 1.6)

```prisma
// Add to InstituteStudent model:
date_of_birth  DateTime?
is_minor       Boolean    @default(false)
```

### 4.3 guardian_consent table (TC-05 Step 1.6)

```prisma
model GuardianConsent {
  id              String           @id @default(cuid())
  student_id      String           @unique
  guardian_name   String
  guardian_phone  String
  consented_at    DateTime
  consent_method  String           // "WRITTEN" | "DIGITAL"
  created_at      DateTime         @default(now())

  student         InstituteStudent @relation(fields: [student_id], references: [id])

  @@map("guardian_consent")
}
```

### 4.4 Viva Engine Tables (TC-05 §Viva Engine — now on revenue path)

```prisma
model VivaSession {
  id            String    @id @default(cuid())
  student_id    String
  exam_type     ExamType
  status        String    @default("PENDING") // "PENDING" | "IN_PROGRESS" | "COMPLETED" | "EXPIRED"
  started_at    DateTime?
  completed_at  DateTime?
  created_at    DateTime  @default(now())

  student       InstituteStudent @relation(fields: [student_id], references: [id])
  answers       VivaAnswer[]

  @@map("viva_session")
}

model VivaAnswer {
  id               String       @id @default(cuid())
  session_id       String
  question_id      String
  audio_url        String?
  transcript       String?
  score            Decimal?
  sub_scores       Json?
  evaluated_at     DateTime?
  retention_until  DateTime?    // DPDP: scheduled purge of voice recording data
  created_at       DateTime     @default(now())

  session          VivaSession  @relation(fields: [session_id], references: [id])

  @@map("viva_answer")
}
```

Architecture notes:
- Per question: serve → receive audio → transcribe → evaluate against `ExamConfig` sub-skill descriptors → persist → advance
- Questions are independent rows — a failure on one never loses the others
- Aggregate per-sub-skill means into `StudentCompetencyMatrix` so viva results drive drill targeting with no special-casing
- **Cache the rubric prompt** — descriptors are identical across every session for a given exam (~10× cheaper on cached input)
- **Log token usage per call from day one** — needed when the Speaking Eval API gets priced
- Cap questions via `ExamConfig.maxVivaQuestions` — not for cost, but to bound failure surface

---

## Phase 5 — packages/exam-engine Interfaces

**TC-05 Step 2 | Dependency-free package — any app can import it**

Create `packages/exam-engine/` in monorepo root.

### ExamConfig

```typescript
export interface ExamConfig {
  examType: ExamType;
  displayName: string;
  legalDisplayName: string;   // Never hand-type exam names — use this
  legalDisclaimer: string;    // Required disclaimer for marketing/UI
  trademarkOwner: string;     // e.g. "British Council / IDP / Cambridge Assessment English"
  skills: SkillType[];
  speakingFormat: 'standard' | 'viva' | 'roleplay';
  maxVilaQuestions?: number;  // cap per viva session
  scoringStrategy: ScoringStrategy;
}
```

> The three legal fields (`legalDisplayName`, `legalDisclaimer`, `trademarkOwner`) make a whole class of trademark mistake structurally unavailable. No developer ever hand-types an exam name into a component again.

### ScoringStrategy

```typescript
export interface ScoringStrategy {
  formatSkillScore(fraction: number): string; // "6.5" | "B2" | "B"
  overall(skillScores: Record<SkillType, number>): string;
}
```

### Scoring implementations by exam

| Exam | `formatSkillScore` | `overall()` |
|------|--------------------|-------------|
| IELTS | `fractionToBand()` → "6.5" | mean of 4 skills, round to 0.5 |
| SPOKEN | `fractionToCEFR()` → "B2" | **banded threshold** over sub-skill means |
| OET | `fractionToOETScore()` → "350" + grade | **weakest** skill grade |

> These three structurally different operations are why CEFR proves the interface generalises — mean-rounding was the easy path; threshold-banding is the real test.

### EXAM_REGISTRY

```typescript
export const EXAM_REGISTRY: Record<ExamType, ExamConfig> = {
  IELTS:  { /* ... */ },
  SPOKEN: { /* ... */ },
  OET:    { /* ... */ },
  // GRE, TOEFL, PTE: registered when content is ready
};
```

---

## Phase 6 — Extract IELTS Logic Behind Interfaces

**TC-05 Step 3 | Do not change any behaviour — pure refactor**

- `bandScale.ts → scoringUtils.ts`; keep `fractionToBand()` untouched
- Wrap in IELTS `ScoringStrategy` object and register as `EXAM_REGISTRY.IELTS`
- Move IELTS descriptors/criteria to `exams/ielts/prompts.ts`
- Abstract Gemini call in `ieltsWritingService` / `ieltsSpeakingService`: service takes criteria as a parameter; Spoken English later passes `exams/spoken/prompts.ts` through the same path
- `diagnosticController`: read `exam_type` from request → `EXAM_REGISTRY[examType]` → route to that strategy's methods

Route rename (do in this PR):
- Existing IELTS-named routes get the `/api/ielts/` prefix per the route convention table below

---

## Phase 7 — Prove Abstraction on IELTS (Hard Gate)

**TC-05 Step 4 | This is the stop-the-line gate**

Route IELTS entirely through `EXAM_REGISTRY.IELTS`. If IELTS passes CI green through the config path, the abstraction holds.

Deliverables:
- IELTS end-to-end smoke test through config path (kept permanently as a CI guard)
- Report confirming zero behaviour change

**No new exam registers until this gate is green.** Do not skip to save time.

---

## Phase 8 — Register SPOKEN (CEFR) as Exam 2

**TC-05 Step 5 | This actually tests the design**

Run in parallel with Viva Engine backend (Phase 4.4 tables must already exist).

SPOKEN config:
```typescript
{
  examType: 'SPOKEN',
  displayName: 'Spoken English',
  legalDisplayName: 'Spoken English (CEFR — Common European Framework of Reference)',
  legalDisclaimer: 'CEFR is a trademark of the Council of Europe.',
  trademarkOwner: 'Council of Europe',
  skills: ['SPEAKING'],
  speakingFormat: 'viva',
  maxVivaQuestions: 10,
  scoringStrategy: {
    formatSkillScore: fractionToCEFR,    // → "B2"
    overall: cefrThresholdBanding,        // banded, NOT mean
  }
}
```

Content: **no new content needed** — reuses existing Speaking question bank, now tagged with `exam_type = SPOKEN`.

**Required report at end of this phase:**
> Did CEFR threshold-banding fit `overall()` without a special case? If it needed one, fix the interface now — at Exam 3 the cost is 3× higher.

Add SPOKEN smoke test to CI alongside IELTS test. Two exams green through one config path is the actual evidence the design works.

---

## Phase 9 — Predictive Readiness v1

**TC-05 §Predictive Readiness | Rule-based, no ML infra**

```prisma
model ReadinessPrediction {
  id               String           @id @default(cuid())
  student_id       String
  exam_type        ExamType
  predicted_band   Decimal?         // "6.5" for IELTS numeric
  predicted_level  String?          // "B2" for CEFR, "B" for OET grade
  confidence_score Decimal?         // 0.0–1.0
  predicted_at     DateTime         @default(now()) // timestamp IS the calibration proof
  method           String           @default("rule_v1")

  student          InstituteStudent @relation(fields: [student_id], references: [id])

  @@map("readiness_prediction")
}
```

v1 inputs: competency trajectory, drill trend, IA/mock history, Momentum score.

> **Build it; hold the public claim.** India's CCPA Coaching Guidelines 2024 make unsubstantiated success-metric claims a regulatory matter. Internal calibration first. Publish with sample size + error band when proven.

---

## Phase 10 — Register OET (Exam 3, Behind Gate)

**TC-05 Step 6 | Do not start until gate clears**

Gate conditions (both required):
1. Platform Services' verification engine has shipped
2. A validated OET question bank (Nursing, L+R+W) has been produced by that engine

Content scope (TC-03): Nursing only, L+R+W, Grade B target. `speakingFormat: 'roleplay'` is reserved but unused in v1.

```typescript
{
  examType: 'OET',
  displayName: 'OET',
  legalDisplayName: 'Preparation for the Occupational English Test (OET®)',
  legalDisclaimer: 'OET is a registered trademark of Cambridge Boxhill Language Assessment Pty Ltd.',
  trademarkOwner: 'Cambridge Boxhill Language Assessment Pty Ltd',
  skills: ['LISTENING', 'READING', 'WRITING'],
  speakingFormat: 'roleplay',   // reserved
  scoringStrategy: {
    formatSkillScore: fractionToOETScore,   // → "350"
    overall: weakestSkillGrade,             // NOT mean — weakest skill determines pass
  }
}
```

> If registering OET costs materially more engineering time than Spoken English did, the abstraction leaked. That comparison is the honest verdict on this entire plan.

---

## Question-Bank Schema Contract (Backend ↔ Platform Services)

**Agree in Week 1** — this is the one interface seam that blocks two workstreams.

The schema must be clean enough to publish externally — difficulty metadata is a licensable commercial asset (TC-03 §6.3).

```typescript
interface QuestionBankItem {
  id:         string;
  exam_type:  ExamType;
  skill:      SkillType;
  sub_skill:  SubSkillType;
  difficulty: number;              // universal, 0.0–1.0 — now the primary discriminator
  level:      'A' | 'B' | 'C' | null; // nullable, drills-only — retiring from diagnostic
  distractor_metadata: {
    // agreed structure — exact shape TBD in Week 1 sync
  };
}
```

`level` is nullable and drills-only — it is retiring from diagnostic selection. `difficulty` is universal and becomes the primary discriminator since every student sees every question in the untiered pool.

**Licensing rule:** difficulty metadata and question content are licensable. Performance data, competency matrix, and calibration model are never licensed. No read path from any licensing product back to the platform DB.

---

## Route Convention

Exam-prefix everything. Rename existing IELTS routes in Phase 6.

| Exam | Route prefix | Example |
|------|-------------|---------|
| IELTS | `/api/ielts/` | `/api/ielts/diagnostic/start` |
| SPOKEN | `/api/spoken/` | `/api/spoken/viva/start` |
| OET | `/api/oet/` | `/api/oet/writing/submit` |

Deploy topology: **one domain, exam as route** — `testcrack.com/spoken/…`. No separate domains per exam.

---

## CI / Testing Rules

- IELTS regression suite green before every new-exam merge (hard gate)
- Contract test per `ScoringStrategy`: `given(correct, total) → assertFormattedScore()`
- IELTS end-to-end smoke test through config path — permanent CI guard after Phase 7
- SPOKEN smoke test added once registered (Phase 8)
- `prisma db push` is never in CI — manual on VPS only

---

## Team Ownership (TC-07)

| Function | Owns | Blocks |
|----------|------|--------|
| Backend Engineering | Phases 1–10 (this plan) | Frontend viva UI, OET backend, Predictive Readiness UI |
| Frontend Engineering | Student journey bugs, `packages/ui`, Viva UI, CEFR score display | Spoken English launch |
| Platform Services | Verification engine (critical path), standalone API products | OET content sourcing (Phase 10 gate) |
| Content / Media | Tag existing Speaking bank for viva; hold OET until engine ships | — |

---

## Timeline (TC-07 dependency map)

```
Week 1–2   Phase 1 (enum + renames) + Phase 5 (exam-engine interfaces)
           Agree question-bank schema with Platform Services
Week 3–4   Phase 6 + 7 (IELTS abstraction + prove it; gate)
Week 5–6   Phase 8 (Register SPOKEN) + Viva Engine backend (Phase 4.4)
           Frontend: Viva UI
Week 7–8   ★ SPOKEN ENGLISH LIVE — first paid module beyond IELTS
Week 9–10  Phase 9 (Predictive Readiness v1)
           Phase 10 planning (if engine shipped)
Week 11+   OET backend + frontend + pilot
```

---

## Per-Phase VPS Pre-Push SQL Summary

| Phase | Pre-push SQL required? | Notes |
|-------|----------------------|-------|
| S0 | ✅ `docs/migrations/s1-pre-push.sql` | Table renames, column renames, VIEW recreation |
| 1 | ✅ `ALTER TYPE "IeltsSkillType" RENAME TO "SkillType"; ALTER TYPE "IeltsSubSkillType" RENAME TO "SubSkillType";` | Must run before db push |
| 2 | ❌ | Additive columns — db push handles them |
| 3 | ✅ Three `ALTER TABLE RENAME` statements | ielts_batches → batches etc. |
| 4 | ❌ | New tables — db push creates them |
| 5–10 | ❌ (mostly) | New packages/tables, flag any renames |
