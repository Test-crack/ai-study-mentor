// src/features/student/drills/DrillResultCard.tsx
import React, { useState, useEffect } from 'react';
import { CheckCircle2, PlayCircle, Lock, ExternalLink, MessageSquare, Flame, Zap, Loader2, ArrowLeft } from 'lucide-react';
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

const FALLBACK_THUMB = null;

export default function DrillResultCard({
  skill, subSkill, momentumScore, feedback, drillSessionId, onUnlockNext,
}: ResultCardProps) {
  const [videoWatched,        setVideoWatched]        = useState(false);
  const [reflection,          setReflection]          = useState('');
  const [error,               setError]               = useState('');
  const [watchTimer,          setWatchTimer]          = useState(30);
  const [hasClicked,          setHasClicked]          = useState(false);
  const [savingReflection,    setSavingReflection]    = useState(false);

  const [rec,     setRec]     = useState<RecommendationItem | null>(null);
  const [recLoad, setRecLoad] = useState(true);

  const { totalMomentum, streak, syncMomentum } = useMomentum();

  useEffect(() => {
    const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:4000';
    const params = new URLSearchParams({ skill: skill.toUpperCase() });
    if (subSkill) params.set('sub_skill', subSkill.toUpperCase());

    callBackend(`${backendUrl}/api/student/drill-recommendation?${params}`)
      .then(data => { if (data?.item) setRec(data.item); })
      .catch(err  => console.warn('[DrillResultCard] recommendation fetch failed:', err))
      .finally(() => setRecLoad(false));
  }, [skill, subSkill]);

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
    } finally {
      setSavingReflection(false);
      onUnlockNext();
    }
  };

  const recTitle = rec?.title ?? `Mastering ${subSkill.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, c => c.toUpperCase())}`;
  const thumbSrc = rec?.thumbnail_url ?? null;

  const targetTag = [rec?.skill_type ?? skill, rec?.sub_skill ?? subSkill]
    .filter(Boolean).join(' · ');
  const levelTag    = rec?.level ? rec.level.charAt(0) + rec.level.slice(1).toLowerCase() : null;
  const durationTag = rec?.duration_min ? `${rec.duration_min} min` : null;
  const sourceTag   = rec?.source ?? null;

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-8">

      {/* ── Back to Dashboard ── */}
      <div className="flex justify-end">
        <button
          onClick={onUnlockNext}
          className="flex items-center gap-2 text-sm font-semibold text-brand-text-mute hover:text-brand-teal-600 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Dashboard
        </button>
      </div>

      {/* Score Summary — white pop-out card with emerald numerals */}
      <div className="bg-white border border-brand-line p-8 rounded-3xl shadow-sm relative overflow-hidden">
        {/* Soft emerald glow */}
        <div className="pointer-events-none absolute -top-12 -right-12 w-44 h-44 rounded-full bg-emerald-400/15 blur-3xl" />
        <div className="relative z-10 flex flex-col items-center text-center mb-6">
          <div className="h-16 w-16 rounded-2xl bg-emerald-50 flex items-center justify-center mb-4 ring-4 ring-emerald-100/50">
            <CheckCircle2 className="w-9 h-9 text-emerald-500" />
          </div>
          <h2 className="font-manrope text-2xl sm:text-3xl font-black text-brand-text mb-2">Drill Complete!</h2>
          <p className="text-emerald-600 font-bold text-lg">You earned +{momentumScore} points.</p>
        </div>
        <div className="grid grid-cols-2 gap-4 border-t border-brand-line pt-6 mt-2 relative z-10">
          <div className="text-center">
            <p className="font-jetbrains text-brand-text-mute text-[11px] font-bold uppercase tracking-[0.16em] mb-1 flex justify-center items-center gap-1">
              <Zap className="w-4 h-4 text-amber-500" /> Total Momentum
            </p>
            <p className="text-2xl font-black text-brand-text tabular-nums">{totalMomentum}</p>
          </div>
          <div className="text-center border-l border-brand-line">
            <p className="font-jetbrains text-brand-text-mute text-[11px] font-bold uppercase tracking-[0.16em] mb-1 flex justify-center items-center gap-1">
              <Flame className="w-4 h-4 text-orange-500" /> Streak
            </p>
            <p className="text-2xl font-black text-brand-text tabular-nums">Day {streak}</p>
          </div>
        </div>
      </div>

      {/* Session Feedback */}
      {feedback && feedback.length > 0 && (
        <div className="bg-white border border-brand-line rounded-3xl p-6 shadow-sm">
          <h3 className="font-jetbrains text-sm font-bold text-brand-text uppercase tracking-[0.16em] mb-4 flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-brand-teal-500" /> Session Feedback
          </h3>
          <div className="space-y-3">
            {feedback.map((text, i) => (
              <div key={i} className="flex gap-3 text-sm text-brand-text-mute bg-brand-bg-alt p-3.5 rounded-xl">
                <span className="font-bold text-brand-teal-500 shrink-0">Q{i + 1}.</span>
                <p>{text}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Video Recommendation Gate */}
      {!recLoad && !rec ? (
        <div className="bg-white border border-brand-line rounded-3xl p-6 shadow-sm text-center">
          <p className="text-brand-text-mute text-sm font-medium mb-4">No recommended lesson available for this topic right now.</p>
          <button
            onClick={onUnlockNext}
            className="px-6 py-3 bg-brand-teal-700 hover:bg-brand-teal-600 text-white font-bold rounded-xl transition-colors shadow-sm"
          >
            Continue to Next Drill
          </button>
        </div>
      ) : (
      <div className="bg-white border border-brand-teal-100 rounded-3xl p-6 shadow-sm">
        <h3 className="font-jetbrains text-sm font-bold text-brand-teal-600 uppercase tracking-[0.16em] mb-4 flex items-center gap-2">
          <PlayCircle className="w-5 h-5" /> Recommended Lesson
        </h3>

        {/* Thumbnail */}
        <div className="relative w-full aspect-video rounded-2xl overflow-hidden mb-6 bg-brand-ink group">
          {recLoad ? (
            <div className="w-full h-full flex items-center justify-center bg-brand-bg-alt">
              <Loader2 className="w-8 h-8 text-brand-text-mute animate-spin" />
            </div>
          ) : (
            <>
              {thumbSrc ? (
                <img
                  src={thumbSrc}
                  alt={recTitle}
                  className="w-full h-full object-cover opacity-60 group-hover:opacity-40 transition-opacity duration-300"
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-brand-teal-900 via-brand-ink to-brand-ink-deep" />
              )}
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
        <div className="bg-brand-bg-alt p-5 rounded-2xl flex flex-col sm:flex-row justify-between items-start gap-4 mb-6">
          <div className="flex-1 min-w-0">
            <p className="font-bold text-brand-text text-base leading-snug mb-1">{recTitle}</p>

            <div className="flex flex-wrap items-center gap-1.5 mb-2">
              {targetTag && (
                <span className="font-jetbrains text-[10px] font-bold uppercase tracking-[0.14em] bg-brand-teal-100 text-brand-teal-700 px-2 py-0.5 rounded-full">
                  {targetTag}
                </span>
              )}
              {levelTag && (
                <span className="font-jetbrains text-[10px] font-bold uppercase tracking-[0.14em] bg-brand-bg-alt text-brand-text-mute px-2 py-0.5 rounded-full">
                  {levelTag}
                </span>
              )}
              {durationTag && (
                <span className="text-[10px] font-bold text-brand-text-mute flex items-center gap-0.5">
                  ⏱ {durationTag}
                </span>
              )}
              {sourceTag && (
                <span className="text-[10px] font-bold text-brand-text-mute">
                  · {sourceTag}
                </span>
              )}
            </div>

            {rec?.description && (
              <p className="text-xs text-brand-text-mute leading-relaxed line-clamp-2">{rec.description}</p>
            )}
          </div>

          {!videoWatched ? (
            <button
              onClick={() => setVideoWatched(true)}
              disabled={!hasClicked || watchTimer > 0}
              className={`px-6 py-2.5 text-white text-sm font-bold rounded-xl w-full sm:w-auto transition-all ${
                !hasClicked || watchTimer > 0
                  ? 'bg-brand-bg-alt cursor-not-allowed text-brand-text-mute'
                  : 'bg-brand-teal-700 hover:bg-brand-teal-600 shadow-sm'
              }`}
            >
              {!hasClicked ? 'Mark as Watched' : watchTimer > 0 ? `Wait ${watchTimer}s…` : 'Mark as Watched'}
            </button>
          ) : (
            <span className="flex items-center text-emerald-600 font-bold bg-emerald-50 px-4 py-2 rounded-lg">
              <CheckCircle2 className="w-4 h-4 mr-2" /> Watched
            </span>
          )}
        </div>

        {/* Reflection gate */}
        {videoWatched && (
          <div className="space-y-4 animate-in fade-in zoom-in duration-300 border-t border-brand-line pt-6">
            <label className="block text-sm font-bold text-brand-text">
              In one sentence, what is one thing from this video you will try in your next session?
            </label>
            <textarea
              value={reflection}
              onChange={e => setReflection(e.target.value)}
              placeholder="E.g., I will focus on my syllable stress…"
              className="w-full p-4 rounded-xl border border-brand-line bg-transparent focus:border-brand-teal-500 focus:ring-2 focus:ring-brand-teal-500/20 outline-none resize-none text-brand-text transition-all"
              rows={3}
            />
            {error && <p className="text-rose-500 text-sm font-bold">{error}</p>}
            <button
              onClick={handleSubmitReflection}
              disabled={savingReflection}
              className="w-full py-4 bg-brand-teal-700 hover:bg-brand-teal-600 text-white font-bold rounded-xl transition-colors disabled:opacity-60 flex items-center justify-center gap-2 shadow-sm"
            >
              {savingReflection ? (
                <><Loader2 className="w-4 h-4 animate-spin" /> Saving…</>
              ) : (
                'Save Reflection · +25 pts'
              )}
            </button>
          </div>
        )}

        {!videoWatched && (
          <p className="text-center text-xs text-brand-text-mute font-semibold flex items-center justify-center mt-4">
            <Lock className="w-3 h-3 mr-1" /> Watch video to unlock next session
          </p>
        )}
      </div>
      )}
    </div>
  );
}