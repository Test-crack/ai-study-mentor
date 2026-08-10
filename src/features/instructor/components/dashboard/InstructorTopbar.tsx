// src/features/Instructor/dashboard/InstructorTopbar.tsx
import { Menu } from "lucide-react";
import { InstructorNotificationBell } from "./InstructorNotificationBell";
import { Avatar, AvatarFallback, AvatarImage } from "@/shared/components/ui/avatar";
import { Button } from "@/shared/components/ui/button";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import { ThemeToggle } from "@/features/theme/components/ThemeToggle";
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
    <header className={[
      // Layout
      "sticky top-0 z-30 flex items-center justify-between w-full px-4 sm:px-5 py-3 gap-4",
      // Light surface — floated card look
      "bg-white/80 backdrop-blur-md",
      "border-b border-slate-200/70",
      "lg:mx-4 lg:mt-4 lg:rounded-2xl lg:border lg:border-slate-200/60",
      "lg:shadow-[0_2px_12px_-4px_rgba(15,23,42,0.08)]",
      // Dark surface
      "dark:bg-[#0D0D14]/80 dark:border-white/[0.05]",
      "dark:lg:shadow-[0_2px_20px_rgba(0,0,0,0.4)]",
      // Transition
      "transition-colors duration-500",
    ].join(" ")}
    >

      {/* Mobile menu trigger */}
      <div className="lg:hidden">
        <Sheet>
          <SheetTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9 rounded-xl text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/[0.06]"
            >
              <Menu className="h-5 w-5" />
            </Button>
          </SheetTrigger>
          <SheetContent
            side="left"
            className="p-0 w-72 bg-white dark:bg-[#0D0D14] border-r border-slate-200/70 dark:border-white/[0.05]"
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

      {/* Right actions */}
      <div className="flex items-center gap-2 sm:gap-3 ml-auto">

        {/* Theme toggle */}
        <ThemeToggle />

        {/* Notification bell */}
        <InstructorNotificationBell />

        {/* Divider */}
        <div className="h-7 w-px bg-slate-200/80 dark:bg-white/[0.07]" />

        {/* Profile block */}
        <div className="flex items-center gap-2.5">
          <div className="text-right hidden md:block">
            <p className="text-sm font-bold text-slate-800 dark:text-slate-100 leading-none">
              {displayName}
            </p>
            <p className="text-[10px] font-semibold tracking-[0.12em] uppercase text-slate-400 dark:text-slate-500 mt-0.5">
              Instructor
            </p>
          </div>

          <Avatar
            className={[
              "h-8 w-8 cursor-pointer shrink-0",
              "ring-2 ring-slate-100 dark:ring-white/[0.06]",
              "hover:ring-brand-teal-200 dark:hover:ring-brand-teal-500/30",
              "transition-all duration-200",
              "border-2 border-white dark:border-[#0D0D14]",
              "shadow-sm",
            ].join(" ")}
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