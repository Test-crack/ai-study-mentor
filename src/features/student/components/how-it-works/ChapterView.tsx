import { ArrowLeft, ArrowRight } from 'lucide-react';
import { cn } from '@/shared/utils';
import { ACCENTS } from './accents';
import { RuleGroupCard } from './RuleGroupCard';
import { NoteBox } from './NoteBox';
import { ChapterDemo } from './demos';
import type { ChapterContent } from './types';

interface ChapterViewProps {
  chapter: ChapterContent;
  index: number;
  total: number;
  prevLabel?: string;
  nextLabel?: string;
  onPrev: () => void;
  onNext: () => void;
}

export function ChapterView({ chapter, index, total, prevLabel, nextLabel, onPrev, onNext }: ChapterViewProps) {
  const accent = ACCENTS[chapter.accent];
  const Icon = chapter.icon;
  const isFirst = index === 0;
  const isLast = index === total - 1;

  return (
    <div className="space-y-4 sm:space-y-5">
      {/* Header */}
      <div
        className={cn(
          'rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 border-l-4 p-4 sm:p-5 flex items-start gap-3.5',
          accent.border
        )}
      >
        <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center shrink-0', accent.iconBg)}>
          <Icon className={cn('w-[18px] h-[18px]', accent.iconText)} />
        </div>
        <div className="min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="font-mono text-[11px] tracking-widest text-slate-400 dark:text-slate-500">
              Chapter {chapter.number}
            </span>
            <span className={cn('text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full', accent.tagBg, accent.tagText)}>
              {chapter.tag}
            </span>
          </div>
          <h2 className="text-[16px] sm:text-lg font-bold text-slate-900 dark:text-white tracking-tight leading-snug">
            {chapter.title}
          </h2>
          <p className="text-[13px] text-slate-500 dark:text-slate-400 mt-1.5 leading-relaxed">
            {chapter.intro}
          </p>
        </div>
      </div>

      {/* Interactive demo */}
      <ChapterDemo chapterId={chapter.id} />

      {/* Rule groups */}
      {chapter.ruleGroups.map((group, i) => (
        <RuleGroupCard key={i} group={group} />
      ))}

      {/* Trailing notes */}
      {chapter.trailingNotes.map((note, i) => (
        <NoteBox key={i} note={note} />
      ))}

      {/* Prev / Next */}
      <div className="flex items-center justify-between gap-3 pt-2">
        <button
          onClick={onPrev}
          disabled={isFirst}
          className={cn(
            'flex items-center gap-1.5 rounded-lg border px-3.5 py-2 text-[13px] font-semibold transition-all duration-150',
            isFirst
              ? 'border-slate-200 dark:border-slate-800 text-slate-300 dark:text-slate-600 cursor-not-allowed'
              : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/60'
          )}
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          {isFirst ? 'Start' : prevLabel}
        </button>

        <button
          onClick={onNext}
          className="flex items-center gap-1.5 rounded-lg bg-brand-ink px-4 py-2 text-[13px] font-semibold text-white hover:bg-brand-ink/90 transition-all duration-150"
        >
          {isLast ? 'Back to top' : nextLabel}
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}
