import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  BookOpen, Mic, Target, Zap, Clock, CheckCircle, 
  Sparkles, ChevronRight, Info, AlertTriangle, 
  XCircle, Check, PlaySquare, Square
} from 'lucide-react';
import { Button } from '@/shared/components/ui/button';
import { Card, CardContent } from '@/shared/components/ui/card';
import { StudentSidebar } from './dashboard/StudentSidebar';
import { StudentTopbar } from './dashboard/StudentTopbar';
import { cn } from "@/shared/utils";

type Step = 1 | 2 | 3 | 4;
type BandLevel = 'All' | 'Band 5' | 'Band 6' | 'Band 7' | 'Band 8';

export default function StudentReadingAssessmentPage() {
  const navigate = useNavigate();
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [activeBand, setActiveBand] = useState<BandLevel>('All');
  const [selectedTopic, setSelectedTopic] = useState<any>(null);
  const [currentStep, setCurrentStep] = useState<Step>(1);
  const [showTips, setShowTips] = useState(false);
  
  // Recording & Simulation States
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [revealedCount, setRevealedCount] = useState(0);

  // 1. Expanded Topics Database (6 Fully Functional Cards)
  const topics = [
    { 
      id: 1, title: "Describe your hometown.", type: "Short Answer", words: 48, phrases: 5, band: "BAND 6", 
      color: "text-blue-500", bg: "bg-blue-50 dark:bg-blue-900/20", border: "border-blue-200 dark:border-blue-800", iconType: 'pencil',
      modelAnswer: "I come from a small coastal town called Kochi in Kerala. It is known for its beautiful backwaters and vibrant fishing industry. Living there provides a peaceful atmosphere compared to major cities.",
      keywords: ["coastal town", "known for", "vibrant", "peaceful atmosphere"],
      keywordMap: [
        { word: "coastal town", meaning: "Location descriptor" },
        { word: "known for", meaning: "Fame/Reputation phrase" },
        { word: "vibrant", meaning: "Strong adjective" },
        { word: "peaceful atmosphere", meaning: "Environmental description" }
      ],
      tips: ["Use descriptive adjectives", "Mention specific locations", "Keep it personal yet formal"]
    },
    { 
      id: 2, title: "Do you think social media has a positive or negative impact on society?", type: "Paragraph", words: 81, phrases: 6, band: "BAND 7", 
      color: "text-orange-500", bg: "bg-orange-50 dark:bg-orange-900/20", border: "border-orange-200 dark:border-orange-800", iconType: 'paper',
      modelAnswer: "Social media is a double-edged sword. On the positive side, it connects people across the globe and provides a platform for voices that might otherwise be unheard. However, the negative impacts, such as the spread of misinformation, cannot be ignored. In my opinion, we must approach it with a critical eye.",
      keywords: ["double-edged sword", "On the positive side", "otherwise be unheard", "misinformation", "critical eye"],
      keywordMap: [
        { word: "double-edged sword", meaning: "Idiomatic expression" },
        { word: "On the positive side", meaning: "Transition phrase" },
        { word: "misinformation", meaning: "Topic-specific vocabulary" },
        { word: "critical eye", meaning: "Advanced collocation" }
      ],
      tips: ["Discuss both positive and negative aspects", "State your opinion clearly", "Use complex sentence structures"]
    },
    { 
      id: 3, title: "What is your favorite season and why?", type: "Short Answer", words: 56, phrases: 5, band: "BAND 6", 
      color: "text-blue-500", bg: "bg-blue-50 dark:bg-blue-900/20", border: "border-blue-200 dark:border-blue-800", iconType: 'pencil',
      modelAnswer: "My favorite season is autumn because of the comfortable temperature and the beautiful changing colors of the leaves. I enjoy the crisp air and the opportunity to wear cozy clothes without the extreme cold of winter.",
      keywords: ["comfortable temperature", "changing colors", "crisp air", "extreme cold"],
      keywordMap: [
        { word: "comfortable temperature", meaning: "Weather description" },
        { word: "crisp air", meaning: "Sensory detail" },
        { word: "extreme cold", meaning: "Comparative state" }
      ],
      tips: ["Explain the 'why' in detail", "Use sensory language (crisp air, cozy clothes)", "Compare it briefly to other seasons"]
    },
    { 
      id: 4, title: "Some people believe that technology makes life easier, while others think it creates more problems. Discuss both views and give your opinion.", type: "Paragraph", words: 93, phrases: 6, band: "BAND 7", 
      color: "text-orange-500", bg: "bg-orange-50 dark:bg-orange-900/20", border: "border-orange-200 dark:border-orange-800", iconType: 'paper',
      modelAnswer: "Technology undoubtedly has both advantages and disadvantages in modern life. Those who support technology argue that it simplifies daily tasks. For instance, smartphones allow us to communicate instantly. This convenience saves time and increases productivity. On the other hand, critics point out that technology can lead to social isolation. In my view, technology is beneficial when used in moderation. The key is finding balance.",
      keywords: ["both advantages and disadvantages", "For instance", "On the other hand", "social isolation", "in moderation", "finding balance"],
      keywordMap: [
        { word: "both advantages and disadvantages", meaning: "Thesis statement" },
        { word: "For instance", meaning: "Example marker" },
        { word: "On the other hand", meaning: "Contrast transition" },
        { word: "social isolation", meaning: "Advanced vocabulary" },
        { word: "finding balance", meaning: "Nuanced conclusion" }
      ],
      tips: ["Discuss both sides before giving opinion", "Use formal linking words", "Provide specific examples for each view", "End with balanced conclusion"]
    },
    { 
      id: 5, title: "What do you do in your free time?", type: "Short Answer", words: 38, phrases: 4, band: "BAND 5", 
      color: "text-emerald-500", bg: "bg-emerald-50 dark:bg-emerald-900/20", border: "border-emerald-200 dark:border-emerald-800", iconType: 'pencil',
      modelAnswer: "In my free time, I really enjoy reading books and playing outdoor sports. I find that these activities help me unwind after a long day. I also like spending quality time with my family.",
      keywords: ["free time", "outdoor sports", "unwind", "quality time"],
      keywordMap: [
        { word: "outdoor sports", meaning: "Specific activity" },
        { word: "unwind", meaning: "Synonym for relax" },
        { word: "quality time", meaning: "Common collocation" }
      ],
      tips: ["Keep it simple and direct", "Use frequency adverbs", "Mention 2-3 different hobbies"]
    },
    { 
      id: 6, title: "Some experts believe that it is better for children to begin learning a foreign language at primary school rather than secondary school.", type: "Paragraph", words: 102, phrases: 7, band: "BAND 8", 
      color: "text-red-500", bg: "bg-red-50 dark:bg-red-900/20", border: "border-red-200 dark:border-red-800", iconType: 'scroll',
      modelAnswer: "Early language acquisition is often seen as superior because children's brains are more receptive to new phonetic patterns. Learning a language at the primary level allows for a more natural integration into daily life, leading to better long-term fluency. While some argue this places too much pressure on young students, the cognitive benefits far outweigh the drawbacks.",
      keywords: ["Early language acquisition", "receptive", "natural integration", "long-term fluency", "cognitive benefits", "outweigh the drawbacks"],
      keywordMap: [
        { word: "acquisition", meaning: "Academic vocabulary" },
        { word: "receptive", meaning: "Advanced adjective" },
        { word: "long-term fluency", meaning: "Specific goal" },
        { word: "outweigh the drawbacks", meaning: "Complex evaluation" }
      ],
      tips: ["Use academic vocabulary (acquisition)", "Address counter-arguments", "Link cognitive benefits to learning"]
    },
  ];

  const filteredTopics = activeBand === 'All' ? topics : topics.filter(t => t.band.includes(activeBand.split(' ')[1]));

  // 2. Timer & Transcript Reveal Simulation
  useEffect(() => {
    let interval: any;
    if (isRecording) {
      interval = setInterval(() => setRecordingTime(prev => prev + 1), 1000);
    } else {
      clearInterval(interval);
    }
    return () => clearInterval(interval);
  }, [isRecording]);

  useEffect(() => {
    let typeInterval: any;
    if (isRecording && selectedTopic) {
      typeInterval = setInterval(() => {
        setRevealedCount(prev => {
          const maxWords = selectedTopic.modelAnswer.split(' ').length + (currentStep === 2 ? 2 : 0); // +2 for simulated fillers
          if (prev < maxWords) return prev + 1;
          return prev;
        });
      }, 300); // Reveals a word every 300ms
    }
    return () => clearInterval(typeInterval);
  }, [isRecording, selectedTopic, currentStep]);

  // Generate words array (injects mistakes in First Pass to look realistic)
  const simulatedWordsArray = useMemo(() => {
    if (!selectedTopic) return [];
    let words = selectedTopic.modelAnswer.split(' ');
    if (currentStep === 2) {
       words.splice(5, 0, "um,");
       words.splice(12, 0, "uh,");
    }
    return words;
  }, [selectedTopic, currentStep]);

  const visibleWords = simulatedWordsArray.slice(0, revealedCount);
  const currentFilters = visibleWords.filter((w: string) => w.includes('um') || w.includes('uh')).length;
  const currentWPM = recordingTime > 0 ? Math.round((visibleWords.length / recordingTime) * 60) : 0;

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60).toString().padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  const handleStartRecording = () => {
    setRecordingTime(0);
    setRevealedCount(0);
    setIsRecording(true);
  };

  const resetToLanding = () => {
    setSelectedTopic(null);
    setCurrentStep(1);
    setShowTips(false);
    setIsRecording(false);
    setRevealedCount(0);
  };

  // 3. Render Simulated Live Transcript
  const renderLiveTranscript = () => {
    return visibleWords.map((word: string, i: number) => {
      const cleanWord = word.replace(/[.,]/g, "").toLowerCase();
      
      // First pass styling (Shows mistakes and fillers)
      if (currentStep === 2) {
         if (cleanWord === "um" || cleanWord === "uh") {
            return <span key={i} className="text-amber-500 font-bold mx-0.5">{word} </span>;
         }
         // Randomly marking long words as "unclear/mispronounced" in red for realism
         if (cleanWord.length > 9 && i % 3 === 0) {
            return <span key={i} className="bg-rose-500/20 text-rose-400 px-1 rounded mx-0.5">{word} </span>;
         }
         return <span key={i} className="text-emerald-500 mx-0.5">{word} </span>; // Fluent green
      }
      
      // Second pass styling (Highlights keywords hit)
      if (currentStep === 3) {
         const isKeyword = selectedTopic.keywords.some((k: string) => k.toLowerCase().includes(cleanWord));
         if (isKeyword && cleanWord.length > 3) {
            return <span key={i} className="bg-emerald-500/20 text-emerald-400 font-bold px-1 rounded mx-0.5">{word} </span>;
         }
         return <span key={i} className="mx-0.5">{word} </span>;
      }
    });
  };

  // Highlights keywords in the static Familiarization phase
  const renderHighlightedText = (text: string, keywords: string[]) => {
    let result: any[] = [text];
    keywords.forEach(keyword => {
      const newResult: any[] = [];
      result.forEach(chunk => {
        if (typeof chunk === 'string') {
          const parts = chunk.split(new RegExp(`(${keyword})`, 'gi'));
          parts.forEach(part => {
            if (part.toLowerCase() === keyword.toLowerCase()) {
              newResult.push(<span key={Math.random()} className="text-violet-700 dark:text-violet-300 font-bold bg-violet-100 dark:bg-violet-900/40 px-1.5 py-0.5 rounded mx-0.5">{part}</span>);
            } else if (part) {
              newResult.push(part);
            }
          });
        } else {
          newResult.push(chunk);
        }
      });
      result = newResult;
    });
    return result;
  };

  return (
    <div className="min-h-screen bg-[#F1F3F9] dark:bg-slate-950 transition-colors duration-300 font-sans text-slate-800 dark:text-slate-200">
      <StudentSidebar 
        activeTab="assessment" 
        onTabChange={(tab) => navigate(`/student/${tab}`)}
        isCollapsed={isSidebarCollapsed}
        toggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
      />

      <div className={cn("transition-all duration-300 min-h-screen flex flex-col", isSidebarCollapsed ? 'lg:pl-24' : 'lg:pl-72')}>
        <StudentTopbar onUpgradeClick={() => {}} />

        <main className="p-8 max-w-6xl mx-auto space-y-8 animate-in fade-in duration-500 w-full">
          {!selectedTopic ? (
            /* ================= PHASE 0: LANDING UI ================= */
            <>
              <Card className="relative overflow-hidden border-none shadow-sm bg-white dark:bg-slate-900 rounded-[2rem] p-10">
                <div className="relative z-10 space-y-6">
                  <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-violet-100 dark:bg-violet-900/30 text-violet-600 dark:text-violet-400 text-xs font-bold uppercase tracking-wider">
                    <Sparkles className="w-3.5 h-3.5 fill-current" /> IELTS Reading Practice
                  </div>
                  <div className="space-y-2">
                    <h1 className="text-[2.75rem] font-extrabold text-slate-800 dark:text-white tracking-tight leading-tight">
                      Read, Speak, <span className="text-violet-600 dark:text-violet-400">Improve</span>
                    </h1>
                    <p className="text-slate-500 dark:text-slate-400 text-lg max-w-2xl">
                      Practice reading IELTS model answers aloud. Our 4-phase method builds your pronunciation, fluency, and keyword retention.
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-4 pt-4">
                    <PhaseStep icon={<BookOpen className="w-4 h-4" />} title="Familiarize" sub="Read silently" />
                    <PhaseStep icon={<Mic className="w-4 h-4" />} title="First Pass" sub="Read aloud" />
                    <PhaseStep icon={<Target className="w-4 h-4" />} title="Second Pass" sub="Hit keywords" />
                    <PhaseStep icon={<Zap className="w-4 h-4" />} title="AI Analysis" sub="Get feedback" />
                  </div>
                </div>
              </Card>

              <div className="flex flex-wrap justify-center gap-3">
                {['All Levels', 'Band 5 · Foundation', 'Band 6 · Competent', 'Band 7 · Advanced', 'Band 8 · Expert'].map((label) => {
                  const level = label === 'All Levels' ? 'All' : label.split(' · ')[0];
                  return (
                    <button key={label} onClick={() => setActiveBand(level as BandLevel)}
                      className={cn("px-6 py-2.5 rounded-xl text-sm font-semibold transition-all border",
                        activeBand === level ? "bg-violet-600 text-white shadow-lg shadow-violet-200 dark:shadow-none" : "bg-white dark:bg-slate-900 text-slate-400 border-transparent")}>
                      {label}
                    </button>
                  );
                })}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {filteredTopics.map((topic) => (
                  <Card key={topic.id} className="border-none shadow-sm hover:shadow-md transition-all cursor-pointer rounded-2xl bg-white dark:bg-slate-900 group"
                    onClick={() => { setSelectedTopic(topic); setIsRecording(false); setRevealedCount(0); }}>
                    <CardContent className="p-8">
                      <div className="flex justify-between items-start mb-6">
                        <div className="text-2xl">{topic.iconType === 'paper' ? '📄' : topic.iconType === 'scroll' ? '📜' : '📝'}</div>
                        <div className={cn("px-3 py-1 rounded-full text-[10px] font-bold tracking-widest border uppercase", topic.border, topic.color)}>{topic.band}</div>
                      </div>
                      <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100 mb-6 group-hover:text-violet-600 transition-colors">{topic.title}</h3>
                      <div className="flex items-center gap-4 text-slate-400 text-xs font-semibold">
                        <div className="flex items-center gap-1.5"><Target className="w-4 h-4 opacity-70" /> {topic.phrases} key phrases</div>
                        <span className="w-1.5 h-1.5 rounded-full bg-slate-200 dark:bg-slate-700"></span>
                        <div>{topic.type}</div>
                        <span className="w-1.5 h-1.5 rounded-full bg-slate-200 dark:bg-slate-700"></span>
                        <div className="flex items-center gap-1.5"><Clock className="w-4 h-4 opacity-70" /> {topic.words} words</div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </>
          ) : (
            /* ================= MULTI-STEP FLOW ================= */
            <div className="max-w-4xl mx-auto space-y-6">
              <Button variant="ghost" onClick={resetToLanding} className="mb-4 text-slate-500 hover:text-slate-800 dark:hover:text-slate-200">
                <ChevronRight className="w-4 h-4 rotate-180 mr-2" /> Back to questions
              </Button>
              
              <div className="flex gap-4 mb-8 justify-center">
                {[1, 2, 3, 4].map(s => (
                  <div key={s} className={cn("h-10 w-10 rounded-full flex items-center justify-center font-bold transition-all shadow-sm",
                    currentStep === s ? "bg-violet-600 text-white ring-4 ring-violet-100 dark:ring-violet-900/50" : s < currentStep ? "bg-emerald-500 text-white" : "bg-white dark:bg-slate-800 text-slate-400")}>
                    {s < currentStep ? <CheckCircle className="h-5 w-5" /> : s}
                  </div>
                ))}
              </div>

              {/* ----- STEP 1: FAMILIARIZATION ----- */}
              {currentStep === 1 && (
                <StepContainer title="Familiarization Phase" desc="Read the question and model answer together. Take your time to understand the structure and vocabulary.">
                   <div className="space-y-4">
                      <div className="p-6 bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm">
                        <p className="text-xs font-bold text-slate-400 uppercase mb-3">Question</p>
                        <p className="text-lg font-semibold">{selectedTopic.title}</p>
                      </div>
                      
                      <div className="p-8 bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm relative">
                        <div className="flex justify-between items-center mb-5">
                           <p className="text-xs font-bold text-slate-400 uppercase flex items-center gap-2"><BookOpen className="w-4 h-4" /> Model Answer</p>
                           <button className="text-[10px] text-slate-400 uppercase font-bold hover:text-slate-600">Hide Answer</button>
                        </div>
                        <div className="text-slate-700 dark:text-slate-300 leading-relaxed text-[1.1rem]">
                          {renderHighlightedText(selectedTopic.modelAnswer, selectedTopic.keywords)}
                        </div>
                      </div>
                   </div>

                   <div className="pt-2">
                      <button onClick={() => setShowTips(!showTips)} className="text-violet-600 dark:text-violet-400 text-sm font-bold flex items-center gap-2">
                        <Info className="w-4 h-4" /> {showTips ? 'Hide Tips' : 'Show Tips for this question'}
                      </button>
                      {showTips && (
                        <ul className="mt-4 p-6 bg-slate-50 dark:bg-slate-900/50 rounded-2xl border border-slate-100 dark:border-slate-800 space-y-3 animate-in slide-in-from-top-2">
                          {selectedTopic.tips.map((tip: string, i: number) => (
                            <li key={i} className="text-sm text-slate-600 dark:text-slate-400 flex items-center gap-3">
                              <div className="w-1.5 h-1.5 rounded-full bg-violet-400" /> {tip}
                            </li>
                          ))}
                        </ul>
                      )}
                   </div>
                   <Button size="lg" className="w-full bg-violet-600 hover:bg-violet-700 h-14 rounded-2xl text-lg font-bold mt-4" onClick={() => setCurrentStep(2)}>
                     I'm Ready — Start Reading Practice
                   </Button>
                </StepContainer>
              )}

              {/* ----- STEP 2: FIRST PASS ----- */}
              {currentStep === 2 && (
                <StepContainer title="01. First Pass: Read Aloud" desc="Read the entire answer out loud at a natural pace. Your speech is captured live.">
                   <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                      <StatMini label="WPM" value={currentWPM} />
                      <StatMini label="Words" value={visibleWords.length} />
                      <StatMini label="Filters" value={currentFilters} />
                      <StatMini label="Pauses" value={isRecording && recordingTime > 5 ? "1" : "0"} />
                   </div>
                   
                   <div className="p-8 bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm mb-6">
                      <p className="text-xs font-bold text-slate-400 uppercase mb-4">Model Answer (read this aloud)</p>
                      <p className="text-slate-700 dark:text-slate-300 leading-relaxed text-[1.1rem] opacity-70">
                        {selectedTopic.modelAnswer}
                      </p>
                   </div>

                   <div className="bg-slate-900 dark:bg-slate-950 rounded-2xl p-6 border border-slate-800 shadow-lg">
                     <div className="flex justify-between items-center mb-4 border-b border-slate-800 pb-4">
                        <div className="flex items-center gap-4">
                          <div className="flex items-center gap-2 text-rose-500">
                            <div className={cn("w-2 h-2 rounded-full", isRecording ? "bg-rose-500 animate-ping" : "bg-slate-600")} />
                            <span className="text-xs font-bold uppercase tracking-widest text-slate-300">Live Transcript</span>
                          </div>
                          <div className="hidden sm:flex items-center gap-3 text-[10px] font-bold uppercase tracking-wider text-slate-500">
                             <span className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-emerald-500"/> Fluent</span>
                             <span className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-amber-500"/> Filler</span>
                             <span className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-rose-500"/> Unclear</span>
                          </div>
                        </div>
                        <span className="text-xs font-mono text-slate-400">{formatTime(recordingTime)} / 00:45</span>
                     </div>
                     <div className="min-h-[120px] bg-slate-800/30 rounded-xl p-6 text-[1.1rem] font-medium leading-relaxed text-slate-400">
                        {!isRecording && revealedCount === 0 ? (
                          <div className="h-full flex flex-col items-center justify-center text-slate-500 space-y-3">
                            <Mic className="w-8 h-8 opacity-50" />
                            <span className="text-sm">Click start to begin recording...</span>
                          </div>
                        ) : (
                          <div>
                            {renderLiveTranscript()}
                            {isRecording && <span className="animate-pulse border-r-2 border-violet-500 ml-1"></span>}
                          </div>
                        )}
                     </div>
                   </div>

                   {!isRecording ? (
                     <Button size="lg" className="w-full bg-violet-600 h-14 rounded-2xl font-bold mt-6 shadow-lg shadow-violet-200 dark:shadow-none" onClick={handleStartRecording}>
                       <PlaySquare className="w-5 h-5 mr-2" /> Start Reading
                     </Button>
                   ) : (
                     <Button size="lg" className="w-full bg-rose-500 hover:bg-rose-600 h-14 rounded-2xl font-bold mt-6" onClick={() => { setIsRecording(false); setCurrentStep(3); }}>
                       <Square className="w-5 h-5 mr-2" /> Done — Analyze My Reading
                     </Button>
                   )}
                </StepContainer>
              )}

              {/* ----- STEP 3: SECOND PASS ----- */}
              {currentStep === 3 && (
                <StepContainer title="02. Second Pass: Keyword Focus" desc="Read again, paying attention to highlighted keywords. Watch your keyword tracker update in real-time!">
                   <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                      <StatMini label="Keyword Coverage" value={isRecording ? `${Math.min(selectedTopic.keywords.length, Math.floor(revealedCount / 8))}/${selectedTopic.keywords.length}` : `0/${selectedTopic.keywords.length}`} />
                      <StatMini label="Words" value={visibleWords.length} />
                      <StatMini label="Filters" value="0" />
                      <StatMini label="Time" value={formatTime(recordingTime)} />
                   </div>

                   <div className="space-y-6">
                      <div className="p-8 bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm">
                        <p className="text-xs font-bold text-slate-400 uppercase mb-4">Model Answer (Keywords Highlighted)</p>
                        <div className="text-slate-700 dark:text-slate-300 leading-relaxed text-[1.1rem]">
                          {renderHighlightedText(selectedTopic.modelAnswer, selectedTopic.keywords)}
                        </div>
                      </div>

                      <div className="p-6 bg-slate-900 rounded-2xl border border-slate-800 text-slate-300">
                        <p className="text-sm font-bold text-white mb-4 uppercase tracking-wider">Why these keywords matter:</p>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-3">
                           {selectedTopic.keywordMap.map((km: any, idx: number) => (
                             <div key={idx} className="flex items-start gap-3 text-sm">
                               <span className="px-2 py-1 bg-violet-900/50 text-violet-300 rounded text-xs font-bold shrink-0">{km.word}</span>
                               <span className="text-slate-400 mt-0.5">→ {km.meaning}</span>
                             </div>
                           ))}
                        </div>
                      </div>

                      <div className="bg-slate-900 dark:bg-slate-950 rounded-2xl p-6 border border-slate-800 shadow-lg">
                         <div className="flex justify-between items-center mb-4 border-b border-slate-800 pb-4">
                            <div className="flex items-center gap-2 text-rose-500">
                              <div className={cn("w-2 h-2 rounded-full", isRecording ? "bg-rose-500 animate-ping" : "bg-slate-600")} />
                              <span className="text-xs font-bold uppercase tracking-widest text-slate-300">Live Transcript</span>
                            </div>
                            <span className="text-xs font-mono text-slate-400">{formatTime(recordingTime)}</span>
                         </div>
                         <div className="min-h-[100px] bg-slate-800/30 rounded-xl p-6 text-[1.1rem] font-medium leading-relaxed text-slate-400">
                           {!isRecording && revealedCount === 0 ? (
                              <div className="h-full flex flex-col items-center justify-center text-slate-500 space-y-3">
                                <Mic className="w-8 h-8 opacity-50" />
                                <span className="text-sm">Click start to see your keywords tracked live...</span>
                              </div>
                           ) : (
                              <div>
                                {renderLiveTranscript()}
                                {isRecording && <span className="animate-pulse border-r-2 border-emerald-500 ml-1"></span>}
                              </div>
                           )}
                         </div>
                      </div>
                   </div>

                   {!isRecording ? (
                     <Button size="lg" className="w-full bg-violet-600 h-14 rounded-2xl font-bold mt-6 shadow-lg shadow-violet-200 dark:shadow-none" onClick={handleStartRecording}>
                       <PlaySquare className="w-5 h-5 mr-2" /> Read Again (Focus on Keywords)
                     </Button>
                   ) : (
                     <Button size="lg" className="w-full bg-rose-500 hover:bg-rose-600 h-14 rounded-2xl font-bold mt-6" onClick={() => setCurrentStep(4)}>
                       <Square className="w-5 h-5 mr-2" /> Finish & Analyze Results
                     </Button>
                   )}
                </StepContainer>
              )}

              {/* ----- STEP 4: AI RESULTS ----- */}
              {currentStep === 4 && (
                <div className="space-y-8 animate-in slide-in-from-bottom-4">
                  <div className="text-center space-y-2 mb-8">
                    <h2 className="text-3xl font-extrabold text-slate-800 dark:text-white">Reading Practice Results</h2>
                    <span className="inline-block px-3 py-1 bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-300 rounded-full text-xs font-bold uppercase tracking-widest">Good • Band {selectedTopic.band.split(' ')[1]}</span>
                  </div>

                  {/* Top Stats Row */}
                  <div className="grid grid-cols-3 gap-4">
                    <div className="text-center bg-white dark:bg-slate-900 rounded-[2rem] p-6 shadow-sm border border-slate-100 dark:border-slate-800">
                      <div className="text-4xl font-black text-violet-600 dark:text-violet-400 mb-2">100</div>
                      <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Fluency</div>
                    </div>
                    <div className="text-center bg-white dark:bg-slate-900 rounded-[2rem] p-6 shadow-sm border border-slate-100 dark:border-slate-800">
                      <div className="text-4xl font-black text-violet-600 dark:text-violet-400 mb-2">86</div>
                      <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Pronunciation</div>
                    </div>
                    <div className="text-center bg-white dark:bg-slate-900 rounded-[2rem] p-6 shadow-sm border border-slate-100 dark:border-slate-800">
                      <div className="text-4xl font-black text-violet-600 dark:text-violet-400 mb-2">100</div>
                      <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Keywords</div>
                    </div>
                  </div>

                  {/* Sub Stats Row */}
                  <div className="flex justify-around bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800">
                    <div className="text-center"><div className="font-bold text-lg text-slate-800 dark:text-white">202</div><div className="text-[10px] uppercase text-slate-400 font-bold">Words/Min</div></div>
                    <div className="text-center"><div className="font-bold text-lg text-slate-800 dark:text-white">2</div><div className="text-[10px] uppercase text-slate-400 font-bold">Filters Used</div></div>
                    <div className="text-center"><div className="font-bold text-lg text-slate-800 dark:text-white">{selectedTopic.keywords.length}/{selectedTopic.keywords.length}</div><div className="text-[10px] uppercase text-slate-400 font-bold">Keywords Hit</div></div>
                  </div>

                  {/* Filter Words Breakdown */}
                  <div className="bg-amber-50 dark:bg-slate-900 p-6 rounded-2xl border border-amber-200 dark:border-amber-900/50">
                    <div className="flex items-center gap-2 mb-4">
                      <AlertTriangle className="w-5 h-5 text-amber-500" />
                      <h3 className="font-bold text-amber-900 dark:text-amber-500">Filter Words Breakdown</h3>
                    </div>
                    <p className="text-sm text-amber-800 dark:text-slate-400 mb-4">You used 2 filler words. Each one disrupts your flow and costs you marks in IELTS.</p>
                    <div className="space-y-2 mb-4">
                      <div className="flex justify-between items-center bg-white dark:bg-slate-800 p-3 rounded-xl border border-amber-100 dark:border-slate-700">
                        <span className="font-mono text-rose-500 font-bold">"um"</span><span className="text-xs font-bold text-slate-400">1x</span>
                      </div>
                      <div className="flex justify-between items-center bg-white dark:bg-slate-800 p-3 rounded-xl border border-amber-100 dark:border-slate-700">
                        <span className="font-mono text-rose-500 font-bold">"uh"</span><span className="text-xs font-bold text-slate-400">1x</span>
                      </div>
                    </div>
                    <div className="text-xs font-semibold text-amber-700 dark:text-amber-400 bg-amber-100 dark:bg-amber-900/30 p-3 rounded-lg flex items-start gap-2">
                      <span>💡</span> Pro tip: Replace "like" with a silent pause. Pausing shows confidence; fillers show uncertainty.
                    </div>
                  </div>

                  {/* Pronunciation Feedback */}
                  <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm">
                    <div className="flex items-center gap-2 mb-6">
                      <Mic className="w-5 h-5 text-violet-600" />
                      <h3 className="font-bold text-slate-800 dark:text-slate-200">Pronunciation & Emphasis Feedback</h3>
                    </div>
                    <div className="space-y-3">
                      <div className="p-4 rounded-xl border border-emerald-100 bg-emerald-50 dark:bg-emerald-900/10 dark:border-emerald-900/30">
                        <div className="flex items-center gap-2 font-bold text-emerald-800 dark:text-emerald-400 mb-1"><Check className="w-4 h-4" /> {selectedTopic.keywords[0]}</div>
                        <div className="text-xs text-emerald-600 dark:text-emerald-500">Great pronunciation of "{selectedTopic.keywords[0]}"!</div>
                      </div>
                      <div className="p-4 rounded-xl border border-rose-100 bg-rose-50 dark:bg-rose-900/10 dark:border-rose-900/30">
                        <div className="flex items-center gap-2 font-bold text-rose-800 dark:text-rose-400 mb-1"><XCircle className="w-4 h-4" /> {selectedTopic.keywords[1] || "Example word"}</div>
                        <div className="text-xs text-rose-600 dark:text-rose-500">You missed this keyword. Practice saying it clearly: break it into syllables first.</div>
                      </div>
                    </div>
                  </div>

                  {/* First vs Second Pass */}
                  <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm">
                    <h3 className="font-bold text-slate-800 dark:text-slate-200 mb-6">First vs Second Pass</h3>
                    <div className="space-y-6">
                      <div>
                        <div className="flex justify-between text-xs font-bold text-slate-400 mb-2"><span>Fluency</span><span className="text-emerald-500 font-mono">0%</span></div>
                        <div className="flex h-8 rounded-full overflow-hidden bg-slate-100 dark:bg-slate-800">
                          <div className="w-1/2 bg-violet-200 dark:bg-violet-900/40 flex items-center justify-center text-[10px] font-bold text-violet-700 dark:text-violet-300">1st: 100</div>
                          <div className="w-1/2 bg-violet-500 flex items-center justify-center text-[10px] font-bold text-white border-l border-white/20">2nd: 100</div>
                        </div>
                      </div>
                      <div>
                        <div className="flex justify-between text-xs font-bold text-slate-400 mb-2"><span>Hesitations</span><span className="text-emerald-500 font-mono">-1</span></div>
                        <div className="flex h-8 rounded-full overflow-hidden bg-slate-100 dark:bg-slate-800">
                          <div className="w-2/3 bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-[10px] font-bold text-slate-600 dark:text-slate-300">1st: 3</div>
                          <div className="w-1/3 bg-emerald-400 flex items-center justify-center text-[10px] font-bold text-white border-l border-white/20">2nd: 2</div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-4 pt-4">
                    <Button variant="outline" className="flex-1 h-14 rounded-2xl font-bold border-2" onClick={() => setCurrentStep(1)}>Try Again</Button>
                    <Button className="flex-1 h-14 rounded-2xl font-bold bg-violet-600 text-white hover:bg-violet-700" onClick={resetToLanding}>Back to Dashboard</Button>
                  </div>
                </div>
              )}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

// Sub-components
const PhaseStep = ({ icon, title, sub }: any) => (
  <div className="flex items-center gap-3 bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 p-3 rounded-2xl pr-8 shadow-sm">
    <div className="p-2.5 rounded-xl bg-violet-50 dark:bg-violet-900/30 text-violet-600 dark:text-violet-400">{icon}</div>
    <div className="flex flex-col">
      <span className="text-sm font-bold text-slate-800 dark:text-slate-100 leading-none">{title}</span>
      <span className="text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase mt-1 tracking-tight">{sub}</span>
    </div>
  </div>
);

const StepContainer = ({ title, desc, children }: any) => (
  <div className="space-y-6 animate-in slide-in-from-right-4 duration-500">
    <div className="space-y-2 mb-8 text-center max-w-2xl mx-auto">
      <h2 className="text-3xl font-extrabold text-slate-800 dark:text-slate-100 tracking-tight">{title}</h2>
      <p className="text-slate-500 text-[1.1rem] leading-relaxed">{desc}</p>
    </div>
    {children}
  </div>
);

const StatMini = ({ label, value }: any) => (
  <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm text-center">
    <div className="text-3xl font-black text-violet-600 dark:text-violet-400 mb-1">{value}</div>
    <div className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{label}</div>
  </div>
);