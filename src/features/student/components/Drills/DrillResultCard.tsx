// src/features/student/drills/DrillResultCard.tsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircle2, PlayCircle, Lock, ExternalLink, MessageSquare, Flame, Zap, Loader2, ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';
import { useMomentum } from "@/features/student/Context/MomentumContext";
import { callBackend } from "@/features/auth/services/authClient";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { isSpokenEnglish } from "@/features/student/utils/exam";
import { ArrowRight } from 'lucide-react';

interface ResultCardProps {
  skill:           string;
  subSkill:        string;
  momentumScore:   number;
  feedback:        string[];
  answerResults?:  boolean[];
  drillSessionId:  string | null;
  onUnlockNext:    () => void;
}

const toSubSkillLabel = (key: string) =>
  key.replace(/Score/gi, '').replace(/_/g, ' ').replace(/([a-z])([A-Z])/g, '$1 $2').trim()
    .replace(/\b\w/g, c => c.toUpperCase());

const DARK_HERO_GRID: React.CSSProperties = {
  backgroundImage:
    'linear-gradient(rgba(255,255,255,.028) 1px,transparent 1px), linear-gradient(90deg,rgba(255,255,255,.028) 1px,transparent 1px)',
  backgroundSize: '44px 44px',
};

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
  skill, subSkill, momentumScore, feedback, answerResults = [], drillSessionId, onUnlockNext,
}: ResultCardProps) {
  const navigate = useNavigate();
  const { profile } = useAuth();
  const [videoWatched,        setVideoWatched]        = useState(false);
  const [reflection,          setReflection]          = useState('');
  const [error,               setError]               = useState('');
  const [watchTimer,          setWatchTimer]          = useState(30);
  const [hasClicked,          setHasClicked]          = useState(false);
  const [savingReflection,    setSavingReflection]    = useState(false);

  const [rec,     setRec]     = useState<RecommendationItem | null>(null);
  const [recLoad, setRecLoad] = useState(true);

  // ── Real LexiGrid gate status — the same daily-drill-state contract the dashboard uses ──
  const [nextAction, setNextAction]   = useState<string | null>(null);
  const [lexiDone, setLexiDone]       = useState(false);

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
    const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:4000';
    callBackend(`${backendUrl}/api/student/daily-drill-state`)
      .then(res => {
        if (res.success) {
          setNextAction(res.next_action ?? null);
          setLexiDone(!!res.lexigrid_completed_today);
        }
      })
      .catch(err => console.warn('[DrillResultCard] daily-drill-state fetch failed:', err));
  }, []);

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

  const correctCount = answerResults.filter(Boolean).length;
  const doneTitle = answerResults.length === 0
    ? 'Drill Complete!'
    : correctCount === answerResults.length
      ? `Clean run. ${correctCount} from ${answerResults.length}.`
      : `${correctCount} from ${answerResults.length} — that moves the number.`;

  // ── LexiGrid gate — mirrors the dashboard's real state (no new gating logic) ──
  const isLexiOpen = nextAction === 'LEXIGRID';
  const lexiUnlocked = isLexiOpen || lexiDone;
  const lexiCta = lexiDone ? 'Practice round →' : isLexiOpen ? 'Play LexiGrid →' : 'Locked until it opens';
  const lexiBody = lexiDone
    ? 'Solved for today. LexiGrid stays open for practice rounds that never affect your band.'
    : isLexiOpen
      ? "It's open now — solve today's grid to keep your streak moving."
      : 'LexiGrid opens once today’s gate chain reaches it.';
  const goLexiGrid = () => navigate(isLexiOpen ? '/student/lexigrid?mode=gate' : '/student/lexigrid');

  // ── Spoken English: clean completion. No video-watch gate, no reflection, no LexiGrid
  //    "next session" (its gate is 3 drills, LexiGrid is standalone). Just bank momentum and
  //    return to the dashboard, which shows the next drill / unlocks at 3.
  if (isSpokenEnglish(profile?.examId)) {
    return (
      <div className="space-y-3.5 animate-in fade-in slide-in-from-bottom-8">
        <div className="flex justify-end">
          <button onClick={onUnlockNext} className="flex items-center gap-2 text-sm font-semibold text-brand-text-mute hover:text-brand-teal-600 transition-colors">
            <ArrowLeft className="w-4 h-4" /> Back to Dashboard
          </button>
        </div>

        <div className="relative overflow-hidden rounded-3xl bg-brand-ink-deep" style={DARK_HERO_GRID}>
          <div className="relative z-10 grid grid-cols-1 sm:grid-cols-[1.25fr_0.75fr]">
            <div className="p-8 border-b sm:border-b-0 sm:border-r border-brand-line-16">
              <div className="flex items-center gap-3 mb-4">
                <span className="h-px w-6 bg-brand-mint" aria-hidden="true" />
                <span className="font-jetbrains text-[10.5px] font-medium uppercase tracking-[0.14em] text-brand-mint">Drill Complete</span>
              </div>
              <h2 className="font-dm text-2xl sm:text-[28px] leading-[1.15] font-bold text-white mb-2">{doneTitle}</h2>
              <p className="text-brand-on-ink-mute text-sm leading-[1.6] max-w-md mb-5">Momentum is banked and your sub-score updates at the next internal assessment.</p>
              {answerResults.length > 0 && (
                <div className="flex gap-[7px]">
                  {answerResults.map((ok, i) => (
                    <div key={i} className={`w-[30px] h-[30px] rounded-lg flex items-center justify-center font-jetbrains text-sm font-bold ${ok ? 'bg-brand-mint text-brand-ink-deep' : 'bg-brand-warm-danger text-white'}`}>{ok ? '✓' : '×'}</div>
                  ))}
                </div>
              )}
            </div>
            <div className="p-8 flex flex-col justify-center gap-5">
              <div>
                <p className="font-jetbrains text-[9.5px] tracking-[0.12em] text-brand-on-ink-mute">MOMENTUM EARNED</p>
                <p className="font-jetbrains text-[36px] font-bold text-brand-mint leading-none mt-2">+{momentumScore}</p>
              </div>
              <div className="flex items-center gap-5 pt-4 border-t border-brand-line-16">
                <div><p className="font-jetbrains text-[9.5px] tracking-[0.12em] text-brand-on-ink-mute flex items-center gap-1"><Zap className="w-3.5 h-3.5 text-amber-400" /> Total</p><p className="font-jetbrains text-lg font-bold text-white mt-1 tabular-nums">{totalMomentum}</p></div>
                <div><p className="font-jetbrains text-[9.5px] tracking-[0.12em] text-brand-on-ink-mute flex items-center gap-1"><Flame className="w-3.5 h-3.5 text-orange-400" /> Streak</p><p className="font-jetbrains text-lg font-bold text-white mt-1 tabular-nums">Day {streak}</p></div>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white border border-brand-line rounded-3xl p-6 shadow-sm flex flex-col items-center gap-4 text-center sm:flex-row sm:justify-between sm:text-left">
          <p className="text-sm font-medium text-brand-text-mute">Nice work — keep going to unlock your full dashboard.</p>
          <button onClick={onUnlockNext} className="inline-flex items-center gap-2 rounded-xl bg-brand-teal-600 px-6 py-3 font-bold text-white transition-colors hover:bg-brand-teal-700">
            Continue <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3.5 animate-in fade-in slide-in-from-bottom-8">

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

      {/* Score Summary — dark ink hero, two-column split matching the reference's "drill complete" panel */}
      <div
        className="relative overflow-hidden rounded-3xl bg-brand-ink-deep"
        style={DARK_HERO_GRID}
      >
        <div className="relative z-10 grid grid-cols-1 sm:grid-cols-[1.25fr_0.75fr]">
          <div className="p-8 border-b sm:border-b-0 sm:border-r border-brand-line-16">
            <div className="flex items-center gap-3 mb-4">
              <span className="h-px w-6 bg-brand-mint" aria-hidden="true" />
              <span className="font-jetbrains text-[10.5px] font-medium uppercase tracking-[0.14em] text-brand-mint">Drill Complete</span>
            </div>
            <h2 className="font-dm text-2xl sm:text-[28px] leading-[1.15] font-bold text-white mb-2">{doneTitle}</h2>
            <p className="text-brand-on-ink-mute text-sm leading-[1.6] max-w-md mb-5">
              Momentum is banked and your sub-score updates at the next internal assessment.
            </p>
            {answerResults.length > 0 && (
              <div className="flex gap-[7px]">
                {answerResults.map((ok, i) => (
                  <div
                    key={i}
                    className={`w-[30px] h-[30px] rounded-lg flex items-center justify-center font-jetbrains text-sm font-bold ${
                      ok ? 'bg-brand-mint text-brand-ink-deep' : 'bg-brand-warm-danger text-white'
                    }`}
                  >
                    {ok ? '✓' : '×'}
                  </div>
                ))}
              </div>
            )}
          </div>
          <div className="p-8 flex flex-col justify-center gap-5">
            <div>
              <p className="font-jetbrains text-[9.5px] tracking-[0.12em] text-brand-on-ink-mute">MOMENTUM EARNED</p>
              <p className="font-jetbrains text-[36px] font-bold text-brand-mint leading-none mt-2">+{momentumScore}</p>
            </div>
            <div className="flex items-center gap-5 pt-4 border-t border-brand-line-16">
              <div>
                <p className="font-jetbrains text-[9.5px] tracking-[0.12em] text-brand-on-ink-mute flex items-center gap-1">
                  <Zap className="w-3.5 h-3.5 text-amber-400" /> Total
                </p>
                <p className="font-jetbrains text-lg font-bold text-white mt-1 tabular-nums">{totalMomentum}</p>
              </div>
              <div>
                <p className="font-jetbrains text-[9.5px] tracking-[0.12em] text-brand-on-ink-mute flex items-center gap-1">
                  <Flame className="w-3.5 h-3.5 text-orange-400" /> Streak
                </p>
                <p className="font-jetbrains text-lg font-bold text-white mt-1 tabular-nums">Day {streak}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Recommended lesson (left) + breakdown/next-gate (right) ── */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_0.5fr] gap-3.5 items-start">
        <div className="flex flex-col gap-3.5 min-w-0">

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
                className="px-6 py-3 bg-brand-teal-600 hover:bg-brand-teal-700 text-white font-bold rounded-xl transition-colors shadow-sm"
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
                  className="flex items-center gap-2 bg-brand-warm-danger text-white px-6 py-3 rounded-full font-bold hover:bg-brand-warm-danger/90 transition-transform hover:scale-105 shadow-lg"
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
                  : 'bg-brand-teal-600 hover:bg-brand-teal-700 shadow-sm'
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
              className="w-full py-4 bg-brand-teal-600 hover:bg-brand-teal-700 text-white font-bold rounded-xl transition-colors disabled:opacity-60 flex items-center justify-center gap-2 shadow-sm"
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

        {/* ── Question breakdown + what's next — real data, no fabricated fields ── */}
        <div className="flex flex-col gap-3.5 min-w-0">
          {answerResults.length > 0 && (
            <div className="bg-white border border-brand-line rounded-3xl p-6 shadow-sm">
              <span className="font-jetbrains text-[10.5px] font-medium uppercase tracking-[0.14em] text-brand-text-mute">
                Question Breakdown
              </span>
              <div className="flex flex-col gap-[7px] mt-3.5">
                {answerResults.map((ok, i) => (
                  <div
                    key={i}
                    className="flex items-center gap-3 py-2.5 px-3 bg-brand-bg-alt/60 border border-brand-line rounded-[10px]"
                  >
                    <span
                      className={`w-[22px] h-[22px] flex-none rounded-[7px] flex items-center justify-center text-[11px] font-bold text-white ${
                        ok ? 'bg-brand-teal-600' : 'bg-brand-warm-danger'
                      }`}
                    >
                      {ok ? '✓' : '×'}
                    </span>
                    <span className="flex-1 min-w-0 text-[13px] text-brand-text-mute truncate">Question {i + 1}</span>
                    <span className={`font-jetbrains text-[12.5px] font-bold ${ok ? 'text-brand-teal-600' : 'text-brand-text-mute'}`}>
                      {ok ? '+10' : '+0'}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div
            className={`bg-white border rounded-3xl p-6 shadow-sm ${lexiUnlocked ? 'border-brand-teal-200' : 'border-brand-line'}`}
          >
            <span className={`font-jetbrains text-[10.5px] font-medium uppercase tracking-[0.14em] ${lexiUnlocked ? 'text-brand-teal-600' : 'text-brand-text-mute'}`}>
              Next In Today's Session
            </span>
            <div className="text-[17px] font-bold text-brand-text tracking-tight mt-2.5">LexiGrid</div>
            <p className="text-[13.5px] leading-[1.6] text-brand-text-mute mt-1.5">{lexiBody}</p>
            <button
              type="button"
              onClick={goLexiGrid}
              disabled={!lexiUnlocked}
              className={`mt-4 w-full py-3 rounded-xl text-[14px] font-bold transition-colors ${
                lexiUnlocked
                  ? 'bg-brand-teal-600 hover:bg-brand-teal-700 text-white'
                  : 'bg-brand-bg-alt text-brand-text-mute cursor-not-allowed'
              }`}
            >
              {lexiCta}
            </button>
            <button
              type="button"
              onClick={onUnlockNext}
              className="block w-full text-center mt-3 text-[13px] font-semibold text-brand-teal-600 hover:text-brand-teal-700 transition-colors"
            >
              Back to dashboard
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}