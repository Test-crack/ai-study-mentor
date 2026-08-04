import React, { useState, useEffect } from "react";
import { Zap, Menu, Flame, X } from "lucide-react";
import { NotificationBell } from "./NotificationBell";
import { Avatar, AvatarFallback, AvatarImage } from "@/shared/components/ui/avatar";
import { Button } from "@/shared/components/ui/button";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import { ThemeToggle } from "@/features/theme/components/ThemeToggle";
import { useMomentum } from "@/features/student/Context/MomentumContext"; 

interface StudentTopbarProps {
  onUpgradeClick?: () => void;
  toggleSidebar?: () => void; 
  isCollapsed?: boolean; 
}

export const StudentTopbar = ({ onUpgradeClick }: StudentTopbarProps) => {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const { totalMomentum, streak } = useMomentum();
  
  // State: false means closed, true means open
  const [isOpen, setIsOpen] = useState(false);

  // Listen for explicit state changes to stay perfectly in sync with the sidebar
  useEffect(() => {
    const handleSync = (e: any) => {
      if (e.detail !== undefined) setIsOpen(e.detail.isOpen);
    };
    
    window.addEventListener('sidebar-sync', handleSync);
    return () => window.removeEventListener('sidebar-sync', handleSync);
  }, []);

  const handleMenuClick = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevents click from bubbling and misfiring
    const newState = !isOpen;
    setIsOpen(newState);
    
    // Broadcast the exact new state to the Sidebar
    window.dispatchEvent(new CustomEvent('sidebar-sync', { detail: { isOpen: newState } }));
  };

  const displayName = profile?.name || user?.email?.split('@')[0] || "Student";
  const initials = displayName.substring(0, 2).toUpperCase();

  return (
    <header className="h-16 flex items-center justify-between px-4 sm:px-6 border-b border-slate-200 dark:border-slate-800 bg-white/95 dark:bg-slate-900/95 backdrop-blur-sm sticky top-0 z-40 flex-shrink-0 w-full">
      
      {/* Mobile Menu Trigger */}
      <div className="md:hidden">
        <Button 
          variant="ghost" 
          size="icon" 
          className="text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 -ml-2 transition-transform duration-200"
          onClick={handleMenuClick}
          aria-label="Toggle Sidebar"
        >
          {isOpen ? (
            <X className="h-6 w-6 transition-all duration-300 rotate-90" />
          ) : (
            <Menu className="h-6 w-6 transition-all duration-300" />
          )}
        </Button>
      </div>

      <div className="hidden md:block" />

      {/* Right Actions */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-1.5 bg-orange-50 dark:bg-orange-500/10 border border-orange-100 dark:border-orange-500/20 rounded-full px-3 py-1.5 hidden sm:flex">
          <Flame className="w-3.5 h-3.5 text-orange-500 fill-orange-500" />
          <span className="text-sm font-black text-orange-600 dark:text-orange-400">{streak}</span>
          <span className="text-xs text-orange-400 font-medium hidden sm:inline">day streak</span>
        </div>

        <div className="flex items-center gap-1.5 bg-brand-teal-50 dark:bg-brand-teal-500/10 border border-brand-teal-100 dark:border-brand-teal-500/20 rounded-full px-3 py-1.5">
          <Zap className="w-3.5 h-3.5 text-brand-teal-500 fill-brand-teal-500" />
          <span className="text-sm font-black text-brand-teal-600 dark:text-brand-teal-400">{totalMomentum}</span>
          <span className="text-xs text-brand-teal-400 font-medium hidden sm:inline">pts</span>
        </div>

        <ThemeToggle />

        <NotificationBell />

        <Avatar
          className="h-8 w-8 ml-1 border border-slate-200 dark:border-slate-700 cursor-pointer hover:ring-2 hover:ring-brand-teal-100 transition-all shrink-0"
          onClick={() => navigate('/student/settings')}
        >
          <AvatarImage src={profile?.profileImage || ""} />
          <AvatarFallback className="bg-brand-teal-600 text-white font-bold text-xs">
            {initials}
          </AvatarFallback>
        </Avatar>
      </div>
    </header>
  );
};