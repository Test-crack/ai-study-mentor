# Release Backlog — Pending Items
**Last updated:** 14 May 2026 | **Branch:** `feature/ielts-flow`

Items are ordered by priority. Each has a clear owner action and effort estimate.

---

## 🔴 Blocking (must ship before first institute demo)

| # | Item | What needs to happen | Effort |
|---|---|---|---|
| 1 | **Listening audio file** | Run TTS on transcript in `docs/ia_testing_checklist.md` → save as `public/mock/audio/riverside_heritage_museum.mp3`. LISTENING section will silently fail without this. | 15 min — generate + copy file |
| 2 | **Assessment History page** | Students have no way to review past IA or Mock scores after navigating away. Data exists in `assessment_history`, `ia_sessions`, `mock_sessions`. Build a `/student/assessment-history` page. | 1 day |

---

## 🟡 Post-Demo Sprint 1 (IA feature-complete)

| # | Item | Spec ref | What needs to happen |
|---|---|---|---|
| 3 | **IA eligibility milestone: +50 momentum** | flow_v3 line 558 | Fire when student first meets 6 drills + 2 days + DCS ≥ 40%. Add a one-time flag (e.g., `ia_eligibility_rewarded BOOLEAN` on `institute_students`) to prevent repeat awards. Backend: add check in `getIAStatus`. |
| 4 | **24-hour wait after IA eligibility unlock** | flow_v3 "24-HOUR MANDATORY WAIT" | Add `ia_eligible_since TIMESTAMPTZ` to `institute_students`. In `getIAStatus`, `can_start_test = is_ia_day && prerequisites_met && dcs_eligible && (now - ia_eligible_since) >= 24h`. |
| 5 | **`carry_forward_subskills` → next IA session** | IA plan Stage 7 Path C | In `getIAQuestions`, before calling `selectPrioritySubSkills`, check most recent MISSED session for `carry_forward_subskills`. Pass them to `subskillSelector` as forced inclusions. |

---

## 🟡 Post-Demo Sprint 2 (Tutor Alerts & Safety Nets)

| # | Item | Spec ref | What needs to happen |
|---|---|---|---|
| 6 | **Consecutive IA miss escalation — Level 2** | flow_v3 lines 656-669 | Track consecutive miss count. On second consecutive MISSED session: send tutor alert with student name, last login date, exam proximity. Requires a notification/alert table and tutor-facing endpoint. |
| 7 | **3-week / <6 IAs — Tutor Level 1 alert** | flow_v3 lines 685-697 | Background check (cron or on login): `account_age ≥ 21 days AND ia_sessions(COMPLETED) < 6`. If triggered, write a tutor alert record. |
| 8 | **Second consecutive miss: flat -40 momentum** | flow_v3 line 661 | Current: flat -20 per missed session regardless. Add a `consecutive_miss_count` field to `institute_students`. Deduct -20 on first, -40 total on second (extra -20 more), reset on COMPLETED. |

---

## 🟢 Quality / Polish (whenever)

| # | Item | Notes |
|---|---|---|
| 9 | Remove debug `console.group/log` blocks from `StudentDashboardPage.tsx` (lines 551-565) | Log pollution in production |
| 10 | Mock questions: seed WRITING MCQ and SPEAKING MCQ (16 each) | Already have prompts; need MCQ grammar/vocab questions tagged by sub-skill |
| 11 | Mock band scale — confirm 1–10 → IELTS conversion is smooth for fractional inputs | iaGrading now uses 0.5 increments (fixed), but worth a QA pass on edge cases |
| 12 | LexiGrid practice mode: persist practice round count to analytics | Currently practice rounds aren't tracked — could add to StudentGameScore with `is_practice=true` |

---

## ✅ Done (reference)

- IA full implementation (Paths A/B/C, MCQ+AI grading, per-section timers, miss detection)
- Mock full implementation (backend 4 endpoints, frontend, 80 questions seeded, abandoned sweep)
- Dashboard widgets: IAScheduleWidget, MockStatusWidget
- LexiGrid practice mode (unlimited play, momentum only on first round)
- DB schema: `ia_questions`, `ia_sessions`, `mock_questions`, `mock_sessions`, all enums
- Context doc: `docs/ia_context_llm.md`, `docs/mock_implementation_plan.md`
