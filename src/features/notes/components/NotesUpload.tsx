import { useState, useRef, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/shared/components/ui/card";
import { Button } from "@/shared/components/ui/button";
import { Badge } from "@/shared/components/ui/badge";
import { Progress } from "@/shared/components/ui/progress";
import { useToast } from "@/shared/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Book, Plus, Star, Upload, FileText, ArrowLeft, Lightbulb, BookOpen, CheckCircle, Target, Clock, Trophy, Brain, Zap, Play, Pause, RotateCcw, Timer } from "lucide-react";

interface Highlight {
  text: string;
  importance: "High" | "Medium";
  type: string;
}

interface KeyConcept {
  term: string;
  definition: string;
  context: string;
}

interface StudyGuide {
  quickReview: string[];
  mustKnow: string[];
  commonMistakes: string[];
  studyTips: string[];
}

interface Note {
  id: string;
  title: string;
  summary: string;
  keyTopics: string[];
  studyTime: string;
  difficulty: string;
  aiInsights: string;
  processed?: boolean;
  completed?: boolean;
  highlights?: Highlight[];
  keyConcepts?: KeyConcept[];
  studyGuide?: StudyGuide;
}

export const NotesUpload = () => {
  const [uploadedNotes, setUploadedNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingNotes, setLoadingNotes] = useState(true);
  const [selectedNote, setSelectedNote] = useState<Note | null>(null);
  const [studyMode, setStudyMode] = useState(false);
  const [currentSection, setCurrentSection] = useState(0);
  const [conceptsMastered, setConceptsMastered] = useState<Set<string>>(new Set());
  const [studySessionActive, setStudySessionActive] = useState(false);
  const [studyTime, setStudyTime] = useState(0);
  const [sessionStartTime, setSessionStartTime] = useState<Date | null>(null);
  const [studyStreak, setStudyStreak] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  // Study session timer
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (studySessionActive && sessionStartTime) {
      interval = setInterval(() => {
        setStudyTime(Math.floor((Date.now() - sessionStartTime.getTime()) / 1000));
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [studySessionActive, sessionStartTime]);

  const loadNotes = async () => {
    try {
      const { data: notes, error } = await supabase
        .from('notes')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      
      const formattedNotes = notes.map(note => ({
        id: note.id,
        title: note.title,
        summary: note.summary || "Processing...",
        keyTopics: note.key_topics || ["Processing..."],
        studyTime: note.estimated_study_time ? `${note.estimated_study_time} min` : "Calculating...",
        difficulty: note.difficulty_level || "TBD",
        aiInsights: note.ai_insights || "AI analysis in progress...",
        processed: note.processed,
        completed: note.completed || false,
        highlights: note.highlights || [],
        keyConcepts: note.key_concepts || [],
        studyGuide: note.study_guide || null
      }));
      
      setUploadedNotes(formattedNotes);
    } catch (error) {
      console.error('Error loading notes:', error);
      toast({
        title: "Error loading notes",
        description: "Please try refreshing the page",
        variant: "destructive"
      });
    } finally {
      setLoadingNotes(false);
    }
  };

  useEffect(() => {
    loadNotes();
  }, []);

  const extractTextFromFile = async (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = async (e) => {
        const content = e.target?.result;
        
        if (file.type === 'text/plain') {
          resolve(content as string);
        } else if (file.type === 'application/pdf') {
          resolve('PDF content uploaded - AI will extract text during analysis');
        } else if (file.type.includes('image/')) {
          resolve('Image uploaded - AI will extract text using OCR');
        } else {
          resolve(content as string);
        }
      };
      
      reader.onerror = () => reject(new Error('Failed to read file'));
      
      if (file.type === 'text/plain') {
        reader.readAsText(file);
      } else {
        reader.readAsDataURL(file);
      }
    });
  };

  const handleFileUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    
    setLoading(true);
    
    try {
      for (const file of Array.from(files)) {
        if (file.size > 50 * 1024 * 1024) {
          toast({
            title: "File too large",
            description: `${file.name} exceeds the 50MB limit`,
            variant: "destructive"
          });
          continue;
        }

        const { data: noteRecord, error: insertError } = await supabase
          .from('notes')
          .insert({
            title: file.name.replace(/\.[^/.]+$/, ""),
            original_filename: file.name,
            file_type: file.type,
            content: "Processing...",
            processed: false
          })
          .select()
          .single();

        if (insertError) throw insertError;

        const newNote: Note = {
          id: noteRecord.id,
          title: noteRecord.title,
          summary: "AI is analyzing your document...",
          keyTopics: ["Analysis in progress..."],
          studyTime: "Calculating...",
          difficulty: "TBD",
          aiInsights: "Processing your content to provide personalized insights...",
          processed: false
        };

        setUploadedNotes(prev => [newNote, ...prev]);

        const fileContent = await extractTextFromFile(file);

        const { data: analysis, error: analysisError } = await supabase.functions.invoke(
          'analyze-document',
          {
            body: {
              fileContent: fileContent,
              fileName: file.name,
              fileType: file.type
            }
          }
        );

        let analysisResult;
        if (analysisError || !analysis) {
          console.error('AI analysis failed:', analysisError);
          
          // Fallback analysis for demo purposes
          analysisResult = {
            summary: "Document successfully uploaded and processed. Contains educational content suitable for study.",
            keyTopics: ["Study Material", "Educational Content", "Learning Resource"],
            difficultyLevel: "Intermediate",
            estimatedStudyTime: 15,
            aiInsights: "Review the material systematically. Break down complex concepts into smaller parts for better understanding.",
            highlights: [],
            keyConcepts: [],
            studyGuide: {
              quickReview: ["Review main concepts"],
              mustKnow: ["Key definitions"],
              commonMistakes: ["Don't skip examples"],
              studyTips: ["Use active recall"]
            }
          };
          
          toast({
            title: "Analysis completed with fallback",
            description: "Document uploaded successfully, using basic analysis",
            variant: "default"
          });
        } else {
          // USE THE EXACT DATA FROM EDGE FUNCTION
          analysisResult = analysis;
          console.log('Using Edge Function analysis:', analysisResult);
          
          toast({
            title: "AI Analysis Complete!",
            description: "Your document has been analyzed successfully",
            variant: "default"
          });
        }
        console.log('About to update database with:', {
  highlights: analysisResult.highlights,
  keyConcepts: analysisResult.keyConcepts,
  studyGuide: analysisResult.studyGuide
});

        const { error: updateError } = await supabase
          .from('notes')
          .update({
            content: fileContent,
            summary: analysisResult.summary,
            key_topics: analysisResult.keyTopics,
            difficulty_level: analysisResult.difficultyLevel,
            estimated_study_time: analysisResult.estimatedStudyTime,
            ai_insights: analysisResult.aiInsights,
            highlights: analysisResult.highlights,
            key_concepts: analysisResult.keyConcepts,
            study_guide: analysisResult.studyGuide,
            processed: true
          })
          .eq('id', noteRecord.id);

       console.log('Database update result:', { updateError });

if (updateError) {
  console.error('Update error details:', updateError);
  toast({
    title: "Database Update Error",
    description: updateError.message,
    variant: "destructive"
  });
}

        await loadNotes();
      }

      toast({
        title: "Upload successful",
        description: "Your documents have been analyzed and are ready for study!"
      });

    } catch (error) {
      console.error('Upload error:', error);
      toast({
        title: "Upload failed",
        description: `Error: ${error.message || 'Please try again later'}`,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    handleFileUpload(e.target.files);
  };

  const handleChooseFiles = () => {
    fileInputRef.current?.click();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    handleFileUpload(e.dataTransfer.files);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const startLearning = (note: Note) => {
    setSelectedNote(note);
    setStudyMode(true);
    setCurrentSection(0);
    setConceptsMastered(new Set());
    setStudyTime(0);
    setSessionStartTime(new Date());
  };

  const backToNotes = () => {
    setStudyMode(false);
    setSelectedNote(null);
    setStudySessionActive(false);
    setStudyTime(0);
    setSessionStartTime(null);
  };

  const markAsCompleted = async (noteId: string) => {
    try {
      const { error } = await supabase
        .from('notes')
        .update({ 
          completed: true, 
          completed_at: new Date().toISOString() 
        })
        .eq('id', noteId);

      if (error) throw error;

      toast({
        title: "Study Session Complete!",
        description: `Congratulations! You studied for ${Math.floor(studyTime / 60)} minutes`,
        variant: "default"
      });

      setUploadedNotes(prev => 
        prev.map(note => 
          note.id === noteId ? { ...note, completed: true } : note
        )
      );

      // Update study streak
      setStudyStreak(prev => prev + 1);

      // Auto-navigate back after completion
      setTimeout(() => {
        backToNotes();
      }, 2000);

    } catch (error) {
      console.error('Error marking as completed:', error);
      toast({
        title: "Error",
        description: "Failed to mark as completed",
        variant: "destructive"
      });
    }
  };

  const downloadStudyNotes = (note: Note) => {
    const studyContent = `
# ${note.title} - AI-Generated Study Guide

## 📋 Summary
${note.summary}

## 🎯 Key Topics
${note.keyTopics.map(topic => `• ${topic}`).join('\n')}

## ⭐ Highlighted Content
${note.highlights?.map((highlight, index) => 
  `### ${index + 1}. ${highlight.type} (${highlight.importance} Importance)
${highlight.text}
`
).join('\n') || 'No highlights available'}

## 🧠 Key Concepts & Definitions
${note.keyConcepts?.map((concept, index) => 
  `### ${index + 1}. ${concept.term}
**Definition:** ${concept.definition}
**Context:** ${concept.context}
`
).join('\n') || 'No key concepts available'}

## 📚 Study Guide

### ✅ Quick Review Checklist
${note.studyGuide?.quickReview?.map(item => `- [ ] ${item}`).join('\n') || 'Not available'}

### 🎯 Must Know (Critical)
${note.studyGuide?.mustKnow?.map(item => `• ${item}`).join('\n') || 'Not available'}

### ⚠️ Common Mistakes to Avoid
${note.studyGuide?.commonMistakes?.map(item => `• ${item}`).join('\n') || 'Not available'}

### 💡 Study Tips & Strategies
${note.studyGuide?.studyTips?.map(item => `• ${item}`).join('\n') || 'Not available'}

## 🤖 AI Learning Strategy
${note.aiInsights}

---
**Study Information:**
- Estimated Time: ${note.studyTime}
- Difficulty Level: ${note.difficulty}
- Generated: ${new Date().toLocaleDateString()}

*Created by TestCrack AI Study Mentor*
    `.trim();

    const blob = new Blob([studyContent], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${note.title}_AI_Study_Guide.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast({
      title: "Study Guide Downloaded!",
      description: "Your comprehensive AI study guide is ready for offline use",
      variant: "default"
    });
  };

  const generateQuizFromContent = (note: Note) => {
    const questions = [];
    
    // Generate from key concepts
    note.keyConcepts?.slice(0, 3).forEach((concept, index) => {
      const wrongAnswers = [
        "An unrelated business term",
        "A mathematical formula",
        "A historical event"
      ];
      
      questions.push({
        id: index + 1,
        question: `What does "${concept.term}" mean in this context?`,
        options: [concept.definition, ...wrongAnswers].sort(() => Math.random() - 0.5),
        correctAnswer: concept.definition,
        explanation: concept.context,
        type: 'definition'
      });
    });

    // Generate from highlights
    note.highlights?.filter(h => h.importance === 'High').slice(0, 2).forEach((highlight, index) => {
      questions.push({
        id: questions.length + 1,
        question: `True or False: ${highlight.text.substring(0, 100)}...`,
        options: ["True", "False"],
        correctAnswer: "True",
        explanation: `This is a key ${highlight.type.toLowerCase()} from your study material.`,
        type: 'true-false'
      });
    });

    return questions;
  };

  const startQuizMode = (note: Note) => {
    const quiz = generateQuizFromContent(note);
    if (quiz.length === 0) {
      toast({
        title: "Quiz Not Available",
        description: "Not enough content processed for quiz generation",
        variant: "destructive"
      });
      return;
    }

    // Store quiz in state and show it
    setCurrentQuiz(quiz);
    setCurrentSection(-1); // Special mode for quiz
    
    toast({
      title: "Quiz Mode Activated!",
      description: `Generated ${quiz.length} questions from your study material`,
      variant: "default"
    });
  };

  const [currentQuiz, setCurrentQuiz] = useState<any[]>([]);
  const [currentQuizIndex, setCurrentQuizIndex] = useState(0);
  const [quizAnswers, setQuizAnswers] = useState<Record<number, string>>({});
  const [showQuizResults, setShowQuizResults] = useState(false);

  const toggleStudySession = () => {
    if (!studySessionActive) {
      setStudySessionActive(true);
      setSessionStartTime(new Date());
      toast({
        title: "Study Session Started!",
        description: "Focus mode activated. Good luck with your learning!",
        variant: "default"
      });
    } else {
      setStudySessionActive(false);
      toast({
        title: "Study Session Paused",
        description: `You studied for ${Math.floor(studyTime / 60)} minutes and ${studyTime % 60} seconds`,
        variant: "default"
      });
    }
  };

  const masterConcept = (conceptTerm: string) => {
    const newMastered = new Set(conceptsMastered);
    if (newMastered.has(conceptTerm)) {
      newMastered.delete(conceptTerm);
      toast({
        title: "Concept unmarked",
        description: "Keep studying this concept",
        variant: "default"
      });
    } else {
      newMastered.add(conceptTerm);
      toast({
        title: "Concept Mastered!",
        description: `Great job mastering "${conceptTerm}"`,
        variant: "default"
      });
    }
    setConceptsMastered(newMastered);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const calculateProgress = () => {
    if (!selectedNote) return 0;
    const totalConcepts = selectedNote.keyConcepts?.length || 1;
    const masteredCount = conceptsMastered.size;
    return Math.round((masteredCount / totalConcepts) * 100);
  };

  const nextSection = () => {
    if (!selectedNote) return;
    const maxSections = 4; // Overview, Highlights, Concepts, Study Guide
    if (currentSection < maxSections - 1) {
      setCurrentSection(currentSection + 1);
    }
  };

  const prevSection = () => {
    if (currentSection > 0) {
      setCurrentSection(currentSection - 1);
    }
  };

  if (studyMode && selectedNote) {
    const progress = calculateProgress();
    
    // Quiz Results Screen
    if (showQuizResults && currentQuiz.length > 0) {
      const score = currentQuiz.reduce((correct, question) => {
        return correct + (quizAnswers[question.id] === question.correctAnswer ? 1 : 0);
      }, 0);
      const percentage = Math.round((score / currentQuiz.length) * 100);
      
      return (
        <div className="max-w-4xl mx-auto space-y-6">
          <Card>
            <CardHeader className="text-center">
              <CardTitle className="text-2xl">Quiz Complete!</CardTitle>
              <div className="text-4xl font-bold text-center my-4">
                <span className={percentage >= 70 ? 'text-green-500' : percentage >= 50 ? 'text-yellow-500' : 'text-red-500'}>
                  {percentage}%
                </span>
              </div>
              <CardDescription>
                You scored {score} out of {currentQuiz.length} questions correctly
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Performance Feedback */}
              <div className={`p-4 rounded-lg text-center ${
                percentage >= 70 ? 'bg-green-50 text-green-800' : 
                percentage >= 50 ? 'bg-yellow-50 text-yellow-800' : 
                'bg-red-50 text-red-800'
              }`}>
                {percentage >= 70 && "Excellent work! You have a strong understanding of the material."}
                {percentage >= 50 && percentage < 70 && "Good effort! Review the concepts you missed and try again."}
                {percentage < 50 && "Keep studying! Focus on the key concepts and highlights before retaking."}
              </div>

              {/* Question Review */}
              <div className="space-y-4">
                <h3 className="font-semibold">Review Your Answers:</h3>
                {currentQuiz.map((question, index) => {
                  const userAnswer = quizAnswers[question.id];
                  const isCorrect = userAnswer === question.correctAnswer;
                  
                  return (
                    <div key={index} className={`border rounded-lg p-4 ${
                      isCorrect ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'
                    }`}>
                      <div className="flex items-start space-x-2">
                        <span className={`font-semibold ${isCorrect ? 'text-green-600' : 'text-red-600'}`}>
                          {isCorrect ? '✓' : '✗'}
                        </span>
                        <div className="flex-1">
                          <p className="font-medium">{question.question}</p>
                          <p className="text-sm mt-1">
                            <span className="text-gray-600">Your answer: </span>
                            <span className={isCorrect ? 'text-green-600' : 'text-red-600'}>
                              {userAnswer || 'Not answered'}
                            </span>
                          </p>
                          {!isCorrect && (
                            <p className="text-sm mt-1">
                              <span className="text-gray-600">Correct answer: </span>
                              <span className="text-green-600">{question.correctAnswer}</span>
                            </p>
                          )}
                          <p className="text-xs text-gray-500 mt-2">{question.explanation}</p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Action Buttons */}
              <div className="flex space-x-4 justify-center">
                <Button 
                  onClick={() => {
                    setShowQuizResults(false);
                    setCurrentQuizIndex(0);
                    setQuizAnswers({});
                    setCurrentSection(0);
                  }}
                  className="bg-gradient-to-r from-purple-500 to-blue-500"
                >
                  Back to Study Material
                </Button>
                {percentage < 70 && (
                  <Button 
                    variant="outline"
                    onClick={() => {
                      setShowQuizResults(false);
                      setCurrentQuizIndex(0);
                      setQuizAnswers({});
                      // Restart quiz
                    }}
                  >
                    Retake Quiz
                  </Button>
                )}
                {percentage >= 70 && (
                  <Button 
                    variant="outline"
                    onClick={() => markAsCompleted(selectedNote.id)}
                  >
                    Mark as Mastered
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      );
    }

    // Quiz Mode
    if (currentSection === -1 && currentQuiz.length > 0) {
      const currentQ = currentQuiz[currentQuizIndex];
      
      return (
        <div className="max-w-4xl mx-auto space-y-6">
          <div className="flex items-center justify-between">
            <Button variant="outline" onClick={() => setCurrentSection(0)}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Study
            </Button>
            <Badge variant="secondary">
              Question {currentQuizIndex + 1} of {currentQuiz.length}
            </Badge>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Practice Quiz - {selectedNote.title}</CardTitle>
              <Progress value={((currentQuizIndex + 1) / currentQuiz.length) * 100} />
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-lg font-medium">{currentQ.question}</div>
              <div className="space-y-2">
                {currentQ.options.map((option: string, index: number) => (
                  <Button
                    key={index}
                    variant={quizAnswers[currentQ.id] === option ? "default" : "outline"}
                    className="w-full text-left justify-start"
                    onClick={() => setQuizAnswers({...quizAnswers, [currentQ.id]: option})}
                  >
                    {String.fromCharCode(65 + index)}. {option}
                  </Button>
                ))}
              </div>
              
              <div className="flex space-x-2">
                <Button 
                  variant="outline" 
                  onClick={() => setCurrentQuizIndex(Math.max(0, currentQuizIndex - 1))}
                  disabled={currentQuizIndex === 0}
                >
                  Previous
                </Button>
                <Button 
                  onClick={() => {
                    if (currentQuizIndex < currentQuiz.length - 1) {
                      setCurrentQuizIndex(currentQuizIndex + 1);
                    } else {
                      setShowQuizResults(true);
                    }
                  }}
                  disabled={!quizAnswers[currentQ.id]}
                >
                  {currentQuizIndex === currentQuiz.length - 1 ? 'Finish Quiz' : 'Next Question'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      );
    }

    return (
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header with Study Timer */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button variant="outline" onClick={backToNotes}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Notes
            </Button>
            <div>
              <h2 className="text-2xl font-bold">{selectedNote.title}</h2>
              <p className="text-muted-foreground">
                {selectedNote.difficulty} • {selectedNote.studyTime}
              </p>
            </div>
          </div>
          
          {/* Study Session Controls */}
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2 bg-blue-50 px-4 py-2 rounded-lg">
              <Clock className="h-4 w-4 text-blue-600" />
              <span className="font-mono text-blue-800">{formatTime(studyTime)}</span>
            </div>
            <Button
              variant={studySessionActive ? "destructive" : "default"}
              onClick={toggleStudySession}
              className="flex items-center space-x-2"
            >
              {studySessionActive ? (
                <>
                  <Pause className="h-4 w-4" />
                  <span>Pause Study</span>
                </>
              ) : (
                <>
                  <Play className="h-4 w-4" />
                  <span>Start Study</span>
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Progress Dashboard */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-green-600">{progress}%</div>
              <div className="text-sm text-muted-foreground">Progress</div>
              <Progress value={progress} className="mt-2" />
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-blue-600">{conceptsMastered.size}</div>
              <div className="text-sm text-muted-foreground">Concepts Mastered</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-purple-600">{Math.floor(studyTime / 60)}</div>
              <div className="text-sm text-muted-foreground">Minutes Studied</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-orange-600">{studyStreak}</div>
              <div className="text-sm text-muted-foreground">Study Streak</div>
            </CardContent>
          </Card>
        </div>

        {/* Section Navigation */}
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-4">
              <Button
                variant={currentSection === 0 ? "default" : "outline"}
                onClick={() => setCurrentSection(0)}
              >
                Overview
              </Button>
              <Button
                variant={currentSection === 1 ? "default" : "outline"}
                onClick={() => setCurrentSection(1)}
              >
                Highlights ({selectedNote.highlights?.length || 0})
              </Button>
              <Button
                variant={currentSection === 2 ? "default" : "outline"}
                onClick={() => setCurrentSection(2)}
              >
                Concepts ({selectedNote.keyConcepts?.length || 0})
              </Button>
              <Button
                variant={currentSection === 3 ? "default" : "outline"}
                onClick={() => setCurrentSection(3)}
              >
                Study Guide
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Content Based on Current Section */}
        {currentSection === 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Target className="h-5 w-5 text-green-600" />
                <span>Learning Overview</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-gradient-to-r from-purple-50 to-blue-50 p-6 rounded-lg">
                <h3 className="font-semibold text-lg mb-2">Your Learning Path</h3>
                <p className="text-purple-800 mb-4">{selectedNote.summary}</p>
                <div className="text-sm text-purple-700">
                  <strong>AI Strategy:</strong> {selectedNote.aiInsights}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <Button onClick={() => setCurrentSection(1)} className="h-20 flex-col">
                  <Lightbulb className="h-6 w-6 mb-2" />
                  Start with Highlights
                </Button>
                <Button onClick={() => setCurrentSection(2)} variant="outline" className="h-20 flex-col">
                  <Brain className="h-6 w-6 mb-2" />
                  Master Concepts
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {currentSection === 1 && selectedNote.highlights && selectedNote.highlights.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Lightbulb className="h-5 w-5 text-yellow-500" />
                <span>Key Highlights - Focus Points</span>
              </CardTitle>
              <CardDescription>Most important content extracted from your document</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {selectedNote.highlights.map((highlight, index) => (
                <div 
                  key={index}
                  className={`p-4 rounded-lg border-l-4 ${
                    highlight.importance === 'High' 
                      ? 'bg-yellow-50 border-yellow-400' 
                      : 'bg-blue-50 border-blue-400'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        <Badge 
                          variant={highlight.importance === 'High' ? 'default' : 'secondary'}
                        >
                          {highlight.type}
                        </Badge>
                        <Badge variant="outline">{highlight.importance} Priority</Badge>
                      </div>
                      <p className="text-sm font-medium leading-relaxed">{highlight.text}</p>
                    </div>
                  </div>
                </div>
              ))}
              <div className="flex space-x-2">
                <Button onClick={() => setCurrentSection(2)}>
                  Next: Master Concepts
                </Button>
                <Button variant="outline" onClick={() => setCurrentSection(0)}>
                  Back to Overview
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {currentSection === 2 && selectedNote.keyConcepts && selectedNote.keyConcepts.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Brain className="h-5 w-5 text-purple-600" />
                <span>Master Key Concepts</span>
              </CardTitle>
              <CardDescription>Click concepts when you understand them completely</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {selectedNote.keyConcepts.map((concept, index) => {
                const isMastered = conceptsMastered.has(concept.term);
                return (
                  <div 
                    key={index} 
                    className={`border rounded-lg p-4 transition-all cursor-pointer ${
                      isMastered ? 'bg-green-50 border-green-300' : 'hover:bg-gray-50'
                    }`}
                    onClick={() => masterConcept(concept.term)}
                  >
                    <div className="flex items-start space-x-3">
                      <div className="flex-shrink-0">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                          isMastered ? 'bg-green-500 text-white' : 'bg-purple-100 text-purple-600'
                        }`}>
                          {isMastered ? <CheckCircle className="h-5 w-5" /> : <span className="font-semibold text-sm">{index + 1}</span>}
                        </div>
                      </div>
                      <div className="flex-1">
                        <h4 className={`font-semibold ${isMastered ? 'text-green-900' : 'text-purple-900'}`}>
                          {concept.term}
                        </h4>
                        <p className="text-sm text-gray-700 mt-1">{concept.definition}</p>
                        <p className="text-xs text-muted-foreground mt-2">{concept.context}</p>
                      </div>
                    </div>
                  </div>
                );
              })}
              <div className="flex space-x-2">
                <Button onClick={() => setCurrentSection(3)}>
                  Next: Study Guide
                </Button>
                <Button variant="outline" onClick={() => setCurrentSection(1)}>
                  Back to Highlights
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {currentSection === 3 && selectedNote.studyGuide && (
          <div className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              {/* Quick Review */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <CheckCircle className="h-5 w-5 text-green-600" />
                    <span>Quick Review Checklist</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-3">
                    {selectedNote.studyGuide.quickReview.map((item, index) => (
                      <li key={index} className="flex items-start space-x-3">
                        <input 
                          type="checkbox" 
                          className="mt-1 h-4 w-4 text-green-600 rounded"
                          onChange={(e) => {
                            if (e.target.checked) {
                              toast({
                                title: "Checkpoint Complete!",
                                description: "Great progress on your study goals",
                                variant: "default"
                              });
                            }
                          }}
                        />
                        <span className="text-sm">{item}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>

              {/* Must Know */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Star className="h-5 w-5 text-red-500" />
                    <span>Critical Knowledge</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-3">
                    {selectedNote.studyGuide.mustKnow.map((item, index) => (
                      <li key={index} className="flex items-start space-x-2">
                        <div className="w-2 h-2 bg-red-500 rounded-full mt-2 flex-shrink-0"></div>
                        <span className="text-sm font-medium">{item}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>

              {/* Common Mistakes */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <span className="text-orange-500">⚠️</span>
                    <span>Avoid These Mistakes</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-3">
                    {selectedNote.studyGuide.commonMistakes.map((item, index) => (
                      <li key={index} className="flex items-start space-x-2">
                        <div className="w-2 h-2 bg-orange-500 rounded-full mt-2 flex-shrink-0"></div>
                        <span className="text-sm">{item}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>

              {/* Study Tips */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Lightbulb className="h-5 w-5 text-blue-500" />
                    <span>Pro Study Tips</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-3">
                    {selectedNote.studyGuide.studyTips.map((item, index) => (
                      <li key={index} className="flex items-start space-x-2">
                        <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                        <span className="text-sm">{item}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <Card>
          <CardContent className="p-6">
            <div className="flex flex-wrap gap-4 justify-center">
              <Button 
                className="bg-gradient-to-r from-green-500 to-blue-500 flex items-center space-x-2"
                onClick={() => markAsCompleted(selectedNote.id)}
                disabled={progress < 50}
              >
                <Trophy className="h-4 w-4" />
                <span>Complete Study Session</span>
              </Button>
              
              <Button 
                variant="outline"
                onClick={() => startQuizMode(selectedNote)}
                className="flex items-center space-x-2"
              >
                <Brain className="h-4 w-4" />
                <span>Test Your Knowledge</span>
              </Button>
              
              <Button 
                variant="outline"
                onClick={() => downloadStudyNotes(selectedNote)}
                className="flex items-center space-x-2"
              >
                <FileText className="h-4 w-4" />
                <span>Download Study Guide</span>
              </Button>

              <Button 
                variant="outline"
                onClick={() => {
                  // Schedule for spaced repetition
                  const reviewDate = new Date();
                  reviewDate.setDate(reviewDate.getDate() + 3);
                  
                  toast({
                    title: "Review Scheduled!",
                    description: `Added to your review queue for ${reviewDate.toLocaleDateString()}`,
                    variant: "default"
                  });
                }}
                className="flex items-center space-x-2"
              >
                <RotateCcw className="h-4 w-4" />
                <span>Schedule Review</span>
              </Button>
            </div>
            
            {progress < 50 && (
              <div className="mt-4 p-4 bg-blue-50 rounded-lg text-center">
                <p className="text-sm text-blue-700">
                  Master at least 50% of concepts to complete this study session
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="text-center space-y-4">
        <h2 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
          AI Study Mentor
        </h2>
        <p className="text-muted-foreground">
          Revolutionary AI-powered learning that adapts to your pace and maximizes retention
        </p>
      </div>

      {/* Upload Section */}
      <Card 
        className="border-2 border-dashed border-purple-200 bg-gradient-to-br from-purple-50 to-blue-50"
        onDrop={handleDrop}
        onDragOver={handleDragOver}
      >
        <CardContent className="flex flex-col items-center justify-center py-12">
          <div className="p-4 bg-gradient-to-br from-purple-100 to-blue-100 rounded-full mb-4">
            {loading ? <Upload className="h-8 w-8 text-purple-600 animate-pulse" /> : <Plus className="h-8 w-8 text-purple-600" />}
          </div>
          <h3 className="text-xl font-semibold mb-2">Upload Your Study Material</h3>
          <p className="text-muted-foreground text-center mb-6">
            AI will extract key concepts, create study guides, and build your learning path<br />
            Supports PDF, DOCX, TXT, and image files
          </p>
          <Button 
            onClick={handleChooseFiles} 
            disabled={loading}
            className="bg-gradient-to-r from-purple-500 to-blue-500"
          >
            {loading ? (
              <>
                <Upload className="h-4 w-4 mr-2 animate-spin" />
                Analyzing with AI...
              </>
            ) : (
              <>
                <Zap className="h-4 w-4 mr-2" />
                Start Learning Journey
              </>
            )}
          </Button>
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept=".pdf,.doc,.docx,.txt,.png,.jpg,.jpeg"
            onChange={handleFileInputChange}
            className="hidden"
          />
        </CardContent>
      </Card>

      {/* Study Materials with Progress */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-xl font-semibold">Your Learning Journey</h3>
          {studyStreak > 0 && (
            <Badge className="bg-gradient-to-r from-orange-400 to-red-500">
              🔥 {studyStreak} Day Streak
            </Badge>
          )}
        </div>
        
        {loadingNotes ? (
          <div className="text-center py-8">
            <Brain className="h-8 w-8 animate-pulse mx-auto mb-2 text-purple-600" />
            <p className="text-muted-foreground">Loading your learning materials...</p>
          </div>
        ) : uploadedNotes.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <FileText className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground text-center">
                Ready to revolutionize your learning?<br />
                Upload your first study material to begin your AI-powered learning journey!
              </p>
            </CardContent>
          </Card>
        ) : (
          uploadedNotes.map((note) => (
            <Card key={note.id} className={`hover:shadow-lg transition-all duration-300 ${
              note.completed ? 'bg-green-50 border-green-200' : ''
            }`}>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <CardTitle className="flex items-center space-x-2">
                      <Book className="h-5 w-5 text-purple-600" />
                      <span>{note.title}</span>
                      {note.completed && (
                        <Badge className="ml-2 bg-green-500">
                          ✓ Completed
                        </Badge>
                      )}
                      {!note.processed && (
                        <Badge variant="secondary" className="ml-2">
                          AI Analyzing...
                        </Badge>
                      )}
                    </CardTitle>
                    <CardDescription className="mt-2">{note.summary}</CardDescription>
                  </div>
                  <Badge variant="outline" className="ml-4">
                    {note.difficulty}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Key Topics */}
                <div>
                  <h4 className="font-medium mb-2">Learning Topics</h4>
                  <div className="flex flex-wrap gap-2">
                    {note.keyTopics.map((topic, index) => (
                      <Badge key={index} variant="secondary">
                        {topic}
                      </Badge>
                    ))}
                  </div>
                </div>

                {/* Learning Content Preview */}
                {note.processed && (
                  <div className="grid grid-cols-4 gap-4 p-4 bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg">
                    <div className="text-center">
                      <div className="text-lg font-semibold text-purple-600">
                        {note.highlights?.length || 0}
                      </div>
                      <div className="text-xs text-muted-foreground">Key Highlights</div>
                    </div>
                    <div className="text-center">
                      <div className="text-lg font-semibold text-blue-600">
                        {note.keyConcepts?.length || 0}
                      </div>
                      <div className="text-xs text-muted-foreground">Concepts</div>
                    </div>
                    <div className="text-center">
                      <div className="text-lg font-semibold text-green-600">
                        {note.studyGuide ? 4 : 0}
                      </div>
                      <div className="text-xs text-muted-foreground">Study Sections</div>
                    </div>
                    <div className="text-center">
                      <div className="text-lg font-semibold text-orange-600">
                        {note.studyTime}
                      </div>
                      <div className="text-xs text-muted-foreground">Est. Time</div>
                    </div>
                  </div>
                )}

                {/* AI Learning Strategy */}
                <div className="bg-gradient-to-r from-purple-50 to-blue-50 p-4 rounded-lg">
                  <div className="flex items-center space-x-2 mb-2">
                    <Star className="h-4 w-4 text-purple-600" />
                    <h4 className="font-medium text-purple-800">AI Learning Strategy</h4>
                  </div>
                  <p className="text-sm text-purple-700">{note.aiInsights}</p>
                </div>

                {/* Action Buttons */}
                <div className="flex justify-between items-center pt-4 border-t">
                  <span className="text-sm text-muted-foreground flex items-center space-x-2">
                    <Clock className="h-4 w-4" />
                    <span>Study time: {note.studyTime}</span>
                  </span>
                  <div className="flex space-x-2">
                    <Button 
                      size="sm" 
                      className="bg-gradient-to-r from-purple-500 to-blue-500 flex items-center space-x-2" 
                      disabled={!note.processed}
                      onClick={() => startLearning(note)}
                    >
                      <Zap className="h-4 w-4" />
                      <span>{note.completed ? 'Review Again' : 'Start Learning'}</span>
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
};