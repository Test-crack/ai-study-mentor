// src/features/Institute/dashboard/InstituteTutor.tsx
// Tutor Accounts — fully data-driven (replaces the mock page with fabricated
// calibration/satisfaction numbers; no fake metrics survive here).
// Sources: GET /instructors (batches + student counts, owner handler reused)
// joined with GET /tutors (specialization, contact) by userId.
import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Search, UserCheck, Users, Layers, Trash2, GraduationCap, ChevronRight } from "lucide-react";
import { InstituteAdminLayout } from "../components/InstituteAdminLayout";
import {
  KpiCard, SectionCard, StatusBadge, CardGridSkeleton, EmptyState, ErrorBanner,
} from "../components/shared/primitives";
import { fetchTutors, removeTutor, TutorRecord, fetchInstructorsOverview } from "../services/instituteAdminService";
import type { InstructorRow } from "@/features/InstituteOwner/services/instituteOwnerService";
import { Avatar, AvatarFallback, AvatarImage } from "@/shared/components/ui/avatar";
import { useToast } from "@/shared/hooks/use-toast";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/shared/components/ui/alert-dialog";

interface TutorView {
  userId: string;
  name: string | null;
  email: string;
  avatar: string | null;
  specialization: string | null;
  batches: { batch_id: string; batch_name: string; student_count: number }[];
  totalStudents: number;
}

function TutorCard({ tutor, onRemove }: { tutor: TutorView; onRemove: () => void }) {
  return (
    <div className="rounded-2xl bg-white border border-brand-line shadow-sm hover:shadow-md hover:-translate-y-1 hover:border-brand-teal-300 transition-all overflow-hidden">
      <div className="p-4 sm:p-5">
        <div className="flex items-start gap-3">
          <Avatar className="h-11 w-11 shrink-0">
            <AvatarImage src={tutor.avatar ?? ""} />
            <AvatarFallback className="bg-brand-teal-100 text-brand-teal-700 font-bold">
              {(tutor.name ?? tutor.email).slice(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-brand-text truncate">{tutor.name ?? tutor.email}</p>
            <p className="text-xs text-brand-text-mute truncate">{tutor.email}</p>
            {tutor.specialization && (
              <span className="inline-flex mt-1.5 text-[11px] font-bold text-brand-teal-600 bg-brand-teal-50 px-2 py-0.5 rounded-lg">
                {tutor.specialization}
              </span>
            )}
          </div>
          <button
            onClick={onRemove}
            aria-label={`Remove ${tutor.name ?? tutor.email}`}
            className="p-2.5 min-h-[40px] min-w-[40px] inline-flex items-center justify-center rounded-lg text-brand-text-mute hover:text-rose-600 hover:bg-rose-50 transition-colors shrink-0"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>

        <div className="mt-4 border-t border-brand-line pt-3">
          {tutor.batches.length === 0 ? (
            <StatusBadge tone="warning">No batch assigned</StatusBadge>
          ) : (
            <div className="flex flex-wrap gap-1.5">
              {tutor.batches.map((b) => (
                <span key={b.batch_id} className="text-xs bg-brand-bg-alt text-brand-text px-2 py-0.5 rounded-lg font-medium">
                  {b.batch_name} · {b.student_count}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="font-jetbrains bg-brand-bg-alt border-t border-brand-line px-4 sm:px-5 py-2.5 flex items-center justify-between gap-2 text-xs font-bold text-brand-text-mute">
        <span className="inline-flex items-center gap-1.5 whitespace-nowrap"><Layers className="h-3.5 w-3.5 shrink-0" /> {tutor.batches.length} batch{tutor.batches.length !== 1 ? "es" : ""}</span>
        <span className="inline-flex items-center gap-1.5 whitespace-nowrap"><Users className="h-3.5 w-3.5 shrink-0" /> {tutor.totalStudents} student{tutor.totalStudents !== 1 ? "s" : ""}</span>
      </div>
    </div>
  );
}

export default function InstituteTutor() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [tutors, setTutors] = useState<TutorView[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [removeTarget, setRemoveTarget] = useState<TutorView | null>(null);
  const [removing, setRemoving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [overviewRes, tutorsRes] = await Promise.all([fetchInstructorsOverview(), fetchTutors()]);
      const byUserId = new Map<string, TutorRecord>(tutorsRes.data.map(t => [t.userId, t]));
      const merged: TutorView[] = (overviewRes.data as InstructorRow[]).map((r) => ({
        userId:         r.user_id,
        name:           r.name,
        email:          r.email,
        avatar:         r.avatar,
        specialization: byUserId.get(r.user_id)?.specialization ?? null,
        batches:        r.batches,
        totalStudents:  r.total_students,
      }));
      // Tutors in the institute but absent from the overview (edge: brand new, no data yet)
      for (const t of tutorsRes.data) {
        if (!merged.some(m => m.userId === t.userId)) {
          merged.push({
            userId: t.userId, name: t.name, email: t.email, avatar: t.profileImage,
            specialization: t.specialization, batches: [], totalStudents: 0,
          });
        }
      }
      setTutors(merged);
    } catch (err: any) {
      setError(err?.message ?? "Failed to load tutors.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return tutors;
    return tutors.filter(t =>
      (t.name ?? "").toLowerCase().includes(q) ||
      t.email.toLowerCase().includes(q) ||
      (t.specialization ?? "").toLowerCase().includes(q)
    );
  }, [tutors, search]);

  const unassignedCount = tutors.filter(t => t.batches.length === 0).length;
  const totalStudentsCovered = tutors.reduce((sum, t) => sum + t.totalStudents, 0);

  const confirmRemove = async () => {
    if (!removeTarget) return;
    setRemoving(true);
    try {
      await removeTutor(removeTarget.userId);
      setTutors(prev => prev.filter(t => t.userId !== removeTarget.userId));
      toast({ title: "Tutor removed", description: `${removeTarget.name ?? removeTarget.email} is no longer part of your institute.` });
    } catch (err: any) {
      toast({ title: "Failed to remove tutor", description: err?.message, variant: "destructive" });
    } finally {
      setRemoving(false);
      setRemoveTarget(null);
    }
  };

  return (
    <InstituteAdminLayout activeTab="tutor">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-brand-text">Tutor Accounts</h1>
          <p className="text-sm text-brand-text-mute mt-0.5">Every tutor in your institute, with their batches and student load.</p>
        </div>
        <button
          onClick={() => navigate("/institute-admin/tutorOnboarding")}
          className="inline-flex items-center justify-center gap-2 bg-brand-teal-600 hover:bg-brand-teal-700 text-white text-sm font-bold px-4 py-2.5 min-h-[40px] rounded-xl transition-colors shadow-sm self-start sm:self-auto"
        >
          <GraduationCap className="h-4 w-4" /> Onboard Tutor
        </button>
      </div>

      {error && <ErrorBanner message={error} onRetry={load} />}

      {loading ? (
        <CardGridSkeleton cards={8} />
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
            <KpiCard label="Total Tutors" value={tutors.length} icon={UserCheck} accent="indigo" />
            <KpiCard label="Students Covered" value={totalStudentsCovered} icon={Users} accent="blue" />
            <KpiCard label="Unassigned" value={unassignedCount}
              sub={unassignedCount > 0 ? "assign them from Batch Allocation" : "every tutor has a batch"}
              icon={Layers} accent={unassignedCount > 0 ? "amber" : "emerald"} />
          </div>

          <div className="relative w-full sm:max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-brand-text-mute" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name, email or specialization…"
              className="w-full pl-10 pr-4 py-2.5 min-h-[40px] bg-white border border-brand-line rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-teal-500/20 focus:border-brand-teal-500 transition-all text-sm font-medium text-brand-text placeholder:text-brand-text-mute"
            />
          </div>

          {filtered.length === 0 ? (
            <SectionCard title="Tutors" icon={UserCheck}>
              <EmptyState
                title={search ? "No tutors match your search" : "No tutors yet"}
                hint={search ? "Try a different name or specialization." : "Onboard your first tutor to get started."}
                action={!search ? (
                  <button onClick={() => navigate("/institute-admin/tutorOnboarding")}
                    className="inline-flex items-center gap-1 text-xs font-bold text-brand-teal-600 hover:underline">
                    Go to Tutor Onboarding <ChevronRight className="h-3.5 w-3.5" />
                  </button>
                ) : undefined}
              />
            </SectionCard>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-3 sm:gap-4">
              {filtered.map((t) => (
                <TutorCard key={t.userId} tutor={t} onRemove={() => setRemoveTarget(t)} />
              ))}
            </div>
          )}
        </>
      )}

      <AlertDialog open={!!removeTarget} onOpenChange={(o) => !o && setRemoveTarget(null)}>
        <AlertDialogContent className="w-[calc(100%-2rem)] max-w-md rounded-2xl border-brand-line">
          <AlertDialogHeader>
            <AlertDialogTitle>Remove {removeTarget?.name ?? removeTarget?.email}?</AlertDialogTitle>
            <AlertDialogDescription>
              This removes the tutor from your institute and all batch views. Their account itself is
              not deleted — they can be re-invited later.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={removing}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmRemove} disabled={removing}
              className="bg-rose-600 hover:bg-rose-700 text-white">
              {removing ? "Removing…" : "Remove tutor"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </InstituteAdminLayout>
  );
}
