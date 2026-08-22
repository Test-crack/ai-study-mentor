import { useState } from 'react';
import { Check, Minus, Plus } from 'lucide-react';
import { cn } from '@/shared/utils';
import { TryItPanel } from './TryItPanel';

const PREV_BAND = 5.0;
const BAND_CAP = 9.0;

function Stepper({ label, value, onChange }: { label: string; value: number; onChange: (v: number) => void }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-lg bg-white/[0.04] border border-white/10 px-3 py-2">
      <span className="text-[11px] text-white/60">{label}</span>
      <div className="flex items-center gap-2">
        <button
          onClick={() => onChange(Math.max(0, Math.round((value - 0.5) * 10) / 10))}
          className="w-6 h-6 rounded-md bg-white/10 flex items-center justify-center text-white/60 hover:bg-white/20"
        >
          <Minus className="w-3 h-3" />
        </button>
        <span className="w-8 text-center text-sm font-bold text-white">{value.toFixed(1)}</span>
        <button
          onClick={() => onChange(Math.min(9, Math.round((value + 0.5) * 10) / 10))}
          className="w-6 h-6 rounded-md bg-white/10 flex items-center justify-center text-white/60 hover:bg-white/20"
        >
          <Plus className="w-3 h-3" />
        </button>
      </div>
    </div>
  );
}

export function BandScoreDemo() {
  const [tab, setTab] = useState<'ia' | 'mock'>('ia');
  const [correct, setCorrect] = useState<boolean[]>(Array(10).fill(true));
  const [mockScore, setMockScore] = useState(6.5);
  const [lastIA, setLastIA] = useState(5.5);

  const correctCount = correct.filter(Boolean).length;
  const iaCompletion = correctCount / 10;
  const iaBand = Math.min(BAND_CAP, PREV_BAND + iaCompletion * 0.5);

  const mockBand = Math.min(BAND_CAP, mockScore * 0.6 + lastIA * 0.4);

  const reset = () => {
    setCorrect(Array(10).fill(true));
    setMockScore(6.5);
    setLastIA(5.5);
  };

  return (
    <TryItPanel
      instructions={tab === 'ia' ? 'Move the slider and watch the formula run.' : 'Adjust both scores and watch the blend.'}
      onReset={reset}
    >
      <div className="flex gap-1.5 mb-4">
        {(['ia', 'mock'] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={cn(
              'rounded-full px-3 py-1 text-[11px] font-semibold border transition-all duration-150',
              tab === t
                ? 'bg-brand-mint/15 border-brand-mint/40 text-brand-mint'
                : 'bg-white/[0.04] border-white/10 text-white/50 hover:bg-white/10'
            )}
          >
            {t === 'ia' ? 'Internal Assessment' : 'Full Mock'}
          </button>
        ))}
      </div>

      {tab === 'ia' ? (
        <>
          <p className="text-[10px] text-white/40 mb-2">Correct answers out of 10</p>
          <div className="flex gap-1 mb-4">
            {correct.map((isCorrect, i) => (
              <button
                key={i}
                onClick={() => setCorrect((c) => c.map((v, idx) => (idx === i ? !v : v)))}
                className={cn(
                  'flex-1 h-8 rounded-md border flex items-center justify-center transition-all duration-150',
                  isCorrect
                    ? 'bg-brand-teal-500/90 border-brand-teal-400'
                    : 'bg-white/[0.03] border-white/15'
                )}
              >
                {isCorrect && <Check className="w-3 h-3 text-white" />}
              </button>
            ))}
          </div>
          <div className="flex items-center justify-between rounded-lg bg-white/[0.04] border border-white/10 px-3.5 py-2.5">
            <span className="text-[11px] font-mono text-white/50">
              {PREV_BAND.toFixed(1)} + ({iaCompletion.toFixed(1)} × 0.5)
            </span>
            <span className="text-sm font-black text-brand-mint">
              {PREV_BAND.toFixed(1)} → {iaBand.toFixed(1)}
            </span>
          </div>
        </>
      ) : (
        <>
          <div className="space-y-2 mb-4">
            <Stepper label="Mock score" value={mockScore} onChange={setMockScore} />
            <Stepper label="Last IA score" value={lastIA} onChange={setLastIA} />
          </div>
          <div className="flex items-center justify-between rounded-lg bg-white/[0.04] border border-white/10 px-3.5 py-2.5">
            <span className="text-[11px] font-mono text-white/50">
              {mockScore.toFixed(1)} × 0.6 + {lastIA.toFixed(1)} × 0.4
            </span>
            <span className="text-sm font-black text-brand-mint">{mockBand.toFixed(1)}</span>
          </div>
        </>
      )}
    </TryItPanel>
  );
}
