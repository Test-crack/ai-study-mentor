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
// GATE HELPERS (unchanged logic)
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

const calcRealBand = (mockBand: number, lastIABand: number | null): number => {
  const raw = lastIABand !== null
    ? mockBand * 0.60 + lastIABand * 0.40
    : mockBand;
  return Math.round(raw * 2) / 2;
};

const checkMockEligibility = (totalMomentum: number): MockEligibility => {
  let iasCompleted = 0;
  const iasPerSkill: Record<Skill, number> = {
    listening: 0, reading: 0, writing: 0, speaking: 0,
  };
  try {
    const stored = localStorage.getItem("ia_tracker");
    if (stored) {
      const tracker = JSON.parse(stored);
      iasCompleted  = tracker.totalCompleted || 0;
      const perSkill  = Math.floor(iasCompleted / 4);
      const remainder = iasCompleted % 4;
      SKILL_ORDER.forEach((s, i) => {
        iasPerSkill[s] = perSkill + (i < remainder ? 1 : 0);
      });
    }
  } catch { /* ignore */ }

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

  const usage = readMockUsageThisMonth();

  const allSkillsCovered = SKILL_ORDER.every(s => iasPerSkill[s] >= 1);

  const standardGatePassed    = iasCompleted >= 6 && allSkillsCovered && bandImproved;
  const standardSlotAvailable = usage.standard < 1;
  const canTakeStandard       = standardGatePassed && standardSlotAvailable;

  const totalMocksThisMonth   = usage.standard + usage.exchange;
  const exchangeSlotAvailable = usage.exchange < 1 && totalMocksThisMonth < 2;
  const canTakeExchange = (
    iasCompleted >= 4 &&
    totalMomentum >= 1500 &&
    daysOnPlatform >= 14 &&
    bandImproved &&
    exchangeSlotAvailable
  );

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
// FULL IELTS MOCK DATA (unchanged)
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
// SUB-COMPONENTS — SCI-FI GLASSMORPHISM REDESIGN
// ─────────────────────────────────────────────────────────────────────────────

function TopNavBar() {
  return (
    <nav className="fixed top-0 left-0 right-0 z-50" style={{
      background: 'rgba(5, 8, 22, 0.85)',
      backdropFilter: 'blur(20px)',
      borderBottom: '1px solid rgba(0, 240, 255, 0.15)',
      boxShadow: '0 0 40px rgba(0, 240, 255, 0.05)',
    }}>
      <div className="w-full px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
        <div className="flex items-center space-x-3">
  <div style={{
    background: '#4338ca',
    borderRadius: '10px',
    padding: '8px',
  }}>
    <GraduationCap className="h-5 w-5" style={{ color: '#ffffff' }} />
  </div>
  <span style={{
    fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
    fontWeight: 800,
    fontSize: '1.1rem',
    letterSpacing: '0.15em',
    color: '#4338ca',
    WebkitTextFillColor: '#4338ca',
  }}>TESTCRACK / MOCK</span>
</div>
          <div style={{
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: '0.65rem',
            color: 'rgba(0,240,255,0.5)',
            letterSpacing: '0.1em',
          }}>
            SYS::ACTIVE
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
  const color    = isUrgent ? "#ff4466" : pct < 0.5 ? "#f59e0b" : "#00f0ff";
  return (
    <svg width={size} height={size} style={{ transform: "rotate(-90deg)", flexShrink: 0 }}>
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth={5} />
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth={5}
        strokeDasharray={`${dash} ${circ}`} strokeLinecap="round"
        style={{
          transition: "stroke-dasharray 0.5s linear, stroke 0.3s",
          filter: `drop-shadow(0 0 6px ${color})`,
        }} />
      <text x={size/2} y={size/2+1} textAnchor="middle" dominantBaseline="middle"
        fill={isUrgent ? "#ff4466" : "#00f0ff"} fontSize={size/4.5} fontWeight="700"
        fontFamily="'JetBrains Mono', monospace"
        style={{ transform: "rotate(90deg)", transformOrigin: `${size/2}px ${size/2}px` }}>
        {formatTime(timeLeft)}
      </text>
    </svg>
  );
};

const GlassCard: React.FC<{
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
  glow?: 'cyan' | 'violet' | 'amber' | 'rose' | 'emerald' | 'none';
}> = ({ children, className = "", style = {}, glow = 'none' }) => {
  const glowColors: Record<string, string> = {
    cyan:    'rgba(0,240,255,0.12)',
    violet:  'rgba(139,92,246,0.12)',
    amber:   'rgba(245,158,11,0.12)',
    rose:    'rgba(244,63,94,0.12)',
    emerald: 'rgba(52,211,153,0.12)',
    none:    'transparent',
  };
  const borderColors: Record<string, string> = {
    cyan:    'rgba(0,240,255,0.25)',
    violet:  'rgba(139,92,246,0.3)',
    amber:   'rgba(245,158,11,0.25)',
    rose:    'rgba(244,63,94,0.25)',
    emerald: 'rgba(52,211,153,0.25)',
    none:    'rgba(255,255,255,0.07)',
  };
  return (
    <div className={className} style={{
      background: `linear-gradient(135deg, rgba(255,255,255,0.04) 0%, rgba(255,255,255,0.01) 100%), ${glowColors[glow]}`,
      backdropFilter: 'blur(24px)',
      border: `1px solid ${borderColors[glow]}`,
      borderRadius: '16px',
      ...style,
    }}>
      {children}
    </div>
  );
};

const RequirementRow = ({
  met, label, detail, compact = false,
}: { met: boolean; label: string; detail: string; compact?: boolean }) => (
  <div className={`flex items-start gap-3 ${compact ? 'py-1.5' : 'p-3'}`} style={{
    background: 'rgba(255,255,255,0.02)',
    borderRadius: '10px',
    border: `1px solid ${met ? 'rgba(52,211,153,0.2)' : 'rgba(245,158,11,0.15)'}`,
    marginBottom: '6px',
  }}>
    <div className={`shrink-0 ${compact ? 'mt-0.5' : 'mt-0.5'}`}>
      {met
        ? <CheckCircle2 className={`${compact ? 'w-4 h-4' : 'w-5 h-5'}`} style={{ color: '#34d399', filter: 'drop-shadow(0 0 6px #34d399)' }} />
        : <AlertTriangle className={`${compact ? 'w-4 h-4' : 'w-5 h-5'}`} style={{ color: '#f59e0b', filter: 'drop-shadow(0 0 6px #f59e0b)' }} />
      }
    </div>
    <div className="flex-1 min-w-0">
      <p style={{
        fontFamily: "'JetBrains Mono', monospace",
        fontWeight: 600,
        fontSize: compact ? '0.7rem' : '0.75rem',
        color: met ? '#e0f7f7' : '#fde68a',
        letterSpacing: '0.03em',
      }}>{label}</p>
      {detail && <p style={{
        fontFamily: "'JetBrains Mono', monospace",
        fontSize: compact ? '0.6rem' : '0.65rem',
        color: 'rgba(255,255,255,0.35)',
        marginTop: '2px',
      }}>{detail}</p>}
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

  useEffect(() => {
    if (isRestoring || phase === "gate" || phase === "checking" || phase === "locked") return;
    localStorage.setItem(STORAGE_KEY, JSON.stringify({
      phase, skillIdx, currentIdx, answers, recordedPrompts,
      timeLeft, allResults, sessionData, audioState, mockType,
    }));
  }, [phase, skillIdx, currentIdx, answers, recordedPrompts, timeLeft, allResults, sessionData, audioState, mockType, isRestoring]);

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
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#050816' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{
            width: '60px', height: '60px', margin: '0 auto 16px',
            border: '2px solid transparent',
            borderTop: '2px solid #00f0ff',
            borderRight: '2px solid rgba(0,240,255,0.3)',
            borderRadius: '50%',
            animation: 'spin 0.8s linear infinite',
            boxShadow: '0 0 20px rgba(0,240,255,0.3)',
          }} />
          <p style={{ fontFamily: "'JetBrains Mono', monospace", color: 'rgba(0,240,255,0.6)', fontSize: '0.7rem', letterSpacing: '0.2em' }}>
            INITIALIZING...
          </p>
        </div>
      </div>
    );
  }

  const renderLocked = () => {
    if (!eligibility) return null;
    const { iasCompleted, iasPerSkill, bandImproved, bestBandImprovement, daysOnPlatform } = eligibility;
    const allSkillsCovered = SKILL_ORDER.every(s => iasPerSkill[s] >= 1);
    const monthUsed        = readMockUsageThisMonth();

    return (
      <div className="tc-fade-in" style={{ maxWidth: '600px', margin: '0 auto', padding: '48px 16px 80px' }}>
        <GlassCard glow="none" style={{ padding: '40px' }}>
          {/* Lock icon */}
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '24px' }}>
            <div style={{
              width: '80px', height: '80px', borderRadius: '50%',
              background: 'rgba(255,255,255,0.04)',
              border: '1px solid rgba(255,255,255,0.1)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 0 40px rgba(139,92,246,0.1)',
            }}>
              <Lock style={{ width: '36px', height: '36px', color: 'rgba(255,255,255,0.3)' }} />
            </div>
          </div>

          <h1 style={{
            fontFamily: "'JetBrains Mono', monospace",
            fontWeight: 800, fontSize: '1.6rem', letterSpacing: '0.1em',
            color: '#e2e8f0', textAlign: 'center', marginBottom: '8px',
          }}>ACCESS DENIED</h1>

          <p style={{
            fontFamily: "'JetBrains Mono', monospace", fontSize: '0.72rem',
            color: 'rgba(255,255,255,0.35)', textAlign: 'center',
            letterSpacing: '0.05em', marginBottom: '32px', lineHeight: 1.7,
            maxWidth: '420px', margin: '0 auto 32px',
          }}>
            {eligibility.lockReason || "Complete the requirements below to unlock the Full Mock Test."}
          </p>

          {/* Requirements */}
          <div style={{ marginBottom: '24px' }}>
            <p style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '0.6rem', color: 'rgba(0,240,255,0.5)', letterSpacing: '0.15em', marginBottom: '12px' }}>
              // STANDARD_PATH :: REQUIREMENTS
            </p>
            <RequirementRow met={iasCompleted >= 6}    label="6 Internal Assessments completed"            detail={`${iasCompleted} / 6 done`} />
            <RequirementRow met={allSkillsCovered}     label="Min 1 IA per skill"                          detail={SKILL_ORDER.map(s => `${SKILL_LABELS[s]}: ${iasPerSkill[s]}`).join(" · ")} />
            <RequirementRow met={bandImproved}         label="≥ 0.5 band improvement on any skill"         detail={bandImproved ? `Best: +${bestBandImprovement.toFixed(1)}` : "Not yet achieved"} />
            <RequirementRow met={monthUsed.standard < 1} label="Monthly slot available"                   detail={monthUsed.standard >= 1 ? "Used this month — resets next calendar month" : "Available"} />
          </div>

          {monthUsed.standard >= 1 && (
            <div style={{
              background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.2)',
              borderRadius: '12px', padding: '14px 16px', marginBottom: '20px',
              display: 'flex', gap: '10px', alignItems: 'flex-start',
            }}>
              <Calendar style={{ width: '16px', height: '16px', color: '#f59e0b', marginTop: '2px', flexShrink: 0 }} />
              <p style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '0.68rem', color: '#fde68a', lineHeight: 1.6 }}>
                Standard mock used this month.{" "}
                {eligibility.canTakeExchange
                  ? "You can still take an exchange mock below."
                  : "Come back next month or earn 1500 Momentum for an extra slot."}
              </p>
            </div>
          )}

          {/* Exchange path */}
          <div style={{
            background: 'rgba(139,92,246,0.06)', border: '1px solid rgba(139,92,246,0.2)',
            borderRadius: '14px', padding: '20px',
          }}>
            <div style={{ display: 'flex', gap: '10px', marginBottom: '14px' }}>
              <Zap style={{ width: '18px', height: '18px', color: '#a855f7', filter: 'drop-shadow(0 0 8px #a855f7)', flexShrink: 0 }} />
              <div>
                <h3 style={{ fontFamily: "'JetBrains Mono', monospace", fontWeight: 700, fontSize: '0.72rem', letterSpacing: '0.1em', color: '#c084fc', marginBottom: '4px' }}>
                  MOMENTUM_EXCHANGE :: ALTERNATE PATH
                </h3>
                <p style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '0.62rem', color: 'rgba(255,255,255,0.35)', lineHeight: 1.6 }}>
                  Spend 1500 Momentum points for an extra mock. Requires min 4 IAs, 14 days on platform, and band improvement shown.
                </p>
              </div>
            </div>
            <RequirementRow met={iasCompleted >= 4}      label="Min 4 IAs completed"     detail={`${iasCompleted} / 4`}              compact />
            <RequirementRow met={totalMomentum >= 1500}  label="1500 Momentum pts"       detail={`${totalMomentum} pts`}             compact />
            <RequirementRow met={daysOnPlatform >= 14}   label="14 days on platform"     detail={`${daysOnPlatform} days`}           compact />
            <RequirementRow met={bandImproved}            label="Band improvement ≥ 0.5" detail=""                                   compact />
            <RequirementRow met={monthUsed.exchange < 1} label="Exchange slot available" detail={monthUsed.exchange >= 1 ? "Used this month" : "Available"} compact />
          </div>

          <button onClick={() => navigate('/student/dashboard')} style={{
            width: '100%', marginTop: '24px', padding: '14px',
            background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: '12px', cursor: 'pointer',
            fontFamily: "'JetBrains Mono', monospace", fontWeight: 700,
            fontSize: '0.72rem', letterSpacing: '0.15em', color: 'rgba(255,255,255,0.4)',
            transition: 'all 0.2s',
          }}
          onMouseOver={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.7)')}
          onMouseOut={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.4)')}>
            ← BACK TO DASHBOARD
          </button>
        </GlassCard>
      </div>
    );
  };

  const renderGate = () => {
    if (!eligibility) return null;
    const monthUsed = readMockUsageThisMonth();

    return (
      <div className="tc-fade-in" style={{ maxWidth: '860px', margin: '0 auto', padding: '48px 16px' }}>
        <GlassCard glow="cyan" style={{ padding: '48px', textAlign: 'center' }}>

          {/* Badge */}
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: '8px',
            padding: '6px 14px', borderRadius: '100px',
            background: 'rgba(244,63,94,0.1)', border: '1px solid rgba(244,63,94,0.3)',
            marginBottom: '32px',
          }}>
            <AlertCircle style={{ width: '14px', height: '14px', color: '#f43f5e' }} />
            <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '0.62rem', letterSpacing: '0.15em', color: '#f43f5e', fontWeight: 700 }}>
              FULL OFFICIAL MOCK EXAM
            </span>
          </div>

          <h1 style={{
            fontFamily: "'JetBrains Mono', monospace",
            fontWeight: 900, fontSize: 'clamp(1.8rem, 4vw, 3rem)',
            letterSpacing: '0.05em', marginBottom: '20px',
            lineHeight: 1.1,
          }}>
            <span style={{ color: '#e2e8f0' }}>READY FOR THE </span>
            <span style={{
              background: 'linear-gradient(135deg, #00f0ff, #a855f7)',
              WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
            }}>REAL DEAL?</span>
          </h1>

          <p style={{
            fontFamily: "'JetBrains Mono', monospace", fontSize: '0.78rem',
            color: 'rgba(255,255,255,0.45)', lineHeight: 1.8,
            maxWidth: '520px', margin: '0 auto 40px',
          }}>
            Full-length, strict-timed IELTS simulation. Set aside{' '}
            <span style={{ color: '#00f0ff' }}>2 hours and 45 minutes</span>{' '}
            in a quiet environment. Timers cannot be paused once started.
          </p>

          {/* Skill cards */}
          <div style={{
            display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px', marginBottom: '40px',
          }}>
            {SKILL_ORDER.map((s, i) => (
              <div key={s} style={{
                background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(0,240,255,0.12)',
                borderRadius: '14px', padding: '20px 12px',
                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px',
                transition: 'all 0.3s',
              }}>
                <span style={{ fontSize: '1.8rem' }}>{SKILL_ICONS[s]}</span>
                <span style={{ fontFamily: "'JetBrains Mono', monospace", fontWeight: 700, fontSize: '0.6rem', letterSpacing: '0.15em', color: '#00f0ff' }}>
                  {SKILL_LABELS[s].toUpperCase()}
                </span>
                <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '0.55rem', color: 'rgba(255,255,255,0.3)' }}>
                  {s === 'listening' ? '40 Qs / 30m' : s === 'reading' ? '40 Qs / 60m' : s === 'writing' ? '2 Tasks / 60m' : '3 Parts / 14m'}
                </span>
              </div>
            ))}
          </div>

          {monthUsed.standard >= 1 && eligibility.canTakeExchange && (
            <div style={{
              background: 'rgba(245,158,11,0.06)', border: '1px solid rgba(245,158,11,0.2)',
              borderRadius: '12px', padding: '14px 18px', marginBottom: '24px', textAlign: 'left',
              display: 'flex', gap: '10px',
            }}>
              <Calendar style={{ width: '16px', height: '16px', color: '#f59e0b', flexShrink: 0, marginTop: '2px' }} />
              <p style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '0.68rem', color: '#fde68a', lineHeight: 1.6 }}>
                Standard mock used this month. You're taking an exchange mock (−1500 pts from Momentum).
              </p>
            </div>
          )}

          {/* Action buttons */}
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
            <button onClick={() => navigate(-1)} style={{
              padding: '14px 28px', borderRadius: '12px', cursor: 'pointer',
              background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)',
              fontFamily: "'JetBrains Mono', monospace", fontWeight: 700,
              fontSize: '0.72rem', letterSpacing: '0.12em', color: 'rgba(255,255,255,0.4)',
              transition: 'all 0.2s',
            }}
            onMouseOver={e => (e.currentTarget.style.borderColor = 'rgba(255,255,255,0.25)')}
            onMouseOut={e => (e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)')}>
              EXIT
            </button>

            {eligibility.canTakeStandard && (
              <button onClick={() => beginMock("standard")} className="tc-glow-btn" style={{
                padding: '14px 36px', borderRadius: '12px', cursor: 'pointer',
                background: 'linear-gradient(135deg, rgba(0,240,255,0.15), rgba(139,92,246,0.15))',
                border: '1px solid rgba(0,240,255,0.4)',
                fontFamily: "'JetBrains Mono', monospace", fontWeight: 800,
                fontSize: '0.78rem', letterSpacing: '0.12em', color: '#00f0ff',
                boxShadow: '0 0 30px rgba(0,240,255,0.15)',
                transition: 'all 0.2s', minWidth: '180px',
              }}>
                INITIATE EXAM →
              </button>
            )}

            {!eligibility.canTakeStandard && eligibility.canTakeExchange && (
              <button onClick={() => beginMock("exchange")} className="tc-glow-btn-amber" style={{
                padding: '14px 36px', borderRadius: '12px', cursor: 'pointer',
                background: 'linear-gradient(135deg, rgba(245,158,11,0.15), rgba(239,68,68,0.1))',
                border: '1px solid rgba(245,158,11,0.4)',
                fontFamily: "'JetBrains Mono', monospace", fontWeight: 800,
                fontSize: '0.78rem', letterSpacing: '0.1em', color: '#fbbf24',
                boxShadow: '0 0 30px rgba(245,158,11,0.1)',
                transition: 'all 0.2s', display: 'flex', alignItems: 'center', gap: '8px',
              }}>
                <Zap style={{ width: '16px', height: '16px', fill: '#fbbf24' }} />
                EXCHANGE MOCK (−1500 PTS)
              </button>
            )}
          </div>
        </GlassCard>
      </div>
    );
  };

  const renderInterim = () => {
    const nextSkill = SKILL_ORDER[skillIdx + 1];
    return (
      <div className="tc-fade-in" style={{ minHeight: '70vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '48px 16px' }}>
        <GlassCard glow="emerald" style={{ maxWidth: '500px', width: '100%', padding: '48px', textAlign: 'center' }}>
          <div style={{
            width: '72px', height: '72px', borderRadius: '50%',
            background: 'rgba(52,211,153,0.1)', border: '1px solid rgba(52,211,153,0.4)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 24px',
            boxShadow: '0 0 40px rgba(52,211,153,0.15)',
          }}>
            <CheckCircle2 style={{ width: '36px', height: '36px', color: '#34d399', filter: 'drop-shadow(0 0 8px #34d399)' }} />
          </div>

          <p style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '0.6rem', color: 'rgba(52,211,153,0.7)', letterSpacing: '0.2em', marginBottom: '8px' }}>
            SECTION_COMPLETE
          </p>
          <h2 style={{
            fontFamily: "'JetBrains Mono', monospace", fontWeight: 800,
            fontSize: '1.8rem', letterSpacing: '0.08em', color: '#e2e8f0', marginBottom: '8px',
          }}>
            {SKILL_LABELS[activeSkill].toUpperCase()}
          </h2>
          <p style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '0.72rem', color: 'rgba(255,255,255,0.35)', marginBottom: '36px', lineHeight: 1.6 }}>
            Section recorded. Take a short break before the next module.
          </p>

          <div style={{
            background: 'rgba(0,240,255,0.04)', border: '1px solid rgba(0,240,255,0.15)',
            borderRadius: '14px', padding: '24px', marginBottom: '32px', textAlign: 'left',
          }}>
            <p style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '0.55rem', color: 'rgba(0,240,255,0.5)', letterSpacing: '0.15em', marginBottom: '12px' }}>
              // NEXT_MODULE
            </p>
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
              <span style={{ fontSize: '2rem' }}>{SKILL_ICONS[nextSkill]}</span>
              <div>
                <h3 style={{ fontFamily: "'JetBrains Mono', monospace", fontWeight: 700, fontSize: '1.3rem', color: '#00f0ff', letterSpacing: '0.08em' }}>
                  {SKILL_LABELS[nextSkill].toUpperCase()}
                </h3>
                <p style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '0.62rem', color: 'rgba(255,255,255,0.35)', marginTop: '4px' }}>
                  TIMER :: {SKILL_DURATIONS[nextSkill] / 60}:00 MINUTES
                </p>
              </div>
            </div>
          </div>

          <button onClick={advanceToNextSkill} className="tc-glow-btn" style={{
            width: '100%', padding: '16px', borderRadius: '12px', cursor: 'pointer',
            background: 'linear-gradient(135deg, rgba(0,240,255,0.12), rgba(139,92,246,0.12))',
            border: '1px solid rgba(0,240,255,0.35)',
            fontFamily: "'JetBrains Mono', monospace", fontWeight: 800,
            fontSize: '0.78rem', letterSpacing: '0.15em', color: '#00f0ff',
            boxShadow: '0 0 30px rgba(0,240,255,0.1)',
          }}>
            BEGIN {SKILL_LABELS[nextSkill].toUpperCase()} →
          </button>
        </GlassCard>
      </div>
    );
  };

  const renderScoring = () => (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '70vh' }} className="tc-fade-in">
      {/* Orbital spinner */}
      <div style={{ position: 'relative', width: '100px', height: '100px', marginBottom: '32px' }}>
        <div style={{
          position: 'absolute', inset: 0, borderRadius: '50%',
          border: '2px solid transparent',
          borderTop: '2px solid #00f0ff',
          borderRight: '2px solid rgba(0,240,255,0.2)',
          animation: 'spin 1s linear infinite',
          boxShadow: '0 0 30px rgba(0,240,255,0.25)',
        }} />
        <div style={{
          position: 'absolute', inset: '12px', borderRadius: '50%',
          border: '2px solid transparent',
          borderBottom: '2px solid #a855f7',
          borderLeft: '2px solid rgba(168,85,247,0.2)',
          animation: 'spin 1.5s linear infinite reverse',
          boxShadow: '0 0 20px rgba(168,85,247,0.2)',
        }} />
        <span style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2rem' }}>🧠</span>
      </div>
      <h2 style={{
        fontFamily: "'JetBrains Mono', monospace", fontWeight: 800,
        fontSize: '1.6rem', letterSpacing: '0.1em', color: '#e2e8f0', marginBottom: '12px',
      }}>COMPILING FINAL REPORT</h2>
      <p style={{
        fontFamily: "'JetBrains Mono', monospace", fontSize: '0.72rem',
        color: 'rgba(255,255,255,0.35)', textAlign: 'center', maxWidth: '380px', lineHeight: 1.8,
      }}>
        Neural evaluation in progress. Scoring 40 responses + essays + audio recordings.
      </p>
      <div style={{ marginTop: '24px', display: 'flex', gap: '6px' }}>
        {[0,1,2,3,4].map(i => (
          <div key={i} style={{
            width: '8px', height: '8px', borderRadius: '50%',
            background: '#00f0ff', boxShadow: '0 0 8px #00f0ff',
            animation: `pulse 1.2s ease-in-out ${i * 0.15}s infinite`,
          }} />
        ))}
      </div>
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
      <div className="tc-fade-in" style={{ maxWidth: '1100px', margin: '0 auto', padding: '32px 16px 96px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '32px', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <p style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '0.6rem', color: 'rgba(0,240,255,0.5)', letterSpacing: '0.15em', marginBottom: '4px' }}>
              // ASSESSMENT_COMPLETE
            </p>
            <h2 style={{ fontFamily: "'JetBrains Mono', monospace", fontWeight: 800, fontSize: 'clamp(1.4rem, 3vw, 2rem)', letterSpacing: '0.06em', color: '#e2e8f0' }}>
              OFFICIAL MOCK RESULTS
            </h2>
          </div>
          <button onClick={() => { localStorage.removeItem(STORAGE_KEY); navigate('/student/dashboard'); }} style={{
            padding: '12px 24px', borderRadius: '10px', cursor: 'pointer',
            background: 'rgba(0,240,255,0.06)', border: '1px solid rgba(0,240,255,0.2)',
            fontFamily: "'JetBrains Mono', monospace", fontWeight: 700,
            fontSize: '0.65rem', letterSpacing: '0.12em', color: '#00f0ff',
          }}>
            DASHBOARD →
          </button>
        </div>

        {/* Overall band hero */}
        <GlassCard glow="violet" style={{
          padding: '48px', textAlign: 'center', marginBottom: '12px', position: 'relative', overflow: 'hidden',
        }}>
          <div style={{
            position: 'absolute', top: '-60px', right: '-60px',
            fontSize: '200px', opacity: 0.04, pointerEvents: 'none', lineHeight: 1,
          }}>🏆</div>
          {/* Scan line effect */}
          <div style={{
            position: 'absolute', inset: 0, background: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,240,255,0.015) 2px, rgba(0,240,255,0.015) 4px)',
            pointerEvents: 'none', borderRadius: '16px',
          }} />
          <p style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '0.6rem', color: 'rgba(0,240,255,0.5)', letterSpacing: '0.2em', marginBottom: '4px' }}>
            COMPOSITE_REAL_BAND
          </p>
          <p style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '0.55rem', color: 'rgba(255,255,255,0.25)', letterSpacing: '0.12em', marginBottom: '20px' }}>
            MOCK × 0.60 + LAST_IA × 0.40
          </p>
          <div style={{
            fontFamily: "'JetBrains Mono', monospace", fontWeight: 900,
            fontSize: 'clamp(5rem, 12vw, 8rem)', lineHeight: 1,
            background: 'linear-gradient(135deg, #00f0ff 0%, #a855f7 60%, #f43f5e 100%)',
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
            filter: 'drop-shadow(0 0 40px rgba(0,240,255,0.3))',
          }}>
            {overallReal.toFixed(1)}
          </div>
          {overallImproved && (
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: '8px', marginTop: '20px',
              background: 'rgba(52,211,153,0.08)', border: '1px solid rgba(52,211,153,0.25)',
              padding: '8px 18px', borderRadius: '100px',
            }}>
              <Trophy style={{ width: '14px', height: '14px', color: '#34d399' }} />
              <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '0.65rem', color: '#34d399', letterSpacing: '0.1em' }}>
                NEW BAND THRESHOLD CROSSED · +500 MOMENTUM
              </span>
            </div>
          )}
        </GlassCard>

        {/* Diagnostic vs today */}
        <div style={{
          background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)',
          borderRadius: '10px', padding: '12px 20px', marginBottom: '28px', textAlign: 'center',
        }}>
          <p style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '0.65rem', color: 'rgba(255,255,255,0.35)', letterSpacing: '0.06em' }}>
            BASELINE: <span style={{ color: '#94a3b8' }}>{overallDiag.toFixed(1)}</span>
            {' → '}
            TODAY: <span style={{ color: overallImproved ? '#34d399' : overallReal < overallDiag ? '#f43f5e' : '#94a3b8' }}>{overallReal.toFixed(1)}</span>
            {' '}
            {overallImproved
              ? <span style={{ color: '#34d399' }}>(+{(overallReal - overallDiag).toFixed(1)} IMPROVEMENT)</span>
              : overallReal < overallDiag
              ? <span style={{ color: '#f43f5e' }}>({(overallReal - overallDiag).toFixed(1)} VS DIAGNOSTIC)</span>
              : <span style={{ color: 'rgba(255,255,255,0.25)' }}>(MAINTAINED)</span>
            }
          </p>
        </div>

        {/* Per-skill cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px', marginBottom: '24px' }}>
          {SKILL_ORDER.map(s => {
            const diagBand = diagnosticBands[s] || 5.0;
            const mockBand = mockBands[s];
            const realBand = realBands[s];
            const lastIA   = lastIABands[s];
            const improved = realBand > diagBand;
            const dropped  = realBand < diagBand;

            return (
              <GlassCard key={s} glow={improved ? 'emerald' : dropped ? 'rose' : 'none'} style={{ padding: '28px 20px', textAlign: 'center' }}>
                <span style={{ fontSize: '2.2rem', display: 'block', marginBottom: '10px' }}>{SKILL_ICONS[s]}</span>
                <p style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '0.55rem', letterSpacing: '0.2em', color: 'rgba(0,240,255,0.5)', marginBottom: '16px' }}>
                  {SKILL_LABELS[s].toUpperCase()}
                </p>

                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', justifyContent: 'center', marginBottom: '14px' }}>
                  <div style={{ textAlign: 'center' }}>
                    <p style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '0.5rem', color: 'rgba(255,255,255,0.2)', letterSpacing: '0.1em', marginBottom: '2px' }}>
                      BASELINE
                    </p>
                    <p style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '1.3rem', fontWeight: 700, color: 'rgba(255,255,255,0.2)', textDecoration: 'line-through' }}>
                      {diagBand.toFixed(1)}
                    </p>
                  </div>
                  <ArrowRight style={{ width: '14px', height: '14px', color: 'rgba(255,255,255,0.15)', flexShrink: 0 }} />
                  <div style={{ textAlign: 'center' }}>
                    <p style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '0.5rem', color: 'rgba(255,255,255,0.2)', letterSpacing: '0.1em', marginBottom: '2px' }}>
                      REAL BAND
                    </p>
                    <p style={{
                      fontFamily: "'JetBrains Mono', monospace", fontSize: '2.4rem', fontWeight: 900, lineHeight: 1,
                      color: improved ? '#34d399' : dropped ? '#f43f5e' : '#e2e8f0',
                      filter: improved ? 'drop-shadow(0 0 12px #34d399)' : dropped ? 'drop-shadow(0 0 12px #f43f5e)' : 'none',
                    }}>
                      {realBand.toFixed(1)}
                    </p>
                  </div>
                </div>

                <div style={{
                  background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)',
                  borderRadius: '8px', padding: '8px', marginBottom: '10px',
                }}>
                  <p style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '0.55rem', color: 'rgba(255,255,255,0.25)', lineHeight: 1.8 }}>
                    MOCK: {mockBand.toFixed(1)} × 0.60 = {(mockBand * 0.6).toFixed(2)}<br />
                    IA: {lastIA !== null ? `${lastIA.toFixed(1)} × 0.40 = ${(lastIA * 0.4).toFixed(2)}` : 'NO IA — MOCK ONLY'}
                  </p>
                </div>

                <div style={{
                  display: 'inline-block', padding: '4px 10px', borderRadius: '100px', fontSize: '0.55rem',
                  fontFamily: "'JetBrains Mono', monospace", fontWeight: 700, letterSpacing: '0.1em',
                  background: improved ? 'rgba(52,211,153,0.1)' : dropped ? 'rgba(244,63,94,0.1)' : 'rgba(255,255,255,0.05)',
                  color: improved ? '#34d399' : dropped ? '#f43f5e' : 'rgba(255,255,255,0.3)',
                  border: `1px solid ${improved ? 'rgba(52,211,153,0.2)' : dropped ? 'rgba(244,63,94,0.2)' : 'rgba(255,255,255,0.08)'}`,
                }}>
                  {improved ? `+${(realBand - diagBand).toFixed(1)} IMPROVED` : dropped ? `${(realBand - diagBand).toFixed(1)} DROPPED` : 'MAINTAINED'}
                </div>
              </GlassCard>
            );
          })}
        </div>

        {/* Priority action */}
        <GlassCard glow="cyan" style={{ padding: '32px', marginBottom: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '24px' }}>
            <Target style={{ width: '18px', height: '18px', color: '#00f0ff', filter: 'drop-shadow(0 0 8px #00f0ff)' }} />
            <h3 style={{ fontFamily: "'JetBrains Mono', monospace", fontWeight: 700, fontSize: '0.75rem', letterSpacing: '0.15em', color: '#00f0ff' }}>
              PRIORITY_ACTION :: PER SKILL
            </h3>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '14px' }}>
            {SKILL_ORDER.map(s => (
              <div key={s} style={{
                background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)',
                borderRadius: '12px', padding: '18px',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
                  <span style={{ fontSize: '1.2rem' }}>{SKILL_ICONS[s]}</span>
                  <span style={{ fontFamily: "'JetBrains Mono', monospace", fontWeight: 700, fontSize: '0.62rem', letterSpacing: '0.1em', color: '#e2e8f0' }}>
                    {SKILL_LABELS[s].toUpperCase()}
                  </span>
                  <span style={{ marginLeft: 'auto', fontFamily: "'JetBrains Mono', monospace", fontWeight: 800, fontSize: '1rem', color: '#a855f7' }}>
                    {realBands[s].toFixed(1)}
                  </span>
                </div>
                <p style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '0.62rem', color: 'rgba(255,255,255,0.3)', lineHeight: 1.7 }}>
                  Focus on your weakest sub-skill in {SKILL_LABELS[s]}. Continue daily drills targeting the lowest DCS sub-skill next cycle.
                </p>
              </div>
            ))}
          </div>
        </GlassCard>

        {/* Momentum award */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: '16px',
          background: 'rgba(168,85,247,0.06)', border: '1px solid rgba(168,85,247,0.2)',
          borderRadius: '16px', padding: '24px',
          boxShadow: '0 0 40px rgba(168,85,247,0.06)',
        }}>
          <div style={{
            width: '48px', height: '48px', borderRadius: '50%', flexShrink: 0,
            background: 'rgba(245,158,11,0.15)', border: '1px solid rgba(245,158,11,0.3)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 0 20px rgba(245,158,11,0.15)',
          }}>
            <Zap style={{ width: '22px', height: '22px', color: '#fbbf24', fill: '#fbbf24' }} />
          </div>
          <div>
            <p style={{ fontFamily: "'JetBrains Mono', monospace", fontWeight: 700, fontSize: '0.85rem', color: '#e2e8f0', letterSpacing: '0.08em' }}>
              +200 MOMENTUM{overallImproved ? " · +500 BONUS" : ""} CREDITED
            </p>
            <p style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '0.62rem', color: 'rgba(255,255,255,0.3)', marginTop: '4px', lineHeight: 1.6 }}>
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
        <div style={{ minHeight: '70vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }} className="tc-fade-in">
          <div style={{
            width: '48px', height: '48px', borderRadius: '50%',
            border: '2px solid transparent', borderTop: '2px solid #00f0ff',
            animation: 'spin 0.8s linear infinite', marginBottom: '16px',
            boxShadow: '0 0 20px rgba(0,240,255,0.25)',
          }} />
          <p style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '0.65rem', letterSpacing: '0.2em', color: 'rgba(0,240,255,0.5)' }}>
            BUILDING SECTION...
          </p>
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
      <div className="tc-fade-in" style={{ maxWidth: '1400px', margin: '0 auto', padding: '24px 16px 80px' }}>

        {/* Skill progress tracker */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', marginBottom: '24px', flexWrap: 'wrap' }}>
          {SKILL_ORDER.map((s, i) => (
            <div key={s} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{
                display: 'flex', alignItems: 'center', gap: '6px',
                padding: '6px 14px', borderRadius: '100px',
                background: i < skillIdx ? 'rgba(52,211,153,0.12)' : i === skillIdx ? 'rgba(0,240,255,0.12)' : 'rgba(255,255,255,0.03)',
                border: `1px solid ${i < skillIdx ? 'rgba(52,211,153,0.4)' : i === skillIdx ? 'rgba(0,240,255,0.4)' : 'rgba(255,255,255,0.08)'}`,
                boxShadow: i === skillIdx ? '0 0 16px rgba(0,240,255,0.15)' : 'none',
                transition: 'all 0.3s',
              }}>
                {i < skillIdx
                  ? <CheckCircle2 style={{ width: '12px', height: '12px', color: '#34d399' }} />
                  : <span style={{ fontSize: '12px' }}>{SKILL_ICONS[s]}</span>
                }
                <span style={{
                  fontFamily: "'JetBrains Mono', monospace", fontWeight: 600,
                  fontSize: '0.6rem', letterSpacing: '0.1em',
                  color: i < skillIdx ? '#34d399' : i === skillIdx ? '#00f0ff' : 'rgba(255,255,255,0.2)',
                }}>
                  {SKILL_LABELS[s].toUpperCase()}
                </span>
              </div>
              {i < SKILL_ORDER.length - 1 && (
                <div style={{ width: '24px', height: '1px', background: i < skillIdx ? 'rgba(52,211,153,0.4)' : 'rgba(255,255,255,0.08)' }} />
              )}
            </div>
          ))}
        </div>

        {/* Session header */}
        <GlassCard glow="none" style={{
          display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between',
          padding: '20px 28px', marginBottom: '20px', gap: '16px',
          borderColor: 'rgba(0,240,255,0.12)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{
              width: '52px', height: '52px', borderRadius: '12px', flexShrink: 0,
              background: 'rgba(0,240,255,0.06)', border: '1px solid rgba(0,240,255,0.2)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.6rem',
            }}>
              {SKILL_ICONS[activeSkill!]}
            </div>
            <div>
              <p style={{ fontFamily: "'JetBrains Mono', monospace", fontWeight: 700, fontSize: '0.88rem', letterSpacing: '0.08em', color: '#e2e8f0' }}>
                {SKILL_LABELS[activeSkill!].toUpperCase()} MODULE
              </p>
              <p style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '0.6rem', color: 'rgba(0,240,255,0.5)', letterSpacing: '0.1em', marginTop: '3px' }}>
                {activeSkill === 'writing' ? `TASK ${currentIdx + 1} OF 2` : `Q.${currentIdx + 1} / ${totalQ}`}
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{
              display: 'flex', alignItems: 'center', gap: '12px',
              background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(0,240,255,0.12)',
              borderRadius: '12px', padding: '10px 16px',
            }}>
              <CircleTimer timeLeft={timeLeft} total={SKILL_DURATIONS[activeSkill]} size={44} />
              <div>
                <p style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '0.5rem', color: 'rgba(0,240,255,0.4)', letterSpacing: '0.12em' }}>SECTION TIME</p>
                <p style={{ fontFamily: "'JetBrains Mono', monospace", fontWeight: 800, fontSize: '1.1rem', color: '#00f0ff', letterSpacing: '0.06em' }}>
                  {formatTime(timeLeft)}
                </p>
              </div>
            </div>
            <button
              onClick={() => {
                if (window.confirm("Abort this mock test? All progress will be lost.")) {
                  localStorage.removeItem(STORAGE_KEY);
                  navigate('/student/dashboard');
                }
              }}
              style={{
                fontFamily: "'JetBrains Mono', monospace", fontSize: '0.6rem',
                fontWeight: 600, letterSpacing: '0.1em',
                color: 'rgba(255,255,255,0.2)', background: 'none', border: 'none', cursor: 'pointer',
                transition: 'color 0.2s',
              }}
              onMouseOver={e => (e.currentTarget.style.color = '#f43f5e')}
              onMouseOut={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.2)')}>
              ABORT
            </button>
          </div>
        </GlassCard>

        {/* Split view */}
        <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>

          {/* Left panel */}
          <div style={{ flex: '1 1 400px', minWidth: 0 }}>
            {activeSkill === 'listening' ? (
              <GlassCard glow="violet" style={{ padding: '40px', textAlign: 'center', minHeight: '400px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                <button
                  onClick={() => {
                    if (audioState === 'idle' && audioRef.current) {
                      audioRef.current.play();
                      setAudioState('playing');
                    }
                  }}
                  disabled={audioState !== 'idle'}
                  style={{
                    width: '88px', height: '88px', borderRadius: '50%', cursor: audioState === 'idle' ? 'pointer' : 'default',
                    background: audioState === 'idle' ? 'rgba(139,92,246,0.15)' : audioState === 'playing' ? 'rgba(245,158,11,0.15)' : 'rgba(52,211,153,0.15)',
                    border: `2px solid ${audioState === 'idle' ? 'rgba(139,92,246,0.5)' : audioState === 'playing' ? 'rgba(245,158,11,0.5)' : 'rgba(52,211,153,0.5)'}`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '24px',
                    boxShadow: `0 0 40px ${audioState === 'idle' ? 'rgba(139,92,246,0.2)' : audioState === 'playing' ? 'rgba(245,158,11,0.2)' : 'rgba(52,211,153,0.2)'}`,
                    transition: 'all 0.3s',
                  }}>
                  {audioState === 'idle'    && <PlayCircle style={{ width: '40px', height: '40px', color: '#a855f7' }} />}
                  {audioState === 'playing' && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px', height: '36px' }}>
                      {[0,1,2].map(i => (
                        <div key={i} style={{
                          width: '6px', borderRadius: '3px', background: '#f59e0b',
                          animation: `soundbar 0.8s ease-in-out ${i * 0.15}s infinite alternate`,
                          boxShadow: '0 0 8px #f59e0b',
                        }} />
                      ))}
                    </div>
                  )}
                  {audioState === 'played'  && <CheckCircle2 style={{ width: '40px', height: '40px', color: '#34d399' }} />}
                </button>
                <p style={{ fontFamily: "'JetBrains Mono', monospace", fontWeight: 700, fontSize: '0.88rem', letterSpacing: '0.1em', color: '#e2e8f0', marginBottom: '8px' }}>
                  TEST AUDIO TRACK
                </p>
                <p style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '0.65rem', color: 'rgba(255,255,255,0.35)', lineHeight: 1.7 }}>
                  {audioState === 'played' ? "Audio playback complete." : sessionData.context}
                </p>
                <audio ref={audioRef} src={sessionData.audio_url} preload="auto" onEnded={() => setAudioState('played')} />
              </GlassCard>
            ) : (
              <GlassCard glow="none" style={{ display: 'flex', flexDirection: 'column', height: '680px' }}>
                <div style={{
                  padding: '16px 20px', borderBottom: '1px solid rgba(255,255,255,0.06)',
                  background: 'rgba(0,0,0,0.2)', borderRadius: '16px 16px 0 0',
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                }}>
                  <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '0.55rem', color: 'rgba(0,240,255,0.4)', letterSpacing: '0.15em' }}>
                    {activeSkill === 'writing' ? '// TASK_CONTEXT' : activeSkill === 'speaking' ? '// INSTRUCTIONS' : `// ${passageTitle?.toUpperCase()}`}
                  </span>
                  <button onClick={() => setShowPassage(!showPassage)} style={{
                    display: 'block', fontFamily: "'JetBrains Mono', monospace", fontSize: '0.6rem',
                    color: '#00f0ff', background: 'none', border: 'none', cursor: 'pointer', letterSpacing: '0.1em',
                  }}>
                    TOGGLE
                  </button>
                </div>
                <div style={{ flex: 1, padding: '28px', overflowY: 'auto', display: showPassage ? 'block' : undefined }}>
                  <pre style={{
                    fontFamily: "'JetBrains Mono', monospace", whiteSpace: 'pre-wrap',
                    fontSize: '0.75rem', color: 'rgba(255,255,255,0.6)', lineHeight: 1.9,
                  }}>
                    {activeSkill === 'writing' ? currentQ.context : activeSkill === 'reading' ? displayPassage : ""}
                  </pre>
                </div>
              </GlassCard>
            )}
          </div>

          {/* Right panel — question + answer */}
          <div style={{ flex: '1 1 400px', minWidth: 0, height: '680px', overflowY: 'auto' }}>
            <GlassCard glow="none" style={{ padding: '32px', height: '100%', boxSizing: 'border-box' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '28px' }}>
                <span style={{
                  fontFamily: "'JetBrains Mono', monospace", fontSize: '0.6rem',
                  color: 'rgba(255,255,255,0.25)', background: 'rgba(255,255,255,0.03)',
                  border: '1px solid rgba(255,255,255,0.06)', borderRadius: '6px',
                  padding: '4px 10px', letterSpacing: '0.1em',
                }}>
                  {activeSkill === 'writing' ? currentQ.section.toUpperCase() : `Q_${currentIdx + 1}`}
                </span>
                <span style={{
                  fontFamily: "'JetBrains Mono', monospace", fontSize: '0.55rem',
                  color: '#a855f7', background: 'rgba(168,85,247,0.08)',
                  border: '1px solid rgba(168,85,247,0.2)', borderRadius: '6px',
                  padding: '4px 10px', letterSpacing: '0.1em',
                }}>
                  {currentQ.section?.toUpperCase() || "ANSWER"}
                </span>
              </div>

              {activeSkill !== 'writing' && (
                <h3 style={{
                  fontFamily: activeSkill === 'speaking' ? "'JetBrains Mono', monospace" : "Georgia, serif",
                  fontWeight: 600, fontSize: '1rem', color: '#e2e8f0',
                  lineHeight: 1.65, marginBottom: '28px',
                  fontStyle: activeSkill === 'speaking' ? 'normal' : 'normal',
                }}>
                  {activeSkill === 'speaking' ? `"${currentQ.text}"` : currentQ.text}
                </h3>
              )}

              {/* Answer area */}
              {activeSkill === 'speaking' ? (
                <div style={{
                  background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.06)',
                  borderRadius: '16px', padding: '32px', textAlign: 'center', marginBottom: '16px',
                }}>
                  {isRecording ? (
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', height: '60px', marginBottom: '24px' }}>
                        {animBars.map((h, i) => (
                          <div key={i} style={{
                            width: '5px', borderRadius: '3px',
                            background: 'linear-gradient(to top, #f43f5e, #a855f7)',
                            height: `${20 + h * 40}px`,
                            animation: `soundbar 0.6s ease-in-out ${i * 0.08}s infinite alternate`,
                            boxShadow: '0 0 6px rgba(244,63,94,0.5)',
                          }} />
                        ))}
                      </div>
                      <button
                        onClick={() => { setIsRecording(false); setRecordedPrompts(prev => ({ ...prev, [currentQ.id]: true })); }}
                        style={{
                          padding: '12px 24px', borderRadius: '10px', cursor: 'pointer',
                          background: 'rgba(244,63,94,0.1)', border: '1px solid rgba(244,63,94,0.35)',
                          fontFamily: "'JetBrains Mono', monospace", fontWeight: 700,
                          fontSize: '0.65rem', letterSpacing: '0.12em', color: '#f43f5e',
                        }}>
                        STOP RECORDING
                      </button>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                      <div style={{
                        width: '64px', height: '64px', borderRadius: '50%', marginBottom: '20px',
                        background: recordedPrompts[currentQ.id] ? 'rgba(52,211,153,0.1)' : 'rgba(0,240,255,0.08)',
                        border: `1px solid ${recordedPrompts[currentQ.id] ? 'rgba(52,211,153,0.4)' : 'rgba(0,240,255,0.3)'}`,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        boxShadow: recordedPrompts[currentQ.id] ? '0 0 20px rgba(52,211,153,0.15)' : '0 0 20px rgba(0,240,255,0.1)',
                      }}>
                        {recordedPrompts[currentQ.id]
                          ? <CheckCircle2 style={{ width: '28px', height: '28px', color: '#34d399' }} />
                          : <Mic style={{ width: '28px', height: '28px', color: '#00f0ff' }} />
                        }
                      </div>
                      <button
                        onClick={() => setIsRecording(true)}
                        style={{
                          padding: '12px 32px', borderRadius: '10px', cursor: 'pointer',
                          background: recordedPrompts[currentQ.id] ? 'rgba(255,255,255,0.04)' : 'rgba(0,240,255,0.1)',
                          border: `1px solid ${recordedPrompts[currentQ.id] ? 'rgba(255,255,255,0.12)' : 'rgba(0,240,255,0.35)'}`,
                          fontFamily: "'JetBrains Mono', monospace", fontWeight: 700,
                          fontSize: '0.65rem', letterSpacing: '0.12em',
                          color: recordedPrompts[currentQ.id] ? 'rgba(255,255,255,0.4)' : '#00f0ff',
                        }}>
                        {recordedPrompts[currentQ.id] ? 'RE-RECORD' : 'START SPEAKING'}
                      </button>
                    </div>
                  )}
                </div>
              ) : currentQ.options?.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {currentQ.options.map((opt: string) => {
                    const selected = answers[currentQ.id] === opt;
                    return (
                      <button key={opt} onClick={() => setAnswers(p => ({ ...p, [currentQ.id]: opt }))}
                        style={{
                          textAlign: 'left', padding: '16px 18px', borderRadius: '12px', cursor: 'pointer',
                          background: selected ? 'rgba(0,240,255,0.1)' : 'rgba(255,255,255,0.02)',
                          border: `1px solid ${selected ? 'rgba(0,240,255,0.45)' : 'rgba(255,255,255,0.06)'}`,
                          fontFamily: "'JetBrains Mono', monospace", fontWeight: 600,
                          fontSize: '0.72rem', color: selected ? '#00f0ff' : 'rgba(255,255,255,0.5)',
                          boxShadow: selected ? '0 0 16px rgba(0,240,255,0.08)' : 'none',
                          transition: 'all 0.2s', letterSpacing: '0.03em',
                        }}>
                        {opt}
                      </button>
                    );
                  })}
                </div>
              ) : (
                <div style={{ position: 'relative' }}>
                  <textarea
                    placeholder={activeSkill === 'writing' ? "Write your response here..." : "Type your answer..."}
                    rows={activeSkill === 'writing' ? 14 : 3}
                    value={answers[currentQ.id] || ""}
                    onChange={e => setAnswers(p => ({ ...p, [currentQ.id]: e.target.value }))}
                    style={{
                      width: '100%', padding: '18px', boxSizing: 'border-box',
                      background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.08)',
                      borderRadius: '12px', color: '#e2e8f0', resize: 'none', outline: 'none',
                      fontFamily: "'JetBrains Mono', monospace", fontSize: '0.75rem', lineHeight: 1.8,
                      transition: 'border-color 0.2s',
                    }}
                    onFocus={e => (e.target.style.borderColor = 'rgba(0,240,255,0.3)')}
                    onBlur={e => (e.target.style.borderColor = 'rgba(255,255,255,0.08)')}
                  />
                  {activeSkill === 'writing' && (
                    <div style={{
                      position: 'absolute', bottom: '14px', right: '14px',
                      padding: '4px 10px', borderRadius: '6px',
                      background: countWords(answers[currentQ.id] || "") >= currentQ.minWords ? 'rgba(52,211,153,0.15)' : 'rgba(0,0,0,0.5)',
                      border: `1px solid ${countWords(answers[currentQ.id] || "") >= currentQ.minWords ? 'rgba(52,211,153,0.3)' : 'rgba(255,255,255,0.08)'}`,
                      fontFamily: "'JetBrains Mono', monospace", fontWeight: 700,
                      fontSize: '0.55rem', letterSpacing: '0.08em',
                      color: countWords(answers[currentQ.id] || "") >= currentQ.minWords ? '#34d399' : 'rgba(255,255,255,0.3)',
                    }}>
                      {countWords(answers[currentQ.id] || "")} / {currentQ.minWords}
                    </div>
                  )}
                </div>
              )}

              {/* Nav buttons */}
              <div style={{ display: 'flex', gap: '10px', marginTop: '28px' }}>
                <button onClick={() => setCurrentIdx(i => i - 1)} disabled={currentIdx === 0}
                  style={{
                    padding: '14px 20px', borderRadius: '10px', cursor: currentIdx === 0 ? 'not-allowed' : 'pointer',
                    background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.08)',
                    fontFamily: "'JetBrains Mono', monospace", fontWeight: 700,
                    fontSize: '0.65rem', letterSpacing: '0.1em', color: 'rgba(255,255,255,0.25)',
                    opacity: currentIdx === 0 ? 0.3 : 1, transition: 'all 0.2s',
                  }}>
                  ← PREV
                </button>
                <button
                  onClick={handleNextQuestion}
                  disabled={!canProceed || (activeSkill === 'speaking' && isRecording)}
                  style={{
                    flex: 1, padding: '14px', borderRadius: '10px',
                    cursor: !canProceed ? 'not-allowed' : 'pointer',
                    background: !canProceed ? 'rgba(255,255,255,0.02)' : 'linear-gradient(135deg, rgba(0,240,255,0.12), rgba(139,92,246,0.12))',
                    border: `1px solid ${!canProceed ? 'rgba(255,255,255,0.06)' : 'rgba(0,240,255,0.35)'}`,
                    fontFamily: "'JetBrains Mono', monospace", fontWeight: 800,
                    fontSize: '0.72rem', letterSpacing: '0.12em',
                    color: !canProceed ? 'rgba(255,255,255,0.2)' : '#00f0ff',
                    boxShadow: canProceed ? '0 0 20px rgba(0,240,255,0.08)' : 'none',
                    transition: 'all 0.2s',
                  }}>
                  {currentIdx === totalQ - 1 ? 'COMPLETE SECTION →' : 'NEXT →'}
                </button>
              </div>
            </GlassCard>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div style={{ minHeight: '100vh', background: '#050816', color: '#e2e8f0', fontFamily: 'Georgia, serif' }}>
      <TopNavBar />

      {/* Background: layered nebula + grid */}
      <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0 }}>
        {/* Deep radial nebula */}
        <div style={{
          position: 'absolute', inset: 0,
          background: 'radial-gradient(ellipse 80% 60% at 20% 20%, rgba(0,60,90,0.5) 0%, transparent 60%), radial-gradient(ellipse 60% 80% at 80% 80%, rgba(60,0,90,0.4) 0%, transparent 60%), radial-gradient(ellipse 50% 40% at 50% 50%, rgba(0,0,40,0.8) 0%, transparent 100%)',
        }} />
        {/* Dot grid */}
        <div style={{
          position: 'absolute', inset: 0,
          backgroundImage: 'radial-gradient(circle, rgba(0,240,255,0.06) 1px, transparent 1px)',
          backgroundSize: '32px 32px',
        }} />
        {/* Horizontal scan lines */}
        <div style={{
          position: 'absolute', inset: 0,
          background: 'repeating-linear-gradient(0deg, transparent, transparent 3px, rgba(0,240,255,0.008) 3px, rgba(0,240,255,0.008) 4px)',
        }} />
      </div>

      <div style={{ position: 'relative', zIndex: 10, paddingTop: '64px' }}>
        {phase === "checking"  && (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
            <div style={{
              width: '48px', height: '48px', borderRadius: '50%',
              border: '2px solid rgba(0,240,255,0.2)', borderTop: '2px solid #00f0ff',
              animation: 'spin 0.8s linear infinite',
              boxShadow: '0 0 20px rgba(0,240,255,0.3)',
            }} />
          </div>
        )}
        {phase === "locked"   && renderLocked()}
        {phase === "gate"     && renderGate()}
        {phase === "session"  && renderSession()}
        {phase === "interim"  && renderInterim()}
        {phase === "scoring"  && renderScoring()}
        {phase === "results"  && renderResults()}
      </div>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;600;700;800;900&display=swap');

        * { box-sizing: border-box; }

        @keyframes spin {
          from { transform: rotate(0deg); }
          to   { transform: rotate(360deg); }
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50%       { opacity: 0.4; transform: scale(0.7); }
        }
        @keyframes soundbar {
          from { transform: scaleY(0.4); }
          to   { transform: scaleY(1); }
        }
        @keyframes fade-in-up {
          from { opacity: 0; transform: translateY(16px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes glow-pulse {
          0%, 100% { box-shadow: 0 0 30px rgba(0,240,255,0.15); }
          50%       { box-shadow: 0 0 50px rgba(0,240,255,0.3); }
        }

        .tc-fade-in {
          animation: fade-in-up 0.45s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }

        .tc-glow-btn:hover {
          box-shadow: 0 0 40px rgba(0,240,255,0.25) !important;
          transform: translateY(-2px);
        }
        .tc-glow-btn:active {
          transform: translateY(0);
        }
        .tc-glow-btn-amber:hover {
          box-shadow: 0 0 40px rgba(245,158,11,0.2) !important;
          transform: translateY(-2px);
        }

        /* Scrollbar */
        ::-webkit-scrollbar { width: 6px; }
        ::-webkit-scrollbar-track { background: rgba(0,0,0,0.2); }
        ::-webkit-scrollbar-thumb {
          background: rgba(0,240,255,0.2);
          border-radius: 3px;
        }
        ::-webkit-scrollbar-thumb:hover {
          background: rgba(0,240,255,0.4);
        }

        textarea::placeholder {
          font-family: 'JetBrains Mono', monospace !important;
          color: rgba(255,255,255,0.2) !important;
        }
      `}</style>
    </div>
  );
}