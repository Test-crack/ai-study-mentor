import React, { useState, useEffect } from 'react';
import { CheckCircle2, PlayCircle, Lock, ExternalLink, MessageSquare, Flame, Zap, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { useMomentum } from "@/features/student/Context/MomentumContext";
import { callBackend } from "@/features/auth/services/authClient";

interface ResultCardProps {
  skill:           string;
  subSkill:        string;
  momentumScore:   number;
  feedback:        string[];
  drillSessionId:  string | null;
  onUnlockNext:    () => void;
}

interface RecommendationItem {
  id:            string;
  title:         string;
  url:           string;
  thumbnail_url: string | null;
  description:   string | null;
  source:        string | null;
  duration_min:  number | null;
  type:          string;
  skill_type:    string;
  sub_skill:     string | null;
  level:         string;
}

const FALLBACK_THUMB =
  'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?q=80&w=1000&auto=format&fit=crop';

export default function DrillResultCard({
  skill, subSkill, momentumScore, feedback, drillSessionId, onUnlockNext,
}: ResultCardProps) {
  const [videoWatched,        setVideoWatched]        = useState(false);
  const [reflection,          setReflection]          = useState('');
  const [error,               setError]               = useState('');
  const [watchTimer,          setWatchTimer]          = useState(30);
  const [hasClicked,          setHasClicked]          = useState(false);
  const [savingReflection,    setSavingReflection]    = useState(false);

  // Recommendation state
  const [rec,     setRec]     = useState<RecommendationItem | null>(null);
  const [recLoad, setRecLoad] = useState(true);

  const { totalMomentum, streak, syncMomentum } = useMomentum();

  // ── Fetch recommendation on mount ────────────────────────────────────────
  useEffect(() => {
    const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:4000';
    const params = new URLSearchParams({ skill: skill.toUpperCase() });
    if (subSkill) params.set('sub_skill', subSkill.toUpperCase());

    callBackend(`${backendUrl}/api/student/drill-recommendation?${params}`)
      .then(data => { if (data?.item) setRec(data.item); })
      .catch(err  => console.warn('[DrillResultCard] recommendation fetch failed:', err))
      .finally(() => setRecLoad(false));
  }, [skill, subSkill]);

  // ── Watch timer ───────────────────────────────────────────────────────────
  useEffect(() => {
    if (!hasClicked || watchTimer <= 0) return;
    const t = setInterval(() => setWatchTimer(p => p - 1), 1000);
    return () => clearInterval(t);
  }, [hasClicked, watchTimer]);

  const handleWatchClick = () => {
    setHasClicked(true);
    window.open(rec?.url ?? 'https://www.youtube.com', '_blank');
  };

  const handleSubmitReflection = async () => {
    const words = reflection.trim().split(/\s+/).filter(Boolean).length;
    if (words < 8) {
      setError('Try again — be specific and use at least 8 words.');
      return;
    }
    setError('');
    setSavingReflection(true);
    try {
      if (drillSessionId) {
        const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:4000';
        const res = await callBackend(`${backendUrl}/api/drills/save-reflection`, {
          method: 'POST',
          body: JSON.stringify({ session_id: drillSessionId, reflection_text: reflection.trim() }),
        });
        if (res.success && res.momentum_earned > 0) {
          syncMomentum(res.momentum_score);
          toast.success(`+${res.momentum_earned} momentum earned!`, {
            description: 'Great reflection — keep the momentum going.',
            duration: 3500,
          });
        }
      }
    } catch (err) {
      console.warn('[DrillResultCard] reflection save failed:', err);
      // Non-blocking — still let the user proceed
    } finally {
      setSavingReflection(false);
      onUnlockNext();
    }
  };

  // ── Derived display values ────────────────────────────────────────────────
  const recTitle   = rec?.title ?? `Mastering ${subSkill.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, c => c.toUpperCase())}`;
  const thumbSrc   = rec?.thumbnail_url ?? FALLBACK_THUMB;

  const targetTag = [rec?.skill_type ?? skill, rec?.sub_skill ?? subSkill]
    .filter(Boolean).join(' · ');
  const levelTag    = rec?.level ? rec.level.charAt(0) + rec.level.slice(1).toLowerCase() : null;
  const durationTag = rec?.duration_min ? `${rec.duration_min} min` : null;
  const sourceTag   = rec?.source ?? null;

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-8">

      {/* Score Summary */}
      <div className="bg-emerald-500 text-white p-8 rounded-3xl shadow-lg relative overflow-hidden">
        <div className="relative z-10 flex flex-col items-center text-center mb-6">
          <CheckCircle2 className="w-16 h-16 mx-auto mb-4 opacity-90" />
          <h2 className="text-3xl font-black mb-2">Drill Complete!</h2>
          <p className="text-emerald-100 font-medium text-lg">You earned +{momentumScore} points.</p>
        </div>
        <div className="grid grid-cols-2 gap-4 border-t border-emerald-400/50 pt-6 mt-2 relative z-10">
          <div className="text-center">
            <p className="text-emerald-100 text-xs font-bold uppercase tracking-wider mb-1 flex justify-center items-center gap-1">
              <Zap className="w-4 h-4" /> Total Momentum
            </p>
            <p className="text-2xl font-black">{totalMomentum}</p>
          </div>
          <div className="text-center border-l border-emerald-400/50">
            <p className="text-emerald-100 text-xs font-bold uppercase tracking-wider mb-1 flex justify-center items-center gap-1">
              <Flame className="w-4 h-4 text-orange-300" /> Streak
            </p>
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

        {/* Thumbnail */}
        <div className="relative w-full aspect-video rounded-2xl overflow-hidden mb-6 bg-slate-800 group">
          {recLoad ? (
            <div className="w-full h-full flex items-center justify-center bg-slate-100 dark:bg-slate-800">
              <Loader2 className="w-8 h-8 text-slate-400 animate-spin" />
            </div>
          ) : (
            <>
              <img
                src={thumbSrc}
                alt={recTitle}
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
            </>
          )}
        </div>

        {/* Info row */}
        <div className="bg-slate-50 dark:bg-slate-800 p-5 rounded-2xl flex flex-col sm:flex-row justify-between items-start gap-4 mb-6">
          <div className="flex-1 min-w-0">
            {/* Title */}
            <p className="font-bold text-slate-800 dark:text-white text-base leading-snug mb-1">{recTitle}</p>

            {/* Meta tags */}
            <div className="flex flex-wrap items-center gap-1.5 mb-2">
              {targetTag && (
                <span className="text-[10px] font-black uppercase tracking-widest bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full">
                  {targetTag}
                </span>
              )}
              {levelTag && (
                <span className="text-[10px] font-black uppercase tracking-widest bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 px-2 py-0.5 rounded-full">
                  {levelTag}
                </span>
              )}
              {durationTag && (
                <span className="text-[10px] font-bold text-slate-400 flex items-center gap-0.5">
                  ⏱ {durationTag}
                </span>
              )}
              {sourceTag && (
                <span className="text-[10px] font-bold text-slate-400">
                  · {sourceTag}
                </span>
              )}
            </div>

            {/* Description */}
            {rec?.description && (
              <p className="text-xs text-slate-500 leading-relaxed line-clamp-2">{rec.description}</p>
            )}
          </div>

          {!videoWatched ? (
            <button
              onClick={() => setVideoWatched(true)}
              disabled={!hasClicked || watchTimer > 0}
              className={`px-6 py-2.5 text-white text-sm font-bold rounded-xl w-full sm:w-auto transition-all ${
                !hasClicked || watchTimer > 0
                  ? 'bg-slate-300 dark:bg-slate-700 cursor-not-allowed text-slate-500'
                  : 'bg-indigo-500 hover:bg-indigo-600 shadow-md'
              }`}
            >
              {!hasClicked ? 'Mark as Watched' : watchTimer > 0 ? `Wait ${watchTimer}s…` : 'Mark as Watched'}
            </button>
          ) : (
            <span className="flex items-center text-emerald-500 font-bold bg-emerald-50 px-4 py-2 rounded-lg">
              <CheckCircle2 className="w-4 h-4 mr-2" /> Watched
            </span>
          )}
        </div>

        {/* Reflection gate */}
        {videoWatched && (
          <div className="space-y-4 animate-in fade-in zoom-in duration-300 border-t border-slate-100 dark:border-slate-800 pt-6">
            <label className="block text-sm font-bold text-slate-700 dark:text-slate-300">
              In one sentence, what is one thing from this video you will try in your next session?
            </label>
            <textarea
              value={reflection}
              onChange={e => setReflection(e.target.value)}
              placeholder="E.g., I will focus on my syllable stress…"
              className="w-full p-4 rounded-xl border-2 border-slate-200 dark:border-slate-700 bg-transparent focus:border-indigo-500 outline-none resize-none"
              rows={3}
            />
            {error && <p className="text-rose-500 text-sm font-bold">{error}</p>}
            <button
              onClick={handleSubmitReflection}
              disabled={savingReflection}
              className="w-full py-4 bg-slate-800 text-white font-bold rounded-xl hover:bg-slate-700 transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
            >
              {savingReflection ? (
                <><Loader2 className="w-4 h-4 animate-spin" /> Saving…</>
              ) : (
                'Continue to Apply Drill  +25 pts'
              )}
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
