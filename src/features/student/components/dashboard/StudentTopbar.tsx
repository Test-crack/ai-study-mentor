import { Search, Bell, Zap, Menu, Flame } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/shared/components/ui/avatar";
import { Button } from "@/shared/components/ui/button";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import { ThemeToggle } from "@/features/theme/components/ThemeToggle";
import { Sheet, SheetContent, SheetTrigger } from "@/shared/components/ui/sheet";
import { StudentSidebar } from "./StudentSidebar";
import { useState } from "react";
import { useMomentum } from "@/features/student/Context/MomentumContext"; // Adjust path if needed

interface StudentTopbarProps {
  onUpgradeClick: () => void;
}

export const StudentTopbar = ({ onUpgradeClick }: StudentTopbarProps) => {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("dashboard"); 
  
  // 🚀 Hook into the Global Momentum State
  const { totalMomentum, streak } = useMomentum();
  
  // Get initials or name safely
  const displayName = profile?.name || user?.email?.split('@')[0] || "Student";

  return (
    <header className="flex items-center justify-between  py-4 px-4 sm:px-6 gap-4 bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm sticky top-0 z-30 lg:rounded-2xl lg:mx-4 lg:mt-4 lg:shadow-sm border-b lg:border-none border-slate-100 dark:border-slate-800 transition-colors">
      
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
                 if(tab === 'dashboard') navigate('/student/dashboard');
               }}
               activeTab={activeTab}
               className="static w-full h-full rounded-none shadow-none" 
             />
          </SheetContent>
        </Sheet>
      </div>

      {/* Right Actions */}
      <div className="flex items-center gap-3 sm:gap-4 ml-auto">
        
        {/* 🚀 NEW: Global Momentum & Streak Badge */}
<div className="flex items-center bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/30 rounded-full px-3 py-1.5 shadow-sm animate-in fade-in">          <div className="flex items-center gap-1.5 pr-3 border-r border-amber-200 dark:border-amber-500/30">
            <Flame className="w-4 h-4 text-orange-500 fill-orange-500" />
            <span className="text-sm font-black text-orange-600 dark:text-orange-400">{streak}</span>
          </div>
          <div className="flex items-center gap-1.5 pl-3">
            <Zap className="w-4 h-4 text-amber-500 fill-amber-500" />
            <span className="text-sm font-black text-amber-600 dark:text-amber-400">{totalMomentum}</span>
          </div>
        </div>

        {/* Theme Toggle */}
        <ThemeToggle />

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