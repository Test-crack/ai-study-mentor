import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useMomentum } from "@/features/student/Context/MomentumContext";
import {
  ArrowLeft, Sparkles, Lightbulb, CheckCircle2, Zap, Info,
  ShieldAlert, Award, ArrowRight, Lock,
} from 'lucide-react';

// ─── Word Bank ────────────────────────────────────────────────────────────────
const WORD_BANK = [
  { base: "IMPORTANT",  target: "CRUCIAL",     hint: "Decisive or critical, especially in the success or failure of something." },
  { base: "VERY HAPPY", target: "ECSTATIC",    hint: "Feeling or expressing overwhelming happiness or joyful excitement." },
  { base: "POOR",       target: "DESTITUTE",   hint: "Without the basic necessities of life." },
  { base: "LAZY",       target: "LETHARGIC",   hint: "Affected by lethargy; sluggish and apathetic." },
  { base: "BRAVE",      target: "INTREPID",    hint: "Fearless; adventurous (often used for rhetorical or humorous effect)." },
  { base: "CAREFUL",    target: "METICULOUS",  hint: "Showing great attention to detail; very careful and precise." },
  { base: "BAD",        target: "DETRIMENTAL", hint: "Tending to cause harm." },
  { base: "MANY",       target: "MYRIAD",      hint: "A countless or extremely great number." },
];

const INTRO_WORDS = [
  "CRUCIAL", "ECSTATIC", "DESTITUTE", "LETHARGIC", "INTREPID",
  "METICULOUS", "DETRIMENTAL", "MYRIAD", "ELOQUENT", "PROFOUND",
  "RESILIENT", "COGNITIVE", "ACHIEVE", "VOCABULARY", "ACCOMPLISH",
  "EVALUATE", "COMPREHENSIVE", "SYNONYM", "MOMENTUM", "EXCELLENCE",
];

const DAILY_LIMIT    = 5;
const MAX_TRIES      = 3;
const POINTS_PER_WORD = 15;

const KEYBOARD_ROWS = [
  ['Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P'],
  ['A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L'],
  ['ENTER', 'Z', 'X', 'C', 'V', 'B', 'N', 'M', '⌫'],
];

// ─── Component ────────────────────────────────────────────────────────────────
export default function LexiGrid() {
  const navigate                  = useNavigate();
  const [searchParams]            = useSearchParams();
  const { totalMomentum, addPoints } = useMomentum();

  // ── Drill gate context ─────────────────────────────────────────────────────
  // When LexiGrid is opened as the gate between Drill 1 and Drill 2:
  //   URL: /student/lexigrid?from=drill&skill=Speaking&sub_skill=Pronunciation
  // Completing all 5 words clears the gate and routes back to Drill 2.
  // When opened standalone the CTA just returns to dashboard.
  const fromDrill = searchParams.get('from') === 'drill';
  const drillSkill    = searchParams.get('skill')    || 'Speaking';
  const drillSubSkill = searchParams.get('sub_skill') || 'Pronunciation';

  // ── Core game state ────────────────────────────────────────────────────────
  const [dailyWords,    setDailyWords]    = useState<typeof WORD_BANK>([]);
  const [currentIndex,  setCurrentIndex]  = useState(0);
  const [currentGuess,  setCurrentGuess]  = useState("");
  const [triesLeft,     setTriesLeft]     = useState(MAX_TRIES);
  const [wordsWon,      setWordsWon]      = useState(0);
  const [gameStatus,    setGameStatus]    = useState<'playing' | 'won' | 'lost' | 'completed_day'>('playing');
  const [isInitializing, setIsInitializing] = useState(true);

  // ── UI state ───────────────────────────────────────────────────────────────
  const [introStage,    setIntroStage]    = useState<'playing' | 'fading' | 'done'>('playing');
  const [isErrorShake,  setIsErrorShake]  = useState(false);
  const [showHint,      setShowHint]      = useState(false);
  const [flyingScore,   setFlyingScore]   = useState(false);
  const [localMomentum, setLocalMomentum] = useState(totalMomentum);

  // Sync local momentum display with context
  useEffect(() => { setLocalMomentum(totalMomentum); }, [totalMomentum]);

  // ── Intro animation ────────────────────────────────────────────────────────
  useEffect(() => {
    const t1 = setTimeout(() => setIntroStage('fading'), 2800);
    const t2 = setTimeout(() => setIntroStage('done'),   3300);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, []);

  const introWordConfigs = useMemo(() => INTRO_WORDS.map((word, i) => {
    const angle  = (i / INTRO_WORDS.length) * Math.PI * 2;
    const dist   = 400 + Math.random() * 500;
    return {
      word,
      startX: Math.cos(angle) * dist,
      startY: Math.sin(angle) * dist,
      delay:  Math.random() * 0.8,
    };
  }), []);

  // ── Persistence & init ─────────────────────────────────────────────────────
  useEffect(() => {
    const today     = new Date().toISOString().split('T')[0];
    const savedData = localStorage.getItem('lexigrid_state');
    let loaded      = false;

    if (savedData) {
      try {
        const parsed = JSON.parse(savedData);
        if (parsed.date === today && Array.isArray(parsed.words) && parsed.words.length > 0) {
          setDailyWords(parsed.words);
          setCurrentIndex(parsed.currentIndex || 0);
          setTriesLeft(parsed.triesLeft ?? MAX_TRIES);
          setCurrentGuess(parsed.currentGuess || "");
          setWordsWon(parsed.wordsWon || 0);
          if (parsed.currentIndex >= DAILY_LIMIT) setGameStatus('completed_day');
          loaded = true;
        }
      } catch {
        localStorage.removeItem('lexigrid_state');
      }
    }

    if (!loaded) {
      const shuffled = [...WORD_BANK].sort(() => 0.5 - Math.random()).slice(0, DAILY_LIMIT);
      setDailyWords(shuffled);
      setCurrentIndex(0);
      setTriesLeft(MAX_TRIES);
      setCurrentGuess("");
      setWordsWon(0);
      localStorage.setItem('lexigrid_state', JSON.stringify({
        date: today, words: shuffled, currentIndex: 0,
        triesLeft: MAX_TRIES, currentGuess: "", wordsWon: 0,
      }));
    }

    setIsInitializing(false);
  }, []);

  const saveState = (index: number, tries: number, guess: string, score: number) => {
    localStorage.setItem('lexigrid_state', JSON.stringify({
      date: new Date().toISOString().split('T')[0],
      words: dailyWords,
      currentIndex: index,
      triesLeft:    tries,
      currentGuess: guess,
      wordsWon:     score,
    }));
  };

  // ── Gate cleared write ─────────────────────────────────────────────────────
  // Called exactly once when the completed_day screen is reached.
  // Writes lexigrid_gate_cleared so the dashboard knows the gate was passed
  // even if the student doesn't immediately start Drill 2.
  const writeGateCleared = useCallback(() => {
    const todayDate = new Date().toISOString().split('T')[0];
    localStorage.setItem('lexigrid_gate_cleared', JSON.stringify({
      date:    todayDate,
      cleared: true,
    }));
    // No need to write drill2_accessed here —
    // DrillScreen writes it when it mounts with drillNumber=2.
    window.dispatchEvent(new Event('storage'));
  }, []);

  // ── Keyboard logic ─────────────────────────────────────────────────────────
  const handleKeyPress = useCallback((key: string) => {
    if (gameStatus !== 'playing' || isInitializing || isErrorShake || introStage !== 'done') return;

    const targetWord = dailyWords[currentIndex]?.target || "";
    const wordLength = targetWord.length;

    if (key === 'ENTER') {
      if (currentGuess.length !== wordLength) {
        setIsErrorShake(true);
        setTimeout(() => setIsErrorShake(false), 400);
        return;
      }

      if (currentGuess === targetWord) {
        const newScore = wordsWon + 1;
        setWordsWon(newScore);
        setGameStatus('won');
        saveState(currentIndex, triesLeft, currentGuess, newScore);
        triggerWinAnimation();
      } else {
        const newTries = triesLeft - 1;
        setTriesLeft(newTries);
        setIsErrorShake(true);
        saveState(currentIndex, newTries, currentGuess, wordsWon);
        setTimeout(() => {
          setIsErrorShake(false);
          if (newTries <= 0) setGameStatus('lost');
          else setCurrentGuess("");
        }, 600);
      }
    } else if (key === '⌫' || key === 'BACKSPACE') {
      const ng = currentGuess.slice(0, -1);
      setCurrentGuess(ng);
      saveState(currentIndex, triesLeft, ng, wordsWon);
    } else if (currentGuess.length < wordLength && /^[A-Z]$/.test(key)) {
      const ng = currentGuess + key;
      setCurrentGuess(ng);
      saveState(currentIndex, triesLeft, ng, wordsWon);
    }
  }, [currentGuess, gameStatus, triesLeft, currentIndex, dailyWords, wordsWon, isInitializing, isErrorShake, introStage]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Enter')     handleKeyPress('ENTER');
      else if (e.key === 'Backspace') handleKeyPress('⌫');
      else {
        const k = e.key.toUpperCase();
        if (/^[A-Z]$/.test(k)) handleKeyPress(k);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [handleKeyPress]);

  // ── Win animation ──────────────────────────────────────────────────────────
  const triggerWinAnimation = () => {
    setFlyingScore(true);
    setTimeout(() => {
      setLocalMomentum(prev => prev + POINTS_PER_WORD);
      addPoints(POINTS_PER_WORD);
    }, 800);
    setTimeout(() => setFlyingScore(false), 1500);
  };

  // ── Next word / day complete ───────────────────────────────────────────────
  const handleNextWord = () => {
    const nextIndex = currentIndex + 1;
    if (nextIndex >= DAILY_LIMIT) {
      setGameStatus('completed_day');
      writeGateCleared();       // ← gate cleared here
    } else {
      setCurrentIndex(nextIndex);
      setTriesLeft(MAX_TRIES);
      setCurrentGuess("");
      setGameStatus('playing');
      setShowHint(false);
    }
    saveState(nextIndex, MAX_TRIES, "", wordsWon);
  };

  // ── Navigate to Drill 2 (gate cleared action) ──────────────────────────────
  const handleStartDrill2 = () => {
    navigate(
      `/student/drill?skill=${encodeURIComponent(drillSkill)}&sub_skill=${encodeURIComponent(drillSubSkill)}&drillNumber=2`
    );
  };

  // ─────────────────────────────────────────────────────────────────────────
  if (isInitializing) {
    return (
      <div className="min-h-screen bg-[#07070a] flex items-center justify-center text-white">
        <div className="flex flex-col items-center animate-pulse">
          <Sparkles className="w-10 h-10 text-indigo-500 mb-4" />
          <p className="text-slate-400 font-bold tracking-widest uppercase">Loading Challenge...</p>
        </div>
      </div>
    );
  }

  const currentWordObj = dailyWords[currentIndex];
  const targetWord     = currentWordObj?.target || "";
  const wordLength     = targetWord.length;

  // Words completed this session (win or lose counts — completing the round = gate progress)
  const wordsCompleted = currentIndex + (gameStatus === 'completed_day' ? 0 : (gameStatus === 'won' || gameStatus === 'lost' ? 0 : 0));
  // More accurately: currentIndex tracks how many rounds we've advanced past
  const roundsCompleted = gameStatus === 'completed_day' ? DAILY_LIMIT : currentIndex;

  return (
    <div className="min-h-screen bg-[#07070a] bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-indigo-950/20 via-[#07070a] to-[#07070a] font-sans text-white flex flex-col selection:bg-indigo-500/30 overflow-x-hidden relative">

      {/* ── Cinematic Intro Overlay ── */}
      {introStage !== 'done' && (
        <div className={`fixed inset-0 z-[100] bg-[#07070a] flex items-center justify-center overflow-hidden transition-opacity duration-500 ${introStage === 'fading' ? 'opacity-0' : 'opacity-100'}`}>
          <div className="absolute inset-0 pointer-events-none">
            {introWordConfigs.map((cfg, i) => (
              <div
                key={i}
                className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-indigo-400/20 font-black text-xl md:text-3xl uppercase whitespace-nowrap mix-blend-screen"
                style={{
                  animation: `flyToCenter 1.4s cubic-bezier(0.2,0,0.8,1) ${cfg.delay}s forwards`,
                  '--startX': `${cfg.startX}px`,
                  '--startY': `${cfg.startY}px`,
                  transform: `translate(${cfg.startX}px, ${cfg.startY}px) scale(0)`,
                  opacity: 0,
                } as React.CSSProperties}
              >
                {cfg.word}
              </div>
            ))}
          </div>
          <h1 className="relative z-10 text-5xl md:text-7xl font-black text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-400 tracking-[0.2em] uppercase drop-shadow-[0_0_40px_rgba(129,140,248,0.6)] animate-[logoPop_1s_ease-out_1s_both]">
            LexiGrid
          </h1>
        </div>
      )}

      {/* ── Topbar ── */}
      <header className="flex items-center justify-between p-4 sm:p-6 max-w-7xl mx-auto w-full relative z-20">
        <button onClick={() => navigate('/student/dashboard')} className="p-2.5 -ml-2 rounded-full hover:bg-white/10 transition-colors">
          <ArrowLeft className="w-5 h-5 text-slate-300" />
        </button>

        <div className="flex items-center gap-4">
          {/* Gate progress pill — only shown when LexiGrid was opened as a drill gate */}
          {fromDrill && gameStatus !== 'completed_day' && (
            <div className="flex items-center gap-2 bg-teal-500/10 border border-teal-500/25 px-3 py-1.5 rounded-full">
              <Lock className="w-3 h-3 text-teal-400" />
              <span className="text-[11px] font-bold text-teal-300 uppercase tracking-wider">
                {roundsCompleted} / {DAILY_LIMIT} to unlock Drill 2
              </span>
            </div>
          )}

          <div className="flex items-center gap-2 bg-indigo-500/10 border border-indigo-500/20 px-4 py-2 rounded-full shadow-lg shadow-indigo-500/5">
            <Zap className="w-4 h-4 text-amber-400 fill-amber-400" />
            <span className="font-black text-indigo-50 text-lg">{localMomentum}</span>
          </div>
        </div>
      </header>

      {/* ── Flying Score Animation ── */}
      {flyingScore && (
        <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 animate-[flyToTopRight_0.8s_ease-in-out_forwards]">
          <div className="text-4xl font-black text-amber-400 drop-shadow-[0_0_20px_rgba(251,191,36,0.8)]">
            +{POINTS_PER_WORD}
          </div>
        </div>
      )}

      <main className="flex-1 flex flex-col xl:flex-row items-center xl:items-start justify-center max-w-7xl mx-auto w-full px-4 sm:px-6 gap-8 xl:gap-16 pb-12">

        {/* ── Left Column: Game Area ── */}
        <div className="flex-1 flex flex-col items-center w-full max-w-3xl relative z-10">

          {/* ════════════════════════════════════════════
              COMPLETED DAY SCREEN
          ════════════════════════════════════════════ */}
          {gameStatus === 'completed_day' ? (
            <div className="w-full max-w-lg bg-slate-900/60 backdrop-blur-xl border border-white/10 rounded-[32px] p-8 sm:p-10 flex flex-col items-center text-center shadow-2xl animate-in zoom-in-95 duration-500 mt-10">

              {/* Icon */}
              <div className="w-20 h-20 bg-amber-500/20 rounded-full flex items-center justify-center mb-6 ring-8 ring-amber-500/10">
                <Award className="w-10 h-10 text-amber-400" />
              </div>

              <h2 className="text-3xl font-black mb-2 text-white">
                {fromDrill ? 'Gate Cleared!' : 'Daily Challenge Complete'}
              </h2>
              <p className="text-slate-400 mb-10 font-medium">
                {fromDrill
                  ? 'All 5 words done. Drill 2 is now unlocked and ready.'
                  : 'Here is your vocabulary wrap-up for today.'}
              </p>

              {/* Score row */}
              <div className="w-full bg-slate-950/50 rounded-2xl p-6 border border-white/5 mb-6 flex justify-around">
                <div>
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">Score</p>
                  <p className="text-4xl font-black text-white">
                    {wordsWon} <span className="text-xl text-slate-600">/ {DAILY_LIMIT}</span>
                  </p>
                </div>
                <div className="w-px bg-white/10" />
                <div>
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">Momentum</p>
                  <p className="text-4xl font-black text-amber-400">+{wordsWon * POINTS_PER_WORD}</p>
                </div>
              </div>

              {/* Gate status when from drill */}
              {fromDrill && (
                <div className="w-full bg-teal-500/10 border border-teal-500/20 rounded-2xl p-4 mb-6 flex items-center gap-3">
                  <CheckCircle2 className="w-5 h-5 text-teal-400 shrink-0" />
                  <p className="text-sm text-teal-300 font-medium text-left">
                    LexiGrid gate cleared — full platform unlocks when you access Drill 2.
                  </p>
                </div>
              )}

              {/* CTA — different based on context */}
              {fromDrill ? (
                <button
                  onClick={handleStartDrill2}
                  className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-lg py-4 rounded-2xl transition-all shadow-lg hover:shadow-indigo-500/25 active:scale-[0.98]"
                >
                  Start Drill 2 <ArrowRight className="w-5 h-5" />
                </button>
              ) : (
                <button
                  onClick={() => navigate('/student/dashboard')}
                  className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-lg py-4 rounded-2xl transition-all shadow-lg hover:shadow-indigo-500/25 active:scale-[0.98]"
                >
                  Return to Dashboard
                </button>
              )}

              {/* Back to dashboard always available when from drill */}
              {fromDrill && (
                <button
                  onClick={() => navigate('/student/dashboard')}
                  className="mt-3 text-sm text-slate-500 hover:text-slate-300 transition-colors font-medium"
                >
                  Or return to dashboard
                </button>
              )}
            </div>

          ) : (
            // ════════════════════════════════════════════
            // ACTIVE GAME UI
            // ════════════════════════════════════════════
            <>
              {/* Gate progress bar — shown when from=drill and game is active */}
              {fromDrill && (
                <div className="w-full max-w-lg mx-auto mb-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-bold text-teal-400 uppercase tracking-wider">
                      Drill 2 Gate Progress
                    </span>
                    <span className="text-[10px] font-bold text-teal-400">
                      {roundsCompleted} / {DAILY_LIMIT} words
                    </span>
                  </div>
                  <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-teal-500 rounded-full transition-all duration-500"
                      style={{ width: `${(roundsCompleted / DAILY_LIMIT) * 100}%` }}
                    />
                  </div>
                </div>
              )}

              {/* Context / Status */}
              <div className="text-center w-full mt-2 xl:mt-6">
                <div className="flex items-center justify-between mb-8 px-2 max-w-lg mx-auto">
                  <span className="text-[10px] sm:text-xs font-bold uppercase tracking-widest text-slate-400 bg-slate-800/50 px-3 py-1.5 rounded-full border border-white/5">
                    Word {currentIndex + 1} of {DAILY_LIMIT}
                  </span>
                  <div className="flex items-center gap-2 bg-slate-800/50 px-3 py-1.5 rounded-full border border-white/5">
                    <span className="text-[10px] sm:text-xs font-bold text-slate-400 uppercase tracking-wider">
                      {Math.max(0, triesLeft)} attempts left
                    </span>
                    <div className="flex gap-1.5 ml-1">
                      {Array.from({ length: MAX_TRIES }).map((_, i) => (
                        <div
                          key={i}
                          className={`w-2 h-2 rounded-full transition-colors duration-300 ${i < triesLeft ? 'bg-indigo-400 shadow-[0_0_8px_rgba(129,140,248,0.5)]' : 'bg-slate-700'}`}
                        />
                      ))}
                    </div>
                  </div>
                </div>

                <p className="text-slate-400 font-medium mb-2 text-sm sm:text-base">
                  Find the Band 8.0 synonym for:
                </p>
                <p className="text-3xl sm:text-5xl font-black text-white uppercase tracking-widest mb-6 drop-shadow-lg break-words">
                  {currentWordObj.base}
                </p>

                <button
                  onClick={() => setShowHint(true)}
                  className={`inline-flex items-center gap-2 text-sm font-bold transition-all ${
                    showHint
                      ? 'text-amber-400'
                      : 'text-indigo-400 hover:text-indigo-300 bg-indigo-500/10 px-4 py-2 rounded-full border border-indigo-500/20'
                  }`}
                >
                  <Lightbulb className="w-4 h-4 shrink-0" />
                  <span>{showHint ? currentWordObj.hint : 'Reveal Context Hint'}</span>
                </button>
              </div>

              {/* ── Single Row Grid (The Vault Lock) ── */}
              <div className="w-full flex justify-center mt-12 mb-14 px-2 sm:px-4">
                <div className={`flex w-full max-w-3xl justify-center gap-1.5 sm:gap-2.5 ${isErrorShake ? 'animate-[shake_0.4s_ease-in-out]' : ''}`}>
                  {Array.from({ length: wordLength }).map((_, colIndex) => {
                    const letter = currentGuess[colIndex] || "";
                    let bgColor  = "bg-slate-900/80 border-slate-700/50 shadow-inner";
                    let textColor = "text-white";

                    if (isErrorShake) {
                      bgColor = "bg-rose-500/20 border-rose-500 text-rose-500 shadow-[0_0_20px_rgba(244,63,94,0.3)]";
                    } else if (gameStatus === 'won') {
                      bgColor = "bg-emerald-500/20 border-emerald-400 text-emerald-400 shadow-[0_0_20px_rgba(52,211,153,0.3)]";
                    } else if (letter) {
                      bgColor = "bg-indigo-500/20 border-indigo-400 shadow-[0_0_15px_rgba(129,140,248,0.2)]";
                    }

                    return (
                      <div
                        key={colIndex}
                        className={`flex-1 max-w-[4rem] aspect-[4/5] flex items-center justify-center text-2xl sm:text-4xl font-black uppercase border-2 rounded-xl sm:rounded-2xl transition-all duration-200 ${bgColor} ${textColor}`}
                      >
                        {letter}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* ── End State Overlay (won / lost) ── */}
              {(gameStatus === 'won' || gameStatus === 'lost') ? (
                <div className="w-full max-w-lg bg-slate-900/90 backdrop-blur-xl border border-white/10 rounded-[32px] p-6 sm:p-8 text-center animate-in slide-in-from-bottom-8 duration-500 shadow-2xl">
                  {gameStatus === 'won' ? (
                    <div className="flex flex-col items-center">
                      <div className="bg-emerald-500/20 text-emerald-400 p-3 rounded-full mb-3">
                        <CheckCircle2 className="w-8 h-8" />
                      </div>
                      <h3 className="text-2xl sm:text-3xl font-black text-white mb-6">Nailed it!</h3>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center">
                      <div className="bg-rose-500/20 text-rose-400 p-3 rounded-full mb-3">
                        <ShieldAlert className="w-8 h-8" />
                      </div>
                      <h3 className="text-2xl sm:text-3xl font-black text-white mb-2">Out of tries!</h3>
                      <p className="text-slate-300 mb-6 text-base sm:text-lg">
                        The correct word was{" "}
                        <strong className="text-emerald-400 tracking-widest">{targetWord}</strong>
                      </p>
                    </div>
                  )}

                  <div className="bg-slate-950/50 rounded-2xl p-4 sm:p-5 mb-8 border border-white/5 text-left">
                    <p className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest mb-2">Definition</p>
                    <p className="text-sm text-slate-300 font-medium leading-relaxed">{currentWordObj.hint}</p>
                  </div>

                  <button
                    onClick={handleNextWord}
                    className="w-full bg-white text-slate-900 hover:bg-slate-200 font-black text-lg py-4 rounded-2xl transition-all active:scale-[0.98]"
                  >
                    {currentIndex === DAILY_LIMIT - 1 ? (fromDrill ? 'Unlock Drill 2' : 'See Final Score') : 'Next Word'}
                  </button>
                </div>
              ) : (
                /* ── Keyboard ── */
                <div className="w-full max-w-2xl flex flex-col gap-2 sm:gap-2.5 px-2">
                  {KEYBOARD_ROWS.map((row, i) => (
                    <div key={i} className="flex justify-center gap-1.5 sm:gap-2 w-full">
                      {row.map(key => {
                        const isSpecial = key === 'ENTER' || key === '⌫';
                        return (
                          <button
                            key={key}
                            onClick={() => handleKeyPress(key)}
                            disabled={isErrorShake}
                            className={`h-12 sm:h-14 rounded-xl font-bold text-xs sm:text-base flex items-center justify-center transition-all active:scale-95 border border-white/5 shadow-sm
                              ${isSpecial
                                ? 'px-3 sm:px-6 text-[10px] sm:text-xs tracking-wider bg-slate-800 hover:bg-slate-700 text-slate-300'
                                : 'flex-1 max-w-[40px] sm:max-w-[48px] bg-slate-800/80 hover:bg-slate-700 text-white'}
                              ${isErrorShake ? 'opacity-50 cursor-not-allowed active:scale-100' : ''}
                            `}
                          >
                            {key}
                          </button>
                        );
                      })}
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>

        {/* ── Right Column: How to Play Guide ── */}
        {gameStatus !== 'completed_day' && (
          <div className="w-full xl:w-[340px] shrink-0 bg-slate-900/40 border border-white/10 rounded-[32px] p-6 sm:p-8 xl:mt-6 backdrop-blur-md mb-10 xl:mb-0 shadow-xl">
            <div className="flex items-center gap-3 mb-6 border-b border-white/10 pb-4">
              <div className="bg-indigo-500/20 p-2 rounded-xl text-indigo-400"><Info className="w-5 h-5" /></div>
              <h3 className="text-lg font-black text-white uppercase tracking-widest">How to Play</h3>
            </div>

            <div className="space-y-6">
              <div className="flex gap-4 items-start">
                <div className="w-6 h-6 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-xs font-bold text-slate-400 shrink-0 mt-0.5">1</div>
                <p className="text-sm text-slate-300 leading-relaxed font-medium">
                  Read the basic word and guess its <strong className="text-indigo-300">Band 8.0 Synonym</strong>.
                </p>
              </div>
              <div className="flex gap-4 items-start">
                <div className="w-6 h-6 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-xs font-bold text-slate-400 shrink-0 mt-0.5">2</div>
                <p className="text-sm text-slate-300 leading-relaxed font-medium">
                  Type the word into the lock. You have exactly{" "}
                  <strong className="text-amber-400">3 attempts</strong> to crack it.
                </p>
              </div>
              <div className="flex gap-4 items-start">
                <div className="w-6 h-6 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-xs font-bold text-slate-400 shrink-0 mt-0.5">3</div>
                <div className="flex flex-col gap-3 w-full">
                  <p className="text-sm text-slate-300 leading-relaxed font-medium">
                    If you guess incorrectly the lock flashes red and clears your attempt.
                  </p>
                  <div className="flex gap-1.5 opacity-80">
                    {['W','R','O','N','G'].map(l => (
                      <div key={l} className="flex-1 aspect-[4/5] bg-rose-500/20 text-rose-500 flex items-center justify-center font-black rounded-lg border border-rose-500">
                        {l}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-8 pt-6 border-t border-white/10">
              {fromDrill ? (
                <div className="bg-teal-500/10 border border-teal-500/20 rounded-xl p-3 text-center">
                  <p className="text-xs text-teal-400 font-bold uppercase tracking-widest">
                    🔒 Complete all 5 words to unlock Drill 2
                  </p>
                </div>
              ) : (
                <p className="text-xs text-slate-500 text-center font-bold uppercase tracking-widest">
                  Earn +15 points per word!
                </p>
              )}
            </div>
          </div>
        )}

      </main>

      {/* ── Keyframes ── */}
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          20% { transform: translateX(-6px); }
          40% { transform: translateX(6px); }
          60% { transform: translateX(-6px); }
          80% { transform: translateX(6px); }
        }
        @keyframes flyToTopRight {
          0%   { transform: translate(-50%, -50%) scale(1); opacity: 1; }
          30%  { transform: translate(-50%, -120px) scale(1.3); opacity: 1; }
          100% { transform: translate(150px, -400px) scale(0.4); opacity: 0; }
        }
        @keyframes flyToCenter {
          0%   { opacity: 0; transform: translate(var(--startX), var(--startY)) scale(1.5); filter: blur(4px); }
          30%  { opacity: 1; filter: blur(2px); }
          90%  { opacity: 1; transform: translate(calc(var(--startX) * 0.1), calc(var(--startY) * 0.1)) scale(0.8); filter: blur(0px); }
          100% { opacity: 0; transform: translate(0px, 0px) scale(0.2); filter: blur(0px); }
        }
        @keyframes logoPop {
          0%   { opacity: 0; transform: scale(0.5); filter: blur(10px); }
          60%  { opacity: 1; transform: scale(1.1); filter: blur(0px); }
          100% { opacity: 1; transform: scale(1); }
        }
      `}} />
    </div>
  );
}