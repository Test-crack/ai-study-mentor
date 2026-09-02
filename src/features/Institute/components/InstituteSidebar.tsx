// src/features/Institute/components/InstituteSidebar.tsx
import {
  LayoutDashboard,
  BookOpen,
  Users,
  Layers,
  UserPlus,
  UserCheck,
  Settings,
  CreditCard,
  LogOut,
  GraduationCap,
  ChevronLeft,
  ChevronRight,
  Home,
  BarChart3,
  FileText,
  ArrowLeftRight,
  ClipboardList
} from "lucide-react";
import testcrackLogo from '@/assets/testcrack-logo.svg';
import { cn } from "@/shared/utils";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { useNavigate } from "react-router-dom";

interface SidebarProps {
  activeTab?: string;
  onTabChange?: (tab: string) => void;
  isCollapsed: boolean;
  toggleCollapse: () => void;
  className?: string;
}

export const InstituteSidebar = ({ activeTab = 'dashboard', onTabChange, isCollapsed, toggleCollapse, className }: SidebarProps) => {
  const { signOut, profile } = useAuth();
  const navigate = useNavigate();
  
  const menuItems = [
    { id: 'dashboard', icon: LayoutDashboard, label: 'Dashboard', path: '/institute-admin/dashboard' },
    { id: 'batches', icon: Layers, label: 'Batch Allocation', path: '/institute-admin/batches' },
    { id: 'tutor', icon: Users, label: 'Tutor Accounts', path: '/institute-admin/tutor' },
    { id: 'tutor-onboard', icon: UserPlus, label: 'Tutor Onboarding', path: '/institute-admin/tutorOnboarding' },
    { id: 'students', icon: GraduationCap, label: 'Students', path: '/institute-admin/students' },
    { id: 'students-onboard', icon: UserCheck, label: 'Student Onboarding', path: '/institute-admin/studentOnboarding' },
    { id: 'assessments', icon: ClipboardList, label: 'Assessments', path: '/institute-admin/assessments' },
    { id: 'reports', icon: BarChart3, label: 'Reports', path: '/institute-admin/reports' },
    // { id: 'billings', icon: CreditCard, label: 'Billings & Plans', path: '/institute-admin/billings' },
    { id: 'settings', icon: Settings, label: 'Institute Setting', path: '/institute-admin/Setting' },
  ];

  const handleNavigation = (item: typeof menuItems[0]) => {
    navigate(item.path);
    if (onTabChange) {
      onTabChange(item.id);
    }
  };

  // Custom logout handler to reset the theme /institute-Setting
  const handleLogout = async () => {
    // 1. Force the theme back to light mode by removing the Tailwind 'dark' class
    document.documentElement.classList.remove('dark');
    
    // 2. (Optional) Update local storage if your theme provider relies on it
    localStorage.setItem('theme', 'light'); 
    localStorage.setItem('vite-ui-theme', 'light'); // Common if using shadcn/vite standard theme providers
    
    // 3. Proceed with the normal sign out
    await signOut();
  };

  return (
    <aside
      className={cn(
        "fixed left-4 top-4 bottom-4 bg-brand-ink rounded-2xl border border-brand-line-12 shadow-xl overflow-x-hidden flex flex-col py-5 z-40 hidden lg:flex transition-all duration-300",
        isCollapsed ? "w-20 px-2" : "w-64 px-4",
        className
      )}
    >
      {/* Brand */}
      <div className={cn("flex items-center gap-3 mb-6 shrink-0", isCollapsed ? "justify-center px-0" : "px-2")}>
        <img src={testcrackLogo} alt="TestCrack" className="h-9 w-9 object-contain shrink-0" />
        {!isCollapsed && (
          <div className="animate-in fade-in duration-300 min-w-0">
            <span className="font-manrope text-base font-black tracking-tight text-brand-bg block truncate">
              TestCrack
            </span>
            <p className="font-jetbrains text-[10px] font-semibold tracking-[0.12em] uppercase text-brand-on-ink-mute leading-none mt-0.5">
              Institute Admin
            </p>
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1.5 overflow-y-auto overflow-x-hidden pr-2 -mr-2 [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-white/10 [&::-webkit-scrollbar-track]:bg-transparent">
        {menuItems.map((item) => (
          <button
            key={item.id}
            onClick={() => handleNavigation(item)}
            title={isCollapsed ? item.label : undefined}
            className={cn(
              "w-full flex items-center gap-3 rounded-xl transition-colors duration-150 group relative",
              isCollapsed ? "justify-center p-3" : "px-4 py-3",
              activeTab === item.id
                ? "bg-brand-mint/15 text-brand-mint"
                : "bg-transparent text-brand-on-ink-mute hover:bg-white/5"
            )}
          >
            <item.icon className={cn(
              "h-5 w-5 shrink-0",
              activeTab === item.id ? "text-brand-mint" : "text-brand-on-ink-mute"
            )} />
            {!isCollapsed && (
              <span className="font-medium text-sm animate-in fade-in duration-200">{item.label}</span>
            )}
          </button>
        ))}
      </nav>

      {/* Back to Owner Portal — only visible to INSTITUTE_OWNER users who switched into Admin View */}
      {profile?.role === 'INSTITUTE_OWNER' && (
        <div className={cn("mt-4 mb-2 shrink-0")}>
          <button
            onClick={() => navigate('/institute-owner/dashboard')}
            title={isCollapsed ? "Back to Owner Portal" : undefined}
            className={cn(
              "w-full flex items-center gap-3 rounded-xl transition-colors duration-150 group",
              isCollapsed ? "justify-center p-3" : "px-4 py-3",
              "bg-brand-teal-500/15 text-brand-teal-300 border border-brand-teal-500/25",
              "hover:bg-brand-teal-500/25"
            )}
          >
            <ArrowLeftRight className="h-4 w-4 shrink-0" />
            {!isCollapsed && (
              <span className="font-semibold text-sm">Back to Owner Portal</span>
            )}
          </button>
        </div>
      )}

      {/* Collapse Toggle */}
      <button
        onClick={toggleCollapse}
        className="absolute -right-3 top-1/2 -translate-y-1/2 bg-brand-teal-600 text-white p-1.5 rounded-full shadow-md hover:bg-brand-teal-700 transition-colors z-50 border-2 border-brand-bg"
      >
        {isCollapsed ? <ChevronRight className="h-3 w-3" /> : <ChevronLeft className="h-3 w-3" />}
      </button>

      {/* Bottom Actions */}
      <div className={cn("pt-4 mt-2 border-t border-brand-line-12 shrink-0", isCollapsed ? "px-0" : "px-0")}>
        <button
          onClick={handleLogout}
          title={isCollapsed ? "Logout" : undefined}
          className={cn(
            "w-full flex items-center gap-3 rounded-xl text-brand-on-ink-mute hover:bg-brand-warm-danger/10 hover:text-brand-warm-danger transition-colors duration-150 group",
            isCollapsed ? "justify-center p-3" : "px-4 py-3"
          )}
        >
          <LogOut className="h-5 w-5 shrink-0" />
          {!isCollapsed && <span className="font-medium text-sm">Logout</span>}
        </button>
      </div>
    </aside>
  );
};