import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { StudentSidebar } from '../dashboard/StudentSidebar';
import { StudentTopbar } from '../dashboard/StudentTopbar';
import AudioResponseDrill from './AudioResponseDrill';
import ParagraphRepairDrill from './ParagraphRepairDrill';
import McqDrill from './McqDrill';
import DrillResultCard from './DrillResultCard';
import { callBackend } from '@/features/auth/services/authClient';
import { useMomentum } from '@/features/student/Context/MomentumContext';
import { formatSkillLabel } from '@/shared/utils/formatSkillLabel';
import { ArrowLeft, Target, Loader2 } from 'lucide-react';

export default function DrillScreen() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { syncMomentum, updateStreak, addPoints } = useMomentum();
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  const skill    = searchParams.get('skill')     || 'SPEAKING';
  const subSkill = searchParams.get('sub_skill') || 'PRONUNCIATION';
  const level    = searchParams.get('level')     || 'INTERMEDIATE';
  const isExtra  = searchParams.get('extra')     === 'true';

  // ─── Detect if this is an un-gated replay from the Open Practice sandbox ───
  const isReplayMode = searchParams.get('mode') === 'replay';

  const QUESTIONS_PER_SESSION = 5;

  // Drill State
  const [prompts, setPrompts]                       = useState<any[]>([]);
  const [loading, setLoading]                       = useState(true);
  const [currentPromptIndex, setCurrentPromptIndex] = useState(0);

  // Scoring State
  const [correctAnswersCount, setCorrectAnswersCount] = useState(0);
  const [momentumScore, setMomentumScore]             = useState(0);
  const [isComplete, setIsComplete]                   = useState(false);
  const [isSubmitting, setIsSubmitting]               = useState(false);

  const totalPrompts = prompts.length || QUESTIONS_PER_SESSION;

  useEffect(() => {
    const fetchQuestions = async () => {
      try {
        setLoading(true);
        const backendUrl = import.meta.env.VITE_BACKEND_URL || "http://localhost:4000";
        const url = `${backendUrl}/api/drills/questions?skill=${encodeURIComponent(skill.toUpperCase())}&subskill=${encodeURIComponent(subSkill.toUpperCase().replace(/\s+/g, '_'))}&level=${encodeURIComponent(level.toUpperCase())}`;
        const res = await callBackend(url);
        if (res.success && res.data) {
          setPrompts(res.data);
        } else {
          setPrompts([]);
        }
      } catch (err) {
        console.error('Failed to fetch drills', err);
      } finally {
        setLoading(false);
      }
    };
    fetchQuestions();
  }, [skill, subSkill, level]);

  const saveSessionAndComplete = async (finalCorrectCount: number) => {
    const earned = 15 + finalCorrectCount * 10;
    setMomentumScore(isReplayMode ? Math.round(earned * 0.5) : earned);
    setIsSubmitting(true);

    try {
      const backendUrl = import.meta.env.VITE_BACKEND_URL || "http://localhost:4000";
      const res = await callBackend(`${backendUrl}/api/drills/session`, {
        method: 'POST',
        body: JSON.stringify({
          skill:             skill.toUpperCase(),
          subskill:          subSkill.toUpperCase().replace(/\s+/g, '_'),
          prompts_completed: totalPrompts,
          correct_answers:   finalCorrectCount,
          is_extra_session:  isExtra,
          practice_mode:     isReplayMode,
        }),
      });

      if (isReplayMode) {
        addPoints(earned, 'Replayed Drill', 0.5);
      } else {
        if (res.momentum_score !== undefined) syncMomentum(res.momentum_score);
        if (res.daily_streak   !== undefined) updateStreak(res.daily_streak);
      }
    } catch (err) {
      console.error("Failed to save drill session", err);
    } finally {
      setIsSubmitting(false);
      setIsComplete(true);
    }
  };

  const handleNextPrompt = (pointsEarnedThisPrompt: number = 5) => {
    const isCorrect = pointsEarnedThisPrompt === 10;
    const newCorrectCount = isCorrect ? correctAnswersCount + 1 : correctAnswersCount;
    if (isCorrect) setCorrectAnswersCount(prev => prev + 1);

    if (currentPromptIndex < totalPrompts - 1) {
      setCurrentPromptIndex(prev => prev + 1);
    } else {
      saveSessionAndComplete(newCorrectCount);
    }
  };

  // ── Display labels (formatted) — raw values kept for API/URL params ──
  const skillDisplay    = formatSkillLabel(skill);
  const subSkillDisplay = formatSkillLabel(subSkill);

  return (
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-slate-950 transition-colors duration-300">
      <StudentSidebar
        activeTab="dashboard"
        isCollapsed={isSidebarCollapsed}
        toggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
      />

      <div className={`transition-all duration-300 ${isSidebarCollapsed ? 'lg:pl-20' : 'lg:pl-64'} flex flex-col min-h-screen`}>
        <StudentTopbar onUpgradeClick={() => {}} />

        <main className="flex-1 p-6 max-w-4xl mx-auto w-full animate-in fade-in">
          {/* Back Button */}
          <button
            onClick={() => navigate('/student/dashboard', { state: isComplete ? { drillCompleted: true } : undefined })}
            className="flex items-center text-slate-500 hover:text-slate-800 dark:hover:text-white mb-6 transition-colors"
          >
            <ArrowLeft className="w-4 h-4 mr-2" /> Back to Dashboard
          </button>

          {loading || isSubmitting ? (
            <div className="flex flex-col items-center justify-center py-20 text-slate-400">
              <Loader2 className="w-10 h-10 animate-spin mb-4 text-[#7B61FF]" />
              <p className="font-medium text-slate-500">
                {isSubmitting ? "Saving session results..." : "Loading your customized drills..."}
              </p>
            </div>
          ) : prompts.length === 0 ? (
            <div className="text-center py-20 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800">
              <p className="text-slate-500 font-medium">No drills available for this topic right now.</p>
            </div>
          ) : !isComplete ? (
            <>
              {/* ── Header ── */}
              <div className="mb-8 text-center space-y-2">
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-rose-100 text-rose-500 mb-2">
                  <Target className="w-6 h-6" />
                </div>

                {/* FIX: formatSkillLabel ensures "Grammar Drill" not "grammar Drill"      */}
                {/*      subSkill only in title — skill moved to subtitle, no duplication  */}
                <h1 className="text-3xl font-black text-slate-800 dark:text-white">
                  {isReplayMode ? "Replay: " : isExtra ? "Extra Drill: " : "Today's Focus: "}
                  {subSkillDisplay} Drill
                </h1>
                <p className="text-slate-500 font-medium tracking-wide uppercase text-sm">
                  {skillDisplay} &middot; Prompt {currentPromptIndex + 1} of {totalPrompts}
                </p>

                {/* Progress Bar */}
                <div className="flex justify-center items-center gap-2 mt-4">
                  <span className="text-xs font-bold text-amber-500 uppercase tracking-widest">Progress</span>
                  <div className="w-32 h-2 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-amber-500 transition-all duration-500"
                      style={{ width: `${(currentPromptIndex / totalPrompts) * 100}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* Render Specific Drill Type */}
              <div className="bg-white dark:bg-slate-900 rounded-3xl p-8 shadow-sm border border-slate-200 dark:border-slate-800">
                {(() => {
                  const currentPrompt = prompts[currentPromptIndex];
                  if (!currentPrompt) return null;

                  if (currentPrompt.drill_type === 'MCQ') {
                    return <McqDrill prompt={currentPrompt} onComplete={(pts) => handleNextPrompt(pts)} />;
                  }

                  if (skill.toLowerCase() === 'writing') {
                    return <ParagraphRepairDrill prompt={{ text: currentPrompt.prompt_text || 'Mock Prompt' }} onComplete={() => handleNextPrompt(5)} />;
                  } else {
                    return <AudioResponseDrill prompt={{ text: currentPrompt.prompt_text || 'Mock Prompt' }} onComplete={() => handleNextPrompt(5)} />;
                  }
                })()}
              </div>
            </>
          ) : (
            <DrillResultCard
              skill={skill}
              subSkill={subSkill}
              momentumScore={momentumScore}
              feedback={[]}
              onUnlockNext={() => navigate('/student/dashboard', { state: { drillCompleted: true } })}
            />
          )}
        </main>
      </div>
    </div>
  );
}