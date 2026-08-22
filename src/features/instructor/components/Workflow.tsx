import React, { useState } from "react";
import { 
  MessageCircle, Video, Target, AlertTriangle, AlertCircle,
  Copy, Check, X, ChevronRight, Hash, Clock
} from "lucide-react";

// --- Imports from your architecture ---
import { InstructorSidebar } from "./dashboard/InstructorSidebar";
import { InstructorTopbar } from "./dashboard/InstructorTopbar";
import { PremiumModal } from "@/features/payment/components/PremiumModal";

// --- Mock Data ---
const BROADCASTS = [
  {
    id: "sprint",
    title: "Sprint Group",
    icon: <Target className="text-blue-500" size={18} />,
    tag: "18",
    previewText: "Sprint Group Hey Pooja, Kavya, Aditya, Rahul, Karan +18 Cruising! at 92% avg. 🚀 Advanced pr...",
    fullText: "Sprint Group Hey Pooja, Kavya, Aditya, Rahul, Karan +18\nCruising! at 92% avg. 🚀\n\nAdvanced practice sets have been unlocked for your group. Keep up the momentum!",
    studentCount: 23
  },
  {
    id: "foundation",
    title: "Foundation",
    icon: <AlertTriangle className="text-orange-500" size={18} />,
    tag: "11",
    previewText: "Foundation Group Hey Arjun, Sneha, Meera, Nisha, Divya +11, working through tough topics (42% av...",
    fullText: "Foundation Group Hey Arjun, Sneha, Meera, Nisha, Divya +11\nworking through tough topics (42% avg).\n\nDon't worry, we are reviewing these concepts in the next Zoom session.",
    studentCount: 16
  },
  {
    id: "execution",
    title: "Execution Gap",
    icon: <AlertTriangle className="text-yellow-500" size={18} />,
    tag: "19",
    previewText: "Execution Gap Hey Rohan, Vikram, Dev, Siddharth, Amit +19 Knowledge solid (73%) -> build speed...",
    fullText: "Hey Rohan, Vikram, Dev, Siddharth, Amit +19\nKnowledge solid (73%) -> build speed ⚡\n\n🎯 Timed micro-drills (80s/problem)\n🔗 testcrack.in/speed-drills",
    studentCount: 24
  },
  {
    id: "careless",
    title: "Careless Errors",
    icon: <AlertCircle className="text-red-500" size={18} />,
    tag: "23",
    previewText: "Focus Group Hey Ananya, Ishita, Pooja, Riya, Sakshi +23 Precision training (42% avg). 🎯 \"Read...",
    fullText: "Focus Group Hey Ananya, Ishita, Pooja, Riya, Sakshi +23\nPrecision training (42% avg). 🎯\n\n\"Read the question twice before answering.\" Practice set linked below.",
    studentCount: 28
  }
];

const FRICTION_TOPICS = [
  { id: 1, title: "DP (timed)", stats: "100% fail · 33% avg", tag: "Critical" },
  { id: 2, title: "Graphs (timed)", stats: "100% fail · 33% avg", tag: "Critical" },
  { id: 3, title: "Trees (timed)", stats: "100% fail · 33% avg", tag: "Critical" }
];

const AGENDA = [
  { time: "0-2 min", title: "Pulse Check", desc: "Recap common mistakes on DP (timed) 1-5\"" },
  { time: "2-7 min", title: "Deep Dive: DP (timed)", desc: "Common mistake walkthrough (100% fail)", highlight: true },
  { time: "7-10 min", title: "Quick Review", desc: "Graphs (timed) & Trees (timed) - assign self study" }
];

export default function Workflow() {
  // --- Layout State ---
  const [activeTab, setActiveTab] = useState("workflow");
  const [showPremiumModal, setShowPremiumModal] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  // --- Workflow State ---
  const [selectedBroadcast, setSelectedBroadcast] = useState<typeof BROADCASTS[0] | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Handle Copy Action
  const handleCopy = async (text: string, id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation(); // Prevents triggering the card's onClick
    try {
      await navigator.clipboard.writeText(text);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch (err) {
      console.error("Failed to copy text: ", err);
    }
  };

  return (
    <div className="relative min-h-screen font-plex antialiased overflow-x-hidden bg-brand-bg text-brand-text">
      
      {/* Sidebar */}
      <InstructorSidebar 
        activeTab='work'
        onTabChange={setActiveTab} 
        isCollapsed={isSidebarCollapsed}
        toggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
      />

      {/* Main Content Wrapper */}
      <div className={`min-h-screen flex flex-col transition-all duration-300 ${isSidebarCollapsed ? 'lg:pl-20' : 'lg:pl-64'}`}>
        
        {/* Topbar */}
        <InstructorTopbar />

        <main className="flex-1 p-4 sm:p-6 lg:p-8 relative">
          
          <div className="mb-8">
            <h1 className="text-2xl md:text-3xl font-bold text-brand-text transition-colors">Workflow Connectors</h1>
            <p className="text-sm text-brand-text-mute mt-1 transition-colors">WhatsApp broadcast & Zoom classroom bridge</p>
          </div>

          {/* Grid Layout */}
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
            
            {/* LEFT COLUMN: WhatsApp Broadcast */}
            <section className="space-y-4">
              <div className="flex items-center space-x-2 mb-6">
                <div className="bg-green-100 p-2 rounded-lg">
                  <MessageCircle className="text-green-600" size={20} />
                </div>
                <h2 className="text-xl font-bold text-brand-text transition-colors">WhatsApp Broadcast</h2>
              </div>

              <div className="space-y-3">
                {BROADCASTS.map((broadcast) => (
                  <div 
                    key={broadcast.id} 
                    onClick={() => setSelectedBroadcast(broadcast)}
                    className={`p-4 rounded-xl border cursor-pointer transition-all duration-200 ${
                      selectedBroadcast?.id === broadcast.id 
                        ? 'bg-brand-bg-alt border-brand-teal-500 shadow-sm' 
                        : 'bg-white border-brand-line hover:border-brand-line'
                    }`}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex items-center space-x-2">
                        {broadcast.icon}
                        <h3 className="font-semibold text-brand-text transition-colors">{broadcast.title}</h3>
                        <span className="text-xs px-2 py-0.5 rounded-full bg-brand-line text-brand-text-mute transition-colors">
                          {broadcast.tag}
                        </span>
                      </div>
                      
                      <div className="flex space-x-2">
                        <button 
                          className="text-xs font-medium text-brand-text hover:text-brand-teal-600 transition-colors px-3 py-1.5 rounded-md hover:bg-brand-line"
                        >
                          Preview
                        </button>
                        <button 
                          onClick={(e) => handleCopy(broadcast.fullText, broadcast.id, e)}
                          className={`flex items-center space-x-1 text-xs font-medium px-3 py-1.5 rounded-md transition-all ${
                            copiedId === broadcast.id 
                            ? 'bg-emerald-100 text-emerald-600' 
                            : 'bg-brand-line hover:bg-brand-line text-brand-text'
                          }`}
                        >
                          {copiedId === broadcast.id ? <Check size={14} /> : <Copy size={14} />}
                          <span>{copiedId === broadcast.id ? 'Copied' : 'Copy'}</span>
                        </button>
                      </div>
                    </div>
                    <p className="text-sm text-brand-text-mute leading-relaxed truncate transition-colors">
                      {broadcast.previewText}
                    </p>
                  </div>
                ))}
              </div>
            </section>

            {/* RIGHT COLUMN: Zoom Bridge */}
            <section className="space-y-8 lg:pl-4">
              <div className="flex items-center space-x-2 mb-2">
                <div className="bg-blue-100 p-2 rounded-lg">
                  <Video className="text-blue-600" size={20} />
                </div>
                <h2 className="text-xl font-bold text-brand-text transition-colors">Zoom Bridge</h2>
              </div>

              {/* Friction Topics */}
              <div>
                <h3 className="text-sm font-semibold text-brand-text-mute font-jetbrains uppercase tracking-wider mb-4 flex items-center space-x-2 transition-colors">
                  <Target size={16} />
                  <span>Top Friction Topics</span>
                </h3>
                <div className="space-y-3">
                  {FRICTION_TOPICS.map((topic) => (
                    <div key={topic.id} className="flex items-center justify-between p-3 rounded-lg bg-white border border-brand-line transition-colors">
                      <div className="flex items-center space-x-4">
                        <span className="text-xl font-bold text-brand-text-mute">#{topic.id}</span>
                        <div>
                          <p className="font-semibold text-brand-text transition-colors">{topic.title}</p>
                          <p className="text-xs text-brand-text-mute transition-colors">{topic.stats}</p>
                        </div>
                      </div>
                      <span className="text-[10px] font-bold font-jetbrains uppercase tracking-wider text-red-600 border border-red-200 bg-red-50 px-2 py-1 rounded transition-colors">
                        {topic.tag}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Classroom Agenda */}
              <div>
                <h3 className="text-sm font-semibold text-brand-text-mute font-jetbrains uppercase tracking-wider mb-4 flex items-center space-x-2 transition-colors">
                  <Clock size={16} />
                  <span>Classroom Agenda</span>
                </h3>
                <div className="space-y-4 border-l-2 border-brand-line ml-2 pl-4">
                  {AGENDA.map((item, idx) => (
                    <div key={idx} className="relative">
                      {/* Timeline Dot */}
                      <div className={`absolute -left-[21px] top-1.5 w-2 h-2 rounded-full ${item.highlight ? 'bg-red-500 ring-4 ring-red-100' : 'bg-brand-line ring-4 ring-brand-line'}`} />
                      
                      <div className="flex items-start space-x-3">
                        <span className={`text-xs font-bold mt-0.5 min-w-[50px] ${item.highlight ? 'text-red-600' : 'text-emerald-600'}`}>
                          {item.time}
                        </span>
                        <div>
                          <p className={`font-semibold text-sm transition-colors ${item.highlight ? 'text-brand-text' : 'text-brand-text'}`}>
                            {item.title}
                          </p>
                          <p className="text-xs text-brand-text-mute mt-1 transition-colors">{item.desc}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </section>
          </div>

          {/* SLIDE-IN DRAWER (PREVIEW) */}
          <div 
            className={`fixed top-0 right-0 h-full w-full sm:w-[400px] bg-white border-l border-brand-line shadow-2xl transition-transform duration-300 ease-in-out z-50 p-6 flex flex-col ${
              selectedBroadcast ? 'translate-x-0' : 'translate-x-full'
            }`}
          >
            {selectedBroadcast && (
              <>
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-lg font-bold text-brand-text flex items-center gap-2 transition-colors">
                    {selectedBroadcast.icon} "{selectedBroadcast.title}"
                  </h2>
                  <button 
                    onClick={() => setSelectedBroadcast(null)}
                    className="p-2 text-brand-text-mute hover:text-brand-text bg-brand-line hover:bg-brand-line rounded-full transition-colors"
                  >
                    <X size={18} />
                  </button>
                </div>

                <div className="flex-1 overflow-y-auto">
                  <div className="bg-brand-bg-alt border border-brand-line rounded-xl p-5 mb-4 transition-colors">
                    <p className="whitespace-pre-wrap text-sm text-brand-text leading-relaxed font-medium transition-colors">
                      {selectedBroadcast.fullText}
                    </p>
                  </div>
                  
                  <div className="flex items-center space-x-2 text-xs text-brand-text-mute font-medium transition-colors">
                    <Target size={14} />
                    <span>To {selectedBroadcast.studentCount} students in {selectedBroadcast.title}</span>
                  </div>
                </div>

                <div className="mt-4 pt-4 border-t border-brand-line">
                  <button 
                    onClick={(e) => handleCopy(selectedBroadcast.fullText, 'drawer', e)}
                    className={`w-full flex items-center justify-center space-x-2 py-3 rounded-lg font-bold transition-all duration-200 ${
                      copiedId === 'drawer' 
                        ? 'bg-emerald-500 text-white' 
                        : 'bg-brand-teal-600 hover:bg-brand-teal-700 text-white'
                    }`}
                  >
                    {copiedId === 'drawer' ? (
                      <>
                        <Check size={18} />
                        <span>Copied!</span>
                      </>
                    ) : (
                      <>
                        <Copy size={18} />
                        <span>Copy Broadcast Message</span>
                      </>
                    )}
                  </button>
                </div>
              </>
            )}
          </div>

          {/* Background Overlay */}
          {selectedBroadcast && (
            <div 
              className="fixed inset-0 bg-brand-text/20 z-40 transition-opacity"
              onClick={() => setSelectedBroadcast(null)}
            />
          )}

        </main>
      </div>

      <PremiumModal
        isOpen={showPremiumModal}
        onClose={() => setShowPremiumModal(false)}
      />
    </div>
  );
}