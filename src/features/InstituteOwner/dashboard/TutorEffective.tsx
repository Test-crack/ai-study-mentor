import React, { useState } from 'react';
import { Star } from 'lucide-react';

// Adjust these imports to match your actual file structure
import {  InstituteOwnerSidebar} from '../components/InstitiuteOwnerSidebar';
import { InstituteOwnerTopbar } from '../components/InstituteOwnerTopbar';

// --- Mock Data ---
const topMetrics = [
  { title: "Active Tutors", value: "4", subtext: "1 need attention", subtextColor: "text-red-500" },
  { title: "Avg AI Alignment", value: "86%", subtext: "Target: 90%", subtextColor: "text-slate-500 dark:text-gray-400" },
  { title: "Avg Rating", value: "4.5", subtext: "Out of 5.0", subtextColor: "text-slate-500 dark:text-gray-400" },
  { title: "Avg Improvement", value: "16%", subtext: "Student scores", subtextColor: "text-slate-500 dark:text-gray-400" },
];

const tutors = [
  {
    id: 1,
    initials: "SK",
    name: "Sarah Khan",
    details: "IELTS Batch 12, Advanced Writing • 43 students",
    rating: "4.8",
    ratingColor: "text-orange-400",
    avatarColor: "bg-purple-100 text-purple-700 dark:bg-purple-900/50 dark:text-purple-300",
    needsSupport: false,
    metrics: {
      improvement: "+20%",
      improvementColor: "text-emerald-600 dark:text-green-500",
      alignment: 94,
      alignmentColor: "bg-emerald-500 dark:bg-green-500",
      sessions: "12",
      responseTime: "2h",
      responseTimeColor: "text-slate-900 dark:text-white",
      retention: "96%",
      retentionColor: "text-emerald-600 dark:text-green-500"
    },
    strengths: ["Speaking coaching", "Personalized feedback"],
    concerns: []
  },
  {
    id: 2,
    initials: "RK",
    name: "Ravi Kumar",
    details: "Spoken English A • 35 students",
    rating: "4.6",
    ratingColor: "text-orange-400",
    avatarColor: "bg-orange-100 text-orange-700 dark:bg-orange-900/50 dark:text-orange-300",
    needsSupport: false,
    metrics: {
      improvement: "+22%",
      improvementColor: "text-emerald-600 dark:text-green-500",
      alignment: 88,
      alignmentColor: "bg-emerald-500 dark:bg-green-500",
      sessions: "10",
      responseTime: "3h",
      responseTimeColor: "text-slate-900 dark:text-white",
      retention: "91%",
      retentionColor: "text-emerald-600 dark:text-green-500"
    },
    strengths: ["Engagement", "Grammar drills"],
    concerns: ["Late session starts"]
  },
  {
    id: 3,
    initials: "DS",
    name: "Deepak Sharma",
    details: "Tech Prep Batch 5 • 20 students",
    rating: "4.7",
    ratingColor: "text-orange-400",
    avatarColor: "bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300",
    needsSupport: false,
    metrics: {
      improvement: "+15%",
      improvementColor: "text-emerald-600 dark:text-green-500",
      alignment: 91,
      alignmentColor: "bg-emerald-500 dark:bg-green-500",
      sessions: "8",
      responseTime: "1h",
      responseTimeColor: "text-emerald-600 dark:text-green-500",
      retention: "100%",
      retentionColor: "text-emerald-600 dark:text-green-500"
    },
    strengths: ["Technical depth", "Mock interviews"],
    concerns: []
  },
  {
    id: 4,
    initials: "PM",
    name: "Priya Menon",
    details: "IELTS Evening • 22 students",
    rating: "3.9",
    ratingColor: "text-amber-500 dark:text-yellow-500",
    avatarColor: "bg-pink-100 text-pink-700 dark:bg-pink-900/50 dark:text-pink-300",
    needsSupport: true,
    metrics: {
      improvement: "+8%",
      improvementColor: "text-amber-600 dark:text-orange-500",
      alignment: 72,
      alignmentColor: "bg-red-500",
      sessions: "6",
      responseTime: "8h",
      responseTimeColor: "text-red-500",
      retention: "82%",
      retentionColor: "text-amber-600 dark:text-orange-500"
    },
    strengths: ["Reading strategies"],
    concerns: ["Low engagement", "Attendance issues", "Slow response"]
  }
];

export default function TutorEffective() {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  return (
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-[#0a0a0a] font-sans text-slate-900 dark:text-white transition-colors duration-300">
      
      {/* Sidebar */}
      <div className="hidden lg:block">
        <InstituteOwnerSidebar 
          activeTab="tutor-effect" // Adjust this to match your sidebar's active item
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
          <div className="max-w-[1400px] mx-auto space-y-6">
            
            {/* Top Metric Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
              {topMetrics.map((metric, idx) => (
                <div key={idx} className="bg-white dark:bg-[#121214] border border-slate-200 dark:border-[#27272a] rounded-xl p-5 shadow-sm">
                  <p className="text-slate-500 dark:text-gray-400 text-sm mb-1">{metric.title}</p>
                  <h2 className="text-4xl font-bold mb-2">{metric.value}</h2>
                  <p className={`text-xs ${metric.subtextColor}`}>{metric.subtext}</p>
                </div>
              ))}
            </div>

            {/* Tutors List */}
            <div className="space-y-6">
              {tutors.map((tutor) => (
                <div key={tutor.id} className="bg-white dark:bg-[#121214] border border-slate-200 dark:border-[#27272a] rounded-xl p-6 shadow-sm">
                  
                  {/* Card Header */}
                  <div className="flex justify-between items-start mb-6">
                    <div className="flex items-center gap-4">
                      <div className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg ${tutor.avatarColor}`}>
                        {tutor.initials}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="text-xl font-bold text-slate-900 dark:text-white">{tutor.name}</h3>
                          {tutor.needsSupport && (
                            <span className="text-[10px] font-semibold text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-500/10 px-2 py-0.5 rounded-full border border-red-200 dark:border-red-500/20">
                              ⚠️ Needs Support
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-slate-500 dark:text-gray-400">{tutor.details}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 font-bold text-lg">
                      <Star size={20} className={tutor.ratingColor} fill="currentColor" />
                      <span>{tutor.rating}</span>
                    </div>
                  </div>

                  {/* Metrics Grid */}
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-6 mb-6">
                    <div>
                      <p className="text-xs text-slate-500 dark:text-gray-400 mb-1">Improvement</p>
                      <p className={`text-2xl font-bold ${tutor.metrics.improvementColor}`}>{tutor.metrics.improvement}</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500 dark:text-gray-400 mb-1">AI Alignment</p>
                      <p className="text-2xl font-bold text-slate-900 dark:text-white mb-2">{tutor.metrics.alignment}%</p>
                      <div className="w-full bg-slate-100 dark:bg-gray-800 rounded-full h-1">
                        <div 
                          className={`h-1 rounded-full ${tutor.metrics.alignmentColor}`} 
                          style={{ width: `${tutor.metrics.alignment}%` }}
                        ></div>
                      </div>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500 dark:text-gray-400 mb-1">Sessions/Week</p>
                      <p className="text-2xl font-bold text-slate-900 dark:text-white">{tutor.metrics.sessions}</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500 dark:text-gray-400 mb-1">Response Time</p>
                      <p className={`text-2xl font-bold ${tutor.metrics.responseTimeColor}`}>{tutor.metrics.responseTime}</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500 dark:text-gray-400 mb-1">Retention</p>
                      <p className={`text-2xl font-bold ${tutor.metrics.retentionColor}`}>{tutor.metrics.retention}</p>
                    </div>
                  </div>

                  {/* Tags / Badges */}
                  <div className="flex flex-col sm:flex-row gap-6 border-t border-slate-100 dark:border-[#27272a] pt-4">
                    {tutor.strengths.length > 0 && (
                      <div>
                        <p className="text-xs text-slate-500 dark:text-gray-400 mb-2">Strengths</p>
                        <div className="flex flex-wrap gap-2">
                          {tutor.strengths.map((strength, i) => (
                            <span key={i} className="text-xs font-medium text-emerald-700 dark:text-green-400 bg-emerald-50 dark:bg-green-500/10 px-2.5 py-1 rounded-full border border-emerald-200 dark:border-green-500/20">
                              {strength}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    {tutor.concerns.length > 0 && (
                      <div>
                        <p className="text-xs text-slate-500 dark:text-gray-400 mb-2">Concerns</p>
                        <div className="flex flex-wrap gap-2">
                          {tutor.concerns.map((concern, i) => (
                            <span key={i} className="text-xs font-medium text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-500/10 px-2.5 py-1 rounded-full border border-red-200 dark:border-red-500/20">
                              {concern}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                </div>
              ))}
            </div>

          </div>
        </main>
      </div>
    </div>
  );
}