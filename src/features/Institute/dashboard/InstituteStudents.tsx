import React, { useState } from 'react';
import { 
  Search, 
  Users, 
  TrendingUp, 
  AlertTriangle, 
  Target,
  Clock,
  ChevronDown,
  CheckCircle2
} from 'lucide-react';
import { InstituteSidebar } from '../components/InstituteSidebar';
import { InstituteTopbar } from '../components/InstituteTopbar';

// --- Mock Data ---
const topMetrics = [
  { title: "Total", value: "64", icon: Users, color: "text-slate-600 dark:text-slate-400", bg: "bg-slate-100 dark:bg-slate-800" },
  { title: "Top Performers", value: "20", icon: TrendingUp, color: "text-emerald-600 dark:text-emerald-400", bg: "bg-emerald-100 dark:bg-emerald-900/30" },
  { title: "At Risk", value: "18", icon: AlertTriangle, color: "text-rose-600 dark:text-rose-400", bg: "bg-rose-100 dark:bg-rose-900/30" },
  { title: "Avg Accuracy", value: "60%", icon: Target, color: "text-blue-600 dark:text-blue-400", bg: "bg-blue-100 dark:bg-blue-900/30" },
  { title: "Avg Time/Q", value: "56s", icon: Clock, color: "text-amber-600 dark:text-amber-400", bg: "bg-amber-100 dark:bg-amber-900/30" },
];

const filters = ["All", "At Risk", "Top", "Conceptual", "Tactical", "Psychological"];

type Student = {
  id: string;
  name: string;
  batchName: string;
  tutor: string;
  accuracy: number;
  hesitation: number;
  avgTime: number;
  struggle: 'Conceptual' | 'Tactical' | 'Psychological';
  status: 'Excelling' | 'On Track' | 'At Risk';
};

const studentsData: Student[] = [
  { id: '1', name: "Rahul Joshi", batchName: "IELTS Band 7+", tutor: "Sarah Khan", accuracy: 95, hesitation: 8, avgTime: 39, struggle: "Psychological", status: "Excelling" },
  { id: '2', name: "Tushar Kumar", batchName: "IELTS Band 7+", tutor: "Sarah Khan", accuracy: 92, hesitation: 15, avgTime: 39, struggle: "Tactical", status: "Excelling" },
  { id: '3', name: "Kunal Chopra", batchName: "Tech Interview Prep", tutor: "Deepak Sharma", accuracy: 91, hesitation: 9, avgTime: 31, struggle: "Conceptual", status: "Excelling" },
  { id: '4', name: "Suresh Gupta", batchName: "IELTS Band 7+", tutor: "Sarah Khan", accuracy: 90, hesitation: 24, avgTime: 36, struggle: "Conceptual", status: "Excelling" },
  { id: '5', name: "Sahil Banerjee", batchName: "IELTS Band 7+", tutor: "Sarah Khan", accuracy: 90, hesitation: 25, avgTime: 23, struggle: "Tactical", status: "Excelling" },
  { id: '6', name: "Aditya Patel", batchName: "IELTS Band 7+", tutor: "Sarah Khan", accuracy: 89, hesitation: 16, avgTime: 23, struggle: "Tactical", status: "Excelling" },
  { id: '7', name: "Pankaj Pandey", batchName: "IELTS Band 7+", tutor: "Sarah Khan", accuracy: 89, hesitation: 20, avgTime: 29, struggle: "Conceptual", status: "Excelling" },
  { id: '8', name: "Rajnish Roy", batchName: "IELTS Band 7+", tutor: "Sarah Khan", accuracy: 86, hesitation: 5, avgTime: 31, struggle: "Psychological", status: "Excelling" },
  { id: '9', name: "Amit Banerjee", batchName: "Tech Interview Prep", tutor: "Deepak Sharma", accuracy: 85, hesitation: 49, avgTime: 61, struggle: "Conceptual", status: "On Track" },
  { id: '10', name: "Vivek Patel", batchName: "Tech Interview Prep", tutor: "Deepak Sharma", accuracy: 84, hesitation: 56, avgTime: 96, struggle: "Psychological", status: "On Track" },
  { id: '11', name: "Arjun Mehta", batchName: "IELTS Band 7+", tutor: "Sarah Khan", accuracy: 42, hesitation: 45, avgTime: 68, struggle: "Conceptual", status: "At Risk" },
  { id: '12', name: "Megha Mishra", batchName: "Spoken English - Morning", tutor: "Ravi Kumar", accuracy: 41, hesitation: 51, avgTime: 81, struggle: "Tactical", status: "At Risk" },
  { id: '13', name: "Lavanya Pillai", batchName: "IELTS Evening", tutor: "Priya Menon", accuracy: 41, hesitation: 10, avgTime: 33, struggle: "Conceptual", status: "At Risk" },
  { id: '14', name: "Neha Srinivasan", batchName: "IELTS Evening", tutor: "Priya Menon", accuracy: 40, hesitation: 15, avgTime: 35, struggle: "Conceptual", status: "At Risk" },
  { id: '15', name: "Aisha Verma", batchName: "IELTS Evening", tutor: "Priya Menon", accuracy: 38, hesitation: 15, avgTime: 26, struggle: "Tactical", status: "At Risk" },
  { id: '16', name: "Sneha Reddy", batchName: "Spoken English - Morning", tutor: "Ravi Kumar", accuracy: 27, hesitation: 61, avgTime: 83, struggle: "Conceptual", status: "At Risk" },
];

export default function InstituteStudents() {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [activeFilter, setActiveFilter] = useState("All");
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState("Accuracy");
  const [isSortOpen, setIsSortOpen] = useState(false);

  // Styling Helpers
  const getStruggleStyle = (struggle: string) => {
    switch (struggle) {
      case 'Conceptual': return 'text-rose-600 bg-rose-50 border-rose-200 dark:text-rose-400 dark:bg-rose-500/10 dark:border-rose-500/20';
      case 'Tactical': return 'text-amber-600 bg-amber-50 border-amber-200 dark:text-amber-400 dark:bg-amber-500/10 dark:border-amber-500/20';
      case 'Psychological': return 'text-purple-600 bg-purple-50 border-purple-200 dark:text-purple-400 dark:bg-purple-500/10 dark:border-purple-500/20';
      default: return 'text-slate-600 bg-slate-50 border-slate-200 dark:text-slate-400 dark:bg-slate-800 dark:border-slate-700';
    }
  };

  const getStatusStyle = (status: string) => {
    switch (status) {
      case 'Excelling': return 'text-emerald-700 bg-emerald-50 border-emerald-200 dark:text-emerald-400 dark:bg-emerald-500/10 dark:border-emerald-500/20';
      case 'At Risk': return 'text-rose-700 bg-rose-50 border-rose-200 dark:text-rose-400 dark:bg-rose-500/10 dark:border-rose-500/20';
      case 'On Track': return 'text-slate-700 bg-slate-50 border-slate-200 dark:text-slate-300 dark:bg-slate-800 dark:border-slate-700';
      default: return '';
    }
  };

  const getAccuracyColor = (acc: number) => {
    if (acc >= 80) return 'text-emerald-600 dark:text-emerald-400';
    if (acc < 60) return 'text-rose-600 dark:text-rose-400';
    return 'text-slate-900 dark:text-slate-100';
  };

  // Filter & Sort Logic
  const processedStudents = studentsData
    .filter(student => {
      // Search
      if (searchTerm && !student.name.toLowerCase().includes(searchTerm.toLowerCase()) && !student.batchName.toLowerCase().includes(searchTerm.toLowerCase())) return false;
      // Tabs
      if (activeFilter === "All") return true;
      if (activeFilter === "At Risk") return student.status === "At Risk";
      if (activeFilter === "Top") return student.status === "Excelling";
      if (activeFilter === "Conceptual") return student.struggle === "Conceptual";
      if (activeFilter === "Tactical") return student.struggle === "Tactical";
      if (activeFilter === "Psychological") return student.struggle === "Psychological";
      return true;
    })
    .sort((a, b) => {
      if (sortBy === "Accuracy") return b.accuracy - a.accuracy; // Descending
      if (sortBy === "Name") return a.name.localeCompare(b.name); // Alphabetical
      return 0;
    });

  return (
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-slate-950 font-sans text-slate-900 dark:text-slate-200 transition-colors duration-300">
      
      {/* Sidebar */}
      <div className="hidden lg:block">
        <InstituteSidebar 
          activeTab="students" 
          isCollapsed={isSidebarCollapsed} 
          toggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)} 
        />
      </div>

      <div className={`transition-all duration-300 flex flex-col min-h-screen ${isSidebarCollapsed ? 'lg:pl-20' : 'lg:pl-64'}`}>
        
        <InstituteTopbar />

        <main className="flex-1 p-4 sm:p-6 lg:p-8">
          <div className="max-w-[1400px] mx-auto space-y-6">
            
            {/* Top Metrics */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
              {topMetrics.map((metric, idx) => (
                <div key={idx} className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-4 shadow-sm flex flex-col items-center justify-center text-center transition-colors">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center mb-2 ${metric.bg}`}>
                    <metric.icon className={`w-5 h-5 ${metric.color}`} />
                  </div>
                  <p className="text-xs font-medium text-slate-500 dark:text-slate-400">{metric.title}</p>
                  <h3 className="text-xl font-bold text-slate-900 dark:text-white mt-0.5">{metric.value}</h3>
                </div>
              ))}
            </div>

            {/* Controls Row (Search, Filters, Sort) */}
            <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4">
              
              {/* Search */}
              <div className="relative w-full xl:w-64 shrink-0">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input 
                  type="text" 
                  placeholder="Search students..." 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-sm font-medium text-slate-700 dark:text-slate-200 placeholder:text-slate-400 shadow-sm"
                />
              </div>

              {/* Filter Tabs */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-2 xl:pb-0 no-scrollbar w-full xl:justify-center">
                {filters.map((filter) => (
                  <button
                    key={filter}
                    onClick={() => setActiveFilter(filter)}
                    className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all whitespace-nowrap ${
                      activeFilter === filter 
                        ? 'bg-indigo-600 text-white shadow-sm' 
                        : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800'
                    }`}
                  >
                    {filter}
                  </button>
                ))}
              </div>

              {/* Sort Dropdown */}
              <div className="relative shrink-0 self-start xl:self-auto">
                <button 
                  onClick={() => setIsSortOpen(!isSortOpen)}
                  className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-sm font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors shadow-sm"
                >
                  Sort: {sortBy} <ChevronDown className="w-4 h-4 text-slate-400" />
                </button>
                
                {isSortOpen && (
                  <>
                    <div className="fixed inset-0 z-10" onClick={() => setIsSortOpen(false)}></div>
                    <div className="absolute right-0 mt-2 w-40 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg shadow-xl z-20 overflow-hidden">
                      {['Accuracy', 'Name'].map((option) => (
                        <button
                          key={option}
                          onClick={() => { setSortBy(option); setIsSortOpen(false); }}
                          className={`w-full text-left px-4 py-2.5 text-sm hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors ${sortBy === option ? 'text-indigo-600 dark:text-indigo-400 font-semibold bg-indigo-50/50 dark:bg-indigo-500/10' : 'text-slate-700 dark:text-slate-300'}`}
                        >
                          Sort: {option}
                        </button>
                      ))}
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Students Table */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm overflow-hidden transition-colors">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400 text-[11px] uppercase tracking-wider font-semibold border-b border-slate-200 dark:border-slate-800">
                    <tr>
                      <th className="px-6 py-4">Student</th>
                      <th className="px-6 py-4">Batch</th>
                      <th className="px-6 py-4 text-center">Accuracy</th>
                      <th className="px-6 py-4 text-center">Hesitation</th>
                      <th className="px-6 py-4 text-center">Avg Time</th>
                      <th className="px-6 py-4 text-center">Struggle</th>
                      <th className="px-6 py-4 text-center">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 text-sm">
                    {processedStudents.map((student) => (
                      <tr key={student.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-colors">
                        <td className="px-6 py-4 font-semibold text-slate-900 dark:text-white whitespace-nowrap">
                          {student.name}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <p className="font-medium text-slate-800 dark:text-slate-200">{student.batchName}</p>
                          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">{student.tutor}</p>
                        </td>
                        <td className={`px-6 py-4 text-center font-bold ${getAccuracyColor(student.accuracy)}`}>
                          {student.accuracy}%
                        </td>
                        <td className="px-6 py-4 text-center text-slate-600 dark:text-slate-400">
                          {student.hesitation}%
                        </td>
                        <td className="px-6 py-4 text-center text-slate-600 dark:text-slate-400">
                          {student.avgTime}s
                        </td>
                        <td className="px-6 py-4 text-center">
                          <span className={`inline-flex px-2.5 py-1 text-[10px] font-bold border rounded-md uppercase tracking-wider ${getStruggleStyle(student.struggle)}`}>
                            {student.struggle}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <span className={`inline-flex px-2.5 py-1 text-[10px] font-bold border rounded-md uppercase tracking-wider ${getStatusStyle(student.status)}`}>
                            {student.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                    {processedStudents.length === 0 && (
                      <tr>
                        <td colSpan={7} className="px-6 py-12 text-center text-slate-500 dark:text-slate-400">
                          No students found matching your criteria.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Institute Struggle Distribution Section */}
            <div className="pt-6">
              <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-6">Institute Struggle Distribution</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                
                {/* Conceptual */}
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-sm transition-colors">
                  <div className="flex justify-between items-end mb-3">
                    <h3 className="text-base font-bold text-slate-900 dark:text-white">Conceptual</h3>
                    <div className="text-right">
                      <span className="text-lg font-bold text-slate-900 dark:text-white">21</span>
                      <span className="text-sm text-slate-500 ml-1">(33%)</span>
                    </div>
                  </div>
                  <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden mb-4">
                    <div className="bg-rose-500 h-full rounded-full" style={{ width: '33%' }}></div>
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                    These students have knowledge gaps. They need teaching — concept maps, visual aids, or scaffolded problem sets.
                  </p>
                </div>

                {/* Tactical */}
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-sm transition-colors">
                  <div className="flex justify-between items-end mb-3">
                    <h3 className="text-base font-bold text-slate-900 dark:text-white">Tactical</h3>
                    <div className="text-right">
                      <span className="text-lg font-bold text-slate-900 dark:text-white">22</span>
                      <span className="text-sm text-slate-500 ml-1">(34%)</span>
                    </div>
                  </div>
                  <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden mb-4">
                    <div className="bg-amber-500 h-full rounded-full" style={{ width: '34%' }}></div>
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                    These students know the concepts but pick wrong approaches. They need practice — method selection drills and pattern recognition.
                  </p>
                </div>

                {/* Psychological */}
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-sm transition-colors">
                  <div className="flex justify-between items-end mb-3">
                    <h3 className="text-base font-bold text-slate-900 dark:text-white">Psychological</h3>
                    <div className="text-right">
                      <span className="text-lg font-bold text-slate-900 dark:text-white">21</span>
                      <span className="text-sm text-slate-500 ml-1">(33%)</span>
                    </div>
                  </div>
                  <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden mb-4">
                    <div className="bg-purple-500 h-full rounded-full" style={{ width: '33%' }}></div>
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                    These students know the material but freeze under pressure. They need coaching — progressive exposure and confidence building.
                  </p>
                </div>

              </div>
            </div>

          </div>
        </main>
      </div>
    </div>
  );
}