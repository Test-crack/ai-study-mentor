﻿// src/features/student/drills/DrillScreen.tsx
import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { StudentSidebar } from '../dashboard/StudentSidebar';
import { StudentTopbar } from '../dashboard/StudentTopbar';
import McqDrill from './McqDrill';
import type { McqDrillResult } from './McqDrill';
import DrillResultCard from './DrillResultCard';
import { callBackend } from '@/features/auth/services/authClient';
import { useMomentum } from '@/features/student/Context/MomentumContext';
import { ArrowLeft, Headphones, BookOpen, PenLine, Mic, Loader2, AlertTriangle } from 'lucide-react';

interface DrillAnswer {
  points: number;
  questionId?: string;
  selectedAnswer?: string;
}

// ─── Per-skill accent system (presentational only) ──────────────────────────
// teal=Listening · violet=Reading · amber=Writing · rose=Speaking — matches dashboard
const SKILL_ACCENT: Record<string, {
  icon: React.ReactNode; chipBg: string; chipText: string; fill: string; glow: string;
}> = {
  LISTENING: {
    icon: <Headphones className="w-5 h-5" />,
    chipBg: 'bg-sky-100',
    chipText: 'text-sky-600',
    fill: 'bg-sky-500',
    glow: '',
  },
  READING: {
    icon: <BookOpen className="w-5 h-5" />,
    chipBg: 'bg-brand-blue-100',
    chipText: 'text-brand-blue-600',
    fill: 'bg-brand-blue-500',
    glow: '',
  },
  WRITING: {
    icon: <PenLine className="w-5 h-5" />,
    chipBg: 'bg-amber-100',
    chipText: 'text-amber-600',
    fill: 'bg-amber-500',
    glow: '',
  },
  SPEAKING: {
    icon: <Mic className="w-5 h-5" />,
    chipBg: 'bg-rose-100',
    chipText: 'text-rose-600',
    fill: 'bg-rose-500',
    glow: '',
  },
};
const getAccent = (skill: string) => SKILL_ACCENT[skill.toUpperCase()] ?? SKILL_ACCENT.SPEAKING;

const parseCorrectAnswer = (raw: any): string => {
  try {
    const parsed = JSON.parse(String(raw));
    return typeof parsed === 'string' ? parsed.replace(/['"]/g, '') : String(raw).replace(/['"]/g, '');
  } catch {
    return String(raw).replace(/['"]/g, '');
  }
};

const toTitleCase = (s: string) =>
  s.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, c => c.toUpperCase());

const normaliseSubSkillKey = (raw: string): string =>
  raw.toLowerCase().replace(/score|range|resource/g, '').replace(/[^a-z]/g, '');

const toSubSkillLabel = (key: string) =>
  key.replace(/Score/gi, '').replace(/_/g, ' ').replace(/([a-z])([A-Z])/g, '$1 $2').trim()
    .replace(/\b\w/g, c => c.toUpperCase());

const DARK_HERO_GRID: React.CSSProperties = {
  backgroundImage:
    'linear-gradient(rgba(255,255,255,.028) 1px,transparent 1px), linear-gradient(90deg,rgba(255,255,255,.028) 1px,transparent 1px)',
  backgroundSize: '44px 44px',
};

interface QueueEntry {
  name: string;
  skill: string;
  score: number;
  isCurrent: boolean;
}

const BriefStatTile = ({ label, value, color }: { label: string; value: string; color: string }) => (
  <div className="px-6 py-5 bg-white/[0.04] border border-brand-line-16 rounded-[14px] min-w-[150px]">
    <div className="font-jetbrains text-[10px] tracking-[0.12em] text-brand-on-ink-mute/70">{label}</div>
    <div className={`font-jetbrains text-3xl font-bold tracking-tight mt-2 ${color}`}>{value}</div>
  </div>
);

const FocusQueueRow = ({ entry, pos, large }: { entry: QueueEntry; pos: number; large?: boolean }) => (
  <div
    className={`flex items-center gap-3.5 rounded-xl border ${large ? 'py-4 px-[18px]' : 'py-2.5 px-3.5'} ${
      entry.isCurrent ? 'bg-brand-teal-wash border-brand-teal-200' : 'bg-brand-bg-alt/60 border-brand-line'
    }`}
  >
    <span
      className={`font-jetbrains flex-none rounded-[8px] flex items-center justify-center font-bold ${
        large ? 'w-[28px] h-[28px] text-[12px]' : 'w-[22px] h-[22px] text-[10px]'
      } ${entry.isCurrent ? 'bg-brand-teal-600 text-white' : 'bg-white border border-brand-line text-brand-text-mute'}`}
    >
      {pos}
    </span>
    <div className="flex-1 min-w-0">
      <div className={`${large ? 'text-[15px]' : 'text-[13.5px]'} ${entry.isCurrent ? 'font-bold text-brand-text' : 'font-medium text-brand-text-mute'}`}>
        {entry.name}
      </div>
      <div className={`${large ? 'text-[12.5px]' : 'text-[11.5px]'} text-brand-text-mute/70 mt-0.5`}>{toTitleCase(entry.skill)}</div>
    </div>
    <span className={`font-jetbrains font-bold ${large ? 'text-base' : 'text-sm'} ${entry.isCurrent ? 'text-brand-teal-600' : 'text-brand-text-mute'}`}>
      {entry.score.toFixed(1)}
    </span>
  </div>
);

export default function DrillScreen() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { syncMomentum, updateStreak } = useMomentum();
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(true);

  const skill    = searchParams.get('skill')     || 'SPEAKING';
  const subSkill = searchParams.get('sub_skill') || 'PRONUNCIATION';
  const level    = searchParams.get('level')     || 'INTERMEDIATE';
  const isExtra  = searchParams.get('extra')     === 'true';

  const QUESTIONS_PER_SESSION = 5;

  // Session state
  const [sessionId, setSessionId]                   = useState<string | null>(null);
  const [prompts, setPrompts]                       = useState<any[]>([]);
  const [loading, setLoading]                       = useState(true);
  const [currentPromptIndex, setCurrentPromptIndex] = useState(0);
  const [answers, setAnswers]                       = useState<Record<string, string>>({});

  // Scoring state
  const [correctAnswersCount, setCorrectAnswersCount] = useState(0);
  const [momentumScore, setMomentumScore]             = useState(0);
  const [isComplete, setIsComplete]                   = useState(false);
  const [isSubmitting, setIsSubmitting]               = useState(false);
  const [submitFailed, setSubmitFailed]               = useState(false);
  const [initError, setInitError]                     = useState<string | null>(null);
  const [drillSessionId, setDrillSessionId]           = useState<string | null>(null);

  // ── Brief screen (pre-drill overview) — shown once per fresh session, skipped on resume ──
  const [showBrief, setShowBrief]                     = useState(true);
  const [queueEntries, setQueueEntries]               = useState<QueueEntry[]>([]);
  const [currentSubScore, setCurrentSubScore]         = useState<number | null>(null);

  // ── Per-question correctness, in answer order — powers the sidebar tally ──
  const [answerResults, setAnswerResults]             = useState<boolean[]>([]);

  const pendingCompleteRef = useRef<{ answers: Record<string, string>; correctCount: number } | null>(null);

  const totalPrompts = prompts.length || QUESTIONS_PER_SESSION;
  const accent = getAccent(skill);

  useEffect(() => {
    const initSession = async () => {
      try {
        setLoading(true);
        const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:4000';
        const skillUp    = skill.toUpperCase();
        const subSkillUp = subSkill.toUpperCase().replace(/\s+/g, '_');

        // Check for today's active session first (resume support)
        const activeRes = await callBackend(
          `${backendUrl}/api/drills/active?skill=${encodeURIComponent(skillUp)}&sub_skill=${encodeURIComponent(subSkillUp)}`
        );

        if (activeRes.success && activeRes.session) {
          const sess = activeRes.session;

          // Already fully completed — jump straight to result card
          if (sess.status === 'DRILL_DONE' || sess.status === 'APPLY_DONE') {
            setDrillSessionId(sess.id);
            setSessionId(sess.id);
            setMomentumScore(sess.momentum_earned ?? 0);
            setCorrectAnswersCount(sess.correct_answers ?? 0);
            setIsComplete(true);
            setShowBrief(false);
            return;
          }

          // STARTED — resume from where we left off
          const questions: any[] = activeRes.questions || [];
          setSessionId(sess.id);
          setPrompts(questions);

          const savedAnswers = (sess.saved_answers as Record<string, string>) ?? {};
          setAnswers(savedAnswers);

          // Recompute correct count + per-question tally from saved answers + question data
          let resumeCorrect = 0;
          const resumeResults: boolean[] = [];
          for (const q of questions) {
            if (savedAnswers[q.id] === undefined) break; // stop at the first unanswered — preserves order
            const wasCorrect = savedAnswers[q.id] === parseCorrectAnswer(q.correct_answer);
            if (wasCorrect) resumeCorrect++;
            resumeResults.push(wasCorrect);
          }
          setCorrectAnswersCount(resumeCorrect);
          setAnswerResults(resumeResults);
          setCurrentPromptIndex(Object.keys(savedAnswers).length);
          if (Object.keys(savedAnswers).length > 0) setShowBrief(false);
          return;
        }

        // No active session — start a new one
        const startRes = await callBackend(`${backendUrl}/api/drills/start`, {
          method: 'POST',
          body: JSON.stringify({
            skill:            skillUp,
            sub_skill:        subSkillUp,
            level:            level.toUpperCase(),
            is_extra_session: isExtra,
          })
        });

        if (startRes.success) {
          setSessionId(startRes.session_id);
          const questions: any[] = startRes.questions || [];
          setPrompts(questions);

          if (startRes.resume) {
            const savedAnswers = (startRes.saved_answers as Record<string, string>) ?? {};
            setAnswers(savedAnswers);
            let resumeCorrect = 0;
            const resumeResults: boolean[] = [];
            for (const q of questions) {
              if (savedAnswers[q.id] === undefined) break;
              const wasCorrect = savedAnswers[q.id] === parseCorrectAnswer(q.correct_answer);
              if (wasCorrect) resumeCorrect++;
              resumeResults.push(wasCorrect);
            }
            setCorrectAnswersCount(resumeCorrect);
            setAnswerResults(resumeResults);
            setCurrentPromptIndex(Object.keys(savedAnswers).length);
            if (Object.keys(savedAnswers).length > 0) setShowBrief(false);
          }
        } else {
          setPrompts([]);
        }
      } catch (err: any) {
        console.error('Failed to initialize drill session', err);
        setInitError(err?.message || 'Failed to load drill session. Please go back and try again.');
      } finally {
        setLoading(false);
      }
    };

    initSession();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [skill, subSkill, level]);

  // ── Sync the topbar's momentum/streak on load — landing here directly (e.g. an
  // extra drill) otherwise leaves MomentumContext at its unfetched 0/0 default
  // until the drill completes. Same endpoint the dashboard and sidebar already use.
  useEffect(() => {
    const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:4000';
    callBackend(`${backendUrl}/api/student/daily-drill-state`)
      .then((res) => {
        if (res.success) {
          if (res.momentum_score !== undefined) syncMomentum(res.momentum_score);
          if (res.daily_streak   !== undefined) updateStreak(res.daily_streak);
        }
      })
      .catch((err) => console.warn('[DrillScreen] daily-drill-state sync failed:', err));
  }, [syncMomentum, updateStreak]);

  // ── Focus Queue + current sub-score for the Brief screen — reuses the same
  // competency-scores data the dashboard already fetches; display-only, no new logic.
  useEffect(() => {
    const fetchScores = async () => {
      try {
        const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:4000';
        const res = await callBackend(`${backendUrl}/api/student/competency-scores`);
        if (!res.success || !res.data) return;

        const targetSkillUp = skill.toUpperCase();
        const targetSubNorm = normaliseSubSkillKey(subSkill);
        const entries: QueueEntry[] = [];

        for (const rec of res.data) {
          const subs = rec.sub_scores || {};
          for (const [key, val] of Object.entries(subs)) {
            const numVal = Number(val);
            if (isNaN(numVal) || numVal > 9.0) continue;
            const kNorm = normaliseSubSkillKey(key);
            if (kNorm.includes('count') || kNorm.includes('total') || kNorm.includes('correct')) continue;
            entries.push({
              name: toSubSkillLabel(key),
              skill: rec.skill,
              score: numVal,
              isCurrent: rec.skill?.toUpperCase() === targetSkillUp && kNorm === targetSubNorm,
            });
          }
        }

        entries.sort((a, b) => a.score - b.score);
        setQueueEntries(entries.slice(0, 4));
        setCurrentSubScore(entries.find(e => e.isCurrent)?.score ?? null);
      } catch (err) {
        console.warn('[DrillScreen] competency-scores fetch failed:', err);
      }
    };
    fetchScores();
  }, [skill, subSkill]);

  const saveProgress = (currentAnswers: Record<string, string>) => {
    if (!sessionId || Object.keys(currentAnswers).length === 0) return;
    const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:4000';
    callBackend(`${backendUrl}/api/drills/session/${sessionId}/progress`, {
      method: 'PATCH',
      body: JSON.stringify({ answers: currentAnswers })
    }).catch(err => console.warn('[DrillScreen] Progress save failed:', err));
  };

  // ── Lock navigation until the reflection in DrillResultCard is submitted ──
  useEffect(() => {
    const locked = !loading && !initError && (prompts.length > 0 || isComplete);
    if (!locked) return;

    // Trap back button / swipe-back — re-push the current entry on every attempt
    window.history.pushState(null, '', window.location.href);
    const onPopState = () => window.history.pushState(null, '', window.location.href);
    window.addEventListener('popstate', onPopState);

    // Warn on refresh / tab close (delete these 4 lines if unwanted)
    const onBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = '';
    };
    window.addEventListener('beforeunload', onBeforeUnload);

    return () => {
      window.removeEventListener('popstate', onPopState);
      window.removeEventListener('beforeunload', onBeforeUnload);
    };
  }, [loading, initError, prompts.length, isComplete]);

  const completeSession = async (finalAnswers: Record<string, string>, finalCorrectCount: number) => {
    if (isSubmitting) return;
    const earned = 15 + finalCorrectCount * 10;
    setMomentumScore(earned);
    setSubmitFailed(false);
    setIsSubmitting(true);
    pendingCompleteRef.current = { answers: finalAnswers, correctCount: finalCorrectCount };

    try {
      const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:4000';
      const res = await callBackend(`${backendUrl}/api/drills/session/${sessionId}/complete`, {
        method: 'POST',
        body: JSON.stringify({
          answers:          finalAnswers,
          correct_answers:  finalCorrectCount,
          is_extra_session: isExtra,
        })
      });
      if (res.momentum_score !== undefined) syncMomentum(res.momentum_score);
      if (res.daily_streak   !== undefined) updateStreak(res.daily_streak);
      setDrillSessionId(res.data?.id ?? sessionId);
      pendingCompleteRef.current = null;
      setIsComplete(true);
    } catch (err) {
      console.error('Failed to complete drill session', err);
      setSubmitFailed(true);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleNextPrompt = (result: DrillAnswer | McqDrillResult) => {
    const { points, questionId, selectedAnswer } = result as DrillAnswer;
    const isCorrect = points === 10;

    const newAnswers = questionId
      ? { ...answers, [questionId]: selectedAnswer ?? '' }
      : answers;

    const newCorrectCount = isCorrect ? correctAnswersCount + 1 : correctAnswersCount;

    if (isCorrect) setCorrectAnswersCount(prev => prev + 1);
    setAnswerResults(prev => [...prev, isCorrect]);
    if (questionId) {
      setAnswers(newAnswers);
      saveProgress(newAnswers); // fire-and-forget: persists answers to DB after each MCQ
    }

    if (currentPromptIndex < totalPrompts - 1) {
      setCurrentPromptIndex(prev => prev + 1);
    } else {
      completeSession(newAnswers, newCorrectCount);
    }
  };

  const progressPct = (currentPromptIndex / totalPrompts) * 100;

  return (
    <div className="min-h-screen bg-brand-bg font-dm transition-colors duration-500">
      <StudentSidebar activeTab="dashboard" isCollapsed={isSidebarCollapsed} toggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)} />

      <div className={`transition-all duration-300 ${isSidebarCollapsed ? 'lg:pl-20' : 'lg:pl-64'} flex flex-col min-h-screen`}>
        <StudentTopbar onUpgradeClick={() => {}} />

        {/* ── Focus-mode sticky progress strip (only during the active drill) ── */}
        {!showBrief && !loading && !isSubmitting && !initError && !submitFailed && prompts.length > 0 && !isComplete && (
          <div className="sticky top-0 z-30 bg-brand-bg/90 backdrop-blur-md border-b border-brand-line">
            <div className="max-w-4xl mx-auto px-6 py-3">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2 min-w-0">
                  <span className={`grid place-items-center h-7 w-7 rounded-lg shrink-0 ${accent.chipBg} ${accent.chipText}`}>
                    {accent.icon}
                  </span>
                  <span className="font-jetbrains text-[11px] font-bold text-brand-text-mute uppercase tracking-wider capitalize truncate">
                    {skill.toLowerCase()} · {subSkill.toLowerCase().replace(/_/g, ' ')}
                  </span>
                </div>
                <span className="font-jetbrains text-[11px] font-bold text-brand-text-mute tabular-nums shrink-0">
                  {currentPromptIndex + 1} / {totalPrompts}
                </span>
              </div>
              <div className="h-1.5 w-full bg-brand-bg-alt rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-500 ease-out ${accent.fill}`}
                  style={{ width: `${progressPct}%` }}
                />
              </div>
            </div>
          </div>
        )}

        <main className="flex-1 p-6 max-w-5xl mx-auto w-full animate-in fade-in">


          {showBrief && !isComplete && !initError ? (
            <div className="min-h-[calc(100vh-180px)] flex items-center justify-center">
            <div className="grid grid-cols-1 lg:grid-cols-[1.3fr_0.7fr] gap-4 items-stretch w-full">
              <section
                className="relative overflow-hidden rounded-3xl bg-brand-ink-deep p-10 sm:p-14 flex flex-col justify-center min-h-[440px]"
                style={DARK_HERO_GRID}
              >
                <div className="relative z-10">
                  <div className="flex items-center gap-3 mb-5">
                    <span className="h-px w-8 bg-brand-mint" aria-hidden="true" />
                    <span className="font-jetbrains text-[11.5px] font-medium uppercase tracking-[0.16em] text-brand-mint">
                      {isExtra ? 'Extra Drill' : 'Priority Drill'} · {totalPrompts} Questions
                    </span>
                  </div>
                  <h1 className="font-dm text-[32px] sm:text-[42px] leading-[1.1] font-bold text-white mb-4">
                    {toTitleCase(skill)} · {toTitleCase(subSkill)}
                  </h1>
                  <p className="text-[16px] sm:text-[17px] leading-[1.65] text-brand-on-ink-mute max-w-xl mb-9">
                    This is your lowest sub-score right now. {totalPrompts} questions, and every answer moves the number you see below.
                  </p>
                  <div className="flex gap-3.5 flex-wrap mb-9">
                    <BriefStatTile
                      label="CURRENT SUB-SCORE"
                      value={currentSubScore !== null ? currentSubScore.toFixed(1) : '—'}
                      color="text-amber-400"
                    />
                    <BriefStatTile label="QUESTIONS" value={String(totalPrompts)} color="text-white" />
                    <BriefStatTile label="ON A CLEAN RUN" value={`+${15 + totalPrompts * 10}`} color="text-brand-mint" />
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowBrief(false)}
                    className="px-8 py-4 bg-brand-mint hover:bg-brand-teal-300 text-brand-ink-deep text-[16px] font-bold rounded-xl transition-colors flex items-center gap-2"
                  >
                    Start drill <span>→</span>
                  </button>
                </div>
              </section>

              {queueEntries.length > 0 && (
                <section className="bg-white border border-brand-line rounded-[18px] p-8 flex flex-col min-h-[440px]">
                  <span className="font-jetbrains text-[11px] font-medium uppercase tracking-[0.16em] text-brand-text-mute">
                    Focus Queue · Round Robin
                  </span>
                  <p className="text-[14.5px] leading-[1.65] text-brand-text-mute mt-4 mb-6">
                    Your weakest sub-scores, cycled in order. Today's drill takes the top of the queue.
                  </p>
                  <div className="flex flex-col gap-2.5 flex-1 justify-center">
                    {queueEntries.map((entry, i) => (
                      <FocusQueueRow key={`${entry.skill}-${entry.name}`} entry={entry} pos={i + 1} large />
                    ))}
                  </div>
                </section>
              )}
            </div>
            </div>
          ) : loading || isSubmitting ? (
            <div className="flex flex-col items-center justify-center py-20 text-brand-text-mute">
              <Loader2 className="w-10 h-10 animate-spin mb-4 text-brand-mint" />
              <p className="font-medium text-brand-text-mute">
                {isSubmitting ? 'Saving session results...' : 'Loading your customized drills...'}
              </p>
            </div>
          ) : initError ? (
            <div className="flex flex-col items-center justify-center py-20 bg-white rounded-3xl border border-rose-200 text-center px-8 shadow-sm">
              <div className="h-14 w-14 rounded-2xl bg-rose-50 flex items-center justify-center mb-4">
                <AlertTriangle className="w-7 h-7 text-rose-400" />
              </div>
              <h2 className="text-xl font-bold text-brand-text mb-2">Couldn't load your drill</h2>
              <p className="text-brand-text-mute mb-1 max-w-sm text-sm">{initError}</p>
            </div>
          ) : submitFailed ? (
            <div className="flex flex-col items-center justify-center py-20 bg-white rounded-3xl border border-rose-200 text-center px-8 shadow-sm">
              <div className="h-14 w-14 rounded-2xl bg-rose-50 flex items-center justify-center mb-4">
                <AlertTriangle className="w-7 h-7 text-rose-400" />
              </div>
              <h2 className="text-xl font-bold text-brand-text mb-2">Couldn't save your results</h2>
              <p className="text-brand-text-mute mb-6 max-w-sm">Your answers are safe — tap Retry to save your session and claim your momentum points.</p>
              <button
                onClick={() => {
                  const pending = pendingCompleteRef.current;
                  if (pending) completeSession(pending.answers, pending.correctCount);
                }}
                className="px-6 py-3 bg-brand-teal-700 hover:bg-brand-teal-600 text-white font-semibold rounded-2xl transition-colors shadow-sm"
              >
                Retry
              </button>
            </div>
          ) : prompts.length === 0 && !isComplete ? (
            <div className="text-center py-20 bg-white rounded-3xl border border-brand-line shadow-sm">
              <p className="text-brand-text-mute font-medium">No drills available for this topic right now.</p>
            </div>
          ) : !isComplete ? (
            (() => {
              const earnedSoFar = correctAnswersCount * 10;
              const comboRun = (() => {
                let c = 0;
                for (let i = answerResults.length - 1; i >= 0; i--) {
                  if (answerResults[i]) c++; else break;
                }
                return c;
              })();
              const subScorePct = currentSubScore !== null ? Math.min(100, Math.max(0, (currentSubScore / 9) * 100)) : 0;

              return (
                <div className="grid grid-cols-1 lg:grid-cols-[1fr_268px] gap-3.5 items-start">
                  <div className="min-w-0">
                    {/* Calmer header — single line, accent chip */}
                    <div className="mb-6 flex items-center gap-3">
                      <div className={`inline-flex items-center justify-center w-11 h-11 rounded-2xl shrink-0 ${accent.chipBg} ${accent.chipText} ${accent.glow}`}>
                        {accent.icon}
                      </div>
                      <div className="min-w-0">
                        <h1 className="font-dm text-lg sm:text-xl font-bold text-brand-text capitalize leading-tight truncate">
                          {skill.toLowerCase()} {subSkill.toLowerCase().replace(/_/g, ' ')}
                        </h1>
                        <p className="font-jetbrains text-[10.5px] text-brand-text-mute font-medium uppercase tracking-[0.14em]">
                          Today's Focus · Prompt {currentPromptIndex + 1} of {totalPrompts}
                        </p>
                      </div>
                    </div>

                    {/* Drill content — keyed wrapper animates each prompt in */}
                    <div
                      key={currentPromptIndex}
                      className="bg-white rounded-[20px] p-6 sm:p-8 shadow-sm border border-brand-line animate-in fade-in slide-in-from-bottom-3 duration-300"
                    >
                      {(() => {
                        const currentPrompt = prompts[currentPromptIndex];
                        if (!currentPrompt) return null;

                        if (currentPrompt.drill_type === 'MCQ') {
                          return <McqDrill prompt={currentPrompt} onComplete={(result) => handleNextPrompt(result)} />;
                        }

                        return (
                          <div className="text-center py-10 text-brand-text-mute font-medium">
                            This question type is not supported in the current flow.
                          </div>
                        );
                      })()}
                    </div>
                  </div>

                  {/* ── Sidebar: earned-so-far tally + the sub-score this drill affects ── */}
                  <div className="flex flex-col gap-3 min-w-0">
                    <div
                      className="relative overflow-hidden rounded-2xl bg-brand-ink-deep p-5"
                      style={DARK_HERO_GRID}
                    >
                      <div className="relative z-10">
                        <span className="font-jetbrains text-[9.5px] font-medium uppercase tracking-[0.14em] text-brand-on-ink-mute">
                          Earned This Drill
                        </span>
                        <div className="flex items-end gap-2 mt-3">
                          <span className="font-jetbrains text-4xl font-bold text-brand-mint leading-none">{earnedSoFar}</span>
                          <span className="text-[12.5px] text-brand-on-ink-mute pb-0.5">momentum</span>
                        </div>
                        <div className="flex gap-[5px] mt-[18px]">
                          {Array.from({ length: totalPrompts }).map((_, i) => {
                            const result = i < answerResults.length ? answerResults[i] : undefined;
                            const isCurrent = i === answerResults.length;
                            const bg =
                              result === true ? 'bg-brand-mint text-brand-ink-deep'
                              : result === false ? 'bg-brand-warm-danger text-white'
                              : isCurrent ? 'bg-white text-brand-ink-deep'
                              : 'bg-white/10 text-brand-on-ink-mute/60';
                            return (
                              <div
                                key={i}
                                className={`flex-1 h-[30px] rounded-lg flex items-center justify-center font-jetbrains text-xs font-bold ${bg}`}
                              >
                                {result === true ? '✓' : result === false ? '×' : i + 1}
                              </div>
                            );
                          })}
                        </div>
                        <div
                          className={`mt-4 px-3 py-2.5 rounded-lg text-center font-jetbrains text-[10px] font-bold tracking-[0.11em] ${
                            comboRun >= 2 ? 'bg-brand-mint/15 text-brand-mint' : 'bg-white/5 text-brand-on-ink-mute/50'
                          }`}
                        >
                          {comboRun >= 2 ? `🔥 ${comboRun} IN A ROW` : 'ANSWER TO BUILD A RUN'}
                        </div>
                      </div>
                    </div>

                    <div className="bg-white border border-brand-line rounded-2xl p-5">
                      <span className="font-jetbrains text-[9.5px] font-medium uppercase tracking-[0.14em] text-brand-text-mute">
                        Sub-score In Play
                      </span>
                      <div className="flex items-baseline gap-2.5 mt-3">
                        <span className="font-jetbrains text-[28px] font-bold text-brand-text leading-none tracking-tight">
                          {currentSubScore !== null ? currentSubScore.toFixed(1) : '—'}
                        </span>
                        <span className="text-[13px] text-brand-text-mute capitalize">
                          {skill.toLowerCase()} · {toSubSkillLabel(subSkill)}
                        </span>
                      </div>
                      <div className="h-[5px] bg-brand-bg-alt rounded-full mt-3.5 overflow-hidden">
                        <div className={`h-full rounded-full ${accent.fill}`} style={{ width: `${subScorePct}%` }} />
                      </div>
                      <p className="text-[12.5px] leading-[1.6] text-brand-text-mute/80 mt-3">
                        A clean run here moves your sub-score up and pushes {toSubSkillLabel(subSkill)} down the focus queue.
                      </p>
                    </div>
                  </div>
                </div>
              );
            })()
          ) : (
            <DrillResultCard
              skill={skill}
              subSkill={subSkill}
              momentumScore={momentumScore}
              feedback={[]}
              answerResults={answerResults}
              drillSessionId={drillSessionId}
              onUnlockNext={() => navigate('/student/dashboard', { state: { drillCompleted: true } })}
            />
          )}
        </main>
      </div>
    </div>
  );
}