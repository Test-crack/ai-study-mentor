import { Search, Menu, Plus } from "lucide-react";
import { StaffNotificationBell } from "@/shared/components/notifications/StaffNotificationBell";
import { Avatar, AvatarFallback, AvatarImage } from "@/shared/components/ui/avatar";
import { Button } from "@/shared/components/ui/button";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import { Sheet, SheetContent, SheetTrigger } from "@/shared/components/ui/sheet";
import { useState } from "react";
import {InstituteOwnerSidebar } from "./InstitiuteOwnerSidebar";
import { ExamContextBar } from "@/features/Institute/components/ExamContextBar";

interface InstituteOwnerTopbarProps {
  onCreateCourse?: () => void;
}

export const InstituteOwnerTopbar = ({ onCreateCourse }: InstituteOwnerTopbarProps) => {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("dashboard");
  
  const displayName = profile?.name || user?.email?.split('@')[0] || "Institute Owner";

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
            <InstituteOwnerSidebar
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
      {/* <div className="flex-1 max-w-xl hidden sm:block">
        <div className="relative group">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 group-focus-within:text-brand-teal-600 transition-colors" />
          <input 
            type="text" 
            placeholder="Search students, courses, or resources..." 
            className="w-full pl-10 pr-4 py-2.5 bg-brand-bg-alt border border-brand-line rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-teal-500/20 focus:border-brand-teal-500 transition-all text-sm font-medium text-brand-text placeholder:text-brand-text-mute"
          />
        </div>
      </div> */}

      {/* Right Actions - Added ml-auto here to push content to the right edge */}
      <div className="flex items-center gap-2 sm:gap-3 ml-auto">
        {/* Exam context switch (owner) — scopes every page to the selected exam */}
        <ExamContextBar />

        {/* Notifications — real feed from user_notifications, same component the
            admin portal uses. Replaces the commented-out decorative bell (a
            hardcoded red dot with no data behind it).

            NOTE: /api/institute-owner/notifications is not mounted yet
            (BACKEND_REQUEST_dropout_risk_notifications.md Request 2), so this
            renders an empty "all caught up" bell until it lands, then starts
            working with no further frontend change. */}
        <StaffNotificationBell scope="institute-owner" />

        {/* Profile */}
        <div className="flex items-center gap-2.5">
          <div className="text-right hidden md:block">
            <p className="font-manrope text-sm font-bold text-brand-text leading-none">{displayName}</p>
            <p className="font-jetbrains text-[10px] font-semibold tracking-[0.12em] uppercase text-brand-text-mute mt-0.5">Owner Portal</p>
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