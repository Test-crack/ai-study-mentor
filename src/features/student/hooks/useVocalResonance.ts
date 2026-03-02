/**
 * useVocalResonance.ts
 *
 * React hook that bridges the Web Audio API to live pitch / resonance metrics.
 * Uses requestAnimationFrame at ~20fps for analysis. No external deps.
 *
 * Usage:
 *   const { start, stop, isListening, metrics, heatmapHistory, pitchHistory } = useVocalResonance({ band });
 */

import { useState, useRef, useCallback, useEffect } from 'react';
import {
    detectPitch,
    calcRMS,
    calcSpectralCentroid,
    getHeatmapRow,
    countSyllables,
    scorePitch,
    scorePitchVariance,
    scoreTempo,
    scoreResonance,
    scoreStress,
    HEATMAP_BANDS,
} from '../utils/resonanceUtils';

// ── Types ──────────────────────────────────────────────────────────────────

export interface ResonanceMetrics {
    pitch: number;  // 0-100 live score
    tempo: number;  // 0-100 live score
    stress: number;  // 0-100 live score
    resonance: number;  // 0-100 live score
    overall: number;  // 0-100 weighted composite
    pitchHz: number;  // raw Hz value for display
    centroidHz: number;  // raw spectral centroid Hz
}

export interface ResonanceFinalResults {
    pitch: number;
    tempo: number;
    stress: number;
    resonance: number;
    overall: number;
    durationSec: number;
}

interface Options {
    band: string;
    onFrame?: (metrics: ResonanceMetrics) => void;
}

// ── Frame rate (target ~20fps for smooth heatmap without being expensive) ─
const FRAME_INTERVAL_MS = 50;
// Max frames kept in history (120 = 6 seconds at 20fps)
const MAX_HISTORY = 120;

// ── Hook ──────────────────────────────────────────────────────────────────

export function useVocalResonance({ band, onFrame }: Options) {
    const [isListening, setIsListening] = useState(false);
    const [metrics, setMetrics] = useState<ResonanceMetrics>({
        pitch: 0, tempo: 0, stress: 0, resonance: 0, overall: 0, pitchHz: 0, centroidHz: 0,
    });
    const [heatmapHistory, setHeatmapHistory] = useState<Uint8Array[]>([]);
    const [pitchHistory, setPitchHistory] = useState<number[]>([]);
    const [finalResults, setFinalResults] = useState<ResonanceFinalResults | null>(null);

    // Refs for the audio graph
    const audioCtxRef = useRef<AudioContext | null>(null);
    const analyserRef = useRef<AnalyserNode | null>(null);
    const streamRef = useRef<MediaStream | null>(null);
    const rafRef = useRef<number | null>(null);
    const lastFrameRef = useRef<number>(0);
    const startTimeRef = useRef<number>(0);

    // Rolling accumulators (for final scoring)
    const pitchSamplesRef = useRef<number[]>([]);
    const rmsSamplesRef = useRef<number[]>([]);
    const centroidSamplesRef = useRef<number[]>([]);
    const rmsHistoryRef = useRef<number[]>([]);  // for syllable detection

    // Heatmap history refs (avoid stale closure in rAF)
    const heatmapRef = useRef<Uint8Array[]>([]);
    const pitchHRef = useRef<number[]>([]);

    const analyse = useCallback((timestamp: number) => {
        if (!analyserRef.current || !audioCtxRef.current) return;
        rafRef.current = requestAnimationFrame(analyse);

        // Throttle to FRAME_INTERVAL_MS
        if (timestamp - lastFrameRef.current < FRAME_INTERVAL_MS) return;
        lastFrameRef.current = timestamp;

        const analyser = analyserRef.current;
        const sampleRate = audioCtxRef.current.sampleRate;

        // Time-domain buffer (for pitch + RMS)
        const timeBuf = new Float32Array(analyser.fftSize);
        analyser.getFloatTimeDomainData(timeBuf);

        // Frequency buffer (for heatmap + spectral centroid)
        const freqBuf = new Float32Array(analyser.frequencyBinCount);
        analyser.getFloatFrequencyData(freqBuf);

        // --- Compute per-frame metrics ---
        const f0 = detectPitch(timeBuf, sampleRate);
        const rms = calcRMS(timeBuf);
        const centroid = calcSpectralCentroid(freqBuf, sampleRate);
        const row = getHeatmapRow(freqBuf, sampleRate);

        // Accumulate for scoring
        if (f0 > 0) pitchSamplesRef.current.push(f0);
        rmsSamplesRef.current.push(rms);
        centroidSamplesRef.current.push(centroid);
        rmsHistoryRef.current.push(rms);

        // Keep rmsHistory bounded for syllable counting
        if (rmsHistoryRef.current.length > 500) rmsHistoryRef.current.shift();

        // --- Live scores ---
        const elapsed = (audioCtxRef.current.currentTime - (startTimeRef.current / 1000));
        const syllables = countSyllables(rmsHistoryRef.current);
        const syllPerSec = elapsed > 0.5 ? syllables / elapsed : 0;

        const pPitch = scorePitch([...pitchSamplesRef.current], band);
        const pTempo = scoreTempo(syllPerSec, band);
        const pStress = scoreStress([...rmsSamplesRef.current]);
        const pRes = scoreResonance([...centroidSamplesRef.current], band);
        const overall = Math.round(0.3 * pPitch + 0.2 * pTempo + 0.25 * pStress + 0.25 * pRes);

        const newMetrics: ResonanceMetrics = {
            pitch: pPitch, tempo: pTempo, stress: pStress,
            resonance: pRes, overall, pitchHz: Math.round(f0 > 0 ? f0 : 0), centroidHz: Math.round(centroid),
        };

        // Update heatmap history (ref + state)
        heatmapRef.current = [...heatmapRef.current, row].slice(-MAX_HISTORY);
        pitchHRef.current = [...pitchHRef.current, f0 > 0 ? f0 : 0].slice(-MAX_HISTORY);

        setHeatmapHistory([...heatmapRef.current]);
        setPitchHistory([...pitchHRef.current]);
        setMetrics(newMetrics);
        onFrame?.(newMetrics);

    }, [band, onFrame]);

    const start = useCallback(async () => {
        try {
            // Reset
            pitchSamplesRef.current = [];
            rmsSamplesRef.current = [];
            centroidSamplesRef.current = [];
            rmsHistoryRef.current = [];
            heatmapRef.current = [];
            pitchHRef.current = [];
            setHeatmapHistory([]);
            setPitchHistory([]);
            setFinalResults(null);

            const stream = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true } });
            streamRef.current = stream;

            const ctx = new AudioContext();
            audioCtxRef.current = ctx;

            const analyser = ctx.createAnalyser();
            analyser.fftSize = 2048;
            analyser.smoothingTimeConstant = 0.75;
            analyserRef.current = analyser;

            const source = ctx.createMediaStreamSource(stream);
            source.connect(analyser);
            // Don't connect to destination (no feedback)

            startTimeRef.current = Date.now();
            setIsListening(true);
            lastFrameRef.current = 0;

            rafRef.current = requestAnimationFrame(analyse);
        } catch (err) {
            console.error('[useVocalResonance] start error:', err);
            throw err;
        }
    }, [analyse]);

    const stop = useCallback((): ResonanceFinalResults => {
        // Cancel animation frame
        if (rafRef.current) cancelAnimationFrame(rafRef.current);

        // Stop mic tracks
        streamRef.current?.getTracks().forEach(t => t.stop());

        // Close audio context
        audioCtxRef.current?.close();

        const elapsed = (Date.now() - startTimeRef.current) / 1000;
        const syllables = countSyllables(rmsHistoryRef.current);
        const syllPerSec = elapsed > 0 ? syllables / elapsed : 0;

        const pPitch = scorePitch([...pitchSamplesRef.current], band);
        const pTempo = scoreTempo(syllPerSec, band);
        const pStress = scoreStress([...rmsSamplesRef.current]);
        const pRes = scoreResonance([...centroidSamplesRef.current], band);
        const overall = Math.round(0.3 * pPitch + 0.2 * pTempo + 0.25 * pStress + 0.25 * pRes);

        const result: ResonanceFinalResults = {
            pitch: pPitch, tempo: pTempo, stress: pStress,
            resonance: pRes, overall, durationSec: Math.round(elapsed),
        };

        setFinalResults(result);
        setIsListening(false);
        return result;
    }, [band]);

    // Cleanup on unmount
    useEffect(() => () => {
        if (rafRef.current) cancelAnimationFrame(rafRef.current);
        streamRef.current?.getTracks().forEach(t => t.stop());
        audioCtxRef.current?.close().catch(() => { });
    }, []);

    return { start, stop, isListening, metrics, heatmapHistory, pitchHistory, finalResults };
}
