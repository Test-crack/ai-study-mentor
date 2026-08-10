// FILE: src/features/b2c/games/InferenceSprintGame.tsx
import React, { useState, useEffect, useCallback } from 'react';
import { CheckCircle2, XCircle, Zap, RotateCcw, Trophy, Timer, Minus } from 'lucide-react';
import B2CGameShell from '../components/B2cgameshell';

type Answer = 'TRUE' | 'FALSE' | 'NOT GIVEN';

const ROUNDS: Array<{ passage: string; statements: Array<{ text: string; answer: Answer; explanation: string }> }> = [
  {
    passage: 'Remote work has grown significantly since 2020. Many companies now offer flexible arrangements, and employee productivity has, in several studies, been shown to match or exceed office performance.',
    statements: [
      { text: 'Remote work increased after 2020.', answer: 'TRUE', explanation: 'The passage directly states remote work grew significantly since 2020.' },
      { text: 'All employees prefer working from home.', answer: 'NOT GIVEN', explanation: 'The passage mentions productivity, not employee preference.' },
      { text: 'Office workers are more productive than remote workers.', answer: 'FALSE', explanation: 'The passage says productivity matches or exceeds office performance — the opposite.' },
    ],
  },
  {
    passage: 'Electric vehicles now account for over 15% of new car sales in several European countries. Charging infrastructure remains a key concern, though investment in public charging stations has doubled in three years.',
    statements: [
      { text: 'Electric vehicles are popular in some European countries.', answer: 'TRUE', explanation: 'Over 15% of new car sales confirms popularity in several countries.' },
      { text: 'Charging infrastructure concerns have been fully resolved.', answer: 'FALSE', explanation: 'The passage says it "remains a key concern" — not resolved.' },
      { text: 'Petrol vehicles will be banned in Europe within five years.', answer: 'NOT GIVEN', explanation: 'No mention of bans or timelines for petrol vehicles.' },
    ],
  },
  {
    passage: 'Sleep deprivation affects cognitive function significantly. Research shows that adults sleeping fewer than six hours per night demonstrate reduced reaction time, memory retention, and decision-making ability.',
    statements: [
      { text: 'Lack of sleep impairs brain function.', answer: 'TRUE', explanation: 'Directly stated — sleep deprivation affects cognitive function significantly.' },
      { text: 'Seven hours of sleep is the optimal amount for adults.', answer: 'NOT GIVEN', explanation: 'The passage mentions six hours as a threshold but doesn\'t state an optimal amount.' },
      { text: 'Adults sleeping six or more hours show no cognitive decline.', answer: 'NOT GIVEN', explanation: 'The passage only discusses those sleeping fewer than six hours, not those sleeping six or more.' },
    ],
  },
];

export default function InferenceSprintGame() {
  const [roundIdx,   setRoundIdx]   = useState(0);
  const [stmtIdx,    setStmtIdx]    = useState(0);
  const [selected,   setSelected]   = useState<Answer | null>(null);
  const [checked,    setChecked]    = useState(false);
  const [score,      setScore]      = useState(0);
  const [done,       setDone]       = useState(false);
  const [timeLeft,   setTimeLeft]   = useState(12);

  const round = ROUNDS[roundIdx];
  const stmt  = round.statements[stmtIdx];

  useEffect(() => {
    if (checked || done) return;
    setTimeLeft(12);
    const t = setInterval(() => {
      setTimeLeft(p => {
        if (p <= 1) { clearInterval(t); setChecked(true); return 0; }
        return p - 1;
      });
    }, 1000);
    return () => clearInterval(t);
  }, [roundIdx, stmtIdx, checked]);

  const handleAnswer = (ans: Answer) => {
    if (checked) return;
    setSelected(ans);
    setChecked(true);
    if (ans === stmt.answer) {
      const bonus = Math.ceil(timeLeft / 4);
      setScore(s => s + 3 + bonus);
    }
  };

  const handleNext = () => {
    if (stmtIdx < round.statements.length - 1) {
      setStmtIdx(i => i + 1); setSelected(null); setChecked(false);
    } else if (roundIdx < ROUNDS.length - 1) {
      setRoundIdx(r => r + 1); setStmtIdx(0); setSelected(null); setChecked(false);
    } else {
      setDone(true);
      const prev = parseInt(sessionStorage.getItem('b2c_momentum') || '920', 10);
      sessionStorage.setItem('b2c_momentum', String(prev + score));
    }
  };

  const handleRestart = () => {
    setRoundIdx(0); setStmtIdx(0); setScore(0); setDone(false); setSelected(null); setChecked(false);
  };

  const totalStmts = ROUNDS.reduce((s, r) => s + r.statements.length, 0);
  const doneStmts  = ROUNDS.slice(0, roundIdx).reduce((s, r) => s + r.statements.length, 0) + stmtIdx;

  if (done) return (
    <B2CGameShell title="Inference Sprint" emoji="⚡">
      <div className="bg-white dark:bg-slate-900 rounded-3xl border p-10 text-center shadow-sm border-slate-200 dark:border-slate-800">
        <Trophy className="w-16 h-16 text-amber-500 mx-auto mb-4" />
        <h2 className="text-3xl font-black text-slate-800 dark:text-white mb-2">Sprint Complete!</h2>
        <p className="text-slate-500 mb-6">Score: <strong className="text-brand-blue-500">+{score} pts</strong></p>
        <button onClick={handleRestart} className="flex items-center gap-2 bg-brand-blue-500 hover:bg-brand-blue-600 text-white font-bold px-8 py-3 rounded-xl mx-auto transition-all">
          <RotateCcw className="w-4 h-4" /> Sprint Again
        </button>
      </div>
    </B2CGameShell>
  );

  const btnBase = 'flex-1 py-4 rounded-2xl font-black text-base transition-all active:scale-95 border-2';
  const getBtn = (ans: Answer) => {
    if (!checked) return `${btnBase} border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:border-brand-blue-400 hover:bg-brand-blue-50 dark:hover:bg-brand-blue-500/10 text-slate-700 dark:text-white`;
    if (ans === stmt.answer) return `${btnBase} border-emerald-500 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-300`;
    if (ans === selected)    return `${btnBase} border-rose-500 bg-rose-50 dark:bg-rose-500/10 text-rose-700 dark:text-rose-300 opacity-70`;
    return `${btnBase} border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-400 opacity-40`;
  };

  return (
    <B2CGameShell title="Inference Sprint" emoji="⚡">
      <div className="space-y-4">
        <div className="flex items-center justify-between text-sm">
          <span className="font-bold text-slate-500">{doneStmts + 1} / {totalStmts}</span>
          <div className="flex items-center gap-3">
            <div className={`flex items-center gap-1 font-black text-sm px-3 py-1 rounded-full ${timeLeft <= 4 ? 'bg-rose-100 text-rose-600 animate-pulse' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'}`}>
              <Timer className="w-3.5 h-3.5" /> {timeLeft}s
            </div>
            <span className="font-black text-brand-blue-500 flex items-center gap-1"><Zap className="w-3.5 h-3.5" />{score} pts</span>
          </div>
        </div>
        <div className="h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
          <div className="h-full bg-brand-blue-500 rounded-full transition-all duration-300" style={{ width: `${(doneStmts / totalStmts) * 100}%` }} />
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-brand-blue-200 dark:border-brand-blue-500/30 p-6 shadow-sm">
          <p className="text-xs font-black text-brand-blue-400 uppercase tracking-widest mb-2">Passage</p>
          <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">{round.passage}</p>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm">
          <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-3">Statement</p>
          <p className="text-lg font-bold text-slate-800 dark:text-white mb-5">{stmt.text}</p>
          <div className="flex gap-2">
            <button onClick={() => handleAnswer('TRUE')}      className={getBtn('TRUE')}>TRUE</button>
            <button onClick={() => handleAnswer('FALSE')}     className={getBtn('FALSE')}>FALSE</button>
            <button onClick={() => handleAnswer('NOT GIVEN')} className={`${getBtn('NOT GIVEN')} text-sm`}>NOT GIVEN</button>
          </div>
        </div>

        {checked && (
          <div className={`rounded-2xl p-4 ${selected === stmt.answer ? 'bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/30' : 'bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/30'}`}>
            <p className={`font-bold text-sm mb-1 ${selected === stmt.answer ? 'text-emerald-700 dark:text-emerald-300' : 'text-rose-700 dark:text-rose-300'}`}>
              Answer: {stmt.answer}
            </p>
            <p className="text-sm text-slate-600 dark:text-slate-400">{stmt.explanation}</p>
            <button onClick={handleNext} className="mt-3 bg-brand-blue-500 hover:bg-brand-blue-600 text-white font-bold px-5 py-2 rounded-xl text-sm transition-all">
              {doneStmts + 1 < totalStmts ? 'Next →' : 'Finish →'}
            </button>
          </div>
        )}
      </div>
    </B2CGameShell>
  );
}