import { useEffect } from 'react';
import { createPortal } from 'react-dom';
import type { StudentFullProgress } from '../student-progress/types';
import { bandFillPct } from '@/shared/utils/bandScale';

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
  if (band === null) return 'text-slate-400';
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
  if (band === null) return 'bg-slate-100 text-slate-500';
  if (band >= 7.5) return 'bg-emerald-100 text-emerald-800';
  if (band >= 6.0) return 'bg-amber-100 text-amber-800';
  return 'bg-rose-100 text-rose-800';
}

function statusBadge(status: string): string {
  if (status === 'COMPLETED') return 'bg-emerald-100 text-emerald-700';
  if (status === 'MISSED') return 'bg-rose-100 text-rose-700';
  return 'bg-slate-100 text-slate-500';
}

const SKILL_LABELS: Record<string, string> = {
  Listening: 'L',
  Reading: 'R',
  Writing: 'W',
  Speaking: 'S',
};

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
      className="fixed inset-0 z-[200] bg-gray-100 overflow-y-auto"
    >
      {/* Toolbar — hidden on print */}
      <div className="print:hidden sticky top-0 z-10 bg-white border-b border-slate-200 shadow-sm px-6 py-3 flex items-center justify-between">
        <span className="font-semibold text-slate-800 text-sm">Student Report Preview</span>
        <div className="flex items-center gap-3">
          <button
            onClick={() => window.print()}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-700 transition-colors"
          >
            Save as PDF
          </button>
          <button
            onClick={onClose}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-slate-100 text-slate-700 text-sm font-medium hover:bg-slate-200 transition-colors"
          >
            Close
          </button>
        </div>
      </div>

      {/* ===== PAGE 1 ===== */}
      <div className="max-w-[800px] mx-auto bg-white shadow-lg my-8 p-12 print:shadow-none print:my-0 print:p-[1.5cm]">
        {/* Header */}
        <div className="flex items-start justify-between pb-4 border-b-2 border-indigo-600 mb-8">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-md bg-indigo-600 flex items-center justify-center flex-shrink-0">
              <span className="text-white font-black text-sm">TC</span>
            </div>
            <div>
              <div className="font-bold text-slate-900 text-base leading-tight">TestCrack</div>
              <div className="text-slate-500 text-xs">IELTS Preparation Platform</div>
            </div>
          </div>
          <div className="text-right">
            <div className="text-[10px] font-black uppercase tracking-widest text-indigo-600 mb-0.5">Student Progress Report</div>
            <div className="text-xs text-slate-500">{generatedAt}</div>
            <div className="text-[10px] text-slate-400 font-mono">{reportId}</div>
          </div>
        </div>

        {/* Student Info */}
        <div className="flex items-center gap-5 mb-8">
          {student.avatar ? (
            <img
              src={student.avatar}
              alt={student.name}
              className="w-16 h-16 rounded-full object-cover flex-shrink-0 border-2 border-indigo-100"
            />
          ) : (
            <div className="w-16 h-16 rounded-full bg-indigo-600 flex items-center justify-center flex-shrink-0">
              <span className="text-white font-black text-lg">{initials}</span>
            </div>
          )}
          <div>
            <h1 className="text-2xl font-black text-slate-900 mb-0.5">{student.name}</h1>
            <div className="text-sm text-slate-500 mb-0.5">{student.email}</div>
            <div className="text-xs text-slate-400 flex items-center gap-1.5">
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
          <h2 className="text-xs font-black uppercase tracking-widest text-slate-400 mb-3">Progress Overview</h2>

          {/* 4 stat cards */}
          <div className="grid grid-cols-4 gap-4 mb-5">
            {[
              { label: 'Current Band', value: current_band ?? '—', accent: 'bg-indigo-500' },
              { label: 'Target Band', value: target_band ?? '—', accent: 'bg-violet-500' },
              { label: 'Momentum Score', value: momentum_score, accent: 'bg-amber-500' },
              { label: 'Daily Streak', value: `${daily_streak}d`, accent: 'bg-emerald-500' },
            ].map(card => (
              <div key={card.label} className="bg-white border border-slate-200 rounded-xl overflow-hidden">
                <div className={`h-1.5 w-full ${card.accent}`} />
                <div className="p-4">
                  <div className="text-2xl font-black text-slate-900">{card.value}</div>
                  <div className="text-xs text-slate-500 mt-0.5">{card.label}</div>
                </div>
              </div>
            ))}
          </div>

          {/* Band Progress Bar */}
          {current_band !== null && (
            <div className="bg-slate-50 rounded-xl border border-slate-200 p-5 mb-3">
              <div className="relative h-4 bg-slate-200 rounded-full mb-3">
                {/* Current band marker */}
                <div
                  className="absolute top-0 h-full bg-indigo-500 rounded-full"
                  style={{ width: `${bandFillPct(current_band)}%` }}
                />
                {/* Target band marker */}
                {target_band !== null && (
                  <div
                    className="absolute top-0 h-full border-r-2 border-violet-600"
                    style={{ width: `${bandFillPct(target_band)}%` }}
                  />
                )}
              </div>
              <div className="flex justify-between text-xs text-slate-400">
                <span>0</span>
                {[1,2,3,4,5,6,7,8,9].map(n => (
                  <span key={n}>{n}</span>
                ))}
              </div>
              <div className="flex items-center gap-4 mt-3 text-xs">
                <span className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-full bg-indigo-500 inline-block" />
                  <span className="text-slate-600">Current: <strong>{current_band}</strong></span>
                </span>
                {target_band !== null && (
                  <span className="flex items-center gap-1.5">
                    <span className="w-3 h-3 rounded-full bg-violet-500 inline-block" />
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
        </div>

        {/* Skill Breakdown */}
        <div>
          <h2 className="text-xs font-black uppercase tracking-widest text-slate-400 mb-3">Skill Breakdown</h2>
          <div className="space-y-3">
            {skillOrder.map(skill => {
              const row = competency.find(c => c.skill.toUpperCase() === skill.toUpperCase());
              const bandScore = row?.band_score ?? null;
              const short = SKILL_LABELS[skill] ?? skill[0];
              return (
                <div key={skill} className="flex items-center gap-4">
                  <div className="w-24 text-xs font-semibold text-slate-700 flex-shrink-0">
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
                  <div className="w-16 text-right text-xs text-slate-400">
                    Target: {target_band ?? '—'}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* ===== PAGE 2 ===== */}
      <div className="max-w-[800px] mx-auto bg-white shadow-lg my-8 p-12 print:shadow-none print:my-0 print:p-[1.5cm] print:break-before-page">
        {/* IA History */}
        <div className="mb-10">
          <h2 className="text-lg font-black text-slate-900 mb-4">IA History</h2>
          {recentIAs.length > 0 ? (
            <table className="w-full text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200">
                  {['IA #', 'Date', 'Status', 'Sub-Skills', 'Band', 'Momentum'].map(h => (
                    <th key={h} className="text-left text-[10px] font-black uppercase tracking-wider text-slate-400 px-3 py-2 first:pl-0 last:pr-0">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {recentIAs.map((ia, i) => {
                  const avgBand = ia.scores && ia.scores.length > 0
                    ? (ia.scores.reduce((s, sc) => s + sc.band, 0) / ia.scores.length).toFixed(1)
                    : null;
                  return (
                    <tr key={ia.id} className={i % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'}>
                      <td className="px-3 py-2 pl-0 font-bold text-slate-900">#{ia.ia_number}</td>
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
                      <td className={`px-3 py-2 font-bold ${bandColor(avgBand ? parseFloat(avgBand) : null)}`}>
                        {avgBand ?? '—'}
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
            <div className="rounded-xl bg-slate-50 border border-slate-200 px-6 py-4 text-sm text-slate-500">
              No IA sessions yet.
            </div>
          )}
        </div>

        {/* Mock Test History */}
        <div>
          <h2 className="text-lg font-black text-slate-900 mb-4">Mock Test History</h2>
          {mock_sessions.length > 0 ? (
            <table className="w-full text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200">
                  {['Month', 'Attempt Type', 'Status', 'Real Band', 'Momentum'].map(h => (
                    <th key={h} className="text-left text-[10px] font-black uppercase tracking-wider text-slate-400 px-3 py-2 first:pl-0 last:pr-0">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {mock_sessions.map((m, i) => (
                  <tr key={m.id} className={i % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'}>
                    <td className="px-3 py-2 pl-0 text-slate-700">{m.month_year}</td>
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
            <div className="rounded-xl bg-slate-50 border border-slate-200 px-6 py-4 text-sm text-slate-500">
              No mock tests yet.
            </div>
          )}
        </div>
      </div>

      {/* ===== PAGE 3 ===== */}
      <div className="max-w-[800px] mx-auto bg-white shadow-lg my-8 p-12 print:shadow-none print:my-0 print:p-[1.5cm] print:break-before-page">
        {/* Drill Engagement */}
        <div className="mb-10">
          <h2 className="text-xs font-black uppercase tracking-widest text-slate-400 mb-3">Drill Engagement</h2>
          <div className="bg-slate-50 rounded-xl border border-slate-200 px-6 py-4 flex items-center gap-10 flex-wrap">
            {[
              { label: 'Total Drills', value: drill_stats.total_drills_all_time },
              { label: 'Avg DCS', value: drill_stats.avg_dcs_lifetime.toFixed(1) },
              { label: 'Drills Last 14 Days', value: drill_stats.last_14_days.reduce((s, d) => s + d.count, 0) },
              { label: 'Lexigrid Games', value: lexigrid_stats.games_last_14 },
            ].map(stat => (
              <div key={stat.label}>
                <div className="text-xl font-black text-slate-900">{stat.value}</div>
                <div className="text-xs text-slate-500">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Diagnostic Baseline */}
        {diagnostic_results.length > 0 && (
          <div className="mb-10">
            <h2 className="text-xs font-black uppercase tracking-widest text-slate-400 mb-3">Diagnostic Baseline</h2>
            <div className="grid grid-cols-4 gap-4">
              {(['Listening', 'Reading', 'Writing', 'Speaking'] as const).map(skill => {
                const result = diagnostic_results.find(r => r.skill === skill);
                const short = SKILL_LABELS[skill] ?? skill[0];
                return (
                  <div key={skill} className="bg-white border border-slate-200 rounded-xl p-4 text-center">
                    <div className="text-xs font-black uppercase tracking-wider text-slate-400 mb-2">{short}</div>
                    <div className={`text-2xl font-black ${bandColor(result?.band_score ?? null)}`}>
                      {result?.band_score ?? '—'}
                    </div>
                    <div className="text-xs text-slate-500 mt-0.5">{skill}</div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Certificate of Progress */}
        {current_band !== null && (
          <div className="mb-10">
            <div className="border-2 border-indigo-200 rounded-xl p-6 bg-indigo-50/30">
              <div className="text-center mb-4">
                <div className="text-[10px] font-black uppercase tracking-widest text-indigo-400 mb-1">Certificate of Progress</div>
                <div className="w-12 h-0.5 bg-indigo-300 mx-auto" />
              </div>
              <p className="text-sm text-slate-700 leading-relaxed text-center mb-4">
                This report certifies that <strong>{student.name}</strong> has actively engaged in structured IELTS preparation
                through the TestCrack platform. The scores and statistics presented reflect genuine performance data captured
                during the preparation period.
              </p>
              <div className="text-center mb-6">
                <span className="text-sm text-slate-500">Current IELTS Band Estimate: </span>
                <span className={`text-lg font-black ${bandColor(current_band)}`}>{current_band}</span>
              </div>
              <div className="border-t border-indigo-200 pt-4">
                <div className="text-xs text-slate-500 mb-2">Instructor Verification:</div>
                <div className="relative w-56">
                  {instructorName && (
                    <div className="text-sm font-semibold text-slate-800 pb-1 font-serif italic">
                      {instructorName}
                    </div>
                  )}
                  <div className="border-b border-slate-400" />
                  {instructorName && (
                    <div className="text-[10px] text-slate-400 mt-0.5">{instructorName}</div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="border-t border-slate-200 pt-6 mt-auto">
          <p className="text-xs text-slate-500 mb-0.5">
            This report was generated by TestCrack IELTS Preparation Platform.
          </p>
          <p className="text-xs text-slate-400 mb-0.5">
            Data reflects live performance as of report generation time.
          </p>
          <p className="text-xs text-slate-400 mb-0.5 font-mono">
            Report ID: {reportId}
          </p>
          <p className="text-xs text-slate-400">
            Confidential — For institutional use only.
          </p>
        </div>
      </div>
    </div>,
    document.body
  );
}
