// src/features/Institute/components/InstituteAdminLayout.tsx
// Single source of truth for the admin portal chrome: sidebar (desktop) +
// topbar (with mobile Sheet) + content padding.
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
    <div className="min-h-screen bg-brand-bg font-plex text-brand-text antialiased">
      {/* Sidebar — hidden on mobile, surfaced via the topbar Sheet */}
      <div className="hidden lg:block">
        <InstituteSidebar
          activeTab={activeTab}
          isCollapsed={isSidebarCollapsed}
          toggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
        />
      </div>

      <div className={`relative z-10 transition-all duration-300 flex flex-col min-h-screen ${isSidebarCollapsed ? "lg:pl-24" : "lg:pl-72"}`}>
        <InstituteTopbar />
        <main className="flex-1 p-4 sm:p-6 lg:p-8">
          <div className="max-w-[1600px] mx-auto space-y-6">{children}</div>
        </main>
      </div>
    </div>
  );
};

export default InstituteAdminLayout;
