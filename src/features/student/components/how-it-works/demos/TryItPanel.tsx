import { RotateCcw } from 'lucide-react';
import type { ReactNode } from 'react';

interface TryItPanelProps {
  instructions: string;
  onReset?: () => void;
  children: ReactNode;
}

export function TryItPanel({ instructions, onReset, children }: TryItPanelProps) {
  return (
    <div className="rounded-2xl bg-brand-ink dark:bg-slate-900 border border-white/5 p-4 sm:p-5">
      <div className="flex items-center justify-between gap-3 mb-4">
        <p className="text-[11px] leading-snug">
          <span className="font-bold uppercase tracking-widest text-brand-mint mr-1.5">Try it</span>
          <span className="text-white/50">{instructions}</span>
        </p>
        {onReset && (
          <button
            onClick={onReset}
            className="shrink-0 flex items-center gap-1 text-[11px] font-medium text-white/40 hover:text-white/70 transition-colors"
          >
            <RotateCcw className="w-3 h-3" />
            Reset
          </button>
        )}
      </div>
      {children}
    </div>
  );
}
