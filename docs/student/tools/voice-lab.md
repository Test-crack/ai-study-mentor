# Voice Lab

## What It Does

Voice Lab is the parent hub for two distinct voice-training modes: **Speech Anatomy** and **Vocal Resonance**. Students land on a home dashboard and choose which engine to train with. Both modes pull AI-generated speaking prompts calibrated to the student's target IELTS band (5–8).

---

## The Logic (Non-Technical)

### Two Engines, One Lab

The two modes solve different problems:

| Engine | Problem It Solves | What It Measures |
|---|---|---|
| **Speech Anatomy** | *Is the student speaking clearly, with the right pacing, without filler words?* | Word confidence, filler words, pauses, delivery rhythm |
| **Vocal Resonance** | *Does the student's voice quality — pitch, tone, speed — match a native speaker?* | Live pitch (Hz), spectral centroid, tempo (syllables/sec), amplitude dynamics |

They share the same prompt system and band-level targeting, but analyse speech at completely different layers — language delivery vs. acoustic quality.

### Band Targeting

Both engines load prompts from the same database, tagged to a band level (5, 6, 7, or 8). The difficulty and WPM targets in the prompts scale with band level. A Band 8 prompt expects faster, more dynamic speech with richer vocabulary than a Band 5 prompt.

---

## Architecture & Implementation

### Component Tree

```
VoiceLab (root)
├── HomeView           — landing/hub with CTAs to each mode
├── AnatomyView        — Speech Anatomy mode (see speech-anatomy-resonance.md)
└── ResonanceView      — Vocal Resonance mode (see speech-anatomy-resonance.md)
```

View routing is controlled by a `ViewState` enum (`'dashboard' | 'anatomy' | 'resonance'`) held in the root component's state. There is no URL-based routing between views — it's a single-page widget.

### Shared Prompt System

Both modes call the same endpoint:

```
GET /api/voice-lab/prompt/random
  ?band=Band 7
  ?mode=anatomy | resonance
  &exclude[]=id1&exclude[]=id2    // avoid repeats across refreshes
```

**`VoicePrompt` shape:**

```ts
{
  id: string
  question: string        // the speaking prompt text
  band: string            // 'Band 5' | 'Band 6' | 'Band 7' | 'Band 8'
  mode: 'anatomy' | 'resonance'
  targetWpmMin: number
  targetWpmMax: number
  hint?: string           // optional coaching hint shown below the prompt
}
```

The `seenPromptIdsRef` (a ref array of recently shown IDs) is passed as the `exclude` parameter so the student gets a fresh prompt each time they click "New prompt", cycling through the entire pool before repeating.

### Score Helpers (Shared Between Both Modes)

These utility functions live in `VoiceLab.tsx` and drive the Anatomy scoring:

```ts
calcWpmScore(wpm)         // target 145 WPM, penalises deviation
calcPauseScore(pauses, words)  // fewer pauses per word = better
calcFillerScore(fillers, words) // filler-to-word ratio penalty
calcConfidence(f, p, fi)  // weighted composite: 40% fluency, 30% pause, 30% filler
calcPronunciation(confs)  // average of STT word-confidence values (0–1 → 0–100)
calcDelivery(durations)   // standard deviation of inter-chunk timing; targets SD ≈ 0.6s
```

### Navigation Pattern

The root `VoiceLab` component owns the `activeTab` state. Each child view receives `onExit` (returns to home) and `onNavigate` (switches modes directly). This lets students jump between Anatomy and Resonance without returning to the home screen.
