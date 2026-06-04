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

interface SidebarProps {
  activeTab?: string;
  onTabChange?: (tab: string) => void;
  isCollapsed: boolean;
  toggleCollapse: () => void;
  isNewStudent?: boolean;
  /** When provided by the parent (e.g. StudentDashboardPage), this value is used
   *  directly and no extra API call is made. When omitted, the sidebar fetches
   *  the lock state itself so any student page shows the correct locked sidebar. */
  isLocked?: boolean;
  onMouseEnter?: () => void;
  onMouseLeave?: () => void;
  className?: string;
}

export const StudentSidebar = ({
  activeTab = 'dashboard',
  onTabChange,
  isCollapsed,
  toggleCollapse,
  isNewStudent = false,
  isLocked: isLockedProp,
  onMouseEnter,
  onMouseLeave,
  className
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
    if (window.innerWidth < 1024) toggleCollapse(); // Close on mobile
  };

  const handleLogout = async () => {
    document.documentElement.classList.remove('dark');
    localStorage.setItem('theme', 'light'); 
    localStorage.setItem('vite-ui-theme', 'light'); 
    await signOut();
  };

  return (
    <>
      <style dangerouslySetInnerHTML={{__html: `
        .hide-scrollbar::-webkit-scrollbar { display: none; }
        .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}} />

      <aside 
        onMouseEnter={onMouseEnter}
        onMouseLeave={onMouseLeave}
        className={cn(
          "group fixed left-4 top-4 bottom-4 z-50 bg-white dark:bg-[#0B1120] rounded-2xl flex flex-col justify-between py-6 transition-[width,transform] duration-300 ease-in-out border border-slate-200 dark:border-slate-800 shadow-xl overflow-x-hidden",
          // Mobile state (hidden by default)
          isCollapsed ? "-translate-x-[150%] lg:translate-x-0" : "translate-x-0",
          // Desktop state: 84px wide, hover expands to 256px (w-64)
          "w-64 lg:w-[84px]",
          !isLocked && !isActivelyDrilling && "lg:hover:w-64",
          className
        )}
      >
        {/* Brand Header */}
        <div className="flex items-center px-5 mb-8 whitespace-nowrap">
          <div className="bg-indigo-600 p-2.5 rounded-xl shrink-0 flex items-center justify-center shadow-lg shadow-indigo-600/20">
            <GraduationCap className="h-6 w-6 text-white" />
          </div>
          <span className={cn(
            "text-xl font-bold text-slate-900 dark:text-white tracking-wide transition-all duration-300 overflow-hidden",
            "max-w-[200px] opacity-100 ml-4",
            "lg:max-w-0 lg:opacity-0 lg:ml-0",
            !isLocked && !isActivelyDrilling && "lg:group-hover:max-w-[200px] lg:group-hover:opacity-100 lg:group-hover:ml-4"
          )}>
            TestCrack
          </span>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto overflow-x-hidden hide-scrollbar px-3 pb-4">
          {filteredGroups.map((group, groupIdx) => (
            <div key={groupIdx} className="mb-6">
              <div className={cn(
                "text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3 transition-all duration-300 whitespace-nowrap overflow-hidden",
                "max-w-[200px] opacity-100 px-3",
                "lg:max-w-0 lg:opacity-0 lg:px-0",
                !isLocked && !isActivelyDrilling && "lg:group-hover:max-w-[200px] lg:group-hover:opacity-100 lg:group-hover:px-3"
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
                      className={cn(
                        "w-full flex items-center rounded-xl transition-all duration-200 px-4 py-3 relative",
                        activeTab === item.id && !disabled
                          ? "bg-indigo-600/10 text-indigo-600 dark:bg-indigo-500/20 dark:text-indigo-400" 
                          : "bg-transparent text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800",
                        disabled && "opacity-40 pointer-events-none grayscale"
                      )}
                    >
                      <item.icon className={cn(
                        "h-5 w-5 shrink-0 transition-transform",
                        activeTab === item.id && !disabled ? "text-indigo-600 dark:text-indigo-400" : "text-slate-500 group-hover:text-indigo-500"
                      )} />
                      
                      <span className={cn(
                        "font-medium text-sm whitespace-nowrap text-left flex-1 transition-all duration-300 overflow-hidden",
                        "max-w-[200px] opacity-100 ml-4",
                        "lg:max-w-0 lg:opacity-0 lg:ml-0",
                        !isLocked && !isActivelyDrilling && "lg:group-hover:max-w-[200px] lg:group-hover:opacity-100 lg:group-hover:ml-4"
                      )}>
                        {item.label}
                      </span>

                      {disabled && (
                        <Lock className={cn(
                          "w-4 h-4 text-slate-400 shrink-0 transition-all duration-300 overflow-hidden",
                          "max-w-[20px] opacity-100",
                          "lg:max-w-0 lg:opacity-0",
                          !isActivelyDrilling && "lg:group-hover:max-w-[20px] lg:group-hover:opacity-100"
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
              "w-full flex items-center rounded-xl bg-transparent px-4 py-3 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all duration-200",
              (isActivelyDrilling || isLocked) && "opacity-40 pointer-events-none grayscale"
            )}
          >
            <Settings className="h-5 w-5 shrink-0" />
            <span className={cn(
              "font-medium text-sm whitespace-nowrap transition-all duration-300 overflow-hidden",
              "max-w-[200px] opacity-100 ml-4",
              "lg:max-w-0 lg:opacity-0 lg:ml-0",
              !isLocked && !isActivelyDrilling && "lg:group-hover:max-w-[200px] lg:group-hover:opacity-100 lg:group-hover:ml-4"
            )}>Settings</span>
          </button>

          <button 
            onClick={handleLogout}
            disabled={isActivelyDrilling}
            className={cn(
              "w-full flex items-center rounded-xl bg-transparent px-4 py-3 text-slate-600 dark:text-slate-400 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-500/10 transition-all duration-200",
              isActivelyDrilling && "opacity-40 pointer-events-none grayscale"
            )}
          >
            <LogOut className="h-5 w-5 shrink-0" />
            <span className={cn(
              "font-medium text-sm whitespace-nowrap transition-all duration-300 overflow-hidden",
              "max-w-[200px] opacity-100 ml-4",
              "lg:max-w-0 lg:opacity-0 lg:ml-0",
              !isLocked && !isActivelyDrilling && "lg:group-hover:max-w-[200px] lg:group-hover:opacity-100 lg:group-hover:ml-4"
            )}>Logout</span>
          </button>
        </div>
      </aside>
    </>
  );
};