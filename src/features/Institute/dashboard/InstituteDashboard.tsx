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
  KpiCard, SectionCard, StatusBadge, TableSkeleton, CardGridSkeleton, EmptyState, ErrorBanner, PageHero, HeroAction,
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

/**
 * Renders unconditionally — including while loading and on error — so the page
 * always has a header rather than a headless skeleton. Matches the owner portal.
 */
function HeroBanner({ summary }: { summary: InstituteSummary | null }) {
  const navigate = useNavigate();
  return (
    <PageHero
      eyebrow="Admin Portal"
      title={
        summary?.institute_name
          ? <>Great to see you, <span className="text-brand-mint">{summary.institute_name}</span></>
          : "Institute Admin Portal"
      }
      subtitle={
        summary
          ? `${summary.total_students} students across ${summary.total_batches} batches · ` +
            `${summary.instructor_count} tutors` +
            (summary.avg_band != null ? ` · average band ${summary.avg_band}` : "")
          : "Live operational overview across all batches"
      }
      actions={
        <>
          <HeroAction onClick={() => navigate("/institute-admin/studentOnboarding")}>
            <UserPlus className="h-3.5 w-3.5" /> Onboard Students
          </HeroAction>
          <HeroAction onClick={() => navigate("/institute-admin/tutorOnboarding")}>
            <GraduationCap className="h-3.5 w-3.5" /> Onboard Tutors
          </HeroAction>
        </>
      }
    />
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
            <div key={p.userId} className="flex items-center gap-3 py-2.5 border-b border-brand-line last:border-0">
              <Avatar className="h-9 w-9 shrink-0">
                <AvatarImage src={p.profileImage ?? ""} />
                <AvatarFallback className="bg-brand-teal-100 text-brand-teal-700 text-xs font-bold">
                  {(p.name ?? p.email).slice(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-brand-text truncate">{p.name ?? p.email}</p>
                <p className="text-xs text-brand-text-mute truncate">invited {new Date(p.invitedAt).toLocaleDateString("en-IN", { day: "numeric", month: "short" })} · hasn't started yet</p>
              </div>
              <button
                onClick={() => resend(p)}
                disabled={sending === p.userId}
                className="inline-flex items-center justify-center gap-1.5 text-xs font-bold text-brand-teal-600 hover:bg-brand-teal-50 px-3 py-2 min-h-[40px] rounded-lg transition-colors disabled:opacity-50 shrink-0"
              >
                <Mail className="h-3.5 w-3.5" /> {sending === p.userId ? "Sending…" : "Resend invite"}
              </button>
            </div>
          ))}
          {tutors.map((p) => (
            <div key={p.userId} className="flex items-center gap-3 py-2.5 border-b border-brand-line last:border-0">
              <Avatar className="h-9 w-9 shrink-0">
                <AvatarImage src={p.profileImage ?? ""} />
                <AvatarFallback className="bg-amber-100 text-amber-700 text-xs font-bold">
                  {(p.name ?? p.email).slice(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-brand-text truncate">{p.name ?? p.email}</p>
                <p className="text-xs text-brand-text-mute truncate">tutor · not assigned to any batch</p>
              </div>
              <button
                onClick={() => navigate("/institute-admin/batches")}
                className="inline-flex items-center justify-center gap-1.5 text-xs font-bold text-amber-700 hover:bg-amber-50 px-3 py-2 min-h-[40px] rounded-lg transition-colors shrink-0"
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
          className="inline-flex items-center gap-1 text-xs font-bold text-brand-teal-600 hover:underline">
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
              <div key={b.id} className="flex items-center gap-3 sm:gap-4 py-2 border-b border-brand-line last:border-0">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-semibold text-brand-text truncate">{b.name}</p>
                    <StatusBadge tone={b.status === "ACTIVE" ? "success" : b.status === "COMPLETED" ? "info" : "neutral"}>
                      {b.status}
                    </StatusBadge>
                  </div>
                  <p className="text-xs text-brand-text-mute mt-0.5">
                    {b.studentCount}{b.maxStudents ? ` / ${b.maxStudents}` : ""} students · {b.instructorCount} tutor{b.instructorCount !== 1 ? "s" : ""}
                  </p>
                </div>
                {pct !== null && (
                  <div className="w-16 sm:w-28 shrink-0">
                    <div className="h-2 rounded-full bg-brand-bg-alt overflow-hidden">
                      <div
                        className={`h-full rounded-full ${pct >= 90 ? "bg-rose-500" : pct >= 70 ? "bg-amber-500" : "bg-brand-teal-500"}`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <p className="font-jetbrains text-[10px] text-brand-text-mute mt-1 text-right font-bold">{pct}%</p>
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
          className="inline-flex items-center gap-1 text-xs font-bold text-brand-teal-600 hover:underline">
          View all <ChevronRight className="h-3.5 w-3.5" />
        </button>
      }>
      {top.length === 0 ? (
        <EmptyState title="No tutors yet" hint="Onboard your first tutor to start assigning batches." />
      ) : (
        <div className="space-y-1">
          {top.map((t) => (
            <div key={t.user_id} className="flex items-center gap-3 py-2.5 border-b border-brand-line last:border-0">
              <Avatar className="h-9 w-9 shrink-0">
                <AvatarImage src={t.avatar ?? ""} />
                <AvatarFallback className="bg-brand-teal-100 text-brand-teal-700 text-xs font-bold">
                  {(t.name ?? t.email).slice(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-brand-text truncate">{t.name}</p>
                <p className="text-xs text-brand-text-mute truncate">
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
      <HeroBanner summary={summary} />

      {error && <ErrorBanner message={error} onRetry={load} />}

      {loading || !summary ? (
        <>
          <CardGridSkeleton cards={4} />
          <TableSkeleton rows={4} />
        </>
      ) : (
        <>
          {/* KPI row — every number is live */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3 sm:gap-4">
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

          <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 sm:gap-6">
            <NeedsAttentionPanel
              students={onboarding?.students_not_started ?? []}
              tutors={onboarding?.tutors_unassigned ?? []}
              onResent={() => { /* invite re-sent — list state unchanged until they start */ }}
            />
            <div className="space-y-4 sm:space-y-6">
              <BatchesOverview batches={batches} />
              <TutorSnapshot tutors={tutors} />
            </div>
          </div>
        </>
      )}
    </InstituteAdminLayout>
  );
}
