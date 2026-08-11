import React, { useState, useEffect } from "react";
import { Zap, Menu, Flame, X } from "lucide-react";
import { NotificationBell } from "./NotificationBell";
import { Avatar, AvatarFallback, AvatarImage } from "@/shared/components/ui/avatar";
import { Button } from "@/shared/components/ui/button";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { useNavigate } from "react-router-dom";
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
    <header className="h-16 flex items-center justify-between px-4 sm:px-6 border-b border-brand-line bg-white/95 backdrop-blur-sm sticky top-0 z-40 flex-shrink-0 w-full">

      {/* Mobile Menu Trigger */}
      <div className="md:hidden">
        <Button
          variant="ghost"
          size="icon"
          className="text-brand-text-mute hover:bg-brand-bg-alt -ml-2 transition-transform duration-200"
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
        <div className="flex items-center gap-1.5 bg-brand-warm-tint dark:bg-brand-warm/10 border border-brand-warm/20 dark:border-brand-warm/25 rounded-full px-3 py-1.5 hidden sm:flex">
          <Flame className="w-3.5 h-3.5 text-brand-warm fill-brand-warm" />
          <span className="font-manrope text-sm font-black text-brand-warm">{streak}</span>
          <span className="text-xs text-brand-warm font-medium hidden sm:inline opacity-80">day streak</span>
        </div>

        <div className="flex items-center gap-1.5 bg-brand-ink rounded-full px-3 py-1.5">
          <Zap className="w-3.5 h-3.5 text-brand-mint fill-brand-mint" />
          <span className="font-manrope text-sm font-black text-brand-mint">{totalMomentum}</span>
          <span className="text-xs text-brand-mint/70 font-medium hidden sm:inline">momentum</span>
        </div>

        <NotificationBell />

        <Avatar
          className="h-8 w-8 ml-1 border border-brand-line cursor-pointer hover:ring-2 hover:ring-brand-teal-tint transition-all shrink-0"
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