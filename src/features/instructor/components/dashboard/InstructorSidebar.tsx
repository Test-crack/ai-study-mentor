import { 
  LayoutDashboard, 
  LogOut, 
  GraduationCap, ClipboardCheck,
  ChevronLeft,
  ChevronRight, Laptop,
  Home, GitMerge, Workflow,
  Settings, BarChart3, Layers
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

export const InstructorSidebar = ({ activeTab = 'dashboard', onTabChange, isCollapsed, toggleCollapse, className }: SidebarProps) => {
  const { signOut } = useAuth();
  const navigate = useNavigate();
  
const menuItems = [
  { id: 'dashboard',   icon: LayoutDashboard, label: 'Dashboard',          path: '/instructor/dashboard' },
  // { id: 'courses',     icon: GraduationCap,   label: 'Course Management',  path: '/instructor/coursemanagement' },
  { id: 'batches',     icon: Layers,          label: 'Batch Management',   path: '/instructor/batches' },
  { id: 'assessments', icon: ClipboardCheck,  label: 'Student Assessments',path: '/instructor/assessments' },
  // { id: 'techprep',    icon: Laptop,          label: 'Tech Prep',          path: '/instructor/tech-pep' },
  // { id: 'alignment',   icon: GitMerge,        label: 'Alignment',          path: '/instructor/alignment' }, 
  { id: 'report',      icon: BarChart3,       label: 'Report',             path: '/instructor/reports' }, 
  { id: 'settings',    icon: Settings,        label: 'Settings',           path: '/profile' },
  { id: 'work',        icon: Workflow,        label: 'Workflow',           path: '/instructor/workflow' },
];

  const handleNavigation = (item: typeof menuItems[0]) => {
    navigate(item.path);
    if (onTabChange) {
      onTabChange(item.id);
    }
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
        "fixed left-4 top-4 bottom-4 bg-white dark:bg-[#12121A] rounded-2xl shadow-xl dark:shadow-2xl flex flex-col justify-between py-6 z-40 hidden lg:flex transition-all duration-300 border border-slate-200 dark:border-[#1E1E2A]",
        isCollapsed ? "w-20 px-2" : "w-64 px-4",
        className
      )}
    >
      {/* Brand */}
      <div className={cn("flex items-center gap-3 mb-10", isCollapsed ? "justify-center px-0" : "px-2")}>
        <div className="bg-indigo-600 p-2 rounded-lg shrink-0 shadow-md shadow-indigo-500/20">
          <GraduationCap className="h-6 w-6 text-white" />
        </div>
        {!isCollapsed && (
          <span className="text-xl font-bold text-slate-900 dark:text-white tracking-wide animate-in fade-in duration-300">
            Instructor
          </span>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-2">
        {menuItems.map((item) => (
          <button
            key={item.id}
            onClick={() => handleNavigation(item)}
            title={isCollapsed ? item.label : undefined}
            className={cn(
              "w-full flex items-center gap-3 rounded-xl transition-all duration-200 group relative",
              isCollapsed ? "justify-center p-3" : "px-4 py-3",
              activeTab === item.id 
                ? "bg-indigo-600 text-white shadow-md shadow-indigo-500/20 dark:shadow-indigo-900/20" 
                : "text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-[#1A1A24] hover:text-indigo-600 dark:hover:text-white"
            )}
          >
            <item.icon className={cn(
              "h-5 w-5 transition-transform group-hover:scale-105 shrink-0",
              activeTab === item.id ? "text-white" : "text-slate-400 group-hover:text-indigo-600 dark:group-hover:text-white"
            )} />
            {!isCollapsed && (
              <span className="font-medium text-sm animate-in fade-in duration-200">{item.label}</span>
            )}
          </button>
        ))}
      </nav>

      {/* Collapse Toggle */}
      <button
        onClick={toggleCollapse}
        className="absolute -right-3 top-1/2 -translate-y-1/2 bg-indigo-600 text-white p-1.5 rounded-full shadow-lg hover:bg-indigo-700 transition-colors z-50 border-2 border-slate-50 dark:border-[#09090E]"
      >
        {isCollapsed ? <ChevronRight className="h-3 w-3" /> : <ChevronLeft className="h-3 w-3" />}
      </button>

      {/* Bottom Actions */}
      <div className={cn("pt-6 border-t border-slate-200 dark:border-[#1E1E2A] space-y-2", isCollapsed ? "px-0" : "px-0")}>
        {/* <button 
          onClick={() => navigate('/')}
          title={isCollapsed ? "Home Page" : undefined}
          className={cn(
            "w-full flex items-center gap-3 rounded-xl text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-[#1A1A24] hover:text-indigo-600 dark:hover:text-white transition-all duration-200 group",
            isCollapsed ? "justify-center p-3" : "px-4 py-3"
          )}
        >
          <Home className="h-5 w-5 group-hover:scale-105 transition-transform shrink-0" />
          {!isCollapsed && <span className="font-medium text-sm">Home Page</span>}
        </button> */}

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