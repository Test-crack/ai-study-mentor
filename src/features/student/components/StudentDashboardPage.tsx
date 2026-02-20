import { useState } from "react";
import { StudentSidebar } from "./dashboard/StudentSidebar";
import { StudentTopbar } from "./dashboard/StudentTopbar";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { PremiumModal } from "@/features/payment/components/PremiumModal";
import { Clock, CheckCircle2, Trophy, Flame } from "lucide-react";
// 1. Import useNavigate
import { useNavigate } from "react-router-dom";

const StudentDashboardPage = () => {
  const [activeTab, setActiveTab] = useState("dashboard");
  const [showPremiumModal, setShowPremiumModal] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const { user, profile } = useAuth();
  
  // 2. Initialize navigate
  const navigate = useNavigate();
  
  const displayName = profile?.name || user?.email?.split('@')[0] || "Student";

  return (
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-slate-950 transition-colors duration-300">
      <StudentSidebar 
        activeTab={activeTab} 
        onTabChange={setActiveTab} 
        isCollapsed={isSidebarCollapsed}
        toggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
      />
      
      <div className={`min-h-screen flex flex-col transition-all duration-300 ${isSidebarCollapsed ? 'lg:pl-20' : 'lg:pl-64'}`}>
        <StudentTopbar onUpgradeClick={() => setShowPremiumModal(true)} />
        
        <main className="flex-1 p-4 sm:p-6 lg:p-8 space-y-6">
          
          {/* Hero Banner */}
          <section className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-indigo-600 to-purple-500 p-8 text-white shadow-lg">
            <div className="relative z-10">
              <h1 className="text-3xl font-bold">Welcome back, {displayName} 👋</h1>
              <p className="mt-2 text-indigo-100 max-w-xl">
                You're on a 5-day streak! Keep it up. Your predicted IELTS band is 8.5 — practice speaking and reading to push for 7+.
              </p>
              <div className="mt-6 flex gap-3">
                <button 
                  onClick={() => navigate('/student/speaking-practice')}
                  className="rounded-lg bg-white px-4 py-2 text-sm font-bold text-indigo-600 hover:bg-indigo-50 transition-colors"
                >
                  Start Speaking
                </button>
                <button 
                   onClick={() => navigate('/student/settings')}
                   className="rounded-lg bg-white/20 px-4 py-2 text-sm font-bold text-white backdrop-blur-sm hover:bg-white/30 transition-colors"
                >
                  Reading Practice
                </button>
              </div>
            </div>
          </section>

          {/* Stats Row */}
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
            <StatCard label="My Score" value="72%" sub="+5.3%" icon="🎯" color="text-indigo-600" />
            <StatCard label="Sessions Done" value="18" sub="+12%" icon="📖" color="text-purple-600" />
            <StatCard label="Current Streak" value="5 days" sub="+25%" icon="⚡" color="text-orange-500" />
            <StatCard label="Predicted Band" value="6.5" sub="+4.2%" icon="🎓" color="text-blue-600" />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            
            {/* LEFT: My Modules & Areas to Improve */}
            <div className="lg:col-span-8 space-y-6">
              <DashboardCard title="My Modules" subtitle="Continue where you left off">
                <div className="space-y-4">
                  {['Speaking Practice', 'Reading Practice','My Curriculum','IELTS Prep'].map((module, i) => (
                    <div key={i} className="flex items-center justify-between p-3 hover:bg-slate-50 dark:hover:bg-slate-800/50 rounded-xl transition-colors cursor-pointer group">
                      <div className="flex items-center gap-4">
                        <div className={`h-10 w-10 rounded-lg flex items-center justify-center font-bold text-white ${i === 0 ? 'bg-indigo-500' : 'bg-blue-500'}`}>
                          {module.split(' ')[0][0]}{module.split(' ')[1][0]}
                        </div>
                        <div>
                          <p className="font-semibold text-slate-800 dark:text-slate-100">{module}</p>
                          <p className="text-xs text-slate-500">Next: Fluency Drill #4 • 65% complete</p>
                        </div>
                      </div>
                      <div className="w-24 h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                        <div className="h-full bg-indigo-500 w-[65%]"></div>
                      </div>
                    </div>
                  ))}
                </div>
              </DashboardCard>

              <DashboardCard title="Areas to Improve" icon="🎯">
                <div className="space-y-4">
                  {/* 3. Added onClick handlers here */}
                  <ImprovementItem 
                    title="Your pronunciation score dips on multi-syllable words"
                    desc="Practice the 'Word Stress' drill in Speaking."
                    action="Go to Speaking"
                    onClick={() => navigate('/student/speaking-practice')}
                  />
                  <ImprovementItem 
                    title="You're reading passages too fast — keyword coverage is 45%"
                    desc="Slow down during familiarization. Highlight key terms."
                    action="Reading Practice"
                    onClick={() => navigate('/student/reading-assessment')}
                  />
                </div>
              </DashboardCard>
            </div>

            {/* RIGHT: Recent Activity & Weekly Goals */}
            <div className="lg:col-span-4 space-y-6">
              <DashboardCard title="Recent Activity" subtitle="Your recent actions">
                <div className="space-y-6 pt-2">
                  <ActivityItem label="Completed Reading Comprehension Set 3" time="2 hours ago" color="bg-emerald-500" />
                  <ActivityItem label="Scored 78% in Speaking Mock Test" time="Yesterday" color="bg-indigo-500" />
                  <ActivityItem label="Started IELTS Writing Module" time="2 days ago" color="bg-blue-500" />
                </div>
              </DashboardCard>

              <DashboardCard title="Weekly Goals" icon="📈">
                <div className="space-y-5">
                  <GoalItem label="Complete 3 speaking sessions" current={2} total={3} color="bg-indigo-500" />
                  <GoalItem label="Finish 2 reading passages" current={1} total={2} color="bg-purple-500" />
                  <GoalItem label="Maintain 5-day streak" current={5} total={5} color="bg-emerald-500" />
                </div>
              </DashboardCard>
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

// --- HELPER COMPONENTS ---

const DashboardCard = ({ title, subtitle, children, icon }: any) => (
  <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-100 dark:border-slate-800 shadow-sm h-full">
    <div className="mb-4">
      <h2 className="text-lg font-bold text-slate-800 dark:text-white flex items-center gap-2">
        {icon && <span>{icon}</span>} {title}
      </h2>
      {subtitle && <p className="text-xs text-slate-500 mt-1">{subtitle}</p>}
    </div>
    {children}
  </div>
);

const StatCard = ({ label, value, sub, icon, color }: any) => (
  <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm transition-transform hover:scale-[1.02]">
    <div className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
      {icon} {label}
    </div>
    <div className="flex items-baseline gap-2">
      <span className="text-2xl font-black text-slate-800 dark:text-white">{value}</span>
      <span className="text-xs font-bold text-emerald-500">{sub}</span>
    </div>
  </div>
);

const ActivityItem = ({ label, time, color }: any) => (
  <div className="flex gap-4 relative pb-1">
    <div className={`mt-1.5 h-2 w-2 rounded-full shrink-0 ${color} ring-4 ring-white dark:ring-slate-900 z-10`}></div>
    <div className="text-sm">
      <p className="text-slate-700 dark:text-slate-300 font-medium leading-tight">{label}</p>
      <div className="flex items-center gap-1 text-slate-400 text-xs mt-1">
        <Clock className="h-3 w-3" /> {time}
      </div>
    </div>
  </div>
);

const GoalItem = ({ label, current, total, color }: any) => (
  <div className="space-y-2">
    <div className="flex justify-between text-xs font-bold">
      <span className="text-slate-600 dark:text-slate-400 uppercase">{label}</span>
      <span className="text-slate-400">{current}/{total}</span>
    </div>
    <div className="h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
      <div className={`h-full ${color} transition-all duration-500`} style={{ width: `${(current/total)*100}%` }}></div>
    </div>
  </div>
);

// 4. Update ImprovementItem to accept and use onClick
const ImprovementItem = ({ title, desc, action, onClick }: any) => (
  <div className="p-4 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30">
    <p className="text-sm font-bold text-slate-800 dark:text-slate-200">{title}</p>
    <p className="text-xs text-slate-500 mt-1">{desc}</p>
    <button 
      onClick={onClick}
      className="text-xs font-bold text-indigo-600 mt-3 hover:underline"
    >
      {action} →
    </button>
  </div>
);

export default StudentDashboardPage;