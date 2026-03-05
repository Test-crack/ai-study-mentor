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
        const isFiller = FILLER_WORDS_LIST.includes(cleanWord) && !passageWordsSet.has(cleanWord);
        if (isFiller) return <span key={i} className="text-rose-500 font-bold mx-0.5 underline decoration-wavy decoration-rose-300">{word} </span>;
        return <span key={i} className="text-emerald-500 mx-0.5">{word} </span>;
      }

      // Highlight Keywords in Step 3
      if (currentStep === 3) {
        const isKeyword = selectedTopic?.keywords.some((k: string) => k.toLowerCase().includes(cleanWord) && cleanWord.length > 2);
        if (isKeyword) return <span key={i} className="bg-emerald-500/20 text-emerald-400 font-bold px-1 rounded mx-0.5">{word} </span>;
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
            } else if (part) newResult.push(part);
          });
        } else newResult.push(chunk);
      });
      result = newResult;
    });
    return result;
  };

  const getTopicStyle = (band: string) => {
    const bandNum = band.split(' ')[1];
    if (bandNum === '5') return { color: "text-emerald-500", bg: "bg-emerald-50", border: "border-emerald-200" };
    if (bandNum === '7') return { color: "text-orange-500", bg: "bg-orange-50", border: "border-orange-200" };
    if (bandNum === '8') return { color: "text-rose-500", bg: "bg-rose-50", border: "border-rose-200" };
    return { color: "text-blue-500", bg: "bg-blue-50", border: "border-blue-200" };
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-slate-950 transition-colors duration-300 font-sans text-slate-800 dark:text-slate-200">
      <StudentSidebar 
        activeTab="assessments" 
        onTabChange={(tab) => navigate(`/${profile?.role?.toLowerCase()}/${tab}`)}
        isCollapsed={isSidebarCollapsed} 
        toggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)} 
      />

      <div className={cn("transition-all duration-300 min-h-screen flex flex-col", isSidebarCollapsed ? 'lg:pl-24' : 'lg:pl-72')}>
        <StudentTopbar onUpgradeClick={() => {}} />

        <main className="p-8 max-w-6xl mx-auto space-y-8 animate-in fade-in duration-500 w-full">
          {!selectedTopic ? (
            /* LANDING VIEW */
            <>
              <Card className="relative overflow-hidden border-none shadow-sm bg-white dark:bg-slate-900 rounded-[2.5rem] p-10">
                <div className="relative z-10 space-y-6">
                  <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-violet-100 dark:bg-violet-900/30 text-violet-600 dark:text-violet-400 text-xs font-bold uppercase tracking-widest">
                    <Sparkles className="w-4 h-4" /> IELTS Reading Lab
                  </div>
                  <div className="space-y-2">
                    <h1 className="text-5xl font-extrabold text-slate-800 dark:text-white tracking-tight">
                      Master the Art of <span className="text-violet-600">Fluency</span>
                    </h1>
                    <p className="text-slate-500 dark:text-slate-400 text-lg max-w-2xl">
                      Read curated IELTS passages aloud. Our AI tracks your pacing, filler words, and keyword retention to build confidence for your Speaking and Reading exams.
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-4 pt-4">
                    <PhaseStep icon={<BookOpen className="w-4 h-4" />} title="Scan" sub="Familiarize" />
                    <PhaseStep icon={<Mic className="w-4 h-4" />} title="Pass 1" sub="Fluency Focus" />
                    <PhaseStep icon={<Target className="w-4 h-4" />} title="Pass 2" sub="Keyword Precision" />
                  </div>
                </div>
              </Card>

              <div className="flex flex-wrap justify-center gap-3">
                {['All Levels', 'Band 5', 'Band 6', 'Band 7', 'Band 8'].map((level) => (
                  <button key={level} onClick={() => { setActiveBand(level === 'All Levels' ? 'All' : level as BandLevel); setPage(1); }}
                    className={cn("px-6 py-2.5 rounded-2xl text-sm font-bold transition-all border",
                      activeBand === (level === 'All Levels' ? 'All' : level) ? "bg-slate-900 text-white shadow-xl" : "bg-white dark:bg-slate-900 text-slate-400 border-slate-100")}>
                    {level}
                  </button>
                ))}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {isLoading ? (
                  Array(4).fill(0).map((_, i) => <div key={i} className="h-48 rounded-3xl bg-slate-200 dark:bg-slate-800 animate-pulse" />)
                ) : topics.length === 0 ? (
                  <div className="col-span-2 py-20 text-center text-slate-400">No topics found for this level.</div>
                ) : topics.map((topic) => {
                  const styles = getTopicStyle(topic.band);
                  return (
                    <Card key={topic.id} className="border-none shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all cursor-pointer rounded-3xl bg-white dark:bg-slate-900 group"
                      onClick={() => handleSelectTopic(topic.id)}>
                      <CardContent className="p-8">
                        <div className="flex justify-between items-start mb-6">
                          <div className="w-12 h-12 rounded-2xl bg-slate-50 flex items-center justify-center text-2xl">📄</div>
                          <div className={cn("px-3 py-1 rounded-full text-[10px] font-black border uppercase tracking-widest", styles.border, styles.color)}>{topic.band}</div>
                        </div>
                        <h3 className="text-xl font-bold text-slate-800 dark:text-white mb-6 group-hover:text-violet-600 transition-colors leading-snug">{topic.title}</h3>
                        <div className="flex items-center gap-4 text-slate-400 text-xs font-bold">
                          <div className="flex items-center gap-1.5"><Clock className="w-4 h-4" /> {topic.words} Words</div>
                          <span className="w-1 h-1 rounded-full bg-slate-200" />
                          <div>{topic.type}</div>
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
            /* MULTI-STEP FLOW */
            <div className="max-w-4xl mx-auto space-y-6">
              <Button variant="ghost" onClick={resetToLanding} className="mb-4 text-slate-500 font-bold hover:bg-slate-100 rounded-xl">
                <ChevronLeft className="w-4 h-4 mr-2" /> EXIT PRACTICE
              </Button>
              
              <div className="flex gap-4 mb-10 justify-center">
                {[1, 2, 3, 4].map(s => (
                  <div key={s} className={cn("h-12 w-12 rounded-2xl flex items-center justify-center font-black transition-all shadow-sm",
                    currentStep === s ? "bg-violet-600 text-white scale-110" : s < currentStep ? "bg-emerald-500 text-white" : "bg-white dark:bg-slate-800 text-slate-300")}>
                    {s < currentStep ? <Check className="h-6 w-6" /> : s}
                  </div>
                ))}
              </div>

              {currentStep === 1 && (
                <StepContainer title="Preparation Phase" desc="Read the passage silently. Note the highlighted keywords—you'll need to hit these in Pass 2.">
                  <div className="space-y-4">
                    <div className="p-8 bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 shadow-sm">
                       <h4 className="text-xs font-black text-violet-500 uppercase tracking-widest mb-4">IELTS Passage</h4>
                       <div className="text-slate-700 dark:text-slate-300 leading-relaxed text-xl">
                          {renderHighlightedText(selectedTopic.modelAnswer, selectedTopic.keywords)}
                       </div>
                    </div>
                  </div>
                  <Button size="lg" className="w-full bg-violet-600 hover:bg-violet-700 h-16 rounded-2xl text-xl font-black mt-4 shadow-xl shadow-violet-200" onClick={() => setCurrentStep(2)}>I'm Ready — Start First Pass</Button>
                </StepContainer>
              )}

              {currentStep === 2 && (
                <StepContainer title="Pass 1: Fluency & Flow" desc="Read the text naturally. Don't worry about being perfect; focus on maintaining a steady rhythm.">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                    <StatMini label="WPM" value={currentWPM} />
                    <StatMini label="Words" value={wordsArray.length} />
                    <StatMini label="Fillers" value={currentFillers.total} />
                    <StatMini label="Pauses" value={pauseCount} />
                  </div>
                  <div className="p-8 bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 mb-6 opacity-60 grayscale-[0.5]">
                    <p className="text-slate-700 dark:text-slate-300 leading-relaxed text-lg">{selectedTopic.modelAnswer}</p>
                  </div>
                  <LiveRecordingDisplay isListening={isListening} recordingTime={recordingTime} formatTime={formatTime}>
                    {renderLiveTranscript()}
                  </LiveRecordingDisplay>
                  
                  {!isListening ? (
                    <Button size="lg" className="w-full bg-violet-600 h-16 rounded-2xl font-black mt-6" onClick={handleStartRecording}><PlaySquare className="w-6 h-6 mr-2" /> Start Recording</Button>
                  ) : (
                    <div className="flex gap-4 mt-6">
                       <Button variant="outline" size="lg" className="flex-1 h-16 rounded-2xl font-bold border-2" onClick={handleStartRecording}><RotateCcw className="w-5 h-5 mr-2" /> Restart</Button>
                       <Button size="lg" className="flex-[2] bg-rose-500 hover:bg-rose-600 h-16 rounded-2xl font-black" 
                         onClick={() => { 
                           stopListening(); 
                           setSessionResults(prev => ({ ...prev, pass1: { wpm: currentWPM, words: wordsArray.length, fillers: currentFillers.total, fillerCounts: currentFillers.fillerCounts, pauses: pauseCount } }));
                           setCurrentStep(3); 
                         }}><Square className="w-6 h-6 mr-2" /> Finish & Continue</Button>
                    </div>
                  )}
                </StepContainer>
              )}

              {currentStep === 3 && (
                <StepContainer title="Pass 2: Keyword Precision" desc="Focus on clearly articulating the highlighted keywords. Your score depends on hitting these accurately.">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                    <StatMini label="Keywords" value={`${keywordCoverage}/${selectedTopic.keywords.length}`} />
                    <StatMini label="Current WPM" value={currentWPM} />
                    <StatMini label="Fillers" value={currentFillers.total} />
                    <StatMini label="Words" value={wordsArray.length} />
                  </div>
                  <div className="p-8 bg-white dark:bg-slate-900 rounded-3xl border mb-6 shadow-sm">
                    <div className="text-slate-700 dark:text-slate-300 leading-relaxed text-xl">{renderHighlightedText(selectedTopic.modelAnswer, selectedTopic.keywords)}</div>
                  </div>
                  <LiveRecordingDisplay isListening={isListening} recordingTime={recordingTime} formatTime={formatTime}>
                    {renderLiveTranscript()}
                  </LiveRecordingDisplay>

                  {!isListening ? (
                    <Button size="lg" className="w-full bg-violet-600 h-16 rounded-2xl font-black mt-6" onClick={handleStartRecording}><PlaySquare className="w-6 h-6 mr-2" /> Start Keyword Pass</Button>
                  ) : (
                    <Button size="lg" className="w-full bg-rose-500 h-16 rounded-2xl font-black mt-6 shadow-lg shadow-rose-200" disabled={isSaving}
                      onClick={async () => { 
                        stopListening(); 
                        setIsSaving(true);
                        const pass2 = { coverage: keywordCoverage, totalKeywords: selectedTopic.keywords.length, words: wordsArray.length, fillers: currentFillers.total, fillerCounts: currentFillers.fillerCounts, pauses: pauseCount, time: recordingTime, wpm: currentWPM };
                        try {
                          const res = await saveIeltsReadingAssessment({ topicId: selectedTopic.id, userId: profile?.id || '', band: selectedTopic.band, pass1: sessionResults.pass1, pass2: pass2 });
                          if (res.success) { setBackendResults(res.data); setCurrentStep(4); }
                          else toast.error("Error saving assessment.");
                        } catch (err) { toast.error("Connection failed."); }
                        finally { setIsSaving(false); }
                      }}>
                      {isSaving ? <Loader2 className="animate-spin mr-2" /> : <Square className="w-6 h-6 mr-2" />} Complete Assessment
                    </Button>
                  )}
                </StepContainer>
              )}

              {currentStep === 4 && backendResults && (
                <div className="space-y-8 animate-in slide-in-from-bottom-8 duration-700">
                  <div className="text-center space-y-4 mb-10">
                    <div className="inline-block p-4 rounded-full bg-emerald-100 text-emerald-600 mb-2 animate-bounce"><CheckCircle className="w-10 h-10" /></div>
                    <h2 className="text-4xl font-black tracking-tight">Practice Complete!</h2>
                    <p className="text-slate-500 font-medium">Your performance data has been analyzed by the TestCrack AI.</p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <ResultCard label="Fluency Score" value={`${backendResults.fluencyScore}%`} color="text-emerald-500" />
                    <ResultCard label="Reading Speed" value={`${backendResults.weightedWpm} WPM`} color="text-violet-600" />
                    <ResultCard label="Keyword Accuracy" value={`${backendResults.keywordsHit}/${backendResults.totalKeywords}`} color="text-blue-500" />
                  </div>

                  <div className="bg-white dark:bg-slate-900 p-10 rounded-[3rem] border border-slate-100 shadow-sm">
                    <div className="flex items-center gap-3 mb-8">
                      <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center text-amber-600"><AlertTriangle className="w-5 h-5" /></div>
                      <h3 className="text-xl font-bold">Filler Word Analysis</h3>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                       <div>
                          <p className="text-slate-500 text-sm mb-4 leading-relaxed">We detected these filler words in your speech. Reducing these will significantly boost your IELTS Speaking band score.</p>
                          <div className="flex flex-wrap gap-2">
                            {backendResults.frequentFillers.length > 0 ? backendResults.frequentFillers.map((f: any, i: number) => (
                              <div key={i} className="bg-slate-50 px-4 py-2 rounded-2xl border flex items-center gap-3">
                                  <span className="font-bold text-rose-500">{f.word}</span>
                                  <span className="text-[10px] font-black bg-white px-2 py-0.5 rounded-full border">{f.count}x</span>
                              </div>
                            )) : <span className="text-emerald-600 font-bold">Perfect! No fillers detected.</span>}
                          </div>
                       </div>
                       <div className="bg-slate-50 dark:bg-slate-800/50 p-6 rounded-3xl">
                          <h4 className="font-bold text-sm mb-2">AI Tip</h4>
                          <p className="text-slate-600 dark:text-slate-400 text-sm italic">"Try to embrace silence instead of using 'um' or 'like'. A short pause sounds more confident than a filler word."</p>
                       </div>
                    </div>
                  </div>

                  <Button className="w-full h-16 rounded-2xl bg-slate-900 text-lg font-black shadow-xl" onClick={resetToLanding}>Return to Dashboard</Button>
                </div>
              )}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

/* SUB-COMPONENTS */

function LiveRecordingDisplay({ isListening, recordingTime, formatTime, children }: { isListening: boolean, recordingTime: number, formatTime: Function, children: React.ReactNode }) {
  return (
    <div className="bg-slate-900 rounded-[2.5rem] p-8 border border-slate-800 shadow-2xl min-h-[180px] relative overflow-hidden">
      <div className="flex justify-between items-center mb-6 border-b border-slate-800/50 pb-4">
        <div className="flex items-center gap-3">
          <div className={cn("w-3 h-3 rounded-full", isListening ? "bg-rose-500 animate-pulse shadow-[0_0_10px_rgba(244,63,94,0.8)]" : "bg-slate-700")} />
          <span className="text-xs font-black uppercase tracking-widest text-slate-400">Live AI Transcript</span>
        </div>
        <div className="px-4 py-1 rounded-full bg-slate-800 text-slate-300 font-mono text-sm tracking-tighter">{formatTime(recordingTime)}</div>
      </div>
      <div className="text-2xl leading-relaxed text-slate-400 font-medium">
        {children}
      </div>
    </div>
  );
}

function StepContainer({ title, desc, children }: { title: string, desc: string, children: React.ReactNode }) {
  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="text-center space-y-3">
        <h2 className="text-3xl font-black text-slate-900 dark:text-white leading-tight">{title}</h2>
        <p className="text-slate-500 font-medium max-w-xl mx-auto">{desc}</p>
      </div>
      {children}
    </div>
  );
}

function StatMini({ label, value }: { label: string, value: string | number }) {
  return (
    <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm text-center">
      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{label}</p>
      <p className="text-2xl font-black text-slate-900 dark:text-white">{value}</p>
    </div>
  );
}

function ResultCard({ label, value, color }: { label: string, value: string | number, color: string }) {
  return (
    <div className="text-center bg-white dark:bg-slate-900 rounded-[2.5rem] p-8 shadow-sm border border-slate-100">
      <div className={cn("text-5xl font-black mb-3 tracking-tighter", color)}>{value}</div>
      <div className="text-xs font-black text-slate-400 uppercase tracking-widest">{label}</div>
    </div>
  );
}

function PhaseStep({ icon, title, sub }: { icon: React.ReactNode, title: string, sub: string }) {
  return (
    <div className="flex items-center gap-4 bg-slate-50 dark:bg-slate-800/50 px-5 py-3 rounded-2xl border border-slate-100 dark:border-slate-800">
      <div className="p-2 rounded-lg bg-white shadow-sm text-violet-600">{icon}</div>
      <div>
        <p className="text-xs font-black uppercase tracking-tight">{title}</p>
        <p className="text-[10px] font-bold text-slate-400">{sub}</p>
      </div>
    </div>
  );
}