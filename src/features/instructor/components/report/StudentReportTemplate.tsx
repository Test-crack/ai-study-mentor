import { useEffect } from 'react';
import { createPortal } from 'react-dom';
import type { StudentFullProgress } from '../student-progress/types';
import { bandFillPct } from '@/shared/utils/bandScale';
import { isSpokenEnglish } from '@/features/student/utils/exam';
import { CefrBadge, cefrColor, cefrGaugeColor, cefrOrdinal, CEFR_ORDER } from '@/features/student/config/cefrDisplay';
import { examDisplay } from '@/features/student/config/examDisplay';

interface Props {
  data: StudentFullProgress;
  batchName: string;
  instituteName: string | null;
  instructorName: string | null;
  generatedAt: string;
  reportId: string;
  onClose: () => void;
}

function bandColor(band: number | null): string {
  if (band === null) return 'text-brand-text-mute';
  if (band >= 7.5) return 'text-emerald-700';
  if (band >= 6.0) return 'text-amber-700';
  return 'text-rose-700';
}

function bandBgBar(band: number | null): string {
  if (band === null) return 'bg-slate-200';
  if (band >= 7.5) return 'bg-emerald-500';
  if (band >= 6.0) return 'bg-amber-500';
  return 'bg-rose-500';
}

function bandBgColor(band: number | null): string {
  if (band === null) return 'bg-slate-100 text-brand-text-mute';
  if (band >= 7.5) return 'bg-emerald-100 text-emerald-800';
  if (band >= 6.0) return 'bg-amber-100 text-amber-800';
  return 'bg-rose-100 text-rose-800';
}

function statusBadge(status: string): string {
  if (status === 'COMPLETED') return 'bg-emerald-100 text-emerald-700';
  if (status === 'MISSED') return 'bg-rose-100 text-rose-700';
  return 'bg-slate-100 text-brand-text-mute';
}

const SKILL_LABELS: Record<string, string> = {
  Listening: 'L',
  Reading: 'R',
  Writing: 'W',
  Speaking: 'S',
};


// ─── Diagnostic report helpers ────────────────────────────────────────────────
// Skill keys arrive UPPERCASE from the diagnostic endpoint (see SKILL_ORDER in
// DiagnosticTab). All matching here is case-insensitive — the previous version
// of this section compared against title-case literals, so every lookup missed
// and the whole block rendered four dashes.

const DIAG_SKILLS = ['LISTENING', 'READING', 'WRITING', 'SPEAKING'] as const;

const titleCase = (s: string) => s.charAt(0) + s.slice(1).toLowerCase();

/** Null-safe average band, same pattern as IASessionsTab.tsx's avgBand(). */
function avgBand(scores: { band: number | null }[] | null): number | null {
  if (!scores || scores.length === 0) return null;
  const bands = scores.map(s => s.band).filter((b): b is number => b !== null);
  if (bands.length === 0) return null;
  return Math.round((bands.reduce((a, b) => a + b, 0) / bands.length) * 10) / 10;
}

const fmtDiagDate = (iso: string) => {
  const d = new Date(iso);
  return isNaN(d.getTime())
    ? '—'
    : d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
};

/** One row of a sub-score, print-safe (no animated bars). */
function SubScoreRow({ label, value }: { label: string; value?: number }) {
  if (value === undefined || value === null) return null;
  return (
    <div className="flex items-center justify-between text-[11px] leading-5">
      <span className="text-brand-text-mute">{label}</span>
      <span className="font-bold text-brand-text">{value.toFixed(1)}</span>
    </div>
  );
}

/** Renders whichever sub_scores shape this skill carries. */
function DiagSubScores({ skill, ss }: { skill: string; ss: any }) {
  if (!ss) return <p className="text-[11px] text-brand-text-mute">Score details unavailable.</p>;

  if (skill === 'LISTENING' || skill === 'READING') {
    const qt = ss.by_question_type && Object.entries(ss.by_question_type);
    return (
      <div className="space-y-1">
        {ss.correct_answers !== undefined && (
          <div className="flex items-center justify-between text-[11px] leading-5">
            <span className="text-brand-text-mute">Accuracy</span>
            <span className="font-bold text-brand-text">
              {ss.correct_answers}/{ss.total_questions}
              {ss.accuracy_percentage !== undefined && (
                <span className="ml-1 font-normal text-brand-text-mute">({ss.accuracy_percentage}%)</span>
              )}
            </span>
          </div>
        )}
        {qt && qt.length > 0 && (
          <div className="pt-1 mt-1 border-t border-slate-200 space-y-0.5">
            <p className="text-[9px] font-black uppercase tracking-wider text-brand-text-mute">By question type</p>
            {qt.map(([type, val]: [string, any]) => (
              <div key={type} className="flex items-center justify-between text-[11px] leading-5">
                <span className="text-brand-text-mute capitalize">{type.replace(/_/g, ' ')}</span>
                <span className="font-semibold text-brand-text">{val.correct}/{val.total}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  if (skill === 'WRITING') {
    return (
      <div className="space-y-1">
        {ss.word_count !== undefined && (
          <div className="flex items-center justify-between text-[11px] leading-5">
            <span className="text-brand-text-mute">Word count</span>
            <span className="font-bold text-brand-text">{ss.word_count}</span>
          </div>
        )}
        <SubScoreRow label="Task Response" value={ss.taskResponseScore} />
        <SubScoreRow label="Coherence"     value={ss.coherenceScore} />
        <SubScoreRow label="Grammar"       value={ss.grammarScore} />
        <SubScoreRow label="Vocabulary"    value={ss.vocabularyScore} />
      </div>
    );
  }

  return (
    <div className="space-y-1">
      <SubScoreRow label="Fluency"       value={ss.fluencyScore} />
      <SubScoreRow label="Vocabulary"    value={ss.vocabularyScore} />
      <SubScoreRow label="Grammar"       value={ss.grammarScore} />
      <SubScoreRow label="Pronunciation" value={ss.pronunciationScore} />
    </div>
  );
}

export function StudentReportTemplate({ data, batchName, instituteName, instructorName, generatedAt, reportId, onClose }: Props) {
  useEffect(() => {
    const style = document.createElement('style');
    style.id = 'tc-student-print-style';
    style.textContent = `
      @media print {
        * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
        body > *:not(#tc-student-report) { display: none !important; }
        #tc-student-report { display: block !important; position: static !important; overflow: visible !important; background: white !important; }
        @page { size: A4; margin: 1.5cm; }
      }
    `;
    document.head.appendChild(style);
    return () => {
      const el = document.getElementById('tc-student-print-style');
      if (el) el.remove();
    };
  }, []);

  const { student, target_band, current_band, momentum_score, daily_streak } = data;
  const competency       = data.competency        ?? [];
  const ia_sessions      = data.ia_sessions       ?? [];
  const mock_sessions    = data.mock_sessions      ?? [];
  const diagnostic_results = data.diagnostic_results ?? [];
  const drill_stats      = data.drill_stats ?? {
    last_14_days: [], sub_skill_counts: [], streak_calendar: [],
    total_drills_all_time: 0, avg_dcs_lifetime: 0,
  };
  const lexigrid_stats   = data.lexigrid_stats ?? { games_last_14: 0, avg_words_solved: 0, bonus_rate: 0 };

  const isSE = isSpokenEnglish(student.exam_id);
  const disp = examDisplay(student.exam_id);

  // SE has one competency row (SPEAKING); its CEFR result and 6-subskill
  // profile live inside sub_scores, same shape used on the student side
  // (AssessmentHistoryPage/Report/VivaDiagnostic).
  const speakingSubScores: any = competency.find(c => c.skill.toUpperCase() === 'SPEAKING')?.sub_scores ?? null;
  const speakingCefrLabel: string | undefined = speakingSubScores?.cefrLabel ?? undefined;
  const speakingSubskillProfile: Array<{ id: string; label: string; level: string; score: number }> =
    Array.isArray(speakingSubScores?.subskillProfile) ? speakingSubScores.subskillProfile : [];

  const initials = student.name
    .split(' ')
    .map(w => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  const recentIAs = [...ia_sessions]
    .sort((a, b) => b.ia_number - a.ia_number)
    .slice(0, 10);

  const gap = current_band !== null && target_band !== null ? current_band - target_band : null;

  // Skills order
  const skillOrder = ['Listening', 'Reading', 'Writing', 'Speaking'];

  return createPortal(
    <div
      id="tc-student-report"
      className="fixed inset-0 z-[200] bg-gray-100 overflow-auto print:overflow-visible"
    >
      {/* Toolbar — hidden on print */}
      <div className="print:hidden sticky top-0 z-10 bg-white border-b border-brand-line shadow-sm px-6 py-3 flex items-center justify-between">
        <span className="font-semibold text-brand-text text-sm">Student Report Preview</span>
        <div className="flex items-center gap-3">
          <button
            onClick={() => window.print()}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-brand-teal-600 text-white text-sm font-medium hover:bg-brand-teal-700 transition-colors"
          >
            Save as PDF
          </button>
          <button
            onClick={onClose}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-slate-100 text-brand-text text-sm font-medium hover:bg-slate-200 transition-colors"
          >
            Close
          </button>
        </div>
      </div>

      {/* ===== PAGE 1 ===== */}
      <div className="max-w-[800px] mx-auto bg-white shadow-lg my-8 p-12 print:shadow-none print:my-0 print:p-[1.5cm]">
        {/* Header */}
        <div className="flex items-start justify-between pb-4 border-b-2 border-brand-teal-600 mb-8">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-md bg-brand-teal-600 flex items-center justify-center flex-shrink-0">
              <span className="text-white font-black text-sm">TC</span>
            </div>
            <div>
              <div className="font-bold text-brand-text text-base leading-tight">TestCrack</div>
              <div className="text-brand-text-mute text-xs">
                {isSE ? 'Spoken English Practice Platform' : 'IELTS Preparation Platform'}
              </div>
            </div>
          </div>
          <div className="text-right">
            <div className="text-[10px] font-black uppercase tracking-widest text-brand-teal-600 mb-0.5">Student Progress Report</div>
            <div className="text-xs text-brand-text-mute">{generatedAt}</div>
            <div className="text-[10px] text-brand-text-mute font-mono">{reportId}</div>
          </div>
        </div>

        {/* Student Info */}
        <div className="flex items-center gap-5 mb-8">
          {student.avatar ? (
            <img
              src={student.avatar}
              alt={student.name}
              className="w-16 h-16 rounded-full object-cover flex-shrink-0 border-2 border-brand-teal-100"
            />
          ) : (
            <div className="w-16 h-16 rounded-full bg-brand-teal-600 flex items-center justify-center flex-shrink-0">
              <span className="text-white font-black text-lg">{initials}</span>
            </div>
          )}
          <div>
            <h1 className="text-2xl font-black text-brand-text mb-0.5">{student.name}</h1>
            <div className="text-sm text-brand-text-mute mb-0.5">{student.email}</div>
            <div className="text-xs text-brand-text-mute flex items-center gap-1.5">
              <span>Batch: <span className="font-medium text-slate-600">{batchName}</span></span>
              {instituteName && (
                <>
                  <span>·</span>
                  <span>Institute: <span className="font-medium text-slate-600">{instituteName}</span></span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Progress Overview */}
        <div className="mb-8">
          <h2 className="text-xs font-black uppercase tracking-widest text-brand-text-mute mb-3">Progress Overview</h2>

          {isSE ? (
            <>
              {/* CEFR headline — never a raw band number for Spoken English. */}
              <div className="flex items-center gap-4 mb-5">
                <CefrBadge label={speakingCefrLabel} />
                <div>
                  <div className="text-xs font-bold text-brand-text uppercase tracking-wide">{disp.headlineLabel}</div>
                  {speakingSubScores?.scoredPromptCount != null && (
                    <div className="text-xs text-brand-text-mute mt-0.5">
                      Based on {speakingSubScores.scoredPromptCount} graded {speakingSubScores.scoredPromptCount === 1 ? 'answer' : 'answers'}.
                    </div>
                  )}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4 mb-5">
                {[
                  { label: 'Momentum Score', value: momentum_score, accent: 'bg-amber-500' },
                  { label: 'Daily Streak', value: `${daily_streak}d`, accent: 'bg-emerald-500' },
                ].map(card => (
                  <div key={card.label} className="bg-white border border-brand-line rounded-xl overflow-hidden">
                    <div className={`h-1.5 w-full ${card.accent}`} />
                    <div className="p-4">
                      <div className="text-2xl font-black text-brand-text">{card.value}</div>
                      <div className="text-xs text-brand-text-mute mt-0.5">{card.label}</div>
                    </div>
                  </div>
                ))}
              </div>
              {disp.disclaimer && (
                <p className="text-[10px] text-brand-text-mute italic mb-3">{disp.disclaimer}</p>
              )}
            </>
          ) : (
            <>
              {/* 4 stat cards */}
              <div className="grid grid-cols-4 gap-4 mb-5">
                {[
                  { label: 'Current Band', value: current_band ?? '—', accent: 'bg-brand-teal-500' },
                  { label: 'Target Band', value: target_band ?? '—', accent: 'bg-brand-blue-500' },
                  { label: 'Momentum Score', value: momentum_score, accent: 'bg-amber-500' },
                  { label: 'Daily Streak', value: `${daily_streak}d`, accent: 'bg-emerald-500' },
                ].map(card => (
                  <div key={card.label} className="bg-white border border-brand-line rounded-xl overflow-hidden">
                    <div className={`h-1.5 w-full ${card.accent}`} />
                    <div className="p-4">
                      <div className="text-2xl font-black text-brand-text">{card.value}</div>
                      <div className="text-xs text-brand-text-mute mt-0.5">{card.label}</div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Band Progress Bar */}
              {current_band !== null && (
                <div className="bg-slate-50 rounded-xl border border-brand-line p-5 mb-3">
                  <div className="relative h-4 bg-slate-200 rounded-full mb-3">
                    {/* Current band marker */}
                    <div
                      className="absolute top-0 h-full bg-brand-teal-500 rounded-full"
                      style={{ width: `${bandFillPct(current_band)}%` }}
                    />
                    {/* Target band marker */}
                    {target_band !== null && (
                      <div
                        className="absolute top-0 h-full border-r-2 border-brand-blue-600"
                        style={{ width: `${bandFillPct(target_band)}%` }}
                      />
                    )}
                  </div>
                  <div className="flex justify-between text-xs text-brand-text-mute">
                    <span>0</span>
                    {[1,2,3,4,5,6,7,8,9].map(n => (
                      <span key={n}>{n}</span>
                    ))}
                  </div>
                  <div className="flex items-center gap-4 mt-3 text-xs">
                    <span className="flex items-center gap-1.5">
                      <span className="w-3 h-3 rounded-full bg-brand-teal-500 inline-block" />
                      <span className="text-slate-600">Current: <strong>{current_band}</strong></span>
                    </span>
                    {target_band !== null && (
                      <span className="flex items-center gap-1.5">
                        <span className="w-3 h-3 rounded-full bg-brand-blue-500 inline-block" />
                        <span className="text-slate-600">Target: <strong>{target_band}</strong></span>
                      </span>
                    )}
                    {gap !== null && (
                      <span className={`font-bold ${gap >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                        Gap: {gap > 0 ? `+${gap}` : gap}
                      </span>
                    )}
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Skill Breakdown — IELTS is 4 skills (L/R/W/S); Spoken English is one skill
            with 6 subskills, read from the SPEAKING row's sub_scores.subskillProfile. */}
        {isSE ? (
          <div>
            <h2 className="text-xs font-black uppercase tracking-widest text-brand-text-mute mb-3">Subskill Breakdown</h2>
            {speakingSubskillProfile.length > 0 ? (
              <div className="space-y-3">
                {speakingSubskillProfile.map(sub => (
                  <div key={sub.id} className="flex items-center gap-4">
                    <div className="w-40 text-xs font-semibold text-brand-text flex-shrink-0">{sub.label}</div>
                    <div className="flex-1 h-3 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full ${cefrGaugeColor(sub.level)}`}
                        style={{ width: `${(cefrOrdinal(sub.level) / (CEFR_ORDER.length - 1)) * 100}%` }}
                      />
                    </div>
                    <div className={`w-10 text-right text-xs font-bold ${cefrColor(sub.level)}`}>
                      {sub.level?.toUpperCase() ?? '—'}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="rounded-xl bg-slate-50 border border-brand-line px-6 py-4 text-sm text-brand-text-mute">
                No subskill data yet — the student has not completed a scored speaking diagnostic or assessment.
              </div>
            )}
          </div>
        ) : (
          <div>
            <h2 className="text-xs font-black uppercase tracking-widest text-brand-text-mute mb-3">Skill Breakdown</h2>
            <div className="space-y-3">
              {skillOrder.map(skill => {
                const row = competency.find(c => c.skill.toUpperCase() === skill.toUpperCase());
                const bandScore = row?.band_score ?? null;
                const short = SKILL_LABELS[skill] ?? skill[0];
                return (
                  <div key={skill} className="flex items-center gap-4">
                    <div className="w-24 text-xs font-semibold text-brand-text flex-shrink-0">
                      {short} — {skill}
                    </div>
                    <div className="flex-1 h-3 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full ${bandBgBar(bandScore)}`}
                        style={{ width: bandScore !== null ? `${bandFillPct(bandScore)}%` : '0%' }}
                      />
                    </div>
                    <div className={`w-10 text-right text-xs font-bold ${bandColor(bandScore)}`}>
                      {bandScore ?? '—'}
                    </div>
                    <div className="w-16 text-right text-xs text-brand-text-mute">
                      Target: {target_band ?? '—'}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* ===== PAGE 2 ===== */}
      <div className="max-w-[800px] mx-auto bg-white shadow-lg my-8 p-12 print:shadow-none print:my-0 print:p-[1.5cm] print:break-before-page">
        {/* IA History */}
        <div className="mb-10">
          <h2 className="text-lg font-black text-brand-text mb-4">IA History</h2>
          {recentIAs.length > 0 ? (
            <table className="w-full text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-brand-line">
                  {['IA #', 'Date', 'Status', 'Sub-Skills', 'Band', 'Momentum'].map(h => (
                    <th key={h} className="text-left text-[10px] font-black uppercase tracking-wider text-brand-text-mute px-3 py-2 first:pl-0 last:pr-0">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {recentIAs.map((ia, i) => {
                  const iaAvgBand = avgBand(ia.scores);
                  return (
                    <tr key={ia.id} className={i % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'}>
                      <td className="px-3 py-2 pl-0 font-bold text-brand-text">#{ia.ia_number}</td>
                      <td className="px-3 py-2 text-slate-600">{ia.ia_date}</td>
                      <td className="px-3 py-2">
                        <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold ${statusBadge(ia.status)}`}>
                          {ia.status}
                        </span>
                      </td>
                      <td className="px-3 py-2 text-slate-600">
                        {ia.selected_subskills && ia.selected_subskills.length > 0
                          ? ia.selected_subskills
                              .map(s => typeof s === 'string' ? s : (s as any).sub_skill ?? (s as any).name ?? String(s))
                              .join(', ')
                          : '—'}
                      </td>
                      <td className={`px-3 py-2 font-bold ${bandColor(iaAvgBand)}`}>
                        {iaAvgBand !== null ? iaAvgBand.toFixed(1) : '—'}
                      </td>
                      <td className="px-3 py-2 pr-0 text-amber-700 font-medium">
                        {ia.momentum_awarded ?? '—'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          ) : (
            <div className="rounded-xl bg-slate-50 border border-brand-line px-6 py-4 text-sm text-brand-text-mute">
              No IA sessions yet.
            </div>
          )}
        </div>

        {/* Mock Test History */}
        <div>
          <h2 className="text-lg font-black text-brand-text mb-4">Mock Test History</h2>
          {mock_sessions.length > 0 ? (
            <table className="w-full text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-brand-line">
                  {['Month', 'Attempt Type', 'Status', 'Real Band', 'Momentum'].map(h => (
                    <th key={h} className="text-left text-[10px] font-black uppercase tracking-wider text-brand-text-mute px-3 py-2 first:pl-0 last:pr-0">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {mock_sessions.map((m, i) => (
                  <tr key={m.id} className={i % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'}>
                    <td className="px-3 py-2 pl-0 text-brand-text">{m.month_year}</td>
                    <td className="px-3 py-2 text-slate-600">{m.attempt_type}</td>
                    <td className="px-3 py-2">
                      <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold ${statusBadge(m.status)}`}>
                        {m.status}
                      </span>
                    </td>
                    <td className={`px-3 py-2 font-bold ${bandColor(m.real_band_score)}`}>
                      {m.real_band_score ?? '—'}
                    </td>
                    <td className="px-3 py-2 pr-0 text-amber-700 font-medium">
                      {m.momentum_awarded ?? '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="rounded-xl bg-slate-50 border border-brand-line px-6 py-4 text-sm text-brand-text-mute">
              No mock tests yet.
            </div>
          )}
        </div>
      </div>

      {/* ===== PAGE 3 ===== */}
      <div className="max-w-[800px] mx-auto bg-white shadow-lg my-8 p-12 print:shadow-none print:my-0 print:p-[1.5cm] print:break-before-page">
        {/* Drill Engagement */}
        <div className="mb-10">
          <h2 className="text-xs font-black uppercase tracking-widest text-brand-text-mute mb-3">Drill Engagement</h2>
          <div className="bg-slate-50 rounded-xl border border-brand-line px-6 py-4 flex items-center gap-10 flex-wrap">
            {[
              { label: 'Total Drills', value: drill_stats.total_drills_all_time },
              { label: 'Avg DCS', value: drill_stats.avg_dcs_lifetime.toFixed(1) },
              { label: 'Drills Last 14 Days', value: drill_stats.last_14_days.reduce((s, d) => s + d.count, 0) },
              { label: 'Lexigrid Games', value: lexigrid_stats.games_last_14 },
            ].map(stat => (
              <div key={stat.label}>
                <div className="text-xl font-black text-brand-text">{stat.value}</div>
                <div className="text-xs text-brand-text-mute">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* ── Diagnostic Baseline ──────────────────────────────────────────
            The diagnostic is the line every later band is measured from, so the
            report now carries the same detail the instructor sees on the
            Diagnostic tab: per-skill band, when it was sat, the score breakdown
            and the movement since.

            Previously this rendered four band numbers — and in practice four
            dashes, because the lookup compared UPPERCASE skill keys against
            title-case literals and never matched.

            IELTS-only: the 4-skill (L/R/W/S) shape below doesn't apply to Spoken
            English's single-skill/6-subskill CEFR model, and this payload has no
            CEFR-shaped diagnostic data to show yet either way — see the isSE
            placeholder just below. */}
        {isSE && (
          <div className="mb-10">
            <h2 className="text-xs font-black uppercase tracking-widest text-brand-text-mute mb-3">
              Diagnostic Baseline
            </h2>
            <div className="rounded-xl bg-slate-50 border border-brand-line px-6 py-4 text-sm text-brand-text-mute">
              Spoken English diagnostic baseline reporting is not yet available in the instructor report.
            </div>
          </div>
        )}
        {!isSE && diagnostic_results.length > 0 && (() => {
          // Oldest result per skill, case-insensitive — the baseline.
          // studentProgressQueries already sends one entry per skill (ordered
          // created_at asc, first-seen wins), so this is normally a no-op; it
          // keeps the *baseline* semantics if that ever sends more than one.
          const bySkill = new Map<string, typeof diagnostic_results[number]>();
          for (const r of diagnostic_results) {
            const key = r.skill.toUpperCase();
            const prev = bySkill.get(key);
            if (!prev || new Date(r.created_at) < new Date(prev.created_at)) bySkill.set(key, r);
          }
          const scored = DIAG_SKILLS.map(k => bySkill.get(k)).filter(Boolean) as typeof diagnostic_results;
          const avgBaseline = scored.length
            ? scored.reduce((a, r) => a + r.band_score, 0) / scored.length
            : null;
          // The diagnostic can be sat per skill, so report the most recent sitting.
          const completedAt = scored.length
            ? scored.reduce(
                (latest, r) => (new Date(r.created_at) > new Date(latest) ? r.created_at : latest),
                scored[0].created_at
              )
            : null;
          const currentBySkill = new Map(competency.map(c => [c.skill.toUpperCase(), c.band_score]));

          return (
            <div className="mb-10">
              <h2 className="text-xs font-black uppercase tracking-widest text-brand-text-mute mb-3">
                Diagnostic Baseline
              </h2>

              {/* Summary strip — mirrors the tiles on the Diagnostic tab. */}
              <div className="grid grid-cols-3 gap-4 mb-5">
                <div className="bg-white border border-brand-line rounded-xl p-3 text-center">
                  <div className="text-[9px] font-black uppercase tracking-wider text-brand-text-mute mb-1">Skills diagnosed</div>
                  <div className="text-xl font-black text-brand-text">{scored.length} / {DIAG_SKILLS.length}</div>
                </div>
                <div className="bg-white border border-brand-line rounded-xl p-3 text-center">
                  <div className="text-[9px] font-black uppercase tracking-wider text-brand-text-mute mb-1">Avg baseline band</div>
                  <div className={`text-xl font-black ${bandColor(avgBaseline)}`}>
                    {avgBaseline === null ? '—' : avgBaseline.toFixed(1)}
                  </div>
                </div>
                <div className="bg-white border border-brand-line rounded-xl p-3 text-center">
                  <div className="text-[9px] font-black uppercase tracking-wider text-brand-text-mute mb-1">Completed</div>
                  <div className="text-sm font-black text-brand-text pt-1">
                    {completedAt ? fmtDiagDate(completedAt) : '—'}
                  </div>
                </div>
              </div>

              {/* Baseline vs current — the growth story, which is the reason a
                  baseline belongs in a report at all. Change = current minus
                  baseline, the same definition the instructor BaselineComparison
                  uses on the Overview tab. */}
              <table className="w-full border-collapse mb-5">
                <thead>
                  <tr className="text-[9px] font-black uppercase tracking-wider text-brand-text-mute border-b border-brand-line">
                    <th className="text-left py-1.5">Skill</th>
                    <th className="text-right py-1.5">Baseline</th>
                    <th className="text-right py-1.5">Current</th>
                    <th className="text-right py-1.5">Change</th>
                  </tr>
                </thead>
                <tbody>
                  {DIAG_SKILLS.map(key => {
                    const r = bySkill.get(key);
                    const base = r?.band_score ?? null;
                    const cur = currentBySkill.get(key) ?? null;
                    const delta =
                      base !== null && cur !== null ? Math.round((cur - base) * 10) / 10 : null;
                    return (
                      <tr key={key} className="border-b border-slate-100">
                        <td className="py-1.5 text-[11px] font-semibold text-brand-text">
                          {SKILL_LABELS[titleCase(key)] ?? key[0]} — {titleCase(key)}
                        </td>
                        <td className={`py-1.5 text-right text-[11px] font-bold ${bandColor(base)}`}>
                          {base ?? '—'}
                        </td>
                        <td className={`py-1.5 text-right text-[11px] font-bold ${bandColor(cur)}`}>
                          {cur ?? '—'}
                        </td>
                        <td className="py-1.5 text-right text-[11px] font-bold">
                          {/* A missing baseline or current band means unmeasured,
                              which is not the same fact as zero change. */}
                          {delta === null ? (
                            <span className="text-brand-text-mute">—</span>
                          ) : delta === 0 ? (
                            <span className="text-brand-text-mute">0.0</span>
                          ) : (
                            <span className={delta > 0 ? 'text-emerald-700' : 'text-rose-700'}>
                              {delta > 0 ? '+' : ''}{delta.toFixed(1)}
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>

              {/* Per-skill breakdown — the detail that was only on screen before. */}
              <div className="grid grid-cols-2 gap-4">
                {DIAG_SKILLS.map(key => {
                  const r = bySkill.get(key);
                  if (!r) return null;
                  const fb = r.feedback_json;
                  return (
                    <div
                      key={key}
                      className="bg-white border border-brand-line rounded-xl p-3 print:break-inside-avoid"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <div className="text-[10px] font-black uppercase tracking-wider text-brand-text">
                            {titleCase(key)}
                          </div>
                          <div className="text-[9px] text-brand-text-mute">{fmtDiagDate(r.created_at)}</div>
                        </div>
                        <div className={`text-lg font-black ${bandColor(r.band_score)}`}>
                          {r.band_score.toFixed(1)}
                        </div>
                      </div>
                      <DiagSubScores skill={key} ss={r.sub_scores} />
                      {fb?.rationale && (
                        <p className="mt-2 pt-2 border-t border-slate-200 text-[10px] leading-4 text-brand-text-mute">
                          {fb.rationale}
                        </p>
                      )}
                      {fb?.key_observations && fb.key_observations.length > 0 && (
                        <ul className="mt-1.5 space-y-0.5">
                          {fb.key_observations.slice(0, 3).map((o, i) => (
                            <li key={i} className="text-[10px] leading-4 text-brand-text-mute pl-2 relative">
                              <span className="absolute left-0">·</span>{o}
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })()}

        {/* Certificate of Progress */}
        {(isSE || current_band !== null) && (
          <div className="mb-10">
            <div className="border-2 border-brand-teal-200 rounded-xl p-6 bg-brand-teal-50/30">
              <div className="text-center mb-4">
                <div className="text-[10px] font-black uppercase tracking-widest text-brand-teal-400 mb-1">
                  {isSE ? 'Certificate of Participation' : 'Certificate of Progress'}
                </div>
                <div className="w-12 h-0.5 bg-brand-teal-300 mx-auto" />
              </div>
              <p className="text-sm text-brand-text leading-relaxed text-center mb-4">
                This report certifies that <strong>{student.name}</strong> has actively engaged in structured{' '}
                {isSE ? 'Spoken English practice' : 'IELTS preparation'} through the TestCrack platform. The scores and
                statistics presented reflect genuine performance data captured during the preparation period.
              </p>
              <div className="text-center mb-6">
                {isSE ? (
                  <div className="flex flex-col items-center gap-2">
                    <span className="text-sm text-brand-text-mute">{disp.headlineLabel}: </span>
                    <CefrBadge label={speakingCefrLabel} size="sm" />
                  </div>
                ) : (
                  <>
                    <span className="text-sm text-brand-text-mute">Current IELTS Band Estimate: </span>
                    <span className={`text-lg font-black ${bandColor(current_band)}`}>{current_band}</span>
                  </>
                )}
              </div>
              <div className="border-t border-brand-teal-200 pt-4">
                <div className="text-xs text-brand-text-mute mb-2">Instructor Verification:</div>
                <div className="relative w-56">
                  {instructorName && (
                    <div className="text-sm font-semibold text-brand-text pb-1 font-serif italic">
                      {instructorName}
                    </div>
                  )}
                  <div className="border-b border-slate-400" />
                  {instructorName && (
                    <div className="text-[10px] text-brand-text-mute mt-0.5">{instructorName}</div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="border-t border-brand-line pt-6 mt-auto">
          <p className="text-xs text-brand-text-mute mb-0.5">
            This report was generated by TestCrack {isSE ? 'Spoken English Practice Platform' : 'IELTS Preparation Platform'}.
          </p>
          <p className="text-xs text-brand-text-mute mb-0.5">
            Data reflects live performance as of report generation time.
          </p>
          <p className="text-xs text-brand-text-mute mb-0.5 font-mono">
            Report ID: {reportId}
          </p>
          <p className="text-xs text-brand-text-mute">
            Confidential — For institutional use only.
          </p>
        </div>
      </div>
    </div>,
    document.body
  );
}
