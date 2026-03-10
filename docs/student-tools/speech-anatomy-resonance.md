# Speech Anatomy & Vocal Resonance

These two modes live inside **Voice Lab** and share the same prompt system and band selector. They analyse speech from fundamentally different angles — language delivery (Anatomy) vs. acoustic quality (Resonance).

---

## Speech Anatomy

### What It Does (Logic)

Speech Anatomy dissects a student's spoken response word-by-word. Every word the student says is classified into one of three states in real time:

- 🟢 **Clean** — spoken clearly, high recognition confidence, not a filler
- 🟠 **Filler** — a hesitation word (*um, uh, like, so, basically, you know…*) that isn't part of the prompt itself
- 🟡 **Unclear** — low recognition confidence from the STT engine (below 72%)

At the end of the session, the three words-per-category drive three composite scores shown as visual "rings":

| Score | Driven By |
|---|---|
| **Confidence** | Fluency (WPM vs. target) + Pause ratio + Filler ratio |
| **Pronunciation** | Average STT word-confidence values across all spoken words |
| **Delivery** | Standard deviation of inter-chunk timing — consistent rhythm = high score |

The logic is: a student who speaks at 145 WPM, takes few pauses, avoids fillers, and speaks in consistent rhythmic bursts is demonstrating strong IELTS Speaking habits.

### The Three Phases

```
Phase 1 — Setup
  Student selects target band (5–8).
  A random speaking prompt for that band is loaded from the backend.
  WPM target range is shown (e.g. "135–160 WPM target").
  Student can request a new prompt; seen IDs are excluded to avoid repeats.

Phase 2 — Recording (Live)
  Microphone active. Live word stream appears in a dark terminal-style panel.
  Clean words appear normally. Filler words = orange pill. Unclear words = yellow pill.
  Live stats: WPM, total words, fillers, pauses — updated every second.

Phase 3 — Results
  Three score rings: Confidence, Pronunciation, Delivery.
  Supporting stats: WPM vs. target, pause count, filler count.
  Filler breakdown: sorted list of (word → count) pairs.
  Word-level dissection panel: shows all spoken words colour-coded.
```

### Architecture & Implementation

**STT Integration:**
Anatomy uses the `useSpeechToText` hook, which streams audio to Google Cloud STT via WebSocket. It exposes the `onTranscript` callback that fires on each final STT result with:

- Full text of the chunk
- Array of word-level objects: `{ word, confidence, startTime, endTime }`

The component accumulates word confidences into `wordConfidencesRef` and chunk timestamps into `chunkDurationsRef` for post-session scoring.

**Filler Detection Logic:**

```ts
// Filler if: word is in FILLER_SET AND the word is NOT in the prompt text
// (avoids flagging "actually" in an answer about "actual results")
const isFiller = FILLER_SET.has(clean) && !promptTokens.has(clean);
```

`FILLER_SET` is a shared singleton from `@/shared/data/fillers`.

**Pause Detection:**
A `setInterval` runs every 500ms while recording. If `Date.now() - lastTranscriptTime > 1800ms` and the student isn't already flagged as pausing, `pauseCount` is incremented and `isCurrentlyPausing` is set to prevent double-counting.

**Score Computation (on stop):**

```ts
const fluencyScore    = calcWpmScore(wpm)               // penalty grows away from 145 WPM
const pauseScore      = calcPauseScore(pauses, words)    // (pauses/words) × 150 penalty
const fillerScore     = calcFillerScore(fillers, words)  // (fillers/words) × 250 penalty
const confidenceScore = calcConfidence(fluency, pause, filler)  // 40/30/30 weights
const pronunciationScore = calcPronunciation(wordConfidences)   // avg × 100
const deliveryScore   = calcDelivery(chunkDurations)     // targets SD ≈ 0.6s between chunks
```

**Key State:**

```ts
phase: 'setup' | 'recording' | 'results'
dissectedWords: DissectedWord[]    // [ { word, status, confidence? } ]
fillerCount: number
wordConfidencesRef: number[]       // accumulated STT confidence per word (0–1)
chunkDurationsRef: number[]        // inter-chunk timing (seconds)
results: { confidenceScore, pronunciationScore, deliveryScore, wpm, pauseCount, fillersDetected, fillerDetails }
```

---

## Vocal Resonance

### What It Does (Logic)

Vocal Resonance analyses the *acoustic* properties of the student's voice while they speak a prompt — no speech recognition involved. It listens to the raw audio signal and measures:

| Metric | What It Measures | How |
|---|---|---|
| **Pitch** | Fundamental frequency (F0) of voiced speech | Autocorrelation on time-domain buffer (70–400 Hz range) |
| **Resonance** | Spectral centroid — "brightness" of the voice | Weighted average of frequency magnitudes across FFT bins |
| **Stress** | Amplitude dynamics — vocal contrast between syllables | IQR/median of RMS energy of voiced frames |
| **Tempo** | Syllables per second | Peak detection on RMS energy envelope with hysteresis |

Each metric is scored 0–100 based on how close it is to the **band target** for the selected level. A Band 8 student is expected to speak with more pitch variation, brighter resonance, and faster tempo than a Band 5 student.

### Band Targets

```ts
'Band 5': { pitchMin: 85,  pitchMax: 210, centroidTarget: 1400Hz, syllablesPerSec: 2.0–4.5 }
'Band 6': { pitchMin: 95,  pitchMax: 230, centroidTarget: 1600Hz, syllablesPerSec: 2.5–5.0 }
'Band 7': { pitchMin: 105, pitchMax: 250, centroidTarget: 1900Hz, syllablesPerSec: 3.0–5.5 }
'Band 8': { pitchMin: 115, pitchMax: 270, centroidTarget: 2200Hz, syllablesPerSec: 3.5–6.0 }
```

### Architecture & Implementation

**The Audio Pipeline:**

```
UserMedia (mic)
  → AudioContext
    → AnalyserNode (FFT size: 2048, smoothing: 0.75)
      → requestAnimationFrame loop at ~20fps (50ms interval)
        → detectPitch() + calcRMS() + calcSpectralCentroid() + getHeatmapRow()
          → scoring functions → metrics state → React re-render
```

Everything runs entirely in the browser via the **Web Audio API**. No audio data is sent to the server.

**The `useVocalResonance` Hook (`hooks/useVocalResonance.ts`):**

The hook is the single source of truth for live analysis. It exposes:

```ts
{
  start()              // request mic, create AudioContext, begin rAF loop
  stop(): ResonanceFinalResults  // cancel rAF, close mic, return averaged final scores
  isListening: boolean
  metrics: ResonanceMetrics      // live per-frame values (updates at ~20fps)
  heatmapHistory: Uint8Array[]   // rolling 6s of frequency heatmap rows (120 frames max)
  pitchHistory: number[]         // rolling 6s of F0 values (Hz)
  finalResults: ResonanceFinalResults | null
}
```

**DSP Primitives (`utils/resonanceUtils.ts`):**

| Function | Input | Output |
|---|---|---|
| `detectPitch(timeBuf, sampleRate)` | Float32Array time-domain signal | F0 in Hz, or `-1` if silence (RMS < 0.012) |
| `calcRMS(timeBuf)` | Float32Array | Root-mean-square amplitude |
| `calcSpectralCentroid(freqBuf, sampleRate)` | Float32Array frequency magnitudes | Frequency centroid in Hz (skips first 4 bins / <200Hz rumble) |
| `getHeatmapRow(freqBuf, sampleRate)` | Float32Array frequency magnitudes | `Uint8Array[48]` — 48 log-spaced bins from 80Hz to 8kHz, values 0–255 |
| `countSyllables(rmsHistory)` | number[] RMS history | Count of syllable nuclei (energy peaks with hysteresis) |

**Overall Score Weighting:**

```
overall = 0.30 × pitch + 0.20 × tempo + 0.25 × stress + 0.25 × resonance
```

**The Frequency Heatmap (`ResonanceCanvas.tsx`):**

The heatmap is a `<canvas>` element drawn each frame. Each column of the canvas represents one time frame; each row represents a frequency band. The 48 frequency bands are log-spaced (80Hz → 8kHz) to mirror how the ear perceives pitch. Amplitude values are mapped to a three-stop colour gradient:

```
0 (silent)     → black (#040406)
~100-150        → cyan  (#06b6d4)
255 (loud)     → white (#f8fafc)
Amber          → intermediate peaks with mid energy
```

Pitch history is overlaid as a white dot per frame, positioned vertically based on the logged F0 value within the heatmap's frequency range.

**Syllable Counting (Energy Peak Detection):**

```ts
// voiced frames only (RMS > 0.015)
// threshold = mean(voiced) × 1.4
// hysteresis: count falls once RMS drops below threshold × 0.7
// min gap between syllables: 2 frames (~100ms at 50ms/frame)
```

**Session Flow in the UI:**

```
1. Band selector → triggers new prompt load
2. Prompt banner — student reads the phrase aloud
3. Start → mic opens → rAF loop fires → metrics update live
   - Live score cards: Pitch / Resonance / Stress / Tempo (each 0–100)
   - Heatmap canvas: rolling 6s spectrogram
   - Overall score pulse banner
4. Stop → rAF cancelled → final averages computed → results overlay
   - Grade per dimension (A/B/C/D)
   - Coaching tips per metric
   - Try Again (new prompt) / Exit
```
