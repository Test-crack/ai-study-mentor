import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { ChevronLeft, BarChart3, ClipboardList, BookOpen, Activity, FileSearch } from 'lucide-react';
import { InstituteOwnerSidebar } from '../components/InstitiuteOwnerSidebar';
import { cn } from '@/shared/utils';
import { callBackend } from '@/features/auth/services/authClient';
import { getBackendUrl } from '@/shared/utils';
import { StudentProfileHeader } from '@/features/instructor/components/student-progress/StudentProfileHeader';
import { OverviewTab }          from '@/features/instructor/components/student-progress/OverviewTab';
import { IASessionsTab }        from '@/features/instructor/components/student-progress/IASessionsTab';
import { MockSessionsTab }      from '@/features/instructor/components/student-progress/MockSessionsTab';
import { DrillsTab }            from '@/features/instructor/components/student-progress/DrillsTab';
import { DiagnosticTab }        from '@/features/instructor/components/student-progress/DiagnosticTab';
import type { StudentFullProgress } from '@/features/instructor/components/student-progress/types';

type Tab = 'overview' | 'ia' | 'mock' | 'drills' | 'diagnostic';

const TABS: Array<{ id: Tab; label: string; icon: React.ReactNode }> = [
  { id: 'overview',    label: 'Overview',    icon: <BarChart3     className="h-4 w-4" /> },
  { id: 'ia',          label: 'Assessments', icon: <ClipboardList className="h-4 w-4" /> },
  { id: 'mock',        label: 'Mock Tests',  icon: <BookOpen      className="h-4 w-4" /> },
  { id: 'drills',      label: 'Drills',      icon: <Activity      className="h-4 w-4" /> },
  { id: 'diagnostic',  label: 'Diagnostic',  icon: <FileSearch    className="h-4 w-4" /> },
];

function PageSkeleton() {
  return (
    <div className="animate-pulse space-y-5">
      <div className="h-36 bg-slate-200 dark:bg-slate-800 rounded-2xl" />
      <div className="h-10 w-80 bg-slate-200 dark:bg-slate-800 rounded-xl" />
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[1, 2, 3, 4].map(i => <div key={i} className="h-24 bg-slate-200 dark:bg-slate-800 rounded-2xl" />)}
      </div>
      <div className="h-64 bg-slate-200 dark:bg-slate-800 rounded-2xl" />
    </div>
  );
}

export default function InstituteOwnerStudentProgressPage() {
  const navigate  = useNavigate();
  const location  = useLocation();
  useParams<{ studentSlug: string }>();

  const resolvedStudentId: string | null =
    (location.state as any)?.studentId ??
    (location.state as any)?.student?.user_id ??
    null;

  const initialTab = (location.state as any)?.initialTab as Tab | undefined;

  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [activeTab, setActiveTab] = useState<Tab>(initialTab ?? 'overview');
  const [data,    setData]    = useState<StudentFullProgress | null>(null);
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!resolvedStudentId) return;
    setLoading(true);
    setError(null);
    try {
      const res = await callBackend(
        `${getBackendUrl()}/api/institute-owner/students/${resolvedStudentId}/full-progress`
      );
      if (res?.success) {
        setData(res.data as StudentFullProgress);
      } else {
        setError(res?.error ?? 'Failed to load student data.');
      }
    } catch (e: any) {
      setError(e?.message ?? 'Network error.');
    } finally {
      setLoading(false);
    }
  }, [resolvedStudentId]);

  useEffect(() => { setData(null); load(); }, [load]);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 transition-colors duration-300 flex">
      <div className="hidden lg:block">
        <InstituteOwnerSidebar
          activeTab="students"
          isCollapsed={isSidebarCollapsed}
          toggleCollapse={() => setIsSidebarCollapsed(c => !c)}
        />
      </div>

      <div className={cn(
        'transition-all duration-300 min-h-screen flex flex-col w-full',
        isSidebarCollapsed ? 'lg:pl-20' : 'lg:pl-64'
      )}>
        <main className="p-4 md:p-6 max-w-6xl mx-auto w-full pt-8 space-y-0">

          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-1.5 text-sm text-slate-500 dark:text-slate-400 hover:text-brand-teal-600 dark:hover:text-brand-teal-400 font-semibold mb-5 transition-colors"
          >
            <ChevronLeft className="h-4 w-4" />
            Back
          </button>

          {loading && <PageSkeleton />}

          {!loading && error && (
            <div className="bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/30 rounded-2xl p-8 text-center">
              <p className="text-rose-700 dark:text-rose-400 font-semibold">{error}</p>
            </div>
          )}

          {!loading && !error && !resolvedStudentId && (
            <div className="bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/30 rounded-2xl p-8 text-center space-y-3">
              <p className="text-amber-700 dark:text-amber-400 font-semibold">Session expired or direct URL access.</p>
              <p className="text-amber-600 dark:text-amber-500 text-sm">Please navigate to a student from the dashboard or students list.</p>
              <button
                onClick={() => navigate('/institute-owner/students')}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-600 text-white text-sm font-semibold hover:bg-amber-700 transition-colors"
              >
                Go to Students
              </button>
            </div>
          )}

          {!loading && data && (
            <div className="space-y-5 animate-in fade-in slide-in-from-bottom-4 duration-400">
              <StudentProfileHeader data={data} />

              <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm p-1.5 flex gap-1 w-fit">
                {TABS.map(tab => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={cn(
                      'flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-200 whitespace-nowrap',
                      activeTab === tab.id
                        ? 'bg-brand-teal-600 text-white shadow-sm'
                        : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800'
                    )}
                  >
                    {tab.icon}
                    {tab.label}
                  </button>
                ))}
              </div>

              {activeTab === 'overview'   && <OverviewTab data={data} />}
              {activeTab === 'ia'         && <IASessionsTab sessions={data.ia_sessions} />}
              {activeTab === 'mock'       && <MockSessionsTab sessions={data.mock_sessions} />}
              {activeTab === 'drills'     && (
                <DrillsTab
                  drillStats={data.drill_stats}
                  lexiStats={data.lexigrid_stats}
                  streak={data.daily_streak}
                />
              )}
              {activeTab === 'diagnostic' && (
                <DiagnosticTab results={(data as any).diagnostic_results ?? []} />
              )}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
