import { useState } from 'react';
import { Flame } from 'lucide-react';
import { cn } from '@/shared/utils';
import { TryItPanel } from './TryItPanel';

const DAY_LABELS = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'];
const INITIAL: number[] = [2, 2, 3, 0, 2, 2, 1];
const TODAY_INDEX = DAY_LABELS.length - 1;

function computeStreak(days: number[]) {
  let streak = 0;
  for (let i = days.length - 1; i >= 0; i--) {
    if (days[i] >= 2) streak++;
    else break;
  }
  return streak;
}

export function StreakDemo() {
  const [days, setDays] = useState<number[]>(INITIAL);

  const cycle = (i: number) => {
    setDays((d) => d.map((v, idx) => (idx === i ? (v + 1) % 4 : v)));
  };

  const streak = computeStreak(days);
  const todayCount = days[TODAY_INDEX];

  return (
    <TryItPanel instructions="Click a day to change its drill count — two is the bar." onReset={() => setDays(INITIAL)}>
      <div className="grid grid-cols-7 gap-1.5 sm:gap-2">
        {days.map((count, i) => {
          const meetsBar = count >= 2;
          const isToday = i === TODAY_INDEX;
          return (
            <button
              key={i}
              onClick={() => cycle(i)}
              className={cn(
                'flex flex-col items-center gap-1.5 rounded-lg py-2.5 border transition-all duration-150',
                meetsBar
                  ? 'bg-emerald-500/80 border-emerald-400'
                  : count === 0
                  ? 'bg-white/[0.04] border-white/10'
                  : 'bg-amber-500/60 border-amber-400/60',
                isToday && 'ring-1 ring-white/40'
              )}
            >
              <span className="text-sm font-black text-white">{count}</span>
              <span className="text-[8px] font-bold text-white/50 tracking-wide">{DAY_LABELS[i]}</span>
            </button>
          );
        })}
      </div>

      <div className="mt-4 flex items-center gap-2">
        <Flame className={cn('w-4 h-4', streak > 0 ? 'text-orange-400 fill-orange-400' : 'text-white/30')} />
        <span className="text-sm font-black text-white">{streak} days</span>
        <span className="text-[11px] text-white/40">
          {todayCount < 2
            ? '— today is under two sessions, so the streak reads zero. One more drill fixes it.'
            : '— streak credit earned for today.'}
        </span>
      </div>
    </TryItPanel>
  );
}
