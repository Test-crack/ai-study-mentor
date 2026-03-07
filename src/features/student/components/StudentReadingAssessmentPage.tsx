import { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  BookOpen, Mic, Target, Zap, Clock, CheckCircle, 
  Sparkles, ChevronRight, Info, AlertTriangle, 
  XCircle, Check, PlaySquare, Square, Loader2,
  ChevronLeft, RotateCcw
} from 'lucide-react';
import { Button } from '@/shared/components/ui/button';
import { Card, CardContent } from '@/shared/components/ui/card';
import { StudentSidebar } from './dashboard/StudentSidebar';
import { StudentTopbar } from './dashboard/StudentTopbar';
import { cn } from "@/shared/utils";
import { 
  fetchIeltsReadingTopics, 
  fetchIeltsReadingTopicById, 
  saveIeltsReadingAssessment, 
  IeltsReadingPractice, 
  IeltsReadingPracticeList 
} from '../services/ieltsReadingService';
import { toast } from "sonner";
import { useSpeechToText } from '../hooks/useSpeechToText';
import { useAuth } from '@/features/auth/hooks/useAuth';

type Step = 1 | 2 | 3 | 4;
type BandLevel = 'All' | 'Band 5' | 'Band 6' | 'Band 7' | 'Band 8';

const FILLER_WORDS_LIST = [
  "um", "uh", "ah", "err", "hmm", "hmmm", "uh-huh", "mhm",
  "like", "you know", "i mean", "actually", "basically", 
  "literally", "so", "right", "okay", "well", "you see", 
  "i guess", "i suppose", "really", "just", "anyway", 
  "anyhow", "mind you", "to be honest", "frankly", 
  "believe me", "tell you what", "by the way", "incidentally",
  "sort of", "kind of", "type of", "around", "about", 
  "somewhat", "somehow", "more or less", "stuff like that", "what do i say",
  "and things", "and so on", "gonna", "wanna", "gotta", "outta", "innit", "dunno"
];

export default function StudentReadingAssessmentPage() {
  const navigate = useNavigate();
  const { profile } = useAuth();
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [activeBand, setActiveBand] = useState<BandLevel>('All');
  const [selectedTopic, setSelectedTopic] = useState<IeltsReadingPractice | null>(null);
  const [topics, setTopics] = useState<IeltsReadingPracticeList[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isFetchingDetail, setIsFetchingDetail] = useState(false);
  const [currentStep, setCurrentStep] = useState<Step>(1);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [showTips, setShowTips] = useState(false); // FIXED: Added missing state
  
  // Recording & STT Logic
  const { 
    isListening, 
    isSTTReady,
    transcript: realTranscript, 
    startListening, 
    stopListening,
    setTranscript: resetTranscript
  } = useSpeechToText({
    onError: (err: string) => toast.error(err)
  });

  const [recordingTime, setRecordingTime] = useState(0);
  const [pauseCount, setPauseCount] = useState(0);
  const [isCurrentlyPausing, setIsCurrentlyPausing] = useState(false);
  const lastTranscriptTimeRef = useRef<number>(Date.now());
  const [sessionResults, setSessionResults] = useState<{
    pass1?: any;
    pass2?: any;
  }>({});
  const [isSaving, setIsSaving] = useState(false);
  const [backendResults, setBackendResults] = useState<any>(null);

  // Memoized Passage Word Set for efficient lookup
  const passageWordsSet = useMemo(() => {
    if (!selectedTopic?.modelAnswer) return new Set<string>();
    return new Set(
      selectedTopic.modelAnswer
        .toLowerCase()
        .replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g, "")
        .split(/\s+/)
        .filter(w => w.length > 0)
    );
  }, [selectedTopic]);

  // Fetch Topics
  useEffect(() => {
    const loadTopics = async () => {
      setIsLoading(true);
      try {
        const response = await fetchIeltsReadingTopics(activeBand, page);
        setTopics(response.data);
        setTotalPages(response.pagination.totalPages);
      } catch (error) {
        toast.error("Failed to load reading topics.");
      } finally {
        setIsLoading(false);
      }
    };
    loadTopics();
  }, [activeBand, page]);

  const handleSelectTopic = async (topicId: string) => {
    setIsFetchingDetail(true);
    try {
      const fullTopic = await fetchIeltsReadingTopicById(topicId);
      setSelectedTopic(fullTopic);
      stopListening();
      setRecordingTime(0);
      setCurrentStep(1);
      setBackendResults(null);
      resetTranscript('');
    } catch (error) {
      toast.error("Failed to load topic details.");
    } finally {
      setIsFetchingDetail(false);
    }
  };

  // FIXED: Merged into a single helper function with an optional 'type' parameter
  const getTopicStyle = (band: string, type?: string) => {
    const bandNum = band.split(' ')[1];
    let color = "text-[#8a42f5] dark:text-[#a874f7]";
    let bg = "bg-[#f5f0ff] dark:bg-[#8a42f5]/20";
    let border = "border-[#d9c4f9] dark:border-[#8a42f5]/40";
    let iconType = 'pencil';

    if (bandNum === '5') {
      color = "text-teal-600 dark:text-teal-400";
      bg = "bg-teal-50 dark:bg-teal-900/20";
      border = "border-teal-100 dark:border-teal-800";
    } else if (bandNum === '7') {
      color = "text-amber-600 dark:text-amber-400";
      bg = "bg-amber-50 dark:bg-amber-900/20";
      border = "border-amber-100 dark:border-amber-800";
    } else if (bandNum === '8') {
      color = "text-rose-600 dark:text-rose-400";
      bg = "bg-rose-50 dark:bg-rose-900/20";
      border = "border-rose-100 dark:border-rose-800";
    }

    if (type === 'Paragraph') {
      iconType = 'paper';
    } else if (bandNum === '8') {
      iconType = 'scroll';
    }

    return { color, bg, border, iconType };
  };

  const wordsArray = useMemo(() => realTranscript.split(' ').filter(w => w.length > 0), [realTranscript]);

  // Timer Logic
  useEffect(() => {
    let interval: any;
    if (isListening && isSTTReady) {
      interval = setInterval(() => setRecordingTime(prev => prev + 1), 1000);
    } else {
      clearInterval(interval);
    }
    return () => clearInterval(interval);
  }, [isListening, isSTTReady]);

  // Pause Detection
  useEffect(() => {
    if (!isListening || !isSTTReady || wordsArray.length === 0) {
      setIsCurrentlyPausing(false);
      lastTranscriptTimeRef.current = Date.now();
      return;
    }
    const checkPause = setInterval(() => {
      const now = Date.now();
      if (now - lastTranscriptTimeRef.current > 2000 && !isCurrentlyPausing) {
        setPauseCount(prev => prev + 1);
        setIsCurrentlyPausing(true);
      }
    }, 500);
    return () => clearInterval(checkPause);
  }, [isListening, isSTTReady, wordsArray.length, isCurrentlyPausing]);

  useEffect(() => {
    if (realTranscript) {
      lastTranscriptTimeRef.current = Date.now();
      setIsCurrentlyPausing(false);
    }
  }, [realTranscript]);

  const currentFillers = useMemo(() => {
    const counts: { [word: string]: number } = {};
    let total = 0;
    wordsArray.forEach((w: string) => {
      const clean = w.toLowerCase().replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g, "");
      if (FILLER_WORDS_LIST.includes(clean) && !passageWordsSet.has(clean)) {
        counts[clean] = (counts[clean] || 0) + 1;
        total++;
      }
    });
    return { total, fillerCounts: counts };
  }, [wordsArray, passageWordsSet]);

  const currentWPM = recordingTime > 0 ? Math.round((wordsArray.length / recordingTime) * 60) : 0;

  const keywordCoverage = useMemo(() => {
    if (!selectedTopic || currentStep !== 3) return 0;
    const lowerTranscript = realTranscript.toLowerCase();
    return selectedTopic.keywords.filter(k => lowerTranscript.includes(k.toLowerCase().trim())).length;
  }, [realTranscript, selectedTopic, currentStep]);

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60).toString().padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  const handleStartRecording = () => {
    setRecordingTime(0);
    setPauseCount(0);
    setIsCurrentlyPausing(false);
    lastTranscriptTimeRef.current = Date.now();
    resetTranscript('');
    startListening();
  };

  const resetToLanding = () => {
    setSelectedTopic(null);
    setCurrentStep(1);
    stopListening();
  };

  const renderLiveTranscript = () => {
    if (!realTranscript) return <span className="text-slate-500 italic">Listening for speech...</span>;

    return wordsArray.map((word: string, i: number) => {
      const cleanWord = word.replace(/[.,!?]/g, "").toLowerCase();

      // Highlight Fillers in Step 2
      if (currentStep === 2) {
         if (["um", "uh", "ah", "hmm", "err"].includes(cleanWord)) {
            return <span key={i} className="text-amber-500 font-medium mx-0.5">{word} </span>;
         }
         return <span key={i} className="text-teal-600 dark:text-teal-400 mx-0.5">{word} </span>;
      }

      // Highlight Keywords in Step 3
      if (currentStep === 3) {
         const isKeyword = selectedTopic?.keywords.some((k: string) => k.toLowerCase().includes(cleanWord));
         if (isKeyword && cleanWord.length > 3) {
            return <span key={i} className="bg-teal-100 dark:bg-teal-900/30 text-teal-700 dark:text-teal-300 font-medium px-1 rounded mx-0.5">{word} </span>;
         }
         return <span key={i} className="text-slate-600 dark:text-slate-300 mx-0.5">{word} </span>;
      }

      return <span key={i} className="mx-0.5">{word} </span>;
    });
  };

  const renderHighlightedText = (text: string, keywords: string[]) => {
    let result: any[] = [text];
    keywords.forEach(keyword => {
      const newResult: any[] = [];
      result.forEach(chunk => {
        if (typeof chunk === 'string') {
          const parts = chunk.split(new RegExp(`(${keyword})`, 'gi'));
          parts.forEach(part => {
            if (part.toLowerCase() === keyword.toLowerCase()) {
              newResult.push(<span key={Math.random()} className="text-[#8a42f5] dark:text-[#a874f7] font-semibold bg-[#f5f0ff] dark:bg-[#8a42f5]/20 px-1 rounded">{part}</span>);
            } else if (part) {
              newResult.push(part);
            }
          });
        } else newResult.push(chunk);
      });
      result = newResult;
    });
    return result;
  };

  // FIXED: Moved this helper above the return statement
  const recordTranscripts = () => {
    return (
      <>
        {isListening && !isSTTReady ? (
          <div className="flex items-center text-slate-500"><Loader2 className="w-4 h-4 mr-2 animate-spin" /><span>Initializing...</span></div>
        ) : !isListening && wordsArray.length === 0 ? (
          <div className="text-slate-400 italic">Ready to record.</div>
        ) : (<div>{renderLiveTranscript()}{isListening && <span className="animate-pulse border-r-2 border-[#8a42f5] ml-1"></span>}</div>)}
      </>
    );
  };

  return (
    <div className="min-h-screen bg-[#f1f3f9] dark:bg-slate-950 transition-colors duration-300 font-sans text-slate-800 dark:text-slate-200">
      <StudentSidebar 
        activeTab="assessments" 
        onTabChange={(tab) => navigate(`/${profile?.role?.toLowerCase()}/${tab}`)}
        isCollapsed={isSidebarCollapsed} 
        toggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)} 
      />

      <div className={cn("transition-all duration-300 min-h-screen flex flex-col", isSidebarCollapsed ? 'lg:pl-20' : 'lg:pl-64')}>
        <StudentTopbar onUpgradeClick={() => {}} />

        <main className="p-6 md:p-8 max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500 w-full">
          {!selectedTopic ? (
            /* LANDING VIEW */
            <>
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
                  <div>
                      <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Speaking Practice</h1>
                      <p className="text-slate-500 dark:text-slate-400 mt-1">Practice and improve your speaking fluency.</p>
                  </div>
              </div>

              <div className="flex flex-wrap gap-2 mb-8 border-b border-slate-200 dark:border-slate-800 pb-4">
                {['All Levels', 'Band 5', 'Band 6', 'Band 7', 'Band 8'].map((label) => {
                  const level = label === 'All Levels' ? 'All' : label;
                  return (
                    <button key={label} onClick={() => setActiveBand(level as BandLevel)}
                      className={cn("px-4 py-2 rounded-md text-sm font-medium transition-colors",
                        activeBand === level 
                            ? "bg-[#0b132b] text-white dark:bg-white dark:text-[#0b132b]" 
                            : "text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800")}>
                      {label}
                    </button>
                  );
                })}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {isLoading ? (
                  Array(6).fill(0).map((_, i) => (
                    <Card key={i} className="border-none shadow-sm animate-pulse rounded-2xl bg-white dark:bg-slate-900 h-[200px]" />
                  ))
                ) : topics.map((topic) => {
                  const styles = getTopicStyle(topic.band);
                  return (
                    <Card key={topic.id} className="border-none shadow-sm hover:shadow-md transition-shadow cursor-pointer rounded-2xl bg-white dark:bg-slate-900 overflow-hidden"
                      onClick={() => handleSelectTopic(topic.id)}>
                      {isFetchingDetail && selectedTopic?.id !== topic.id && (
                        <div className="absolute inset-0 bg-white/50 dark:bg-slate-900/50 flex items-center justify-center z-10 backdrop-blur-sm">
                          <Loader2 className="w-6 h-6 animate-spin text-[#8a42f5]" />
                        </div>
                      )}
                      <CardContent className="p-6">
                        <div className="flex justify-between items-start mb-4">
                          <div className={cn("p-2 rounded-lg", styles.bg, styles.color)}>
                              {styles.iconType === 'paper' ? <BookOpen className="w-5 h-5" /> : styles.iconType === 'scroll' ? <Sparkles className="w-5 h-5" /> : <BookOpen className="w-5 h-5" />}
                          </div>
                          <span className={cn("px-2.5 py-1 rounded-md text-xs font-semibold border", styles.border, styles.color, styles.bg)}>{topic.band}</span>
                        </div>
                        <h3 className="text-base font-semibold text-[#0b132b] dark:text-slate-100 mb-4 line-clamp-2">{topic.title}</h3>
                        <div className="flex items-center gap-4 text-slate-500 text-sm">
                          <div className="flex items-center gap-1.5"><Target className="w-4 h-4" /> {topic.phrases}</div>
                          <div className="flex items-center gap-1.5"><Clock className="w-4 h-4" /> {topic.words}w</div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>

              {/* Pagination UI */}
              {totalPages > 1 && (
                <div className="flex justify-center items-center gap-4 pt-4">
                   <Button variant="outline" size="icon" disabled={page === 1} onClick={() => setPage(p => p - 1)}><ChevronLeft className="w-4 h-4" /></Button>
                   <span className="text-sm font-bold">Page {page} of {totalPages}</span>
                   <Button variant="outline" size="icon" disabled={page === totalPages} onClick={() => setPage(p => p + 1)}><ChevronRight className="w-4 h-4" /></Button>
                </div>
              )}
            </>
          ) : (
            /* ================= MULTI-STEP FLOW ================= */
            <div className="max-w-3xl mx-auto space-y-8">
              <Button variant="ghost" onClick={resetToLanding} className="mb-2 -ml-4 text-slate-500 hover:text-[#0b132b] dark:hover:text-slate-100">
                <ChevronRight className="w-4 h-4 rotate-180 mr-1" /> Back to list
              </Button>
              
              <div className="flex items-center justify-center mb-8 gap-4">
                  <div className="flex gap-2">
                    {[1, 2, 3, 4].map(s => (
                      <div key={s} className={cn("h-8 w-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors",
                        currentStep === s ? "bg-[#8a42f5] text-white ring-4 ring-[#8a42f5]/20 dark:ring-[#8a42f5]/40" : s < currentStep ? "bg-[#10b981] text-white" : "bg-slate-200 text-slate-500 dark:bg-slate-800 dark:text-slate-400")}>
                        {s < currentStep ? <Check className="h-4 w-4" /> : s}
                      </div>
                    ))}
                  </div>
              </div>

              {currentStep === 1 && (
                <StepContainer title="Familiarization" desc="Review the question and model answer before starting.">
                   <div className="space-y-6">
                      <div className="p-6 bg-white dark:bg-slate-900 rounded-2xl border-none shadow-sm">
                        <h3 className="text-sm font-medium text-slate-500 mb-2">Question</h3>
                        <p className="text-base text-[#0b132b] dark:text-slate-100 font-medium">{selectedTopic.title}</p>
                      </div>
                      <div className="p-6 bg-white dark:bg-slate-900 rounded-2xl border-none shadow-sm">
                        <div className="flex justify-between items-center mb-4">
                           <h3 className="text-sm font-medium text-slate-500 flex items-center gap-2"><BookOpen className="w-4 h-4" /> Model Answer</h3>
                        </div>
                        <div className="text-slate-700 dark:text-slate-300 text-base leading-relaxed">
                          {renderHighlightedText(selectedTopic.modelAnswer, selectedTopic.keywords)}
                        </div>
                      </div>
                   </div>
                   <div className="pt-4">
                      <button onClick={() => setShowTips(!showTips)} className="text-[#8a42f5] dark:text-[#a874f7] text-sm font-medium flex items-center gap-1.5 hover:underline"><Info className="w-4 h-4" /> {showTips ? 'Hide Tips' : 'View Practice Tips'}</button>
                      {showTips && (
                        <ul className="mt-4 p-5 bg-white dark:bg-slate-900 rounded-2xl border-none shadow-sm space-y-2">
                          {selectedTopic.tips.map((tip: string, i: number) => (
                            <li key={i} className="text-sm text-slate-600 dark:text-slate-400 flex items-start gap-2"><div className="mt-1.5 w-1 h-1 rounded-full bg-slate-400 shrink-0" /> <span>{tip}</span></li>
                          ))}
                        </ul>
                      )}
                   </div>
                   <Button size="lg" className="w-full mt-8 bg-[#8a42f5] hover:bg-[#7b3be6] text-white rounded-xl h-12" onClick={() => setCurrentStep(2)}>Start Practice</Button>
                </StepContainer>
              )}

              {currentStep === 2 && (
                <StepContainer title="First Pass" desc="Read the passage clearly and naturally.">
                   <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
                      <StatMini label="WPM" value={currentWPM} />
                      <StatMini label="Words" value={wordsArray.length} />
                      <StatMini label="Fillers" value={currentFillers.total} />
                      <StatMini label="Pauses" value={pauseCount} />
                   </div>
                   <div className="p-6 bg-white dark:bg-slate-900 rounded-2xl border-none shadow-sm mb-6">
                      <p className="text-slate-600 dark:text-slate-400 text-base leading-relaxed">{selectedTopic.modelAnswer}</p>
                   </div>
                   <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border-none shadow-sm">
                     <div className="flex justify-between items-center mb-4 border-b border-slate-100 dark:border-slate-800 pb-4">
                        <div className="flex items-center gap-2 text-rose-600 dark:text-rose-500">
                          <div className={cn("w-2 h-2 rounded-full", isListening ? "bg-rose-600 dark:bg-rose-500 animate-pulse" : "bg-slate-400")} />
                          <span className="text-xs font-semibold uppercase tracking-wider">Transcript</span>
                        </div>
                        <span className="text-sm font-mono text-slate-500">{formatTime(recordingTime)}</span>
                     </div>
                     <div className="min-h-[100px] text-base leading-relaxed text-slate-700 dark:text-slate-300">
                        {isListening && !isSTTReady ? (<div className="flex items-center text-slate-500"><Loader2 className="w-4 h-4 mr-2 animate-spin" /><span>Initializing...</span></div>
                        ) : !isListening && wordsArray.length === 0 ? (<div className="text-slate-400 italic">Ready to record.</div>
                        ) : (<div>{renderLiveTranscript()}{isListening && <span className="animate-pulse border-r-2 border-[#8a42f5] ml-1"></span>}</div>)}
                     </div>
                   </div>
                   {!isListening ? (
                     <Button size="lg" className="w-full mt-8 bg-[#8a42f5] hover:bg-[#7b3be6] text-white rounded-xl h-12" onClick={handleStartRecording}><Mic className="w-4 h-4 mr-2" /> Start Recording</Button>
                   ) : (
                     <Button size="lg" variant="destructive" className="w-full mt-8 rounded-xl h-12" onClick={() => { 
                        stopListening(); 
                        setSessionResults(prev => ({ ...prev, pass1: { wpm: currentWPM, words: wordsArray.length, fillers: currentFillers.total, fillerCounts: currentFillers.fillerCounts, pauses: pauseCount } }));
                        setCurrentStep(3); 
                      }}><Square className="w-4 h-4 mr-2" /> Stop & Continue</Button>
                   )}
                </StepContainer>
              )}

              {currentStep === 3 && (
                <StepContainer title="Second Pass" desc="Read again, focusing on the highlighted keywords.">
                   <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
                      <StatMini label="Keywords" value={`${keywordCoverage}/${selectedTopic.keywords.length}`} />
                      <StatMini label="Words" value={wordsArray.length} />
                      <StatMini label="Fillers" value={currentFillers.total} />
                      <StatMini label="Pauses" value={pauseCount} />
                   </div>
                   <div className="p-6 bg-white dark:bg-slate-900 rounded-2xl border-none shadow-sm mb-6">
                      <div className="text-slate-600 dark:text-slate-400 text-base leading-relaxed">{renderHighlightedText(selectedTopic.modelAnswer, selectedTopic.keywords)}</div>
                   </div>
                   <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border-none shadow-sm">
                         <div className="flex justify-between items-center mb-4 border-b border-slate-100 dark:border-slate-800 pb-4">
                            <div className="flex items-center gap-2 text-rose-600 dark:text-rose-500">
                              <div className={cn("w-2 h-2 rounded-full", isListening ? "bg-rose-600 dark:bg-rose-500 animate-pulse" : "bg-slate-400")} />
                              <span className="text-xs font-semibold uppercase tracking-wider">Transcript</span>
                            </div>
                            <span className="text-sm font-mono text-slate-500">{formatTime(recordingTime)}</span>
                         </div>
                         <div className="min-h-[100px] text-base leading-relaxed text-slate-700 dark:text-slate-300">
                           {recordTranscripts()}
                         </div>
                   </div>
                   {!isListening ? (
                     <Button size="lg" className="w-full mt-8 bg-[#8a42f5] hover:bg-[#7b3be6] text-white rounded-xl h-12" onClick={handleStartRecording}><Mic className="w-4 h-4 mr-2" /> Start Recording</Button>
                   ) : (
                     <Button size="lg" variant="destructive" className="w-full mt-8 rounded-xl h-12" disabled={isSaving}
                        onClick={async () => { 
                          stopListening(); 
                          setIsSaving(true);
                          const pass2 = { coverage: keywordCoverage, totalKeywords: selectedTopic.keywords.length, words: wordsArray.length, fillers: currentFillers.total, fillerCounts: currentFillers.fillerCounts, pauses: pauseCount, time: recordingTime, wpm: currentWPM };
                          try {
                            const res = await saveIeltsReadingAssessment({ topicId: selectedTopic.id, userId: profile?.id || '', band: selectedTopic.band, pass1: sessionResults.pass1, pass2: pass2 });
                            if (res.success) { setBackendResults(res.data); setCurrentStep(4); }
                            else { toast.error(res.error || "Failed to save results"); }
                          } catch (err) { toast.error("Error connecting to server"); }
                          finally { setIsSaving(false); }
                        }}>
                        {isSaving ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Processing...</> : <><Square className="w-4 h-4 mr-2" /> Finish Assessment</>}
                      </Button>
                   )}
                </StepContainer>
              )}

              {currentStep === 4 && backendResults && (
                <div className="space-y-8 animate-in fade-in flex flex-col items-center">
                  <div className="text-center space-y-2 mb-4">
                    <h2 className="text-3xl font-extrabold text-[#0b132b] dark:text-white">Reading Practice Results</h2>
                    <span className="inline-block px-3 py-1 bg-[#8a42f5]/10 text-[#8a42f5] rounded-full text-[10px] font-bold uppercase tracking-widest mt-2">Assessment Recorded • Band {selectedTopic.band.split(' ')[1]}</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 w-full max-w-4xl">
                    <div className="bg-white dark:bg-slate-900 p-8 rounded-3xl border-none shadow-[0_2px_10px_rgba(0,0,0,0.04)] flex flex-col items-center justify-center">
                      <div className="text-5xl font-black text-[#10b981] mb-2">{backendResults.fluencyScore}</div>
                      <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Fluency Score</div>
                    </div>
                    <div className="bg-white dark:bg-slate-900 p-8 rounded-3xl border-none shadow-[0_2px_10px_rgba(0,0,0,0.04)] flex flex-col items-center justify-center">
                      <div className="text-5xl font-black text-[#8a42f5] dark:text-[#a874f7] mb-2">{backendResults.weightedWpm}</div>
                      <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Weighted Avg WPM</div>
                    </div>
                    <div className="bg-white dark:bg-slate-900 p-8 rounded-3xl border-none shadow-[0_2px_10px_rgba(0,0,0,0.04)] flex flex-col items-center justify-center">
                      <div className="text-5xl font-black text-[#8a42f5] dark:text-[#a874f7] mb-2">{backendResults.keywordsHit}/{backendResults.totalKeywords}</div>
                      <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Keywords Hit</div>
                    </div>
                  </div>

                  <div className="w-full max-w-4xl bg-[#fffbf0] dark:bg-amber-900/10 p-6 rounded-2xl border border-amber-100 dark:border-amber-900/30 mt-8">
                      <div className="flex items-center gap-2 mb-3">
                        <AlertTriangle className="w-5 h-5 text-amber-500" />
                        <h3 className="font-bold text-[#8a6a24] dark:text-amber-500">Frequent Filler Words</h3>
                      </div>
                      <p className="text-sm text-[#8a6a24]/80 dark:text-slate-400 mb-4">Focus on reducing these specific fillers to improve your IELTS band score.</p>
                      
                      {backendResults.frequentFillers.length > 0 ? (
                        <div className="flex flex-wrap gap-2 mb-4">
                          {backendResults.frequentFillers.map((f: any, i: number) => (
                            <div key={i} className="bg-white dark:bg-slate-800 px-4 py-2 rounded-xl border border-amber-100 dark:border-slate-700 flex items-center gap-3">
                               <span className="font-mono text-rose-500 font-bold uppercase">{f.word}</span>
                               <span className="text-xs font-black text-slate-400">{f.count}x</span>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-emerald-600 font-bold mb-4">No frequent fillers found! Excellent fluency.</p>
                      )}
                      
                      <div className="text-xs font-semibold text-[#8a6a24] dark:text-amber-400 bg-amber-100/50 dark:bg-amber-900/30 p-3 rounded-lg flex items-start gap-2"><span>💡</span> Pro tip: Pauses are better than fillers. If you need a moment, take a breath instead of saying "{backendResults.frequentFillers[0]?.word || 'um'}".</div>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-4 pt-8 w-full max-w-4xl">
                    <Button variant="outline" className="flex-1 h-14 rounded-2xl font-bold border-2 text-[#0b132b] bg-white hover:bg-slate-50" onClick={() => setCurrentStep(1)}>Try Again</Button>
                    <Button className="flex-1 h-14 rounded-2xl font-bold bg-[#8a42f5] text-white hover:bg-[#7b3be6]" onClick={resetToLanding}>Back to Dashboard</Button>
                  </div>
                </div>
              )}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

const StepContainer = ({ title, desc, children }: any) => (
  <div className="space-y-6 animate-in fade-in duration-300 flex flex-col items-center">
    <div className="mb-6 text-center">
        <h2 className="text-3xl font-extrabold text-[#0b132b] dark:text-white">{title}</h2>
        <p className="text-slate-500 mt-2">{desc}</p>
    </div>
    <div className="w-full">
      {children}
    </div>
  </div>
);

const StatMini = ({ label, value }: { label: string; value: string | number }) => (
  <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border-none shadow-sm flex flex-col items-center justify-center">
      <div className="text-3xl font-black text-[#8a42f5] dark:text-[#a874f7] mb-1">{value}</div>
      <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{label}</div>
  </div>
);