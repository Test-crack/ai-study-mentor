import { useEffect, useState, useCallback } from 'react';
import { BookOpen, Mic, PenLine, Loader2, AlertTriangle } from 'lucide-react';
import { cn } from '@/shared/utils';
import {
  fetchReadingHistory, fetchSpeakingHistory, fetchWritingHistory,
  type ReadingPracticeSession, type ReadingSummary,
  type SpeakingPracticeSession, type SpeakingSummary,
  type WritingPracticeSession, type WritingSummary,
  type PracticeHistoryScope,
} from '@/features/instructor/services/practiceHistoryService';

type Skill = 'reading' | 'speaking' | 'writing';

const SKILLS: Array<{ id: Skill; label: string; icon: React.ReactNode }> = [
  { id: 'reading',  label: 'Reading',  icon: <BookOpen className="h-3.5 w-3.5" /> },
  { id: 'speaking', label: 'Speaking', icon: <Mic      className="h-3.5 w-3.5" /> },
  { id: 'writing',  label: 'Writing',  icon: <PenLine  className="h-3.5 w-3.5" /> },
];

const fmtDate = (iso: string) =>
  new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });

/** Rounds for display without inventing precision the source doesn't have. */
const n1 = (v: number | null | undefined) => (v == null ? '—' : v.toFixed(1));
const n0 = (v: number | null | undefined) => (v == null ? '—' : Math.round(v).toString());

function StatTile({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="rounded-2xl bg-white border border-brand-line p-4 shadow-sm">
      <p className="font-jetbrains text-[10px] font-bold uppercase tracking-wider text-brand-text-mute mb-1">
        {label}
      </p>
      <p className="text-2xl font-black tabular-nums text-brand-text">{value}</p>
      {hint && <p className="text-[10px] text-brand-text-mute mt-1">{hint}</p>}
    </div>
  );
}

function Empty({ skill }: { skill: Skill }) {
  return (
    <div className="rounded-2xl border border-brand-line bg-brand-bg-alt p-10 text-center">
      <p className="font-semibold text-brand-text">No {skill} practice yet</p>
      <p className="text-sm text-brand-text-mute mt-1">
        Sessions appear here once this student practises {skill}.
      </p>
    </div>
  );
}

function Failed({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="rounded-2xl border border-rose-200 bg-rose-50 p-6 flex items-start gap-3">
      <AlertTriangle className="h-5 w-5 text-rose-600 shrink-0 mt-0.5" />
      <div>
        <p className="text-sm font-semibold text-rose-900">Couldn&apos;t load this practice history</p>
        <p className="text-xs text-rose-800 mt-0.5">
          The request failed — this is not the same as the student having no sessions.
        </p>
        <button onClick={onRetry} className="mt-2 text-xs font-bold underline text-rose-700">Retry</button>
      </div>
    </div>
  );
}

const thCls = 'py-2 px-3 font-bold whitespace-nowrap';
const tdCls = 'py-3 px-3 text-sm text-brand-text-mute tabular-nums';

/**
 * Per-skill practice history for one student.
 *
 * The three endpoints resolve independently via allSettled: a student may have
 * reading sessions but no speaking, and one endpoint failing must not blank the
 * other two. "Failed" and "no sessions" are rendered differently on purpose —
 * telling an instructor a student never practised when the fetch broke is worse
 * than showing nothing.
 */
export function PracticeHistoryTab({ studentId, scope = 'instructor' }: {
  studentId: string;
  /**
   * Which portal's routes to call. The owner and admin portals serve the same
   * payload under institute-scoped authorisation, so this component is shared
   * rather than duplicated per role.
   */
  scope?: PracticeHistoryScope;
}) {
  const [active, setActive] = useState<Skill>('reading');

  const [reading, setReading]   = useState<{ sessions: ReadingPracticeSession[];  summary: ReadingSummary }  | null>(null);
  const [speaking, setSpeaking] = useState<{ sessions: SpeakingPracticeSession[]; summary: SpeakingSummary } | null>(null);
  const [writing, setWriting]   = useState<{ sessions: WritingPracticeSession[];  summary: WritingSummary }  | null>(null);

  const [loading, setLoading] = useState(true);
  const [failed, setFailed]   = useState<Set<Skill>>(new Set());

  const load = useCallback(async () => {
    setLoading(true);
    const results = await Promise.allSettled([
      fetchReadingHistory(studentId, scope),
      fetchSpeakingHistory(studentId, scope),
      fetchWritingHistory(studentId, scope),
    ]);
    const nextFailed = new Set<Skill>();

    if (results[0].status === 'fulfilled') setReading(results[0].value);
    else { nextFailed.add('reading'); console.error('[PracticeHistory] reading:', results[0].reason); }

    if (results[1].status === 'fulfilled') setSpeaking(results[1].value);
    else { nextFailed.add('speaking'); console.error('[PracticeHistory] speaking:', results[1].reason); }

    if (results[2].status === 'fulfilled') setWriting(results[2].value);
    else { nextFailed.add('writing'); console.error('[PracticeHistory] writing:', results[2].reason); }

    setFailed(nextFailed);
    setLoading(false);
  }, [studentId, scope]);

  useEffect(() => { load(); }, [load]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16 gap-3 text-brand-text-mute">
        <Loader2 className="h-5 w-5 animate-spin" />
        <span className="text-sm font-medium">Loading practice history…</span>
      </div>
    );
  }

  const countFor = (s: Skill) =>
    s === 'reading' ? reading?.sessions.length
      : s === 'speaking' ? speaking?.sessions.length
      : writing?.sessions.length;

  return (
    <div className="space-y-5">
      {/* Skill switcher — counts shown so an instructor can see where the
          practice actually is without clicking through all three. */}
      <div className="flex flex-wrap gap-2">
        {SKILLS.map(s => (
          <button
            key={s.id}
            onClick={() => setActive(s.id)}
            className={cn(
              'inline-flex items-center gap-1.5 text-xs font-bold px-3 py-2 rounded-xl border transition-colors',
              active === s.id
                ? 'bg-brand-teal-600 text-white border-brand-teal-600'
                : 'bg-white text-brand-text border-brand-line hover:bg-brand-bg-alt'
            )}
          >
            {s.icon}
            {s.label}
            {failed.has(s.id)
              ? <span className="opacity-70">· !</span>
              : countFor(s.id) != null && <span className="opacity-70">· {countFor(s.id)}</span>}
          </button>
        ))}
      </div>

      {/* ── Reading ── */}
      {active === 'reading' && (
        failed.has('reading') ? <Failed onRetry={load} />
        : !reading || reading.sessions.length === 0 ? <Empty skill="reading" />
        : (
          <>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              <StatTile label="Sessions" value={String(reading.summary.totalSessions)} />
              <StatTile label="Avg WPM" value={n0(reading.summary.avgWpm)} />
              <StatTile label="Avg Accuracy" value={`${n1(reading.summary.avgAccuracy)}%`} />
              <StatTile label="Best Score" value={n1(reading.summary.bestScore)} hint="Speed-learning score" />
            </div>
            <div className="overflow-x-auto rounded-2xl border border-brand-line bg-white shadow-sm">
              <table className="w-full text-left border-collapse min-w-[760px]">
                <thead>
                  <tr className="text-[11px] uppercase tracking-wide text-brand-text-mute border-b border-brand-line">
                    <th className={thCls}>Passage</th>
                    <th className={thCls}>Date</th>
                    <th className={thCls}>WPM</th>
                    <th className={thCls}>Accuracy</th>
                    <th className={thCls}>Retention</th>
                    <th className={thCls}>Correct</th>
                    <th className={thCls}>Grade</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-brand-line">
                  {reading.sessions.map(s => (
                    <tr key={s.id} className="hover:bg-brand-bg-alt/60 transition-colors">
                      <td className="py-3 px-3 text-sm font-semibold text-brand-text max-w-[260px] truncate" title={s.passageTitle}>
                        {s.passageTitle}
                        <span className="block text-[11px] font-normal text-brand-text-mute">{s.category}</span>
                      </td>
                      <td className={tdCls}>{fmtDate(s.createdAt)}</td>
                      <td className={tdCls}>{n0(s.wpm)}</td>
                      <td className={tdCls}>{n1(s.accuracy)}%</td>
                      <td className={tdCls}>{n1(s.retentionScore)}</td>
                      <td className={tdCls}>{s.correctAnswers}/{s.totalQuestions}</td>
                      <td className="py-3 px-3 text-sm font-bold text-brand-text">{s.grade}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )
      )}

      {/* ── Speaking ── */}
      {active === 'speaking' && (
        failed.has('speaking') ? <Failed onRetry={load} />
        : !speaking || speaking.sessions.length === 0 ? <Empty skill="speaking" />
        : (
          <>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              <StatTile label="Sessions" value={String(speaking.summary.totalSessions)} />
              <StatTile label="Avg Fluency" value={n1(speaking.summary.avgFluency)} />
              <StatTile label="Avg WPM" value={n0(speaking.summary.avgWpm)} hint="Weighted" />
              <StatTile label="Best Fluency" value={n1(speaking.summary.bestScore)} />
            </div>
            <div className="overflow-x-auto rounded-2xl border border-brand-line bg-white shadow-sm">
              <table className="w-full text-left border-collapse min-w-[760px]">
                <thead>
                  <tr className="text-[11px] uppercase tracking-wide text-brand-text-mute border-b border-brand-line">
                    <th className={thCls}>Topic</th>
                    <th className={thCls}>Date</th>
                    <th className={thCls}>Fluency</th>
                    <th className={thCls}>WPM</th>
                    <th className={thCls}>Keywords</th>
                    <th className={thCls}>Frequent fillers</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-brand-line">
                  {speaking.sessions.map(s => (
                    <tr key={s.id} className="hover:bg-brand-bg-alt/60 transition-colors">
                      <td className="py-3 px-3 text-sm font-semibold text-brand-text max-w-[240px] truncate" title={s.topicTitle}>
                        {s.topicTitle}
                        <span className="block text-[11px] font-normal text-brand-text-mute">Band {s.bandLevel}</span>
                      </td>
                      <td className={tdCls}>{fmtDate(s.createdAt)}</td>
                      <td className={tdCls}>{n1(s.fluencyScore)}</td>
                      <td className={tdCls}>{n0(s.weightedWpm)}</td>
                      <td className={tdCls}>{s.keywordsHit}/{s.totalKeywords}</td>
                      <td className="py-3 px-3">
                        {s.frequentFillers.length === 0 ? (
                          <span className="text-sm text-brand-text-mute">—</span>
                        ) : (
                          <span className="flex flex-wrap gap-1">
                            {s.frequentFillers.map(f => (
                              <span key={f.word} className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-amber-50 border border-amber-200 text-amber-800">
                                {f.word} ×{f.count}
                              </span>
                            ))}
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )
      )}

      {/* ── Writing ── read-only: AI scoring only, no manual override. */}
      {active === 'writing' && (
        failed.has('writing') ? <Failed onRetry={load} />
        : !writing || writing.sessions.length === 0 ? <Empty skill="writing" />
        : (
          <>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              <StatTile label="Sessions" value={String(writing.summary.totalSessions)} />
              <StatTile label="Avg AI Band" value={n1(writing.summary.avgScore)} />
            </div>
            <div className="overflow-x-auto rounded-2xl border border-brand-line bg-white shadow-sm">
              <table className="w-full text-left border-collapse min-w-[720px]">
                <thead>
                  <tr className="text-[11px] uppercase tracking-wide text-brand-text-mute border-b border-brand-line">
                    <th className={thCls}>Task</th>
                    <th className={thCls}>Date</th>
                    <th className={thCls}>Words</th>
                    <th className={thCls}>AI Band</th>
                    <th className={thCls}>Grammar</th>
                    <th className={thCls}>Vocab</th>
                    <th className={thCls}>Coherence</th>
                    <th className={thCls}>Task Resp.</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-brand-line">
                  {writing.sessions.map(s => (
                    <tr key={s.id} className="hover:bg-brand-bg-alt/60 transition-colors">
                      <td className="py-3 px-3 text-sm font-semibold text-brand-text max-w-[240px] truncate" title={s.IeltsWritingTask?.title ?? ''}>
                        {s.IeltsWritingTask?.title ?? 'Writing task'}
                      </td>
                      <td className={tdCls}>{fmtDate(s.createdAt)}</td>
                      <td className={tdCls}>{s.wordCount}</td>
                      <td className="py-3 px-3 text-sm font-bold text-brand-text">
                        {s.aiBandScore ?? '—'}
                      </td>
                      <td className={tdCls}>{n1(s.aiGrammarScore)}</td>
                      <td className={tdCls}>{n1(s.aiVocabularyScore)}</td>
                      <td className={tdCls}>{n1(s.aiCoherenceScore)}</td>
                      <td className={tdCls}>{n1(s.aiTaskResponseScore)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )
      )}
    </div>
  );
}
