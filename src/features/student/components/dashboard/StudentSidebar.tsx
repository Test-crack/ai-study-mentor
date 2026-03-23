import { 
 LayoutDashboard, 
  GraduationCap, 
  Mic, 
  Activity,
  Home,
   LogOut,
  Timer, 
  ChevronLeft,
  PenTool, 
  Headphones, 
  BookOpen, 
  ChevronRight,
  Calendar, 
  MessageCircle, 
  Library, 
  Settings,Layers
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

export const StudentSidebar = ({ activeTab = 'dashboard', onTabChange, isCollapsed, toggleCollapse, className }: SidebarProps) => {
  const { signOut } = useAuth();
  const navigate = useNavigate();
  
 const menuItems = [
  { id: 'dashboard', icon: LayoutDashboard, label: 'Dashboard', path: '/student/dashboard' },
  { id: 'speaking-assessment', icon: Mic, label: 'Speaking Practice', path: '/student/speaking-assessment' },
  { id: 'writing', icon: PenTool, label: 'Writing Practice', path: '/student/writing' },
  { id: 'reading', icon: BookOpen, label: 'Reading Practice', path: '/student/reading' },
  { id: 'listening', icon: Headphones, label: 'Listening Practice', path: '/student/listening' },
  { id: 'speed', icon: Timer, label: 'Speed Reading', path: '/student/speed' },
  // { id: 'voice', icon: Activity, label: 'Voice Lab', path: '/student/voice' },
  // { id: 'schedule', icon: Calendar, label: 'Schedule', path: '/student/schedule' },
  // { id: 'speaking-practice', icon: MessageCircle, label: 'Speaking-Anatomy', path: '/student/speaking-practice' },
  // { id: 'my-curriculum', icon: Library, label: 'My-Curriculum', path: '/student/my-curriculum' },
  { id: 'speaking-asess', icon: GraduationCap, label: 'Speaking Asessment', path: '/student/asess' },
  { id: 'courses-section', icon: GraduationCap, label: 'My Courses', path: '/student/courses-section' },
  { id: 'suggestion', icon: GraduationCap, label: 'Suggestion', path: '/student/suggestion' },
  { id: 'settings', icon: Settings, label: 'Settings', path: '/student/settings' },
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
        "fixed left-4 top-4 bottom-4 bg-white dark:bg-slate-900 rounded-2xl shadow-2xl flex flex-col justify-between py-6 z-50 transition-all duration-300 ease-in-out border border-slate-200 dark:border-slate-800",
        // THE FIX: Mobile slides off screen entirely. Desktop shrinks to w-20.
        isCollapsed 
          ? "-translate-x-[150%] lg:translate-x-0 w-64 lg:w-20 px-4 lg:px-2" 
          : "translate-x-0 w-64 px-4",
        className
      )}
    >
      {/* Brand */}
      <div className={cn("flex items-center gap-3 mb-10", isCollapsed ? "lg:justify-center px-0 lg:px-0" : "px-2")}>
        <div className="bg-indigo-600 p-2 rounded-lg shrink-0">
          <GraduationCap className="h-6 w-6 text-white" />
        </div>
        {/* Changed to CSS hiding (lg:hidden) for smooth slide-out animation on mobile */}
        <span className={cn(
          "text-xl font-bold text-slate-900 dark:text-white tracking-wide animate-in fade-in duration-300 whitespace-nowrap",
          isCollapsed ? "lg:hidden" : "block"
        )}>
          TestCrack
        </span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-2 overflow-y-auto overflow-x-hidden no-scrollbar">
        {menuItems.map((item) => (
          <button
            key={item.id}
            onClick={() => handleNavigation(item)}
            title={isCollapsed ? item.label : undefined}
            className={cn(
              "w-full flex items-center gap-3 rounded-xl transition-all duration-200 group relative",
              isCollapsed ? "lg:justify-center p-3 lg:p-3" : "px-4 py-3",
              activeTab === item.id 
                ? "bg-indigo-600 text-white shadow-lg shadow-indigo-900/20" 
                : "text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-indigo-600 dark:hover:text-white"
            )}
          >
            <item.icon className={cn(
              "h-5 w-5 transition-transform group-hover:scale-105 shrink-0",
              activeTab === item.id ? "text-white" : "text-slate-500 dark:text-slate-400 group-hover:text-indigo-600 dark:group-hover:text-white"
            )} />
            <span className={cn(
              "font-medium text-sm animate-in fade-in duration-200 whitespace-nowrap",
              isCollapsed ? "lg:hidden" : "block"
            )}>
              {item.label}
            </span>
          </button>
        ))}
      </nav>

      {/* Collapse Toggle */}
      <button
        onClick={toggleCollapse}
        className="absolute -right-3 top-1/2 -translate-y-1/2 bg-indigo-600 text-white p-1.5 rounded-full shadow-lg hover:bg-indigo-700 transition-colors z-50 border-2 border-[#F8FAFC] dark:border-slate-950"
      >
        {isCollapsed ? <ChevronRight className="h-3 w-3" /> : <ChevronLeft className="h-3 w-3" />}
      </button>

      {/* Bottom Actions */}
      <div className={cn("pt-4 border-t border-slate-200 dark:border-slate-800 space-y-2", isCollapsed ? "px-0" : "px-0")}>
        {/* <button 
          onClick={() => navigate('/')}
          title={isCollapsed ? "Home Page" : undefined}
          className={cn(
            "w-full flex items-center gap-3 rounded-xl text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-indigo-600 dark:hover:text-white transition-all duration-200 group",
            isCollapsed ? "lg:justify-center p-3 lg:p-3" : "px-4 py-3"
          )}
        >
          <Home className="h-5 w-5 group-hover:scale-105 transition-transform shrink-0" />
          <span className={cn("font-medium text-sm whitespace-nowrap", isCollapsed ? "lg:hidden" : "block")}>Home Page</span>
        </button> */}

        <button 
          onClick={handleLogout}
          title={isCollapsed ? "Logout" : undefined}
          className={cn(
            "w-full flex items-center gap-3 rounded-xl text-slate-500 dark:text-slate-400 hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-600 transition-all duration-200 group",
             isCollapsed ? "lg:justify-center p-3 lg:p-3" : "px-4 py-3"
          )}
        >
          <LogOut className="h-5 w-5 group-hover:translate-x-1 transition-transform shrink-0" />
          <span className={cn("font-medium text-sm whitespace-nowrap", isCollapsed ? "lg:hidden" : "block")}>Logout</span>
        </button>
      </div>
    </aside>
  );
};