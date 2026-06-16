import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { callBackend } from '@/features/auth/services/authClient';
import {
  Youtube,
  FileText,
  ArrowUpRight,
  BrainCircuit,
  Target,
  Clock,
  CheckCircle2,
  Headphones,
  BookOpen,
  PenLine,
  Mic,
  ClipboardList,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  Zap,
} from 'lucide-react';
import StudentLayout from './StudentLayout';

/* ─── Google Fonts injection ─────────────────────────────────────────── */
const fontLink = document.createElement('link');
fontLink.rel = 'stylesheet';
fontLink.href =
  'https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,300;9..144,700;9..144,900&family=Outfit:wght@300;400;500;600;700&display=swap';
document.head.appendChild(fontLink);

/* ─── Types ──────────────────────────────────────────────────────────── */
type ResourceType = 'VIDEO' | 'BLOG' | 'PRACTICE_TEST';
type SkillType = 'LISTENING' | 'READING' | 'WRITING' | 'SPEAKING';
type LevelType = 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED';

interface RecommendationItem {
  id: string;
  title: string;
  url: string;
  description: string | null;
  thumbnail_url: string | null;
  source: string | null;
  duration_min: number | null;
  type: ResourceType;
  skill_type: SkillType;
  level: LevelType;
  is_active: boolean;
}

interface RecommendationsData {
  levels: Record<SkillType, LevelType>;
  data: Record<SkillType, RecommendationItem[]>;
  pagination: {
    page: number;
    limit: number;
    totalItems: Record<SkillType, number>;
    totalPages: Record<SkillType, number>;
  };
}

const SKILLS: { id: SkillType; label: string; icon: React.ReactNode }[] = [
  { id: 'LISTENING', label: 'Listening', icon: <Headphones className="w-4 h-4" /> },
  { id: 'READING',   label: 'Reading',   icon: <BookOpen   className="w-4 h-4" /> },
  { id: 'WRITING',   label: 'Writing',   icon: <PenLine    className="w-4 h-4" /> },
  { id: 'SPEAKING',  label: 'Speaking',  icon: <Mic        className="w-4 h-4" /> },
];

const SKILL_THEME: Record<SkillType, { activeBg: string, activeBorder: string, activeText: string, glowColor: string }> = {
  LISTENING: { activeBg: 'bg-emerald-50 dark:bg-emerald-500/10', activeBorder: 'border-emerald-200 dark:border-emerald-500/30', activeText: 'text-emerald-700 dark:text-emerald-400', glowColor: 'bg-emerald-500 shadow-[0_0_8px_2px_rgba(16,185,129,0.6)]' },
  READING:   { activeBg: 'bg-blue-50 dark:bg-blue-500/10',       activeBorder: 'border-blue-200 dark:border-blue-500/30',       activeText: 'text-blue-700 dark:text-blue-400',       glowColor: 'bg-blue-500 shadow-[0_0_8px_2px_rgba(59,130,246,0.6)]' },
  WRITING:   { activeBg: 'bg-rose-50 dark:bg-rose-500/10',       activeBorder: 'border-rose-200 dark:border-rose-500/30',       activeText: 'text-rose-700 dark:text-rose-400',       glowColor: 'bg-rose-500 shadow-[0_0_8px_2px_rgba(244,63,94,0.6)]' },
  SPEAKING:  { activeBg: 'bg-amber-50 dark:bg-amber-500/10',     activeBorder: 'border-amber-200 dark:border-amber-500/30',     activeText: 'text-amber-700 dark:text-amber-400',     glowColor: 'bg-amber-500 shadow-[0_0_8px_2px_rgba(245,158,11,0.6)]' },
};

const LEVEL_META: Record<LevelType, { label: string; bg: string; border: string; text: string }> = {
  BEGINNER:     { label: 'Beginner',     bg: 'bg-emerald-50 dark:bg-emerald-500/10', border: 'border-emerald-200 dark:border-emerald-500/30', text: 'text-emerald-600 dark:text-emerald-400' },
  INTERMEDIATE: { label: 'Intermediate', bg: 'bg-blue-50 dark:bg-blue-500/10',       border: 'border-blue-200 dark:border-blue-500/30',       text: 'text-blue-600 dark:text-blue-400' },
  ADVANCED:     { label: 'Advanced',     bg: 'bg-rose-50 dark:bg-rose-500/10',       border: 'border-rose-200 dark:border-rose-500/30',       text: 'text-rose-600 dark:text-rose-400' },
};

/* ─── Sub-components ─────────────────────────────────────────────────── */

function ResourceTypePill({ type }: { type: ResourceType }) {
  const map = {
    VIDEO:         { icon: <Youtube className="w-3 h-3" />,       label: 'Video',    classes: 'bg-red-50 text-red-600 border-red-200 dark:bg-red-500/15 dark:text-red-400 dark:border-red-500/30' },
    BLOG:          { icon: <FileText className="w-3 h-3" />,       label: 'Article',  classes: 'bg-blue-50 text-blue-600 border-blue-200 dark:bg-blue-500/15 dark:text-blue-400 dark:border-blue-500/30' },
    PRACTICE_TEST: { icon: <ClipboardList className="w-3 h-3" />, label: 'Practice', classes: 'bg-amber-50 text-amber-600 border-amber-200 dark:bg-amber-500/15 dark:text-amber-400 dark:border-amber-500/30' },
  };
  const m = map[type];
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold tracking-wide font-outfit border ${m.classes}`}>
      {m.icon} {m.label}
    </span>
  );
}

function SkillTab({ skill, active, onClick }: { skill: (typeof SKILLS)[0]; active: boolean; onClick: () => void }) {
  const theme = SKILL_THEME[skill.id];
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-2 px-5 py-2.5 rounded-full text-[13px] font-outfit cursor-pointer transition-all duration-200 tracking-wide relative overflow-hidden whitespace-nowrap border 
      ${active
        ? `${theme.activeBg} ${theme.activeText} ${theme.activeBorder} font-bold`
        : 'border-transparent text-slate-500 dark:text-slate-400 font-medium hover:bg-slate-100 dark:hover:bg-slate-800'
      }`}
    >
      {active && <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${theme.glowColor}`} />}
      {skill.icon}
      <span className="hidden sm:inline">{skill.label}</span>
    </button>
  );
}

function ResourceCard({ item, isCompleted, onToggle }: { item: RecommendationItem; isCompleted: boolean; onToggle: () => void }) {
  const getEmbedId = (url: string) => {
    try {
      const u = new URL(url);
      if (u.hostname.includes('youtube.com')) return u.searchParams.get('v');
      if (u.hostname.includes('youtu.be')) return u.pathname.slice(1);
    } catch { /* ignore */ }
    return null;
  };

  const embedId = item.type === 'VIDEO' ? getEmbedId(item.url) : null;
  const levelM  = LEVEL_META[item.level];

  return (
    <div className={`relative rounded-[20px] overflow-hidden flex flex-col transition-all duration-300 cursor-default group border
      ${isCompleted
        ? 'bg-slate-50 border-slate-200 dark:bg-slate-900/50 dark:border-white/5 opacity-75 scale-[0.985]'
        : 'bg-white border-slate-200 dark:bg-slate-900 dark:border-white/10 hover:-translate-y-1 hover:shadow-xl hover:border-slate-300 dark:hover:border-white/20'
      }`}
    >
      {/* ── Media ── */}
      <div className="relative w-full aspect-[16/9] shrink-0 overflow-hidden bg-slate-100 dark:bg-[#0a0f1e]">
        {embedId ? (
          <iframe width="100%" height="100%" src={`https://www.youtube.com/embed/${embedId}`} title={item.title}
            frameBorder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen className={`block w-full h-full ${isCompleted ? 'grayscale opacity-80' : ''}`} />
        ) : item.thumbnail_url ? (
          <img src={item.thumbnail_url} alt={item.title}
            className={`w-full h-full object-cover transition-transform duration-500 group-hover:scale-105 ${isCompleted ? 'grayscale opacity-80' : ''}`} />
        ) : (
          <div className="w-full h-full flex items-center justify-center cursor-pointer bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-800 dark:to-indigo-950/40"
            onClick={() => window.open(item.url, '_blank')}>
            {item.type === 'BLOG'
              ? <FileText className="w-10 h-10 text-slate-400 dark:text-blue-500/30" />
              : <ClipboardList className="w-10 h-10 text-slate-400 dark:text-amber-500/30" />
            }
          </div>
        )}
        <div className="absolute inset-x-0 bottom-0 h-12 bg-gradient-to-t from-white/60 dark:from-slate-900/90 to-transparent pointer-events-none" />
        <div className="absolute top-3 left-3 z-10"><ResourceTypePill type={item.type} /></div>
        {isCompleted && (
          <div className="absolute top-3 right-3 z-10 bg-emerald-100 dark:bg-emerald-500/20 border border-emerald-200 dark:border-emerald-500/40 rounded-full p-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
          </div>
        )}
      </div>

      {/* ── Body ── */}
      <div className="p-5 flex flex-col flex-1">
        <div className="mb-2.5">
          <span className="text-[10px] font-bold tracking-widest uppercase text-indigo-600 dark:text-indigo-400 font-outfit">
            {item.source || 'Curated'}
          </span>
        </div>
        <h4 onClick={() => window.open(item.url, '_blank')}
          className={`font-fraunces text-[17px] font-bold leading-snug mb-2.5 cursor-pointer transition-colors line-clamp-2
          ${isCompleted ? 'text-slate-500 dark:text-slate-400' : 'text-slate-800 dark:text-slate-100 hover:text-indigo-600 dark:hover:text-indigo-400'}`}>
          {item.title}
        </h4>
        <p className={`text-[13px] leading-relaxed font-outfit line-clamp-2 flex-1 mb-4
          ${isCompleted ? 'text-slate-400 dark:text-slate-500' : 'text-slate-600 dark:text-slate-400'}`}>
          {item.description || 'Refine your technique and improve your overall band score with this targeted resource.'}
        </p>
        <div className="pt-3.5 border-t border-slate-100 dark:border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold tracking-wider uppercase border font-outfit ${levelM.bg} ${levelM.border} ${levelM.text}`}>
              {levelM.label}
            </span>
            {item.duration_min && (
              <span className="inline-flex items-center gap-1 text-[11px] font-outfit text-slate-500 dark:text-slate-400">
                <Clock className="w-3 h-3" />{item.duration_min}m
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button onClick={onToggle} title={isCompleted ? 'Mark unread' : 'Mark complete'}
              className={`w-8 h-8 rounded-full flex items-center justify-center cursor-pointer transition-all border 
              ${isCompleted
                ? 'bg-emerald-50 border-emerald-200 text-emerald-600 dark:bg-emerald-500/15 dark:border-emerald-500/30 dark:text-emerald-400'
                : 'bg-slate-50 border-slate-200 text-slate-400 hover:text-emerald-600 dark:bg-white/5 dark:border-white/10 dark:hover:text-emerald-400'}`}>
              <CheckCircle2 className="w-4 h-4" />
            </button>
            <button onClick={() => window.open(item.url, '_blank')}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold font-outfit cursor-pointer transition-all border bg-indigo-50 border-indigo-100 text-indigo-600 hover:bg-indigo-100 dark:bg-indigo-500/15 dark:border-indigo-500/30 dark:text-indigo-300 dark:hover:bg-indigo-500/30">
              View <ArrowUpRight className="w-3 h-3" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function SkeletonCard() {
  return (
    <div className="rounded-[20px] overflow-hidden bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-white/5 shadow-sm">
      <div className="aspect-video bg-slate-100 dark:bg-slate-800 animate-pulse" />
      <div className="p-5">
        <div className="h-2.5 w-16 bg-slate-200 dark:bg-slate-800 rounded-md mb-3.5 animate-pulse" />
        <div className="h-5 w-4/5 bg-slate-200 dark:bg-slate-800 rounded-md mb-2 animate-pulse" />
        <div className="h-5 w-3/5 bg-slate-200 dark:bg-slate-800 rounded-md mb-4 animate-pulse" />
        <div className="h-3 w-11/12 bg-slate-200 dark:bg-slate-800 rounded-md mb-1.5 animate-pulse" />
        <div className="h-3 w-3/4 bg-slate-200 dark:bg-slate-800 rounded-md animate-pulse" />
      </div>
    </div>
  );
}

/* ─── Main Component ─────────────────────────────────────────────────── */
export default function Suggestions() {
  const navigate = useNavigate();

  const [recommendationsData, setRecommendationsData] = useState<RecommendationsData | null>(null);
  const [activeTab, setActiveTab] = useState<SkillType>('LISTENING');
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const LIMIT = 6;

  const [completedResources, setCompletedResources] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('completed_recommendations');
      return saved ? JSON.parse(saved) : [];
    } catch { return []; }
  });

  const toggleComplete = (id: string) => {
    const updated = completedResources.includes(id)
      ? completedResources.filter(r => r !== id)
      : [...completedResources, id];
    setCompletedResources(updated);
    localStorage.setItem('completed_recommendations', JSON.stringify(updated));
  };

  const fetchRecommendations = async (currentPage: number) => {
    try {
      setLoading(true);
      const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:4000';
      const url = `${backendUrl}/api/student/recommendations?page=${currentPage}&limit=${LIMIT}`;
      const res = await callBackend(url);
      if (res.success) setRecommendationsData(res);
    } catch (err) {
      console.error('Failed to load recommendations:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchRecommendations(page); }, [page]);

  const activeItems = recommendationsData?.data[activeTab] || [];
  const activeLevel = (recommendationsData?.levels[activeTab] || 'BEGINNER') as LevelType;
  const totalPages  = recommendationsData?.pagination.totalPages[activeTab] || 1;

  return (
    // Suggestions has ambient background orbs that sit behind everything,
    // so we keep its own outer div for the background color + orbs,
    // then use StudentLayout inside it (which provides the sidebar + topbar).
    <div className="min-h-screen bg-slate-50 dark:bg-[#060B18] transition-colors duration-300 font-outfit text-slate-900 dark:text-slate-50">

      {/* ── Ambient background orbs ── */}
      <div aria-hidden className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute -top-[20%] -left-[10%] w-[700px] h-[700px] rounded-full bg-indigo-500/5 dark:bg-indigo-500/10 blur-[80px]" />
        <div className="absolute top-[40%] -right-[15%] w-[600px] h-[600px] rounded-full bg-purple-500/5 dark:bg-purple-500/10 blur-[80px]" />
        <div className="absolute -bottom-[10%] left-[30%] w-[500px] h-[500px] rounded-full bg-sky-500/5 dark:bg-sky-500/5 blur-[80px]" />
      </div>

      <StudentLayout
        activeTab="suggestion"
        mainClassName="flex-1 px-6 py-8 md:p-10 lg:py-12 max-w-7xl mx-auto w-full animate-in fade-in duration-500 relative z-10"
      >

        {/* ════════ HERO BANNER ════════ */}
        <div className="relative rounded-3xl overflow-hidden px-8 py-10 md:px-14 md:py-12 mb-12 border bg-gradient-to-br from-white via-indigo-50/50 to-purple-50/50 border-indigo-100 shadow-sm dark:from-[#0f0a2e] dark:via-[#1a0a3d] dark:to-[#0d1a3a] dark:border-indigo-500/20 dark:shadow-none">
          <div className="hidden dark:block absolute -top-[40%] right-[5%] w-[400px] h-[400px] rounded-full bg-purple-500/20 blur-[60px] z-0" />
          <div className="hidden dark:block absolute -bottom-[30%] left-[20%] w-[300px] h-[300px] rounded-full bg-indigo-500/20 blur-[50px] z-0" />

          <div className="relative z-10 flex items-center justify-between gap-8">
            <div className="max-w-[560px]">
              <div className="inline-flex items-center gap-2 bg-amber-50 border border-amber-200 dark:bg-amber-400/10 dark:border-amber-400/20 rounded-full px-3.5 py-1.5 mb-5">
                <Sparkles className="w-3 h-3 text-amber-500 dark:text-amber-400" />
                <span className="text-[11px] font-bold text-amber-600 dark:text-amber-400 tracking-widest uppercase">AI‑Curated Path</span>
              </div>
              <h1 className="font-fraunces text-3xl md:text-5xl font-black leading-tight text-slate-900 dark:text-[#F1F5F9] mb-4 tracking-tight">
                Targeted Learning <br className="hidden sm:block" />
                <span className="bg-gradient-to-r from-indigo-600 to-purple-600 dark:from-indigo-400 dark:to-purple-400 bg-clip-text text-transparent">
                  Resources
                </span>
              </h1>
              <p className="text-sm md:text-[15px] leading-relaxed text-slate-600 dark:text-slate-400 font-medium max-w-[460px]">
                We've analyzed your diagnostic results. These curated resources are calibrated to your exact weak points — follow them to unlock your target band score.
              </p>
            </div>
            <div className="hidden md:flex shrink-0 items-center justify-center w-[100px] h-[100px] rounded-full bg-indigo-50 border border-indigo-100 dark:bg-indigo-500/15 dark:border-indigo-500/25 backdrop-blur-md shadow-inner">
              <BrainCircuit className="w-12 h-12 text-indigo-500 dark:text-indigo-400" />
            </div>
          </div>

          <div className="relative z-10 flex flex-wrap gap-8 mt-10 pt-7 border-t border-slate-200 dark:border-white/10">
            {[
              { icon: <Target className="w-3.5 h-3.5" />,      label: 'Skill Areas', val: '4 Active' },
              { icon: <Zap className="w-3.5 h-3.5" />,         label: 'Resources',   val: '24+ Curated' },
              { icon: <CheckCircle2 className="w-3.5 h-3.5" />, label: 'Completed',  val: `${completedResources.length} Done` },
            ].map((s, i) => (
              <div key={i} className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-indigo-100 border border-indigo-200 text-indigo-600 dark:bg-indigo-500/15 dark:border-indigo-500/20 dark:text-indigo-400">
                  {s.icon}
                </div>
                <div>
                  <div className="text-[11px] text-slate-500 dark:text-slate-400 font-semibold tracking-wider uppercase">{s.label}</div>
                  <div className="text-sm text-slate-800 dark:text-slate-200 font-bold leading-tight">{s.val}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ════════ CONTROLS ROW ════════ */}
        <div className="flex flex-wrap items-center justify-between gap-4 mb-10">
          <div className="inline-flex flex-wrap items-center bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-full p-1.5 shadow-sm gap-1">
            {SKILLS.map(s => (
              <SkillTab key={s.id} skill={s} active={activeTab === s.id} onClick={() => { setActiveTab(s.id); setPage(1); }} />
            ))}
          </div>
          {!loading && recommendationsData && (
            <div className="inline-flex items-center gap-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-2xl px-4 py-2.5 shadow-sm">
              <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${LEVEL_META[activeLevel].bg} border ${LEVEL_META[activeLevel].border} ${LEVEL_META[activeLevel].text}`}>
                <Target className="w-3.5 h-3.5" />
              </div>
              <div>
                <div className="text-[10px] text-slate-500 dark:text-slate-400 font-semibold tracking-wider uppercase">Optimized for</div>
                <div className={`text-[13px] font-extrabold tracking-wide uppercase ${LEVEL_META[activeLevel].text}`}>
                  {LEVEL_META[activeLevel].label}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* ════════ CARDS GRID ════════ */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {[1,2,3,4,5,6].map(n => <SkeletonCard key={n} />)}
          </div>
        ) : activeItems.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 px-6 bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-white/5 rounded-3xl text-center shadow-sm">
            <div className="w-20 h-20 rounded-full bg-indigo-50 dark:bg-slate-800 flex items-center justify-center mb-6">
              <BookOpen className="w-9 h-9 text-indigo-300 dark:text-indigo-500/40" />
            </div>
            <h3 className="font-fraunces text-2xl font-bold text-slate-800 dark:text-slate-200 mb-2">Nothing here yet</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 max-w-[360px] leading-relaxed">
              You've mastered this area, or we're preparing new targeted materials for <strong className="text-slate-700 dark:text-slate-300">{activeTab.toLowerCase()}</strong>. Keep crushing those drills!
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {activeItems.map(item => (
              <ResourceCard key={item.id} item={item} isCompleted={completedResources.includes(item.id)} onToggle={() => toggleComplete(item.id)} />
            ))}
          </div>
        )}

        {/* ════════ PAGINATION ════════ */}
        {!loading && totalPages > 1 && (
          <div className="mt-14 flex items-center justify-center gap-3">
            <button disabled={page <= 1} onClick={() => setPage(p => p - 1)}
              className="w-10 h-10 rounded-xl flex items-center justify-center bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 dark:bg-slate-900 dark:border-white/10 dark:text-slate-300 dark:hover:bg-white/5 disabled:opacity-40 disabled:cursor-not-allowed transition-all">
              <ChevronLeft className="w-4.5 h-4.5" />
            </button>
            <div className="flex items-center gap-2">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
                <button key={p} onClick={() => setPage(p)}
                  className={`h-2 rounded-full transition-all duration-300 ${p === page ? 'w-7 bg-indigo-500 shadow-[0_0_8px_rgba(99,102,241,0.5)]' : 'w-2 bg-indigo-200 dark:bg-indigo-500/20'}`} />
              ))}
            </div>
            <button disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}
              className="w-10 h-10 rounded-xl flex items-center justify-center bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 dark:bg-slate-900 dark:border-white/10 dark:text-slate-300 dark:hover:bg-white/5 disabled:opacity-40 disabled:cursor-not-allowed transition-all">
              <ChevronRight className="w-4.5 h-4.5" />
            </button>
          </div>
        )}

      </StudentLayout>
    </div>
  );
}