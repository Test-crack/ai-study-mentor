# IELTS Reading Practice

## What It Does

IELTS Reading Practice is an IELTS-aligned reading-aloud workout. A student picks a model answer suited to their target band, reads it out loud twice using the microphone, and gets an AI-generated performance report covering fluency, keyword coverage, and filler word habits.

The goal is to train students to vocalise IELTS-style language accurately, at a good pace, without hesitation — which builds confidence for the real Speaking exam.

---

## The Logic (Non-Technical)

### The Learning Model

The tool is built around a simple observation: reading a model answer out loud once is rarely enough. Students need to:

1. **Understand it** before they speak — so they aren't just reading words, they're communicating ideas.
2. **Say it fluently** the first time.
3. **Reinforce key vocabulary** by reading it a second time with keyword awareness.

This creates a deliberate two-pass repetition loop that reinforces both pronunciation and phrase retention.

### What We Measure (and Why)

| Metric | What It Tells Us |
|---|---|
| **WPM (Words Per Minute)** | Too slow = hesitant; too fast = unclear. 120–160 WPM is IELTS-appropriate. |
| **Filler Words** | *Um, uh, like, you know* → deducts from the fluency score and signals poor preparation. |
| **Pauses** | Detected when speech goes silent for >2 seconds. Controlled pauses are fine; frequent ones signal difficulty. |
| **Keyword Coverage** | How many of the topic's key IELTS phrases did the student actually say in their second pass? |
| **Fluency Score** | A composite backend score derived from WPM, pauses, and fillers — expressed as a single number sent back from the server. |

### The Four Phases

```
Phase 0 — Pick a Topic
  Browse IELTS model answers, filtered by band level (5–8).
  Each card shows the topic title, band, word count, and type.

Phase 1 — Familiarise
  Read the model answer silently. Keywords are highlighted.
  Optional: view tips for the specific topic.

Phase 2 — First Pass (Read Aloud)
  Microphone is active. Live transcript appears as the student speaks.
  Filler words glow amber. Real-time WPM, word count, pauses visible.

Phase 3 — Second Pass (Keyword Focus)
  Read again. Keywords tracked in the live transcript — they light up green when spoken.
  On finish, data is sent to the backend for scoring.

Phase 4 — AI Results
  Backend returns: fluency score, weighted WPM, keywords hit, filler word breakdown.
  Student can try again or return to the dashboard.
```

---

## Architecture & Implementation

### Data Flow

```
Backend DB (IeltsReadingPractice)
        ↓  REST API
ieltsReadingService.ts
        ↓  hooks / state
StudentReadingAssessmentPage.tsx
        ↓  WebSocket
useSpeechToText.ts  →  Google Cloud STT
```

### Backend Models

- **`IeltsReadingPractice`** — stores the topic `title`, `modelAnswer`, `keywords[]`, `tips[]`, `band`, `type` (Paragraph / Essay), word count.
- **`IeltsReadingReport`** — stores each session outcome once saved (fluency score, pass1/pass2 stats, frequent fillers).

### API Endpoints

| Method | Route | Purpose |
|---|---|---|
| `GET` | `/api/ielts-reading/topics` | Paginated topic list, filterable by `band` |
| `GET` | `/api/ielts-reading/topics/:id` | Full topic with keywords & model answer |
| `POST` | `/api/ielts-reading/save` | Save pass1 + pass2 data, returns computed scores |

### Frontend State Machine

The component tracks a `Step` enum (`1 | 2 | 3 | 4`) that controls which phase the UI is in.

**Key state:**

```ts
currentStep: Step             // 1=familiarise, 2=first-pass, 3=second-pass, 4=results
selectedTopic: IeltsReadingPractice | null
sessionResults: { pass1?, pass2? }  // accumulated per pass, sent together on finish
backendResults: any           // fluencyScore, weightedWpm, keywordsHit, frequentFillers
```

### Speech-to-Text Integration

Uses the `useSpeechToText` hook which maintains a persistent WebSocket to the backend STT bridge (Google Cloud Speech-to-Text streaming). The hook exposes:

- `isListening` / `isSTTReady` — lifecycle flags
- `transcript` — running string of recognised words
- `startListening()` / `stopListening()`

**Pause detection** is done client-side by polling a timestamp ref every 500ms and counting gaps > 2 seconds since the last transcript update.

**Filler detection** is also client-side: the component keeps a set of filler words and checks each recognised word against it, excluding words that are also present in the model answer (to avoid false positives on common IELTS vocabulary).

### Scoring (Backend)

The `POST /save` controller receives raw data and runs:

```
fluencyScore = f(pass1.wpm, pass2.wpm, pauseCount, fillerCount)
weightedWpm  = (pass1.wpm + pass2.wpm) / 2  (bias toward second pass)
keywordsHit  = count of topic.keywords found in pass2 transcript (case-insensitive)
frequentFillers = sorted [ { word, count } ] pairs from combined filler maps
```

Results are persisted to `IeltsReadingReport` and returned in the response body.

### Component Structure

```
StudentReadingAssessmentPage
├── Landing (topic grid, band filter)
├── Step 1 — StepContainer (familiarise)
│   └── renderHighlightedText()   — keyword highlight in model answer
├── Step 2 — StepContainer (first pass)
│   └── renderLiveTranscript()    — live word stream, fillers amber
├── Step 3 — StepContainer (second pass)
│   └── renderLiveTranscript()    — live keyword tracking
└── Step 4 — Results panel
    └── fluencyScore, weightedWpm, keywordsHit, frequentFillers
```
