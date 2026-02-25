import React, { useState, useEffect } from 'react';
import { 
  TrendingUp, 
  AlertTriangle, 
  CheckCircle2, 
  Copy, 
  Check,
  ChevronDown
} from 'lucide-react';
import { InstituteSidebar } from '../components/InstituteSidebar';
import { InstituteTopbar } from '../components/InstituteTopbar';

// --- Mock Data ---

const struggleGroups = [
  { 
    count: 17, 
    desc: "Ready for advanced material", 
    cohort: "26%", 
    color: "text-emerald-600 dark:text-emerald-500", 
    bg: "bg-emerald-500", 
    icon: <svg width="20" height="20" viewBox="0 0 24 24"><polygon points="12,4 22,20 2,20" fill="none" stroke="currentColor" strokeWidth="2.5"/></svg> 
  },
  { 
    count: 16, 
    desc: "Immediate intervention required", 
    cohort: "25%", 
    color: "text-rose-600 dark:text-rose-500", 
    bg: "bg-rose-500", 
    icon: <svg width="20" height="20" viewBox="0 0 24 24"><polygon points="12,20 2,4 22,4" fill="none" stroke="currentColor" strokeWidth="2.5"/></svg> 
  },
  { 
    count: 16, 
    desc: "Needs confidence & speed drills", 
    cohort: "25%", 
    color: "text-amber-600 dark:text-amber-500", 
    bg: "bg-amber-500", 
    icon: <svg width="20" height="20" viewBox="0 0 24 24"><circle cx="12" cy="12" r="8" fill="none" stroke="currentColor" strokeWidth="2.5"/></svg> 
  },
  { 
    count: 1, 
    desc: "Needs focus & patience training", 
    cohort: "23%", 
    color: "text-orange-600 dark:text-orange-500", 
    bg: "bg-orange-500", 
    icon: <svg width="20" height="20" viewBox="0 0 24 24"><rect x="5" y="5" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.5"/></svg> 
  }
];

const batchPerformance = [
  { name: "IELTS Band 7+", acc: 72, imp: 18 },
  { name: "Spoken English AM", acc: 65, imp: 12 },
  { name: "Tech Prep 5", acc: 78, imp: 22 },
  { name: "IELTS Evening", acc: 58, imp: 8 }
];

const topicHeatmap = [
  { name: "Trees (timed)", score: 85, color: "bg-emerald-500" },
  { name: "Sliding Window", score: 82, color: "bg-emerald-500" },
  { name: "Bit Manipulation", score: 78, color: "bg-emerald-500" },
  { name: "Sorting", score: 75, color: "bg-emerald-500" },
  { name: "Strings", score: 72, color: "bg-emerald-500" },
  { name: "Binary Search", score: 68, color: "bg-emerald-500" },
  { name: "Heaps", score: 65, color: "bg-emerald-500" },
  { name: "Linked Lists", score: 62, color: "bg-emerald-500" },
  { name: "Backtracking", score: 55, color: "bg-yellow-500" },
  { name: "Recursion", score: 52, color: "bg-yellow-500" },
  { name: "Queues", score: 48, color: "bg-yellow-500" },
  { name: "Arrays", score: 42, color: "bg-orange-500" },
  { name: "Segment Trees", score: 38, color: "bg-orange-500" },
  { name: "Hash Tables", score: 32, color: "bg-orange-500" },
  { name: "Graphs", score: 25, color: "bg-rose-500" },
  { name: "DP (timed)", score: 18, color: "bg-rose-500" }
];

const trendData = [
  { w: "W1", acc: 52, flu: 48, conf: 45 },
  { w: "W2", acc: 55, flu: 51, conf: 49 },
  { w: "W3", acc: 58, flu: 55, conf: 53 },
  { w: "W4", acc: 62, flu: 59, conf: 57 },
  { w: "W5", acc: 65, flu: 63, conf: 61 },
  { w: "W6", acc: 68, flu: 66, conf: 65 }
];

export default function InstituteReports() {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [copiedMsg, setCopiedMsg] = useState(false);
  const [copiedPlan, setCopiedPlan] = useState(false);
  
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    // Trigger animations shortly after component mounts
    const timer = setTimeout(() => {
      setIsLoaded(true);
    }, 100);
    return () => clearTimeout(timer);
  }, []);

  const handleCopy = (type) => {
    if (type === 'msg') {
      setCopiedMsg(true);
      setTimeout(() => setCopiedMsg(false), 2000);
    } else {
      setCopiedPlan(true);
      setTimeout(() => setCopiedPlan(false), 2000);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#0A0A0A] font-sans text-slate-900 dark:text-slate-200 transition-colors duration-300">
      
      {/* No need for an extra wrapper div here. 
        InstituteSidebar handles its own 'hidden lg:flex' responsive display. 
        activeTab is corrected to match the id 'report' in your sidebar configuration.
      */}
      <InstituteSidebar 
        activeTab="report" 
        isCollapsed={isSidebarCollapsed} 
        toggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)} 
      />

      {/* Corrected Layout Constraints: 
        112px clears the collapsed sidebar (80px + 16px left-gap + 16px right-gap).
        288px clears the expanded sidebar (256px + 16px left-gap + 16px right-gap).
      */}
      <div className={`transition-all duration-300 flex flex-col min-h-screen ${isSidebarCollapsed ? 'lg:pl-[112px]' : 'lg:pl-[288px]'}`}>
        
        <InstituteTopbar />

        {/* overflow-x-hidden ensures charting SVGs do not blow out the layout width */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-x-hidden">
          <div className="max-w-[1400px] mx-auto space-y-6">
            
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white mb-2">Command Report</h1>

            {/* Weekly Intelligence Brief Card */}
            <div className="bg-white dark:bg-[#141414] border border-slate-200 dark:border-[#222] rounded-xl p-6 shadow-sm">
              <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Weekly Intelligence Brief</h2>
              <p className="text-sm text-slate-600 dark:text-gray-400 mb-8 max-w-5xl leading-relaxed">
                Across <span className="text-slate-900 dark:text-white font-semibold">64 students</span>, average accuracy is <span className="text-slate-900 dark:text-white font-semibold">61%</span>. <span className="text-slate-900 dark:text-white font-semibold">17 are sprint-ready</span>, while <span className="text-slate-900 dark:text-white font-semibold">16 need immediate intervention</span>. Critical friction point: <span className="text-rose-600 dark:text-rose-500 font-semibold">"DP (timed)"</span> with a <span className="text-slate-900 dark:text-white font-semibold">100% fail rate</span>.
              </p>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center">
                  <h3 className="text-3xl font-extrabold text-slate-900 dark:text-white mb-1">61%</h3>
                  <p className="text-xs font-bold text-slate-500 dark:text-gray-500 uppercase tracking-wider">Avg Accuracy</p>
                </div>
                <div className="text-center md:border-l border-slate-200 dark:border-[#222]">
                  <h3 className="text-3xl font-extrabold text-emerald-600 dark:text-emerald-500 mb-1">17</h3>
                  <p className="text-xs font-bold text-slate-500 dark:text-gray-500 uppercase tracking-wider">Sprint Ready</p>
                </div>
                <div className="text-center md:border-l border-slate-200 dark:border-[#222]">
                  <h3 className="text-3xl font-extrabold text-rose-600 dark:text-rose-500 mb-1">16</h3>
                  <p className="text-xs font-bold text-slate-500 dark:text-gray-500 uppercase tracking-wider">Need Intervention</p>
                </div>
                <div className="text-center md:border-l border-slate-200 dark:border-[#222]">
                  <h3 className="text-3xl font-extrabold text-amber-500 mb-1">100%</h3>
                  <p className="text-xs font-bold text-slate-500 dark:text-gray-500 uppercase tracking-wider">Top Fail Rate</p>
                </div>
              </div>
            </div>

            {/* Struggle Distribution */}
            <div>
              <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-4 mt-8">Struggle Distribution</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {struggleGroups.map((group, idx) => (
                  <div key={idx} className="bg-white dark:bg-[#141414] border border-slate-200 dark:border-[#222] rounded-xl p-5 shadow-sm relative overflow-hidden">
                    <div className={`absolute top-0 left-0 w-full h-1 ${group.bg}`}></div>
                    <div className="flex items-center gap-2 mb-2 mt-1">
                      <div className={`${group.color}`}>
                        {group.icon}
                      </div>
                      <span className={`text-2xl font-extrabold ${group.color}`}>{group.count}</span>
                    </div>
                    <p className="text-xs text-slate-500 dark:text-gray-400 mb-4 h-8">{group.desc}</p>
                    <div className="flex justify-between items-center text-[11px] font-medium text-slate-500 border-t border-slate-100 dark:border-[#222] pt-3">
                      <span>{group.cohort} of cohort</span>
                      <button className="hover:text-slate-900 dark:hover:text-white flex items-center gap-1">Show students <ChevronDown className="w-3 h-3"/></button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Charts Row 1: Radar & Line */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-8">
              
              {/* Cohort Skill Profile */}
              <div className="bg-white dark:bg-[#141414] border border-slate-200 dark:border-[#222] rounded-xl p-6 shadow-sm flex flex-col">
                <h3 className="text-base font-bold text-slate-900 dark:text-white mb-1">Cohort Skill Profile</h3>
                <p className="text-xs text-slate-500 dark:text-gray-500 mb-8">Average across all students — identifies systemic weaknesses for curriculum adjustments.</p>
                <div className="flex-1 flex items-center justify-center relative min-h-[250px]">
                  <svg viewBox="0 0 100 100" className="w-full max-w-[280px] h-auto overflow-visible">
                    {[20, 40, 60, 80, 100].map(r => (
                      <polygon 
                        key={r}
                        points={`50,${50-r/2} ${50+r*0.433},${50-r*0.25} ${50+r*0.433},${50+r*0.25} 50,${50+r/2} ${50-r*0.433},${50+r*0.25} ${50-r*0.433},${50-r*0.25}`}
                        fill="none" className="stroke-slate-200 dark:stroke-[#222]" strokeWidth="0.5"
                      />
                    ))}
                    <line x1="50" y1="50" x2="50" y2="0" className="stroke-slate-200 dark:stroke-[#222]" strokeWidth="0.5" />
                    <line x1="50" y1="50" x2="93.3" y2="25" className="stroke-slate-200 dark:stroke-[#222]" strokeWidth="0.5" />
                    <line x1="50" y1="50" x2="93.3" y2="75" className="stroke-slate-200 dark:stroke-[#222]" strokeWidth="0.5" />
                    <line x1="50" y1="50" x2="50" y2="100" className="stroke-slate-200 dark:stroke-[#222]" strokeWidth="0.5" />
                    <line x1="50" y1="50" x2="6.7" y2="75" className="stroke-slate-200 dark:stroke-[#222]" strokeWidth="0.5" />
                    <line x1="50" y1="50" x2="6.7" y2="25" className="stroke-slate-200 dark:stroke-[#222]" strokeWidth="0.5" />
                    
                    {/* Animated Radar Polygon */}
                    <polygon 
                      points="50,15 82,30 75,70 50,85 28,65 18,32" 
                      fill="rgba(139, 92, 246, 0.2)" 
                      stroke="#8b5cf6" 
                      strokeWidth="1.5" 
                      style={{ 
                        transformOrigin: '50px 50px',
                        transform: isLoaded ? 'scale(1)' : 'scale(0)',
                        opacity: isLoaded ? 1 : 0,
                        transition: 'all 1s cubic-bezier(0.34, 1.56, 0.64, 1)'
                      }}
                    />

                    <text x="50" y="-5" fontSize="4" textAnchor="middle" fill="currentColor" className="text-slate-500 dark:text-gray-400 font-medium">Accuracy</text>
                    <text x="100" y="25" fontSize="4" textAnchor="start" fill="currentColor" className="text-slate-500 dark:text-gray-400 font-medium">Fluency</text>
                    <text x="100" y="75" fontSize="4" textAnchor="start" fill="currentColor" className="text-slate-500 dark:text-gray-400 font-medium">Confidence</text>
                    <text x="50" y="108" fontSize="4" textAnchor="middle" fill="currentColor" className="text-slate-500 dark:text-gray-400 font-medium">Pronunciation</text>
                    <text x="0" y="75" fontSize="4" textAnchor="end" fill="currentColor" className="text-slate-500 dark:text-gray-400 font-medium">Grammar</text>
                    <text x="0" y="25" fontSize="4" textAnchor="end" fill="currentColor" className="text-slate-500 dark:text-gray-400 font-medium">Vocabulary</text>
                  </svg>
                </div>
              </div>

              {/* 6-Week Progress Trend */}
              <div className="bg-white dark:bg-[#141414] border border-slate-200 dark:border-[#222] rounded-xl p-6 shadow-sm flex flex-col">
                <h3 className="text-base font-bold text-slate-900 dark:text-white mb-1">6-Week Progress Trend</h3>
                <p className="text-xs text-slate-500 dark:text-gray-500 mb-6">Tracks whether your teaching interventions are moving the needle week-over-week.</p>
                
                <div className="flex-1 relative w-full min-h-[220px]">
                  {/* Background Grid Lines */}
                  <div className="absolute inset-0 flex flex-col justify-between text-[10px] text-slate-400 dark:text-gray-500 z-0">
                    {[80, 60, 45, 30].map(val => (
                      <div key={val} className="w-full flex items-center gap-2">
                        <span className="w-4 text-right">{val}</span>
                        <div className="flex-1 border-b border-slate-100 dark:border-[#222]"></div>
                      </div>
                    ))}
                  </div>

                  {/* Animated SVG Lines */}
                  <div className="absolute inset-0 left-6 bottom-6 right-0 top-2 z-0 pointer-events-none">
                    <svg viewBox="0 0 100 100" className="w-full h-full overflow-visible" preserveAspectRatio="none">
                      <path 
                        d={`M ${trendData.map((d, i) => `${i*20},${100 - ((d.acc - 30)*2)}`).join(' L ')}`} 
                        fill="none" stroke="#8b5cf6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                        strokeDasharray="300" strokeDashoffset={isLoaded ? 0 : 300} style={{ transition: 'stroke-dashoffset 1.5s ease-in-out' }}
                      />
                      <path 
                        d={`M ${trendData.map((d, i) => `${i*20},${100 - ((d.flu - 30)*2)}`).join(' L ')}`} 
                        fill="none" stroke="#10b981" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                        strokeDasharray="300" strokeDashoffset={isLoaded ? 0 : 300} style={{ transition: 'stroke-dashoffset 1.5s ease-in-out 0.2s' }}
                      />
                      <path 
                        d={`M ${trendData.map((d, i) => `${i*20},${100 - ((d.conf - 30)*2)}`).join(' L ')}`} 
                        fill="none" stroke="#f59e0b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                        strokeDasharray="300" strokeDashoffset={isLoaded ? 0 : 300} style={{ transition: 'stroke-dashoffset 1.5s ease-in-out 0.4s' }}
                      />
                    </svg>
                  </div>

                  {/* Interactive Dots with Staggered Fade-In */}
                  <div className="absolute inset-0 left-6 bottom-6 right-0 top-2 z-10 flex">
                    {trendData.map((d, i) => {
                      const leftPercent = i * 20;
                      const yAcc = 100 - ((d.acc - 30) * 2);
                      const yFlu = 100 - ((d.flu - 30) * 2);
                      const yConf = 100 - ((d.conf - 30) * 2);
                      const highestY = Math.min(yAcc, yFlu, yConf);
                      
                      // Delay for dot animations to sync roughly with line drawing
                      const animDelay = `${i * 150}ms`;

                      return (
                        <div key={i} className="absolute top-0 bottom-0 w-8 -ml-4 group cursor-pointer" style={{ left: `${leftPercent}%` }}>
                          <div className="absolute inset-y-0 left-1/2 w-px bg-slate-200 dark:bg-[#333] opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"></div>

                          <div className="absolute left-1/2 -translate-x-1/2 w-2.5 h-2.5 rounded-full bg-white dark:bg-[#141414] border-2 border-[#8b5cf6] transition-all duration-300 group-hover:scale-[1.3] pointer-events-none" style={{ top: `calc(${yAcc}% - 5px)`, opacity: isLoaded ? 1 : 0, transitionDelay: isLoaded ? animDelay : '0ms' }}></div>
                          <div className="absolute left-1/2 -translate-x-1/2 w-2.5 h-2.5 rounded-full bg-white dark:bg-[#141414] border-2 border-[#10b981] transition-all duration-300 group-hover:scale-[1.3] pointer-events-none" style={{ top: `calc(${yFlu}% - 5px)`, opacity: isLoaded ? 1 : 0, transitionDelay: isLoaded ? animDelay : '0ms' }}></div>
                          <div className="absolute left-1/2 -translate-x-1/2 w-2.5 h-2.5 rounded-full bg-white dark:bg-[#141414] border-2 border-[#f59e0b] transition-all duration-300 group-hover:scale-[1.3] pointer-events-none" style={{ top: `calc(${yConf}% - 5px)`, opacity: isLoaded ? 1 : 0, transitionDelay: isLoaded ? animDelay : '0ms' }}></div>

                          <div 
                            className="absolute opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-50 pointer-events-none bg-white dark:bg-[#1e1e1e] border border-slate-200 dark:border-[#333] shadow-xl dark:shadow-2xl rounded-lg p-3 w-[120px]"
                            style={{
                              top: `calc(${highestY}% - 100px)`, 
                              left: i > 3 ? 'auto' : '50%',
                              right: i > 3 ? '50%' : 'auto',
                              marginLeft: i > 3 ? '0' : '8px',
                              marginRight: i > 3 ? '8px' : '0'
                            }}
                          >
                            <p className="font-bold text-slate-900 dark:text-white mb-2 pb-1.5 border-b border-slate-100 dark:border-[#333] text-xs">{d.w}</p>
                            <div className="space-y-1.5 text-xs">
                              <div className="flex justify-between items-center"><span className="text-[#8b5cf6] font-medium">Accuracy</span><span className="font-semibold text-slate-700 dark:text-gray-300"> : {d.acc}</span></div>
                              <div className="flex justify-between items-center"><span className="text-[#10b981] font-medium">Fluency</span><span className="font-semibold text-slate-700 dark:text-gray-300"> : {d.flu}</span></div>
                              <div className="flex justify-between items-center"><span className="text-[#f59e0b] font-medium">Confidence</span><span className="font-semibold text-slate-700 dark:text-gray-300"> : {d.conf}</span></div>
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                  
                  <div className="absolute bottom-0 left-6 right-0 flex justify-between text-[10px] text-slate-500 dark:text-gray-500 font-medium">
                    {trendData.map(d => <span key={d.w}>{d.w}</span>)}
                  </div>
                </div>

                <div className="flex justify-center gap-6 mt-6 text-xs font-medium text-slate-600 dark:text-gray-400">
                  <span className="flex items-center gap-1.5">
                    <svg width="18" height="10" viewBox="0 0 18 10" className="overflow-visible"><line x1="0" y1="5" x2="18" y2="5" stroke="#8b5cf6" strokeWidth="1.5"/><circle cx="9" cy="5" r="3" stroke="#8b5cf6" strokeWidth="1.5" className="fill-white dark:fill-[#141414]"/></svg>
                    Accuracy
                  </span>
                  <span className="flex items-center gap-1.5">
                    <svg width="18" height="10" viewBox="0 0 18 10" className="overflow-visible"><line x1="0" y1="5" x2="18" y2="5" stroke="#10b981" strokeWidth="1.5"/><circle cx="9" cy="5" r="3" stroke="#10b981" strokeWidth="1.5" className="fill-white dark:fill-[#141414]"/></svg>
                    Fluency
                  </span>
                  <span className="flex items-center gap-1.5">
                    <svg width="18" height="10" viewBox="0 0 18 10" className="overflow-visible"><line x1="0" y1="5" x2="18" y2="5" stroke="#f59e0b" strokeWidth="1.5"/><circle cx="9" cy="5" r="3" stroke="#f59e0b" strokeWidth="1.5" className="fill-white dark:fill-[#141414]"/></svg>
                    Confidence
                  </span>
                </div>
              </div>

            </div>

            {/* Batch Performance Comparison */}
            <div className="bg-white dark:bg-[#141414] border border-slate-200 dark:border-[#222] rounded-xl p-6 shadow-sm mt-8">
              <h3 className="text-base font-bold text-slate-900 dark:text-white mb-1">Batch Performance Comparison</h3>
              <p className="text-xs text-slate-500 dark:text-gray-500 mb-8">Compare batches to identify which tutors and curricula are producing the best outcomes.</p>
              
              <div className="relative w-full h-48 flex items-end justify-around border-b border-slate-200 dark:border-[#222] pb-2">
                <div className="absolute inset-0 flex flex-col justify-between pointer-events-none">
                  {[100, 75, 50, 25, 0].map(val => (
                    <div key={val} className="w-full border-b border-slate-100 dark:border-[#222] flex items-center h-0 relative">
                      <span className="absolute -left-6 text-[10px] text-slate-400 dark:text-gray-500 -translate-y-1/2">{val}</span>
                    </div>
                  ))}
                </div>

                {batchPerformance.map((batch, idx) => (
                  <div key={idx} className="relative group w-16 sm:w-24 h-full flex items-end justify-center gap-1 z-10">
                    <div 
                      className="w-1/2 bg-purple-600 rounded-t-sm hover:opacity-90 transition-opacity" 
                      style={{ 
                        height: isLoaded ? `${batch.acc}%` : '0%', 
                        transition: 'height 1s cubic-bezier(0.16, 1, 0.3, 1)' 
                      }}>
                    </div>
                    <div 
                      className="w-1/2 bg-emerald-500 rounded-t-sm hover:opacity-90 transition-opacity" 
                      style={{ 
                        height: isLoaded ? `${batch.imp}%` : '0%', 
                        transition: 'height 1s cubic-bezier(0.16, 1, 0.3, 1) 0.2s' 
                      }}>
                    </div>
                    
                    <div className="absolute bottom-full mb-2 hidden group-hover:block bg-white dark:bg-[#1e1e1e] border border-slate-200 dark:border-[#333] shadow-xl rounded-lg p-3 text-xs w-40 z-20">
                      <p className="font-bold text-slate-900 dark:text-white mb-2 pb-1 border-b border-slate-100 dark:border-[#333]">{batch.name}</p>
                      <div className="flex justify-between mb-1">
                        <span className="text-slate-500 dark:text-gray-400">Accuracy %</span>
                        <span className="font-bold text-purple-600 dark:text-purple-500">{batch.acc}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500 dark:text-gray-400">Improvement %</span>
                        <span className="font-bold text-emerald-600 dark:text-emerald-400">{batch.imp}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <div className="flex justify-around mt-3 text-[10px] sm:text-xs text-slate-500 dark:text-gray-500 text-center font-medium">
                {batchPerformance.map(b => <span key={b.name} className="w-16 sm:w-24 truncate">{b.name}</span>)}
              </div>
              <div className="flex justify-center gap-6 mt-6 text-[11px] font-medium text-slate-600 dark:text-gray-400">
                <span className="flex items-center gap-1.5"><div className="w-3 h-3 bg-purple-600 rounded-sm"></div> Accuracy %</span>
                <span className="flex items-center gap-1.5"><div className="w-3 h-3 bg-emerald-500 rounded-sm"></div> Improvement %</span>
              </div>
            </div>

            {/* Topic Heatmap */}
            <div className="bg-white dark:bg-[#141414] border border-slate-200 dark:border-[#222] rounded-xl p-6 shadow-sm mt-8">
              <h3 className="text-base font-bold text-slate-900 dark:text-white mb-2">Topic Heatmap</h3>
              
              <div className="bg-rose-50 dark:bg-rose-950/40 border border-rose-100 dark:border-rose-900/50 rounded-lg p-3 mb-6 flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                <p className="text-xs text-rose-700 dark:text-rose-300">
                  <strong className="text-rose-600 dark:text-rose-500 font-bold">100% failed "DP (timed)"</strong> — recommend a live review. Second weakest: <strong className="text-rose-600 dark:text-rose-500 font-bold">"Graphs (timed)"</strong> at 100% fail rate.
                </p>
              </div>
              
              <div className="space-y-3 relative">
                <div className="absolute top-0 bottom-0 left-[120px] right-0 flex justify-between pointer-events-none">
                  {[25, 50, 75, 100].map(val => (
                    <div key={val} className="h-full border-l border-slate-100 dark:border-[#222] relative">
                      <span className="absolute -bottom-6 -translate-x-1/2 text-[10px] text-slate-400 dark:text-gray-500">{val}</span>
                    </div>
                  ))}
                </div>

                {topicHeatmap.map((topic, idx) => (
                  <div key={idx} className="flex items-center group cursor-pointer relative z-10">
                    <span className="w-[120px] text-[10px] sm:text-xs font-medium text-slate-700 dark:text-gray-300 truncate pr-2">
                      {topic.name}
                    </span>
                    <div className="flex-1 h-4 bg-slate-100 dark:bg-[#1a1a1a] rounded-r-md overflow-hidden relative">
                      {/* Animated Width */}
                      <div 
                        className={`h-full ${topic.color}`} 
                        style={{ 
                          width: isLoaded ? `${topic.score}%` : '0%', 
                          transition: `width 1s cubic-bezier(0.16, 1, 0.3, 1) ${idx * 0.05}s`
                        }}
                      ></div>
                      
                      <div className="absolute top-0 opacity-0 group-hover:opacity-100 transition-opacity ml-2 pointer-events-none" style={{ left: `${topic.score}%` }}>
                        <div className="bg-slate-800 dark:bg-[#222] text-white text-[10px] py-1 px-2 rounded font-medium whitespace-nowrap shadow-md -translate-y-[2px]">
                          {topic.name} Avg Score: {topic.score}%
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <div className="h-6"></div> {/* Spacer for x-axis labels */}
            </div>

            {/* Generated Action Items */}
            <div className="mt-8">
              <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-4">AI-Generated Action Items</h2>
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                
                {/* Left Column Actions */}
                <div className="space-y-4">
                  <div className="bg-white dark:bg-[#141414] border border-slate-200 dark:border-[#222] rounded-xl p-5 shadow-sm border-l-4 border-l-rose-500">
                    <h3 className="text-sm font-bold text-rose-600 dark:text-rose-500 mb-2 flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4" /> Immediate: Foundation Group
                    </h3>
                    <p className="text-xs text-slate-600 dark:text-gray-400 mb-2">
                      16 students are below 45% accuracy. Schedule 1-on-1 remediation sessions focusing on "DP (timed)" this week.
                    </p>
                    <p className="text-[11px] font-medium text-rose-600 dark:text-rose-500">Expected impact: +12% accuracy in 2 weeks</p>
                  </div>

                  <div className="bg-white dark:bg-[#141414] border border-slate-200 dark:border-[#222] rounded-xl p-5 shadow-sm border-l-4 border-l-emerald-500">
                    <h3 className="text-sm font-bold text-emerald-600 dark:text-emerald-500 mb-2 flex items-center gap-2">
                      <TrendingUp className="w-4 h-4" /> Accelerate: Sprint Group
                    </h3>
                    <p className="text-xs text-slate-600 dark:text-gray-400 mb-2">
                      17 students are ready for advanced material. Move them to challenging modules to prevent plateau and boredom.
                    </p>
                    <p className="text-[11px] font-medium text-emerald-600 dark:text-emerald-500">Expected impact: Maintain engagement, prevent dropout</p>
                  </div>

                  {/* WhatsApp Message Component */}
                  <div className="bg-white dark:bg-[#141414] border border-slate-200 dark:border-[#222] rounded-xl overflow-hidden shadow-sm">
                    <div className="bg-slate-50 dark:bg-[#1a1a1a] p-3 border-b border-slate-200 dark:border-[#222] flex justify-between items-center">
                      <h3 className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                        <svg className="w-4 h-4 text-emerald-500" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 0 0-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z"/></svg>
                        WhatsApp Message
                      </h3>
                    </div>
                    <div className="p-4 bg-white dark:bg-[#141414] relative">
                      <p className="text-xs text-slate-700 dark:text-gray-300 font-mono whitespace-pre-wrap break-words">
{`*TestCrack Weekly Class Health Report*

Team! Here's your progress snapshot:

Class avg accuracy: *60%* across 64 students
*17 students* are in the Sprint zone
*16 students* need extra support
Weakest point: *DP (timed)* (100% fail rate)

Focus: Review DP (timed) concepts this week.`}
                      </p>
                      <button 
                        onClick={() => handleCopy('msg')}
                        className="mt-4 flex items-center justify-center gap-2 bg-white dark:bg-[#222] border border-slate-200 dark:border-[#333] hover:bg-slate-50 dark:hover:bg-[#2a2a2a] text-slate-700 dark:text-gray-300 py-1.5 px-3 rounded-lg text-xs font-semibold transition-all w-auto"
                      >
                        {copiedMsg ? <><Check className="w-3.5 h-3.5 text-emerald-500" /> Copied!</> : <><Copy className="w-3.5 h-3.5" /> Copy to Clipboard</>}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Right Column Actions */}
                <div className="space-y-4">
                  <div className="bg-white dark:bg-[#141414] border border-slate-200 dark:border-[#222] rounded-xl p-5 shadow-sm border-l-4 border-l-amber-500">
                    <h3 className="text-sm font-bold text-amber-600 dark:text-amber-500 mb-2 flex items-center gap-2">
                      <ChevronDown className="w-4 h-4" /> This Week: Execution Gap
                    </h3>
                    <p className="text-xs text-slate-600 dark:text-gray-400 mb-2">
                      16 students know the material but can't perform under pressure. Add timed drills with progressive difficulty.
                    </p>
                    <p className="text-[11px] font-medium text-amber-600 dark:text-amber-500">Expected impact: +15% confidence score in 3 weeks</p>
                  </div>

                  <div className="bg-white dark:bg-[#141414] border border-slate-200 dark:border-[#222] rounded-xl p-5 shadow-sm border-l-4 border-l-rose-500">
                    <h3 className="text-sm font-bold text-rose-600 dark:text-rose-500 mb-2 flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4" /> Curriculum Fix: DP (timed)
                    </h3>
                    <p className="text-xs text-slate-600 dark:text-gray-400 mb-2">
                      100% fail rate suggests the teaching material needs revision. Consider adding visual aids and real-world examples.
                    </p>
                    <p className="text-[11px] font-medium text-rose-600 dark:text-rose-500">Expected impact: -15% fail rate in 4 weeks</p>
                  </div>

                  {/* Zoom Lesson Plan Component */}
                  <div className="bg-white dark:bg-[#141414] border border-slate-200 dark:border-[#222] rounded-xl overflow-hidden shadow-sm">
                    <div className="bg-slate-50 dark:bg-[#1a1a1a] p-3 border-b border-slate-200 dark:border-[#222] flex justify-between items-center">
                      <h3 className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                        <svg className="w-4 h-4 text-blue-500" viewBox="0 0 24 24" fill="currentColor"><path d="M4.585 13.607l-.27-.012H1.886l3.236-3.137L1.886 7.32h2.429l.27-.013h1.611c1.455 0 2.261.64 2.261 1.838 0 1.258-.87 1.815-2.036 1.847 1.341.042 2.26.657 2.26 2.001 0 1.282-.907 1.942-2.316 1.942H4.585zm1.182-3.816h-1.18v2.85h1.18c.84 0 1.328-.352 1.328-1.395 0-1.077-.488-1.455-1.328-1.455zm-1.18-1.493h1.066c.747 0 1.196-.34 1.196-1.22 0-.895-.45-1.196-1.196-1.196H4.587v2.416zm10.742 5.309c-1.848 0-3.32-1.352-3.32-3.149 0-1.808 1.472-3.15 3.32-3.15 1.859 0 3.33 1.342 3.33 3.15 0 1.797-1.471 3.149-3.33 3.149zm0-1.085c1.239 0 2.128-.918 2.128-2.064 0-1.157-.889-2.065-2.128-2.065-1.229 0-2.118.908-2.118 2.065 0 1.146.889 2.064 2.118 2.064zm7.391 1.085c-1.848 0-3.32-1.352-3.32-3.149 0-1.808 1.472-3.15 3.32-3.15 1.859 0 3.33 1.342 3.33 3.15 0 1.797-1.471 3.149-3.33 3.149zm0-1.085c1.239 0 2.128-.918 2.128-2.064 0-1.157-.889-2.065-2.128-2.065-1.229 0-2.118.908-2.118 2.065 0 1.146.889 2.064 2.118 2.064zM24 12c0 6.627-5.373 12-12 12S0 18.627 0 12 5.373 0 12 0s12 5.373 12 12z"/></svg>
                        Zoom Lesson Plan
                      </h3>
                    </div>
                    <div className="p-4 bg-white dark:bg-[#141414] relative">
                      <p className="text-xs text-slate-700 dark:text-gray-300 font-mono whitespace-pre-wrap break-words">
{`*Zoom — First 10 Minutes*

1. "Pulse Check" (2 min): "Rate confidence on DP (timed) 1-5"

2. "Deep-Dive" (5 min): DP (timed) walkthrough — common mistake (100% fail rate)

3. "Confidence Boost" (3 min): 17 students cracked this — invite one to share`}
                      </p>
                      <button 
                        onClick={() => handleCopy('plan')}
                        className="mt-4 flex items-center justify-center gap-2 bg-white dark:bg-[#222] border border-slate-200 dark:border-[#333] hover:bg-slate-50 dark:hover:bg-[#2a2a2a] text-slate-700 dark:text-gray-300 py-1.5 px-3 rounded-lg text-xs font-semibold transition-all w-auto"
                      >
                        {copiedPlan ? <><Check className="w-3.5 h-3.5 text-emerald-500" /> Copied!</> : <><Copy className="w-3.5 h-3.5" /> Copy to Clipboard</>}
                      </button>
                    </div>
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