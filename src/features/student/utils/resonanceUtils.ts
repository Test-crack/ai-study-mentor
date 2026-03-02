/**
 * resonanceUtils.ts — Browser DSP primitives for Vocal Resonance.
 * Rewritten for robustness: filters silence, uses IQR-based stress, better syllable gating.
 */

// ── Pitch detection (autocorrelation) ─────────────────────────────────────

export function detectPitch(buffer: Float32Array, sampleRate: number): number {
    const SIZE = buffer.length;
    const MIN_HZ = 70;
    const MAX_HZ = 400;
    const minPeriod = Math.floor(sampleRate / MAX_HZ);
    const maxPeriod = Math.floor(sampleRate / MIN_HZ);

    const rms = calcRMS(buffer);
    if (rms < 0.012) return -1;  // gate on silence

    let bestCorr = 0;
    let bestPeriod = -1;
    for (let period = minPeriod; period <= maxPeriod; period++) {
        let corr = 0;
        for (let i = 0; i < SIZE - period; i++) corr += buffer[i] * buffer[i + period];
        corr /= SIZE - period;
        if (corr > bestCorr) { bestCorr = corr; bestPeriod = period; }
    }
    if (bestPeriod < 0 || bestCorr < 0.012) return -1;
    return sampleRate / bestPeriod;
}

// ── Amplitude ─────────────────────────────────────────────────────────────

export function calcRMS(buffer: Float32Array): number {
    let sum = 0;
    for (let i = 0; i < buffer.length; i++) sum += buffer[i] * buffer[i];
    return Math.sqrt(sum / buffer.length);
}

// ── Spectral centroid ──────────────────────────────────────────────────────

export function calcSpectralCentroid(freqData: Float32Array, sampleRate: number): number {
    const N = freqData.length;
    const binHz = sampleRate / (N * 2);
    let weightedSum = 0, magnitudeSum = 0;
    for (let i = 4; i < N; i++) {   // skip first 4 bins (< 200Hz = rumble)
        const mag = Math.pow(10, Math.max(freqData[i], -100) / 20);
        const freq = i * binHz;
        weightedSum += freq * mag;
        magnitudeSum += mag;
    }
    return magnitudeSum === 0 ? 0 : weightedSum / magnitudeSum;
}

// ── Heatmap row ────────────────────────────────────────────────────────────

export const HEATMAP_BANDS = 48;

export function getHeatmapRow(freqData: Float32Array, sampleRate: number): Uint8Array {
    const row = new Uint8Array(HEATMAP_BANDS);
    const N = freqData.length;
    const binHz = sampleRate / (N * 2);
    const logMin = Math.log2(80);
    const logMax = Math.log2(8000);

    for (let b = 0; b < HEATMAP_BANDS; b++) {
        const freqLo = Math.pow(2, logMin + (b / HEATMAP_BANDS) * (logMax - logMin));
        const freqHi = Math.pow(2, logMin + ((b + 1) / HEATMAP_BANDS) * (logMax - logMin));
        const binLo = Math.max(0, Math.floor(freqLo / binHz));
        const binHi = Math.min(N - 1, Math.ceil(freqHi / binHz));
        let sum = 0, count = 0;
        for (let i = binLo; i <= binHi; i++) {
            sum += Math.max(0, (freqData[i] + 100) * 2.55);
            count++;
        }
        row[b] = count > 0 ? Math.min(255, sum / count) : 0;
    }
    return row;
}

// ── Syllable counting ──────────────────────────────────────────────────────

/**
 * Energy-envelope peak detection with hysteresis and minimum frame gap.
 * Each crossing from below→above threshold = one syllable nucleus.
 */
export function countSyllables(rmsHistory: number[]): number {
    if (rmsHistory.length < 3) return 0;
    const voiced = rmsHistory.filter(r => r > 0.015);
    if (voiced.length === 0) return 0;

    const mean = voiced.reduce((s, v) => s + v, 0) / voiced.length;
    const threshold = mean * 1.4;
    const hysteresisDown = threshold * 0.7;
    const MIN_FRAMES_BETWEEN = 2; // ~100ms at 50ms/frame

    let count = 0;
    let above = false;
    let framesSincePeak = MIN_FRAMES_BETWEEN + 1;

    for (const rms of rmsHistory) {
        framesSincePeak++;
        if (rms > threshold && !above && framesSincePeak > MIN_FRAMES_BETWEEN) {
            count++;
            above = true;
            framesSincePeak = 0;
        } else if (rms < hysteresisDown) {
            above = false;
        }
    }
    return count;
}

// ── Band targets ───────────────────────────────────────────────────────────

export interface BandTargets {
    pitchMin: number;
    pitchMax: number;
    centroidTarget: number;
    syllablesPerSec: { min: number; max: number };
}

export const BAND_TARGETS: Record<string, BandTargets> = {
    'Band 5': { pitchMin: 85, pitchMax: 210, centroidTarget: 1400, syllablesPerSec: { min: 2.0, max: 4.5 } },
    'Band 6': { pitchMin: 95, pitchMax: 230, centroidTarget: 1600, syllablesPerSec: { min: 2.5, max: 5.0 } },
    'Band 7': { pitchMin: 105, pitchMax: 250, centroidTarget: 1900, syllablesPerSec: { min: 3.0, max: 5.5 } },
    'Band 8': { pitchMin: 115, pitchMax: 270, centroidTarget: 2200, syllablesPerSec: { min: 3.5, max: 6.0 } },
};

function clamp(v: number, lo = 0, hi = 100) { return Math.min(hi, Math.max(lo, v)); }

// ── Scoring ────────────────────────────────────────────────────────────────

/** Pitch score — how close median F0 is to the target range. */
export function scorePitch(pitchSamples: number[], band: string): number {
    const voiced = pitchSamples.filter(p => p > 0);
    if (voiced.length === 0) return 50;
    const target = BAND_TARGETS[band] ?? BAND_TARGETS['Band 7'];
    const sorted = [...voiced].sort((a, b) => a - b);
    const median = sorted[Math.floor(sorted.length / 2)];
    const mid = (target.pitchMin + target.pitchMax) / 2;
    const range = (target.pitchMax - target.pitchMin) / 2;
    return Math.round(clamp(100 - (Math.abs(median - mid) / range) * 55));
}

/** Tempo score from actual syllables-per-second. Falls back to 45 if uncountable. */
export function scoreTempo(syllPerSec: number, band: string): number {
    if (syllPerSec <= 0) return 45; // graceful fallback
    const target = BAND_TARGETS[band] ?? BAND_TARGETS['Band 7'];
    const mid = (target.syllablesPerSec.min + target.syllablesPerSec.max) / 2;
    const range = (target.syllablesPerSec.max - target.syllablesPerSec.min) / 2;
    return Math.round(clamp(100 - (Math.abs(syllPerSec - mid) / Math.max(range, 0.5)) * 55));
}

/**
 * Resonance score — spectral centroid proximity to band target.
 * Filters low-freq rumble and high-freq artifacts before scoring.
 */
export function scoreResonance(centroidSamples: number[], band: string): number {
    // Filter: only voiced-range centroid values (300Hz–7kHz)
    const valid = centroidSamples.filter(c => c > 300 && c < 7000);
    if (valid.length === 0) return 50;
    const target = BAND_TARGETS[band] ?? BAND_TARGETS['Band 7'];
    const sorted = [...valid].sort((a, b) => a - b);
    const median = sorted[Math.floor(sorted.length / 2)];
    const pct = Math.abs(median - target.centroidTarget) / target.centroidTarget;
    return Math.round(clamp(100 - pct * 90));
}

/**
 * Stress score — amplitude dynamics of voiced segments only.
 * Uses IQR / median of voiced frames (silence is excluded).
 * Good expressive speech: normalised IQR ≈ 0.35–0.65.
 */
export function scoreStress(rmsSamples: number[]): number {
    const voiced = rmsSamples.filter(r => r > 0.015);
    if (voiced.length < 4) return 50;
    const sorted = [...voiced].sort((a, b) => a - b);
    const n = sorted.length;
    const p25 = sorted[Math.floor(n * 0.25)];
    const p50 = sorted[Math.floor(n * 0.50)];
    const p75 = sorted[Math.floor(n * 0.75)];
    const iqr = p75 - p25;
    // Normalised IQR relative to median loudness
    const normIQR = p50 > 0 ? iqr / p50 : 0;
    // Target: 0.35–0.65 → good dynamics. < 0.2 = monotone. > 0.9 = erratic.
    return Math.round(clamp(100 - Math.abs(normIQR - 0.50) * 90));
}
