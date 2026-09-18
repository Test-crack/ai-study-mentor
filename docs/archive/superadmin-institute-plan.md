# Phase 3.5 — Super Admin: Institute Management + Exam Selection

**Slots between Phase 3 (done) and Phase 4.** A foundational side-job: the super admin must be able to create, edit, and deactivate institutes — and choose which exams each institute may offer — *before* any subscription/pricing model is decided.

**Pulls forward:** `InstituteExamSubscription` from Phase 4.1 (structural only — no pricing). Phase 4 therefore keeps only DPDP + Viva.

**Source of truth for exams:** the Prisma `ExamType` enum (`IELTS SPOKEN OET GRE TOEFL PTE`). The frontend's ad-hoc list in `Questionbankmanager.tsx` (`GMAT`, `SPOKEN_ENGLISH`, …) is **wrong** and must not be used for institute exam selection.

---

## Alignment with master plan Hard Rules

- **#5 (deactivation ≠ delete):** institutes are only soft-deactivated (`is_active`); exams are only status-flipped (`billing_status → CANCELLED`). No hard delete, no cascade. Already true today — this phase keeps it.
- **Exam is data, not code:** an institute's allowed exams are rows in `InstituteExamSubscription`, never a hardcoded list. Adding Exam N to an institute is one row insert.
- **Additive migrations only:** every change here is a new table or a new nullable column. **No VPS pre-push SQL required** — `prisma db push` handles it.

---

## What already exists (do not rebuild)

**Backend** `superadminController.ts` + `superadminRoutes.ts` (gated by `authorize(SUPERADMIN)`):
`getInstitutes`, `createInstitute` (3-table flow), `updateInstitute`, `toggleInstituteStatus`, `getAllUsers`.

**Frontend** `TestCrackSuperAdmin/`:
`SuperAdminInstitutes.tsx` (list + create modal + edit modal + activate/deactivate), `superadminService.ts`, routed pages incl. empty `Subscription.tsx` / `PricingConfig.tsx`.

---

## Field decisions (locked)

| Table | Change |
|---|---|
| `users` | **None.** `phoneNo` already exists — just collect owner phone in the create form. |
| `institute_owners` | **None.** Correct minimal join; owner identity lives on `User`. |
| `institutes` | Add `contact_email String?`, `contact_phone String?` (nullable, additive). |
| `institute_exam_subscriptions` | **New table** (pulled from Phase 4.1, structural only). |

---

## 3.5.1 Schema changes

```prisma
model Institute {
  // ...existing fields...
  contact_email String?  @db.VarChar(255)
  contact_phone String?  @db.VarChar(20)
  exam_subscriptions InstituteExamSubscription[]
}

model InstituteExamSubscription {
  id             String    @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  institute_id   String    @db.Uuid
  exam_type      ExamType
  billing_status String    @default("TRIAL") @db.VarChar(20) // TRIAL | ACTIVE | CANCELLED
  trial_ends_at  DateTime? @db.Timestamptz(6)                // per-exam 30-day pilot (keep — GTM depends on it)
  seat_cap       Int?                                        // reserved; not enforced this phase
  created_at     DateTime  @default(now()) @db.Timestamptz(6)
  updated_at     DateTime  @default(now()) @db.Timestamptz(6)
  institutes     Institute @relation(fields: [institute_id], references: [id], onDelete: Cascade, onUpdate: NoAction)

  @@unique([institute_id, exam_type])
  @@index([institute_id], map: "idx_institute_exam_subs_institute")
  @@map("institute_exam_subscriptions")
}
```

> `plan_tier` and pricing fields deliberately omitted until the subscription model is decided. `seat_cap` kept as a nullable placeholder so a later phase adds enforcement without a migration.

**VPS:** none. Additive only → `npx prisma db push`.

---

## 3.5.2 Backend changes

**`createInstitute`** — extend + harden:
- Accept `examTypes: ExamType[]` (≥1, validated against the Prisma enum) and optional `ownerPhone`.
- Keep `sendInvite()` **outside** the DB transaction (external Supabase call).
- Wrap the DB writes in `prisma.$transaction([...])`: user upsert → institute create → instituteOwner upsert → `instituteExamSubscription.createMany` (one row per selected exam, `billing_status: 'TRIAL'`, `trial_ends_at: now + 30d`). Today these are sequential un-transactioned creates — this closes a partial-failure gap.

**`updateInstitute`** — allow `contact_email`, `contact_phone` in addition to name/address/logoUrl.

**`getInstitutes` / new `getInstituteDetail`** — include `exam_subscriptions` so the UI can render exam badges + status.

**New endpoints** (add to `superadminRoutes.ts`, SUPERADMIN-gated):
- `PUT  /api/superadmin/institutes/:id/exams` — set the full list of exams for an institute (diff against existing rows: create missing, `CANCELLED` removed — never hard-delete).
- `PATCH /api/superadmin/institutes/:id/exams/:examType` — set one exam's `billing_status` (TRIAL/ACTIVE/CANCELLED).

---

## 3.5.3 Frontend changes (`TestCrackSuperAdmin/`)

- **Create modal** (`SuperAdminInstitutes.tsx`): add an **exam multi-select** (checkboxes or multi `Select`, sourced from a shared `ExamType` constant mirroring the Prisma enum) + optional **owner phone** field.
- **Edit modal:** add `contact_email` + `contact_phone` inputs.
- **List row / detail:** render allowed exams as `brand-*` badges with per-exam status; a control to toggle an exam's status and to add/remove exams (calls the two new endpoints).
- **`superadminService.ts`:** add `setInstituteExams(id, examTypes)` and `setExamStatus(id, examType, status)`; extend `createInstitute` payload with `examTypes` + `ownerPhone`.
- **Shared exam constant:** add one `EXAM_TYPES` list in a shared location and use it everywhere (retire the ad-hoc list in `Questionbankmanager.tsx` in a follow-up).

---

## 3.5.4 Delivery order

1. Schema (`Institute` fields + `InstituteExamSubscription`) → `prisma generate` → `prisma db push` (local).
2. Backend: harden `createInstitute` (transaction + exams), extend `updateInstitute`, add the two exam endpoints, include subs in reads. `tsc --noEmit` green.
3. Frontend: exam multi-select in create, contact fields in edit, exam badges + status control, service methods.
4. Manual E2E: create institute with 2 exams → verify 2 TRIAL rows + owner invite → toggle one to CANCELLED → deactivate institute. Confirm IELTS student flows untouched.
5. Commit both repos (no co-author). VPS: `prisma db push` only (no pre-push SQL).

---

## Master-plan bookkeeping

- Status board: insert **3.5 — Super Admin institute mgmt + exam selection**.
- Phase 4.1 (`InstituteExamSubscription`) → **moved to 3.5** (structural). Phase 4 becomes **DPDP + Viva only**.
