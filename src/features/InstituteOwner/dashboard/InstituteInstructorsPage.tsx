// src/features/InstituteOwner/dashboard/InstituteInstructorsPage.tsx
import { useState, useEffect } from 'react';
import { Users, Sparkles } from 'lucide-react';
import { InstituteOwnerSidebar } from '../components/InstitiuteOwnerSidebar';
import { InstituteOwnerTopbar } from '../components/InstituteOwnerTopbar';
import { fetchInstructors, InstructorRow } from '../services/instituteOwnerService';
import { useToast } from '@/shared/hooks/use-toast';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function InitialsAvatar({ name }: { name: string }) {
  const initials = name
    .split(' ')
    .slice(0, 2)
    .map(w => w.charAt(0).toUpperCase())
    .join('');
  const colors = [
    'bg-brand-teal-100 text-brand-teal-700',
    'bg-brand-blue-100 text-brand-blue-700',
    'bg-sky-100 text-sky-700',
    'bg-brand-teal-50 text-brand-teal-600',
    'bg-amber-100 text-amber-700',
  ];
  const color = colors[name.charCodeAt(0) % colors.length];
  return (
    <div className={`h-14 w-14 rounded-2xl flex items-center justify-center text-xl font-bold flex-shrink-0 ring-1 ring-brand-line ${color}`}>
      {initials}
    </div>
  );
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function CardSkeleton() {
  return (
    <div className="animate-pulse bg-white border border-brand-line rounded-2xl shadow-sm p-4 sm:p-5 space-y-4">
      <div className="flex items-center gap-4">
        <div className="h-14 w-14 rounded-2xl bg-brand-bg-alt" />
        <div className="flex-1 space-y-2">
          <div className="h-4 bg-brand-bg-alt rounded w-32" />
          <div className="h-3 bg-brand-bg-alt rounded w-44" />
        </div>
      </div>
      <div className="flex gap-2">
        <div className="h-5 w-14 rounded-full bg-brand-bg-alt" />
        <div className="h-5 w-14 rounded-full bg-brand-bg-alt" />
      </div>
      <div className="h-10 bg-brand-bg-alt rounded-xl w-full" />
    </div>
  );
}

// ─── Instructor Card ──────────────────────────────────────────────────────────

function InstructorCard({ instructor }: { instructor: InstructorRow }) {
  const MAX_BATCHES = 3;
  const visibleBatches = instructor.batches.slice(0, MAX_BATCHES);
  const extra = instructor.batches.length - MAX_BATCHES;

  return (
    <div className="group bg-white border border-brand-line rounded-2xl shadow-sm p-4 sm:p-5 flex flex-col gap-4 hover:shadow-md hover:-translate-y-1 hover:border-brand-teal-300 transition-all duration-300">
      {/* Header */}
      <div className="flex items-start gap-4">
        <InitialsAvatar name={instructor.name} />
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-brand-text text-base leading-tight truncate group-hover:text-brand-teal-600 transition-colors">{instructor.name}</h3>
          <p className="text-xs text-brand-text-mute mt-0.5 truncate">{instructor.email}</p>
        </div>
      </div>

      {/* Divider */}
      <div className="border-t border-brand-line" />

      {/* Batches */}
      <div>
        <p className="font-jetbrains text-[10px] font-bold text-brand-text-mute uppercase tracking-[0.15em] mb-2">Batches</p>
        {instructor.batches.length === 0 ? (
          <p className="text-xs text-brand-text-mute">No batches assigned</p>
        ) : (
          <div className="flex flex-wrap gap-1.5">
            {visibleBatches.map(b => (
              <span
                key={b.batch_id}
                className="text-xs bg-brand-bg-alt text-brand-text px-2 py-0.5 rounded-lg ring-1 ring-inset ring-brand-line"
              >
                {b.batch_name}
              </span>
            ))}
            {extra > 0 && (
              <span className="text-xs bg-brand-teal-50 text-brand-teal-600 px-2 py-0.5 rounded-lg ring-1 ring-inset ring-brand-teal-200">
                +{extra} more
              </span>
            )}
          </div>
        )}
      </div>

      {/* Footer stat */}
      <div className="mt-auto flex items-center gap-2 text-sm rounded-xl bg-brand-bg-alt px-3 py-2.5 text-brand-text-mute">
        <div className="w-7 h-7 rounded-lg bg-brand-teal-50 flex items-center justify-center">
          <Users className="h-3.5 w-3.5 text-brand-teal-600" />
        </div>
        <span className="font-bold tabular-nums text-brand-text">{instructor.total_students}</span>
        <span>students</span>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function InstituteInstructorsPage() {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [instructors, setInstructors] = useState<InstructorRow[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    async function load() {
      try {
        setLoading(true);
        const res = await fetchInstructors();
        if (res.success) setInstructors(res.data);
      } catch {
        toast({ title: 'Failed to load instructors', variant: 'destructive' });
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  return (
    <div className="relative min-h-screen font-plex antialiased overflow-x-hidden bg-brand-bg text-brand-text">
      <InstituteOwnerSidebar
        activeTab="instructors"
        isCollapsed={isSidebarCollapsed}
        toggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
      />
      <div className={`relative z-10 transition-all duration-300 ${isSidebarCollapsed ? 'lg:pl-24' : 'lg:pl-72'}`}>
        <InstituteOwnerTopbar />
        <main className="px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6 max-w-[90rem] mx-auto pb-16">
          <div>

            {/* ── Hero Banner ─────────────────────────────────────────────── */}
            <section className="relative overflow-hidden rounded-2xl sm:rounded-3xl border border-brand-line-16 bg-brand-ink-deep text-white p-6 sm:p-8 shadow-sm">
              <div className="relative">
                <span className="font-jetbrains inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.2em] text-brand-on-ink-mute bg-white/5 border border-brand-line-12 px-2.5 py-1 rounded-full">
                  Owner Portal
                </span>
                <h1 className="font-manrope mt-3 text-2xl sm:text-3xl font-black tracking-tight text-white">
                  Instructors
                </h1>
                <p className="mt-1.5 text-sm text-brand-on-ink">
                  {loading ? 'Loading…' : `${instructors.length} instructor${instructors.length !== 1 ? 's' : ''}`}
                </p>
              </div>
            </section>

            {/* ── Grid ────────────────────────────────────────────────────── */}
            <div className="mt-6">
              {loading ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {[1, 2, 3].map(i => <CardSkeleton key={i} />)}
                </div>
              ) : instructors.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 sm:py-24 px-4 text-center bg-white border border-brand-line rounded-2xl shadow-sm">
                  <div className="w-14 h-14 rounded-2xl bg-brand-bg-alt flex items-center justify-center mb-4">
                    <Users className="h-7 w-7 text-brand-text-mute" />
                  </div>
                  <p className="text-brand-text font-semibold">No instructors found</p>
                  <p className="text-sm text-brand-text-mute mt-1">Add instructors through the Admin Portal</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {instructors.map(i => <InstructorCard key={i.user_id} instructor={i} />)}
                </div>
              )}
            </div>

          </div>
        </main>
      </div>
    </div>
  );
}