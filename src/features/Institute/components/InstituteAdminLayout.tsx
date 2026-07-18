// src/features/Institute/components/InstituteAdminLayout.tsx
// Single source of truth for the admin portal chrome: sidebar (desktop) +
// topbar (with mobile Sheet) + ambient dark-mode glow + content padding.
// Every admin page wraps its content in this instead of hand-rolling the
// sidebar/topbar/padding trio (which previously drifted page to page).
import { ReactNode, useState } from "react";
import { InstituteSidebar } from "./InstituteSidebar";
import { InstituteTopbar } from "./InstituteTopbar";

interface InstituteAdminLayoutProps {
  children: ReactNode;
  /** Sidebar item to highlight — must match InstituteSidebar tab ids. */
  activeTab: string;
}

export const InstituteAdminLayout = ({ children, activeTab }: InstituteAdminLayoutProps) => {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  return (
    <div className="min-h-screen bg-[#f8fafc] dark:bg-[#0A0A0F] font-sans text-slate-900 dark:text-slate-200 transition-colors duration-500">
      {/* Ambient glow layer — dark mode only */}
      <div className="pointer-events-none fixed inset-0 hidden dark:block">
        <div className="absolute top-0 left-0 w-[500px] h-[500px] bg-blue-700/10 blur-[140px] rounded-full"></div>
        <div className="absolute bottom-0 left-0 w-[450px] h-[450px] bg-indigo-600/[0.08] blur-[130px] rounded-full"></div>
      </div>

      {/* Sidebar — hidden on mobile, surfaced via the topbar Sheet */}
      <div className="hidden lg:block">
        <InstituteSidebar
          activeTab={activeTab}
          isCollapsed={isSidebarCollapsed}
          toggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
        />
      </div>

      <div className={`relative transition-all duration-300 flex flex-col min-h-screen ${isSidebarCollapsed ? "lg:pl-20" : "lg:pl-64"}`}>
        <InstituteTopbar />
        <main className="flex-1 p-4 sm:p-6 lg:p-8">
          <div className="max-w-[1600px] mx-auto space-y-6">{children}</div>
        </main>
      </div>
    </div>
  );
};

export default InstituteAdminLayout;
