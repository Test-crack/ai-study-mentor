import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { StudentSidebar } from '../dashboard/StudentSidebar';
import { StudentTopbar } from '../dashboard/StudentTopbar';
import AudioResponseDrill from './AudioResponseDrill';
import ParagraphRepairDrill from './ParagraphRepairDrill';
import DrillResultCard from './DrillResultCard';
import { useMomentum } from "@/features/student/Context/MomentumContext";
import { ArrowLeft, Target } from 'lucide-react';

// ─────────────────────────────────────────────────────────────────────────────
// localStorage schema:
//
// completed_drills_today:  { date, completed: string[], sessionCount: number }
//   → today's drills only. ACTIVELY DELETED when date !== today on mount.
//
// total_drill_sessions:    { count, firstSessionDate, lastSessionDate }
//   → cumulative all-time count. Never resets. Used for IA eligibility.
//
// NOTE: fourth_drill_unlocked and daily limit logic have been removed.
//       There is no cap on drills per day.
// ─────────────────────────────────────────────────────────────────────────────

export default function DrillScreen() {
  const [searchParams] = useSearchParams();
  const navigate       = useNavigate();
  const { addPoints }  = useMomentum();

  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  const skill       = searchParams.get('skill')      || 'Speaking';
  const subSkill    = searchParams.get('sub_skill')  || 'Pronunciation';
  // No Math.min cap — drillNumber can be any positive integer
  const drillNumber = Math.max(1, parseInt(searchParams.get('drillNumber') || '1', 10));

  // ── Drill state ────────────────────────────────────────────────────────────
  const [limitChecked,       setLimitChecked]       = useState(false);
  const [currentPromptIndex, setCurrentPromptIndex] = useState(0);
  const [momentumScore,      setMomentumScore]      = useState(0);
  const [isComplete,         setIsComplete]          = useState(false);

  const totalPrompts = 5;
  const drillType    = skill.toLowerCase() === 'writing' ? 'paragraph_repair' : 'audio_response';

  // ══════════════════════════════════════════════════════════════════════════
  // STALE DATA CLEANUP
  //
  // Actively DELETES stored daily-scoped data when the stored date doesn't
  // match today. This guarantees a fresh start every calendar day.
  // Runs before every limit check so the check always reads clean data.
  // ══════════════════════════════════════════════════════════════════════════
  const cleanupStaleDailyData = useCallback((todayDate: string) => {
    const dailyKeys = [
      'completed_drills_today',
      'fourth_drill_unlocked', // legacy key — safe to clean up
      'drill2_accessed',
      'lexigrid_gate_cleared',
    ];

    dailyKeys.forEach(key => {
      try {
        const stored = localStorage.getItem(key);
        if (stored) {
          const parsed = JSON.parse(stored);
          if (parsed.date && parsed.date !== todayDate) {
            localStorage.removeItem(key);
            console.info(`[DrillScreen] Cleared stale ${key} from`, parsed.date);
          }
        }
      } catch {
        localStorage.removeItem(key);
      }
    });
  }, []);

  // ── Helper: read today's session count (assumes cleanup already ran) ──────
  const getStoredSessionCount = useCallback((todayDate: string): number => {
    try {
      const stored = localStorage.getItem('completed_drills_today');
      if (!stored) return 0;
      const parsed = JSON.parse(stored);
      if (parsed.date !== todayDate) return 0;
      return parsed.sessionCount ?? (parsed.completed?.length || 0);
    } catch { return 0; }
  }, []);

  // ── Initialise: clean stale data and mark ready ────────────────────────────
  // No blocking limit check needed anymore — just clean and proceed.
  const runLimitCheck = useCallback(() => {
    const todayDate = new Date().toISOString().split('T')[0];
    cleanupStaleDailyData(todayDate);
    // getStoredSessionCount kept here in case future logic needs it
    getStoredSessionCount(todayDate);
    setLimitChecked(true);
    window.dispatchEvent(new Event('storage'));
  }, [cleanupStaleDailyData, getStoredSessionCount]);

  // ── STATE RESET + INIT ON DRILL NUMBER CHANGE ────────────────────────────
  useEffect(() => {
    setCurrentPromptIndex(0);
    setMomentumScore(0);
    setIsComplete(false);
    setLimitChecked(false);
    runLimitCheck();
  }, [drillNumber, runLimitCheck]);

  // ── SIDEBAR UNLOCK marker (drill 2 accessed) ──────────────────────────────
  useEffect(() => {
    if (drillNumber !== 2) return;
    const todayDate = new Date().toISOString().split('T')[0];
    localStorage.setItem('drill2_accessed', JSON.stringify({ date: todayDate, accessed: true }));
    window.dispatchEvent(new Event('storage'));
  }, [drillNumber]);

  // ── PROMPTS ───────────────────────────────────────────────────────────────
  const prompts = Array.from({ length: totalPrompts }).map((_, i) => ({
    id:   i + 1,
    text: drillType === 'audio_response'
      ? `Describe a time when you experienced something new. (Prompt ${i + 1})`
      : `Fix the missing linking words in this paragraph. (Prompt ${i + 1})`,
  }));

  // ══════════════════════════════════════════════════════════════════════════
  // HANDLE NEXT PROMPT
  //
  // On LAST prompt, writes localStorage SYNCHRONOUSLY:
  //   1. completed_drills_today  — today's count (routing + display)
  //   2. total_drill_sessions    — cumulative all-time (IA eligibility)
  // ══════════════════════════════════════════════════════════════════════════
  const handleNextPrompt = () => {
    const points = Math.floor(Math.random() * 3) + 4;

    if (currentPromptIndex < totalPrompts - 1) {
      setCurrentPromptIndex(prev => prev + 1);
      setMomentumScore(prev => prev + points);
      return;
    }

    // Last prompt
    const finalScore = momentumScore + points;
    setMomentumScore(finalScore);

    const todayDate = new Date().toISOString().split('T')[0];

    // 1) completed_drills_today
    try {
      const stored = localStorage.getItem('completed_drills_today');
      let completedList: string[]  = [];
      let currentSessionCount      = 0;

      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed.date === todayDate) {
          completedList       = parsed.completed    || [];
          currentSessionCount = parsed.sessionCount ?? completedList.length;
        }
      }

      if (!completedList.includes(subSkill)) completedList.push(subSkill);

      localStorage.setItem('completed_drills_today', JSON.stringify({
        date:         todayDate,
        completed:    completedList,
        sessionCount: currentSessionCount + 1,
      }));
    } catch (e) {
      console.error('[DrillScreen] Failed to write completed_drills_today:', e);
    }

    // 2) total_drill_sessions (cumulative — NEVER resets)
    // TODO (Sarthak): Also POST /api/student/drill-complete so backend tracks DCS.
    try {
      const totalStored = localStorage.getItem('total_drill_sessions');
      let totalData: { count: number; firstSessionDate: string; lastSessionDate: string };

      if (totalStored) {
        const parsed = JSON.parse(totalStored);
        totalData = {
          count:            (parsed.count || 0) + 1,
          firstSessionDate: parsed.firstSessionDate || todayDate,
          lastSessionDate:  todayDate,
        };
      } else {
        totalData = { count: 1, firstSessionDate: todayDate, lastSessionDate: todayDate };
      }

      localStorage.setItem('total_drill_sessions', JSON.stringify(totalData));
    } catch (e) {
      console.error('[DrillScreen] Failed to write total_drill_sessions:', e);
    }

    window.dispatchEvent(new Event('storage'));
    addPoints(finalScore, `Drill ${drillNumber} completed — ${subSkill}`);
    setIsComplete(true);
  };

  // ── POST-DRILL NAVIGATION ─────────────────────────────────────────────────
  // Drill 1 → LexiGrid gate
  // Drill 2 → Drill 3
  // Drill 3+ → next numbered drill (no ceiling)
  const handleUnlockNext = () => {
    const base = `skill=${encodeURIComponent(skill)}&sub_skill=${encodeURIComponent(subSkill)}`;
    if (drillNumber === 1) {
      navigate(`/student/lexigrid?from=drill&${base}`);
    } else if (drillNumber === 2) {
      navigate(`/student/drill?${base}&drillNumber=3`);
    } else {
      navigate(`/student/drill?${base}&drillNumber=${drillNumber + 1}`);
    }
  };

  // ── LOADING ───────────────────────────────────────────────────────────────
  if (!limitChecked) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] dark:bg-slate-950 flex items-center justify-center">
        <div className="animate-pulse text-slate-400 font-medium tracking-wide">Loading...</div>
      </div>
    );
  }

  // ══════════════════════════════════════════════════════════════════════════
  // DRILL SCREEN
  // ══════════════════════════════════════════════════════════════════════════
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

          <button
            onClick={() => navigate(-1)}
            className="flex items-center text-slate-500 hover:text-slate-800 dark:hover:text-white mb-6 transition-colors"
          >
            <ArrowLeft className="w-4 h-4 mr-2" /> Back to Dashboard
          </button>

          {!isComplete ? (
            <>
              <div className="mb-8 text-center space-y-2">
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-rose-100 text-rose-500 mb-2">
                  <Target className="w-6 h-6" />
                </div>

                <div className="flex items-center justify-center gap-2 mb-1 flex-wrap">
                  <span className="bg-indigo-100 text-indigo-600 dark:bg-indigo-500/20 dark:text-indigo-400 font-bold text-xs px-3 py-1 rounded-full uppercase tracking-wider">
                    Drill {drillNumber}
                  </span>
                  {drillNumber === 2 && (
                    <span className="bg-emerald-100 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400 font-bold text-xs px-3 py-1 rounded-full uppercase tracking-wider">
                      Full platform unlocked ✓
                    </span>
                  )}
                </div>

                <h1 className="text-3xl font-black text-slate-800 dark:text-white">
                  {skill} — {subSkill}
                </h1>
                <p className="text-slate-500 font-medium tracking-wide uppercase text-sm">
                  Prompt {currentPromptIndex + 1} of {totalPrompts}
                </p>

                <div className="flex justify-center items-center gap-2 mt-4">
                  <span className="text-xs font-bold text-amber-500 uppercase tracking-widest">Momentum</span>
                  <div className="w-32 h-2 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-amber-500 transition-all duration-500"
                      style={{ width: `${(momentumScore / (totalPrompts * 10)) * 100}%` }}
                    />
                  </div>
                  <span className="text-xs font-bold text-amber-500">{momentumScore}</span>
                </div>
              </div>

              <div className="bg-white dark:bg-slate-900 rounded-3xl p-8 shadow-sm border border-slate-200 dark:border-slate-800">
                {drillType === 'audio_response' && (
                  <AudioResponseDrill prompt={prompts[currentPromptIndex]} onComplete={handleNextPrompt} />
                )}
                {drillType === 'paragraph_repair' && (
                  <ParagraphRepairDrill prompt={prompts[currentPromptIndex]} onComplete={handleNextPrompt} />
                )}
              </div>
            </>
          ) : (
            <DrillResultCard
              skill={skill}
              subSkill={subSkill}
              drillNumber={drillNumber}
              momentumScore={momentumScore}
              feedback={[
                "Good attempt, but watch your syllable stress on 'development'.",
                "Clear intonation, try to maintain a steadier pace.",
                "Great use of linking words here.",
                "A bit hesitant — practice speaking without pausing mid-sentence.",
                "Excellent pronunciation of the target vocabulary.",
              ]}
              onUnlockNext={handleUnlockNext}
            />
          )}
        </main>
      </div>
    </div>
  );
}