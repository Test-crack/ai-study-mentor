import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { StudentSidebar } from './dashboard/StudentSidebar';
import { StudentTopbar } from './dashboard/StudentTopbar';
import { Button } from '@/shared/components/ui/button';
import { Card, CardContent } from '@/shared/components/ui/card';
import { Badge } from '@/shared/components/ui/badge';
import { 
  Youtube, 
  FileText, 
  ArrowUpRight, 
  BrainCircuit, 
  Target, 
  PlayCircle,
  Clock,
  CheckCircle2
} from 'lucide-react';

// --- Types ---
type ResourceType = 'video' | 'article';

interface Suggestion {
  id: string;
  type: ResourceType;
  title: string;
  source: string;
  weaknessArea: string;
  duration: string;
  description: string;
  url: string;
  thumbnailColor?: string;
}

// --- Mock Data ---
const IDENTIFIED_WEAKNESSES = [
  { module: 'Reading', topic: 'True / False / Not Given', score: '45%' },
  { module: 'Listening', topic: 'Map Labeling', score: '50%' },
  { module: 'Writing', topic: 'Task 1 Overview', score: 'Band 5.5' }
];

// Added REAL URLs pointing to high-quality IELTS Youtube channels and blogs
const MOCK_SUGGESTIONS: Suggestion[] = [
  {
    id: 's1',
    type: 'video',
    title: 'Mastering True/False/Not Given in 10 Minutes',
    source: 'IELTS Advantage',
    weaknessArea: 'Reading: True / False / Not Given',
    duration: '12:45',
    description: 'A step-by-step breakdown of how to stop overthinking and find the exact evidence in the text.',
    url: 'https://www.youtube.com/results?search_query=IELTS+Advantage+True+False+Not+Given',
    thumbnailColor: 'from-blue-500 to-cyan-400'
  },
  {
    id: 's2',
    type: 'article',
    title: 'The Golden Rule for Map Labeling',
    source: 'IELTS Liz Blog',
    weaknessArea: 'Listening: Map Labeling',
    duration: '5 min read',
    description: 'Learn the specific vocabulary of location and direction to never get lost on the map again.',
    url: 'https://ieltsliz.com/ielts-listening-map-vocabulary/'
  },
  {
    id: 's3',
    type: 'video',
    title: 'How to Write a Band 7+ Task 1 Overview',
    source: 'E2 IELTS',
    weaknessArea: 'Writing: Task 1 Overview',
    duration: '18:20',
    description: 'Discover the exact sentence structures needed to summarize main trends effectively without using numbers.',
    url: 'https://www.youtube.com/results?search_query=E2+IELTS+Academic+Task+1+Overview',
    thumbnailColor: 'from-purple-500 to-pink-500'
  },
  {
    id: 's4',
    type: 'article',
    title: 'Stop Falling for Listening Distractors',
    source: 'British Council Guide',
    weaknessArea: 'Listening: Distractors',
    duration: '7 min read',
    description: 'Train your ear to catch when speakers correct themselves or change their minds during the recording.',
    url: 'https://takeielts.britishcouncil.org/take-ielts/prepare/free-ielts-practice-tests/listening'
  }
];

export default function Suggestions() {
  const navigate = useNavigate();
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [completedResources, setCompletedResources] = useState<string[]>([]);

  const toggleComplete = (id: string) => {
    setCompletedResources(prev => 
      prev.includes(id) ? prev.filter(rId => rId !== id) : [...prev, id]
    );
  };

  // Calculate Progress
  const progressPercentage = Math.round((completedResources.length / MOCK_SUGGESTIONS.length) * 100);

  return (
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-slate-950 transition-colors duration-300">
      <StudentSidebar 
        activeTab="suggestion" 
        isCollapsed={isSidebarCollapsed}
        toggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
      />

      <div className={`transition-all duration-300 ${isSidebarCollapsed ? 'lg:pl-24' : 'lg:pl-72'} flex flex-col min-h-screen`}>
        <StudentTopbar onUpgradeClick={() => {}} />

        <main className="flex-1 p-6 max-w-7xl mx-auto w-full flex flex-col animate-in fade-in slide-in-from-bottom-4 duration-500">
          
          {/* --- BANNER --- */}
          <div className="bg-[#7B61FF] rounded-2xl p-8 md:p-10 text-white shadow-md relative overflow-hidden mb-8">
            <div className="absolute top-0 right-0 -mt-4 -mr-4 w-32 h-32 bg-white opacity-10 rounded-full blur-2xl"></div>
            <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div className="max-w-2xl">
                <h1 className="text-3xl font-bold mb-3 flex items-center gap-2">
                  Targeted Learning <BrainCircuit className="h-6 w-6 text-yellow-300" />
                </h1>
                <p className="text-indigo-50 text-base md:text-lg leading-relaxed">
                  We've analyzed your recent practice tests. Focus on these curated articles and videos to strengthen your weak points and boost your overall band score.
                </p>
              </div>
            </div>
          </div>

          {/* --- WEAKNESS OVERVIEW --- */}
          <div className="mb-10">
            <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100 mb-4 flex items-center gap-2">
              <Target className="w-5 h-5 text-rose-500" /> Current Areas for Improvement
            </h3>
            <div className="flex flex-wrap gap-4">
              {IDENTIFIED_WEAKNESSES.map((weakness, index) => (
                <div key={index} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 flex items-center gap-4 shadow-sm">
                  <div className="w-10 h-10 rounded-full bg-rose-50 dark:bg-rose-500/10 flex items-center justify-center text-rose-500 font-bold text-sm">
                    {weakness.score}
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">{weakness.module}</p>
                    <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">{weakness.topic}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* --- PROGRESS BAR --- */}
          <div className="mb-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-sm">
            <div className="flex justify-between text-sm font-bold text-slate-700 dark:text-slate-200 mb-3">
              <span>Your Learning Plan</span>
              <span className="text-[#7B61FF] dark:text-[#9b86ff]">{completedResources.length} of {MOCK_SUGGESTIONS.length} Completed</span>
            </div>
            <div className="h-2.5 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
              <div 
                className="h-full bg-[#7B61FF] rounded-full transition-all duration-500 ease-out" 
                style={{ width: `${progressPercentage}%` }} 
              />
            </div>
          </div>

          {/* --- SUGGESTED RESOURCES GRID --- */}
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {MOCK_SUGGESTIONS.map((suggestion) => {
              const isCompleted = completedResources.includes(suggestion.id);
              
              return (
                <Card 
                  key={suggestion.id} 
                  className={`border transition-all duration-300 flex flex-col h-full overflow-hidden group
                    ${isCompleted 
                      ? 'bg-slate-50 border-slate-200 dark:bg-slate-900/50 dark:border-slate-800 opacity-75' 
                      : 'bg-white border-slate-200 dark:bg-slate-900 dark:border-slate-800 shadow-sm hover:shadow-md hover:border-[#7B61FF]/50 dark:hover:border-[#7B61FF]/50'
                    }`}
                >
                  {/* Visual Header */}
                  <div 
                    className="h-32 relative flex-shrink-0 cursor-pointer"
                    onClick={() => window.open(suggestion.url, '_blank')}
                  >
                    {suggestion.type === 'video' ? (
                      <div className={`w-full h-full bg-gradient-to-br ${suggestion.thumbnailColor} relative overflow-hidden flex items-center justify-center`}>
                        <div className="absolute inset-0 bg-black/20 group-hover:bg-transparent transition-colors duration-300"></div>
                        <PlayCircle className="w-12 h-12 text-white opacity-80 group-hover:scale-110 transition-transform duration-300 drop-shadow-md" />
                      </div>
                    ) : (
                      <div className="w-full h-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center relative overflow-hidden">
                        <FileText className="w-12 h-12 text-slate-300 dark:text-slate-600 group-hover:scale-110 transition-transform duration-300" />
                      </div>
                    )}
                    
                    {/* Resource Type Badge */}
                    <div className="absolute top-3 left-3">
                      <Badge className={`backdrop-blur-md shadow-sm border-none ${
                        suggestion.type === 'video' ? 'bg-black/40 text-white' : 'bg-white/80 text-slate-800 dark:bg-slate-900/80 dark:text-slate-200'
                      }`}>
                        {suggestion.type === 'video' ? (
                          <span className="flex items-center gap-1"><Youtube className="w-3 h-3 text-rose-500" /> Video</span>
                        ) : (
                          <span className="flex items-center gap-1"><FileText className="w-3 h-3 text-blue-500" /> Article</span>
                        )}
                      </Badge>
                    </div>
                  </div>

                  <CardContent className="flex flex-col flex-grow p-5">
                    <div className="mb-3">
                      <span className="text-xs font-semibold text-[#7B61FF] dark:text-[#9b86ff] bg-indigo-50 dark:bg-[#7B61FF]/10 px-2 py-1 rounded-md">
                        Targets: {suggestion.weaknessArea}
                      </span>
                    </div>
                    
                    <h4 
                      onClick={() => window.open(suggestion.url, '_blank')}
                      className={`text-lg font-bold mb-2 line-clamp-2 cursor-pointer ${isCompleted ? 'text-slate-500 dark:text-slate-400 line-through' : 'text-slate-800 dark:text-slate-100 group-hover:text-[#7B61FF] dark:group-hover:text-[#9b86ff] transition-colors'}`}
                    >
                      {suggestion.title}
                    </h4>
                    
                    <p className="text-sm text-slate-500 dark:text-slate-400 line-clamp-3 mb-4 flex-grow">
                      {suggestion.description}
                    </p>

                    <div className="mt-auto border-t border-slate-100 dark:border-slate-800 pt-4 flex items-center justify-between">
                      <div className="flex flex-col gap-1">
                        <span className="text-xs font-medium text-slate-400 flex items-center gap-1">
                          <Clock className="w-3 h-3" /> {suggestion.duration}
                        </span>
                        <span className="text-xs font-medium text-slate-400">
                          By {suggestion.source}
                        </span>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <Button 
                          variant="ghost" 
                          size="icon"
                          onClick={() => toggleComplete(suggestion.id)}
                          title={isCompleted ? "Mark as unread" : "Mark as completed"}
                          className={`rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 ${isCompleted ? 'text-emerald-500 hover:text-emerald-600' : 'text-slate-300 hover:text-emerald-500'}`}
                        >
                          <CheckCircle2 className="w-5 h-5" />
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => window.open(suggestion.url, '_blank')}
                          className="border-slate-200 dark:border-slate-700 hover:border-[#7B61FF] hover:text-[#7B61FF] dark:hover:border-[#9b86ff] dark:hover:text-[#9b86ff]"
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

        </main>
      </div>
    </div>
  );
}