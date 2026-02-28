import { useState, useEffect } from 'react';
import { 
  Zap, Settings, Play, Pause, ArrowLeft, 
  BrainCircuit, Briefcase, BookOpen, Activity, CheckCircle2,
  Clock, Hash
} from 'lucide-react';

// --- Imports from your architecture ---
import { StudentSidebar } from "./dashboard/StudentSidebar";
import { StudentTopbar } from "./dashboard/StudentTopbar";
import { PremiumModal } from "@/features/payment/components/PremiumModal";

// --- Types & Interfaces ---
type Category = 'tech' | 'business' | 'literature';

interface Report {
  title: string;
  source: string;
  text: string;
}

// --- Mock Data ---
const REPORTS: Record<Category, Report> = {
  tech: {
    title: "AI Infrastructure Investment Trends 2026",
    source: "TECHCRUNCH MARKET REPORT",
    text: "With premium you get to focus on the music. Explore a vast catalog of millions of songs without hearing ads, or download your playlists to listen to them anywhere. You can also play your favorite songs in any order, with the freedom to skip forward and backward as much as you'd like. Your audio, your control. Tap the banner to learn more."
  },
  business: {
    title: "The Future of Remote Executive Leadership",
    source: "HARVARD BUSINESS REVIEW",
    text: "Only a true bestie says yes to all your impulsive decisions. For me, that's Spotify mixes. 4 AM gym? Boom. Hype workout mix is ready. Late night drive? Driving mix is up and about. Jo bhi karne ka mann ho, random ya totally unplanned, yeh hamesha ready hota hai. Meanwhile my college besties? Never mind. For every mood, there's a Spotify mix waiting. Just add 'mix' to your search to get a playlist made for you."
  },
  literature: {
    title: "The Art of Strategic Thinking",
    source: "CLASSIC BUSINESS LITERATURE",
    text: "Strategy is not merely about planning; it is about recognizing patterns in chaos. The most successful leaders do not just react to the world around them; they anticipate the shifts before they occur. By cultivating a deep understanding of human behavior and market dynamics, one can navigate even the most turbulent waters with grace and precision. True foresight is the ultimate competitive advantage."
  }
};

const CATEGORIES: { id: Category; label: string; icon: React.ReactNode }[] = [
  { id: 'tech', label: 'Tech & VC', icon: <BrainCircuit size={16} className="mr-2" /> },
  { id: 'business', label: 'Business Strategy', icon: <Briefcase size={16} className="mr-2" /> },
  { id: 'literature', label: 'Literature', icon: <BookOpen size={16} className="mr-2" /> },
];

export default function SpeedReading() {
  // --- Layout State ---
  const [activeTab, setActiveTab] = useState("speed-reading");
  const [showPremiumModal, setShowPremiumModal] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  // --- Speed Reading State ---
  const [view, setView] = useState<'dashboard' | 'reader'>('dashboard');
  const [activeCategory, setActiveCategory] = useState<Category>('tech');
  const [showSettings, setShowSettings] = useState(false);
  const [wpm, setWpm] = useState(400);

  // --- Reader State ---
  const [words, setWords] = useState<string[]>([]);
  const [currentWordIndex, setCurrentWordIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isFinished, setIsFinished] = useState(false);

  // Initialize text when starting
  const handleStartReading = () => {
    const rawText = REPORTS[activeCategory].text;
    const wordArray = rawText.trim().split(/\s+/);
    setWords(wordArray);
    setCurrentWordIndex(0);
    setIsFinished(false);
    setView('reader');
    // Small delay before auto-playing
    setTimeout(() => {
      setIsPlaying(true);
    }, 500);
  };

  // RSVP Interval Logic
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isPlaying && !isFinished) {
      const msPerWord = 60000 / wpm;
      interval = setInterval(() => {
        setCurrentWordIndex((prev) => {
          if (prev >= words.length - 1) {
            setIsPlaying(false);
            setIsFinished(true);
            return prev;
          }
          return prev + 1;
        });
      }, msPerWord);
    }
    return () => clearInterval(interval);
  }, [isPlaying, wpm, words.length, isFinished]);

  // Optimal Recognition Point (ORP) Helper
  const renderWord = (word: string) => {
    if (!word) return null;
    
    const pivot = Math.max(0, Math.ceil(word.length * 0.35) - 1);
    
    const start = word.substring(0, pivot);
    const mid = word.substring(pivot, pivot + 1);
    const end = word.substring(pivot + 1);

    return (
      <div className="flex items-center text-4xl md:text-6xl font-medium tracking-wide">
        <span className="text-slate-400 dark:text-gray-300 text-right w-[150px] md:w-[250px] transition-colors">{start}</span>
        <span className="text-red-500 w-[20px] md:w-[30px] text-center">{mid}</span>
        <span className="text-slate-400 dark:text-gray-300 text-left w-[150px] md:w-[250px] transition-colors">{end}</span>
      </div>
    );
  };

  const progressPercentage = words.length > 0 
    ? ((currentWordIndex + (isFinished ? 1 : 0)) / words.length) * 100 
    : 0;

  return (
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-slate-950 transition-colors duration-300">
      
      {/* Sidebar */}
      <StudentSidebar 
        activeTab='speed' 
        onTabChange={setActiveTab} 
        isCollapsed={isSidebarCollapsed}
        toggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
      />

      {/* Main Content Wrapper */}
      <div className={`min-h-screen flex flex-col transition-all duration-300 ${isSidebarCollapsed ? 'lg:pl-20' : 'lg:pl-64'}`}>
        
        {/* Topbar */}
        <StudentTopbar onUpgradeClick={() => setShowPremiumModal(true)} />

        <main className="flex-1 p-4 sm:p-6 lg:p-8 flex justify-center items-start">
          <div className="w-full max-w-5xl">
            
            {/* --- DASHBOARD VIEW --- */}
            {view === 'dashboard' && (
              <div className="w-full mt-4 bg-white dark:bg-[#121118] text-slate-900 dark:text-white border border-slate-200 dark:border-gray-800 rounded-2xl p-8 relative overflow-hidden shadow-sm dark:shadow-xl transition-colors duration-300">
                <Zap className="absolute -top-10 -right-10 text-purple-500/10 dark:text-purple-900/20" size={240} strokeWidth={1} />
                
                <div className="relative z-10">
                  <div className="inline-flex items-center space-x-2 bg-purple-50 dark:bg-purple-500/10 text-purple-600 dark:text-purple-400 px-3 py-1 rounded-full text-xs font-semibold mb-6 transition-colors">
                    <Zap size={14} />
                    <span>RSVP • Contextual Priming</span>
                  </div>

                  <h1 className="text-3xl md:text-5xl font-bold mb-4 leading-tight">
                    Read a Full Report in<br />
                    <span className="text-purple-600 dark:text-purple-400">15 Minutes</span> with 90% Retention
                  </h1>
                  
                  <p className="text-slate-600 dark:text-gray-400 max-w-2xl mb-8 text-sm md:text-base leading-relaxed transition-colors">
                    Rapid Serial Visual Presentation flashes words at <strong className="text-slate-900 dark:text-gray-200">200-800 WPM</strong> calibrated to your comprehension. Content is curated from real-time market reports matched to your interests.
                  </p>

                  {/* Categories */}
                  <div className="flex flex-wrap gap-2 mb-6">
                    {CATEGORIES.map((cat) => (
                      <button
                        key={cat.id}
                        onClick={() => setActiveCategory(cat.id)}
                        className={`flex items-center px-4 py-2 rounded-md text-sm transition-all ${
                          activeCategory === cat.id 
                            ? 'bg-purple-600 text-white shadow-md' 
                            : 'bg-transparent text-slate-500 dark:text-gray-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-gray-800'
                        }`}
                      >
                        {cat.icon}
                        {cat.label}
                      </button>
                    ))}
                  </div>

                  {/* Active Report Card */}
                  <div className="bg-slate-50 dark:bg-[#1C1A24] border border-slate-200 dark:border-gray-700/50 rounded-xl p-5 mb-8 w-full max-w-md transition-colors duration-300">
                    <p className="text-xs text-purple-600 dark:text-purple-400 font-semibold mb-1 tracking-wider uppercase">
                      {REPORTS[activeCategory].source}
                    </p>
                    <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2 transition-colors">
                      {REPORTS[activeCategory].title}
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-gray-500 transition-colors">
                      {REPORTS[activeCategory].text.split(' ').length} words • ~{Math.ceil(REPORTS[activeCategory].text.split(' ').length / wpm)} min at {wpm} WPM
                    </p>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
                    <button 
                      onClick={handleStartReading}
                      className="flex items-center justify-center space-x-2 bg-purple-600 hover:bg-purple-700 dark:hover:bg-purple-500 text-white px-6 py-3 rounded-lg font-medium transition-colors w-full sm:w-auto shadow-md"
                    >
                      <Play size={18} fill="currentColor" />
                      <span>Start Speed Reading</span>
                    </button>
                    
                    <button 
                      onClick={() => setShowSettings(!showSettings)}
                      className="flex items-center justify-center space-x-2 bg-white dark:bg-[#1C1A24] hover:bg-slate-50 dark:hover:bg-gray-700 border border-slate-200 dark:border-gray-700 text-slate-700 dark:text-white px-6 py-3 rounded-lg font-medium transition-colors w-full sm:w-auto shadow-sm"
                    >
                      <Settings size={18} />
                      <span>Settings</span>
                    </button>
                  </div>

                  {/* Collapsible Settings Dropdown */}
                  {showSettings && (
                    <div className="mt-4 p-5 bg-white dark:bg-[#1C1A24] border border-slate-200 dark:border-gray-700 rounded-xl max-w-md animate-in slide-in-from-top-2 fade-in transition-colors duration-300 shadow-lg">
                      <div className="flex justify-between items-center mb-4">
                        <span className="text-sm font-medium text-slate-700 dark:text-gray-300">Base Speed (WPM)</span>
                        <span className="text-purple-600 dark:text-purple-400 font-bold">{wpm} WPM</span>
                      </div>
                      <input 
                        type="range" 
                        min="200" max="800" step="25"
                        value={wpm}
                        onChange={(e) => setWpm(Number(e.target.value))}
                        className="w-full h-2 bg-slate-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer accent-purple-600 dark:accent-purple-500"
                      />
                      <div className="flex justify-between text-xs text-slate-500 dark:text-gray-500 mt-2">
                        <span>200 (Relaxed)</span>
                        <span>500 (Standard)</span>
                        <span>800 (Elite)</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* --- READER VIEW --- */}
            {view === 'reader' && (
              <div className="w-full flex flex-col h-[75vh] min-h-[600px] justify-between text-slate-900 dark:text-white transition-colors duration-300">
                
                {/* Header */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white dark:bg-[#121118] border border-slate-200 dark:border-gray-800 p-4 rounded-xl shadow-sm dark:shadow-md transition-colors duration-300">
                  <div>
                    <h2 className="text-lg font-bold text-slate-900 dark:text-white">{REPORTS[activeCategory].title}</h2>
                    <p className="text-xs text-slate-500 dark:text-gray-400">{REPORTS[activeCategory].source}</p>
                  </div>

                  <div className="flex items-center space-x-6 w-full md:w-auto">
                    {/* Speed Slider in Header */}
                    <div className="flex items-center space-x-3 flex-1 md:flex-none">
                      <span className="text-xs text-slate-500 dark:text-gray-400 font-semibold tracking-wider">SPEED</span>
                      <input 
                        type="range" 
                        min="200" max="800" step="25"
                        value={wpm}
                        onChange={(e) => setWpm(Number(e.target.value))}
                        className="w-32 h-1 bg-slate-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer accent-purple-600 dark:accent-purple-500"
                      />
                      <span className="text-xs text-slate-900 dark:text-white font-medium w-16 text-right transition-colors">{wpm} WPM</span>
                    </div>

                    <div className="flex space-x-2">
                      <button 
                        onClick={() => { setIsPlaying(false); setView('dashboard'); }}
                        className="flex items-center space-x-1 px-3 py-1.5 rounded bg-slate-100 hover:bg-slate-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-slate-700 dark:text-white text-sm transition-colors"
                      >
                        <ArrowLeft size={16} />
                        <span>Back</span>
                      </button>
                      <button 
                        onClick={() => setIsPlaying(!isPlaying)}
                        className={`flex items-center space-x-1 px-4 py-1.5 rounded text-sm transition-colors shadow-sm ${isPlaying ? 'bg-slate-100 hover:bg-slate-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-slate-700 dark:text-white' : 'bg-purple-600 hover:bg-purple-700 dark:hover:bg-purple-500 text-white'}`}
                      >
                        {isPlaying ? <Pause size={16} fill="currentColor" /> : <Play size={16} fill="currentColor" />}
                        <span>{isPlaying ? 'Pause' : 'Resume'}</span>
                      </button>
                    </div>
                  </div>
                </div>

                {/* RSVP Display Area */}
                <div className="flex-1 my-6 bg-white dark:bg-[#0B0A0F] border border-slate-200 dark:border-gray-800 rounded-2xl flex flex-col items-center justify-center relative overflow-hidden shadow-inner transition-colors duration-300">
                  {/* Focus lines */}
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[2px] h-12 bg-slate-300 dark:bg-gray-800/50 -mt-6"></div>
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[2px] h-12 bg-slate-300 dark:bg-gray-800/50 mt-6"></div>

                  {isFinished ? (
                    <div className="text-center animate-in zoom-in-95 duration-500">
                      <div className="text-6xl md:text-8xl font-bold text-slate-900 dark:text-white mb-4 transition-colors">83%</div>
                      <div className="text-xl text-purple-600 dark:text-purple-400 font-medium mb-2">Estimated Retention</div>
                      <p className="text-slate-500 dark:text-gray-500">{words.length} words read at {wpm} WPM</p>
                    </div>
                  ) : (
                    renderWord(words[currentWordIndex])
                  )}
                </div>

                {/* Footer Stats & Progress */}
                <div className="space-y-4">
                  {/* Progress Bar */}
                  <div className="flex items-center space-x-4">
                    <span className="text-xs text-slate-500 dark:text-gray-500 w-16">Progress</span>
                    <div className="flex-1 h-2 bg-slate-200 dark:bg-gray-800 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-purple-600 transition-all duration-150 ease-linear"
                        style={{ width: `${progressPercentage}%` }}
                      />
                    </div>
                    <span className="text-xs text-slate-500 dark:text-gray-500 w-24 text-right">
                      {currentWordIndex + (isFinished ? 1 : 0)} / {words.length} words
                    </span>
                  </div>

                  {/* Metrics Grid */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="bg-white dark:bg-[#121118] border border-slate-200 dark:border-gray-800 p-4 rounded-xl flex flex-col items-center text-center shadow-sm dark:shadow-md transition-colors duration-300">
                      <Activity size={20} className="text-purple-500 mb-2" />
                      <span className="text-2xl font-bold text-slate-900 dark:text-white mb-1 transition-colors">{wpm}</span>
                      <span className="text-xs text-slate-500 dark:text-gray-500 uppercase tracking-wider">Current WPM</span>
                    </div>
                    
                    <div className="bg-white dark:bg-[#121118] border border-slate-200 dark:border-gray-800 p-4 rounded-xl flex flex-col items-center text-center shadow-sm dark:shadow-md transition-colors duration-300">
                      <Hash size={20} className="text-green-500 mb-2" />
                      <span className="text-2xl font-bold text-slate-900 dark:text-white mb-1 transition-colors">{currentWordIndex + (isFinished ? 1 : 0)}</span>
                      <span className="text-xs text-slate-500 dark:text-gray-500 uppercase tracking-wider">Words Read</span>
                    </div>

                    <div className="bg-white dark:bg-[#121118] border border-slate-200 dark:border-gray-800 p-4 rounded-xl flex flex-col items-center text-center shadow-sm dark:shadow-md transition-colors duration-300">
                      {CATEGORIES.find(c => c.id === activeCategory)?.icon || <BrainCircuit size={20} className="text-orange-500 mb-2" />}
                      <span className="text-lg font-bold text-slate-900 dark:text-white mb-1 truncate w-full transition-colors">{CATEGORIES.find(c => c.id === activeCategory)?.label}</span>
                      <span className="text-xs text-slate-500 dark:text-gray-500 uppercase tracking-wider">Interest</span>
                    </div>

                    <div className="bg-white dark:bg-[#121118] border border-slate-200 dark:border-gray-800 p-4 rounded-xl flex flex-col items-center text-center shadow-sm dark:shadow-md transition-colors duration-300">
                      {isFinished ? (
                        <CheckCircle2 size={20} className="text-blue-500 mb-2" />
                      ) : (
                        <Clock size={20} className="text-blue-500 mb-2" />
                      )}
                      <span className="text-lg font-bold text-slate-900 dark:text-white mb-1 transition-colors">
                        {isFinished ? '83%' : 'In progress'}
                      </span>
                      <span className="text-xs text-slate-500 dark:text-gray-500 uppercase tracking-wider">Retention</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
            
          </div>
        </main>
      </div>

      {/* Global Modals */}
      <PremiumModal
        isOpen={showPremiumModal}
        onClose={() => setShowPremiumModal(false)}
      />
    </div>
  );
}