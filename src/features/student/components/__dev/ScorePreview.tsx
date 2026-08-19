// src/features/student/components/__dev/ScorePreview.tsx
//
// TEMPORARY REVIEW HARNESS — delete after FE-1 is signed off.
//
// Renders the score-formatter primitive and the migrated widgets against fixed
// mock data, with no API call. Exists because the real surfaces
// (/student/diagnostic/roadmap, /student/assessment-history) currently can't be
// reviewed visually: the roadmap's competency-scores endpoint returns 500 on
// dev, and the route is a placeholder in production.
//
// Route is registered behind `import.meta.env.DEV`, so it cannot ship.

import { useExamConfig } from '@/shared/context/ExamContext';
import { useScoreFormatter, useSkillScoreFormatter } from '@/shared/hooks/useScoreFormatter';
import { EXAM_REGISTRY, REGISTERED_EXAMS } from '@/shared/config/examRegistry';
import {
  SubSkillCoverageCard,
  BestBandPerSkillCard,
  BandOverTimeChart,
} from '@/features/student/components/assessment-history/widgets';
import type { ExamType } from '@/shared/types/exam';

/** The values that actually distinguish the old and new formatters. */
const PROBE_VALUES: Array<number | null> = [null, 0, 4, 5.5, 6, 6.25, 6.75, 7, 8.5, 9];

const MOCK_ROWS = [
  { key: 'listening', label: 'Listening', band: 6.5, colorClass: 'bg-brand-teal-600', icon: null },
  { key: 'reading', label: 'Reading', band: 6.25, colorClass: 'bg-brand-mint', icon: null },
  { key: 'writing', label: 'Writing', band: 5.75, colorClass: 'bg-amber-500', icon: null },
  { key: 'speaking', label: 'Speaking', band: null, colorClass: 'bg-rose-500', icon: null },
] as any;

const MOCK_POINTS = [
  { label: 'Mar', band: 5.5, type: 'diagnostic' },
  { label: 'Apr', band: 6.0, type: 'mock' },
  { label: 'May', band: 6.25, type: 'mock' },
  { label: 'Jun', band: 6.5, type: 'mock' },
] as any;

function EquivalenceTable() {
  const skillScore = useSkillScoreFormatter();
  const score = useScoreFormatter();
  const { activeExam } = useExamConfig();
  const isIelts = activeExam === 'IELTS';

  return (
    <table className="w-full text-sm border-collapse">
      <thead>
        <tr className="text-left border-b border-brand-line">
          <th className="py-2 pr-4 font-jetbrains text-[10px] uppercase tracking-wider">Raw</th>
          <th className="py-2 pr-4 font-jetbrains text-[10px] uppercase tracking-wider">
            Old&nbsp;<code>.toFixed(1)</code>
          </th>
          <th className="py-2 pr-4 font-jetbrains text-[10px] uppercase tracking-wider">
            New skill
          </th>
          <th className="py-2 pr-4 font-jetbrains text-[10px] uppercase tracking-wider">
            New overall
          </th>
          <th className="py-2 font-jetbrains text-[10px] uppercase tracking-wider">Match</th>
        </tr>
      </thead>
      <tbody className="tabular-nums">
        {PROBE_VALUES.map((v, i) => {
          const old = v !== null ? v.toFixed(1) : '—';
          const now = skillScore(v);
          const overall = score(v);
          // Equivalence is only claimed for IELTS — other exams change the scale on purpose.
          const match = !isIelts ? '—' : old === now ? 'same' : 'CHANGED';
          return (
            <tr key={i} className="border-b border-brand-line/40">
              <td className="py-1.5 pr-4">{v === null ? 'null' : v}</td>
              <td className="py-1.5 pr-4 text-brand-text-mute">{old}</td>
              <td className="py-1.5 pr-4 font-bold">{now}</td>
              <td className="py-1.5 pr-4">{overall}</td>
              <td
                className={`py-1.5 font-bold ${
                  match === 'CHANGED' ? 'text-rose-600' : 'text-emerald-600'
                }`}
              >
                {match}
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}

function ExamPanel({ exam }: { exam: ExamType }) {
  const cfg = EXAM_REGISTRY[exam];
  return (
    <section className="rounded-2xl border border-brand-line bg-white p-5 space-y-4">
      <header>
        <p className="font-jetbrains text-[10px] uppercase tracking-[0.15em] text-brand-text-mute">
          {exam}
        </p>
        <h2 className="font-manrope text-lg font-bold text-brand-ink">{cfg.legalDisplayName}</h2>
        <p className="text-[11.5px] text-brand-text-mute mt-1">
          Score label: <strong>{cfg.formatOverall(null).label}</strong> · Skills:{' '}
          {cfg.skills.join(', ')} · Speaking: {cfg.speakingFormat ?? 'none'}
        </p>
        <p className="text-[11px] text-brand-text-mute mt-2 italic">{cfg.legalDisclaimer}</p>
      </header>
      <div className="flex flex-wrap gap-2">
        {PROBE_VALUES.filter(v => v !== null).map((v, i) => (
          <span
            key={i}
            className="text-xs font-bold px-2.5 py-1 rounded-full bg-brand-bg-alt border border-brand-line tabular-nums"
          >
            {v} → {cfg.formatOverall(v as number).display}
          </span>
        ))}
      </div>
    </section>
  );
}

export default function ScorePreview() {
  const { activeExam, setActiveExam, config, showExamSwitcher } = useExamConfig();

  return (
    <div className="min-h-screen bg-brand-bg p-6 space-y-6">
      <header className="space-y-1">
        <p className="font-jetbrains text-[10px] uppercase tracking-[0.15em] text-rose-600">
          Temporary review harness · delete after FE-1 sign-off
        </p>
        <h1 className="font-manrope text-2xl font-black text-brand-ink">Score formatter review</h1>
        <p className="text-sm text-brand-text-mute">
          No API calls. All data below is fixed mock data.
        </p>
      </header>

      {/* Active-exam switch — lets you see the same widgets under a different scale. */}
      <div className="flex items-center gap-2">
        <span className="text-xs font-bold text-brand-text-mute">Active exam:</span>
        {REGISTERED_EXAMS.map(e => (
          <button
            key={e}
            onClick={() => setActiveExam(e)}
            className={`text-xs font-bold px-3 py-1.5 rounded-full border-2 transition-colors ${
              activeExam === e
                ? 'border-brand-teal-600 bg-brand-teal-50 text-brand-teal-700'
                : 'border-brand-line text-brand-text'
            }`}
          >
            {EXAM_REGISTRY[e].shortLabel}
          </button>
        ))}
        <span className="text-[11px] text-brand-text-mute ml-2">
          showExamSwitcher = <strong>{String(showExamSwitcher)}</strong> (real UI hides the picker
          unless &gt;1 exam is active)
        </span>
      </div>

      <section className="rounded-2xl border border-brand-line bg-white p-5">
        <h2 className="font-manrope text-base font-bold text-brand-ink mb-1">
          Old vs new — the equivalence claim
        </h2>
        <p className="text-[12px] text-brand-text-mute mb-3">
          Every migrated call site previously rendered <code>.toFixed(1)</code>. Under IELTS, the
          &ldquo;New skill&rdquo; column must match it exactly. &ldquo;New overall&rdquo; rounds to
          0.5 by design — only the overall band bands.
        </p>
        <EquivalenceTable />
      </section>

      <section className="rounded-2xl border border-brand-line bg-white p-5 space-y-5">
        <h2 className="font-manrope text-base font-bold text-brand-ink">
          Migrated widgets — currently rendering as {config.shortLabel}
        </h2>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          <SubSkillCoverageCard rows={MOCK_ROWS} />
          <BestBandPerSkillCard rows={MOCK_ROWS} />
          <div className="min-h-[220px]">
            <BandOverTimeChart points={MOCK_POINTS} />
          </div>
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="font-manrope text-base font-bold text-brand-ink">
          All three registered exams
        </h2>
        {REGISTERED_EXAMS.map(e => (
          <ExamPanel key={e} exam={e} />
        ))}
      </section>
    </div>
  );
}
