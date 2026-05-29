// FILE: src/features/b2c/games/BandLadderGame.tsx
import React, { useState, useEffect } from 'react';
import { CheckCircle2, XCircle, Zap, RotateCcw, Trophy, ArrowUp } from 'lucide-react';
import B2CGameShell from '../components/B2cgameshell';

const ROUNDS = [
  {
    base: 'good',
    rungs: [
      { options: ['effective', 'nice', 'cool'],         correct: 0, band: '6' },
      { options: ['substantial', 'effective', 'happy'],  correct: 0, band: '7' },
      { options: ['pivotal', 'substantial', 'strong'],   correct: 0, band: '8' },
    ],
  },
  {
    base: 'show',
    rungs: [
      { options: ['demonstrate', 'prove', 'tell'],              correct: 0, band: '6' },
      { options: ['illustrate', 'demonstrate', 'indicate'],     correct: 0, band: '7' },
      { options: ['exemplify', 'illustrate', 'exhibit'],        correct: 0, band: '8' },
    ],
  },
  {
    base: 'bad',
    rungs: [
      { options: ['harmful', 'wrong', 'terrible'],              correct: 0, band: '6' },
      { options: ['detrimental', 'harmful', 'adverse'],         correct: 0, band: '7' },
      { options: ['deleterious', 'detrimental', 'damaging'],    correct: 0, band: '8' },
    ],
  },
  {
    base: 'important',
    rungs: [
      { options: ['significant', 'big', 'major'],               correct: 0, band: '6' },
      { options: ['crucial', 'significant', 'vital'],           correct: 0, band: '7' },
      { options: ['paramount', 'crucial', 'imperative'],        correct: 0, band: '8' },
    ],
  },
  {
    base: 'change',
    rungs: [
      { options: ['alter', 'shift', 'adjust'],                  correct: 0, band: '6' },
      { options: ['transform', 'alter', 'modify'],              correct: 0, band: '7' },
      { options: ['revolutionise', 'transform', 'redefine'],    correct: 0, band: '8' },
    ],
  },
];

export default function BandLadderGame() {
  const [roundIdx,  setRoundIdx]  = useState(0);
  const [rungIdx,   setRungIdx]   = useState(0);
  const [climbed,   setClimbed]   = useState(0); // correct rungs this round
  const [checked,   setChecked]   = useState(false);
  const [selected,  setSelected]  = useState<number | null>(null);
  const [score,     setScore]     = useState(0);
  const [done,      setDone]      = useState(false);
  const [fell,      setFell]      = useState(false);

  const round = ROUNDS[roundIdx];
  const rung  = round.rungs[rungIdx];

  const handleSelect = (i: number) => {
    if (checked) return;
    setSelected(i);
    setChecked(true);
    if (i === rung.correct) {
      setClimbed(c => c + 1);
      setScore(s => s + 2);
    } else {
      setFell(true);
    }
  };

  const handleNext = () => {
    if (fell) {
      // Go back to rung 0 same round
      setRungIdx(0); setClimbed(0); setChecked(false); setSelected(null); setFell(false);
      return;
    }
    if (rungIdx < round.rungs.length - 1) {
      setRungIdx(r => r + 1); setChecked(false); setSelected(null);
    } else {
      // Round complete
      if (roundIdx < ROUNDS.length - 1) {
        setRoundIdx(r => r + 1); setRungIdx(0); setClimbed(0); setChecked(false); setSelected(null);
      } else {
        setDone(true);
        const prev = parseInt(sessionStorage.getItem('b2c_momentum') || '920', 10);
        sessionStorage.setItem('b2c_momentum', String(prev + score));
      }
    }
  };

  const handleRestart = () => {
    setRoundIdx(0); setRungIdx(0); setClimbed(0); setScore(0); setDone(false);
    setChecked(false); setSelected(null); setFell(false);
  };

  if (done) return (
    <B2CGameShell title="Band Ladder" emoji="🪜">
      <div className="bg-white dark:bg-slate-900 rounded-3xl border p-10 text-center shadow-sm border-slate-200 dark:border-slate-800">
        <Trophy className="w-16 h-16 text-amber-500 mx-auto mb-4" />
        <h2 className="text-3xl font-black text-slate-800 dark:text-white mb-2">You climbed the ladder!</h2>
        <p className="text-slate-500 mb-6">Score: <strong className="text-amber-500">+{score} pts</strong></p>
        <button onClick={handleRestart} className="flex items-center gap-2 bg-amber-500 hover:bg-amber-600 text-white font-bold px-8 py-3 rounded-xl mx-auto transition-all">
          <RotateCcw className="w-4 h-4" /> Play Again
        </button>
      </div>
    </B2CGameShell>
  );

  return (
    <B2CGameShell title="Band Ladder" emoji="🪜">
      <div className="space-y-4">
        <div className="flex items-center justify-between text-sm">
          <span className="font-bold text-slate-500">Word {roundIdx + 1} / {ROUNDS.length}</span>
          <span className="font-black text-amber-500 flex items-center gap-1"><Zap className="w-3.5 h-3.5" />{score} pts</span>
        </div>

        {/* Ladder visual */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm">
          <div className="flex items-end justify-center gap-3 mb-4 h-20">
            {[`Band 5\n"${round.base}"`, `Band ${round.rungs[0].band}`, `Band ${round.rungs[1].band}`, `Band ${round.rungs[2].band}`].map((label, i) => (
              <div key={i} className="flex flex-col items-center gap-1">
                <div className={`w-16 rounded-xl flex items-center justify-center text-xs font-black transition-all
                  ${i === 0 ? 'h-8 bg-slate-200 dark:bg-slate-700 text-slate-500' :
                    i <= climbed ? 'h-12 bg-amber-400 text-white shadow-md' :
                    i === rungIdx + 1 ? 'h-10 bg-amber-100 dark:bg-amber-500/20 text-amber-600 border-2 border-amber-400' :
                    'h-8 bg-slate-100 dark:bg-slate-800 text-slate-400'}`}>
                  {i <= climbed && i > 0 && <ArrowUp className="w-4 h-4" />}
                </div>
                <span className="text-[9px] text-slate-400 text-center whitespace-pre-line">{label}</span>
              </div>
            ))}
          </div>

          <div className="border-t border-slate-100 dark:border-slate-800 pt-4">
            <p className="text-xs font-black text-amber-500 uppercase tracking-widest mb-3 text-center">
              Rung {rungIdx + 1} · Choose the Band {rung.band} word for "{round.base}"
            </p>
            <div className="space-y-2">
              {rung.options.map((opt, i) => {
                let cls = 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:border-amber-400';
                if (checked) {
                  if (i === rung.correct) cls = 'border-emerald-500 bg-emerald-50 dark:bg-emerald-500/10';
                  else if (i === selected) cls = 'border-rose-500 bg-rose-50 dark:bg-rose-500/10 opacity-70';
                  else cls = 'border-slate-200 dark:border-slate-700 opacity-40';
                }
                return (
                  <button key={i} onClick={() => handleSelect(i)} disabled={checked}
                    className={`w-full text-left px-5 py-3.5 rounded-2xl border-2 transition-all flex items-center justify-between ${cls}`}>
                    <span className="font-bold text-slate-800 dark:text-white">{opt}</span>
                    {checked && i === rung.correct && <CheckCircle2 className="w-5 h-5 text-emerald-500" />}
                    {checked && i === selected && i !== rung.correct && <XCircle className="w-5 h-5 text-rose-500" />}
                  </button>
                );
              })}
            </div>
          </div>

          {checked && (
            <div className={`mt-4 rounded-2xl p-4 ${fell ? 'bg-rose-50 dark:bg-rose-500/10' : 'bg-emerald-50 dark:bg-emerald-500/10'}`}>
              <p className={`font-bold text-sm mb-2 ${fell ? 'text-rose-700 dark:text-rose-300' : 'text-emerald-700 dark:text-emerald-300'}`}>
                {fell ? `You fell! The correct word was "${rung.options[rung.correct]}" — try this rung again.` : `+2 pts! Great choice.`}
              </p>
              <button onClick={handleNext} className={`${fell ? 'bg-rose-500 hover:bg-rose-600' : 'bg-amber-500 hover:bg-amber-600'} text-white font-bold px-5 py-2 rounded-xl text-sm transition-all`}>
                {fell ? 'Try Again' : rungIdx < round.rungs.length - 1 ? 'Next Rung →' : roundIdx < ROUNDS.length - 1 ? 'Next Word →' : 'Finish →'}
              </button>
            </div>
          )}
        </div>
      </div>
    </B2CGameShell>
  );
}