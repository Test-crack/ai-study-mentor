
import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Gamepad2, LayoutDashboard, Trophy, Flame, Zap,
  Settings, LogOut, ChevronRight, Menu
} from 'lucide-react';
import { cn } from '@/shared/utils';

interface B2CSidebarProps {
  isCollapsed:    boolean;
  toggleCollapse: () => void;
  onMouseEnter?:  () => void;
  onMouseLeave?:  () => void;
  streak:         number;
  momentum:       number;
}

const GAMES = [
  { id: 'lexigrid',        label: 'LexiGrid',         emoji: '🔤', path: '/b2c/game/lexigrid',         badge: 'Fan fav'   },
  { id: 'trap-spotter',    label: 'Trap Spotter',     emoji: '🎯', path: '/b2c/game/trap-spotter',     badge: 'New'       },
  { id: 'band-ladder',     label: 'Band Ladder',      emoji: '🪜', path: '/b2c/game/band-ladder',      badge: null        },
  { id: 'sentence-surgery',label: 'Sentence Surgery', emoji: '✂️', path: '/b2c/game/sentence-surgery', badge: null        },
  { id: 'inference-sprint',label: 'Inference Sprint', emoji: '⚡', path: '/b2c/game/inference-sprint', badge: 'Hot'       },
  { id: 'connector-chain', label: 'Connector Chain',  emoji: '🔗', path: '/b2c/game/connector-chain',  badge: null        },
];

export default function B2CSidebar({
  isCollapsed,
  toggleCollapse,
  onMouseEnter,
  onMouseLeave,
  streak,
  momentum,
}: B2CSidebarProps) {
  const navigate  = useNavigate();
  const location  = useLocation();

  const isActive = (path: string) => location.pathname === path;

  // Auto-close the sidebar on mobile after navigating
  const handleNavigation = (path: string) => {
    navigate(path);
    if (window.innerWidth < 768 && !isCollapsed) {
      toggleCollapse();
    }
  };

  return (
    <>
      {/* ── Mobile Backdrop ── */}
      {!isCollapsed && (
        <div
          className="md:hidden fixed inset-0 z-20 bg-slate-900/50 backdrop-blur-sm transition-opacity"
          onClick={toggleCollapse}
          aria-hidden="true"
        />
      )}

      {/* ── Mobile Toggle Tab (Visible only when closed on mobile) ── */}
      {isCollapsed && (
        <button
          onClick={toggleCollapse}
          className="md:hidden fixed top-1/2 left-0 -translate-y-1/2 z-40 py-3 px-1.5 bg-indigo-500/90 hover:bg-indigo-600 text-white rounded-r-xl shadow-lg border border-l-0 border-indigo-400 backdrop-blur-sm transition-transform flex items-center"
          aria-label="Open navigation"
        >
          <Menu className="w-5 h-5" />
        </button>
      )}

      {/* ── Sidebar ── */}
      <aside
        onMouseEnter={onMouseEnter}
        onMouseLeave={onMouseLeave}
        className={cn(
          'fixed left-0 top-0 h-full z-30 flex flex-col bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 transition-all duration-300 ease-in-out shadow-sm',
          // Desktop sizing & positioning
          'md:translate-x-0',
          isCollapsed ? 'md:w-[72px]' : 'md:w-[240px]',
          // Mobile sizing & off-canvas drawer behavior
          'max-md:w-[240px]',
          isCollapsed ? 'max-md:-translate-x-full' : 'max-md:translate-x-0'
        )}
      >
        {/* ── Logo ── */}
        <div className="flex items-center gap-3 px-4 py-5 border-b border-slate-100 dark:border-slate-800">
          <div className="flex-shrink-0 w-9 h-9 bg-indigo-500 rounded-xl flex items-center justify-center shadow-sm">
            <Gamepad2 className="w-4.5 h-4.5 text-white" />
          </div>
          {!isCollapsed && (
            <div className="overflow-hidden">
              <p className="text-slate-800 dark:text-white font-black text-sm leading-none">TestCrack</p>
              <p className="text-indigo-400 text-[10px] font-bold tracking-widest uppercase mt-0.5">Games</p>
            </div>
          )}
        </div>

        {/* ── Stats strip ── */}
        {!isCollapsed && (
          <div className="mx-3 mt-3 mb-1 flex gap-2">
            <div className="flex-1 flex items-center gap-1.5 bg-orange-50 dark:bg-orange-500/10 rounded-lg px-2.5 py-2">
              <Flame className="w-3.5 h-3.5 text-orange-500 flex-shrink-0" />
              <div>
                <p className="text-[9px] font-bold text-orange-400 uppercase tracking-wider leading-none">Streak</p>
                <p className="text-sm font-black text-orange-600 dark:text-orange-400 leading-none">{streak}d</p>
              </div>
            </div>
            <div className="flex-1 flex items-center gap-1.5 bg-indigo-50 dark:bg-indigo-500/10 rounded-lg px-2.5 py-2">
              <Zap className="w-3.5 h-3.5 text-indigo-500 flex-shrink-0" />
              <div>
                <p className="text-[9px] font-bold text-indigo-400 uppercase tracking-wider leading-none">Pts</p>
                <p className="text-sm font-black text-indigo-600 dark:text-indigo-400 leading-none">{momentum}</p>
              </div>
            </div>
          </div>
        )}

        {/* ── Navigation ── */}
        <nav className="flex-1 overflow-y-auto px-2 py-3 space-y-0.5">
          {/* Dashboard link */}
          <button
            onClick={() => handleNavigation('/b2c/dashboard')}
            className={cn(
              'w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all text-left group',
              isActive('/b2c/dashboard')
                ? 'bg-indigo-500 text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            )}
          >
            <LayoutDashboard className="w-4 h-4 flex-shrink-0" />
            {!isCollapsed && <span className="text-sm font-semibold truncate">Dashboard</span>}
          </button>

          {/* Leaderboard */}
          <button
            onClick={() => handleNavigation('/b2c/leaderboard')}
            className={cn(
              'w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all text-left',
              isActive('/b2c/leaderboard')
                ? 'bg-indigo-500 text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            )}
          >
            <Trophy className="w-4 h-4 flex-shrink-0" />
            {!isCollapsed && <span className="text-sm font-semibold truncate">Leaderboard</span>}
          </button>

          {/* Games section */}
          {!isCollapsed && (
            <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest px-3 pt-4 pb-1">
              Games
            </p>
          )}

          {GAMES.map(game => (
            <button
              key={game.id}
              onClick={() => handleNavigation(game.path)}
              className={cn(
                'w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all text-left group',
                isActive(game.path)
                  ? 'bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
              )}
            >
              <span className="text-base flex-shrink-0 leading-none">{game.emoji}</span>
              {!isCollapsed && (
                <div className="flex items-center justify-between flex-1 min-w-0">
                  <span className="text-sm font-medium truncate">{game.label}</span>
                  {game.badge && (
                    <span className="text-[9px] font-black bg-indigo-100 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 px-1.5 py-0.5 rounded-full uppercase tracking-wider flex-shrink-0">
                      {game.badge}
                    </span>
                  )}
                </div>
              )}
            </button>
          ))}
        </nav>

        {/* ── Footer ── */}
        <div className="px-2 py-3 border-t border-slate-100 dark:border-slate-800 space-y-0.5">
          <button className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all text-left">
            <Settings className="w-4 h-4 flex-shrink-0" />
            {!isCollapsed && <span className="text-sm font-medium">Settings</span>}
          </button>
          <button
            onClick={() => handleNavigation('/b2c/login')}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-slate-500 dark:text-slate-400 hover:bg-rose-50 dark:hover:bg-rose-500/10 hover:text-rose-500 transition-all text-left"
          >
            <LogOut className="w-4 h-4 flex-shrink-0" />
            {!isCollapsed && <span className="text-sm font-medium">Sign out</span>}
          </button>

          {/* Collapse toggle */}
          <button
            onClick={toggleCollapse}
            className="w-full flex items-center justify-center py-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
          >
            <ChevronRight className={cn('w-4 h-4 transition-transform duration-300', !isCollapsed && 'rotate-180')} />
          </button>
        </div>
      </aside>
    </>
  );
}

