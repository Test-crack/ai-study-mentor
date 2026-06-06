import { useState } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { ChevronLeft, BarChart3, ClipboardList, BookOpen, Activity } from 'lucide-react';
import { InstructorSidebar } from '../components/dashboard/InstructorSidebar';
import { cn } from '@/shared/utils';
import { useStudentFullProgress } from '../hooks/useStudentFullProgress';
import { StudentProfileHeader } from './student-progress/StudentProfileHeader';
import { OverviewTab }       from './student-progress/OverviewTab';
import { IASessionsTab }     from './student-progress/IASessionsTab';
import { MockSessionsTab }   from './student-progress/MockSessionsTab';
import { DrillsTab }         from './student-progress/DrillsTab';

type Tab = 'overview' | 'ia' | 'mock' | 'drills';

const TABS: Array<{ id: Tab; label: string; icon: React.ReactNode }> = [
  { id: 'overview', label: 'Overview',    icon: <BarChart3     className="h-4 w-4" /> },
  { id: 'ia',       label: 'Assessments', icon: <ClipboardList className="h-4 w-4" /> },
  { id: 'mock',     label: 'Mock Tests',  icon: <BookOpen      className="h-4 w-4" /> },
  { id: 'drills',   label: 'Drills',      icon: <Activity      className="h-4 w-4" /> },
];

function PageSkeleton() {
  return (
    <div className="animate-pulse space-y-5">
      <div className="h-36 bg-slate-200 dark:bg-slate-800 rounded-2xl" />
      <div className="h-10 w-80 bg-slate-200 dark:bg-slate-800 rounded-xl" />
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[1,2,3,4].map(i => <div key={i} className="h-24 bg-slate-200 dark:bg-slate-800 rounded-2xl" />)}
      </div>
      <div className="h-64 bg-slate-200 dark:bg-slate-800 rounded-2xl" />
    </div>
  );
}

export default function InstructorStudentProgressPage() {
  const navigate  = useNavigate();
  const location  = useLocation();
  const { batchId, studentId } = useParams<{
    batchId?: string; studentId?: string;
  }>();

  // Support both new route (/batches/:batchId/students/:studentId/progress)
  // and old route (/student/:studentSlug/progress) for backward compat
  const resolvedBatchId   = batchId   ?? (location.state?.batchId as string | undefined) ?? null;
  const resolvedStudentId = studentId ?? (location.state?.studentId as string | undefined) ?? null;

  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [activeTab, setActiveTab] = useState<Tab>('overview');

  const { data, loading, error } = useStudentFullProgress(resolvedBatchId, resolvedStudentId);

  const goBack = () => {
    if (resolvedBatchId) {
      navigate('/instructor/dashboard');
    } else {
      navigate(-1);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 transition-colors duration-300 flex">
      <InstructorSidebar
        activeTab="batches"
        isCollapsed={isSidebarCollapsed}
        toggleCollapse={() => setIsSidebarCollapsed(c => !c)}
      />

      <div className={cn(
        'transition-all duration-300 min-h-screen flex flex-col w-full',
        isSidebarCollapsed ? 'lg:pl-20' : 'lg:pl-72'
      )}>
        <main className="p-4 md:p-6 max-w-6xl mx-auto w-full pt-8 space-y-0">

          {/* Back button */}
          <button
            onClick={goBack}
            className="flex items-center gap-1.5 text-sm text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 font-semibold mb-5 transition-colors"
          >
            <ChevronLeft className="h-4 w-4" />
            Back to Dashboard
          </button>

          {loading && <PageSkeleton />}

          {!loading && error && (
            <div className="bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/30 rounded-2xl p-8 text-center">
              <p className="text-rose-700 dark:text-rose-400 font-semibold">{error}</p>
            </div>
          )}

          {!loading && !error && !resolvedStudentId && (
            <div className="bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/30 rounded-2xl p-8 text-center">
              <p className="text-amber-700 dark:text-amber-400 font-semibold">Student ID missing. Please navigate from the dashboard.</p>
            </div>
          )}

          {!loading && data && (
            <div className="space-y-5 animate-in fade-in slide-in-from-bottom-4 duration-400">
              {/* Profile header */}
              <StudentProfileHeader data={data} />

              {/* Tab bar */}
              <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm p-1.5 flex gap-1 w-fit">
                {TABS.map(tab => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={cn(
                      'flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-200 whitespace-nowrap',
                      activeTab === tab.id
                        ? 'bg-indigo-600 text-white shadow-sm'
                        : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800'
                    )}
                  >
                    {tab.icon}
                    {tab.label}
                  </button>
                ))}
              </div>

              {/* Tab content */}
              {activeTab === 'overview' && <OverviewTab data={data} />}
              {activeTab === 'ia'       && <IASessionsTab sessions={data.ia_sessions} />}
              {activeTab === 'mock'     && <MockSessionsTab sessions={data.mock_sessions} />}
              {activeTab === 'drills'   && (
                <DrillsTab
                  drillStats={data.drill_stats}
                  lexiStats={data.lexigrid_stats}
                  streak={data.daily_streak}
                />
              )}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
