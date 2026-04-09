import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { StudentSidebar } from './dashboard/StudentSidebar';
import { StudentTopbar } from './dashboard/StudentTopbar';
import { Button } from '@/shared/components/ui/button';
import { Card, CardContent } from '@/shared/components/ui/card';
import { Badge } from '@/shared/components/ui/badge';
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
  ClipboardList
} from 'lucide-react';

// --- Types ---
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

// Ensure the standard skills array is safe to iterate
const SKILLS: { id: SkillType; label: string; icon: React.ReactNode }[] = [
  { id: 'LISTENING', label: 'Listening', icon: <Headphones className="w-4 h-4" /> },
  { id: 'READING', label: 'Reading', icon: <BookOpen className="w-4 h-4" /> },
  { id: 'WRITING', label: 'Writing', icon: <PenLine className="w-4 h-4" /> },
  { id: 'SPEAKING', label: 'Speaking', icon: <Mic className="w-4 h-4" /> }
];

export default function Suggestions() {
  const navigate = useNavigate();
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  
  // State for fetched data
  const [recommendationsData, setRecommendationsData] = useState<RecommendationsData | null>(null);
  const [activeTab, setActiveTab] = useState<SkillType>('LISTENING');
  const [loading, setLoading] = useState(true);

  // Pagination state shared across tabs (for simplicity, we keep a global page)
  const [page, setPage] = useState(1);
  const LIMIT = 6;

  // Track completed IDs inside localstate/localStorage
  const [completedResources, setCompletedResources] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('completed_recommendations');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const toggleComplete = (id: string) => {
    const updated = completedResources.includes(id) 
      ? completedResources.filter(rId => rId !== id) 
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
      if (res.success) {
        setRecommendationsData(res);
      }
    } catch (error) {
      console.error('Failed to load recommendations:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRecommendations(page);
  }, [page]);

  const activeItems = recommendationsData?.data[activeTab] || [];
  const activeLevel = recommendationsData?.levels[activeTab] || 'BEGINNER';
  const totalPages = recommendationsData?.pagination.totalPages[activeTab] || 1;

  // Helper method to extract YouTube video ID
  const getEmbedId = (url: string) => {
    try {
      const parsedUrl = new URL(url);
      if (parsedUrl.hostname.includes('youtube.com')) {
        return parsedUrl.searchParams.get('v');
      }
      if (parsedUrl.hostname.includes('youtu.be')) {
        return parsedUrl.pathname.slice(1);
      }
    } catch {
      // ignore
    }
    return null;
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-slate-950 transition-colors duration-300">
      <StudentSidebar
        activeTab="suggestion"
        isCollapsed={isSidebarCollapsed}
        toggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
      />

      <div
        className={`transition-all duration-300 ${
          isSidebarCollapsed ? 'lg:pl-24' : 'lg:pl-72'
        } flex flex-col min-h-screen`}
      >
        <StudentTopbar onUpgradeClick={() => {}} />

        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full flex flex-col animate-in fade-in duration-500">

          {/* --- BANNER --- */}
          <div className="bg-[#7B61FF] rounded-2xl p-7 sm:p-10 text-white shadow-md relative overflow-hidden mb-8">
            <div className="absolute top-0 right-0 -mt-4 -mr-4 w-32 h-32 bg-white opacity-10 rounded-full blur-2xl"></div>
            <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div className="max-w-2xl">
                <h1 className="text-2xl sm:text-3xl font-bold mb-3 flex items-center gap-2">
                  Targeted Learning <BrainCircuit className="h-6 w-6 text-yellow-300" />
                </h1>
                <p className="text-indigo-50 text-sm sm:text-base leading-relaxed max-w-xl">
                  We've analyzed your recent diagnostic results. Focus on these curated resources to strengthen your weak points and reach your target band score.
                </p>
              </div>
            </div>
          </div>

          {/* --- SKILL TABS & LEVEL BADGE --- */}
          <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex flex-wrap items-center bg-white dark:bg-slate-900 border dark:border-slate-800 rounded-xl p-1 shadow-sm">
              {SKILLS.map((skill) => (
                <button
                  key={skill.id}
                  onClick={() => {
                    setActiveTab(skill.id);
                    setPage(1); // Reset page on tab switch
                  }}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-bold transition-all ${
                    activeTab === skill.id
                      ? 'bg-[#7B61FF] text-white shadow-md'
                      : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                  }`}
                >
                  {skill.icon} <span className="hidden sm:inline">{skill.label}</span>
                </button>
              ))}
            </div>

            {/* Level Indicator Badge */}
            {!loading && recommendationsData && (
              <div className="flex items-center gap-2 px-4 py-2 bg-indigo-50 dark:bg-[#7B61FF]/10 text-[#7B61FF] dark:text-[#9b86ff] rounded-xl border border-indigo-100 dark:border-[#7B61FF]/20">
                <Target className="w-4 h-4" />
                <span className="text-xs sm:text-sm font-bold">
                  Recommended items for: <span className="uppercase tracking-wider">{activeLevel.toLowerCase()}</span>
                </span>
              </div>
            )}
          </div>

          {/* --- LOADING SKELETON --- */}
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 animate-pulse">
              {[1, 2, 3].map((n) => (
                <div key={n} className="bg-slate-200 dark:bg-slate-800 h-80 rounded-xl"></div>
              ))}
            </div>
          ) : activeItems.length === 0 ? (
            /* --- EMPTY STATE --- */
            <div className="flex flex-col items-center justify-center p-12 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
              <BookOpen className="w-16 h-16 text-slate-300 dark:text-slate-700 mb-4" />
              <h3 className="text-lg font-bold text-slate-700 dark:text-slate-300">No Resources Found</h3>
              <p className="text-sm text-slate-500 text-center max-w-sm mt-2">
                We don't have any specific recommendations for {activeTab.toLowerCase()} at the moment. Keep practicing!
              </p>
            </div>
          ) : (
            /* --- RESOURCES GRID --- */
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {activeItems.map((suggestion) => {
                const isCompleted = completedResources.includes(suggestion.id);
                const embedId = getEmbedId(suggestion.url);

                return (
                  <Card
                    key={suggestion.id}
                    className={`border transition-all duration-300 flex flex-col h-full overflow-hidden group
                      ${
                        isCompleted
                          ? 'bg-slate-50 border-slate-200 dark:bg-slate-900/50 dark:border-slate-800 opacity-75'
                          : 'bg-white border-slate-200 dark:bg-slate-900 dark:border-slate-800 shadow-sm hover:shadow-md hover:border-[#7B61FF]/50 dark:hover:border-[#7B61FF]/50'
                      }`}
                  >
                    {/* Media Header */}
                    <div className="relative flex-shrink-0">
                      {suggestion.type === 'VIDEO' && embedId ? (
                        <div className="w-full aspect-video">
                          <iframe
                            width="100%"
                            height="100%"
                            src={`https://www.youtube.com/embed/${embedId}`}
                            title={suggestion.title}
                            frameBorder="0"
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                            referrerPolicy="strict-origin-when-cross-origin"
                            allowFullScreen
                            className="w-full h-full rounded-t-xl"
                          />
                        </div>
                      ) : (
                        <div
                          className="h-40 w-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center cursor-pointer relative overflow-hidden"
                          onClick={() => window.open(suggestion.url, '_blank')}
                        >
                          {suggestion.thumbnail_url ? (
                            <img src={suggestion.thumbnail_url} alt="Thumbnail" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                          ) : suggestion.type === 'BLOG' ? (
                            <FileText className="w-12 h-12 text-slate-300 dark:text-slate-600 group-hover:scale-110 transition-transform duration-300" />
                          ) : (
                            <ClipboardList className="w-12 h-12 text-slate-300 dark:text-slate-600 group-hover:scale-110 transition-transform duration-300" />
                          )}
                        </div>
                      )}

                      {/* Resource Type Badge */}
                      <div className="absolute top-3 left-3 z-10">
                        <Badge
                          className={`backdrop-blur-md shadow-sm border-none ${
                            suggestion.type === 'VIDEO'
                              ? 'bg-black/40 text-white hover:bg-black/50'
                              : suggestion.type === 'BLOG'
                                ? 'bg-blue-600/90 text-white hover:bg-blue-600/100'
                                : 'bg-amber-500/90 text-white hover:bg-amber-500/100'
                          }`}
                        >
                          {suggestion.type === 'VIDEO' && <span className="flex items-center gap-1"><Youtube className="w-3 h-3 text-red-500" /> Video</span>}
                          {suggestion.type === 'BLOG' && <span className="flex items-center gap-1"><FileText className="w-3 h-3 text-white" /> Article</span>}
                          {suggestion.type === 'PRACTICE_TEST' && <span className="flex items-center gap-1"><ClipboardList className="w-3 h-3 text-white" /> Practice Test</span>}
                        </Badge>
                      </div>
                    </div>

                    <CardContent className="flex flex-col flex-grow p-5">
                      <div className="mb-3">
                        <span className="text-xs font-semibold text-[#7B61FF] dark:text-[#9b86ff] bg-indigo-50 dark:bg-[#7B61FF]/10 px-2 py-1 rounded-md tracking-wider">
                          {suggestion.source || 'Curated Resource'}
                        </span>
                      </div>

                      <h4
                        onClick={() => window.open(suggestion.url, '_blank')}
                        className={`text-lg font-bold mb-2 line-clamp-2 cursor-pointer ${
                          isCompleted
                            ? 'text-slate-500 dark:text-slate-400 line-through'
                            : 'text-slate-800 dark:text-slate-100 group-hover:text-[#7B61FF] dark:group-hover:text-[#9b86ff] transition-colors'
                        }`}
                      >
                        {suggestion.title}
                      </h4>

                      <p className="text-sm text-slate-500 dark:text-slate-400 line-clamp-3 mb-4 flex-grow">
                        {suggestion.description || 'No description provided.'}
                      </p>

                      <div className="mt-auto border-t border-slate-100 dark:border-slate-800 pt-4 flex items-center justify-between">
                        <div className="flex flex-col gap-1">
                          {suggestion.duration_min && (
                            <span className="text-xs font-semibold text-slate-400 flex items-center gap-1">
                              <Clock className="w-3 h-3" /> {suggestion.duration_min} mins
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => toggleComplete(suggestion.id)}
                            title={isCompleted ? 'Mark as unread' : 'Mark as completed'}
                            className={`rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 ${
                              isCompleted
                                ? 'text-emerald-500 hover:text-emerald-600'
                                : 'text-slate-300 hover:text-emerald-500'
                            }`}
                          >
                            <CheckCircle2 className="w-5 h-5" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => window.open(suggestion.url, '_blank')}
                            className="border-slate-200 dark:border-slate-700 font-bold hover:border-[#7B61FF] hover:text-[#7B61FF] dark:hover:border-[#9b86ff] dark:hover:text-[#9b86ff]"
                          >
                            View <ArrowUpRight className="w-3 h-3 ml-1" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}

          {/* --- PAGINATION CONTROLS --- */}
          {!loading && totalPages > 1 && (
            <div className="mt-8 flex justify-center items-center gap-4">
              <Button 
                variant="outline" 
                disabled={page <= 1} 
                onClick={() => setPage(p => p - 1)}
                className="font-bold"
              >
                Previous
              </Button>
              <span className="text-sm font-semibold text-slate-500 dark:text-slate-400">
                Page {page} of {totalPages}
              </span>
              <Button 
                variant="outline" 
                disabled={page >= totalPages} 
                onClick={() => setPage(p => p + 1)}
                className="font-bold"
              >
                Next
              </Button>
            </div>
          )}

        </main>
      </div>
    </div>
  );
}