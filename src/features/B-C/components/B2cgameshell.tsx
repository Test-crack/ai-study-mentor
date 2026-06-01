// FILE: src/features/b2c/components/B2CGameShell.tsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import B2CSidebar from './B2csidebar';
import B2CTopbar  from './B2ctopbar';
import { cn } from '@/shared/utils';

interface B2CGameShellProps {
  children: React.ReactNode;
  title:    string;
  emoji:    string;
}

export default function B2CGameShell({ children, title, emoji }: B2CGameShellProps) {
  const navigate = useNavigate();
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(true);
  const [isSidebarHovered,   setIsSidebarHovered]   = useState(false);
  const [darkMode,           setDarkMode]           = useState(false);

  const email    = sessionStorage.getItem('b2c_email') || 'student@example.com';
  const streak   = parseInt(sessionStorage.getItem('b2c_streak')   || '3',  10);
  const momentum = parseInt(sessionStorage.getItem('b2c_momentum') || '920', 10);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', darkMode);
  }, [darkMode]);

  const sidebarWidth = isSidebarHovered ? 'md:pl-[240px]' : 'md:pl-[72px]';

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
        <main className="flex-1 p-4 sm:p-6 max-w-3xl mx-auto w-full">
          <button
            onClick={() => navigate('/b2c/dashboard')}
            className="flex items-center gap-2 text-slate-500 hover:text-slate-800 dark:hover:text-white mb-6 transition-colors text-sm font-medium"
          >
            <ArrowLeft className="w-4 h-4" /> Back to Dashboard
          </button>
          <div className="flex items-center gap-3 mb-6">
            <span className="text-3xl">{emoji}</span>
            <h1 className="text-2xl font-black text-slate-800 dark:text-white">{title}</h1>
          </div>
          {children}
        </main>
      </div>
    </div>
  );
}