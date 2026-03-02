/**
 * useSpeechAnatomy — Speech metric computation hook.
 *
 * NOTE: In VoiceLab.tsx, all metric logic is inlined directly inside
 * AnatomyView for simpler state colocation. This hook exists as a
 * reusable utility for other components that might need speech analytics.
 */

import { useState, useRef, useCallback } from 'react';
import { detectFillers } from '@/shared/data/fillers';
import { FILLER_SET } from '@/shared/data/fillers';

export type WordStatus = 'clean' | 'filter' | 'weak';

export interface DissectedWord {
    word: string;
    status: WordStatus;
    confidence?: number;
}

export interface WordChunk {
    word: string;
    confidence: number;
}

export interface SpeechAnatomyMetrics {
    wpm: number;
    pauseCount: number;
    fillerCount: number;
    fillerDetails: Record<string, number>;
    pronunciationScore: number;
    confidenceScore: number;
    deliveryScore: number;
    dissectedWords: DissectedWord[];
}

// ── Score helpers ──────────────────────────────────────────────────────────
function clamp(v: number, lo = 0, hi = 100) { return Math.min(hi, Math.max(lo, v)); }
function calcWpmScore(wpm: number) { return clamp(100 - Math.abs(wpm - 145) * 1.2); }
function calcPauseScore(pauses: number, words: number) { return clamp(100 - (pauses / Math.max(words, 1)) * 150); }
function calcFillerScore(fillers: number, words: number) { return clamp(100 - (fillers / Math.max(words, 1)) * 250); }

function calcDelivery(durations: number[]) {
    if (durations.length < 2) return 80;
    const mean = durations.reduce((s, d) => s + d, 0) / durations.length;
    const sd = Math.sqrt(durations.reduce((s, d) => s + Math.pow(d - mean, 2), 0) / durations.length);
    return Math.round(clamp(100 - Math.abs(sd - 0.6) * 50));
}

// ── Hook ──────────────────────────────────────────────────────────────────
interface Options { promptText: string; }

export function useSpeechAnatomy({ promptText }: Options) {
    const wordConfidencesRef = useRef<number[]>([]);
    const chunkDurationsRef = useRef<number[]>([]);
    const lastChunkTimeRef = useRef<number>(0);
    const [pauseCount, setPauseCount] = useState(0);
    const [dissectedWords, setDissectedWords] = useState<DissectedWord[]>([]);
    const [finalMetrics, setFinalMetrics] = useState<SpeechAnatomyMetrics | null>(null);

    const promptTokens = new Set(
        promptText.toLowerCase().split(/\s+/).map(w => w.replace(/[^a-z]/g, ''))
    );

    const onTranscriptChunk = useCallback((
        text: string, isFinal: boolean, words: WordChunk[]
    ) => {
        const now = Date.now();
        if (lastChunkTimeRef.current > 0) {
            chunkDurationsRef.current.push((now - lastChunkTimeRef.current) / 1000);
        }
        lastChunkTimeRef.current = now;

        if (isFinal && words.length > 0) {
            words.forEach(w => wordConfidencesRef.current.push(w.confidence));
            const newWords: DissectedWord[] = text.trim().split(/\s+/).filter(Boolean).map((raw, i) => {
                const clean = raw.toLowerCase().replace(/[^a-z]/g, '');
                const conf = words[i]?.confidence ?? 1;
                let status: WordStatus = 'clean';
                if (clean && FILLER_SET.has(clean) && !promptTokens.has(clean)) status = 'filter';
                else if (conf < 0.72) status = 'weak';
                return { word: raw, status, confidence: conf };
            });
            setDissectedWords(prev => [...prev, ...newWords]);
        }
    }, [promptText]);

    const onPauseDetected = useCallback(() => {
        setPauseCount(p => p + 1);
    }, []);

    const computeFinalMetrics = useCallback((
        finalTranscript: string, elapsedSeconds: number
    ): SpeechAnatomyMetrics => {
        const words = finalTranscript.trim().split(/\s+/).filter(Boolean);
        const totalWords = words.length;
        const wpm = elapsedSeconds > 0 ? Math.round((totalWords / elapsedSeconds) * 60) : 0;

        const { total: fillerCount, counts: fillerDetails } = detectFillers(finalTranscript, promptText);

        const fluency = calcWpmScore(wpm);
        const pause = calcPauseScore(pauseCount, totalWords);
        const filler = calcFillerScore(fillerCount, totalWords);

        const confs = wordConfidencesRef.current;
        const pronunciationScore = confs.length
            ? Math.round(clamp((confs.reduce((s, c) => s + c, 0) / confs.length) * 100))
            : 0;

        const metrics: SpeechAnatomyMetrics = {
            wpm, pauseCount, fillerCount, fillerDetails,
            pronunciationScore,
            confidenceScore: Math.round(clamp(0.4 * fluency + 0.3 * pause + 0.3 * filler)),
            deliveryScore: calcDelivery(chunkDurationsRef.current),
            dissectedWords,
        };
        setFinalMetrics(metrics);
        return metrics;
    }, [pauseCount, dissectedWords, promptText]);

    const reset = useCallback(() => {
        wordConfidencesRef.current = [];
        chunkDurationsRef.current = [];
        lastChunkTimeRef.current = 0;
        setPauseCount(0);
        setDissectedWords([]);
        setFinalMetrics(null);
    }, []);

    return { onTranscriptChunk, onPauseDetected, computeFinalMetrics, reset, dissectedWords, pauseCount, finalMetrics };
}
