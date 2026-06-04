import { AlertTriangle, ChevronRight, CheckCircle2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import type { AtRiskStudent } from './types';

interface AtRiskStudentListProps {
  students:  AtRiskStudent[];
  batchId:   string | null;
  loading:   boolean;
}

function initials(name: string) {
  return name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
}

function FlagBadge({ flag }: { flag: string }) {
  const isIA      = flag.toLowerCase().includes('assessment');
  const isInactive = flag.toLowerCase().includes('activity') || flag.toLowerCase().includes('days');
  const isDiag    = flag.toLowerCase().includes('diagnosed');
  const isDecline = flag.toLowerCase().includes('declining');

  let cls = 'bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-500/30';
  if (isIA || isDecline)  cls = 'bg-rose-50 dark:bg-rose-500/10 text-rose-700 dark:text-rose-400 border-rose-200 dark:border-rose-500/30';
  if (isDiag || isInactive) cls = 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700';

  return (
    <span className={`inline-flex items-center text-[11px] font-semibold px-2 py-0.5 rounded-full border ${cls}`}>
      {flag}
    </span>
  );
}

function RowSkeleton() {
  return (
    <div className="flex items-center gap-3 px-4 py-3 animate-pulse">
      <div className="h-9 w-9 rounded-full bg-slate-200 dark:bg-slate-700 shrink-0" />
      <div className="flex-1 space-y-1.5">
        <div className="h-3.5 w-28 bg-slate-200 dark:bg-slate-700 rounded" />
        <div className="h-3 w-48 bg-slate-100 dark:bg-slate-800 rounded" />
      </div>
      <div className="h-4 w-4 bg-slate-200 dark:bg-slate-700 rounded" />
    </div>
  );
}

export function AtRiskStudentList({ students, batchId, loading }: AtRiskStudentListProps) {
  const navigate = useNavigate();

  const goToStudent = (studentId: string) => {
    if (!batchId) return;
    navigate(`/instructor/batches/${batchId}/students/${studentId}/progress`);
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 dark:border-slate-800">
        <div className="flex items-center gap-2.5">
          <div className="h-8 w-8 rounded-xl bg-rose-100 dark:bg-rose-500/20 flex items-center justify-center">
            <AlertTriangle className="h-4 w-4 text-rose-600 dark:text-rose-400" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-800 dark:text-white">At-Risk Students</h3>
            <p className="text-[11px] text-slate-400">Rule-based flags from real activity data</p>
          </div>
        </div>
        {!loading && students.length > 0 && (
          <span className="text-xs font-bold text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-500/10 px-2.5 py-1 rounded-full border border-rose-100 dark:border-rose-500/20">
            {students.length} flagged
          </span>
        )}
      </div>

      {/* Body */}
      {loading ? (
        <div className="divide-y divide-slate-100 dark:divide-slate-800">
          {[1, 2, 3].map(i => <RowSkeleton key={i} />)}
        </div>
      ) : students.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-10 text-center px-6">
          <div className="h-12 w-12 rounded-full bg-emerald-50 dark:bg-emerald-500/10 flex items-center justify-center mb-3">
            <CheckCircle2 className="h-6 w-6 text-emerald-500" />
          </div>
          <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">All students on track</p>
          <p className="text-xs text-slate-400 mt-1">No risk flags detected for this batch today.</p>
        </div>
      ) : (
        <ul className="divide-y divide-slate-100 dark:divide-slate-800">
          {students.map(student => (
            <li key={student.student_id}>
              <button
                onClick={() => goToStudent(student.student_id)}
                className="w-full flex items-center gap-3 px-5 py-3.5 text-left hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors group"
              >
                {/* Avatar */}
                <div className="h-9 w-9 rounded-full shrink-0 bg-indigo-100 dark:bg-indigo-500/20 flex items-center justify-center text-xs font-black text-indigo-600 dark:text-indigo-400 overflow-hidden">
                  {student.avatar
                    ? <img src={student.avatar} alt={student.name} className="h-full w-full object-cover" />
                    : initials(student.name)
                  }
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <span className="text-sm font-semibold text-slate-800 dark:text-white truncate">
                      {student.name}
                    </span>
                    {student.current_band !== null && (
                      <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded">
                        Band {student.current_band.toFixed(1)}
                      </span>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    <FlagBadge flag={student.primary_flag} />
                    {student.flags.length > 1 && (
                      <span className="text-[11px] text-slate-400">
                        +{student.flags.length - 1} more
                      </span>
                    )}
                  </div>
                </div>

                {/* Arrow */}
                <ChevronRight className="h-4 w-4 text-slate-300 dark:text-slate-600 group-hover:text-indigo-500 transition-colors shrink-0" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
