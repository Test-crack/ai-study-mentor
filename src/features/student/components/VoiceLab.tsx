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

// â”€â”€ Types â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
type ViewState = 'dashboard' | 'anatomy' | 'resonance';
type AnatomyPhase = 'setup' | 'recording' | 'results';
type WordStatus = 'clean' | 'filter' | 'weak';
type AnatomyBand = 'Band 5' | 'Band 6' | 'Band 7' | 'Band 8';

const ALL_BANDS: AnatomyBand[] = ['Band 5', 'Band 6', 'Band 7', 'Band 8'];

interface DissectedWord { word: string; status: WordStatus; confidence?: number; }

// â”€â”€ Resonance demo data (kept from original) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
const RESONANCE_PHRASES = [
  { text: "The quarterly revenue exceeded all projections", scores: { res: 72, pitch: 70, tempo: 65, stress: 80, over: 72 } },
  { text: "We need to pivot our go-to-market strategy",   scores: { res: 82, pitch: 85, tempo: 75, stress: 90, over: 82 } },
  { text: "Our competitive moat lies in execution speed", scores: { res: 88, pitch: 90, tempo: 75, stress: 85, over: 88 } },
  { text: "The Series B funding will close next quarter",  scores: { res: 74, pitch: 80, tempo: 70, stress: 75, over: 74 } },
  { text: "Customer acquisition cost dropped by forty percent", scores: { res: 85, pitch: 92, tempo: 75, stress: 80, over: 85 } },
];

// â”€â”€ Score helpers â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
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

// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// ROOT COMPONENT
// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
export default function VoiceLab() {
  const [activeTab, setActiveTab]   = useState<ViewState>('dashboard');
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(true);

  return (
    <div className="flex h-screen bg-[#f1f3f9] dark:bg-slate-950 text-slate-800 dark:text-slate-200 font-sans transition-colors duration-300 overflow-hidden">
      <StudentSidebar
        activeTab="voice"
        isCollapsed={isSidebarCollapsed}
        toggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
      />

      <div className={`flex-1 flex flex-col min-w-0 transition-all duration-300 ${isSidebarCollapsed ? 'lg:ml-20' : 'lg:ml-64'}`}>
        <StudentTopbar onUpgradeClick={() => {}} />

        <main className="flex-1 flex flex-col relative overflow-y-auto p-6 md:p-8">
          <div className="max-w-7xl mx-auto w-full">
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

// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// HOME VIEW 
// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function HomeView({ onNavigate }: { onNavigate: (v: ViewState) => void }) {
  return (
    <div className="max-w-4xl animate-in fade-in duration-500">
      <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#256B8B]/10 text-[#256B8B] dark:text-[#4E8CA6] text-xs font-semibold tracking-wide mb-8">
        <Activity size={14} /> Voice Analysis Lab
      </div>
      <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-4 text-[#0b132b] dark:text-white">
        Improve Your <span className="text-[#0A6E64] dark:text-[#0A6E64]">Vocal Delivery</span>
      </h1>
      <p className="text-slate-500 dark:text-slate-400 text-lg mb-10 max-w-2xl">
        Practice your speaking skills with two focused tools. Work on pitch and rhythm, or analyze your fluency and filler words.
      </p>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
  {/* Vocal Resonance Card */}
<div className="bg-brand-teal-100 dark:bg-slate-900 rounded-2xl p-8 shadow-sm border-none flex flex-col items-start gap-6 hover:shadow-md transition-shadow">
  <div className="p-3 bg-brand-teal-50 dark:bg-brand-teal-900/20 text-brand-teal-600 dark:text-brand-teal-400 rounded-xl">
    <Radio size={24} />
  </div>
  <div>
    <h3 className="text-xl font-bold text-[#0b132b] dark:text-white mb-2">Vocal Resonance</h3>
    <p className="text-slate-500 dark:text-slate-400 text-sm">Train your pitch, tempo, and stress to match native speakers in real-time.</p>
  </div>
  <button
    onClick={() => onNavigate('resonance')}
    className="mt-auto bg-brand-teal-700 hover:bg-brand-teal-800 dark:bg-white dark:hover:bg-slate-200 text-white dark:text-brand-teal-700 px-6 py-3 rounded-xl font-semibold transition-colors flex items-center justify-center gap-2 w-full"
  >
    <Play size={16} fill="currentColor" /> Start Resonance Practice
  </button>
</div>

{/* Speech Anatomy Card */}
<div className="bg-brand-teal-100 dark:bg-slate-900 rounded-2xl p-8 shadow-sm border-none flex flex-col items-start gap-6 hover:shadow-md transition-shadow">
  <div className="p-3 bg-[#f5f0ff] dark:bg-[#256B8B]/20 text-[#256B8B] dark:text-[#4E8CA6] rounded-xl">
    <Scissors size={24} />
  </div>
  <div>
    <h3 className="text-xl font-bold text-[#0b132b] dark:text-white mb-2">Speech Anatomy</h3>
    <p className="text-slate-500 dark:text-slate-400 text-sm">Dissect your speech patterns, detect filler words, and measure speaking pace.</p>
  </div>
  <button
    onClick={() => onNavigate('anatomy')}
    className="mt-auto bg-brand-teal-700 hover:bg-brand-teal-800 dark:bg-white dark:hover:bg-slate-200 text-white dark:text-brand-teal-700 px-6 py-3 rounded-xl font-semibold transition-colors flex items-center justify-center gap-2 w-full"
  >
    <Scissors size={16} /> Start Speech Anatomy
  </button>
</div>
      </div>
    </div>
  );
}

// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// ANATOMY VIEW
// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function AnatomyView({ onExit, onNavigate }: { onExit: () => void; onNavigate: (v: ViewState) => void }) {
  // â”€â”€ Phase state â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const [phase, setPhase] = useState<AnatomyPhase>('setup');
  const [selectedBand, setSelectedBand] = useState<AnatomyBand>('Band 7');
  const [prompt, setPrompt] = useState<VoicePrompt | null>(null);
  const [isLoadingPrompt, setIsLoadingPrompt] = useState(false);
  const seenPromptIdsRef = useRef<string[]>([]);

  // Fetch initial prompt on mount
  useEffect(() => { loadPrompt('Band 7'); }, []);

  // â”€â”€ Recording state â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const [recordingTime, setRecordingTime]     = useState(0);
  const [pauseCount, setPauseCount]           = useState(0);
  const [isCurrentlyPausing, setIsCurrentlyPausing] = useState(false);
  const lastTranscriptTimeRef                  = useRef<number>(Date.now());

  // â”€â”€ Transcript + word accumulation â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const [dissectedWords, setDissectedWords]   = useState<DissectedWord[]>([]);
  const [fillerCount, setFillerCount]         = useState(0);
  const wordConfidencesRef                     = useRef<number[]>([]);
  const chunkDurationsRef                      = useRef<number[]>([]);
  const lastChunkTimeRef                       = useRef<number>(0);

  // â”€â”€ Final results â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const [results, setResults] = useState<{
    confidenceScore: number;
    pronunciationScore: number;
    deliveryScore: number;
    wpm: number;
    pauseCount: number;
    fillersDetected: number;
    fillerDetails: Record<string, number>;
  } | null>(null);

  // â”€â”€ STT hook â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
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

  // â”€â”€ Word / pause derived data â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const wordsArray = useMemo(() =>
    transcript.split(/\s+/).filter(w => w.length > 0), [transcript]);

  const currentWPM = useMemo(() =>
    recordingTime > 0 ? Math.round((wordsArray.length / recordingTime) * 60) : 0,
    [wordsArray.length, recordingTime]);

  // â”€â”€ Timer â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  useEffect(() => {
    if (!isListening || !isSTTReady) return;
    const t = setInterval(() => setRecordingTime(p => p + 1), 1000);
    return () => clearInterval(t);
  }, [isListening, isSTTReady]);

  // â”€â”€ Pause detection â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
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

  // â”€â”€ API prompt loader â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
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

  // â”€â”€ Handlers â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
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

  // â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  // RENDER
  // â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  return (
    <div className="flex flex-col gap-6 animate-in fade-in duration-300 max-w-5xl mx-auto">

      {/* â”€â”€ Header â”€â”€ */}
      {phase !== 'results' && (
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
        <button onClick={onExit} className="flex items-center gap-1 text-sm font-medium text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors">
          <ChevronLeft size={16} /> Back
        </button>
        <button onClick={() => onNavigate('resonance')} className="flex items-center gap-2 px-3 py-1.5 bg-white dark:bg-slate-800 rounded-md text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors border border-slate-200 dark:border-slate-700 shadow-sm">
          Switch to Resonance <Radio size={14} />
        </button>
      </div>
      )}

      {/* â”€â”€ Page title â”€â”€ */}
      {phase !== 'results' && (
        <div className="mb-2">
          <h2 className="text-2xl font-bold text-[#0b132b] dark:text-white">
            {phase === 'setup' ? 'Speech Anatomy Setup' : 'Live Analysis'}
          </h2>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
            {phase === 'setup'
              ? 'Select your target band and review the prompt before starting.'
              : 'Speak clearly. Your words are analyzed in real-time.'}
          </p>
        </div>
      )}

      {/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */}
      {/* PHASE 1 â€” SETUP                                                    */}
      {/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */}
      {phase === 'setup' && (
        <div className="flex flex-col gap-6">

          {/* Band selector */}
          <div className="flex flex-wrap gap-2 border-b border-slate-200 dark:border-slate-800 pb-4">
            {ALL_BANDS.map(band => (
              <button
                key={band}
                onClick={() => handleBandSelect(band)}
                className={cn(
                  'px-4 py-2 rounded-md text-sm font-medium transition-colors',
                  selectedBand === band
                    ? 'bg-[#0b132b] text-white dark:bg-white dark:text-[#0b132b]'
                    : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:bg-slate-50 border border-slate-200 dark:border-slate-800'
                )}
              >
                {band}
              </button>
            ))}
          </div>

          {/* Prompt card */}
          <div className="bg-white dark:bg-slate-900 border-none rounded-2xl p-6 md:p-8 shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <p className="text-sm font-medium text-slate-500 flex items-center gap-2">
                 Prompt
              </p>
              <button
                onClick={() => loadPrompt(selectedBand, seenPromptIdsRef.current)}
                disabled={isLoadingPrompt || !prompt}
                className="text-xs font-semibold text-[#256B8B] dark:text-[#4E8CA6] hover:underline flex items-center gap-1 disabled:opacity-50"
              >
                {isLoadingPrompt ? <Loader2 size={12} className="animate-spin" /> : <RotateCcw size={12} />} Refresh
              </button>
            </div>

            {/* Loading skeleton */}
            {(isLoadingPrompt || !prompt) ? (
              <div className="space-y-4 animate-pulse py-2">
                <div className="h-6 bg-slate-100 dark:bg-slate-800 rounded-md w-full" />
                <div className="h-6 bg-slate-100 dark:bg-slate-800 rounded-md w-4/5" />
              </div>
            ) : (
              <div className="space-y-6">
                <p className="text-[#0b132b] dark:text-white text-lg md:text-xl font-medium leading-relaxed">
                  {prompt.question}
                </p>
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl">
                  <div className="flex items-center gap-1.5 px-3 py-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-md text-xs font-semibold text-slate-600 dark:text-slate-300">
                    <Target size={14} className="text-slate-400" /> {prompt.targetWpmMin}-{prompt.targetWpmMax} WPM target
                  </div>
                  {prompt.hint && (
                    <div className="text-sm text-slate-500 dark:text-slate-400">
                      ðŸ’¡ {prompt.hint}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Start button */}
          <button
            onClick={handleStartRecording}
            disabled={!prompt || isLoadingPrompt}
            className={cn(
              'flex items-center justify-center gap-2 w-full py-4 rounded-xl font-semibold text-base transition-colors mt-2',
              prompt && !isLoadingPrompt
                ? 'bg-[#256B8B] hover:bg-[#185A78] text-white'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-400 cursor-not-allowed'
            )}
          >
            <Mic size={18} /> {isLoadingPrompt ? 'Loading prompt...' : 'Start Recording'}
          </button>
        </div>
      )}

      {/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */}
      {/* PHASE 2 â€” RECORDING                                                */}
      {/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */}
      {phase === 'recording' && (
        <div className="flex flex-col gap-6">

          {/* Live stat cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <LiveStatCard label="WPM"    value={currentWPM}   good={!!prompt && currentWPM >= prompt.targetWpmMin && currentWPM <= prompt.targetWpmMax} />
            <LiveStatCard label="Words"  value={wordsArray.length} />
            <LiveStatCard label="Fillers" value={fillerCount}  good={fillerCount === 0} bad={fillerCount > 3} />
            <LiveStatCard label="Pauses" value={pauseCount}   good={pauseCount <= 1}   bad={pauseCount > 4} />
          </div>

          {/* Prompt reminder */}
          {prompt && (
            <div className="bg-white dark:bg-slate-900 border-none shadow-sm rounded-xl px-6 py-5">
              <p className="text-slate-700 dark:text-slate-300 text-base font-medium">{prompt.question}</p>
            </div>
          )}

          {/* Live transcript */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border-none shadow-sm overflow-hidden flex flex-col h-[300px]">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2 text-rose-600 dark:text-rose-500">
                <div className={cn('w-2 h-2 rounded-full', isListening ? 'bg-rose-600 dark:bg-rose-500 animate-pulse' : 'bg-slate-400')} />
                <span className="text-xs font-semibold uppercase tracking-wider">Live Transcript</span>
              </div>
              <span className="text-sm font-mono text-slate-500">{formatTime(recordingTime)}</span>
            </div>

            <div className="flex-1 p-6 flex flex-wrap content-start gap-x-2 gap-y-3 overflow-y-auto">
              {isListening && !isSTTReady && (
                <div className="w-full h-full flex flex-col items-center justify-center text-slate-400 gap-2">
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span className="text-sm">Connecting microphone...</span>
                </div>
              )}
              {isSTTReady && dissectedWords.length === 0 && (
                <div className="w-full h-full flex items-center justify-center">
                  <span className="text-slate-400 italic">Ready. Start speaking...</span>
                </div>
              )}
              {dissectedWords.map((w, i) => (
                <WordPill key={i} word={w.word} status={w.status} />
              ))}
              {isListening && dissectedWords.length > 0 && (
                <span className="animate-pulse border-r-2 border-[#256B8B] h-5 self-center ml-1" />
              )}
            </div>
          </div>

          {/* Stop button */}
          <button
            onClick={handleStopRecording}
            disabled={!isSTTReady}
            className={cn(
              'flex items-center justify-center gap-2 w-full py-4 rounded-xl font-semibold text-base transition-colors mt-2',
              isSTTReady
                ? 'bg-rose-500 hover:bg-rose-600 text-white'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-400 cursor-not-allowed'
            )}
          >
            <Square size={18} fill="currentColor" /> Stop Analysis
          </button>
        </div>
      )}

      {/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */}
      {/* PHASE 3 â€” RESULTS                                                  */}
      {/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */}
      {phase === 'results' && results && (
        <div className="flex flex-col gap-6 animate-in fade-in flex items-center mt-4 w-full">

          <div className="text-center space-y-2 mb-4 w-full">
            <div className="inline-flex items-center justify-center gap-2 px-3 py-1 rounded-full bg-[#f5f0ff] dark:bg-[#256B8B]/10 text-[#256B8B] dark:text-[#4E8CA6] text-[10px] font-bold uppercase tracking-widest mb-2">
              <Activity size={12} /> Analysis Complete
            </div>
            <h2 className="text-3xl font-extrabold text-[#0b132b] dark:text-white">Speech Anatomy Results</h2>
            <p className="text-slate-500 text-sm">Band target: {selectedBand}</p>
          </div>

          {/* 3 Score areas */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 w-full">
            <ScoreRing label="Confidence" sublabel="Fluency Â· Pauses Â· Fillers" score={results.confidenceScore} color="purple" />
            <ScoreRing label="Pronunciation" sublabel="Word clarity Â· STT confidence" score={results.pronunciationScore} color="blue" />
            <ScoreRing label="Delivery" sublabel="Pace Â· Rhythm Â· Tempo" score={results.deliveryScore} color="green" />
          </div>

          {/* Breakdown stats */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 w-full mt-2">
            <MetricCard icon={<Activity size={14}/>} label="WPM" value={results.wpm} target={prompt ? `${prompt.targetWpmMin}â€“${prompt.targetWpmMax}` : '130â€“160'} />
            <MetricCard icon={<Target size={14}/>} label="Pauses" value={results.pauseCount} target="< 3 ideal" />
            <MetricCard icon={<AlertTriangle size={14}/>} label="Fillers" value={results.fillersDetected} target="0 ideal" />
          </div>

          {/* Filler breakdown */}
          {Object.keys(results.fillerDetails).length > 0 && (
            <div className="w-full bg-[#fffcf2] dark:bg-amber-900/10 p-6 rounded-2xl border border-amber-200 dark:border-amber-900/30 mt-2">
              <div className="flex items-center gap-2 mb-4">
                <AlertTriangle size={18} className="text-amber-500" />
                <h3 className="font-bold text-[#8a6a24] dark:text-amber-500">Filler Words Detected</h3>
              </div>
              
              <div className="flex flex-wrap gap-2 mb-6">
                {Object.entries(results.fillerDetails)
                  .sort(([,a],[,b]) => b - a)
                  .map(([word, count]) => (
                    <div key={word} className="bg-white dark:bg-slate-800 px-4 py-2 rounded-xl border border-amber-200 dark:border-slate-700 flex items-center gap-3">
                       <span className="font-mono text-rose-500 font-bold">{word}</span>
                       <span className="text-xs font-black text-slate-400">{count}x</span>
                    </div>
                  ))}
              </div>
              
              <div className="text-sm font-medium text-[#8a6a24] dark:text-amber-400 bg-amber-100/60 dark:bg-amber-900/30 p-4 rounded-xl flex items-start gap-2">
                <span className="opacity-80">ðŸ’¡</span> 
                Tip: A brief pause is always better than a filler word. Take a breath instead.
              </div>
            </div>
          )}

          {/* Word dissection */}
          {dissectedWords.length > 0 && (
            <div className="w-full bg-[#0b132b] dark:bg-[#060608] border-none shadow-sm rounded-3xl overflow-hidden mt-2">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between px-8 py-5 border-b border-white/10 gap-4">
                <h3 className="text-xs font-bold uppercase tracking-widest text-slate-300">Word-Level Dissection</h3>
                <div className="flex items-center gap-5">
                  <span className="flex items-center gap-2 text-xs font-bold text-[#10b981]"><span className="w-2 h-2 rounded-full bg-[#10b981]"/>Clean</span>
                  <span className="flex items-center gap-2 text-xs font-bold text-[#f59e0b]"><span className="w-2 h-2 rounded-full bg-[#f59e0b]"/>Filler</span>
                  <span className="flex items-center gap-2 text-xs font-bold text-[#eab308]"><span className="w-2 h-2 rounded-full bg-[#eab308]"/>Unclear</span>
                </div>
              </div>
              <div className="p-8 flex flex-wrap gap-x-2 gap-y-3 max-h-[400px] overflow-y-auto">
                {dissectedWords.map((w, i) => (
                  <DarkWordPill key={i} word={w.word} status={w.status} />
                ))}
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-4 pt-4 w-full">
            <button
              onClick={handleTryAgain}
              className="flex-1 h-14 rounded-2xl font-bold border-2 text-[#0b132b] bg-white hover:bg-slate-50 transition-colors"
            >
              Try Again
            </button>
            <button
              onClick={onExit}
              className="flex-1 h-14 rounded-2xl font-bold bg-[#256B8B] text-white hover:bg-[#185A78] transition-colors"
            >
              Back to Dashboard
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// RESONANCE VIEW 
// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
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
  
  return (
    <div className="flex flex-col gap-6 animate-in fade-in duration-300 max-w-4xl mx-auto">

      {/* Nav */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
        <button onClick={onExit} className="flex items-center gap-1 text-sm font-medium text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors">
          <ChevronLeft size={16}/> Back
        </button>
        <button onClick={() => onNavigate('anatomy')} className="flex items-center gap-2 px-3 py-1.5 bg-white dark:bg-slate-800 rounded-md text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors border border-slate-200 dark:border-slate-700 shadow-sm">
          Switch to Anatomy <Scissors size={14}/>
        </button>
      </div>

      {/* Header */}
      <div className="mb-2">
        <h2 className="text-2xl font-bold text-[#0b132b] dark:text-white">Vocal Resonance</h2>
        <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">Speak the phrase to analyze your pitch, stress, and rhythm.</p>
      </div>

      {/* Band selector */}
      <div className="flex flex-wrap gap-2 border-b border-slate-200 dark:border-slate-800 pb-4">
        {ALL_BANDS.map(band => (
          <button
            key={band}
            onClick={() => handleBandSelect(band)}
            disabled={isListening}
            className={cn(
              'px-4 py-2 rounded-md text-sm font-medium transition-colors disabled:opacity-50',
              selectedBand === band
                ? 'bg-[#0b132b] text-white dark:bg-white dark:text-[#0b132b]'
                : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:bg-slate-50 border border-slate-200 dark:border-slate-800'
            )}
          >{band}</button>
        ))}
      </div>

      {/* Prompt banner */}
      <div className="bg-white dark:bg-slate-900 border-none rounded-2xl p-6 md:p-8 shadow-sm">
        <div className="flex items-center justify-between mb-6">
          <p className="text-sm font-medium text-slate-500 flex items-center gap-2">
            Prompt
          </p>
          <button
            onClick={() => loadPrompt(selectedBand, seenPromptIdsRef.current)}
            disabled={isLoadingPrompt || isListening}
            className="text-xs font-semibold text-[#256B8B] dark:text-[#4E8CA6] hover:underline flex items-center gap-1 disabled:opacity-50"
          >
            {isLoadingPrompt ? <Loader2 size={12} className="animate-spin" /> : <RotateCcw size={12} />} Refresh
          </button>
        </div>

        {isLoadingPrompt || !prompt ? (
          <div className="space-y-4 animate-pulse py-2">
            <div className="h-6 bg-slate-100 dark:bg-slate-800 rounded-md w-full" />
            <div className="h-6 bg-slate-100 dark:bg-slate-800 rounded-md w-3/4" />
          </div>
        ) : (
          <div className="space-y-6">
            <p className="text-[#0b132b] dark:text-white text-lg md:text-xl font-medium leading-relaxed">{prompt.question}</p>
            {prompt.hint && (
              <div className="text-sm text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl">
                ðŸ’¡ {prompt.hint}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Live metrics strip */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {([
          { label: 'Pitch',     value: metrics.pitch,     sub: `${metrics.pitchHz}Hz`,     color: 'text-brand-blue-500' },
          { label: 'Resonance', value: metrics.resonance, sub: `${metrics.centroidHz}Hz`,  color: 'text-brand-teal-500' },
          { label: 'Stress',    value: metrics.stress,    sub: 'dynamics',                 color: 'text-pink-500' },
          { label: 'Tempo',     value: metrics.tempo,     sub: 'rhythm',                   color: 'text-cyan-500' },
        ] as const).map(m => (
          <div key={m.label} className="bg-white dark:bg-slate-900 border-none rounded-xl p-5 text-center shadow-sm">
            <div className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-2">{m.label}</div>
            <div className={`text-2xl font-bold ${m.color} tabular-nums`}>{isListening || showResults ? m.value : '--'}</div>
            <div className="text-xs text-slate-400 mt-1">{m.sub}</div>
          </div>
        ))}
      </div>

      {/* Canvas heatmap */}
      <div className="bg-white dark:bg-slate-900 border-none rounded-2xl overflow-hidden shadow-sm">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <div className={cn('w-2 h-2 rounded-full', isListening ? 'bg-rose-500 animate-pulse' : 'bg-slate-400')} />
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-300">Spectrum</span>
          </div>
        </div>
        <div className="p-4 bg-slate-50 dark:bg-slate-950/50">
          {!isListening && heatmapHistory.length === 0 ? (
            <div className="h-48 flex flex-col items-center justify-center gap-2 text-slate-400">
              <span className="text-sm">Start recording to see visualization</span>
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
        <div className="flex items-center justify-between bg-[#f5f0ff] dark:bg-[#256B8B]/10 border border-[#256B8B]/20 rounded-xl px-6 py-4">
          <span className="text-sm font-semibold text-[#256B8B] dark:text-[#4E8CA6]">Live Score</span>
          <span className="text-2xl font-bold text-[#256B8B] dark:text-[#4E8CA6]">{metrics.overall}%</span>
        </div>
      )}

      {/* Start / Stop */}
      {!showResults && (
        <button
          onClick={isListening ? handleStop : handleStart}
          disabled={!prompt || isLoadingPrompt}
          className={cn(
            'flex items-center justify-center gap-2 w-full py-4 rounded-xl font-semibold text-base transition-colors mt-2 disabled:opacity-50 disabled:cursor-not-allowed',
            isListening
              ? 'bg-rose-500 hover:bg-rose-600 text-white'
              : 'bg-[#256B8B] hover:bg-[#185A78] text-white'
          )}
        >
          {isListening
            ? <><Square size={18} fill="currentColor" /> Stop Analysis</>
            : <><Mic size={18} /> Start Recording</>}
        </button>
      )}

      {/* Results overlay */}
      {showResults && finalResults && (
        <div className="flex flex-col gap-6 animate-in fade-in duration-300 mt-4">
          <div className="text-center mb-2">
            <h3 className="text-2xl font-bold text-[#0b132b] dark:text-white">Resonance Results</h3>
            <p className="text-slate-500 text-sm mt-1">Session duration: {finalResults.durationSec}s</p>
          </div>

          {/* Overall big score */}
          <div className="bg-white dark:bg-slate-900 border-none rounded-2xl p-8 text-center shadow-sm">
            <div className="text-sm font-medium text-slate-500 mb-2">Overall Score</div>
            <div className="text-5xl font-black text-[#256B8B] dark:text-[#4E8CA6] mb-2">{finalResults.overall}%</div>
            <div className="text-lg font-medium text-slate-700 dark:text-slate-300">Grade {grade(finalResults.overall)}</div>
          </div>

          {/* 4 score rings */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {([
              { label: 'Pitch',     score: finalResults.pitch,     color: 'purple' },
              { label: 'Resonance', score: finalResults.resonance, color: 'blue'   },
              { label: 'Stress',    score: finalResults.stress,    color: 'green'  },
              { label: 'Tempo',     score: finalResults.tempo,     color: 'green'  },
            ] as const).map(r => (
              <ScoreRing key={r.label} label={r.label} score={r.score} color={r.color} />
            ))}
          </div>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-4 pt-4">
            <button
              onClick={handleTryAgain}
              className="flex-1 py-4 rounded-xl font-semibold border-2 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors flex items-center justify-center gap-2"
            >
              <RotateCcw size={16} /> Try Again
            </button>
            <button
              onClick={onExit}
              className="flex-1 py-4 rounded-xl font-semibold bg-[#256B8B] text-white hover:bg-[#185A78] transition-colors"
            >
              Back to Dashboard
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// ATOMS
// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

function WordPill({ word, status }: { word: string; status: WordStatus }) {
  const cfg = {
    clean:  {
      text: 'text-slate-700 dark:text-slate-300',
      bg:   'bg-slate-100 dark:bg-slate-800',
    },
    filter: {
      text: 'text-amber-700 dark:text-amber-400',
      bg:   'bg-amber-100 dark:bg-amber-900/30',
    },
    weak: {
      text: 'text-slate-400 dark:text-slate-500',
      bg:   'bg-transparent',
    },
  }[status];

  return (
    <span className={cn(
      'px-2 py-1 rounded text-base font-medium transition-colors',
      cfg.bg, cfg.text
    )}>
      {word}
    </span>
  );
}

function DarkWordPill({ word, status }: { word: string; status: WordStatus }) {
  const cfg = {
    clean:  {
      text: 'text-[#10b981]',
      bg:   'bg-transparent',
      border: 'border-[#10b981]/50 bg-[#10b981]/10'
    },
    filter: {
      text: 'text-[#f59e0b]',
      bg:   'bg-[#f59e0b]/10',
      border: 'border-[#f59e0b]/50'
    },
    weak: {
      text: 'text-[#eab308]',
      bg:   'bg-[#eab308]/10',
      border: 'border-[#eab308]/50'
    },
  }[status];

  return (
    <span className={cn(
      'px-4 py-2 rounded-full text-sm font-semibold border transition-all',
      cfg.bg, cfg.text, cfg.border
    )}>
      {word}
    </span>
  );
}


function LiveStatCard({ label, value, good, bad }: { label: string; value: number; good?: boolean; bad?: boolean }) {
  const color = bad ? 'text-rose-500' : good ? 'text-emerald-500' : 'text-[#256B8B] dark:text-[#4E8CA6]';
  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl p-5 border-none shadow-sm flex flex-col items-center justify-center">
      <div className={`text-2xl font-bold mb-1 ${color}`}>{value}</div>
      <div className="text-xs font-medium text-slate-500 uppercase tracking-wider">{label}</div>
    </div>
  );
}

function ScoreRing({ label, sublabel, score, color }: { label: string; sublabel?: string; score: number; color: 'purple' | 'blue' | 'green' }) {
  const colorMap = {
    purple: { text: 'text-[#256B8B] dark:text-[#4E8CA6]', ring: '#256B8B' },
    blue:   { text: 'text-[#3b82f6] dark:text-[#60a5fa]', ring: '#3b82f6' }, 
    green:  { text: 'text-[#10b981] dark:text-[#34d399]', ring: '#10b981' },
  }[color];

  const radius = 36;
  const circumference = 2 * Math.PI * radius;
  const strokeDash = (score / 100) * circumference;

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl p-8 flex flex-col items-center gap-2 shadow-sm w-full">
      <div className="relative flex items-center justify-center mb-2">
        <svg width="84" height="84" className="-rotate-90">
          <circle cx="42" cy="42" r={radius} strokeWidth="6" fill="none" stroke="currentColor" className="text-slate-100 dark:text-slate-800" />
          <circle
            cx="42" cy="42" r={radius} strokeWidth="6" fill="none"
            stroke={colorMap.ring}
            strokeDasharray={`${strokeDash} ${circumference}`}
            strokeLinecap="round"
            style={{ transition: 'stroke-dasharray 1s ease' }}
          />
        </svg>
        <div className={`absolute text-3xl font-black ${colorMap.text}`}>
          {score}<span className="text-lg">%</span>
        </div>
      </div>
      <div className={`text-xs font-bold uppercase tracking-widest ${colorMap.text}`}>{label}</div>
      {sublabel && <div className="text-[10px] text-slate-400">{sublabel}</div>}
    </div>
  );
}

function MetricCard({ icon, label, value, target }: { icon: React.ReactNode; label: string; value: number; target: string }) {
  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl p-6 text-center shadow-sm flex flex-col items-center justify-center w-full">
      <div className="flex items-center justify-center gap-1.5 text-slate-400 text-[11px] font-bold uppercase tracking-widest mb-3">
        {icon} {label}
      </div>
      <div className="text-3xl font-black text-[#0b132b] dark:text-white mb-1">{value}</div>
      <div className="text-xs text-slate-400">{target}</div>
    </div>
  );
}