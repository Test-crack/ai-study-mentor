import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { 
  fetchReadingModules, 
  fetchReadingPassage, 
  submitAssessmentResults,
  type ReadingModule, 
  type PassageData, 
  type AssessmentResult,
  type ReadingTimeError as ReadingTimeErrorType
} from "@/lib/reading-api";
import { ReadingTimeError } from "@/components/ReadingTimeError";
import { usePageVisibility } from "@/hooks/usePageVisibility";
import { ModuleSelection } from "@/components/speedAssessment/ModuleSelection";
import { Instructions } from "@/components/speedAssessment/Instructions";
import { ReadingView } from "@/components/speedAssessment/ReadingView";
import { QuestionsView } from "@/components/speedAssessment/QuestionsView";
import { ResultsView } from "@/components/speedAssessment/ResultsView";

const SpeedAssessment = ({ onComplete }: { onComplete?: (results: any) => void }) => {
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
        const data = await fetchReadingModules(true); // Use authenticated call
        setModules(data.modules || []);
      } catch (error) {
        console.error('Error fetching modules:', error);
        toast({
          title: "Failed to load modules",
          description: "Please check your connection and try again.",
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
      const passageData = await fetchReadingPassage(moduleId, difficulty, true); // Use authenticated call
      setCurrentPassage(passageData);
      setCurrentStep("instructions");
    } catch (error) {
      console.error('Error fetching passage:', error);
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
    toast({
      title: "Timer started!",
      description: "Begin reading at your natural pace."
    });
  };
  
  const pauseTimer = () => {
    setIsTimerRunning(false);
    toast({
      title: "Timer paused",
      description: "Click resume when ready to continue."
    });
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
      toast({
        title: "Reading completed!",
        description: `Total reading time: ${formatTime(finalTime)}`
      });
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
    toast({
      title: "Ready to re-read",
      description: "Take your time to read carefully and understand the content."
    });
  };

  const handleStartOver = () => {
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
  };

  const calculateResults = async () => {
    if (!currentPassage || totalReadingTime === 0) return;
    
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
      const assessmentResult = await submitAssessmentResults(submission, true); // Use authenticated call
      setAssessmentResults(assessmentResult);
      setCurrentStep("results");
      
      onComplete?.({
        moduleId: selectedModule,
        moduleName: modules.find(m => m.id === selectedModule)?.name || selectedModule,
        difficulty: selectedDifficulty,
        readingSpeed: assessmentResult.metrics.weightedWPM,
        comprehensionScore: assessmentResult.metrics.accuracy,
        totalQuestions: currentPassage.questions.length,
        correctAnswers: assessmentResult.answerReview.filter(a => a.isCorrect).length,
        readingTimeSeconds: totalReadingTime,
        readingTimeFormatted: formatTime(totalReadingTime),
        wordCount: currentPassage.wordCount,
        level: assessmentResult.metrics.weightedWPM > 200 ? "Advanced" : 
               assessmentResult.metrics.weightedWPM > 150 ? "Intermediate" : "Beginner"
      });
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
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-100 p-4">
      <div className="container mx-auto py-8">
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
            onBackToDashboard={() => window.location.href = "/"}
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
      </div>
    </div>
  );
};

export default SpeedAssessment;
