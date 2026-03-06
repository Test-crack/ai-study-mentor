import  { useState, useRef, useEffect } from 'react';
import { 
  CheckCircle2, 
  Sparkles, 
  ArrowRight, 
  ChevronLeft, 
  MessageSquare,
  Send,
  Upload,
  BrainCircuit,
  Target,
  GraduationCap,
  Loader2,
  AlertCircle
} from 'lucide-react';

// Sidebar & Topbar Imports
import { StudentSidebar } from './dashboard/StudentSidebar';
import { StudentTopbar } from './dashboard/StudentTopbar';
import { PremiumModal } from "@/features/payment/components/PremiumModal";
import { cn } from "@/shared/utils";

// --- Mock Data ---
const curriculumData = [
  {
    id: 1,
    week: "WK 1-2",
    title: "Arrays & Linked Lists",
    subtitle: "8 AI practices available",
    content: "Arrays are contiguous blocks of memory that store elements of the same type. Key operations: access O(1), search O(n), insert O(n), delete O(n). Dynamic arrays (like ArrayList) resize when capacity is exceeded.\n\nLinked Lists use nodes with pointers. Singly linked: each node points to next. Doubly linked: points to both next and prev. Key advantage: O(1) insertion/deletion at known positions.\n\nPractice: Implement reverse a linked list, detect cycle (Floyd's algorithm), merge two sorted lists."
  },
  { id: 2, week: "WK 3-4", title: "Stacks, Queues & Hashing", subtitle: "6 AI practices available", content: "Understanding LIFO and FIFO structures. Hash table implementations and collision resolution techniques." },
  { id: 3, week: "WK 5-6", title: "Trees & Binary Search Trees", subtitle: "8 AI practices available", content: "Tree traversals, BST properties, and self-balancing trees like AVL and Red-Black trees." },
  { id: 4, week: "WK 7-8", title: "Graphs & Shortest Path", subtitle: "10 AI practices available", content: "Graph representations, BFS, DFS, Dijkstra's, and Bellman-Ford algorithms." },
  { id: 5, week: "WK 9-10", title: "Dynamic Programming", subtitle: "12 AI practices available", content: "Memoization vs Tabulation. Solving classic DP problems like Knapsack and Longest Common Subsequence." },
  { id: 6, week: "WK 11-12", title: "Sorting & Complexity Analysis", subtitle: "6 AI practices available", content: "Merge sort, Quick sort, Heap sort. Deep dive into Big O, Omega, and Theta notations." },
  { id: 7, week: "WK 13-14", title: "Revision & Mock Exams", subtitle: "2 AI practices available", content: "Comprehensive review and simulated technical interviews." }
];

const suggestedPrompts = [
  "What is a BST?",
  "Explain DFS vs BFS",
  "How does DP work?",
  "Time complexity of merge sort?"
];

type ViewState = 'upload' | 'uploading' | 'creating' | 'list' | 'detail' | 'chat';

type ChatMessage = {
  role: 'ai' | 'user';
  text: string;
};

export default function MyCurriculum() {
  // Layout States
const [activeTab, setActiveTab] = useState("my-curriculum");
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [showPremiumModal, setShowPremiumModal] = useState(false);

  // Curriculum States
  const [currentView, setCurrentView] = useState<ViewState>('upload');
  const [selectedTopic, setSelectedTopic] = useState<typeof curriculumData[0] | null>(null);
  
  // File Upload Ref
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Chat States
  const [chatInput, setChatInput] = useState("");
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [showToast, setShowToast] = useState(false);

  // Set initial AI message when entering chat
  useEffect(() => {
    if (currentView === 'chat') {
      setChatMessages([{
        role: 'ai',
        text: `I'm your AI Tutor for Data Structures & Algorithms. I see you're studying **${selectedTopic?.title || 'Arrays & Linked Lists'}**. What would you like to understand better? I'll use the Socratic method — so expect me to challenge your thinking!`
      }]);
      setChatInput("");
      setShowToast(false);
    }
  }, [currentView, selectedTopic]);

  // Handle actual file selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleStartSyllabus(); 
    }
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleStartSyllabus = () => {
    setCurrentView('uploading');
    setTimeout(() => {
      setCurrentView('creating');
      setTimeout(() => {
        setCurrentView('list');
      }, 1500);
    }, 1500);
  };

  const handleStudyClick = (topic: typeof curriculumData[0]) => {
    setSelectedTopic(topic);
    setCurrentView('detail');
  };

  const handleAskClick = (topic?: typeof curriculumData[0]) => {
    if (topic) setSelectedTopic(topic);
    setCurrentView('chat');
  };

  const handleBack = () => {
    if (currentView === 'chat' && selectedTopic) {
      setCurrentView('detail');
    } else {
      setCurrentView('list');
      setSelectedTopic(null);
    }
  };

  const handleSendMessage = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!chatInput.trim()) return;

    setChatMessages(prev => [...prev, { role: 'user', text: chatInput }]);
    setChatInput("");

    setShowToast(true);
    setTimeout(() => setShowToast(false), 3000);
  };

  // --- View Renderers ---

  const renderUploadView = () => (
    <div className="flex flex-col items-center justify-center w-full max-w-4xl mx-auto py-12 animate-in fade-in duration-500">
      <input type="file" ref={fileInputRef} className="hidden" accept=".pdf,.docx,.txt" onChange={handleFileChange} />

      <div className="w-full bg-white dark:bg-[#121214] border border-slate-200 dark:border-slate-800/80 rounded-[2rem] p-8 md:p-12 text-center relative overflow-hidden shadow-xl dark:shadow-2xl transition-colors">
        <BrainCircuit className="absolute -right-16 -top-16 w-80 h-80 text-slate-100 dark:text-slate-800/20 rotate-12 pointer-events-none" />

        <div className="relative z-10 flex flex-col items-center">
          <div className="inline-flex items-center gap-2 bg-violet-50 dark:bg-violet-500/10 text-violet-600 dark:text-violet-400 px-3 py-1.5 rounded-full text-xs font-semibold border border-violet-100 dark:border-violet-500/20 mb-6">
            <Sparkles className="w-3.5 h-3.5" />
            AI Personal Tutor
          </div>

          <h1 className="text-4xl md:text-5xl font-bold mb-4 tracking-tight text-slate-900 dark:text-white">
            Your Syllabus, <span className="text-violet-600 dark:text-violet-500">Your Tutor</span>
          </h1>
          <p className="text-slate-500 dark:text-slate-400 max-w-xl mx-auto mb-10 text-[15px] leading-relaxed">
            Upload your university syllabus and we'll create a personalized AI tutor
            that uses the Socratic method to challenge your reasoning and deepen
            your understanding.
          </p>

          <div 
            onClick={handleUploadClick}
            className="border border-dashed border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 hover:bg-slate-100 dark:hover:bg-slate-800/50 hover:border-violet-500 dark:hover:border-slate-500 transition-all rounded-2xl p-10 max-w-md w-full mx-auto mb-6 cursor-pointer group flex flex-col items-center"
          >
            <div className="w-12 h-12 bg-white dark:bg-slate-800 group-hover:bg-violet-100 dark:group-hover:bg-violet-600/20 rounded-xl flex items-center justify-center mb-4 transition-colors shadow-sm dark:shadow-none">
              <Upload className="w-5 h-5 text-slate-400 group-hover:text-violet-600 dark:group-hover:text-violet-400" />
            </div>
            <h3 className="text-slate-800 dark:text-slate-200 font-semibold mb-1">Upload Your Syllabus</h3>
            <p className="text-slate-500 text-sm">PDF, DOCX, or plain text</p>
          </div>

          <button 
            onClick={handleStartSyllabus}
            className="flex items-center justify-center gap-2 bg-slate-900 dark:bg-slate-800 hover:bg-slate-800 dark:hover:bg-slate-700 text-white px-6 py-3 rounded-xl text-sm font-semibold transition-colors shadow-md"
          >
            <Sparkles className="w-4 h-4" />
            Try with a Demo Syllabus
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full mt-8">
        {[
          { icon: BrainCircuit, title: "AI-Powered Tutor", desc: "Get explanations tailored to your university syllabus topics" },
          { icon: Target, title: "Smart Practice", desc: "Practice questions generated from your course material" },
          { icon: GraduationCap, title: "Exam Prep", desc: "Mock tests aligned with your actual university exam pattern" }
        ].map((feat, i) => (
          <div key={i} className="bg-white dark:bg-[#121214] border border-slate-200 dark:border-slate-800/80 rounded-2xl p-6 flex items-start gap-4 shadow-sm dark:shadow-none transition-colors">
            <div className="w-10 h-10 rounded-xl bg-violet-50 dark:bg-violet-500/10 flex items-center justify-center shrink-0">
              <feat.icon className="w-5 h-5 text-violet-600 dark:text-violet-400" />
            </div>
            <div>
              <h4 className="text-sm font-semibold text-slate-900 dark:text-slate-100 mb-1">{feat.title}</h4>
              <p className="text-xs text-slate-500 leading-relaxed">{feat.desc}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderLoadingView = () => (
    <div className="flex flex-col items-center justify-center h-[60vh] animate-in fade-in duration-300">
      {currentView === 'uploading' ? (
        <>
          <div className="w-16 h-16 bg-violet-100 dark:bg-violet-900/20 rounded-2xl flex items-center justify-center mb-6 border border-violet-200 dark:border-violet-500/20">
            <Loader2 className="w-8 h-8 text-violet-600 dark:text-violet-500 animate-spin" />
          </div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Uploading Syllabus...</h2>
          <p className="text-slate-500 text-sm">Processing CS301_DataStructures_Syllabus.pdf</p>
        </>
      ) : (
        <>
          <div className="w-16 h-16 bg-violet-100 dark:bg-violet-900/20 rounded-2xl flex items-center justify-center mb-6 border border-violet-200 dark:border-violet-500/20 animate-pulse">
            <BrainCircuit className="w-8 h-8 text-violet-600 dark:text-violet-500" />
          </div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Creating Your AI Tutor...</h2>
          <p className="text-slate-500 text-sm">Mapping topics, generating study material</p>
        </>
      )}
    </div>
  );

  const renderListView = () => (
    <div className="max-w-4xl w-full mx-auto space-y-8 animate-in fade-in zoom-in-95 duration-500 py-6">
      <div className="bg-white dark:bg-[#18181B] border border-slate-200 dark:border-slate-800 rounded-2xl p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between shadow-md gap-4 transition-colors">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-green-50 dark:bg-green-500/10 flex items-center justify-center border border-green-100 dark:border-green-500/20 shrink-0">
            <CheckCircle2 className="w-6 h-6 text-green-600 dark:text-green-400" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Your AI Personal Tutor is Ready!</h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">Based on CS301_DataStructures_Syllabus.pdf</p>
          </div>
        </div>
        <button onClick={() => handleAskClick()} className="flex items-center gap-2 bg-violet-600 hover:bg-violet-700 text-white px-5 py-2.5 rounded-xl text-sm font-semibold transition-colors shrink-0 shadow-sm">
          <Sparkles className="w-4 h-4" /> Ask Tutor
        </button>
      </div>

      <div className="flex justify-between items-end">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Curriculum Breakdowns</h1>
        <div className="text-sm text-slate-500 dark:text-slate-400 font-medium">14 weeks · 26 topics</div>
      </div>

      <div className="bg-white dark:bg-[#121214] border border-slate-200 dark:border-slate-800/80 rounded-2xl overflow-hidden shadow-sm transition-colors">
        {curriculumData.map((item, index) => (
          <div key={item.id} className={`group flex flex-col sm:flex-row sm:items-center justify-between p-5 hover:bg-slate-50 dark:hover:bg-[#18181B] transition-colors gap-4 ${index !== curriculumData.length - 1 ? 'border-b border-slate-100 dark:border-slate-800/80' : ''}`}>
            <div className="flex items-center gap-4 sm:gap-6">
              <div className="bg-slate-100 dark:bg-slate-800/50 text-violet-600 dark:text-violet-400 px-3 py-1.5 rounded-lg text-xs font-bold tracking-wider min-w-[80px] text-center border border-slate-200 dark:border-slate-700/50">
                {item.week}
              </div>
              <div>
                <h3 className="text-[15px] font-semibold text-slate-900 dark:text-slate-100 group-hover:text-violet-600 dark:group-hover:text-violet-300 transition-colors">{item.title}</h3>
                <p className="text-[13px] text-slate-500 mt-1">{item.subtitle}</p>
              </div>
            </div>
            <div className="flex items-center gap-2 self-start sm:self-auto pl-[96px] sm:pl-0">
              <button onClick={() => handleStudyClick(item)} className="flex items-center gap-1.5 px-4 py-2 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-sm font-medium transition-colors">
                Study <ArrowRight className="w-4 h-4 text-slate-400 dark:text-slate-500 group-hover:text-slate-600 dark:group-hover:text-slate-300" />
              </button>
              <button onClick={() => handleAskClick(item)} className="flex items-center gap-2 px-4 py-2 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-sm font-medium transition-colors">
                <MessageSquare className="w-4 h-4 text-slate-400 dark:text-slate-500" /> Ask
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderDetailView = () => selectedTopic && (
    <div className="max-w-4xl w-full mx-auto space-y-6 animate-in slide-in-from-right-8 duration-300 py-6">
      <button onClick={handleBack} className="flex items-center gap-2 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white text-sm font-medium transition-colors mb-4">
        <ChevronLeft className="w-4 h-4" /> Back to Curriculum
      </button>

      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
        <div className="space-y-3">
          <span className="inline-block bg-violet-100 dark:bg-violet-500/10 text-violet-700 dark:text-violet-400 px-3 py-1 rounded-md text-xs font-semibold border border-violet-200 dark:border-violet-500/20">
            Week {selectedTopic.week.replace('WK ', '')}
          </span>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100">{selectedTopic.title}</h1>
        </div>
        <button onClick={() => handleAskClick()} className="flex items-center gap-2 bg-violet-600 hover:bg-violet-700 text-white px-5 py-2.5 rounded-xl text-sm font-semibold transition-colors shadow-md shrink-0">
          <Sparkles className="w-4 h-4" /> Ask AI Tutor
        </button>
      </div>

      <div className="bg-white dark:bg-[#121214] border border-slate-200 dark:border-slate-800/80 rounded-2xl p-8 mt-6 shadow-sm transition-colors">
        <div className="text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-line text-[15px]">
          {selectedTopic.content}
        </div>
        <div className="mt-8 pt-6 border-t border-slate-200 dark:border-slate-800/80">
          <button onClick={() => handleAskClick()} className="w-full flex items-center justify-center gap-2 bg-slate-50 dark:bg-slate-800/50 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 py-3.5 rounded-xl text-sm font-medium transition-colors border border-slate-200 dark:border-slate-700/50">
            <Sparkles className="w-4 h-4 text-violet-600 dark:text-violet-400" /> Discuss with AI Tutor
          </button>
        </div>
      </div>
    </div>
  );

  const renderChatView = () => (
    <div className="max-w-3xl w-full mx-auto flex flex-col h-[calc(100vh-8rem)] animate-in fade-in zoom-in-95 duration-300 relative py-4">
      {/* Toast Notification */}
      {showToast && (
        <div className="absolute top-0 left-1/2 -translate-x-1/2 z-50 bg-rose-500/90 border border-rose-500 text-white px-6 py-3 rounded-xl shadow-2xl flex items-center gap-3 animate-in slide-in-from-top-4 fade-in duration-300 whitespace-nowrap">
          <AlertCircle className="w-5 h-5" />
          <span className="text-sm font-medium">Credits exhausted. Please upgrade to continue chatting.</span>
        </div>
      )}

      {/* Chat Header */}
      <div className="flex items-center gap-4 mb-6 shrink-0">
        <button onClick={handleBack} className="flex items-center gap-2 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white text-sm font-medium transition-colors bg-white dark:bg-slate-900 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 shadow-sm">
          <ChevronLeft className="w-4 h-4" /> Back
        </button>
        <div>
          <h1 className="text-lg font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-violet-600 dark:text-violet-500" /> AI Tutor
          </h1>
          <p className="text-xs text-slate-500 font-medium">Socratic Method · Data Course</p>
        </div>
      </div>

      {/* Chat Messages */}
      <div className="flex-1 overflow-y-auto space-y-6 pr-2 pb-4">
        {chatMessages.map((msg, idx) => (
          <div key={idx} className={`flex gap-4 max-w-[85%] animate-in slide-in-from-bottom-2 fade-in ${msg.role === 'user' ? 'ml-auto flex-row-reverse' : ''}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 mt-1 ${msg.role === 'ai' ? 'bg-violet-100 dark:bg-violet-600/20 border border-violet-200 dark:border-violet-500/30' : 'bg-slate-200 dark:bg-slate-700'}`}>
              {msg.role === 'ai' ? <Sparkles className="w-4 h-4 text-violet-600 dark:text-violet-400" /> : <span className="text-[10px] font-bold text-slate-500 dark:text-slate-300">ME</span>}
            </div>
            <div className={`p-4 rounded-2xl text-[15px] leading-relaxed shadow-sm ${msg.role === 'ai' ? 'bg-white dark:bg-[#18181B] border border-slate-200 dark:border-slate-800/80 text-slate-700 dark:text-slate-300 rounded-tl-sm' : 'bg-violet-600 text-white rounded-tr-sm'}`}>
              {msg.text.includes('**') ? <span dangerouslySetInnerHTML={{ __html: msg.text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') }} /> : msg.text}
            </div>
          </div>
        ))}
      </div>

      {/* Chat Input */}
      <div className="pt-4 shrink-0 bg-[#F8FAFC] dark:bg-slate-950">
        <form onSubmit={handleSendMessage} className="relative">
          <input 
            type="text" 
            value={chatInput}
            onChange={(e) => setChatInput(e.target.value)}
            placeholder="Ask about any topic in your curriculum..." 
            className="w-full bg-white dark:bg-[#18181B] border border-slate-300 dark:border-slate-800 text-slate-900 dark:text-slate-100 rounded-xl px-5 py-4 pr-14 outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500 transition-all placeholder:text-slate-400 dark:placeholder:text-slate-600 shadow-sm"
          />
          <button 
            type="submit"
            disabled={!chatInput.trim()}
            className="absolute right-3 top-1/2 -translate-y-1/2 w-8 h-8 bg-violet-600 hover:bg-violet-700 disabled:bg-slate-300 dark:disabled:bg-slate-700 disabled:text-slate-500 rounded-lg flex items-center justify-center transition-colors"
          >
            <Send className="w-4 h-4 text-white ml-[-2px] mt-[2px]" />
          </button>
        </form>
        <div className="flex flex-wrap gap-2 mt-4">
          {suggestedPrompts.map((prompt, idx) => (
            <button 
              key={idx}
              onClick={() => setChatInput(prompt)}
              className="bg-white dark:bg-[#121214] border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 px-4 py-2 rounded-lg text-[13px] transition-colors shadow-sm"
            >
              {prompt}
            </button>
          ))}
        </div>
      </div>
    </div>
  );

  // ==============================
  // MAIN LAYOUT
  // ==============================
  return (
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-slate-950 transition-colors duration-300 font-sans">
      
      {/* Sidebar */}
      <StudentSidebar 
        activeTab={activeTab} 
        onTabChange={setActiveTab} 
        isCollapsed={isSidebarCollapsed}
        toggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
      />

      {/* Main Content Area */}
      <div className={`min-h-screen flex flex-col transition-all duration-300 ${isSidebarCollapsed ? 'lg:pl-20' : 'lg:pl-64'}`}>
        
        {/* Topbar */}
        <StudentTopbar onUpgradeClick={() => setShowPremiumModal(true)} />

        {/* Dynamic Main View */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 flex flex-col">
          {currentView === 'upload' && renderUploadView()}
          {(currentView === 'uploading' || currentView === 'creating') && renderLoadingView()}
          {currentView === 'list' && renderListView()}
          {currentView === 'detail' && renderDetailView()}
          {currentView === 'chat' && renderChatView()}
        </main>
      </div>

      {/* Premium Modal */}
      <PremiumModal
        isOpen={showPremiumModal}
        onClose={() => setShowPremiumModal(false)}
      />
    </div>
  );
}