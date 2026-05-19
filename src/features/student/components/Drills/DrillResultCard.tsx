import React, { useEffect, useState } from 'react';
import { CheckCircle2, Flame, Zap, MessageSquare, ArrowRight, CalendarClock, Trophy, Loader2, Sparkles, Target } from 'lucide-react';
import { useMomentum } from "@/features/student/Context/MomentumContext"; 
import { callBackend } from '@/features/auth/services/authClient';
import { useNavigate } from 'react-router-dom';

interface ResultCardProps {
  skill: string;
  subSkill: string;
  momentumScore: number;
  feedback: string[];
  onUnlockNext: () => void;
}

export default function DrillResultCard({ skill, subSkill, momentumScore, feedback, onUnlockNext }: ResultCardProps) {
  const { totalMomentum, streak } = useMomentum();
  const navigate = useNavigate();
  const [drillState, setDrillState] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Fetch the student's current milestone state so we can show them what's next
  useEffect(() => {
    const fetchState = async () => {
      try {
        const backendUrl = import.meta.env.VITE_BACKEND_URL || "http://localhost:4000";
        const res = await callBackend(`${backendUrl}/api/student/daily-drill-state`);
        if (res.success) {
          setDrillState(res);
        }
      } catch (err) {
        console.error("Failed to fetch next steps", err);
      } finally {
        setLoading(false);
      }
    };
    fetchState();
  }, []);

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-8">
      
      {/* ─── 1. SCORE SUMMARY ─── */}
      <div className="bg-emerald-500 text-white p-8 rounded-3xl shadow-lg relative overflow-hidden">
        <div className="absolute -top-10 -right-10 w-40 h-40 bg-white/10 rounded-full blur-2xl pointer-events-none" />
        <div className="relative z-10 flex flex-col items-center text-center mb-6">
            <CheckCircle2 className="w-16 h-16 mx-auto mb-4 text-emerald-100" />
            <h2 className="text-3xl font-black mb-2">Drill Complete!</h2>
            <p className="text-emerald-100 font-medium text-lg">You earned +{momentumScore} points.</p>
        </div>
        
        <div className="grid grid-cols-2 gap-4 border-t border-emerald-400/50 pt-6 mt-2 relative z-10">
            <div className="text-center">
                <p className="text-emerald-100 text-xs font-bold uppercase tracking-wider mb-1 flex justify-center items-center gap-1">
                  <Zap className="w-4 h-4"/> Total Momentum
                </p>
                <p className="text-2xl font-black">{totalMomentum}</p>
            </div>
            <div className="text-center border-l border-emerald-400/50">
                <p className="text-emerald-100 text-xs font-bold uppercase tracking-wider mb-1 flex justify-center items-center gap-1">
                  <Flame className="w-4 h-4 text-orange-300"/> Streak
                </p>
                <p className="text-2xl font-black">Day {streak}</p>
            </div>
        </div>
      </div>

      {/* ─── 2. SESSION FEEDBACK ─── */}
      {feedback && feedback.length > 0 && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm">
          <h3 className="text-sm font-bold text-slate-800 dark:text-white uppercase tracking-widest mb-4 flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-blue-500" /> Session Feedback
          </h3>
          <div className="space-y-3">
            {feedback.map((text, i) => (
              <div key={i} className="flex gap-3 text-sm text-slate-700 dark:text-slate-300 bg-slate-50 dark:bg-slate-800/50 p-3.5 rounded-xl">
                <span className="font-bold text-blue-500 shrink-0">Q{i + 1}.</span>
                <p>{text}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ─── 3. WHAT'S NEXT (Dynamic Daily Loop State) ─── */}
      <div className="bg-white dark:bg-slate-900 border-2 border-indigo-100 dark:border-slate-800 rounded-3xl p-6 shadow-sm">
        <h3 className="text-sm font-bold text-indigo-500 uppercase tracking-widest mb-4 flex items-center gap-2">
          <CalendarClock className="w-5 h-5" /> Your Journey
        </h3>

        {loading ? (
          <div className="flex justify-center items-center py-6">
            <Loader2 className="w-6 h-6 animate-spin text-indigo-500" />
          </div>
        ) : (
          <div className="space-y-6">
            
            {/* Conditional Banners Based on Daily Loop State */}
            {drillState?.mock_eligible ? (
              <div className="bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/30 rounded-2xl p-5 flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-amber-900 dark:text-amber-400 flex items-center gap-2">
                    <Trophy className="w-5 h-5" /> Mock Test Unlocked!
                  </h4>
                  <p className="text-sm text-amber-700 dark:text-amber-500 mt-1">You've completed enough IAs. Take your full mock exam.</p>
                </div>
                <button onClick={() => navigate('/student/mock')} className="bg-amber-500 hover:bg-amber-600 text-white px-4 py-2 rounded-xl font-bold text-sm transition-colors">
                  Start Mock
                </button>
              </div>
            ) : drillState?.next_action === 'LEXIGRID' ? (
              <div className="bg-teal-50 dark:bg-teal-500/10 border border-teal-200 dark:border-teal-500/30 rounded-2xl p-5 flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-teal-900 dark:text-teal-400 flex items-center gap-2">
                    <Sparkles className="w-5 h-5" /> LexiGrid Unlocked!
                  </h4>
                  <p className="text-sm text-teal-700 dark:text-teal-500 mt-1">Head to the dashboard to crack today's vocabulary puzzle.</p>
                </div>
              </div>
            ) : drillState?.next_action === 'DRILL_2' ? (
              <div className="bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-200 dark:border-indigo-500/30 rounded-2xl p-5 flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-indigo-900 dark:text-indigo-400 flex items-center gap-2">
                    <Target className="w-5 h-5" /> Drill 2 Unlocked!
                  </h4>
                  <p className="text-sm text-indigo-700 dark:text-indigo-500 mt-1">One more drill left to unlock open practice.</p>
                </div>
              </div>
            ) : drillState?.next_action === 'EXTRA_DRILL_AVAILABLE' || drillState?.next_action === 'DAILY_LIMIT_REACHED' ? (
              <div className="bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/30 rounded-2xl p-5 flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-emerald-900 dark:text-emerald-400 flex items-center gap-2">
                    <CheckCircle2 className="w-5 h-5" /> Daily Loop Complete!
                  </h4>
                  <p className="text-sm text-emerald-700 dark:text-emerald-500 mt-1">The platform is now fully unlocked for open practice.</p>
                </div>
              </div>
            ) : (
              /* Fallback Milestone Tracker */
              <div className="bg-slate-50 dark:bg-slate-800/50 rounded-2xl p-5">
                <p className="text-sm font-bold text-slate-800 dark:text-white mb-3">Progress to next Assessment</p>
                
                {/* Visual Pipeline */}
                <div className="flex items-center justify-between relative mb-2">
                  <div className="absolute left-0 right-0 top-1/2 h-1 bg-slate-200 dark:bg-slate-700 -z-10 -translate-y-1/2 rounded-full" />
                  
                  {/* Step 1: Drills */}
                  <div className="flex flex-col items-center gap-2 bg-slate-50 dark:bg-slate-800 px-2">
                    <div className="w-6 h-6 rounded-full bg-emerald-500 flex items-center justify-center ring-4 ring-slate-50 dark:ring-slate-800">
                      <CheckCircle2 className="w-4 h-4 text-white" />
                    </div>
                    <span className="text-[10px] font-bold text-slate-500 uppercase">Drills</span>
                  </div>

                  {/* Step 2: IA */}
                  <div className="flex flex-col items-center gap-2 bg-slate-50 dark:bg-slate-800 px-2">
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center ring-4 ring-slate-50 dark:ring-slate-800 ${drillState?.next_action === 'IA_READY' ? 'bg-indigo-500' : 'bg-slate-200 dark:bg-slate-700'}`}>
                      <span className="text-xs font-bold text-white">IA</span>
                    </div>
                    <span className="text-[10px] font-bold text-slate-500 uppercase">Assessment</span>
                  </div>

                  {/* Step 3: Mock */}
                  <div className="flex flex-col items-center gap-2 bg-slate-50 dark:bg-slate-800 px-2">
                    <div className="w-6 h-6 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center ring-4 ring-slate-50 dark:ring-slate-800">
                      <Trophy className="w-3 h-3 text-slate-400" />
                    </div>
                    <span className="text-[10px] font-bold text-slate-500 uppercase">Mock</span>
                  </div>
                </div>
              </div>
            )}

            <div className="flex gap-3 pt-2">
              <button 
                onClick={onUnlockNext}
                className="flex-1 py-3.5 bg-indigo-500 text-white font-bold rounded-xl hover:bg-indigo-600 transition-colors shadow-md flex items-center justify-center gap-2"
              >
                Return to Dashboard <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}