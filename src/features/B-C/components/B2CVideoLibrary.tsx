// ─────────────────────────────────────────────────────────────────────────────
// FILE: src/features/B-C/components/B2CVideoLibrary.tsx
// CREATE this file at that path.
//
// This component renders the YouTube video library section inside
// B2CStudentDashboard. Data comes from Jincy's Google Sheet via a
// backend proxy endpoint. Until the endpoint is live, mock data is used.
// ─────────────────────────────────────────────────────────────────────────────

import React, { useState, useEffect, useRef } from 'react';
import {
  Play, ExternalLink, Tag, Clock, BookOpen,
  ChevronLeft, ChevronRight, Search, Filter,
  Sparkles, Eye, CheckCircle2, Lock, X,
} from 'lucide-react';
import { cn } from '@/shared/utils';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface VideoEntry {
  id:           string;   // YouTube video ID  e.g. "dQw4w9WgXcQ"
  title:        string;
  channel:      string;
  thumbnail:    string;   // YouTube thumbnail URL or custom
  duration:     string;   // e.g. "4:32"
  skill:        'Reading' | 'Writing' | 'Listening' | 'Speaking' | 'Vocabulary' | 'Grammar';
  sub_skill:    string;   // e.g. "Inference", "Coherence", "Fillers"
  band_target:  string;   // e.g. "6.0–7.0"
  keywords:     string[]; // highlighted keyword chips
  description:  string;   // 1–2 sentence summary shown below title
  watched?:     boolean;
}

// ─── Mock data (replace with real API call when Jincy's sheet is ready) ──────
// Structure mirrors the Google Sheet columns:
//   Video ID | Title | Channel | Duration | Skill | Sub-skill | Band Target | Keywords | Description

const MOCK_VIDEOS: VideoEntry[] = [
  {
    id: 'K7FQL3tFGMI',
    title: 'How to Answer True / False / Not Given Questions',
    channel: 'IELTS Liz',
    thumbnail: `https://img.youtube.com/vi/K7FQL3tFGMI/mqdefault.jpg`,
    duration: '5:14',
    skill: 'Reading',
    sub_skill: 'Inference',
    band_target: '6.0–7.5',
    keywords: ['NOT GIVEN trap', 'paraphrase', 'scope distractor', 'inference'],
    description: 'Explains the exact difference between FALSE and NOT GIVEN — the most common student confusion in IELTS Reading.',
    watched: false,
  },
  {
    id: 'oVDHGRxMp94',
    title: 'IELTS Writing Task 2 — Band 7 Coherence Secrets',
    channel: 'E2 IELTS',
    thumbnail: `https://img.youtube.com/vi/oVDHGRxMp94/mqdefault.jpg`,
    duration: '8:45',
    skill: 'Writing',
    sub_skill: 'Coherence',
    band_target: '6.5–7.5',
    keywords: ['connector', 'cohesion', 'topic sentence', 'paragraph structure'],
    description: 'Breaks down exactly how to use connectors and topic sentences to reach band 7 Coherence & Cohesion.',
    watched: true,
  },
  {
    id: 'C2IikPGTmHg',
    title: 'Vocabulary for IELTS — Academic Word List in Context',
    channel: 'IELTS Ryan',
    thumbnail: `https://img.youtube.com/vi/C2IikPGTmHg/mqdefault.jpg`,
    duration: '6:30',
    skill: 'Vocabulary',
    sub_skill: 'Lexical Resource',
    band_target: '6.0–8.0',
    keywords: ['AWL', 'lexical resource', 'paraphrase', 'collocation', 'synonym'],
    description: 'Shows how to use Academic Word List words naturally in both Writing and Speaking to push your Lexical Resource score.',
    watched: false,
  },
  {
    id: 'vxGMQS-2VGc',
    title: 'IELTS Speaking Part 2 — How to Speak for 2 Minutes',
    channel: 'IELTS Advantage',
    thumbnail: `https://img.youtube.com/vi/vxGMQS-2VGc/mqdefault.jpg`,
    duration: '7:02',
    skill: 'Speaking',
    sub_skill: 'Fluency',
    band_target: '5.5–7.0',
    keywords: ['filler words', 'fluency', 'cue card', 'connected speech', 'Part 2'],
    description: 'Teaches a simple PEEL structure to fill 2 minutes fluently in Speaking Part 2 without using filler words.',
    watched: false,
  },
  {
    id: 'sPOSbExE3Mk',
    title: 'IELTS Listening — How to Predict Answers Before You Hear Them',
    channel: 'IELTS Simon',
    thumbnail: `https://img.youtube.com/vi/sPOSbExE3Mk/mqdefault.jpg`,
    duration: '4:50',
    skill: 'Listening',
    sub_skill: 'Prediction',
    band_target: '5.0–7.0',
    keywords: ['prediction', 'distractor', 'keyword spotting', 'gap fill'],
    description: 'The prediction technique that lets you pre-read questions and anticipate the type of answer before the audio starts.',
    watched: false,
  },
  {
    id: 'HnDNh1dFSiQ',
    title: 'Grammar for IELTS Writing — Complex Sentences Made Easy',
    channel: 'British Council',
    thumbnail: `https://img.youtube.com/vi/HnDNh1dFSiQ/mqdefault.jpg`,
    duration: '9:18',
    skill: 'Grammar',
    sub_skill: 'Complex Sentences',
    band_target: '5.5–7.0',
    keywords: ['subordinate clause', 'relative clause', 'passive voice', 'GRA score'],
    description: 'Demonstrates 4 sentence structures that examiner mark-schemes specifically reward under Grammatical Range & Accuracy.',
    watched: true,
  },
];

const SKILL_COLORS: Record<string, { bg: string; text: string; border: string; dot: string }> = {
  Reading:    { bg: 'bg-violet-50 dark:bg-violet-500/10',  text: 'text-violet-600 dark:text-violet-400',  border: 'border-violet-200 dark:border-violet-500/30',  dot: 'bg-violet-500'  },
  Writing:    { bg: 'bg-amber-50 dark:bg-amber-500/10',    text: 'text-amber-600 dark:text-amber-400',    border: 'border-amber-200 dark:border-amber-500/30',    dot: 'bg-amber-500'   },
  Listening:  { bg: 'bg-sky-50 dark:bg-sky-500/10',        text: 'text-sky-600 dark:text-sky-400',        border: 'border-sky-200 dark:border-sky-500/30',        dot: 'bg-sky-500'     },
  Speaking:   { bg: 'bg-rose-50 dark:bg-rose-500/10',      text: 'text-rose-600 dark:text-rose-400',      border: 'border-rose-200 dark:border-rose-500/30',      dot: 'bg-rose-500'    },
  Vocabulary: { bg: 'bg-teal-50 dark:bg-teal-500/10',      text: 'text-teal-600 dark:text-teal-400',      border: 'border-teal-200 dark:border-teal-500/30',      dot: 'bg-teal-500'    },
  Grammar:    { bg: 'bg-indigo-50 dark:bg-indigo-500/10',  text: 'text-indigo-600 dark:text-indigo-400',  border: 'border-indigo-200 dark:border-indigo-500/30',  dot: 'bg-indigo-500'  },
};

const ALL_SKILLS = ['All', 'Reading', 'Writing', 'Listening', 'Speaking', 'Vocabulary', 'Grammar'] as const;

// ─── VideoModal ───────────────────────────────────────────────────────────────
// Embedded YouTube player with keyword highlight panel

interface VideoModalProps {
  video:    VideoEntry;
  onClose:  () => void;
  onWatch:  (id: string) => void;
}

const VideoModal = ({ video, onClose, onWatch }: VideoModalProps) => {
  const colors = SKILL_COLORS[video.skill];

  useEffect(() => {
    // Mark as watched when modal opens
    onWatch(video.id);
    // Lock scroll
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, [video.id, onWatch]);

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative z-10 w-full max-w-3xl bg-white dark:bg-slate-900 rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">

        {/* Close */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-20 w-8 h-8 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-full flex items-center justify-center transition-colors"
        >
          <X className="w-4 h-4 text-slate-600 dark:text-slate-400" />
        </button>

        {/* Embedded YouTube player */}
        <div className="relative w-full" style={{ paddingBottom: '56.25%' }}>
          <iframe
            className="absolute inset-0 w-full h-full"
            src={`https://www.youtube.com/embed/${video.id}?autoplay=1&rel=0`}
            title={video.title}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        </div>

        {/* Info panel */}
        <div className="p-5 space-y-4">

          {/* Title row */}
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
              <h3 className="text-base font-black text-slate-800 dark:text-white leading-snug mb-1">
                {video.title}
              </h3>
              <div className="flex items-center gap-2 text-xs text-slate-400 font-medium">
                <span>{video.channel}</span>
                <span>·</span>
                <Clock className="w-3 h-3" />
                <span>{video.duration}</span>
                <span>·</span>
                <span className={cn('font-bold', colors.text)}>Band {video.band_target}</span>
              </div>
            </div>
            <div className={cn('flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-bold', colors.bg, colors.text, colors.border)}>
              <div className={cn('w-1.5 h-1.5 rounded-full', colors.dot)} />
              {video.skill} · {video.sub_skill}
            </div>
          </div>

          {/* Description */}
          <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
            {video.description}
          </p>

          {/* Keyword highlights */}
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Tag className="w-3.5 h-3.5 text-indigo-400" />
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                Key concepts in this video
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              {video.keywords.map(kw => (
                <span
                  key={kw}
                  className={cn(
                    'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold border',
                    colors.bg, colors.text, colors.border
                  )}
                >
                  <Sparkles className="w-3 h-3" />
                  {kw}
                </span>
              ))}
            </div>
          </div>

          {/* Open in YouTube link */}
          <a
            href={`https://www.youtube.com/watch?v=${video.id}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 text-xs font-bold text-slate-400 hover:text-indigo-500 transition-colors"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            Open in YouTube
          </a>
        </div>
      </div>
    </div>
  );
};

// ─── VideoCard ────────────────────────────────────────────────────────────────

interface VideoCardProps {
  video:   VideoEntry;
  onPlay:  (video: VideoEntry) => void;
}

const VideoCard = ({ video, onPlay }: VideoCardProps) => {
  const colors = SKILL_COLORS[video.skill];

  return (
    <div
      className={cn(
        'group relative bg-white dark:bg-slate-900 rounded-2xl border overflow-hidden cursor-pointer transition-all duration-200 hover:shadow-md hover:scale-[1.01] shadow-sm',
        colors.border
      )}
      onClick={() => onPlay(video)}
    >
      {/* Thumbnail */}
      <div className="relative overflow-hidden">
        <img
          src={video.thumbnail}
          alt={video.title}
          className="w-full h-40 object-cover transition-transform duration-300 group-hover:scale-105"
          onError={e => {
            // Fallback if thumbnail fails to load
            (e.target as HTMLImageElement).src =
              `https://img.youtube.com/vi/${video.id}/hqdefault.jpg`;
          }}
        />

        {/* Overlay on hover */}
        <div className="absolute inset-0 bg-slate-950/40 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center">
          <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-lg">
            <Play className="w-5 h-5 text-slate-800 fill-slate-800 ml-0.5" />
          </div>
        </div>

        {/* Duration badge */}
        <div className="absolute bottom-2 right-2 bg-slate-950/80 text-white text-[10px] font-bold px-2 py-0.5 rounded-md">
          {video.duration}
        </div>

        {/* Watched badge */}
        {video.watched && (
          <div className="absolute top-2 left-2 flex items-center gap-1 bg-emerald-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
            <CheckCircle2 className="w-2.5 h-2.5" /> Watched
          </div>
        )}

        {/* Skill badge */}
        <div className={cn('absolute top-2 right-2 text-[9px] font-black px-2 py-0.5 rounded-full', colors.bg, colors.text, video.watched ? 'hidden' : '')}>
          {video.skill}
        </div>
      </div>

      {/* Card body */}
      <div className="p-4">
        <p className="text-xs text-slate-400 font-medium mb-1">{video.channel} · Band {video.band_target}</p>
        <h3 className="text-sm font-bold text-slate-800 dark:text-white leading-snug line-clamp-2 mb-2 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
          {video.title}
        </h3>
        <p className="text-xs text-slate-400 dark:text-slate-500 line-clamp-2 leading-relaxed mb-3">
          {video.description}
        </p>

        {/* Keyword chips — show first 3 */}
        <div className="flex flex-wrap gap-1.5">
          {video.keywords.slice(0, 3).map(kw => (
            <span
              key={kw}
              className={cn('text-[9px] font-bold px-2 py-1 rounded-full border', colors.bg, colors.text, colors.border)}
            >
              {kw}
            </span>
          ))}
          {video.keywords.length > 3 && (
            <span className="text-[9px] font-bold px-2 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-400 border border-slate-200 dark:border-slate-700">
              +{video.keywords.length - 3}
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

// ─── Main component ───────────────────────────────────────────────────────────

interface B2CVideoLibraryProps {
  className?: string;
}

export default function B2CVideoLibrary({ className }: B2CVideoLibraryProps) {
  const [videos,        setVideos]        = useState<VideoEntry[]>(MOCK_VIDEOS);
  const [activeSkill,   setActiveSkill]   = useState<string>('All');
  const [searchQuery,   setSearchQuery]   = useState('');
  const [activeVideo,   setActiveVideo]   = useState<VideoEntry | null>(null);
  const [loading,       setLoading]       = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // ── Fetch from backend (Jincy's Google Sheet proxy) ──────────────────────
  // TODO: Uncomment when Sarthak's endpoint is ready
  //
  // useEffect(() => {
  //   const fetchVideos = async () => {
  //     setLoading(true);
  //     try {
  //       const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:4000';
  //       const res = await fetch(`${backendUrl}/api/b2c/video-library`);
  //       const data = await res.json();
  //       if (data.videos) setVideos(data.videos);
  //     } catch (err) {
  //       console.error('Failed to fetch video library', err);
  //       // Falls back to MOCK_VIDEOS already in state
  //     } finally {
  //       setLoading(false);
  //     }
  //   };
  //   fetchVideos();
  // }, []);

  const handleWatch = (id: string) => {
    setVideos(prev =>
      prev.map(v => v.id === id ? { ...v, watched: true } : v)
    );
  };

  // ── Filter logic ──────────────────────────────────────────────────────────
  const filtered = videos.filter(v => {
    const matchSkill   = activeSkill === 'All' || v.skill === activeSkill;
    const q            = searchQuery.toLowerCase();
    const matchSearch  = !q
      || v.title.toLowerCase().includes(q)
      || v.sub_skill.toLowerCase().includes(q)
      || v.keywords.some(kw => kw.toLowerCase().includes(q))
      || v.description.toLowerCase().includes(q);
    return matchSkill && matchSearch;
  });

  const watchedCount = videos.filter(v => v.watched).length;

  return (
    <section className={cn('space-y-5', className)}>

      {/* ── Section header ──────────────────────────────────────────────── */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h2 className="text-lg font-black text-slate-800 dark:text-white uppercase tracking-tight flex items-center gap-2">
            <Play className="w-5 h-5 text-indigo-500 fill-indigo-500" />
            Video Library
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-0.5">
            Curated IELTS explanations — each video targets one skill concept
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/30 rounded-full px-3 py-1.5">
            <Eye className="w-3.5 h-3.5 text-emerald-500" />
            <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
              {watchedCount} / {videos.length} watched
            </span>
          </div>
        </div>
      </div>

      {/* ── Search + filter bar ──────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row gap-3">

        {/* Search */}
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search by skill, keyword, or topic..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm text-slate-800 dark:text-white placeholder:text-slate-400 focus:outline-none focus:border-indigo-400 focus:ring-1 focus:ring-indigo-400 transition-all"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Skill filter pills — horizontally scrollable */}
        <div
          ref={scrollRef}
          className="flex items-center gap-2 overflow-x-auto pb-0.5 scrollbar-hide"
        >
          {ALL_SKILLS.map(skill => {
            const isActive = skill === activeSkill;
            const colors   = skill !== 'All' ? SKILL_COLORS[skill] : null;
            return (
              <button
                key={skill}
                onClick={() => setActiveSkill(skill)}
                className={cn(
                  'flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-bold border transition-all',
                  isActive
                    ? colors
                      ? cn(colors.bg, colors.text, colors.border, 'shadow-sm')
                      : 'bg-indigo-500 text-white border-indigo-500 shadow-sm'
                    : 'bg-white dark:bg-slate-900 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:border-slate-300'
                )}
              >
                {skill !== 'All' && colors && isActive && (
                  <span className={cn('inline-block w-1.5 h-1.5 rounded-full mr-1.5 -mb-0.5', colors.dot)} />
                )}
                {skill}
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Video grid ──────────────────────────────────────────────────── */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="rounded-2xl border border-slate-100 dark:border-slate-800 overflow-hidden animate-pulse">
              <div className="h-40 bg-slate-100 dark:bg-slate-800" />
              <div className="p-4 space-y-2">
                <div className="h-3 bg-slate-100 dark:bg-slate-800 rounded w-1/3" />
                <div className="h-4 bg-slate-100 dark:bg-slate-800 rounded w-3/4" />
                <div className="h-3 bg-slate-100 dark:bg-slate-800 rounded w-full" />
              </div>
            </div>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800">
          <BookOpen className="w-10 h-10 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
          <p className="text-sm font-bold text-slate-500 dark:text-slate-400">No videos match your search.</p>
          <button
            onClick={() => { setSearchQuery(''); setActiveSkill('All'); }}
            className="mt-3 text-xs font-bold text-indigo-500 hover:text-indigo-600 transition-colors"
          >
            Clear filters
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map(video => (
            <VideoCard
              key={video.id}
              video={video}
              onPlay={v => setActiveVideo(v)}
            />
          ))}
        </div>
      )}

      {/* Results count */}
      {!loading && filtered.length > 0 && (
        <p className="text-xs text-slate-400 dark:text-slate-500 text-center font-medium">
          Showing {filtered.length} of {videos.length} videos
          {activeSkill !== 'All' && ` · Filtered by ${activeSkill}`}
          {searchQuery && ` · "${searchQuery}"`}
        </p>
      )}

      {/* ── Video modal ──────────────────────────────────────────────────── */}
      {activeVideo && (
        <VideoModal
          video={activeVideo}
          onClose={() => setActiveVideo(null)}
          onWatch={handleWatch}
        />
      )}
    </section>
  );
}