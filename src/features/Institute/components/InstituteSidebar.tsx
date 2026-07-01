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
  ArrowLeftRight
} from "lucide-react";
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
    // { id: 'billings', icon: CreditCard, label: 'Billings & Plans', path: '/institute-admin/billings' }, 
    // { id: 'report', icon: BarChart3, label: 'Report', path: '/institute-admin/reports' },
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
        "fixed left-4 top-4 bottom-4 bg-white dark:bg-[#0D0D14] rounded-2xl shadow-[0_2px_12px_-4px_rgba(15,23,42,0.08)] dark:shadow-none flex flex-col py-5 z-40 hidden lg:flex transition-all duration-300 border border-slate-200/70 dark:border-white/[0.05]",
        isCollapsed ? "w-20 px-2" : "w-64 px-4",
        className
      )}
    >
      {/* Brand */}
      <div className={cn("flex items-center gap-3 mb-6 shrink-0", isCollapsed ? "justify-center px-0" : "px-2")}>
        <div className="bg-indigo-600 p-2 rounded-lg shrink-0 shadow-md shadow-indigo-500/20">
          <GraduationCap className="h-6 w-6 text-white" />
        </div>
        {!isCollapsed && (
          <span className="text-xl font-bold text-slate-900 dark:text-white tracking-wide animate-in fade-in duration-300">
            Institute Admin Portal
          </span>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1.5 overflow-y-auto overflow-x-hidden pr-2 -mr-2 [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-slate-200 dark:[&::-webkit-scrollbar-thumb]:bg-white/10 [&::-webkit-scrollbar-track]:bg-transparent">
        {menuItems.map((item) => (
          <button
            key={item.id}
            onClick={() => handleNavigation(item)}
            title={isCollapsed ? item.label : undefined}
            className={cn(
              "w-full flex items-center gap-3 rounded-xl transition-all duration-200 group relative",
              isCollapsed ? "justify-center p-3" : "px-4 py-3",
              activeTab === item.id 
                ? "bg-indigo-600 text-white shadow-md dark:bg-indigo-500/15 dark:text-indigo-300 dark:border dark:border-indigo-500/20 dark:shadow-[0_0_20px_rgba(99,102,241,0.15)]" 
                : "text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-white/[0.04] hover:text-indigo-600 dark:hover:text-white"
            )}
          >
            <item.icon className={cn(
              "h-5 w-5 transition-transform group-hover:scale-105 shrink-0",
              activeTab === item.id ? "text-white dark:text-indigo-300" : "text-slate-400 group-hover:text-indigo-600 dark:group-hover:text-white"
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
              "w-full flex items-center gap-3 rounded-xl transition-all duration-200 group",
              isCollapsed ? "justify-center p-3" : "px-4 py-3",
              "bg-indigo-50 dark:bg-indigo-500/15 text-indigo-700 dark:text-indigo-300",
              "hover:bg-indigo-100 dark:hover:bg-indigo-500/20 border border-indigo-200 dark:border-indigo-500/20"
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
        className="absolute -right-3 top-1/2 -translate-y-1/2 bg-indigo-600 text-white p-1.5 rounded-full shadow-lg hover:bg-indigo-700 transition-colors z-50 border-2 border-slate-50 dark:border-[#0A0A0F]"
      >
        {isCollapsed ? <ChevronRight className="h-3 w-3" /> : <ChevronLeft className="h-3 w-3" />}
      </button>

      {/* Bottom Actions */}
      <div className={cn("pt-4 mt-2 border-t border-slate-200 dark:border-white/[0.06] shrink-0", isCollapsed ? "px-0" : "px-0")}>
        <button 
          onClick={handleLogout}
          title={isCollapsed ? "Logout" : undefined}
          className={cn(
            "w-full flex items-center gap-3 rounded-xl text-slate-600 dark:text-slate-400 hover:bg-red-50 dark:hover:bg-red-500/10 hover:text-red-600 dark:hover:text-red-400 transition-all duration-200 group",
            isCollapsed ? "justify-center p-3" : "px-4 py-3"
          )}
        >
          <LogOut className="h-5 w-5 group-hover:translate-x-1 transition-transform shrink-0" />
          {!isCollapsed && <span className="font-medium text-sm">Logout</span>}
        </button>
      </div>
    </aside>
  );
};