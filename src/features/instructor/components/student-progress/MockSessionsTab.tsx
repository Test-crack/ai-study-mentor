import { useState } from 'react';
import { ChevronDown, ChevronUp, Cpu, CheckCircle2 } from 'lucide-react';
import { cn } from '@/shared/utils';
import { bandFillPct } from '@/shared/utils/bandScale';
import type { MockSession, MockSkillScore, MockSubSkillScore } from './types';

interface Props { sessions: MockSession[]; }

const STATUS_CONFIG = {
  COMPLETED:   { label: 'Completed',   cls: 'bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400' },
  IN_PROGRESS: { label: 'In Progress', cls: 'bg-amber-100 dark:bg-amber-500/20 text-amber-700 dark:text-amber-400' },
  PENDING:     { label: 'Pending',     cls: 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-400' },
} as const;

function bandColorText(b: number | null): string {
  if (b === null) return 'text-slate-400';
  if (b >= 7.5) return 'text-emerald-600 dark:text-emerald-400';
  if (b >= 6.0) return 'text-amber-600 dark:text-amber-400';
  return 'text-rose-600 dark:text-rose-400';
}

function formatMonthYear(my: string): string {
  const [y, m] = my.split('-');
  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  return `${months[parseInt(m, 10) - 1] ?? m} ${y}`;
}

function titleCase(s: string): string {
  return s.charAt(0) + s.slice(1).toLowerCase();
}

function SubSkillRow({ ss }: { ss: MockSubSkillScore }) {
  const [open, setOpen] = useState(false);
  const hasFeedback = !!(ss.ai_feedback?.rationale || (ss.ai_feedback?.key_observations?.length ?? 0) > 0);
  const band = ss.band;

  return (
    <>
      <div
        className={cn(
          'flex items-center justify-between text-xs py-1',
          hasFeedback && 'cursor-pointer'
        )}
        onClick={() => hasFeedback && setOpen(o => !o)}
      >
        <div className="flex items-center gap-1.5 min-w-0">
          <span className="text-slate-500 dark:text-slate-400 truncate">{titleCase(ss.sub_skill)}</span>
          {ss.ai_feedback && <Cpu className="h-2.5 w-2.5 text-brand-teal-400 shrink-0" />}
        </div>
        <div className="flex items-center gap-2 shrink-0 ml-2">
          <div className="w-16 h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
            <div
              className={cn(
                'h-full rounded-full',
                band === null ? 'bg-slate-300 dark:bg-slate-600'
                : band >= 7 ? 'bg-emerald-400 dark:bg-emerald-500'
                : band >= 6 ? 'bg-amber-400 dark:bg-amber-500'
                : 'bg-rose-400 dark:bg-rose-500'
              )}
              style={{ width: band !== null ? `${bandFillPct(band)}%` : '0%' }}
            />
          </div>
          <span className={cn('font-bold w-6 text-right', bandColorText(band))}>
            {band !== null ? band.toFixed(1) : '—'}
          </span>
          {hasFeedback && (
            open
              ? <ChevronUp className="h-2.5 w-2.5 text-slate-400" />
              : <ChevronDown className="h-2.5 w-2.5 text-slate-400" />
          )}
        </div>
      </div>

      {open && ss.ai_feedback && (
        <div className="rounded-lg border border-brand-teal-100 dark:border-brand-teal-500/20 bg-brand-teal-50/50 dark:bg-brand-teal-500/5 p-2.5 space-y-1.5 mb-1">
          {ss.ai_feedback.rationale && (
            <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed">
              {ss.ai_feedback.rationale}
            </p>
          )}
          {ss.ai_feedback.key_observations.length > 0 && (
            <ul className="space-y-1">
              {ss.ai_feedback.key_observations.map((obs, i) => (
                <li key={i} className="flex items-start gap-1.5 text-[11px] text-slate-600 dark:text-slate-400">
                  <CheckCircle2 className="h-2.5 w-2.5 text-brand-teal-400 shrink-0 mt-0.5" />
                  {obs}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </>
  );
}

function SkillCard({ sk }: { sk: MockSkillScore }) {
  const band = sk.band ?? null;

  return (
    <div className="rounded-xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 p-3 space-y-2">
      {/* Skill header */}
      <div className="flex items-center justify-between">
        <span className="text-xs font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wide">
          {titleCase(sk.skill)}
        </span>
        <div className="flex items-center gap-1.5">
          {sk.ai_graded && <Cpu className="h-3 w-3 text-brand-teal-400" />}
          <span className={cn('text-lg font-black', bandColorText(band))}>
            {band !== null ? band.toFixed(1) : '—'}
          </span>
        </div>
      </div>

      {/* MCQ summary */}
      {sk.total > 0 && (
        <p className="text-[10px] text-slate-400">
          MCQ: {sk.correct}/{sk.total}
        </p>
      )}

      {/* Sub-skill breakdown */}
      {sk.sub_skill_scores && sk.sub_skill_scores.length > 0 && (
        <div className="pt-1.5 border-t border-slate-100 dark:border-slate-800 space-y-0.5">
          {sk.sub_skill_scores.map(ss => (
            <SubSkillRow key={ss.sub_skill} ss={ss} />
          ))}
        </div>
      )}
    </div>
  );
}

function MockScorePanel({ scores }: { scores: MockSkillScore[] }) {
  const skillOrder = ['LISTENING', 'READING', 'WRITING', 'SPEAKING'];
  const sorted = [...scores].sort(
    (a, b) => skillOrder.indexOf(a.skill) - skillOrder.indexOf(b.skill)
  );

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      {sorted.map(sk => <SkillCard key={sk.skill} sk={sk} />)}
    </div>
  );
}

function MockRow({ s }: { s: MockSession }) {
  const [expanded, setExpanded] = useState(false);
  const cfg = STATUS_CONFIG[s.status] ?? STATUS_CONFIG.PENDING;
  const hasDetail = !!(s.scores && s.scores.length > 0);

  return (
    <>
      <tr
        className={cn(
          'border-b border-slate-100 dark:border-slate-800 transition-colors',
          hasDetail ? 'cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/40' : '',
          expanded && 'bg-slate-50 dark:bg-slate-800/40'
        )}
        onClick={() => hasDetail && setExpanded(e => !e)}
      >
        <td className="py-3 pl-5 text-sm font-semibold text-slate-700 dark:text-slate-300 whitespace-nowrap">
          {formatMonthYear(s.month_year)}
        </td>
        <td className="py-3 text-xs text-slate-500 dark:text-slate-400 capitalize">
          {s.attempt_type.toLowerCase().replace('_', ' ')}
        </td>
        <td className="py-3">
          <span className={cn('px-2 py-0.5 rounded-full text-[11px] font-bold', cfg.cls)}>{cfg.label}</span>
        </td>
        <td className="py-3">
          {s.real_band_score !== null
            ? <span className={cn('text-sm font-black', bandColorText(s.real_band_score))}>{s.real_band_score.toFixed(1)}</span>
            : <span className="text-xs text-slate-300 dark:text-slate-600">—</span>}
        </td>
        <td className="py-3 pr-5">
          <div className="flex items-center justify-between gap-2">
            <span className={cn(
              'text-sm font-bold',
              (s.momentum_awarded ?? 0) > 0
                ? 'text-emerald-600 dark:text-emerald-400'
                : (s.momentum_awarded ?? 0) < 0
                ? 'text-rose-600 dark:text-rose-400'
                : 'text-slate-400'
            )}>
              {s.momentum_awarded != null
                ? (s.momentum_awarded > 0 ? '+' : '') + s.momentum_awarded
                : '—'}
            </span>
            {hasDetail && (
              expanded
                ? <ChevronUp className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                : <ChevronDown className="h-3.5 w-3.5 text-slate-400 shrink-0" />
            )}
          </div>
        </td>
      </tr>

      {expanded && s.scores && (
        <tr className="bg-slate-50/80 dark:bg-slate-800/30 border-b border-slate-100 dark:border-slate-800">
          <td colSpan={5} className="py-4 px-5">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-3">
              Skill Breakdown
            </p>
            <MockScorePanel scores={s.scores} />
          </td>
        </tr>
      )}
    </>
  );
}

export function MockSessionsTab({ sessions }: Props) {
  const completed = sessions.filter(s => s.status === 'COMPLETED');
  const scored    = completed.filter(s => s.real_band_score !== null);
  const avgBand   = scored.length > 0
    ? (scored.reduce((sum, s) => sum + s.real_band_score!, 0) / scored.length).toFixed(1)
    : null;

  if (sessions.length === 0) {
    return (
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-12 text-center">
        <p className="text-slate-400 text-sm">No mock test sessions yet.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Summary */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {[
          { label: 'Total Mocks',   value: sessions.length,  cls: 'text-slate-800 dark:text-white' },
          { label: 'Completed',     value: completed.length,  cls: 'text-emerald-600 dark:text-emerald-400' },
          { label: 'Avg Real Band', value: avgBand ?? '—',    cls: 'text-brand-teal-600 dark:text-brand-teal-400' },
        ].map(c => (
          <div key={c.label} className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-3 text-center">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{c.label}</p>
            <p className={cn('text-2xl font-black mt-1', c.cls)}>{c.value}</p>
          </div>
        ))}
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="px-5 py-3 border-b border-slate-100 dark:border-slate-800">
          <p className="text-xs text-slate-400">Click a completed row to see per-skill breakdown and AI feedback</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-slate-100 dark:border-slate-800 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                <th className="py-3 pl-5">Month</th>
                <th className="py-3">Type</th>
                <th className="py-3">Status</th>
                <th className="py-3">Real Band</th>
                <th className="py-3 pr-5">Momentum</th>
              </tr>
            </thead>
            <tbody>
              {sessions.map(s => <MockRow key={s.id} s={s} />)}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
