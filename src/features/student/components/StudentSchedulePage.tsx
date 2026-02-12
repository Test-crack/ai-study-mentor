import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { StudentSidebar } from './dashboard/StudentSidebar';
import { StudentTopbar } from './dashboard/StudentTopbar';
import { Button } from "@/shared/components/ui/button";
import { Lock, Calendar as CalendarIcon, Clock, ChevronRight, Star } from "lucide-react";
import { PremiumModal } from "@/features/payment/components/PremiumModal";

export default function StudentSchedulePage() {
  const navigate = useNavigate();
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [showPremiumModal, setShowPremiumModal] = useState(false);

  // Fake schedule items for the blurred background
  const dummySchedule = [
    { time: '09:00 AM', event: 'Advanced React Patterns', type: 'Live Class' },
    { time: '11:30 AM', event: 'System Design Interview Prep', type: 'Workshop' },
    { time: '02:00 PM', event: 'Mentorship Session', type: '1-on-1' },
    { time: '04:00 PM', event: 'Algorithm Challenge', type: 'Practice' },
  ];

  return (
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-slate-950 transition-colors duration-300">
      <StudentSidebar 
        activeTab="schedule" 
        onTabChange={(tab) => {
             if (tab === 'dashboard') navigate('/student/dashboard');
             if (tab === 'courses') navigate('/student/courses');
             if (tab === 'settings') navigate('/student/settings');
        }}
        isCollapsed={isSidebarCollapsed}
        toggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
      />

      <div className={`transition-all duration-300 ${isSidebarCollapsed ? 'lg:pl-24' : 'lg:pl-72'}`}>
        <StudentTopbar onUpgradeClick={() => setShowPremiumModal(true)} />

        <main className="relative p-6 max-w-7xl mx-auto min-h-[calc(100vh-100px)] overflow-hidden">
            
            {/* Header - Visible */}
            <div className="mb-8 relative z-10">
                <h1 className="text-3xl font-bold text-slate-900 dark:text-white flex items-center gap-3">
                    <CalendarIcon className="h-8 w-8 text-indigo-600" />
                    My Schedule
                </h1>
                <p className="text-slate-500 dark:text-slate-400 mt-1">Manage your upcoming classes and learning sessions.</p>
            </div>

            {/* Blurred Content Container */}
            <div className="relative">
                {/* The "Blurred" Content */}
                <div className="filter blur-md select-none pointer-events-none opacity-50 dark:opacity-30">
                    <div className="space-y-4">
                        {/* Day Header */}
                        <div className="flex items-center gap-4 mb-6">
                            <div className="text-2xl font-bold text-slate-800 dark:text-slate-200">Today</div>
                            <div className="h-px bg-slate-200 dark:bg-slate-800 flex-1"></div>
                        </div>

                        {/* Dummy Items */}
                        {dummySchedule.map((item, i) => (
                            <div key={i} className="flex items-center p-6 bg-white dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-800 shadow-sm">
                                <div className="w-24 font-bold text-slate-700 dark:text-slate-300">{item.time}</div>
                                <div className="w-px h-10 bg-slate-100 dark:bg-slate-800 mx-6"></div>
                                <div className="flex-1">
                                    <h3 className="font-semibold text-lg text-slate-900 dark:text-white">{item.event}</h3>
                                    <span className="inline-block mt-1 px-3 py-1 rounded-full text-xs bg-indigo-50 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300">{item.type}</span>
                                </div>
                                <ChevronRight className="h-5 w-5 text-slate-400" />
                            </div>
                        ))}
                         
                         <div className="flex items-center gap-4 my-8">
                            <div className="text-2xl font-bold text-slate-800 dark:text-slate-200">Tomorrow</div>
                            <div className="h-px bg-slate-200 dark:bg-slate-800 flex-1"></div>
                        </div>

                         {dummySchedule.slice(0, 2).map((item, i) => (
                            <div key={`tomorrow-${i}`} className="flex items-center p-6 bg-white dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-800 shadow-sm">
                                <div className="w-24 font-bold text-slate-700 dark:text-slate-300">{item.time}</div>
                                <div className="w-px h-10 bg-slate-100 dark:bg-slate-800 mx-6"></div>
                                <div className="flex-1">
                                    <h3 className="font-semibold text-lg text-slate-900 dark:text-white">{item.event}</h3>
                                    <span className="inline-block mt-1 px-3 py-1 rounded-full text-xs bg-purple-50 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300">{item.type}</span>
                                </div>
                                <ChevronRight className="h-5 w-5 text-slate-400" />
                            </div>
                        ))}
                    </div>
                </div>

                {/* Lock Overlay */}
                <div className="absolute inset-0 z-20 flex flex-col items-center justify-center -mt-20">
                    <div className="relative group cursor-pointer" onClick={() => setShowPremiumModal(true)}>
                        {/* Glow Effect */}
                        <div className="absolute -inset-4 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 opacity-30 rounded-full blur-xl group-hover:opacity-50 transition-opacity duration-1000 animate-pulse"></div>
                        
                        <div className="relative bg-white dark:bg-slate-900 p-8 rounded-2xl shadow-2xl border border-slate-100 dark:border-slate-700 text-center max-w-md mx-auto transform transition-transform group-hover:scale-105">
                            <div className="h-16 w-16 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg shadow-indigo-500/30">
                                <Lock className="h-8 w-8 text-white" />
                            </div>
                            
                            <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">
                                Unlock Your Schedule
                            </h2>
                            <p className="text-slate-500 dark:text-slate-400 mb-8 leading-relaxed">
                                Get access to advanced scheduling, live class reminders, and exclusive 1-on-1 mentorship sessions with our Premium plan.
                            </p>
                            
                            <Button 
                                size="lg" 
                                className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white shadow-lg shadow-indigo-500/20"
                            >
                                <Star className="h-4 w-4 mr-2 fill-current" />
                                Upgrade to Premium
                            </Button>
                            
                            <p className="mt-4 text-xs text-slate-400">
                                30-day money-back guarantee. Cancel anytime.
                            </p>
                        </div>
                    </div>
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
}
