// FILE: src/features/b2c/games/SentenceSurgeryGame.tsx
import React, { useState, useEffect } from 'react';
import { CheckCircle2, XCircle, Zap, RotateCcw, Trophy, Timer, Scissors } from 'lucide-react';
import B2CGameShell from '../components/B2cgameshell';

const ROUNDS = [
  {
    original: 'The results of the study are very good.',
    options: [
      { text: 'The findings of the study are significant.', correct: true,  why: '"Findings" is more academic than "results", and "significant" replaces the weak "very good".' },
      { text: 'The results of the study are very, very good.', correct: false, why: 'Repetition makes it worse, not better.' },
      { text: 'The study gave good results for everyone.', correct: false, why: '"Everyone" is vague and the change makes it less formal.' },
    ],
  },
  {
    original: 'A lot of people think that technology is changing society.',
    options: [
      { text: 'Many individuals believe that technology is transforming society.', correct: true, why: '"Many individuals" and "transforming" are both more academic register.' },
      { text: 'People today really think technology changes things a lot.', correct: false, why: '"Really" and "things" reduce formality further.' },
      { text: 'A lot of people think that technology is changing everything.', correct: false, why: '"Everything" is vague and absolute — not an improvement.' },
    ],
  },
  {
    original: 'The government should help poor people more.',
    options: [
      { text: 'The government should provide greater support to low-income individuals.', correct: true, why: '"Low-income individuals" is precise and academic. "Provide greater support" is more formal than "help more".' },
      { text: 'The government should help poor people a lot more.', correct: false, why: 'Adding "a lot" makes it less formal.' },
      { text: 'The government should give more money to poor people.', correct: false, why: '"Give more money" narrows the meaning and is less academic.' },
    ],
  },
  {
    original: 'The problem is getting worse every year.',
    options: [
      { text: 'The issue is escalating annually.', correct: true, why: '"Issue" is more neutral than "problem", "escalating" is precise, and "annually" replaces the vague "every year".' },
      { text: 'The problem is getting much worse every single year.', correct: false, why: 'More emphasis words, same weak structure.' },
      { text: 'Every year the problem seems to get worse and worse.', correct: false, why: 'Repetition and "seems" reduce the academic register.' },
    ],
  },
  {
    original: 'Some countries have done well in reducing pollution.',
    options: [
      { text: 'Certain nations have made considerable progress in reducing pollution.', correct: true, why: '"Certain nations" is more formal than "some countries", and "made considerable progress" is more academic than "done well".' },
      { text: 'Some countries have done really well in reducing a lot of pollution.', correct: false, why: '"Really" and "a lot of" reduce formality.' },
      { text: 'Some countries are good at reducing pollution levels.', correct: false, why: '"Good at" is informal and weakens the sentence.' },
    ],
  },
];

export default function SentenceSurgeryGame() {
  const [roundIdx,  setRoundIdx]  = useState(0);
  const [selected,  setSelected]  = useState<number | null>(null);
  const [checked,   setChecked]   = useState(false);
  const [score,     setScore]     = useState(0);
  const [done,      setDone]      = useState(false);
  const [timeLeft,  setTimeLeft]  = useState(15);

  const round = ROUNDS[roundIdx];

  useEffect(() => {
    if (checked || done) return;
    setTimeLeft(15);
    const t = setInterval(() => {
      setTimeLeft(p => {
        if (p <= 1) { clearInterval(t); setChecked(true); return 0; }
        return p - 1;
      });
    }, 1000);
    return () => clearInterval(t);
  }, [roundIdx, checked]);

  const handleSelect = (i: number) => {
    if (checked) return;
    setSelected(i);
    setChecked(true);
    if (round.options[i].correct) setScore(s => s + 3);
  };

  const handleNext = () => {
    if (roundIdx < ROUNDS.length - 1) {
      setRoundIdx(r => r + 1); setSelected(null); setChecked(false);
    } else {
      setDone(true);
      const prev = parseInt(sessionStorage.getItem('b2c_momentum') || '920', 10);
      sessionStorage.setItem('b2c_momentum', String(prev + score));
    }
  };

  const handleRestart = () => {
    setRoundIdx(0); setScore(0); setDone(false); setSelected(null); setChecked(false);
  };

  if (done) return (
    <B2CGameShell title="Sentence Surgery" emoji="✂️">
      <div className="bg-white dark:bg-slate-900 rounded-3xl border p-10 text-center shadow-sm border-slate-200 dark:border-slate-800">
        <Trophy className="w-16 h-16 text-amber-500 mx-auto mb-4" />
        <h2 className="text-3xl font-black text-slate-800 dark:text-white mb-2">Surgery Complete!</h2>
        <p className="text-slate-500 mb-6">Score: <strong className="text-teal-500">+{score} pts</strong></p>
        <button onClick={handleRestart} className="flex items-center gap-2 bg-teal-500 hover:bg-teal-600 text-white font-bold px-8 py-3 rounded-xl mx-auto transition-all">
          <RotateCcw className="w-4 h-4" /> Play Again
        </button>
      </div>
    </B2CGameShell>
  );

  return (
    <B2CGameShell title="Sentence Surgery" emoji="✂️">
      <div className="space-y-4">
        <div className="flex items-center justify-between text-sm">
          <span className="font-bold text-slate-500">Round {roundIdx + 1} / {ROUNDS.length}</span>
          <div className="flex items-center gap-3">
            <div className={`flex items-center gap-1 font-black text-sm px-3 py-1 rounded-full ${timeLeft <= 5 ? 'bg-rose-100 text-rose-600 animate-pulse' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'}`}>
              <Timer className="w-3.5 h-3.5" /> {timeLeft}s
            </div>
            <span className="font-black text-teal-500 flex items-center gap-1"><Zap className="w-3.5 h-3.5" />{score} pts</span>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm">
          <div className="flex items-center gap-2 mb-3">
            <Scissors className="w-4 h-4 text-teal-500" />
            <p className="text-xs font-black text-teal-500 uppercase tracking-widest">Band 5 sentence — make ONE edit to push it to Band 7</p>
          </div>
          <p className="text-lg font-bold text-slate-800 dark:text-white leading-relaxed bg-rose-50 dark:bg-rose-500/10 px-4 py-3 rounded-xl border border-rose-200 dark:border-rose-500/20">
            "{round.original}"
          </p>
        </div>

        <div className="space-y-2">
          {round.options.map((opt, i) => {
            let cls = 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 hover:border-teal-400';
            if (checked) {
              if (opt.correct) cls = 'border-emerald-500 bg-emerald-50 dark:bg-emerald-500/10';
              else if (i === selected) cls = 'border-rose-500 bg-rose-50 dark:bg-rose-500/10 opacity-70';
              else cls = 'border-slate-200 dark:border-slate-700 opacity-40';
            }
            return (
              <button key={i} onClick={() => handleSelect(i)} disabled={checked}
                className={`w-full text-left px-5 py-4 rounded-2xl border-2 transition-all flex items-center justify-between gap-3 ${cls}`}>
                <span className="font-medium text-sm text-slate-800 dark:text-white">{opt.text}</span>
                {checked && opt.correct && <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />}
                {checked && i === selected && !opt.correct && <XCircle className="w-5 h-5 text-rose-500 shrink-0" />}
              </button>
            );
          })}
        </div>

        {checked && (
          <div className="bg-teal-50 dark:bg-teal-500/10 border border-teal-200 dark:border-teal-500/30 rounded-2xl p-4">
            <p className="text-sm text-teal-800 dark:text-teal-300 font-medium">
              {selected !== null ? round.options[round.options.findIndex(o => o.correct)].why : 'Time up! ' + round.options.find(o => o.correct)?.why}
            </p>
            <button onClick={handleNext} className="mt-3 bg-teal-500 hover:bg-teal-600 text-white font-bold px-5 py-2 rounded-xl text-sm transition-all">
              {roundIdx < ROUNDS.length - 1 ? 'Next Round →' : 'Finish →'}
            </button>
          </div>
        )}
      </div>
    </B2CGameShell>
  );
}