import React, { useState, useEffect } from 'react';
import {
  GraduationCap, LayoutDashboard, Mic, PenTool, Headphones,
  ClipboardCheck, History, Sparkles, Settings, LogOut,
  Timer, FileText, BookOpen, Target, Gamepad2, Lock
} from "lucide-react";
import { cn } from "@/shared/utils";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { callBackend } from "@/features/auth/services/authClient";
import { useNavigate, useLocation } from "react-router-dom";

const BACKEND = import.meta.env.VITE_BACKEND_URL || 'http://localhost:4000';
// Desktop/tablet rail kicks in at md (768px) so iPad Mini (768) and iPad Air (820)
// get the icon rail instead of an unreachable mobile drawer.
const RAIL_BREAKPOINT = 768;

interface SidebarProps {
  activeTab?: string;
  onTabChange?: (tab: string) => void;
  isCollapsed?: boolean;
  toggleCollapse?: () => void;
  isNewStudent?: boolean;
  isLocked?: boolean;
  onMouseEnter?: () => void;
  onMouseLeave?: () => void;
  className?: string;
  alignment?: 'left' | 'right';
}

export const StudentSidebar = ({
  activeTab = 'dashboard',
  onTabChange,
  isNewStudent = false,
  isLocked: isLockedProp,
  onMouseEnter,
  onMouseLeave,
  className,
  alignment = 'left'
}: SidebarProps) => {
  const { signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Self-fetch lock state only when the parent hasn't supplied it.
  // Default true (locked) prevents a flash of unlocked sidebar while loading.
  const [selfLocked, setSelfLocked] = useState(true);
  useEffect(() => {
    if (isLockedProp !== undefined) return;   // parent owns the value — skip fetch
    let cancelled = false;
    callBackend(`${BACKEND}/api/student/daily-drill-state`)
      .then((res) => { if (!cancelled) setSelfLocked(!res?.dashboard_unlocked); })
      .catch(() => { /* stay locked on error */ });
    return () => { cancelled = true; };
  }, [isLockedProp]);

  const isLocked = isLockedProp ?? selfLocked;


  const isActivelyDrilling = location.pathname.includes('/drill');
  const isLeft = alignment === 'left';
  const canExpand = !isLocked && !isActivelyDrilling;

  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const handleSync = (e: any) => {
      if (e.detail !== undefined) setIsOpen(e.detail.isOpen);
    };
    window.addEventListener('sidebar-sync', handleSync);
    return () => window.removeEventListener('sidebar-sync', handleSync);
  }, []);

  const closeSidebar = () => {
    setIsOpen(false);
    window.dispatchEvent(new CustomEvent('sidebar-sync', { detail: { isOpen: false } }));
  };

  const isItemDisabled = (itemId: string) => {
    if (isActivelyDrilling) return true;
    if (isLocked && itemId !== 'dashboard') return true;
    return false;
  };

  const menuGroups = [
    {
      title: "Core",
      items: [
        { id: 'dashboard', icon: LayoutDashboard, label: 'Dashboard', path: '/student/dashboard' },
        { id: 'games', icon: Gamepad2, label: 'Daily Challenge', path: '/student/lexigrid' },
      ]
    },
    {
      title: "Assessments",
      items: [
        { id: 'internal', icon: Target, label: 'Mid-Week Assessment', path: '/student/internal' },
        { id: 'full mock', icon: ClipboardCheck, label: 'Full Mock Test', path: '/student/mock' },
        { id: 'assessment-history', icon: History, label: 'History', path: '/student/assessment-history' },
      ]
    },
    {
      title: "Extra Practice",
      items: [
        { id: 'listening', icon: Headphones, label: 'Listening', path: '/student/listening' },
        { id: 'reading', icon: BookOpen, label: 'Reading', path: '/student/reading' },
        { id: 'writing', icon: PenTool, label: 'Writing', path: '/student/writing' },
        { id: 'speaking-assessment', icon: Mic, label: 'Speaking', path: '/student/speaking-assessment' },
        { id: 'speed', icon: Timer, label: 'Speed Reading', path: '/student/speed' },
      ]
    },
    {
      title: "Resources",
      items: [
        { id: 'suggestion', icon: Sparkles, label: 'Recommendations', path: '/student/suggestion' },
        { id: 'courses-section', icon: GraduationCap, label: 'My Courses', path: '/student/courses-section' },
        { id: 'Report', icon: FileText, label: 'Report', path: '/student/report' },
      ]
    }
  ];

  const filteredGroups = menuGroups.map(group => {
    if (isNewStudent) {
      return {
        ...group,
        items: group.items.filter(item => !['games', 'suggestion', 'Report'].includes(item.id))
      };
    }
    return group;
  }).filter(group => group.items.length > 0);

  const handleNavigation = (item: any) => {
    if (isItemDisabled(item.id)) return;
    navigate(item.path);
    if (onTabChange) onTabChange(item.id);
    if (window.innerWidth < RAIL_BREAKPOINT) closeSidebar(); // only auto-close in drawer mode
  };

  const handleLogout = async () => {
    document.documentElement.classList.remove('dark');
    localStorage.setItem('theme', 'light');
    localStorage.setItem('vite-ui-theme', 'light');
    await signOut();
  };

  // Hover-expand label: transitions ONLY layout/opacity props it needs,
  // so lock-state changes elsewhere don't trigger animated repaints.
  const labelCls = (extra?: string) => cn(
    "whitespace-nowrap overflow-hidden",
    "transition-[max-width,opacity,margin] duration-200 ease-out",
    "max-w-[200px] opacity-100 ml-4",
    "md:max-w-0 md:opacity-0 md:ml-0",
    canExpand && "md:group-hover:max-w-[200px] md:group-hover:opacity-100 md:group-hover:ml-4",
    extra
  );

  return (
    <>
      <style dangerouslySetInnerHTML={{__html: `
        .hide-scrollbar::-webkit-scrollbar { display: none; }
        .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}} />

      {/* Mobile Backdrop Overlay (phones only — tablets get the rail) */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-[9998] md:hidden transition-opacity duration-300"
          onClick={closeSidebar}
          aria-hidden="true"
        />
      )}

      <aside
        onMouseEnter={onMouseEnter}
        onMouseLeave={onMouseLeave}
        className={cn(
          "group fixed top-4 bottom-4 z-[9999] bg-white dark:bg-[#0B1120] rounded-2xl flex flex-col justify-between py-6 border border-slate-200 dark:border-slate-800 shadow-xl overflow-x-hidden",
          "transition-[width,transform] duration-300 ease-in-out",

          isLeft ? "left-4" : "right-4",

          // Drawer behaviour below md only
          !isOpen
            ? (isLeft ? "-translate-x-[150%]" : "translate-x-[150%]")
            : "translate-x-0",

          // From md (768px) up: always-visible icon rail, hover to expand
          "md:translate-x-0 w-64 md:w-[84px]",
          canExpand && "md:hover:w-64",

          className
        )}
      >
        {/* Brand Header */}
        <div className="flex items-center px-5 mb-8 whitespace-nowrap">
          <div className="bg-indigo-600 p-2.5 rounded-xl shrink-0 flex items-center justify-center shadow-lg shadow-indigo-600/20">
            <GraduationCap className="h-6 w-6 text-white" />
          </div>
          <span className={labelCls("text-xl font-bold text-slate-900 dark:text-white tracking-wide")}>
            TestCrack
          </span>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto overflow-x-hidden hide-scrollbar px-3 pb-4">
          {filteredGroups.map((group, groupIdx) => (
            <div key={groupIdx} className="mb-6">
              <div className={cn(
                "text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3 whitespace-nowrap overflow-hidden",
                "transition-[max-width,opacity,padding] duration-200 ease-out",
                "max-w-[200px] opacity-100 px-3",
                "md:max-w-0 md:opacity-0 md:px-0",
                canExpand && "md:group-hover:max-w-[200px] md:group-hover:opacity-100 md:group-hover:px-3"
              )}>
                {group.title}
              </div>

              <div className="space-y-1.5">
                {group.items.map((item) => {
                  const disabled = isItemDisabled(item.id);
                  return (
                    <button
                      key={item.id}
                      onClick={() => handleNavigation(item)}
                      disabled={disabled}
                      aria-disabled={disabled}
                      className={cn(
                        "w-full flex items-center rounded-xl px-4 py-3 relative",
                        // Only colors animate on hover; disabled state snaps instantly
                        "transition-colors duration-150",
                        activeTab === item.id && !disabled
                          ? "bg-indigo-600/10 text-indigo-600 dark:bg-indigo-500/20 dark:text-indigo-400"
                          : "bg-transparent text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800",
                        // No grayscale filter (expensive repaint) and no transition on opacity
                        disabled && "opacity-40 pointer-events-none"
                      )}
                    >
                      <item.icon className={cn(
                        "h-5 w-5 shrink-0",
                        activeTab === item.id && !disabled
                          ? "text-indigo-600 dark:text-indigo-400"
                          : "text-slate-500"
                      )} />

                      <span className={labelCls("font-medium text-sm text-left flex-1")}>
                        {item.label}
                      </span>

                      {disabled && (
                        <Lock className={cn(
                          "w-4 h-4 text-slate-400 shrink-0 overflow-hidden",
                          "transition-[max-width,opacity] duration-200",
                          "max-w-[20px] opacity-100",
                          "md:max-w-0 md:opacity-0",
                          "md:group-hover:max-w-[20px] md:group-hover:opacity-100"
                        )} />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        {/* Bottom Actions */}
        <div className="pt-4 px-3 border-t border-slate-200 dark:border-slate-800 space-y-1.5 shrink-0">
          <button
            onClick={() => handleNavigation({ id: 'settings', path: '/student/settings' })}
            disabled={isActivelyDrilling || isLocked}
            className={cn(
              "w-full flex items-center rounded-xl bg-transparent px-4 py-3 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors duration-150",
              (isActivelyDrilling || isLocked) && "opacity-40 pointer-events-none"
            )}
          >
            <Settings className="h-5 w-5 shrink-0" />
            <span className={labelCls("font-medium text-sm")}>Settings</span>
          </button>

          <button
            onClick={handleLogout}
            disabled={isActivelyDrilling}
            className={cn(
              "w-full flex items-center rounded-xl bg-transparent px-4 py-3 text-slate-600 dark:text-slate-400 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-500/10 transition-colors duration-150",
              isActivelyDrilling && "opacity-40 pointer-events-none"
            )}
          >
            <LogOut className="h-5 w-5 shrink-0" />
            <span className={labelCls("font-medium text-sm")}>Logout</span>
          </button>
        </div>
      </aside>
    </>
  );
};