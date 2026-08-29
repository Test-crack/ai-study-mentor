# Viva Grading Pipeline — generic, reusable spoken-assessment engine

**Why this doc:** speaking/viva grading is the hardest and most valuable part of the product, and we'll need it for **every** exam with a spoken component (Spoken English now; IELTS Speaking, OET Speaking later). So we build **one generic pipeline**, driven by a per-exam **rubric config**, not a one-off per exam.

**The decision:** do **not** grade a viva with a single black-box LLM call (that's what IELTS speaking does today). Use a **staged, provider-abstracted pipeline** — the architecture serious spoken-assessment products (Pearson Versant, ETS SpeechRater, Duolingo English Test) all use: **ASR + objective delivery metrics + LLM competence grading + (calibrated) pronunciation scoring → rubric mapping.**

---

## Why staged, not single-LLM
| Concern | Single multimodal LLM | Staged pipeline |
|---|---|---|
| **Phonology / Fluency** | LLM *guesses* from audio — not calibrated, drifts | objective signals: ASR timings (pace/pauses) + a pronunciation model (phoneme accuracy, prosody) |
| **Explainability** | one opaque score | each subskill traces to evidence (timings, transcript, rationale) — needed for calibration + disputes |
| **Reliability / consistency** | varies run-to-run | deterministic stages are stable; only the language judgement is model-based |
| **Reusability** | re-prompt per exam | same pipeline, swap the rubric config |
| **Swappability** | locked to one vendor | each stage behind an interface — swap STT / LLM / pronunciation vendor freely |
| **Calibration (EE-04)** | nothing to calibrate | structured per-stage signals feed a real calibration |

The language subskills (Range, Accuracy, Coherence, Responsiveness) genuinely need an LLM — keep it there. But Fluency and Phonology are **acoustic**, and using objective signals for them is what makes the system trustworthy.

---

## The pipeline (each stage = an interface → swappable)

```
audio ─► 1. Transcribe (ASR)  ─► transcript + word timings + confidence
             │
             ├─► 2. Delivery metrics (deterministic)  ─► fluency signals (wpm, pause ratio, length)
             │
             ├─► 3. Pronunciation model  ─► phonology (phoneme accuracy, prosody, intelligibility)
             │
             └─► 4. Competence grader (multimodal LLM, audio+transcript+rubric)
                       ─► Range / Accuracy / Coherence / Responsiveness (CEFR level + rationale)
                                     │
        5. Guardrails (word count, no-speech, off-topic → retry/withhold)
                                     │
        6. Map each subskill → CEFR level → number (rubric table) → cefr_hybrid → result + profile + provenance
```

### Stage contracts (the abstraction that makes it generic + reusable)
- `Transcriber(audio) → { transcript, words:[{word,start,end,confidence}] }`
- `DeliveryAnalyzer(words) → { wpm, pauseRatio, meanPauseMs, wordCount }`
- `PronunciationScorer(audio) → { intelligibility, prosody, phonemeAccuracy }` *(optional stage)*
- `CompetenceGrader(audio, transcript, rubric) → { [subskill]: { level, rationale } }`
- `RubricMapper(allSignals, examRubric) → { [subskill]: cefrLevel }` → numbers → `cefr_hybrid`

The **exam rubric config** (subskills, descriptors, level→number table, which stage scores which subskill) is data — so IELTS Speaking / OET / Spoken English reuse the pipeline with a different rubric, no new code.

---

## Vendor choices (per stage — all swappable behind the interfaces)
- **ASR:** Google Cloud Speech-to-Text — **already in the stack** (`sttService`). (Whisper is a drop-in alternative.)
- **Delivery metrics:** deterministic code over ASR word timings. No vendor.
- **Pronunciation:** **Azure AI Speech — Pronunciation Assessment** is the industry standard (phoneme accuracy, fluency, prosody, completeness). This is the one *new* dependency worth adding for rigor.
- **Competence LLM:** **Gemini 2.5** (already wired, multimodal, temp 0, structured output). GPT-4o-audio and Claude are alternatives behind the same interface — we can A/B and pick.

---

## v1 vs v1.1 (ship reliably now, upgrade cleanly)
**v1 (build now, all in-stack — no new vendor):**
1. ASR (Google Speech) → transcript + timings.
2. Deterministic **Fluency** from timings (wpm, pauses) → maps to CEFR fluency band.
3. Multimodal **Gemini** grades Range / Accuracy / Coherence / Responsiveness (audio + transcript + rubric, temp 0, structured JSON).
4. **Phonology (pragmatic):** ASR confidence + intelligibility proxy + the LLM's phonology read. *(Flagged as the least-rigorous subskill in v1 — acceptable for a provisional A1–B2 launch.)*
5. Guardrails + `cefr_hybrid` aggregation.

**v1.1 (rigor upgrade, no rearchitecture):**
- Slot **Azure Pronunciation Assessment** into stage 3 → objective, calibrated Phonology (and a second Fluency signal). Because it's behind the `PronunciationScorer` interface, it's an additive change.

> Honest v1 caveat: Phonology is the one subskill where v1 is a proxy, not a measurement. That's fine for a provisional launch (results already carry the "estimate, not certified" disclaimer), and the interface makes the rigorous upgrade a swap, not a rewrite.

---

## How this reuses across exams
- **Spoken English:** rubric = the 6 CEFR subskills (Paul's pack), scale = `cefr_6`, aggregation = `cefr_hybrid`.
- **IELTS Speaking (future):** same pipeline, rubric = the 4 IELTS criteria, scale = `ielts_band`, aggregation = `band_mean`. Migrating IELTS speaking onto this pipeline later replaces today's single-LLM `analyzeSpeaking` with the staged version — strictly better, same output shape.
- **OET / others:** new rubric config, no new pipeline code.

---

## What this changes about the Spoken English plan (Phase 1)
Phase 1 becomes: **build this pipeline (v1 stages) as a generic `VivaGradingPipeline`**, then configure it with the Spoken English rubric — rather than a Spoken-English-specific grader. Slightly more up-front, but it's the reusable, industry-standard core the whole product leans on.
