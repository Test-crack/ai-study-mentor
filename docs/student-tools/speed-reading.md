# Speed Reading (RSVP)

## What It Does

Speed Reading trains students to read full IELTS-length reports faster while retaining comprehension. It uses **Rapid Serial Visual Presentation (RSVP)** — flashing one word at a time at a configurable speed — followed by a comprehension quiz and a backend-evaluated performance report.

---

## The Logic (Non-Technical)

### Why RSVP Works

Conventional reading involves subvocalising words (mentally "saying" them) and making eye saccades back across the page. RSVP eliminates both by keeping the eye fixed on one point while words stream past. This trains the brain to process text faster than it would normally "read" it.

The tradeoff is comprehension: if you go too fast, you absorb words without understanding them. The quiz measures how much you actually retained, and the system adapts its WPM suggestion after each session.

### The ORP (Optimal Recognition Point)

Each word is rendered with a highlighted **pivot letter** — approximately the first third of the word. Research shows the eye naturally lands near this position when reading. By fixing this letter in the crosshairs, the display mimics natural fixation and reduces mental effort.

```
  "projection" → split at index 4 → "proj|e|ction"
                  left part: dark text | pivot (red) | right part: dark text
```

### The Session Flow

```
1. Dashboard
   — Browse reports by category (Tech & VC, Business, Literature)
   — Preview the selected report (title, source, word count, estimated time at current WPM)
   — Set reading speed (200–800 WPM slider)

2. Reader (RSVP)
   — Words flash one at a time at 60000 / WPM ms intervals
   — Progress bar + word counter visible at the bottom
   — Pause/Resume at any time; speed adjustable on the fly
   — On finish: "Reading Complete" screen with option to start the quiz (if questions exist)

3. Quiz
   — Multi-question comprehension test (MCQ + True/False/Not Given)
   — Step-circle navigation, questions answered individually
   — Must answer all questions to submit

4. Analysis
   — Backend evaluates: retention score (% correct), grade, efficiency score, next WPM suggestion
   — Per-question breakdown with correct answer + explanation
   — Options to read again or return to dashboard
```

### What We Measure

| Metric | Meaning |
|---|---|
| **WPM** | Words per minute at which the student read |
| **Retention Score** | `(correct answers / total questions) × 100` |
| **Grade** | A (≥80%), B (≥60%), C (≥50%), F (below 50%) |
| **Efficiency Score** | `retention × 0.6 + speed_score × 0.4` — balances speed and comprehension |
| **Ideal WPM Suggestion** | Next session target: +50 WPM if retention ≥ 70%, -50 WPM otherwise |
| **Speed Category** | Developing (<400), Proficient (400–549), Advanced (≥550) |

---

## Architecture & Implementation

### Data Models

**`IeltsSpeedReadingReport`** (the passage):

```ts
{
  id, title, source, category, text, wordCount
}
```

**`IeltsSpeedReadingExercise`** (linked questions):

```ts
{
  id, reportId, type: 'MCQ' | 'TRUE_FALSE_NOT_GIVEN',
  stem, options: string[], answer, explanation?
}
```

Questions live in a separate table, not a JSON field. The backend joins them when fetching a report by ID.

### API Endpoints

| Method | Route | Purpose |
|---|---|---|
| `GET` | `/api/speed-reading/reports` | List of all report summaries (id, title, category, wordCount, source) |
| `GET` | `/api/speed-reading/reports/:id` | Full report with text + joined questions array |
| `POST` | `/api/speed-reading/submit` | Submit answers + session stats → returns `SessionEvaluation` |

**`SessionEvaluation` shape:**

```ts
{
  retentionScore, wpm, readingTimeSeconds,
  correct, total, grade,
  speedCategory, speedScore, efficiencyScore,
  feedback: string[],          // AI-generated coaching tips
  idealWpmSuggestion,
  scoredAnswers: [{
    questionId, type, stem, options,
    correctAnswer, userAnswer, isCorrect, explanation
  }]
}
```

### Frontend View State Machine

```ts
type View = 'dashboard' | 'reader' | 'quiz' | 'analysis';
```

All four views live inside one component (`SpeedReading`). Transitions happen via `setView()`.

**Key refs & state:**

```ts
startRef         // Date.now() when reading started (used to compute readingTimeSeconds)
words[]          // text.trim().split(/\s+/) — word-by-word array
wordIdx          // current word pointer, incremented by setInterval at 60000/wpm ms
isPlaying        // drives the interval
isFinished       // true when wordIdx reaches end of array
```

### RSVP Rendering

```ts
function renderWord(word: string) {
  const pivot = Math.ceil(word.length * 0.35) - 1;
  return (
    <span>{word.slice(0, pivot)}</span>          // grey, right-aligned
    <span className="text-red-500">{word[pivot]}</span>  // pivot letter
    <span>{word.slice(pivot + 1)}</span>          // grey, left-aligned
  );
}
```

### RSVP Timer

```ts
useEffect(() => {
  if (isPlaying && !isFinished) {
    const t = setInterval(() => {
      setWordIdx(p => {
        if (p >= words.length - 1) { setIsPlaying(false); setIsFinished(true); return p; }
        return p + 1;
      });
    }, 60000 / wpm);
    return () => clearInterval(t);
  }
}, [isPlaying, wpm, words.length, isFinished]);
```

Every time `wpm` changes (slider drag), the interval is re-created at the new rate — so speed changes take effect immediately mid-read.

### Offline Fallback

If the `POST /submit` call fails (no network), the component falls back to local scoring:

- Retention = `(correct / total) × 100` computed from the client's answer map
- Grade, speed category, and efficiency score computed with the same formulas the backend uses
- A `"Results computed offline"` message is added to the feedback array

This ensures students always see their results, even with a flaky connection.

### Category & Report Navigation

Reports are grouped by `category`. Within each category, a prev/next chevron cycles through multiple reports (`repIdx`). Changing `activeCategory` resets `repIdx` to 0. The category tabs are derived dynamically from the fetched reports list — no hard-coded list.
