import { Cpu, CheckCircle2, FileSearch } from 'lucide-react';
import { cn } from '@/shared/utils';
import type {
  DiagnosticSkillResult,
  DiagnosticSubScoresLR,
  DiagnosticSubScoresWriting,
  DiagnosticSubScoresSpeaking,
} from './types';

interface Props {
  results: DiagnosticSkillResult[];
}

const SKILL_ORDER = ['LISTENING', 'READING', 'WRITING', 'SPEAKING'];

function bandColorText(b: number): string {
  if (b >= 7.5) return 'text-emerald-600 dark:text-emerald-400';
  if (b >= 6.0) return 'text-amber-600 dark:text-amber-400';
  if (b > 0)    return 'text-rose-600 dark:text-rose-400';
  return 'text-slate-400';
}

function bandColorBg(b: number): string {
  if (b >= 7.5) return 'bg-emerald-50 dark:bg-emerald-500/10 border-emerald-200 dark:border-emerald-500/30';
  if (b >= 6.0) return 'bg-amber-50 dark:bg-amber-500/10 border-amber-200 dark:border-amber-500/30';
  if (b > 0)    return 'bg-rose-50 dark:bg-rose-500/10 border-rose-200 dark:border-rose-500/30';
  return 'bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800';
}

function ScoreBar({ label, value, max = 9 }: { label: string; value: number | undefined; max?: number }) {
  if (value === undefined || value === null) return null;
  const pct = Math.min(100, (value / max) * 100);
  return (
    <div className="flex items-center gap-2">
      <span className="text-[11px] text-slate-500 dark:text-slate-400 w-28 shrink-0 truncate">{label}</span>
      <div className="flex-1 h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
        <div
          className={cn(
            'h-full rounded-full',
            value >= 7   ? 'bg-emerald-400 dark:bg-emerald-500'
            : value >= 6 ? 'bg-amber-400 dark:bg-amber-500'
            : 'bg-rose-400 dark:bg-rose-500'
          )}
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className={cn('text-xs font-bold w-8 text-right shrink-0', bandColorText(value))}>
        {value.toFixed(1)}
      </span>
    </div>
  );
}

function LRSubScores({ ss }: { ss: DiagnosticSubScoresLR }) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-xs">
        <span className="text-slate-500 dark:text-slate-400">Accuracy</span>
        <span className="font-bold text-slate-700 dark:text-slate-300">
          {ss.correct_answers}/{ss.total_questions}
          <span className="ml-1 text-slate-400">({ss.accuracy_percentage}%)</span>
        </span>
      </div>
      {ss.by_question_type && Object.entries(ss.by_question_type).length > 0 && (
        <div className="pt-1 space-y-1 border-t border-slate-100 dark:border-slate-800">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">By Question Type</p>
          {Object.entries(ss.by_question_type).map(([type, val]) => (
            <div key={type} className="flex items-center justify-between text-xs">
              <span className="text-slate-500 dark:text-slate-400 capitalize">
                {type.replace(/_/g, ' ')}
              </span>
              <span className="font-semibold text-slate-600 dark:text-slate-300">
                {val.correct}/{val.total}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function WritingSubScores({ ss }: { ss: DiagnosticSubScoresWriting }) {
  return (
    <div className="space-y-1.5">
      {ss.word_count !== undefined && (
        <div className="flex items-center justify-between text-xs mb-1">
          <span className="text-slate-500 dark:text-slate-400">Word Count</span>
          <span className="font-bold text-slate-700 dark:text-slate-300">{ss.word_count}</span>
        </div>
      )}
      <ScoreBar label="Task Response"  value={ss.taskResponseScore} />
      <ScoreBar label="Coherence"      value={ss.coherenceScore} />
      <ScoreBar label="Grammar"        value={ss.grammarScore} />
      <ScoreBar label="Vocabulary"     value={ss.vocabularyScore} />
    </div>
  );
}

function SpeakingSubScores({ ss }: { ss: DiagnosticSubScoresSpeaking }) {
  return (
    <div className="space-y-1.5">
      <ScoreBar label="Fluency"        value={ss.fluencyScore} />
      <ScoreBar label="Vocabulary"     value={ss.vocabularyScore} />
      <ScoreBar label="Grammar"        value={ss.grammarScore} />
      <ScoreBar label="Pronunciation"  value={ss.pronunciationScore} />
    </div>
  );
}

function formatKey(k: string): string {
  return k.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
}

// Renders any feedback object regardless of shape.
// Handles: flat string values, nested objects (one level), string arrays.
function FeedbackBlock({ skill, data }: { skill: string; data: Record<string, any> }) {
  // Collect renderable items from the data object
  const items: Array<{ label: string; content: string[] }> = [];

  for (const [key, val] of Object.entries(data)) {
    if (val === null || val === undefined) continue;
    if (typeof val === 'string' && val.trim()) {
      items.push({ label: formatKey(key), content: [val.trim()] });
    } else if (Array.isArray(val)) {
      const strs = val.filter(v => typeof v === 'string' && v.trim()).map(v => v.trim());
      if (strs.length) items.push({ label: formatKey(key), content: strs });
    } else if (typeof val === 'object') {
      // Flatten one level of nested object
      const strs: string[] = Object.values(val)
        .filter(v => typeof v === 'string' && (v as string).trim())
        .map(v => (v as string).trim());
      if (strs.length) items.push({ label: formatKey(key), content: strs });
    }
  }

  if (items.length === 0) return null;

  return (
    <div className="rounded-xl border border-indigo-100 dark:border-indigo-500/20 bg-indigo-50/50 dark:bg-indigo-500/5 p-3 space-y-2.5">
      <div className="flex items-center gap-2">
        <Cpu className="h-3.5 w-3.5 text-indigo-500 shrink-0" />
        <p className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider">
          AI Feedback — {skill.charAt(0) + skill.slice(1).toLowerCase()}
        </p>
      </div>
      {items.map(({ label, content }) => (
        <div key={label} className="space-y-0.5">
          {items.length > 1 && (
            <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              {label}
            </p>
          )}
          {content.map((line, i) => (
            <p key={i} className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">{line}</p>
          ))}
        </div>
      ))}
    </div>
  );
}

function SkillCard({ result }: { result: DiagnosticSkillResult }) {
  const skill = result.skill;
  const ss    = result.sub_scores as any;
  const fb    = result.feedback_json;
  const date  = new Date(result.created_at).toLocaleDateString('en-IN', {
    day: 'numeric', month: 'short', year: 'numeric',
  });

  return (
    <div className={cn('rounded-2xl border p-5 space-y-4', bandColorBg(result.band_score))}>
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
            {skill.charAt(0) + skill.slice(1).toLowerCase()}
          </p>
          <p className="text-[10px] text-slate-400 mt-0.5">{date}</p>
        </div>
        <div className="text-right shrink-0">
          <p className={cn('text-3xl font-black leading-none', bandColorText(result.band_score))}>
            {result.band_score.toFixed(1)}
          </p>
          <p className="text-[10px] text-slate-400 mt-0.5">Band Score</p>
        </div>
      </div>

      {/* Sub-scores */}
      {ss && (
        <div className="bg-white/70 dark:bg-slate-900/50 rounded-xl p-3 space-y-2">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">
            Score Breakdown
          </p>
          {(skill === 'LISTENING' || skill === 'READING') && ss.total_questions !== undefined
            ? <LRSubScores ss={ss as DiagnosticSubScoresLR} />
            : skill === 'WRITING' && ss.grammarScore !== undefined
            ? <WritingSubScores ss={ss as DiagnosticSubScoresWriting} />
            : skill === 'SPEAKING' && (ss.fluencyScore !== undefined || ss.grammarScore !== undefined)
            ? <SpeakingSubScores ss={ss as DiagnosticSubScoresSpeaking} />
            : (
              <p className="text-xs text-slate-400">Score details unavailable.</p>
            )}
        </div>
      )}

      {/* Content assessment (speaking) — only render if it's a plain string */}
      {ss?.content_assessment && typeof ss.content_assessment === 'string' && (
        <div className="bg-white/70 dark:bg-slate-900/50 rounded-xl p-3">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
            Content Assessment
          </p>
          <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
            {ss.content_assessment}
          </p>
        </div>
      )}

      {/* AI feedback — prefer feedback_json; fall back to ss.feedback if it's a non-empty object/string */}
      {(() => {
        const feedbackData: Record<string, any> | null =
          fb && typeof fb === 'object' && Object.keys(fb).length > 0 ? fb as Record<string, any>
          : ss?.feedback && typeof ss.feedback === 'object' && Object.keys(ss.feedback).length > 0 ? ss.feedback
          : ss?.feedback && typeof ss.feedback === 'string' && ss.feedback.trim() ? { feedback: ss.feedback }
          : null;
        return feedbackData ? <FeedbackBlock skill={skill} data={feedbackData} /> : null;
      })()}
    </div>
  );
}

export function DiagnosticTab({ results }: Props) {
  if (results.length === 0) {
    return (
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-12 text-center space-y-3">
        <FileSearch className="h-8 w-8 text-slate-300 dark:text-slate-600 mx-auto" />
        <p className="text-slate-400 text-sm">No diagnostic results yet.</p>
        <p className="text-slate-300 dark:text-slate-600 text-xs">
          The student has not completed the diagnostic assessment.
        </p>
      </div>
    );
  }

  const sorted = [...results].sort(
    (a, b) => SKILL_ORDER.indexOf(a.skill) - SKILL_ORDER.indexOf(b.skill)
  );

  const avgBand = results.length > 0
    ? (results.reduce((s, r) => s + r.band_score, 0) / results.length).toFixed(1)
    : null;

  const diagnosed = new Set(results.map(r => r.skill));
  const pending = SKILL_ORDER.filter(s => !diagnosed.has(s));

  return (
    <div className="space-y-5">
      {/* Summary strip */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {[
          {
            label: 'Skills Diagnosed',
            value: `${results.length} / 4`,
            cls: results.length === 4
              ? 'text-emerald-600 dark:text-emerald-400'
              : 'text-amber-600 dark:text-amber-400',
          },
          {
            label: 'Avg Baseline Band',
            value: avgBand ?? '—',
            cls: 'text-indigo-600 dark:text-indigo-400',
          },
          {
            label: 'Completed',
            value: new Date(results[results.length - 1]?.created_at ?? '').toLocaleDateString('en-IN', {
              day: 'numeric', month: 'short', year: 'numeric',
            }),
            cls: 'text-slate-700 dark:text-slate-300',
          },
        ].map(c => (
          <div
            key={c.label}
            className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-3 text-center"
          >
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{c.label}</p>
            <p className={cn('text-xl font-black mt-1', c.cls)}>{c.value}</p>
          </div>
        ))}
      </div>

      {/* Pending skills notice */}
      {pending.length > 0 && (
        <div className="bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/30 rounded-xl px-4 py-3 text-xs text-amber-700 dark:text-amber-400">
          <span className="font-bold">Pending: </span>
          {pending.map(s => s.charAt(0) + s.slice(1).toLowerCase()).join(', ')} not yet diagnosed.
        </div>
      )}

      {/* Skill cards grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {sorted.map(r => <SkillCard key={r.skill} result={r} />)}
      </div>
    </div>
  );
}
