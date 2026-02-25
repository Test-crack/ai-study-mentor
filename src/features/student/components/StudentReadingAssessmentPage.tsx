import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  BookOpen, Mic, Target, Zap, Clock, CheckCircle, 
  Sparkles, ChevronRight, Info, AlertTriangle, 
  XCircle, Check, PlaySquare, Square
} from 'lucide-react';
import { Button } from '@/shared/components/ui/button';
import { Card, CardContent } from '@/shared/components/ui/card';
import { StudentSidebar } from './dashboard/StudentSidebar';
import { StudentTopbar } from './dashboard/StudentTopbar';
import { cn } from "@/shared/utils";
import { fetchIeltsReadingTopics, fetchIeltsReadingTopicById, saveIeltsReadingAssessment, IeltsReadingPractice, IeltsReadingPracticeList } from '../services/ieltsReadingService';
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { useSpeechToText } from '../hooks/useSpeechToText';
import { useAuth } from '@/features/auth/hooks/useAuth';

type Step = 1 | 2 | 3 | 4;
type BandLevel = 'All' | 'Band 5' | 'Band 6' | 'Band 7' | 'Band 8';

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
  const [showTips, setShowTips] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  
  // Recording & STT Logic
  const { 
    isListening, 
    isSTTReady,
    transcript: realTranscript, 
    startListening, 
    stopListening,
    setTranscript: resetTranscript
  } = useSpeechToText({
    onError: (err) => toast.error(err)
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

  // 1. Fetch Topics from Backend
  useEffect(() => {
    const loadTopics = async () => {
      setIsLoading(true);
      try {
        const response = await fetchIeltsReadingTopics(activeBand, page);
        setTopics(response.data);
        setTotalPages(response.pagination.totalPages);
      } catch (error) {
        toast.error("Failed to load reading topics. Please try again later.");
        console.error(error);
      } finally {
        setIsLoading(false);
      }
    };
    loadTopics();
  }, [activeBand, page]);

  // Handle selecting a topic - fetch full details
  const handleSelectTopic = async (topicId: string) => {
    setIsFetchingDetail(true);
    try {
      const fullTopic = await fetchIeltsReadingTopicById(topicId);
      setSelectedTopic(fullTopic);
      stopListening();
      setRecordingTime(0);
      setCurrentStep(1);
      setBackendResults(null);
    } catch (error) {
      toast.error("Failed to load topic details. Please try again.");
      console.error(error);
    } finally {
      setIsFetchingDetail(false);
    }
  };

  // Helper to get topic styles
  const getTopicStyle = (band: string, type: string) => {
    const bandNum = band.split(' ')[1];
    let color = "text-blue-500";
    let bg = "bg-blue-50 dark:bg-blue-900/20";
    let border = "border-blue-200 dark:border-blue-800";
    let iconType = 'pencil';

    if (bandNum === '5') {
      color = "text-emerald-500";
      bg = "bg-emerald-50 dark:bg-emerald-900/20";
      border = "border-emerald-200 dark:border-emerald-800";
    } else if (bandNum === '7') {
      color = "text-orange-500";
      bg = "bg-orange-50 dark:bg-orange-900/20";
      border = "border-orange-200 dark:border-orange-800";
    } else if (bandNum === '8') {
      color = "text-red-500";
      bg = "bg-red-50 dark:bg-red-900/20";
      border = "border-red-200 dark:border-red-800";
    }

    if (type === 'Paragraph') {
      iconType = 'paper';
    } else if (bandNum === '8') {
      iconType = 'scroll';
    }

    return { color, bg, border, iconType };
  };

  const wordsArray = useMemo(() => realTranscript.split(' ').filter(w => w.length > 0), [realTranscript]);

  // 2. Timer Logic
  useEffect(() => {
    let interval: any;
    if (isListening && isSTTReady) {
      interval = setInterval(() => setRecordingTime(prev => prev + 1), 1000);
    } else {
      clearInterval(interval);
    }
    return () => clearInterval(interval);
  }, [isListening, isSTTReady]);


  // 3. Pause Detection Logic
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
    const fillerWords = [
      "um", "uh", "ah", "err", "hmm", 
      "like", "you know", "i mean", 
      "sort of", "kind of", "actually", 
      "basically", "literally", "so",
      "right", "okay", "well", "you see",
      "i guess", "suppose", "really", "just"
    ];
    
    const counts: { [word: string]: number } = {};
    let total = 0;

    wordsArray.forEach((w: string) => {
      const clean = w.toLowerCase().replace(/[.,!?]/g, "");
      if (fillerWords.includes(clean)) {
        counts[clean] = (counts[clean] || 0) + 1;
        total++;
      }
    });

    return { total, fillerCounts: counts };
  }, [wordsArray]);

  const currentWPM = recordingTime > 0 ? Math.round((wordsArray.length / recordingTime) * 60) : 0;

  const keywordCoverage = useMemo(() => {
    if (!selectedTopic || currentStep !== 3) return 0;
    const uniqueSpoken = new Set(wordsArray.map(w => w.toLowerCase().replace(/[.,!?]/g, "")));
    const count = selectedTopic.keywords.filter(k => {
      const cleanK = k.toLowerCase().replace(/[.,!?]/g, "");
      return uniqueSpoken.has(cleanK);
    }).length;
    return count;
  }, [wordsArray, selectedTopic, currentStep]);

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
    setShowTips(false);
    stopListening();
  };

  const renderLiveTranscript = () => {
    if (!realTranscript) return null;
    return wordsArray.map((word: string, i: number) => {
      const cleanWord = word.replace(/[.,!?]/g, "").toLowerCase();
      if (currentStep === 2) {
         if (["um", "uh", "ah", "hmm", "err"].includes(cleanWord)) {
            return <span key={i} className="text-amber-500 font-bold mx-0.5">{word} </span>;
         }
         return <span key={i} className="text-emerald-500 mx-0.5">{word} </span>;
      }
      if (currentStep === 3) {
         const isKeyword = selectedTopic?.keywords.some((k: string) => k.toLowerCase().includes(cleanWord));
         if (isKeyword && cleanWord.length > 3) {
            return <span key={i} className="bg-emerald-500/20 text-emerald-400 font-bold px-1 rounded mx-0.5">{word} </span>;
         }
         return <span key={i} className="mx-0.5">{word} </span>;
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
              newResult.push(<span key={Math.random()} className="text-violet-700 dark:text-violet-300 font-bold bg-violet-100 dark:bg-violet-900/40 px-1.5 py-0.5 rounded mx-0.5">{part}</span>);
            } else if (part) {
              newResult.push(part);
            }
          });
        } else {
          newResult.push(chunk);
        }
      });
      result = newResult;
    });
    return result;
  };

  return (
    <div className="min-h-screen bg-[#F1F3F9] dark:bg-slate-950 transition-colors duration-300 font-sans text-slate-800 dark:text-slate-200">
      <StudentSidebar activeTab="assessment" isCollapsed={isSidebarCollapsed} toggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)} />

      <div className={cn("transition-all duration-300 min-h-screen flex flex-col", isSidebarCollapsed ? 'lg:pl-24' : 'lg:pl-72')}>
        <StudentTopbar onUpgradeClick={() => {}} />

        <main className="p-8 max-w-6xl mx-auto space-y-8 animate-in fade-in duration-500 w-full">
          {!selectedTopic ? (
            /* ================= PHASE 0: LANDING UI ================= */
            <>
              <Card className="relative overflow-hidden border-none shadow-sm bg-white dark:bg-slate-900 rounded-[2rem] p-10">
                <div className="relative z-10 space-y-6">
                  <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-violet-100 dark:bg-violet-900/30 text-violet-600 dark:text-violet-400 text-xs font-bold uppercase tracking-wider">
                    <Sparkles className="w-3.5 h-3.5 fill-current" /> IELTS Reading Practice
                  </div>
                  <div className="space-y-2">
                    <h1 className="text-[2.75rem] font-extrabold text-slate-800 dark:text-white tracking-tight leading-tight">
                      Read, Speak, <span className="text-violet-600 dark:text-violet-400">Improve</span>
                    </h1>
                    <p className="text-slate-500 dark:text-slate-400 text-lg max-w-2xl">
                      Practice reading IELTS model answers aloud. Our 4-phase method builds your pronunciation, fluency, and keyword retention.
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-4 pt-4">
                    <PhaseStep icon={<BookOpen className="w-4 h-4" />} title="Familiarize" sub="Read silently" />
                    <PhaseStep icon={<Mic className="w-4 h-4" />} title="First Pass" sub="Read aloud" />
                    <PhaseStep icon={<Target className="w-4 h-4" />} title="Second Pass" sub="Hit keywords" />
                    <PhaseStep icon={<Zap className="w-4 h-4" />} title="AI Analysis" sub="Get feedback" />
                  </div>
                </div>
              </Card>

              <div className="flex flex-wrap justify-center gap-3">
                {['All Levels', 'Band 5 · Foundation', 'Band 6 · Competent', 'Band 7 · Advanced', 'Band 8 · Expert'].map((label) => {
                  const level = label === 'All Levels' ? 'All' : label.split(' · ')[0];
                  return (
                    <button key={label} onClick={() => setActiveBand(level as BandLevel)}
                      className={cn("px-6 py-2.5 rounded-xl text-sm font-semibold transition-all border",
                        activeBand === level ? "bg-violet-600 text-white shadow-lg shadow-violet-200 dark:shadow-none" : "bg-white dark:bg-slate-900 text-slate-400 border-transparent")}>
                      {label}
                    </button>
                  );
                })}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {isLoading ? (
                  Array(6).fill(0).map((_, i) => (
                    <Card key={i} className="border-none shadow-sm animate-pulse rounded-2xl bg-white dark:bg-slate-900 h-[220px]" />
                  ))
                ) : topics.map((topic) => {
                  const styles = getTopicStyle(topic.band, topic.type);
                  return (
                    <Card key={topic.id} className="border-none shadow-sm hover:shadow-md transition-all cursor-pointer rounded-2xl bg-white dark:bg-slate-900 group relative overflow-hidden"
                      onClick={() => handleSelectTopic(topic.id)}>
                      {isFetchingDetail && selectedTopic?.id !== topic.id && (
                        <div className="absolute inset-0 bg-white/50 dark:bg-slate-900/50 flex items-center justify-center z-10 backdrop-blur-[1px]">
                          <Loader2 className="w-6 h-6 animate-spin text-violet-600" />
                        </div>
                      )}
                      <CardContent className="p-8">
                        <div className="flex justify-between items-start mb-6">
                          <div className="text-2xl">{styles.iconType === 'paper' ? '📄' : styles.iconType === 'scroll' ? '📜' : '📝'}</div>
                          <div className={cn("px-3 py-1 rounded-full text-[10px] font-bold tracking-widest border uppercase", styles.border, styles.color)}>{topic.band}</div>
                        </div>
                        <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100 mb-6 group-hover:text-violet-600 transition-colors">{topic.title}</h3>
                        <div className="flex items-center gap-4 text-slate-400 text-xs font-semibold">
                          <div className="flex items-center gap-1.5"><Target className="w-4 h-4 opacity-70" /> {topic.phrases} key phrases</div>
                          <span className="w-1.5 h-1.5 rounded-full bg-slate-200 dark:bg-slate-700"></span>
                          <div>{topic.type}</div>
                          <span className="w-1.5 h-1.5 rounded-full bg-slate-200 dark:bg-slate-700"></span>
                          <div className="flex items-center gap-1.5"><Clock className="w-4 h-4 opacity-70" /> {topic.words} words</div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </>
          ) : (
            /* ================= MULTI-STEP FLOW ================= */
            <div className="max-w-4xl mx-auto space-y-6">
              <Button variant="ghost" onClick={resetToLanding} className="mb-4 text-slate-500 hover:text-slate-800 dark:hover:text-slate-200">
                <ChevronRight className="w-4 h-4 rotate-180 mr-2" /> Back to questions
              </Button>
              
              <div className="flex gap-4 mb-8 justify-center">
                {[1, 2, 3, 4].map(s => (
                  <div key={s} className={cn("h-10 w-10 rounded-full flex items-center justify-center font-bold transition-all shadow-sm",
                    currentStep === s ? "bg-violet-600 text-white ring-4 ring-violet-100 dark:ring-violet-900/50" : s < currentStep ? "bg-emerald-500 text-white" : "bg-white dark:bg-slate-800 text-slate-400")}>
                    {s < currentStep ? <CheckCircle className="h-5 w-5" /> : s}
                  </div>
                ))}
              </div>

              {/* ----- STEP 1: FAMILIARIZATION ----- */}
              {currentStep === 1 && (
                <StepContainer title="Familiarization Phase" desc="Read the question and model answer together. Take your time to understand the structure and vocabulary.">
                   <div className="space-y-4">
                      <div className="p-6 bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm">
                        <p className="text-xs font-bold text-slate-400 uppercase mb-3">Question</p>
                        <p className="text-lg font-semibold">{selectedTopic.title}</p>
                      </div>
                      <div className="p-8 bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm relative">
                        <div className="flex justify-between items-center mb-5">
                           <p className="text-xs font-bold text-slate-400 uppercase flex items-center gap-2"><BookOpen className="w-4 h-4" /> Model Answer</p>
                           <button className="text-[10px] text-slate-400 uppercase font-bold hover:text-slate-600">Hide Answer</button>
                        </div>
                        <div className="text-slate-700 dark:text-slate-300 leading-relaxed text-[1.1rem]">
                          {renderHighlightedText(selectedTopic.modelAnswer, selectedTopic.keywords)}
                        </div>
                      </div>
                   </div>
                   <div className="pt-2">
                      <button onClick={() => setShowTips(!showTips)} className="text-violet-600 dark:text-violet-400 text-sm font-bold flex items-center gap-2"><Info className="w-4 h-4" /> {showTips ? 'Hide Tips' : 'Show Tips for this question'}</button>
                      {showTips && (
                        <ul className="mt-4 p-6 bg-slate-50 dark:bg-slate-900/50 rounded-2xl border border-slate-100 dark:border-slate-800 space-y-3 animate-in slide-in-from-top-2">
                          {selectedTopic.tips.map((tip: string, i: number) => (
                            <li key={i} className="text-sm text-slate-600 dark:text-slate-400 flex items-center gap-3"><div className="w-1.5 h-1.5 rounded-full bg-violet-400" /> {tip}</li>
                          ))}
                        </ul>
                      )}
                   </div>
                   <Button size="lg" className="w-full bg-violet-600 hover:bg-violet-700 h-14 rounded-2xl text-lg font-bold mt-4" onClick={() => setCurrentStep(2)}>I'm Ready — Start Reading Practice</Button>
                </StepContainer>
              )}

              {/* ----- STEP 2: FIRST PASS ----- */}
              {currentStep === 2 && (
                <StepContainer title="01. First Pass: Read Aloud" desc="Read the entire answer out loud at a natural pace. Your speech is captured live.">
                   <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                      <StatMini label="WPM" value={currentWPM} />
                      <StatMini label="Words" value={wordsArray.length} />
                      <StatMini label="Fillers" value={currentFillers.total} />
                      <StatMini label="Pauses" value={pauseCount} />
                   </div>
                   <div className="p-8 bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm mb-6">
                      <p className="text-xs font-bold text-slate-400 uppercase mb-4">Model Answer (read this aloud)</p>
                      <p className="text-slate-700 dark:text-slate-300 leading-relaxed text-[1.1rem] opacity-70">{selectedTopic.modelAnswer}</p>
                   </div>
                   <div className="bg-slate-900 rounded-2xl p-6 border border-slate-800 shadow-lg">
                     <div className="flex justify-between items-center mb-4 border-b border-slate-800 pb-4">
                        <div className="flex items-center gap-4">
                          <div className="flex items-center gap-2 text-rose-500">
                            <div className={cn("w-2 h-2 rounded-full", isListening ? "bg-rose-500 animate-ping" : "bg-slate-600")} />
                            <span className="text-xs font-bold uppercase tracking-widest text-slate-300">Live Transcript</span>
                          </div>
                        </div>
                        <span className="text-xs font-mono text-slate-400">{formatTime(recordingTime)} / 00:45</span>
                     </div>
                     <div className="min-h-[120px] bg-slate-800/30 rounded-xl p-6 text-[1.1rem] font-medium leading-relaxed text-slate-400">
                        {isListening && !isSTTReady ? (<div className="h-full flex flex-col items-center justify-center text-violet-400 animate-pulse"><Sparkles className="w-8 h-8 mr-2" /><span>Setting up voice engine...</span></div>
                        ) : !isListening && wordsArray.length === 0 ? (<div className="h-full flex flex-col items-center justify-center text-slate-500"><Mic className="w-8 h-8 opacity-50 mb-2" /><span>Click start to begin recording...</span></div>
                        ) : (<div>{isSTTReady && wordsArray.length === 0 && (<div className="text-emerald-500 text-sm font-bold mb-4 animate-bounce flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />READY! Start reading now...</div>)}{renderLiveTranscript()}{isListening && <span className="animate-pulse border-r-2 border-violet-500 ml-1"></span>}</div>)}
                     </div>
                   </div>
                   {!isListening ? (
                     <Button size="lg" className="w-full bg-violet-600 h-14 rounded-2xl font-bold mt-6 shadow-lg shadow-violet-200 dark:shadow-none" onClick={handleStartRecording}><PlaySquare className="w-5 h-5 mr-2" /> Start Reading</Button>
                   ) : (
                     <Button size="lg" className="w-full bg-rose-500 hover:bg-rose-600 h-14 rounded-2xl font-bold mt-6" onClick={() => { 
                        stopListening(); 
                        setSessionResults(prev => ({ ...prev, pass1: { wpm: currentWPM, words: wordsArray.length, fillers: currentFillers.total, fillerCounts: currentFillers.fillerCounts, pauses: pauseCount } }));
                        setCurrentStep(3); 
                      }}><Square className="w-5 h-5 mr-2" /> Done — Analyze My Reading</Button>
                   )}
                </StepContainer>
              )}

              {/* ----- STEP 3: SECOND PASS ----- */}
              {currentStep === 3 && (
                <StepContainer title="02. Second Pass: Keyword Focus" desc="Read again, paying attention to highlighted keywords. Watch your keyword tracker update in real-time!">
                   <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                      <StatMini label="Keyword Coverage" value={selectedTopic ? `${keywordCoverage}/${selectedTopic.keywords.length}` : '0/0'} />
                      <StatMini label="Words" value={wordsArray.length} />
                      <StatMini label="Fillers" value={currentFillers.total} />
                      <StatMini label="Pauses" value={pauseCount} />
                   </div>
                   <div className="p-8 bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm mb-6">
                      <p className="text-xs font-bold text-slate-400 uppercase mb-4">Model Answer (Keywords Highlighted)</p>
                      <div className="text-slate-700 dark:text-slate-300 leading-relaxed text-[1.1rem]">{renderHighlightedText(selectedTopic.modelAnswer, selectedTopic.keywords)}</div>
                   </div>
                   <div className="bg-slate-900 rounded-2xl p-6 border border-slate-800 shadow-lg mb-6">
                         <div className="flex justify-between items-center mb-4 border-b border-slate-800 pb-4">
                            <div className="flex items-center gap-2 text-rose-500">
                              <div className={cn("w-2 h-2 rounded-full", isListening ? "bg-rose-500 animate-ping" : "bg-slate-600")} />
                              <span className="text-xs font-bold uppercase tracking-widest text-slate-300">Live Transcript</span>
                            </div>
                            <span className="text-xs font-mono text-slate-400">{formatTime(recordingTime)}</span>
                         </div>
                         <div className="min-h-[100px] bg-slate-800/30 rounded-xl p-6 text-[1.1rem] font-medium leading-relaxed text-slate-400">
                           {recordTranscripts()}
                         </div>
                   </div>
                   {!isListening ? (
                     <Button size="lg" className="w-full bg-violet-600 h-14 rounded-2xl font-bold mt-6 shadow-lg shadow-violet-200 dark:shadow-none" onClick={handleStartRecording}><PlaySquare className="w-5 h-5 mr-2" /> Read Again (Focus on Keywords)</Button>
                   ) : (
                     <Button size="lg" className="w-full bg-rose-500 hover:bg-rose-600 h-14 rounded-2xl font-bold mt-6" disabled={isSaving}
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
                        {isSaving ? <><Loader2 className="w-5 h-5 mr-2 animate-spin" /> Analyzing stats...</> : <><Square className="w-5 h-5 mr-2" /> Finish & Analyze Results</>}
                      </Button>
                   )}
                </StepContainer>
              )}

              {/* ----- STEP 4: AI RESULTS ----- */}
              {currentStep === 4 && backendResults && (
                <div className="space-y-8 animate-in slide-in-from-bottom-4">
                  <div className="text-center space-y-2 mb-8">
                    <h2 className="text-3xl font-extrabold text-slate-800 dark:text-white">Reading Practice Results</h2>
                    <span className="inline-block px-3 py-1 bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-300 rounded-full text-xs font-bold uppercase tracking-widest">Assessment Recorded • Band {selectedTopic.band.split(' ')[1]}</span>
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <div className="text-center bg-white dark:bg-slate-900 rounded-[2rem] p-6 shadow-sm border border-slate-100 dark:border-slate-800">
                      <div className="text-4xl font-black text-emerald-500 mb-2">{backendResults.fluencyScore}</div>
                      <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Fluency Score</div>
                    </div>
                    <div className="text-center bg-white dark:bg-slate-900 rounded-[2rem] p-6 shadow-sm border border-slate-100 dark:border-slate-800">
                      <div className="text-4xl font-black text-violet-600 dark:text-violet-400 mb-2">{backendResults.weightedWpm}</div>
                      <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Weighted Avg WPM</div>
                    </div>
                    <div className="text-center bg-white dark:bg-slate-900 rounded-[2rem] p-6 shadow-sm border border-slate-100 dark:border-slate-800">
                      <div className="text-4xl font-black text-violet-600 dark:text-violet-400 mb-2">{backendResults.keywordsHit}/{backendResults.totalKeywords}</div>
                      <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Keywords Hit</div>
                    </div>
                  </div>

                  <div className="bg-amber-50 dark:bg-slate-900 p-6 rounded-2xl border border-amber-200 dark:border-amber-900/50">
                    <div className="flex items-center gap-2 mb-4">
                      <AlertTriangle className="w-5 h-5 text-amber-500" />
                      <h3 className="font-bold text-amber-900 dark:text-amber-500">Frequent Filler Words</h3>
                    </div>
                    <p className="text-sm text-amber-800 dark:text-slate-400 mb-4">Focus on reducing these specific fillers to improve your IELTS band score.</p>
                    <div className="flex flex-wrap gap-2 mb-4">
                      {backendResults.frequentFillers.length > 0 ? backendResults.frequentFillers.map((f: any, i: number) => (
                        <div key={i} className="bg-white dark:bg-slate-800 px-4 py-2 rounded-xl border border-amber-100 dark:border-slate-700 flex items-center gap-3">
                           <span className="font-mono text-rose-500 font-bold uppercase">{f.word}</span>
                           <span className="text-xs font-black text-slate-400">{f.count}x</span>
                        </div>
                      )) : <span className="text-emerald-600 font-bold">No frequent fillers found! Excellent fluency.</span>}
                    </div>
                    <div className="text-xs font-semibold text-amber-700 dark:text-amber-400 bg-amber-100 dark:bg-amber-900/30 p-3 rounded-lg flex items-start gap-2"><span>💡</span> Pro tip: Pauses are better than fillers. If you need a moment, take a breath instead of saying "{backendResults.frequentFillers[0]?.word || 'um'}".</div>
                  </div>

                  <div className="flex gap-4 pt-4">
                    <Button variant="outline" className="flex-1 h-14 rounded-2xl font-bold border-2" onClick={() => setCurrentStep(1)}>Try Again</Button>
                    <Button className="flex-1 h-14 rounded-2xl font-bold bg-violet-600 text-white hover:bg-violet-700" onClick={resetToLanding}>Back to Dashboard</Button>
                  </div>
                </div>
              )}
            </div>
          )}
        </main>
      </div>
    </div>
  );

  function recordTranscripts() {
    return (
      <>
        {isListening && !isSTTReady ? (
          <div className="h-full flex flex-col items-center justify-center text-violet-400 animate-pulse"><span className="text-sm font-bold uppercase tracking-wider">Syncing keywords...</span></div>
        ) : !isListening && wordsArray.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-slate-500"><Mic className="w-8 h-8 opacity-50 mb-2" /><span>Click start to see your keywords tracked live...</span></div>
        ) : (<div>{renderLiveTranscript()}{isListening && <span className="animate-pulse border-r-2 border-emerald-500 ml-1"></span>}</div>)}
      </>
    );
  }
}

const PhaseStep = ({ icon, title, sub }: any) => (
  <div className="flex items-center gap-3 bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 p-3 rounded-2xl pr-8 shadow-sm">
    <div className="p-2.5 rounded-xl bg-violet-50 dark:bg-violet-900/30 text-violet-600 dark:text-violet-400">{icon}</div>
    <div className="flex flex-col"><span className="text-sm font-bold text-slate-800 dark:text-slate-100 leading-none">{title}</span><span className="text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase mt-1 tracking-tight">{sub}</span></div>
  </div>
);

const StepContainer = ({ title, desc, children }: any) => (
  <div className="space-y-6 animate-in slide-in-from-right-4 duration-500">
    <div className="space-y-2 mb-8 text-center max-w-2xl mx-auto"><h2 className="text-3xl font-extrabold text-slate-800 dark:text-slate-100 tracking-tight">{title}</h2><p className="text-slate-500 text-[1.1rem] leading-relaxed">{desc}</p></div>
    {children}
  </div>
);

const StatMini = ({ label, value }: { label: string; value: string | number }) => (
  <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm text-center"><div className="text-3xl font-black text-violet-600 dark:text-violet-400 mb-1">{value}</div><div className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{label}</div></div>
);