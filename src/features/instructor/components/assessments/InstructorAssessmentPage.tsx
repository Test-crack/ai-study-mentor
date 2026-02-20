import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { 
  Search, 
  Download, 
  Eye, 
  ArrowLeft,
  GraduationCap,FileText,BookOpen
} from "lucide-react";
import { InstructorSidebar } from "../dashboard/InstructorSidebar";
import { InstructorTopbar } from "../dashboard/InstructorTopbar";

// --- EXACT VIDEO MOCK DATA ---
const MOCK_ASSESSMENTS = [
  { id: 1, initials: "AM", name: "Arjun Mehta", accuracy: 42, ieltsBand: "0", struggle: "Conceptual", status: "At Risk", lastActive: "1d ago", type: "Conceptual learner", hesitationRate: 48, sessions: 14, readingScore: "-", readingCov: "-", strengths: ["Heaps", "Hash Tables", "Array Manipulation"], weaknesses: ["Binary Trees", "Recursion", "Graph Traversal"], summary: "Arjun mastered Heaps (82%) but hesitates for 45s on Binary Tree integration—suggests a weak foundation in recursive logic. His accuracy drops 38% when questions chain recursive calls.", action: "Assign 5-minute visual drill on recursive call-stack. Start with Fibonacci, then move to tree traversals." },
  { id: 2, initials: "PS", name: "Priya Sharma", accuracy: 67, ieltsBand: "—", struggle: "Tactical", status: "On Track", lastActive: "5h ago", type: "Tactical learner", hesitationRate: 22, sessions: 5, readingScore: "-", readingCov: "-", strengths: ["Dynamic Programming", "Sorting", "Linked Lists"], weaknesses: ["Greedy Algorithms", "Sliding Window", "Two Pointers"], summary: "Priya understands core concepts well (DP at 88%) but selects suboptimal approaches for Greedy problems—choosing brute force over pattern-matched strategies. Her logic is sound but method selection costs 30s per question.", action: "Provide a 'Method Selection Decision Tree' for Greedy vs DP vs Divide & Conquer. 10-minute pattern drill with side-by-side comparisons." },
  { id: 3, initials: "RG", name: "Rohan Gupta", accuracy: 73, ieltsBand: "—", struggle: "Psychological", status: "At Risk", lastActive: "3d ago", type: "Psychological learner", hesitationRate: 62, sessions: 18, readingScore: "-", readingCov: "-", strengths: ["Arrays", "Two Pointers", "Sliding Window"], weaknesses: ["Dynamic Programming", "Backtracking", "Graph Theory"], summary: "Rohan's untimed accuracy is 78% but drops to 41% under exam conditions. He spends 85s avg per question with 62% hesitation rate—classic time pressure panic.", action: "Use the Speech Anatomy tool for progressive desensitization – start with 2-min warm-up before timed sessions." },
  { id: 4, initials: "KN", name: "Kavya Nair", accuracy: 81, ieltsBand: "—", struggle: "Tactical", status: "On Track", lastActive: "3d ago", type: "Tactical learner", hesitationRate: 15, sessions: 24, readingScore: "-", readingCov: "-", strengths: ["Arrays", "Strings", "Binary Search"], weaknesses: ["Advanced Graph Algorithms", "Backtracking", "Weak in Backtracking"], summary: "Kavya is a strong performer who defaults to familiar patterns. She solves 80% of array/string problems optimally but applies BFS/DFS templates incorrectly to backtracking problems.", action: "Introduce forced-constraint exercises where she must solve problems without using standard BFS/DFS templates." },
  { id: 5, initials: "AP", name: "Aditya Patel", accuracy: 74, ieltsBand: "—", struggle: "Tactical", status: "On Track", lastActive: "6d ago", type: "Tactical learner", hesitationRate: 21, sessions: 12, readingScore: "-", readingCov: "-", strengths: ["Hash Tables", "Stacks", "Queues"], weaknesses: ["Dynamic Programming", "Bit Manipulation"], summary: "Aditya scores across the board with 77% accuracy and minimal hesitation. Ready for advanced challenge sets.", action: "Assign to peer mentoring group as a guide for newer students struggling with Hash Tables." },
  { id: 6, initials: "SR", name: "Sneha Reddy", accuracy: 37, ieltsBand: "—", struggle: "Psychological", status: "At Risk", lastActive: "6d ago", type: "Psychological learner", hesitationRate: 45, sessions: 4, readingScore: "-", readingCov: "-", strengths: ["Dynamic Prog.", "Two Pointers", "Arrays"], weaknesses: ["Strings", "Heaps", "Greedy"], summary: "Sneha shows 37% accuracy with 45% hesitation rate—spending 88s avg per question. Foundational gaps in Strings and Heaps require immediate structured intervention.", action: "Start with visual concept maps for Strings. Assign scaffolded problem sets that build from fundamentals." },
  { id: 7, initials: "VK", name: "Vikram Kumar", accuracy: 81, ieltsBand: "—", struggle: "Conceptual", status: "At Risk", lastActive: "3d ago", type: "Conceptual learner", hesitationRate: 35, sessions: 9, readingScore: "-", readingCov: "-", strengths: ["Math", "Geometry", "Logic"], weaknesses: ["Trees", "Graphs", "Tries"], summary: "Vikram demonstrates excellent logical reasoning but lacks vocabulary in non-linear data structures.", action: "Assign visual trace-through exercises for basic tree traversals." },
  { id: 8, initials: "AS", name: "Ananya Singh", accuracy: 37, ieltsBand: "—", struggle: "Tactical", status: "At Risk", lastActive: "5d ago", type: "Tactical learner", hesitationRate: 58, sessions: 6, readingScore: "-", readingCov: "-", strengths: ["Basic Syntax", "Loops", "Conditionals"], weaknesses: ["Recursion", "Dynamic Programming", "Pointers"], summary: "Ananya struggles significantly with state management across recursive calls. Needs fundamental review of call stacks.", action: "Step-by-step debugging sessions using physical paper and pen to trace variables." },
  { id: 9, initials: "RJ", name: "Rahul Joshi", accuracy: 84, ieltsBand: "—", struggle: "Psychological", status: "On Track", lastActive: "1d ago", type: "Psychological learner", hesitationRate: 18, sessions: 22, readingScore: "-", readingCov: "-", strengths: ["All Basic DSA", "System Design Concepts"], weaknesses: ["Concurrency", "Advanced DP"], summary: "Solid performer, occasionally over-engineers simple solutions due to anxiety about edge cases.", action: "Mock interviews focusing purely on 'simplest possible working solution' constraints." },
  { id: 10, initials: "MV", name: "Meera Verma", accuracy: 30, ieltsBand: "—", struggle: "Conceptual", status: "Critical", lastActive: "Just now", type: "Conceptual learner", hesitationRate: 72, sessions: 3, readingScore: "-", readingCov: "-", strengths: ["Enthusiasm"], weaknesses: ["Core Programming Constructs", "Data Types"], summary: "Meera is completely lost on basic programmatic thinking. Needs to step back to block-based logic concepts.", action: "Assign intro-level algorithmic thinking games before writing actual code." },
  { id: 11, initials: "DD", name: "Dev Das", accuracy: 79, ieltsBand: "—", struggle: "Tactical", status: "At Risk", lastActive: "2d ago", type: "Tactical learner", hesitationRate: 28, sessions: 16, readingScore: "-", readingCov: "-", strengths: ["Graphs", "BFS/DFS", "Topological Sort"], weaknesses: ["Dynamic Programming State Definition"], summary: "Dev is great at traversals but cannot define states for DP problems.", action: "1-on-1 session on identifying subproblems and defining memos." },
  { id: 12, initials: "SK", name: "Shreya Kulkarni", accuracy: 25, ieltsBand: "—", struggle: "Tactical", status: "Critical", lastActive: "1d ago", type: "Tactical learner", hesitationRate: 55, sessions: 7, readingScore: "-", readingCov: "-", strengths: ["Dynamic Prog.", "BSTs", "Pointer Arithmetic"], weaknesses: ["Stacks", "Strings", "Binary Trees"], summary: "Shreya shows 25% accuracy with 55% hesitation rate—spending 99s avg per question. Foundational gaps in Stacks and Strings require immediate structured intervention.", action: "Start with visual concept maps for Stacks. Assign scaffolded problem sets that build from fundamentals." },
];

export default function InstructorAssessmentPage() {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeFilter, setActiveFilter] = useState("ALL STUDENTS");
  const [selectedStudent, setSelectedStudent] = useState<any>(null);

  // --- FILTER LOGIC ---
  const filteredAssessments = MOCK_ASSESSMENTS.filter((assessment) => {
    const matchesSearch = assessment.name.toLowerCase().includes(searchTerm.toLowerCase());
    let matchesFilter = true;
    
    if (activeFilter === "CRITICAL") matchesFilter = assessment.status === "Critical";
    if (activeFilter === "AT RISK") matchesFilter = assessment.status === "At Risk";
    if (activeFilter === "ON TRACK") matchesFilter = assessment.status === "On Track";
    
    return matchesSearch && matchesFilter;
  });

  // Color helper for Accuracy
  const getAccuracyColor = (acc: number) => {
    if (acc >= 70) return "text-emerald-500";
    if (acc >= 50) return "text-amber-500";
    return "text-red-500";
  };

  // Badge Style Helper
  const getStatusBadge = (status: string) => {
    switch(status) {
      case "On Track":
        return <span className="bg-[#8b5cf6] text-white px-3 py-1 rounded-full text-xs font-semibold">On Track</span>;
      case "Critical":
        return <span className="bg-red-600 text-white px-3 py-1 rounded-full text-xs font-semibold">Critical</span>;
      case "At Risk":
        return <span className="text-slate-800 dark:text-slate-200 font-bold text-xs">At Risk</span>;
      default:
        return <span>{status}</span>;
    }
  };

  // Render SVG Radar Chart (Hexagon)
  const renderSkillRadar = () => {
    return (
      <svg viewBox="0 0 200 200" className="w-full h-48 max-w-[250px] mx-auto mt-4 overflow-visible">
        <style>
          {`
            @keyframes growRadar {
              0% { transform: scale(0); opacity: 0; }
              50% { opacity: 1; }
              100% { transform: scale(1); opacity: 1; }
            }
            .animate-radar-polygon {
              transform-origin: 100px 100px;
              animation: growRadar 1.2s cubic-bezier(0.22, 1, 0.36, 1) forwards;
            }
          `}
        </style>

        {/* Background Grids */}
        <polygon points="100,20 169,60 169,140 100,180 31,140 31,60" fill="none" className="stroke-slate-200 dark:stroke-slate-700" strokeWidth="1" />
        <polygon points="100,46 146,73 146,126 100,153 54,126 54,73" fill="none" className="stroke-slate-200 dark:stroke-slate-700" strokeWidth="1" />
        <polygon points="100,73 123,86 123,113 100,126 77,113 77,86" fill="none" className="stroke-slate-200 dark:stroke-slate-700" strokeWidth="1" />
        
        {/* Axes */}
        <line x1="100" y1="100" x2="100" y2="20" className="stroke-slate-200 dark:stroke-slate-700" strokeWidth="1" />
        <line x1="100" y1="100" x2="169" y2="60" className="stroke-slate-200 dark:stroke-slate-700" strokeWidth="1" />
        <line x1="100" y1="100" x2="169" y2="140" className="stroke-slate-200 dark:stroke-slate-700" strokeWidth="1" />
        <line x1="100" y1="100" x2="100" y2="180" className="stroke-slate-200 dark:stroke-slate-700" strokeWidth="1" />
        <line x1="100" y1="100" x2="31" y2="140" className="stroke-slate-200 dark:stroke-slate-700" strokeWidth="1" />
        <line x1="100" y1="100" x2="31" y2="60" className="stroke-slate-200 dark:stroke-slate-700" strokeWidth="1" />

        {/* Dynamic Data Polygon (Simulated Shape) - WITH ANIMATION CLASS */}
        <polygon 
          points="100,30 150,70 120,130 100,160 60,110 80,50" 
          fill="#8b5cf6" fillOpacity="0.2" 
          stroke="#8b5cf6" strokeWidth="2" 
          className="animate-radar-polygon"
        />

        {/* Axis Labels */}
        <text x="100" y="12" textAnchor="middle" className="fill-slate-500 dark:fill-slate-400" fontSize="9">Dynamic Pr...</text>
        <text x="180" y="65" textAnchor="middle" className="fill-slate-500 dark:fill-slate-400" fontSize="9">Sorting</text>
        <text x="185" y="145" textAnchor="middle" className="fill-slate-500 dark:fill-slate-400" fontSize="9">Linked Lis...</text>
        <text x="100" y="192" textAnchor="middle" className="fill-slate-500 dark:fill-slate-400" fontSize="9">Greedy</text>
        <text x="15" y="145" textAnchor="middle" className="fill-slate-500 dark:fill-slate-400" fontSize="9">Sliding Wi...</text>
        <text x="15" y="65" textAnchor="middle" className="fill-slate-500 dark:fill-slate-400" fontSize="9">Two Pointe...</text>
      </svg>
    );
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#0a0a0a] transition-colors duration-300">
      <InstructorSidebar
        activeTab="assessments"
        isCollapsed={isSidebarCollapsed}
        toggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
      />

      <div className={`transition-all duration-300 ${isSidebarCollapsed ? 'lg:pl-24' : 'lg:pl-72'}`}>
        <InstructorTopbar />

        <main className="p-6 md:p-8 max-w-[1600px] mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500 font-sans text-slate-900 dark:text-white">
          
          {/* --- DETAIL VIEW (REPORT) --- */}
          {selectedStudent ? (
            <div className="space-y-6">
              
              {/* Back Button */}
              <button 
                onClick={() => setSelectedStudent(null)}
                className="flex items-center text-sm font-medium text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white transition-colors"
              >
                <ArrowLeft className="w-4 h-4 mr-2" /> Back to all students
              </button>

              {/* Header Card */}
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-transparent py-2">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-full bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400 flex items-center justify-center text-xl font-bold border border-purple-200 dark:border-purple-800">
                    {selectedStudent.initials}
                  </div>
                  <div>
                    <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">{selectedStudent.name}</h1>
                    <div className="flex items-center gap-3 mt-1 text-sm">
                      {getStatusBadge(selectedStudent.status)}
                      <span className="text-slate-500 dark:text-slate-400">{selectedStudent.type} • Last active {selectedStudent.lastActive}</span>
                    </div>
                  </div>
                </div>
                <button className="flex items-center gap-2 bg-white dark:bg-[#111111] border border-slate-200 dark:border-gray-800 hover:bg-slate-50 dark:hover:bg-gray-800 text-slate-700 dark:text-slate-300 px-4 py-2 rounded-lg font-medium text-sm transition-colors shadow-sm">
                  <Download className="w-4 h-4" /> Export Report
                </button>
              </div>

              {/* 4 Stat Cards */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white dark:bg-[#111111] rounded-2xl p-6 border border-slate-100 dark:border-gray-800 shadow-sm flex flex-col items-center justify-center text-center">
                  <div className="text-3xl font-bold text-slate-900 dark:text-white mb-1">{selectedStudent.accuracy}%</div>
                  <div className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">ACCURACY</div>
                </div>
                <div className="bg-white dark:bg-[#111111] rounded-2xl p-6 border border-slate-100 dark:border-gray-800 shadow-sm flex flex-col items-center justify-center text-center">
                  <div className="text-3xl font-bold text-slate-900 dark:text-white mb-1">{selectedStudent.hesitationRate}%</div>
                  <div className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">HESITATION RATE</div>
                </div>
                <div className="bg-white dark:bg-[#111111] rounded-2xl p-6 border border-slate-100 dark:border-gray-800 shadow-sm flex flex-col items-center justify-center text-center">
                  <div className="text-3xl font-bold text-slate-900 dark:text-white mb-1">{selectedStudent.sessions}</div>
                  <div className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">TOTAL SESSIONS</div>
                </div>
                <div className="bg-white dark:bg-[#111111] rounded-2xl p-6 border border-slate-100 dark:border-gray-800 shadow-sm flex flex-col items-center justify-center text-center">
                  <div className="text-3xl font-bold text-slate-900 dark:text-white mb-1">{selectedStudent.ieltsBand === "0" || selectedStudent.ieltsBand === "—" ? "-" : selectedStudent.ieltsBand}</div>
                  <div className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">IELTS BAND</div>
                </div>
              </div>

              {/* Grid Layout for Detailed Reports */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                
                {/* Skill Radar */}
                <div className="bg-white dark:bg-[#111111] rounded-2xl p-6 border border-slate-100 dark:border-gray-800 shadow-sm">
                  <h3 className="font-bold flex items-center text-slate-800 dark:text-slate-200">
                    <div className="w-5 h-5 mr-2 rounded-full border-2 border-purple-500 flex items-center justify-center"><div className="w-1.5 h-1.5 bg-purple-500 rounded-full"></div></div> 
                    Skill Radar
                  </h3>
                  {renderSkillRadar()}
                </div>

                {/* IELTS Breakdown */}
                <div className="bg-white dark:bg-[#111111] rounded-2xl p-6 border border-slate-100 dark:border-gray-800 shadow-sm flex flex-col">
                  <h3 className="font-bold flex items-center text-slate-800 dark:text-slate-200 mb-auto">
                    <GraduationCap className="w-5 h-5 mr-2 text-blue-500" /> IELTS Band Breakdown
                  </h3>
                  <div className="flex flex-col items-center justify-center h-48 text-slate-400">
                    <GraduationCap className="w-8 h-8 mb-2 opacity-50" />
                    <p className="text-sm font-medium">No IELTS sessions recorded yet</p>
                  </div>
                </div>

                {/* Reading Performance */}
                <div className="bg-white dark:bg-[#111111] rounded-2xl p-6 border border-slate-100 dark:border-gray-800 shadow-sm">
                  <h3 className="font-bold flex items-center text-slate-800 dark:text-slate-200 mb-6">
                    <div className="bg-emerald-100 dark:bg-emerald-900/30 p-1 rounded mr-2"><BookOpen className="w-4 h-4 text-emerald-600 dark:text-emerald-400" /></div>
                    Reading Performance
                  </h3>
                  <div className="flex gap-8 mb-6">
                    <div>
                      <div className="text-2xl font-bold text-slate-900 dark:text-white text-center">—</div>
                      <div className="text-xs text-slate-500 mt-1">Fluency Score</div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-slate-900 dark:text-white text-center">—%</div>
                      <div className="text-xs text-slate-500 mt-1">Keyword Coverage</div>
                    </div>
                  </div>
                  <p className="text-xs text-slate-500">0 reading sessions completed</p>
                </div>

                {/* Speaking Assessment */}
                <div className="bg-white dark:bg-[#111111] rounded-2xl p-6 border border-slate-100 dark:border-gray-800 shadow-sm">
                  <h3 className="font-bold flex items-center text-slate-800 dark:text-slate-200 mb-6">
                    <div className="bg-orange-100 dark:bg-orange-900/30 p-1 rounded mr-2"><span className="w-4 h-4 text-orange-600 dark:text-orange-400 flex items-center justify-center text-lg font-bold leading-none">🎙</span></div>
                    Speaking Assessment
                  </h3>
                  <div className="space-y-4 text-sm">
                    <div className="flex items-start">
                      <span className="w-24 text-slate-500 font-medium shrink-0">Strengths</span>
                      <span className="text-emerald-600 font-medium">{selectedStudent.strengths.join(", ")}</span>
                    </div>
                    <div className="flex items-start">
                      <span className="w-24 text-slate-500 font-medium shrink-0">Weaknesses</span>
                      <span className="text-red-500 font-medium">{selectedStudent.weaknesses.join(", ")}</span>
                    </div>
                  </div>
                </div>

                {/* AI Assessment Summary */}
                <div className="bg-white dark:bg-[#111111] rounded-2xl p-6 border border-slate-100 dark:border-gray-800 shadow-sm lg:col-span-2">
                  <h3 className="font-bold flex items-center text-slate-800 dark:text-slate-200 mb-4">
                    <div className="w-6 h-6 mr-2 bg-purple-600 text-white rounded-md flex items-center justify-center text-sm font-bold">✨</div>
                    AI Assessment Summary
                  </h3>
                  <p className="text-slate-700 dark:text-slate-300 text-sm leading-relaxed mb-6">
                    {selectedStudent.summary}
                  </p>
                  
                  <div className="bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900/30 rounded-xl p-4">
                    <h4 className="flex items-center text-emerald-700 dark:text-emerald-400 text-xs font-bold uppercase tracking-wider mb-2">
                      <FileText className="w-4 h-4 mr-2" /> Recommended Action
                    </h4>
                    <p className="text-sm text-slate-700 dark:text-slate-300">
                      {selectedStudent.action}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          ) : (

            /* --- LIST VIEW (MAIN DASHBOARD) --- */
            <div className="space-y-8">
              
              {/* Header Title & Search */}
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                <div>
                  <h1 className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight mb-2">Student Assessments</h1>
                  <p className="text-slate-500 dark:text-slate-400 text-sm">Search any student for a comprehensive report — speaking, reading, IELTS, and AI assessment.</p>
                </div>
                <div className="relative w-full md:w-80">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input 
                    type="text"
                    placeholder="Search students by name..."
                    className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-[#111111] border border-slate-200 dark:border-gray-800 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/50 transition-shadow text-slate-900 dark:text-white"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
              </div>

              {/* Stat/Filter Tabs */}
              <div className="flex flex-wrap md:flex-nowrap gap-4 w-full">
                {[
                  { label: "ALL STUDENTS", value: "64", color: "border-purple-600", type: "ALL STUDENTS" },
                  { label: "CRITICAL", value: "7", color: "border-red-500", type: "CRITICAL" },
                  { label: "AT RISK", value: "31", color: "border-orange-500", type: "AT RISK" },
                  { label: "ON TRACK", value: "26", color: "border-emerald-500", type: "ON TRACK" },
                  { label: "AVG ACCURACY", value: "60%", color: "border-transparent", type: "STAT" }
                ].map((tab, idx) => (
                  <div 
                    key={idx}
                    onClick={() => tab.type !== 'STAT' && setActiveFilter(tab.type)}
                    className={`flex-1 bg-white dark:bg-[#111111] rounded-xl p-5 border-t-4 shadow-sm flex flex-col items-center justify-center cursor-pointer transition-all duration-200
                      ${activeFilter === tab.type ? tab.color : 'border-transparent border shadow-none hover:shadow-sm dark:border-gray-800'}
                    `}
                  >
                    <div className={`text-3xl font-bold mb-1 ${
                      tab.type === 'AT RISK' && activeFilter === 'AT RISK' ? 'text-orange-500' : 
                      tab.type === 'CRITICAL' && activeFilter === 'CRITICAL' ? 'text-red-600' : 
                      'text-slate-900 dark:text-white'
                    }`}>
                      {tab.value}
                    </div>
                    <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest text-center">{tab.label}</div>
                  </div>
                ))}
              </div>

              {/* Data Table */}
              <div className="bg-white dark:bg-[#111111] rounded-2xl shadow-sm border border-slate-100 dark:border-gray-800 overflow-x-auto">
                <table className="w-full text-left border-collapse min-w-[800px]">
                  <thead>
                    <tr className="border-b border-slate-100 dark:border-gray-800 text-[10px] font-bold text-slate-400 uppercase tracking-widest bg-slate-50 dark:bg-[#171722]">
                      <th className="p-4 py-4 w-1/4">STUDENT</th>
                      <th className="p-4 py-4">ACCURACY</th>
                      <th className="p-4 py-4">IELTS BAND</th>
                      <th className="p-4 py-4">STRUGGLE</th>
                      <th className="p-4 py-4">STATUS</th>
                      <th className="p-4 py-4">LAST ACTIVE</th>
                      <th className="p-4 py-4 text-right">ACTION</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50 dark:divide-gray-800/50">
                    {filteredAssessments.length > 0 ? (
                      filteredAssessments.map((row) => (
                        <tr key={row.id} className="hover:bg-slate-50 dark:hover:bg-gray-800/30 transition-colors group">
                          <td className="p-4 flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-gray-800 text-indigo-600 dark:text-indigo-400 flex items-center justify-center text-xs font-bold font-sans tracking-tight">
                              {row.initials}
                            </div>
                            <span className="font-bold text-sm text-slate-900 dark:text-white">{row.name}</span>
                          </td>
                          <td className={`p-4 text-sm font-bold ${getAccuracyColor(row.accuracy)}`}>
                            {row.accuracy}%
                          </td>
                          <td className="p-4 text-sm font-medium text-slate-500">{row.ieltsBand}</td>
                          <td className="p-4 text-sm font-medium text-slate-600 dark:text-slate-400">{row.struggle}</td>
                          <td className="p-4">
                            {getStatusBadge(row.status)}
                          </td>
                          <td className="p-4 text-sm font-medium text-slate-500">{row.lastActive}</td>
                          <td className="p-4 text-right">
                            <button 
                              onClick={() => setSelectedStudent(row)}
                              className="inline-flex items-center text-xs font-bold text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
                            >
                              <Eye className="w-4 h-4 mr-1.5" /> View
                            </button>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={7} className="p-8 text-center text-slate-500 font-medium">
                          No students found matching your criteria.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

            </div>
          )}

        </main>
      </div>
    </div>
  );
}