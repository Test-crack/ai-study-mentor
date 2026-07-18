// src/features/Institute/dashboard/InstituteDashboard.tsx
// Admin dashboard — fully data-driven (replaces the old 100%-mock page).
// Sources: GET /summary (KPIs), GET /onboarding-status (needs attention),
// GET /batches (capacity overview), GET /instructors (tutor snapshot).
import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Users, UserCheck, Layers, AlertTriangle, Activity,
  UserPlus, GraduationCap, ChevronRight, Mail, ArrowRight,
} from "lucide-react";
import { InstituteAdminLayout } from "../components/InstituteAdminLayout";
import {
  KpiCard, SectionCard, StatusBadge, TableSkeleton, CardGridSkeleton, EmptyState, ErrorBanner,
} from "../components/shared/primitives";
import {
  fetchSummary, fetchOnboardingStatus, fetchInstructorsOverview, resendStudentInvite,
  OnboardingPerson,
} from "../services/instituteAdminService";
import { fetchBatches, BatchSummary } from "../services/batchService";
import type { InstituteSummary, InstructorRow } from "@/features/InstituteOwner/services/instituteOwnerService";
import { Avatar, AvatarFallback, AvatarImage } from "@/shared/components/ui/avatar";
import { useToast } from "@/shared/hooks/use-toast";

// ─── Hero ─────────────────────────────────────────────────────────────────────

function HeroBanner({ summary }: { summary: InstituteSummary }) {
  const navigate = useNavigate();
  return (
    <div className="w-full relative overflow-hidden rounded-2xl bg-indigo-50 dark:bg-blue-950 border border-indigo-100 dark:border-blue-800/60 p-6 sm:p-8 shadow-[0_2px_12px_-4px_rgba(15,23,42,0.08)] dark:shadow-none transition-colors duration-500">
      <div className="pointer-events-none absolute -top-10 -right-10 w-48 h-48 rounded-full bg-indigo-200/40 dark:bg-blue-500/20 blur-2xl"></div>
      <div className="pointer-events-none absolute -bottom-12 left-1/4 w-40 h-40 rounded-full bg-indigo-200/40 dark:bg-blue-500/20 blur-2xl"></div>
      <div className="relative z-10 flex flex-col gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white mb-1">
            {summary.institute_name || "Institute Admin Portal"}
          </h1>
          <p className="text-slate-600 dark:text-blue-200/70 text-sm">
            <strong className="text-slate-900 dark:text-white font-semibold">{summary.total_students}</strong> students
            across <strong className="text-slate-900 dark:text-white font-semibold">{summary.total_batches}</strong> batches
            {" · "}
            <strong className="text-slate-900 dark:text-white font-semibold">{summary.instructor_count}</strong> tutors
            {summary.avg_band != null && <> · average band <strong className="text-slate-900 dark:text-white font-semibold">{summary.avg_band}</strong></>}
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <button
            onClick={() => navigate("/institute-admin/studentOnboarding")}
            className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold px-4 py-2.5 rounded-xl transition-colors shadow-sm"
          >
            <UserPlus className="h-4 w-4" /> Onboard Students
          </button>
          <button
            onClick={() => navigate("/institute-admin/tutorOnboarding")}
            className="inline-flex items-center gap-2 bg-white dark:bg-white/10 hover:bg-indigo-50 dark:hover:bg-white/20 text-indigo-700 dark:text-white text-sm font-bold px-4 py-2.5 rounded-xl border border-indigo-200 dark:border-white/20 transition-colors"
          >
            <GraduationCap className="h-4 w-4" /> Onboard Tutors
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Needs attention (honest replacement for the mock approve/reject queue) ───

function NeedsAttentionPanel({
  students, tutors, onResent,
}: {
  students: OnboardingPerson[];
  tutors: OnboardingPerson[];
  onResent: (userId: string) => void;
}) {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [sending, setSending] = useState<string | null>(null);

  const resend = async (p: OnboardingPerson) => {
    setSending(p.userId);
    try {
      const res = await resendStudentInvite(p.userId);
      toast({
        title: res.data.emailSent ? "Invite re-sent" : "Invite could not be emailed",
        description: res.data.emailSent
          ? `${p.name ?? p.email} will receive a fresh invite email.`
          : "The email service failed — try again in a moment.",
        variant: res.data.emailSent ? undefined : "destructive",
      });
      if (res.data.emailSent) onResent(p.userId);
    } catch (err: any) {
      toast({ title: "Failed to resend invite", description: err?.message, variant: "destructive" });
    } finally {
      setSending(null);
    }
  };

  const total = students.length + tutors.length;

  return (
    <SectionCard title="Needs Attention" icon={AlertTriangle}
      actions={total > 0 ? <StatusBadge tone="warning">{total}</StatusBadge> : undefined}>
      {total === 0 ? (
        <EmptyState
          title="Everyone is set up"
          hint="All invited students have started, and every tutor has a batch."
        />
      ) : (
        <div className="space-y-1">
          {students.map((p) => (
            <div key={p.userId} className="flex items-center gap-3 py-2.5 border-b border-slate-50 dark:border-white/[0.04] last:border-0">
              <Avatar className="h-9 w-9 shrink-0">
                <AvatarImage src={p.profileImage ?? ""} />
                <AvatarFallback className="bg-indigo-100 dark:bg-indigo-500/20 text-indigo-700 dark:text-indigo-300 text-xs font-bold">
                  {(p.name ?? p.email).slice(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-slate-800 dark:text-slate-200 truncate">{p.name ?? p.email}</p>
                <p className="text-xs text-slate-400 truncate">invited {new Date(p.invitedAt).toLocaleDateString("en-IN", { day: "numeric", month: "short" })} · hasn't started yet</p>
              </div>
              <button
                onClick={() => resend(p)}
                disabled={sending === p.userId}
                className="inline-flex items-center gap-1.5 text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-500/10 px-3 py-1.5 rounded-lg transition-colors disabled:opacity-50 shrink-0"
              >
                <Mail className="h-3.5 w-3.5" /> {sending === p.userId ? "Sending…" : "Resend invite"}
              </button>
            </div>
          ))}
          {tutors.map((p) => (
            <div key={p.userId} className="flex items-center gap-3 py-2.5 border-b border-slate-50 dark:border-white/[0.04] last:border-0">
              <Avatar className="h-9 w-9 shrink-0">
                <AvatarImage src={p.profileImage ?? ""} />
                <AvatarFallback className="bg-amber-100 dark:bg-amber-500/20 text-amber-700 dark:text-amber-300 text-xs font-bold">
                  {(p.name ?? p.email).slice(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-slate-800 dark:text-slate-200 truncate">{p.name ?? p.email}</p>
                <p className="text-xs text-slate-400 truncate">tutor · not assigned to any batch</p>
              </div>
              <button
                onClick={() => navigate("/institute-admin/batches")}
                className="inline-flex items-center gap-1.5 text-xs font-bold text-amber-700 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-500/10 px-3 py-1.5 rounded-lg transition-colors shrink-0"
              >
                Assign to batch <ArrowRight className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}
    </SectionCard>
  );
}

// ─── Batches overview ─────────────────────────────────────────────────────────

function BatchesOverview({ batches }: { batches: BatchSummary[] }) {
  const navigate = useNavigate();
  return (
    <SectionCard title="Batches" icon={Layers}
      actions={
        <button onClick={() => navigate("/institute-admin/batches")}
          className="inline-flex items-center gap-1 text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline">
          Manage <ChevronRight className="h-3.5 w-3.5" />
        </button>
      }>
      {batches.length === 0 ? (
        <EmptyState title="No batches yet" hint="Create your first batch to start grouping students with tutors." />
      ) : (
        <div className="space-y-3">
          {batches.slice(0, 5).map((b) => {
            const pct = b.maxStudents ? Math.min(100, Math.round((b.studentCount / b.maxStudents) * 100)) : null;
            return (
              <div key={b.id} className="flex items-center gap-4 py-2 border-b border-slate-50 dark:border-white/[0.04] last:border-0">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-semibold text-slate-800 dark:text-slate-200 truncate">{b.name}</p>
                    <StatusBadge tone={b.status === "ACTIVE" ? "success" : b.status === "COMPLETED" ? "info" : "neutral"}>
                      {b.status}
                    </StatusBadge>
                  </div>
                  <p className="text-xs text-slate-400 mt-0.5">
                    {b.studentCount}{b.maxStudents ? ` / ${b.maxStudents}` : ""} students · {b.instructorCount} tutor{b.instructorCount !== 1 ? "s" : ""}
                  </p>
                </div>
                {pct !== null && (
                  <div className="w-28 shrink-0">
                    <div className="h-2 rounded-full bg-slate-100 dark:bg-white/[0.06] overflow-hidden">
                      <div
                        className={`h-full rounded-full ${pct >= 90 ? "bg-rose-500" : pct >= 70 ? "bg-amber-500" : "bg-indigo-500"}`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <p className="text-[10px] text-slate-400 mt-1 text-right font-bold">{pct}%</p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </SectionCard>
  );
}

// ─── Tutor snapshot ───────────────────────────────────────────────────────────

function TutorSnapshot({ tutors }: { tutors: InstructorRow[] }) {
  const navigate = useNavigate();
  const top = [...tutors].sort((a, b) => b.total_students - a.total_students).slice(0, 5);
  return (
    <SectionCard title="Tutors" icon={UserCheck}
      actions={
        <button onClick={() => navigate("/institute-admin/tutor")}
          className="inline-flex items-center gap-1 text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline">
          View all <ChevronRight className="h-3.5 w-3.5" />
        </button>
      }>
      {top.length === 0 ? (
        <EmptyState title="No tutors yet" hint="Onboard your first tutor to start assigning batches." />
      ) : (
        <div className="space-y-1">
          {top.map((t) => (
            <div key={t.user_id} className="flex items-center gap-3 py-2.5 border-b border-slate-50 dark:border-white/[0.04] last:border-0">
              <Avatar className="h-9 w-9 shrink-0">
                <AvatarImage src={t.avatar ?? ""} />
                <AvatarFallback className="bg-indigo-100 dark:bg-indigo-500/20 text-indigo-700 dark:text-indigo-300 text-xs font-bold">
                  {(t.name ?? t.email).slice(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-slate-800 dark:text-slate-200 truncate">{t.name}</p>
                <p className="text-xs text-slate-400 truncate">
                  {t.batches.length} batch{t.batches.length !== 1 ? "es" : ""} · {t.total_students} student{t.total_students !== 1 ? "s" : ""}
                </p>
              </div>
              {t.batches.length === 0 && <StatusBadge tone="warning">unassigned</StatusBadge>}
            </div>
          ))}
        </div>
      )}
    </SectionCard>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function InstituteDashboard() {
  const [summary, setSummary] = useState<InstituteSummary | null>(null);
  const [onboarding, setOnboarding] = useState<{ students_not_started: OnboardingPerson[]; tutors_unassigned: OnboardingPerson[] } | null>(null);
  const [batches, setBatches] = useState<BatchSummary[]>([]);
  const [tutors, setTutors] = useState<InstructorRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [sumRes, obRes, batchRes, tutorRes] = await Promise.all([
        fetchSummary(),
        fetchOnboardingStatus(),
        fetchBatches(),
        fetchInstructorsOverview(),
      ]);
      setSummary(sumRes.data);
      setOnboarding(obRes.data);
      setBatches(batchRes.data ?? []);
      setTutors(tutorRes.data ?? []);
    } catch (err: any) {
      setError(err?.message ?? "Failed to load dashboard.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const needsAttention = (summary?.invited_not_started_count ?? 0) + (summary?.unassigned_tutor_count ?? 0);

  return (
    <InstituteAdminLayout activeTab="dashboard">
      {error && <ErrorBanner message={error} onRetry={load} />}

      {loading || !summary ? (
        <>
          <div className="h-40 bg-slate-100 dark:bg-white/[0.04] rounded-2xl animate-pulse" />
          <CardGridSkeleton cards={4} />
          <TableSkeleton rows={4} />
        </>
      ) : (
        <>
          <HeroBanner summary={summary} />

          {/* KPI row — every number is live */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            <KpiCard label="Total Students" value={summary.total_students} icon={Users} accent="indigo" />
            <KpiCard label="Active Today" value={summary.active_today}
              sub={`${summary.platform_unlocked_today} unlocked the platform`} icon={Activity} accent="emerald" />
            <KpiCard label="Active Tutors" value={summary.instructor_count}
              sub={summary.unassigned_tutor_count > 0 ? `${summary.unassigned_tutor_count} without a batch` : undefined}
              icon={UserCheck} accent="blue" />
            <KpiCard label="Active Batches" value={summary.total_batches} icon={Layers} accent="indigo" />
            <KpiCard label="Needs Attention" value={needsAttention}
              sub={needsAttention > 0 ? `${summary.invited_not_started_count} not started · ${summary.unassigned_tutor_count} unassigned` : "all clear"}
              icon={AlertTriangle} accent={needsAttention > 0 ? "amber" : "emerald"} />
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            <NeedsAttentionPanel
              students={onboarding?.students_not_started ?? []}
              tutors={onboarding?.tutors_unassigned ?? []}
              onResent={() => { /* invite re-sent — list state unchanged until they start */ }}
            />
            <div className="space-y-6">
              <BatchesOverview batches={batches} />
              <TutorSnapshot tutors={tutors} />
            </div>
          </div>
        </>
      )}
    </InstituteAdminLayout>
  );
}
