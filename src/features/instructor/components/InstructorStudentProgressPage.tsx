import { useState } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { ChevronLeft, BarChart3, ClipboardList, BookOpen, Activity, FileSearch, Dumbbell } from 'lucide-react';
import { InstructorSidebar } from '../components/dashboard/InstructorSidebar';
import { cn } from '@/shared/utils';
import { callBackend } from '@/features/auth/services/authClient';
import { useStudentFullProgress } from '../hooks/useStudentFullProgress';
import { StudentProfileHeader } from './student-progress/StudentProfileHeader';
import { OverviewTab }          from './student-progress/OverviewTab';
import { IASessionsTab }        from './student-progress/IASessionsTab';
import { MockSessionsTab }      from './student-progress/MockSessionsTab';
import { DrillsTab }            from './student-progress/DrillsTab';
import { DiagnosticTab }        from './student-progress/DiagnosticTab';
import { PracticeHistoryTab }   from './student-progress/PracticeHistoryTab';

type Tab = 'overview' | 'ia' | 'mock' | 'drills' | 'diagnostic' | 'practice';

const TABS: Array<{ id: Tab; label: string; icon: React.ReactNode }> = [
  { id: 'overview',    label: 'Overview',    icon: <BarChart3     className="h-4 w-4" /> },
  { id: 'ia',          label: 'Assessments', icon: <ClipboardList className="h-4 w-4" /> },
  { id: 'mock',        label: 'Mock Tests',  icon: <BookOpen      className="h-4 w-4" /> },
  { id: 'drills',      label: 'Drills',      icon: <Activity      className="h-4 w-4" /> },
  { id: 'diagnostic',  label: 'Diagnostic',  icon: <FileSearch    className="h-4 w-4" /> },
  { id: 'practice',    label: 'Practice',    icon: <Dumbbell      className="h-4 w-4" /> },
];

function PageSkeleton() {
  return (
    <div className="animate-pulse space-y-5">
      <div className="h-36 bg-brand-bg-alt rounded-2xl" />
      <div className="h-10 w-80 bg-brand-bg-alt rounded-xl" />
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[1,2,3,4].map(i => <div key={i} className="h-24 bg-brand-bg-alt rounded-2xl" />)}
      </div>
      <div className="h-64 bg-brand-bg-alt rounded-2xl" />
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
  const initialTab        = (location.state?.initialTab as Tab | undefined) ?? 'overview';

  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [activeTab, setActiveTab] = useState<Tab>(initialTab);

  const { data, loading, error, refetch } = useStudentFullProgress(resolvedBatchId, resolvedStudentId);

  const BACKEND = import.meta.env.VITE_BACKEND_URL || 'http://localhost:4000';
  // Calls Shalom's retake endpoint (S-D3) — contract unconfirmed, same caveat as
  // the batch-level Retake button in DiagnosticOverviewTab. Whole-diagnostic only,
  // no per-skill support, so the skill arg from DiagnosticTab is ignored here.
  const handleRequestRetake = async (_skill?: string) => {
    if (!resolvedBatchId || !resolvedStudentId) return;
    const res = await callBackend(
      `${BACKEND}/api/instructor/batches/${resolvedBatchId}/students/${resolvedStudentId}/diagnostic/retake`,
      { method: 'POST' }
    );
    if (!res?.success) throw new Error(res?.error ?? 'Failed to request retake.');
    refetch();
  };

  const goBack = () => {
    if (resolvedBatchId) {
      navigate('/instructor/dashboard');
    } else {
      navigate(-1);
    }
  };

  return (
    <div className="relative min-h-screen font-plex antialiased overflow-x-hidden bg-brand-bg text-brand-text flex">
      <InstructorSidebar
        activeTab="batches"
        isCollapsed={isSidebarCollapsed}
        toggleCollapse={() => setIsSidebarCollapsed(c => !c)}
      />

      <div className={cn(
        'relative z-10 transition-all duration-300 min-h-screen flex flex-col w-full',
        isSidebarCollapsed ? 'lg:pl-24' : 'lg:pl-72'
      )}>
        <main className="p-4 md:p-6 max-w-6xl mx-auto w-full pt-8 space-y-0">

          {/* Back button */}
          <button
            onClick={goBack}
            className="flex items-center gap-1.5 text-sm text-brand-text-mute hover:text-brand-teal-600 font-semibold mb-5 transition-colors"
          >
            <ChevronLeft className="h-4 w-4" />
            Back to Dashboard
          </button>

          {loading && <PageSkeleton />}

          {!loading && error && (
            <div className="bg-rose-50 border border-rose-200 rounded-2xl p-8 text-center">
              <p className="text-rose-700 font-semibold">{error}</p>
            </div>
          )}

          {!loading && !error && !resolvedStudentId && (
            <div className="bg-amber-50 border border-amber-200 rounded-2xl p-8 text-center space-y-3">
              <p className="text-amber-700 font-semibold">Session expired or direct URL access.</p>
              <p className="text-amber-600 text-sm">Please navigate to a student from the dashboard or batch view.</p>
              <button
                onClick={() => navigate('/instructor/dashboard')}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-600 text-white text-sm font-semibold hover:bg-amber-700 transition-colors"
              >
                Go to Dashboard
              </button>
            </div>
          )}

          {!loading && data && (
            <div className="space-y-5 animate-in fade-in slide-in-from-bottom-4 duration-400">
              {/* Profile header */}
              <StudentProfileHeader data={data} />

              {/* Tab bar — six tabs with whitespace-nowrap overflow a phone
                  viewport, and w-fit alone gave no scroll affordance, so the
                  last tabs were simply unreachable. Scrolls horizontally below
                  the break, unchanged once it fits. */}
              <div className="max-w-full overflow-x-auto -mx-1 px-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              <div className="bg-white rounded-2xl border border-brand-line shadow-sm p-1.5 flex gap-1 w-fit min-w-max">
                {TABS.map(tab => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={cn(
                      'flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-200 whitespace-nowrap',
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
              </div>

              {/* Tab content */}
              {activeTab === 'overview'   && <OverviewTab data={data} />}
              {activeTab === 'ia'         && <IASessionsTab sessions={data.ia_sessions} />}
              {activeTab === 'mock'       && <MockSessionsTab sessions={data.mock_sessions} />}
              {activeTab === 'drills'     && (
                <DrillsTab
                  drillStats={data.drill_stats}
                  lexiStats={data.lexigrid_stats}
                  streak={data.daily_streak}
                  reflections={data.recent_reflections}
                />
              )}
              {activeTab === 'practice'   && resolvedStudentId && (
                <PracticeHistoryTab studentId={resolvedStudentId} />
              )}
              {activeTab === 'diagnostic' && (
                <DiagnosticTab
                  results={data.diagnostic_results ?? []}
                  studentName={data.student?.name}
                  onRequestReset={handleRequestRetake}
                  perSkillReset={false}
                />
              )}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
