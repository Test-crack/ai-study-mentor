// src/features/Instructor/dashboard/InstructorSidebar.tsx
import {
  LayoutDashboard, LogOut, ClipboardCheck,
  ChevronLeft, ChevronRight, Laptop, Home, GitMerge, Workflow,
  Settings, BarChart3, Layers
} from "lucide-react";
import testcrackLogo from '@/assets/testcrack-logo.svg';
import { cn } from "@/shared/utils";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { useNavigate, useLocation } from "react-router-dom";

interface SidebarProps {
  activeTab?: string;
  onTabChange?: (tab: string) => void;
  isCollapsed: boolean;
  toggleCollapse: () => void;
  className?: string;
}

export const InstructorSidebar = ({ activeTab = 'dashboard', onTabChange, isCollapsed, toggleCollapse, className }: SidebarProps) => {
  const { signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const menuItems = [
    { id: 'dashboard',   icon: LayoutDashboard, label: 'Dashboard',           path: '/instructor/dashboard' },
    { id: 'batches',     icon: Layers,          label: 'Batch Management',    path: '/instructor/batches' },
    { id: 'assessments', icon: ClipboardCheck,  label: 'Student Assessments', path: '/instructor/assessments' },
    { id: 'report',      icon: BarChart3,       label: 'Report',              path: '/instructor/reports' },
    { id: 'settings',    icon: Settings,        label: 'Settings',            path: '/profile' },
    { id: 'work',        icon: Workflow,        label: 'Workflow',            path: '/instructor/workflow' },
  ];

  const resolvedActiveTab =
    menuItems.find(item =>
      location.pathname === item.path ||
      location.pathname.startsWith(item.path + '/')
    )?.id ?? activeTab;

  const handleNavigation = (item: typeof menuItems[0]) => {
    navigate(item.path);
    if (onTabChange) onTabChange(item.id);
  };

  const handleLogout = async () => {
    document.documentElement.classList.remove('dark');
    localStorage.setItem('theme', 'light');
    localStorage.setItem('vite-ui-theme', 'light');
    await signOut();
  };

  return (
    <aside
      className={cn(
        // Structure
        "fixed left-4 top-4 bottom-4 z-40 hidden lg:flex flex-col justify-between py-6",
        "transition-all duration-300",
        isCollapsed ? "w-20 px-3" : "w-64 px-4",
        // Light surface
        "bg-white border border-slate-200/70 rounded-2xl",
        "shadow-[0_4px_24px_-4px_rgba(15,23,42,0.08)]",
        // Dark surface
        "dark:bg-[#0D0D14] dark:border-white/[0.05]",
        "dark:shadow-[0_4px_32px_rgba(0,0,0,0.5)]",
        className
      )}
    >
      {/* ── Brand ── */}
      <div className={cn("flex items-center gap-3 mb-10", isCollapsed ? "justify-center" : "px-1")}>
        <img src={testcrackLogo} alt="TestCrack" className="h-9 w-9 object-contain shrink-0" />
        {!isCollapsed && (
          <div className="animate-in fade-in duration-200">
            <span className="text-base font-black tracking-tight text-slate-900 dark:text-white">
              TestCrack
            </span>
            <p className="text-[10px] font-semibold tracking-[0.12em] uppercase text-slate-400 dark:text-slate-500 leading-none mt-0.5">
              Instructor
            </p>
          </div>
        )}
      </div>

      {/* ── Navigation ── */}
      <nav className="flex-1 space-y-1">
        {menuItems.map((item) => {
          const isActive = resolvedActiveTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => handleNavigation(item)}
              title={isCollapsed ? item.label : undefined}
              className={cn(
                "w-full flex items-center gap-3 rounded-xl transition-all duration-200 group relative",
                isCollapsed ? "justify-center p-3" : "px-3 py-2.5",
                isActive
                  ? [
                      // Light active
                      "bg-brand-teal-600 text-white",
                      "shadow-[0_4px_14px_-2px_rgba(99,102,241,0.5)]",
                      // Dark active
                      "dark:bg-brand-teal-500/15 dark:text-brand-teal-300",
                      "dark:shadow-[0_0_20px_rgba(99,102,241,0.15)]",
                      "dark:border dark:border-brand-teal-500/20",
                    ].join(" ")
                  : [
                      // Light inactive
                      "text-slate-600 hover:bg-slate-50 hover:text-brand-teal-600",
                      // Dark inactive
                      "dark:text-slate-400 dark:hover:bg-white/[0.04] dark:hover:text-slate-100",
                    ].join(" ")
              )}
            >
              <item.icon className={cn(
                "h-4.5 w-4.5 shrink-0 transition-transform duration-200 group-hover:scale-105",
                isActive
                  ? "text-white dark:text-brand-teal-300"
                  : "text-slate-400 group-hover:text-brand-teal-500 dark:group-hover:text-slate-200"
              )} />
              {!isCollapsed && (
                <span className="font-medium text-sm leading-none animate-in fade-in duration-200">
                  {item.label}
                </span>
              )}
              {/* Active pill indicator in dark mode */}
              {isActive && !isCollapsed && (
                <span className="hidden dark:block absolute right-3 h-1.5 w-1.5 rounded-full bg-brand-teal-400" />
              )}
            </button>
          );
        })}
      </nav>

      {/* ── Collapse toggle ── */}
      <button
        onClick={toggleCollapse}
        className={cn(
          "absolute -right-3 top-1/2 -translate-y-1/2 z-50",
          "h-6 w-6 grid place-items-center rounded-full",
          "bg-brand-teal-600 text-white border-2",
          "border-white dark:border-[#0D0D14]",
          "shadow-md hover:bg-brand-teal-700 transition-colors"
        )}
      >
        {isCollapsed ? <ChevronRight className="h-3 w-3" /> : <ChevronLeft className="h-3 w-3" />}
      </button>

      {/* ── Bottom actions ── */}
      <div className={cn(
        "pt-4 border-t space-y-1",
        "border-slate-200/70 dark:border-white/[0.05]"
      )}>
        <button
          onClick={handleLogout}
          title={isCollapsed ? "Logout" : undefined}
          className={cn(
            "w-full flex items-center gap-3 rounded-xl transition-all duration-200 group",
            isCollapsed ? "justify-center p-3" : "px-3 py-2.5",
            "text-slate-500 dark:text-slate-500",
            "hover:bg-rose-50 hover:text-rose-600",
            "dark:hover:bg-rose-500/[0.08] dark:hover:text-rose-400"
          )}
        >
          <LogOut className="h-4.5 w-4.5 shrink-0 group-hover:translate-x-0.5 transition-transform" />
          {!isCollapsed && (
            <span className="font-medium text-sm animate-in fade-in duration-200">Logout</span>
          )}
        </button>
      </div>
    </aside>
  );
};