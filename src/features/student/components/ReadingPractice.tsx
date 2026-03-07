import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { StudentSidebar } from './dashboard/StudentSidebar';
import { StudentTopbar } from './dashboard/StudentTopbar';
import { Button } from '@/shared/components/ui/button';
import { useToast } from '@/shared/hooks/use-toast';
import { ArrowLeft, Send, BookOpen, FileText, Info, CheckCircle2 } from 'lucide-react';
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

interface ReadingTask {
  id: string;
  title: string;
  description: string;
  wordCount: number;
  passage: string;
  questions: Question[];
}

// --- Mock Data (Replace with your API fetch) ---
const MOCK_TASKS: ReadingTask[] = [
  {
    id: '1',
    title: 'Reading Passage 1: The Evolution of the Bicycle',
    description: 'Read the text about the history of bicycles and answer the multiple-choice questions.',
    wordCount: 450,
    passage: `The bicycle is one of the most common and widely used vehicles in the world, yet its history is a complex tale of gradual evolution. The first machine to bear a resemblance to the modern bicycle was the "dandy horse," invented by the German Baron Karl von Drais in 1817. Made almost entirely of wood, it lacked pedals and was propelled by the rider pushing their feet against the ground.

It wasn't until the 1860s that pedals were added to the front wheel, creating what became known as the "velocipede" or "boneshaker." As the latter name suggests, the ride was incredibly uncomfortable due to the stiff wooden wheels and iron bands, paired with the cobblestone roads of the era.

In the 1870s, the quest for higher speeds led to the development of the "Penny Farthing." This iconic bicycle featured a massive front wheel and a tiny rear wheel. Because the pedals were directly attached to the front wheel, a larger wheel meant the bicycle travelled further with each pedal stroke. However, the high seating position made it notoriously dangerous; a small bump could easily send the rider pitching forward over the handlebars.

The true breakthrough came in the late 1880s with the invention of the "safety bicycle." It featured two wheels of equal size and a chain drive that transferred power from the pedals to the rear wheel. Coupled with the invention of pneumatic (air-filled) rubber tires by John Boyd Dunlop in 1888, the bicycle finally became a safe, comfortable, and practical mode of transport for the general public, sparking a massive bicycle boom in the 1890s.`,
    questions: [
      {
        id: 'q1',
        text: '1. How was the "dandy horse" powered?',
        options: [
          { id: 'o1', text: 'By pedals attached to the front wheel' },
          { id: 'o2', text: 'By a chain drive connecting to the rear wheel' },
          { id: 'o3', text: 'By the rider pushing their feet on the ground' },
          { id: 'o4', text: 'By a small steam engine' }
        ]
      },
      {
        id: 'q2',
        text: '2. Why was the velocipede nicknamed the "boneshaker"?',
        options: [
          { id: 'o1', text: 'It had unequal wheel sizes' },
          { id: 'o2', text: 'It was made with uncomfortable wooden wheels and iron bands' },
          { id: 'o3', text: 'It lacked a steering mechanism' },
          { id: 'o4', text: 'It travelled at dangerously high speeds' }
        ]
      },
      {
        id: 'q3',
        text: '3. What was the main danger of riding a Penny Farthing?',
        options: [
          { id: 'o1', text: 'The chain often snapped' },
          { id: 'o2', text: 'The rubber tires punctured easily' },
          { id: 'o3', text: 'Riders could easily fall forward over the handlebars' },
          { id: 'o4', text: 'The brakes were highly unreliable' }
        ]
      }
    ]
  },
  {
    id: '2',
    title: 'Reading Passage 2: The Intelligence of Corvids',
    description: 'Explore the surprising cognitive abilities of crows and ravens.',
    wordCount: 380,
    passage: `For centuries, birds in the corvid family—which includes crows, ravens, jays, and magpies—have been featured in folklore and mythology. Modern science has recently caught up with these legends, revealing that corvids possess an astonishing level of intelligence, rivalling that of great apes.

One of the most remarkable traits of corvids is their ability to manufacture and use tools. New Caledonian crows, for instance, have been observed snapping twigs and shaping them into hooks to extract insects from deep crevices in tree bark. Furthermore, they pass these tool-making techniques down to their offspring, demonstrating a form of cultural transmission.

Corvids also excel in problem-solving and memory. Studies have shown that crows can remember human faces for years, holding grudges against people who have threatened them and teaching other crows in their flock to recognize the "dangerous" individuals.`,
    questions: [
      {
        id: 'q1',
        text: '1. Which of the following birds is NOT mentioned as a member of the corvid family?',
        options: [
          { id: 'o1', text: 'Crows' },
          { id: 'o2', text: 'Ravens' },
          { id: 'o3', text: 'Parrots' },
          { id: 'o4', text: 'Magpies' }
        ]
      }
    ]
  }
];

export default function ReadingPractice() {
  const navigate = useNavigate();
  const { toast } = useToast();
  
  // Layout State
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  
  // Task State
  const [selectedTask, setSelectedTask] = useState<ReadingTask | null>(null);
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
      toast({ title: 'Success!', description: 'Reading test submitted successfully for grading.' });
      handleBack();
    }, 1500);
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-slate-950 transition-colors duration-300">
      <StudentSidebar 
        activeTab="reading" 
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
                <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">Reading Practice</h1>
                <p className="text-slate-500 dark:text-slate-400">Select a reading passage to begin your practice test.</p>
              </div>

              {MOCK_TASKS.length === 0 ? (
                <Card className="border-none shadow-sm bg-white dark:bg-slate-900 flex flex-col items-center justify-center p-12 text-center">
                  <BookOpen className="h-12 w-12 text-slate-300 dark:text-slate-600 mb-4" />
                  <CardTitle className="text-lg text-slate-700 dark:text-slate-200">No Tasks Yet</CardTitle>
                  <CardDescription className="dark:text-slate-400">Your instructor hasn't assigned any reading tasks currently.</CardDescription>
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
                              <FileText className="w-3 h-3 mr-1" /> {task.wordCount} words
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
                            Start Reading <ArrowLeft className="h-3 w-3 ml-1 rotate-180" />
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
                  Back to Passages
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
                
                {/* Left Section: Reading Passage */}
                <div className="w-full lg:w-[50%] xl:w-[55%] flex flex-col gap-6 overflow-y-auto pr-1 custom-scrollbar">
                  <Card className="border-none shadow-sm bg-white dark:bg-slate-900 flex-shrink-0">
                    <CardHeader className="pb-4 border-b border-slate-100 dark:border-slate-800">
                      <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400 mb-2">
                        <BookOpen className="h-5 w-5" />
                        <span className="text-sm font-bold uppercase tracking-wider">Reading Passage</span>
                      </div>
                      <CardTitle className="text-2xl font-bold text-slate-800 dark:text-white leading-tight">
                        {selectedTask.title}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-6">
                      <div className="text-slate-700 dark:text-slate-300 text-base leading-loose whitespace-pre-line font-medium">
                        {selectedTask.passage}
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="border-none shadow-sm bg-blue-50 dark:bg-blue-900/10 border-blue-100 dark:border-blue-900/30 flex-shrink-0 mb-4">
                    <CardContent className="p-5 flex gap-3">
                      <Info className="h-5 w-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
                      <div>
                        <h4 className="text-sm font-bold text-blue-800 dark:text-blue-400 mb-1">Testing Tips</h4>
                        <ul className="text-sm text-blue-700 dark:text-blue-400/80 list-disc list-inside space-y-1.5">
                          <li>Read the questions first to know what information to look for.</li>
                          <li>Skim the passage quickly to get the general idea, then read in detail.</li>
                          <li>Scroll this panel independently to refer back to the text while answering.</li>
                        </ul>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Right Section: Questionnaire */}
                <Card className="w-full lg:w-[50%] xl:w-[45%] border border-slate-200 dark:border-slate-800 shadow-sm bg-white dark:bg-slate-900 flex flex-col overflow-hidden">
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