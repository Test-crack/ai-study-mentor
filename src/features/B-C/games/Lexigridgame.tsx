// FILE: src/features/b2c/games/LexiGridGame.tsx
import React, { useState, useEffect, useCallback } from 'react';
import { CheckCircle2, XCircle, Zap, RotateCcw, Trophy, ArrowRight } from 'lucide-react';
import B2CGameShell from '../components/B2cgameshell';

const ROUNDS = [
  { clue: 'To make something less severe or serious',                           answer: 'MITIGATE',    hint: 'M _ _ _ _ _ _ _' },
  { clue: 'Showing a great deal of variety; very different',                    answer: 'DIVERSE',     hint: 'D _ _ _ _ _ _' },
  { clue: 'To make a situation or problem worse',                               answer: 'EXACERBATE',  hint: 'E _ _ _ _ _ _ _ _ _' },
  { clue: 'Present everywhere at the same time',                                answer: 'UBIQUITOUS',  hint: 'U _ _ _ _ _ _ _ _ _' },
  { clue: 'Based on random choice rather than reason',                          answer: 'ARBITRARY',   hint: 'A _ _ _ _ _ _ _ _' },
  { clue: 'Able to recover quickly from difficulties',                          answer: 'RESILIENT',   hint: 'R _ _ _ _ _ _ _ _' },
  { clue: 'The process of becoming more alike or uniform',                      answer: 'CONVERGENCE', hint: 'C _ _ _ _ _ _ _ _ _ _' },
  { clue: 'Producing much fruit, vegetation or offspring; inventive',           answer: 'PROLIFIC',    hint: 'P _ _ _ _ _ _ _' },
];

function buildGrid(answer: string) {
  return answer.split('').map(() => '');
}

export default function LexiGridGame() {
  const [roundIdx,   setRoundIdx]   = useState(0);
  const [cells,      setCells]      = useState<string[]>(buildGrid(ROUNDS[0].answer));
  const [checked,    setChecked]    = useState(false);
  const [correct,    setCorrect]    = useState(false);
  const [score,      setScore]      = useState(0);
  const [done,       setDone]       = useState(false);
  const [activeCell, setActiveCell] = useState(0);

  const round = ROUNDS[roundIdx];

  useEffect(() => {
    setCells(buildGrid(round.answer));
    setChecked(false);
    setCorrect(false);
    setActiveCell(0);
  }, [roundIdx]);

  const handleKey = useCallback((e: KeyboardEvent) => {
    if (checked) return;
    const k = e.key.toUpperCase();
    if (/^[A-Z]$/.test(k)) {
      setCells(prev => {
        const next = [...prev];
        const idx  = next.findIndex((_, i) => i >= activeCell && next[i] === '');
        if (idx !== -1) { next[idx] = k; setActiveCell(idx + 1); }
        return next;
      });
    } else if (e.key === 'Backspace') {
      setCells(prev => {
        const next    = [...prev];
        const lastFilled = [...next].reverse().findIndex(c => c !== '');
        if (lastFilled !== -1) {
          const realIdx = next.length - 1 - lastFilled;
          next[realIdx] = '';
          setActiveCell(realIdx);
        }
        return next;
      });
    } else if (e.key === 'Enter') {
      handleCheck();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [checked, activeCell, cells]);

  useEffect(() => {
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [handleKey]);

  const handleCheck = () => {
    if (cells.some(c => c === '')) return;
    const attempt = cells.join('');
    const isRight = attempt === round.answer;
    setCorrect(isRight);
    setChecked(true);
    if (isRight) setScore(s => s + 2);
  };

  const handleNext = () => {
    if (roundIdx < ROUNDS.length - 1) {
      setRoundIdx(r => r + 1);
    } else {
      setDone(true);
      const prev = parseInt(sessionStorage.getItem('b2c_momentum') || '920', 10);
      sessionStorage.setItem('b2c_momentum', String(prev + score));
    }
  };

  const handleRestart = () => {
    setRoundIdx(0); setScore(0); setDone(false);
    setCells(buildGrid(ROUNDS[0].answer));
    setChecked(false); setCorrect(false); setActiveCell(0);
  };

  if (done) {
    return (
      <B2CGameShell title="LexiGrid" emoji="🔤">
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-10 text-center shadow-sm">
          <Trophy className="w-16 h-16 text-amber-500 mx-auto mb-4" />
          <h2 className="text-3xl font-black text-slate-800 dark:text-white mb-2">Session Complete!</h2>
          <p className="text-slate-500 mb-6">You scored <strong className="text-brand-teal-500">{score} / {ROUNDS.length * 2}</strong> points</p>
          <div className="flex items-center justify-center gap-2 bg-brand-teal-50 dark:bg-brand-teal-500/10 rounded-2xl px-6 py-3 mb-8 inline-flex mx-auto">
            <Zap className="w-5 h-5 text-brand-teal-500" />
            <span className="text-lg font-black text-brand-teal-600 dark:text-brand-teal-400">+{score} Momentum added</span>
          </div>
          <button onClick={handleRestart} className="flex items-center gap-2 bg-brand-teal-500 hover:bg-brand-teal-600 text-white font-bold px-8 py-3 rounded-xl mx-auto transition-all">
            <RotateCcw className="w-4 h-4" /> Play Again
          </button>
        </div>
      </B2CGameShell>
    );
  }

  return (
    <B2CGameShell title="LexiGrid" emoji="🔤">
      <div className="space-y-4">
        {/* Progress */}
        <div className="flex items-center justify-between text-sm">
          <span className="font-bold text-slate-500">Round {roundIdx + 1} of {ROUNDS.length}</span>
          <span className="font-black text-brand-teal-500 flex items-center gap-1"><Zap className="w-3.5 h-3.5" /> {score} pts</span>
        </div>
        <div className="h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
          <div className="h-full bg-brand-teal-500 rounded-full transition-all duration-500" style={{ width: `${((roundIdx) / ROUNDS.length) * 100}%` }} />
        </div>

        {/* Clue card */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-7 shadow-sm">
          <p className="text-xs font-black text-brand-teal-400 uppercase tracking-widest mb-3">Clue</p>
          <p className="text-xl font-bold text-slate-800 dark:text-white leading-relaxed mb-2">{round.clue}</p>
          <p className="text-sm text-slate-400 font-mono">{round.hint}</p>
        </div>

        {/* Letter grid */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-7 shadow-sm">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4 text-center">
            {checked ? '' : 'Type letters or click cells'}
          </p>
          <div className="flex flex-wrap gap-2 justify-center mb-6">
            {round.answer.split('').map((_, i) => {
              let bg = 'bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700';
              if (checked) {
                bg = correct
                  ? 'bg-emerald-100 dark:bg-emerald-500/20 border-emerald-400'
                  : cells[i] === round.answer[i]
                    ? 'bg-emerald-100 dark:bg-emerald-500/20 border-emerald-400'
                    : 'bg-rose-100 dark:bg-rose-500/20 border-rose-400';
              } else if (i === activeCell) {
                bg = 'bg-brand-teal-100 dark:bg-brand-teal-500/20 border-brand-teal-400 ring-2 ring-brand-teal-300';
              } else if (cells[i]) {
                bg = 'bg-brand-teal-50 dark:bg-brand-teal-500/10 border-brand-teal-300';
              }
              return (
                <div
                  key={i}
                  onClick={() => !checked && setActiveCell(i)}
                  className={`w-11 h-11 rounded-xl border-2 flex items-center justify-center text-lg font-black cursor-pointer transition-all ${bg}`}
                >
                  <span className={checked ? (cells[i] === round.answer[i] ? 'text-emerald-700 dark:text-emerald-300' : 'text-rose-700 dark:text-rose-300') : 'text-slate-800 dark:text-white'}>
                    {cells[i] || ''}
                  </span>
                </div>
              );
            })}
          </div>

          {/* On-screen keyboard */}
          {!checked && (
            <div className="space-y-2">
              {['QWERTYUIOP', 'ASDFGHJKL', 'ZXCVBNM'].map(row => (
                <div key={row} className="flex justify-center gap-1">
                  {row.split('').map(letter => (
                    <button
                      key={letter}
                      onClick={() => {
                        const e = new KeyboardEvent('keydown', { key: letter });
                        window.dispatchEvent(e);
                      }}
                      className="w-9 h-9 bg-slate-100 dark:bg-slate-800 hover:bg-brand-teal-100 dark:hover:bg-brand-teal-500/20 rounded-lg text-xs font-bold text-slate-700 dark:text-slate-300 transition-colors"
                    >
                      {letter}
                    </button>
                  ))}
                  {row === 'ZXCVBNM' && (
                    <button
                      onClick={() => window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Backspace' }))}
                      className="w-14 h-9 bg-slate-200 dark:bg-slate-700 hover:bg-rose-100 dark:hover:bg-rose-500/20 rounded-lg text-xs font-bold text-slate-700 dark:text-slate-300 transition-colors"
                    >
                      ⌫
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Feedback */}
          {checked && (
            <div className={`flex items-start gap-3 rounded-2xl p-4 ${correct ? 'bg-emerald-50 dark:bg-emerald-500/10' : 'bg-rose-50 dark:bg-rose-500/10'}`}>
              {correct
                ? <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
                : <XCircle     className="w-5 h-5 text-rose-500 shrink-0 mt-0.5" />}
              <div>
                <p className={`font-bold text-sm ${correct ? 'text-emerald-700 dark:text-emerald-300' : 'text-rose-700 dark:text-rose-300'}`}>
                  {correct ? `Correct! +2 pts` : `Answer: ${round.answer}`}
                </p>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-between items-center mt-4">
            {!checked ? (
              <button
                onClick={handleCheck}
                disabled={cells.some(c => c === '')}
                className="ml-auto bg-brand-teal-500 hover:bg-brand-teal-600 disabled:opacity-40 text-white font-bold px-6 py-2.5 rounded-xl transition-all text-sm"
              >
                Check Answer
              </button>
            ) : (
              <button
                onClick={handleNext}
                className="ml-auto bg-slate-800 dark:bg-white dark:text-slate-900 hover:bg-slate-900 text-white font-bold px-6 py-2.5 rounded-xl transition-all text-sm flex items-center gap-2"
              >
                {roundIdx < ROUNDS.length - 1 ? 'Next Word' : 'Finish'} <ArrowRight className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>
    </B2CGameShell>
  );
}