import {
  LayoutDashboard,
  Users,
  Building2,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Home,
  Activity,
  CreditCard,
  SlidersHorizontal,
  ShieldCheck,
  Coins,
  LifeBuoy
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

export const SuperAdminSidebar = ({ activeTab = 'dashboard', onTabChange, isCollapsed, toggleCollapse, className }: SidebarProps) => {
  const { signOut } = useAuth();
  const navigate = useNavigate();
  
 // Question Bank has no backend route yet — left commented out below until one exists.
 const menuItems = [
  { id: 'superadmin-dashboard', icon: LayoutDashboard, label: 'Dashboard', path: '/superadmin/dashboard' },
  { id: 'institutes', icon: Building2, label: 'Institutes', path: '/superadmin/institutes' },
  { id: 'superadmin-subscription', icon: CreditCard, label: 'Subscription', path: '/superadmin/subscription' },
  { id: 'exam-configs', icon: SlidersHorizontal, label: 'Exam Configs', path: '/superadmin/examconfigs' },
  { id: 'question-verification', icon: ShieldCheck, label: 'Question Verification', path: '/superadmin/verification' },
  { id: 'pricing-config', icon: Coins, label: 'Pricing-Config', path: '/superadmin/priceconfig' },
  { id: 'support-tickets', icon: LifeBuoy, label: 'Support Tickets', path: '/superadmin/supportickets' },
  { id: 'platform-analytics', icon: Activity, label: 'Platform Analytics', path: '/superadmin/platform' },
  { id: 'users', icon: Users, label: 'All Users', path: '/superadmin/allusers' }, 
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
        "fixed left-4 top-4 bottom-4 bg-brand-ink rounded-2xl border border-brand-line-12 shadow-xl overflow-x-hidden flex flex-col justify-between py-6 z-40 hidden lg:flex transition-all duration-300",
        isCollapsed ? "w-20 px-2" : "w-64 px-4",
        className
      )}
    >
      {/* Brand */}
      <div className={cn("flex items-center gap-3 mb-10", isCollapsed ? "justify-center px-0" : "px-2")}>
        <img src={testcrackLogo} alt="TestCrack" className="h-9 w-9 object-contain shrink-0" />
        {!isCollapsed && (
          <div className="animate-in fade-in duration-300 min-w-0">
            <span className="font-manrope text-base font-black tracking-tight text-brand-bg block truncate">
              TestCrack
            </span>
            <p className="font-jetbrains text-[10px] font-semibold tracking-[0.12em] uppercase text-brand-on-ink-mute leading-none mt-0.5">
              Super Admin
            </p>
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-2 overflow-y-auto overflow-x-hidden">
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

      {/* Collapse Toggle */}
      <button
        onClick={toggleCollapse}
        className="absolute -right-3 top-1/2 -translate-y-1/2 bg-brand-teal-600 text-white p-1.5 rounded-full shadow-md hover:bg-brand-teal-700 transition-colors z-50 border-2 border-brand-bg"
      >
        {isCollapsed ? <ChevronRight className="h-3 w-3" /> : <ChevronLeft className="h-3 w-3" />}
      </button>

      {/* Bottom Actions */}
      <div className={cn("pt-6 border-t border-brand-line-12 space-y-2", isCollapsed ? "px-0" : "px-0")}>
        {/* Updated Logout Button */}
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