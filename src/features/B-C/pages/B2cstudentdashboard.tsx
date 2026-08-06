// ─────────────────────────────────────────────────────────────────────────────
// FILE: src/features/b2c/pages/B2CStudentDashboard.tsx
// REPLACE existing file with this.
// Only change: B2CVideoLibrary imported and added as a new section at the
// bottom of main — everything else is exactly as your original.
// ─────────────────────────────────────────────────────────────────────────────

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Flame, Zap, Trophy, ArrowRight, Play,
  TrendingUp, Star, Lock, CheckCircle2,
  Gamepad2, Target,
} from 'lucide-react';
import { cn } from '@/shared/utils';
import B2CSidebar      from '../components/B2csidebar';
import B2CTopbar       from '../components/B2ctopbar';
import B2CVideoLibrary from '../components/B2CVideoLibrary';

// ─── Types ────────────────────────────────────────────────────────────────────

interface GameCard {
  id:          string;
  label:       string;
  emoji:       string;
  description: string;
  path:        string;
  maxPts:      number;
  color:       string;
  bg:          string;
  border:      string;
  badge:       string | null;
  difficulty:  'Easy' | 'Medium' | 'Hard';
}

// ─── Constants ────────────────────────────────────────────────────────────────

const GAMES: GameCard[] = [
  {
    id:          'lexigrid',
    label:       'LexiGrid',
    emoji:       '🔤',
    description: 'Crack vocabulary clues to fill the grid. Tests the lexical range examiners look for in IELTS.',
    path:        '/b2c/game/lexigrid',
    maxPts:      15,
    color:       'text-brand-teal-600 dark:text-brand-teal-400',
    bg:          'bg-brand-teal-50 dark:bg-brand-teal-500/10',
    border:      'border-brand-teal-200 dark:border-brand-teal-500/30',
    badge:       'Fan fav',
    difficulty:  'Medium',
  },
  {
    id:          'trap-spotter',
    label:       'Trap Spotter',
    emoji:       '🎯',
    description: 'Identify the IELTS trap hidden in each question — scope distractors, paraphrase traps, absolute language.',
    path:        '/b2c/game/trap-spotter',
    maxPts:      20,
    color:       'text-rose-600 dark:text-rose-400',
    bg:          'bg-rose-50 dark:bg-rose-500/10',
    border:      'border-rose-200 dark:border-rose-500/30',
    badge:       'New',
    difficulty:  'Hard',
  },
  {
    id:          'band-ladder',
    label:       'Band Ladder',
    emoji:       '🪜',
    description: 'Climb from band 5 to band 7+ by swapping weak words for stronger academic vocabulary.',
    path:        '/b2c/game/band-ladder',
    maxPts:      12,
    color:       'text-amber-600 dark:text-amber-400',
    bg:          'bg-amber-50 dark:bg-amber-500/10',
    border:      'border-amber-200 dark:border-amber-500/30',
    badge:       null,
    difficulty:  'Easy',
  },
  {
    id:          'sentence-surgery',
    label:       'Sentence Surgery',
    emoji:       '✂️',
    description: 'Make exactly one edit to a band-5 sentence to push it to band 7. Precision writing in 15 seconds.',
    path:        '/b2c/game/sentence-surgery',
    maxPts:      15,
    color:       'text-teal-600 dark:text-teal-400',
    bg:          'bg-teal-50 dark:bg-teal-500/10',
    border:      'border-teal-200 dark:border-teal-500/30',
    badge:       null,
    difficulty:  'Medium',
  },
  {
    id:          'inference-sprint',
    label:       'Inference Sprint',
    emoji:       '⚡',
    description: 'True / False / Not Given at speed. Score on accuracy AND reaction time. Most addictive game.',
    path:        '/b2c/game/inference-sprint',
    maxPts:      25,
    color:       'text-brand-blue-600 dark:text-brand-blue-400',
    bg:          'bg-brand-blue-50 dark:bg-brand-blue-500/10',
    border:      'border-brand-blue-200 dark:border-brand-blue-500/30',
    badge:       'Hot 🔥',
    difficulty:  'Hard',
  },
  {
    id:          'connector-chain',
    label:       'Connector Chain',
    emoji:       '🔗',
    description: 'Pick the right connector to link two sentences. Watch your paragraph snap together perfectly.',
    path:        '/b2c/game/connector-chain',
    maxPts:      10,
    color:       'text-sky-600 dark:text-sky-400',
    bg:          'bg-sky-50 dark:bg-sky-500/10',
    border:      'border-sky-200 dark:border-sky-500/30',
    badge:       null,
    difficulty:  'Easy',
  },
];

const DIFFICULTY_COLOR: Record<string, string> = {
  Easy:   'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400',
  Medium: 'bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400',
  Hard:   'bg-rose-100 text-rose-700 dark:bg-rose-500/20 dark:text-rose-400',
};

// ─── Main component ───────────────────────────────────────────────────────────

export default function B2CStudentDashboard() {
  const navigate = useNavigate();

  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isSidebarHovered,   setIsSidebarHovered]   = useState(false);
  const [darkMode,           setDarkMode]           = useState(false);

  // ── Student data (replace with real API call) ────────────────────────────
  const email       = sessionStorage.getItem('b2c_email') || 'student@example.com';
  const firstName   = email.split('@')[0].split('.')[0];
  const displayName = firstName.charAt(0).toUpperCase() + firstName.slice(1);

  const [streak,       setStreak]       = useState(3);
  const [momentum,     setMomentum]     = useState(920);
  const [gamesPlayed,  setGamesPlayed]  = useState(12);
  const [topGame,      setTopGame]      = useState('LexiGrid');
  const [recentScores, setRecentScores] = useState<Record<string, number>>({
    lexigrid:           12,
    'trap-spotter':     18,
    'inference-sprint': 22,
  });

  // Dark mode sync
  useEffect(() => {
    document.documentElement.classList.toggle('dark', darkMode);
  }, [darkMode]);

  const sidebarWidth = isSidebarHovered ? 'md:pl-[240px]' : isSidebarCollapsed ? 'md:pl-[72px]' : 'md:pl-[240px]';

  return (
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-slate-950 transition-colors duration-300">

      <B2CSidebar
        isCollapsed={isSidebarCollapsed}
        toggleCollapse={() => setIsSidebarCollapsed(v => !v)}
        onMouseEnter={() => setIsSidebarHovered(true)}
        onMouseLeave={() => setIsSidebarHovered(false)}
        streak={streak}
        momentum={momentum}
      />

      <div className={cn('transition-all duration-300 flex flex-col min-h-screen', sidebarWidth)}>

        <B2CTopbar
          streak={streak}
          momentum={momentum}
          email={email}
          darkMode={darkMode}
          onToggleDark={() => setDarkMode(v => !v)}
        />

        <main className="flex-1 p-4 sm:p-6 lg:p-8 space-y-6">

          {/* ── Hero banner ────────────────────────────────────────────────── */}
          <section className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-brand-teal-600 via-brand-teal-500 to-brand-blue-600 p-7 text-white shadow-lg">
            <div className="pointer-events-none absolute -right-8 -top-8 h-48 w-48 rounded-full bg-white/10 blur-2xl" />
            <div className="pointer-events-none absolute right-20 bottom-0 h-24 w-24 rounded-full bg-brand-blue-400/30 blur-xl" />
            <div className="relative z-10 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <p className="text-brand-teal-200 text-sm font-bold mb-1">Welcome back 👋</p>
                <h1 className="text-2xl sm:text-3xl font-black tracking-tight mb-1">
                  {displayName}
                </h1>
                <p className="text-brand-teal-100 text-sm">
                  You're on a <strong className="text-white">{streak}-day streak</strong> — keep it going!
                </p>
              </div>

              {/* Stats */}
              <div className="flex gap-3 flex-shrink-0">
                <div className="bg-white/15 border border-white/25 backdrop-blur-sm rounded-2xl px-5 py-3 text-center">
                  <p className="text-brand-teal-200 text-[10px] font-black uppercase tracking-widest mb-0.5">Momentum</p>
                  <p className="text-3xl font-black text-white leading-none">{momentum}</p>
                  <p className="text-brand-teal-200 text-[10px] mt-0.5">pts</p>
                </div>
                <div className="bg-white/15 border border-white/25 backdrop-blur-sm rounded-2xl px-5 py-3 text-center">
                  <p className="text-brand-teal-200 text-[10px] font-black uppercase tracking-widest mb-0.5">Games</p>
                  <p className="text-3xl font-black text-white leading-none">{gamesPlayed}</p>
                  <p className="text-brand-teal-200 text-[10px] mt-0.5">played</p>
                </div>
              </div>
            </div>
          </section>

          {/* ── Quick stats row ────────────────────────────────────────────── */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[
              { label: 'Day Streak',   value: `${streak} days`,  icon: <Flame  className="w-5 h-5 text-orange-500" />, bg: 'bg-orange-50 dark:bg-orange-500/10', border: 'border-orange-100 dark:border-orange-500/20' },
              { label: 'Momentum',     value: `${momentum} pts`, icon: <Zap    className="w-5 h-5 text-brand-teal-500" />, bg: 'bg-brand-teal-50 dark:bg-brand-teal-500/10', border: 'border-brand-teal-100 dark:border-brand-teal-500/20' },
              { label: 'Top Game',     value: topGame,           icon: <Star   className="w-5 h-5 text-amber-500"  />, bg: 'bg-amber-50 dark:bg-amber-500/10',   border: 'border-amber-100 dark:border-amber-500/20'  },
              { label: 'Games Played', value: `${gamesPlayed}`,  icon: <Trophy className="w-5 h-5 text-brand-blue-500" />, bg: 'bg-brand-blue-50 dark:bg-brand-blue-500/10', border: 'border-brand-blue-100 dark:border-brand-blue-500/20' },
            ].map((stat, i) => (
              <div key={i} className={cn('rounded-2xl border p-4 flex items-center gap-3 bg-white dark:bg-slate-900 shadow-sm', stat.border)}>
                <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0', stat.bg)}>
                  {stat.icon}
                </div>
                <div className="min-w-0">
                  <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider truncate">{stat.label}</p>
                  <p className="text-sm font-black text-slate-800 dark:text-white truncate">{stat.value}</p>
                </div>
              </div>
            ))}
          </div>

          {/* ── Games grid ────────────────────────────────────────────────── */}
          <section>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-lg font-black text-slate-800 dark:text-white uppercase tracking-tight">All Games</h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-0.5">Play as many as you like — each one trains a real IELTS skill</p>
              </div>
              <span className="text-xs font-bold text-brand-teal-500 bg-brand-teal-50 dark:bg-brand-teal-500/10 px-3 py-1.5 rounded-full">
                {GAMES.length} games
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {GAMES.map(game => {
                const lastScore = recentScores[game.id];
                return (
                  <button
                    key={game.id}
                    onClick={() => navigate(game.path)}
                    className={cn(
                      'group text-left w-full rounded-3xl border bg-white dark:bg-slate-900 p-5 flex flex-col gap-3 transition-all duration-200 hover:shadow-md hover:scale-[1.01] shadow-sm',
                      game.border
                    )}
                  >
                    {/* Top row */}
                    <div className="flex items-start justify-between">
                      <div className={cn('w-12 h-12 rounded-2xl flex items-center justify-center text-2xl flex-shrink-0', game.bg)}>
                        {game.emoji}
                      </div>
                      <div className="flex items-center gap-2 flex-wrap justify-end">
                        {game.badge && (
                          <span className={cn('text-[9px] font-black px-2 py-1 rounded-full uppercase tracking-wider', game.bg, game.color)}>
                            {game.badge}
                          </span>
                        )}
                        <span className={cn('text-[9px] font-black px-2 py-1 rounded-full uppercase tracking-wider', DIFFICULTY_COLOR[game.difficulty])}>
                          {game.difficulty}
                        </span>
                      </div>
                    </div>

                    {/* Title + description */}
                    <div>
                      <h3 className={cn('text-base font-black mb-1 group-hover:underline', game.color)}>
                        {game.label}
                      </h3>
                      <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed line-clamp-2">
                        {game.description}
                      </p>
                    </div>

                    {/* Footer */}
                    <div className="flex items-center justify-between mt-auto pt-2 border-t border-slate-100 dark:border-slate-800">
                      <div className="flex items-center gap-1.5">
                        <Zap className="w-3.5 h-3.5 text-brand-teal-400" />
                        <span className="text-xs font-bold text-slate-500 dark:text-slate-400">
                          Up to <span className="text-brand-teal-500">{game.maxPts} pts</span>
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        {lastScore !== undefined && (
                          <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10 px-2 py-0.5 rounded-full flex items-center gap-1">
                            <CheckCircle2 className="w-2.5 h-2.5" /> {lastScore} pts
                          </span>
                        )}
                        <span className={cn('flex items-center gap-1 text-xs font-black px-3 py-1.5 rounded-xl transition-all', game.bg, game.color, 'group-hover:shadow-sm')}>
                          Play <ArrowRight className="w-3 h-3" />
                        </span>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </section>

          {/* ── Recent activity ────────────────────────────────────────────── */}
          {Object.keys(recentScores).length > 0 && (
            <section className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm">
              <h2 className="text-sm font-black text-slate-800 dark:text-white uppercase tracking-wider mb-4 flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-brand-teal-500" /> Recent Scores
              </h2>
              <div className="space-y-3">
                {Object.entries(recentScores).map(([gameId, score]) => {
                  const game = GAMES.find(g => g.id === gameId);
                  if (!game) return null;
                  const pct = Math.round((score / game.maxPts) * 100);
                  return (
                    <div key={gameId} className="flex items-center gap-3">
                      <span className="text-lg w-7 flex-shrink-0">{game.emoji}</span>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">{game.label}</p>
                          <p className="text-xs font-black text-brand-teal-500">{score} / {game.maxPts} pts</p>
                        </div>
                        <div className="h-1.5 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                          <div
                            className={cn('h-full rounded-full transition-all duration-700', game.color.replace('text-', 'bg-'))}
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          )}

          {/* ── VIDEO LIBRARY ─────────────────────────────────────────────── */}
          {/* Visual separator */}
          <div className="flex items-center gap-4 pt-2">
            <div className="flex-1 h-px bg-slate-200 dark:bg-slate-800" />
            <span className="text-xs font-black text-slate-400 uppercase tracking-widest px-2">Learn</span>
            <div className="flex-1 h-px bg-slate-200 dark:bg-slate-800" />
          </div>

          {/* Video library component — fed by Jincy's Google Sheet via backend */}
          <B2CVideoLibrary />

        </main>
      </div>
    </div>
  );
}5