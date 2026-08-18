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
    <div className="min-h-screen bg-brand-bg font-plex text-brand-text antialiased">

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
              <h1 className="text-2xl sm:text-3xl font-bold mb-1 text-brand-text">Course Management</h1>
              <p className="text-brand-text-mute text-sm">Monitor student engagement, identify drop-off points, and discover resources.</p>
            </div>

            <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
              <div className="relative flex-1 md:flex-none">
                <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-brand-text-mute" />
                <input
                  type="text"
                  placeholder="Search specific courses..."
                  className="w-full md:w-64 bg-white border border-brand-line text-sm rounded-md pl-10 pr-4 py-2 focus:outline-none focus:border-brand-teal-500 focus:ring-1 focus:ring-brand-teal-500 text-brand-text transition-colors shadow-sm"
                />
              </div>
              <button
                onClick={() => setIsCreateModalOpen(true)}
                className="w-full md:w-auto bg-brand-teal-600 hover:bg-brand-teal-700 text-white px-4 py-2 rounded-md text-sm font-medium flex items-center justify-center transition-colors shadow-sm md:hidden lg:flex"
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
                  className={`bg-white border rounded-xl p-5 cursor-pointer transition-all duration-200 shadow-sm ${
                    selectedCourseId === course.id
                      ? 'border-brand-teal-500 ring-1 ring-brand-teal-500/50'
                      : 'border-brand-line hover:border-brand-teal-200'
                  }`}
                >
                  <div className="flex justify-between items-start mb-3 gap-2">
                    <h3 className="font-semibold text-base leading-tight flex-1 text-brand-text">{course.title}</h3>
                    <div className="flex items-center text-amber-600 bg-amber-50 px-2 py-1 rounded text-xs font-bold whitespace-nowrap border border-amber-200/50">
                      <Star className="w-3 h-3 mr-1 fill-current" />
                      {course.rating}
                    </div>
                  </div>
                  <p className="text-brand-text-mute text-xs mb-4 line-clamp-2 h-8 leading-relaxed">{course.description}</p>

                  <div className="flex flex-wrap items-center gap-4 text-xs text-brand-text-mute mb-4 font-medium">
                    <div className="flex items-center bg-brand-bg-alt px-2 py-1 rounded-md border border-brand-line"><Users className="w-3.5 h-3.5 mr-1.5 text-brand-teal-500"/> {course.students}</div>
                    <div className="flex items-center bg-brand-bg-alt px-2 py-1 rounded-md border border-brand-line"><BookOpen className="w-3.5 h-3.5 mr-1.5 text-emerald-500"/> {course.modules} modules</div>
                  </div>

                  <div className="mb-5">
                    <div className="flex justify-between text-xs text-brand-text-mute mb-1.5 font-medium">
                      <span>Completion</span>
                      <span>{course.completionWidth}</span>
                    </div>
                    <div className="w-full bg-brand-bg-alt rounded-full h-1.5 overflow-hidden">
                      <div className="bg-brand-teal-500 h-1.5 rounded-full" style={{ width: course.completionWidth }}></div>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2 sm:gap-3 border-t border-brand-line pt-4 mt-auto">
                    {/* <button
                      onClick={(e) => handleToggle(e, course.id, 'quiz')}
                      className={`text-xs px-3 py-1.5 rounded-md flex items-center transition-colors flex-1 sm:flex-none justify-center font-medium ${
                        isQuizActive
                          ? 'bg-brand-teal-600 text-white border border-brand-teal-600'
                          : 'bg-brand-teal-50 text-brand-teal-700 border border-brand-teal-200 hover:bg-brand-teal-100'
                      }`}
                    >
                      <Target className="w-3.5 h-3.5 mr-1.5 flex-shrink-0"/> Quiz Avg {course.quizAvg}
                    </button>
                    <button
                      onClick={(e) => handleToggle(e, course.id, 'help')}
                      className={`text-xs px-3 py-1.5 rounded-md flex items-center transition-colors flex-1 sm:flex-none justify-center font-medium ${
                        isHelpActive
                          ? 'bg-rose-600 text-white border border-rose-600'
                          : 'bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100'
                      }`}
                    >
                      <AlertCircle className="w-3.5 h-3.5 mr-1.5 flex-shrink-0"/> I need help
                    </button> */}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Analytics Section */}
          <div className="bg-white border border-brand-line rounded-xl p-4 sm:p-6 lg:p-8 shadow-sm">
            <h2 className="text-lg font-semibold mb-6 flex items-center text-brand-text">
              <BookOpenCheck className="w-5 h-5 mr-2 text-brand-teal-600" />
              {activeCourse.title} — Usage Analytics
            </h2>

            {/* Analytics Key Metrics */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 text-center mb-8 lg:divide-x divide-brand-line border-b border-brand-line pb-8">
              <div className="p-2 bg-brand-bg-alt rounded-lg">
                <div className="text-2xl sm:text-3xl font-bold mb-1 text-brand-text">{activeCourse.analytics.activeStudents}</div>
                <div className="text-[10px] sm:text-xs text-brand-text-mute uppercase tracking-wider font-medium font-jetbrains">Active Students</div>
              </div>
              <div className="p-2 bg-brand-bg-alt rounded-lg border-l border-brand-line lg:border-l-0 lg:border-transparent">
                <div className="text-2xl sm:text-3xl font-bold mb-1 text-brand-text">{activeCourse.analytics.completionRate}</div>
                <div className="text-[10px] sm:text-xs text-brand-text-mute uppercase tracking-wider font-medium font-jetbrains">Completion Rate</div>
              </div>
              <div className="p-2 bg-brand-bg-alt rounded-lg lg:border-l border-brand-line">
                <div className="text-2xl sm:text-3xl font-bold mb-1 text-brand-text">{activeCourse.analytics.avgQuizScore}</div>
                <div className="text-[10px] sm:text-xs text-brand-text-mute uppercase tracking-wider font-medium font-jetbrains">Avg Quiz Score</div>
              </div>
              <div className="p-2 bg-brand-bg-alt rounded-lg border-l border-brand-line">
                <div className="text-2xl sm:text-3xl font-bold mb-1 text-brand-text">{activeCourse.analytics.avgTimeSpent}</div>
                <div className="text-[10px] sm:text-xs text-brand-text-mute uppercase tracking-wider font-medium font-jetbrains">Avg Time Spent</div>
              </div>
            </div>

            {/* Middle Two Columns */}
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-8 mb-8 border-b border-brand-line pb-8">
              {/* Left Column */}
              <div className="space-y-6">
                <div>
                  <div className="flex items-center text-orange-600 text-sm font-semibold mb-3">
                    <AlertTriangle className="w-4 h-4 mr-2" /> Highest Drop Off Point
                  </div>
                  <div className="bg-orange-50/50 rounded-xl p-4 sm:p-5 border border-orange-100">
                    <h4 className="font-semibold text-sm mb-1 text-brand-text">{activeCourse.analytics.dropOff.module}</h4>
                    <p className="text-brand-text-mute text-xs leading-relaxed">{activeCourse.analytics.dropOff.reason}</p>
                  </div>
                </div>

                <div>
                  <h3 className="text-sm font-semibold mb-4 text-brand-text flex items-center gap-2">
                    <BarChart2 className="w-4 h-4 text-brand-text-mute" /> Modules Needing Attention
                  </h3>
                  <div className="space-y-3">
                    {activeCourse.analytics.modulesAttention.map((mod, idx) => (
                      <div key={idx} className="bg-white rounded-xl p-4 flex justify-between items-center border border-brand-line gap-4 shadow-sm">
                        <span className="text-sm font-medium text-brand-text">{mod.name}</span>
                        <span className="text-rose-600 text-xs font-bold whitespace-nowrap bg-rose-50 px-2 py-1 rounded-md border border-rose-100">{mod.score}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <div className="flex items-center text-rose-600 text-sm font-semibold mb-4">
                    <AlertCircle className="w-4 h-4 mr-2" /> Students Needing Help
                  </div>
                  <div className="space-y-3">
                    {activeCourse.analytics.studentsNeedHelp.map((student, idx) => (
                      <div key={idx} className="bg-white border border-brand-line rounded-xl p-4 flex items-start gap-4 shadow-sm">
                        <div className="w-8 h-8 rounded-full bg-brand-bg-alt flex items-center justify-center font-bold text-brand-text-mute text-xs flex-shrink-0">
                          {student.name.split(' ').map(n => n[0]).join('')}
                        </div>
                        <div>
                          <h4 className="font-semibold text-sm mb-1 text-brand-text">{student.name}</h4>
                          <p className="text-brand-text-mute text-xs leading-relaxed">{student.issue}</p>
                        </div>
                      </div>
                    ))}
                    <div className="bg-amber-50 border border-amber-200 p-4 rounded-xl">
                      <p className="text-amber-800 text-xs flex items-start leading-relaxed">
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
                  <div className="flex items-center text-emerald-600 text-sm font-semibold mb-4">
                    <Star className="w-4 h-4 mr-2" /> Top Performers
                  </div>
                  <div className="space-y-3 mb-4">
                    {activeCourse.analytics.topPerformers.map((performer, idx) => (
                      <div key={idx} className="bg-white border border-brand-line rounded-xl p-4 flex justify-between items-center shadow-sm">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-emerald-50 flex items-center justify-center font-bold text-emerald-600 text-xs border border-emerald-100">
                            {performer.name.split(' ').map(n => n[0]).join('')}
                          </div>
                          <span className="font-semibold text-sm text-brand-text">{performer.name}</span>
                        </div>
                        <span className="text-emerald-700 text-xs font-bold bg-emerald-50 px-2.5 py-1 rounded-md border border-emerald-100">{performer.score}</span>
                      </div>
                    ))}
                  </div>
                  <div className="bg-brand-teal-50 border border-brand-teal-200 p-4 rounded-xl">
                    <p className="text-brand-teal-800 text-xs flex items-start leading-relaxed">
                      <span className="mr-2 text-base">💡</span>
                      <span><strong>Peer Mentoring:</strong> Leverage top performers by pairing them with struggling students for targeted practice sessions.</span>
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Recommended Resources */}
            <div className="bg-brand-bg-alt border border-brand-line rounded-xl p-5 sm:p-6 mb-8">
              <div className="flex items-center text-amber-600 text-sm font-bold mb-2">
                <Lightbulb className="w-5 h-5 mr-2" /> Recommended Resources
              </div>
              <p className="text-brand-text-mute text-xs mb-6 font-medium">AI-curated content based on where your students are struggling most. Assign these as prerequisites or homework.</p>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {activeCourse.analytics.resources.map((res, idx) => (
                  <div
                    key={idx}
                    onClick={() => handleResourceClick(res.url)}
                    className="bg-white border border-brand-line rounded-xl p-4 sm:p-5 hover:border-brand-teal-300 hover:shadow-md cursor-pointer group transition-all duration-200 flex items-start space-x-4"
                  >
                    <div className="bg-brand-bg-alt p-2.5 rounded-lg border border-brand-line flex-shrink-0 group-hover:scale-110 transition-transform">
                      {res.type === 'video' ? (
                        <PlaySquare className="w-5 h-5 text-rose-500" />
                      ) : (
                        <FileText className="w-5 h-5 text-brand-blue-500" />
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-start mb-1.5 gap-2">
                        <h4 className="font-semibold text-sm text-brand-text group-hover:text-brand-teal-600 transition-colors line-clamp-1">{res.title}</h4>
                        <ExternalLink className="w-4 h-4 text-brand-text-mute group-hover:text-brand-teal-500 flex-shrink-0" />
                      </div>
                      <div className="text-[11px] font-medium text-brand-text-mute mb-3 bg-brand-bg-alt inline-block px-2 py-0.5 rounded uppercase tracking-wider font-jetbrains">{res.source}</div>
                      <div className="text-xs text-brand-text-mute flex items-start sm:items-center">
                        <BarChart2 className="w-3.5 h-3.5 mr-1.5 mt-0.5 sm:mt-0 text-brand-teal-500 flex-shrink-0" />
                        <span className="line-clamp-2 sm:line-clamp-1">{res.insight}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Your Published Content */}
            <div className="bg-white border border-brand-line rounded-xl p-5 sm:p-6 shadow-sm">
              <div className="flex items-center text-brand-teal-600 text-sm font-bold mb-2">
                <BookOpen className="w-5 h-5 mr-2" /> Your Published Content
              </div>
              <p className="text-brand-text-mute text-xs mb-6 font-medium">Blogs and materials created for your students — track readership and impact.</p>

              <div className="space-y-3">
                {publishedContentData.map((item, idx) => {
                  const IconComponent = item.icon;
                  return (
                    <div key={idx} className="bg-brand-bg-alt border border-brand-line rounded-xl p-4 sm:p-5 flex flex-col sm:flex-row justify-between sm:items-center gap-4 cursor-pointer hover:border-brand-teal-200 hover:shadow-sm transition-all duration-200">
                      <div className="flex items-center space-x-4">
                        <div className="p-2.5 bg-white border border-brand-line rounded-lg flex-shrink-0">
                          <IconComponent className="w-5 h-5 text-brand-teal-500" />
                        </div>
                        <div>
                          <h4 className="font-semibold text-sm text-brand-text">{item.title}</h4>
                          <div className="text-[11px] font-medium text-brand-text-mute mt-1">{item.meta}</div>
                        </div>
                      </div>
                      <div className="flex items-center justify-between sm:justify-end space-x-4 w-full sm:w-auto mt-2 sm:mt-0 pt-3 sm:pt-0 border-t border-brand-line sm:border-0">
                        <span className="bg-brand-teal-50 border border-brand-teal-100 px-3 py-1.5 rounded-md text-xs font-bold text-brand-teal-700 tracking-wide">
                          {item.reads} READS
                        </span>
                        <Eye className="w-4 h-4 text-brand-text-mute hover:text-brand-teal-500 transition-colors" />
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
        <div className="fixed inset-0 z-50 flex justify-center items-center sm:items-start sm:pt-10 bg-black/40 backdrop-blur-sm overflow-y-auto p-4 animate-in fade-in duration-200">
          <div className="bg-white border border-brand-line rounded-2xl w-full max-w-4xl p-6 sm:p-8 my-auto sm:my-0 shadow-2xl relative max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6 sticky top-0 bg-white pb-4 z-10 border-b border-brand-line">
              <h2 className="text-xl font-bold flex items-center text-brand-text">
                <Plus className="w-5 h-5 mr-2 text-brand-teal-600" /> New Course
              </h2>
              <button onClick={() => setIsCreateModalOpen(false)} className="text-brand-text-mute hover:text-brand-text transition-colors bg-brand-bg-alt p-2 rounded-full sm:p-0 sm:bg-transparent">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-6">
              <div>
                <label className="block text-sm font-semibold text-brand-text mb-2">Course Title</label>
                <input type="text" placeholder="e.g. IELTS Writing Masterclass" className="w-full bg-brand-bg-alt border border-brand-line rounded-lg p-3 text-sm focus:outline-none focus:border-brand-teal-500 focus:ring-1 focus:ring-brand-teal-500 text-brand-text transition-colors" />
              </div>

              <div>
                <label className="block text-sm font-semibold text-brand-text mb-2">Description</label>
                <textarea placeholder="What will students learn?" rows={3} className="w-full bg-brand-bg-alt border border-brand-line rounded-lg p-3 text-sm focus:outline-none focus:border-brand-teal-500 focus:ring-1 focus:ring-brand-teal-500 text-brand-text resize-none transition-colors" />
              </div>

              <div>
                <label className="block text-sm font-semibold text-brand-text mb-3">Category</label>
                <div className="flex flex-wrap gap-2 sm:gap-3">
                  {['IELTS', 'Spoken English', 'Tech Prep', 'General'].map(cat => (
                    <button
                      key={cat}
                      onClick={() => setSelectedCategory(cat)}
                      className={`px-4 py-2 rounded-full text-xs font-bold border transition-colors ${
                        selectedCategory === cat
                          ? 'bg-brand-teal-100 text-brand-teal-700 border-brand-teal-300'
                          : 'bg-white text-brand-text-mute border-brand-line hover:border-brand-teal-200'
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>

              <div className="pt-6 border-t border-brand-line">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-sm font-semibold text-brand-text">Modules Configuration</h3>
                  <button className="text-xs font-bold flex items-center text-brand-teal-600 hover:text-brand-teal-700 bg-brand-teal-50 px-3 py-1.5 rounded-md sm:p-0 transition-colors">
                    <Plus className="w-3.5 h-3.5 mr-1" /> Add Module
                  </button>
                </div>

                <div className="bg-brand-bg-alt border border-brand-line rounded-xl p-4 sm:p-5 space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="font-jetbrains text-[11px] font-bold text-brand-text-mute uppercase tracking-widest">Module 1</h4>
                  </div>
                  <input type="text" placeholder="Module title" className="w-full bg-white border border-brand-line rounded-lg p-3 text-sm focus:outline-none focus:border-brand-teal-500 text-brand-text transition-colors" />
                  <textarea placeholder="Module content (supports Markdown formatting)" rows={4} className="w-full bg-white border border-brand-line rounded-lg p-3 text-sm focus:outline-none focus:border-brand-teal-500 text-brand-text resize-none transition-colors" />

                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 pt-2">
                    <div className="flex items-center bg-white border border-brand-line rounded-lg px-3 py-2 w-full sm:w-auto">
                      <Clock className="w-4 h-4 text-brand-text-mute mr-2" />
                      <input type="number" defaultValue={10} className="w-16 bg-transparent text-sm focus:outline-none text-brand-text font-medium" />
                      <span className="text-xs font-medium text-brand-text-mute ml-1">min duration</span>
                    </div>
                    <button
                      onClick={() => setIsQuizModalOpen(true)}
                      className="flex-1 bg-brand-teal-50 hover:bg-brand-teal-100 text-brand-teal-700 border border-brand-teal-200 py-2.5 sm:py-2 rounded-lg text-sm font-bold flex items-center justify-center transition-colors"
                    >
                      <Target className="w-4 h-4 mr-2" /> Add Assessment (Quiz/Flashcards)
                    </button>
                  </div>
                </div>
              </div>

              <div className="pt-4">
                <button className="w-full bg-brand-teal-600 hover:bg-brand-teal-700 text-white py-3.5 sm:py-3 rounded-xl font-bold flex items-center justify-center transition-colors shadow-md shadow-brand-teal-600/20">
                  Save & Publish Course
                </button>
              </div>

            </div>
          </div>
        </div>
      )}

      {/* 2. Nested Add Quiz & Flashcards Modal */}
      {isQuizModalOpen && (
        <div className="fixed inset-0 z-[60] flex justify-center items-center bg-black/50 backdrop-blur-md p-4 animate-in zoom-in-95 duration-200">
          <div className="bg-white border border-brand-line rounded-2xl w-full max-w-3xl shadow-2xl overflow-hidden flex flex-col max-h-[95vh] sm:max-h-[85vh]">

            <div className="flex justify-between items-center p-4 sm:p-6 border-b border-brand-line bg-brand-bg-alt">
              <h2 className="text-lg font-bold text-brand-text flex items-center">
                <Target className="w-5 h-5 mr-2 text-brand-teal-600" />
                Assessment Builder
              </h2>
              <button onClick={() => setIsQuizModalOpen(false)} className="text-brand-text-mute hover:text-brand-text transition-colors bg-white border border-brand-line p-2 rounded-full sm:p-0 sm:bg-transparent sm:border-none">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 sm:p-6 overflow-y-auto space-y-8 flex-1">

              {/* Quiz Questions Section */}
              <div>
                <h3 className="text-sm font-bold text-brand-text mb-4 flex items-center border-b border-brand-line pb-2">
                  <BookOpenCheck className="w-4 h-4 mr-2 text-emerald-500" /> Quiz Questions
                </h3>
                <div className="space-y-6">
                  {quizQuestions.map((q, index) => (
                    <div key={q.id} className="bg-brand-bg-alt border border-brand-line rounded-xl p-4 sm:p-5 space-y-4 relative group">
                      <div className="absolute top-3 right-3 text-[10px] text-brand-text-mute font-bold bg-white border border-brand-line px-2 py-1 rounded shadow-sm">Q{index + 1}</div>

                      <div>
                        <label className="block text-[11px] font-bold text-brand-text-mute uppercase tracking-wider mb-1 font-jetbrains">Question Prompt</label>
                        <input type="text" placeholder="Enter the question text here..." className="w-full pr-10 bg-white border border-brand-line rounded-lg p-3 text-sm focus:outline-none focus:border-brand-teal-500 focus:ring-1 focus:ring-brand-teal-500 text-brand-text transition-colors" />
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold text-brand-text-mute uppercase tracking-wider mb-2 font-jetbrains">Answers (Select Correct)</label>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          {['Option 1', 'Option 2', 'Option 3', 'Option 4'].map((opt, i) => (
                            <div key={i} className="flex items-center space-x-3 bg-white border border-brand-line rounded-lg p-2.5 focus-within:border-brand-teal-500 focus-within:ring-1 focus-within:ring-brand-teal-500 transition-all">
                              <input type="radio" name={`correctOption-${q.id}`} className="accent-brand-teal-600 w-4 h-4 cursor-pointer ml-1" />
                              <input type="text" placeholder={opt} className="bg-transparent text-sm w-full focus:outline-none text-brand-text" />
                            </div>
                          ))}
                        </div>
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold text-brand-text-mute uppercase tracking-wider mb-1 font-jetbrains">Explanation (Optional)</label>
                        <input type="text" placeholder="Why is this answer correct?" className="w-full bg-white border border-brand-line rounded-lg p-3 text-sm focus:outline-none focus:border-brand-teal-500 text-brand-text-mute italic transition-colors" />
                      </div>
                    </div>
                  ))}
                </div>

                <button
                  onClick={handleAddQuestion}
                  className="mt-4 text-xs text-brand-teal-600 font-bold flex items-center justify-center w-full sm:w-auto hover:text-brand-teal-700 transition-colors bg-brand-teal-50 border border-dashed border-brand-teal-200 px-4 py-3 rounded-xl"
                >
                  <Plus className="w-4 h-4 mr-1" /> Add Another Question
                </button>
              </div>

              {/* Flashcards Section */}
              <div className="pt-8">
                <h3 className="text-sm font-bold text-brand-text mb-4 flex items-center border-b border-brand-line pb-2">
                  <BookOpen className="w-4 h-4 mr-2 text-amber-500" /> Flashcards
                </h3>
                <div className="space-y-6 sm:space-y-4">
                  {flashcards.map((f, index) => (
                    <div key={f.id} className="flex flex-col sm:flex-row gap-4 sm:space-x-4 relative bg-brand-bg-alt p-4 sm:p-0 rounded-xl sm:rounded-none border border-brand-line sm:border-none">
                      <div className="hidden sm:flex absolute -left-8 top-3 w-6 h-6 rounded-full bg-brand-bg-alt border border-brand-line items-center justify-center text-[10px] text-brand-text-mute font-bold">{index + 1}</div>
                      <div className="sm:hidden text-xs text-brand-text-mute font-bold mb-[-10px] uppercase tracking-wider font-jetbrains">Card {index + 1}</div>

                      <div className="w-full sm:w-1/2">
                        <label className="block text-[10px] font-bold text-brand-text-mute uppercase tracking-wider mb-1 sm:hidden font-jetbrains">Front</label>
                        <textarea placeholder="Front (Term/Question)" rows={3} className="w-full bg-white border border-brand-line rounded-lg p-3 text-sm focus:outline-none focus:border-brand-teal-500 focus:ring-1 focus:ring-brand-teal-500 text-brand-text resize-none transition-colors" />
                      </div>

                      <div className="w-full sm:w-1/2">
                        <label className="block text-[10px] font-bold text-brand-text-mute uppercase tracking-wider mb-1 sm:hidden font-jetbrains">Back</label>
                        <textarea placeholder="Back (Definition/Answer)" rows={3} className="w-full bg-white border border-brand-line rounded-lg p-3 text-sm focus:outline-none focus:border-brand-teal-500 focus:ring-1 focus:ring-brand-teal-500 text-brand-text resize-none transition-colors" />
                      </div>
                    </div>
                  ))}
                </div>
                <button
                  onClick={handleAddFlashcard}
                  className="mt-6 sm:mt-4 text-xs text-brand-teal-600 font-bold flex items-center justify-center w-full sm:w-auto hover:text-brand-teal-700 transition-colors bg-brand-teal-50 border border-dashed border-brand-teal-200 px-4 py-3 rounded-xl"
                >
                  <Plus className="w-4 h-4 mr-1" /> Add Another Flashcard
                </button>
              </div>

            </div>

            <div className="p-4 sm:p-6 border-t border-brand-line bg-brand-bg-alt">
              <button
                onClick={() => setIsQuizModalOpen(false)}
                className="w-full bg-brand-teal-600 hover:bg-brand-teal-700 text-white py-3.5 sm:py-3 rounded-xl font-bold transition-colors shadow-md shadow-brand-teal-600/20"
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
