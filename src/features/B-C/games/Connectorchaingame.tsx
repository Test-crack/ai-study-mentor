// FILE: src/features/b2c/games/ConnectorChainGame.tsx
import React, { useState, useEffect } from 'react';
import { CheckCircle2, XCircle, Zap, RotateCcw, Trophy, Link } from 'lucide-react';
import B2CGameShell from '../components/B2cgameshell';

const ROUNDS = [
  {
    s1: 'Exercise improves cardiovascular health.',
    s2: 'many people struggle to maintain a regular routine.',
    options: ['However,', 'Therefore,', 'Moreover,', 'Similarly,'],
    correct: 0,
    result: 'Exercise improves cardiovascular health. However, many people struggle to maintain a regular routine.',
    explanation: '"However" signals contrast — health benefits exist, but adherence is difficult. The other options would imply continuation or addition, not contrast.',
  },
  {
    s1: 'The study found that screen time negatively affects sleep quality.',
    s2: 'experts recommend limiting device use after 9 PM.',
    options: ['However,', 'Nevertheless,', 'Therefore,', 'Although,'],
    correct: 2,
    result: 'The study found that screen time negatively affects sleep quality. Therefore, experts recommend limiting device use after 9 PM.',
    explanation: '"Therefore" signals cause and effect — the finding leads logically to the recommendation.',
  },
  {
    s1: 'Urban populations are growing rapidly in developing nations.',
    s2: 'infrastructure investment has not kept pace with this growth.',
    options: ['Therefore,', 'Furthermore,', 'However,', 'Consequently,'],
    correct: 2,
    result: 'Urban populations are growing rapidly in developing nations. However, infrastructure investment has not kept pace with this growth.',
    explanation: '"However" introduces a contrasting problem — growth is happening, but infrastructure is lagging behind.',
  },
  {
    s1: 'Renewable energy reduces carbon emissions significantly.',
    s2: 'it creates employment opportunities in new industries.',
    options: ['However,', 'Moreover,', 'Therefore,', 'Despite this,'],
    correct: 1,
    result: 'Renewable energy reduces carbon emissions significantly. Moreover, it creates employment opportunities in new industries.',
    explanation: '"Moreover" adds an additional positive point — it continues in the same direction (both are benefits).',
  },
  {
    s1: 'The government introduced stricter regulations on food labelling.',
    s2: 'consumers are better informed about nutritional content.',
    options: ['However,', 'In contrast,', 'As a result,', 'Nevertheless,'],
    correct: 2,
    result: 'The government introduced stricter regulations on food labelling. As a result, consumers are better informed about nutritional content.',
    explanation: '"As a result" shows the regulations caused the improvement in consumer knowledge — a direct cause-effect relationship.',
  },
  {
    s1: 'The new policy faced significant opposition from business groups.',
    s2: 'the government decided to proceed with implementation.',
    options: ['Therefore,', 'Nevertheless,', 'Moreover,', 'Similarly,'],
    correct: 1,
    result: 'The new policy faced significant opposition from business groups. Nevertheless, the government decided to proceed with implementation.',
    explanation: '"Nevertheless" means despite that opposition, the action was taken — showing determination against resistance.',
  },
];

export default function ConnectorChainGame() {
  const [roundIdx,  setRoundIdx]  = useState(0);
  const [selected,  setSelected]  = useState<number | null>(null);
  const [checked,   setChecked]   = useState(false);
  const [score,     setScore]     = useState(0);
  const [done,      setDone]      = useState(false);
  const [showSnap,  setShowSnap]  = useState(false);

  const round = ROUNDS[roundIdx];

  const handleSelect = (i: number) => {
    if (checked) return;
    setSelected(i);
    setChecked(true);
    if (i === round.correct) {
      setScore(s => s + 2);
      setTimeout(() => setShowSnap(true), 300);
    }
  };

  const handleNext = () => {
    if (roundIdx < ROUNDS.length - 1) {
      setRoundIdx(r => r + 1); setSelected(null); setChecked(false); setShowSnap(false);
    } else {
      setDone(true);
      const prev = parseInt(sessionStorage.getItem('b2c_momentum') || '920', 10);
      sessionStorage.setItem('b2c_momentum', String(prev + score));
    }
  };

  const handleRestart = () => {
    setRoundIdx(0); setScore(0); setDone(false); setSelected(null); setChecked(false); setShowSnap(false);
  };

  if (done) return (
    <B2CGameShell title="Connector Chain" emoji="🔗">
      <div className="bg-white dark:bg-slate-900 rounded-3xl border p-10 text-center shadow-sm border-slate-200 dark:border-slate-800">
        <Trophy className="w-16 h-16 text-amber-500 mx-auto mb-4" />
        <h2 className="text-3xl font-black text-slate-800 dark:text-white mb-2">Chain Complete!</h2>
        <p className="text-slate-500 mb-6">Score: <strong className="text-sky-500">+{score} pts</strong></p>
        <button onClick={handleRestart} className="flex items-center gap-2 bg-sky-500 hover:bg-sky-600 text-white font-bold px-8 py-3 rounded-xl mx-auto transition-all">
          <RotateCcw className="w-4 h-4" /> Play Again
        </button>
      </div>
    </B2CGameShell>
  );

  return (
    <B2CGameShell title="Connector Chain" emoji="🔗">
      <div className="space-y-4">
        <div className="flex items-center justify-between text-sm">
          <span className="font-bold text-slate-500">Round {roundIdx + 1} / {ROUNDS.length}</span>
          <span className="font-black text-sky-500 flex items-center gap-1"><Zap className="w-3.5 h-3.5" />{score} pts</span>
        </div>

        {/* Two sentence blocks */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm space-y-3">
          <p className="text-xs font-black text-sky-400 uppercase tracking-widest flex items-center gap-2"><Link className="w-3.5 h-3.5" /> Pick the connector that links these two sentences</p>
          <div className="bg-sky-50 dark:bg-sky-500/10 rounded-xl px-4 py-3 border border-sky-200 dark:border-sky-500/20">
            <p className="font-bold text-slate-800 dark:text-white text-sm">{round.s1}</p>
          </div>
          <div className="flex items-center justify-center">
            <div className="w-0.5 h-6 bg-slate-200 dark:bg-slate-700" />
          </div>
          <div className="bg-slate-50 dark:bg-slate-800 rounded-xl px-4 py-3 border border-slate-200 dark:border-slate-700">
            <p className="font-bold text-slate-600 dark:text-slate-300 text-sm">
              <span className="text-sky-500 font-black">[?]</span> {round.s2}
            </p>
          </div>
        </div>

        {/* Options */}
        <div className="grid grid-cols-2 gap-3">
          {round.options.map((opt, i) => {
            let cls = 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 hover:border-sky-400 hover:bg-sky-50 dark:hover:bg-sky-500/10 text-slate-800 dark:text-white';
            if (checked) {
              if (i === round.correct) cls = 'border-emerald-500 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-300';
              else if (i === selected) cls = 'border-rose-500 bg-rose-50 dark:bg-rose-500/10 text-rose-700 dark:text-rose-300 opacity-70';
              else cls = 'border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-400 opacity-40';
            }
            return (
              <button key={i} onClick={() => handleSelect(i)} disabled={checked}
                className={`p-4 rounded-2xl border-2 transition-all font-black text-lg flex items-center justify-center gap-2 ${cls}`}>
                {opt}
                {checked && i === round.correct && <CheckCircle2 className="w-4 h-4 text-emerald-500" />}
                {checked && i === selected && i !== round.correct && <XCircle className="w-4 h-4 text-rose-500" />}
              </button>
            );
          })}
        </div>

        {/* Snapped paragraph reveal */}
        {showSnap && (
          <div className="bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/30 rounded-2xl p-4 animate-in slide-in-from-bottom-2 duration-300">
            <p className="text-xs font-black text-emerald-500 uppercase tracking-widest mb-2">✓ Paragraph snapped together!</p>
            <p className="text-sm font-medium text-emerald-800 dark:text-emerald-200 leading-relaxed italic">"{round.result}"</p>
          </div>
        )}

        {checked && (
          <div className={`rounded-2xl p-4 ${selected === round.correct ? 'bg-sky-50 dark:bg-sky-500/10 border border-sky-200 dark:border-sky-500/30' : 'bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/30'}`}>
            <p className="text-sm text-slate-700 dark:text-slate-300">{round.explanation}</p>
            <button onClick={handleNext} className="mt-3 bg-sky-500 hover:bg-sky-600 text-white font-bold px-5 py-2 rounded-xl text-sm transition-all">
              {roundIdx < ROUNDS.length - 1 ? 'Next Round →' : 'Finish →'}
            </button>
          </div>
        )}
      </div>
    </B2CGameShell>
  );
}