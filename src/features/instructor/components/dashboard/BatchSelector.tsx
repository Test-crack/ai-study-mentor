import { Layers } from 'lucide-react';
import { cn } from '@/shared/utils';
import type { InstructorBatch } from './types';

interface BatchSelectorProps {
  batches:         InstructorBatch[];
  selectedBatchId: string | null;
  onSelect:        (id: string) => void;
  loading?:        boolean;
}

export function BatchSelector({ batches, selectedBatchId, onSelect, loading }: BatchSelectorProps) {
  if (loading) {
    return (
      <div className="flex gap-2 flex-wrap">
        {[1, 2, 3].map(i => (
          <div key={i} className="h-9 w-28 rounded-full bg-slate-200 dark:bg-slate-700 animate-pulse" />
        ))}
      </div>
    );
  }

  if (batches.length === 0) return null;

  return (
    <div className="flex gap-2 flex-wrap items-center">
      <Layers className="h-4 w-4 text-slate-400 shrink-0" />
      {batches.map(batch => {
        const isActive = batch.id === selectedBatchId;
        return (
          <button
            key={batch.id}
            onClick={() => onSelect(batch.id)}
            className={cn(
              'h-9 px-4 rounded-full text-sm font-semibold transition-all border',
              isActive
                ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm shadow-indigo-500/20'
                : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-indigo-400 dark:hover:border-indigo-500'
            )}
          >
            {batch.name}
            <span className={cn(
              'ml-1.5 text-[11px] font-bold',
              isActive ? 'text-indigo-200' : 'text-slate-400 dark:text-slate-500'
            )}>
              {batch.studentCount}
            </span>
          </button>
        );
      })}
    </div>
  );
}
