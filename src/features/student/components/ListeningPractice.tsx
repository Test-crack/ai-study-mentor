import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { StudentSidebar } from './dashboard/StudentSidebar';
import { StudentTopbar } from './dashboard/StudentTopbar';
import { Button } from '@/shared/components/ui/button';
import { useToast } from '@/shared/hooks/use-toast';
import { ArrowLeft, Send, Headphones, PlayCircle, Info, CheckCircle2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/shared/components/ui/card';
import { Badge } from '@/shared/components/ui/badge';

// --- Types ---
interface Option {
  id: string;
  text: string;
}

interface Question {
  id: string;
  text: string;
  options: Option[];
}

interface ListeningTask {
  id: string;
  title: string;
  description: string;
  duration: string;
  audioUrl: string;
  questions: Question[];
}

// --- Mock Data (Replace with your API fetch) ---
const MOCK_TASKS: ListeningTask[] = [
  {
    id: '1',
    title: 'Section 1: University Accommodation',
    description: 'Listen to a conversation between a student and an accommodation officer discussing housing options.',
    duration: '5:30',
    audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3', // Dummy audio URL
    questions: [
      {
        id: 'q1',
        text: '1. What type of room does the student primarily want?',
        options: [
          { id: 'o1', text: 'A single room with a shared bathroom' },
          { id: 'o2', text: 'A single room with an en-suite bathroom' },
          { id: 'o3', text: 'A shared double room' },
          { id: 'o4', text: 'A studio apartment' }
        ]
      },
      {
        id: 'q2',
        text: '2. The maximum weekly rent the student can afford is:',
        options: [
          { id: 'o1', text: '£120' },
          { id: 'o2', text: '£150' },
          { id: 'o3', text: '£180' },
          { id: 'o4', text: '£200' }
        ]
      },
      {
        id: 'q3',
        text: '3. Which facility is NOT included in the standard rent?',
        options: [
          { id: 'o1', text: 'Water bills' },
          { id: 'o2', text: 'Internet access' },
          { id: 'o3', text: 'Gym membership' },
          { id: 'o4', text: 'Heating' }
        ]
      }
    ]
  },
  {
    id: '2',
    title: 'Section 3: Group Project Discussion',
    description: 'Listen to two students discussing their presentation on renewable energy sources.',
    duration: '6:15',
    audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3',
    questions: [
      {
        id: 'q1',
        text: '1. What is the main focus of their presentation?',
        options: [
          { id: 'o1', text: 'Solar panel efficiency' },
          { id: 'o2', text: 'Wind turbine maintenance' },
          { id: 'o3', text: 'Tidal energy implementation' },
          { id: 'o4', text: 'Geothermal heating systems' }
        ]
      }
    ]
  }
];

export default function ListeningPractice() {
  const navigate = useNavigate();
  const { toast } = useToast();
  
  // Layout State
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  
  // Task State
  const [selectedTask, setSelectedTask] = useState<ListeningTask | null>(null);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  const handleBack = () => {
    setSelectedTask(null);
    setAnswers({}); // Clear answers when going back
  };

  const handleOptionSelect = (questionId: string, optionId: string) => {
    setAnswers(prev => ({
      ...prev,
      [questionId]: optionId
    }));
  };

  const handleSubmit = async () => {
    // Check if all questions are answered
    if (selectedTask && Object.keys(answers).length < selectedTask.questions.length) {
      toast({ 
        title: 'Incomplete Test', 
        description: 'Please answer all questions before submitting.', 
        variant: 'destructive' 
      });
      return;
    }

    setSubmitting(true);
    // Simulate API call
    setTimeout(() => {
      setSubmitting(false);
      toast({ title: 'Success!', description: 'Listening test submitted successfully for grading.' });
      handleBack();
    }, 1500);
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-slate-950 transition-colors duration-300">
      <StudentSidebar 
        activeTab="listening" // Adjust depending on your sidebar config
        onTabChange={(tab) => {
            if (tab === 'dashboard') navigate('/student/dashboard');
            if (tab === 'settings') navigate('/student/profile');
            // Add other routes as needed
        }} 
        isCollapsed={isSidebarCollapsed}
        toggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
      />

      <div className={`transition-all duration-300 ${isSidebarCollapsed ? 'lg:pl-24' : 'lg:pl-72'} flex flex-col min-h-screen`}>
        <StudentTopbar onUpgradeClick={() => {}} />

        {/* Dynamic Main Content Area */}
        <main className="flex-1 p-6 max-w-7xl mx-auto w-full flex flex-col animate-in fade-in slide-in-from-bottom-4 duration-500">
          
          {/* --- VIEW 1: Card Selection Screen --- */}
          {!selectedTask ? (
            <div className="space-y-8 h-full">
              <div>
                <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">Listening Practice</h1>
                <p className="text-slate-500 dark:text-slate-400">Select an audio module to begin your practice test.</p>
              </div>

              {MOCK_TASKS.length === 0 ? (
                <Card className="border-none shadow-sm bg-white dark:bg-slate-900 flex flex-col items-center justify-center p-12 text-center">
                  <Headphones className="h-12 w-12 text-slate-300 dark:text-slate-600 mb-4" />
                  <CardTitle className="text-lg text-slate-700 dark:text-slate-200">No Tasks Yet</CardTitle>
                  <CardDescription className="dark:text-slate-400">Your instructor hasn't assigned any listening tasks currently.</CardDescription>
                </Card>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                  {MOCK_TASKS.map((task) => (
                    <Card 
                      key={task.id}
                      onClick={() => setSelectedTask(task)}
                      className="border border-slate-200 dark:border-slate-800 shadow-sm bg-white dark:bg-slate-900 hover:shadow-md hover:border-indigo-300 dark:hover:border-indigo-700 transition-all cursor-pointer flex flex-col h-64 group"
                    >
                      <CardHeader className="pb-3 flex-none">
                        <div className="flex justify-between items-start gap-4">
                          <CardTitle className="text-lg font-bold text-slate-800 dark:text-slate-100 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors line-clamp-2">
                            {task.title}
                          </CardTitle>
                          <div className="flex flex-col items-end gap-2">
                            <Badge className="bg-indigo-100 text-indigo-700 hover:bg-indigo-100 dark:bg-indigo-900/50 dark:text-indigo-300 flex-shrink-0">
                              New
                            </Badge>
                            <span className="text-xs font-semibold text-slate-400 flex items-center">
                              <PlayCircle className="w-3 h-3 mr-1" /> {task.duration}
                            </span>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent className="flex flex-col flex-grow overflow-hidden pb-4">
                        <p className="text-slate-600 dark:text-slate-400 text-sm flex-grow line-clamp-4">
                          {task.description}
                        </p>
                        <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800 flex justify-between items-center text-xs font-medium text-slate-500 dark:text-slate-500">
                          <span>{task.questions.length} Questions</span>
                          <span className="text-indigo-600 dark:text-indigo-400 flex items-center group-hover:translate-x-1 transition-transform">
                            Start Listening <ArrowLeft className="h-3 w-3 ml-1 rotate-180" />
                          </span>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          ) : (
            
            /* --- VIEW 2: Split Screen Test Interface --- */
            <div className="flex flex-col h-full flex-1 min-h-[calc(100vh-140px)]">
              {/* Header - Mobile Responsive */}
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                <Button 
                  variant="ghost" 
                  onClick={handleBack}
                  className="text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 -ml-2 w-fit"
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to Modules
                </Button>
                
                <Button 
                  onClick={handleSubmit} 
                  disabled={submitting}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm w-full sm:w-auto"
                >
                  {submitting ? (
                    <span className="flex items-center">Submitting...</span>
                  ) : (
                    <span className="flex items-center"><Send className="w-4 h-4 mr-2" /> Submit Answers</span>
                  )}
                </Button>
              </div>

              {/* Split Content Area */}
              <div className="flex flex-col lg:flex-row gap-6 flex-grow min-h-0">
                
                {/* Left Section: Audio Player & Context */}
                <div className="w-full lg:w-[40%] flex flex-col gap-6 overflow-y-auto pr-1">
                  <Card className="border-none shadow-sm bg-white dark:bg-slate-900 flex-shrink-0">
                    <CardHeader className="pb-4">
                      <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400 mb-2">
                        <Headphones className="h-5 w-5" />
                        <span className="text-sm font-bold uppercase tracking-wider">Audio Player</span>
                      </div>
                      <CardTitle className="text-xl text-slate-800 dark:text-white leading-tight">
                        {selectedTask.title}
                      </CardTitle>
                      <CardDescription className="dark:text-slate-400 mt-2">
                        {selectedTask.description}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="bg-slate-50 dark:bg-slate-800/80 p-4 rounded-xl border border-slate-100 dark:border-slate-800">
                        {/* Standard HTML5 Audio Player */}
                        <audio 
                          controls 
                          controlsList="nodownload"
                          className="w-full"
                          src={selectedTask.audioUrl}
                        >
                          Your browser does not support the audio element.
                        </audio>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="border-none shadow-sm bg-blue-50 dark:bg-blue-900/10 border-blue-100 dark:border-blue-900/30 flex-shrink-0">
                    <CardContent className="p-5 flex gap-3">
                      <Info className="h-5 w-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
                      <div>
                        <h4 className="text-sm font-bold text-blue-800 dark:text-blue-400 mb-1">Testing Tips</h4>
                        <ul className="text-sm text-blue-700 dark:text-blue-400/80 list-disc list-inside space-y-1.5">
                          <li>Read all questions before playing the audio.</li>
                          <li>You will only hear the recording <strong>once</strong> during the actual exam.</li>
                          <li>Answer as you listen.</li>
                        </ul>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Right Section: Questionnaire */}
                <Card className="w-full lg:w-[60%] border border-slate-200 dark:border-slate-800 shadow-sm bg-white dark:bg-slate-900 flex flex-col overflow-hidden">
                  <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-900/50 z-10">
                    <h3 className="font-semibold text-slate-700 dark:text-slate-200 text-sm">Multiple Choice Questions</h3>
                    <Badge 
                      variant="secondary"
                      className={`font-medium ${
                        Object.keys(answers).length === selectedTask.questions.length 
                          ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' 
                          : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                      }`}
                    >
                      {Object.keys(answers).length} / {selectedTask.questions.length} Answered
                    </Badge>
                  </div>
                  
                  {/* Questions Scrollable Area */}
                  <div className="flex-grow overflow-y-auto p-6 space-y-8 custom-scrollbar">
                    {selectedTask.questions.map((question) => (
                      <div key={question.id} className="space-y-4">
                        <h4 className="text-base font-medium text-slate-800 dark:text-slate-100 leading-relaxed">
                          {question.text}
                        </h4>
                        <div className="grid grid-cols-1 gap-3">
                          {question.options.map((option) => {
                            const isSelected = answers[question.id] === option.id;
                            return (
                              <div
                                key={option.id}
                                onClick={() => handleOptionSelect(question.id, option.id)}
                                className={`
                                  relative p-4 rounded-xl border-2 cursor-pointer transition-all duration-200 flex items-center
                                  ${isSelected 
                                    ? 'border-indigo-600 bg-indigo-50 dark:border-indigo-500 dark:bg-indigo-900/20' 
                                    : 'border-slate-200 bg-white hover:border-indigo-300 dark:border-slate-700 dark:bg-slate-800/50 dark:hover:border-indigo-700'
                                  }
                                `}
                              >
                                <div className={`
                                  w-5 h-5 rounded-full border-2 mr-4 flex items-center justify-center flex-shrink-0 transition-colors
                                  ${isSelected 
                                    ? 'border-indigo-600 dark:border-indigo-400' 
                                    : 'border-slate-300 dark:border-slate-600'
                                  }
                                `}>
                                  {isSelected && <div className="w-2.5 h-2.5 rounded-full bg-indigo-600 dark:bg-indigo-400" />}
                                </div>
                                <span className={`text-sm ${isSelected ? 'text-indigo-900 font-medium dark:text-indigo-200' : 'text-slate-700 dark:text-slate-300'}`}>
                                  {option.text}
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                </Card>

              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}