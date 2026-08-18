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
      <div className="h-36 bg-brand-bg-alt rounded-2xl" />
      <div className="h-10 w-full max-w-xs bg-brand-bg-alt rounded-xl" />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {[1, 2, 3, 4].map(i => <div key={i} className="h-24 bg-brand-bg-alt rounded-2xl" />)}
      </div>
      <div className="h-64 bg-brand-bg-alt rounded-2xl" />
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

  const resetDiagnostic = useCallback(async (skill: string) => {
    const res = await callBackend(
      `${getBackendUrl()}/api/institute-owner/students/${resolvedStudentId}/diagnostic/reset`,
      { method: 'POST', body: JSON.stringify({ skill }) }
    );
    if (!res?.success) throw new Error(res?.error ?? 'Failed to reset diagnostic.');
    await load();
  }, [resolvedStudentId, load]);

  return (
    <div className="relative min-h-screen font-plex antialiased overflow-x-hidden bg-brand-bg text-brand-text">
      <InstituteOwnerSidebar
        activeTab="students"
        isCollapsed={isSidebarCollapsed}
        toggleCollapse={() => setIsSidebarCollapsed(c => !c)}
      />

      <div className={cn(
        'relative z-10 transition-all duration-300',
        isSidebarCollapsed ? 'lg:pl-24' : 'lg:pl-72'
      )}>
        <main className="px-4 sm:px-6 lg:px-8 py-6 sm:py-8 max-w-[90rem] mx-auto w-full pb-16 space-y-0">

          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-1.5 min-h-[40px] text-sm text-brand-text-mute hover:text-brand-teal-600 font-semibold mb-5 transition-colors"
          >
            <ChevronLeft className="h-4 w-4" />
            Back
          </button>

          {loading && <PageSkeleton />}

          {!loading && error && (
            <div className="bg-rose-50 border border-rose-200 rounded-2xl p-6 sm:p-8 text-center">
              <p className="text-rose-700 font-semibold">{error}</p>
            </div>
          )}

          {!loading && !error && !resolvedStudentId && (
            <div className="bg-amber-50 border border-amber-200 rounded-2xl p-6 sm:p-8 text-center space-y-3">
              <p className="text-amber-700 font-semibold">Session expired or direct URL access.</p>
              <p className="text-amber-600 text-sm">Please navigate to a student from the dashboard or students list.</p>
              <button
                onClick={() => navigate('/institute-owner/students')}
                className="inline-flex items-center gap-2 min-h-[44px] px-4 py-2 rounded-xl bg-amber-600 text-white text-sm font-semibold hover:bg-amber-700 transition-colors"
              >
                Go to Students
              </button>
            </div>
          )}

          {!loading && data && (
            <div className="space-y-5 animate-in fade-in slide-in-from-bottom-4 duration-400">
              <StudentProfileHeader data={data} />

              <div className="bg-white rounded-2xl border border-brand-line shadow-sm p-1.5 flex gap-1 w-full sm:w-fit overflow-x-auto">
                {TABS.map(tab => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={cn(
                      'flex items-center gap-2 min-h-[40px] px-3 sm:px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-200 whitespace-nowrap',
                      activeTab === tab.id
                        ? 'bg-brand-teal-600 text-white shadow-sm'
                        : 'text-brand-text-mute hover:text-brand-text hover:bg-brand-bg-alt'
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
                <DiagnosticTab
                  results={(data as any).diagnostic_results ?? []}
                  studentName={(data as any).student?.name}
                  onRequestReset={resetDiagnostic}
                />
              )}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
