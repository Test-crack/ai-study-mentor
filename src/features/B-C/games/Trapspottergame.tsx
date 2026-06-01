// FILE: src/features/b2c/games/TrapSpotterGame.tsx
import React, { useState, useEffect } from 'react';
import { CheckCircle2, XCircle, Zap, RotateCcw, Trophy, Timer } from 'lucide-react';
import B2CGameShell from '../components/B2cgameshell';

const ROUNDS = [
  {
    question: 'The report states that air pollution levels have decreased in ALL major cities over the past decade.',
    options: ['The pollution decreased', 'ALL cities — overgeneralisation', 'Over the past decade', 'Major cities only'],
    trap: 1, trapType: 'Absolute language',
    explanation: '"ALL" is absolute language. The passage likely says most or many cities, not all. This is one of the most common IELTS traps.',
  },
  {
    question: 'Scientists have NEVER found evidence that the drug causes side effects in healthy adults.',
    options: ['Scientists found evidence', 'Healthy adults only', 'NEVER — absolute language trap', 'Side effects mentioned'],
    trap: 2, trapType: 'Absolute language',
    explanation: '"NEVER" is a red flag. Real studies rarely conclude with absolute negatives — they say no significant evidence was found.',
  },
  {
    question: 'The study proves that online learning is MORE EFFECTIVE THAN traditional classroom teaching for all students.',
    options: ['Online learning studied', 'Traditional teaching mentioned', 'For all students — scope distractor', 'MORE EFFECTIVE THAN — comparison trap'],
    trap: 3, trapType: 'Scope distractor',
    explanation: '"For all students" overgeneralises. A finding for some groups is being extended to all — a classic scope distractor.',
  },
  {
    question: 'Researchers concluded that regular exercise ONLY benefits people under the age of 40.',
    options: ['Regular exercise studied', 'ONLY — limiting scope trap', 'People under 40', 'Benefits mentioned'],
    trap: 1, trapType: 'Limiting scope',
    explanation: '"ONLY" severely limits who benefits. Research rarely restricts benefits so narrowly — this is designed to mislead.',
  },
  {
    question: 'The author argues that technology will ALWAYS increase productivity in the workplace.',
    options: ['ALWAYS — absolute language', 'Technology in workplace', 'Productivity mentioned', 'Author argued a point'],
    trap: 0, trapType: 'Absolute language',
    explanation: '"ALWAYS" is the trap. Academic arguments avoid absolute claims — they say "tends to", "can", or "often".',
  },
];

export default function TrapSpotterGame() {
  const [roundIdx,   setRoundIdx]   = useState(0);
  const [selected,   setSelected]   = useState<number | null>(null);
  const [checked,    setChecked]    = useState(false);
  const [score,      setScore]      = useState(0);
  const [done,       setDone]       = useState(false);
  const [timeLeft,   setTimeLeft]   = useState(20);

  const round = ROUNDS[roundIdx];

  useEffect(() => {
    if (checked || done) return;
    setTimeLeft(20);
    const t = setInterval(() => {
      setTimeLeft(p => {
        if (p <= 1) { clearInterval(t); handleTimeUp(); return 0; }
        return p - 1;
      });
    }, 1000);
    return () => clearInterval(t);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roundIdx, checked]);

  const handleTimeUp = () => { setChecked(true); };

  const handleSelect = (i: number) => {
    if (checked) return;
    setSelected(i);
    setChecked(true);
    if (i === round.trap) setScore(s => s + 4);
  };

  const handleNext = () => {
    if (roundIdx < ROUNDS.length - 1) {
      setRoundIdx(r => r + 1);
      setSelected(null);
      setChecked(false);
    } else {
      setDone(true);
      const prev = parseInt(sessionStorage.getItem('b2c_momentum') || '920', 10);
      sessionStorage.setItem('b2c_momentum', String(prev + score));
    }
  };

  const handleRestart = () => {
    setRoundIdx(0); setScore(0); setDone(false); setSelected(null); setChecked(false); setTimeLeft(20);
  };

  if (done) return (
    <B2CGameShell title="Trap Spotter" emoji="🎯">
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-10 text-center shadow-sm">
        <Trophy className="w-16 h-16 text-amber-500 mx-auto mb-4" />
        <h2 className="text-3xl font-black text-slate-800 dark:text-white mb-2">Session Complete!</h2>
        <p className="text-slate-500 mb-6">You spotted <strong className="text-rose-500">{score / 4}</strong> of {ROUNDS.length} traps · <strong className="text-indigo-500">+{score} pts</strong></p>
        <button onClick={handleRestart} className="flex items-center gap-2 bg-rose-500 hover:bg-rose-600 text-white font-bold px-8 py-3 rounded-xl mx-auto transition-all">
          <RotateCcw className="w-4 h-4" /> Play Again
        </button>
      </div>
    </B2CGameShell>
  );

  return (
    <B2CGameShell title="Trap Spotter" emoji="🎯">
      <div className="space-y-4">
        <div className="flex items-center justify-between text-sm">
          <span className="font-bold text-slate-500">Round {roundIdx + 1} / {ROUNDS.length}</span>
          <div className="flex items-center gap-3">
            <div className={`flex items-center gap-1 font-black text-sm px-3 py-1 rounded-full ${timeLeft <= 5 ? 'bg-rose-100 text-rose-600 animate-pulse' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'}`}>
              <Timer className="w-3.5 h-3.5" /> {timeLeft}s
            </div>
            <span className="font-black text-rose-500 flex items-center gap-1"><Zap className="w-3.5 h-3.5" />{score} pts</span>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm">
          <p className="text-xs font-black text-rose-400 uppercase tracking-widest mb-3">Find the IELTS trap in this statement</p>
          <p className="text-lg font-bold text-slate-800 dark:text-white leading-relaxed">{round.question}</p>
        </div>

        <div className="space-y-2">
          {round.options.map((opt, i) => {
            let cls = 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 hover:border-rose-400';
            if (checked) {
              if (i === round.trap) cls = 'border-emerald-500 bg-emerald-50 dark:bg-emerald-500/10';
              else if (i === selected) cls = 'border-rose-500 bg-rose-50 dark:bg-rose-500/10 opacity-70';
              else cls = 'border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 opacity-40';
            }
            return (
              <button key={i} onClick={() => handleSelect(i)} disabled={checked}
                className={`w-full text-left px-5 py-4 rounded-2xl border-2 transition-all flex items-center justify-between ${cls}`}>
                <span className="font-medium text-sm text-slate-800 dark:text-white">{opt}</span>
                {checked && i === round.trap && <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />}
                {checked && i === selected && i !== round.trap && <XCircle className="w-5 h-5 text-rose-500 shrink-0" />}
              </button>
            );
          })}
        </div>

        {checked && (
          <div className="bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/30 rounded-2xl p-4">
            <p className="text-xs font-black text-amber-500 uppercase tracking-wider mb-1">Trap type: {round.trapType}</p>
            <p className="text-sm text-amber-800 dark:text-amber-300">{round.explanation}</p>
            <button onClick={handleNext} className="mt-3 bg-rose-500 hover:bg-rose-600 text-white font-bold px-5 py-2 rounded-xl text-sm transition-all">
              {roundIdx < ROUNDS.length - 1 ? 'Next Round →' : 'Finish →'}
            </button>
          </div>
        )}
      </div>
    </B2CGameShell>
  );
}