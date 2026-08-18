import { useState } from 'react';
import { Cpu, CheckCircle2, FileSearch, RotateCcw, X } from 'lucide-react';
import { cn } from '@/shared/utils';
import type {
  DiagnosticSkillResult,
  DiagnosticSubScoresLR,
  DiagnosticSubScoresWriting,
  DiagnosticSubScoresSpeaking,
} from './types';

interface Props {
  results:         DiagnosticSkillResult[];
  studentName?:    string;
  // Parent supplies the actual retake call — its endpoint differs by portal
  // (instructor vs. institute-owner vs. institute-admin), so this component
  // stays agnostic to which one is calling. Omit to hide the button entirely.
  onRequestRetake?: () => Promise<void> | void;
}

const SKILL_ORDER = ['LISTENING', 'READING', 'WRITING', 'SPEAKING'];

function bandColorText(b: number): string {
  if (b >= 7.5) return 'text-emerald-600';
  if (b >= 6.0) return 'text-amber-600';
  if (b > 0)    return 'text-rose-600';
  return 'text-brand-text-mute';
}

function bandColorBg(b: number): string {
  if (b >= 7.5) return 'bg-emerald-50 border-emerald-200';
  if (b >= 6.0) return 'bg-amber-50 border-amber-200';
  if (b > 0)    return 'bg-rose-50 border-rose-200';
  return 'bg-brand-bg-alt border-brand-line';
}

function ScoreBar({ label, value, max = 9 }: { label: string; value: number | undefined; max?: number }) {
  if (value === undefined || value === null) return null;
  const pct = Math.min(100, (value / max) * 100);
  return (
    <div className="flex items-center gap-2">
      <span className="text-[11px] text-brand-text-mute w-28 shrink-0 truncate">{label}</span>
      <div className="flex-1 h-1.5 bg-brand-bg-alt rounded-full overflow-hidden">
        <div
          className={cn(
            'h-full rounded-full',
            value >= 7   ? 'bg-emerald-400'
            : value >= 6 ? 'bg-amber-400'
            : 'bg-rose-400'
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
        <span className="text-brand-text-mute">Accuracy</span>
        <span className="font-bold text-brand-text">
          {ss.correct_answers}/{ss.total_questions}
          <span className="ml-1 text-brand-text-mute">({ss.accuracy_percentage}%)</span>
        </span>
      </div>
      {ss.by_question_type && Object.entries(ss.by_question_type).length > 0 && (
        <div className="pt-1 space-y-1 border-t border-brand-line">
          <p className="text-[10px] font-bold text-brand-text-mute font-jetbrains uppercase tracking-wider">By Question Type</p>
          {Object.entries(ss.by_question_type).map(([type, val]) => (
            <div key={type} className="flex items-center justify-between text-xs">
              <span className="text-brand-text-mute capitalize">
                {type.replace(/_/g, ' ')}
              </span>
              <span className="font-semibold text-brand-text">
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
          <span className="text-brand-text-mute">Word Count</span>
          <span className="font-bold text-brand-text">{ss.word_count}</span>
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

// Simple SVG sparkline — no charting library needed, per spec. Needs 2+ points
// to draw a meaningful trend line; a single attempt renders nothing.
function Sparkline({ points }: { points: { created_at: string; band_score: number }[] }) {
  if (points.length < 2) return null;
  const W = 120, H = 32, PAD = 4;
  const bands = points.map(p => p.band_score);
  const min = Math.min(...bands, 4);
  const max = Math.max(...bands, 9);
  const range = max - min || 1;
  const stepX = (W - PAD * 2) / (points.length - 1);
  const coords = points.map((p, i) => {
    const x = PAD + i * stepX;
    const y = H - PAD - ((p.band_score - min) / range) * (H - PAD * 2);
    return [x, y] as const;
  });
  const trendColor = points[points.length - 1].band_score >= points[0].band_score ? '#10B981' : '#F43F5E';

  return (
    <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} className="overflow-visible shrink-0">
      <polyline
        points={coords.map(([x, y]) => `${x},${y}`).join(' ')}
        fill="none"
        stroke={trendColor}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {coords.map(([x, y], i) => (
        <circle key={i} cx={x} cy={y} r="2.5" fill={trendColor} />
      ))}
    </svg>
  );
}

function RetakeConfirmModal({ studentName, onConfirm, onCancel, loading, error }: {
  studentName: string;
  onConfirm:   () => void;
  onCancel:    () => void;
  loading:     boolean;
  error:       string | null;
}) {
  return (
    <div className="fixed inset-0 z-[200] bg-black/40 flex items-center justify-center p-4" onClick={onCancel}>
      <div
        className="bg-white rounded-2xl border border-brand-line shadow-sm max-w-sm w-full p-6"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-start justify-between mb-3">
          <h3 className="text-base font-black text-brand-text">Request Diagnostic Retake?</h3>
          <button onClick={onCancel} className="text-brand-text-mute hover:text-brand-text">
            <X className="h-4 w-4" />
          </button>
        </div>
        <p className="text-sm text-brand-text-mute mb-4">
          This clears <strong className="text-brand-text">{studentName}</strong>'s current diagnostic baseline and lets them take it again. This can't be undone.
        </p>
        {error && (
          <p className="text-xs text-rose-600 font-semibold mb-4">{error}</p>
        )}
        <div className="flex items-center justify-end gap-2">
          <button
            onClick={onCancel}
            disabled={loading}
            className="px-4 py-2 rounded-xl text-sm font-semibold text-brand-text hover:bg-brand-bg-alt transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className="px-4 py-2 rounded-xl text-sm font-bold text-white bg-rose-600 hover:bg-rose-700 disabled:opacity-60 transition-colors"
          >
            {loading ? 'Requesting…' : 'Confirm Retake'}
          </button>
        </div>
      </div>
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
    <div className="rounded-xl border border-brand-teal-100 bg-brand-teal-50/50 p-3 space-y-2.5">
      <div className="flex items-center gap-2">
        <Cpu className="h-3.5 w-3.5 text-brand-teal-500 shrink-0" />
        <p className="text-[10px] font-bold text-brand-teal-600 font-jetbrains uppercase tracking-wider">
          AI Feedback — {skill.charAt(0) + skill.slice(1).toLowerCase()}
        </p>
      </div>
      {items.map(({ label, content }) => (
        <div key={label} className="space-y-0.5">
          {items.length > 1 && (
            <p className="text-[10px] font-bold text-brand-text-mute font-jetbrains uppercase tracking-wider">
              {label}
            </p>
          )}
          {content.map((line, i) => (
            <p key={i} className="text-xs text-brand-text-mute leading-relaxed">{line}</p>
          ))}
        </div>
      ))}
    </div>
  );
}

function SkillCard({ result, history }: { result: DiagnosticSkillResult; history: DiagnosticSkillResult[] }) {
  const skill = result.skill;
  const ss    = result.sub_scores as any;
  const fb    = result.feedback_json;
  const date  = new Date(result.created_at).toLocaleDateString('en-IN', {
    day: 'numeric', month: 'short', year: 'numeric',
  });
  // Earlier attempts for this skill, most recent first — `history` includes the
  // current attempt too, so drop the last (already shown as the card header).
  const pastAttempts = history.slice(0, -1).reverse();

  return (
    <div className={cn('rounded-2xl border p-5 space-y-4', bandColorBg(result.band_score))}>
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-bold text-brand-text-mute font-jetbrains uppercase tracking-wider">
            {skill.charAt(0) + skill.slice(1).toLowerCase()}
          </p>
          <p className="text-[10px] text-brand-text-mute mt-0.5">{date}</p>
        </div>
        <div className="text-right shrink-0">
          <p className={cn('text-3xl font-black leading-none', bandColorText(result.band_score))}>
            {result.band_score.toFixed(1)}
          </p>
          <p className="text-[10px] text-brand-text-mute mt-0.5">Band Score</p>
        </div>
      </div>

      {/* Sub-scores */}
      {ss && (
        <div className="bg-white/70 rounded-xl p-3 space-y-2">
          <p className="text-[10px] font-bold text-brand-text-mute font-jetbrains uppercase tracking-wider mb-2">
            Score Breakdown
          </p>
          {(skill === 'LISTENING' || skill === 'READING') && ss.total_questions !== undefined
            ? <LRSubScores ss={ss as DiagnosticSubScoresLR} />
            : skill === 'WRITING' && ss.grammarScore !== undefined
            ? <WritingSubScores ss={ss as DiagnosticSubScoresWriting} />
            : skill === 'SPEAKING' && (ss.fluencyScore !== undefined || ss.grammarScore !== undefined)
            ? <SpeakingSubScores ss={ss as DiagnosticSubScoresSpeaking} />
            : (
              <p className="text-xs text-brand-text-mute">Score details unavailable.</p>
            )}
        </div>
      )}

      {/* Band over time — only shows once retakes produce more than one attempt */}
      {pastAttempts.length > 0 && (
        <div className="bg-white/70 rounded-xl p-3 space-y-2">
          <div className="flex items-center justify-between gap-3">
            <p className="text-[10px] font-bold text-brand-text-mute font-jetbrains uppercase tracking-wider">Band Over Time</p>
            <Sparkline points={history} />
          </div>
          <div className="space-y-1 pt-1 border-t border-brand-line">
            {pastAttempts.slice(0, 4).map((h, i) => (
              <div key={i} className="flex items-center justify-between text-xs">
                <span className="text-brand-text-mute">
                  {new Date(h.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                </span>
                <span className={cn('font-bold', bandColorText(h.band_score))}>{h.band_score.toFixed(1)}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Content assessment (speaking) — only render if it's a plain string */}
      {ss?.content_assessment && typeof ss.content_assessment === 'string' && (
        <div className="bg-white/70 rounded-xl p-3">
          <p className="text-[10px] font-bold text-brand-text-mute font-jetbrains uppercase tracking-wider mb-1">
            Content Assessment
          </p>
          <p className="text-xs text-brand-text-mute leading-relaxed">
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

export function DiagnosticTab({ results, studentName, onRequestRetake }: Props) {
  const [retakeOpen,    setRetakeOpen]    = useState(false);
  const [retakeLoading, setRetakeLoading] = useState(false);
  const [retakeError,   setRetakeError]   = useState<string | null>(null);

  const handleRetakeConfirm = async () => {
    if (!onRequestRetake) return;
    setRetakeLoading(true);
    setRetakeError(null);
    try {
      await onRequestRetake();
      setRetakeOpen(false);
    } catch (e: any) {
      setRetakeError(e?.message ?? 'Failed to request retake.');
    } finally {
      setRetakeLoading(false);
    }
  };

  if (results.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-brand-line p-12 text-center space-y-3">
        <FileSearch className="h-8 w-8 text-brand-text-mute mx-auto" />
        <p className="text-brand-text-mute text-sm">No diagnostic results yet.</p>
        <p className="text-brand-text-mute text-xs">
          The student has not completed the diagnostic assessment.
        </p>
      </div>
    );
  }

  // Group by skill and sort each skill's attempts oldest → newest, so the
  // last entry per group is always the "current" result shown on the card,
  // and everything before it is history for the timeline/sparkline.
  const bySkill = new Map<string, DiagnosticSkillResult[]>();
  for (const r of results) {
    const list = bySkill.get(r.skill) ?? [];
    list.push(r);
    bySkill.set(r.skill, list);
  }
  for (const list of bySkill.values()) {
    list.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
  }

  const latestPerSkill = SKILL_ORDER
    .filter(s => bySkill.has(s))
    .map(s => bySkill.get(s)![bySkill.get(s)!.length - 1]);

  const avgBand = latestPerSkill.length > 0
    ? (latestPerSkill.reduce((s, r) => s + r.band_score, 0) / latestPerSkill.length).toFixed(1)
    : null;

  const diagnosed = new Set(latestPerSkill.map(r => r.skill));
  const pending = SKILL_ORDER.filter(s => !diagnosed.has(s));

  return (
    <div className="space-y-5">
      {/* Summary strip */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {[
          {
            label: 'Skills Diagnosed',
            value: `${latestPerSkill.length} / 4`,
            cls: latestPerSkill.length === 4
              ? 'text-emerald-600'
              : 'text-amber-600',
          },
          {
            label: 'Avg Baseline Band',
            value: avgBand ?? '—',
            cls: 'text-brand-teal-600',
          },
          {
            label: 'Completed',
            value: new Date(latestPerSkill[latestPerSkill.length - 1]?.created_at ?? '').toLocaleDateString('en-IN', {
              day: 'numeric', month: 'short', year: 'numeric',
            }),
            cls: 'text-brand-text',
          },
        ].map(c => (
          <div
            key={c.label}
            className="bg-white rounded-xl border border-brand-line p-3 text-center"
          >
            <p className="text-[10px] font-bold text-brand-text-mute font-jetbrains uppercase tracking-wider">{c.label}</p>
            <p className={cn('text-xl font-black mt-1', c.cls)}>{c.value}</p>
          </div>
        ))}
      </div>

      {/* Pending skills notice + retake request */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        {pending.length > 0 ? (
          <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 text-xs text-amber-700">
            <span className="font-bold">Pending: </span>
            {pending.map(s => s.charAt(0) + s.slice(1).toLowerCase()).join(', ')} not yet diagnosed.
          </div>
        ) : <div />}

        {onRequestRetake && (
          <button
            onClick={() => { setRetakeError(null); setRetakeOpen(true); }}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold text-brand-text-mute hover:text-rose-600 border border-brand-line hover:border-rose-200 transition-colors"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            Request Retake
          </button>
        )}
      </div>

      {/* Skill cards grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {latestPerSkill.map(r => (
          <SkillCard key={r.skill} result={r} history={bySkill.get(r.skill) ?? [r]} />
        ))}
      </div>

      {retakeOpen && (
        <RetakeConfirmModal
          studentName={studentName || 'this student'}
          loading={retakeLoading}
          error={retakeError}
          onConfirm={handleRetakeConfirm}
          onCancel={() => { if (!retakeLoading) setRetakeOpen(false); }}
        />
      )}
    </div>
  );
}
