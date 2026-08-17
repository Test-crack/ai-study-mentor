// src/features/Institute/dashboard/InstituteAdminStudentProgressPage.tsx
// Full student progress inside the ADMIN portal — same shared tab components
// the owner/instructor views use, fetched via the admin-mounted endpoint
// GET /api/institute-admin/students/:studentId/full-progress.
import { useState, useEffect, useCallback } from "react";
import { useNavigate, useLocation, useParams } from "react-router-dom";
import { ChevronLeft, BarChart3, ClipboardList, BookOpen, Activity, FileSearch } from "lucide-react";
import { InstituteAdminLayout } from "../components/InstituteAdminLayout";
import { ErrorBanner } from "../components/shared/primitives";
import { cn, getBackendUrl } from "@/shared/utils";
import { callBackend } from "@/features/auth/services/authClient";
import { StudentProfileHeader } from "@/features/instructor/components/student-progress/StudentProfileHeader";
import { OverviewTab }     from "@/features/instructor/components/student-progress/OverviewTab";
import { IASessionsTab }   from "@/features/instructor/components/student-progress/IASessionsTab";
import { MockSessionsTab } from "@/features/instructor/components/student-progress/MockSessionsTab";
import { DrillsTab }       from "@/features/instructor/components/student-progress/DrillsTab";
import { DiagnosticTab }   from "@/features/instructor/components/student-progress/DiagnosticTab";
import type { StudentFullProgress } from "@/features/instructor/components/student-progress/types";

type Tab = "overview" | "ia" | "mock" | "drills" | "diagnostic";

const TABS: Array<{ id: Tab; label: string; icon: React.ReactNode }> = [
  { id: "overview",   label: "Overview",    icon: <BarChart3     className="h-4 w-4" /> },
  { id: "ia",         label: "Assessments", icon: <ClipboardList className="h-4 w-4" /> },
  { id: "mock",       label: "Mock Tests",  icon: <BookOpen      className="h-4 w-4" /> },
  { id: "drills",     label: "Drills",      icon: <Activity      className="h-4 w-4" /> },
  { id: "diagnostic", label: "Diagnostic",  icon: <FileSearch    className="h-4 w-4" /> },
];

function PageSkeleton() {
  return (
    <div className="animate-pulse space-y-5">
      <div className="h-36 bg-slate-200 dark:bg-white/[0.04] rounded-2xl" />
      <div className="h-10 w-80 bg-slate-200 dark:bg-white/[0.04] rounded-xl" />
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[1, 2, 3, 4].map(i => <div key={i} className="h-24 bg-slate-200 dark:bg-white/[0.04] rounded-2xl" />)}
      </div>
      <div className="h-64 bg-slate-200 dark:bg-white/[0.04] rounded-2xl" />
    </div>
  );
}

export default function InstituteAdminStudentProgressPage() {
  const navigate = useNavigate();
  const location = useLocation();
  useParams<{ studentSlug: string }>();

  const resolvedStudentId: string | null = (location.state as any)?.studentId ?? null;

  const [activeTab, setActiveTab] = useState<Tab>("overview");
  const [data, setData] = useState<StudentFullProgress | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!resolvedStudentId) return;
    setLoading(true);
    setError(null);
    try {
      const res = await callBackend(
        `${getBackendUrl()}/api/institute-admin/students/${resolvedStudentId}/full-progress`
      );
      if (res?.success) setData(res.data as StudentFullProgress);
      else setError(res?.error ?? "Failed to load student data.");
    } catch (e: any) {
      setError(e?.message ?? "Network error.");
    } finally {
      setLoading(false);
    }
  }, [resolvedStudentId]);

  useEffect(() => { setData(null); load(); }, [load]);

  const resetDiagnostic = useCallback(async (skill: string) => {
    const res = await callBackend(
      `${getBackendUrl()}/api/institute-admin/students/${resolvedStudentId}/diagnostic/reset`,
      { method: "POST", body: JSON.stringify({ skill }) }
    );
    if (!res?.success) throw new Error(res?.error ?? "Failed to reset diagnostic.");
    await load();
  }, [resolvedStudentId, load]);

  return (
    <InstituteAdminLayout activeTab="students">
      <button
        onClick={() => navigate("/institute-admin/students")}
        className="inline-flex items-center gap-1.5 text-sm font-bold text-slate-500 dark:text-slate-400 hover:text-brand-teal-600 dark:hover:text-brand-teal-400 transition-colors"
      >
        <ChevronLeft className="h-4 w-4" /> Back to Students
      </button>

      {!resolvedStudentId && (
        <ErrorBanner message="No student selected — open this page from the Students list." />
      )}
      {error && <ErrorBanner message={error} onRetry={load} />}

      {loading || (!data && resolvedStudentId && !error) ? (
        <PageSkeleton />
      ) : data ? (
        <>
          <StudentProfileHeader data={data} />

          <div className="flex gap-1.5 flex-wrap">
            {TABS.map((t) => (
              <button
                key={t.id}
                onClick={() => setActiveTab(t.id)}
                className={cn(
                  "inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-colors",
                  activeTab === t.id
                    ? "bg-brand-teal-600 text-white shadow-sm"
                    : "bg-white dark:bg-white/[0.04] text-slate-600 dark:text-slate-300 border border-slate-200/70 dark:border-white/[0.06] hover:bg-slate-50 dark:hover:bg-white/[0.08]"
                )}
              >
                {t.icon} {t.label}
              </button>
            ))}
          </div>

          {activeTab === "overview"   && <OverviewTab data={data} />}
          {activeTab === "ia"         && <IASessionsTab sessions={data.ia_sessions} />}
          {activeTab === "mock"       && <MockSessionsTab sessions={data.mock_sessions} />}
          {activeTab === "drills"     && (
            <DrillsTab
              drillStats={data.drill_stats}
              lexiStats={data.lexigrid_stats}
              streak={data.daily_streak}
            />
          )}
          {activeTab === "diagnostic" && (
            <DiagnosticTab
              results={(data as any).diagnostic_results ?? []}
              studentName={(data as any).student?.name}
              onRequestReset={resetDiagnostic}
            />
          )}
        </>
      ) : null}
    </InstituteAdminLayout>
  );
}
