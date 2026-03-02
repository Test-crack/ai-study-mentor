import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import {
  Play, Scissors, Mic, Square, Activity, Sparkles,
  Radio, ChevronLeft, BarChart3, CheckCircle2,
  RotateCcw, AlertTriangle, Target, Zap, Loader2, StopCircle
} from 'lucide-react';
import { StudentSidebar } from './dashboard/StudentSidebar';
import { StudentTopbar } from './dashboard/StudentTopbar';
import { useSpeechToText } from '../hooks/useSpeechToText';
import { useVocalResonance } from '../hooks/useVocalResonance';
import ResonanceCanvas from './ResonanceCanvas';
import { fetchRandomVoicePrompt } from '../services/voiceLabService';
import type { VoicePrompt } from '../services/voiceLabService';
import { FILLER_SET } from '@/shared/data/fillers';
import { cn } from '@/shared/utils';
import { toast } from 'sonner';

// ── Types ─────────────────────────────────────────────────────────────────────
type ViewState = 'dashboard' | 'anatomy' | 'resonance';
type AnatomyPhase = 'setup' | 'recording' | 'results';
type WordStatus = 'clean' | 'filter' | 'weak';
type AnatomyBand = 'Band 5' | 'Band 6' | 'Band 7' | 'Band 8';

const ALL_BANDS: AnatomyBand[] = ['Band 5', 'Band 6', 'Band 7', 'Band 8'];

interface DissectedWord { word: string; status: WordStatus; confidence?: number; }

// ── Resonance demo data (kept from original) ──────────────────────────────────
const RESONANCE_PHRASES = [
  { text: "The quarterly revenue exceeded all projections", scores: { res: 72, pitch: 70, tempo: 65, stress: 80, over: 72 } },
  { text: "We need to pivot our go-to-market strategy",   scores: { res: 82, pitch: 85, tempo: 75, stress: 90, over: 82 } },
  { text: "Our competitive moat lies in execution speed", scores: { res: 88, pitch: 90, tempo: 75, stress: 85, over: 88 } },
  { text: "The Series B funding will close next quarter",  scores: { res: 74, pitch: 80, tempo: 70, stress: 75, over: 74 } },
  { text: "Customer acquisition cost dropped by forty percent", scores: { res: 85, pitch: 92, tempo: 75, stress: 80, over: 85 } },
];

// ── Score helpers ─────────────────────────────────────────────────────────────
function clamp(v: number, lo = 0, hi = 100) { return Math.min(hi, Math.max(lo, v)); }
function calcWpmScore(wpm: number)          { return clamp(100 - Math.abs(wpm - 145) * 1.2); }
function calcPauseScore(pauses: number, words: number) { return clamp(100 - (pauses / Math.max(words, 1)) * 150); }
function calcFillerScore(fillers: number, words: number){ return clamp(100 - (fillers / Math.max(words, 1)) * 250); }
function calcConfidence(f: number, p: number, fi: number) { return Math.round(clamp(0.4*f + 0.3*p + 0.3*fi)); }
function calcPronunciation(confs: number[]) {
  if (!confs.length) return 0;
  return Math.round(clamp((confs.reduce((s,c)=>s+c,0)/confs.length)*100));
}
function calcDelivery(durations: number[]) {
  if (durations.length < 2) return 80;
  const mean = durations.reduce((s,d)=>s+d,0)/durations.length;
  const sd = Math.sqrt(durations.reduce((s,d)=>s+Math.pow(d-mean,2),0)/durations.length);
  return Math.round(clamp(100 - Math.abs(sd - 0.6) * 50));
}

// ─────────────────────────────────────────────────────────────────────────────
// ROOT COMPONENT
// ─────────────────────────────────────────────────────────────────────────────
export default function VoiceLab() {
  const [activeTab, setActiveTab]   = useState<ViewState>('dashboard');
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  return (
    <div className="flex h-screen bg-white dark:bg-[#09090b] text-slate-900 dark:text-white font-sans transition-colors duration-300 overflow-hidden">
      <StudentSidebar
        activeTab="voice"
        isCollapsed={isSidebarCollapsed}
        toggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
      />

      <div className={`flex-1 flex flex-col min-w-0 transition-all duration-300 ${isSidebarCollapsed ? 'lg:ml-28' : 'lg:ml-72'}`}>
        <StudentTopbar onUpgradeClick={() => {}} />

        <main className="flex-1 flex flex-col relative overflow-y-auto p-4 md:p-8 lg:p-12">
          <div className="max-w-6xl mx-auto w-full">
            {activeTab === 'dashboard' && <HomeView onNavigate={setActiveTab} />}
            {activeTab === 'resonance' && (
              <ResonanceView
                onExit={() => setActiveTab('dashboard')}
                onNavigate={setActiveTab}
              />
            )}
            {activeTab === 'anatomy' && (
              <AnatomyView onExit={() => setActiveTab('dashboard')} onNavigate={setActiveTab} />
            )}
          </div>
        </main>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// HOME VIEW (unchanged from original)
// ─────────────────────────────────────────────────────────────────────────────
function HomeView({ onNavigate }: { onNavigate: (v: ViewState) => void }) {
  return (
    <div className="max-w-4xl animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-purple-500/30 bg-purple-500/10 text-purple-600 dark:text-purple-300 text-xs font-semibold tracking-wide mb-8">
        <Activity size={14} /> Two Engines. One Lab.
      </div>
      <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight mb-6 leading-tight">
        Your Voice, Under The<br />
        <span className="bg-gradient-to-r from-purple-600 via-purple-500 to-indigo-500 dark:from-purple-400 dark:via-purple-300 dark:to-indigo-300 bg-clip-text text-transparent">
          Microscope &amp; Waveform
        </span>
      </h1>
      <p className="text-slate-500 dark:text-[#a1a1aa] text-lg mb-12 max-w-2xl leading-relaxed">
        <strong className="text-slate-900 dark:text-gray-200 font-semibold">Vocal Resonance</strong> trains your pitch, tempo, and stress to match a native speaker.{' '}
        <strong className="text-slate-900 dark:text-gray-200 font-semibold">Speech Anatomy</strong> dissects word confidence and filler gaps.
      </p>
      <div className="flex flex-col sm:flex-row gap-4">
        <button
          onClick={() => onNavigate('resonance')}
          className="bg-purple-600 hover:bg-purple-500 text-white px-8 py-4 rounded-xl font-bold transition-all shadow-lg shadow-purple-600/20 flex items-center justify-center gap-2"
        >
          <Play size={18} fill="currentColor" /> Demo Resonance
        </button>
        <button
          onClick={() => onNavigate('anatomy')}
          className="bg-slate-100 dark:bg-[#121214] border border-slate-200 dark:border-[#27272a] hover:bg-slate-200 dark:hover:bg-[#1c1c1f] px-8 py-4 rounded-xl font-bold transition-all flex items-center justify-center gap-2 text-slate-900 dark:text-white"
        >
          <Scissors size={18} /> Speech Anatomy
        </button>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// ANATOMY VIEW — FULL 3-PHASE IMPLEMENTATION
// ─────────────────────────────────────────────────────────────────────────────
function AnatomyView({ onExit, onNavigate }: { onExit: () => void; onNavigate: (v: ViewState) => void }) {
  // ── Phase state ──────────────────────────────────────────────────────────
  const [phase, setPhase] = useState<AnatomyPhase>('setup');
  const [selectedBand, setSelectedBand] = useState<AnatomyBand>('Band 7');
  const [prompt, setPrompt] = useState<VoicePrompt | null>(null);
  const [isLoadingPrompt, setIsLoadingPrompt] = useState(false);
  const seenPromptIdsRef = useRef<string[]>([]);

  // Fetch initial prompt on mount
  useEffect(() => { loadPrompt('Band 7'); }, []);

  // ── Recording state ───────────────────────────────────────────────────────
  const [recordingTime, setRecordingTime]     = useState(0);
  const [pauseCount, setPauseCount]           = useState(0);
  const [isCurrentlyPausing, setIsCurrentlyPausing] = useState(false);
  const lastTranscriptTimeRef                  = useRef<number>(Date.now());

  // ── Transcript + word accumulation ───────────────────────────────────────
  const [dissectedWords, setDissectedWords]   = useState<DissectedWord[]>([]);
  const [fillerCount, setFillerCount]         = useState(0);
  const wordConfidencesRef                     = useRef<number[]>([]);
  const chunkDurationsRef                      = useRef<number[]>([]);
  const lastChunkTimeRef                       = useRef<number>(0);

  // ── Final results ─────────────────────────────────────────────────────────
  const [results, setResults] = useState<{
    confidenceScore: number;
    pronunciationScore: number;
    deliveryScore: number;
    wpm: number;
    pauseCount: number;
    fillersDetected: number;
    fillerDetails: Record<string, number>;
  } | null>(null);

  // ── STT hook ─────────────────────────────────────────────────────────────
  const {
    isListening, isSTTReady,
    transcript,
    startListening, stopListening,
    setTranscript: resetTranscript,
  } = useSpeechToText({
    onTranscript: useCallback((text: string, isFinal: boolean, words: any[]) => {
      const now = Date.now();

      // Chunk timing for delivery score
      if (lastChunkTimeRef.current > 0) {
        chunkDurationsRef.current.push((now - lastChunkTimeRef.current) / 1000);
      }
      lastChunkTimeRef.current = now;
      lastTranscriptTimeRef.current = now;
      setIsCurrentlyPausing(false);

      if (isFinal && words.length > 0) {
        const promptTokens = new Set(
          (prompt?.question ?? '').toLowerCase().split(/\s+/).map(w => w.replace(/[^a-z]/g, ''))
        );

        // Accumulate word confidence
        words.forEach(w => wordConfidencesRef.current.push(w.confidence));

        // Classify each word
        const newWords: DissectedWord[] = text.trim().split(/\s+/).filter(Boolean).map((raw, i) => {
          const clean = raw.toLowerCase().replace(/[^a-z]/g, '');
          const conf  = words[i]?.confidence ?? 1;
          let status: WordStatus = 'clean';
          if (clean && FILLER_SET.has(clean) && !promptTokens.has(clean)) {
            status = 'filter';
            setFillerCount(p => p + 1);
          } else if (conf < 0.72) {
            status = 'weak';
          }
          return { word: raw, status, confidence: conf };
        });

        setDissectedWords(prev => [...prev, ...newWords]);
      }
    }, [prompt]),
    onError: useCallback((err: string) => toast.error(err), []),
  });

  // ── Word / pause derived data ─────────────────────────────────────────────
  const wordsArray = useMemo(() =>
    transcript.split(/\s+/).filter(w => w.length > 0), [transcript]);

  const currentWPM = useMemo(() =>
    recordingTime > 0 ? Math.round((wordsArray.length / recordingTime) * 60) : 0,
    [wordsArray.length, recordingTime]);

  // ── Timer ─────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!isListening || !isSTTReady) return;
    const t = setInterval(() => setRecordingTime(p => p + 1), 1000);
    return () => clearInterval(t);
  }, [isListening, isSTTReady]);

  // ── Pause detection ───────────────────────────────────────────────────────
  useEffect(() => {
    if (!isListening || !isSTTReady || wordsArray.length === 0) {
      setIsCurrentlyPausing(false);
      lastTranscriptTimeRef.current = Date.now();
      return;
    }
    const check = setInterval(() => {
      if (Date.now() - lastTranscriptTimeRef.current > 1800 && !isCurrentlyPausing) {
        setPauseCount(p => p + 1);
        setIsCurrentlyPausing(true);
      }
    }, 500);
    return () => clearInterval(check);
  }, [isListening, isSTTReady, wordsArray.length, isCurrentlyPausing]);

  // ── API prompt loader ─────────────────────────────────────────────────────
  const loadPrompt = async (band: AnatomyBand, exclude: string[] = []) => {
    setIsLoadingPrompt(true);
    try {
      const p = await fetchRandomVoicePrompt(band, 'anatomy', exclude);
      setPrompt(p);
      // Track seen ID to avoid repeats until all are shown
      seenPromptIdsRef.current = [...seenPromptIdsRef.current, p.id].slice(-20);
    } catch (err) {
      toast.error('Could not load prompt. Check your connection.');
    } finally {
      setIsLoadingPrompt(false);
    }
  };

  // ── Handlers ───────────────────────────────────────────────────────────────
  const handleBandSelect = (band: AnatomyBand) => {
    setSelectedBand(band);
    seenPromptIdsRef.current = [];
    loadPrompt(band);
  };

  const handleStartRecording = () => {
    // Reset all accumulators
    wordConfidencesRef.current  = [];
    chunkDurationsRef.current   = [];
    lastChunkTimeRef.current    = 0;
    setRecordingTime(0);
    setPauseCount(0);
    setFillerCount(0);
    setDissectedWords([]);
    setIsCurrentlyPausing(false);
    lastTranscriptTimeRef.current = Date.now();
    resetTranscript('');
    startListening();
    setPhase('recording');
  };

  const handleStopRecording = () => {
    stopListening();

    // Compute final metrics
    const totalWords = wordsArray.length || 1;
    const wpm = recordingTime > 0 ? Math.round((totalWords / recordingTime) * 60) : 0;

    const fluencyScore   = calcWpmScore(wpm);
    const pauseScore     = calcPauseScore(pauseCount, totalWords);
    const fillerScore    = calcFillerScore(fillerCount, totalWords);
    const confidenceScore    = calcConfidence(fluencyScore, pauseScore, fillerScore);
    const pronunciationScore = calcPronunciation(wordConfidencesRef.current);
    const deliveryScore      = calcDelivery(chunkDurationsRef.current);

    // Build filler detail map from dissected words
    const fillerDetails: Record<string, number> = {};
    dissectedWords.forEach(w => {
      if (w.status === 'filter') {
        const k = w.word.toLowerCase();
        fillerDetails[k] = (fillerDetails[k] || 0) + 1;
      }
    });

    setResults({ confidenceScore, pronunciationScore, deliveryScore, wpm, pauseCount, fillersDetected: fillerCount, fillerDetails });
    setPhase('results');
  };

  const handleTryAgain = () => {
    setResults(null);
    setPhase('setup');
    loadPrompt(selectedBand, seenPromptIdsRef.current);
  };

  const formatTime = (s: number) =>
    `${Math.floor(s / 60).toString().padStart(2, '0')}:${(s % 60).toString().padStart(2, '0')}`;

  // ─────────────────────────────────────────────────────────────────────────
  // RENDER
  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div className="flex flex-col gap-6 animate-in fade-in duration-500 pb-12">

      {/* ── Header ── */}
      <div className="flex justify-between items-center">
        <button onClick={onExit} className="flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-purple-600 transition-colors">
          <ChevronLeft size={18} /> Back to Dashboard
        </button>
        <button onClick={() => onNavigate('resonance')} className="flex items-center gap-2 px-4 py-2 bg-slate-100 dark:bg-slate-800 rounded-lg text-xs font-bold uppercase tracking-wider hover:bg-purple-600 hover:text-white transition-all border border-slate-200 dark:border-slate-700">
          <Radio size={14} /> Vocal Resonance
        </button>
      </div>

      {/* ── Page title ── */}
      {phase !== 'results' && (
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-600 dark:text-purple-400 text-[11px] font-bold uppercase tracking-widest mb-3">
            <Activity size={12} /> Speech Anatomy
          </div>
          <h2 className="text-2xl md:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
            {phase === 'setup' ? 'Configure Your Session' : 'Real-time Analysis'}
          </h2>
          <p className="text-slate-500 dark:text-[#a1a1aa] text-sm mt-1">
            {phase === 'setup'
              ? 'Pick a target band, read your prompt, then start the microphone.'
              : 'Speak clearly. Filler words appear in orange. Uncertain words in yellow.'}
          </p>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/*  PHASE 1 — SETUP                                                   */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      {phase === 'setup' && (
        <div className="flex flex-col gap-6 animate-in slide-in-from-right-4 duration-400">

          {/* Band selector */}
          <div className="bg-slate-50 dark:bg-[#121214] border border-slate-200 dark:border-[#27272a] rounded-2xl p-6">
            <p className="text-[11px] font-bold tracking-widest uppercase text-slate-500 dark:text-[#a1a1aa] mb-4">
              Select Target Band
            </p>
            <div className="flex flex-wrap gap-3">
              {ALL_BANDS.map(band => (
                <button
                  key={band}
                  onClick={() => handleBandSelect(band)}
                  className={cn(
                    'px-5 py-2.5 rounded-xl font-bold text-sm transition-all border',
                    selectedBand === band
                      ? 'bg-purple-600 text-white border-purple-600 shadow-lg shadow-purple-600/20'
                      : 'bg-white dark:bg-[#09090b] border-slate-200 dark:border-[#27272a] text-slate-500 dark:text-[#a1a1aa] hover:border-purple-500/50'
                  )}
                >
                  {band}
                </button>
              ))}
            </div>
          </div>

          {/* Prompt card */}
          <div className="bg-white dark:bg-[#0c0c0e] border border-slate-200 dark:border-[#27272a] rounded-2xl p-8 shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <p className="text-[11px] font-bold tracking-widest uppercase text-slate-400 dark:text-[#52525b] flex items-center gap-2">
                <Target size={12} /> Your Speaking Prompt
              </p>
              <button
                onClick={() => loadPrompt(selectedBand, seenPromptIdsRef.current)}
                disabled={isLoadingPrompt || !prompt}
                className="text-[11px] font-bold text-purple-600 dark:text-purple-400 hover:underline flex items-center gap-1 disabled:opacity-50"
              >
                {isLoadingPrompt ? <Loader2 size={11} className="animate-spin" /> : <RotateCcw size={11} />} New prompt
              </button>
            </div>

            {/* Loading skeleton */}
            {(isLoadingPrompt || !prompt) ? (
              <div className="space-y-4 animate-pulse">
                <div className="h-9 bg-slate-100 dark:bg-[#1f1f23] rounded-xl w-full" />
                <div className="h-9 bg-slate-100 dark:bg-[#1f1f23] rounded-xl w-4/5" />
                <div className="h-16 bg-slate-50 dark:bg-[#121214] rounded-xl mt-2 border border-slate-100 dark:border-[#27272a]" />
              </div>
            ) : (
              <>
                {/* Prompt quote */}
                <div className="border-l-4 border-purple-500 pl-5 mb-5">
                  <p className="text-slate-900 dark:text-white text-xl md:text-2xl font-semibold leading-relaxed">
                    {prompt.question}
                  </p>
                </div>
                <div className="flex flex-wrap items-start gap-3">
                  <div className="flex items-center gap-2 px-3 py-1.5 bg-purple-500/10 border border-purple-500/20 rounded-full text-[11px] text-purple-600 dark:text-purple-300 font-bold">
                    <Zap size={11} /> {prompt.targetWpmMin}–{prompt.targetWpmMax} WPM target
                  </div>
                  {prompt.hint && (
                    <div className="flex-1 text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
                      💡 {prompt.hint}
                    </div>
                  )}
                </div>
              </>
            )}
          </div>

          {/* Start button */}
          <button
            onClick={handleStartRecording}
            disabled={!prompt || isLoadingPrompt}
            className={cn(
              'flex items-center justify-center gap-3 w-full py-5 rounded-2xl font-bold text-lg transition-all shadow-xl active:scale-[.99]',
              prompt && !isLoadingPrompt
                ? 'bg-purple-600 hover:bg-purple-500 text-white shadow-purple-600/25'
                : 'bg-slate-200 dark:bg-[#1f1f23] text-slate-400 cursor-not-allowed shadow-none'
            )}
          >
            <Mic size={22} /> {isLoadingPrompt ? 'Loading prompt...' : 'Start Speech Analysis'}
          </button>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/*  PHASE 2 — RECORDING                                               */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      {phase === 'recording' && (
        <div className="flex flex-col gap-6 animate-in slide-in-from-right-4 duration-400">

          {/* Live stat cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <LiveStatCard label="WPM"    value={currentWPM}   good={!!prompt && currentWPM >= prompt.targetWpmMin && currentWPM <= prompt.targetWpmMax} />
            <LiveStatCard label="Words"  value={wordsArray.length} />
            <LiveStatCard label="Fillers" value={fillerCount}  good={fillerCount === 0} bad={fillerCount > 3} />
            <LiveStatCard label="Pauses" value={pauseCount}   good={pauseCount <= 1}   bad={pauseCount > 4} />
          </div>

          {/* Prompt reminder — accent banner */}
          {prompt && (
            <div className="flex items-start gap-3 bg-purple-500/5 border border-purple-500/15 rounded-xl px-5 py-4">
              <div className="w-1 self-stretch rounded-full bg-purple-500 shrink-0" />
              <p className="text-slate-800 dark:text-slate-200 text-sm font-semibold leading-relaxed">{prompt.question}</p>
            </div>
          )}

          {/* Live transcript */}
          <div className="bg-[#0c0c0e] rounded-2xl border border-[#1f1f23] shadow-xl overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-[#1f1f23]">
              <div className="flex items-center gap-3">
                <div className={cn('w-2.5 h-2.5 rounded-full', isListening ? 'bg-rose-500 animate-ping' : 'bg-slate-600')} />
                <span className="text-[11px] font-bold uppercase tracking-widest text-slate-300">Live Transcript</span>
              </div>
              <span className="text-xs font-mono text-slate-500">{formatTime(recordingTime)}</span>
            </div>

            <div className="min-h-[200px] p-6 flex flex-wrap content-start gap-x-2 gap-y-3">
              {isListening && !isSTTReady && (
                <div className="w-full h-full flex flex-col items-center justify-center text-purple-400 animate-pulse gap-2 py-8">
                  <Sparkles className="w-8 h-8" />
                  <span className="text-sm font-bold">Connecting voice engine...</span>
                </div>
              )}
              {isSTTReady && dissectedWords.length === 0 && (
                <div className="w-full flex flex-col items-center justify-center py-10 gap-3">
                  <div className="relative">
                    <div className="w-3 h-3 rounded-full bg-emerald-500" />
                    <div className="w-3 h-3 rounded-full bg-emerald-500 animate-ping absolute inset-0" />
                  </div>
                  <span className="text-sm font-bold text-emerald-400 tracking-wide">LIVE — start speaking now</span>
                </div>
              )}
              {dissectedWords.map((w, i) => (
                <WordPill key={i} word={w.word} status={w.status} />
              ))}
              {isListening && dissectedWords.length > 0 && (
                <span className="animate-pulse border-r-2 border-purple-400 h-6 self-center" />
              )}
            </div>
          </div>

          {/* Stop button */}
          <button
            onClick={handleStopRecording}
            disabled={!isSTTReady}
            className={cn(
              'flex items-center justify-center gap-3 w-full py-5 rounded-2xl font-bold text-lg transition-all',
              isSTTReady
                ? 'bg-rose-500 hover:bg-rose-600 text-white shadow-lg shadow-rose-500/20 active:scale-[.99]'
                : 'bg-slate-200 dark:bg-[#1f1f23] text-slate-400 cursor-not-allowed'
            )}
          >
            <Square size={20} fill="currentColor" /> Stop &amp; Analyse
          </button>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/*  PHASE 3 — RESULTS                                                 */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      {phase === 'results' && results && (
        <div className="flex flex-col gap-6 animate-in slide-in-from-bottom-4 duration-500">

          {/* Header */}
          <div className="text-center space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-600 dark:text-purple-400 text-[11px] font-bold uppercase tracking-widest">
              <Activity size={12} /> Analysis Complete
            </div>
            <h2 className="text-3xl font-extrabold text-slate-900 dark:text-white">Speech Anatomy Results</h2>
            <p className="text-slate-400 text-sm">Band target: {selectedBand}</p>
          </div>

          {/* 3 Score rings */}
          <div className="grid grid-cols-3 gap-4">
            <ScoreRing label="Confidence"    score={results.confidenceScore}    color="purple" />
            <ScoreRing label="Pronunciation" score={results.pronunciationScore} color="blue"   />
            <ScoreRing label="Delivery"      score={results.deliveryScore}      color="green"  />
          </div>

          {/* Dimension explanation strip */}
          <div className="grid grid-cols-3 gap-3 -mt-2">
            {([
              { label: 'Confidence', sub: 'Fluency · Pauses · Fillers', color: 'text-purple-500' },
              { label: 'Pronunciation', sub: 'Word clarity · STT confidence', color: 'text-blue-500' },
              { label: 'Delivery', sub: 'Pace · Rhythm · Tempo', color: 'text-emerald-500' },
            ] as const).map(d => (
              <div key={d.label} className="text-center">
                <p className={`text-[10px] font-bold uppercase tracking-widest ${d.color}`}>{d.label}</p>
                <p className="text-[10px] text-slate-400 mt-0.5">{d.sub}</p>
              </div>
            ))}
          </div>

          {/* Breakdown stats */}
          <div className="grid grid-cols-3 gap-4">
            <MetricCard icon={<Activity size={14}/>} label="WPM"    value={results.wpm}            target={prompt ? `${prompt.targetWpmMin}–${prompt.targetWpmMax}` : '130–160'} />
            <MetricCard icon={<Target size={14}/>}   label="Pauses" value={results.pauseCount}      target="< 3 ideal" />
            <MetricCard icon={<AlertTriangle size={14}/>} label="Fillers" value={results.fillersDetected} target="0 ideal" />
          </div>

          {/* Filler breakdown */}
          {Object.keys(results.fillerDetails).length > 0 && (
            <div className="bg-amber-50 dark:bg-[#121214] border border-amber-200 dark:border-amber-900/50 rounded-2xl p-6">
              <div className="flex items-center gap-2 mb-4">
                <AlertTriangle size={16} className="text-amber-500" />
                <h3 className="font-bold text-amber-900 dark:text-amber-400 text-sm">Filler Words Detected</h3>
              </div>
              <div className="flex flex-wrap gap-2 mb-4">
                {Object.entries(results.fillerDetails)
                  .sort(([,a],[,b]) => b - a)
                  .map(([word, count]) => (
                    <div key={word} className="bg-white dark:bg-[#09090b] px-4 py-2 rounded-xl border border-amber-100 dark:border-[#27272a] flex items-center gap-2">
                      <span className="font-mono text-rose-500 font-bold text-sm">{word}</span>
                      <span className="text-xs font-black text-slate-400">{count}×</span>
                    </div>
                  ))}
              </div>
              <p className="text-xs text-amber-700 dark:text-amber-400 bg-amber-100 dark:bg-amber-900/20 p-3 rounded-lg">
                💡 Tip: A brief pause is always better than a filler word. Take a breath instead.
              </p>
            </div>
          )}

          {/* Word dissection */}
          {dissectedWords.length > 0 && (
            <div className="bg-[#060608] border border-[#1f1f23] rounded-2xl overflow-hidden">
              <div className="flex items-center justify-between px-6 py-4 border-b border-[#1f1f23]">
                <h3 className="text-[11px] font-bold uppercase tracking-widest text-slate-400">Word-Level Dissection</h3>
                <div className="flex items-center gap-4">
                  <span className="flex items-center gap-1.5 text-[10px] font-bold text-emerald-400"><span className="w-2 h-2 rounded-full bg-emerald-500"/>Clean</span>
                  <span className="flex items-center gap-1.5 text-[10px] font-bold text-orange-400"><span className="w-2 h-2 rounded-full bg-orange-500"/>Filler</span>
                  <span className="flex items-center gap-1.5 text-[10px] font-bold text-yellow-400"><span className="w-2 h-2 rounded-full bg-yellow-500"/>Unclear</span>
                </div>
              </div>
              <div className="p-6 flex flex-wrap gap-x-2 gap-y-3">
                {dissectedWords.slice(0, 100).map((w, i) => (
                  <WordPill key={i} word={w.word} status={w.status} />
                ))}
                {dissectedWords.length > 100 && (
                  <span className="text-xs text-slate-500 self-center">+{dissectedWords.length - 100} more</span>
                )}
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-4 pt-2">
            <button
              onClick={handleTryAgain}
              className="flex-1 py-4 rounded-2xl font-bold border-2 border-slate-200 dark:border-[#27272a] text-slate-700 dark:text-white hover:border-purple-500 transition-all"
            >
              <RotateCcw size={16} className="inline mr-2" /> Try Again
            </button>
            <button
              onClick={onExit}
              className="flex-1 py-4 rounded-2xl font-bold bg-purple-600 text-white hover:bg-purple-500 transition-all shadow-lg shadow-purple-600/20"
            >
              Back to Dashboard
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// RESONANCE VIEW — Live mic DSP implementation
// ─────────────────────────────────────────────────────────────────────────────
function ResonanceView({ onExit, onNavigate }: { onExit: () => void, onNavigate: (view: ViewState) => void }) {
  const [selectedBand, setSelectedBand] = useState<AnatomyBand>('Band 7');
  const [prompt, setPrompt]             = useState<VoicePrompt | null>(null);
  const [isLoadingPrompt, setIsLoadingPrompt] = useState(false);
  const seenPromptIdsRef = useRef<string[]>([]);
  const [showResults, setShowResults]   = useState(false);

  const {
    start, stop, isListening,
    metrics, heatmapHistory, pitchHistory, finalResults,
  } = useVocalResonance({ band: selectedBand });

  // Load initial prompt
  useEffect(() => { loadPrompt(selectedBand); }, []);

  const loadPrompt = async (band: AnatomyBand, exclude: string[] = []) => {
    setIsLoadingPrompt(true);
    try {
      const p = await fetchRandomVoicePrompt(band, 'resonance', exclude);
      setPrompt(p);
      seenPromptIdsRef.current = [...seenPromptIdsRef.current, p.id].slice(-20);
    } catch {
      toast.error('Could not load prompt.');
    } finally {
      setIsLoadingPrompt(false);
    }
  };

  const handleBandSelect = (band: AnatomyBand) => {
    setSelectedBand(band);
    seenPromptIdsRef.current = [];
    loadPrompt(band);
  };

  const handleStart = async () => {
    if (!prompt) return;
    setShowResults(false);
    try {
      await start();
    } catch {
      toast.error('Microphone access denied. Please allow mic permission.');
    }
  };

  const handleStop = () => {
    stop();
    setShowResults(true);
  };

  const handleTryAgain = () => {
    setShowResults(false);
    loadPrompt(selectedBand, seenPromptIdsRef.current);
  };

  // Grade label helper
  const grade = (s: number) => s >= 85 ? 'A' : s >= 70 ? 'B' : s >= 55 ? 'C' : 'D';
  const gradeColor = (s: number) => s >= 85 ? 'text-emerald-400' : s >= 70 ? 'text-blue-400' : s >= 55 ? 'text-yellow-400' : 'text-rose-400';

  return (
    <div className="flex flex-col gap-5 animate-in fade-in duration-500 pb-10">

      {/* Nav */}
      <div className="flex justify-between items-center">
        <button onClick={onExit} className="flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-purple-600 transition-colors">
          <ChevronLeft size={18}/> Back to Dashboard
        </button>
        <button onClick={() => onNavigate('anatomy')} className="flex items-center gap-2 px-4 py-2 bg-slate-100 dark:bg-slate-800 rounded-lg text-xs font-bold uppercase tracking-wider hover:bg-purple-600 hover:text-white transition-all border border-slate-200 dark:border-slate-700">
          <BarChart3 size={14}/> Anatomy
        </button>
      </div>

      {/* Header */}
      <div>
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-[11px] font-bold uppercase tracking-widest mb-2">
          <Radio size={12} /> Vocal Resonance
        </div>
        <h2 className="text-2xl md:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">Live Voice Analysis</h2>
        <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">Speak the phrase — your pitch, resonance, stress and tempo are measured in real time.</p>
      </div>

      {/* Band selector */}
      <div className="flex flex-wrap gap-2">
        {ALL_BANDS.map(band => (
          <button
            key={band}
            onClick={() => handleBandSelect(band)}
            disabled={isListening}
            className={cn(
              'px-4 py-2 rounded-xl font-bold text-sm transition-all border disabled:opacity-40',
              selectedBand === band
                ? 'bg-indigo-600 text-white border-indigo-600 shadow-lg shadow-indigo-600/20'
                : 'bg-white dark:bg-[#09090b] border-slate-200 dark:border-[#27272a] text-slate-500 hover:border-indigo-500/50'
            )}
          >{band}</button>
        ))}
      </div>

      {/* Prompt banner */}
      <div className="bg-white dark:bg-[#0c0c0e] border border-slate-200 dark:border-[#27272a] rounded-2xl p-6 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <p className="text-[11px] font-bold tracking-widest uppercase text-slate-400 flex items-center gap-2">
            <Mic size={11}/> Speak This Phrase
          </p>
          <button
            onClick={() => loadPrompt(selectedBand, seenPromptIdsRef.current)}
            disabled={isLoadingPrompt || isListening}
            className="text-[11px] font-bold text-indigo-500 hover:underline flex items-center gap-1 disabled:opacity-40"
          >
            {isLoadingPrompt ? <Loader2 size={11} className="animate-spin" /> : <RotateCcw size={11} />} New
          </button>
        </div>

        {isLoadingPrompt || !prompt ? (
          <div className="space-y-3 animate-pulse">
            <div className="h-8 bg-slate-100 dark:bg-[#1f1f23] rounded-xl w-full" />
            <div className="h-8 bg-slate-100 dark:bg-[#1f1f23] rounded-xl w-3/4" />
          </div>
        ) : (
          <>
            <div className="border-l-4 border-indigo-500 pl-4 mb-4">
              <p className="text-slate-900 dark:text-white text-xl md:text-2xl font-semibold leading-relaxed">{prompt.question}</p>
            </div>
            <p className="text-sm text-slate-500 dark:text-slate-400">💡 {prompt.hint}</p>
          </>
        )}
      </div>

      {/* Live metrics strip */}
      <div className="grid grid-cols-4 gap-3">
        {([
          { label: 'Pitch',     value: metrics.pitch,     sub: `${metrics.pitchHz}Hz`,     color: 'text-violet-400',  ring: '#7c3aed' },
          { label: 'Resonance', value: metrics.resonance, sub: `${metrics.centroidHz}Hz`,  color: 'text-indigo-400',  ring: '#4f46e5' },
          { label: 'Stress',    value: metrics.stress,    sub: 'dynamics',                 color: 'text-pink-400',    ring: '#db2777' },
          { label: 'Tempo',     value: metrics.tempo,     sub: 'rhythm',                   color: 'text-cyan-400',    ring: '#0891b2' },
        ] as const).map(m => (
          <div key={m.label} className="bg-[#0c0c0e] border border-[#27272a] rounded-2xl p-4 text-center">
            <div className={`text-3xl font-black ${m.color} tabular-nums leading-none`}>{isListening || showResults ? m.value : '--'}</div>
            <div className="text-[10px] text-slate-500 mt-0.5">{m.sub}</div>
            <div className="text-[10px] font-bold uppercase tracking-widest text-slate-600 mt-1">{m.label}</div>
          </div>
        ))}
      </div>

      {/* Canvas heatmap */}
      <div className="bg-[#040406] border border-[#1f1f23] rounded-2xl overflow-hidden">
        <div className="flex items-center justify-between px-5 py-3 border-b border-[#1f1f23]">
          <div className="flex items-center gap-2">
            <div className={cn('w-2 h-2 rounded-full', isListening ? 'bg-rose-500 animate-ping' : 'bg-slate-600')} />
            <span className="text-[11px] font-bold uppercase tracking-widest text-slate-400">Vocal Frequency Heatmap</span>
          </div>
          <div className="flex items-center gap-3 text-[10px] text-slate-500 font-bold">
            <span className="flex items-center gap-1"><span className="w-3 h-1.5 rounded-full inline-block bg-white/80" /> White = pitch</span>
            <span className="flex items-center gap-1"><span className="w-3 h-1.5 rounded-full inline-block bg-cyan-400" /> Cyan = mid</span>
            <span className="flex items-center gap-1"><span className="w-3 h-1.5 rounded-full inline-block bg-amber-400" /> Amber = loud</span>
          </div>
        </div>
        <div className="p-3">
          {!isListening && heatmapHistory.length === 0 ? (
            <div className="h-48 flex flex-col items-center justify-center gap-2 text-slate-700">
              <Radio size={28} className="opacity-30" />
              <span className="text-sm font-bold">Start speaking to see your vocal spectrum</span>
            </div>
          ) : (
            <ResonanceCanvas
              heatmapHistory={heatmapHistory}
              pitchHistory={pitchHistory}
              height={200}
            />
          )}
        </div>
      </div>

      {/* Overall score pulse */}
      {isListening && (
        <div className="flex items-center justify-between bg-indigo-500/5 border border-indigo-500/15 rounded-2xl px-6 py-4">
          <span className="text-[11px] font-bold uppercase tracking-widest text-indigo-400">Live Overall Score</span>
          <span className="text-4xl font-black text-white tabular-nums">{metrics.overall}<span className="text-lg text-indigo-400">%</span></span>
        </div>
      )}

      {/* Start / Stop */}
      {!showResults && (
        <button
          onClick={isListening ? handleStop : handleStart}
          disabled={!prompt || isLoadingPrompt}
          className={cn(
            'flex items-center justify-center gap-3 w-full py-5 rounded-2xl font-bold text-lg transition-all shadow-xl active:scale-[.99] disabled:opacity-40 disabled:cursor-not-allowed',
            isListening
              ? 'bg-rose-500 hover:bg-rose-600 text-white shadow-rose-500/25'
              : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-indigo-600/25'
          )}
        >
          {isListening
            ? <><StopCircle size={22} /> Stop & See Results</>
            : <><Mic size={22} /> Start Voice Analysis</>}
        </button>
      )}

      {/* Results overlay */}
      {showResults && finalResults && (
        <div className="flex flex-col gap-5 animate-in slide-in-from-bottom-4 duration-500">
          <div className="text-center">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-[11px] font-bold uppercase tracking-widest mb-2">
              <Activity size={12}/> Analysis Complete
            </div>
            <h3 className="text-2xl font-extrabold text-white">Your Vocal Resonance</h3>
            <p className="text-slate-400 text-sm mt-1">Band target: {selectedBand} · Session: {finalResults.durationSec}s</p>
          </div>

          {/* 4 score rings */}
          <div className="grid grid-cols-4 gap-3">
            {([
              { label: 'Pitch',     score: finalResults.pitch,     color: 'purple' },
              { label: 'Resonance', score: finalResults.resonance, color: 'blue'   },
              { label: 'Stress',    score: finalResults.stress,    color: 'green'  },
              { label: 'Tempo',     score: finalResults.tempo,     color: 'green'  },
            ] as const).map(r => (
              <ScoreRing key={r.label} label={r.label} score={r.score} color={r.color} />
            ))}
          </div>

          {/* Overall big score */}
          <div className="bg-gradient-to-br from-indigo-600/20 to-purple-600/10 border border-indigo-500/20 rounded-2xl p-6 text-center">
            <div className="text-[11px] font-bold uppercase tracking-widest text-indigo-400 mb-1">Overall Resonance Score</div>
            <div className="text-6xl font-black text-white">{finalResults.overall}<span className="text-2xl text-indigo-400">%</span></div>
            <div className={`text-lg font-bold mt-1 ${gradeColor(finalResults.overall)}`}>Grade {grade(finalResults.overall)}</div>
          </div>

          {/* Dimension coaching tips */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {([
              { label: 'Pitch', score: finalResults.pitch,
                tip: finalResults.pitch >= 70
                  ? 'Great pitch range! Your voice sits in a natural speaking frequency.'
                  : 'Try speaking in a slightly lower or higher register to match the band target range.' },
              { label: 'Resonance', score: finalResults.resonance,
                tip: finalResults.resonance >= 70
                  ? 'Good vocal resonance — your voice has a forward, bright quality.'
                  : 'Project your voice forward. Imagine speaking from your chest, not your throat.' },
              { label: 'Stress', score: finalResults.stress,
                tip: finalResults.stress >= 70
                  ? 'Natural stress patterns — good amplitude contrast across syllables.'
                  : 'Vary your volume more. Strongly stress key words and soften unstressed syllables.' },
              { label: 'Tempo', score: finalResults.tempo,
                tip: finalResults.tempo >= 70
                  ? 'Excellent pacing — your syllable rate matches the target band.'
                  : 'Adjust your speaking speed. Aim for a more even, deliberate syllable rhythm.' },
            ]).map(d => (
              <div key={d.label} className={cn(
                'rounded-xl p-4 border text-sm',
                d.score >= 70
                  ? 'bg-emerald-900/40 border-emerald-500/30 text-emerald-200'
                  : 'bg-amber-900/40  border-amber-500/30  text-amber-200'
              )}>
                <div className="font-bold mb-1 text-white">{d.label}: {d.score}%</div>
                <div className="text-[13px] leading-relaxed opacity-90">{d.tip}</div>
              </div>
            ))}
          </div>

          {/* Actions */}
          <div className="flex gap-4">
            <button
              onClick={handleTryAgain}
              className="flex-1 py-4 rounded-2xl font-bold border-2 border-slate-700 text-white hover:border-indigo-500 transition-all"
            >
              <RotateCcw size={16} className="inline mr-2" /> Try Again
            </button>
            <button
              onClick={onExit}
              className="flex-1 py-4 rounded-2xl font-bold bg-indigo-600 text-white hover:bg-indigo-500 transition-all shadow-lg shadow-indigo-600/20"
            >
              Back to Dashboard
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// ATOMS
// ─────────────────────────────────────────────────────────────────────────────

function WordPill({ word, status }: { word: string; status: WordStatus }) {
  const cfg = {
    clean:  {
      text: 'text-emerald-300',
      bg:   'bg-emerald-500/20',
      border: 'border-emerald-500/40',
    },
    filter: {
      text: 'text-orange-300',
      bg:   'bg-orange-500/25',
      border: 'border-orange-500/50',
    },
    weak: {
      text: 'text-yellow-300',
      bg:   'bg-yellow-500/20',
      border: 'border-yellow-500/40',
    },
  }[status];

  return (
    <span className={cn(
      'px-3 py-1.5 rounded-lg text-base font-semibold border transition-all select-none',
      cfg.bg, cfg.text, cfg.border
    )}>
      {word}
    </span>
  );
}

function LiveStatCard({ label, value, good, bad }: { label: string; value: number; good?: boolean; bad?: boolean }) {
  const color = bad ? 'text-rose-500' : good ? 'text-emerald-500' : 'text-purple-600 dark:text-purple-400';
  return (
    <div className="bg-white dark:bg-[#121214] rounded-2xl p-5 border border-slate-200 dark:border-[#27272a] shadow-sm text-center">
      <div className={`text-3xl font-black mb-1 ${color}`}>{value}</div>
      <div className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{label}</div>
    </div>
  );
}

function ScoreRing({ label, score, color }: { label: string; score: number; color: 'purple' | 'blue' | 'green' }) {
  const colorMap = {
    purple: { text: 'text-purple-600 dark:text-purple-400', ring: '#9333ea', bg: 'bg-purple-500/10' },
    blue:   { text: 'text-blue-600 dark:text-blue-400',     ring: '#2563eb', bg: 'bg-blue-500/10'   },
    green:  { text: 'text-emerald-600 dark:text-emerald-400', ring: '#10b981', bg: 'bg-emerald-500/10' },
  }[color];

  const radius = 42;
  const circumference = 2 * Math.PI * radius;
  const strokeDash = (score / 100) * circumference;

  return (
    <div className="bg-white dark:bg-[#0c0c0e] border border-slate-200 dark:border-[#27272a] rounded-2xl p-6 flex flex-col items-center gap-3 shadow-sm">
      <svg width="100" height="100" className="-rotate-90">
        <circle cx="50" cy="50" r={radius} strokeWidth="8" fill="none" stroke="currentColor" className="text-slate-100 dark:text-[#1f1f23]" />
        <circle
          cx="50" cy="50" r={radius} strokeWidth="8" fill="none"
          stroke={colorMap.ring}
          strokeDasharray={`${strokeDash} ${circumference}`}
          strokeLinecap="round"
          style={{ transition: 'stroke-dasharray 1s ease' }}
        />
      </svg>
      <div className={`-mt-2 text-3xl font-black ${colorMap.text}`}>{score}<span className="text-base font-bold opacity-60">%</span></div>
      <div className="text-[11px] font-bold uppercase tracking-widest text-slate-400">{label}</div>
    </div>
  );
}

function MetricCard({ icon, label, value, target }: { icon: React.ReactNode; label: string; value: number; target: string }) {
  return (
    <div className="bg-slate-50 dark:bg-[#121214] border border-slate-200 dark:border-[#27272a] rounded-2xl p-5 text-center">
      <div className="flex items-center justify-center gap-1.5 text-slate-400 text-[10px] font-bold uppercase tracking-widest mb-3">
        {icon} {label}
      </div>
      <div className="text-2xl font-black text-slate-900 dark:text-white mb-1">{value}</div>
      <div className="text-[10px] text-slate-400">{target}</div>
    </div>
  );
}
