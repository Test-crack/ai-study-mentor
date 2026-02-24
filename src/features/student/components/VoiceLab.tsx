import React, { useState, useEffect } from 'react';
import { 
  Play, Scissors, Mic, Square, Activity, Volume2, 
  Radio, AudioWaveform, AlertTriangle, Target, Lock, Zap,
  CheckCircle2, XCircle, RotateCcw, Home, Layout, Settings, Search, Menu,
  ChevronLeft, BarChart3
} from 'lucide-react';
import { StudentSidebar } from './dashboard/StudentSidebar';
import { StudentTopbar } from './dashboard/StudentTopbar';

// --- MOCK AUTH ---
const useAuth = () => ({ user: { name: "Dev" }, profile: {} });

type ViewState = 'dashboard' | 'anatomy' | 'resonance';
type WordStatus = 'clean' | 'weak' | 'filter';

interface DissectedWord {
  word: string;
  status: WordStatus;
}

const RESONANCE_PHRASES = [
  { text: "The quarterly revenue exceeded all projections", scores: { res: 72, pitch: 70, tempo: 65, stress: 80, over: 72 } },
  { text: "We need to pivot our go-to-market strategy", scores: { res: 82, pitch: 85, tempo: 75, stress: 90, over: 82 } },
  { text: "Our competitive moat lies in execution speed", scores: { res: 88, pitch: 90, tempo: 75, stress: 85, over: 88 } },
  { text: "The Series B funding will close next quarter", scores: { res: 74, pitch: 80, tempo: 70, stress: 75, over: 74 } },
  { text: "Customer acquisition cost dropped by forty percent", scores: { res: 85, pitch: 92, tempo: 75, stress: 80, over: 85 } },
];

export default function VoiceLab() {
  const [activeTab, setActiveTab] = useState<ViewState>("dashboard");
  const [showPremiumModal, setShowPremiumModal] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const { user } = useAuth();

  return (
    <div className="flex h-screen bg-white dark:bg-[#09090b] text-slate-900 dark:text-white font-sans transition-colors duration-300 overflow-hidden">
      
      {/* SIDEBAR */}
      <StudentSidebar 
        activeTab="voice" 
        isCollapsed={isSidebarCollapsed}
        toggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
      />
      
      {/* CONTENT WRAPPER */}
      <div className={`flex-1 flex flex-col min-w-0 transition-all duration-300 ${
        isSidebarCollapsed ? 'lg:ml-28' : 'lg:ml-72'
      }`}>
        <StudentTopbar onUpgradeClick={() => setShowPremiumModal(true)} />
        
        {/* MAIN CONTENT AREA */}
        <main className="flex-1 flex flex-col relative overflow-y-auto p-4 md:p-8 lg:p-12">
          <div className="max-w-6xl mx-auto w-full">
            {activeTab === 'dashboard' && (
              <HomeView onNavigate={(view) => setActiveTab(view)} />
            )}
            
            {activeTab === 'resonance' && (
              <ResonanceView 
                isSidebarCollapsed={isSidebarCollapsed} 
                onExit={() => setActiveTab('dashboard')} 
                onNavigate={(view) => setActiveTab(view)}
              />
            )}
            
            {activeTab === 'anatomy' && (
              <AnatomyView 
                onExit={() => setActiveTab('dashboard')} 
                onNavigate={(view) => setActiveTab(view)}
              />
            )}
          </div>
        </main>
      </div>
    </div>
  );
}

// ==========================================
// VIEWS
// ==========================================

function HomeView({ onNavigate }: { onNavigate: (view: ViewState) => void }) {
  return (
    <div className="max-w-4xl animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-purple-500/30 bg-purple-500/10 text-purple-600 dark:text-purple-300 text-xs font-semibold tracking-wide mb-8">
        <Activity size={14} /> Two Engines. One Lab.
      </div>
      <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight mb-6 leading-tight">
        Your Voice, Under The<br />
        <span className="bg-gradient-to-r from-purple-600 via-purple-500 to-indigo-500 dark:from-purple-400 dark:via-purple-300 dark:to-indigo-300 bg-clip-text text-transparent">Microscope & Waveform</span>
      </h1>
      <p className="text-slate-500 dark:text-[#a1a1aa] text-lg mb-12 max-w-2xl leading-relaxed">
        <strong className="text-slate-900 dark:text-gray-200 font-semibold">Vocal Resonance</strong> trains your pitch, tempo, and stress to match a native speaker. <strong className="text-slate-900 dark:text-gray-200 font-semibold">Speech Anatomy</strong> dissects word confidence and filler gaps.
      </p>
      <div className="flex flex-col sm:flex-row gap-4">
        <button onClick={() => onNavigate('resonance')} className="bg-purple-600 hover:bg-purple-500 text-white px-8 py-4 rounded-xl font-bold transition-all shadow-lg shadow-purple-600/20 flex items-center justify-center gap-2"><Play size={18} fill="currentColor"/> Demo Resonance</button>
        <button onClick={() => onNavigate('anatomy')} className="bg-slate-100 dark:bg-[#121214] border border-slate-200 dark:border-[#27272a] hover:bg-slate-200 dark:hover:bg-[#1c1c1f] px-8 py-4 rounded-xl font-bold transition-all flex items-center justify-center gap-2 text-slate-900 dark:text-white"><Scissors size={18}/> Demo Anatomy</button>
      </div>
    </div>
  );
}

function ResonanceView({ onExit, onNavigate, isSidebarCollapsed }: { onExit: () => void, onNavigate: (view: ViewState) => void, isSidebarCollapsed: boolean }) {
  const [activeIdx, setActiveIdx] = useState(0);
  const [phraseProgress, setPhraseProgress] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const [unlocked, setUnlocked] = useState<number[]>([]);
  const [toast, setToast] = useState<string | null>(null);
  const [isFinalized, setIsFinalized] = useState(false);
  const [metrics, setMetrics] = useState({ res: 0, pitch: 0, tempo: 0, stress: 0, over: 0 });

  useEffect(() => {
    let interval: any;
    if (isPlaying && !isFinalized) {
      interval = setInterval(() => {
        setPhraseProgress(p => {
          if (p >= 100) return 100;
          return p + 1.5;
        });
      }, 50);
    }
    return () => clearInterval(interval);
  }, [isPlaying, isFinalized]);

  useEffect(() => {
    if (phraseProgress >= 100 && !unlocked.includes(activeIdx)) {
      setUnlocked(prev => [...prev, activeIdx]);
      setToast("Power frequency matched! Level unlocked.");
      
      setTimeout(() => {
        setToast(null);
        if (activeIdx < RESONANCE_PHRASES.length - 1) {
          setActiveIdx(i => i + 1);
          setPhraseProgress(0);
        } else {
          setIsFinalized(true);
          setToast("Demo complete! Your Vocal Resonance profile is ready.");
        }
      }, 1500);
    }
  }, [phraseProgress, activeIdx]);

  useEffect(() => {
    const target = RESONANCE_PHRASES[activeIdx].scores;
    const factor = Math.min(phraseProgress / 90, 1);
    setMetrics({
      res: Math.floor(target.res * factor + (Math.random() * 2)),
      pitch: Math.floor(target.pitch * factor + (Math.random() * 2)),
      tempo: Math.floor(target.tempo * factor + (Math.random() * 2)),
      stress: Math.floor(target.stress * factor + (Math.random() * 2)),
      over: Math.floor(target.over * factor + (Math.random() * 2))
    });
  }, [phraseProgress, activeIdx]);

  const totalBarWidth = (activeIdx * 20) + (phraseProgress * 0.2);

  return (
    <div className="flex flex-col gap-6 animate-in fade-in duration-500 relative pb-40">
      
      <div className="flex justify-between items-center mb-2">
        <button 
          onClick={onExit}
          className="flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-purple-600 transition-colors"
        >
          <ChevronLeft size={18} /> Back to Dashboard
        </button>
        <button 
          onClick={() => onNavigate('anatomy')}
          className="flex items-center gap-2 px-4 py-2 bg-slate-100 dark:bg-slate-800 rounded-lg text-xs font-bold uppercase tracking-wider hover:bg-purple-600 hover:text-white transition-all border border-slate-200 dark:border-slate-700 shadow-sm"
        >
          <BarChart3 size={14} /> Anatomy Analytics
        </button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-5 bg-slate-50 dark:bg-[#121214] border border-slate-200 dark:border-[#27272a] rounded-xl p-6 md:divide-x divide-slate-200 dark:divide-[#27272a] shadow-sm">
        <ResonanceStat title="RESONANCE" value={`${metrics.res}%`} color="text-purple-600 dark:text-purple-400" />
        <ResonanceStat title="PITCH" value={`${metrics.pitch}%`} color="text-green-600 dark:text-green-400" />
        <ResonanceStat title="TEMPO" value={`${metrics.tempo}%`} color="text-yellow-600 dark:text-yellow-400" />
        <ResonanceStat title="STRESS" value={`${metrics.stress}%`} color="text-purple-600 dark:text-purple-400" />
        <ResonanceStat title="OVERALL" value={`${metrics.over}%`} color="text-slate-900 dark:text-white" />
      </div>

      {/* Phrase & Control */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex flex-col gap-2">
          <span className="text-[10px] text-purple-600 dark:text-purple-400 font-bold uppercase tracking-widest">Speak This Phrase</span>
          <h2 className="text-2xl md:text-3xl font-bold text-slate-900 dark:text-white tracking-tight transition-all">{RESONANCE_PHRASES[activeIdx].text}</h2>
        </div>
        <button 
          onClick={() => { if(isFinalized) { setActiveIdx(0); setPhraseProgress(0); setUnlocked([]); setIsFinalized(false); } else { setIsPlaying(!isPlaying); } }}
          className={`w-full md:w-auto flex items-center justify-center gap-2 px-6 py-3 rounded-xl text-sm font-bold transition-all shadow-lg ${isFinalized ? 'bg-purple-600 text-white' : isPlaying ? 'bg-red-500/10 text-red-600 dark:text-red-500 border border-red-500/20' : 'bg-green-500/10 text-green-600 dark:text-green-500 border border-green-500/20'}`}
        >
          {isFinalized ? <><RotateCcw size={16}/> Restart</> : isPlaying ? <><Square size={16} fill="currentColor"/> Stop</> : <><Play size={16} fill="currentColor"/> Start</>}
        </button>
      </div>

      {/* Heatmap Area */}
      <div className="bg-slate-50 dark:bg-[#121214] border border-slate-200 dark:border-[#27272a] rounded-2xl p-4 md:p-8">
        <h3 className="text-[11px] font-bold tracking-widest uppercase text-slate-500 dark:text-[#a1a1aa] mb-8">Vocal Frequency Heatmap</h3>
        <div className="h-32 flex items-center gap-[2px] md:gap-[4px] w-full bg-slate-100 dark:bg-[#070708] rounded-xl p-4 md:p-6 border border-slate-200 dark:border-[#1f1f23] relative overflow-hidden">
          {Array.from({ length: 60 }).map((_, i) => {
            const masterH = Math.sin(i * 0.15 + activeIdx) * 35 + 45;
            const active = (i / 60) * 100 < phraseProgress;
            return (
              <div key={i} className="relative flex-1 h-full flex items-center justify-center">
                <div className="absolute w-full rounded-full bg-slate-300 dark:bg-white/5" style={{ height: `${masterH}%` }} />
                {active && <div className={`absolute w-full rounded-full z-10 ${Math.random() > 0.3 ? 'bg-yellow-400 dark:bg-[#fde047] shadow-[0_0_8px_#fde047]' : 'bg-red-500'}`} style={{ height: `${masterH + (Math.random()*4-2)}%` }} />}
              </div>
            );
          })}
          <div className="absolute top-0 bottom-0 w-[2px] bg-red-500 shadow-[0_0_15px_#ef4444] z-20" style={{ left: `${phraseProgress}%` }} />
        </div>
      </div>

      {/* Progress Breakdown */}
      <div className="bg-slate-50 dark:bg-[#121214] border border-slate-200 dark:border-[#27272a] rounded-2xl p-4 md:p-8">
        <h3 className="text-[11px] font-bold tracking-widest uppercase text-slate-500 dark:text-[#a1a1aa] mb-8">Prosody Breakdown</h3>
        <div className="flex flex-col gap-4">
          {RESONANCE_PHRASES.map((p, idx) => (
             <ProsodyItem 
               key={idx} score={p.scores.over} phrase={p.text} 
               stats={`Pitch: ${p.scores.pitch}% • Tempo: ${p.scores.tempo}%`} 
               status={unlocked.includes(idx) ? 'unlocked' : idx === activeIdx ? 'analyzing' : 'locked'}
               isActive={idx === activeIdx}
             />
          ))}
        </div>
      </div>

      {/* FIXED PROGRESS FOOTER */}
      <div className={`fixed bottom-0 right-0 bg-white/90 dark:bg-[#0c0c0e]/90 backdrop-blur-xl border-t border-slate-200 dark:border-[#1f1f23] p-6 md:p-8 z-40 transition-all duration-300 ${
        isSidebarCollapsed ? 'left-0 lg:left-28' : 'left-0 lg:left-72'
      }`}>
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-[#a1a1aa] mb-4 font-bold uppercase tracking-widest">
            <span>Resonance Progress</span>
            <span className="text-slate-500 dark:text-[#a1a1aa]">{Math.floor(activeIdx * 20)}% → <span className="text-slate-900 dark:text-white font-bold">Next at {Math.min((activeIdx + 1) * 20, 100)}%</span></span>
          </div>
          <div className="h-3 w-full bg-slate-200 dark:bg-[#1f1f23] rounded-full overflow-hidden border border-slate-300 dark:border-white/5">
            <div className="h-full bg-gradient-to-r from-purple-600 to-indigo-500 transition-all duration-300 ease-out shadow-[0_0_15px_rgba(147,51,234,0.4)]" style={{ width: `${totalBarWidth}%` }} />
          </div>
        </div>
      </div>

      {toast && (
        <div className="fixed top-24 right-4 md:right-10 bg-white dark:bg-[#121214] border border-slate-200 dark:border-[#27272a] rounded-xl p-4 shadow-2xl animate-in slide-in-from-right-10 flex items-center gap-3 z-[60]">
          <div className="bg-green-500/20 p-2 rounded-full text-green-600 dark:text-green-500"><CheckCircle2 size={18}/></div>
          <span className="text-sm font-bold text-slate-900 dark:text-white">{toast}</span>
        </div>
      )}
    </div>
  );
}

function AnatomyView({ onExit, onNavigate }: { onExit: () => void, onNavigate: (view: ViewState) => void }) {
  const [isRecording, setIsRecording] = useState(false);
  const [timer, setTimer] = useState(0);
  const [words, setWords] = useState<DissectedWord[]>([]);
  const [confidence, setConfidence] = useState(0);
  const [speed, setSpeed] = useState(0);
  const [isDone, setIsDone] = useState(false);

  useEffect(() => {
    let interval: any;
    if (isRecording && timer < ANATOMY_SEQUENCE.length) {
      interval = setInterval(() => {
        setWords(prev => [...prev, ANATOMY_SEQUENCE[timer]]);
        setTimer(t => t + 1);
        setConfidence(Math.floor(Math.random() * (95 - 75) + 75));
        setSpeed(Math.floor(Math.random() * (240 - 100) + 100));
      }, 600);
    } else if (timer >= ANATOMY_SEQUENCE.length && isRecording) {
      setIsRecording(false);
      setIsDone(true);
      setConfidence(83);
      setSpeed(192);
    }
    return () => clearInterval(interval);
  }, [isRecording, timer]);

  return (
    <div className="flex flex-col gap-8 animate-in fade-in duration-500 pb-20">
      
      {/* HEADER NAVIGATION BUTTONS */}
      <div className="flex justify-between items-center mb-2">
        <button 
          onClick={onExit}
          className="flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-purple-600 transition-colors"
        >
          <ChevronLeft size={18} /> Back to Dashboard
        </button>
        <button 
          onClick={() => onNavigate('resonance')}
          className="flex items-center gap-2 px-4 py-2 bg-slate-100 dark:bg-slate-800 rounded-lg text-xs font-bold uppercase tracking-wider hover:bg-purple-600 hover:text-white transition-all border border-slate-200 dark:border-slate-700 shadow-sm"
        >
          <Activity size={14} /> View Resonance Demo
        </button>
      </div>

      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <h2 className="text-2xl md:text-3xl font-bold tracking-tight text-slate-900 dark:text-white">Speech Anatomy Analysis</h2>
        <div className="flex items-center gap-4 w-full md:w-auto">
          <span className="flex-1 md:flex-none text-center text-sm font-mono text-slate-500 dark:text-[#a1a1aa] bg-slate-50 dark:bg-[#121214] px-4 py-2 rounded-lg border border-slate-200 dark:border-[#27272a]">0:{timer.toString().padStart(2, '0')}</span>
          <button onClick={() => { if(isDone){setWords([]); setTimer(0); setIsDone(false);} setIsRecording(!isRecording); }} className={`flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl font-bold transition-all ${isRecording ? 'bg-red-500/10 text-red-600 dark:text-red-500 border border-red-500/20' : 'bg-purple-600 text-white'}`}>
            {isRecording ? <Square size={16} fill="currentColor" /> : <Mic size={16} />}
            {isRecording ? 'Stop Analysis' : 'Start Microphone'}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="CONFIDENCE" value={`${confidence}%`} status={confidence > 80 ? 'clean' : 'weak'} />
        <StatCard title="FILLERS" value={words.filter(w=>w.status==='filter').length.toString()} status={words.filter(w=>w.status==='filter').length > 1 ? 'weak' : 'clean'} />
        <StatCard title="PRONUNCIATION" value={words.filter(w=>w.status==='weak').length.toString()} status={words.filter(w=>w.status==='weak').length > 1 ? 'weak' : 'clean'} />
        <StatCard title="DELIVERY" value={speed.toString()} subtitle="WPM" status={speed > 200 ? 'too fast' : 'optimal'} />
      </div>

      <div className="bg-slate-50 dark:bg-[#121214] border border-slate-200 dark:border-[#27272a] rounded-2xl p-4 md:p-8 min-h-[300px] shadow-sm">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-8 border-b border-slate-200 dark:border-[#27272a] pb-4 gap-4">
          <h3 className="text-sm font-bold uppercase tracking-widest text-slate-500 dark:text-[#a1a1aa]">Real-time Word Surgery</h3>
          <div className="flex flex-wrap items-center gap-4 text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-[#52525b]">
            <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-green-500"></span> Clean</span>
            <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-red-500"></span> Weak</span>
            <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-orange-500"></span> Filter</span>
          </div>
        </div>
        <div className="flex flex-wrap gap-3">
          {words.length === 0 && <p className="text-slate-400 dark:text-[#3f3f46] text-sm italic">Microphone listening for voice patterns...</p>}
          {words.map((w, i) => <WordCard key={i} word={w.word} status={w.status} />)}
        </div>
      </div>
    </div>
  );
}

// ==========================================
// HELPERS & ATOMS
// ==========================================

function StatCard({ title, value, status, subtitle }: any) {
  const isClean = status === 'clean' || status === 'optimal';
  return (
    <div className="bg-white dark:bg-[#121214] rounded-2xl p-6 border border-slate-200 dark:border-[#27272a] shadow-sm transition-colors">
      <div className="flex items-center gap-2 mb-4 text-slate-400 dark:text-[#a1a1aa] uppercase text-[10px] font-bold tracking-widest"><Activity size={12}/> {title}</div>
      <div className="flex items-baseline gap-1 mb-3"><span className="text-4xl font-black text-slate-900 dark:text-white">{value}</span>{subtitle && <span className="text-xs text-slate-400 dark:text-[#52525b]">{subtitle}</span>}</div>
      <div className={`text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5 ${isClean ? 'text-green-600 dark:text-green-500' : 'text-red-600 dark:text-red-500'}`}>
        {isClean ? <CheckCircle2 size={12}/> : <XCircle size={12}/>} {status}
      </div>
    </div>
  );
}

function ResonanceStat({ title, value, color }: any) {
  return (
    <div className="flex flex-col items-center justify-center p-4">
      <span className={`text-2xl md:text-3xl font-black mb-2 ${color}`}>{value}</span>
      <span className="text-[9px] font-bold tracking-widest text-slate-400 dark:text-[#52525b] uppercase">{title}</span>
    </div>
  );
}

function ProsodyItem({ score, phrase, stats, status, isActive = false }: any) {
  return (
    <div className={`flex flex-col md:flex-row items-start md:items-center gap-4 md:gap-6 p-5 rounded-2xl border transition-all duration-300 ${isActive ? 'bg-purple-600/10 border-purple-500/50 scale-[1.01] shadow-lg' : 'bg-white dark:bg-[#09090b] border-slate-200 dark:border-[#1f1f23]'}`}>
      <div className={`w-12 h-12 md:w-14 md:h-14 rounded-full flex items-center justify-center font-black text-lg ${score > 80 ? 'bg-green-500/10 text-green-600 dark:text-green-500 border border-green-500/20' : 'bg-slate-100 dark:bg-[#121214] text-slate-400 dark:text-[#a1a1aa] border border-slate-200 dark:border-[#27272a]'}`}>{score}</div>
      <div className="flex-1">
        <p className={`font-bold text-base md:text-lg mb-1 tracking-tight ${isActive ? 'text-slate-900 dark:text-white' : 'text-slate-500 dark:text-[#a1a1aa]'}`}>"{phrase}"</p>
        <p className="text-[10px] text-slate-400 dark:text-[#52525b] font-bold tracking-widest uppercase">{stats}</p>
      </div>
      <div className="w-full md:w-auto flex justify-end">
        {status === 'unlocked' ? (
          <span className="text-[10px] font-black uppercase tracking-widest text-green-600 dark:text-green-500 bg-green-500/10 px-4 py-2 rounded-full border border-green-500/20">Unlocked</span>
        ) : status === 'analyzing' ? (
          <span className="text-[10px] font-black uppercase tracking-widest text-purple-600 dark:text-purple-400 animate-pulse bg-purple-400/10 px-4 py-2 rounded-full border border-purple-400/20">Analyzing...</span>
        ) : (
          <div className="w-10 h-10 rounded-full flex items-center justify-center border border-slate-200 dark:border-[#27272a] opacity-30"><Lock size={16} className="text-slate-400 dark:text-white" /></div>
        )}
      </div>
    </div>
  );
}

function WordCard({ word, status }: { word: string, status: WordStatus }) {
  const cfg = {
    clean: { text: 'text-green-600 dark:text-green-400', bg: 'bg-green-500/10' },
    weak:  { text: 'text-red-600 dark:text-red-400', bg: 'bg-red-500/10' },
    filter:{ text: 'text-orange-600 dark:text-orange-400', bg: 'bg-orange-500/10' }
  }[status];
  return (
    <div className="flex flex-col border border-slate-200 dark:border-[#27272a] rounded-lg overflow-hidden bg-white dark:bg-[#0c0c0e] min-w-[70px] md:min-w-[80px] shadow-sm transition-colors">
      <div className={`px-4 py-3 text-sm font-bold text-center text-slate-900 dark:text-white`}>{word}</div>
      <div className={`text-[9px] font-black uppercase tracking-widest py-1.5 text-center border-t border-slate-100 dark:border-[#1f1f23] ${cfg.bg} ${cfg.text}`}>{status}</div>
    </div>
  );
}

const ANATOMY_SEQUENCE: DissectedWord[] = [
  { word: "I", status: "clean" }, { word: "recently", status: "clean" }, { word: "worked", status: "clean" },
  { word: "on", status: "clean" }, { word: "um", status: "filter" }, { word: "a", status: "clean" },
  { word: "full-stack", status: "weak" }, { word: "application", status: "weak" }, { word: "using", status: "clean" },
  { word: "React", status: "clean" }, { word: "and", status: "clean" }, { word: "like", status: "filter" },
  { word: "Node.js", status: "weak" }, { word: "for", status: "clean" }, { word: "the", status: "clean" }, { word: "backend", status: "clean" },
];