// src/features/Institute/components/InstituteTopbar.tsx
import { Search, Menu } from "lucide-react";
import { StaffNotificationBell } from "@/shared/components/notifications/StaffNotificationBell";
import { Avatar, AvatarFallback, AvatarImage } from "@/shared/components/ui/avatar";
import { Button } from "@/shared/components/ui/button";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import { Sheet, SheetContent, SheetTrigger } from "@/shared/components/ui/sheet";
import { useState } from "react";
import { InstituteSidebar } from "./InstituteSidebar";
interface InstituteTopbarProps {
  onCreateCourse?: () => void;
}

export const InstituteTopbar = ({ onCreateCourse }: InstituteTopbarProps) => {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("dashboard");
  
  const displayName = profile?.name || user?.email?.split('@')[0] || "Institute";

  return (
    <header className="h-16 flex items-center justify-between px-4 sm:px-6 gap-3 sm:gap-4 border-b border-brand-line bg-white/95 backdrop-blur-sm sticky top-0 z-30 flex-shrink-0 w-full">

      {/* Mobile Menu Trigger */}
      <div className="lg:hidden">
        <Sheet>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" className="h-9 w-9 rounded-xl text-brand-text-mute hover:bg-brand-bg-alt">
              <Menu className="h-6 w-6" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="p-0 bg-brand-ink border-r border-brand-line-12 w-72">
     <InstituteSidebar
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
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-brand-text-mute group-focus-within:text-brand-teal-600 transition-colors" />
          <input
            type="text"
            placeholder="Search students, courses, or resources..."
            className="w-full pl-10 pr-4 py-2.5 bg-brand-bg-alt border border-brand-line rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-teal-500/20 focus:border-brand-teal-500 transition-all text-sm font-medium text-brand-text placeholder:text-brand-text-mute"
          />
        </div>
      </div>

      {/* Right Actions */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Notifications — real feed from user_notifications */}
        <StaffNotificationBell scope="institute-admin" />

        {/* Divider */}
        <div className="h-7 w-px bg-brand-line" />

        {/* Profile */}
        <div className="flex items-center gap-2.5">
          <div className="text-right hidden md:block">
            <p className="font-manrope text-sm font-bold text-brand-text leading-none">{displayName}</p>
            <p className="font-jetbrains text-[10px] font-semibold tracking-[0.12em] uppercase text-brand-text-mute mt-0.5">Institute</p>
          </div>
          <Avatar
            className="h-8 w-8 ml-1 border border-brand-line cursor-pointer hover:ring-2 hover:ring-brand-teal-tint transition-all shrink-0"
            onClick={() => navigate('/profile')}
          >
            <AvatarImage src={profile?.profileImage || ""} />
            <AvatarFallback className="bg-brand-teal-600 text-white font-bold text-xs">
              {displayName.charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
        </div>
      </div>
    </header>
  );
};