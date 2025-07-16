
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { Clock, BookOpen, Target, Award } from "lucide-react";

interface Question {
  id: number;
  question: string;
  options: string[];
  correct: number;
}

interface AssessmentData {
  subject: string;
  passage: string;
  wordCount: number;
  questions: Question[];
}

const SpeedAssessment = ({ onComplete }: { onComplete: (results: any) => void }) => {
  const [selectedSubject, setSelectedSubject] = useState("");
  const [currentStep, setCurrentStep] = useState("subject-selection");
  const [timeLeft, setTimeLeft] = useState(0);
  const [startTime, setStartTime] = useState(0);
  const [answers, setAnswers] = useState<{ [key: number]: number }>({});
  const [currentAssessment, setCurrentAssessment] = useState<AssessmentData | null>(null);

  const subjects = [
    "Mathematics",
    "Physics", 
    "Chemistry",
    "Biology",
    "History",
    "Literature",
    "Computer Science",
    "Economics",
    "Psychology",
    "Philosophy",
    "Real Estate",
    "Stock Market",
    "Business Studies",
    "Medical Studies",
    "Law",
    "Engineering"
  ];

  const assessmentData: { [key: string]: AssessmentData } = {
    "Mathematics": {
      subject: "Mathematics",
      passage: "Mathematics is the abstract science of number, quantity, and space, either as abstract concepts or as applied to other disciplines such as physics and engineering. It includes arithmetic, algebra, geometry, and calculus. Mathematical thinking involves logical reasoning, pattern recognition, and problem-solving skills. From ancient civilizations to modern computer algorithms, mathematics has been fundamental to human progress. The beauty of mathematics lies in its precision and universality - mathematical truths are the same regardless of culture or language. Whether calculating the trajectory of a spacecraft or determining the optimal strategy in a game, mathematics provides the tools for understanding and manipulating our world.",
      wordCount: 115,
      questions: [
        {
          id: 1,
          question: "According to the passage, what does mathematics include?",
          options: ["Only arithmetic and algebra", "Arithmetic, algebra, geometry, and calculus", "Only geometry and calculus", "Physics and engineering"],
          correct: 1
        },
        {
          id: 2,
          question: "What makes mathematical truths universal according to the passage?",
          options: ["They are complex", "They are the same regardless of culture or language", "They require advanced education", "They are only for scientists"],
          correct: 1
        },
        {
          id: 3,
          question: "Mathematical thinking involves which of the following?",
          options: ["Only calculations", "Logical reasoning, pattern recognition, and problem-solving", "Memorization only", "Creative writing"],
          correct: 1
        }
      ]
    },
    "Physics": {
      subject: "Physics",
      passage: "Physics is the fundamental science that seeks to understand how the universe works. It studies matter, energy, and their interactions from the smallest subatomic particles to the largest structures in the cosmos. Physics forms the foundation for all other natural sciences and has driven countless technological innovations. From Newton's laws of motion to Einstein's theory of relativity, physics has revolutionized our understanding of space, time, and reality itself. Modern physics explores quantum mechanics, where particles can exist in multiple states simultaneously, and cosmology, which investigates the origin and evolution of the universe. The principles of physics govern everything from the operation of smartphones to the behavior of stars and galaxies.",
      wordCount: 118,
      questions: [
        {
          id: 1,
          question: "What does physics study according to the passage?",
          options: ["Only large structures", "Matter, energy, and their interactions", "Only subatomic particles", "Only technological innovations"],
          correct: 1
        },
        {
          id: 2,
          question: "What revolutionary theories are mentioned in the passage?",
          options: ["Only Newton's laws", "Newton's laws and Einstein's theory of relativity", "Only Einstein's theory", "Quantum mechanics only"],
          correct: 1
        },
        {
          id: 3,
          question: "According to the passage, modern physics explores which areas?",
          options: ["Only quantum mechanics", "Quantum mechanics and cosmology", "Only cosmology", "Only classical mechanics"],
          correct: 1
        }
      ]
    }
  };

  useEffect(() => {
    if (currentStep === "reading" && timeLeft > 0) {
      const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
      return () => clearTimeout(timer);
    } else if (currentStep === "reading" && timeLeft === 0) {
      setCurrentStep("questions");
    }
  }, [timeLeft, currentStep]);

  const startAssessment = () => {
    if (!selectedSubject) return;
    
    const assessment = assessmentData[selectedSubject];
    if (!assessment) return;
    
    setCurrentAssessment(assessment);
    setCurrentStep("instructions");
  };

  const beginReading = () => {
    setStartTime(Date.now());
    setTimeLeft(60); // 1 minute reading time
    setCurrentStep("reading");
  };

  const handleAnswerChange = (questionId: number, answerIndex: number) => {
    setAnswers({ ...answers, [questionId]: answerIndex });
  };

  const proceedToQuestions = () => {
    setCurrentStep("questions");
  };

  const calculateResults = () => {
    if (!currentAssessment) return;
    
    const correctAnswers = currentAssessment.questions.filter(
      (q) => answers[q.id] === q.correct
    ).length;
    
    const comprehensionScore = (correctAnswers / currentAssessment.questions.length) * 100;
    // Calculate actual reading time in seconds
    const endTime = Date.now();
    const actualReadingTimeSeconds = (endTime - startTime) / 1000;
    const actualReadingTimeMinutes = actualReadingTimeSeconds / 60;
    // Calculate words per minute based on actual reading time
    const readingSpeed = Math.round(currentAssessment.wordCount / actualReadingTimeMinutes);
    
    const results = {
      subject: selectedSubject,
      readingSpeed,
      comprehensionScore,
      totalQuestions: currentAssessment.questions.length,
      correctAnswers,
      level: readingSpeed > 200 ? "Advanced" : readingSpeed > 150 ? "Intermediate" : "Beginner"
    };
    
    onComplete(results);
  };

  const renderSubjectSelection = () => (
    <Card className="max-w-2xl mx-auto">
      <CardHeader className="text-center">
        <CardTitle className="text-3xl bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
          Learning Speed Assessment
        </CardTitle>
        <CardDescription className="text-lg">
          Choose a subject to test your reading speed and comprehension
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-4">
          <Label htmlFor="subject" className="text-lg font-medium">Select a Subject:</Label>
          <Select onValueChange={setSelectedSubject}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Choose your preferred subject" />
            </SelectTrigger>
            <SelectContent>
              {subjects.map((subject) => (
                <SelectItem key={subject} value={subject}>
                  {subject}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 py-6">
          <div className="text-center space-y-2">
            <BookOpen className="h-8 w-8 mx-auto text-purple-600" />
            <h3 className="font-semibold">Read</h3>
            <p className="text-sm text-muted-foreground">1 minute reading time</p>
          </div>
          <div className="text-center space-y-2">
            <Target className="h-8 w-8 mx-auto text-blue-600" />
            <h3 className="font-semibold">Answer</h3>
            <p className="text-sm text-muted-foreground">3 comprehension questions</p>
          </div>
          <div className="text-center space-y-2">
            <Award className="h-8 w-8 mx-auto text-green-600" />
            <h3 className="font-semibold">Results</h3>
            <p className="text-sm text-muted-foreground">Get your speed score</p>
          </div>
        </div>
        
        <Button 
          onClick={startAssessment} 
          disabled={!selectedSubject}
          className="w-full bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600"
        >
          Start Assessment
        </Button>
      </CardContent>
    </Card>
  );

  const renderInstructions = () => (
    <Card className="max-w-2xl mx-auto">
      <CardHeader className="text-center">
        <CardTitle className="text-2xl">Assessment Instructions</CardTitle>
        <CardDescription>Subject: {selectedSubject}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-4">
          <div className="flex items-start space-x-3">
            <div className="bg-purple-100 text-purple-600 rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold">1</div>
            <p>You will have <strong>1 minute</strong> to read a passage about {selectedSubject.toLowerCase()}</p>
          </div>
          <div className="flex items-start space-x-3">
            <div className="bg-purple-100 text-purple-600 rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold">2</div>
            <p>After reading, you'll answer <strong>3 comprehension questions</strong></p>
          </div>
          <div className="flex items-start space-x-3">
            <div className="bg-purple-100 text-purple-600 rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold">3</div>
            <p>We'll calculate your reading speed and comprehension score</p>
          </div>
        </div>
        
        <div className="bg-blue-50 p-4 rounded-lg">
          <p className="text-sm text-blue-800">
            <strong>Tip:</strong> Read at your normal pace and try to understand the content. 
            This will help us create a personalized learning experience for you.
          </p>
        </div>
        
        <Button onClick={beginReading} className="w-full">
          Begin Reading
        </Button>
      </CardContent>
    </Card>
  );

  const renderReading = () => (
    <Card className="max-w-4xl mx-auto">
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle>Reading Assessment - {selectedSubject}</CardTitle>
          <div className="flex items-center space-x-2 text-lg font-bold">
            <Clock className="h-5 w-5" />
            <span className={timeLeft <= 10 ? "text-red-500" : "text-blue-600"}>
              {Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, '0')}
            </span>
          </div>
        </div>
        <Progress value={((60 - timeLeft) / 60) * 100} className="mt-2" />
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="prose max-w-none">
          <p className="text-lg leading-relaxed">{currentAssessment?.passage}</p>
        </div>
        
        <div className="flex justify-center">
          <Button 
            onClick={proceedToQuestions}
            className="bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600"
          >
            Continue to Questions
          </Button>
        </div>
      </CardContent>
    </Card>
  );

  const renderQuestions = () => (
    <Card className="max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle>Comprehension Questions - {selectedSubject}</CardTitle>
        <CardDescription>Answer the following questions based on what you just read</CardDescription>
      </CardHeader>
      <CardContent className="space-y-8">
        {currentAssessment?.questions.map((question, index) => (
          <div key={question.id} className="space-y-4">
            <h3 className="text-lg font-semibold">
              Question {index + 1}: {question.question}
            </h3>
            <RadioGroup
              value={answers[question.id]?.toString()}
              onValueChange={(value) => handleAnswerChange(question.id, parseInt(value))}
            >
              {question.options.map((option, optionIndex) => (
                <div key={optionIndex} className="flex items-center space-x-2">
                  <RadioGroupItem value={optionIndex.toString()} id={`q${question.id}-${optionIndex}`} />
                  <Label htmlFor={`q${question.id}-${optionIndex}`} className="cursor-pointer">
                    {option}
                  </Label>
                </div>
              ))}
            </RadioGroup>
          </div>
        ))}
        
        <Button 
          onClick={calculateResults}
          disabled={Object.keys(answers).length !== currentAssessment?.questions.length}
          className="w-full"
        >
          Complete Assessment
        </Button>
      </CardContent>
    </Card>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-100 p-4">
      <div className="container mx-auto py-8">
        {currentStep === "subject-selection" && renderSubjectSelection()}
        {currentStep === "instructions" && renderInstructions()}
        {currentStep === "reading" && renderReading()}
        {currentStep === "questions" && renderQuestions()}
      </div>
    </div>
  );
};

export default SpeedAssessment;
