import { useState } from 'react';
import { ChevronDown, ChevronUp, Cpu, CheckCircle2 } from 'lucide-react';
import { cn } from '@/shared/utils';
import { bandFillPct } from '@/shared/utils/bandScale';
import { isSpokenEnglish } from '@/features/student/utils/exam';
import { cefrColor, cefrGaugeColor, cefrOrdinal, CEFR_ORDER } from '@/features/student/config/cefrDisplay';
import type { MockSession, MockSkillScore, MockSubSkillScore } from './types';

interface Props {
  sessions: MockSession[];
  /**
   * The student's exam_id, when the caller has it (see StudentFullProgress.
   * student.exam_id). Optional and defaults to the IELTS branch — every
   * existing caller that doesn't pass this keeps today's IELTS-only output
   * byte-identical.
   */
  examId?: string | null;
}

const STATUS_CONFIG = {
  COMPLETED:   { label: 'Completed',   cls: 'bg-emerald-100 text-emerald-700' },
  IN_PROGRESS: { label: 'In Progress', cls: 'bg-amber-100 text-amber-700' },
  PENDING:     { label: 'Pending',     cls: 'bg-brand-bg-alt text-brand-text-mute' },
} as const;

function bandColorText(b: number | null): string {
  if (b === null) return 'text-brand-text-mute';
  if (b >= 7.5) return 'text-emerald-600';
  if (b >= 6.0) return 'text-amber-600';
  return 'text-rose-600';
}

function formatMonthYear(my: string): string {
  const [y, m] = my.split('-');
  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  return `${months[parseInt(m, 10) - 1] ?? m} ${y}`;
}

function titleCase(s: string): string {
  return s.charAt(0) + s.slice(1).toLowerCase();
}

// Renders either an IELTS band or, for a Spoken English session, its CEFR
// label — never the raw ordinal in place of a band number. `className` carries
// the caller's own size/position classes so the IELTS branch stays a single
// span with the exact same classes as before this file was split.
function ScoreValue({ isSE, band, cefrLabel, className }: {
  isSE: boolean; band: number | null; cefrLabel?: string | null; className: string;
}) {
  if (isSE) {
    return <span className={cn(className, cefrLabel ? cefrColor(cefrLabel) : 'text-brand-text-mute')}>{cefrLabel ?? '—'}</span>;
  }
  return <span className={cn(className, bandColorText(band))}>{band !== null ? band.toFixed(1) : '—'}</span>;
}

function fillPct(isSE: boolean, band: number | null, cefrLabel?: string | null): number {
  if (isSE) return cefrLabel ? (cefrOrdinal(cefrLabel) / (CEFR_ORDER.length - 1)) * 100 : 0;
  return band !== null ? bandFillPct(band) : 0;
}

function fillColor(isSE: boolean, band: number | null, cefrLabel?: string | null): string {
  if (isSE) return cefrLabel ? cefrGaugeColor(cefrLabel) : 'bg-brand-text-mute/40';
  if (band === null) return 'bg-brand-text-mute/40';
  return band >= 7 ? 'bg-emerald-400' : band >= 6 ? 'bg-amber-400' : 'bg-rose-400';
}

function SubSkillRow({ ss, isSE }: { ss: MockSubSkillScore; isSE: boolean }) {
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
          <span className="text-brand-text-mute truncate">{titleCase(ss.sub_skill)}</span>
          {ss.ai_feedback && <Cpu className="h-2.5 w-2.5 text-brand-teal-400 shrink-0" />}
        </div>
        <div className="flex items-center gap-2 shrink-0 ml-2">
          <div className="w-16 h-1.5 bg-brand-bg-alt rounded-full overflow-hidden">
            <div
              className={cn('h-full rounded-full', fillColor(isSE, band, ss.cefr_label))}
              style={{ width: `${fillPct(isSE, band, ss.cefr_label)}%` }}
            />
          </div>
          <ScoreValue isSE={isSE} band={band} cefrLabel={ss.cefr_label} className="font-bold w-6 text-right" />
          {hasFeedback && (
            open
              ? <ChevronUp className="h-2.5 w-2.5 text-brand-text-mute" />
              : <ChevronDown className="h-2.5 w-2.5 text-brand-text-mute" />
          )}
        </div>
      </div>

      {open && ss.ai_feedback && (
        <div className="rounded-lg border border-brand-teal-100 bg-brand-teal-50/50 p-2.5 space-y-1.5 mb-1">
          {ss.ai_feedback.rationale && (
            <p className="text-[11px] text-brand-text-mute leading-relaxed">
              {ss.ai_feedback.rationale}
            </p>
          )}
          {ss.ai_feedback.key_observations.length > 0 && (
            <ul className="space-y-1">
              {ss.ai_feedback.key_observations.map((obs, i) => (
                <li key={i} className="flex items-start gap-1.5 text-[11px] text-brand-text-mute">
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

function SkillCard({ sk, isSE }: { sk: MockSkillScore; isSE: boolean }) {
  const band = sk.band ?? null;

  return (
    <div className="rounded-xl border border-brand-line bg-white p-3 space-y-2">
      {/* Skill header */}
      <div className="flex items-center justify-between">
        <span className="text-xs font-bold text-brand-text font-jetbrains uppercase tracking-wide">
          {titleCase(sk.skill)}
        </span>
        <div className="flex items-center gap-1.5">
          {sk.ai_graded && <Cpu className="h-3 w-3 text-brand-teal-400" />}
          <ScoreValue isSE={isSE} band={band} cefrLabel={sk.cefr_label} className="text-lg font-black" />
        </div>
      </div>

      {/* MCQ summary */}
      {sk.total > 0 && (
        <p className="text-[10px] text-brand-text-mute">
          MCQ: {sk.correct}/{sk.total}
        </p>
      )}

      {/* Sub-skill breakdown */}
      {sk.sub_skill_scores && sk.sub_skill_scores.length > 0 && (
        <div className="pt-1.5 border-t border-brand-line space-y-0.5">
          {sk.sub_skill_scores.map(ss => (
            <SubSkillRow key={ss.sub_skill} ss={ss} isSE={isSE} />
          ))}
        </div>
      )}
    </div>
  );
}

function MockScorePanel({ scores, isSE }: { scores: MockSkillScore[]; isSE: boolean }) {
  const skillOrder = ['LISTENING', 'READING', 'WRITING', 'SPEAKING'];
  const sorted = [...scores].sort(
    (a, b) => skillOrder.indexOf(a.skill) - skillOrder.indexOf(b.skill)
  );

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      {sorted.map(sk => <SkillCard key={sk.skill} sk={sk} isSE={isSE} />)}
    </div>
  );
}

function MockRow({ s, isSE }: { s: MockSession; isSE: boolean }) {
  const [expanded, setExpanded] = useState(false);
  const cfg = STATUS_CONFIG[s.status] ?? STATUS_CONFIG.PENDING;
  const hasDetail = !!(s.scores && s.scores.length > 0);

  return (
    <>
      <tr
        className={cn(
          'border-b border-brand-line transition-colors',
          hasDetail ? 'cursor-pointer hover:bg-brand-bg-alt' : '',
          expanded && 'bg-brand-bg-alt'
        )}
        onClick={() => hasDetail && setExpanded(e => !e)}
      >
        <td className="py-3 pl-5 text-sm font-semibold text-brand-text whitespace-nowrap">
          {formatMonthYear(s.month_year)}
        </td>
        <td className="py-3 text-xs text-brand-text-mute capitalize">
          {s.attempt_type.toLowerCase().replace('_', ' ')}
        </td>
        <td className="py-3">
          <span className={cn('px-2 py-0.5 rounded-full text-[11px] font-bold', cfg.cls)}>{cfg.label}</span>
        </td>
        <td className="py-3">
          {(isSE ? s.real_cefr_label != null : s.real_band_score !== null)
            ? <ScoreValue isSE={isSE} band={s.real_band_score} cefrLabel={s.real_cefr_label} className="text-sm font-black" />
            : <span className="text-xs text-brand-text-mute">—</span>}
        </td>
        <td className="py-3 pr-5">
          <div className="flex items-center justify-between gap-2">
            <span className={cn(
              'text-sm font-bold',
              (s.momentum_awarded ?? 0) > 0
                ? 'text-emerald-600'
                : (s.momentum_awarded ?? 0) < 0
                ? 'text-rose-600'
                : 'text-brand-text-mute'
            )}>
              {s.momentum_awarded != null
                ? (s.momentum_awarded > 0 ? '+' : '') + s.momentum_awarded
                : '—'}
            </span>
            {hasDetail && (
              expanded
                ? <ChevronUp className="h-3.5 w-3.5 text-brand-text-mute shrink-0" />
                : <ChevronDown className="h-3.5 w-3.5 text-brand-text-mute shrink-0" />
            )}
          </div>
        </td>
      </tr>

      {expanded && s.scores && (
        <tr className="bg-brand-bg-alt/80 border-b border-brand-line">
          <td colSpan={5} className="py-4 px-5">
            <p className="text-[10px] font-bold text-brand-text-mute font-jetbrains uppercase tracking-wider mb-3">
              Skill Breakdown
            </p>
            <MockScorePanel scores={s.scores} isSE={isSE} />
          </td>
        </tr>
      )}
    </>
  );
}

export function MockSessionsTab({ sessions, examId }: Props) {
  const isSE = isSpokenEnglish(examId);
  const completed = sessions.filter(s => s.status === 'COMPLETED');
  // IELTS: numeric average band. SE: no averaging of CEFR labels into a
  // number — show the latest session's label instead (see bandScale.ts /
  // cefrDisplay.tsx: a CEFR label is never blended into a numeric mean).
  const scored   = completed.filter(s => s.real_band_score !== null);
  const avgBand  = scored.length > 0
    ? (scored.reduce((sum, s) => sum + s.real_band_score!, 0) / scored.length).toFixed(1)
    : null;
  const latestSE = [...completed]
    .filter(s => s.real_cefr_label != null)
    .sort((a, b) => a.month_year.localeCompare(b.month_year))
    .pop();

  if (sessions.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-brand-line p-12 text-center">
        <p className="text-brand-text-mute text-sm">No mock test sessions yet.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Summary */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {[
          { label: 'Total Mocks',   value: sessions.length,  cls: 'text-brand-text' },
          { label: 'Completed',     value: completed.length,  cls: 'text-emerald-600' },
          isSE
            ? { label: 'Latest CEFR Level', value: latestSE?.real_cefr_label ?? '—', cls: latestSE?.real_cefr_label ? cefrColor(latestSE.real_cefr_label) : 'text-brand-text-mute' }
            : { label: 'Avg Real Band', value: avgBand ?? '—',    cls: 'text-brand-teal-600' },
        ].map(c => (
          <div key={c.label} className="bg-white rounded-xl border border-brand-line p-3 text-center">
            <p className="text-[10px] font-bold text-brand-text-mute font-jetbrains uppercase tracking-wider">{c.label}</p>
            <p className={cn('text-2xl font-black mt-1', c.cls)}>{c.value}</p>
          </div>
        ))}
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-brand-line shadow-sm overflow-hidden">
        <div className="px-5 py-3 border-b border-brand-line">
          <p className="text-xs text-brand-text-mute">Click a completed row to see per-skill breakdown and AI feedback</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-brand-line text-[11px] font-bold text-brand-text-mute font-jetbrains uppercase tracking-wider">
                <th className="py-3 pl-5">Month</th>
                <th className="py-3">Type</th>
                <th className="py-3">Status</th>
                <th className="py-3">{isSE ? 'CEFR Level' : 'Real Band'}</th>
                <th className="py-3 pr-5">Momentum</th>
              </tr>
            </thead>
            <tbody>
              {sessions.map(s => <MockRow key={s.id} s={s} isSE={isSE} />)}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
