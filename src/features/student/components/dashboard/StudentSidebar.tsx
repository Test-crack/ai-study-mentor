import { 
  LayoutDashboard, 
  BookOpen, 
  Calendar, 
  Settings, 
  LogOut, 
  GraduationCap
} from "lucide-react";
import { cn } from "@/shared/utils";
import { useAuth } from "@/features/auth/hooks/useAuth";

interface SidebarProps {
  activeTab?: string;
  onTabChange: (tab: string) => void;
}

export const StudentSidebar = ({ activeTab = 'dashboard', onTabChange }: SidebarProps) => {
  const { signOut } = useAuth();
  
  const menuItems = [
    { id: 'dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { id: 'courses', icon: BookOpen, label: 'My Courses' },
    { id: 'schedule', icon: Calendar, label: 'Schedule' },
    { id: 'settings', icon: Settings, label: 'Settings' },
  ];

  return (
    <aside className="fixed left-4 top-4 bottom-4 w-64 bg-slate-900 rounded-2xl shadow-2xl flex flex-col justify-between py-6 px-4 z-40 hidden lg:flex">
      {/* Brand */}
      <div className="flex items-center gap-3 px-2 mb-10">
        <div className="bg-indigo-600 p-2 rounded-lg">
          <GraduationCap className="h-6 w-6 text-white" />
        </div>
        <span className="text-xl font-bold text-white tracking-wide">TestCrack</span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-2">
        {menuItems.map((item) => (
          <button
            key={item.id}
            onClick={() => onTabChange(item.id)}
            className={cn(
              "w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group",
              activeTab === item.id 
                ? "bg-indigo-600 text-white shadow-lg shadow-indigo-900/20" 
                : "text-slate-400 hover:bg-slate-800 hover:text-white"
            )}
          >
            <item.icon className={cn(
              "h-5 w-5 transition-transform group-hover:scale-105",
              activeTab === item.id ? "text-white" : "text-slate-400 group-hover:text-white"
            )} />
            <span className="font-medium text-sm">{item.label}</span>
          </button>
        ))}
      </nav>

      {/* Bottom Actions */}
      <div className="pt-6 border-t border-slate-800">
        <button 
          onClick={() => signOut()}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-slate-400 hover:bg-red-500/10 hover:text-red-400 transition-all duration-200 group"
        >
          <LogOut className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
          <span className="font-medium text-sm">Logout</span>
        </button>
      </div>
    </aside>
  );
};
