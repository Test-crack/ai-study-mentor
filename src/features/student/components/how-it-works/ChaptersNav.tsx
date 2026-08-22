import { cn } from '@/shared/utils';
import { CHAPTERS } from './data';

interface ChaptersNavProps {
  activeIndex: number;
  onSelect: (index: number) => void;
}

export function ChaptersNavDesktop({ activeIndex, onSelect }: ChaptersNavProps) {
  const progressPct = ((activeIndex + 1) / CHAPTERS.length) * 100;

  return (
    <div className="hidden lg:block sticky top-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4">
      <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-slate-400 dark:text-slate-500 px-1 mb-2">
        Chapters
      </p>
      <nav className="space-y-0.5">
        {CHAPTERS.map((chapter, i) => {
          const isActive = i === activeIndex;
          const Icon = chapter.icon;
          return (
            <button
              key={chapter.id}
              onClick={() => onSelect(i)}
              className={cn(
                'w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-left transition-all duration-200',
                isActive
                  ? 'bg-brand-ink text-white'
                  : 'text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/60'
              )}
            >
              <Icon className={cn('w-3.5 h-3.5 shrink-0', isActive ? 'text-brand-mint' : 'text-slate-400 dark:text-slate-500')} />
              <span className="text-[13px] font-medium leading-tight truncate">{chapter.label}</span>
            </button>
          );
        })}
      </nav>

      <div className="mt-3 rounded-lg border border-slate-100 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/30 px-3 py-2.5">
        <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-slate-400 dark:text-slate-500 mb-1">
          Read
        </p>
        <p className="text-[12px] font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
          {activeIndex + 1} of {CHAPTERS.length} chapters
        </p>
        <div className="h-1 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
          <div
            className="h-full rounded-full bg-brand-teal-500 transition-all duration-300"
            style={{ width: `${progressPct}%` }}
          />
        </div>
      </div>
    </div>
  );
}

export function ChaptersNavMobile({ activeIndex, onSelect }: ChaptersNavProps) {
  return (
    <div
      className="lg:hidden sticky top-16 z-20 bg-[#F8FAFC]/90 dark:bg-slate-950/90 backdrop-blur border-b border-slate-200 dark:border-slate-800 px-4 py-2 flex gap-2 overflow-x-auto scrollbar-none"
      style={{ WebkitOverflowScrolling: 'touch' }}
    >
      {CHAPTERS.map((chapter, i) => {
        const isActive = i === activeIndex;
        return (
          <button
            key={chapter.id}
            id={`nav-chip-${chapter.id}`}
            onClick={() => onSelect(i)}
            className={cn(
              'shrink-0 text-[11px] font-semibold px-3 py-1 rounded-full border transition-all duration-200 whitespace-nowrap',
              isActive
                ? 'bg-brand-ink border-brand-ink text-white'
                : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400'
            )}
          >
            {chapter.number} {chapter.label}
          </button>
        );
      })}
    </div>
  );
}
