import { useState, useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { useToast } from "@/shared/hooks/use-toast";
import { 
  fetchReadingModules, 
  fetchReadingPassage, 
  submitAssessmentResults,
  type ReadingModule, 
  type PassageData, 
  type AssessmentResult,
  type ReadingTimeError as ReadingTimeErrorType
} from "@/features/reading-assessment/services/reading-api";
import { usePageVisibility } from "@/shared/hooks/usePageVisibility";
import { Button } from "@/shared/components/ui/button";
import { Card, CardContent } from "@/shared/components/ui/card";
import { Progress } from "@/shared/components/ui/progress";
import { 
  ArrowLeft, 
  Clock, 
  BookOpen, 
  Brain, 
  CheckCircle2, 
  XCircle, 
  Trophy, 
  Zap,
  ChevronRight,
  TrendingUp,
  RefreshCw
} from "lucide-react";
import { cn } from "@/shared/utils";

interface RunnerProps {
    onCancel: () => void;
    onComplete: () => void;
}

type Step = "selection" | "instructions" | "calibration" | "reading" | "questions" | "results" | "error";

export function ZenAssessmentRunner({ onCancel, onComplete }: RunnerProps) {
  const [step, setStep] = useState<Step>("selection");
  const [modules, setModules] = useState<ReadingModule[]>([]);
  const [selectedModule, setSelectedModule] = useState("");
  const [selectedDifficulty, setSelectedDifficulty] = useState("medium");
  const [currentPassage, setCurrentPassage] = useState<PassageData | null>(null);
  const [loading, setLoading] = useState(false);
  
  // Timer & State
  const [readingStartTime, setReadingStartTime] = useState<number | null>(null);
  const [totalReadingTime, setTotalReadingTime] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [answers, setAnswers] = useState<{ [key: string]: string }>({});
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [assessmentResults, setAssessmentResults] = useState<AssessmentResult | null>(null);
  const [readingTimeError, setReadingTimeError] = useState<ReadingTimeErrorType | null>(null);
  
  const { toast } = useToast();
  const { resetTracking, getFinalFocusData } = usePageVisibility();

  // Load modules using React Query to prevent duplicate fetches
  const { data: modulesData } = useQuery({
    queryKey: ['reading-modules'],
    queryFn: () => fetchReadingModules(true),
    staleTime: 1000 * 60 * 5, // 5 minutes cache
  });

  useEffect(() => {
    if (modulesData?.modules) {
      setModules(modulesData.modules);
    }
  }, [modulesData]);

  // Timer Tick
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (step === "reading" && readingStartTime) {
      interval = setInterval(() => {
        setCurrentTime(Math.floor((Date.now() - readingStartTime) / 1000));
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [step, readingStartTime]);

  const loadPassage = async (moduleId: string, difficulty: string) => {
    setLoading(true);
    try {
      const data = await fetchReadingPassage(moduleId, difficulty, true);
      setCurrentPassage(data);
      setStep("instructions");
    } catch {
      toast({ title: "Failed to load passage", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const startReading = () => {
    setReadingStartTime(Date.now());
    setCurrentTime(0);
    resetTracking();
    setStep("reading");
  };

  const finishReading = () => {
    if (readingStartTime) {
      setTotalReadingTime(Math.floor((Date.now() - readingStartTime) / 1000));
      setStep("questions");
    }
  };

  const submitResults = async () => {
    if (!currentPassage) return;
    setLoading(true);
    
    // Auto-calculate final focus data
    const finalFocusData = getFinalFocusData(); 
    
    const submission = {
        passageId: currentPassage.id,
        readingTimeSeconds: totalReadingTime,
        answers: currentPassage.questions.map(q => ({
            questionId: q.id,
            selectedOption: answers[q.id] || ''
        })),
        focusData: {
            focusTime: finalFocusData.focusTime || totalReadingTime,
            totalSessionTime: finalFocusData.totalSessionTime || totalReadingTime,
            focusRatio: finalFocusData.focusRatio || 1.0,
            tabSwitches: finalFocusData.tabSwitches || 0
        }
    };

    try {
        const result = await submitAssessmentResults(submission, true);
        setAssessmentResults(result);
        setStep("results");
    } catch (error: any) {
        if (error?.flag === 'too_fast') {
            setReadingTimeError(error);
            setStep("error");
        } else {
            toast({ title: "Submission Failed", description: "Please try again.", variant: "destructive" });
        }
    } finally {
        setLoading(false);
    }
  };

  // --- Main Render ---
  return (
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-slate-950 flex flex-col">
        {/* Minimal Top Bar for Zen Mode */}
        {step !== 'reading' && (
            <div className="bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm border-b border-slate-200 dark:border-slate-800 p-4">
                <div className="max-w-7xl mx-auto flex items-center justify-between">
                    <div className="flex items-center gap-2 text-indigo-600 font-bold">
                        <Brain className="w-6 h-6" />
                        <span>Zen Mode</span>
                    </div>
                    <Button variant="ghost" size="sm" onClick={onCancel}>
                        Exit Assessment
                    </Button>
                </div>
            </div>
        )}

        <main className="flex-1 overflow-y-auto">
            <div className="max-w-7xl mx-auto px-4 py-8">
                {step === 'selection' && (
                    <SelectionView 
                        modules={modules} 
                        selectedDifficulty={selectedDifficulty}
                        onDifficultyChange={setSelectedDifficulty}
                        onSelectModule={(id) => { setSelectedModule(id); loadPassage(id, selectedDifficulty); }}
                    />
                )}
                {step === 'instructions' && (
                    <InstructionsView 
                        passage={currentPassage}
                        onStart={() => setStep('calibration')}
                    />
                )}
                {step === 'calibration' && <CalibrationView onComplete={startReading} />}
                {step === 'reading' && (
                    <ReadingView 
                        currentTime={currentTime} 
                        currentPassage={currentPassage}
                        onFinish={finishReading}
                        focusData={getFinalFocusData()} // Pass live data check
                    />
                )}
                {step === 'questions' && (
                    <QuestionsView 
                        currentPassage={currentPassage}
                        currentQuestionIndex={currentQuestionIndex}
                        answers={answers}
                        onAnswer={(qId, val) => setAnswers(prev => ({ ...prev, [qId]: val }))}
                        onNext={() => setCurrentQuestionIndex(prev => prev + 1)}
                        onSubmit={submitResults}
                    />
                )}
                {step === 'results' && (
                    <ResultsView 
                        assessmentResults={assessmentResults}
                        totalReadingTime={totalReadingTime}
                        onComplete={onComplete}
                        onRetake={onCancel}
                    />
                )}
                {step === 'error' && (
                    <ErrorView 
                        onRetry={() => setStep('selection')} 
                        onCancel={onCancel} 
                    />
                )}
            </div>
        </main>
    </div>
  );
}

// --- Extracted Sub-Components ---

const SelectionView = ({ modules, selectedDifficulty, onDifficultyChange, onSelectModule }: any) => (
    <motion.div 
      initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
      className="space-y-8 max-w-5xl mx-auto px-4"
    >
      <div className="text-center space-y-4">
        <h2 className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-500 to-purple-600 dark:from-indigo-400 dark:to-purple-400">
          Choose Your Challenge
        </h2>
        <p className="text-slate-500 dark:text-slate-400 text-lg">Select a topic to begin your assessment</p>
      </div>

      <div className="flex justify-center gap-4 mb-8">
        {['easy', 'medium', 'hard'].map((diff) => (
          <button
            key={diff}
            onClick={() => onDifficultyChange(diff)}
            className={cn(
              "px-6 py-2 rounded-full capitalize text-sm font-medium transition-all",
              selectedDifficulty === diff 
                ? "bg-indigo-600 text-white shadow-lg shadow-indigo-500/30 scale-105" 
                : "bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700 hover:border-indigo-500"
            )}
          >
            {diff}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {modules.map((module: ReadingModule) => (
          <motion.div
            key={module.id}
            whileHover={{ y: -5 }}
            onClick={() => onSelectModule(module.id)}
            className="group cursor-pointer bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-xl hover:border-indigo-500/50 transition-all relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
              <BookOpen className="w-24 h-24 transform rotate-12" />
            </div>
            <div className="h-12 w-12 rounded-xl bg-indigo-50 dark:bg-indigo-900/20 flex items-center justify-center mb-4 text-indigo-600 dark:text-indigo-400 group-hover:scale-110 transition-transform">
              <Brain className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-lg mb-2 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
              {module.name}
            </h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 line-clamp-2">
              {module.description || "Test your reading speed and comprehension with this module."}
            </p>
          </motion.div>
        ))}
      </div>
    </motion.div>
);

const InstructionsView = ({ passage, onStart }: any) => (
    <motion.div 
        initial={{ opacity: 0, scale: 0.95 }} 
        animate={{ opacity: 1, scale: 1 }}
        className="max-w-3xl mx-auto py-8"
    >
        <div className="text-center mb-10">
            <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">
                {passage?.title || "Reading Assessment"}
            </h2>
            <div className="flex items-center justify-center gap-3">
                 <span className="px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 text-sm font-medium capitalize">
                    {passage?.difficulty || "Medium"} Level
                </span>
            </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
            <div className="space-y-6">
                <h3 className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <BookOpen className="w-5 h-5 text-indigo-600" /> Assessment Instructions
                </h3>
                <div className="space-y-4">
                    {[
                        "Read the passage at your natural pace.",
                        "Use the timer controls to track reading time.",
                        "Answer comprehension questions based on text.",
                        "Get your personalized speed & retention score."
                    ].map((step, i) => (
                        <div key={i} className="flex gap-4">
                            <div className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 flex items-center justify-center text-sm font-bold shrink-0">
                                {i + 1}
                            </div>
                            <p className="text-slate-600 dark:text-slate-300 text-sm leading-relaxed">{step}</p>
                        </div>
                    ))}
                </div>
            </div>

            <div className="bg-slate-50 dark:bg-slate-800/50 rounded-2xl p-6 space-y-6 border border-slate-100 dark:border-slate-800">
                <h3 className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <Zap className="w-5 h-5 text-amber-500" /> Passage Info
                </h3>
                <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 bg-white dark:bg-slate-900 rounded-xl shadow-sm">
                        <div className="text-2xl font-bold text-slate-900 dark:text-white">{passage?.wordCount}</div>
                        <div className="text-xs text-slate-500 uppercase tracking-wider font-medium">Words</div>
                    </div>
                    <div className="p-4 bg-white dark:bg-slate-900 rounded-xl shadow-sm">
                        <div className="text-2xl font-bold text-slate-900 dark:text-white">{Math.round(passage?.wordCount / 200)}m</div>
                        <div className="text-xs text-slate-500 uppercase tracking-wider font-medium">Est. Time</div>
                    </div>
                </div>
                <div className="p-4 bg-indigo-50 dark:bg-indigo-900/20 rounded-xl border border-indigo-100 dark:border-indigo-800/30">
                    <div className="flex justify-between items-center mb-1">
                        <span className="text-sm text-indigo-900 dark:text-indigo-300 font-medium">Target Speed</span>
                        <span className="font-bold text-indigo-700 dark:text-indigo-400">250 WPM</span>
                    </div>
                    <div className="w-full bg-indigo-200 dark:bg-indigo-900/50 rounded-full h-1.5">
                        <div className="bg-indigo-600 h-1.5 rounded-full w-2/3"></div>
                    </div>
                </div>
            </div>
        </div>

        <div className="flex justify-center">
            <Button onClick={onStart} size="lg" className="px-12 py-6 text-lg rounded-full shadow-xl shadow-indigo-500/20 bg-indigo-600 hover:bg-indigo-700 hover:scale-105 transition-all duration-300 group">
                Start Assessment <ArrowLeft className="w-5 h-5 ml-2 rotate-180 group-hover:translate-x-1 transition-transform" />
            </Button>
        </div>
    </motion.div>
);

const CalibrationView = ({ onComplete }: { onComplete: () => void }) => (
    <div className="flex flex-col items-center justify-center min-h-[60vh]">
      <motion.div
        animate={{
          scale: [1, 1.2, 1],
          opacity: [0.5, 1, 0.5],
        }}
        transition={{
          duration: 3,
          repeat: 1, 
          ease: "easeInOut"
        }}
        onAnimationComplete={onComplete}
        className="w-48 h-48 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-600 flex items-center justify-center shadow-2xl shadow-indigo-500/30"
      >
        <span className="text-white font-medium text-lg">Breathe</span>
      </motion.div>
      <p className="mt-8 text-slate-500 dark:text-slate-400 animate-pulse">
        Get ready to focus...
      </p>
    </div>
);

const ReadingView = ({ currentTime, currentPassage, onFinish, focusData }: any) => {
    // We use a local state for badges to update them even if the prop doesn't trigger re-render often enough
    // But since parent updates on timer tick, this should be fine.
    
    return (
    <motion.div 
      initial={{ opacity: 0 }} animate={{ opacity: 1 }}
      className="max-w-4xl mx-auto space-y-8 py-8"
    >
        {/* Sticky Header with Badges */}
        <div className="sticky top-0 bg-[#F8FAFC]/95 dark:bg-slate-950/95 backdrop-blur-md py-4 z-10 space-y-4 border-b border-indigo-100 dark:border-slate-800 shadow-sm px-4 -mx-4">
            <div className="flex items-center justify-between">
                <div>
                   <h3 className="font-bold text-slate-900 dark:text-white truncate max-w-[200px] md:max-w-md">
                       {currentPassage?.title}
                   </h3>
                   <p className="text-xs text-slate-500 dark:text-slate-400">
                       {currentPassage?.wordCount} words
                   </p>
                </div>

                <div className="flex items-center gap-3">
                     {/* Focus Badge */}
                    <div className={cn(
                        "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-colors",
                        focusData?.isCurrentlyFocused 
                            ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
                            : "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"
                    )}>
                        {focusData?.isCurrentlyFocused ? <CheckCircle2 className="w-3.5 h-3.5" /> : <XCircle className="w-3.5 h-3.5" />}
                        <span className="hidden sm:inline">{focusData?.isCurrentlyFocused ? "Focused" : "Distracted"}</span>
                    </div>

                    {/* Timer Badge */}
                    <div className="flex items-center gap-2 px-4 py-2 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 rounded-lg font-mono font-bold text-lg border border-indigo-100 dark:border-indigo-800/30">
                        <Clock className="w-4 h-4" />
                        <span>{Math.floor(currentTime / 60)}:{(currentTime % 60).toString().padStart(2, '0')}</span>
                    </div>

                    <Button onClick={onFinish} size="sm" className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-500/20">
                        Done Reading
                    </Button>
                </div>
            </div>
            
            {/* Secondary Badges Bar */}
            <div className="flex items-center gap-4 text-xs text-slate-500 dark:text-slate-400">
                 <div className="flex items-center gap-1.5" title="Tab Switches">
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>{focusData?.tabSwitches || 0} Switches</span>
                 </div>
                 <div className="hidden sm:flex items-center gap-1.5">
                     <BookOpen className="w-3.5 h-3.5" />
                     <span>Natural Pace</span>
                 </div>
            </div>
        </div>

        {/* Content */}
        <div className="prose prose-lg dark:prose-invert max-w-none font-serif leading-relaxed text-slate-800 dark:text-slate-200 px-2 sm:px-0">
            {currentPassage?.text.split('\n').map((para: string, i: number) => (
                <p key={i} className="mb-6">{para}</p>
            ))}
        </div>

        <div className="flex justify-center pt-12 pb-24">
            <Button onClick={onFinish} size="lg" className="px-12 py-6 text-lg rounded-full shadow-xl shadow-indigo-500/20 bg-indigo-600 hover:bg-indigo-700 hover:scale-105 transition-all duration-300">
                I'm Finished Reading
            </Button>
        </div>
    </motion.div>
    );
};

const QuestionsView = ({ currentPassage, currentQuestionIndex, answers, onAnswer, onNext, onSubmit }: any) => {
    const question = currentPassage?.questions[currentQuestionIndex];
    if (!question) return null;

    return (
      <div className="max-w-2xl mx-auto py-12 space-y-8">
        <div className="flex items-center justify-between mb-8">
            <span className="text-sm font-medium text-slate-500 uppercase tracking-wider">
                Question {currentQuestionIndex + 1} of {currentPassage?.questions.length}
            </span>
            <Progress value={((currentQuestionIndex + 1) / (currentPassage?.questions.length || 1)) * 100} className="w-32 h-2" />
        </div>

        <AnimatePresence mode="wait">
            <motion.div
                key={question.id}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
            >
                <h3 className="text-2xl font-bold text-slate-900 dark:text-white leading-tight">
                    {question.stem}
                </h3>

                <div className="space-y-3">
                    {question.options.map((option: string, idx: number) => (
                        <div 
                            key={idx}
                            onClick={() => onAnswer(question.id, option)}
                            className={cn(
                                "p-4 rounded-xl border-2 cursor-pointer transition-all flex items-center justify-between group",
                                answers[question.id] === option 
                                    ? "border-indigo-600 bg-indigo-50 dark:bg-indigo-900/20" 
                                    : "border-slate-200 dark:border-slate-800 hover:border-indigo-300 dark:hover:border-slate-700 bg-white dark:bg-slate-900"
                            )}
                        >
                            <span className={cn(
                                "font-medium",
                                answers[question.id] === option ? "text-indigo-700 dark:text-indigo-300" : "text-slate-700 dark:text-slate-300"
                            )}>{option}</span>
                            {answers[question.id] === option && (
                                <CheckCircle2 className="w-5 h-5 text-indigo-600 animate-in zoom-in" />
                            )}
                        </div>
                    ))}
                </div>
            </motion.div>
        </AnimatePresence>

        <div className="flex justify-end pt-8">
            <Button 
                disabled={!answers[question.id]}
                onClick={() => {
                    if (currentQuestionIndex < (currentPassage?.questions.length || 0) - 1) {
                        onNext();
                    } else {
                        onSubmit();
                    }
                }}
                size="lg"
                className="px-8 bg-slate-900 dark:bg-white text-white dark:text-slate-900 hover:opacity-90"
            >
                {currentQuestionIndex < (currentPassage?.questions.length || 0) - 1 ? (
                    <>Next Question <ChevronRight className="w-4 h-4 ml-2" /></>
                ) : (
                    <>Submit Assessment <Trophy className="w-4 h-4 ml-2" /></>
                )}
            </Button>
        </div>
      </div>
    );
};

const ResultsView = ({ assessmentResults, totalReadingTime, onComplete, onRetake }: any) => (
    <motion.div 
        initial={{ opacity: 0, scale: 0.95 }} 
        animate={{ opacity: 1, scale: 1 }}
        className="max-w-4xl mx-auto py-8"
    >
        <div className="text-center mb-12">
            <motion.div 
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 200, damping: 15, delay: 0.2 }}
                className="inline-flex p-6 rounded-full bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 mb-6 shadow-2xl shadow-emerald-500/20"
            >
                <Trophy className="w-16 h-16" />
            </motion.div>
            <h2 className="text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-emerald-600 to-teal-500 mb-4">
                Assessment Complete!
            </h2>
            <p className="text-slate-500 dark:text-slate-400 text-lg">You've successfully finished this reading module.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
            {[
                { label: "Reading Speed", value: Math.round(assessmentResults?.metrics.weightedWPM || 0), unit: "WPM", icon: Zap, color: "text-amber-500", bg: "bg-amber-50 dark:bg-amber-900/10" },
                { label: "Comprehension", value: Math.round(assessmentResults?.metrics.accuracy || 0), unit: "%", icon: CheckCircle2, color: "text-emerald-500", bg: "bg-emerald-50 dark:bg-emerald-900/10" },
                { label: "Total Time", value: `${Math.floor(totalReadingTime / 60)}:${(totalReadingTime % 60).toString().padStart(2, '0')}`, unit: "min", icon: Clock, color: "text-indigo-500", bg: "bg-indigo-50 dark:bg-indigo-900/10" }
            ].map((stat, i) => (
                <motion.div
                    key={stat.label}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 + (i * 0.1) }}
                >
                    <Card className="border-none shadow-xl shadow-slate-200/50 dark:shadow-slate-900/50 overflow-hidden relative group hover:scale-105 transition-transform duration-300">
                        <div className={`absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity ${stat.color}`}>
                            <stat.icon className="w-24 h-24 rotate-12" />
                        </div>
                        <CardContent className="p-8 text-center relative z-10">
                            <div className={`w-12 h-12 rounded-2xl ${stat.bg} ${stat.color} flex items-center justify-center mx-auto mb-4`}>
                                <stat.icon className="w-6 h-6" />
                            </div>
                            <p className="text-sm font-medium text-slate-500 uppercase tracking-wider mb-2">{stat.label}</p>
                            <div className="text-4xl font-bold text-slate-900 dark:text-white mb-1">
                                {stat.value}
                            </div>
                            <p className={`text-sm font-bold ${stat.color}`}>{stat.unit}</p>
                        </CardContent>
                    </Card>
                </motion.div>
            ))}
        </div>

        <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8 }}
            className="flex justify-center gap-6"
        >
            <Button onClick={onComplete} size="lg" className="px-8 py-6 text-lg rounded-full bg-slate-900 dark:bg-white text-white dark:text-slate-900 hover:scale-105 transition-transform shadow-lg hover:shadow-xl">
                Return to Dashboard
            </Button>
            <Button onClick={onRetake} variant="outline" size="lg" className="px-8 py-6 text-lg rounded-full border-2 hover:bg-slate-50 dark:hover:bg-slate-800 hover:scale-105 transition-transform">
                <RefreshCw className="w-5 h-5 mr-2" /> Take Another
            </Button>
        </motion.div>
    </motion.div>
);

const ErrorView = ({ onRetry, onCancel }: any) => (
    <div className="text-center py-20">
        <div className="inline-flex p-6 rounded-full bg-red-100 text-red-600 mb-6 animate-pulse">
            <XCircle className="w-12 h-12" />
        </div>
        <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">Reading Speed Too Fast</h2>
        <p className="text-slate-500 max-w-md mx-auto mb-8">
            We detected a reading speed that suggests skimming. For an accurate assessment, please read at a natural pace.
        </p>
        <div className="flex justify-center gap-4">
            <Button onClick={onRetry}>Try Again</Button>
            <Button variant="outline" onClick={onCancel}>Cancel</Button>
        </div>
    </div>
);
