import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { StudentSidebar } from './dashboard/StudentSidebar';
import { StudentTopbar } from './dashboard/StudentTopbar';
import { Button } from '@/shared/components/ui/button';
import { useToast } from '@/shared/hooks/use-toast';
import { ArrowLeft, Send, PenTool, BookOpen, Sparkles, History, CheckCircle, BarChart2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/shared/components/ui/card';
import { Badge } from '@/shared/components/ui/badge';
import { fetchWritingTasks, submitWritingSession, fetchWritingHistory, WritingAssessmentHistoryItem, WritingTask } from '../services/ieltsWritingService';


type ViewState = 'library' | 'writing' | 'history' | 'results';

// Ensure the API url is retrieved
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000/api';
const MOCK_ASSIGNMENTS: WritingTask[] = [];

export default function IeltsWriting() {
  const navigate = useNavigate();
  const { toast } = useToast();
  
  // Layout State
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  
  // Writing Task State
  const [view, setView] = useState<ViewState>('library');
  const [assignments, setAssignments] = useState<WritingTask[]>([]);
  const [history, setHistory] = useState<WritingAssessmentHistoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedAssignment, setSelectedAssignment] = useState<WritingTask | null>(null);
  const [evaluationResult, setEvaluationResult] = useState<WritingAssessmentHistoryItem | null>(null);
  const [essayText, setEssayText] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Dynamic Word Count Target based on Task Type
  const targetWordCount = selectedAssignment?.title.includes('Task 1') ? 150 : 250;

  // Calculate word count dynamically
  useEffect(() => {
    const loadData = async () => {
      try {
        const tasks = await fetchWritingTasks();
        if (tasks) {
          const formattedTasks = tasks.map((task: any) => ({
            ...task,
            assignedDate: new Date(task.assignedDate).toISOString().split('T')[0]
          }));
          setAssignments(formattedTasks);
        } else {
          setAssignments(MOCK_ASSIGNMENTS);
        }
        
        const hist = await fetchWritingHistory();
        if (hist) setHistory(hist);
        
      } catch (error) {
        console.error('Failed to fetch data:', error);
        setAssignments(MOCK_ASSIGNMENTS);
      } finally {
        setIsLoading(false);
      }
    };
    if (view === 'library' || view === 'history') {
      loadData();
    }
  }, [view]);

  const wordCount = useMemo(() => {
    const trimmed = essayText.trim();
    return trimmed ? trimmed.split(/\s+/).length : 0;
  }, [essayText]);

  const handleSelectAssignment = (assignment: WritingTask) => {
    setSelectedAssignment(assignment);
    setView('writing');
  };

  const handleBack = () => {
    setSelectedAssignment(null);
    setEvaluationResult(null);
    setEssayText('');
    setView('library');
  };

  const handleSubmit = async () => {
    if (wordCount < targetWordCount) {
      toast({ 
        title: 'Word count too low', 
        description: `Please write at least ${targetWordCount} words before submitting.`, 
        variant: 'destructive' 
      });
      return;
    }

    setSubmitting(true);
    try {
      const result = await submitWritingSession(selectedAssignment.id, essayText, wordCount);
      setEvaluationResult(result);
      setView('results');
      toast({ title: 'Success!', description: 'Writing submitted successfully for analysis.' });
    } catch (error: any) {
      toast({ title: 'Error', description: error.message || 'Failed to submit analysis', variant: 'destructive' });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-slate-950 transition-colors duration-300">
      <StudentSidebar 
        activeTab="writing" 
        isCollapsed={isSidebarCollapsed}
        toggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
      />

      <div className={`transition-all duration-300 ${isSidebarCollapsed ? 'lg:pl-24' : 'lg:pl-72'} flex flex-col min-h-screen`}>
        <StudentTopbar onUpgradeClick={() => {}} />

        {/* Dynamic Main Content Area */}
        <main className="flex-1 p-6 max-w-7xl mx-auto w-full flex flex-col animate-in fade-in slide-in-from-bottom-4 duration-500">
          
          {/* --- VIEW 1: Card Selection Screen --- */}
          {view === 'library' && (
            <div className="space-y-8 h-full">
              
              {/* --- NEW COLORED BANNER --- */}
              <div className="bg-[#7B61FF] rounded-2xl p-8 md:p-10 text-white shadow-md relative overflow-hidden">
                {/* Optional decorative element */}
                <div className="absolute top-0 right-0 -mt-4 -mr-4 w-32 h-32 bg-white opacity-10 rounded-full blur-2xl"></div>
                
                <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
                  <div>
                    <h1 className="text-3xl font-bold mb-3 flex items-center gap-2">
                      IELTS Writing Analysis <Sparkles className="h-6 w-6 text-yellow-300" fill="currentColor" />
                    </h1>
                    <p className="text-indigo-50 max-w-2xl text-base md:text-lg leading-relaxed mb-6">
                      Master your writing skills with detailed, AI-powered feedback. Select a prompt below, aim for your target word count, and get instant insights on your grammar, vocabulary, and task coherence to push for a band 7+.
                    </p>
                  </div>
                  <Button 
                    variant="outline" 
                    className="bg-white/10 border-white/20 text-white hover:bg-white/20 whitespace-nowrap"
                    onClick={() => setView('history')}
                  >
                    <History className="w-4 h-4 mr-2" /> View History
                  </Button>
                </div>
              </div>

              {isLoading ? (
                <div className="flex justify-center items-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#7B61FF]"></div>
                </div>
              ) : assignments.length === 0 ? (
                <Card className="border-none shadow-sm bg-white dark:bg-slate-900 flex flex-col items-center justify-center p-12 text-center">
                  <BookOpen className="h-12 w-12 text-slate-300 dark:text-slate-600 mb-4" />
                  <CardTitle className="text-lg text-slate-700 dark:text-slate-200">No Assignments Yet</CardTitle>
                  <CardDescription className="dark:text-slate-400">Your instructor hasn't assigned any writing tasks currently.</CardDescription>
                </Card>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                  {assignments.map((assignment) => (
                    <Card 
                      key={assignment.id}
                      onClick={() => handleSelectAssignment(assignment)}
                      className="border border-slate-200 dark:border-slate-800 shadow-sm bg-white dark:bg-slate-900 hover:shadow-md hover:border-[#7B61FF] dark:hover:border-[#7B61FF] transition-all cursor-pointer flex flex-col h-64 group"
                    >
                      <CardHeader className="pb-3 flex-none">
                        <div className="flex justify-between items-start gap-4">
                          <CardTitle className="text-lg font-bold text-slate-800 dark:text-slate-100 group-hover:text-[#7B61FF] dark:group-hover:text-[#9b86ff] transition-colors line-clamp-2">
                            {assignment.title}
                          </CardTitle>
                          <Badge className="bg-indigo-50 text-[#7B61FF] hover:bg-indigo-100 dark:bg-[#7B61FF]/20 dark:text-[#9b86ff] flex-shrink-0">
                            New
                          </Badge>
                        </div>
                      </CardHeader>
                      <CardContent className="flex flex-col flex-grow overflow-hidden pb-4">
                        <p className="text-slate-600 dark:text-slate-400 text-sm flex-grow line-clamp-4">
                          {assignment.topic}
                        </p>
                        <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800 flex justify-between items-center text-xs font-medium text-slate-500 dark:text-slate-500">
                          <span>Assigned: {assignment.assignedDate}</span>
                          <span className="text-[#7B61FF] dark:text-[#9b86ff] flex items-center group-hover:translate-x-1 transition-transform">
                            Start Writing <ArrowLeft className="h-3 w-3 ml-1 rotate-180" />
                          </span>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* --- VIEW 2: HISTORY SCREEN --- */}
          {view === 'history' && (
            <div className="space-y-8 h-full">
              <div className="flex items-center gap-4">
                <Button variant="ghost" onClick={() => setView('library')} className="text-slate-600 hover:bg-slate-100 -ml-2">
                  <ArrowLeft className="w-4 h-4 mr-2" /> Back to Assignments
                </Button>
                <h2 className="text-2xl font-bold dark:text-white">Past Analytics</h2>
              </div>
              
              {history.length === 0 && !isLoading ? (
                <Card className="p-8 text-center text-slate-500">No past writings found.</Card>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {history.map((item) => (
                    <Card key={item.id} className="cursor-pointer hover:border-[#7B61FF]" onClick={() => {
                        setEvaluationResult(item);
                        setSelectedAssignment(item.IeltsWritingTask || null);
                        setView('results');
                      }}
                    >
                      <CardHeader className="pb-2">
                        <CardTitle className="line-clamp-1">{item.IeltsWritingTask?.title || 'Unknown Task'}</CardTitle>
                        <CardDescription>{new Date(item.createdAt).toLocaleDateString()}</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="flex justify-between items-center text-sm">
                          <span className="font-semibold text-slate-700 dark:text-slate-200">Band Score:</span>
                          <Badge className="bg-[#7B61FF]">{item.aiBandScore}</Badge>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* --- VIEW 3: Split Screen Writing Interface --- */}
          {view === 'writing' && selectedAssignment && (
            <div className="flex flex-col h-full flex-1 min-h-[calc(100vh-140px)]">
              {/* Header - UPDATED FOR MOBILE RESPONSIVENESS */}
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                <Button 
                  variant="ghost" 
                  onClick={handleBack}
                  className="text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 -ml-2 w-fit"
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to Assignments
                </Button>
                
                <Button 
                  onClick={handleSubmit} 
                  disabled={submitting}
                  className="bg-[#7B61FF] hover:bg-[#6a50e5] text-white shadow-sm w-full sm:w-auto"
                >
                  {submitting ? (
                    <span className="flex items-center">Loading...</span>
                  ) : (
                    <span className="flex items-center"><Send className="w-4 h-4 mr-2" /> Submit for Analysis</span>
                  )}
                </Button>
              </div>

              {/* Split Content Area */}
              <div className="flex flex-col lg:flex-row gap-6 flex-grow min-h-0">
                
                {/* Left Section: Topic/Prompt */}
                <div className="w-full lg:w-[40%] flex flex-col gap-6 overflow-y-auto pr-1">
                  <Card className="border-none shadow-sm bg-white dark:bg-slate-900 flex-shrink-0">
                    <CardHeader className="pb-4">
                      <div className="flex items-center gap-2 text-[#7B61FF] dark:text-[#9b86ff] mb-2">
                        <PenTool className="h-5 w-5" />
                        <span className="text-sm font-bold uppercase tracking-wider">Task Prompt</span>
                      </div>
                      <CardTitle className="text-xl text-slate-800 dark:text-white leading-tight">
                        {selectedAssignment.title}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-slate-800 text-slate-700 dark:text-slate-300 text-sm leading-relaxed whitespace-pre-wrap">
                        {selectedAssignment.topic}
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="border-none shadow-sm bg-amber-50 dark:bg-amber-900/10 border-amber-100 dark:border-amber-900/30 flex-shrink-0">
                    <CardContent className="p-5">
                      <h4 className="text-sm font-bold text-amber-800 dark:text-amber-500 mb-2">Instructions</h4>
                      <ul className="text-sm text-amber-700 dark:text-amber-400/80 list-disc list-inside space-y-1.5">
                        <li>Target length is at least <strong>{targetWordCount} words</strong>.</li>
                        <li>Include your own knowledge and experiences.</li>
                        <li>Review spelling and grammar before submitting.</li>
                      </ul>
                    </CardContent>
                  </Card>
                </div>

                {/* Right Section: Text Editor */}
                <Card className="w-full lg:w-[60%] border border-slate-200 dark:border-slate-800 shadow-sm bg-white dark:bg-slate-900 flex flex-col overflow-hidden">
                  <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-900/50">
                    <h3 className="font-semibold text-slate-700 dark:text-slate-200 text-sm">Your Response</h3>
                    <Badge 
                      variant="secondary"
                      className={`font-medium ${
                        wordCount >= targetWordCount 
                          ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' 
                          : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                      }`}
                    >
                      {wordCount} / {targetWordCount} words
                    </Badge>
                  </div>
                  
                  <textarea
                    value={essayText}
                    onChange={(e) => setEssayText(e.target.value)}
                    placeholder="Start typing your essay here..."
                    className="flex-grow w-full p-6 resize-none bg-transparent focus:outline-none focus:ring-0 text-slate-800 dark:text-slate-200 leading-relaxed custom-scrollbar placeholder:text-slate-400 dark:placeholder:text-slate-600"
                    spellCheck={false}
                  />
                </Card>

              </div>
            </div>
          )}

          {/* --- VIEW 4: RESULTS SCREEN --- */}
          {view === 'results' && evaluationResult && (
            <div className="space-y-6 max-w-4xl mx-auto h-full overflow-y-auto pb-12">
              <Button variant="ghost" onClick={handleBack} className="text-slate-600 hover:bg-slate-100 -ml-2">
                <ArrowLeft className="w-4 h-4 mr-2" /> Back
              </Button>

              <div className="bg-gradient-to-br from-[#7B61FF] to-[#5B41DF] rounded-3xl p-8 text-white text-center relative overflow-hidden shadow-xl">
                <div className="relative z-10">
                  <div className="w-20 h-20 rounded-full bg-white/10 flex items-center justify-center mx-auto mb-4 border-2 border-white/20">
                    <CheckCircle className="w-10 h-10 text-emerald-300" />
                  </div>
                  <p className="text-indigo-100 text-sm font-bold uppercase tracking-widest mb-1">Overall Band Score</p>
                  <div className="text-7xl font-black mb-3">
                    {evaluationResult.aiBandScore}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Card className="text-center p-4">
                  <p className="text-xs font-bold text-slate-400 uppercase">Grammar</p>
                  <p className="text-2xl font-black text-[#7B61FF]">{evaluationResult.aiGrammarScore}</p>
                </Card>
                <Card className="text-center p-4">
                  <p className="text-xs font-bold text-slate-400 uppercase">Vocabulary</p>
                  <p className="text-2xl font-black text-[#7B61FF]">{evaluationResult.aiVocabularyScore}</p>
                </Card>
                <Card className="text-center p-4">
                  <p className="text-xs font-bold text-slate-400 uppercase">Coherence</p>
                  <p className="text-2xl font-black text-[#7B61FF]">{evaluationResult.aiCoherenceScore}</p>
                </Card>
                <Card className="text-center p-4">
                  <p className="text-xs font-bold text-slate-400 uppercase">Task Response</p>
                  <p className="text-2xl font-black text-[#7B61FF]">{evaluationResult.aiTaskResponseScore}</p>
                </Card>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <BarChart2 className="w-5 h-5 text-[#7B61FF]"/> Coach Feedback
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4 text-sm text-slate-700 dark:text-slate-300">
                  <div>
                    <h4 className="font-bold text-slate-800 dark:text-white mb-2">Grammar Fixes:</h4>
                    <ul className="list-disc pl-5 space-y-1">
                      {evaluationResult.aiFeedbackData?.grammar?.map((g: string, i: number) => <li key={i}>{g}</li>) || <li>No major grammar issues detected.</li>}
                    </ul>
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-800 dark:text-white mb-2">Vocabulary Improvements:</h4>
                    <ul className="list-disc pl-5 space-y-1">
                      {evaluationResult.aiFeedbackData?.vocabulary?.map((v: string, i: number) => <li key={i}>{v}</li>) || <li>Vocabulary was strong.</li>}
                    </ul>
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-800 dark:text-white mb-2">Overall Guidance:</h4>
                    <p>{evaluationResult.aiFeedbackData?.improvements || 'Keep practicing.'}</p>
                  </div>
                </CardContent>
              </Card>

              {evaluationResult.manualBandScore && (
                <Card className="border-emerald-200 bg-emerald-50 dark:bg-emerald-900/10">
                  <CardHeader>
                    <CardTitle className="text-emerald-700 flex items-center gap-2">Instructor Review</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p><strong>Band Grade Updated To:</strong> {evaluationResult.manualBandScore}</p>
                    <p className="mt-2 text-sm text-emerald-800">{evaluationResult.manualFeedback}</p>
                  </CardContent>
                </Card>
              )}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}