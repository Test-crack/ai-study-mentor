import React, { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  GraduationCap, ArrowRight, CheckCircle2, AlertCircle, Target,
  BookOpen, Headphones, PenLine, Mic, BrainCircuit, PlayCircle,
  Loader2, Lock, Zap, Trophy, AlertTriangle, Calendar,
} from "lucide-react";
import { useMomentum } from "@/features/student/Context/MomentumContext";

// ─────────────────────────────────────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────────────────────────────────────

// ✅ Fixed: "checking" and "locked" added to Phase union
type Phase = "checking" | "locked" | "gate" | "session" | "interim" | "scoring" | "results";
type Skill = "listening" | "reading" | "writing" | "speaking";

interface AssessmentResult {
  skill:     Skill;
  bandScore: number;
  feedback:  string;
}

interface MockEligibility {
  canTakeStandard:     boolean;
  canTakeExchange:     boolean;
  lockReason:          string | null;
  iasCompleted:        number;
  iasPerSkill:         Record<Skill, number>;
  bandImproved:        boolean;
  bestBandImprovement: number;
  daysOnPlatform:      number;
  monthlyUsed:         number;
  exchangeUsed:        boolean;
}

interface MockUsageRecord {
  date:        string;
  type:        "standard" | "exchange";
  overallBand: number;
  skillBands:  Record<Skill, number>;
}

// ─────────────────────────────────────────────────────────────────────────────
// CONSTANTS
// ─────────────────────────────────────────────────────────────────────────────

const SKILL_ORDER: Skill[] = ["listening", "reading", "writing", "speaking"];

const SKILL_LABELS: Record<Skill, string> = {
  listening: "Listening", reading: "Reading", writing: "Writing", speaking: "Speaking",
};
const SKILL_ICONS: Record<Skill, string> = {
  listening: "🎧", reading: "📖", writing: "✍️", speaking: "🎤",
};
const SKILL_DURATIONS: Record<Skill, number> = {
  listening: 30 * 60,
  reading:   60 * 60,
  writing:   60 * 60,
  speaking:  14 * 60,
};

const LS_MOCK_USAGE       = "mock_usage_history";
const LS_DIAGNOSTIC_BANDS = "diagnostic_band_scores";
const STORAGE_KEY         = "tc_full_mock_assessment_state";

// ─────────────────────────────────────────────────────────────────────────────
// GATE HELPERS
// ─────────────────────────────────────────────────────────────────────────────

const getCalendarMonth = () => new Date().toISOString().slice(0, 7);

const readMockUsageThisMonth = (): { standard: number; exchange: number } => {
  try {
    const stored = localStorage.getItem(LS_MOCK_USAGE);
    if (!stored) return { standard: 0, exchange: 0 };
    const history: MockUsageRecord[] = JSON.parse(stored);
    const thisMonth = getCalendarMonth();
    const records   = history.filter(r => r.date.startsWith(thisMonth));
    return {
      standard: records.filter(r => r.type === "standard").length,
      exchange:  records.filter(r => r.type === "exchange").length,
    };
  } catch { return { standard: 0, exchange: 0 }; }
};

const writeMockUsage = (
  type:        "standard" | "exchange",
  skillBands:  Record<Skill, number>,
  overallBand: number
) => {
  try {
    const stored  = localStorage.getItem(LS_MOCK_USAGE);
    const history: MockUsageRecord[] = stored ? JSON.parse(stored) : [];
    history.push({
      date: new Date().toISOString().split("T")[0],
      type, overallBand, skillBands,
    });
    localStorage.setItem(LS_MOCK_USAGE, JSON.stringify(history));
  } catch { /* ignore */ }
};

// TODO (Sarthak): Replace with real API call — GET /api/student/diagnostic-bands
const readDiagnosticBands = (): Record<Skill, number> => {
  try {
    const stored = localStorage.getItem(LS_DIAGNOSTIC_BANDS);
    if (stored) return JSON.parse(stored);
  } catch { /* ignore */ }
  return { listening: 5.0, reading: 5.0, writing: 5.0, speaking: 5.0 };
};

const readLastIABands = (): Record<Skill, number | null> => {
  const result: Record<Skill, number | null> = {
    listening: null, reading: null, writing: null, speaking: null,
  };
  try {
    const stored = localStorage.getItem("ia_tracker");
    if (!stored) return result;
    const tracker = JSON.parse(stored);
    if (tracker.currentWindow?.status === "completed" && tracker.currentWindow?.result) {
      const skill = tracker.currentWindow.targetSkill?.toLowerCase() as Skill;
      if (skill && skill in result) {
        result[skill] = tracker.currentWindow.result.band;
      }
    }
  } catch { /* ignore */ }
  return result;
};

// Real Band formula: (Mock × 0.60) + (Last IA × 0.40), rounded to nearest 0.5
const calcRealBand = (mockBand: number, lastIABand: number | null): number => {
  const raw = lastIABand !== null
    ? mockBand * 0.60 + lastIABand * 0.40
    : mockBand;
  return Math.round(raw * 2) / 2;
};

const checkMockEligibility = (totalMomentum: number): MockEligibility => {
  // ── Read IA tracker ────────────────────────────────────────────────────────
  let iasCompleted = 0;
  const iasPerSkill: Record<Skill, number> = {
    listening: 0, reading: 0, writing: 0, speaking: 0,
  };
  try {
    const stored = localStorage.getItem("ia_tracker");
    if (stored) {
      const tracker = JSON.parse(stored);
      iasCompleted  = tracker.totalCompleted || 0;
      // TODO (Sarthak): Replace with real per-skill IA count from backend
      const perSkill  = Math.floor(iasCompleted / 4);
      const remainder = iasCompleted % 4;
      SKILL_ORDER.forEach((s, i) => {
        iasPerSkill[s] = perSkill + (i < remainder ? 1 : 0);
      });
    }
  } catch { /* ignore */ }

  // ── Band improvement check ─────────────────────────────────────────────────
  const diagnosticBands = readDiagnosticBands();
  const lastIABands     = readLastIABands();
  let   bestImprovement = 0;
  SKILL_ORDER.forEach(skill => {
    const diag   = diagnosticBands[skill] || 5.0;
    const lastIA = lastIABands[skill];
    if (lastIA !== null) {
      const improvement = lastIA - diag;
      if (improvement > bestImprovement) bestImprovement = improvement;
    }
  });
  const bandImproved = bestImprovement >= 0.5;

  // ── Days on platform ───────────────────────────────────────────────────────
  let daysOnPlatform = 0;
  try {
    const totalDrills = localStorage.getItem("total_drill_sessions");
    if (totalDrills) {
      const parsed = JSON.parse(totalDrills);
      if (parsed.firstSessionDate) {
        const first = new Date(parsed.firstSessionDate);
        const now   = new Date();
        first.setHours(0, 0, 0, 0);
        now.setHours(0, 0, 0, 0);
        daysOnPlatform = Math.floor((now.getTime() - first.getTime()) / 86400000);
      }
    }
  } catch { /* ignore */ }

  // ── Monthly usage ──────────────────────────────────────────────────────────
  const usage = readMockUsageThisMonth();

  // ── Per-skill coverage ─────────────────────────────────────────────────────
  const allSkillsCovered = SKILL_ORDER.every(s => iasPerSkill[s] >= 1);

  // ── Standard path ─────────────────────────────────────────────────────────
  const standardGatePassed    = iasCompleted >= 6 && allSkillsCovered && bandImproved;
  const standardSlotAvailable = usage.standard < 1;
  const canTakeStandard       = standardGatePassed && standardSlotAvailable;

  // ── Exchange path ──────────────────────────────────────────────────────────
  const totalMocksThisMonth   = usage.standard + usage.exchange;
  const exchangeSlotAvailable = usage.exchange < 1 && totalMocksThisMonth < 2;
  const canTakeExchange = (
    iasCompleted >= 4 &&
    totalMomentum >= 1500 &&
    daysOnPlatform >= 14 &&
    bandImproved &&
    exchangeSlotAvailable
  );

  // ── Lock reason ────────────────────────────────────────────────────────────
  let lockReason: string | null = null;
  if (!canTakeStandard && !canTakeExchange) {
    if (iasCompleted < 6) {
      lockReason = `Complete ${6 - iasCompleted} more Internal Assessment${6 - iasCompleted !== 1 ? 's' : ''} to unlock the Mock Test.`;
    } else if (!allSkillsCovered) {
      const missing = SKILL_ORDER.filter(s => iasPerSkill[s] < 1).map(s => SKILL_LABELS[s]).join(", ");
      lockReason = `Complete at least 1 IA in: ${missing}.`;
    } else if (!bandImproved) {
      lockReason = "Show ≥ 0.5 band improvement in at least 1 skill to unlock the Mock Test.";
    } else if (!standardSlotAvailable) {
      lockReason = "You've already taken your standard Mock Test this month. Come back next month, or unlock an extra mock with 1500 Momentum points.";
    }
  }

  return {
    canTakeStandard, canTakeExchange, lockReason,
    iasCompleted, iasPerSkill, bandImproved,
    bestBandImprovement: bestImprovement,
    daysOnPlatform,
    monthlyUsed:  usage.standard + usage.exchange,
    exchangeUsed: usage.exchange >= 1,
  };
};

// ─────────────────────────────────────────────────────────────────────────────
// FULL IELTS MOCK DATA
// ─────────────────────────────────────────────────────────────────────────────

const LISTENING_DATA = {
  audio_url: "/diagnostics/audio/Full_Mock_Listening_Track.mp3",
  context: "Listen to the audio track carefully. The recording will play continuously for all 40 questions. It will only play once.",
  questions: [
    { id: "L1",  section: "Section 1: Renting a Flat",             text: "Name of the estate agency: ___________________________",                                             options: [] },
    { id: "L2",  section: "Section 1: Renting a Flat",             text: "Location of the flat: ___________________________",                                                  options: [] },
    { id: "L3",  section: "Section 1: Renting a Flat",             text: "Size of the flat: ___________________________",                                                      options: [] },
    { id: "L4",  section: "Section 1: Renting a Flat",             text: "Monthly rent (not including bills): £ ___________________________",                                  options: [] },
    { id: "L5",  section: "Section 1: Renting a Flat",             text: "Extra monthly cost for parking: £ ___________________________",                                      options: [] },
    { id: "L6",  section: "Section 1: Renting a Flat",             text: "The flat has a sofa, a bed, and wardrobes but NO ___________________________",                       options: [] },
    { id: "L7",  section: "Section 1: Renting a Flat",             text: "Bus number that stops at the end of the street: ___________________________",                       options: [] },
    { id: "L8",  section: "Section 1: Renting a Flat",             text: "Distance to the nearest train station: ___________________________",                                options: [] },
    { id: "L9",  section: "Section 1: Renting a Flat",             text: "Viewing day and time chosen by Mike: ___________________________",                                  options: [] },
    { id: "L10", section: "Section 1: Renting a Flat",             text: "Mike's phone number: ___________________________",                                                  options: [] },
    { id: "L11", section: "Section 2: Greenfield Shopping Centre", text: "Weekday opening hours: ___________________________",                                                options: [] },
    { id: "L12", section: "Section 2: Greenfield Shopping Centre", text: "Sunday closing time: ___________________________",                                                  options: [] },
    { id: "L13", section: "Section 2: Greenfield Shopping Centre", text: "Total number of shops: ___________________________",                                                options: [] },
    { id: "L14", section: "Section 2: Greenfield Shopping Centre", text: "Number of floors: ___________________________",                                                     options: [] },
    { id: "L15", section: "Section 2: Greenfield Shopping Centre", text: "FreshMart (supermarket) opens at: ___________________________",                                     options: [] },
    { id: "L16", section: "Section 2: Greenfield Shopping Centre", text: "Children's play area is supervised until: ___________________________",                             options: [] },
    { id: "L17", section: "Section 2: Greenfield Shopping Centre", text: "Number of restaurants in the food court: ___________________________",                              options: [] },
    { id: "L18", section: "Section 2: Greenfield Shopping Centre", text: "Number of cinema screens: ___________________________",                                             options: [] },
    { id: "L19", section: "Section 2: Greenfield Shopping Centre", text: "Parking cost after the first two free hours: ___________________________",                          options: [] },
    { id: "L20", section: "Section 2: Greenfield Shopping Centre", text: "Bus numbers that stop outside the centre: ___________________________",                             options: [] },
    { id: "L21", section: "Section 3: Housing Survey Project",     text: "How many questionnaire responses did the students collect?",                                        options: ["A. 80", "B. 100", "C. 120", "D. 150"] },
    { id: "L22", section: "Section 3: Housing Survey Project",     text: "What were the two main topics of the survey?",                                                      options: ["A. Housing costs and green spaces", "B. Housing costs and transport", "C. Transport and population", "D. Rent and employment"] },
    { id: "L23", section: "Section 3: Housing Survey Project",     text: "What percentage of people said they could not afford to live in the city centre?",                  options: ["A. More than 40%", "B. Exactly 50%", "C. More than 60%", "D. Nearly 80%"] },
    { id: "L24", section: "Section 3: Housing Survey Project",     text: "What did most respondents say was the biggest problem?",                                            options: ["A. Buying a house", "B. Lack of transport", "C. High rent", "D. Noise levels"] },
    { id: "L25", section: "Section 3: Housing Survey Project",     text: "What surprised the students about younger people's preferences?",                                   options: ["A. They wanted to live near universities", "B. They preferred the suburbs over the city", "C. They chose transport over price", "D. They preferred city centre shopping"] },
    { id: "L26", section: "Section 3: Housing Survey Project",     text: "What did younger people say was very important to them? ___________________________",               options: [] },
    { id: "L27", section: "Section 3: Housing Survey Project",     text: "Who will design the charts and graphs for the project? ___________________________",                options: [] },
    { id: "L28", section: "Section 3: Housing Survey Project",     text: "Who will write the main report? ___________________________",                                       options: [] },
    { id: "L29", section: "Section 3: Housing Survey Project",     text: "When will the students give their presentation? ___________________________",                       options: [] },
    { id: "L30", section: "Section 3: Housing Survey Project",     text: "What did Dr. Brown advise them to add at the end of the project? ___________________________",      options: [] },
    { id: "L31", section: "Section 4: Shopping Habits",            text: "Estimated percentage of shopping now done online: ___________________________",                     options: [] },
    { id: "L32", section: "Section 4: Shopping Habits",            text: "What happened to many small shops when large shopping centres opened? ___________________________", options: [] },
    { id: "L33", section: "Section 4: Shopping Habits",            text: "One advantage of online shopping mentioned: ___________________________",                           options: [] },
    { id: "L34", section: "Section 4: Shopping Habits",            text: "What problem has the rise of online shopping caused for the high street? ___________________________", options: [] },
    { id: "L35", section: "Section 4: Shopping Habits",            text: "Fraction of shops that are now empty in some towns: ___________________________",                   options: [] },
    { id: "L36", section: "Section 4: Shopping Habits",            text: "What are empty shop buildings being turned into?",                                                  options: ["A. Offices and car parks", "B. Schools and hospitals", "C. Flats, cafes and community spaces", "D. Warehouses and factories"] },
    { id: "L37", section: "Section 4: Shopping Habits",            text: "According to research, people now prefer to spend money on:",                                       options: ["A. Technology and gadgets", "B. Restaurants, entertainment and travel", "C. Home improvements", "D. Clothing and fashion"] },
    { id: "L38", section: "Section 4: Shopping Habits",            text: "What must future shopping centres offer to be successful?",                                         options: ["A. Lower prices than online stores", "B. More parking spaces", "C. Experiences and reasons to spend time there", "D. A wider range of products"] },
    { id: "L39", section: "Section 4: Shopping Habits",            text: "What will next week's lecture focus on?",                                                           options: ["A. Online shopping statistics", "B. Urban planning policies", "C. Case studies from different countries", "D. The history of markets"] },
    { id: "L40", section: "Section 4: Shopping Habits",            text: "What must students read before the next class?",                                                    options: ["A. A journal article on e-commerce", "B. The chapter on urban retail development", "C. A report on housing trends", "D. A case study on consumer behaviour"] },
  ],
};

const READING_DATA = {
  passages: [
    { title: "Passage 1: Urban Vertical Farming",          content: "Paragraph A: In recent years, vertical farming has emerged as one of the most talked-about innovations in urban food production...\n\n(Full passage text here)" },
    { title: "Passage 2: The Antikythera Mechanism",       content: "Discovered in 1901 off the coast of the Greek island Antikythera, this ancient analogue computer has baffled historians for decades...\n\n(Full passage text here)" },
    { title: "Passage 3: Neuroplasticity in Adult Brains", content: "For a long time, it was believed that as we aged, the connections in our brain became fixed. However, recent research proves that...\n\n(Full passage text here)" },
  ],
  questions: Array.from({ length: 40 }, (_, i) => ({
    id:      `R${i + 1}`,
    section: i < 13 ? "Passage 1" : i < 26 ? "Passage 2" : "Passage 3",
    text:    i % 3 === 0
      ? `Read the passage and answer TRUE, FALSE, or NOT GIVEN for Question ${i + 1}.`
      : `Provide a short answer from the text for Question ${i + 1}.`,
    options: i % 3 === 0 ? ["TRUE", "FALSE", "NOT GIVEN"] : [],
  })),
};

const WRITING_DATA = {
  questions: [
    {
      id: "W1", section: "Task 1",
      context: "The chart below shows the percentage of adults in four countries who used the internet daily in 2010 and 2022.\n\nSummarise the information by selecting and reporting the main features, and make comparisons where relevant.\n\nWrite at least 150 words.",
      minWords: 150,
    },
    {
      id: "W2", section: "Task 2",
      context: "Some people think that universities should only offer courses that lead directly to employment. Others believe universities should offer a wider range of subjects.\n\nDiscuss both views and give your own opinion.\n\nWrite at least 250 words.",
      minWords: 250,
    },
  ],
};

const SPEAKING_DATA = {
  questions: [
    { id: "S1",  section: "Part 1",            text: "What kind of work or studies are you currently involved in?" },
    { id: "S2",  section: "Part 1",            text: "How do you usually spend your free time?" },
    { id: "S3",  section: "Part 1",            text: "How important is it to you to keep up with the news?" },
    { id: "S4",  section: "Part 1",            text: "Do you prefer living in a city or a smaller town? Why?" },
    { id: "S5",  section: "Part 2 (Cue Card)", text: "Describe a skill you have learned that you consider useful in everyday life. Explain what it is, when/how you learned it, and why it's valuable. (Speak for 1-2 minutes)" },
    { id: "S6",  section: "Part 3",            text: "Why do you think some people find it difficult to learn new skills as adults compared to when they were children?" },
    { id: "S7",  section: "Part 3",            text: "In what ways can schools better prepare students with practical life skills?" },
    { id: "S8",  section: "Part 3",            text: "Some people argue that online learning platforms have made acquiring new skills easier for everyone. Do you agree?" },
    { id: "S9",  section: "Part 3",            text: "How do you think technology will change the kinds of skills that are valued in the workplace over the next twenty years?" },
    { id: "S10", section: "Part 3",            text: "Do you think governments have a responsibility to fund adult education and skills training programmes?" },
  ],
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

// ─────────────────────────────────────────────────────────────────────────────
// SUB-COMPONENTS
// ─────────────────────────────────────────────────────────────────────────────

function TopNavBar() {
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-white border-b-2 border-gray-900">
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
  const pct      = total > 0 ? timeLeft / total : 1;
  const r        = (size - 8) / 2;
  const circ     = 2 * Math.PI * r;
  const dash     = circ * pct;
  const isUrgent = pct < 0.1;
  const color    = isUrgent ? "#EF4444" : pct < 0.5 ? "#F59E0B" : "#4338CA";
  return (
    <svg width={size} height={size} style={{ transform: "rotate(-90deg)", flexShrink: 0 }}>
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="#E5E7EB" strokeWidth={6} />
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth={6}
        strokeDasharray={`${dash} ${circ}`} strokeLinecap="round"
        style={{ transition: "stroke-dasharray 0.5s linear, stroke 0.3s" }} />
      <text x={size/2} y={size/2+1} textAnchor="middle" dominantBaseline="middle"
        fill={isUrgent ? "#EF4444" : "#111827"} fontSize={size/4.2} fontWeight="900"
        fontFamily="monospace"
        style={{ transform: "rotate(90deg)", transformOrigin: `${size/2}px ${size/2}px` }}>
        {formatTime(timeLeft)}
      </text>
    </svg>
  );
};

const RequirementRow = ({
  met, label, detail, compact = false,
}: { met: boolean; label: string; detail: string; compact?: boolean }) => (
  <div className={`flex items-start gap-3 ${compact ? 'py-1' : 'p-3 bg-white border border-gray-200 rounded-xl'}`}>
    <div className={`shrink-0 ${compact ? 'mt-0.5' : 'mt-0'}`}>
      {met
        ? <CheckCircle2 className={`${compact ? 'w-4 h-4' : 'w-5 h-5'} text-emerald-500`} />
        : <AlertTriangle className={`${compact ? 'w-4 h-4' : 'w-5 h-5'} text-amber-500`} />
      }
    </div>
    <div className="flex-1 min-w-0">
      <p className={`font-bold text-gray-900 ${compact ? 'text-xs' : 'text-sm'}`}>{label}</p>
      {detail && <p className={`text-gray-500 ${compact ? 'text-[10px]' : 'text-xs'} mt-0.5`}>{detail}</p>}
    </div>
  </div>
);

// ─────────────────────────────────────────────────────────────────────────────
// MAIN COMPONENT
// ─────────────────────────────────────────────────────────────────────────────

export default function FullMockAssessment() {
  const navigate = useNavigate();
  const { totalMomentum, deductPoints, addPoints } = useMomentum();

  const [phase,    setPhase]    = useState<Phase>("checking");
  const [skillIdx, setSkillIdx] = useState(0);
  const activeSkill = SKILL_ORDER[skillIdx];

  const [eligibility,      setEligibility]      = useState<MockEligibility | null>(null);
  const [mockType,         setMockType]          = useState<"standard" | "exchange" | null>(null);
  const diagnosticBands                          = readDiagnosticBands();
  const lastIABands                              = readLastIABands();

  const [allResults, setAllResults] = useState<Record<Skill, AssessmentResult | null>>({
    listening: null, reading: null, writing: null, speaking: null,
  });

  const [currentIdx,       setCurrentIdx]       = useState(0);
  const [answers,          setAnswers]           = useState<Record<string, string>>({});
  const [recordedPrompts,  setRecordedPrompts]   = useState<Record<string, boolean>>({});
  const audioRef                                  = useRef<HTMLAudioElement>(null);
  const [audioState,       setAudioState]         = useState<'idle' | 'playing' | 'played'>('idle');
  const [sessionData,      setSessionData]        = useState<any>(null);
  const [isLoadingSession, setIsLoadingSession]   = useState(false);
  const [isRestoring,      setIsRestoring]        = useState(true);
  const [timeLeft,         setTimeLeft]           = useState(0);
  const [isRecording,      setIsRecording]        = useState(false);
  const [showPassage,      setShowPassage]        = useState(false);
  const [animBars]                                = useState(() => Array.from({ length: 12 }, () => Math.random()));

  // ── Gate check + restore on mount ─────────────────────────────────────────
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
        setMockType(parsed.mockType || null);
        setIsRestoring(false);
        return;
      } catch {
        localStorage.removeItem(STORAGE_KEY);
      }
    }

    const result = checkMockEligibility(totalMomentum);
    setEligibility(result);
    setPhase(result.canTakeStandard || result.canTakeExchange ? "gate" : "locked");
    setIsRestoring(false);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Persist in-progress state ──────────────────────────────────────────────
  useEffect(() => {
    if (isRestoring || phase === "gate" || phase === "checking" || phase === "locked") return;
    localStorage.setItem(STORAGE_KEY, JSON.stringify({
      phase, skillIdx, currentIdx, answers, recordedPrompts,
      timeLeft, allResults, sessionData, audioState, mockType,
    }));
  }, [phase, skillIdx, currentIdx, answers, recordedPrompts, timeLeft, allResults, sessionData, audioState, mockType, isRestoring]);

  // ── Session data ───────────────────────────────────────────────────────────
  const fetchAssessmentData = async (targetSkill: Skill) => {
    await new Promise(resolve => setTimeout(resolve, 800));
    if (targetSkill === 'listening') return LISTENING_DATA;
    if (targetSkill === 'reading')   return READING_DATA;
    if (targetSkill === 'writing')   return WRITING_DATA;
    if (targetSkill === 'speaking')  return SPEAKING_DATA;
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
    setTimeLeft(SKILL_DURATIONS[targetSkill]);
    setIsLoadingSession(false);
  };

  const beginMock = (type: "standard" | "exchange") => {
    if (type === "exchange") deductPoints(1500, "Mock Test exchange — 1500 Momentum pts");
    setMockType(type);
    localStorage.removeItem(STORAGE_KEY);
    setSkillIdx(0);
    setPhase("session");
    initializeSessionState(SKILL_ORDER[0]);
  };

  const handleSectionComplete = useCallback(() => {
    const rawBand = parseFloat((Math.random() * 4 + 4.5).toFixed(1));
    const result: AssessmentResult = {
      skill:     activeSkill,
      bandScore: Math.round(rawBand * 2) / 2,
      feedback:  "Review grammatical structures.",
    };
    setAllResults(prev => ({ ...prev, [activeSkill]: result }));
    if (skillIdx < SKILL_ORDER.length - 1) {
      setPhase("interim");
    } else {
      setPhase("scoring");
      setTimeout(() => setPhase("results"), 5000);
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
      if (activeSkill === 'speaking') setIsRecording(false);
    } else {
      handleSectionComplete();
    }
  }, [currentIdx, activeSkill, handleSectionComplete, sessionData]);

  useEffect(() => {
    if (phase !== "session" || isLoadingSession || isRestoring || timeLeft <= 0) return;
    const t = setInterval(() => setTimeLeft(s => s - 1), 1000);
    return () => clearInterval(t);
  }, [phase, timeLeft, isLoadingSession, isRestoring]);

  useEffect(() => {
    if (phase === "session" && !isLoadingSession && !isRestoring && timeLeft === 0) {
      handleSectionComplete();
    }
  }, [timeLeft, phase, isLoadingSession, isRestoring, handleSectionComplete]);

  const handleResultsAward = useCallback((overallBand: number, skillBands: Record<Skill, number>) => {
    writeMockUsage(mockType || "standard", skillBands, overallBand);
    addPoints(200, "Mock Test completed — flat reward");
    const diagOverall   = Object.values(diagnosticBands).reduce((a, b) => a + b, 0) / 4;
    const roundedDiag   = Math.round(diagOverall * 2) / 2;
    const roundedResult = Math.round(overallBand * 2) / 2;
    if (roundedResult > roundedDiag) addPoints(500, "Mock Test — new band threshold crossed");
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mockType, diagnosticBands]);

  // ─────────────────────────────────────────────────────────────────────────
  // RENDERERS
  // ─────────────────────────────────────────────────────────────────────────

  if (isRestoring || phase === "checking") {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center">
        <Loader2 className="w-10 h-10 text-indigo-700 animate-spin" />
      </div>
    );
  }

  const renderLocked = () => {
    if (!eligibility) return null;
    const { iasCompleted, iasPerSkill, bandImproved, bestBandImprovement, daysOnPlatform } = eligibility;
    const allSkillsCovered = SKILL_ORDER.every(s => iasPerSkill[s] >= 1);
    const monthUsed        = readMockUsageThisMonth();

    return (
      <div className="max-w-2xl mx-auto pt-12 px-4 pb-16 animate-fade-in">
        <div className="bg-white border-2 border-gray-900 rounded-2xl p-8 shadow-[8px_8px_0_#0F0F0F]">
          <div className="flex items-center justify-center w-20 h-20 rounded-full bg-slate-100 border-2 border-gray-900 mx-auto mb-6 shadow-[4px_4px_0_#0F0F0F]">
            <Lock className="w-10 h-10 text-slate-500" />
          </div>
          <h1 className="text-3xl font-black text-gray-900 uppercase tracking-tight text-center mb-2">Mock Test Locked</h1>
          <p className="text-gray-500 text-center font-medium mb-8 max-w-md mx-auto">
            {eligibility.lockReason || "Complete the requirements below to unlock the Full Mock Test."}
          </p>

          <div className="space-y-3 mb-8">
            <RequirementRow met={iasCompleted >= 6}    label="Complete 6 Internal Assessments"               detail={`${iasCompleted} / 6 done`} />
            <RequirementRow met={allSkillsCovered}     label="At least 1 IA per skill"                       detail={SKILL_ORDER.map(s => `${SKILL_LABELS[s]}: ${iasPerSkill[s]}`).join(" · ")} />
            <RequirementRow met={bandImproved}         label="≥ 0.5 band improvement on any skill vs diagnostic" detail={bandImproved ? `Best: +${bestBandImprovement.toFixed(1)}` : "Not yet achieved"} />
            <RequirementRow met={monthUsed.standard < 1} label="Monthly slot available"                      detail={monthUsed.standard >= 1 ? "Used this month — resets next calendar month" : "Available"} />
          </div>

          {monthUsed.standard >= 1 && (
            <div className="bg-amber-50 border-2 border-amber-200 rounded-xl p-4 mb-6">
              <p className="text-sm font-bold text-amber-800 flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                Standard mock used this month.{" "}
                {eligibility.canTakeExchange
                  ? "You can still take an exchange mock below."
                  : "Come back next month or earn 1500 Momentum for an extra slot."}
              </p>
            </div>
          )}

          <div className="border-2 border-gray-200 rounded-xl p-5 bg-gray-50">
            <div className="flex items-start gap-3 mb-4">
              <Zap className="w-5 h-5 text-amber-500 fill-amber-500 shrink-0 mt-0.5" />
              <div>
                <h3 className="font-black text-gray-900 text-sm uppercase tracking-wide mb-1">Momentum Exchange Path</h3>
                <p className="text-xs text-gray-500 font-medium">
                  Spend 1500 Momentum points for an extra mock. Requires min 4 IAs, 14 days on platform, and band improvement shown.
                </p>
              </div>
            </div>
            <div className="space-y-2">
              <RequirementRow met={iasCompleted >= 4}      label="Min 4 IAs completed"       detail={`${iasCompleted} / 4`}              compact />
              <RequirementRow met={totalMomentum >= 1500}  label="1500 Momentum pts"         detail={`${totalMomentum} pts`}             compact />
              <RequirementRow met={daysOnPlatform >= 14}   label="14 days on platform"       detail={`${daysOnPlatform} days`}           compact />
              <RequirementRow met={bandImproved}            label="Band improvement ≥ 0.5"   detail=""                                   compact />
              <RequirementRow met={monthUsed.exchange < 1} label="Exchange slot available"   detail={monthUsed.exchange >= 1 ? "Used this month" : "Available"} compact />
            </div>
          </div>

          <div className="flex gap-3 mt-6">
            <button onClick={() => navigate('/student/dashboard')}
              className="flex-1 py-3.5 border-2 border-gray-300 rounded-xl font-black text-gray-500 hover:bg-gray-50 uppercase text-sm tracking-wide transition-colors">
              Back to Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  };

  const renderGate = () => {
    if (!eligibility) return null;
    const monthUsed = readMockUsageThisMonth();

    return (
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
            {SKILL_ORDER.map(s => (
              <div key={s} className="bg-gray-50 border-2 border-gray-200 rounded-xl p-4 flex flex-col items-center justify-center gap-2">
                <span className="text-3xl">{SKILL_ICONS[s]}</span>
                <span className="text-[10px] font-black uppercase tracking-widest text-gray-900">{SKILL_LABELS[s]}</span>
                <span className="text-[10px] font-bold text-gray-500">
                  {s === 'listening' ? '40 Qs / 30m' : s === 'reading' ? '40 Qs / 60m' : s === 'writing' ? '2 Tasks / 60m' : '3 Parts / 14m'}
                </span>
              </div>
            ))}
          </div>

          {monthUsed.standard >= 1 && eligibility.canTakeExchange && (
            <div className="bg-amber-50 border-2 border-amber-200 rounded-xl p-4 mb-6 text-left">
              <p className="text-sm font-bold text-amber-800 flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                Standard mock used this month. You're taking an exchange mock (−1500 pts from Momentum).
              </p>
            </div>
          )}

          <div className="flex flex-col sm:flex-row gap-4 max-w-lg mx-auto">
            <button onClick={() => navigate(-1)}
              className="px-6 py-4 rounded-xl border-2 border-gray-300 font-black text-gray-500 hover:bg-gray-50 hover:border-gray-400 transition-colors uppercase tracking-wide">
              Exit
            </button>
            {eligibility.canTakeStandard && (
              <button onClick={() => beginMock("standard")}
                className="flex-1 bg-indigo-700 hover:bg-indigo-600 text-white font-black text-base uppercase tracking-wide rounded-xl border-2 border-gray-900 transition-all neo-btn shadow-[4px_4px_0_#0F0F0F]">
                Start Exam →
              </button>
            )}
            {!eligibility.canTakeStandard && eligibility.canTakeExchange && (
              <button onClick={() => beginMock("exchange")}
                className="flex-1 bg-amber-500 hover:bg-amber-400 text-gray-900 font-black text-base uppercase tracking-wide rounded-xl border-2 border-gray-900 transition-all neo-btn shadow-[4px_4px_0_#0F0F0F]">
                <Zap className="w-4 h-4 inline mr-2 fill-gray-900" />
                Exchange Mock (−1500 pts) →
              </button>
            )}
          </div>
        </div>
      </div>
    );
  };

  const renderInterim = () => {
    const nextSkill = SKILL_ORDER[skillIdx + 1];
    return (
      <div className="min-h-[70vh] flex items-center justify-center animate-fade-in px-4 pt-12">
        <div className="max-w-lg w-full bg-white border-2 border-gray-900 rounded-2xl p-10 text-center shadow-[8px_8px_0_#0F0F0F]">
          <div className="w-20 h-20 bg-emerald-100 border-2 border-emerald-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-[4px_4px_0_#10B981]">
            <CheckCircle2 className="w-10 h-10 text-emerald-600" />
          </div>
          <h2 className="text-3xl font-black text-gray-900 uppercase tracking-tight mb-2">{SKILL_LABELS[activeSkill]} Complete</h2>
          <p className="text-gray-500 font-medium mb-10">Great job. Take a quick break before the next section begins.</p>
          <div className="bg-indigo-50 border-2 border-gray-900 rounded-xl p-6 mb-8 text-left shadow-[4px_4px_0_#0F0F0F]">
            <p className="text-xs font-black text-indigo-700 uppercase tracking-widest mb-1">Up Next</p>
            <div className="flex items-center gap-3">
              <span className="text-3xl">{SKILL_ICONS[nextSkill]}</span>
              <h3 className="text-2xl font-black text-gray-900 uppercase tracking-wide">{SKILL_LABELS[nextSkill]}</h3>
            </div>
            <p className="text-sm font-bold text-gray-600 mt-2">Timer: {SKILL_DURATIONS[nextSkill] / 60} Minutes</p>
          </div>
          <button onClick={advanceToNextSkill}
            className="w-full bg-gray-900 hover:bg-gray-800 text-white font-black text-lg py-4 rounded-xl border-2 border-gray-900 transition-all neo-btn shadow-[5px_5px_0_#4338CA]">
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
      <p className="text-gray-500 font-medium text-lg text-center max-w-md">
        AI is evaluating your 40 reading/listening answers and scoring your essays and recordings.
      </p>
    </div>
  );

  const renderResults = () => {
    const mockBands: Record<Skill, number> = { listening: 0, reading: 0, writing: 0, speaking: 0 };
    SKILL_ORDER.forEach(s => { mockBands[s] = allResults[s]?.bandScore || 5.0; });

    const realBands: Record<Skill, number> = { listening: 0, reading: 0, writing: 0, speaking: 0 };
    SKILL_ORDER.forEach(s => { realBands[s] = calcRealBand(mockBands[s], lastIABands[s]); });

    const overallReal    = Math.round((Object.values(realBands).reduce((a, b) => a + b, 0) / 4) * 2) / 2;
    const overallDiag    = Math.round((Object.values(diagnosticBands).reduce((a, b) => a + b, 0) / 4) * 2) / 2;
    const overallImproved = overallReal > overallDiag;

    const awardsKey = "mock_awards_fired_" + new Date().toISOString().split("T")[0];
    if (!localStorage.getItem(awardsKey)) {
      handleResultsAward(overallReal, realBands);
      localStorage.setItem(awardsKey, "1");
    }

    return (
      <div className="max-w-5xl mx-auto animate-fade-in pt-8 pb-24 px-4">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-3xl sm:text-4xl font-black text-gray-900 uppercase tracking-tight">Official Mock Results</h2>
          <button onClick={() => { localStorage.removeItem(STORAGE_KEY); navigate('/student/dashboard'); }}
            className="px-6 py-3 bg-gray-900 text-white rounded-xl font-black text-sm uppercase tracking-wide hover:bg-gray-800 transition-colors shadow-[4px_4px_0_#4338CA]">
            Dashboard
          </button>
        </div>

        {/* Overall band */}
        <div className="bg-indigo-700 border-2 border-gray-900 rounded-2xl p-8 sm:p-12 mb-4 text-center relative overflow-hidden shadow-[8px_8px_0_#0F0F0F]">
          <div className="absolute -top-10 -right-10 text-[200px] opacity-10 pointer-events-none">🏆</div>
          <p className="text-indigo-200 font-black uppercase tracking-widest mb-1">Real Band Score</p>
          <p className="text-indigo-300 text-xs font-bold mb-4 uppercase tracking-widest">Mock × 0.60 + Last IA × 0.40</p>
          <div className="text-8xl sm:text-[120px] font-black text-white tabular-nums leading-none drop-shadow-md">
            {overallReal.toFixed(1)}
          </div>
          {overallImproved && (
            <div className="inline-flex items-center gap-2 mt-6 bg-emerald-400/20 border border-emerald-400/40 text-emerald-200 font-black text-sm px-4 py-2 rounded-full">
              <Trophy className="w-4 h-4" /> New band threshold crossed! +500 Momentum
            </div>
          )}
        </div>

        {/* Diagnostic vs today */}
        <div className="bg-gray-100 border-2 border-gray-300 rounded-xl px-5 py-3 mb-8 text-center">
          <p className="text-xs font-bold text-gray-500 uppercase tracking-widest">
            Diagnostic baseline: <span className="text-gray-900">{overallDiag.toFixed(1)}</span>
            {" → "}
            Today: <span className={overallImproved ? "text-emerald-600" : "text-gray-900"}>{overallReal.toFixed(1)}</span>
            {" "}
            {overallImproved
              ? <span className="text-emerald-600">(+{(overallReal - overallDiag).toFixed(1)} improvement)</span>
              : overallReal < overallDiag
              ? <span className="text-red-500">({(overallReal - overallDiag).toFixed(1)} vs diagnostic)</span>
              : <span className="text-gray-500">(no change)</span>
            }
          </p>
        </div>

        {/* Per-skill cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {SKILL_ORDER.map(s => {
            const diagBand = diagnosticBands[s] || 5.0;
            const mockBand = mockBands[s];
            const realBand = realBands[s];
            const lastIA   = lastIABands[s];
            const improved = realBand > diagBand;

            return (
              <div key={s} className="bg-white border-2 border-gray-900 rounded-xl p-6 shadow-[4px_4px_0_#0F0F0F] flex flex-col items-center text-center">
                <span className="text-4xl mb-3">{SKILL_ICONS[s]}</span>
                <p className="text-gray-500 font-black uppercase tracking-widest text-xs mb-4">{SKILL_LABELS[s]}</p>

                <div className="flex items-center gap-2 mb-3 w-full justify-center">
                  <div className="text-center">
                    <p className="text-[9px] font-bold text-gray-400 uppercase tracking-wider mb-0.5">Diagnostic</p>
                    <p className="text-xl font-black text-gray-400 line-through decoration-gray-400">{diagBand.toFixed(1)}</p>
                  </div>
                  <ArrowRight className="w-4 h-4 text-gray-300 shrink-0" />
                  <div className="text-center">
                    <p className="text-[9px] font-bold text-gray-400 uppercase tracking-wider mb-0.5">Real Band</p>
                    <p className={`text-4xl font-black ${improved ? 'text-emerald-600' : realBand < diagBand ? 'text-red-500' : 'text-gray-900'}`}>
                      {realBand.toFixed(1)}
                    </p>
                  </div>
                </div>

                <div className="w-full bg-gray-50 border border-gray-200 rounded-lg p-2 text-[9px] font-bold text-gray-500 space-y-0.5">
                  <p>Mock: {mockBand.toFixed(1)} × 0.60 = {(mockBand * 0.6).toFixed(2)}</p>
                  <p>
                    Last IA: {lastIA !== null
                      ? `${lastIA.toFixed(1)} × 0.40 = ${(lastIA * 0.4).toFixed(2)}`
                      : "No IA — using mock only"}
                  </p>
                </div>

                <div className={`mt-3 text-[10px] font-black uppercase tracking-wide px-2 py-0.5 rounded border ${
                  improved
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                    : realBand < diagBand
                    ? 'bg-red-50 text-red-600 border-red-200'
                    : 'bg-gray-100 text-gray-600 border-gray-200'
                }`}>
                  {improved
                    ? `+${(realBand - diagBand).toFixed(1)} improved`
                    : realBand < diagBand
                    ? `${(realBand - diagBand).toFixed(1)} dropped`
                    : 'maintained'}
                </div>
              </div>
            );
          })}
        </div>

        {/* Priority action per skill */}
        <div className="bg-white border-2 border-gray-900 rounded-2xl p-8 shadow-[6px_6px_0_#0F0F0F] mb-8">
          <h3 className="text-xl font-black text-gray-900 uppercase tracking-wide mb-6 flex items-center gap-2">
            <Target className="w-5 h-5 text-indigo-700" /> Priority Action Per Skill
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {SKILL_ORDER.map(s => (
              <div key={s} className="bg-gray-50 border-2 border-gray-200 rounded-xl p-5">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-xl">{SKILL_ICONS[s]}</span>
                  <span className="font-black text-sm text-gray-900 uppercase">{SKILL_LABELS[s]}</span>
                  <span className="ml-auto font-black text-lg text-indigo-700">{realBands[s].toFixed(1)}</span>
                </div>
                <p className="text-xs text-gray-600 font-medium leading-relaxed">
                  {/* TODO (Sarthak): Replace with real AI-generated priority action per skill */}
                  Focus on your weakest sub-skill in {SKILL_LABELS[s]}. Continue daily drills targeting the lowest DCS sub-skill next cycle.
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Momentum award */}
        <div className="flex items-center justify-center gap-4 bg-indigo-50 border-2 border-indigo-700 rounded-2xl p-6 shadow-[4px_4px_0_#4338CA]">
          <div className="bg-amber-400 p-2 rounded-full border-2 border-gray-900">
            <Zap className="w-6 h-6 text-gray-900 fill-gray-900" />
          </div>
          <div>
            <p className="text-lg font-black text-indigo-900 uppercase tracking-wide">
              +200 Momentum{overallImproved ? " +500 bonus" : ""} earned
            </p>
            <p className="text-xs text-indigo-600 font-medium mt-0.5">
              Drill cycle resumes with updated priorities. Next mock available{" "}
              {mockType === "exchange" ? "via next exchange (1500 pts)" : "next calendar month"}.
            </p>
          </div>
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
    const totalQ   = sessionData.questions.length;

    let canProceed = false;
    if (activeSkill === 'speaking') {
      canProceed = !!recordedPrompts[currentQ.id];
    } else if (activeSkill === 'writing') {
      canProceed = countWords(answers[currentQ.id] || "") >= currentQ.minWords;
    } else if (currentQ.options?.length > 0) {
      canProceed = !!answers[currentQ.id];
    } else {
      canProceed = !!answers[currentQ.id]?.trim();
    }

    let displayPassage = "";
    let passageTitle   = "";
    if (activeSkill === 'reading') {
      if (currentIdx < 13)      { displayPassage = sessionData.passages[0].content; passageTitle = sessionData.passages[0].title; }
      else if (currentIdx < 26) { displayPassage = sessionData.passages[1].content; passageTitle = sessionData.passages[1].title; }
      else                      { displayPassage = sessionData.passages[2].content; passageTitle = sessionData.passages[2].title; }
    }

    return (
      <div className="max-w-6xl mx-auto pt-6 pb-16 px-4 animate-fade-in">

        {/* Skill progress */}
        <div className="flex items-center justify-center gap-2 sm:gap-4 mb-8">
          {SKILL_ORDER.map((s, i) => (
            <div key={s} className="flex items-center gap-2 sm:gap-4">
              <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border-2 font-black text-xs uppercase tracking-widest ${
                i < skillIdx  ? 'bg-emerald-400 border-gray-900 text-gray-900' :
                i === skillIdx ? 'bg-gray-900 border-gray-900 text-white' :
                                 'bg-white border-gray-300 text-gray-400'
              }`} style={i <= skillIdx ? { boxShadow: '2px 2px 0 #0F0F0F' } : {}}>
                {i < skillIdx ? <CheckCircle2 className="w-4 h-4" /> : <span>{SKILL_ICONS[s]}</span>}
                <span className="hidden sm:inline">{SKILL_LABELS[s]}</span>
              </div>
              {i < SKILL_ORDER.length - 1 && (
                <div className={`w-4 sm:w-8 h-1 ${i < skillIdx ? 'bg-gray-900' : 'bg-gray-300'}`} />
              )}
            </div>
          ))}
        </div>

        {/* Header */}
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
            <div className="flex items-center bg-gray-50 border-2 border-gray-900 px-4 py-2 rounded-xl" style={{ boxShadow: 'inset 2px 2px 0 rgba(0,0,0,0.05)' }}>
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
              className="hidden sm:block text-xs font-black text-gray-400 hover:text-red-500 uppercase tracking-widest transition-colors">
              Abort
            </button>
          </div>
        </div>

        {/* Split view */}
        <div className="flex flex-col lg:flex-row gap-6">
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
                    audioState === 'idle'    ? 'bg-indigo-700 hover:bg-indigo-600 active:translate-y-1 active:shadow-[2px_2px_0_#0F0F0F]' :
                    audioState === 'playing' ? 'bg-amber-500' : 'bg-emerald-500'
                  }`}>
                  {audioState === 'idle'    && <PlayCircle className="w-12 h-12 ml-1" />}
                  {audioState === 'playing' && (
                    <div className="flex items-center gap-1.5 h-10">
                      <div className="w-2 bg-white rounded-full animate-pulse h-full" />
                      <div className="w-2 bg-white rounded-full animate-pulse h-2/3" style={{animationDelay: '0.2s'}} />
                      <div className="w-2 bg-white rounded-full animate-pulse h-4/5" style={{animationDelay: '0.4s'}} />
                    </div>
                  )}
                  {audioState === 'played'  && <CheckCircle2 className="w-12 h-12" />}
                </button>
                <p className="text-gray-900 font-black text-xl uppercase tracking-wide mb-2">Test Audio Track</p>
                <p className="text-gray-600 font-medium">{audioState === 'played' ? "Audio playback complete." : sessionData.context}</p>
                <audio ref={audioRef} src={sessionData.audio_url} preload="auto" onEnded={() => setAudioState('played')} />
              </div>
            ) : (
              <div className="bg-white border-2 border-gray-900 rounded-xl flex flex-col h-[700px]" style={{ boxShadow: '6px 6px 0 #0F0F0F' }}>
                <div className="p-5 border-b-2 border-gray-900 bg-gray-50 flex items-center justify-between">
                  <span className="font-black text-sm uppercase tracking-widest text-gray-500">
                    {activeSkill === 'writing' ? 'Task Context' : activeSkill === 'speaking' ? 'Speaking Instructions' : passageTitle}
                  </span>
                  <button onClick={() => setShowPassage(!showPassage)} className="lg:hidden font-black text-sm text-indigo-700 uppercase">Toggle</button>
                </div>
                <div className={`p-8 overflow-y-auto ${!showPassage ? 'hidden lg:block' : 'block'}`}>
                  <pre className="font-serif whitespace-pre-wrap text-base text-gray-800 leading-loose">
                    {activeSkill === 'writing' ? currentQ.context : activeSkill === 'reading' ? displayPassage : ""}
                  </pre>
                </div>
              </div>
            )}
          </div>

          <div className="w-full lg:w-1/2 flex flex-col gap-4 h-auto lg:h-[700px] overflow-y-auto pb-4 pr-2">
            <div className="bg-white border-2 border-gray-900 rounded-xl p-6 sm:p-8" style={{ boxShadow: '6px 6px 0 #0F0F0F' }}>
              <div className="flex justify-between items-center mb-8">
                <span className="bg-gray-100 text-gray-500 text-xs font-black uppercase tracking-widest px-4 py-1.5 rounded border-2 border-gray-200">
                  {activeSkill === 'writing' ? currentQ.section : `Question ${currentIdx + 1}`}
                </span>
                <span className="bg-indigo-100 text-indigo-800 border-2 border-indigo-300 text-[11px] font-black uppercase tracking-widest px-3 py-1.5 rounded-lg shadow-[2px_2px_0_#4F46E5]">
                  {currentQ.section || "Answer"}
                </span>
              </div>

              {activeSkill !== 'writing' && (
                <h3 className="text-xl font-black text-gray-900 mb-8 leading-snug">
                  {activeSkill === 'speaking' ? `"${currentQ.text}"` : currentQ.text}
                </h3>
              )}

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
                        onClick={() => { setIsRecording(false); setRecordedPrompts(prev => ({ ...prev, [currentQ.id]: true })); }}
                        className="flex items-center gap-3 bg-rose-100 hover:bg-rose-200 text-rose-700 font-black text-sm px-6 py-3 rounded-lg border-2 border-rose-700 transition-colors uppercase tracking-wide shadow-[3px_3px_0_#BE123C]">
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
                        className={`font-black text-sm uppercase tracking-wide px-8 py-4 rounded-xl border-2 border-gray-900 transition-all neo-btn ${recordedPrompts[currentQ.id] ? 'bg-white text-gray-900 hover:bg-gray-50' : 'bg-indigo-700 hover:bg-indigo-600 text-white'}`}
                        style={{ boxShadow: '4px 4px 0 #0F0F0F' }}>
                        {recordedPrompts[currentQ.id] ? 'Re-record Answer' : 'Start Speaking'}
                      </button>
                    </div>
                  )}
                </div>
              ) : currentQ.options?.length > 0 ? (
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
                  <textarea
                    placeholder={activeSkill === 'writing' ? "Write your essay here..." : "Type your answer..."}
                    rows={activeSkill === 'writing' ? 14 : 2}
                    value={answers[currentQ.id] || ""}
                    onChange={e => setAnswers(p => ({ ...p, [currentQ.id]: e.target.value }))}
                    className="w-full p-5 border-2 border-gray-900 rounded-xl text-base font-bold outline-none focus:ring-2 focus:ring-indigo-200 transition-shadow bg-gray-50 resize-none"
                    style={{ boxShadow: 'inset 3px 3px 0 rgba(0,0,0,0.05)' }}
                  />
                  {activeSkill === 'writing' && (
                    <div className={`absolute bottom-4 right-4 border-2 border-gray-900 px-3 py-1 rounded-lg text-xs font-black font-mono transition-colors ${
                      countWords(answers[currentQ.id] || "") >= currentQ.minWords ? 'bg-emerald-400 text-gray-900' : 'bg-white text-gray-500'
                    }`} style={{ boxShadow: '2px 2px 0 #0F0F0F' }}>
                      {countWords(answers[currentQ.id] || "")} / {currentQ.minWords}
                    </div>
                  )}
                </div>
              )}

              <div className="mt-10 flex gap-4">
                <button onClick={() => setCurrentIdx(i => i - 1)} disabled={currentIdx === 0}
                  className="px-6 py-4 border-2 border-gray-900 rounded-xl font-black text-gray-600 disabled:opacity-30 disabled:pointer-events-none hover:bg-gray-50 uppercase text-sm tracking-wide">
                  Prev
                </button>
                <button
                  onClick={handleNextQuestion}
                  disabled={!canProceed || (activeSkill === 'speaking' && isRecording)}
                  className={`flex-1 font-black text-sm uppercase tracking-wide border-2 border-gray-900 rounded-xl transition-all ${
                    !canProceed ? 'bg-gray-100 text-gray-400 opacity-60 cursor-not-allowed' : 'bg-indigo-700 text-white hover:bg-indigo-600 neo-btn'
                  }`}
                  style={canProceed ? { boxShadow: '4px 4px 0 #0F0F0F' } : {}}>
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
        {(phase === "checking")  && <div className="flex items-center justify-center min-h-[60vh]"><Loader2 className="w-10 h-10 text-indigo-700 animate-spin" /></div>}
        {phase === "locked"   && renderLocked()}
        {phase === "gate"     && renderGate()}
        {phase === "session"  && renderSession()}
        {phase === "interim"  && renderInterim()}
        {phase === "scoring"  && renderScoring()}
        {phase === "results"  && renderResults()}
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