import { useState } from 'react';
import { cn } from '@/shared/utils';
import { useMomentum } from '@/features/student/Context/MomentumContext';
import { TryItPanel } from './TryItPanel';

const ACTIONS = [
  { label: '+15 LexiGrid word', delta: 15 },
  { label: '+5 All-5 bonus', delta: 5 },
  { label: '+15 Drill session', delta: 15 },
  { label: '+30 Apply Drill', delta: 30 },
  { label: '+100 Assessment', delta: 100 },
  { label: '−20 Missed IA', delta: -20 },
  { label: '−75 Extra drill', delta: -75 },
  { label: '−1,500 Extra mock', delta: -1500 },
];

export function MomentumDemo() {
  const { totalMomentum } = useMomentum();
  const baseline = totalMomentum || 0;
  const [balance, setBalance] = useState(baseline);

  return (
    <TryItPanel instructions="Tap any action to move the balance in the header." onReset={() => setBalance(baseline)}>
      <div className="flex flex-wrap gap-1.5 mb-4">
        {ACTIONS.map((action) => (
          <button
            key={action.label}
            onClick={() => setBalance((b) => Math.max(0, b + action.delta))}
            className={cn(
              'rounded-full border px-3 py-1.5 text-[11px] font-semibold transition-all duration-150',
              action.delta > 0
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300 hover:bg-emerald-500/20'
                : 'bg-red-500/10 border-red-500/30 text-red-300 hover:bg-red-500/20'
            )}
          >
            {action.label}
          </button>
        ))}
      </div>

      <div className="flex items-center justify-between rounded-lg bg-white/[0.04] border border-white/10 px-4 py-3">
        <div>
          <p className="text-[9px] font-bold uppercase tracking-widest text-white/40">Balance</p>
          <p className="text-[10px] text-white/30 mt-0.5">Momentum never expires.</p>
        </div>
        <p className="text-2xl font-black text-brand-mint">{balance.toLocaleString()}</p>
      </div>
    </TryItPanel>
  );
}
