import { Info, AlertTriangle, Lightbulb } from 'lucide-react';
import { cn } from '@/shared/utils';
import type { NoteConfig } from './types';

const STYLES: Record<NoteConfig['type'], { box: string; icon: string; iconComp: typeof Info; label: string }> = {
  plain: {
    box: 'bg-slate-50 border-slate-200 dark:bg-slate-800/40 dark:border-slate-700',
    icon: 'text-slate-400 dark:text-slate-500',
    iconComp: Info,
    label: 'Worth knowing',
  },
  warn: {
    box: 'bg-amber-50 border-amber-200 dark:bg-amber-500/10 dark:border-amber-500/25',
    icon: 'text-amber-600 dark:text-amber-400',
    iconComp: AlertTriangle,
    label: 'Note',
  },
  tip: {
    box: 'bg-emerald-50 border-emerald-200 dark:bg-emerald-500/10 dark:border-emerald-500/25',
    icon: 'text-emerald-600 dark:text-emerald-400',
    iconComp: Lightbulb,
    label: 'Tip',
  },
};

export function NoteBox({ note }: { note: NoteConfig }) {
  const s = STYLES[note.type];
  const Icon = s.iconComp;
  return (
    <div className={cn('flex items-start gap-2.5 rounded-xl border px-3.5 py-3', s.box)}>
      <Icon className={cn('w-4 h-4 shrink-0 mt-0.5', s.icon)} />
      <p className="text-[13px] leading-relaxed text-slate-600 dark:text-slate-300">
        {note.text}
      </p>
    </div>
  );
}
