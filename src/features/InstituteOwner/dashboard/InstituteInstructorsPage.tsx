import { useState, useEffect } from 'react';
import { Users } from 'lucide-react';
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
    'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-400',
    'bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-400',
    'bg-sky-100 text-sky-700 dark:bg-sky-900/40 dark:text-sky-400',
    'bg-teal-100 text-teal-700 dark:bg-teal-900/40 dark:text-teal-400',
    'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400',
  ];
  const color = colors[name.charCodeAt(0) % colors.length];
  return (
    <div className={`h-14 w-14 rounded-2xl flex items-center justify-center text-xl font-bold flex-shrink-0 ${color}`}>
      {initials}
    </div>
  );
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function CardSkeleton() {
  return (
    <div className="animate-pulse bg-white dark:bg-[#121214] border border-slate-200 dark:border-[#27272a] rounded-xl shadow-sm p-5 space-y-4">
      <div className="flex items-center gap-4">
        <div className="h-14 w-14 rounded-2xl bg-slate-200 dark:bg-slate-700" />
        <div className="flex-1 space-y-2">
          <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-32" />
          <div className="h-3 bg-slate-100 dark:bg-slate-800 rounded w-44" />
        </div>
      </div>
      <div className="flex gap-2">
        <div className="h-5 w-14 rounded-full bg-slate-100 dark:bg-slate-800" />
        <div className="h-5 w-14 rounded-full bg-slate-100 dark:bg-slate-800" />
      </div>
      <div className="h-3 bg-slate-100 dark:bg-slate-800 rounded w-28" />
    </div>
  );
}

// ─── Instructor Card ──────────────────────────────────────────────────────────

function InstructorCard({ instructor }: { instructor: InstructorRow }) {
  const MAX_BATCHES = 3;
  const visibleBatches = instructor.batches.slice(0, MAX_BATCHES);
  const extra = instructor.batches.length - MAX_BATCHES;

  return (
    <div className="bg-white dark:bg-[#121214] border border-slate-200 dark:border-[#27272a] rounded-xl shadow-sm p-5 flex flex-col gap-4 hover:shadow-md transition-shadow">
      {/* Header */}
      <div className="flex items-start gap-4">
        <InitialsAvatar name={instructor.name} />
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-slate-900 dark:text-white text-base leading-tight truncate">{instructor.name}</h3>
          <p className="text-xs text-slate-500 dark:text-gray-400 mt-0.5 truncate">{instructor.email}</p>
        </div>
      </div>

      {/* Divider */}
      <div className="border-t border-slate-100 dark:border-[#1e1e1e]" />

      {/* Batches */}
      <div>
        <p className="text-xs font-semibold text-slate-500 dark:text-gray-400 uppercase tracking-wider mb-2">Batches</p>
        {instructor.batches.length === 0 ? (
          <p className="text-xs text-slate-400">No batches assigned</p>
        ) : (
          <div className="flex flex-wrap gap-1.5">
            {visibleBatches.map(b => (
              <span
                key={b.batch_id}
                className="text-xs bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 px-2 py-0.5 rounded-lg"
              >
                {b.batch_name}
              </span>
            ))}
            {extra > 0 && (
              <span className="text-xs bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 px-2 py-0.5 rounded-lg">
                +{extra} more
              </span>
            )}
          </div>
        )}
      </div>

      {/* Footer stat */}
      <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
        <Users className="h-4 w-4 text-indigo-500" />
        <span className="font-semibold text-slate-800 dark:text-white">{instructor.total_students}</span>
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
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-[#0a0a0a] font-sans text-slate-900 dark:text-white transition-colors duration-300">
      <div className="hidden lg:block">
        <InstituteOwnerSidebar
          activeTab="instructors"
          isCollapsed={isSidebarCollapsed}
          toggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
        />
      </div>
      <div className={`transition-all duration-300 flex flex-col min-h-screen ${isSidebarCollapsed ? 'lg:pl-20' : 'lg:pl-64'}`}>
        <InstituteOwnerTopbar />
        <main className="flex-1 p-4 sm:p-6 lg:p-8">
          <div className="max-w-[1400px] mx-auto space-y-6">

            {/* Header */}
            <div>
              <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Instructors</h1>
              <p className="text-sm text-slate-500 dark:text-gray-400 mt-1">
                {loading ? 'Loading…' : `${instructors.length} instructor${instructors.length !== 1 ? 's' : ''}`}
              </p>
            </div>

            {/* Grid */}
            {loading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {[1, 2, 3].map(i => <CardSkeleton key={i} />)}
              </div>
            ) : instructors.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-24 text-center bg-white dark:bg-[#121214] border border-slate-200 dark:border-[#27272a] rounded-xl shadow-sm">
                <Users className="h-12 w-12 text-slate-300 dark:text-slate-600 mb-4" />
                <p className="text-slate-500 dark:text-gray-400 font-medium">No instructors found</p>
                <p className="text-sm text-slate-400 mt-1">Add instructors through the Admin Portal</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {instructors.map(i => <InstructorCard key={i.user_id} instructor={i} />)}
              </div>
            )}

          </div>
        </main>
      </div>
    </div>
  );
}
