import React, { useState } from 'react';
import {
  Search,
  Users,
  BookOpen,
  TrendingUp,
  AlertTriangle,
  Calendar,
  Lightbulb,
  CheckCircle2,
  MoreVertical,
  Plus,
  X,
  Edit,
  UserPlus
} from 'lucide-react';
import { InstituteSidebar } from '../components/InstituteSidebar';
import { InstituteTopbar } from '../components/InstituteTopbar';
import { PageHero, HeroAction } from '../components/shared/primitives';

// --- Tutors Data ---
const availableTutors = [
  "Sarah Khan",
  "Ravi Kumar",
  "Deepak Sharma",
  "Priya Menon"
];

// --- Students Data (Extracted from InstituteStudents) ---
const availableStudents = [
  "Rahul Joshi", "Tushar Kumar", "Kunal Chopra", "Suresh Gupta",
  "Sahil Banerjee", "Aditya Patel", "Pankaj Pandey", "Rajnish Roy",
  "Amit Banerjee", "Vivek Patel", "Arjun Mehta", "Megha Mishra",
  "Lavanya Pillai", "Neha Srinivasan", "Aisha Verma", "Sneha Reddy"
];

// --- Mock Data Initial State ---
const INITIAL_BATCHES = [
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

const categories = ["All", "IELTS", "Spoken English", "Tech Prep"];

export default function InstituteBatches() {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [activeCategory, setActiveCategory] = useState("All");
  const [searchTerm, setSearchTerm] = useState("");

  const [batches, setBatches] = useState(INITIAL_BATCHES);

  // UI States for Menus and Modals
  const [activeDropdown, setActiveDropdown] = useState(null);
  const [isBatchModalOpen, setIsBatchModalOpen] = useState(false);
  const [isAddStudentModalOpen, setIsAddStudentModalOpen] = useState(false);

  // Tracking which batch is being edited/updated
  const [editingBatchId, setEditingBatchId] = useState(null);
  const [selectedStudent, setSelectedStudent] = useState("");

  const [formData, setFormData] = useState({
    name: '',
    category: 'IELTS',
    capacity: '',
    startDate: '',
    endDate: '',
    tutor: ''
  });

  // Dynamic Metrics
  const dynamicMetrics = [
    { title: "Active Batches", value: batches.length.toString(), icon: BookOpen, color: "text-brand-teal-600", bg: "bg-brand-teal-50", border: "border-brand-teal-100" },
    { title: "Total Enrolled", value: batches.reduce((acc, batch) => acc + batch.students, 0).toString(), icon: Users, color: "text-brand-blue-600", bg: "bg-brand-blue-50", border: "border-brand-blue-100" },
    { title: "Avg Improvement", value: "+15%", icon: TrendingUp, color: "text-emerald-600", bg: "bg-emerald-50", border: "border-emerald-100", isPositive: true },
    { title: "At-Risk Students", value: batches.reduce((acc, batch) => acc + batch.atRiskCount, 0).toString(), icon: AlertTriangle, color: "text-rose-600", bg: "bg-rose-50", border: "border-rose-100" },
  ];

  // --- Handlers ---
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const openCreateModal = () => {
    setEditingBatchId(null);
    setFormData({ name: '', category: 'IELTS', capacity: '', startDate: '', endDate: '', tutor: '' });
    setIsBatchModalOpen(true);
  };

  const openEditModal = (batch) => {
    setEditingBatchId(batch.id);
    setFormData({
      name: batch.name,
      category: batch.category,
      capacity: batch.capacity,
      startDate: batch.startDate,
      endDate: batch.endDate,
      tutor: batch.tutor
    });
    setActiveDropdown(null);
    setIsBatchModalOpen(true);
  };

  const openAddStudentModal = (batchId) => {
    setEditingBatchId(batchId);
    setSelectedStudent("");
    setActiveDropdown(null);
    setIsAddStudentModalOpen(true);
  };

  const handleSaveBatch = (e) => {
    e.preventDefault();

    if (editingBatchId) {
      // Update existing batch
      setBatches(batches.map(batch =>
        batch.id === editingBatchId ? { ...batch, ...formData, capacity: parseInt(formData.capacity) } : batch
      ));
    } else {
      // Create new batch
      const newBatch = {
        id: batches.length > 0 ? Math.max(...batches.map(b => b.id)) + 1 : 1,
        ...formData,
        capacity: parseInt(formData.capacity) || 30,
        students: 0,
        atRiskNames: [],
        atRiskCount: 0,
        avgScore: 0,
        improvement: "0%",
        progress: 0,
        sessions: 0,
        avgSessionTime: "0m",
        status: "New"
      };
      setBatches([newBatch, ...batches]);
    }

    setIsBatchModalOpen(false);
  };

  const handleAddStudentSubmit = (e) => {
    e.preventDefault();

    // Increment the student count for the selected batch
    setBatches(batches.map(batch => {
      if (batch.id === editingBatchId) {
        // Prevent exceeding capacity purely for UI logic
        const newStudentCount = batch.students < batch.capacity ? batch.students + 1 : batch.students;
        return { ...batch, students: newStudentCount };
      }
      return batch;
    }));

    setIsAddStudentModalOpen(false);
  };

  // Filter Logic
  const filteredBatches = batches.filter(batch => {
    const matchesCategory = activeCategory === "All" || batch.category === activeCategory;
    const matchesSearch = batch.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          (batch.tutor && batch.tutor.toLowerCase().includes(searchTerm.toLowerCase()));
    return matchesCategory && matchesSearch;
  });

  const getCategoryColor = (category) => {
    switch (category) {
      case 'IELTS': return 'bg-brand-blue-50 text-brand-blue-700 border-brand-blue-200';
      case 'Spoken English': return 'bg-brand-teal-50 text-brand-teal-700 border-brand-teal-200';
      case 'Tech Prep': return 'bg-sky-50 text-sky-700 border-sky-200';
      default: return 'bg-brand-bg-alt text-brand-text border-brand-line';
    }
  };

  return (
    <div className="min-h-screen bg-brand-bg font-plex text-brand-text">

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
          <div className="max-w-7xl mx-auto space-y-6 sm:space-y-8">

            {/* Page Header & Create Button */}
            <PageHero
              eyebrow="Admin Portal"
              title="Batch Management"
              subtitle="Every batch in your institute, with capacity and tutor assignment."
              actions={
                <HeroAction onClick={openCreateModal}>
                  <Plus className="w-3.5 h-3.5" /> Create Batch
                </HeroAction>
              }
            />

            {/* Top Metrics */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {dynamicMetrics.map((metric, idx) => (
                <div key={idx} className="bg-white rounded-xl border border-brand-line p-4 sm:p-5 shadow-sm flex items-center gap-4">
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center shrink-0 border ${metric.bg} ${metric.color} ${metric.border}`}>
                    <metric.icon className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-brand-text-mute">{metric.title}</p>
                    <div className="flex items-baseline gap-2 mt-0.5">
                      <h3 className={`text-2xl font-bold tabular-nums ${metric.isPositive ? 'text-emerald-600' : 'text-brand-text'}`}>
                        {metric.value}
                      </h3>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Filters & Search */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-4 rounded-xl border border-brand-line shadow-sm">
              <div className="flex items-center gap-2 overflow-x-auto pb-2 md:pb-0 no-scrollbar">
                {categories.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setActiveCategory(cat)}
                    className={`px-4 py-2 min-h-[40px] rounded-full text-sm font-semibold transition-all whitespace-nowrap ${
                      activeCategory === cat
                        ? 'bg-brand-teal-600 text-white shadow-sm border border-brand-teal-600'
                        : 'bg-brand-bg-alt text-brand-text hover:bg-brand-teal-50 border border-brand-line'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>

              <div className="relative w-full md:w-72 shrink-0">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-brand-text-mute" />
                <input
                  type="text"
                  placeholder="Search batches or tutors..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-brand-bg-alt border border-brand-line rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-teal-500/20 focus:border-brand-teal-500 transition-all text-sm font-medium text-brand-text placeholder:text-brand-text-mute"
                />
              </div>
            </div>

            {/* Batch List */}
            <div className="space-y-4">
              {filteredBatches.map((batch) => (
                <div key={batch.id} className="bg-white rounded-xl border border-brand-line shadow-sm hover:shadow-md transition-all flex flex-col lg:flex-row overflow-hidden relative">

                  {/* Left Side (Info) */}
                  <div className="p-4 sm:p-6 lg:w-3/5 border-b lg:border-b-0 lg:border-r border-brand-line">
                    <div className="flex items-start justify-between gap-2 mb-3">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className={`font-jetbrains px-2.5 py-1 text-[10px] uppercase tracking-wider font-bold rounded border ${getCategoryColor(batch.category)}`}>
                          {batch.category}
                        </span>
                        {batch.status && (
                          <span className={`font-jetbrains px-2.5 py-1 text-[10px] uppercase tracking-wider font-bold rounded border ${batch.status === 'New' ? 'bg-brand-teal-50 text-brand-teal-700 border-brand-teal-200' : 'bg-amber-50 text-amber-700 border-amber-200'}`}>
                            {batch.status}
                          </span>
                        )}
                      </div>

                      {/* --- FUNCTIONAL DROPDOWN MENU --- */}
                      <div className="relative">
                        <button
                          onClick={() => setActiveDropdown(activeDropdown === batch.id ? null : batch.id)}
                          className="text-brand-text-mute hover:text-brand-text p-2 rounded-md hover:bg-brand-bg-alt transition-colors"
                        >
                          <MoreVertical className="w-5 h-5" />
                        </button>

                        {activeDropdown === batch.id && (
                          <>
                            {/* Overlay to catch clicks outside */}
                            <div
                              className="fixed inset-0 z-10"
                              onClick={() => setActiveDropdown(null)}
                            />
                            <div className="absolute right-0 mt-2 w-48 bg-white border border-brand-line rounded-xl shadow-sm z-20 overflow-hidden py-1 animate-in slide-in-from-top-2 duration-200">
                              <button
                                onClick={() => openEditModal(batch)}
                                className="w-full flex items-center gap-2 px-4 py-2.5 min-h-[40px] text-sm font-medium text-brand-text hover:bg-brand-bg-alt transition-colors"
                              >
                                <Edit className="w-4 h-4 text-brand-text-mute" /> Edit Batch
                              </button>
                              <button
                                onClick={() => openAddStudentModal(batch.id)}
                                className="w-full flex items-center gap-2 px-4 py-2.5 min-h-[40px] text-sm font-medium text-brand-text hover:bg-brand-bg-alt transition-colors"
                              >
                                <UserPlus className="w-4 h-4 text-brand-text-mute" /> Add Students
                              </button>
                            </div>
                          </>
                        )}
                      </div>
                    </div>

                    <h2 className="font-manrope text-lg sm:text-xl font-bold text-brand-text mb-4">{batch.name}</h2>

                    <div className="flex flex-wrap items-center gap-3 sm:gap-4 text-sm text-brand-text-mute mb-6">
                      <div className="flex items-center gap-1.5">
                        <Users className="w-4 h-4 text-brand-text-mute" />
                        <span className="tabular-nums">{batch.students}/{batch.capacity} students</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Calendar className="w-4 h-4 text-brand-text-mute" />
                        <span className="tabular-nums">{batch.startDate} — {batch.endDate}</span>
                      </div>
                    </div>

                    <div className="flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-6">
                      {/* Tutor */}
                      <div className="flex items-center gap-3 bg-brand-bg-alt py-1.5 px-3 rounded-lg border border-brand-line shrink-0">
                        <div className="w-8 h-8 rounded-full bg-brand-teal-100 flex items-center justify-center text-brand-teal-700 font-bold text-xs shrink-0">
                          {batch.tutor ? batch.tutor.split(' ').map(n => n[0]).join('') : '?'}
                        </div>
                        <span className="text-sm font-semibold text-brand-text">{batch.tutor || 'Unassigned'}</span>
                      </div>

                      {/* At Risk Pills */}
                      <div className="flex flex-wrap items-center gap-2">
                        {batch.atRiskNames.map((name, i) => (
                          <span key={i} className="text-xs font-medium px-2.5 py-1 bg-brand-bg-alt text-brand-text-mute rounded-md border border-brand-line">
                            {name}
                          </span>
                        ))}
                        {batch.atRiskCount > 0 && (
                          <span className="text-xs font-bold px-2.5 py-1 bg-rose-50 text-rose-600 rounded-md border border-rose-200">
                            {batch.atRiskCount} at risk
                          </span>
                        )}
                        {batch.atRiskCount === 0 && batch.students > 0 && (
                          <span className="text-xs font-bold px-2.5 py-1 bg-emerald-50 text-emerald-600 rounded-md border border-emerald-200 flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3" /> All on track
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Right Side (Stats Grid) */}
                  <div className="lg:w-2/5 grid grid-cols-1 sm:grid-cols-2 bg-brand-bg-alt/60 divide-y sm:divide-x divide-brand-line">

                    {/* Avg Score */}
                    <div className="p-4 sm:p-5 flex flex-col justify-center">
                      <p className="text-xs font-semibold text-brand-text-mute mb-1">Avg Score</p>
                      <div className="flex items-end gap-2">
                        <h4 className="text-2xl font-bold text-emerald-600 tabular-nums">{batch.avgScore}%</h4>
                      </div>
                      <p className="text-[10px] font-medium text-emerald-600 mt-1">{batch.improvement} improvement</p>
                    </div>

                    {/* Curriculum Progress */}
                    <div className="p-4 sm:p-5 flex flex-col justify-center">
                      <p className="text-xs font-semibold text-brand-text-mute mb-1 flex justify-between">
                        Curriculum Progress
                      </p>
                      <h4 className="text-2xl font-bold text-brand-text mb-2 tabular-nums">{batch.progress}%</h4>
                      <div className="w-full bg-brand-line h-2 rounded-full overflow-hidden">
                        <div className="bg-brand-teal-600 h-full rounded-full" style={{ width: `${batch.progress}%` }} />
                      </div>
                    </div>

                    {/* This Week */}
                    <div className="p-4 sm:p-5 flex flex-col justify-center">
                      <p className="text-xs font-semibold text-brand-text-mute mb-1">This Week</p>
                      <h4 className="text-2xl font-bold text-brand-text tabular-nums">{batch.sessions}</h4>
                      <p className="text-[10px] text-brand-text-mute mt-1">sessions ({batch.avgSessionTime} avg)</p>
                    </div>

                    {/* Capacity */}
                    <div className="p-4 sm:p-5 flex flex-col justify-center">
                      <p className="text-xs font-semibold text-brand-text-mute mb-1 flex justify-between">
                        Capacity
                      </p>
                      <h4 className="text-2xl font-bold text-brand-text mb-2 tabular-nums">
                        {batch.capacity > 0 ? Math.round((batch.students/batch.capacity)*100) : 0}%
                      </h4>
                      <div className="w-full bg-brand-line h-2 rounded-full overflow-hidden">
                        <div
                          className={`${(batch.students/(batch.capacity || 1)) > 0.9 ? 'bg-rose-500' : 'bg-brand-blue-500'} h-full rounded-full`}
                          style={{ width: `${batch.capacity > 0 ? (batch.students/batch.capacity)*100 : 0}%` }}
                        />
                      </div>
                    </div>

                  </div>
                </div>
              ))}
            </div>

            {/* Batch Insights Section Placeholder (Assuming kept unchanged) */}
            <div className="pt-4 pb-12">
               {/* Insight content from previous version remains here... */}
            </div>

          </div>
        </main>
      </div>

      {/* --- CREATE / EDIT BATCH MODAL --- */}
      {isBatchModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-brand-ink/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl border border-brand-line shadow-sm w-full max-w-lg max-h-[90vh] overflow-y-auto animate-in zoom-in-95 duration-200">

            <div className="flex items-center justify-between p-4 sm:p-6 border-b border-brand-line">
              <h2 className="font-manrope text-lg sm:text-xl font-bold text-brand-text">
                {editingBatchId ? 'Edit Batch' : 'Create New Batch'}
              </h2>
              <button
                onClick={() => setIsBatchModalOpen(false)}
                className="p-2 text-brand-text-mute hover:text-brand-text rounded-lg hover:bg-brand-bg-alt transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveBatch} className="p-4 sm:p-6 space-y-4">
              <div>
                <label className="block text-sm font-semibold text-brand-text mb-1.5">Batch Name</label>
                <input
                  type="text"
                  name="name"
                  required
                  value={formData.name}
                  onChange={handleInputChange}
                  placeholder="e.g. IELTS Weekend Intensive"
                  className="w-full px-4 py-2 min-h-[40px] bg-brand-bg-alt border border-brand-line rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-teal-500/20 focus:border-brand-teal-500 text-sm text-brand-text"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-brand-text mb-1.5">Category</label>
                  <select
                    name="category"
                    value={formData.category}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 min-h-[40px] bg-brand-bg-alt border border-brand-line rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-teal-500/20 focus:border-brand-teal-500 text-sm text-brand-text"
                  >
                    <option value="IELTS">IELTS</option>
                    <option value="Spoken English">Spoken English</option>
                    <option value="Tech Prep">Tech Prep</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-brand-text mb-1.5">Capacity</label>
                  <input
                    type="number"
                    name="capacity"
                    min="1"
                    required
                    value={formData.capacity}
                    onChange={handleInputChange}
                    placeholder="e.g. 30"
                    className="w-full px-4 py-2 min-h-[40px] bg-brand-bg-alt border border-brand-line rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-teal-500/20 focus:border-brand-teal-500 text-sm text-brand-text"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-brand-text mb-1.5">Start Date</label>
                  <input
                    type="date"
                    name="startDate"
                    required
                    value={formData.startDate}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 min-h-[40px] bg-brand-bg-alt border border-brand-line rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-teal-500/20 focus:border-brand-teal-500 text-sm text-brand-text"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-brand-text mb-1.5">End Date</label>
                  <input
                    type="date"
                    name="endDate"
                    required
                    value={formData.endDate}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 min-h-[40px] bg-brand-bg-alt border border-brand-line rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-teal-500/20 focus:border-brand-teal-500 text-sm text-brand-text"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-brand-text mb-1.5">Assign Tutor</label>
                <select
                  name="tutor"
                  required
                  value={formData.tutor}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 min-h-[40px] bg-brand-bg-alt border border-brand-line rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-teal-500/20 focus:border-brand-teal-500 text-sm text-brand-text"
                >
                  <option value="" disabled>Select a tutor...</option>
                  {availableTutors.map((tutorName, idx) => (
                    <option key={idx} value={tutorName}>
                      {tutorName}
                    </option>
                  ))}
                </select>
              </div>

              <div className="pt-4 flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-end gap-3 border-t border-brand-line mt-6">
                <button
                  type="button"
                  onClick={() => setIsBatchModalOpen(false)}
                  className="px-4 py-2 min-h-[40px] text-sm font-semibold text-brand-text hover:bg-brand-bg-alt rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 min-h-[40px] bg-brand-teal-600 hover:bg-brand-teal-700 text-white rounded-lg text-sm font-semibold transition-colors shadow-sm"
                >
                  {editingBatchId ? 'Save Changes' : 'Create Batch'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- ADD STUDENT MODAL --- */}
      {isAddStudentModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-brand-ink/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl border border-brand-line shadow-sm w-full max-w-sm max-h-[90vh] overflow-y-auto animate-in zoom-in-95 duration-200">

            <div className="flex items-center justify-between p-4 sm:p-6 border-b border-brand-line">
              <h2 className="font-manrope text-lg sm:text-xl font-bold text-brand-text">Add Student to Batch</h2>
              <button
                onClick={() => setIsAddStudentModalOpen(false)}
                className="p-2 text-brand-text-mute hover:text-brand-text rounded-lg hover:bg-brand-bg-alt transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddStudentSubmit} className="p-4 sm:p-6 space-y-4">
              <div>
                <label className="block text-sm font-semibold text-brand-text mb-1.5">Select Student</label>
                <select
                  required
                  value={selectedStudent}
                  onChange={(e) => setSelectedStudent(e.target.value)}
                  className="w-full px-4 py-2 min-h-[40px] bg-brand-bg-alt border border-brand-line rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-teal-500/20 focus:border-brand-teal-500 text-sm text-brand-text"
                >
                  <option value="" disabled>Select from institute roster...</option>
                  {availableStudents.map((studentName, idx) => (
                    <option key={idx} value={studentName}>
                      {studentName}
                    </option>
                  ))}
                </select>
              </div>

              <div className="pt-4 flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-end gap-3 border-t border-brand-line mt-6">
                <button
                  type="button"
                  onClick={() => setIsAddStudentModalOpen(false)}
                  className="px-4 py-2 min-h-[40px] text-sm font-semibold text-brand-text hover:bg-brand-bg-alt rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 min-h-[40px] bg-brand-teal-600 hover:bg-brand-teal-700 text-white rounded-lg text-sm font-semibold transition-colors shadow-sm"
                >
                  Add to Batch
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
