import React, { useState } from 'react';
import {
  Play, ArrowLeft, CheckCircle, XCircle, Brain, Target,
  ChevronRight, Check, BookOpen, Clock, BarChart, BookMarked, Sparkles
} from 'lucide-react';
import { StudentSidebar } from "./dashboard/StudentSidebar";
import { StudentTopbar } from "./dashboard/StudentTopbar";
import { PremiumModal } from "@/features/payment/components/PremiumModal";

// --- DUMMY DATA FOR IELTS COURSES ---
type Quiz = {
  question: string;
  options: string[];
  correctAnswer: string;
  explanation: string;
};

type Module = {
  id: string;
  title: string;
  duration: string;
  content: React.ReactNode;
  quiz: Quiz;
};

type Course = {
  id: string;
  title: string;
  description: string;
  progress: number;
  level: string;
  duration: string;
  modules: Module[];
};

const IELTS_COURSES: Course[] = [
  {
    id: 'ielts-acad-reading',
    title: 'Academic Reading Masterclass',
    description: 'Master the "Big Game" of IELTS Academic Reading by learning advanced skimming, scanning, and analytical techniques.',
    progress: 35,
    level: 'Advanced',
    duration: '12h 20m',
    modules: [
      {
        id: 'mod-1',
        title: 'Module 1: Skimming and Scanning Strategies',
        duration: '45m',
        content: (
          <div className="space-y-4 text-slate-700 dark:text-slate-300 leading-relaxed">
            <p>Skimming and scanning are foundational skills for the IELTS Reading test. You have 60 minutes to read three long passages and answer 40 questions. Reading every single word is impossible.</p>
            <p><strong>Skimming</strong> involves reading a text quickly to get a general idea of meaning. You should focus on headings, subheadings, the first sentences of paragraphs (topic sentences), and any bold or italicized words.</p>
            <p><strong>Scanning</strong> involves searching for specific information, such as dates, names, or numbers, without reading the surrounding text carefully.</p>
          </div>
        ),
        quiz: {
          question: 'When skimming a paragraph in the IELTS reading test, which part should you typically focus on the most?',
          options: [
            'The concluding sentence of the text',
            'Every single adjective used',
            'The first sentence (topic sentence)',
            'The exact dates and numbers'
          ],
          correctAnswer: 'The first sentence (topic sentence)',
          explanation: 'The topic sentence usually introduces the main idea of the paragraph, making it the most critical element when skimming for general meaning.'
        }
      },
      {
        id: 'mod-2',
        title: 'Module 2: Tackling True/False/Not Given',
        duration: '1h 10m',
        content: (
          <div className="space-y-4 text-slate-700 dark:text-slate-300 leading-relaxed">
            <p>The True/False/Not Given (TFNG) question type assesses your ability to identify whether information in a text is factually correct, incorrect, or missing.</p>
            <ul className="list-disc pl-5 space-y-2 mt-2">
              <li><strong>True:</strong> The statement completely agrees with the information in the passage.</li>
              <li><strong>False:</strong> The statement contradicts the information in the passage.</li>
              <li><strong>Not Given:</strong> There is no information on this; you cannot say whether it is true or false based on the text.</li>
            </ul>
            <p>A common mistake is using outside knowledge. You must base your answers <em>only</em> on the provided text.</p>
          </div>
        ),
        quiz: {
          question: 'If a statement makes a claim that is completely plausible but is never explicitly mentioned or contradicted in the text, the correct answer is:',
          options: [
            'True',
            'False',
            'Not Given',
            'Yes'
          ],
          correctAnswer: 'Not Given',
          explanation: 'If the information cannot be found or deduced purely from the text, it is "Not Given", regardless of whether it is true in the real world.'
        }
      },
      {
        id: 'mod-3',
        title: 'Module 3: Matching Headings',
        duration: '50m',
        content: (
          <div className="space-y-4 text-slate-700 dark:text-slate-300 leading-relaxed">
            <p>In the "Matching Headings" task, you are given a list of headings and must match them to the correct paragraphs. There are always more headings than paragraphs.</p>
            <p>It is best to read the paragraph first, summarize its main point in your head, and then look at the list of headings to find the closest match. Looking at the headings first can confuse you, as many are designed as distractors.</p>
          </div>
        ),
        quiz: {
          question: 'What is the recommended strategy for approaching a Matching Headings task?',
          options: [
            'Read the headings first and then search the text for identical words.',
            'Read the paragraph first, summarize it mentally, then select the best heading.',
            'Read only the last sentence of each paragraph.',
            'Match the headings randomly to save time.'
          ],
          correctAnswer: 'Read the paragraph first, summarize it mentally, then select the best heading.',
          explanation: 'Reading the paragraph first prevents you from being tricked by distractors in the headings list.'
        }
      }
    ]
  },
  {
    id: 'ielts-gen-reading',
    title: 'General Training Reading',
    description: 'Navigate workplace documents, notices, and everyday texts with high efficiency and accuracy.',
    progress: 0,
    level: 'Intermediate',
    duration: '10h 0m',
    modules: [
      {
        id: 'gen-1',
        title: 'Module 1: Reading Everyday Notices',
        duration: '30m',
        content: (
          <div className="space-y-4 text-slate-700 dark:text-slate-300 leading-relaxed">
            <p>Section 1 of the GT Reading test contains short texts relevant to everyday life in an English-speaking country. These might be advertisements, timetables, or notices.</p>
            <p>Pay attention to the conditions attached to statements. For example, a notice might say "Free entry for children under 12 on Tuesdays." If the question asks if a 10-year-old enters free on Wednesday, the answer is False.</p>
          </div>
        ),
        quiz: {
          question: 'When reading short notices in Section 1, what is crucial to pay attention to?',
          options: [
            'The author\'s emotional tone.',
            'Conditions and specific details like days, ages, or exceptions.',
            'Complex grammatical structures.',
            'The historical background of the notice.'
          ],
          correctAnswer: 'Conditions and specific details like days, ages, or exceptions.',
          explanation: 'Everyday notices often rely on specific conditions (like dates or age limits) to test your detailed comprehension.'
        }
      },
      {
        id: 'gen-2',
        title: 'Module 2: Workplace Survival Skills',
        duration: '45m',
        content: (
          <div className="space-y-4 text-slate-700 dark:text-slate-300 leading-relaxed">
            <p>Section 2 focuses on work-related topics: job descriptions, contracts, and staff training manuals.</p>
            <p>Vocabulary here is slightly more formal. You need to quickly identify the purpose of the document. Is it explaining a process, outlining rules, or advertising a role?</p>
          </div>
        ),
        quiz: {
          question: 'What type of texts are typically found in Section 2 of the General Training Reading test?',
          options: [
            'Academic journals and scientific research.',
            'Workplace documents like manuals, contracts, and job descriptions.',
            'Fictional short stories.',
            'Opinion pieces from newspapers.'
          ],
          correctAnswer: 'Workplace documents like manuals, contracts, and job descriptions.',
          explanation: 'Section 2 is specifically designed to test "workplace survival" English.'
        }
      },
      {
        id: 'gen-3',
        title: 'Module 3: The Extended Prose',
        duration: '1h 0m',
        content: (
          <div className="space-y-4 text-slate-700 dark:text-slate-300 leading-relaxed">
            <p>Section 3 is the hardest part of the GT test. It consists of a single, long text that is more complex and instructive.</p>
            <p>You will need to use all the skills you learned: skimming for general meaning, scanning for specifics, and reading for detail to understand arguments and opinions.</p>
          </div>
        ),
        quiz: {
          question: 'How does Section 3 of the GT Reading test compare to Sections 1 and 2?',
          options: [
            'It is much shorter and easier.',
            'It consists of multiple short advertisements.',
            'It contains a single, longer, and more complex text.',
            'It only tests grammar.'
          ],
          correctAnswer: 'It contains a single, longer, and more complex text.',
          explanation: 'Section 3 is the longest and most difficult part of the GT reading, requiring sustained focus on a complex text.'
        }
      }
    ]
  }
];

// --- MAIN COMPONENT ---
type ViewState = 'dashboard' | 'course' | 'module' | 'quiz' | 'feedback';

export default function CourseSection() {
  const [activeTab, setActiveTab] = useState("courses");
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [showPremiumModal, setShowPremiumModal] = useState(false);

  const [view, setView] = useState<ViewState>('dashboard');
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [selectedModule, setSelectedModule] = useState<Module | null>(null);
  
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Navigation Handlers
  const openCourse = (course: Course) => {
    setSelectedCourse(course);
    setView('course');
  };

  const openModule = (module: Module) => {
    setSelectedModule(module);
    setView('module');
  };

  const startQuiz = () => {
    setSelectedAnswer(null);
    setView('quiz');
  };

  const submitQuiz = () => {
    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      setView('feedback');
    }, 600); // simulate tiny delay for UX
  };

  const goBack = () => {
    if (view === 'feedback' || view === 'quiz' || view === 'module') {
      setView('course');
      setSelectedModule(null);
      setSelectedAnswer(null);
    } else if (view === 'course') {
      setView('dashboard');
      setSelectedCourse(null);
    }
  };

  return (
    <div className="min-h-screen bg-[#f1f3f9] dark:bg-slate-950 transition-colors duration-300 font-sans text-slate-800 dark:text-slate-200">
      <StudentSidebar activeTab='courses-section' onTabChange={setActiveTab} isCollapsed={isSidebarCollapsed} toggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)} />

      <div className={`min-h-screen flex flex-col transition-all duration-300 ${isSidebarCollapsed ? 'lg:pl-20' : 'lg:pl-64'}`}>
        <StudentTopbar onUpgradeClick={() => setShowPremiumModal(true)} />

        <main className="flex-1 p-4 md:p-6 lg:p-8 flex justify-center items-start animate-in fade-in duration-500 w-full">
          <div className="w-full max-w-6xl">

            {/* VIEW 1: DASHBOARD */}
            {view === 'dashboard' && (
              <>
                {/* --- NEW COLORED BANNER --- */}
                <div className="bg-[#7B61FF] rounded-2xl p-8 md:p-10 text-white shadow-md relative overflow-hidden mb-8">
                  <div className="absolute top-0 right-0 -mt-4 -mr-4 w-32 h-32 bg-white opacity-10 rounded-full blur-2xl"></div>
                  
                  <div className="relative z-10">
                    <h1 className="text-3xl font-bold mb-3 flex items-center gap-2">
                      My Learning <Sparkles className="h-6 w-6 text-yellow-300" fill="currentColor" />
                    </h1>
                    <p className="text-indigo-50 max-w-2xl text-base md:text-lg leading-relaxed mb-6">
                      Track your IELTS progress, dive into expert modules, and test your knowledge. Complete lessons consistently to push for your target band score.
                    </p>
                    
                    {/* <div className="flex gap-3">
                       <button className="bg-white text-[#7B61FF] hover:bg-slate-100 font-semibold rounded-full px-6 py-2 shadow-sm text-sm">
                         Resume Course
                       </button>
                    </div> */}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {IELTS_COURSES.map((course) => (
                    <div key={course.id} onClick={() => openCourse(course)} className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md hover:border-[#7B61FF]/50 transition-all cursor-pointer group flex flex-col h-full">
                      <div className="flex justify-between items-start mb-4">
                        <span className="bg-indigo-50 dark:bg-[#7B61FF]/20 text-[#7B61FF] px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-widest flex items-center gap-1.5">
                          <BookMarked size={12} /> {course.level}
                        </span>
                        {course.progress > 0 && <span className="text-xs font-semibold text-slate-500">In Progress</span>}
                      </div>
                      
                      <h3 className="text-xl font-bold text-[#0b132b] dark:text-white mb-2 group-hover:text-[#7B61FF] transition-colors line-clamp-2">{course.title}</h3>
                      <p className="text-sm text-slate-500 dark:text-slate-400 mb-6 flex-1 line-clamp-3">{course.description}</p>
                      
                      <div className="mt-auto">
                        <div className="flex justify-between text-xs font-medium text-slate-500 mb-2">
                          <span>Progress</span>
                          <span>{course.progress}%</span>
                        </div>
                        <div className="h-1.5 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden mb-4">
                          <div className="h-full bg-[#7B61FF] rounded-full" style={{ width: `${course.progress}%` }} />
                        </div>
                        <div className="flex items-center justify-between text-xs font-medium text-slate-400">
                          <span className="flex items-center gap-1.5"><Clock size={14}/> {course.duration}</span>
                          <span className="flex items-center gap-1.5"><BarChart size={14}/> {course.modules.length} Modules</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}

            {/* VIEW 2: COURSE MODULE LIST */}
            {view === 'course' && selectedCourse && (
              <div className="animate-in slide-in-from-right-4 duration-300">
                <button onClick={goBack} className="flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-[#0b132b] dark:hover:text-white mb-6 transition-colors">
                  <ArrowLeft size={16} /> Back to Courses
                </button>

                <div className="bg-indigo-700 rounded-3xl p-8 md:p-10 text-white mb-8 shadow-lg relative overflow-hidden">
                  <div className="relative z-10 max-w-2xl">
                    <span className="inline-block px-3 py-1 bg-[#7B61FF] text-white rounded-md text-xs font-bold uppercase tracking-widest mb-4">Course</span>
                    <h1 className="text-3xl md:text-4xl font-black mb-4 leading-tight">{selectedCourse.title}</h1>
                    <p className="text-slate-300 mb-6">{selectedCourse.description}</p>
                    <div className="flex items-center gap-6 text-sm font-medium text-slate-400">
                      <span className="flex items-center gap-2"><BookOpen size={16}/> {selectedCourse.modules.length} Modules</span>
                      <span className="flex items-center gap-2"><Clock size={16}/> {selectedCourse.duration}</span>
                    </div>
                  </div>
                  {/* Decorative circle */}
                  <div className="absolute top-[-50%] right-[-10%] w-[500px] h-[500px] rounded-full bg-gradient-to-br from-[#7B61FF]/30 to-transparent blur-3xl" />
                </div>

                <h3 className="text-xl font-bold text-[#0b132b] dark:text-white mb-4">Course Content</h3>
                <div className="space-y-4">
                  {selectedCourse.modules.map((mod, i) => (
                    <div key={mod.id} onClick={() => openModule(mod)} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 md:p-6 flex items-center justify-between cursor-pointer hover:border-[#7B61FF]/50 hover:shadow-sm transition-all group">
                      <div className="flex items-center gap-4 md:gap-6">
                        <div className="w-12 h-12 rounded-full bg-indigo-50 dark:bg-[#7B61FF]/10 text-[#7B61FF] flex items-center justify-center font-bold shrink-0">
                          {i + 1}
                        </div>
                        <div>
                          <h4 className="text-base md:text-lg font-bold text-[#0b132b] dark:text-white group-hover:text-[#7B61FF] transition-colors">{mod.title}</h4>
                          <span className="text-xs text-slate-500 mt-1 flex items-center gap-1.5"><Clock size={12}/> {mod.duration}</span>
                        </div>
                      </div>
                      <button className="hidden sm:flex items-center gap-2 text-sm font-bold text-[#7B61FF] bg-indigo-50 dark:bg-[#7B61FF]/10 px-4 py-2 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity">
                        Start <Play size={14} fill="currentColor" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* VIEW 3: MODULE CONTENT READING */}
            {view === 'module' && selectedModule && selectedCourse && (
              <div className="max-w-3xl mx-auto animate-in fade-in duration-300">
                <button onClick={goBack} className="flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-[#0b132b] dark:hover:text-white mb-6 transition-colors">
                  <ArrowLeft size={16} /> Back to Modules
                </button>

                <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 md:p-10 border border-slate-200 dark:border-slate-800 shadow-sm">
                  <div className="mb-8 border-b border-slate-100 dark:border-slate-800 pb-8">
                    <span className="text-[#7B61FF] text-xs font-bold uppercase tracking-widest mb-2 block">{selectedCourse.title}</span>
                    <h2 className="text-2xl md:text-3xl font-bold text-[#0b132b] dark:text-white leading-tight">{selectedModule.title}</h2>
                  </div>

                  <div className="prose prose-slate dark:prose-invert max-w-none text-base md:text-lg">
                    {selectedModule.content}
                  </div>

                  <div className="mt-12 pt-8 border-t border-slate-100 dark:border-slate-800">
                    <button onClick={startQuiz} className="w-full sm:w-auto flex items-center justify-center gap-2 bg-[#7B61FF] hover:bg-[#6a50e5] text-white px-8 py-4 rounded-xl font-bold transition-colors shadow-sm ml-auto">
                      <Brain size={18} /> Continue to Quiz <ChevronRight size={18} />
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* VIEW 4: QUIZ */}
            {view === 'quiz' && selectedModule && (
              <div className="max-w-3xl mx-auto animate-in slide-in-from-bottom-4 duration-300">
                <button onClick={goBack} className="flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-[#0b132b] dark:hover:text-white mb-6 transition-colors">
                  <ArrowLeft size={16} /> Back to Reading
                </button>

                <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 md:p-10 border border-slate-200 dark:border-slate-800 shadow-sm">
                  <div className="flex items-center gap-2 mb-6 text-[#7B61FF]">
                    <Target size={20} /> <span className="text-sm font-bold uppercase tracking-widest">Knowledge Check</span>
                  </div>
                  
                  <h3 className="text-xl md:text-2xl font-bold text-[#0b132b] dark:text-white mb-8 leading-snug">
                    {selectedModule.quiz.question}
                  </h3>

                  <div className="space-y-4">
                    {selectedModule.quiz.options.map((option, idx) => {
                      const isSelected = selectedAnswer === option;
                      const letter = String.fromCharCode(65 + idx);
                      return (
                        <button key={idx} onClick={() => setSelectedAnswer(option)}
                          className={`w-full flex items-center gap-4 p-4 md:p-5 rounded-2xl border-2 text-left transition-all ${isSelected ? 'border-[#7B61FF] bg-indigo-50 dark:bg-[#7B61FF]/10' : 'border-slate-100 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-600 bg-white dark:bg-slate-900'}`}>
                          <span className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold shrink-0 ${isSelected ? 'bg-[#7B61FF] text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-500'}`}>
                            {letter}
                          </span>
                          <span className={`text-base font-semibold ${isSelected ? 'text-[#7B61FF] dark:text-indigo-200' : 'text-slate-700 dark:text-slate-300'}`}>
                            {option}
                          </span>
                        </button>
                      );
                    })}
                  </div>

                  <div className="mt-8 pt-8 border-t border-slate-100 dark:border-slate-800 flex justify-end">
                    <button onClick={submitQuiz} disabled={!selectedAnswer || isSubmitting}
                      className="w-full sm:w-auto flex items-center justify-center px-8 py-4 rounded-xl bg-[#0b132b] dark:bg-white text-white dark:text-[#0b132b] font-bold shadow-sm disabled:opacity-50 transition-all">
                      {isSubmitting ? 'Checking...' : 'Submit Answer'}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* VIEW 5: QUIZ FEEDBACK */}
            {view === 'feedback' && selectedModule && selectedAnswer && (
              <div className="max-w-3xl mx-auto animate-in zoom-in-95 duration-300">
                {(() => {
                  const isCorrect = selectedAnswer === selectedModule.quiz.correctAnswer;
                  return (
                    <div className={`bg-white dark:bg-slate-900 rounded-3xl p-6 md:p-10 border-2 shadow-sm ${isCorrect ? 'border-[#10b981]' : 'border-rose-500'}`}>
                      <div className="flex flex-col items-center text-center mb-8">
                        <div className={`w-20 h-20 rounded-full flex items-center justify-center mb-6 ${isCorrect ? 'bg-[#10b981]/10 text-[#10b981]' : 'bg-rose-500/10 text-rose-500'}`}>
                          {isCorrect ? <CheckCircle size={40} /> : <XCircle size={40} />}
                        </div>
                        <h2 className={`text-2xl md:text-3xl font-black mb-2 ${isCorrect ? 'text-[#10b981]' : 'text-rose-500'}`}>
                          {isCorrect ? 'Correct!' : 'Incorrect'}
                        </h2>
                        <p className="text-slate-500 dark:text-slate-400 font-medium">
                          {isCorrect ? "Great job. You've mastered this concept." : "Let's review the correct approach."}
                        </p>
                      </div>

                      <div className="bg-slate-50 dark:bg-slate-800/50 rounded-2xl p-6 mb-8">
                        <h4 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-4">Question Review</h4>
                        <p className="text-lg font-semibold text-[#0b132b] dark:text-white mb-6">{selectedModule.quiz.question}</p>
                        
                        {!isCorrect && (
                          <div className="mb-4">
                            <span className="text-xs font-bold text-rose-500 uppercase">Your Answer:</span>
                            <p className="text-slate-700 dark:text-slate-300 font-medium mt-1 p-3 bg-rose-50 dark:bg-rose-900/10 rounded-xl">{selectedAnswer}</p>
                          </div>
                        )}
                        
                        <div>
                          <span className="text-xs font-bold text-[#10b981] uppercase">Correct Answer:</span>
                          <p className="text-slate-700 dark:text-slate-300 font-medium mt-1 p-3 bg-[#10b981]/10 rounded-xl">{selectedModule.quiz.correctAnswer}</p>
                        </div>
                      </div>

                      <div className="bg-indigo-50 dark:bg-[#7B61FF]/10 rounded-2xl p-6 mb-8 border border-[#7B61FF]/20">
                        <div className="flex items-center gap-2 mb-2 text-[#7B61FF]">
                          <Brain size={18} /> <span className="font-bold">Explanation</span>
                        </div>
                        <p className="text-[#0b132b] dark:text-slate-200 leading-relaxed">
                          {selectedModule.quiz.explanation}
                        </p>
                      </div>

                      <div className="flex justify-center">
                        <button onClick={goBack} className="w-full sm:w-auto px-8 py-4 rounded-xl font-bold bg-[#0b132b] dark:bg-white text-white dark:text-[#0b132b] shadow-sm hover:opacity-90 transition-opacity">
                          Back to Modules
                        </button>
                      </div>
                    </div>
                  );
                })()}
              </div>
            )}

          </div>
        </main>
      </div>
      <PremiumModal isOpen={showPremiumModal} onClose={() => setShowPremiumModal(false)} />
    </div>
  );
}