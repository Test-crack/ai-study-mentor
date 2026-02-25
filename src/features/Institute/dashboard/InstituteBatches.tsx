import React, { useState } from 'react';
import { 
  Search, 
  Users, 
  BookOpen, 
  TrendingUp, 
  AlertTriangle, 
  Calendar, 
  Lightbulb, 
  Clock, 
  User,
  AlertCircle,
  CheckCircle2,
  MoreVertical,
  Plus // Don't forget to import Plus
} from 'lucide-react';
import { InstituteSidebar } from '../components/InstituteSidebar';
import { InstituteTopbar } from '../components/InstituteTopbar';

// --- Mock Data ---
const metrics = [
  { title: "Active Batches", value: "5", icon: BookOpen, color: "text-indigo-600", bg: "bg-indigo-50 dark:bg-indigo-500/10", border: "border-indigo-100 dark:border-indigo-500/20" },
  { title: "Total Enrolled", value: "123", icon: Users, color: "text-blue-600", bg: "bg-blue-50 dark:bg-blue-500/10", border: "border-blue-100 dark:border-blue-500/20" },
  { title: "Avg Improvement", value: "+15%", icon: TrendingUp, color: "text-emerald-600", bg: "bg-emerald-50 dark:bg-emerald-500/10", border: "border-emerald-100 dark:border-emerald-500/20", isPositive: true },
  { title: "At-Risk Students", value: "26", icon: AlertTriangle, color: "text-rose-600", bg: "bg-rose-50 dark:bg-rose-500/10", border: "border-rose-100 dark:border-rose-500/20" },
];

const categories = ["All", "IELTS", "Spoken English", "Tech Prep"];

const batches = [
  {
    id: 1,
    category: "IELTS",
    name: "IELTS Band 7+ Prep",
    students: 28,
    capacity: 30,
    startDate: "2025-01-15",
    endDate: "2026-04-15",
    tutor: "Sarah Khan",
    atRiskNames: ["Priya S.", "Kavya N.", "Amit R."],
    atRiskCount: 3,
    avgScore: 72,
    improvement: "+10%",
    progress: 60,
    sessions: 84,
    avgSessionTime: "25m",
    status: null
  },
  {
    id: 2,
    category: "IELTS",
    name: "IELTS Evening Batch",
    students: 22,
    capacity: 30,
    startDate: "2025-02-10",
    endDate: "2026-06-10",
    tutor: "Priya Menon",
    atRiskNames: ["Karan C.", "Nisha P."],
    atRiskCount: 9,
    avgScore: 58,
    improvement: "+8%",
    progress: 25,
    sessions: 44,
    avgSessionTime: "22m",
    status: null
  },
  {
    id: 3,
    category: "Spoken English",
    name: "Spoken English - Morning",
    students: 35,
    capacity: 40,
    startDate: "2025-01-20",
    endDate: "2025-05-20",
    tutor: "Ravi Kumar",
    atRiskNames: ["Arjun M.", "Sneha R.", "Dev K."],
    atRiskCount: 7,
    avgScore: 65,
    improvement: "+12%",
    progress: 50,
    sessions: 105,
    avgSessionTime: "20m",
    status: null
  },
  {
    id: 4,
    category: "Spoken English",
    name: "Foundation English",
    students: 18,
    capacity: 25,
    startDate: "2025-11-01",
    endDate: "2026-02-28",
    tutor: "Sarah Khan",
    atRiskNames: ["Varun T.", "Megha S."],
    atRiskCount: 5,
    avgScore: 45,
    improvement: "+10%",
    progress: 88,
    sessions: 36,
    avgSessionTime: "15m",
    status: "Ending Soon"
  },
  {
    id: 5,
    category: "Tech Prep",
    name: "Tech Interview Prep",
    students: 20,
    capacity: 25,
    startDate: "2025-02-01",
    endDate: "2025-05-01",
    tutor: "Deepak Sharma",
    atRiskNames: ["Siddharth V.", "Rahul G.", "Ishita M."],
    atRiskCount: 2,
    avgScore: 78,
    improvement: "+22%",
    progress: 63,
    sessions: 60,
    avgSessionTime: "35m",
    status: null
  }
];

export default function InstituteBatches() {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [activeCategory, setActiveCategory] = useState("All");
  const [searchTerm, setSearchTerm] = useState("");

  // Filter Logic
  const filteredBatches = batches.filter(batch => {
    const matchesCategory = activeCategory === "All" || batch.category === activeCategory;
    const matchesSearch = batch.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          batch.tutor.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  // Helper for Category Colors
  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'IELTS': return 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-400 border-blue-200 dark:border-blue-800';
      case 'Spoken English': return 'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-400 border-purple-200 dark:border-purple-800';
      case 'Tech Prep': return 'bg-teal-100 text-teal-700 dark:bg-teal-900/40 dark:text-teal-400 border-teal-200 dark:border-teal-800';
      default: return 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border-slate-200 dark:border-slate-700';
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-slate-950 font-sans text-slate-900 dark:text-slate-200 transition-colors duration-300">
      
      {/* Sidebar */}
      <div className="hidden lg:block">
        <InstituteSidebar 
          activeTab="batches" 
          isCollapsed={isSidebarCollapsed} 
          toggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)} 
        />
      </div>

      <div className={`transition-all duration-300 flex flex-col min-h-screen ${isSidebarCollapsed ? 'lg:pl-20' : 'lg:pl-64'}`}>
        
        <InstituteTopbar />

        <main className="flex-1 p-4 sm:p-6 lg:p-8">
          <div className="max-w-7xl mx-auto space-y-8">
            
            {/* Page Header & Create Button */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Batch Management</h1>
              </div>
              <div className="flex items-center gap-3">
          
                <button className="flex items-center justify-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-semibold transition-colors shadow-sm">
                  <Plus className="w-4 h-4" />
                  Create Batch
                </button>
              </div>
            </div>

            {/* Top Metrics */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {metrics.map((metric, idx) => (
                <div key={idx} className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm flex items-center gap-4 transition-colors">
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center shrink-0 border ${metric.bg} ${metric.color} ${metric.border}`}>
                    <metric.icon className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-500 dark:text-slate-400">{metric.title}</p>
                    <div className="flex items-baseline gap-2 mt-0.5">
                      <h3 className={`text-2xl font-bold ${metric.isPositive ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-900 dark:text-white'}`}>
                        {metric.value}
                      </h3>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Filters & Search */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm transition-colors">
              <div className="flex items-center gap-2 overflow-x-auto pb-2 md:pb-0 no-scrollbar">
                {categories.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setActiveCategory(cat)}
                    className={`px-4 py-2 rounded-full text-sm font-semibold transition-all whitespace-nowrap ${
                      activeCategory === cat 
                        ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20 border border-indigo-600' 
                        : 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
              
              <div className="relative w-full md:w-72 shrink-0">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input 
                  type="text" 
                  placeholder="Search batches or tutors..." 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-sm font-medium text-slate-700 dark:text-slate-200 placeholder:text-slate-400"
                />
              </div>
            </div>

            {/* Batch List */}
            <div className="space-y-4">
              {filteredBatches.map((batch) => (
                <div key={batch.id} className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition-all flex flex-col lg:flex-row overflow-hidden">
                  
                  {/* Left Side (Info) */}
                  <div className="p-6 lg:w-3/5 border-b lg:border-b-0 lg:border-r border-slate-100 dark:border-slate-800">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <span className={`px-2.5 py-1 text-[10px] uppercase tracking-wider font-bold rounded border ${getCategoryColor(batch.category)}`}>
                          {batch.category}
                        </span>
                        {batch.status && (
                          <span className="px-2.5 py-1 text-[10px] uppercase tracking-wider font-bold rounded border bg-orange-100 text-orange-700 border-orange-200 dark:bg-orange-900/30 dark:text-orange-400 dark:border-orange-800">
                            {batch.status}
                          </span>
                        )}
                      </div>
                      <button className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300">
                        <MoreVertical className="w-5 h-5" />
                      </button>
                    </div>

                    <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-4">{batch.name}</h2>
                    
                    <div className="flex flex-wrap items-center gap-4 text-sm text-slate-600 dark:text-slate-400 mb-6">
                      <div className="flex items-center gap-1.5">
                        <Users className="w-4 h-4 text-slate-400" />
                        <span>{batch.students}/{batch.capacity} students</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Calendar className="w-4 h-4 text-slate-400" />
                        <span>{batch.startDate} — {batch.endDate}</span>
                      </div>
                    </div>

                    <div className="flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-6">
                      {/* Tutor */}
                      <div className="flex items-center gap-3 bg-slate-50 dark:bg-slate-800/50 py-1.5 px-3 rounded-lg border border-slate-100 dark:border-slate-800">
                        <div className="w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-900/50 flex items-center justify-center text-indigo-700 dark:text-indigo-400 font-bold text-xs shrink-0">
                          {batch.tutor.split(' ').map(n => n[0]).join('')}
                        </div>
                        <span className="text-sm font-semibold text-slate-900 dark:text-slate-200">{batch.tutor}</span>
                      </div>

                      {/* At Risk Pills */}
                      <div className="flex flex-wrap items-center gap-2">
                        {batch.atRiskNames.map((name, i) => (
                          <span key={i} className="text-xs font-medium px-2.5 py-1 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded-md border border-slate-200 dark:border-slate-700">
                            {name}
                          </span>
                        ))}
                        <span className="text-xs font-bold px-2.5 py-1 bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400 rounded-md border border-rose-200 dark:border-rose-500/20">
                          {batch.atRiskCount} at risk
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Right Side (Stats Grid) */}
                  <div className="lg:w-2/5 grid grid-cols-2 bg-slate-50/50 dark:bg-[#0f1117] divide-x divide-y divide-slate-100 dark:divide-slate-800/50">
                    
                    {/* Avg Score */}
                    <div className="p-5 flex flex-col justify-center">
                      <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">Avg Score</p>
                      <div className="flex items-end gap-2">
                        <h4 className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">{batch.avgScore}%</h4>
                      </div>
                      <p className="text-[10px] font-medium text-emerald-600 dark:text-emerald-400 mt-1">{batch.improvement} improvement</p>
                    </div>

                    {/* Curriculum Progress */}
                    <div className="p-5 flex flex-col justify-center">
                      <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1 flex justify-between">
                        Curriculum Progress
                      </p>
                      <h4 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">{batch.progress}%</h4>
                      <div className="w-full bg-slate-200 dark:bg-slate-700 h-2 rounded-full overflow-hidden">
                        <div className="bg-indigo-600 dark:bg-indigo-500 h-full rounded-full" style={{ width: `${batch.progress}%` }} />
                      </div>
                    </div>

                    {/* This Week */}
                    <div className="p-5 flex flex-col justify-center">
                      <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">This Week</p>
                      <h4 className="text-2xl font-bold text-slate-900 dark:text-white">{batch.sessions}</h4>
                      <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1">sessions ({batch.avgSessionTime} avg)</p>
                    </div>

                    {/* Capacity */}
                    <div className="p-5 flex flex-col justify-center">
                      <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1 flex justify-between">
                        Capacity
                      </p>
                      <h4 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">{Math.round((batch.students/batch.capacity)*100)}%</h4>
                      <div className="w-full bg-slate-200 dark:bg-slate-700 h-2 rounded-full overflow-hidden">
                        <div 
                          className={`${(batch.students/batch.capacity) > 0.9 ? 'bg-rose-500' : 'bg-blue-500'} h-full rounded-full`} 
                          style={{ width: `${(batch.students/batch.capacity)*100}%` }} 
                        />
                      </div>
                    </div>

                  </div>
                </div>
              ))}
            </div>

            {/* Batch Insights & Actions Section */}
            <div className="pt-4">
              <div className="flex items-center gap-2 mb-6">
                <div className="w-8 h-8 rounded-lg bg-indigo-100 dark:bg-indigo-900/40 flex items-center justify-center border border-indigo-200 dark:border-indigo-800">
                  <Lightbulb className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                </div>
                <h2 className="text-xl font-bold text-slate-900 dark:text-white">Batch Insights & Actions</h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                
                {/* Insight 1 - Warning */}
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-sm transition-colors">
                  <h3 className="flex items-center gap-2 font-bold text-rose-700 dark:text-rose-400 mb-3 text-sm">
                    <AlertTriangle className="w-4 h-4" /> IELTS Evening has 9 at-risk students
                  </h3>
                  <p className="text-sm text-slate-600 dark:text-slate-400 mb-4 leading-relaxed">
                    41% of the batch is below target. Tutor Priya Menon may need support or the batch needs restructuring.
                  </p>
                  <div className="space-y-2 bg-slate-50 dark:bg-slate-800/50 p-3 rounded-lg border border-slate-100 dark:border-slate-800">
                    <p className="text-xs text-slate-700 dark:text-slate-300"><span className="font-bold text-slate-900 dark:text-white">Recommendation:</span> Schedule a calibration review with the tutor and consider splitting the batch by level.</p>
                  </div>
                </div>

                {/* Insight 2 - Success */}
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-sm transition-colors">
                  <h3 className="flex items-center gap-2 font-bold text-emerald-700 dark:text-emerald-400 mb-3 text-sm">
                    <TrendingUp className="w-4 h-4" /> Tech Interview Prep is outperforming
                  </h3>
                  <p className="text-sm text-slate-600 dark:text-slate-400 mb-4 leading-relaxed">
                    78% avg score with +22% improvement. Deepak Sharma's methods could be replicated across other batches.
                  </p>
                  <div className="space-y-2 bg-slate-50 dark:bg-slate-800/50 p-3 rounded-lg border border-slate-100 dark:border-slate-800">
                    <p className="text-xs text-slate-700 dark:text-slate-300"><span className="font-bold text-slate-900 dark:text-white">Recommendation:</span> Have Deepak lead a tutor knowledge-sharing session this week.</p>
                  </div>
                </div>

                {/* Insight 3 - Calendar Event */}
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-sm transition-colors">
                  <h3 className="flex items-center gap-2 font-bold text-blue-700 dark:text-blue-400 mb-3 text-sm">
                    <Calendar className="w-4 h-4" /> Foundation English ending Feb 28
                  </h3>
                  <p className="text-sm text-slate-600 dark:text-slate-400 mb-4 leading-relaxed">
                    14/16 modules complete. Plan transition — students can be moved to IELTS or Spoken English batches.
                  </p>
                  <div className="space-y-2 bg-slate-50 dark:bg-slate-800/50 p-3 rounded-lg border border-slate-100 dark:border-slate-800">
                    <p className="text-xs text-slate-700 dark:text-slate-300"><span className="font-bold text-slate-900 dark:text-white">Action:</span> Send batch completion certificates and reassignment recommendations.</p>
                  </div>
                </div>

                {/* Insight 4 - Info */}
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-sm transition-colors">
                  <h3 className="flex items-center gap-2 font-bold text-amber-600 dark:text-amber-500 mb-3 text-sm">
                    <Lightbulb className="w-4 h-4" /> Capacity optimization opportunity
                  </h3>
                  <p className="text-sm text-slate-600 dark:text-slate-400 mb-4 leading-relaxed">
                    IELTS Band 7+ is at 93% capacity (28/30). IELTS Evening is at 73% (22/30). Consider merging or rebalancing.
                  </p>
                  <div className="space-y-2 bg-slate-50 dark:bg-slate-800/50 p-3 rounded-lg border border-slate-100 dark:border-slate-800">
                    <p className="text-xs text-slate-700 dark:text-slate-300"><span className="font-bold text-slate-900 dark:text-white">Savings:</span> Consolidating could save ₹11,000/month in per-student costs.</p>
                  </div>
                </div>

              </div>
            </div>

          </div>
        </main>
      </div>
    </div>
  );
}