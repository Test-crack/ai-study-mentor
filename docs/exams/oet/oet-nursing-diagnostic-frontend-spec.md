# OET-Nursing — Diagnostic Frontend Spec

**Audience:** frontend engineer building the OET (profession: Nursing) diagnostic experience.
**Scope:** the diagnostic flow + its results. *Display + capture only* — all scoring is server-side.
Keep **IELTS and Spoken English 100% intact** — branch on the exam, never fork.

> **Backend status:** the OET diagnostic backend is **done** on branch `feature/oet-nursing`
> (L/R/W/S graders, all on the OET 0–500 scale). What's outstanding is **content** (seeded questions)
> — so you can build against the contracts below now; live data follows. Endpoints that don't yet
> have seeded content return a clear `*_not_seeded` error (render an empty/"coming soon" state).

---

## 0. The rules that govern everything

1. **Never rewrite an IELTS/SE code path.** `if (isOet) {…} else {…existing…}`, or read from config.
2. **OET has NO overall grade.** This is non-negotiable and legally required — OET reports a grade
   **per sub-test only**. Never compute, display, or imply an "overall OET score/band". Show four
   independent results.
3. **Scores are `0–500` + a letter grade `A–E`**, reported in **10-point steps** (e.g. 350, 360).
   No decimals, no `/9`, no "band".
4. **This is a healthcare exam.** Nursing/clinical framing throughout; Speaking is a **clinical
   role-play**, not a chat.
5. **Legal:** the product is named **"Healthcare English Preparation"** — **do not put "OET" in the
   product name/UI chrome**, and never imply affiliation/endorsement. Show the disclaimer near results
   (§8).

---

## 1. Detecting OET

`profile.examId === 'oet_nursing'` (from `useAuth().profile`). Add to the exam helpers alongside
`isSpokenEnglish`:

```ts
export const isOet = (examId?: string | null) => examId === 'oet_nursing';
```

Everything else is config- or route-driven (below), not scattered string checks.

---

## 2. What's different about OET (vs IELTS / SE)

| Concept | IELTS | Spoken English | **OET-Nursing** |
|---|---|---|---|
| Assessed skills | L/R/W/S | Speaking only | **L/R/W/S (all four)** |
| Scale | band 0–9 | CEFR level | **0–500 + grade A–E, per sub-test** |
| Overall | mean band | CEFR level | **none — per-component only** |
| Speaking | Q&A | CEFR viva | **clinical role-play (record & submit)** |
| Writing | essay | — | **case notes → professional letter (referral)** |
| Target | band + date | CEFR level | **per-component** (NMC: L350/R350/**W300**/S350) |

**The 4 sub-tests** for the diagnostic (mockup already exists): Intro → **Listening** (MCQ) →
**Reading** (MCQ) → **Writing** (letter) → **Speaking** (role-play) → results.

---

## 3. Per-exam display config

Add an `oet_nursing` entry to the exam-display config (mirrors `EXAM_DISPLAY.ielts` / `.spoken_english`):

```ts
oet_nursing: {
  examId: 'oet_nursing',
  scale: 'oet_500',                 // 0–500 + A–E, per component (NO overall headline)
  headlineLabel: null,              // there is no overall grade — render per-component cards
  showSkills: ['listening', 'reading', 'writing', 'speaking'],
  showTargetAndReadiness: true,     // per-component targets (NMC preset), not a single band
  perComponentGrades: true,
  productName: 'Healthcare English Preparation',   // never render "OET" in chrome
  disclaimer: 'Practice materials only. Scores shown are practice estimates and are not official results.',
}
```

Add an OET score formatter used everywhere a score prints:
```ts
// e.g. { score: 350, grade: 'B' } -> "350 · B"
export const oetScoreLabel = (s?: { score?: number; grade?: string } | null) =>
  s && Number.isFinite(s.score) ? `${s.score} · ${s.grade ?? ''}`.trim() : '—';
```

---

## 4. The diagnostic flow (the 5 screens)

Route (exam-prefixed, like the rest of the student app): `/oet_nursing/diagnosis` → dispatch to the OET
diagnostic page. Section order: **Intro → Listening → Reading → Writing → Speaking**. Each section is
**timed separately**; a finished section can't be re-entered (one-time diagnostic).

Gate the whole page on `GET /api/diagnostic/status` (§5.1): resume/skip finished sections; if
`isDiagnosed`, go to results.

**Listening & Reading** — reuse the **IELTS diagnostic MCQ components** (same `GET
/questions/:skill` + `POST /submit/:skill`). Only the results labelling differs (grade, not band).
Listening plays audio; Reading shows a passage/notice + MCQ.

**Writing** — case notes → letter. Render the served **case notes** and **task** (from
`/questions/writing`), a letter textarea, a timer, and a word counter (guidance ~180–200 words; there
is **no** hard word-limit penalty — don't block submit on it). Submit via `POST /submit/writing`.

**Speaking (clinical role-play)** — the one genuinely new UI (§6). Fetch role-play prompts from
`GET /oet-speaking/prompts`, record one answer per prompt, then submit **all** recordings via `POST
/oet-speaking/submit`.

---

## 5. Data contracts (what the API returns)

Base: `VITE_BACKEND_URL`, `Authorization: Bearer <supabase token>`, `X-Exam-Id` handled by your
`callBackend` wrapper. All endpoints resolve the student's single enrollment.

### 5.1 `GET /api/diagnostic/status`
```jsonc
{ "isDiagnosed": false,
  "listening_scored": true, "reading_scored": false,
  "writing_scored": false,  "speaking_scored": false,
  "overall_complete": false,
  "reset_marker": "2026-09-08T..." }   // if this changes vs your cache, discard cached progress
```

### 5.2 `GET /api/diagnostic/questions/:skill`  (`listening` | `reading` | `writing`)
Same shape as the IELTS diagnostic (reuse those components). For **writing**, the item carries the
**case notes** (`passage_text`) and the **task** (`prompt_text`, plus `min_words`). Render both.

### 5.3 `POST /api/diagnostic/submit/:skill`  (`listening` | `reading` | `writing`)  — JSON
Body: `{ answers, taskType? }` (L/R: `{ [questionId]: "A" }`; writing: `{ text: "<letter>" }`).
Response (OET):
```jsonc
{ "message": "...",
  "overallComplete": false,
  "bandScore": 6.5,                 // internal normalised 0–9 — DO NOT show for OET
  "sub_scores": {
    "score": 360, "grade": "B", "display": "360 (B)", "scale_id": "oet_500",
    // L/R only:
    "total_questions": 42, "correct_answers": 30, "accuracy_percentage": 71,
    // Writing only:
    "word_count": 190, "is_valid_attempt": true, "meets_grade_b": true, "below_grade_b": [],
    "raw_score": 34,
    "criteria": { "purpose": { "label":"Purpose","score":3,"max":3,"meets_b":true,"rationale":"…","evidence":["…"] }, "content": {…}, "conciseness_clarity": {…}, "genre_style": {…}, "organisation_layout": {…}, "language": {…} },
    "feedback": { "overall_summary":"…", "strengths":["…"], "priority_action":"…" }
  } }
```
**Show `sub_scores.score` + `sub_scores.grade`**, never `bandScore`.

### 5.4 `GET /api/diagnostic/oet-speaking/prompts`
```jsonc
{ "examId": "oet_nursing", "alreadyDiagnosed": false,
  "prompts": [
    { "id": "uuid", "order": 1,
      "scenario": "SETTING · Orthopaedic ward. You are the nurse caring for a 68-year-old …",
      "setting": "Orthopaedic ward",
      "prepSeconds": 20, "speakSeconds": 90,
      "interlocutorAudioUrl": null }   // optional patient/carer voice line
  ] }
```
If empty content: `400 { error: 'speaking_not_seeded' }` → render "coming soon".

### 5.5 `POST /api/diagnostic/oet-speaking/submit`  — multipart/form-data
**One audio file per prompt; each file's field name = that prompt's `id`.** (Same convention as the
SE viva submit — reuse that upload code.)
```jsonc
{ "message": "...", "overallComplete": true,
  "oetScore": 370, "grade": "B",
  "sub_scores": {
    "score": 370, "grade": "B", "display": "370 (B)",
    "is_valid_attempt": true, "meets_grade_b": true, "below_grade_b": [], "raw_score": 31,
    "criteria": {
      "intelligibility": { "label":"Intelligibility","group":"linguistic","score":5,"max":6,"meets_b":true,"rationale":"…" },
      "fluency": {…}, "appropriateness": {…}, "grammar_expression": {…},
      "relationship_building": { "group":"clinical","score":2,"max":3,… }, "patient_perspective": {…},
      "structure": {…}, "information_gathering": {…}, "information_giving": {…}
    },
    "transcripts": ["<candidate transcript per recording>"],
    "feedback": { "overall_summary":"…", "clinical_communication":"…", "strengths":["…"], "priority_action":"…" }
  } }
```

### 5.6 `GET /api/student/competency-scores` (results surface)
Four rows (LISTENING/READING/WRITING/SPEAKING). Each row's `sub_scores` holds `{ score, grade,
criteria, feedback, … }` as above. **Ignore `current_band` / any overall — there is none for OET.**

---

## 6. The clinical role-play recorder (new UI)

The one net-new build. Per role-play prompt:
1. Show the **scenario** (setting + your role + the task). Optionally play `interlocutorAudioUrl`
   (the patient/carer line) once.
2. **Prep countdown** (`prepSeconds`), then **record** (cap at `speakSeconds`) via `MediaRecorder`.
3. Let the student **re-record** before moving on; show a progress rail across prompts.
4. **Reuse the SE viva recorder** wholesale — `MediaRecorder` mechanics + the IndexedDB cache
   (`vivaRecordingCache`) so an in-progress role-play survives a refresh. Namespace the cache keys by
   `oet_nursing` (e.g. `oet_nursing:<promptId>`), and clear on successful submit.
5. On the final screen, submit **all** recordings in one multipart request (§5.5), field name =
   prompt `id`. Show a grading spinner; on `502 { can_retry }`, offer retry (don't lose recordings).

---

## 7. Results display (per-component — NO overall)

Render **four independent result cards** (L/R/W/S), each showing:
- The **grade badge (A–E)** + the **0–500 score** (`oetScoreLabel`). Colour by grade (E→red … A→green).
- **vs target** (per-component NMC target — see §9): a small "meets B (350)" / "below target" chip.
- **Writing/Speaking**: expandable **criteria breakdown** — Writing's 6 criteria (each with score/max +
  rationale + evidence), Speaking's **two groups** (4 linguistic /6, 5 **clinical-communication** /3).
  Surface the **clinical-communication** feedback line prominently — it's the healthcare differentiator.
- **Feedback**: `overall_summary`, `strengths`, and the single `priority_action`.

Explicitly **do not** render any aggregate/overall number. A short caption is fine: *"OET reports a
grade per sub-test — there is no overall grade."*

---

## 8. Legal / compliance (non-negotiable)

- Product/UI name: **"Healthcare English Preparation"** — never "OET …" in the product name or nav.
- Show the disclaimer near any result: *"Practice materials only. Scores shown are practice estimates
  and are not official results."* Full disclaimer at onboarding.
- **Never** claim affiliation, endorsement, or that results are official/"OET certified".
- (Backend note: OET is `status: reserved` and legal is counsel-blocked — this experience is for
  build/preview, not public launch, until legal clears.)

---

## 9. Targets & readiness (per-component)

OET targets are **per sub-test**, not a single number. Default to the **NMC** preset
(L350/R350/**W300**/S350 = B/B/C+/B). Backend storage of a student's chosen targets is a small pending
item (**D2**) — until it lands, you can **read the NMC defaults from config** and show "target: B (350)"
per component. Don't build a single-band target UI for OET.

---

## 10. What to reuse vs build

- **Reuse:** IELTS diagnostic MCQ components (L/R), the diagnostic timer/section framing, the SE viva
  **recorder + IndexedDB cache** (for the role-play), `callBackend`, the results card shell.
- **Build:** the OET diagnostic dispatch page, the **role-play recorder** flow, the **per-component
  results** view (grades, criteria breakdowns, no overall), and the `EXAM_DISPLAY.oet_nursing` config +
  `oetScoreLabel`.

---

## 11. Acceptance checklist
- [ ] An OET student routes to `/oet_nursing/diagnosis` and completes Intro → L → R → W → Speaking.
- [ ] IELTS & SE diagnostics unchanged.
- [ ] No overall/aggregate OET score is ever shown; four per-component grades (A–E + 0–500) are.
- [ ] `bandScore` is never displayed for OET; `sub_scores.score`/`grade` are.
- [ ] Role-play recorder: prep→record→re-record, survives refresh, submits all recordings (field =
      prompt id), handles retry on 502.
- [ ] Writing shows case notes + task; word counter is guidance only (no hard block).
- [ ] Results show Writing's 6 criteria and Speaking's 4 linguistic + **5 clinical-communication**
      criteria, with the clinical-communication feedback surfaced.
- [ ] "Healthcare English Preparation" naming; disclaimer near results; no affiliation claims.
- [ ] Empty/"not seeded" states render cleanly (no crashes) before content lands.

---

## 12. Backend endpoints (reference — all live on `feature/oet-nursing`)
| Endpoint | Purpose |
|---|---|
| `GET /api/diagnostic/status` | per-component completion + `isDiagnosed` |
| `GET /api/diagnostic/questions/:skill` | L/R MCQ; Writing = case notes + task |
| `POST /api/diagnostic/submit/:skill` | grade L/R/W → `oet_500` (score+grade+criteria in `sub_scores`) |
| `GET /api/diagnostic/oet-speaking/prompts` | role-play scenarios |
| `POST /api/diagnostic/oet-speaking/submit` | multipart, 1 audio/prompt → 9-criteria `oet_500` result |
| `GET /api/student/competency-scores` | results — 4 per-component rows (no overall) |

> If a display need can't be met from these responses, file it — a small backend shaping change is
> cheaper than client guesswork. Don't recompute OET scores/grades on the client.
