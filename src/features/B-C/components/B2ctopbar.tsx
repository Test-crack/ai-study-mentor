// ─────────────────────────────────────────────────────────────────────────────
// FILE: src/features/b2c/components/B2CTopbar.tsx
// CREATE this file at that path.
// ─────────────────────────────────────────────────────────────────────────────

import React from 'react';
import { Flame, Zap, Moon, Sun } from 'lucide-react';

interface B2CTopbarProps {
  streak:   number;
  momentum: number;
  email:    string;
  darkMode: boolean;
  onToggleDark: () => void;
}

export default function B2CTopbar({
  streak,
  momentum,
  email,
  darkMode,
  onToggleDark,
}: B2CTopbarProps) {
  const initials = email ? email.slice(0, 2).toUpperCase() : 'TC';

  return (
    <header className="h-14 flex items-center justify-between px-5 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex-shrink-0">

      {/* Left — empty space for sidebar offset */}
      <div />

      {/* Right — stats + avatar */}
      <div className="flex items-center gap-3">

        {/* Streak pill */}
        <div className="flex items-center gap-1.5 bg-orange-50 dark:bg-orange-500/10 border border-orange-100 dark:border-orange-500/20 rounded-full px-3 py-1.5">
          <Flame className="w-3.5 h-3.5 text-orange-500 fill-orange-500" />
          <span className="text-sm font-black text-orange-600 dark:text-orange-400">{streak}</span>
          <span className="text-xs text-orange-400 font-medium hidden sm:inline">day streak</span>
        </div>

        {/* Momentum pill */}
        <div className="flex items-center gap-1.5 bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-100 dark:border-indigo-500/20 rounded-full px-3 py-1.5">
          <Zap className="w-3.5 h-3.5 text-indigo-500 fill-indigo-500" />
          <span className="text-sm font-black text-indigo-600 dark:text-indigo-400">{momentum}</span>
          <span className="text-xs text-indigo-400 font-medium hidden sm:inline">pts</span>
        </div>

        {/* Dark mode toggle */}
        <button
          onClick={onToggleDark}
          className="w-8 h-8 rounded-full flex items-center justify-center text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
        >
          {darkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
        </button>

        {/* Avatar */}
        <div className="w-8 h-8 rounded-full bg-indigo-500 flex items-center justify-center flex-shrink-0">
          <span className="text-white text-xs font-black">{initials}</span>
        </div>
      </div>
    </header>
  );
}