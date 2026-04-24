import React, { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { GraduationCap, ArrowRight, CheckCircle2, AlertCircle, Target, BookOpen, Headphones, PenLine, Mic, BrainCircuit, PlayCircle, Loader2 } from "lucide-react";

// ─────────────────────────────────────────────────────────────────────────────
// TYPES & INTERFACES
// ─────────────────────────────────────────────────────────────────────────────

type Skill = "listening" | "reading" | "writing" | "speaking";
type Phase = "gate" | "session" | "interim" | "scoring" | "results";

interface AssessmentResult {
  skill: Skill;
  bandScore: number;
  feedback: string;
}

const SKILL_ORDER: Skill[] = ["listening", "reading", "writing", "speaking"];
const STORAGE_KEY = "tc_full_mock_assessment_state";

// ─────────────────────────────────────────────────────────────────────────────
// FULL IELTS MOCK DATA
// ─────────────────────────────────────────────────────────────────────────────

// 40 LISTENING QUESTIONS (From your uploaded document)
const LISTENING_DATA = {
  audio_url: "/diagnostics/audio/Full_Mock_Listening_Track.mp3",
  context: "Listen to the audio track carefully. The recording will play continuously for all 40 questions. It will only play once.",
  questions: [
    // Section 1: Renting a Flat (Q1-10)
    { id: "L1", section: "Section 1: Renting a Flat", text: "Name of the estate agency: ___________________________", options: [] },
    { id: "L2", section: "Section 1: Renting a Flat", text: "Location of the flat: ___________________________", options: [] },
    { id: "L3", section: "Section 1: Renting a Flat", text: "Size of the flat: ___________________________", options: [] },
    { id: "L4", section: "Section 1: Renting a Flat", text: "Monthly rent (not including bills): £ ___________________________", options: [] },
    { id: "L5", section: "Section 1: Renting a Flat", text: "Extra monthly cost for parking: £ ___________________________", options: [] },
    { id: "L6", section: "Section 1: Renting a Flat", text: "The flat has a sofa, a bed, and wardrobes but NO ___________________________", options: [] },
    { id: "L7", section: "Section 1: Renting a Flat", text: "Bus number that stops at the end of the street: ___________________________", options: [] },
    { id: "L8", section: "Section 1: Renting a Flat", text: "Distance to the nearest train station: ___________________________", options: [] },
    { id: "L9", section: "Section 1: Renting a Flat", text: "Viewing day and time chosen by Mike: ___________________________", options: [] },
    { id: "L10", section: "Section 1: Renting a Flat", text: "Mike's phone number: ___________________________", options: [] },
    
    // Section 2: Greenfield Shopping Centre (Q11-20)
    { id: "L11", section: "Section 2: Greenfield Shopping Centre", text: "Weekday opening hours: ___________________________", options: [] },
    { id: "L12", section: "Section 2: Greenfield Shopping Centre", text: "Sunday closing time: ___________________________", options: [] },
    { id: "L13", section: "Section 2: Greenfield Shopping Centre", text: "Total number of shops: ___________________________", options: [] },
    { id: "L14", section: "Section 2: Greenfield Shopping Centre", text: "Number of floors: ___________________________", options: [] },
    { id: "L15", section: "Section 2: Greenfield Shopping Centre", text: "FreshMart (supermarket) opens at: ___________________________", options: [] },
    { id: "L16", section: "Section 2: Greenfield Shopping Centre", text: "Children's play area is supervised until: ___________________________", options: [] },
    { id: "L17", section: "Section 2: Greenfield Shopping Centre", text: "Number of restaurants in the food court: ___________________________", options: [] },
    { id: "L18", section: "Section 2: Greenfield Shopping Centre", text: "Number of cinema screens: ___________________________", options: [] },
    { id: "L19", section: "Section 2: Greenfield Shopping Centre", text: "Parking cost after the first two free hours: ___________________________", options: [] },
    { id: "L20", section: "Section 2: Greenfield Shopping Centre", text: "Bus numbers that stop outside the centre: ___________________________", options: [] },

    // Section 3: Housing Survey Project (Q21-30)
    { id: "L21", section: "Section 3: Housing Survey Project", text: "How many questionnaire responses did the students collect?", options: ["A. 80", "B. 100", "C. 120", "D. 150"] },
    { id: "L22", section: "Section 3: Housing Survey Project", text: "What were the two main topics of the survey?", options: ["A. Housing costs and green spaces", "B. Housing costs and transport", "C. Transport and population", "D. Rent and employment"] },
    { id: "L23", section: "Section 3: Housing Survey Project", text: "What percentage of people said they could not afford to live in the city centre?", options: ["A. More than 40%", "B. Exactly 50%", "C. More than 60%", "D. Nearly 80%"] },
    { id: "L24", section: "Section 3: Housing Survey Project", text: "What did most respondents say was the biggest problem?", options: ["A. Buying a house", "B. Lack of transport", "C. High rent", "D. Noise levels"] },
    { id: "L25", section: "Section 3: Housing Survey Project", text: "What surprised the students about younger people's preferences?", options: ["A. They wanted to live near universities", "B. They preferred the suburbs over the city", "C. They chose transport over price", "D. They preferred city centre shopping"] },
    { id: "L26", section: "Section 3: Housing Survey Project", text: "What did younger people say was very important to them? ___________________________", options: [] },
    { id: "L27", section: "Section 3: Housing Survey Project", text: "Who will design the charts and graphs for the project? ___________________________", options: [] },
    { id: "L28", section: "Section 3: Housing Survey Project", text: "Who will write the main report? ___________________________", options: [] },
    { id: "L29", section: "Section 3: Housing Survey Project", text: "When will the students give their presentation? ___________________________", options: [] },
    { id: "L30", section: "Section 3: Housing Survey Project", text: "What did Dr. Brown advise them to add at the end of the project? ___________________________", options: [] },

    // Section 4: Shopping Habits in Modern Life (Q31-40)
    { id: "L31", section: "Section 4: Shopping Habits", text: "Estimated percentage of shopping now done online: ___________________________", options: [] },
    { id: "L32", section: "Section 4: Shopping Habits", text: "What happened to many small shops when large shopping centres opened? ___________________________", options: [] },
    { id: "L33", section: "Section 4: Shopping Habits", text: "One advantage of online shopping mentioned: ___________________________", options: [] },
    { id: "L34", section: "Section 4: Shopping Habits", text: "What problem has the rise of online shopping caused for the high street? ___________________________", options: [] },
    { id: "L35", section: "Section 4: Shopping Habits", text: "Fraction of shops that are now empty in some towns: ___________________________", options: [] },
    { id: "L36", section: "Section 4: Shopping Habits", text: "What are empty shop buildings being turned into?", options: ["A. Offices and car parks", "B. Schools and hospitals", "C. Flats, cafes and community spaces", "D. Warehouses and factories"] },
    { id: "L37", section: "Section 4: Shopping Habits", text: "According to research, people now prefer to spend money on:", options: ["A. Technology and gadgets", "B. Restaurants, entertainment and travel", "C. Home improvements", "D. Clothing and fashion"] },
    { id: "L38", section: "Section 4: Shopping Habits", text: "What must future shopping centres offer to be successful?", options: ["A. Lower prices than online stores", "B. More parking spaces", "C. Experiences and reasons to spend time there", "D. A wider range of products"] },
    { id: "L39", section: "Section 4: Shopping Habits", text: "What will next week's lecture focus on?", options: ["A. Online shopping statistics", "B. Urban planning policies", "C. Case studies from different countries", "D. The history of markets"] },
    { id: "L40", section: "Section 4: Shopping Habits", text: "What must students read before the next class?", options: ["A. A journal article on e-commerce", "B. The chapter on urban retail development", "C. A report on housing trends", "D. A case study on consumer behaviour"] }
  ]
};

// 40 READING QUESTIONS (3 Passages)
const READING_DATA = {
  passages: [
    { title: "Passage 1: Urban Vertical Farming", content: "Paragraph A: In recent years, vertical farming has emerged as one of the most talked-about innovations in urban food production. Unlike conventional agriculture, which relies on large areas of flat land, vertical farms stack crops in layers inside controlled indoor environments...\n\n(Full Passage 1 text here in a real scenario)" },
    { title: "Passage 2: The History of the Antikythera Mechanism", content: "Discovered in 1901 off the coast of the Greek island Antikythera, this ancient analogue computer has baffled historians for decades. It was designed to predict astronomical positions and eclipses for calendrical and astrological purposes...\n\n(Full Passage 2 text here in a real scenario)" },
    { title: "Passage 3: Neuroplasticity in Adult Brains", content: "For a long time, it was believed that as we aged, the connections in our brain became fixed. However, recent research in neuroplasticity proves that the adult brain retains the ability to reorganize itself by forming new neural connections throughout life...\n\n(Full Passage 3 text here in a real scenario)" }
  ],
  // We generate an array of 40 placeholder reading questions for the mock
  questions: Array.from({ length: 40 }, (_, i) => ({
    id: `R${i + 1}`,
    section: i < 13 ? "Passage 1" : i < 26 ? "Passage 2" : "Passage 3",
    text: i % 3 === 0 ? `Read the passage and answer TRUE, FALSE, or NOT GIVEN for Question ${i + 1}.` : `Provide a short answer from the text for Question ${i + 1}.`,
    options: i % 3 === 0 ? ["TRUE", "FALSE", "NOT GIVEN"] : []
  }))
};

// FULL WRITING SECTION (Strictly 2 Tasks)
const WRITING_DATA = {
  questions: [
    { 
      id: "W1", 
      section: "Task 1", 
      context: "The chart below shows the percentage of adults in four countries who used the internet daily in 2010 and 2022.\n\nSummarise the information by selecting and reporting the main features, and make comparisons where relevant.\n\nWrite at least 150 words.",
      minWords: 150 
    },
    { 
      id: "W2", 
      section: "Task 2", 
      context: "Some people think that universities should only offer courses that lead directly to employment. Others believe universities should offer a wider range of subjects.\n\nDiscuss both views and give your own opinion.\n\nWrite at least 250 words.",
      minWords: 250 
    }
  ]
};

// SPEAKING SECTION (Parts 1, 2, and 3)
const SPEAKING_DATA = {
  questions: [
    { id: "S1", section: "Part 1", text: "What kind of work or studies are you currently involved in?" },
    { id: "S2", section: "Part 1", text: "How do you usually spend your free time?" },
    { id: "S3", section: "Part 1", text: "How important is it to you to keep up with the news?" },
    { id: "S4", section: "Part 1", text: "Do you prefer living in a city or a smaller town? Why?" },
    { id: "S5", section: "Part 2 (Cue Card)", text: "Describe a skill you have learned that you consider useful in everyday life. Explain what it is, when/how you learned it, and why it's valuable. (Speak for 1-2 minutes)" },
    { id: "S6", section: "Part 3", text: "Why do you think some people find it difficult to learn new skills as adults compared to when they were children?" },
    { id: "S7", section: "Part 3", text: "In what ways can schools better prepare students with practical life skills?" },
    { id: "S8", section: "Part 3", text: "Some people argue that online learning platforms have made acquiring new skills easier for everyone. Do you agree?" },
    { id: "S9", section: "Part 3", text: "How do you think technology will change the kinds of skills that are valued in the workplace over the next twenty years?" },
    { id: "S10", section: "Part 3", text: "Do you think governments have a responsibility to fund adult education and skills training programmes?" }
  ]
};

// ─────────────────────────────────────────────────────────────────────────────
// UTILS
// ─────────────────────────────────────────────────────────────────────────────

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

function countWords(text: string): number {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

const SKILL_LABELS: Record<Skill, string> = { listening: "Listening", reading: "Reading", writing: "Writing", speaking: "Speaking" };
const SKILL_ICONS: Record<Skill, string> = { listening: "🎧", reading: "📖", writing: "✍️", speaking: "🎤" };
const SKILL_DURATIONS: Record<Skill, number> = {
  listening: 30 * 60, // 30 mins
  reading: 60 * 60,   // 60 mins
  writing: 60 * 60,   // 60 mins
  speaking: 14 * 60   // 14 mins overall timer
};

// ─────────────────────────────────────────────────────────────────────────────
// COMPONENTS
// ─────────────────────────────────────────────────────────────────────────────

function TopNavBar() {
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-white border-b-2 border-gray-900 transform-gpu">
      <div className="w-full px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 bg-indigo-700 border-2 border-gray-900 rounded-lg" style={{ boxShadow: '3px 3px 0 #0F0F0F' }}>
              <GraduationCap className="h-5 w-5 text-white" />
            </div>
            <span className="text-xl font-black text-gray-900 uppercase tracking-tight">TestCrack Mock</span>
          </div>
        </div>
      </div>
    </nav>
  );
}

const CircleTimer: React.FC<{ timeLeft: number; total: number; size?: number }> = ({ timeLeft, total, size = 64 }) => {
  const pct = total > 0 ? timeLeft / total : 1;
  const r = (size - 8) / 2;
  const circ = 2 * Math.PI * r;
  const dash = circ * pct;
  const isUrgent = pct < 0.1; // Less than 10% time remaining
  const color = isUrgent ? "#EF4444" : pct < 0.5 ? "#F59E0B" : "#4338CA";
  return (
    <svg width={size} height={size} style={{ transform: "rotate(-90deg)", flexShrink: 0 }}>
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#E5E7EB" strokeWidth={6} />
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth={6} strokeDasharray={`${dash} ${circ}`} strokeLinecap="round" style={{ transition: "stroke-dasharray 0.5s linear, stroke 0.3s" }} />
      <text x={size / 2} y={size / 2 + 1} textAnchor="middle" dominantBaseline="middle" fill={isUrgent ? "#EF4444" : "#111827"} fontSize={size / 4.2} fontWeight="900" fontFamily="monospace" style={{ transform: "rotate(90deg)", transformOrigin: `${size / 2}px ${size / 2}px` }}>
        {formatTime(timeLeft)}
      </text>
    </svg>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// MAIN ROUTER
// ─────────────────────────────────────────────────────────────────────────────

export default function FullMockAssessment() {
  const navigate = useNavigate();
  
  // App State
  const [phase, setPhase] = useState<Phase>("gate");
  const [skillIdx, setSkillIdx] = useState(0);
  const activeSkill = SKILL_ORDER[skillIdx];

  // Score Accumulation
  const [allResults, setAllResults] = useState<Record<Skill, AssessmentResult | null>>({
    listening: null, reading: null, writing: null, speaking: null
  });

  // Session State Variables
  const [currentIdx, setCurrentIdx] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [recordedPrompts, setRecordedPrompts] = useState<Record<string, boolean>>({}); 
  
  // Audio State for Listening
  const audioRef = useRef<HTMLAudioElement>(null);
  const [audioState, setAudioState] = useState<'idle' | 'playing' | 'played'>('idle');
  
  // Dynamic Data State
  const [sessionData, setSessionData] = useState<any>(null);
  const [isLoadingSession, setIsLoadingSession] = useState(false);
  const [isRestoring, setIsRestoring] = useState(true);

  // Timers & Media
  const [timeLeft, setTimeLeft] = useState(0);
  const [isRecording, setIsRecording] = useState(false);
  const [showPassage, setShowPassage] = useState(false);
  const [animBars] = useState(() => Array.from({ length: 12 }, () => Math.random()));

  // --- PERSISTENCE: Restore State on Mount ---
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setPhase(parsed.phase || "gate");
        setSkillIdx(parsed.skillIdx || 0);
        setCurrentIdx(parsed.currentIdx || 0);
        setAnswers(parsed.answers || {});
        setRecordedPrompts(parsed.recordedPrompts || {});
        setTimeLeft(parsed.timeLeft || 0);
        setAllResults(parsed.allResults || { listening: null, reading: null, writing: null, speaking: null });
        setSessionData(parsed.sessionData || null);
        setAudioState(parsed.audioState === 'playing' ? 'idle' : (parsed.audioState || 'idle'));
      } catch (e) {
        console.error("Corrupted save data found. Starting fresh.");
        localStorage.removeItem(STORAGE_KEY);
      }
    }
    setIsRestoring(false);
  }, []);

  // --- PERSISTENCE: Save State on Change ---
  useEffect(() => {
    if (isRestoring || phase === "gate") return;
    localStorage.setItem(STORAGE_KEY, JSON.stringify({
      phase, skillIdx, currentIdx, answers, recordedPrompts, timeLeft, allResults, sessionData, audioState
    }));
  }, [phase, skillIdx, currentIdx, answers, recordedPrompts, timeLeft, allResults, sessionData, audioState, isRestoring]);


  const fetchAssessmentData = async (targetSkill: Skill) => {
    await new Promise(resolve => setTimeout(resolve, 800)); // Network delay
    
    if (targetSkill === 'listening') return LISTENING_DATA;
    if (targetSkill === 'reading') return READING_DATA;
    if (targetSkill === 'writing') return WRITING_DATA;
    if (targetSkill === 'speaking') return SPEAKING_DATA;
  };

  const initializeSessionState = async (targetSkill: Skill) => {
    setIsLoadingSession(true);
    setCurrentIdx(0);
    setAnswers({});
    setRecordedPrompts({});
    setIsRecording(false);
    setAudioState('idle'); 
    
    const data = await fetchAssessmentData(targetSkill);
    setSessionData(data);
    
    // Set actual IELTS timers
    setTimeLeft(SKILL_DURATIONS[targetSkill]); 
    setIsLoadingSession(false);
  };

  const beginFullTest = () => {
    localStorage.removeItem(STORAGE_KEY);
    setSkillIdx(0);
    setPhase("session");
    initializeSessionState(SKILL_ORDER[0]);
  };

  const handleSectionComplete = useCallback(() => {
    // Generate Final Score for this section (Mocked API)
    const band = parseFloat((Math.random() * 4 + 4.5).toFixed(1)); // Random band 4.5 - 8.5
    
    const result: AssessmentResult = {
      skill: activeSkill,
      bandScore: Math.round(band * 2) / 2,
      feedback: "Review grammatical structures."
    };

    setAllResults(prev => ({ ...prev, [activeSkill]: result }));
    
    if (skillIdx < SKILL_ORDER.length - 1) {
      setPhase("interim");
    } else {
      setPhase("scoring");
      setTimeout(() => {
        setPhase("results");
      }, 5000);
    }
  }, [activeSkill, skillIdx]);

  const advanceToNextSkill = () => {
    const nextIdx = skillIdx + 1;
    setSkillIdx(nextIdx);
    setPhase("session");
    initializeSessionState(SKILL_ORDER[nextIdx]);
  };

  const handleNextQuestion = useCallback(() => {
    if (!sessionData) return;
    const totalQ = sessionData.questions.length;

    if (currentIdx < totalQ - 1) {
      setCurrentIdx(i => i + 1);
      if (activeSkill === 'speaking') {
        setIsRecording(false);
      }
    } else {
      handleSectionComplete();
    }
  }, [currentIdx, activeSkill, handleSectionComplete, sessionData]);

  // Global Timer Tick
  useEffect(() => {
    if (phase !== "session" || isLoadingSession || isRestoring || timeLeft <= 0) return;
    const t = setInterval(() => setTimeLeft(s => s - 1), 1000);
    return () => clearInterval(t);
  }, [phase, timeLeft, isLoadingSession, isRestoring]);

  // Force section complete if timer hits 0
  useEffect(() => {
    if (phase === "session" && !isLoadingSession && !isRestoring && timeLeft === 0) {
      handleSectionComplete();
    }
  }, [timeLeft, phase, isLoadingSession, isRestoring, handleSectionComplete]);


  // ── RENDERERS ──

  if (isRestoring) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center">
        <Loader2 className="w-10 h-10 text-indigo-700 animate-spin" />
      </div>
    );
  }

  const renderGate = () => (
    <div className="max-w-3xl mx-auto animate-fade-in pt-12 px-4">
      <div className="bg-white border-2 border-gray-900 rounded-2xl p-8 sm:p-12 text-center shadow-[8px_8px_0_#0F0F0F]">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded border-2 border-gray-900 bg-red-500 text-white text-xs font-black tracking-widest uppercase mb-8 shadow-[3px_3px_0_#0F0F0F]">
          <AlertCircle className="w-4 h-4" /> Full Official Mock Exam
        </div>
        
        <h1 className="text-4xl sm:text-5xl font-black text-gray-900 tracking-tight uppercase mb-6">
          Ready for the <span className="text-indigo-700">Real Deal?</span>
        </h1>
        
        <p className="text-gray-600 leading-relaxed font-medium mb-10 max-w-xl mx-auto">
          This is a full-length, strict-timed IELTS simulation. Set aside approximately <strong>2 hours and 45 minutes</strong> in a quiet environment. You cannot pause the timers once started.
        </p>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-10">
          {SKILL_ORDER.map((s, i) => (
            <div key={s} className="bg-gray-50 border-2 border-gray-200 rounded-xl p-4 flex flex-col items-center justify-center gap-2">
              <span className="text-3xl">{SKILL_ICONS[s]}</span>
              <span className="text-[10px] font-black uppercase tracking-widest text-gray-900">{SKILL_LABELS[s]}</span>
              <span className="text-[10px] font-bold text-gray-500">
                {s === 'listening' ? '40 Qs / 30m' : s === 'reading' ? '40 Qs / 60m' : s === 'writing' ? '2 Tasks / 60m' : '3 Parts / 14m'}
              </span>
            </div>
          ))}
        </div>

        <div className="flex flex-col sm:flex-row gap-4 max-w-lg mx-auto">
          <button onClick={() => navigate(-1)} className="px-6 py-4 rounded-xl border-2 border-gray-300 font-black text-gray-500 hover:bg-gray-50 hover:border-gray-400 transition-colors uppercase tracking-wide">
            Exit
          </button>
          <button onClick={beginFullTest} className="flex-1 bg-indigo-700 hover:bg-indigo-600 text-white font-black text-base uppercase tracking-wide rounded-xl border-2 border-gray-900 transition-all neo-btn shadow-[4px_4px_0_#0F0F0F]">
            Start Exam →
          </button>
        </div>
      </div>
    </div>
  );

  const renderInterim = () => {
    const nextSkill = SKILL_ORDER[skillIdx + 1];
    return (
      <div className="min-h-[70vh] flex items-center justify-center animate-fade-in px-4 pt-12">
        <div className="max-w-lg w-full bg-white border-2 border-gray-900 rounded-2xl p-10 text-center shadow-[8px_8px_0_#0F0F0F]">
          <div className="w-20 h-20 bg-emerald-100 border-2 border-emerald-500 rounded-full flex items-center justify-center text-4xl mx-auto mb-6 shadow-[4px_4px_0_#10B981]">
            <CheckCircle2 className="w-10 h-10 text-emerald-600" />
          </div>
          <h2 className="text-3xl font-black text-gray-900 uppercase tracking-tight mb-2">
            {SKILL_LABELS[activeSkill]} Complete
          </h2>
          <p className="text-gray-500 font-medium mb-10">
            Great job. Take a quick break before the next section begins.
          </p>
          
          <div className="bg-indigo-50 border-2 border-gray-900 rounded-xl p-6 mb-8 text-left shadow-[4px_4px_0_#0F0F0F]">
            <p className="text-xs font-black text-indigo-700 uppercase tracking-widest mb-1">Up Next</p>
            <div className="flex items-center gap-3">
              <span className="text-3xl">{SKILL_ICONS[nextSkill]}</span>
              <h3 className="text-2xl font-black text-gray-900 uppercase tracking-wide">{SKILL_LABELS[nextSkill]}</h3>
            </div>
            <p className="text-sm font-bold text-gray-600 mt-2">
              Timer: {SKILL_DURATIONS[nextSkill] / 60} Minutes
            </p>
          </div>

          <button onClick={advanceToNextSkill} className="w-full bg-gray-900 hover:bg-gray-800 text-white font-black text-lg py-4 rounded-xl border-2 border-gray-900 transition-all neo-btn shadow-[5px_5px_0_#4338CA]">
            Start {SKILL_LABELS[nextSkill]} <ArrowRight className="w-5 h-5 inline ml-1" />
          </button>
        </div>
      </div>
    );
  };

  const renderScoring = () => (
    <div className="flex flex-col items-center justify-center min-h-[70vh] animate-fade-in">
      <div className="relative mb-8">
        <div className="w-24 h-24 rounded-full border-[6px] border-gray-200 border-t-indigo-700 animate-spin" />
        <span className="absolute inset-0 flex items-center justify-center text-4xl">🧠</span>
      </div>
      <h2 className="text-3xl font-black text-gray-900 uppercase tracking-wide mb-3">Compiling Final Report...</h2>
      <p className="text-gray-500 font-medium text-lg">AI is evaluating your 40 reading/listening answers and scoring your essays and recordings.</p>
    </div>
  );

  const renderResults = () => {
    const scores = Object.values(allResults).map(r => r!.bandScore);
    const avg = scores.reduce((a,b) => a+b, 0) / 4;
    const overallBand = Math.round(avg * 2) / 2;

    return (
      <div className="max-w-5xl mx-auto animate-fade-in pt-8 pb-24 px-4">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-3xl sm:text-4xl font-black text-gray-900 uppercase tracking-tight">Official Mock Results</h2>
          <button 
            onClick={() => {
              localStorage.removeItem(STORAGE_KEY);
              navigate('/student/dashboard');
            }} 
            className="px-6 py-3 bg-gray-900 text-white rounded-xl font-black text-sm uppercase tracking-wide hover:bg-gray-800 transition-colors shadow-[4px_4px_0_#4338CA]"
          >
            Dashboard
          </button>
        </div>

        {/* OVERALL SCORE BANNER */}
        <div className="bg-indigo-700 border-2 border-gray-900 rounded-2xl p-8 sm:p-12 mb-8 text-center relative overflow-hidden shadow-[8px_8px_0_#0F0F0F]">
          <div className="absolute -top-10 -right-10 text-[200px] opacity-10 pointer-events-none">🏆</div>
          <p className="text-indigo-200 font-black uppercase tracking-widest mb-4">Overall Band Score</p>
          <div className="text-8xl sm:text-[120px] font-black text-white tabular-nums leading-none drop-shadow-md">
            {overallBand.toFixed(1)}
          </div>
        </div>

        {/* 4 SKILL GRID */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {SKILL_ORDER.map(s => {
            const r = allResults[s]!;
            return (
              <div key={s} className="bg-white border-2 border-gray-900 rounded-xl p-6 shadow-[4px_4px_0_#0F0F0F] flex flex-col items-center text-center">
                <span className="text-4xl mb-4">{SKILL_ICONS[s]}</span>
                <p className="text-gray-500 font-black uppercase tracking-widest text-xs mb-4">{SKILL_LABELS[s]}</p>
                <span className="text-5xl font-black text-gray-900">{r.bandScore.toFixed(1)}</span>
              </div>
            )
          })}
        </div>

      </div>
    );
  };

  const renderSession = () => {
    if (isLoadingSession || !sessionData) {
      return (
        <div className="min-h-[70vh] flex flex-col items-center justify-center animate-fade-in">
          <Loader2 className="w-12 h-12 text-indigo-700 animate-spin mb-4" />
          <p className="text-gray-500 font-black uppercase tracking-widest text-sm">Building Section...</p>
        </div>
      );
    }

    const currentQ = sessionData.questions[currentIdx];
    const totalQ = sessionData.questions.length;
    
    // Validation
    let canProceed = false;
    if (activeSkill === 'speaking') {
      canProceed = !!recordedPrompts[currentQ.id];
    } else if (activeSkill === 'writing') {
      canProceed = countWords(answers[currentQ.id] || "") >= currentQ.minWords;
    } else if (currentQ.options && currentQ.options.length > 0) {
      canProceed = !!answers[currentQ.id];
    } else {
      canProceed = !!answers[currentQ.id]?.trim();
    }

    // Dynamic Reading Passage Check
    let displayPassage = "";
    let passageTitle = "";
    if (activeSkill === 'reading') {
      if (currentIdx < 13) { displayPassage = sessionData.passages[0].content; passageTitle = sessionData.passages[0].title; }
      else if (currentIdx < 26) { displayPassage = sessionData.passages[1].content; passageTitle = sessionData.passages[1].title; }
      else { displayPassage = sessionData.passages[2].content; passageTitle = sessionData.passages[2].title; }
    }

    return (
      <div className="max-w-6xl mx-auto pt-6 pb-16 px-4 animate-fade-in">
        
        {/* Progress Tracker across the 4 Skills */}
        <div className="flex items-center justify-center gap-2 sm:gap-4 mb-8">
          {SKILL_ORDER.map((s, i) => (
            <div key={s} className="flex items-center gap-2 sm:gap-4">
              <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border-2 font-black text-xs uppercase tracking-widest ${i < skillIdx ? 'bg-emerald-400 border-gray-900 text-gray-900' : i === skillIdx ? 'bg-gray-900 border-gray-900 text-white' : 'bg-white border-gray-300 text-gray-400'}`} style={i <= skillIdx ? { boxShadow: '2px 2px 0 #0F0F0F' } : {}}>
                {i < skillIdx ? <CheckCircle2 className="w-4 h-4" /> : <span>{SKILL_ICONS[s]}</span>}
                <span className="hidden sm:inline">{SKILL_LABELS[s]}</span>
              </div>
              {i < SKILL_ORDER.length - 1 && <div className={`w-4 sm:w-8 h-1 ${i < skillIdx ? 'bg-gray-900' : 'bg-gray-300'}`} />}
            </div>
          ))}
        </div>

        {/* Universal Session Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between bg-white border-2 border-gray-900 rounded-xl p-4 sm:p-6 mb-6 gap-4" style={{ boxShadow: '6px 6px 0 #0F0F0F' }}>
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-indigo-700 border-2 border-gray-900 rounded-xl flex items-center justify-center text-3xl" style={{ boxShadow: '3px 3px 0 #0F0F0F' }}>
              {SKILL_ICONS[activeSkill!]}
            </div>
            <div>
              <p className="text-gray-900 font-black text-lg uppercase tracking-wide">{SKILL_LABELS[activeSkill!]} Section</p>
              <p className="text-gray-500 text-xs font-bold uppercase tracking-widest mt-1">
                {activeSkill === 'writing' ? `Task ${currentIdx + 1} of 2` : `Question ${currentIdx + 1} of ${totalQ}`}
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="flex items-center self-end sm:self-auto bg-gray-50 border-2 border-gray-900 px-4 py-2 rounded-xl" style={{ boxShadow: 'inset 2px 2px 0 rgba(0,0,0,0.05)' }}>
              <CircleTimer timeLeft={timeLeft} total={SKILL_DURATIONS[activeSkill]} size={48} />
              <div className="ml-3">
                <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Section Time</p>
                <p className="text-lg font-black text-gray-900 leading-none">{formatTime(timeLeft)}</p>
              </div>
            </div>
            <button 
              onClick={() => {
                if (window.confirm("Abort this mock test? All progress will be lost.")) {
                  localStorage.removeItem(STORAGE_KEY);
                  navigate('/student/dashboard');
                }
              }} 
              className="hidden sm:block text-xs font-black text-gray-400 hover:text-red-500 uppercase tracking-widest transition-colors"
            >
              Abort Test
            </button>
          </div>
        </div>

        {/* ── UNIFIED SPLIT VIEW FOR ALL 4 SKILLS ── */}
        <div className="flex flex-col lg:flex-row gap-6">
          
          {/* Left Panel: Passage / Audio / Context */}
          <div className="w-full lg:w-1/2 flex flex-col gap-4">
            {activeSkill === 'listening' ? (
              <div className="bg-indigo-50 border-2 border-gray-900 rounded-xl p-8 text-center flex flex-col items-center" style={{ boxShadow: '6px 6px 0 #0F0F0F' }}>
                
                <button 
                  onClick={() => {
                    if (audioState === 'idle' && audioRef.current) {
                      audioRef.current.play();
                      setAudioState('playing');
                    }
                  }}
                  disabled={audioState !== 'idle'}
                  className={`w-24 h-24 border-2 border-gray-900 rounded-full flex items-center justify-center text-white mb-6 transition-all shadow-[4px_4px_0_#0F0F0F] ${
                    audioState === 'idle' ? 'bg-indigo-700 hover:bg-indigo-600 active:translate-y-1 active:shadow-[2px_2px_0_#0F0F0F]' : 
                    audioState === 'playing' ? 'bg-amber-500' : 'bg-emerald-500'
                  }`}
                >
                  {audioState === 'idle' && <PlayCircle className="w-12 h-12 ml-1" />}
                  {audioState === 'playing' && (
                    <div className="flex items-center gap-1.5 h-10">
                       <div className="w-2 bg-white rounded-full animate-pulse h-full" />
                       <div className="w-2 bg-white rounded-full animate-pulse h-2/3" style={{animationDelay: '0.2s'}} />
                       <div className="w-2 bg-white rounded-full animate-pulse h-4/5" style={{animationDelay: '0.4s'}} />
                    </div>
                  )}
                  {audioState === 'played' && <CheckCircle2 className="w-12 h-12" />}
                </button>
                
                <p className="text-gray-900 font-black text-xl uppercase tracking-wide mb-2">Test Audio Track</p>
                <p className="text-gray-600 font-medium">
                  {audioState === 'played' ? "Audio playback complete." : sessionData.context}
                </p>
                
                <audio 
                  ref={audioRef}
                  src={sessionData.audio_url} 
                  preload="auto" 
                  onEnded={() => setAudioState('played')}
                />
              </div>
            ) : (
              <div className="bg-white border-2 border-gray-900 rounded-xl flex flex-col h-[700px]" style={{ boxShadow: '6px 6px 0 #0F0F0F' }}>
                <div className="p-5 border-b-2 border-gray-900 bg-gray-50 flex items-center justify-between">
                  <span className="font-black text-sm uppercase tracking-widest text-gray-500">
                    {activeSkill === 'writing' ? 'Task Context' : activeSkill === 'speaking' ? 'Speaking Instructions' : passageTitle}
                  </span>
                  <button onClick={() => setShowPassage(!showPassage)} className="lg:hidden font-black text-sm text-indigo-700 uppercase">Toggle View</button>
                </div>
                <div className={`p-8 overflow-y-auto ${!showPassage ? 'hidden lg:block' : 'block'}`}>
                  <pre className="font-serif whitespace-pre-wrap text-base text-gray-800 leading-loose">
                    {activeSkill === 'writing' ? currentQ.context : 
                     activeSkill === 'reading' ? displayPassage : ""}
                  </pre>
                </div>
              </div>
            )}
          </div>

          {/* Right Panel: Questions & Inputs */}
          <div className="w-full lg:w-1/2 flex flex-col gap-4 h-auto lg:h-[700px] overflow-y-auto pb-4 pr-2">
            <div className="bg-white border-2 border-gray-900 rounded-xl p-6 sm:p-8" style={{ boxShadow: '6px 6px 0 #0F0F0F' }}>
              
              <div className="flex justify-between items-center mb-8">
                <span className="inline-block bg-gray-100 text-gray-500 text-xs font-black uppercase tracking-widest px-4 py-1.5 rounded border-2 border-gray-200">
                  {activeSkill === 'writing' ? currentQ.section : `Question ${currentIdx + 1}`}
                </span>
                <span className="inline-block bg-indigo-100 text-indigo-800 border-2 border-indigo-300 text-[11px] font-black uppercase tracking-widest px-3 py-1.5 rounded-lg shadow-[2px_2px_0_#4F46E5]">
                  {currentQ.section || "Answer"}
                </span>
              </div>

              {activeSkill !== 'writing' && (
                <h3 className="text-xl font-black text-gray-900 mb-8 leading-snug">
                  {activeSkill === 'speaking' && `"${currentQ.text}"`}
                  {activeSkill !== 'speaking' && currentQ.text}
                </h3>
              )}
              
              {/* Input Types */}
              {activeSkill === 'speaking' ? (
                <div className="bg-gray-50 border-2 border-gray-300 rounded-2xl p-8 max-w-sm mx-auto mb-4 shadow-inner text-center">
                  {isRecording ? (
                    <div className="flex flex-col items-center">
                      <div className="flex items-center gap-2 h-16 mb-6">
                        {animBars.map((h, i) => (
                          <div key={i} className="w-2.5 bg-rose-500 rounded-full animate-pulse" style={{ height: `${20 + h * 50}px`, animationDelay: `${i * 0.1}s` }} />
                        ))}
                      </div>
                      <button 
                        onClick={() => {
                          setIsRecording(false);
                          setRecordedPrompts(prev => ({ ...prev, [currentQ.id]: true }));
                        }} 
                        className="flex items-center gap-3 bg-rose-100 hover:bg-rose-200 text-rose-700 font-black text-sm px-6 py-3 rounded-lg border-2 border-rose-700 transition-colors uppercase tracking-wide shadow-[3px_3px_0_#BE123C]"
                      >
                        Stop Recording
                      </button>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center">
                      <div className={`w-16 h-16 rounded-full flex items-center justify-center mb-6 border-2 transition-all ${recordedPrompts[currentQ.id] ? 'bg-emerald-100 border-emerald-600 shadow-[3px_3px_0_#059669]' : 'bg-indigo-100 border-indigo-700 shadow-[3px_3px_0_#4338CA]'}`}>
                        {recordedPrompts[currentQ.id] ? <CheckCircle2 className="w-8 h-8 text-emerald-600" /> : <Mic className="w-8 h-8 text-indigo-700" />}
                      </div>
                      <button 
                        onClick={() => setIsRecording(true)} 
                        className={`font-black text-sm uppercase tracking-wide px-8 py-4 rounded-xl border-2 border-gray-900 transition-all neo-btn ${recordedPrompts[currentQ.id] ? 'bg-white text-gray-900 hover:bg-gray-50' : 'bg-indigo-700 hover:bg-indigo-600 text-white'}`} style={{ boxShadow: '4px 4px 0 #0F0F0F' }}>
                        {recordedPrompts[currentQ.id] ? 'Re-record Answer' : 'Start Speaking'}
                      </button>
                    </div>
                  )}
                </div>
              ) : currentQ.options && currentQ.options.length > 0 ? (
                <div className="flex flex-col gap-4">
                  {currentQ.options.map((opt: string) => {
                    const selected = answers[currentQ.id] === opt;
                    return (
                      <button key={opt} onClick={() => setAnswers(p => ({ ...p, [currentQ.id]: opt }))}
                        className={`text-left p-5 rounded-xl border-2 font-bold text-base transition-colors ${selected ? 'bg-gray-900 border-gray-900 text-white' : 'bg-white border-gray-300 text-gray-700 hover:border-gray-900'}`}
                        style={selected ? { boxShadow: '4px 4px 0 #0F0F0F' } : {}}>
                        {opt}
                      </button>
                    );
                  })}
                </div>
              ) : (
                <div className="relative">
                  <textarea placeholder={activeSkill === 'writing' ? "Write your essay here..." : "Type your answer..."}
                    rows={activeSkill === 'writing' ? 14 : 2}
                    value={answers[currentQ.id] || ""} onChange={e => setAnswers(p => ({ ...p, [currentQ.id]: e.target.value }))}
                    className="w-full p-5 border-2 border-gray-900 rounded-xl text-base font-bold outline-none focus:ring-2 focus:ring-indigo-200 transition-shadow bg-gray-50 resize-none"
                    style={{ boxShadow: 'inset 3px 3px 0 rgba(0,0,0,0.05)' }}
                  />
                  {activeSkill === 'writing' && (
                    <div className={`absolute bottom-4 right-4 border-2 border-gray-900 px-3 py-1 rounded-lg text-xs font-black font-mono transition-colors ${countWords(answers[currentQ.id] || "") >= currentQ.minWords ? 'bg-emerald-400 text-gray-900' : 'bg-white text-gray-500'}`} style={{ boxShadow: '2px 2px 0 #0F0F0F' }}>
                      {countWords(answers[currentQ.id] || "")} / {currentQ.minWords}
                    </div>
                  )}
                </div>
              )}

              {/* UNIFIED NAV BUTTONS: Next is Disabled until answered */}
              <div className="mt-10 flex gap-4">
                <button onClick={() => setCurrentIdx(i => i - 1)} disabled={currentIdx === 0} className="px-6 py-4 border-2 border-gray-900 rounded-xl font-black text-gray-600 disabled:opacity-30 disabled:pointer-events-none hover:bg-gray-50 uppercase text-sm tracking-wide">
                  Prev
                </button>
                <button 
                  onClick={handleNextQuestion} 
                  disabled={!canProceed || (activeSkill === 'speaking' && isRecording)}
                  className={`flex-1 font-black text-sm uppercase tracking-wide border-2 border-gray-900 rounded-xl transition-all ${!canProceed ? 'bg-gray-100 text-gray-400 opacity-60 cursor-not-allowed' : 'bg-indigo-700 text-white hover:bg-indigo-600 neo-btn'}`}
                  style={canProceed ? { boxShadow: '4px 4px 0 #0F0F0F' } : {}}
                >
                  {currentIdx === totalQ - 1 ? 'Complete Section' : 'Next →'}
                </button>
              </div>

            </div>
          </div>

        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] font-sans text-gray-900 selection:bg-indigo-200">
      <TopNavBar />
      <div className="fixed inset-0 pointer-events-none z-0" style={{ backgroundImage: 'radial-gradient(circle, #d1d5db 1px, transparent 1px)', backgroundSize: '24px 24px', opacity: 0.5 }} />
      
      <div className="relative z-10 pt-16">
        {phase === "gate" && renderGate()}
        {phase === "session" && renderSession()}
        {phase === "interim" && renderInterim()}
        {phase === "scoring" && renderScoring()}
        {phase === "results" && renderResults()}
      </div>

      <style>{`
        @keyframes fade-in { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        .animate-fade-in { animation: fade-in 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
        .neo-btn { transition: transform 0.1s ease, box-shadow 0.1s ease; }
        .neo-btn:hover { transform: translate(-2px, -2px); box-shadow: 6px 6px 0 #0F0F0F !important; }
        .neo-btn:active { transform: translate(2px, 2px); box-shadow: 2px 2px 0 #0F0F0F !important; }
      `}</style>
    </div>
  );
}