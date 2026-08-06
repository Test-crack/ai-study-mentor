import { useState, useEffect } from "react";
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
import { Loader2, ArrowLeft, Clock } from "lucide-react";

// Import original sub-components - we might need to style them or replace them eventually
import { ModuleSelection } from "@/features/speed-assessment/components/ModuleSelection";
import { Instructions } from "@/features/speed-assessment/components/Instructions";
import { ReadingView } from "@/features/speed-assessment/components/ReadingView";
import { QuestionsView } from "@/features/speed-assessment/components/QuestionsView";
import { ResultsView } from "@/features/speed-assessment/components/ResultsView";
import { ReadingTimeError } from "@/features/speed-assessment/components/ReadingTimeError";

interface RunnerProps {
    onCancel: () => void;
    onComplete: () => void;
}

export function StudentAssessmentRunner({ onCancel, onComplete }: RunnerProps) {
  const [modules, setModules] = useState<ReadingModule[]>([]);
  const [selectedModule, setSelectedModule] = useState("");
  const [selectedDifficulty, setSelectedDifficulty] = useState("");
  const [currentStep, setCurrentStep] = useState("module-selection");
  const [currentPassage, setCurrentPassage] = useState<PassageData | null>(null);
  const [answers, setAnswers] = useState<{ [key: string]: string }>({});
  const [assessmentResults, setAssessmentResults] = useState<AssessmentResult | null>(null);
  const [readingTimeError, setReadingTimeError] = useState<ReadingTimeErrorType | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadingModules, setLoadingModules] = useState(true);
  
  // Timer states
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [readingStartTime, setReadingStartTime] = useState<number | null>(null);
  const [totalReadingTime, setTotalReadingTime] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  
  const { toast } = useToast();
  const { focusData, resetTracking, getFinalFocusData } = usePageVisibility();

  // Load modules on mount
  useEffect(() => {
    const loadModules = async () => {
      try {
        const data = await fetchReadingModules(true);
        setModules(data.modules || []);
      } catch (error) {
        console.error('Error fetching modules:', error);
        toast({
          title: "Failed to load modules",
          variant: "destructive"
        });
      } finally {
        setLoadingModules(false);
      }
    };
    loadModules();
  }, [toast]);

  // Timer effect
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isTimerRunning && readingStartTime) {
      interval = setInterval(() => {
        const elapsed = Math.floor((Date.now() - readingStartTime) / 1000);
        setCurrentTime(elapsed);
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isTimerRunning, readingStartTime]);

  const formatTime = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const loadPassage = async (moduleId: string, difficulty: string) => {
    try {
      setLoading(true);
      const passageData = await fetchReadingPassage(moduleId, difficulty, true);
      setCurrentPassage(passageData);
      setCurrentStep("instructions");
    } catch (error) {
      toast({
        title: "Failed to load passage",
        description: error instanceof Error ? error.message : 'Unknown error',
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const startTimer = () => {
    const startTime = Date.now();
    setReadingStartTime(startTime);
    setIsTimerRunning(true);
    setCurrentTime(0);
    resetTracking();
  };
  
  const pauseTimer = () => {
    setIsTimerRunning(false);
  };
  
  const resumeTimer = () => {
    if (readingStartTime) {
      const adjustedStartTime = Date.now() - (currentTime * 1000);
      setReadingStartTime(adjustedStartTime);
      setIsTimerRunning(true);
    }
  };
  
  const stopTimer = () => {
    if (readingStartTime) {
      const finalTime = Math.floor((Date.now() - readingStartTime) / 1000);
      setTotalReadingTime(finalTime);
      setIsTimerRunning(false);
      setCurrentStep("questions");
    }
  };

  const handleRetryReading = () => {
    setTotalReadingTime(0);
    setCurrentTime(0);
    setIsTimerRunning(false);
    setReadingStartTime(null);
    setAnswers({});
    setReadingTimeError(null);
    setCurrentStep("reading");
  };

  const handleStartOver = () => {
    // If completed, call onComplete to return to dashboard
    if (currentStep === "results") {
        onComplete();
    } else {
        // Reset local state if needed
        setCurrentStep("module-selection");
        setSelectedModule("");
        setSelectedDifficulty("");
        setCurrentPassage(null);
        setAnswers({});
        setAssessmentResults(null);
        setReadingTimeError(null);
        setTotalReadingTime(0);
        setCurrentTime(0);
        setIsTimerRunning(false);
        setReadingStartTime(null);
    }
  };

  const calculateResults = async () => {
    if (!currentPassage || totalReadingTime === 0) return;
    setLoading(true);
    
    const finalFocusData = getFinalFocusData();
    const submissionAnswers = currentPassage.questions.map(question => ({
      questionId: question.id,
      selectedOption: answers[question.id] || ''
    }));
    
    const submission = {
      passageId: currentPassage.id,
      readingTimeSeconds: totalReadingTime,
      answers: submissionAnswers,
      focusData: {
        focusTime: finalFocusData.focusTime,
        totalSessionTime: finalFocusData.totalSessionTime,
        focusRatio: finalFocusData.focusRatio,
        tabSwitches: finalFocusData.tabSwitches
      }
    };
    
    try {
      const assessmentResult = await submitAssessmentResults(submission, true);
      setAssessmentResults(assessmentResult);
      setTimeout(() => {
        setCurrentStep("results");
      }, 0);
    } catch (error) {
      console.error('Results submission failed:', error);
      if (error && typeof error === 'object' && 'flag' in error && error.flag === 'too_fast') {
        setReadingTimeError(error as ReadingTimeErrorType);
        setCurrentStep("reading-time-error");
        return;
      }
      toast({
        title: "Failed to submit assessment",
        description: error instanceof Error ? error.message : 'Unknown error',
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  // Wrapper Style
  const Container = ({ children }: { children: React.ReactNode }) => (
    <div className="max-w-4xl mx-auto bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-100 dark:border-slate-800 overflow-hidden min-h-[600px] flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
            <Button variant="ghost" size="sm" onClick={onCancel}>
                <ArrowLeft className="h-4 w-4 mr-2" /> Back to Dashboard
            </Button>
            {isTimerRunning && (
                <div className="flex items-center gap-2 text-brand-teal-600 font-mono font-bold bg-brand-teal-50 dark:bg-brand-teal-900/30 px-3 py-1 rounded-full">
                    <Clock className="h-4 w-4" />
                    {formatTime(currentTime)}
                </div>
            )}
        </div>
        <div className="flex-1 p-6 md:p-8 bg-slate-50 dark:bg-slate-950/50">
            {children}
        </div>
    </div>
  );

  return (
    <Container>
           {currentStep === "module-selection" && (
            <ModuleSelection
              modules={modules}
              selectedModule={selectedModule}
              selectedDifficulty={selectedDifficulty}
              loading={loading}
              loadingModules={loadingModules}
              onModuleChange={setSelectedModule}
              onDifficultyChange={setSelectedDifficulty}
              onStartAssessment={() => loadPassage(selectedModule, selectedDifficulty)}
            />
          )}
          
          {currentStep === "instructions" && (
            <Instructions
              moduleData={modules.find(m => m.id === selectedModule)}
              selectedDifficulty={selectedDifficulty}
              currentPassage={currentPassage}
              onBeginReading={() => setCurrentStep("reading")}
            />
          )}
          
          {currentStep === "reading" && currentPassage && (
            <ReadingView
              moduleData={modules.find(m => m.id === selectedModule)}
              currentPassage={currentPassage}
              currentTime={currentTime}
              isTimerRunning={isTimerRunning}
              readingStartTime={readingStartTime}
              focusData={focusData}
              formatTime={formatTime}
              onStartTimer={startTimer}
              onPauseTimer={pauseTimer}
              onResumeTimer={resumeTimer}
              onStopTimer={stopTimer}
            />
          )}
          
          {currentStep === "questions" && currentPassage && (
            <QuestionsView
              moduleData={modules.find(m => m.id === selectedModule)}
              currentPassage={currentPassage}
              answers={answers}
              totalReadingTime={totalReadingTime}
              focusData={focusData}
              formatTime={formatTime}
              loading={loading}
              onAnswerChange={(questionId, selectedOption) => 
                setAnswers({ ...answers, [questionId]: selectedOption })
              }
              onCalculateResults={calculateResults}
            />
          )}
          
          {currentStep === "results" && assessmentResults && currentPassage && (
            <ResultsView
              assessmentResults={assessmentResults}
              currentPassage={currentPassage}
              totalReadingTime={totalReadingTime}
              formatTime={formatTime}
              onTakeAnother={handleStartOver}
              onBackToDashboard={onComplete}
            />
          )}
          
          {currentStep === "reading-time-error" && readingTimeError && (
            <ReadingTimeError
              error={readingTimeError}
              onRetry={handleRetryReading}
              onStartOver={handleStartOver}
              currentPassageTitle={currentPassage?.title}
            />
          )}
    </Container>
  );
}
