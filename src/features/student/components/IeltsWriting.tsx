import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { StudentSidebar } from './dashboard/StudentSidebar';
import { StudentTopbar } from './dashboard/StudentTopbar';
import { Button } from '@/shared/components/ui/button';
import { useToast } from '@/shared/hooks/use-toast';
import { ArrowLeft, Send, PenTool, BookOpen } from 'lucide-react';
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
    if (wordCount < 250) {
      toast({ 
        title: 'Word count too low', 
        description: 'Please write at least 250 words before submitting.', 
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
              <div>
                <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">IELTS Writing Analysis</h1>
                <p className="text-slate-500 dark:text-slate-400">Select an assigned task below to begin writing.</p>
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
                      className="border border-slate-200 dark:border-slate-800 shadow-sm bg-white dark:bg-slate-900 hover:shadow-md hover:border-indigo-300 dark:hover:border-indigo-700 transition-all cursor-pointer flex flex-col h-64 group"
                    >
                      <CardHeader className="pb-3 flex-none">
                        <div className="flex justify-between items-start gap-4">
                          <CardTitle className="text-lg font-bold text-slate-800 dark:text-slate-100 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors line-clamp-2">
                            {assignment.title}
                          </CardTitle>
                          <Badge className="bg-indigo-100 text-indigo-700 hover:bg-indigo-100 dark:bg-indigo-900/50 dark:text-indigo-300 flex-shrink-0">
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
                          <span className="text-indigo-600 dark:text-indigo-400 flex items-center group-hover:translate-x-1 transition-transform">
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
                  className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm w-full sm:w-auto"
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
                      <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400 mb-2">
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
                        <li>Target length is around <strong>800 words</strong>.</li>
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
                        wordCount >= 800 
                          ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' 
                          : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                      }`}
                    >
                      {wordCount} / 800 words
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