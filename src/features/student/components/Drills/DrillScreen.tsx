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
    chipBg: 'bg-teal-100 dark:bg-teal-500/15',
    chipText: 'text-teal-600 dark:text-teal-400',
    fill: 'bg-teal-500',
    glow: 'dark:shadow-[0_0_18px_rgba(20,184,166,0.18)]',
  },
  READING: {
    icon: <BookOpen className="w-5 h-5" />,
    chipBg: 'bg-violet-100 dark:bg-violet-500/15',
    chipText: 'text-violet-600 dark:text-violet-400',
    fill: 'bg-violet-500',
    glow: 'dark:shadow-[0_0_18px_rgba(139,92,246,0.18)]',
  },
  WRITING: {
    icon: <PenLine className="w-5 h-5" />,
    chipBg: 'bg-amber-100 dark:bg-amber-500/15',
    chipText: 'text-amber-600 dark:text-amber-400',
    fill: 'bg-amber-500',
    glow: 'dark:shadow-[0_0_18px_rgba(245,158,11,0.16)]',
  },
  SPEAKING: {
    icon: <Mic className="w-5 h-5" />,
    chipBg: 'bg-rose-100 dark:bg-rose-500/15',
    chipText: 'text-rose-600 dark:text-rose-400',
    fill: 'bg-rose-500',
    glow: 'dark:shadow-[0_0_18px_rgba(244,63,94,0.16)]',
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
            return;
          }

          // STARTED — resume from where we left off
          const questions: any[] = activeRes.questions || [];
          setSessionId(sess.id);
          setPrompts(questions);

          const savedAnswers = (sess.saved_answers as Record<string, string>) ?? {};
          setAnswers(savedAnswers);

          // Recompute correct count from saved answers + question data
          let resumeCorrect = 0;
          for (const q of questions) {
            if (savedAnswers[q.id]) {
              if (savedAnswers[q.id] === parseCorrectAnswer(q.correct_answer)) resumeCorrect++;
            }
          }
          setCorrectAnswersCount(resumeCorrect);
          setCurrentPromptIndex(Object.keys(savedAnswers).length);
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
            for (const q of questions) {
              if (savedAnswers[q.id] && savedAnswers[q.id] === parseCorrectAnswer(q.correct_answer)) resumeCorrect++;
            }
            setCorrectAnswersCount(resumeCorrect);
            setCurrentPromptIndex(Object.keys(savedAnswers).length);
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
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-[#020617] transition-colors duration-500">
      <StudentSidebar activeTab="dashboard" isCollapsed={isSidebarCollapsed} toggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)} />

      <div className={`transition-all duration-300 ${isSidebarCollapsed ? 'lg:pl-20' : 'lg:pl-64'} flex flex-col min-h-screen`}>
        <StudentTopbar onUpgradeClick={() => {}} />

        {/* ── Focus-mode sticky progress strip (only during the active drill) ── */}
        {!loading && !isSubmitting && !initError && !submitFailed && prompts.length > 0 && !isComplete && (
          <div className="sticky top-0 z-30 bg-[#F8FAFC]/90 dark:bg-[#020617]/90 backdrop-blur-md border-b border-slate-100 dark:border-white/[0.05]">
            <div className="max-w-4xl mx-auto px-6 py-3">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2 min-w-0">
                  <span className={`grid place-items-center h-7 w-7 rounded-lg shrink-0 ${accent.chipBg} ${accent.chipText}`}>
                    {accent.icon}
                  </span>
                  <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 capitalize truncate">
                    {skill.toLowerCase()} · {subSkill.toLowerCase().replace(/_/g, ' ')}
                  </span>
                </div>
                <span className="text-[11px] font-bold text-slate-400 dark:text-slate-500 tabular-nums shrink-0">
                  {currentPromptIndex + 1} / {totalPrompts}
                </span>
              </div>
              <div className="h-1.5 w-full bg-slate-200 dark:bg-white/[0.06] rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-500 ease-out ${accent.fill}`}
                  style={{ width: `${progressPct}%` }}
                />
              </div>
            </div>
          </div>
        )}

        <main className="flex-1 p-6 max-w-4xl mx-auto w-full animate-in fade-in">
         

          {loading || isSubmitting ? (
            <div className="flex flex-col items-center justify-center py-20 text-slate-400">
              <Loader2 className="w-10 h-10 animate-spin mb-4 text-indigo-500" />
              <p className="font-medium text-slate-500 dark:text-slate-400">
                {isSubmitting ? 'Saving session results...' : 'Loading your customized drills...'}
              </p>
            </div>
          ) : initError ? (
            <div className="flex flex-col items-center justify-center py-20 bg-white dark:bg-slate-900/60 rounded-3xl border border-rose-200 dark:border-rose-500/20 text-center px-8 shadow-sm">
              <div className="h-14 w-14 rounded-2xl bg-rose-50 dark:bg-rose-500/10 flex items-center justify-center mb-4">
                <AlertTriangle className="w-7 h-7 text-rose-400" />
              </div>
              <h2 className="text-xl font-bold text-slate-800 dark:text-white mb-2">Couldn't load your drill</h2>
              <p className="text-slate-500 dark:text-slate-400 mb-1 max-w-sm text-sm">{initError}</p>
            </div>
          ) : submitFailed ? (
            <div className="flex flex-col items-center justify-center py-20 bg-white dark:bg-slate-900/60 rounded-3xl border border-rose-200 dark:border-rose-500/20 text-center px-8 shadow-sm">
              <div className="h-14 w-14 rounded-2xl bg-rose-50 dark:bg-rose-500/10 flex items-center justify-center mb-4">
                <AlertTriangle className="w-7 h-7 text-rose-400" />
              </div>
              <h2 className="text-xl font-bold text-slate-800 dark:text-white mb-2">Couldn't save your results</h2>
              <p className="text-slate-500 dark:text-slate-400 mb-6 max-w-sm">Your answers are safe — tap Retry to save your session and claim your momentum points.</p>
              <button
                onClick={() => {
                  const pending = pendingCompleteRef.current;
                  if (pending) completeSession(pending.answers, pending.correctCount);
                }}
                className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-2xl transition-colors shadow-md"
              >
                Retry
              </button>
            </div>
          ) : prompts.length === 0 && !isComplete ? (
            <div className="text-center py-20 bg-white dark:bg-slate-900/60 rounded-3xl border border-slate-200 dark:border-white/[0.06] shadow-sm">
              <p className="text-slate-500 dark:text-slate-400 font-medium">No drills available for this topic right now.</p>
            </div>
          ) : !isComplete ? (
            <>
              {/* Calmer header — single line, accent chip */}
              <div className="mb-6 flex items-center gap-3">
                <div className={`inline-flex items-center justify-center w-11 h-11 rounded-2xl shrink-0 ${accent.chipBg} ${accent.chipText} ${accent.glow}`}>
                  {accent.icon}
                </div>
                <div className="min-w-0">
                  <h1 className="text-lg sm:text-xl font-bold text-slate-800 dark:text-white capitalize leading-tight truncate">
                    {skill.toLowerCase()} {subSkill.toLowerCase().replace(/_/g, ' ')}
                  </h1>
                  <p className="text-xs text-slate-400 dark:text-slate-500 font-medium uppercase tracking-wider">
                    Today's Focus · Prompt {currentPromptIndex + 1} of {totalPrompts}
                  </p>
                </div>
              </div>

              {/* Drill content — keyed wrapper animates each prompt in */}
              <div
                key={currentPromptIndex}
                className="bg-white dark:bg-slate-900/60 rounded-3xl p-6 sm:p-8 shadow-sm dark:shadow-none border border-slate-200 dark:border-white/[0.06] animate-in fade-in slide-in-from-bottom-3 duration-300"
              >
                {(() => {
                  const currentPrompt = prompts[currentPromptIndex];
                  if (!currentPrompt) return null;

                  if (currentPrompt.drill_type === 'MCQ') {
                    return <McqDrill prompt={currentPrompt} onComplete={(result) => handleNextPrompt(result)} />;
                  }

                  return (
                    <div className="text-center py-10 text-slate-400 font-medium">
                      This question type is not supported in the current flow.
                    </div>
                  );
                })()}
              </div>
            </>
          ) : (
            <DrillResultCard
              skill={skill}
              subSkill={subSkill}
              momentumScore={momentumScore}
              feedback={[]}
              drillSessionId={drillSessionId}
              onUnlockNext={() => navigate('/student/dashboard', { state: { drillCompleted: true } })}
            />
          )}
        </main>
      </div>
    </div>
  );
}