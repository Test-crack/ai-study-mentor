import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { BookOpen, Play, TrendingUp } from 'lucide-react';
import { Button } from '@/shared/components/ui/button';
import { Card, CardContent } from '@/shared/components/ui/card';
import { StudentSidebar } from './dashboard/StudentSidebar';
import { StudentTopbar } from './dashboard/StudentTopbar';
import { ReadingStatsWidget } from './dashboard/ReadingStatsWidget';
import { AssessmentHistoryWidget } from './dashboard/AssessmentHistoryWidget';
import { getUserProfile } from '@/features/reading-assessment/services/reading-api';
import { ZenAssessmentRunner } from './dashboard/ZenAssessmentRunner';

export default function StudentReadingAssessmentPage() {
  const navigate = useNavigate();
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isTakingAssessment, setIsTakingAssessment] = useState(false);
  const [stats, setStats] = useState({
    wpm: 0,
    accuracy: 0,
    assessmentsCompleted: 0,
    bestWpm: 0
  });

  useEffect(() => {
    loadData();
  }, [isTakingAssessment]); // Reload stats after assessment

  const loadData = async () => {
      try {
        const profile = await getUserProfile();
        setStats({
          wpm: Math.round(profile.current.weightedWPM),
          accuracy: Math.round(profile.current.retention),
          assessmentsCompleted: profile.stats.totalAssessments,
          bestWpm: Math.round(profile.best.weightedWPM)
        });
      } catch (error) {
        console.error("Failed to load reading profile", error);
      } finally {
        setLoading(false);
      }
    };

  return (
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-slate-950 transition-colors duration-300">
      {/* If taking assessment, show Zen Runner in full screen overlay/replacement */}
      {isTakingAssessment ? (
        <ZenAssessmentRunner 
            onCancel={() => setIsTakingAssessment(false)}
            onComplete={() => setIsTakingAssessment(false)}
        />
      ) : (
        <>
            <StudentSidebar 
                activeTab="assessment" 
                onTabChange={(tab) => {
                    if (tab === 'dashboard') navigate('/student/dashboard');
                    if (tab === 'courses') navigate('/student/courses');
                    if (tab === 'settings') navigate('/student/settings');
                    if (tab === 'schedule') navigate('/student/schedule');
                    if (tab === 'assessment') setIsTakingAssessment(false);
                }}
                isCollapsed={isSidebarCollapsed}
                toggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
            />

            <div className={`transition-all duration-300 ${isSidebarCollapsed ? 'lg:pl-24' : 'lg:pl-72'}`}>
                <StudentTopbar onUpgradeClick={() => {}} />

                <main className="p-6 max-w-7xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                    
                    {/* Header */}
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                        <div>
                            <h1 className="text-3xl font-bold text-slate-900 dark:text-white flex items-center gap-3">
                                <BookOpen className="h-8 w-8 text-indigo-600" />
                                Reading Assessment
                            </h1>
                            <p className="text-slate-500 dark:text-slate-400 mt-1">Measure and improve your reading speed and comprehension.</p>
                        </div>
                        <Button 
                            size="lg" 
                            className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-500/20"
                            onClick={() => setIsTakingAssessment(true)}
                        >
                            <Play className="h-4 w-4 mr-2 fill-current" />
                            Take Assessment
                        </Button>
                    </div>

                    {/* Stats Overview */}
                    {loading ? (
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
                            {[1,2,3,4].map(i => <div key={i} className="h-32 bg-slate-100 dark:bg-slate-800 rounded-xl animate-pulse"></div>)}
                        </div>
                    ) : (
                        <ReadingStatsWidget {...stats} />
                    )}

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">


                        <div className="lg:col-span-2 space-y-6">
                            <div className="flex items-center justify-between">
                                <h2 className="text-xl font-bold text-slate-900 dark:text-white">Recent Assessments</h2>
                                <Button variant="ghost" size="sm" onClick={() => navigate('/student/reading-assessment/history')}>View All</Button>
                            </div>
                            
                            <AssessmentHistoryWidget />
                        </div>

                        <div className="space-y-6">
                            <Card className="bg-gradient-to-br from-slate-900 to-slate-800 text-white border-none shadow-lg">
                                <CardContent className="p-6 space-y-4">
                                    <div className="h-10 w-10 bg-white/10 rounded-lg flex items-center justify-center">
                                        <TrendingUp className="h-6 w-6 text-emerald-400" />
                                    </div>
                                    <h3 className="font-bold text-lg">Pro Tip</h3>
                                    <p className="text-slate-300 text-sm leading-relaxed">
                                        To improve retention, try to visualize what you're reading as a movie in your mind. This engages more parts of your brain.
                                    </p>
                                    <Button variant="outline" className="w-full border-white/20 bg-transparent hover:bg-white/10 text-white hover:text-white">
                                        View More Tips
                                    </Button>
                                </CardContent>
                            </Card>
                        </div>
                    </div>
                </main>
            </div>
        </>
      )}
    </div>
  );
}
