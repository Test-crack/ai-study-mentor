import { useEffect } from 'react';
import { createPortal } from 'react-dom';

export interface BatchReportData {
  generatedAt: string;
  reportId: string;
  batch: {
    id: string;
    name: string;
    description: string | null;
    institute: { name: string | null };
    studentCount: number;
    instructors: Array<{ name: string | null; email: string }>;
  };
  engagement: {
    active_students: number;
    avg_dcs: number;
    streaks_alive: number;
  };
  at_risk: Array<{
    student_id: string;
    name: string;
    avatar: string | null;
    primary_flag: string;
    flags: string[];
  }>;
  band_overview: Array<{
    student_id: string;
    user_id: string;
    name: string;
    current_band: number | null;
    target_band: number | null;
    gap: number | null;
    band_trend: 'up' | 'flat' | 'down' | null;
    last_ia_date: string | null;
    is_at_risk: boolean;
  }>;
  ia_summary: {
    avg_band: number;
    completion_rate: number;
    high_miss_count: number;
  };
  mock_summary: {
    avg_real_band: number;
    at_or_above_target: number;
    no_mock_yet: number;
  };
  ia_overview: Array<{
    student_id: string;
    name: string;
    ia_completed: number;
    ia_missed: number;
    avg_ia_band: number | null;
    last_ia_date: string | null;
  }>;
  diagnostic_overview: Array<{
    name: string;
    is_diagnosed: boolean;
    baseline_bands: { L: number | null; R: number | null; W: number | null; S: number | null };
    diagnosed_at: string | null;
  }>;
}

interface Props {
  data: BatchReportData;
  onClose: () => void;
}

function bandColor(band: number | null): string {
  if (band === null) return 'text-brand-text-mute';
  if (band >= 7.5) return 'text-emerald-700';
  if (band >= 6.0) return 'text-amber-700';
  return 'text-rose-700';
}

function bandBgColor(band: number | null): string {
  if (band === null) return 'bg-slate-100 text-brand-text-mute';
  if (band >= 7.5) return 'bg-emerald-100 text-emerald-800';
  if (band >= 6.0) return 'bg-amber-100 text-amber-800';
  return 'bg-rose-100 text-rose-800';
}

function gapColor(gap: number | null): string {
  if (gap === null) return 'text-brand-text-mute';
  if (gap <= -2) return 'text-rose-700';
  if (gap <= -1) return 'text-amber-700';
  return 'text-emerald-700';
}

function trendIcon(trend: 'up' | 'flat' | 'down' | null): string {
  if (trend === 'up') return '↑';
  if (trend === 'down') return '↓';
  if (trend === 'flat') return '→';
  return '—';
}

function trendColor(trend: 'up' | 'flat' | 'down' | null): string {
  if (trend === 'up') return 'text-emerald-600';
  if (trend === 'down') return 'text-rose-600';
  return 'text-brand-text-mute';
}

export function BatchReportTemplate({ data, onClose }: Props) {
  useEffect(() => {
    const style = document.createElement('style');
    style.id = 'tc-batch-print-style';
    style.textContent = `
      @media print {
        * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
        body > *:not(#tc-batch-report) { display: none !important; }
        #tc-batch-report { display: block !important; position: static !important; overflow: visible !important; background: white !important; }
        @page { size: A4; margin: 1.5cm; }
      }
    `;
    document.head.appendChild(style);
    return () => {
      const el = document.getElementById('tc-batch-print-style');
      if (el) el.remove();
    };
  }, []);

  const sortedBandOverview = [...data.band_overview].sort((a, b) => {
    const gapA = a.gap ?? 0;
    const gapB = b.gap ?? 0;
    return gapA - gapB;
  });

  const iaMap = new Map(data.ia_overview.map(r => [r.student_id, r]));

  return createPortal(
    <div
      id="tc-batch-report"
      className="fixed inset-0 z-[200] bg-gray-100 overflow-auto print:overflow-visible"
    >
      {/* Toolbar — hidden on print */}
      <div className="print:hidden sticky top-0 z-10 bg-white border-b border-brand-line shadow-sm px-6 py-3 flex items-center justify-between">
        <span className="font-semibold text-brand-text text-sm">Batch Report Preview</span>
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
              <div className="text-brand-text-mute text-xs">IELTS Preparation Platform</div>
            </div>
          </div>
          <div className="text-right">
            <div className="text-[10px] font-black uppercase tracking-widest text-brand-teal-600 mb-0.5">Batch Performance Report</div>
            <div className="text-xs text-brand-text-mute">{data.generatedAt}</div>
            <div className="text-[10px] text-brand-text-mute font-mono">{data.reportId}</div>
          </div>
        </div>

        {/* Batch Info */}
        <div className="mb-8">
          <h1 className="text-2xl font-black text-brand-text mb-1">{data.batch.name}</h1>
          <div className="text-sm text-brand-text-mute flex flex-wrap items-center gap-2">
            {data.batch.institute.name && (
              <span className="font-medium text-brand-text">{data.batch.institute.name}</span>
            )}
            {data.batch.institute.name && <span>·</span>}
            <span>{data.batch.studentCount} students</span>
            {data.batch.description && (
              <>
                <span>·</span>
                <span>{data.batch.description}</span>
              </>
            )}
          </div>
          {data.batch.instructors.length > 0 && (
            <div className="text-xs text-brand-text-mute mt-1">
              Instructors: {data.batch.instructors.map(i => i.name || i.email).join(', ')}
            </div>
          )}
        </div>

        {/* Executive Summary */}
        <div className="mb-8">
          <h2 className="text-xs font-black uppercase tracking-widest text-brand-text-mute mb-3">Executive Summary</h2>
          <div className="grid grid-cols-4 gap-4">
            {[
              { label: 'Total Students', value: data.batch.studentCount, accent: 'bg-brand-teal-500' },
              { label: 'Avg IA Band', value: data.ia_summary.avg_band.toFixed(1), accent: 'bg-emerald-500' },
              { label: 'IA Completion Rate', value: `${data.ia_summary.completion_rate}%`, accent: 'bg-amber-500' },
              { label: 'At-Risk Students', value: data.at_risk.length, accent: 'bg-rose-500' },
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
        </div>

        {/* Engagement Today */}
        <div className="mb-8">
          <h2 className="text-xs font-black uppercase tracking-widest text-brand-text-mute mb-3">Engagement Today</h2>
          <div className="bg-slate-50 rounded-xl border border-brand-line px-6 py-4 flex items-center gap-10">
            {[
              { label: 'Active Students', value: data.engagement.active_students },
              { label: 'Avg DCS', value: data.engagement.avg_dcs.toFixed(1) },
              { label: 'Streaks Alive', value: data.engagement.streaks_alive },
            ].map(stat => (
              <div key={stat.label}>
                <div className="text-xl font-black text-brand-text">{stat.value}</div>
                <div className="text-xs text-brand-text-mute">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Assessment Performance */}
        <div>
          <h2 className="text-xs font-black uppercase tracking-widest text-brand-text-mute mb-3">Assessment Performance</h2>
          <div className="grid grid-cols-2 gap-4">
            {/* IA Summary */}
            <div className="bg-white border border-brand-line rounded-xl p-5">
              <div className="text-xs font-bold text-brand-teal-600 uppercase tracking-wider mb-3">IA Summary</div>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-brand-text-mute">Avg Band</span>
                  <span className="font-bold text-brand-text">{data.ia_summary.avg_band.toFixed(1)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-brand-text-mute">Completion Rate</span>
                  <span className="font-bold text-brand-text">{data.ia_summary.completion_rate}%</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-brand-text-mute">High-Miss Count</span>
                  <span className="font-bold text-rose-700">{data.ia_summary.high_miss_count}</span>
                </div>
              </div>
            </div>
            {/* Mock Summary */}
            <div className="bg-white border border-brand-line rounded-xl p-5">
              <div className="text-xs font-bold text-brand-blue-600 uppercase tracking-wider mb-3">Mock Summary</div>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-brand-text-mute">Avg Real Band</span>
                  <span className="font-bold text-brand-text">{data.mock_summary.avg_real_band.toFixed(1)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-brand-text-mute">At / Above Target</span>
                  <span className="font-bold text-emerald-700">{data.mock_summary.at_or_above_target}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-brand-text-mute">No Mock Yet</span>
                  <span className="font-bold text-amber-700">{data.mock_summary.no_mock_yet}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ===== PAGE 2 ===== */}
      <div className="max-w-[800px] mx-auto bg-white shadow-lg my-8 p-12 print:shadow-none print:my-0 print:p-[1.5cm] print:break-before-page">
        <h2 className="text-lg font-black text-brand-text mb-6">Student Performance Overview</h2>
        <table className="w-full text-xs border-collapse">
          <thead>
            <tr className="bg-slate-50 border-b border-brand-line">
              {['Student', 'Band', 'Target', 'Gap', 'IAs Done', 'Missed', 'Last IA', 'Status'].map(h => (
                <th key={h} className="text-left text-[10px] font-black uppercase tracking-wider text-brand-text-mute px-3 py-2 first:pl-0 last:pr-0">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sortedBandOverview.map((row, i) => {
              const ia = iaMap.get(row.student_id);
              return (
                <tr key={row.user_id} className={i % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'}>
                  <td className="px-3 py-2 pl-0 font-medium text-brand-text">{row.name}</td>
                  <td className={`px-3 py-2 font-bold ${bandColor(row.current_band)}`}>
                    {row.current_band ?? '—'}
                  </td>
                  <td className="px-3 py-2 text-slate-600">{row.target_band ?? '—'}</td>
                  <td className={`px-3 py-2 font-bold ${gapColor(row.gap)}`}>
                    {row.gap !== null ? (row.gap > 0 ? `+${row.gap}` : row.gap) : '—'}
                  </td>
                  <td className="px-3 py-2 text-brand-text">{ia?.ia_completed ?? '—'}</td>
                  <td className="px-3 py-2 text-rose-600">{ia?.ia_missed ?? '—'}</td>
                  <td className="px-3 py-2 text-brand-text-mute">{row.last_ia_date ?? '—'}</td>
                  <td className="px-3 py-2 pr-0">
                    {row.is_at_risk ? (
                      <span className="inline-flex px-2 py-0.5 rounded-full bg-rose-100 text-rose-700 text-[10px] font-bold">
                        At Risk
                      </span>
                    ) : (
                      <span className="inline-flex px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 text-[10px] font-bold">
                        On Track
                      </span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* ===== PAGE 3 ===== */}
      <div className="max-w-[800px] mx-auto bg-white shadow-lg my-8 p-12 print:shadow-none print:my-0 print:p-[1.5cm] print:break-before-page">
        {/* At-Risk Students */}
        <div className="mb-10">
          <h2 className="text-lg font-black text-brand-text mb-4">At-Risk Students</h2>
          {data.at_risk.length > 0 ? (
            <table className="w-full text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-brand-line">
                  {['Name', 'Primary Flag', 'All Flags'].map(h => (
                    <th key={h} className="text-left text-[10px] font-black uppercase tracking-wider text-brand-text-mute px-3 py-2 first:pl-0 last:pr-0">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {data.at_risk.map((s, i) => (
                  <tr key={s.student_id} className={i % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'}>
                    <td className="px-3 py-2 pl-0 font-medium text-brand-text">{s.name}</td>
                    <td className="px-3 py-2">
                      <span className="inline-flex px-2 py-0.5 rounded-full bg-rose-100 text-rose-700 text-[10px] font-semibold">
                        {s.primary_flag}
                      </span>
                    </td>
                    <td className="px-3 py-2 pr-0">
                      <div className="flex flex-wrap gap-1">
                        {s.flags.map(f => (
                          <span key={f} className="inline-flex px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 text-[10px]">
                            {f}
                          </span>
                        ))}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="rounded-xl bg-emerald-50 border border-emerald-200 px-6 py-4 text-sm text-emerald-700 font-medium">
              All students are on track.
            </div>
          )}
        </div>

        {/* Diagnostic Status */}
        <div className="mb-10">
          <h2 className="text-lg font-black text-brand-text mb-4">Diagnostic Status</h2>
          <table className="w-full text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-brand-line">
                {['Name', 'L', 'R', 'W', 'S', 'Status'].map(h => (
                  <th key={h} className="text-left text-[10px] font-black uppercase tracking-wider text-brand-text-mute px-3 py-2 first:pl-0 last:pr-0">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.diagnostic_overview.map((d, i) => (
                <tr key={d.name + i} className={i % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'}>
                  <td className="px-3 py-2 pl-0 font-medium text-brand-text">{d.name}</td>
                  {(['L', 'R', 'W', 'S'] as const).map(skill => {
                    const val = d.baseline_bands[skill];
                    return (
                      <td key={skill} className="px-3 py-2">
                        {val !== null ? (
                          <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold ${bandBgColor(val)}`}>
                            {val}
                          </span>
                        ) : (
                          <span className="text-slate-300">—</span>
                        )}
                      </td>
                    );
                  })}
                  <td className="px-3 py-2 pr-0">
                    {d.is_diagnosed ? (
                      <span className="inline-flex px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 text-[10px] font-bold">
                        Diagnosed
                      </span>
                    ) : (
                      <span className="inline-flex px-2 py-0.5 rounded-full bg-slate-100 text-brand-text-mute text-[10px] font-bold">
                        Pending
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Footer */}
        <div className="border-t border-brand-line pt-6 mt-auto">
          <p className="text-xs text-brand-text-mute mb-0.5">
            This report was generated by TestCrack IELTS Preparation Platform.
          </p>
          <p className="text-xs text-brand-text-mute mb-0.5">
            Data reflects live performance as of report generation time.
          </p>
          <p className="text-xs text-brand-text-mute mb-0.5 font-mono">
            Report ID: {data.reportId}
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
