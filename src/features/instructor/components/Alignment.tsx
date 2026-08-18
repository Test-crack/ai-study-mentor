import React, { useState } from 'react';
import { toast } from "sonner";
import { 
  DollarSign, Percent, Clock, TrendingUp, HelpCircle, 
  Lightbulb, CheckCircle2, ChevronRight, BookOpen,
  Eye, AlertTriangle, Download, ArrowLeft, Users, UserCheck, Target
} from 'lucide-react';
import { InstructorSidebar } from "./dashboard/InstructorSidebar";
import { InstructorTopbar } from "./dashboard/InstructorTopbar";

// --- MOCK DATA ---
const overGradedStudents = [
  { name: 'Arjun Mehta', teacher: 58, ai: 42, gap: 16, insight: 'AI detected recursive logic gaps teacher graded le...' },
  { name: 'Aditya Patel', teacher: 75, ai: 55, gap: 20, insight: 'Student memorized solutions — AI detected zero tra...' },
  { name: 'Rahul Joshi', teacher: 72, ai: 51, gap: 21, insight: 'Pattern matching without understanding — fails on ...' },
  { name: 'Dev Das', teacher: 56, ai: 38, gap: 18, insight: 'Fundamental gaps in data structures missed in MCQ...' },
];

const underGradedStudents = [
  { name: 'Rohan Gupta', teacher: 65, ai: 73, gap: 8, insight: 'Untimed performance 73% — teacher tested under time pressure only' },
  { name: 'Sneha Reddy', teacher: 52, ai: 68, gap: 16, insight: 'Strong fundamentals masked by exam anxiety — untimed score 68%' },
  { name: 'Meera Verma', teacher: 78, ai: 82, gap: 4, insight: 'Stronger than manual grade suggests — excels in complex multi-step' },
];

const tableData = [
  { name: 'Arjun Mehta', grade: 'C+', teacher: '58%', ai: '42%', status: 'Over-graded', insight: 'AI detected recursive logic gaps teacher graded leniently' },
  { name: 'Priya Sharma', grade: 'B', teacher: '70%', ai: '67%', status: 'Aligned', insight: '—' },
  { name: 'Rohan Gupta', grade: 'B-', teacher: '65%', ai: '73%', status: 'Under-graded', insight: 'Untimed performance 73% — teacher tested under time pressure only' },
  { name: 'Kavya Nair', grade: 'A-', teacher: '85%', ai: '81%', status: 'Aligned', insight: '—' },
  { name: 'Aditya Patel', grade: 'B+', teacher: '75%', ai: '55%', status: 'Over-graded', insight: 'Student memorized solutions — AI detected zero transfer learning' },
  { name: 'Sneha Reddy', grade: 'C', teacher: '52%', ai: '68%', status: 'Under-graded', insight: 'Strong fundamentals masked by exam anxiety — untimed score 68%' },
  { name: 'Vikram Kumar', grade: 'A', teacher: '90%', ai: '88%', status: 'Aligned', insight: '—' },
  { name: 'Ananya Singh', grade: 'C-', teacher: '48%', ai: '45%', status: 'Aligned', insight: '—' },
];

export default function AlignmentPage() {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [showReport, setShowReport] = useState(false);

  const handleReassess = (name: string) => {
    toast.success(`Opening re-assessment for ${name}`);
  };

  const handleDownloadReport = () => {
    toast.success("Downloading Dean's Report PDF...");
  };

  return (
    <div className="relative min-h-screen font-plex antialiased overflow-x-hidden bg-brand-bg text-brand-text selection:bg-brand-teal-500/30">
      
      <InstructorSidebar
        activeTab="alignment" 
        isCollapsed={isSidebarCollapsed}
        toggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
      />

      <div className={`transition-all duration-300 ${isSidebarCollapsed ? 'lg:pl-24' : 'lg:pl-72'} flex flex-col min-h-screen`}>
        <InstructorTopbar />

        <main className="flex-1 w-full max-w-[1600px] mx-auto p-4 sm:p-6 lg:p-8 animate-in fade-in slide-in-from-bottom-4 duration-500 overflow-x-hidden">
          
          {/* --- INSTITUTIONAL REPORT VIEW --- */}
          {showReport ? (
            <div className="max-w-5xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20">
              
              {/* Header */}
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                <div>
                  <div className="text-[10px] font-bold text-brand-text-mute font-jetbrains uppercase tracking-widest mb-1.5">TestCrack AI · Institutional Report</div>
                  <h1 className="text-3xl font-bold text-brand-text mb-1">Cohort Placement Readiness</h1>
                  <p className="text-sm text-brand-text-mute font-medium">Spring Cohort 2026</p>
                </div>
                
                <div className="flex flex-col items-end gap-4 w-full md:w-auto">
                  <div className="flex gap-3">
                    <button 
                      onClick={handleDownloadReport}
                      className="flex items-center gap-2 bg-white hover:bg-brand-bg-alt border border-brand-line text-brand-text px-4 py-2.5 rounded-xl font-bold transition-colors shadow-sm"
                    >
                      <Download className="w-4 h-4" /> Export
                    </button>
                    <button 
                      onClick={() => setShowReport(false)} 
                      className="flex items-center gap-2 bg-brand-blue-500 hover:bg-brand-blue-600 text-white px-5 py-2.5 rounded-xl font-bold transition-colors shadow-lg shadow-brand-blue-900/20"
                    >
                      <ArrowLeft className="w-4 h-4" /> Back to Analysis
                    </button>
                  </div>
                  <div className="text-right hidden md:block">
                    <div className="text-4xl font-bold text-brand-text mb-1">65.6%</div>
                    <div className="text-sm font-medium text-brand-text-mute">Placement Ready</div>
                  </div>
                </div>
              </div>

              {/* Stats & Summary */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white border border-brand-line rounded-xl p-8 flex flex-col items-center text-center shadow-sm">
                  <Users className="w-8 h-8 text-brand-blue-600 mb-4" />
                  <div className="text-3xl font-bold text-brand-text mb-1">64</div>
                  <div className="text-xs font-bold text-brand-text-mute font-jetbrains uppercase tracking-widest">Students</div>
                </div>
                <div className="bg-white border border-brand-line rounded-xl p-8 flex flex-col items-center text-center shadow-sm">
                  <TrendingUp className="w-8 h-8 text-emerald-600 mb-4" />
                  <div className="text-3xl font-bold text-emerald-600 mb-1">+18.5%</div>
                  <div className="text-xs font-bold text-brand-text-mute font-jetbrains uppercase tracking-widest">Improvement</div>
                </div>
                <div className="bg-white border border-brand-line rounded-xl p-8 flex flex-col items-center text-center shadow-sm">
                  <UserCheck className="w-8 h-8 text-blue-600 mb-4" />
                  <div className="text-3xl font-bold text-brand-text mb-1">42</div>
                  <div className="text-xs font-bold text-brand-text-mute font-jetbrains uppercase tracking-widest">Ready</div>
                </div>
                <div className="bg-white border border-brand-line rounded-xl p-8 flex flex-col items-center text-center shadow-sm">
                  <Target className="w-8 h-8 text-orange-600 mb-4" />
                  <div className="text-3xl font-bold text-brand-text mb-1">312</div>
                  <div className="text-xs font-bold text-brand-text-mute font-jetbrains uppercase tracking-widest">Interventions</div>
                </div>
              </div>

              <div className="bg-white border border-brand-line rounded-xl p-6 sm:p-8 shadow-sm">
                <h2 className="text-lg font-bold text-brand-text mb-3">Executive Summary</h2>
                <p className="text-brand-text leading-relaxed">
                  64 students averaged 24 sessions each, improving from 48% to 66.5% (<span className="text-emerald-600 font-bold">+18.5%</span>). <strong className="text-brand-text">42 (65.6%)</strong> meet placement thresholds.
                </p>
              </div>

              <div className="bg-white border border-brand-line rounded-xl p-6 sm:p-8 shadow-sm">
                <div className="flex justify-between items-end mb-4">
                  <h2 className="text-lg font-bold text-brand-text">Grading Alignment Quality</h2>
                  <span className="text-2xl font-bold text-brand-teal-600">42%</span>
                </div>
                <div className="w-full bg-brand-line h-4 rounded-full mb-4 overflow-hidden border border-brand-line">
                  <div className="bg-brand-teal-600 h-full rounded-full shadow-sm" style={{ width: '42%' }}></div>
                </div>
              </div>

            </div>
          ) : (
            
            /* --- MAIN DASHBOARD VIEW --- */
            <div className="space-y-6">
              
              {/* Top Action Bar (Replacing the Hero ROI section) */}
              <div className="flex justify-end mb-4">
                <button 
                  onClick={() => setShowReport(true)}
                  className="flex items-center gap-2 bg-brand-blue-500 hover:bg-brand-blue-600 text-white px-5 py-2.5 rounded-xl font-bold transition-colors shadow-lg shadow-brand-blue-900/20 shrink-0"
                >
                  <Download className="w-5 h-5" /> Dean's Report
                </button>
              </div>

              {/* Teacher-AI Calibration Header */}
              <div className="pt-2 mb-2">
                <h2 className="text-xl font-bold flex items-center mb-2 text-brand-text">
                  <Eye className="w-5 h-5 mr-2 text-brand-teal-600" /> Teacher-AI Calibration
                </h2>
                <p className="text-xs text-brand-text max-w-5xl leading-relaxed font-medium">
                  When teacher grades and AI assessments diverge, students receive inconsistent signals about their readiness. Over-grading creates false confidence, under-grading buries hidden talent.
                </p>
              </div>

              <div className="grid grid-cols-2 lg:grid-cols-4 gap-0 bg-white border border-brand-line rounded-xl p-5 divide-x divide-brand-line shadow-sm">
                <div className="text-center px-4">
                  <div className="text-2xl font-bold text-brand-teal-600 mb-1">42%</div>
                  <div className="text-[10px] font-bold text-brand-text-mute font-jetbrains uppercase tracking-widest">Alignment Rate</div>
                </div>
                <div className="text-center px-4">
                  <div className="text-2xl font-bold text-rose-600 mb-1">4</div>
                  <div className="text-[10px] font-bold text-brand-text-mute font-jetbrains uppercase tracking-widest">Over-Graded</div>
                </div>
                <div className="text-center px-4">
                  <div className="text-2xl font-bold text-emerald-600 mb-1">3</div>
                  <div className="text-[10px] font-bold text-brand-text-mute font-jetbrains uppercase tracking-widest">Under-Graded</div>
                </div>
                <div className="text-center px-4">
                  <div className="text-2xl font-bold text-orange-600 mb-1">+5%</div>
                  <div className="text-[10px] font-bold text-brand-text-mute font-jetbrains uppercase tracking-widest">Teacher Bias</div>
                </div>
              </div>

              {/* Critical Over-Graded Students */}
              <div>
                <h3 className="text-sm font-bold text-rose-600 mb-1 flex items-center">
                  <AlertTriangle className="w-4 h-4 mr-2" /> Critical: Over-Graded Students at Risk
                </h3>
                <p className="text-xs text-brand-text-mute mb-4 font-medium">These students scored higher with the teacher than with AI — they may have knowledge gaps masked by lenient grading.</p>
                
                <div className="space-y-2">
                  {overGradedStudents.map((student, idx) => (
                    <div key={idx} className="bg-white border border-brand-line rounded-lg p-3.5 sm:p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 hover:border-brand-line transition-colors shadow-sm">
                      <div className="flex items-center gap-4 flex-1">
                        <h4 className="font-bold text-sm text-brand-text w-32">{student.name}</h4>
                        <div className="text-xs text-brand-text font-medium">
                          Teacher: {student.teacher}% <span className="mx-1 text-brand-text-mute">→</span> AI: {student.ai}% 
                          <span className="text-rose-600 ml-2 font-bold">({student.gap}% gap)</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-4 w-full sm:w-auto justify-between sm:justify-end">
                        <div className="bg-orange-50 text-orange-600 text-[11px] font-bold px-3 py-1.5 rounded border border-orange-200 flex items-center max-w-xs truncate">
                          <Lightbulb className="w-3.5 h-3.5 mr-1.5 flex-shrink-0" /> {student.insight}
                        </div>
                        <button 
                          onClick={() => handleReassess(student.name)}
                          className="flex items-center text-xs font-bold text-brand-text hover:text-brand-teal-600 transition-colors bg-brand-bg-alt border border-brand-line px-3 py-1.5 rounded-md"
                        >
                          Re-assess <ChevronRight className="w-3.5 h-3.5 ml-1" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Hidden Gems Under-Graded Students */}
              <div>
                <h3 className="text-sm font-bold text-emerald-600 mb-1 flex items-center mt-6">
                  <Lightbulb className="w-4 h-4 mr-2" /> Hidden Gems: Under-Graded Students
                </h3>
                <p className="text-xs text-brand-text-mute mb-4 font-medium">AI detected stronger performance than the teacher graded. Consider alternative assessment methods.</p>
                
                <div className="space-y-2">
                  {underGradedStudents.map((student, idx) => (
                    <div key={idx} className="bg-white border border-brand-line rounded-lg p-3.5 sm:p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 hover:border-brand-line transition-colors shadow-sm">
                      <div className="flex items-center gap-4 flex-1">
                        <h4 className="font-bold text-sm text-brand-text w-32">{student.name}</h4>
                        <div className="text-xs text-brand-text font-medium">
                          Teacher: {student.teacher}% <span className="mx-1 text-brand-text-mute">→</span> AI: {student.ai}% 
                          <span className="text-emerald-600 ml-2 font-bold">(+{student.gap}%)</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="bg-emerald-50 text-emerald-600 text-[11px] font-bold px-3 py-1.5 rounded border border-emerald-200 flex items-center">
                          <TrendingUp className="w-3.5 h-3.5 mr-1.5 flex-shrink-0" /> {student.insight}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Full Student Comparison Table */}
              <div className="pt-4">
                <h3 className="text-sm font-bold text-brand-text mb-4">Full Student Comparison</h3>
                <div className="bg-white border border-brand-line rounded-xl overflow-x-auto shadow-sm">
                  <table className="w-full text-left border-collapse min-w-[800px]">
                    <thead>
                      <tr className="border-b border-brand-line text-[10px] font-bold text-brand-text-mute font-jetbrains uppercase tracking-widest bg-brand-bg-alt">
                        <th className="p-4 py-3">STUDENT</th>
                        <th className="p-4 py-3">GRADE</th>
                        <th className="p-4 py-3">TEACHER</th>
                        <th className="p-4 py-3">AI</th>
                        <th className="p-4 py-3">STATUS</th>
                        <th className="p-4 py-3">MISSED INSIGHT</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-brand-line">
                      {tableData.map((row, idx) => (
                        <tr key={idx} className="hover:bg-brand-bg-alt transition-colors">
                          <td className="p-4 text-sm font-bold text-brand-text">{row.name}</td>
                          <td className="p-4 text-sm font-bold text-brand-text">{row.grade}</td>
                          <td className="p-4 text-sm text-brand-text font-medium">{row.teacher}</td>
                          <td className="p-4 text-sm text-brand-text font-medium">{row.ai}</td>
                          <td className="p-4">
                            <span className={`text-[10px] font-bold px-2.5 py-1 rounded-md border ${
                              row.status === 'Over-graded' ? 'bg-rose-50 text-rose-600 border-rose-200' :
                              row.status === 'Under-graded' ? 'bg-emerald-50 text-emerald-600 border-emerald-200' :
                              'bg-brand-line text-brand-text border-brand-line'
                            }`}>
                              {row.status}
                            </span>
                          </td>
                          <td className="p-4 text-xs text-brand-text w-1/3 leading-relaxed font-medium">{row.insight}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

            </div>
          )}

        </main>
      </div>
    </div>
  );
}