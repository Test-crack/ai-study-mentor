import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { StudentSidebar } from './dashboard/StudentSidebar';
import { StudentTopbar } from './dashboard/StudentTopbar';
import { Button } from '@/shared/components/ui/button';
import { useToast } from '@/shared/hooks/use-toast';
import { ArrowLeft, Send, PenTool, BookOpen, Sparkles } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/shared/components/ui/card';
import { Badge } from '@/shared/components/ui/badge';

// --- Types ---
interface Assignment {
  id: string;
  title: string;
  topic: string;
  assignedDate: string;
}

// --- Mock Data (Replace with your API fetch) ---
const MOCK_ASSIGNMENTS: Assignment[] = [
  {
    id: '1',
    title: 'Task 2: Technology & Society',
    topic: 'Some people think that the rapid development of technology is making our lives more complex, and we should strive for a simpler life without so much technology. To what extent do you agree or disagree? Give reasons for your answer and include any relevant examples from your own knowledge or experience.',
    assignedDate: '2026-03-01',
  },
  {
    id: '2',
    title: 'Task 2: Education Funding',
    topic: 'Governments should spend more money on education than on recreation and sports. Do you agree or disagree with this statement? Provide specific reasons and examples to support your answer.',
    assignedDate: '2026-03-04',
  },
  {
    id: '3',
    title: 'Task 1: Academic - Data Interpretation',
    topic: 'The chart provided in your workbook shows the global sales of different types of digital games from 2000 to 2006. Summarise the information by selecting and reporting the main features, and make comparisons where relevant. (Note: Please refer to page 12 of your pilot program handbook for the chart).',
    assignedDate: '2026-03-08',
  },
  {
    id: '4',
    title: 'Task 2: Environment & Corporate Responsibility',
    topic: 'Many people believe that companies and individuals should pay to clean up the environment in proportion to the amount of pollution they have produced. To what extent do you agree or disagree? Include relevant examples from your own experience.',
    assignedDate: '2026-03-11',
  },
  {
    id: '5',
    title: 'Task 2: Urbanization & Migration',
    topic: 'In many countries, an increasing number of people are migrating from rural areas to cities in search of a better life. What are the main problems this causes? What solutions can you suggest?',
    assignedDate: '2026-03-15',
  },
  {
    id: '6',
    title: 'Task 1: General - Formal Letter',
    topic: 'You recently stayed at a hotel and left a valuable item in your room. Write a letter to the hotel manager. In your letter: give details of your stay, describe the item you left behind, and suggest what you want the manager to do.',
    assignedDate: '2026-03-18',
  },
  {
    id: '7',
    title: 'Task 2: Health & Public Policy',
    topic: 'In some countries, the growing number of fast-food outlets has led to a rise in health issues such as obesity. Some people think the government should impose a higher tax on this kind of food. Do you agree or disagree?',
    assignedDate: '2026-03-22',
  },
  {
    id: '8',
    title: 'Task 2: Work & Lifestyle Balance',
    topic: 'Nowadays, many people complain that they have difficulties balancing their work and personal life. What are the causes of this? What are the possible solutions to this problem?',
    assignedDate: '2026-03-25',
  },
  {
    id: '9',
    title: 'Task 1: Academic - Process Diagram',
    topic: 'The diagram in your pilot handbook (Page 18) shows the process of recycling plastic bottles. Summarise the information by selecting and reporting the main features, and make comparisons where relevant.',
    assignedDate: '2026-03-29',
  },
  {
    id: '10',
    title: 'Task 2: Crime & Punishment',
    topic: 'Some people believe that the best way to reduce crime is to give longer prison sentences. Others, however, believe there are better alternative ways of reducing crime. Discuss both views and give your opinion.',
    assignedDate: '2026-04-02',
  }
];

export default function IeltsWriting() {
  const navigate = useNavigate();
  const { toast } = useToast();
  
  // Layout State
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  
  // Writing Task State
  const [selectedAssignment, setSelectedAssignment] = useState<Assignment | null>(null);
  const [essayText, setEssayText] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Dynamic Word Count Target based on Task Type
  const targetWordCount = selectedAssignment?.title.includes('Task 1') ? 150 : 250;

  // Calculate word count dynamically
  const wordCount = useMemo(() => {
    const trimmed = essayText.trim();
    return trimmed ? trimmed.split(/\s+/).length : 0;
  }, [essayText]);

  const handleBack = () => {
    setSelectedAssignment(null);
    setEssayText(''); // Optional: clear text or keep for draft saving
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
    // Simulate API call
    setTimeout(() => {
      setSubmitting(false);
      toast({ title: 'Success!', description: 'Writing submitted successfully for analysis.' });
      handleBack();
    }, 1500);
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-slate-950 transition-colors duration-300">
      <StudentSidebar 
        activeTab="writing" 
        onTabChange={(tab) => {
            if (tab === 'dashboard') navigate('/student/dashboard');
            if (tab === 'settings') navigate('/student/profile');
        }} 
        isCollapsed={isSidebarCollapsed}
        toggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
      />

      <div className={`transition-all duration-300 ${isSidebarCollapsed ? 'lg:pl-24' : 'lg:pl-72'} flex flex-col min-h-screen`}>
        <StudentTopbar onUpgradeClick={() => {}} />

        {/* Dynamic Main Content Area */}
        <main className="flex-1 p-6 max-w-7xl mx-auto w-full flex flex-col animate-in fade-in slide-in-from-bottom-4 duration-500">
          
          {/* --- VIEW 1: Card Selection Screen --- */}
          {!selectedAssignment ? (
            <div className="space-y-8 h-full">
              
              {/* --- NEW COLORED BANNER --- */}
              <div className="bg-[#7B61FF] rounded-2xl p-8 md:p-10 text-white shadow-md relative overflow-hidden">
                {/* Optional decorative element */}
                <div className="absolute top-0 right-0 -mt-4 -mr-4 w-32 h-32 bg-white opacity-10 rounded-full blur-2xl"></div>
                
                <div className="relative z-10">
                  <h1 className="text-3xl font-bold mb-3 flex items-center gap-2">
                    IELTS Writing Analysis <Sparkles className="h-6 w-6 text-yellow-300" fill="currentColor" />
                  </h1>
                  <p className="text-indigo-50 max-w-2xl text-base md:text-lg leading-relaxed mb-6">
                    Master your writing skills with detailed, AI-powered feedback. Select a prompt below, aim for your target word count, and get instant insights on your grammar, vocabulary, and task coherence to push for a band 7+.
                  </p>
                </div>
              </div>

              {MOCK_ASSIGNMENTS.length === 0 ? (
                <Card className="border-none shadow-sm bg-white dark:bg-slate-900 flex flex-col items-center justify-center p-12 text-center">
                  <BookOpen className="h-12 w-12 text-slate-300 dark:text-slate-600 mb-4" />
                  <CardTitle className="text-lg text-slate-700 dark:text-slate-200">No Assignments Yet</CardTitle>
                  <CardDescription className="dark:text-slate-400">Your instructor hasn't assigned any writing tasks currently.</CardDescription>
                </Card>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                  {MOCK_ASSIGNMENTS.map((assignment) => (
                    <Card 
                      key={assignment.id}
                      onClick={() => setSelectedAssignment(assignment)}
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
          ) : (
            
            /* --- VIEW 2: Split Screen Writing Interface --- */
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
        </main>
      </div>
    </div>
  );
}