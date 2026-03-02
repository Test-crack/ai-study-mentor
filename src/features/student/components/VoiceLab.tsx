import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import {
  Play, Scissors, Mic, Square, Activity, Sparkles,
  Radio, ChevronLeft, BarChart3, CheckCircle2, XCircle,
  RotateCcw, AlertTriangle, Target, Zap
} from 'lucide-react';
import { StudentSidebar } from './dashboard/StudentSidebar';
import { StudentTopbar } from './dashboard/StudentTopbar';
import { useSpeechToText } from '../hooks/useSpeechToText';
import { getRandomPrompt, ALL_BANDS } from '@/shared/data/anatomyPrompts';
import type { AnatomyBand, AnatomyPrompt } from '@/shared/data/anatomyPrompts';
import { FILLER_SET } from '@/shared/data/fillers';
import { cn } from '@/shared/utils';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { toast } from 'sonner';

// ── Types ─────────────────────────────────────────────────────────────────────
type ViewState = 'dashboard' | 'anatomy' | 'resonance';
type AnatomyPhase = 'setup' | 'recording' | 'results';
type WordStatus = 'clean' | 'filter' | 'weak';

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
                isSidebarCollapsed={isSidebarCollapsed}
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
  const [prompt, setPrompt] = useState<AnatomyPrompt>(() => getRandomPrompt('Band 7'));

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
          prompt.question.toLowerCase().split(/\s+/).map(w => w.replace(/[^a-z]/g, ''))
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
    }, [prompt.question]),
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

  // ── Handlers ───────────────────────────────────────────────────────────────
  const handleBandSelect = (band: AnatomyBand) => {
    setSelectedBand(band);
    setPrompt(getRandomPrompt(band));
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
    setPrompt(getRandomPrompt(selectedBand));
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
            <div className="flex items-center justify-between mb-5">
              <p className="text-[11px] font-bold tracking-widest uppercase text-slate-400 dark:text-[#52525b] flex items-center gap-2">
                <Target size={12} /> Your Speaking Prompt
              </p>
              <button
                onClick={() => setPrompt(getRandomPrompt(selectedBand))}
                className="text-[11px] font-bold text-purple-600 dark:text-purple-400 hover:underline flex items-center gap-1"
              >
                <RotateCcw size={11} /> New prompt
              </button>
            </div>
            <p className="text-slate-900 dark:text-white text-xl md:text-2xl font-bold leading-relaxed mb-5">
              "{prompt.question}"
            </p>
            <div className="flex flex-wrap items-center gap-4 p-4 bg-purple-500/5 border border-purple-500/10 rounded-xl">
              <div className="flex items-center gap-2 text-[11px] text-purple-600 dark:text-purple-400 font-bold">
                <Zap size={12} /> Target: {prompt.targetWpm.min}–{prompt.targetWpm.max} WPM
              </div>
              <div className="text-[11px] text-slate-500 dark:text-[#a1a1aa]">
                💡 {prompt.hint}
              </div>
            </div>
          </div>

          {/* Start button */}
          <button
            onClick={handleStartRecording}
            className="flex items-center justify-center gap-3 w-full py-5 bg-purple-600 hover:bg-purple-500 text-white rounded-2xl font-bold text-lg transition-all shadow-xl shadow-purple-600/25 active:scale-[.99]"
          >
            <Mic size={22} /> Start Speech Analysis
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
            <LiveStatCard label="WPM"    value={currentWPM}   good={currentWPM >= prompt.targetWpm.min && currentWPM <= prompt.targetWpm.max} />
            <LiveStatCard label="Words"  value={wordsArray.length} />
            <LiveStatCard label="Fillers" value={fillerCount}  good={fillerCount === 0} bad={fillerCount > 3} />
            <LiveStatCard label="Pauses" value={pauseCount}   good={pauseCount <= 1}   bad={pauseCount > 4} />
          </div>

          {/* Prompt reminder */}
          <div className="bg-slate-50 dark:bg-[#121214] border border-slate-200 dark:border-[#27272a] rounded-xl p-5">
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-2">Prompt</p>
            <p className="text-slate-700 dark:text-slate-300 text-sm leading-relaxed opacity-80">"{prompt.question}"</p>
          </div>

          {/* Live transcript */}
          <div className="bg-[#0c0c0e] rounded-2xl border border-[#1f1f23] shadow-xl overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-[#1f1f23]">
              <div className="flex items-center gap-3">
                <div className={cn('w-2.5 h-2.5 rounded-full', isListening ? 'bg-rose-500 animate-ping' : 'bg-slate-600')} />
                <span className="text-[11px] font-bold uppercase tracking-widest text-slate-300">Live Transcript</span>
              </div>
              <span className="text-xs font-mono text-slate-500">{formatTime(recordingTime)}</span>
            </div>

            <div className="min-h-[180px] p-6 flex flex-wrap content-start gap-x-1 gap-y-2">
              {isListening && !isSTTReady && (
                <div className="w-full h-full flex flex-col items-center justify-center text-purple-400 animate-pulse gap-2 py-8">
                  <Sparkles className="w-8 h-8" />
                  <span className="text-sm font-bold">Connecting voice engine...</span>
                </div>
              )}
              {isSTTReady && dissectedWords.length === 0 && (
                <div className="w-full flex flex-col items-center justify-center text-emerald-500 py-8 gap-2 animate-bounce">
                  <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping" />
                  <span className="text-sm font-bold">READY — start speaking now!</span>
                </div>
              )}
              {dissectedWords.map((w, i) => (
                <WordPill key={i} word={w.word} status={w.status} />
              ))}
              {isListening && dissectedWords.length > 0 && (
                <span className="animate-pulse border-r-2 border-purple-500 h-5 self-center" />
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

          {/* Breakdown stats */}
          <div className="grid grid-cols-3 gap-4">
            <MetricCard icon={<Activity size={14}/>} label="WPM"    value={results.wpm}            target={`${prompt.targetWpm.min}–${prompt.targetWpm.max}`} />
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

          {/* Word dissection (mini) */}
          {dissectedWords.length > 0 && (
            <div className="bg-slate-50 dark:bg-[#121214] border border-slate-200 dark:border-[#27272a] rounded-2xl p-6">
              <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-200 dark:border-[#27272a]">
                <h3 className="text-[11px] font-bold uppercase tracking-widest text-slate-500">Word-Level Dissection</h3>
                <div className="flex items-center gap-4 text-[10px] font-bold uppercase tracking-widest text-slate-400">
                  <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-green-500"/><span>Clean</span></span>
                  <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-orange-500"/><span>Filler</span></span>
                  <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-yellow-500"/><span>Unclear</span></span>
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                {dissectedWords.slice(0, 80).map((w, i) => (
                  <WordPill key={i} word={w.word} status={w.status} />
                ))}
                {dissectedWords.length > 80 && (
                  <span className="text-xs text-slate-400 self-center">+{dissectedWords.length - 80} more</span>
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
// RESONANCE VIEW (unchanged from original — kept as-is)
// ─────────────────────────────────────────────────────────────────────────────
function ResonanceView({ onExit, onNavigate, isSidebarCollapsed }: { onExit: () => void, onNavigate: (view: ViewState) => void, isSidebarCollapsed: boolean }) {
  const [activeIdx, setActiveIdx] = useState(0);
  const [phraseProgress, setPhraseProgress] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const [unlocked, setUnlocked] = useState<number[]>([]);
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const [isFinalized, setIsFinalized] = useState(false);
  const [metrics, setMetrics] = useState({ res:0, pitch:0, tempo:0, stress:0, over:0 });

  useEffect(() => {
    let interval: any;
    if (isPlaying && !isFinalized) {
      interval = setInterval(() => setPhraseProgress(p => p >= 100 ? 100 : p + 1.5), 50);
    }
    return () => clearInterval(interval);
  }, [isPlaying, isFinalized]);

  useEffect(() => {
    if (phraseProgress >= 100 && !unlocked.includes(activeIdx)) {
      setUnlocked(prev => [...prev, activeIdx]);
      setToastMsg("Power frequency matched! Level unlocked.");
      setTimeout(() => {
        setToastMsg(null);
        if (activeIdx < RESONANCE_PHRASES.length - 1) { setActiveIdx(i => i+1); setPhraseProgress(0); }
        else { setIsFinalized(true); setToastMsg("Demo complete! Your Vocal Resonance profile is ready."); }
      }, 1500);
    }
  }, [phraseProgress, activeIdx, unlocked]);

  useEffect(() => {
    const target = RESONANCE_PHRASES[activeIdx].scores;
    const factor = Math.min(phraseProgress / 90, 1);
    setMetrics({
      res: Math.floor(target.res*factor+(Math.random()*2)),
      pitch: Math.floor(target.pitch*factor+(Math.random()*2)),
      tempo: Math.floor(target.tempo*factor+(Math.random()*2)),
      stress: Math.floor(target.stress*factor+(Math.random()*2)),
      over: Math.floor(target.over*factor+(Math.random()*2))
    });
  }, [phraseProgress, activeIdx]);

  const totalBarWidth = (activeIdx * 20) + (phraseProgress * 0.2);

  return (
    <div className="flex flex-col gap-6 animate-in fade-in duration-500 relative pb-40">
      <div className="flex justify-between items-center mb-2">
        <button onClick={onExit} className="flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-purple-600 transition-colors">
          <ChevronLeft size={18}/> Back to Dashboard
        </button>
        <button onClick={() => onNavigate('anatomy')} className="flex items-center gap-2 px-4 py-2 bg-slate-100 dark:bg-slate-800 rounded-lg text-xs font-bold uppercase tracking-wider hover:bg-purple-600 hover:text-white transition-all border border-slate-200 dark:border-slate-700 shadow-sm">
          <BarChart3 size={14}/> Anatomy Analytics
        </button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-5 bg-slate-50 dark:bg-[#121214] border border-slate-200 dark:border-[#27272a] rounded-xl p-6 md:divide-x divide-slate-200 dark:divide-[#27272a] shadow-sm">
        {[['RESONANCE',metrics.res,'text-purple-600 dark:text-purple-400'],['PITCH',metrics.pitch,'text-green-600 dark:text-green-400'],['TEMPO',metrics.tempo,'text-yellow-600 dark:text-yellow-400'],['STRESS',metrics.stress,'text-purple-600 dark:text-purple-400'],['OVERALL',metrics.over,'text-slate-900 dark:text-white']].map(([t,v,c]:any)=>(
          <div key={t} className="flex flex-col items-center justify-center p-4">
            <span className={`text-2xl md:text-3xl font-black mb-2 ${c}`}>{v}%</span>
            <span className="text-[9px] font-bold tracking-widest text-slate-400 dark:text-[#52525b] uppercase">{t}</span>
          </div>
        ))}
      </div>

      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <span className="text-[10px] text-purple-600 dark:text-purple-400 font-bold uppercase tracking-widest">Speak This Phrase</span>
          <h2 className="text-2xl md:text-3xl font-bold text-slate-900 dark:text-white tracking-tight">{RESONANCE_PHRASES[activeIdx].text}</h2>
        </div>
        <button
          onClick={() => { if(isFinalized){setActiveIdx(0);setPhraseProgress(0);setUnlocked([]);setIsFinalized(false);}else{setIsPlaying(!isPlaying);} }}
          className={`w-full md:w-auto flex items-center justify-center gap-2 px-6 py-3 rounded-xl text-sm font-bold transition-all shadow-lg ${isFinalized?'bg-purple-600 text-white':isPlaying?'bg-red-500/10 text-red-600 dark:text-red-500 border border-red-500/20':'bg-green-500/10 text-green-600 dark:text-green-500 border border-green-500/20'}`}
        >
          {isFinalized?<><RotateCcw size={16}/>Restart</>:isPlaying?<><Square size={16} fill="currentColor"/>Stop</>:<><Play size={16} fill="currentColor"/>Start</>}
        </button>
      </div>

      <div className="bg-slate-50 dark:bg-[#121214] border border-slate-200 dark:border-[#27272a] rounded-2xl p-4 md:p-8">
        <h3 className="text-[11px] font-bold tracking-widest uppercase text-slate-500 dark:text-[#a1a1aa] mb-8">Vocal Frequency Heatmap</h3>
        <div className="h-32 flex items-center gap-[2px] md:gap-[4px] w-full bg-slate-100 dark:bg-[#070708] rounded-xl p-4 md:p-6 border border-slate-200 dark:border-[#1f1f23] relative overflow-hidden">
          {Array.from({length:60}).map((_,i)=>{
            const masterH=Math.sin(i*0.15+activeIdx)*35+45;
            const active=(i/60)*100<phraseProgress;
            return (
              <div key={i} className="relative flex-1 h-full flex items-center justify-center">
                <div className="absolute w-full rounded-full bg-slate-300 dark:bg-white/5" style={{height:`${masterH}%`}}/>
                {active&&<div className={`absolute w-full rounded-full z-10 ${Math.random()>0.3?'bg-yellow-400 dark:bg-[#fde047] shadow-[0_0_8px_#fde047]':'bg-red-500'}`} style={{height:`${masterH+(Math.random()*4-2)}%`}}/>}
              </div>
            );
          })}
          <div className="absolute top-0 bottom-0 w-[2px] bg-red-500 shadow-[0_0_15px_#ef4444] z-20" style={{left:`${phraseProgress}%`}}/>
        </div>
      </div>

      <div className={`fixed bottom-0 right-0 bg-white/90 dark:bg-[#0c0c0e]/90 backdrop-blur-xl border-t border-slate-200 dark:border-[#1f1f23] p-6 md:p-8 z-40 transition-all duration-300 ${isSidebarCollapsed?'left-0 lg:left-28':'left-0 lg:left-72'}`}>
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-[#a1a1aa] mb-4 font-bold uppercase tracking-widest">
            <span>Resonance Progress</span>
            <span>→ <span className="text-slate-900 dark:text-white font-bold">Next at {Math.min((activeIdx+1)*20,100)}%</span></span>
          </div>
          <div className="h-3 w-full bg-slate-200 dark:bg-[#1f1f23] rounded-full overflow-hidden">
            <div className="h-full bg-gradient-to-r from-purple-600 to-indigo-500 transition-all duration-300 shadow-[0_0_15px_rgba(147,51,234,0.4)]" style={{width:`${totalBarWidth}%`}}/>
          </div>
        </div>
      </div>

      {toastMsg && (
        <div className="fixed top-24 right-4 md:right-10 bg-white dark:bg-[#121214] border border-slate-200 dark:border-[#27272a] rounded-xl p-4 shadow-2xl animate-in slide-in-from-right-10 flex items-center gap-3 z-[60]">
          <div className="bg-green-500/20 p-2 rounded-full text-green-600 dark:text-green-500"><CheckCircle2 size={18}/></div>
          <span className="text-sm font-bold text-slate-900 dark:text-white">{toastMsg}</span>
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
    clean:  { text: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-500/10 dark:bg-emerald-500/10', border: 'border-emerald-500/20' },
    filter: { text: 'text-orange-600 dark:text-orange-400',   bg: 'bg-orange-500/10',   border: 'border-orange-500/20' },
    weak:   { text: 'text-yellow-600 dark:text-yellow-400',   bg: 'bg-yellow-500/10',   border: 'border-yellow-500/20' },
  }[status];

  return (
    <span className={cn(
      'px-2.5 py-1 rounded-lg text-sm font-semibold border transition-all',
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
