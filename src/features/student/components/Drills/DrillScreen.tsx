﻿import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { StudentSidebar } from '../dashboard/StudentSidebar';
import { StudentTopbar } from '../dashboard/StudentTopbar';
import McqDrill from './McqDrill';
import type { McqDrillResult } from './McqDrill';
import DrillResultCard from './DrillResultCard';
import { callBackend } from '@/features/auth/services/authClient';
import { useMomentum } from '@/features/student/Context/MomentumContext';
import { ArrowLeft, Target, Loader2, AlertTriangle } from 'lucide-react';

interface DrillAnswer {
  points: number;
  questionId?: string;
  selectedAnswer?: string;
}

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
  const [drillSessionId, setDrillSessionId]           = useState<string | null>(null);

  const pendingCompleteRef = useRef<{ answers: Record<string, string>; correctCount: number } | null>(null);

  const totalPrompts = prompts.length || QUESTIONS_PER_SESSION;

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

          // Already fully completed â€” jump straight to result card
          if (sess.status === 'DRILL_DONE' || sess.status === 'APPLY_DONE') {
            setDrillSessionId(sess.id);
            setSessionId(sess.id);
            setMomentumScore(sess.momentum_earned ?? 0);
            setCorrectAnswersCount(sess.correct_answers ?? 0);
            setIsComplete(true);
            return;
          }

          // STARTED â€” resume from where we left off
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

        // No active session â€” start a new one
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
      } catch (err) {
        console.error('Failed to initialize drill session', err);
        setPrompts([]);
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

  const completeSession = async (finalAnswers: Record<string, string>, finalCorrectCount: number) => {
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

  return (
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-slate-950 transition-colors duration-300">
      <StudentSidebar activeTab="dashboard" isCollapsed={isSidebarCollapsed} toggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)} />

      <div className={`transition-all duration-300 ${isSidebarCollapsed ? 'lg:pl-20' : 'lg:pl-64'} flex flex-col min-h-screen`}>
        <StudentTopbar onUpgradeClick={() => {}} />

        <main className="flex-1 p-6 max-w-4xl mx-auto w-full animate-in fade-in">
          <button onClick={() => navigate('/student/dashboard', { state: isComplete ? { drillCompleted: true } : undefined })} className="flex items-center text-slate-500 hover:text-slate-800 dark:hover:text-white mb-6 transition-colors">
            <ArrowLeft className="w-4 h-4 mr-2" /> Back to Dashboard
          </button>

          {loading || isSubmitting ? (
            <div className="flex flex-col items-center justify-center py-20 text-slate-400">
              <Loader2 className="w-10 h-10 animate-spin mb-4 text-[#7B61FF]" />
              <p className="font-medium text-slate-500">
                {isSubmitting ? 'Saving session results...' : 'Loading your customized drills...'}
              </p>
            </div>
          ) : submitFailed ? (
            <div className="flex flex-col items-center justify-center py-20 bg-white dark:bg-slate-900 rounded-3xl border border-red-200 dark:border-red-900 text-center px-8">
              <AlertTriangle className="w-12 h-12 text-red-400 mb-4" />
              <h2 className="text-xl font-bold text-slate-800 dark:text-white mb-2">Couldn't save your results</h2>
              <p className="text-slate-500 mb-6 max-w-sm">Your answers are safe — tap Retry to save your session and claim your momentum points.</p>
              <button
                onClick={() => {
                  const pending = pendingCompleteRef.current;
                  if (pending) completeSession(pending.answers, pending.correctCount);
                }}
                className="px-6 py-3 bg-[#7B61FF] hover:bg-[#6A50EE] text-white font-semibold rounded-2xl transition-colors"
              >
                Retry
              </button>
            </div>
          ) : prompts.length === 0 ? (
            <div className="text-center py-20 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800">
              <p className="text-slate-500 font-medium">No drills available for this topic right now.</p>
            </div>
          ) : !isComplete ? (
            <>
              {/* Header */}
              <div className="mb-8 text-center space-y-2">
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-rose-100 text-rose-500 mb-2">
                  <Target className="w-6 h-6" />
                </div>
                <h1 className="text-3xl font-black text-slate-800 dark:text-white capitalize">
                  Today's Focus: {skill.toLowerCase()} {subSkill.toLowerCase().replace(/_/g, ' ')}
                </h1>
                <p className="text-slate-500 font-medium tracking-wide uppercase text-sm">
                  Prompt {currentPromptIndex + 1} of {totalPrompts}
                </p>
                <div className="flex justify-center items-center gap-2 mt-4">
                  <span className="text-xs font-bold text-amber-500 uppercase tracking-widest">Progress</span>
                  <div className="w-32 h-2 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
                    <div className="h-full bg-amber-500 transition-all duration-500" style={{ width: `${(currentPromptIndex / totalPrompts) * 100}%` }} />
                  </div>
                </div>
              </div>

              {/* Drill content */}
              <div className="bg-white dark:bg-slate-900 rounded-3xl p-8 shadow-sm border border-slate-200 dark:border-slate-800">
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