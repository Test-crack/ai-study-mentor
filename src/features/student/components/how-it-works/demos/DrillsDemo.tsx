import { useState } from 'react';
import { Check } from 'lucide-react';
import { cn } from '@/shared/utils';
import { TryItPanel } from './TryItPanel';

const BASE_PTS = 15;
const PER_CORRECT = 10;
const APPLY_DRILL_PTS = 30;

export function DrillsDemo() {
  const [correct, setCorrect] = useState<boolean[]>([true, true, true, false, false]);
  const [applyDrillDone, setApplyDrillDone] = useState(false);

  const reset = () => {
    setCorrect([false, false, false, false, false]);
    setApplyDrillDone(false);
  };

  const correctCount = correct.filter(Boolean).length;
  const total = BASE_PTS + correctCount * PER_CORRECT + (applyDrillDone ? APPLY_DRILL_PTS : 0);

  return (
    <TryItPanel
      instructions="Mark how many of the five you'd get right, then add the Apply Drill."
      onReset={reset}
    >
      <div className="flex items-center justify-between gap-4">
        <div className="flex gap-2">
          {correct.map((isCorrect, i) => (
            <button
              key={i}
              onClick={() => setCorrect((c) => c.map((v, idx) => (idx === i ? !v : v)))}
              className={cn(
                'w-9 h-9 rounded-lg border flex items-center justify-center text-sm font-bold transition-all duration-150',
                isCorrect
                  ? 'bg-brand-teal-500/90 border-brand-teal-400 text-white'
                  : 'bg-white/[0.04] border-white/15 text-white/40'
              )}
            >
              {isCorrect ? <Check className="w-4 h-4" /> : i + 1}
            </button>
          ))}
        </div>
        <div className="text-right shrink-0">
          <p className="text-[9px] font-bold uppercase tracking-widest text-white/40">Session total</p>
          <p className="text-xl font-black text-brand-mint">+{total}</p>
          <p className="text-[10px] text-white/30">{BASE_PTS} base + {correctCount * PER_CORRECT} correct</p>
        </div>
      </div>

      <button
        onClick={() => setApplyDrillDone((v) => !v)}
        className={cn(
          'mt-4 w-full flex items-center justify-center gap-2 rounded-lg border px-3 py-2 text-[12px] font-semibold transition-all duration-150',
          applyDrillDone
            ? 'bg-brand-mint/15 border-brand-mint/40 text-brand-mint'
            : 'bg-white/[0.04] border-white/15 text-white/60 hover:bg-white/10'
        )}
      >
        {applyDrillDone && <Check className="w-3.5 h-3.5" />}
        Apply Drill — 2 minutes · +{APPLY_DRILL_PTS} pts
      </button>
    </TryItPanel>
  );
}
