import { useState } from "react";
import { StudentSidebar } from "./dashboard/StudentSidebar";
import { StudentTopbar } from "./dashboard/StudentTopbar";
import { StudentHero } from "./dashboard/StudentHero";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { PremiumModal } from "@/features/payment/components/PremiumModal";

const StudentDashboardPage = () => {
  const [activeTab, setActiveTab] = useState("dashboard");
  const [showPremiumModal, setShowPremiumModal] = useState(false);
  const { user, profile } = useAuth();
  
  const displayName = profile?.name || user?.email?.split('@')[0] || "Student";

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      {/* Sidebar - Desktop */}
      <StudentSidebar activeTab={activeTab} onTabChange={setActiveTab} />
      
      {/* Main Content Area */}
      <div className="lg:pl-72 min-h-screen flex flex-col transition-all duration-300">
        <StudentTopbar onUpgradeClick={() => setShowPremiumModal(true)} />
        
        <main className="flex-1 p-4 sm:p-6 lg:p-8 space-y-8">
          {/* Hero Section */}
          <section>
            <StudentHero name={displayName} />
          </section>

          {/* Widgets Grid Placeholder */}
          <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* These will be replaced by actual widgets later */}
            <div className="h-64 bg-white rounded-2xl border border-slate-100 shadow-sm p-6 flex flex-col hover:shadow-md transition-shadow">
               <h3 className="text-lg font-bold text-slate-800 mb-4">Finance</h3>
               <div className="flex-1 flex items-center justify-center bg-slate-50 rounded-xl">
                 <span className="text-slate-400 font-medium">Coming Soon</span>
               </div>
            </div>
             <div className="h-64 bg-white rounded-2xl border border-slate-100 shadow-sm p-6 flex flex-col hover:shadow-md transition-shadow">
               <h3 className="text-lg font-bold text-slate-800 mb-4">Enrolled Courses</h3>
               <div className="flex-1 flex items-center justify-center bg-slate-50 rounded-xl">
                 <span className="text-slate-400 font-medium">Coming Soon</span>
               </div>
            </div>
             <div className="h-64 bg-white rounded-2xl border border-slate-100 shadow-sm p-6 flex flex-col hover:shadow-md transition-shadow">
               <h3 className="text-lg font-bold text-slate-800 mb-4">Course Instructors</h3>
               <div className="flex-1 flex items-center justify-center bg-slate-50 rounded-xl">
                 <span className="text-slate-400 font-medium">Coming Soon</span>
               </div>
            </div>
          </section>
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
