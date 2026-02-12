import { useState } from "react";
import { StudentSidebar } from "./dashboard/StudentSidebar";
import { StudentTopbar } from "./dashboard/StudentTopbar";
import { StudentHero } from "./dashboard/StudentHero";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { PremiumModal } from "@/features/payment/components/PremiumModal";
import { RecommendedInstructors } from "./dashboard/RecommendedInstructors";
import { DailyNotices } from "./dashboard/DailyNotices";
import { SpeedReadingWidget } from "./dashboard/SpeedReadingWidget";
import { FeaturesGrid } from "./dashboard/FeaturesGrid";
import { RecentCoursesWidget } from "./dashboard/RecentCoursesWidget";

const StudentDashboardPage = () => {
  const [activeTab, setActiveTab] = useState("dashboard");
  const [showPremiumModal, setShowPremiumModal] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const { user, profile } = useAuth();
  
  const displayName = profile?.name || user?.email?.split('@')[0] || "Student";

  return (
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-slate-950 transition-colors duration-300">
      {/* Sidebar - Desktop */}
      <StudentSidebar 
        activeTab={activeTab} 
        onTabChange={setActiveTab} 
        isCollapsed={isSidebarCollapsed}
        toggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
      />
      
      {/* Main Content Area */}
      <div 
        className={`min-h-screen flex flex-col transition-all duration-300 ${
          isSidebarCollapsed ? 'lg:pl-20' : 'lg:pl-64'
        }`}
      >
        <StudentTopbar onUpgradeClick={() => setShowPremiumModal(true)} />
        
        <main className="flex-1 p-4 sm:p-6 lg:p-8 space-y-8">
           {/* Hero Section - Full Width */}
           <section>
             <StudentHero name={displayName} />
           </section>

           <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">
             
             {/* Left Main Column (Features) */}
             <div className="xl:col-span-8 space-y-8">
                {/* Speed Reading Assessment Callout */}
                <section>
                   <div className="mb-4 flex items-center justify-between">
                     <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">Quick Actions</h2>
                   </div>
                   <SpeedReadingWidget />
                </section>

                <RecentCoursesWidget />

                {/* Features Grid */}
                <section>
                   <div className="mb-4 flex items-center justify-between">
                     <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">Learning Tools</h2>
                   </div>
                   <FeaturesGrid />
                </section>
             </div>

             {/* Right Sidebar Column (Instructors + Notices) */}
             <div className="xl:col-span-4 space-y-8">
                <RecommendedInstructors />
                <DailyNotices />
             </div>
           </div>
        </main>
      </div>

       <PremiumModal
        isOpen={showPremiumModal}
        onClose={() => setShowPremiumModal(false)}
      />
    </div>
  );
};

export default StudentDashboardPage;
