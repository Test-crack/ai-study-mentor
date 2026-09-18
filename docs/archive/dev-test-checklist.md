# Dev Test Checklist — Phase 6 (IELTS extraction) + Track A A0

What's live on `dev` to verify. **Two different bars:**
- **Phase 6 = ZERO CHANGE.** IELTS must behave *identically* to before. Any difference in a band/level/difficulty is a bug to fix before trusting the merge.
- **A0 = new behavior works + nothing else breaks.** Server-side institute enforcement is the one intended behavior change.

🔴 = critical / must-pass. Check `pm2 logs backend-dev` for 500s while testing.

---

## A · Phase 6 — IELTS scoring is unchanged (🔴 the whole point)

Use a seeded IELTS student. Ideally compare against a known prior result.

- [ ] 🔴 **Diagnostic — Listening & Reading:** submit a section → band appears; same band the MCQ %/answers would have produced before (0 correct → 4.0 floor, all correct → 9.0).
- [ ] 🔴 **Diagnostic — Writing:** submit an essay → band + 4 criterion breakdown; word-count penalty still caps (Task 1 <150w / Task 2 <250w).
- [ ] 🔴 **Diagnostic — Speaking:** submit audio → band + criteria; empty/noise/off-topic still floors to 4.0.
- [ ] 🔴 **Diagnostic level (A/B/C):** the level shown for the target band matches old thresholds (A <5.5, B <7.0, else C).
- [ ] 🔴 **Drills — next action:** the recommended drill targets the weakest sub-skills (weakness ranking unchanged); a sub-skill done today isn't re-offered.
- [ ] **Drills — recommendation difficulty:** BEGINNER/INTERMEDIATE/ADVANCED shown matches the band (same A/B/C cuts).
- [ ] 🔴 **IA (internal assessment):** run a scheduled IA → per-sub-skill bands + smoothing (0.4 old / 0.6 new, ±2 cap) unchanged; session completes.
- [ ] 🔴 **Mock — full test:** complete all 4 sections → **real band = mean of the 4 skill bands, rounded to 0.5** (the headline number must match old behavior exactly).
- [ ] **Mock — momentum/threshold:** momentum + "band threshold crossed" logic still fires correctly.
- [ ] 🔴 **Provenance written:** after any diagnostic/mock/IA submit, new `assessment_history` rows carry `engine_version` + `config_version` (see SQL below). *(MockSession has no such columns — expected.)*
- [ ] **Existing data intact:** a student with prior history still sees their past bands/dashboards; nothing crashes on old rows (provenance null on old rows is fine).

**Provenance SQL (pgAdmin):**
```sql
SELECT mode, band_score, engine_version, config_version, created_at
FROM assessment_history ORDER BY created_at DESC LIMIT 10;
-- rows created AFTER the deploy should have engine_version + config_version populated
```

---

## B · Track A A0 — server-side institute enforcement (🔴 the intended behavior change)

- [ ] 🔴 **Active institute, owner/admin:** all owner/admin pages work normally (summary, batches, students, instructors, analytics).
- [ ] 🔴 **Deactivated institute blocks at the API:** as SUPERADMIN, deactivate an institute → its **owner/admin** now gets **403** from `/api/institute-owner/*` and `/api/institute-admin/*` (not just a blurred UI). Re-activate → access restored.
- [ ] **SUPERADMIN unaffected:** superadmin pages work regardless of any institute's status.
- [ ] **Students & instructors not over-blocked:** an institute student/instructor still works (A0 gates only owner/admin); a **B2C student with no institute** is unaffected.

---

## C · Track A A0 — SuperAdmin (regression + new)

- [ ] 🔴 **Create institute + owner:** creates user (INSTITUTE_OWNER) + institute + exam subscriptions (TRIAL); invite email status shown.
- [ ] **Edit institute:** name/address/contact update persists.
- [ ] **Activate / deactivate institute:** toggles `is_active` (pairs with the B enforcement test).
- [ ] **Subscriptions page:** set an exam ACTIVE / CANCELLED; removing an exam → CANCELLED (row preserved, not deleted).
- [ ] 🔴 **Exam list from registry (new):** the Create/Edit institute exam picker lists exams from `GET /api/exams` — IELTS + Spoken English as selectable, others as "soon". (Add a reserved exam to the registry → it appears without a frontend change.)
- [ ] **Access rule:** a TRIAL exam behaves the same as ACTIVE (no access difference); CANCELLED = no access.

---

## D · Cross-role smoke (the four roles + student)

- [ ] **SUPERADMIN:** institutes, subscriptions, users pages load + act.
- [ ] **INSTITUTE_OWNER:** manage admins + operations/insights pages.
- [ ] **INSTITUTE_ADMIN:** students, tutors, batches CRUD.
- [ ] **INSTRUCTOR:** dashboard + assigned batches.
- [ ] 🔴 **STUDENT (IELTS) end-to-end:** login → diagnostic → dashboard → daily drills → IA → mock, with scores sane throughout. *(This is the Phase-6 acceptance run.)*

---

## E · Sign-off
- [ ] No unexpected 500s in `pm2 logs backend-dev` during the above.
- [ ] Phase 6: every band/level checked matched old behavior → **zero change confirmed**.
- [ ] A0: deactivated-institute 403 confirmed at the API; SuperAdmin CRUD + exam-list working.

If all 🔴 pass, `dev` is trustworthy for this merge and we build A1 on top with confidence.
