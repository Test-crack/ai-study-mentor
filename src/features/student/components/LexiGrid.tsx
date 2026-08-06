import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useMomentum } from "@/features/student/Context/MomentumContext";
import { callBackend } from '@/features/auth/services/authClient';
import { ArrowLeft, Lightbulb, CheckCircle2, Zap, Info, ShieldAlert, Award, Loader2, RotateCcw, Eye, Target, Heart, Sparkles, Trophy, KeyRound } from 'lucide-react';
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

const DAILY_LIMIT = 5;
const MAX_TRIES = 3;
const POINTS_PER_WORD = 15;
// Momentum cost to skip the gated LexiGrid and jump straight to Drill 2.
// Change this single value if the price needs to be different (e.g. 1450).
const SKIP_GATE_COST = 150;
const REVEAL_COST = 5;

function fisherYatesShuffle<T>(arr: T[]): T[] {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

// IST date string (YYYY-MM-DD) — must match the backend's currentISTDate() boundary.
// Using toISOString() gives a UTC date which is wrong for the 5.5-hour window after
// midnight IST but before midnight UTC (00:00–05:30 IST = still previous UTC day).
function todayIST(): string {
  const IST_OFFSET_MS = 5.5 * 60 * 60 * 1000;
  const ist = new Date(Date.now() + IST_OFFSET_MS);
  return [
    ist.getUTCFullYear(),
    String(ist.getUTCMonth() + 1).padStart(2, '0'),
    String(ist.getUTCDate()).padStart(2, '0')
  ].join('-');
}

const KEYBOARD_ROWS = [
  ['Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P'],
  ['A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L'],
  ['ENTER', 'Z', 'X', 'C', 'V', 'B', 'N', 'M', '⌫']
];

interface WordItem {
  id?:         string;
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
  // HMAC-signed token returned by the words API — sent back with score to prevent forgery
  const sessionTokenRef = useRef<string>('');
  // How much client-side momentum has already been applied via addPoints for the
  // CURRENT session. Lets applySessionMomentum() add only the marginal delta instead
  // of re-awarding the whole total, so a page reload mid-session can't double-award.
  const sessionAwardedRef = useRef(0);

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
  // Tracks whether the final score POST failed so we can show a retry prompt
  const [submitError, setSubmitError] = useState(false);
  // Guards the skip-gate action against double-clicks while the deduction/sync runs
  const [isSkipping, setIsSkipping] = useState(false);
  // Partial letter reveal — per-word positions and session-wide count
  const [wordRevealedPositions, setWordRevealedPositions] = useState<Record<number, string>>({});
  const [sessionLettersRevealed, setSessionLettersRevealed] = useState(0);

  // UI States
  const [introStage, setIntroStage]     = useState<'playing' | 'fading' | 'done'>('playing');
  const [isErrorShake, setIsErrorShake] = useState(false);
  const [showHint, setShowHint]         = useState(false);
  const [flyingScore, setFlyingScore]   = useState(false);
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
    const today      = todayIST();
    const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:4000';

    const init = async () => {
      // 1. Backend is the single source of truth for whether today's session is done.
      //    Using IST on both sides prevents stale-localStorage false-positives in the
      //    00:00–05:30 IST window (new IST day, same UTC day).
      // Retry any score submission that failed in a previous session
      const pendingSubmit = localStorage.getItem('lexigrid_pending_submit');
      if (pendingSubmit) {
        try {
          const pending = JSON.parse(pendingSubmit);
          if (pending.date === today) {
            const retryRes = await callBackend(`${backendUrl}/api/student/game-score`, {
              method: 'POST',
              body: JSON.stringify(pending),
            });
            if (retryRes.momentum_score !== undefined) syncMomentum(retryRes.momentum_score);
          }
          localStorage.removeItem('lexigrid_pending_submit');
        } catch {
          // Still failing — keep the entry for the next load
        }
      }

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
      }

      // 2. Resume an in-progress session from localStorage (same browser, mid-game).
      //    Only trusted when: date matches today (IST), AND session is not yet complete.
      //    If backend was reachable we already cleared stale completed entries above.
      const savedData = localStorage.getItem('lexigrid_state');
      if (savedData) {
        try {
          const parsed = JSON.parse(savedData);
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
            if (parsed.sessionToken) sessionTokenRef.current = parsed.sessionToken;
            if (parsed.wordRevealedPositions) setWordRevealedPositions(parsed.wordRevealedPositions);
            if (parsed.sessionLettersRevealed) setSessionLettersRevealed(parsed.sessionLettersRevealed);
            // Re-derive how much has already been awarded this session using the exact
            // same formula applySessionMomentum uses, so resuming after a reload never
            // re-awards (or under-awards) momentum already reflected in the topbar.
            sessionAwardedRef.current = Math.max(
              0,
              (parsed.wordsWon || 0) * POINTS_PER_WORD - (parsed.sessionLettersRevealed || 0) * REVEAL_COST
            );
            // Restore lost state so the "Out of tries" overlay re-renders on return.
            // The student sees the correct answer again and can click Next Word normally.
            if (parsed.gameStatus === 'lost' && (parsed.triesLeft ?? MAX_TRIES) <= 0) {
              setGameStatus('lost');
            }
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
          localStorage.removeItem('lexigrid_state');
        } catch {
          console.warn('[LexiGrid] Corrupted save data. Clearing...');
          localStorage.removeItem('lexigrid_state');
        }
      }

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
          sessionTokenRef.current = res.session_token ?? '';
        } else {
          console.warn('[LexiGrid] No words from API, using fallback bank.');
          words = fisherYatesShuffle([...FALLBACK_WORD_BANK]).slice(0, DAILY_LIMIT);
          sessionTokenRef.current = '';
        }

        setDailyWords(words);
        setCurrentIndex(0);
        setTriesLeft(MAX_TRIES);
        setCurrentGuess('');
        setWordsWon(0);

        localStorage.setItem('lexigrid_state', JSON.stringify({
          date: todayIST(), words, currentIndex: 0, triesLeft: MAX_TRIES, currentGuess: '', wordsWon: 0,
          sessionToken: sessionTokenRef.current,
        }));
      } catch (err) {
        console.error('[LexiGrid] Failed to fetch words from API:', err);
        setFetchError(true);
        const words = fisherYatesShuffle([...FALLBACK_WORD_BANK]).slice(0, DAILY_LIMIT);
        setDailyWords(words);
        setCurrentIndex(0);
        setTriesLeft(MAX_TRIES);
        setCurrentGuess('');
        setWordsWon(0);
      } finally {
        setIsInitializing(false);
      }
    };

    init();
  }, [isGateMode, fetchWords, difficulty]);

// src/features/B-C/games/Lexigridgame.tsx

// REPLACE the existing saveState function
const saveState = (
  index: number, tries: number, guess: string, score: number,
  status: typeof gameStatus = gameStatus,
  reveals: Record<number, string> = wordRevealedPositions,
  sessionReveals: number = sessionLettersRevealed,
) => {
  localStorage.setItem('lexigrid_state', JSON.stringify({
    date: todayIST(),
    words: dailyWords,
    currentIndex: index,
    triesLeft: tries,
    currentGuess: guess,
    wordsWon: score,
    sessionToken: sessionTokenRef.current,
    gameStatus: status,
    wordRevealedPositions: reveals,
    sessionLettersRevealed: sessionReveals,
  }));
};

  // --- Session-wide momentum reconciliation ---
  // Mirrors the backend formula exactly: max(0, wordsSolved*15 - lettersRevealed*5).
  // Called after every win AND every reveal so the topbar always reflects the same
  // number the server would compute — reveals on a word later lost still count
  // against the session total, same as the backend, instead of only being charged
  // when the word that used them is won.
  const applySessionMomentum = useCallback((newWordsWon: number, newLettersRevealed: number) => {
    if (isPracticeMode) return;
    const target = Math.max(0, newWordsWon * POINTS_PER_WORD - newLettersRevealed * REVEAL_COST);
    const delta = target - sessionAwardedRef.current;
    if (delta !== 0) addPoints(delta);
    sessionAwardedRef.current = target;
  }, [isPracticeMode, addPoints]);

  // ── Keyboard ─────────────────────────────────────────────────────────────────
  const handleKeyPress = useCallback((key: string) => {
    if (gameStatus !== 'playing' || isInitializing || isErrorShake || introStage !== 'done') return;

    const targetWord = dailyWords[currentIndex]?.target || '';
    const wordLength = targetWord.length;
    const numReveals = Object.keys(wordRevealedPositions).length;
    const typableSlots = wordLength - numReveals;

    if (key === 'ENTER') {
      if (currentGuess.length !== typableSlots) {
        setIsErrorShake(true);
        setTimeout(() => setIsErrorShake(false), 400);
        return;
      }
      // Build full guess by merging typed input with revealed positions
      const full: string[] = [];
      let typedIdx = 0;
      for (let i = 0; i < wordLength; i++) {
        if (wordRevealedPositions[i]) {
          full.push(wordRevealedPositions[i]);
        } else {
          full.push(currentGuess[typedIdx] || '');
          typedIdx++;
        }
      }
      const fullGuess = full.join('');

      if (fullGuess === targetWord) {
        setGameStatus('won');
        const newScore = wordsWon + 1;
        setWordsWon(newScore);
        saveState(currentIndex, triesLeft, currentGuess, newScore);
        applySessionMomentum(newScore, sessionLettersRevealed);
        triggerWinAnimation(MAX_TRIES - triesLeft + 1);
      } else {
        const newTries = triesLeft - 1;
        setTriesLeft(newTries);
        setIsErrorShake(true);
        saveState(currentIndex, newTries, currentGuess, wordsWon);
    setTimeout(() => {
          setIsErrorShake(false);
          if (newTries <= 0) {
            totalAttemptsRef.current += MAX_TRIES;
            allBonusEligibleRef.current = false;
            setGameStatus('lost');
            saveState(currentIndex, newTries, currentGuess, wordsWon, 'lost');
          } else {
            setCurrentGuess("");
          }
        }, 600);
      }
    } else if (key === '⌫' || key === 'BACKSPACE') {
      const g = currentGuess.slice(0, -1);
      setCurrentGuess(g);
      saveState(currentIndex, triesLeft, g, wordsWon);
    } else if (currentGuess.length < typableSlots && /^[A-Z]$/.test(key)) {
      const g = currentGuess + key;
      setCurrentGuess(g);
      saveState(currentIndex, triesLeft, g, wordsWon);
    }
  }, [currentGuess, gameStatus, triesLeft, currentIndex, dailyWords, wordsWon, isInitializing, isErrorShake, introStage, saveState, wordRevealedPositions, sessionLettersRevealed, applySessionMomentum]);

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
    setWordRevealedPositions({});
    setSessionLettersRevealed(0);
    totalAttemptsRef.current = 0;
    allBonusEligibleRef.current = true;
    sessionAwardedRef.current = 0;
    try {
      const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:4000';
      const res = await callBackend(
        `${backendUrl}/api/student/lexigrid-words?difficulty=${encodeURIComponent(difficulty)}`
      );
      let words: WordItem[];
      if (res.success && Array.isArray(res.data) && res.data.length > 0) {
        words = (res.data as any[]).map((w: any) => ({
          id:          w.id,
          base:        w.base_word.toUpperCase(),
          target:      w.target_word.toUpperCase(),
          hint:        w.hint,
          target_band: w.target_band != null ? parseFloat(String(w.target_band)) : null,
        }));
        sessionTokenRef.current = res.session_token ?? '';
      } else {
        words = fisherYatesShuffle([...FALLBACK_WORD_BANK]).slice(0, DAILY_LIMIT);
        sessionTokenRef.current = '';
      }
      setDailyWords(words);
    } catch {
      sessionTokenRef.current = '';
      setDailyWords(fisherYatesShuffle([...FALLBACK_WORD_BANK]).slice(0, DAILY_LIMIT));
    } finally {
      setIsInitializing(false);
    }
  }, [difficulty]);

  // --- Partial letter reveal ---
  // Reveals cost momentum in every mode, including practice — only WINS are free
  // in practice mode. Practice-mode reveals aren't tied to any word/session earnings
  // (practice never earns anything to net a reveal cost against), so they're charged
  // as a direct spend instead of going through the earnings-based reconciliation.
  const handleReveal = useCallback((position: number) => {
    const targetWord = dailyWords[currentIndex]?.target || '';
    if (!targetWord[position]) return;
    if (isPracticeMode && localMomentum < REVEAL_COST) return; // can't afford it — guarded below via disabled too
    const newReveals = { ...wordRevealedPositions, [position]: targetWord[position] };
    const newSessionReveals = sessionLettersRevealed + 1;
    setWordRevealedPositions(newReveals);
    setSessionLettersRevealed(newSessionReveals);
    setCurrentGuess('');
    saveState(currentIndex, triesLeft, '', wordsWon, gameStatus, newReveals, newSessionReveals);
    if (isPracticeMode) {
      addPoints(-REVEAL_COST);
    } else {
      applySessionMomentum(wordsWon, newSessionReveals);
    }
  }, [currentIndex, dailyWords, wordRevealedPositions, sessionLettersRevealed, isPracticeMode, triesLeft, wordsWon, gameStatus, saveState, applySessionMomentum, localMomentum, addPoints]);

  // --- Backend sync on session complete ---
  const submitLexiGridSession = useCallback(async (finalWordsWon: number) => {
    const attemptsUsed = totalAttemptsRef.current;
    const bonusEligible = allBonusEligibleRef.current && finalWordsWon >= DAILY_LIMIT;
    const playedIds = dailyWords.map(w => w.id).filter(Boolean) as string[];
    const payload = {
      game_type:         'LEXIGRID',
      words_solved:      finalWordsWon,
      total_attempts:    attemptsUsed,
      bonus_eligible:    bonusEligible,
      letters_revealed:  sessionLettersRevealed,
      session_token:     sessionTokenRef.current,
      played_word_ids:   playedIds.length > 0 ? playedIds : undefined,
    };
    try {
      const backendUrl = import.meta.env.VITE_BACKEND_URL || "http://localhost:4000";
      const res = await callBackend(`${backendUrl}/api/student/game-score`, {
        method: 'POST',
        body: JSON.stringify(payload),
      });

      // Only sync momentum from server in GATE MODE.
      if (isGateMode && res.momentum_score !== undefined) {
        syncMomentum(res.momentum_score);
      }
      localStorage.removeItem('lexigrid_pending_submit');
    } catch (err) {
      console.error('[LexiGrid] Failed to submit session:', err);
      // Persist payload so the next page load can retry before the student notices
      localStorage.setItem('lexigrid_pending_submit', JSON.stringify({ ...payload, date: todayIST() }));
      setSubmitError(true);
    }
  }, [syncMomentum]);

  // --- Skip Gate (gate mode only) ---
  // Spend SKIP_GATE_COST momentum to bypass the gated LexiGrid and proceed to Drill 2.
  // This is NOT a win: it deducts momentum client-side, tells the backend the gate was
  // unlocked by spending (status: 'skipped') rather than solved, and never calls
  // submitLexiGridSession. Finally it routes to the dashboard with the same
  // completion flag the normal finish path uses, so Drill 2 unlocks.
  const handleSkipGate = useCallback(async () => {
    if (!isGateMode || isSkipping) return;
    if (localMomentum < SKIP_GATE_COST) return; // guard against stale UI / races

    setIsSkipping(true);

    // Deduct the premium currency immediately so the topbar reflects the spend.
    addPoints(-SKIP_GATE_COST);

    const payload = {
      game_type:      'LEXIGRID',
      status:         'skipped',
      momentum_spent: SKIP_GATE_COST,
      session_token:  sessionTokenRef.current,
    };
    try {
      const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:4000';
      const res = await callBackend(`${backendUrl}/api/student/game-score`, {
        method: 'POST',
        body: JSON.stringify(payload),
      });
      // Server is authoritative on the resulting balance — reconcile if it reports one.
      if (res.momentum_score !== undefined) syncMomentum(res.momentum_score);
    } catch (err) {
      console.error('[LexiGrid] Skip-gate sync failed:', err);
      // Non-blocking: the student already paid client-side and the gate is unlocked
      // for this session. The next backend round-trip will reconcile the balance.
    }

    // Clear the in-progress save so reopening doesn't resume the skipped session.
    localStorage.removeItem('lexigrid_state');

    navigate('/student/dashboard', { state: { lexigridCompleted: true } });
  }, [isGateMode, isSkipping, localMomentum, addPoints, syncMomentum, navigate]);

  // --- Animations & Progression ---
  // Actual momentum awarding happens in applySessionMomentum (called at the point of
  // each win/reveal, using the session-wide formula). This function only tracks
  // attempt/bonus-eligibility bookkeeping and the purely visual flying-score flourish.
  const triggerWinAnimation = (attemptsForThisWord: number) => {
    totalAttemptsRef.current += attemptsForThisWord;
    if (attemptsForThisWord > 2) allBonusEligibleRef.current = false;
    if (Object.keys(wordRevealedPositions).length > 0) allBonusEligibleRef.current = false;

    if (isPracticeMode) return;

    setFlyingScore(true);
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
      setWordRevealedPositions({});
    }
    saveState(nextIndex, MAX_TRIES, '', wordsWon, 'playing', {});
  };

  // ── Play Again (standalone only) ─────────────────────────────────────────────
  const handlePlayAgain = async () => {
    localStorage.removeItem('lexigrid_state');
    setShowHint(false);
    setWordRevealedPositions({});
    setSessionLettersRevealed(0);
    await loadFreshWords();
  };

  // ─────────────────────────────────────────────────────────────────────────────

  if (isInitializing) {
    return (
      <div className="min-h-screen bg-[#07070a] flex items-center justify-center font-sans text-white">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-10 h-10 text-brand-teal-500 animate-spin" />
          <p className="text-slate-400 font-bold tracking-widest uppercase text-sm">Loading Today's Challenge...</p>
        </div>
      </div>
    );
  }

  const currentWordObj = dailyWords[currentIndex];
  const targetWord     = currentWordObj?.target || '';
  const wordLength     = targetWord.length;

  // Merge typed input with revealed positions for display
  const displayLetters: string[] = new Array(wordLength).fill('');
  {
    let typedIdx = 0;
    for (let i = 0; i < wordLength; i++) {
      if (wordRevealedPositions[i]) {
        displayLetters[i] = wordRevealedPositions[i];
      } else if (typedIdx < currentGuess.length) {
        displayLetters[i] = currentGuess[typedIdx];
        typedIdx++;
      }
    }
  }

  const numWordReveals = Object.keys(wordRevealedPositions).length;
  const maxRevealsForWord = Math.min(2, Math.floor(wordLength / 2));
  const canReveal1 = triesLeft <= 2 && !wordRevealedPositions[0] && numWordReveals < maxRevealsForWord && gameStatus === 'playing';
  const canReveal2 = triesLeft <= 1 && !wordRevealedPositions[wordLength - 1] && numWordReveals < maxRevealsForWord && gameStatus === 'playing';

  // Skip-gate visibility + affordability — only meaningful while the gate is active.
  const canAffordSkip = localMomentum >= SKIP_GATE_COST;
  const showSkipGate  = isGateMode && gameStatus !== 'completed_day';

  return (
    <div className="min-h-screen bg-[#07070a] bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-brand-teal-950/20 via-[#07070a] to-[#07070a] font-sans text-white flex flex-col selection:bg-brand-teal-500/30 overflow-x-hidden relative">

      {/* ── INTRO OVERLAY ── */}
      {introStage !== 'done' && (
        <div className={`fixed inset-0 z-[100] bg-[#07070a] flex items-center justify-center overflow-hidden transition-opacity duration-500 ${introStage === 'fading' ? 'opacity-0' : 'opacity-100'}`}>
          <div className="absolute inset-0 pointer-events-none">
            {introWordConfigs.map((config, i) => (
              <div key={i}
                className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-brand-teal-400/20 font-black text-xl md:text-3xl uppercase whitespace-nowrap mix-blend-screen"
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
          <h1 className="relative z-10 text-5xl md:text-7xl font-black text-transparent bg-clip-text bg-gradient-to-r from-brand-teal-400 to-brand-blue-400 tracking-[0.2em] uppercase drop-shadow-[0_0_40px_rgba(129,140,248,0.6)] animate-[logoPop_1s_ease-out_1s_both]">
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
        <button onClick={() => navigate('/student/dashboard')} className="flex items-center justify-center w-10 h-10 rounded-2xl bg-slate-900/60 border border-white/10 hover:bg-white/10 hover:border-white/20 transition-all active:scale-95">
          <ArrowLeft className="w-5 h-5 text-slate-300" />
        </button>
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Skip Gate — gate mode only. Spends premium momentum to bypass the gate. */}
          {showSkipGate && (
            <button
              onClick={handleSkipGate}
              disabled={!canAffordSkip || isSkipping}
              title={canAffordSkip ? `Spend ${SKIP_GATE_COST} momentum to skip to Drill 2` : 'Not enough momentum'}
              className={`group flex items-center gap-2 px-3.5 py-2 rounded-2xl text-xs font-black uppercase tracking-widest border-2 transition-all
                ${canAffordSkip
                  ? 'bg-gradient-to-br from-amber-500/15 to-amber-600/5 text-amber-300 border-amber-500/40 hover:border-amber-400/70 hover:shadow-[0_0_20px_rgba(251,191,36,0.25)] active:scale-95'
                  : 'bg-slate-800/40 text-slate-500 border-white/5 opacity-50 cursor-not-allowed'}`}
            >
              {isSkipping ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : canAffordSkip ? (
                <Zap className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
              ) : (
                <ShieldAlert className="w-3.5 h-3.5" />
              )}
              <span className="hidden sm:inline">
                {canAffordSkip ? 'Skip Gate' : 'Not enough momentum'}
              </span>
              <span className="sm:hidden">Skip</span>
              {canAffordSkip && (
                <span className="flex items-center gap-0.5 text-amber-400/80">
                  · {SKIP_GATE_COST}
                  <Zap className="w-3 h-3 fill-amber-400 text-amber-400" />
                </span>
              )}
            </button>
          )}
          <span className={`flex items-center gap-1.5 text-[10px] font-black px-3 py-1.5 rounded-2xl uppercase tracking-widest border ${
            isGateMode
              ? 'bg-teal-500/20 text-teal-300 border-teal-500/30'
              : 'bg-brand-teal-500/20 text-brand-teal-300 border-brand-teal-500/30'
          }`}>
            {isGateMode ? <ShieldAlert className="w-3 h-3" /> : <Sparkles className="w-3 h-3" />}
            {isGateMode ? 'Gate Mode' : 'Practice Mode'}
          </span>
          <div className="flex items-center gap-2 bg-gradient-to-br from-brand-teal-500/15 to-brand-teal-600/5 border border-brand-teal-500/30 px-4 py-2 rounded-2xl shadow-[0_0_20px_rgba(20,184,166,0.15)]">
            <Zap className="w-4 h-4 text-amber-400 fill-amber-400 drop-shadow-[0_0_6px_rgba(251,191,36,0.6)]" />
            <span className="font-black text-brand-teal-50 text-lg tabular-nums">{localMomentum}</span>
          </div>
        </div>
      </header>

      {/* ── Flying Score ── */}
      {flyingScore && (
        <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 animate-[flyToTopRight_0.8s_ease-in-out_forwards]">
          <div className="text-4xl font-black text-amber-400 drop-shadow-[0_0_20px_rgba(251,191,36,0.8)]">+{Math.max(0, POINTS_PER_WORD - Object.keys(wordRevealedPositions).length * REVEAL_COST)}</div>
        </div>
      )}

      <main className="flex-1 flex flex-col xl:flex-row items-center xl:items-stretch justify-center max-w-7xl mx-auto w-full px-4 sm:px-6 gap-8 xl:gap-16 pb-12">
        <div className="flex-1 flex flex-col items-center w-full max-w-3xl relative z-10">
          
        {gameStatus === 'completed_day' && (
            <div className="relative w-full max-w-lg bg-gradient-to-b from-slate-900/70 to-slate-950/80 backdrop-blur-xl border border-white/10 rounded-[32px] p-8 sm:p-10 flex flex-col items-center text-center shadow-2xl animate-in zoom-in-95 duration-500 mt-10 overflow-hidden">
              <div className="pointer-events-none absolute inset-0 opacity-[0.05]" style={{ backgroundImage: 'radial-gradient(circle, white 1px, transparent 1.4px)', backgroundSize: '22px 22px' }} />

              {isPracticeMode ? (
                /* ── Practice Round Complete ── */
                <>
                  <div className="relative w-20 h-20 bg-brand-teal-500/20 rounded-full flex items-center justify-center mb-6 ring-8 ring-brand-teal-500/10">
                    <div className="absolute inset-0 rounded-full bg-brand-teal-400/20 animate-ping" />
                    <Award className="relative w-10 h-10 text-brand-teal-400" />
                  </div>
                  <h2 className="relative text-3xl font-black mb-2 text-white">Practice Round Complete</h2>
                  <p className="relative text-slate-400 mb-8 font-medium">
                    Your daily momentum was already earned — this was a practice session.
                  </p>
                  <div className="relative w-full grid grid-cols-2 gap-3 mb-8">
                    <div className="bg-slate-950/50 rounded-2xl p-5 border border-white/5 flex flex-col items-center">
                      <Target className="w-4 h-4 text-slate-500 mb-1.5" />
                      <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">Score</p>
                      <p className="text-3xl font-black text-white">{wordsWon} <span className="text-lg text-slate-600">/ {DAILY_LIMIT}</span></p>
                    </div>
                    <div className="bg-slate-950/50 rounded-2xl p-5 border border-white/5 flex flex-col items-center">
                      <Sparkles className="w-4 h-4 text-brand-teal-400 mb-1.5" />
                      <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">Mode</p>
                      <p className="text-lg font-black text-brand-teal-400">Practice</p>
                    </div>
                  </div>
                  <button
                    onClick={loadFreshWords}
                    disabled={isInitializing}
                    className="relative w-full bg-brand-teal-600 hover:bg-brand-teal-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold text-lg py-4 rounded-2xl transition-all shadow-lg hover:shadow-brand-teal-500/25 active:scale-[0.98] mb-3"
                  >
                    Play Another Round
                  </button>
                  <button
                    onClick={() => navigate('/student/dashboard')}
                    className="relative w-full bg-white/5 hover:bg-white/10 text-slate-400 font-bold text-base py-3 rounded-2xl transition-all"
                  >
                    Return to Dashboard
                  </button>
                </>
              ) : (
                /* ── Daily Challenge Complete (first round — momentum earned) ── */
                <>
                  <div className="relative w-20 h-20 bg-amber-500/20 rounded-full flex items-center justify-center mb-6 ring-8 ring-amber-500/10">
                    <div className="absolute inset-0 rounded-full bg-amber-400/20 animate-ping" />
                    <Trophy className="relative w-10 h-10 text-amber-400" />
                  </div>
                  <h2 className="relative text-3xl font-black mb-2 text-white">Daily Challenge Complete</h2>
                  <p className="relative text-slate-400 mb-10 font-medium">Here is your vocabulary wrap-up for today.</p>
                  <div className="relative w-full grid grid-cols-2 gap-3 mb-8">
                    <div className="bg-slate-950/50 rounded-2xl p-5 border border-white/5 flex flex-col items-center">
                      <Target className="w-4 h-4 text-slate-500 mb-1.5" />
                      <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">Score</p>
                      <p className="text-3xl font-black text-white">{wordsWon} <span className="text-lg text-slate-600">/ {DAILY_LIMIT}</span></p>
                    </div>
                    <div className="bg-slate-950/50 rounded-2xl p-5 border border-white/5 flex flex-col items-center">
                      <Zap className="w-4 h-4 text-amber-400 fill-amber-400 mb-1.5" />
                      <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">Momentum</p>
                      <p className="text-3xl font-black text-amber-400">+{wordsWon * POINTS_PER_WORD}</p>
                    </div>
                  </div>
                  {submitError && (
                    <div className="relative w-full mb-4 bg-rose-500/10 border border-rose-500/30 rounded-2xl px-4 py-3 text-rose-400 text-xs font-bold text-center">
                      Score couldn't be saved — check your connection. It will sync automatically next time you open the app.
                    </div>
                  )}
                  <button
                    onClick={() => navigate('/student/dashboard', { state: { lexigridCompleted: true } })}
                    className="relative w-full bg-brand-teal-600 hover:bg-brand-teal-500 text-white font-bold text-lg py-4 rounded-2xl transition-all shadow-lg hover:shadow-brand-teal-500/25 active:scale-[0.98] mb-3"
                  >
                    Return to Dashboard
                  </button>
                  <button
                    onClick={() => { setIsPracticeMode(true); loadFreshWords(); }}
                    className="relative w-full bg-white/5 hover:bg-white/10 text-slate-400 font-bold text-base py-3 rounded-2xl transition-all"
                  >
                    Keep Practising →
                  </button>
                </>
              )}
            </div>
          )}
          {/* ── ACTIVE GAME ── */}
          {gameStatus !== 'completed_day' && (
            <div className="relative w-full rounded-[36px] sm:rounded-[40px] border border-white/10 bg-gradient-to-b from-slate-900/60 via-slate-950/60 to-slate-950/80 backdrop-blur-xl shadow-[0_0_80px_-20px_rgba(20,184,166,0.15)] px-4 sm:px-8 py-8 sm:py-10 mt-2 xl:mt-4 overflow-hidden">
              {/* decorative dot grid + corner glows */}
              <div className="pointer-events-none absolute inset-0 opacity-[0.05]" style={{ backgroundImage: 'radial-gradient(circle, white 1px, transparent 1.4px)', backgroundSize: '26px 26px' }} />
              <div className="pointer-events-none absolute -top-24 -left-24 w-64 h-64 bg-brand-teal-500/10 rounded-full blur-3xl" />
              <div className="pointer-events-none absolute -bottom-24 -right-24 w-64 h-64 bg-brand-blue-500/10 rounded-full blur-3xl" />

              <div className="relative z-10">
                {/* Skip Gate — normal-flow row, right-aligned, above the word HUD so it never overlaps the attempts badge at any breakpoint */}
                {showSkipGate && gameStatus === 'playing' && (
                  <div className="flex justify-end mb-5 sm:mb-6">
                    <div className="flex flex-col items-end gap-1.5 max-w-[220px] sm:max-w-xs">
                      <button
                        onClick={handleSkipGate}
                        disabled={!canAffordSkip || isSkipping}
                        className={`flex items-center gap-1.5 pl-3 pr-3.5 py-2 rounded-full text-[10px] sm:text-xs font-black uppercase tracking-widest border-2 transition-all
                          ${canAffordSkip
                            ? 'bg-gradient-to-br from-amber-500/20 to-amber-600/10 text-amber-300 border-amber-400/50 hover:border-amber-300/80 hover:shadow-[0_0_20px_rgba(251,191,36,0.3)] active:scale-95'
                            : 'bg-slate-900/60 text-slate-500 border-white/10 opacity-60 cursor-not-allowed'}`}
                      >
                        {isSkipping ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : canAffordSkip ? (
                          <Zap className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                        ) : (
                          <ShieldAlert className="w-3.5 h-3.5" />
                        )}
                        <span>{isSkipping ? 'Skipping…' : `Skip Gate · ${SKIP_GATE_COST}`}</span>
                      </button>
                      <p className="hidden sm:block text-[10px] text-slate-500 font-medium text-right leading-snug">
                        {canAffordSkip
                          ? `Spend ${SKIP_GATE_COST} momentum to unlock Drill 2 without solving today's words.`
                          : `You need ${SKIP_GATE_COST - localMomentum} more momentum to skip — or just solve the words.`}
                      </p>
                    </div>
                  </div>
                )}

                <div className="text-center w-full">
                  {/* Word progress track */}
                  <div className="flex items-center justify-center gap-1.5 sm:gap-2 mb-5">
                    {Array.from({ length: DAILY_LIMIT }).map((_, i) => (
                      <div key={i} className={`h-1.5 sm:h-2 rounded-full transition-all duration-500 ${
                        i < currentIndex ? 'w-6 sm:w-8 bg-emerald-400 shadow-[0_0_10px_rgba(52,211,153,0.5)]' :
                        i === currentIndex ? 'w-10 sm:w-12 bg-gradient-to-r from-brand-teal-400 to-brand-blue-400 shadow-[0_0_12px_rgba(45,212,191,0.5)]' :
                        'w-6 sm:w-8 bg-slate-700/60'
                      }`} />
                    ))}
                  </div>

                  <div className="flex items-center justify-between mb-8 px-2 max-w-lg mx-auto">
                    <span className="flex items-center gap-1.5 text-[10px] sm:text-xs font-black uppercase tracking-widest text-brand-teal-300 bg-brand-teal-500/10 px-3 py-1.5 rounded-full border border-brand-teal-500/20">
                      <Target className="w-3 h-3" />
                      Word {currentIndex + 1} of {DAILY_LIMIT}
                    </span>
                    <div className="flex items-center gap-2 bg-slate-800/50 px-3 py-1.5 rounded-full border border-white/5">
                      <div className="flex items-center gap-1">
                        {Array.from({ length: MAX_TRIES }).map((_, i) => (
                          <Heart key={i} className={`w-3.5 h-3.5 transition-all duration-300 ${i < triesLeft ? 'fill-rose-500 text-rose-500 drop-shadow-[0_0_5px_rgba(244,63,94,0.6)]' : 'fill-slate-800 text-slate-700'}`} />
                        ))}
                      </div>
                      <span className="text-[10px] sm:text-xs font-bold text-slate-400 uppercase tracking-wider">{Math.max(0, triesLeft)} attempts left</span>
                    </div>
                  </div>

                  <p className="text-slate-400 font-medium mb-2 text-sm sm:text-base">Find the Band {currentWordObj.target_band ?? 7.0} synonym for:</p>
                  <p className="text-3xl sm:text-5xl font-black text-white uppercase tracking-widest mb-6 drop-shadow-lg break-words">
                    {currentWordObj?.base}
                  </p>

                  <button
                    onClick={() => setShowHint(true)}
                    className={`inline-flex items-center gap-2 text-sm font-bold transition-all ${showHint ? 'text-amber-400' : 'text-brand-teal-400 hover:text-brand-teal-300 bg-brand-teal-500/10 px-4 py-2 rounded-full border border-brand-teal-500/20'}`}
                  >
                    <Lightbulb className="w-4 h-4 shrink-0" />
                    <span>{showHint ? currentWordObj?.hint : 'Reveal Context Hint'}</span>
                  </button>
                </div>

                {/* Vault Lock Grid */}
                <div className="w-full flex justify-center mt-12 mb-10 px-2 sm:px-4">
                  <div className={`flex w-full max-w-3xl justify-center gap-1.5 sm:gap-2.5 ${isErrorShake ? 'animate-[shake_0.4s_ease-in-out]' : ''}`}>
                    {Array.from({ length: wordLength }).map((_, colIndex) => {
                      const isRevealed = !!wordRevealedPositions[colIndex];
                      const letter = displayLetters[colIndex] || '';
                      let bgColor  = 'bg-slate-900/80 border-slate-700/50 shadow-inner';
                      if (isRevealed)               bgColor = 'bg-gradient-to-b from-amber-500/25 to-amber-600/10 border-amber-400/70 shadow-[0_0_16px_rgba(251,191,36,0.25)]';
                      else if (isErrorShake)         bgColor = 'bg-rose-500/20 border-rose-500 shadow-[0_0_20px_rgba(244,63,94,0.3)]';
                      else if (gameStatus === 'won') bgColor = 'bg-gradient-to-b from-emerald-500/25 to-emerald-600/10 border-emerald-400 shadow-[0_0_20px_rgba(52,211,153,0.3)]';
                      else if (letter)               bgColor = 'bg-gradient-to-b from-brand-teal-500/25 to-brand-teal-600/10 border-brand-teal-400 shadow-[0_0_15px_rgba(129,140,248,0.2)] -translate-y-0.5';
                      return (
                        <div key={colIndex} className={`relative flex-1 max-w-[4rem] aspect-[4/5] flex items-center justify-center text-2xl sm:text-4xl font-black uppercase border-2 rounded-xl sm:rounded-2xl transition-all duration-200 ${bgColor} ${isRevealed ? 'text-amber-400' : 'text-white'}`}>
                          {isRevealed && (
                            <KeyRound className="absolute top-1 right-1 w-2.5 h-2.5 text-amber-400/70" />
                          )}
                          {letter}
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Reveal buttons — unlocked progressively after failed attempts. Cost applies
                    in every mode, including practice — only solving a word stays free there. */}
                {gameStatus === 'playing' && (canReveal1 || canReveal2) && (
                  <div className="w-full max-w-lg mx-auto mb-8 flex justify-center gap-3 px-2">
                    {canReveal1 && (
                      <button
                        onClick={() => handleReveal(0)}
                        disabled={isErrorShake || (isPracticeMode && localMomentum < REVEAL_COST)}
                        title={isPracticeMode && localMomentum < REVEAL_COST ? 'Not enough momentum' : undefined}
                        className={`group relative flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider border-2 transition-all
                          ${isPracticeMode && localMomentum < REVEAL_COST
                            ? 'bg-slate-900/40 text-slate-500 border-white/5 opacity-50 cursor-not-allowed'
                            : 'bg-gradient-to-br from-amber-500/15 to-amber-600/5 text-amber-300 border-amber-500/30 hover:border-amber-400/60 hover:shadow-[0_0_18px_rgba(251,191,36,0.2)] active:scale-[0.97]'}`}
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>First Letter</span>
                        <span className="text-amber-400/70">· −{REVEAL_COST} pts</span>
                      </button>
                    )}
                    {canReveal2 && (
                      <button
                        onClick={() => handleReveal(wordLength - 1)}
                        disabled={isErrorShake || (isPracticeMode && localMomentum < REVEAL_COST)}
                        title={isPracticeMode && localMomentum < REVEAL_COST ? 'Not enough momentum' : undefined}
                        className={`group relative flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider border-2 transition-all
                          ${isPracticeMode && localMomentum < REVEAL_COST
                            ? 'bg-slate-900/40 text-slate-500 border-white/5 opacity-50 cursor-not-allowed'
                            : 'bg-gradient-to-br from-amber-500/15 to-amber-600/5 text-amber-300 border-amber-500/30 hover:border-amber-400/60 hover:shadow-[0_0_18px_rgba(251,191,36,0.2)] active:scale-[0.97]'}`}
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>Last Letter</span>
                        <span className="text-amber-400/70">· −{REVEAL_COST} pts</span>
                      </button>
                    )}
                  </div>
                )}

                {/* Word result overlay */}
                {(gameStatus === 'won' || gameStatus === 'lost') ? (
                  <div className="relative w-full max-w-lg mx-auto bg-slate-900/90 backdrop-blur-xl border border-white/10 rounded-[32px] p-6 sm:p-8 text-center animate-in slide-in-from-bottom-8 duration-500 shadow-2xl">
                    {gameStatus === 'won' ? (
                      <div className="flex flex-col items-center">
                        <div className="relative bg-emerald-500/20 text-emerald-400 p-3 rounded-full mb-3">
                          <div className="absolute inset-0 rounded-full bg-emerald-400/20 animate-ping" />
                          <CheckCircle2 className="relative w-8 h-8" />
                        </div>
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
                      <p className="text-[10px] font-bold text-brand-teal-400 uppercase tracking-widest mb-2">Definition</p>
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
                  <div className="w-full max-w-2xl mx-auto flex flex-col gap-2 sm:gap-2.5 px-2">
                    {KEYBOARD_ROWS.map((row, i) => (
                      <div key={i} className="flex justify-center gap-1.5 sm:gap-2 w-full">
                        {row.map(key => {
                          const isSpecial = key === 'ENTER' || key === '⌫';
                          return (
                            <button
                              key={key}
                              onClick={() => handleKeyPress(key)}
                              disabled={isErrorShake}
                              className={`h-12 sm:h-14 rounded-xl font-bold text-xs sm:text-base flex items-center justify-center transition-all active:scale-95 border shadow-sm
                                ${isSpecial
                                  ? key === 'ENTER'
                                    ? 'px-3 sm:px-6 text-[10px] sm:text-xs tracking-wider bg-gradient-to-b from-brand-teal-500 to-brand-teal-600 hover:from-brand-teal-400 hover:to-brand-teal-500 text-white border-brand-teal-400/40 shadow-[0_2px_0_0_rgba(0,0,0,0.2)]'
                                    : 'px-3 sm:px-6 text-[10px] sm:text-xs tracking-wider bg-gradient-to-b from-slate-700 to-slate-800 hover:from-slate-600 hover:to-slate-700 text-slate-300 border-white/5'
                                  : 'flex-1 max-w-[40px] sm:max-w-[48px] bg-gradient-to-b from-slate-700/80 to-slate-800/80 hover:from-slate-600/80 hover:to-slate-700/80 text-white border-white/5'}
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
              </div>
            </div>
          )}
        </div>

        {/* ── How to Play ── */}
        {gameStatus !== 'completed_day' && (
          <div className="relative w-full xl:w-[340px] shrink-0 flex flex-col xl:h-full bg-gradient-to-b from-slate-900/50 to-slate-950/50 border border-white/10 rounded-[32px] p-6 sm:p-8 xl:mt-6 backdrop-blur-md mb-10 xl:mb-0 shadow-xl overflow-hidden">
            <div className="pointer-events-none absolute inset-0 opacity-[0.04]" style={{ backgroundImage: 'radial-gradient(circle, white 1px, transparent 1.4px)', backgroundSize: '24px 24px' }} />
            <div className="relative flex items-center gap-3 mb-6 border-b border-white/10 pb-4">
              <div className="bg-brand-teal-500/20 p-2 rounded-xl text-brand-teal-400"><Info className="w-5 h-5" /></div>
              <h3 className="text-lg font-black text-white uppercase tracking-widest">How to Play</h3>
            </div>
            <div className="relative space-y-6">
              <div className="flex gap-4 items-start">
                <div className="w-7 h-7 rounded-full bg-gradient-to-br from-slate-700 to-slate-800 border border-white/10 flex items-center justify-center text-brand-teal-300 shrink-0 mt-0.5"><Target className="w-3.5 h-3.5" /></div>
                <p className="text-sm text-slate-300 leading-relaxed font-medium">Read the basic word and guess its <strong className="text-brand-teal-300">Synonym</strong>.</p>
              </div>
              <div className="flex gap-4 items-start">
                <div className="w-7 h-7 rounded-full bg-gradient-to-br from-slate-700 to-slate-800 border border-white/10 flex items-center justify-center text-amber-300 shrink-0 mt-0.5"><KeyRound className="w-3.5 h-3.5" /></div>
                <p className="text-sm text-slate-300 leading-relaxed font-medium">Type the word into the lock. You have exactly <strong className="text-amber-400">3 attempts</strong> to crack it.</p>
              </div>
              <div className="flex gap-4 items-start">
                <div className="w-7 h-7 rounded-full bg-gradient-to-br from-slate-700 to-slate-800 border border-white/10 flex items-center justify-center text-rose-300 shrink-0 mt-0.5"><ShieldAlert className="w-3.5 h-3.5" /></div>
                <div className="flex flex-col gap-3 w-full">
                  <p className="text-sm text-slate-300 leading-relaxed font-medium">If you guess incorrectly, the lock flashes red and clears your attempt.</p>
                  <div className="flex gap-1.5 opacity-80">
                    {['W','R','O','N','G'].map(l => (
                      <div key={l} className="flex-1 aspect-[4/5] bg-rose-500/20 text-rose-500 flex items-center justify-center font-black rounded-lg border border-rose-500">{l}</div>
                    ))}
                  </div>
                </div>
              </div>
              <div className="flex gap-4 items-start">
                <div className="w-7 h-7 rounded-full bg-gradient-to-br from-slate-700 to-slate-800 border border-white/10 flex items-center justify-center text-amber-300 shrink-0 mt-0.5"><Eye className="w-3.5 h-3.5" /></div>
                <p className="text-sm text-slate-300 leading-relaxed font-medium">Stuck? After a failed attempt, you can <strong className="text-amber-300">reveal a letter</strong> for {REVEAL_COST} pts each.</p>
              </div>
            </div>
            <div className="relative mt-6 xl:mt-auto pt-5 border-t border-white/10 space-y-2">
              <div className="flex items-center gap-2 bg-brand-teal-500/10 border border-brand-teal-500/20 rounded-xl px-3 py-2.5">
                <Zap className="w-3.5 h-3.5 text-amber-400 fill-amber-400 shrink-0" />
                <p className="text-xs text-slate-300 font-bold">Earn +{POINTS_PER_WORD} points per word!</p>
              </div>
              {!isGateMode && (
                <div className="flex items-center gap-2 bg-brand-teal-500/5 border border-brand-teal-500/10 rounded-xl px-3 py-2.5">
                  <Sparkles className="w-3.5 h-3.5 text-brand-teal-400 shrink-0" />
                  <p className="text-xs text-brand-teal-400/90 font-medium">Solve all 5 to stamp your Vocabulary passport slot</p>
                </div>
              )}
              {isGateMode && (
                <div className="flex items-center gap-2 bg-amber-500/5 border border-amber-500/10 rounded-xl px-3 py-2.5">
                  <ShieldAlert className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                  <p className="text-xs text-amber-400/90 font-medium">
                    In a hurry? Spend {SKIP_GATE_COST} momentum to skip straight to Drill 2.
                  </p>
                </div>
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