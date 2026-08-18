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
        // Surface — brand ink rail, matches StudentSidebar
        "bg-brand-ink rounded-2xl border border-brand-line-12 shadow-xl overflow-x-hidden",
        className
      )}
    >
      {/* ── Brand ── */}
      <div className={cn("flex items-center gap-3 mb-10", isCollapsed ? "justify-center" : "px-1")}>
        <img src={testcrackLogo} alt="TestCrack" className="h-9 w-9 object-contain shrink-0" />
        {!isCollapsed && (
          <div className="animate-in fade-in duration-200">
            <span className="font-manrope text-base font-black tracking-tight text-brand-bg">
              TestCrack
            </span>
            <p className="font-jetbrains text-[10px] font-semibold tracking-[0.12em] uppercase text-brand-on-ink-mute leading-none mt-0.5">
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
                "w-full flex items-center gap-3 rounded-xl transition-colors duration-150 group relative",
                isCollapsed ? "justify-center p-3" : "px-3 py-2.5",
                isActive
                  ? "bg-brand-mint/15 text-brand-mint"
                  : "bg-transparent text-brand-on-ink-mute hover:bg-white/5"
              )}
            >
              <item.icon className={cn(
                "h-4.5 w-4.5 shrink-0",
                isActive ? "text-brand-mint" : "text-brand-on-ink-mute"
              )} />
              {!isCollapsed && (
                <span className="font-medium text-sm leading-none animate-in fade-in duration-200">
                  {item.label}
                </span>
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
          "bg-brand-teal-600 text-white border-2 border-brand-bg",
          "shadow-md hover:bg-brand-teal-700 transition-colors"
        )}
      >
        {isCollapsed ? <ChevronRight className="h-3 w-3" /> : <ChevronLeft className="h-3 w-3" />}
      </button>

      {/* ── Bottom actions ── */}
      <div className="pt-4 border-t border-brand-line-12 space-y-1">
        <button
          onClick={handleLogout}
          title={isCollapsed ? "Logout" : undefined}
          className={cn(
            "w-full flex items-center gap-3 rounded-xl transition-colors duration-150 group",
            isCollapsed ? "justify-center p-3" : "px-3 py-2.5",
            "text-brand-on-ink-mute hover:bg-brand-warm-danger/10 hover:text-brand-warm-danger"
          )}
        >
          <LogOut className="h-4.5 w-4.5 shrink-0" />
          {!isCollapsed && (
            <span className="font-medium text-sm animate-in fade-in duration-200">Logout</span>
          )}
        </button>
      </div>
    </aside>
  );
};