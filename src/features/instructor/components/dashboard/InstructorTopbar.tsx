// src/features/Instructor/dashboard/InstructorTopbar.tsx
import { Menu } from "lucide-react";
import { InstructorNotificationBell } from "./InstructorNotificationBell";
import { Avatar, AvatarFallback, AvatarImage } from "@/shared/components/ui/avatar";
import { Button } from "@/shared/components/ui/button";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import { Sheet, SheetContent, SheetTrigger } from "@/shared/components/ui/sheet";
import { InstructorSidebar } from "./InstructorSidebar";
import { useState } from "react";

interface InstructorTopbarProps {
  onCreateCourse?: () => void;
}

export const InstructorTopbar = ({ onCreateCourse }: InstructorTopbarProps) => {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("dashboard");

  const displayName = profile?.name || user?.email?.split('@')[0] || "Instructor";

  return (
    <header className="h-16 flex items-center justify-between px-4 sm:px-6 border-b border-brand-line bg-white/95 backdrop-blur-sm sticky top-0 z-30 flex-shrink-0 w-full">

      {/* Mobile menu trigger */}
      <div className="lg:hidden">
        <Sheet>
          <SheetTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9 rounded-xl text-brand-text-mute hover:bg-brand-bg-alt"
            >
              <Menu className="h-5 w-5" />
            </Button>
          </SheetTrigger>
          <SheetContent
            side="left"
            className="p-0 w-72 bg-brand-ink border-r border-brand-line-12"
          >
            <InstructorSidebar
              isCollapsed={false}
              toggleCollapse={() => {}}
              activeTab={activeTab}
              onTabChange={setActiveTab}
              className="flex static w-full h-full rounded-none shadow-none border-none left-0 top-0 bottom-0"
            />
          </SheetContent>
        </Sheet>
      </div>

      <div className="hidden lg:block" />

      {/* Right actions */}
      <div className="flex items-center gap-2 sm:gap-3">

        {/* Notification bell */}
        <InstructorNotificationBell />

        {/* Divider */}
        <div className="h-7 w-px bg-brand-line" />

        {/* Profile block */}
        <div className="flex items-center gap-2.5">
          <div className="text-right hidden md:block">
            <p className="font-manrope text-sm font-bold text-brand-text leading-none">
              {displayName}
            </p>
            <p className="font-jetbrains text-[10px] font-semibold tracking-[0.12em] uppercase text-brand-text-mute mt-0.5">
              Instructor
            </p>
          </div>

          <Avatar
            className="h-8 w-8 ml-1 border border-brand-line cursor-pointer hover:ring-2 hover:ring-brand-teal-tint transition-all shrink-0"
            onClick={() => navigate('/profile')}
          >
            <AvatarImage src={profile?.profileImage || ""} />
            <AvatarFallback className="bg-brand-teal-600 text-white text-xs font-black">
              {displayName.charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
        </div>
      </div>
    </header>
  );
};