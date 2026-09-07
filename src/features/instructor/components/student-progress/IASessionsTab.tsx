import { useState } from 'react';
import { ChevronDown, ChevronUp, Cpu, CheckCircle2 } from 'lucide-react';
import { cn } from '@/shared/utils';
import { isSpokenEnglish } from '@/features/student/utils/exam';
import { cefrColor } from '@/features/student/config/cefrDisplay';
import type { IASession, SectionScore } from './types';

interface Props {
  sessions: IASession[];
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
  MISSED:      { label: 'Missed',      cls: 'bg-rose-100 text-rose-700' },
  IN_PROGRESS: { label: 'In Progress', cls: 'bg-amber-100 text-amber-700' },
  PENDING:     { label: 'Pending',     cls: 'bg-brand-bg-alt text-brand-text-mute' },
} as const;

// Guarded against non-array shapes: some historical Spoken English IA rows
// stored scores as an object ({ sectionScores, cefrLevel }) instead of the
// SectionScore[] array every reader (including this one) assumes — fixed at
// the source in spokenEnglishIAController.ts, but old rows can still have it.
function avgBand(scores: SectionScore[] | null): number | null {
  if (!Array.isArray(scores) || scores.length === 0) return null;
  const bands = scores.map(s => s.band).filter((b): b is number => b !== null);
  if (bands.length === 0) return null;
  return Math.round((bands.reduce((a, b) => a + b, 0) / bands.length) * 10) / 10;
}

/** Most recent scored sub-skill's CEFR label — the SE counterpart of avgBand.
 *  Never averages CEFR labels into a synthetic in-between level. */
function latestCefrLabel(scores: SectionScore[] | null): string | null {
  if (!Array.isArray(scores) || scores.length === 0) return null;
  const labeled = scores.filter(s => s.cefr_label != null);
  return labeled.length > 0 ? labeled[labeled.length - 1].cefr_label! : null;
}

function bandColorText(b: number | null): string {
  if (b === null) return 'text-brand-text-mute';
  if (b >= 7.5) return 'text-emerald-600';
  if (b >= 6.0) return 'text-amber-600';
  return 'text-rose-600';
}

/** Renders either an IELTS band or a CEFR label for a section-score cell. */
function ScoreValue({ isSE, band, cefrLabel, className }: {
  isSE: boolean; band: number | null; cefrLabel?: string | null; className: string;
}) {
  if (isSE) {
    return <span className={cn(className, cefrLabel ? cefrColor(cefrLabel) : 'text-brand-text-mute')}>{cefrLabel ?? '—'}</span>;
  }
  return <span className={cn(className, bandColorText(band))}>{band !== null ? band.toFixed(1) : '—'}</span>;
}

function skillLabel(skill: string, subSkill: string): string {
  // For READING and LISTENING the sub_skill mirrors the skill name — show just the skill
  if (skill === subSkill) return skill.charAt(0) + skill.slice(1).toLowerCase();
  const s = skill.charAt(0) + skill.slice(1).toLowerCase();
  const ss = subSkill.charAt(0) + subSkill.slice(1).toLowerCase();
  return `${s} · ${ss}`;
}

function ScoreDetailPanel({ scores, isSE }: { scores: SectionScore[]; isSE: boolean }) {
  const validScores = Array.isArray(scores) ? scores.filter(s => s.skill && s.sub_skill) : [];

  return (
    <div className="space-y-4">
      {/* Per-sub-skill score table */}
      <div>
        <p className="text-[10px] font-bold text-brand-text-mute font-jetbrains uppercase tracking-wider mb-2">
          Section Breakdown
        </p>
        <div className="rounded-xl border border-brand-line overflow-hidden">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-brand-line text-[10px] font-bold text-brand-text-mute font-jetbrains uppercase tracking-wider">
                <th className="py-2 pl-3">Skill / Sub-skill</th>
                <th className="py-2 text-center">{isSE ? 'Level' : 'Band'}</th>
                <th className="py-2 text-center">MCQ</th>
                <th className="py-2 pr-3 text-center">AI Graded</th>
              </tr>
            </thead>
            <tbody>
              {validScores.map((s, i) => (
                <tr key={i} className="border-b border-brand-line last:border-0 hover:bg-brand-bg-alt">
                  <td className="py-2 pl-3 font-semibold text-brand-text">
                    {skillLabel(s.skill, s.sub_skill)}
                  </td>
                  <td className="py-2 text-center">
                    <ScoreValue isSE={isSE} band={s.band} cefrLabel={s.cefr_label} className="font-black text-sm" />
                  </td>
                  <td className="py-2 text-center text-xs text-brand-text-mute">
                    {s.total > 0 ? `${s.correct}/${s.total}` : '—'}
                  </td>
                  <td className="py-2 pr-3 text-center">
                    {s.ai_graded
                      ? <Cpu className="h-3.5 w-3.5 text-brand-teal-500 mx-auto" />
                      : <span className="text-brand-text-mute text-xs">—</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* AI Feedback panels — one per sub-skill that has it */}
      {validScores.filter(s => s.ai_feedback).map((s, i) => (
        <div key={i} className="rounded-xl border border-brand-teal-100 bg-brand-teal-50/50 p-3 space-y-2">
          <div className="flex items-center gap-2">
            <Cpu className="h-3.5 w-3.5 text-brand-teal-500 shrink-0" />
            <p className="text-[10px] font-bold text-brand-teal-600 font-jetbrains uppercase tracking-wider">
              AI Feedback — {skillLabel(s.skill, s.sub_skill)}
            </p>
          </div>
          {s.ai_feedback!.rationale && (
            <p className="text-xs text-brand-text-mute leading-relaxed">
              {s.ai_feedback!.rationale}
            </p>
          )}
          {s.ai_feedback!.key_observations.length > 0 && (
            <ul className="space-y-1">
              {s.ai_feedback!.key_observations.map((obs, j) => (
                <li key={j} className="flex items-start gap-1.5 text-xs text-brand-text-mute">
                  <CheckCircle2 className="h-3 w-3 text-brand-teal-400 shrink-0 mt-0.5" />
                  {obs}
                </li>
              ))}
            </ul>
          )}
        </div>
      ))}
    </div>
  );
}

function IARow({ session, isSE }: { session: IASession; isSE: boolean }) {
  const [expanded, setExpanded] = useState(false);
  const cfg = STATUS_CONFIG[session.status] ?? STATUS_CONFIG.PENDING;
  const band = avgBand(session.scores);
  const cefrLabel = latestCefrLabel(session.scores);
  const subCount = session.selected_subskills?.length ?? 0;
  const cfCount  = session.carry_forward_subskills?.length ?? 0;
  const hasDetail = !!(session.scores && session.scores.length > 0);

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
        <td className="py-3 pl-5 text-sm font-bold text-brand-text">IA {session.ia_number}</td>
        <td className="py-3 text-sm text-brand-text-mute whitespace-nowrap">{session.ia_date}</td>
        <td className="py-3">
          <span className={cn('px-2 py-0.5 rounded-full text-[11px] font-bold', cfg.cls)}>{cfg.label}</span>
        </td>
        <td className="py-3">
          {(isSE ? cefrLabel != null : band !== null)
            ? <ScoreValue isSE={isSE} band={band} cefrLabel={cefrLabel} className="text-sm font-black" />
            : <span className="text-xs text-brand-text-mute">—</span>}
        </td>
        <td className="py-3 text-xs text-brand-text-mute">
          {subCount > 0 ? `${subCount} sub-skills` : '—'}
          {cfCount > 0 && <span className="ml-1 text-amber-500">({cfCount} CF)</span>}
        </td>
        <td className="py-3 pr-5">
          <div className="flex items-center justify-between gap-2">
            <span className={cn(
              'text-sm font-bold',
              (session.momentum_awarded ?? 0) > 0
                ? 'text-emerald-600'
                : (session.momentum_awarded ?? 0) < 0
                ? 'text-rose-600'
                : 'text-brand-text-mute'
            )}>
              {session.momentum_awarded != null
                ? (session.momentum_awarded > 0 ? '+' : '') + session.momentum_awarded
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

      {expanded && session.scores && (
        <tr className="bg-brand-bg-alt/80 border-b border-brand-line">
          <td colSpan={6} className="py-4 px-5">
            <div className="space-y-2">
              {/* Carry-forward strip */}
              {session.carry_forward_subskills && session.carry_forward_subskills.length > 0 && (
                <div className="flex items-center gap-2 flex-wrap mb-3">
                  <span className="text-[10px] font-bold text-amber-600 font-jetbrains uppercase tracking-wider">
                    Carry Forward
                  </span>
                  {session.carry_forward_subskills.map(s => (
                    <span key={s} className="px-1.5 py-0.5 bg-amber-50 text-amber-700 rounded text-[10px] font-semibold border border-amber-200">
                      {s}
                    </span>
                  ))}
                </div>
              )}
              <ScoreDetailPanel scores={session.scores} isSE={isSE} />
            </div>
          </td>
        </tr>
      )}
    </>
  );
}

export function IASessionsTab({ sessions, examId }: Props) {
  const isSE = isSpokenEnglish(examId);
  const completed = sessions.filter(s => s.status === 'COMPLETED').length;
  const missed    = sessions.filter(s => s.status === 'MISSED').length;
  const compRate  = sessions.length > 0 ? Math.round((completed / sessions.length) * 100) : 0;

  if (sessions.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-brand-line p-12 text-center">
        <p className="text-brand-text-mute text-sm">No internal assessment sessions yet.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Summary */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Total IAs',       value: sessions.length, cls: 'text-brand-text' },
          { label: 'Completed',       value: completed,        cls: 'text-emerald-600' },
          { label: 'Missed',          value: missed,           cls: 'text-rose-600' },
          { label: 'Completion Rate', value: `${compRate}%`,   cls: compRate >= 70 ? 'text-emerald-600' : 'text-amber-600' },
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
          <p className="text-xs text-brand-text-mute">Click a completed row to see scores and AI feedback</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-brand-line text-[11px] font-bold text-brand-text-mute font-jetbrains uppercase tracking-wider">
                <th className="py-3 pl-5">IA</th>
                <th className="py-3">Date</th>
                <th className="py-3">Status</th>
                <th className="py-3">{isSE ? 'Level' : 'Avg Band'}</th>
                <th className="py-3">Sub-skills</th>
                <th className="py-3 pr-5">Momentum</th>
              </tr>
            </thead>
            <tbody>
              {sessions.map(s => <IARow key={s.id} session={s} isSE={isSE} />)}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
