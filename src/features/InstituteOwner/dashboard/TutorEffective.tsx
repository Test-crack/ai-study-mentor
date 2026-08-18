import React, { useState } from 'react';
import { Star } from 'lucide-react';

// Adjust these imports to match your actual file structure
import {  InstituteOwnerSidebar} from '../components/InstitiuteOwnerSidebar';
import { InstituteOwnerTopbar } from '../components/InstituteOwnerTopbar';

// --- Mock Data ---
const topMetrics = [
  { title: "Active Tutors", value: "4", subtext: "1 need attention", subtextColor: "text-red-500" },
  { title: "Avg AI Alignment", value: "86%", subtext: "Target: 90%", subtextColor: "text-brand-text-mute" },
  { title: "Avg Rating", value: "4.5", subtext: "Out of 5.0", subtextColor: "text-brand-text-mute" },
  { title: "Avg Improvement", value: "16%", subtext: "Student scores", subtextColor: "text-brand-text-mute" },
];

const tutors = [
  {
    id: 1,
    initials: "SK",
    name: "Sarah Khan",
    details: "IELTS Batch 12, Advanced Writing • 43 students",
    rating: "4.8",
    ratingColor: "text-amber-500",
    avatarColor: "bg-brand-blue-100 text-brand-blue-700",
    needsSupport: false,
    metrics: {
      improvement: "+20%",
      improvementColor: "text-emerald-600",
      alignment: 94,
      alignmentColor: "bg-emerald-500",
      sessions: "12",
      responseTime: "2h",
      responseTimeColor: "text-brand-text",
      retention: "96%",
      retentionColor: "text-emerald-600"
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
    ratingColor: "text-amber-500",
    avatarColor: "bg-brand-warm-tint text-brand-warm",
    needsSupport: false,
    metrics: {
      improvement: "+22%",
      improvementColor: "text-emerald-600",
      alignment: 88,
      alignmentColor: "bg-emerald-500",
      sessions: "10",
      responseTime: "3h",
      responseTimeColor: "text-brand-text",
      retention: "91%",
      retentionColor: "text-emerald-600"
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
    ratingColor: "text-amber-500",
    avatarColor: "bg-brand-teal-100 text-brand-teal-700",
    needsSupport: false,
    metrics: {
      improvement: "+15%",
      improvementColor: "text-emerald-600",
      alignment: 91,
      alignmentColor: "bg-emerald-500",
      sessions: "8",
      responseTime: "1h",
      responseTimeColor: "text-emerald-600",
      retention: "100%",
      retentionColor: "text-emerald-600"
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
    ratingColor: "text-amber-500",
    avatarColor: "bg-brand-purple/10 text-brand-purple",
    needsSupport: true,
    metrics: {
      improvement: "+8%",
      improvementColor: "text-amber-600",
      alignment: 72,
      alignmentColor: "bg-red-500",
      sessions: "6",
      responseTime: "8h",
      responseTimeColor: "text-red-500",
      retention: "82%",
      retentionColor: "text-amber-600"
    },
    strengths: ["Reading strategies"],
    concerns: ["Low engagement", "Attendance issues", "Slow response"]
  }
];

export default function TutorEffective() {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  return (
    <div className="relative min-h-screen font-plex antialiased overflow-x-hidden bg-brand-bg text-brand-text">

      {/* Sidebar */}
      <InstituteOwnerSidebar
        activeTab="tutor-effect" // Adjust this to match your sidebar's active item
        isCollapsed={isSidebarCollapsed}
        toggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
      />

      {/* Main Layout Wrapper */}
      <div className={`relative z-10 transition-all duration-300 ${isSidebarCollapsed ? 'lg:pl-24' : 'lg:pl-72'}`}>

        {/* Topbar */}
        <InstituteOwnerTopbar />

        {/* Main Content */}
        <main className="px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-8 max-w-[90rem] mx-auto pb-16">

            {/* Top Metric Cards */}
            <section className="space-y-4">
              <p className="font-jetbrains text-[11px] font-bold tracking-[0.2em] uppercase text-brand-text-mute px-1">
                Tutor Overview
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {topMetrics.map((metric, idx) => (
                  <div key={idx} className="bg-white border border-brand-line rounded-2xl p-5 shadow-sm">
                    <p className="font-jetbrains text-[10px] font-bold tracking-[0.15em] uppercase text-brand-text-mute mb-2">{metric.title}</p>
                    <h2 className="text-3xl sm:text-4xl font-black text-brand-text mb-2 leading-none">{metric.value}</h2>
                    <p className={`text-xs font-medium ${metric.subtextColor}`}>{metric.subtext}</p>
                  </div>
                ))}
              </div>
            </section>

            {/* Tutors List */}
            <section className="space-y-4">
              <p className="font-jetbrains text-[11px] font-bold tracking-[0.2em] uppercase text-brand-text-mute px-1">
                Tutor Effectiveness
              </p>
              <div className="space-y-6">
              {tutors.map((tutor) => (
                <div key={tutor.id} className="bg-white border border-brand-line rounded-2xl p-5 sm:p-6 shadow-sm">

                  {/* Card Header */}
                  <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4 mb-6">
                    <div className="flex items-center gap-4 min-w-0">
                      <div className={`w-12 h-12 shrink-0 rounded-full flex items-center justify-center font-bold text-lg ${tutor.avatarColor}`}>
                        {tutor.initials}
                      </div>
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="text-lg sm:text-xl font-bold text-brand-text">{tutor.name}</h3>
                          {tutor.needsSupport && (
                            <span className="text-[10px] font-semibold text-red-600 bg-red-50 px-2 py-0.5 rounded-full border border-red-200">
                              ⚠️ Needs Support
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-brand-text-mute">{tutor.details}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 font-bold text-lg shrink-0">
                      <Star size={20} className={tutor.ratingColor} fill="currentColor" />
                      <span className="text-brand-text">{tutor.rating}</span>
                    </div>
                  </div>

                  {/* Metrics Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-5 sm:gap-6 mb-6">
                    <div>
                      <p className="font-jetbrains text-[10px] font-bold tracking-[0.15em] uppercase text-brand-text-mute mb-1">Improvement</p>
                      <p className={`text-2xl font-bold ${tutor.metrics.improvementColor}`}>{tutor.metrics.improvement}</p>
                    </div>
                    <div>
                      <p className="font-jetbrains text-[10px] font-bold tracking-[0.15em] uppercase text-brand-text-mute mb-1">AI Alignment</p>
                      <p className="text-2xl font-bold text-brand-text mb-2">{tutor.metrics.alignment}%</p>
                      <div className="w-full bg-brand-bg-alt rounded-full h-1">
                        <div
                          className={`h-1 rounded-full ${tutor.metrics.alignmentColor}`}
                          style={{ width: `${tutor.metrics.alignment}%` }}
                        ></div>
                      </div>
                    </div>
                    <div>
                      <p className="font-jetbrains text-[10px] font-bold tracking-[0.15em] uppercase text-brand-text-mute mb-1">Sessions/Week</p>
                      <p className="text-2xl font-bold text-brand-text">{tutor.metrics.sessions}</p>
                    </div>
                    <div>
                      <p className="font-jetbrains text-[10px] font-bold tracking-[0.15em] uppercase text-brand-text-mute mb-1">Response Time</p>
                      <p className={`text-2xl font-bold ${tutor.metrics.responseTimeColor}`}>{tutor.metrics.responseTime}</p>
                    </div>
                    <div>
                      <p className="font-jetbrains text-[10px] font-bold tracking-[0.15em] uppercase text-brand-text-mute mb-1">Retention</p>
                      <p className={`text-2xl font-bold ${tutor.metrics.retentionColor}`}>{tutor.metrics.retention}</p>
                    </div>
                  </div>

                  {/* Tags / Badges */}
                  <div className="flex flex-col sm:flex-row gap-6 border-t border-brand-line pt-4">
                    {tutor.strengths.length > 0 && (
                      <div>
                        <p className="font-jetbrains text-[10px] font-bold tracking-[0.15em] uppercase text-brand-text-mute mb-2">Strengths</p>
                        <div className="flex flex-wrap gap-2">
                          {tutor.strengths.map((strength, i) => (
                            <span key={i} className="text-xs font-medium text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
                              {strength}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {tutor.concerns.length > 0 && (
                      <div>
                        <p className="font-jetbrains text-[10px] font-bold tracking-[0.15em] uppercase text-brand-text-mute mb-2">Concerns</p>
                        <div className="flex flex-wrap gap-2">
                          {tutor.concerns.map((concern, i) => (
                            <span key={i} className="text-xs font-medium text-red-600 bg-red-50 px-2.5 py-1 rounded-full border border-red-200">
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
            </section>

        </main>
      </div>
    </div>
  );
}
