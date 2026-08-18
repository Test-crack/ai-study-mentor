import { useState } from 'react';
import { toast } from "sonner";
import { 
  Target, AlertTriangle, Users, AlertCircle, Download, Share2, 
  BarChart2, PlaySquare, Eye, Lightbulb, X, Copy,
  Briefcase, Github, Linkedin, MapPin, Mail, Loader2, CheckCircle2,
  TrendingUp, Award, ChevronLeft
} from 'lucide-react';
import { InstructorSidebar } from "./dashboard/InstructorSidebar";
import { InstructorTopbar } from "./dashboard/InstructorTopbar";

// --- MOCK DATA ---
const interventionQueue = [
  { id: 1, name: 'Aditya Patel', severity: 'CRITICAL', type: 'Conceptual', sessions: 8, issue: 'Issue: Memorized solutions without understanding — 0% transfer learning', action: 'Recommended Action: Assign novel problem set + 1:1 Socratic review', color: 'red' },
  { id: 2, name: 'Sneha Reddy', severity: 'HIGH', type: 'Psychological', sessions: 12, issue: 'Issue: Strong fundamentals masked by exam anxiety — untimed score 88% vs timed 42%', action: 'Recommended Action: Switch to progressive time pressure: 2x → 1.5x → 1x time limit', color: 'orange' },
  { id: 3, name: 'Dev Das', severity: 'CRITICAL', type: 'Conceptual', sessions: 5, issue: 'Issue: Fundamental gaps in data structures — fails on linked list traversals', action: 'Recommended Action: Back-fill with visual DSA walkthroughs before advancing', color: 'red' },
  { id: 4, name: 'Rahul Joshi', severity: 'HIGH', type: 'Tactical', sessions: 10, issue: 'Issue: Pattern matching without reasoning — fails on novel problems consistently', action: 'Recommended Action: Remove template access, force explain-first-then-code approach', color: 'orange' },
];

const batchData = [
  { name: 'Batch 5 (Current)', students: 26, logic: 58, ready: 48, logicTrend: '+6%', readyTrend: '+13%' },
  { name: 'Batch 4 (Previous)', students: 22, logic: 52, ready: 35 },
  { name: 'Batch 3', students: 16, logic: 48, ready: 30 },
];

const progressTrajectory = [
  { week: 'W1', logic: 38, comm: 42, ready: 18 },
  { week: 'W2', logic: 45, comm: 48, ready: 22 },
  { week: 'W3', logic: 52, comm: 55, ready: 30 },
  { week: 'W4', logic: 60, comm: 62, ready: 45 },
  { week: 'W5', logic: 68, comm: 70, ready: 58 },
  { week: 'W6', logic: 75, comm: 78, ready: 70 },
  { week: 'W7', logic: 82, comm: 85, ready: 82 },
  { week: 'W8', logic: 88, comm: 90, ready: 88 },
];

const profileChartData = [
  { week: 'W1', logic: 40, conf: 45 }, { week: 'W2', logic: 42, conf: 48 },
  { week: 'W3', logic: 48, conf: 52 }, { week: 'W4', logic: 50, conf: 58 },
  { week: 'W5', logic: 55, conf: 60 }, { week: 'W6', logic: 60, conf: 68 },
  { week: 'W7', logic: 65, conf: 70 }, { week: 'W8', logic: 72, conf: 75 },
  { week: 'W9', logic: 78, conf: 80 }, { week: 'W10', logic: 81, conf: 82 },
  { week: 'W11', logic: 85, conf: 86 }, { week: 'W12', logic: 88, conf: 88 },
];

export default function TechPrepPage() {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isGenerated, setIsGenerated] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [hoveredBar, setHoveredBar] = useState<number | null>(null);
  const [profileHoverPoint, setProfileHoverPoint] = useState<number | null>(null);

  const handleGenerateProfile = () => {
    setIsGenerating(true);
    setTimeout(() => {
      setIsGenerating(false);
      setIsGenerated(true);
      toast.success("Profile generated successfully!");
    }, 1500);
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText('https://testcrack.io/profile/kavya-nair');
    toast.success('Profile link copied to clipboard!');
  };

  // Helper function to simulate downloading a file
  const handleDownloadProfile = () => {
    toast.success('Preparing download...');
    
    // Simulate API fetch delay
    setTimeout(() => {
      // Create some dummy data to download
      const profileData = {
        name: "Kavya Nair",
        batch: "Tech Prep Batch 5",
        status: "Interview Ready",
        metrics: {
          logicScore: "94%",
          communication: "82%",
          confidence: "88%"
        },
        strengths: ["Arrays", "Strings", "Binary Search"]
      };

      // Create a Blob from the JSON data
      const blob = new Blob([JSON.stringify(profileData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      
      // Create a temporary anchor tag to trigger the download
      const link = document.createElement('a');
      link.href = url;
      link.download = 'kavya_nair_profile.json'; // In a real app, this might be a .pdf
      document.body.appendChild(link);
      link.click();
      
      // Cleanup
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      toast.success('Download complete!');
    }, 800);
  };

  return (
    <div className="relative min-h-screen font-plex antialiased overflow-x-hidden bg-brand-bg text-brand-text selection:bg-brand-teal-500/30">
      
      <InstructorSidebar
        activeTab="techprep"
        isCollapsed={isSidebarCollapsed}
        toggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
      />

      <div className={`transition-all duration-300 ${isSidebarCollapsed ? 'lg:pl-24' : 'lg:pl-72'} flex flex-col min-h-screen`}>
        <InstructorTopbar />

        <main className="flex-1 w-full max-w-[1600px] mx-auto p-4 sm:p-6 lg:p-8 animate-in fade-in slide-in-from-bottom-4 duration-500 overflow-x-hidden">
          
          {/* --- HIREABILITY CERTIFICATE VIEW --- */}
          {showProfile ? (
            <div className="max-w-5xl mx-auto space-y-6 pb-20">
              
              {/* Profile Header & Actions */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between pb-6 border-b border-brand-line mb-8 gap-4">
                <div className="flex items-center space-x-3 cursor-pointer group" onClick={() => setShowProfile(false)}>
                  <div className="bg-brand-teal-50 p-2 rounded-lg group-hover:bg-brand-teal-100 transition-colors">
                    <ChevronLeft className="w-5 h-5 text-brand-teal-600" />
                  </div>
                  <div>
                    <h2 className="font-bold text-lg text-brand-text leading-tight">Hireability Certificate</h2>
                    <span className="text-xs text-brand-text-mute font-medium">Verified by TestCrack.AI</span>
                  </div>
                </div>
                
                <div className="flex flex-wrap items-center gap-3">
                  <button className="flex items-center text-xs font-bold bg-emerald-50 text-emerald-600 px-3 py-2 rounded-md border border-emerald-200 shadow-sm">
                    <CheckCircle2 className="w-4 h-4 mr-1.5" /> Interview Ready
                  </button>
                  <button onClick={copyToClipboard} className="flex items-center text-sm font-medium text-brand-text hover:text-brand-teal-600 transition-colors bg-white border border-brand-line px-3 py-1.5 rounded-md shadow-sm">
                    <Share2 className="w-4 h-4 mr-2" /> Share
                  </button>
                  <button onClick={handleDownloadProfile} className="flex items-center text-sm font-medium text-brand-text hover:text-brand-teal-600 transition-colors bg-white border border-brand-line px-3 py-1.5 rounded-md shadow-sm">
                    <Download className="w-4 h-4 mr-2" /> PDF
                  </button>
                </div>
              </div>

              {/* Student Header Card */}
              <div className="bg-white border border-brand-line rounded-xl p-6 sm:p-8 flex flex-col md:flex-row justify-between items-start gap-6 shadow-sm">
                <div className="flex items-start space-x-6">
                  <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-xl bg-brand-line border border-brand-line flex flex-col items-center justify-center text-brand-text-mute flex-shrink-0 shadow-inner">
                    <Users className="w-8 h-8 mb-1" />
                    <span className="text-[10px] font-medium">Photo</span>
                  </div>
                  <div className="space-y-3 pt-1">
                    <div>
                      <h1 className="text-2xl sm:text-3xl font-bold mb-1 text-brand-text">Kavya Nair</h1>
                      <p className="text-brand-text-mute text-sm font-medium">Tech Prep Batch 5 • Spring 2026</p>
                    </div>
                    <div className="flex flex-wrap items-center gap-4 text-xs text-brand-text font-medium">
                      <span className="flex items-center"><Mail className="w-3.5 h-3.5 mr-1 text-brand-text-mute" /> kavya-nair@testcrack.io</span>
                      <span className="flex items-center"><MapPin className="w-3.5 h-3.5 mr-1 text-brand-text-mute" /> Bangalore, India</span>
                      <span className="flex items-center hover:text-brand-teal-600 cursor-pointer transition-colors"><Github className="w-3.5 h-3.5 mr-1" /> GitHub</span>
                      <span className="flex items-center hover:text-brand-teal-600 cursor-pointer transition-colors"><Linkedin className="w-3.5 h-3.5 mr-1" /> LinkedIn</span>
                    </div>
                  </div>
                </div>
                
                <div className="text-right w-full md:w-auto flex flex-row md:flex-col justify-between md:justify-start items-center md:items-end">
                  <div className="bg-brand-bg-alt border border-brand-line rounded-lg p-3 sm:p-4 mb-2 min-w-[120px] shadow-sm">
                    <div className="text-[10px] sm:text-xs text-brand-text-mute font-bold tracking-wider mb-1 uppercase">Rank</div>
                    <div className="text-2xl sm:text-3xl font-bold text-brand-text">#12</div>
                  </div>
                  <div className="inline-flex items-center bg-emerald-50 text-emerald-600 px-3 py-1.5 rounded-md text-xs font-bold border border-emerald-200">
                    <CheckCircle2 className="w-3.5 h-3.5 mr-1.5" /> Ready
                  </div>
                </div>
              </div>

              {/* Key Metrics */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
                <div className="bg-white border border-brand-line rounded-xl p-5 sm:p-6 text-center shadow-sm">
                  <div className="text-2xl sm:text-3xl font-bold text-brand-teal-600 mb-1">81%</div>
                  <div className="text-[10px] font-bold text-brand-text-mute font-jetbrains uppercase tracking-widest">Avg Logic Score</div>
                </div>
                <div className="bg-white border border-brand-line rounded-xl p-5 sm:p-6 text-center shadow-sm">
                  <div className="text-2xl sm:text-3xl font-bold text-brand-text mb-1">24</div>
                  <div className="text-[10px] font-bold text-brand-text-mute font-jetbrains uppercase tracking-widest">Sessions Done</div>
                </div>
                <div className="bg-white border border-brand-line rounded-xl p-5 sm:p-6 text-center shadow-sm">
                  <div className="text-2xl sm:text-3xl font-bold text-emerald-600 mb-1">88%</div>
                  <div className="text-[10px] font-bold text-brand-text-mute font-jetbrains uppercase tracking-widest">Confidence</div>
                </div>
                <div className="bg-white border border-brand-line rounded-xl p-5 sm:p-6 text-center shadow-sm">
                  <div className="text-2xl sm:text-3xl font-bold text-brand-text mb-1">4</div>
                  <div className="text-[10px] font-bold text-brand-text-mute font-jetbrains uppercase tracking-widest">Mastered Topics</div>
                </div>
              </div>

              {/* Technical Skills */}
              <div className="bg-white border border-brand-line rounded-xl p-6 shadow-sm">
                <h3 className="text-sm font-bold mb-4 flex items-center text-brand-text">
                  <span className="text-brand-teal-600 mr-2 font-mono font-black">&lt;/&gt;</span> Technical Skills
                </h3>
                <div className="flex flex-wrap gap-2.5">
                  {['JavaScript', 'TypeScript', 'React', 'Node.js', 'PostgreSQL', 'Git', 'REST APIs', 'Data Structures', 'Algorithms'].map((skill) => (
                    <span key={skill} className="px-3 py-1.5 bg-brand-bg-alt border border-brand-line rounded-md text-xs font-semibold text-brand-text">
                      {skill}
                    </span>
                  ))}
                </div>
              </div>

              {/* Strengths & Growth */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white border border-brand-line rounded-xl p-6 shadow-sm">
                  <h3 className="text-sm font-bold mb-5 flex items-center text-emerald-600">
                    <CheckCircle2 className="w-4 h-4 mr-2" /> Top Strengths
                  </h3>
                  <ul className="space-y-3.5">
                    {['Arrays', 'Strings', 'Binary Search', '81% overall accuracy', 'Best topic: Arrays (94%)'].map((item, idx) => (
                      <li key={idx} className="flex items-start text-sm text-brand-text font-medium">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-1.5 mr-3 flex-shrink-0" /> {item}
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="bg-white border border-brand-line rounded-xl p-6 shadow-sm">
                  <h3 className="text-sm font-bold mb-5 flex items-center text-orange-600">
                    <AlertTriangle className="w-4 h-4 mr-2" /> Areas for Growth
                  </h3>
                  <ul className="space-y-3.5">
                    {['Advanced Graph Algorithms', 'Backtracking', 'Weak in Backtracking'].map((item, idx) => (
                      <li key={idx} className="flex items-start text-sm text-brand-text font-medium">
                        <span className="w-1.5 h-1.5 rounded-full bg-orange-500 mt-1.5 mr-3 flex-shrink-0" /> {item}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* 12-Week Progress Chart */}
              <div className="bg-white border border-brand-line rounded-xl p-6 shadow-sm">
                <h3 className="text-sm font-bold mb-6 flex items-center text-brand-text">
                  <TrendingUp className="w-4 h-4 mr-2 text-brand-teal-500" /> 12-Week Progress Chart
                </h3>
                <div className="h-48 w-full relative">
                  <svg viewBox="0 0 100 100" className="w-full h-full overflow-visible" preserveAspectRatio="none">
                    {/* Grid Lines */}
                    {[0, 25, 50, 75, 100].map((y) => (
                      <line key={y} x1="0" y1={y} x2="100" y2={y} className="stroke-brand-line" strokeWidth="0.5" />
                    ))}
                    
                    {/* Logic Line (Indigo) */}
                    <path 
                      d={`M ${profileChartData.map((d, i) => `${(i / 11) * 100},${100 - d.logic}`).join(' L ')}`} 
                      fill="none" className="stroke-brand-teal-500" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" 
                    />
                    
                    {/* Confidence Line (Emerald) */}
                    <path 
                      d={`M ${profileChartData.map((d, i) => `${(i / 11) * 100},${100 - d.conf}`).join(' L ')}`} 
                      fill="none" className="stroke-emerald-500" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" 
                    />
                  </svg>

                  {/* Interactive Points & Tooltips */}
                  <div className="absolute inset-0">
                    {profileChartData.map((d, i) => (
                      <div 
                        key={i} 
                        className="absolute top-0 bottom-0 w-8 -ml-4 flex justify-center group"
                        style={{ left: `${(i / 11) * 100}%` }}
                        onMouseEnter={() => setProfileHoverPoint(i)}
                        onMouseLeave={() => setProfileHoverPoint(null)}
                      >
                        {/* Dots */}
                        <div className="absolute w-2.5 h-2.5 rounded-full bg-white border-2 border-brand-teal-500 z-10 transition-transform group-hover:scale-150" style={{ top: `calc(${100 - d.logic}% - 5px)` }} />
                        <div className="absolute w-2.5 h-2.5 rounded-full bg-white border-2 border-emerald-500 z-10 transition-transform group-hover:scale-150" style={{ top: `calc(${100 - d.conf}% - 5px)` }} />
                        
                        {/* Tooltip */}
                        {profileHoverPoint === i && (
                          <div className="absolute bottom-full mb-4 bg-brand-ink text-white text-[11px] p-2.5 rounded-lg shadow-xl z-20 whitespace-nowrap min-w-[120px] pointer-events-none transform -translate-x-1/2 left-1/2">
                            <div className="font-bold border-b border-brand-line-12 pb-1.5 mb-1.5 text-center">{d.week}</div>
                            <div className="flex justify-between items-center text-brand-teal-300 font-semibold mb-1">
                              <span>Logic Score:</span> <span>{d.logic}</span>
                            </div>
                            <div className="flex justify-between items-center text-emerald-400 font-semibold">
                              <span>Confidence:</span> <span>{d.conf}</span>
                            </div>
                            <div className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 w-2 h-2 bg-brand-ink rotate-45" />
                          </div>
                        )}
                      </div>
                    ))}
                  </div>

                  {/* X-axis labels */}
                  <div className="flex justify-between mt-4 text-[10px] font-bold text-brand-text-mute uppercase px-1">
                    {profileChartData.map(d => <span key={d.week}>{d.week}</span>)}
                  </div>
                </div>
              </div>

              {/* Highlight Reel */}
              <div className="bg-white border border-brand-line rounded-xl p-6 shadow-sm">
                <h3 className="text-sm font-bold mb-5 flex items-center text-orange-600">
                  <PlaySquare className="w-4 h-4 mr-2" /> Highlight Reel
                </h3>
                <div className="space-y-4">
                  {[
                    { title: '"Arrays – Technical Defense"', score: '94/100', text: 'Demonstrated 94% proficiency in Arrays with 25s avg response time and 1 hesitations.' },
                    { title: '"Strings – Technical Defense"', score: '91/100', text: 'Demonstrated 91% proficiency in Strings with 28s avg response time and 1 hesitations.' },
                    { title: '"Binary Search – Technical Defense"', score: '88/100', text: 'Demonstrated 88% proficiency in Binary Search with 30s avg response time and 2 hesitations.' }
                  ].map((item, i) => (
                    <div key={i} className="bg-brand-bg-alt border border-brand-line rounded-xl p-4 sm:p-5 transition-colors hover:border-brand-line">
                      <div className="text-[10px] font-bold text-brand-text-mute font-jetbrains uppercase tracking-widest mb-1">Best Technical Standup #{i + 1}</div>
                      <h4 className="text-sm font-bold text-brand-text mb-1">{item.title}</h4>
                      <div className="text-xs text-brand-teal-600 font-bold mb-2">Logic Score: {item.score}</div>
                      <p className="text-xs text-brand-text font-medium">AI Summary: "{item.text}"</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Mentor Endorsement */}
              <div className="bg-white border border-brand-line rounded-xl p-6 shadow-sm">
                <h3 className="text-sm font-bold mb-4 flex items-center text-brand-text">
                  <Briefcase className="w-4 h-4 mr-2 text-pink-600" /> Mentor Endorsement
                </h3>
                <div className="bg-brand-bg-alt border border-brand-line rounded-xl p-5 sm:p-6 italic text-sm text-brand-text leading-relaxed relative">
                  <span className="text-5xl text-brand-line absolute top-2 left-4 font-serif leading-none">"</span>
                  <p className="relative z-10 pl-8 pt-2 font-medium">Kavya Nair has shown exceptional growth throughout the program. Kavya is a strong performer who defaults to familiar patterns.</p>
                  <div className="mt-4 text-xs font-bold text-brand-text-mute not-italic pl-8">— Deepak Sharma, Bootcamp Instructor</div>
                </div>
              </div>
              
              <div className="text-center text-[10px] font-bold text-brand-text-mute font-jetbrains uppercase tracking-widest pt-8 pb-12">
                Generated by TestCrack.io • 2026/26/26 • Expires 21/5/2026<br/>
                This certificate is AI verified and reflects real assessment data.
              </div>

            </div>
          ) : (
            /* --- MAIN DASHBOARD VIEW --- */
            <div className="space-y-8">
              
              {/* Header Section */}
              <div className="mb-8">
                <h1 className="text-2xl sm:text-3xl font-bold mb-2 flex items-center text-brand-text">
                  <Target className="w-6 h-6 mr-3 text-brand-teal-600" /> Placement Readiness Command
                </h1>
                <p className="text-brand-text-mute text-sm max-w-4xl leading-relaxed">Know exactly which students are interview-ready, who needs targeted interventions, and deploy verified profiles to hiring partners — all backed by AI analysis.</p>
              </div>

              {/* Top Stats Row */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-white border border-brand-line rounded-xl p-5 flex flex-col justify-center items-center text-center shadow-sm">
                  <div className="text-3xl font-bold mb-1 text-brand-text">64</div>
                  <div className="text-[10px] font-bold text-brand-text-mute font-jetbrains uppercase tracking-widest flex items-center">
                    <Users className="w-3 h-3 mr-1" /> Total Students
                  </div>
                </div>
                <div className="bg-emerald-50/50 border border-emerald-200 rounded-xl p-5 flex flex-col justify-center items-center text-center border-b-4 border-b-emerald-500 shadow-sm">
                  <div className="text-3xl font-bold mb-1 text-emerald-600">1</div>
                  <div className="text-[10px] font-bold text-brand-text font-jetbrains uppercase tracking-widest flex items-center mb-1">
                    <CheckCircle2 className="w-3.5 h-3.5 mr-1 text-emerald-600" /> Deploy Ready
                  </div>
                  <div className="text-[10px] text-emerald-600 font-bold bg-emerald-100 px-2 py-0.5 rounded">20% of batch</div>
                </div>
                <div className="bg-blue-50/50 border border-blue-200 rounded-xl p-5 flex flex-col justify-center items-center text-center border-b-4 border-b-blue-500 shadow-sm">
                  <div className="text-3xl font-bold mb-1 text-blue-600">0</div>
                  <div className="text-[10px] font-bold text-brand-text font-jetbrains uppercase tracking-widest flex items-center mb-1">
                    <Lightbulb className="w-3.5 h-3.5 mr-1 text-blue-600" /> Hidden Gems
                  </div>
                  <div className="text-[10px] text-blue-600 font-bold bg-blue-100 px-2 py-0.5 rounded">Close to ready</div>
                </div>
                <div className="bg-rose-50/50 border border-rose-200 rounded-xl p-5 flex flex-col justify-center items-center text-center border-b-4 border-b-rose-500 shadow-sm">
                  <div className="text-3xl font-bold mb-1 text-rose-600">2</div>
                  <div className="text-[10px] font-bold text-brand-text font-jetbrains uppercase tracking-widest flex items-center mb-1">
                    <AlertTriangle className="w-3.5 h-3.5 mr-1 text-rose-600" /> Need Action
                  </div>
                  <div className="text-[10px] text-rose-600 font-bold bg-rose-100 px-2 py-0.5 rounded">Urgent interventions</div>
                </div>
              </div>

              {/* Deployment Profiles */}
              <div className="w-full">
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-4 gap-2">
                  <div>
                    <h2 className="text-lg font-bold flex items-center text-brand-text">
                      <Briefcase className="w-5 h-5 mr-2 text-emerald-600" /> Deployment Profiles
                    </h2>
                    <p className="text-xs text-brand-text-mute font-medium">Generate, share, or download verified hireability profiles for interview-ready students. Links auto-expire in 90 days.</p>
                  </div>
                  <span className="bg-emerald-50 text-emerald-700 text-[10px] font-bold px-3 py-1.5 rounded-full border border-emerald-200 whitespace-nowrap">
                    1 deployable
                  </span>
                </div>
                
                <div className="bg-white border border-brand-line rounded-xl p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:border-brand-line transition-colors shadow-sm w-full overflow-hidden">
                  <div className="flex items-center gap-4">
                    <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-sm animate-pulse"></div>
                    <div>
                      <h4 className="font-bold text-sm text-brand-text">Kavya Nair</h4>
                      <p className="text-xs text-brand-text-mute mt-1 font-medium">
                        Logic: <span className="text-brand-text font-bold">94%</span>
                        <span className="mx-2 text-brand-line">|</span>
                        Comm: <span className="text-brand-text font-bold">82%</span>
                      </p>
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
                    <button 
                      onClick={handleDownloadProfile}
                      className="flex-1 sm:flex-none flex items-center justify-center text-xs font-bold text-brand-text hover:text-brand-teal-600 px-4 py-2.5 rounded-lg transition-colors bg-brand-bg-alt border border-brand-line"
                    >
                      <Download className="w-4 h-4 mr-2" /> Download
                    </button>
                    <button 
                      onClick={() => setIsShareModalOpen(true)}
                      className="flex-1 sm:flex-none flex items-center justify-center text-xs font-bold text-white bg-brand-teal-600 hover:bg-brand-teal-700 px-4 py-2.5 rounded-lg transition-colors shadow-md shadow-brand-teal-600/20"
                    >
                      <Share2 className="w-4 h-4 mr-2" /> Share Link
                    </button>
                  </div>
                </div>
              </div>

              {/* Smart Intervention Queue */}
              <div className="w-full">
                <h2 className="text-lg font-bold flex items-center mb-1 text-brand-text">
                  <AlertCircle className="w-5 h-5 mr-2 text-orange-600" /> Smart Intervention Queue
                </h2>
                <p className="text-xs text-brand-text-mute mb-4 font-medium">AI-identified students needing specific teaching interventions — actionable steps you can take today.</p>
                
                <div className="space-y-3 w-full">
                  {interventionQueue.map((student) => (
                    <div key={student.id} className="bg-white border border-brand-line rounded-xl p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between relative overflow-hidden group hover:border-brand-line transition-colors shadow-sm gap-4">
                      {/* Left Color Indicator */}
                      <div className={`absolute left-0 top-0 bottom-0 w-1 ${student.color === 'red' ? 'bg-rose-500' : 'bg-orange-500'}`}></div>
                      
                      <div className="pl-3 flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2 sm:gap-3 mb-2">
                          <h4 className="font-bold text-sm text-brand-text truncate">{student.name}</h4>
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded border font-jetbrains uppercase tracking-wider whitespace-nowrap ${
                            student.severity === 'CRITICAL' ? 'bg-rose-50 text-rose-600 border-rose-200' : 'bg-orange-50 text-orange-600 border-orange-200'
                          }`}>
                            {student.severity}
                          </span>
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded border font-jetbrains uppercase tracking-wider whitespace-nowrap ${
                            student.type === 'Conceptual' ? 'bg-brand-teal-50 text-brand-teal-600 border-brand-teal-200' : 
                            student.type === 'Psychological' ? 'bg-pink-50 text-pink-600 border-pink-200' : 
                            'bg-blue-50 text-blue-600 border-blue-200'
                          }`}>
                            {student.type}
                          </span>
                        </div>
                        <div className="space-y-1.5">
                          <p className="text-xs text-brand-text font-medium flex items-start">
                            <span className="mr-2 text-brand-line">■</span> <span className="break-words">{student.issue}</span>
                          </p>
                          <p className="text-xs text-brand-text flex items-start">
                            <span className="mr-2 text-brand-line">■</span> <span className="break-words">{student.action}</span>
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex md:flex-col items-center md:items-end gap-4 md:gap-2 md:border-l border-brand-line md:pl-6 md:ml-4 w-full md:w-auto pt-4 md:pt-0 border-t md:border-t-0 mt-2 md:mt-0 justify-between">
                        <span className="text-[11px] text-brand-text-mute font-bold tracking-wider uppercase whitespace-nowrap">{student.sessions} sessions</span>
                        <button 
                          onClick={() => toast.success(`Intervention scheduled for ${student.name}`)}
                          className="text-xs font-bold text-brand-teal-600 hover:text-brand-teal-700 transition-colors px-4 py-2 rounded-lg bg-brand-teal-50 border border-brand-teal-200 whitespace-nowrap"
                        >
                          Schedule
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Bottom Grid */}
              <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 sm:gap-8 w-full">
                {/* Batch-over-batch Comparison */}
                <div className="bg-white border border-brand-line rounded-xl p-5 sm:p-6 shadow-sm w-full overflow-hidden flex flex-col">
                  <h3 className="text-sm font-bold mb-1 flex items-center text-brand-text">
                    <Users className="w-4 h-4 mr-2 text-brand-teal-600" /> Batch-over-batch Comparison
                  </h3>
                  <p className="text-xs text-brand-text-mute mb-6 font-medium">Is your teaching approach improving outcomes across batches?</p>
                  
                  <div className="space-y-4 w-full overflow-x-auto pb-2 flex-1">
                    <div className="min-w-[400px]">
                      {batchData.map((batch, index) => (
                        <div key={index} className={`p-4 rounded-xl flex items-center justify-between border mb-3 ${index === 0 ? 'bg-brand-bg-alt border-brand-line' : 'bg-transparent border-brand-line'}`}>
                          <div className="flex-1">
                            <h4 className="font-bold text-sm text-brand-text mb-1">{batch.name}</h4>
                          </div>
                          
                          <div className="flex gap-4 sm:gap-8 text-center flex-1 justify-end">
                            <div>
                              <div className="text-base sm:text-lg font-bold text-brand-text flex items-center justify-center">
                                {batch.logic}% {batch.logicTrend && <span className="text-[10px] text-emerald-600 ml-1.5 flex items-center bg-emerald-50 px-1 rounded"><TrendingUp className="w-3 h-3 mr-0.5" />{batch.logicTrend}</span>}
                              </div>
                              <div className="text-[10px] font-bold text-brand-text-mute font-jetbrains uppercase tracking-widest mt-0.5">Avg Logic</div>
                            </div>
                            <div>
                              <div className="text-base sm:text-lg font-bold text-brand-text flex items-center justify-center">
                                {batch.ready}% {batch.readyTrend && <span className="text-[10px] text-emerald-600 ml-1.5 flex items-center bg-emerald-50 px-1 rounded"><TrendingUp className="w-3 h-3 mr-0.5" />{batch.readyTrend}</span>}
                              </div>
                              <div className="text-[10px] font-bold text-brand-text-mute font-jetbrains uppercase tracking-widest mt-0.5">Ready Rate</div>
                            </div>
                          </div>
                          
                          <div className="text-xs text-brand-text-mute font-bold ml-4 sm:ml-6 w-16 text-right hidden sm:block">
                            {batch.students} students
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  <div className="mt-2 bg-brand-teal-50 border border-brand-teal-200 p-4 rounded-xl flex items-start text-xs text-brand-teal-800 font-medium leading-relaxed">
                    <span className="mr-2 text-base">💡</span> 
                    <span>Current batch is <strong>+13% higher</strong> readiness rate vs Batch 4 — Socratic questioning approach is working.</span>
                  </div>
                </div>

                {/* 8-Week Progress Trajectory */}
                <div className="bg-white border border-brand-line rounded-xl p-5 sm:p-6 flex flex-col shadow-sm w-full overflow-hidden">
                  <h3 className="text-sm font-bold mb-1 flex items-center text-brand-text">
                    <BarChart2 className="w-4 h-4 mr-2 text-brand-teal-600" /> 8-Week Progress Trajectory
                  </h3>
                  <p className="text-xs text-brand-text-mute mb-6 font-medium">Track how your batch is improving over time across all key metrics.</p>
                  
                  <div className="flex-1 relative flex flex-col justify-end mt-4 overflow-x-auto pb-2 w-full">
                    <div className="min-w-[400px] h-full relative">
                      {/* Y-axis labels */}
                      <div className="absolute left-0 top-0 bottom-6 flex flex-col justify-between text-[10px] font-bold text-brand-text-mute">
                        <span>100</span><span>75</span><span>50</span><span>25</span><span>0</span>
                      </div>
                      
                      {/* Grid lines */}
                      <div className="absolute left-8 right-0 top-0 bottom-6 flex flex-col justify-between pointer-events-none">
                        {[1, 2, 3, 4, 5].map((_, i) => <div key={i} className="w-full border-t border-brand-line h-0" />)}
                      </div>

                      {/* Bars container */}
                      <div className="ml-8 h-48 flex items-end justify-between relative z-10">
                        {progressTrajectory.map((data, idx) => (
                          <div 
                            key={idx} 
                            className="relative group flex justify-center w-full h-full cursor-pointer"
                            onMouseEnter={() => setHoveredBar(idx)}
                            onMouseLeave={() => setHoveredBar(null)}
                          >
                            {/* The three bars for Logic, Comm, Ready */}
                            <div className="flex items-end space-x-0.5 sm:space-x-1 h-full w-full justify-center px-0.5 sm:px-1">
                              <div className="w-1/3 bg-brand-teal-400 hover:bg-brand-teal-500 transition-colors rounded-t-sm" style={{ height: `${data.logic}%` }}></div>
                              <div className="w-1/3 bg-brand-blue-400 hover:bg-brand-blue-500 transition-colors rounded-t-sm" style={{ height: `${data.comm}%` }}></div>
                              <div className="w-1/3 bg-emerald-400 hover:bg-emerald-500 transition-colors rounded-t-sm" style={{ height: `${data.ready}%` }}></div>
                            </div>

                            {/* Custom Tooltip */}
                            {hoveredBar === idx && (
                              <div className="absolute bottom-full mb-3 bg-brand-ink text-white text-[11px] p-3 rounded-lg shadow-xl z-20 whitespace-nowrap pointer-events-none min-w-[140px] transform -translate-x-1/2 left-1/2">
                                <div className="font-bold border-b border-brand-line-12 pb-1.5 mb-1.5 text-center">{data.week}</div>
                                <div className="flex justify-between items-center mb-1"><span className="flex items-center text-brand-line"><span className="w-1.5 h-1.5 rounded-full bg-brand-teal-400 mr-2"/>Logic %</span> <span className="font-bold">{data.logic}</span></div>
                                <div className="flex justify-between items-center mb-1"><span className="flex items-center text-brand-line"><span className="w-1.5 h-1.5 rounded-full bg-brand-blue-400 mr-2"/>Comm %</span> <span className="font-bold">{data.comm}</span></div>
                                <div className="flex justify-between items-center"><span className="flex items-center text-brand-line"><span className="w-1.5 h-1.5 rounded-full bg-emerald-400 mr-2"/>Readiness %</span> <span className="font-bold">{data.ready}</span></div>
                                {/* Tooltip caret */}
                                <div className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 w-2.5 h-2.5 bg-brand-ink rotate-45" />
                              </div>
                            )}
                          </div>
                        ))}
                      </div>

                      {/* X-axis labels */}
                      <div className="ml-8 flex justify-between mt-3 text-[10px] font-bold text-brand-text-mute uppercase">
                        {progressTrajectory.map(d => <span key={d.week} className="w-full text-center">{d.week}</span>)}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

        </main>
      </div>

      {/* --- SHARE MODAL --- */}
      {isShareModalOpen && (
        <div className="fixed inset-0 z-[60] flex justify-center items-center bg-black/40 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white border border-brand-line rounded-2xl w-full max-w-md shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center p-5 border-b border-brand-line bg-brand-bg-alt">
              <h2 className="text-base font-bold text-brand-text flex items-center">
                <Briefcase className="w-5 h-5 mr-2 text-brand-teal-600" />
                Deploy Hireability Profile
              </h2>
              <button onClick={() => setIsShareModalOpen(false)} className="text-brand-text-mute hover:text-brand-text transition-colors bg-white border border-brand-line p-2 rounded-full sm:p-0 sm:bg-transparent sm:border-none">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6">
              <p className="text-sm text-brand-text mb-6 leading-relaxed">
                Generate a secure, shareable profile for <strong className="text-brand-text">Kavya Nair</strong> valid for 90 days.
              </p>

              {!isGenerated ? (
                <button 
                  onClick={handleGenerateProfile}
                  disabled={isGenerating}
                  className="w-full bg-brand-teal-600 hover:bg-brand-teal-700 disabled:bg-brand-teal-400 text-white py-3 rounded-xl font-bold flex items-center justify-center transition-colors shadow-md shadow-brand-teal-600/20"
                >
                  {isGenerating ? (
                    <><Loader2 className="w-5 h-5 mr-2 animate-spin" /> Generating Secure Link...</>
                  ) : (
                    <><Share2 className="w-5 h-5 mr-2" /> Generate Profile</>
                  )}
                </button>
              ) : (
                <div className="space-y-5 animate-in fade-in slide-in-from-bottom-2 duration-300">
                  <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 sm:p-5 relative overflow-hidden">
                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-emerald-500"></div>
                    <h4 className="text-sm font-bold text-emerald-700 mb-2 flex items-center">
                      <CheckCircle2 className="w-4 h-4 mr-1.5" /> Profile Generated Successfully
                    </h4>
                    <p className="text-[11px] sm:text-xs text-brand-text font-mono mt-2 bg-white p-2.5 rounded-lg border border-brand-line break-all select-all shadow-inner">
                      https://testcrack.io/profile/kavya-nair?ref=...
                    </p>
                  </div>
                  <div className="flex flex-col sm:flex-row gap-3">
                    <button 
                      onClick={() => {
                        copyToClipboard();
                        setIsShareModalOpen(false);
                      }}
                      className="flex-1 bg-white hover:bg-brand-bg-alt border border-brand-line text-brand-text py-2.5 sm:py-3 rounded-xl font-bold flex items-center justify-center transition-colors text-sm shadow-sm"
                    >
                      <Copy className="w-4 h-4 mr-2 text-brand-text-mute" /> Copy Link
                    </button>
                    <button 
                      onClick={() => {
                        setIsShareModalOpen(false);
                        setShowProfile(true);
                      }}
                      className="flex-1 bg-brand-teal-600 hover:bg-brand-teal-700 text-white py-2.5 sm:py-3 rounded-xl font-bold flex items-center justify-center transition-colors text-sm shadow-md shadow-brand-teal-600/20"
                    >
                      <Eye className="w-4 h-4 mr-2" /> Preview Profile
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

    </div>
  );
}