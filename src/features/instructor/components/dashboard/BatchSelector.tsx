import { cn } from '@/shared/utils';
import type { InstructorBatch } from './types';

interface BatchSelectorProps {
  batches:         InstructorBatch[];
  selectedBatchId: string | null;
  onSelect:        (id: string) => void;
  loading?:        boolean;
  /** When true the component sits on a dark/gradient background — uses white palette. */
  onGradient?:     boolean;
}

export function BatchSelector({
  batches,
  selectedBatchId,
  onSelect,
  loading,
  onGradient = false,
}: BatchSelectorProps) {
  if (loading) {
    return (
      <div className="flex flex-col gap-2">
        <div className={cn('font-jetbrains text-[10px] font-black uppercase tracking-widest mb-0.5',
          onGradient ? 'text-white/50' : 'text-brand-text-mute'
        )}>
          Batches
        </div>
        <div className="flex gap-2 flex-wrap">
          {[1, 2].map(i => (
            <div
              key={i}
              className={cn(
                'h-8 w-32 rounded-full animate-pulse',
                onGradient ? 'bg-white/20' : 'bg-brand-bg-alt'
              )}
            />
          ))}
        </div>
      </div>
    );
  }

  if (batches.length === 0) return null;

  return (
    <div className="flex flex-col gap-2">
      <p className={cn(
        'font-jetbrains text-[10px] font-black uppercase tracking-widest',
        onGradient ? 'text-white/50' : 'text-brand-text-mute'
      )}>
        Batches
      </p>

      <div className="flex gap-2 flex-wrap">
        {batches.map(batch => {
          const isActive = batch.id === selectedBatchId;

          // Styles differ based on whether we're on a gradient or a white background
          const pill = onGradient
            ? isActive
              ? 'bg-white text-brand-teal-700 border-transparent shadow-md'
              : 'bg-white/15 text-white border-white/25 hover:bg-white/25'
            : isActive
              ? 'bg-brand-teal-600 text-white border-brand-teal-600 shadow-sm shadow-brand-teal-500/20'
              : 'bg-white text-brand-text border-brand-line hover:border-brand-teal-400';

          const count = onGradient
            ? isActive ? 'text-brand-teal-400' : 'text-white/50'
            : isActive ? 'text-brand-teal-200' : 'text-brand-text-mute';

          return (
            <button
              key={batch.id}
              onClick={() => onSelect(batch.id)}
              className={cn(
                'h-8 px-3.5 rounded-full text-xs font-bold transition-all border backdrop-blur-sm',
                pill
              )}
            >
              {batch.name}
              <span className={cn('ml-1.5 font-black text-[10px]', count)}>
                {batch.studentCount}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
