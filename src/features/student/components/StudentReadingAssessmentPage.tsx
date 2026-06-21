import { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  BookOpen, Mic, Target, Zap, Clock, CheckCircle,
  Sparkles, ChevronRight, Info, AlertTriangle,
  XCircle, Check, PlaySquare, Square, Loader2,
  ChevronLeft, RotateCcw, Activity, StopCircle, TrendingUp
} from 'lucide-react';
import { Button } from '@/shared/components/ui/button';
import { Card, CardContent } from '@/shared/components/ui/card';
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
import StudentLayout from './StudentLayout';

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
  const [activeBand, setActiveBand] = useState<BandLevel>('All');
  const [selectedTopic, setSelectedTopic] = useState<IeltsReadingPractice | null>(null);
  const [topics, setTopics] = useState<IeltsReadingPracticeList[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isFetchingDetail, setIsFetchingDetail] = useState(false);
  const [currentStep, setCurrentStep] = useState<Step>(1);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [showTips, setShowTips] = useState(false);

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
  const [sessionResults, setSessionResults] = useState<{ pass1?: any; pass2?: any }>({});
  const [isSaving, setIsSaving] = useState(false);
  const [backendResults, setBackendResults] = useState<any>(null);

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

  const getTopicStyle = (band: string, type?: string) => {
    const bandNum = band.split(' ')[1];
    let color = "text-[#7B61FF] dark:text-[#9b86ff]";
    let bg = "bg-indigo-50 dark:bg-[#7B61FF]/20";
    let border = "border-indigo-100 dark:border-[#7B61FF]/40";
    let iconType = 'pencil';

    if (bandNum === '5') { color = "text-teal-600 dark:text-teal-400"; bg = "bg-teal-50 dark:bg-teal-900/20"; border = "border-teal-100 dark:border-teal-800"; }
    else if (bandNum === '7') { color = "text-amber-600 dark:text-amber-400"; bg = "bg-amber-50 dark:bg-amber-900/20"; border = "border-amber-100 dark:border-amber-800"; }
    else if (bandNum === '8') { color = "text-rose-600 dark:text-rose-400"; bg = "bg-rose-50 dark:bg-rose-900/20"; border = "border-rose-100 dark:border-rose-800"; }

    if (type === 'Paragraph') iconType = 'paper';
    else if (bandNum === '8') iconType = 'scroll';

    return { color, bg, border, iconType };
  };

  const wordsArray = useMemo(() => realTranscript.split(' ').filter(w => w.length > 0), [realTranscript]);

  useEffect(() => {
    let interval: any;
    if (isListening && isSTTReady) {
      interval = setInterval(() => setRecordingTime(prev => prev + 1), 1000);
    } else {
      clearInterval(interval);
    }
    return () => clearInterval(interval);
  }, [isListening, isSTTReady]);

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
      if (currentStep === 2) {
        if (["um", "uh", "ah", "hmm", "err"].includes(cleanWord))
          return <span key={i} className="text-amber-500 font-medium mx-0.5">{word} </span>;
        return <span key={i} className="text-teal-600 dark:text-teal-400 mx-0.5">{word} </span>;
      }
      if (currentStep === 3) {
        const isKeyword = selectedTopic?.keywords.some((k: string) => k.toLowerCase().includes(cleanWord));
        if (isKeyword && cleanWord.length > 3)
          return <span key={i} className="bg-teal-100 dark:bg-teal-900/30 text-teal-700 dark:text-teal-300 font-medium px-1 rounded mx-0.5">{word} </span>;
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
              newResult.push(<span key={Math.random()} className="text-[#7B61FF] dark:text-[#9b86ff] font-bold bg-indigo-50 dark:bg-[#7B61FF]/20 px-1.5 py-0.5 rounded-md">{part}</span>);
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

  const recordTranscripts = () => (
    <>
      {isListening && !isSTTReady ? (
        <div className="flex items-center justify-center h-full text-slate-400 font-medium">
          <Loader2 className="w-5 h-5 mr-3 animate-spin text-[#7B61FF]" />
          <span>Connecting to microphone...</span>
        </div>
      ) : !isListening && wordsArray.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-full text-slate-400 italic space-y-2">
          <Mic className="w-8 h-8 text-slate-300 mb-2" />
          <span>Waiting to record...</span>
        </div>
      ) : (
        <div className="text-lg leading-relaxed">
          {renderLiveTranscript()}
          {isListening && <span className="inline-block w-2 h-5 bg-[#7B61FF] ml-1 animate-pulse align-middle rounded-sm"></span>}
        </div>
      )}
    </>
  );

  const renderRecordingControls = (onStop: () => void, isLoadingAction = false) => (
    <div className="flex flex-col items-center justify-center mt-10 space-y-6">
      {!isListening ? (
        <button onClick={handleStartRecording}
          className="relative group flex flex-col items-center justify-center w-36 h-36 rounded-full bg-gradient-to-br from-[#7B61FF] to-[#6a50e5] text-white shadow-[0_8px_30px_rgba(123,97,255,0.4)] transition-all duration-300 hover:scale-105 active:scale-95">
          <div className="absolute inset-0 rounded-full bg-[#7B61FF] opacity-30 group-hover:animate-ping" />
          <Mic className="w-12 h-12 mb-2 relative z-10" />
          <span className="font-bold text-sm tracking-wide relative z-10">TAP TO RECORD</span>
        </button>
      ) : (
        <div className="flex flex-col items-center animate-in zoom-in duration-300">
          <div className="text-4xl font-mono font-black text-rose-500 mb-6 tracking-widest flex items-center justify-center gap-4 bg-rose-50 px-8 py-3 rounded-2xl shadow-inner border border-rose-100">
            <span className="w-4 h-4 rounded-full bg-rose-600 animate-pulse shadow-[0_0_15px_rgba(225,29,72,0.6)]" />
            {formatTime(recordingTime)}
          </div>
          <button disabled={isLoadingAction} onClick={onStop}
            className="flex items-center justify-center px-10 py-4 rounded-2xl bg-indigo-700 text-white hover:bg-indigo-700 font-bold text-lg shadow-lg transition-all hover:scale-105 active:scale-95 w-full sm:w-auto">
            {isLoadingAction ? (
              <><Loader2 className="w-6 h-6 mr-3 animate-spin" /> Processing...</>
            ) : (
              <><StopCircle className="w-6 h-6 mr-3" /> Stop & Continue</>
            )}
          </button>
        </div>
      )}
    </div>
  );

  return (
    <StudentLayout
      activeTab="speaking-assessment"
      mainClassName="p-6 md:p-8 max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500 w-full"
    >
      {!selectedTopic ? (
        /* LANDING VIEW */
        <>
          <div className="bg-[#7B61FF] rounded-2xl p-8 md:p-10 text-white shadow-md relative overflow-hidden mb-8">
            <div className="absolute top-0 right-0 -mt-4 -mr-4 w-32 h-32 bg-white opacity-10 rounded-full blur-2xl"></div>
            <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div>
                <h1 className="text-3xl font-bold mb-3 flex items-center gap-2">
                  Speaking Practice <Sparkles className="h-6 w-6 text-yellow-300" fill="currentColor" />
                </h1>
                <p className="text-indigo-50 max-w-2xl text-base md:text-lg leading-relaxed mb-6 md:mb-0">
                  Practice and improve your speaking fluency. Select a topic, record your response, and get instant feedback on your pacing, filler words, and keyword usage.
                </p>
              </div>
              <div>
                <Button variant="secondary" onClick={() => navigate('/student/speaking-history')}
                  className="gap-2 font-semibold bg-white text-[#7B61FF] hover:bg-slate-100 rounded-full px-6 py-2 shadow-sm">
                  <Activity className="w-4 h-4" />
                  View Analytics History
                </Button>
              </div>
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
                <Card key={topic.id}
                  className="border-none shadow-sm hover:shadow-md hover:border-[#7B61FF]/50 transition-all cursor-pointer rounded-2xl bg-white dark:bg-slate-900 overflow-hidden group"
                  onClick={() => handleSelectTopic(topic.id)}>
                  {isFetchingDetail && selectedTopic?.id !== topic.id && (
                    <div className="absolute inset-0 bg-white/50 dark:bg-slate-900/50 flex items-center justify-center z-10 backdrop-blur-sm">
                      <Loader2 className="w-6 h-6 animate-spin text-[#7B61FF]" />
                    </div>
                  )}
                  <CardContent className="p-6">
                    <div className="flex justify-between items-start mb-4">
                      <div className={cn("p-2 rounded-lg", styles.bg, styles.color)}>
                        {styles.iconType === 'paper' ? <BookOpen className="w-5 h-5" /> : styles.iconType === 'scroll' ? <Sparkles className="w-5 h-5" /> : <BookOpen className="w-5 h-5" />}
                      </div>
                      <span className={cn("px-2.5 py-1 rounded-md text-xs font-semibold border", styles.border, styles.color, styles.bg)}>{topic.band}</span>
                    </div>
                    <h3 className="text-base font-semibold text-[#0b132b] dark:text-slate-100 mb-4 line-clamp-2 group-hover:text-[#7B61FF] transition-colors">{topic.title}</h3>
                    <div className="flex items-center gap-4 text-slate-500 text-sm">
                      <div className="flex items-center gap-1.5"><Target className="w-4 h-4" /> {topic.phrases}</div>
                      <div className="flex items-center gap-1.5"><Clock className="w-4 h-4" /> {topic.words}w</div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

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
        <div className="max-w-3xl mx-auto space-y-8">
          <Button variant="ghost" onClick={resetToLanding} className="mb-2 -ml-4 text-slate-500 hover:text-[#0b132b] dark:hover:text-slate-100">
            <ChevronRight className="w-4 h-4 rotate-180 mr-1" /> Back to topics
          </Button>

          <div className="flex items-center justify-center mb-8 gap-4">
            <div className="flex gap-2">
              {[1, 2, 3, 4].map(s => (
                <div key={s} className={cn("h-8 w-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors",
                  currentStep === s ? "bg-[#7B61FF] text-white ring-4 ring-[#7B61FF]/20 dark:ring-[#7B61FF]/40" : s < currentStep ? "bg-[#10b981] text-white" : "bg-slate-200 text-slate-500 dark:bg-slate-800 dark:text-slate-400")}>
                  {s < currentStep ? <Check className="h-4 w-4" /> : s}
                </div>
              ))}
            </div>
          </div>

          {currentStep === 1 && (
            <StepContainer title="Familiarization" desc="Review the question and model answer carefully before starting.">
              <div className="space-y-6">
                <div className="p-6 bg-white dark:bg-slate-900 rounded-2xl border-none shadow-sm">
                  <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-3">Question</h3>
                  <p className="text-lg text-[#0b132b] dark:text-slate-100 font-semibold">{selectedTopic.title}</p>
                </div>
                <div className="p-6 bg-indigo-200 dark:bg-slate-900 rounded-2xl border-none shadow-sm">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-sm font-bold text-[#7B61FF] uppercase tracking-wider flex items-center gap-2">
                      <BookOpen className="w-4 h-4" /> Model Answer
                    </h3>
                  </div>
                  <div className="text-slate-700 dark:text-slate-300 text-lg leading-relaxed bg-slate-50 dark:bg-slate-800/50 p-6 rounded-xl border border-slate-100 dark:border-slate-800">
                    {renderHighlightedText(selectedTopic.modelAnswer, selectedTopic.keywords)}
                  </div>
                </div>
              </div>
              <div className="pt-4 w-full flex flex-col items-center">
                <button onClick={() => setShowTips(!showTips)} className="text-[#7B61FF] dark:text-[#9b86ff] text-sm font-medium flex items-center gap-1.5 hover:underline mb-4">
                  <Info className="w-4 h-4" /> {showTips ? 'Hide Practice Tips' : 'View Practice Tips'}
                </button>
                {showTips && (
                  <ul className="mb-6 w-full p-6 bg-indigo-50/50 dark:bg-slate-900 rounded-2xl border border-indigo-100 dark:border-slate-800 space-y-3">
                    {selectedTopic.tips.map((tip: string, i: number) => (
                      <li key={i} className="text-sm text-slate-700 dark:text-slate-300 flex items-start gap-3">
                        <div className="mt-1.5 w-1.5 h-1.5 rounded-full bg-[#7B61FF] shrink-0" />
                        <span className="leading-relaxed">{tip}</span>
                      </li>
                    ))}
                  </ul>
                )}
                <Button size="lg" className="w-full sm:w-2/3 bg-[#7B61FF] hover:bg-[#6a50e5] text-white rounded-2xl h-14 shadow-[0_8px_20px_rgba(123,97,255,0.2)] font-bold text-lg transition-transform active:scale-95" onClick={() => setCurrentStep(2)}>
                  Start Practice
                </Button>
              </div>
            </StepContainer>
          )}

          {currentStep === 2 && (
            <StepContainer title="First Pass: Fluency" desc="Read the passage aloud naturally. Focus on your pacing and avoid filler words.">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
                <StatMini label="WPM" value={currentWPM} />
                <StatMini label="Words" value={wordsArray.length} />
                <StatMini label="Fillers" value={currentFillers.total} isWarning={currentFillers.total > 2} />
                <StatMini label="Pauses" value={pauseCount} />
              </div>
              <div className="p-8 bg-indigo-100 dark:bg-slate-900 rounded-3xl border-none shadow-[0_4px_25px_rgba(0,0,0,0.03)] mb-8">
                <p className="text-slate-800 dark:text-slate-200 text-xl leading-loose font-medium">{selectedTopic.modelAnswer}</p>
              </div>
              <div className={cn("bg-white dark:bg-slate-900 rounded-3xl p-6 border-2 transition-colors duration-300",
                isListening ? "border-rose-200 shadow-[0_0_30px_rgba(225,29,72,0.1)]" : "border-transparent shadow-sm")}>
                <div className="flex justify-between items-center mb-4 pb-4 border-b border-slate-100 dark:border-slate-800">
                  <span className="text-sm font-bold uppercase tracking-widest text-slate-400">Your Transcript</span>
                </div>
                <div className="min-h-[120px] bg-slate-50 dark:bg-slate-800/50 rounded-xl p-5 border border-slate-100 dark:border-slate-800">
                  {recordTranscripts()}
                </div>
              </div>
              {renderRecordingControls(() => {
                stopListening();
                setSessionResults(prev => ({ ...prev, pass1: { wpm: currentWPM, words: wordsArray.length, fillers: currentFillers.total, fillerCounts: currentFillers.fillerCounts, pauses: pauseCount } }));
                setCurrentStep(3);
              })}
            </StepContainer>
          )}

          {currentStep === 3 && (
            <StepContainer title="Second Pass: Keywords" desc="Read the passage again. This time, make sure you hit the highlighted keywords clearly.">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
                <StatMini label="Keywords" value={`${keywordCoverage}/${selectedTopic.keywords.length}`} isGood={keywordCoverage === selectedTopic.keywords.length && selectedTopic.keywords.length > 0} />
                <StatMini label="Words" value={wordsArray.length} />
                <StatMini label="Fillers" value={currentFillers.total} isWarning={currentFillers.total > 2} />
                <StatMini label="Pauses" value={pauseCount} />
              </div>
              <div className="p-8 bg-white dark:bg-slate-900 rounded-3xl border-none shadow-[0_4px_25px_rgba(0,0,0,0.03)] mb-8">
                <div className="text-slate-800 dark:text-slate-200 text-xl leading-loose font-medium">
                  {renderHighlightedText(selectedTopic.modelAnswer, selectedTopic.keywords)}
                </div>
              </div>
              <div className={cn("bg-white dark:bg-slate-900 rounded-3xl p-6 border-2 transition-colors duration-300",
                isListening ? "border-rose-200 shadow-[0_0_30px_rgba(225,29,72,0.1)]" : "border-transparent shadow-sm")}>
                <div className="flex justify-between items-center mb-4 pb-4 border-b border-slate-100 dark:border-slate-800">
                  <span className="text-sm font-bold uppercase tracking-widest text-slate-400">Your Transcript</span>
                </div>
                <div className="min-h-[120px] bg-slate-50 dark:bg-slate-800/50 rounded-xl p-5 border border-slate-100 dark:border-slate-800">
                  {recordTranscripts()}
                </div>
              </div>
              {renderRecordingControls(async () => {
                stopListening();
                setIsSaving(true);
                const pass2 = { coverage: keywordCoverage, totalKeywords: selectedTopic.keywords.length, words: wordsArray.length, fillers: currentFillers.total, fillerCounts: currentFillers.fillerCounts, pauses: pauseCount, time: recordingTime, wpm: currentWPM };
                try {
                  const res = await saveIeltsReadingAssessment({ topicId: selectedTopic.id, userId: profile?.id || '', band: selectedTopic.band, pass1: sessionResults.pass1, pass2: pass2 });
                  if (res.success) { setBackendResults(res.data); setCurrentStep(4); }
                  else { toast.error(res.error || "Failed to save results"); }
                } catch (err) { toast.error("Error connecting to server"); }
                finally { setIsSaving(false); }
              }, isSaving)}
            </StepContainer>
          )}

          {currentStep === 4 && backendResults && (
            <div className="space-y-10 animate-in fade-in slide-in-from-bottom-8 duration-700 flex flex-col items-center">
              <div className="text-center space-y-3 mb-2">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-emerald-100 text-emerald-500 mb-2 shadow-sm">
                  <CheckCircle className="w-8 h-8" />
                </div>
                <h2 className="text-4xl font-black text-[#0b132b] dark:text-white">Practice Complete!</h2>
                <span className="inline-block px-4 py-1.5 bg-indigo-50 dark:bg-[#7B61FF]/10 text-[#7B61FF] rounded-full text-xs font-bold uppercase tracking-widest mt-2 border border-indigo-100">
                  Band {selectedTopic.band.split(' ')[1]} Assessment Saved
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 w-full max-w-4xl">
                <ScoreCard label="Fluency Score" value={backendResults.fluencyScore} max={100} suffix="%" />
                <ScoreCard label="Avg Pace (WPM)" value={backendResults.weightedWpm} max={160} />
                <ScoreCard label="Keywords Hit" value={`${backendResults.keywordsHit}/${backendResults.totalKeywords}`} max={backendResults.totalKeywords} rawVal={backendResults.keywordsHit} />
              </div>

              <div className="w-full max-w-4xl bg-white dark:bg-slate-900 p-8 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm mt-4 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-amber-50 rounded-full blur-3xl -mr-10 -mt-10" />
                <div className="flex items-center gap-3 mb-6 relative z-10">
                  <div className="p-2.5 bg-amber-100 text-amber-600 rounded-xl">
                    <AlertTriangle className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-[#0b132b] dark:text-white">Filler Word Analysis</h3>
                    <p className="text-sm text-slate-500">Words that interrupted your fluency</p>
                  </div>
                </div>
                {backendResults.frequentFillers.length > 0 ? (
                  <div className="relative z-10">
                    <div className="flex flex-wrap gap-3 mb-6">
                      {backendResults.frequentFillers.map((f: any, i: number) => (
                        <div key={i} className="bg-amber-50 dark:bg-slate-800 px-5 py-2.5 rounded-xl border border-amber-200 dark:border-slate-700 flex items-center gap-3 shadow-sm">
                          <span className="font-mono text-amber-700 dark:text-amber-400 font-bold text-lg">{f.word}</span>
                          <span className="flex items-center justify-center w-6 h-6 bg-white dark:bg-slate-900 rounded-full text-xs font-black text-slate-500 shadow-sm">{f.count}</span>
                        </div>
                      ))}
                    </div>
                    <div className="flex items-start gap-3 bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl border border-slate-100">
                      <TrendingUp className="w-5 h-5 text-[#7B61FF] shrink-0 mt-0.5" />
                      <p className="text-sm text-slate-600 dark:text-slate-300">
                        <strong className="text-slate-900 dark:text-white">Pro Tip:</strong> Pauses are significantly better for your score than fillers. If you need a moment to think, simply take a short breath instead of saying "{backendResults.frequentFillers[0]?.word || 'um'}".
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center gap-3 p-5 bg-emerald-50 text-emerald-700 rounded-2xl border border-emerald-100 relative z-10">
                    <CheckCircle className="w-6 h-6" />
                    <p className="font-bold">Excellent fluency! No frequent filler words detected in your reading.</p>
                  </div>
                )}
              </div>

              <div className="flex flex-col sm:flex-row gap-4 pt-4 w-full max-w-2xl">
                <Button variant="outline" className="flex-1 h-14 rounded-2xl font-bold border-2 text-slate-600 hover:text-[#0b132b] bg-white hover:bg-slate-50 text-lg transition-transform active:scale-95" onClick={() => setCurrentStep(1)}>
                  <RotateCcw className="w-5 h-5 mr-2" /> Try Again
                </Button>
                <Button className="flex-1 h-14 rounded-2xl font-bold bg-[#7B61FF] text-white hover:bg-[#6a50e5] shadow-[0_8px_20px_rgba(123,97,255,0.2)] text-lg transition-transform active:scale-95" onClick={resetToLanding}>
                  Back to Dashboard
                </Button>
              </div>
            </div>
          )}
        </div>
      )}
    </StudentLayout>
  );
}

// ─── Reusable UI Components ────────────────────────────────────────────────────

const StepContainer = ({ title, desc, children }: any) => (
  <div className="space-y-6 animate-in fade-in duration-300 flex flex-col items-center">
    <div className="mb-8 text-center max-w-2xl">
      <h2 className="text-3xl font-black text-[#0b132b] dark:text-white tracking-tight">{title}</h2>
      <p className="text-slate-500 mt-3 text-lg">{desc}</p>
    </div>
    <div className="w-full">{children}</div>
  </div>
);

const StatMini = ({ label, value, isWarning = false, isGood = false }: { label: string; value: string | number; isWarning?: boolean; isGood?: boolean }) => {
  let colorClass = "text-[#7B61FF] dark:text-[#9b86ff]";
  if (isWarning) colorClass = "text-amber-500";
  if (isGood) colorClass = "text-emerald-500";
  return (
    <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm flex flex-col items-center justify-center">
      <div className={cn("text-3xl font-black mb-1", colorClass)}>{value}</div>
      <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{label}</div>
    </div>
  );
};

const ScoreCard = ({ label, value, max, suffix = "", rawVal }: { label: string; value: string | number; max: number; suffix?: string; rawVal?: number }) => {
  const numericVal = rawVal !== undefined ? rawVal : Number(value);
  const ratio = numericVal / max;
  let theme = { text: 'text-rose-500', bg: 'bg-rose-50', border: 'border-rose-100' };
  if (ratio >= 0.8) theme = { text: 'text-emerald-500', bg: 'bg-emerald-50', border: 'border-emerald-100' };
  else if (ratio >= 0.5) theme = { text: 'text-[#7B61FF]', bg: 'bg-indigo-50', border: 'border-indigo-100' };
  return (
    <div className={cn("p-8 rounded-3xl border flex flex-col items-center justify-center transition-all", theme.bg, theme.border)}>
      <div className={cn("text-5xl font-black mb-2 flex items-baseline", theme.text)}>
        {value}<span className="text-2xl ml-1 opacity-50">{suffix}</span>
      </div>
      <div className={cn("text-xs font-bold uppercase tracking-widest opacity-80", theme.text)}>{label}</div>
    </div>
  );
};