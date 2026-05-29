import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useMomentum } from "@/features/student/Context/MomentumContext";
import { callBackend } from '@/features/auth/services/authClient';
import { ArrowLeft, Lightbulb, CheckCircle2, Zap, Info, ShieldAlert, Award, Loader2, RotateCcw } from 'lucide-react';
import {
  stampPassportSlot,
  PASSPORT_BONUS_PTS,
  PASSPORT_STREAK_BONUS_PTS,
} from '@/features/student/utils/passportUtils';

const FALLBACK_WORD_BANK = [
  { base: "IMPORTANT",  target: "CRUCIAL",     hint: "Decisive or critical, especially in the success or failure of something.", target_band: null },
  { base: "VERY HAPPY", target: "ECSTATIC",    hint: "Feeling or expressing overwhelming happiness or joyful excitement.", target_band: null },
  { base: "POOR",       target: "DESTITUTE",   hint: "Without the basic necessities of life.", target_band: null },
  { base: "LAZY",       target: "LETHARGIC",   hint: "Affected by lethargy; sluggish and apathetic.", target_band: null },
  { base: "BRAVE",      target: "INTREPID",    hint: "Fearless; adventurous, often used in formal contexts.", target_band: null },
  { base: "CAREFUL",    target: "METICULOUS",  hint: "Showing great attention to detail; very careful and precise.", target_band: null },
  { base: "BAD",        target: "DETRIMENTAL", hint: "Tending to cause harm.", target_band: null },
  { base: "MANY",       target: "MYRIAD",      hint: "A countless or extremely great number.", target_band: null },
];

const INTRO_WORDS = [
  "CRUCIAL", "ECSTATIC", "DESTITUTE", "LETHARGIC", "INTREPID",
  "METICULOUS", "DETRIMENTAL", "MYRIAD", "ELOQUENT", "PROFOUND",
  "RESILIENT", "COGNITIVE", "ACHIEVE", "VOCABULARY", "ACCOMPLISH",
  "EVALUATE", "COMPREHENSIVE", "SYNONYM", "MOMENTUM", "EXCELLENCE"
];

const DAILY_LIMIT     = 5;
const MAX_TRIES       = 3;
const POINTS_PER_WORD = 2; // Exactly 10 points total for a perfect 5-word game

const KEYBOARD_ROWS = [
  ['Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P'],
  ['A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L'],
  ['ENTER', 'Z', 'X', 'C', 'V', 'B', 'N', 'M', '⌫']
];

interface WordItem {
  base:        string;
  target:      string;
  hint:        string;
  target_band: number | null;
}

export default function LexiGrid() {
  const navigate       = useNavigate();
  const [searchParams] = useSearchParams();

  const difficulty = (searchParams.get('difficulty') || 'INTERMEDIATE').toUpperCase();

  /**
   * GATE MODE    → ?mode=gate  (Drill1 → Drill2 gate from dashboard)
   * Enforces daily lock. syncMomentum from server after session.
   *
   * STANDALONE   → no mode param (sidebar / dashboard card / passport)
   * No daily lock. addPoints client-side only — never sync from
   * server on session end, so earned points are NOT overwritten.
   */
  const isGateMode = searchParams.get('mode') === 'gate';

  const { totalMomentum, addPoints, syncMomentum } = useMomentum();

  const totalAttemptsRef    = useRef(0);
  const allBonusEligibleRef = useRef(true);

  // --- State Management ---
  const [dailyWords, setDailyWords]     = useState<WordItem[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [currentGuess, setCurrentGuess] = useState("");
  const [triesLeft, setTriesLeft]       = useState(MAX_TRIES);
  const [wordsWon, setWordsWon]         = useState(0);
  const [gameStatus, setGameStatus]     = useState<'playing' | 'won' | 'lost' | 'completed_day'>('playing');
  const [isInitializing, setIsInitializing] = useState(true);
  const [fetchError, setFetchError]     = useState(false);
  // Practice mode: daily round already done, student is playing for fun — no momentum
  const [isPracticeMode, setIsPracticeMode] = useState(false);

  const [introStage, setIntroStage]       = useState<'playing' | 'fading' | 'done'>('playing');
  const [isErrorShake, setIsErrorShake]   = useState(false);
  const [showHint, setShowHint]           = useState(false);
  const [flyingScore, setFlyingScore]     = useState(false);
  const [passportStamped, setPassportStamped] = useState(false);

  // ── localMomentum mirrors global momentum for display in topbar.
  //    We update it via addPoints (which updates the global context), and
  //    we only call syncMomentum (which OVERWRITES local state from server)
  //    in gate mode — never in standalone mode.
  const [localMomentum, setLocalMomentum] = useState(totalMomentum);

  useEffect(() => {
    // Keep localMomentum in sync with global context.
    // This fires when totalMomentum changes — including when addPoints is called.
    setLocalMomentum(totalMomentum);
  }, [totalMomentum]);

  // ── Intro animation ──────────────────────────────────────────────────────────
  useEffect(() => {
    const t1 = setTimeout(() => setIntroStage('fading'), 2800);
    const t2 = setTimeout(() => setIntroStage('done'),   3300);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, []);

  const introWordConfigs = useMemo(() => {
    return INTRO_WORDS.map((word, i) => {
      const angle  = (i / INTRO_WORDS.length) * Math.PI * 2;
      const dist   = 400 + Math.random() * 500;
      const startX = Math.cos(angle) * dist;
      const startY = Math.sin(angle) * dist;
      const delay  = Math.random() * 0.8;
      return { word, startX, startY, delay };
    });
  }, []);

  // ── Fetch words ──────────────────────────────────────────────────────────────
  const fetchWords = useCallback(async (): Promise<WordItem[]> => {
    const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:4000';
    try {
      const res = await callBackend(
        `${backendUrl}/api/student/lexigrid-words?difficulty=${encodeURIComponent(difficulty)}`
      );
      if (res.success && Array.isArray(res.data) && res.data.length > 0) {
        return (res.data as any[]).map(w => ({
          base:        w.base_word.toUpperCase(),
          target:      w.target_word.toUpperCase(),
          hint:        w.hint,
          target_band: w.target_band || null,
        }));
      }
    } catch { /* fall through */ }
    setFetchError(true);
    return [...FALLBACK_WORD_BANK].sort(() => 0.5 - Math.random()).slice(0, DAILY_LIMIT);
  }, [difficulty]);

  // ── Init ─────────────────────────────────────────────────────────────────────
  useEffect(() => {
    const today      = new Date().toISOString().split('T')[0];
    const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:4000';

    const init = async () => {
      // 1. Backend is the single source of truth for whether today's session is done.
      //    Using IST on both sides prevents stale-localStorage false-positives in the
      //    00:00–05:30 IST window (new IST day, same UTC day).
      let backendReachable = false;
      let savedDataStr: string | null = null;
      
      try {
        const stateRes = await callBackend(`${backendUrl}/api/student/daily-drill-state`);
        if (stateRes.success) {
          backendReachable = true;
          if (stateRes.lexigrid_completed_today) {
            // Daily momentum already earned — switch to practice mode and load fresh
            // words so the student can keep playing without restriction.
            setIsPracticeMode(true);
            // Fall through to step 3 (fetch fresh words) — do NOT return.
          }
          // Backend confirmed status — clear any stale localStorage "completed" entry.
          savedDataStr = localStorage.getItem('lexigrid_state');
          if (savedDataStr) {
            try {
              const parsed = JSON.parse(savedDataStr);
              if (parsed.currentIndex >= DAILY_LIMIT) {
                localStorage.removeItem('lexigrid_state');
                savedDataStr = null;
              }
            } catch { 
              localStorage.removeItem('lexigrid_state'); 
              savedDataStr = null;
            }
          }
        }
      } catch {
        // Backend unreachable — fall through to localStorage/fallback
        savedDataStr = localStorage.getItem('lexigrid_state');
      }

      if (isGateMode) {
        // Gate mode: enforce daily lock
        try {
          if (savedDataStr) {
            const parsed = JSON.parse(savedDataStr);
            const sameDay    = parsed.date === today;
            const inProgress = Array.isArray(parsed.words) && parsed.words.length > 0
                               && parsed.currentIndex < DAILY_LIMIT;
            const hasTargetBand = Array.isArray(parsed.words) && parsed.words.every((w: any) => 'target_band' in w);
            if (sameDay && inProgress && hasTargetBand) {
              setDailyWords(parsed.words);
              setCurrentIndex(parsed.currentIndex || 0);
              setTriesLeft(parsed.triesLeft ?? MAX_TRIES);
              setCurrentGuess(parsed.currentGuess || "");
              setWordsWon(parsed.wordsWon || 0);
              setIsInitializing(false);
              return;
            }
            // Stale or completed entry (different date, or completed when backend was offline)
            if (!backendReachable && parsed.currentIndex >= DAILY_LIMIT && sameDay) {
              // Backend was unreachable and localStorage shows completed — honour it
              setWordsWon(parsed.wordsWon || 0);
              setGameStatus('completed_day');
              setIsInitializing(false);
              return;
            }
          }
        } catch { /* backend unreachable — allow play */ }

        // 3. Fresh session — fetch today's words from backend
        try {
          const res = await callBackend(
            `${backendUrl}/api/student/lexigrid-words?difficulty=${encodeURIComponent(difficulty)}`
          );

          let words: WordItem[];
          if (res.success && Array.isArray(res.data) && res.data.length > 0) {
            words = (res.data as any[]).map((w) => ({
              base:        w.base_word.toUpperCase(),
              target:      w.target_word.toUpperCase(),
              hint:        w.hint,
              target_band: w.target_band != null ? parseFloat(String(w.target_band)) : null,
            }));
          } else {
            console.warn('[LexiGrid] No words from API, using fallback bank.');
            words = [...FALLBACK_WORD_BANK].sort(() => 0.5 - Math.random()).slice(0, DAILY_LIMIT);
          }

          // Fresh gate session
          setDailyWords(words);
          setCurrentIndex(0); setTriesLeft(MAX_TRIES); setCurrentGuess(''); setWordsWon(0);
          totalAttemptsRef.current = 0; allBonusEligibleRef.current = true;
          localStorage.setItem('lexigrid_state', JSON.stringify({
            date: today, words, currentIndex: 0, triesLeft: MAX_TRIES, currentGuess: '', wordsWon: 0,
          }));
          setIsInitializing(false);
          return;
        } catch (err) {
          console.error('[LexiGrid] Fresh session fallback fetch error', err);
          const words = [...FALLBACK_WORD_BANK].sort(() => 0.5 - Math.random()).slice(0, DAILY_LIMIT);
          setDailyWords(words);
          setCurrentIndex(0); setTriesLeft(MAX_TRIES); setCurrentGuess(''); setWordsWon(0);
          totalAttemptsRef.current = 0; allBonusEligibleRef.current = true;
          setIsInitializing(false);
          return;
        }
      } // Close isGateMode

      // ── STANDALONE MODE ───────────────────────────────────────────────────────
      // Never lock. Try to resume a mid-game standalone session.
      const saved = localStorage.getItem('lexigrid_standalone_state');
      if (saved) {
        try {
          const p = JSON.parse(saved);
          if (p.date === today && Array.isArray(p.words) && p.words.length > 0
              && p.currentIndex < DAILY_LIMIT) {
            setDailyWords(p.words);
            setCurrentIndex(p.currentIndex || 0);
            setTriesLeft(p.triesLeft ?? MAX_TRIES);
            setCurrentGuess(p.currentGuess || '');
            setWordsWon(p.wordsWon || 0);
            setIsInitializing(false);
            return;
          }
        } catch { localStorage.removeItem('lexigrid_standalone_state'); }
      }

      // Fresh standalone session
      const words = await fetchWords();
      setDailyWords(words);
      setCurrentIndex(0); setTriesLeft(MAX_TRIES); setCurrentGuess(''); setWordsWon(0);
      totalAttemptsRef.current = 0; allBonusEligibleRef.current = true;
      setIsInitializing(false);
    };

    init();
  }, [isGateMode, fetchWords, difficulty]);

  // ── Save state ───────────────────────────────────────────────────────────────
  const saveState = useCallback((index: number, tries: number, guess: string, score: number) => {
    const today = new Date().toISOString().split('T')[0];
    const key   = isGateMode ? 'lexigrid_state' : 'lexigrid_standalone_state';
    try {
      localStorage.setItem(key, JSON.stringify({
        date: today, words: dailyWords, currentIndex: index,
        triesLeft: tries, currentGuess: guess, wordsWon: score,
      }));
    } catch { /* ignore */ }
  }, [isGateMode, dailyWords]);

  // ── Keyboard ─────────────────────────────────────────────────────────────────
  const handleKeyPress = useCallback((key: string) => {
    if (gameStatus !== 'playing' || isInitializing || isErrorShake || introStage !== 'done') return;

    const targetWord = dailyWords[currentIndex]?.target || '';
    const wordLength = targetWord.length;

    if (key === 'ENTER') {
      if (currentGuess.length !== wordLength) {
        setIsErrorShake(true);
        setTimeout(() => setIsErrorShake(false), 400);
        return;
      }
      if (currentGuess === targetWord) {
        setGameStatus('won');
        const newScore = wordsWon + 1;
        setWordsWon(newScore);
        saveState(currentIndex, triesLeft, currentGuess, newScore);
        triggerWinAnimation(MAX_TRIES - triesLeft + 1);
      } else {
        const newTries = triesLeft - 1;
        setTriesLeft(newTries);
        setIsErrorShake(true);
        saveState(currentIndex, newTries, currentGuess, wordsWon);
        setTimeout(() => {
          setIsErrorShake(false);
          if (newTries <= 0) setGameStatus('lost');
          else setCurrentGuess('');
        }, 600);
      }
    } else if (key === '⌫' || key === 'BACKSPACE') {
      const g = currentGuess.slice(0, -1);
      setCurrentGuess(g);
      saveState(currentIndex, triesLeft, g, wordsWon);
    } else if (currentGuess.length < wordLength && /^[A-Z]$/.test(key)) {
      const g = currentGuess + key;
      setCurrentGuess(g);
      saveState(currentIndex, triesLeft, g, wordsWon);
    }
  }, [currentGuess, gameStatus, triesLeft, currentIndex, dailyWords, wordsWon, isInitializing, isErrorShake, introStage, saveState]);

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'Enter') handleKeyPress('ENTER');
      else if (e.key === 'Backspace') handleKeyPress('⌫');
      else { const k = e.key.toUpperCase(); if (/^[A-Z]$/.test(k)) handleKeyPress(k); }
    };
    window.addEventListener('keydown', down);
    return () => window.removeEventListener('keydown', down);
  }, [handleKeyPress]);

  // --- Load fresh words (used by both init and "Play Another Round") ---
  const loadFreshWords = useCallback(async () => {
    setIsInitializing(true);
    setCurrentIndex(0);
    setWordsWon(0);
    setTriesLeft(MAX_TRIES);
    setCurrentGuess('');
    setGameStatus('playing');
    totalAttemptsRef.current = 0;
    allBonusEligibleRef.current = true;
    try {
      const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:4000';
      const res = await callBackend(
        `${backendUrl}/api/student/lexigrid-words?difficulty=${encodeURIComponent(difficulty)}`
      );
      let words: WordItem[];
      if (res.success && Array.isArray(res.data) && res.data.length > 0) {
        words = (res.data as any[]).map((w: any) => ({
          base:        w.base_word.toUpperCase(),
          target:      w.target_word.toUpperCase(),
          hint:        w.hint,
          target_band: w.target_band != null ? parseFloat(String(w.target_band)) : null,
        }));
      } else {
        words = [...FALLBACK_WORD_BANK].sort(() => 0.5 - Math.random()).slice(0, DAILY_LIMIT);
      }
      setDailyWords(words);
    } catch {
      setDailyWords([...FALLBACK_WORD_BANK].sort(() => 0.5 - Math.random()).slice(0, DAILY_LIMIT));
    } finally {
      setIsInitializing(false);
    }
  }, [difficulty]);

  // --- Backend sync on session complete ---
  const submitLexiGridSession = useCallback(async (finalWordsWon: number) => {
    try {
      const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:4000';
      const res = await callBackend(`${backendUrl}/api/student/game-score`, {
        method: 'POST',
        body: JSON.stringify({
          game_type:      'LEXIGRID',
          words_solved:   finalWordsWon,
          total_attempts: totalAttemptsRef.current,
          bonus_eligible: allBonusEligibleRef.current && finalWordsWon >= DAILY_LIMIT,
        }),
      });

      // Only sync momentum from server in GATE MODE.
      if (isGateMode && res.momentum_score !== undefined) {
        syncMomentum(res.momentum_score);
      }
    } catch (err) {
      console.error('[LexiGrid] Failed to submit session:', err);
    }

    const { bonusJustUnlocked, streakBonusJustUnlocked } = stampPassportSlot('vocabulary');
    setPassportStamped(true);
    if (bonusJustUnlocked)       addPoints(PASSPORT_BONUS_PTS,        'Skill Passport complete');
    if (streakBonusJustUnlocked) addPoints(PASSPORT_STREAK_BONUS_PTS, 'Skill Passport streak bonus');
    
  }, [isGateMode, syncMomentum, addPoints]);

  // ── Win animation ────────────────────────────────────────────────────────────
  const triggerWinAnimation = (attemptsForThisWord: number) => {
    if (attemptsForThisWord > MAX_TRIES) allBonusEligibleRef.current = false;
    totalAttemptsRef.current += attemptsForThisWord;

    if (isPracticeMode) return; // No momentum gained in practice — skip all reward UI

    setFlyingScore(true);
    setTimeout(() => {
      // addPoints updates the MomentumContext → totalMomentum changes →
      // useEffect above updates localMomentum → topbar shows new value.
      addPoints(POINTS_PER_WORD);
    }, 800);
    setTimeout(() => setFlyingScore(false), 1500);
  };

  const handleNextWord = () => {
    const nextIndex = currentIndex + 1;
    if (nextIndex >= DAILY_LIMIT) {
      setGameStatus('completed_day');
      submitLexiGridSession(wordsWon);
    } else {
      setCurrentIndex(nextIndex);
      setTriesLeft(MAX_TRIES);
      setCurrentGuess('');
      setGameStatus('playing');
      setShowHint(false);
    }
    saveState(nextIndex, MAX_TRIES, '', wordsWon);
  };

  // ── Play Again (standalone only) ─────────────────────────────────────────────
  const handlePlayAgain = async () => {
    setIsInitializing(true);
    setPassportStamped(false);
    totalAttemptsRef.current    = 0;
    allBonusEligibleRef.current = true;
    localStorage.removeItem('lexigrid_standalone_state');
    const words = await fetchWords();
    setDailyWords(words);
    setCurrentIndex(0); setTriesLeft(MAX_TRIES); setCurrentGuess(''); setWordsWon(0);
    setGameStatus('playing'); setShowHint(false);
    setIsInitializing(false);
  };

  // ─────────────────────────────────────────────────────────────────────────────

  if (isInitializing) {
    return (
      <div className="min-h-screen bg-[#07070a] flex items-center justify-center font-sans text-white">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-10 h-10 text-indigo-500 animate-spin" />
          <p className="text-slate-400 font-bold tracking-widest uppercase text-sm">Loading Today's Challenge...</p>
        </div>
      </div>
    );
  }

  const currentWordObj = dailyWords[currentIndex];
  const targetWord     = currentWordObj?.target || '';
  const wordLength     = targetWord.length;

  return (
    <div className="min-h-screen bg-[#07070a] bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-indigo-950/20 via-[#07070a] to-[#07070a] font-sans text-white flex flex-col selection:bg-indigo-500/30 overflow-x-hidden relative">

      {/* ── INTRO OVERLAY ── */}
      {introStage !== 'done' && (
        <div className={`fixed inset-0 z-[100] bg-[#07070a] flex items-center justify-center overflow-hidden transition-opacity duration-500 ${introStage === 'fading' ? 'opacity-0' : 'opacity-100'}`}>
          <div className="absolute inset-0 pointer-events-none">
            {introWordConfigs.map((config, i) => (
              <div key={i}
                className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-indigo-400/20 font-black text-xl md:text-3xl uppercase whitespace-nowrap mix-blend-screen"
                style={{
                  animation: `flyToCenter 1.4s cubic-bezier(0.2,0,0.8,1) ${config.delay}s forwards`,
                  '--startX': `${config.startX}px`,
                  '--startY': `${config.startY}px`,
                  transform: `translate(${config.startX}px,${config.startY}px) scale(0)`,
                  opacity: 0
                } as React.CSSProperties}>
                {config.word}
              </div>
            ))}
          </div>
          <h1 className="relative z-10 text-5xl md:text-7xl font-black text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-400 tracking-[0.2em] uppercase drop-shadow-[0_0_40px_rgba(129,140,248,0.6)] animate-[logoPop_1s_ease-out_1s_both]">
            LexiGrid
          </h1>
        </div>
      )}

      {fetchError && (
        <div className="relative z-20 mx-auto mt-2 max-w-lg bg-amber-500/10 border border-amber-500/30 rounded-2xl px-4 py-2 text-center text-amber-400 text-xs font-bold tracking-wide">
          Using offline word bank — check your connection for fresh challenges.
        </div>
      )}

      {/* ── Topbar ── */}
      <header className="flex items-center justify-between p-4 sm:p-6 max-w-7xl mx-auto w-full relative z-20">
        <button onClick={() => navigate('/student/dashboard')} className="p-2.5 -ml-2 rounded-full hover:bg-white/10 transition-colors">
          <ArrowLeft className="w-5 h-5 text-slate-300" />
        </button>
        <div className="flex items-center gap-3">
          <span className={`text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-widest border ${
            isGateMode
              ? 'bg-teal-500/20 text-teal-300 border-teal-500/30'
              : 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30'
          }`}>
            {isGateMode ? 'Gate Mode' : 'Practice Mode'}
          </span>
          <div className="flex items-center gap-2 bg-indigo-500/10 border border-indigo-500/20 px-4 py-2 rounded-full shadow-lg shadow-indigo-500/5">
            <Zap className="w-4 h-4 text-amber-400 fill-amber-400" />
            <span className="font-black text-indigo-50 text-lg">{localMomentum}</span>
          </div>
        </div>
      </header>

      {/* ── Flying Score ── */}
      {flyingScore && (
        <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 animate-[flyToTopRight_0.8s_ease-in-out_forwards]">
          <div className="text-4xl font-black text-amber-400 drop-shadow-[0_0_20px_rgba(251,191,36,0.8)]">+{POINTS_PER_WORD}</div>
        </div>
      )}

      <main className="flex-1 flex flex-col xl:flex-row items-center xl:items-start justify-center max-w-7xl mx-auto w-full px-4 sm:px-6 gap-8 xl:gap-16 pb-12">
        <div className="flex-1 flex flex-col items-center w-full max-w-3xl relative z-10">
          
        {gameStatus === 'completed_day' && (
            <div className="w-full max-w-lg bg-slate-900/60 backdrop-blur-xl border border-white/10 rounded-[32px] p-8 sm:p-10 flex flex-col items-center text-center shadow-2xl animate-in zoom-in-95 duration-500 mt-10">

              {isPracticeMode ? (
                /* ── Practice Round Complete ── */
                <>
                  <div className="w-20 h-20 bg-indigo-500/20 rounded-full flex items-center justify-center mb-6 ring-8 ring-indigo-500/10">
                    <Award className="w-10 h-10 text-indigo-400" />
                  </div>
                  <h2 className="text-3xl font-black mb-2 text-white">Practice Round Complete</h2>
                  <p className="text-slate-400 mb-8 font-medium">
                    Your daily momentum was already earned — this was a practice session.
                  </p>
                  <div className="w-full bg-slate-950/50 rounded-2xl p-6 border border-white/5 mb-8 flex justify-around">
                    <div>
                      <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">Score</p>
                      <p className="text-4xl font-black text-white">{wordsWon} <span className="text-xl text-slate-600">/ {DAILY_LIMIT}</span></p>
                    </div>
                    <div className="w-px bg-white/10" />
                    <div>
                      <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">Mode</p>
                      <p className="text-lg font-black text-indigo-400 mt-2">Practice</p>
                    </div>
                  </div>
                  <button
                    onClick={loadFreshWords}
                    className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-lg py-4 rounded-2xl transition-all shadow-lg hover:shadow-indigo-500/25 active:scale-[0.98] mb-3"
                  >
                    Play Another Round
                  </button>
                  <button
                    onClick={() => navigate('/student/dashboard')}
                    className="w-full bg-white/5 hover:bg-white/10 text-slate-400 font-bold text-base py-3 rounded-2xl transition-all"
                  >
                    Return to Dashboard
                  </button>
                </>
              ) : (
                /* ── Daily Challenge Complete (first round — momentum earned) ── */
                <>
                  <div className="w-20 h-20 bg-amber-500/20 rounded-full flex items-center justify-center mb-6 ring-8 ring-amber-500/10">
                    <Award className="w-10 h-10 text-amber-400" />
                  </div>
                  <h2 className="text-3xl font-black mb-2 text-white">Daily Challenge Complete</h2>
                  <p className="text-slate-400 mb-10 font-medium">Here is your vocabulary wrap-up for today.</p>
                  <div className="w-full bg-slate-950/50 rounded-2xl p-6 border border-white/5 mb-8 flex justify-around">
                    <div>
                      <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">Score</p>
                      <p className="text-4xl font-black text-white">{wordsWon} <span className="text-xl text-slate-600">/ {DAILY_LIMIT}</span></p>
                    </div>
                    <div className="w-px bg-white/10" />
                    <div>
                      <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">Momentum</p>
                      <p className="text-4xl font-black text-amber-400">+{wordsWon * POINTS_PER_WORD}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => navigate('/student/dashboard', { state: { lexigridCompleted: true } })}
                    className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-lg py-4 rounded-2xl transition-all shadow-lg hover:shadow-indigo-500/25 active:scale-[0.98] mb-3"
                  >
                    Return to Dashboard
                  </button>
                  <button
                    onClick={() => { setIsPracticeMode(true); loadFreshWords(); }}
                    className="w-full bg-white/5 hover:bg-white/10 text-slate-400 font-bold text-base py-3 rounded-2xl transition-all"
                  >
                    Keep Practising →
                  </button>
                </>
              )}
            </div>
          )}
          {/* ── ACTIVE GAME ── */}
          {gameStatus !== 'completed_day' && (
            <>
              <div className="text-center w-full mt-2 xl:mt-6">
                <div className="flex items-center justify-between mb-8 px-2 max-w-lg mx-auto">
                  <span className="text-[10px] sm:text-xs font-bold uppercase tracking-widest text-slate-400 bg-slate-800/50 px-3 py-1.5 rounded-full border border-white/5">
                    Word {currentIndex + 1} of {DAILY_LIMIT}
                  </span>
                  <div className="flex items-center gap-2 bg-slate-800/50 px-3 py-1.5 rounded-full border border-white/5">
                    <span className="text-[10px] sm:text-xs font-bold text-slate-400 uppercase tracking-wider">{Math.max(0, triesLeft)} attempts left</span>
                    <div className="flex gap-1.5 ml-1">
                      {Array.from({ length: MAX_TRIES }).map((_, i) => (
                        <div key={i} className={`w-2 h-2 rounded-full transition-colors duration-300 ${i < triesLeft ? 'bg-indigo-400 shadow-[0_0_8px_rgba(129,140,248,0.5)]' : 'bg-slate-700'}`} />
                      ))}
                    </div>
                  </div>
                </div>

                <p className="text-slate-400 font-medium mb-2 text-sm sm:text-base">Find the Band {currentWordObj.target_band ?? 8.0} synonym for:</p>
                <p className="text-3xl sm:text-5xl font-black text-white uppercase tracking-widest mb-6 drop-shadow-lg break-words">
                  {currentWordObj?.base}
                </p>

                <button
                  onClick={() => setShowHint(true)}
                  className={`inline-flex items-center gap-2 text-sm font-bold transition-all ${showHint ? 'text-amber-400' : 'text-indigo-400 hover:text-indigo-300 bg-indigo-500/10 px-4 py-2 rounded-full border border-indigo-500/20'}`}
                >
                  <Lightbulb className="w-4 h-4 shrink-0" />
                  <span>{showHint ? currentWordObj?.hint : 'Reveal Context Hint'}</span>
                </button>
              </div>

              {/* Vault Lock Grid */}
              <div className="w-full flex justify-center mt-12 mb-14 px-2 sm:px-4">
                <div className={`flex w-full max-w-3xl justify-center gap-1.5 sm:gap-2.5 ${isErrorShake ? 'animate-[shake_0.4s_ease-in-out]' : ''}`}>
                  {Array.from({ length: wordLength }).map((_, colIndex) => {
                    const letter = currentGuess[colIndex] || '';
                    let bgColor  = 'bg-slate-900/80 border-slate-700/50 shadow-inner';
                    if (isErrorShake)             bgColor = 'bg-rose-500/20 border-rose-500 shadow-[0_0_20px_rgba(244,63,94,0.3)]';
                    else if (gameStatus === 'won') bgColor = 'bg-emerald-500/20 border-emerald-400 shadow-[0_0_20px_rgba(52,211,153,0.3)]';
                    else if (letter)              bgColor = 'bg-indigo-500/20 border-indigo-400 shadow-[0_0_15px_rgba(129,140,248,0.2)]';
                    return (
                      <div key={colIndex} className={`flex-1 max-w-[4rem] aspect-[4/5] flex items-center justify-center text-2xl sm:text-4xl font-black uppercase border-2 rounded-xl sm:rounded-2xl transition-all duration-200 ${bgColor} text-white`}>
                        {letter}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Word result overlay */}
              {(gameStatus === 'won' || gameStatus === 'lost') ? (
                <div className="w-full max-w-lg bg-slate-900/90 backdrop-blur-xl border border-white/10 rounded-[32px] p-6 sm:p-8 text-center animate-in slide-in-from-bottom-8 duration-500 shadow-2xl">
                  {gameStatus === 'won' ? (
                    <div className="flex flex-col items-center">
                      <div className="bg-emerald-500/20 text-emerald-400 p-3 rounded-full mb-3"><CheckCircle2 className="w-8 h-8" /></div>
                      <h3 className="text-2xl sm:text-3xl font-black text-white mb-6">Nailed it!</h3>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center">
                      <div className="bg-rose-500/20 text-rose-400 p-3 rounded-full mb-3"><ShieldAlert className="w-8 h-8" /></div>
                      <h3 className="text-2xl sm:text-3xl font-black text-white mb-2">Out of tries!</h3>
                      <p className="text-slate-300 mb-6 text-base sm:text-lg">The correct word was <strong className="text-emerald-400 tracking-widest">{targetWord}</strong></p>
                    </div>
                  )}
                  <div className="bg-slate-950/50 rounded-2xl p-4 sm:p-5 mb-8 border border-white/5 text-left">
                    <p className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest mb-2">Definition</p>
                    <p className="text-sm text-slate-300 font-medium leading-relaxed">{currentWordObj?.hint}</p>
                  </div>
                  <button
                    onClick={handleNextWord}
                    className="w-full bg-white text-slate-900 hover:bg-slate-200 font-black text-lg py-4 rounded-2xl transition-all active:scale-[0.98]"
                  >
                    {currentIndex === DAILY_LIMIT - 1 ? 'See Final Score' : 'Next Word'}
                  </button>
                </div>
              ) : (
                /* Keyboard */
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
                              ${isSpecial ? 'px-3 sm:px-6 text-[10px] sm:text-xs tracking-wider bg-slate-800 hover:bg-slate-700 text-slate-300' : 'flex-1 max-w-[40px] sm:max-w-[48px] bg-slate-800/80 hover:bg-slate-700 text-white'}
                              ${isErrorShake ? 'opacity-50 cursor-not-allowed active:scale-100' : ''}`}
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

        {/* ── How to Play ── */}
        {gameStatus !== 'completed_day' && (
          <div className="w-full xl:w-[340px] shrink-0 bg-slate-900/40 border border-white/10 rounded-[32px] p-6 sm:p-8 xl:mt-6 backdrop-blur-md mb-10 xl:mb-0 shadow-xl">
            <div className="flex items-center gap-3 mb-6 border-b border-white/10 pb-4">
              <div className="bg-indigo-500/20 p-2 rounded-xl text-indigo-400"><Info className="w-5 h-5" /></div>
              <h3 className="text-lg font-black text-white uppercase tracking-widest">How to Play</h3>
            </div>
            <div className="space-y-6">
              <div className="flex gap-4 items-start">
                <div className="w-6 h-6 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-xs font-bold text-slate-400 shrink-0 mt-0.5">1</div>
                <p className="text-sm text-slate-300 leading-relaxed font-medium">Read the basic word and guess its <strong className="text-indigo-300">Synonym</strong>.</p>
              </div>
              <div className="flex gap-4 items-start">
                <div className="w-6 h-6 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-xs font-bold text-slate-400 shrink-0 mt-0.5">2</div>
                <p className="text-sm text-slate-300 leading-relaxed font-medium">Type the word into the lock. You have exactly <strong className="text-amber-400">3 attempts</strong> to crack it.</p>
              </div>
              <div className="flex gap-4 items-start">
                <div className="w-6 h-6 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-xs font-bold text-slate-400 shrink-0 mt-0.5">3</div>
                <div className="flex flex-col gap-3 w-full">
                  <p className="text-sm text-slate-300 leading-relaxed font-medium">If you guess incorrectly, the lock flashes red and clears your attempt.</p>
                  <div className="flex gap-1.5 opacity-80">
                    {['W','R','O','N','G'].map(l => (
                      <div key={l} className="flex-1 aspect-[4/5] bg-rose-500/20 text-rose-500 flex items-center justify-center font-black rounded-lg border border-rose-500">{l}</div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
            <div className="mt-8 pt-6 border-t border-white/10">
              <p className="text-xs text-slate-500 text-center font-bold uppercase tracking-widest">Earn +{POINTS_PER_WORD} points per word!</p>
              {!isGateMode && (
                <p className="text-xs text-indigo-400/70 text-center font-medium mt-2">Solve all 5 to stamp your Vocabulary passport slot</p>
              )}
            </div>
          </div>
        )}
      </main>

      <style dangerouslySetInnerHTML={{__html: `
        @keyframes shake { 0%,100%{transform:translateX(0)} 20%{transform:translateX(-6px)} 40%{transform:translateX(6px)} 60%{transform:translateX(-6px)} 80%{transform:translateX(6px)} }
        @keyframes flyToTopRight { 0%{transform:translate(-50%,-50%) scale(1);opacity:1} 30%{transform:translate(-50%,-120px) scale(1.3);opacity:1} 100%{transform:translate(150px,-400px) scale(0.4);opacity:0} }
        @keyframes flyToCenter { 0%{opacity:0;transform:translate(var(--startX),var(--startY)) scale(1.5);filter:blur(4px)} 30%{opacity:1;filter:blur(2px)} 90%{opacity:1;transform:translate(calc(var(--startX)*0.1),calc(var(--startY)*0.1)) scale(0.8);filter:blur(0px)} 100%{opacity:0;transform:translate(0px,0px) scale(0.2);filter:blur(0px)} }
        @keyframes logoPop { 0%{opacity:0;transform:scale(0.5);filter:blur(10px)} 60%{opacity:1;transform:scale(1.1);filter:blur(0px)} 100%{opacity:1;transform:scale(1)} }
      `}} />
    </div>
  );
}