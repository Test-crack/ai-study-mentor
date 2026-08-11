import { ReactNode, useState } from "react";
import { StudentSidebar } from "./dashboard/StudentSidebar";
import { StudentTopbar } from "./dashboard/StudentTopbar";

/**
 * StudentLayout — single source of truth for the sidebar + content spacing.
 *
 * Why this exists:
 * The sidebar is `fixed` and 84px wide from the `md` breakpoint (768px) up,
 * offset 16px from the left edge. Content therefore needs a constant
 * `md:pl-[116px]` (16 + 84 + 16 gap). Previously every page hand-rolled its
 * own wrapper — some had `lg:` padding, some had none — which is why pages
 * other than the dashboard overlapped on iPad Mini / iPad Air. Wrapping every
 * routed page in this component guarantees they all behave identically.
 *
 * Usage in any page:
 *
 *   const ListeningPractice = () => (
 *     <StudentLayout activeTab="listening">
 *       ...page content...
 *     </StudentLayout>
 *   );
 */

interface StudentLayoutProps {
  children: ReactNode;
  activeTab?: string;
  isLocked?: boolean;
  isNewStudent?: boolean;
  showTopbar?: boolean;
  onUpgradeClick?: () => void;
  mainClassName?: string;
}

export const StudentLayout = ({
  children,
  activeTab = "dashboard",
  isLocked,
  isNewStudent = false,
  showTopbar = true,
  onUpgradeClick,
  mainClassName,
}: StudentLayoutProps) => {
  const [currentTab, setCurrentTab] = useState(activeTab);

  return (
    <div className="min-h-screen bg-brand-bg font-plex transition-colors duration-300">
      <StudentSidebar
        activeTab={currentTab}
        onTabChange={setCurrentTab}
        isLocked={isLocked}
        isNewStudent={isNewStudent}
      />

      {/*
        Constant content padding: rail (84px) + left offset (16px) + gap (16px).
        On desktop hover the sidebar expands as a fixed overlay above the
        content (z-[9999] + shadow), so the content never shifts and there is
        no CSS-hover vs React-state desync. Below md the sidebar is a slide-in
        drawer toggled by the topbar hamburger, so no padding is needed.
      */}
      <div className="min-h-screen flex flex-col pl-0 md:pl-[116px]">
        {showTopbar && <StudentTopbar onUpgradeClick={onUpgradeClick} />}

        <main className={mainClassName ?? "flex-1 p-4 sm:p-6 lg:p-8"}>
          {children}
        </main>
      </div>
    </div>
  );
};

export default StudentLayout;