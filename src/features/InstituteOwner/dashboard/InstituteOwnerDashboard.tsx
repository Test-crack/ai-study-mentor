import React, { useState, useMemo } from 'react';
import { 
  ArrowUpRight, 
  DollarSign, 
  Clock, 
  TrendingUp, 
  ArrowRight, 
  ChevronDown, 
  ChevronUp, 
  Target, 
  Activity, 
  Calendar, 
  AlertCircle 
} from 'lucide-react';

import { InstituteOwnerSidebar } from '../components/InstitiuteOwnerSidebar';
import { InstituteOwnerTopbar } from '../components/InstituteOwnerTopbar';
import { useNavigate } from 'react-router-dom';

// ─── TYPES & MOCK DATA (FE-15) ────────────────────────────────────────────────
interface Assessment {
  date: string;
  type: string;
  score: number;
}

interface Student {
  id: string;
  name: string;
  batch: string;
  listening: number;
  reading: number;
  writing: number;
  speaking: number;
  lastActiveDaysAgo: number;
  bandDeclining: boolean;
  focusArea: string;
  subScores: {
    fluency?: number;
    pronunciation?: number;
    grammar?: number;
    vocabulary?: number;
    coherence?: number;
    taskResponse?: number;
  };
  recentAssessments: Assessment[];
}

const MOCK_STUDENTS: Student[] = [
  {
    id: "1", name: "Gokul R Nair", batch: "IELTS Evening",
    listening: 7.0, reading: 6.5, writing: 6.0, speaking: 6.5,
    lastActiveDaysAgo: 1, bandDeclining: false, focusArea: "Writing - Grammar",
    subScores: { fluency: 6.5, pronunciation: 7.0, grammar: 5.5, vocabulary: 6.0, coherence: 6.0, taskResponse: 6.0 },
    recentAssessments: [
      { date: "2024-04-05", type: "Full Mock Test", score: 6.5 },
      { date: "2024-04-01", type: "Speaking Mini-Mock", score: 6.5 },
      { date: "2024-03-28", type: "Writing Task 2", score: 6.0 },
    ]
  },
  {
    id: "2", name: "Sarah Jenkins", batch: "IELTS Batch 12",
    listening: 8.0, reading: 7.5, writing: 7.0, speaking: 7.5,
    lastActiveDaysAgo: 4, bandDeclining: false, focusArea: "Speaking - Fluency",
    subScores: { fluency: 7.0, pronunciation: 8.0, grammar: 7.5, vocabulary: 7.0, coherence: 7.0, taskResponse: 7.5 },
    recentAssessments: [
      { date: "2024-04-02", type: "Full Mock Test", score: 7.5 },
      { date: "2024-03-25", type: "Reading Practice", score: 7.5 },
    ]
  },
  {
    id: "3", name: "Amit Patel", batch: "IELTS Evening",
    listening: 5.5, reading: 5.0, writing: 5.5, speaking: 5.0,
    lastActiveDaysAgo: 6, bandDeclining: true, focusArea: "Reading - Comprehension",
    subScores: { fluency: 5.0, pronunciation: 5.5, grammar: 5.0, vocabulary: 5.5, coherence: 5.5, taskResponse: 5.0 },
    recentAssessments: [
      { date: "2024-03-30", type: "Full Mock Test", score: 5.0 },
      { date: "2024-03-15", type: "Full Mock Test", score: 5.5 },
      { date: "2024-03-01", type: "Full Mock Test", score: 6.0 }, // Band declining
    ]
  },
  {
    id: "4", name: "Elena Rodriguez", batch: "Tech Prep Batch 5",
    listening: 6.5, reading: 7.0, writing: 6.5, speaking: 7.0,
    lastActiveDaysAgo: 0, bandDeclining: false, focusArea: "Writing - Task Response",
    subScores: { fluency: 7.0, pronunciation: 7.0, grammar: 6.5, vocabulary: 6.5, coherence: 6.5, taskResponse: 6.0 },
    recentAssessments: [
      { date: "2024-04-06", type: "Writing Task 1", score: 6.5 },
      { date: "2024-03-29", type: "Full Mock Test", score: 6.5 },
    ]
  }
];

// ─── UTILS (FE-15 Logic) ──────────────────────────────────────────────────────
type StatusRank = 1 | 2 | 3; 

const getStudentStatus = (student: Student): { color: string; label: string; rank: StatusRank } => {
  // Red = inactive 5+ days OR band declining
  if (student.lastActiveDaysAgo >= 5 || student.bandDeclining) {
    return { color: "bg-rose-500", label: student.bandDeclining ? "Band Declining" : "Inactive 5+ Days", rank: 1 };
  }
  // Amber = inactive 3–5 days
  if (student.lastActiveDaysAgo >= 3) {
    return { color: "bg-amber-500", label: "Inactive 3-4 Days", rank: 2 };
  }
  // Green = active in last 2 days
  return { color: "bg-emerald-500", label: "Active", rank: 3 };
};

export default function InstituteOwnerDashboard() {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const navigate = useNavigate();

  // FE-15 Table State
  const [selectedBatchFilter, setSelectedBatchFilter] = useState<string>("All");
  const [expandedRowId, setExpandedRowId] = useState<string | null>(null);

  const uniqueBatches = ["All", ...Array.from(new Set(MOCK_STUDENTS.map(s => s.batch)))];

  const processedStudents = useMemo(() => {
    let filtered = MOCK_STUDENTS;
    if (selectedBatchFilter !== "All") {
      filtered = filtered.filter(s => s.batch === selectedBatchFilter);
    }

    // Sort by Status Rank (Red = 1 goes first)
    return filtered.sort((a, b) => {
      const rankA = getStudentStatus(a).rank;
      const rankB = getStudentStatus(b).rank;
      return rankA - rankB; 
    });
  }, [selectedBatchFilter]);

  const toggleRow = (id: string) => {
    setExpandedRowId(prev => prev === id ? null : id);
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-[#0a0a0a] font-sans text-slate-900 dark:text-white transition-colors duration-300">
      
      {/* Sidebar */}
      <div className="hidden lg:block">
        <InstituteOwnerSidebar 
          activeTab="owner-dashboard"
          isCollapsed={isSidebarCollapsed} 
          toggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)} 
        />
      </div>

      {/* Main Layout Wrapper */}
      <div className={`transition-all duration-300 flex flex-col min-h-screen ${isSidebarCollapsed ? 'lg:pl-20' : 'lg:pl-64'}`}>
        
        {/* Topbar */}
        <InstituteOwnerTopbar />

        {/* Main Content */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8">
          <div className="max-w-[1400px] mx-auto">
            
            {/* Header Section */}
            <div className="bg-white dark:bg-[#13111c] border border-slate-200 dark:border-[#2a243d] rounded-xl p-6 mb-6 shadow-sm">
              <h1 className="text-3xl font-bold mb-2">Strategic Overview</h1>
              <p className="text-slate-500 dark:text-gray-300 mb-6 text-sm md:text-base max-w-3xl">
                105 students generating <span className="font-semibold text-slate-900 dark:text-white">₹263K/mo</span> revenue. 
                AI saving <span className="font-semibold text-slate-900 dark:text-white">₹263K/mo</span> vs manual assessment. 
                263 tutor hours freed monthly.
              </p>
              <div className="flex gap-3">
                <button onClick={() => navigate('/institute-owner/roi')} className="bg-indigo-600 dark:bg-white text-white dark:text-black px-4 py-2 rounded-lg font-medium flex items-center gap-2 hover:bg-indigo-700 dark:hover:bg-gray-200 transition shadow-sm">
                  <DollarSign size={18} /> ROI Report
                </button>
              </div>
            </div>

            {/* Top Metric Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
              <div className="bg-white dark:bg-[#121214] border border-slate-200 dark:border-[#27272a] rounded-xl p-5 shadow-sm">
                <p className="text-slate-500 dark:text-gray-400 text-xs mb-1">Monthly Revenue</p>
                <div className="flex justify-between items-end">
                  <h2 className="text-2xl font-bold flex items-center gap-1">
                    <span className="text-slate-400 dark:text-gray-500 text-lg">₹</span>263K
                  </h2>
                  <span className="text-emerald-600 dark:text-green-500 text-xs bg-emerald-50 dark:bg-green-500/10 px-2 py-1 rounded flex items-center gap-1">
                    <ArrowUpRight size={12} /> +15%
                  </span>
                </div>
              </div>
              
              <div className="bg-white dark:bg-[#121214] border border-slate-200 dark:border-[#27272a] rounded-xl p-5 shadow-sm">
                <p className="text-slate-500 dark:text-gray-400 text-xs mb-1">AI Savings</p>
                <div className="flex justify-between items-end">
                  <h2 className="text-2xl font-bold">₹263K</h2>
                  <span className="text-emerald-600 dark:text-green-500 text-xs bg-emerald-50 dark:bg-green-500/10 px-2 py-1 rounded flex items-center gap-1">
                    <ArrowUpRight size={12} /> vs manual
                  </span>
                </div>
              </div>

              <div className="bg-white dark:bg-[#121214] border border-slate-200 dark:border-[#27272a] rounded-xl p-5 shadow-sm">
                <p className="text-slate-500 dark:text-gray-400 text-xs mb-1">Tutor Hours Saved</p>
                <div className="flex justify-between items-end">
                  <h2 className="text-2xl font-bold flex items-center gap-2">
                    <Clock size={20} className="text-indigo-600 dark:text-purple-500"/> 263h
                  </h2>
                  <span className="text-emerald-600 dark:text-green-500 text-xs bg-emerald-50 dark:bg-green-500/10 px-2 py-1 rounded flex items-center gap-1">
                    <ArrowUpRight size={12} /> /month
                  </span>
                </div>
              </div>

              <div className="bg-white dark:bg-[#121214] border border-slate-200 dark:border-[#27272a] rounded-xl p-5 shadow-sm">
                <p className="text-slate-500 dark:text-gray-400 text-xs mb-1">Avg Improvement</p>
                <div className="flex justify-between items-end">
                  <h2 className="text-2xl font-bold flex items-center gap-2">
                    <TrendingUp size={20} className="text-blue-600 dark:text-blue-500"/> 16%
                  </h2>
                  <span className="text-emerald-600 dark:text-green-500 text-xs bg-emerald-50 dark:bg-green-500/10 px-2 py-1 rounded flex items-center gap-1">
                    <ArrowUpRight size={12} /> +2% vs last
                  </span>
                </div>
              </div>
            </div>

            {/* Cost Comparison section */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
              <div className="bg-white dark:bg-[#121214] border border-slate-200 dark:border-[#27272a] rounded-xl p-5 shadow-sm">
                <p className="text-slate-500 dark:text-gray-400 text-xs mb-1">Manual Assessment Cost</p>
                <h2 className="text-2xl font-bold text-red-600 dark:text-red-500 mb-1">₹525K/mo</h2>
                <p className="text-slate-500 dark:text-gray-500 text-xs bg-slate-100 dark:bg-[#1a1a1e] inline-block px-2 py-1 rounded">₹5,000/student × 105 students</p>
              </div>
              <div className="bg-white dark:bg-[#121214] border border-slate-200 dark:border-[#27272a] rounded-xl p-5 shadow-sm">
                <p className="text-slate-500 dark:text-gray-400 text-xs mb-1 bg-slate-100 dark:bg-gray-800 inline-block px-2 py-0.5 rounded">AI-Powered Cost</p>
                <h2 className="text-2xl font-bold mb-1">₹263K/mo</h2>
                <p className="text-slate-500 dark:text-gray-500 text-xs bg-slate-100 dark:bg-[#1a1a1e] inline-block px-2 py-1 rounded">₹2,500/student × 105 students</p>
              </div>
              <div className="bg-emerald-50 dark:bg-gradient-to-r dark:from-[#0d1f15] dark:to-[#121214] border border-emerald-200 dark:border-green-900/50 rounded-xl p-5 shadow-sm">
                <p className="text-emerald-700 dark:text-green-500 text-xs font-semibold mb-1">NET MONTHLY SAVINGS</p>
                <h2 className="text-2xl font-bold text-emerald-600 dark:text-green-400 mb-1">₹263K</h2>
                <p className="text-emerald-600/70 dark:text-green-500/70 text-xs">50% cost reduction</p>
              </div>
            </div>

            {/* FE-15: Student Data Table (Replaces generic grid tables) */}
            <div className="bg-white dark:bg-[#121214] rounded-2xl shadow-sm border border-slate-200 dark:border-[#27272a] overflow-hidden mb-6">
              
              {/* Table Header & Filter */}
              <div className="p-5 border-b border-slate-200 dark:border-[#27272a] flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-50/50 dark:bg-[#121214]">
                <div>
                  <h2 className="text-lg font-bold text-slate-800 dark:text-white">Student Roster</h2>
                  <p className="text-xs text-slate-500 mt-0.5">Identify at-risk students and review sub-skill precision.</p>
                </div>
                <div className="flex items-center gap-3">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Filter Batch:</label>
                  <select 
                    value={selectedBatchFilter} 
                    onChange={(e) => setSelectedBatchFilter(e.target.value)}
                    className="bg-white dark:bg-[#1a1a1c] border border-slate-200 dark:border-[#27272a] text-slate-800 dark:text-slate-200 text-sm font-semibold rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-indigo-500/50 cursor-pointer shadow-sm"
                  >
                    {uniqueBatches.map(b => (
                      <option key={b} value={b}>{b}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 dark:bg-[#1a1a1c] border-b border-slate-200 dark:border-[#27272a] text-[11px] uppercase tracking-widest text-slate-500 font-bold">
                      <th className="p-5 whitespace-nowrap">Student Name</th>
                      <th className="p-5 text-center">Listening</th>
                      <th className="p-5 text-center">Reading</th>
                      <th className="p-5 text-center">Writing</th>
                      <th className="p-5 text-center">Speaking</th>
                      <th className="p-5 text-center">Last Active</th>
                      <th className="p-5 text-center">Status</th>
                      <th className="p-5 w-10"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-[#27272a]">
                    {processedStudents.map((student) => {
                      const status = getStudentStatus(student);
                      const isExpanded = expandedRowId === student.id;

                      return (
                        <React.Fragment key={student.id}>
                          {/* Main Row */}
                          <tr 
                            onClick={() => toggleRow(student.id)}
                            className={`group cursor-pointer transition-colors ${isExpanded ? 'bg-indigo-50/50 dark:bg-indigo-500/5' : 'hover:bg-slate-50 dark:hover:bg-[#1a1a1c]'}`}
                          >
                            <td className="p-5">
                              <p className="font-bold text-slate-800 dark:text-white">{student.name}</p>
                              <p className="text-xs text-slate-500 font-medium mt-0.5">{student.batch}</p>
                            </td>
                            <td className="p-5 text-center font-bold text-slate-700 dark:text-slate-300">{student.listening.toFixed(1)}</td>
                            <td className="p-5 text-center font-bold text-slate-700 dark:text-slate-300">{student.reading.toFixed(1)}</td>
                            <td className="p-5 text-center font-bold text-slate-700 dark:text-slate-300">{student.writing.toFixed(1)}</td>
                            <td className="p-5 text-center font-bold text-slate-700 dark:text-slate-300">{student.speaking.toFixed(1)}</td>
                            <td className="p-5 text-center">
                              <span className="text-sm font-medium text-slate-600 dark:text-slate-400">
                                {student.lastActiveDaysAgo === 0 ? "Today" : `${student.lastActiveDaysAgo}d ago`}
                              </span>
                            </td>
                            <td className="p-5">
                              <div className="flex flex-col items-center justify-center gap-1.5 cursor-help" title={status.label}>
                                <div className={`h-3 w-3 rounded-full ${status.color} shadow-sm ${status.rank === 1 ? 'animate-pulse ring-2 ring-rose-500/20' : ''}`} />
                                <span className="text-[10px] font-bold text-slate-400 uppercase leading-none text-center whitespace-nowrap">
                                  {status.label}
                                </span>
                              </div>
                            </td>
                            <td className="p-5 text-slate-400 group-hover:text-indigo-500 transition-colors">
                              {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                            </td>
                          </tr>

                          {/* Expanded Row Content */}
                          {isExpanded && (
                            <tr className="bg-indigo-50/30 dark:bg-indigo-500/5 border-b border-indigo-100 dark:border-indigo-500/10">
                              <td colSpan={8} className="p-0">
                                <div className="p-6 md:p-8 animate-in slide-in-from-top-2 duration-200">
                                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                                    
                                    {/* 1. Current Focus Area */}
                                    <div className="bg-white dark:bg-[#121214] border border-slate-200 dark:border-[#27272a] rounded-2xl p-5 shadow-sm">
                                      <div className="flex items-center gap-2 mb-3 text-indigo-500">
                                        <Target className="w-5 h-5" />
                                        <h4 className="text-xs font-bold uppercase tracking-widest">Current Priority</h4>
                                      </div>
                                      <p className="text-lg font-black text-slate-800 dark:text-white">{student.focusArea}</p>
                                      {student.bandDeclining && (
                                        <div className="mt-4 inline-flex items-center gap-1.5 bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400 px-3 py-2 rounded-lg text-xs font-bold border border-rose-200 dark:border-rose-500/20 w-full">
                                          <AlertCircle className="w-4 h-4 shrink-0" /> Student band score is declining
                                        </div>
                                      )}
                                    </div>

                                    {/* 2. Sub-Skills Breakdown */}
                                    <div className="bg-white dark:bg-[#121214] border border-slate-200 dark:border-[#27272a] rounded-2xl p-5 shadow-sm">
                                      <div className="flex items-center gap-2 mb-4 text-blue-500">
                                        <Activity className="w-5 h-5" />
                                        <h4 className="text-xs font-bold uppercase tracking-widest">Sub-Scores</h4>
                                      </div>
                                      <div className="grid grid-cols-2 gap-y-3 gap-x-6">
                                        {Object.entries(student.subScores).map(([key, val]) => (
                                          <div key={key} className="flex justify-between items-center text-sm border-b border-slate-100 dark:border-[#27272a] pb-1">
                                            <span className="text-slate-500 capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}</span>
                                            <span className="font-bold text-slate-800 dark:text-slate-200">{val?.toFixed(1)}</span>
                                          </div>
                                        ))}
                                      </div>
                                    </div>

                                    {/* 3. Recent Assessments */}
                                    <div className="bg-white dark:bg-[#121214] border border-slate-200 dark:border-[#27272a] rounded-2xl p-5 shadow-sm">
                                      <div className="flex items-center gap-2 mb-4 text-emerald-500">
                                        <Calendar className="w-5 h-5" />
                                        <h4 className="text-xs font-bold uppercase tracking-widest">Last 3 Assessments</h4>
                                      </div>
                                      <div className="space-y-3">
                                        {student.recentAssessments.map((assessment, idx) => (
                                          <div key={idx} className="flex justify-between items-center text-sm">
                                            <div>
                                              <p className="font-bold text-slate-700 dark:text-slate-200">{assessment.type}</p>
                                              <p className="text-xs text-slate-400">{assessment.date}</p>
                                            </div>
                                            <div className="bg-slate-50 dark:bg-[#1a1a1c] border border-slate-100 dark:border-[#27272a] px-3 py-1 rounded-lg font-black text-slate-800 dark:text-white">
                                              {assessment.score.toFixed(1)}
                                            </div>
                                          </div>
                                        ))}
                                      </div>
                                    </div>

                                  </div>
                                </div>
                              </td>
                            </tr>
                          )}
                        </React.Fragment>
                      );
                    })}

                    {processedStudents.length === 0 && (
                      <tr>
                        <td colSpan={8} className="p-10 text-center text-slate-500">
                          No students found for this filter.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Bottom Metric Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pb-8">
              {/* Satisfaction */}
              <div className="bg-white dark:bg-[#121214] border border-slate-200 dark:border-[#27272a] rounded-xl p-5 shadow-sm">
                <p className="text-slate-500 dark:text-gray-400 text-sm mb-2">Student Satisfaction</p>
                <h2 className="text-3xl font-bold text-blue-600 dark:text-blue-400 mb-4">93%</h2>
                <div className="w-full bg-slate-100 dark:bg-gray-800 rounded-full h-1.5 mb-2">
                  <div className="bg-blue-500 h-1.5 rounded-full" style={{ width: '93%' }}></div>
                </div>
                <p className="text-emerald-600 dark:text-green-500 text-xs">+8% from last quarter</p>
              </div>

              {/* Retention */}
              <div className="bg-white dark:bg-[#121214] border border-slate-200 dark:border-[#27272a] rounded-xl p-5 shadow-sm">
                <p className="text-slate-500 dark:text-gray-400 text-sm mb-2">Student Retention Rate</p>
                <h2 className="text-3xl font-bold text-indigo-600 dark:text-purple-400 mb-4">92%</h2>
                <div className="w-full bg-slate-100 dark:bg-gray-800 rounded-full h-1.5 mb-2">
                  <div className="bg-indigo-500 dark:bg-purple-500 h-1.5 rounded-full" style={{ width: '92%' }}></div>
                </div>
                <p className="text-slate-500 dark:text-gray-500 text-xs">Industry avg. 78%</p>
              </div>

              {/* ROI Projection */}
              <div className="bg-white dark:bg-[#121214] border border-slate-200 dark:border-[#27272a] rounded-xl p-5 flex flex-col justify-center shadow-sm">
                <p className="text-slate-500 dark:text-gray-400 text-sm mb-2">Annual ROI Projection</p>
                <h2 className="text-3xl font-bold mb-2">₹31.5L</h2>
                <p className="text-slate-500 dark:text-gray-500 text-xs">Projected annual savings</p>
              </div>
            </div>

          </div>
        </main>
      </div>
    </div>
  );
}