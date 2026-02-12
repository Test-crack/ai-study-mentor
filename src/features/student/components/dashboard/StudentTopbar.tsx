import { Search, Bell, Zap, Menu } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/shared/components/ui/avatar";
import { Button } from "@/shared/components/ui/button";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import { ThemeToggle } from "@/features/theme/components/ThemeToggle";
import { Sheet, SheetContent, SheetTrigger } from "@/shared/components/ui/sheet";
import { StudentSidebar } from "./StudentSidebar";
import { useState } from "react";

interface StudentTopbarProps {
  onUpgradeClick: () => void;
}

export const StudentTopbar = ({ onUpgradeClick }: StudentTopbarProps) => {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("dashboard"); // Local state for mobile menu navigation
  
  // Get initials or name safely
  const displayName = profile?.name || user?.email?.split('@')[0] || "Student";

  return (
    <header className="flex items-center justify-between py-4 px-4 sm:px-6 gap-4 bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm sticky top-0 z-30 lg:rounded-2xl lg:mx-4 lg:mt-4 lg:shadow-sm border-b lg:border-none border-slate-100 dark:border-slate-800 transition-colors">
      
      {/* Mobile Menu Trigger */}
      <div className="lg:hidden">
        <Sheet>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" className="text-slate-500 dark:text-slate-400">
              <Menu className="h-6 w-6" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="p-0 bg-slate-900 border-none w-72">
             <StudentSidebar 
               isCollapsed={false} 
               toggleCollapse={() => {}} 
               onTabChange={(tab) => {
                 setActiveTab(tab);
                 // Start navigation if needed, or just close sheet (sheet auto-closes on interaction usually if configured, but here we just show the sidebar)
                 if(tab === 'dashboard') navigate('/student/dashboard');
               }}
               activeTab={activeTab}
               className="static w-full h-full rounded-none shadow-none" 
             />
          </SheetContent>
        </Sheet>
      </div>

      {/* Search Input - Professional & Minimal */}
      <div className="flex-1 max-w-xl hidden sm:block">
        <div className="relative group">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 group-focus-within:text-indigo-600 transition-colors" />
          <input 
            type="text" 
            placeholder="Search courses, assignments, or topics..." 
            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-sm font-medium text-slate-700 dark:text-slate-200 placeholder:text-slate-400"
          />
        </div>
      </div>

      {/* Right Actions */}
      <div className="flex items-center gap-3 sm:gap-4">
        {/* Upgrade Button */}
        <Button 
          variant="outline" 
          size="sm"
          onClick={onUpgradeClick}
          className="hidden md:flex items-center gap-2 border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-100 hover:border-amber-300 dark:bg-amber-900/20 dark:text-amber-400 dark:border-amber-800 transition-colors rounded-full px-4"
        >
          <Zap className="h-4 w-4 fill-amber-500 text-amber-500" />
          <span className="font-semibold text-xs uppercase tracking-wide">Upgrade Plan</span>
        </Button>

        {/* Theme Toggle */}
        <ThemeToggle />

        {/* Notifications */}
        <button className="relative p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-slate-800 rounded-full transition-all">
          <Bell className="h-5 w-5" />
          <span className="absolute top-2 right-2.5 h-2 w-2 bg-red-500 rounded-full border-2 border-white dark:border-slate-900"></span>
        </button>

        {/* Profile */}
        <div className="flex items-center gap-3 pl-2 border-l border-slate-100 dark:border-slate-800">
          <div className="text-right hidden md:block">
            <p className="text-sm font-bold text-slate-700 dark:text-slate-200 leading-none">{displayName}</p>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-1 uppercase tracking-wider">Student</p>
          </div>
          <Avatar 
            className="h-9 w-9 border-2 border-white dark:border-slate-800 shadow-sm ring-1 ring-slate-100 dark:ring-slate-700 cursor-pointer hover:ring-indigo-100 transition-all"
            onClick={() => navigate('/student/settings')}
          >
            <AvatarImage src={profile?.profileImage || ""} />
            <AvatarFallback className="bg-indigo-600 text-white font-bold">
              {displayName.charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
        </div>
      </div>
    </header>
  );
};
