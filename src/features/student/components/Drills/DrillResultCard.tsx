import React, { useState, useEffect } from 'react';
import {
  CheckCircle2, PlayCircle, ExternalLink, MessageSquare,
  Flame, Zap, Gamepad2, ArrowRight,
} from 'lucide-react';
import { useMomentum } from "@/features/student/Context/MomentumContext";

interface ResultCardProps {
  skill:         string;
  subSkill:      string;
  drillNumber:   number;   // 1, 2, 3, 4, 5 … no ceiling
  momentumScore: number;
  feedback:      string[];
  onUnlockNext:  () => void;
}

// ── Dynamic CTA config ────────────────────────────────────────────────────────
// Drill 1  → LexiGrid gate (teal)
// Drill 2  → Drill 3, no gate (indigo)
// Drill 3+ → next numbered drill (indigo), no ceiling
const getCTA = (drillNumber: number) => {
  if (drillNumber === 1) {
    return {
      label:    "Play LexiGrid — Unlock Drill 2",
      sublabel: "Solve 5 words to unlock your next drill and the full platform",
      icon:     <Gamepad2 className="w-5 h-5" />,
      color:    "bg-teal-500 hover:bg-teal-600",
    };
  }
  if (drillNumber === 2) {
    return {
      label:    "Start Drill 3",
      sublabel: "No gate — your next drill is ready right now",
      icon:     <ArrowRight className="w-5 h-5" />,
      color:    "bg-indigo-500 hover:bg-indigo-600",
    };
  }
  // Drill 3, 4, 5 … unlimited
  return {
    label:    `Start Drill ${drillNumber + 1}`,
    sublabel: `Drill ${drillNumber} done — keep the momentum going!`,
    icon:     <ArrowRight className="w-5 h-5" />,
    color:    "bg-indigo-500 hover:bg-indigo-600",
  };
};

export default function DrillResultCard({
  skill,
  subSkill,
  drillNumber,
  momentumScore,
  feedback,
  onUnlockNext,
}: ResultCardProps) {
  const { totalMomentum, streak } = useMomentum();

  // ── Video watch gate state ─────────────────────────────────────────────────
  // Watching is optional — the CTA is always available.
  const [videoWatched,    setVideoWatched]    = useState(false);
  const [watchTimer,      setWatchTimer]      = useState(30);
  const [hasClickedWatch, setHasClickedWatch] = useState(false);

  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    if (hasClickedWatch && watchTimer > 0) {
      interval = setInterval(() => setWatchTimer(prev => prev - 1), 1000);
    }
    return () => clearInterval(interval);
  }, [hasClickedWatch, watchTimer]);

  const handleWatchClick = () => {
    setHasClickedWatch(true);
    window.open("https://www.youtube.com", "_blank");
  };

  const cta = getCTA(drillNumber);

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-8">

      {/* ── Score Summary ─────────────────────────────────────────────────── */}
      <div className="bg-emerald-500 text-white p-8 rounded-3xl shadow-lg relative overflow-hidden">
        <div className="pointer-events-none absolute -right-8 -top-8 h-32 w-32 rounded-full bg-white/10 blur-2xl" />
        <div className="pointer-events-none absolute left-0 bottom-0 h-20 w-20 rounded-full bg-emerald-400/20 blur-xl" />

        <div className="relative z-10 flex flex-col items-center text-center mb-6">
          <CheckCircle2 className="w-16 h-16 mx-auto mb-4 opacity-90" />
          <h2 className="text-3xl font-black mb-1">
            Drill {drillNumber} Complete!
          </h2>
          <p className="text-emerald-100 font-medium">{skill} — {subSkill}</p>
          <p className="text-emerald-100 font-medium text-lg mt-2">
            You earned <span className="font-black text-white">+{momentumScore}</span> Momentum points.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-4 border-t border-emerald-400/50 pt-6 relative z-10">
          <div className="text-center">
            <p className="text-emerald-100 text-xs font-bold uppercase tracking-wider mb-1 flex justify-center items-center gap-1">
              <Zap className="w-4 h-4" /> Total Momentum
            </p>
            <p className="text-2xl font-black">{totalMomentum + momentumScore}</p>
          </div>
          <div className="text-center border-l border-emerald-400/50">
            <p className="text-emerald-100 text-xs font-bold uppercase tracking-wider mb-1 flex justify-center items-center gap-1">
              <Flame className="w-4 h-4 text-orange-300" /> Streak
            </p>
            <p className="text-2xl font-black">Day {streak}</p>
          </div>
        </div>
      </div>

      {/* ── Drill Progress Indicator ──────────────────────────────────────── */}
      {/* Simple badge — no hardcoded 1-2-3 steps so it works at any drill # */}
      <div className="flex items-center justify-center gap-3">
        <div className="flex items-center gap-2 bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 px-4 py-2 rounded-full">
          <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          <span className="text-sm font-bold text-emerald-700 dark:text-emerald-400">
            Drill {drillNumber} complete
          </span>
        </div>
        {drillNumber >= 2 && (
          <div className="flex items-center gap-1.5 text-xs text-slate-400 font-medium">
            {Array.from({ length: Math.min(drillNumber, 5) }).map((_, i) => (
              <div
                key={i}
                className="w-2 h-2 rounded-full bg-emerald-400"
              />
            ))}
            {drillNumber > 5 && (
              <span className="text-xs text-slate-400 font-bold">+{drillNumber - 5}</span>
            )}
          </div>
        )}
      </div>

      {/* ── AI Feedback Per Prompt ────────────────────────────────────────── */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm">
        <h3 className="text-sm font-bold text-slate-800 dark:text-white uppercase tracking-widest mb-4 flex items-center gap-2">
          <MessageSquare className="w-5 h-5 text-blue-500" /> Session Feedback
        </h3>
        <div className="space-y-3">
          {feedback.map((text, i) => (
            <div
              key={i}
              className="flex gap-3 text-sm text-slate-700 dark:text-slate-300 bg-slate-50 dark:bg-slate-800/50 p-3.5 rounded-xl"
            >
              <span className="font-bold text-blue-500 shrink-0">Q{i + 1}.</span>
              <p>{text}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ── Video Recommendation Section ─────────────────────────────────── */}
      {/* Optional — watching the video is not required to proceed.          */}
      <div className="bg-white dark:bg-slate-900 border-2 border-indigo-100 dark:border-slate-800 rounded-3xl p-6 shadow-sm">
        <h3 className="text-sm font-bold text-indigo-500 uppercase tracking-widest mb-4 flex items-center gap-2">
          <PlayCircle className="w-5 h-5" /> Recommended Lesson
        </h3>

        {/* Video Thumbnail */}
        <div className="relative w-full aspect-video rounded-2xl overflow-hidden mb-6 bg-slate-800 group">
          <img
            src="https://images.unsplash.com/photo-1516321318423-f06f85e504b3?q=80&w=1000&auto=format&fit=crop"
            alt="Video Thumbnail"
            className="w-full h-full object-cover opacity-60 group-hover:opacity-40 transition-opacity duration-300"
          />
          <div className="absolute inset-0 flex items-center justify-center">
            <button
              onClick={handleWatchClick}
              className="flex items-center gap-2 bg-red-600 text-white px-6 py-3 rounded-full font-bold hover:bg-red-700 transition-transform hover:scale-105 shadow-lg"
            >
              <PlayCircle className="w-5 h-5 fill-white" />
              Watch on YouTube
              <ExternalLink className="w-4 h-4 ml-1" />
            </button>
          </div>
        </div>

        {/* Meta + Mark Watched */}
        <div className="bg-slate-50 dark:bg-slate-800 p-5 rounded-2xl flex flex-col sm:flex-row justify-between items-center gap-4">
          <div>
            <p className="font-bold text-slate-800 dark:text-white text-lg">Mastering {subSkill}</p>
            <p className="text-sm text-slate-500">Targets: {skill} — {subSkill} · Est time: 4 mins</p>
          </div>

          {!videoWatched ? (
            <button
              onClick={() => setVideoWatched(true)}
              disabled={!hasClickedWatch || watchTimer > 0}
              className={`px-6 py-2.5 text-white text-sm font-bold rounded-xl w-full sm:w-auto transition-all ${
                !hasClickedWatch || watchTimer > 0
                  ? 'bg-slate-300 dark:bg-slate-700 cursor-not-allowed text-slate-500'
                  : 'bg-indigo-500 hover:bg-indigo-600 shadow-md'
              }`}
            >
              {!hasClickedWatch
                ? 'Mark as Watched'
                : watchTimer > 0
                ? `Wait ${watchTimer}s…`
                : 'Mark as Watched'}
            </button>
          ) : (
            <span className="flex items-center text-emerald-500 font-bold bg-emerald-50 dark:bg-emerald-500/10 px-4 py-2 rounded-lg">
              <CheckCircle2 className="w-4 h-4 mr-2" /> Watched
            </span>
          )}
        </div>

        {/* Optional label */}
        {!videoWatched && (
          <p className="text-center text-xs text-slate-400 font-medium mt-3">
            Optional — you can continue to the next step without watching
          </p>
        )}
      </div>

      {/* ── Next Action CTA ───────────────────────────────────────────────── */}
      {/* Always visible — video watch does NOT gate this button.            */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm">
        <p className="text-center text-sm text-slate-500 font-medium mb-4">
          {cta.sublabel}
        </p>

        <button
          onClick={onUnlockNext}
          className={`w-full flex items-center justify-center gap-2 ${cta.color} text-white font-bold py-4 rounded-xl transition-all shadow-md hover:shadow-lg active:scale-[0.98]`}
        >
          {cta.icon}
          {cta.label}
        </button>

        {/* Contextual hints */}
        {drillNumber === 1 && (
          <p className="text-center text-xs text-slate-400 mt-3 font-medium">
            🎯 LexiGrid is today's gate — 5 words unlocks Drill 2 and the full platform
          </p>
        )}
        {drillNumber === 2 && (
          <p className="text-center text-xs text-emerald-500 mt-3 font-medium">
            ✓ Full platform already unlocked — Drill 3 has no gate
          </p>
        )}
        {drillNumber >= 3 && (
          <p className="text-center text-xs text-indigo-400 mt-3 font-medium">
            🚀 No daily limit — keep drilling as long as you want!
          </p>
        )}
      </div>

    </div>
  );
}