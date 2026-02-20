import React, { useState, useEffect } from 'react';
import { 
  Search, Plus, Star, AlertTriangle, Users, BookOpen, Clock, 
  Target, AlertCircle, FileText, ExternalLink, BookOpenCheck, 
  X, PlaySquare, Eye, Lightbulb, Rocket, BarChart2
} from 'lucide-react';
import { InstructorSidebar } from "./dashboard/InstructorSidebar"
import { InstructorTopbar } from "./dashboard/InstructorTopbar"

// --- MOCK DATA ---
const globalResources = [
  { type: 'video', title: 'How to Master IELTS Part 2 Cue Cards', source: 'IELTS Liz', insight: '68% of students struggle with Part 2 timing', url: 'https://www.youtube.com/results?search_query=How+to+Master+IELTS+Part+2+Cue+Cards' },
  { type: 'doc', title: 'The Feynman Technique for Technical Communication', source: 'Medium', insight: 'Tech Prep students lack explanation clarity', url: 'https://medium.com/search?q=Feynman+Technique' },
  { type: 'video', title: 'Professional English: Elevator Pitch Formula', source: 'TED Ed', insight: '55% drop-off in Professional Introductions module', url: 'https://www.youtube.com/results?search_query=Elevator+Pitch+Formula' },
  { type: 'doc', title: '10 Discourse Markers That Sound Natural in IELTS', source: 'IELTS Buddy', insight: 'Vocabulary range scores are lowest across all courses', url: 'https://www.ieltsbuddy.com/' },
  { type: 'video', title: 'How to Think Aloud in Coding Interviews', source: 'Clement Mihailescu', insight: '62% avg on "Thinking Aloud" module', url: 'https://www.youtube.com/results?search_query=Think+Aloud+Coding+Interview' },
  { type: 'doc', title: 'Building Confidence Through Deliberate Practice', source: 'Harvard Business Review', insight: 'Struggling students show confidence gaps', url: 'https://hbr.org/' }
];

const coursesData = [
  {
    id: 'ielts',
    title: 'IELTS Band 7+ Speaking Masterclass',
    rating: 4.8,
    description: 'Comprehensive speaking strategies to achieve Band 7 and above. Covers fluency, pronunciation, lexical resource, and...',
    students: 42,
    modules: 3,
    quizAvg: '48%',
    completionWidth: '60%',
    analytics: {
      activeStudents: 38,
      completionRate: '68%',
      avgQuizScore: '72%',
      avgTimeSpent: '42m',
      dropOff: {
        module: 'Part 2: The Cue Card Technique',
        reason: 'Consider simplifying this module or adding more practice material before it.',
      },
      modulesAttention: [
        { name: 'Part 2: The Cue Card Technique', score: '54% avg score' },
        { name: 'Understanding IELTS Speaking Criteria', score: '68% avg score' }
      ],
      studentsNeedHelp: [
        { name: 'Fatima Khan', issue: 'Only 38% quiz accuracy — struggles with criteria understanding' },
        { name: 'Dev Das', issue: "Hasn't opened Module 2 yet — 12 days inactive" }
      ],
      topPerformers: [
        { name: 'Rahul Nair', score: '92%' },
        { name: 'Kavya Nair', score: '88%' }
      ],
      resources: globalResources
    }
  },
  {
    id: 'spoken-english',
    title: 'Spoken English for Professionals',
    rating: 4.6,
    description: 'Build workplace communication skills — meetings, presentations, small follow-ups, and cross-cultural...',
    students: 28,
    modules: 1,
    quizAvg: '62%',
    completionWidth: '55%',
    analytics: {
      activeStudents: 28,
      completionRate: '55%',
      avgQuizScore: '65%',
      avgTimeSpent: '28m',
      dropOff: {
        module: 'Professional Introductions',
        reason: 'Consider simplifying this module or adding more practice material before it.',
      },
      modulesAttention: [
        { name: 'Professional Introductions', score: '58% avg score' }
      ],
      studentsNeedHelp: [
        { name: 'Sneha Reddy', issue: 'Completed module but scored 52% on quiz — needs review' }
      ],
      topPerformers: [
        { name: 'Priya Sharma', score: '85%' },
        { name: 'Arjun Mehta', score: '78%' }
      ],
      resources: globalResources
    }
  },
  {
    id: 'tech-interview',
    title: 'Technical Interview Communication',
    rating: 4.9,
    description: 'Master the art of explaining technical concepts clearly. Practice thinking aloud, structured problem-solving, and...',
    students: 25,
    modules: 1,
    quizAvg: '81%',
    completionWidth: '74%',
    analytics: {
      activeStudents: 25,
      completionRate: '74%',
      avgQuizScore: '81%',
      avgTimeSpent: '55m',
      dropOff: {
        module: 'Thinking Aloud in Interviews',
        reason: 'Consider simplifying this module or adding more practice material before it.',
      },
      modulesAttention: [
        { name: 'Thinking Aloud in Interviews', score: '62% avg score' }
      ],
      studentsNeedHelp: [
        { name: 'Dev Das', issue: 'Fails to articulate trade-offs in mock interviews' }
      ],
      topPerformers: [
        { name: 'Kavya Nair', score: '94%' },
        { name: 'Rohan Gupta', score: '92%' }
      ],
      resources: globalResources
    }
  }
];

const publishedContentData = [
  { icon: FileText, title: '5 Common IELTS Speaking Mistakes That Cost You a Band', meta: 'Sarah Khan • 4 min • IELTS Tips', reads: 29 },
  { icon: Lightbulb, title: 'How to Explain Technical Concepts Like a Senior Engineer', meta: 'Deepak Sharma • 5 min • Career Growth', reads: 21 },
  { icon: Rocket, title: 'Building Confidence in Spoken English: A 30-Day Plan', meta: 'Ravi Kumar • 6 min • Spoken English', reads: 37 }
];

export default function InstructorCourseManagement() {
  // Sidebar State
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  const [selectedCourseId, setSelectedCourseId] = useState(coursesData[0].id);
  const activeCourse = coursesData.find(c => c.id === selectedCourseId) || coursesData[0];

  // States for toggle buttons
  const [courseToggles, setCourseToggles] = useState<Record<string, { quiz: boolean, help: boolean }>>({});

  // States for Modals
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isQuizModalOpen, setIsQuizModalOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('General');

  // States for dynamic Quiz & Flashcard generation
  const [quizQuestions, setQuizQuestions] = useState([{ id: 1 }]);
  const [flashcards, setFlashcards] = useState([{ id: 1 }]);

  // Prevent background scrolling when modals are open
  useEffect(() => {
    if (isCreateModalOpen || isQuizModalOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'auto';
    }
    return () => { document.body.style.overflow = 'auto'; };
  }, [isCreateModalOpen, isQuizModalOpen]);

  const handleToggle = (e: React.MouseEvent, courseId: string, type: 'quiz' | 'help') => {
    e.stopPropagation();
    setCourseToggles(prev => ({
      ...prev,
      [courseId]: { ...prev[courseId], [type]: !prev[courseId]?.[type] }
    }));
  };

  const handleResourceClick = (url: string) => {
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const handleAddQuestion = () => setQuizQuestions([...quizQuestions, { id: quizQuestions.length + 1 }]);
  const handleAddFlashcard = () => setFlashcards([...flashcards, { id: flashcards.length + 1 }]);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#09090E] font-sans text-slate-900 dark:text-slate-200 transition-colors duration-300">
      
      {/* Sidebar */}
      <InstructorSidebar
        activeTab="courses" 
        isCollapsed={isSidebarCollapsed}
        toggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
      />

      {/* Main Content Area */}
      <div className={`transition-all duration-300 ${isSidebarCollapsed ? 'lg:pl-24' : 'lg:pl-72'}`}>
        
        {/* Topbar: Passed the onCreateCourse prop so the topbar button opens the modal */}
        <InstructorTopbar onCreateCourse={() => setIsCreateModalOpen(true)} />

        <main className="p-4 sm:p-6 lg:p-8 max-w-[1600px] mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
          
          {/* Header Section */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold mb-1 text-slate-900 dark:text-white">Course Management</h1>
              <p className="text-slate-500 dark:text-slate-400 text-sm">Monitor student engagement, identify drop-off points, and discover resources.</p>
            </div>
            
            <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
              <div className="relative flex-1 md:flex-none">
                <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 dark:text-slate-500" />
                <input 
                  type="text" 
                  placeholder="Search specific courses..." 
                  className="w-full md:w-64 bg-white dark:bg-[#1A1A24] border border-slate-200 dark:border-[#2A2A3A] text-sm rounded-md pl-10 pr-4 py-2 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-slate-900 dark:text-slate-200 transition-colors shadow-sm dark:shadow-none"
                />
              </div>
              <button 
                onClick={() => setIsCreateModalOpen(true)}
                className="w-full md:w-auto bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-md text-sm font-medium flex items-center justify-center transition-colors shadow-sm md:hidden lg:flex"
              >
                <Plus className="w-4 h-4 mr-2" />
                Create Course
              </button>
            </div>
          </div>

          {/* Course Carousel */}
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 mb-8">
            {coursesData.map((course) => {
              const isQuizActive = courseToggles[course.id]?.quiz;
              const isHelpActive = courseToggles[course.id]?.help;

              return (
                <div 
                  key={course.id} 
                  onClick={() => setSelectedCourseId(course.id)}
                  className={`bg-white dark:bg-[#12121A] border rounded-xl p-5 cursor-pointer transition-all duration-200 shadow-sm dark:shadow-none ${
                    selectedCourseId === course.id 
                      ? 'border-indigo-500 ring-1 ring-indigo-500/50' 
                      : 'border-slate-200 dark:border-[#1E1E2A] hover:border-slate-300 dark:hover:border-[#2A2A3A]'
                  }`}
                >
                  <div className="flex justify-between items-start mb-3 gap-2">
                    <h3 className="font-semibold text-base leading-tight flex-1 text-slate-900 dark:text-white">{course.title}</h3>
                    <div className="flex items-center text-amber-600 dark:text-amber-500 bg-amber-50 dark:bg-amber-500/10 px-2 py-1 rounded text-xs font-bold whitespace-nowrap border border-amber-200/50 dark:border-transparent">
                      <Star className="w-3 h-3 mr-1 fill-current" />
                      {course.rating}
                    </div>
                  </div>
                  <p className="text-slate-500 dark:text-slate-400 text-xs mb-4 line-clamp-2 h-8 leading-relaxed">{course.description}</p>
                  
                  <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500 dark:text-slate-400 mb-4 font-medium">
                    <div className="flex items-center bg-slate-50 dark:bg-[#1A1A24] px-2 py-1 rounded-md border border-slate-100 dark:border-[#2A2A3A]"><Users className="w-3.5 h-3.5 mr-1.5 text-indigo-500"/> {course.students}</div>
                    <div className="flex items-center bg-slate-50 dark:bg-[#1A1A24] px-2 py-1 rounded-md border border-slate-100 dark:border-[#2A2A3A]"><BookOpen className="w-3.5 h-3.5 mr-1.5 text-emerald-500"/> {course.modules} modules</div>
                  </div>

                  <div className="mb-5">
                    <div className="flex justify-between text-xs text-slate-500 dark:text-slate-400 mb-1.5 font-medium">
                      <span>Completion</span>
                      <span>{course.completionWidth}</span>
                    </div>
                    <div className="w-full bg-slate-100 dark:bg-[#1E1E2A] rounded-full h-1.5 overflow-hidden">
                      <div className="bg-indigo-500 h-1.5 rounded-full" style={{ width: course.completionWidth }}></div>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2 sm:gap-3 border-t border-slate-100 dark:border-[#1E1E2A] pt-4 mt-auto">
                    <button 
                      onClick={(e) => handleToggle(e, course.id, 'quiz')}
                      className={`text-xs px-3 py-1.5 rounded-md flex items-center transition-colors flex-1 sm:flex-none justify-center font-medium ${
                        isQuizActive 
                          ? 'bg-indigo-600 text-white border border-indigo-600' 
                          : 'bg-indigo-50 dark:bg-indigo-500/10 text-indigo-700 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-500/20 hover:bg-indigo-100 dark:hover:bg-indigo-500/20'
                      }`}
                    >
                      <Target className="w-3.5 h-3.5 mr-1.5 flex-shrink-0"/> Quiz Avg {course.quizAvg}
                    </button>
                    <button 
                      onClick={(e) => handleToggle(e, course.id, 'help')}
                      className={`text-xs px-3 py-1.5 rounded-md flex items-center transition-colors flex-1 sm:flex-none justify-center font-medium ${
                        isHelpActive 
                          ? 'bg-rose-600 text-white border border-rose-600' 
                          : 'bg-rose-50 dark:bg-rose-500/10 text-rose-700 dark:text-rose-400 border border-rose-200 dark:border-rose-500/20 hover:bg-rose-100 dark:hover:bg-rose-500/20'
                      }`}
                    >
                      <AlertCircle className="w-3.5 h-3.5 mr-1.5 flex-shrink-0"/> I need help
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Analytics Section */}
          <div className="bg-white dark:bg-[#12121A] border border-slate-200 dark:border-[#1E1E2A] rounded-xl p-4 sm:p-6 lg:p-8 shadow-sm dark:shadow-none">
            <h2 className="text-lg font-semibold mb-6 flex items-center text-slate-900 dark:text-white">
              <BookOpenCheck className="w-5 h-5 mr-2 text-indigo-600 dark:text-indigo-400" />
              {activeCourse.title} — Usage Analytics
            </h2>

            {/* Analytics Key Metrics */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 text-center mb-8 lg:divide-x divide-slate-200 dark:divide-[#2A2A3A] border-b border-slate-200 dark:border-[#2A2A3A] pb-8">
              <div className="p-2 bg-slate-50 dark:bg-transparent rounded-lg dark:rounded-none">
                <div className="text-2xl sm:text-3xl font-bold mb-1 text-slate-900 dark:text-white">{activeCourse.analytics.activeStudents}</div>
                <div className="text-[10px] sm:text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wider font-medium">Active Students</div>
              </div>
              <div className="p-2 bg-slate-50 dark:bg-transparent rounded-lg dark:rounded-none border-l border-slate-200 dark:border-[#2A2A3A] lg:border-l-0 lg:border-transparent">
                <div className="text-2xl sm:text-3xl font-bold mb-1 text-slate-900 dark:text-white">{activeCourse.analytics.completionRate}</div>
                <div className="text-[10px] sm:text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wider font-medium">Completion Rate</div>
              </div>
              <div className="p-2 bg-slate-50 dark:bg-transparent rounded-lg dark:rounded-none lg:border-l border-slate-200 dark:border-[#2A2A3A]">
                <div className="text-2xl sm:text-3xl font-bold mb-1 text-slate-900 dark:text-white">{activeCourse.analytics.avgQuizScore}</div>
                <div className="text-[10px] sm:text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wider font-medium">Avg Quiz Score</div>
              </div>
              <div className="p-2 bg-slate-50 dark:bg-transparent rounded-lg dark:rounded-none border-l border-slate-200 dark:border-[#2A2A3A]">
                <div className="text-2xl sm:text-3xl font-bold mb-1 text-slate-900 dark:text-white">{activeCourse.analytics.avgTimeSpent}</div>
                <div className="text-[10px] sm:text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wider font-medium">Avg Time Spent</div>
              </div>
            </div>

            {/* Middle Two Columns */}
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-8 mb-8 border-b border-slate-200 dark:border-[#2A2A3A] pb-8">
              {/* Left Column */}
              <div className="space-y-6">
                <div>
                  <div className="flex items-center text-orange-600 dark:text-orange-400 text-sm font-semibold mb-3">
                    <AlertTriangle className="w-4 h-4 mr-2" /> Highest Drop Off Point
                  </div>
                  <div className="bg-orange-50/50 dark:bg-[#1A1A24] rounded-xl p-4 sm:p-5 border border-orange-100 dark:border-[#2A2A3A]">
                    <h4 className="font-semibold text-sm mb-1 text-slate-900 dark:text-white">{activeCourse.analytics.dropOff.module}</h4>
                    <p className="text-slate-600 dark:text-slate-400 text-xs leading-relaxed">{activeCourse.analytics.dropOff.reason}</p>
                  </div>
                </div>

                <div>
                  <h3 className="text-sm font-semibold mb-4 text-slate-800 dark:text-slate-200 flex items-center gap-2">
                    <BarChart2 className="w-4 h-4 text-slate-400" /> Modules Needing Attention
                  </h3>
                  <div className="space-y-3">
                    {activeCourse.analytics.modulesAttention.map((mod, idx) => (
                      <div key={idx} className="bg-white dark:bg-[#171722] rounded-xl p-4 flex justify-between items-center border border-slate-200 dark:border-[#2A2A3A] gap-4 shadow-sm dark:shadow-none">
                        <span className="text-sm font-medium text-slate-800 dark:text-slate-200">{mod.name}</span>
                        <span className="text-rose-600 dark:text-rose-400 text-xs font-bold whitespace-nowrap bg-rose-50 dark:bg-rose-950/30 px-2 py-1 rounded-md border border-rose-100 dark:border-rose-900/30">{mod.score}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <div className="flex items-center text-rose-600 dark:text-rose-400 text-sm font-semibold mb-4">
                    <AlertCircle className="w-4 h-4 mr-2" /> Students Needing Help
                  </div>
                  <div className="space-y-3">
                    {activeCourse.analytics.studentsNeedHelp.map((student, idx) => (
                      <div key={idx} className="bg-white dark:bg-[#171722] border border-slate-200 dark:border-[#2A2A3A] rounded-xl p-4 flex items-start gap-4 shadow-sm dark:shadow-none">
                        <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-[#2A2A3A] flex items-center justify-center font-bold text-slate-600 dark:text-slate-400 text-xs flex-shrink-0">
                          {student.name.split(' ').map(n => n[0]).join('')}
                        </div>
                        <div>
                          <h4 className="font-semibold text-sm mb-1 text-slate-900 dark:text-white">{student.name}</h4>
                          <p className="text-slate-600 dark:text-slate-400 text-xs leading-relaxed">{student.issue}</p>
                        </div>
                      </div>
                    ))}
                    <div className="bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 p-4 rounded-xl">
                      <p className="text-amber-800 dark:text-amber-200 text-xs flex items-start leading-relaxed">
                        <span className="mr-2 text-base">💡</span>
                        <span><strong>Action Required:</strong> Reach out personally or assign supplementary material from the recommendations below.</span>
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Column */}
              <div className="space-y-6">
                <div>
                  <div className="flex items-center text-emerald-600 dark:text-emerald-400 text-sm font-semibold mb-4">
                    <Star className="w-4 h-4 mr-2" /> Top Performers
                  </div>
                  <div className="space-y-3 mb-4">
                    {activeCourse.analytics.topPerformers.map((performer, idx) => (
                      <div key={idx} className="bg-white dark:bg-[#171722] border border-slate-200 dark:border-[#2A2A3A] rounded-xl p-4 flex justify-between items-center shadow-sm dark:shadow-none">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-emerald-50 dark:bg-emerald-950/30 flex items-center justify-center font-bold text-emerald-600 dark:text-emerald-400 text-xs border border-emerald-100 dark:border-emerald-900/30">
                            {performer.name.split(' ').map(n => n[0]).join('')}
                          </div>
                          <span className="font-semibold text-sm text-slate-900 dark:text-white">{performer.name}</span>
                        </div>
                        <span className="text-emerald-700 dark:text-emerald-400 text-xs font-bold bg-emerald-50 dark:bg-emerald-950/30 px-2.5 py-1 rounded-md border border-emerald-100 dark:border-emerald-900/30">{performer.score}</span>
                      </div>
                    ))}
                  </div>
                  <div className="bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-200 dark:border-indigo-500/20 p-4 rounded-xl">
                    <p className="text-indigo-800 dark:text-indigo-200 text-xs flex items-start leading-relaxed">
                      <span className="mr-2 text-base">💡</span>
                      <span><strong>Peer Mentoring:</strong> Leverage top performers by pairing them with struggling students for targeted practice sessions.</span>
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Recommended Resources */}
            <div className="bg-slate-50 dark:bg-[#171722] border border-slate-200 dark:border-[#2A2A3A] rounded-xl p-5 sm:p-6 mb-8">
              <div className="flex items-center text-amber-600 dark:text-amber-500 text-sm font-bold mb-2">
                <Lightbulb className="w-5 h-5 mr-2" /> Recommended Resources
              </div>
              <p className="text-slate-500 dark:text-slate-400 text-xs mb-6 font-medium">AI-curated content based on where your students are struggling most. Assign these as prerequisites or homework.</p>
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {activeCourse.analytics.resources.map((res, idx) => (
                  <div 
                    key={idx} 
                    onClick={() => handleResourceClick(res.url)}
                    className="bg-white dark:bg-[#1A1A24] border border-slate-200 dark:border-[#2A2A3A] rounded-xl p-4 sm:p-5 hover:border-indigo-300 dark:hover:border-indigo-500/50 hover:shadow-md cursor-pointer group transition-all duration-200 flex items-start space-x-4"
                  >
                    <div className="bg-slate-50 dark:bg-[#12121A] p-2.5 rounded-lg border border-slate-100 dark:border-[#2A2A3A] flex-shrink-0 group-hover:scale-110 transition-transform">
                      {res.type === 'video' ? (
                        <PlaySquare className="w-5 h-5 text-rose-500" />
                      ) : (
                        <FileText className="w-5 h-5 text-blue-500 dark:text-blue-400" />
                      )}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-start mb-1.5 gap-2">
                        <h4 className="font-semibold text-sm text-slate-900 dark:text-slate-200 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors line-clamp-1">{res.title}</h4>
                        <ExternalLink className="w-4 h-4 text-slate-400 dark:text-slate-600 group-hover:text-indigo-500 dark:group-hover:text-indigo-400 flex-shrink-0" />
                      </div>
                      <div className="text-[11px] font-medium text-slate-500 mb-3 bg-slate-100 dark:bg-[#2A2A3A] inline-block px-2 py-0.5 rounded uppercase tracking-wider">{res.source}</div>
                      <div className="text-xs text-slate-600 dark:text-slate-400 flex items-start sm:items-center">
                        <BarChart2 className="w-3.5 h-3.5 mr-1.5 mt-0.5 sm:mt-0 text-indigo-500 flex-shrink-0" />
                        <span className="line-clamp-2 sm:line-clamp-1">{res.insight}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Your Published Content */}
            <div className="bg-white dark:bg-[#171722] border border-slate-200 dark:border-[#2A2A3A] rounded-xl p-5 sm:p-6 shadow-sm dark:shadow-none">
              <div className="flex items-center text-indigo-600 dark:text-indigo-400 text-sm font-bold mb-2">
                <BookOpen className="w-5 h-5 mr-2" /> Your Published Content
              </div>
              <p className="text-slate-500 dark:text-slate-400 text-xs mb-6 font-medium">Blogs and materials created for your students — track readership and impact.</p>
              
              <div className="space-y-3">
                {publishedContentData.map((item, idx) => {
                  const IconComponent = item.icon;
                  return (
                    <div key={idx} className="bg-slate-50 dark:bg-[#1A1A24] border border-slate-200 dark:border-[#2A2A3A] rounded-xl p-4 sm:p-5 flex flex-col sm:flex-row justify-between sm:items-center gap-4 cursor-pointer hover:border-slate-300 dark:hover:border-slate-600 hover:shadow-sm transition-all duration-200">
                      <div className="flex items-center space-x-4">
                        <div className="p-2.5 bg-white dark:bg-[#12121A] border border-slate-200 dark:border-[#2A2A3A] rounded-lg flex-shrink-0">
                          <IconComponent className="w-5 h-5 text-indigo-500 dark:text-indigo-400" />
                        </div>
                        <div>
                          <h4 className="font-semibold text-sm text-slate-900 dark:text-slate-200">{item.title}</h4>
                          <div className="text-[11px] font-medium text-slate-500 mt-1">{item.meta}</div>
                        </div>
                      </div>
                      <div className="flex items-center justify-between sm:justify-end space-x-4 w-full sm:w-auto mt-2 sm:mt-0 pt-3 sm:pt-0 border-t border-slate-200 dark:border-transparent sm:border-0">
                        <span className="bg-indigo-50 dark:bg-indigo-950/30 border border-indigo-100 dark:border-indigo-900/50 px-3 py-1.5 rounded-md text-xs font-bold text-indigo-700 dark:text-indigo-400 tracking-wide">
                          {item.reads} READS
                        </span>
                        <Eye className="w-4 h-4 text-slate-400 hover:text-indigo-500 transition-colors" />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

          </div>
        </main>
      </div>

      {/* --- MODALS --- */}

      {/* 1. Create Course Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex justify-center items-center sm:items-start sm:pt-10 bg-black/40 dark:bg-black/80 backdrop-blur-sm overflow-y-auto p-4 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-[#0A0A0F] border border-slate-200 dark:border-[#1E1E2A] rounded-2xl w-full max-w-4xl p-6 sm:p-8 my-auto sm:my-0 shadow-2xl relative max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6 sticky top-0 bg-white dark:bg-[#0A0A0F] pb-4 z-10 border-b border-slate-100 dark:border-[#1E1E2A]">
              <h2 className="text-xl font-bold flex items-center text-slate-900 dark:text-white">
                <Plus className="w-5 h-5 mr-2 text-indigo-600 dark:text-indigo-500" /> New Course
              </h2>
              <button onClick={() => setIsCreateModalOpen(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-white transition-colors bg-slate-100 dark:bg-[#1A1A24] p-2 rounded-full sm:p-0 sm:bg-transparent">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-6">
              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Course Title</label>
                <input type="text" placeholder="e.g. IELTS Writing Masterclass" className="w-full bg-slate-50 dark:bg-[#12121A] border border-slate-300 dark:border-[#2A2A3A] rounded-lg p-3 text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-slate-900 dark:text-white transition-colors" />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Description</label>
                <textarea placeholder="What will students learn?" rows={3} className="w-full bg-slate-50 dark:bg-[#12121A] border border-slate-300 dark:border-[#2A2A3A] rounded-lg p-3 text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-slate-900 dark:text-white resize-none transition-colors" />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3">Category</label>
                <div className="flex flex-wrap gap-2 sm:gap-3">
                  {['IELTS', 'Spoken English', 'Tech Prep', 'General'].map(cat => (
                    <button 
                      key={cat}
                      onClick={() => setSelectedCategory(cat)}
                      className={`px-4 py-2 rounded-full text-xs font-bold border transition-colors ${
                        selectedCategory === cat 
                          ? 'bg-indigo-100 dark:bg-indigo-600/20 text-indigo-700 dark:text-indigo-400 border-indigo-300 dark:border-indigo-500/50' 
                          : 'bg-white dark:bg-[#12121A] text-slate-600 dark:text-slate-400 border-slate-200 dark:border-[#2A2A3A] hover:border-slate-300 dark:hover:border-slate-600'
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>

              <div className="pt-6 border-t border-slate-200 dark:border-[#1E1E2A]">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-300">Modules Configuration</h3>
                  <button className="text-xs font-bold flex items-center text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 bg-indigo-50 dark:bg-transparent px-3 py-1.5 rounded-md sm:p-0 transition-colors">
                    <Plus className="w-3.5 h-3.5 mr-1" /> Add Module
                  </button>
                </div>

                <div className="bg-slate-50 dark:bg-[#12121A] border border-slate-200 dark:border-[#2A2A3A] rounded-xl p-4 sm:p-5 space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">Module 1</h4>
                  </div>
                  <input type="text" placeholder="Module title" className="w-full bg-white dark:bg-[#1A1A24] border border-slate-300 dark:border-[#2A2A3A] rounded-lg p-3 text-sm focus:outline-none focus:border-indigo-500 text-slate-900 dark:text-white transition-colors" />
                  <textarea placeholder="Module content (supports Markdown formatting)" rows={4} className="w-full bg-white dark:bg-[#1A1A24] border border-slate-300 dark:border-[#2A2A3A] rounded-lg p-3 text-sm focus:outline-none focus:border-indigo-500 text-slate-900 dark:text-white resize-none transition-colors" />
                  
                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 pt-2">
                    <div className="flex items-center bg-white dark:bg-[#1A1A24] border border-slate-300 dark:border-[#2A2A3A] rounded-lg px-3 py-2 w-full sm:w-auto">
                      <Clock className="w-4 h-4 text-slate-400 dark:text-slate-500 mr-2" />
                      <input type="number" defaultValue={10} className="w-16 bg-transparent text-sm focus:outline-none text-slate-900 dark:text-white font-medium" />
                      <span className="text-xs font-medium text-slate-500 ml-1">min duration</span>
                    </div>
                    <button 
                      onClick={() => setIsQuizModalOpen(true)}
                      className="flex-1 bg-indigo-50 dark:bg-indigo-500/10 hover:bg-indigo-100 dark:hover:bg-indigo-500/20 text-indigo-700 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-500/20 py-2.5 sm:py-2 rounded-lg text-sm font-bold flex items-center justify-center transition-colors"
                    >
                      <Target className="w-4 h-4 mr-2" /> Add Assessment (Quiz/Flashcards)
                    </button>
                  </div>
                </div>
              </div>

              <div className="pt-4">
                <button className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-3.5 sm:py-3 rounded-xl font-bold flex items-center justify-center transition-colors shadow-md shadow-indigo-600/20">
                  Save & Publish Course
                </button>
              </div>

            </div>
          </div>
        </div>
      )}

      {/* 2. Nested Add Quiz & Flashcards Modal */}
      {isQuizModalOpen && (
        <div className="fixed inset-0 z-[60] flex justify-center items-center bg-black/50 dark:bg-black/80 backdrop-blur-md p-4 animate-in zoom-in-95 duration-200">
          <div className="bg-white dark:bg-[#12121A] border border-slate-200 dark:border-[#2A2A3A] rounded-2xl w-full max-w-3xl shadow-2xl overflow-hidden flex flex-col max-h-[95vh] sm:max-h-[85vh]">
            
            <div className="flex justify-between items-center p-4 sm:p-6 border-b border-slate-200 dark:border-[#1E1E2A] bg-slate-50 dark:bg-[#0A0A0F]">
              <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center">
                <Target className="w-5 h-5 mr-2 text-indigo-600 dark:text-indigo-400" />
                Assessment Builder
              </h2>
              <button onClick={() => setIsQuizModalOpen(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-white transition-colors bg-white dark:bg-[#1A1A24] border border-slate-200 dark:border-transparent p-2 rounded-full sm:p-0 sm:bg-transparent sm:border-none">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 sm:p-6 overflow-y-auto space-y-8 flex-1">
              
              {/* Quiz Questions Section */}
              <div>
                <h3 className="text-sm font-bold text-slate-800 dark:text-slate-300 mb-4 flex items-center border-b border-slate-100 dark:border-[#1E1E2A] pb-2">
                  <BookOpenCheck className="w-4 h-4 mr-2 text-emerald-500" /> Quiz Questions
                </h3>
                <div className="space-y-6">
                  {quizQuestions.map((q, index) => (
                    <div key={q.id} className="bg-slate-50 dark:bg-[#1A1A24] border border-slate-200 dark:border-[#2A2A3A] rounded-xl p-4 sm:p-5 space-y-4 relative group">
                      <div className="absolute top-3 right-3 text-[10px] text-slate-500 font-bold bg-white dark:bg-[#12121A] border border-slate-200 dark:border-[#2A2A3A] px-2 py-1 rounded shadow-sm">Q{index + 1}</div>
                      
                      <div>
                        <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">Question Prompt</label>
                        <input type="text" placeholder="Enter the question text here..." className="w-full pr-10 bg-white dark:bg-[#12121A] border border-slate-300 dark:border-[#2A2A3A] rounded-lg p-3 text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-slate-900 dark:text-white transition-colors" />
                      </div>
                      
                      <div>
                        <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">Answers (Select Correct)</label>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          {['Option 1', 'Option 2', 'Option 3', 'Option 4'].map((opt, i) => (
                            <div key={i} className="flex items-center space-x-3 bg-white dark:bg-[#12121A] border border-slate-300 dark:border-[#2A2A3A] rounded-lg p-2.5 focus-within:border-indigo-500 focus-within:ring-1 focus-within:ring-indigo-500 transition-all">
                              <input type="radio" name={`correctOption-${q.id}`} className="accent-indigo-600 dark:accent-indigo-500 w-4 h-4 cursor-pointer ml-1" />
                              <input type="text" placeholder={opt} className="bg-transparent text-sm w-full focus:outline-none text-slate-900 dark:text-white" />
                            </div>
                          ))}
                        </div>
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">Explanation (Optional)</label>
                        <input type="text" placeholder="Why is this answer correct?" className="w-full bg-white dark:bg-[#12121A] border border-slate-300 dark:border-[#2A2A3A] rounded-lg p-3 text-sm focus:outline-none focus:border-indigo-500 text-slate-900 dark:text-white transition-colors text-slate-500 italic" />
                      </div>
                    </div>
                  ))}
                </div>
                
                <button 
                  onClick={handleAddQuestion}
                  className="mt-4 text-xs text-indigo-600 dark:text-indigo-400 font-bold flex items-center justify-center w-full sm:w-auto hover:text-indigo-700 dark:hover:text-indigo-300 transition-colors bg-indigo-50 dark:bg-indigo-900/20 border border-dashed border-indigo-200 dark:border-indigo-700/50 px-4 py-3 rounded-xl"
                >
                  <Plus className="w-4 h-4 mr-1" /> Add Another Question
                </button>
              </div>

              {/* Flashcards Section */}
              <div className="pt-8">
                <h3 className="text-sm font-bold text-slate-800 dark:text-slate-300 mb-4 flex items-center border-b border-slate-100 dark:border-[#1E1E2A] pb-2">
                  <BookOpen className="w-4 h-4 mr-2 text-amber-500" /> Flashcards
                </h3>
                <div className="space-y-6 sm:space-y-4">
                  {flashcards.map((f, index) => (
                    <div key={f.id} className="flex flex-col sm:flex-row gap-4 sm:space-x-4 relative bg-slate-50 dark:bg-transparent p-4 sm:p-0 rounded-xl sm:rounded-none border border-slate-200 dark:border-transparent sm:border-none">
                      <div className="hidden sm:flex absolute -left-8 top-3 w-6 h-6 rounded-full bg-slate-100 dark:bg-[#1A1A24] border border-slate-200 dark:border-[#2A2A3A] items-center justify-center text-[10px] text-slate-500 font-bold">{index + 1}</div>
                      <div className="sm:hidden text-xs text-slate-500 font-bold mb-[-10px] uppercase tracking-wider">Card {index + 1}</div>
                      
                      <div className="w-full sm:w-1/2">
                        <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1 sm:hidden">Front</label>
                        <textarea placeholder="Front (Term/Question)" rows={3} className="w-full bg-white dark:bg-[#1A1A24] border border-slate-300 dark:border-[#2A2A3A] rounded-lg p-3 text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-slate-900 dark:text-white resize-none transition-colors" />
                      </div>
                      
                      <div className="w-full sm:w-1/2">
                        <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1 sm:hidden">Back</label>
                        <textarea placeholder="Back (Definition/Answer)" rows={3} className="w-full bg-white dark:bg-[#1A1A24] border border-slate-300 dark:border-[#2A2A3A] rounded-lg p-3 text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-slate-900 dark:text-white resize-none transition-colors" />
                      </div>
                    </div>
                  ))}
                </div>
                <button 
                  onClick={handleAddFlashcard}
                  className="mt-6 sm:mt-4 text-xs text-indigo-600 dark:text-indigo-400 font-bold flex items-center justify-center w-full sm:w-auto hover:text-indigo-700 dark:hover:text-indigo-300 transition-colors bg-indigo-50 dark:bg-indigo-900/20 border border-dashed border-indigo-200 dark:border-indigo-700/50 px-4 py-3 rounded-xl"
                >
                  <Plus className="w-4 h-4 mr-1" /> Add Another Flashcard
                </button>
              </div>

            </div>

            <div className="p-4 sm:p-6 border-t border-slate-200 dark:border-[#1E1E2A] bg-slate-50 dark:bg-[#0A0A0F]">
              <button 
                onClick={() => setIsQuizModalOpen(false)}
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-3.5 sm:py-3 rounded-xl font-bold transition-colors shadow-md shadow-indigo-600/20"
              >
                Save Assessment Configuration
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}