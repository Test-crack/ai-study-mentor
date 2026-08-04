import { Search, Bell, Menu, Plus } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/shared/components/ui/avatar";
import { Button } from "@/shared/components/ui/button";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import { ThemeToggle } from "@/features/theme/components/ThemeToggle";
import { Sheet, SheetContent, SheetTrigger } from "@/shared/components/ui/sheet";
import { useState } from "react";
import { SuperAdminSidebar } from "./SuperadminSidebar";
interface InstituteTopbarProps {
  onCreateCourse?: () => void;
}

export const SuperAdminTopbar = ({ onCreateCourse }: InstituteTopbarProps) => {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("dashboard");
  
  const displayName = profile?.name || user?.email?.split('@')[0] || "Institute";

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
     <SuperAdminSidebar
   isCollapsed={false} 
   toggleCollapse={() => {}} 
   activeTab={activeTab}
   onTabChange={setActiveTab}
   // Add 'flex' here to override the 'hidden' class from the base component
   className="flex static w-full h-full rounded-none shadow-none border-none" 
/>
          </SheetContent>
        </Sheet>
      </div>

      {/* Search Input */}
      <div className="flex-1 max-w-xl hidden sm:block">
        <div className="relative group">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 group-focus-within:text-brand-teal-600 transition-colors" />
          <input 
            type="text" 
            placeholder="Search students, courses, or resources..." 
            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-teal-500/20 focus:border-brand-teal-500 transition-all text-sm font-medium text-slate-700 dark:text-slate-200 placeholder:text-slate-400"
          />
        </div>
      </div>

      {/* Right Actions */}
      <div className="flex items-center gap-3 sm:gap-4">
        {/* Create Course Button */}
       

        {/* Theme Toggle */}
        <ThemeToggle />

        {/* Notifications */}
        <button className="relative p-2 text-slate-400 hover:text-brand-teal-600 hover:bg-brand-teal-50 dark:hover:bg-slate-800 rounded-full transition-all">
          <Bell className="h-5 w-5" />
          <span className="absolute top-2 right-2.5 h-2 w-2 bg-red-500 rounded-full border-2 border-white dark:border-slate-900"></span>
        </button>

        {/* Profile */}
        <div className="flex items-center gap-3 pl-2 border-l border-slate-100 dark:border-slate-800">
          <div className="text-right hidden md:block">
            <p className="text-sm font-bold text-slate-700 dark:text-slate-200 leading-none">{displayName}</p>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-1 uppercase tracking-wider">Testcrack Super Admin</p>
          </div>
          <Avatar 
            className="h-9 w-9 border-2 border-white dark:border-slate-800 shadow-sm ring-1 ring-slate-100 dark:ring-slate-700 cursor-pointer hover:ring-brand-teal-100 transition-all"
            onClick={() => navigate('/profile')}
          >
            <AvatarImage src={profile?.profileImage || ""} />
            <AvatarFallback className="bg-brand-teal-600 text-white font-bold">
              {displayName.charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
        </div>
      </div>
    </header>
  );
};
