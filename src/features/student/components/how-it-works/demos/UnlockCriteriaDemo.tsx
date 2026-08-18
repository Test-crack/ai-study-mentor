import { useState } from 'react';
import { Check, Lock, LockOpen } from 'lucide-react';
import { cn } from '@/shared/utils';
import { TryItPanel } from './TryItPanel';

interface Criterion {
  label: string;
  value: string;
}

interface UnlockCriteriaDemoProps {
  criteria: Criterion[];
  accentClass: string;
}

export function UnlockCriteriaDemo({ criteria, accentClass }: UnlockCriteriaDemoProps) {
  const [met, setMet] = useState<boolean[]>(criteria.map(() => false));
  const allMet = met.every(Boolean);

  const reset = () => setMet(criteria.map(() => false));

  return (
    <TryItPanel instructions="Toggle the criteria to see the gate open." onReset={reset}>
      <div className="flex items-center gap-4">
        <div className="flex-1 space-y-2">
          {criteria.map((c, i) => (
            <button
              key={c.label}
              onClick={() => setMet((m) => m.map((v, idx) => (idx === i ? !v : v)))}
              className={cn(
                'w-full flex items-center justify-between gap-3 rounded-lg border px-3 py-2 text-left transition-all duration-150',
                met[i]
                  ? 'bg-white/[0.06] border-white/15'
                  : 'bg-white/[0.02] border-white/10 hover:bg-white/[0.04]'
              )}
            >
              <span className="flex items-center gap-2">
                <span
                  className={cn(
                    'w-4 h-4 rounded-full border flex items-center justify-center shrink-0',
                    met[i] ? cn(accentClass, 'border-transparent') : 'border-white/25'
                  )}
                >
                  {met[i] && <Check className="w-2.5 h-2.5 text-white" />}
                </span>
                <span className="text-[12px] text-white/75">{c.label}</span>
              </span>
              <span className="text-[11px] font-semibold text-white/50 shrink-0">{c.value}</span>
            </button>
          ))}
        </div>

        <div className="shrink-0 flex flex-col items-center gap-1.5">
          <div
            className={cn(
              'w-11 h-11 rounded-full flex items-center justify-center border transition-all duration-300',
              allMet ? cn(accentClass, 'border-transparent') : 'bg-white/[0.04] border-white/15'
            )}
          >
            {allMet ? <LockOpen className="w-4 h-4 text-white" /> : <Lock className="w-4 h-4 text-white/40" />}
          </div>
          <span className={cn('text-[9px] font-bold uppercase tracking-wide', allMet ? 'text-white/70' : 'text-white/30')}>
            {allMet ? 'Unlocked' : 'Locked'}
          </span>
        </div>
      </div>

      {!allMet && (
        <p className="text-[10px] text-white/30 mt-3">Both criteria must be met.</p>
      )}
    </TryItPanel>
  );
}
