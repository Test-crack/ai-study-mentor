import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, ExternalLink, AlertCircle } from 'lucide-react';
import { cn } from '@/shared/utils';
import type { DiagnosticOverviewRow } from './types';

interface Props {
  rows:    DiagnosticOverviewRow[];
  batchId: string;
}

type SkillKey = 'L' | 'R' | 'W' | 'S';
const SKILLS: { key: SkillKey; label: string }[] = [
  { key: 'L', label: 'Listening' },
  { key: 'R', label: 'Reading'   },
  { key: 'W', label: 'Writing'   },
  { key: 'S', label: 'Speaking'  },
];

function bandPill(b: number | null) {
  if (b === null) return <span className="text-slate-300 dark:text-slate-600 text-xs">—</span>;
  const cls = b >= 7.0
    ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/30'
    : b >= 5.5
    ? 'bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-500/30'
    : 'bg-rose-50 dark:bg-rose-500/10 text-rose-700 dark:text-rose-400 border-rose-200 dark:border-rose-500/30';
  return (
    <span className={cn('inline-block px-2 py-0.5 rounded-lg text-xs font-black border', cls)}>
      {b.toFixed(1)}
    </span>
  );
}

function Avatar({ name, avatar }: { name: string; avatar: string | null }) {
  if (avatar) {
    return <img src={avatar} alt={name} className="h-8 w-8 rounded-full object-cover" />;
  }
  const initials = name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || '?';
  return (
    <div className="h-8 w-8 rounded-full bg-brand-teal-100 dark:bg-brand-teal-500/20 flex items-center justify-center shrink-0">
      <span className="text-[11px] font-black text-brand-teal-600 dark:text-brand-teal-400">{initials}</span>
    </div>
  );
}

export function DiagnosticOverviewTab({ rows, batchId }: Props) {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');

  // Backend already sorts non-diagnosed first; we just filter by search
  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return q ? rows.filter(r => r.name.toLowerCase().includes(q)) : rows;
  }, [rows, search]);

  const goToStudent = (row: DiagnosticOverviewRow) => {
    navigate(`/instructor/batches/${batchId}/students/${row.user_id}/progress`, {
      state: { studentId: row.user_id, initialTab: 'diagnostic' },
    });
  };

  const notDiagnosed = rows.filter(r => !r.is_diagnosed).length;
  const thClass = 'py-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider whitespace-nowrap';

  if (rows.length === 0) {
    return (
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-16 text-center">
        <p className="text-slate-400 text-sm">No students in this batch yet.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          {notDiagnosed > 0 && (
            <div className="flex items-center gap-1.5 text-xs text-amber-600 dark:text-amber-400 font-semibold bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/30 px-3 py-1.5 rounded-xl">
              <AlertCircle className="h-3.5 w-3.5 shrink-0" />
              {notDiagnosed} student{notDiagnosed > 1 ? 's' : ''} not yet diagnosed
            </div>
          )}
        </div>
        <div className="relative w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search students…"
            className="w-full pl-9 pr-3 py-2 text-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-teal-500/30 text-slate-800 dark:text-slate-200 placeholder:text-slate-400"
          />
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left min-w-[680px]">
            <thead className="border-b border-slate-100 dark:border-slate-800">
              <tr>
                <th className={cn(thClass, 'pl-5 w-48')}>Student</th>
                <th className={thClass}>Status</th>
                {SKILLS.map(s => (
                  <th key={s.key} className={thClass}>{s.label}</th>
                ))}
                <th className={thClass}>Diagnosed On</th>
                <th className={cn(thClass, 'pr-5 text-right')}>Action</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-10 text-center text-sm text-slate-400">
                    No students match "{search}"
                  </td>
                </tr>
              ) : (
                filtered.map(row => (
                  <tr
                    key={row.student_id}
                    className={cn(
                      'border-b border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors',
                      !row.is_diagnosed && 'bg-amber-50/40 dark:bg-amber-500/5'
                    )}
                  >
                    <td className="py-3 pl-5">
                      <div className="flex items-center gap-2.5">
                        <Avatar name={row.name} avatar={row.avatar} />
                        <span className="text-sm font-semibold text-slate-800 dark:text-slate-200 truncate max-w-[130px]">
                          {row.name}
                        </span>
                      </div>
                    </td>
                    <td className="py-3">
                      {row.is_diagnosed ? (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/30 text-emerald-700 dark:text-emerald-400">
                          Diagnosed
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/30 text-amber-700 dark:text-amber-400">
                          Pending
                        </span>
                      )}
                    </td>
                    {SKILLS.map(s => (
                      <td key={s.key} className="py-3">
                        {bandPill(row.baseline_bands[s.key])}
                      </td>
                    ))}
                    <td className="py-3 text-sm text-slate-500 dark:text-slate-400">
                      {row.diagnosed_at ?? '—'}
                    </td>
                    <td className="py-3 pr-5 text-right">
                      <button
                        onClick={() => goToStudent(row)}
                        disabled={!row.is_diagnosed}
                        className={cn(
                          'inline-flex items-center gap-1 text-xs font-bold transition-colors',
                          row.is_diagnosed
                            ? 'text-brand-teal-600 dark:text-brand-teal-400 hover:text-brand-teal-700 dark:hover:text-brand-teal-300'
                            : 'text-slate-300 dark:text-slate-700 cursor-not-allowed'
                        )}
                      >
                        <ExternalLink className="h-3.5 w-3.5" />
                        View Report
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
