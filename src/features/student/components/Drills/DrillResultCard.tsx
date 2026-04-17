import React, { useState, useEffect } from 'react';
import { CheckCircle2, PlayCircle, Lock, ExternalLink, MessageSquare, Flame, Zap } from 'lucide-react';
import { useMomentum } from "@/features/student/Context/MomentumContext"; 

interface ResultCardProps {
  skill: string;
  subSkill: string;
  momentumScore: number;
  feedback: string[];
  onUnlockNext: () => void;
}

export default function DrillResultCard({ skill, subSkill, momentumScore, feedback, onUnlockNext }: ResultCardProps) {
  const [videoWatched, setVideoWatched] = useState(false);
  const [reflection, setReflection] = useState("");
  const [error, setError] = useState("");

  const [watchTimer, setWatchTimer] = useState(30);
  const [hasClickedWatch, setHasClickedWatch] = useState(false);

  // Pulling global stats for display (FE-12 Requirement)
  const { totalMomentum, streak } = useMomentum();

  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    if (hasClickedWatch && watchTimer > 0) {
      interval = setInterval(() => {
        setWatchTimer((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [hasClickedWatch, watchTimer]);

  const handleWatchClick = () => {
    setHasClickedWatch(true);
    window.open("https://www.youtube.com", "_blank"); 
  };

  const handleSubmitReflection = () => {
    const words = reflection.trim().split(/\s+/).length;
    if (words < 8) {
      setError("Try again — be specific and use at least 8 words.");
      return;
    }
    setError("");

    // Knockout system logic
    const today = new Date().toISOString().split('T')[0];
    const storedData = localStorage.getItem('completed_drills_today');
    let completedList: string[] = [];

    if (storedData) {
      const parsed = JSON.parse(storedData);
      if (parsed.date === today) {
        completedList = parsed.completed;
      }
    }

    if (!completedList.includes(subSkill)) {
      completedList.push(subSkill);
    }

    localStorage.setItem('completed_drills_today', JSON.stringify({
      date: today,
      completed: completedList
    }));

    onUnlockNext(); 
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-8">
      {/* Score Summary (Updated for FE-12) */}
      <div className="bg-emerald-500 text-white p-8 rounded-3xl shadow-lg relative overflow-hidden">
        <div className="relative z-10 flex flex-col items-center text-center mb-6">
            <CheckCircle2 className="w-16 h-16 mx-auto mb-4 opacity-90" />
            <h2 className="text-3xl font-black mb-2">Drill Complete!</h2>
            <p className="text-emerald-100 font-medium text-lg">You earned +{momentumScore} points.</p>
        </div>
        
        <div className="grid grid-cols-2 gap-4 border-t border-emerald-400/50 pt-6 mt-2 relative z-10">
            <div className="text-center">
                <p className="text-emerald-100 text-xs font-bold uppercase tracking-wider mb-1 flex justify-center items-center gap-1"><Zap className="w-4 h-4"/> Total Momentum</p>
                <p className="text-2xl font-black">{totalMomentum}</p>
            </div>
            <div className="text-center border-l border-emerald-400/50">
                <p className="text-emerald-100 text-xs font-bold uppercase tracking-wider mb-1 flex justify-center items-center gap-1"><Flame className="w-4 h-4 text-orange-300"/> Streak</p>
                <p className="text-2xl font-black">Day {streak}</p>
            </div>
        </div>
      </div>

      {/* Session Feedback */}
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

      {/* Video Recommendation Gate */}
      <div className="bg-white dark:bg-slate-900 border-2 border-indigo-100 dark:border-slate-800 rounded-3xl p-6 shadow-sm">
        <h3 className="text-sm font-bold text-indigo-500 uppercase tracking-widest mb-4 flex items-center gap-2">
          <PlayCircle className="w-5 h-5" /> Recommended Lesson
        </h3>

        <div className="relative w-full aspect-video rounded-2xl overflow-hidden mb-6 bg-slate-800 group">
          <img 
            src="https://images.unsplash.com/photo-1516321318423-f06f85e504b3?q=80&w=1000&auto=format&fit=crop" 
            alt="Video Thumbnail" 
            className="w-full h-full object-cover opacity-60 group-hover:opacity-40 transition-opacity duration-300" 
          />
          <div className="absolute inset-0 flex items-center justify-center">
            <button onClick={handleWatchClick} className="flex items-center gap-2 bg-red-600 text-white px-6 py-3 rounded-full font-bold hover:bg-red-700 transition-transform hover:scale-105 shadow-lg">
              <PlayCircle className="w-5 h-5 fill-white" /> Watch on YouTube <ExternalLink className="w-4 h-4 ml-1" />
            </button>
          </div>
        </div>
        
        <div className="bg-slate-50 dark:bg-slate-800 p-5 rounded-2xl flex flex-col sm:flex-row justify-between items-center gap-4 mb-6">
          <div>
            <p className="font-bold text-slate-800 dark:text-white text-lg">Mastering {subSkill}</p>
            <p className="text-sm text-slate-500">Targets: {skill} — {subSkill}. Est time: 4 mins.</p>
          </div>

          {!videoWatched ? (
            <button 
              onClick={() => setVideoWatched(true)} 
              disabled={!hasClickedWatch || watchTimer > 0}
              className={`px-6 py-2.5 text-white text-sm font-bold rounded-xl w-full sm:w-auto transition-all ${
                (!hasClickedWatch || watchTimer > 0) 
                  ? 'bg-slate-300 dark:bg-slate-700 cursor-not-allowed text-slate-500' 
                  : 'bg-indigo-500 hover:bg-indigo-600 shadow-md'
              }`}
            >
              {!hasClickedWatch 
                ? "Mark as Watched" 
                : watchTimer > 0 
                  ? `Wait ${watchTimer}s...` 
                  : "Mark as Watched"}
            </button>
          ) : (
            <span className="flex items-center text-emerald-500 font-bold bg-emerald-50 px-4 py-2 rounded-lg">
              <CheckCircle2 className="w-4 h-4 mr-2" /> Watched
            </span>
          )}
        </div>

        {videoWatched && (
          <div className="space-y-4 animate-in fade-in zoom-in duration-300 border-t border-slate-100 dark:border-slate-800 pt-6">
            <label className="block text-sm font-bold text-slate-700 dark:text-slate-300">
              In one sentence, what is one thing from this video you will try in your next session?
            </label>
            <textarea
              value={reflection}
              onChange={(e) => setReflection(e.target.value)}
              placeholder={`E.g., I will focus on my syllable stress...`}
              className="w-full p-4 rounded-xl border-2 border-slate-200 dark:border-slate-700 bg-transparent focus:border-indigo-500 outline-none resize-none"
              rows={3}
            />
            {error && <p className="text-rose-500 text-sm font-bold">{error}</p>}
            <button 
              onClick={handleSubmitReflection}
              className="w-full py-4 bg-slate-800 text-white font-bold rounded-xl hover:bg-slate-700 transition-colors"
            >
              Continue to Apply Drill
            </button>
          </div>
        )}

        {!videoWatched && (
          <p className="text-center text-xs text-slate-400 font-semibold flex items-center justify-center mt-4">
            <Lock className="w-3 h-3 mr-1" /> Watch video to unlock next session
          </p>
        )}
      </div>
    </div>
  );
}