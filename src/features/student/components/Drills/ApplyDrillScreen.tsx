import React, { useEffect, useRef } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { StudentSidebar } from '../dashboard/StudentSidebar';
import { StudentTopbar } from '../dashboard/StudentTopbar';
import { CheckCircle2, Flame, Zap, ArrowRight, Target, Star } from 'lucide-react';
import { useMomentum } from "@/features/student/Context/MomentumContext";

// ─────────────────────────────────────────────────────────────────────────────
// ApplyDrillScreen — Session Complete
//
// Reached after Drill 3 completes (DrillScreen drill 3 → handleUnlockNext).
// Celebrates the session, awards +30 completion bonus, routes to dashboard.
//
// NOTE: With the daily limit removed, this screen is reached after Drill 3
// specifically because DrillResultCard CTA for drill 3 routes here via
// /student/apply-drill. Drills 4+ continue directly to the next drill.
//
// URL params:
//   skill, sub_skill, score  (score = momentum from drill 3)
// ─────────────────────────────────────────────────────────────────────────────

export default function ApplyDrillScreen() {
  const [searchParams] = useSearchParams();
  const navigate        = useNavigate();

  const skill      = searchParams.get('skill')      || 'Speaking';
  const subSkill   = searchParams.get('sub_skill')  || 'Pronunciation';
  const drillScore = parseInt(searchParams.get('score') || '0', 10);

  const { streak, addPoints, totalMomentum } = useMomentum();

  // ── Completion bonus ───────────────────────────────────────────────────────
  // +30 flat for completing the first 3-drill daily loop.
  // Guard ref prevents double-award on React strict-mode double-mount.
  const bonusApplied = useRef(false);

  useEffect(() => {
    if (bonusApplied.current) return;
    bonusApplied.current = true;
    addPoints(30);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const sessionTotal = drillScore + 30;

  return (
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-slate-950 transition-colors duration-300">
      {/* Sidebar stays collapsed on completion screen — no distraction */}
      <StudentSidebar
        activeTab="dashboard"
        isCollapsed={true}
        toggleCollapse={() => {}}
      />

      <div className="transition-all duration-300 lg:pl-20 flex flex-col min-h-screen">
        <StudentTopbar onUpgradeClick={() => {}} />

        <main className="flex-1 p-6 max-w-2xl mx-auto w-full flex items-center justify-center animate-in fade-in">
          <div className="w-full">

            {/* ── Gradient border card ─────────────────────────────────────── */}
            <div className="bg-gradient-to-br from-indigo-500 via-purple-500 to-emerald-500 p-1 rounded-3xl shadow-2xl animate-in zoom-in duration-500">
              <div className="bg-white dark:bg-slate-900 rounded-[22px] p-8 md:p-12 text-center">

                {/* Icon */}
                <div className="w-24 h-24 bg-emerald-100 dark:bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
                  <CheckCircle2 className="w-14 h-14 text-emerald-500" />
                </div>

                {/* Title */}
                <h2 className="text-3xl font-black text-slate-800 dark:text-white mb-2 tracking-tight">
                  3 Drills Done!
                </h2>
                <p className="text-slate-500 font-medium mb-8">
                  Core session complete for{" "}
                  <span className="text-indigo-500 font-bold">{subSkill}</span>.
                  Your streak is secured — keep going or come back tomorrow!
                </p>

                {/* ── Stats Row ───────────────────────────────────────────── */}
                <div className="flex flex-wrap justify-center gap-3 mb-8">

                  <div className="flex items-center gap-3 bg-slate-50 dark:bg-slate-800 px-4 py-3 rounded-2xl border border-slate-100 dark:border-slate-700">
                    <Zap className="w-5 h-5 text-amber-500 fill-amber-500 shrink-0" />
                    <div className="text-left">
                      <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Session Earned</p>
                      <p className="font-black text-slate-700 dark:text-slate-200">+{sessionTotal} pts</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 bg-orange-50 dark:bg-orange-500/10 px-4 py-3 rounded-2xl border border-orange-100 dark:border-orange-500/20">
                    <Flame className="w-5 h-5 text-orange-500 fill-orange-500 shrink-0" />
                    <div className="text-left">
                      <p className="text-[10px] text-orange-400 font-bold uppercase tracking-wider">Streak</p>
                      <p className="font-black text-orange-700 dark:text-orange-400">Day {streak}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 bg-indigo-50 dark:bg-indigo-500/10 px-4 py-3 rounded-2xl border border-indigo-100 dark:border-indigo-500/20">
                    <Target className="w-5 h-5 text-indigo-500 shrink-0" />
                    <div className="text-left">
                      <p className="text-[10px] text-indigo-400 font-bold uppercase tracking-wider">Drills</p>
                      <p className="font-black text-indigo-700 dark:text-indigo-400">3 ✓ (no limit)</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 bg-purple-50 dark:bg-purple-500/10 px-4 py-3 rounded-2xl border border-purple-100 dark:border-purple-500/20">
                    <Star className="w-5 h-5 text-purple-500 fill-purple-500 shrink-0" />
                    <div className="text-left">
                      <p className="text-[10px] text-purple-400 font-bold uppercase tracking-wider">Total Momentum</p>
                      <p className="font-black text-purple-700 dark:text-purple-400">{totalMomentum}</p>
                    </div>
                  </div>

                </div>

                {/* ── What happens next ───────────────────────────────────── */}
                <div className="bg-slate-50 dark:bg-slate-800 rounded-2xl p-5 mb-8 text-left space-y-2">
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">
                    What happens now
                  </p>
                  <div className="flex items-start gap-3 text-sm text-slate-600 dark:text-slate-400">
                    <span className="text-emerald-500 font-bold shrink-0">✓</span>
                    <span>Streak secured — 3 core drills completed today</span>
                  </div>
                  <div className="flex items-start gap-3 text-sm text-slate-600 dark:text-slate-400">
                    <span className="text-emerald-500 font-bold shrink-0">✓</span>
                    <span>DCS updated — your drill scores feed into your next Internal Assessment</span>
                  </div>
                  <div className="flex items-start gap-3 text-sm text-slate-600 dark:text-slate-400">
                    <span className="text-indigo-500 font-bold shrink-0">→</span>
                    <span>
                      No daily limit — continue drilling now, or come back tomorrow for a fresh session.
                    </span>
                  </div>
                </div>

                {/* ── Actions ─────────────────────────────────────────────── */}
                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                  <button
                    onClick={() => navigate(`/student/drill?skill=${encodeURIComponent(skill)}&sub_skill=${encodeURIComponent(subSkill)}&drillNumber=4`)}
                    className="inline-flex items-center justify-center bg-indigo-500 hover:bg-indigo-600 text-white px-6 py-4 rounded-xl font-black hover:scale-105 transition-all shadow-md"
                  >
                    Continue to Drill 4 <ArrowRight className="w-5 h-5 ml-2" />
                  </button>
                  <button
                    onClick={() => navigate('/student/dashboard')}
                    className="inline-flex items-center justify-center bg-slate-800 dark:bg-white text-white dark:text-slate-900 px-6 py-4 rounded-xl font-black hover:scale-105 transition-all shadow-lg"
                  >
                    Back to Dashboard <ArrowRight className="w-5 h-5 ml-2" />
                  </button>
                </div>

              </div>
            </div>

          </div>
        </main>
      </div>
    </div>
  );
}