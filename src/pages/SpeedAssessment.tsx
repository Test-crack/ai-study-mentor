
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Clock, BookOpen, Target, Award, Play, Pause, Square, Loader2, Lightbulb, CheckCircle } from "lucide-react";
import { 
  fetchReadingModules, 
  fetchReadingPassage, 
  submitAssessmentResults,
  type ReadingModule, 
  type PassageData, 
  type Question,
  type AssessmentResult 
} from "@/lib/reading-api";

const SpeedAssessment = ({ onComplete }: { onComplete?: (results: any) => void }) => {
  const [modules, setModules] = useState<ReadingModule[]>([]);
  const [selectedModule, setSelectedModule] = useState("");
  const [selectedDifficulty, setSelectedDifficulty] = useState("");
  const [currentStep, setCurrentStep] = useState("module-selection");
  const [currentPassage, setCurrentPassage] = useState<PassageData | null>(null);
  const [answers, setAnswers] = useState<{ [key: string]: string }>({});
  const [assessmentResults, setAssessmentResults] = useState<AssessmentResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadingModules, setLoadingModules] = useState(true);
  
  // Timer states
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [readingStartTime, setReadingStartTime] = useState<number | null>(null);
  const [totalReadingTime, setTotalReadingTime] = useState(0); // in seconds
  const [currentTime, setCurrentTime] = useState(0); // current elapsed time
  
  const { toast } = useToast();

  // API Functions
  const loadModules = async () => {
    try {
      const data = await fetchReadingModules();
      setModules(data.modules || []);
      console.log('Successfully loaded modules:', data.modules.length);
    } catch (error) {
      console.error('Error fetching modules:', error);
      
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      let toastDescription = "Please check your connection and try again.";
      
      if (errorMessage.includes('CORS')) {
        toastDescription = "CORS issue detected. Please ensure the backend allows requests from this domain.";
      }
      
      toast({
        title: "Failed to load modules",
        description: toastDescription,
        variant: "destructive"
      });
    } finally {
      setLoadingModules(false);
    }
  };
  
  const loadPassage = async (moduleId: string, difficulty: string) => {
    try {
      setLoading(true);
      console.log('Fetching passage for:', { moduleId, difficulty });
      const passageData = await fetchReadingPassage(moduleId, difficulty);
      console.log('Received passage data:', passageData);
      setCurrentPassage(passageData);
      setCurrentStep("instructions");
      
    } catch (error) {
      console.error('Error fetching passage:', error);
      
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      toast({
        title: "Failed to load passage",
        description: errorMessage,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  // Load modules on component mount
  useEffect(() => {
    loadModules();
  }, []);
  
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

  // Timer functions
  const startTimer = () => {
    const startTime = Date.now();
    setReadingStartTime(startTime);
    setIsTimerRunning(true);
    setCurrentTime(0);
    
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
      // Adjust start time to account for pause
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
  
  const formatTime = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const startAssessment = () => {
    if (!selectedModule || !selectedDifficulty) return;
    loadPassage(selectedModule, selectedDifficulty);
  };

  const beginReading = () => {
    setCurrentStep("reading");
  };

  const handleAnswerChange = (questionId: string, selectedOption: string) => {
    setAnswers({ ...answers, [questionId]: selectedOption });
  };

  const calculateResults = async () => {
    if (!currentPassage || totalReadingTime === 0) return;
    
    // Prepare submission data
    const submissionAnswers = currentPassage.questions.map(question => ({
      questionId: question.id,
      selectedOption: answers[question.id] || ''
    }));
    
    const submission = {
      passageId: currentPassage.id,
      readingTimeSeconds: totalReadingTime,
      answers: submissionAnswers
    };
    
    try {
      console.log('Submitting assessment:', submission);
      const assessmentResult = await submitAssessmentResults(submission);
      console.log('Assessment result received:', assessmentResult);
      
      setAssessmentResults(assessmentResult);
      setCurrentStep("results");
      
      // Also call the onComplete callback if provided (for compatibility)
      onComplete?.({
        moduleId: selectedModule,
        moduleName: modules.find(m => m.id === selectedModule)?.name || selectedModule,
        difficulty: selectedDifficulty,
        readingSpeed: assessmentResult.metrics.wpm,
        comprehensionScore: assessmentResult.metrics.accuracy,
        totalQuestions: currentPassage.questions.length,
        correctAnswers: assessmentResult.answerReview.filter(a => a.isCorrect).length,
        readingTimeSeconds: totalReadingTime,
        readingTimeFormatted: formatTime(totalReadingTime),
        wordCount: currentPassage.wordCount,
        level: assessmentResult.metrics.wpm > 200 ? "Advanced" : assessmentResult.metrics.wpm > 150 ? "Intermediate" : "Beginner"
      });
      
    } catch (error) {
      console.error('Results submission failed:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      toast({
        title: "Failed to submit assessment",
        description: errorMessage,
        variant: "destructive"
      });
    }
  };

  const renderModuleSelection = () => {
    if (loadingModules) {
      return (
        <Card className="max-w-2xl mx-auto">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin mb-4" />
            <p className="text-muted-foreground">Loading reading modules...</p>
          </CardContent>
        </Card>
      );
    }
  
    const selectedModuleData = modules.find(m => m.id === selectedModule);
  
    return (
      <Card className="max-w-2xl mx-auto">
        <CardHeader className="text-center">
          <CardTitle className="text-3xl bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
            Reading Speed Assessment
          </CardTitle>
          <CardDescription className="text-lg">
            Choose a module and difficulty to test your reading speed and comprehension
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <Label htmlFor="module" className="text-lg font-medium">Select a Module:</Label>
            <Select onValueChange={setSelectedModule}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Choose a reading module" />
              </SelectTrigger>
              <SelectContent>
                {modules.map((module) => (
                  <SelectItem key={module.id} value={module.id}>
                    <div className="flex flex-col">
                      <span className="font-medium">{module.name}</span>
                      <span className="text-sm text-muted-foreground">{module.description}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          {selectedModuleData && (
            <div className="space-y-4">
              <Label htmlFor="difficulty" className="text-lg font-medium">Select Difficulty:</Label>
              <Select onValueChange={setSelectedDifficulty}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Choose difficulty level" />
                </SelectTrigger>
                <SelectContent>
                  {selectedModuleData.difficulties.map((difficulty) => (
                    <SelectItem key={difficulty} value={difficulty}>
                      <span className="capitalize">{difficulty}</span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 py-6">
            <div className="text-center space-y-2">
              <BookOpen className="h-8 w-8 mx-auto text-purple-600" />
              <h3 className="font-semibold">Read</h3>
              <p className="text-sm text-muted-foreground">Self-paced reading</p>
            </div>
            <div className="text-center space-y-2">
              <Target className="h-8 w-8 mx-auto text-blue-600" />
              <h3 className="font-semibold">Answer</h3>
              <p className="text-sm text-muted-foreground">Comprehension questions</p>
            </div>
            <div className="text-center space-y-2">
              <Award className="h-8 w-8 mx-auto text-green-600" />
              <h3 className="font-semibold">Results</h3>
              <p className="text-sm text-muted-foreground">Get your speed score</p>
            </div>
          </div>
          
          <Button 
            onClick={startAssessment} 
            disabled={!selectedModule || !selectedDifficulty || loading}
            className="w-full bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Loading Passage...
              </>
            ) : (
              "Start Assessment"
            )}
          </Button>
        </CardContent>
      </Card>
    );
  };

  const renderInstructions = () => {
    const moduleData = modules.find(m => m.id === selectedModule);
    
    return (
      <Card className="max-w-2xl mx-auto">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">Assessment Instructions</CardTitle>
          <CardDescription>
            {moduleData?.name} - {selectedDifficulty && selectedDifficulty.charAt(0).toUpperCase() + selectedDifficulty.slice(1)} Level
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <div className="flex items-start space-x-3">
              <div className="bg-purple-100 text-purple-600 rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold">1</div>
              <p>Read the passage about <strong>{moduleData?.name}</strong> at your natural pace</p>
            </div>
            <div className="flex items-start space-x-3">
              <div className="bg-purple-100 text-purple-600 rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold">2</div>
              <p>Use the timer controls to track your reading time accurately</p>
            </div>
            <div className="flex items-start space-x-3">
              <div className="bg-purple-100 text-purple-600 rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold">3</div>
              <p>Answer comprehension questions based on what you read</p>
            </div>
            <div className="flex items-start space-x-3">
              <div className="bg-purple-100 text-purple-600 rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold">4</div>
              <p>Get your personalized reading speed and comprehension score</p>
            </div>
          </div>
          
          {currentPassage && (
            <div className="bg-blue-50 p-4 rounded-lg">
              <p className="text-sm text-blue-800">
                <strong>Passage Info:</strong> {currentPassage.wordCount} words | {currentPassage.difficulty} difficulty
              </p>
              <p className="text-sm text-blue-800 mt-2">
                <strong>Estimated Reading Time:</strong> {currentPassage.estimatedReadingTime} seconds | 
                <strong>Target Speed:</strong> {currentPassage.idealWPM} WPM
              </p>
            </div>
          )}
          
          <div className="bg-green-50 p-4 rounded-lg">
            <p className="text-sm text-green-800">
              <strong>Tip:</strong> Read at your normal pace and try to understand the content. 
              You can pause and resume the timer as needed.
            </p>
          </div>
          
          <Button onClick={beginReading} className="w-full">
            Begin Reading
          </Button>
        </CardContent>
      </Card>
    );
  };

  const renderReading = () => {
    const moduleData = modules.find(m => m.id === selectedModule);
    
    return (
      <Card className="max-w-4xl mx-auto">
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>Reading Assessment - {moduleData?.name}</CardTitle>
              <CardDescription>{currentPassage?.title}</CardDescription>
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2 text-lg font-bold">
                <Clock className="h-5 w-5" />
                <span className="text-blue-600">
                  {formatTime(currentTime)}
                </span>
              </div>
              {isTimerRunning && (
                <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Timer Controls */}
          <Card className="bg-gradient-to-r from-slate-50 to-gray-100 border-2 border-dashed border-gray-300">
            <CardContent className="p-6">
              <div className="text-center space-y-4">
                <div className="flex items-center justify-center space-x-2">
                  <Clock className="w-5 h-5 text-gray-600" />
                  <span className="text-sm font-medium text-gray-600">Reading Timer Controls</span>
                </div>
                
                <div className="flex justify-center items-center space-x-4">
                  {!isTimerRunning && readingStartTime === null && (
                    <Button 
                      onClick={startTimer} 
                      size="lg"
                      className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 shadow-lg transform hover:scale-105 transition-all"
                    >
                      <Play className="w-5 h-5 mr-2" />
                      Start Reading Timer
                    </Button>
                  )}
                  
                  {isTimerRunning && (
                    <div className="flex items-center space-x-3">
                      <Button 
                        onClick={pauseTimer} 
                        size="lg"
                        className="bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 shadow-lg"
                      >
                        <Pause className="w-5 h-5 mr-2" />
                        Pause
                      </Button>
                      <div className="flex items-center space-x-2 px-3 py-2 bg-green-100 rounded-lg">
                        <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                        <span className="text-sm font-medium text-green-700">Timer Running</span>
                      </div>
                    </div>
                  )}
                  
                  {!isTimerRunning && readingStartTime !== null && (
                    <div className="flex items-center space-x-3">
                      <Button 
                        onClick={resumeTimer} 
                        size="lg"
                        className="bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 shadow-lg"
                      >
                        <Play className="w-5 h-5 mr-2" />
                        Resume
                      </Button>
                      <div className="flex items-center space-x-2 px-3 py-2 bg-yellow-100 rounded-lg">
                        <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                        <span className="text-sm font-medium text-yellow-700">Timer Paused</span>
                      </div>
                    </div>
                  )}
                  
                  {readingStartTime !== null && (
                    <Button 
                      onClick={stopTimer} 
                      size="lg"
                      className="bg-gradient-to-r from-red-500 to-pink-600 hover:from-red-600 hover:to-pink-700 shadow-lg transform hover:scale-105 transition-all"
                    >
                      <Square className="w-5 h-5 mr-2" />
                      Finish Reading
                    </Button>
                  )}
                </div>
                
                {readingStartTime === null && (
                  <p className="text-sm text-gray-600 italic">
                    💡 Click "Start Reading Timer" when you begin reading for accurate speed measurement
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
          
          {/* Reading Passage */}
          <Card className="bg-white shadow-lg">
            <CardHeader className="bg-gradient-to-r from-blue-50 to-purple-50 border-b">
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="text-2xl font-bold text-gray-800 mb-2">
                    {currentPassage?.title}
                  </CardTitle>
                  <div className="flex flex-wrap gap-2">
                    <Badge variant="secondary" className="bg-blue-100 text-blue-700">
                      {currentPassage?.category}
                    </Badge>
                    <Badge variant="outline" className="border-purple-200 text-purple-700">
                      {currentPassage?.difficulty} Level
                    </Badge>
                    <Badge variant="outline" className="border-green-200 text-green-700">
                      {currentPassage?.wordCount} Words
                    </Badge>
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-8">
              <div className="prose prose-lg max-w-none">
                <div 
                  className="text-lg leading-8 text-gray-700 font-medium tracking-wide selection:bg-blue-100 selection:text-blue-900"
                  style={{ 
                    lineHeight: '1.8',
                    fontFamily: 'Georgia, serif',
                    textAlign: 'justify'
                  }}
                >
                  {currentPassage?.text.split('\n').map((paragraph, index) => (
                    paragraph.trim() ? (
                      <p key={index} className="mb-6 first:mt-0 last:mb-0">
                        {paragraph.trim()}
                      </p>
                    ) : null
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
          
        </CardContent>
      </Card>
    );
  };

  const renderQuestions = () => {
    const moduleData = modules.find(m => m.id === selectedModule);
    
    return (
      <Card className="max-w-4xl mx-auto">
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>Comprehension Questions - {moduleData?.name}</CardTitle>
              <CardDescription>Answer the following questions based on what you just read</CardDescription>
            </div>
            <div className="text-right">
              <p className="text-sm font-medium">Reading Time: {formatTime(totalReadingTime)}</p>
              <p className="text-xs text-muted-foreground">
                {currentPassage?.wordCount} words
              </p>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid gap-6">
            {currentPassage?.questions.map((question, index) => (
              <Card key={question.id} className="p-6 bg-gradient-to-br from-white to-gray-50 border-l-4 border-l-blue-500 shadow-md hover:shadow-lg transition-shadow">
                <div className="space-y-4">
                  <div className="flex items-start space-x-3">
                    <div className="flex-shrink-0 w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                      <span className="text-white font-bold text-sm">{index + 1}</span>
                    </div>
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-gray-800 leading-6">
                        {question.stem}
                      </h3>
                    </div>
                  </div>
                  
                  <div className="ml-11">
                    <RadioGroup
                      value={answers[question.id] || ''}
                      onValueChange={(value) => handleAnswerChange(question.id, value)}
                      className="space-y-3"
                    >
                      {question.options.map((option, optionIndex) => {
                        const optionLabel = String.fromCharCode(65 + optionIndex); // A, B, C, D
                        const isSelected = answers[question.id] === option;
                        return (
                          <div key={optionIndex} className={`flex items-start space-x-3 p-3 rounded-lg border-2 transition-all hover:bg-blue-50 hover:border-blue-200 ${
                            isSelected ? 'bg-blue-50 border-blue-400 shadow-sm' : 'border-gray-200'
                          }`}>
                            <RadioGroupItem value={option} id={`q${question.id}-${optionIndex}`} className="mt-0.5" />
                            <div className="flex items-start space-x-3 flex-1">
                              <span className={`flex-shrink-0 w-6 h-6 rounded-full border-2 flex items-center justify-center text-xs font-bold ${
                                isSelected ? 'bg-blue-500 text-white border-blue-500' : 'border-gray-300 text-gray-500'
                              }`}>
                                {optionLabel}
                              </span>
                              <Label 
                                htmlFor={`q${question.id}-${optionIndex}`} 
                                className={`cursor-pointer text-base leading-6 flex-1 ${
                                  isSelected ? 'text-gray-800 font-medium' : 'text-gray-700'
                                }`}
                              >
                                {option}
                              </Label>
                            </div>
                          </div>
                        );
                      })}
                    </RadioGroup>
                  </div>
                </div>
              </Card>
            ))}
          </div>
          
          {/* Progress Indicator */}
          <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-4 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700">Progress</span>
              <span className="text-sm font-medium text-gray-700">
                {Object.keys(answers).length} / {currentPassage?.questions.length || 0} answered
              </span>
            </div>
            <Progress 
              value={((Object.keys(answers).length) / (currentPassage?.questions.length || 1)) * 100} 
              className="h-2"
            />
          </div>
          
          <div className="flex flex-col items-center space-y-4">
            <Button 
              onClick={calculateResults}
              disabled={Object.keys(answers).length !== currentPassage?.questions.length || totalReadingTime === 0}
              size="lg"
              className="w-full max-w-md bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 shadow-lg transform hover:scale-105 transition-all disabled:transform-none disabled:opacity-50"
            >
              <Award className="w-5 h-5 mr-2" />
              Complete Assessment & Get Results
            </Button>
            
            {totalReadingTime === 0 && (
              <div className="text-center p-4 bg-red-50 rounded-lg border border-red-200">
                <p className="text-sm text-red-700 font-medium">
                  ⚠️ Please go back and complete the reading with timer tracking to get accurate results.
                </p>
              </div>
            )}
            
            {Object.keys(answers).length < (currentPassage?.questions.length || 0) && (
              <p className="text-sm text-amber-600 text-center">
                📝 Please answer all questions to continue
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    );
  };

  const renderResults = () => {
    if (!assessmentResults || !currentPassage) return null;
    
    const getPerformanceLevel = (score: number) => {
      if (score >= 80) return { label: "Excellent", color: "text-green-600", bgColor: "bg-green-100" };
      if (score >= 60) return { label: "Good", color: "text-blue-600", bgColor: "bg-blue-100" };
      if (score >= 40) return { label: "Average", color: "text-yellow-600", bgColor: "bg-yellow-100" };
      return { label: "Needs Improvement", color: "text-red-600", bgColor: "bg-red-100" };
    };
    
    const overallLevel = getPerformanceLevel(assessmentResults.metrics.speedLearningScore);
    
    return (
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header */}
        <Card className="bg-gradient-to-r from-green-500 via-blue-500 to-purple-600 text-white overflow-hidden relative">
          <div className="absolute inset-0 bg-gradient-to-r from-green-500/90 via-blue-500/90 to-purple-600/90"></div>
          <CardContent className="relative z-10 p-8 text-center">
            <div className="space-y-4">
              <div className="text-6xl animate-bounce">🎉</div>
              <CardTitle className="text-4xl font-bold">
                Assessment Complete!
              </CardTitle>
              <div className="text-lg opacity-90">
                {currentPassage.title} • {currentPassage.difficulty} level
              </div>
              <div className={`inline-flex items-center px-6 py-2 rounded-full text-lg font-semibold ${overallLevel.bgColor} ${overallLevel.color} bg-opacity-20 backdrop-blur-sm`}>
                Overall Performance: {overallLevel.label}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Performance Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-2 border-blue-200 hover:shadow-xl transition-shadow relative overflow-hidden">
            <div className="absolute top-0 right-0 w-16 h-16 bg-blue-200 rounded-bl-full opacity-50"></div>
            <CardContent className="p-6 relative z-10">
              <div className="flex items-center justify-between mb-3">
                <div className="p-2 bg-blue-500 rounded-lg">
                  <Clock className="w-6 h-6 text-white" />
                </div>
                <div className="text-right">
                  <div className="text-3xl font-bold text-blue-900 animate-pulse">{assessmentResults.metrics.wpm}</div>
                  <div className="text-sm font-medium text-blue-700">WPM</div>
                </div>
              </div>
              <div className="text-sm text-blue-600">Reading Speed</div>
              <Progress value={Math.min((assessmentResults.metrics.wpm / 300) * 100, 100)} className="mt-2 h-2" />
            </CardContent>
          </Card>
          
          <Card className="bg-gradient-to-br from-green-50 to-green-100 border-2 border-green-200 hover:shadow-xl transition-shadow relative overflow-hidden">
            <div className="absolute top-0 right-0 w-16 h-16 bg-green-200 rounded-bl-full opacity-50"></div>
            <CardContent className="p-6 relative z-10">
              <div className="flex items-center justify-between mb-3">
                <div className="p-2 bg-green-500 rounded-lg">
                  <Target className="w-6 h-6 text-white" />
                </div>
                <div className="text-right">
                  <div className="text-3xl font-bold text-green-900 animate-pulse">{assessmentResults.metrics.accuracy}</div>
                  <div className="text-sm font-medium text-green-700">%</div>
                </div>
              </div>
              <div className="text-sm text-green-600">Accuracy</div>
              <Progress value={assessmentResults.metrics.accuracy} className="mt-2 h-2" />
            </CardContent>
          </Card>
          
          <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-2 border-purple-200 hover:shadow-xl transition-shadow relative overflow-hidden">
            <div className="absolute top-0 right-0 w-16 h-16 bg-purple-200 rounded-bl-full opacity-50"></div>
            <CardContent className="p-6 relative z-10">
              <div className="flex items-center justify-between mb-3">
                <div className="p-2 bg-purple-500 rounded-lg">
                  <BookOpen className="w-6 h-6 text-white" />
                </div>
                <div className="text-right">
                  <div className="text-3xl font-bold text-purple-900 animate-pulse">{assessmentResults.metrics.retention}</div>
                  <div className="text-sm font-medium text-purple-700">%</div>
                </div>
              </div>
              <div className="text-sm text-purple-600">Retention</div>
              <Progress value={assessmentResults.metrics.retention} className="mt-2 h-2" />
            </CardContent>
          </Card>
          
          <Card className="bg-gradient-to-br from-orange-50 to-orange-100 border-2 border-orange-200 hover:shadow-xl transition-shadow relative overflow-hidden">
            <div className="absolute top-0 right-0 w-16 h-16 bg-orange-200 rounded-bl-full opacity-50"></div>
            <CardContent className="p-6 relative z-10">
              <div className="flex items-center justify-between mb-3">
                <div className="p-2 bg-orange-500 rounded-lg">
                  <Award className="w-6 h-6 text-white" />
                </div>
                <div className="text-right">
                  <div className="text-3xl font-bold text-orange-900 animate-pulse">{assessmentResults.metrics.speedLearningScore}</div>
                  <div className="text-sm font-medium text-orange-700">Score</div>
                </div>
              </div>
              <div className="text-sm text-orange-600">Overall Score</div>
              <Progress value={assessmentResults.metrics.speedLearningScore} className="mt-2 h-2" />
            </CardContent>
          </Card>
        </div>
          
        {/* Feedback Section */}
        <Card className="bg-gradient-to-r from-indigo-50 to-blue-50 border-indigo-200">
          <CardHeader>
            <CardTitle className="flex items-center text-indigo-900">
              <div className="p-2 bg-indigo-500 rounded-lg mr-3">
                <Lightbulb className="w-5 h-5 text-white" />
              </div>
              Personalized Feedback
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-lg text-indigo-800 leading-relaxed">{assessmentResults.feedback}</p>
          </CardContent>
        </Card>
        
        {/* Reading Statistics */}
        <Card className="bg-white shadow-lg">
          <CardHeader>
            <CardTitle className="text-center text-gray-800">Reading Statistics</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 text-center">
              <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-4 rounded-lg">
                <div className="text-3xl font-bold text-blue-900 mb-1">{formatTime(totalReadingTime)}</div>
                <div className="text-sm font-medium text-blue-700">Reading Time</div>
                <div className="text-xs text-blue-600 mt-1">Actual time spent</div>
              </div>
              <div className="bg-gradient-to-br from-green-50 to-green-100 p-4 rounded-lg">
                <div className="text-3xl font-bold text-green-900 mb-1">{currentPassage.wordCount}</div>
                <div className="text-sm font-medium text-green-700">Words Read</div>
                <div className="text-xs text-green-600 mt-1">Total passage length</div>
              </div>
              <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-4 rounded-lg">
                <div className="text-3xl font-bold text-purple-900 mb-1">
                  {assessmentResults.answerReview.filter(a => a.isCorrect).length}/{assessmentResults.answerReview.length}
                </div>
                <div className="text-sm font-medium text-purple-700">Questions Correct</div>
                <div className="text-xs text-purple-600 mt-1">Comprehension score</div>
              </div>
              <div className="bg-gradient-to-br from-orange-50 to-orange-100 p-4 rounded-lg">
                <div className="text-3xl font-bold text-orange-900 mb-1">{currentPassage.idealWPM}</div>
                <div className="text-sm font-medium text-orange-700">Target WPM</div>
                <div className="text-xs text-orange-600 mt-1">Recommended speed</div>
              </div>
            </div>
          </CardContent>
        </Card>
          
        {/* Answer Review */}
        <Card className="bg-white shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center text-gray-800">
              <div className="p-2 bg-gray-600 rounded-lg mr-3">
                <CheckCircle className="w-5 h-5 text-white" />
              </div>
              Detailed Answer Review
            </CardTitle>
            <CardDescription>
              Review your answers and learn from any mistakes
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {assessmentResults.answerReview.map((review, index) => {
              const question = currentPassage.questions.find(q => q.id === review.questionId);
              return (
                <Card key={review.questionId} className={`overflow-hidden ${
                  review.isCorrect 
                    ? 'bg-gradient-to-r from-green-50 to-emerald-50 border-l-4 border-l-green-500' 
                    : 'bg-gradient-to-r from-red-50 to-pink-50 border-l-4 border-l-red-500'
                }`}>
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <h4 className="text-lg font-semibold text-gray-800">Question {index + 1}</h4>
                      <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                        review.isCorrect 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {review.isCorrect ? (
                          <>
                            <div className="w-4 h-4 rounded-full bg-green-500 flex items-center justify-center mr-2">
                              <span className="text-white text-xs font-bold">✓</span>
                            </div>
                            Correct
                          </>
                        ) : (
                          <>
                            <div className="w-4 h-4 rounded-full bg-red-500 flex items-center justify-center mr-2">
                              <span className="text-white text-xs font-bold">✗</span>
                            </div>
                            Incorrect
                          </>
                        )}
                      </div>
                    </div>
                    
                    {question && (
                      <div className="mb-4 p-3 bg-white rounded-lg border">
                        <p className="text-gray-700 font-medium">{question.stem}</p>
                      </div>
                    )}
                    
                    <div className="space-y-3">
                      <div className="flex items-start space-x-3">
                        <div className="flex-shrink-0 w-20 text-sm font-medium text-gray-600">Your answer:</div>
                        <div className={`flex-1 p-3 rounded-lg ${
                          review.isCorrect ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                        }`}>
                          {review.selectedOption}
                        </div>
                      </div>
                      
                      {!review.isCorrect && (
                        <div className="flex items-start space-x-3">
                          <div className="flex-shrink-0 w-20 text-sm font-medium text-gray-600">Correct answer:</div>
                          <div className="flex-1 p-3 rounded-lg bg-green-100 text-green-800 border border-green-200">
                            {review.correctAnswer}
                          </div>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </CardContent>
        </Card>
        
        {/* Action Buttons */}
        <Card className="bg-gradient-to-r from-blue-500 to-purple-600 text-white">
          <CardContent className="p-8 text-center">
            <h3 className="text-xl font-semibold mb-4">Ready for another challenge?</h3>
            <div className="flex flex-col sm:flex-row justify-center items-center space-y-3 sm:space-y-0 sm:space-x-4">
              <Button 
                onClick={() => {
                  // Reset everything for new assessment
                  setCurrentStep("module-selection");
                  setSelectedModule("");
                  setSelectedDifficulty("");
                  setCurrentPassage(null);
                  setAnswers({});
                  setAssessmentResults(null);
                  setTotalReadingTime(0);
                  setCurrentTime(0);
                  setIsTimerRunning(false);
                  setReadingStartTime(null);
                }}
                size="lg"
                className="bg-white text-blue-600 hover:bg-blue-50 shadow-lg transform hover:scale-105 transition-all"
              >
                <BookOpen className="w-5 h-5 mr-2" />
                Take Another Assessment
              </Button>
              
              <Button 
                onClick={() => window.location.href = "/"}
                size="lg"
                variant="outline"
                className="border-2 border-white text-white hover:bg-white hover:text-blue-600 shadow-lg transform hover:scale-105 transition-all"
              >
                Back to Dashboard
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-100 p-4">
      <div className="container mx-auto py-8">
        {currentStep === "module-selection" && renderModuleSelection()}
        {currentStep === "instructions" && renderInstructions()}
        {currentStep === "reading" && renderReading()}
        {currentStep === "questions" && renderQuestions()}
        {currentStep === "results" && renderResults()}
      </div>
    </div>
  );
};

export default SpeedAssessment;
