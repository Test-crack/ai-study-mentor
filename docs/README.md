# TestCrack Frontend — Documentation Index

> **Start here.** This is the map of everything under `docs/`. Every entry has a one-line summary so you (human or LLM) can jump straight to the right file. Paths are relative to this folder.

## How this is organised

| Folder | What lives here |
|---|---|
| [`architecture/`](#architecture) | System-wide technical & infra overview, diagrams |
| [`platform/`](#platform) | Cross-cutting platform model: roles, context-switch, the exam engine, exam config |
| [`student/`](#student) | The student experience: lifecycle, onboarding, IA/mock behaviour, practice tools |
| [`exams/`](#exams) | Per-exam content & build docs (Spoken English, OET, IELTS extraction) |
| [`frontend/`](#frontend) | Frontend engineering: developer guide, component & feature notes |
| [`backend-contracts/`](#backend-contracts) | API contracts the frontend consumes (endpoints, payload shapes, requests to backend) |
| [`archive/`](#archive) | Superseded / completed / point-in-time docs. **Not authoritative** — kept for history |

**Conventions**
- All active docs use `kebab-case.md` names and start with an `# H1` title.
- `archive/` is history: do not treat it as current truth. `archive/_assets/` holds non-documentation binaries (code copies, seed data, audio, PDF).
- ★ marks the single canonical source for a topic when several docs touch it.

---

## architecture
System context — read these first to understand the platform end-to-end.

| File | Summary |
|---|---|
| [technical-architecture-summary.md](architecture/technical-architecture-summary.md) | TestCrack technical architecture + summary of work done. The big-picture entry point. |
| [infrastructure.md](architecture/infrastructure.md) | Infrastructure & deployment architecture (hosting, services, data stores). |
| [execution-handover.md](architecture/execution-handover.md) | Project execution status & handover brief. |
| [diagrams/](architecture/diagrams/) | Architecture & flow diagrams as standalone HTML (open in a browser). |

## platform
The exam-agnostic platform model — roles, the multi-exam context switch, and the scoring **exam engine**.

| File | Summary |
|---|---|
| [roles-and-capabilities.md](platform/roles-and-capabilities.md) | ★ What each of the 6 user roles (Student, Instructor, Institute Admin/Owner, Super Admin, B2C) can actually do today, as built. |
| [context-switch-model.md](platform/context-switch-model.md) | LOCKED spec: the exam/batch **context-switch** model that makes the UI multi-exam, with data-isolation rules. |
| [exam-agnostic-implementation-plan.md](platform/exam-agnostic-implementation-plan.md) | Master plan to make the whole platform exam-agnostic. |
| [track-a-dashboards-plan.md](platform/track-a-dashboards-plan.md) | Execution plan for multi-role, exam-aware dashboards (Track A). |
| [exam-config-explorer.md](platform/exam-config-explorer.md) | A4: superadmin view-only exam-config explorer + draft/export. |
| [viva-grading-pipeline.md](platform/viva-grading-pipeline.md) | Generic, reusable spoken-assessment (viva) grading engine. |
| [exam-engine/](platform/exam-engine/) | The Exam Engine v2 spec set — see [its index](platform/exam-engine/README.md). |

## student
Everything a student experiences and how it must behave.

| File | Summary |
|---|---|
| [lifecycle.md](student/lifecycle.md) | ★ **Canonical** end-to-end student lifecycle & every feature's behaviour — current 4.0–9.0 band scale, exact formulas, momentum, edge-case table, glossary. |
| [onboarding-flow.md](student/onboarding-flow.md) | End-to-end student onboarding flow (invite → first login → diagnostic). |
| [ia-and-mock-behaviour.md](student/ia-and-mock-behaviour.md) | Internal Assessment & Mock Test behaviour reference — every scenario. |
| [diagnostics-v2-plan.md](student/diagnostics-v2-plan.md) | Diagnostics Engine V2 — plan & task split. |
| [tools/](student/tools/) | Student practice tools: [ielts-reading](student/tools/ielts-reading.md), [speed-reading](student/tools/speed-reading.md), [voice-lab](student/tools/voice-lab.md), [speech-anatomy-resonance](student/tools/speech-anatomy-resonance.md), and the reading STT [flow](student/tools/ielts-reading-stt-flow.md) / [roadmap](student/tools/ielts-reading-stt-roadmap.md). |

## exams
Per-exam content, rubrics, and build/go-live plans.

| Path | Summary |
|---|---|
| [spoken-english/](exams/spoken-english/) | Spoken English (CEFR) exam: [rubric-and-content](exams/spoken-english/rubric-and-content.md), content/IA data requirements, [implementation-plan](exams/spoken-english/implementation-plan.md), [student build](exams/spoken-english/student-build-plan.md) & [frontend spec](exams/spoken-english/student-frontend-spec.md), [go-live](exams/spoken-english/go-live.md). |
| [oet/oet-nursing-diagnostic-frontend-spec.md](exams/oet/oet-nursing-diagnostic-frontend-spec.md) | OET-Nursing diagnostic — frontend spec. |
| [ielts-extraction/](exams/ielts-extraction/) | Extracting IELTS scoring behind the engine: [guideline](exams/ielts-extraction/extraction-guideline.md) + [phased plan](exams/ielts-extraction/phased-implementation-plan.md). |

## frontend
Frontend engineering reference.

| File | Summary |
|---|---|
| [developer-guide.md](frontend/developer-guide.md) | ★ Frontend developer guide — architecture, folder layout, patterns, conventions. |
| [quick-reference.md](frontend/quick-reference.md) | Fast lookup of common frontend tasks/utilities. |
| [navbar-component.md](frontend/navbar-component.md) | The generic navbar component. |
| [progress-tracking.md](frontend/progress-tracking.md) | Frontend progress-tracking system. |
| [speed-assessment-navigation.md](frontend/speed-assessment-navigation.md) | Speed-assessment navigation implementation. |
| [client-transcript-fallback.md](frontend/client-transcript-fallback.md) | Client-side transcript fallback implementation. |
| [ia-completed-session-display.md](frontend/ia-completed-session-display.md) | Rendering a completed IA session. |
| [courses/](frontend/courses/) | Courses feature UI: [api-integration](frontend/courses/api-integration.md), [design](frontend/courses/design.md), [implementation-summary](frontend/courses/implementation-summary.md). |

## backend-contracts
API contracts the frontend depends on — endpoints, payload shapes, and formal requests to the backend team. (This is the frontend repo; these describe the boundary it consumes.)

| File | Summary |
|---|---|
| [drill-fetching-logic.md](backend-contracts/drill-fetching-logic.md) | How drills are selected/served (the contract behind daily drills). |
| [ia-scores-jsonb-format.md](backend-contracts/ia-scores-jsonb-format.md) | IA scores JSONB payload format — frontend integration guide. |
| [ia-completed-session-fix.md](backend-contracts/ia-completed-session-fix.md) | Behaviour of completed IA session display (backend-side fix notes). |
| [profile-image-upload.md](backend-contracts/profile-image-upload.md) | Profile image upload integration. |
| [data-audit-cross-role.md](backend-contracts/data-audit-cross-role.md) | Audit: data the frontend fetches but doesn't yet use. |
| [transcript-fallback-guide.md](backend-contracts/transcript-fallback-guide.md) | Client-assisted transcript fallback (server contract). |
| [courses/](backend-contracts/courses/) | Courses API: [courses-api](backend-contracts/courses/courses-api.md), [get-course](backend-contracts/courses/get-course.md), [progress-api](backend-contracts/courses/progress-api.md), [core-design](backend-contracts/courses/core-design.md), [thumbnails](backend-contracts/courses/thumbnails.md). |
| [instructor/content-management.md](backend-contracts/instructor/content-management.md) | Instructor content-management API walkthrough. |
| [rbac/](backend-contracts/rbac/) | RBAC: [instructor-dashboard-rbac](backend-contracts/rbac/instructor-dashboard-rbac.md), [user-profile](backend-contracts/rbac/user-profile.md). |
| [requests/](backend-contracts/requests/) | Formal asks to backend: [dropout-risk-notifications](backend-contracts/requests/dropout-risk-notifications.md), [student-drill-stats](backend-contracts/requests/student-drill-stats.md). |

## archive
**Not authoritative.** Superseded specs, completed one-off plans, point-in-time reports, daily standups, and non-doc assets. See [archive/README.md](archive/README.md). Notable: `superseded-student-cycle-0-9-scale.md` is the old lifecycle doc (pre 4–9 band migration) — use [student/lifecycle.md](student/lifecycle.md) instead.
