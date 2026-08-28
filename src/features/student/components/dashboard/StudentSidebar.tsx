import React, { useState, useEffect } from 'react';
import {
  GraduationCap, LayoutDashboard, Mic, PenTool, Headphones,
  ClipboardCheck, History, Sparkles, Settings, LogOut,
  Timer, FileText, BookOpen, Target, Gamepad2, Lock, HelpCircle, Compass
} from "lucide-react";
import testcrackLogo from '@/assets/testcrack-logo.svg';
import { cn } from "@/shared/utils";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { callBackend } from "@/features/auth/services/authClient";
import { useNavigate, useLocation, useParams } from "react-router-dom";
import { isSpokenEnglish } from "@/features/student/utils/exam";

const BACKEND = import.meta.env.VITE_BACKEND_URL || 'http://localhost:4000';
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
  const { examSlug } = useParams();

  // Self-fetch lock state only when the parent hasn't supplied it.
  // Default true (locked) prevents a flash of unlocked sidebar while loading.
  const [selfLocked, setSelfLocked] = useState(true);
  useEffect(() => {
    if (isLockedProp !== undefined) return;
    let cancelled = false;
    callBackend(`${BACKEND}/api/student/daily-drill-state`)
      .then((res) => { if (!cancelled) setSelfLocked(!res?.dashboard_unlocked); })
      .catch(() => { /* stay locked on error */ });
    return () => { cancelled = true; };
  }, [isLockedProp]);

  const isLocked = isLockedProp ?? selfLocked;

  // Extra/bonus drills (?extra=true) are optional practice, not the mandatory
  // gate flow — navigation should stay usable during them.
  const isExtraDrill = new URLSearchParams(location.search).get('extra') === 'true';
  const isActivelyDrilling = location.pathname.includes('/drill') && !isExtraDrill;
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
    if (isLocked && itemId !== 'dashboard' && itemId !== 'how-it-works') return true;
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
        { id: 'roadmap', icon: Compass, label: 'My Roadmap', path: '/student/diagnostic/roadmap' },
        { id: 'suggestion', icon: Sparkles, label: 'Recommendations', path: '/student/suggestion' },
        { id: 'courses-section', icon: GraduationCap, label: 'My Courses', path: '/student/courses-section' },
        { id: 'Report', icon: FileText, label: 'Report', path: '/student/report' },
        { id: 'how-it-works', icon: HelpCircle, label: 'How It Works', path: '/student/how-it-works' },
      ]
    }
  ];

  // Spoken English (cohort 1): hide the IELTS-only surfaces — keep just Dashboard + How It Works.
  const SE_ALLOWED = new Set(['dashboard', 'how-it-works']);

  const filteredGroups = menuGroups.map(group => {
    if (isSpokenEnglish(examSlug)) {
      return { ...group, items: group.items.filter(item => SE_ALLOWED.has(item.id)) };
    }
    if (isNewStudent) {
      return {
        ...group,
        items: group.items.filter(item => !['games', 'suggestion', 'Report', 'roadmap'].includes(item.id))
      };
    }
    return group;
  }).filter(group => group.items.length > 0);

  // Nav item paths are authored as /student/*; rewrite the prefix to the current exam
  // slug so the primary nav goes straight to /{exam}/* (no /student/* → redirect flash).
  const toExamPath = (p: string) => (examSlug ? p.replace(/^\/student(?=\/|$)/, `/${examSlug}`) : p);

  const handleNavigation = (item: any) => {
    if (isItemDisabled(item.id)) return;
    navigate(toExamPath(item.path));
    if (onTabChange) onTabChange(item.id);
    if (window.innerWidth < RAIL_BREAKPOINT) closeSidebar();
  };

  const handleLogout = async () => {
    await signOut();
  };

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

      {/* Mobile Backdrop Overlay */}
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
          "group fixed top-4 bottom-4 z-[9999] bg-brand-ink rounded-2xl flex flex-col justify-between py-6 border border-brand-line-12 shadow-xl overflow-x-hidden",
          "transition-[width,transform] duration-300 ease-in-out",
          isLeft ? "left-4" : "right-4",
          !isOpen
            ? (isLeft ? "-translate-x-[150%]" : "translate-x-[150%]")
            : "translate-x-0",
          "md:translate-x-0 w-64 md:w-[84px]",
          canExpand && "md:hover:w-64",
          className
        )}
      >
        {/* Brand Header */}
        <div className="flex items-center px-5 mb-8 whitespace-nowrap">
          <img src={testcrackLogo} alt="TestCrack" className="h-9 w-9 object-contain shrink-0" />
          <span className={labelCls("font-manrope text-xl font-bold text-brand-bg tracking-[-0.02em]")}>
            TestCrack
          </span>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto overflow-x-hidden hide-scrollbar px-3 pb-4">
          {filteredGroups.map((group, groupIdx) => (
            <div key={groupIdx} className="mb-6">
              <div className={cn(
                "font-jetbrains text-[10px] font-bold text-brand-on-ink-mute uppercase tracking-[0.16em] mb-3 whitespace-nowrap overflow-hidden",
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
                        "transition-colors duration-150",
                        activeTab === item.id && !disabled
                          ? "bg-brand-mint/15 text-brand-mint"
                          : "bg-transparent text-brand-on-ink-mute hover:bg-white/5",
                        disabled && "opacity-40 pointer-events-none"
                      )}
                    >
                      <item.icon className={cn(
                        "h-5 w-5 shrink-0",
                        activeTab === item.id && !disabled
                          ? "text-brand-mint"
                          : "text-brand-on-ink-mute"
                      )} />

                      <span className={labelCls("font-medium text-sm text-left flex-1")}>
                        {item.label}
                      </span>

                      {disabled && (
                        <Lock className={cn(
                          "w-4 h-4 text-brand-on-ink-mute shrink-0 overflow-hidden",
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
        <div className="pt-4 px-3 border-t border-brand-line-12 space-y-1.5 shrink-0">
          <button
            onClick={() => handleNavigation({ id: 'settings', path: '/student/settings' })}
            disabled={isActivelyDrilling || isLocked}
            className={cn(
              "w-full flex items-center rounded-xl bg-transparent px-4 py-3 text-brand-on-ink-mute hover:bg-white/5 transition-colors duration-150",
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
              "w-full flex items-center rounded-xl bg-transparent px-4 py-3 text-brand-on-ink-mute hover:bg-brand-warm-danger/10 hover:text-brand-warm-danger transition-colors duration-150",
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