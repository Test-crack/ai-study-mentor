import { useState } from 'react';
import { Delete } from 'lucide-react';
import { cn } from '@/shared/utils';
import { TryItPanel } from './TryItPanel';

const WORD = 'LUCID';
const KEYS = ['L', 'U', 'C', 'I', 'D', 'M', 'X', 'R', 'E'];

export function LexiGridDemo() {
  const [progress, setProgress] = useState('');
  const [triesLeft, setTriesLeft] = useState(3);
  const [wrongKey, setWrongKey] = useState<string | null>(null);

  const solved = progress === WORD;

  const reset = () => {
    setProgress('');
    setTriesLeft(3);
    setWrongKey(null);
  };

  const handleKey = (letter: string) => {
    if (solved) return;
    const next = WORD[progress.length];
    if (letter === next) {
      setWrongKey(null);
      const updated = progress + letter;
      setProgress(updated);
    } else {
      setWrongKey(letter);
      setProgress('');
      setTriesLeft((t) => (t <= 1 ? 3 : t - 1));
      window.setTimeout(() => setWrongKey(null), 350);
    }
  };

  return (
    <TryItPanel instructions="Type the answer — green means the letter is right." onReset={reset}>
      <div className="flex justify-center gap-2 mb-5">
        {WORD.split('').map((_, i) => {
          const filled = i < progress.length;
          return (
            <div
              key={i}
              className={cn(
                'w-9 h-9 sm:w-10 sm:h-10 rounded-md border flex items-center justify-center font-mono font-bold text-sm uppercase transition-all duration-200',
                filled
                  ? 'bg-brand-teal-500/90 border-brand-teal-400 text-white'
                  : 'bg-white/[0.03] border-white/15 text-transparent'
              )}
            >
              {filled ? progress[i] : '_'}
            </div>
          );
        })}
      </div>

      <div className="flex flex-wrap justify-center gap-1.5 mb-4">
        {KEYS.map((k) => (
          <button
            key={k}
            onClick={() => handleKey(k)}
            disabled={solved}
            className={cn(
              'w-8 h-9 rounded-md text-xs font-bold uppercase transition-all duration-150',
              wrongKey === k
                ? 'bg-red-500 text-white'
                : 'bg-white/10 text-white/80 hover:bg-white/20',
              solved && 'opacity-40'
            )}
          >
            {k}
          </button>
        ))}
        <button
          onClick={reset}
          className="w-9 h-9 rounded-md bg-white/10 text-white/60 hover:bg-white/20 flex items-center justify-center"
          aria-label="Clear"
        >
          <Delete className="w-3.5 h-3.5" />
        </button>
      </div>

      <p className="text-center text-[11px] text-white/40">
        {solved ? (
          <span className="text-brand-mint font-semibold">Solved — +15 pts</span>
        ) : (
          <>Clue — easy to understand · {WORD.length} letters · {triesLeft} tries left</>
        )}
      </p>
    </TryItPanel>
  );
}
